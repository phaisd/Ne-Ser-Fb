'use client';

import React from 'react';
import { AdmissionPortalConfig } from '@/types';

interface CustomizerVisibilitySectionProps {
  config: AdmissionPortalConfig;
  updateConfig: (updater: (prev: AdmissionPortalConfig) => AdmissionPortalConfig) => void;
}

export function CustomizerVisibilitySection({
  config,
  updateConfig,
}: CustomizerVisibilitySectionProps) {
  const toggleItems = [
    {
      key: 'showOverviewTab' as const,
      title: '๑. ส่วน/แท็บ "คุณสมบัติผู้สมัครและเอกสารหลักฐานที่ต้องใช้"',
      desc: 'เปิด/ปิด การแสดงแท็บที่ 1 (คุณสมบัติบรรพชิต คฤหัสถ์ ต่างชาติ และรายการเอกสารหลักฐาน)',
    },
    {
      key: 'showApplyTab' as const,
      title: '๒. ส่วน/แท็บ "แบบฟอร์มยื่นใบสมัครเข้าศึกษาออนไลน์"',
      desc: 'เปิด/ปิด การแสดงแท็บที่ 2 (แบบฟอร์มกรอกสมัครเรียนออนไลน์บนหน้า /enroll)',
    },
    {
      key: 'showStatusTab' as const,
      title: '๓. ส่วน/แท็บ "ตรวจสอบสถานะการสมัคร & ตารางนัดสอบสัมภาษณ์"',
      desc: 'เปิด/ปิด การแสดงแท็บที่ 3 (ช่องค้นหาสถานะใบสมัคร 4 ขั้นตอน และวัน-ห้องสอบสัมภาษณ์)',
    },
    {
      key: 'showRegisterTab' as const,
      title: '๔. ส่วน/แท็บ "ยืนยันสิทธิ์และขึ้นทะเบียนนิสิตใหม่ออนไลน์"',
      desc: 'เปิด/ปิด การแสดงแท็บที่ 4 (หน้ายืนยันสิทธิ์รับรหัสนิสิต และพิมพ์ใบรายงานตัว A4)',
    },
    {
      key: 'showDepartmentBannerSlider' as const,
      title: 'สไลด์แบนเนอร์สาขาวิชาหลักสูตร (Department Banner Slider ใต้แบนเนอร์หลัก)',
      desc: 'เปิด/ปิด สไลด์แนะนำสาขาวิชาโทนสีสบายตา พร้อมปุ่มกดเลือกสาขาเข้าสู่ใบสมัครทันที',
    },
    {
      key: 'showProcessSteps' as const,
      title: 'การ์ดผังกระบวนการ 4 ขั้นตอนด้านบนหน้า /enroll',
      desc: 'เปิด/ปิด การแสดงการ์ดสรุปขั้นตอนที่ 1–4 ด้านบนของหน้ารับสมัคร',
    },
    {
      key: 'showQuickTestBar' as const,
      title: 'แถบทดสอบระบบด่วน 3 รหัส (Quick Test Simulation Links)',
      desc: 'เปิด/ปิด แถบปุ่มจำลองรหัสทดสอบ (1349900123456 ฯลฯ) แนะนำให้ปิดเมื่อเปิดรับสมัครจริง',
    },
    {
      key: 'showApplicationFee' as const,
      title: 'ข้อมูล "อัตราค่าธรรมเนียมการสมัครเข้าศึกษา (Application Fees)"',
      desc: 'เปิด/ปิด การแสดงกล่องค่าธรรมเนียมตามหลักสูตร และเลขบัญชีธนาคารในแท็บที่ 1 และแบบฟอร์มสมัคร',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
      {toggleItems.map((item) => {
        const checked = config[item.key] !== false;
        return (
          <div
            key={item.key}
            className={`p-4 rounded-2xl border flex items-start justify-between gap-3 transition ${
              checked ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="space-y-1">
              <div className="font-extrabold text-slate-900 flex flex-wrap items-center gap-1.5">
                <span>{item.title}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    checked ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {checked ? '🟢 เปิดแสดง' : '🔴 ปิดซ่อน'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) =>
                  updateConfig((prev) => ({ ...prev, [item.key]: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        );
      })}
    </div>
  );
}
