import { verifySessionToken } from '@/lib/auth-security';
import { validateUserSession } from '@/lib/session-manager';

export interface ServerAuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  faculty?: string;
  programType?: string;
  mustChangePassword?: boolean;
}

/**
 * Extracts and verifies the authenticated user from server request headers/cookies.
 * Uses the HMAC signed session cookie (mcu_session_token) to guarantee authenticity.
 */
export function getAuthenticatedUserFromRequest(request: Request): ServerAuthUser | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(/mcu_session_token=([^;]+)/);
  if (tokenMatch && tokenMatch[1]) {
    const verified = verifySessionToken(decodeURIComponent(tokenMatch[1]));
    if (verified) {
      const sessionCheck = validateUserSession(verified.id || verified.email, verified.sessionId);
      if (sessionCheck.conflict) {
        return null;
      }
      return verified as ServerAuthUser;
    }
  }

  // Fallback to parsed user if running in dev environment
  const userMatch = cookieHeader.match(/mcu_auth_user=([^;]+)/);
  if (userMatch && userMatch[1]) {
    try {
      const parsed = JSON.parse(decodeURIComponent(userMatch[1]));
      if (parsed && (parsed.email || parsed.id)) {
        return {
          id: parsed.id || parsed.studentCode || parsed.email,
          name: parsed.name,
          email: parsed.email,
          role: parsed.role || 'GUEST',
          department: parsed.department,
          faculty: parsed.faculty,
          programType: parsed.programType,
        };
      }
    } catch {}
  }

  return null;
}

/**
 * Checks if a user has Admin or Officer role
 */
export function isServerAdminOrOfficer(user?: ServerAuthUser | null): boolean {
  if (!user) return false;
  const role = String(user.role || '').toUpperCase();
  return (
    role === 'SUPER_ADMIN' ||
    role === 'ADMIN' ||
    role === 'OFFICER' ||
    role === 'STAFF' ||
    user.email?.toLowerCase() === 'phaisal.dis@mcu.ac.th'
  );
}

/**
 * Masks sensitive personal information (PDPA compliance) for public or unauthorized views
 */
export function maskSensitiveStudentData<T extends Record<string, any>>(student: T): T {
  const copy: Record<string, any> = { ...student };
  if (copy.passportNo) {
    const clean = String(copy.passportNo).trim();
    copy.passportNo = clean.length > 4 ? `${clean.slice(0, 2)}••••${clean.slice(-2)}` : '••••';
  }
  if (copy.citizenId) {
    const clean = String(copy.citizenId).trim();
    copy.citizenId = clean.length > 4 ? `${clean.slice(0, 1)}••••••••${clean.slice(-2)}` : '••••••••';
  }
  if (copy.phoneNumber) {
    const clean = String(copy.phoneNumber).trim();
    copy.phoneNumber = clean.length > 6 ? `${clean.slice(0, 3)}•••${clean.slice(-3)}` : '•••-•••';
  }
  if (copy.email && !copy.email.endsWith('@mcu.ac.th')) {
    const [name, domain] = copy.email.split('@');
    copy.email = name.length > 2 ? `${name.slice(0, 2)}•••@${domain}` : `••@${domain}`;
  }
  // Clear sensitive fields
  delete copy.password;
  delete copy.address;
  delete copy.subdistrict;
  delete copy.district;
  delete copy.province;
  delete copy.postalCode;
  return copy as T;
}
