import { googleSheetsService } from '../google-sheets/service';
import {
  CertificateTypeDto,
  CertificateRequestDto,
  MeetingRoomDto,
  MeetingBookingDto,
  StudentDto,
  CourseDto,
  CourseEnrollmentDto,
  EventDto,
  EventRegistrationDto,
} from '@/shared/types';

export interface UserDto {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'TEACHER' | 'STUDENT';
  avatarUrl?: string;
}

const DEFAULT_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

// 1. 3 Test Users (Password: Password123!)
const INITIAL_USERS: UserDto[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    tenantId: DEFAULT_TENANT_ID,
    email: 'admin@mcu.ac.th',
    fullName: 'พระมหาอดิศักดิ์ วรปญฺโญ (ผู้อำนวยการสำนักทะเบียน)',
    role: 'SUPER_ADMIN',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    tenantId: DEFAULT_TENANT_ID,
    email: 'teacher@mcu.ac.th',
    fullName: 'พระครูสุตวราภิรม, ดร. (อาจารย์ประจำภาควิชา)',
    role: 'TEACHER',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    tenantId: DEFAULT_TENANT_ID,
    email: 'student@mcu.ac.th',
    fullName: 'พระมหาธนพัฒน์ โชติปญฺโญ (นิสิตปริญญาตรี)',
    role: 'STUDENT',
  },
];

// 2. 4 Certificate Types
const INITIAL_CERTIFICATE_TYPES: CertificateTypeDto[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    tenantId: DEFAULT_TENANT_ID,
    name: 'หนังสือรับรองสภาพนิสิต (Certificate of Student Status)',
    description: 'รับรองสถานภาพการเป็นนิสิตปัจจุบัน สำหรับยื่นขอวีซ่า สมัครงาน หรือหน่วยงานราชการ',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    tenantId: DEFAULT_TENANT_ID,
    name: 'หนังสือรับรองความประพฤติ (Certificate of Good Conduct)',
    description: 'รับรองความประพฤติและปฏิปทาของนิสิตบรรพชิตและคฤหัสถ์',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    tenantId: DEFAULT_TENANT_ID,
    name: 'หนังสือรับรองผลการศึกษา (Official Transcript)',
    description: 'ใบรายงานผลการศึกษาตลอดหลักสูตร พร้อมเกรดเฉลี่ยสะสมและหน่วยกิต',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    tenantId: DEFAULT_TENANT_ID,
    name: 'หนังสือรับรองเพื่อขอผ่อนผันการเกณฑ์ทหาร',
    description: 'สำหรับนิสิตคฤหัสถ์ชายในการนำส่งกองการสัสดีและที่ว่าการอำเภอ',
    isActive: true,
    createdAt: new Date(),
  },
];

// 3. 3 Meeting Rooms
const INITIAL_ROOMS: MeetingRoomDto[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    tenantId: DEFAULT_TENANT_ID,
    name: 'ห้องประชุม 101 (Smart Board Room)',
    capacity: 20,
    equipment: 'Smart Interactive Board 75", ไมโครโฟนไร้สาย (x2), Wi-Fi 6',
    imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    tenantId: DEFAULT_TENANT_ID,
    name: 'ห้องประชุมสัมมนาใหญ่ (Grand Auditorium)',
    capacity: 250,
    equipment: 'Dual 4K Laser Projector, ระบบเครื่องเสียงมาตรฐานคอนเสิร์ต, Live Broadcast Suite, แท่นบรรยายดิจิทัล',
    imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    tenantId: DEFAULT_TENANT_ID,
    name: 'ห้องประชุมผู้บริหาร (Executive Boardroom)',
    capacity: 35,
    equipment: 'Surround Video System, ไมโครโฟนตั้งโต๊ะรายที่นั่ง, แท็บเล็ตควบคุมระบบแสงและเสียง, VIP Lounge',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },
];

