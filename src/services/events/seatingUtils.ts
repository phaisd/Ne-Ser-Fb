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

  const isBhikkhuniRole =
    cleanRole === 'ภิกษุณี' ||
    cleanRole === 'สามเณรี' ||
    cleanRole === 'bhikkhuni' ||
    cleanRole === 'bhikshuni' ||
    cleanRole.includes('ภิกษุณี') ||
    cleanRole.includes('สามเณรี') ||
    cleanRole.includes('bhikkhuni');

  const isMonkRole =
    !isBhikkhuniRole &&
    (cleanRole === 'monk' ||
      cleanRole === 'monks' ||
      cleanRole === 'พระภิกษุ' ||
      cleanRole === 'ภิกษุ' ||
      cleanRole === 'พระ' ||
      cleanRole.includes('พระภิกษุ') ||
      (cleanRole.includes('ภิกษุ') && !cleanRole.includes('ภิกษุณี')) ||
      (cleanRole.includes('ภิกขุ') && !cleanRole.includes('ภิกขุนี')) ||
      (cleanRole.includes('bhikkhu') && !cleanRole.includes('bhikkhuni')) ||
      cleanRole.includes('monk'));

  const isSamaneraRole =
    cleanRole === 'สามเณร' ||
    cleanRole === 'เณร' ||
    cleanRole === 'novice' ||
    cleanRole === 'novices' ||
    cleanRole === 'samanera' ||
    cleanRole === 'samaneras' ||
    cleanRole.includes('สามเณร') ||
    cleanRole.includes('samanera') ||
    cleanRole.includes('novice');

  const isMaechiRole =
    cleanRole === 'แม่ชี' ||
    cleanRole === 'ชี' ||
    cleanRole === 'nun' ||
    cleanRole === 'nuns' ||
    cleanRole === 'maechi' ||
    cleanRole.includes('แม่ชี') ||
    cleanRole.includes('maechi') ||
    cleanRole.includes('nun');

  const isLayMaleRole =
    cleanRole === 'คฤหัสถ์ชาย' ||
    cleanRole === 'ฆราวาสชาย' ||
    cleanRole === 'อุบาสก' ||
    cleanRole === 'ชาย' ||
    cleanRole === 'lay male' ||
    cleanRole === 'lay_male' ||
    cleanRole === 'layman' ||
    cleanRole === 'male' ||
    cleanRole.includes('คฤหัสถ์ชาย') ||
    cleanRole.includes('ฆราวาสชาย') ||
    cleanRole.includes('lay male');

  const isLayFemaleRole =
    cleanRole === 'คฤหัสถ์หญิง' ||
    cleanRole === 'ฆราวาสหญิง' ||
    cleanRole === 'อุบาสิกา' ||
    cleanRole === 'หญิง' ||
    cleanRole === 'lay female' ||
    cleanRole === 'lay_female' ||
    cleanRole === 'laywoman' ||
    cleanRole === 'female' ||
    cleanRole.includes('คฤหัสถ์หญิง') ||
    cleanRole.includes('ฆราวาสหญิง') ||
    cleanRole.includes('lay female');

  // 1. ภิกษุณี / สามเณรี (Bhikkhuni) - Checked before monk to avoid substring clash with 'ภิกษุ' or 'bhikkhu'
  if (
    isBhikkhuniRole ||
    cleanName.startsWith('ภิกษุณี') ||
    cleanName.startsWith('สามเณรี') ||
    cleanName.startsWith('bhikkhuni') ||
    cleanName.includes('bhikkhuni') ||
    cleanName.includes('ภิกษุณี')
  ) {
    return { category: 'BHIKKHUNI', label: 'ภิกษุณี', priority: 3 };
  }

  // 2. พระภิกษุ (Monk)
  if (
    isMonkRole ||
    cleanName.startsWith('พระ') ||
    cleanName.startsWith('พระมหา') ||
    cleanName.startsWith('พระครู') ||
    cleanName.startsWith('พระอธิการ') ||
    cleanName.startsWith('เจ้าคุณ') ||
    cleanName.startsWith('ven.') ||
    cleanName.startsWith('ven ') ||
    cleanName.startsWith('phra') ||
    cleanName.startsWith('ashin') ||
    cleanName.startsWith('rev.') ||
    cleanName.startsWith('rev ') ||
    cleanName.includes('thero') ||
    cleanName.includes('ภิกขุ') ||
    cleanName.includes('ภิกษุ')
  ) {
    return { category: 'MONK', label: 'พระภิกษุ', priority: 1 };
  }

  // 3. สามเณร (Novice / Samanera)
  if (
    isSamaneraRole ||
    cleanName.startsWith('สามเณร') ||
    cleanName.startsWith('เณร') ||
    cleanName.startsWith('samanera') ||
    cleanName.startsWith('novice')
  ) {
    return { category: 'SAMANERA', label: 'สามเณร', priority: 2 };
  }

  // 4. แม่ชี (Nun / Maechi)
  if (
    isMaechiRole ||
    cleanName.startsWith('แม่ชี') ||
    cleanName.startsWith('ชี') ||
    cleanName.startsWith('maechi') ||
    cleanName.startsWith('nun')
  ) {
    return { category: 'MAECHI', label: 'แม่ชี', priority: 4 };
  }

  // 5. คฤหัสถ์ชาย (Lay Male)
  if (
    isLayMaleRole ||
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
    isLayFemaleRole ||
    cleanName.startsWith('นาง') ||
    cleanName.startsWith('นางสาว') ||
    cleanName.startsWith('น.ส.') ||
    cleanName.startsWith('ms.') ||
    cleanName.startsWith('ms ') ||
    cleanName.startsWith('mrs.') ||
    cleanName.startsWith('mrs ') ||
    cleanName.startsWith('miss') ||
    cleanName.startsWith('เด็กหญิง') ||
    cleanName.startsWith('ด.ญ.')
  ) {
    return { category: 'LAY_FEMALE', label: 'คฤหัสถ์หญิง', priority: 6 };
  }

  return { category: 'UNKNOWN', label: 'ทั่วไป', priority: 7 };
}

