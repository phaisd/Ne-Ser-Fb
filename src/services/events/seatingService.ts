import { StudentEvent, EventRegistration, EventSeatingConfig, SeatZone } from '@/types/event';
import { readLocalJson, writeLocalJson } from '../storageHelper';
import { getEvents, updateEvent } from './eventCoreService';
import { getEventRegistrations } from './eventRegistrationService';
import { syncUpdatedRegistrationsToSheets } from './vipassanaService';
import {
  generateZoneSeatCodes,
  detectParticipantStatus,
  type ParticipantStatusCategory,
} from './seatingUtils';

export {
  generateZoneSeatCodes,
  detectParticipantStatus,
  type ParticipantStatusCategory,
};

/**
 * Save seating configuration for an event
 */
export async function saveEventSeatingConfig(
  eventId: string,
  config: EventSeatingConfig
): Promise<StudentEvent | null> {
  const targetId = String(eventId || '').trim();
  if (!targetId) throw new Error('กรุณาระบุ eventId');

  const updatedConfig: EventSeatingConfig = {
    ...config,
    enabled: config.enabled !== false,
    updatedAt: new Date().toISOString(),
  };

  const updatedEvent = await updateEvent(targetId, {
    seatingConfig: updatedConfig,
  });

  return updatedEvent;
}



/**
 * Auto-assign seats for participants in an event
 */
