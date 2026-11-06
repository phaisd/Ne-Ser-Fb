'use client';

import React, { useState } from 'react';
import {
  Palette,
  Globe,
  UploadCloud,
  Camera,
  Trash2,
  Building2,
  ShieldCheck,
  UserCog,
  Plus,
  RefreshCw,
  Edit,
  Mail,
  AlertTriangle,
  Check,
  Phone,
  Clock,
  Eye,
  Calendar,
  FileText,
  GraduationCap,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { SystemSettings, SignatoryItem } from '@/types';
import { THEME_PRESETS, DEFAULT_THEME_PRESET, ThemeColorPreset } from '@/lib/theme-presets';
import { applyTypographySettings } from '@/components/ThemeProvider';

interface AdminBrandingTabProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  savingSettings: boolean;
  setSavingSettings: React.Dispatch<React.SetStateAction<boolean>>;
  handleSaveSettings: (e: React.FormEvent) => void;
  handleLogoFileUpload: (file: File) => void;
  uploadingLogo: boolean;
  logoFileInputRef: React.RefObject<HTMLInputElement | null>;
  setActionSuccess: (msg: string | null) => void;
  activeSignatoriesList: SignatoryItem[];
  isAddingSignatory: boolean;
  setIsAddingSignatory: (open: boolean) => void;
  newSignatoryForm: SignatoryItem;
  setNewSignatoryForm: React.Dispatch<React.SetStateAction<SignatoryItem>>;
  handleAddSignatory: (e?: any) => void;
  handleResetSignatories: () => void;
  editingSignatoryId: string | null;
  setEditingSignatoryId: (id: string | null) => void;
  editSignatoryForm: SignatoryItem;
  setEditSignatoryForm: React.Dispatch<React.SetStateAction<SignatoryItem>>;
  handleSaveEditSignatory: () => void;
  handleDeleteSignatory: (id: string, label: string) => void;
}

