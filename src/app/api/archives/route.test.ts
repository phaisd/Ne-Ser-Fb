import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import { GET, POST } from './route';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

vi.mock('@/lib/data-store', () => ({
  getAcademicYearArchives: vi.fn(async () => [{ year: '2568', archivedAt: '2026-01-01' }]),
  archiveAcademicYear: vi.fn(async (year: string) => ({ year, archivedAt: '2026-11-12' })),
}));

describe('/api/archives', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns archive list on GET', async () => {
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
  });

  it('requires ADMIN or OFFICER on POST and validates year', async () => {
    const unauth = await POST(
      new Request('http://localhost/api/archives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: '2569' }),
      })
    );
    expect(unauth.status).toBe(401);

    const adminToken = createSignedSessionToken({
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@mcu.ac.th',
      role: 'ADMIN',
      sessionId: 'sess-1',
    });

    const missingYear = await POST(
      new Request('http://localhost/api/archives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `mcu_session_token=${encodeURIComponent(adminToken)}`,
        },
        body: JSON.stringify({}),
      })
    );
    expect(missingYear.status).toBe(400);

    const ok = await POST(
      new Request('http://localhost/api/archives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `mcu_session_token=${encodeURIComponent(adminToken)}`,
        },
        body: JSON.stringify({ year: '2569' }),
      })
    );
    const json = await ok.json();
    expect(ok.status).toBe(200);
    expect(json.data.year).toBe('2569');
  });
});
