import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import * as dataStore from '@/lib/data-store';
import * as googleAuth from '@/lib/google-auth';

vi.mock('@/lib/google-auth', () => ({
  verifyGoogleIdToken: vi.fn(),
}));

vi.mock('@/lib/session-manager', () => ({
  recordUserLogin: vi.fn(() => ({ sessionId: 'sess-123' })),
  recordFailedLoginAttempt: vi.fn(),
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
  revokeUserSession: vi.fn(),
  getUserLoginHistory: vi.fn(() => []),
  analyzeLoginSecurity: vi.fn(() => ({ riskLevel: 'LOW' })),
}));

vi.mock('@/lib/data-store', () => ({
  authenticateInstructor: vi.fn(),
  authenticateGoogleUser: vi.fn(async (gmail: string) => ({
    id: 'inst-admin',
    name: 'Admin User',
    email: gmail,
    role: 'SUPER_ADMIN',
  })),
  authenticateStudent: vi.fn(async () => null),
  getInstructorAccounts: vi.fn(async () => []),
  getStudents: vi.fn(async () => []),
  getSystemSettings: vi.fn(async () => ({ googleClientId: 'test-client-id' })),
  updateInstructorPassword: vi.fn(),
  updateStudentPassword: vi.fn(),
}));

describe('/api/auth Google & credential security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects passwordless Google/Gmail login without verified OAuth credential', async () => {
    const res1 = await POST(
      new Request('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({ provider: 'google', gmail: 'phaisal.dis@mcu.ac.th' }),
      })
    );
    expect(res1.status).toBe(401);
    expect(dataStore.authenticateGoogleUser).not.toHaveBeenCalled();

    const res2 = await POST(
      new Request('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({ gmail: 'phaisal.dis@mcu.ac.th' }),
      })
    );
    expect(res2.status).toBe(400);
    expect(dataStore.authenticateGoogleUser).not.toHaveBeenCalled();
  });

  it('rejects forged or invalid Google ID token credentials', async () => {
    vi.mocked(googleAuth.verifyGoogleIdToken).mockResolvedValue({
      valid: false,
      error: 'Google ID Token ไม่ถูกต้องหรือหมดอายุแล้ว',
    });

    const res = await POST(
      new Request('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'google',
          credential: 'forged.payload.sig',
        }),
      })
    );
    expect(res.status).toBe(401);
    expect(dataStore.authenticateGoogleUser).not.toHaveBeenCalled();
  });

  it('allows login only when Google ID token verifies cleanly', async () => {
    vi.mocked(googleAuth.verifyGoogleIdToken).mockResolvedValue({
      valid: true,
      email: 'phaisal.dis@mcu.ac.th',
    });

    const res = await POST(
      new Request('http://localhost/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'google',
          credential: 'valid.header.sig',
        }),
      })
    );
    expect(res.status).toBe(200);
    expect(googleAuth.verifyGoogleIdToken).toHaveBeenCalledWith('valid.header.sig', 'test-client-id');
    expect(dataStore.authenticateGoogleUser).toHaveBeenCalledWith('phaisal.dis@mcu.ac.th');
  });
});
