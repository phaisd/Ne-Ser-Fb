import { SystemSettings, SignatoryItem } from '@/types';
import { DEFAULT_ADMISSION_PORTAL_CONFIG } from '@/lib/admission-config';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';

export const DEFAULT_SIGNATORIES: SignatoryItem[] = [
  {
    id: 'DEAN',
    label: '1. คณบดีคณะพุทธศาสตร์ (พระครูสุธีกิตติบัณฑิต, รศ.ดร.)',
    name: 'พระครูสุธีกิตติบัณฑิต, รศ.ดร.',
    title: 'คณบดีคณะพุทธศาสตร์',
    isDefault: true,
  },
  {
    id: 'VICE_ACADEMIC',
    label: '2. รองคณบดีฝ่ายวิชาการ (ปฏิบัติหน้าที่แทนคณบดี)',
    name: 'พระมหาหรรษา ธมฺมหาโส, ศ.ดร.',
    title: 'รองคณบดีฝ่ายวิชาการ ปฏิบัติหน้าที่แทนคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'VICE_STUDENT',
    label: '3. รองคณบดีฝ่ายกิจการนิสิต (รับรองความประพฤติ/กิจกรรม)',
    name: 'พระมหาบุญเลิศ ช่วยธานี, ศ.ดร.',
    title: 'รองคณบดีฝ่ายกิจการนิสิต คณะพุทธศาสตร์',
  },
  {
    id: 'SECRETARY',
    label: '4. เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์',
    name: '',
    title: 'เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'ACTING_DEAN',
    label: '5. ผู้รักษาราชการแทนคณบดีคณะพุทธศาสตร์',
    name: '',
    title: 'รักษาราชการแทนคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'REGISTRAR',
    label: '6. ผู้อำนวยการส่วนทะเบียนและวัดผล (นายทะเบียน)',
    name: 'พระมหาสุริยัน ปญฺญาวชิโร, ผศ.ดร.',
    title: 'ผู้อำนวยการส่วนทะเบียนและวัดผล',
  },
  {
    id: 'BLANK',
    label: '7. เว้นว่างไว้สำหรับลงนามสดด้วยลายมือปากกา (Handwritten)',
    name: '',
    title: 'คณบดีคณะพุทธศาสตร์',
  },
];

