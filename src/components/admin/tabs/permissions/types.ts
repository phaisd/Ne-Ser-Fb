import { UserAccount } from '@/types';

export type SystemRoleKey =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'OFFICER'
  | 'ACTING_OFFICER'
  | 'INSTRUCTOR'
  | 'STUDENT'
  | string;

export interface RoleColumnConfig {
  key: SystemRoleKey;
  title: string;
  shortHeader: string;
  badge: string;
  desc: string;
  colorTheme: 'purple' | 'indigo' | 'sky' | 'teal' | 'emerald' | 'amber' | 'rose' | 'blue';
  isCustom?: boolean;
}

export interface PermissionItem {
  id: string;
  moduleName: string;
  description: string;
  routeHint: string;
  roles: Record<string, boolean>;
  lockedRoles?: string[]; // Roles that cannot be toggled off (e.g. SUPER_ADMIN)
  isCustom?: boolean;
}

export const DEFAULT_ROLE_COLUMNS: RoleColumnConfig[] = [
  {
    key: 'SUPER_ADMIN',
    title: 'ผู้ดูแลระบบสูงสุด',
    shortHeader: '👑 Super Admin',
    badge: 'SUPER_ADMIN',
    desc: 'สิทธิ์สูงสุดในการควบคุมระบบทั้งหมด ตั้งค่าตราตั้ง โลโก้ ซิงค์ Google Sheets และแต่งตั้ง Admin',
    colorTheme: 'purple',
  },
  {
    key: 'ADMIN',
    title: 'ผู้ดูแลระบบคณะ',
    shortHeader: '🛡️ Admin',
    badge: 'ADMIN',
    desc: 'บริหารจัดการคำร้อง ทะเบียนนิสิต ทะเบียนรายวิชา ตารางสอน เวลาเรียน และจัดการผู้ใช้',
    colorTheme: 'indigo',
  },
  {
    key: 'OFFICER',
    title: 'เจ้าหน้าที่หลักสูตร (OFFICER)',
    shortHeader: '📋 เจ้าหน้าที่หลักสูตร',
    badge: 'OFFICER',
    desc: 'ตรวจสอบคำร้อง แก้ไข/เลื่อนชั้นปีนิสิต จัดการรายวิชา/ตารางสอน และออกบัตรภาระงานอาจารย์',
    colorTheme: 'sky',
  },
  {
    key: 'ACTING_OFFICER',
    title: 'ผู้ช่วยเจ้าหน้าที่ (ผู้ช่วยงาน)',
    shortHeader: '🎓 ผู้ช่วยเจ้าหน้าที่ (ผู้ช่วยงาน)',
    badge: 'ACTING_OFFICER',
    desc: 'อาจารย์หรือนิสิตที่ได้รับมอบหมาย (☑️ ช่วยงานเจ้าหน้าที่) ช่วยตรวจคำร้อง จัดตารางสอน และเช็คชื่อกิจกรรม โดยจำกัดสิทธิ์บางเรื่องที่สำคัญ',
    colorTheme: 'teal',
  },
  {
    key: 'STAFF',
    title: 'เจ้าหน้าที่สายสนับสนุน (STAFF)',
    shortHeader: '💼 สายสนับสนุน (STAFF)',
    badge: 'STAFF',
    desc: 'บุคลากรสายสนับสนุนวิชาการ หรือเจ้าหน้าที่ธุรการคณะ ช่วยงานประสานงานทั่วไป',
    colorTheme: 'blue',
  },
  {
    key: 'INSTRUCTOR',
    title: 'อาจารย์ผู้สอน',
    shortHeader: '👨‍🏫 อาจารย์ผู้สอน',
    badge: 'INSTRUCTOR',
    desc: 'เช็คชื่อเวลาเรียน สรุปสิทธิ์สอบ กรอกคะแนนวัดผล (Grade Sheet) ในรายวิชาที่รับผิดชอบสอน',
    colorTheme: 'emerald',
  },
  {
    key: 'VIPASSANA_MASTER',
    title: 'พระวิปัสสนาจารย์ / อาจารย์สอบอารมณ์',
    shortHeader: '🧘 พระวิปัสสนาจารย์',
    badge: 'VIPASSANA_MASTER',
    desc: 'บันทึกการสอบอารมณ์สติปัฏฐาน 4 (กาย เวทนา จิต ธรรม) ให้คำแนะนำสภาวะธรรม และประเมินผลการปฏิบัติวิปัสสนา',
    colorTheme: 'rose',
  },
  {
    key: 'STUDENT',
    title: 'นิสิต (ไทย / นานาชาติ)',
    shortHeader: '🎓 นิสิต (Student)',
    badge: 'STUDENT',
    desc: 'ยื่นคำร้องขอหนังสือรับรองออนไลน์ ตรวจสอบสถานะ ดูตารางเรียน และลงทะเบียนกิจกรรมนิสิต',
    colorTheme: 'amber',
  },
];

