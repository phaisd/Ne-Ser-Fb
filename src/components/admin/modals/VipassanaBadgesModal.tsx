'use client';

import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Sparkles,
  Download,
  FileText,
  FileDown,
  Image as ImageIcon,
  Loader2,
  Users,
} from 'lucide-react';
import type { StudentEvent, EventRegistration } from '@/types/event';
import { useWatermarkSettings } from '@/hooks/useWatermarkSettings';
import { downloadCsvFile } from '@/lib/utils/csv-helpers';
import { exportMultiPagePdf } from '@/lib/utils/pdf-export';
import { extractThaiYear } from '@/lib/utils/thai-formatters';

import type {
  BadgeLayoutMode,
  BadgeOrientation,
  BadgeColorTheme,
  BadgeFontSize,
  QrScaleMode,
  BadgeThemeStyles,
  BadgeFontScale,
} from './badges/types';
import { VipassanaBadgeToolbar } from './badges/VipassanaBadgeToolbar';
import { VipassanaBadgeCardVertical } from './badges/VipassanaBadgeCardVertical';
import { VipassanaBadgeCardHorizontal } from './badges/VipassanaBadgeCardHorizontal';

export type {
  BadgeLayoutMode,
  BadgeOrientation,
  BadgeColorTheme,
  BadgeFontSize,
  QrScaleMode,
};

