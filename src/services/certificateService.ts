import { CertificateRequest, SystemSettings, SignatoryItem } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';
import { getStudents } from './studentService';

// ----------------- CERTIFICATE TYPES -----------------

export async function getCertificateTypes(): Promise<any[]> {
  return readLocalJson<any[]>('certificate_types.json', []);
}

// ----------------- CERTIFICATE REQUESTS -----------------

export async function getCertificateRequests(): Promise<CertificateRequest[]> {
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('CertificateRequests!A2:L');
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: r[0] || '',
          createdAt: r[1] || '',
          studentCode: r[2] || '',
          fullName: r[3] || '',
          certType: r[4] || '',
          degreeLevel: r[5] || '',
          major: r[6] || '',
          requestPurpose: r[7] || '',
          status: (r[8] as any) || 'PENDING',
          docNo: r[9] || '',
          email: r[10] || '',
          phone: r[11] || '',
        }));
      }
    } catch (err) {
      console.warn('Google Sheets read error for CertRequests, falling back to local file:', err);
    }
  }

  const rawRequests = readLocalJson<any[]>('certificate_requests.json', []);
  return rawRequests.map((r) => {
    let noteObj: any = {};
    if (typeof r.note === 'string') {
      try { noteObj = JSON.parse(r.note); } catch (e) {}
    } else if (r.note && typeof r.note === 'object') {
      noteObj = r.note;
    }

    const nationality = r.nationality || noteObj.nationality || '';
    const isThai = nationality === 'Thai' || nationality === 'ไทย';

    return {
      id: r.id,
      createdAt: r.createdAt || new Date().toISOString(),
      studentCode: r.studentCode || noteObj.studentCode || '',
      fullName: r.fullName || noteObj.fullName || (r.user ? r.user.name : ''),
      certType: r.certType || r.certificateType?.name || noteObj.requestPurpose || 'หนังสือรับรอง',
      degreeLevel: r.degreeLevel || noteObj.degreeLevel || '',
      major: r.major || noteObj.major || '',
      requestPurpose: r.requestPurpose || noteObj.requestPurpose || '',
      status: r.status || 'PENDING',
      docNo: r.docNo || noteObj.docNo || '',
      email: r.email || noteObj.email || '',
      phone: r.phone || noteObj.phone || '',
      targetAudience: r.targetAudience || (isThai ? 'THAI' : 'INTERNATIONAL'),
      age: r.age || noteObj.age || '',
      gender: r.gender || noteObj.sex || '',
      nationality: nationality,
      country: r.country || noteObj.country || '',
      passportNo: r.passportNo || noteObj.passportNo || '',
      passportExpireDate: r.passportExpireDate || noteObj.passportExpireDate || '',
      visaType: r.visaType || noteObj.visaType || '',
      visaExpireDate: r.visaExpireDate || noteObj.visaExpireDate || '',
      gpa: r.gpa || noteObj.gpa || '',
      address: r.address || noteObj.addressLine || noteObj.fullAddress || '',
      subdistrict: r.subdistrict || noteObj.subdistrict || '',
      district: r.district || noteObj.district || '',
      province: r.province || noteObj.province || '',
      postalCode: r.postalCode || noteObj.postalCode || '',
      bankTargetTh: r.bankTargetTh || noteObj.bankTargetTh || '',
      bankActionTh: r.bankActionTh || noteObj.bankActionTh || '',
      issueDateTh: r.issueDateTh || noteObj.issueDateTh || '',
      issueDateEn: r.issueDateEn || noteObj.issueDateEn || '',
      docTemplate: r.docTemplate || noteObj.docTemplate || '',
      signerNameTh: r.signerNameTh || noteObj.signerNameTh || '',
      signerTitleTh: r.signerTitleTh || noteObj.signerTitleTh || '',
      signerNameEn: r.signerNameEn || noteObj.signerNameEn || '',
      signerTitleEn: r.signerTitleEn || noteObj.signerTitleEn || '',
      coordinatorNameTh: r.coordinatorNameTh || noteObj.coordinatorNameTh || '',
      coordinatorPhoneTh: r.coordinatorPhoneTh || noteObj.coordinatorPhoneTh || '',
    };
  });
}

