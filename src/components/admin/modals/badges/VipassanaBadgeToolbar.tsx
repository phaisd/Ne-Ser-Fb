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
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  BadgeLayoutMode,
  BadgeOrientation,
  BadgeColorTheme,
  BadgeFontSize,
  QrScaleMode,
  BadgeNoQrCustomSettings,
} from './types';
import { DEFAULT_NO_QR_SETTINGS } from './types';
import type { WatermarkMode } from '@/hooks/useWatermarkSettings';
import { formatGroupDisplay } from '@/lib/events/groupImport';

interface VipassanaBadgeToolbarProps {
  isToolbarCollapsed?: boolean;
  setIsToolbarCollapsed?: (c: boolean | ((prev: boolean) => boolean)) => void;
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
  showQrCode: boolean;
  setShowQrCode: (v: boolean) => void;
  noQrSettings: BadgeNoQrCustomSettings;
  setNoQrSettings: React.Dispatch<React.SetStateAction<BadgeNoQrCustomSettings>>;
  footerLocationText: string;
  setFooterLocationText: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const VipassanaBadgeToolbar: React.FC<VipassanaBadgeToolbarProps> = ({
  isToolbarCollapsed = false,
  setIsToolbarCollapsed,
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
  showQrCode,
  setShowQrCode,
  noQrSettings,
  setNoQrSettings,
  footerLocationText,
  setFooterLocationText,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden transition-all duration-200">
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
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
            <option value="ALL">ทุกกลุ่ม (All Groups - {registrationsCount} คน)</option>
            {availableGroups.map((g) => (
              <option key={g} value={g}>
                {formatGroupDisplay(g)}
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
            className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="VERTICAL">📱 การ์ดแนวตั้ง (แนะนำ - ซองคล้องคอ QR ใหญ่)</option>
            <option value="HORIZONTAL">💳 การ์ดแนวนอน (รูปแบบดั้งเดิม)</option>
          </select>
        </div>

        {/* Collapsible Secondary Customization Options */}
        {!isToolbarCollapsed && (
          <>
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

            {/* QR Code Scale Selector (Only when showQrCode is true) */}
            {showQrCode && (
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
            )}

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

            {/* Toggle SCAN PASS (Only when showQrCode is true) */}
            {showQrCode && (
              <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-300 shadow-2xs" title="แสดงหรือซ่อนข้อความ SCAN PASS ใต้ QR code เพื่อเพิ่มพื้นที่ให้ QR Code ขยายใหญ่เต็มที่">
                <input
                  type="checkbox"
                  checked={showScanPass}
                  onChange={(e) => setShowScanPass(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>แสดงคำว่า SCAN PASS</span>
              </label>
            )}

            {/* Toggle QR Code On/Off (Image 1 Red Rectangle) */}
            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer px-2.5 py-1.5 rounded-lg border shadow-2xs transition ${
                showQrCode
                  ? 'bg-purple-50 border-purple-300 text-purple-900'
                  : 'bg-amber-100 border-amber-400 text-amber-950 font-extrabold ring-2 ring-amber-400/40'
              }`}
              title="เปิดหรือปิดการแสดงผล QR Code บนป้าย (เมื่อปิดจะจัดวางข้อความ 5 แถวตรงกลางแบบเต็มป้าย)"
            >
              <QrCodeIcon className="w-3.5 h-3.5" />
              <span>QR Code:</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                  showQrCode ? 'bg-purple-600 text-white' : 'bg-amber-600 text-white'
                }`}
              >
                {showQrCode ? 'เปิดแสดง' : 'ปิดซ่อน'}
              </span>
            </button>

            {/* Footer Practice Location Text Input */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs">
              <span className="font-bold text-slate-700 whitespace-nowrap">ข้อความท้ายป้าย (พิมพ์เอง):</span>
              <input
                type="text"
                value={footerLocationText}
                maxLength={60}
                onChange={(e) => setFooterLocationText(e.target.value)}
                placeholder="เช่น ศาลาปฏิบัติธรรม / ห้อง 101"
                className="w-44 sm:w-56 text-xs font-semibold text-amber-900 focus:outline-none"
              />
            </div>
          </>
        )}

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

      <div className="flex items-center gap-3 shrink-0 self-center">
        <div className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
          แสดงผล <strong className="text-purple-700 font-bold">{filteredCount}</strong> ใบ
          {isGeneratingQr ? ' (กำลังสร้าง QR...)' : ` (${pagesCount} หน้า A4)`}
        </div>

        {/* Collapsible / Expand Button (Red Arrow in screenshot) */}
        {setIsToolbarCollapsed && (
          <button
            type="button"
            onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border shadow-2xs ${
              isToolbarCollapsed
                ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600'
                : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-300'
            }`}
            title={isToolbarCollapsed ? 'คลี่ขยายแถบตัวเลือกปรับแต่งป้าย' : 'ยุบแถบตัวเลือกเพื่อขยายพื้นที่ดูตัวอย่างป้าย'}
          >
            {isToolbarCollapsed ? (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>คลี่ขยายตัวเลือก</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>ยุบตัวเลือก</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Dedicated 5-Row Custom Sizing & Spacing Toolbar when QR Code is Hidden */}
      {!isToolbarCollapsed && !showQrCode && (
        <div className="w-full mt-2 p-2.5 bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 border border-amber-300 rounded-xl flex flex-wrap items-center justify-between gap-2.5 shadow-2xs animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-amber-950 flex items-center gap-1.5 whitespace-nowrap">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              ปรับขนาดฟอนต์ 5 แถว:
            </span>

            {/* 1. ระดับ */}
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-amber-200 shadow-2xs">
              <span className="font-semibold text-slate-700 whitespace-nowrap">1.ระดับ:</span>
              <select
                value={noQrSettings.degreeScale}
                onChange={(e) =>
                  setNoQrSettings((prev) => ({ ...prev, degreeScale: parseFloat(e.target.value) }))
                }
                className="font-bold text-amber-950 bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                <option value={1.0}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={1.75}>1.75x</option>
                <option value={2.0}>2.0x (แนะนำ)</option>
                <option value={2.25}>2.25x</option>
                <option value={2.5}>2.5x</option>
                <option value={3.0}>3.0x</option>
              </select>
            </div>

            {/* 2. สาขาวิชา */}
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-amber-200 shadow-2xs">
              <span className="font-semibold text-slate-700 whitespace-nowrap">2.สาขา:</span>
              <select
                value={noQrSettings.majorScale}
                onChange={(e) =>
                  setNoQrSettings((prev) => ({ ...prev, majorScale: parseFloat(e.target.value) }))
                }
                className="font-bold text-amber-950 bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                <option value={1.0}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={1.75}>1.75x</option>
                <option value={2.0}>2.0x (แนะนำ)</option>
                <option value={2.25}>2.25x</option>
                <option value={2.5}>2.5x</option>
              </select>
            </div>

            {/* 3. กลุ่ม (สีเขียว) */}
            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-300 shadow-2xs">
              <span className="font-bold text-emerald-900 whitespace-nowrap">3.กลุ่ม:</span>
              <select
                value={noQrSettings.groupScale}
                onChange={(e) =>
                  setNoQrSettings((prev) => ({ ...prev, groupScale: parseFloat(e.target.value) }))
                }
                className="font-black text-emerald-900 bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                <option value={1.0}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={1.75}>1.75x</option>
                <option value={2.0}>2.0x (แนะนำ)</option>
                <option value={2.25}>2.25x</option>
                <option value={2.5}>2.5x</option>
              </select>
            </div>

            {/* 4. รหัส (สีน้ำเงิน) */}
            <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-300 shadow-2xs">
              <span className="font-bold text-blue-900 whitespace-nowrap">4.รหัส:</span>
              <select
                value={noQrSettings.codeScale}
                onChange={(e) =>
                  setNoQrSettings((prev) => ({ ...prev, codeScale: parseFloat(e.target.value) }))
                }
                className="font-black text-blue-900 bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                <option value={1.5}>1.5x</option>
                <option value={2.0}>2.0x</option>
                <option value={2.5}>2.5x (แนะนำ)</option>
                <option value={3.0}>3.0x (ใหญ่)</option>
                <option value={3.5}>3.5x</option>
              </select>
            </div>

            {/* 5. ชื่อ (สีแดง) */}
            <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-300 shadow-2xs">
              <span className="font-bold text-rose-900 whitespace-nowrap">5.ชื่อ:</span>
              <select
                value={noQrSettings.nameScale}
                onChange={(e) =>
                  setNoQrSettings((prev) => ({ ...prev, nameScale: parseFloat(e.target.value) }))
                }
                className="font-bold text-rose-950 bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                <option value={0.8}>0.8x</option>
                <option value={1.0}>1.0x (เดิม)</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={1.75}>1.75x</option>
              </select>
            </div>

            {/* ช่องว่างแต่ละแถว (Line Spacing) */}
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-300 shadow-2xs">
              <span className="font-semibold text-slate-700 whitespace-nowrap">ช่องว่างแถว:</span>
              <select
                value={noQrSettings.lineGap}
                onChange={(e) =>
                  setNoQrSettings((prev) => ({ ...prev, lineGap: parseInt(e.target.value, 10) }))
                }
                className="font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                <option value={2}>กระชับมาก (2px)</option>
                <option value={4}>กระชับ (4px)</option>
                <option value={6}>พอดี (6px แนะนำ)</option>
                <option value={8}>โปร่ง (8px)</option>
                <option value={10}>กว้าง (10px)</option>
                <option value={14}>กว้างมาก (14px)</option>
              </select>
            </div>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={() => setNoQrSettings(DEFAULT_NO_QR_SETTINGS)}
            className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline px-2 py-1 transition cursor-pointer whitespace-nowrap"
            title="ย้อนกลับเป็นค่าขนาดแนะนำ (2x, 2x, 2x, 2.5x, 1x, 6px)"
          >
            รีเซ็ตขนาดแนะนำ
          </button>
        </div>
      )}
    </div>
  );
};
