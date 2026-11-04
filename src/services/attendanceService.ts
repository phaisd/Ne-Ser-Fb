import { AttendanceRecord } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';

// ----------------- ATTENDANCE -----------------

export async function getAttendanceRecords(courseCode?: string, date?: string): Promise<AttendanceRecord[]> {
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Attendance!A2:H');
      if (rows && rows.length > 0) {
        let records: AttendanceRecord[] = rows.map((r) => ({
          id: r[0] || '',
          courseCode: r[1] || '',
          date: r[2] || '',
          studentCode: r[3] || '',
          studentName: r[4] || '',
          status: (r[5] as any) || 'PRESENT',
          recordedBy: r[6] || '',
          createdAt: r[7] || '',
        }));

        if (courseCode) records = records.filter((r) => r.courseCode === courseCode);
        if (date) records = records.filter((r) => r.date === date);
        return records;
      }
    } catch (err) {
      console.warn('Google Sheets read error for Attendance, falling back to local:', err);
    }
  }

  const rawRecords = readLocalJson<any[]>('attendance_records.json', []);
  return rawRecords.map((a) => ({
    id: a.id || 'att-' + Math.random(),
    courseCode: a.courseCode || '000 237',
    date: a.date || (a.createdAt ? String(a.createdAt).substring(0, 10) : new Date().toISOString().substring(0, 10)),
    sessionId: a.sessionId,
    studentCode: a.studentCode || '',
    studentName: a.studentName || '',
    status: a.status || 'PRESENT',
    recordedBy: a.recordedBy || 'อาจารย์ผู้สอน',
    createdAt: a.createdAt || new Date().toISOString(),
  }));
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
