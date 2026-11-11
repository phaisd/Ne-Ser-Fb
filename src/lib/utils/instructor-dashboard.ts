import { AttendanceRecord, CourseGradeSheet } from '@/types';
import {
  WorkloadCourseItem,
  WorkloadStats,
  getDayLabelThai,
  getDayShortThai,
  parseTimeToMinutes,
} from './instructor-workload';

export interface DailyWorkloadBucket {
  dayOfWeek: number;
  label: string;
  shortLabel: string;
  coursesCount: number;
  hours: number;
  courses: WorkloadCourseItem[];
}

export interface UpcomingScheduleSummary {
  todayCourses: WorkloadCourseItem[];
  nextDayOfWeek: number | null;
  nextDayLabel: string;
  daysUntil: number;
  nextDayCourses: WorkloadCourseItem[];
}

export interface CourseProgressItem {
  course: WorkloadCourseItem;
  attendanceDatesCount: number;
  lastAttendanceDate: string | null;
  hasGradeSheet: boolean;
  gradedStudentsCount: number;
  hasCollectionScores: boolean;
}

export interface InstructorDashboardSummary {
  dailyBuckets: DailyWorkloadBucket[];
  teachingDaysCount: number;
  schedule: UpcomingScheduleSummary;
  courseProgress: CourseProgressItem[];
  coursesWithAttendance: number;
  coursesWithGrades: number;
  coursesWithCollection: number;
  totalCheckedSessions: number;
  pendingAttendanceCourses: WorkloadCourseItem[];
  pendingGradeCourses: WorkloadCourseItem[];
}

function normalizeCodeKey(code?: string): string {
  return String(code || '').replace(/\s+/g, '').toUpperCase();
}

