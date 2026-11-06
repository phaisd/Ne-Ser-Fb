import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  isBcryptHash,
  checkRateLimit,
  resetRateLimit,
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
});
