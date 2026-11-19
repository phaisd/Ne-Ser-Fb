export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'OFFICER'
  | 'INSTRUCTOR'
  | 'VIPASSANA_MASTER'
  | 'STAFF'
  | 'ACTING_OFFICER';

export interface LoginAuditRecord {
  id: string;
  timestamp: string;
  ip: string;
  userAgent?: string;
  device: string; // e.g. "Windows PC (Chrome)", "Mac (Safari)", "iPhone (Safari)"
  sessionId: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'LOGGED_OUT' | 'FAILED_ATTEMPT';
  method?: 'PASSWORD' | 'GOOGLE' | 'SESSION_RESET';
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
  instructorType?: string; // ประเภทอาจารย์ เช่น 'อาจารย์ประจำ', 'อาจารย์พิเศษ', 'อาจารย์ผู้ช่วยสอน'
  ecclesiasticalTitle?: string; // ตำแหน่งทางคณะสงฆ์ เช่น เจ้าอาวาสวัด..., เจ้าคณะตำบล..., พระมหา...
  contactAddress?: string; // ที่อยู่ติดต่อ / สังกัดวัด
  phoneNumber?: string; // เบอร์โทรศัพท์ติดต่อ
  phone?: string; // เบอร์โทรศัพท์ (สำรอง)
  role?: UserRole;
  coursesCount?: number;
  isActive?: boolean;
  isSuspended?: boolean;
  suspendReason?: string;
  isSuperAdmin?: boolean;
  isActingOfficer?: boolean;
  aliases?: string[];
  previousIds?: string[];
  hasChangedPassword?: boolean;
  activeSessionId?: string;
  activeSessionDevice?: string;
  lastLoginAt?: string;
  loginHistory?: LoginAuditRecord[];
  createdAt?: string;
  updatedAt?: string;
}

// UserAccount is an alias / unified model for InstructorAccount
export type UserAccount = InstructorAccount;

export interface AuthUser {
  id?: string;
  name: string;
  nameEn?: string;
  fullName?: string;
  email: string;
  gmail?: string;
  role: string;
  instructorType?: string;
  studentCode?: string;
  faculty?: string;
  major?: string;
  year?: number;
  phone?: string;
  isSuperAdmin?: boolean;
  isActingOfficer?: boolean;
  department?: string;
  ecclesiasticalTitle?: string;
  contactAddress?: string;
  avatarUrl?: string;
}

export interface ArchivedInstructor extends InstructorAccount {
  archivedAt: string;
  archivedBy?: string;
  archiveReason?: string;
}

