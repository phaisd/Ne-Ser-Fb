import { describe, it, expect } from 'vitest';
import {
  formatThaiDate,
  formatEnglishDate,
  maskPassport,
  formatPhoneNumber,
  extractDocSeqNumber,
  calculateNextDocNo,
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

  it('extracts running sequence numbers correctly across 8002 and 8002.1 prefixes', () => {
    expect(extractDocSeqNumber('8002/ 10')).toBe(10);
    expect(extractDocSeqNumber('8002.1/ 11')).toBe(11);
    expect(extractDocSeqNumber('อว 8002/ 010')).toBe(10);
    expect(extractDocSeqNumber('อว 8002.1/ 011')).toBe(11);
    expect(extractDocSeqNumber('010/2569')).toBe(10);
    expect(extractDocSeqNumber('050/2569')).toBe(50);
    expect(extractDocSeqNumber('50')).toBe(50);
    expect(extractDocSeqNumber('MCU No. 8002.1 / 077')).toBe(77);
  });

  it('calculates continuous next sequence number across 8002 and 8002.1 and handles starting offsets', () => {
    const sampleRequests = [
      { docNo: '8002/ 10', status: 'APPROVED' },
      { docNo: '8002.1/ 11', status: 'APPROVED' },
    ];
    const nextResult = calculateNextDocNo(sampleRequests, 2569);
    expect(nextResult.nextNum).toBe(12);
    expect(nextResult.seqOnly).toBe('012');
    expect(nextResult.docNoWithYear).toBe('012/2569');

    // Case when user had offline documents up to 50
    const offlineRequests = [
      { docNo: '8002/ 050/2569', status: 'APPROVED' },
    ];
    const nextAfter50 = calculateNextDocNo(offlineRequests, 2569);
    expect(nextAfter50.nextNum).toBe(51);
    expect(nextAfter50.seqOnly).toBe('051');
    expect(nextAfter50.docNoWithYear).toBe('051/2569');
  });
});
