import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  batchImportEventRegistrations,
  createEvent,
  getEventRegistrations,
  saveVipassanaAttendance,
} from './eventService';
import * as storageHelper from './storageHelper';

vi.mock('./storageHelper', () => ({
  readLocalJson: vi.fn(() => []),
  writeLocalJson: vi.fn(),
  getSheetsClient: vi.fn(() => null),
}));

vi.mock('./studentService', () => ({
  getStudents: vi.fn(async () => []),
}));

describe('eventService unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an event with defaults and writes local storage', async () => {
    vi.mocked(storageHelper.readLocalJson).mockReturnValue([]);
    const created = await createEvent({
      title: 'โครงการปฏิบัติธรรม',
      eventType: 'MEDITATION',
      startDate: '2026-12-01',
      endDate: '2026-12-10',
      location: 'มจร',
      academicYear: '2569',
      semester: 2,
      maxParticipants: 300,
      status: 'ACTIVE',
      targetDegree: 'ALL',
      targetProgram: 'ALL',
    });

    expect(created.id).toMatch(/^evt-/);
    expect(created.title).toBe('โครงการปฏิบัติธรรม');
    expect(storageHelper.writeLocalJson).toHaveBeenCalledWith(
      'events.json',
      expect.arrayContaining([expect.objectContaining({ id: created.id })])
    );
  });

  it('batch imports grouped registrations while deduplicating existing and intra-batch duplicates', async () => {
    vi.mocked(storageHelper.readLocalJson).mockImplementation((file) => {
      if (file === 'events.json') {
        return [{ id: 'ev-1', title: 'วิปัสสนา 2569' }];
      }
      if (file === 'event_registrations.json') {
        return [
          {
            id: 'reg-existing',
            eventId: 'ev-1',
            studentCode: 'T321',
            studentName: 'พระมหาสมชาย',
            groupNumber: 3,
            status: 'REGISTERED',
            createdAt: '2026-01-01',
          },
        ];
      }
      return [];
    });

    const result = await batchImportEventRegistrations(
      'ev-1',
      [
        { studentCode: 'T321', studentName: 'พระมหาสมชาย', groupNumber: 3 }, // duplicate in storage
        { studentCode: 'T322', studentName: 'สามเณรธีรภัทร', groupNumber: 3 },
        { studentCode: 'T322', studentName: 'ซ้ำในชุดเดียวกัน', groupNumber: 3 }, // duplicate code in batch
      ],
      'APPEND'
    );

    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(2);
    expect(result.items[0]).toMatchObject({
      studentCode: 'T322',
      groupNumber: 3,
      groupName: 'กลุ่มที่ 3',
      eventTitle: 'วิปัสสนา 2569',
    });
  });

  it('saves Vipassana 4-period daily attendance records for existing registrations', async () => {
    vi.mocked(storageHelper.readLocalJson).mockReturnValue([
      {
        id: 'reg-1',
        eventId: 'ev-1',
        studentCode: 'T321',
        studentName: 'พระสมชาย',
        status: 'REGISTERED',
        createdAt: '2026-01-01',
      },
    ]);

    await saveVipassanaAttendance('ev-1', 'day_1', [
      {
        registrationId: 'reg-1',
        p1: { status: 'PRESENT' },
        p2: { status: 'PRESENT' },
        p3: { status: 'LATE' },
        p4: { status: 'PRESENT' },
        remark: 'ตรงเวลา',
      },
    ]);

    expect(storageHelper.writeLocalJson).toHaveBeenCalledWith(
      'event_registrations.json',
      expect.arrayContaining([
        expect.objectContaining({
          id: 'reg-1',
          status: 'REGISTERED',
          remarks: 'ตรงเวลา',
          dailyAttendance: expect.objectContaining({
            day_1: expect.objectContaining({
              p3: expect.objectContaining({ status: 'LATE' }),
            }),
          }),
        }),
      ])
    );

    const regs = await getEventRegistrations('ev-1');
    expect(regs).toHaveLength(1);
  });
});
