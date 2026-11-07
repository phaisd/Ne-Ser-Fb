import { Student } from './types';

/**
 * CSV / TSV Parser Helper for Batch Student Import & Upsert
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

  const headers = parseLine(headerLine).map((h) => h.toLowerCase().replace(/[\s\-_]/g, ''));
  const parsedList: Partial<Student>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const obj: Record<string, string> = {};

    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });

    const studentCode = (
      obj['studentcode'] ||
      obj['รหัสนิสิต'] ||
      obj['รหัส'] ||
      obj['code'] ||
      obj['id'] ||
      values[0] ||
      ''
    ).trim();

    if (!studentCode) continue;

    const title = obj['title'] || obj['คำนำหน้า'] || '';
    const firstName = obj['firstname'] || obj['ชื่อ'] || obj['ชื่อตัว'] || '';
    const lastName = obj['lastname'] || obj['นามสกุล'] || '';
    let fullName = obj['fullname'] || obj['ชื่อเต็ม'] || obj['ชื่อ-นามสกุล'] || obj['ชื่อและนามสกุล'] || obj['name'] || '';
    if (!fullName && (firstName || lastName)) {
      fullName = `${title} ${firstName} ${lastName}`.trim();
    }

    const rawStatus = obj['studystatus'] || obj['สถานภาพ'] || obj['สถานะ'] || obj['status'] || '';
    let studyStatus = rawStatus;
    if (rawStatus.includes('ย้ายเข้า') || rawStatus.toLowerCase().includes('transfer in')) studyStatus = 'ย้ายเข้า';
    else if (rawStatus.includes('ย้ายออก') || rawStatus.toLowerCase().includes('transfer out')) studyStatus = 'ย้ายออก';
    else if (rawStatus.includes('เทียบโอน') || rawStatus.toLowerCase().includes('credit transfer')) studyStatus = 'เทียบโอน';
    else if (rawStatus.includes('พัก') || rawStatus.toLowerCase().includes('leave')) studyStatus = 'พักการเรียน';
    else if (rawStatus.includes('สำเร็จ') || rawStatus.toLowerCase().includes('graduat')) studyStatus = 'สำเร็จการศึกษา';
    else if (rawStatus.includes('พ้น') || rawStatus.toLowerCase().includes('dismiss')) studyStatus = 'พ้นสภาพ';
    else if (rawStatus.includes('ปกติ') || rawStatus.toLowerCase().includes('normal')) studyStatus = 'ปกติ';

    const rawProg = (obj['programtype'] || obj['หลักสูตร'] || obj['program'] || obj['ภาค'] || '').toLowerCase();
    let programType: 'THAI' | 'ENGLISH' | undefined;
    if (rawProg.includes('en') || rawProg.includes('eng') || rawProg.includes('inter') || rawProg.includes('อังกฤษ')) {
      programType = 'ENGLISH';
    } else if (rawProg.includes('th') || rawProg.includes('thai') || rawProg.includes('ไทย')) {
      programType = 'THAI';
    }

    const remarks = obj['remarks'] || obj['หมายเหตุ'] || obj['remark'] || obj['note'] || '';
    const rawYear = obj['yearlevel'] || obj['ชั้นปี'] || obj['ปี'] || obj['year'] || '';
    const yearLevel = rawYear ? parseInt(rawYear.replace(/[^0-9]/g, ''), 10) : undefined;
    const major = obj['major'] || obj['สาขาวิชา'] || obj['สาขา'] || '';
    const department = obj['department'] || obj['ภาควิชา'] || '';
    const faculty = obj['faculty'] || obj['คณะ'] || '';
    const degree = obj['degree'] || obj['ระดับการศึกษา'] || '';
    const phoneNumber = obj['phonenumber'] || obj['เบอร์โทร'] || obj['เบอร์โทรศัพท์'] || obj['โทร'] || obj['phone'] || '';
    const email = obj['email'] || obj['อีเมล'] || obj['mail'] || '';
    const nationality = obj['nationality'] || obj['สัญชาติ'] || '';
    const country = obj['country'] || obj['ประเทศ'] || '';
    const passportNo = obj['passportno'] || obj['เลขพาสปอร์ต'] || obj['passport'] || '';
    const visaExpireDate = obj['visaexpiredate'] || obj['วันหมดอายุวีซ่า'] || obj['visaexpire'] || '';

    const studentItem: Partial<Student> = {
      studentCode,
      ...(title && { title }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(fullName && { fullName }),
      ...(studyStatus && { studyStatus }),
      ...(programType && { programType }),
      ...(remarks !== undefined && remarks !== '' && { remarks }),
      ...(yearLevel && { yearLevel }),
      ...(major && { major }),
      ...(department && { department }),
      ...(faculty && { faculty }),
      ...(degree && { degree }),
      ...(phoneNumber && { phoneNumber }),
      ...(email && { email }),
      ...(nationality && { nationality }),
      ...(country && { country }),
      ...(passportNo && { passportNo }),
      ...(visaExpireDate && { visaExpireDate }),
    };

    parsedList.push(studentItem);
  }

  return parsedList;
}
