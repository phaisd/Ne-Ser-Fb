import { EventRegistration, SatipatthanaChecklist } from '@/types';
import { toBuddhistYear } from '@/lib/utils/formatters';
import { readLocalJson, writeLocalJson, getSheetsClient } from '../storageHelper';
import { getEvents } from './eventCoreService';
import { getEventRegistrations } from './eventRegistrationService';

// ----------------- VIPASSANA ATTENDANCE & GRADING -----------------

async function loadAndHydrateRegistrations(): Promise<EventRegistration[]> {
  try {
    const fromService = await getEventRegistrations();
    if (fromService && fromService.length > 0) {
      writeLocalJson('event_registrations.json', fromService);
      return fromService;
    }
  } catch (err) {
    console.warn('loadAndHydrateRegistrations sheets fetch error:', err);
  }
  return readLocalJson<EventRegistration[]>('event_registrations.json', []);
}

export async function syncUpdatedRegistrationsToSheets(updatedRegs: EventRegistration[]): Promise<void> {
  if (!updatedRegs || updatedRegs.length === 0) return;
  const gClient = getSheetsClient();
  if (!gClient) return;

  try {
    const rows = await gClient.getValues('EventRegistrations!A2:C');
    if (!rows || rows.length === 0) return;

    const idToRowIndex = new Map<string, number>();
    const codeToRowIndex = new Map<string, number>();
    rows.forEach((r, idx) => {
      const rowNum = idx + 2;
      const id = String(r[0] || '').trim();
      const code = String(r[2] || '').trim().toLowerCase();
      if (id) idToRowIndex.set(id, rowNum);
      if (code) codeToRowIndex.set(code, rowNum);
    });

    for (const reg of updatedRegs) {
      const rowNum =
        idToRowIndex.get(reg.id) ||
        (reg.studentCode ? codeToRowIndex.get(reg.studentCode.trim().toLowerCase()) : undefined);
      if (!rowNum) continue;

      const extraMeta = {
        age: reg.age,
        vasa: reg.vasa,
        passedMeditation: reg.passedMeditation,
        finalMeditationResult: reg.finalMeditationResult,
        certificateIssued: reg.certificateIssued,
        certificateDocNo: reg.certificateDocNo,
        certificateIssuedAt: reg.certificateIssuedAt,
        updatedAt: reg.updatedAt,
      };

      await gClient.updateValues(`EventRegistrations!E${rowNum}:U${rowNum}`, [[
        reg.status || 'REGISTERED',
        reg.role || 'STUDENT',
        reg.major || '',
        reg.yearLevel || 1,
        reg.department || '',
        reg.groupName || '',
        reg.createdAt || '',
        reg.groupNumber !== undefined ? String(reg.groupNumber) : '',
        reg.groupSpecificCode || '',
        reg.degreeLevel || '',
        reg.programType || 'THAI',
        reg.remarks || '',
        reg.attendedAt || '',
        JSON.stringify(reg.dailyAttendance || {}),
        JSON.stringify(reg.vipassanaInterviews || {}),
        JSON.stringify(reg.attendedDays || []),
        JSON.stringify(extraMeta),
      ]]);
    }
  } catch (err) {
    console.warn('Could not sync updated registrations to Google Sheets:', err);
  }
}

