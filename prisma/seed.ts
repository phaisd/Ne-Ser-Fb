import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

async function main() {
  console.log('Seeding Real Production Database...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // -----------------------------------------------------------
  // 1. บัญชีผู้ใช้ทดสอบ 3 บทบาท
  // -----------------------------------------------------------
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@mcu.ac.th' },
    update: { passwordHash, role: 'SUPER_ADMIN' },
    create: {
      id: 'b0000000-0000-0000-0000-000000000001',
      tenantId: DEFAULT_TENANT_ID,
      email: 'admin@mcu.ac.th',
      passwordHash,
      fullName: 'พระมหาอดิศักดิ์ วรปญฺโญ (ผู้อำนวยการสำนักทะเบียน)',
      role: 'SUPER_ADMIN',
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@mcu.ac.th' },
    update: { passwordHash, role: 'TEACHER' },
    create: {
      id: 'b0000000-0000-0000-0000-000000000002',
      tenantId: DEFAULT_TENANT_ID,
      email: 'teacher@mcu.ac.th',
      passwordHash,
      fullName: 'พระครูสุตวราภิรม, ดร. (อาจารย์ประจำภาควิชา)',
      role: 'TEACHER',
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@mcu.ac.th' },
    update: { passwordHash, role: 'STUDENT' },
    create: {
      id: 'b0000000-0000-0000-0000-000000000003',
      tenantId: DEFAULT_TENANT_ID,
      email: 'student@mcu.ac.th',
      passwordHash,
      fullName: 'พระมหาธนพัฒน์ โชติปญฺโญ (นิสิตปริญญาตรี)',
      role: 'STUDENT',
    },
  });

  console.log('Users seeded: admin@mcu.ac.th, teacher@mcu.ac.th, student@mcu.ac.th (Password: Password123!)');

  // -----------------------------------------------------------
  // 2. ข้อมูลห้องประชุมตัวอย่าง 3 ห้อง
  // -----------------------------------------------------------
  const roomsData = [
    {
      id: 'd0000000-0000-0000-0000-000000000001',
      name: 'ห้องประชุม 101 (Smart Board Room)',
      capacity: 20,
      equipment: 'Smart Interactive Board 75", ไมโครโฟนไร้สาย (x2), ระบบเชื่อมต่อไร้สาย Wi-Fi 6',
      imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      name: 'ห้องประชุมสัมมนาใหญ่ (Grand Auditorium)',
      capacity: 250,
      equipment: 'Dual 4K Laser Projector, ระบบเครื่องเสียงมาตรฐานคอนเสิร์ต, Live Broadcast Streaming, แท่นบรรยายดิจิทัล',
      imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'd0000000-0000-0000-0000-000000000003',
      name: 'ห้องประชุมผู้บริหาร (Executive Boardroom)',
      capacity: 35,
      equipment: 'Surround Video System, ไมโครโฟนตั้งโต๊ะรายที่นั่ง, แท็บเล็ตควบคุมระบบแสงและเสียง, VIP Lounge',
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    },
  ];

  for (const r of roomsData) {
    await prisma.meetingRoom.upsert({
      where: { id: r.id },
      update: r,
      create: { ...r, tenantId: DEFAULT_TENANT_ID, isActive: true },
    });
  }
  console.log('3 Meeting rooms seeded.');

  // -----------------------------------------------------------
  // 3. ประเภทหนังสือรับรอง 4 รายการ
  // -----------------------------------------------------------
  const certTypes = [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      name: 'หนังสือรับรองสภาพนิสิต (Certificate of Student Status)',
      description: 'รับรองสถานภาพการเป็นนิสิตปัจจุบัน สำหรับยื่นขอวีซ่า สมัครงาน หรือติดต่อหน่วยงานราชการ',
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      name: 'หนังสือรับรองความประพฤติ (Certificate of Good Conduct)',
      description: 'รับรองความประพฤติและปฏิปทาของนิสิตบรรพชิตและคฤหัสถ์',
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      name: 'หนังสือรับรองผลการศึกษา (Official Transcript)',
      description: 'ใบรายงานผลการศึกษาตลอดหลักสูตรพร้อมเกรดเฉลี่ยสะสมและหน่วยกิต',
    },
    {
      id: 'c0000000-0000-0000-0000-000000000004',
      name: 'หนังสือรับรองเพื่อขอผ่อนผันการเกณฑ์ทหาร',
      description: 'สำหรับนิสิตคฤหัสถ์ชายในการนำส่งกองการสัสดีและที่ว่าการอำเภอ',
    },
  ];

  for (const ct of certTypes) {
    await prisma.certificateType.upsert({
      where: { id: ct.id },
      update: ct,
      create: { ...ct, tenantId: DEFAULT_TENANT_ID, isActive: true },
    });
  }
  console.log('4 Certificate types seeded.');

  // -----------------------------------------------------------
  // 4. นิสิตตัวอย่าง 10 คน (พระ, สามเณร, นาย, นางสาว)
  // -----------------------------------------------------------
  const studentsList = [
    { studentCode: '65010214', title: 'พระมหา', firstName: 'ธนพัฒน์', lastName: 'โชติปญฺโญ', yearLevel: 3, faculty: 'คณะพุทธศาสตร์', major: 'สาขาวิชาพระพุทธศาสนา' },
    { studentCode: '65010452', title: 'สามเณร', firstName: 'กมลวรรณ', lastName: 'รุ่งอรุณ', yearLevel: 3, faculty: 'คณะพุทธศาสตร์', major: 'สาขาวิชาปรัชญา' },
    { studentCode: '66020119', title: 'นาย', firstName: 'วรเมธ', lastName: 'เจริญกิจ', yearLevel: 2, faculty: 'คณะครุศาสตร์', major: 'สาขาวิชาการสอนภาษาไทย' },
    { studentCode: '66020334', title: 'นางสาว', firstName: 'พิชญ์นภัส', lastName: 'แก้วมณี', yearLevel: 2, faculty: 'คณะสังคมศาสตร์', major: 'สาขาวิชารัฐศาสตร์' },
    { studentCode: '65010301', title: 'พระปลัด', firstName: 'สมบูรณ์', lastName: 'วรธมฺโม', yearLevel: 3, faculty: 'คณะพุทธศาสตร์', major: 'สาขาวิชาพระไตรปิฎกศึกษา' },
    { studentCode: '66010402', title: 'สามเณร', firstName: 'ชินวรณ์', lastName: 'สุขเกษม', yearLevel: 2, faculty: 'คณะพุทธศาสตร์', major: 'สาขาวิชาพระพุทธศาสนา' },
    { studentCode: '67010503', title: 'พระ', firstName: 'กิตติศักดิ์', lastName: 'ปญฺญาธโร', yearLevel: 1, faculty: 'คณะพุทธศาสตร์', major: 'สาขาวิชาบาลีพุทธศาสตร์' },
    { studentCode: '66030104', title: 'นาย', firstName: 'ธีรภัทร', lastName: 'สถิตพงษ์', yearLevel: 2, faculty: 'คณะมนุษยศาสตร์', major: 'สาขาวิชาภาษาอังกฤษ' },
    { studentCode: '67030205', title: 'นางสาว', firstName: 'ศศิธร', lastName: 'พัฒนพงษ์', yearLevel: 1, faculty: 'คณะครุศาสตร์', major: 'สาขาวิชาการสอนสังคมศึกษา' },
    { studentCode: '65020106', title: 'พระครูสมุห์', firstName: 'ณรงค์ชัย', lastName: 'ชิตมาโร', yearLevel: 3, faculty: 'คณะพุทธศาสตร์', major: 'สาขาวิชาพระพุทธศาสนา' },
  ];

  for (const s of studentsList) {
    await prisma.student.upsert({
      where: {
        tenantId_studentCode: {
          tenantId: DEFAULT_TENANT_ID,
          studentCode: s.studentCode,
        },
      },
      update: s,
      create: {
        id: `s-${s.studentCode}`,
        tenantId: DEFAULT_TENANT_ID,
        studentCode: s.studentCode,
        title: s.title,
        firstName: s.firstName,
        lastName: s.lastName,
        yearLevel: s.yearLevel,
        degree: 'ปริญญาตรี',
        faculty: s.faculty,
        major: s.major,
        studyStatus: 'ปกติ',
        email: `${s.studentCode}@mcu.ac.th`,
        phoneNumber: '081-234-5678',
        isActive: true,
      },
    });
  }
  console.log('10 Sample students seeded.');

  // -----------------------------------------------------------
  // 5. รายวิชาและตารางสอนตัวอย่าง
  // -----------------------------------------------------------
  const course1 = await prisma.course.upsert({
    where: { id: 'e0000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
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
  });

  const course2 = await prisma.course.upsert({
    where: { id: 'e0000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
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
  });

  console.log('Courses seeded. Database setup completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
