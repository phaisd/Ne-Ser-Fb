import { googleSheetsService } from '../google-sheets/service';
import { calculateAttendanceRate, isExamEligible } from '../locale/date-formatter';
import { DayOfWeek, RequestStatus, RequestType } from '@/shared/types';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface CertificateRequestItem {
  id: string;
  tenantId: string;
  requestNumber: string;
  studentId: string;
  studentName: string;
  type: RequestType;
  titleTh: string;
  titleEn: string;
  purpose: string;
  copiesCount: number;
  deliveryMethod: 'DIGITAL' | 'PICKUP' | 'POSTAL';
  status: RequestStatus;
  officerNotes?: string;
  rejectionReason?: string;
  verificationToken: string;
  documentUrl?: string;
  approvedById?: string;
  approvedAt?: Date;
  syncedToSheets: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingRoomItem {
  id: string;
  tenantId: string;
  roomCode: string;
  nameTh: string;
  nameEn: string;
  building: string;
  floor: number;
  capacity: number;
  imageUrl?: string;
  equipments: string[];
  isActive: boolean;
}

export interface RoomBookingItem {
  id: string;
  tenantId: string;
  roomId: string;
  roomName: string;
  userId: string;
  bookedBy: string;
  title: string;
  description?: string;
  attendeesCount: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED';
  cancelReason?: string;
  syncedToSheets: boolean;
  createdAt: Date;
}

export interface CourseItem {
  id: string;
  tenantId: string;
  code: string;
  nameTh: string;
  nameEn: string;
  credits: number;
  lectureHours: number;
  labHours: number;
  department: string;
  sectionsCount: number;
}

export interface StudentItem {
  id: string;
  tenantId: string;
  studentCode: string;
  titleTh: string;
  firstNameTh: string;
  lastNameTh: string;
  titleEn: string;
  firstNameEn: string;
  lastNameEn: string;
  citizenId: string;
  faculty: string;
  major: string;
  academicYear: number;
  yearLevel: number;
  status: 'ACTIVE' | 'PROBATION' | 'SUSPENDED' | 'GRADUATED';
  gpa: number;
  creditsEarned: number;
  email: string;
  phone: string;
}

export interface ScheduleSlotItem {
  id: string;
  tenantId: string;
  courseCode: string;
  courseName: string;
  sectionNumber: string;
  instructorName: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "09:00"
  endTime: string; // "12:00"
  roomCode: string;
  building: string;
}

export interface AttendanceSessionItem {
  id: string;
  tenantId: string;
  courseCode: string;
  courseName: string;
  sectionNumber: string;
  sessionIndex: number;
  sessionDate: string;
  topic: string;
  qrToken?: string;
  qrExpiresAt?: Date;
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentCode: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  leaveCount: number;
  absentCount: number;
  attendanceRate: number;
  isEligible: boolean;
}

export interface UniversityEventItem {
  id: string;
  tenantId: string;
  titleTh: string;
  titleEn: string;
  category: string;
  activityHours: number;
  location: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  currentParticipants: number;
  coverImageUrl?: string;
  isPublished: boolean;
}

export interface EventParticipationItem {
  id: string;
  tenantId: string;
  eventId: string;
  eventTitle: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  activityHours: number;
  attended: boolean;
  attendedAt?: Date;
  certCode?: string;
  certIssuedAt?: Date;
  createdAt: Date;
}

export interface AuditLogItem {
  id: string;
  tenantId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  createdAt: Date;
}

// ==========================================
// SEED DATA
// ==========================================

const INITIAL_ROOMS: MeetingRoomItem[] = [
  {
    id: 'room-01',
    tenantId: 'default',
    roomCode: 'IT-501',
    nameTh: 'ห้องประชุมอัจฉริยะ 501 (Smart Board Room)',
    nameEn: 'Smart Board Room 501',
    building: 'อาคารเฉลิมพระเกียรติ ชั้น 5',
    floor: 5,
    capacity: 20,
    imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
    equipments: ['Smart Interactive Screen 85"', 'High-end Video Conference', 'Wireless Microphones (x4)', 'High-speed Wi-Fi 6'],
    isActive: true,
  },
  {
    id: 'room-02',
    tenantId: 'default',
    roomCode: 'AUD-100',
    nameTh: 'หอประชุมใหญ่ ปิยมหาราช (Grand Auditorium)',
    nameEn: 'Grand Auditorium 100',
    building: 'อาคารประสานมิตร ชั้น 1',
    floor: 1,
    capacity: 250,
    imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
    equipments: ['Dual 4K Laser Projectors', 'Concert Stage Audio Matrix', 'Live Broadcast Streaming Suite', 'Podium with Touch Monitor'],
    isActive: true,
  },
  {
    id: 'room-03',
    tenantId: 'default',
    roomCode: 'EXEC-302',
    nameTh: 'ห้องประชุมผู้บริหาร วิทยพัฒน์',
    nameEn: 'Executive Boardroom 302',
    building: 'อาคารสำนักงานอธิการบดี ชั้น 3',
    floor: 3,
    capacity: 35,
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    equipments: ['Surround Sound Video System', 'Individual Desk Microphones', 'Paperless Tablet Docks', 'VIP Lounge Access'],
    isActive: true,
  },
  {
    id: 'room-04',
    tenantId: 'default',
    roomCode: 'LAB-405',
    nameTh: 'ห้องสัมมนาวิจัยนวัตกรรมดิจิทัล',
    nameEn: 'Digital Innovation Seminar Room',
    building: 'คณะวิศวกรรมศาสตร์และเทคโนโลยี ชั้น 4',
    floor: 4,
    capacity: 45,
    imageUrl: 'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=800&q=80',
    equipments: ['Dual Projectors', 'Wireless Display Receiver', 'Digital Whiteboard', 'Power Outlets at all desks'],
    isActive: true,
  },
];

const INITIAL_COURSES: CourseItem[] = [
  {
    id: 'course-01',
    tenantId: 'default',
    code: 'CS201',
    nameTh: 'การวิเคราะห์และออกแบบขั้นตอนวิธี (Algorithms)',
    nameEn: 'Design and Analysis of Algorithms',
    credits: 3,
    lectureHours: 3,
    labHours: 0,
    department: 'วิทยาการคอมพิวเตอร์',
    sectionsCount: 2,
  },
  {
    id: 'course-02',
    tenantId: 'default',
    code: 'CS202',
    nameTh: 'ระบบจัดการฐานข้อมูล (Database Systems)',
    nameEn: 'Database Management Systems',
    credits: 3,
    lectureHours: 2,
    labHours: 2,
    department: 'วิทยาการคอมพิวเตอร์',
    sectionsCount: 2,
  },
  {
    id: 'course-03',
    tenantId: 'default',
    code: 'SE301',
    nameTh: 'วิศวกรรมซอฟต์แวร์และการทดสอบระบบ',
    nameEn: 'Software Engineering and Quality Assurance',
    credits: 3,
    lectureHours: 3,
    labHours: 0,
    department: 'วิศวกรรมซอฟต์แวร์',
    sectionsCount: 1,
  },
  {
    id: 'course-04',
    tenantId: 'default',
    code: 'AI401',
    nameTh: 'ปัญญาประดิษฐ์และการเรียนรู้ของเครื่อง',
    nameEn: 'Artificial Intelligence and Machine Learning',
    credits: 3,
    lectureHours: 2,
    labHours: 2,
    department: 'วิทยาการคอมพิวเตอร์',
    sectionsCount: 1,
  },
  {
    id: 'course-05',
    tenantId: 'default',
    code: 'GEN101',
    nameTh: 'ภาษาอังกฤษเพื่อการสื่อสารระดับสากล',
    nameEn: 'English for Global Communication',
    credits: 3,
    lectureHours: 3,
    labHours: 0,
    department: 'ศึกษาทั่วไปและภาษาศาสตร์',
    sectionsCount: 3,
  },
];

const INITIAL_STUDENTS: StudentItem[] = [
  {
    id: 'std-01',
    tenantId: 'default',
    studentCode: '65010214',
    titleTh: 'นาย',
    firstNameTh: 'ธนพัฒน์',
    lastNameTh: 'สิทธิโชค',
    titleEn: 'Mr.',
    firstNameEn: 'Thanapat',
    lastNameEn: 'Sittichoke',
    citizenId: '1100500891234',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    major: 'วิทยาการคอมพิวเตอร์ (หลักสูตรปกติ)',
    academicYear: 2565,
    yearLevel: 3,
    status: 'ACTIVE',
    gpa: 3.78,
    creditsEarned: 96,
    email: '65010214@student.univ.ac.th',
    phone: '089-123-4567',
  },
  {
    id: 'std-02',
    tenantId: 'default',
    studentCode: '65010452',
    titleTh: 'นางสาว',
    firstNameTh: 'กมลวรรณ',
    lastNameTh: 'รุ่งอรุณ',
    titleEn: 'Ms.',
    firstNameEn: 'Kamonwan',
    lastNameEn: 'Rung-arun',
    citizenId: '1100500899876',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    major: 'วิทยาการคอมพิวเตอร์ (หลักสูตรปกติ)',
    academicYear: 2565,
    yearLevel: 3,
    status: 'ACTIVE',
    gpa: 3.65,
    creditsEarned: 96,
    email: '65010452@student.univ.ac.th',
    phone: '081-456-7890',
  },
  {
    id: 'std-03',
    tenantId: 'default',
    studentCode: '66020119',
    titleTh: 'นาย',
    firstNameTh: 'วรเมธ',
    lastNameTh: 'เจริญกิจ',
    titleEn: 'Mr.',
    firstNameEn: 'Worameth',
    lastNameEn: 'Charoenkit',
    citizenId: '1100500912345',
    faculty: 'คณะวิศวกรรมศาสตร์',
    major: 'วิศวกรรมซอฟต์แวร์',
    academicYear: 2566,
    yearLevel: 2,
    status: 'ACTIVE',
    gpa: 2.85,
    creditsEarned: 64,
    email: '66020119@student.univ.ac.th',
    phone: '082-987-6543',
  },
  {
    id: 'std-04',
    tenantId: 'default',
    studentCode: '66020334',
    titleTh: 'นางสาว',
    firstNameTh: 'พิชญ์นภัส',
    lastNameTh: 'แก้วมณี',
    titleEn: 'Ms.',
    firstNameEn: 'Pichnaphas',
    lastNameEn: 'Kaewmanee',
    citizenId: '1100500954321',
    faculty: 'คณะบริหารธุรกิจ',
    major: 'ระบบสารสนเทศเพื่อการจัดการ',
    academicYear: 2566,
    yearLevel: 2,
    status: 'ACTIVE',
    gpa: 3.92,
    creditsEarned: 68,
    email: '66020334@student.univ.ac.th',
    phone: '095-234-5678',
  },
];

const INITIAL_REQUESTS: CertificateRequestItem[] = [
  {
    id: 'req-01',
    tenantId: 'default',
    requestNumber: 'REQ-2569-00101',
    studentId: '65010214',
    studentName: 'นายธนพัฒน์ สิทธิโชค',
    type: 'STUDENT_STATUS_CERTIFICATE',
    titleTh: 'หนังสือรับรองสถานภาพนิสิต (ฉบับภาษาไทยและอังกฤษ)',
    titleEn: 'Student Status Certificate (TH/EN)',
    purpose: 'ใช้ประกอบการสมัครเข้าร่วมโครงการฝึกงานภาคฤดูร้อน ณ บริษัทเทคโนโลยีชั้นนำ',
    copiesCount: 2,
    deliveryMethod: 'DIGITAL',
    status: 'APPROVED',
    officerNotes: 'ตรวจสอบสถานภาพนิสิตเรียบร้อย อนุมัติเอกสารฉบับดิจิทัลพร้อมลายมือชื่ออิเล็กทรอนิกส์',
    verificationToken: 'CERT-VERIFY-7B29F41C',
    documentUrl: '/api/certificates/view/CERT-VERIFY-7B29F41C',
    approvedById: 'staff-01',
    approvedAt: new Date(Date.now() - 3600 * 1000 * 24 * 2),
    syncedToSheets: true,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 3),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 2),
  },
  {
    id: 'req-02',
    tenantId: 'default',
    requestNumber: 'REQ-2569-00102',
    studentId: '65010452',
    studentName: 'นางสาวกมลวรรณ รุ่งอรุณ',
    type: 'STUDENT_LOAN_CERTIFICATE',
    titleTh: 'หนังสือรับรองการเป็นนิสิตเพื่อยื่นกู้ยืม กยศ.',
    titleEn: 'Student Loan Certification (Student Loan Fund)',
    purpose: 'ยื่นส่งเอกสารหลักฐาน กองทุนเงินให้กู้ยืมเพื่อการศึกษา ประจำภาคการศึกษาที่ 2/2569',
    copiesCount: 1,
    deliveryMethod: 'PICKUP',
    status: 'PENDING',
    verificationToken: 'CERT-VERIFY-A94D120E',
    syncedToSheets: true,
    createdAt: new Date(Date.now() - 3600 * 1000 * 8),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 8),
  },
  {
    id: 'req-03',
    tenantId: 'default',
    requestNumber: 'REQ-2569-00103',
    studentId: '66020119',
    studentName: 'นายวรเมธ เจริญกิจ',
    type: 'OFFICIAL_TRANSCRIPT',
    titleTh: 'ใบรายงานผลการศึกษาฉบับสมบูรณ์ (Official Transcript)',
    titleEn: 'Official Transcript of Academic Record',
    purpose: 'ขอทุนการศึกษาโครงการเรียนดี คณะวิศวกรรมศาสตร์',
    copiesCount: 1,
    deliveryMethod: 'DIGITAL',
    status: 'PENDING',
    verificationToken: 'CERT-VERIFY-3C88E1A0',
    syncedToSheets: true,
    createdAt: new Date(Date.now() - 3600 * 1000 * 2),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 2),
  },
];

