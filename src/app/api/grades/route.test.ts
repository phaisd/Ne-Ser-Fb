import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import { GET, POST } from './route';
import * as storageHelper from '@/services/storageHelper';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

vi.mock('@/services/storageHelper', () => ({
  readLocalJson: vi.fn(() => ({})),
  writeLocalJson: vi.fn(),
}));

describe('/api/grades Serverless Storage & Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated POST /api/grades with 401', async () => {
    const res = await POST(
      new Request('http://localhost/api/grades', {
        method: 'POST',
        body: JSON.stringify({ courseCode: '000 101', sheet: { rows: [] } }),
      })
    );
    expect(res.status).toBe(401);
    expect(storageHelper.writeLocalJson).not.toHaveBeenCalled();
  });

  it('saves grades through Vercel-compatible storageHelper when called by an instructor', async () => {
    const token = createSignedSessionToken({
      id: 'inst-2',
      name: 'Teacher',
      email: 'teacher@mcu.ac.th',
      role: 'INSTRUCTOR',
    });

    const res = await POST(
      new Request('http://localhost/api/grades', {
        method: 'POST',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(token)}` },
        body: JSON.stringify({ courseCode: '000 101', sheet: { rows: [] } }),
      })
    );
    expect(res.status).toBe(200);
    expect(storageHelper.writeLocalJson).toHaveBeenCalledWith(
      'course-grades.json',
      expect.objectContaining({
        '000 101': expect.objectContaining({ courseCode: '000 101' }),
      })
    );

    const unauthGetRes = await GET(new Request('http://localhost/api/grades?courseCode=000%20101'));
    expect(unauthGetRes.status).toBe(401);

    const studentToken = createSignedSessionToken({
      id: '6801501001',
      name: 'Student One',
      email: '6801501001@mcu.ac.th',
      role: 'STUDENT',
    });
    const studentGetRes = await GET(
      new Request('http://localhost/api/grades?courseCode=000%20101', {
        headers: { cookie: `mcu_session_token=${encodeURIComponent(studentToken)}` },
      })
    );
    expect(studentGetRes.status).toBe(403);

    const getRes = await GET(
      new Request('http://localhost/api/grades?courseCode=000%20101', {
        headers: { cookie: `mcu_session_token=${encodeURIComponent(token)}` },
      })
    );
    expect(getRes.status).toBe(200);
  });
});
