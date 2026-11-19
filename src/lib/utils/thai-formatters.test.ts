import { describe, it, expect } from 'vitest';
import { toThaiDigits, toArabicDigits, extractThaiYear } from './thai-formatters';

describe('thai-formatters utility', () => {
  it('converts arabic digits to thai digits', () => {
    expect(toThaiDigits(2569)).toBe('๒๕๖๙');
    expect(toThaiDigits('T123')).toBe('T๑๒๓');
    expect(toThaiDigits('')).toBe('');
    expect(toThaiDigits(null)).toBe('');
  });

  it('converts thai digits to arabic digits', () => {
    expect(toArabicDigits('๒๕๖๙')).toBe('2569');
    expect(toArabicDigits('กลุ่ม ๑')).toBe('กลุ่ม 1');
  });

  it('extracts thai year correctly from academicYear or title', () => {
    expect(extractThaiYear('2569')).toBe('๒๕๖๙');
    expect(extractThaiYear('2026')).toBe('๒๕๖๙');
    expect(extractThaiYear(undefined, 'โครงการปฏิบัติธรรม ปี ๒๕๖๙')).toBe('๒๕๖๙');
    expect(extractThaiYear(undefined, 'โครงการวิปัสสนา 2568')).toBe('๒๕๖๘');
    expect(extractThaiYear()).toBe('๒๕๖๙');
  });
});
