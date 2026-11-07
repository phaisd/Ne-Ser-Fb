export interface Student {
  studentCode: string;
  title?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  yearLevel?: number;
  degree?: string;
  department?: string;
  major?: string;
  studyStatus?: string;
  faculty?: string;
  phoneNumber?: string;
  email?: string;
  nationality?: string;
  country?: string;
  age?: number | string;
  gender?: string;
  passportNo?: string;
  passportExpireDate?: string;
  visaType?: string;
  visaExpireDate?: string;
  gpa?: number | string;
  address?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  programType?: 'THAI' | 'ENGLISH';
  remarks?: string;
}

export interface StudyStatusOption {
  value: string;
  label: string;
  color: string;
}

export const STUDY_STATUS_OPTIONS: StudyStatusOption[] = [
  { value: 'ปกติ', label: 'ปกติ (Normal)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'ย้ายเข้า', label: 'ย้ายเข้า (Transferred in)', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'ย้ายออก', label: 'ย้ายออก (Transferred out)', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'เทียบโอน', label: 'เทียบโอน (Credit Transfer)', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'พักการเรียน', label: 'พักการเรียน / รักษาสถานภาพ', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'สำเร็จการศึกษา', label: 'สำเร็จการศึกษา (Graduated)', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { value: 'พ้นสภาพ', label: 'พ้นสภาพ (Dismissed)', color: 'bg-red-100 text-red-800 border-red-300' },
];

export function getStatusBadge(status?: string): StudyStatusOption {
  const match = STUDY_STATUS_OPTIONS.find((s) => s.value === status);
  if (match) return match;
  return {
    value: status || 'ปกติ',
    label: status || 'ปกติ',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
}

export interface DeleteTarget {
  studentCode: string;
  fullName: string;
  major?: string;
  yearLevel?: number;
}

export function formatPassportMask(p?: string, unmask?: boolean): string {
  if (!p) return '';
  if (unmask) return p;
  if (p.length <= 4) return '••••';
  return `${p.slice(0, 2)}••••${p.slice(-2)}`;
}