export type BadgeWatermarkMode = 'MCU_LOGO' | 'CUSTOM' | 'NONE';

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
  const [layoutMode, setLayoutMode] = useState<BadgeLayoutMode>('NINE_3X3_PER_PAGE');
  const [orientation, setOrientation] = useState<BadgeOrientation>('VERTICAL');
  const [colorTheme, setColorTheme] = useState<BadgeColorTheme>('GOLD');
  const [fontSize, setFontSize] = useState<BadgeFontSize>('MEDIUM');
  const [qrScale, setQrScale] = useState<QrScaleMode>('2X');
  const [showScanPass, setShowScanPass] = useState(false);
  const [showStudentName, setShowStudentName] = useState(true);
  const [footerLocationText, setFooterLocationText] = useState<string>(
    event.location || 'สถานที่ปฏิบัติวิปัสสนากัมมัฏฐาน'
  );
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    setFooterLocationText(event.location || 'สถานที่ปฏิบัติวิปัสสนากัมมัฏฐาน');
  }, [event.location, event.id]);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  // Watermark / Custom Background hook
  const {
    watermarkMode,
    setWatermarkMode,
    watermarkOpacity,
    setWatermarkOpacity,
    customWatermarkUrl,
    systemLogoUrl,
    activeWatermark,
    fileInputRef,
    handleFileUpload,
    clearCustomWatermark,
  } = useWatermarkSettings({ isOpen });

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

  // Stable key for registrations to prevent unnecessary triggers
  const registrationKey = useMemo(() => {
    return filteredRegistrations.map((r) => r.id + ':' + (r.groupSpecificCode || r.studentCode)).join('|');
  }, [filteredRegistrations]);

  // QR Code dark color synchronized with selected color theme
  const qrColor = useMemo(() => {
    switch (colorTheme) {
      case 'GOLD':
        return '#451a03';
      case 'NAVY':
        return '#0f172a';
      case 'CRIMSON':
        return '#4c0519';
      case 'CLASSIC_BLACK':
        return '#000000';
      case 'PURPLE':
      default:
        return '#1e1b4b';
    }
  }, [colorTheme]);

  // Pre-generate QR codes for badges
  useEffect(() => {
    if (!isOpen) return;
    if (filteredRegistrations.length === 0) {
      setIsGeneratingQr(false);
      return;
    }

    let isMounted = true;
    setIsGeneratingQr(true);

    async function generateCodes() {
      try {
        const entries = await Promise.all(
          filteredRegistrations.map(async (reg) => {
            try {
              const payload = (reg.groupSpecificCode || reg.studentCode).trim();
              const dataUrl = await QRCode.toDataURL(payload, {
                width: 480,
                margin: 1,
                color: {
                  dark: qrColor,
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
  }, [isOpen, registrationKey, qrColor]);

  // Color Theme Configuration
  const themeConfig: BadgeThemeStyles = useMemo(() => {
    switch (colorTheme) {
      case 'GOLD':
        return {
          headerOrg: 'text-amber-950',
          headerUniv: 'text-stone-800',
          headerProject: 'text-amber-600',
          headerBorder: 'border-amber-300/80',
          groupPill: 'bg-amber-100/90 text-amber-950 border-amber-300 shadow-2xs',
          degreeText: 'text-stone-800',
          majorText: 'text-amber-800',
          participantCode: 'text-amber-950',
          participantName: 'text-stone-900',
          qrBorder: 'border-amber-300/80',
          footerBorder: 'border-amber-200',
          footerLabel: 'text-amber-700',
          footerIndex: 'text-slate-300/75',
        };
      case 'NAVY':
        return {
          headerOrg: 'text-blue-950',
          headerUniv: 'text-slate-800',
          headerProject: 'text-blue-700',
          headerBorder: 'border-blue-200/90',
          groupPill: 'bg-blue-100 text-blue-900 border-blue-200 shadow-2xs',
          degreeText: 'text-slate-800',
          majorText: 'text-blue-900',
          participantCode: 'text-blue-950',
          participantName: 'text-slate-900',
          qrBorder: 'border-blue-200/80',
          footerBorder: 'border-blue-200/80',
          footerLabel: 'text-blue-700',
          footerIndex: 'text-slate-300/75',
        };
      case 'CRIMSON':
        return {
          headerOrg: 'text-rose-950',
          headerUniv: 'text-slate-800',
          headerProject: 'text-rose-700',
          headerBorder: 'border-rose-200/90',
          groupPill: 'bg-rose-100 text-rose-900 border-rose-200 shadow-2xs',
          degreeText: 'text-slate-800',
          majorText: 'text-rose-900',
          participantCode: 'text-rose-950',
          participantName: 'text-slate-900',
          qrBorder: 'border-rose-200/80',
          footerBorder: 'border-rose-200/80',
          footerLabel: 'text-rose-700',
          footerIndex: 'text-slate-300/75',
        };
      case 'CLASSIC_BLACK':
        return {
          headerOrg: 'text-black',
          headerUniv: 'text-slate-800',
          headerProject: 'text-slate-900',
          headerBorder: 'border-slate-300',
          groupPill: 'bg-slate-100 text-black border-slate-300 shadow-2xs',
          degreeText: 'text-slate-800',
          majorText: 'text-slate-900',
          participantCode: 'text-black',
          participantName: 'text-black',
          qrBorder: 'border-slate-300',
          footerBorder: 'border-slate-300',
          footerLabel: 'text-slate-800',
          footerIndex: 'text-slate-300/75',
        };
      case 'PURPLE':
      default:
        return {
          headerOrg: 'text-purple-950',
          headerUniv: 'text-slate-800',
          headerProject: 'text-purple-700',
          headerBorder: 'border-purple-200/90',
          groupPill: 'bg-purple-100 text-purple-700 border-purple-200 shadow-2xs',
          degreeText: 'text-slate-800',
          majorText: 'text-purple-900',
          participantCode: 'text-purple-950',
          participantName: 'text-slate-900',
          qrBorder: 'border-slate-200/90',
          footerBorder: 'border-slate-200/80',
          footerLabel: 'text-purple-700',
          footerIndex: 'text-slate-300/75',
        };
    }
  }, [colorTheme]);

  // Typography Scaling Configuration
  const fontScale: BadgeFontScale = useMemo(() => {
    switch (fontSize) {
      case 'LARGE':
        return {
          headerOrg: 'text-[10.5px] sm:text-[11.5px]',
          headerUniv: 'text-[8.5px] sm:text-[9.5px]',
          headerProject: 'text-[9.5px] sm:text-[10.5px]',
          groupPill: 'text-[11px] sm:text-[12px] px-2.5 py-0.5',
          degree: 'text-[9px] sm:text-[10px]',
          major: 'text-[8.5px] sm:text-[9.5px]',
          code: 'text-[13px] sm:text-[14.5px]',
          name: 'text-[12px] sm:text-[13.5px]',
          footer: 'text-[9px] sm:text-[9.5px]',
        };
      case 'SMALL':
        return {
          headerOrg: 'text-[8.5px] sm:text-[9px]',
          headerUniv: 'text-[7px] sm:text-[7.5px]',
          headerProject: 'text-[7.5px] sm:text-[8px]',
          groupPill: 'text-[9.5px] sm:text-[10px] px-2 py-0.5',
          degree: 'text-[7.5px] sm:text-[8px]',
          major: 'text-[7px] sm:text-[7.5px]',
          code: 'text-[11px] sm:text-[12px]',
          name: 'text-[10.5px] sm:text-[11px]',
          footer: 'text-[7.5px] sm:text-[8px]',
        };
      case 'MEDIUM':
      default:
        return {
          headerOrg: 'text-[9.5px] sm:text-[10px]',
          headerUniv: 'text-[8px] sm:text-[8.5px]',
          headerProject: 'text-[8.5px] sm:text-[9.2px]',
          groupPill: 'text-[10px] sm:text-[11px] px-2.5 py-0.5',
          degree: 'text-[8.5px] sm:text-[9px]',
          major: 'text-[8px] sm:text-[8.5px]',
          code: 'text-[12px] sm:text-[13px]',
          name: 'text-[11.5px] sm:text-[12.5px]',
          footer: 'text-[8px] sm:text-[8.5px]',
        };
    }
  }, [fontSize]);

  // Thai Buddhist Year representation for header
  const eventYearTh = useMemo(() => {
    return extractThaiYear(event.academicYear, event.title);
  }, [event.academicYear, event.title]);

  // Number of badges per A4 sheet
  const badgesPerPage = useMemo(() => {
    switch (layoutMode) {
      case 'FOUR_PER_PAGE':
        return 4;
      case 'SIX_PER_PAGE':
        return 6;
      case 'EIGHT_PER_PAGE':
        return 8;
      case 'NINE_3X3_PER_PAGE':
        return 9;
      case 'TEN_PER_PAGE':
        return 10;
      case 'TWELVE_4X3_PER_PAGE':
      case 'TWELVE_3X4_PER_PAGE':
        return 12;
      default:
        return 9;
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
    downloadCsvFile({
      filename: `vipassana_badges_${event.id}_group_${selectedGroup}`,
      headers: ['ลำดับ', 'กลุ่ม', 'เลขเฉพาะกลุ่ม', 'รหัสนิสิต', 'ชื่อ-นามสกุล', 'หลักสูตรภาษา', 'สาขาวิชา', 'ชั้นปี'],
      rows: filteredRegistrations.map((r, idx) => [
        idx + 1,
        r.groupNumber || '',
        r.groupSpecificCode || '',
        r.studentCode,
        r.studentName,
        r.programType || 'THAI',
        r.major || '',
        r.yearLevel || '',
      ]),
    });
  };

  const handlePrintBadges = () => {
    try {
      window.print();
    } catch (err) {
      console.error('window.print error:', err);
      alert('ไม่สามารถเปิดคำสั่งพิมพ์ได้ กรุณาใช้ปุ่ม "บันทึก PDF" หรือ "บันทึกรูป PNG" เพื่อนำไฟล์ไปใช้งานหรือสั่งพิมพ์แทน');
    }
  };

  // Export all pages directly to a multi-page A4 PDF file using the unified exporter
  const handleExportPdf = async () => {
    if (pages.length === 0) return;
    setIsExportingPdf(true);
    setExportProgress('กำลังเตรียมข้อมูลเอกสาร PDF...');

    try {
      const pageElements = pages
        .map((_, i) => document.getElementById(`vipassana-badge-page-${i}`))
        .filter(Boolean) as HTMLElement[];

      const cleanTitle = (event.title || 'vipassana').replace(/[\s/\\:*?"<>|]+/g, '_');
      await exportMultiPagePdf({
        pageElements,
        filename: `ป้ายคล้องคอ_${cleanTitle}_กลุ่ม_${selectedGroup}`,
        orientation: 'portrait',
        format: 'a4',
        scale: 2,
        onProgress: (msg) => setExportProgress(msg),
      });
    } catch (err) {
      console.error('Failed to export badges PDF:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExportingPdf(false);
      setExportProgress(null);
    }
  };

  // Export each page directly as a high-resolution PNG image
  const handleExportPng = async () => {
    if (pages.length === 0) return;
    setIsExportingPng(true);
    setExportProgress('กำลังเตรียมรูปภาพ PNG...');

    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const cleanTitle = (event.title || 'vipassana').replace(/[\s/\\:*?"<>|]+/g, '_');

      for (let i = 0; i < pages.length; i++) {
        setExportProgress(`กำลังบันทึกรูปภาพ PNG หน้าที่ ${i + 1} จากทั้งหมด ${pages.length} หน้า...`);
        const pageEl = document.getElementById(`vipassana-badge-page-${i}`);
        if (!pageEl) continue;

        const headers = pageEl.querySelectorAll('.screen-only-header');
        headers.forEach((h) => ((h as HTMLElement).style.display = 'none'));

        const origBorder = pageEl.style.border;
        const origShadow = pageEl.style.boxShadow;
        const origRadius = pageEl.style.borderRadius;
        pageEl.style.border = 'none';
        pageEl.style.boxShadow = 'none';
        pageEl.style.borderRadius = '0';

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: pageEl.scrollWidth,
        });

        pageEl.style.border = origBorder;
        pageEl.style.boxShadow = origShadow;
        pageEl.style.borderRadius = origRadius;
        headers.forEach((h) => ((h as HTMLElement).style.display = ''));

        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        const fileName =
          pages.length === 1
            ? `ป้ายคล้องคอ_${cleanTitle}_กลุ่ม_${selectedGroup}.png`
            : `ป้ายคล้องคอ_${cleanTitle}_กลุ่ม_${selectedGroup}_หน้า_${i + 1}.png`;
        link.download = fileName;
        link.click();

        if (pages.length > 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    } catch (err) {
      console.error('Failed to export badges PNG:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกรูปภาพ PNG กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExportingPng(false);
      setExportProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="vipassana-badges-root"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:block print:overflow-visible animate-in fade-in"
    >
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

          <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto flex-wrap">
            {/* CSV Export */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredRegistrations.length === 0 || isExportingPdf || isExportingPng}
              className="px-2.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              title="ส่งออกรายชื่อนิสิตและเลขเฉพาะกลุ่มเป็น CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">CSV</span>
            </button>

            {/* Save PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={filteredRegistrations.length === 0 || isExportingPdf || isExportingPng}
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              title="บันทึกป้ายทั้งหมดเป็นไฟล์เอกสาร PDF ทันที (รวมทุกหน้า A4)"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>{isExportingPdf ? 'กำลังสร้าง PDF...' : 'บันทึก PDF'}</span>
            </button>

            {/* Save PNG */}
            <button
              type="button"
              onClick={handleExportPng}
              disabled={filteredRegistrations.length === 0 || isExportingPdf || isExportingPng}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              title="บันทึกป้ายเป็นไฟล์รูปภาพ PNG ความละเอียดสูง"
            >
              {isExportingPng ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              <span>{isExportingPng ? 'กำลังสร้างรูป...' : 'บันทึกรูป PNG'}</span>
            </button>

            {/* Print A4 */}
            <button
              type="button"
              onClick={handlePrintBadges}
              disabled={filteredRegistrations.length === 0 || isExportingPdf || isExportingPng}
              className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-95 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              title="สั่งพิมพ์ออกเครื่องพิมพ์หรือเลือก Print to PDF"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ป้าย A4</span>
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Export Progress Notification */}
        {exportProgress && (
          <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white px-4 py-2.5 text-xs flex items-center justify-between shrink-0 shadow-inner animate-in fade-in">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-300" />
              <span className="font-bold">{exportProgress}</span>
            </div>
            <span className="text-[11px] text-purple-200 hidden sm:inline">
              ⚡ ระบบกำลังประมวลผลความละเอียดสูง (2x Retina) กรุณารอสักครู่...
            </span>
          </div>
        )}

        {/* TOOLBAR CONTROLS (Modularized Component) */}
        <VipassanaBadgeToolbar
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          availableGroups={availableGroups}
          registrationsCount={registrations.length}
          filteredCount={filteredRegistrations.length}
          pagesCount={pages.length}
          isGeneratingQr={isGeneratingQr}
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          orientation={orientation}
          setOrientation={setOrientation}
          watermarkMode={watermarkMode}
          setWatermarkMode={setWatermarkMode}
          watermarkOpacity={watermarkOpacity}
          setWatermarkOpacity={setWatermarkOpacity}
          customWatermarkUrl={customWatermarkUrl}
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          clearCustomWatermark={clearCustomWatermark}
          qrScale={qrScale}
          setQrScale={setQrScale}
          colorTheme={colorTheme}
          setColorTheme={setColorTheme}
          fontSize={fontSize}
          setFontSize={setFontSize}
          showScanPass={showScanPass}
          setShowScanPass={setShowScanPass}
          showStudentName={showStudentName}
          setShowStudentName={setShowStudentName}
          footerLocationText={footerLocationText}
          setFooterLocationText={setFooterLocationText}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* EMBEDDED PRINT STYLES FOR EXACT MULTI-PAGE A4 OUTPUT WITHOUT BLANK PAGES */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Sarabun:wght@300;400;500;600;700;800&display=swap');

              .badge-font-th {
                font-family: 'Sarabun', 'TH Sarabun New', Tahoma, sans-serif !important;
              }

              .badge-font-en {
                font-family: 'Cinzel', 'Playfair Display', 'Georgia', serif !important;
              }

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
                #vipassana-badges-root,
                #vipassana-badges-root * {
                  visibility: visible !important;
                }
                #vipassana-badges-root {
                  position: static !important;
                  display: block !important;
                  width: 100% !important;
                  height: auto !important;
                  overflow: visible !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
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
        <div id="vipassana-badges-print-area" className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">
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
                  id={`vipassana-badge-page-${pageIdx}`}
                  className="a4-print-sheet bg-white p-4 sm:p-5 print:p-0 rounded-2xl border border-slate-200 print:border-none shadow-sm print:shadow-none mx-auto w-full max-w-[860px] print:max-w-none"
                >
                  {/* Screen-only Sheet Indicator */}
                  <div className="screen-only-header flex items-center justify-between pb-2 mb-3 border-b border-slate-200 text-xs text-slate-500 print:hidden font-medium">
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
                    className={`grid gap-2.5 sm:gap-3 print:gap-1.5 w-full h-full ${
                      layoutMode === 'NINE_3X3_PER_PAGE'
                        ? 'grid-cols-1 sm:grid-cols-3 print:grid-cols-3 print:grid-rows-3'
                        : layoutMode === 'TWELVE_4X3_PER_PAGE'
                        ? 'grid-cols-2 sm:grid-cols-4 print:grid-cols-4 print:grid-rows-3'
                        : layoutMode === 'TWELVE_3X4_PER_PAGE'
                        ? 'grid-cols-1 sm:grid-cols-3 print:grid-cols-3 print:grid-rows-4'
                        : layoutMode === 'FOUR_PER_PAGE'
                        ? 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2 print:grid-rows-2'
                        : layoutMode === 'SIX_PER_PAGE'
                        ? 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2 print:grid-rows-3'
                        : layoutMode === 'EIGHT_PER_PAGE'
                        ? 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2 print:grid-rows-4'
                        : 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2 print:grid-rows-5'
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
                          : layoutMode === 'NINE_3X3_PER_PAGE'
                          ? 'print:h-[91mm]'
                          : layoutMode === 'TWELVE_4X3_PER_PAGE'
                          ? 'print:h-[91mm]'
                          : layoutMode === 'TWELVE_3X4_PER_PAGE'
                          ? 'print:h-[68mm]'
                          : layoutMode === 'EIGHT_PER_PAGE'
                          ? 'print:h-[67mm]'
                          : 'print:h-[53mm]';

                      // Base QR code dimensions per layout
                      const baseQrDimension =
                        layoutMode === 'FOUR_PER_PAGE'
                          ? 116
                          : layoutMode === 'SIX_PER_PAGE'
                          ? 90
                          : layoutMode === 'NINE_3X3_PER_PAGE'
                          ? 75
                          : layoutMode === 'EIGHT_PER_PAGE'
                          ? 70
                          : layoutMode === 'TWELVE_4X3_PER_PAGE'
                          ? 60
                          : layoutMode === 'TWELVE_3X4_PER_PAGE'
                          ? 54
                          : 52;

                      // Apply QR scale multiplier (1x, 1.5x, 2.0x, 2.5x)
                      const qrScaleMultiplier =
                        qrScale === '2.5X'
                          ? 2.15
                          : qrScale === '2X'
                          ? 1.8
                          : qrScale === '1.5X'
                          ? 1.4
                          : 1.0;

                      const qrDimension = Math.round(baseQrDimension * qrScaleMultiplier);

                      if (orientation === 'VERTICAL') {
                        return (
                          <VipassanaBadgeCardVertical
                            key={reg.id}
                            reg={reg}
                            overallIdx={overallIdx}
                            printCardHeight={printCardHeight}
                            watermarkMode={watermarkMode}
                            activeWatermark={activeWatermark}
                            watermarkOpacity={watermarkOpacity}
                            systemLogoUrl={systemLogoUrl}
                            isEnglish={isEnglish}
                            eventYearTh={eventYearTh}
                            eventAcademicYear={event.academicYear}
                            themeConfig={themeConfig}
                            fontScale={fontScale}
                            qrDimension={qrDimension}
                            qrCodeUrl={qrCodeUrls[reg.id]}
                            showScanPass={showScanPass}
                            showStudentName={showStudentName}
                            footerLocationText={footerLocationText}
                          />
                        );
                      }

                      return (
                        <VipassanaBadgeCardHorizontal
                          key={reg.id}
                          reg={reg}
                          overallIdx={overallIdx}
                          printCardHeight={printCardHeight}
                          watermarkMode={watermarkMode}
                          activeWatermark={activeWatermark}
                          watermarkOpacity={watermarkOpacity}
                          systemLogoUrl={systemLogoUrl}
                          isEnglish={isEnglish}
                          eventYearTh={eventYearTh}
                          themeConfig={themeConfig}
                          fontScale={fontScale}
                          qrDimension={qrDimension}
                          qrCodeUrl={qrCodeUrls[reg.id]}
                          showScanPass={showScanPass}
                          showStudentName={showStudentName}
                          footerLocationText={footerLocationText}
                        />
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
