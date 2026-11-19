import { describe, it, expect } from 'vitest';
import { generateCsvContent } from './csv-helpers';

describe('csv-helpers utility', () => {
  it('generates CSV with UTF-8 BOM and properly quoted cells', () => {
    const headers = ['ลำดับ', 'รหัสนิสิต', 'ชื่อ-นามสกุล'];
    const rows = [
      [1, '6501201001', 'พระสมศักดิ์ วรสเวทโช'],
      [2, '6501201002', 'นายสมคิด, มีชื่อคอมมา'],
    ];

    const result = generateCsvContent(headers, rows);
    expect(result.startsWith('\uFEFF')).toBe(true);
    expect(result).toContain('ลำดับ,รหัสนิสิต,ชื่อ-นามสกุล');
    expect(result).toContain('1,6501201001,พระสมศักดิ์ วรสเวทโช');
    expect(result).toContain('2,6501201002,"นายสมคิด, มีชื่อคอมมา"');
  });

  it('escapes existing double quotes inside strings', () => {
    const headers = ['ข้อความ'];
    const rows = [['มี "เครื่องหมายคำพูด" อยู่ในนี้']];
    const result = generateCsvContent(headers, rows);
    expect(result).toContain('"มี ""เครื่องหมายคำพูด"" อยู่ในนี้"');
  });
});
