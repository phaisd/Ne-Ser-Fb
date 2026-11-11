import { describe, it, expect } from 'vitest';
import { Course, TimetableItem } from '@/types';
import {
  buildInstructorWorkloadCourses,
  computeWorkloadStats,
  filterWorkloadCourses,
} from './instructor-workload';

describe('instructor-workload utilities', () => {
  const user = {
    name: 'พระมหาสมชาย กิตฺติภทฺโท, รศ.ดร.',
    nameEn: 'Phramaha Somchai',
    aliases: [],
  };

  const courses: Course[] = [
    {
      id: 'c1',
      courseCode: '000 101',
      courseName: 'พระพุทธศาสนาเบื้องต้น',
      credits: 3,
      programType: 'THAI',
      degreeLevel: 'ปริญญาตรี',
      major: 'พระพุทธศาสนา',
      yearLevel: 1,
      academicYear: '2569',
      semester: 1,
      dayOfWeek: 1,
      startTime: '09.00',
      endTime: '11.30',
      room: 'D516',
      instructor: 'พระมหาสมชาย กิตฺติภทฺโท, รศ.ดร.',
    },
    {
      id: 'c2',
      courseCode: 'BI 201',
      courseName: 'Buddhist Ethics',
      courseNameEn: 'Buddhist Ethics',
      credits: 3,
      programType: 'ENGLISH',
      degreeLevel: 'ปริญญาโท',
      major: 'พระพุทธศาสนา',
      yearLevel: 2,
      academicYear: '2569',
      semester: 2,
      dayOfWeek: 3,
      startTime: '13.00',
      endTime: '16.00',
      room: 'INT-202',
      instructor: 'Phramaha Somchai',
    },
    {
      id: 'c3',
      courseCode: '999 999',
      courseName: 'รายวิชาของอาจารย์ท่านอื่น',
      credits: 3,
      programType: 'THAI',
      degreeLevel: 'ปริญญาเอก',
      academicYear: '2569',
      semester: 1,
      instructor: 'อ.ท่านอื่น ทดสอบ',
    },
  ];

  const timetables: TimetableItem[] = [
    {
      academicYear: '2569',
      semester: 1,
      yearLevel: 1,
      timetableTitle: 'ตารางสอนชั้นปีที่ 1 พุทธศาสตรบัณฑิต สาขาวิชาพระพุทธศาสนา',
      courseCode: '000 101',
      courseName: 'พระพุทธศาสนาเบื้องต้น',
      dayOfWeek: 1,
      startTime: '09.00',
      endTime: '11.30',
      room: 'D516',
      instructor: 'พระมหาสมชาย กิตฺติภทฺโท, รศ.ดร.*',
      degreeLevel: 'ปริญญาตรี',
      programType: 'THAI',
      major: 'พระพุทธศาสนา',
    },
    // Same section shared with another major -> should deduplicate and merge sharedMajors
    {
      academicYear: '2569',
      semester: 1,
      yearLevel: 1,
      timetableTitle: 'ตารางสอนชั้นปีที่ 1 พุทธศาสตรบัณฑิต สาขาวิชาศาสนาและปรัชญา',
      courseCode: '000 101',
      courseName: 'พระพุทธศาสนาเบื้องต้น',
      dayOfWeek: 1,
      startTime: '09.00',
      endTime: '11.30',
      room: 'D516',
      instructor: 'พระมหาสมชาย กิตฺติภทฺโท, รศ.ดร.*',
      degreeLevel: 'ปริญญาตรี',
      programType: 'THAI',
      major: 'ศาสนาและปรัชญา',
    },
  ];

  it('matches courses across timetables and catalog and deduplicates shared majors', () => {
    const items = buildInstructorWorkloadCourses(user, timetables, courses);
    expect(items).toHaveLength(2);

    const first = items.find((i) => i.courseCode === '000 101')!;
    expect(first.sharedMajors).toEqual(['พระพุทธศาสนา', 'ศาสนาและปรัชญา']);
    expect(first.degreeLevel).toBe('ปริญญาตรี');
    expect(first.programType).toBe('THAI');

    const second = items.find((i) => i.courseCode === 'BI 201')!;
    expect(second.degreeLevel).toBe('ปริญญาโท');
    expect(second.programType).toBe('ENGLISH');
    expect(second.semester).toBe(2);
  });

  it('filters by degreeLevel, programType, academicYear, semester, yearLevel, and search', () => {
    const items = buildInstructorWorkloadCourses(user, timetables, courses);

    expect(filterWorkloadCourses(items, { degreeLevel: 'ปริญญาโท' })).toHaveLength(1);
    expect(filterWorkloadCourses(items, { programType: 'ENGLISH' })).toHaveLength(1);
    expect(filterWorkloadCourses(items, { programType: 'THAI', semester: '1' })).toHaveLength(1);
    expect(filterWorkloadCourses(items, { academicYear: '2568' })).toHaveLength(0);
    expect(filterWorkloadCourses(items, { yearLevel: '2' })).toHaveLength(1);
    expect(filterWorkloadCourses(items, { search: 'Ethics' })).toHaveLength(1);
  });

  it('computes total credits, language breakdown, and weekly teaching hours', () => {
    const items = buildInstructorWorkloadCourses(user, timetables, courses);
    const stats = computeWorkloadStats(items);

    expect(stats.totalCourses).toBe(2);
    expect(stats.totalCredits).toBe(6);
    expect(stats.thaiCourses).toBe(1);
    expect(stats.englishCourses).toBe(1);
    expect(stats.weeklyHours).toBe(5.5); // 2.5h + 3.0h
  });
});
