import { SeatZone } from '@/types/event';

export type ParticipantStatusCategory =
  | 'MONK'
  | 'SAMANERA'
  | 'BHIKKHUNI'
  | 'MAECHI'
  | 'LAY_MALE'
  | 'LAY_FEMALE'
  | 'UNKNOWN';

/**
 * Helper to generate seat codes for a zone
 * Example: zone prefix "A", row 1, col 5 -> "A-05" or "A-1-05"
 */
export function generateZoneSeatCodes(zone: SeatZone, disabledSeats: string[] = []): string[] {
  const disabledSet = new Set(disabledSeats.map((s) => s.trim().toUpperCase()));
  const prefix = (zone.prefix || zone.name.substring(0, 1) || 'Z').trim().toUpperCase();
  const seats: string[] = [];

  for (let r = 1; r <= zone.rows; r++) {
    // Generate row letter or row number
    const rowChar = String.fromCharCode(64 + r); // 1->A, 2->B, etc.
    for (let c = 1; c <= zone.cols; c++) {
      const colStr = c < 10 ? `0${c}` : `${c}`;
      // Format: A-01, A-02 or A1-01
      const seatCode = zone.rows <= 26 ? `${prefix}${rowChar}-${colStr}` : `${prefix}${r}-${colStr}`;
      if (!disabledSet.has(seatCode.toUpperCase())) {
        seats.push(seatCode);
      }
    }
  }

  return seats;
}

/**
 * Categorize participant status and clerical title to optimize seating layout according to monastic discipline
 */
export function detectParticipantStatus(
  name: string = '',
  role: string = ''
): { category: ParticipantStatusCategory; label: string; priority: number } {
  const cleanName = (name || '').trim().toLowerCase();
  const cleanRole = (role || '').trim().toLowerCase();

  // 1. พระภิกษุ (Monk)
  if (
    cleanRole === 'monk' ||
    cleanName.startsWith('พระ') ||
    cleanName.startsWith('พระมหา') ||
    cleanName.startsWith('พระครู') ||
    cleanName.startsWith('พระอธิการ') ||
    cleanName.startsWith('เจ้าคุณ') ||
    cleanName.startsWith('ven.') ||
    cleanName.startsWith('ven ') ||
    cleanName.startsWith('phra') ||
    cleanName.includes('ภิกขุ') ||
    cleanName.includes('ภิกษุ')
  ) {
    return { category: 'MONK', label: 'พระภิกษุ', priority: 1 };
  }

  // 2. สามเณร (Novice / Samanera)
  if (
    cleanName.startsWith('สามเณร') ||
    cleanName.startsWith('เณร') ||
    cleanName.startsWith('samanera') ||
    cleanName.startsWith('novice')
  ) {
    return { category: 'SAMANERA', label: 'สามเณร', priority: 2 };
  }

  // 3. ภิกษุณี / สามเณรี (Bhikkhuni)
  if (
    cleanName.startsWith('ภิกษุณี') ||
    cleanName.startsWith('สามเณรี') ||
    cleanName.startsWith('bhikkhuni')
  ) {
    return { category: 'BHIKKHUNI', label: 'ภิกษุณี', priority: 3 };
  }

  // 4. แม่ชี (Nun / Maechi)
  if (
    cleanName.startsWith('แม่ชี') ||
    cleanName.startsWith('ชี') ||
    cleanName.startsWith('maechi') ||
    cleanName.startsWith('nun')
  ) {
    return { category: 'MAECHI', label: 'แม่ชี', priority: 4 };
  }

  // 5. คฤหัสถ์ชาย (Lay Male)
  if (
    cleanName.startsWith('นาย') ||
    cleanName.startsWith('mr.') ||
    cleanName.startsWith('mr ') ||
    cleanName.startsWith('เด็กชาย') ||
    cleanName.startsWith('ด.ช.')
  ) {
    return { category: 'LAY_MALE', label: 'คฤหัสถ์ชาย', priority: 5 };
  }

  // 6. คฤหัสถ์หญิง (Lay Female)
  if (
    cleanName.startsWith('นาง') ||
    cleanName.startsWith('นางสาว') ||
    cleanName.startsWith('น.ส.') ||
    cleanName.startsWith('ms.') ||
    cleanName.startsWith('ms ') ||
    cleanName.startsWith('mrs.') ||
    cleanName.startsWith('mrs ') ||
    cleanName.startsWith('เด็กหญิง') ||
    cleanName.startsWith('ด.ญ.')
  ) {
    return { category: 'LAY_FEMALE', label: 'คฤหัสถ์หญิง', priority: 6 };
  }

  return { category: 'UNKNOWN', label: 'ทั่วไป', priority: 7 };
}
