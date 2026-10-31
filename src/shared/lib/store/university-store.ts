import { googleSheetsService } from '../google-sheets/service';
import {
  CertificateTypeDto,
  CertificateRequestDto,
  MeetingRoomDto,
  MeetingBookingDto,
  StudentDto,
  CourseDto,
  CourseEnrollmentDto,
  AttendanceSessionDto,
  AttendanceRecordDto,
  EventDto,
  EventRegistrationDto,
} from '@/shared/types';

// ==========================================
// PRODUCTION SEED DATA (มมร./มจร. Buddhist University Context)
// ==========================================

const DEFAULT_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

const INITIAL_CERTIFICATE_TYPES: CertificateTypeDto[] = [
  {
    id: 'ct-01',
    tenantId: DEFAULT_TENANT_ID,
    name: 'หนังสือรับรองการเป็นนิสิต (Certificate of Student Status)',
    description: 'รับรองสถานภาพการเป็นนิสิตปัจจุบัน สำหรับยื่นขอวีซ่า สมัครงาน หรือหน่วยงานราชการ',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'ct-02',
    tenantId: DEFAULT_TENANT_ID,
    name: 'หนังสือรับรองความประพฤติ (Certificate of Good Conduct)',
    description: 'รับรองความประพฤติและปฏิปทาของนิสิตบรรพชิตและคฤหัสถ์',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'ct-03',
    tenantId: DEFAULT_TENANT_ID,
    name: 'หนังสือรับรองเพื่อยื่นขอผ่อนผันการเกณฑ์ทหาร',
    description: 'สำหรับนิสิตคฤหัสถ์ชายในการนำส่งกองการสัสดีและอำเภอ',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'ct-04',
    tenantId: DEFAULT_TENANT_ID,
    name: 'หนังสือรับรองผลการศึกษาฉบับสมบูรณ์ (Official Transcript)',
    description: 'ใบรายงานผลการศึกษาตลอดหลักสูตร พร้อมเกรดเฉลี่ยสะสม',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'ct-05',
    tenantId: DEFAULT_TENANT_ID,
    name: 'หนังสือรับรองเพื่อขอรับทุนการศึกษา / กองทุน กยศ.',
    description: 'เอกสารแสดงข้อมูลผลการเรียนและความประพฤติเพื่อพิจารณาจัดสรรทุน',
    isActive: true,
    createdAt: new Date(),
  },
];

const INITIAL_STUDENTS: StudentDto[] = [
  {
    id: 's-01',
    tenantId: DEFAULT_TENANT_ID,
    studentCode: '65010214',
    title: 'พระมหา',
    firstName: 'ธนพัฒน์',
    lastName: 'โชติปญฺโญ (สิทธิโชค)',
    yearLevel: 3,
    degree: 'ปริญญาตรี',
    faculty: 'คณะพุทธศาสตร์',
    department: 'ภาควิชาพระพุทธศาสนา',
    major: 'สาขาวิชาพระพุทธศาสนา',
    studyStatus: 'ปกติ',
    email: '65010214@student.univ.ac.th',
    phoneNumber: '089-123-4567',
    isActive: true,
  },
  {
    id: 's-02',
    tenantId: DEFAULT_TENANT_ID,
    studentCode: '65010452',
    title: 'สามเณร',
    firstName: 'กมลวรรณ',
    lastName: 'รุ่งอรุณ',
    yearLevel: 3,
    degree: 'ปริญญาตรี',
    faculty: 'คณะพุทธศาสตร์',
    department: 'ภาควิชาปรัชญาและศาสนา',
    major: 'สาขาวิชาปรัชญา',
    studyStatus: 'ปกติ',
    email: '65010452@student.univ.ac.th',
    phoneNumber: '081-456-7890',
    isActive: true,
  },
  {
    id: 's-03',
    tenantId: DEFAULT_TENANT_ID,
    studentCode: '66020119',
    title: 'นาย',
    firstName: 'วรเมธ',
    lastName: 'เจริญกิจ',
    yearLevel: 2,
    degree: 'ปริญญาตรี',
    faculty: 'คณะครุศาสตร์',
    department: 'ภาควิชาหลักสูตรและการสอน',
    major: 'สาขาวิชาการสอนภาษาไทย',
    studyStatus: 'ปกติ',
    email: '66020119@student.univ.ac.th',
    phoneNumber: '082-987-6543',
    isActive: true,
  },
  {
    id: 's-04',
    tenantId: DEFAULT_TENANT_ID,
    studentCode: '66020334',
    title: 'นางสาว',
    firstName: 'พิชญ์นภัส',
    lastName: 'แก้วมณี',
    yearLevel: 2,
    degree: 'ปริญญาตรี',
    faculty: 'คณะสังคมศาสตร์',
    department: 'ภาควิชารัฐศาสตร์และเศรษฐศาสตร์',
    major: 'สาขาวิชารัฐศาสตร์และการปกครอง',
    studyStatus: 'ปกติ',
    email: '66020334@student.univ.ac.th',
    phoneNumber: '095-234-5678',
    isActive: true,
  },
];

