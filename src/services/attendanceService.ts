import { AttendanceRecord } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';

// ----------------- ATTENDANCE -----------------

const VALID_STATUSES = new Set(['PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'EXCUSED']);

/**
 * Checks whether a raw Google Sheets row is a corrupted 7-column legacy sample row
 * (where column D [r[3]] was status like PRESENT/LATE and column F [r[5]] was an ISO timestamp).
 */
function isLegacyCorruptedRow(r: any[]): boolean {
  const colD = String(r[3] || '').trim().toUpperCase();
  const colF = String(r[5] || '').trim().toUpperCase();
  const colC = String(r[2] || '').trim();
  const isValidDateC = !Number.isNaN(Date.parse(colC));
  return (VALID_STATUSES.has(colD) && !VALID_STATUSES.has(colF)) || !isValidDateC;
}

export async function getAttendanceRecords(courseCode?: string, date?: string): Promise<AttendanceRecord[]> {
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Attendance!A2:H');
      if (rows && rows.length > 0) {
        const validRows = rows.filter((r) => r && r.length > 0 && !isLegacyCorruptedRow(r));

        // Auto-clean Google Sheets if corrupted legacy sample rows were present
        if (validRows.length !== rows.length) {
          try {
            await gClient.clearValues('Attendance!A2:H2000');
            if (validRows.length > 0) {
              await gClient.updateValues('Attendance!A2', validRows);
            }
          } catch (cleanErr) {
            console.warn('Auto-clean corrupted attendance rows warning:', cleanErr);
          }
        }

        let records: AttendanceRecord[] = validRows.map((r) => ({
          id: r[0] || '',
          courseCode: r[1] || '',
          date: r[2] || '',
          studentCode: r[3] || '',
          studentName: r[4] || '',
          status: (r[5] as any) === 'EXCUSED' ? 'LEAVE' : ((r[5] as any) || 'PRESENT'),
          recordedBy: r[6] || '',
          createdAt: r[7] || '',
        }));

        if (courseCode) records = records.filter((r) => r.courseCode === courseCode);
        if (date) records = records.filter((r) => r.date === date);
        return records;
      }
      return [];
    } catch (err) {
      console.warn('Google Sheets read error for Attendance, falling back to local:', err);
    }
  }

  const rawRecords = readLocalJson<any[]>('attendance_records.json', []);
  // Filter out any legacy mock records that lacked courseCode or valid date
  const validLocal = rawRecords.filter(
    (a) => a && a.courseCode && a.date && !Number.isNaN(Date.parse(String(a.date)))
  );

  let records: AttendanceRecord[] = validLocal.map((a) => ({
    id: a.id || 'att-' + Math.random(),
    courseCode: a.courseCode,
    date: a.date,
    sessionId: a.sessionId,
    studentCode: a.studentCode || '',
    studentName: a.studentName || '',
    status: a.status === 'EXCUSED' ? 'LEAVE' : (a.status || 'PRESENT'),
    recordedBy: a.recordedBy || 'อาจารย์ผู้สอน',
    createdAt: a.createdAt || new Date().toISOString(),
    note: a.note || undefined,
  }));

  if (courseCode) records = records.filter((r) => r.courseCode === courseCode);
  if (date) records = records.filter((r) => r.date === date);
  return records;
}

export async function saveAttendanceBatch(records: Omit<AttendanceRecord, 'id' | 'createdAt'>[]): Promise<number> {
  const createdNow = new Date().toISOString();
  const newRecords: AttendanceRecord[] = records.map((r) => ({
    ...r,
    id: 'att-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    createdAt: createdNow,
  }));

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const values = newRecords.map((r) => [
        r.id,
        r.courseCode || '',
        r.date,
        r.studentCode,
        r.studentName,
        r.status,
        r.recordedBy || '',
        r.createdAt,
      ]);

      await gClient.appendValues('Attendance!A:H', values);
    } catch (err) {
      console.warn('Failed appending attendance to Google Sheets:', err);
    }
  }

  const localList = readLocalJson<any[]>('attendance_records.json', []);
  localList.push(...newRecords);
  writeLocalJson('attendance_records.json', localList);

  return newRecords.length;
}

export async function deleteAttendanceRecord(id: string): Promise<boolean> {
  if (!id) return false;

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Attendance!A2:H');
      const remaining = (rows || []).filter((r) => r && r[0] !== id && !isLegacyCorruptedRow(r));
      await gClient.clearValues('Attendance!A2:H2000');
      if (remaining.length > 0) {
        await gClient.updateValues('Attendance!A2', remaining);
      }
    } catch (err) {
      console.warn('Failed deleting attendance row from Google Sheets:', err);
    }
  }

  const localList = readLocalJson<any[]>('attendance_records.json', []);
  const filtered = localList.filter((r) => r.id !== id);
  writeLocalJson('attendance_records.json', filtered);
  return true;
}

export async function clearAttendanceRecords(mode: 'all' | 'invalid' = 'all'): Promise<number> {
  let deletedCount = 0;

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Attendance!A2:H');
      const totalBefore = (rows || []).length;

      // Ensure proper 8-column header in row 1
      await gClient.updateValues('Attendance!A1:H1', [[
        'id',
        'courseCode',
        'date',
        'studentCode',
        'studentName',
        'status',
        'recordedBy',
        'createdAt',
      ]]);

      await gClient.clearValues('Attendance!A2:H2000');

      if (mode === 'invalid' && rows && rows.length > 0) {
        const validRows = rows.filter((r) => r && r.length > 0 && !isLegacyCorruptedRow(r));
        if (validRows.length > 0) {
          await gClient.updateValues('Attendance!A2', validRows);
        }
        deletedCount = totalBefore - validRows.length;
      } else {
        deletedCount = totalBefore;
      }
    } catch (err) {
      console.warn('Failed clearing attendance on Google Sheets:', err);
    }
  }

  const localList = readLocalJson<any[]>('attendance_records.json', []);
  if (mode === 'all') {
    deletedCount = Math.max(deletedCount, localList.length);
    writeLocalJson('attendance_records.json', []);
  } else {
    const validLocal = localList.filter(
      (a) => a && a.courseCode && a.date && !Number.isNaN(Date.parse(String(a.date)))
    );
    deletedCount = Math.max(deletedCount, localList.length - validLocal.length);
    writeLocalJson('attendance_records.json', validLocal);
  }

  return deletedCount;
}
