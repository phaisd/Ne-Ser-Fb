'use client';

import React from 'react';
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
} from 'lucide-react';
import { SystemSettings, SignatoryItem } from '@/types';

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
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Palette className="w-5 h-5 text-pink-600" />
          ปรับแต่งอัตลักษณ์ โลโก้ และข้อมูลสถาบัน (Branding & System Customization)
        </h2>
        <p className="text-xs text-slate-500">
          ปรับแต่งโลโก้มหาวิทยาลัย, ข้อความหัวกระดาษหนังสือราชการ, ชื่อคณบดี/ผู้ลงนาม และข้อมูลติดต่อที่แสดงทั่วทั้งระบบ
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
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

        {/* 4. Contact & Announcements */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
            <Mail className="w-4 h-4 text-pink-600" />
            4. ข้อมูลติดต่อและข้อความประกาศ (Contact & Announcements)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">เบอร์โทรศัพท์ติดต่อ:</label>
              <input
                type="text"
                value={settings.contactPhone ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, contactPhone: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">อีเมลติดต่อสถาบัน:</label>
              <input
                type="text"
                value={settings.contactEmail ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, contactEmail: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">ที่ตั้งสำนักงาน/ที่อยู่ภาษาไทย (Address):</label>
              <input
                type="text"
                value={settings.addressTh ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, addressTh: e.target.value })
                }
                placeholder="อาคารเรียนรวม ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา 13170"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
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
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 5. กล่องแจ้งเตือนสำคัญหน้าระบบหนังสือรับรอง (Certificate Notice Banners) */}
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

        {/* Submit button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={savingSettings}
            className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-lg shadow-pink-600/30 transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{savingSettings ? 'กำลังบันทึกการตั้งค่า...' : 'บันทึกการตั้งค่าระบบและโลโก้'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
