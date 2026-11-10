export interface Course {
  id?: string;
  courseCode: string;
  courseName: string;
  courseNameEn?: string;
  credits: number;
  programType?: 'THAI' | 'ENGLISH' | 'BILINGUAL';
  degreeLevel?: string;
  faculty?: string;
  department?: string;
  major?: string;
  yearLevel?: number;
  section?: string;
  term?: string;
  academicYear?: string;
  semester?: number;
  room?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  instructor?: string;
  description?: string;
  status?: string;
  isActive?: boolean;
}

export interface TimetableItem {
  academicYear: string;
  semester: number;
  yearLevel: number;
  timetableTitle: string;
  courseCode: string;
  courseName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  instructor?: string;
  periodLabel?: string;
}

export type CourseModalMode = 'NONE' | 'CREATE' | 'EDIT' | 'VIEW' | 'DELETE' | 'IMPORT';

export const DAYS_OF_WEEK = [
  {
    id: 1,
    label: 'วันจันทร์',
    color: 'bg-amber-400',
    rowBg: 'bg-amber-50/30 hover:bg-amber-50/60',
    borderLeft: 'border-l-4 border-l-amber-400',
    badgeBg: 'bg-amber-100/90 text-amber-900 border-amber-300/80',
    slotBg: 'border-amber-200/60 bg-amber-50/30 text-amber-600/70'
  },
  {
    id: 2,
    label: 'วันอังคาร',
    color: 'bg-pink-400',
    rowBg: 'bg-pink-50/30 hover:bg-pink-50/60',
    borderLeft: 'border-l-4 border-l-pink-400',
    badgeBg: 'bg-pink-100/90 text-pink-900 border-pink-300/80',
    slotBg: 'border-pink-200/60 bg-pink-50/30 text-pink-600/70'
  },
  {
    id: 3,
    label: 'วันพุธ',
    color: 'bg-emerald-400',
    rowBg: 'bg-emerald-50/30 hover:bg-emerald-50/60',
    borderLeft: 'border-l-4 border-l-emerald-400',
    badgeBg: 'bg-emerald-100/90 text-emerald-900 border-emerald-300/80',
    slotBg: 'border-emerald-200/60 bg-emerald-50/30 text-emerald-600/70'
  },
  {
    id: 4,
    label: 'วันพฤหัสบดี',
    color: 'bg-orange-400',
    rowBg: 'bg-orange-50/30 hover:bg-orange-50/60',
    borderLeft: 'border-l-4 border-l-orange-400',
    badgeBg: 'bg-orange-100/90 text-orange-900 border-orange-300/80',
    slotBg: 'border-orange-200/60 bg-orange-50/30 text-orange-600/70'
  },
  {
    id: 5,
    label: 'วันศุกร์',
    color: 'bg-sky-400',
    rowBg: 'bg-sky-50/30 hover:bg-sky-50/60',
    borderLeft: 'border-l-4 border-l-sky-400',
    badgeBg: 'bg-sky-100/90 text-sky-900 border-sky-300/80',
    slotBg: 'border-sky-200/60 bg-sky-50/30 text-sky-600/70'
  },
  {
    id: 6,
    label: 'วันเสาร์',
    color: 'bg-purple-400',
    rowBg: 'bg-purple-50/30 hover:bg-purple-50/60',
    borderLeft: 'border-l-4 border-l-purple-400',
    badgeBg: 'bg-purple-100/90 text-purple-900 border-purple-300/80',
    slotBg: 'border-purple-200/60 bg-purple-50/30 text-purple-600/70'
  },
  {
    id: 7,
    label: 'วันอาทิตย์',
    color: 'bg-rose-400',
    rowBg: 'bg-rose-50/30 hover:bg-rose-50/60',
    borderLeft: 'border-l-4 border-l-rose-400',
    badgeBg: 'bg-rose-100/90 text-rose-900 border-rose-300/80',
    slotBg: 'border-rose-200/60 bg-rose-50/30 text-rose-600/70'
  },
];

