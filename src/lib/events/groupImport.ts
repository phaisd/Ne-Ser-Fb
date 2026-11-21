import type { EventRegistration } from '@/types/event';
import type { Student } from '@/types/student';

export interface GroupedParticipantInput {
  studentCode: string;
  studentName: string;
  groupSpecificCode?: string; // เลขเฉพาะกลุ่ม เช่น T101, T102, I301
  groupNumber?: number;
  groupName?: string;
  programType?: string;
  degreeLevel?: string;
  major?: string;
  yearLevel?: number;
  department?: string;
  role?: string;
  vasa?: string;
  remarks?: string;
  status?: 'REGISTERED' | 'ATTENDED' | 'CANCELLED';
  isDuplicate?: boolean;
  duplicateRow?: number;
  duplicateMessage?: string;
}

export interface GroupImportDuplicate {
  row: number; // 1-based row number
  originalRow: number; // 1-based row number where first found
  studentCode: string;
  studentName: string;
  groupSpecificCode?: string;
  duplicateType: 'both' | 'code' | 'name';
  message: string;
}

export interface ParsedGroupImportResult {
  items: GroupedParticipantInput[];
  warnings: string[];
  duplicates: GroupImportDuplicate[];
  detectedGroups: number[];
}

export interface GroupSummary {
  key: string;
  groupNumber?: number;
  groupName: string;
  count: number;
  sampleCodes: string[];
}

const HEADER_ALIASES: Record<string, keyof GroupedParticipantInput | 'ignore'> = {
  // เลขเฉพาะกลุ่ม (Group-specific code เช่น T101, T102, I301)
  groupspecificcode: 'groupSpecificCode',
  groupcode: 'groupSpecificCode',
  เลขเฉพาะกลุ่ม: 'groupSpecificCode',
  รหัสกลุ่มเฉพาะ: 'groupSpecificCode',
  รหัสเฉพาะกลุ่ม: 'groupSpecificCode',
  รหัสประจำกลุ่ม: 'groupSpecificCode',
  เลขประจำกลุ่ม: 'groupSpecificCode',

  // รหัสนิสิต (Student code เช่น 6701501011)
  studentcode: 'studentCode',
  code: 'studentCode',
  id: 'studentCode',
  รหัสนิสิต: 'studentCode',
  รหัส: 'studentCode',
  รหัสประจำตัว: 'studentCode',
  รหัสประจำตัวนิสิต: 'studentCode',

  // ชื่อ-นามสกุล
  studentname: 'studentName',
  fullname: 'studentName',
  name: 'studentName',
  ชื่อนามสกุล: 'studentName',
  'ชื่อ-นามสกุล': 'studentName',
  ชื่อฉายานามสกุล: 'studentName',
  'ชื่อ-ฉายา-นามสกุล': 'studentName',
  ชื่อสกุล: 'studentName',
  ชื่อ: 'studentName',

  // กลุ่ม
  groupnumber: 'groupNumber',
  groupno: 'groupNumber',
  group: 'groupNumber',
  กลุ่ม: 'groupNumber',
  กลุ่มที่: 'groupNumber',
  เลขกลุ่ม: 'groupNumber',
  groupname: 'groupName',
  ชื่อกลุ่ม: 'groupName',

  // หลักสูตรภาษา (THAI / ENGLISH)
  programtype: 'programType',
  program: 'programType',
  หลักสูตรภาษา: 'programType',
  ภาษา: 'programType',
  ภาค: 'programType',

  // หลักสูตร / ระดับการศึกษา (ปริญญาตรี / ปริญญาโท / ปริญญาเอก)
  หลักสูตร: 'degreeLevel',
  หลักสูตรระดับ: 'degreeLevel',
  degreelevel: 'degreeLevel',
  degree: 'degreeLevel',
  ระดับ: 'degreeLevel',
  ระดับการศึกษา: 'degreeLevel',

  // สาขาวิชา
  major: 'major',
  สาขา: 'major',
  สาขาวิชา: 'major',

  // ชั้นปี
  yearlevel: 'yearLevel',
  year: 'yearLevel',
  ชั้นปี: 'yearLevel',
  ปี: 'yearLevel',

  // สังกัด / คณะ
  department: 'department',
  สังกัด: 'department',
  คณะ: 'department',

  // บทบาท / สถานภาพ / เพศ
  role: 'role',
  status: 'role',
  gender: 'role',
  บทบาท: 'role',
  สถานภาพ: 'role',
  สถานภาพเพศ: 'role',
  เพศสถานภาพ: 'role',
  สถานะเพศ: 'role',
  เพศสถานะ: 'role',
  สถานะ: 'role',
  เพศ: 'role',
  genderstatus: 'role',
  statusgender: 'role',

  // พรรษา
  vasa: 'vasa',
  พรรษา: 'vasa',
  พรรษาถ้ามี: 'vasa',
  จำนวนพรรษา: 'vasa',
  remarks: 'remarks',
  remark: 'remarks',
  หมายเหตุ: 'remarks',
  no: 'ignore',
  ลำดับ: 'ignore',
  ที่: 'ignore',
};

