import type { EventRegistration } from '@/types/event';
import type { Student } from '@/types/student';

export interface GroupedParticipantInput {
  studentCode: string;
  studentName: string;
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
}

export interface ParsedGroupImportResult {
  items: GroupedParticipantInput[];
  warnings: string[];
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
  studentcode: 'studentCode',
  code: 'studentCode',
  id: 'studentCode',
  groupcode: 'studentCode',
  รหัสนิสิต: 'studentCode',
  รหัส: 'studentCode',
  เลขเฉพาะกลุ่ม: 'studentCode',
  รหัสกลุ่มเฉพาะ: 'studentCode',
  รหัสประจำกลุ่ม: 'studentCode',
  เลขประจำกลุ่ม: 'studentCode',
  studentname: 'studentName',
  fullname: 'studentName',
  name: 'studentName',
  'ชื่อ-นามสกุล': 'studentName',
  'ชื่อ-ฉายา-นามสกุล': 'studentName',
  ชื่อสกุล: 'studentName',
  ชื่อ: 'studentName',
  groupnumber: 'groupNumber',
  groupno: 'groupNumber',
  group: 'groupNumber',
  กลุ่ม: 'groupNumber',
  กลุ่มที่: 'groupNumber',
  เลขกลุ่ม: 'groupNumber',
  groupname: 'groupName',
  ชื่อกลุ่ม: 'groupName',
  programtype: 'programType',
  program: 'programType',
  ภาค: 'programType',
  หลักสูตรภาษา: 'programType',
  degreelevel: 'degreeLevel',
  degree: 'degreeLevel',
  ระดับ: 'degreeLevel',
  ระดับการศึกษา: 'degreeLevel',
  major: 'major',
  สาขา: 'major',
  สาขาวิชา: 'major',
  yearlevel: 'yearLevel',
  year: 'yearLevel',
  ชั้นปี: 'yearLevel',
  department: 'department',
  สังกัด: 'department',
  คณะ: 'department',
  role: 'role',
  บทบาท: 'role',
  vasa: 'vasa',
  พรรษา: 'vasa',
  remarks: 'remarks',
  remark: 'remarks',
  หมายเหตุ: 'remarks',
  no: 'ignore',
  ลำดับ: 'ignore',
  ที่: 'ignore',
};

