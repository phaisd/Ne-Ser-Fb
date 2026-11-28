export type PeriodStatus = 'PRESENT' | 'LATE' | 'SICK' | 'ABSENT' | 'UNCHECKED';

export interface MeditationPeriodConfig {
  id: 'p1' | 'p2' | 'p3' | 'p4';
  nameTh: string;
  nameEn?: string;
  time: string;
}

export const DEFAULT_PERIODS: MeditationPeriodConfig[] = [
  { id: 'p1', nameTh: 'ภาคเช้ามืด', nameEn: 'Dawn Period', time: '04.30-06.00' },
  { id: 'p2', nameTh: 'ภาคเช้า', nameEn: 'Morning Period', time: '08.00-11.00' },
  { id: 'p3', nameTh: 'ภาคบ่าย', nameEn: 'Afternoon Period', time: '13.00-15.30' },
  { id: 'p4', nameTh: 'ภาคค่ำ', nameEn: 'Evening Period', time: '18.00-21.30' },
];

export interface StudentAttendanceRow {
  registrationId: string;
  studentCode: string;
  studentName: string;
  groupSpecificCode?: string; // เลขเฉพาะกลุ่ม เช่น B3T18, B4E01
  vasa?: string | number;
  groupNumber?: number;
  groupName?: string;
  programType?: string;
  yearLevel?: number;
  major?: string;
  p1: PeriodStatus;
  p2: PeriodStatus;
  p3: PeriodStatus;
  p4: PeriodStatus;
  p1Time?: string;
  p2Time?: string;
  p3Time?: string;
  p4Time?: string;
  remark?: string;
}

export interface PeriodStats {
  total: number;
  p1Present: number;
  p2Present: number;
  p3Present: number;
  p4Present: number;
  sickCount: number;
  riskCount: number;
}
