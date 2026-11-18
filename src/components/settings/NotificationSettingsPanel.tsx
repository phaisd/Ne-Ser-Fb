'use client';

import React, { useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import type { SystemSettings } from '@/types';
import { toast } from '@/lib/toast';

interface NotificationSettingsPanelProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  onSettingsUpdated?: () => void;
}

export function NotificationSettingsPanel({
  settings,
  setSettings,
  onSettingsUpdated,
}: NotificationSettingsPanelProps) {
  const [testingNotification, setTestingNotification] = useState(false);
  const [notificationTestResult, setNotificationTestResult] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const handleTestNotification = async () => {
    setTestingNotification(true);
    setNotificationTestResult(null);

    if (
      !settings.lineChannelAccessToken?.trim() &&
      !settings.lineNotifyToken?.trim() &&
      !settings.lineWebhookUrl?.trim()
    ) {
      const msg = '⚠️ ยังไม่ได้ระบุ Channel Access Token หรือ LINE Notify Token กรุณากรอกข้อมูลก่อนกดทดสอบ';
      setNotificationTestResult(msg);
      toast.warning(msg);
      setTestingNotification(false);
      return;
    }

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'ทดสอบแจ้งเตือน (Test Alert)',
          certType: 'หนังสือรับรองสถานภาพนิสิต',
          toEmail: settings.contactEmail || 'buddhism@mcu.ac.th',
          lineChannelAccessToken: settings.lineChannelAccessToken,
          lineTargetUserId: settings.lineTargetUserId,
          lineNotifyToken: settings.lineNotifyToken,
          lineWebhookUrl: settings.lineWebhookUrl,
        }),
      });
      const d = await res.json();
      if (d.success) {
        const msg = `✅ ผลการทดสอบ: ${d.result?.message || 'ส่งแจ้งเตือนสำเร็จ'}`;
        setNotificationTestResult(msg);
        toast.success(d.result?.message || 'ส่งข้อความทดสอบสำเร็จ');
      } else {
        const msg = `❌ ข้อผิดพลาด: ${d.error}`;
        setNotificationTestResult(msg);
        toast.error(d.error || 'ส่งข้อความทดสอบไม่สำเร็จ');
      }
    } catch (e: unknown) {
      const msg = `❌ ไม่สามารถเชื่อมต่อ: ${e instanceof Error ? e.message : String(e)}`;
      setNotificationTestResult(msg);
      toast.error(msg);
    } finally {
      setTestingNotification(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const d = await res.json();
      if (d.success) {
        toast.success('บันทึกการตั้งค่าระบบแจ้งเตือนสำเร็จเรียบร้อย');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('mcu_settings_updated'));
        }
        onSettingsUpdated?.();
      } else {
        toast.error(d.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (e: unknown) {
      toast.error('เกิดข้อผิดพลาด: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-4 flex-wrap gap-2">
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
          onClick={handleTestNotification}
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
        {/* LINE Messaging API */}
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
              placeholder="เช่น U8a91bc1234567890abcdef1234567890 (ต้องขึ้นต้นด้วย U)"
              value={settings.lineTargetUserId || ''}
              onChange={(e) => setSettings({ ...settings, lineTargetUserId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            ⚠️ <b>Target User ID</b> ต้องเป็นรหัสเฉพาะขึ้นต้นด้วยตัว <b>U</b> จาก LINE Developers ไม่ใช่ชื่อบัญชี LINE
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
            placeholder="เช่น buddhism@mcu.ac.th"
            value={settings.contactEmail || ''}
            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            ระบบจะส่งอีเมลแจ้งเตือนไปยังนิสิตผู้ยื่นคำร้อง และสำเนาแจ้งเตือนมายังอีเมลคณะเมื่อคำร้องได้รับผลการพิจารณา
          </p>
        </div>

        {/* Force Password Change on First Login Setting */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>บังคับเปลี่ยนรหัสผ่านเมื่อเข้าใช้งานครั้งแรก</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  settings.forcePasswordChangeOnFirstLogin !== false
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-300'
                }`}
              >
                {settings.forcePasswordChangeOnFirstLogin !== false ? 'เปิด (ON)' : 'ปิด (OFF)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              อาจารย์และนิสิตที่เข้าสู่ระบบครั้งแรกด้วยรหัสเริ่มต้น จะต้องตั้งรหัสผ่านใหม่ส่วนตัว
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
          disabled={savingSettings}
          onClick={handleSaveNotificationSettings}
          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
        >
          {savingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าแจ้งเตือน'}
        </button>
      </div>
    </div>
  );
}