export async function createCertificateRequest(data: Omit<CertificateRequest, 'id' | 'createdAt'>): Promise<CertificateRequest> {
  const newReq: CertificateRequest = {
    ...data,
    id: 'req-' + Date.now(),
    createdAt: new Date().toISOString(),
    status: data.status || 'PENDING',
  };

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await gClient.appendValues('CertificateRequests!A:L', [[
        newReq.id,
        newReq.createdAt,
        newReq.studentCode,
        newReq.fullName,
        newReq.certType,
        newReq.degreeLevel || '',
        newReq.major || '',
        newReq.requestPurpose || '',
        newReq.status,
        newReq.docNo || '',
        newReq.email || '',
        newReq.phone || '',
      ]]);
    } catch (err) {
      console.warn('Google Sheets append failed:', err);
    }
  }

  const localList = readLocalJson<any[]>('certificate_requests.json', []);
  localList.unshift(newReq);
  writeLocalJson('certificate_requests.json', localList);

  return newReq;
}

export async function updateCertificateRequest(id: string, updates: Partial<CertificateRequest>): Promise<CertificateRequest | null> {
  const localList = readLocalJson<any[]>('certificate_requests.json', []);
  const idx = localList.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  localList[idx] = {
    ...localList[idx],
    ...updates,
    status: updates.status || localList[idx].status,
    docNo: updates.docNo !== undefined ? updates.docNo : localList[idx].docNo,
    updatedAt: new Date().toISOString(),
  };

  writeLocalJson('certificate_requests.json', localList);
  return localList[idx];
}

// ----------------- SYSTEM SETTINGS & BRANDING -----------------

export const DEFAULT_SIGNATORIES: SignatoryItem[] = [
  {
    id: 'DEAN',
    label: '1. คณบดีคณะพุทธศาสตร์ (พระครูสุธีกิตติบัณฑิต, รศ.ดร.)',
    name: 'พระครูสุธีกิตติบัณฑิต, รศ.ดร.',
    title: 'คณบดีคณะพุทธศาสตร์',
    isDefault: true,
  },
  {
    id: 'VICE_ACADEMIC',
    label: '2. รองคณบดีฝ่ายวิชาการ (ปฏิบัติหน้าที่แทนคณบดี)',
    name: 'พระมหาหรรษา ธมฺมหาโส, ศ.ดร.',
    title: 'รองคณบดีฝ่ายวิชาการ ปฏิบัติหน้าที่แทนคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'VICE_STUDENT',
    label: '3. รองคณบดีฝ่ายกิจการนิสิต (รับรองความประพฤติ/กิจกรรม)',
    name: 'พระมหาบุญเลิศ ช่วยธานี, ศ.ดร.',
    title: 'รองคณบดีฝ่ายกิจการนิสิต คณะพุทธศาสตร์',
  },
  {
    id: 'ACTING_DEAN',
    label: '4. ผู้รักษาราชการแทนคณบดีคณะพุทธศาสตร์',
    name: '',
    title: 'รักษาราชการแทนคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'REGISTRAR',
    label: '5. ผู้อำนวยการส่วนทะเบียนและวัดผล (นายทะเบียน)',
    name: 'พระมหาสุริยัน ปญฺญาวชิโร, ผศ.ดร.',
    title: 'ผู้อำนวยการส่วนทะเบียนและวัดผล',
  },
  {
    id: 'BLANK',
    label: '6. เว้นว่างไว้สำหรับลงนามสดด้วยลายมือปากกา (Handwritten)',
    name: '',
    title: 'คณบดีคณะพุทธศาสตร์',
  },
];

