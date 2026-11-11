/**
 * Zero-dependency OOXML (.xlsx) workbook generator for browser & Node.
 * Produces valid ZIP (STORE method) + SpreadsheetML XML files compatible with
 * Microsoft Excel, Google Sheets, LibreOffice Calc, and Apple Numbers without
 * legacy HTML/.xls format-mismatch warnings.
 */

export type XlsxCellValue = string | number | boolean | null | undefined;

export interface XlsxSheet {
  name: string;
  title?: string;
  subtitle?: string;
  headers: string[];
  rows: XlsxCellValue[][];
  columnWidths?: number[];
}

const textEncoder = new TextEncoder();

// Precompute IEEE 802.3 CRC-32 lookup table
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function escapeXml(value: string): string {
  // Strip XML 1.0 illegal control characters (preserve \t, \n, \r)
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '');
  return cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function columnIndexToLetter(index: number): string {
  let col = index + 1;
  let result = '';
  while (col > 0) {
    const rem = (col - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    col = Math.floor((col - 1) / 26);
  }
  return result;
}

export function sanitizeSheetName(rawName: string, usedNames: Set<string>): string {
  let base = (rawName || 'Sheet')
    .replace(/[:\\/?*\[\]]/g, '_')
    .replace(/^'+|'+$/g, '')
    .trim();
  if (!base) base = 'Sheet';
  base = base.slice(0, 31);

  let candidate = base;
  let suffix = 2;
  while (usedNames.has(candidate.toLowerCase())) {
    const tag = `_${suffix}`;
    candidate = base.slice(0, Math.max(1, 31 - tag.length)) + tag;
    suffix++;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function visualTextWidth(value: string): number {
  if (!value) return 0;
  const lines = value.split(/\r?\n/);
  let maxLen = 0;
  for (const line of lines) {
    // Discount Thai combining vowels/tone marks that sit above/below base glyphs
    const stripped = line.replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, '');
    maxLen = Math.max(maxLen, stripped.length);
  }
  return maxLen;
}

function computeColumnWidths(sheet: XlsxSheet): number[] {
  const colCount = sheet.headers.length;
  const widths: number[] = new Array(colCount).fill(10);

  for (let c = 0; c < colCount; c++) {
    if (sheet.columnWidths && typeof sheet.columnWidths[c] === 'number') {
      widths[c] = sheet.columnWidths[c];
      continue;
    }

    let maxW = visualTextWidth(String(sheet.headers[c] ?? ''));
    for (const row of sheet.rows) {
      const cell = row[c];
      if (cell !== null && cell !== undefined) {
        maxW = Math.max(maxW, visualTextWidth(String(cell)));
      }
    }
    widths[c] = Math.min(54, Math.max(8, Math.ceil(maxW * 1.15) + 3));
  }
  return widths;
}

function buildCellXml(
  ref: string,
  value: XlsxCellValue,
  textStyleId: number,
  numberStyleId: number
): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${ref}" t="n" s="${numberStyleId}"><v>${value}</v></c>`;
  }
  if (typeof value === 'boolean') {
    return `<c r="${ref}" t="b" s="${numberStyleId}"><v>${value ? 1 : 0}</v></c>`;
  }
  const text = value === null || value === undefined ? '' : String(value);
  const preserveSpace = /^\s|\s$|\n/.test(text) ? ' xml:space="preserve"' : '';
  return `<c r="${ref}" t="inlineStr" s="${textStyleId}"><is><t${preserveSpace}>${escapeXml(text)}</t></is></c>`;
}

function buildWorksheetXml(sheet: XlsxSheet, isFirstSheet: boolean): string {
  const colCount = Math.max(1, sheet.headers.length);
  const lastCol = columnIndexToLetter(colCount - 1);
  const widths = computeColumnWidths(sheet);

  const rowXmls: string[] = [];
  const mergeRefs: string[] = [];
  let currentRow = 1;

  if (sheet.title) {
    const ref = `A${currentRow}`;
    rowXmls.push(
      `<row r="${currentRow}" ht="26" customHeight="1">${buildCellXml(ref, sheet.title, 4, 4)}</row>`
    );
    if (colCount > 1) {
      mergeRefs.push(`A${currentRow}:${lastCol}${currentRow}`);
    }
    currentRow++;
  }

  if (sheet.subtitle) {
    const ref = `A${currentRow}`;
    rowXmls.push(
      `<row r="${currentRow}" ht="20" customHeight="1">${buildCellXml(ref, sheet.subtitle, 5, 5)}</row>`
    );
    if (colCount > 1) {
      mergeRefs.push(`A${currentRow}:${lastCol}${currentRow}`);
    }
    currentRow++;
  }

  const headerRowNum = currentRow;
  const headerCells = sheet.headers
    .map((h, idx) => buildCellXml(`${columnIndexToLetter(idx)}${headerRowNum}`, h, 1, 1))
    .join('');
  rowXmls.push(`<row r="${headerRowNum}" ht="24" customHeight="1">${headerCells}</row>`);
  currentRow++;

  sheet.rows.forEach((row, rIdx) => {
    const rowNum = currentRow + rIdx;
    const isZebra = rIdx % 2 === 1;
    const textStyle = isZebra ? 6 : 2;
    const numStyle = isZebra ? 7 : 3;

    const cells: string[] = [];
    for (let c = 0; c < sheet.headers.length; c++) {
      const ref = `${columnIndexToLetter(c)}${rowNum}`;
      cells.push(buildCellXml(ref, row[c], textStyle, numStyle));
    }
    rowXmls.push(`<row r="${rowNum}">${cells.join('')}</row>`);
  });

  const lastRowNum = Math.max(headerRowNum, headerRowNum + sheet.rows.length);
  const colsXml = widths
    .map((w, idx) => `<col min="${idx + 1}" max="${idx + 1}" width="${w}" customWidth="1"/>`)
    .join('');

  const mergeXml =
    mergeRefs.length > 0
      ? `<mergeCells count="${mergeRefs.length}">${mergeRefs
          .map((m) => `<mergeCell ref="${m}"/>`)
          .join('')}</mergeCells>`
      : '';

  const autoFilterXml =
    sheet.headers.length > 0
      ? `<autoFilter ref="A${headerRowNum}:${lastCol}${lastRowNum}"/>`
      : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastCol}${lastRowNum}"/>
  <sheetViews>
    <sheetView${isFirstSheet ? ' tabSelected="1"' : ''} workbookViewId="0">
      <pane ySplit="${headerRowNum}" topLeftCell="A${headerRowNum + 1}" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${colsXml}</cols>
  <sheetData>${rowXmls.join('')}</sheetData>
  ${autoFilterXml}
  ${mergeXml}
