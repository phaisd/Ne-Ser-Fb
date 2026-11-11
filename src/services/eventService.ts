import { StudentEvent, EventRegistration } from '@/types';
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
    const prog = r.programType || r.program || sInfo.programType || ((sInfo.nationality === 'ไทย' || sInfo.nationality === 'Thai') ? 'THAI' : 'ENGLISH');

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
 * by normalized studentCode (group code) or (groupNumber + studentName).
 */
export async function batchImportEventRegistrations(
  eventId: string,
  items: BatchEventRegistrationInput[],
  mode: 'APPEND' | 'REPLACE_EVENT' = 'APPEND'
): Promise<BatchImportRegistrationsResult> {
  const local = readLocalJson<any[]>('event_registrations.json', []);
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
  const existingGroupNames = new Set<string>();
  for (const r of remaining) {
    if (r.eventId !== eventId) continue;
    const codeKey = String(r.studentCode || '').trim().toLowerCase();
    if (codeKey) existingCodes.add(codeKey);
    const nameKey = `${r.groupNumber || ''}|${String(r.studentName || '').trim().toLowerCase()}`;
    if (r.studentName) existingGroupNames.add(nameKey);
  }

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const createdItems: EventRegistration[] = [];
  let skippedCount = 0;

  items.forEach((item, index) => {
    const cleanCode = String(item.studentCode || '').trim();
    const cleanName = String(item.studentName || '').trim();
    if (!cleanName || !cleanCode) {
      skippedCount += 1;
      return;
    }

    const codeKey = cleanCode.toLowerCase();
    const nameKey = `${item.groupNumber || ''}|${cleanName.toLowerCase()}`;
    if (existingCodes.has(codeKey) || existingGroupNames.has(nameKey)) {
      skippedCount += 1;
      return;
    }

    existingCodes.add(codeKey);
    existingGroupNames.add(nameKey);

    const reg: EventRegistration = {
      id: `reg-${now}-${index}-${Math.floor(Math.random() * 1000)}`,
      eventId,
      eventTitle: targetEvent?.title,
      studentCode: cleanCode,
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
    p1?: { status: string };
    p2?: { status: string };
    p3?: { status: string };
    p4?: { status: string };
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
      reg.dailyAttendance[dayKey] = {
        p1: rec.p1 || { status: 'PRESENT' },
        p2: rec.p2 || { status: 'PRESENT' },
        p3: rec.p3 || { status: 'PRESENT' },
        p4: rec.p4 || { status: 'PRESENT' },
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
