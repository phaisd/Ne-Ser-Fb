import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import { GET, POST } from './route';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

vi.mock('@/lib/data-store', () => ({
  getSystemSettings: vi.fn(async () => ({
    universityNameTh: 'มจร',
    facultyNameTh: 'คณะพุทธศาสตร์',
    logoUrl: '/uploads/logo.png',
    lineNotifyToken: 'secret-line-token',
    lineChannelAccessToken: 'secret-channel-token',
    lineTargetUserId: 'U123456',
    lineWebhookUrl: 'https://example.com/hook',
  })),
  updateSystemSettings: vi.fn(async (body: Record<string, unknown>) => ({
    universityNameTh: 'มจร',
    facultyNameTh: 'คณะพุทธศาสตร์',
    logoUrl: '/uploads/logo.png',
    ...body,
  })),
}));

describe('/api/system-settings secret masking & RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('masks LINE notification credentials for unauthenticated GET requests', async () => {
    const res = await GET(new Request('http://localhost/api/system-settings'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.facultyNameTh).toBe('คณะพุทธศาสตร์');
    expect(data.data.lineNotifyToken).toBeUndefined();
    expect(data.data.lineChannelAccessToken).toBeUndefined();
    expect(data.data.lineTargetUserId).toBeUndefined();
    expect(data.data.lineWebhookUrl).toBeUndefined();
  });

  it('includes LINE credentials for ADMIN GET requests and blocks SVG POST logos', async () => {
    const adminToken = createSignedSessionToken({
      id: 'admin-1',
      name: 'แอดมิน',
      email: 'admin@mcu.ac.th',
      role: 'ADMIN',
      sessionId: 'sess-admin',
    });

    const adminGet = await GET(
      new Request('http://localhost/api/system-settings', {
        headers: { cookie: `mcu_session_token=${encodeURIComponent(adminToken)}` },
      })
    );
    const adminData = await adminGet.json();
    expect(adminData.data.lineNotifyToken).toBe('secret-line-token');

    const svgPost = await POST(
      new Request('http://localhost/api/system-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `mcu_session_token=${encodeURIComponent(adminToken)}`,
        },
        body: JSON.stringify({
          logoUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
        }),
      })
    );
    expect(svgPost.status).toBe(415);
  });
});