export const DEFAULT_SETTINGS: SystemSettings = {
  universityNameTh: 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
  universityNameEn: 'Mahachulalongkornrajavidyalaya University',
  facultyNameTh: 'คณะพุทธศาสตร์',
  facultyNameEn: 'Faculty of Buddhism',
  logoUrl: 'https://www.mcu.ac.th/images/logo-mcu.png',
  logoEmoji: '☸️',
  signerNameTh: 'พระครูสุธีกิตติบัณฑิต, รศ.ดร.',
  signerTitleTh: 'คณบดีคณะพุทธศาสตร์',
  signerNameEn: 'Assoc. Prof. Dr. Phrakhrusutheekittibandhit',
  signerTitleEn: 'Dean of the Faculty of Buddhism',
  contactPhone: '035-248-000 ต่อ 8323',
  contactEmail: 'buddhism@mcu.ac.th',
  websiteUrl: 'https://fb.mcu.ac.th/',
  systemServiceUrl: 'https://fb-service.mcu.ac.th/',
  addressTh: 'เลขที่ 79 หมู่ 1 ถนนพหลโยธิน ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา 13170',
  addressEn: '79 Moo 1, Phahonyothin Road, Lamsai, Wangnoi, Phra Nakhon Si Ayutthaya 13170, Thailand',
  announcementText: 'ยินดีต้อนรับสู่งานบริการการศึกษาและทะเบียน คณะพุทธศาสตร์ มจร. วังน้อย',
  signatories: DEFAULT_SIGNATORIES,
  visaAlertTitle: 'สำหรับการต่อวีซ่า ให้ดำเนินการก่อนหนังสือเดินทางหมดอายุ 30 วัน',
  visaAlertDesc: '* เพื่อให้มีระยะเวลาเพียงพอต่อการพิจารณาของ ตม. และป้องกันการเสียค่าปรับ',
  visaAlertEnabled: true,
  timelineAlertTitle: 'การดำเนินการ จะเสร็จสิ้น ประมาณ 1-2 วัน ไม่นับวันหยุด หรือ กรุณาตรวจดูเส้นทางการดำเนินการหนังสือว่า "อนุมัติ"',
  timelineAlertDesc: '* สามารถตรวจสอบความคืบหน้าได้ตลอดเวลาที่แท็บ "เช็คสถานะคำร้อง"',
  timelineAlertEnabled: true,
  accuracyAlertTitle: 'กรุณากรอกข้อมูลให้ครบถ้วน มิฉะนั้นเอกสารจะไม่สมบูรณ์และจะยกเลิกการขอหนังสือ',
  accuracyAlertDesc: '* ตรวจสอบตัวสะกดชื่อ-นามสกุลภาษาอังกฤษและเลขพาสปอร์ตให้ตรงกับเล่มจริง',
  accuracyAlertEnabled: true,
};

export function convertGoogleDriveUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const matchFile = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile && matchFile[1]) {
    return `https://lh3.googleusercontent.com/d/${matchFile[1]}`;
  }
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) {
    return `https://lh3.googleusercontent.com/d/${matchId[1]}`;
  }
  return trimmed;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const settings = readLocalJson<SystemSettings | null>('system_settings.json', null);
  if (!settings) {
    writeLocalJson('system_settings.json', DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  const merged: SystemSettings = { ...DEFAULT_SETTINGS, ...settings };
  if (!merged.signatories || !Array.isArray(merged.signatories) || merged.signatories.length === 0) {
    merged.signatories = DEFAULT_SIGNATORIES;
  }
  return merged;
}

export async function updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
  const current = await getSystemSettings();
  if (updates.logoUrl) {
    updates.logoUrl = convertGoogleDriveUrl(updates.logoUrl);
  }
  const updated: SystemSettings = {
    ...current,
    ...updates,
  };
  writeLocalJson('system_settings.json', updated);
  return updated;
}

// ----------------- VERIFICATION SERVICE -----------------

export interface DocumentVerificationResult {
  verified: boolean;
  status: 'AUTHENTIC' | 'REVOKED' | 'EXPIRED' | 'NOT_FOUND';
  docNo?: string;
  id?: string;
  certType?: string;
  fullNameTh?: string;
  fullNameEn?: string;
  studentCode?: string;
  degreeLevel?: string;
  major?: string;
  facultyTh?: string;
  facultyEn?: string;
  universityTh?: string;
  universityEn?: string;
  passportNo?: string;
  passportExpireDate?: string;
  visaType?: string;
  nationality?: string;
  issueDate?: string;
  signerName?: string;
  signerTitle?: string;
  securityHash?: string;
  retentionStatus?: string;
  remarks?: string;
}

