import {
  AttendanceHistoryItem,
  CourseEnrollment,
  Student,
  TimetableItem,
} from '@/types';
import { matchInstructorStrict } from '@/lib/utils';
import { AuthUser } from '@/lib/auth-client';
import { calculateMaxAllowedAbsences } from '@/lib/attendance/attendanceEvaluator';
import { groupAndSortByMajor } from '@/components/attendance';

export type MajorSectionGroup = ReturnType<typeof groupAndSortByMajor>['sections'][number];

export type AttendanceStatusValue = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE';

export interface AttendanceTimetableOption extends TimetableItem {
  sectionKey: string;
  sharedMajors: string[];
}

export interface SemesterSessionItem {
  sessionNumber: number;
  date: string;
  dateFormattedTh: string;
  dayNameTh: string;
  startTime: string;
  endTime: string;
  room: string;
  status: 'COMPLETED' | 'NEXT_UP' | 'UPCOMING';
  sessionType: 'NORMAL' | 'MAKEUP' | 'SPECIAL' | 'EXAM';
  stats?: {
    totalStudents: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
    attendancePercent: number;
    recordedBy?: string;
  };
}

export interface EligibilityStudentRow {
  studentCode: string;
  studentName: string;
  major?: string;
  yearLevel?: number;
  present: number;
  late: number;
  leave: number;
  absent: number;
  effectiveAbsences: number;
  attendedScore: number;
  attendedPercent: number;
  remainingAbsences: number;
  status: 'ELIGIBLE' | 'WARNING' | 'INELIGIBLE';
  statusText: string;
  reason: string;
}

export interface EligibilityStats {
  total: number;
  eligible: number;
  warning: number;
  ineligible: number;
}

export function checkIsEnglishCourse(c: TimetableItem): boolean {
  const tt = c.timetableTitle || '';
  const cn = c.courseName || '';
  const prog = String(c.programType || '').toUpperCase();
  return (
    prog === 'ENGLISH' ||
    prog === 'INTERNATIONAL' ||
    /ภาษาอังกฤษ|inter|eng|english|นานาชาติ/i.test(tt) ||
    /^[A-Za-z0-9\s:,\-\(\)\/\.\*]+$/.test(cn.trim())
  );
}

export function isEnglishProgramStudent(s: Student): boolean {
  const p = (s.programType || '').toUpperCase();
  const isThaiNat = s.nationality === 'ไทย' || s.nationality === 'Thai';
  return p === 'ENGLISH' || p === 'INTER' || (!isThaiNat && p !== 'THAI');
}

export function isThaiProgramStudent(s: Student): boolean {
  const p = (s.programType || '').toUpperCase();
  return p === 'THAI' || p === '' || !s.programType;
}

export function formatDayLabel(dayOfWeek?: number, isEn?: boolean): string {
  const mapTh: Record<number, string> = {
    1: 'จันทร์',
    2: 'อังคาร',
    3: 'พุธ',
    4: 'พฤหัสบดี',
    5: 'ศุกร์',
    6: 'เสาร์',
    7: 'อาทิตย์',
  };
  const mapEn: Record<number, string> = {
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
    7: 'Sun',
  };
  if (!dayOfWeek) return '-';
  return (isEn ? mapEn[dayOfWeek] : mapTh[dayOfWeek]) || String(dayOfWeek);
}

function extractMajorFromTitle(title?: string): string {
  if (!title) return '';
  if (title.includes('พระพุทธศาสนา')) return 'พระพุทธศาสนา';
  if (title.includes('วิปัสสนาภาวนา')) return 'วิปัสสนาภาวนา';
  if (title.includes('ศาสนาและปรัชญา')) return 'ศาสนาและปรัชญา';
  if (title.includes('บาลีสันสกฤต')) return 'บาลีสันสกฤต';
  return '';
}

