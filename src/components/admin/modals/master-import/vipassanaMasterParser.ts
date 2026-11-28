import { UserAccount } from '@/types';
import {
  detectDelimiter,
  splitCSVLines,
  parseCSVRow,
  recombineAcademicTitles,
} from '@/lib/parsers/csvParser';
import { stripLeadingTitles } from '@/lib/utils/name-matcher';
import { getNextSequentialEmail } from '@/lib/utils/file-import-helpers';
import { ParsedMasterItem } from './types';

export interface ParseMastersOptions {
  text: string;
  existingUsers: UserAccount[];
  passwordOption?: 'mcu123456' | 'vp2569' | 'custom';
  customPassword?: string;
}

/**
 * Strips title banners, subtitles, and decorative header echoes
 * from raw Excel/CSV text so the text area starts directly at the column headers.
 */
export function cleanImportRawText(text: string): string {
  const lines = splitCSVLines(text);
  if (lines.length <= 1) return text;

  const maxScan = Math.min(lines.length, 10);
  let headerOrDataIdx = -1;

  for (let i = 0; i < maxScan; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const d = detectDelimiter(line);
    const rawCols = parseCSVRow(line, d);

    // Filter out blank cells
    const nonBlankCols = rawCols.filter((c) => c.trim().length > 0);
    if (nonBlankCols.length === 0) continue;

    const firstCol = nonBlankCols[0].trim();
    const isBanner =
      firstCol.includes('แบบฟอร์ม') ||
      firstCol.includes('ทำเนียบ') ||
      firstCol.includes('รองรับข้อมูล') ||
      firstCol.includes('คำชี้แจง') ||
      (nonBlankCols.length <= 1 && (firstCol.includes('รายชื่อ') || firstCol.includes('ส่งออกเมื่อ')));

    if (isBanner) continue;

    headerOrDataIdx = i;
    break;
  }

  if (headerOrDataIdx > 0) {
    return lines.slice(headerOrDataIdx).join('\n');
  }
  return text;
}

/**
 * Robust CSV / TSV / Excel text parser for Vipassana Masters.
 * Automatically detects and skips leading title/subtitle rows,
 * maps headers intelligently for both template and exported files,
 * and handles pure tabular rows without headers.
 */
