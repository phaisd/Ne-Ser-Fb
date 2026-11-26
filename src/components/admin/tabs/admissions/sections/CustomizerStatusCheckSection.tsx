'use client';

import React from 'react';
import { CheckCircle2, Megaphone, Building2, Globe, Phone, FileText } from 'lucide-react';
import { AdmissionPortalConfig } from '@/types';

interface CustomizerStatusCheckSectionProps {
  config: AdmissionPortalConfig;
  updateConfig: (updater: (prev: AdmissionPortalConfig) => AdmissionPortalConfig) => void;
}

export function CustomizerStatusCheckSection({
  config,
  updateConfig,
}: CustomizerStatusCheckSectionProps) {
  return (
    <div className="space-y-5 text-xs">
      {/* 1. Header & Status Search Box Labels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            หัวข้อส่วนตรวจสอบสถานะ &amp; นัดสัมภาษณ์ (แท็บ ๓)
          </label>
          <input
            type="text"
            value={config.statusSectionTitle || ''}
            onChange={(e) =>
              updateConfig((prev) => ({ ...prev, statusSectionTitle: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">คำอธิบายช่องค้นหา</label>
          <input
            type="text"
            value={config.statusSectionSubtitle || ''}
            onChange={(e) =>
              updateConfig((prev) => ({ ...prev, statusSectionSubtitle: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
          />
        </div>
      </div>

      {/* 2. Announcement of Passed Applicants & Registrar Contact Box */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-600 text-white">
              <Megaphone className="w-4 h-4" />
            </span>
            <div>
              <h5 className="font-extrabold text-slate-900 text-sm">
                ประกาศรายชื่อผู้ผ่านการสอบสัมภาษณ์ &amp; ข้อมูลติดต่อสำนักทะเบียน
              </h5>
              <p className="text-[11px] text-slate-600">
                สำหรับแสดงตารางประกาศรายชื่อผู้มีสิทธิ์เข้าศึกษาในแท็บ ๓ และคำแนะนำให้นิสิตไปติดต่อสำนักทะเบียนและวัดผล
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
            <span className="font-bold text-slate-700 text-xs">แสดงตารางประกาศรายชื่อ:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.showPassedInterviewRoster !== false}
                onChange={(e) =>
                  updateConfig((prev) => ({ ...prev, showPassedInterviewRoster: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              หัวข้อกล่องประกาศผู้ผ่านสัมภาษณ์
            </label>
            <input
              type="text"
              value={
                config.passedInterviewNoticeTitle ||
                'ประกาศรายชื่อผู้ผ่านการสอบสัมภาษณ์ และขั้นตอนการขึ้นทะเบียนนิสิต'
              }
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  passedInterviewNoticeTitle: e.target.value,
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ชื่อสำนักงาน / สำนักทะเบียนที่ต้องติดต่อ
            </label>
            <input
              type="text"
              value={
                config.registrarOfficeName ||
                'สำนักทะเบียนและวัดผล มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'
              }
              onChange={(e) =>
                updateConfig((prev) => ({ ...prev, registrarOfficeName: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              สถานที่ / เบอร์โทรติดต่อสำนักทะเบียน
            </label>
            <input
              type="text"
              value={
                config.registrarOfficeContact ||
                'อาคารเรียนรวม / สำนักงานอธิการบดี ชั้น 3 โทร. 035-248-000 ต่อ 8100'
              }
              onChange={(e) =>
                updateConfig((prev) => ({ ...prev, registrarOfficeContact: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ลิงก์เว็บไซต์ระบบสำนักทะเบียน (ถ้ามี)
            </label>
            <input
              type="text"
              value={config.registrarWebsiteUrl || 'https://reg.mcu.ac.th'}
              onChange={(e) =>
                updateConfig((prev) => ({ ...prev, registrarWebsiteUrl: e.target.value }))
              }
              placeholder="เช่น https://reg.mcu.ac.th"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-[11px]"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">
            ข้อความคำแนะนำขั้นตอนการรายงานตัว &amp; ขึ้นทะเบียน
          </label>
          <textarea
            rows={3}
            value={
              config.passedInterviewNoticeText ||
              'ขอให้ผู้มีรายชื่อผ่านการสอบสัมภาษณ์ (มีสิทธิ์เข้าศึกษา) เตรียมเอกสารหลักฐานตัวจริง และดำเนินการติดต่อสำนักทะเบียนและวัดผล มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย เพื่อรายงานตัวและขึ้นทะเบียนนิสิตใหม่ตามกำหนดการ'
            }
            onChange={(e) =>
              updateConfig((prev) => ({ ...prev, passedInterviewNoticeText: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 leading-relaxed"
          />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">หมายเหตุการจัดการตารางสัมภาษณ์รายบุคคล:</div>
          <p className="text-[11px] leading-relaxed">
            วัน-เวลา และห้องสอบสัมภาษณ์เริ่มต้นของทุกคนสามารถตั้งค่าได้ในแท็บ{' '}
            <strong>&ldquo;รายชื่อผู้สมัคร &amp; สวิตช์หลัก&rdquo;</strong> หรือกดปุ่ม{' '}
            <strong>&ldquo;นัดสัมภาษณ์/รหัส&rdquo;</strong>{' '}
            ในแต่ละแถวผู้สมัครเพื่อกำหนดวัน-เวลา/ห้องสอบเฉพาะรายบุคคลได้เลยครับ
          </p>
        </div>
      </div>
    </div>
  );
}
