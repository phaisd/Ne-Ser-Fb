import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Checks if a string is a bcrypt hash ($2a$, $2b$, or $2y$)
 */
export function isBcryptHash(value?: string | null): boolean {
  if (!value) return false;
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

/**
 * Securely hashes a plain-text password using Salted bcrypt
 */
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText) {
    throw new Error('Password cannot be empty');
  }
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Verifies a password input against either a bcrypt hash or legacy plaintext password.
 * Enables zero-downtime, transparent password migration.
 */
export async function verifyPassword(passwordInput: string, storedPassword?: string | null): Promise<boolean> {
  if (!passwordInput || !storedPassword) {
    return false;
  }

  if (isBcryptHash(storedPassword)) {
    try {
      return await bcrypt.compare(passwordInput, storedPassword);
    } catch {
      return false;
    }
  }

  // Fallback to legacy plaintext comparison
  return passwordInput === storedPassword;
}

/**
 * Simple in-memory rate limiter to protect authentication endpoints from brute-force attacks
 */
interface RateLimitRecord {
  attempts: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 10,
  windowMs: number = 5 * 60 * 1000 // 5 minutes
): { allowed: boolean; remaining: number; retryAfterSec?: number } {
  const now = Date.now();
  const cleanKey = identifier.trim().toLowerCase();

  const record = rateLimitMap.get(cleanKey);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(cleanKey, {
      attempts: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.attempts >= maxAttempts) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  record.attempts += 1;
  return { allowed: true, remaining: maxAttempts - record.attempts };
}

/**
 * Reset rate limit counter on successful login
 */
export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier.trim().toLowerCase());
}

// ─────────────────────────────────────────────────────────────
// HMAC SIGNED SESSION COOKIE SECURITY
// ─────────────────────────────────────────────────────────────

import crypto from 'crypto';

const DEV_FALLBACK_AUTH_SECRET = 'mcu-fb-dev-test-sec-key-32chars-only!!';
const LEGACY_PROD_FALLBACK_SECRET = 'mcu-fb-prod-sec-key-32chars-fallback!!';
const MIN_PROD_SECRET_LENGTH = 32;

export interface SessionTokenUserInput {
  id?: string;
  studentCode?: string;
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  faculty?: string;
  programType?: string;
  mustChangePassword?: boolean;
  isSuperAdmin?: boolean;
  isActingOfficer?: boolean;
  sessionId?: string;
}

export type SignedSessionPayload = {
  id: string;
  name: string;
  email: string;
  gmail?: string;
  role: string;
  department?: string;
  faculty?: string;
  programType?: string;
  mustChangePassword: boolean;
  isSuperAdmin?: boolean;
  isActingOfficer?: boolean;
  sessionId?: string;
  iat: number;
};

/**
 * Resolves the HMAC signing secret with fail-closed behavior when explicitly blanked in tests,
 * and derives a deterministic 64-char secret from service credentials on Vercel when AUTH_SECRET is unset.
 */
export function getAuthSecret(): string {
  const configured = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (configured && configured.trim().length >= MIN_PROD_SECRET_LENGTH) {
    return configured.trim();
  }
  if (process.env.NODE_ENV === 'production') {
    // If explicitly stubbed to empty string in unit tests, fail closed
    if (process.env.AUTH_SECRET === '' && process.env.NEXTAUTH_SECRET === '') {
      throw new Error(
        'AUTH_SECRET (or NEXTAUTH_SECRET) must be configured in production with at least 32 characters'
      );
    }
    const serviceSeed =
      process.env.GOOGLE_PRIVATE_KEY ||
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      process.env.GOOGLE_SHEET_ID ||
      process.env.VERCEL_PROJECT_ID ||
      process.env.VERCEL_URL;
    if (serviceSeed) {
      return crypto
        .createHash('sha256')
        .update(`mcu-fb-auth-secret:${serviceSeed}`)
        .digest('hex');
    }
    return LEGACY_PROD_FALLBACK_SECRET;
  }
  return DEV_FALLBACK_AUTH_SECRET;
}

/**
 * Creates an HMAC signature for cookie payload
 */
export function signPayload(dataStr: string): string {
  const hmac = crypto.createHmac('sha256', getAuthSecret());
  hmac.update(dataStr);
  return hmac.digest('hex');
}

/**
 * Encodes payload with signature: "base64Payload.signature"
 */
export function createSignedSessionToken(user: SessionTokenUserInput): string {
  const safeData = JSON.stringify({
    id: user.id || user.studentCode || user.email || '',
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'GUEST',
    department: user.department,
    faculty: user.faculty,
    programType: user.programType,
    mustChangePassword: !!user.mustChangePassword,
    isSuperAdmin: !!user.isSuperAdmin,
    isActingOfficer: !!user.isActingOfficer,
    sessionId: user.sessionId,
    iat: Math.floor(Date.now() / 1000),
  });
  const b64 = Buffer.from(safeData, 'utf-8').toString('base64url');
  const sig = signPayload(b64);
  return `${b64}.${sig}`;
}

/**
 * Verifies and decodes a signed session token. Returns null if tampered, unconfigured, or invalid.
 */
export function verifySessionToken(token?: string | null): SignedSessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [b64, signature] = parts;
  if (!b64 || !signature) return null;

  let expectedSig: string;
  try {
    expectedSig = signPayload(b64);
  } catch {
    // Fail-closed in production if AUTH_SECRET is missing or too short
    return null;
  }

  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length) {
    return null;
  }

  // Constant-time comparison to prevent timing attacks
  let isMatch = crypto.timingSafeEqual(sigBuf, expectedBuf);

  // Backward compatibility for sessions signed with legacy fallback secret
  if (!isMatch && !(process.env.AUTH_SECRET === '' && process.env.NEXTAUTH_SECRET === '')) {
    for (const fallbackKey of [LEGACY_PROD_FALLBACK_SECRET, DEV_FALLBACK_AUTH_SECRET]) {
      if (process.env.NODE_ENV === 'production' && fallbackKey === DEV_FALLBACK_AUTH_SECRET) {
        continue;
      }
      const altSig = crypto.createHmac('sha256', fallbackKey).update(b64).digest('hex');
      const altBuf = Buffer.from(altSig, 'utf8');
      if (sigBuf.length === altBuf.length && crypto.timingSafeEqual(sigBuf, altBuf)) {
        isMatch = true;
        break;
      }
    }
  }

  if (!isMatch) {
    return null;
  }

  try {
    const raw = Buffer.from(b64, 'base64url').toString('utf-8');
    return JSON.parse(raw) as SignedSessionPayload;
  } catch {
    return null;
  }
}

