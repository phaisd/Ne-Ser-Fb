import { CertificateRequest, CertRequestStatus } from '@/types';
import { getErrorMessage } from '@/lib/utils/error';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';
import { getStudents } from './studentService';
import {
  DEFAULT_SIGNATORIES,
  DEFAULT_SETTINGS,
  convertGoogleDriveUrl,
  getSystemSettings,
  updateSystemSettings,
} from './systemSettingsService';

export {
  DEFAULT_SIGNATORIES,
  DEFAULT_SETTINGS,
  convertGoogleDriveUrl,
  getSystemSettings,
  updateSystemSettings,
};

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
    name: data.name || 'à¸«à¸™à¸±à¸‡à¸ªà¸·à¸­à¸£à¸±à¸šà¸£à¸­à¸‡à¹ƒà¸«à¸¡à¹ˆ',
    targetAudience: audience,
    badge: data.badge || (audience === 'INTERNATIONAL' ? 'à¸™à¸´à¸ªà¸´à¸•à¸•à¹ˆà¸²à¸‡à¸Šà¸²à¸•à¸´' : audience === 'STAFF' ? 'à¸­à¸²à¸ˆà¸²à¸£à¸¢à¹Œ/à¹€à¸ˆà¹‰à¸²à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆ' : audience === 'CANDIDATE' ? 'à¸œà¸¹à¹‰à¸œà¹ˆà¸²à¸™à¸„à¸±à¸”à¹€à¸¥à¸·à¸­à¸' : 'à¸™à¸´à¸ªà¸´à¸•à¹„à¸—à¸¢'),
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
    const isThai = nationality === 'Thai' || nationality === 'à¹„à¸—à¸¢';
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
      certType: r.certType || r.certificateType?.name || strNote('requestPurpose') || 'à¸«à¸™à¸±à¸‡à¸ªà¸·à¸­à¸£à¸±à¸šà¸£à¸­à¸‡',
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
            certType: r[4] || sheetExtra.certType || local.certType || 'à¸«à¸™à¸±à¸‡à¸ªà¸·à¸­à¸£à¸±à¸šà¸£à¸­à¸‡',
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
    return { success: false, count: 0, error: 'à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¹„à¸”à¹‰à¸•à¸±à¹‰à¸‡à¸„à¹ˆà¸² Google Sheets API' };
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
      'ID à¸„à¸³à¸£à¹‰à¸­à¸‡',
      'à¸§à¸±à¸™à¸—à¸µà¹ˆà¸¢à¸·à¹ˆà¸™à¸„à¸³à¸£à¹‰à¸­à¸‡',
      'à¸£à¸«à¸±à¸ªà¸™à¸´à¸ªà¸´à¸•/à¸šà¸¸à¸„à¸¥à¸²à¸à¸£',
      'à¸Šà¸·à¹ˆà¸­-à¸ªà¸à¸¸à¸¥',
      'à¸›à¸£à¸°à¹€à¸ à¸—à¸«à¸™à¸±à¸‡à¸ªà¸·à¸­à¸£à¸±à¸šà¸£à¸­à¸‡',
      'à¸£à¸°à¸”à¸±à¸šà¸à¸²à¸£à¸¨à¸¶à¸à¸©à¸²',
      'à¸ªà¸²à¸‚à¸²à¸§à¸´à¸Šà¸²',
      'à¸§à¸±à¸•à¸–à¸¸à¸›à¸£à¸°à¸ªà¸‡à¸„à¹Œ',
      'à¸ªà¸–à¸²à¸™à¸°',
      'à¹€à¸¥à¸‚à¸—à¸µà¹ˆà¸«à¸™à¸±à¸‡à¸ªà¸·à¸­ à¸­à¸§',
      'à¸­à¸µà¹€à¸¡à¸¥',
      'à¹€à¸šà¸­à¸£à¹Œà¹‚à¸—à¸£à¸¨à¸±à¸žà¸—à¹Œ',
      'à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡ (JSON)',
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
            certType: r[4] || sheetExtra.certType || baseRecord?.certType || 'à¸«à¸™à¸±à¸‡à¸ªà¸·à¸­à¸£à¸±à¸šà¸£à¸­à¸‡',
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
      r.user?.name === 'à¸œà¸¹à¹‰à¸”à¸¹à¹à¸¥à¸£à¸°à¸šà¸š à¸„à¸“à¸°à¸žà¸¸à¸—à¸˜à¸¨à¸²à¸ªà¸•à¸£à¹Œ' ||
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
        certType: 'à¸«à¸™à¸±à¸‡à¸ªà¸·à¸­à¸£à¸±à¸šà¸£à¸­à¸‡à¸ªà¸–à¸²à¸™à¸ à¸²à¸žà¸™à¸´à¸ªà¸´à¸•à¸›à¸±à¸ˆà¸ˆà¸¸à¸šà¸±à¸™ (Student Enrollment Status)',
        fullNameTh: studentOnly.fullName || `${studentOnly.title || ''} ${studentOnly.firstName} ${studentOnly.lastName}`.trim(),
        fullNameEn: `${studentOnly.firstName} ${studentOnly.lastName}`.trim(),
        studentCode: studentOnly.studentCode,
        degreeLevel: studentOnly.degree || 'à¸›à¸£à¸´à¸à¸à¸²à¸•à¸£à¸µ',
        major: studentOnly.major || studentOnly.curriculumName || 'à¸ªà¸²à¸‚à¸²à¸§à¸´à¸Šà¸²à¸žà¸£à¸°à¸žà¸¸à¸—à¸˜à¸¨à¸²à¸ªà¸™à¸²',
        facultyTh: studentOnly.faculty || settings.facultyNameTh || 'à¸„à¸“à¸°à¸žà¸¸à¸—à¸˜à¸¨à¸²à¸ªà¸•à¸£à¹Œ',
        facultyEn: settings.facultyNameEn || 'Faculty of Buddhism',
        universityTh: settings.universityNameTh || 'à¸¡à¸«à¸²à¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢à¸¡à¸«à¸²à¸ˆà¸¸à¸¬à¸²à¸¥à¸‡à¸à¸£à¸“à¸£à¸²à¸Šà¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢',
        universityEn: settings.universityNameEn || 'Mahachulalongkornrajavidyalaya University',
        passportNo: studentOnly.passportNo || '',
        passportExpireDate: studentOnly.passportExpireDate || '',
        visaType: studentOnly.visaType || '',
        nationality: studentOnly.nationality || studentOnly.country || '',
        issueDate: new Date().toISOString(),
        signerName: settings.signerNameTh || 'à¸£à¸­à¸‡à¸­à¸˜à¸´à¸à¸²à¸£à¸šà¸”à¸µà¸à¹ˆà¸²à¸¢à¸§à¸´à¸Šà¸²à¸à¸²à¸£',
        signerTitle: settings.signerTitleTh || 'à¸›à¸à¸´à¸šà¸±à¸•à¸´à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆà¹à¸—à¸™à¸­à¸˜à¸´à¸à¸²à¸£à¸šà¸”à¸µ',
        securityHash,
        retentionStatus: 'à¸ˆà¸±à¸”à¹€à¸à¹‡à¸šà¹ƒà¸™à¸ªà¸²à¸£à¸šà¸šà¸–à¸²à¸§à¸£ (Archive Protected - 5 à¸›à¸µà¸‚à¸¶à¹‰à¸™à¹„à¸›à¸•à¸²à¸¡à¸£à¸°à¹€à¸šà¸µà¸¢à¸šà¸ªà¸²à¸£à¸šà¸£à¸£à¸“)',
        remarks: 'à¸•à¸£à¸§à¸ˆà¸žà¸šà¹ƒà¸™à¸£à¸°à¸šà¸šà¸—à¸°à¹€à¸šà¸µà¸¢à¸™à¸™à¸´à¸ªà¸´à¸• à¸¡à¸ˆà¸£. à¸¡à¸µà¸ªà¸–à¸²à¸™à¸ à¸²à¸žà¹€à¸›à¹‡à¸™à¸™à¸´à¸ªà¸´à¸•à¸ˆà¸£à¸´à¸‡ à¹ƒà¸Šà¹‰à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸ªà¸´à¸—à¸˜à¸´à¹Œà¹à¸¥à¸°à¸ªà¸–à¸²à¸™à¸°à¸§à¸µà¸‹à¹ˆà¸²à¸à¸±à¸š à¸•à¸¡. à¹„à¸”à¹‰',
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
    degreeLevel: matched.degreeLevel || linkedStudent?.degree || 'à¸›à¸£à¸´à¸à¸à¸²à¸•à¸£à¸µ',
    major: matched.major || linkedStudent?.major || 'à¸ªà¸²à¸‚à¸²à¸§à¸´à¸Šà¸²à¸žà¸£à¸°à¸žà¸¸à¸—à¸˜à¸¨à¸²à¸ªà¸™à¸²',
    facultyTh: settings.facultyNameTh || 'à¸„à¸“à¸°à¸žà¸¸à¸—à¸˜à¸¨à¸²à¸ªà¸•à¸£à¹Œ',
    facultyEn: settings.facultyNameEn || 'Faculty of Buddhism',
    universityTh: settings.universityNameTh || 'à¸¡à¸«à¸²à¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢à¸¡à¸«à¸²à¸ˆà¸¸à¸¬à¸²à¸¥à¸‡à¸à¸£à¸“à¸£à¸²à¸Šà¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢',
    universityEn: settings.universityNameEn || 'Mahachulalongkornrajavidyalaya University',
    passportNo,
    passportExpireDate,
    visaType,
    nationality,
    issueDate: matched.issueDateTh || matched.createdAt,
    signerName: settings.signerNameTh || 'à¸£à¸­à¸‡à¸­à¸˜à¸´à¸à¸²à¸£à¸šà¸”à¸µà¸à¹ˆà¸²à¸¢à¸§à¸´à¸Šà¸²à¸à¸²à¸£',
    signerTitle: settings.signerTitleTh || 'à¸›à¸à¸´à¸šà¸±à¸•à¸´à¸«à¸™à¹‰à¸²à¸—à¸µà¹ˆà¹à¸—à¸™à¸­à¸˜à¸´à¸à¸²à¸£à¸šà¸”à¸µ',
    securityHash,
    retentionStatus: 'à¸ˆà¸±à¸”à¹€à¸à¹‡à¸šà¹ƒà¸™à¸ªà¸²à¸£à¸šà¸šà¸–à¸²à¸§à¸£ (Archive Protected - 5 à¸›à¸µà¸‚à¸¶à¹‰à¸™à¹„à¸›à¸•à¸²à¸¡à¸£à¸°à¹€à¸šà¸µà¸¢à¸šà¸ªà¸²à¸£à¸šà¸£à¸£à¸“)',
    remarks: 'à¹€à¸­à¸à¸ªà¸²à¸£à¸‰à¸šà¸±à¸šà¸™à¸µà¹‰à¸­à¸­à¸à¹ƒà¸«à¹‰à¸–à¸¹à¸à¸•à¹‰à¸­à¸‡à¸•à¸²à¸¡à¸à¸Žà¸«à¸¡à¸²à¸¢à¹à¸¥à¸°à¸£à¸°à¹€à¸šà¸µà¸¢à¸šà¸‚à¸­à¸‡à¸¡à¸«à¸²à¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢ à¹ƒà¸Šà¹‰à¹€à¸›à¹‡à¸™à¸«à¸¥à¸±à¸à¸à¸²à¸™à¹à¸ªà¸”à¸‡à¸•à¹ˆà¸­ à¸•à¸¡. à¹à¸¥à¸°à¸«à¸™à¹ˆà¸§à¸¢à¸‡à¸²à¸™à¸£à¸²à¸Šà¸à¸²à¸£à¹„à¸”à¹‰à¸ˆà¸£à¸´à¸‡',
  };
}