/** Convert JavaScript Date.getDay() (0=Sun..6=Sat) to ISO 1..7 (1=Mon..7=Sun). */
export function getIsoDayOfWeek(date: Date): number {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

/** Calculate weekly teaching hours for a single course entry. */
export function calculateCourseWeeklyHours(course: WorkloadCourseItem): number {
  const start = parseTimeToMinutes(course.startTime);
  const end = parseTimeToMinutes(course.endTime);
  if (start !== null && end !== null && end > start) {
    return Math.round(((end - start) / 60) * 10) / 10;
  }
  return Math.max(1, Number(course.credits) || 3);
}

/** Build Mon-Sun teaching load distribution buckets for the weekly bar chart. */
export function buildDailyWorkloadDistribution(
  courses: WorkloadCourseItem[],
): DailyWorkloadBucket[] {
  const buckets: DailyWorkloadBucket[] = Array.from({ length: 7 }, (_, i) => {
    const dayOfWeek = i + 1;
    return {
      dayOfWeek,
      label: getDayLabelThai(dayOfWeek),
      shortLabel: getDayShortThai(dayOfWeek),
      coursesCount: 0,
      hours: 0,
      courses: [],
    };
  });

  for (const c of courses) {
    const dayIdx = (Number(c.dayOfWeek) || 1) - 1;
    if (dayIdx < 0 || dayIdx >= 7) continue;
    buckets[dayIdx].courses.push(c);
    buckets[dayIdx].coursesCount += 1;
    buckets[dayIdx].hours = Math.round((buckets[dayIdx].hours + calculateCourseWeeklyHours(c)) * 10) / 10;
  }

  for (const b of buckets) {
    b.courses.sort((a, bItem) => (a.startTime || '').localeCompare(bItem.startTime || ''));
  }

  return buckets;
}

/** Determine today's classes and the next scheduled teaching day in the week. */
export function getTodayAndUpcomingCourses(
  courses: WorkloadCourseItem[],
  todayDayOfWeek: number,
): UpcomingScheduleSummary {
  const buckets = buildDailyWorkloadDistribution(courses);
  const safeToday = Math.min(7, Math.max(1, Math.round(todayDayOfWeek)));
  const todayCourses = buckets[safeToday - 1]?.courses || [];

  for (let offset = 1; offset <= 7; offset++) {
    const candidateDay = ((safeToday - 1 + offset) % 7) + 1;
    const candidateCourses = buckets[candidateDay - 1]?.courses || [];
    if (candidateCourses.length > 0) {
      return {
        todayCourses,
        nextDayOfWeek: candidateDay,
        nextDayLabel: getDayLabelThai(candidateDay),
        daysUntil: offset,
        nextDayCourses: candidateCourses,
      };
    }
  }

  return {
    todayCourses,
    nextDayOfWeek: null,
    nextDayLabel: '',
    daysUntil: 0,
    nextDayCourses: [],
  };
}

function countNonEmptyScores(sheet?: CourseGradeSheet | null): {
  gradedCount: number;
  hasCollectionScores: boolean;
} {
  if (!sheet) return { gradedCount: 0, hasCollectionScores: false };

  let gradedCount = 0;
  if (sheet.scores && typeof sheet.scores === 'object') {
    for (const item of Object.values(sheet.scores)) {
      if (
        item &&
        (typeof item.assignScore === 'number' ||
          typeof item.affectiveScore === 'number' ||
          typeof item.midtermScore === 'number' ||
          typeof item.finalScore === 'number' ||
          Boolean(item.gradeOverride))
      ) {
        gradedCount += 1;
      }
    }
  }

  let hasCollectionScores = false;
  if (sheet.collectionScores && typeof sheet.collectionScores === 'object') {
    for (const arr of Object.values(sheet.collectionScores)) {
      if (Array.isArray(arr) && arr.some((v) => typeof v === 'number' && Number.isFinite(v))) {
        hasCollectionScores = true;
        break;
      }
    }
  }

  return { gradedCount, hasCollectionScores };
}

/** Aggregate attendance records and grade sheets across filtered instructor courses. */
export function buildInstructorDashboardSummary(
  courses: WorkloadCourseItem[],
  attendanceRecords: AttendanceRecord[],
  gradesMap: Record<string, CourseGradeSheet>,
  todayDayOfWeek: number,
  _stats?: WorkloadStats,
): InstructorDashboardSummary {
  const dailyBuckets = buildDailyWorkloadDistribution(courses);
  const teachingDaysCount = dailyBuckets.filter((b) => b.coursesCount > 0).length;
  const schedule = getTodayAndUpcomingCourses(courses, todayDayOfWeek);

  // Index attendance dates by normalized course code
  const attDatesByCode = new Map<string, Set<string>>();
  for (const rec of attendanceRecords) {
    const key = normalizeCodeKey(rec.courseCode);
    if (!key || !rec.date) continue;
    let set = attDatesByCode.get(key);
    if (!set) {
      set = new Set<string>();
      attDatesByCode.set(key, set);
    }
    set.add(rec.date.slice(0, 10));
  }

  // Index grade sheets by normalized course code
  const normalizedGrades = new Map<string, CourseGradeSheet>();
  for (const [rawKey, sheet] of Object.entries(gradesMap || {})) {
    const key = normalizeCodeKey(sheet?.courseCode || rawKey);
    if (key && sheet) {
      normalizedGrades.set(key, sheet);
    }
  }

  const courseProgress: CourseProgressItem[] = [];
  let coursesWithAttendance = 0;
  let coursesWithGrades = 0;
  let coursesWithCollection = 0;
  let totalCheckedSessions = 0;
  const pendingAttendanceCourses: WorkloadCourseItem[] = [];
  const pendingGradeCourses: WorkloadCourseItem[] = [];

  for (const course of courses) {
    const codeKey = normalizeCodeKey(course.courseCode);
    const datesSet = attDatesByCode.get(codeKey);
    const sortedDates = datesSet ? Array.from(datesSet).sort((a, b) => b.localeCompare(a)) : [];
    const attendanceDatesCount = sortedDates.length;
    const lastAttendanceDate = sortedDates[0] || null;

    const sheet = normalizedGrades.get(codeKey);
    const { gradedCount, hasCollectionScores } = countNonEmptyScores(sheet);
    const hasGradeSheet = gradedCount > 0 || hasCollectionScores;

    if (attendanceDatesCount > 0) {
      coursesWithAttendance += 1;
      totalCheckedSessions += attendanceDatesCount;
    } else {
      pendingAttendanceCourses.push(course);
    }

    if (hasGradeSheet) {
      coursesWithGrades += 1;
    } else {
      pendingGradeCourses.push(course);
    }

    if (hasCollectionScores) {
      coursesWithCollection += 1;
    }

    courseProgress.push({
      course,
      attendanceDatesCount,
      lastAttendanceDate,
      hasGradeSheet,
      gradedStudentsCount: gradedCount,
      hasCollectionScores,
    });
  }

  return {
    dailyBuckets,
    teachingDaysCount,
    schedule,
    courseProgress,
    coursesWithAttendance,
    coursesWithGrades,
    coursesWithCollection,
    totalCheckedSessions,
    pendingAttendanceCourses,
    pendingGradeCourses,
  };
}
