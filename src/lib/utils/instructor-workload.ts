import { Course, TimetableItem, UserAccount } from '@/types';
import { matchInstructorStrict } from './name-matcher';

export interface WorkloadCourseItem {
  id: string;
  sectionKey: string;
  attendanceSectionKey: string;
  courseCode: string;
  courseName: string;
  courseNameEn?: string;
  credits: number;
  academicYear: string;
  semester: number;
  yearLevel: number;
  degreeLevel: string;
  programType: 'THAI' | 'ENGLISH';
  major: string;
  sharedMajors: string[];
  dayOfWeek: number;
  dayLabel: string;
  dayShort: string;
  startTime: string;
  endTime: string;
  room: string;
  instructor: string;
  timetableTitle: string;
  source: 'TIMETABLE' | 'COURSE';
}

export interface WorkloadFilters {
  search?: string;
  degreeLevel?: string;
  yearLevel?: string;
  programType?: 'ALL' | 'THAI' | 'ENGLISH';
  academicYear?: string;
  semester?: string;
}

export interface WorkloadStats {
  totalCourses: number;
  totalCredits: number;
  weeklyHours: number;
  thaiCourses: number;
  englishCourses: number;
}

const DAY_LABELS_TH: Record<number, string> = {
  1: 'วันจันทร์',
  2: 'วันอังคาร',
  3: 'วันพุธ',
  4: 'วันพฤหัสบดี',
  5: 'วันศุกร์',
  6: 'วันเสาร์',
  7: 'วันอาทิตย์',
};

const DAY_SHORTS_TH: Record<number, string> = {
  1: 'จ.',
  2: 'อ.',
  3: 'พ.',
  4: 'พฤ.',
  5: 'ศ.',
  6: 'ส.',
  7: 'อา.',
};

export function normalizeTimeSlot(val?: string): string {
  if (!val) return '';
  let str = String(val).trim().replace(':', '.');
  if (/^\d{1,2}\.\d$/.test(str)) str += '0';
  if (/^\d{1,2}$/.test(str)) str += '.00';
  if (/^\d\./.test(str)) str = '0' + str;
  return str;
}

export function getDayLabelThai(day?: number | string): string {
  return DAY_LABELS_TH[Number(day)] || '';
}

export function getDayShortThai(day?: number | string): string {
  return DAY_SHORTS_TH[Number(day)] || '';
}

export function inferDegreeLevel(rawDegree?: string, timetableTitle?: string): string {
  const clean = (rawDegree || '').trim();
  if (clean) return clean;
  const tt = (timetableTitle || '').trim();
  if (/ดุษฎีบัณฑิต|ป\.?เอก|Ph\.?D/i.test(tt)) return 'ปริญญาเอก';
  if (/มหาบัณฑิต|ป\.?โท|Master/i.test(tt)) return 'ปริญญาโท';
  if (/ประกาศนียบัตร|ป\.?บ\.|ป\.?ว\.|Cert/i.test(tt)) return 'ประกาศนียบัตร';
  return 'ปริญญาตรี';
}

export function inferProgramType(
  rawProgram?: string,
  timetableTitle?: string,
  courseName?: string
): 'THAI' | 'ENGLISH' {
  const prog = (rawProgram || '').trim().toUpperCase();
  if (prog === 'ENGLISH' || prog === 'INTERNATIONAL') return 'ENGLISH';
  if (prog === 'THAI') return 'THAI';

  const tt = (timetableTitle || '').trim();
  const cn = (courseName || '').trim();
  if (
    /ภาษาอังกฤษ|inter|eng|english|นานาชาติ/i.test(tt) ||
    (cn.length > 0 && /^[A-Za-z0-9\s:,\-\(\)\/\.\*]+$/.test(cn))
  ) {
    return 'ENGLISH';
  }
  return 'THAI';
}

