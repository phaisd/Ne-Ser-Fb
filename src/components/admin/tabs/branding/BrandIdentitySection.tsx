'use client';

import React from 'react';
import {
  Globe,
  UploadCloud,
  Camera,
  Trash2,
  Building2,
  Palette,
  Check,
  RefreshCw,
  Mail,
  Clock,
  Phone,
  Eye,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { SystemSettings } from '@/types';
import { THEME_PRESETS, DEFAULT_THEME_PRESET } from '@/lib/theme-presets';
import { applyTypographySettings } from '@/components/ThemeProvider';

interface BrandIdentitySectionProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  savingSettings: boolean;
  setSavingSettings: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogoFileUpload: (file: File) => void;
  uploadingLogo: boolean;
  logoFileInputRef: React.RefObject<HTMLInputElement | null>;
  setActionSuccess: (msg: string | null) => void;
}

export function BrandIdentitySection({
  settings,
  setSettings,
  savingSettings,
  setSavingSettings,
  handleLogoFileUpload,
  uploadingLogo,
  logoFileInputRef,
  setActionSuccess,
}: BrandIdentitySectionProps) {
  return (
    <div className="space-y-5">
      {/* 1. Logo Settings */}
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
            {/* Upload Box (Drag & Drop or Click) */}
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

      {/* 2. University & Faculty Names */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
          <Building2 className="w-4 h-4 text-pink-600" />
          2. ชื่อมหาวิทยาลัยและคณะ (Institution & Faculty Names)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อมหาวิทยาลัย (ภาษาไทย):
            </label>
            <input
              type="text"
              value={settings.universityNameTh || ''}
              onChange={(e) =>
                setSettings({ ...settings, universityNameTh: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อมหาวิทยาลัย (ภาษาอังกฤษ):
            </label>
            <input
              type="text"
              value={settings.universityNameEn || ''}
              onChange={(e) =>
                setSettings({ ...settings, universityNameEn: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อคณะ/หน่วยงาน (ภาษาไทย):
            </label>
            <input
              type="text"
              value={settings.facultyNameTh || ''}
              onChange={(e) =>
                setSettings({ ...settings, facultyNameTh: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อคณะ/หน่วยงาน (ภาษาอังกฤษ):
            </label>
            <input
              type="text"
              value={settings.facultyNameEn || ''}
              onChange={(e) =>
                setSettings({ ...settings, facultyNameEn: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อสำนักงานผู้ประสานงานท้ายหนังสือรับรอง (เช่น สำนักงานคณบดีคณะพุทธศาสตร์):
            </label>
            <input
              type="text"
              value={settings.officeNameTh ?? 'สำนักงานคณบดีคณะพุทธศาสตร์'}
              onChange={(e) =>
                setSettings({ ...settings, officeNameTh: e.target.value })
              }
              placeholder="สำนักงานคณบดีคณะพุทธศาสตร์"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 font-medium"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              * แสดงในส่วนท้ายกระดาษของหนังสือรับรอง (ใต้หัวข้อ &quot;ติดต่อผู้ประสานงาน:&quot;)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Theme Colors & Visual Contrast Presets */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Palette className="w-4 h-4 text-pink-600" />
              <span>3. โทนสีธีมระบบและอัตลักษณ์การอ่าน (System Theme Colors & Visual Contrast)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              เลือกเปลี่ยนโทนสีหลักของระบบ พร้อมระบบคำนวณและปรับสีตัวอักษรให้อัตโนมัติ เพื่อให้อ่านง่าย ชัดเจน ถูกต้องตามหลักสรีรศาสตร์และมาตรฐานสากล
            </p>
          </div>
          <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>WCAG AAA คมชัด อ่านง่าย 100%</span>
          </span>
        </div>

        {/* Theme Presets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Object.values(THEME_PRESETS).map((preset) => {
            const isSelected = (settings.themePreset || DEFAULT_THEME_PRESET) === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => setSettings({ ...settings, themePreset: preset.id })}
                className={`relative p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 text-left ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <span className="text-base">{preset.emoji}</span>
                      <span>{preset.nameTh.split('(')[0].trim()}</span>
                    </div>
                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-slate-300 bg-slate-50 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                    {preset.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-4 flex-1 rounded-md shadow-2xs border border-black/10"
                      style={{ backgroundColor: preset.colors.primary }}
                      title={`สีหลัก: ${preset.colors.primary}`}
                    />
                    <div
                      className="h-4 flex-1 rounded-md shadow-2xs border border-black/10"
                      style={{ backgroundColor: preset.colors.accent }}
                      title={`สีเน้น: ${preset.colors.accent}`}
                    />
                    <div
                      className="h-4 flex-1 rounded-md shadow-2xs border border-black/10"
                      style={{ backgroundColor: preset.colors.bg }}
                      title={`สีพื้นหลัง: ${preset.colors.bg}`}
                    />
                    <div
                      className="h-4 flex-1 rounded-md shadow-2xs border border-black/10"
                      style={{ backgroundColor: preset.colors.textHeading }}
                      title={`สีตัวอักษร: ${preset.colors.textHeading}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-600">{preset.badgeTh}</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                      {preset.contrastRatio.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mourning Special Toggle */}
        {settings.themePreset === 'mourning' && (
          <div className="p-4 bg-zinc-900 text-white rounded-xl flex items-center justify-between gap-4 border border-zinc-800 shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🖤</span>
              <div>
                <div className="font-bold text-xs text-white">
                  แถบสัญลักษณ์โบว์สีดำไว้อาลัย (Respectful Mourning Ribbon)
                </div>
                <div className="text-[11px] text-zinc-400">
                  แสดงแถบโบว์สีดำที่มุมบนซ้ายของหน้าเว็บทุกหน้าตามแบบแผนการไว้ทุกข์
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={Boolean(settings.themeMourningRibbon)}
                onChange={(e) =>
                  setSettings({ ...settings, themeMourningRibbon: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-zinc-950"></div>
            </label>
          </div>
        )}

        {/* Live Visual Inspector Box */}
        {(() => {
          const currentPresetConfig = THEME_PRESETS[settings.themePreset || DEFAULT_THEME_PRESET] || THEME_PRESETS.pink;
          return (
            <div
              className="p-5 rounded-xl border transition-all space-y-4"
              style={{
                backgroundColor: currentPresetConfig.colors.bg,
                borderColor: currentPresetConfig.colors.border,
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5" style={{ borderColor: currentPresetConfig.colors.border }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentPresetConfig.emoji}</span>
                  <span className="font-bold text-xs" style={{ color: currentPresetConfig.colors.textHeading }}>
                    ตัวอย่างการแสดงผลจริง (Live Readability & Contrast Preview): {currentPresetConfig.nameTh}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: currentPresetConfig.colors.textHeading }}>
                  <span>อัตราส่วนความคมชัด:</span>
                  <span className="px-2 py-0.5 rounded-md font-mono bg-white shadow-2xs border" style={{ borderColor: currentPresetConfig.colors.border }}>
                    {currentPresetConfig.contrastRatio}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div
                  className="p-4 rounded-xl border shadow-sm md:col-span-2 space-y-2"
                  style={{
                    backgroundColor: currentPresetConfig.colors.cardBg,
                    borderColor: currentPresetConfig.colors.border,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: currentPresetConfig.colors.textHeading }}>
                      คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: currentPresetConfig.colors.badgeBg,
                        color: currentPresetConfig.colors.badgeText,
                        borderColor: currentPresetConfig.colors.badgeBorder,
                      }}
                    >
                      {currentPresetConfig.badgeTh}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed" style={{ color: currentPresetConfig.colors.textBody }}>
                    ระบบบริการการศึกษาและวิชาการออนไลน์ คณะพุทธศาสตร์ ตัวหนังสือและสีพื้นหลังผ่านการปรับแต่งความคมชัดอย่างแม่นยำ ทำให้อ่านง่าย สบายตา ไม่ทำให้สายตาล้าแม้ใช้งานเป็นเวลานาน
                  </p>

                  <div className="text-[11px] flex items-center gap-1" style={{ color: currentPresetConfig.colors.textMuted }}>
                    <span>✓ {currentPresetConfig.readabilityNote}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{
                      backgroundColor: currentPresetConfig.colors.primary,
                      color: currentPresetConfig.colors.btnText,
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>ปุ่มกดหลัก (Primary Button)</span>
                  </button>

                  <button
                    type="button"
                    className="w-full px-4 py-2 rounded-xl font-semibold text-xs border transition flex items-center justify-center gap-1.5 cursor-pointer bg-white"
                    style={{
                      borderColor: currentPresetConfig.colors.border,
                      color: currentPresetConfig.colors.textBody,
                    }}
                  >
                    <span>ปุ่มกดรอง (Secondary)</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 4. Font Size & Typography Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                กA
              </span>
              <span>4. ขนาดตัวอักษรและรูปแบบฟอนต์ของระบบ (Font Size & Typography Settings)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ปรับขยายขนาดตัวอักษรและเลือกรูปแบบฟอนต์ให้มีผลทั้งหน้าเว็บไซต์หลัก (<span className="font-mono">localhost:3020</span>) และหน้าผู้ดูแลระบบ (<span className="font-mono">/admin</span>) เพื่อให้อ่านง่าย สบายตา ไม่ต้องเพ่ง
            </p>
          </div>
          <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 font-bold px-2.5 py-1 rounded-full shrink-0">
            มีผลทั้งหน้าเว็บหลัก & หน้า Admin
          </span>
        </div>

        {/* Font Size Preset Cards */}
        <div>
          <label className="font-bold text-slate-700 text-xs block mb-2">
            เลือกระดับขนาดตัวอักษร (Font Size Scale Presets):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'normal' as const,
                percent: 100,
                label: 'ขนาดมาตรฐาน (100%)',
                desc: 'ขนาดปกติของระบบ (16px) แสดงข้อมูลได้มากในหน้าเดียว',
                sampleClass: 'text-sm',
              },
              {
                id: 'medium' as const,
                percent: 108,
                label: 'ขนาดกลาง (108%)',
                desc: 'ขยายตัวอักษรขึ้นเล็กน้อย อ่านสบายตา สมดุลกับตาราง',
                sampleClass: 'text-base',
              },
              {
                id: 'large' as const,
                percent: 116,
                label: 'ขนาดใหญ่ - แนะนำ (116%)',
                desc: 'ตัวอักษรใหญ่ชัดเจน อ่านง่ายทั้งตารางรายชื่อและเมนูแอดมิน',
                sampleClass: 'text-lg',
              },
              {
                id: 'xlarge' as const,
                percent: 125,
                label: 'ขนาดใหญ่พิเศษ (125%)',
                desc: 'ขยายใหญ่พิเศษ เหมาะสำหรับหน้าจอความละเอียดสูงหรือผู้บริหาร',
                sampleClass: 'text-xl',
              },
            ].map((item) => {
              const currentScale = settings.fontSizeScale || 'large';
              const isSelected = currentScale === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    const next = {
                      ...settings,
                      fontSizeScale: item.id,
                      fontCustomPercent: item.percent,
                    };
                    setSettings(next);
                    applyTypographySettings(next);
                  }}
                  className={`p-3.5 rounded-xl border-2 text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-500/15'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-indigo-700 ${item.sampleClass}`}>
                      กขค Aa
                    </span>
                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400">{item.percent}%</span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{item.label}</div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fine-tune Slider & Font Family Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-800">
                🔍 ปรับขนาดตัวอักษรละเอียด (95% – 135%):
              </label>
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-bold text-xs">
                {settings.fontCustomPercent || (settings.fontSizeScale === 'normal' ? 100 : settings.fontSizeScale === 'medium' ? 108 : settings.fontSizeScale === 'xlarge' ? 125 : 116)}%
              </span>
            </div>
            <input
              type="range"
              min={95}
              max={135}
              step={2}
              value={
                settings.fontCustomPercent ||
                (settings.fontSizeScale === 'normal'
                  ? 100
                  : settings.fontSizeScale === 'medium'
                  ? 108
                  : settings.fontSizeScale === 'xlarge'
                  ? 125
                  : 116)
              }
              onChange={(e) => {
                const val = Number(e.target.value);
                const next: SystemSettings = {
                  ...settings,
                  fontSizeScale: 'custom',
                  fontCustomPercent: val,
                };
                setSettings(next);
                applyTypographySettings(next);
              }}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
              <span>95% (กะทัดรัด)</span>
              <span>100% (ปกติ)</span>
              <span>116% (แนะนำ)</span>
              <span>135% (ใหญ่พิเศษ)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div>
              <label className="font-bold text-xs text-slate-800 block mb-1.5">
                ✒️ รูปแบบฟอนต์หลักของระบบ (System Font Family):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sarabun' as const, name: 'Sarabun (สารบัญ)', sub: 'ทางการ อ่านคุ้นตา' },
                  { id: 'krub' as const, name: 'Krub (ครับ)', sub: 'หัวกลม สบายตา' },
                  { id: 'baijamjuree' as const, name: 'Bai Jamjuree', sub: 'โปร่ง คมชัด' },
                ].map((f) => {
                  const active = (settings.fontFamilyPreset || 'sarabun') === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        const next = { ...settings, fontFamilyPreset: f.id };
                        setSettings(next);
                        applyTypographySettings(next);
                      }}
                      className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                        active
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold text-xs truncate">{f.name}</div>
                      <div className={`text-[10px] truncate ${active ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {f.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-center justify-between gap-2 pt-1 cursor-pointer select-none">
              <span className="text-xs font-bold text-slate-700">
                ปรับสีตัวอักษรขนาดเล็กให้เข้มและคมชัดขึ้นอัตโนมัติ
              </span>
              <input
                type="checkbox"
                checked={settings.fontWeightBoost !== false}
                onChange={(e) => {
                  const next = { ...settings, fontWeightBoost: e.target.checked };
                  setSettings(next);
                  applyTypographySettings(next);
                }}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Quick Save for Typography */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            💡 <strong>หมายเหตุ:</strong> การขยายขนาดตัวอักษรจะมีผลเฉพาะบนหน้าจอ (ไม่กระทบสัดส่วนกระดาษ A4 ตอนสั่งพิมพ์ใบกรอกคะแนนหรือใบรับรอง)
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
                  applyTypographySettings(settings);
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('mcu_settings_updated'));
                  }
                  setActionSuccess('✅ บันทึกขนาดตัวอักษรและฟอนต์ของระบบเรียบร้อยแล้ว!');
                } else {
                  alert(data.error);
                }
              } catch (e: unknown) {
                alert((e instanceof Error ? e.message : String(e)));
              } finally {
                setSavingSettings(false);
              }
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{savingSettings ? 'กำลังบันทึก...' : '💾 บันทึกขนาดตัวอักษรทันที'}</span>
          </button>
        </div>
      </div>

      {/* 5. Contact & Announcements & Portal Footer */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-4 h-4 text-pink-600" />
            <span>5. ข้อมูลติดต่อสำนักงานและส่วนท้ายหน้าแรก (Office Contact & Portal Footer)</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            ข้อความในส่วนนี้จะปรากฏที่กล่องข้อมูลท้ายหน้าแรกของระบบ (http://localhost:3020)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อสำนักงาน / หัวข้อส่วนท้ายหน้าแรก (Office Name / Footer Title):
            </label>
            <input
              type="text"
              value={settings.footerTitleTh ?? ''}
              onChange={(e) =>
                setSettings({ ...settings, footerTitleTh: e.target.value })
              }
              placeholder="เช่น สำนักงานคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (เว้นว่าง = ใช้ชื่อตามคณะ)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">ที่ตั้งสำนักงาน / ที่อยู่ / อาคาร (Address):</label>
            <input
              type="text"
              value={settings.addressTh ?? ''}
              onChange={(e) =>
                setSettings({ ...settings, addressTh: e.target.value })
              }
              placeholder="อาคารสมเด็จพระพุฒาจารย์ (เกี่ยว อุปเสณมหาเถร) อาคารเรียนรวม ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา 13170"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">เบอร์โทรศัพท์ติดต่อ:</label>
            <input
              type="text"
              value={settings.contactPhone ?? ''}
              onChange={(e) =>
                setSettings({ ...settings, contactPhone: e.target.value })
              }
              placeholder="เช่น 035-247-8000 ต่อ 8323"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">เว็บไซต์ทางการคณะ (Website URL):</label>
            <input
              type="text"
              value={settings.websiteUrl ?? ''}
              onChange={(e) =>
                setSettings({ ...settings, websiteUrl: e.target.value })
              }
              placeholder="https://fb.mcu.ac.th/"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">อีเมลติดต่อสำนักงาน:</label>
            <input
              type="text"
              value={settings.contactEmail ?? ''}
              onChange={(e) =>
                setSettings({ ...settings, contactEmail: e.target.value })
              }
              placeholder="buddhism@mcu.ac.th"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">วัน-เวลาทำการ (Office Hours):</label>
            <input
              type="text"
              value={settings.officeHours ?? ''}
              onChange={(e) =>
                setSettings({ ...settings, officeHours: e.target.value })
              }
              placeholder="เช่น จันทร์ - ศุกร์ 08.30 - 16.30 น. (เว้นวันหยุดราชการ)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">
              ข้อความหมายเหตุเพิ่มเติมท้ายกล่อง (Optional Note / Extra Text):
            </label>
            <input
              type="text"
              value={settings.footerCustomNote ?? ''}
              onChange={(e) =>
                setSettings({ ...settings, footerCustomNote: e.target.value })
              }
              placeholder="เช่น งานบริการการศึกษาและทะเบียน ยินดีให้บริการคำร้องออนไลน์ 24 ชั่วโมง (เว้นว่างได้)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">
              ข้อความประกาศต้อนรับหน้าแรก (Announcement Text):
            </label>
            <textarea
              rows={2}
              value={settings.announcementText || ''}
              onChange={(e) =>
                setSettings({ ...settings, announcementText: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Developer Credit Setting */}
          <div className="md:col-span-2 p-3.5 bg-purple-50/70 rounded-xl border border-purple-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-purple-950 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.devCreditEnabled !== false}
                  onChange={(e) =>
                    setSettings({ ...settings, devCreditEnabled: e.target.checked })
                  }
                  className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <span>เปิดใช้งานข้อความแสดงผู้พัฒนาระบบ (Developer Credit ที่แถบล่างสุด)</span>
              </label>
              <span className="text-[11px] font-bold text-purple-800">
                {settings.devCreditEnabled !== false ? '🟢 กำลังแสดง' : '⚪ ปิดการแสดงผล'}
              </span>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1 text-[11px]">
                ข้อความผู้พัฒนาระบบ (แก้ไขได้อิสระ):
              </label>
              <input
                type="text"
                value={settings.devCreditText ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, devCreditText: e.target.value })
                }
                placeholder="Dev. by สำนักงานคณบดีคณะพุทธศาสตร์"
                disabled={settings.devCreditEnabled === false}
                className="w-full px-3.5 py-2 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Live Preview of the Portal Footer */}
          <div className="md:col-span-2 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span className="flex items-center gap-1.5 text-purple-900">
                <Eye className="w-4 h-4 text-purple-600" />
                <span>ตัวอย่างการแสดงผลแถบล่างสุด (Live Preview at http://localhost:3020):</span>
              </span>
              <span className="text-slate-400 font-normal">
                * จะอัปเดตทันทีเมื่อกดปุ่มบันทึกด้านล่าง
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500 shadow-xs">
              <div className="space-y-1">
                <p>© 2026 {settings.facultyNameTh || 'คณะพุทธศาสตร์'} {settings.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}. สงวนลิขสิทธิ์ทั้งหมด.</p>
                <div className="text-slate-400 flex flex-wrap items-center gap-1.5">
                  <span>ระบบบริการการศึกษาและวิชาการ</span>
                  {settings.devCreditEnabled !== false && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-[10.5px]">
                        {settings.devCreditText || 'Dev. by สำนักงานคณบดีคณะพุทธศาสตร์'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 font-medium text-slate-600">
                <span>มาตรการคุ้มครองข้อมูล (PDPA)</span>
                <span className="text-slate-300">•</span>
                <span>ตรวจสอบเอกสาร (/verify)</span>
                <span className="text-slate-300">•</span>
                <span>เงื่อนไขการให้บริการ</span>
                <span className="text-slate-300">•</span>
                <span>🔒 สำหรับเจ้าหน้าที่</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Social Media & Facebook Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded-lg bg-blue-100 text-blue-700">
                <Share2 className="w-4 h-4" />
              </span>
              <span>5. ช่องทางโซเชียลมีเดีย & Facebook ของคณะ (Social Media & Facebook Page)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              กำหนดลิงก์ Facebook, LINE OA, YouTube, TikTok และเปิด-ปิดการแสดงผลบนหน้าแรกและแถบล่างสุด (Footer)
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-bold text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={settings.showSocialLinks !== false}
              onChange={(e) =>
                setSettings({ ...settings, showSocialLinks: e.target.checked })
              }
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <span className={settings.showSocialLinks !== false ? 'text-blue-800' : 'text-slate-500'}>
              {settings.showSocialLinks !== false ? '🟢 เปิดแสดงโซเชียลทั้งระบบ' : '⚪ ปิดแสดงโซเชียลทั้งหมด'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* 1. Facebook */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                  f
                </div>
                <span className="font-bold text-blue-950 text-sm">Facebook ของคณะ (แนะนำ)</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[11px] text-blue-900">
                <input
                  type="checkbox"
                  checked={settings.showFacebook !== false}
                  onChange={(e) =>
                    setSettings({ ...settings, showFacebook: e.target.checked })
                  }
                  className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>{settings.showFacebook !== false ? 'เปิดแสดง' : 'ปิด'}</span>
              </label>
            </div>

            <div className="space-y-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  ชื่อหรือคำบรรยายเพจ Facebook:
                </label>
                <input
                  type="text"
                  value={settings.facebookTitle ?? ''}
                  onChange={(e) =>
                    setSettings({ ...settings, facebookTitle: e.target.value })
                  }
                  placeholder="เช่น คณะพุทธศาสตร์ มจร - Faculty of Buddhism"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  ลิงก์เพจ Facebook (Facebook URL):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.facebookUrl ?? ''}
                    onChange={(e) =>
                      setSettings({ ...settings, facebookUrl: e.target.value })
                    }
                    placeholder="https://www.facebook.com/buddhism.mcu"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 pr-8"
                  />
                  {settings.facebookUrl && (
                    <a
                      href={settings.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2.5 top-2.5 text-blue-600 hover:text-blue-800"
                      title="เปิดทดสอบลิงก์ Facebook"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. LINE Official Account */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                  LINE
                </div>
                <span className="font-bold text-emerald-950 text-sm">LINE Official Account</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[11px] text-emerald-900">
                <input
                  type="checkbox"
                  checked={settings.showLineOa === true}
                  onChange={(e) =>
                    setSettings({ ...settings, showLineOa: e.target.checked })
                  }
                  className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>{settings.showLineOa ? 'เปิดแสดง' : 'ปิด'}</span>
              </label>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                ลิงก์เพิ่มเพื่อน LINE OA หรือ LINE ID:
              </label>
              <input
                type="text"
                value={settings.lineOaUrl ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, lineOaUrl: e.target.value })
                }
                placeholder="เช่น https://line.me/ti/p/... หรือ @buddhism.mcu"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* 3. YouTube */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[10px]">
                  ▶
                </div>
                <span className="font-bold text-rose-950 text-sm">YouTube Channel</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[11px] text-rose-900">
                <input
                  type="checkbox"
                  checked={settings.showYoutube === true}
                  onChange={(e) =>
                    setSettings({ ...settings, showYoutube: e.target.checked })
                  }
                  className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                />
                <span>{settings.showYoutube ? 'เปิดแสดง' : 'ปิด'}</span>
              </label>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                ลิงก์ YouTube Channel:
              </label>
              <input
                type="text"
                value={settings.youtubeUrl ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, youtubeUrl: e.target.value })
                }
                placeholder="https://www.youtube.com/@buddhism_mcu"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>

          {/* 4. TikTok */}
          <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                  ♪
                </div>
                <span className="font-bold text-slate-900 text-sm">TikTok</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[11px] text-slate-900">
                <input
                  type="checkbox"
                  checked={settings.showTiktok === true}
                  onChange={(e) =>
                    setSettings({ ...settings, showTiktok: e.target.checked })
                  }
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 w-3.5 h-3.5"
                />
                <span>{settings.showTiktok ? 'เปิดแสดง' : 'ปิด'}</span>
              </label>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                ลิงก์ TikTok ของคณะ:
              </label>
              <input
                type="text"
                value={settings.tiktokUrl ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, tiktokUrl: e.target.value })
                }
                placeholder="https://www.tiktok.com/@buddhism_mcu"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