function normalizeHeaderKey(header: string): string {
  return header.trim().replace(/^["']|["']$/g, '').replace(/[\s_()（）/\-]+/g, '').toLowerCase();
}

function splitDelimitedLine(line: string, delimiter: '\t' | ',' | 'spaces'): string[] {
  if (delimiter === '\t') {
    return line.split('\t').map((cell) => cell.trim());
  }
  if (delimiter === 'spaces') {
    // If the line is a header line with known Thai column names separated by single or multiple spaces
    if (
      line.includes('เลขเฉพาะกลุ่ม') ||
      line.includes('รหัสนิสิต') ||
      line.includes('ชื่อ-นามสกุล') ||
      line.includes('ชื่อนามสกุล')
    ) {
      const parts = line.split(/\t+|\s{2,}/).map((c) => c.trim()).filter(Boolean);
      if (parts.length >= 4) return parts;
      return line.split(/\s+/).map((c) => c.trim()).filter(Boolean);
    }
    return line
      .split(/\t+|\s{2,}/)
      .map((cell) => cell.trim())
      .filter(Boolean);
  }
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseGroupNumberValue(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim();
  if (!cleaned) return undefined;
  const match = cleaned.match(/\d+/);
  if (!match) return undefined;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function formatGroupSpecificCode(prefix: string, groupNumber: number | undefined, sequenceInGroup: number): string {
  const safePrefix = (prefix || 'G').trim().toUpperCase();
  const groupPart = groupNumber ? String(groupNumber).padStart(2, '0') : '00';
  const seqPart = String(sequenceInGroup).padStart(2, '0');
  return `${safePrefix}${groupPart}-${seqPart}`;
}

export interface ParseGroupImportOptions {
  defaultGroupNumber?: number;
  defaultGroupName?: string;
  autoCodePrefix?: string;
  defaultProgramType?: string;
}

/**
 * Normalizes student name for duplicate checking by removing honorifics/titles and whitespace.
 */
export function normalizeStudentNameForCheck(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .replace(/^(พระมหา|พระครู|พระอธิการ|เจ้าคุณ|พระ|สามเณร|แม่ชี|ภิกษุณี|สามเณรี|นาย|นางสาว|นาง|ดร\.|ven\.|ven|phra|rev\.|rev|dr\.|dr|asst\.|assoc\.|prof\.)\s*/i, '')
    .replace(/[\s\u00A0]+/g, '')
    .toLowerCase();
}

/**
 * Parses pasted Excel (TSV) or CSV rows of grouped participants.
 * Supports explicit group-specific codes (e.g. `T321`, `G01-01`) in `studentCode`,
 * headered or headerless columns, and auto-generates group codes if omitted.
 */
export function parseGroupedParticipantsText(
  rawText: string,
  options: ParseGroupImportOptions = {}
): ParsedGroupImportResult {
  const trimmed = rawText.replace(/^\uFEFF/, '').trim();
  if (!trimmed) {
    return { items: [], warnings: ['ยังไม่มีข้อมูลสำหรับนำเข้า'], duplicates: [], detectedGroups: [] };
  }

  const rawLines = trimmed.split(/\r?\n/);
  const linesWithRowNumber: { text: string; rowNum: number }[] = [];
  for (let idx = 0; idx < rawLines.length; idx++) {
    const t = rawLines[idx].trim();
    if (t) {
      linesWithRowNumber.push({ text: t, rowNum: idx + 1 });
    }
  }

  if (linesWithRowNumber.length === 0) {
    return { items: [], warnings: [], duplicates: [], detectedGroups: [] };
  }

  // Robust delimiter detection: sample first 10 non-empty lines
  let tabCount = 0;
  let commaCount = 0;
  let multiSpaceCount = 0;
  for (let i = 0; i < Math.min(10, linesWithRowNumber.length); i++) {
    tabCount += (linesWithRowNumber[i].text.match(/\t/g) || []).length;
    commaCount += (linesWithRowNumber[i].text.match(/,/g) || []).length;
    multiSpaceCount += (linesWithRowNumber[i].text.match(/\s{2,}/g) || []).length;
  }

  let delimiter: '\t' | ',' | 'spaces' = ',';
  if (tabCount > 0 && tabCount >= commaCount && tabCount >= multiSpaceCount) {
    delimiter = '\t';
  } else if (commaCount > 0 && commaCount >= multiSpaceCount) {
    delimiter = ',';
  } else if (multiSpaceCount > 0) {
    delimiter = 'spaces';
  }

  // Search first 8 lines to find the true header row matching aliases
  let headerRowIndex = -1;
  let mappedHeaders: (keyof GroupedParticipantInput | 'ignore' | undefined)[] = [];

  for (let i = 0; i < Math.min(8, linesWithRowNumber.length); i++) {
    const rowCells = splitDelimitedLine(linesWithRowNumber[i].text, delimiter);
    const currentMapped = rowCells.map((h) => HEADER_ALIASES[normalizeHeaderKey(h)]);
    const matchCount = currentMapped.filter(
      (m) =>
        m === 'studentCode' ||
        m === 'groupSpecificCode' ||
        m === 'studentName' ||
        m === 'groupNumber' ||
        m === 'groupName' ||
        m === 'degreeLevel' ||
        m === 'major'
    ).length;

    if (matchCount >= 2 || (matchCount >= 1 && currentMapped.includes('studentName'))) {
      headerRowIndex = i;
      mappedHeaders = currentMapped;
      break;
    }
  }

  const hasHeader = headerRowIndex !== -1;
  const startIndex = hasHeader ? headerRowIndex + 1 : 0;
  const warnings: string[] = [];
  const duplicates: GroupImportDuplicate[] = [];
  const items: GroupedParticipantInput[] = [];
  const groupSeqCounter = new Map<string, number>();

  const seenByCode = new Map<string, { row: number; studentCode: string; studentName: string; groupSpecificCode?: string }>();
  const seenByName = new Map<string, { row: number; studentCode: string; studentName: string; groupSpecificCode?: string }>();

  for (let i = startIndex; i < linesWithRowNumber.length; i += 1) {
    const { text: lineText, rowNum } = linesWithRowNumber[i];
    const cells = splitDelimitedLine(lineText, delimiter);
    if (cells.every((c) => !c)) continue;

    // If no header was found, skip apparent title or instruction rows
    if (!hasHeader) {
      if (
        lineText.includes('แบบฟอร์ม') ||
        lineText.includes('คำแนะนำ') ||
        (lineText.includes('เลขเฉพาะกลุ่ม') && cells.filter(Boolean).length <= 2)
      ) {
        continue;
      }
    }

    let studentCode = '';
    let groupSpecificCode = '';
    let studentName = '';
    let groupNumber: number | undefined = options.defaultGroupNumber;
    let groupName: string | undefined = options.defaultGroupName;
    let programType = options.defaultProgramType;
    let degreeLevel: string | undefined;
    let major: string | undefined;
    let yearLevel: number | undefined;
    let department: string | undefined;
    let role: string | undefined;
    let vasa: string | undefined;
    let remarks: string | undefined;

    if (hasHeader) {
      cells.forEach((value, idx) => {
        const field = mappedHeaders[idx];
        if (!field || field === 'ignore' || !value) return;
        const cleanVal = value.trim();
        switch (field) {
          case 'groupSpecificCode':
            groupSpecificCode = cleanVal;
            break;
          case 'studentCode':
            studentCode = cleanVal;
            break;
          case 'studentName':
            studentName = cleanVal;
            break;
          case 'groupNumber': {
            const num = parseGroupNumberValue(cleanVal);
            if (num) groupNumber = num;
            if (!groupName && num) groupName = `กลุ่มที่ ${num}`;
            break;
          }
          case 'groupName':
            groupName = cleanVal;
            if (!groupNumber) {
              const inferred = parseGroupNumberValue(cleanVal);
              if (inferred) groupNumber = inferred;
            }
            break;
          case 'programType':
            programType =
              cleanVal.toUpperCase().includes('ENG') ||
              cleanVal.includes('อินเตอร์') ||
              cleanVal.includes('อังกฤษ')
                ? 'ENGLISH'
                : 'THAI';
            break;
          case 'degreeLevel':
            degreeLevel = cleanVal;
            break;
          case 'major':
            major = cleanVal;
            break;
          case 'yearLevel': {
            const yr = Number.parseInt(cleanVal.replace(/[^\d]/g, ''), 10);
            if (Number.isFinite(yr) && yr > 0) yearLevel = yr;
            break;
          }
          case 'department':
            department = cleanVal;
            break;
          case 'role':
            role = cleanVal;
            break;
          case 'vasa':
            vasa = cleanVal;
            break;
          case 'remarks':
            remarks = cleanVal;
            break;
        }
      });
    } else {
      // Headerless formats:
      // 8 cols: [กลุ่ม, เลขเฉพาะกลุ่ม, รหัสนิสิต, ชื่อ-นามสกุล, หลักสูตร, หลักสูตรภาษา, สาขาวิชา, ชั้นปี]
      if (cells.length >= 8) {
        const firstAsGroup = parseGroupNumberValue(cells[0]);
        if (firstAsGroup !== undefined) {
          groupNumber = firstAsGroup;
          groupName = `กลุ่มที่ ${firstAsGroup}`;
          groupSpecificCode = cells[1]?.trim() || '';
          studentCode = cells[2]?.trim() || '';
          studentName = cells[3]?.trim() || '';
          degreeLevel = cells[4]?.trim() || '';
          programType =
            cells[5]?.trim().toUpperCase().includes('ENG') || cells[5]?.includes('อังกฤษ')
              ? 'ENGLISH'
              : 'THAI';
          major = cells[6]?.trim() || '';
          const yr = Number.parseInt(cells[7]?.replace(/[^\d]/g, '') || '', 10);
          if (Number.isFinite(yr) && yr > 0) yearLevel = yr;
          if (cells[8]) role = cells[8].trim();
          if (cells[9]) vasa = cells[9].trim();
        } else {
          groupSpecificCode = cells[0]?.trim() || '';
          studentCode = cells[1]?.trim() || '';
          studentName = cells[2]?.trim() || '';
          degreeLevel = cells[3]?.trim() || '';
          programType = cells[4]?.trim() || options.defaultProgramType;
          major = cells[5]?.trim() || '';
          const yr = Number.parseInt(cells[6]?.replace(/[^\d]/g, '') || '', 10);
          if (Number.isFinite(yr) && yr > 0) yearLevel = yr;
          if (cells[7]) role = cells[7].trim();
          if (cells[8]) vasa = cells[8].trim();
        }
      } else if (cells.length >= 6) {
        // 6-7 cols fallback: [กลุ่ม, เลขเฉพาะกลุ่ม/รหัส, ชื่อ-นามสกุล, หลักสูตรภาษา, สาขาวิชา, ชั้นปี]
        const firstAsGroup = parseGroupNumberValue(cells[0]);
        if (firstAsGroup !== undefined) {
          groupNumber = firstAsGroup;
          groupName = `กลุ่มที่ ${firstAsGroup}`;
          studentCode = cells[1]?.trim() || '';
          studentName = cells[2]?.trim() || '';
          programType = cells[3]?.trim() || options.defaultProgramType;
          major = cells[4]?.trim() || '';
          const yr = Number.parseInt(cells[5]?.replace(/[^\d]/g, '') || '', 10);
          if (Number.isFinite(yr) && yr > 0) yearLevel = yr;
        } else {
          studentCode = cells[0]?.trim() || '';
          studentName = cells[1]?.trim() || '';
          programType = cells[2]?.trim() || options.defaultProgramType;
          major = cells[3]?.trim() || '';
          const yr = Number.parseInt(cells[4]?.replace(/[^\d]/g, '') || '', 10);
          if (Number.isFinite(yr) && yr > 0) yearLevel = yr;
        }
      } else if (cells.length >= 3) {
        const firstAsGroup = parseGroupNumberValue(cells[0]);
        const looksLikeSmallGroupNum =
          firstAsGroup !== undefined &&
          cells[0].replace(/[^\d]/g, '').length <= 3 &&
          cells[0].length <= 12;
        if (looksLikeSmallGroupNum) {
          groupNumber = firstAsGroup;
          groupName = groupName || `กลุ่มที่ ${firstAsGroup}`;
          studentCode = cells[1]?.trim() || '';
          studentName = cells[2]?.trim() || '';
          if (cells[3]) programType = cells[3].trim();
          if (cells[4]) major = cells[4].trim();
        } else {
          studentCode = cells[0]?.trim() || '';
          studentName = cells[1]?.trim() || '';
          const thirdGroup = parseGroupNumberValue(cells[2]);
          if (thirdGroup) {
            groupNumber = thirdGroup;
            groupName = `กลุ่มที่ ${thirdGroup}`;
          } else {
            groupName = cells[2]?.trim() || groupName;
          }
        }
      } else if (cells.length === 2) {
        studentCode = cells[0]?.trim() || '';
        studentName = cells[1]?.trim() || '';
      } else {
        studentName = cells[0]?.trim() || '';
      }
    }

    if (!studentName) {
      warnings.push(`แถวที่ ${rowNum}: ไม่พบชื่อ-นามสกุล (ข้ามรายการ)`);
      continue;
    }

    const hadInputCode = Boolean(studentCode.trim() || groupSpecificCode.trim());

    // Clean and normalize whitespace/non-breaking space
    studentCode = studentCode.replace(/[\s\u00A0]+/g, '');
    groupSpecificCode = groupSpecificCode.replace(/[\s\u00A0]+/g, '');

    // Smart detection: Thai student ID is typically 8-12 digits (e.g. 6801401003, 6701501050)
    // Group-specific code is typically short alphanumeric (e.g. B1T01, T101, T122, G01-01)
    const isStudentId = (v: string) => /^\d{8,12}$/.test(v);
    const isGroupCode = (v: string) =>
      /^[A-Za-z0-9_-]{2,10}$/.test(v) && !isStudentId(v);

    if (isGroupCode(studentCode) && isStudentId(groupSpecificCode)) {
      // Swapped columns in input, auto-correct them
      const temp = studentCode;
      studentCode = groupSpecificCode;
      groupSpecificCode = temp;
    } else if (isGroupCode(studentCode) && !groupSpecificCode) {
      // Only group code was provided in studentCode column (e.g. T122)
      groupSpecificCode = studentCode;
    } else if (isStudentId(groupSpecificCode) && !studentCode) {
      // Only student ID was provided in groupSpecificCode column
      studentCode = groupSpecificCode;
      groupSpecificCode = '';
    }

    const groupKey = groupNumber ? `G:${groupNumber}` : groupName ? `N:${groupName}` : 'G:0';
    const nextSeq = (groupSeqCounter.get(groupKey) || 0) + 1;
    groupSeqCounter.set(groupKey, nextSeq);

    if (!studentCode && groupSpecificCode) {
      studentCode = groupSpecificCode;
    }

    if (!studentCode && !groupSpecificCode) {
      const generated = formatGroupSpecificCode(options.autoCodePrefix || 'G', groupNumber, nextSeq);
      studentCode = generated;
      groupSpecificCode = generated;
    }

    if (!groupSpecificCode && isGroupCode(studentCode)) {
      groupSpecificCode = studentCode;
    }

    const resolvedGroupName = groupName || (groupNumber ? `กลุ่มที่ ${groupNumber}` : undefined);

    let finalRole = role?.trim();
    if (finalRole) {
      const lowerR = finalRole.toLowerCase();
      if (
        lowerR === 'monk' ||
        lowerR === 'monks' ||
        lowerR === 'bhikkhu' ||
        lowerR.includes('ภิกษุ') ||
        lowerR.includes('ภิกขุ') ||
        lowerR === 'พระ'
      ) {
        finalRole = 'พระภิกษุ';
      } else if (
        lowerR === 'novice' ||
        lowerR === 'novices' ||
        lowerR === 'samanera' ||
        lowerR === 'samaneras' ||
        lowerR.includes('สามเณร') ||
        lowerR === 'เณร'
      ) {
        finalRole = 'สามเณร';
      } else if (
        lowerR === 'bhikkhuni' ||
        lowerR === 'bhikshuni' ||
        lowerR.includes('ภิกษุณี')
      ) {
        finalRole = 'ภิกษุณี';
      } else if (
        lowerR === 'samaneri' ||
        lowerR === 'samaneris' ||
        lowerR.includes('สามเณรี')
      ) {
        finalRole = 'สามเณรี';
      } else if (
        lowerR === 'nun' ||
        lowerR === 'nuns' ||
        lowerR === 'maechi' ||
        lowerR.includes('แม่ชี') ||
        lowerR === 'ชี'
      ) {
        finalRole = 'แม่ชี';
      } else if (
        lowerR.includes('คฤหัสถ์ชาย') ||
        lowerR.includes('ฆราวาสชาย') ||
        lowerR === 'lay male' ||
        lowerR === 'lay_male' ||
        lowerR === 'layman' ||
        lowerR === 'male' ||
        lowerR === 'ชาย'
      ) {
        finalRole = lowerR.includes('ฆราวาส') ? 'ฆราวาสชาย' : 'คฤหัสถ์ชาย';
      } else if (
        lowerR.includes('คฤหัสถ์หญิง') ||
        lowerR.includes('ฆราวาสหญิง') ||
        lowerR === 'lay female' ||
        lowerR === 'lay_female' ||
        lowerR === 'laywoman' ||
        lowerR === 'female' ||
        lowerR === 'หญิง'
      ) {
        finalRole = lowerR.includes('ฆราวาส') ? 'ฆราวาสหญิง' : 'คฤหัสถ์หญิง';
      }
    }

    if (!finalRole || finalRole === 'STUDENT' || finalRole === 'นิสิต') {
      const cleanLower = (studentName || '').trim().toLowerCase();
      if (
        cleanLower.startsWith('พระมหา') ||
        cleanLower.startsWith('พระครู') ||
        cleanLower.startsWith('พระอธิการ') ||
        cleanLower.startsWith('เจ้าคุณ') ||
        cleanLower.startsWith('ven.') ||
        cleanLower.startsWith('ven ') ||
        cleanLower.startsWith('phra') ||
        cleanLower.startsWith('พระ') ||
        cleanLower.startsWith('ashin') ||
        cleanLower.startsWith('rev.') ||
        cleanLower.startsWith('rev ') ||
        cleanLower.includes('thero') ||
        cleanLower.includes('ภิกษุ') ||
        cleanLower.includes('ภิกขุ')
      ) {
        finalRole = 'พระภิกษุ';
      } else if (
        cleanLower.startsWith('สามเณร') ||
        cleanLower.startsWith('สามเณร.') ||
        cleanLower.startsWith('เณร') ||
        cleanLower.startsWith('samanera') ||
        cleanLower.startsWith('novice')
      ) {
        finalRole = 'สามเณร';
      } else if (
        cleanLower.startsWith('แม่ชี') ||
        cleanLower.startsWith('ชี') ||
        cleanLower.startsWith('maechi') ||
        cleanLower.startsWith('nun')
      ) {
        finalRole = 'แม่ชี';
      } else if (
        cleanLower.startsWith('ภิกษุณี') ||
        cleanLower.startsWith('bhikkhuni')
      ) {
        finalRole = 'ภิกษุณี';
      } else if (
        cleanLower.startsWith('สามเณรี') ||
        cleanLower.startsWith('samaneri')
      ) {
        finalRole = 'สามเณรี';
      } else if (
        cleanLower.startsWith('นาย') ||
        cleanLower.startsWith('mr.') ||
        cleanLower.startsWith('mr ') ||
        cleanLower.startsWith('ด.ช.') ||
        cleanLower.startsWith('เด็กชาย')
      ) {
        finalRole = 'คฤหัสถ์ชาย';
      } else if (
        cleanLower.startsWith('นางสาว') ||
        cleanLower.startsWith('นาง') ||
        cleanLower.startsWith('ms.') ||
        cleanLower.startsWith('mrs.') ||
        cleanLower.startsWith('miss') ||
        cleanLower.startsWith('ด.ญ.') ||
        cleanLower.startsWith('เด็กหญิง')
      ) {
        finalRole = 'คฤหัสถ์หญิง';
      } else {
        finalRole = role || 'นิสิต';
      }
    }

    // Duplicate detection: check if studentCode or studentName was seen previously
    const codeKey = (studentCode || '').trim().toLowerCase();
    const nameNorm = normalizeStudentNameForCheck(studentName);
    const isValidCode = hadInputCode && Boolean(codeKey) && codeKey !== '-' && codeKey !== 'n/a' && codeKey !== 'none';

    let isDuplicateRow = false;
    let duplicateRow: number | undefined;
    let duplicateMessage: string | undefined;

    const codeMatch = isValidCode ? seenByCode.get(codeKey) : undefined;
    const nameMatch = nameNorm ? seenByName.get(nameNorm) : undefined;

    if (codeMatch && nameMatch && codeMatch.row === nameMatch.row) {
      isDuplicateRow = true;
      duplicateRow = codeMatch.row;
      const grpInfo = groupSpecificCode ? ` [กลุ่ม: ${groupSpecificCode}]` : '';
      const prevGrpInfo = codeMatch.groupSpecificCode ? ` [กลุ่ม: ${codeMatch.groupSpecificCode}]` : '';
      duplicateMessage = `แถวที่ ${rowNum}: รหัส ${studentCode} | ชื่อ ${studentName}${grpInfo} — ซ้ำทั้งรหัสนิสิตและชื่อกับแถวที่ ${codeMatch.row}${prevGrpInfo}`;
      duplicates.push({
        row: rowNum,
        originalRow: codeMatch.row,
        studentCode,
        studentName,
        groupSpecificCode: groupSpecificCode || undefined,
        duplicateType: 'both',
        message: duplicateMessage,
      });
    } else if (codeMatch) {
      isDuplicateRow = true;
      duplicateRow = codeMatch.row;
      const grpInfo = groupSpecificCode ? ` [กลุ่ม: ${groupSpecificCode}]` : '';
      const prevGrpInfo = codeMatch.groupSpecificCode ? ` [กลุ่ม: ${codeMatch.groupSpecificCode}]` : '';
      duplicateMessage = `แถวที่ ${rowNum}: รหัส ${studentCode} | ชื่อ ${studentName}${grpInfo} — รหัสนิสิตซ้ำกับแถวที่ ${codeMatch.row} (ชื่อเดิม: ${codeMatch.studentName}${prevGrpInfo})`;
      duplicates.push({
        row: rowNum,
        originalRow: codeMatch.row,
        studentCode,
        studentName,
        groupSpecificCode: groupSpecificCode || undefined,
        duplicateType: 'code',
        message: duplicateMessage,
      });
    } else if (nameMatch) {
      isDuplicateRow = true;
      duplicateRow = nameMatch.row;
      const grpInfo = groupSpecificCode ? ` [กลุ่ม: ${groupSpecificCode}]` : '';
      const prevGrpInfo = nameMatch.groupSpecificCode ? ` [กลุ่ม: ${nameMatch.groupSpecificCode}]` : '';
      duplicateMessage = `แถวที่ ${rowNum}: รหัส ${studentCode} | ชื่อ ${studentName}${grpInfo} — ชื่อนิสิตซ้ำกับแถวที่ ${nameMatch.row} (รหัสเดิม: ${nameMatch.studentCode}${prevGrpInfo})`;
      duplicates.push({
        row: rowNum,
        originalRow: nameMatch.row,
        studentCode,
        studentName,
        groupSpecificCode: groupSpecificCode || undefined,
        duplicateType: 'name',
        message: duplicateMessage,
      });
    }

    if (isValidCode && !seenByCode.has(codeKey)) {
      seenByCode.set(codeKey, { row: rowNum, studentCode, studentName, groupSpecificCode });
    }
    if (nameNorm && !seenByName.has(nameNorm)) {
      seenByName.set(nameNorm, { row: rowNum, studentCode, studentName, groupSpecificCode });
    }

    items.push({
      studentCode,
      groupSpecificCode: groupSpecificCode || undefined,
      studentName,
      groupNumber,
      groupName: resolvedGroupName,
      programType,
      degreeLevel,
      major,
      yearLevel,
      department,
      role: finalRole,
      vasa,
      remarks,
      status: 'REGISTERED',
      isDuplicate: isDuplicateRow,
      duplicateRow,
      duplicateMessage,
    });
  }

  const detectedGroups = Array.from(
    new Set(items.map((it) => it.groupNumber).filter((n): n is number => typeof n === 'number' && n > 0))
  ).sort((a, b) => a - b);

  return { items, warnings, duplicates, detectedGroups };
}

export function getGroupKeyFromRegistration(reg: Pick<EventRegistration, 'groupNumber' | 'groupName'>): string {
  if (typeof reg.groupNumber === 'number' && reg.groupNumber > 0) {
    return `num:${reg.groupNumber}`;
  }
  if (reg.groupName && reg.groupName.trim()) {
    return `name:${reg.groupName.trim()}`;
  }
  return 'ungrouped';
}

export function summarizeGroups(registrations: EventRegistration[]): GroupSummary[] {
  const map = new Map<string, GroupSummary>();
  for (const reg of registrations) {
    const key = getGroupKeyFromRegistration(reg);
    const existing = map.get(key);
    const label =
      reg.groupName?.trim() || (reg.groupNumber ? `กลุ่มที่ ${reg.groupNumber}` : 'ไม่ระบุกลุ่ม');
    if (existing) {
      existing.count += 1;
      if (existing.sampleCodes.length < 4 && reg.studentCode) {
        existing.sampleCodes.push(reg.studentCode);
      }
    } else {
      map.set(key, {
        key,
        groupNumber: reg.groupNumber,
        groupName: label,
        count: 1,
        sampleCodes: reg.studentCode ? [reg.studentCode] : [],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.groupNumber !== undefined && b.groupNumber !== undefined) return a.groupNumber - b.groupNumber;
    if (a.groupNumber !== undefined) return -1;
    if (b.groupNumber !== undefined) return 1;
    return a.groupName.localeCompare(b.groupName, 'th');
  });
}

export function buildGroupCloneItems(
  sourceRegistrations: EventRegistration[],
  selectedGroupKeys?: string[]
): GroupedParticipantInput[] {
  const allowed = selectedGroupKeys && selectedGroupKeys.length > 0 ? new Set(selectedGroupKeys) : null;

  return sourceRegistrations
    .filter((reg) => !allowed || allowed.has(getGroupKeyFromRegistration(reg)))
    .map((reg) => ({
      studentCode: reg.studentCode,
      groupSpecificCode: reg.groupSpecificCode,
      studentName: reg.studentName,
      groupNumber: reg.groupNumber,
      groupName: reg.groupName || (reg.groupNumber ? `กลุ่มที่ ${reg.groupNumber}` : undefined),
      programType: reg.programType,
      degreeLevel: reg.degreeLevel,
      major: reg.major,
      yearLevel: reg.yearLevel,
      department: reg.department,
      role: reg.role || 'STUDENT',
      vasa: reg.vasa !== undefined ? String(reg.vasa) : undefined,
      remarks: reg.remarks,
      status: 'REGISTERED',
    }));
}

export interface DirectoryGroupBuildOptions {
  groupNumber: number;
  groupName?: string;
  useGroupSpecificCode: boolean;
  codePrefix?: string;
  startSequence?: number;
}

export function buildGroupedStudentsFromDirectory(
  students: Student[],
  options: DirectoryGroupBuildOptions
): GroupedParticipantInput[] {
  const startSeq = Math.max(1, options.startSequence ?? 1);
  const resolvedGroupName = options.groupName?.trim() || `กลุ่มที่ ${options.groupNumber}`;

  return students.map((student, idx) => {
    const groupCode = options.useGroupSpecificCode
      ? formatGroupSpecificCode(options.codePrefix || 'G', options.groupNumber, startSeq + idx)
      : undefined;

    const resolvedName =
      student.fullName?.trim() ||
      [student.title, student.firstName, student.lastName].filter(Boolean).join(' ').trim() ||
      student.studentCode;

    return {
      studentCode: student.studentCode,
      groupSpecificCode: groupCode,
      studentName: resolvedName,
      groupNumber: options.groupNumber,
      groupName: resolvedGroupName,
      programType: student.programType === 'ENGLISH' ? 'ENGLISH' : 'THAI',
      degreeLevel: student.degree,
      major: student.major,
      yearLevel: student.yearLevel,
      department: student.department,
      role: 'STUDENT',
      remarks: options.useGroupSpecificCode ? `เลขเฉพาะกลุ่ม: ${groupCode}` : undefined,
      status: 'REGISTERED',
    };
  });
}

/**
 * Format group name with program language tag (e.g. "กลุ่ม 1 (ไทย)", "Group 12 (English)")
 */
export function formatGroupDisplay(
  g: number,
  registrations?: Array<{ groupNumber?: number; programType?: string }>,
  customName?: string
): string {
  const inGroup = (registrations || []).filter((r) => r.groupNumber === g);
  const englishCount = inGroup.filter((r) => r.programType === 'ENGLISH').length;
  const isEnglish = g === 12 || (inGroup.length > 0 && englishCount > 0 && englishCount >= inGroup.length / 2);

  if (customName && !customName.match(/^กลุ่มที่?\s*\d+$/i)) {
    return isEnglish ? `Group ${g} (English) - ${customName}` : `กลุ่ม ${g} (ไทย) - ${customName}`;
  }

  return isEnglish ? `Group ${g} (English)` : `กลุ่ม ${g} (ไทย)`;
}