export function buildAvailableCourses(
  timetables: TimetableItem[],
  options: {
    isTeacher: boolean;
    currentUser: AuthUser | null;
    selectedInstructor: string;
  }
): AttendanceTimetableOption[] {
  const { isTeacher, currentUser, selectedInstructor } = options;

  const rawMatched = isTeacher
    ? timetables.filter((t) => matchInstructorStrict(currentUser, t.instructor))
    : selectedInstructor === 'ALL'
    ? timetables
    : timetables.filter((t) =>
        t.instructor?.toLowerCase().includes(selectedInstructor.toLowerCase())
      );

  const groupedMap = new Map<string, AttendanceTimetableOption>();

  for (const item of rawMatched) {
    const isEnCourse = checkIsEnglishCourse(item);
    const normCode = (item.courseCode || '').trim().toUpperCase();
    const normStart = (item.startTime || '').trim();
    const sectionKey = `${normCode}__${isEnCourse ? 'EN' : 'TH'}__Y${item.yearLevel || 1}__D${item.dayOfWeek || 1}__T${normStart}`;
    const maj = extractMajorFromTitle(item.timetableTitle);

    const existing = groupedMap.get(sectionKey);
    if (!existing) {
      groupedMap.set(sectionKey, {
        ...item,
        sectionKey,
        sharedMajors: maj ? [maj] : [],
      });
    } else {
      if (maj && !existing.sharedMajors.includes(maj)) {
        existing.sharedMajors.push(maj);
      }
      if ((item.instructor || '').length > (existing.instructor || '').length) {
        existing.instructor = item.instructor;
      }
    }
  }

  return Array.from(groupedMap.values());
}

export function buildSemesterRoadmapSessions(
  currentCourse: TimetableItem | null | undefined,
  historyRecords: AttendanceHistoryItem[],
  semesterTotalSessions: number
): SemesterSessionItem[] {
  if (!currentCourse) return [];

  const recordsByDate = new Map<string, AttendanceHistoryItem[]>();
  historyRecords.forEach((r) => {
    if (r.courseCode === currentCourse.courseCode) {
      if (!recordsByDate.has(r.date)) {
        recordsByDate.set(r.date, []);
      }
      recordsByDate.get(r.date)!.push(r);
    }
  });

  const sortedRecordedDates = Array.from(recordsByDate.keys()).sort();

  let startDate = new Date('2026-06-15T00:00:00');
  if (sortedRecordedDates.length > 0) {
    const firstRec = new Date(sortedRecordedDates[0] + 'T00:00:00');
    if (!isNaN(firstRec.getTime())) {
      startDate = firstRec;
    }
  }

  const thaiMonthsShort = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ];
  const thaiDays = [
    'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ',
    'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์',
  ];

  const sessions: SemesterSessionItem[] = [];
  let foundNextUp = false;

  for (let i = 0; i < semesterTotalSessions; i++) {
    const sessionNum = i + 1;
    let sDate = new Date(startDate);
    sDate.setDate(startDate.getDate() + i * 7);

    let sessionDateStr = sDate.toISOString().substring(0, 10);
    if (i < sortedRecordedDates.length) {
      sessionDateStr = sortedRecordedDates[i];
      sDate = new Date(sessionDateStr + 'T00:00:00');
    }

    const dateFormattedTh = `${sDate.getDate()} ${thaiMonthsShort[sDate.getMonth()]} ${(
      sDate.getFullYear() + 543
    )
      .toString()
      .substring(2)}`;
    const dayNameTh = thaiDays[sDate.getDay()];
    const recordsForThis = recordsByDate.get(sessionDateStr);

    if (recordsForThis && recordsForThis.length > 0) {
      const present = recordsForThis.filter((r) => r.status === 'PRESENT').length;
      const late = recordsForThis.filter((r) => r.status === 'LATE').length;
      const absent = recordsForThis.filter((r) => r.status === 'ABSENT').length;
      const leave = recordsForThis.filter((r) => r.status === 'LEAVE').length;
      const totalStudents = recordsForThis.length;
      const attendancePercent =
        totalStudents > 0 ? Math.round(((present + late) / totalStudents) * 100) : 0;

      sessions.push({
        sessionNumber: sessionNum,
        date: sessionDateStr,
        dateFormattedTh,
        dayNameTh,
        startTime: currentCourse.startTime || '09:00',
        endTime: currentCourse.endTime || '12:00',
        room: currentCourse.room || 'C301',
        status: 'COMPLETED',
        sessionType: 'NORMAL',
        stats: {
          totalStudents,
          present,
          late,
          absent,
          leave,
          attendancePercent,
          recordedBy: recordsForThis[0].recordedBy,
        },
      });
    } else {
      let status: 'NEXT_UP' | 'UPCOMING' = 'UPCOMING';
      if (!foundNextUp) {
        status = 'NEXT_UP';
        foundNextUp = true;
      }

      sessions.push({
        sessionNumber: sessionNum,
        date: sessionDateStr,
        dateFormattedTh,
        dayNameTh,
        startTime: currentCourse.startTime || '09:00',
        endTime: currentCourse.endTime || '12:00',
        room: currentCourse.room || 'C301',
        status,
        sessionType: 'NORMAL',
      });
    }
  }

  return sessions;
}