export async function saveVipassanaAttendance(
  eventId: string,
  dayKey: string,
  records: Array<{
    registrationId: string;
    p1?: { status: string; checkInTime?: string; recordedBy?: string };
    p2?: { status: string; checkInTime?: string; recordedBy?: string };
    p3?: { status: string; checkInTime?: string; recordedBy?: string };
    p4?: { status: string; checkInTime?: string; recordedBy?: string };
    remark?: string;
  }>
): Promise<boolean> {
  const local = await loadAndHydrateRegistrations();
  const recordMap = new Map(records.map((r) => [r.registrationId, r]));

  const updatedRegs: EventRegistration[] = [];
  local.forEach((reg) => {
    if (reg.eventId === eventId && recordMap.has(reg.id)) {
      const rec = recordMap.get(reg.id)!;
      if (!reg.dailyAttendance) reg.dailyAttendance = {};
      const existingDay = reg.dailyAttendance[dayKey] || {};
      reg.dailyAttendance[dayKey] = {
        p1: rec.p1 ? { ...existingDay.p1, ...rec.p1 } : (existingDay.p1 || { status: 'UNCHECKED' }),
        p2: rec.p2 ? { ...existingDay.p2, ...rec.p2 } : (existingDay.p2 || { status: 'UNCHECKED' }),
        p3: rec.p3 ? { ...existingDay.p3, ...rec.p3 } : (existingDay.p3 || { status: 'UNCHECKED' }),
        p4: rec.p4 ? { ...existingDay.p4, ...rec.p4 } : (existingDay.p4 || { status: 'UNCHECKED' }),
      };
      if (rec.remark !== undefined) reg.remarks = rec.remark;
      reg.updatedAt = new Date().toISOString();
      updatedRegs.push(reg);
    }
  });

  if (updatedRegs.length > 0) {
    writeLocalJson('event_registrations.json', local);
    await syncUpdatedRegistrationsToSheets(updatedRegs);
  }
  return true;
}

