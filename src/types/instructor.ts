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
  role?: UserRole;
  coursesCount?: number;
  isActive?: boolean;
  isSuspended?: boolean;
  suspendReason?: string;
  isSuperAdmin?: boolean;
  aliases?: string[];
  previousIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// UserAccount is an alias / unified model for InstructorAccount
export type UserAccount = InstructorAccount;
