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
      const rows = await gClient.getValues('EventRegistrations!A2:AJ');
      if (rows && rows.length > 0) {
        const loaded: EventRegistration[] = [];
        for (const rawR of rows) {
          const isShifted = !rawR[0] && rawR[17] && String(rawR[17]).startsWith('reg-');
          const r = isShifted ? rawR.slice(17) : rawR;
          const id = r[0] || '';
          const evId = r[1] || localMap.get(id)?.eventId || '';
          if (!id || !evId) continue;

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

          loaded.push({
            id,
            eventId: evId,
            eventTitle: eventTitleMap.get(evId) || 'กิจกรรมนิสิต',
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
            seatZone: local.seatZone || extraMeta.seatZone,
            seatNumber: local.seatNumber || extraMeta.seatNumber,
            seatCheckinAt: local.seatCheckinAt || extraMeta.seatCheckinAt,
            seatCheckinBy: local.seatCheckinBy || extraMeta.seatCheckinBy,
            updatedAt: local.updatedAt || extraMeta.updatedAt,
          });
        }
        list = loaded;
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
        seatZone: r.seatZone,
        seatNumber: r.seatNumber,
        seatCheckinAt: r.seatCheckinAt,
        seatCheckinBy: r.seatCheckinBy,
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
  updatedCount?: number;
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
  let studentNameMap = new Map<string, any>();
  const normalizeStudentName = (name: string) =>
    name
      .replace(/^(พระมหา|พระครู|พระ|สามเณร|แม่ชี|นาย|นางสาว|นาง|ดร\.)\s*/, '')
      .replace(/\s+/g, '')
      .toLowerCase();

  try {
    const students = await getStudents();
    students.forEach((s) => {
      if (s.studentCode) studentMap.set(s.studentCode.trim().toLowerCase(), s);
      const nameKey = normalizeStudentName(s.fullName || `${s.firstName || ''} ${s.lastName || ''}`);
      if (nameKey) studentNameMap.set(nameKey, s);
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
  const updatedItems: EventRegistration[] = [];
  let updatedCount = 0;
  let skippedCount = 0;
  let replacedCount = (mode === 'REPLACE_ALL' || mode === 'REPLACE_EVENT') ? local.length : 0;

  const seenCodesInBatch = new Set<string>();
  const seenGroupsInBatch = new Set<string>();

  for (let idx = 0; idx < items.length; idx++) {
    const row = items[idx];
    const sCode = String(row.studentCode || '').trim();
    if (!sCode && !row.groupSpecificCode) {
      skippedCount++;
      continue;
    }

    const isStudentId = (v: string) => /^\d{8,12}$/.test(v.replace(/[\s\u00A0]+/g, ''));
    const isGroupCode = (v: string) =>
      /^[A-Za-z0-9_-]{2,10}$/.test(v.trim()) && !isStudentId(v);

    let finalStudentCode = sCode;
    let finalGroupCode = row.groupSpecificCode ? String(row.groupSpecificCode).trim() : undefined;

    // Smart detection & auto-correction if swapped
    if (isGroupCode(finalStudentCode) && finalGroupCode && isStudentId(finalGroupCode)) {
      const tmp = finalStudentCode;
      finalStudentCode = finalGroupCode;
      finalGroupCode = tmp;
    } else if (isGroupCode(finalStudentCode) && !finalGroupCode) {
      finalGroupCode = finalStudentCode;
      // Look up real student ID by student name if present in student directory
      const nameKey = normalizeStudentName(row.studentName || '');
      const matchedStudent = nameKey ? studentNameMap.get(nameKey) : undefined;
      if (matchedStudent?.studentCode) {
        finalStudentCode = matchedStudent.studentCode;
      }
    } else if (!finalStudentCode && finalGroupCode) {
      if (isStudentId(finalGroupCode)) {
        finalStudentCode = finalGroupCode;
        finalGroupCode = undefined;
      } else {
        finalStudentCode = finalGroupCode;
      }
    }

    const codeLower = (finalStudentCode || '').toLowerCase();
    const groupLower = (finalGroupCode || '').toLowerCase();

    // Skip intra-batch duplicates by studentCode or groupSpecificCode
    if (
      (codeLower && seenCodesInBatch.has(codeLower)) ||
      (groupLower && seenGroupsInBatch.has(groupLower))
    ) {
      skippedCount++;
      continue;
    }
    if (codeLower) seenCodesInBatch.add(codeLower);
    if (groupLower) seenGroupsInBatch.add(groupLower);

    const sInfo =
      studentMap.get((finalStudentCode || '').toLowerCase()) ||
      studentNameMap.get(normalizeStudentName(row.studentName || '')) ||
      {};
    const gNum = row.groupNumber !== undefined ? Number(row.groupNumber) : undefined;
    const gName = row.groupName || (gNum ? `กลุ่มที่ ${gNum}` : 'ทั่วไป');

    if (mode === 'APPEND') {
      const codeCheck = (finalStudentCode || '').toLowerCase();
      const groupCheck = (finalGroupCode || '').toLowerCase();
      const nameKey = normalizeStudentName(row.studentName || '');

      // Check if student already exists in this event
      const existing = local.find(
        (r) =>
          String(r.eventId || '').trim() === targetEventId &&
          ((codeCheck && r.studentCode?.toLowerCase() === codeCheck) ||
            (groupCheck && r.groupSpecificCode?.toLowerCase() === groupCheck) ||
            (nameKey && normalizeStudentName(r.studentName) === nameKey))
      );

      if (existing) {
        // Update group and profile details!
        if (gNum !== undefined && gNum > 0) existing.groupNumber = gNum;
        if (gName) existing.groupName = gName;
        if (finalGroupCode) existing.groupSpecificCode = finalGroupCode;
        if (finalStudentCode && isStudentId(finalStudentCode)) existing.studentCode = finalStudentCode;
        if (row.studentName) existing.studentName = row.studentName;
        if (row.degreeLevel) existing.degreeLevel = row.degreeLevel;
        if (row.programType) existing.programType = row.programType as any;
        if (row.major) existing.major = row.major;
        if (row.yearLevel) existing.yearLevel = Number(row.yearLevel);
        existing.updatedAt = nowIso;
        updatedItems.push(existing);
        updatedCount++;
        skippedCount++;
        continue;
      }
    }

    const newReg: EventRegistration = {
      id: `reg-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      eventId: targetEventId,
      eventTitle,
      studentCode: finalStudentCode || sCode,
      studentName: row.studentName || sInfo.fullName || finalStudentCode || sCode,
      groupNumber: gNum,
      groupName: gName,
      groupSpecificCode: finalGroupCode || undefined,
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
    if (finalStudentCode) {
      existingCodesInEvent.add(finalStudentCode.toLowerCase());
    }
  }

  local.push(...createdItems);
  writeLocalJson('event_registrations.json', local);

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      if (mode === 'REPLACE_ALL' || mode === 'REPLACE_EVENT') {
        const allRows = await gClient.getValues('EventRegistrations!A1:R');
        const header = allRows[0] || [
          'id',
          'eventId',
          'studentCode',
          'studentName',
          'status',
          'role',
          'major',
          'yearLevel',
          'department',
          'groupName',
          'createdAt',
          'groupNumber',
          'groupSpecificCode',
          'degreeLevel',
          'programType',
          'remarks',
          'attendedAt',
          'dailyAttendance',
        ];

        const otherEventRows = allRows.slice(1).filter((r) => {
          const isShifted = !r[0] && r[17] && String(r[17]).startsWith('reg-');
          const evId = isShifted ? r[18] : r[1];
          return String(evId || '').trim() !== targetEventId;
        });

        const newSheetRows = createdItems.map((reg) => [
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
          reg.groupNumber !== undefined ? String(reg.groupNumber) : '',
          reg.groupSpecificCode || '',
          reg.degreeLevel || '',
          reg.programType || '',
          reg.remarks || '',
          reg.attendedAt || '',
          JSON.stringify(reg.dailyAttendance || {}),
        ]);

        const combined = [...otherEventRows, ...newSheetRows];
        await gClient.clearValues(`EventRegistrations!A1:R${Math.max(allRows.length + 100, 200)}`);
        await gClient.updateValues('EventRegistrations!A1:R1', [header]);
        if (combined.length > 0) {
          const CHUNK_SIZE = 500;
          for (let i = 0; i < combined.length; i += CHUNK_SIZE) {
            const chunk = combined.slice(i, i + CHUNK_SIZE);
            const startRow = i + 2;
            const endRow = startRow + chunk.length - 1;
            await gClient.updateValues(`EventRegistrations!A${startRow}:R${endRow}`, chunk);
          }
        }
      } else {
        if (createdItems.length > 0) {
          const colARows = await gClient.getValues('EventRegistrations!A:A');
          const nextStartRow = Math.max(2, colARows.length + 1);
          const endRow = nextStartRow + createdItems.length - 1;
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
            reg.groupNumber !== undefined ? String(reg.groupNumber) : '',
            reg.groupSpecificCode || '',
            reg.degreeLevel || '',
            reg.programType || '',
            reg.remarks || '',
            reg.attendedAt || '',
            JSON.stringify(reg.dailyAttendance || {}),
          ]);
          await gClient.updateValues(`EventRegistrations!A${nextStartRow}:R${endRow}`, appendRows);
        }

        if (updatedItems.length > 0) {
          const rows = await gClient.getValues('EventRegistrations!A2:AJ');
          if (rows && rows.length > 0) {
            const idToRowIndex = new Map<string, number>();
            const codeToRowIndex = new Map<string, number>();
            rows.forEach((rawR, rowIdx) => {
              const isShifted = !rawR[0] && rawR[17] && String(rawR[17]).startsWith('reg-');
              const r = isShifted ? rawR.slice(17) : rawR;
              const rId = String(r[0] || '').trim();
              const rCode = String(r[2] || '').trim().toLowerCase();
              if (rId) idToRowIndex.set(rId, rowIdx + 2);
              if (rCode) codeToRowIndex.set(rCode, rowIdx + 2);
            });

            const updateBatches: Array<{ range: string; values: unknown[][] }> = [];
            for (const reg of updatedItems) {
              const rowNum =
                idToRowIndex.get(reg.id) ||
                (reg.studentCode ? codeToRowIndex.get(reg.studentCode.toLowerCase()) : undefined);
              if (!rowNum) continue;

              updateBatches.push({
                range: `EventRegistrations!J${rowNum}:M${rowNum}`,
                values: [[
                  reg.groupName || '',
                  reg.createdAt || '',
                  reg.groupNumber !== undefined ? String(reg.groupNumber) : '',
                  reg.groupSpecificCode || '',
                ]],
              });
            }

            if (updateBatches.length > 0) {
              await gClient.batchUpdateValues(updateBatches);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Google Sheets sync failed for EventRegistrations:', err);
    }
  }

  return {
    totalSubmitted: items.length,
    importedCount: createdItems.length,
    updatedCount,
    skippedCount,
    replacedCount,
    items: createdItems,
  };
}

export async function clearEventRegistrations(
  eventId: string
): Promise<{ deletedCount: number }> {
  const targetId = String(eventId || '').trim();
  if (!targetId) {
    throw new Error('กรุณาระบุ eventId');
  }

  let local = readLocalJson<EventRegistration[]>('event_registrations.json', []);
  const initialCount = local.length;
  local = local.filter((r) => String(r.eventId || '').trim() !== targetId);
  const deletedCount = initialCount - local.length;
  writeLocalJson('event_registrations.json', local);

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const allRows = await gClient.getValues('EventRegistrations!A1:R');
      if (allRows && allRows.length > 0) {
        const header = allRows[0];
        const remainingRows = allRows.slice(1).filter((r) => {
          const isShifted = !r[0] && r[17] && String(r[17]).startsWith('reg-');
          const evId = isShifted ? r[18] : r[1];
          return String(evId || '').trim() !== targetId;
        });

        await gClient.clearValues(`EventRegistrations!A1:R${Math.max(allRows.length + 100, 200)}`);
        await gClient.updateValues('EventRegistrations!A1:R1', [header]);
        if (remainingRows.length > 0) {
          const CHUNK_SIZE = 500;
          for (let i = 0; i < remainingRows.length; i += CHUNK_SIZE) {
            const chunk = remainingRows.slice(i, i + CHUNK_SIZE);
            const startRow = i + 2;
            const endRow = startRow + chunk.length - 1;
            await gClient.updateValues(`EventRegistrations!A${startRow}:R${endRow}`, chunk);
          }
        }
      }
    } catch (err) {
      console.warn('Google Sheets clear failed for EventRegistrations:', err);
    }
  }

  return { deletedCount };
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
