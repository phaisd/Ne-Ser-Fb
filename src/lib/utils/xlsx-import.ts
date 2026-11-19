/**
 * Zero-dependency OOXML (.xlsx) parser for Browser & Node.js.
 * Reads standard Excel workbooks created by Microsoft Excel, Google Sheets,
 * LibreOffice Calc, or our own buildXlsxBytes generator without external npm packages.
 */

export interface ParsedXlsxSheet {
  name: string;
  rows: string[][];
}

/**
 * Converts column letters (e.g. "A", "B", "Z", "AA") into zero-based index.
 */
export function colLetterToIndex(colStr: string): number {
  let index = 0;
  for (let i = 0; i < colStr.length; i++) {
    const code = colStr.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      index = index * 26 + (code - 64);
    } else if (code >= 97 && code <= 122) {
      index = index * 26 + (code - 96);
    }
  }
  return Math.max(0, index - 1);
}

/**
 * Decompresses raw DEFLATE bytes using native Web API DecompressionStream
 */
async function decompressDeflateRaw(compressed: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(compressed as unknown as BufferSource);
  writer.close();

  const chunks: Uint8Array[] = [];
  const reader = ds.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

interface ZipEntry {
  filename: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

/**
 * Parses Central Directory of a standard ZIP archive.
 */
function readZipCentralDirectory(buffer: Uint8Array): ZipEntry[] {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const len = buffer.length;

  // Search backward for End of Central Directory (EOCD) signature: 0x06054b50 ("PK\x05\x06")
  let eocdOffset = -1;
  const searchLimit = Math.max(0, len - 65536);
  for (let i = len - 22; i >= searchLimit; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('Invalid file: not a valid ZIP/XLSX archive');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);

  const decoder = new TextDecoder('utf-8');
  const entries: ZipEntry[] = [];
  let curr = cdOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (curr + 46 > len) break;
    const sig = view.getUint32(curr, true);
    if (sig !== 0x02014b50) break; // "PK\x01\x02"

    const compressionMethod = view.getUint16(curr + 10, true);
    const compressedSize = view.getUint32(curr + 20, true);
    const uncompressedSize = view.getUint32(curr + 24, true);
    const fileNameLength = view.getUint16(curr + 28, true);
    const extraFieldLength = view.getUint16(curr + 30, true);
    const commentLength = view.getUint16(curr + 32, true);
    const localHeaderOffset = view.getUint32(curr + 42, true);

    const nameBytes = buffer.subarray(curr + 46, curr + 46 + fileNameLength);
    const filename = decoder.decode(nameBytes);

    entries.push({
      filename,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });

    curr += 46 + fileNameLength + extraFieldLength + commentLength;
  }

  return entries;
}

/**
 * Extracts and decompresses a single file from ZIP by its ZipEntry metadata
 */
async function extractZipEntry(buffer: Uint8Array, entry: ZipEntry): Promise<string> {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const localOffset = entry.localHeaderOffset;

  if (view.getUint32(localOffset, true) !== 0x04034b50) {
    throw new Error(`Corrupt ZIP: invalid local header for ${entry.filename}`);
  }

  const localNameLen = view.getUint16(localOffset + 26, true);
  const localExtraLen = view.getUint16(localOffset + 28, true);
  const dataStart = localOffset + 30 + localNameLen + localExtraLen;
  const compressedBytes = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  let uncompressedBytes: Uint8Array;
  if (entry.compressionMethod === 0) {
    uncompressedBytes = compressedBytes;
  } else if (entry.compressionMethod === 8) {
    uncompressedBytes = await decompressDeflateRaw(compressedBytes);
  } else {
    throw new Error(`Unsupported compression method ${entry.compressionMethod} in ${entry.filename}`);
  }

  return new TextDecoder('utf-8').decode(uncompressedBytes);
}

/**
 * Simple XML text extractor (handles shared strings and inline strings)
 */
function extractSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  // Match each <si> ... </si> block
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/gi;
  let match: RegExpExecArray | null;

  while ((match = siRegex.exec(xml)) !== null) {
    const siContent = match[1];
    // Collect all <t> or <t xml:space="..."> tags inside this <si>
    const tRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/gi;
    let tMatch: RegExpExecArray | null;
    let combined = '';
    while ((tMatch = tRegex.exec(siContent)) !== null) {
      combined += unescapeXml(tMatch[1]);
    }
    strings.push(combined);
  }

  return strings;
}