const INITIAL_ROOMS: MeetingRoomDto[] = [
  {
    id: 'r-01',
    tenantId: DEFAULT_TENANT_ID,
    name: 'ห้องประชุมวิทยปัญญา (Smart Board Room 501)',
    capacity: 25,
    equipment: 'Smart Interactive Screen 85", High-end Video Conference, Wireless Microphones x4, Wi-Fi 6',
    imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },
  {
    id: 'r-02',
    tenantId: DEFAULT_TENANT_ID,
    name: 'หอประชุมพุทธโสธร (Grand Auditorium 100)',
    capacity: 300,
    equipment: 'Dual 4K Laser Projectors, ระบบเครื่องเสียงมาตรฐานคอนเสิร์ต, แท่นบรรยายดิจิทัล, Live Broadcast Suite',
    imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },
  {
    id: 'r-03',
    tenantId: DEFAULT_TENANT_ID,
    name: 'ห้องประชุมสภาอาจารย์ อาคาร ๑๐๐ ปีสมเด็จพระสังฆราช',
    capacity: 40,
    equipment: 'Surround Sound Video System, ไมโครโฟนตั้งโต๊ะรายบุคคล, จอแสดงผลระบบสัมผัส',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },
  {
    id: 'r-04',
    tenantId: DEFAULT_TENANT_ID,
    name: 'ศาลาปฏิบัติธรรมและสัมมนาธรรมสากล',
    capacity: 120,
    equipment: 'เครื่องขยายเสียงไร้สาย, อุปกรณ์เจริญจิตตภาวนา, เบาะรองนั่งกรรมฐาน, ระบบควบคุมแสงสว่างสมาธิ',
    imageUrl: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=800&q=80',
    isActive: true,
  },
];

const INITIAL_COURSES: CourseDto[] = [
  {
    id: 'c-01',
    tenantId: DEFAULT_TENANT_ID,
    courseCode: '000101',
    courseName: 'พระไตรปิฎกศึกษา (Tipitaka Studies)',
    courseNameEn: 'Studies in Tipitaka and Buddhist Canons',
    credits: 3,
    section: '1',
    term: '1/2569',
    academicYear: '2569',
    semester: 1,
    room: 'ห้องเรียน B-301 อาคารธรรมวิจัย',
    dayOfWeek: 1, // จันทร์
    startTime: '09:00',
    endTime: '12:00',
    targetSessions: 16,
    calculationRules: { lateCountsAsFull: true, minPercent: 80.0 },
  },
  {
    id: 'c-02',
    tenantId: DEFAULT_TENANT_ID,
    courseCode: '000202',
    courseName: 'ธรรมวิภาคและพุทธธรรมขั้นสูง',
    courseNameEn: 'Advanced Dhamma Analysis & Buddhist Philosophy',
    credits: 3,
    section: '1',
    term: '1/2569',
    academicYear: '2569',
    semester: 1,
    room: 'ห้องบรรยาย 402 อาคารเรียนรวม',
    dayOfWeek: 2, // อังคาร
    startTime: '13:00',
    endTime: '16:00',
    targetSessions: 16,
    calculationRules: { lateCountsAsFull: true, minPercent: 80.0 },
  },
  {
    id: 'c-03',
    tenantId: DEFAULT_TENANT_ID,
    courseCode: '000305',
    courseName: 'พุทธปรัชญาเปรียบเทียบและปรัชญาอินเดีย',
    courseNameEn: 'Comparative Buddhist and Indian Philosophy',
    credits: 3,
    section: '1',
    term: '1/2569',
    academicYear: '2569',
    semester: 1,
    room: 'ห้องสัมมนา 204 อาคารพุทธศาสตร์',
    dayOfWeek: 3, // พุธ
    startTime: '09:00',
    endTime: '12:00',
    targetSessions: 16,
    calculationRules: { lateCountsAsFull: false, minPercent: 80.0 },
  },
  {
    id: 'c-04',
    tenantId: DEFAULT_TENANT_ID,
    courseCode: '000410',
    courseName: 'การปฏิบัติวิปัสสนากรรมฐาน (Vipassana Meditation Practice)',
    courseNameEn: 'Practical Vipassana Meditation',
    credits: 3,
    section: '1',
    term: '1/2569',
    academicYear: '2569',
    semester: 1,
    room: 'ศาลาปฏิบัติธรรมสมาธิภาวนา',
    dayOfWeek: 5, // ศุกร์
    startTime: '08:30',
    endTime: '11:30',
    targetSessions: 16,
    calculationRules: { lateCountsAsFull: true, minPercent: 80.0 },
  },
];

