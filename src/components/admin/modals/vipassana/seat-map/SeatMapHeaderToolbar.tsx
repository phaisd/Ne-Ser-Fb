import React from 'react';
import {
  Users,
  Smartphone,
  Camera,
  Settings,
  X,
  Check,
  AlertCircle,
  Search,
  ZoomIn,
  ZoomOut,
  CheckSquare,
  Layers,
  Sparkles,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type { StudentEvent, EventSeatingConfig } from '@/types/event';
import { ZONE_COLORS } from './types';

export interface SeatMapHeaderToolbarProps {
  event: StudentEvent;
  config: EventSeatingConfig;
  onClose: () => void;
  onOpenSeatScanner?: (event: StudentEvent) => void;
  onOpenMobileQr: () => void;
  isConfigDrawerOpen: boolean;
  setIsConfigDrawerOpen: (open: boolean) => void;
  message: { text: string; type: 'success' | 'error' } | null;
  setMessage: (msg: { text: string; type: 'success' | 'error' } | null) => void;
  activeZoneId: string;
  setActiveZoneId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  isBatchMode: boolean;
  setIsBatchMode: (mode: boolean) => void;
  selectedSeatsCount: number;
  onClearSelectedSeats: () => void;
  onOpenRangeModal: () => void;
  onOpenAssignModal: () => void;
  isSaving: boolean;
  onOpenImportExport: () => void;
  onOpenPrintModal: () => void;
  onDeduplicate: () => void;
  isDeduplicating: boolean;
  onClearAllSeats: () => void;
  assignedCount: number;
}

export const SeatMapHeaderToolbar: React.FC<SeatMapHeaderToolbarProps> = ({
  event,
  config,
  onClose,
  onOpenSeatScanner,
  onOpenMobileQr,
  isConfigDrawerOpen,
  setIsConfigDrawerOpen,
  message,
  setMessage,
  activeZoneId,
  setActiveZoneId,
  searchQuery,
  setSearchQuery,
  zoomLevel,
  setZoomLevel,
  isBatchMode,
  setIsBatchMode,
  selectedSeatsCount,
  onClearSelectedSeats,
  onOpenRangeModal,
  onOpenAssignModal,
  isSaving,
  onOpenImportExport,
  onOpenPrintModal,
  onDeduplicate,
  isDeduplicating,
  onClearAllSeats,
  assignedCount,
}) => {
  return (
    <>
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 text-white shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 bg-white/10 rounded-xl backdrop-blur-xs shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="font-bold text-sm sm:text-lg leading-tight truncate">
                แผนผังที่นั่ง & ตรวจเช็คผู้เข้าที่นั่ง
              </h3>
              <span className="hidden sm:inline-block text-[11px] bg-amber-400 text-slate-900 font-extrabold px-2 py-0.5 rounded-full shrink-0">
                Grid Matrix
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-200/90 truncate max-w-[200px] sm:max-w-xl">
              {event.title} • {config.venueName || event.location || 'คณะพุทธศาสตร์'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileQr}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-xs cursor-pointer whitespace-nowrap"
            title="สแกน QR Code เข้าใช้งานจุดตรวจเช็คที่นั่งบนมือถือ หรือแชร์ผังที่นั่ง"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-200" />
            <span className="hidden sm:inline">QR มือถือ</span>
            <span className="sm:hidden">QR</span>
          </button>

          {onOpenSeatScanner && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSeatScanner(event);
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-xs cursor-pointer"
              title="เปิดกล้องสแกนตรวจเช็คผู้เข้าที่นั่ง"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-200" />
              <span>เปิดจุดสแกนที่นั่ง</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsConfigDrawerOpen(!isConfigDrawerOpen)}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer border ${
              isConfigDrawerOpen
                ? 'bg-amber-400 text-slate-900 border-amber-300'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
            title="ตั้งค่าขนาดโซน แถว และคอลัมน์"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ตั้งค่าโซน/ผัง</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Status Toast */}
      {message && (
        <div
          className={`px-4 py-2 text-xs font-medium flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Toolbar Row 1: Zone Navigation & View / Search Controls */}
      <div className="bg-slate-100 border-b border-slate-200/90 px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left: Zone Switcher Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveZoneId('ALL')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeZoneId === 'ALL'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            ทุกโซน ({config.zones.length})
          </button>
          {config.zones.map((zone) => {
            const zoneColor = ZONE_COLORS[zone.color] || ZONE_COLORS.amber;
            const isActive = activeZoneId === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setActiveZoneId(zone.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 border whitespace-nowrap shrink-0 ${
                  isActive
                    ? `${zoneColor.bg} text-white ${zoneColor.border} shadow-xs`
                    : `bg-white ${zoneColor.text} hover:${zoneColor.lightBg} border-slate-300`
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : zoneColor.bg}`} />
                <span>{zone.name}</span>
                <span className="text-[10px] opacity-80">({zone.rows * zone.cols})</span>
              </button>
            );
          })}
        </div>

        {/* Right: Search Participant & Zoom Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ/รหัส/ที่นั่ง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white w-44 sm:w-60 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="ย่อขนาดผัง"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold px-1.5 text-slate-700 min-w-8 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.1))}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="ขยายขนาดผัง"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1 text-slate-500 hover:text-slate-800 text-[10px] font-semibold border-l border-slate-200 pl-1.5 pr-1 cursor-pointer"
              title="รีเซ็ตขนาด 100%"
            >
              1x
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar Row 2: Action & Management Tools */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        {/* Left: Seat Selection Tools */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 hidden lg:inline-flex items-center mr-0.5">
            เครื่องมือเลือก:
          </span>
          <button
            type="button"
            onClick={() => {
              const next = !isBatchMode;
              setIsBatchMode(next);
              if (!next) onClearSelectedSeats();
            }}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap shrink-0 ${
              isBatchMode
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 font-black'
                : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-300'
            }`}
            title="เปิด/ปิดโหมดเลือกหลายที่นั่งพร้อมกัน เพื่อทำทางเดิน/เสา หรือกำหนดกลุ่ม"
          >
            <CheckSquare className={`w-3.5 h-3.5 ${isBatchMode ? 'text-slate-950' : 'text-amber-600'}`} />
            <span>{isBatchMode ? `โหมดเลือกกลุ่ม (${selectedSeatsCount})` : 'เลือกหลายที่นั่ง'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenRangeModal}
            className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-indigo-50 text-slate-700 border border-slate-300 rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            title="ระบุช่วงที่นั่งเพื่อเลือกกลุ่ม (เช่น D-03 ถึง I-03 หรือ D-10 ถึง G-12)"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>เลือกเป็นช่วง...</span>
          </button>
        </div>

        {/* Right: Actions, Import/Export, Print & Reset */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={onOpenAssignModal}
            disabled={isSaving}
            className="px-2.5 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            title="จัดที่นั่งอัตโนมัติ เรียงตามสถานภาพ เพศ หรือกลุ่ม"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>จัดที่นั่งอัตโนมัติ</span>
          </button>

          <button
            type="button"
            onClick={onOpenImportExport}
            className="px-2.5 py-1 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            title="นำเข้าหรือส่งออกข้อมูลผังที่นั่งด้วยไฟล์ Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-200" />
            <span>นำเข้า/ส่งออก Excel</span>
          </button>

          <button
            type="button"
            onClick={onOpenPrintModal}
            className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            title="พิมพ์ตารางที่นั่ง A4 (ทั้งแบบรวมทุกโซนใน 1 หน้า หรือแยกตามโซน)"
          >
            <Printer className="w-3.5 h-3.5 text-blue-200" />
            <span>พิมพ์ตารางที่นั่ง A4</span>
          </button>

          <button
            type="button"
            onClick={onDeduplicate}
            disabled={isDeduplicating || isSaving}
            className="px-2.5 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            title="รีเซ็ตและลบรายชื่อผู้เข้าร่วมที่ซ้ำซ้อนให้ตรงกับจำนวนจริง (309 คน)"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-amber-200 ${isDeduplicating ? 'animate-spin' : ''}`} />
            <span>รีเซ็ตจำนวน / ลบรายการซ้ำ</span>
          </button>

          <button
            type="button"
            onClick={onClearAllSeats}
            disabled={isSaving || assignedCount === 0}
            className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer disabled:opacity-40 shrink-0 flex items-center gap-1"
            title="ล้างข้อมูลการจัดที่นั่งทั้งหมด (คืนค่าเป็น 0 ที่นั่ง)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ล้างผัง</span>
          </button>
        </div>
      </div>
    </>
  );
};
