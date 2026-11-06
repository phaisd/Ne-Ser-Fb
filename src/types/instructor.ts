export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OFFICER' | 'INSTRUCTOR';

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
  role?: UserRole;
  coursesCount?: number;
  isActive?: boolean;
  isSuspended?: boolean;
  suspendReason?: string;
  isSuperAdmin?: boolean;
  aliases?: string[];
  previousIds?: string[];
  hasChangedPassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// UserAccount is an alias / unified model for InstructorAccount
export type UserAccount = InstructorAccount;

export interface ArchivedInstructor extends InstructorAccount {
  archivedAt: string;
  archivedBy?: string;
  archiveReason?: string;
}