const INITIAL_BOOKINGS: RoomBookingItem[] = [
  {
    id: 'bk-01',
    tenantId: 'default',
    roomId: 'room-01',
    roomName: 'ห้องประชุมอัจฉริยะ 501 (Smart Board Room)',
    userId: 'staff-01',
    bookedBy: 'อ.ดร. ภาณุวัฒน์ กลิ่นเกสร',
    title: 'ประชุมคณะกรรมการพัฒนาหลักสูตรวิทยาการคอมพิวเตอร์ AI',
    description: 'พิจารณาปรับปรุงรายวิชาชั้นปี 3-4 เพื่อรองรับตลาดงานสากล',
    attendeesCount: 12,
    date: '2026-11-02',
    startTime: '09:30',
    endTime: '12:00',
    status: 'CONFIRMED',
    syncedToSheets: true,
    createdAt: new Date(Date.now() - 3600 * 1000 * 12),
  },
  {
    id: 'bk-02',
    tenantId: 'default',
    roomId: 'room-04',
    roomName: 'ห้องสัมมนาวิจัยนวัตกรรมดิจิทัล',
    userId: 'student-01',
    bookedBy: 'นายธนพัฒน์ สิทธิโชค (ประธานสโมสรนิสิต)',
    title: 'ประชุมเตรียมงาน Hackathon นวัตกรรมดิจิทัลเพื่อสังคม',
    description: 'ประสานงานฝ่ายสถานที่ โสตทัศนูปกรณ์ และรางวัลการแข่งขัน',
    attendeesCount: 25,
    date: '2026-11-03',
    startTime: '13:00',
    endTime: '16:00',
    status: 'CONFIRMED',
    syncedToSheets: true,
    createdAt: new Date(Date.now() - 3600 * 1000 * 5),
  },
];

