import { StudentEvent, EventRegistration, SatipatthanaChecklist } from '@/types';
import { toBuddhistYear } from '@/lib/utils/formatters';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';
import { getStudents } from './studentService';

// ----------------- EVENTS -----------------

export async function getEvents(): Promise<StudentEvent[]> {
  const raw = readLocalJson<any[]>('events.json', []);
  const localMap = new Map<string, any>();
  raw.forEach((e) => localMap.set(e.id, e));

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Events!A2:O');
      if (rows && rows.length > 0) {
        return rows.map((r) => {
          const id = r[0] || '';
          const local = localMap.get(id) || {};
          return {
            ...local,
            id,
            title: r[1] || local.title || '',
            eventType: r[2] || local.eventType || 'SPECIAL',
            startDate: r[3] || local.startDate || '',
            endDate: r[4] || local.endDate || '',
            eventTime: r[5] || local.eventTime || '08:30 - 16:30 น.',
            location: r[6] || local.location || '',
            academicYear: r[7] || local.academicYear || '2569',
            semester: r[8] ? parseInt(r[8], 10) : (local.semester || 1),
            maxParticipants: r[9] ? parseInt(r[9], 10) : (local.maxParticipants || 100),
            status: r[10] || local.status || 'ACTIVE',
            targetDegree: r[11] || local.targetDegree || 'ALL',
            targetProgram: r[12] || local.targetProgram || 'ALL',
            coordinatorName: r[13] || local.coordinatorName || '',
            showCoordinator: r[14] !== undefined ? (r[14] === 'TRUE' || r[14] === true) : (local.showCoordinator !== false),
          };
        });
      }
    } catch (err) {
      console.warn('Google Sheets read error for Events, falling back to local file:', err);
    }
  }

  return raw.map((e) => ({
    id: e.id,
    title: e.title || '',
    description: e.description || '',
    eventType: e.eventType || 'SPECIAL',
    startDate: e.startDate ? String(e.startDate).substring(0, 10) : '',
    endDate: e.endDate ? String(e.endDate).substring(0, 10) : '',
    eventTime: e.eventTime || '08:30 - 16:30 น.',
    location: e.location || 'คณะพุทธศาสตร์ มจร',
    academicYear: e.academicYear || '2569',
    semester: e.semester || 1,
    maxParticipants: e.maxParticipants || e.capacity || 100,
    activityHours: e.activityHours || 3,
    status: e.status || (e.isActive !== false ? 'ACTIVE' : 'COMPLETED'),
    isActive: e.isActive !== false,
    targetDegree: e.targetDegree || 'ALL', // ALL, BACHELOR, MASTER, DOCTORAL
    targetProgram: e.targetProgram || 'ALL', // ALL, THAI, ENGLISH
    targetMajors: e.targetMajors || [],
    targetYearLevels: e.targetYearLevels || [1, 2, 3, 4],
    coordinatorName: e.coordinatorName || '',
    coordinatorTitle: e.coordinatorTitle || 'ผู้รับผิดชอบโครงการ คณะพุทธศาสตร์',
    coordinatorPhone: e.coordinatorPhone || '',
    coordinatorEmail: e.coordinatorEmail || '',
    showCoordinator: e.showCoordinator !== false,
    meditationConfig: e.meditationConfig || {},
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  }));
}

export async function createEvent(data: Partial<StudentEvent>): Promise<StudentEvent> {
  const localList = readLocalJson<any[]>('events.json', []);
  const newEvent: StudentEvent = {
    id: data.id || 'evt-' + Date.now(),
    title: data.title || 'โครงการใหม่',
    description: data.description || '',
    eventType: data.eventType || 'SPECIAL',
    startDate: data.startDate || new Date().toISOString().substring(0, 10),
    endDate: data.endDate || new Date().toISOString().substring(0, 10),
    eventTime: data.eventTime || '08:30 - 16:30 น.',
    location: data.location || 'คณะพุทธศาสตร์ มจร',
    academicYear: data.academicYear || '2569',
    semester: data.semester || 1,
    maxParticipants: data.maxParticipants || 100,
    activityHours: data.activityHours || 3,
    status: data.status || 'ACTIVE',
    isActive: true,
    targetDegree: data.targetDegree || 'ALL',
    targetProgram: data.targetProgram || 'ALL',
    targetMajors: data.targetMajors || [],
    targetYearLevels: data.targetYearLevels || [1, 2, 3, 4],
    coordinatorName: data.coordinatorName || '',
    coordinatorTitle: data.coordinatorTitle || 'ผู้รับผิดชอบโครงการ',
    coordinatorPhone: data.coordinatorPhone || '',
    coordinatorEmail: data.coordinatorEmail || '',
    showCoordinator: data.showCoordinator !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localList.unshift(newEvent);
  writeLocalJson('events.json', localList);

  // Sync to sheets in background
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await gClient.appendValues('Events!A:O', [[
        newEvent.id,
        newEvent.title,
        newEvent.eventType,
        newEvent.startDate,
        newEvent.endDate,
        newEvent.eventTime,
        newEvent.location,
        newEvent.academicYear,
        newEvent.semester,
        newEvent.maxParticipants,
        newEvent.status,
        newEvent.targetDegree,
        newEvent.targetProgram,
        newEvent.coordinatorName,
        newEvent.showCoordinator ? 'TRUE' : 'FALSE',
      ]]);
    } catch (err) {
      console.warn('Google Sheets append failed for Events:', err);
    }
  }

  return newEvent;
}

