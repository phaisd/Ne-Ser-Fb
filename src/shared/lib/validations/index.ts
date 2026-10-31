import { z } from 'zod';

export type RequestStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type RequestType = 
  | 'STUDENT_STATUS_CERTIFICATE' 
  | 'OFFICIAL_TRANSCRIPT' 
  | 'STUDENT_LOAN_CERTIFICATE' 
  | 'MILITARY_DEFERMENT' 
  | 'LEAVE_REQUEST' 
  | 'OTHER';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'LEAVE' | 'ABSENT';
export type StudentStatus = 'ACTIVE' | 'PROBATION' | 'SUSPENDED' | 'GRADUATED' | 'RESIGNED';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

// -------------------------------------------------------------
// ZOD VALIDATION SCHEMAS
// -------------------------------------------------------------

export const CreateCertificateRequestSchema = z.object({
  tenantId: z.string().default('default'),
  studentId: z.string().min(1, 'ต้องระบุรหัสนิสิต'),
  studentName: z.string().min(1, 'ต้องระบุชื่อ-สกุล'),
  type: z.enum([
    'STUDENT_STATUS_CERTIFICATE',
    'OFFICIAL_TRANSCRIPT',
    'STUDENT_LOAN_CERTIFICATE',
    'MILITARY_DEFERMENT',
    'LEAVE_REQUEST',
    'OTHER'
  ]),
  purpose: z.string().min(3, 'กรุณาระบุวัตถุประสงค์ในการขอหนังสือรับรองอย่างน้อย 3 ตัวอักษร'),
  copiesCount: z.coerce.number().min(1).max(10).default(1),
  deliveryMethod: z.enum(['DIGITAL', 'PICKUP', 'POSTAL']).default('DIGITAL'),
});

export const ApproveRequestSchema = z.object({
  requestId: z.string(),
  officerNotes: z.string().optional(),
  approvedById: z.string().default('staff-admin-01'),
});

export const RejectRequestSchema = z.object({
  requestId: z.string(),
  rejectionReason: z.string().min(3, 'กรุณาระบุเหตุผลการปฏิเสธ'),
  officerNotes: z.string().optional(),
});

export const CreateBookingSchema = z.object({
  tenantId: z.string().default('default'),
  roomId: z.string().min(1, 'กรุณาเลือกห้องประชุม'),
  userId: z.string().default('user-01'),
  bookedBy: z.string().min(1, 'กรุณาระบุชื่อผู้จอง'),
  title: z.string().min(3, 'กรุณาระบุหัวข้อการประชุมอย่างน้อย 3 ตัวอักษร'),
  description: z.string().optional(),
  attendeesCount: z.coerce.number().min(1, 'จำนวนผู้เข้าร่วมอย่างน้อย 1 คน'),
  date: z.string().min(1, 'กรุณาเลือกวันที่'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'รูปแบบเวลาไม่ถูกต้อง (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'รูปแบบเวลาไม่ถูกต้อง (HH:mm)'),
});

export const RecordAttendanceSchema = z.object({
  sessionId: z.string(),
  studentId: z.string(),
  status: z.enum(['PRESENT', 'LATE', 'LEAVE', 'ABSENT']),
  checkInType: z.enum(['MANUAL', 'QR_SCAN']).default('MANUAL'),
  notes: z.string().optional(),
});

export const CreateCourseSchema = z.object({
  tenantId: z.string().default('default'),
  code: z.string().min(3, 'รหัสวิชาต้องมีอย่างน้อย 3 ตัวอักษร'),
  nameTh: z.string().min(3, 'ชื่อวิชา (ภาษาไทย)'),
  nameEn: z.string().min(3, 'ชื่อวิชา (English)'),
  credits: z.coerce.number().min(1).max(6).default(3),
  lectureHours: z.coerce.number().min(0).default(3),
  labHours: z.coerce.number().min(0).default(0),
  department: z.string().min(2, 'ภาควิชา/คณะ'),
});

export const CreateScheduleSlotSchema = z.object({
  tenantId: z.string().default('default'),
  sectionId: z.string(),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  roomCode: z.string().min(1, 'ระบุห้องเรียน'),
  instructorName: z.string().min(1, 'ระบุชื่อผู้สอน'),
});

export const RegisterEventSchema = z.object({
  tenantId: z.string().default('default'),
  eventId: z.string(),
  studentId: z.string(),
  studentName: z.string(),
});
