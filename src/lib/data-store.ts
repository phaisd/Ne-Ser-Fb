import fs from 'fs';
import path from 'path';
import { getSheetsClient } from './google-sheets';

const DATA_DIR = path.join(process.cwd(), 'data');

export interface Student {
  id?: string;
  studentCode: string;
  title?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  yearLevel?: number;
  degree?: string;
  curriculumName?: string;
  department?: string;
  major?: string;
  studyStatus?: string;
  faculty?: string;
  email?: string;
  phoneNumber?: string;
  nationality?: string;
  country?: string;
  gender?: string;
  age?: number | string;
  passportNo?: string;
  passportExpireDate?: string;
  visaType?: string;
  visaExpireDate?: string;
  gpa?: number | string;
  address?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  programType?: 'THAI' | 'ENGLISH';
  remarks?: string;
  isActive?: boolean;
}

export interface Course {
  id?: string;
  courseCode: string;
  courseName: string;
  courseNameEn?: string;
  credits: number;
  programType?: 'THAI' | 'ENGLISH' | 'BILINGUAL';
  degreeLevel?: string; // ปริญญาตรี, ปริญญาโท, ปริญญาเอก, ประกาศนียบัตร
  faculty?: string;
  department?: string;
  major?: string;
  yearLevel?: number;
  section?: string;
  term?: string;
  academicYear?: string;
  semester?: number;
  room?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  instructor?: string;
  primaryTeacherName?: string;
  primaryTeacherId?: string;
  description?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimetableItem {
  academicYear: string;
  semester: number;
  yearLevel: number;
  timetableTitle: string;
  courseCode: string;
  courseName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  instructor?: string;
  periodLabel?: string;
}

export interface CertificateRequest {
  id: string;
  createdAt: string;
  studentCode: string;
  fullName: string;
  certType: string;
  degreeLevel?: string;
  major?: string;
  requestPurpose?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  docNo?: string;
  email?: string;
  phone?: string;
  note?: string;
  targetAudience?: 'THAI' | 'INTERNATIONAL' | 'ALL';
  age?: number | string;
  gender?: string;
  nationality?: string;
  country?: string;
  passportNo?: string;
  passportExpireDate?: string;
  visaType?: string;
  visaExpireDate?: string;
  gpa?: number | string;
  address?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  bankName?: string;
  bankBranch?: string;
  bankTargetTh?: string;
  bankActionTh?: string;
  issueDateTh?: string;
  issueDateEn?: string;
  docTemplate?: string;
  signerNameTh?: string;
  signerTitleTh?: string;
  signerNameEn?: string;
  signerTitleEn?: string;
  coordinatorNameTh?: string;
  coordinatorPhoneTh?: string;
}

export interface AttendanceRecord {
  id: string;
  courseCode?: string;
  date: string;
  sessionId?: string;
  studentCode: string;
  studentName: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE';
  recordedBy?: string;
  createdAt: string;
  note?: string;
}

export interface InstructorAccount {
  id: string;
  name: string;
  nameEn?: string;
  email: string;
  gmail?: string;
  password?: string;
  defaultPassword?: string;
  department?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'OFFICER' | 'INSTRUCTOR';
  coursesCount?: number;
  isActive?: boolean;
  isSuspended?: boolean;
  suspendReason?: string;
  isSuperAdmin?: boolean;
  aliases?: string[];
  previousIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Local File Helper
function readLocalJson<T>(filename: string, defaultValue: T): T {
  try {
    const fullPath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(fullPath)) return defaultValue;
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultValue;
  }
}

function writeLocalJson<T>(filename: string, data: T) {
  try {
    const fullPath = path.join(DATA_DIR, filename);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
  }
}

// ----------------- STUDENTS -----------------
export async function getStudents(): Promise<Student[]> {
  const localList = readLocalJson<any[]>('students.json', []);
  const localMap = new Map<string, any>();
  localList.forEach((s) => {
    if (s.studentCode) localMap.set(s.studentCode, s);
  });

  const gClient = getSheetsClient();
  let students: Student[] = [];

  if (gClient) {
    try {
      const rows = await gClient.getValues('Students!A1:O');
      if (rows && rows.length > 0) {
        const startIndex = rows[0][0]?.toLowerCase().includes('code') ? 1 : 0;
        const dataRows = rows.slice(startIndex);
        students = dataRows.map((r) => {
          const code = (r[0] || '').trim();
          const local = localMap.get(code) || {};
          const isThaiNat = (local.nationality === 'ไทย' || local.nationality === 'Thai');
          const programFromSheet = r[13] ? (r[13].includes('ENG') ? 'ENGLISH' : 'THAI') : undefined;

          return {
            ...local,
            studentCode: code,
            title: r[1] || local.title || '',
            firstName: r[2] || local.firstName || '',
            lastName: r[3] || local.lastName || '',
            fullName: r[4] || `${r[1] || ''} ${r[2] || ''} ${r[3] || ''}`.trim(),
            yearLevel: r[5] ? parseInt(r[5], 10) : (local.yearLevel || 1),
            degree: r[6] || local.degree || '',
            department: r[7] || local.department || '',
            major: r[8] || local.major || '',
            studyStatus: r[9] || local.studyStatus || 'ปกติ',
            faculty: r[10] || local.faculty || '',
            phoneNumber: r[11] || local.phoneNumber || '',
            email: r[12] || local.email || '',
            programType: programFromSheet || local.programType || (isThaiNat ? 'THAI' : 'ENGLISH'),
            remarks: r[14] !== undefined && r[14] !== '' ? r[14] : (local.remarks || ''),
          };
        });
      }
    } catch (err) {
      console.warn('Google Sheets read error for Students, falling back to local file:', err);
    }
  }

  if (students.length === 0) {
    students = localList.map((s) => ({
      ...s,
      fullName: `${s.title || ''} ${s.firstName || ''} ${s.lastName || ''}`.trim(),
      programType: s.programType || (s.nationality === 'ไทย' || s.nationality === 'Thai' ? 'THAI' : 'ENGLISH'),
      remarks: s.remarks || '',
    }));
  }

  // Deduplicate by studentCode to prevent duplicate entries and React key collisions
  const seen = new Set<string>();
  return students.filter((s) => {
    if (!s.studentCode) return true;
    if (seen.has(s.studentCode)) return false;
    seen.add(s.studentCode);
    return true;
  });
}

export async function updateStudent(studentCode: string, updates: Partial<Student>): Promise<Student | null> {
  const localList = readLocalJson<any[]>('students.json', []);
  const idx = localList.findIndex((s) => s.studentCode === studentCode);
  if (idx === -1) return null;

  const current = localList[idx];
  const updated: Student = {
    ...current,
    ...updates,
    fullName: updates.fullName || `${updates.title || current.title || ''} ${updates.firstName || current.firstName || ''} ${updates.lastName || current.lastName || ''}`.trim(),
    programType: updates.programType || current.programType || (updates.nationality === 'ไทย' || current.nationality === 'ไทย' ? 'THAI' : 'ENGLISH'),
    remarks: updates.remarks !== undefined ? updates.remarks : (current.remarks || ''),
  };

  localList[idx] = updated;
  writeLocalJson('students.json', localList);

  // If Google Sheets client is available, update row if matching
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Students!A2:A');
      if (rows && rows.length > 0) {
        const rowIndex = rows.findIndex((r) => r[0] === studentCode);
        if (rowIndex !== -1) {
          const sheetRowNum = rowIndex + 2;
          await gClient.updateValues(`Students!A${sheetRowNum}:O${sheetRowNum}`, [[
            updated.studentCode,
            updated.title || '',
            updated.firstName,
            updated.lastName,
            updated.fullName,
            String(updated.yearLevel || 1),
            updated.degree || '',
            updated.department || '',
            updated.major || '',
            updated.studyStatus || 'ปกติ',
            updated.faculty || '',
            updated.phoneNumber || '',
            updated.email || '',
            updated.programType === 'ENGLISH' ? 'หลักสูตรภาคภาษาอังกฤษ (ENGLISH)' : 'หลักสูตรภาคภาษาไทย (THAI)',
            updated.remarks || '',
          ]]);
        }
      }
    } catch (err) {
      console.warn('Google Sheets update student failed:', err);
    }
  }

  return updated;
}

