import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getThemeMode, setThemeMode, toggleThemeMode, THEME_MODE_KEY, THEME_MODE_EVENT } from './theme-mode';

describe('theme-mode utility (โหมดกลางวัน / โหมดกลางคืน)', () => {
  let mockStorage: Record<string, string> = {};
  const mockClassList = new Set<string>();
  const mockAttributes: Record<string, string> = {};
  let dispatchEventMock = vi.fn();

  beforeEach(() => {
    mockStorage = {};
    mockClassList.clear();
    dispatchEventMock = vi.fn();

    const mockLocalStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        mockStorage[key] = String(val);
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };

    const mockRoot = {
      classList: {
        add: vi.fn((cls: string) => mockClassList.add(cls)),
        remove: vi.fn((cls: string) => mockClassList.delete(cls)),
        contains: vi.fn((cls: string) => mockClassList.has(cls)),
      },
      setAttribute: vi.fn((attr: string, val: string) => {
        mockAttributes[attr] = val;
      }),
      removeAttribute: vi.fn((attr: string) => {
        delete mockAttributes[attr];
      }),
      getAttribute: vi.fn((attr: string) => mockAttributes[attr] ?? null),
      style: {
        colorScheme: 'light',
      },
    };

    vi.stubGlobal('localStorage', mockLocalStorage);
    vi.stubGlobal('document', { documentElement: mockRoot });
    vi.stubGlobal('window', {
      dispatchEvent: dispatchEventMock,
      matchMedia: vi.fn(() => ({ matches: false })),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to light mode when no preference stored', () => {
    const mode = getThemeMode();
    expect(mode).toBe('light');
  });

  it('sets dark mode correctly on DOM and localStorage', () => {
    setThemeMode('dark');

    expect(mockClassList.has('dark')).toBe(true);
    expect(mockAttributes['data-theme-mode']).toBe('dark');
    expect(mockStorage[THEME_MODE_KEY]).toBe('dark');
    expect(dispatchEventMock).toHaveBeenCalled();
  });

  it('sets light mode correctly on DOM and localStorage', () => {
    setThemeMode('dark');
    setThemeMode('light');

    expect(mockClassList.has('dark')).toBe(false);
    expect(mockAttributes['data-theme-mode']).toBe('light');
    expect(mockStorage[THEME_MODE_KEY]).toBe('light');
  });

  it('toggles mode between light and dark smoothly', () => {
    expect(getThemeMode()).toBe('light');
    const firstToggle = toggleThemeMode();
    expect(firstToggle).toBe('dark');
    expect(mockClassList.has('dark')).toBe(true);

    const secondToggle = toggleThemeMode();
    expect(secondToggle).toBe('light');
    expect(mockClassList.has('dark')).toBe(false);
  });
});