const INITIAL_SCHEDULES: ScheduleSlotItem[] = [
  {
    id: 'slot-01',
    tenantId: 'default',
    courseCode: 'CS201',
    courseName: 'การวิเคราะห์และออกแบบขั้นตอนวิธี (Algorithms)',
    sectionNumber: '1',
    instructorName: 'ผศ.ดร. นครินทร์ สุขประเสริฐ',
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '12:00',
    roomCode: 'ENG-402',
    building: 'อาคารวิศวกรรม 1',
  },
  {
    id: 'slot-02',
    tenantId: 'default',
    courseCode: 'CS202',
    courseName: 'ระบบจัดการฐานข้อมูล (Database Systems)',
    sectionNumber: '1',
    instructorName: 'อ.ดร. ศศิธร เจริญผล',
    dayOfWeek: 'TUESDAY',
    startTime: '13:00',
    endTime: '16:00',
    roomCode: 'LAB-502',
    building: 'อาคารปฏิบัติการคอมพิวเตอร์',
  },
  {
    id: 'slot-03',
    tenantId: 'default',
    courseCode: 'SE301',
    courseName: 'วิศวกรรมซอฟต์แวร์และการทดสอบระบบ',
    sectionNumber: '1',
    instructorName: 'รศ.ดร. อรรถสิทธิ์ วัฒนชัย',
    dayOfWeek: 'WEDNESDAY',
    startTime: '09:00',
    endTime: '12:00',
    roomCode: 'ENG-301',
    building: 'อาคารวิศวกรรม 1',
  },
  {
    id: 'slot-04',
    tenantId: 'default',
    courseCode: 'AI401',
    courseName: 'ปัญญาประดิษฐ์และการเรียนรู้ของเครื่อง',
    sectionNumber: '1',
    instructorName: 'ผศ.ดร. พิชญ์ โชคอนันต์',
    dayOfWeek: 'THURSDAY',
    startTime: '13:00',
    endTime: '16:00',
    roomCode: 'IT-501',
    building: 'อาคารเฉลิมพระเกียรติ',
  },
  {
    id: 'slot-05',
    tenantId: 'default',
    courseCode: 'GEN101',
    courseName: 'ภาษาอังกฤษเพื่อการสื่อสารระดับสากล',
    sectionNumber: '2',
    instructorName: 'Aj. Michael Vance / อ.นลินี วงศ์สวัสดิ์',
    dayOfWeek: 'FRIDAY',
    startTime: '09:00',
    endTime: '12:00',
    roomCode: 'HUM-204',
    building: 'อาคารมนุษยศาสตร์',
  },
];

