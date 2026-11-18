'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Globe, Lock, ArrowLeft } from 'lucide-react';
import { getAuthUser, isAdminOrOfficer, type AuthUser } from '@/lib/auth-client';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import {
  GeneralIdentitySettingsPanel,
  NotificationSettingsPanel,
  GoogleSheetsSettingsPanel,
  SheetStatus,
} from '@/components/settings';

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [status, setStatus] = useState<SheetStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const { settings, setSettings, loadSettings } = useSystemSettings();

  const checkStatus = () => {
    setLoadingStatus(true);
    fetch('/api/sheets-sync')
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch((err) =>
        setStatus({
          configured: false,
          error: err instanceof Error ? err.message : String(err),
        })
      )
      .finally(() => setLoadingStatus(false));
  };

  useEffect(() => {
    try {
      const u = getAuthUser();
      setCurrentUser(u);
    } catch {}
    setAuthChecked(true);

    checkStatus();
  }, []);

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

      {/* Panel 1: Identity & Branding Settings */}
      <GeneralIdentitySettingsPanel
        settings={settings}
        setSettings={setSettings}
        onSettingsUpdated={loadSettings}
      />

      {/* Panel 2: Automated Notification Settings */}
      <NotificationSettingsPanel
        settings={settings}
        setSettings={setSettings}
        onSettingsUpdated={loadSettings}
      />

      {/* Panel 3: Google Sheets API Connection & Setup Guide */}
      <GoogleSheetsSettingsPanel
        status={status}
        loading={loadingStatus}
        onRefreshStatus={checkStatus}
      />
    </div>
  );
}
