import { CertificateRequest, CertRequestStatus, SystemSettings, SignatoryItem } from '@/types';
import { getErrorMessage } from '@/lib/utils/error';
import { DEFAULT_ADMISSION_PORTAL_CONFIG } from '@/lib/admission-config';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';
import { getStudents } from './studentService';

export interface StoredCertificateType {
  id: string;
  code: string;
  name: string;
  targetAudience: string;
  badge: string;
  category: string;
  iconName: string;
  description: string;
  templateType: string;
  isActive: boolean;
}

type CertificateTypeInput = Partial<StoredCertificateType>;

type RawCertificateRequestRecord = Partial<CertificateRequest> & {
  id: string;
  note?: string | Record<string, unknown>;
  user?: { name?: string };
  certificateType?: { name?: string };
  academicYear?: string;
};

// ----------------- CERTIFICATE TYPES -----------------

export async function getCertificateTypes(): Promise<StoredCertificateType[]> {
  return readLocalJson<StoredCertificateType[]>('certificate_types.json', []);
}

export async function createCertificateType(data: CertificateTypeInput): Promise<StoredCertificateType> {
  const types = await getCertificateTypes();
  const audience = data.targetAudience || 'THAI';
  const prefix = audience.toLowerCase().slice(0, 4);
  const id = data.id || `cert-${prefix}-${Date.now().toString(36)}`;
  
  const newType: StoredCertificateType = {
    id,
    code: data.code || `CERT-${types.length + 1}`,
    name: data.name || 'หนังสือรับรองใหม่',
    targetAudience: audience,
    badge: data.badge || (audience === 'INTERNATIONAL' ? 'นิสิตต่างชาติ' : audience === 'STAFF' ? 'อาจารย์/เจ้าหน้าที่' : audience === 'CANDIDATE' ? 'ผู้ผ่านคัดเลือก' : 'นิสิตไทย'),
    category: data.category || 'ACADEMIC',
    iconName: data.iconName || 'FileText',
    description: data.description || '',
    templateType: data.templateType || 'GENERAL',
    isActive: data.isActive !== false,
  };

  types.push(newType);
  writeLocalJson('certificate_types.json', types);
  return newType;
}

export async function updateCertificateType(
  id: string,
  updates: CertificateTypeInput
): Promise<StoredCertificateType | null> {
  const types = await getCertificateTypes();
  const idx = types.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  types[idx] = {
    ...types[idx],
    ...updates,
    id, // protect immutable id
  };

  writeLocalJson('certificate_types.json', types);
  return types[idx];
}

export async function deleteCertificateType(id: string): Promise<boolean> {
  const types = await getCertificateTypes();
  const filtered = types.filter((t) => t.id !== id);
  if (filtered.length === types.length) return false;

  writeLocalJson('certificate_types.json', filtered);
  return true;
}

// ----------------- CERTIFICATE REQUESTS -----------------

