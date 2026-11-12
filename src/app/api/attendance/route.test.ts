import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import { GET, POST, DELETE } from './route';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

vi.mock('@/lib/data-store', () => ({
  getAttendanceRecords: vi.fn(async () => [{ id: 'att-1', courseCode: '000 101', status: 'PRESENT' }]),
  saveAttendanceBatch: vi.fn(async (records: unknown[]) => records.length),
  deleteAttendanceRecord: vi.fn(async () => undefined),
  clearAttendanceRecords: vi.fn(async () => 3),
}));

describe('/api/attendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists attendance records on GET', async () => {
    const res = await GET(new Request('http://localhost/api/attendance?courseCode=000%20101'));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.count).toBe(1);
  });

  it('requires staff or instructor for POST and validates records array', async () => {
    const unauth = await POST(
      new Request('http://localhost/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: [{ id: '1' }] }),
      })
    );
    expect(unauth.status).toBe(401);

    const teacherToken = createSignedSessionToken({
      id: 'inst-1',
      name: 'อาจารย์',
      email: 'inst@mcu.ac.th',
      role: 'INSTRUCTOR',
      sessionId: 'sess-inst',
    });

    const emptyRes = await POST(
      new Request('http://localhost/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `mcu_session_token=${encodeURIComponent(teacherToken)}`,
        },
        body: JSON.stringify({ records: [] }),
      })
    );
    expect(emptyRes.status).toBe(400);

    const okRes = await POST(
      new Request('http://localhost/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `mcu_session_token=${encodeURIComponent(teacherToken)}`,
        },
        body: JSON.stringify({ records: [{ studentCode: '6701001' }] }),
      })
    );
    const json = await okRes.json();
    expect(okRes.status).toBe(200);
    expect(json.count).toBe(1);
  });

  it('restricts clear-all DELETE to ADMIN/OFFICER', async () => {
    const teacherToken = createSignedSessionToken({
      id: 'inst-1',
      name: 'อาจารย์',
      email: 'inst@mcu.ac.th',
      role: 'INSTRUCTOR',
      sessionId: 'sess-inst',
    });

    const forbidden = await DELETE(
      new Request('http://localhost/api/attendance?action=clear-all', {
        method: 'DELETE',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(teacherToken)}` },
      })
    );
    expect(forbidden.status).toBe(403);
  });
});
