'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

export type WatermarkMode = 'MCU_LOGO' | 'CUSTOM' | 'NONE';

export interface UseWatermarkSettingsOptions {
  isOpen?: boolean;
  defaultMode?: WatermarkMode;
  initialMode?: WatermarkMode;
  defaultOpacity?: number;
  initialOpacity?: number;
  fallbackLogoUrl?: string;
}

export function useWatermarkSettings({
  isOpen = true,
  defaultMode,
  initialMode,
  defaultOpacity,
  initialOpacity,
  fallbackLogoUrl = '/uploads/logo-1793607763771.jpg',
}: UseWatermarkSettingsOptions = {}) {
  const resolvedMode = initialMode || defaultMode || 'MCU_LOGO';
  const resolvedOpacity = initialOpacity !== undefined ? initialOpacity : (defaultOpacity !== undefined ? defaultOpacity : 0.10);
  const [watermarkMode, setWatermarkMode] = useState<WatermarkMode>(resolvedMode);
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(resolvedOpacity);
  const [customWatermarkUrl, setCustomWatermarkUrl] = useState<string>('');
  const [systemLogoUrl, setSystemLogoUrl] = useState<string>(fallbackLogoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    async function loadLogo() {
      try {
        const res = await fetch('/api/system-settings');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.data?.logoUrl) {
            setSystemLogoUrl(data.data.logoUrl);
          }
        }
      } catch {
        // Fallback logo already set
      }
    }

    loadLogo();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const activeWatermark = useMemo(() => {
    if (watermarkMode === 'NONE') return '';
    if (watermarkMode === 'CUSTOM') return customWatermarkUrl;
    return systemLogoUrl || fallbackLogoUrl;
  }, [watermarkMode, customWatermarkUrl, systemLogoUrl, fallbackLogoUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ภาพต้องไม่เกิน 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomWatermarkUrl(reader.result);
        setWatermarkMode('CUSTOM');
      }
    };
    reader.readAsDataURL(file);
  };

  const clearCustomWatermark = () => {
    setCustomWatermarkUrl('');
    setWatermarkMode('MCU_LOGO');
  };

  return {
    watermarkMode,
    setWatermarkMode,
    watermarkOpacity,
    setWatermarkOpacity,
    customWatermarkUrl,
    setCustomWatermarkUrl,
    systemLogoUrl,
    activeWatermark,
    fileInputRef,
    watermarkInputRef: fileInputRef,
    handleFileUpload,
    handleWatermarkUpload: handleFileUpload,
    clearCustomWatermark,
  };
}