export async function assignSeatsAuto(
  eventId: string,
  options: {
    sortBy?: 'GROUP' | 'STUDENT_CODE' | 'NAME' | 'STATUS_GENDER' | 'STATUS_INTER' | 'MAX_CAPACITY' | 'VASSA';
    clearExisting?: boolean;
  } = {}
): Promise<{ assignedCount: number; unassignedCount: number; totalParticipants: number }> {
  const targetId = String(eventId || '').trim();
  if (!targetId) throw new Error('กรุณาระบุ eventId');

  const events = await getEvents();
  const event = events.find((e) => e.id === targetId);
  if (!event) throw new Error('ไม่พบข้อมูลโครงการ/กิจกรรม');

  // Load seating config or create default zone if none exists
  let seatingConfig = event.seatingConfig;
  if (!seatingConfig || !seatingConfig.zones || seatingConfig.zones.length === 0) {
    const defaultZone: SeatZone = {
      id: 'zone-a',
      name: 'โซน A (ห้องปฏิบัติธรรมรวม)',
      color: 'amber',
      rows: 15,
      cols: 20,
      prefix: 'A',
      description: 'ผังแถว-คอลัมน์มาตรฐาน',
    };
    seatingConfig = {
      enabled: true,
      layoutType: 'GRID',
      venueName: event.location || 'อาคาร มวก. 48 พรรษา คณะพุทธศาสตร์',
      roomName: 'หอประชุมใหญ่',
      zones: [defaultZone],
      disabledSeats: [],
      updatedAt: new Date().toISOString(),
    };
    await saveEventSeatingConfig(targetId, seatingConfig);
  }

  const disabledSeats = seatingConfig.disabledSeats || [];

  // Generate all available seat slots across all zones
  const seatSlots: Array<{ seatNumber: string; zoneId: string; zoneName: string }> = [];
  seatingConfig.zones.forEach((zone) => {
    const codes = generateZoneSeatCodes(zone, disabledSeats);
    codes.forEach((code) => {
      seatSlots.push({
        seatNumber: code,
        zoneId: zone.id,
        zoneName: zone.name,
      });
    });
  });

  // Load all local registrations
  const localList = readLocalJson<any[]>('event_registrations.json', []);
  const eventRegs = localList.filter((r) => r.eventId === targetId);

  if (eventRegs.length === 0) {
    return { assignedCount: 0, unassignedCount: 0, totalParticipants: 0 };
  }

  // Sort registrations according to option
  const sortBy = options.sortBy || 'STATUS_GENDER';
  const sortedRegs = [...eventRegs].sort((a, b) => {
    // 1. เรียงตามสถานภาพ พระภิกษุ -> สามเณร -> ภิกษุณี -> แม่ชี -> ฆราวาสชาย -> ฆราวาสหญิง (เพื่อความถูกต้องตามพระวินัยและอัดแน่นพื้นที่ได้สูงสุด)
    if (sortBy === 'STATUS_GENDER') {
      const stA = detectParticipantStatus(a.studentName, a.role);
      const stB = detectParticipantStatus(b.studentName, b.role);
      if (stA.priority !== stB.priority) {
        return stA.priority - stB.priority;
      }
      return (a.studentCode || '').localeCompare(b.studentCode || '');
    }

    // 1.1 เรียงตามพรรษา (อาวุโสพรรษาตามพระธรรมวินัย พระภิกษุพรรษามากนั่งหน้าสุด)
    if (sortBy === 'VASSA') {
      const stA = detectParticipantStatus(a.studentName, a.role);
      const stB = detectParticipantStatus(b.studentName, b.role);
      if (stA.priority !== stB.priority) {
        return stA.priority - stB.priority;
      }
      if (stA.category === 'MONK' && stB.category === 'MONK') {
        const vassaA = parseInt(String(a.vasa || '0').replace(/\D/g, ''), 10) || 0;
        const vassaB = parseInt(String(b.vasa || '0').replace(/\D/g, ''), 10) || 0;
        if (vassaA !== vassaB) {
          return vassaB - vassaA; // พรรษามาก่อน (มากไปน้อย)
        }
      }
      return (a.studentCode || '').localeCompare(b.studentCode || '');
    }

    // 2. เรียงตามสถานภาพ + แยกหลักสูตรภาษา (ไทย vs International)
    if (sortBy === 'STATUS_INTER') {
      const isInterA = a.programType === 'ENGLISH' || a.programType === 'INTER' || a.groupNumber === 12;
      const isInterB = b.programType === 'ENGLISH' || b.programType === 'INTER' || b.groupNumber === 12;
      const stA = detectParticipantStatus(a.studentName, a.role);
      const stB = detectParticipantStatus(b.studentName, b.role);

      if (stA.priority !== stB.priority) {
        return stA.priority - stB.priority;
      }
      if (isInterA !== isInterB) {
        return isInterA ? 1 : -1;
      }
      return (a.studentCode || '').localeCompare(b.studentCode || '');
    }

    // 3. เรียงตามกลุ่ม
    if (sortBy === 'GROUP') {
      const gA = a.groupNumber ?? 999;
      const gB = b.groupNumber ?? 999;
      if (gA !== gB) return gA - gB;
      return (a.studentCode || '').localeCompare(b.studentCode || '');
    }

    // 4. เรียงตามรหัสนิสิต (Max Capacity)
    if (sortBy === 'STUDENT_CODE' || sortBy === 'MAX_CAPACITY') {
      return (a.studentCode || '').localeCompare(b.studentCode || '');
    }

    // 5. เรียงตามตัวอักษรชื่อ-สกุล
    if (sortBy === 'NAME') {
      return (a.studentName || '').localeCompare(b.studentName || '', 'th');
    }

    return 0;
  });

  let assignedCount = 0;
  let unassignedCount = 0;

  const designations = seatingConfig.seatDesignations || {};
  const hasDesignations = Object.keys(designations).length > 0;

  if (hasDesignations) {
    // 1. Group available slots by designated status
    const designatedSlotMap: Record<string, typeof seatSlots> = {};
    const undesignatedSlots: typeof seatSlots = [];

    seatSlots.forEach((slot) => {
      const des = designations[slot.seatNumber.toUpperCase()];
      if (des) {
        if (!designatedSlotMap[des]) designatedSlotMap[des] = [];
        designatedSlotMap[des].push(slot);
      } else {
        undesignatedSlots.push(slot);
      }
    });

    // 2. Fill matching status participants into designated slots first
    const remainingRegs: typeof sortedRegs = [];
    const usedSlotNumbers = new Set<string>();

    sortedRegs.forEach((reg) => {
      const cat = detectParticipantStatus(reg.studentName, reg.role).category;
      const targetInLocal = localList.find((r) => r.id === reg.id);
      if (!targetInLocal) return;

      const availSlotsForCat = designatedSlotMap[cat] || [];
      const freeSlot = availSlotsForCat.find((s) => !usedSlotNumbers.has(s.seatNumber));

      if (freeSlot) {
        usedSlotNumbers.add(freeSlot.seatNumber);
        targetInLocal.seatNumber = freeSlot.seatNumber;
        targetInLocal.seatZone = freeSlot.zoneName;
        targetInLocal.updatedAt = new Date().toISOString();
        assignedCount++;
      } else {
        remainingRegs.push(reg);
      }
    });

    // 3. Fill remaining participants into any remaining available slots
    const allRemainingSlots = seatSlots.filter((s) => !usedSlotNumbers.has(s.seatNumber));
    remainingRegs.forEach((reg, idx) => {
      const targetInLocal = localList.find((r) => r.id === reg.id);
      if (!targetInLocal) return;

      if (idx < allRemainingSlots.length) {
        const slot = allRemainingSlots[idx];
        targetInLocal.seatNumber = slot.seatNumber;
        targetInLocal.seatZone = slot.zoneName;
        targetInLocal.updatedAt = new Date().toISOString();
        assignedCount++;
      } else {
        targetInLocal.seatNumber = undefined;
        targetInLocal.seatZone = undefined;
        targetInLocal.updatedAt = new Date().toISOString();
        unassignedCount++;
      }
    });
  } else {
    // Standard sequence filling
    sortedRegs.forEach((reg, index) => {
      const targetInLocal = localList.find((r) => r.id === reg.id);
      if (!targetInLocal) return;

      if (index < seatSlots.length) {
        const slot = seatSlots[index];
        targetInLocal.seatNumber = slot.seatNumber;
        targetInLocal.seatZone = slot.zoneName;
        targetInLocal.updatedAt = new Date().toISOString();
        assignedCount++;
      } else {
        // Out of seat capacity
        targetInLocal.seatNumber = undefined;
        targetInLocal.seatZone = undefined;
        targetInLocal.updatedAt = new Date().toISOString();
        unassignedCount++;
      }
    });
  }

  writeLocalJson('event_registrations.json', localList);

  return {
    assignedCount,
    unassignedCount,
    totalParticipants: eventRegs.length,
  };
}

