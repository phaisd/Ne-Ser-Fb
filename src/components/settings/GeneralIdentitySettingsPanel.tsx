'use client';

import React, { useRef, useState } from 'react';
import {
  Building2,
  Sparkles,
  CheckCircle2,
  Trash2,
  UploadCloud,
  Check,
  RefreshCw,
  Table2,
} from 'lucide-react';
import type { SystemSettings } from '@/types';
import { toast } from '@/lib/toast';

interface GeneralIdentitySettingsPanelProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  onSettingsUpdated?: () => void;
}

export function GeneralIdentitySettingsPanel({
  settings,
  setSettings,
  onSettingsUpdated,
}: GeneralIdentitySettingsPanelProps) {
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [pullingFromSheets, setPullingFromSheets] = useState(false);
  const [logoSaveSuccess, setLogoSaveSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileSelect = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG, WEBP, GIF, SVG)');
      return;
    }
    setSelectedLogoFile(file);
    const objUrl = URL.createObjectURL(file);
    setLogoPreviewUrl(objUrl);
    setLogoSaveSuccess(`เลือกไฟล์ "${file.name}" เรียบร้อยแล้ว — กรุณากดปุ่ม "บันทึก" เพื่อยืนยัน`);
  };

  const handleClearSelectedLogoFile = () => {
    setSelectedLogoFile(null);
    setLogoPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLogoSaveSuccess(null);
  };

  const handleSaveLogoOnly = async () => {
    setSavingLogo(true);
    setLogoSaveSuccess(null);
    try {
      let finalUrl = settings.logoUrl;

      if (selectedLogoFile) {
        setUploadingLogo(true);
        try {
          const formData = new FormData();
          formData.append('scope', 'branding');
          formData.append('file', selectedLogoFile);
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          const uploadData = await uploadRes.json();
          if (uploadData.success && uploadData.url) {
            finalUrl = uploadData.url;
          } else {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve((e.target?.result as string) || '');
              reader.onerror = reject;
              reader.readAsDataURL(selectedLogoFile);
            });
            if (base64) {
              const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataUrl: base64, scope: 'branding' }),
              });
              const data = await res.json();
              finalUrl = data.success && data.url ? data.url : base64;
            }
          }
        } finally {
          setUploadingLogo(false);
        }
      }

      const newSettings = { ...settings, logoUrl: finalUrl };
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(newSettings);
        setSelectedLogoFile(null);
        setLogoPreviewUrl(null);
        if (data.data?.logoUrl) {
          setSettings((prev) => ({ ...prev, logoUrl: data.data.logoUrl }));
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('mcu_settings_updated'));
        }
        onSettingsUpdated?.();
        toast.success('บันทึกโลโก้และข้อมูลระบบเรียบร้อยแล้ว');
        setLogoSaveSuccess('✅ บันทึกโลโก้และข้อมูลระบบเรียบร้อยแล้ว! Navbar และเอกสารได้รับการอัปเดตทันที');
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingLogo(false);
    }
  };

  const handlePullSettingsFromSheets = async () => {
    setPullingFromSheets(true);
    setLogoSaveSuccess(null);
    try {
      const res = await fetch('/api/sheets-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pull-settings' }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSettings((prev) => ({ ...prev, ...data.data }));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('mcu_settings_updated'));
        }
        onSettingsUpdated?.();
        toast.success('ดึงการตั้งค่าโลโก้และข้อมูลจาก Google Sheets สำเร็จ');
        setLogoSaveSuccess('✅ ดึงการตั้งค่าโลโก้และข้อมูลจากแท็บ Settings ใน Google Sheets สำเร็จแล้ว!');
      } else {
        toast.error(data.error || 'ไม่พบแท็บ Settings ใน Google Sheets หรือยังไม่ได้เชื่อมต่อ');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setPullingFromSheets(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-pink-600" />
          <span>ชื่อคณะ หน่วยงาน และตราสัญลักษณ์ (Faculty &amp; Branding Settings)</span>
        </h2>
        <span className="text-[11px] text-pink-700 bg-pink-50 border border-pink-200 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          อัปเดตแบบเรียลไทม์ทันที
        </span>
      </div>

      {logoSaveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{logoSaveSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Live Preview Card */}
        <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-3">
          <div className="relative group">
            <div className="w-32 h-32 rounded-2xl bg-white border-2 border-dashed border-slate-300 shadow-sm flex items-center justify-center p-3 overflow-hidden">
              {logoPreviewUrl || settings.logoUrl ? (
                <img
                  src={logoPreviewUrl || settings.logoUrl}
                  alt="Logo Preview"
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-6xl">{settings.logoEmoji || '☸️'}</span>
              )}
            </div>
            {(logoPreviewUrl || settings.logoUrl) && (
              <button
                type="button"
                onClick={() => {
                  handleClearSelectedLogoFile();
                  setSettings({ ...settings, logoUrl: '' });
                }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 cursor-pointer text-xs"
                title="ลบรูปภาพโลโก้ (ใช้ Emoji แทน)"
              >
                ✕
              </button>
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">ตัวอย่างโลโก้จริง</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {selectedLogoFile ? (
                <span className="text-pink-600 font-bold">เลือกไฟล์แล้ว — กดปุ่มบันทึกเพื่อใช้งาน</span>
              ) : settings.logoUrl ? (
                <span className="text-emerald-700 font-medium">แสดงผลบน Navbar ทั้งหน้าบ้านและหลังบ้านทันที</span>
              ) : (
                'ยังไม่ได้ระบุรูปภาพโลโก้'
              )}
            </div>
          </div>
          {(logoPreviewUrl || settings.logoUrl) && (
            <button
              type="button"
              onClick={() => {
                handleClearSelectedLogoFile();
                setSettings({ ...settings, logoUrl: '' });
              }}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>ล้างรูปภาพ (ใช้ Emoji แทน)</span>
            </button>
          )}
        </div>

        {/* Upload Controls & Inputs */}
        <div className="md:col-span-2 space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-pink-600" />
                <span>อัปโหลดโลโก้ (Upload Image File):</span>
              </label>
              <span className="text-[10px] text-slate-400">ลากวาง หรือ คลิกเลือกไฟล์</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleLogoFileSelect(e.target.files[0]);
                }
              }}
              accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingLogo(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingLogo(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingLogo(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleLogoFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition space-y-2 group ${
                isDraggingLogo
                  ? 'border-pink-500 bg-pink-100/50 scale-[1.01]'
                  : selectedLogoFile
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-pink-300 hover:border-pink-500 bg-pink-50/30 hover:bg-pink-50/60'
              }`}
            >
              <UploadCloud className="w-6 h-6 text-pink-500 mx-auto" />
              <div className="text-xs font-semibold text-slate-700">
                {selectedLogoFile ? selectedLogoFile.name : 'คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากไฟล์มาวางที่นี่'}
              </div>
              <div className="text-[10px] text-slate-400">
                รองรับ PNG, JPG, WEBP, SVG ขนาดไม่เกิน 5MB (แนะนำรูปพื้นหลังโปร่งใส PNG)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                ชื่อคณะ/หน่วยงาน (ภาษาไทย):
              </label>
              <input
                type="text"
                value={settings.facultyNameTh || ''}
                onChange={(e) => setSettings({ ...settings, facultyNameTh: e.target.value })}
                placeholder="เช่น คณะพุทธศาสตร์"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 bg-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                ชื่อคณะ/หน่วยงาน (ภาษาอังกฤษ):
              </label>
              <input
                type="text"
                value={settings.facultyNameEn || ''}
                onChange={(e) => setSettings({ ...settings, facultyNameEn: e.target.value })}
                placeholder="เช่น Faculty of Buddhism"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 bg-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                ชื่อมหาวิทยาลัย (ภาษาไทย):
              </label>
              <input
                type="text"
                value={settings.universityNameTh || ''}
                onChange={(e) => setSettings({ ...settings, universityNameTh: e.target.value })}
                placeholder="เช่น มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 bg-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                ชื่อมหาวิทยาลัย (ภาษาอังกฤษ):
              </label>
              <input
                type="text"
                value={settings.universityNameEn || ''}
                onChange={(e) => setSettings({ ...settings, universityNameEn: e.target.value })}
                placeholder="เช่น Mahachulalongkornrajavidyalaya University"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 bg-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                เบอร์โทรศัพท์ติดต่อ:
              </label>
              <input
                type="text"
                value={settings.contactPhone || ''}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                placeholder="เช่น 035-248-000 ต่อ 8323"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 bg-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                เว็บไซต์หลักของคณะ:
              </label>
              <input
                type="text"
                value={settings.websiteUrl || ''}
                onChange={(e) => setSettings({ ...settings, websiteUrl: e.target.value })}
                placeholder="เช่น https://fb.mcu.ac.th/"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 bg-white font-medium font-mono text-purple-700"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">
                🌐 ลิงก์ระบบบริการการศึกษา / Web App URL:
              </label>
              <input
                type="text"
                value={settings.systemServiceUrl || ''}
                onChange={(e) => setSettings({ ...settings, systemServiceUrl: e.target.value })}
                placeholder="เช่น https://fb-service.mcu.ac.th/ หรือ http://localhost:3020"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 bg-white font-medium font-mono text-purple-700"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950 text-xs flex items-center gap-2">
                <span>🌐</span>
                <span>ช่องทางโซเชียลมีเดีย &amp; Facebook ของคณะ:</span>
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[11px] text-blue-900">
                <input
                  type="checkbox"
                  checked={settings.showSocialLinks !== false}
                  onChange={(e) => setSettings({ ...settings, showSocialLinks: e.target.checked })}
                  className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>เปิดแสดงโซเชียล</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Facebook URL:</label>
                <input
                  type="text"
                  value={settings.facebookUrl || ''}
                  onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                  placeholder="https://www.facebook.com/buddhism.mcu"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">LINE Official Account:</label>
                <input
                  type="text"
                  value={settings.lineOaUrl || ''}
                  onChange={(e) => setSettings({ ...settings, lineOaUrl: e.target.value })}
                  placeholder="https://line.me/ti/p/... หรือ @buddhism.mcu"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              {settings.logoUrl ? (
                <span className="text-emerald-700 font-medium">
                  ✓ โลโก้ที่ใช้งาน: <span className="font-mono text-[10px]">{settings.logoUrl.length > 35 ? `${settings.logoUrl.slice(0, 35)}...` : settings.logoUrl}</span>
                </span>
              ) : (
                <span className="text-slate-400">ยังไม่ได้ระบุรูปภาพโลโก้ (ใช้ Emoji {settings.logoEmoji || '☸️'})</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pullingFromSheets}
                onClick={handlePullSettingsFromSheets}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                title="ดึงโลโก้และค่าที่กรอกไว้ในแท็บ Settings บน Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${pullingFromSheets ? 'animate-spin text-emerald-600' : ''}`} />
                <span>{pullingFromSheets ? 'กำลังดึงข้อมูล...' : '🔄 ดึงค่าจาก Google Sheets'}</span>
              </button>
              <button
                type="button"
                disabled={savingLogo || uploadingLogo}
                onClick={handleSaveLogoOnly}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{savingLogo ? 'กำลังบันทึก...' : '💾 บันทึกการเปลี่ยนแปลง (ชื่อคณะ, โลโก้, มหาวิทยาลัย)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
