'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  Bell,
  Send,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  HelpCircle,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { SystemSettings } from '@/types';

interface BrandSecuritySectionProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export function BrandSecuritySection({
  settings,
  setSettings,
}: BrandSecuritySectionProps) {
  const [testingNotification, setTestingNotification] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const handleTestNotification = async () => {
    setTestingNotification(true);
    setTestResult(null);
    setTestSuccess(null);

    if (
      !settings.lineChannelAccessToken?.trim() &&
      !settings.lineNotifyToken?.trim() &&
      !settings.lineWebhookUrl?.trim()
    ) {
      setTestSuccess(false);
      setTestResult('⚠️ ยังไม่ได้ระบุ Channel Access Token หรือ LINE Notify Token กรุณากรอกข้อมูลและกดบันทึกการตั้งค่าก่อนทดสอบ');
      setTestingNotification(false);
      return;
    }

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'พระมหาทดสอบ ญาณวโร',
          studentCode: '6501501001',
          programLanguage: 'หลักสูตรภาษาไทย (Thai Program)',
          degreeLevel: 'ปริญญาตรี',
          major: 'สาขาวิชาพระพุทธศาสนา',
          certType: 'หนังสือรับรองสถานภาพนิสิต',
          requestPurpose: 'เพื่อเปิดบัญชีธนาคารและ Mobile Banking',
          phone: '081-234-5678',
          lineChannelAccessToken: settings.lineChannelAccessToken,
          lineTargetUserId: settings.lineTargetUserId,
          lineNotifyToken: settings.lineNotifyToken,
          lineWebhookUrl: settings.lineWebhookUrl,
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setTestSuccess(data.result.lineSuccess);
        setTestResult(data.result.message || 'ส่งข้อความทดสอบสำเร็จ');
      } else {
        setTestSuccess(false);
        setTestResult(data.error || 'การส่งทดสอบล้มเหลว');
      }
    } catch (err: unknown) {
      setTestSuccess(false);
      setTestResult((err instanceof Error ? err.message : String(err)) || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setTestingNotification(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Real-Time LINE Notification for Admin */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
                <Bell className="w-4 h-4" />
              </span>
              ระบบแจ้งเตือน LINE อัตโนมัติเมื่อมีผู้ยื่นคำร้อง (LINE Real-Time Notifications)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ส่งแจ้งเตือนเข้า LINE เจ้าหน้าที่/กลุ่มไลน์ทันทีที่นิสิตยื่นคำร้อง พร้อมระบุรหัสนิสิต, หลักสูตรภาษา, เรื่องที่ขอ และลิงก์อนุมัติ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>{showGuide ? 'ซ่อนคำแนะนำ' : 'วิธีตั้งค่ารับแจ้งเตือน'}</span>
            </button>

            <button
              type="button"
              onClick={handleTestNotification}
              disabled={testingNotification}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingNotification ? 'กำลังทดสอบ...' : 'ทดสอบส่งเข้า LINE'}</span>
            </button>
          </div>
        </div>

        {/* Test Result Banner */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center justify-between animate-in fade-in ${
              testSuccess
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              <span>{testSuccess ? '✅' : '⚠️'}</span>
              <span>{testResult}</span>
            </div>
            <button
              type="button"
              onClick={() => setTestResult(null)}
              className="text-slate-400 hover:text-slate-600 text-xs px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Step-by-Step Guide Accordion */}
        {showGuide && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3 leading-relaxed text-slate-700">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              คำแนะนำวิธีการตั้งค่ารับแจ้งเตือนเข้า LINE สำหรับเจ้าหน้าที่:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <span className="font-bold text-emerald-700 block">แนวทางที่ 1: LINE Bot / OA (แนะนำ)</span>
                <p className="text-[11px] text-slate-600">
                  1. ไปที่ <a href="https://developers.line.biz" target="_blank" rel="noreferrer" className="text-emerald-600 underline">LINE Developers</a> สร้าง Messaging API Channel
                </p>
                <p className="text-[11px] text-slate-600">
                  2. คัดลอก <b>Channel Access Token</b> มาใส่ในช่องด้านล่าง
                </p>
                <p className="text-[11px] text-slate-600">
                  3. ใส่ <b>Your User ID</b> (ดูในหน้า Basic Settings) หรือใส่ Group ID ของกลุ่มไลน์
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <span className="font-bold text-sky-700 block">แนวทางที่ 2: LINE Notify Token</span>
                <p className="text-[11px] text-slate-600">
                  1. ไปที่ <a href="https://notify-bot.line.me" target="_blank" rel="noreferrer" className="text-sky-600 underline">notify-bot.line.me</a>
                </p>
                <p className="text-[11px] text-slate-600">
                  2. เข้าสู่ระบบแล้วกด <b>Generate token</b> เลือกกลุ่มที่ต้องการให้ส่ง
                </p>
                <p className="text-[11px] text-slate-600">
                  3. คัดลอก Token มาใส่ในช่อง LINE Notify Token ด้านล่าง
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <span className="font-bold text-purple-700 block">แนวทางที่ 3: Webhook (Apps Script/Discord)</span>
                <p className="text-[11px] text-slate-600">
                  1. ใช้งาน Google Apps Script Web App หรือ Make.com หรือ Discord Webhook
                </p>
                <p className="text-[11px] text-slate-600">
                  2. นำ URL Webhook มาวางในช่อง Webhook URL
                </p>
                <p className="text-[11px] text-slate-600">
                  3. ระบบจะส่งข้อมูลคำร้องเป็น JSON และ Text เข้า Webhook โดยตรง
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LINE Configuration Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Method 1: LINE Messaging API */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                LINE Official Account / Messaging API (แนะนำ)
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                LINE Bot
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Channel Access Token (Long-lived):
              </label>
              <input
                type="password"
                placeholder="เช่น eyJhbGciOiJIUzI1Ni..."
                value={settings.lineChannelAccessToken || ''}
                onChange={(e) =>
                  setSettings({ ...settings, lineChannelAccessToken: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="text-[10px] text-slate-500">
                รับจาก <a href="https://developers.line.biz" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">LINE Developers</a> &gt; Channel ของท่าน &gt; แท็บ Messaging API &gt; Channel access token (long-lived)
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Target User ID หรือ Group ID (ผู้รับแจ้งเตือน):
              </label>
              <input
                type="text"
                placeholder="เช่น U8a91bc1234567890abcdef1234567890 (ต้องขึ้นต้นด้วย U)"
                value={settings.lineTargetUserId || ''}
                onChange={(e) =>
                  setSettings({ ...settings, lineTargetUserId: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <div className="p-2 bg-emerald-100/60 rounded-lg text-[10px] text-emerald-900 leading-relaxed space-y-1">
                <div>
                  <span className="font-bold">⚠️ สำคัญ:</span> ต้องเป็นรหัสเฉพาะขึ้นต้นด้วยตัว <b>U</b> (เช่น <code>U8a9...</code> ความยาว 33 ตัวอักษร) <u>ไม่ใช่</u>ชื่อแสดงใน LINE (phais01Vis)
                </div>
                <div>
                  <span className="font-bold">💡 วิธีดูรหัส User ID ง่ายที่สุด:</span> นำ Webhook URL ด้านล่างไปใส่ที่ LINE Developers &gt; Messaging API &gt; Webhook URL แล้วทักแชทหาบอท บอทจะส่งรหัส <code>U...</code> ให้ทันที!
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <code className="bg-white/80 px-2 py-0.5 rounded border border-emerald-300 text-[10px] select-all font-mono">
                    https://ne-ser-fb.vercel.app/api/line-webhook
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Method 2 & 3: LINE Notify Token & Webhook */}
          <div className="space-y-3">
            {/* LINE Notify Token */}
            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-950">LINE Notify Access Token:</span>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                  Notify
                </span>
              </div>
              <input
                type="password"
                placeholder="เช่น ykX8f90248..."
                value={settings.lineNotifyToken || ''}
                onChange={(e) =>
                  setSettings({ ...settings, lineNotifyToken: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            {/* Custom Webhook URL */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-950">Webhook URL (Apps Script / Discord):</span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  Webhook
                </span>
              </div>
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec หรือ Discord Webhook"
                value={settings.lineWebhookUrl || ''}
                onChange={(e) =>
                  setSettings({ ...settings, lineWebhookUrl: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 7. Certificate Notice Banners */}
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

      {/* 8. Candidate Admission Period Schedule */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              กำหนดช่วงเวลาเปิดรับคำร้อง ผู้ผ่านการคัดเลือกเข้าศึกษาใหม่ (Admission Period Schedule)
            </h3>
            <p className="text-xs text-slate-500">
              กำหนดเดือนที่เปิดรับสมัคร เพื่อให้ระบบเปิด-ปิดการยื่นขอหนังสือรับรองสำหรับผู้ผ่านการคัดเลือกใหม่อัตโนมัติ
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-800 text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
            <input
              type="checkbox"
              checked={settings.admissionPeriodOpen !== false}
              onChange={(e) =>
                setSettings({ ...settings, admissionPeriodOpen: e.target.checked })
              }
              className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span>เปิดรับคำร้องผู้ผ่านการคัดเลือก</span>
          </label>
        </div>

        <div className="space-y-4 text-xs">
          {/* Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                (settings.admissionMode || 'AUTO_MONTHS') === 'AUTO_MONTHS'
                  ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="admissionMode"
                value="AUTO_MONTHS"
                checked={(settings.admissionMode || 'AUTO_MONTHS') === 'AUTO_MONTHS'}
                onChange={() => setSettings({ ...settings, admissionMode: 'AUTO_MONTHS' })}
                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="space-y-0.5">
                <div className="font-bold text-slate-800">เปิดอัตโนมัติตามช่วงเดือนที่กำหนด (แนะนำ)</div>
                <div className="text-[11px] text-slate-500">
                  ระบบจะเปิดให้ยื่นเฉพาะในเดือนที่เลือก และปิดอัตโนมัติเมื่อพ้นช่วงเดือน
                </div>
              </div>
            </label>

            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                settings.admissionMode === 'MANUAL'
                  ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="admissionMode"
                value="MANUAL"
                checked={settings.admissionMode === 'MANUAL'}
                onChange={() => setSettings({ ...settings, admissionMode: 'MANUAL' })}
                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="space-y-0.5">
                <div className="font-bold text-slate-800">เปิดตลอดเวลา (ตามสวิตช์เปิด/ปิดด้านบน)</div>
                <div className="text-[11px] text-slate-500">
                  เปิดให้ยื่นได้ตลอดทั้งปีตามการควบคุมของ Admin
                </div>
              </div>
            </label>
          </div>

          {/* Month Range Pickers (if AUTO_MONTHS) */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-3">
            <div className="font-bold text-emerald-950 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              กำหนดช่วงเดือนที่เปิดรับสมัคร (Start & End Months)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  เดือนเริ่มต้นเปิดรับสมัคร:
                </label>
                <select
                  value={settings.admissionStartMonth ?? 3}
                  onChange={(e) =>
                    setSettings({ ...settings, admissionStartMonth: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value={1}>1. มกราคม (January)</option>
                  <option value={2}>2. กุมภาพันธ์ (February)</option>
                  <option value={3}>3. มีนาคม (March)</option>
                  <option value={4}>4. เมษายน (April)</option>
                  <option value={5}>5. พฤษภาคม (May)</option>
                  <option value={6}>6. มิถุนายน (June)</option>
                  <option value={7}>7. กรกฎาคม (July)</option>
                  <option value={8}>8. สิงหาคม (August)</option>
                  <option value={9}>9. กันยายน (September)</option>
                  <option value={10}>10. ตุลาคม (October)</option>
                  <option value={11}>11. พฤศจิกายน (November)</option>
                  <option value={12}>12. ธันวาคม (December)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  เดือนสิ้นสุดการเปิดรับสมัคร:
                </label>
                <select
                  value={settings.admissionEndMonth ?? 7}
                  onChange={(e) =>
                    setSettings({ ...settings, admissionEndMonth: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value={1}>1. มกราคม (January)</option>
                  <option value={2}>2. กุมภาพันธ์ (February)</option>
                  <option value={3}>3. มีนาคม (March)</option>
                  <option value={4}>4. เมษายน (April)</option>
                  <option value={5}>5. พฤษภาคม (May)</option>
                  <option value={6}>6. มิถุนายน (June)</option>
                  <option value={7}>7. กรกฎาคม (July)</option>
                  <option value={8}>8. สิงหาคม (August)</option>
                  <option value={9}>9. กันยายน (September)</option>
                  <option value={10}>10. ตุลาคม (October)</option>
                  <option value={11}>11. พฤศจิกายน (November)</option>
                  <option value={12}>12. ธันวาคม (December)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  ข้อความระบุช่วงเวลา (แสดงให้นิสิตเห็น):
                </label>
                <input
                  type="text"
                  placeholder="เช่น 1 มีนาคม 2569 - 31 กรกฎาคม 2569"
                  value={settings.admissionPeriodDates || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, admissionPeriodDates: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  ข้อความหัวข้อประกาศ:
                </label>
                <input
                  type="text"
                  placeholder="เช่น เปิดรับคำร้องหนังสือรับรองสำหรับผู้ผ่านการคัดเลือกเข้าศึกษาใหม่"
                  value={settings.admissionPeriodTitle || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, admissionPeriodTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.hideCandidateTabWhenClosed === true}
                  onChange={(e) =>
                    setSettings({ ...settings, hideCandidateTabWhenClosed: e.target.checked })
                  }
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>ซ่อนปุ่มแท็บ "ผู้ผ่านการคัดเลือกใหม่" ทั้งหมดเมื่ออยู่นอกช่วงเวลารับสมัคร</span>
              </label>
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
  );
}
