'use client';

import React from 'react';
import {
  Users,
  Grid,
  Smartphone,
  CreditCard,
  Image as ImageIcon,
  Upload,
  X,
  Palette,
  Type,
  QrCode as QrCodeIcon,
  Search,
} from 'lucide-react';
import type {
  BadgeLayoutMode,
  BadgeOrientation,
  BadgeColorTheme,
  BadgeFontSize,
  QrScaleMode,
} from './types';
import type { WatermarkMode } from '@/hooks/useWatermarkSettings';

interface VipassanaBadgeToolbarProps {
  selectedGroup: number | 'ALL';
  setSelectedGroup: (g: number | 'ALL') => void;
  availableGroups: number[];
  registrationsCount: number;
  filteredCount: number;
  pagesCount: number;
  isGeneratingQr: boolean;
  layoutMode: BadgeLayoutMode;
  setLayoutMode: (m: BadgeLayoutMode) => void;
  orientation: BadgeOrientation;
  setOrientation: (o: BadgeOrientation) => void;
  watermarkMode: WatermarkMode;
  setWatermarkMode: (m: WatermarkMode) => void;
  watermarkOpacity: number;
  setWatermarkOpacity: (op: number) => void;
  customWatermarkUrl: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearCustomWatermark: () => void;
  qrScale: QrScaleMode;
  setQrScale: (s: QrScaleMode) => void;
  colorTheme: BadgeColorTheme;
  setColorTheme: (t: BadgeColorTheme) => void;
  fontSize: BadgeFontSize;
  setFontSize: (s: BadgeFontSize) => void;
  showScanPass: boolean;
  setShowScanPass: (v: boolean) => void;
  showStudentName: boolean;
  setShowStudentName: (v: boolean) => void;
  footerLocationText: string;
  setFooterLocationText: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const VipassanaBadgeToolbar: React.FC<VipassanaBadgeToolbarProps> = ({
  selectedGroup,
  setSelectedGroup,
  availableGroups,
  registrationsCount,
  filteredCount,
  pagesCount,
  isGeneratingQr,
  layoutMode,
  setLayoutMode,
  orientation,
  setOrientation,
  watermarkMode,
  setWatermarkMode,
  watermarkOpacity,
  setWatermarkOpacity,
  customWatermarkUrl,
  fileInputRef,
  handleFileUpload,
  clearCustomWatermark,
  qrScale,
  setQrScale,
  colorTheme,
  setColorTheme,
  fontSize,
  setFontSize,
  showScanPass,
  setShowScanPass,
  showStudentName,
  setShowStudentName,
  footerLocationText,
  setFooterLocationText,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Group Selector */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            กลุ่ม:
          </span>
          <select
            value={selectedGroup}
            onChange={(e) => {
              const val = e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10);
              setSelectedGroup(val);
            }}
            className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="ALL">ทุกกลุ่ม ({registrationsCount} รูป/คน)</option>
            {availableGroups.map((g) => (
              <option key={g} value={g}>
                {g === 12 ? `กลุ่มที่ 12 (Inter)` : `กลุ่มที่ ${g}`}
              </option>
            ))}
          </select>
        </div>

        {/* Layout Mode */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Grid className="w-3.5 h-3.5 text-blue-600" />
            ขนาดป้าย:
          </span>
          <select
            value={layoutMode}
            onChange={(e) => setLayoutMode(e.target.value as BadgeLayoutMode)}
            className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="NINE_3X3_PER_PAGE">🌟 9 ป้ายต่อหน้า A4 (3 แถว x 3 คอลัมน์ - แนะนำสำหรับป้ายแนวตั้ง)</option>
            <option value="TWELVE_4X3_PER_PAGE">✨ 12 ป้ายต่อหน้า A4 (3 แถว x 4 คอลัมน์ - เต็มหน้า ไม่เหลือที่ว่าง)</option>
            <option value="TWELVE_3X4_PER_PAGE">12 ป้ายต่อหน้า A4 (4 แถว x 3 คอลัมน์ - ขนาดกะทัดรัด)</option>
            <option value="EIGHT_PER_PAGE">8 ป้ายต่อหน้า A4 (4 แถว x 2 คอลัมน์ - ขนาด 7 x 10 ซม.)</option>
            <option value="SIX_PER_PAGE">6 ป้ายต่อหน้า A4 (3 แถว x 2 คอลัมน์ - ขนาดมาตรฐาน 8.5 x 11 ซม.)</option>
            <option value="FOUR_PER_PAGE">4 ป้ายต่อหน้า A4 (2 แถว x 2 คอลัมน์ - ขนาดใหญ่พิเศษ 10 x 14 ซม.)</option>
            <option value="TEN_PER_PAGE">10 ป้ายต่อหน้า A4 (5 แถว x 2 คอลัมน์ - ขนาดนามบัตร 5.5 x 9 ซม.)</option>
          </select>
        </div>

        {/* Orientation */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            {orientation === 'VERTICAL' ? (
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
            )}
            รูปแบบ:
          </span>
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as BadgeOrientation)}
            className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-semibold text-slate-800 focus:outline-none"
          >
            <option value="VERTICAL">📱 การ์ดแนวตั้ง (แนะนำ - ซองคล้องคอ QR ใหญ่)</option>
            <option value="HORIZONTAL">💳 การ์ดแนวนอน (รูปแบบดั้งเดิม)</option>
          </select>
        </div>

        {/* Watermark Controls */}
        <div className="flex items-center gap-1.5 bg-purple-50/70 px-2 py-1 rounded-xl border border-purple-200/80">
          <span className="font-bold text-purple-900 flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-purple-700" />
            ลายน้ำ:
          </span>
          <select
            value={watermarkMode}
            onChange={(e) => {
              const mode = e.target.value as WatermarkMode;
              setWatermarkMode(mode);
              if (mode === 'CUSTOM' && !customWatermarkUrl) {
                fileInputRef.current?.click();
              }
            }}
            className="px-2 py-1 bg-white rounded-lg border border-purple-200 text-xs font-bold text-purple-950 focus:outline-none cursor-pointer"
          >
            <option value="MCU_LOGO">☸️ ตราสัญลักษณ์ มจร</option>
            <option value="CUSTOM">🖼️ อัปโหลดภาพพื้นหลังเอง</option>
            <option value="NONE">🚫 ไม่ใส่ลายน้ำ</option>
          </select>

          {watermarkMode !== 'NONE' && (
            <select
              value={watermarkOpacity}
              onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
              className="px-1.5 py-1 bg-white rounded-lg border border-purple-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              title="ระดับความโปร่งแสงของลายน้ำ"
            >
              <option value={0.06}>จาง 6%</option>
              <option value={0.10}>พอดี 10% (แนะนำ)</option>
              <option value={0.15}>ชัด 15%</option>
              <option value={0.20}>เข้ม 20%</option>
            </select>
          )}

          {watermarkMode === 'CUSTOM' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                title="เลือกรูปภาพพื้นหลังลายน้ำจากเครื่อง"
              >
                <Upload className="w-3 h-3" />
                <span>{customWatermarkUrl ? 'เปลี่ยนรูป' : 'เลือกรูป'}</span>
              </button>
              {customWatermarkUrl && (
                <button
                  type="button"
                  onClick={clearCustomWatermark}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="ยกเลิกภาพพื้นหลังที่อัปโหลด กลับไปใช้ตรา มจร"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* QR Code Scale Selector */}
        <div className="flex items-center gap-1.5 bg-emerald-50/80 px-2 py-1 rounded-xl border border-emerald-200">
          <span className="font-bold text-emerald-950 flex items-center gap-1">
            <QrCodeIcon className="w-3.5 h-3.5 text-emerald-700" />
            ขนาด QR:
          </span>
          <select
            value={qrScale}
            onChange={(e) => setQrScale(e.target.value as QrScaleMode)}
            className="px-2 py-1 bg-white rounded-lg border border-emerald-300 text-xs font-bold text-emerald-950 focus:outline-none cursor-pointer"
          >
            <option value="2.5X">🔥 ใหญ่ 2.5 เท่า (เต็มพื้นที่การ์ด)</option>
            <option value="2X">⚡ ใหญ่ 2.0 เท่า (แนะนำ - คมชัด)</option>
            <option value="1.5X">✨ ใหญ่ 1.5 เท่า</option>
            <option value="1X">📐 ปกติ 1.0 เท่า</option>
          </select>
        </div>

        {/* Color Theme Selector */}
        <div className="flex items-center gap-1.5 bg-amber-50/80 px-2 py-1 rounded-xl border border-amber-200">
          <span className="font-bold text-amber-950 flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-amber-600" />
            สีข้อความ:
          </span>
          <select
            value={colorTheme}
            onChange={(e) => setColorTheme(e.target.value as BadgeColorTheme)}
            className="px-2 py-1 bg-white rounded-lg border border-amber-300 text-xs font-bold text-amber-950 focus:outline-none cursor-pointer"
          >
            <option value="GOLD">🟡 เหลืองทองสง่างาม (แนะนำ - สวยงาม อ่านง่าย)</option>
            <option value="PURPLE">🟣 ม่วงมหาจุฬาฯ (ดั้งเดิม)</option>
            <option value="NAVY">🔵 น้ำเงินกรมท่าภูมิฐาน</option>
            <option value="CRIMSON">🔴 แดงเลือดหมูมงคล</option>
            <option value="CLASSIC_BLACK">⚫ ดำ-เทาเข้มทางการ (คมชัดสูงสุด)</option>
          </select>
        </div>

        {/* Font Size Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-xl border border-slate-300">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Type className="w-3.5 h-3.5 text-slate-600" />
            ขนาดฟอนต์:
          </span>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value as BadgeFontSize)}
            className="px-2 py-1 bg-white rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="MEDIUM">ปกติ (พอดีสัดส่วน)</option>
            <option value="LARGE">ใหญ่ (เห็นชัดจากระยะไกล)</option>
            <option value="SMALL">กะทัดรัด (สำหรับชื่อยาว)</option>
          </select>
        </div>

        {/* Toggle Student Name On/Off */}
        <button
          type="button"
          onClick={() => setShowStudentName(!showStudentName)}
          className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer px-2.5 py-1.5 rounded-lg border shadow-2xs transition ${
            showStudentName
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-slate-100 border-slate-300 text-slate-600'
          }`}
          title="เปิดหรือปิดการแสดงชื่อนิสิตบนป้ายคล้องคอ"
        >
          <span>ชื่อนิสิต:</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
              showStudentName ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
            }`}
          >
            {showStudentName ? 'เปิดแสดง' : 'ปิดซ่อน'}
          </span>
        </button>

        {/* Toggle SCAN PASS */}
        <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-300 shadow-2xs" title="แสดงหรือซ่อนข้อความ SCAN PASS ใต้ QR code เพื่อเพิ่มพื้นที่ให้ QR Code ขยายใหญ่เต็มที่">
          <input
            type="checkbox"
            checked={showScanPass}
            onChange={(e) => setShowScanPass(e.target.checked)}
            className="rounded text-purple-600 focus:ring-purple-500"
          />
          <span>แสดงคำว่า SCAN PASS</span>
        </label>

        {/* Footer Practice Location Text Input */}
        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs">
          <span className="font-bold text-slate-700 whitespace-nowrap">สถานที่ปฏิบัติ (ท้ายป้าย):</span>
          <input
            type="text"
            value={footerLocationText}
            onChange={(e) => setFooterLocationText(e.target.value)}
            placeholder="ระบุสถานที่ปฏิบัติ..."
            className="w-40 sm:w-52 text-xs font-semibold text-amber-900 focus:outline-none"
          />
        </div>

        {/* Search */}
        <div className="relative min-w-[170px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหารหัส หรือชื่อ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 bg-white rounded-lg border border-slate-300 text-xs focus:outline-none"
          />
        </div>
      </div>

      <div className="text-[11px] text-slate-500 font-medium">
        แสดงผล <strong className="text-purple-700 font-bold">{filteredCount}</strong> ใบ
        {isGeneratingQr ? ' (กำลังสร้าง QR...)' : ` (${pagesCount} หน้า A4)`}
      </div>
    </div>
  );
};