export async function batchUpdateStudents(
  updatesList: Partial<Student>[],
  mode: 'UPDATE_ONLY' | 'UPSERT' = 'UPDATE_ONLY'
): Promise<{ updated: number; added: number; total: number; matchedCodes: string[]; notFoundCodes: string[] }> {
  const localList = readLocalJson<Student[]>('students.json', []);
  let updatedCount = 0;
  let addedCount = 0;
  const matchedCodes: string[] = [];
  const notFoundCodes: string[] = [];

  for (const item of updatesList) {
    if (!item.studentCode) continue;
    const cleanCode = String(item.studentCode).trim();
    const idx = localList.findIndex((s) => s.studentCode === cleanCode);

    if (idx !== -1) {
      const current = localList[idx];
      const updatedItem: Student = {
        ...current,
        ...item,
        studentCode: cleanCode,
        fullName: item.fullName || (item.firstName || item.lastName || item.title
          ? `${item.title || current.title || ''} ${item.firstName || current.firstName || ''} ${item.lastName || current.lastName || ''}`.trim()
          : current.fullName),
        programType: item.programType || current.programType || (current.nationality === 'ไทย' || current.nationality === 'Thai' ? 'THAI' : 'ENGLISH'),
        studyStatus: item.studyStatus || current.studyStatus || 'ปกติ',
        remarks: item.remarks !== undefined ? item.remarks : (current.remarks || ''),
        yearLevel: item.yearLevel !== undefined ? Number(item.yearLevel) : current.yearLevel,
      };
      localList[idx] = updatedItem;
      updatedCount++;
      matchedCodes.push(cleanCode);
    } else {
      notFoundCodes.push(cleanCode);
      if (mode === 'UPSERT' && (item.firstName || item.fullName)) {
        const newItem: Student = {
          studentCode: cleanCode,
          title: item.title || '',
          firstName: item.firstName || '',
          lastName: item.lastName || '',
          fullName: item.fullName || `${item.title || ''} ${item.firstName || ''} ${item.lastName || ''}`.trim(),
          yearLevel: Number(item.yearLevel) || 1,
          degree: item.degree || 'ปริญญาตรี',
          department: item.department || '',
          major: item.major || 'พระพุทธศาสนา',
          studyStatus: item.studyStatus || 'ปกติ',
          faculty: item.faculty || 'คณะพุทธศาสตร์',
          phoneNumber: item.phoneNumber || '',
          email: item.email || '',
          nationality: item.nationality || 'ไทย',
          country: item.country || 'ไทย',
          programType: item.programType || 'THAI',
          remarks: item.remarks || '',
          isActive: true,
        };
        localList.push(newItem);
        addedCount++;
      }
    }
  }

  writeLocalJson('students.json', localList);

  // Sync to Google Sheets if available
  const gClient = getSheetsClient();
  if (gClient && (updatedCount > 0 || addedCount > 0)) {
    try {
      const rows = await gClient.getValues('Students!A2:A');
      if (rows && rows.length > 0) {
        const codeToRowMap = new Map<string, number>();
        rows.forEach((r, i) => {
          if (r[0]) codeToRowMap.set(r[0].trim(), i + 2);
        });

        for (const code of matchedCodes) {
          const rowNum = codeToRowMap.get(code);
          if (rowNum) {
            const student = localList.find((s) => s.studentCode === code);
            if (student) {
              await gClient.updateValues(`Students!A${rowNum}:O${rowNum}`, [[
                student.studentCode,
                student.title || '',
                student.firstName,
                student.lastName,
                student.fullName,
                String(student.yearLevel || 1),
                student.degree || '',
                student.department || '',
                student.major || '',
                student.studyStatus || 'ปกติ',
                student.faculty || '',
                student.phoneNumber || '',
                student.email || '',
                student.programType === 'ENGLISH' ? 'หลักสูตรภาคภาษาอังกฤษ (ENGLISH)' : 'หลักสูตรภาคภาษาไทย (THAI)',
                student.remarks || '',
              ]]);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Google Sheets batch update student failed:', err);
    }
  }

  return {
    updated: updatedCount,
    added: addedCount,
    total: localList.length,
    matchedCodes,
    notFoundCodes,
  };
}

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

// ----------------- CERTIFICATE TYPES -----------------
export async function getCertificateTypes(): Promise<any[]> {
  return readLocalJson<any[]>('certificate_types.json', []);
}

// ----------------- CERTIFICATE REQUESTS -----------------
export async function getCertificateRequests(): Promise<CertificateRequest[]> {
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('CertificateRequests!A2:L');
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: r[0] || '',
          createdAt: r[1] || '',
          studentCode: r[2] || '',
          fullName: r[3] || '',
          certType: r[4] || '',
          degreeLevel: r[5] || '',
          major: r[6] || '',
          requestPurpose: r[7] || '',
          status: (r[8] as any) || 'PENDING',
          docNo: r[9] || '',
          email: r[10] || '',
          phone: r[11] || '',
        }));
      }
    } catch (err) {
      console.warn('Google Sheets read error for CertRequests, falling back to local file:', err);
    }
  }

  const rawRequests = readLocalJson<any[]>('certificate_requests.json', []);
  return rawRequests.map((r) => {
    let noteObj: any = {};
    if (typeof r.note === 'string') {
      try { noteObj = JSON.parse(r.note); } catch (e) {}
    } else if (r.note && typeof r.note === 'object') {
      noteObj = r.note;
    }

    const nationality = r.nationality || noteObj.nationality || '';
    const isThai = nationality === 'Thai' || nationality === 'ไทย';

    return {
      id: r.id,
      createdAt: r.createdAt || new Date().toISOString(),
      studentCode: r.studentCode || noteObj.studentCode || '',
      fullName: r.fullName || noteObj.fullName || (r.user ? r.user.name : ''),
      certType: r.certType || r.certificateType?.name || noteObj.requestPurpose || 'หนังสือรับรอง',
      degreeLevel: r.degreeLevel || noteObj.degreeLevel || '',
      major: r.major || noteObj.major || '',
      requestPurpose: r.requestPurpose || noteObj.requestPurpose || '',
      status: r.status || 'PENDING',
      docNo: r.docNo || noteObj.docNo || '',
      email: r.email || noteObj.email || '',
      phone: r.phone || noteObj.phone || '',
      targetAudience: r.targetAudience || (isThai ? 'THAI' : 'INTERNATIONAL'),
      age: r.age || noteObj.age || '',
      gender: r.gender || noteObj.sex || '',
      nationality: nationality,
      country: r.country || noteObj.country || '',
      passportNo: r.passportNo || noteObj.passportNo || '',
      passportExpireDate: r.passportExpireDate || noteObj.passportExpireDate || '',
      visaType: r.visaType || noteObj.visaType || '',
      visaExpireDate: r.visaExpireDate || noteObj.visaExpireDate || '',
      gpa: r.gpa || noteObj.gpa || '',
      address: r.address || noteObj.addressLine || noteObj.fullAddress || '',
      subdistrict: r.subdistrict || noteObj.subdistrict || '',
      district: r.district || noteObj.district || '',
      province: r.province || noteObj.province || '',
      postalCode: r.postalCode || noteObj.postalCode || '',
      bankTargetTh: r.bankTargetTh || noteObj.bankTargetTh || '',
      bankActionTh: r.bankActionTh || noteObj.bankActionTh || '',
      issueDateTh: r.issueDateTh || noteObj.issueDateTh || '',
      issueDateEn: r.issueDateEn || noteObj.issueDateEn || '',
      docTemplate: r.docTemplate || noteObj.docTemplate || '',
      signerNameTh: r.signerNameTh || noteObj.signerNameTh || '',
      signerTitleTh: r.signerTitleTh || noteObj.signerTitleTh || '',
      signerNameEn: r.signerNameEn || noteObj.signerNameEn || '',
      signerTitleEn: r.signerTitleEn || noteObj.signerTitleEn || '',
      coordinatorNameTh: r.coordinatorNameTh || noteObj.coordinatorNameTh || '',
      coordinatorPhoneTh: r.coordinatorPhoneTh || noteObj.coordinatorPhoneTh || '',
    };
  });
}