const INITIAL_ENROLLMENTS: CourseEnrollmentDto[] = [
  {
    id: 'enr-01',
    tenantId: DEFAULT_TENANT_ID,
    courseId: 'c-01',
    studentId: 's-01',
    studentCode: '65010214',
    studentName: 'พระมหาธนพัฒน์ โชติปญฺโญ (สิทธิโชค)',
    courseCode: '000101',
    courseName: 'พระไตรปิฎกศึกษา (Tipitaka Studies)',
    attendanceScore: 93.75,
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
    courseId: 'c-01',
    studentId: 's-02',
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
    courseId: 'c-01',
    studentId: 's-03',
    studentCode: '66020119',
    studentName: 'นายวรเมธ เจริญกิจ',
    courseCode: '000101',
    courseName: 'พระไตรปิฎกศึกษา (Tipitaka Studies)',
    attendanceScore: 68.75,
    status: 'ENROLLED',
    presentCount: 10,
    lateCount: 1,
    leaveCount: 1,
    absentCount: 4,
    attendancePercent: 68.8,
    isEligible: false, // Ineligible (< 80%)
  },
];

const INITIAL_REQUESTS: CertificateRequestDto[] = [
  {
    id: 'req-01',
    tenantId: DEFAULT_TENANT_ID,
    userId: 'b0000000-0000-0000-0000-000000000001',
    certificateTypeId: 'ct-01',
    certificateTypeName: 'หนังสือรับรองการเป็นนิสิต (Certificate of Student Status)',
    requesterName: 'พระมหาธนพัฒน์ โชติปญฺโญ (สิทธิโชค)',
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
    userId: 'b0000000-0000-0000-0000-000000000002',
    certificateTypeId: 'ct-05',
    certificateTypeName: 'หนังสือรับรองเพื่อขอรับทุนการศึกษา / กองทุน กยศ.',
    requesterName: 'สามเณรกมลวรรณ รุ่งอรุณ',
    studentCode: '65010452',
    status: 'PENDING',
    note: 'ยื่นส่งหลักฐานขอรับทุนอุดหนุนการศึกษานิสิตบรรพชิต ประจำปีการศึกษา ๒๕๖๙',
    createdAt: new Date(Date.now() - 3600 * 1000 * 8),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 8),
  },
  {
    id: 'req-03',
    tenantId: DEFAULT_TENANT_ID,
    userId: 'b0000000-0000-0000-0000-000000000003',
    certificateTypeId: 'ct-04',
    certificateTypeName: 'หนังสือรับรองผลการศึกษาฉบับสมบูรณ์ (Official Transcript)',
    requesterName: 'นายวรเมธ เจริญกิจ',
    studentCode: '66020119',
    status: 'PENDING',
    note: 'ใช้ยื่นสมัครสอบคัดเลือกทุนพัฒนาอาจารย์ประจำสถาบัน',
    createdAt: new Date(Date.now() - 3600 * 1000 * 2),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 2),
  },
];