export async function recordVipassanaScanCheckin(params: {
  eventId: string;
  studentCodeOrId: string;
  dayKey: string;
  periodKey: 'p1' | 'p2' | 'p3' | 'p4';
  status?: 'PRESENT' | 'LATE' | 'SICK' | 'ABSENT';
  checkInTime?: string;
  recordedBy?: string;
}): Promise<{
  success: boolean;
  error?: string;
  registration?: EventRegistration;
  isAlreadyCheckedIn?: boolean;
  scanCount?: number;
  isOverDuplicateLimit?: boolean;
  isExcessiveScan?: boolean;
  firstCheckInTime?: string;
}> {
  const { eventId, studentCodeOrId, dayKey, periodKey, recordedBy } = params;
  let cleanInput = String(studentCodeOrId || '').trim();

  // Try parse if JSON
  if (cleanInput.startsWith('{') && cleanInput.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleanInput);
      cleanInput = String(parsed.studentCode || parsed.code || parsed.id || cleanInput).trim();
    } catch {}
  }
  // Strip prefix like VIPASSANA: or MCU:
  if (cleanInput.includes(':')) {
    const parts = cleanInput.split(':');
    cleanInput = parts[parts.length - 1].trim();
  }

  if (!cleanInput) {
    return { success: false, error: 'รหัสประจำตัวหรือรหัสลงทะเบียนไม่ถูกต้อง' };
  }

  const cleanLower = cleanInput.toLowerCase();
  const local = await loadAndHydrateRegistrations();
  const reg = local.find(
    (r) =>
      r.eventId === eventId &&
      (r.id === cleanInput ||
        (r.groupSpecificCode && r.groupSpecificCode.trim().toLowerCase() === cleanLower) ||
        (r.studentCode && r.studentCode.trim().toLowerCase() === cleanLower))
  );

  if (!reg) {
    return { success: false, error: `ไม่พบข้อมูลนิสิต (${cleanInput}) ในโครงการนี้` };
  }

  const now = new Date();
  const nowTime =
    params.checkInTime ||
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
      now.getSeconds()
    ).padStart(2, '0')}`;

  if (!reg.dailyAttendance) reg.dailyAttendance = {};
  if (!reg.dailyAttendance[dayKey]) reg.dailyAttendance[dayKey] = {};

  const existingPeriod = reg.dailyAttendance[dayKey][periodKey];
  const isAlreadyCheckedIn =
    existingPeriod && (existingPeriod.status === 'PRESENT' || existingPeriod.status === 'LATE');

  // Track scan count within this specific period
  const prevCount = existingPeriod?.scanCount || (isAlreadyCheckedIn ? 1 : 0);
  const currentScanCount = prevCount + 1;
  const isOverDuplicateLimit = currentScanCount > 2;
  const isExcessiveScan = currentScanCount > 3;

  const newStatus = params.status || (isAlreadyCheckedIn ? existingPeriod.status : 'PRESENT');
  const checkInTime = existingPeriod?.checkInTime || nowTime;

  reg.dailyAttendance[dayKey][periodKey] = {
    status: newStatus,
    checkInTime,
    recordedBy: recordedBy || 'LIVE_SCANNER',
    scanCount: currentScanCount,
    lastScanTime: nowTime,
    duplicateFlag: isExcessiveScan
      ? 'ไม่ตั้งใจปฏิบัติ'
      : isOverDuplicateLimit
      ? 'สแกนซ้ำ'
      : existingPeriod?.duplicateFlag,
  };

  // If scanned > 3 times in the same session, auto-record "ไม่ตั้งใจปฏิบัติ" in remarks
  if (isExcessiveScan) {
    const unmindfulNote = `[ไม่ตั้งใจปฏิบัติ: สแกนซ้ำเกิน 3 ครั้ง (${currentScanCount} ครั้ง ในรอบ ${periodKey})]`;
    if (!reg.remarks) {
      reg.remarks = unmindfulNote;
    } else if (!reg.remarks.includes(`[ไม่ตั้งใจปฏิบัติ:`)) {
      reg.remarks = `${reg.remarks} ${unmindfulNote}`.trim();
    } else {
      reg.remarks = reg.remarks.replace(
        new RegExp(`\\[ไม่ตั้งใจปฏิบัติ:[^\\]]*\\]`),
        unmindfulNote
      );
    }
  } else if (isOverDuplicateLimit) {
    const duplicateNote = `[สแกนซ้ำ: ${dayKey}/${periodKey} รวม ${currentScanCount} ครั้ง (ล่าสุด ${nowTime} น.)]`;
    if (!reg.remarks) {
      reg.remarks = duplicateNote;
    } else if (!reg.remarks.includes(`[สแกนซ้ำ: ${dayKey}/${periodKey}`)) {
      reg.remarks = `${reg.remarks} ${duplicateNote}`.trim();
    } else {
      reg.remarks = reg.remarks.replace(
        new RegExp(`\\[สแกนซ้ำ: ${dayKey}\\/${periodKey}[^\\]]*\\]`),
        duplicateNote
      );
    }
  }

  reg.status = 'ATTENDED';
  reg.attendedAt = reg.attendedAt || now.toISOString();
  reg.updatedAt = now.toISOString();

  // Calculate attended days
  const dayNum = parseInt(dayKey.replace(/\D/g, ''), 10);
  if (!isNaN(dayNum) && dayNum > 0) {
    const dayData = reg.dailyAttendance[dayKey];
    const presentPeriods = ['p1', 'p2', 'p3', 'p4'].filter(
      (p) => dayData[p] && (dayData[p].status === 'PRESENT' || dayData[p].status === 'LATE')
    ).length;

    const attendedSet = new Set<number>(Array.isArray(reg.attendedDays) ? reg.attendedDays : []);
    if (presentPeriods >= 3) {
      attendedSet.add(dayNum);
    }
    reg.attendedDays = Array.from(attendedSet).sort((a, b) => a - b);
  }

  writeLocalJson('event_registrations.json', local);
  await syncUpdatedRegistrationsToSheets([reg]);

  return {
    success: true,
    registration: reg,
    isAlreadyCheckedIn: Boolean(isAlreadyCheckedIn),
    scanCount: currentScanCount,
    isOverDuplicateLimit,
    isExcessiveScan,
    firstCheckInTime: checkInTime,
  };
}

export interface SaveVipassanaInterviewPayload {
  eventId: string;
  sessionNumber: number; // 1, 2, 3
  sessionDate?: string;
  meditationMasterName?: string;
  entries: Array<{
    registrationId: string;
    checklist: SatipatthanaChecklist;
    result: 'PASS' | 'NOT_PASS' | 'PENDING';
    remarks?: string;
  }>;
}

export async function saveVipassanaInterview(
  payload: SaveVipassanaInterviewPayload
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  const { eventId, sessionNumber, sessionDate, meditationMasterName, entries } = payload;
  if (!eventId || !sessionNumber || !Array.isArray(entries)) {
    return { success: false, updatedCount: 0, error: 'ข้อมูลไม่ถูกต้อง' };
  }

  const local = await loadAndHydrateRegistrations();
  const sessionKey = `s${sessionNumber}`;
  const nowIso = new Date().toISOString();
  const updatedRegs: EventRegistration[] = [];

  const entriesMap = new Map<string, (typeof entries)[0]>();
  entries.forEach((e) => {
    entriesMap.set(e.registrationId, e);
  });

  local.forEach((reg) => {
    if (reg.eventId !== eventId) return;
    const entry = entriesMap.get(reg.id);
    if (!entry) return;

    const prevInterview = reg.vipassanaInterviews?.[sessionKey];
    const hasChecklistKeys = entry.checklist && Object.keys(entry.checklist).length > 0;
    const isModified =
      Boolean(prevInterview) ||
      entry.result !== 'PENDING' ||
      Boolean(entry.remarks && entry.remarks.trim()) ||
      hasChecklistKeys;

    if (!reg.vipassanaInterviews) reg.vipassanaInterviews = {};
    reg.vipassanaInterviews[sessionKey] = {
      sessionNumber,
      date: sessionDate,
      meditationMasterName,
      checklist: entry.checklist,
      result: entry.result,
      remarks: entry.remarks,
      updatedAt: nowIso,
    };

    if (entry.result === 'PASS') {
      reg.passedMeditation = true;
    } else if (entry.result === 'NOT_PASS') {
      reg.passedMeditation = false;
    }

    reg.updatedAt = nowIso;
    if (isModified) {
      updatedRegs.push(reg);
    }
  });

  writeLocalJson('event_registrations.json', local);
  await syncUpdatedRegistrationsToSheets(updatedRegs);
  return { success: true, updatedCount: entries.length };
}

export interface OfflineScanItem {
  studentCodeOrId: string;
  dayKey: string;
  periodKey: 'p1' | 'p2' | 'p3' | 'p4';
  status: 'PRESENT' | 'LATE';
  checkInTime: string;
  scannedAt?: string;
}

export async function batchVipassanaOfflineSync(
  eventId: string,
  items: OfflineScanItem[]
): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
  if (!eventId || !Array.isArray(items) || items.length === 0) {
    return { success: true, syncedCount: 0, errors: [] };
  }

  let syncedCount = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      const res = await recordVipassanaScanCheckin({
        eventId,
        studentCodeOrId: item.studentCodeOrId,
        dayKey: item.dayKey,
        periodKey: item.periodKey,
        status: item.status,
        checkInTime: item.checkInTime,
        recordedBy: 'OFFLINE_SYNC',
      });
      if (res.success) {
        syncedCount += 1;
      } else {
        errors.push(`รหัส ${item.studentCodeOrId}: ${res.error || 'ไม่สำเร็จ'}`);
      }
    } catch (err: unknown) {
      errors.push(`รหัส ${item.studentCodeOrId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { success: true, syncedCount, errors };
}