/**
 * Update / swap a specific participant's seat
 */
export async function updateParticipantSeat(
  registrationId: string,
  seatNumber: string | null,
  seatZone?: string
): Promise<EventRegistration | null> {
  const localList = readLocalJson<any[]>('event_registrations.json', []);
  const target = localList.find((r) => r.id === registrationId);
  if (!target) return null;

  const eventId = target.eventId;

  // If a seatNumber is provided, check if someone else is already occupying it in the same event
  if (seatNumber) {
    const cleanSeat = seatNumber.trim().toUpperCase();
    const conflict = localList.find(
      (r) => r.eventId === eventId && r.id !== registrationId && r.seatNumber?.trim().toUpperCase() === cleanSeat
    );
    if (conflict) {
      // Swap seat with previous occupant
      conflict.seatNumber = target.seatNumber || undefined;
      conflict.seatZone = target.seatZone || undefined;
      conflict.updatedAt = new Date().toISOString();
    }
    target.seatNumber = cleanSeat;
    target.seatZone = seatZone || target.seatZone || '';
  } else {
    // Unassign seat
    target.seatNumber = undefined;
    target.seatZone = undefined;
    target.seatCheckinAt = undefined;
    target.seatCheckinBy = undefined;
  }

  target.updatedAt = new Date().toISOString();
  writeLocalJson('event_registrations.json', localList);

  return target as EventRegistration;
}

/**
 * Clear all seats for an event
 */