export async function verifyCertificateDocument(query: string): Promise<DocumentVerificationResult> {
  const cleanQuery = (query || '').trim().toLowerCase();
  if (!cleanQuery) {
    return { verified: false, status: 'NOT_FOUND' };
  }

  const certs = await getCertificateRequests();
  const students = await getStudents();
  const settings = await getSystemSettings();

  const matched = certs.find((c) => {
    const cDoc = (c.docNo || '').toLowerCase();
    const cId = (c.id || '').toLowerCase();
    const cCode = (c.studentCode || '').toLowerCase();
    const cPass = (c.passportNo || '').toLowerCase();

    return (
      cDoc === cleanQuery ||
      cDoc.replace('/', '-') === cleanQuery ||
      cDoc.replace('-', '/') === cleanQuery ||
      cDoc.replace(/\s+/g, '') === cleanQuery.replace(/\s+/g, '') ||
      cId === cleanQuery ||
      (cleanQuery.length >= 6 && (cCode === cleanQuery || cPass === cleanQuery))
    );
  });

  if (!matched) {
    const studentOnly = students.find((s) => s.studentCode.toLowerCase() === cleanQuery || (s.passportNo && s.passportNo.toLowerCase() === cleanQuery));
    if (studentOnly) {
      const securityHash = 'MCU-STU-' + Buffer.from(`${studentOnly.studentCode}-${studentOnly.passportNo || 'TH'}`).toString('hex').substring(0, 16).toUpperCase();
      return {
        verified: true,
        status: 'AUTHENTIC',
        docNo: `MCU-ENROLL-${studentOnly.studentCode}`,
        id: `stu-${studentOnly.studentCode}`,
        certType: 'หนังสือรับรองสถานภาพนิสิตปัจจุบัน (Student Enrollment Status)',
        fullNameTh: studentOnly.fullName || `${studentOnly.title || ''} ${studentOnly.firstName} ${studentOnly.lastName}`.trim(),
        fullNameEn: `${studentOnly.firstName} ${studentOnly.lastName}`.trim(),
        studentCode: studentOnly.studentCode,
        degreeLevel: studentOnly.degree || 'ปริญญาตรี',
        major: studentOnly.major || studentOnly.curriculumName || 'สาขาวิชาพระพุทธศาสนา',
        facultyTh: studentOnly.faculty || settings.facultyNameTh || 'คณะพุทธศาสตร์',
        facultyEn: settings.facultyNameEn || 'Faculty of Buddhism',
        universityTh: settings.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
        universityEn: settings.universityNameEn || 'Mahachulalongkornrajavidyalaya University',
        passportNo: studentOnly.passportNo || '',
        passportExpireDate: studentOnly.passportExpireDate || '',
        visaType: studentOnly.visaType || '',
        nationality: studentOnly.nationality || studentOnly.country || '',
        issueDate: new Date().toISOString(),
        signerName: settings.signerNameTh || 'รองอธิการบดีฝ่ายวิชาการ',
        signerTitle: settings.signerTitleTh || 'ปฏิบัติหน้าที่แทนอธิการบดี',
        securityHash,
        retentionStatus: 'จัดเก็บในสารบบถาวร (Archive Protected - 5 ปีขึ้นไปตามระเบียบสารบรรณ)',
        remarks: 'ตรวจพบในระบบทะเบียนนิสิต มจร. มีสถานภาพเป็นนิสิตจริง ใช้ตรวจสอบสิทธิ์และสถานะวีซ่ากับ ตม. ได้',
      };
    }
    return { verified: false, status: 'NOT_FOUND' };
  }

  const linkedStudent = students.find((s) => s.studentCode === matched.studentCode);
  const passportNo = matched.passportNo || linkedStudent?.passportNo || '';
  const passportExpireDate = matched.passportExpireDate || linkedStudent?.passportExpireDate || '';
  const visaType = matched.visaType || linkedStudent?.visaType || '';
  const nationality = matched.nationality || linkedStudent?.nationality || linkedStudent?.country || '';

  const securityHash = 'MCU-' + Buffer.from(`${matched.id}-${matched.docNo || 'NODOC'}-${matched.studentCode}`).toString('hex').substring(0, 16).toUpperCase();

  return {
    verified: true,
    status: matched.status === 'REJECTED' ? 'REVOKED' : 'AUTHENTIC',
    docNo: matched.docNo || `MCU-${matched.id.slice(-6)}`,
    id: matched.id,
    certType: matched.certType,
    fullNameTh: matched.fullName,
    fullNameEn: matched.fullName,
    studentCode: matched.studentCode,
    degreeLevel: matched.degreeLevel || linkedStudent?.degree || 'ปริญญาตรี',
    major: matched.major || linkedStudent?.major || 'สาขาวิชาพระพุทธศาสนา',
    facultyTh: settings.facultyNameTh || 'คณะพุทธศาสตร์',
    facultyEn: settings.facultyNameEn || 'Faculty of Buddhism',
    universityTh: settings.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
    universityEn: settings.universityNameEn || 'Mahachulalongkornrajavidyalaya University',
    passportNo,
    passportExpireDate,
    visaType,
    nationality,
    issueDate: matched.issueDateTh || matched.createdAt,
    signerName: settings.signerNameTh || 'รองอธิการบดีฝ่ายวิชาการ',
    signerTitle: settings.signerTitleTh || 'ปฏิบัติหน้าที่แทนอธิการบดี',
    securityHash,
    retentionStatus: 'จัดเก็บในสารบบถาวร (Archive Protected - 5 ปีขึ้นไปตามระเบียบสารบรรณ)',
    remarks: 'เอกสารฉบับนี้ออกให้ถูกต้องตามกฎหมายและระเบียบของมหาวิทยาลัย ใช้เป็นหลักฐานแสดงต่อ ตม. และหน่วยงานราชการได้จริง',
  };
}

