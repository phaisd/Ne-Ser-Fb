'use client';

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: string;
  faculty?: string;
  major?: string;
  year?: number;
  phone?: string;
  [key: string]: any;
}

/**
 * Checks if the current client is authenticated.
 * Implements Option 2:
 * - If rememberMe is FALSE (Public machine / Session Cookie):
 *   When the browser is closed, the cookie 'mcu_auth_user' is deleted by the browser.
 *   On subsequent browser launch, this function detects the missing cookie and purges localStorage.
 * - If rememberMe is TRUE (Private machine):
 *   The cookie and localStorage persist for 7 days.
 */
export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const isRemembered = localStorage.getItem('mcu_remember_me') === 'true';
    const hasCookie = document.cookie
      .split(';')
      .some((c) => c.trim().startsWith('mcu_auth_user='));

    // If on a public PC (not remembered) and browser closed -> cookie is gone!
    if (!isRemembered && !hasCookie) {
      if (localStorage.getItem('mcu_current_user')) {
        localStorage.removeItem('mcu_current_user');
        window.dispatchEvent(new Event('mcu_user_logged_out'));
      }
      return null;
    }

    const stored = localStorage.getItem('mcu_current_user');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {}

  return null;
}

/**
 * Persists auth state based on rememberMe option
 */
export function saveAuthSession(user: AuthUser, rememberMe: boolean) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('mcu_current_user', JSON.stringify(user));

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
    window.dispatchEvent(new Event('mcu_user_logged_out'));
  } catch (e) {}
}
