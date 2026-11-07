import { ProgramType } from './student';

export interface Course {
  id?: string;
  courseCode: string;
  courseName: string;
  courseNameEn?: string;
  credits: number;
  programType?: ProgramType | 'BILINGUAL';
  degreeLevel?: string; // ปริญญาตรี, ปริญญาโท, ปริญญาเอก, ประกาศนียบัตร
  faculty?: string;
  department?: string;
  major?: string;
  yearLevel?: number;
  section?: string;
  term?: string;
  academicYear?: string;
  semester?: number;
  room?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  instructor?: string;
  primaryTeacherName?: string;
  primaryTeacherId?: string;
  description?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimetableItem {
  academicYear?: string;
  semester?: number;
  yearLevel: number;
  timetableTitle?: string;
  courseCode: string;
  courseName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  instructor?: string;
  periodLabel?: string;
  degreeLevel?: string;
  programType?: 'THAI' | 'ENGLISH';
  major?: string;
}
