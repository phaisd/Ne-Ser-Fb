import { AdmissionApplication, AdmissionStatus } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';
import { batchUpdateStudents, getStudents } from './studentService';
import { getSystemSettings } from './certificateService';

const SHEET_NAME = 'Admissions';
const LOCAL_FILE = 'admissions.json';

const DEMO_APPLICATIONS: AdmissionApplication[] = [
  {
    id: 'adm-demo-1',
    applicationCode: 'MCU-FB-2570-0001',
    academicYear: '2570',
    applicantType: 'MONK',
    nationalityType: 'THAI',
    citizenId: '1349900123456',
    nationality: 'ไทย',
    titleName: 'พระมหา',
    firstName: 'สมปอง',
    lastName: 'ธีรญาโณ (ใจดี)',
    monasticName: 'ธีรญาโณ',
    degreeLevel: 'ปริญญาตรี',
    curriculumName: 'หลักสูตรพุทธศาสตรบัณฑิต (ปริญญาตรี - พธ.บ.)',
    major: 'สาขาวิชาพระพุทธศาสนา',
    programType: 'THAI',
    studyPlan: 'ภาคปกติ (วันจันทร์ - วันพฤหัสบดี)',
    previousEducation: 'ป.ธ.3 - ป.ธ.9 (เปรียญธรรม 3-9 ประโยค)',
    gpa: '3.50',
    phone: '081-234-5678',
    email: 'sompong.demo@mcu.ac.th',
    lineId: 'sompong_mcu',
    address: 'วัดมหาธาตุยุวราชรังสฤษฎิ์ แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพมหานคร 10200',
    status: 'INTERVIEW_PASS',
    interviewDate: '20 พฤษภาคม 2570 เวลา 09.00 - 11.30 น.',
    interviewRoom: 'อาคารสมเด็จพระพุฒาจารย์ (อาคารเรียนรวม) ห้อง C301',
    interviewNote: 'ผ่านการสอบสัมภาษณ์และตรวจเอกสารครบถ้วน พร้อมยืนยันสิทธิ์ขึ้นทะเบียนนิสิตใหม่',
    assignedStudentCode: '6901201001',
    transferredToRegistry: false,
    createdAt: '2026-11-10T09:00:00.000Z',
  },
  {
    id: 'adm-demo-2',
    applicationCode: 'MCU-FB-2570-0002',
    academicYear: '2570',
    applicantType: 'LAYMAN',
    nationalityType: 'THAI',
    citizenId: '1349900987654',
    nationality: 'ไทย',
    titleName: 'นางสาว',
    firstName: 'กัลยาณี',
    lastName: 'ศรีมงคล',
    degreeLevel: 'ปริญญาตรี',
    curriculumName: 'หลักสูตรพุทธศาสตรบัณฑิต (ปริญญาตรี - พธ.บ.)',
    major: 'สาขาวิชาศาสนาและปรัชญา',
    programType: 'THAI',
    studyPlan: 'ภาคพิเศษ (วันเสาร์ - วันอาทิตย์)',
    previousEducation: 'มัธยมศึกษาตอนปลาย (ม.6) หรือเทียบเท่า',
    gpa: '3.25',
    phone: '089-876-5432',
    email: 'kalyani.demo@gmail.com',
    lineId: 'kalyani_88',
    address: '99 หมู่ 2 ต.ลำไทร อ.วังน้อย จ.พระนครศรีอยุธยา 13170',
    status: 'DOC_VERIFIED',
    interviewDate: '20 พฤษภาคม 2570 เวลา 09.00 - 11.30 น.',
    interviewRoom: 'อาคารสมเด็จพระพุฒาจารย์ (อาคารเรียนรวม) ห้อง C302',
    interviewNote: 'ตรวจสอบเอกสารเบื้องต้นผ่านแล้ว กรุณาเข้าสอบสัมภาษณ์ตามวันและเวลาที่กำหนด',
    createdAt: '2026-11-11T10:30:00.000Z',
  },
  {
    id: 'adm-demo-3',
    applicationCode: 'MCU-FB-2570-0003',
    academicYear: '2570',
    applicantType: 'MONK',
    nationalityType: 'INTERNATIONAL',
    citizenId: '1349900555555',
    passportNo: 'MA8899001',
    nationality: 'Myanmar',
    titleName: 'Ven.',
    firstName: 'Ashin Sobhana',
    lastName: 'Thera',
    monasticName: 'Sobhana',
    degreeLevel: 'ปริญญาตรี',
    curriculumName: 'หลักสูตรพุทธศาสตรบัณฑิต (หลักสูตรภาษาอังกฤษ / International Program)',
    major: 'Buddhist Studies (English Program)',
    programType: 'ENGLISH',
    studyPlan: 'ภาคปกติ (วันจันทร์ - วันพฤหัสบดี)',
    previousEducation: 'Foreign High School / Dhamma Examination Equivalent',
    gpa: '3.75',
    phone: '092-555-8899',
    email: 'sobhana.inter@mcu.ac.th',
    lineId: 'ashin_sobhana',
    address: 'International Buddhist Dormitory, MCU Wangnoi, Ayutthaya 13170',
    status: 'ENROLLED',
    interviewDate: '20 พฤษภาคม 2570 เวลา 13.00 - 15.00 น.',
    interviewRoom: 'International Program Office Room C305 / Zoom Online',
    interviewNote: 'ขึ้นทะเบียนนิสิตใหม่เรียบร้อยแล้ว สามารถสั่งพิมพ์ใบรายงานตัวและขอหนังสือรับรองวีซ่าได้',
    assignedStudentCode: '6901201002',
    enrolledAt: '2026-11-12T04:00:00.000Z',
    transferredToRegistry: false,
    createdAt: '2026-11-09T08:15:00.000Z',
  },
];

