import { StudentEvent, EventRegistration, EventSeatingConfig, SeatZone } from '@/types/event';
import { readLocalJson, writeLocalJson } from '../storageHelper';
import { getEvents, updateEvent } from './eventCoreService';
import { getEventRegistrations } from './eventRegistrationService';

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
 * Helper to generate seat codes for a zone
 * Example: zone prefix "A", row 1, col 5 -> "A-05" or "A-1-05"
 */
export function generateZoneSeatCodes(zone: SeatZone, disabledSeats: string[] = []): string[] {
  const disabledSet = new Set(disabledSeats.map((s) => s.trim().toUpperCase()));
  const prefix = (zone.prefix || zone.name.substring(0, 1) || 'Z').trim().toUpperCase();
  const seats: string[] = [];

  for (let r = 1; r <= zone.rows; r++) {
    // Generate row letter or row number
    const rowChar = String.fromCharCode(64 + r); // 1->A, 2->B, etc.
    for (let c = 1; c <= zone.cols; c++) {
      const colStr = c < 10 ? `0${c}` : `${c}`;
      // Format: A-01, A-02 or A1-01
      const seatCode = zone.rows <= 26 ? `${prefix}${rowChar}-${colStr}` : `${prefix}${r}-${colStr}`;
      if (!disabledSet.has(seatCode.toUpperCase())) {
        seats.push(seatCode);
      }
    }
  }

  return seats;
}

/**
 * Auto-assign seats for participants in an event
 */
export async function assignSeatsAuto(
  eventId: string,
  options: {
    sortBy?: 'GROUP' | 'STUDENT_CODE' | 'NAME';
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
  const sortBy = options.sortBy || 'GROUP';
  const sortedRegs = [...eventRegs].sort((a, b) => {
    if (sortBy === 'GROUP') {
      const gA = a.groupNumber ?? 999;
      const gB = b.groupNumber ?? 999;
      if (gA !== gB) return gA - gB;
      return (a.studentCode || '').localeCompare(b.studentCode || '');
    }
    if (sortBy === 'STUDENT_CODE') {
      return (a.studentCode || '').localeCompare(b.studentCode || '');
    }
    if (sortBy === 'NAME') {
      return (a.studentName || '').localeCompare(b.studentName || '', 'th');
    }
    return 0;
  });

  let assignedCount = 0;
  let unassignedCount = 0;

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
