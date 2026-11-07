/**
 * MCU Attendance & Exam Eligibility Evaluator
 *
 * Implements university regulations on classroom attendance:
 * - 80% minimum attendance threshold to qualify for exams
 * - Configurable Late-to-Absent conversion ratio (default 3:1)
 * - Excused leave evaluation
 * - Remaining allowed absences calculation
 */

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'LEAVE' | 'ABSENT';
export type ExamEligibilityStatus = 'ELIGIBLE' | 'WARNING' | 'INELIGIBLE';

export interface StudentAttendanceRecord {
  studentCode: string;
  courseCode?: string;
  status: AttendanceStatus;
  date?: string;
}

export interface AttendanceEvaluationConfig {
  semesterTotalSessions?: number; // e.g. 16 sessions
  minAttendancePercent?: number;  // e.g. 80%
  lateToAbsentRatio?: number;     // e.g. 3 lates = 1 absent
  includeLeaveAsExcused?: boolean;// default true
}

export interface StudentAttendanceCounts {
  present: number;
  late: number;
  leave: number;
  absent: number;
}

export interface StudentEligibilityResult {
  studentCode: string;
  counts: StudentAttendanceCounts;
  effectiveAbsences: number;
  remainingAbsences: number;
  attendedScore: number;
  attendedPercent: number;
  status: ExamEligibilityStatus;
  statusText: string;
  reason: string;
}

/**
 * Calculates max allowed absences according to university regulation:
 * e.g., 16 sessions with 80% attendance rule -> floor(16 * 0.2) = 3 absences.
 */
export function calculateMaxAllowedAbsences(
  semesterTotalSessions: number = 16,
  minAttendancePercent: number = 80
): number {
  // Avoid floating point inaccuracies by using integer math: (100 - minAttendancePercent) / 100
  const allowedAbsenceRatio = Math.round(100 - minAttendancePercent) / 100;
  return Math.max(1, Math.floor(Math.round(semesterTotalSessions * allowedAbsenceRatio * 1000) / 1000));
}

/**
 * Evaluates a single student's attendance history and determines exam eligibility.
 */
export function evaluateStudentEligibility(
  studentCode: string,
  records: StudentAttendanceRecord[],
  totalRecordedSessions: number,
  config: AttendanceEvaluationConfig = {}
): StudentEligibilityResult {
  const {
    semesterTotalSessions = 16,
    minAttendancePercent = 80,
    lateToAbsentRatio = 3,
    includeLeaveAsExcused = true,
  } = config;

  const maxAbsences = calculateMaxAllowedAbsences(semesterTotalSessions, minAttendancePercent);

  const sRecords = records.filter((r) => r.studentCode === studentCode);
  const present = sRecords.filter((r) => r.status === 'PRESENT').length;
  const late = sRecords.filter((r) => r.status === 'LATE').length;
  const leave = sRecords.filter((r) => r.status === 'LEAVE').length;
  const absent = sRecords.filter((r) => r.status === 'ABSENT').length;

  // Effective absences = absent + floor(late / lateToAbsentRatio)
  const effectiveAbsences = absent + Math.floor(late / lateToAbsentRatio);
  const remainingAbsences = maxAbsences - effectiveAbsences;

  // Attended score: Present counts as 1.0, Late counts as 0.75, Leave counts as 1.0 (if excused)
  const attendedScore = present + late * 0.75 + (includeLeaveAsExcused ? leave : 0);

  // Percentage of class attended so far
  const attendedPercent =
    totalRecordedSessions > 0
      ? Math.min(100, Math.round((attendedScore / totalRecordedSessions) * 100))
      : 100;

  let status: ExamEligibilityStatus = 'ELIGIBLE';
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
    studentCode,
    counts: { present, late, leave, absent },
    effectiveAbsences,
    remainingAbsences,
    attendedScore,
    attendedPercent,
    status,
    statusText,
    reason,
  };
}