function serializeAdmissionRow(app: AdmissionApplication): string[] {
  return [
    app.id,
    app.applicationCode,
    app.academicYear || '2570',
    app.applicantType,
    app.citizenId,
    app.titleName,
    app.firstName,
    app.lastName,
    app.degreeLevel,
    app.major,
    app.programType,
    app.status,
    JSON.stringify({
      nationalityType: app.nationalityType,
      passportNo: app.passportNo,
      nationality: app.nationality,
      monasticName: app.monasticName,
      curriculumName: app.curriculumName,
      studyPlan: app.studyPlan,
      previousEducation: app.previousEducation,
      gpa: app.gpa,
      phone: app.phone,
      email: app.email,
      lineId: app.lineId,
      address: app.address,
      documentUrl: app.documentUrl,
      photoUrl: app.photoUrl,
      interviewDate: app.interviewDate,
      interviewRoom: app.interviewRoom,
      interviewNote: app.interviewNote,
      assignedStudentCode: app.assignedStudentCode,
      transferredToRegistry: app.transferredToRegistry,
      enrolledAt: app.enrolledAt,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }),
  ];
}

function parseAdmissionRow(row: any[]): AdmissionApplication | null {
  const id = String(row[0] || '').trim();
  const applicationCode = String(row[1] || '').trim();
  if (!id && !applicationCode) return null;

  let extra: Record<string, any> = {};
  if (row[12]) {
    try {
      const parsed = JSON.parse(String(row[12]));
      if (parsed && typeof parsed === 'object') extra = parsed;
    } catch {}
  }

  return {
    id: id || `adm-${applicationCode}`,
    applicationCode: applicationCode || id,
    academicYear: String(row[2] || extra.academicYear || '2570').trim(),
    applicantType: (row[3] === 'LAYMAN' ? 'LAYMAN' : 'MONK') as 'MONK' | 'LAYMAN',
    nationalityType: extra.nationalityType || 'THAI',
    citizenId: String(row[4] || '').trim(),
    passportNo: extra.passportNo || '',
    nationality: extra.nationality || 'ไทย',
    titleName: String(row[5] || '').trim(),
    firstName: String(row[6] || '').trim(),
    lastName: String(row[7] || '').trim(),
    monasticName: extra.monasticName || '',
    degreeLevel: (row[8] || 'ปริญญาตรี') as AdmissionApplication['degreeLevel'],
    curriculumName: extra.curriculumName || 'หลักสูตรพุทธศาสตรบัณฑิต (ปริญญาตรี - พธ.บ.)',
    major: String(row[9] || 'สาขาวิชาพระพุทธศาสนา').trim(),
    programType: (row[10] === 'ENGLISH' ? 'ENGLISH' : 'THAI') as 'THAI' | 'ENGLISH',
    studyPlan: extra.studyPlan || 'ภาคปกติ (วันจันทร์ - วันพฤหัสบดี)',
    previousEducation: extra.previousEducation || 'มัธยมศึกษาตอนปลาย (ม.6) หรือเทียบเท่า',
    gpa: extra.gpa || '',
    phone: extra.phone || '',
    email: extra.email || '',
    lineId: extra.lineId || '',
    address: extra.address || '',
    documentUrl: extra.documentUrl || '',
    photoUrl: extra.photoUrl || '',
    status: (row[11] || 'SUBMITTED') as AdmissionStatus,
    interviewDate: extra.interviewDate || '',
    interviewRoom: extra.interviewRoom || '',
    interviewNote: extra.interviewNote || '',
    assignedStudentCode: extra.assignedStudentCode || '',
    transferredToRegistry: Boolean(extra.transferredToRegistry),
    enrolledAt: extra.enrolledAt || '',
    createdAt: extra.createdAt || new Date().toISOString(),
    updatedAt: extra.updatedAt || '',
  };
}

