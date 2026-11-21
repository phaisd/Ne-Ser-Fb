'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  Layers,
  LayoutGrid,
  FileText,
  Calendar,
  MapPin,
  CheckCircle2,
  Users,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Image as ImageIcon,
  Loader2,
  Download,
} from 'lucide-react';
import type { StudentEvent, EventRegistration, EventSeatingConfig, SeatZone } from '@/types/event';
import {
  detectParticipantStatus,
  STATUS_THEMES,
  type ParticipantStatusCategory,
} from '@/services/events/seatingUtils';

interface VipassanaSeatMapPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  config: EventSeatingConfig;
  registrations: EventRegistration[];
}

type PrintMode = 'ALL_ZONES_OVERVIEW' | 'BY_ZONE' | 'ROSTER_TABLE';

export const VipassanaSeatMapPrintModal: React.FC<VipassanaSeatMapPrintModalProps> = ({
  isOpen,
  onClose,
  event,
  config,
  registrations,
}) => {
  // Print Mode State
  const [printMode, setPrintMode] = useState<PrintMode>('ALL_ZONES_OVERVIEW');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('ALL');
  const [orientation, setOrientation] = useState<'LANDSCAPE' | 'PORTRAIT'>('LANDSCAPE');
  const [showNames, setShowNames] = useState<boolean>(true);
  const [showGroupCode, setShowGroupCode] = useState<boolean>(true);
  const [colorMode, setColorMode] = useState<'COLOR' | 'INK_SAVER'>('COLOR');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [pngProgress, setPngProgress] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Automatically adjust orientation when print mode changes
  const handleSelectMode = (mode: PrintMode) => {
    setPrintMode(mode);
    if (mode === 'ROSTER_TABLE') {
      setOrientation('PORTRAIT');
    } else {
      setOrientation('LANDSCAPE');
    }
  };

  // Map occupant by uppercase seat number
  const seatOccupantMap = useMemo(() => {
    const map = new Map<string, EventRegistration>();
    registrations.forEach((r) => {
      if (r.seatNumber) {
        map.set(r.seatNumber.trim().toUpperCase(), r);
      }
    });
    return map;
  }, [registrations]);

  // Set of disabled / aisle seats
  const disabledSet = useMemo(() => {
    return new Set((config.disabledSeats || []).map((s) => s.trim().toUpperCase()));
  }, [config.disabledSeats]);

  // Overall Statistics
  const stats = useMemo(() => {
    let totalSlots = 0;
    config.zones.forEach((z) => {
      totalSlots += z.rows * z.cols;
    });

    const activeCapacity = totalSlots - disabledSet.size;
    const assignedCount = registrations.filter((r) => Boolean(r.seatNumber)).length;
    const checkedInCount = registrations.filter((r) => Boolean(r.seatNumber && r.seatCheckinAt)).length;
    const vacantCount = Math.max(0, activeCapacity - assignedCount);

    const statusCounts: Record<ParticipantStatusCategory, number> = {
      MONK: 0,
      BHIKKHUNI: 0,
      SAMANERA: 0,
      MAECHI: 0,
      LAY_MALE: 0,
      LAY_FEMALE: 0,
      UNKNOWN: 0,
    };

    registrations.forEach((r) => {
      if (r.seatNumber) {
        const cat = detectParticipantStatus(r.studentName, r.role).category;
        statusCounts[cat] = (statusCounts[cat] || 0) + 1;
      }
    });

    return {
      totalSlots,
      activeCapacity,
      assignedCount,
      checkedInCount,
      vacantCount,
      disabledCount: disabledSet.size,
      statusCounts,
    };
  }, [config.zones, disabledSet, registrations]);

  // Zones to display in BY_ZONE mode
  const displayedZones = useMemo(() => {
    if (printMode === 'BY_ZONE' && selectedZoneId !== 'ALL') {
      return config.zones.filter((z) => z.id === selectedZoneId);
    }
    return config.zones;
  }, [config.zones, printMode, selectedZoneId]);

  // Sorted registrations for Roster Table view
  const sortedRegistrations = useMemo(() => {
    return [...registrations]
      .filter((r) => Boolean(r.seatNumber))
      .sort((a, b) => {
        const seatA = a.seatNumber || '';
        const seatB = b.seatNumber || '';
        return seatA.localeCompare(seatB, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [registrations]);

  const handleTriggerPrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 250);
  };

  // Export to PNG Image
  const handleSaveToPng = async () => {
    if (isExportingPng) return;
    setIsExportingPng(true);
    setPngProgress('เตรียมบันทึกรูปภาพ...');

    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const cleanEventTitle = event.title.replace(/[\/\\:*?"<>|]/g, '_').slice(0, 40);
      const today = new Date().toISOString().slice(0, 10);

      const captureAndDownload = async (el: HTMLElement, filename: string) => {
        const origBorder = el.style.border;
        const origShadow = el.style.boxShadow;
        const origRadius = el.style.borderRadius;
        el.style.border = 'none';
        el.style.boxShadow = 'none';
        el.style.borderRadius = '0';

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: el.scrollWidth,
        });

        el.style.border = origBorder;
        el.style.boxShadow = origShadow;
        el.style.borderRadius = origRadius;

        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = filename;
        link.click();
      };

      if (printMode === 'ALL_ZONES_OVERVIEW') {
        const el = document.getElementById('seatmap-all-zones-view');
        if (!el) throw new Error('ไม่พบองค์ประกอบผังที่นั่งรวม');
        setPngProgress('กำลังบันทึกภาพผังรวมทุกโซน...');
        await captureAndDownload(el, `ผังที่นั่งรวมทุกโซน_${cleanEventTitle}_${today}.png`);
      } else if (printMode === 'BY_ZONE') {
        const zonesToExport = displayedZones;
        for (let i = 0; i < zonesToExport.length; i++) {
          const z = zonesToExport[i];
          setPngProgress(`กำลังบันทึกภาพ ${z.name} (${i + 1}/${zonesToExport.length})...`);
          const el = document.getElementById(`seatmap-zone-page-${z.id}`);
          if (el) {
            await captureAndDownload(el, `ผังที่นั่ง_${z.name.replace(/[\/\\:*?"<>|\s]/g, '_')}_${today}.png`);
            if (zonesToExport.length > 1) {
              await new Promise((r) => setTimeout(r, 400));
            }
          }
        }
      } else if (printMode === 'ROSTER_TABLE') {
        const el = document.getElementById('seatmap-roster-table-view');
        if (!el) throw new Error('ไม่พบองค์ประกอบตารางรายชื่อ');
        setPngProgress('กำลังบันทึกภาพบัญชีรายชื่อ...');
        await captureAndDownload(el, `บัญชีรายชื่อเรียงตามที่นั่ง_${cleanEventTitle}_${today}.png`);
      }
    } catch (err: any) {
      console.error('Save to PNG failed:', err);
      alert(err.message || 'บันทึกรูปภาพ PNG ไม่สำเร็จ');
    } finally {
      setIsExportingPng(false);
      setPngProgress(null);
    }
  };

  if (!isOpen || !mounted) return null;

  const printDateStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return createPortal(
    <div
      id="vipassana-seatmap-portal-root"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto print:z-auto"
    >
      {/* Dynamic Print Styles for A4 Paper formatting */}
      <style>{`
        @media print {
          @page {
            size: ${orientation === 'LANDSCAPE' ? 'A4 landscape' : 'A4 portrait'};
            margin: 6mm 6mm;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > *:not(#vipassana-seatmap-portal-root) {
            display: none !important;
            visibility: hidden !important;
          }
          #vipassana-seatmap-portal-root {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            visibility: visible !important;
          }
          #vipassana-seatmap-portal-root * {
            visibility: visible !important;
          }
          #vipassana-seatmap-portal-root > div {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            max-height: none !important;
            max-width: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print, .print\\:hidden {
            display: none !important;
          }
          #vipassana-seatmap-print-wrapper {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          .zone-page-break {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .zone-page-break:last-of-type,
          .zone-page-break:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          table {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Main Dialog Window */}
      <div className="bg-slate-100 rounded-2xl w-full max-w-7xl max-h-[96vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden print:max-h-none print:w-full print:rounded-none print:border-none print:shadow-none print:bg-white print:overflow-visible">
        {/* TOP TOOLBAR & CONTROLS (Hidden during print) */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 no-print">
          {/* Title & Modes */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                <span>พิมพ์ผังที่นั่ง & ตารางตรวจเช็ค A4</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  รองรับ A4 สองรูปแบบ
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                เลือกรูปแบบการพิมพ์ที่ต้องการ: แบบรวมทุกโซนใน 1 หน้า หรือ แยกโซนละ 1 หน้า A4
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Save to PNG Button */}
            <button
              type="button"
              onClick={handleSaveToPng}
              disabled={isExportingPng || isPrinting}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
              title="บันทึกผังที่นั่งหรือตารางเป็นรูปภาพ PNG ความละเอียดสูง"
            >
              {isExportingPng ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>{pngProgress || 'กำลังบันทึก PNG...'}</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 text-emerald-200" />
                  <span>บันทึกเป็นรูปภาพ (Save to PNG)</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handleTriggerPrint}
              disabled={isPrinting || isExportingPng}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-blue-200" />
              <span>พิมพ์ออกเครื่องพิมพ์ / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINT CONFIG BAR (Hidden during print) */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 no-print">
          {/* Format Selection Tabs */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => handleSelectMode('ALL_ZONES_OVERVIEW')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                printMode === 'ALL_ZONES_OVERVIEW'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>1. ภาพรวมทุกโซน (1 หน้า A4)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('BY_ZONE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                printMode === 'BY_ZONE'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. ตารางแยกตามโซน (โซนละหน้า A4)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('ROSTER_TABLE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                printMode === 'ROSTER_TABLE'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. บัญชีรายชื่อเรียงตามที่นั่ง</span>
            </button>
          </div>

          {/* Sub-options for By-Zone mode */}
          {printMode === 'BY_ZONE' && (
            <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
              <span className="font-bold text-slate-600">โซนที่พิมพ์:</span>
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">พิมพ์ทุกโซน (แยกหน้าละ 1 โซนอัตโนมัติ)</option>
                {config.zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    เฉพาะ {z.name} ({z.rows * z.cols} ที่)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Display & Styling Options */}
          <div className="flex items-center gap-3">
            {/* Show Names */}
            {printMode !== 'ROSTER_TABLE' && (
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700">
                <input
                  type="checkbox"
                  checked={showNames}
                  onChange={(e) => setShowNames(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>แสดงชื่อผู้เข้าที่นั่ง</span>
              </label>
            )}

            {/* Show Group / Student Code */}
            {printMode !== 'ROSTER_TABLE' && (
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700">
                <input
                  type="checkbox"
                  checked={showGroupCode}
                  onChange={(e) => setShowGroupCode(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>แสดงรหัสกลุ่ม/รหัสนิสิต</span>
              </label>
            )}

            {/* Color vs Ink Saver */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setColorMode('COLOR')}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition ${
                  colorMode === 'COLOR' ? 'bg-amber-100 text-amber-900' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                สีสมบูรณ์
              </button>
              <button
                type="button"
                onClick={() => setColorMode('INK_SAVER')}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition ${
                  colorMode === 'INK_SAVER' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                ขาวดำประหยัดหมึก
              </button>
            </div>

            {/* Orientation Toggle */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setOrientation('LANDSCAPE')}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition ${
                  orientation === 'LANDSCAPE' ? 'bg-blue-100 text-blue-900' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                แนวนอน
              </button>
              <button
                type="button"
                onClick={() => setOrientation('PORTRAIT')}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition ${
                  orientation === 'PORTRAIT' ? 'bg-blue-100 text-blue-900' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                แนวตั้ง
              </button>
            </div>
          </div>
        </div>

        {/* PRINT PREVIEW SCROLL CONTAINER */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-200/70 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          {/* WRAPPER ELEMENT TARGETED BY PRINT CSS */}
          <div
            id="vipassana-seatmap-print-wrapper"
            className="w-full max-w-[1100px] flex flex-col gap-8 print:max-w-none print:w-full print:gap-0"
          >
            {/* ========================================================================= */}
            {/* MODE 1: ALL ZONES OVERVIEW (1 A4 PAGE)                                   */}
            {/* ========================================================================= */}
            {printMode === 'ALL_ZONES_OVERVIEW' && (
              <div
                id="seatmap-all-zones-view"
                className="bg-white border border-slate-300 p-6 sm:p-8 rounded-xl shadow-md text-slate-900 flex flex-col gap-4 print:border-none print:shadow-none print:p-0 print:rounded-none"
              >
                {/* Document Header */}
                <div className="border-b-2 border-slate-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                    </div>
                    <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      ผังที่นั่งรวมโครงการปฏิบัติวิปัสสนากัมมัฏฐาน (Seating Master Plan - All Zones)
                    </h1>
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5">
                      <span className="font-bold text-slate-800">{event.title}</span>
                      <span>• สถานที่: {event.location || config.venueName || 'อาคารโพธิญาณมหาวิชชาลัย'}</span>
                      {event.startDate && (
                        <span>
                          • วันที่: {new Date(event.startDate).toLocaleDateString('th-TH')}
                          {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString('th-TH')}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Summary Stats Box */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg p-2 text-center text-xs shrink-0">
                    <div className="px-2">
                      <div className="font-extrabold text-slate-800">{stats.activeCapacity}</div>
                      <div className="text-[10px] text-slate-500">ความจุรวม</div>
                    </div>
                    <div className="w-px h-6 bg-slate-300" />
                    <div className="px-2">
                      <div className="font-extrabold text-blue-700">{stats.assignedCount}</div>
                      <div className="text-[10px] text-slate-500">จัดแล้ว</div>
                    </div>
                    <div className="w-px h-6 bg-slate-300" />
                    <div className="px-2">
                      <div className="font-extrabold text-emerald-700">{stats.checkedInCount}</div>
                      <div className="text-[10px] text-slate-500">เข้าที่นั่ง</div>
                    </div>
                    <div className="w-px h-6 bg-slate-300" />
                    <div className="px-2">
                      <div className="font-extrabold text-amber-700">{stats.vacantCount}</div>
                      <div className="text-[10px] text-slate-500">ที่ว่าง</div>
                    </div>
                  </div>
                </div>

                {/* Stage Front Banner */}
                <div className="w-full py-1.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 border border-amber-600 rounded-lg text-slate-950 font-black text-center text-xs tracking-wider shadow-2xs">
                  ▲ ด้านหน้าหอประชุม / แท่นบรรยาย / พระวิปัสสนาจารย์ (STAGE FRONT) ▲
                </div>

                {/* Grid of all zones */}
                <div className="flex flex-col gap-6">
                  {config.zones.map((zone) => {
                    const prefix = (zone.prefix ?? '').trim().toUpperCase();
                    return (
                      <div
                        key={zone.id}
                        className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 flex flex-col gap-2"
                      >
                        {/* Zone Subhead */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <div className="font-extrabold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                            <span>{zone.name}</span>
                            <span className="text-xs font-normal text-slate-500">
                              ({zone.rows} แถว × {zone.cols} คอลัมน์ = {zone.rows * zone.cols} ที่นั่ง)
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">{zone.description || ''}</span>
                        </div>

                        {/* Column Numbers Header */}
                        <div className="flex items-center gap-1">
                          <div className="w-5 text-center text-[9px] font-bold text-slate-400">แถว</div>
                          <div
                            className="grid gap-1 flex-1"
                            style={{ gridTemplateColumns: `repeat(${zone.cols}, minmax(0, 1fr))` }}
                          >
                            {Array.from({ length: zone.cols }, (_, c) => (
                              <div
                                key={c}
                                className="text-center text-[9px] font-bold text-slate-400 py-0.5 bg-slate-100 rounded-xs"
                              >
                                {c + 1 < 10 ? `0${c + 1}` : c + 1}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Seat Rows Matrix */}
                        <div className="flex flex-col gap-1">
                          {Array.from({ length: zone.rows }, (_, r) => {
                            const rowChar = String.fromCharCode(65 + r);
                            return (
                              <div key={r} className="flex items-center gap-1">
                                <div className="w-5 text-center text-[10px] font-black text-slate-600 bg-slate-200/80 rounded-xs py-0.5">
                                  {rowChar}
                                </div>
                                <div
                                  className="grid gap-1 flex-1"
                                  style={{ gridTemplateColumns: `repeat(${zone.cols}, minmax(0, 1fr))` }}
                                >
                                  {Array.from({ length: zone.cols }, (_, c) => {
                                    const colStr = c + 1 < 10 ? `0${c + 1}` : `${c + 1}`;
                                    const seatCode =
                                      zone.rows <= 26
                                        ? `${prefix}${rowChar}-${colStr}`
                                        : `${prefix}${r + 1}-${colStr}`;
                                    const isDisabled = disabledSet.has(seatCode.toUpperCase());
                                    const occupant = seatOccupantMap.get(seatCode.toUpperCase());
                                    const isCheckedIn = Boolean(occupant?.seatCheckinAt);

                                    if (isDisabled) {
                                      return (
                                        <div
                                          key={c}
                                          className="h-9 sm:h-11 rounded-xs bg-slate-200/60 border border-slate-300 flex items-center justify-center text-[8px] text-slate-400 font-bold"
                                          title="ทางเดิน / เสา"
                                        >
                                          —
                                        </div>
                                      );
                                    }

                                    const cat = occupant
                                      ? detectParticipantStatus(occupant.studentName, occupant.role).category
                                      : null;
                                    const theme = cat ? STATUS_THEMES[cat] : null;

                                    let bgStyle = 'bg-white border-slate-300 text-slate-800';
                                    if (colorMode === 'COLOR' && occupant && theme) {
                                      bgStyle = `${theme.bgClass} ${theme.textClass} ${theme.borderClass}`;
                                    } else if (colorMode === 'INK_SAVER' && occupant) {
                                      bgStyle = 'bg-slate-100 border-slate-400 text-slate-900 font-bold';
                                    }

                                    return (
                                      <div
                                        key={c}
                                        className={`h-9 sm:h-11 p-0.5 rounded-xs border text-center flex flex-col justify-between overflow-hidden relative ${bgStyle}`}
                                      >
                                        {/* Seat Code Header */}
                                        <div className="text-[9px] font-black leading-none flex items-center justify-between px-0.5">
                                          <span>{seatCode}</span>
                                          {isCheckedIn && (
                                            <span className="text-[8px] font-extrabold text-emerald-800 bg-white/90 px-0.5 rounded-xs">
                                              ✓
                                            </span>
                                          )}
                                        </div>

                                        {/* Occupant Detail */}
                                        {occupant ? (
                                          <div className="flex-1 flex flex-col justify-center leading-none overflow-hidden my-0.5">
                                            {showGroupCode && (
                                              <div className="text-[8px] font-black truncate opacity-90">
                                                {occupant.groupSpecificCode ||
                                                  (occupant.groupNumber ? `กลุ่ม ${occupant.groupNumber}` : occupant.studentCode) ||
                                                  ''}
                                              </div>
                                            )}
                                            {showNames && (
                                              <div className="text-[8px] font-semibold truncate leading-tight">
                                                {occupant.studentName.replace(/^(พระมหา|พระครู|พระ|สามเณร|นาย|นางสาว|นาง)/, '')}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="flex-1 flex items-center justify-center text-[8px] text-slate-300 font-bold">
                                            ว่าง
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Legend & Document Footer */}
                <div className="border-t border-slate-300 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-600">
                  {/* Legend badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-slate-700">สัญลักษณ์สี:</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-amber-500 text-slate-950 font-black">
                      พระภิกษุ ({stats.statusCounts.MONK})
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-yellow-900 text-amber-100 font-extrabold">
                      ภิกษุณี/Inter ({stats.statusCounts.BHIKKHUNI})
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-orange-600 text-white font-extrabold">
                      สามเณร ({stats.statusCounts.SAMANERA})
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-amber-100 text-amber-950 font-bold border border-amber-300">
                      แม่ชี ({stats.statusCounts.MAECHI})
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-blue-600 text-white font-extrabold">
                      ฆราวาสชาย ({stats.statusCounts.LAY_MALE})
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-emerald-700 text-white font-extrabold">
                      ฆราวาสหญิง ({stats.statusCounts.LAY_FEMALE})
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-white text-slate-600 border border-slate-300">
                      ว่าง ({stats.vacantCount})
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-slate-200 text-slate-600">
                      — ทางเดิน ({stats.disabledCount})
                    </span>
                  </div>

                  {/* Timestamp & System Credit */}
                  <div className="text-right text-slate-400 shrink-0">
                    พิมพ์เมื่อ: {printDateStr} • ระบบสารสนเทศวิปัสสนากัมมัฏฐาน คณะพุทธศาสตร์ มจร
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODE 2: BY ZONE (ZONE BY ZONE - EACH ON ITS OWN A4 PAGE)                  */}
            {/* ========================================================================= */}
            {printMode === 'BY_ZONE' && (
              <div className="flex flex-col gap-8 print:gap-0">
                {displayedZones.map((zone, zIdx) => {
                  const prefix = (zone.prefix ?? '').trim().toUpperCase();

                  // Stats specifically for this zone
                  let zoneCapacity = zone.rows * zone.cols;
                  let zoneOccupants = 0;
                  let zoneCheckedIn = 0;

                  for (let r = 0; r < zone.rows; r++) {
                    const rowChar = String.fromCharCode(65 + r);
                    for (let c = 0; c < zone.cols; c++) {
                      const colStr = c + 1 < 10 ? `0${c + 1}` : `${c + 1}`;
                      const code =
                        zone.rows <= 26 ? `${prefix}${rowChar}-${colStr}` : `${prefix}${r + 1}-${colStr}`;
                      if (disabledSet.has(code.toUpperCase())) {
                        zoneCapacity--;
                      } else {
                        const occ = seatOccupantMap.get(code.toUpperCase());
                        if (occ) {
                          zoneOccupants++;
                          if (occ.seatCheckinAt) zoneCheckedIn++;
                        }
                      }
                    }
                  }

                  return (
                    <div
                      key={zone.id}
                      id={`seatmap-zone-page-${zone.id}`}
                      className="zone-page-break bg-white border border-slate-300 p-6 sm:p-8 rounded-xl shadow-md text-slate-900 flex flex-col justify-between min-h-[92vh] print:min-h-[100vh] print:border-none print:shadow-none print:p-0 print:rounded-none"
                    >
                      {/* Top Header */}
                      <div className="flex flex-col gap-3">
                        <div className="border-b-2 border-slate-800 pb-3 flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                              คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                            </div>
                            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                              <span>ผังที่นั่ง: {zone.name}</span>
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                {zone.description || 'ผังประจำโซน'}
                              </span>
                            </h2>
                            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                              <span className="font-bold text-slate-800">{event.title}</span>
                              <span>• สถานที่: {event.location || config.venueName || 'อาคารโพธิญาณมหาวิชชาลัย'}</span>
                              {event.startDate && (
                                <span>
                                  • วันที่: {new Date(event.startDate).toLocaleDateString('th-TH')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Zone Summary Badges */}
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-center text-xs shrink-0">
                            <div className="px-2">
                              <div className="font-extrabold text-slate-800">{zoneCapacity}</div>
                              <div className="text-[10px] text-slate-500">ความจุโซน</div>
                            </div>
                            <div className="w-px h-6 bg-slate-300" />
                            <div className="px-2">
                              <div className="font-extrabold text-blue-700">{zoneOccupants}</div>
                              <div className="text-[10px] text-slate-500">จัดที่แล้ว</div>
                            </div>
                            <div className="w-px h-6 bg-slate-300" />
                            <div className="px-2">
                              <div className="font-extrabold text-emerald-700">{zoneCheckedIn}</div>
                              <div className="text-[10px] text-slate-500">เข้าที่นั่งแล้ว</div>
                            </div>
                            <div className="w-px h-6 bg-slate-300" />
                            <div className="px-2">
                              <div className="font-extrabold text-amber-700">
                                {Math.max(0, zoneCapacity - zoneOccupants)}
                              </div>
                              <div className="text-[10px] text-slate-500">ว่าง</div>
                            </div>
                          </div>
                        </div>

                        {/* Stage Front Banner */}
                        <div className="w-full py-1.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 border border-amber-600 rounded-lg text-slate-950 font-black text-center text-xs tracking-wider shadow-2xs">
                          ▲ ทิศทางด้านหน้าเวที / แท่นบรรยาย / พระวิปัสสนาจารย์ (STAGE FRONT) ▲
                        </div>

                        {/* Seat Matrix (Generously sized for Single Zone Page) */}
                        <div className="flex flex-col gap-1.5 my-2">
                          {/* Column Headers */}
                          <div className="flex items-center gap-1.5">
                            <div className="w-7 text-center text-[10px] font-black text-slate-400">แถว</div>
                            <div
                              className="grid gap-1.5 flex-1"
                              style={{ gridTemplateColumns: `repeat(${zone.cols}, minmax(0, 1fr))` }}
                            >
                              {Array.from({ length: zone.cols }, (_, c) => (
                                <div
                                  key={c}
                                  className="text-center text-[10px] font-black text-slate-500 py-1 bg-slate-100 rounded-xs border border-slate-200"
                                >
                                  {c + 1 < 10 ? `0${c + 1}` : c + 1}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Seat Rows */}
                          {Array.from({ length: zone.rows }, (_, r) => {
                            const rowChar = String.fromCharCode(65 + r);
                            return (
                              <div key={r} className="flex items-center gap-1.5">
                                <div className="w-7 text-center text-xs font-black text-slate-700 bg-slate-200/90 rounded-xs py-1.5 border border-slate-300">
                                  {rowChar}
                                </div>
                                <div
                                  className="grid gap-1.5 flex-1"
                                  style={{ gridTemplateColumns: `repeat(${zone.cols}, minmax(0, 1fr))` }}
                                >
                                  {Array.from({ length: zone.cols }, (_, c) => {
                                    const colStr = c + 1 < 10 ? `0${c + 1}` : `${c + 1}`;
                                    const seatCode =
                                      zone.rows <= 26
                                        ? `${prefix}${rowChar}-${colStr}`
                                        : `${prefix}${r + 1}-${colStr}`;
                                    const isDisabled = disabledSet.has(seatCode.toUpperCase());
                                    const occupant = seatOccupantMap.get(seatCode.toUpperCase());
                                    const isCheckedIn = Boolean(occupant?.seatCheckinAt);

                                    if (isDisabled) {
                                      return (
                                        <div
                                          key={c}
                                          className="h-16 sm:h-20 rounded-md bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-[9px] text-slate-400 font-bold"
                                        >
                                          <span>ทางเดิน</span>
                                        </div>
                                      );
                                    }

                                    const cat = occupant
                                      ? detectParticipantStatus(occupant.studentName, occupant.role).category
                                      : null;
                                    const theme = cat ? STATUS_THEMES[cat] : null;

                                    let cellClass = 'bg-white border-slate-300 text-slate-800';
                                    if (colorMode === 'COLOR' && occupant && theme) {
                                      cellClass = `${theme.bgClass} ${theme.textClass} ${theme.borderClass}`;
                                    } else if (colorMode === 'INK_SAVER' && occupant) {
                                      cellClass = 'bg-slate-50 border-slate-400 text-slate-900 font-bold';
                                    }

                                    return (
                                      <div
                                        key={c}
                                        className={`h-16 sm:h-20 p-1 rounded-md border text-center flex flex-col justify-between overflow-hidden shadow-2xs ${cellClass}`}
                                      >
                                        {/* Seat Code & Status */}
                                        <div className="flex items-center justify-between border-b border-black/10 pb-0.5">
                                          <span className="text-[10px] font-black tracking-tight">{seatCode}</span>
                                          {isCheckedIn ? (
                                            <span className="text-[8px] font-extrabold px-1 rounded-xs bg-emerald-600 text-white">
                                              ✓ เช็คแล้ว
                                            </span>
                                          ) : (
                                            <span className="text-[8px] font-medium opacity-60">
                                              [ &nbsp; ]
                                            </span>
                                          )}
                                        </div>

                                        {/* Participant Detail */}
                                        {occupant ? (
                                          <div className="flex-1 flex flex-col justify-center leading-tight my-0.5 overflow-hidden">
                                            {showNames && (
                                              <div className="text-[9.5px] font-black truncate">
                                                {occupant.studentName}
                                              </div>
                                            )}
                                            {showGroupCode && (
                                              <div className="text-[8.5px] font-extrabold opacity-90 truncate mt-0.5">
                                                {occupant.groupSpecificCode ? (
                                                  <span className="underline">{occupant.groupSpecificCode}</span>
                                                ) : occupant.groupNumber ? (
                                                  <span>กลุ่ม {occupant.groupNumber}</span>
                                                ) : null}
                                                {occupant.studentCode && ` (${occupant.studentCode})`}
                                              </div>
                                            )}
                                            {occupant.major && (
                                              <div className="text-[7.5px] opacity-80 truncate">
                                                {occupant.major} {occupant.yearLevel ? `ปี ${occupant.yearLevel}` : ''}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="flex-1 flex items-center justify-center text-[10px] text-slate-300 font-bold">
                                            (ว่าง)
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bottom Sign-off Section */}
                      <div className="border-t border-slate-300 pt-3 mt-4 flex flex-col sm:flex-row items-end justify-between gap-4 text-xs text-slate-700">
                        <div className="space-y-1">
                          <div className="font-bold">หมายเหตุการตรวจเช็ค:</div>
                          <div className="text-[11px] text-slate-500">
                            ตรวจเช็คผู้เข้าที่นั่งประจำโซน • หากมีการสลับที่นั่งกรุณาแจ้งฝ่ายทะเบียนกลาง
                          </div>
                          <div className="text-[10px] text-slate-400">
                            พิมพ์เมื่อ: {printDateStr} • หน้า {zIdx + 1}/{displayedZones.length}
                          </div>
                        </div>

                        {/* Signatures */}
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="w-44 border-b border-dotted border-slate-500 pb-6 mb-1" />
                            <div className="text-[11px] font-semibold text-slate-800">
                              ( ................................................................ )
                            </div>
                            <div className="text-[10px] text-slate-500">อาจารย์ / เจ้าหน้าที่ผู้ดูแลโซน</div>
                          </div>

                          <div className="text-center">
                            <div className="w-44 border-b border-dotted border-slate-500 pb-6 mb-1" />
                            <div className="text-[11px] font-semibold text-slate-800">
                              ( ................................................................ )
                            </div>
                            <div className="text-[10px] text-slate-500">พระวิปัสสนาจารย์ / ผู้ตรวจการณ์</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODE 3: ROSTER TABLE (ATTENDANCE & CHECKLIST TABLE)                       */}
            {/* ========================================================================= */}
            {printMode === 'ROSTER_TABLE' && (
              <div
                id="seatmap-roster-table-view"
                className="bg-white border border-slate-300 p-6 sm:p-8 rounded-xl shadow-md text-slate-900 flex flex-col gap-4 print:border-none print:shadow-none print:p-0 print:rounded-none"
              >
                {/* Header */}
                <div className="border-b-2 border-slate-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      บัญชีรายชื่อนิสิตเรียงตามลำดับที่นั่ง (Seating Attendance Roster)
                    </h2>
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5">
                      <span className="font-bold text-slate-800">{event.title}</span>
                      <span>• สถานที่: {event.location || config.venueName || 'อาคารโพธิญาณมหาวิชชาลัย'}</span>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="font-bold text-slate-800">
                      จำนวนผู้จัดที่นั่ง: {sortedRegistrations.length} คน
                    </div>
                    <div className="text-[10px] text-slate-500">พิมพ์เมื่อ: {printDateStr}</div>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <th className="border-r border-slate-300 px-2 py-1.5 w-10 text-center">ที่</th>
                      <th className="border-r border-slate-300 px-2 py-1.5 w-20 text-center">เลขที่นั่ง</th>
                      <th className="border-r border-slate-300 px-2 py-1.5 w-20 text-center">รหัสกลุ่ม</th>
                      <th className="border-r border-slate-300 px-2 py-1.5 w-24">รหัสนิสิต</th>
                      <th className="border-r border-slate-300 px-2 py-1.5">ชื่อ - นามสกุล</th>
                      <th className="border-r border-slate-300 px-2 py-1.5 w-32">สาขาวิชา / ชั้นปี</th>
                      <th className="border-r border-slate-300 px-2 py-1.5 w-20 text-center">สถานะ</th>
                      <th className="px-2 py-1.5 w-28 text-center">ลายมือชื่อ / เช็คอิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRegistrations.map((reg, idx) => {
                      const isChecked = Boolean(reg.seatCheckinAt);
                      const cat = detectParticipantStatus(reg.studentName, reg.role).category;
                      const theme = STATUS_THEMES[cat];

                      return (
                        <tr
                          key={reg.id || idx}
                          className={`border-b border-slate-200 ${idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}`}
                        >
                          <td className="border-r border-slate-300 px-2 py-1 text-center font-medium text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="border-r border-slate-300 px-2 py-1 text-center font-black text-slate-900">
                            {reg.seatNumber}
                          </td>
                          <td className="border-r border-slate-300 px-2 py-1 text-center font-bold text-slate-800">
                            {reg.groupSpecificCode || (reg.groupNumber ? `กลุ่ม ${reg.groupNumber}` : '—')}
                          </td>
                          <td className="border-r border-slate-300 px-2 py-1 font-mono text-slate-700">
                            {reg.studentCode || '—'}
                          </td>
                          <td className="border-r border-slate-300 px-2 py-1 font-bold text-slate-900">
                            {reg.studentName}
                          </td>
                          <td className="border-r border-slate-300 px-2 py-1 text-slate-600 text-[11px]">
                            {reg.major || reg.department || '—'}{' '}
                            {reg.yearLevel ? `ปี ${reg.yearLevel}` : ''}
                          </td>
                          <td className="border-r border-slate-300 px-2 py-1 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded-xs text-[9px] font-bold ${
                                colorMode === 'COLOR' && theme
                                  ? theme.badgeClass
                                  : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {theme ? theme.shortLabel : 'ผู้เข้าร่วม'}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-center text-xs">
                            {isChecked ? (
                              <span className="text-emerald-700 font-bold">✓ เช็คอินแล้ว</span>
                            ) : (
                              <span className="text-slate-300 font-mono">[ &nbsp; &nbsp; &nbsp; &nbsp; ]</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Footer */}
                <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <div>รวมผู้มีที่นั่งทั้งหมด {sortedRegistrations.length} รายการ</div>
                  <div>ระบบสารสนเทศวิปัสสนากัมมัฏฐาน คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