// 4. 10 Sample Students
const INITIAL_STUDENTS: StudentDto[] = [
  { id: 's-65010214', tenantId: DEFAULT_TENANT_ID, studentCode: '65010214', title: 'พระมหา', firstName: 'ธนพัฒน์', lastName: 'โชติปญฺโญ', yearLevel: 3, degree: 'ปริญญาตรี', faculty: 'คณะพุทธศาสตร์', major: 'สาขาวิชาพระพุทธศาสนา', studyStatus: 'ปกติ', email: '65010214@mcu.ac.th', phoneNumber: '081-111-0001', isActive: true },
  { id: 's-65010452', tenantId: DEFAULT_TENANT_ID, studentCode: '65010452', title: 'สามเณร', firstName: 'กมลวรรณ', lastName: 'รุ่งอรุณ', yearLevel: 3, degree: 'ปริญญาตรี', faculty: 'คณะพุทธศาสตร์', major: 'สาขาวิชาปรัชญา', studyStatus: 'ปกติ', email: '65010452@mcu.ac.th', phoneNumber: '081-111-0002', isActive: true },
  { id: 's-66020119', tenantId: DEFAULT_TENANT_ID, studentCode: '66020119', title: 'นาย', firstName: 'วรเมธ', lastName: 'เจริญกิจ', yearLevel: 2, degree: 'ปริญญาตรี', faculty: 'คณะครุศาสตร์', major: 'สาขาวิชาการสอนภาษาไทย', studyStatus: 'ปกติ', email: '66020119@mcu.ac.th', phoneNumber: '081-111-0003', isActive: true },
  { id: 's-66020334', tenantId: DEFAULT_TENANT_ID, studentCode: '66020334', title: 'นางสาว', firstName: 'พิชญ์นภัส', lastName: 'แก้วมณี', yearLevel: 2, degree: 'ปริญญาตรี', faculty: 'คณะสังคมศาสตร์', major: 'สาขาวิชารัฐศาสตร์', studyStatus: 'ปกติ', email: '66020334@mcu.ac.th', phoneNumber: '081-111-0004', isActive: true },
  { id: 's-65010301', tenantId: DEFAULT_TENANT_ID, studentCode: '65010301', title: 'พระปลัด', firstName: 'สมบูรณ์', lastName: 'วรธมฺโม', yearLevel: 3, degree: 'ปริญญาตรี', faculty: 'คณะพุทธศาสตร์', major: 'สาขาวิชาพระไตรปิฎกศึกษา', studyStatus: 'ปกติ', email: '65010301@mcu.ac.th', phoneNumber: '081-111-0005', isActive: true },
  { id: 's-66010402', tenantId: DEFAULT_TENANT_ID, studentCode: '66010402', title: 'สามเณร', firstName: 'ชินวรณ์', lastName: 'สุขเกษม', yearLevel: 2, degree: 'ปริญญาตรี', faculty: 'คณะพุทธศาสตร์', major: 'สาขาวิชาพระพุทธศาสนา', studyStatus: 'ปกติ', email: '66010402@mcu.ac.th', phoneNumber: '081-111-0006', isActive: true },
  { id: 's-67010503', tenantId: DEFAULT_TENANT_ID, studentCode: '67010503', title: 'พระ', firstName: 'กิตติศักดิ์', lastName: 'ปญฺญาธโร', yearLevel: 1, degree: 'ปริญญาตรี', faculty: 'คณะพุทธศาสตร์', major: 'สาขาวิชาบาลีพุทธศาสตร์', studyStatus: 'ปกติ', email: '67010503@mcu.ac.th', phoneNumber: '081-111-0007', isActive: true },
  { id: 's-66030104', tenantId: DEFAULT_TENANT_ID, studentCode: '66030104', title: 'นาย', firstName: 'ธีรภัทร', lastName: 'สถิตพงษ์', yearLevel: 2, degree: 'ปริญญาตรี', faculty: 'คณะมนุษยศาสตร์', major: 'สาขาวิชาภาษาอังกฤษ', studyStatus: 'ปกติ', email: '66030104@mcu.ac.th', phoneNumber: '081-111-0008', isActive: true },
  { id: 's-67030205', tenantId: DEFAULT_TENANT_ID, studentCode: '67030205', title: 'นางสาว', firstName: 'ศศิธร', lastName: 'พัฒนพงษ์', yearLevel: 1, degree: 'ปริญญาตรี', faculty: 'คณะครุศาสตร์', major: 'สาขาวิชาการสอนสังคมศึกษา', studyStatus: 'ปกติ', email: '67030205@mcu.ac.th', phoneNumber: '081-111-0009', isActive: true },
  { id: 's-65020106', tenantId: DEFAULT_TENANT_ID, studentCode: '65020106', title: 'พระครูสมุห์', firstName: 'ณรงค์ชัย', lastName: 'ชิตมาโร', yearLevel: 3, degree: 'ปริญญาตรี', faculty: 'คณะพุทธศาสตร์', major: 'สาขาวิชาพระพุทธศาสนา', studyStatus: 'ปกติ', email: '65020106@mcu.ac.th', phoneNumber: '081-111-0010', isActive: true },
];

