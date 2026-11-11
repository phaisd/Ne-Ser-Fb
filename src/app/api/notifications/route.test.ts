import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import { POST } from './route';
import * as notifier from '@/lib/notifier';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

vi.mock('@/lib/notifier', () => ({
  sendNotification: vi.fn(async () => ({ sent: true })),
}));

describe('/api/notifications RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated and STUDENT callers', async () => {
    const anon = await POST(
      new Request('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ studentName: 'Test' }),
      })
    );
    expect(anon.status).toBe(401);

    const studentToken = createSignedSessionToken({
      id: 'stu-1',
      name: 'Student',
      email: 'student@mcu.ac.th',
      role: 'STUDENT',
    });
    const stuRes = await POST(
      new Request('http://localhost/api/notifications', {
        method: 'POST',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(studentToken)}` },
        body: JSON.stringify({ studentName: 'Test' }),
      })
    );
    expect(stuRes.status).toBe(403);
    expect(notifier.sendNotification).not.toHaveBeenCalled();
  });

  it('allows ADMIN or INSTRUCTOR to send test notifications', async () => {
    const adminToken = createSignedSessionToken({
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@mcu.ac.th',
      role: 'ADMIN',
    });
    const res = await POST(
      new Request('http://localhost/api/notifications', {
        method: 'POST',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(adminToken)}` },
        body: JSON.stringify({ studentName: 'Test Admin' }),
      })
    );
    expect(res.status).toBe(200);
    expect(notifier.sendNotification).toHaveBeenCalledTimes(1);
  });
});
