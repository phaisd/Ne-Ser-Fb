import { describe, it, expect } from 'vitest';
import {
  buildXlsxBytes,
  columnIndexToLetter,
  sanitizeSheetName,
} from './xlsx-export';

function parseStoredZip(bytes: Uint8Array): Map<string, string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder('utf-8');
  const files = new Map<string, string>();

  // Locate EOCD at end of archive (no comment -> last 22 bytes)
  const eocdOffset = bytes.length - 22;
  expect(view.getUint32(eocdOffset, true)).toBe(0x06054b50);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);

  let cdPos = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    expect(view.getUint32(cdPos, true)).toBe(0x02014b50);
    const compSize = view.getUint32(cdPos + 20, true);
    const uncompSize = view.getUint32(cdPos + 24, true);
    const nameLen = view.getUint16(cdPos + 28, true);
    const extraLen = view.getUint16(cdPos + 30, true);
    const commentLen = view.getUint16(cdPos + 32, true);
    const localOffset = view.getUint32(cdPos + 42, true);

    expect(compSize).toBe(uncompSize);
    const name = decoder.decode(bytes.subarray(cdPos + 46, cdPos + 46 + nameLen));

    // Verify corresponding local file header
    expect(view.getUint32(localOffset, true)).toBe(0x04034b50);
    const localNameLen = view.getUint16(localOffset + 26, true);
    const localExtraLen = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const content = decoder.decode(bytes.subarray(dataStart, dataStart + uncompSize));

    files.set(name, content);
    cdPos += 46 + nameLen + extraLen + commentLen;
  }

  return files;
}

describe('xlsx-export utility', () => {
  it('converts column indices to Excel letters', () => {
    expect(columnIndexToLetter(0)).toBe('A');
    expect(columnIndexToLetter(25)).toBe('Z');
    expect(columnIndexToLetter(26)).toBe('AA');
    expect(columnIndexToLetter(27)).toBe('AB');
  });

  it('sanitizes and deduplicates Excel sheet names within 31 chars', () => {
    const used = new Set<string>();
    const s1 = sanitizeSheetName('บัตร:ภาระงาน/ปี*2569?[ชุด]ยาวมากๆเกินสามสิบเอ็ดตัวอักษร', used);
    const s2 = sanitizeSheetName('บัตร:ภาระงาน/ปี*2569?[ชุด]ยาวมากๆเกินสามสิบเอ็ดตัวอักษร', used);

    expect(s1.length).toBeLessThanOrEqual(31);
    expect(s2.length).toBeLessThanOrEqual(31);
    expect(s1).not.toMatch(/[:\\/?*\[\]]/);
    expect(s2).not.toBe(s1);
  });

  it('builds a valid multi-sheet OOXML .xlsx ZIP archive with Thai UTF-8 and XML escaping', () => {
    const bytes = buildXlsxBytes([
      {
        name: 'รายละเอียด',
        title: 'รายงานทดสอบ & <สรุป>',
        subtitle: 'ภาค 1/2569',
        headers: ['ลำดับ', 'ชื่ออาจารย์', 'รหัสวิชา'],
        rows: [
          [1, 'พระมหาสมชาย "กิตฺติภทฺโท"', '=SUM(1,2)'],
          [2, 'ดร.ทดสอบ\u0007อักขระควบคุม', '101101'],
        ],
      },
      {
        name: 'สรุป',
        headers: ['อาจารย์', 'จำนวนวิชา'],
        rows: [['พระมหาสมชาย', 2]],
      },
    ]);

    // ZIP local file header magic bytes PK\x03\x04
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);

    const files = parseStoredZip(bytes);
    expect(Array.from(files.keys())).toEqual([
      '[Content_Types].xml',
      '_rels/.rels',
      'xl/workbook.xml',
      'xl/_rels/workbook.xml.rels',
      'xl/styles.xml',
      'xl/worksheets/sheet1.xml',
      'xl/worksheets/sheet2.xml',
    ]);

    const workbookXml = files.get('xl/workbook.xml')!;
    expect(workbookXml).toContain('name="รายละเอียด"');
    expect(workbookXml).toContain('name="สรุป"');

    const sheet1Xml = files.get('xl/worksheets/sheet1.xml')!;
    expect(sheet1Xml).toContain('รายงานทดสอบ &amp; &lt;สรุป&gt;');
    expect(sheet1Xml).toContain('พระมหาสมชาย &quot;กิตฺติภทฺโท&quot;');
    expect(sheet1Xml).toContain('<t>=SUM(1,2)</t>'); // stored safely as inlineStr, not <f> formula
    expect(sheet1Xml).not.toContain('<f>');
    expect(sheet1Xml).not.toContain('\u0007');
    expect(sheet1Xml).toContain('<c r="A4" t="n" s="3"><v>1</v></c>');
    expect(sheet1Xml).toContain('<mergeCell ref="A1:C1"/>');
    expect(sheet1Xml).toContain('<autoFilter ref="A3:C5"/>');
  });
});
