export type DataSourceMode = 'HYBRID' | 'POSTGRES' | 'SHEETS';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'LEAVE' | 'ABSENT';

// 1. Certificate Types & Requests
export interface CertificateTypeDto {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface CertificateRequestDto {
  id: string;
  tenantId: string;
  userId: string;
  certificateTypeId: string;
  certificateTypeName?: string;
  requesterName?: string;
  studentCode?: string;
  status: string;
  reason?: string | null;
  note?: string | null;
  issuedDocumentUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Meeting Rooms & Bookings
export interface MeetingRoomDto {
  id: string;
  tenantId: string;
  name: string;
  capacity: number;
  equipment?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface MeetingBookingDto {
  id: string;
  tenantId: string;
  roomId: string;
  roomName?: string;
  requesterId: string;
  requesterName?: string;
  title: string;
  startTime: Date;
  endTime: Date;
  status: string;
  remark?: string | null;
  createdAt: Date;
}

// 3. Students
export interface StudentDto {
  id: string;
  tenantId: string;
  studentCode: string;
  title?: string | null; // พระ, สามเณร, นาย, นางสาว
  firstName: string;
  lastName: string;
  yearLevel: number;
  degree?: string | null;
  faculty?: string | null;
  department?: string | null;
  major?: string | null;
  studyStatus?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
}

// 4. Courses & Enrollments
export interface CourseDto {
  id: string;
  tenantId: string;
  courseCode: string;
  courseName: string;
  courseNameEn?: string | null;
  credits: number;
  section: string;
  term: string;
  academicYear: string;
  semester: number;
  room?: string | null;
  dayOfWeek?: number | null; // 1=จันทร์ .. 7=อาทิตย์
  startTime?: string | null;
  endTime?: string | null;
  targetSessions: number;
  calculationRules: {
    lateCountsAsFull?: boolean;
    minPercent?: number;
  };
}

export interface CourseEnrollmentDto {
  id: string;
  tenantId: string;
  courseId: string;
  studentId: string;
  studentCode?: string;
  studentName?: string;
  courseCode?: string;
  courseName?: string;
  attendanceScore?: number | null;
  status: string;
  presentCount?: number;
  lateCount?: number;
  leaveCount?: number;
  absentCount?: number;
  attendancePercent?: number;
  isEligible?: boolean;
}

// 5. Attendance Sessions & Records
export interface AttendanceSessionDto {
  id: string;
  tenantId: string;
  courseId: string;
  sessionNo: number; // 1-16
  date: Date;
  qrCode?: string | null;
}

export interface AttendanceRecordDto {
  id: string;
  tenantId: string;
  sessionId: string;
  enrollmentId: string;
  status: string; // PRESENT, LATE, LEAVE, ABSENT
  markedAt: Date;
}

// 6. Events & Vipassana Meditation Registrations
export interface EventDto {
  id: string;
  tenantId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  activityHours: number;
  meditationConfig?: {
    type?: string;
    location?: string;
    roundsPerDay?: number;
    leaderMonk?: string;
    dietaryRules?: string;
  } | null;
  registrationsCount?: number;
}

export interface EventRegistrationDto {
  id: string;
  tenantId: string;
  eventId: string;
  eventTitle?: string;
  participantName: string;
  groupNumber?: number | null;
  groupName?: string | null;
  attendedAt?: Date | null;
  dailyAttendance?: Record<string, boolean> | null;
  certCode?: string;
}
