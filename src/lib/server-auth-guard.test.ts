import { describe, it, expect, afterEach, vi } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import {
  getAuthenticatedUserFromRequest,
  isSelfUserIdentity,
  isServerAdminOrOfficer,
  isServerStaffOrInstructor,
  requireAdminOrOfficer,
  requireStaffOrInstructor,
} from './server-auth-guard';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

describe('server-auth-guard', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('extracts user from signed mcu_session_token even in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_SECRET', '0123456789abcdef0123456789abcdef0123456789abcdef');
    const token = createSignedSessionToken({
      id: 'inst-72',
      name: 'พระครูภาวนาวัฒนบัณฑิต วิ., รศ.ดร.',
      email: 'teacher44@mcu.ac.th',
      role: 'INSTRUCTOR',
    });

    const req = new Request('http://localhost/api/test', {
      headers: { cookie: `mcu_session_token=${encodeURIComponent(token)}` },
    });

    const user = getAuthenticatedUserFromRequest(req);
    expect(user?.id).toBe('inst-72');
    expect(user?.role).toBe('INSTRUCTOR');
    expect(isServerStaffOrInstructor(user)).toBe(true);
    expect(isServerAdminOrOfficer(user)).toBe(false);
  });

  it('rejects unsigned mcu_auth_user cookie fallback in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const spoofed = encodeURIComponent(
      JSON.stringify({ id: 'spoof', email: 'attacker@mcu.ac.th', role: 'SUPER_ADMIN' })
    );
    const req = new Request('http://localhost/api/test', {
      headers: { cookie: `mcu_auth_user=${spoofed}` },
    });

    const user = getAuthenticatedUserFromRequest(req);
    expect(user).toBeNull();
    const adminCheck = requireAdminOrOfficer(req);
    expect(adminCheck.response?.status).toBe(401);
  });

  it('enforces role hierarchy and self-identity helper cleanly', () => {
    const studentToken = createSignedSessionToken({
      id: '6701001',
      name: 'นิสิตทดสอบ',
      email: '6701001@mcu.ac.th',
      role: 'STUDENT',
    });
    const studentReq = new Request('http://localhost/api/test', {
      headers: { cookie: `mcu_session_token=${encodeURIComponent(studentToken)}` },
    });

    const staffCheck = requireStaffOrInstructor(studentReq);
    expect(staffCheck.response?.status).toBe(403);

    expect(
      isSelfUserIdentity(
        { id: 'inst-rachan', name: 'A', email: 'rachan.cit@mcu.ac.th', gmail: 'pmrachan@gmail.com', role: 'INSTRUCTOR' },
        'PMRACHAN@GMAIL.COM'
      )
    ).toBe(true);
    expect(
      isSelfUserIdentity(
        { id: 'inst-rachan', name: 'A', email: 'rachan.cit@mcu.ac.th', role: 'INSTRUCTOR' },
        'inst-72'
      )
    ).toBe(false);
  });
});
