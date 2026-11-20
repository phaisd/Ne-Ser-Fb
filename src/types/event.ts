export interface StudentEvent {
  id: string;
  title: string;
  description?: string;
  eventType?: string; // MEDITATION, CEREMONY, ACADEMIC, VOLUNTEER, SPECIAL
  startDate?: string;
  endDate?: string;
  eventTime?: string; // เช่น "08:30 - 16:30 น."
  location?: string; // สถานที่จัดกิจกรรม
  academicYear?: string;
  semester?: number;
  maxParticipants?: number;
  capacity?: number;
  activityHours?: number;
  status?: string; // ACTIVE, COMPLETED, DRAFT
  isActive?: boolean;

  // เป้าหมายผู้เข้าร่วม (Eligibility Criteria)
  targetDegree?: string; // 'ALL' | 'BACHELOR' | 'MASTER' | 'DOCTORAL' (ปริญญาตรี, โท, เอก)
  targetProgram?: string; // 'ALL' | 'THAI' | 'ENGLISH' (หลักสูตรภาษาไทย / ภาษาอังกฤษ)
  targetMajors?: string[]; // สาขาวิชาที่เข้าร่วม
  targetYearLevels?: number[]; // ชั้นปีที่เข้าร่วม เช่น [1, 2, 3, 4]

  // ผู้รับผิดชอบโครงการ และสวิตช์ เปิด/ปิด แสดง
  coordinatorName?: string; // ชื่อผู้รับผิดชอบโครงการ
  coordinatorTitle?: string; // ตำแหน่งผู้รับผิดชอบโครงการ
  coordinatorPhone?: string; // เบอร์โทรศัพท์ติดต่อ
  coordinatorEmail?: string; // อีเมลติดต่อ
  showCoordinator?: boolean; // เปิด/ปิด แสดงผู้รับผิดชอบโครงการ

  // รูปแบบระยะเวลาจัดโครงการ (1 วัน, 2-3 วัน เหมาวัน, หรือ วิปัสสนากัมมัฏฐาน 10-12 วัน)
  durationFormat?: 'SINGLE_DAY' | 'MULTI_DAY' | 'LONG_TERM_MEDITATION';
  totalDays?: number; // จำนวนวันจัดกิจกรรม เช่น 1, 2, 3, 10, 12
  attendanceMode?: 'SINGLE_SCAN' | 'DAILY_CHECKIN'; // เช็คชื่อรอบเดียว หรือ เช็คชื่อรายวัน
  meditationDaysRequired?: number; // จำนวนวันที่ต้องเข้าร่วมขั้นต่ำ เช่น 8 หรือ 10 วัน

  meditationConfig?: MeditationConfig;
  seatingConfig?: EventSeatingConfig;
  createdAt?: string;
  updatedAt?: string;
}

export interface SeatZone {
  id: string; // e.g. "zone-a", "zone-b"
  name: string; // e.g. "โซน A (พระภิกษุ-สามเณร)", "โซน B (นิสิตชาย)"
  color: string; // e.g. "amber" | "blue" | "emerald" | "purple" | "rose" | "indigo" | "teal"
  rows: number; // e.g. 10 แถว
  cols: number; // e.g. 15 ที่นั่งต่อแถว
  prefix?: string; // e.g. "A", "B", "C"
  description?: string;
}

export interface EventSeatingConfig {
  enabled: boolean;
  layoutType?: 'GRID';
  venueName?: string; // สถานที่จัด เช่น อาคาร มวก. 48 พรรษา
  roomName?: string; // ห้อง เช่น หอประชุม ชั้น 3
  zones: SeatZone[];
  disabledSeats?: string[]; // ที่นั่งที่เว้นเป็นทางเดิน หรือเสา เช่น ["A-05", "A-10"]
  updatedAt?: string;
}

export interface MeditationPeriodConfig {
  id: 'p1' | 'p2' | 'p3' | 'p4';
  nameTh: string;
  nameEn?: string;
  time: string;
}

export interface MeditationGroupAssignment {
  groupNumber: number;
  groupName?: string;
  advisors?: string[]; // รายนามอาจารย์ประจำกลุ่มและเจ้าหน้าที่ผู้ช่วย (มีได้หลายคน)
  vipassanaMasters?: string[]; // รายนามพระวิปัสสนาจารย์ / พระมหาเถระผู้สอบอารมณ์ (มีได้หลายรูป)
  notes?: string;
}

export interface MeditationConfig {
  isMeditationEvent?: boolean;
  periods?: MeditationPeriodConfig[];
  lateThresholdMinutes?: number;
  totalInterviewSessions?: number;
  minAttendedDaysRequired?: number;
  groupAssignments?: Record<string, MeditationGroupAssignment>;
}

