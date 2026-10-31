import { z } from 'zod';

// 1. Certificate Request
export const CreateCertificateRequestSchema = z.object({
  tenantId: z.string().default('a0000000-0000-0000-0000-000000000001'),
  userId: z.string().default('b0000000-0000-0000-0000-000000000001'),
  certificateTypeId: z.string().min(1, 'กรุณาเลือกประเภทหนังสือรับรอง'),
  studentCode: z.string().min(1, 'ระบุรหัสนิสิต'),
  requesterName: z.string().min(1, 'ระบุชื่อ-สกุลนิสิต'),
  note: z.string().min(3, 'กรุณาระบุวัตถุประสงค์การขอหนังสือรับรองอย่างน้อย 3 ตัวอักษร'),
});

export const UpdateCertificateStatusSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
  reason: z.string().optional(),
});

// 2. Meeting Booking
export const CreateMeetingBookingSchema = z.object({
  tenantId: z.string().default('a0000000-0000-0000-0000-000000000001'),
  roomId: z.string().min(1, 'กรุณาเลือกห้องประชุม'),
  requesterId: z.string().default('b0000000-0000-0000-0000-000000000001'),
  requesterName: z.string().min(1, 'ระบุชื่อผู้จอง/หน่วยงาน'),
  title: z.string().min(3, 'ระบุหัวข้อการประชุมอย่างน้อย 3 ตัวอักษร'),
  startTime: z.string().min(1, 'ระบุวันและเวลาเริ่มต้น'),
  endTime: z.string().min(1, 'ระบุวันและเวลาสิ้นสุด'),
  remark: z.string().optional(),
});

// 3. Student Record
export const StudentSchema = z.object({
  tenantId: z.string().default('a0000000-0000-0000-0000-000000000001'),
  studentCode: z.string().min(1, 'รหัสนิสิต'),
  title: z.string().default('นาย'),
  firstName: z.string().min(1, 'ชื่อ'),
  lastName: z.string().min(1, 'นามสกุล'),
  yearLevel: z.coerce.number().min(1).max(6).default(1),
  degree: z.string().default('ปริญญาตรี'),
  faculty: z.string().default('คณะพุทธศาสตร์'),
  department: z.string().optional(),
  major: z.string().optional(),
  studyStatus: z.string().default('ปกติ'),
  email: z.string().email().optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
});

// 4. Course
export const CourseSchema = z.object({
  tenantId: z.string().default('a0000000-0000-0000-0000-000000000001'),
  courseCode: z.string().min(1, 'รหัสวิชา'),
  courseName: z.string().min(1, 'ชื่อวิชา (ภาษาไทย)'),
  courseNameEn: z.string().optional(),
  credits: z.coerce.number().min(1).max(6).default(3),
  section: z.string().default('1'),
  term: z.string().default('1/2569'),
  academicYear: z.string().default('2569'),
  semester: z.coerce.number().default(1),
  room: z.string().optional(),
  dayOfWeek: z.coerce.number().min(1).max(7).default(1),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'รูปแบบเวลา (HH:mm) เช่น 09:00'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'รูปแบบเวลา (HH:mm) เช่น 12:00'),
  targetSessions: z.coerce.number().default(16),
});

// 5. Attendance
export const RecordAttendanceSchema = z.object({
  tenantId: z.string().default('a0000000-0000-0000-0000-000000000001'),
  sessionId: z.string().min(1),
  enrollmentId: z.string().min(1),
  status: z.enum(['PRESENT', 'LATE', 'LEAVE', 'ABSENT']).default('PRESENT'),
});

// 6. Event Registration (Vipassana Meditation)
export const RegisterEventSchema = z.object({
  tenantId: z.string().default('a0000000-0000-0000-0000-000000000001'),
  eventId: z.string().min(1),
  participantName: z.string().min(1, 'ระบุชื่อ-สกุลผู้เข้าร่วม'),
  groupNumber: z.coerce.number().min(1).max(20).default(1),
  groupName: z.string().default('กลุ่มเจริญสติ ๑'),
});