const INITIAL_COURSES: CourseDto[] = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    tenantId: DEFAULT_TENANT_ID,
    courseCode: '000101',
    courseName: 'พระไตรปิฎกศึกษา (Tipitaka Studies)',
    courseNameEn: 'Studies in Tipitaka and Buddhist Canons',
    credits: 3,
    section: '1',
    term: '1/2569',
    academicYear: '2569',
    semester: 1,
    room: 'ห้องเรียน 101 อาคารมหาจุฬาฯ',
    dayOfWeek: 1, // จันทร์
    startTime: '09:00',
    endTime: '12:00',
    targetSessions: 16,
    calculationRules: { lateCountsAsFull: true, minPercent: 80.0 },
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    tenantId: DEFAULT_TENANT_ID,
    courseCode: '000202',
    courseName: 'ธรรมวิภาคและพุทธธรรมขั้นสูง',
    courseNameEn: 'Advanced Dhamma Analysis & Buddhist Philosophy',
    credits: 3,
    section: '1',
    term: '1/2569',
    academicYear: '2569',
    semester: 1,
    room: 'ห้องบรรยาย 205 อาคารเรียนรวม',
    dayOfWeek: 2, // อังคาร
    startTime: '13:00',
    endTime: '16:00',
    targetSessions: 16,
    calculationRules: { lateCountsAsFull: true, minPercent: 80.0 },
  },
];

const INITIAL_ENROLLMENTS: CourseEnrollmentDto[] = [
  {
    id: 'enr-01',
    tenantId: DEFAULT_TENANT_ID,
    courseId: 'e0000000-0000-0000-0000-000000000001',
    studentId: 's-65010214',
    studentCode: '65010214',
    studentName: 'พระมหาธนพัฒน์ โชติปญฺโญ',
    courseCode: '000101',
    courseName: 'พระไตรปิฎกศึกษา (Tipitaka Studies)',
    attendanceScore: 93.8,
    status: 'ENROLLED',
    presentCount: 14,
    lateCount: 1,
    leaveCount: 1,
    absentCount: 0,
    attendancePercent: 93.8,
    isEligible: true,
  },
  {
    id: 'enr-02',
    tenantId: DEFAULT_TENANT_ID,
    courseId: 'e0000000-0000-0000-0000-000000000001',
    studentId: 's-65010452',
    studentCode: '65010452',
    studentName: 'สามเณรกมลวรรณ รุ่งอรุณ',
    courseCode: '000101',
    courseName: 'พระไตรปิฎกศึกษา (Tipitaka Studies)',
    attendanceScore: 87.5,
    status: 'ENROLLED',
    presentCount: 13,
    lateCount: 1,
    leaveCount: 2,
    absentCount: 0,
    attendancePercent: 87.5,
    isEligible: true,
  },
  {
    id: 'enr-03',
    tenantId: DEFAULT_TENANT_ID,
    courseId: 'e0000000-0000-0000-0000-000000000001',
    studentId: 's-66020119',
    studentCode: '66020119',
    studentName: 'นายวรเมธ เจริญกิจ',
    courseCode: '000101',
    courseName: 'พระไตรปิฎกศึกษา (Tipitaka Studies)',
    attendanceScore: 68.8,
    status: 'ENROLLED',
    presentCount: 10,
    lateCount: 1,
    leaveCount: 1,
    absentCount: 4,
    attendancePercent: 68.8,
    isEligible: false, // Ineligible (< 80%)
  },
  {
    id: 'enr-04',
    tenantId: DEFAULT_TENANT_ID,
    courseId: 'e0000000-0000-0000-0000-000000000001',
    studentId: 's-66020334',
    studentCode: '66020334',
    studentName: 'นางสาวพิชญ์นภัส แก้วมณี',
    courseCode: '000101',
    courseName: 'พระไตรปิฎกศึกษา (Tipitaka Studies)',
    attendanceScore: 100.0,
    status: 'ENROLLED',
    presentCount: 16,
    lateCount: 0,
    leaveCount: 0,
    absentCount: 0,
    attendancePercent: 100.0,
    isEligible: true,
  },
  {
    id: 'enr-05',
    tenantId: DEFAULT_TENANT_ID,
    courseId: 'e0000000-0000-0000-0000-000000000001',
    studentId: 's-65010301',
    studentCode: '65010301',
    studentName: 'พระปลัดสมบูรณ์ วรธมฺโม',
    courseCode: '000101',
    courseName: 'พระไตรปิฎกศึกษา (Tipitaka Studies)',
    attendanceScore: 81.3,
    status: 'ENROLLED',
    presentCount: 12,
    lateCount: 1,
    leaveCount: 2,
    absentCount: 1,
    attendancePercent: 81.3,
    isEligible: true,
  },
];

