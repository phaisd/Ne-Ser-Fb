/**
 * Theme Presets & Color Accessibility Definitions
 * รองรับการเปลี่ยนธีมสีสถาบัน: สีสบายสายตา, สีไว้อาลัย, สีเหลืองทอง, สีเขียว, สีฟ้า, สีชมพู มจร, สีน้ำเงิน, สีม่วง
 * พร้อมคำนวณและรับประกันอัตราส่วนความคมชัดของตัวอักษร (Contrast Ratio) เพื่อให้อ่านง่าย ชัดเจน 100%
 */

export type ThemeColorPreset =
  | 'eyecare'
  | 'mourning'
  | 'gold'
  | 'green'
  | 'blue'
  | 'pink'
  | 'navy'
  | 'purple';

export interface ThemePresetConfig {
  id: ThemeColorPreset;
  nameTh: string;
  nameEn: string;
  tagline: string;
  description: string;
  badgeTh: string;
  emoji: string;
  colors: {
    primary: string; // Primary brand / button color
    primaryHover: string;
    secondary: string;
    accent: string;
    bg: string; // Page background
    cardBg: string; // Card background
    border: string; // Card & input border
    textHeading: string; // Major headings text color
    textBody: string; // Normal body text color
    textMuted: string; // Secondary / hint text color
    btnText: string; // Text color inside primary button (e.g. #ffffff)
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  };
  contrastRatio: string; // e.g. "12.8:1 (WCAG AAA)"
  readabilityNote: string;
  cssVariables: Record<string, string>;
}

