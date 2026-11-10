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
  Mail,
  Lock,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';
import { getAuthUser, isAdminOrOfficer } from '@/lib/auth-client';

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
  lineNotifyToken?: string;
  lineChannelAccessToken?: string;
  lineTargetUserId?: string;
  lineWebhookUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  websiteUrl?: string;
  systemServiceUrl?: string;
  forcePasswordChangeOnFirstLogin?: boolean;
}

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

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
    contactPhone: '035-248-000 ต่อ 8323',
    websiteUrl: 'https://fb.mcu.ac.th/',
    systemServiceUrl: 'https://fb-service.mcu.ac.th/',
    lineNotifyToken: '',
    lineChannelAccessToken: '',
    lineTargetUserId: '',
    lineWebhookUrl: '',
    contactEmail: 'buddhism@mcu.ac.th',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [pullingFromSheets, setPullingFromSheets] = useState(false);
  const [logoSaveSuccess, setLogoSaveSuccess] = useState<string | null>(null);
  const [testingNotification, setTestingNotification] = useState(false);
  const [notificationTestResult, setNotificationTestResult] = useState<string | null>(null);
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
    try {
      const u = getAuthUser();
      setCurrentUser(u);
    } catch {}
    setAuthChecked(true);

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
        setLogoSaveSuccess(`✅ บันทึกชื่อคณะ (${settings.facultyNameTh || 'คณะพุทธศาสตร์'}) และข้อมูลระบบเรียบร้อยแล้ว! Navbar และเอกสารได้รับการอัปเดตทันที`);
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

  const isAdmin = isAdminOrOfficer(currentUser);

  if (!authChecked) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        กำลังตรวจสอบสิทธิ์การเข้าถึง...
      </div>
    );
  }

  // Deny access for normal instructors / students / guests
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200/90 shadow-lg text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-900">
            สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin Only)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            หน้านี้สำหรับการตั้งค่าโลโก้สถาบัน การเชื่อมต่อ Google Sheets API และระบบแจ้งเตือนส่วนกลางของคณะ ซึ่งอนุญาตให้เฉพาะผู้ดูแลระบบและเจ้าหน้าที่เท่านั้น
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/attendance"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับไประบบเช็คชื่ออาจารย์</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <span>หน้าหลัก</span>
          </Link>
        </div>
      </div>
    );
  }

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
            <Building2 className="w-5 h-5 text-pink-600" />
            <span>ชื่อคณะ หน่วยงาน และตราสัญลักษณ์ (Faculty & Branding Settings)</span>
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

            {/* Faculty & University Info (ชื่อคณะและมหาวิทยาลัย - สามารถแก้ไขเปลี่ยนข้อความใหม่ได้โดยตรง) */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <Building2 className="w-4 h-4 text-pink-600" />
                  <span>ข้อมูลชื่อคณะและมหาวิทยาลัย (แก้ไขเปลี่ยนข้อความได้ทันที):</span>
                </div>
                <span className="text-[11px] text-pink-700 bg-pink-50 border border-pink-200 px-2.5 py-0.5 rounded-full font-semibold">
                  แสดงผลบน Navbar, หัวเอกสารคำร้อง, และหน้าล็อกอิน
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชื่อคณะ/หน่วยงาน (ภาษาไทย) <span className="text-pink-600 font-mono">[facultyNameTh]</span>:
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
                    ชื่อคณะ/หน่วยงาน (ภาษาอังกฤษ) <span className="text-slate-400 font-mono">[facultyNameEn]</span>:
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
                    ชื่อมหาวิทยาลัย (ภาษาไทย) <span className="text-slate-400 font-mono">[universityNameTh]</span>:
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
                    ชื่อมหาวิทยาลัย (ภาษาอังกฤษ) <span className="text-slate-400 font-mono">[universityNameEn]</span>:
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
                    เบอร์โทรศัพท์ติดต่อ (แสดงท้ายเอกสาร) <span className="text-slate-400 font-mono">[contactPhone]</span>:
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
                    เว็บไซต์หลักของคณะ <span className="text-purple-600 font-mono">[websiteUrl]</span>:
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
                    🌐 ลิงก์ระบบบริการการศึกษา / Web App URL (แสดงบรรทัดที่ 4 ท้ายเอกสาร) <span className="text-purple-600 font-mono">[systemServiceUrl]</span>:
                  </label>
                  <input
                    type="text"
                    value={settings.systemServiceUrl || ''}
                    onChange={(e) => setSettings({ ...settings, systemServiceUrl: e.target.value })}
                    placeholder="เช่น https://fb-service.mcu.ac.th/ หรือ http://localhost:3020"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 bg-white font-medium font-mono text-purple-700"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    * ลิงก์นี้จะนำไปแสดงเป็นบรรทัดต่อจาก fb.mcu.ac.th ในส่วนท้ายเอกสารรับรองทุกฉบับอัตโนมัติ
                  </p>
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

            {/* Google Sheets Direct Logo Guide */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Table2 className="w-4 h-4 text-emerald-600" />
                  <span>ตารางสรุปคีย์การตั้งค่า (Settings Reference) และการเชื่อมต่อ Google Sheets</span>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  แก้ไขได้ทั้งจากฟอร์มด้านบน และจากแท็บ Settings ใน Google Sheets
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                ท่านสามารถแก้ไขค่าต่างๆ ได้โดยตรงจากฟอร์มด้านบนแล้วกดปุ่มบันทึก หรือกรอกไว้ในแท็บ <strong>Settings</strong> บน Google Spreadsheet ได้เช่นกัน:
              </p>
              <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                    <tr>
                      <th className="p-2 font-mono">คอลัมน์ A (Key)</th>
                      <th className="p-2">คอลัมน์ B (Value ปัจจุบันในระบบ)</th>
                      <th className="p-2">คอลัมน์ C (คำอธิบาย)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 font-mono font-bold text-pink-700">logoUrl</td>
                      <td className="p-2 font-mono text-emerald-800 truncate max-w-xs">
                        {settings.logoUrl || 'https://... หรือ ลิงก์แชร์จาก Google Drive'}
                      </td>
                      <td className="p-2 text-slate-500">
                        URL รูปภาพโลโก้ (รองรับลิงก์ Google Drive โดยแปลงให้อัตโนมัติ)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-slate-700">logoEmoji</td>
                      <td className="p-2 text-base">{settings.logoEmoji || '☸️'}</td>
                      <td className="p-2 text-slate-500">Emoji สัญลักษณ์สำรอง</td>
                    </tr>
                    <tr className="bg-pink-50/50">
                      <td className="p-2 font-mono font-bold text-pink-700">facultyNameTh</td>
                      <td className="p-2 font-bold text-slate-900">{settings.facultyNameTh || 'คณะพุทธศาสตร์'}</td>
                      <td className="p-2 text-slate-600 font-medium">ชื่อคณะ (แสดงบน Navbar, หน้าล็อกอิน และเอกสาร)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-slate-700">facultyNameEn</td>
                      <td className="p-2 font-medium text-slate-800">{settings.facultyNameEn || 'Faculty of Buddhism'}</td>
                      <td className="p-2 text-slate-500">ชื่อคณะ ภาษาอังกฤษ (สำหรับเอกสารภาคนานาชาติ)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-slate-700">universityNameTh</td>
                      <td className="p-2 text-slate-700">{settings.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}</td>
                      <td className="p-2 text-slate-500">ชื่อมหาวิทยาลัย ภาษาไทย</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-slate-700">universityNameEn</td>
                      <td className="p-2 text-slate-700">{settings.universityNameEn || 'Mahachulalongkornrajavidyalaya University'}</td>
                      <td className="p-2 text-slate-500">ชื่อมหาวิทยาลัย ภาษาอังกฤษ</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-slate-700">contactPhone</td>
                      <td className="p-2 text-slate-700">{settings.contactPhone || '035-248-000 ต่อ 8323'}</td>
                      <td className="p-2 text-slate-500">เบอร์โทรศัพท์ติดต่อ (แสดงในเอกสารราชการ)</td>
                    </tr>
                    <tr className="bg-purple-50/50">
                      <td className="p-2 font-mono font-bold text-purple-700">websiteUrl</td>
                      <td className="p-2 font-medium font-mono text-purple-800">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</td>
                      <td className="p-2 text-slate-600 font-medium">เว็บไซต์หลักของคณะ (แสดงท้ายเอกสารบรรทัดที่ 3)</td>
                    </tr>
                    <tr className="bg-purple-50/50">
                      <td className="p-2 font-mono font-bold text-purple-700">systemServiceUrl</td>
                      <td className="p-2 font-medium font-mono text-purple-800">{settings.systemServiceUrl || 'https://fb-service.mcu.ac.th/'}</td>
                      <td className="p-2 text-slate-600 font-medium">ลิงก์ระบบบริการการศึกษานี้ (แสดงท้ายเอกสารบรรทัดที่ 4 ต่อจาก fb.mcu.ac.th)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION: AUTOMATED NOTIFICATIONS (EMAIL / LINE NOTIFY)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                ระบบแจ้งเตือนผลคำร้องผ่าน Email / LINE Notify (Automated Notification)
              </h2>
              <p className="text-xs text-slate-500">
                แจ้งเตือนอัตโนมัติเมื่อมีคำร้องใหม่ หรือเมื่อเจ้าหน้าที่กดอนุมัติ/ปฏิเสธคำร้อง
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={testingNotification}
            onClick={async () => {
              setTestingNotification(true);
              setNotificationTestResult(null);
              try {
                const res = await fetch('/api/notifications', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    studentName: 'ทดสอบแจ้งเตือน (Test Alert)',
                    certType: 'หนังสือรับรองสถานภาพนิสิต',
                    toEmail: settings.contactEmail || 'buddhism@mcu.ac.th',
                  }),
                });
                const d = await res.json();
                if (d.success) {
                  setNotificationTestResult(`✅ ผลการทดสอบ: ${d.result?.message || 'ส่งแจ้งเตือนสำเร็จ'}`);
                } else {
                  setNotificationTestResult(`❌ ข้อผิดพลาด: ${d.error}`);
                }
              } catch (e: any) {
                setNotificationTestResult(`❌ ไม่สามารถเชื่อมต่อ: ${e.message}`);
              } finally {
                setTestingNotification(false);
              }
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingNotification ? 'animate-spin' : ''}`} />
            <span>ทดสอบส่งการแจ้งเตือน</span>
          </button>
        </div>

        {notificationTestResult && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs font-semibold">
            {notificationTestResult}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* LINE Messaging API (LINE Official Account / Bot) */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
            <label className="font-bold text-emerald-950 flex items-center justify-between">
              <span>LINE OA / Messaging API (แนะนำที่สุด):</span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                LINE Bot Push
              </span>
            </label>
            <div>
              <span className="text-[11px] font-semibold text-slate-700 block mb-1">Channel Access Token:</span>
              <input
                type="password"
                placeholder="ใส่ Channel Access Token (เช่น eyJhbGciOiJIUzI1Ni...)"
                value={settings.lineChannelAccessToken || ''}
                onChange={(e) => setSettings({ ...settings, lineChannelAccessToken: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-700 block mb-1">Target User ID หรือ Group ID:</span>
              <input
                type="text"
                placeholder="เช่น U8a91bc... หรือ C821948..."
                value={settings.lineTargetUserId || ''}
                onChange={(e) => setSettings({ ...settings, lineTargetUserId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              นำ Token และ User/Group ID จาก LINE Developers เพื่อให้บอทส่งข้อความแจ้งเตือนคำร้องเข้า LINE ส่วนตัวหรือกลุ่มเจ้าหน้าที่
            </p>
          </div>

          {/* LINE Notify Token & Webhook */}
          <div className="space-y-4">
            <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-200 space-y-2">
              <label className="font-bold text-sky-950 flex items-center justify-between">
                <span>LINE Notify Access Token (ทางเลือกเดิม):</span>
                <span className="text-[10px] text-sky-700 font-semibold bg-sky-100 px-2 py-0.5 rounded-full">
                  LINE Notify
                </span>
              </label>
              <input
                type="password"
                placeholder="ใส่ LINE Notify Token (เช่น ykX8...)"
                value={settings.lineNotifyToken || ''}
                onChange={(e) => setSettings({ ...settings, lineNotifyToken: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                นำ Token จาก <code>notify-bot.line.me</code> มาใส่
              </p>
            </div>

            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-2">
              <label className="font-bold text-purple-950 flex items-center justify-between">
                <span>LINE / Custom Webhook URL:</span>
                <span className="text-[10px] text-purple-700 font-semibold bg-purple-100 px-2 py-0.5 rounded-full">
                  Webhook
                </span>
              </label>
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={settings.lineWebhookUrl || ''}
                onChange={(e) => setSettings({ ...settings, lineWebhookUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                รองรับ Google Apps Script Webhook, Make หรือ Discord เพื่อส่งต่อเข้ากลุ่มไลน์
              </p>
            </div>
          </div>

          {/* Email Notification */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
            <label className="font-bold text-blue-950 flex items-center justify-between">
              <span>อีเมลส่วนกลางคณะ (สำหรับรับแจ้งเตือน):</span>
              <span className="text-[10px] text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded-full">
                Email Alert
              </span>
            </label>
            <input
              type="email"
              placeholder="เช่น buddhism@mcu.ac.th หรือ phaisal.dis@mcu.ac.th"
              value={settings.contactEmail || ''}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              ระบบจะส่งอีเมลแจ้งเตือนไปยังนิสิตผู้ยื่นคำร้อง และสำเนาแจ้งเตือนมายังอีเมลคณะเมื่อคำร้องได้รับผลการพิจารณา
            </p>
          </div>

          {/* Force Password Change on First Login Setting */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between gap-4 mt-2">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>บังคับเปลี่ยนรหัสผ่านเมื่อเข้าใช้งานครั้งแรก (First-Time Login Password Change)</span>
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

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={savingLogo}
            onClick={async () => {
              setSavingLogo(true);
              try {
                const res = await fetch('/api/system-settings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(settings),
                });
                const d = await res.json();
                if (d.success) {
                  alert('บันทึกการตั้งค่าระบบแจ้งเตือนสำเร็จเรียบร้อย');
                }
              } catch (e: any) {
                alert('เกิดข้อผิดพลาด: ' + e.message);
              } finally {
                setSavingLogo(false);
              }
            }}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            {savingLogo ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าแจ้งเตือน'}
          </button>
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
