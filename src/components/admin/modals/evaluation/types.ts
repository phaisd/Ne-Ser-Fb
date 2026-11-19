import type { EventRegistration } from '@/types';

export interface StudentEvaluationRow {
  registration: EventRegistration;
  id: string;
  studentCode: string;
  groupSpecificCode?: string;
  studentName: string;
  groupNumber?: number;
  degreeLevel?: string;
  programType?: string;
  yearLevel?: number;
  vasa?: string | number;
  // Dimension 1: Attendance
  totalPeriodsRequired: number;
  attendedPeriods: number;
  absentPeriods: number;
  attendancePercent: number;
  attendancePassed: boolean;
  // Dimension 2: Meditation Master Interviews
  interviewS1?: 'PASS' | 'NOT_PASS' | 'PENDING';
  interviewS2?: 'PASS' | 'NOT_PASS' | 'PENDING';
  interviewS3?: 'PASS' | 'NOT_PASS' | 'PENDING';
  interviewsPassed: boolean;
  // Dimension 3: Combined Result
  overallStatus: 'PASSED' | 'REVIEW' | 'FAILED';
  // Dimension 4: Certificate
  certificateIssued: boolean;
  certificateDocNo?: string;
}