function extractMajor(rawMajor?: string, timetableTitle?: string): string {
  if (rawMajor && rawMajor.trim()) return rawMajor.trim();
  const title = (timetableTitle || '').trim();
  if (!title) return '';
  if (title.includes('พระพุทธศาสนา')) return 'พระพุทธศาสนา';
  if (title.includes('วิปัสสนาภาวนา')) return 'วิปัสสนาภาวนา';
  if (title.includes('ศาสนาและปรัชญา')) return 'ศาสนาและปรัชญา';
  if (title.includes('บาลีสันสกฤต')) return 'บาลีสันสกฤต';
  const match = title.match(/สาขาวิชา([^(]+)/);
  return match && match[1] ? match[1].trim() : '';
}

export function parseTimeToMinutes(val?: string): number | null {
  if (!val) return null;
  const normalized = normalizeTimeSlot(val);
  const m = normalized.match(/^(\d{1,2})\.(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function buildInstructorWorkloadCourses(
  user: Pick<UserAccount, 'name' | 'nameEn' | 'aliases'> | null | undefined,
  timetablesList: TimetableItem[],
  coursesList: Course[]
): WorkloadCourseItem[] {
  if (!user) return [];

  const normCode = (s?: string) => String(s || '').replace(/\s+/g, '').toUpperCase();

  // Build quick lookup from Courses catalog for credits, English title, degreeLevel
  const courseLookup = new Map<string, Course>();
  for (const c of coursesList) {
    const code = normCode(c.courseCode);
    if (!code) continue;
    const yr = String(c.academicYear || '2569').trim();
    const sem = String(c.semester || 1).trim();
    const prog = inferProgramType(c.programType, '', c.courseName);
    courseLookup.set(`${code}__${yr}__${sem}__${prog}`, c);
    if (!courseLookup.has(`${code}__${prog}`)) {
      courseLookup.set(`${code}__${prog}`, c);
    }
    if (!courseLookup.has(code)) {
      courseLookup.set(code, c);
    }
  }

  const groupedMap = new Map<string, WorkloadCourseItem>();
  const coveredCourseKeys = new Set<string>();

  for (const t of timetablesList) {
    if (!matchInstructorStrict(user, t.instructor)) continue;

    const code = normCode(t.courseCode);
    const yr = String(t.academicYear || '2569').trim();
    const sem = Number(t.semester) || 1;
    const yearLevel = Number(t.yearLevel) || 1;
    const day = Number(t.dayOfWeek) || 1;
    const startNorm = normalizeTimeSlot(t.startTime || '');
    const endNorm = normalizeTimeSlot(t.endTime || '');
    const programType = inferProgramType(t.programType, t.timetableTitle, t.courseName);

    const catalogMatch =
      courseLookup.get(`${code}__${yr}__${sem}__${programType}`) ||
      courseLookup.get(`${code}__${programType}`) ||
      courseLookup.get(code);

    const degreeLevel = inferDegreeLevel(
      t.degreeLevel || catalogMatch?.degreeLevel,
      t.timetableTitle
    );
    const major = extractMajor(t.major || catalogMatch?.major, t.timetableTitle);

    const attendanceSectionKey = `${code}__${programType === 'ENGLISH' ? 'EN' : 'TH'}__Y${yearLevel}__D${day}__T${(t.startTime || '').trim()}`;
    const sectionKey = `${code}__${programType}__AY${yr}__S${sem}__Y${yearLevel}__D${day}__T${startNorm}`;

    const existing = groupedMap.get(sectionKey);
    if (!existing) {
      groupedMap.set(sectionKey, {
        id: sectionKey,
        sectionKey,
        attendanceSectionKey,
        courseCode: (t.courseCode || '').trim(),
        courseName: (t.courseName || catalogMatch?.courseName || '').trim(),
        courseNameEn: catalogMatch?.courseNameEn || undefined,
        credits: Number(catalogMatch?.credits) || 3,
        academicYear: yr,
        semester: sem,
        yearLevel,
        degreeLevel,
        programType,
        major,
        sharedMajors: major ? [major] : [],
        dayOfWeek: day,
        dayLabel: getDayLabelThai(day),
        dayShort: getDayShortThai(day),
        startTime: startNorm,
        endTime: endNorm,
        room: (t.room || catalogMatch?.room || '').trim(),
        instructor: (t.instructor || user.name || '').trim(),
        timetableTitle: (t.timetableTitle || '').trim(),
        source: 'TIMETABLE',
      });
      coveredCourseKeys.add(`${code}__${yr}__${sem}__${programType}`);
    } else {
      if (major && !existing.sharedMajors.includes(major)) {
        existing.sharedMajors.push(major);
      }
      if ((t.instructor || '').length > existing.instructor.length) {
        existing.instructor = (t.instructor || '').trim();
      }
    }
  }

  for (const c of coursesList) {
    const instText = c.instructor || c.primaryTeacherName || '';
    if (!matchInstructorStrict(user, instText)) continue;

    const code = normCode(c.courseCode);
    const yr = String(c.academicYear || '2569').trim();
    const sem = Number(c.semester) || 1;
    const programType = inferProgramType(c.programType, '', c.courseName);
    const courseKey = `${code}__${yr}__${sem}__${programType}`;
    if (coveredCourseKeys.has(courseKey)) continue;

    const yearLevel = Number(c.yearLevel) || 1;
    const day = Number(c.dayOfWeek) || 1;
    const startNorm = normalizeTimeSlot(c.startTime || '');
    const endNorm = normalizeTimeSlot(c.endTime || '');
    const degreeLevel = inferDegreeLevel(c.degreeLevel, '');
    const major = extractMajor(c.major, '');

    const attendanceSectionKey = `${code}__${programType === 'ENGLISH' ? 'EN' : 'TH'}__Y${yearLevel}__D${day}__T${(c.startTime || '').trim()}`;
    const sectionKey = `${code}__${programType}__AY${yr}__S${sem}__Y${yearLevel}__D${day}__T${startNorm}`;

    if (!groupedMap.has(sectionKey)) {
      groupedMap.set(sectionKey, {
        id: c.id || sectionKey,
        sectionKey,
        attendanceSectionKey,
        courseCode: (c.courseCode || '').trim(),
        courseName: (c.courseName || '').trim(),
        courseNameEn: c.courseNameEn || undefined,
        credits: Number(c.credits) || 3,
        academicYear: yr,
        semester: sem,
        yearLevel,
        degreeLevel,
        programType,
        major,
        sharedMajors: major ? [major] : [],
        dayOfWeek: day,
        dayLabel: getDayLabelThai(day),
        dayShort: getDayShortThai(day),
        startTime: startNorm,
        endTime: endNorm,
        room: (c.room || '').trim(),
        instructor: instText.trim(),
        timetableTitle: programType === 'ENGLISH' ? 'หลักสูตรภาษาอังกฤษ' : 'ภาคภาษาไทย',
        source: 'COURSE',
      });
      coveredCourseKeys.add(courseKey);
    }
  }

  const items = Array.from(groupedMap.values());
  items.sort((a, b) => {
    const yearCmp = b.academicYear.localeCompare(a.academicYear);
    if (yearCmp !== 0) return yearCmp;
    if (a.semester !== b.semester) return a.semester - b.semester;
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    const timeCmp = a.startTime.localeCompare(b.startTime);
    if (timeCmp !== 0) return timeCmp;
    return a.courseCode.localeCompare(b.courseCode);
  });

  return items;
}

export function filterWorkloadCourses(
  items: WorkloadCourseItem[],
  filters: WorkloadFilters
): WorkloadCourseItem[] {
  const q = (filters.search || '').trim().toLowerCase();

  return items.filter((item) => {
    if (filters.degreeLevel && filters.degreeLevel !== 'ALL' && item.degreeLevel !== filters.degreeLevel) {
      return false;
    }
    if (filters.yearLevel && filters.yearLevel !== 'ALL' && String(item.yearLevel) !== String(filters.yearLevel)) {
      return false;
    }
    if (filters.programType && filters.programType !== 'ALL' && item.programType !== filters.programType) {
      return false;
    }
    if (filters.academicYear && filters.academicYear !== 'ALL' && item.academicYear !== filters.academicYear) {
      return false;
    }
    if (filters.semester && filters.semester !== 'ALL' && String(item.semester) !== String(filters.semester)) {
      return false;
    }
    if (q) {
      const hay = [
        item.courseCode,
        item.courseName,
        item.courseNameEn || '',
        item.room,
        item.major,
        ...item.sharedMajors,
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function computeWorkloadStats(items: WorkloadCourseItem[]): WorkloadStats {
  let totalCredits = 0;
  let totalMinutes = 0;
  let thaiCourses = 0;
  let englishCourses = 0;

  for (const item of items) {
    totalCredits += Number(item.credits) || 0;
    if (item.programType === 'ENGLISH') {
      englishCourses++;
    } else {
      thaiCourses++;
    }
    const startMin = parseTimeToMinutes(item.startTime);
    const endMin = parseTimeToMinutes(item.endTime);
    if (startMin !== null && endMin !== null && endMin > startMin) {
      totalMinutes += endMin - startMin;
    }
  }

  return {
    totalCourses: items.length,
    totalCredits,
    weeklyHours: Math.round((totalMinutes / 60) * 10) / 10,
    thaiCourses,
    englishCourses,
  };
}
