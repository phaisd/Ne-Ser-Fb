import crypto from 'crypto';
import { readLocalJson, writeLocalJson } from '@/services/storageHelper';
import { LoginAuditRecord } from '@/types/instructor';

export interface UserSessionState {
  userId: string;
  email: string;
  name: string;
  activeSessionId: string;
  activeSessionDevice: string;
  lastLoginAt: string;
  history: LoginAuditRecord[];
}

const SESSIONS_FILE = 'sessions.json';

// In-memory cache for high-performance lookups
const sessionMemoryStore = new Map<string, UserSessionState>();
let memoryLoaded = false;

function ensureMemoryLoaded() {
  if (!memoryLoaded) {
    try {
      const records = readLocalJson<Record<string, UserSessionState>>(SESSIONS_FILE, {});
      Object.entries(records).forEach(([key, val]) => {
        sessionMemoryStore.set(key.toLowerCase(), val);
      });
    } catch {}
    memoryLoaded = true;
  }
}

function persistStore() {
  try {
    const obj: Record<string, UserSessionState> = {};
    sessionMemoryStore.forEach((val, key) => {
      obj[key] = val;
    });
    writeLocalJson(SESSIONS_FILE, obj);
  } catch (err) {
    console.error('Failed to persist sessions.json:', err);
  }
}

/**
 * Parses user agent string to identify OS and Browser
 */
export function parseDeviceFromUserAgent(userAgent?: string): string {
  if (!userAgent) return 'อุปกรณ์ไม่ระบุ (Unknown Device)';
  const ua = userAgent.toLowerCase();

  let os = 'อุปกรณ์ทั่วไป';
  if (ua.includes('iphone')) os = 'iPhone';
  else if (ua.includes('ipad')) os = 'iPad';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('windows')) os = 'Windows PC';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'Mac';
  else if (ua.includes('linux')) os = 'Linux';

  let browser = '';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
  else if (ua.includes('firefox/')) browser = 'Firefox';

  return browser ? `${os} (${browser})` : os;
}

/**
 * Registers a new login session for a user.
 * Automatically invalidates (SUPERSEDED) any prior active session on other devices.
 */
export function recordUserLogin(
  userId: string,
  email: string,
  name: string,
  ip: string,
  userAgent: string,
  method: 'PASSWORD' | 'GOOGLE' | 'SESSION_RESET' = 'PASSWORD'
): { sessionId: string; record: LoginAuditRecord } {
  ensureMemoryLoaded();

  const primaryKey = (userId || email || '').trim().toLowerCase();
  const secondaryKey = (email || '').trim().toLowerCase();
  const newSessionId = 'sess_' + Date.now() + '_' + crypto.randomBytes(8).toString('hex');
  const nowIso = new Date().toISOString();
  const device = parseDeviceFromUserAgent(userAgent);

  const newAuditRecord: LoginAuditRecord = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: nowIso,
    ip: ip || '127.0.0.1',
    userAgent: userAgent ? userAgent.substring(0, 150) : '',
    device,
    sessionId: newSessionId,
    status: 'ACTIVE',
    method,
  };

  // Find existing state by primaryKey or secondaryKey
  let state = sessionMemoryStore.get(primaryKey) || sessionMemoryStore.get(secondaryKey);

  if (!state) {
    state = {
      userId: primaryKey,
      email: email || '',
      name: name || '',
      activeSessionId: newSessionId,
      activeSessionDevice: device,
      lastLoginAt: nowIso,
      history: [newAuditRecord],
    };
  } else {
    // Mark prior active sessions as SUPERSEDED (kicked out by new device login)
    state.history = (state.history || []).map((h) => {
      if (h.status === 'ACTIVE' && h.sessionId !== newSessionId) {
        return { ...h, status: 'SUPERSEDED' as const };
      }
      return h;
    });

    state.activeSessionId = newSessionId;
    state.activeSessionDevice = device;
    state.lastLoginAt = nowIso;
    state.name = name || state.name;
    state.email = email || state.email;

    // Prepend new record and cap to latest 25 items
    state.history = [newAuditRecord, ...state.history].slice(0, 25);
  }

  sessionMemoryStore.set(primaryKey, state);
  if (secondaryKey && secondaryKey !== primaryKey) {
    sessionMemoryStore.set(secondaryKey, state);
  }

  persistStore();

  return { sessionId: newSessionId, record: newAuditRecord };
}

