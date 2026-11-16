/**
 * Theme Mode Manager (Day Mode / Night Mode - โหมดกลางวัน / โหมดกลางคืน)
 * Supports user preference storage in localStorage and cross-component syncing.
 */

export type ThemeMode = 'light' | 'dark';

export const THEME_MODE_KEY = 'mcu_theme_mode';
export const THEME_MODE_EVENT = 'mcu_theme_mode_changed';

/**
 * Returns current active theme mode ('light' | 'dark')
 */
export function getThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_MODE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    // Default to system preference if present, otherwise default to light
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {}
  return 'light';
}

/**
 * Applies theme mode to document element and saves preference to localStorage
 */
export function setThemeMode(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (mode === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme-mode', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme-mode', 'light');
    root.style.colorScheme = 'light';
  }

  try {
    localStorage.setItem(THEME_MODE_KEY, mode);
  } catch {}

  // Broadcast event across components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(THEME_MODE_EVENT, { detail: mode }));
  }
}

/**
 * Toggles theme mode between light and dark
 */
export function toggleThemeMode(): ThemeMode {
  const current = getThemeMode();
  const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
  setThemeMode(next);
  return next;
}