export async function getCertificateRequests(): Promise<CertificateRequest[]> {
  const rawRequests = readLocalJson<RawCertificateRequestRecord[]>('certificate_requests.json', []);
  const localMap = new Map<string, CertificateRequest>();

  const parsedLocalList: CertificateRequest[] = rawRequests.map((r) => {
    let noteObj: Record<string, unknown> = {};
    if (typeof r.note === 'string') {
      try {
        const parsed = JSON.parse(r.note);
        if (parsed && typeof parsed === 'object') noteObj = parsed as Record<string, unknown>;
      } catch {}
    } else if (r.note && typeof r.note === 'object') {
      noteObj = r.note;
    }

    const strNote = (key: string): string | undefined =>
      typeof noteObj[key] === 'string' ? (noteObj[key] as string) : undefined;
    const numOrStrNote = (key: string): string | number | undefined => {
      const val = noteObj[key];
      return typeof val === 'string' || typeof val === 'number' ? val : undefined;
    };
    const nationality = r.nationality || strNote('nationality') || '';
    const isThai = nationality === 'Thai' || nationality === 'ไทย';
    const noteApplicant = strNote('applicantType');
    const resolvedApplicantType: CertificateRequest['applicantType'] =
      r.applicantType ||
      (noteApplicant === 'STUDENT' || noteApplicant === 'STAFF' || noteApplicant === 'CANDIDATE'
        ? noteApplicant
        : r.targetAudience === 'STAFF'
        ? 'STAFF'
        : 'STUDENT');

    const item: CertificateRequest = {
      id: r.id,
      createdAt: r.createdAt || new Date().toISOString(),
      studentCode: r.studentCode || strNote('studentCode') || '',
      fullName: r.fullName || strNote('fullName') || (r.user ? r.user.name || '' : ''),
      monasticName: r.monasticName || strNote('monasticName') || '',
      certType: r.certType || r.certificateType?.name || strNote('requestPurpose') || 'หนังสือรับรอง',
      degreeLevel: r.degreeLevel || strNote('degreeLevel') || '',
      major: r.major || strNote('major') || '',
      requestPurpose: r.requestPurpose || strNote('requestPurpose') || '',
      status: r.status || 'PENDING',
      docNo: r.docNo || strNote('docNo') || '',
      docNoPrefix: r.docNoPrefix || strNote('docNoPrefix') || (r.docNo && r.docNo.includes('8002.1') ? '8002.1' : '8002'),
      email: r.email || strNote('email') || '',
      phone: r.phone || strNote('phone') || '',
      targetAudience: r.targetAudience || (isThai ? 'THAI' : 'INTERNATIONAL'),
      applicantType: resolvedApplicantType,
      position: r.position || strNote('position') || '',
      department: r.department || strNote('department') || '',
      candidateAppNo: r.candidateAppNo || strNote('candidateAppNo') || '',
      age: r.age || numOrStrNote('age') || '',
      vassa: r.vassa || numOrStrNote('vassa') || '',
      gender: r.gender || strNote('sex') || '',
      nationality: nationality,
      country: r.country || strNote('country') || '',
      passportNo: r.passportNo || strNote('passportNo') || '',
      passportExpireDate: r.passportExpireDate || strNote('passportExpireDate') || '',
      visaType: r.visaType || strNote('visaType') || '',
      visaExpireDate: r.visaExpireDate || strNote('visaExpireDate') || '',
      gpa: r.gpa || numOrStrNote('gpa') || '',
      address: r.address || strNote('addressLine') || strNote('fullAddress') || '',
      subdistrict: r.subdistrict || strNote('subdistrict') || '',
      district: r.district || strNote('district') || '',
      province: r.province || strNote('province') || '',
      postalCode: r.postalCode || strNote('postalCode') || '',
      bankTargetTh: r.bankTargetTh || strNote('bankTargetTh') || '',
      bankActionTh: r.bankActionTh || strNote('bankActionTh') || '',
      issueDateTh: r.issueDateTh || strNote('issueDateTh') || '',
      issueDateEn: r.issueDateEn || strNote('issueDateEn') || '',
      docTemplate: r.docTemplate || strNote('docTemplate') || '',
      signerNameTh: r.signerNameTh || strNote('signerNameTh') || '',
      signerTitleTh: r.signerTitleTh || strNote('signerTitleTh') || '',
      signerNameEn: r.signerNameEn || strNote('signerNameEn') || '',
      signerTitleEn: r.signerTitleEn || strNote('signerTitleEn') || '',
      coordinatorNameTh: r.coordinatorNameTh || strNote('coordinatorNameTh') || '',
      coordinatorPhoneTh: r.coordinatorPhoneTh || strNote('coordinatorPhoneTh') || '',
      customBodyText: r.customBodyText || strNote('customBodyText') || '',
      enrollmentSlipUrl: r.enrollmentSlipUrl || strNote('registrationPdfUrl') || '',
      passportCopyUrl: r.passportCopyUrl || strNote('passportCopyUrl') || '',
      rejectReason: r.rejectReason || strNote('rejectReason') || '',
    };
    localMap.set(r.id, item);
    return item;
  });

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('CertificateRequests!A2:M');
      if (rows && rows.length > 0) {
        return rows.map((r) => {
          const id = r[0] || '';
          const local = localMap.get(id) || ({} as Partial<CertificateRequest>);
          let sheetExtra: Partial<CertificateRequest> = {};
          if (r[12]) {
            try {
              const parsed = JSON.parse(r[12]);
              if (parsed && typeof parsed === 'object') sheetExtra = parsed;
            } catch {}
          }
          return {
            ...local,
            ...sheetExtra,
            id,
            createdAt: r[1] || sheetExtra.createdAt || local.createdAt || new Date().toISOString(),
            studentCode: r[2] || sheetExtra.studentCode || local.studentCode || '',
            fullName: r[3] || sheetExtra.fullName || local.fullName || '',
            monasticName: sheetExtra.monasticName || local.monasticName || '',
            certType: r[4] || sheetExtra.certType || local.certType || 'หนังสือรับรอง',
            degreeLevel: r[5] || sheetExtra.degreeLevel || local.degreeLevel || '',
            major: r[6] || sheetExtra.major || local.major || '',
            requestPurpose: r[7] || sheetExtra.requestPurpose || local.requestPurpose || '',
            status: (r[8] as CertRequestStatus) || sheetExtra.status || local.status || 'PENDING',
            docNo: r[9] || sheetExtra.docNo || local.docNo || '',
            docNoPrefix: sheetExtra.docNoPrefix || local.docNoPrefix || (r[9] && r[9].includes('8002.1') ? '8002.1' : '8002'),
            email: r[10] || sheetExtra.email || local.email || '',
            phone: r[11] || sheetExtra.phone || local.phone || '',
            age: sheetExtra.age || local.age || '',
            vassa: sheetExtra.vassa || local.vassa || '',
            rejectReason: sheetExtra.rejectReason || local.rejectReason || '',
          } as CertificateRequest;
        });
      }
    } catch (err) {
      console.warn('Google Sheets read error for CertRequests, falling back to local file:', err);
    }
  }

  return parsedLocalList;
}

