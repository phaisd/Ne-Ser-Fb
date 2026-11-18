'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  UploadCloud,
  AlertTriangle,
  HelpCircle,
  Key,
} from 'lucide-react';
import { toast } from '@/lib/toast';

export interface SheetStatus {
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

interface GoogleSheetsSettingsPanelProps {
  status: SheetStatus | null;
  loading: boolean;
  onRefreshStatus: () => void;
}

export function GoogleSheetsSettingsPanel({
  status,
  loading,
  onRefreshStatus,
}: GoogleSheetsSettingsPanelProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [showConfirmSync, setShowConfirmSync] = useState(false);

  const handleInitialSync = async () => {
    setShowConfirmSync(false);
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/sheets-sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const msg = `✅ ${data.message} (แท็บที่ซิงค์: ${data.syncedTabs.join(', ')})`;
        setSyncResult(msg);
        toast.success('ซิงค์ข้อมูลไปยัง Google Sheets สำเร็จ');
        onRefreshStatus();
      } else {
        toast.error('เกิดข้อผิดพลาดในการซิงค์: ' + data.error);
      }
    } catch (err: unknown) {
      toast.error('ซิงค์ล้มเหลว: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Sheets API Status & Sync */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-4 flex-wrap gap-2">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            สถานะการเชื่อมต่อ Google Sheets API
          </h2>
          <button
            onClick={onRefreshStatus}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
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
                  onClick={() => setShowConfirmSync(true)}
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

      {/* Confirmation Dialog for Initial Sync */}
      {showConfirmSync && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-extrabold text-slate-900">
                ยืนยันการส่งออกข้อมูล (Initial Sync)?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                ระบบจะส่งออกข้อมูลทะเบียนนิสิต 275 รูป/คน, รายวิชา 110 วิชา, และตารางสอน ไปยัง Google Sheets
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSync(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleInitialSync}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
              >
                ยืนยันการส่งออก
              </button>
            </div>
          </div>
        </div>
      )}

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
                กดปุ่ม <strong>Share (แชร์)</strong> ใน Google Sheet ที่สร้างในข้อ 1 แล้วใส่อีเมลของ Service Account ให้สิทธิ์เป็น <strong>Editor</strong>
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
