'use client';

import React from 'react';
import { Palette, Check } from 'lucide-react';
import { SystemSettings } from '@/types';
import { THEME_PRESETS, DEFAULT_THEME_PRESET } from '@/lib/theme-presets';

interface ThemeColorsCardProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export function ThemeColorsCard({
  settings,
  setSettings,
}: ThemeColorsCardProps) {
  const currentPresetConfig =
    THEME_PRESETS[settings.themePreset || DEFAULT_THEME_PRESET] || THEME_PRESETS.pink;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Palette className="w-4 h-4 text-pink-600" />
            <span>3. โทนสีธีมระบบและอัตลักษณ์การอ่าน (System Theme Colors & Visual Contrast)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            เลือกเปลี่ยนโทนสีหลักของระบบ พร้อมระบบคำนวณและปรับสีตัวอักษรให้อัตโนมัติ เพื่อให้อ่านง่าย ชัดเจน ถูกต้องตามหลักสรีรศาสตร์และมาตรฐานสากล
          </p>
        </div>
        <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
          <Check className="w-3 h-3 text-emerald-600" />
          <span>WCAG AAA คมชัด อ่านง่าย 100%</span>
        </span>
      </div>

      {/* Theme Presets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {Object.values(THEME_PRESETS).map((preset) => {
          const isSelected = (settings.themePreset || DEFAULT_THEME_PRESET) === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => setSettings({ ...settings, themePreset: preset.id })}
              className={`relative p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 text-left ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <span className="text-base">{preset.emoji}</span>
                    <span>{preset.nameTh.split('(')[0].trim()}</span>
                  </div>
                  {isSelected ? (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-slate-300 bg-slate-50 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                  {preset.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-4 flex-1 rounded-md shadow-2xs border border-black/10"
                    style={{ backgroundColor: preset.colors.primary }}
                    title={`สีหลัก: ${preset.colors.primary}`}
                  />
                  <div
                    className="h-4 flex-1 rounded-md shadow-2xs border border-black/10"
                    style={{ backgroundColor: preset.colors.accent }}
                    title={`สีเน้น: ${preset.colors.accent}`}
                  />
                  <div
                    className="h-4 flex-1 rounded-md shadow-2xs border border-black/10"
                    style={{ backgroundColor: preset.colors.bg }}
                    title={`สีพื้นหลัง: ${preset.colors.bg}`}
                  />
                  <div
                    className="h-4 flex-1 rounded-md shadow-2xs border border-black/10"
                    style={{ backgroundColor: preset.colors.textHeading }}
                    title={`สีตัวอักษร: ${preset.colors.textHeading}`}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-slate-600">{preset.badgeTh}</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                    {preset.contrastRatio.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mourning Special Toggle */}
      {settings.themePreset === 'mourning' && (
        <div className="p-4 bg-zinc-900 text-white rounded-xl flex items-center justify-between gap-4 border border-zinc-800 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🖤</span>
            <div>
              <div className="font-bold text-xs text-white">
                แถบสัญลักษณ์โบว์สีดำไว้อาลัย (Respectful Mourning Ribbon)
              </div>
              <div className="text-[11px] text-zinc-400">
                แสดงแถบโบว์สีดำที่มุมบนซ้ายของหน้าเว็บทุกหน้าตามแบบแผนการไว้ทุกข์
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={Boolean(settings.themeMourningRibbon)}
              onChange={(e) =>
                setSettings({ ...settings, themeMourningRibbon: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-zinc-950"></div>
          </label>
        </div>
      )}

      {/* Live Visual Inspector Box */}
      <div
        className="p-5 rounded-xl border transition-all space-y-4"
        style={{
          backgroundColor: currentPresetConfig.colors.bg,
          borderColor: currentPresetConfig.colors.border,
        }}
      >
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5"
          style={{ borderColor: currentPresetConfig.colors.border }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentPresetConfig.emoji}</span>
            <span className="font-bold text-xs" style={{ color: currentPresetConfig.colors.textHeading }}>
              ตัวอย่างการแสดงผลจริง (Live Readability & Contrast Preview): {currentPresetConfig.nameTh}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: currentPresetConfig.colors.textHeading }}>
            <span>อัตราส่วนความคมชัด:</span>
            <span className="px-2 py-0.5 rounded-md font-mono bg-white shadow-2xs border" style={{ borderColor: currentPresetConfig.colors.border }}>
              {currentPresetConfig.contrastRatio}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div
            className="p-4 rounded-xl border shadow-sm md:col-span-2 space-y-2"
            style={{
              backgroundColor: currentPresetConfig.colors.cardBg,
              borderColor: currentPresetConfig.colors.border,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: currentPresetConfig.colors.textHeading }}>
                คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: currentPresetConfig.colors.badgeBg,
                  color: currentPresetConfig.colors.badgeText,
                  borderColor: currentPresetConfig.colors.badgeBorder,
                }}
              >
                {currentPresetConfig.badgeTh}
              </span>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: currentPresetConfig.colors.textBody }}>
              ระบบบริการการศึกษาและวิชาการออนไลน์ คณะพุทธศาสตร์ ตัวหนังสือและสีพื้นหลังผ่านการปรับแต่งความคมชัดอย่างแม่นยำ ทำให้อ่านง่าย สบายตา ไม่ทำให้สายตาล้าแม้ใช้งานเป็นเวลานาน
            </p>

            <div className="text-[11px] flex items-center gap-1" style={{ color: currentPresetConfig.colors.textMuted }}>
              <span>✓ {currentPresetConfig.readabilityNote}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="w-full px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              style={{
                backgroundColor: currentPresetConfig.colors.primary,
                color: currentPresetConfig.colors.btnText,
              }}
            >
              <Check className="w-3.5 h-3.5" />
              <span>ปุ่มกดหลัก (Primary Button)</span>
            </button>

            <button
              type="button"
              className="w-full px-4 py-2 rounded-xl font-semibold text-xs border transition flex items-center justify-center gap-1.5 cursor-pointer bg-white"
              style={{
                borderColor: currentPresetConfig.colors.border,
                color: currentPresetConfig.colors.textBody,
              }}
            >
              <span>ปุ่มกดรอง (Secondary)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