export function AdminBrandingTab({
  settings,
  setSettings,
  savingSettings,
  setSavingSettings,
  handleSaveSettings,
  handleLogoFileUpload,
  uploadingLogo,
  logoFileInputRef,
  setActionSuccess,
  activeSignatoriesList,
  isAddingSignatory,
  setIsAddingSignatory,
  newSignatoryForm,
  setNewSignatoryForm,
  handleAddSignatory,
  handleResetSignatories,
  editingSignatoryId,
  setEditingSignatoryId,
  editSignatoryForm,
  setEditSignatoryForm,
  handleSaveEditSignatory,
  handleDeleteSignatory,
}: AdminBrandingTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    'identity' | 'hero' | 'signatories' | 'timetables' | 'security' | 'all'
  >('identity');

  // Hero Capsule Image Drag & Drop and Upload State
  const [uploadingCapsule, setUploadingCapsule] = useState(false);
  const [isCapsuleDragOver, setIsCapsuleDragOver] = useState(false);
  const capsuleFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleCapsuleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingCapsule(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setSettings((prev) => ({ ...prev, heroCapsuleImage: data.url }));
        return;
      }
    } catch (err) {
      console.warn('Direct upload failed, fallback to data URL', err);
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        if (url) {
          setSettings((prev) => ({ ...prev, heroCapsuleImage: url }));
        }
      };
      reader.readAsDataURL(file);
    } catch {
      // ignore
    } finally {
      setUploadingCapsule(false);
    }
  };

  const subTabs = [
    {
      id: 'identity' as const,
      label: '1. สถาบัน, โลโก้, สีธีม & ขนาดฟอนต์',
      shortLabel: 'โลโก้, สีธีม & ฟอนต์',
      icon: Palette,
      color: 'bg-pink-600',
      activeBorder: 'border-pink-600',
      badge: settings.themePreset ? (THEME_PRESETS[settings.themePreset]?.badgeTh || 'สีธีม/ฟอนต์') : 'โลโก้/ฟอนต์',
    },
    {
      id: 'hero' as const,
      label: '2. แบนเนอร์ & เมนูหน้าแรก',
      shortLabel: 'แบนเนอร์หน้าแรก',
      icon: Sparkles,
      color: 'bg-amber-600',
      activeBorder: 'border-amber-600',
      badge: settings.heroWildEnabled !== false ? 'Wild ON' : 'Classic',
    },
    {
      id: 'signatories' as const,
      label: '3. ผู้ลงนามหนังสือ',
      shortLabel: 'ผู้ลงนาม',
      icon: UserCog,
      color: 'bg-indigo-600',
      activeBorder: 'border-indigo-600',
      badge: `${activeSignatoriesList.length} ท่าน`,
    },
    {
      id: 'timetables' as const,
      label: '4. คาบเวลา & ตารางสอน',
      shortLabel: 'ตารางสอน',
      icon: Clock,
      color: 'bg-blue-600',
      activeBorder: 'border-blue-600',
      badge: 'คาบ/วัน/หมายเหตุ',
    },
    {
      id: 'security' as const,
      label: '5. แจ้งเตือน & ความปลอดภัย',
      shortLabel: 'แจ้งเตือน/รหัสผ่าน',
      icon: ShieldCheck,
      color: 'bg-emerald-600',
      activeBorder: 'border-emerald-600',
      badge: '3 กล่องเตือน',
    },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-pink-600" />
            การจัดการและตั้งค่าระบบ (Branding & System Configuration)
          </h2>
          <p className="text-xs text-slate-500">
            ปรับแต่งโลโก้, แบนเนอร์หน้าหลัก, คณบดีผู้ลงนาม, ตารางเรียน และนโยบายระบบแยกตามหมวดหมู่
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab(activeSubTab === 'all' ? 'identity' : 'all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'all'
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="สลับระหว่างมุมมองแยกตามแท็บ กับแสดงทุกหัวข้อในหน้าเดียว"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{activeSubTab === 'all' ? 'สลับเป็นมุมมองแท็บ' : 'แสดงทั้งหมดในหน้าเดียว'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-5">
        {/* Sub-Tabs Pill Navigation Bar */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-2 sticky top-2 z-30 backdrop-blur-md bg-white/95">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer text-xs ${
                    isActive
                      ? `${tab.color} text-white shadow-md font-bold`
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-semibold'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md shadow-pink-600/20 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0 ml-auto"
            title="บันทึกการเปลี่ยนแปลงทั้งหมด"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{savingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
          </button>
        </div>

        {/* ================= TAB 1: ข้อมูลสถาบันและโลโก้ ================= */}
        {(activeSubTab === 'identity' || activeSubTab === 'all') && (
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
                    } catch (e: any) {
                      alert(e.message);
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
          </div>
        </div>

        {/* 3. Theme Colors & Visual Contrast Presets (การตั้งค่าสีธีมระบบและการอ่านง่าย) */}
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
                  {/* Top Bar with Emoji, Title & Selected Checkmark */}
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

                  {/* Color Palette Swatches Preview */}
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

          {/* Mourning Special Toggle (ถ้าเลือกสีไว้อาลัย) */}
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

          {/* Live Visual Inspector Box (ตัวอย่างความคมชัดและการอ่านง่าย) */}
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

                {/* Simulated UI Components demonstrating perfect text contrast */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Card Simulation */}
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

                  {/* Buttons Simulation */}
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

        {/* 4. Font Size & Typography Accessibility (การปรับขนาดตัวอักษรและฟอนต์ทั้งหน้าหลักและหน้า Admin) */}
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
            {/* Custom Percentage Slider */}
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

            {/* Font Family & Contrast Boost */}
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

          {/* Quick Save Button for Font & Typography */}
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
                } catch (e: any) {
                  alert(e.message);
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
      </div>
    )}

    {/* ================= TAB 3: ข้อมูลผู้ลงนามหนังสือรับรอง ================= */}
    {(activeSubTab === 'signatories' || activeSubTab === 'all') && (
      <div className="space-y-5">
        {/* 3. Authorized Signatories & Dropdown Management */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-pink-600" />
              <span>3. ข้อมูลผู้ลงนามหนังสือรับรอง และจัดการตัวเลือกใน Dropdown</span>
            </h3>
            <span className="text-[11px] text-pink-700 bg-pink-50 border border-pink-200 font-semibold px-2.5 py-0.5 rounded-full">
              ระบบจัดการรายชื่อผ่านหน้าจอ
            </span>
          </div>

          {/* Primary Default Signer */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700">
              ผู้ลงนามหลักค่าเริ่มต้น (Default Primary Signatory - คณบดี):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">ชื่อผู้ลงนามหลัก (ภาษาไทย):</label>
                <input
                  type="text"
                  value={settings.signerNameTh || ''}
                  onChange={(e) => setSettings({ ...settings, signerNameTh: e.target.value })}
                  placeholder="พระครูสุธีกิตติบัณฑิต, รศ.ดร."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">ตำแหน่งผู้ลงนามหลัก (ภาษาไทย):</label>
                <input
                  type="text"
                  value={settings.signerTitleTh || ''}
                  onChange={(e) => setSettings({ ...settings, signerTitleTh: e.target.value })}
                  placeholder="คณบดีคณะพุทธศาสตร์"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">ชื่อผู้ลงนามหลัก (ภาษาอังกฤษ):</label>
                <input
                  type="text"
                  value={settings.signerNameEn || ''}
                  onChange={(e) => setSettings({ ...settings, signerNameEn: e.target.value })}
                  placeholder="Assoc. Prof. Dr. Phrakhrusutheekittibandhit"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">ตำแหน่งผู้ลงนามหลัก (ภาษาอังกฤษ):</label>
                <input
                  type="text"
                  value={settings.signerTitleEn || ''}
                  onChange={(e) => setSettings({ ...settings, signerTitleEn: e.target.value })}
                  placeholder="Dean of the Faculty of Buddhism"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dropdown Signatories List Management */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCog className="w-4 h-4 text-purple-600" />
                  <span>จัดการรายชื่อและตำแหน่งในเมนู Dropdown (Signatories in Dropdown Menu)</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  ท่านสามารถเพิ่ม แก้ไขชื่อ หรือลบตำแหน่งผู้ลงนาม เพื่อให้ปรากฏในเมนู Dropdown ในหน้าพรีวิวเอกสาร
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddingSignatory(!isAddingSignatory)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มผู้ลงนามใหม่</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetSignatories}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                  title="คืนค่าเป็นชุดมาตรฐาน 6 รูปแบบเริ่มต้น"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>รีเซ็ตค่าเริ่มต้น</span>
                </button>
              </div>
            </div>

            {/* Add Signatory Form Box (if open) */}
            {isAddingSignatory && (
              <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-3 animate-fade-in text-xs">
                <div className="font-bold text-purple-950 flex items-center justify-between">
                  <span>กรอกข้อมูลผู้ลงนามใหม่:</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingSignatory(false)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      1. ข้อความในเมนู Dropdown (Label):
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น 7. ผู้ช่วยคณบดีฝ่าย..."
                      value={newSignatoryForm.label}
                      onChange={(e) => setNewSignatoryForm({ ...newSignatoryForm, label: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      2. ชื่อและสมณศักดิ์ (Name):
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น พระมหา... หรือเว้นว่างสำหรับเซ็นสด"
                      value={newSignatoryForm.name}
                      onChange={(e) => setNewSignatoryForm({ ...newSignatoryForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      3. ตำแหน่งทางการ (Title):
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ผู้ช่วยคณบดีฝ่ายวิชาการ"
                      value={newSignatoryForm.title}
                      onChange={(e) => setNewSignatoryForm({ ...newSignatoryForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingSignatory(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSignatory}
                    className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm cursor-pointer"
                  >
                    บันทึกเพิ่มเข้ารายชื่อ
                  </button>
                </div>
              </div>
            )}

            {/* Table of Signatories */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                    <tr>
                      <th className="p-3 w-1/3">ข้อความในเมนู Dropdown (Label)</th>
                      <th className="p-3 w-1/4">ชื่อผู้ลงนาม (Name)</th>
                      <th className="p-3">ตำแหน่ง (Title)</th>
                      <th className="p-3 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeSignatoriesList.map((item) => {
                      const isEditing = editingSignatoryId === item.id;

                      if (isEditing) {
                        return (
                          <tr key={item.id} className="bg-purple-50/50">
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={editSignatoryForm.label}
                                onChange={(e) => setEditSignatoryForm({ ...editSignatoryForm, label: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 text-xs bg-white font-medium"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={editSignatoryForm.name}
                                placeholder="เว้นว่างสำหรับเซ็นสด"
                                onChange={(e) => setEditSignatoryForm({ ...editSignatoryForm, name: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 text-xs bg-white"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={editSignatoryForm.title}
                                onChange={(e) => setEditSignatoryForm({ ...editSignatoryForm, title: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 text-xs bg-white"
                              />
                            </td>
                            <td className="p-2.5 text-right whitespace-nowrap space-x-1">
                              <button
                                type="button"
                                onClick={handleSaveEditSignatory}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                              >
                                บันทึก
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSignatoryId(null)}
                                className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs cursor-pointer"
                              >
                                ยกเลิก
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{item.label}</span>
                              {(item as any).isDefault && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                  เริ่มต้น
                                </span>
                              )}
                              {!item.name && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                                  เซ็นสด
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-slate-700 font-medium">
                            {item.name ? item.name : <span className="text-slate-400 italic">เว้นว่าง (ลงนามสดด้วยปากกา)</span>}
                          </td>
                          <td className="p-3 text-slate-600">
                            {item.title}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSignatoryId(item.id);
                                setEditSignatoryForm(item);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                              title="แก้ไขชื่อหรือตำแหน่ง"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSignatory(item.id, item.label)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="ลบออกจากเมนู Dropdown"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ================= TAB 1 (ส่วนที่ 2): ข้อมูลติดต่อและส่วนท้าย ================= */}
    {(activeSubTab === 'identity' || activeSubTab === 'all') && (
      <div className="space-y-5">
        {/* 4. Contact & Announcements & Portal Footer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Mail className="w-4 h-4 text-pink-600" />
              <span>4. ข้อมูลติดต่อสำนักงานและส่วนท้ายหน้าแรก (Office Contact & Portal Footer)</span>
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
              <label className="font-bold text-slate-700 block mb-1">ข้อความหมายเหตุเพิ่มเติมท้ายกล่อง (Optional Note / Extra Text):</label>
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

            {/* Developer Credit Setting (เปิด/ปิด & แก้ไขข้อความผู้พัฒนาระบบ) */}
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

            {/* Live Preview of the Portal Footer (เหมือนภาพที่ 2 เป๊ะๆ) */}
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

              {/* Bottom Bar Preview (ตรงตามภาพที่ 2) */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500 shadow-xs">
                <div className="space-y-1">
                  <p>© 2026 {settings.facultyNameTh || 'คณะพุทธศาสตร์'} {settings.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}. สงวนลิขสิทธิ์ทั้งหมด.</p>
                  <div className="text-slate-400 flex flex-wrap items-center gap-1.5">
                    <span>Faculty of Buddhism Academic Services System — Powered by Google Sheets & Cloud Infrastructure</span>
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
      </div>
    )}

    {/* ================= TAB 2: แบนเนอร์และเมนูหน้าแรก ================= */}
    {(activeSubTab === 'hero' || activeSubTab === 'all') && (
      <div className="space-y-5">
        {/* 4.5. การเปิด/ปิด การแสดงผลระบบและเมนูหน้าเว็บหลัก (Portal Menu & Feature Visibility) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                การเปิด/ปิด การแสดงผลระบบและเมนูบนหน้าเว็บหลัก (Portal Menu & Feature Visibility)
              </h4>
              <p className="text-xs text-slate-500">
                ควบคุมการเปิดหรือซ่อนเมนูและระบบต่างๆ จากหน้าหลักและแถบเมนู (Navbar) สำหรับระบบที่ยังพัฒนาไม่เสร็จ หรือยังไม่พร้อมให้บริการ
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ควบคุมการแสดงผลสาธารณะ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* 1. ระบบกิจกรรมและโครงการนิสิต (/events) */}
            <div className={`p-4 rounded-2xl border transition ${
              settings.showEventsMenu
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>🏆 ระบบกิจกรรมและโครงการนิสิต (/events)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      settings.showEventsMenu
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {settings.showEventsMenu ? '🟢 เปิดแสดง' : '🔴 ปิดซ่อน (เตรียมระบบ)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    แสดงหรือซ่อนเมนู "กิจกรรมนิสิต" บนแถบเมนูหลัก และกล่องบริการที่หน้าแรก (แอดมินยังเข้าจัดการได้ใน /admin)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.showEventsMenu === true}
                    onChange={(e) => setSettings({ ...settings, showEventsMenu: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* 2. ระบบตารางเรียนและรายวิชา (/courses) */}
            <div className={`p-4 rounded-2xl border transition ${
              settings.showCoursesMenu !== false
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>📚 ตารางเรียนและรายวิชา (/courses)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      settings.showCoursesMenu !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {settings.showCoursesMenu !== false ? '🟢 เปิดแสดง' : '🔴 ปิดซ่อน'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    แสดงเมนูค้นหาตารางเรียน ตารางสอน และคลังรายวิชาสำหรับนิสิตและบุคคลภายนอก
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.showCoursesMenu !== false}
                    onChange={(e) => setSettings({ ...settings, showCoursesMenu: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* 3. ระบบค้นหาทะเบียนนิสิต (/students) */}
            <div className={`p-4 rounded-2xl border transition ${
              settings.showStudentsSearch !== false
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>👥 ค้นหาทะเบียนนิสิต (/students)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      settings.showStudentsSearch !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {settings.showStudentsSearch !== false ? '🟢 เปิดแสดง' : '🔴 ปิดซ่อน'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    ค้นหาข้อมูลทะเบียนนิสิต (ซ่อนข้อมูลละเอียด PDPA) บนแถบเมนูหลัก
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.showStudentsSearch !== false}
                    onChange={(e) => setSettings({ ...settings, showStudentsSearch: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* 4. ระบบยื่นคำร้องขอหนังสือรับรอง (/certificates) */}
            <div className={`p-4 rounded-2xl border transition ${
              settings.showCertificatesMenu !== false
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>📄 ยื่นคำร้องขอหนังสือรับรอง (/certificates)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      settings.showCertificatesMenu !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {settings.showCertificatesMenu !== false ? '🟢 เปิดแสดง' : '🔴 ปิดซ่อน'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    ระบบการ์ดยื่นคำร้องขอหนังสือรับรอง 16 ประเภท สำหรับนิสิตไทยและต่างประเทศ
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.showCertificatesMenu !== false}
                    onChange={(e) => setSettings({ ...settings, showCertificatesMenu: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 4.8. แบนเนอร์หน้าหลักสไตล์แอนิเมชัน MotionSites (Hero Wild Section Customization) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                แบนเนอร์หน้าหลักสไตล์ MotionSites AI (Hero Wild Creative Animation)
              </h4>
              <p className="text-xs text-slate-500">
                ปรับแต่งข้อความขนาดใหญ่, แคปซูลภาพเกาะลอยน้ำ, ป้ายกำกับ, คำอธิบายย่อย, และปุ่มลิงก์บนหน้าแรก (src/app/page.tsx)
              </p>
            </div>

            {/* Toggle Enable/Disable Switch */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                {settings.heroWildEnabled !== false ? 'เปิดใช้งาน (Wild Motion)' : 'ปิดใช้งาน (Classic)'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.heroWildEnabled !== false}
                  onChange={(e) =>
                    setSettings({ ...settings, heroWildEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>

          {settings.heroWildEnabled !== false && (
            <div className="space-y-4 pt-1 text-xs">
              {/* Words: Left & Right */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ข้อความฝั่งซ้าย (Left Word):
                  </label>
                  <input
                    type="text"
                    value={settings.heroLeftWord ?? 'WI'}
                    onChange={(e) => setSettings({ ...settings, heroLeftWord: e.target.value })}
                    placeholder="เช่น WI หรือ พุทธ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-black text-slate-900 tracking-wider text-base focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    ตัวอักษรขนาดใหญ่ฝั่งซ้ายของแคปซูล
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ข้อความฝั่งขวา (Right Word):
                  </label>
                  <input
                    type="text"
                    value={settings.heroRightWord ?? 'LD'}
                    onChange={(e) => setSettings({ ...settings, heroRightWord: e.target.value })}
                    placeholder="เช่น LD หรือ ศาสตร์"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-black text-slate-900 tracking-wider text-base focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    ตัวอักษรขนาดใหญ่ฝั่งขวาของแคปซูล
                  </span>
                </div>
              </div>

              {/* Capsule Image Uploader & Live Preview */}
              <div className="p-4 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-slate-50 rounded-2xl border border-amber-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-800 text-xs">
                      รูปภาพในแคปซูลเกาะลอยน้ำ (Capsule Island Image):
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-800 font-semibold bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-200">
                    รองรับลากวางไฟล์, คลิกเลือกรูป, หรือใส่ URL
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* Left Column: Live Capsule Preview */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-600" />
                      <span>ตัวอย่างแคปซูลจริง (Live Preview)</span>
                    </div>

                    {/* Capsule Miniature Representation */}
                    <div className="flex items-center justify-center gap-2 py-2 select-none">
                      <span className="text-xl sm:text-2xl font-black text-slate-900">
                        {settings.heroLeftWord || 'WI'}
                      </span>
                      <div className="relative w-36 h-18 rounded-[50px] overflow-hidden shadow-md border-2 border-white bg-slate-900 group">
                        {settings.heroCapsuleImage ? (
                          <img
                            src={settings.heroCapsuleImage}
                            alt="Capsule Preview"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as any).src = '/images/wild-capsule-island.jpg';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                            ไม่มีรูปภาพ
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 pointer-events-none" />
                      </div>
                      <span className="text-xl sm:text-2xl font-black text-slate-900">
                        {settings.heroRightWord || 'LD'}
                      </span>
                    </div>

                    {/* Reset to Default Image Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          heroCapsuleImage: '/images/wild-capsule-island.jpg',
                        })
                      }
                      className="text-[10px] text-slate-500 hover:text-amber-700 font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="ใช้รูปเกาะลอยน้ำต้นฉบับ MotionSites AI"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>รีเซ็ตเป็นรูปเกาะลอยน้ำต้นฉบับ</span>
                    </button>
                  </div>

                  {/* Right Column: Drag-and-Drop Zone & URL Input */}
                  <div className="md:col-span-7 space-y-3">
                    {/* Drag & Drop File Upload Box */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsCapsuleDragOver(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsCapsuleDragOver(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsCapsuleDragOver(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleCapsuleFileUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => capsuleFileInputRef.current?.click()}
                      className={`p-4 rounded-2xl border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5 ${
                        isCapsuleDragOver
                          ? 'border-amber-500 bg-amber-100/60 scale-[1.01]'
                          : 'border-amber-300 hover:border-amber-500 bg-white hover:bg-amber-50/40'
                      }`}
                    >
                      <input
                        type="file"
                        ref={capsuleFileInputRef}
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleCapsuleFileUpload(e.target.files[0]);
                          }
                        }}
                      />

                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                        <UploadCloud className={`w-5 h-5 ${uploadingCapsule ? 'animate-bounce text-amber-600' : ''}`} />
                      </div>

                      <div className="text-xs font-bold text-slate-800">
                        {uploadingCapsule
                          ? '⏳ กำลังอัปโหลดรูปภาพเข้าสู่ระบบ...'
                          : 'ลากรูปภาพมาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์จากเครื่อง'}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        รองรับไฟล์ JPG, PNG, WEBP, GIF (บันทึกเข้าระบบอัตโนมัติ)
                      </p>
                    </div>

                    {/* Direct URL Input */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-[11px] flex items-center justify-between">
                        <span>หรือระบุที่อยู่รูปภาพ (Image URL / Google Drive):</span>
                        {settings.heroCapsuleImage && (
                          <button
                            type="button"
                            onClick={() => setSettings({ ...settings, heroCapsuleImage: '' })}
                            className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                          >
                            ล้างค่า
                          </button>
                        )}
                      </label>
                      <input
                        type="text"
                        value={settings.heroCapsuleImage ?? ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            heroCapsuleImage: e.target.value,
                          })
                        }
                        placeholder="เช่น /images/wild-capsule-island.jpg หรือ URL รูปภาพ"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge, Thai Subtitle & English Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      ข้อความ Badge ป้ายกำกับบนสุด:
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          heroBadgeText: 'คณะพุทธศาสตร์ • มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
                        })
                      }
                      className="text-[10px] text-amber-700 hover:underline font-bold cursor-pointer"
                    >
                      ใช้ชื่อคณะภาษาไทย
                    </button>
                  </div>
                  <input
                    type="text"
                    value={settings.heroBadgeText ?? 'Creative Designer & Faculty of Buddhism • MCU'}
                    onChange={(e) => setSettings({ ...settings, heroBadgeText: e.target.value })}
                    placeholder="Creative Designer & Faculty of Buddhism • MCU"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    หัวข้อหลักภาษาไทย (ใต้รูปแคปซูล):
                  </label>
                  <input
                    type="text"
                    value={settings.heroHeadingTh ?? 'ระบบบริการนิสิตและวิชาการออนไลน์ คณะพุทธศาสตร์'}
                    onChange={(e) => setSettings({ ...settings, heroHeadingTh: e.target.value })}
                    placeholder="ระบบบริการนิสิตและวิชาการออนไลน์ คณะพุทธศาสตร์"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ข้อความบรรทัดรอง (อังกฤษ / ปีการศึกษา):
                  </label>
                  <input
                    type="text"
                    value={
                      settings.heroSubHeadingEn ??
                      'Mahachulalongkornrajavidyalaya University • Academic Year 2569–2570'
                    }
                    onChange={(e) =>
                      setSettings({ ...settings, heroSubHeadingEn: e.target.value })
                    }
                    placeholder="Mahachulalongkornrajavidyalaya University • Academic Year 2569–2570"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Hero Background Style & Visibility Toggles */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    โทนสีพื้นหลังกรอบ Hero (Hero Background Style):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'wavy-contours', label: 'ครีมอบอุ่นเส้นคลื่น (ค่าเริ่มต้น)' },
                      { id: 'gold-glow', label: 'ทองพุทธธรรมพรีเมียม' },
                      { id: 'minimal', label: 'ขาวสะอาดมินิมอล' },
                      { id: 'navy', label: 'กรมท่าวิชาการ (Dark)' },
                    ].map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() =>
                          setSettings({ ...settings, heroBgStyle: bg.id as any })
                        }
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          (settings.heroBgStyle || 'wavy-contours') === bg.id
                            ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {bg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">
                    การแสดงผลองค์ประกอบในกรอบ Hero:
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={settings.heroShowTopNav !== false}
                        onChange={(e) =>
                          setSettings({ ...settings, heroShowTopNav: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-amber-600"
                      />
                      <span>แถบเมนูด้านบน</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={settings.heroShowBadge !== false}
                        onChange={(e) =>
                          setSettings({ ...settings, heroShowBadge: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-amber-600"
                      />
                      <span>ป้ายกำกับ Badge</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={settings.heroShowActionButtons === true}
                        onChange={(e) =>
                          setSettings({ ...settings, heroShowActionButtons: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-amber-600"
                      />
                      <span>ปุ่มกดทางลัดด้านล่าง</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Description & Drop-cap */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    อักษรดรอปแคป (Drop Cap):
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={settings.heroDropCapLetter ?? 'E'}
                    onChange={(e) =>
                      setSettings({ ...settings, heroDropCapLetter: e.target.value })
                    }
                    placeholder="E"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-serif font-black text-center text-base focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block text-center">
                    ตัวอักษรใหญ่เปิดหัวข้อ
                  </span>
                </div>

                <div className="md:col-span-3">
                  <label className="font-bold text-slate-700 block mb-1">
                    คำอธิบายย่อยเพิ่มเติม (เว้นว่างไว้หากไม่ต้องการแสดง):
                  </label>
                  <textarea
                    rows={2}
                    value={settings.heroDescription ?? ''}
                    onChange={(e) =>
                      setSettings({ ...settings, heroDescription: e.target.value })
                    }
                    placeholder="พิมพ์คำอธิบายย่อยเพิ่มเติมใต้ชื่อมหาวิทยาลัย..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ปุ่มหลัก (ข้อความ):
                  </label>
                  <input
                    type="text"
                    value={settings.heroPrimaryBtnText ?? "ยื่นคำร้องขอหนังสือรับรอง"}
                    onChange={(e) =>
                      setSettings({ ...settings, heroPrimaryBtnText: e.target.value })
                    }
                    placeholder="ยื่นคำร้องขอหนังสือรับรอง"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ปุ่มหลัก (ลิงก์ URL):
                  </label>
                  <input
                    type="text"
                    value={settings.heroPrimaryBtnUrl ?? '/certificates'}
                    onChange={(e) =>
                      setSettings({ ...settings, heroPrimaryBtnUrl: e.target.value })
                    }
                    placeholder="/certificates"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ปุ่มรอง (ข้อความ):
                  </label>
                  <input
                    type="text"
                    value={settings.heroSecondaryBtnText ?? 'ตารางเรียนและวิชาการ'}
                    onChange={(e) =>
                      setSettings({ ...settings, heroSecondaryBtnText: e.target.value })
                    }
                    placeholder="ตารางเรียนและวิชาการ"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ปุ่มรอง (ลิงก์ URL):
                  </label>
                  <input
                    type="text"
                    value={settings.heroSecondaryBtnUrl ?? '/courses'}
                    onChange={(e) =>
                      setSettings({ ...settings, heroSecondaryBtnUrl: e.target.value })
                    }
                    placeholder="/courses"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* ================= TAB 4: คาบเวลาและตารางสอน ================= */}
    {(activeSubTab === 'timetables' || activeSubTab === 'all') && (
      <div className="space-y-5">
        {/* 5. กำหนดช่วงเวลาคาบเรียนในตารางสอน (Timetable Period Times Configuration) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                กำหนดช่วงเวลาคาบเรียนในตารางสอน (Timetable Period Times)
              </h4>
              <p className="text-xs text-slate-500">
                ปรับแต่งข้อความหัวตารางและช่วงเวลาในแต่ละคาบเรียน (เช้า, กลางวัน, บ่าย, ค่ำ/ปฏิบัติการ) เพื่อแสดงผลในตารางสอนหน้าระบบ (/courses)
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSettings({
                  ...settings,
                  morningPeriodLabel: 'คาบเช้า (09:00 - 11:30 น.)',
                  morningPeriodSub: 'ภาคการศึกษาปกติ',
                  lunchPeriodLabel: 'พักฉัน / พักกลางวัน',
                  lunchPeriodTime: '11:30 - 13:00',
                  afternoonPeriodLabel: 'คาบบ่าย (13:00 - 15:30 น.)',
                  afternoonPeriodSub: 'ภาคการศึกษาปกติ',
                  eveningPeriodLabel: 'คาบเย็น / ปฏิบัติการ (16:00 - 18:30 น.)',
                  eveningPeriodSub: 'วิชาสัมมนา / กัมมัฏฐาน',
                });
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-600 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>รีเซ็ตเป็นค่ามาตรฐาน มจร</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* คาบเช้า */}
            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2.5">
              <div className="font-bold text-amber-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  1. คาบเช้า (Morning)
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-medium">Slot 1</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">หัวข้อคาบและเวลา</label>
                <input
                  type="text"
                  value={settings.morningPeriodLabel ?? 'คาบเช้า (09:00 - 11:30 น.)'}
                  onChange={(e) => setSettings({ ...settings, morningPeriodLabel: e.target.value })}
                  placeholder="คาบเช้า (09:00 - 11:30 น.)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">คำอธิบายย่อย</label>
                <input
                  type="text"
                  value={settings.morningPeriodSub ?? 'ภาคการศึกษาปกติ'}
                  onChange={(e) => setSettings({ ...settings, morningPeriodSub: e.target.value })}
                  placeholder="ภาคการศึกษาปกติ"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* พักกลางวัน / พักฉัน */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  2. พักฉัน / กลางวัน (Lunch)
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-medium">Slot 2</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">ข้อความป้ายพัก</label>
                <input
                  type="text"
                  value={settings.lunchPeriodLabel ?? 'พักฉัน / พักกลางวัน'}
                  onChange={(e) => setSettings({ ...settings, lunchPeriodLabel: e.target.value })}
                  placeholder="พักฉัน / พักกลางวัน"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">ช่วงเวลา</label>
                <input
                  type="text"
                  value={settings.lunchPeriodTime ?? '11:30 - 13:00'}
                  onChange={(e) => setSettings({ ...settings, lunchPeriodTime: e.target.value })}
                  placeholder="11:30 - 13:00"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500 font-mono"
                />
              </div>
            </div>

            {/* คาบบ่าย */}
            <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-2.5">
              <div className="font-bold text-blue-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  3. คาบบ่าย (Afternoon)
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono font-medium">Slot 3</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">หัวข้อคาบและเวลา</label>
                <input
                  type="text"
                  value={settings.afternoonPeriodLabel ?? 'คาบบ่าย (13:00 - 15:30 น.)'}
                  onChange={(e) => setSettings({ ...settings, afternoonPeriodLabel: e.target.value })}
                  placeholder="คาบบ่าย (13:00 - 15:30 น.)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">คำอธิบายย่อย</label>
                <input
                  type="text"
                  value={settings.afternoonPeriodSub ?? 'ภาคการศึกษาปกติ'}
                  onChange={(e) => setSettings({ ...settings, afternoonPeriodSub: e.target.value })}
                  placeholder="ภาคการศึกษาปกติ"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* คาบเย็น / ปฏิบัติการ */}
            <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/80 space-y-2.5">
              <div className="font-bold text-purple-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  4. คาบเย็น / สัมมนา (Evening)
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-mono font-medium">Slot 4</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">หัวข้อคาบและเวลา</label>
                <input
                  type="text"
                  value={settings.eveningPeriodLabel ?? 'คาบเย็น / ปฏิบัติการ (16:00 - 18:30 น.)'}
                  onChange={(e) => setSettings({ ...settings, eveningPeriodLabel: e.target.value })}
                  placeholder="คาบเย็น / ปฏิบัติการ (16:00 - 18:30 น.)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">คำอธิบายย่อย</label>
                <input
                  type="text"
                  value={settings.eveningPeriodSub ?? 'วิชาสัมมนา / กัมมัฏฐาน'}
                  onChange={(e) => setSettings({ ...settings, eveningPeriodSub: e.target.value })}
                  placeholder="วิชาสัมมนา / กัมมัฏฐาน"
                  className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* พรีวิวหัวตารางตามเวลาจริง */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              ตัวอย่างการแสดงผลหัวตารางสอน (Live Preview on /courses):
            </span>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-semibold">
                <div>{settings.morningPeriodLabel || 'คาบเช้า (09:00 - 11:30 น.)'}</div>
                <div className="text-[10px] text-amber-700/70 font-normal">{settings.morningPeriodSub || 'ภาคการศึกษาปกติ'}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                <div>{settings.lunchPeriodLabel || 'พักฉัน / พักกลางวัน'}</div>
                <div className="text-[10px] text-slate-500 font-mono">{settings.lunchPeriodTime || '11:30 - 13:00'}</div>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-semibold">
                <div>{settings.afternoonPeriodLabel || 'คาบบ่าย (13:00 - 15:30 น.)'}</div>
                <div className="text-[10px] text-blue-700/70 font-normal">{settings.afternoonPeriodSub || 'ภาคการศึกษาปกติ'}</div>
              </div>
              <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 font-semibold">
                <div>{settings.eveningPeriodLabel || 'คาบเย็น / ปฏิบัติการ (16:00 - 18:30 น.)'}</div>
                <div className="text-[10px] text-purple-700/70 font-normal">{settings.eveningPeriodSub || 'วิชาสัมมนา / กัมมัฏฐาน'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. กำหนดวันเรียนที่แสดงบนตารางและหมายเหตุท้ายตารางแยกตามระดับหลักสูตร (Timetable Display Days & Degree Notes) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                กำหนดวันเรียนที่แสดงบนตารางและหมายเหตุท้ายตารางแยกตามระดับหลักสูตร (Degree Timetable Days & Notes)
              </h4>
              <p className="text-xs text-slate-500">
                กำหนดว่าแต่ละระดับหลักสูตรจะแสดงวันใดบ้างบนตารางสอน (เช่น ป.ตรี แสดง จันทร์-พฤหัส, ป.โท/เอก แสดง เสาร์-อาทิตย์) และปรับแต่งข้อความหมายเหตุท้ายตาราง
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSettings({
                  ...settings,
                  timetableDaysBachelor: [1, 2, 3, 4],
                  timetableDaysMaster: [6, 7],
                  timetableDaysDoctoral: [6, 7],
                  timetableDaysCertificate: [6, 7],
                  timetableNotesBachelor: "หมายเหตุ\t๑. วันพระและวันนักขัตฤกษ์เป็นวันหยุดทั่วไป (ตารางเรียนวันใดตรงกับวันพระให้ยกไปเรียนวันศุกร์)\n\t๒. *รายวิชาข้อสอบกลาง",
                  timetableNotesMaster: "หมายเหตุ\t๑. จัดการเรียนการสอนวันเสาร์ - วันอาทิตย์ ตามตารางที่หลักสูตรกำหนด",
                  timetableNotesDoctoral: "หมายเหตุ\t๑. จัดการเรียนการสอนวันเสาร์ - วันอาทิตย์ ตามตารางที่หลักสูตรกำหนด",
                  timetableNotesCertificate: "หมายเหตุ\t๑. จัดการเรียนการสอนตามประกาศตารางเรียนหลักสูตรประกาศนียบัตร",
                });
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-600 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>รีเซ็ตวันและหมายเหตุเป็นค่าเริ่มต้น</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
            {/* 1. ปริญญาตรี (Bachelor) */}
            {(() => {
              const currentDays = settings.timetableDaysBachelor && settings.timetableDaysBachelor.length > 0
                ? settings.timetableDaysBachelor
                : [1, 2, 3, 4];
              const noteText = settings.timetableNotesBachelor ?? "หมายเหตุ\t๑. วันพระและวันนักขัตฤกษ์เป็นวันหยุดทั่วไป (ตารางเรียนวันใดตรงกับวันพระให้ยกไปเรียนวันศุกร์)\n\t๒. *รายวิชาข้อสอบกลาง";

              const dayList = [
                { id: 1, label: 'จันทร์', short: 'จ.' },
                { id: 2, label: 'อังคาร', short: 'อ.' },
                { id: 3, label: 'พุธ', short: 'พ.' },
                { id: 4, label: 'พฤหัสฯ', short: 'พฤ.' },
                { id: 5, label: 'ศุกร์', short: 'ศ.' },
                { id: 6, label: 'เสาร์', short: 'ส.' },
                { id: 7, label: 'อาทิตย์', short: 'อา.' },
              ];

              return (
                <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/80">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-amber-700" />
                      <span className="font-extrabold text-amber-950 text-sm">🎓 ระดับปริญญาตรี (พธ.บ.)</span>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      แสดง {currentDays.length} วัน
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-700 text-[11px]">เลือกวันที่จะแสดงบนตารางสอน:</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, timetableDaysBachelor: [1, 2, 3, 4] })}
                          className="text-[10px] text-amber-700 hover:underline cursor-pointer font-medium"
                        >
                          [จ.-พฤ.]
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, timetableDaysBachelor: [1, 2, 3, 4, 5] })}
                          className="text-[10px] text-amber-700 hover:underline cursor-pointer font-medium"
                        >
                          [จ.-ศ.]
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, timetableDaysBachelor: [1, 2, 3, 4, 5, 6, 7] })}
                          className="text-[10px] text-amber-700 hover:underline cursor-pointer font-medium"
                        >
                          [ทุกวัน]
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {dayList.map((d) => {
                        const active = currentDays.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              const next = active
                                ? currentDays.length > 1
                                  ? currentDays.filter((x) => x !== d.id)
                                  : currentDays
                                : [...currentDays, d.id].sort((a, b) => a - b);
                              setSettings({ ...settings, timetableDaysBachelor: next });
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              active
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-amber-400'
                            }`}
                          >
                            <span>{d.label}</span>
                            {active && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 text-[11px] block mb-1">
                      กล่องข้อความหมายเหตุท้ายตาราง (Footer Notes):
                    </label>
                    <textarea
                      rows={3}
                      value={noteText}
                      onChange={(e) => setSettings({ ...settings, timetableNotesBachelor: e.target.value })}
                      placeholder="หมายเหตุ ๑. วันพระและวันนักขัตฤกษ์เป็นวันหยุดทั่วไป..."
                      className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium leading-relaxed"
                    />
                  </div>
                </div>
              );
            })()}

            {/* 2. ปริญญาโท (Master) */}
            {(() => {
              const currentDays = settings.timetableDaysMaster && settings.timetableDaysMaster.length > 0
                ? settings.timetableDaysMaster
                : [6, 7];
              const noteText = settings.timetableNotesMaster ?? "หมายเหตุ\t๑. จัดการเรียนการสอนวันเสาร์ - วันอาทิตย์ ตามตารางที่หลักสูตรกำหนด";

              const dayList = [
                { id: 1, label: 'จันทร์', short: 'จ.' },
                { id: 2, label: 'อังคาร', short: 'อ.' },
                { id: 3, label: 'พุธ', short: 'พ.' },
                { id: 4, label: 'พฤหัสฯ', short: 'พฤ.' },
                { id: 5, label: 'ศุกร์', short: 'ศ.' },
                { id: 6, label: 'เสาร์', short: 'ส.' },
                { id: 7, label: 'อาทิตย์', short: 'อา.' },
              ];

              return (
                <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-700" />
                      <span className="font-extrabold text-blue-950 text-sm">🎓 ระดับปริญญาโท (พธ.ม.)</span>
                    </div>
                    <span className="text-[10px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                      แสดง {currentDays.length} วัน
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-700 text-[11px]">เลือกวันที่จะแสดงบนตารางสอน:</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, timetableDaysMaster: [6, 7] })}
                          className="text-[10px] text-blue-700 hover:underline cursor-pointer font-medium"
                        >
                          [ส.-อา.]
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, timetableDaysMaster: [5, 6, 7] })}
                          className="text-[10px] text-blue-700 hover:underline cursor-pointer font-medium"
                        >
                          [ศ.-อา.]
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, timetableDaysMaster: [1, 2, 3, 4, 5, 6, 7] })}
                          className="text-[10px] text-blue-700 hover:underline cursor-pointer font-medium"
                        >
                          [ทุกวัน]
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {dayList.map((d) => {
                        const active = currentDays.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              const next = active
                                ? currentDays.length > 1
                                  ? currentDays.filter((x) => x !== d.id)
                                  : currentDays
                                : [...currentDays, d.id].sort((a, b) => a - b);
                              setSettings({ ...settings, timetableDaysMaster: next });
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              active
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-400'
                            }`}
                          >
                            <span>{d.label}</span>
                            {active && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 text-[11px] block mb-1">
                      กล่องข้อความหมายเหตุท้ายตาราง (Footer Notes):
                    </label>
                    <textarea
                      rows={3}
                      value={noteText}
                      onChange={(e) => setSettings({ ...settings, timetableNotesMaster: e.target.value })}
                      placeholder="หมายเหตุ ๑. จัดการเรียนการสอนวันเสาร์ - อาทิตย์..."
                      className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium leading-relaxed"
                    />
                  </div>
                </div>
              );
            })()}

            {/* 3. ปริญญาเอก (Doctorate) */}
            {(() => {
              const currentDays = settings.timetableDaysDoctoral && settings.timetableDaysDoctoral.length > 0
                ? settings.timetableDaysDoctoral
                : [6, 7];
              const noteText = settings.timetableNotesDoctoral ?? "หมายเหตุ\t๑. จัดการเรียนการสอนวันเสาร์ - วันอาทิตย์ ตามตารางที่หลักสูตรกำหนด";

              const dayList = [
                { id: 1, label: 'จันทร์', short: 'จ.' },
                { id: 2, label: 'อังคาร', short: 'อ.' },
                { id: 3, label: 'พุธ', short: 'พ.' },
                { id: 4, label: 'พฤหัสฯ', short: 'พฤ.' },
                { id: 5, label: 'ศุกร์', short: 'ศ.' },
                { id: 6, label: 'เสาร์', short: 'ส.' },
                { id: 7, label: 'อาทิตย์', short: 'อา.' },
              ];

              return (
                <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-200/80">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-purple-700" />
                      <span className="font-extrabold text-purple-950 text-sm">🎓 ระดับปริญญาเอก (พธ.ด.)</span>
                    </div>
                    <span className="text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                      แสดง {currentDays.length} วัน
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-700 text-[11px]">เลือกวันที่จะแสดงบนตารางสอน:</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, timetableDaysDoctoral: [6, 7] })}
                          className="text-[10px] text-purple-700 hover:underline cursor-pointer font-medium"
                        >
                          [ส.-อา.]
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, timetableDaysDoctoral: [5, 6, 7] })}
                          className="text-[10px] text-purple-700 hover:underline cursor-pointer font-medium"
                        >
                          [ศ.-อา.]
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, timetableDaysDoctoral: [1, 2, 3, 4, 5, 6, 7] })}
                          className="text-[10px] text-purple-700 hover:underline cursor-pointer font-medium"
                        >
                          [ทุกวัน]
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {dayList.map((d) => {
                        const active = currentDays.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              const next = active
                                ? currentDays.length > 1
                                  ? currentDays.filter((x) => x !== d.id)
                                  : currentDays
                                : [...currentDays, d.id].sort((a, b) => a - b);
                              setSettings({ ...settings, timetableDaysDoctoral: next });
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              active
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-purple-400'
                            }`}
                          >
                            <span>{d.label}</span>
                            {active && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 text-[11px] block mb-1">
                      กล่องข้อความหมายเหตุท้ายตาราง (Footer Notes):
                    </label>
                    <textarea
                      rows={3}
                      value={noteText}
                      onChange={(e) => setSettings({ ...settings, timetableNotesDoctoral: e.target.value })}
                      placeholder="หมายเหตุ ๑. จัดการเรียนการสอนวันเสาร์ - อาทิตย์..."
                      className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium leading-relaxed"
                    />
                  </div>
                </div>
              );
            })()}

            {/* 4. ประกาศนียบัตร (Certificate) */}
            {(() => {
              const currentDays = settings.timetableDaysCertificate && settings.timetableDaysCertificate.length > 0
                ? settings.timetableDaysCertificate
                : [6, 7];
              const noteText = settings.timetableNotesCertificate ?? "หมายเหตุ\t๑. จัดการเรียนการสอนตามประกาศตารางเรียนหลักสูตรประกาศนียบัตร";

              const dayList = [
                { id: 1, label: 'จันทร์', short: 'จ.' },
                { id: 2, label: 'อังคาร', short: 'อ.' },
                { id: 3, label: 'พุธ', short: 'พ.' },
                { id: 4, label: 'พฤหัสฯ', short: 'พฤ.' },
                { id: 5, label: 'ศุกร์', short: 'ศ.' },
                { id: 6, label: 'เสาร์', short: 'ส.' },
                { id: 7, label: 'อาทิตย์', short: 'อา.' },
              ];

              return (
                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-700" />
                      <span className="font-extrabold text-emerald-950 text-sm">📜 หลักสูตรประกาศนียบัตร</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                      แสดง {currentDays.length} วัน
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-700 text-[11px]">เลือกวันที่จะแสดงบนตารางสอน:</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, timetableDaysCertificate: [6, 7] })}
                          className="text-[10px] text-emerald-700 hover:underline cursor-pointer font-medium"
                        >
                          [ส.-อา.]
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, timetableDaysCertificate: [1, 2, 3, 4, 5] })}
                          className="text-[10px] text-emerald-700 hover:underline cursor-pointer font-medium"
                        >
                          [จ.-ศ.]
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, timetableDaysCertificate: [1, 2, 3, 4, 5, 6, 7] })}
                          className="text-[10px] text-emerald-700 hover:underline cursor-pointer font-medium"
                        >
                          [ทุกวัน]
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {dayList.map((d) => {
                        const active = currentDays.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              const next = active
                                ? currentDays.length > 1
                                  ? currentDays.filter((x) => x !== d.id)
                                  : currentDays
                                : [...currentDays, d.id].sort((a, b) => a - b);
                              setSettings({ ...settings, timetableDaysCertificate: next });
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              active
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-400'
                            }`}
                          >
                            <span>{d.label}</span>
                            {active && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 text-[11px] block mb-1">
                      กล่องข้อความหมายเหตุท้ายตาราง (Footer Notes):
                    </label>
                    <textarea
                      rows={3}
                      value={noteText}
                      onChange={(e) => setSettings({ ...settings, timetableNotesCertificate: e.target.value })}
                      placeholder="หมายเหตุ ๑. จัดการเรียนการสอนตามประกาศ..."
                      className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium leading-relaxed"
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    )}

    {/* ================= TAB 5: แจ้งเตือนและความปลอดภัย ================= */}
    {(activeSubTab === 'security' || activeSubTab === 'all') && (
      <div className="space-y-5">
        {/* 7. กล่องแจ้งเตือนสำคัญหน้าระบบหนังสือรับรอง (Certificate Notice Banners) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-purple-600" />
                ข้อความกล่องแจ้งเตือน 3 กล่อง หน้าระบบขอหนังสือรับรอง (/certificates)
              </h4>
              <p className="text-xs text-slate-500">
                ผู้ดูแลระบบสามารถเปิด/ปิดการแสดงผล และแก้ไขข้อความหัวข้อหรือคำแนะนำเพื่อสื่อสารกับนิสิตได้ตลอดเวลา
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* กล่องที่ 1: สีแดง (วีซ่า / Visa Alert) */}
            <div className="p-4 rounded-2xl bg-red-50/70 border-2 border-red-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-red-950 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  กล่องที่ 1 (สีแดง): แจ้งเตือนสำคัญ (VISA ALERT)
                </span>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-red-900 text-xs">
                  <input
                    type="checkbox"
                    checked={settings.visaAlertEnabled !== false}
                    onChange={(e) =>
                      setSettings({ ...settings, visaAlertEnabled: e.target.checked })
                    }
                    className="rounded border-red-300 text-red-600 focus:ring-red-500 w-4 h-4"
                  />
                  <span>แสดงกล่องนี้</span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <label className="font-bold text-red-950 block mb-1">ข้อความหัวข้อหลัก:</label>
                  <input
                    type="text"
                    value={settings.visaAlertTitle ?? ''}
                    onChange={(e) =>
                      setSettings({ ...settings, visaAlertTitle: e.target.value })
                    }
                    placeholder="สำหรับการต่อวีซ่า ให้ดำเนินการก่อนหนังสือเดินทางหมดอายุ 30 วัน"
                    className="w-full px-3 py-2 rounded-xl border border-red-200 bg-white text-xs font-semibold text-red-950 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-red-900 block mb-1">ข้อความคำอธิบายย่อย:</label>
                  <input
                    type="text"
                    value={settings.visaAlertDesc ?? ''}
                    onChange={(e) =>
                      setSettings({ ...settings, visaAlertDesc: e.target.value })
                    }
                    placeholder="* เพื่อให้มีระยะเวลาเพียงพอต่อการพิจารณาของ ตม. และป้องกันการเสียค่าปรับ"
                    className="w-full px-3 py-2 rounded-xl border border-red-200 bg-white text-xs text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>
            </div>

            {/* กล่องที่ 2: สีฟ้า (ระยะเวลาดำเนินการ / Timeline) */}
            <div className="p-4 rounded-2xl bg-sky-50/70 border-2 border-sky-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sky-950 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                  กล่องที่ 2 (สีฟ้า): ระยะเวลาดำเนินการ (TIMELINE)
                </span>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sky-900 text-xs">
                  <input
                    type="checkbox"
                    checked={settings.timelineAlertEnabled !== false}
                    onChange={(e) =>
                      setSettings({ ...settings, timelineAlertEnabled: e.target.checked })
                    }
                    className="rounded border-sky-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                  />
                  <span>แสดงกล่องนี้</span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <label className="font-bold text-sky-950 block mb-1">ข้อความหัวข้อหลัก:</label>
                  <input
                    type="text"
                    value={settings.timelineAlertTitle ?? ''}
                    onChange={(e) =>
                      setSettings({ ...settings, timelineAlertTitle: e.target.value })
                    }
                    placeholder="การดำเนินการ จะเสร็จสิ้น ประมาณ 1-2 วัน ไม่นับวันหยุด หรือ กรุณาตรวจดูเส้นทางการดำเนินการหนังสือว่า &quot;อนุมัติ&quot;"
                    className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white text-xs font-semibold text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-sky-900 block mb-1">ข้อความคำอธิบายย่อย:</label>
                  <input
                    type="text"
                    value={settings.timelineAlertDesc ?? ''}
                    onChange={(e) =>
                      setSettings({ ...settings, timelineAlertDesc: e.target.value })
                    }
                    placeholder="* สามารถตรวจสอบความคืบหน้าได้ตลอดเวลาที่แท็บ &quot;เช็คสถานะคำร้อง&quot;"
                    className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white text-xs text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>
            </div>

            {/* กล่องที่ 3: สีส้ม/เหลือง (ความถูกต้องของข้อมูล / Accuracy) */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-950 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                  กล่องที่ 3 (สีส้ม/เหลือง): ความถูกต้องของข้อมูล (ACCURACY)
                </span>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900 text-xs">
                  <input
                    type="checkbox"
                    checked={settings.accuracyAlertEnabled !== false}
                    onChange={(e) =>
                      setSettings({ ...settings, accuracyAlertEnabled: e.target.checked })
                    }
                    className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>แสดงกล่องนี้</span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <label className="font-bold text-amber-950 block mb-1">ข้อความหัวข้อหลัก:</label>
                  <input
                    type="text"
                    value={settings.accuracyAlertTitle ?? ''}
                    onChange={(e) =>
                      setSettings({ ...settings, accuracyAlertTitle: e.target.value })
                    }
                    placeholder="กรุณากรอกข้อมูลให้ครบถ้วน มิฉะนั้นเอกสารจะไม่สมบูรณ์และจะยกเลิกการขอหนังสือ"
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs font-semibold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-amber-900 block mb-1">ข้อความคำอธิบายย่อย:</label>
                  <input
                    type="text"
                    value={settings.accuracyAlertDesc ?? ''}
                    onChange={(e) =>
                      setSettings({ ...settings, accuracyAlertDesc: e.target.value })
                    }
                    placeholder="* ตรวจสอบตัวสะกดชื่อ-นามสกุลภาษาอังกฤษและเลขพาสปอร์ตให้ตรงกับเล่มจริง"
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Access Policy Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            ความปลอดภัยและการเข้าใช้งานระบบ (Security & Authentication Policy)
          </h3>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>บังคับเปลี่ยนรหัสผ่านเมื่อเข้าใช้งานครั้งแรก (First-Time Login Password Change Enforce)</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    settings.forcePasswordChangeOnFirstLogin !== false
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}
                >
                  {settings.forcePasswordChangeOnFirstLogin !== false ? 'เปิดใช้งานอยู่ (ON)' : 'ปิดใช้งาน (OFF)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                อาจารย์และนิสิตที่เข้าสู่ระบบครั้งแรกด้วยรหัสผ่านเริ่มต้น (mcu123456 หรือรหัสนิสิต) จะต้องตั้งรหัสผ่านใหม่ส่วนตัวก่อนเข้าสู่ระบบ
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.forcePasswordChangeOnFirstLogin !== false}
                onChange={(e) =>
                  setSettings({ ...settings, forcePasswordChangeOnFirstLogin: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </div>
      </div>
    )}

    {/* Submit button bar */}
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="text-xs text-slate-500 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>
          การแก้ไขในแท็บนี้จะถูกบันทึกเมื่อกดปุ่ม <strong className="text-slate-800">"บันทึกการตั้งค่า"</strong>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={savingSettings}
          className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md shadow-pink-600/20 transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>{savingSettings ? 'กำลังบันทึกการตั้งค่า...' : 'บันทึกการตั้งค่าระบบ'}</span>
        </button>
      </div>
    </div>
      </form>
    </div>
  );
}