const INITIAL_EVENTS: UniversityEventItem[] = [
  {
    id: 'event-01',
    tenantId: 'default',
    titleTh: 'สัมมนาพิเศษ: ก้าวสู่อนาคตปัญญาประดิษฐ์ Generative AI ในยุคควอนตัม',
    titleEn: 'Special Seminar: The Future of Generative AI in Quantum Era',
    category: 'สัมมนาวิชาการและเทคโนโลยี',
    activityHours: 3.0,
    location: 'หอประชุมใหญ่ ปิยมหาราช (AUD-100)',
    startDate: '2026-11-10 13:00',
    endDate: '2026-11-10 16:30',
    maxParticipants: 200,
    currentParticipants: 84,
    coverImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    isPublished: true,
  },
  {
    id: 'event-02',
    tenantId: 'default',
    titleTh: 'อบรมเชิงปฏิบัติการ: พัฒนาสมาธิและปัญญา เสริมสร้างภูมิคุ้มกันใจ (Mindfulness & EQ)',
    titleEn: 'Workshop: Mindfulness & Emotional Intelligence for Academic Excellence',
    category: 'ส่งเสริมคุณธรรมและจิตอาสา',
    activityHours: 6.0,
    location: 'ศูนย์ปฏิบัติธรรมและพัฒนาจิต อาคารประสานมิตร',
    startDate: '2026-11-15 08:30',
    endDate: '2026-11-15 16:30',
    maxParticipants: 60,
    currentParticipants: 42,
    coverImageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    isPublished: true,
  },
  {
    id: 'event-03',
    tenantId: 'default',
    titleTh: 'ค่ายอาสาพัฒนาเทคโนโลยีดิจิทัลสู่โรงเรียนชุมชนชนบท ครั้งที่ 8',
    titleEn: 'Rural School Digital Empowerment Volunteer Camp #8',
    category: 'กิจกรรมจิตอาสาเพื่อสังคม',
    activityHours: 18.0,
    location: 'โรงเรียนบ้านหนองบอน อ.แปลงยาว จ.ฉะเชิงเทรา',
    startDate: '2026-11-20 07:00',
    endDate: '2026-11-22 18:00',
    maxParticipants: 50,
    currentParticipants: 48,
    coverImageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
    isPublished: true,
  },
];

const INITIAL_PARTICIPATIONS: EventParticipationItem[] = [
  {
    id: 'part-01',
    tenantId: 'default',
    eventId: 'event-01',
    eventTitle: 'สัมมนาพิเศษ: ก้าวสู่อนาคตปัญญาประดิษฐ์ Generative AI ในยุคควอนตัม',
    studentId: 'std-01',
    studentCode: '65010214',
    studentName: 'นายธนพัฒน์ สิทธิโชค',
    activityHours: 3.0,
    attended: true,
    attendedAt: new Date(Date.now() - 3600 * 1000 * 24 * 5),
    certCode: 'ECERT-2569-AI-0129',
    certIssuedAt: new Date(Date.now() - 3600 * 1000 * 24 * 5),
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 10),
  },
  {
    id: 'part-02',
    tenantId: 'default',
    eventId: 'event-02',
    eventTitle: 'อบรมเชิงปฏิบัติการ: พัฒนาสมาธิและปัญญา เสริมสร้างภูมิคุ้มกันใจ (Mindfulness & EQ)',
    studentId: 'std-01',
    studentCode: '65010214',
    studentName: 'นายธนพัฒน์ สิทธิโชค',
    activityHours: 6.0,
    attended: true,
    attendedAt: new Date(Date.now() - 3600 * 1000 * 24 * 12),
    certCode: 'ECERT-2569-MF-0881',
    certIssuedAt: new Date(Date.now() - 3600 * 1000 * 24 * 12),
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 20),
  },
];

