'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { SystemSettings } from '@/types';
import { applyTypographySettings } from '@/components/ThemeProvider';

interface TypographySettingsCardProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  savingSettings: boolean;
  setSavingSettings: React.Dispatch<React.SetStateAction<boolean>>;
  setActionSuccess: (msg: string | null) => void;
}

export function TypographySettingsCard({
  settings,
  setSettings,
  savingSettings,
  setSavingSettings,
  setActionSuccess,
}: TypographySettingsCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
              กA
            </span>
            <span>4. ขนาดตัวอักษรและรูปแบบฟอนต์ของระบบ (Font Size & Typography Settings)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ปรับขยายขนาดตัวอักษรและเลือกรูปแบบฟอนต์ให้มีผลทั้งหน้าเว็บไซต์หลัก (<span className="font-mono">localhost:3020</span>) และหน้าผู้ดูแลระบบ (<span className="font-mono">/admin</span>) เพื่อให้อ่านง่าย สบายตา ไม่ต้องเพ่ง
          </p>
        </div>
        <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 font-bold px-2.5 py-1 rounded-full shrink-0">
          มีผลทั้งหน้าเว็บหลัก & หน้า Admin
        </span>
      </div>

      {/* Font Size Preset Cards */}
      <div>
        <label className="font-bold text-slate-700 text-xs block mb-2">
          เลือกระดับขนาดตัวอักษร (Font Size Scale Presets):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: 'normal' as const,
              percent: 100,
              label: 'ขนาดมาตรฐาน (100%)',
              desc: 'ขนาดปกติของระบบ (16px) แสดงข้อมูลได้มากในหน้าเดียว',
              sampleClass: 'text-sm',
            },
            {
              id: 'medium' as const,
              percent: 108,
              label: 'ขนาดกลาง (108%)',
              desc: 'ขยายตัวอักษรขึ้นเล็กน้อย อ่านสบายตา สมดุลกับตาราง',
              sampleClass: 'text-base',
            },
            {
              id: 'large' as const,
              percent: 116,
              label: 'ขนาดใหญ่ - แนะนำ (116%)',
              desc: 'ตัวอักษรใหญ่ชัดเจน อ่านง่ายทั้งตารางรายชื่อและเมนูแอดมิน',
              sampleClass: 'text-lg',
            },
            {
              id: 'xlarge' as const,
              percent: 125,
              label: 'ขนาดใหญ่พิเศษ (125%)',
              desc: 'ขยายใหญ่พิเศษ เหมาะสำหรับหน้าจอความละเอียดสูงหรือผู้บริหาร',
              sampleClass: 'text-xl',
            },
          ].map((item) => {
            const currentScale = settings.fontSizeScale || 'large';
            const isSelected = currentScale === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const next = {
                    ...settings,
                    fontSizeScale: item.id,
                    fontCustomPercent: item.percent,
                  };
                  setSettings(next);
                  applyTypographySettings(next);
                }}
                className={`p-3.5 rounded-xl border-2 text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-500/15'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-black text-indigo-700 ${item.sampleClass}`}>
                    กขค Aa
                  </span>
                  {isSelected ? (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">{item.percent}%</span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">{item.label}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fine-tune Slider & Font Family Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-xs text-slate-800">
              🔍 ปรับขนาดตัวอักษรละเอียด (95% – 135%):
            </label>
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-bold text-xs">
              {settings.fontCustomPercent || (settings.fontSizeScale === 'normal' ? 100 : settings.fontSizeScale === 'medium' ? 108 : settings.fontSizeScale === 'xlarge' ? 125 : 116)}%
            </span>
          </div>
          <input
            type="range"
            min={95}
            max={135}
            step={2}
            value={
              settings.fontCustomPercent ||
              (settings.fontSizeScale === 'normal'
                ? 100
                : settings.fontSizeScale === 'medium'
                ? 108
                : settings.fontSizeScale === 'xlarge'
                ? 125
                : 116)
            }
            onChange={(e) => {
              const val = Number(e.target.value);
              const next: SystemSettings = {
                ...settings,
                fontSizeScale: 'custom',
                fontCustomPercent: val,
              };
              setSettings(next);
              applyTypographySettings(next);
            }}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
            <span>95% (กะทัดรัด)</span>
            <span>100% (ปกติ)</span>
            <span>116% (แนะนำ)</span>
            <span>135% (ใหญ่พิเศษ)</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div>
            <label className="font-bold text-xs text-slate-800 block mb-1.5">
              ✒️ รูปแบบฟอนต์หลักของระบบ (System Font Family):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'sarabun' as const, name: 'Sarabun (สารบัญ)', sub: 'ทางการ อ่านคุ้นตา' },
                { id: 'krub' as const, name: 'Krub (ครับ)', sub: 'หัวกลม สบายตา' },
                { id: 'baijamjuree' as const, name: 'Bai Jamjuree', sub: 'โปร่ง คมชัด' },
              ].map((f) => {
                const active = (settings.fontFamilyPreset || 'sarabun') === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      const next = { ...settings, fontFamilyPreset: f.id };
                      setSettings(next);
                      applyTypographySettings(next);
                    }}
                    className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                      active
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-xs truncate">{f.name}</div>
                    <div className={`text-[10px] truncate ${active ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {f.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center justify-between gap-2 pt-1 cursor-pointer select-none">
            <span className="text-xs font-bold text-slate-700">
              ปรับสีตัวอักษรขนาดเล็กให้เข้มและคมชัดขึ้นอัตโนมัติ
            </span>
            <input
              type="checkbox"
              checked={settings.fontWeightBoost !== false}
              onChange={(e) => {
                const next = { ...settings, fontWeightBoost: e.target.checked };
                setSettings(next);
                applyTypographySettings(next);
              }}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Quick Save for Typography */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-600">
          💡 <strong>หมายเหตุ:</strong> การขยายขนาดตัวอักษรจะมีผลเฉพาะบนหน้าจอ (ไม่กระทบสัดส่วนกระดาษ A4 ตอนสั่งพิมพ์ใบกรอกคะแนนหรือใบรับรอง)
        </div>
        <button
          type="button"
          disabled={savingSettings}
          onClick={async () => {
            setSavingSettings(true);
            try {
              const res = await fetch('/api/system-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
              });
              const data = await res.json();
              if (data.success) {
                applyTypographySettings(settings);
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('mcu_settings_updated'));
                }
                setActionSuccess('✅ บันทึกขนาดตัวอักษรและฟอนต์ของระบบเรียบร้อยแล้ว!');
              } else {
                alert(data.error);
              }
            } catch (e: unknown) {
              alert((e instanceof Error ? e.message : String(e)));
            } finally {
              setSavingSettings(false);
            }
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{savingSettings ? 'กำลังบันทึก...' : '💾 บันทึกขนาดตัวอักษรทันที'}</span>
        </button>
      </div>
    </div>
  );
}
