import { describe, it, expect } from 'vitest';
import { requestPasswordReset, verifyResetTokenOrOtp, completePasswordReset } from './password-reset';
import { maskEmail } from './mailer';

describe('Password Reset & Email Verification System', () => {
  it('should mask email addresses properly for privacy', () => {
    expect(maskEmail('teacher94@mcu.ac.th')).toBe('te***4@mcu.ac.th');
    expect(maskEmail('duangdee@gmail.com')).toBe('du***e@gmail.com');
    expect(maskEmail('ab@gmail.com')).toBe('a***@gmail.com');
  });

  it('should return error when requesting reset for non-existent user', async () => {
    const res = await requestPasswordReset('unknown-non-existent-user-xyz@mcu.ac.th');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('should generate secure reset token and OTP for registered instructor', async () => {
    const res = await requestPasswordReset('teacher94@mcu.ac.th');
    expect(res.success).toBe(true);
    expect(res.userType).toBe('INSTRUCTOR');
    expect(res.name).toBeDefined();
    expect(res.maskedPrimaryEmail).toContain('te***');
    expect(res.expiresMinutes).toBe(15);
  });

  it('should reject invalid or expired reset token', async () => {
    const res = await verifyResetTokenOrOtp('invalid-token-123456');
    expect(res.valid).toBe(false);
    expect(res.error).toBeDefined();
  });
});
