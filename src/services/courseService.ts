import { Course, TimetableItem } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';

// ----------------- COURSES -----------------

export async function getCourses(): Promise<Course[]> {
  const norm = (s?: string) => String(s || '').replace(/\s+/g, '').toUpperCase();
  const localList = readLocalJson<Course[]>('courses.json', []);
  const localMap = new Map<string, Course>();
  localList.forEach((c) => {
    localMap.set(`${c.courseCode}_${c.section || '1'}`, c);
    localMap.set(`${norm(c.courseCode)}_${c.section || '1'}`, c);
    if (!localMap.has(c.courseCode)) localMap.set(c.courseCode, c);
    if (!localMap.has(norm(c.courseCode))) localMap.set(norm(c.courseCode), c);
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

          const local =
            localMap.get(`${code}_${sec}`) ||
            localMap.get(code) ||
            localMap.get(`${norm(code)}_${sec}`) ||
            localMap.get(norm(code));
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
    const key = `${c.courseCode || ''}_${c.section || '1'}_${c.academicYear || ''}_${c.semester || ''}_${c.programType || ''}`;
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
  const norm = (s?: string) => String(s || '').replace(/\s+/g, '').toUpperCase();

  const cleanId = String(idOrCode || '').trim();
  const targetCode = String(updates.courseCode || '').trim();
  const targetSec = String(updates.section || '').trim();
  const targetName = String(updates.courseName || '').trim();

  // 1. Exact ID match
  let idx = localList.findIndex((c) => c.id && c.id === cleanId);

  // 2. Match by courseCode + section
  if (idx === -1 && (targetCode || cleanId)) {
    const codeToSearch = targetCode || cleanId;
    if (targetSec) {
      idx = localList.findIndex(
        (c) => norm(c.courseCode) === norm(codeToSearch) && String(c.section || '1') === targetSec
      );
    }
    if (idx === -1) {
      idx = localList.findIndex((c) => norm(c.courseCode) === norm(codeToSearch));
    }
  }

  // 3. Match if cleanId starts with crs- and contains normalized courseCode
  if (idx === -1 && cleanId.startsWith('crs-')) {
    idx = localList.findIndex((c) => norm(cleanId).includes(norm(c.courseCode)));
  }

  // 4. Match by courseName
  if (idx === -1 && targetName) {
    idx = localList.findIndex(
      (c) => c.courseName?.trim() === targetName || (c.courseNameEn && c.courseNameEn.trim() === targetName)
    );
  }

  // 5. If not found in localList (e.g. came from Google Sheets only), create it!
  if (idx === -1) {
    const newCourse: Course = {
      id: cleanId.startsWith('crs-') ? cleanId : `crs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      courseCode: targetCode || cleanId,
      courseName: targetName || 'รายวิชาใหม่',
      credits: Number(updates.credits) || 3,
      section: targetSec || '1',
      term: updates.term || `${updates.semester || 1}/${updates.academicYear || '2569'}`,
      academicYear: updates.academicYear || '2569',
      semester: Number(updates.semester) || 1,
      room: updates.room || '',
      dayOfWeek: Number(updates.dayOfWeek) || 1,
      startTime: updates.startTime || '09.00',
      endTime: updates.endTime || '11.30',
      instructor: updates.instructor || '',
      primaryTeacherName: updates.primaryTeacherName || updates.instructor || '',
      degreeLevel: updates.degreeLevel || 'ปริญญาตรี',
      programType: updates.programType || 'THAI',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...updates,
    };
    localList.unshift(newCourse);
    writeLocalJson('courses.json', localList);
    idx = 0;
  }

  const current = localList[idx];
  const updated: Course = {
    ...current,
    ...updates,
    credits: updates.credits !== undefined ? Number(updates.credits) : current.credits,
    updatedAt: new Date().toISOString(),
  };

  localList[idx] = updated;
  writeLocalJson('courses.json', localList);

  // Cascade update to timetables.json for consistent schedule & teaching slips across the entire system
  try {
    const timetables = readLocalJson<any[]>('timetables.json', []);
    let ttChanged = false;
    const curNorm = norm(current.courseCode);
    const updNorm = norm(updated.courseCode);

    timetables.forEach((tt) => {
      if (Array.isArray(tt.scheduleData)) {
        tt.scheduleData.forEach((s: any) => {
          const sNorm = norm(s.courseCode);
          const isCodeMatch = sNorm === curNorm || sNorm === updNorm;
          const isNameMatch =
            s.courseName &&
            (s.courseName.trim() === current.courseName?.trim() ||
              s.courseName.trim() === updated.courseName?.trim());

          if (isCodeMatch || isNameMatch) {
            if (updates.instructor !== undefined) {
              s.instructor = updates.instructor;
            }
            if (updates.room !== undefined) {
              s.room = updates.room;
            }
            if (updates.dayOfWeek !== undefined) {
              s.dayOfWeek = Number(updates.dayOfWeek);
            }
            if (updates.startTime !== undefined) {
              s.startTime = updates.startTime;
            }
            if (updates.endTime !== undefined) {
              s.endTime = updates.endTime;
            }
            if (updates.courseName !== undefined) {
              s.courseName = updates.courseName;
            }
            ttChanged = true;
          }
        });
      }
    });

    if (ttChanged) {
      writeLocalJson('timetables.json', timetables);
    }
  } catch (err) {
    console.warn('Failed to cascade update to timetables:', err);
  }

  const gClient = getSheetsClient();
  if (gClient) {
    // 1. Update Courses sheet
    try {
      const rows = await gClient.getValues('Courses!A2:A');
      if (rows && rows.length > 0) {
        const curNorm = norm(current.courseCode);
        const rowIndex = rows.findIndex((r) => norm(r[0]) === curNorm);
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

    // 2. Cascade update to Timetables sheet in Google Sheets
    try {
      if (updates.instructor !== undefined || updates.room !== undefined) {
        const ttRows = await gClient.getValues('Timetables!A2:K');
        if (ttRows && ttRows.length > 0) {
          const curNorm = norm(current.courseCode);
          for (let i = 0; i < ttRows.length; i++) {
            const rCode = norm(ttRows[i][4]); // Column E is courseCode
            if (rCode === curNorm) {
              const rowNum = i + 2;
              if (updates.instructor !== undefined) {
                await gClient.updateValues(`Timetables!K${rowNum}`, [[updates.instructor]]);
              }
              if (updates.room !== undefined) {
                await gClient.updateValues(`Timetables!J${rowNum}`, [[updates.room]]);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Google Sheets update timetables failed:', err);
    }
  }

  return updated;
}

export async function deleteCourse(idOrCode: string): Promise<boolean> {
  const localList = readLocalJson<Course[]>('courses.json', []);
  const initialLen = localList.length;

  const target = localList.find((c) => c.id === idOrCode) || localList.find((c) => c.courseCode === idOrCode);
  if (!target) return false;

  const targetId = target.id;
  const targetCode = target.courseCode;

  // Filter out: prioritize matching by ID if targetId is defined, otherwise by courseCode
  const filtered = localList.filter((c) => (targetId ? c.id !== targetId : c.courseCode !== targetCode));
  if (filtered.length === initialLen) return false;

  writeLocalJson('courses.json', filtered);

  // Cascade delete from timetables if schedule item matches
  try {
    const timetables = readLocalJson<any[]>('timetables.json', []);
    let ttChanged = false;
    timetables.forEach((tt) => {
      if (Array.isArray(tt.scheduleData)) {
        const prevLen = tt.scheduleData.length;
        tt.scheduleData = tt.scheduleData.filter((s: any) => s.courseCode !== targetCode && s.id !== targetId);
        if (tt.scheduleData.length !== prevLen) {
          ttChanged = true;
          tt.updatedAt = new Date().toISOString();
        }
      }
    });
    if (ttChanged) {
      writeLocalJson('timetables.json', timetables);
    }
  } catch (err) {
    console.warn('Failed to cascade delete from timetables:', err);
  }

  // Google Sheets sync
  const gClient = getSheetsClient();
  if (gClient && targetCode) {
    try {
      const rows = await gClient.getValues('Courses!A2:A');
      if (rows && rows.length > 0) {
        const rowIndex = rows.findIndex((r) => r[0] === targetCode);
        if (rowIndex !== -1) {
          const sheetRowNum = rowIndex + 2;
          await gClient.clearValues(`Courses!A${sheetRowNum}:L${sheetRowNum}`);
        }
      }
    } catch (err) {
      console.warn('Google Sheets delete course failed:', err);
    }
  }

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

function formatTimeSlotString(val: string): string {
  const clean = String(val || '').trim();
  if (!clean) return '';
  // Normalize e.g. "9" -> "09.00", "11.3" -> "11.30", "12.3" -> "12.30", "15.1" -> "15.10", "13:00" -> "13.00"
  const norm = clean.replace(':', '.');
  if (/^\d{1,2}$/.test(norm)) {
    return `${norm.padStart(2, '0')}.00`;
  }
  const m = norm.match(/^(\d{1,2})\.(\d{1,2})$/);
  if (m) {
    return `${m[1].padStart(2, '0')}.${m[2].padEnd(2, '0')}`;
  }
  return norm;
}

export function parseTimetableMetadata(titleTh = '', titleEn = ''): {
  degreeLevel: string;
  programType: 'THAI' | 'ENGLISH';
  major: string;
} {
  const fullText = (titleTh + ' ' + titleEn).trim();

  // 1. ระดับหลักสูตร (Degree Level)
  let degreeLevel = 'ปริญญาตรี';
  if (/ดุษฎีบัณฑิต|Ph\.?D/i.test(fullText)) {
    degreeLevel = 'ปริญญาเอก';
  } else if (/มหาบัณฑิต|Master/i.test(fullText)) {
    degreeLevel = 'ปริญญาโท';
  } else if (/บัณฑิต|Bachelor/i.test(fullText)) {
    degreeLevel = 'ปริญญาตรี';
  }

  // 2. หลักสูตรภาษาไทยหรือภาษาอังกฤษ (Program Type)
  let programType: 'THAI' | 'ENGLISH' = 'THAI';
  if (/ภาษาอังกฤษ|english|inter|นานาชาติ/i.test(fullText)) {
    programType = 'ENGLISH';
  }

  // 3. สาขาวิชา (Major)
  let major = '';
  const majorMatch = titleTh.match(/สาขาวิชา([^(]+)/);
  if (majorMatch && majorMatch[1]) {
    major = majorMatch[1].trim();
  } else if (/พระพุทธศาสนา|buddhism/i.test(fullText)) {
    major = 'พระพุทธศาสนา';
  } else if (/ศาสนาและปรัชญา|philosophy/i.test(fullText)) {
    major = 'ศาสนาและปรัชญา';
  } else if (/วิปัสสนาภาวนา|meditation/i.test(fullText)) {
    major = 'วิปัสสนาภาวนา';
  } else if (/บาลี|pali/i.test(fullText)) {
    major = 'บาลีสันสกฤต';
  } else {
    major = 'ทั่วไป';
  }

  return { degreeLevel, programType, major };
}

export async function getTimetables(): Promise<TimetableItem[]> {
  const norm = (s?: string) => String(s || '').replace(/\s+/g, '').toUpperCase();
  const rawTimetables = readLocalJson<any[]>('timetables.json', []);
  const localCourses = readLocalJson<Course[]>('courses.json', []);
  const courseInstructorMap = new Map<string, string>();
  for (const c of localCourses) {
    if (c.courseCode && c.instructor) {
      courseInstructorMap.set(norm(c.courseCode), c.instructor.trim());
    }
  }

  const seenLocal = new Set<string>();
  const flattenedLocal: TimetableItem[] = [];
  const localSlotMap = new Map<string, TimetableItem>();

  for (const t of rawTimetables) {
    const meta = parseTimetableMetadata(t.titleTh || '', t.titleEn || '');
    const schedules = Array.isArray(t.scheduleData) ? t.scheduleData : [];
    for (const s of schedules) {
      const startNorm = formatTimeSlotString(s.startTime || '');
      const endNorm = formatTimeSlotString(s.endTime || '');
      const dayNum = typeof s.dayOfWeek === 'number' ? s.dayOfWeek : parseInt(String(s.dayOfWeek || '1'), 10) || 1;
      const codeNorm = norm(s.courseCode);
      const instructor = (s.instructor || courseInstructorMap.get(codeNorm) || '').trim();
      const item: TimetableItem = {
        academicYear: String(t.academicYear || '2569').trim(),
        semester: Number(t.semester) || 1,
        yearLevel: Number(t.yearLevel) || 1,
        timetableTitle: (t.titleTh || '').trim(),
        courseCode: (s.courseCode || '').trim(),
        courseName: (s.courseName || '').trim(),
        dayOfWeek: dayNum,
        startTime: startNorm,
        endTime: endNorm,
        room: (s.room || t.room || '').trim(),
        instructor,
        periodLabel: (s.periodLabel || '').trim(),
        degreeLevel: meta.degreeLevel,
        programType: meta.programType,
        major: meta.major,
      };

      const slotKey = `${item.timetableTitle}_${item.courseCode}_${item.dayOfWeek}_${startNorm}`;
      localSlotMap.set(slotKey, item);
      localSlotMap.set(`${item.timetableTitle}_${item.courseCode}_${item.dayOfWeek}`, item);
      localSlotMap.set(`${item.timetableTitle}_${codeNorm}_${item.dayOfWeek}_${startNorm}`, item);
      localSlotMap.set(`${item.timetableTitle}_${codeNorm}_${item.dayOfWeek}`, item);
      localSlotMap.set(`${codeNorm}_${item.dayOfWeek}_${startNorm}`, item);
      localSlotMap.set(codeNorm, item);

      const dedupKey = `${item.timetableTitle}_${item.courseCode}_${item.dayOfWeek}_${startNorm}_${item.room}`;
      if (!seenLocal.has(dedupKey)) {
        seenLocal.add(dedupKey);
        flattenedLocal.push(item);
      }
    }
  }

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Timetables!A2:Z');
      if (rows && rows.length > 0) {
        const seen = new Set<string>();
        const list: TimetableItem[] = [];
        const validPeriodRegex = /^(เช้า|บ่าย|บ่าย\s*1|บ่าย\s*2|ค่ำ|Morning|Afternoon|Late Afternoon)$/i;

        for (const r of rows) {
          const title = (r[3] || '').trim();
          const code = (r[4] || '').trim();
          if (!code) continue;
          const dayNum = r[6] ? parseInt(r[6], 10) : 1;
          const startNorm = formatTimeSlotString(r[7] || '');
          const endNorm = formatTimeSlotString(r[8] || '');

          // Reconstruct room, instructor, and periodLabel in case unquoted commas shifted columns 9..Z
          const tail = r
            .slice(9)
            .map((cell: any) => String(cell ?? '').trim())
            .filter((cell: string) => cell.length > 0);

          let room = '';
          let instructor = '';
          let periodLabel = '';

          if (tail.length > 0 && validPeriodRegex.test(tail[tail.length - 1])) {
            periodLabel = tail.pop()!;
          }

          if (tail.length === 1) {
            room = tail[0];
          } else if (tail.length >= 2) {
            // Check if tail[1] is a room number fragment split by comma, e.g., "ห้อง D 323" + "220/2"
            if (/^\d{3}(\/\d+)?$/.test(tail[1])) {
              room = `${tail[0]}, ${tail[1]}`;
              instructor = tail.slice(2).join(', ');
            } else {
              room = tail[0];
              instructor = tail.slice(1).join(', ');
            }
          }

          // Cross-reference with local timetables.json or courses.json
          const codeNorm = norm(code);
          const localMatch =
            localSlotMap.get(`${title}_${code}_${dayNum}_${startNorm}`) ||
            localSlotMap.get(`${title}_${code}_${dayNum}`) ||
            localSlotMap.get(`${title}_${codeNorm}_${dayNum}_${startNorm}`) ||
            localSlotMap.get(`${title}_${codeNorm}_${dayNum}`) ||
            localSlotMap.get(`${codeNorm}_${dayNum}_${startNorm}`) ||
            localSlotMap.get(codeNorm);

          if (localMatch) {
            if (localMatch.instructor) {
              instructor = localMatch.instructor;
            }
            if (!room && localMatch.room) {
              room = localMatch.room;
            }
            if (!periodLabel && localMatch.periodLabel) {
              periodLabel = localMatch.periodLabel;
            }
          }

          // If courses.json has an instructor for this course, ensure it stays in sync
          if (courseInstructorMap.has(codeNorm) && courseInstructorMap.get(codeNorm)) {
            instructor = courseInstructorMap.get(codeNorm)!;
          }

          const key = `${title}_${code}_${dayNum}_${startNorm}_${room}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const meta = parseTimetableMetadata(title);
          list.push({
            academicYear: (r[0] || '2569').trim(),
            semester: r[1] ? parseInt(r[1], 10) : 1,
            yearLevel: r[2] ? parseInt(r[2], 10) : 1,
            timetableTitle: title,
            courseCode: code,
            courseName: (r[5] || '').trim(),
            dayOfWeek: dayNum,
            startTime: startNorm,
            endTime: endNorm,
            room,
            instructor,
            periodLabel,
            degreeLevel: meta.degreeLevel,
            programType: meta.programType,
            major: meta.major,
          });
        }
        return list;
      }
    } catch (err) {
      console.warn('Google Sheets read error for Timetables, falling back to local file:', err);
    }
  }

  return flattenedLocal;
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