export async function updateEvent(id: string, updates: Partial<StudentEvent>): Promise<StudentEvent | null> {
  const localList = readLocalJson<any[]>('events.json', []);
  const idx = localList.findIndex((e) => e.id === id);
  if (idx === -1) return null;

  localList[idx] = {
    ...localList[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeLocalJson('events.json', localList);
  return localList[idx];
}

export async function deleteEvent(id: string): Promise<boolean> {
  const localList = readLocalJson<any[]>('events.json', []);
  const nextList = localList.filter((e) => e.id !== id);
  if (nextList.length === localList.length) return false;

  writeLocalJson('events.json', nextList);
  return true;
}

// ----------------- EVENT REGISTRATIONS -----------------

export async function getEventRegistrations(
  eventId?: string,
  studentCode?: string
): Promise<EventRegistration[]> {
  const events = await getEvents();
  const eventTitleMap = new Map(events.map((e) => [e.id, e.title]));

  // Read students to enrich degreeLevel, programType, major if missing
  let studentMap = new Map<string, any>();
  try {
    const students = await getStudents();
    students.forEach((s) => {
      if (s.studentCode) studentMap.set(s.studentCode.trim().toLowerCase(), s);
    });
  } catch (e) {
    console.warn('Could not load students for enrichment:', e);
  }

  const raw = readLocalJson<any[]>('event_registrations.json', []);
  let list: EventRegistration[] = raw.map((r) => {
    const sInfo = studentMap.get((r.studentCode || '').trim().toLowerCase()) || {};
    const degree = r.degreeLevel || sInfo.degree || (sInfo.yearLevel ? 'ปริญญาตรี' : 'ปริญญาตรี');
    const prog = r.programType || r.program || sInfo.programType || 'THAI';

    return {
      id: r.id,
      eventId: r.eventId,
      eventTitle: eventTitleMap.get(r.eventId) || 'กิจกรรมนิสิต',
      studentCode: r.studentCode || '',
      studentName: r.studentName || sInfo.fullName || '',
      status: r.status || 'REGISTERED',
      role: r.role || 'STUDENT',
      degreeLevel: degree,
      programType: prog,
      major: r.major || sInfo.major || 'พระพุทธศาสนา',
      yearLevel: r.yearLevel || sInfo.yearLevel || 1,
      department: r.department || sInfo.department || '',
      groupName: r.groupName || (r.groupNumber ? `กลุ่มที่ ${r.groupNumber}` : 'ทั่วไป'),
      groupNumber: r.groupNumber !== undefined ? Number(r.groupNumber) : undefined,
      vasa: r.vasa || sInfo.vasa || '',
      dailyAttendance: r.dailyAttendance || {},
      remarks: r.remarks || '',
      attendedAt: r.attendedAt || '',
      createdAt: r.createdAt ? String(r.createdAt) : new Date().toISOString(),
      updatedAt: r.updatedAt,
    };
  });

  if (eventId && eventId !== 'ALL') list = list.filter((r) => r.eventId === eventId);
  if (studentCode) list = list.filter((r) => r.studentCode.toLowerCase().includes(studentCode.toLowerCase()));

  return list;
}

export async function registerStudentForEvent(
  data: Omit<EventRegistration, 'id' | 'createdAt' | 'status'>
): Promise<EventRegistration> {
  const newReg: EventRegistration = {
    ...data,
    id: 'reg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    status: 'REGISTERED',
    createdAt: new Date().toISOString(),
  };

  const local = readLocalJson<any[]>('event_registrations.json', []);
  local.unshift(newReg);
  writeLocalJson('event_registrations.json', local);

  return newReg;
}

export interface BatchEventRegistrationInput {
  studentCode: string;
  studentName: string;
  groupSpecificCode?: string; // เลขเฉพาะกลุ่ม เช่น T101, T102, I301
  groupNumber?: number;
  groupName?: string;
  programType?: string;
  degreeLevel?: string;
  major?: string;
  yearLevel?: number;
  department?: string;
  role?: string;
  vasa?: string | number;
  remarks?: string;
  status?: 'REGISTERED' | 'ATTENDED' | 'CANCELLED';
}

export interface BatchImportRegistrationsResult {
  importedCount: number;
  skippedCount: number;
  replacedCount: number;
  items: EventRegistration[];
}

/**
 * Batch imports grouped student registrations into an event while preventing duplicates
 * by normalized studentCode, groupSpecificCode, or (groupNumber + studentName).
 */
export async function batchImportEventRegistrations(
  eventId: string,
  items: BatchEventRegistrationInput[],
  mode: 'APPEND' | 'REPLACE_EVENT' = 'APPEND'
): Promise<BatchImportRegistrationsResult> {
  const local = readLocalJson<EventRegistration[]>('event_registrations.json', []);
  const events = await getEvents();
  const targetEvent = events.find((e) => e.id === eventId);

  let replacedCount = 0;
  const remaining =
    mode === 'REPLACE_EVENT'
      ? local.filter((r) => {
          if (r.eventId === eventId) {
            replacedCount += 1;
            return false;
          }
          return true;
        })
      : [...local];

  const existingCodes = new Set<string>();
  const existingGroupSpecificCodes = new Set<string>();
  const existingGroupNames = new Set<string>();
  for (const r of remaining) {
    if (r.eventId !== eventId) continue;
    const codeKey = String(r.studentCode || '').trim().toLowerCase();
    if (codeKey) existingCodes.add(codeKey);
    const gcodeKey = String(r.groupSpecificCode || '').trim().toLowerCase();
    if (gcodeKey) existingGroupSpecificCodes.add(gcodeKey);
    const nameKey = `${r.groupNumber || ''}|${String(r.studentName || '').trim().toLowerCase()}`;
    if (r.studentName) existingGroupNames.add(nameKey);
  }

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const createdItems: EventRegistration[] = [];
  let skippedCount = 0;

  items.forEach((item, index) => {
    const cleanCode = String(item.studentCode || '').trim();
    const cleanGroupCode = String(item.groupSpecificCode || '').trim();
    const cleanName = String(item.studentName || '').trim();
    if (!cleanName || (!cleanCode && !cleanGroupCode)) {
      skippedCount += 1;
      return;
    }

    const effectiveCode = cleanCode || cleanGroupCode;
    const codeKey = effectiveCode.toLowerCase();
    const gcodeKey = cleanGroupCode.toLowerCase();
    const nameKey = `${item.groupNumber || ''}|${cleanName.toLowerCase()}`;

    // Duplicate check:
    // If groupSpecificCode is provided, check if that groupSpecificCode exists or same studentName in that group.
    // If not, check if studentCode exists or same studentName in that group.
    let isDuplicate = false;
    if (gcodeKey) {
      if (existingGroupSpecificCodes.has(gcodeKey) || existingGroupNames.has(nameKey)) {
        isDuplicate = true;
      }
    } else {
      if (existingCodes.has(codeKey) || existingGroupNames.has(nameKey)) {
        isDuplicate = true;
      }
    }

    if (isDuplicate) {
      skippedCount += 1;
      return;
    }

    if (gcodeKey) existingGroupSpecificCodes.add(gcodeKey);
    existingCodes.add(codeKey);
    existingGroupNames.add(nameKey);

    const reg: EventRegistration = {
      id: `reg-${now}-${index}-${Math.floor(Math.random() * 1000)}`,
      eventId,
      eventTitle: targetEvent?.title,
      studentCode: effectiveCode,
      groupSpecificCode: cleanGroupCode || undefined,
      studentName: cleanName,
      status: item.status || 'REGISTERED',
      role: item.role || 'STUDENT',
      degreeLevel: item.degreeLevel,
      programType: item.programType,
      major: item.major,
      yearLevel: item.yearLevel,
      department: item.department,
      groupNumber: item.groupNumber,
      groupName: item.groupName || (item.groupNumber ? `กลุ่มที่ ${item.groupNumber}` : undefined),
      vasa: item.vasa,
      remarks: item.remarks,
      createdAt: nowIso,
    };

    createdItems.push(reg);
  });

  // Prepend created items in natural order before remaining rows
  const nextList = [...createdItems, ...remaining];
  writeLocalJson('event_registrations.json', nextList);

  return {
    importedCount: createdItems.length,
    skippedCount,
    replacedCount,
    items: createdItems,
  };
}

export async function checkInEventStudent(
  registrationId: string,
  status: 'ATTENDED' | 'REGISTERED' | 'CANCELLED' = 'ATTENDED'
): Promise<boolean> {
  const local = readLocalJson<any[]>('event_registrations.json', []);
  const found = local.find((r) => r.id === registrationId);
  if (found) {
    found.status = status;
    found.attendedAt = new Date().toISOString();
    writeLocalJson('event_registrations.json', local);
  }

  return true;
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
  const local = readLocalJson<any[]>('event_registrations.json', []);
  const recordMap = new Map(records.map((r) => [r.registrationId, r]));

  let updatedCount = 0;
  local.forEach((reg) => {
    if (reg.eventId === eventId && recordMap.has(reg.id)) {
      const rec = recordMap.get(reg.id)!;
      if (!reg.dailyAttendance) reg.dailyAttendance = {};
      const existingDay = reg.dailyAttendance[dayKey] || {};
      reg.dailyAttendance[dayKey] = {
        p1: rec.p1 ? { ...existingDay.p1, ...rec.p1 } : (existingDay.p1 || { status: 'PRESENT' }),
        p2: rec.p2 ? { ...existingDay.p2, ...rec.p2 } : (existingDay.p2 || { status: 'PRESENT' }),
        p3: rec.p3 ? { ...existingDay.p3, ...rec.p3 } : (existingDay.p3 || { status: 'PRESENT' }),
        p4: rec.p4 ? { ...existingDay.p4, ...rec.p4 } : (existingDay.p4 || { status: 'PRESENT' }),
      };
      if (rec.remark !== undefined) reg.remarks = rec.remark;
      reg.updatedAt = new Date().toISOString();
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    writeLocalJson('event_registrations.json', local);
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
  const local = readLocalJson<EventRegistration[]>('event_registrations.json', []);
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

  const newStatus = params.status || (isAlreadyCheckedIn ? existingPeriod.status : 'PRESENT');
  const checkInTime = existingPeriod?.checkInTime || nowTime;

  reg.dailyAttendance[dayKey][periodKey] = {
    status: newStatus,
    checkInTime,
    recordedBy: recordedBy || 'LIVE_SCANNER',
  };

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

  return {
    success: true,
    registration: reg,
    isAlreadyCheckedIn: Boolean(isAlreadyCheckedIn),
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

  const local = readLocalJson<EventRegistration[]>('event_registrations.json', []);
  const sessionKey = `s${sessionNumber}`;
  const nowIso = new Date().toISOString();
  let updatedCount = 0;

  const entriesMap = new Map<string, (typeof entries)[0]>();
  entries.forEach((e) => {
    entriesMap.set(e.registrationId, e);
  });

  local.forEach((reg) => {
    if (reg.eventId !== eventId) return;
    const entry = entriesMap.get(reg.id);
    if (!entry) return;

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
    updatedCount += 1;
  });

  writeLocalJson('event_registrations.json', local);
  return { success: true, updatedCount };
}

export interface OfflineScanItem {
  studentCodeOrId: string;
  dayKey: string;
  periodKey: 'p1' | 'p2' | 'p3' | 'p4';
  status: 'PRESENT' | 'LATE';
  checkInTime: string;
  scannedAt?: string;
}

/**
 * Batch syncs offline check-in scans recorded by live barcode/QR scanners.
 */
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

/**
 * Approves registrations and automatically issues digital certificates with unique doc numbers.
 */
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

    // 1. Update Registration Record
    reg.status = 'ATTENDED';
    reg.passedMeditation = true;
    reg.certificateIssued = true;
    reg.certificateDocNo = docNo;
    reg.certificateIssuedAt = nowIso;
    reg.updatedAt = nowIso;

    // 2. Create Certificate Request Record
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

  return { success: true, issuedCount: certIds.length, certIds };
}
