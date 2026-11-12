import { Student } from './types';

export const DEGREE_OPTIONS = [
  'ปริญญาตรี',
  'ปริญญาโท',
  'ปริญญาเอก',
  'ใบประกาศนียบัตร',
] as const;

export const STUDENT_CSV_HEADERS = [
  'รหัสนิสิต',
  'คำนำหน้า',
  'ชื่อ',
  'นามสกุล',
  'ระดับการศึกษา',
  'หลักสูตร',
  'สาขาวิชา',
  'คณะ',
  'ชั้นปี',
  'สัญชาติ',
  'เลขประจำตัวประชาชน/Passport',
  'สถานภาพ',
  'เกรดเฉลี่ยสะสม (GPA)',
  'ที่อยู่',
  'อีเมล',
  'หมายเหตุ',
] as const;

export function normalizeDegree(raw?: string): string {
  const v = (raw || '').trim();
  if (!v) return '';
  const lower = v.toLowerCase();
  if (v.includes('เอก') || lower.includes('phd') || lower.includes('doctor')) {
    return 'ปริญญาเอก';
  }
  if (v.includes('โท') || lower.includes('master')) {
    return 'ปริญญาโท';
  }
  if (v.includes('ประกาศนีย') || lower.includes('cert') || lower.includes('diploma')) {
    return 'ใบประกาศนียบัตร';
  }
  if (v.includes('ตรี') || lower.includes('bachelor')) {
    return 'ปริญญาตรี';
  }
  return v;
}