const INITIAL_REQUESTS: CertificateRequestDto[] = [
  {
    id: 'req-01',
    tenantId: DEFAULT_TENANT_ID,
    userId: 'b0000000-0000-0000-0000-000000000003',
    certificateTypeId: 'c0000000-0000-0000-0000-000000000001',
    certificateTypeName: 'หนังสือรับรองสภาพนิสิต (Certificate of Student Status)',
    requesterName: 'พระมหาธนพัฒน์ โชติปญฺโญ',
    studentCode: '65010214',
    status: 'APPROVED',
    note: 'ใช้ประกอบการยื่นขอหนังสือเดินทางเพื่อเข้าร่วมการประชุมพุทธศาสนานานาชาติ ณ ประเทศอินเดีย',
    issuedDocumentUrl: '/certificates/req-01',
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 3),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 2),
  },
  {
    id: 'req-02',
    tenantId: DEFAULT_TENANT_ID,
    userId: 'b0000000-0000-0000-0000-000000000003',
    certificateTypeId: 'c0000000-0000-0000-0000-000000000004',
    certificateTypeName: 'หนังสือรับรองเพื่อขอผ่อนผันการเกณฑ์ทหาร',
    requesterName: 'นายวรเมธ เจริญกิจ',
    studentCode: '66020119',
    status: 'PENDING',
    note: 'นำส่งสัสดีอำเภอเมือง จังหวัดนครปฐม',
    createdAt: new Date(Date.now() - 3600 * 1000 * 8),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 8),
  },
];

const INITIAL_BOOKINGS: MeetingBookingDto[] = [
  {
    id: 'bk-01',
    tenantId: DEFAULT_TENANT_ID,
    roomId: 'd0000000-0000-0000-0000-000000000001',
    roomName: 'ห้องประชุม 101 (Smart Board Room)',
    requesterId: 'b0000000-0000-0000-0000-000000000002',
    requesterName: 'พระครูสุตวราภิรม, ดร. (อาจารย์ประจำภาควิชา)',
    title: 'ประชุมคณะกรรมการพัฒนาหลักสูตรพุทธศาสตรบัณฑิต ๒๕๖๙',
    startTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 9),
    endTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 12),
    status: 'APPROVED',
    remark: 'ประสานงานฝ่ายเทคโนโลยีสารสนเทศเพื่อเชื่อมต่อ Smart Board และระบบบันทึกเสียง',
    createdAt: new Date(Date.now() - 3600 * 1000 * 12),
  },
];

const INITIAL_EVENTS: EventDto[] = [
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    tenantId: DEFAULT_TENANT_ID,
    title: 'โครงการอบรมและปฏิบัติธรรมวิปัสสนากรรมฐานเข้มข้น ประจำภาคการศึกษา ๒๕๖๙',
    startDate: new Date('2026-11-15T08:00:00+07:00'),
    endDate: new Date('2026-11-18T17:00:00+07:00'),
    activityHours: 24,
    meditationConfig: {
      type: 'VIPASSANA_RETREAT',
      location: 'ศูนย์ปฏิบัติธรรมสมาธิภาวนา นครนายก',
      roundsPerDay: 4,
      leaderMonk: 'พระราชภาวนาโกศล (พระอาจารย์ใหญ่ฝ่ายวิปัสสนาธุระ)',
    },
    registrationsCount: 86,
  },
];

