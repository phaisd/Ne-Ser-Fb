import { Course, TimetableItem } from '@/types';
import { readLocalJson, getSheetsClient } from './storageHelper';
import { getCourses } from './courseService';

interface RawScheduleSlot {
  courseCode?: string;
  courseName?: string;
  dayOfWeek?: number | string;
  startTime?: string;
  endTime?: string;
  room?: string;
  instructor?: string;
  periodLabel?: string;
}

interface RawTimetableEntry {
  academicYear?: string | number;
  semester?: number | string;
  yearLevel?: number | string;
  titleTh?: string;
  titleEn?: string;
  room?: string;
  scheduleData?: RawScheduleSlot[];
}

export function formatTimeSlotString(val: string): string {
  const clean = String(val || '').trim();
  if (!clean) return '';
  // Normalize e.g. "9" -> "09.00", "11.3" -> "11.30", "12.3" -> "12.30", "15.1" -> "15.10", "13:00" -> "13.00"
  const norm = clean.replace(':', '.');
  if (/^\d{1,2}$/.test(norm)) {
    return `${norm.padStart(2, '0')}.00`;
  }
  const m = norm.match(/^(\d{1,2})\.(\d{1,2})$/);
  if (m) {
    return `${m[1].padStart(2, '0')}.${m[2].padEnd(2, '0')}`;
  }
  return norm;
}