</worksheet>`;
}

function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="@"/>
  </numFmts>
  <fonts count="4">
    <font><sz val="11"/><name val="Tahoma"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Tahoma"/></font>
    <font><b/><sz val="13"/><color rgb="FF1E1B4B"/><name val="Tahoma"/></font>
    <font><sz val="10"/><color rgb="FF475569"/><name val="Tahoma"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF3730A3"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEEF2FF"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="8">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>
  </cellXfs>
</styleSheet>`;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function buildZipArchive(entries: ZipEntry[]): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  // Fixed valid DOS timestamp (2026-01-01 08:00:00)
  const dosTime = 0x4000;
  const dosDate = 0x5c21;

  for (const entry of entries) {
    const nameBytes = textEncoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true); // Version needed to extract (2.0)
    lv.setUint16(6, 0x0800, true); // UTF-8 filename encoding
    lv.setUint16(8, 0, true); // Compression method 0 = STORE
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, entry.data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central file header signature
    cv.setUint16(4, 20, true); // Version made by
    cv.setUint16(6, 20, true); // Version needed
    cv.setUint16(8, 0x0800, true); // UTF-8 flag
    cv.setUint16(10, 0, true); // Compression method 0 = STORE
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // Extra length
    cv.setUint16(32, 0, true); // Comment length
    cv.setUint16(34, 0, true); // Disk number start
    cv.setUint16(36, 0, true); // Internal file attributes
    cv.setUint32(38, 0, true); // External file attributes
    cv.setUint32(42, offset, true); // Relative offset of local header
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + size;
  }

  const centralDirSize = centralParts.reduce((acc, part) => acc + part.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // End of central directory signature
  ev.setUint16(4, 0, true); // Number of this disk
  ev.setUint16(6, 0, true); // Disk where central directory starts
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralDirSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true); // Comment length

  const totalLength = offset + centralDirSize + eocd.length;
  const output = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of localParts) {
    output.set(part, pos);
    pos += part.length;
  }
  for (const part of centralParts) {
    output.set(part, pos);
    pos += part.length;
  }
  output.set(eocd, pos);
  return output;
}

export function buildXlsxBytes(rawSheets: XlsxSheet[]): Uint8Array {
  const sheets = rawSheets.length > 0 ? rawSheets : [{ name: 'Sheet1', headers: ['Empty'], rows: [] }];
  const usedNames = new Set<string>();
  const sanitizedNames = sheets.map((s) => sanitizeSheetName(s.name, usedNames));

  const contentTypesOverrides = sheets
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join('');

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${contentTypesOverrides}
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookSheetsXml = sanitizedNames
    .map((name, i) => `<sheet name="${escapeXml(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('');

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${workbookSheetsXml}</sheets>
</workbook>`;

  const workbookRelsEntries = sheets
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
    )
    .join('');

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${workbookRelsEntries}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const entries: ZipEntry[] = [
    { name: '[Content_Types].xml', data: textEncoder.encode(contentTypesXml) },
    { name: '_rels/.rels', data: textEncoder.encode(rootRelsXml) },
    { name: 'xl/workbook.xml', data: textEncoder.encode(workbookXml) },
    { name: 'xl/_rels/workbook.xml.rels', data: textEncoder.encode(workbookRelsXml) },
    { name: 'xl/styles.xml', data: textEncoder.encode(buildStylesXml()) },
    ...sheets.map((sheet, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: textEncoder.encode(buildWorksheetXml(sheet, i === 0)),
    })),
  ];

  return buildZipArchive(entries);
}

export function buildXlsxBlob(sheets: XlsxSheet[]): Blob {
  const bytes = buildXlsxBytes(sheets);
  return new Blob([bytes.slice().buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function downloadXlsx(filename: string, sheets: XlsxSheet[]): void {
  const safeName = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  const blob = buildXlsxBlob(sheets);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
