import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth-security';
import { validateUserSession } from '@/lib/session-manager';

export interface ServerAuthUser {
  id: string;
  name: string;
  email: string;
  gmail?: string;
  studentCode?: string;
  role: string;
  department?: string;
  faculty?: string;
  programType?: string;
  mustChangePassword?: boolean;
  isSuperAdmin?: boolean;
}

/**
 * Extracts and verifies the authenticated user from server request headers/cookies.
 * Uses the HMAC signed session cookie (mcu_session_token) as the source of truth.
 * Unsigned mcu_auth_user JSON fallback is restricted strictly to non-production environments.
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

  // Fallback to parsed client cookie ONLY in non-production (dev/test)
  if (process.env.NODE_ENV !== 'production') {
    const userMatch = cookieHeader.match(/mcu_auth_user=([^;]+)/);
    if (userMatch && userMatch[1]) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userMatch[1]));
        if (parsed && (parsed.email || parsed.id)) {
          return {
            id: parsed.id || parsed.studentCode || parsed.email,
            name: parsed.name,
            email: parsed.email,
            gmail: parsed.gmail,
            studentCode: parsed.studentCode,
            role: parsed.role || 'GUEST',
            department: parsed.department,
            faculty: parsed.faculty,
            programType: parsed.programType,
            isSuperAdmin: Boolean(parsed.isSuperAdmin),
          };
        }
      } catch {}
    }
  }

  return null;
}

/**
 * Checks if a user has Super Admin authority
 */
export function isServerSuperAdmin(user?: ServerAuthUser | null): boolean {
  if (!user) return false;
  const role = String(user.role || '').toUpperCase();
  return (
    role === 'SUPER_ADMIN' ||
    Boolean(user.isSuperAdmin) ||
    user.email?.toLowerCase() === 'phaisal.dis@mcu.ac.th'
  );
}

/**
 * Checks if a user has Admin or Officer role
 */
export function isServerAdminOrOfficer(user?: ServerAuthUser | null): boolean {
  if (!user) return false;
  const role = String(user.role || '').toUpperCase();
  return (
    isServerSuperAdmin(user) ||
    role === 'ADMIN' ||
    role === 'OFFICER' ||
    role === 'STAFF' ||
    role === 'EDITOR'
  );
}

/**
 * Checks if a user has teaching staff, officer, or admin authority (excludes students & guests)
 */
export function isServerStaffOrInstructor(user?: ServerAuthUser | null): boolean {
  if (!user) return false;
  if (isServerAdminOrOfficer(user)) return true;
  const role = String(user.role || '').toUpperCase();
  return role === 'INSTRUCTOR';
}

/**
 * Checks if a target identifier matches the authenticated user's own identity
 */
export function isSelfUserIdentity(user: ServerAuthUser | null | undefined, targetId?: string | null): boolean {
  if (!user || !targetId) return false;
  const cleanTarget = String(targetId).trim().toLowerCase();
  if (!cleanTarget) return false;
  const ownKeys = [user.id, user.email, user.gmail, user.studentCode]
    .filter(Boolean)
    .map((v) => String(v).trim().toLowerCase());
  return ownKeys.includes(cleanTarget);
}

export function requireAuthenticatedUser(
  request: Request
): { user: ServerAuthUser; response?: never } | { user?: null; response: NextResponse } {
  const user = getAuthenticatedUserFromRequest(request);
  if (!user || String(user.role || '').toUpperCase() === 'GUEST') {
    return {
      response: NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ (Unauthorized)' },
        { status: 401 }
      ),
    };
  }
  return { user };
}

export function requireAdminOrOfficer(
  request: Request
): { user: ServerAuthUser; response?: never } | { user?: null; response: NextResponse } {
  const auth = requireAuthenticatedUser(request);
  if (auth.response) return auth;
  if (!isServerAdminOrOfficer(auth.user)) {
    return {
      response: NextResponse.json(
        { success: false, error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบและเจ้าหน้าที่เท่านั้น (Forbidden)' },
        { status: 403 }
      ),
    };
  }
  return { user: auth.user };
}

export function requireStaffOrInstructor(
  request: Request
): { user: ServerAuthUser; response?: never } | { user?: null; response: NextResponse } {
  const auth = requireAuthenticatedUser(request);
  if (auth.response) return auth;
  if (!isServerStaffOrInstructor(auth.user)) {
    return {
      response: NextResponse.json(
        { success: false, error: 'สงวนสิทธิ์เฉพาะอาจารย์ เจ้าหน้าที่ และผู้ดูแลระบบเท่านั้น (Forbidden)' },
        { status: 403 }
      ),
    };
  }
  return { user: auth.user };
}

/**
 * Masks sensitive personal information (PDPA compliance) for public or unauthorized views
 */
export function maskSensitiveStudentData<T extends object>(student: T): T {
  const copy = { ...student } as Record<string, unknown>;
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
  if (typeof copy.phone === 'string' && copy.phone.trim()) {
    const clean = copy.phone.trim();
    copy.phone = clean.length > 6 ? `${clean.slice(0, 3)}•••${clean.slice(-3)}` : '•••-•••';
  }
  if (typeof copy.email === 'string' && copy.email && !copy.email.endsWith('@mcu.ac.th')) {
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
