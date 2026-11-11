import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAttendanceRecords,
  saveAttendanceBatch,
  deleteAttendanceRecord,
} from './attendanceService';

const mockStore: Record<string, unknown> = {
  'attendance_records.json': [
    {
      id: 'att-1',
      courseCode: '000101',
      date: '2026-11-11',
      studentCode: '6801001',
      studentName: 'นิสิตหนึ่ง',
      status: 'EXCUSED',
      recordedBy: 'อ.ทดสอบ',
    },
    {
      id: 'att-bad',
      courseCode: '000101',
      date: 'not-a-date',
      studentCode: '6801002',
      studentName: 'ข้อมูลเสีย',
      status: 'PRESENT',
    },
  ],
};

vi.mock('./storageHelper', () => ({
  getSheetsClient: vi.fn(() => null),
  readLocalJson: vi.fn((file: string, fallback: unknown) => {
    const data = mockStore[file];
    return data ? JSON.parse(JSON.stringify(data)) : fallback;
  }),
  writeLocalJson: vi.fn((file: string, data: unknown) => {
    mockStore[file] = JSON.parse(JSON.stringify(data));
  }),
}));

describe('attendanceService', () => {
  beforeEach(() => {
    mockStore['attendance_records.json'] = [
      {
        id: 'att-1',
        courseCode: '000101',
        date: '2026-11-11',
        studentCode: '6801001',
        studentName: 'นิสิตหนึ่ง',
        status: 'EXCUSED',
        recordedBy: 'อ.ทดสอบ',
      },
      {
        id: 'att-bad',
        courseCode: '000101',
        date: 'not-a-date',
        studentCode: '6801002',
        studentName: 'ข้อมูลเสีย',
        status: 'PRESENT',
      },
    ];
  });

  it('filters out invalid dates and normalizes legacy EXCUSED status to LEAVE', async () => {
    const records = await getAttendanceRecords('000101', '2026-11-11');
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('att-1');
    expect(records[0].status).toBe('LEAVE');
  });

  it('appends attendance batch and supports deleting a record by id', async () => {
    const addedCount = await saveAttendanceBatch([
      {
        courseCode: '000101',
        date: '2026-11-12',
        studentCode: '6801003',
        studentName: 'นิสิตสาม',
        status: 'PRESENT',
        recordedBy: 'อ.ทดสอบ',
      },
    ]);
    expect(addedCount).toBe(1);

    const allOnNewDate = await getAttendanceRecords('000101', '2026-11-12');
    expect(allOnNewDate).toHaveLength(1);
    expect(allOnNewDate[0].studentCode).toBe('6801003');

    const deleted = await deleteAttendanceRecord('att-1');
    expect(deleted).toBe(true);
    const remainingOld = await getAttendanceRecords('000101', '2026-11-11');
    expect(remainingOld).toHaveLength(0);
  });
});