// ----------------- RETENTION & ARCHIVE -----------------

export async function getRetentionSummary() {
  const students = await getStudents();
  const certs = await getCertificateRequests();

  const totalStudents = students.length;
  const foreignStudents = students.filter((s) => s.passportNo && s.passportNo.trim() !== '').length;
  const activeStudents = students.filter((s) => !s.studyStatus || s.studyStatus === 'à¸à¸³à¸¥à¸±à¸‡à¸¨à¸¶à¸à¸©à¸²' || s.studyStatus === 'à¸›à¸à¸•à¸´').length;
  const graduatedStudents = students.filter((s) => s.studyStatus === 'à¸ªà¸³à¹€à¸£à¹‡à¸ˆà¸à¸²à¸£à¸¨à¸¶à¸à¸©à¸²').length;
  const otherStudents = totalStudents - activeStudents - graduatedStudents;

  return {
    totalStudents,
    foreignStudents,
    activeStudents,
    graduatedStudents,
    otherStudents,
    totalCertsIssued: certs.filter((c) => c.status === 'APPROVED' || c.docNo).length,
    retentionPolicyYears: 5,
    governingRule: 'à¸£à¸°à¹€à¸šà¸µà¸¢à¸šà¸ªà¸³à¸™à¸±à¸à¸™à¸²à¸¢à¸à¸£à¸±à¸à¸¡à¸™à¸•à¸£à¸µà¸§à¹ˆà¸²à¸”à¹‰à¸§à¸¢à¸‡à¸²à¸™à¸ªà¸²à¸£à¸šà¸£à¸£à¸“ à¸ž.à¸¨. 2526 à¹à¸¥à¸° à¸ž.à¸£.à¸š. à¸„à¸¸à¹‰à¸¡à¸„à¸£à¸­à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ªà¹ˆà¸§à¸™à¸šà¸¸à¸„à¸„à¸¥ à¸ž.à¸¨. 2562 (PDPA)',
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

  const bachelor = matching.filter((c) => c.degreeLevel?.includes('à¸•à¸£à¸µ') || !c.degreeLevel).length;
  const master = matching.filter((c) => c.degreeLevel?.includes('à¹‚à¸—')).length;
  const doctoral = matching.filter((c) => c.degreeLevel?.includes('à¹€à¸­à¸')).length;

  const purposeSummary: Record<string, number> = {};
  matching.forEach((c) => {
    const key = c.certType || 'à¸—à¸±à¹ˆà¸§à¹„à¸›';
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