export async function syncCertificateRequestsToSheets(
  items?: RawCertificateRequestRecord[]
): Promise<{ success: boolean; count: number; error?: string }> {
  const gClient = getSheetsClient();
  if (!gClient) {
    return { success: false, count: 0, error: 'ยังไม่ได้ตั้งค่า Google Sheets API' };
  }

  const rawList = items || readLocalJson<RawCertificateRequestRecord[]>('certificate_requests.json', []);

  try {
    // Clear existing rows A2:Z1000
    try {
      await gClient.clearValues('CertificateRequests!A2:Z1000');
    } catch (e) {
      console.warn('Could not clear range:', e);
    }

    const headers = [
      'ID คำร้อง',
      'วันที่ยื่นคำร้อง',
      'รหัสนิสิต/บุคลากร',
      'ชื่อ-สกุล',
      'ประเภทหนังสือรับรอง',
      'ระดับการศึกษา',
      'สาขาวิชา',
      'วัตถุประสงค์',
      'สถานะ',
      'เลขที่หนังสือ อว',
      'อีเมล',
      'เบอร์โทรศัพท์',
      'ข้อมูลเพิ่มเติม (JSON)',
    ];

    const rows = rawList.map((r) => [
      r.id || '',
      r.createdAt || '',
      r.studentCode || '',
      r.fullName || (r.user ? r.user.name || '' : ''),
      r.certType || r.certificateType?.name || '',
      r.degreeLevel || '',
      r.major || '',
      r.requestPurpose || '',
      r.status || 'PENDING',
      r.docNo || '',
      r.email || '',
      r.phone || '',
      JSON.stringify({
        monasticName: r.monasticName,
        age: r.age,
        vassa: r.vassa,
        gender: r.gender,
        nationality: r.nationality,
        country: r.country,
        passportNo: r.passportNo,
        passportExpireDate: r.passportExpireDate,
        visaType: r.visaType,
        visaExpireDate: r.visaExpireDate,
        gpa: r.gpa,
        address: r.address,
        subdistrict: r.subdistrict,
        district: r.district,
        province: r.province,
        postalCode: r.postalCode,
        targetAudience: r.targetAudience,
        applicantType: r.applicantType,
        position: r.position,
        department: r.department,
        enrollmentSlipUrl: r.enrollmentSlipUrl,
        passportCopyUrl: r.passportCopyUrl,
        customBodyText: r.customBodyText,
        docNoPrefix: r.docNoPrefix,
        rejectReason: r.rejectReason,
      }),
    ]);

    await gClient.updateValues('CertificateRequests!A1', [headers, ...rows]);
    return { success: true, count: rows.length };
  } catch (err: unknown) {
    console.warn('syncCertificateRequestsToSheets error:', getErrorMessage(err));
    return { success: false, count: 0, error: getErrorMessage(err) };
  }
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
      await gClient.appendValues('CertificateRequests!A:M', [[
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
        JSON.stringify({
          monasticName: newReq.monasticName,
          age: newReq.age,
          vassa: newReq.vassa,
          gender: newReq.gender,
          nationality: newReq.nationality,
          country: newReq.country,
          passportNo: newReq.passportNo,
          passportExpireDate: newReq.passportExpireDate,
          visaType: newReq.visaType,
          visaExpireDate: newReq.visaExpireDate,
          gpa: newReq.gpa,
          address: newReq.address,
          subdistrict: newReq.subdistrict,
          district: newReq.district,
          province: newReq.province,
          postalCode: newReq.postalCode,
          targetAudience: newReq.targetAudience,
          applicantType: newReq.applicantType,
          position: newReq.position,
          department: newReq.department,
          enrollmentSlipUrl: newReq.enrollmentSlipUrl,
          passportCopyUrl: newReq.passportCopyUrl,
          customBodyText: newReq.customBodyText,
          docNoPrefix: newReq.docNoPrefix,
        }),
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

function serializeCertRequestRow(r: RawCertificateRequestRecord): string[] {
  return [
    r.id || '',
    r.createdAt || '',
    r.studentCode || '',
    r.fullName || (r.user ? r.user.name || '' : ''),
    r.certType || r.certificateType?.name || '',
    r.degreeLevel || '',
    r.major || '',
    r.requestPurpose || '',
    r.status || 'PENDING',
    r.docNo || '',
    r.email || '',
    r.phone || '',
    JSON.stringify({
      monasticName: r.monasticName,
      age: r.age,
      vassa: r.vassa,
      gender: r.gender,
      nationality: r.nationality,
      country: r.country,
      passportNo: r.passportNo,
      passportExpireDate: r.passportExpireDate,
      visaType: r.visaType,
      visaExpireDate: r.visaExpireDate,
      gpa: r.gpa,
      address: r.address,
      subdistrict: r.subdistrict,
      district: r.district,
      province: r.province,
      postalCode: r.postalCode,
      targetAudience: r.targetAudience,
      applicantType: r.applicantType,
      position: r.position,
      department: r.department,
      enrollmentSlipUrl: r.enrollmentSlipUrl,
      passportCopyUrl: r.passportCopyUrl,
      customBodyText: r.customBodyText,
      docNoPrefix: r.docNoPrefix,
      rejectReason: r.rejectReason,
    }),
  ];
}

export async function updateCertificateRequest(id: string, updates: Partial<CertificateRequest>): Promise<CertificateRequest | null> {
  const cleanId = String(id || '').trim();
  if (!cleanId) return null;

  const localList = readLocalJson<any[]>('certificate_requests.json', []);
  const localIdx = localList.findIndex((r) => String(r.id || '').trim() === cleanId);

  let baseRecord: CertificateRequest | null = localIdx !== -1 ? localList[localIdx] : null;
  let sheetRowNum: number | null = null;

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('CertificateRequests!A2:M');
      if (rows && rows.length > 0) {
        const sIdx = rows.findIndex((r) => String(r[0] || '').trim() === cleanId);
        if (sIdx !== -1) {
          sheetRowNum = sIdx + 2;
          const r = rows[sIdx];
          let sheetExtra: Partial<CertificateRequest> = {};
          if (r[12]) {
            try {
              const parsed = JSON.parse(r[12]);
              if (parsed && typeof parsed === 'object') sheetExtra = parsed;
            } catch {}
          }
          baseRecord = {
            ...(baseRecord || {}),
            ...sheetExtra,
            id: cleanId,
            createdAt: r[1] || sheetExtra.createdAt || baseRecord?.createdAt || new Date().toISOString(),
            studentCode: r[2] || sheetExtra.studentCode || baseRecord?.studentCode || '',
            fullName: r[3] || sheetExtra.fullName || baseRecord?.fullName || '',
            certType: r[4] || sheetExtra.certType || baseRecord?.certType || 'หนังสือรับรอง',
            degreeLevel: r[5] || sheetExtra.degreeLevel || baseRecord?.degreeLevel || '',
            major: r[6] || sheetExtra.major || baseRecord?.major || '',
            requestPurpose: r[7] || sheetExtra.requestPurpose || baseRecord?.requestPurpose || '',
            status: (r[8] as CertRequestStatus) || sheetExtra.status || baseRecord?.status || 'PENDING',
            docNo: r[9] || sheetExtra.docNo || baseRecord?.docNo || '',
            email: r[10] || sheetExtra.email || baseRecord?.email || '',
            phone: r[11] || sheetExtra.phone || baseRecord?.phone || '',
          } as CertificateRequest;
        }
      }
    } catch (err) {
      console.warn('Google Sheets lookup on updateCertificateRequest error:', err);
    }
  }

  if (!baseRecord) {
    return null;
  }

  const updatedRecord: CertificateRequest = {
    ...baseRecord,
    ...updates,
    id: cleanId,
    status: updates.status || baseRecord.status,
    docNo: updates.docNo !== undefined ? updates.docNo : baseRecord.docNo,
    docNoPrefix: updates.docNoPrefix !== undefined ? updates.docNoPrefix : baseRecord.docNoPrefix,
    rejectReason:
      updates.rejectReason !== undefined
        ? updates.rejectReason
        : (updates as any).note !== undefined && updates.status === 'REJECTED'
        ? String((updates as any).note)
        : baseRecord.rejectReason,
  };

  if (localIdx !== -1) {
    localList[localIdx] = { ...localList[localIdx], ...updatedRecord, updatedAt: new Date().toISOString() };
  } else {
    localList.unshift({ ...updatedRecord, updatedAt: new Date().toISOString() });
  }
  writeLocalJson('certificate_requests.json', localList);

  if (gClient) {
    try {
      const serializedRow = serializeCertRequestRow(updatedRecord);
      if (sheetRowNum !== null) {
        await gClient.updateValues(`CertificateRequests!A${sheetRowNum}:M${sheetRowNum}`, [serializedRow]);
      } else {
        await gClient.appendValues('CertificateRequests!A:M', [serializedRow]);
      }
    } catch (err) {
      console.warn('Google Sheets direct update on updateCertificateRequest error:', err);
    }
  }

  return updatedRecord;
}

export async function deleteCertificateRequest(id: string): Promise<boolean> {
  const cleanId = String(id || '').trim();
  if (!cleanId) return false;

  const allRequests = await getCertificateRequests();
  const nextAll = allRequests.filter((r) => String(r.id || '').trim() !== cleanId);

  const localList = readLocalJson<any[]>('certificate_requests.json', []);
  const nextLocal = localList.filter((r) => String(r.id || '').trim() !== cleanId);

  if (nextAll.length === allRequests.length && nextLocal.length === localList.length) {
    return false;
  }

  writeLocalJson('certificate_requests.json', nextLocal);

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await syncCertificateRequestsToSheets(nextAll);
    } catch (err) {
      console.warn('Google Sheets sync on delete error:', err);
    }
  }

  return true;
}

