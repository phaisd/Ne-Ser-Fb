import { EventRegistration } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from '../storageHelper';
import { getStudents } from '../studentService';
import { getEvents } from './eventCoreService';

// ----------------- EVENT REGISTRATIONS -----------------

export async function getEventRegistrations(
  eventId?: string,
  studentCode?: string
): Promise<EventRegistration[]> {
  const events = await getEvents();
  const eventTitleMap = new Map(events.map((e) => [e.id, e.title]));

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
  const localMap = new Map<string, any>();
  raw.forEach((r) => {
    if (r.id) localMap.set(r.id, r);
  });

  let list: EventRegistration[] = [];

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('EventRegistrations!A2:U');
      if (rows && rows.length > 0) {
        list = rows.map((r) => {
          const id = r[0] || '';
          const local = localMap.get(id) || {};
          let dailyAttendance = local.dailyAttendance || {};
          if (r[17]) {
            try {
              const parsed = typeof r[17] === 'string' ? JSON.parse(r[17]) : r[17];
              dailyAttendance = { ...parsed, ...(local.dailyAttendance || {}) };
            } catch {
              // fallback to local
            }
          }
          let vipassanaInterviews = local.vipassanaInterviews || {};
          if (r[18]) {
            try {
              const parsed = typeof r[18] === 'string' ? JSON.parse(r[18]) : r[18];
              vipassanaInterviews = { ...parsed, ...(local.vipassanaInterviews || {}) };
            } catch {
              // fallback to local
            }
          }
          let attendedDays: number[] | undefined = local.attendedDays;
          if (!attendedDays && r[19]) {
            try {
              attendedDays = typeof r[19] === 'string' ? JSON.parse(r[19]) : r[19];
            } catch {}
          }
          let extraMeta: Record<string, any> = {};
          if (r[20]) {
            try {
              extraMeta = typeof r[20] === 'string' ? JSON.parse(r[20]) : r[20];
            } catch {}
          }
          const sCode = r[2] || local.studentCode || '';
          const sInfo = studentMap.get(sCode.trim().toLowerCase()) || {};
          const groupNum = r[11]
            ? Number(r[11])
            : local.groupNumber !== undefined
            ? Number(local.groupNumber)
            : r[9]
            ? parseInt(String(r[9]).replace(/\D/g, ''), 10) || undefined
            : undefined;

          return {
            id,
            eventId: r[1] || local.eventId || '',
            eventTitle: eventTitleMap.get(r[1] || local.eventId) || 'กิจกรรมนิสิต',
            studentCode: sCode,
            studentName: r[3] || local.studentName || sInfo.fullName || '',
            status: (local.status || r[4] || 'REGISTERED') as any,
            role: (r[5] || local.role || 'STUDENT') as any,
            major: r[6] || local.major || sInfo.major || 'พระพุทธศาสนา',
            yearLevel: r[7] ? Number(r[7]) : (local.yearLevel || sInfo.yearLevel || 1),
            department: r[8] || local.department || sInfo.department || '',
            groupName: r[9] || local.groupName || (groupNum ? `กลุ่มที่ ${groupNum}` : 'ทั่วไป'),
            createdAt: r[10] || local.createdAt || new Date().toISOString(),
            groupNumber: groupNum,
            groupSpecificCode: r[12] || local.groupSpecificCode || undefined,
            degreeLevel: r[13] || local.degreeLevel || sInfo.degree || 'ปริญญาตรี',
            programType: r[14] || local.programType || sInfo.programType || 'THAI',
            remarks: local.remarks !== undefined && local.remarks !== '' ? local.remarks : (r[15] || ''),
            attendedAt: local.attendedAt || r[16] || '',
            age: local.age ?? extraMeta.age ?? sInfo.age,
            vasa: local.vasa || extraMeta.vasa || sInfo.vasa || '',
            dailyAttendance,
            vipassanaInterviews,
            attendedDays,
            passedMeditation: local.passedMeditation ?? extraMeta.passedMeditation,
            finalMeditationResult: local.finalMeditationResult ?? extraMeta.finalMeditationResult,
            certificateIssued: local.certificateIssued ?? extraMeta.certificateIssued,
            certificateDocNo: local.certificateDocNo ?? extraMeta.certificateDocNo,
            certificateIssuedAt: local.certificateIssuedAt ?? extraMeta.certificateIssuedAt,
            updatedAt: local.updatedAt || extraMeta.updatedAt,
          };
        });
      }
    } catch (err) {
      console.warn('Google Sheets read error for EventRegistrations, falling back to local file:', err);
    }
  }

  if (list.length === 0 && raw.length > 0) {
    list = raw.map((r) => {
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
        groupSpecificCode: r.groupSpecificCode || undefined,
        age: r.age ?? sInfo.age,
        vasa: r.vasa || sInfo.vasa || '',
        dailyAttendance: r.dailyAttendance || {},
        vipassanaInterviews: r.vipassanaInterviews || {},
        attendedDays: Array.isArray(r.attendedDays) ? r.attendedDays : undefined,
        passedMeditation: r.passedMeditation,
        finalMeditationResult: r.finalMeditationResult,
        certificateIssued: r.certificateIssued,
        certificateDocNo: r.certificateDocNo,
        certificateIssuedAt: r.certificateIssuedAt,
        remarks: r.remarks || '',
        attendedAt: r.attendedAt || '',
        createdAt: r.createdAt ? String(r.createdAt) : new Date().toISOString(),
        updatedAt: r.updatedAt,
      };
    });
  }

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

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await gClient.appendValues('EventRegistrations!A:R', [[
        newReg.id,
        newReg.eventId,
        newReg.studentCode,
        newReg.studentName,
        newReg.status,
        newReg.role,
        newReg.major,
        newReg.yearLevel,
        newReg.department,
        newReg.groupName,
        newReg.createdAt,
        newReg.groupNumber !== undefined ? String(newReg.groupNumber) : '',
        newReg.groupSpecificCode || '',
        newReg.degreeLevel || '',
        newReg.programType || 'THAI',
        newReg.remarks || '',
        newReg.attendedAt || '',
        JSON.stringify(newReg.dailyAttendance || {}),
      ]]);
    } catch (err) {
      console.warn('Google Sheets append failed for EventRegistration:', err);
    }
  }

  return newReg;
}

