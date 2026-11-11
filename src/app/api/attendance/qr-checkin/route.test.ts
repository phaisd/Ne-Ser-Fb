import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import { GET, POST } from './route';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

vi.mock('@/services/storageHelper', () => ({
  readLocalJson: vi.fn(() => ({
    '000101__2026-11-11': {
      key: '000101__2026-11-11',
      courseCode: '000101',
      courseName: 'พระพุทธศาสนา',
      date: '2026-11-11',
      sessionNumber: 1,
      pin: '54321',
      checkInStatus: 'PRESENT',
      isOpen: true,
      instructorName: 'อ.ทดสอบ',
      room: 'B201',
      updatedAt: '2026-11-11T08:00:00.000Z',
    },
  })),
  writeLocalJson: vi.fn(),
}));

vi.mock('@/services/attendanceService', () => ({
  getAttendanceRecords: vi.fn(async () => [
    {
      courseCode: '000101',
      courseName: 'พระพุทธศาสนา',
      date: '2026-11-11',
      studentCode: '6801001',
      studentName: 'นิสิตทดสอบ',
      status: 'PRESENT',
      recordedBy: 'QR',
    },
  ]),
  saveAttendanceBatch: vi.fn(async () => undefined),
}));

vi.mock('@/lib/data-store', () => ({
  getStudents: vi.fn(async () => []),
  getCourses: vi.fn(async () => []),
}));

describe('/api/attendance/qr-checkin RBAC & PIN privacy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('omits session.pin and checkedInRecords for unauthenticated callers on GET', async () => {
    const res = await GET(
      new Request('http://localhost/api/attendance/qr-checkin?courseCode=000101&date=2026-11-11')
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.session.pin).toBeUndefined();
    expect(data.session.courseCode).toBe('000101');
    expect(data.checkedInRecords).toEqual([]);
  });

  it('returns session.pin and checkedInRecords for INSTRUCTOR callers on GET', async () => {
    const token = createSignedSessionToken({
      id: 'inst-1',
      name: 'อ.ทดสอบ',
      email: 'inst@mcu.ac.th',
      role: 'INSTRUCTOR',
      sessionId: 'sess-inst',
    });

    const res = await GET(
      new Request('http://localhost/api/attendance/qr-checkin?courseCode=000101&date=2026-11-11', {
        headers: { cookie: `mcu_session_token=${encodeURIComponent(token)}` },
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.session.pin).toBe('54321');
    expect(data.checkedInRecords).toHaveLength(1);
  });

  it('rejects unauthenticated and STUDENT UPSERT_SESSION calls, allows INSTRUCTOR', async () => {
    const anonRes = await POST(
      new Request('http://localhost/api/attendance/qr-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPSERT_SESSION',
          courseCode: '000101',
          date: '2026-11-11',
          pin: '99999',
        }),
      })
    );
    expect(anonRes.status).toBe(401);

    const stuToken = createSignedSessionToken({
      id: 'stu-1',
      name: 'นิสิตทดสอบ',
      email: '6801001@mcu.ac.th',
      role: 'STUDENT',
      studentCode: '6801001',
      sessionId: 'sess-stu',
    });
    const stuRes = await POST(
      new Request('http://localhost/api/attendance/qr-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `mcu_session_token=${encodeURIComponent(stuToken)}`,
        },
        body: JSON.stringify({
          action: 'UPSERT_SESSION',
          courseCode: '000101',
          date: '2026-11-11',
          pin: '99999',
        }),
      })
    );
    expect(stuRes.status).toBe(403);

    const instToken = createSignedSessionToken({
      id: 'inst-1',
      name: 'อ.ทดสอบ',
      email: 'inst@mcu.ac.th',
      role: 'INSTRUCTOR',
      sessionId: 'sess-inst',
    });
    const instRes = await POST(
      new Request('http://localhost/api/attendance/qr-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `mcu_session_token=${encodeURIComponent(instToken)}`,
        },
        body: JSON.stringify({
          action: 'UPSERT_SESSION',
          courseCode: '000101',
          date: '2026-11-11',
          pin: '88888',
        }),
      })
    );
    const instData = await instRes.json();
    expect(instRes.status).toBe(200);
    expect(instData.session.pin).toBe('88888');
  });
});