export async function createCertificateRequest(data: Omit<CertificateRequest, 'id' | 'createdAt'>): Promise<CertificateRequest> {
  const newReq: CertificateRequest = {
    ...data,
    id: 'req-' + Date.now(),
    createdAt: new Date().toISOString(),
    status: data.status || 'PENDING',
  };

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await gClient.appendValues('CertificateRequests!A:L', [[
        newReq.id,
        newReq.createdAt,
        newReq.studentCode,
        newReq.fullName,
        newReq.certType,
        newReq.degreeLevel || '',
        newReq.major || '',
        newReq.requestPurpose || '',
        newReq.status,
        newReq.docNo || '',
        newReq.email || '',
        newReq.phone || '',
      ]]);
    } catch (err) {
      console.warn('Google Sheets append failed:', err);
    }
  }

  const localList = readLocalJson<any[]>('certificate_requests.json', []);
  localList.unshift(newReq);
  writeLocalJson('certificate_requests.json', localList);

  return newReq;
}

export async function updateCertificateRequest(id: string, updates: Partial<CertificateRequest>): Promise<CertificateRequest | null> {
  const localList = readLocalJson<any[]>('certificate_requests.json', []);
  const idx = localList.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  localList[idx] = {
    ...localList[idx],
    ...updates,
    status: updates.status || localList[idx].status,
    docNo: updates.docNo !== undefined ? updates.docNo : localList[idx].docNo,
    updatedAt: new Date().toISOString(),
  };

  writeLocalJson('certificate_requests.json', localList);
  return localList[idx];
}

