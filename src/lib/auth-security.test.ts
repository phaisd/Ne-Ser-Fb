import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  isBcryptHash,
  checkRateLimit,
  resetRateLimit,
  createSignedSessionToken,
  verifySessionToken,
} from './auth-security';

describe('auth-security module', () => {
  it('hashes plain-text password into valid bcrypt format', async () => {
    const plain = 'StrongPass123!';
    const hash = await hashPassword(plain);

    expect(isBcryptHash(hash)).toBe(true);
    expect(hash).not.toBe(plain);
  });

  it('verifies correct password against bcrypt hash', async () => {
    const plain = 'McuSecure@2026';
    const hash = await hashPassword(plain);

    const valid = await verifyPassword(plain, hash);
    const invalid = await verifyPassword('WrongPassword', hash);

    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });

  it('seamlessly verifies legacy plaintext passwords for backward compatibility', async () => {
    const legacyPlain = 'mcu123456';

    const valid = await verifyPassword(legacyPlain, legacyPlain);
    const invalid = await verifyPassword('different', legacyPlain);

    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });

  it('enforces rate limiting on repeated failed attempts', () => {
    const ip = '192.168.1.100';
    resetRateLimit(ip);

    // Make 10 attempts
    for (let i = 0; i < 10; i++) {
      const res = checkRateLimit(ip, 10, 60000);
      expect(res.allowed).toBe(true);
    }

    // 11th attempt should be blocked
    const blocked = checkRateLimit(ip, 10, 60000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);

    // Resetting unblocks
    resetRateLimit(ip);
    const afterReset = checkRateLimit(ip, 10, 60000);
    expect(afterReset.allowed).toBe(true);
  });

  describe('fail-closed session token security', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('rejects malformed signature lengths cleanly without throwing', () => {
      const token = createSignedSessionToken({
        id: 'admin-1',
        email: 'admin@mcu.ac.th',
        role: 'ADMIN',
      });
      const [payload] = token.split('.');

      expect(verifySessionToken(`${payload}.short`)).toBeNull();
      expect(verifySessionToken(`${payload}.`)).toBeNull();
      expect(verifySessionToken('invalid-format')).toBeNull();
    });

    it('fails closed in production when AUTH_SECRET is missing or too short', () => {
      const devToken = createSignedSessionToken({
        id: 'admin-1',
        email: 'admin@mcu.ac.th',
        role: 'SUPER_ADMIN',
      });

      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('AUTH_SECRET', '');
      vi.stubEnv('NEXTAUTH_SECRET', '');

      expect(() =>
        createSignedSessionToken({
          id: 'admin-1',
          email: 'admin@mcu.ac.th',
          role: 'SUPER_ADMIN',
        })
      ).toThrow(/AUTH_SECRET/);

      // Must reject tokens signed with non-prod fallback once in production
      expect(verifySessionToken(devToken)).toBeNull();
    });

    it('signs and verifies tokens in production when strong AUTH_SECRET is configured', () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('AUTH_SECRET', '0123456789abcdef0123456789abcdef0123456789abcdef');

      const prodToken = createSignedSessionToken({
        id: 'admin-1',
        email: 'admin@mcu.ac.th',
        role: 'ADMIN',
      });

      const verified = verifySessionToken(prodToken);
      expect(verified).not.toBeNull();
      expect(verified?.id).toBe('admin-1');
      expect(verified?.role).toBe('ADMIN');
    });
  });
});
