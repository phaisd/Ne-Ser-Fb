'use client';

import React from 'react';
import {
  Globe,
  UploadCloud,
  Camera,
  Trash2,
  Check,
  RefreshCw,
} from 'lucide-react';
import { SystemSettings } from '@/types';

interface LogoSettingsCardProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  savingSettings: boolean;
  setSavingSettings: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogoFileUpload: (file: File) => void;
  uploadingLogo: boolean;
  logoFileInputRef: React.RefObject<HTMLInputElement | null>;
  setActionSuccess: (msg: string | null) => void;
}

export function LogoSettingsCard({
  settings,
  setSettings,
  savingSettings,
  setSavingSettings,
  handleLogoFileUpload,
  uploadingLogo,
  logoFileInputRef,
  setActionSuccess,
}: LogoSettingsCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Globe className="w-4 h-4 text-pink-600" />
          <span>1. โลโก้และตราสัญลักษณ์สถาบัน (University Logo & Crest)</span>
        </h3>
        <span className="text-[11px] text-pink-600 bg-pink-50 border border-pink-200 font-semibold px-2 py-0.5 rounded-full">
          รองรับทั้งอัปโหลดไฟล์ และระบุ URL
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Live Preview */}
        <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-3">
          <div className="relative group">
            <div className="w-28 h-28 rounded-2xl bg-white border-2 border-dashed border-slate-300 shadow-sm flex items-center justify-center p-2 overflow-hidden">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Logo Preview"
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as any).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-5xl">{settings.logoEmoji || '☸️'}</span>
              )}
            </div>
            {settings.logoUrl && (
              <button
                type="button"
                onClick={() => setSettings({ ...settings, logoUrl: '' })}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 cursor-pointer"
                title="ลบรูปภาพโลโก้"
              >
                ✕
              </button>
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">ตัวอย่างโลโก้จริง</div>
            <div className="text-[10px] text-slate-400">จะแสดงบนหัวกระดาษพิมพ์และ Navbar</div>
          </div>
          {settings.logoUrl && (
            <button
              type="button"
              onClick={() => setSettings({ ...settings, logoUrl: '' })}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>ล้างรูปภาพ (ใช้ Emoji)</span>
            </button>
          )}
        </div>

        {/* Inputs & Upload Box */}
        <div className="md:col-span-2 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-pink-600" />
              <span>อัปโหลดรูปภาพโลโก้จากเครื่องคอมพิวเตอร์ (Upload Image File):</span>
            </label>

            <input
              type="file"
              ref={logoFileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleLogoFileUpload(e.target.files[0]);
                }
              }}
              accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => logoFileInputRef.current?.click()}
              className="border-2 border-dashed border-pink-300 hover:border-pink-500 bg-pink-50/30 hover:bg-pink-50/60 rounded-2xl p-5 text-center cursor-pointer transition space-y-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
                {uploadingLogo ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="font-bold text-slate-800 text-xs">
                  {uploadingLogo ? 'กำลังอัปโหลดรูปภาพ...' : 'คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากไฟล์มาวางที่นี่'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  รองรับไฟล์ PNG, JPG, JPEG, SVG, WebP (แนะนำไฟล์พื้นหลังโปร่งใส PNG หรือ SVG)
                </div>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-sm">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>เลือกรูปภาพจากเครื่อง</span>
                </span>
              </div>
            </div>
          </div>

          {/* Direct URL Input */}
          <div className="pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-700 block mb-1">
              หรือ ระบุเป็น URL รูปภาพโดยตรง (Logo Image URL):
            </label>
            <input
              type="text"
              value={settings.logoUrl || ''}
              onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
              placeholder="https://www.mcu.ac.th/images/logo-mcu.png หรือ /uploads/logo-...png"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <label className="font-bold text-slate-700 block mb-1">
                Emoji ตัวแทน (สำรอง):
              </label>
              <input
                type="text"
                value={settings.logoEmoji || '☸️'}
                onChange={(e) => setSettings({ ...settings, logoEmoji: e.target.value })}
                className="w-20 px-3.5 py-2 rounded-xl border border-slate-200 text-center text-lg"
              />
            </div>

            <div className="flex-1">
              <span className="text-[11px] text-slate-500 block mb-1 font-semibold">
                ตราสัญลักษณ์มาตรฐานสำเร็จรูป:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      logoUrl: 'https://www.mcu.ac.th/images/logo-mcu.png',
                      logoEmoji: '☸️',
                    })
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer transition flex items-center gap-1"
                >
                  <span>☸️ ตราธรรมจักร มจร.</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      logoUrl: '',
                      logoEmoji: '🏛️',
                    })
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer transition flex items-center gap-1"
                >
                  <span>🏛️ สัญลักษณ์คณะ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Save for Logo */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              {settings.logoUrl ? (
                <span className="text-emerald-700 font-medium">
                  ✓ โลโก้ปัจจุบัน: <span className="font-mono text-[10px]">{settings.logoUrl.length > 40 ? `${settings.logoUrl.slice(0, 40)}...` : settings.logoUrl}</span>
                </span>
              ) : (
                <span className="text-slate-400">ยังไม่ได้ระบุรูปภาพโลโก้ (ใช้ Emoji สำรอง {settings.logoEmoji || '☸️'})</span>
              )}
            </div>
            <button
              type="button"
              disabled={savingSettings}
              onClick={async () => {
                setSavingSettings(true);
                try {
                  const res = await fetch('/api/system-settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settings),
                  });
                  const data = await res.json();
                  if (data.success) {
                    if (data.data?.logoUrl) {
                      setSettings((prev) => ({ ...prev, logoUrl: data.data.logoUrl }));
                    }
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new Event('mcu_settings_updated'));
                    }
                    setActionSuccess('✅ บันทึกรูปภาพโลโก้และตราสัญลักษณ์เรียบร้อยแล้ว!');
                  } else {
                    alert(data.error);
                  }
                } catch (e: unknown) {
                  alert((e instanceof Error ? e.message : String(e)));
                } finally {
                  setSavingSettings(false);
                }
              }}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{savingSettings ? 'กำลังบันทึก...' : '💾 บันทึกโลโก้นี้ทันที'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
