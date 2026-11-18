'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
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
    <div className="space-y-4 text-xs">
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