function unescapeXml(val: string): string {
  return val
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Parses sheet XML into 2D string matrix, preserving empty column spaces
 */
function parseSheetXml(sheetXml: string, sharedStrings: string[]): string[][] {
  const rows: string[][] = [];
  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const rowContent = rowMatch[1];
    const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/gi;
    let cellMatch: RegExpExecArray | null;
    const rowValues: string[] = [];

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const attrs = cellMatch[1];
      const cellBody = cellMatch[2];

      // Extract cell ref like r="A1", r="AA12"
      const refMatch = attrs.match(/\br="([A-Za-z]+)(\d+)"/);
      let colIdx = rowValues.length;
      if (refMatch) {
        colIdx = colLetterToIndex(refMatch[1]);
      }

      // Check cell type
      const typeMatch = attrs.match(/\bt="([^"]+)"/);
      const cellType = typeMatch ? typeMatch[1] : '';

      let value = '';
      if (cellType === 's') {
        const vMatch = cellBody.match(/<v>(\d+)<\/v>/);
        if (vMatch) {
          const sIdx = parseInt(vMatch[1], 10);
          value = sharedStrings[sIdx] || '';
        }
      } else if (cellType === 'inlineStr') {
        const isMatch = cellBody.match(/<t\b[^>]*>([\s\S]*?)<\/t>/);
        if (isMatch) value = unescapeXml(isMatch[1]);
      } else {
        const vMatch = cellBody.match(/<v>([\s\S]*?)<\/v>/);
        if (vMatch) {
          value = unescapeXml(vMatch[1]);
        }
      }

      // Fill empty slots up to colIdx
      while (rowValues.length < colIdx) {
        rowValues.push('');
      }
      rowValues[colIdx] = value.trim();
    }

    if (rowValues.length > 0 && rowValues.some((c) => c !== '')) {
      rows.push(rowValues);
    }
  }

  return rows;
}

/**
 * Parses an Excel (.xlsx) file buffer and returns array of sheet rows.
 */
export async function parseXlsxBuffer(buffer: ArrayBuffer | Uint8Array): Promise<string[][]> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const entries = readZipCentralDirectory(bytes);

  // 1. Read shared strings if present
  let sharedStrings: string[] = [];
  const sstEntry = entries.find((e) => e.filename.toLowerCase() === 'xl/sharedstrings.xml');
  if (sstEntry) {
    const sstXml = await extractZipEntry(bytes, sstEntry);
    sharedStrings = extractSharedStrings(sstXml);
  }

  // 2. Locate first sheet
  const sheetEntry =
    entries.find((e) => e.filename.toLowerCase() === 'xl/worksheets/sheet1.xml') ||
    entries.find((e) => e.filename.toLowerCase().startsWith('xl/worksheets/sheet') && e.filename.toLowerCase().endsWith('.xml'));

  if (!sheetEntry) {
    throw new Error('No worksheet found inside Excel workbook');
  }

  const sheetXml = await extractZipEntry(bytes, sheetEntry);
  return parseSheetXml(sheetXml, sharedStrings);
}

/**
 * Converts parsed Excel rows into tab-separated values (TSV) compatible with parseGroupedParticipantsText
 */
export async function parseXlsxToTsv(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const rows = await parseXlsxBuffer(buffer);
  return rows.map((r) => r.join('\t')).join('\n');
}