export interface StatusThemeConfig {
  key: ParticipantStatusCategory;
  label: string;
  shortLabel: string;
  colorName: string;
  dotColor: string;
  // Filled seat styles
  bgClass: string;
  textClass: string;
  borderClass: string;
  hoverClass: string;
  // Designated (unoccupied) seat styles
  designatedBgClass: string;
  designatedTextClass: string;
  designatedBorderClass: string;
  // Badge
  badgeClass: string;
}

export const STATUS_THEMES: Record<ParticipantStatusCategory, StatusThemeConfig> = {
  MONK: {
    key: 'MONK',
    label: 'พระภิกษุ (ไทย/สายหลัก)',
    shortLabel: 'พระภิกษุ',
    colorName: 'สีส้มทอง/มัสตาร์ด',
    dotColor: '#d97706',
    bgClass: 'bg-amber-500',
    textClass: 'text-slate-950 font-black',
    borderClass: 'border-amber-600',
    hoverClass: 'hover:bg-amber-600',
    designatedBgClass: 'bg-amber-50/90',
    designatedTextClass: 'text-amber-800',
    designatedBorderClass: 'border-2 border-amber-400 border-dashed',
    badgeClass: 'bg-amber-500 text-slate-950',
  },
  BHIKKHUNI: {
    key: 'BHIKKHUNI',
    label: 'ภิกษุณี / พระนานาชาติ',
    shortLabel: 'ภิกษุณี/Inter',
    colorName: 'สีกรักน้ำตาลเข้ม',
    dotColor: '#713f12',
    bgClass: 'bg-yellow-900',
    textClass: 'text-amber-100 font-extrabold',
    borderClass: 'border-yellow-950',
    hoverClass: 'hover:bg-yellow-950',
    designatedBgClass: 'bg-amber-900/10',
    designatedTextClass: 'text-amber-900',
    designatedBorderClass: 'border-2 border-amber-800 border-dashed',
    badgeClass: 'bg-yellow-900 text-amber-100',
  },
  SAMANERA: {
    key: 'SAMANERA',
    label: 'สามเณร',
    shortLabel: 'สามเณร',
    colorName: 'สีส้มอิฐ',
    dotColor: '#ea580c',
    bgClass: 'bg-orange-600',
    textClass: 'text-white font-extrabold',
    borderClass: 'border-orange-700',
    hoverClass: 'hover:bg-orange-700',
    designatedBgClass: 'bg-orange-50/90',
    designatedTextClass: 'text-orange-800',
    designatedBorderClass: 'border-2 border-orange-400 border-dashed',
    badgeClass: 'bg-orange-600 text-white',
  },
  MAECHI: {
    key: 'MAECHI',
    label: 'แม่ชี',
    shortLabel: 'แม่ชี',
    colorName: 'สีครีม/ขาวมุก',
    dotColor: '#fef3c7',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-950 font-black',
    borderClass: 'border-amber-400',
    hoverClass: 'hover:bg-amber-200',
    designatedBgClass: 'bg-amber-50/80',
    designatedTextClass: 'text-amber-900',
    designatedBorderClass: 'border-2 border-amber-300 border-dashed',
    badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
  },
  LAY_MALE: {
    key: 'LAY_MALE',
    label: 'ฆราวาสชาย',
    shortLabel: 'ฆราวาสชาย',
    colorName: 'สีฟ้าคราม/สเลทบลู',
    dotColor: '#2563eb',
    bgClass: 'bg-blue-600',
    textClass: 'text-white font-extrabold',
    borderClass: 'border-blue-700',
    hoverClass: 'hover:bg-blue-700',
    designatedBgClass: 'bg-blue-50/90',
    designatedTextClass: 'text-blue-800',
    designatedBorderClass: 'border-2 border-blue-400 border-dashed',
    badgeClass: 'bg-blue-600 text-white',
  },
  LAY_FEMALE: {
    key: 'LAY_FEMALE',
    label: 'ฆราวาสหญิง',
    shortLabel: 'ฆราวาสหญิง',
    colorName: 'สีเขียวเข้ม',
    dotColor: '#047857',
    bgClass: 'bg-emerald-700',
    textClass: 'text-white font-extrabold',
    borderClass: 'border-emerald-800',
    hoverClass: 'hover:bg-emerald-800',
    designatedBgClass: 'bg-emerald-50/90',
    designatedTextClass: 'text-emerald-800',
    designatedBorderClass: 'border-2 border-emerald-400 border-dashed',
    badgeClass: 'bg-emerald-700 text-white',
  },
  UNKNOWN: {
    key: 'UNKNOWN',
    label: 'ทั่วไป / สำรอง',
    shortLabel: 'ทั่วไป',
    colorName: 'สีเทา',
    dotColor: '#64748b',
    bgClass: 'bg-slate-600',
    textClass: 'text-white font-extrabold',
    borderClass: 'border-slate-700',
    hoverClass: 'hover:bg-slate-700',
    designatedBgClass: 'bg-slate-50',
    designatedTextClass: 'text-slate-700',
    designatedBorderClass: 'border-2 border-slate-300 border-dashed',
    badgeClass: 'bg-slate-600 text-white',
  },
};