export async function clearEventSeats(eventId: string): Promise<number> {
  const targetId = String(eventId || '').trim();
  const localList = readLocalJson<any[]>('event_registrations.json', []);
  let count = 0;

  localList.forEach((r) => {
    if (r.eventId === targetId) {
      r.seatNumber = undefined;
      r.seatZone = undefined;
      r.seatCheckinAt = undefined;
      r.seatCheckinBy = undefined;
      r.updatedAt = new Date().toISOString();
      count++;
    }
  });

  writeLocalJson('event_registrations.json', localList);
  return count;
}

/**
 * Rapid QR Check-in for Seat Attendance
 */
export async function recordSeatCheckin(params: {
  eventId: string;
  studentCodeOrId: string;
  recordedBy?: string;
}): Promise<{
  success: boolean;
  registration?: EventRegistration;
  isAlreadyCheckedIn?: boolean;
  error?: string;
}> {
  const { eventId, studentCodeOrId, recordedBy } = params;
  const cleanQuery = String(studentCodeOrId || '').trim().toLowerCase();
  if (!eventId || !cleanQuery) {
    return { success: false, error: 'ข้อมูลไม่ครบถ้วน (ต้องการ eventId และรหัสนิสิต/QR)' };
  }

  const localList = readLocalJson<any[]>('event_registrations.json', []);
  const found = localList.find((r) => {
    if (r.eventId !== eventId) return false;
    const matchId = String(r.id || '').toLowerCase() === cleanQuery;
    const matchCode = String(r.studentCode || '').trim().toLowerCase() === cleanQuery;
    const matchGroupCode = String(r.groupSpecificCode || '').trim().toLowerCase() === cleanQuery;
    return matchId || matchCode || matchGroupCode;
  });

  if (!found) {
    return { success: false, error: `ไม่พบข้อมูลผู้เข้าร่วมสำหรับรหัส [${studentCodeOrId}] ในโครงการนี้` };
  }

  const isAlreadyCheckedIn = Boolean(found.seatCheckinAt);
  const nowIso = new Date().toISOString();

  found.seatCheckinAt = nowIso;
  found.seatCheckinBy = recordedBy || 'STAFF';
  found.updatedAt = nowIso;

  // Also mark main event attendance status if registered
  if (found.status === 'REGISTERED') {
    found.status = 'ATTENDED';
    found.attendedAt = nowIso;
  }

  writeLocalJson('event_registrations.json', localList);

  return {
    success: true,
    isAlreadyCheckedIn,
    registration: found as EventRegistration,
  };
}

/**
 * Public Seating Data Lookup (No authentication required)
 */
export async function getPublicSeatingData(
  eventId: string,
  searchQuery?: string
): Promise<{
  event: Partial<StudentEvent> | null;
  seatingConfig: EventSeatingConfig | null;
  occupiedSeats: Array<{
    seatNumber: string;
    isCheckedIn: boolean;
    groupNumber?: number;
    displayName: string;
    statusCategory?: ParticipantStatusCategory;
  }>;
  matchedParticipant?: {
    id: string;
    studentCode: string;
    studentName: string;
    groupNumber?: number;
    groupSpecificCode?: string;
    seatNumber?: string;
    seatZone?: string;
    seatCheckinAt?: string;
    major?: string;
    degreeLevel?: string;
  } | null;
}> {
  const targetId = String(eventId || '').trim();
  const events = await getEvents();
  const event = events.find((e) => e.id === targetId);

  if (!event) {
    return { event: null, seatingConfig: null, occupiedSeats: [], matchedParticipant: null };
  }

  const seatingConfig = event.seatingConfig || null;

  // Read registrations for this event
  const registrations = await getEventRegistrations(targetId);

  // Build occupied seats list for the visual map
  const occupiedSeats = registrations
    .filter((r) => Boolean(r.seatNumber))
    .map((r) => {
      // Safe display name: e.g. "พระวีระชัย..." or "นายสมชาย..."
      return {
        seatNumber: r.seatNumber!,
        isCheckedIn: Boolean(r.seatCheckinAt),
        groupNumber: r.groupNumber,
        displayName: r.studentName,
        statusCategory: detectParticipantStatus(r.studentName, r.role).category,
      };
    });

  let matchedParticipant = null;
  if (searchQuery && searchQuery.trim()) {
    const cleanQ = searchQuery.trim().toLowerCase();
    const found = registrations.find((r) => {
      const matchCode = (r.studentCode || '').toLowerCase().includes(cleanQ);
      const matchGroupCode = (r.groupSpecificCode || '').toLowerCase() === cleanQ;
      const matchName = (r.studentName || '').toLowerCase().includes(cleanQ);
      return matchCode || matchGroupCode || matchName;
    });

    if (found) {
      matchedParticipant = {
        id: found.id,
        studentCode: found.studentCode,
        studentName: found.studentName,
        groupNumber: found.groupNumber,
        groupSpecificCode: found.groupSpecificCode,
        seatNumber: found.seatNumber,
        seatZone: found.seatZone,
        seatCheckinAt: found.seatCheckinAt,
        major: found.major,
        degreeLevel: found.degreeLevel,
      };
    }
  }

  return {
    event: {
      id: event.id,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      eventTime: event.eventTime,
      location: event.location,
    },
    seatingConfig,
    occupiedSeats,
    matchedParticipant,
  };
}

