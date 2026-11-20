'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { SystemSettings } from '@/types';

interface InstitutionNamesCardProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export function InstitutionNamesCard({
  settings,
  setSettings,
}: InstitutionNamesCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
        <Building2 className="w-4 h-4 text-pink-600" />
        <span>2. ชื่อมหาวิทยาลัยและคณะ (Institution & Faculty Names)</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">
            ชื่อมหาวิทยาลัย (ภาษาไทย):
          </label>
          <input
            type="text"
            value={settings.universityNameTh || ''}
            onChange={(e) =>
              setSettings({ ...settings, universityNameTh: e.target.value })
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            ชื่อมหาวิทยาลัย (ภาษาอังกฤษ):
          </label>
          <input
            type="text"
            value={settings.universityNameEn || ''}
            onChange={(e) =>
              setSettings({ ...settings, universityNameEn: e.target.value })
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            ชื่อคณะ/หน่วยงาน (ภาษาไทย):
          </label>
          <input
            type="text"
            value={settings.facultyNameTh || ''}
            onChange={(e) =>
              setSettings({ ...settings, facultyNameTh: e.target.value })
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            ชื่อคณะ/หน่วยงาน (ภาษาอังกฤษ):
          </label>
          <input
            type="text"
            value={settings.facultyNameEn || ''}
            onChange={(e) =>
              setSettings({ ...settings, facultyNameEn: e.target.value })
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        <div className="md:col-span-2">
          <label className="font-bold text-slate-700 block mb-1">
            ชื่อสำนักงานผู้ประสานงานท้ายหนังสือรับรอง (เช่น สำนักงานคณบดีคณะพุทธศาสตร์):
          </label>
          <input
            type="text"
            value={settings.officeNameTh ?? 'สำนักงานคณบดีคณะพุทธศาสตร์'}
            onChange={(e) =>
              setSettings({ ...settings, officeNameTh: e.target.value })
            }
            placeholder="สำนักงานคณบดีคณะพุทธศาสตร์"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 font-medium"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            * แสดงในส่วนท้ายกระดาษของหนังสือรับรอง (ใต้หัวข้อ &quot;ติดต่อผู้ประสานงาน:&quot;)
          </span>
        </div>
      </div>
    </div>
  );
}
