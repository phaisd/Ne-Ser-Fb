'use client';

import React from 'react';
import {
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  ChevronUp,
  ChevronDown,
  GraduationCap,
  Clock,
  CheckCircle2,
  Eye,
  Sliders,
  Layers,
} from 'lucide-react';
import {
  AdmissionPortalConfig,
  AdmissionDepartmentBannerItem,
  DepartmentBannerColorTheme,
} from '@/types';
import { EditModalState } from './types';
import { AdmissionDepartmentBannerSlider } from '@/components/enroll/AdmissionDepartmentBannerSlider';

interface CustomizerBannerSliderSectionProps {
  config: AdmissionPortalConfig;
  updateConfig: (updater: (prev: AdmissionPortalConfig) => AdmissionPortalConfig) => void;
  setEditingItem: (item: EditModalState) => void;
  onAddNewBanner: () => void;
}

const THEME_LABELS: Record<
  DepartmentBannerColorTheme,
  { label: string; dotClass: string; desc: string }
> = {
  sage: {
    label: '🌿 เขียวเซจ (สบายตา)',
    dotClass: 'bg-emerald-600',
    desc: 'โทนเขียวธรรมชาติ นุ่มนวล สบายสายตา',
  },
  emerald: {
    label: '💎 เขียวมรกต (สุขุม)',
    dotClass: 'bg-teal-600',
    desc: 'โทนเขียวมรกตหรูหรา ภูมิฐาน',
  },
  forest: {
    label: '🌲 เขียวป่าไม้ (อบอุ่น)',
    dotClass: 'bg-green-700',
    desc: 'โทนเขียวเข้มสงบ เหมาะกับสายภาวนา',
  },
  amber: {
    label: '☸️ ส้มทองอำพัน (พุทธศาสตร์)',
    dotClass: 'bg-amber-600',
    desc: 'โทนสีประจำคณะพุทธศาสตร์ อบอุ่น สง่างาม',
  },
  indigo: {
    label: '🏛️ กรมท่าสุขุม (ปรัชญา)',
    dotClass: 'bg-indigo-700',
    desc: 'โทนสีกรมท่าคลาสสิก ลุ่มลึก',
  },
  earth: {
    label: '🍂 น้ำตาลเอิร์ธโทน (โบราณ)',
    dotClass: 'bg-stone-700',
    desc: 'โทนสีดินอบอุ่น เหมาะกับบาลี-สันสกฤต',
  },
};