/**
 * Batch import custom seating assignments from parsed Excel / CSV rows
 */
export async function batchImportSeatingFromRows(
  eventId: string,
  rows: Array<{
    studentCode: string;
    seatNumber?: string;
    seatZone?: string;
    vasa?: string;
    seatCheckedIn?: boolean;
    seatCheckinBy?: string;
  }>
): Promise<{
  totalProcessed: number;
  matchedCount: number;
  unmatchedCount: number;
  unmatchedCodes: string[];
}> {
  const targetId = String(eventId || '').trim();
  if (!targetId) throw new Error('กรุณาระบุ eventId');

  const localList = readLocalJson<any[]>('event_registrations.json', []);
  const eventRegs = localList.filter((r) => r.eventId === targetId);

  const regMap = new Map<string, any>();
  eventRegs.forEach((r) => {
    if (r.studentCode) regMap.set(r.studentCode.trim().toLowerCase(), r);
    if (r.groupSpecificCode) regMap.set(r.groupSpecificCode.trim().toLowerCase(), r);
    if (r.id) regMap.set(r.id.trim().toLowerCase(), r);
  });

  let matchedCount = 0;
  let unmatchedCount = 0;
  const unmatchedCodes: string[] = [];

  rows.forEach((row) => {
    const cleanCode = (row.studentCode || '').trim().toLowerCase();
    if (!cleanCode) return;

    const target = regMap.get(cleanCode);
    if (target) {
      if (row.seatNumber !== undefined) {
        target.seatNumber = row.seatNumber ? row.seatNumber.trim().toUpperCase() : undefined;
      }
      if (row.seatZone !== undefined) {
        target.seatZone = row.seatZone ? row.seatZone.trim() : target.seatZone;
      }
      if (row.vasa !== undefined && row.vasa !== null) {
        const v = String(row.vasa).replace(/\s*พรรษา$/g, '').trim();
        target.vasa = v && v !== '-' ? v : undefined;
      }
      if (row.seatCheckedIn !== undefined) {
        if (row.seatCheckedIn) {
          target.seatCheckinAt = target.seatCheckinAt || new Date().toISOString();
          target.seatCheckinBy = row.seatCheckinBy || target.seatCheckinBy || 'Import File';
          if (target.status !== 'ATTENDED') target.status = 'ATTENDED';
        } else {
          target.seatCheckinAt = undefined;
          target.seatCheckinBy = undefined;
        }
      }
      target.updatedAt = new Date().toISOString();
      matchedCount++;
    } else {
      unmatchedCount++;
      unmatchedCodes.push(row.studentCode);
    }
  });

  writeLocalJson('event_registrations.json', localList);

  return {
    totalProcessed: rows.length,
    matchedCount,
    unmatchedCount,
    unmatchedCodes: unmatchedCodes.slice(0, 50),
  };
}