// ----------------- ATTENDANCE -----------------
export async function getAttendanceRecords(courseCode?: string, date?: string): Promise<AttendanceRecord[]> {
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Attendance!A2:H');
      if (rows && rows.length > 0) {
        let records: AttendanceRecord[] = rows.map((r) => ({
          id: r[0] || '',
          courseCode: r[1] || '',
          date: r[2] || '',
          studentCode: r[3] || '',
          studentName: r[4] || '',
          status: (r[5] as any) || 'PRESENT',
          recordedBy: r[6] || '',
          createdAt: r[7] || '',
        }));

        if (courseCode) records = records.filter((r) => r.courseCode === courseCode);
        if (date) records = records.filter((r) => r.date === date);
        return records;
      }
    } catch (err) {
      console.warn('Google Sheets read error for Attendance, falling back to local:', err);
    }
  }

  const rawRecords = readLocalJson<any[]>('attendance_records.json', []);
  return rawRecords.map((a) => ({
    id: a.id || 'att-' + Math.random(),
    courseCode: a.courseCode || '000 237',
    date: a.date || (a.createdAt ? String(a.createdAt).substring(0, 10) : new Date().toISOString().substring(0, 10)),
    sessionId: a.sessionId,
    studentCode: a.studentCode || '',
    studentName: a.studentName || '',
    status: a.status || 'PRESENT',
    recordedBy: a.recordedBy || 'อาจารย์ผู้สอน',
    createdAt: a.createdAt || new Date().toISOString(),
  }));
}

export async function saveAttendanceBatch(records: Omit<AttendanceRecord, 'id' | 'createdAt'>[]): Promise<number> {
  const createdNow = new Date().toISOString();
  const newRecords: AttendanceRecord[] = records.map((r) => ({
    ...r,
    id: 'att-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    createdAt: createdNow,
  }));

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const values = newRecords.map((r) => [
        r.id,
        r.courseCode || '',
        r.date,
        r.studentCode,
        r.studentName,
        r.status,
        r.recordedBy || '',
        r.createdAt,
      ]);

      await gClient.appendValues('Attendance!A:H', values);
    } catch (err) {
      console.warn('Failed appending attendance to Google Sheets:', err);
    }
  }

  const localList = readLocalJson<any[]>('attendance_records.json', []);
  localList.push(...newRecords);
  writeLocalJson('attendance_records.json', localList);

  return newRecords.length;
}

// ----------------- INSTRUCTORS & AUTH -----------------
export async function getInstructorAccounts(): Promise<InstructorAccount[]> {
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Instructors!A2:I');
      if (rows && rows.length > 0) {
        return rows.map((r) => {
          const email = (r[2] || '').trim();
          const role = (r[5] as any) || 'INSTRUCTOR';
          const isSuper = email === 'phaisal.dis@mcu.ac.th' || role === 'SUPER_ADMIN';

          return {
            id: r[0] || '',
            name: r[1] || '',
            email,
            gmail: r[3] || '',
            department: r[4] || 'คณะพุทธศาสตร์ มจร',
            role: isSuper ? 'SUPER_ADMIN' : role,
            isActive: r[6] !== 'FALSE',
            isSuspended: r[7] === 'TRUE',
            createdAt: r[8] || '',
            isSuperAdmin: isSuper,
          };
        });
      }
    } catch (err) {
      // Fallback silently to local file
    }
  }
  return readLocalJson<InstructorAccount[]>('instructors.json', []);
}

export async function authenticateInstructor(
  emailOrUsername: string,
  passwordInput: string
): Promise<Omit<InstructorAccount, 'password'> | null> {
  const accounts = await getInstructorAccounts();
  const cleanInput = (emailOrUsername || '').trim().toLowerCase();

  const found = accounts.find((a) => {
    const matchEmail = a.email?.toLowerCase() === cleanInput;
    const matchGmail = a.gmail?.toLowerCase() === cleanInput;
    const matchName = a.name?.toLowerCase() === cleanInput;
    const matchNameEn = a.nameEn?.toLowerCase() === cleanInput;
    const matchId = a.id?.toLowerCase() === cleanInput;
    const matchPrevId = a.previousIds?.some((p) => p.toLowerCase() === cleanInput);
    const matchAlias = a.aliases?.some((al) => al.toLowerCase() === cleanInput);
    return matchEmail || matchGmail || matchName || matchNameEn || matchId || matchPrevId || matchAlias;
  });

  if (!found) {
    // If input is a student (numeric code or in students list), do not auto-create as instructor
    const codePart = cleanInput.replace(/@mcu\.ac\.th$/i, '').trim();
    const students = readLocalJson<Student[]>('students.json', []);
    const isStudent = students.some(
      (s) =>
        (s.studentCode || '').toLowerCase() === codePart ||
        (s.email || '').toLowerCase() === cleanInput ||
        (s.studentCode || '').toLowerCase() === cleanInput
    );
    if (isStudent || /^\d{5,12}$/.test(codePart)) {
      return null;
    }

    // If not found in pre-generated list but user provides an @mcu.ac.th or @gmail.com email
    if (cleanInput.endsWith('@mcu.ac.th') || cleanInput.endsWith('@gmail.com')) {
      if (passwordInput === 'mcu123456' || passwordInput.length >= 6) {
        const username = cleanInput.split('@')[0];
        const newAcc: InstructorAccount = {
          id: 'inst-' + Date.now(),
          name: `อาจารย์ (${username})`,
          email: cleanInput.endsWith('@mcu.ac.th') ? cleanInput : `${username}@mcu.ac.th`,
          gmail: cleanInput.endsWith('@gmail.com') ? cleanInput : `${username}@gmail.com`,
          password: passwordInput,
          defaultPassword: 'mcu123456',
          department: 'คณะพุทธศาสตร์ มจร',
          role: 'INSTRUCTOR',
          coursesCount: 0,
          isActive: true,
          isSuspended: false,
          createdAt: new Date().toISOString(),
        };
        const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
        list.push(newAcc);
        writeLocalJson('instructors.json', list);
        const { password: _, ...safe } = newAcc;
        return safe;
      }
    }
    return null;
  }

  // Check if suspended by admin
  if (found.isSuspended || found.isActive === false) {
    throw new Error('บัญชีผู้ใช้นี้ถูกระงับการใช้งานชั่วคราว โปรดติดต่อผู้ดูแลระบบสูงสุด (phaisal.dis@mcu.ac.th)');
  }

  // Check password
  const valid =
    passwordInput === found.password ||
    passwordInput === found.defaultPassword ||
    passwordInput === 'mcu123456';

  if (!valid) return null;

  const { password: _, ...safeUser } = found;
  return safeUser;
}

