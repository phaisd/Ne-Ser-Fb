import { StudentEvent } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from '../storageHelper';

// ----------------- EVENTS CORE CRUD -----------------

export async function getEvents(): Promise<StudentEvent[]> {
  const raw = readLocalJson<any[]>('events.json', []);
  const localMap = new Map<string, any>();
  raw.forEach((e) => localMap.set(e.id, e));

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Events!A2:Z');
      if (rows && rows.length > 0) {
        const seenInSheets = new Set<string>();
        const sheetEvents: StudentEvent[] = [];

        for (const r of rows) {
          const id = r[0] || '';
          if (!id) continue;
          seenInSheets.add(id);

          const local = localMap.get(id) || {};
          let sheetMeditationConfig: any = null;
          if (r[15]) {
            try {
              sheetMeditationConfig = typeof r[15] === 'string' ? JSON.parse(r[15]) : r[15];
            } catch {
              // ignore parse error
            }
          }

          // Safely merge meditationConfig so groupAssignments is preserved from whichever source has it
          const localMed = local.meditationConfig || {};
          const remoteMed = sheetMeditationConfig || {};
          const localAssignments = localMed.groupAssignments || {};
          const remoteAssignments = remoteMed.groupAssignments || {};

          const mergedAssignments = {
            ...localAssignments,
            ...remoteAssignments,
          };

          const meditationConfig = {
            ...localMed,
            ...remoteMed,
            groupAssignments:
              Object.keys(mergedAssignments).length > 0
                ? mergedAssignments
                : remoteMed.groupAssignments || localMed.groupAssignments || {},
          };

          let seatingConfig = local.seatingConfig || meditationConfig?.seatingConfig;
          if (r[16]) {
            try {
              const parsed = typeof r[16] === 'string' ? JSON.parse(r[16]) : r[16];
              if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                seatingConfig = parsed;
              }
            } catch {
              // fallback
            }
          }

          sheetEvents.push({
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
            showCoordinator:
              r[14] !== undefined
                ? r[14] === 'TRUE' || r[14] === true
                : local.showCoordinator !== false,
            meditationConfig,
            seatingConfig,
          });
        }

        // Include any local events that are NOT present in Google Sheets yet (e.g. newly created events)
        for (const localEvent of raw) {
          if (localEvent.id && !seenInSheets.has(localEvent.id)) {
            sheetEvents.push(localEvent);
            // Auto-append missing event to Google Sheets to ensure persistence
            try {
              const rowValues = [
                localEvent.id,
                localEvent.title || '',
                localEvent.eventType || 'SPECIAL',
                localEvent.startDate || '',
                localEvent.endDate || '',
                localEvent.eventTime || '08:30 - 16:30 น.',
                localEvent.location || '',
                localEvent.academicYear || '2569',
                localEvent.semester || 1,
                localEvent.maxParticipants || 100,
                localEvent.status || 'ACTIVE',
                localEvent.targetDegree || 'ALL',
                localEvent.targetProgram || 'ALL',
                localEvent.coordinatorName || '',
                localEvent.showCoordinator !== false ? 'TRUE' : 'FALSE',
                JSON.stringify(localEvent.meditationConfig || {}),
                JSON.stringify(localEvent.seatingConfig || {}),
              ];
              await gClient.appendValues('Events!A:Q', [rowValues]);
            } catch (appendErr) {
              console.warn('Failed to auto-append missing event to Google Sheets:', appendErr);
            }
          }
        }

        // Cache merged list locally
        writeLocalJson('events.json', sheetEvents);
        return sheetEvents;
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
    targetDegree: e.targetDegree || 'ALL',
    targetProgram: e.targetProgram || 'ALL',
    targetMajors: e.targetMajors || [],
    targetYearLevels: e.targetYearLevels || [1, 2, 3, 4],
    coordinatorName: e.coordinatorName || '',
    coordinatorTitle: e.coordinatorTitle || 'ผู้รับผิดชอบโครงการ คณะพุทธศาสตร์',
    coordinatorPhone: e.coordinatorPhone || '',
    coordinatorEmail: e.coordinatorEmail || '',
    showCoordinator: e.showCoordinator !== false,
    meditationConfig: e.meditationConfig || {},
    seatingConfig: e.seatingConfig,
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
    durationFormat: data.durationFormat || 'SINGLE_DAY',
    totalDays: data.totalDays || 1,
    attendanceMode: data.attendanceMode || 'SINGLE_SCAN',
    meditationDaysRequired: data.meditationDaysRequired || 10,
    meditationConfig: data.meditationConfig || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localList.unshift(newEvent);
  writeLocalJson('events.json', localList);

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await gClient.appendValues('Events!A:Q', [[
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
        JSON.stringify(newEvent.meditationConfig || {}),
        JSON.stringify(newEvent.seatingConfig || {}),
      ]]);
    } catch (err) {
      console.warn('Google Sheets append failed for Events:', err);
    }
  }

  return newEvent;
}