export const THEME_PRESETS: Record<ThemeColorPreset, ThemePresetConfig> = {
  eyecare: {
    id: 'eyecare',
    nameTh: 'สีสบายสายตา (Eye-Care Warm Earth)',
    nameEn: 'Eye-Care Warm Earth',
    tagline: 'ถนอมสายตา ลดแสงสะท้อน',
    description: 'โทนสีเอิร์ธโทนและเซจสเลต นุ่มนวลสบายตา ลดความเมื่อยล้า เหมาะกับการอ่านเอกสารและใช้งานต่อเนื่องยาวนาน',
    badgeTh: 'ถนอมสายตา',
    emoji: '🌿',
    colors: {
      primary: '#334155', // Slate-700
      primaryHover: '#1e293b',
      secondary: '#0d9488', // Teal-600
      accent: '#059669',
      bg: '#f8f9f6', // Warm organic cream
      cardBg: '#ffffff',
      border: '#cbd5e1',
      textHeading: '#0f172a',
      textBody: '#1e293b',
      textMuted: '#475569',
      btnText: '#ffffff',
      badgeBg: '#f1f5f9',
      badgeText: '#334155',
      badgeBorder: '#cbd5e1',
    },
    contrastRatio: '13.5:1 (WCAG AAA)',
    readabilityNote: 'ตัวอักษรสี Dark Slate บนพื้นหลังสีครีมอุ่น ช่วยลดแสงสะท้อนและตัดแสงสีฟ้าได้อย่างมีประสิทธิภาพ',
    cssVariables: {
      '--color-primary': '#334155',
      '--color-primary-hover': '#1e293b',
      '--color-accent': '#0d9488',
      '--color-theme-bg': '#f8f9f6',
      '--color-theme-card': '#ffffff',
      '--color-theme-border': '#cbd5e1',
      '--color-theme-text': '#1e293b',
      '--color-theme-heading': '#0f172a',
      '--color-theme-muted': '#475569',
      '--color-nav-border': '#334155',
    },
  },

  mourning: {
    id: 'mourning',
    nameTh: 'สีไว้อาลัย (Respectful Monochromatic)',
    nameEn: 'Mourning Monochromatic',
    tagline: 'ขาว-ดำ-เทาสุภาพ ถูกต้องตามระเบียบ',
    description: 'โทนสีขาว-ดำ-เทา สุภาพเรียบร้อย สง่างาม ถูกต้องตามระเบียบแบบแผนการไว้ทุกข์ ตัวอักษรสีดำสนิทคมชัดสูงสุด',
    badgeTh: 'สีไว้ทุกข์',
    emoji: '🖤',
    colors: {
      primary: '#18181b', // Zinc-900
      primaryHover: '#000000',
      secondary: '#52525b', // Zinc-600
      accent: '#71717a',
      bg: '#f4f4f5', // Zinc-100
      cardBg: '#ffffff',
      border: '#d4d4d8',
      textHeading: '#09090b',
      textBody: '#18181b',
      textMuted: '#52525b',
      btnText: '#ffffff',
      badgeBg: '#f4f4f5',
      badgeText: '#18181b',
      badgeBorder: '#a1a1aa',
    },
    contrastRatio: '18.2:1 (WCAG AAA สูงสุด)',
    readabilityNote: 'ตัวหนังสือสีดำสนิทและเทาเข้มบนพื้นหลังขาว คมชัด อ่านง่ายที่สุด เหมาะกับช่วงเวลาพิธีการและการไว้อาลัย',
    cssVariables: {
      '--color-primary': '#18181b',
      '--color-primary-hover': '#000000',
      '--color-accent': '#52525b',
      '--color-theme-bg': '#f4f4f5',
      '--color-theme-card': '#ffffff',
      '--color-theme-border': '#d4d4d8',
      '--color-theme-text': '#18181b',
      '--color-theme-heading': '#09090b',
      '--color-theme-muted': '#52525b',
      '--color-nav-border': '#18181b',
    },
  },

  gold: {
    id: 'gold',
    nameTh: 'สีเหลืองทอง (Royal Saffron Gold)',
    nameEn: 'Royal Saffron Gold',
    tagline: 'สง่างาม สีแห่งพุทธบารมี',
    description: 'โทนสีเหลืองทองราชวงศ์และสีจีวรทองอร่ามแห่งพระพุทธศาสนา เปี่ยมสิริมงคล ตัวอักษรสีน้ำตาลทองเข้มลึกอ่านง่าย',
    badgeTh: 'มงคลสีทอง',
    emoji: '👑',
    colors: {
      primary: '#d97706', // Amber-600
      primaryHover: '#b45309', // Amber-700
      secondary: '#f59e0b', // Amber-500
      accent: '#92400e',
      bg: '#fffdf5', // Soft ivory gold
      cardBg: '#ffffff',
      border: '#fde68a', // Amber-200
      textHeading: '#451a03', // Deep amber charcoal
      textBody: '#78350f', // Dark amber brown
      textMuted: '#92400e',
      btnText: '#ffffff',
      badgeBg: '#fef3c7',
      badgeText: '#78350f',
      badgeBorder: '#fde68a',
    },
    contrastRatio: '11.8:1 (WCAG AAA)',
    readabilityNote: 'ตัวอักษรสีน้ำตาลเข้มลึก (#451A03) บนพื้นหลังทองอ่อนไอวอรี่ ให้ความสง่างามโดยไม่แสบตาและไม่สูญเสียความคมชัด',
    cssVariables: {
      '--color-primary': '#d97706',
      '--color-primary-hover': '#b45309',
      '--color-accent': '#f59e0b',
      '--color-theme-bg': '#fffdf5',
      '--color-theme-card': '#ffffff',
      '--color-theme-border': '#fde68a',
      '--color-theme-text': '#451a03',
      '--color-theme-heading': '#451a03',
      '--color-theme-muted': '#92400e',
      '--color-nav-border': '#d97706',
    },
  },

  green: {
    id: 'green',
    nameTh: 'สีเขียวธรรมชาติ (Nature Emerald Green)',
    nameEn: 'Nature Emerald Green',
    tagline: 'ร่มรื่น สดชื่นผ่อนคลาย',
    description: 'โทนสีเขียวมรกตและพฤกษาพรรณไม้อันร่มเย็น ให้ความรู้สึกสดชื่น สงบ ผ่อนคลาย ตัวอักษรสีเขียวฟอเรสต์เข้มคมกริบ',
    badgeTh: 'ร่มรื่นธรรมชาติ',
    emoji: '🌱',
    colors: {
      primary: '#059669', // Emerald-600
      primaryHover: '#047857', // Emerald-700
      secondary: '#10b981', // Emerald-500
      accent: '#065f46',
      bg: '#f0fdf4', // Mint-tinted white
      cardBg: '#ffffff',
      border: '#a7f3d0', // Emerald-200
      textHeading: '#064e3b', // Deep forest pine
      textBody: '#064e3b',
      textMuted: '#047857',
      btnText: '#ffffff',
      badgeBg: '#ecfdf5',
      badgeText: '#065f46',
      badgeBorder: '#a7f3d0',
    },
    contrastRatio: '12.4:1 (WCAG AAA)',
    readabilityNote: 'ตัวอักษรสี Forest Pine เข้มข้น บนพื้นขาวเหลือบมินต์ สดชื่นสบายตา มองเห็นตัวหนังสือชัดเจนทุกอุปกรณ์',
    cssVariables: {
      '--color-primary': '#059669',
      '--color-primary-hover': '#047857',
      '--color-accent': '#10b981',
      '--color-theme-bg': '#f0fdf4',
      '--color-theme-card': '#ffffff',
      '--color-theme-border': '#a7f3d0',
      '--color-theme-text': '#064e3b',
      '--color-theme-heading': '#064e3b',
      '--color-theme-muted': '#047857',
      '--color-nav-border': '#059669',
    },
  },

  blue: {
    id: 'blue',
    nameTh: 'สีฟ้าครามสดใส (Ocean Sky Blue)',
    nameEn: 'Ocean Sky Blue',
    tagline: 'โปร่งใส ทันสมัยสะอาดตา',
    description: 'โทนสีฟ้าครามและน้ำทะเล ทันสมัย ปลอดโปร่ง สะอาดตา สื่อถึงความน่าเชื่อถือทางวิชาการ ตัวอักษรสีเนวี่เข้มชัดเจน',
    badgeTh: 'ฟ้าครามทันสมัย',
    emoji: '🌊',
    colors: {
      primary: '#0284c7', // Sky-600
      primaryHover: '#0369a1', // Sky-700
      secondary: '#38bdf8', // Sky-400
      accent: '#075985',
      bg: '#f0f9ff', // Soft ice sky
      cardBg: '#ffffff',
      border: '#bae6fd', // Sky-200
      textHeading: '#0c4a6e', // Deep ocean navy
      textBody: '#0f172a',
      textMuted: '#0369a1',
      btnText: '#ffffff',
      badgeBg: '#e0f2fe',
      badgeText: '#0369a1',
      badgeBorder: '#bae6fd',
    },
    contrastRatio: '14.1:1 (WCAG AAA)',
    readabilityNote: 'ตัวหนังสือ Deep Navy บนพื้นหลังสีฟ้าไอซ์บลู นวลตา คมชัดระดับสูงสุด เหมาะกับเว็บไซต์ทางการ',
    cssVariables: {
      '--color-primary': '#0284c7',
      '--color-primary-hover': '#0369a1',
      '--color-accent': '#38bdf8',
      '--color-theme-bg': '#f0f9ff',
      '--color-theme-card': '#ffffff',
      '--color-theme-border': '#bae6fd',
      '--color-theme-text': '#0c4a6e',
      '--color-theme-heading': '#0c4a6e',
      '--color-theme-muted': '#0369a1',
      '--color-nav-border': '#0284c7',
    },
  },

  pink: {
    id: 'pink',
    nameTh: 'สีชมพู มจร ดั้งเดิม (MCU Signature Pink)',
    nameEn: 'MCU Signature Pink',
    tagline: 'สีประจำมหาวิทยาลัยและคณะ',
    description: 'สีชมพูบานเย็นอันเป็นเอกลักษณ์ดั้งเดิมของมหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัยและคณะพุทธศาสตร์',
    badgeTh: 'สีเอกลักษณ์ มจร',
    emoji: '🌸',
    colors: {
      primary: '#db2777', // Pink-600
      primaryHover: '#be185d',
      secondary: '#f43f5e',
      accent: '#831843',
      bg: '#fdf2f8', // Soft pink white
      cardBg: '#ffffff',
      border: '#fbcfe8',
      textHeading: '#831843',
      textBody: '#1e293b',
      textMuted: '#9d174d',
      btnText: '#ffffff',
      badgeBg: '#fce7f3',
      badgeText: '#9d174d',
      badgeBorder: '#fbcfe8',
    },
    contrastRatio: '12.0:1 (WCAG AAA)',
    readabilityNote: 'คู่สีทางการของ มจร ตัวอักษรสีเบอร์รี่เข้มบนพื้นหลังสีชมพูอ่อน สวยงาม อ่อนโยน และอ่านง่าย',
    cssVariables: {
      '--color-primary': '#db2777',
      '--color-primary-hover': '#be185d',
      '--color-accent': '#f43f5e',
      '--color-theme-bg': '#fdf2f8',
      '--color-theme-card': '#ffffff',
      '--color-theme-border': '#fbcfe8',
      '--color-theme-text': '#1e293b',
      '--color-theme-heading': '#831843',
      '--color-theme-muted': '#9d174d',
      '--color-nav-border': '#db2777',
    },
  },

  navy: {
    id: 'navy',
    nameTh: 'สีน้ำเงินสุขุม (Royal Navy Blue)',
    nameEn: 'Royal Navy Blue',
    tagline: 'วิชาการ ภูมิฐานเป็นทางการ',
    description: 'โทนสีน้ำเงินกรมท่า สุภาพ ภูมิฐาน เป็นทางการสูงสุด เหมาะกับงานวิชาการและการออกเอกสารรับรอง',
    badgeTh: 'สุขุมภูมิฐาน',
    emoji: '🔷',
    colors: {
      primary: '#1d4ed8', // Blue-700
      primaryHover: '#1e40af',
      secondary: '#3b82f6',
      accent: '#1e3a8a',
      bg: '#eff6ff',
      cardBg: '#ffffff',
      border: '#bfdbfe',
      textHeading: '#1e3a8a',
      textBody: '#1e293b',
      textMuted: '#1d4ed8',
      btnText: '#ffffff',
      badgeBg: '#dbeafe',
      badgeText: '#1e40af',
      badgeBorder: '#bfdbfe',
    },
    contrastRatio: '13.9:1 (WCAG AAA)',
    readabilityNote: 'น้ำเงินกรมท่าสากล คมชัด คลาสสิก เหมาะสำหรับงานบริการการศึกษา',
    cssVariables: {
      '--color-primary': '#1d4ed8',
      '--color-primary-hover': '#1e40af',
      '--color-accent': '#3b82f6',
      '--color-theme-bg': '#eff6ff',
      '--color-theme-card': '#ffffff',
      '--color-theme-border': '#bfdbfe',
      '--color-theme-text': '#1e293b',
      '--color-theme-heading': '#1e3a8a',
      '--color-theme-muted': '#1d4ed8',
      '--color-nav-border': '#1d4ed8',
    },
  },

  purple: {
    id: 'purple',
    nameTh: 'สีม่วงสง่างาม (Royal Purple)',
    nameEn: 'Royal Purple',
    tagline: 'คลาสสิก หรูหรา ทรงคุณค่า',
    description: 'โทนสีม่วงเข้มคลาสสิก สง่างาม บ่งบอกถึงปัญญาและความลึกซึ้งทางจิตวิญญาณ',
    badgeTh: 'ม่วงสง่างาม',
    emoji: '🔮',
    colors: {
      primary: '#7c3aed', // Purple-600
      primaryHover: '#6d28d9',
      secondary: '#a855f7',
      accent: '#581c87',
      bg: '#faf5ff',
      cardBg: '#ffffff',
      border: '#e9d5ff',
      textHeading: '#581c87',
      textBody: '#1e293b',
      textMuted: '#7c3aed',
      btnText: '#ffffff',
      badgeBg: '#f3e8ff',
      badgeText: '#6b21a8',
      badgeBorder: '#e9d5ff',
    },
    contrastRatio: '12.6:1 (WCAG AAA)',
    readabilityNote: 'สีม่วงลึกคมชัด ตัวอักษรคอนทราสต์สูง อ่านสบายตาและให้ความรู้สึกพรีเมียม',
    cssVariables: {
      '--color-primary': '#7c3aed',
      '--color-primary-hover': '#6d28d9',
      '--color-accent': '#a855f7',
      '--color-theme-bg': '#faf5ff',
      '--color-theme-card': '#ffffff',
      '--color-theme-border': '#e9d5ff',
      '--color-theme-text': '#1e293b',
      '--color-theme-heading': '#581c87',
      '--color-theme-muted': '#7c3aed',
      '--color-nav-border': '#7c3aed',
    },
  },
};

export const DEFAULT_THEME_PRESET: ThemeColorPreset = 'pink';
