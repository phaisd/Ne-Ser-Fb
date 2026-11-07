import { StudentScoreItem } from '@/types';
import { GroupedMajorSection, MajorGroupMeta } from '../majorGrouping';

export interface GradeSheetStudentInput {
  studentCode: string;
  studentName: string;
  major?: string;
  yearLevel?: number;
  nationality?: string;
  attendedPercent?: number;
  eligibilityStatus?: 'ELIGIBLE' | 'WARNING' | 'INELIGIBLE';
}

export interface ComputedGradeRow {
  studentCode: string;
  studentName: string;
  major?: string;
  assignScore?: number | null;
  affectiveScore?: number | null;
  midtermScore?: number | null;
  finalScore?: number | null;
  totalScore: number | null;
  grade: string;
  gradeOverride: string;
  remark: string;
  eligibilityStatus?: 'ELIGIBLE' | 'WARNING' | 'INELIGIBLE';
}

export type ComputedGradeRowWithMeta = ComputedGradeRow & {
  indexInMajor: number;
  globalIndex: number;
  majorMeta: MajorGroupMeta;
};

export interface GradeSheetTabProps {
  currentUser: any;
  currentCourse: any;
  availableCourses: any[];
  selectedCourseCode: string;
  handleCourseChange: (code: string) => void;
  studentsList: GradeSheetStudentInput[];
  logoUrl?: string;
}