export async function clearMockApprovedRequests(): Promise<{ deletedCount: number; remainingCount: number }> {
  const localList = readLocalJson<any[]>('certificate_requests.json', []);
  // Backup before clearing
  writeLocalJson('certificate_requests.backup.json', localList);

  // Filter out legacy mock approved items (e.g. uuid-format ids, or items created as mock approved)
  const remainingList = localList.filter((r) => {
    const isLegacyMock = r.status === 'APPROVED' && (
      r.user?.name === 'ผู้ดูแลระบบ คณะพุทธศาสตร์' ||
      (typeof r.id === 'string' && r.id.length > 20 && !r.id.startsWith('req-'))
    );
    return !isLegacyMock;
  });

  const deletedCount = localList.length - remainingList.length;
  writeLocalJson('certificate_requests.json', remainingList);

  // Sync to sheets
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await syncCertificateRequestsToSheets(remainingList);
    } catch (err) {
      console.warn('Google Sheets sync after clear error:', err);
    }
  }

  return { deletedCount, remainingCount: remainingList.length };
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
    id: 'SECRETARY',
    label: '4. เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์',
    name: '',
    title: 'เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'ACTING_DEAN',
    label: '5. ผู้รักษาราชการแทนคณบดีคณะพุทธศาสตร์',
    name: '',
    title: 'รักษาราชการแทนคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'REGISTRAR',
    label: '6. ผู้อำนวยการส่วนทะเบียนและวัดผล (นายทะเบียน)',
    name: 'พระมหาสุริยัน ปญฺญาวชิโร, ผศ.ดร.',
    title: 'ผู้อำนวยการส่วนทะเบียนและวัดผล',
  },
  {
    id: 'BLANK',
    label: '7. เว้นว่างไว้สำหรับลงนามสดด้วยลายมือปากกา (Handwritten)',
    name: '',
    title: 'คณบดีคณะพุทธศาสตร์',
  },
];

