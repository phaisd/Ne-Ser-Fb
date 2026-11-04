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