export interface BatchIssueCertificatesPayload {
  eventId: string;
  registrationIds: string[];
  docNoPrefix?: string;
  issueDateTh?: string;
  issueDateEn?: string;
  signerNameTh?: string;
  signerTitleTh?: string;
  signerNameEn?: string;
  signerTitleEn?: string;
}

export async function batchApproveAndIssueVipassanaCertificates(
  payload: BatchIssueCertificatesPayload
): Promise<{ success: boolean; issuedCount: number; certIds: string[]; error?: string }> {
  const { eventId, registrationIds, docNoPrefix = '8002', issueDateTh, issueDateEn, signerNameTh, signerTitleTh } = payload;
  if (!eventId || !Array.isArray(registrationIds) || registrationIds.length === 0) {
    return { success: false, issuedCount: 0, certIds: [], error: 'กรุณาเลือกนิสิตที่ต้องการออกวุฒิบัตร' };
  }

  const events = await getEvents();
  const targetEvent = events.find((e) => e.id === eventId);
  const eventTitle = targetEvent?.title || 'โครงการปฏิบัติวิปัสสนากัมมัฏฐาน';
  const academicYear = targetEvent?.academicYear || '2569';

  const localRegs = readLocalJson<EventRegistration[]>('event_registrations.json', []);
  const localCerts = readLocalJson<Record<string, unknown>[]>('certificate_requests.json', []);

  const regMap = new Map<string, EventRegistration>();
  localRegs.forEach((r) => regMap.set(r.id, r));

  const now = new Date();
  const nowIso = now.toISOString();
  const nowYear = toBuddhistYear(now);
  const targetRegs = registrationIds.map((id) => regMap.get(id)).filter(Boolean) as EventRegistration[];

  const certIds: string[] = [];
  let currentDocSeq = localCerts.length + 1;

  for (const reg of targetRegs) {
    const padSeq = String(currentDocSeq).padStart(3, '0');
    const docNo = `มจร ${docNoPrefix}/ว.วป-${academicYear}-${padSeq}`;
    const certId = `cert-vipassana-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    reg.status = 'ATTENDED';
    reg.passedMeditation = true;
    reg.certificateIssued = true;
    reg.certificateDocNo = docNo;
    reg.certificateIssuedAt = nowIso;
    reg.updatedAt = nowIso;

    const newCertRecord = {
      id: certId,
      createdAt: nowIso,
      studentCode: reg.studentCode,
      fullName: reg.studentName,
      monasticName: reg.studentName,
      certType: 'CERT_VIPASSANA_MEDITATION',
      degreeLevel: reg.degreeLevel || 'ปริญญาตรี',
      major: reg.major || 'พระพุทธศาสนา',
      vassa: reg.vasa || '',
      requestPurpose: `ผ่านการปฏิบัติวิปัสสนากัมมัฏฐาน ${eventTitle}`,
      status: 'APPROVED',
      docNo,
      docNoPrefix,
      issueDateTh: issueDateTh || `${now.getDate()} ธันวาคม ${nowYear}`,
      issueDateEn: issueDateEn || `December ${now.getDate()}, ${now.getFullYear()}`,
      signerNameTh: signerNameTh || 'พระธรรมวชิราจารย์, ศ.ดร.',
      signerTitleTh: signerTitleTh || 'คณบดีคณะพุทธศาสตร์',
      targetAudience: reg.programType === 'ENGLISH' ? 'INTERNATIONAL' : 'THAI',
      applicantType: 'STUDENT',
      note: JSON.stringify({
        eventId,
        eventTitle,
        groupNumber: reg.groupNumber,
        groupSpecificCode: reg.groupSpecificCode,
        autoIssuedFromVipassana: true,
      }),
    };

    localCerts.push(newCertRecord);
    certIds.push(certId);
    currentDocSeq += 1;
  }

  writeLocalJson('event_registrations.json', localRegs);
  writeLocalJson('certificate_requests.json', localCerts);
  await syncUpdatedRegistrationsToSheets(targetRegs);

  return { success: true, issuedCount: certIds.length, certIds };
}

export async function updateVipassanaEvaluationStatus(params: {
  eventId: string;
  registrationId?: string;
  registrationIds?: string[];
  decision: 'PASS' | 'NOT_PASS' | 'RESET';
}): Promise<{ success: boolean; updatedCount: number }> {
  const { eventId, registrationId, registrationIds, decision } = params;
  const localRegs = await loadAndHydrateRegistrations();
  const targetIds = new Set<string>(
    registrationIds && registrationIds.length > 0
      ? registrationIds
      : registrationId
      ? [registrationId]
      : []
  );

  if (targetIds.size === 0) {
    return { success: false, updatedCount: 0 };
  }

  const nowIso = new Date().toISOString();
  const updatedRegs: EventRegistration[] = [];

  localRegs.forEach((r) => {
    if (r.eventId !== eventId) return;
    if (!targetIds.has(r.id)) return;

    if (decision === 'PASS') {
      r.passedMeditation = true;
      r.finalMeditationResult = 'PASS';
    } else if (decision === 'NOT_PASS') {
      r.passedMeditation = false;
      r.finalMeditationResult = 'NOT_PASS';
    } else if (decision === 'RESET') {
      delete r.finalMeditationResult;
      delete r.passedMeditation;
    }
    r.updatedAt = nowIso;
    updatedRegs.push(r);
  });

  writeLocalJson('event_registrations.json', localRegs);
  await syncUpdatedRegistrationsToSheets(updatedRegs);
  return { success: true, updatedCount: updatedRegs.length };
}
