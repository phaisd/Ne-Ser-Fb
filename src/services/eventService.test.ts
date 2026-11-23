import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  batchImportEventRegistrations,
  createEvent,
  deleteEvent,
  getEventRegistrations,
  saveVipassanaAttendance,
  recordVipassanaScanCheckin,
  batchVipassanaOfflineSync,
  batchApproveAndIssueVipassanaCertificates,
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

  it('records realtime Vipassana scan check-in by student code or badge QR payload', async () => {
    vi.mocked(storageHelper.readLocalJson).mockReturnValue([
      {
        id: 'reg-vip-1',
        eventId: 'ev-vipassana',
        studentCode: '6501501071',
        studentName: 'พระสมบัติ มหาปญฺโญ',
        status: 'REGISTERED',
        createdAt: '2026-01-01',
      },
    ]);

    const res = await recordVipassanaScanCheckin({
      eventId: 'ev-vipassana',
      studentCodeOrId: 'VIPASSANA:6501501071',
      dayKey: 'day_1',
      periodKey: 'p1',
      status: 'PRESENT',
      checkInTime: '04:12:30',
      recordedBy: 'MONK_COORDINATOR',
    });

    expect(res.success).toBe(true);
    expect(res.isAlreadyCheckedIn).toBe(false);
    expect(res.registration?.status).toBe('ATTENDED');
    expect(res.registration?.dailyAttendance?.day_1?.p1).toMatchObject({
      status: 'PRESENT',
      checkInTime: '04:12:30',
      recordedBy: 'MONK_COORDINATOR',
    });
    expect(storageHelper.writeLocalJson).toHaveBeenCalled();
  });

  it('batch syncs offline check-in scans into daily attendance', async () => {
    vi.mocked(storageHelper.readLocalJson).mockReturnValue([
      {
        id: 'reg-offline-1',
        eventId: 'ev-vipassana',
        studentCode: 'T101',
        studentName: 'พระมหาสมชาย',
        status: 'REGISTERED',
        createdAt: '2026-01-01',
      },
    ]);

    const result = await batchVipassanaOfflineSync('ev-vipassana', [
      {
        studentCodeOrId: 'T101',
        dayKey: 'day_1',
        periodKey: 'p1',
        status: 'PRESENT',
        checkInTime: '04:15:00',
      },
    ]);

    expect(result.success).toBe(true);
    expect(result.syncedCount).toBe(1);
    expect(storageHelper.writeLocalJson).toHaveBeenCalled();
  });

  it('batch approves registrations and automatically issues digital certificates', async () => {
    vi.mocked(storageHelper.readLocalJson).mockImplementation((file) => {
      if (file === 'events.json') {
        return [{ id: 'ev-vipassana', title: 'วิปัสสนากัมมัฏฐาน 2569', academicYear: '2569' }];
      }
      if (file === 'event_registrations.json') {
        return [
          {
            id: 'reg-pass-1',
            eventId: 'ev-vipassana',
            studentCode: '6701501011',
            studentName: 'พระมหาสมชาย กิตฺติโสภโณ',
            status: 'REGISTERED',
            createdAt: '2026-01-01',
          },
        ];
      }
      if (file === 'certificate_requests.json') {
        return [];
      }
      return [];
    });

    const result = await batchApproveAndIssueVipassanaCertificates({
      eventId: 'ev-vipassana',
      registrationIds: ['reg-pass-1'],
      docNoPrefix: '8002',
      issueDateTh: '22 ธันวาคม 2568',
    });

    expect(result.success).toBe(true);
    expect(result.issuedCount).toBe(1);
    expect(storageHelper.writeLocalJson).toHaveBeenCalledWith(
      'certificate_requests.json',
      expect.arrayContaining([
        expect.objectContaining({
          studentCode: '6701501011',
          docNo: expect.stringContaining('มจร 8002/ว.วป-2569-'),
          status: 'APPROVED',
        }),
      ])
    );
  });

  it('deletes an event, cascade cleans its registrations, and syncs with Google Sheets', async () => {
    const mockDeleteRows = vi.fn(async () => 1);
    const mockGetValues = vi.fn(async (range: string) => {
      if (range === 'Events!A2:A') {
        return [['ev-to-delete'], ['ev-stay']];
      }
      if (range === 'EventRegistrations!A2:B') {
        return [['reg-1', 'ev-to-delete'], ['reg-2', 'ev-stay']];
      }
      return [];
    });

    vi.mocked(storageHelper.getSheetsClient).mockReturnValue({
      deleteRows: mockDeleteRows,
      getValues: mockGetValues,
    } as any);

    vi.mocked(storageHelper.readLocalJson).mockImplementation((file) => {
      if (file === 'events.json') {
        return [{ id: 'ev-to-delete', title: 'ลบทิ้ง' }, { id: 'ev-stay', title: 'ยังอยู่' }];
      }
      if (file === 'event_registrations.json') {
        return [
          { id: 'r1', eventId: 'ev-to-delete', studentCode: '6701' },
          { id: 'r2', eventId: 'ev-stay', studentCode: '6702' },
        ];
      }
      return [];
    });

    const deleted = await deleteEvent('ev-to-delete');
    expect(deleted).toBe(true);

    expect(storageHelper.writeLocalJson).toHaveBeenCalledWith(
      'events.json',
      [{ id: 'ev-stay', title: 'ยังอยู่' }]
    );
    expect(storageHelper.writeLocalJson).toHaveBeenCalledWith(
      'event_registrations.json',
      [{ id: 'r2', eventId: 'ev-stay', studentCode: '6702' }]
    );

    expect(mockDeleteRows).toHaveBeenCalledWith('Events', [1]);
    expect(mockDeleteRows).toHaveBeenCalledWith('EventRegistrations', [1]);
  });
});
