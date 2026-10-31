import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';
const DEFAULT_USER_ID = 'b0000000-0000-0000-0000-000000000001';

async function main() {
  console.log('Seeding Real Production Database...');

  // 1. Certificate Types
  const certType1 = await prisma.certificateType.upsert({
    where: { id: 'c0000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'c0000000-0000-0000-0000-000000000001',
      tenantId: DEFAULT_TENANT_ID,
      name: 'หนังสือรับรองการเป็นนิสิต (Certificate of Student Status)',
      description: 'รับรองสถานภาพการเป็นนิสิตปัจจุบัน สำหรับยื่นขอวีซ่า สมัครงาน หรือหน่วยงานราชการ',
      isActive: true,
    },
  });

  const certType2 = await prisma.certificateType.upsert({
    where: { id: 'c0000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'c0000000-0000-0000-0000-000000000002',
      tenantId: DEFAULT_TENANT_ID,
      name: 'หนังสือรับรองความประพฤติ (Certificate of Good Conduct)',
      description: 'รับรองความประพฤติและปฏิปทาของนิสิตบรรพชิตและคฤหัสถ์',
      isActive: true,
    },
  });

  // 2. Students
  const student1 = await prisma.student.upsert({
    where: {
      tenantId_studentCode: {
        tenantId: DEFAULT_TENANT_ID,
        studentCode: '65010214',
      },
    },
    update: {},
    create: {
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
  });

  // 3. Meeting Rooms
  const room1 = await prisma.meetingRoom.upsert({
    where: { id: 'd0000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'd0000000-0000-0000-0000-000000000001',
      tenantId: DEFAULT_TENANT_ID,
      name: 'ห้องประชุมวิทยปัญญา (Smart Board Room 501)',
      capacity: 25,
      equipment: 'Smart Interactive Screen 85", Video Conference, Wireless Microphones x4, Wi-Fi 6',
      imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
      isActive: true,
    },
  });

  // 4. Courses
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
      room: 'ห้องเรียน B-301 อาคารธรรมวิจัย',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '12:00',
      targetSessions: 16,
      calculationRules: { lateCountsAsFull: true, minPercent: 80.0 },
    },
  });

  // 5. Events
  const event1 = await prisma.event.upsert({
    where: { id: 'f0000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
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
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