const INITIAL_EVENT_REGISTRATIONS: EventRegistrationDto[] = [
  {
    id: 'reg-01',
    tenantId: DEFAULT_TENANT_ID,
    eventId: 'f0000000-0000-0000-0000-000000000001',
    eventTitle: 'โครงการอบรมและปฏิบัติธรรมวิปัสสนากรรมฐานเข้มข้น ประจำภาคการศึกษา ๒๕๖๙',
    participantName: 'พระมหาธนพัฒน์ โชติปญฺโญ',
    groupNumber: 1,
    groupName: 'กลุ่มเจริญสติปัญญา ๑',
    attendedAt: new Date(Date.now() - 3600 * 1000 * 24 * 5),
    dailyAttendance: { 'วันแรก': true, 'วันที่สอง': true, 'วันสุดท้าย': true },
    certCode: 'CERT-VIPASSANA-2569-001',
  },
];

class UniversityStore {
  private users: UserDto[] = [...INITIAL_USERS];
  private certificateTypes: CertificateTypeDto[] = [...INITIAL_CERTIFICATE_TYPES];
  private certificateRequests: CertificateRequestDto[] = [...INITIAL_REQUESTS];
  private meetingRooms: MeetingRoomDto[] = [...INITIAL_ROOMS];
  private meetingBookings: MeetingBookingDto[] = [...INITIAL_BOOKINGS];
  private students: StudentDto[] = [...INITIAL_STUDENTS];
  private courses: CourseDto[] = [...INITIAL_COURSES];
  private enrollments: CourseEnrollmentDto[] = [...INITIAL_ENROLLMENTS];
  private events: EventDto[] = [...INITIAL_EVENTS];
  private eventRegistrations: EventRegistrationDto[] = [...INITIAL_EVENT_REGISTRATIONS];

  // -----------------------------------------------------------
  // AUTHENTICATION & USERS
  // -----------------------------------------------------------
  getUsers() {
    return this.users;
  }