export async function authenticateGoogleUser(gmailInput: string): Promise<Omit<InstructorAccount, 'password'> | null> {
  const accounts = await getInstructorAccounts();
  const clean = (gmailInput || '').trim().toLowerCase();
  if (!clean) return null;

  let found = accounts.find((a) => {
    return (
      a.gmail?.toLowerCase() === clean ||
      a.email?.toLowerCase() === clean ||
      a.aliases?.some((al) => al.toLowerCase() === clean)
    );
  });

  if (!found) {
    // If input is a student (numeric code or in students list), do not auto-create as instructor
    const codePart = clean.replace(/@mcu\.ac\.th$/i, '').trim();
    const students = readLocalJson<Student[]>('students.json', []);
    const isStudent = students.some(
      (s) =>
        (s.studentCode || '').toLowerCase() === codePart ||
        (s.email || '').toLowerCase() === clean ||
        (s.studentCode || '').toLowerCase() === clean
    );
    if (isStudent || /^\d{5,12}$/.test(codePart)) {
      return null;
    }

    const username = clean.split('@')[0];
    const newAcc: InstructorAccount = {
      id: 'inst-' + Date.now(),
      name: `อาจารย์ (${username})`,
      email: clean.endsWith('@mcu.ac.th') ? clean : `${username}@mcu.ac.th`,
      gmail: clean.endsWith('@gmail.com') ? clean : `${username}@gmail.com`,
      password: 'mcu123456',
      defaultPassword: 'mcu123456',
      department: 'คณะพุทธศาสตร์ มจร',
      role: 'INSTRUCTOR',
      coursesCount: 0,
      isActive: true,
      isSuspended: false,
      createdAt: new Date().toISOString(),
    };
    accounts.push(newAcc);
    writeLocalJson('instructors.json', accounts);
    found = newAcc;
  }

  if (found.isSuspended || found.isActive === false) {
    throw new Error('บัญชีผู้ใช้นี้ถูกระงับการใช้งานชั่วคราว โปรดติดต่อผู้ดูแลระบบสูงสุด (phaisal.dis@mcu.ac.th)');
  }

  const { password: _, ...safe } = found;
  return safe;
}

export async function authenticateStudent(
  identifier: string,
  passwordInput?: string
): Promise<any | null> {
  const students = await getStudents();
  const clean = (identifier || '').trim().toLowerCase();
  if (!clean) return null;

  // Extract student code if email is provided (e.g. 6001501014@mcu.ac.th -> 6001501014)
  const codeOnly = clean.replace(/@mcu\.ac\.th$/i, '').trim();

  const found = students.find((s) => {
    const sCode = (s.studentCode || '').toLowerCase();
    const sEmail = (s.email || '').toLowerCase();
    return sCode === codeOnly || sEmail === clean || sCode === clean;
  });

  if (!found) return null;

  if (found.isActive === false) {
    throw new Error('สถานภาพนิสิตไม่ปกติหรือถูกระงับการใช้งาน โปรดติดต่อสำนักงานคณะพุทธศาสตร์');
  }

  // Password check: Default password for students is 'mcu123456' or studentCode, or 'mcu' + last 4 digits
  if (passwordInput) {
    const last4 = (found.studentCode || '').slice(-4);
    const valid =
      passwordInput === 'mcu123456' ||
      passwordInput === found.studentCode ||
      passwordInput === `mcu${last4}` ||
      passwordInput === (found.passportNo || '') ||
      passwordInput === '123456';
    if (!valid) return null;
  }

  return {
    id: found.id || found.studentCode,
    studentCode: found.studentCode,
    name: found.fullName || `${found.title || ''}${found.firstName} ${found.lastName}`.trim(),
    email: found.email || `${found.studentCode}@mcu.ac.th`,
    department: found.major || 'คณะพุทธศาสตร์',
    degree: found.degree || 'ปริญญาตรี',
    role: 'STUDENT',
    programType: found.programType || 'THAI',
    yearLevel: found.yearLevel || 1,
    studentData: found,
  };
}

// ----------------- SYSTEM SETTINGS & BRANDING -----------------
export interface SignatoryItem {
  id: string;
  label: string;
  name: string;
  title: string;
  isDefault?: boolean;
}

export const DEFAULT_SIGNATORIES: SignatoryItem[] = [
  {
    id: 'DEAN',
    label: '1. คณบดีคณะพุทธศาสตร์ (พระครูสุธีกิตติบัณฑิต, รศ.ดร.)',
    name: 'พระครูสุธีกิตติบัณฑิต, รศ.ดร.',
    title: 'คณบดีคณะพุทธศาสตร์',
    isDefault: true,
  },
  {
    id: 'VICE_ACADEMIC',
    label: '2. รองคณบดีฝ่ายวิชาการ (ปฏิบัติหน้าที่แทนคณบดี)',
    name: 'พระมหาหรรษา ธมฺมหาโส, ศ.ดร.',
    title: 'รองคณบดีฝ่ายวิชาการ ปฏิบัติหน้าที่แทนคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'VICE_STUDENT',
    label: '3. รองคณบดีฝ่ายกิจการนิสิต (รับรองความประพฤติ/กิจกรรม)',
    name: 'พระมหาบุญเลิศ ช่วยธานี, ศ.ดร.',
    title: 'รองคณบดีฝ่ายกิจการนิสิต คณะพุทธศาสตร์',
  },
  {
    id: 'ACTING_DEAN',
    label: '4. ผู้รักษาราชการแทนคณบดีคณะพุทธศาสตร์',
    name: '',
    title: 'รักษาราชการแทนคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'REGISTRAR',
    label: '5. ผู้อำนวยการส่วนทะเบียนและวัดผล (นายทะเบียน)',
    name: 'พระมหาสุริยัน ปญฺญาวชิโร, ผศ.ดร.',
    title: 'ผู้อำนวยการส่วนทะเบียนและวัดผล',
  },
  {
    id: 'BLANK',
    label: '6. เว้นว่างไว้สำหรับลงนามสดด้วยลายมือปากกา (Handwritten)',
    name: '',
    title: 'คณบดีคณะพุทธศาสตร์',
  },
];

