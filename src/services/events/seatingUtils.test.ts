import { describe, it, expect } from 'vitest';
import { detectParticipantStatus, normalizeSeatCode, generateZoneSeatCodes } from './seatingUtils';
import { formatSeatCode, parseSeatCode } from '@/components/admin/modals/vipassana/seat-map/seatGridUtils';
import type { SeatZone } from '@/types/event';

describe('detectParticipantStatus', () => {
  it('detects Thai monk names without explicit role', () => {
    expect(detectParticipantStatus('พระวิชัย วิชโย').category).toBe('MONK');
    expect(detectParticipantStatus('พระมหากุศล กุสลจิตโต').category).toBe('MONK');
    expect(detectParticipantStatus('พระครูสมุห์รัชกฤช ภทฺทปญฺโญ').category).toBe('MONK');
  });

  it('detects English/foreign monk names when role is "พระภิกษุ" or "Monk"', () => {
    expect(detectParticipantStatus('Tay Zein Da', 'พระภิกษุ').category).toBe('MONK');
    expect(detectParticipantStatus('Tay Zein Da', 'พระภิกษุ').label).toBe('พระภิกษุ');

    expect(detectParticipantStatus('Acinna', 'พระภิกษุ').category).toBe('MONK');
    expect(detectParticipantStatus('Thiha', 'Monk').category).toBe('MONK');
    expect(detectParticipantStatus('Bounmy Xaymonty', 'พระภิกษุ').category).toBe('MONK');
  });

  it('detects English/foreign monks by Buddhist clerical titles in name', () => {
    expect(detectParticipantStatus('Rev Pitawala Vimaladhamma Thero').category).toBe('MONK');
    expect(detectParticipantStatus('Ashin Aggacara').category).toBe('MONK');
    expect(detectParticipantStatus('Pahalawela Dhammakitthi Thero').category).toBe('MONK');
    expect(detectParticipantStatus('Ven. Dhammasiri -').category).toBe('MONK');
  });

  it('detects samanera (novice) with role or name', () => {
    expect(detectParticipantStatus('Khanon Barua Purna', 'สามเณร').category).toBe('SAMANERA');
    expect(detectParticipantStatus('Babu Tongchangya', 'Novice').category).toBe('SAMANERA');
    expect(detectParticipantStatus('สามเณรอภิสร ใสสะอาด').category).toBe('SAMANERA');
  });

  it('detects bhikkhuni, samaneri, maechi, lay male, lay female', () => {
    expect(detectParticipantStatus('Bhikkhuni Quach Thi Diu').category).toBe('BHIKKHUNI');
    expect(detectParticipantStatus('Quach Thi Diu', 'ภิกษุณี').category).toBe('BHIKKHUNI');
    expect(detectParticipantStatus('Quach Thi Diu', 'ภิกษุณี').label).toBe('ภิกษุณี');

    // Samaneri (สามเณรี)
    expect(detectParticipantStatus('Samaneri Dhammanandi').category).toBe('BHIKKHUNI');
    expect(detectParticipantStatus('Samaneri Dhammanandi').label).toBe('สามเณรี');
    expect(detectParticipantStatus('Dhammanandi', 'สามเณรี').category).toBe('BHIKKHUNI');
    expect(detectParticipantStatus('Dhammanandi', 'สามเณรี').label).toBe('สามเณรี');
    expect(detectParticipantStatus('Dhammanandi', 'samaneri').label).toBe('สามเณรี');

    expect(detectParticipantStatus('แม่ชีสุวีรา').category).toBe('MAECHI');
    expect(detectParticipantStatus('Suweera', 'แม่ชี').category).toBe('MAECHI');
    expect(detectParticipantStatus('Mr. Khun Maung Chan Aung', 'คฤหัสถ์ชาย').category).toBe('LAY_MALE');
    expect(detectParticipantStatus('Khun Maung Chan Aung', 'คฤหัสถ์ชาย').category).toBe('LAY_MALE');
    expect(detectParticipantStatus('Miss Jesy Chakma', 'คฤหัสถ์หญิง').category).toBe('LAY_FEMALE');
    expect(detectParticipantStatus('Jesy Chakma', 'คฤหัสถ์หญิง').category).toBe('LAY_FEMALE');
  });
});

describe('normalizeSeatCode', () => {
  it('normalizes single-digit columns to two-digit format', () => {
    expect(normalizeSeatCode('Q-3')).toBe('Q-03');
    expect(normalizeSeatCode('R-1')).toBe('R-01');
    expect(normalizeSeatCode('S-4')).toBe('S-04');
    expect(normalizeSeatCode('A-1')).toBe('A-01');
  });

  it('normalizes multi-digit/zero-padded numbers correctly', () => {
    expect(normalizeSeatCode('N-013')).toBe('N-13');
    expect(normalizeSeatCode('N-014')).toBe('N-14');
    expect(normalizeSeatCode('A-01')).toBe('A-01');
    expect(normalizeSeatCode('B-14')).toBe('B-14');
  });

  it('supports underscore delimiter and prefixes', () => {
    expect(normalizeSeatCode('A_05')).toBe('A-05');
    expect(normalizeSeatCode('B-A-1')).toBe('B-A-01');
    expect(normalizeSeatCode('z1-a-2')).toBe('Z1-A-02');
  });

  it('handles empty or blank values safely', () => {
    expect(normalizeSeatCode('')).toBe('');
    expect(normalizeSeatCode('   ')).toBe('');
  });
});

describe('generateZoneSeatCodes and formatSeatCode', () => {
  const standardZone: SeatZone = {
    id: 'zone-1',
    name: 'โซน A (พระภิกษุ)',
    color: 'amber',
    rows: 19,
    cols: 14,
    prefix: '',
  };

  it('generates rows A through S without legacy duplicated prefix', () => {
    const codes = generateZoneSeatCodes(standardZone);
    expect(codes[0]).toBe('A-01');
    expect(codes[13]).toBe('A-14');
    expect(codes[14]).toBe('B-01');
    // Row 19 is 'S'
    expect(codes).toContain('S-01');
    expect(codes).toContain('S-14');
    expect(codes).not.toContain('AA-01');
  });

  it('handles legacy prefix "A" by formatting standard single-letter rows', () => {
    const legacyZone: SeatZone = {
      id: 'zone-legacy',
      name: 'โซน A',
      color: 'amber',
      rows: 10,
      cols: 10,
      prefix: 'A',
    };
    expect(formatSeatCode(legacyZone, 0, 0)).toBe('A-01');
    expect(formatSeatCode(legacyZone, 1, 0)).toBe('B-01');
    expect(parseSeatCode('A-01', legacyZone)).toEqual({ rIdx: 0, cIdx: 0 });
    expect(parseSeatCode('B-01', legacyZone)).toEqual({ rIdx: 1, cIdx: 0 });
  });

  it('parses seat codes correctly including single-digit unnormalized codes', () => {
    expect(parseSeatCode('Q-3', standardZone)).toEqual({ rIdx: 16, cIdx: 2 });
    expect(parseSeatCode('S-06', standardZone)).toEqual({ rIdx: 18, cIdx: 5 });
    expect(parseSeatCode('N-013', standardZone)).toEqual({ rIdx: 13, cIdx: 12 });
  });
});