export async function getAdmissionApplications(): Promise<AdmissionApplication[]> {
  let localList = readLocalJson<AdmissionApplication[]>(LOCAL_FILE, []);
  if (localList.length === 0) {
    localList = [...DEMO_APPLICATIONS];
    writeLocalJson(LOCAL_FILE, localList);
  }

  const map = new Map<string, AdmissionApplication>();
  localList.forEach((item) => map.set(item.id, item));

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues(`${SHEET_NAME}!A2:M`);
      if (rows && rows.length > 0) {
        rows.forEach((r) => {
          const parsed = parseAdmissionRow(r);
          if (parsed) {
            map.set(parsed.id, parsed);
          }
        });
      }
    } catch {
      // Sheet may not exist yet
    }
  }

  // Ensure demo test records are always present if not explicitly removed
  DEMO_APPLICATIONS.forEach((demo) => {
    if (!map.has(demo.id)) {
      map.set(demo.id, demo);
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );
}

export async function createAdmissionApplication(
  data: Partial<AdmissionApplication>
): Promise<AdmissionApplication> {
  const all = await getAdmissionApplications();
  const settings = await getSystemSettings();
  const academicYear = String(data.academicYear || settings.admissionAcademicYear || '2570').trim();

  // Check if citizenId or passportNo already applied in the same academic year
  const cleanCitizen = String(data.citizenId || data.passportNo || '').replace(/[\s-]/g, '').trim();
  const existing = all.find(
    (a) =>
      a.academicYear === academicYear &&
      a.citizenId.replace(/[\s-]/g, '').toLowerCase() === cleanCitizen.toLowerCase() &&
      a.status !== 'REJECTED'
  );
  if (existing) {
    return existing;
  }

  const nextNum = all.length + 1;
  const applicationCode =
    data.applicationCode || `MCU-FB-${academicYear}-${String(nextNum).padStart(4, '0')}`;
  const id = data.id || `adm-${Date.now().toString(36)}`;

  const newApp: AdmissionApplication = {
    id,
    applicationCode,
    academicYear,
    applicantType: data.applicantType === 'LAYMAN' ? 'LAYMAN' : 'MONK',
    nationalityType: data.nationalityType === 'INTERNATIONAL' ? 'INTERNATIONAL' : 'THAI',
    citizenId: cleanCitizen,
    passportNo: data.passportNo || (data.nationalityType === 'INTERNATIONAL' ? cleanCitizen : ''),
    nationality: data.nationality || (data.nationalityType === 'INTERNATIONAL' ? 'International' : 'ไทย'),
    titleName: (data.titleName || '').trim(),
    firstName: (data.firstName || '').trim(),
    lastName: (data.lastName || '').trim(),
    monasticName: (data.monasticName || '').trim(),
    degreeLevel: data.degreeLevel || 'ปริญญาตรี',
    curriculumName:
      data.curriculumName || 'หลักสูตรพุทธศาสตรบัณฑิต (ปริญญาตรี - พธ.บ.)',
    major: (data.major || 'สาขาวิชาพระพุทธศาสนา').trim(),
    programType: data.programType === 'ENGLISH' ? 'ENGLISH' : 'THAI',
    studyPlan: data.studyPlan || 'ภาคปกติ (วันจันทร์ - วันพฤหัสบดี)',
    previousEducation:
      data.previousEducation || 'มัธยมศึกษาตอนปลาย (ม.6) หรือเทียบเท่า',
    gpa: data.gpa || '',
    phone: (data.phone || '').trim(),
    email: (data.email || '').trim(),
    lineId: (data.lineId || '').trim(),
    address: (data.address || '').trim(),
    documentUrl: data.documentUrl || '',
    photoUrl: data.photoUrl || '',
    status: 'SUBMITTED',
    interviewDate:
      data.interviewDate ||
      settings.admissionDefaultInterviewDate ||
      '20 พฤษภาคม 2570 เวลา 09.00 - 12.00 น.',
    interviewRoom:
      data.interviewRoom ||
      settings.admissionDefaultInterviewRoom ||
      'อาคารสมเด็จพระพุฒาจารย์ (อาคารเรียนรวม) คณะพุทธศาสตร์ มจร วังน้อย',
    interviewNote: 'ได้รับใบสมัครเรียบร้อยแล้ว อยู่ระหว่างเจ้าหน้าที่ตรวจสอบเอกสารเบื้องต้น',
    assignedStudentCode: '',
    transferredToRegistry: false,
    createdAt: new Date().toISOString(),
  };

  const localList = readLocalJson<AdmissionApplication[]>(LOCAL_FILE, DEMO_APPLICATIONS);
  localList.unshift(newApp);
  writeLocalJson(LOCAL_FILE, localList);

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await gClient.ensureSheetsExist([SHEET_NAME]);
      const headerCheck = await gClient.getValues(`${SHEET_NAME}!A1:M1`);
      if (!headerCheck || headerCheck.length === 0) {
        await gClient.updateValues(`${SHEET_NAME}!A1:M1`, [[
          'ID',
          'ApplicationCode',
          'AcademicYear',
          'ApplicantType',
          'CitizenOrPassportId',
          'TitleName',
          'FirstName',
          'LastName',
          'DegreeLevel',
          'Major',
          'ProgramType',
          'Status',
          'ExtraJSON',
        ]]);
      }
      await gClient.appendValues(`${SHEET_NAME}!A:M`, [serializeAdmissionRow(newApp)]);
    } catch (err) {
      console.warn('Google Sheets append admission failed:', err);
    }
  }

  return newApp;
}

