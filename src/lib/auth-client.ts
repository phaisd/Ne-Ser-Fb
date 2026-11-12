'use client';

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  gmail?: string;
  role: string;
  faculty?: string;
  major?: string;
  year?: number;
  phone?: string;
  isSuperAdmin?: boolean;
  isActingOfficer?: boolean;
  [key: string]: any;
}

export interface SavedBrowserAccount {
  email: string;
  gmail?: string;
  name: string;
  role: string;
  lastLoginAt: string;
}

const SAVED_ACCOUNTS_KEY = 'mcu_saved_google_accounts';

/**
 * Checks whether a user object has Admin / Super Admin / Officer privileges
 */
export function isAdminOrOfficer(user?: AuthUser | null): boolean {
  if (!user) return false;
  const role = String(user.role || '').toUpperCase();
  return (
    role === 'SUPER_ADMIN' ||
    role === 'ADMIN' ||
    role === 'OFFICER' ||
    role === 'STAFF' ||
    user.isSuperAdmin === true ||
    user.isActingOfficer === true ||
    user.email?.toLowerCase() === 'phaisal.dis@mcu.ac.th'
  );
}

/**
 * Returns the list of Google / MCU accounts previously used on this browser
 * so the user can sign back in with 1 click without re-typing their email.
 */
export function getSavedBrowserAccounts(): SavedBrowserAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves an account to the browser's quick-picker list
 */
export function rememberBrowserAccount(user: AuthUser) {
  if (typeof window === 'undefined' || !user) return;
  const primaryEmail = (user.gmail || user.email || '').trim().toLowerCase();
  if (!primaryEmail) return;

  try {
    const existing = getSavedBrowserAccounts().filter(
      (a) =>
        a.email.toLowerCase() !== primaryEmail &&
        a.email.toLowerCase() !== (user.email || '').toLowerCase()
    );
    const updated: SavedBrowserAccount[] = [
      {
        email: user.email || primaryEmail,
        gmail: user.gmail || (primaryEmail.endsWith('@gmail.com') ? primaryEmail : undefined),
        name: user.name || primaryEmail,
        role: user.role || 'INSTRUCTOR',
        lastLoginAt: new Date().toISOString(),
      },
      ...existing,
    ].slice(0, 6);

    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Removes a saved account from the browser's quick-picker list
 */
export function removeSavedBrowserAccount(email: string) {
  if (typeof window === 'undefined') return;
  try {
    const clean = email.trim().toLowerCase();
    const filtered = getSavedBrowserAccounts().filter(
      (a) => a.email.toLowerCase() !== clean && (a.gmail || '').toLowerCase() !== clean
    );
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(filtered));
  } catch {}
}

/**
 * Checks if the current client is authenticated.
 * Reads from both `mcu_auth_user` cookie and `localStorage` so sessions stay synchronized
 * across `/admin`, `/students`, `/courses`, and `/attendance`.
 */
export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const isRemembered = localStorage.getItem('mcu_remember_me') === 'true';
    const cookieMatch = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('mcu_auth_user='));

    if (cookieMatch) {
      try {
        const rawVal = cookieMatch.slice('mcu_auth_user='.length);
        const parsedCookieUser = JSON.parse(decodeURIComponent(rawVal));
        if (parsedCookieUser && (parsedCookieUser.email || parsedCookieUser.role)) {
          localStorage.setItem('mcu_current_user', JSON.stringify(parsedCookieUser));
          rememberBrowserAccount(parsedCookieUser);
          return parsedCookieUser;
        }
      } catch {
        // Ignore malformed cookie and fall through to localStorage
      }
    }

    // If on a public PC (not remembered) and browser closed -> cookie is gone!
    if (!isRemembered && !cookieMatch) {
      const storedRaw = localStorage.getItem('mcu_current_user');
      if (storedRaw) {
        try {
          const parsed = JSON.parse(storedRaw);
          // Preserve session if active in current tab for Super Admin / Admin from Admin Console
          if (isAdminOrOfficer(parsed)) {
            document.cookie = `mcu_auth_user=${encodeURIComponent(JSON.stringify(parsed))}; path=/; SameSite=Lax`;
            return parsed;
          }
        } catch {}
        localStorage.removeItem('mcu_current_user');
        window.dispatchEvent(new Event('mcu_user_logged_out'));
      }
      return null;
    }

    const stored = localStorage.getItem('mcu_current_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (!cookieMatch && parsed) {
        document.cookie = `mcu_auth_user=${encodeURIComponent(JSON.stringify(parsed))}; path=/; SameSite=Lax`;
      }
      rememberBrowserAccount(parsed);
      return parsed;
    }
  } catch (e) {}

  return null;
}

/**
 * Persists auth state based on rememberMe option (both localStorage and cookie)
 */
export function saveAuthSession(user: AuthUser, rememberMe: boolean) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('mcu_current_user', JSON.stringify(user));
    rememberBrowserAccount(user);
    const maxAgePart = rememberMe ? `; max-age=${60 * 60 * 24 * 7}` : '';
    document.cookie = `mcu_auth_user=${encodeURIComponent(JSON.stringify(user))}; path=/; SameSite=Lax${maxAgePart}`;

    if (rememberMe) {
      localStorage.setItem('mcu_remember_me', 'true');
      localStorage.setItem('mcu_auto_logout_minutes', '0');
      window.dispatchEvent(new CustomEvent('mcu_auto_logout_changed', { detail: 0 }));
    } else {
      localStorage.removeItem('mcu_remember_me');
      localStorage.setItem('mcu_auto_logout_minutes', '15');
      window.dispatchEvent(new CustomEvent('mcu_auto_logout_changed', { detail: 15 }));
    }

    window.dispatchEvent(new Event('mcu_user_logged_in'));
  } catch (e) {}
}

/**
 * Clears auth state and notifies listeners
 */
export function clearAuthSession() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('mcu_current_user');
    localStorage.removeItem('mcu_remember_me');
    localStorage.removeItem(SAVED_ACCOUNTS_KEY);
    document.cookie = 'mcu_auth_user=; path=/; max-age=0';
    window.dispatchEvent(new Event('mcu_user_logged_out'));
  } catch (e) {}
}