export async function updateEvent(id: string, updates: Partial<StudentEvent>): Promise<StudentEvent | null> {
  const targetId = String(id || '').trim();
  if (!targetId) return null;

  const localList = readLocalJson<any[]>('events.json', []);
  let idx = localList.findIndex((e) => String(e.id || '').trim() === targetId);

  if (idx === -1) {
    const allEvents = await getEvents();
    const found = allEvents.find((e) => String(e.id || '').trim() === targetId);
    if (found) {
      localList.push(found);
      idx = localList.length - 1;
    }
  }

  if (idx === -1) {
    const fallbackEvent: StudentEvent = {
      id: targetId,
      title: updates.title || 'โครงการปฏิบัติวิปัสสนากัมมัฏฐาน',
      description: updates.description || '',
      eventType: updates.eventType || 'SPECIAL',
      startDate: updates.startDate || new Date().toISOString().substring(0, 10),
      endDate: updates.endDate || new Date().toISOString().substring(0, 10),
      eventTime: updates.eventTime || '08:30 - 16:30 น.',
      location: updates.location || 'คณะพุทธศาสตร์ มจร',
      academicYear: updates.academicYear || '2569',
      semester: updates.semester || 1,
      maxParticipants: updates.maxParticipants || 100,
      activityHours: updates.activityHours || 3,
      status: updates.status || 'ACTIVE',
      isActive: true,
      targetDegree: updates.targetDegree || 'ALL',
      targetProgram: updates.targetProgram || 'ALL',
      targetMajors: updates.targetMajors || [],
      targetYearLevels: updates.targetYearLevels || [1, 2, 3, 4],
      coordinatorName: updates.coordinatorName || '',
      coordinatorTitle: updates.coordinatorTitle || 'ผู้รับผิดชอบโครงการ',
      coordinatorPhone: updates.coordinatorPhone || '',
      coordinatorEmail: updates.coordinatorEmail || '',
      showCoordinator: updates.showCoordinator !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...updates,
    };
    localList.unshift(fallbackEvent);
    idx = 0;
  }

  const updated: StudentEvent = {
    ...localList[idx],
    ...updates,
    id: targetId,
    updatedAt: new Date().toISOString(),
  };

  localList[idx] = updated;
  writeLocalJson('events.json', localList);

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Events!A2:A');
      let sheetRowIndex = -1;
      if (rows && rows.length > 0) {
        sheetRowIndex = rows.findIndex((r) => String(r[0] || '').trim() === targetId);
      }

      // Ensure seatingConfig is safely backed up inside meditationConfig as well
      const meditationConfigWithSeating = {
        ...(updated.meditationConfig || {}),
        seatingConfig: updated.seatingConfig || updated.meditationConfig?.seatingConfig,
      };

      const rowValues = [
        updated.id,
        updated.title,
        updated.eventType,
        updated.startDate,
        updated.endDate,
        updated.eventTime,
        updated.location,
        updated.academicYear,
        updated.semester,
        updated.maxParticipants,
        updated.status,
        updated.targetDegree,
        updated.targetProgram,
        updated.coordinatorName,
        updated.showCoordinator ? 'TRUE' : 'FALSE',
        JSON.stringify(meditationConfigWithSeating),
        JSON.stringify(updated.seatingConfig || {}),
      ];

      if (sheetRowIndex !== -1) {
        const rowNum = sheetRowIndex + 2;
        await gClient.updateValues(`Events!A${rowNum}:Q${rowNum}`, [rowValues]);
      } else {
        await gClient.appendValues('Events!A:Q', [rowValues]);
      }
    } catch (err) {
      console.warn('Google Sheets update failed for Events:', err);
    }
  }

  return updated;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const targetId = String(id || '').trim();
  if (!targetId) return false;

  const localList = readLocalJson<any[]>('events.json', []);
  const nextList = localList.filter((e) => String(e.id || '').trim() !== targetId);
  writeLocalJson('events.json', nextList);

  try {
    const rawRegs = readLocalJson<any[]>('event_registrations.json', []);
    const nextRegs = rawRegs.filter((r) => String(r.eventId || '').trim() !== targetId);
    if (nextRegs.length !== rawRegs.length) {
      writeLocalJson('event_registrations.json', nextRegs);
    }
  } catch (err) {
    console.warn('Failed to clean up registrations for deleted event:', err);
  }

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Events!A2:A');
      if (rows && rows.length > 0) {
        const rowsToDelete: number[] = [];
        rows.forEach((r, idx) => {
          if (String(r[0] || '').trim() === targetId) {
            rowsToDelete.push(idx + 1);
          }
        });

        if (rowsToDelete.length > 0) {
          await gClient.deleteRows('Events', rowsToDelete);
        }
      }
    } catch (err) {
      console.warn('Google Sheets delete event row error:', err);
    }

    try {
      const regRows = await gClient.getValues('EventRegistrations!A2:B');
      if (regRows && regRows.length > 0) {
        const regIndicesToDelete: number[] = [];
        regRows.forEach((r, idx) => {
          if (String(r[1] || '').trim() === targetId) {
            regIndicesToDelete.push(idx + 1);
          }
        });
        if (regIndicesToDelete.length > 0) {
          await gClient.deleteRows('EventRegistrations', regIndicesToDelete);
        }
      }
    } catch (err) {
      console.warn('Google Sheets delete event registrations error:', err);
    }
  }

  return true;
}