export async function updateAdmissionApplication(
  idOrCode: string,
  updates: Partial<AdmissionApplication>
): Promise<AdmissionApplication | null> {
  const cleanKey = String(idOrCode || '').trim().toLowerCase();
  if (!cleanKey) return null;

  const all = await getAdmissionApplications();
  const target = all.find(
    (a) =>
      a.id.toLowerCase() === cleanKey ||
      a.applicationCode.toLowerCase() === cleanKey ||
      a.citizenId.toLowerCase() === cleanKey
  );
  if (!target) return null;

  const updated: AdmissionApplication = {
    ...target,
    ...updates,
    id: target.id,
    applicationCode: target.applicationCode,
    updatedAt: new Date().toISOString(),
  };

  const localList = readLocalJson<AdmissionApplication[]>(LOCAL_FILE, DEMO_APPLICATIONS);
  const lIdx = localList.findIndex((a) => a.id === target.id);
  if (lIdx !== -1) {
    localList[lIdx] = updated;
  } else {
    localList.unshift(updated);
  }
  writeLocalJson(LOCAL_FILE, localList);

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await gClient.ensureSheetsExist([SHEET_NAME]);
      const rows = await gClient.getValues(`${SHEET_NAME}!A2:M`);
      const sIdx = rows ? rows.findIndex((r) => String(r[0] || '').trim() === target.id) : -1;
      if (sIdx !== -1) {
        const rowNum = sIdx + 2;
        await gClient.updateValues(`${SHEET_NAME}!A${rowNum}:M${rowNum}`, [
          serializeAdmissionRow(updated),
        ]);
      } else {
        await gClient.appendValues(`${SHEET_NAME}!A:M`, [serializeAdmissionRow(updated)]);
      }
    } catch (err) {
      console.warn('Google Sheets update admission failed:', err);
    }
  }

  return updated;
}

export async function confirmAdmissionEnrollment(
  query: string
): Promise<{ success: boolean; application?: AdmissionApplication; error?: string }> {
  const clean = String(query || '').replace(/[\s-]/g, '').trim().toLowerCase();
  if (!clean) {
    return { success: false, error: 'กรุณากรอกเลขบัตรประชาชน / พาสปอร์ต หรือรหัสใบสมัคร' };
  }

  const all = await getAdmissionApplications();
  const matched = all.find(
    (a) =>
      a.citizenId.replace(/[\s-]/g, '').toLowerCase() === clean ||
      (a.passportNo && a.passportNo.replace(/[\s-]/g, '').toLowerCase() === clean) ||
      a.applicationCode.replace(/[\s-]/g, '').toLowerCase() === clean ||
      a.id.toLowerCase() === clean
  );

  if (!matched) {
    return {
      success: false,
      error: 'ไม่พบข้อมูลผู้สมัครในระบบ กรุณาตรวจสอบเลขบัตรประชาชน/พาสปอร์ต หรือรหัสใบสมัครอีกครั้ง',
    };
  }

  if (matched.status === 'ENROLLED') {
    return { success: true, application: matched };
  }

  if (matched.status !== 'INTERVIEW_PASS') {
    return {
      success: false,
      application: matched,
      error:
        matched.status === 'REJECTED'
          ? 'ใบสมัครนี้ไม่ผ่านเกณฑ์การคัดเลือก'
          : 'ใบสมัครของท่านยังอยู่ระหว่างตรวจสอบเอกสารหรือรอผลสอบสัมภาษณ์ จึงยังไม่สามารถยืนยันสิทธิ์ขึ้นทะเบียนนิสิตได้',
    };
  }

  // Generate student code if not assigned yet (e.g. 6901201xxx or 7001201xxx)
  let studentCode = matched.assignedStudentCode;
  if (!studentCode) {
    const yrPrefix = (matched.academicYear || '2570').slice(-2);
    const enrolledCount = all.filter((a) => a.assignedStudentCode).length + 1;
    studentCode = `${yrPrefix}01201${String(enrolledCount).padStart(3, '0')}`;
  }

  const updated = await updateAdmissionApplication(matched.id, {
    status: 'ENROLLED',
    assignedStudentCode: studentCode,
    enrolledAt: new Date().toISOString(),
    interviewNote: 'ยืนยันสิทธิ์และขึ้นทะเบียนนิสิตใหม่ออนไลน์เรียบร้อยแล้ว',
  });

  return {
    success: true,
    application: updated || matched,
  };
}

