export type BadgeLayoutMode =
  | 'NINE_3X3_PER_PAGE'
  | 'TWELVE_4X3_PER_PAGE'
  | 'TWELVE_3X4_PER_PAGE'
  | 'EIGHT_PER_PAGE'
  | 'SIX_PER_PAGE'
  | 'FOUR_PER_PAGE'
  | 'TEN_PER_PAGE';

export type BadgeOrientation = 'VERTICAL' | 'HORIZONTAL';
export type BadgeColorTheme = 'GOLD' | 'PURPLE' | 'NAVY' | 'CRIMSON' | 'CLASSIC_BLACK';
export type BadgeFontSize = 'SMALL' | 'MEDIUM' | 'LARGE';
export type QrScaleMode = '1X' | '1.5X' | '2X' | '2.5X';

export interface BadgeThemeStyles {
  headerOrg: string;
  headerUniv: string;
  headerProject: string;
  headerBorder: string;
  groupPill: string;
  degreeText: string;
  majorText: string;
  participantCode: string;
  participantName: string;
  qrBorder: string;
  footerBorder: string;
  footerLabel: string;
  footerIndex: string;
}

export interface BadgeFontScale {
  headerOrg: string;
  headerUniv: string;
  headerProject: string;
  groupPill: string;
  degree: string;
  major: string;
  code: string;
  name: string;
  footer: string;
}

export interface BadgeNoQrCustomSettings {
  degreeScale: number; // e.g. 1.0, 1.5, 2.0, 2.5
  majorScale: number;  // e.g. 1.0, 1.5, 2.0, 2.5
  groupScale: number;  // e.g. 1.0, 1.5, 2.0, 2.5
  codeScale: number;   // e.g. 1.5, 2.0, 2.5, 3.0
  nameScale: number;   // e.g. 0.8, 1.0, 1.25, 1.5
  lineGap: number;     // px spacing between lines (2, 4, 6, 8, 10, 14)
}

export const DEFAULT_NO_QR_SETTINGS: BadgeNoQrCustomSettings = {
  degreeScale: 2.0,
  majorScale: 2.0,
  groupScale: 2.0,
  codeScale: 2.5,
  nameScale: 1.0,
  lineGap: 6,
};

/**
 * Detect if practitioner is in an English or International program/group.
 */
export function isPractitionerEnglish(reg: {
  groupNumber?: number;
  groupName?: string;
  programType?: string;
  groupSpecificCode?: string;
  studentCode?: string;
  major?: string;
  studentName?: string;
}): boolean {
  const gNum = reg.groupNumber || (reg.groupName ? parseInt(reg.groupName.replace(/\D/g, ''), 10) : undefined);
  if (gNum === 12) return false;

  const pt = String(reg.programType || '').toUpperCase();
  if (pt === 'ENGLISH' || pt === 'INTER' || pt.includes('ENG') || pt.includes('INTER')) return true;

  if (reg.groupSpecificCode && (/^[A-Z]?\d*E/i.test(reg.groupSpecificCode) || /^I/i.test(reg.groupSpecificCode))) {
    return true;
  }

  const gName = String(reg.groupName || '').toLowerCase();
  if (gName.includes('english') || gName.includes('inter') || gName.includes('อังกฤษ')) {
    return true;
  }

  const m = String(reg.major || '').toLowerCase();
  if (m.includes('buddhist studies') || m.includes('international') || m.includes('english') || m.includes('inter')) {
    return true;
  }

  const name = String(reg.studentName || '').trim();
  if (name && !/[\u0E00-\u0E7F]/.test(name) && /[a-zA-Z]/.test(name)) {
    if (gNum && gNum >= 4 && gNum <= 11) return true;
  }

  return false;
}

/**
 * Format group label (e.g. Group 4 vs กลุ่ม 4)
 */
export function formatBadgeGroupLabel(gNum: number | string | undefined, isEnglish: boolean): string {
  const numStr = gNum ? String(gNum) : '-';
  return isEnglish ? `Group ${numStr}` : `กลุ่ม ${numStr}`;
}

/**
 * Format degree level (e.g. Bachelor of Arts vs ปริญญาตรี)
 */
export function formatBadgeDegree(degree: string | undefined, isEnglish: boolean): string {
  if (!isEnglish) {
    return degree || 'ปริญญาตรี';
  }
  const d = String(degree || '').toLowerCase();
  if (d.includes('โท') || d.includes('master')) {
    return 'Master of Arts';
  }
  if (d.includes('เอก') || d.includes('doctor') || d.includes('ph.d')) {
    return 'Doctor of Philosophy';
  }
  return 'Bachelor of Arts';
}

/**
 * Format footer location text (e.g. Meditation Venue vs สถานที่ปฏิบัติ)
 */
export function formatBadgeFooterLocation(locationText: string | undefined, isEnglish: boolean): string {
  const text = (locationText || '').trim();
  if (!isEnglish) {
    return text || 'สถานที่ปฏิบัติ';
  }
  if (!text || text === 'สถานที่ปฏิบัติ') {
    return 'Meditation Venue';
  }
  if (text === 'ศาลาปฏิบัติธรรม') return 'Meditation Hall';
  if (text.includes('หอประชุม')) return 'Main Assembly Hall';
  if (text.includes('ห้อง 1') || text.includes('ห้อง1')) return 'Meditation Hall 1';
  if (text.includes('ห้อง 2') || text.includes('ห้อง2')) return 'Meditation Hall 2';
  return text;
}