export function computeProgramCounts(
  students: Student[],
  showOnlyTargetYear: boolean,
  targetYear: number,
  hasCourse: boolean
): { yearAllCount: number; yearEnglishCount: number; yearThaiCount: number } {
  if (!hasCourse) {
    return { yearAllCount: 0, yearEnglishCount: 0, yearThaiCount: 0 };
  }
  const baseList = showOnlyTargetYear
    ? students.filter((s) => s.yearLevel === targetYear)
    : students;

  return {
    yearAllCount: baseList.length,
    yearEnglishCount: baseList.filter(isEnglishProgramStudent).length,
    yearThaiCount: baseList.filter(isThaiProgramStudent).length,
  };
}

export function filterStudentsForCourse(
  students: Student[],
  customEnrollments: CourseEnrollment[],
  currentCourse: TimetableItem | null | undefined,
  options: {
    showOnlyTargetYear: boolean;
    targetYear: number;
    activeProgramMode: 'ENGLISH' | 'THAI' | 'ALL';
  }
): {
  groupedTargetSections: MajorSectionGroup[];
  targetStudents: Student[];
} {
  if (!currentCourse) {
    return { groupedTargetSections: [], targetStudents: [] };
  }

  const { showOnlyTargetYear, targetYear, activeProgramMode } = options;

  let list = showOnlyTargetYear
    ? students.filter((s) => s.yearLevel === targetYear)
    : [...students];

  if (activeProgramMode === 'ENGLISH') {
    list = list.filter(isEnglishProgramStudent);
  } else if (activeProgramMode === 'THAI') {
    list = list.filter(isThaiProgramStudent);
  }

  const courseCodeClean = currentCourse.courseCode.trim().toLowerCase();
  const courseEnrollments = customEnrollments.filter(
    (e) => e.courseCode.trim().toLowerCase() === courseCodeClean
  );

  if (courseEnrollments.length > 0) {
    const enrolledSet = new Set(courseEnrollments.map((e) => e.studentCode.toLowerCase().trim()));
    const existingCodes = new Set(list.map((s) => s.studentCode.toLowerCase().trim()));
    const extraStudents = students.filter((s) => {
      const code = s.studentCode.toLowerCase().trim();
      return enrolledSet.has(code) && !existingCodes.has(code);
    });
    extraStudents.forEach((s) => existingCodes.add(s.studentCode.toLowerCase().trim()));

    const fallbackEnrolledStudents: Student[] = [];
    courseEnrollments
      .filter((e) => !existingCodes.has(e.studentCode.toLowerCase().trim()))
      .forEach((e) => {
        const majorMatch = (e.notes || '').match(/\[สาขาวิชา:\s*([^\]]+)\]/);
        const extractedMajor = majorMatch ? majorMatch[1].trim() : 'พระพุทธศาสนา';
        fallbackEnrolledStudents.push({
          studentCode: e.studentCode.trim(),
          title: '',
          firstName: e.studentName || e.studentCode,
          lastName: '',
          fullName: e.studentName || e.studentCode,
          major: extractedMajor,
          yearLevel: targetYear || 1,
          studyStatus: 'STUDYING',
          email: '',
          phoneNumber: '',
          programType: activeProgramMode === 'ENGLISH' ? 'ENGLISH' : 'THAI',
          nationality: activeProgramMode === 'ENGLISH' ? 'International' : 'ไทย',
        });
        existingCodes.add(e.studentCode.toLowerCase().trim());
      });

    list = [...list, ...extraStudents, ...fallbackEnrolledStudents];
  }

  const { sections, flatSorted } = groupAndSortByMajor(list);
  return {
    groupedTargetSections: sections,
    targetStudents: flatSorted,
  };
}