/**
 * Record Daily & Period Seat Inspection (สุ่มตรวจที่นั่งประจำวัน/รอบ)
 * บันทึกว่านิสิตอยู่ที่นั่ง หรือ ที่นั่งว่าง (สแกนเข้าแต่แอบออกไปข้างนอก)
 */
export async function recordDailySeatInspection(params: {
  eventId: string;
  dayKey: string; // e.g. 'day_1'
  periodKey: 'p1' | 'p2' | 'p3' | 'p4';
  records: Array<{
    registrationId?: string;
    studentCode?: string;
    seatNumber?: string;
    seatOccupied: boolean | null; // true = อยู่ที่นั่ง, false = ที่นั่งว่าง (สแกนแต่ไม่อยู่), null = ล้างค่า
  }>;
  recordedBy?: string;
}): Promise<{
  success: boolean;
  updatedCount: number;
  emptySeatCount: number;
  error?: string;
}> {
  const { eventId, dayKey, periodKey, records, recordedBy } = params;
  if (!eventId || !dayKey || !periodKey || !Array.isArray(records)) {
    throw new Error('ข้อมูลไม่ครบถ้วน (ต้องการ eventId, dayKey, periodKey, records)');
  }

  const localList = readLocalJson<any[]>('event_registrations.json', []);
  const eventRegs = localList.filter((r) => r.eventId === eventId);
  if (eventRegs.length === 0) {
    return { success: true, updatedCount: 0, emptySeatCount: 0 };
  }

  const idMap = new Map<string, any>();
  const codeMap = new Map<string, any>();
  const seatMap = new Map<string, any>();

  eventRegs.forEach((r) => {
    if (r.id) idMap.set(String(r.id).trim().toLowerCase(), r);
    if (r.studentCode) codeMap.set(String(r.studentCode).trim().toLowerCase(), r);
    if (r.groupSpecificCode) codeMap.set(String(r.groupSpecificCode).trim().toLowerCase(), r);
    if (r.seatNumber) seatMap.set(String(r.seatNumber).trim().toUpperCase(), r);
  });

  const nowIso = new Date().toISOString();
  const updatedList: EventRegistration[] = [];
  let emptySeatCount = 0;

  for (const item of records) {
    let target = item.registrationId ? idMap.get(item.registrationId.trim().toLowerCase()) : null;
    if (!target && item.studentCode) {
      target = codeMap.get(item.studentCode.trim().toLowerCase());
    }
    if (!target && item.seatNumber) {
      target = seatMap.get(item.seatNumber.trim().toUpperCase());
    }

    if (!target) continue;

    if (!target.dailyAttendance) target.dailyAttendance = {};
    if (!target.dailyAttendance[dayKey]) target.dailyAttendance[dayKey] = {};
    const existingPeriod = target.dailyAttendance[dayKey][periodKey] || {};

    if (item.seatOccupied === null) {
      delete existingPeriod.seatOccupied;
      delete existingPeriod.seatCheckedAt;
      delete existingPeriod.seatCheckedBy;
    } else {
      existingPeriod.seatOccupied = item.seatOccupied;
      existingPeriod.seatCheckedAt = nowIso;
      existingPeriod.seatCheckedBy = recordedBy || 'STAFF_INSPECTION';
      if (item.seatOccupied === false) {
        emptySeatCount++;
      }
    }

    target.dailyAttendance[dayKey][periodKey] = existingPeriod;
    target.updatedAt = nowIso;
    updatedList.push(target);
  }

  if (updatedList.length > 0) {
    writeLocalJson('event_registrations.json', localList);
    try {
      await syncUpdatedRegistrationsToSheets(updatedList);
    } catch (e) {
      console.warn('Could not sync seat inspection to sheets:', e);
    }
  }

  return {
    success: true,
    updatedCount: updatedList.length,
    emptySeatCount,
  };
}
