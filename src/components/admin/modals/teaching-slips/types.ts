import { SignatoryItem, SystemSettings, UserAccount } from '@/types';
import { TeachingSlipCourseRow } from '@/lib/utils';

export type SlipLayoutRatio = '1:1' | '2:1' | '4:1' | '6:1' | '8:1';

export interface BatchTeachingSlipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructors: UserAccount[];
  availableAcademicYears?: string[];
  getCoursesForInstructor: (user: UserAccount, year?: string, semester?: string) => TeachingSlipCourseRow[];
  settings?: Partial<SystemSettings>;
  signatories?: SignatoryItem[];
  adminName?: string;
}

export interface TeachingSlipCardProps {
  user: UserAccount;
  courses: TeachingSlipCourseRow[];
  qrCodeDataUrl: string | null;
  academicYearText: string;
  semesterText: string;
  deanName?: string;
  adminName?: string;
  qrScale?: number;
}