export interface SatipatthanaChecklist {
  // กายานุปัสสนาสติปัฏฐาน (Kayanupassa-satipatthana)
  standing?: boolean | null; // ขณะยืน (Standing)
  walking?: boolean | null; // ขณะเดิน (Walking)
  sitting?: boolean | null; // ขณะนั่ง (Sitting)
  lying?: boolean | null; // ขณะนอน (Lying)
  // อิริยาบถย่อย (Activities)
  bathing?: boolean | null; // สรงน้ำ (Taking Bath)
  dressing?: boolean | null; // นุ่งห่ม (Dressing)
  eating?: boolean | null; // ฉัน (Eating)
  toileting?: boolean | null; // ขับถ่าย (Toileting)
  others?: boolean | null; // อื่นๆ (Others)

  // เวทนานุปัสสนาสติปัฏฐาน (Vedana - During Standing & Sitting)
  sukha?: boolean | null; // สุข (Happy)
  dukkha?: boolean | null; // ทุกข์ (Suffer)
  upekkha?: boolean | null; // เฉยๆ (Neither happy nor unhappy)

  // จิตตานุปัสสนาสติปัฏฐาน (Citta - During Practice)
  raga?: boolean | null; // ราคะ (Raga/Greed)
  dosa?: boolean | null; // โทสะ (Dosa/Hatred)
  moha?: boolean | null; // โมหะ (Moha/Delusion)

  // ธัมมานุปัสสนาสติปัฏฐาน (Dhamma - What's happened in practice?)
  nivarana5?: boolean | null; // นิวรณ์ 5 (Five Hindrances)
  ayatana6?: boolean | null; // อายตนะ 6 เช่น เห็น, ได้ยิน (6 Ayatanas)
}

export interface VipassanaInterviewEntry {
  sessionNumber: number; // ครั้งที่ 1, 2, 3
  date?: string; // วันที่สอบอารมณ์ เช่น "2025-12-15"
  meditationMasterName?: string; // ชื่อพระวิปัสสนาจารย์ผู้สอบ
  checklist: SatipatthanaChecklist;
  result: 'PASS' | 'NOT_PASS' | 'PENDING'; // ผลการปฏิบัติ: ผ่าน / ไม่ผ่าน
  remarks?: string; // หมายเหตุ (ข้อแนะนำ หรือสาเหตุ)
  updatedAt?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle?: string;
  studentCode: string;
  studentName: string;
  groupSpecificCode?: string; // เลขเฉพาะกลุ่ม เช่น T101, T102, I301
  status: 'REGISTERED' | 'ATTENDED' | 'CANCELLED';
  role?: string; // STUDENT, MONK, COMMITTEE
  degreeLevel?: string; // 'ปริญญาตรี' | 'ปริญญาโท' | 'ปริญญาเอก'
  programType?: string; // 'THAI' | 'ENGLISH' (หลักสูตรภาษา)
  major?: string;
  yearLevel?: number;
  department?: string;
  groupName?: string;
  groupNumber?: number;
  age?: number | string; // อายุ
  vasa?: string | number; // พรรษา (สำหรับพระภิกษุ/สามเณร)
  dailyAttendance?: Record<string, {
    p1?: { status: string; checkInTime?: string; recordedBy?: string }; // ภาคเช้ามืด 04.00-04.30
    p2?: { status: string; checkInTime?: string; recordedBy?: string }; // ภาคเช้า 08.00-08.30
    p3?: { status: string; checkInTime?: string; recordedBy?: string }; // ภาคบ่าย 12.30-13.00
    p4?: { status: string; checkInTime?: string; recordedBy?: string }; // ภาคค่ำ 17.30-18.00
    [periodKey: string]: { status: string; checkInTime?: string; recordedBy?: string } | undefined;
  }>;
  vipassanaInterviews?: Record<string, VipassanaInterviewEntry>; // key: "s1", "s2", "s3"
  finalMeditationResult?: 'PASS' | 'NOT_PASS' | 'PENDING' | 'COMMITTEE_REVIEW'; // ผลการประเมินวิปัสสนารอบสุดท้าย
  remarks?: string;
  attendedAt?: string;
  attendedDays?: number[]; // บันทึกวันที่เข้าร่วมสำหรับโครงการต่อเนื่อง เช่น [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  seatZone?: string; // id หรือชื่อโซน เช่น "zone-a" หรือ "โซน A"
  seatNumber?: string; // หมายเลขที่นั่ง เช่น "A-01", "B-12"
  seatCheckinAt?: string; // เวลาที่เช็คอินเข้าที่นั่ง เช่น ISO timestamp
  seatCheckinBy?: string; // เจ้าหน้าที่ผู้เช็คอินเข้าที่นั่ง
  passedMeditation?: boolean; // ผลการประเมินโครงการวิปัสสนา (ผ่าน/ไม่ผ่าน)
  certificateIssued?: boolean; // ออกวุฒิบัตรดิจิทัลแล้วหรือไม่
  certificateDocNo?: string; // เลขที่วุฒิบัตร เช่น มจร 8002/ว.วป-2569-001
  certificateIssuedAt?: string; // วันเวลาที่ออกวุฒิบัตร
  createdAt: string;
  updatedAt?: string;
}