export const DEGREE_LEVELS = ['ปริญญาตรี', 'ปริญญาโท', 'ปริญญาเอก', 'ประกาศนียบัตร'];

export const MAJORS = [
  'พระพุทธศาสนา',
  'ศาสนาและปรัชญา',
  'วิปัสสนาภาวนา',
  'บาลีสันสกฤต',
];

// CSV Parser Helper
export function parseCSVToCourses(rawText: string): Course[] {
  const text = rawText.trim();
  if (!text) return [];

  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' || char === "'") {
      if (inQuotes && next === char) {
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' && next === '\n') || char === '\n' || char === '\r') {
      if (!inQuotes) {
        lines.push(current);
        current = '';
        if (char === '\r' && next === '\n') i++;
      } else {
        current += '\n';
      }
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current);
  if (lines.length < 2) return [];

  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const delimiter = headerLine.includes('\t') ? '\t' : ',';

  const parseLine = (line: string): string[] => {
    const cols: string[] = [];
    let col = '';
    let inQ = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      const n = line[j + 1];
      if (c === '"') {
        if (inQ && n === '"') {
          col += '"';
          j++;
        } else {
          inQ = !inQ;
        }
      } else if (c === delimiter && !inQ) {
        cols.push(col.trim());
        col = '';
      } else {
        col += c;
      }
    }
    cols.push(col.trim());
    return cols;
  };

  const headers = parseLine(headerLine).map((h) => h.toLowerCase().replace(/[\s\-_]/g, ''));
  const parsedCourses: Course[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const obj: Record<string, string> = {};

    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });

    const code =
      obj['coursecode'] ||
      obj['รหัสวิชา'] ||
      obj['code'] ||
      obj['รหัส'] ||
      obj['subjectcode'] ||
      values[0] ||
      '';

    const name =
      obj['coursename'] ||
      obj['ชื่อรายวิชา'] ||
      obj['ชื่อรายวิชา(ไทย)'] ||
      obj['ชื่อวิชา'] ||
      obj['ชื่อวิชาไทย'] ||
      obj['name'] ||
      obj['nameth'] ||
      values[1] ||
      '';

    if (!code.trim() || !name.trim()) continue;

    const nameEn =
      obj['coursenameen'] ||
      obj['ชื่อรายวิชา(อังกฤษ)'] ||
      obj['ชื่อภาษาอังกฤษ'] ||
      obj['nameen'] ||
      obj['englishname'] ||
      '';

    const creditsRaw =
      obj['credits'] ||
      obj['หน่วยกิต'] ||
      obj['credit'] ||
      obj['หน่วยกิตรวม'] ||
      '3';
    const credits = parseInt(creditsRaw.replace(/[^0-9]/g, '') || '3', 10);

    const progRaw = (
      obj['programtype'] ||
      obj['หลักสูตร'] ||
      obj['program'] ||
      obj['หลักสูตร(thaiหรือenglish)'] ||
      ''
    ).toLowerCase();

    const isEnglish =
      progRaw.includes('en') ||
      progRaw.includes('eng') ||
      progRaw.includes('นานาชาติ') ||
      progRaw.includes('inter') ||
      obj['section'] === 'EN' ||
      /^[A-Za-z0-9\s:,-]+$/.test(name);

    const dayRaw = (obj['dayofweek'] || obj['วันเรียน'] || obj['วัน'] || '1').toLowerCase();
    let dayOfWeek = 1;
    if (dayRaw.includes('จันทร์') || dayRaw === '1' || dayRaw.includes('mon')) dayOfWeek = 1;
    else if (dayRaw.includes('อังคาร') || dayRaw === '2' || dayRaw.includes('tue')) dayOfWeek = 2;
    else if (dayRaw.includes('พุธ') || dayRaw === '3' || dayRaw.includes('wed')) dayOfWeek = 3;
    else if (dayRaw.includes('พฤหัส') || dayRaw === '4' || dayRaw.includes('thu')) dayOfWeek = 4;
    else if (dayRaw.includes('ศุกร์') || dayRaw === '5' || dayRaw.includes('fri')) dayOfWeek = 5;
    else if (dayRaw.includes('เสาร์') || dayRaw === '6' || dayRaw.includes('sat')) dayOfWeek = 6;
    else if (dayRaw.includes('อาทิตย์') || dayRaw === '7' || dayRaw.includes('sun')) dayOfWeek = 7;

    parsedCourses.push({
      courseCode: code.trim(),
      courseName: name.trim(),
      courseNameEn: nameEn.trim(),
      credits: credits || 3,
      programType: isEnglish ? 'ENGLISH' : 'THAI',
      degreeLevel: obj['degreelevel'] || obj['ระดับหลักสูตร'] || obj['ระดับการศึกษา'] || 'ปริญญาตรี',
      major: obj['major'] || obj['สาขาวิชา'] || obj['สาขา'] || 'พระพุทธศาสนา',
      yearLevel: parseInt(obj['yearlevel'] || obj['ชั้นปี'] || '1', 10) || 1,
      section: obj['section'] || obj['ตอนเรียน'] || obj['กลุ่ม'] || (isEnglish ? 'EN' : '1'),
      academicYear: obj['academicyear'] || obj['ปีการศึกษา'] || '2569',
      semester: parseInt(obj['semester'] || obj['ภาคเรียน'] || obj['เทอม'] || '1', 10) || 1,
      instructor: obj['instructor'] || obj['อาจารย์ผู้สอน'] || obj['ผู้สอน'] || '',
      room: obj['room'] || obj['ห้องเรียน'] || obj['ห้อง'] || '',
      dayOfWeek: dayOfWeek,
      startTime: obj['starttime'] || obj['เวลาเริ่ม'] || '09.00',
      endTime: obj['endtime'] || obj['เวลาสิ้นสุด'] || '11.30',
      description: obj['description'] || obj['คำอธิบายรายวิชา'] || '',
    });
  }

  return parsedCourses;
}