const INITIAL_ATTENDANCE_SUMMARY: StudentAttendanceSummary[] = [
  {
    studentId: 'std-01',
    studentCode: '65010214',
    studentName: 'นายธนพัฒน์ สิทธิโชค',
    courseCode: 'CS201',
    courseName: 'การวิเคราะห์และออกแบบขั้นตอนวิธี (Algorithms)',
    totalSessions: 12,
    presentCount: 11,
    lateCount: 1,
    leaveCount: 0,
    absentCount: 0,
    attendanceRate: 95.8,
    isEligible: true,
  },
  {
    studentId: 'std-01',
    studentCode: '65010214',
    studentName: 'นายธนพัฒน์ สิทธิโชค',
    courseCode: 'CS202',
    courseName: 'ระบบจัดการฐานข้อมูล (Database Systems)',
    totalSessions: 12,
    presentCount: 10,
    lateCount: 2,
    leaveCount: 0,
    absentCount: 0,
    attendanceRate: 91.7,
    isEligible: true,
  },
  {
    studentId: 'std-03',
    studentCode: '66020119',
    studentName: 'นายวรเมธ เจริญกิจ',
    courseCode: 'CS201',
    courseName: 'การวิเคราะห์และออกแบบขั้นตอนวิธี (Algorithms)',
    totalSessions: 12,
    presentCount: 7,
    lateCount: 1,
    leaveCount: 1,
    absentCount: 3,
    attendanceRate: 62.5,
    isEligible: false, // Ineligible (< 80%)
  },
];

// ==========================================
// UNIFIED STATE STORE CLASS
// ==========================================

class UniversityStore {
  private requests: CertificateRequestItem[] = [...INITIAL_REQUESTS];
  private rooms: MeetingRoomItem[] = [...INITIAL_ROOMS];
  private bookings: RoomBookingItem[] = [...INITIAL_BOOKINGS];
  private courses: CourseItem[] = [...INITIAL_COURSES];
  private students: StudentItem[] = [...INITIAL_STUDENTS];
  private schedules: ScheduleSlotItem[] = [...INITIAL_SCHEDULES];
  private events: UniversityEventItem[] = [...INITIAL_EVENTS];
  private participations: EventParticipationItem[] = [...INITIAL_PARTICIPATIONS];
  private attendanceSummaries: StudentAttendanceSummary[] = [...INITIAL_ATTENDANCE_SUMMARY];
  private auditLogs: AuditLogItem[] = [];

  // -----------------------------------------------------------
  // 1. CERTIFICATES & REQUESTS
  // -----------------------------------------------------------
  getRequests(tenantId: string = 'default') {
    return this.requests.filter((r) => r.tenantId === tenantId);
  }

  getRequestById(id: string, tenantId: string = 'default') {
    return this.requests.find((r) => r.id === id || r.verificationToken === id);
  }

