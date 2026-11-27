import { describe, it, expect } from 'vitest';
import {
  decodeThaiBuffer,
  parseDelimitedTextToRows,
  getNextSequentialEmail,
} from './file-import-helpers';

describe('file-import-helpers', () => {
  it('decodes UTF-8 Thai strings accurately', () => {
    const original = 'พระมหาขันทอง ถาวโร,เจ้าหน้าที่,สำนักงานคณบดี';
    const utf8Buffer = new TextEncoder().encode(original);
    const decoded = decodeThaiBuffer(utf8Buffer);
    expect(decoded).toBe(original);
  });

  it('parses tab-delimited and comma-delimited text into 2D rows', () => {
    const tsv = 'พระมหาศตนนท\tเจ้าหน้าที่\tสำนักงานคณบดี\nพระมหาขันทอง\tเจ้าหน้าที่\tสำนักงานคณบดี';
    const rows = parseDelimitedTextToRows(tsv);
    expect(rows.length).toBe(2);
    expect(rows[0][0]).toBe('พระมหาศตนนท');
    expect(rows[1][0]).toBe('พระมหาขันทอง');

    const csv = '"พระมหาดวงเด่น, ผศ.ดร.",อาจารย์ประจำ,มจร\n"ดร.สมชาย",อาจารย์พิเศษ,มจร';
    const csvRows = parseDelimitedTextToRows(csv);
    expect(csvRows.length).toBe(2);
    expect(csvRows[0][0]).toBe('พระมหาดวงเด่น, ผศ.ดร.');
    expect(csvRows[1][1]).toBe('อาจารย์พิเศษ');
  });

  it('generates sequential emails avoiding collision with existing and staged emails', () => {
    const existing = ['officer01@mcu.ac.th', 'officer02@mcu.ac.th'];
    const email1 = getNextSequentialEmail({
      prefix: 'officer',
      existingEmails: existing,
      offsetIndex: 0,
      stagedEmails: [],
    });
    expect(email1).toBe('officer03@mcu.ac.th');

    const email2 = getNextSequentialEmail({
      prefix: 'officer',
      existingEmails: existing,
      offsetIndex: 1,
      stagedEmails: ['officer03@mcu.ac.th'],
    });
    expect(email2).toBe('officer04@mcu.ac.th');

    const vpEmail = getNextSequentialEmail({
      prefix: 'vipassana',
      existingEmails: ['vipassana01@mcu.ac.th'],
    });
    expect(vpEmail).toBe('vipassana02@mcu.ac.th');
  });
});