export function buildStudentsCSVContent(list: Student[]): string {
  const rows = list.map((s) => [
    s.studentCode || '',
    s.title || '',
    s.firstName || '',
    s.lastName || '',
    normalizeDegree(s.degree) || 'ปริญญาตรี',
    s.programType === 'ENGLISH' ? 'International' : 'Regular',
    s.major || 'พระพุทธศาสนา',
    s.faculty || 'คณะพุทธศาสตร์',
    String(s.yearLevel || 1),
    s.nationality || (s.programType === 'ENGLISH' ? 'ต่างชาติ' : 'ไทย'),
    s.passportNo || '',
    s.studyStatus || 'ปกติ',
    s.gpa !== undefined && s.gpa !== null ? String(s.gpa) : '',
    s.address || '',
    s.email || '',
    s.remarks || '',
  ]);

  return (
    '\uFEFF' +
    [
      STUDENT_CSV_HEADERS.join(','),
      ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n')
  );
}

export function downloadStudentsCSV(list: Student[], filename: string): void {
  const csvContent = buildStudentsCSVContent(list);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSampleStudentsCSV(filename = 'sample_students_template.csv'): void {
  const sampleRows: string[][] = [
    [
      '6801502001',
      'พระ',
      'สมชาย',
      'ใจดี',
      'ปริญญาตรี',
      'Regular',
      'พระพุทธศาสนา',
      'คณะพุทธศาสตร์',
      '1',
      'ไทย',
      '',
      'ปกติ',
      '3.50',
      'วัดมหาธาตุ ต.ในเมือง อ.เมือง จ.นครพนม',
      'somchai@mcu.ac.th',
      'เอกสารครบถ้วน',
    ],
    [
      '6801502002',
      'Ven.',
      'Dhammapala',
      '',
      'ปริญญาโท',
      'International',
      'พระพุทธศาสนา',
      'คณะพุทธศาสตร์',
      '2',
      'Myanmar',
      'MB123456',
      'ปกติ',
      '3.75',
      'MCU Dormitory Phra Nakhon Si Ayutthaya',
      'dhammapala@mcu.ac.th',
      'นิสิตหลักสูตรนานาชาติ',
    ],
    [
      '6801502003',
      'นาย',
      'ประสิทธิ์',
      'มีชัย',
      'ใบประกาศนียบัตร',
      'Regular',
      'พระพุทธศาสนา',
      'คณะพุทธศาสตร์',
      '1',
      'ไทย',
      '',
      'เทียบโอน',
      '3.40',
      'ต.ลำผักกูด อ.ธัญบุรี จ.ปทุมธานี',
      'prasit@mcu.ac.th',
      'หลักสูตรใบประกาศนียบัตร',
    ],
  ];

  const csvContent =
    '\uFEFF' +
    [
      STUDENT_CSV_HEADERS.join(','),
      ...sampleRows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * CSV / TSV Parser Helper for Batch Student Import & Upsert
 * Supports the unified 16-column format (identical to Export CSV) as well as legacy templates.
 */
export function parseCSVToStudents(rawText: string): Partial<Student>[] {
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

  const normalizeKey = (k: string) =>
    k
      .toLowerCase()
      .replace(/[\s\-_()（）/\\.,:]/g, '')
      .trim();

  const headers = parseLine(headerLine).map(normalizeKey);
  const parsedList: Partial<Student>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const obj: Record<string, string> = {};

    headers.forEach((h, idx) => {
      if (h) obj[h] = values[idx] !== undefined ? values[idx].trim() : '';
    });

    const getVal = (exactKeys: string[], containsKeys: string[] = []): string => {
      for (const k of exactKeys) {
        const nk = normalizeKey(k);
        if (obj[nk] !== undefined && obj[nk] !== '') return obj[nk];
      }
      for (const ck of containsKeys) {
        const nck = normalizeKey(ck);
        const foundHeader = headers.find((h) => h.includes(nck));
        if (foundHeader && obj[foundHeader]) return obj[foundHeader];
      }
      return '';
    };

    const studentCode = (
      getVal(['รหัสนิสิต', 'studentcode', 'รหัส', 'code', 'id']) ||
      values[0] ||
      ''
    ).trim();

    if (!studentCode) continue;

    const title = getVal(['คำนำหน้า', 'title', 'prefix']);
    let firstName = getVal(['ชื่อ', 'firstname', 'ชื่อตัว']);
    const rawLastName = getVal(['นามสกุล', 'lastname', 'สกุล']);
    const lastName = rawLastName === '-' ? '' : rawLastName;
    let fullName = getVal(['ชื่อเต็ม', 'ชื่อนามสกุล', 'ชื่อสกุล', 'ชื่อและนามสกุล', 'fullname', 'name']);

    if (!firstName && fullName) {
      firstName = fullName;
    }
    if (!fullName && (firstName || lastName)) {
      const hasTitlePrefix = title && firstName.startsWith(title);
      fullName = `${hasTitlePrefix ? '' : title} ${firstName} ${lastName}`.replace(/\s+/g, ' ').trim();
    }

    const rawDegree = getVal(['ระดับการศึกษา', 'ระดับ', 'degree'], ['ระดับ']);
    const degree = normalizeDegree(rawDegree);

    const rawStatus = getVal(['สถานภาพ', 'studystatus', 'สถานะ', 'status']);
    let studyStatus = rawStatus;
    if (rawStatus.includes('ย้ายเข้า') || rawStatus.toLowerCase().includes('transfer in')) studyStatus = 'ย้ายเข้า';
    else if (rawStatus.includes('ย้ายออก') || rawStatus.toLowerCase().includes('transfer out')) studyStatus = 'ย้ายออก';
    else if (rawStatus.includes('เทียบโอน') || rawStatus.toLowerCase().includes('credit transfer')) studyStatus = 'เทียบโอน';
    else if (rawStatus.includes('พัก') || rawStatus.toLowerCase().includes('leave')) studyStatus = 'พักการเรียน';
    else if (rawStatus.includes('สำเร็จ') || rawStatus.toLowerCase().includes('graduat')) studyStatus = 'สำเร็จการศึกษา';
    else if (rawStatus.includes('พ้น') || rawStatus.toLowerCase().includes('dismiss')) studyStatus = 'พ้นสภาพ';
    else if (rawStatus.includes('ปกติ') || rawStatus.includes('กำลังศึกษา') || rawStatus.toLowerCase().includes('normal')) studyStatus = 'ปกติ';

    const rawProg = getVal(['หลักสูตร', 'programtype', 'program', 'ภาค']).toLowerCase();
    let programType: 'THAI' | 'ENGLISH' | undefined;
    if (
      rawProg.includes('en') ||
      rawProg.includes('eng') ||
      rawProg.includes('inter') ||
      rawProg.includes('อังกฤษ') ||
      rawProg.includes('นานาชาติ')
    ) {
      programType = 'ENGLISH';
    } else if (
      rawProg.includes('th') ||
      rawProg.includes('thai') ||
      rawProg.includes('reg') ||
      rawProg.includes('ไทย') ||
      rawProg.includes('ปกติ')
    ) {
      programType = 'THAI';
    }

    const remarks = getVal(['หมายเหตุ', 'remarks', 'remark', 'note']);
    const rawYear = getVal(['ชั้นปี', 'yearlevel', 'ปี', 'year']);
    const yearLevelNum = rawYear ? parseInt(rawYear.replace(/[^0-9]/g, ''), 10) : undefined;
    const yearLevel = yearLevelNum && !isNaN(yearLevelNum) ? yearLevelNum : undefined;

    const major = getVal(['สาขาวิชา', 'major', 'สาขา']);
    const department = getVal(['ภาควิชา', 'department']);
    const faculty = getVal(['คณะ', 'faculty']);
    const email = getVal(['อีเมล', 'email', 'mail']);
    const nationality = getVal(['สัญชาติ', 'nationality']);
    const country = getVal(['ประเทศ', 'country']);

    const rawPassport = getVal(
      ['เลขประจำตัวประชาชนpassport', 'passportno', 'เลขพาสปอร์ต', 'passport', 'nationalid', 'บัตรประชาชน'],
      ['passport', 'ประจำตัวประชาชน']
    );
    // Ignore masked passport strings (e.g. MC••••67) so re-importing a masked export never overwrites real data
    const passportNo = rawPassport && !rawPassport.includes('•') ? rawPassport : '';

    const rawGpa = getVal(
      ['เกรดเฉลี่ยสะสมgpa', 'เกรดเฉลี่ยgpa', 'gpa', 'เกรดเฉลี่ยสะสม', 'เกรดเฉลี่ย', 'เกรด'],
      ['gpa', 'เกรดเฉลี่ย']
    );
    const gpaNum = rawGpa ? parseFloat(rawGpa) : undefined;
    const gpa = gpaNum !== undefined && !isNaN(gpaNum) ? rawGpa : undefined;

    const address = getVal(['ที่อยู่', 'address']);
    const visaExpireDate = getVal(['วันหมดอายุวีซ่า', 'visaexpiredate', 'visaexpire']);

    const studentItem: Partial<Student> = {
      studentCode,
      ...(title && { title }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(fullName && { fullName }),
      ...(degree && { degree }),
      ...(studyStatus && { studyStatus }),
      ...(programType && { programType }),
      ...(remarks !== undefined && remarks !== '' && { remarks }),
      ...(yearLevel && { yearLevel }),
      ...(major && { major }),
      ...(department && { department }),
      ...(faculty && { faculty }),
      ...(email && { email }),
      ...(nationality && { nationality }),
      ...(country && { country }),
      ...(passportNo && { passportNo }),
      ...(gpa !== undefined && { gpa }),
      ...(address && { address }),
      ...(visaExpireDate && { visaExpireDate }),
    };

    parsedList.push(studentItem);
  }

  return parsedList;
}
