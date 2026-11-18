'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SystemSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/constants/defaultSettings';
import { getErrorMessage } from '@/lib/utils/error';

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/system-settings');
      const data = await res.json();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();

    const handleSettingsUpdated = () => {
      loadSettings();
    };

    window.addEventListener('mcu_settings_updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('mcu_settings_updated', handleSettingsUpdated);
    };
  }, [loadSettings]);

  const updateSettings = async (updates: Partial<SystemSettings>): Promise<boolean> => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updatedPayload = { ...settings, ...updates };
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data || updatedPayload);
        setSuccessMsg('บันทึกการตั้งค่าเรียบร้อยแล้ว');
        window.dispatchEvent(new Event('mcu_settings_updated'));
        return true;
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการบันทึก');
        return false;
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    setUploadingLogo(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        await updateSettings({ logoUrl: data.url });
        return data.url;
      } else {
        setError(data.error || 'อัปโหลดรูปภาพไม่สำเร็จ');
        return null;
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  return {
    settings,
    setSettings,
    loading,
    saving,
    uploadingLogo,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    loadSettings,
    updateSettings,
    uploadLogo,
  };
}
