import { describe, it, expect } from 'vitest';
import {
  formatThaiDate,
  formatEnglishDate,
  maskPassport,
  formatPhoneNumber,
} from './formatters';

describe('formatters utility (Data Protection & Localization)', () => {
  it('masks passport and citizen IDs according to PDPA compliance', () => {
    expect(maskPassport('1234567890123')).toBe('12••••23');
    expect(maskPassport('AB1234567')).toBe('AB••••67');
    expect(maskPassport('1234')).toBe('••••');
    expect(maskPassport(null)).toBe('-');
    expect(maskPassport('AB1234567', true)).toBe('AB1234567'); // unmasked
  });

  it('formats Thai phone numbers cleanly', () => {
    expect(formatPhoneNumber('0812345678')).toBe('081-234-5678');
    expect(formatPhoneNumber('021234567')).toBe('02-123-4567');
    expect(formatPhoneNumber('081-234-5678')).toBe('081-234-5678');
    expect(formatPhoneNumber(null)).toBe('-');
  });

  it('formats Thai and English dates safely without exceptions', () => {
    const isoDate = '2026-11-06T00:00:00.000Z';
    expect(formatThaiDate(isoDate)).not.toBe('-');
    expect(formatEnglishDate(isoDate)).not.toBe('-');
    expect(formatThaiDate(null)).toBe('-');
    expect(formatEnglishDate(null)).toBe('-');
    expect(formatThaiDate('invalid-date')).toBe('-');
  });
});
