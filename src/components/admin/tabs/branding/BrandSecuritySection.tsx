'use client';

import React from 'react';
import {
  AlertTriangle,
  ShieldCheck,
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
  return (
    <div className="space-y-5">
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