export function CustomizerBannerSliderSection({
  config,
  updateConfig,
  setEditingItem,
  onAddNewBanner,
}: CustomizerBannerSliderSectionProps) {
  const banners = config.departmentBanners || [];
  const sliderEnabled = config.showDepartmentBannerSlider !== false;
  const autoInterval = config.bannerAutoSlideInterval || 5;

  const handleToggleSlider = (enabled: boolean) => {
    updateConfig((prev) => ({
      ...prev,
      showDepartmentBannerSlider: enabled,
    }));
  };

  const handleIntervalChange = (val: number) => {
    updateConfig((prev) => ({
      ...prev,
      bannerAutoSlideInterval: val,
    }));
  };

  const handleToggleBannerEnabled = (id: string, enabled: boolean) => {
    updateConfig((prev) => ({
      ...prev,
      departmentBanners: (prev.departmentBanners || []).map((b) =>
        b.id === id ? { ...b, enabled } : b
      ),
    }));
  };

  const handleDeleteBanner = (id: string, name: string) => {
    if (!window.confirm(`ต้องการลบสไลด์สาขาวิชา "${name}" หรือไม่?`)) return;
    updateConfig((prev) => ({
      ...prev,
      departmentBanners: (prev.departmentBanners || []).filter((b) => b.id !== id),
    }));
  };

  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const next = [...banners];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    updateConfig((prev) => ({
      ...prev,
      departmentBanners: next,
    }));
  };

  const handleOpenEdit = (b: AdmissionDepartmentBannerItem) => {
    setEditingItem({
      type: 'banner',
      id: b.id,
      majorName: b.majorName,
      degreeLevel: b.degreeLevel,
      tagline: b.tagline,
      highlightsText: (b.highlights || []).join('\n'),
      colorTheme: b.colorTheme || 'sage',
      badgeText: b.badgeText || '',
      actionText: b.actionText || 'สมัครเรียนสาขานี้ →',
      enabled: b.enabled !== false,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Global Slider Controls */}
      <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-600 text-white">
              <Sliders className="w-4 h-4" />
            </span>
            <h4 className="font-black text-slate-900 text-sm sm:text-base">
              สไลด์แบนเนอร์สาขาวิชาหลักสูตร (Department Banner Slider)
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
            แถบสไลด์แนะนำสาขาวิชาในตำแหน่งใต้แบนเนอร์หลักของหน้า /enroll ออกแบบด้วยโทนสีธรรมชาติสบายตา
            ช่วยดึงดูดผู้สมัครและให้ผู้สมัครกดเลือกสาขาวิชาเข้าสู่แบบฟอร์มได้ทันที
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Main Visibility Switch */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-700">แสดงสไลด์บนเว็บ:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sliderEnabled}
                onChange={(e) => handleToggleSlider(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Auto Slide Interval Selector */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs text-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="font-bold text-slate-700">สลับสไลด์ทุก:</span>
            <select
              value={autoInterval}
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
              className="bg-transparent font-bold text-emerald-800 cursor-pointer focus:outline-hidden"
            >
              <option value={3}>3 วินาที</option>
              <option value={4}>4 วินาที</option>
              <option value={5}>5 วินาที (แนะนำ)</option>
              <option value={6}>6 วินาที</option>
              <option value={8}>8 วินาที</option>
              <option value={10}>10 วินาที</option>
            </select>
          </div>

          {/* Add New Slide Button */}
          <button
            type="button"
            onClick={onAddNewBanner}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มสไลด์สาขาวิชาใหม่</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Live Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5 text-emerald-800">
            <Eye className="w-4 h-4" />
            <span>ตัวอย่างแสดงผลสด (Interactive Preview):</span>
          </span>
          <span className="text-[11px] text-slate-500 font-normal">
            ทดลองเลื่อนสไลด์หรือคลิกปุ่มเหมือนบนหน้าเว็บจริง
          </span>
        </div>
        <div className="p-3 bg-slate-900 rounded-3xl border border-slate-800 shadow-inner">
          <AdmissionDepartmentBannerSlider
            banners={banners}
            autoSlideInterval={autoInterval}
            onSelectMajor={(name) => alert(`จำลองคลิก: นำทางไปแบบฟอร์มสมัครสาขา "${name}"`)}
          />
        </div>
      </div>

      {/* 3. List of Banner Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
            <span>รายการสไลด์สาขาวิชาทั้งหมด ({banners.length} สาขา)</span>
          </h5>
          <span className="text-[11px] text-slate-500">
            สามารถสลับลำดับขึ้น-ลง หรือปิดแสดงเฉพาะบางสาขาวิชาได้
          </span>
        </div>

        <div className="space-y-2.5">
          {banners.map((banner, index) => {
            const themeInfo = THEME_LABELS[banner.colorTheme] || THEME_LABELS.sage;
            const isEnabled = banner.enabled !== false;

            return (
              <div
                key={banner.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isEnabled
                    ? 'bg-white border-slate-200/90 hover:border-emerald-300 shadow-2xs'
                    : 'bg-slate-50/80 border-slate-200 opacity-60'
                }`}
              >
                {/* Left: Reorder & Info */}
                <div className="flex items-start gap-3">
                  {/* Reorder Arrows */}
                  <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'UP')}
                      title="เลื่อนขึ้น"
                      className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-20 text-slate-500 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === banners.length - 1}
                      onClick={() => handleMove(index, 'DOWN')}
                      title="เลื่อนลง"
                      className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-20 text-slate-500 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Order Index & Theme Swatch */}
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 font-mono text-[11px] font-bold text-slate-600 flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white ${themeInfo.dotClass}`}
                      title={themeInfo.desc}
                    >
                      <span>{themeInfo.label}</span>
                    </span>
                  </div>

                  {/* Banner Content Details */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h6 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {banner.majorName}
                      </h6>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {banner.degreeLevel}
                      </span>
                      {banner.badgeText && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                          {banner.badgeText}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{banner.tagline}</p>
                    {banner.highlights && banner.highlights.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {banner.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                          >
                            ✓ {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Enable Switch */}
                  <label className="relative inline-flex items-center cursor-pointer mr-2">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => handleToggleBannerEnabled(banner.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(banner)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>แก้ไข</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteBanner(banner.id, banner.majorName)}
                    className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                    title="ลบสไลด์นี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