export function parseCSVToVipassanaMasters({
  text,
  existingUsers,
  passwordOption = 'mcu123456',
  customPassword = '',
}: ParseMastersOptions): ParsedMasterItem[] {
  const lines = splitCSVLines(text);
  if (lines.length === 0) {
    return [];
  }

  // 1. Scan up to the first 10 lines to locate the true column header row
  let headerLineIdx = -1;
  let delimiter = detectDelimiter(lines[0]);
  let normalizedHeaders: string[] = [];

  const maxScan = Math.min(lines.length, 10);
  for (let i = 0; i < maxScan; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const d = detectDelimiter(line);
    const rawCols = parseCSVRow(line, d);
    if (rawCols.length < 2) continue;

    const norm = rawCols.map((h) => h.toLowerCase().replace(/[\s\-_/()]/g, ''));
    const matchCount = norm.filter((h) =>
      h.includes('ชื่อ') ||
      h.includes('ฉายา') ||
      h.includes('name') ||
      h.includes('พระอาจารย์') ||
      h.includes('วิปัสสนา') ||
      h.includes('ตำแหน่ง') ||
      h.includes('position') ||
      h.includes('หน้าที่') ||
      h.includes('หน่วยงาน') ||
      h.includes('ภาควิชา') ||
      h.includes('สงฆ์') ||
      h.includes('ที่อยู่') ||
      h.includes('วัด') ||
      h.includes('อีเมล') ||
      h.includes('email') ||
      h.includes('ไอดี') ||
      h.includes('username') ||
      h.includes('เข้าใช้งาน') ||
      h.includes('รหัสผ่าน') ||
      h.includes('password') ||
      h.includes('ลำดับ')
    ).length;

    // Header row requires at least 2 recognized column keywords
    if (matchCount >= 2) {
      headerLineIdx = i;
      delimiter = d;
      normalizedHeaders = norm;
      break;
    }
  }

  let colName = -1;
  let colNameEn = -1;
  let colPosition = -1;
  let colEcclesiasticalTitle = -1;
  let colDept = -1;
  let colAddress = -1;
  let colEmail = -1;
  let colPassword = -1;
  let dataLines: string[] = [];

  if (headerLineIdx !== -1) {
    dataLines = lines.slice(headerLineIdx + 1);
    normalizedHeaders.forEach((h, idx) => {
      const isEmail =
        h.includes('อีเมล') ||
        h.includes('email') ||
        h.includes('ไอดี') ||
        h.includes('username') ||
        h.includes('เข้าใช้งาน');
      const isPassword =
        h.includes('รหัสผ่าน') ||
        h.includes('password') ||
        h.includes('pass');
      const isAddress =
        h.includes('ที่อยู่') ||
        h.includes('สังกัดวัด') ||
        h.includes('วัด') ||
        h.includes('address');
      const isDept =
        h.includes('หน่วยงาน') ||
        h.includes('ภาควิชา') ||
        h.includes('สาขา') ||
        h.includes('สังกัด') ||
        h.includes('department');
      const isEcclesiasticalTitle =
        h.includes('คณะสงฆ์') ||
        h.includes('สงฆ์') ||
        h.includes('สมณศักดิ์') ||
        h.includes('ecclesiastical');
      const isPosition =
        !isEcclesiasticalTitle &&
        (h.includes('ตำแหน่ง') ||
          h.includes('หน้าที่') ||
          h.includes('position') ||
          h.includes('บทบาท') ||
          h.includes('role'));
      const isNameEn =
        h.includes('อังกฤษ') ||
        h.includes('english') ||
        h.includes('nameen');
      const isName =
        !isNameEn &&
        !isEcclesiasticalTitle &&
        (h.includes('ชื่อ') ||
          h.includes('ฉายา') ||
          h.includes('พระอาจารย์') ||
          h.includes('พระวิปัสสนาจารย์') ||
          h.includes('fullname') ||
          h.includes('name'));

      if (isEmail && colEmail === -1) colEmail = idx;
      else if (isPassword && colPassword === -1) colPassword = idx;
      else if (isAddress && colAddress === -1) colAddress = idx;
      else if (isDept && colDept === -1) colDept = idx;
      else if (isEcclesiasticalTitle && colEcclesiasticalTitle === -1) colEcclesiasticalTitle = idx;
      else if (isPosition && colPosition === -1) colPosition = idx;
      else if (isNameEn && colNameEn === -1) colNameEn = idx;
      else if (isName && colName === -1) colName = idx;
    });
  } else {
    dataLines = lines;
  }

  // Helper for generating sequential email
  const getNextEmail = (offset: number, staged: ParsedMasterItem[]) => {
    return getNextSequentialEmail({
      prefix: 'vipassana',
      offsetIndex: offset,
      existingEmails: existingUsers.map((u) => u.email),
      stagedEmails: staged.map((s) => s.email),
    });
  };

  // Helper for default password
  const getPassword = (idx: number) => {
    if (passwordOption === 'mcu123456') return 'mcu123456';
    if (passwordOption === 'vp2569') return `Vp@2569#${String(idx + 1).padStart(2, '0')}`;
    return customPassword.trim() || 'mcu123456';
  };

  const result: ParsedMasterItem[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const lineStr = dataLines[i].trim();
    if (!lineStr) continue;

    let values = parseCSVRow(lineStr, delimiter);
    if (values.length === 0 || values.every((v) => !v.trim())) continue;

    values = recombineAcademicTitles(values);

    let name = '';
    let nameEn = '';
    let position = 'พระวิปัสสนาจารย์';
    let ecclesiasticalTitle = '';
    let department = '';
    let contactAddress = '';
    let email = '';
    let password = '';

    if (headerLineIdx !== -1) {
      name = colName !== -1 ? (values[colName] || '') : '';
      nameEn = colNameEn !== -1 ? (values[colNameEn] || '') : '';
      position = colPosition !== -1 ? (values[colPosition] || '') : 'พระวิปัสสนาจารย์';
      ecclesiasticalTitle = colEcclesiasticalTitle !== -1 ? (values[colEcclesiasticalTitle] || '') : '';
      department = colDept !== -1 ? (values[colDept] || '') : '';
      contactAddress = colAddress !== -1 ? (values[colAddress] || '') : '';
      email = colEmail !== -1 ? (values[colEmail] || '') : '';
      password = colPassword !== -1 ? (values[colPassword] || '') : '';

      // If name column was somehow empty, attempt positional fallback
      if (!name.trim()) {
        const isFirstColNumber = /^\d+$/.test(values[0]?.trim());
        const nameIdx = isFirstColNumber ? 1 : 0;
        name = values[nameIdx] || '';
      }
    } else {
      // Positional fallback for pure data lines without headers
      const isFirstColNumber = /^\d+$/.test(values[0]?.trim());
      const nameIdx = isFirstColNumber ? 1 : 0;

      name = values[nameIdx] || '';
      nameEn = values[nameIdx + 1] && !values[nameIdx + 1].includes('@') ? values[nameIdx + 1] : '';
      position = values[nameIdx + 2] || 'พระวิปัสสนาจารย์';
      ecclesiasticalTitle = values[nameIdx + 3] || '';
      department = values[nameIdx + 4] || '';
      contactAddress = values[nameIdx + 5] || '';

      for (let k = nameIdx + 1; k < values.length; k++) {
        const val = (values[k] || '').trim();
        if (val.includes('@')) {
          email = val;
        } else if (val.toLowerCase().startsWith('vp') || val.toLowerCase().startsWith('mcu')) {
          password = val;
        }
      }
    }

    const cleanName = name.trim();
    if (!cleanName || cleanName === '-') continue;

    // Safety guard: skip any banner or column header echo lines that might be in the data
    const isHeaderOrTitleEcho =
      cleanName.includes('แบบฟอร์ม') ||
      cleanName.includes('ทำเนียบ') ||
      cleanName.includes('รองรับข้อมูล') ||
      cleanName.includes('คำชี้แจง') ||
      cleanName.includes('ชื่อ-ฉายา') ||
      cleanName === 'ชื่อ' ||
      cleanName === 'ชื่อฉายา' ||
      cleanName === 'ลำดับ' ||
      cleanName.includes('ภาษาไทย') ||
      cleanName.includes('ภาษาอังกฤษ');
    if (isHeaderOrTitleEcho) continue;

    // Clean position string
    let cleanPos = position.trim();
    if (!cleanPos || cleanPos === '-') cleanPos = 'พระวิปัสสนาจารย์';
    if (cleanPos.includes('ประธาน') && !cleanPos.includes('รอง')) cleanPos = 'ประธานพระวิปัสสนาจารย์';
    else if (cleanPos.includes('รองประธาน')) cleanPos = 'รองประธานพระวิปัสสนาจารย์';
    else if (cleanPos.includes('เลขานุการ') && !cleanPos.includes('ผู้ช่วย')) cleanPos = 'เลขานุการพระวิปัสสนาจารย์';
    else if (cleanPos.includes('ผู้ช่วยเลขา')) cleanPos = 'ผู้ช่วยเลขานุการพระวิปัสสนาจารย์';

    const stripped = stripLeadingTitles(cleanName);

    // Check existing
    const existingMatch = existingUsers.find((u) => {
      if (email && (u.email || '').toLowerCase() === email.toLowerCase()) return true;
      if (u.name.trim() === cleanName) return true;
      if (u.aliases && u.aliases.some((al) => al.trim() === cleanName || al.trim() === stripped)) return true;
      if (stripLeadingTitles(u.name || '') === stripped && stripped.length >= 3) return true;
      return false;
    });

    // Auto generate email if not provided
    const finalEmail = email.trim() || (existingMatch?.email || getNextEmail(result.length, result));
    const finalPassword = password.trim() || getPassword(result.length);

    result.push({
      name: cleanName,
      nameEn: nameEn.trim() || existingMatch?.nameEn,
      position: cleanPos,
      ecclesiasticalTitle: ecclesiasticalTitle.trim() || existingMatch?.ecclesiasticalTitle || '',
      department: department.trim() || existingMatch?.department || 'ฝ่ายวิปัสสนาธุระ / พระวิปัสสนาจารย์',
      contactAddress: contactAddress.trim() || existingMatch?.contactAddress || '',
      email: finalEmail,
      password: finalPassword,
      isExisting: !!existingMatch,
      existingMatchName: existingMatch?.name,
    });
  }

  return result;
}
