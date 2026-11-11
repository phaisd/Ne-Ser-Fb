import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cloneCoursesTerm,
  parseTimetableMetadata,
  updateCourse,
} from './courseService';
import * as storageHelper from './storageHelper';

vi.mock('./storageHelper', () => ({
  readLocalJson: vi.fn(() => []),
  writeLocalJson: vi.fn(),
  getSheetsClient: vi.fn(() => null),
}));

describe('courseService unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses timetable metadata titles in Thai and English cleanly', () => {
    const meta = parseTimetableMetadata(
      'ตารางสอน ชั้นปีที่ 2 สาขาวิชาพระพุทธศาสนา หลักสูตรภาษาไทย',
      'Bachelor Buddhism Program'
    );
    expect(meta.degreeLevel).toBe('ปริญญาตรี');
    expect(meta.major).toContain('พระพุทธศาสนา');
    expect(meta.programType).toBe('THAI');
  });

  it('records instructor history and scopes timetable cascade when academicYear+semester provided', async () => {
    const initialCourses = [
      {
        id: 'course-1',
        courseCode: '000 101',
        courseName: 'พระพุทธศาสนาเบื้องต้น',
        courseNameEn: 'Intro to Buddhism',
        credits: 3,
        instructor: 'พระมหา ก.',
        academicYear: '2569',
        semester: 1,
        programType: 'THAI',
      },
    ];
    const initialTimetables = [
      {
        id: 'tt-2568',
        titleTh: 'ตารางสอน ปี 1 2568 เทอม 1',
        academicYear: '2568',
        semester: 1,
        programType: 'THAI',
        scheduleData: [
          {
            courseCode: '000 101',
            instructor: 'พระมหา ก.',
          },
        ],
      },
      {
        id: 'tt-2569',
        titleTh: 'ตารางสอน ปี 1 2569 เทอม 1',
        academicYear: '2569',
        semester: 1,
        programType: 'THAI',
        scheduleData: [
          {
            courseCode: '000 101',
            instructor: 'พระมหา ข.',
          },
        ],
      },
    ];

    vi.mocked(storageHelper.readLocalJson).mockImplementation((file) => {
      if (file === 'courses.json') return JSON.parse(JSON.stringify(initialCourses));
      if (file === 'timetables.json') return JSON.parse(JSON.stringify(initialTimetables));
      return [];
    });

    const updated = await updateCourse(
      'course-1',
      {
        instructor: 'พระมหา ค.',
        academicYear: '2569',
        semester: 1,
      },
      { reason: 'เปลี่ยนผู้สอนปี 2569', changedBy: 'Admin' }
    );

    expect(updated?.instructor).toBe('พระมหา ค.');
    expect(updated?.instructorHistory?.length).toBeGreaterThanOrEqual(1);

    const ttCall = vi
      .mocked(storageHelper.writeLocalJson)
      .mock.calls.find(([file]) => file === 'timetables.json');
    expect(ttCall).toBeDefined();
    const savedTimetables = ttCall![1] as typeof initialTimetables;
    expect(savedTimetables[0].scheduleData[0].instructor).toBe('พระมหา ก.');
    expect(savedTimetables[1].scheduleData[0].instructor).toBe('พระมหา ค.');
  });

  it('clones courses across terms cleanly without duplicating existing courses', async () => {
    vi.mocked(storageHelper.readLocalJson).mockReturnValue([
      {
        id: 'c-1',
        courseCode: '000 101',
        courseName: 'วิชา 1',
        credits: 3,
        instructor: 'อ. ก',
        academicYear: '2568',
        semester: 1,
      },
      {
        id: 'c-2',
        courseCode: '000 101',
        courseName: 'วิชา 1',
        credits: 3,
        instructor: 'อ. ก เดิม',
        academicYear: '2569',
        semester: 1,
      },
      {
        id: 'c-3',
        courseCode: '000 102',
        courseName: 'วิชา 2',
        credits: 3,
        instructor: 'อ. ข',
        academicYear: '2568',
        semester: 1,
      },
    ]);

    const res = await cloneCoursesTerm({
      sourceAcademicYear: '2568',
      sourceSemester: 1,
      targetAcademicYear: '2569',
      targetSemester: 1,
    });

    expect(res.cloned).toBe(1);
    expect(res.skipped).toBe(1);
    expect(storageHelper.writeLocalJson).toHaveBeenCalledTimes(1);
  });
});
