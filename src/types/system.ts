import { SignatoryItem } from './certificate';

export interface SystemSettings {
  universityNameTh: string;
  universityNameEn: string;
  facultyNameTh: string;
  facultyNameEn: string;
  officeNameTh?: string;
  logoUrl: string;
  logoEmoji?: string;
  signerNameTh: string;
  signerTitleTh: string;
  signerNameEn: string;
  signerTitleEn: string;
  contactPhone: string;
  contactEmail: string;
  websiteUrl?: string;
  systemServiceUrl?: string;
  addressTh: string;
  addressEn: string;
  announcementText: string;
  signatories?: SignatoryItem[];
  visaAlertTitle?: string;
  visaAlertDesc?: string;
  visaAlertEnabled?: boolean;
  timelineAlertTitle?: string;
  timelineAlertDesc?: string;
  timelineAlertEnabled?: boolean;
  accuracyAlertTitle?: string;
  accuracyAlertDesc?: string;
  accuracyAlertEnabled?: boolean;
  forcePasswordChangeOnFirstLogin?: boolean;
  // LINE & Admin Real-Time Notifications
  lineNotifyToken?: string;
  lineChannelAccessToken?: string;
  lineTargetUserId?: string;
  lineWebhookUrl?: string;
  admissionPeriodOpen?: boolean;
  admissionPeriodTitle?: string;
  admissionPeriodDates?: string;
  admissionMode?: 'AUTO_MONTHS' | 'MANUAL';
  admissionStartMonth?: number;
  admissionEndMonth?: number;
  admissionMonths?: number[];
  hideCandidateTabWhenClosed?: boolean;
  footerTitleTh?: string;
  officeHours?: string;
  footerCustomNote?: string;
  devCreditText?: string;
  devCreditEnabled?: boolean;
  // Feature Visibility Toggles for Public Portal (เปิด/ปิดระบบและเมนูหน้าหลัก)
  showEventsMenu?: boolean; // เปิด/ปิด ระบบกิจกรรมนิสิต (/events)
  showStudentsSearch?: boolean; // เปิด/ปิด ระบบค้นหาทะเบียนนิสิต (/students)
  showCoursesMenu?: boolean; // เปิด/ปิด ระบบตารางเรียนและรายวิชา (/courses)
  showCertificatesMenu?: boolean; // เปิด/ปิด ระบบขอหนังสือรับรอง (/certificates)
  showStaffCertificatesInPortal?: boolean; // เปิด/ปิด แถบหนังสือรับรองสำหรับอาจารย์และเจ้าหน้าที่ในหน้าขอหนังสือรับรองสาธารณะ

  // Timetable Period Time Configuration (กำหนดเวลาคาบเรียนในตารางสอน)
  morningPeriodLabel?: string; // เช่น "คาบเช้า (09:00 - 11:30 น.)"
  morningPeriodSub?: string; // เช่น "ภาคการศึกษาปกติ"
  lunchPeriodLabel?: string; // เช่น "พักฉัน / พักกลางวัน"
  lunchPeriodTime?: string; // เช่น "11:30 - 13:00"
  afternoonPeriodLabel?: string; // เช่น "คาบบ่าย (13:00 - 15:30 น.)"
  afternoonPeriodSub?: string; // เช่น "ภาคการศึกษาปกติ"
  eveningPeriodLabel?: string; // เช่น "คาบเย็น / ปฏิบัติการ (16:00 - 18:30 น.)"
  eveningPeriodSub?: string; // เช่น "วิชาสัมมนา / กัมมัฏฐาน"

  // Timetable Display Days & Degree-Specific Notes (กำหนดวันแสดงผลและหมายเหตุท้ายตารางตามระดับปริญญา)
  timetableDaysBachelor?: number[]; // ค่าเริ่มต้น: [1, 2, 3, 4] (จันทร์-พฤหัสบดี)
  timetableDaysMaster?: number[]; // ค่าเริ่มต้น: [6, 7] (เสาร์-อาทิตย์)
  timetableDaysDoctoral?: number[]; // ค่าเริ่มต้น: [6, 7] (เสาร์-อาทิตย์)
  timetableDaysCertificate?: number[]; // ค่าเริ่มต้น: [6, 7] (เสาร์-อาทิตย์)