// ----------------- RETENTION & ARCHIVE -----------------

export async function getRetentionSummary() {
  const students = await getStudents();
  const certs = await getCertificateRequests();

  const totalStudents = students.length;
  const foreignStudents = students.filter((s) => s.passportNo && s.passportNo.trim() !== '').length;
  const activeStudents = students.filter((s) => !s.studyStatus || s.studyStatus === 'กำลังศึกษา' || s.studyStatus === 'ปกติ').length;
  const graduatedStudents = students.filter((s) => s.studyStatus === 'สำเร็จการศึกษา').length;
  const otherStudents = totalStudents - activeStudents - graduatedStudents;

  return {
    totalStudents,
    foreignStudents,
    activeStudents,
    graduatedStudents,
    otherStudents,
    totalCertsIssued: certs.filter((c) => c.status === 'APPROVED' || c.docNo).length,
    retentionPolicyYears: 5,
    governingRule: 'ระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. 2526 และ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)',
  };
}

export interface AcademicYearArchive {
  academicYear: string;
  archivedAt: string;
  totalRequests: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  thaiStudentCount: number;
  foreignStudentCount: number;
  degreeSummary: {
    bachelor: number;
    master: number;
    doctoral: number;
  };
  purposeSummary: Record<string, number>;
}

export async function getAcademicYearArchives(): Promise<AcademicYearArchive[]> {
  return readLocalJson<AcademicYearArchive[]>('academic_archives.json', []);
}

export async function archiveAcademicYear(year: string): Promise<AcademicYearArchive> {
  const certs = await getCertificateRequests();
  const matching = certs.filter((c) => {
    const createdYear = new Date(c.createdAt).getFullYear() + 543;
    return String(createdYear) === String(year) || (c as any).academicYear === String(year) || year === '2569';
  });

  const approvedCount = matching.filter((c) => c.status === 'APPROVED').length;
  const rejectedCount = matching.filter((c) => c.status === 'REJECTED').length;
  const pendingCount = matching.filter((c) => c.status === 'PENDING').length;
  const foreignStudentCount = matching.filter((c) => c.passportNo && c.passportNo.trim() !== '').length;
  const thaiStudentCount = matching.length - foreignStudentCount;

  const bachelor = matching.filter((c) => c.degreeLevel?.includes('ตรี') || !c.degreeLevel).length;
  const master = matching.filter((c) => c.degreeLevel?.includes('โท')).length;
  const doctoral = matching.filter((c) => c.degreeLevel?.includes('เอก')).length;

  const purposeSummary: Record<string, number> = {};
  matching.forEach((c) => {
    const key = c.certType || 'ทั่วไป';
    purposeSummary[key] = (purposeSummary[key] || 0) + 1;
  });

  const archiveRecord: AcademicYearArchive = {
    academicYear: year,
    archivedAt: new Date().toISOString(),
    totalRequests: matching.length,
    approvedCount,
    rejectedCount,
    pendingCount,
    thaiStudentCount,
    foreignStudentCount,
    degreeSummary: { bachelor, master, doctoral },
    purposeSummary,
  };

  const existing = await getAcademicYearArchives();
  const filtered = existing.filter((a) => a.academicYear !== year);
  filtered.push(archiveRecord);
  writeLocalJson('academic_archives.json', filtered);

  return archiveRecord;
}
