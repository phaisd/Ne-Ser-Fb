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