/**
 * Records a failed login attempt (e.g. wrong password) so the account owner
 * can detect unauthorized access attempts without kicking out their active session.
 */
export function recordFailedLoginAttempt(
  userId: string,
  email: string,
  name: string,
  ip: string,
  userAgent: string,
  note = 'รหัสผ่านไม่ถูกต้อง'
): LoginAuditRecord {
  ensureMemoryLoaded();

  const primaryKey = (userId || email || '').trim().toLowerCase();
  const secondaryKey = (email || '').trim().toLowerCase();
  const nowIso = new Date().toISOString();
  const device = parseDeviceFromUserAgent(userAgent);

  const failedRecord: LoginAuditRecord = {
    id: 'fail-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: nowIso,
    ip: ip || '127.0.0.1',
    userAgent: userAgent ? userAgent.substring(0, 150) : '',
    device,
    sessionId: '',
    status: 'FAILED_ATTEMPT',
    method: 'PASSWORD',
    note,
  };

  let state = sessionMemoryStore.get(primaryKey) || sessionMemoryStore.get(secondaryKey);
  if (!state) {
    state = {
      userId: primaryKey,
      email: email || '',
      name: name || '',
      activeSessionId: '',
      activeSessionDevice: '',
      lastLoginAt: '',
      history: [failedRecord],
    };
  } else {
    state.history = [failedRecord, ...(state.history || [])].slice(0, 25);
  }

  sessionMemoryStore.set(primaryKey, state);
  if (secondaryKey && secondaryKey !== primaryKey) {
    sessionMemoryStore.set(secondaryKey, state);
  }

  persistStore();
  return failedRecord;
}

/**
 * Validates whether the incoming sessionId matches the user's latest active session.
 * If another device has logged in since, this will return conflict: true.
 */
export function validateUserSession(
  userIdOrEmail?: string,
  clientSessionId?: string
): { isValid: boolean; conflict: boolean; message?: string; activeDevice?: string; lastLoginAt?: string } {
  if (!userIdOrEmail) {
    return { isValid: false, conflict: false };
  }

  // On Vercel serverless, local disk sessions.json is not shared across stateless lambda instances
  if (process.env.VERCEL) {
    return { isValid: true, conflict: false };
  }

  ensureMemoryLoaded();

  const key = userIdOrEmail.trim().toLowerCase();
  const state = sessionMemoryStore.get(key);

  // If no record exists yet (e.g. legacy session), permit it gracefully
  if (!state || !state.activeSessionId) {
    return { isValid: true, conflict: false };
  }

  // If client did not supply sessionId (old token format), allow once or prompt
  if (!clientSessionId) {
    return { isValid: true, conflict: false };
  }

  // Exact match: Valid session
  if (state.activeSessionId === clientSessionId) {
    return { isValid: true, conflict: false };
  }

  // Mismatch: Someone logged in from another device!
  return {
    isValid: false,
    conflict: true,
    activeDevice: state.activeSessionDevice,
    lastLoginAt: state.lastLoginAt,
    message: `บัญชีนี้ถูกเข้าสู่ระบบจากอุปกรณ์อื่นแล้ว (${state.activeSessionDevice || 'อุปกรณ์ใหม่'}) ระบบได้ออกจากระบบเครื่องนี้โดยอัตโนมัติเพื่อความปลอดภัย`,
  };
}

/**
 * Revokes active session on explicit user logout
 */
export function revokeUserSession(userIdOrEmail?: string, sessionId?: string): void {
  if (!userIdOrEmail) return;
  ensureMemoryLoaded();

  const key = userIdOrEmail.trim().toLowerCase();
  const state = sessionMemoryStore.get(key);
  if (!state) return;

  state.history = (state.history || []).map((h) => {
    if ((!sessionId && h.status === 'ACTIVE') || (sessionId && h.sessionId === sessionId)) {
      return { ...h, status: 'LOGGED_OUT' as const };
    }
    return h;
  });

  if (!sessionId || state.activeSessionId === sessionId) {
    state.activeSessionId = '';
  }

  persistStore();
}

