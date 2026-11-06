'use client';

import React, { useEffect, useState } from 'react';
import { THEME_PRESETS, DEFAULT_THEME_PRESET, ThemeColorPreset } from '@/lib/theme-presets';

export function applyTypographySettings(data?: {
  fontSizeScale?: string;
  fontCustomPercent?: number;
  fontFamilyPreset?: string;
  fontWeightBoost?: boolean;
}) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  let scale = 1.15; // Default comfortable reading size (115%)
  const preset = data?.fontSizeScale || 'large';
  if (preset === 'normal') scale = 1.0;
  else if (preset === 'medium') scale = 1.08;
  else if (preset === 'large') scale = 1.16;
  else if (preset === 'xlarge') scale = 1.25;
  else if (preset === 'custom' && data?.fontCustomPercent) {
    scale = Math.min(1.4, Math.max(0.9, Number(data.fontCustomPercent) / 100));
  } else if (data?.fontCustomPercent) {
    scale = Math.min(1.4, Math.max(0.9, Number(data.fontCustomPercent) / 100));
  }

  root.style.setProperty('--font-scale', String(scale));
  root.style.fontSize = `${(16 * scale).toFixed(2)}px`;

  const familyPreset = data?.fontFamilyPreset || 'sarabun';
  let fontStack = '"Sarabun", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  if (familyPreset === 'krub') {
    fontStack = '"Krub", "Sarabun", -apple-system, BlinkMacSystemFont, sans-serif';
  } else if (familyPreset === 'baijamjuree') {
    fontStack = '"Bai Jamjuree", "Sarabun", -apple-system, BlinkMacSystemFont, sans-serif';
  }
  root.style.setProperty('--font-family-main', fontStack);

  if (data?.fontWeightBoost !== false) {
    root.setAttribute('data-font-boost', 'true');
  } else {
    root.removeAttribute('data-font-boost');
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentPreset, setCurrentPreset] = useState<ThemeColorPreset>(DEFAULT_THEME_PRESET);
  const [showRibbon, setShowRibbon] = useState(false);

  const applyTheme = (presetKey?: string, ribbon?: boolean, rawSettings?: any) => {
    const key = (presetKey && THEME_PRESETS[presetKey as ThemeColorPreset]) ? (presetKey as ThemeColorPreset) : DEFAULT_THEME_PRESET;
    setCurrentPreset(key);
    setShowRibbon(key === 'mourning' && Boolean(ribbon));

    const config = THEME_PRESETS[key];
    const root = document.documentElement;

    // Set data attribute for CSS targeting
    root.setAttribute('data-theme', key);
    if (key === 'mourning') {
      root.setAttribute('data-theme-mourning', 'true');
    } else {
      root.removeAttribute('data-theme-mourning');
    }

    // Apply CSS variables to root
    Object.entries(config.cssVariables).forEach(([prop, val]) => {
      root.style.setProperty(prop, val);
    });

    // Set page body background & text color
    document.body.style.backgroundColor = config.colors.bg;
    document.body.style.color = config.colors.textBody;

    // Apply font size & typography settings across both Public Portal & Admin Console
    applyTypographySettings(rawSettings);
  };

  const loadThemeSettings = () => {
    fetch('/api/system-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          applyTheme(data.data.themePreset, data.data.themeMourningRibbon, data.data);
        }
      })
      .catch(() => {
        applyTheme(DEFAULT_THEME_PRESET, false);
      });
  };

  useEffect(() => {
    loadThemeSettings();

    const handleUpdate = () => loadThemeSettings();
    window.addEventListener('mcu_settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('mcu_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <>
      {/* Respectful Mourning Ribbon (โบว์สีดำไว้อาลัย) เมื่อเลือกธีมไว้อาลัย */}
      {showRibbon && (
        <div
          className="fixed top-0 left-0 z-[9999] pointer-events-none select-none print:hidden drop-shadow-md"
          title="แถบไว้อาลัย (Mourning Ribbon)"
        >
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="0,0 64,0 0,64" fill="#18181b" />
            <line x1="0" y1="20" x2="20" y2="0" stroke="#71717a" strokeWidth="1.5" />
            <line x1="0" y1="44" x2="44" y2="0" stroke="#3f3f46" strokeWidth="1.5" />
          </svg>
        </div>
      )}
      {children}
    </>
  );
}
