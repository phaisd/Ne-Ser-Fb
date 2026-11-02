'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Table2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UploadCloud,
  Copy,
  ExternalLink,
  Key,
  ShieldCheck,
  HelpCircle,
  Calendar,
  FileText,
  Globe,
  Camera,
  Trash2,
  Check,
  Sparkles,
  Building2,
  Image as ImageIcon
} from 'lucide-react';

interface SheetStatus {
  configured: boolean;
  connected?: boolean;
  spreadsheetTitle?: string;
  sheets?: string[];
  error?: string;
  envStatus?: {
    GOOGLE_SHEET_ID: boolean;
    GOOGLE_SERVICE_ACCOUNT_EMAIL: boolean;
    GOOGLE_PRIVATE_KEY: boolean;
  };
}

interface SystemSettings {
  universityNameTh: string;
  universityNameEn: string;
  facultyNameTh: string;
  facultyNameEn: string;
  logoUrl: string;
  logoEmoji?: string;
  announcementText?: string;
}

export default function SettingsPage() {
  // Google Sheets state
  const [status, setStatus] = useState<SheetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Logo & System Settings state
  const [settings, setSettings] = useState<SystemSettings>({
    universityNameTh: 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
    universityNameEn: 'Mahachulalongkornrajavidyalaya University',
    facultyNameTh: 'คณะพุทธศาสตร์',
    facultyNameEn: 'Faculty of Buddhism',
    logoUrl: '/uploads/logo-1793607295012.png',
    logoEmoji: '☸️',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [pullingFromSheets, setPullingFromSheets] = useState(false);
  const [logoSaveSuccess, setLogoSaveSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setLogoSaveSuccess('✅ ดึงการตั้งค่าโลโก้และข้อมูลจากแท็บ Settings ใน Google Sheets สำเร็จแล้ว!');
      } else {
        alert(data.error || 'ไม่พบแท็บ Settings ใน Google Sheets หรือยังไม่ได้เชื่อมต่อ');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setPullingFromSheets(false);
    }
  };

  const checkStatus = () => {
    setLoading(true);
    fetch('/api/sheets-sync')
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch((err) => setStatus({ configured: false, error: err.message }))
      .finally(() => setLoading(false));
  };

  const loadSettings = () => {
    fetch('/api/system-settings')
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.data) {
          setSettings((prev) => ({ ...prev, ...d.data }));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    checkStatus();
    loadSettings();
  }, []);

  // Handle Logo Upload with Auto-Save
  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    setUploadingLogo(true);
    setLogoSaveSuccess(null);
    try {
      let finalUrl = '';

      // Step 1: Upload via FormData
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.url) {
          finalUrl = data.url;
        }
      } catch (e) {
        console.warn('Direct upload failed, trying Base64 fallback', e);
      }

      // Step 2: Fallback to Base64
      if (!finalUrl) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || '');
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        if (base64) {
          try {
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dataUrl: base64 }),
            });
            const data = await res.json();
            finalUrl = data.success && data.url ? data.url : base64;
          } catch {
            finalUrl = base64;
          }
        }
      }

      if (finalUrl) {
        const newSettings = { ...settings, logoUrl: finalUrl };
        setSettings(newSettings);

        // Immediate Auto-Save to /api/system-settings
        const saveRes = await fetch('/api/system-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });
        const saveData = await saveRes.json();

        if (saveData.success) {
          if (saveData.data?.logoUrl) {
            setSettings((prev) => ({ ...prev, logoUrl: saveData.data.logoUrl }));
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('mcu_settings_updated'));
          }
          setLogoSaveSuccess('✅ อัปโหลดและอัปเดตโลโก้ใน Navbar (Portal & Admin) สำเร็จเรียบร้อยแล้ว!');
        } else {
          setLogoSaveSuccess('อัปโหลดไฟล์แล้ว กรุณากดปุ่มบันทึกเพื่อยืนยัน');
        }
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Quick Save Logo & Branding
  const handleSaveLogoOnly = async () => {
    setSavingLogo(true);
    setLogoSaveSuccess(null);
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
        setLogoSaveSuccess('✅ บันทึกและอัปเดตโลโก้ใน Navbar ทั้งหมดเรียบร้อยแล้ว!');
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingLogo(false);
    }
  };

  const handleInitialSync = async () => {
    if (!confirm('ยืนยันการส่งออกข้อมูลทั้งหมด (นิสิต 275 รูป/คน, 110 รายวิชา, ตารางสอน) ไปยัง Google Sheets?')) {
      return;
    }

    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/sheets-sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncResult(`✅ ${data.message} (แท็บที่ซิงค์: ${data.syncedTabs.join(', ')})`);
        checkStatus();
      } else {
        alert('เกิดข้อผิดพลาดในการซิงค์: ' + data.error);
      }
    } catch (err: any) {
      alert('ซิงค์ล้มเหลว: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <Globe className="w-8 h-8 text-pink-600" />
          การตั้งค่าระบบ &amp; โลโก้สถาบัน (System Settings)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          ปรับแต่งรูปภาพโลโก้ที่แสดงบนแถบเมนูนำทาง (Navbar) ทั้งหน้าบ้าน (Portal) และหลังบ้าน (Admin Console) พร้อมการเชื่อมต่อ Google Sheets
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: LOGO & NAVBAR BRANDING
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-pink-600" />
            <span>โลโก้และตราสัญลักษณ์บน Navbar (Portal &amp; Admin)</span>
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
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
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
              {settings.logoUrl && (
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, logoUrl: '' })}
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
                แสดงผลบน Navbar ทั้งหน้าบ้านและหลังบ้านทันที
              </div>
            </div>
            {settings.logoUrl && (
              <button
                type="button"
                onClick={() => setSettings({ ...settings, logoUrl: '' })}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>ล้างรูปภาพ (ใช้ Emoji แทน)</span>
              </button>
            )}
          </div>

          {/* Upload Controls & Inputs */}
          <div className="md:col-span-2 space-y-4 text-xs">
            {/* File Upload Box */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-pink-600" />
                <span>อัปโหลดรูปภาพโลโก้ใหม่ (Upload Image File):</span>
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleLogoUpload(e.target.files[0]);
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
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleLogoUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
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
                    {uploadingLogo ? 'กำลังอัปโหลดและบันทึก...' : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์รูปภาพมาวางที่นี่'}
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
                value={settings.logoUrl}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                placeholder="https://www.mcu.ac.th/images/logo-mcu.png หรือ /uploads/logo-...png"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 bg-slate-50/50"
              />
            </div>

            {/* Emoji & Presets */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
              <div className="w-full sm:w-auto">
                <label className="font-bold text-slate-700 block mb-1">Emoji สำรอง:</label>
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
                  <span>{savingLogo ? 'กำลังบันทึก...' : '💾 บันทึกและอัปเดต Navbar ทันที'}</span>
                </button>
              </div>
            </div>

            {/* Google Sheets Direct Logo Guide */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Table2 className="w-4 h-4 text-emerald-600" />
                <span>คำแนะนำ: วิธีใส่หรือเปลี่ยนโลโก้ใน Google Sheets โดยตรง</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                สร้างหรือเปิดแท็บชื่อ <strong>Settings</strong> ใน Google Spreadsheet แล้วกรอกข้อมูลในแถวดังนี้:
              </p>
              <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                    <tr>
                      <th className="p-2 font-mono">คอลัมน์ A (Key)</th>
                      <th className="p-2">คอลัมน์ B (Value)</th>
                      <th className="p-2">คอลัมน์ C (คำอธิบาย)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 font-mono font-bold text-pink-700">logoUrl</td>
                      <td className="p-2 font-mono text-emerald-800">
                        https://... หรือ ลิงก์แชร์จาก Google Drive
                      </td>
                      <td className="p-2 text-slate-500">
                        URL รูปภาพโลโก้ (รองรับลิงก์ Google Drive โดยแปลงให้อัตโนมัติ)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-slate-700">logoEmoji</td>
                      <td className="p-2 text-base">☸️</td>
                      <td className="p-2 text-slate-500">Emoji สัญลักษณ์สำรอง</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-slate-700">facultyNameTh</td>
                      <td className="p-2">คณะพุทธศาสตร์</td>
                      <td className="p-2 text-slate-500">ชื่อคณะ (แสดงบน Navbar และเอกสาร)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: GOOGLE SHEETS API STATUS & SYNC
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            สถานะการเชื่อมต่อ Google Sheets API
          </h2>
          <button
            onClick={checkStatus}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            ตรวจสอบอีกครั้ง
          </button>
        </div>

        {loading ? (
          <div className="text-center py-6 text-slate-400 text-sm">กำลังตรวจสอบการเชื่อมต่อ...</div>
        ) : status?.connected ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">เชื่อมต่อกับ Google Sheets สำเร็จเรียบร้อย</div>
                <div className="text-xs text-emerald-700 mt-0.5">
                  ชื่อ Spreadsheet: <span className="font-semibold">{status.spreadsheetTitle}</span>
                </div>
              </div>
            </div>

            {/* Sheets list */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                แท็บข้อมูลที่ตรวจพบ ({status.sheets?.length || 0} แท็บ):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {status.sheets?.map((name) => (
                  <div
                    key={name}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-700 flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="truncate">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sync Initial Data Button */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    ซิงค์ข้อมูลตั้งต้น (Initial Sync)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ส่งออกข้อมูลทะเบียนนิสิต (275), รายวิชา (110) และอาจารย์ผู้สอน ขึ้นสู่ Google Sheets
                  </div>
                </div>
                <button
                  onClick={handleInitialSync}
                  disabled={syncing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <UploadCloud className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'กำลังส่งออกข้อมูล...' : 'ซิงค์ข้อมูล (Initial Sync)'}</span>
                </button>
              </div>

              {syncResult && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                  {syncResult}
                </div>
              )}
            </div>
          </div>
        ) : status?.configured ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">กำหนดค่าตัวแปรแล้ว แต่ไม่สามารถเชื่อมต่อได้</div>
              <div className="text-xs text-amber-800 mt-1">{status.error}</div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">ยังไม่ได้ตั้งค่า Google Sheets API</div>
              <div className="text-xs text-slate-500 mt-1">
                ระบบกำลังทำงานด้วยฐานข้อมูล Local CSV และ JSON ในเครื่อง
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Setup Guide Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
          <Key className="w-5 h-5 text-orange-600" />
          ขั้นตอนการตั้งค่า Google Sheets API สำหรับเชื่อมต่อ
        </h2>

        <div className="space-y-4 text-xs">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-slate-900">สร้าง Google Sheet และแท็บข้อมูลที่ต้องการ</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                สร้าง Google Spreadsheet ขึ้นใหม่ และสร้างแท็บ (Worksheets) ตามชื่อมาตรฐานดังนี้:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Students', 'Courses', 'Instructors', 'Timetables', 'Attendance', 'Certificates'].map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-slate-700 font-bold"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-slate-900">สร้าง Service Account ใน Google Cloud Console</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                เข้าไปที่ Google Cloud Console &rarr; เปิดใช้งาน <strong>Google Sheets API</strong> &rarr; สร้าง Service Account &rarr; สร้าง Key แบบ JSON ดาวน์โหลดเก็บไว้
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-slate-900">แชร์สิทธิ์เข้าถึง Spreadsheet ให้ Service Account</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                กดปุ่ม <strong>Share (แชร์)</strong> ใน Google Sheet ที่สร้างในข้อ 1 แล้วใส่อีเมลของ Service Account (เช่น <code>xxx@xxx.iam.gserviceaccount.com</code>) ให้สิทธิ์เป็น <strong>Editor</strong>
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0">
              4
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-slate-900">ใส่ค่าในไฟล์ .env.local ของโปรเจกต์</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                เปิดไฟล์ <code>F:\FB-service-sheets\.env.local</code> แล้วระบุค่า:
              </p>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`GOOGLE_SHEET_ID="รหัส_SHEET_ID_ดูจาก_URL"
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@xxx.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
