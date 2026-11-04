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
