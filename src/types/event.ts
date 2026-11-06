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

  meditationConfig?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle?: string;
  studentCode: string;
  studentName: string;
  status: 'REGISTERED' | 'ATTENDED' | 'CANCELLED';
  role?: string; // STUDENT, MONK, COMMITTEE
  degreeLevel?: string; // 'ปริญญาตรี' | 'ปริญญาโท' | 'ปริญญาเอก'
  programType?: string; // 'THAI' | 'ENGLISH' (หลักสูตรภาษา)
  major?: string;
  yearLevel?: number;
  department?: string;
  groupName?: string;
  groupNumber?: number;
  vasa?: string | number; // พรรษา (สำหรับพระภิกษุ/สามเณร)
  dailyAttendance?: Record<string, {
    p1?: { status: string }; // ภาคเช้ามืด 04.00-04.30
    p2?: { status: string }; // ภาคเช้า 08.00-08.30
    p3?: { status: string }; // ภาคบ่าย 12.30-13.00
    p4?: { status: string }; // ภาคค่ำ 17.30-18.00
  }>;
  remarks?: string;
  attendedAt?: string;
  attendedDays?: number[]; // บันทึกวันที่เข้าร่วมสำหรับโครงการต่อเนื่อง เช่น [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  passedMeditation?: boolean; // ผลการประเมินโครงการวิปัสสนา (ผ่าน/ไม่ผ่าน)
  createdAt: string;
  updatedAt?: string;
}
