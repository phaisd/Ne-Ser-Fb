/**
 * Standard-compliant CSV / TSV / Delimited Text Parser
 *
 * Supports:
 * - RFC 4180 quotation and embedded newlines/quotes
 * - Auto-delimiter detection: Tab (\t), Semicolon (;), Comma (,), Pipe (|)
 * - Academic / Monastic Title recombination with comma suffixes
 *   (e.g., "พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.")
 */

export const ACADEMIC_SUFFIX_REGEX =
  /^(รศ\.ดร\.|ผศ\.ดร\.|ศ\.ดร\.|ดร\.|รศ\.|ผศ\.|ศ\.|อ\.ดร\.|อ\.|ป\.ธ\.\s*[๑-๙1-9]|ph\.?d|m\.?a|b\.?a)/i;

/**
 * Detects the most appropriate delimiter from the first line or header.
 */
export function detectDelimiter(firstLine: string): string {
  const clean = firstLine.replace(/^\uFEFF/, '');
  if (clean.includes('\t')) return '\t';
  if (clean.includes('|')) return '|';
  if (clean.includes(';') && !clean.includes(',')) return ';';
  return ',';
}

/**
 * Splits raw CSV text into logical rows while honoring multiline quoted values.
 */
export function splitCSVLines(rawText: string): string[] {
  const text = rawText.trim();
  if (!text) return [];

  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' || char === "'") {
      current += char;
      if (inQuotes && next === char) {
        current += next;
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
  return lines;
}

/**
 * Parses a single CSV line into column values according to delimiter and quoting rules.
 */
export function parseCSVRow(line: string, delimiter: string = ','): string[] {
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
}

/**
 * Recombines split Thai/English academic title suffixes when a comma split the name.
 * Example: ["พระมหาจีรวัฒน์ กนฺตวณฺโณ", "รศ.ดร.", "teacher@mcu.ac.th"]
 *      ->  ["พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.", "teacher@mcu.ac.th"]
 */
export function recombineAcademicTitles(values: string[]): string[] {
  const result = [...values];
  while (result.length > 2 && ACADEMIC_SUFFIX_REGEX.test(result[1].trim())) {
    result[0] = `${result[0].trim()}, ${result[1].trim()}`;
    result.splice(1, 1);
  }
  return result;
}