export interface BatchImportResult {
  totalSubmitted: number;
  importedCount: number;
  skippedCount: number;
  replacedCount: number;
  items: EventRegistration[];
}

export async function batchImportEventRegistrations(
  eventId: string,
  items: Array<{
    studentCode: string;
    studentName: string;
    groupNumber?: number;
    groupName?: string;
    groupSpecificCode?: string;
    degreeLevel?: string;
    programType?: string;
    major?: string;
    yearLevel?: number;
    vasa?: string | number;
    remarks?: string;
  }>,
  mode: 'APPEND' | 'REPLACE_ALL' | 'REPLACE_EVENT' = 'APPEND'
): Promise<BatchImportResult> {
  const targetEventId = String(eventId || '').trim();
  if (!targetEventId) {
    throw new Error('กรุณาระบุ eventId ที่ถูกต้อง');
  }

  const events = await getEvents();
  const targetEvent = events.find((e) => String(e.id || '').trim() === targetEventId);
  const eventTitle = targetEvent?.title || 'โครงการปฏิบัติวิปัสสนากัมมัฏฐาน';

  let studentMap = new Map<string, any>();
  try {
    const students = await getStudents();
    students.forEach((s) => {
      if (s.studentCode) studentMap.set(s.studentCode.trim().toLowerCase(), s);
    });
  } catch (e) {
    console.warn('Could not load students for enrichment in batchImport:', e);
  }

  let local = readLocalJson<EventRegistration[]>('event_registrations.json', []);

  if (mode === 'REPLACE_ALL' || mode === 'REPLACE_EVENT') {
    local = local.filter((r) => String(r.eventId || '').trim() !== targetEventId);
  }

  const existingCodesInEvent = new Set<string>();
  local
    .filter((r) => String(r.eventId || '').trim() === targetEventId)
    .forEach((r) => {
      if (r.studentCode) existingCodesInEvent.add(r.studentCode.trim().toLowerCase());
    });

  const nowIso = new Date().toISOString();
  const createdItems: EventRegistration[] = [];
  let skippedCount = 0;
  let replacedCount = (mode === 'REPLACE_ALL' || mode === 'REPLACE_EVENT') ? local.length : 0;

  const seenInBatch = new Set<string>();

  for (let idx = 0; idx < items.length; idx++) {
    const row = items[idx];
    const sCode = String(row.studentCode || '').trim();
    if (!sCode) {
      skippedCount++;
      continue;
    }

    const codeLower = sCode.toLowerCase();
    if (seenInBatch.has(codeLower)) {
      skippedCount++;
      continue;
    }
    seenInBatch.add(codeLower);

    if (mode === 'APPEND' && existingCodesInEvent.has(codeLower)) {
      skippedCount++;
      continue;
    }

    const sInfo = studentMap.get(codeLower) || {};
    const gNum = row.groupNumber !== undefined ? Number(row.groupNumber) : undefined;
    const gName = row.groupName || (gNum ? `กลุ่มที่ ${gNum}` : 'ทั่วไป');

    const newReg: EventRegistration = {
      id: `reg-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      eventId: targetEventId,
      eventTitle,
      studentCode: sCode,
      studentName: row.studentName || sInfo.fullName || sCode,
      groupNumber: gNum,
      groupName: gName,
      groupSpecificCode: row.groupSpecificCode || undefined,
      status: 'REGISTERED',
      role: 'STUDENT',
      degreeLevel: row.degreeLevel || sInfo.degree || 'ปริญญาตรี',
      programType: (row.programType as any) || (gNum === 12 ? 'ENGLISH' : sInfo.programType || 'THAI'),
      major: row.major || sInfo.major || 'พระพุทธศาสนา',
      yearLevel: row.yearLevel !== undefined ? Number(row.yearLevel) : (sInfo.yearLevel || 1),
      vasa: row.vasa || sInfo.vasa || '',
      remarks: row.remarks || '',
      dailyAttendance: {},
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    createdItems.push(newReg);
    existingCodesInEvent.add(codeLower);
  }

  local.push(...createdItems);
  writeLocalJson('event_registrations.json', local);

  const gClient = getSheetsClient();
  if (gClient && createdItems.length > 0) {
    try {
      const appendRows = createdItems.map((reg) => [
        reg.id,
        reg.eventId,
        reg.studentCode,
        reg.studentName,
        reg.status || 'REGISTERED',
        reg.role || 'STUDENT',
        reg.major || '',
        reg.yearLevel || 1,
        reg.department || '',
        reg.groupName || '',
        reg.createdAt || new Date().toISOString(),
        reg.groupNumber || '',
        reg.groupSpecificCode || '',
        reg.degreeLevel || '',
        reg.programType || '',
        reg.remarks || '',
        reg.attendedAt || '',
        JSON.stringify(reg.dailyAttendance || {}),
      ]);
      await gClient.appendValues('EventRegistrations!A:R', appendRows);
    } catch (err) {
      console.warn('Google Sheets append failed for EventRegistrations:', err);
    }
  }

  return {
    totalSubmitted: items.length,
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
