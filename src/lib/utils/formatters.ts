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
export function isAdmissionPeriodActive(settings?: any): {
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