function normalizeHeaderKey(header: string): string {
  return header.trim().replace(/^["']|["']$/g, '').replace(/[\s_()（）/]+/g, '').toLowerCase();
}

function splitDelimitedLine(line: string, delimiter: '\t' | ','): string[] {
  if (delimiter === '\t') {
    return line.split('\t').map((cell) => cell.trim());
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
    return { items: [], warnings: ['ยังไม่มีข้อมูลสำหรับนำเข้า'], detectedGroups: [] };
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { items: [], warnings: [], detectedGroups: [] };
  }

  const delimiter: '\t' | ',' = lines[0].includes('\t') ? '\t' : ',';
  const firstRow = splitDelimitedLine(lines[0], delimiter);
  const mappedHeaders = firstRow.map((h) => HEADER_ALIASES[normalizeHeaderKey(h)]);
  const hasHeader = mappedHeaders.some(
    (m) => m === 'studentCode' || m === 'studentName' || m === 'groupNumber' || m === 'groupName'
  );

  const startIndex = hasHeader ? 1 : 0;
  const warnings: string[] = [];
  const items: GroupedParticipantInput[] = [];
  const groupSeqCounter = new Map<string, number>();

  for (let i = startIndex; i < lines.length; i += 1) {
    const cells = splitDelimitedLine(lines[i], delimiter);
    if (cells.every((c) => !c)) continue;

    let studentCode = '';
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
        switch (field) {
          case 'studentCode':
            studentCode = value.trim();
            break;
          case 'studentName':
            studentName = value.trim();
            break;
          case 'groupNumber': {
            const num = parseGroupNumberValue(value);
            if (num) groupNumber = num;
            if (!groupName && num) groupName = `กลุ่มที่ ${num}`;
            break;
          }
          case 'groupName':
            groupName = value.trim();
            if (!groupNumber) {
              const inferred = parseGroupNumberValue(value);
              if (inferred) groupNumber = inferred;
            }
            break;
          case 'programType':
            programType = value.trim().toUpperCase().includes('ENG') || value.includes('อินเตอร์') ? 'ENGLISH' : 'THAI';
            break;
          case 'degreeLevel':
            degreeLevel = value.trim();
            break;
          case 'major':
            major = value.trim();
            break;
          case 'yearLevel': {
            const yr = Number.parseInt(value.replace(/[^\d]/g, ''), 10);
            if (Number.isFinite(yr) && yr > 0) yearLevel = yr;
            break;
          }
          case 'department':
            department = value.trim();
            break;
          case 'role':
            role = value.trim();
            break;
          case 'vasa':
            vasa = value.trim();
            break;
          case 'remarks':
            remarks = value.trim();
            break;
        }
      });
    } else {
      // Headerless formats:
      // 2 cols: [เลขเฉพาะกลุ่ม/รหัส, ชื่อ-นามสกุล]
      // 3 cols: [กลุ่ม, เลขเฉพาะกลุ่ม/รหัส, ชื่อ-นามสกุล] OR [เลขเฉพาะกลุ่ม, ชื่อ, กลุ่ม]
      if (cells.length >= 3) {
        const firstAsGroup = parseGroupNumberValue(cells[0]);
        const looksLikeSmallGroupNum =
          firstAsGroup !== undefined && cells[0].replace(/[^\d]/g, '').length <= 3 && cells[0].length <= 12;
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
      warnings.push(`แถวที่ ${i + 1}: ไม่พบชื่อ-นามสกุล (ข้ามรายการ)`);
      continue;
    }

    const groupKey = groupNumber ? `G:${groupNumber}` : groupName ? `N:${groupName}` : 'G:0';
    const nextSeq = (groupSeqCounter.get(groupKey) || 0) + 1;
    groupSeqCounter.set(groupKey, nextSeq);

    if (!studentCode) {
      studentCode = formatGroupSpecificCode(options.autoCodePrefix || 'G', groupNumber, nextSeq);
    }

    const resolvedGroupName = groupName || (groupNumber ? `กลุ่มที่ ${groupNumber}` : undefined);

    items.push({
      studentCode,
      studentName,
      groupNumber,
      groupName: resolvedGroupName,
      programType,
      degreeLevel,
      major,
      yearLevel,
      department,
      role: role || 'STUDENT',
      vasa,
      remarks,
      status: 'REGISTERED',
    });
  }

  const detectedGroups = Array.from(
    new Set(items.map((it) => it.groupNumber).filter((n): n is number => typeof n === 'number' && n > 0))
  ).sort((a, b) => a - b);

  return { items, warnings, detectedGroups };
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
    const code = options.useGroupSpecificCode
      ? formatGroupSpecificCode(options.codePrefix || 'G', options.groupNumber, startSeq + idx)
      : student.studentCode;

    const resolvedName =
      student.fullName?.trim() ||
      [student.title, student.firstName, student.lastName].filter(Boolean).join(' ').trim() ||
      student.studentCode;

    return {
      studentCode: code,
      studentName: resolvedName,
      groupNumber: options.groupNumber,
      groupName: resolvedGroupName,
      programType: student.programType === 'ENGLISH' ? 'ENGLISH' : 'THAI',
      degreeLevel: student.degree,
      major: student.major,
      yearLevel: student.yearLevel,
      department: student.department,
      role: 'STUDENT',
      remarks: options.useGroupSpecificCode ? `รหัสนิสิตเดิม: ${student.studentCode}` : undefined,
      status: 'REGISTERED',
    };
  });
}