export function downloadSampleCourseTemplate() {
  const headers = [
    'รหัสวิชา',
    'ชื่อรายวิชา (ไทย)',
    'ชื่อรายวิชา (อังกฤษ)',
    'หน่วยกิต',
    'หลักสูตร (THAI หรือ ENGLISH)',
    'ระดับหลักสูตร (ปริญญาตรี/ปริญญาโท)',
    'สาขาวิชา',
    'ชั้นปี',
    'ตอนเรียน (Section)',
    'ปีการศึกษา',
    'ภาคเรียน',
    'อาจารย์ผู้สอน',
    'วันเรียน (วันจันทร์-วันอาทิตย์)',
    'เวลาเริ่ม',
    'เวลาสิ้นสุด',
    'ห้องเรียน',
    'คำอธิบายรายวิชา',
  ];

  const sampleRows = [
    [
      '000 113',
      'ตรรกศาสตร์เบื้องต้น',
      'Introduction to Logic',
      '3',
      'THAI',
      'ปริญญาตรี',
      'ศาสนาและปรัชญา',
      '2',
      '1',
      '2569',
      '2',
      'พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.',
      'วันจันทร์',
      '12.30',
      '15.10',
      'อาคารเรียนรวม ชั้น 5 ห้อง D 516/2',
      'ศึกษาหลักการและกระบวนการคิดตามหลักตรรกศาสตร์',
    ],
    [
      '000 113',
      'Introduction to Logic',
      'Introduction to Logic',
      '3',
      'ENGLISH',
      'ปริญญาตรี',
      'พระพุทธศาสนา',
      '2',
      'EN',
      '2569',
      '2',
      'Ven. Dr. Dharma Priya Bhikkhu* / Phrasamu Kriengsak Sirisakko, Ph.D.',
      'วันพุธ',
      '09.00',
      '11.30',
      'Room No. D 519-520',
      'Basic principles of logic and reasoning in English medium',
    ],
  ];

  const csvContent =
    '\uFEFF' +
    [
      headers.join(','),
      ...sampleRows.map((r) => r.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'course_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}
