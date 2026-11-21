import { describe, it, expect } from 'vitest';
import { detectParticipantStatus } from './seatingUtils';

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
