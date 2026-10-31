export type LocaleType = 'th' | 'en';

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const ENGLISH_MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ENGLISH_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

export function toBuddhistYear(date: Date | string | number): number {
  const d = new Date(date);
  return d.getFullYear() + 543;
}

export function formatDateTime(
  date: Date | string | number | null | undefined,
  locale: LocaleType = 'th',
  includeTime: boolean = true
): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const monthIdx = d.getMonth();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const timeStr = includeTime ? ` ${hours}:${minutes} น.` : '';
  const engTimeStr = includeTime ? ` at ${hours}:${minutes}` : '';

  if (locale === 'th') {
    const yearBE = d.getFullYear() + 543;
    const month = THAI_MONTHS_SHORT[monthIdx];
    return `${day} ${month} ${yearBE}${timeStr}`;
  } else {
    const yearAD = d.getFullYear();
    const month = ENGLISH_MONTHS_SHORT[monthIdx];
    return `${day} ${month} ${yearAD}${engTimeStr}`;
  }
}

export function formatDateFull(
  date: Date | string | number | null | undefined,
  locale: LocaleType = 'th'
): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const dayOfWeek = d.getDay();
  const monthIdx = d.getMonth();

  if (locale === 'th') {
    const yearBE = d.getFullYear() + 543;
    const dayName = THAI_DAYS[dayOfWeek];
    const monthName = THAI_MONTHS_FULL[monthIdx];
    return `วัน${dayName}ที่ ${day} ${monthName} พ.ศ. ${yearBE}`;
  } else {
    const yearAD = d.getFullYear();
    const monthName = ENGLISH_MONTHS_FULL[monthIdx];
    return `${day} ${monthName} ${yearAD}`;
  }
}

export function calculateAttendanceRate(presentCount: number, lateCount: number, totalSessions: number): number {
  if (totalSessions <= 0) return 100;
  // Late counts as 0.5 attendance
  const effectivePresent = presentCount + lateCount * 0.5;
  const rate = (effectivePresent / totalSessions) * 100;
  return Math.min(100, Math.max(0, Math.round(rate * 10) / 10));
}

export function isExamEligible(rate: number): boolean {
  return rate >= 80.0;
}
