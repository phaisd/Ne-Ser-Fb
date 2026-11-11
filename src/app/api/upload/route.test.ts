import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import { POST } from './route';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

describe('/api/upload security & scope guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated JSON base64 uploads with 401', async () => {
    const pngBase64 = 'data:image/png;base64,iVBORw0KGgo=';
    const res = await POST(
      new Request('http://localhost/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '198.51.100.10',
        },
        body: JSON.stringify({ dataUrl: pngBase64 }),
      })
    );
    expect(res.status).toBe(401);
  });

  it('rejects STUDENT role from uploading with branding/admin scope', async () => {
    const stuToken = createSignedSessionToken({
      id: 'stu-1',
      name: 'นิสิตทดสอบ',
      email: '6801001@mcu.ac.th',
      role: 'STUDENT',
      studentCode: '6801001',
      sessionId: 'sess-stu',
    });

    const formData = new FormData();
    formData.append('scope', 'branding');
    formData.append('file', new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'logo.png', { type: 'image/png' }));

    const res = await POST(
      new Request('http://localhost/api/upload', {
        method: 'POST',
        headers: {
          cookie: `mcu_session_token=${encodeURIComponent(stuToken)}`,
          'x-forwarded-for': '198.51.100.11',
        },
        body: formData,
      })
    );
    expect(res.status).toBe(403);
  });

  it('blocks SVG uploads even with valid form data', async () => {
    const formData = new FormData();
    formData.append('file', new File(['<svg><script>alert(1)</script></svg>'], 'xss.svg', { type: 'image/svg+xml' }));

    const res = await POST(
      new Request('http://localhost/api/upload', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '198.51.100.12',
        },
        body: formData,
      })
    );
    expect(res.status).toBe(415);
  });
});