export interface SystemSettings {
  universityNameTh: string;
  universityNameEn: string;
  facultyNameTh: string;
  facultyNameEn: string;
  logoUrl: string;
  logoEmoji?: string;
  signerNameTh: string;
  signerTitleTh: string;
  signerNameEn: string;
  signerTitleEn: string;
  contactPhone: string;
  contactEmail: string;
  addressTh: string;
  addressEn: string;
  announcementText: string;
  signatories?: SignatoryItem[];
  updatedAt?: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  universityNameTh: 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
  universityNameEn: 'Mahachulalongkornrajavidyalaya University',
  facultyNameTh: 'คณะพุทธศาสตร์',
  facultyNameEn: 'Faculty of Buddhism',
  logoUrl: 'https://www.mcu.ac.th/images/logo-mcu.png',
  logoEmoji: '☸️',
  signerNameTh: 'พระครูสุธีกิตติบัณฑิต, รศ.ดร.',
  signerTitleTh: 'คณบดีคณะพุทธศาสตร์',
  signerNameEn: 'Assoc. Prof. Dr. Phrakhrusutheekittibandhit',
  signerTitleEn: 'Dean of the Faculty of Buddhism',
  contactPhone: '035-248-000 ต่อ 8323',
  contactEmail: 'buddhism@mcu.ac.th',
  addressTh: 'เลขที่ 79 หมู่ 1 ถนนพหลโยธิน ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา 13170',
  addressEn: '79 Moo 1, Phahonyothin Road, Lamsai, Wangnoi, Phra Nakhon Si Ayutthaya 13170, Thailand',
  announcementText: 'ยินดีต้อนรับสู่งานบริการการศึกษาและทะเบียน คณะพุทธศาสตร์ มจร. วังน้อย',
  signatories: DEFAULT_SIGNATORIES,
};

export function convertGoogleDriveUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  // Match Google Drive file id: /file/d/XXXX/
  const matchFile = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile && matchFile[1]) {
    return `https://lh3.googleusercontent.com/d/${matchFile[1]}`;
  }
  // Match Google Drive id query param: id=XXXX
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) {
    return `https://lh3.googleusercontent.com/d/${matchId[1]}`;
  }
  return trimmed;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const settings = readLocalJson<SystemSettings | null>('system_settings.json', null);
  if (!settings) {
    writeLocalJson('system_settings.json', DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  const merged: SystemSettings = { ...DEFAULT_SETTINGS, ...settings };
  if (!merged.signatories || !Array.isArray(merged.signatories) || merged.signatories.length === 0) {
    merged.signatories = DEFAULT_SIGNATORIES;
  }
  return merged;
}

export async function updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
  const current = await getSystemSettings();
  if (updates.logoUrl) {
    updates.logoUrl = convertGoogleDriveUrl(updates.logoUrl);
  }
  const updated: SystemSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeLocalJson('system_settings.json', updated);
  return updated;
}

export async function updateUserRole(
  userId: string,
  newRole: 'SUPER_ADMIN' | 'ADMIN' | 'OFFICER' | 'INSTRUCTOR'
): Promise<boolean> {
  const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
  const idx = list.findIndex((u) => u.id === userId || u.email === userId);
  if (idx === -1) return false;
  list[idx].role = newRole;
  list[idx].updatedAt = new Date().toISOString();
  writeLocalJson('instructors.json', list);
  return true;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<InstructorAccount>
): Promise<InstructorAccount | null> {
  const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
  const idx = list.findIndex((u) => u.id === userId || u.email === userId);
  if (idx === -1) return null;

  const current = list[idx];
  // Ensure Super Admin status is preserved if modifying phaisal.dis@mcu.ac.th
  const isSuper = current.isSuperAdmin || current.email === 'phaisal.dis@mcu.ac.th';

  const updated: InstructorAccount = {
    ...current,
    name: updates.name !== undefined ? updates.name.trim() : current.name,
    email: updates.email !== undefined ? updates.email.trim() : current.email,
    gmail: updates.gmail !== undefined ? updates.gmail.trim() : current.gmail,
    department: updates.department !== undefined ? updates.department.trim() : current.department,
    role: updates.role || current.role,
    isSuperAdmin: isSuper || updates.isSuperAdmin || false,
    updatedAt: new Date().toISOString(),
  };

  list[idx] = updated;
  writeLocalJson('instructors.json', list);
  return updated;
}

export async function toggleUserSuspension(
  userId: string,
  suspend: boolean,
  reason?: string
): Promise<{ success: boolean; message: string; user?: InstructorAccount }> {
  const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
  const idx = list.findIndex((u) => u.id === userId || u.email === userId);
  if (idx === -1) {
    return { success: false, message: 'ไม่พบบัญชีผู้ใช้งานที่ระบุ' };
  }

  const target = list[idx];
  if (target.email === 'phaisal.dis@mcu.ac.th' || target.isSuperAdmin) {
    return {
      success: false,
      message: 'ไม่สามารถระงับการใช้งานบัญชีผู้ดูแลระบบสูงสุด (Super Admin: phaisal.dis@mcu.ac.th) ได้',
    };
  }

  target.isSuspended = suspend;
  target.isActive = !suspend;
  target.suspendReason = suspend ? (reason || 'ถูกระงับการใช้งานโดยผู้ดูแลระบบ') : '';
  target.updatedAt = new Date().toISOString();

  list[idx] = target;
  writeLocalJson('instructors.json', list);

  return {
    success: true,
    message: suspend ? `ระงับการใช้งานบัญชี ${target.name} เรียบร้อยแล้ว` : `ปลดระงับการใช้งานบัญชี ${target.name} ให้ใช้งานได้ตามปกติแล้ว`,
    user: target,
  };
}

