'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getThemeMode, toggleThemeMode, THEME_MODE_EVENT, ThemeMode } from '@/lib/theme-mode';

interface ThemeModeToggleProps {
  variant?: 'pill' | 'icon' | 'full';
  className?: string;
}

export default function ThemeModeToggle({
  variant = 'pill',
  className = '',
}: ThemeModeToggleProps) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMode(getThemeMode());

    const handleThemeChange = (e: Event) => {
      const newMode = ((e as CustomEvent<ThemeMode>)?.detail || getThemeMode()) as ThemeMode;
      setMode(newMode);
    };

    window.addEventListener(THEME_MODE_EVENT, handleThemeChange);
    window.addEventListener('storage', handleThemeChange);
    return () => {
      window.removeEventListener(THEME_MODE_EVENT, handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  const handleToggle = () => {
    const next = toggleThemeMode();
    setMode(next);
  };

  const isDark = mode === 'dark';

  if (!mounted) {
    // Render placeholder matching shape before mount to avoid layout shift
    if (variant === 'icon') {
      return (
        <button
          type="button"
          className={`w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 ${className}`}
          aria-label="เปลี่ยนโหมดกลางวัน/กลางคืน"
        >
          <span className="w-4 h-4" />
        </button>
      );
    }
    return (
      <div
        className={`h-8 w-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 ${className}`}
      />
    );
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`p-1.5 sm:p-2 rounded-xl border transition shadow-xs cursor-pointer flex items-center justify-center ${
          isDark
            ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400 hover:text-amber-300'
            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
        } ${className}`}
        title={isDark ? 'สลับเป็นโหมดกลางวัน (Day Mode)' : 'สลับเป็นโหมดกลางคืน (Night Mode)'}
        aria-label={isDark ? 'สลับเป็นโหมดกลางวัน' : 'สลับเป็นโหมดกลางคืน'}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-indigo-400 shrink-0 transition-transform hover:scale-110" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 shrink-0 transition-transform hover:scale-110" />
        )}
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
          isDark
            ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100'
            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
        } ${className}`}
        title={isDark ? 'สลับเป็นโหมดกลางวัน (Day Mode)' : 'สลับเป็นโหมดกลางคืน (Night Mode)'}
      >
        <span className="flex items-center gap-2">
          {isDark ? (
            <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 shrink-0" />
          )}
          <span>{isDark ? 'โหมดกลางคืน (Night Mode)' : 'โหมดกลางวัน (Day Mode)'}</span>
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isDark
              ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/60'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}
        >
          {isDark ? '🌙 กลางคืน' : '☀️ กลางวัน'}
        </span>
      </button>
    );
  }

  // Default 'pill' variant for Main Navigation Bar
  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shadow-2xs ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-indigo-300 hover:text-white'
          : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700 hover:text-slate-900'
      } ${className}`}
      title={isDark ? 'คลิกเพื่อสลับเป็นโหมดกลางวัน (Day Mode)' : 'คลิกเพื่อสลับเป็นโหมดกลางคืน (Night Mode)'}
      aria-label={isDark ? 'สลับเป็นโหมดกลางวัน' : 'สลับเป็นโหมดกลางคืน'}
    >
      {isDark ? (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>กลางคืน</span>
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>กลางวัน</span>
        </>
      )}
    </button>
  );
}
