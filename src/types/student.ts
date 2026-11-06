export type ProgramType = 'THAI' | 'ENGLISH';

export type StudentStudyStatus =
  | 'STUDYING'
  | 'GRADUATED'
  | 'RESIGNED'
  | 'RETIRED'
  | 'SUSPENDED'
  | 'LEAVE'
  | string;

export interface Student {
  id?: string;
  studentCode: string;
  title?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  yearLevel?: number;
  degree?: string;
  curriculumName?: string;
  department?: string;
  major?: string;
  studyStatus?: StudentStudyStatus;
  faculty?: string;
  email?: string;
  phoneNumber?: string;
  nationality?: string;
  country?: string;
  gender?: string;
  age?: number | string;
  passportNo?: string;
  passportExpireDate?: string;
  visaType?: string;
  visaExpireDate?: string;
  gpa?: number | string;
  address?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  programType?: ProgramType;
  remarks?: string;
  isActive?: boolean;
  password?: string;
  hasChangedPassword?: boolean;
}

export interface ArchivedStudent extends Student {
  archivedAt: string;
  deletedAt: string;
  deletedBy?: string;
  deletionReason?: string;
}

export interface CourseEnrollment {
  id?: string;
  courseCode: string;
  courseName?: string;
  studentCode: string;
  studentName?: string;
  enrollmentType?: 'TRANSFER' | 'CROSS_ENROLL' | 'AUDIT' | 'SPECIAL' | string;
  enrolledAt: string;
  enrolledBy?: string;
  notes?: string;
}

