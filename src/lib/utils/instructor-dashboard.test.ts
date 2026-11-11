import { describe, it, expect } from 'vitest';
import { AttendanceRecord, CourseGradeSheet } from '@/types';
import { WorkloadCourseItem } from './instructor-workload';
import {
  buildDailyWorkloadDistribution,
  buildInstructorDashboardSummary,
  getIsoDayOfWeek,
  getTodayAndUpcomingCourses,
} from './instructor-dashboard';

function makeCourse(overrides: Partial<WorkloadCourseItem> = {}): WorkloadCourseItem {
  return {
    id: 'c1',
    sectionKey: 'BUD101__TH__AY2569__S1__Y1__D1__T09.00',
    attendanceSectionKey: 'BUD101__TH__Y1__D1__T09.00',
    courseCode: 'BUD 101',
    courseName: 'พระพุทธศาสนาเบื้องต้น',
    credits: 3,
    academicYear: '2569',
    semester: 1,
    yearLevel: 1,
    degreeLevel: 'ปริญญาตรี',
    programType: 'THAI',
    major: 'ศาสนาและปรัชญา',
    sharedMajors: ['ศาสนาและปรัชญา'],
    dayOfWeek: 1,
    dayLabel: 'วันจันทร์',
    dayShort: 'จ.',
    startTime: '09.00',
    endTime: '12.00',
    room: 'C301',
    instructor: 'พระจาตุรงค์',
    timetableTitle: 'ตารางสอน',
    source: 'TIMETABLE',
    ...overrides,
  };
}

describe('instructor-dashboard', () => {
  it('converts Date.getDay() to ISO 1..7 dayOfWeek', () => {
    expect(getIsoDayOfWeek(new Date('2026-11-09T10:00:00Z'))).toBe(1); // Monday
    expect(getIsoDayOfWeek(new Date('2026-11-11T10:00:00Z'))).toBe(3); // Wednesday
    expect(getIsoDayOfWeek(new Date('2026-11-15T10:00:00Z'))).toBe(7); // Sunday
  });

  it('builds 7-day teaching distribution sorted by startTime', () => {
    const c1 = makeCourse({ id: 'c1', dayOfWeek: 3, startTime: '13.00', endTime: '16.00' });
    const c2 = makeCourse({ id: 'c2', courseCode: 'PHI 101', dayOfWeek: 3, startTime: '09.00', endTime: '12.00' });
    const buckets = buildDailyWorkloadDistribution([c1, c2]);

    expect(buckets).toHaveLength(7);
    expect(buckets[2].coursesCount).toBe(2);
    expect(buckets[2].hours).toBe(6);
    expect(buckets[2].courses[0].courseCode).toBe('PHI 101');
    expect(buckets[0].coursesCount).toBe(0);
  });

  it('finds today classes and next upcoming teaching day', () => {
    const mon = makeCourse({ id: 'mon', dayOfWeek: 1, dayLabel: 'วันจันทร์' });
    const fri = makeCourse({ id: 'fri', courseCode: 'BUD 202', dayOfWeek: 5, dayLabel: 'วันศุกร์' });
    const scheduleOnWed = getTodayAndUpcomingCourses([mon, fri], 3);

    expect(scheduleOnWed.todayCourses).toHaveLength(0);
    expect(scheduleOnWed.nextDayOfWeek).toBe(5);
    expect(scheduleOnWed.daysUntil).toBe(2);
    expect(scheduleOnWed.nextDayCourses[0].courseCode).toBe('BUD 202');

    const scheduleOnMon = getTodayAndUpcomingCourses([mon, fri], 1);
    expect(scheduleOnMon.todayCourses).toHaveLength(1);
    expect(scheduleOnMon.nextDayOfWeek).toBe(5);
    expect(scheduleOnMon.daysUntil).toBe(4);
  });

  it('summarizes attendance sessions and grade sheets including collection scores', () => {
    const c1 = makeCourse({ id: 'c1', courseCode: 'BUD 101', dayOfWeek: 3 });
    const c2 = makeCourse({ id: 'c2', courseCode: 'PHI 201', dayOfWeek: 4 });

    const attendance: AttendanceRecord[] = [
      {
        id: 'a1',
        courseCode: 'BUD101',
        date: '2026-11-04',
        studentCode: '6901',
        studentName: 'นิสิต ก',
        status: 'PRESENT',
        createdAt: '2026-11-04T09:00:00Z',
      },
      {
        id: 'a2',
        courseCode: 'BUD 101',
        date: '2026-11-11',
        studentCode: '6901',
        studentName: 'นิสิต ก',
        status: 'PRESENT',
        createdAt: '2026-11-11T09:00:00Z',
      },
    ];

    const grades: Record<string, CourseGradeSheet> = {
      'PHI 201': {
        courseCode: 'PHI 201',
        maxAssignScore: 20,
        maxAffectiveScore: 10,
        maxMidtermScore: 30,
        maxFinalScore: 40,
        scores: {},
        collectionCount: 5,
        collectionScores: { '6901': [8, 9, null, null, null] },
      },
    };

    const summary = buildInstructorDashboardSummary([c1, c2], attendance, grades, 3);
    expect(summary.teachingDaysCount).toBe(2);
    expect(summary.coursesWithAttendance).toBe(1);
    expect(summary.totalCheckedSessions).toBe(2);
    expect(summary.coursesWithGrades).toBe(1);
    expect(summary.coursesWithCollection).toBe(1);
    expect(summary.pendingAttendanceCourses.map((c) => c.courseCode)).toEqual(['PHI 201']);
    expect(summary.pendingGradeCourses.map((c) => c.courseCode)).toEqual(['BUD 101']);
  });
});
