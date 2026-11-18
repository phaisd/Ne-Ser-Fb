import type { SystemSettings } from '@/types';

/**
 * Shared Formatting Utilities (Thai/English Dates, PDPA Masking, Numbers)
 */

/**
 * Formats an ISO date or Date object into a localized Thai Buddhist calendar string (พ.ศ.)
 */
export function formatThaiDate(
  dateInput?: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString(
      'th-TH',
      options || {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  } catch {
    return '-';
  }
}

/**
 * Formats an ISO date or Date object into standard English format
 */
export function formatEnglishDate(
  dateInput?: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString(
      'en-US',
      options || {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  } catch {
    return '-';
  }
}

/**
 * PDPA Masking for Passport / National ID: displays e.g. AB••••12
 */
export function maskPassport(passport?: string | null, unmask: boolean = false): string {
  if (!passport) return '-';
  if (unmask) return passport;
  const clean = passport.trim();
  if (clean.length <= 4) return '••••';
  return `${clean.slice(0, 2)}••••${clean.slice(-2)}`;
}

/**
 * PDPA Masking for Thai 13-digit National Citizen ID: displays e.g. 1-3499-•••••-12-3
 */
export function maskCitizenId(citizenId?: string | null, unmask: boolean = false): string {
  if (!citizenId) return '-';
  if (unmask) return citizenId;
  const clean = citizenId.replace(/\D/g, '');
  if (clean.length === 13) {
    return `${clean[0]}-${clean.slice(1, 5)}-•••••-${clean.slice(10, 12)}-${clean[12]}`;
  }
  if (clean.length > 6) {
    return `${clean.slice(0, 3)}•••••${clean.slice(-2)}`;
  }
  return '••••••••';
}

/**
 * PDPA Masking for Email address: displays e.g. p•••••d@mcu.ac.th
 */
export function maskEmail(email?: string | null, unmask: boolean = false): string {
  if (!email) return '-';
  if (unmask) return email;
  const parts = email.trim().split('@');
  if (parts.length !== 2) return '••••@••••';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}•@${domain}`;
  }
  return `${name[0]}${'•'.repeat(Math.min(name.length - 2, 5))}${name[name.length - 1]}@${domain}`;
}

/**
 * Formats a 10-digit phone number to 0XX-XXX-XXXX
 */
export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return '-';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  if (clean.length === 9) {
    return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
  }
  return phone;
}

/**
 * Extracts the running sequence integer from any certificate document number string.
 * Supports prefixes like:
 * - "8002/ 10", "8002.1/ 11"
 * - "อว 8002/ 10", "อว 8002.1/ 11"
 * - "8002.1/010", "8002/010"
 * - "010/2569", "10/2569", "50", "051"
 */
export function extractDocSeqNumber(docNo?: string | null): number | null {
  if (!docNo) return null;
  const raw = String(docNo).trim();
  if (!raw) return null;

  // 1. Strip out prefixes like 'ที่', 'อว', '8002', '8002.1', 'MCU No.', and slashes/dots
  let cleaned = raw
    .replace(/^(ที่\s*)?(อว\s*)?(MCU\s*No\.?\s*)?(8002\.1|8002)\s*[\/.]?\s*/i, '')
    .trim();

  // 2. If it contains a slash (e.g. '010/2569' or '10/2569'), extract the sequence before slash
  if (cleaned.includes('/')) {
    cleaned = cleaned.split('/')[0].trim();
  }

  // 3. Match leading sequence digits
  const match = cleaned.match(/^(\d+)/);
  if (!match) return null;

  const num = parseInt(match[1], 10);
  if (isNaN(num)) return null;

  // Safety filter: ignore Buddhist calendar years if accidentally isolated (e.g. 2560 - 2600)
  if (num >= 2560 && num <= 2600) return null;
  if (num <= 0 || num >= 100000) return null;

  return num;
}

/**
 * Calculates the next continuous certificate sequence number across both 8002 and 8002.1.
 */
export function calculateNextDocNo(
  requests: Array<{ docNo?: string | null; status?: string; createdAt?: string }>,
  targetYear?: number
): { docNoWithYear: string; seqOnly: string; nextNum: number } {
  const currentYear = targetYear || new Date().getFullYear() + 543;
  let maxSeq = 0;

  for (const r of requests) {
    const seq = extractDocSeqNumber(r.docNo);
    if (seq !== null && seq > maxSeq) {
      maxSeq = seq;
    }
  }

  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const nextNum = maxSeq > 0 ? maxSeq + 1 : approvedCount + 1;
  const seqStr = String(nextNum).padStart(3, '0');

  return {
    docNoWithYear: `${seqStr}/${currentYear}`,
    seqOnly: seqStr,
    nextNum,
  };
}

export const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export const THAI_MONTH_SHORT_NAMES = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

/**
 * Checks if the Candidate Admission Period is currently open based on system settings.
 */
export function isAdmissionPeriodActive(settings?: Partial<SystemSettings> | null): {
  isOpen: boolean;
  reason?: string;
  periodText?: string;
} {
  if (!settings) return { isOpen: true };

  // 1. Explicit master toggle OFF
  if (settings.admissionPeriodOpen === false) {
    return {
      isOpen: false,
      reason: 'ระบบปิดรับคำร้องสำหรับผู้ผ่านการคัดเลือกใหม่ชั่วคราว',
      periodText: settings.admissionPeriodDates || 'ปิดรับคำร้องชั่วคราว',
    };
  }

  // 2. Month-based automatic schedule
  if (settings.admissionStartMonth && settings.admissionEndMonth) {
    const startM = Number(settings.admissionStartMonth);
    const endM = Number(settings.admissionEndMonth);
    const currentMonth = new Date().getMonth() + 1; // 1-12

    let inRange = false;
    if (startM <= endM) {
      inRange = currentMonth >= startM && currentMonth <= endM;
    } else {
      inRange = currentMonth >= startM || currentMonth <= endM;
    }

    const startName = THAI_MONTH_NAMES[startM - 1] || '';
    const endName = THAI_MONTH_NAMES[endM - 1] || '';
    const periodDisplay = settings.admissionPeriodDates || `ช่วงเดือน ${startName} - ${endName}`;

    if (!inRange) {
      return {
        isOpen: false,
        reason: `เปิดรับเฉพาะช่วงเดือน ${startName} ถึง ${endName}`,
        periodText: periodDisplay,
      };
    }

    return {
      isOpen: true,
      periodText: periodDisplay,
    };
  }

  return {
    isOpen: true,
    periodText: settings.admissionPeriodDates || '',
  };
}

/**
 * Converts a Gregorian Date, string, or number to Buddhist Era Year (พ.ศ.)
 * If already in Buddhist Era (>= 2400), returns it directly.
 */
export function toBuddhistYear(dateInput?: Date | string | number | null): number {
  if (dateInput === null || dateInput === undefined) {
    return new Date().getFullYear() + 543;
  }
  if (typeof dateInput === 'number') {
    return dateInput >= 2400 ? dateInput : dateInput + 543;
  }
  if (typeof dateInput === 'string') {
    const num = parseInt(dateInput.trim(), 10);
    if (!isNaN(num) && num >= 2400 && String(num) === dateInput.trim()) {
      return num;
    }
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      return d.getFullYear() + 543;
    }
    return !isNaN(num) ? (num >= 2400 ? num : num + 543) : new Date().getFullYear() + 543;
  }
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return dateInput.getFullYear() + 543;
  }
  return new Date().getFullYear() + 543;
}

/**
 * Formats a date into localized Thai Buddhist date string with specified format
 */
export function formatBuddhistDate(
  dateInput?: Date | string | null,
  formatType: 'full' | 'short' | 'month-year' = 'full'
): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const month = d.getMonth(); // 0-11
  const bYear = d.getFullYear() + 543;

  if (formatType === 'short') {
    return `${day} ${THAI_MONTH_SHORT_NAMES[month]} ${bYear}`;
  }
  if (formatType === 'month-year') {
    return `${THAI_MONTH_NAMES[month]} ${bYear}`;
  }
  return `${day} ${THAI_MONTH_NAMES[month]} พ.ศ. ${bYear}`;
}

const THAI_DIGIT_MAP: Record<string, string> = {
  '0': '๐', '1': '๑', '2': '๒', '3': '๓', '4': '๔',
  '5': '๕', '6': '๖', '7': '๗', '8': '๘', '9': '๙',
};

const ARABIC_DIGIT_MAP: Record<string, string> = {
  '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
  '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',
};

/**
 * Converts Western Arabic digits (0-9) to Thai numerals (๐-๙)
 */
export function formatNumberThaiDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (ch) => THAI_DIGIT_MAP[ch] || ch);
}

/**
 * Converts Thai numerals (๐-๙) to Western Arabic digits (0-9)
 */
export function formatThaiDigitsToNumber(input: string): string {
  return String(input).replace(/[๐-๙]/g, (ch) => ARABIC_DIGIT_MAP[ch] || ch);
}
