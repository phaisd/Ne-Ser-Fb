import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCourseEnrollments,
  enrollStudentToCourse,
  removeStudentFromCourse,
} from './courseEnrollmentService';

const mockStore: Record<string, unknown> = {};

vi.mock('./storageHelper', () => ({
  getSheetsClient: vi.fn(() => null),
  readLocalJson: vi.fn((file: string, fallback: unknown) => {
    const data = mockStore[file];
    return data ? JSON.parse(JSON.stringify(data)) : fallback;
  }),
  writeLocalJson: vi.fn((file: string, data: unknown) => {
    mockStore[file] = JSON.parse(JSON.stringify(data));
  }),
}));

vi.mock('./studentService', () => ({
  getStudents: vi.fn(async () => [
    {
      studentCode: '68015001',
      title: 'พระ',
      firstName: 'สมชาย',
      lastName: 'ปัญญาดี',
      fullName: 'พระสมชาย ปัญญาดี',
      major: 'พระพุทธศาสนา',
      yearLevel: 2,
    },
  ]),
}));

describe('courseEnrollmentService', () => {
  beforeEach(() => {
    mockStore['course_enrollments.json'] = [];
  });

  it('enrolls student using registry lookup and deduplicates same student/course pair', async () => {
    const first = await enrollStudentToCourse({
      courseCode: '000201',
      courseName: 'ธรรมะศึกษา',
      studentCode: '68015001',
      enrollmentType: 'เดินเรียน',
    });

    expect(first.studentName).toBe('พระสมชาย ปัญญาดี');
    expect(await getCourseEnrollments('000201')).toHaveLength(1);

    await enrollStudentToCourse({
      courseCode: '000201',
      courseName: 'ธรรมะศึกษา',
      studentCode: '68015001',
      enrollmentType: 'เทียบโอน',
    });

    const list = await getCourseEnrollments('000201');
    expect(list).toHaveLength(1);
    expect(list[0].enrollmentType).toBe('เทียบโอน');
  });

  it('removes student enrollment cleanly', async () => {
    await enrollStudentToCourse({
      courseCode: '000201',
      studentCode: '68015001',
    });
    expect(await removeStudentFromCourse('000201', '68015001')).toBe(true);
    expect(await getCourseEnrollments('000201')).toHaveLength(0);
    expect(await removeStudentFromCourse('000201', '68015001')).toBe(false);
  });
});
