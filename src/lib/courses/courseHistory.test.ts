import { describe, it, expect } from 'vitest';
import { Course } from '@/types/course';
import {
  buildInstructorChangeEntry,
  cloneCourseItemsForTerm,
  shouldCascadeTimetableEntry,
} from './courseHistory';

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'crs-1',
    courseCode: 'BUD 101',
    courseName: 'พระพุทธศาสนาเบื้องต้น',
    credits: 3,
    section: '1',
    programType: 'THAI',
    academicYear: '2569',
    semester: 1,
    term: '1/2569',
    instructor: 'พระมหาสมชาย*',
    primaryTeacherName: 'พระมหาสมชาย',
    ...overrides,
  };
}

describe('courseHistory', () => {
  it('builds instructor history entry only when instructor changes', () => {
    expect(
      buildInstructorChangeEntry({
        academicYear: '2570',
        semester: 1,
        previousInstructor: 'พระมหาสมชาย*',
        newInstructor: 'พระมหาสมชาย*',
      }),
    ).toBeNull();

    const entry = buildInstructorChangeEntry({
      academicYear: '2570',
      semester: 1,
      previousInstructor: 'พระมหาสมชาย*',
      newInstructor: 'ผศ.ดร.สมปอง*',
      changedBy: 'Admin',
      reason: 'เปลี่ยนผู้สอนประจำปีการศึกษาใหม่',
    });

    expect(entry).not.toBeNull();
    expect(entry?.previousInstructor).toBe('พระมหาสมชาย*');
    expect(entry?.newInstructor).toBe('ผศ.ดร.สมปอง*');
    expect(entry?.academicYear).toBe('2570');
  });

  it('restricts timetable cascading strictly to matching academicYear and semester', () => {
    expect(shouldCascadeTimetableEntry('2570', 1, '2570', 1)).toBe(true);
    expect(shouldCascadeTimetableEntry('2569', 1, '2570', 1)).toBe(false);
    expect(shouldCascadeTimetableEntry('2570', 2, '2570', 1)).toBe(false);
  });

  it('clones courses to target term while keeping source untouched and skipping duplicates', () => {
    const c2569 = makeCourse({ id: 'crs-2569', academicYear: '2569', semester: 1 });
    const existing2570 = makeCourse({
      id: 'crs-2570-existing',
      courseCode: 'PHI 101',
      courseName: 'ปรัชญา',
      academicYear: '2570',
      semester: 1,
      instructor: 'อ.สมศักดิ์*',
    });
    const sourcePhi = makeCourse({
      id: 'crs-2569-phi',
      courseCode: 'PHI 101',
      courseName: 'ปรัชญา',
      academicYear: '2569',
      semester: 1,
    });

    const result = cloneCourseItemsForTerm([c2569, sourcePhi, existing2570], {
      sourceAcademicYear: '2569',
      sourceSemester: 1,
      targetAcademicYear: '2570',
      targetSemester: 1,
      keepInstructors: true,
      clonedBy: 'ผู้ดูแลระบบ',
    });

    expect(result.sourceCount).toBe(2);
    expect(result.skippedCount).toBe(1);
    expect(result.clonedCourses).toHaveLength(1);
    expect(result.clonedCourses[0].courseCode).toBe('BUD 101');
    expect(result.clonedCourses[0].academicYear).toBe('2570');
    expect(result.clonedCourses[0].term).toBe('1/2570');
    expect(result.clonedCourses[0].instructorHistory).toHaveLength(1);
    expect(c2569.academicYear).toBe('2569');
  });
});