export function computeExamEligibility(
  currentCourse: TimetableItem | null | undefined,
  historyRecords: AttendanceHistoryItem[],
  targetStudents: Student[],
  settings: {
    semesterTotalSessions: number;
    minAttendancePercent: number;
    lateToAbsentRatio: number;
    includeLeaveAsExcused: boolean;
  }
): {
  eligibilityList: EligibilityStudentRow[];
  eligibilityStats: EligibilityStats;
  recordedSessionsCount: number;
  maxAllowedAbsences: number;
} {
  if (!currentCourse) {
    return {
      eligibilityList: [],
      eligibilityStats: { total: 0, eligible: 0, warning: 0, ineligible: 0 },
      recordedSessionsCount: 0,
      maxAllowedAbsences: 3,
    };
  }

  const {
    semesterTotalSessions,
    minAttendancePercent,
    lateToAbsentRatio,
    includeLeaveAsExcused,
  } = settings;

  const courseRecords = historyRecords.filter((h) => h.courseCode === currentCourse.courseCode);
  const uniqueDates = Array.from(new Set(courseRecords.map((h) => h.date).filter(Boolean)));
  const sessionsRecorded = uniqueDates.length;
  const maxAbsences = calculateMaxAllowedAbsences(semesterTotalSessions, minAttendancePercent);

  const list: EligibilityStudentRow[] = targetStudents.map((s) => {
    const sRecords = courseRecords.filter((r) => r.studentCode === s.studentCode);
    const sPresent = sRecords.filter((r) => r.status === 'PRESENT').length;
    const sLate = sRecords.filter((r) => r.status === 'LATE').length;
    const sLeave = sRecords.filter((r) => r.status === 'LEAVE').length;
    const sAbsent = sRecords.filter((r) => r.status === 'ABSENT').length;

    const effectiveAbsences = sAbsent + Math.floor(sLate / lateToAbsentRatio);
    const remainingAbsences = maxAbsences - effectiveAbsences;
    const attendedScore = sPresent + sLate * 0.75 + (includeLeaveAsExcused ? sLeave : 0);
    const attendedPercent =
      sessionsRecorded > 0
        ? Math.min(100, Math.round((attendedScore / sessionsRecorded) * 100))
        : 100;

    let status: 'ELIGIBLE' | 'WARNING' | 'INELIGIBLE' = 'ELIGIBLE';
    let statusText = 'มีสิทธิ์สอบ';
    let reason = `อยู่ในเกณฑ์ (ยังขาดได้อีก ${Math.max(0, remainingAbsences)} ครั้ง)`;

    if (effectiveAbsences > maxAbsences) {
      status = 'INELIGIBLE';
      statusText = 'หมดสิทธิ์สอบ';
      reason = `ขาดเรียน ${effectiveAbsences} ครั้ง (เกินเกณฑ์ ${maxAbsences} ครั้ง)`;
    } else if (remainingAbsences === 0 || attendedPercent < minAttendancePercent) {
      status = 'WARNING';
      statusText = 'เฝ้าระวัง/เสี่ยงหมดสิทธิ์';
      reason =
        remainingAbsences === 0
          ? `ใช้โควตาขาดครบ ${maxAbsences} ครั้งแล้ว (ห้ามขาดอีก)`
          : `เวลาเรียนปัจจุบัน ${attendedPercent}% (ต่ำกว่าเกณฑ์ ${minAttendancePercent}%)`;
    }

    return {
      studentCode: s.studentCode,
      studentName: s.fullName || `${s.title || ''} ${s.firstName} ${s.lastName}`,
      major: s.major,
      yearLevel: s.yearLevel,
      present: sPresent,
      late: sLate,
      leave: sLeave,
      absent: sAbsent,
      effectiveAbsences,
      attendedScore,
      attendedPercent,
      remainingAbsences,
      status,
      statusText,
      reason,
    };
  });

  return {
    eligibilityList: list,
    eligibilityStats: {
      total: list.length,
      eligible: list.filter((i) => i.status === 'ELIGIBLE').length,
      warning: list.filter((i) => i.status === 'WARNING').length,
      ineligible: list.filter((i) => i.status === 'INELIGIBLE').length,
    },
    recordedSessionsCount: sessionsRecorded,
    maxAllowedAbsences: maxAbsences,
  };
}