export const DEFAULT_SETTINGS: SystemSettings = {
  universityNameTh: 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
  universityNameEn: 'Mahachulalongkornrajavidyalaya University',
  facultyNameTh: 'คณะพุทธศาสตร์',
  facultyNameEn: 'Faculty of Buddhism',
  officeNameTh: 'สำนักงานคณบดีคณะพุทธศาสตร์',
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
  forcePasswordChangeOnFirstLogin: true,
  googleClientId: '383232908495-dk56ffn57og3jscr1es2bjt1vm4h6dfk.apps.googleusercontent.com',
  lineNotifyToken: '',
  lineChannelAccessToken: '',
  lineTargetUserId: '',
  lineWebhookUrl: '',
  heroWildEnabled: true,
  heroLeftWord: 'WI',
  heroRightWord: 'LD',
  heroCapsuleImage: '/images/wild-capsule-island.jpg',
  heroCapsuleAlt: 'Floating Island Nature Capsule - MotionSites AI Wild Pil',
  heroBadgeText: 'Creative Designer & Faculty of Buddhism • MCU',
  heroHeadingTh: 'ระบบบริการนิสิตและวิชาการออนไลน์ คณะพุทธศาสตร์',
  heroDescription:
    'Embark on an inspiring academic journey around the Buddhist wisdom and student services portal. Discover seamless certificate issuance, real-time class timetables, and academic excellence on your unforgettable path.',
  heroDropCapLetter: 'E',
  heroPrimaryBtnText: "Let's Get Wild",
  heroPrimaryBtnUrl: '/certificates',
  heroSecondaryBtnText: 'ตารางเรียนและวิชาการ',
  heroSecondaryBtnUrl: '/courses',
  heroBgStyle: 'wavy-contours',
  themePreset: 'pink',
  themeMourningRibbon: false,
  showPublicDashboardStats: true,
  showVisitorCounter: true,
  visitorCount: 1272,
  showEnrollmentMenu: true,
  admissionOpen: true,
  admissionAcademicYear: '2570',
  admissionDefaultInterviewDate: '20 พฤษภาคม 2570 เวลา 09.00 - 12.00 น.',
  admissionDefaultInterviewRoom: 'อาคารสมเด็จพระพุฒาจารย์ (อาคารเรียนรวม) คณะพุทธศาสตร์ มจร วังน้อย',
  admissionCoordinatorName: 'สำนักงานคณบดีคณะพุทธศาสตร์ ฝ่ายทะเบียนและวัดผล',
  admissionCoordinatorPhone: '035-248-000 ต่อ 8323',
  admissionPortalConfig: DEFAULT_ADMISSION_PORTAL_CONFIG,
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
  let settings = readLocalJson<SystemSettings | null>('system_settings.json', null);
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('System_Settings!A2:B2');
      if (rows && rows.length > 0 && rows[0][1]) {
        const parsedFromSheet = JSON.parse(String(rows[0][1]));
        if (parsedFromSheet && typeof parsedFromSheet === 'object') {
          settings = { ...(settings || {}), ...parsedFromSheet };
        }
      }
    } catch {
      // System_Settings tab may not exist yet; fall back to local
    }
  }
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

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await gClient.ensureSheetsExist(['System_Settings']);
      await gClient.updateValues('System_Settings!A1:B2', [
        ['Key', 'JSON_Value'],
        ['SETTINGS_JSON', JSON.stringify(updated)],
      ]);
    } catch (err) {
      console.warn('Google Sheets updateSystemSettings warning:', err);
    }
  }

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
    const itemWithYear = c as CertificateRequest & { academicYear?: string };
    return String(createdYear) === String(year) || itemWithYear.academicYear === String(year) || year === '2569';
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
