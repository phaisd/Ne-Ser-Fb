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
  FileDown,
  Image as ImageIcon,
  Loader2,
  Upload,
} from 'lucide-react';
import type { StudentEvent, EventRegistration } from '@/types/event';

export type BadgeLayoutMode =
  | 'NINE_3X3_PER_PAGE'
  | 'TWELVE_4X3_PER_PAGE'
  | 'TWELVE_3X4_PER_PAGE'
  | 'EIGHT_PER_PAGE'
  | 'SIX_PER_PAGE'
  | 'FOUR_PER_PAGE'
  | 'TEN_PER_PAGE';
export type BadgeOrientation = 'VERTICAL' | 'HORIZONTAL';
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
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  // Watermark / Custom Background states
  const [watermarkMode, setWatermarkMode] = useState<BadgeWatermarkMode>('MCU_LOGO');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.10);
  const [customWatermarkUrl, setCustomWatermarkUrl] = useState<string>('');
  const [systemLogoUrl, setSystemLogoUrl] = useState<string>('/uploads/logo-1793607763771.jpg');
  const watermarkFileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch official MCU logo from system settings
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function loadLogo() {
      try {
        const res = await fetch('/api/system-settings');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.data?.logoUrl) {
            setSystemLogoUrl(data.data.logoUrl);
          }
        }
      } catch {
        // Fallback default logo is already set
      }
    }
    loadLogo();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Compute active watermark image url
  const activeWatermark = useMemo(() => {
    if (watermarkMode === 'NONE') return '';
    if (watermarkMode === 'CUSTOM') return customWatermarkUrl;
    return systemLogoUrl || '/uploads/logo-1793607763771.jpg';
  }, [watermarkMode, customWatermarkUrl, systemLogoUrl]);

  // Handle custom watermark / background upload
  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ภาพต้องไม่เกิน 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomWatermarkUrl(reader.result);
        setWatermarkMode('CUSTOM');
      }
    };
    reader.readAsDataURL(file);
  };

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

  // Stable key for registrations to prevent infinite effect triggers
  const registrationKey = useMemo(() => {
    return filteredRegistrations.map((r) => r.id + ':' + (r.groupSpecificCode || r.studentCode)).join('|');
  }, [filteredRegistrations]);

  // Pre-generate QR codes for badges (Parallel for high performance)
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
  }, [isOpen, registrationKey]);

  // Thai Buddhist Year representation for header
  const eventYearTh = useMemo(() => {
    if (event.academicYear) {
      const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
      return String(event.academicYear).replace(/\d/g, (d) => thaiDigits[parseInt(d, 10)] || d);
    }
    const match = event.title?.match(/(?:๒๕\d{2}|25\d{2})/);
    if (match) {
      const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
      return match[0].replace(/\d/g, (d) => thaiDigits[parseInt(d, 10)] || d);
    }
    return '๒๕๖๙';
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

  const handlePrintBadges = () => {
    try {
      window.print();
    } catch (err) {
      console.error('window.print error:', err);
      alert('ไม่สามารถเปิดคำสั่งพิมพ์ได้ กรุณาใช้ปุ่ม "บันทึก PDF" หรือ "บันทึกรูป PNG" เพื่อนำไฟล์ไปใช้งานหรือสั่งพิมพ์แทน');
    }
  };

  // Export all pages directly to a multi-page A4 PDF file
  const handleExportPdf = async () => {
    if (pages.length === 0) return;
    setIsExportingPdf(true);
    setExportProgress('กำลังเตรียมข้อมูลเอกสาร PDF...');

    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      for (let i = 0; i < pages.length; i++) {
        setExportProgress(`กำลังสร้างหน้า PDF ที่ ${i + 1} จากทั้งหมด ${pages.length} หน้า...`);
        const pageEl = document.getElementById(`vipassana-badge-page-${i}`);
        if (!pageEl) continue;

        // Hide screen-only indicator during canvas capture
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

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        const pdfWidth = 210;
        const pdfHeight = 297;
        const canvasRatio = canvas.width / canvas.height;
        let targetW = pdfWidth;
        let targetH = pdfWidth / canvasRatio;
        let x = 0;
        let y = 0;

        if (targetH > pdfHeight) {
          targetH = pdfHeight;
          targetW = pdfHeight * canvasRatio;
          x = (pdfWidth - targetW) / 2;
        } else {
          y = (pdfHeight - targetH) / 2;
        }

        pdf.addImage(imgData, 'JPEG', x, y, targetW, targetH);
      }

      setExportProgress('กำลังบันทึกไฟล์ PDF...');
      const cleanTitle = (event.title || 'vipassana').replace(/[\s/\\:*?"<>|]+/g, '_');
      pdf.save(`ป้ายคล้องคอ_${cleanTitle}_กลุ่ม_${selectedGroup}.pdf`);
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

            {/* Watermark / Background Controls */}
            <div className="flex items-center gap-1.5 bg-purple-50/70 px-2 py-1 rounded-xl border border-purple-200/80">
              <span className="font-bold text-purple-900 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-purple-700" />
                ลายน้ำ:
              </span>
              <select
                value={watermarkMode}
                onChange={(e) => {
                  const mode = e.target.value as BadgeWatermarkMode;
                  setWatermarkMode(mode);
                  if (mode === 'CUSTOM' && !customWatermarkUrl) {
                    watermarkFileInputRef.current?.click();
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
                    onClick={() => watermarkFileInputRef.current?.click()}
                    className="px-2 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="เลือกรูปภาพพื้นหลังลายน้ำจากเครื่อง"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{customWatermarkUrl ? 'เปลี่ยนรูป' : 'เลือกรูป'}</span>
                  </button>
                  {customWatermarkUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomWatermarkUrl('');
                        setWatermarkMode('MCU_LOGO');
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="ยกเลิกภาพพื้นหลังที่อัปโหลด กลับไปใช้ตรา มจร"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              <input
                ref={watermarkFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleWatermarkUpload}
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
                  visibility: hidden !important;
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

                      // Proportional QR code dimensions
                      const qrDimension =
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

                      if (orientation === 'VERTICAL') {
                        /* ================== VERTICAL BADGE CARD (PORTRAIT - ACCORDING TO IMAGE 3) ================== */
                        return (
                          <div
                            key={reg.id}
                            className={`border-2 border-dashed border-slate-300 rounded-2xl bg-white p-2.5 sm:p-3 print:p-2 print:border-slate-300 print:rounded-2xl flex flex-col justify-between shadow-2xs hover:border-purple-400 transition print:break-inside-avoid print:page-break-inside-avoid relative overflow-hidden ${printCardHeight}`}
                            style={{
                              minHeight:
                                layoutMode === 'FOUR_PER_PAGE'
                                  ? '330px'
                                  : layoutMode === 'SIX_PER_PAGE'
                                  ? '270px'
                                  : layoutMode === 'NINE_3X3_PER_PAGE'
                                  ? '265px'
                                  : layoutMode === 'TWELVE_4X3_PER_PAGE'
                                  ? '270px'
                                  : layoutMode === 'TWELVE_3X4_PER_PAGE'
                                  ? '210px'
                                  : layoutMode === 'EIGHT_PER_PAGE'
                                  ? '210px'
                                  : '175px',
                            }}
                          >
                            {/* Background Watermark Layer - subtle & safe for QR scanning */}
                            {watermarkMode !== 'NONE' && activeWatermark && (
                              <div
                                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
                                style={{ opacity: watermarkOpacity }}
                              >
                                <img
                                  src={activeWatermark}
                                  alt="Watermark"
                                  className="object-contain max-w-[70%] max-h-[70%] filter grayscale contrast-125"
                                  crossOrigin="anonymous"
                                />
                              </div>
                            )}

                            {/* 1. Top: Official 3-Line Header with Emblem (Image 3) */}
                            <div className="border-b border-purple-200/90 pb-1 shrink-0 relative z-10">
                              <div className="flex items-center gap-1.5">
                                {systemLogoUrl ? (
                                  <img
                                    src={systemLogoUrl}
                                    alt="MCU Logo"
                                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 rounded-xs"
                                    crossOrigin="anonymous"
                                  />
                                ) : (
                                  <span className="text-sm">☸️</span>
                                )}
                                <div className="min-w-0 flex-1 text-left leading-[1.18]">
                                  <div className="text-[9px] sm:text-[9.5px] font-extrabold text-purple-950 uppercase tracking-wide truncate">
                                    {isEnglish ? 'Faculty of Buddhism • MCU' : 'คณะพุทธศาสตร์ มจร'}
                                  </div>
                                  <div className="text-[7.5px] sm:text-[8px] font-bold text-slate-700 truncate">
                                    {isEnglish ? 'Mahachulalongkornrajavidyalaya University' : 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}
                                  </div>
                                  <div className="text-[8px] sm:text-[8.5px] font-black text-purple-700 truncate">
                                    {isEnglish ? `Annual Vipassana Practice ${event.academicYear || '2026'}` : `โครงการปฏิบัติวิปัสสนากัมมัฏฐาน ปี ${eventYearTh}`}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 2. Subheader: Group Pill + Degree Level & Major (Image 3) */}
                            <div className="flex items-center gap-2 pt-1 pb-0.5 shrink-0 relative z-10">
                              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] sm:text-[11px] font-black border border-purple-200 shrink-0 shadow-2xs">
                                กลุ่ม {gNum || '-'}
                              </span>
                              <div className="min-w-0 text-left leading-tight">
                                <div className="text-[8px] sm:text-[8.5px] font-bold text-slate-800 truncate">
                                  {reg.degreeLevel || (isEnglish ? "Bachelor's Degree" : "ปริญญาตรี")}
                                  {reg.yearLevel ? ` (${isEnglish ? 'Yr' : 'ปี'} ${reg.yearLevel})` : ''}
                                </div>
                                <div className="text-[7.5px] sm:text-[8px] font-semibold text-purple-900 truncate" title={reg.major}>
                                  {reg.major
                                    ? reg.major.startsWith('สาขา')
                                      ? reg.major
                                      : `สาขาวิชา ${reg.major}`
                                    : isEnglish
                                    ? 'Buddhism'
                                    : 'สาขาวิชา พระพุทธศาสนา'}
                                </div>
                              </div>
                            </div>

                            {/* 3. Participant: Group Code + Student Name (Image 3) */}
                            <div className="flex items-baseline gap-1.5 px-0.5 py-0.5 shrink-0 min-w-0 relative z-10">
                              <span className="font-mono font-black text-xs sm:text-[13px] text-purple-950 shrink-0">
                                {reg.groupSpecificCode || reg.studentCode}
                              </span>
                              <span className="font-extrabold text-slate-900 text-xs sm:text-[12px] leading-snug truncate" title={reg.studentName}>
                                {reg.studentName}
                              </span>
                            </div>

                            {/* 4. Center: Large High-Contrast QR Code + SCAN PASS (Image 3) */}
                            <div className="flex flex-col items-center justify-center my-auto py-0.5 relative z-10">
                              {qrCodeUrls[reg.id] ? (
                                <div className="p-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                                  <img
                                    src={qrCodeUrls[reg.id]}
                                    alt={`QR ${reg.studentCode}`}
                                    className="object-contain block bg-white"
                                    style={{
                                      width: `${qrDimension}px`,
                                      height: `${qrDimension}px`,
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 bg-slate-100 rounded-md animate-pulse" />
                              )}
                              <span className="text-[7px] sm:text-[7.5px] font-mono font-bold text-slate-400 tracking-widest mt-0.5">
                                SCAN PASS
                              </span>
                            </div>

                            {/* 5. Bottom: Footer with Participant Pass Label & Serial # (Image 3) */}
                            <div className="border-t border-slate-200/80 pt-0.5 text-[8px] sm:text-[8.5px] flex items-center justify-between shrink-0 relative z-10">
                              <span className="font-bold text-purple-700">
                                {isEnglish ? 'Participant Pass' : 'บัตรประจำตัวผู้เข้าปฏิบัติ'}
                              </span>
                              <span className="font-mono font-bold text-slate-500">
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
                          className={`border-2 border-dashed border-slate-300 rounded-2xl bg-white p-2.5 sm:p-3 print:p-1.5 print:border-slate-400 print:rounded-none flex flex-col justify-between shadow-2xs hover:border-purple-400 transition print:break-inside-avoid print:page-break-inside-avoid relative overflow-hidden ${printCardHeight}`}
                          style={{
                            minHeight:
                              layoutMode === 'FOUR_PER_PAGE'
                                ? '330px'
                                : layoutMode === 'SIX_PER_PAGE'
                                ? '260px'
                                : layoutMode === 'NINE_3X3_PER_PAGE'
                                ? '260px'
                                : layoutMode === 'TWELVE_4X3_PER_PAGE'
                                ? '260px'
                                : layoutMode === 'TWELVE_3X4_PER_PAGE'
                                ? '210px'
                                : layoutMode === 'EIGHT_PER_PAGE'
                                ? '210px'
                                : '175px',
                          }}
                        >
                          {/* Background Watermark Layer - subtle & safe for QR scanning */}
                          {watermarkMode !== 'NONE' && activeWatermark && (
                            <div
                              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
                              style={{ opacity: watermarkOpacity }}
                            >
                              <img
                                src={activeWatermark}
                                alt="Watermark"
                                className="object-contain max-w-[70%] max-h-[70%] filter grayscale contrast-125"
                                crossOrigin="anonymous"
                              />
                            </div>
                          )}

                          {/* Top: Header */}
                          <div className="text-center border-b border-slate-200 pb-1 shrink-0 relative z-10">
                            <div className="flex items-center justify-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-wide text-purple-900 leading-tight">
                              {systemLogoUrl ? (
                                <img
                                  src={systemLogoUrl}
                                  alt="MCU Logo"
                                  className="w-4 h-4 object-contain inline-block shrink-0 rounded-xs"
                                  crossOrigin="anonymous"
                                />
                              ) : (
                                <span>☸️</span>
                              )}
                              <span>{isEnglish ? 'Faculty of Buddhism • MCU' : 'คณะพุทธศาสตร์ มจร'}</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-800 leading-tight pt-0.5 truncate">
                              {isEnglish ? 'Annual Vipassana Meditation' : 'โครงการปฏิบัติวิปัสสนากัมมัฏฐาน'}
                            </div>
                          </div>

                          {/* Middle: Left Info + Right QR */}
                          <div className="py-1 flex items-center justify-between gap-2 flex-1 my-auto relative z-10">
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
                                layoutMode === 'TEN_PER_PAGE' || layoutMode === 'TWELVE_4X3_PER_PAGE' || layoutMode === 'TWELVE_3X4_PER_PAGE'
                                  ? 'text-[10.5px] sm:text-[11px]'
                                  : 'text-xs sm:text-[13px]'
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
                            <div className="shrink-0 flex flex-col items-center relative z-10">
                              {qrCodeUrls[reg.id] ? (
                                <div className="p-1 bg-white rounded-xl border border-slate-300 shadow-2xs">
                                  <img
                                    src={qrCodeUrls[reg.id]}
                                    alt={`QR ${reg.studentCode}`}
                                    className="object-contain block bg-white"
                                    style={{
                                      width:
                                        layoutMode === 'FOUR_PER_PAGE'
                                          ? '105px'
                                          : layoutMode === 'SIX_PER_PAGE'
                                          ? '82px'
                                          : layoutMode === 'NINE_3X3_PER_PAGE'
                                          ? '68px'
                                          : layoutMode === 'EIGHT_PER_PAGE'
                                          ? '68px'
                                          : layoutMode === 'TWELVE_4X3_PER_PAGE'
                                          ? '56px'
                                          : layoutMode === 'TWELVE_3X4_PER_PAGE'
                                          ? '54px'
                                          : '54px',
                                      height:
                                        layoutMode === 'FOUR_PER_PAGE'
                                          ? '105px'
                                          : layoutMode === 'SIX_PER_PAGE'
                                          ? '82px'
                                          : layoutMode === 'NINE_3X3_PER_PAGE'
                                          ? '68px'
                                          : layoutMode === 'EIGHT_PER_PAGE'
                                          ? '68px'
                                          : layoutMode === 'TWELVE_4X3_PER_PAGE'
                                          ? '56px'
                                          : layoutMode === 'TWELVE_3X4_PER_PAGE'
                                          ? '54px'
                                          : '54px',
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 bg-slate-100 rounded-md animate-pulse" />
                              )}
                              <span className="text-[7.5px] font-mono text-slate-500 mt-0.5">
                                SCAN PASS
                              </span>
                            </div>
                          </div>

                          {/* Bottom Footer */}
                          <div className="border-t border-slate-100 pt-0.5 text-[8.5px] text-slate-400 flex items-center justify-between shrink-0 relative z-10">
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
