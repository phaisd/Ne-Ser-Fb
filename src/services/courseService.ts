import { Course, TimetableItem } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';

// ----------------- COURSES -----------------

export async function getCourses(): Promise<Course[]> {
  const localList = readLocalJson<Course[]>('courses.json', []);
  const localMap = new Map<string, Course>();
  localList.forEach((c) => {
    localMap.set(`${c.courseCode}_${c.section || '1'}`, c);
    if (!localMap.has(c.courseCode)) localMap.set(c.courseCode, c);
  });

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Courses!A2:L');
      if (rows && rows.length > 0) {
        const seen = new Set<string>();
        const uniqueCourses: Course[] = [];

        for (const r of rows) {
          const code = (r[0] || '').trim();
          if (!code) continue;
          const sec = (r[4] || '1').trim();
          const term = (r[5] || '').trim();
          const dedupKey = `${code}_${sec}_${term}`;
          if (seen.has(dedupKey)) continue;
          seen.add(dedupKey);

          const local = localMap.get(`${code}_${sec}`) || localMap.get(code);
          const isEn = sec === 'EN' || (r[2] && r[2] === r[1]) || /^[A-Za-z0-9\s:,-]+$/.test(r[1] || '');

          uniqueCourses.push({
            id: local?.id || `crs-${code}-${sec}-${uniqueCourses.length}`,
            courseCode: code,
            courseName: r[1] || '',
            courseNameEn: r[2] || '',
            credits: r[3] ? parseInt(r[3], 10) : (local?.credits || 3),
            section: sec,
            term: r[5] || '',
            academicYear: r[6] || local?.academicYear || '2569',
            semester: r[7] ? parseInt(r[7], 10) : (local?.semester || 1),
            room: r[8] || local?.room || '',
            dayOfWeek: r[9] ? parseInt(r[9], 10) : (local?.dayOfWeek || 1),
            startTime: r[10] || local?.startTime || '',
            endTime: r[11] || local?.endTime || '',
            programType: local?.programType || (isEn ? 'ENGLISH' : 'THAI'),
            degreeLevel: local?.degreeLevel || 'ปริญญาตรี',
            instructor: local?.instructor || '',
            major: local?.major || '',
            yearLevel: local?.yearLevel || 1,
            description: local?.description || '',
          });
        }
        return uniqueCourses;
      }
    } catch (err) {
      console.warn('Google Sheets read error for Courses, falling back to local file:', err);
    }
  }

  const seenLocal = new Set<string>();
  return localList.filter((c) => {
    const key = c.id || `${c.courseCode}_${c.section || '1'}_${c.term || ''}`;
    if (seenLocal.has(key)) return false;
    seenLocal.add(key);
    return true;
  });
}

export async function createCourse(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
  const localList = readLocalJson<Course[]>('courses.json', []);
  const now = new Date().toISOString();
  const newCourse: Course = {
    ...data,
    id: 'crs-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    credits: Number(data.credits) || 3,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  localList.unshift(newCourse);
  writeLocalJson('courses.json', localList);

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await gClient.appendValues('Courses!A:L', [[
        newCourse.courseCode,
        newCourse.courseName,
        newCourse.courseNameEn || '',
        String(newCourse.credits || 3),
        newCourse.section || '1',
        newCourse.term || `${newCourse.semester || 1}/${newCourse.academicYear || '2569'}`,
        newCourse.academicYear || '2569',
        String(newCourse.semester || 1),
        newCourse.room || '',
        String(newCourse.dayOfWeek || 1),
        newCourse.startTime || '',
        newCourse.endTime || '',
      ]]);
    } catch (err) {
      console.warn('Google Sheets append course failed:', err);
    }
  }

  return newCourse;
}

export async function updateCourse(idOrCode: string, updates: Partial<Course>): Promise<Course | null> {
  const localList = readLocalJson<Course[]>('courses.json', []);
  const idx = localList.findIndex((c) => c.id === idOrCode || c.courseCode === idOrCode);
  if (idx === -1) return null;

  const current = localList[idx];
  const updated: Course = {
    ...current,
    ...updates,
    credits: updates.credits !== undefined ? Number(updates.credits) : current.credits,
    updatedAt: new Date().toISOString(),
  };

  localList[idx] = updated;
  writeLocalJson('courses.json', localList);

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Courses!A2:A');
      if (rows && rows.length > 0) {
        const rowIndex = rows.findIndex((r) => r[0] === current.courseCode);
        if (rowIndex !== -1) {
          const sheetRowNum = rowIndex + 2;
          await gClient.updateValues(`Courses!A${sheetRowNum}:L${sheetRowNum}`, [[
            updated.courseCode,
            updated.courseName,
            updated.courseNameEn || '',
            String(updated.credits || 3),
            updated.section || '1',
            updated.term || `${updated.semester || 1}/${updated.academicYear || '2569'}`,
            updated.academicYear || '2569',
            String(updated.semester || 1),
            updated.room || '',
            String(updated.dayOfWeek || 1),
            updated.startTime || '',
            updated.endTime || '',
          ]]);
        }
      }
    } catch (err) {
      console.warn('Google Sheets update course failed:', err);
    }
  }

  return updated;
}

export async function deleteCourse(idOrCode: string): Promise<boolean> {
  const localList = readLocalJson<Course[]>('courses.json', []);
  const initialLen = localList.length;
  const filtered = localList.filter((c) => c.id !== idOrCode && c.courseCode !== idOrCode);
  if (filtered.length === initialLen) return false;

  writeLocalJson('courses.json', filtered);
  return true;
}

