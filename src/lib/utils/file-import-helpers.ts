/**
 * Shared File Import & Charset Helpers
 * Provides Thai-safe CSV decoding (UTF-8 / Windows-874 / TIS-620 fallback),
 * unified Excel (.xlsx) / CSV reading, and sequential MCU email generation.
 */

import { parseXlsxBuffer, parseXlsxToTsv } from './xlsx-import';

/**
 * Safely decodes a text or CSV file buffer, trying UTF-8 first,
 * and seamlessly falling back to Windows-874 / TIS-620 for Thai Excel exports.
 */
export function decodeThaiBuffer(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  // 1. Try strict UTF-8
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    return utf8Decoder.decode(bytes);
  } catch {
    // 2. Fall back to Windows-874 (Thai Windows ANSI)
    try {
      const win874Decoder = new TextDecoder('windows-874');
      return win874Decoder.decode(bytes);
    } catch {
      // 3. Last fallback: non-fatal UTF-8
      const fallbackDecoder = new TextDecoder('utf-8');
      return fallbackDecoder.decode(bytes);
    }
  }
}

/**
 * Reads a File from an input event, auto-detecting .xlsx or .csv/.txt,
 * and returning the decoded 2D string grid and raw TSV/CSV text.
 */
export async function readSpreadsheetFile(file: File): Promise<{
  rows: string[][];
  rawText: string;
  isXlsx: boolean;
}> {
  const isXlsx = file.name.endsWith('.xlsx') || file.type.includes('spreadsheetml');
  const buffer = await file.arrayBuffer();

  if (isXlsx) {
    const rows = await parseXlsxBuffer(buffer);
    const rawText = rows.map((r) => r.join('\t')).join('\n');
    return { rows, rawText, isXlsx: true };
  }

  // Otherwise treat as CSV / TSV text with Thai charset safety
  const rawText = decodeThaiBuffer(buffer);
  const rows = parseDelimitedTextToRows(rawText);
  return { rows, rawText, isXlsx: false };
}

/**
 * Parses raw text separated by tabs or commas into a 2D string array.
 */
export function parseDelimitedTextToRows(rawText: string): string[][] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.map((line) => {
    if (line.includes('\t')) {
      return line.split('\t').map((c) => c.trim());
    }
    // Simple CSV parser supporting quotes
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    cells.push(cur.trim());
    return cells;
  });
}

/**
 * Generates the next available sequential email (e.g. officer01@mcu.ac.th or vipassana01@mcu.ac.th)
 * avoiding conflicts with both existing system accounts and staged rows.
 */
export function getNextSequentialEmail({
  prefix,
  domain = 'mcu.ac.th',
  offsetIndex = 0,
  existingEmails = [],
  stagedEmails = [],
  padLength = 2,
}: {
  prefix: string;
  domain?: string;
  offsetIndex?: number;
  existingEmails?: string[];
  stagedEmails?: string[];
  padLength?: number;
}): string {
  const cleanExisting = new Set(existingEmails.map((e) => (e || '').toLowerCase().trim()));
  const cleanStaged = new Set(
    stagedEmails.slice(0, offsetIndex).map((e) => (e || '').toLowerCase().trim())
  );

  let seq = 1;
  while (seq < 1000) {
    const numStr = String(seq).padStart(padLength, '0');
    const candidate = `${prefix}${numStr}@${domain}`.toLowerCase();
    if (!cleanExisting.has(candidate) && !cleanStaged.has(candidate)) {
      return candidate;
    }
    seq++;
  }
  return `${prefix}${Date.now()}@${domain}`.toLowerCase();
}
