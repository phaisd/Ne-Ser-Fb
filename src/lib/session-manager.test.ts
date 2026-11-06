import { describe, it, expect } from 'vitest';
import {
  parseDeviceFromUserAgent,
  recordUserLogin,
  validateUserSession,
  revokeUserSession,
  getUserLoginHistory,
} from './session-manager';

describe('session-manager module (Single Concurrent Session & Login History)', () => {
  it('correctly parses user agents into readable device and browser names', () => {
    const winChrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    expect(parseDeviceFromUserAgent(winChrome)).toBe('Windows PC (Chrome)');

    const macSafari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    expect(parseDeviceFromUserAgent(macSafari)).toBe('Mac (Safari)');

    const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
    expect(parseDeviceFromUserAgent(iphone)).toBe('iPhone (Safari)');
  });

  it('enforces single active session per user: kicking out Device 1 when Device 2 logs in', () => {
    const testEmail = 'test.teacher@mcu.ac.th';
    const testName = 'อาจารย์ทดสอบ';

    // 1. Device 1 logs in from classroom PC
    const dev1Login = recordUserLogin(
      'inst-001',
      testEmail,
      testName,
      '10.0.0.5',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0'
    );
    expect(dev1Login.sessionId).toBeTruthy();

    // Check Device 1 session: valid
    const dev1CheckInitial = validateUserSession(testEmail, dev1Login.sessionId);
    expect(dev1CheckInitial.isValid).toBe(true);
    expect(dev1CheckInitial.conflict).toBe(false);

    // 2. Teacher forgets to log out, goes home and logs in from Device 2 (Notebook)
    const dev2Login = recordUserLogin(
      'inst-001',
      testEmail,
      testName,
      '192.168.1.50',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15'
    );
    expect(dev2Login.sessionId).not.toBe(dev1Login.sessionId);

    // Device 2 is now the active session
    const dev2Check = validateUserSession(testEmail, dev2Login.sessionId);
    expect(dev2Check.isValid).toBe(true);
    expect(dev2Check.conflict).toBe(false);

    // 3. When Device 1 attempts any request or check: CONFLICT DETECTED!
    const dev1CheckAfter = validateUserSession(testEmail, dev1Login.sessionId);
    expect(dev1CheckAfter.isValid).toBe(false);
    expect(dev1CheckAfter.conflict).toBe(true);
    expect(dev1CheckAfter.activeDevice).toContain('Mac');
  });

  it('tracks login history with status: ACTIVE, SUPERSEDED, and LOGGED_OUT', () => {
    const userKey = 'history.user@mcu.ac.th';

    const login1 = recordUserLogin(userKey, userKey, 'ครูทดสอบ', '1.1.1.1', 'Windows PC');
    const login2 = recordUserLogin(userKey, userKey, 'ครูทดสอบ', '2.2.2.2', 'iPhone Safari');

    const history = getUserLoginHistory(userKey);
    expect(history.length).toBeGreaterThanOrEqual(2);

    const latest = history.find((h) => h.sessionId === login2.sessionId);
    const previous = history.find((h) => h.sessionId === login1.sessionId);

    expect(latest?.status).toBe('ACTIVE');
    expect(previous?.status).toBe('SUPERSEDED');

    // Revoke logout
    revokeUserSession(userKey, login2.sessionId);
    const historyAfterLogout = getUserLoginHistory(userKey);
    const loggedOutItem = historyAfterLogout.find((h) => h.sessionId === login2.sessionId);
    expect(loggedOutItem?.status).toBe('LOGGED_OUT');
  });
});