  async createCertificateRequest(input: {
    tenantId?: string;
    studentId: string;
    studentName: string;
    type: RequestType;
    purpose: string;
    copiesCount?: number;
    deliveryMethod?: 'DIGITAL' | 'PICKUP' | 'POSTAL';
  }) {
    const tenantId = input.tenantId || 'default';
    const yearBE = new Date().getFullYear() + 543;
    const reqSeq = String(this.requests.length + 101).padStart(5, '0');
    const requestNumber = `REQ-${yearBE}-${reqSeq}`;
    const token = `CERT-VERIFY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const typeTitles: Record<RequestType, { th: string; en: string }> = {
      STUDENT_STATUS_CERTIFICATE: { th: 'หนังสือรับรองสถานภาพนิสิต', en: 'Student Status Certificate' },
      OFFICIAL_TRANSCRIPT: { th: 'ใบรายงานผลการศึกษาฉบับสมบูรณ์', en: 'Official Transcript of Academic Record' },
      STUDENT_LOAN_CERTIFICATE: { th: 'หนังสือรับรองการเป็นนิสิตเพื่อยื่นกู้ยืม กยศ.', en: 'Student Loan Certificate' },
      MILITARY_DEFERMENT: { th: 'หนังสือรับรองผ่อนผันการเกณฑ์ทหาร', en: 'Military Service Deferment Certificate' },
      LEAVE_REQUEST: { th: 'คำร้องขอลาเรียน/ลากิจ', en: 'Leave Request' },
      OTHER: { th: 'คำร้องทั่วไป', en: 'General Academic Request' },
    };

    const titles = typeTitles[input.type] || { th: 'คำร้องทั่วไป', en: 'General Request' };

    const newRequest: CertificateRequestItem = {
      id: `req-${Date.now()}`,
      tenantId,
      requestNumber,
      studentId: input.studentId,
      studentName: input.studentName,
      type: input.type,
      titleTh: titles.th,
      titleEn: titles.en,
      purpose: input.purpose,
      copiesCount: input.copiesCount || 1,
      deliveryMethod: input.deliveryMethod || 'DIGITAL',
      status: 'PENDING',
      verificationToken: token,
      documentUrl: `/api/certificates/view/${token}`,
      syncedToSheets: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.requests.unshift(newRequest);

    // [แนวทางที่ 1: Hybrid Auto-Sync] ส่งแถวข้อมูลไปยัง Google Sheets อัตโนมัติ
    try {
      const rowData = [
        newRequest.requestNumber,
        newRequest.tenantId,
        newRequest.studentId,
        newRequest.studentName,
        newRequest.titleTh,
        newRequest.status,
        newRequest.purpose,
        newRequest.createdAt.toISOString(),
        '', // approvedAt
        '', // notes
        `${process.env.NEXT_PUBLIC_APP_URL || ''}/verify/${newRequest.verificationToken}`,
      ];
      await googleSheetsService.appendRow(undefined, 'Requests_Log', rowData);
    } catch (err) {
      console.warn('[Sync:Sheets] Failed to auto-sync request to sheets:', err);
    }

    this.logAudit(tenantId, 'CREATE_REQUEST', 'CertificateRequest', newRequest.id, { requestNumber });
    return newRequest;
  }

  async updateRequestStatus(
    id: string,
    status: RequestStatus,
    officerNotes?: string,
    rejectionReason?: string,
    approvedById: string = 'staff-01'
  ) {
    const req = this.requests.find((r) => r.id === id);
    if (!req) throw new Error('ไม่พบข้อมูลคำร้อง');

    req.status = status;
    req.officerNotes = officerNotes || req.officerNotes;
    req.rejectionReason = rejectionReason || req.rejectionReason;
    req.updatedAt = new Date();

    if (status === 'APPROVED') {
      req.approvedById = approvedById;
      req.approvedAt = new Date();
    }

    // [แนวทางที่ 1: Hybrid Auto-Sync] ส่งข้อมูลการอัปเดตลง Sheets
    try {
      const updateData = [
        req.requestNumber,
        req.tenantId,
        req.studentId,
        req.studentName,
        req.titleTh,
        req.status,
        req.purpose,
        req.createdAt.toISOString(),
        req.approvedAt ? req.approvedAt.toISOString() : '',
        req.officerNotes || req.rejectionReason || '',
        `${process.env.NEXT_PUBLIC_APP_URL || ''}/verify/${req.verificationToken}`,
      ];
      await googleSheetsService.appendRow(undefined, 'Requests_Log_Updates', updateData);
    } catch (err) {
      console.warn('[Sync:Sheets] Failed to auto-sync status update to sheets:', err);
    }

    this.logAudit(req.tenantId, `STATUS_${status}`, 'CertificateRequest', req.id, { officerNotes });
    return req;
  }

  // -----------------------------------------------------------
  // 2. MEETING ROOM BOOKING (ANTI-DOUBLE BOOKING)
  // -----------------------------------------------------------
  getRooms(tenantId: string = 'default') {
    return this.rooms.filter((r) => r.tenantId === tenantId && r.isActive);
  }

  getBookings(tenantId: string = 'default', date?: string) {
    return this.bookings.filter((b) => {
      if (b.tenantId !== tenantId) return false;
      if (date && b.date !== date) return false;
      return true;
    });
  }

  /**
   * ตรวจสอบการจองห้องซ้อนทับ (Double Booking Check 100%)
   * คืนค่า false หากมีคิวจองที่ชนกันในช่วงวันและเวลาเดียวกัน
   */
  checkRoomAvailability(
    roomId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): boolean {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    const conflicting = this.bookings.find((b) => {
      if (b.roomId !== roomId) return false;
      if (b.date !== date) return false;
      if (b.status === 'CANCELLED' || b.status === 'REJECTED') return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;

      const existingStart = this.timeToMinutes(b.startTime);
      const existingEnd = this.timeToMinutes(b.endTime);

      // Overlap condition: startA < endB AND endA > startB
      return startMinutes < existingEnd && endMinutes > existingStart;
    });

    return !conflicting;
  }

  async createRoomBooking(input: {
    tenantId?: string;
    roomId: string;
    userId?: string;
    bookedBy: string;
    title: string;
    description?: string;
    attendeesCount: number;
    date: string;
    startTime: string;
    endTime: string;
  }) {
    const tenantId = input.tenantId || 'default';
    const room = this.rooms.find((r) => r.id === input.roomId);
    if (!room) throw new Error('ไม่พบข้อมูลห้องประชุมที่ระบุ');

    // ตรวจสอบการจองซ้อนทับอย่างเด็ดขาด
    const isAvailable = this.checkRoomAvailability(
      input.roomId,
      input.date,
      input.startTime,
      input.endTime
    );

    if (!isAvailable) {
      throw new Error(`ห้องประชุม ${room.nameTh} ถูกจองแล้วในช่วงเวลา ${input.startTime} - ${input.endTime} น.`);
    }

    const newBooking: RoomBookingItem = {
      id: `bk-${Date.now()}`,
      tenantId,
      roomId: room.id,
      roomName: room.nameTh,
      userId: input.userId || 'user-01',
      bookedBy: input.bookedBy,
      title: input.title,
      description: input.description,
      attendeesCount: input.attendeesCount,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      status: 'CONFIRMED',
      syncedToSheets: true,
      createdAt: new Date(),
    };

    this.bookings.push(newBooking);

    // [แนวทางที่ 1: Hybrid Auto-Sync] บันทึกแถวข้อมูลลง Sheets ทันที
    try {
      const rowData = [
        newBooking.id,
        newBooking.tenantId,
        newBooking.roomName,
        newBooking.bookedBy,
        newBooking.title,
        newBooking.date,
        newBooking.startTime,
        newBooking.endTime,
        newBooking.attendeesCount,
        newBooking.status,
      ];
      await googleSheetsService.appendRow(undefined, 'RoomBookings_Log', rowData);
    } catch (err) {
      console.warn('[Sync:Sheets] Failed to sync booking to sheets:', err);
    }

    this.logAudit(tenantId, 'CREATE_BOOKING', 'RoomBooking', newBooking.id, {
      room: room.roomCode,
      date: input.date,
    });

    return newBooking;
  }

  async cancelRoomBooking(id: string, reason: string) {
    const booking = this.bookings.find((b) => b.id === id);
    if (!booking) throw new Error('ไม่พบรายการจอง');
    booking.status = 'CANCELLED';
    booking.cancelReason = reason;

    this.logAudit(booking.tenantId, 'CANCEL_BOOKING', 'RoomBooking', booking.id, { reason });
    return booking;
  }

  // -----------------------------------------------------------
  // 3. ATTENDANCE & EXAM ELIGIBILITY
  // -----------------------------------------------------------
  getAttendanceSummaries(studentCode?: string) {
    if (studentCode) {
      return this.attendanceSummaries.filter((a) => a.studentCode === studentCode);
    }
    return this.attendanceSummaries;
  }

  async recordAttendance(input: {
    studentCode: string;
    courseCode: string;
    status: 'PRESENT' | 'LATE' | 'LEAVE' | 'ABSENT';
  }) {
    let summary = this.attendanceSummaries.find(
      (a) => a.studentCode === input.studentCode && a.courseCode === input.courseCode
    );

    if (summary) {
      summary.totalSessions += 1;
      if (input.status === 'PRESENT') summary.presentCount += 1;
      else if (input.status === 'LATE') summary.lateCount += 1;
      else if (input.status === 'LEAVE') summary.leaveCount += 1;
      else if (input.status === 'ABSENT') summary.absentCount += 1;

      summary.attendanceRate = calculateAttendanceRate(
        summary.presentCount,
        summary.lateCount,
        summary.totalSessions
      );
      summary.isEligible = isExamEligible(summary.attendanceRate);
    }

    // Auto-sync attendance row
    try {
      const row = [
        `att-${Date.now()}`,
        'default',
        input.courseCode,
        input.studentCode,
        new Date().toISOString(),
        input.status,
      ];
      await googleSheetsService.appendRow(undefined, 'Attendance_Log', row);
    } catch (err) {
      console.warn('[Sync:Sheets] Attendance sync error:', err);
    }

    return summary;
  }

  // -----------------------------------------------------------
  // 4. CURRICULUM & COURSES (IMPORT/EXPORT)
  // -----------------------------------------------------------
  getCourses(tenantId: string = 'default') {
    return this.courses.filter((c) => c.tenantId === tenantId);
  }

  async addCourse(course: Omit<CourseItem, 'id' | 'sectionsCount'>) {
    const existing = this.courses.find((c) => c.code.toUpperCase() === course.code.toUpperCase());
    if (existing) throw new Error(`รหัสวิชา ${course.code} มีอยู่ในระบบแล้ว`);

    const newCourse: CourseItem = {
      ...course,
      id: `course-${Date.now()}`,
      sectionsCount: 1,
    };
    this.courses.push(newCourse);
    return newCourse;
  }

  // -----------------------------------------------------------
  // 5. STUDENT DIRECTORY (IMPORT/EXPORT)
  // -----------------------------------------------------------
  getStudents(tenantId: string = 'default') {
    return this.students.filter((s) => s.tenantId === tenantId);
  }

  getStudentByCode(code: string) {
    return this.students.find((s) => s.studentCode === code);
  }

  async importStudentsFromRows(rows: string[][]) {
    // Expected header: [StudentCode, CitizenID, Title, FirstNameTH, LastNameTH, FirstNameEN, LastNameEN, Faculty, Major, Year, GPA, Email, Phone]
    let imported = 0;
    for (const r of rows) {
      if (!r[0] || r[0].toLowerCase().includes('student') || r[0].toLowerCase().includes('รหัส')) {
        continue; // skip header
      }

      const code = r[0].trim();
      const existing = this.students.find((s) => s.studentCode === code);
      if (existing) {
        // update
        existing.firstNameTh = r[3] || existing.firstNameTh;
        existing.lastNameTh = r[4] || existing.lastNameTh;
        existing.faculty = r[7] || existing.faculty;
        existing.major = r[8] || existing.major;
        existing.gpa = parseFloat(r[10]) || existing.gpa;
      } else {
        // insert
        this.students.push({
          id: `std-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          tenantId: 'default',
          studentCode: code,
          citizenId: r[1] || '1100500999999',
          titleTh: r[2] || 'นาย',
          firstNameTh: r[3] || 'นิสิต',
          lastNameTh: r[4] || 'ใจดี',
          titleEn: 'Mr.',
          firstNameEn: r[5] || 'Student',
          lastNameEn: r[6] || 'Test',
          faculty: r[7] || 'คณะวิทยาศาสตร์และเทคโนโลยี',
          major: r[8] || 'วิทยาการคอมพิวเตอร์',
          academicYear: parseInt(r[9], 10) || 2566,
          yearLevel: 2,
          status: 'ACTIVE',
          gpa: parseFloat(r[10]) || 3.0,
          creditsEarned: 60,
          email: r[11] || `${code}@student.univ.ac.th`,
          phone: r[12] || '080-000-0000',
        });
      }
      imported++;
    }

    return imported;
  }

  getStudentsExportRows(): string[][] {
    const headers = [
      'StudentCode',
      'CitizenID',
      'TitleTH',
      'FirstNameTH',
      'LastNameTH',
      'FirstNameEN',
      'LastNameEN',
      'Faculty',
      'Major',
      'YearLevel',
      'GPA',
      'Email',
      'Phone',
      'Status',
    ];

    const data = this.students.map((s) => [
      s.studentCode,
      s.citizenId,
      s.titleTh,
      s.firstNameTh,
      s.lastNameTh,
      s.firstNameEn,
      s.lastNameEn,
      s.faculty,
      s.major,
      String(s.yearLevel),
      s.gpa.toFixed(2),
      s.email,
      s.phone,
      s.status,
    ]);

    return [headers, ...data];
  }

  // -----------------------------------------------------------
  // 6. TIMETABLE & SCHEDULING (CLASH WARNING)
  // -----------------------------------------------------------
  getSchedules(tenantId: string = 'default') {
    return this.schedules.filter((s) => s.tenantId === tenantId);
  }

  checkScheduleClash(
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    roomCode: string,
    excludeSlotId?: string
  ): { hasClash: boolean; conflictSlot?: ScheduleSlotItem } {
    const startM = this.timeToMinutes(startTime);
    const endM = this.timeToMinutes(endTime);

    const conflict = this.schedules.find((s) => {
      if (excludeSlotId && s.id === excludeSlotId) return false;
      if (s.dayOfWeek !== dayOfWeek) return false;
      if (s.roomCode.toLowerCase() !== roomCode.toLowerCase()) return false;

      const slotStart = this.timeToMinutes(s.startTime);
      const slotEnd = this.timeToMinutes(s.endTime);

      return startM < slotEnd && endM > slotStart;
    });

    if (conflict) {
      return { hasClash: true, conflictSlot: conflict };
    }
    return { hasClash: false };
  }

  async addScheduleSlot(slot: Omit<ScheduleSlotItem, 'id'>) {
    const clash = this.checkScheduleClash(slot.dayOfWeek, slot.startTime, slot.endTime, slot.roomCode);
    if (clash.hasClash) {
      throw new Error(
        `ห้องเรียน ${slot.roomCode} มีการเรียนการสอนชนกับวิชา ${clash.conflictSlot?.courseCode} (${clash.conflictSlot?.startTime} - ${clash.conflictSlot?.endTime})`
      );
    }

    const newSlot: ScheduleSlotItem = {
      ...slot,
      id: `slot-${Date.now()}`,
    };
    this.schedules.push(newSlot);
    return newSlot;
  }

  // -----------------------------------------------------------
  // 7. EVENTS & E-CERTIFICATE
  // -----------------------------------------------------------
  getEvents(tenantId: string = 'default') {
    return this.events.filter((e) => e.tenantId === tenantId && e.isPublished);
  }

  getParticipations(studentId?: string) {
    if (studentId) {
      return this.participations.filter((p) => p.studentId === studentId || p.studentCode === studentId);
    }
    return this.participations;
  }

  async registerEvent(eventId: string, studentCode: string) {
    const event = this.events.find((e) => e.id === eventId);
    if (!event) throw new Error('ไม่พบข้อมูลกิจกรรม');

    const student = this.students.find((s) => s.studentCode === studentCode);
    if (!student) throw new Error('ไม่พบข้อมูลนิสิต');

    const existing = this.participations.find((p) => p.eventId === eventId && p.studentCode === studentCode);
    if (existing) throw new Error('นิสิตลงทะเบียนเข้าร่วมกิจกรรมนี้แล้ว');

    const newPart: EventParticipationItem = {
      id: `part-${Date.now()}`,
      tenantId: 'default',
      eventId: event.id,
      eventTitle: event.titleTh,
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: `${student.titleTh} ${student.firstNameTh} ${student.lastNameTh}`,
      activityHours: event.activityHours,
      attended: false,
      createdAt: new Date(),
    };

    this.participations.push(newPart);
    event.currentParticipants += 1;
    return newPart;
  }

  async checkInAndIssueCert(participationId: string) {
    const part = this.participations.find((p) => p.id === participationId);
    if (!part) throw new Error('ไม่พบประวัติการลงทะเบียน');

    part.attended = true;
    part.attendedAt = new Date();
    part.certCode = `ECERT-${new Date().getFullYear() + 543}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    part.certIssuedAt = new Date();

    // Auto-sync to Events Log
    try {
      const row = [
        part.certCode,
        part.tenantId,
        part.eventTitle,
        part.studentCode,
        part.studentName,
        part.activityHours,
        'COMPLETED',
        part.certIssuedAt.toISOString(),
      ];
      await googleSheetsService.appendRow(undefined, 'Events_Log', row);
    } catch (err) {
      console.warn('[Sync:Sheets] Event cert sync error:', err);
    }

    return part;
  }

  // -----------------------------------------------------------
  // HELPER UTILITIES
  // -----------------------------------------------------------
  private timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
    return h * 60 + (m || 0);
  }

  private logAudit(tenantId: string, action: string, resource: string, resourceId?: string, details?: any) {
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      tenantId,
      action,
      resource,
      resourceId,
      details,
      createdAt: new Date(),
    });
  }

  getAuditLogs() {
    return this.auditLogs;
  }
}

export const universityStore = new UniversityStore();
