import { UserAccount } from '@/types';
import { XlsxCellValue, XlsxSheet } from './xlsx-export';

export interface TeachingSlipCourseRow {
  courseCode?: string;
  courseName?: string;
  academicYear?: string | number;
  semester?: string | number;
  yearLevel?: string | number;
  dayOfWeek?: number;
  dayShort?: string;
  dayLabel?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  instructor?: string;
  periodLabel?: string;
  timetableTitle?: string;
  programType?: string;
}

export interface BatchTeachingSlipExportOptions {
  instructors: UserAccount[];
  getCoursesForInstructor: (user: UserAccount, year?: string, semester?: string) => TeachingSlipCourseRow[];
  selectedYear: string;
  selectedSemester: string;
  attendanceUrl: string;
  adminName?: string;
  exportedAt?: Date;
}

function isInternationalCourse(course: TeachingSlipCourseRow): boolean {
  return (
    course.programType === 'ENGLISH' ||
    /inter|eng|english|นานาชาติ/i.test(course.timetableTitle || '') ||
    /^[A-Za-z0-9\s:,-]+$/.test(course.courseName || '')
  );
}

function formatDayTime(course: TeachingSlipCourseRow): string {
  const day = course.dayShort || course.dayLabel || '';
  const time = course.startTime || course.endTime
    ? `${course.startTime || '-'}-${course.endTime || '-'} น.`
    : '-';
  return day ? `${day} ${time}` : time;
}

function roleLabelThai(role?: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'ผู้ดูแลระบบสูงสุด (SUPER_ADMIN)';
    case 'ADMIN':
      return 'ผู้ดูแลระบบ (ADMIN)';
    case 'OFFICER':
      return 'เจ้าหน้าที่ (OFFICER)';
    default:
      return 'อาจารย์ผู้สอน (INSTRUCTOR)';
  }
}

export function buildBatchTeachingSlipsFilename(selectedYear: string, selectedSemester: string, date = new Date()): string {
  const yearTag = selectedYear === 'ALL' ? 'ทุกปีการศึกษา' : `ปี_${selectedYear}`;
  const semTag = selectedSemester === 'ALL' ? 'ทุกภาคเรียน' : `ภาค_${selectedSemester}`;
  const dateTag = date.toISOString().slice(0, 10);
  return `บัตรแจ้งภาระงานสอน_เป็นชุด_${yearTag}_${semTag}_${dateTag}.xlsx`;
}

