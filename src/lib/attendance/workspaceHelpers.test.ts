import { describe, expect, it } from 'vitest';
import type { AttendanceHistoryItem, Student, TimetableItem } from '@/types';
import {
  checkIsEnglishCourse,
  buildAvailableCourses,
  buildSemesterRoadmapSessions,
  filterStudentsForCourse,
  computeExamEligibility,
} from './workspaceHelpers';

const sampleTimetableTh: TimetableItem = {
  academicYear: '2569',
  semester: 1,
  yearLevel: 2,
  timetableTitle: 'สาขาวิชาพระพุทธศาสนา ชั้นปีที่ 2',
  courseCode: '000201',
  courseName: 'พระพุทธศาสนาและสังคม',
  dayOfWeek: 1,
  startTime: '09.00',
  endTime: '11.30',
  room: 'C301',
  instructor: 'พระมหาสมชาย',
  programType: 'THAI',
};

const sampleTimetableEn: TimetableItem = {
  ...sampleTimetableTh,
  timetableTitle: 'B.A. Buddhism (English Program)',
  courseCode: '000202',
  courseName: 'Meditation Studies',
  programType: 'ENGLISH',
};

describe('attendance workspaceHelpers', () => {
  it('detects English courses by programType, timetableTitle, or ASCII courseName', () => {
    expect(checkIsEnglishCourse(sampleTimetableTh)).toBe(false);
    expect(checkIsEnglishCourse(sampleTimetableEn)).toBe(true);
  });

  it('merges shared majors across matching section keys in buildAvailableCourses', () => {
    const dupSameSection: TimetableItem = {
      ...sampleTimetableTh,
      timetableTitle: 'สาขาวิชาศาสนาและปรัชญา ชั้นปีที่ 2',
      instructor: 'พระมหาสมชาย ธีรปัญโญ',
    };

    const courses = buildAvailableCourses([sampleTimetableTh, dupSameSection], {
      isTeacher: false,
      currentUser: null,
      selectedInstructor: 'ALL',
    });

    expect(courses).toHaveLength(1);
    expect(courses[0].sharedMajors).toEqual(['พระพุทธศาสนา', 'ศาสนาและปรัชญา']);
    expect(courses[0].instructor).toBe('พระมหาสมชาย ธีรปัญโญ');
  });

  it('builds semester roadmap with COMPLETED, NEXT_UP, and UPCOMING statuses', () => {
    const history: AttendanceHistoryItem[] = [
      {
        id: '1',
        courseCode: '000201',
        date: '2026-06-15',
        studentCode: '6801001',
        studentName: 'Student A',
        status: 'PRESENT',
        recordedBy: 'อ.ทดสอบ',
        createdAt: '2026-06-15T09:00:00.000Z',
      },
    ];

    const sessions = buildSemesterRoadmapSessions(sampleTimetableTh, history, 4);
    expect(sessions).toHaveLength(4);
    expect(sessions[0].status).toBe('COMPLETED');
    expect(sessions[0].stats?.attendancePercent).toBe(100);
    expect(sessions[1].status).toBe('NEXT_UP');
    expect(sessions[2].status).toBe('UPCOMING');
  });

  it('includes custom enrolled students even outside target year in filterStudentsForCourse', () => {
    const students: Student[] = [
      {
        studentCode: '6801001',
        title: 'พระ',
        firstName: 'เอก',
        lastName: 'ชัย',
        major: 'พระพุทธศาสนา',
        yearLevel: 2,
        studyStatus: 'STUDYING',
        email: '',
        phoneNumber: '',
        programType: 'THAI',
      },
      {
        studentCode: '6701099',
        title: 'นาย',
        firstName: 'โท',
        lastName: 'ดี',
        major: 'ศาสนาและปรัชญา',
        yearLevel: 3,
        studyStatus: 'STUDYING',
        email: '',
        phoneNumber: '',
        programType: 'THAI',
      },
    ];

    const { targetStudents } = filterStudentsForCourse(
      students,
      [
        {
          courseCode: '000201',
          courseName: 'พระพุทธศาสนาและสังคม',
          studentCode: '6701099',
          studentName: 'นายโท ดี',
          enrollmentType: 'เดินเรียน',
          enrolledAt: '2026-06-01',
        },
      ],
      sampleTimetableTh,
      {
        showOnlyTargetYear: true,
        targetYear: 2,
        activeProgramMode: 'THAI',
      }
    );

    expect(targetStudents.map((s) => s.studentCode)).toEqual(['6801001', '6701099']);
  });

  it('flags students exceeding allowed absences as INELIGIBLE in computeExamEligibility', () => {
    const student: Student = {
      studentCode: '6801001',
      title: 'นาย',
      firstName: 'ทดสอบ',
      lastName: 'หนึ่ง',
      major: 'พระพุทธศาสนา',
      yearLevel: 2,
      studyStatus: 'STUDYING',
      email: '',
      phoneNumber: '',
    };

    const history: AttendanceHistoryItem[] = ['2026-06-15', '2026-06-22', '2026-06-29', '2026-07-06'].map(
      (date, idx) => ({
        id: `r-${idx}`,
        courseCode: '000201',
        date,
        studentCode: '6801001',
        studentName: 'นายทดสอบ หนึ่ง',
        status: 'ABSENT',
        recordedBy: 'อ.ทดสอบ',
        createdAt: `${date}T09:00:00.000Z`,
      })
    );

    const res = computeExamEligibility(sampleTimetableTh, history, [student], {
      semesterTotalSessions: 16,
      minAttendancePercent: 80,
      lateToAbsentRatio: 3,
      includeLeaveAsExcused: true,
    });

    expect(res.eligibilityStats.ineligible).toBe(1);
    expect(res.eligibilityList[0].status).toBe('INELIGIBLE');
  });
});
