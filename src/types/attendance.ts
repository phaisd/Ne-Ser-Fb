export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE';

export interface AttendanceRecord {
  id: string;
  courseCode?: string;
  date: string;
  sessionId?: string;
  studentCode: string;
  studentName: string;
  status: AttendanceStatus;
  recordedBy?: string;
  createdAt: string;
  note?: string;
}

export type AttendanceHistoryItem = AttendanceRecord;

export interface ClassSessionConfig {
  sessionNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  topic?: string;
  instructors?: string[];
  coInstructors?: string[];
  assistants?: string[];
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface StudentScoreItem {
  studentCode: string;
  studentName?: string;
  assignScore?: number | null;     // รายงาน / Assign
  affectiveScore?: number | null;  // จิตพิสัย / Attd.
  midtermScore?: number | null;    // สอบระหว่างภาค / Mid-Term
  finalScore?: number | null;      // สอบปลายภาค / Final
  totalScore?: number | null;      // รวม / Total
  grade?: string;                  // ระดับ / Grade (A, B+, B, C+, C, D+, D, F, S, U, I, ขาดสอบ)
  gradeOverride?: string;          // กรณีอาจารย์ระบุ S, U, I, ขาดสอบ ด้วยตนเอง
  remark?: string;                 // หมายเหตุ / Remark (เช่น หมดสิทธิ์สอบทุกวิชา, ขาดสอบ)
}

export interface CourseGradeSheet {
  courseCode: string;
  courseName?: string;
  semester?: string;
  academicYear?: string;
  formLanguage?: 'THAI' | 'ENGLISH';
  maxAssignScore: number;
  maxAffectiveScore: number;
  maxMidtermScore: number;
  maxFinalScore: number;
  submitDateTextTh?: string;
  submitDateTextEn?: string;
  departmentHeadName?: string;
  departmentHeadTitle?: string;
  lecturerName?: string;
  creditText?: string;
  yearLevelText?: string;
  majorText?: string;
  scores: Record<string, StudentScoreItem>;
  updatedAt?: string;
  updatedBy?: string;
}

