import type { StudentEvent, EventRegistration } from '@/types/event';

export type PeriodKey = 'p1' | 'p2' | 'p3' | 'p4';

export interface ScannerRecentItem {
  id: string;
  studentCode: string;
  studentName: string;
  groupNumber?: number | string;
  vasa?: number | string;
  status: 'PRESENT' | 'LATE' | 'SICK';
  time: string;
  isDuplicate?: boolean;
  isOverDuplicateLimit?: boolean;
  scanCount?: number;
  period?: PeriodKey;
}

export interface ScannerFeedback {
  type: 'SUCCESS' | 'WARN' | 'ERROR';
  message: string;
  student?: EventRegistration;
  time?: string;
  isDuplicate?: boolean;
  scanCount?: number;
  isOverDuplicateLimit?: boolean;
  firstCheckInTime?: string;
  scannedCode?: string;
  status?: 'PRESENT' | 'LATE' | 'SICK';
  badgeTitle?: string;
  badgeTitleEn?: string;
  subNote?: string;
  subNoteEn?: string;
  isEnglish?: boolean;
}

export interface BarcodeDetectorInstance {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
}

export interface VipassanaLiveScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  registrations: EventRegistration[];
  onCheckInRecorded?: () => void;
}

export const PERIOD_CONFIG: Record<
  PeriodKey,
  { nameTh: string; nameEn: string; timeRange: string; defaultStart: string; defaultEnd: string }
> = {
  p1: { nameTh: 'ภาคเช้ามืด', nameEn: 'Dawn Period', timeRange: '04.00-04.30', defaultStart: '03:30', defaultEnd: '06:00' },
  p2: { nameTh: 'ภาคเช้า', nameEn: 'Morning Period', timeRange: '08.00-08.30', defaultStart: '07:30', defaultEnd: '10:30' },
  p3: { nameTh: 'ภาคบ่าย', nameEn: 'Afternoon Period', timeRange: '12.30-13.00', defaultStart: '11:30', defaultEnd: '15:00' },
  p4: { nameTh: 'ภาคค่ำ', nameEn: 'Evening Period', timeRange: '17.30-18.00', defaultStart: '16:30', defaultEnd: '21:00' },
};

export function autoDetectPeriod(): PeriodKey {
  const now = new Date();
  const curHour = now.getHours();
  const curMin = now.getMinutes();
  const curTime = curHour * 60 + curMin;

  // p1: รอบเช้ามืด (03.30 - 07.00 น.)
  if (curTime >= 3 * 60 + 30 && curTime < 7 * 60) return 'p1';
  // p2: รอบเช้า (07.00 - 12.00 น.)
  if (curTime >= 7 * 60 && curTime < 12 * 60) return 'p2';
  // p3: รอบบ่าย (12.00 - 16.30 น.)
  if (curTime >= 12 * 60 && curTime < 16 * 60 + 30) return 'p3';
  // p4: รอบค่ำ (16.30 - 23.59 น. และ 00.00 - 03.30 น.)
  return 'p4';
}