export async function importCoursesBatch(
  newCourses: Partial<Course>[],
  mode: 'APPEND' | 'UPSERT' = 'UPSERT'
): Promise<{ added: number; updated: number; total: number }> {
  const localList = readLocalJson<Course[]>('courses.json', []);
  const now = new Date().toISOString();
  let added = 0;
  let updated = 0;

  for (const item of newCourses) {
    if (!item.courseCode || !item.courseName) continue;
    const cleanCode = item.courseCode.trim();
    const cleanSec = (item.section || '1').trim();

    const existingIdx = mode === 'UPSERT' 
      ? localList.findIndex((c) => c.courseCode === cleanCode && (c.section || '1') === cleanSec)
      : -1;

    const courseObj: Course = {
      id: existingIdx !== -1 && localList[existingIdx].id ? localList[existingIdx].id : 'crs-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      courseCode: cleanCode,
      courseName: item.courseName.trim(),
      courseNameEn: item.courseNameEn?.trim() || '',
      credits: Number(item.credits) || 3,
      programType: item.programType === 'ENGLISH' || cleanSec === 'EN' ? 'ENGLISH' : 'THAI',
      degreeLevel: item.degreeLevel || 'ปริญญาตรี',
      faculty: item.faculty || 'คณะพุทธศาสตร์',
      department: item.department || '',
      major: item.major || 'พระพุทธศาสนา',
      yearLevel: Number(item.yearLevel) || 1,
      section: cleanSec,
      term: item.term || `${item.semester || 1}/${item.academicYear || '2569'}`,
      academicYear: item.academicYear || '2569',
      semester: Number(item.semester) || 1,
      room: item.room || '',
      dayOfWeek: Number(item.dayOfWeek) || 1,
      startTime: item.startTime || '09.00',
      endTime: item.endTime || '11.30',
      instructor: item.instructor || '',
      description: item.description || '',
      isActive: true,
      createdAt: existingIdx !== -1 && localList[existingIdx].createdAt ? localList[existingIdx].createdAt : now,
      updatedAt: now,
    };

    if (existingIdx !== -1) {
      localList[existingIdx] = { ...localList[existingIdx], ...courseObj };
      updated++;
    } else {
      localList.push(courseObj);
      added++;
    }
  }

  writeLocalJson('courses.json', localList);

  // Sync to Google Sheets if available
  const gClient = getSheetsClient();
  if (gClient && added > 0) {
    try {
      const rowsToAppend = localList.slice(-added).map((c) => [
        c.courseCode,
        c.courseName,
        c.courseNameEn || '',
        String(c.credits || 3),
        c.section || '1',
        c.term || `${c.semester || 1}/${c.academicYear || '2569'}`,
        c.academicYear || '2569',
        String(c.semester || 1),
        c.room || '',
        String(c.dayOfWeek || 1),
        c.startTime || '',
        c.endTime || '',
      ]);
      await gClient.appendValues('Courses!A:L', rowsToAppend);
    } catch (err) {
      console.warn('Google Sheets append batch failed:', err);
    }
  }

  return { added, updated, total: localList.length };
}

// ----------------- TIMETABLES -----------------

export async function getTimetables(): Promise<TimetableItem[]> {
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Timetables!A2:L');
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          academicYear: r[0] || '',
          semester: r[1] ? parseInt(r[1], 10) : 1,
          yearLevel: r[2] ? parseInt(r[2], 10) : 1,
          timetableTitle: r[3] || '',
          courseCode: r[4] || '',
          courseName: r[5] || '',
          dayOfWeek: r[6] ? parseInt(r[6], 10) : 1,
          startTime: r[7] || '',
          endTime: r[8] || '',
          room: r[9] || '',
          instructor: r[10] || '',
          periodLabel: r[11] || '',
        }));
      }
    } catch (err) {
      console.warn('Google Sheets read error for Timetables, falling back to local file:', err);
    }
  }

  const rawTimetables = readLocalJson<any[]>('timetables.json', []);
  const flattened: TimetableItem[] = [];
  for (const t of rawTimetables) {
    const schedules = Array.isArray(t.scheduleData) ? t.scheduleData : [];
    for (const s of schedules) {
      flattened.push({
        academicYear: t.academicYear || '2569',
        semester: t.semester || 1,
        yearLevel: t.yearLevel || 1,
        timetableTitle: t.titleTh || '',
        courseCode: s.courseCode || '',
        courseName: s.courseName || '',
        dayOfWeek: typeof s.dayOfWeek === 'number' ? s.dayOfWeek : 1,
        startTime: s.startTime || '',
        endTime: s.endTime || '',
        room: s.room || t.room || '',
        instructor: s.instructor || '',
        periodLabel: s.periodLabel || '',
      });
    }
  }
  return flattened;
}

export async function getInstructors(): Promise<string[]> {
  const [timetables, courses] = await Promise.all([getTimetables(), getCourses()]);
  const set = new Set<string>();
  for (const t of timetables) {
    if (t.instructor) {
      // Split multiple teachers if separated by / or *
      t.instructor.split('/').forEach((inst) => {
        const clean = inst.replace(/\*/g, '').trim();
        if (clean) set.add(clean);
      });
    }
  }
  for (const c of courses) {
    if (c.instructor) {
      c.instructor.split('/').forEach((inst) => {
        const clean = inst.replace(/\*/g, '').trim();
        if (clean) set.add(clean);
      });
    }
  }
  return Array.from(set).sort();
}
