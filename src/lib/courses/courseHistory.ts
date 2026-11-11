import { Course, CourseInstructorHistoryEntry } from '@/types/course';

function normalizeInstructorDisplay(raw?: string): string {
  return String(raw || '').trim();
}

function normalizeTermStr(raw?: string): string {
  return String(raw || '').trim();
}

function normalizeCodeKey(code?: string): string {
  return String(code || '').replace(/\s+/g, '').toUpperCase();
}

/**
 * Create a structured audit log entry when a course's instructor changes.
 * Returns null if the instructor did not actually change.
 */
export function buildInstructorChangeEntry(params: {
  academicYear?: string;
  semester?: number;
  previousInstructor?: string;
  newInstructor?: string;
  changedBy?: string;
  reason?: string;
  changedAt?: string;
}): CourseInstructorHistoryEntry | null {
  const prev = normalizeInstructorDisplay(params.previousInstructor);
  const next = normalizeInstructorDisplay(params.newInstructor);

  if (prev === next) return null;
  if (!prev && !next) return null;

  return {
    id: `ih-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    academicYear: normalizeTermStr(params.academicYear) || '2569',
    semester: Number(params.semester) || 1,
    previousInstructor: prev || '(ยังไม่ระบุผู้สอน)',
    newInstructor: next || '(ยังไม่ระบุผู้สอน)',
    changedAt: params.changedAt || new Date().toISOString(),
    changedBy: params.changedBy?.trim() || undefined,
    reason: params.reason?.trim() || undefined,
  };
}

/**
 * Check whether a timetable container belongs to the same academicYear & semester as the course,
 * preventing course edits in a new academic year from overwriting historical timetables.
 */
export function shouldCascadeTimetableEntry(
  timetableAcademicYear: string | undefined,
  timetableSemester: number | string | undefined,
  courseAcademicYear: string | undefined,
  courseSemester: number | string | undefined,
): boolean {
  const ttYear = normalizeTermStr(timetableAcademicYear) || '2569';
  const crsYear = normalizeTermStr(courseAcademicYear) || '2569';
  if (ttYear !== crsYear) return false;

  const ttSem = Number(timetableSemester) || 1;
  const crsSem = Number(courseSemester) || 1;
  return ttSem === crsSem;
}

export interface CloneCoursesTermOptions {
  sourceAcademicYear: string;
  sourceSemester: number;
  targetAcademicYear: string;
  targetSemester: number;
  keepInstructors?: boolean;
  clonedBy?: string;
}

export interface CloneCoursesTermResult {
  clonedCourses: Course[];
  skippedCount: number;
  sourceCount: number;
}

/**
 * Clone courses from a source academic year/semester into a target term without mutating source courses.
 * Deduplicates against courses already present in the target term.
 */
export function cloneCourseItemsForTerm(
  allCourses: Course[],
  options: CloneCoursesTermOptions,
): CloneCoursesTermResult {
  const srcYear = normalizeTermStr(options.sourceAcademicYear);
  const tgtYear = normalizeTermStr(options.targetAcademicYear);
  const srcSem = Number(options.sourceSemester) || 1;
  const tgtSem = Number(options.targetSemester) || 1;
  const keepInstructors = options.keepInstructors !== false;
  const nowIso = new Date().toISOString();

  const buildIdentityKey = (c: Course) =>
    `${normalizeCodeKey(c.courseCode)}__${String(c.section || '1').trim()}__${String(c.programType || 'THAI').toUpperCase()}__${normalizeTermStr(c.academicYear) || '2569'}__${Number(c.semester) || 1}`;

  const existingTargetKeys = new Set<string>();
  for (const c of allCourses) {
    const cYear = normalizeTermStr(c.academicYear) || '2569';
    const cSem = Number(c.semester) || 1;
    if (cYear === tgtYear && cSem === tgtSem) {
      existingTargetKeys.add(buildIdentityKey(c));
    }
  }

  const sourceCourses = allCourses.filter((c) => {
    const cYear = normalizeTermStr(c.academicYear) || '2569';
    const cSem = Number(c.semester) || 1;
    return cYear === srcYear && cSem === srcSem;
  });

  const clonedCourses: Course[] = [];
  let skippedCount = 0;

  for (let i = 0; i < sourceCourses.length; i++) {
    const src = sourceCourses[i];
    const clonedBase: Course = {
      ...src,
      id: `crs-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      academicYear: tgtYear,
      semester: tgtSem,
      term: `${tgtSem}/${tgtYear}`,
      instructor: keepInstructors ? src.instructor || '' : '',
      primaryTeacherName: keepInstructors ? src.primaryTeacherName || '' : '',
      instructorHistory: [
        ...(src.instructorHistory || []),
        {
          id: `ih-clone-${Date.now()}-${i}`,
          academicYear: tgtYear,
          semester: tgtSem,
          previousInstructor: src.instructor || '(ยังไม่ระบุผู้สอน)',
          newInstructor: keepInstructors ? src.instructor || '(ยังไม่ระบุผู้สอน)' : '(รอระบุผู้สอนใหม่)',
          changedAt: nowIso,
          changedBy: options.clonedBy,
          reason: `คัดลอกรายวิชาจากภาค ${srcSem}/${srcYear} ไปยัง ${tgtSem}/${tgtYear}`,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const targetKey = buildIdentityKey(clonedBase);
    if (existingTargetKeys.has(targetKey)) {
      skippedCount += 1;
      continue;
    }

    existingTargetKeys.add(targetKey);
    clonedCourses.push(clonedBase);
  }

  return {
    clonedCourses,
    skippedCount,
    sourceCount: sourceCourses.length,
  };
}