export async function resetUserPassword(userId: string, newPassword: string = 'mcu123456'): Promise<boolean> {
  const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
  const idx = list.findIndex((u) => u.id === userId || u.email === userId);
  if (idx === -1) return false;
  list[idx].password = newPassword;
  writeLocalJson('instructors.json', list);
  return true;
}

export async function createUserAccount(accountData: Partial<InstructorAccount>): Promise<InstructorAccount> {
  const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
  const newAccount: InstructorAccount = {
    id: 'user-' + Date.now(),
    name: accountData.name || 'ผู้ใช้งานใหม่',
    email: accountData.email || `user${Date.now()}@mcu.ac.th`,
    gmail: accountData.gmail || '',
    password: accountData.password || 'mcu123456',
    defaultPassword: 'mcu123456',
    department: accountData.department || 'คณะพุทธศาสตร์ มจร',
    role: accountData.role || 'INSTRUCTOR',
    coursesCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  list.unshift(newAccount);
  writeLocalJson('instructors.json', list);
  return newAccount;
}

// ----------------- DATA PRIVACY & MASKING (BEST PRACTICE #1) -----------------
export function maskPassportNumber(no?: string): string {
  if (!no) return '';
  const clean = no.trim();
  if (clean.length <= 4) return '••••';
  const start = clean.slice(0, 2);
  const end = clean.slice(-2);
  return `${start}••••${end}`;
}

export function maskCitizenId(id?: string): string {
  if (!id) return '';
  const clean = id.trim();
  if (clean.length < 6) return '••••••••';
  return `${clean.slice(0, 1)}-••••-•••••-${clean.slice(-2)}`;
}

// ----------------- VERIFICATION SERVICE (BEST PRACTICE #3) -----------------
export interface DocumentVerificationResult {
  verified: boolean;
  status: 'AUTHENTIC' | 'REVOKED' | 'EXPIRED' | 'NOT_FOUND';
  docNo?: string;
  id?: string;
  certType?: string;
  fullNameTh?: string;
  fullNameEn?: string;
  studentCode?: string;
  degreeLevel?: string;
  major?: string;
  facultyTh?: string;
  facultyEn?: string;
  universityTh?: string;
  universityEn?: string;
  passportNo?: string;
  passportExpireDate?: string;
  visaType?: string;
  nationality?: string;
  issueDate?: string;
  signerName?: string;
  signerTitle?: string;
  securityHash?: string;
  retentionStatus?: string;
  remarks?: string;
}

export async function verifyCertificateDocument(query: string): Promise<DocumentVerificationResult> {
  const cleanQuery = (query || '').trim().toLowerCase();
  if (!cleanQuery) {
    return { verified: false, status: 'NOT_FOUND' };
  }

  const certs = await getCertificateRequests();
  const students = await getStudents();
  const settings = await getSystemSettings();

  const matched = certs.find((c) => {
    const cDoc = (c.docNo || '').toLowerCase();
    const cId = (c.id || '').toLowerCase();
    const cCode = (c.studentCode || '').toLowerCase();
    const cPass = (c.passportNo || '').toLowerCase();

    return (
      cDoc === cleanQuery ||
      cDoc.replace('/', '-') === cleanQuery ||
      cDoc.replace('-', '/') === cleanQuery ||
      cDoc.replace(/\s+/g, '') === cleanQuery.replace(/\s+/g, '') ||
      cId === cleanQuery ||
      (cleanQuery.length >= 6 && (cCode === cleanQuery || cPass === cleanQuery))
    );
  });

  if (!matched) {
    // If not found in certificates, check if student exists to verify student enrollment status
    const studentOnly = students.find((s) => s.studentCode.toLowerCase() === cleanQuery || (s.passportNo && s.passportNo.toLowerCase() === cleanQuery));
    if (studentOnly) {
      const securityHash = 'MCU-STU-' + Buffer.from(`${studentOnly.studentCode}-${studentOnly.passportNo || 'TH'}`).toString('hex').substring(0, 16).toUpperCase();
      return {
        verified: true,
        status: 'AUTHENTIC',
        docNo: `MCU-ENROLL-${studentOnly.studentCode}`,
        id: `stu-${studentOnly.studentCode}`,
        certType: 'หนังสือรับรองสถานภาพนิสิตปัจจุบัน (Student Enrollment Status)',
        fullNameTh: studentOnly.fullName || `${studentOnly.title || ''} ${studentOnly.firstName} ${studentOnly.lastName}`.trim(),
        fullNameEn: `${studentOnly.firstName} ${studentOnly.lastName}`.trim(),
        studentCode: studentOnly.studentCode,
        degreeLevel: studentOnly.degree || 'ปริญญาตรี',
        major: studentOnly.major || studentOnly.curriculumName || 'สาขาวิชาพระพุทธศาสนา',
        facultyTh: studentOnly.faculty || settings.facultyNameTh || 'คณะพุทธศาสตร์',
        facultyEn: settings.facultyNameEn || 'Faculty of Buddhism',
        universityTh: settings.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
        universityEn: settings.universityNameEn || 'Mahachulalongkornrajavidyalaya University',
        passportNo: studentOnly.passportNo || '',
        passportExpireDate: studentOnly.passportExpireDate || '',
        visaType: studentOnly.visaType || '',
        nationality: studentOnly.nationality || studentOnly.country || '',
        issueDate: new Date().toISOString(),
        signerName: settings.signerNameTh || 'รองอธิการบดีฝ่ายวิชาการ',
        signerTitle: settings.signerTitleTh || 'ปฏิบัติหน้าที่แทนอธิการบดี',
        securityHash,
        retentionStatus: 'จัดเก็บในสารบบถาวร (Archive Protected - 5 ปีขึ้นไปตามระเบียบสารบรรณ)',
        remarks: 'ตรวจพบในระบบทะเบียนนิสิต มจร. มีสถานภาพเป็นนิสิตจริง ใช้ตรวจสอบสิทธิ์และสถานะวีซ่ากับ ตม. ได้',
      };
    }
    return { verified: false, status: 'NOT_FOUND' };
  }

  const linkedStudent = students.find((s) => s.studentCode === matched.studentCode);
  const passportNo = matched.passportNo || linkedStudent?.passportNo || '';
  const passportExpireDate = matched.passportExpireDate || linkedStudent?.passportExpireDate || '';
  const visaType = matched.visaType || linkedStudent?.visaType || '';
  const nationality = matched.nationality || linkedStudent?.nationality || linkedStudent?.country || '';

  const securityHash = 'MCU-' + Buffer.from(`${matched.id}-${matched.docNo || 'NODOC'}-${matched.studentCode}`).toString('hex').substring(0, 16).toUpperCase();

  return {
    verified: true,
    status: matched.status === 'REJECTED' ? 'REVOKED' : 'AUTHENTIC',
    docNo: matched.docNo || `MCU-${matched.id.slice(-6)}`,
    id: matched.id,
    certType: matched.certType,
    fullNameTh: matched.fullName,
    fullNameEn: matched.fullName,
    studentCode: matched.studentCode,
    degreeLevel: matched.degreeLevel || linkedStudent?.degree || 'ปริญญาตรี',
    major: matched.major || linkedStudent?.major || 'สาขาวิชาพระพุทธศาสนา',
    facultyTh: settings.facultyNameTh || 'คณะพุทธศาสตร์',
    facultyEn: settings.facultyNameEn || 'Faculty of Buddhism',
    universityTh: settings.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
    universityEn: settings.universityNameEn || 'Mahachulalongkornrajavidyalaya University',
    passportNo,
    passportExpireDate,
    visaType,
    nationality,
    issueDate: matched.issueDateTh || matched.createdAt,
    signerName: settings.signerNameTh || 'รองอธิการบดีฝ่ายวิชาการ',
    signerTitle: settings.signerTitleTh || 'ปฏิบัติหน้าที่แทนอธิการบดี',
    securityHash,
    retentionStatus: 'จัดเก็บในสารบบถาวร (Archive Protected - 5 ปีขึ้นไปตามระเบียบสารบรรณ)',
    remarks: 'เอกสารฉบับนี้ออกให้ถูกต้องตามกฎหมายและระเบียบของมหาวิทยาลัย ใช้เป็นหลักฐานแสดงต่อ ตม. และหน่วยงานราชการได้จริง',
  };
}

// ----------------- RETENTION POLICY (BEST PRACTICE #4) -----------------
export async function getRetentionSummary() {
  const students = await getStudents();
  const certs = await getCertificateRequests();

  const totalStudents = students.length;
  const foreignStudents = students.filter((s) => s.passportNo && s.passportNo.trim() !== '').length;
  const activeStudents = students.filter((s) => !s.studyStatus || s.studyStatus === 'กำลังศึกษา' || s.studyStatus === 'ปกติ').length;
  const graduatedStudents = students.filter((s) => s.studyStatus === 'สำเร็จการศึกษา').length;
  const otherStudents = totalStudents - activeStudents - graduatedStudents;

  return {
    totalStudents,
    foreignStudents,
    activeStudents,
    graduatedStudents,
    otherStudents,
    totalCertsIssued: certs.filter((c) => c.status === 'APPROVED' || c.docNo).length,
    retentionPolicyYears: 5,
    governingRule: 'ระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. 2526 และ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)',
  };
}

// ----------------- ACADEMIC YEAR ARCHIVING (BEST PRACTICE #4) -----------------
export interface AcademicYearArchive {
  academicYear: string;
  archivedAt: string;
  totalRequests: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  thaiStudentCount: number;
  foreignStudentCount: number;
  degreeSummary: {
    bachelor: number;
    master: number;
    doctoral: number;
  };
  purposeSummary: Record<string, number>;
}

export async function getAcademicYearArchives(): Promise<AcademicYearArchive[]> {
  return readLocalJson<AcademicYearArchive[]>('academic_archives.json', []);
}

export async function archiveAcademicYear(year: string): Promise<AcademicYearArchive> {
  const certs = await getCertificateRequests();
  // Filter by year if matches creation date or academic year tag
  const matching = certs.filter((c) => {
    const createdYear = new Date(c.createdAt).getFullYear() + 543;
    return String(createdYear) === String(year) || (c as any).academicYear === String(year) || year === '2569';
  });

  const approvedCount = matching.filter((c) => c.status === 'APPROVED').length;
  const rejectedCount = matching.filter((c) => c.status === 'REJECTED').length;
  const pendingCount = matching.filter((c) => c.status === 'PENDING').length;
  const foreignStudentCount = matching.filter((c) => c.passportNo && c.passportNo.trim() !== '').length;
  const thaiStudentCount = matching.length - foreignStudentCount;

  const bachelor = matching.filter((c) => c.degreeLevel?.includes('ตรี') || !c.degreeLevel).length;
  const master = matching.filter((c) => c.degreeLevel?.includes('โท')).length;
  const doctoral = matching.filter((c) => c.degreeLevel?.includes('เอก')).length;

  const purposeSummary: Record<string, number> = {};
  matching.forEach((c) => {
    const key = c.certType || 'ทั่วไป';
    purposeSummary[key] = (purposeSummary[key] || 0) + 1;
  });

  const archiveRecord: AcademicYearArchive = {
    academicYear: year,
    archivedAt: new Date().toISOString(),
    totalRequests: matching.length,
    approvedCount,
    rejectedCount,
    pendingCount,
    thaiStudentCount,
    foreignStudentCount,
    degreeSummary: { bachelor, master, doctoral },
    purposeSummary,
  };

  const existing = await getAcademicYearArchives();
  const filtered = existing.filter((a) => a.academicYear !== year);
  filtered.push(archiveRecord);
  writeLocalJson('academic_archives.json', filtered);

  return archiveRecord;
}

