import type { StudentEvent, EventRegistration, EventSeatingConfig, SeatZone } from '@/types/event';
import type { ParticipantStatusCategory } from '@/services/events/seatingUtils';

export const INSPECTION_PERIODS = [
  { id: 'p1', nameTh: 'ภาคเช้ามืด', time: '04.00 - 04.30 น.', icon: '🌅' },
  { id: 'p2', nameTh: 'ภาคเช้า', time: '08.00 - 08.30 น.', icon: '☀️' },
  { id: 'p3', nameTh: 'ภาคบ่าย', time: '12.30 - 13.00 น.', icon: '🌤️' },
  { id: 'p4', nameTh: 'ภาคค่ำ', time: '17.30 - 18.00 น.', icon: '🌙' },
] as const;

export type InspectionPeriodKey = 'p1' | 'p2' | 'p3' | 'p4';

export const ZONE_COLORS: Record<string, { bg: string; border: string; text: string; lightBg: string; ring: string }> = {
  amber: { bg: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-900', lightBg: 'bg-amber-50', ring: 'ring-amber-500' },
  blue: { bg: 'bg-blue-600', border: 'border-blue-400', text: 'text-blue-900', lightBg: 'bg-blue-50', ring: 'ring-blue-500' },
  emerald: { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-emerald-900', lightBg: 'bg-emerald-50', ring: 'ring-emerald-500' },
  purple: { bg: 'bg-purple-600', border: 'border-purple-400', text: 'text-purple-900', lightBg: 'bg-purple-50', ring: 'ring-purple-500' },
  rose: { bg: 'bg-rose-600', border: 'border-rose-400', text: 'text-rose-900', lightBg: 'bg-rose-50', ring: 'ring-rose-500' },
  teal: { bg: 'bg-teal-600', border: 'border-teal-400', text: 'text-teal-900', lightBg: 'bg-teal-50', ring: 'ring-teal-500' },
  indigo: { bg: 'bg-indigo-600', border: 'border-indigo-400', text: 'text-indigo-900', lightBg: 'bg-indigo-50', ring: 'ring-indigo-500' },
};

export interface VipassanaSeatMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  registrations: EventRegistration[];
  onRefresh: () => void;
  onOpenSeatScanner?: (event: StudentEvent) => void;
  onOpenEventQr?: (event: StudentEvent) => void;
}

export interface SeatMapStudentInfo {
  seatCode: string;
  studentCode: string;
  name: string;
  gender: string;
  degree: string;
  program: string;
  faculty: string;
  major: string;
  yearLevel: string;
  registrationStatus: string;
}