const INITIAL_BOOKINGS: MeetingBookingDto[] = [
  {
    id: 'bk-01',
    tenantId: DEFAULT_TENANT_ID,
    roomId: 'r-01',
    roomName: 'ห้องประชุมวิทยปัญญา (Smart Board Room 501)',
    requesterId: 'staff-01',
    requesterName: 'พระครูสุตวราภิรม, ดร. (หัวหน้าภาควิชาพระพุทธศาสนา)',
    title: 'ประชุมคณะกรรมการพัฒนาหลักสูตรพุทธศาสตรบัณฑิต ปรับปรุง พ.ศ. ๒๕๖๙',
    startTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 9),
    endTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 12),
    status: 'APPROVED',
    remark: 'ประสานงานฝ่ายเทคโนโลยีสารสนเทศเพื่อเปิดระบบ Video Conference สากล',
    createdAt: new Date(Date.now() - 3600 * 1000 * 12),
  },
  {
    id: 'bk-02',
    tenantId: DEFAULT_TENANT_ID,
    roomId: 'r-04',
    roomName: 'ศาลาปฏิบัติธรรมและสัมมนาธรรมสากล',
    requesterId: 'student-01',
    requesterName: 'สโมสรนิสิตคณะพุทธศาสตร์',
    title: 'เตรียมการฝึกซ้อมการนำนั่งสมาธิและวิปัสสนากรรมฐานสำหรับนิสิตใหม่',
    startTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 13),
    endTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 16),
    status: 'APPROVED',
    remark: 'ขอใช้เครื่องเสียงไร้สายและเบาะรองนั่งกรรมฐานจำนวน ๕๐ ชุด',
    createdAt: new Date(Date.now() - 3600 * 1000 * 5),
  },
];

const INITIAL_EVENTS: EventDto[] = [
  {
    id: 'ev-01',
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
      dietaryRules: 'ปานะบ่าย และมังสวิรัติเพื่อความสัปปายะ',
    },
    registrationsCount: 86,
  },
  {
    id: 'ev-02',
    tenantId: DEFAULT_TENANT_ID,
    title: 'สัมมนาวิชาการระดับชาติ: พุทธนวัตกรรมกับสังคมดิจิทัลร่วมสมัย (Buddhism & AI Era)',
    startDate: new Date('2026-11-25T09:00:00+07:00'),
    endDate: new Date('2026-11-25T16:30:00+07:00'),
    activityHours: 6,
    meditationConfig: null,
    registrationsCount: 142,
  },
  {
    id: 'ev-03',
    tenantId: DEFAULT_TENANT_ID,
    title: 'โครงการธรรมสัญจรจิตอาสาพัฒนาโรงเรียนชุมชนชนบทและเผยแผ่พระธรรม',
    startDate: new Date('2026-12-05T07:30:00+07:00'),
    endDate: new Date('2026-12-06T18:00:00+07:00'),
    activityHours: 16,
    meditationConfig: null,
    registrationsCount: 50,
  },
];

const INITIAL_EVENT_REGISTRATIONS: EventRegistrationDto[] = [
  {
    id: 'reg-01',
    tenantId: DEFAULT_TENANT_ID,
    eventId: 'ev-01',
    eventTitle: 'โครงการอบรมและปฏิบัติธรรมวิปัสสนากรรมฐานเข้มข้น ประจำภาคการศึกษา ๒๕๖๙',
    participantName: 'พระมหาธนพัฒน์ โชติปญฺโญ (สิทธิโชค)',
    groupNumber: 1,
    groupName: 'กลุ่มเจริญสติปัญญา ๑',
    attendedAt: new Date(Date.now() - 3600 * 1000 * 24 * 5),
    dailyAttendance: { 'Day 1': true, 'Day 2': true, 'Day 3': true },
    certCode: 'CERT-VIPASSANA-2569-001',
  },
  {
    id: 'reg-02',
    tenantId: DEFAULT_TENANT_ID,
    eventId: 'ev-01',
    eventTitle: 'โครงการอบรมและปฏิบัติธรรมวิปัสสนากรรมฐานเข้มข้น ประจำภาคการศึกษา ๒๕๖๙',
    participantName: 'สามเณรกมลวรรณ รุ่งอรุณ',
    groupNumber: 1,
    groupName: 'กลุ่มเจริญสติปัญญา ๑',
    attendedAt: new Date(Date.now() - 3600 * 1000 * 24 * 5),
    dailyAttendance: { 'Day 1': true, 'Day 2': true, 'Day 3': true },
    certCode: 'CERT-VIPASSANA-2569-002',
  },
];

