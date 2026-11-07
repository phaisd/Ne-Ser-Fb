'use client';

import React, { useState } from 'react';
import {
  Palette,
  ShieldCheck,
  UserCog,
  Clock,
  Eye,
  Sparkles,
  Check,
} from 'lucide-react';
import { SystemSettings, SignatoryItem } from '@/types';
import { THEME_PRESETS } from '@/lib/theme-presets';
import {
  BrandIdentitySection,
  BrandHeroSection,
  BrandSignatoriesSection,
  BrandTimetableSection,
  BrandSecuritySection,
} from './branding';

export interface AdminBrandingTabProps {
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

        {/* TAB 1: Brand Identity, Logo, Theme, Typography & Contact */}
        {(activeSubTab === 'identity' || activeSubTab === 'all') && (
          <BrandIdentitySection
            settings={settings}
            setSettings={setSettings}
            savingSettings={savingSettings}
            setSavingSettings={setSavingSettings}
            handleLogoFileUpload={handleLogoFileUpload}
            uploadingLogo={uploadingLogo}
            logoFileInputRef={logoFileInputRef}
            setActionSuccess={setActionSuccess}
          />
        )}

        {/* TAB 2: Hero Banner & Portal Feature Visibility */}
        {(activeSubTab === 'hero' || activeSubTab === 'all') && (
          <BrandHeroSection
            settings={settings}
            setSettings={setSettings}
          />
        )}

        {/* TAB 3: Authorized Signatories & Dropdown Management */}
        {(activeSubTab === 'signatories' || activeSubTab === 'all') && (
          <BrandSignatoriesSection
            settings={settings}
            setSettings={setSettings}
            activeSignatoriesList={activeSignatoriesList}
            isAddingSignatory={isAddingSignatory}
            setIsAddingSignatory={setIsAddingSignatory}
            newSignatoryForm={newSignatoryForm}
            setNewSignatoryForm={setNewSignatoryForm}
            handleAddSignatory={handleAddSignatory}
            handleResetSignatories={handleResetSignatories}
            editingSignatoryId={editingSignatoryId}
            setEditingSignatoryId={setEditingSignatoryId}
            editSignatoryForm={editSignatoryForm}
            setEditSignatoryForm={setEditSignatoryForm}
            handleSaveEditSignatory={handleSaveEditSignatory}
            handleDeleteSignatory={handleDeleteSignatory}
          />
        )}

        {/* TAB 4: Timetable Periods & Degree Notes */}
        {(activeSubTab === 'timetables' || activeSubTab === 'all') && (
          <BrandTimetableSection
            settings={settings}
            setSettings={setSettings}
          />
        )}

        {/* TAB 5: Security & Notices */}
        {(activeSubTab === 'security' || activeSubTab === 'all') && (
          <BrandSecuritySection
            settings={settings}
            setSettings={setSettings}
          />
        )}

        {/* Bottom Submit Button Bar */}
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
