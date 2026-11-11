import { describe, expect, it } from 'vitest';
import { buildCsvContent, escapeCsvCell } from './csv-export';

describe('csv-export utilities', () => {
  it('escapes commas, quotes, newlines, and nullish values safely', () => {
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
    expect(escapeCsvCell('ธรรมะ, ปฏิบัติ')).toBe('"ธรรมะ, ปฏิบัติ"');
    expect(escapeCsvCell('กล่าวว่า "สาธุ"')).toBe('"กล่าวว่า ""สาธุ"""');
  });

  it('builds UTF-8 BOM CSV rows cleanly', () => {
    const csv = buildCsvContent(['รหัส', 'ชื่อ'], [['T321', 'พระมหาสมชาย, ป.ธ.9']]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('รหัส,ชื่อ\r\nT321,"พระมหาสมชาย, ป.ธ.9"');
  });
});