export async function transferAdmissionToStudentRegistry(
  idOrCode: string
): Promise<{ success: boolean; studentCode?: string; error?: string }> {
  const all = await getAdmissionApplications();
  const clean = String(idOrCode || '').trim().toLowerCase();
  const app = all.find(
    (a) => a.id.toLowerCase() === clean || a.applicationCode.toLowerCase() === clean
  );
  if (!app) {
    return { success: false, error: 'ไม่พบข้อมูลใบสมัครที่ต้องการโอนย้าย' };
  }

  let studentCode = (app.assignedStudentCode || '').trim();
  if (!studentCode) {
    const yrPrefix = (app.academicYear || '2570').slice(-2);
    const students = await getStudents();
    studentCode = `${yrPrefix}01201${String(students.length + 1).padStart(3, '0')}`;
  }

  const fullName = `${app.titleName || ''} ${app.firstName} ${app.lastName}`.replace(/\s+/g, ' ').trim();

  await batchUpdateStudents(
    [
      {
        studentCode,
        title: app.titleName,
        firstName: app.firstName,
        lastName: app.lastName,
        fullName,
        gender: app.applicantType === 'MONK' ? 'บรรพชิต' : 'คฤหัสถ์',
        degree: app.degreeLevel || 'ปริญญาตรี',
        faculty: 'คณะพุทธศาสตร์',
        major: app.major || 'สาขาวิชาพระพุทธศาสนา',
        curriculumName: app.curriculumName,
        yearLevel: 1,
        programType: app.programType || 'THAI',
        studyStatus: 'กำลังศึกษา',
        passportNo: app.nationalityType === 'INTERNATIONAL' ? app.passportNo || app.citizenId : '',
        nationality: app.nationality || (app.nationalityType === 'INTERNATIONAL' ? 'International' : 'ไทย'),
        phoneNumber: app.phone,
        email: app.email,
        address: app.address,
        gpa: app.gpa,
        remarks: `ขึ้นทะเบียนจากระบบรับสมัครนิสิตใหม่ (${app.applicationCode})`,
      },
    ],
    'UPSERT'
  );

  await updateAdmissionApplication(app.id, {
    status: 'ENROLLED',
    assignedStudentCode: studentCode,
    transferredToRegistry: true,
    enrolledAt: app.enrolledAt || new Date().toISOString(),
  });

  return { success: true, studentCode };
}

export async function deleteAdmissionApplication(idOrCode: string): Promise<boolean> {
  const clean = String(idOrCode || '').trim().toLowerCase();
  const localList = readLocalJson<AdmissionApplication[]>(LOCAL_FILE, DEMO_APPLICATIONS);
  const target = localList.find(
    (a) => a.id.toLowerCase() === clean || a.applicationCode.toLowerCase() === clean
  );
  const filtered = localList.filter(
    (a) => a.id.toLowerCase() !== clean && a.applicationCode.toLowerCase() !== clean
  );
  writeLocalJson(LOCAL_FILE, filtered);

  const gClient = getSheetsClient();
  if (gClient && target) {
    try {
      const rows = await gClient.getValues(`${SHEET_NAME}!A2:M`);
      if (rows) {
        const sIdx = rows.findIndex((r) => String(r[0] || '').trim() === target.id);
        if (sIdx !== -1) {
          await gClient.deleteRows(SHEET_NAME, [sIdx + 1]);
        }
      }
    } catch {}
  }

  return true;
}