export const DEFAULT_PERMISSIONS_MATRIX: PermissionItem[] = [
  {
    id: 'cert_request_track',
    moduleName: '1. ยื่นคำร้องและติดตามสถานะหนังสือรับรอง',
    description: 'เข้าใช้งานหน้ายื่นคำร้องออนไลน์ ตรวจสอบสถานะ และดาวน์โหลดหนังสือรับรองที่อนุมัติแล้ว',
    routeHint: '/certificates',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: true,
      INSTRUCTOR: true,
      VIPASSANA_MASTER: false,
      STUDENT: true,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'cert_approve_manage',
    moduleName: '2. ตรวจสอบคำร้อง ออกเลขที่หนังสือ และพิมพ์ใบรับรอง',
    description: 'ตรวจสอบเอกสารแนบ อนุมัติ/ตีกลับคำร้อง กำหนดผู้ลงนาม และดูแท็บรายการคำร้องทั้งหมด',
    routeHint: '/admin & /certificates',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: true,
      INSTRUCTOR: false,
      VIPASSANA_MASTER: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'students_view_edit',
    moduleName: '3. ค้นหาและแก้ไขข้อมูลทะเบียนนิสิตทั่วไป (PDPA)',
    description: 'ค้นหารายชื่อนิสิต ตรวจสอบสถานภาพ วันหมดอายุพาสปอร์ต/วีซ่า และแก้ไขข้อมูลพื้นฐานของนิสิต',
    routeHint: '/students & /admin',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: true,
      INSTRUCTOR: false,
      VIPASSANA_MASTER: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'students_promote_archive',
    moduleName: '4. เลื่อนชั้นปีการศึกษา / ย้ายจำหน่ายนิสิตเข้าแฟ้มประวัติ (Students_Archive)',
    description: 'เลื่อนชั้นปีนิสิตแบบยกชุด ย้ายนิสิตจบการศึกษา/พ้นสภาพ/ลาออก เข้าแฟ้มประวัติ และกู้คืนข้อมูล',
    routeHint: '/admin (ทะเบียนนิสิต)',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: false,
      INSTRUCTOR: false,
      VIPASSANA_MASTER: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'courses_view',
    moduleName: '5. เปิดดูทะเบียนรายวิชาและตารางเรียนรวม',
    description: 'ค้นหารายวิชา ดูตารางเรียนแยกตามชั้นปี/สาขาวิชา และสั่งพิมพ์ตารางเรียน',
    routeHint: '/courses',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: true,
      INSTRUCTOR: true,
      VIPASSANA_MASTER: false,
      STUDENT: true,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'courses_manage',
    moduleName: '6. เพิ่ม/แก้ไข/ลบรายวิชา นำเข้า CSV และจัดตารางสอนหลักสูตร',
    description: 'แสดงปุ่มเพิ่มวิชา แก้ไขผู้สอน ลบ นำเข้า/ส่งออก CSV และคัดลอกรายวิชาข้ามปีการศึกษา',
    routeHint: '/courses & /api/courses',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: true,
      INSTRUCTOR: false,
      VIPASSANA_MASTER: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'attendance_grades_own',
    moduleName: '7. เช็คชื่อนิสิต สรุปสิทธิ์สอบ และกรอกคะแนนวัดผล (วิชาที่สอน)',
    description: 'บันทึกเวลาเรียนรายคาบ ตรวจสอบสิทธิ์สอบ 80% และออกใบกรอกคะแนนวัดผล (Grade Sheet) ประจำวิชา',
    routeHint: '/attendance',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: true,
      INSTRUCTOR: true,
      VIPASSANA_MASTER: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'attendance_grades_all',
    moduleName: '8. จัดการเวลาเรียนและใบกรอกคะแนนวัดผลทุกรายวิชาทั้งคณะ',
    description: 'ดูประวัติการเช็คชื่อทุกรายวิชา ล้างข้อมูลตัวอย่าง และตรวจใบกรอกคะแนนของอาจารย์ทุกท่าน',
    routeHint: '/admin (บันทึกเวลาเรียน)',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: false,
      INSTRUCTOR: false,
      VIPASSANA_MASTER: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'events_checkin',
    moduleName: '9. จัดการโครงการและเช็คชื่อเข้าร่วมกิจกรรมนิสิตทั่วไป',
    description: 'สร้างโครงการกิจกรรม และกดเช็คชื่อนิสิตเข้าร่วมกิจกรรมหน้างาน',
    routeHint: '/events & /admin',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: true,
      INSTRUCTOR: true,
      VIPASSANA_MASTER: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'vipassana_events_view',
    moduleName: '10. เข้าถึงโครงการปฏิบัติวิปัสสนากัมมัฏฐาน & ดูรายชื่อกลุ่มนิสิตที่ดูแล',
    description: 'ดูการ์ดโครงการปฏิบัติวิปัสสนา รายชื่อนิสิตในกลุ่ม และสถานะการปฏิบัติรายบุคคล',
    routeHint: '/events & /admin (โครงการวิปัสสนา)',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: true,
      INSTRUCTOR: true,
      VIPASSANA_MASTER: true,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN', 'VIPASSANA_MASTER'],
  },
  {
    id: 'vipassana_interview_eval',
    moduleName: '11. ระบบแบบสอบอารมณ์สติปัฏฐาน 4 (กาย เวทนา จิต ธรรม) และประเมินผล',
    description: 'บันทึกการสอบอารมณ์สติปัฏฐาน 4 รายบุคคล/รายกลุ่ม ให้โอวาทสภาวะธรรม และประเมินผลผ่าน/ไม่ผ่าน',
    routeHint: '/events & /admin (สอบอารมณ์วิปัสสนา)',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: false,
      ACTING_OFFICER: false,
      INSTRUCTOR: false,
      VIPASSANA_MASTER: true,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN', 'VIPASSANA_MASTER'],
  },
  {
    id: 'vipassana_report_print',
    moduleName: '12. พิมพ์และส่งออกรายงานใบบันทึกผลการสอบอารมณ์สติปัฏฐาน 4',
    description: 'พิมพ์ใบบันทึกผลการสอบอารมณ์รายบุคคล หรือส่งออกข้อมูลสรุปการปฏิบัติธรรมประจำโครงการ',
    routeHint: '/events (พิมพ์ผลสอบอารมณ์)',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: true,
      INSTRUCTOR: false,
      VIPASSANA_MASTER: true,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN', 'VIPASSANA_MASTER'],
  },
  {
    id: 'users_instructors_manage',
    moduleName: '13. จัดการไอดีอาจารย์ รีเซ็ตรหัสผ่าน และกำหนดสิทธิ์ผู้ใช้งาน',
    description: 'สร้าง/แก้ไขบัญชีอาจารย์ รีเซ็ตรหัสผ่าน แต่งตั้งผู้ช่วยเจ้าหน้าที่ และพิมพ์บัตรแจ้งภาระงานสอน',
    routeHint: '/admin (จัดการผู้ใช้)',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: false,
      INSTRUCTOR: false,
      VIPASSANA_MASTER: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'system_branding_sheets',
    moduleName: '14. ตั้งค่าตราตั้ง โลโก้ ผู้ลงนาม และเชื่อมต่อ Google Sheets หลัก',
    description: 'ปรับแต่งโลโก้คณะ รายชื่อผู้ลงนาม นโยบายความปลอดภัย และซิงค์ฐานข้อมูล Google Sheets',
    routeHint: '/admin (ตั้งค่าตราตั้ง & Google Sheets)',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: false,
      ACTING_OFFICER: false,
      INSTRUCTOR: false,
      VIPASSANA_MASTER: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
];

export const THEME_STYLES: Record<
  RoleColumnConfig['colorTheme'],
  { cardGrad: string; activeBorder: string; thBg: string }
> = {
  purple: {
    cardGrad: 'from-purple-600 to-indigo-700 text-white',
    activeBorder: 'ring-2 ring-purple-600 border-purple-600 bg-purple-50/40',
    thBg: 'bg-purple-50/70 text-purple-900',
  },
  indigo: {
    cardGrad: 'from-indigo-600 to-blue-700 text-white',
    activeBorder: 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/40',
    thBg: 'bg-indigo-50/70 text-indigo-900',
  },
  sky: {
    cardGrad: 'from-sky-600 to-cyan-600 text-white',
    activeBorder: 'ring-2 ring-sky-600 border-sky-600 bg-sky-50/40',
    thBg: 'bg-sky-50/70 text-sky-900',
  },
  teal: {
    cardGrad: 'from-teal-600 to-emerald-600 text-white',
    activeBorder: 'ring-2 ring-teal-600 border-teal-600 bg-teal-50/40',
    thBg: 'bg-teal-50/80 text-teal-900',
  },
  emerald: {
    cardGrad: 'from-emerald-600 to-green-600 text-white',
    activeBorder: 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50/40',
    thBg: 'bg-emerald-50/70 text-emerald-900',
  },
  amber: {
    cardGrad: 'from-amber-500 to-orange-600 text-white',
    activeBorder: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/40',
    thBg: 'bg-amber-50/70 text-amber-900',
  },
  rose: {
    cardGrad: 'from-rose-500 to-pink-600 text-white',
    activeBorder: 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/40',
    thBg: 'bg-rose-50/70 text-rose-900',
  },
  blue: {
    cardGrad: 'from-blue-600 to-indigo-600 text-white',
    activeBorder: 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/40',
    thBg: 'bg-blue-50/70 text-blue-900',
  },
};

export interface RolePermissionsMatrixViewProps {
  users: UserAccount[];
  studentsCount: number;
  isSuperAdmin?: boolean;
  isOfficer?: boolean;
  handleUpdateRole?: (userId: string, newRole: any) => void;
  handleStartEditUser?: (u: UserAccount) => void;
  onOpenVipassanaMasterModal?: () => void;
  onOpenOfficerModal?: () => void;
}