// ==========================================
// UNIFIED STATE STORE CLASS (Matching Real Schema)
// ==========================================

class UniversityStore {
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
  // 1. CERTIFICATE TYPES & REQUESTS
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
  }) {
    const tenantId = input.tenantId || DEFAULT_TENANT_ID;
    const certType = this.certificateTypes.find((t) => t.id === input.certificateTypeId);
    const id = `req-${Date.now()}`;

    const newRequest: CertificateRequestDto = {
      id,
      tenantId,
      userId: input.userId || 'b0000000-0000-0000-0000-000000000001',
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

    // [แนวทางที่ 1: Hybrid Auto-Sync] ส่งแถวข้อมูลไปยัง Google Sheets อัตโนมัติ
    try {
      await googleSheetsService.appendRow(undefined, 'Certificate_Requests', [
        newRequest.id,
        newRequest.tenantId,
        newRequest.studentCode || '',
        newRequest.requesterName || '',
        newRequest.certificateTypeName || '',
        newRequest.status,
        newRequest.note || '',
        newRequest.createdAt.toISOString(),
      ]);
    } catch (e) {
      console.warn('[Sync:Sheets] Certificate request auto-sync error:', e);
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

    // Auto-sync update row
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
  // 2. MEETING ROOMS & BOOKINGS (Anti-Double Booking 100%)
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

      // Overlap: startA < endB AND endA > startB
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
      requesterId: input.requesterId || 'staff-01',
      requesterName: input.requesterName,
      title: input.title,
      startTime: startDate,
      endTime: endDate,
      status: 'APPROVED',
      remark: input.remark || null,
      createdAt: new Date(),
    };

    this.meetingBookings.push(newBooking);

    // Auto-sync to Sheets
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
  // 3. STUDENT DIRECTORY (Import & Export Center)
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
      id: `s-${Date.now()}-${Math.random().toString(36).substring(7)}`,
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
        degree: r[5] || 'ปริญญาตรี',
        faculty: r[6] || 'คณะพุทธศาสตร์',
        department: r[7] || 'ภาควิชาพระพุทธศาสนา',
        major: r[8] || 'สาขาวิชาพระพุทธศาสนา',
        studyStatus: r[9] || 'ปกติ',
        email: r[10] || `${r[0].trim()}@student.univ.ac.th`,
        phoneNumber: r[11] || '080-000-0000',
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
  // 4. COURSES & TIMETABLE (Clash Detection)
  // -----------------------------------------------------------
  getCourses(tenantId: string = DEFAULT_TENANT_ID) {
    return this.courses.filter((c) => c.tenantId === tenantId);
  }

  getCourseById(id: string) {
    return this.courses.find((c) => c.id === id);
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
  // 5. ENROLLMENTS, ATTENDANCE & 80% EXAM ELIGIBILITY
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

    // Calculation Rule
    const effectivePresent = enr.presentCount + (lateCountsAsFull ? enr.lateCount : enr.lateCount * 0.5);
    const percent = Math.min(100, Math.round((effectivePresent / targetSessions) * 1000) / 10);

    enr.attendanceScore = percent;
    enr.attendancePercent = percent;
    enr.isEligible = percent >= minPercent;

    // Auto-sync attendance row
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
  // 6. EVENTS & VIPASSANA MEDITATION REGISTRATIONS
  // -----------------------------------------------------------
  getEvents(tenantId: string = DEFAULT_TENANT_ID) {
    return this.events.filter((e) => e.tenantId === tenantId);
  }

  getEventById(id: string) {
    return this.events.find((e) => e.id === id);
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

    // Auto-sync to Sheets
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