export function parseTimetableMetadata(titleTh = '', titleEn = ''): {
  degreeLevel: string;
  programType: 'THAI' | 'ENGLISH';
  major: string;
} {
  const fullText = (titleTh + ' ' + titleEn).trim();

  let degreeLevel = 'ปริญญาตรี';
  if (/ดุษฎีบัณฑิต|Ph\.?D/i.test(fullText)) {
    degreeLevel = 'ปริญญาเอก';
  } else if (/มหาบัณฑิต|Master/i.test(fullText)) {
    degreeLevel = 'ปริญญาโท';
  } else if (/บัณฑิต|Bachelor/i.test(fullText)) {
    degreeLevel = 'ปริญญาตรี';
  }

  let programType: 'THAI' | 'ENGLISH' = 'THAI';
  if (/ภาษาอังกฤษ|english|inter|นานาชาติ/i.test(fullText)) {
    programType = 'ENGLISH';
  }

  let major = '';
  const majorMatch = titleTh.match(/สาขาวิชา([^(]+)/);
  if (majorMatch && majorMatch[1]) {
    major = majorMatch[1].trim();
  } else if (/พระพุทธศาสนา|buddhism/i.test(fullText)) {
    major = 'พระพุทธศาสนา';
  } else if (/ศาสนาและปรัชญา|philosophy/i.test(fullText)) {
    major = 'ศาสนาและปรัชญา';
  } else if (/วิปัสสนาภาวนา|meditation/i.test(fullText)) {
    major = 'วิปัสสนาภาวนา';
  } else if (/บาลี|pali/i.test(fullText)) {
    major = 'บาลีสันสกฤต';
  } else {
    major = 'ทั่วไป';
  }

  return { degreeLevel, programType, major };
}

function collectInstructorNames(raw: string | undefined, target: Set<string>): void {
  if (!raw) return;
  raw.split('/').forEach((inst) => {
    const clean = inst.replace(/\*/g, '').trim();
    if (clean) target.add(clean);
  });
}

export async function getTimetables(): Promise<TimetableItem[]> {
  const norm = (s?: string) => String(s || '').replace(/\s+/g, '').toUpperCase();
  const rawTimetables = readLocalJson<RawTimetableEntry[]>('timetables.json', []);
  const localCourses = readLocalJson<Course[]>('courses.json', []);
  const courseInstructorMap = new Map<string, string>();
  for (const c of localCourses) {
    if (c.courseCode && c.instructor) {
      const yr = String(c.academicYear || '2569').trim();
      const sem = Number(c.semester) || 1;
      courseInstructorMap.set(`${norm(c.courseCode)}__${yr}__${sem}`, c.instructor.trim());
      if (!courseInstructorMap.has(norm(c.courseCode))) {
        courseInstructorMap.set(norm(c.courseCode), c.instructor.trim());
      }
    }
  }

  const seenLocal = new Set<string>();
  const flattenedLocal: TimetableItem[] = [];
  const localSlotMap = new Map<string, TimetableItem>();

  for (const t of rawTimetables) {
    const meta = parseTimetableMetadata(t.titleTh || '', t.titleEn || '');
    const tYear = String(t.academicYear || '2569').trim();
    const tSem = Number(t.semester) || 1;
    const schedules = Array.isArray(t.scheduleData) ? t.scheduleData : [];
    for (const s of schedules) {
      const startNorm = formatTimeSlotString(s.startTime || '');
      const endNorm = formatTimeSlotString(s.endTime || '');
      const dayNum =
        typeof s.dayOfWeek === 'number'
          ? s.dayOfWeek
          : parseInt(String(s.dayOfWeek || '1'), 10) || 1;
      const codeNorm = norm(s.courseCode);
      const instructor = (
        s.instructor ||
        courseInstructorMap.get(`${codeNorm}__${tYear}__${tSem}`) ||
        courseInstructorMap.get(codeNorm) ||
        ''
      ).trim();
      const item: TimetableItem = {
        academicYear: String(t.academicYear || '2569').trim(),
        semester: Number(t.semester) || 1,
        yearLevel: Number(t.yearLevel) || 1,
        timetableTitle: (t.titleTh || '').trim(),
        courseCode: (s.courseCode || '').trim(),
        courseName: (s.courseName || '').trim(),
        dayOfWeek: dayNum,
        startTime: startNorm,
        endTime: endNorm,
        room: (s.room || t.room || '').trim(),
        instructor,
        periodLabel: (s.periodLabel || '').trim(),
        degreeLevel: meta.degreeLevel,
        programType: meta.programType,
        major: meta.major,
      };

      const slotKey = `${item.timetableTitle}_${item.courseCode}_${item.dayOfWeek}_${startNorm}`;
      localSlotMap.set(slotKey, item);
      localSlotMap.set(`${item.timetableTitle}_${item.courseCode}_${item.dayOfWeek}`, item);
      localSlotMap.set(`${item.timetableTitle}_${codeNorm}_${item.dayOfWeek}_${startNorm}`, item);
      localSlotMap.set(`${item.timetableTitle}_${codeNorm}_${item.dayOfWeek}`, item);
      localSlotMap.set(`${codeNorm}_${item.dayOfWeek}_${startNorm}`, item);
      localSlotMap.set(codeNorm, item);

      const dedupKey = `${item.timetableTitle}_${item.courseCode}_${item.dayOfWeek}_${startNorm}_${item.room}`;
      if (!seenLocal.has(dedupKey)) {
        seenLocal.add(dedupKey);
        flattenedLocal.push(item);
      }
    }
  }

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Timetables!A2:Z');
      if (rows && rows.length > 0) {
        const seen = new Set<string>();
        const list: TimetableItem[] = [];
        const validPeriodRegex = /^(เช้า|บ่าย|บ่าย\s*1|บ่าย\s*2|ค่ำ|Morning|Afternoon|Late Afternoon)$/i;

        for (const r of rows) {
          const title = (r[3] || '').trim();
          const code = (r[4] || '').trim();
          if (!code) continue;
          const dayNum = r[6] ? parseInt(r[6], 10) : 1;
          const startNorm = formatTimeSlotString(r[7] || '');
          const endNorm = formatTimeSlotString(r[8] || '');

          const tail = r
            .slice(9)
            .map((cell: unknown) => String(cell ?? '').trim())
            .filter((cell: string) => cell.length > 0);

          let room = '';
          let instructor = '';
          let periodLabel = '';

          if (tail.length > 0 && validPeriodRegex.test(tail[tail.length - 1])) {
            periodLabel = tail.pop()!;
          }

          if (tail.length === 1) {
            room = tail[0];
          } else if (tail.length >= 2) {
            if (/^\d{3}(\/\d+)?$/.test(tail[1])) {
              room = `${tail[0]}, ${tail[1]}`;
              instructor = tail.slice(2).join(', ');
            } else {
              room = tail[0];
              instructor = tail.slice(1).join(', ');
            }
          }

          const codeNorm = norm(code);
          const localMatch =
            localSlotMap.get(`${title}_${code}_${dayNum}_${startNorm}`) ||
            localSlotMap.get(`${title}_${code}_${dayNum}`) ||
            localSlotMap.get(`${title}_${codeNorm}_${dayNum}_${startNorm}`) ||
            localSlotMap.get(`${title}_${codeNorm}_${dayNum}`) ||
            localSlotMap.get(`${codeNorm}_${dayNum}_${startNorm}`) ||
            localSlotMap.get(codeNorm);

          if (localMatch) {
            if (localMatch.instructor) {
              instructor = localMatch.instructor;
            }
            if (!room && localMatch.room) {
              room = localMatch.room;
            }
            if (!periodLabel && localMatch.periodLabel) {
              periodLabel = localMatch.periodLabel;
            }
          }

          if (courseInstructorMap.has(codeNorm) && courseInstructorMap.get(codeNorm)) {
            instructor = courseInstructorMap.get(codeNorm)!;
          }

          const key = `${title}_${code}_${dayNum}_${startNorm}_${room}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const meta = parseTimetableMetadata(title);
          list.push({
            academicYear: (r[0] || '2569').trim(),
            semester: r[1] ? parseInt(r[1], 10) : 1,
            yearLevel: r[2] ? parseInt(r[2], 10) : 1,
            timetableTitle: title,
            courseCode: code,
            courseName: (r[5] || '').trim(),
            dayOfWeek: dayNum,
            startTime: startNorm,
            endTime: endNorm,
            room,
            instructor,
            periodLabel,
            degreeLevel: meta.degreeLevel,
            programType: meta.programType,
            major: meta.major,
          });
        }
        return list;
      }
    } catch (err) {
      console.warn('Google Sheets read error for Timetables, falling back to local file:', err);
    }
  }

  return flattenedLocal;
}

export async function getInstructors(): Promise<string[]> {
  const [timetables, courses] = await Promise.all([getTimetables(), getCourses()]);
  const set = new Set<string>();
  for (const t of timetables) {
    collectInstructorNames(t.instructor, set);
  }
  for (const c of courses) {
    collectInstructorNames(c.instructor, set);
  }
  return Array.from(set).sort();
}