export interface LoginSecurityAnalysis {
  hasSuspiciousActivity: boolean;
  failedAttemptsCount: number;
  supersededCount: number;
  unfamiliarIpCount: number;
  uniqueDevicesCount: number;
  uniqueIpsCount: number;
  currentDevice: string | null;
  currentIp: string | null;
  latestSuccessRecord: LoginAuditRecord | null;
  suspiciousRecordIds: string[];
}

/**
 * Retrieves login audit history for a user across primary and alternate keys.
 */
export function getUserLoginHistory(
  userIdOrEmail?: string,
  ...alternateKeys: (string | undefined)[]
): LoginAuditRecord[] {
  const keys = [userIdOrEmail, ...alternateKeys]
    .map((k) => (k || '').trim().toLowerCase())
    .filter(Boolean);
  if (keys.length === 0) return [];

  ensureMemoryLoaded();

  const merged = new Map<string, LoginAuditRecord>();
  for (const key of keys) {
    const state = sessionMemoryStore.get(key);
    if (state && Array.isArray(state.history)) {
      for (const rec of state.history) {
        if (rec?.id && !merged.has(rec.id)) {
          merged.set(rec.id, rec);
        }
      }
    }
  }

  return Array.from(merged.values()).sort((a, b) =>
    (b.timestamp || '').localeCompare(a.timestamp || ''),
  );
}

/**
 * Evaluates login audit history to flag failed password attempts,
 * concurrent session takeovers (SUPERSEDED), or unfamiliar IPs/devices.
 */
export function analyzeLoginSecurity(
  history: LoginAuditRecord[],
  currentSessionId?: string | null,
): LoginSecurityAnalysis {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      hasSuspiciousActivity: false,
      failedAttemptsCount: 0,
      supersededCount: 0,
      unfamiliarIpCount: 0,
      uniqueDevicesCount: 0,
      uniqueIpsCount: 0,
      currentDevice: null,
      currentIp: null,
      latestSuccessRecord: null,
      suspiciousRecordIds: [],
    };
  }

  const activeRecord =
    (currentSessionId ? history.find((h) => h.sessionId === currentSessionId) : null) ||
    history.find((h) => h.status === 'ACTIVE') ||
    history.find((h) => h.status !== 'FAILED_ATTEMPT') ||
    null;

  const currentIp = activeRecord?.ip && activeRecord.ip !== 'unknown-client' ? activeRecord.ip : null;
  const currentDevice = activeRecord?.device || null;

  let failedAttemptsCount = 0;
  let supersededCount = 0;
  let unfamiliarIpCount = 0;
  const devices = new Set<string>();
  const ips = new Set<string>();
  const suspiciousIds: string[] = [];

  for (const item of history) {
    if (item.device) devices.add(item.device);
    if (item.ip && item.ip !== 'unknown-client') ips.add(item.ip);

    let isSuspicious = false;
    if (item.status === 'FAILED_ATTEMPT') {
      failedAttemptsCount += 1;
      isSuspicious = true;
    } else if (item.status === 'SUPERSEDED') {
      supersededCount += 1;
      isSuspicious = true;
    }

    const ipDiffers =
      Boolean(currentIp) &&
      Boolean(item.ip) &&
      item.ip !== 'unknown-client' &&
      item.ip !== currentIp;
    const deviceDiffers =
      Boolean(currentDevice) &&
      Boolean(item.device) &&
      item.device !== currentDevice;

    if ((ipDiffers || deviceDiffers) && item.sessionId !== activeRecord?.sessionId) {
      unfamiliarIpCount += 1;
      isSuspicious = true;
    }

    if (isSuspicious && item.id) {
      suspiciousIds.push(item.id);
    }
  }

  const latestSuccessRecord =
    history.find((h) => h.status !== 'FAILED_ATTEMPT') || null;

  return {
    hasSuspiciousActivity: failedAttemptsCount > 0 || supersededCount > 0 || unfamiliarIpCount > 0,
    failedAttemptsCount,
    supersededCount,
    unfamiliarIpCount,
    uniqueDevicesCount: devices.size,
    uniqueIpsCount: ips.size,
    currentDevice,
    currentIp,
    latestSuccessRecord,
    suspiciousRecordIds: suspiciousIds,
  };
}
