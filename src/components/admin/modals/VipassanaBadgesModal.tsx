'use client';

import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Search,
  Users,
  Grid,
  Sparkles,
  Download,
  FileText,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import type { StudentEvent, EventRegistration } from '@/types/event';

export type BadgeLayoutMode = 'EIGHT_PER_PAGE' | 'SIX_PER_PAGE' | 'FOUR_PER_PAGE' | 'TEN_PER_PAGE';
export type BadgeOrientation = 'VERTICAL' | 'HORIZONTAL';

interface VipassanaBadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  registrations: EventRegistration[];
}

export function VipassanaBadgesModal({
  isOpen,
  onClose,
  event,
  registrations,
}: VipassanaBadgesModalProps) {
  const [selectedGroup, setSelectedGroup] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutMode, setLayoutMode] = useState<BadgeLayoutMode>('EIGHT_PER_PAGE');
  const [orientation, setOrientation] = useState<BadgeOrientation>('VERTICAL');
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Available groups
  const availableGroups = useMemo(() => {
    const groupNums = new Set<number>();
    registrations.forEach((r) => {
      if (r.groupNumber) groupNums.add(r.groupNumber);
      else if (r.groupName) {
        const m = r.groupName.match(/\d+/);
        if (m) groupNums.add(parseInt(m[0], 10));
      }
    });
    if (groupNums.size === 0) {
      [1, 2, 3, 12].forEach((g) => groupNums.add(g));
    }
    return Array.from(groupNums).sort((a, b) => a - b);
  }, [registrations]);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      if (selectedGroup !== 'ALL') {
        const gNum = r.groupNumber || (r.groupName ? parseInt(r.groupName.replace(/\D/g, ''), 10) : 0);
        if (gNum !== selectedGroup) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode =
          r.studentCode.toLowerCase().includes(q) ||
          (r.groupSpecificCode && r.groupSpecificCode.toLowerCase().includes(q));
        const matchName = r.studentName.toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }
      return true;
    });
  }, [registrations, selectedGroup, searchQuery]);

  // Pre-generate QR codes for badges (Parallel for high performance)
  useEffect(() => {
    if (!isOpen || filteredRegistrations.length === 0) return;

    let isMounted = true;
    setIsGeneratingQr(true);

    async function generateCodes() {
      try {
        const entries = await Promise.all(
          filteredRegistrations.map(async (reg) => {
            try {
              const payload = (reg.groupSpecificCode || reg.studentCode).trim();
              const dataUrl = await QRCode.toDataURL(payload, {
                width: 320,
                margin: 1,
                color: {
                  dark: '#1e1b4b',
                  light: '#ffffff',
                },
                errorCorrectionLevel: 'M',
              });
              return [reg.id, dataUrl] as const;
            } catch (e) {
              console.error('Failed to generate QR code for', reg.studentCode, e);
              return [reg.id, ''] as const;
            }
          })
        );

        if (isMounted) {
          setQrCodeUrls(Object.fromEntries(entries));
          setIsGeneratingQr(false);
        }
      } catch (err) {
        console.error('Error generating QR batch', err);
        if (isMounted) setIsGeneratingQr(false);
      }
    }

    generateCodes();

    return () => {
      isMounted = false;
    };
  }, [isOpen, filteredRegistrations]);

  // Number of badges per A4 sheet
  const badgesPerPage = useMemo(() => {
    switch (layoutMode) {
      case 'FOUR_PER_PAGE':
        return 4;
      case 'SIX_PER_PAGE':
        return 6;
      case 'EIGHT_PER_PAGE':
        return 8;
      case 'TEN_PER_PAGE':
        return 10;
      default:
        return 8;
    }
  }, [layoutMode]);

  // Chunk registrations into pages for exact A4 print pagination
  const pages = useMemo(() => {
    const chunks: EventRegistration[][] = [];
    for (let i = 0; i < filteredRegistrations.length; i += badgesPerPage) {
      chunks.push(filteredRegistrations.slice(i, i + badgesPerPage));
    }
    return chunks;
  }, [filteredRegistrations, badgesPerPage]);

  // Export CSV
  const handleExportCsv = () => {
    if (filteredRegistrations.length === 0) return;
    const headers = ['ลำดับ', 'กลุ่ม', 'เลขเฉพาะกลุ่ม', 'รหัสนิสิต', 'ชื่อ-นามสกุล', 'หลักสูตรภาษา', 'สาขาวิชา', 'ชั้นปี'];
    const rows = filteredRegistrations.map((r, idx) => [
      idx + 1,
      r.groupNumber || '',
      r.groupSpecificCode || '',
      r.studentCode,
      `"${r.studentName}"`,
      r.programType || 'THAI',
      `"${r.major || ''}"`,
      r.yearLevel || '',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vipassana_badges_${event.id}_group_${selectedGroup}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:block animate-in fade-in">
      {/* Container */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden print:shadow-none print:border-none print:max-h-none print:w-full print:p-0 print:static print:block print:overflow-visible print:h-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER (Hidden in Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-purple-50/90 via-white to-amber-50/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-700 text-white shadow-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Vipassana Badge Generator</span>
              </span>
              <span className="text-xs font-medium text-slate-500">
                พร้อม QR Code สแกนเข้าห้องปฏิบัติธรรม
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
              พิมพ์ป้ายชื่อคล้องคอ (Event Badges) ผู้เข้าร่วมวิปัสสนากัมมัฏฐาน
            </h3>
            <p className="text-xs text-slate-600 line-clamp-1">
              {event.title} • นิสิต {filteredRegistrations.length} รูป/คน • ทั้งหมด {pages.length} หน้า A4
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredRegistrations.length === 0}
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              title="ส่งออกรายชื่อนิสิตและเลขเฉพาะกลุ่มเป็น CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={isGeneratingQr || filteredRegistrations.length === 0}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ป้าย A4 (Print Badges)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOOLBAR CONTROLS (Hidden in Print) */}
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
                <option value="ALL">ทุกกลุ่ม ({registrations.length} รูป/คน)</option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>
                    {g === 12 ? `กลุ่มที่ 12 (Inter)` : `กลุ่มที่ ${g}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Layout Mode (Badges Per Page) */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Grid className="w-3.5 h-3.5 text-blue-600" />
                ขนาดป้าย:
              </span>
              <select
                value={layoutMode}
                onChange={(e) => setLayoutMode(e.target.value as BadgeLayoutMode)}
                className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-semibold text-slate-800 focus:outline-none"
              >
                <option value="EIGHT_PER_PAGE">8 ป้ายต่อหน้า A4 (ขนาด 7 x 10 ซม. - ยอดนิยมใส่ซอง)</option>
                <option value="SIX_PER_PAGE">6 ป้ายต่อหน้า A4 (ขนาดมาตรฐาน 8.5 x 11 ซม.)</option>
                <option value="FOUR_PER_PAGE">4 ป้ายต่อหน้า A4 (ขนาดใหญ่พิเศษ 10 x 14 ซม.)</option>
                <option value="TEN_PER_PAGE">10 ป้ายต่อหน้า A4 (ขนาดนามบัตร 5.5 x 9 ซม. - ประหยัดกระดาษ)</option>
              </select>
            </div>

            {/* Orientation (Vertical vs Horizontal) */}
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
            แสดงผล <strong className="text-purple-700 font-bold">{filteredRegistrations.length}</strong> ใบ
            {isGeneratingQr ? ' (กำลังสร้าง QR...)' : ` (${pages.length} หน้า A4)`}
          </div>
        </div>

        {/* EMBEDDED PRINT STYLES FOR EXACT MULTI-PAGE A4 OUTPUT WITHOUT BLANK PAGES */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 6mm 5mm;
                }
                html, body {
                  height: auto !important;
                  min-height: 100% !important;
                  overflow: visible !important;
                  background: white !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .print\\:hidden, .no-print {
                  display: none !important;
                }
                .a4-print-sheet {
                  width: 100% !important;
                  height: 284mm !important;
                  min-height: 284mm !important;
                  max-height: 284mm !important;
                  page-break-after: always !important;
                  break-after: page !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  overflow: hidden !important;
                  box-sizing: border-box !important;
                  margin: 0 auto !important;
                  padding: 0 !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: flex-start !important;
                }
                .a4-print-sheet:last-of-type,
                .a4-print-sheet:last-child {
                  page-break-after: auto !important;
                  break-after: auto !important;
                }
              }
            `,
          }}
        />

        {/* BADGES CONTAINER */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">
          {filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-600 text-sm">ไม่พบนิสิตในกลุ่มที่เลือก หรือยังไม่มีรายการลงทะเบียน</p>
              <p className="text-xs text-slate-400 mt-1">กรุณาเลือกกลุ่มอื่น หรือนำเข้านิสิตในแท็บกิจกรรม</p>
            </div>
          ) : (
            <div className="space-y-6 print:space-y-0">
              {pages.map((pageRegistrations, pageIdx) => (
                <div
                  key={`page-${pageIdx}`}
                  className="a4-print-sheet bg-white p-4 sm:p-5 print:p-0 rounded-2xl border border-slate-200 print:border-none shadow-sm print:shadow-none mx-auto w-full max-w-[860px] print:max-w-none"
                >
                  {/* Screen-only Sheet Indicator */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 text-xs text-slate-500 print:hidden font-medium">
                    <span className="font-bold text-purple-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                      <span>หน้าที่ {pageIdx + 1} / {pages.length}</span>
                    </span>
                    <span>
                      ({pageRegistrations.length} ป้ายในหน้านี้ • A4 Portrait)
                    </span>
                  </div>

                  {/* Grid of badges on this A4 sheet */}
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3 print:gap-1.5 w-full h-full ${
                      layoutMode === 'FOUR_PER_PAGE'
                        ? 'print:grid-rows-2'
                        : layoutMode === 'SIX_PER_PAGE'
                        ? 'print:grid-rows-3'
                        : layoutMode === 'EIGHT_PER_PAGE'
                        ? 'print:grid-rows-4'
                        : 'print:grid-rows-5'
                    }`}
                  >
                    {pageRegistrations.map((reg, cardIdx) => {
                      const overallIdx = pageIdx * badgesPerPage + cardIdx;
                      const gNum = reg.groupNumber || (reg.groupName ? parseInt(reg.groupName.replace(/\D/g, ''), 10) : undefined);
                      const isEnglish = reg.programType === 'ENGLISH' || gNum === 12;

                      // Exact print heights per card
                      const printCardHeight =
                        layoutMode === 'FOUR_PER_PAGE'
                          ? 'print:h-[136mm]'
                          : layoutMode === 'SIX_PER_PAGE'
                          ? 'print:h-[90mm]'
                          : layoutMode === 'EIGHT_PER_PAGE'
                          ? 'print:h-[67mm]'
                          : 'print:h-[53mm]';

                      if (orientation === 'VERTICAL') {
                        /* ================== VERTICAL BADGE CARD (PORTRAIT) ================== */
                        return (
                          <div
                            key={reg.id}
                            className={`border-2 border-dashed border-slate-300 rounded-2xl bg-white p-2.5 sm:p-3 print:p-1.5 print:border-slate-400 print:rounded-none flex flex-col justify-between shadow-2xs hover:border-purple-400 transition print:break-inside-avoid print:page-break-inside-avoid ${printCardHeight}`}
                            style={{
                              minHeight:
                                layoutMode === 'FOUR_PER_PAGE'
                                  ? '330px'
                                  : layoutMode === 'SIX_PER_PAGE'
                                  ? '260px'
                                  : layoutMode === 'EIGHT_PER_PAGE'
                                  ? '210px'
                                  : '175px',
                            }}
                          >
                            {/* Top: Header */}
                            <div className="text-center border-b border-slate-200 pb-1 shrink-0">
                              <div className="flex items-center justify-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wide text-purple-900 leading-tight">
                                <span>☸️</span>
                                <span>{isEnglish ? 'Faculty of Buddhism • MCU' : 'คณะพุทธศาสตร์ มจร'}</span>
                              </div>
                              <div className="text-[10px] font-bold text-slate-800 leading-tight pt-0.5 truncate">
                                {isEnglish ? 'Vipassana Meditation Practice' : 'โครงการปฏิบัติวิปัสสนากัมมัฏฐาน'}
                              </div>
                            </div>

                            {/* Middle: Group & Student Name */}
                            <div className="text-center py-0.5 shrink-0 space-y-0.5">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.2 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black border border-purple-200">
                                  กลุ่ม {gNum || '-'}
                                </span>
                                {reg.groupSpecificCode && (
                                  <span className="font-mono font-black text-xs px-2 py-0.2 rounded bg-purple-800 text-white shadow-2xs">
                                    {reg.groupSpecificCode}
                                  </span>
                                )}
                              </div>
                              <div className={`font-extrabold text-slate-900 leading-snug line-clamp-2 px-1 ${
                                layoutMode === 'TEN_PER_PAGE' ? 'text-[11px]' : 'text-xs sm:text-[13px]'
                              }`}>
                                {reg.studentName}
                              </div>
                              <div className="text-[9px] text-slate-600 font-mono flex items-center justify-center gap-1.5">
                                <span>{reg.studentCode}</span>
                                {reg.yearLevel && <span className="font-sans font-medium text-slate-500">• ปี {reg.yearLevel}</span>}
                                {reg.vasa && <span className="font-sans font-medium text-slate-500">({reg.vasa} พรรษา)</span>}
                              </div>
                            </div>

                            {/* Center: Large High-Contrast QR Code */}
                            <div className="flex flex-col items-center justify-center my-auto py-0.5">
                              {qrCodeUrls[reg.id] ? (
                                <img
                                  src={qrCodeUrls[reg.id]}
                                  alt={`QR ${reg.studentCode}`}
                                  className="object-contain rounded-md border border-slate-300 p-0.5 bg-white shadow-2xs"
                                  style={{
                                    width:
                                      layoutMode === 'FOUR_PER_PAGE'
                                        ? '120px'
                                        : layoutMode === 'SIX_PER_PAGE'
                                        ? '90px'
                                        : layoutMode === 'EIGHT_PER_PAGE'
                                        ? '74px'
                                        : '58px',
                                    height:
                                      layoutMode === 'FOUR_PER_PAGE'
                                        ? '120px'
                                        : layoutMode === 'SIX_PER_PAGE'
                                        ? '90px'
                                        : layoutMode === 'EIGHT_PER_PAGE'
                                        ? '74px'
                                        : '58px',
                                  }}
                                />
                              ) : (
                                <div className="w-16 h-16 bg-slate-100 rounded-md animate-pulse" />
                              )}
                              <span className="text-[7.5px] font-mono font-bold text-slate-500 tracking-wider mt-0.5">
                                SCAN FOR CHECK-IN
                              </span>
                            </div>

                            {/* Bottom Footer */}
                            <div className="border-t border-slate-100 pt-0.5 text-[8.5px] text-slate-400 flex items-center justify-between shrink-0">
                              <span className="truncate max-w-[140px] text-slate-500">
                                {reg.major || (isEnglish ? 'Buddhism' : 'พุทธศาสตร์')}
                              </span>
                              <span className="font-mono font-bold">
                                #{String(overallIdx + 1).padStart(3, '0')}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      /* ================== HORIZONTAL BADGE CARD (LANDSCAPE) ================== */
                      return (
                        <div
                          key={reg.id}
                          className={`border-2 border-dashed border-slate-300 rounded-2xl bg-white p-2.5 sm:p-3 print:p-1.5 print:border-slate-400 print:rounded-none flex flex-col justify-between shadow-2xs hover:border-purple-400 transition print:break-inside-avoid print:page-break-inside-avoid ${printCardHeight}`}
                          style={{
                            minHeight:
                              layoutMode === 'FOUR_PER_PAGE'
                                ? '330px'
                                : layoutMode === 'SIX_PER_PAGE'
                                ? '260px'
                                : layoutMode === 'EIGHT_PER_PAGE'
                                ? '210px'
                                : '175px',
                          }}
                        >
                          {/* Top: Header */}
                          <div className="text-center border-b border-slate-200 pb-1 shrink-0">
                            <div className="flex items-center justify-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wide text-purple-900 leading-tight">
                              <span>☸️</span>
                              <span>{isEnglish ? 'Faculty of Buddhism • MCU' : 'คณะพุทธศาสตร์ มจร'}</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-800 leading-tight pt-0.5 truncate">
                              {isEnglish ? 'Annual Vipassana Meditation' : 'โครงการปฏิบัติวิปัสสนากัมมัฏฐาน'}
                            </div>
                          </div>

                          {/* Middle: Left Info + Right QR */}
                          <div className="py-1 flex items-center justify-between gap-2 flex-1 my-auto">
                            <div className="flex-1 space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.2 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black border border-purple-200">
                                  กลุ่ม {gNum || '-'}
                                </span>
                                {reg.groupSpecificCode && (
                                  <span className="font-mono font-black text-xs px-2 py-0.2 rounded bg-purple-800 text-white shadow-2xs">
                                    {reg.groupSpecificCode}
                                  </span>
                                )}
                              </div>

                              <div className={`font-extrabold text-slate-900 leading-snug line-clamp-2 pt-0.5 ${
                                layoutMode === 'TEN_PER_PAGE' ? 'text-[11px]' : 'text-xs sm:text-[13px]'
                              }`}>
                                {reg.studentName}
                              </div>

                              <div className="font-mono font-bold text-[10.5px] text-purple-950">
                                {reg.studentCode}
                              </div>

                              <div className="text-[8.5px] text-slate-500 flex flex-wrap gap-x-1.5 leading-tight">
                                {reg.yearLevel && <span>ปี {reg.yearLevel}</span>}
                                {reg.vasa && <span>({reg.vasa} พรรษา)</span>}
                                {reg.major && <span className="truncate max-w-[110px]">{reg.major}</span>}
                              </div>
                            </div>

                            {/* Right QR Code */}
                            <div className="shrink-0 flex flex-col items-center">
                              {qrCodeUrls[reg.id] ? (
                                <img
                                  src={qrCodeUrls[reg.id]}
                                  alt={`QR ${reg.studentCode}`}
                                  className="object-contain rounded-md border border-slate-300 p-0.5 bg-white shadow-2xs"
                                  style={{
                                    width:
                                      layoutMode === 'FOUR_PER_PAGE'
                                        ? '105px'
                                        : layoutMode === 'SIX_PER_PAGE'
                                        ? '82px'
                                        : layoutMode === 'EIGHT_PER_PAGE'
                                        ? '68px'
                                        : '54px',
                                    height:
                                      layoutMode === 'FOUR_PER_PAGE'
                                        ? '105px'
                                        : layoutMode === 'SIX_PER_PAGE'
                                        ? '82px'
                                        : layoutMode === 'EIGHT_PER_PAGE'
                                        ? '68px'
                                        : '54px',
                                  }}
                                />
                              ) : (
                                <div className="w-16 h-16 bg-slate-100 rounded-md animate-pulse" />
                              )}
                              <span className="text-[7.5px] font-mono text-slate-500 mt-0.5">
                                SCAN PASS
                              </span>
                            </div>
                          </div>

                          {/* Bottom Footer */}
                          <div className="border-t border-slate-100 pt-0.5 text-[8.5px] text-slate-400 flex items-center justify-between shrink-0">
                            <span>บัตรประจำตัวผู้เข้าปฏิบัติ</span>
                            <span className="font-mono font-bold">
                              #{String(overallIdx + 1).padStart(3, '0')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