export function buildBatchTeachingSlipsSheets({
  instructors,
  getCoursesForInstructor,
  selectedYear,
  selectedSemester,
  attendanceUrl,
  adminName,
  exportedAt = new Date(),
}: BatchTeachingSlipExportOptions): XlsxSheet[] {
  const academicYearText = selectedYear === 'ALL' ? 'ทุกปีการศึกษา' : `ปีการศึกษา ${selectedYear}`;
  const semesterText = selectedSemester === 'ALL' ? 'ทุกภาคการศึกษา' : `ภาคการศึกษาที่ ${selectedSemester}`;
  const issuerName = adminName?.trim() || 'ผู้ดูแลระบบ';
  const exportedText = exportedAt.toLocaleString('th-TH');

  const detailRows: XlsxCellValue[][] = [];
  const summaryRows: XlsxCellValue[][] = [];

  let detailIndex = 1;
  let totalCourseEntries = 0;

  instructors.forEach((user, idx) => {
    const instructorNo = idx + 1;
    const courses = getCoursesForInstructor(user, selectedYear, selectedSemester) || [];
    const username = user.email || user.gmail || '-';
    const defaultPassword = user.defaultPassword || 'mcu123456';
    const dept = user.department || 'คณะพุทธศาสตร์ มจร.';
    const instructorType = user.instructorType || '-';
    const gmail = user.gmail || '-';
    const nameEn = user.nameEn || '-';

    totalCourseEntries += courses.length;

    const courseSummaryText =
      courses.length === 0
        ? '(ไม่พบรายวิชาในภาคการศึกษานี้)'
        : courses
            .map((c, cIdx) => {
              const semPart = c.semester ? `ภาค ${c.semester}/${c.academicYear || '-'}` : `${c.academicYear || '-'}`;
              const dayTime = formatDayTime(c);
              const room = c.room ? `ห้อง ${c.room}` : 'ไม่ระบุห้อง';
              return `${cIdx + 1}) [${c.courseCode || '-'}] ${c.courseName || '-'} (${semPart}, ${dayTime}, ${room})`;
            })
            .join('\n');

    summaryRows.push([
      instructorNo,
      user.id || '-',
      user.name || '-',
      nameEn,
      instructorType,
      dept,
      roleLabelThai(user.role),
      username,
      gmail,
      defaultPassword,
      courses.length,
      courseSummaryText,
      attendanceUrl,
      issuerName,
    ]);

    if (courses.length === 0) {
      detailRows.push([
        detailIndex++,
        instructorNo,
        user.id || '-',
        user.name || '-',
        nameEn,
        instructorType,
        dept,
        username,
        gmail,
        defaultPassword,
        0,
        '-',
        '-',
        '-',
        '(ไม่พบรายวิชาในภาคการศึกษานี้)',
        '-',
        '-',
        '-',
        '-',
        attendanceUrl,
        issuerName,
      ]);
      return;
    }

    courses.forEach((course) => {
      const isEn = isInternationalCourse(course);
      detailRows.push([
        detailIndex++,
        instructorNo,
        user.id || '-',
        user.name || '-',
        nameEn,
        instructorType,
        dept,
        username,
        gmail,
        defaultPassword,
        courses.length,
        course.academicYear ? String(course.academicYear) : '-',
        course.semester ? String(course.semester) : '-',
        course.courseCode || '-',
        course.courseName || '-',
        isEn ? 'นานาชาติ (EN)' : 'ภาคไทย',
        course.yearLevel ? `ปี ${course.yearLevel}` : '-',
        formatDayTime(course),
        course.room || '-',
        attendanceUrl,
        issuerName,
      ]);
    });
  });

  const subtitle = `${semesterText} ${academicYearText} | จำนวนอาจารย์ ${instructors.length} ท่าน | รวมภาระงาน ${totalCourseEntries} รายวิชา | ส่งออกเมื่อ ${exportedText}`;

  const detailSheet: XlsxSheet = {
    name: 'บัตรภาระงาน_แยกรายวิชา',
    title: 'คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย — รายงานบัตรแจ้งภาระงานสอนเป็นชุด (แยกรายวิชา)',
    subtitle,
    headers: [
      'ลำดับ',
      'ลำดับอาจารย์',
      'รหัสอาจารย์ (ID)',
      'ชื่อ-นามสกุล อาจารย์',
      'ชื่อภาษาอังกฤษ',
      'ประเภทอาจารย์',
      'สังกัด / ภาควิชา',
      'Username / อีเมลเข้าระบบ',
      'Gmail ที่เชื่อมโยง',
      'รหัสผ่านเริ่มต้น',
      'จำนวนวิชาที่สอน',
      'ปีการศึกษา',
      'ภาคเรียน',
      'รหัสวิชา',
      'ชื่อรายวิชา',
      'หลักสูตร',
      'ชั้นปี',
      'วัน-เวลาเรียน',
      'ห้องเรียน',
      'ลิงก์เข้าระบบเช็คชื่อ',
      'ผู้ออกบัตร',
    ],
    rows: detailRows,
    columnWidths: [8, 13, 18, 28, 24, 16, 24, 28, 26, 16, 15, 12, 10, 14, 34, 16, 10, 20, 14, 34, 22],
  };

  const summarySheet: XlsxSheet = {
    name: 'สรุปรายอาจารย์และรหัสผ่าน',
    title: 'คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย — สรุปบัตรแจ้งภาระงานสอนรายอาจารย์และข้อมูลเข้าระบบ',
    subtitle,
    headers: [
      'ลำดับ',
      'รหัสอาจารย์ (ID)',
      'ชื่อ-นามสกุล อาจารย์',
      'ชื่อภาษาอังกฤษ',
      'ประเภทอาจารย์',
      'สังกัด / ภาควิชา',
      'บทบาท',
      'Username / อีเมลเข้าระบบ',
      'Gmail ที่เชื่อมโยง',
      'รหัสผ่านเริ่มต้น',
      'จำนวนวิชาที่สอน',
      'สรุปรายวิชาที่รับผิดชอบ',
      'ลิงก์เข้าระบบเช็คชื่อ',
      'ผู้ออกบัตร',
    ],
    rows: summaryRows,
    columnWidths: [8, 18, 28, 24, 16, 24, 22, 28, 26, 16, 15, 52, 34, 22],
  };

  return [detailSheet, summarySheet];
}