export const DEFAULT_SETTINGS: SystemSettings = {
  universityNameTh: 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
  universityNameEn: 'Mahachulalongkornrajavidyalaya University',
  facultyNameTh: 'คณะพุทธศาสตร์',
  facultyNameEn: 'Faculty of Buddhism',
  officeNameTh: 'สำนักงานคณบดีคณะพุทธศาสตร์',
  logoUrl: 'https://www.mcu.ac.th/images/logo-mcu.png',
  logoEmoji: '☸️',
  signerNameTh: 'พระครูสุธีกิตติบัณฑิต, รศ.ดร.',
  signerTitleTh: 'คณบดีคณะพุทธศาสตร์',
  signerNameEn: 'Assoc. Prof. Dr. Phrakhrusutheekittibandhit',
  signerTitleEn: 'Dean of the Faculty of Buddhism',
  contactPhone: '035-248-000 ต่อ 8323',
  contactEmail: 'buddhism@mcu.ac.th',
  websiteUrl: 'https://fb.mcu.ac.th/',
  systemServiceUrl: 'https://fb-service.mcu.ac.th/',
  addressTh: 'เลขที่ 79 หมู่ 1 ถนนพหลโยธิน ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา 13170',
  addressEn: '79 Moo 1, Phahonyothin Road, Lamsai, Wangnoi, Phra Nakhon Si Ayutthaya 13170, Thailand',
  announcementText: 'ยินดีต้อนรับสู่งานบริการการศึกษาและทะเบียน คณะพุทธศาสตร์ มจร. วังน้อย',
  signatories: DEFAULT_SIGNATORIES,
  visaAlertTitle: 'สำหรับการต่อวีซ่า ให้ดำเนินการก่อนหนังสือเดินทางหมดอายุ 30 วัน',
  visaAlertDesc: '* เพื่อให้มีระยะเวลาเพียงพอต่อการพิจารณาของ ตม. และป้องกันการเสียค่าปรับ',
  visaAlertEnabled: true,
  timelineAlertTitle: 'การดำเนินการ จะเสร็จสิ้น ประมาณ 1-2 วัน ไม่นับวันหยุด หรือ กรุณาตรวจดูเส้นทางการดำเนินการหนังสือว่า "อนุมัติ"',
  timelineAlertDesc: '* สามารถตรวจสอบความคืบหน้าได้ตลอดเวลาที่แท็บ "เช็คสถานะคำร้อง"',
  timelineAlertEnabled: true,
  accuracyAlertTitle: 'กรุณากรอกข้อมูลให้ครบถ้วน มิฉะนั้นเอกสารจะไม่สมบูรณ์และจะยกเลิกการขอหนังสือ',
  accuracyAlertDesc: '* ตรวจสอบตัวสะกดชื่อ-นามสกุลภาษาอังกฤษและเลขพาสปอร์ตให้ตรงกับเล่มจริง',
  accuracyAlertEnabled: true,
  forcePasswordChangeOnFirstLogin: true,
  googleClientId: '383232908495-dk56ffn57og3jscr1es2bjt1vm4h6dfk.apps.googleusercontent.com',
  lineNotifyToken: '',
  lineChannelAccessToken: '',
  lineTargetUserId: '',
  lineWebhookUrl: '',
  heroWildEnabled: true,
  heroLeftWord: 'WI',
  heroRightWord: 'LD',
  heroCapsuleImage: '/images/wild-capsule-island.jpg',
  heroCapsuleAlt: 'Floating Island Nature Capsule - MotionSites AI Wild Pil',
  heroBadgeText: 'Creative Designer & Faculty of Buddhism • MCU',
  heroHeadingTh: 'ระบบบริการนิสิตและวิชาการออนไลน์ คณะพุทธศาสตร์',
  heroDescription:
    'Embark on an inspiring academic journey around the Buddhist wisdom and student services portal. Discover seamless certificate issuance, real-time class timetables, and academic excellence on your unforgettable path.',
  heroDropCapLetter: 'E',
  heroPrimaryBtnText: "Let's Get Wild",
  heroPrimaryBtnUrl: '/certificates',
  heroSecondaryBtnText: 'ตารางเรียนและวิชาการ',
  heroSecondaryBtnUrl: '/courses',
  heroBgStyle: 'wavy-contours',
  themePreset: 'pink',
  themeMourningRibbon: false,
  showPublicDashboardStats: true,
  showVisitorCounter: true,
  visitorCount: 0,
  showEnrollmentMenu: true,
  admissionOpen: true,
  admissionAcademicYear: '2570',
  admissionDefaultInterviewDate: '20 พฤษภาคม 2570 เวลา 09.00 - 12.00 น.',
  admissionDefaultInterviewRoom: 'อาคารสมเด็จพระพุฒาจารย์ (อาคารเรียนรวม) คณะพุทธศาสตร์ มจร วังน้อย',
  admissionCoordinatorName: 'สำนักงานคณบดีคณะพุทธศาสตร์ ฝ่ายทะเบียนและวัดผล',
  admissionCoordinatorPhone: '035-248-000 ต่อ 8323',
  admissionPortalConfig: DEFAULT_ADMISSION_PORTAL_CONFIG,
};

export function convertGoogleDriveUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const matchFile = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile && matchFile[1]) {
    return `https://lh3.googleusercontent.com/d/${matchFile[1]}`;
  }
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) {
    return `https://lh3.googleusercontent.com/d/${matchId[1]}`;
  }
  return trimmed;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  let settings = readLocalJson<SystemSettings | null>('system_settings.json', null);
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('System_Settings!A2:B2');
      if (rows && rows.length > 0 && rows[0][1]) {
        const parsedFromSheet = JSON.parse(String(rows[0][1]));
        if (parsedFromSheet && typeof parsedFromSheet === 'object') {
          settings = { ...(settings || {}), ...parsedFromSheet };
        }
      }
    } catch {
      // System_Settings tab may not exist yet; fall back to local
    }
  }
  if (!settings) {
    writeLocalJson('system_settings.json', DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  const merged: SystemSettings = { ...DEFAULT_SETTINGS, ...settings };
  if (!merged.signatories || !Array.isArray(merged.signatories) || merged.signatories.length === 0) {
    merged.signatories = DEFAULT_SIGNATORIES;
  }
  return merged;
}

export async function updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
  const current = await getSystemSettings();
  if (updates.logoUrl) {
    updates.logoUrl = convertGoogleDriveUrl(updates.logoUrl);
  }
  const updated: SystemSettings = {
    ...current,
    ...updates,
  };
  writeLocalJson('system_settings.json', updated);

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await gClient.ensureSheetsExist(['System_Settings']);
      await gClient.updateValues('System_Settings!A1:B2', [
        ['Key', 'JSON_Value'],
        ['SETTINGS_JSON', JSON.stringify(updated)],
      ]);
    } catch (err) {
      console.warn('Google Sheets updateSystemSettings warning:', err);
    }
  }

  return updated;
}