  timetableNotesBachelor?: string; // หมายเหตุท้ายตาราง ป.ตรี
  timetableNotesMaster?: string; // หมายเหตุท้ายตาราง ป.โท
  timetableNotesDoctoral?: string; // หมายเหตุท้ายตาราง ป.เอก
  timetableNotesCertificate?: string; // หมายเหตุท้ายตาราง ประกาศนียบัตร

  // Hero Section "Wild" Creative Theme Settings (ธีมแอนิเมชันเกาะลอยน้ำ MotionSites AI)
  heroWildEnabled?: boolean; // เปิด/ปิด ธีมแอนิเมชัน MotionSites Wild Hero
  heroLeftWord?: string; // ข้อความฝั่งซ้าย เช่น "BUD" หรือ "พุทธ"
  heroRightWord?: string; // ข้อความฝั่งขวา เช่น "DHISM" หรือ "ศาสตร์"
  heroCapsuleImage?: string; // ที่อยู่รูปภาพในแคปซูล เช่น "/images/wild-capsule-island.jpg"
  heroCapsuleAlt?: string; // คำอธิบายรูปภาพ
  heroBadgeText?: string; // ข้อความ Badge ป้ายกำกับบนสุด เช่น "Faculty of Buddhism • MCU"
  heroHeadingTh?: string; // หัวข้อหลักภาษาไทย เช่น "ระบบบริการนิสิตและวิชาการออนไลน์ คณะพุทธศาสตร์"
  heroSubHeadingEn?: string; // ข้อความบรรทัดรองภาษาอังกฤษ เช่น "Mahachulalongkornrajavidyalaya University • Academic Year 2569–2570"
  heroDescription?: string; // คำอธิบายย่อยเพิ่มเติม
  heroDropCapLetter?: string; // ตัวอักษรขึ้นต้น Drop-cap ตัวใหญ่ เช่น "E" หรือ "ศ"
  heroPrimaryBtnText?: string; // ข้อความปุ่มหลัก เช่น "ยื่นคำร้องขอหนังสือรับรอง"
  heroPrimaryBtnUrl?: string; // ลิงก์ปุ่มหลัก เช่น "/certificates"
  heroSecondaryBtnText?: string; // ข้อความปุ่มรอง เช่น "ตารางเรียนและวิชาการ"
  heroSecondaryBtnUrl?: string; // ลิงก์ปุ่มรอง เช่น "/courses"
  heroBgStyle?: 'wavy-contours' | 'gradient' | 'minimal' | 'gold-glow' | 'navy'; // สไตล์พื้นหลัง Hero
  heroShowTopNav?: boolean; // แสดงแถบนำทางด้านบนภายในกรอบ Hero (ค่าเริ่มต้น: true)
  heroShowBadge?: boolean; // แสดงป้ายกำกับ Badge ด้านบนตัวอักษรใหญ่ (ค่าเริ่มต้น: true)
  heroShowActionButtons?: boolean; // แสดงปุ่มทางลัดด้านล่างข้อความใน Hero (ค่าเริ่มต้น: false)

  // Theme & Color Accessibility Settings (การตั้งค่าโทนสีธีมและการอ่านง่าย)
  themePreset?: 'eyecare' | 'mourning' | 'gold' | 'green' | 'blue' | 'pink' | 'navy' | 'purple';
  themeMourningRibbon?: boolean; // แสดงโบว์ไว้อาลัยสีดำมุมจอเมื่อเปิดธีมไว้อาลัย

  // Font Size & Typography Accessibility Settings (การปรับขนาดตัวอักษรและฟอนต์ทั้งระบบ)
  fontSizeScale?: 'normal' | 'medium' | 'large' | 'xlarge' | 'custom';
  fontCustomPercent?: number; // เช่น 100 - 135 (%)
  fontFamilyPreset?: 'sarabun' | 'krub' | 'baijamjuree';
  fontWeightBoost?: boolean; // เพิ่มความเข้มตัวอักษรขนาดเล็กให้อ่านชัดขึ้น

  // Role-Based Access Control (RBAC) Permission Matrix & Custom Role Columns
  rolePermissions?: any[];
  roleColumns?: any[];

  // Google Identity Services OAuth Client ID (optional runtime override)
  googleClientId?: string;
}

export interface SheetStatus {
  sheetName: string;
  title: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  rowCount: number;
  lastSyncedAt?: string;
  error?: string;
}
