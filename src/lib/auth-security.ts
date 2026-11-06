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

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'mcu-fb-prod-sec-key-32chars-fallback!!';

/**
 * Creates an HMAC signature for cookie payload
 */
export function signPayload(dataStr: string): string {
  const hmac = crypto.createHmac('sha256', AUTH_SECRET);
  hmac.update(dataStr);
  return hmac.digest('hex');
}

/**
 * Encodes payload with signature: "base64Payload.signature"
 */
export function createSignedSessionToken(user: any): string {
  const safeData = JSON.stringify({
    id: user.id || user.studentCode || user.email,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    faculty: user.faculty,
    programType: user.programType,
    mustChangePassword: !!user.mustChangePassword,
    iat: Math.floor(Date.now() / 1000),
  });
  const b64 = Buffer.from(safeData, 'utf-8').toString('base64url');
  const sig = signPayload(b64);
  return `${b64}.${sig}`;
}

/**
 * Verifies and decodes a signed session token. Returns null if tampered or invalid.
 */
export function verifySessionToken(token?: string | null): any | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [b64, signature] = parts;
  const expectedSig = signPayload(b64);

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const raw = Buffer.from(b64, 'base64url').toString('utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

