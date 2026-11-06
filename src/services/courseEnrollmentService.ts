import { CourseEnrollment, Student } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';
import { getStudents } from './studentService';

const ENROLLMENTS_FILE = 'course_enrollments.json';

export async function getCourseEnrollments(courseCode?: string): Promise<CourseEnrollment[]> {
  const localList = readLocalJson<CourseEnrollment[]>(ENROLLMENTS_FILE, []);

  // Try reading from Google Sheets if configured
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Course_Enrollments!A2:J');
      if (rows && rows.length > 0) {
        const sheetEnrollments: CourseEnrollment[] = rows
          .filter((r) => r[0] && r[2])
          .map((r) => ({
            courseCode: String(r[0]).trim(),
            courseName: r[1] || '',
            studentCode: String(r[2]).trim(),
            studentName: r[3] || '',
            enrollmentType: r[6] || 'เทียบโอน / เดินเรียน',
            enrolledAt: r[7] || new Date().toISOString(),
            enrolledBy: r[8] || 'อาจารย์ผู้สอน',
            notes: r[9] || '',
          }));

        if (sheetEnrollments.length > 0) {
          // Merge with local list (deduplicate by courseCode + studentCode)
          const map = new Map<string, CourseEnrollment>();
          sheetEnrollments.forEach((e) => map.set(`${e.courseCode}_${e.studentCode}`.toLowerCase(), e));
          localList.forEach((e) => {
            const key = `${e.courseCode}_${e.studentCode}`.toLowerCase();
            if (!map.has(key)) map.set(key, e);
          });
          const merged = Array.from(map.values());
          if (courseCode) {
            const cleanCode = courseCode.trim().toLowerCase();
            return merged.filter((e) => e.courseCode.toLowerCase() === cleanCode);
          }
          return merged;
        }
      }
    } catch (err) {
      console.warn('Google Sheets read Course_Enrollments error (fallback to local):', err);
    }
  }

  if (courseCode) {
    const cleanCode = courseCode.trim().toLowerCase();
    return localList.filter((e) => e.courseCode.toLowerCase() === cleanCode);
  }
  return localList;
}

export async function enrollStudentToCourse(params: {
  courseCode: string;
  courseName?: string;
  studentCode: string;
  studentName?: string;
  enrollmentType?: string;
  enrolledBy?: string;
  notes?: string;
}): Promise<CourseEnrollment> {
  const cleanCourse = params.courseCode.trim();
  const cleanCode = params.studentCode.trim();
  const list = readLocalJson<CourseEnrollment[]>(ENROLLMENTS_FILE, []);

  // Check if student already enrolled in this course
  const existingIdx = list.findIndex(
    (e) =>
      e.courseCode.toLowerCase() === cleanCourse.toLowerCase() &&
      e.studentCode.toLowerCase() === cleanCode.toLowerCase()
  );

  // If student details not provided, look up from student registry
  let studentName = params.studentName || '';
  let major = '';
  let yearLevel = '';
  let programType = '';

  try {
    const students = await getStudents();
    const found = students.find((s) => s.studentCode.toLowerCase() === cleanCode.toLowerCase());
    if (found) {
      if (!studentName) {
        studentName = found.fullName || `${found.title || ''}${found.firstName} ${found.lastName}`.trim();
      }
      major = found.major || found.department || '';
      yearLevel = String(found.yearLevel || '');
      programType = found.programType || '';
    }
  } catch (e) {}

  const nowIso = new Date().toISOString();
  const thaiDateStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

  const record: CourseEnrollment = {
    id: `enr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    courseCode: cleanCourse,
    courseName: params.courseName || '',
    studentCode: cleanCode,
    studentName: studentName || cleanCode,
    enrollmentType: params.enrollmentType || 'เทียบโอน / เดินเรียน',
    enrolledAt: nowIso,
    enrolledBy: params.enrolledBy || 'อาจารย์ผู้สอน',
    notes: params.notes || '',
  };

  if (existingIdx !== -1) {
    list[existingIdx] = record;
  } else {
    list.unshift(record);
  }

  // 1. Save local
  writeLocalJson(ENROLLMENTS_FILE, list);

  // 2. Synchronize to Google Sheets tab `Course_Enrollments`
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await gClient.ensureSheetsExist(['Course_Enrollments']);

      // Ensure header row exists
      const headers = await gClient.getValues('Course_Enrollments!A1:J1');
      if (!headers || headers.length === 0 || !headers[0] || headers[0].length === 0) {
        await gClient.updateValues('Course_Enrollments!A1:J1', [[
          'รหัสวิชา (Course Code)',
          'ชื่อรายวิชา',
          'รหัสนิสิต (Student Code)',
          'ชื่อ-นามสกุลนิสิต',
          'สาขาวิชา',
          'ชั้นปี',
          'ประเภทการเรียน',
          'วัน-เวลาที่เพิ่มเข้าห้องเรียน',
          'ผู้บันทึกข้อมูล',
          'หมายเหตุ',
        ]]);
      }

      await gClient.appendValues('Course_Enrollments!A:J', [[
        record.courseCode,
        record.courseName || '',
        record.studentCode,
        record.studentName || '',
        major,
        yearLevel,
        record.enrollmentType || 'เทียบโอน / เดินเรียน',
        thaiDateStr,
        record.enrolledBy || 'อาจารย์ผู้สอน',
        record.notes || '',
      ]]);
    } catch (sheetErr) {
      console.warn('Google Sheets sync Course_Enrollments error:', sheetErr);
    }
  }

  return record;
}

export async function removeStudentFromCourse(
  courseCode: string,
  studentCode: string
): Promise<boolean> {
  const cleanCourse = courseCode.trim().toLowerCase();
  const cleanCode = studentCode.trim().toLowerCase();

  const list = readLocalJson<CourseEnrollment[]>(ENROLLMENTS_FILE, []);
  const initialLen = list.length;
  const filtered = list.filter(
    (e) =>
      !(e.courseCode.toLowerCase() === cleanCourse && e.studentCode.toLowerCase() === cleanCode)
  );

  if (filtered.length === initialLen) {
    return false;
  }

  writeLocalJson(ENROLLMENTS_FILE, filtered);

  // Clear row from Google Sheets if configured
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Course_Enrollments!A2:C');
      if (rows && rows.length > 0) {
        for (let i = 0; i < rows.length; i++) {
          const rowCourse = (rows[i][0] || '').trim().toLowerCase();
          const rowStudent = (rows[i][2] || '').trim().toLowerCase();
          if (rowCourse === cleanCourse && rowStudent === cleanCode) {
            const rowNum = i + 2;
            const emptyRow = Array(10).fill('');
            await gClient.updateValues(`Course_Enrollments!A${rowNum}:J${rowNum}`, [emptyRow]);
          }
        }
      }
    } catch (sheetErr) {
      console.warn('Google Sheets remove Course_Enrollments error:', sheetErr);
    }
  }

  return true;
}

export async function getStudentEnrolledCourses(studentCode: string): Promise<CourseEnrollment[]> {
  const cleanCode = studentCode.trim().toLowerCase();
  const all = await getCourseEnrollments();
  return all.filter((e) => e.studentCode.toLowerCase() === cleanCode);
}
