/**
 * Thai numeral and Buddhist calendar formatters
 */

const THAI_DIGITS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
const ARABIC_DIGITS: Record<string, string> = {
  '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
  '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',
};

/**
 * Converts any Arabic numerals (0-9) in a string or number to Thai numerals (๐-๙)
 */
export function toThaiDigits(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  return String(input).replace(/\d/g, (d) => THAI_DIGITS[parseInt(d, 10)] ?? d);
}

/**
 * Converts Thai numerals (๐-๙) in a string back to Arabic numerals (0-9)
 */
export function toArabicDigits(input: string | undefined | null): string {
  if (!input) return '';
  return input.replace(/[๐-๙]/g, (d) => ARABIC_DIGITS[d] ?? d);
}

/**
 * Extracts or computes the 4-digit Thai Buddhist Year (พ.ศ.)
 * e.g. from "2569", 2026 -> "2569", or from text "โครงการ... ปี ๒๕๖๙" -> "๒๕๖๙"
 */
export function extractThaiYear(academicYear?: string | number, title?: string): string {
  if (academicYear) {
    const raw = String(academicYear).trim();
    if (raw.length === 4) {
      // If it's CE year like 2026, convert to BE
      const num = parseInt(raw, 10);
      if (num < 2400) {
        return toThaiDigits(num + 543);
      }
      return toThaiDigits(num);
    }
  }

  if (title) {
    const thaiMatch = title.match(/๒๕\d{2}/);
    if (thaiMatch) return thaiMatch[0];
    const arabicMatch = title.match(/25\d{2}/);
    if (arabicMatch) return toThaiDigits(arabicMatch[0]);
  }

  return '๒๕๖๙';
}
