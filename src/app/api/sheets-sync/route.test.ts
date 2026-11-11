import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import { GET } from './route';
import * as googleSheets from '@/lib/google-sheets';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

vi.mock('@/lib/google-sheets', () => ({
  getSheetsClient: vi.fn(() => null),
}));

describe('/api/sheets-sync authorization guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated GET /api/sheets-sync with 401', async () => {
    const res = await GET(new Request('http://localhost/api/sheets-sync'));
    expect(res.status).toBe(401);
  });

  it('rejects instructor GET /api/sheets-sync with 403', async () => {
    const instructorToken = createSignedSessionToken({
      id: 'inst-1',
      email: 'inst1@mcu.ac.th',
      role: 'INSTRUCTOR',
    });
    const res = await GET(
      new Request('http://localhost/api/sheets-sync', {
        headers: { cookie: `mcu_session_token=${encodeURIComponent(instructorToken)}` },
      })
    );
    expect(res.status).toBe(403);
  });

  it('allows admin GET /api/sheets-sync', async () => {
    const adminToken = createSignedSessionToken({
      id: 'admin-1',
      email: 'admin@mcu.ac.th',
      role: 'ADMIN',
    });
    vi.mocked(googleSheets.getSheetsClient).mockReturnValueOnce(null);

    const res = await GET(
      new Request('http://localhost/api/sheets-sync', {
        headers: { cookie: `mcu_session_token=${encodeURIComponent(adminToken)}` },
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('configured', false);
  });
});