  getUserByEmail(email: string) {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  // -----------------------------------------------------------
  // CERTIFICATE TYPES & REQUESTS (with File Attachment)
  // -----------------------------------------------------------
  getCertificateTypes(tenantId: string = DEFAULT_TENANT_ID) {
    return this.certificateTypes.filter((ct) => ct.tenantId === tenantId && ct.isActive);
  }

  getCertificateRequests(tenantId: string = DEFAULT_TENANT_ID) {
    return this.certificateRequests.filter((cr) => cr.tenantId === tenantId);
  }

  getCertificateRequestById(id: string) {
    return this.certificateRequests.find((cr) => cr.id === id);
  }

  async createCertificateRequest(input: {
    tenantId?: string;
    userId?: string;
    certificateTypeId: string;
    studentCode: string;
    requesterName: string;
    note?: string;
    attachmentName?: string;
    attachmentUrl?: string;
    attachmentBase64?: string;
  }) {
    const tenantId = input.tenantId || DEFAULT_TENANT_ID;
    const certType = this.certificateTypes.find((t) => t.id === input.certificateTypeId);
    const id = `req-${Date.now()}`;

    const newRequest: CertificateRequestDto = {
      id,
      tenantId,
      userId: input.userId || 'b0000000-0000-0000-0000-000000000003',
      certificateTypeId: input.certificateTypeId,
      certificateTypeName: certType?.name || 'หนังสือรับรอง',
      requesterName: input.requesterName,
      studentCode: input.studentCode,
      status: 'PENDING',
      note: input.note || null,
      issuedDocumentUrl: `/certificates/${id}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.certificateRequests.unshift(newRequest);

    // Auto-sync row to Sheets
    try {
      await googleSheetsService.appendRow(undefined, 'Certificate_Requests', [
        newRequest.id,
        newRequest.tenantId,
        newRequest.studentCode || '',
        newRequest.requesterName || '',
        newRequest.certificateTypeName || '',
        newRequest.status,
        newRequest.note || '',
        input.attachmentName ? `Attached: ${input.attachmentName}` : 'No file',
        newRequest.createdAt.toISOString(),
      ]);
    } catch (e) {
      console.warn('[Sync:Sheets] Certificate request sync error:', e);
    }

    return newRequest;
  }

  async updateCertificateRequestStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
    reason?: string
  ) {
    const req = this.certificateRequests.find((r) => r.id === id);
    if (!req) throw new Error('ไม่พบข้อมูลคำร้องขอหนังสือรับรอง');

    req.status = status;
    req.reason = reason || null;
    req.updatedAt = new Date();

    try {
      await googleSheetsService.appendRow(undefined, 'Certificate_Requests_Updates', [
        req.id,
        req.status,
        req.reason || '',
        req.updatedAt.toISOString(),
      ]);
    } catch (e) {
      console.warn('[Sync:Sheets] Certificate update sync error:', e);
    }

    return req;
  }

  // -----------------------------------------------------------
  // MEETING ROOMS & BOOKINGS
  // -----------------------------------------------------------
  getMeetingRooms(tenantId: string = DEFAULT_TENANT_ID) {
    return this.meetingRooms.filter((r) => r.tenantId === tenantId && r.isActive);
  }

  getMeetingBookings(tenantId: string = DEFAULT_TENANT_ID) {
    return this.meetingBookings.filter((b) => b.tenantId === tenantId);
  }

  checkMeetingRoomAvailability(
    roomId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): boolean {
    const startMs = startTime.getTime();
    const endMs = endTime.getTime();

    const conflicting = this.meetingBookings.find((b) => {
      if (b.roomId !== roomId) return false;
      if (b.status === 'CANCELLED' || b.status === 'REJECTED') return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;

      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();

      return startMs < bEnd && endMs > bStart;
    });

    return !conflicting;
  }

  async createMeetingBooking(input: {
    tenantId?: string;
    roomId: string;
    requesterId?: string;
    requesterName: string;
    title: string;
    startTime: string | Date;
    endTime: string | Date;
    remark?: string;
  }) {
    const tenantId = input.tenantId || DEFAULT_TENANT_ID;
    const room = this.meetingRooms.find((r) => r.id === input.roomId);
    if (!room) throw new Error('ไม่พบข้อมูลห้องประชุม');

    const startDate = new Date(input.startTime);
    const endDate = new Date(input.endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('วันและเวลาไม่ถูกต้อง');
    }

    if (startDate >= endDate) {
      throw new Error('เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุด');
    }

    const isAvailable = this.checkMeetingRoomAvailability(input.roomId, startDate, endDate);
    if (!isAvailable) {
      throw new Error(`ห้องประชุม "${room.name}" มีการจองใช้งานซ้อนทับในช่วงวันและเวลาดังกล่าวแล้ว`);
    }

    const newBooking: MeetingBookingDto = {
      id: `bk-${Date.now()}`,
      tenantId,
      roomId: room.id,
      roomName: room.name,
      requesterId: input.requesterId || 'b0000000-0000-0000-0000-000000000002',
      requesterName: input.requesterName,
      title: input.title,
      startTime: startDate,
      endTime: endDate,
      status: 'APPROVED',
      remark: input.remark || null,
      createdAt: new Date(),
    };

    this.meetingBookings.push(newBooking);

    try {
      await googleSheetsService.appendRow(undefined, 'Meeting_Bookings_Log', [
        newBooking.id,
        newBooking.tenantId,
        newBooking.roomName || '',
        newBooking.requesterName || '',
        newBooking.title,
        newBooking.startTime.toISOString(),
        newBooking.endTime.toISOString(),
        newBooking.status,
      ]);
    } catch (e) {
      console.warn('[Sync:Sheets] Booking sync error:', e);
    }

    return newBooking;
  }

  async cancelMeetingBooking(id: string, reason?: string) {
    const booking = this.meetingBookings.find((b) => b.id === id);
    if (!booking) throw new Error('ไม่พบรายการจอง');
    booking.status = 'CANCELLED';
    booking.remark = reason ? `ยกเลิก: ${reason}` : booking.remark;
    return booking;
  }

  // -----------------------------------------------------------
  // STUDENTS DIRECTORY
  // -----------------------------------------------------------
  getStudents(tenantId: string = DEFAULT_TENANT_ID) {
    return this.students.filter((s) => s.tenantId === tenantId && s.isActive);
  }

  getStudentByCode(studentCode: string) {
    return this.students.find((s) => s.studentCode === studentCode);
  }

  async addOrUpdateStudent(student: Omit<StudentDto, 'id' | 'isActive'>) {
    const existing = this.students.find((s) => s.studentCode === student.studentCode);
    if (existing) {
      Object.assign(existing, student);
      return existing;
    }

    const newStudent: StudentDto = {
      ...student,
      id: `s-${student.studentCode}`,
      isActive: true,
    };
    this.students.push(newStudent);
    return newStudent;
  }

  async importStudentsFromRows(rows: string[][]): Promise<number> {
    let count = 0;
    for (const r of rows) {
      if (!r[0] || r[0].toLowerCase().includes('student') || r[0].toLowerCase().includes('รหัส')) {
        continue;
      }
      await this.addOrUpdateStudent({
        tenantId: DEFAULT_TENANT_ID,
        studentCode: r[0].trim(),
        title: r[1] || 'นาย',
        firstName: r[2] || 'ชื่อนิสิต',
        lastName: r[3] || 'นามสกุล',
        yearLevel: parseInt(r[4], 10) || 1,
        degree: 'ปริญญาตรี',
        faculty: r[5] || 'คณะพุทธศาสตร์',
        department: r[6] || 'ภาควิชาพระพุทธศาสนา',
        major: r[7] || 'สาขาวิชาพระพุทธศาสนา',
        studyStatus: r[8] || 'ปกติ',
        email: `${r[0].trim()}@mcu.ac.th`,
        phoneNumber: '081-000-0000',
      });
      count++;
    }
    return count;
  }

  getStudentsExportRows(): string[][] {
    const headers = [
      'student_code',
      'title',
      'first_name',
      'last_name',
      'year_level',
      'degree',
      'faculty',
      'department',
      'major',
      'study_status',
      'email',
      'phone_number',
    ];

    const data = this.students.map((s) => [
      s.studentCode,
      s.title || '',
      s.firstName,
      s.lastName,
      String(s.yearLevel),
      s.degree || 'ปริญญาตรี',
      s.faculty || 'คณะพุทธศาสตร์',
      s.department || '',
      s.major || '',
      s.studyStatus || 'ปกติ',
      s.email || '',
      s.phoneNumber || '',
    ]);

    return [headers, ...data];
  }

  // -----------------------------------------------------------
  // COURSES & TIMETABLE
  // -----------------------------------------------------------
  getCourses(tenantId: string = DEFAULT_TENANT_ID) {
    return this.courses.filter((c) => c.tenantId === tenantId);
  }

  async addCourse(course: Omit<CourseDto, 'id'>) {
    const existing = this.courses.find((c) => c.courseCode === course.courseCode && c.section === course.section);
    if (existing) {
      throw new Error(`รหัสวิชา ${course.courseCode} ตอนเรียน ${course.section} มีอยู่ในระบบแล้ว`);
    }

    const newCourse: CourseDto = {
      ...course,
      id: `c-${Date.now()}`,
    };
    this.courses.push(newCourse);
    return newCourse;
  }

  checkCourseClash(
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    room?: string | null,
    excludeCourseId?: string
  ): { hasClash: boolean; conflictingCourse?: CourseDto } {
    if (!room) return { hasClash: false };

    const startM = this.timeToMinutes(startTime);
    const endM = this.timeToMinutes(endTime);

    const conflicting = this.courses.find((c) => {
      if (excludeCourseId && c.id === excludeCourseId) return false;
      if (c.dayOfWeek !== dayOfWeek) return false;
      if (!c.room || c.room.toLowerCase() !== room.toLowerCase()) return false;
      if (!c.startTime || !c.endTime) return false;

      const cStart = this.timeToMinutes(c.startTime);
      const cEnd = this.timeToMinutes(c.endTime);

      return startM < cEnd && endM > cStart;
    });

    if (conflicting) {
      return { hasClash: true, conflictingCourse: conflicting };
    }
    return { hasClash: false };
  }

  // -----------------------------------------------------------
  // ATTENDANCE & 80% EXAM ELIGIBILITY
  // -----------------------------------------------------------
  getEnrollments(courseId?: string) {
    if (courseId) {
      return this.enrollments.filter((e) => e.courseId === courseId);
    }
    return this.enrollments;
  }

  async recordAttendance(input: {
    enrollmentId: string;
    status: 'PRESENT' | 'LATE' | 'LEAVE' | 'ABSENT';
  }) {
    const enr = this.enrollments.find((e) => e.id === input.enrollmentId);
    if (!enr) throw new Error('ไม่พบข้อมูลการลงทะเบียนเรียน');

    const course = this.courses.find((c) => c.id === enr.courseId);
    const targetSessions = course?.targetSessions || 16;
    const lateCountsAsFull = course?.calculationRules?.lateCountsAsFull ?? true;
    const minPercent = course?.calculationRules?.minPercent ?? 80.0;

    enr.presentCount = enr.presentCount || 0;
    enr.lateCount = enr.lateCount || 0;
    enr.leaveCount = enr.leaveCount || 0;
    enr.absentCount = enr.absentCount || 0;

    if (input.status === 'PRESENT') enr.presentCount += 1;
    else if (input.status === 'LATE') enr.lateCount += 1;
    else if (input.status === 'LEAVE') enr.leaveCount += 1;
    else if (input.status === 'ABSENT') enr.absentCount += 1;

    const effectivePresent = enr.presentCount + (lateCountsAsFull ? enr.lateCount : enr.lateCount * 0.5);
    const percent = Math.min(100, Math.round((effectivePresent / targetSessions) * 1000) / 10);

    enr.attendanceScore = percent;
    enr.attendancePercent = percent;
    enr.isEligible = percent >= minPercent;

    try {
      await googleSheetsService.appendRow(undefined, 'Attendance_Records', [
        `rec-${Date.now()}`,
        enr.tenantId,
        enr.courseCode || '',
        enr.studentCode || '',
        enr.studentName || '',
        input.status,
        `${percent}%`,
        enr.isEligible ? 'ELIGIBLE' : 'INELIGIBLE',
        new Date().toISOString(),
      ]);
    } catch (e) {
      console.warn('[Sync:Sheets] Attendance sync error:', e);
    }

    return enr;
  }

  // -----------------------------------------------------------
  // EVENTS & VIPASSANA REGISTRATIONS
  // -----------------------------------------------------------
  getEvents(tenantId: string = DEFAULT_TENANT_ID) {
    return this.events.filter((e) => e.tenantId === tenantId);
  }

  getEventRegistrations(eventId?: string) {
    if (eventId) {
      return this.eventRegistrations.filter((r) => r.eventId === eventId);
    }
    return this.eventRegistrations;
  }

  async registerEvent(input: {
    tenantId?: string;
    eventId: string;
    participantName: string;
    groupNumber?: number;
    groupName?: string;
  }) {
    const tenantId = input.tenantId || DEFAULT_TENANT_ID;
    const event = this.events.find((e) => e.id === input.eventId);
    if (!event) throw new Error('ไม่พบข้อมูลกิจกรรม');

    const newReg: EventRegistrationDto = {
      id: `reg-${Date.now()}`,
      tenantId,
      eventId: event.id,
      eventTitle: event.title,
      participantName: input.participantName,
      groupNumber: input.groupNumber || 1,
      groupName: input.groupName || 'กลุ่มเจริญสติปัญญา ๑',
      attendedAt: null,
      dailyAttendance: { 'วันแรก': true, 'วันที่สอง': false, 'วันสุดท้าย': false },
      certCode: `CERT-EVENT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };

    this.eventRegistrations.push(newReg);
    event.registrationsCount = (event.registrationsCount || 0) + 1;

    try {
      await googleSheetsService.appendRow(undefined, 'Event_Registrations', [
        newReg.id,
        newReg.tenantId,
        event.title,
        newReg.participantName,
        newReg.groupNumber || 1,
        newReg.groupName || '',
        newReg.certCode || '',
        new Date().toISOString(),
      ]);
    } catch (e) {
      console.warn('[Sync:Sheets] Event registration sync error:', e);
    }

    return newReg;
  }

  async checkInEventRegistration(registrationId: string) {
    const reg = this.eventRegistrations.find((r) => r.id === registrationId);
    if (!reg) throw new Error('ไม่พบข้อมูลการลงทะเบียน');

    reg.attendedAt = new Date();
    if (reg.dailyAttendance) {
      Object.keys(reg.dailyAttendance).forEach((k) => {
        reg.dailyAttendance![k] = true;
      });
    }

    return reg;
  }

  private timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
    return h * 60 + (m || 0);
  }
}

export const universityStore = new UniversityStore();
