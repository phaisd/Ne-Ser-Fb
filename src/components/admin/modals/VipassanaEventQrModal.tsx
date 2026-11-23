'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Copy,
  CheckCircle2,
  Printer,
  Camera,
  Award,
  ExternalLink,
  Smartphone,
  Sparkles,
  Calendar,
  MapPin,
  ScanLine,
  Layers,
  FileText,
} from 'lucide-react';
import type { StudentEvent } from '@/types';

interface VipassanaEventQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent | null;
}

export const VipassanaEventQrModal: React.FC<VipassanaEventQrModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [smartQrDataUrl, setSmartQrDataUrl] = useState<string>('');
  const [scanQrDataUrl, setScanQrDataUrl] = useState<string>('');
  const [interviewQrDataUrl, setInterviewQrDataUrl] = useState<string>('');
  const [seatScanQrDataUrl, setSeatScanQrDataUrl] = useState<string>('');
  const [seatingQrDataUrl, setSeatingQrDataUrl] = useState<string>('');
  const [copiedMode, setCopiedMode] = useState<string | null>(null);

  // Print Layout States
  const [printLayout, setPrintLayout] = useState<'TWO_PAGES' | 'ONE_PAGE'>('TWO_PAGES');
  const [pageOrientation, setPageOrientation] = useState<'LANDSCAPE' | 'PORTRAIT'>('LANDSCAPE');

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://ne-ser-fb.vercel.app';

  const smartUrl = event
    ? `${origin}/admin?tab=EVENTS&eventId=${encodeURIComponent(event.id)}&action=AUTO`
    : '';
  const scanUrl = event
    ? `${origin}/admin?tab=EVENTS&eventId=${encodeURIComponent(event.id)}&action=SCAN`
    : '';
  const interviewUrl = event
    ? `${origin}/admin?tab=EVENTS&eventId=${encodeURIComponent(event.id)}&action=INTERVIEW`
    : '';
  const seatScanUrl = event
    ? `${origin}/admin?tab=EVENTS&eventId=${encodeURIComponent(event.id)}&action=SEAT_SCAN`
    : '';
  const seatingUrl = event
    ? `${origin}/events/seating?eventId=${encodeURIComponent(event.id)}`
    : '';

  useEffect(() => {
    if (!isOpen || !event) return;
    let active = true;

    // High resolution (width: 500) for pin-sharp printing
    Promise.all([
      QRCode.toDataURL(smartUrl, {
        width: 500,
        margin: 1,
        color: { dark: '#1e1b4b', light: '#ffffff' },
      }),
      QRCode.toDataURL(scanUrl, {
        width: 500,
        margin: 1,
        color: { dark: '#064e3b', light: '#ffffff' },
      }),
      QRCode.toDataURL(interviewUrl, {
        width: 500,
        margin: 1,
        color: { dark: '#78350f', light: '#ffffff' },
      }),
      QRCode.toDataURL(seatScanUrl, {
        width: 500,
        margin: 1,
        color: { dark: '#047857', light: '#ffffff' },
      }),
      QRCode.toDataURL(seatingUrl, {
        width: 500,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      }),
    ])
      .then(([smart, scan, interview, seatScan, seating]) => {
        if (!active) return;
        setSmartQrDataUrl(smart);
        setScanQrDataUrl(scan);
        setInterviewQrDataUrl(interview);
        setSeatScanQrDataUrl(seatScan);
        setSeatingQrDataUrl(seating);
      })
      .catch((err) => console.error('QR generation failed:', err));

    return () => {
      active = false;
    };
  }, [isOpen, event, smartUrl, scanUrl, interviewUrl, seatScanUrl, seatingUrl]);

  if (!isOpen || !event) return null;

  const handleCopyText = async (text: string, mode: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMode(mode);
      setTimeout(() => setCopiedMode(null), 2500);
    } catch {
      alert('ไม่สามารถคัดลอกได้ กรุณาคัดลอกจากลิงก์โดยตรง');
    }
  };

  const dateRange =
    event.startDate && event.endDate && event.startDate !== event.endDate
      ? `${new Date(event.startDate).toLocaleDateString('th-TH')} - ${new Date(event.endDate).toLocaleDateString('th-TH')}`
      : event.startDate
      ? new Date(event.startDate).toLocaleDateString('th-TH')
      : 'ตามกำหนดการโครงการ';

  const handleCopyLineSummary = () => {
    const message = [
      `☸️ แจ้งลิงก์เข้าระบบปฏิบัติงานบนมือถือ (ประจำโครงการ)`,
      `📌 โครงการ: ${event.title}`,
      `📅 วันที่: ${dateRange}`,
      `📍 สถานที่: ${event.location || 'อาคารโพธิญาณมหาวิชชาลัย จ.นครปฐม'}`,
      ``,
      `🔗 1) ลิงก์รวมอัจฉริยะ (พาเข้าหน้าตามบทบาทอัตโนมัติ):`,
      `${smartUrl}`,
      ``,
      `📷 2) สำหรับอาจารย์/เจ้าหน้าที่ผู้ดูแล (เปิดหน้าสแกนเช็คชื่อ 4 รอบ & เลือกกลุ่ม):`,
      `${scanUrl}`,
      ``,
      `🧘 3) สำหรับพระวิปัสสนาจารย์ (เปิดหน้าสอบอารมณ์สติปัฏฐาน 4 & สแกนป้ายชื่อด่วน):`,
      `${interviewUrl}`,
      ``,
      `🎫 4) สำหรับเจ้าหน้าที่จุดทางเข้าห้อง (เปิดจุดสแกนตรวจเช็คผู้เข้าที่นั่งบนมือถือ):`,
      `${seatScanUrl}`,
      ``,
      `🪑 5) สำหรับผู้เข้าร่วม (สแกนค้นหาที่นั่ง & ดูผังห้องจริงด้วยตนเอง ไม่ต้องล็อกอิน):`,
      `${seatingUrl}`,
      ``,
      `💡 วิธีใช้งานบนมือถือ: กดลิงก์หรือสแกน QR Code -> เข้าสู่ระบบ -> เปิดกล้องสแกนป้ายคล้องคอนิสิตหรือตรวจสอบที่นั่งได้ทันที`,
    ].join('\n');

    handleCopyText(message, 'LINE_ALL');
  };

  // -------------------------------------------------------------
  // Card Configurations
  // -------------------------------------------------------------
  const cardsConfig = {
    SMART: {
      badgeText: 'แนะนำ • QR เดียวใช้ได้ทุกบทบาท',
      badgeBg: 'bg-indigo-600 text-white',
      badgeIcon: <Sparkles className="w-3 h-3 text-amber-300" />,
      title: 'QR เข้าระบบอัตโนมัติตามสิทธิ์',
      titleColor: 'text-indigo-950',
      description:
        'สแกนแล้วระบบตรวจสอบสิทธิ์ให้อัตโนมัติ: พระวิปัสสนาจารย์ เข้าหน้าสอบอารมณ์ / อาจารย์และเจ้าหน้าที่ เข้าหน้าสแกนเช็คชื่อ',
      borderColor: 'border-2 border-indigo-400',
      bgGradient: 'bg-gradient-to-b from-indigo-50/70 via-white to-indigo-50/30',
      qrDataUrl: smartQrDataUrl,
      qrBorder: 'border-indigo-200',
      scanHint: 'สแกนด้วยกล้องมือถือหรือแอป LINE',
      hintColor: 'text-indigo-800',
      url: smartUrl,
      copyKey: 'SMART',
      copyLabel: 'คัดลอกลิงก์รวมโครงการนี้',
      btnBg: 'bg-indigo-600 hover:bg-indigo-700',
    },
    SCAN: {
      badgeText: 'สำหรับอาจารย์ & เจ้าหน้าที่ผู้ดูแล',
      badgeBg: 'bg-emerald-600 text-white',
      badgeIcon: <Camera className="w-3 h-3" />,
      title: 'หน้าสแกนตรวจเช็คชื่อ 4 รอบ',
      titleColor: 'text-emerald-950',
      description:
        'เปิดตรงไปหน้า จุดสแกนเช็คชื่อสด สามารถเลือกกลุ่มที่ท่านดูแล แล้วเปิดกล้องมือถือสแกนป้ายคล้องคอนิสิตหรือติ๊กเช็คชื่อรายกลุ่มทันที',
      borderColor: 'border-2 border-emerald-400',
      bgGradient: 'bg-gradient-to-b from-emerald-50/70 via-white to-emerald-50/30',
      qrDataUrl: scanQrDataUrl,
      qrBorder: 'border-emerald-200',
      scanHint: 'เข้าหน้าสแกนเช็คชื่อ 4 รอบทันที',
      hintColor: 'text-emerald-800',
      url: scanUrl,
      copyKey: 'SCAN',
      copyLabel: 'คัดลอกลิงก์สแกนเช็คชื่อ',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700',
    },
    INTERVIEW: {
      badgeText: 'สำหรับพระวิปัสสนาจารย์',
      badgeBg: 'bg-amber-600 text-white',
      badgeIcon: <Award className="w-3 h-3" />,
      title: 'หน้าสอบอารมณ์สติปัฏฐาน 4',
      titleColor: 'text-amber-950',
      description:
        'เปิดตรงไปหน้า สอบอารมณ์สติปัฏฐาน 4 สามารถเลือกกลุ่มที่ดูแล หรือกดปุ่ม "สแกน QR" ส่องป้ายชื่อนิสิตเพื่อบันทึกผลสอบอารมณ์ทันที',
      borderColor: 'border-2 border-amber-400',
      bgGradient: 'bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30',
      qrDataUrl: interviewQrDataUrl,
      qrBorder: 'border-amber-200',
      scanHint: 'เข้าหน้าสอบอารมณ์สติปัฏฐาน 4 ทันที',
      hintColor: 'text-amber-800',
      url: interviewUrl,
      copyKey: 'INTERVIEW',
      copyLabel: 'คัดลอกลิงก์สอบอารมณ์',
      btnBg: 'bg-amber-600 hover:bg-amber-700',
    },
    SEAT_SCAN: {
      badgeText: 'สำหรับเจ้าหน้าที่จุดเข้าห้อง',
      badgeBg: 'bg-teal-700 text-white',
      badgeIcon: <ScanLine className="w-3 h-3 text-teal-200" />,
      title: 'สแกนตรวจเช็คผู้เข้าที่นั่ง',
      titleColor: 'text-teal-950',
      description:
        'เปิดตรงไปหน้า จุดสแกนเช็คชื่อเข้าที่นั่ง ส่องป้ายคล้องคอเพื่อตรวจเช็คอินและแจ้งเลขที่นั่ง/แถวทันที',
      borderColor: 'border-2 border-teal-400',
      bgGradient: 'bg-gradient-to-b from-teal-50/70 via-white to-teal-50/30',
      qrDataUrl: seatScanQrDataUrl,
      qrBorder: 'border-teal-200',
      scanHint: 'เข้าหน้าสแกนเช็คอินที่นั่งทันที',
      hintColor: 'text-teal-800',
      url: seatScanUrl,
      copyKey: 'SEAT_SCAN',
      copyLabel: 'คัดลอกลิงก์สแกนที่นั่ง',
      btnBg: 'bg-teal-700 hover:bg-teal-800',
    },
    SEATING: {
      badgeText: 'สำหรับผู้เข้าร่วม • ไม่ต้องล็อกอิน',
      badgeBg: 'bg-slate-900 text-amber-300',
      badgeIcon: <MapPin className="w-3 h-3 text-amber-400" />,
      title: 'จุดค้นหาผังที่นั่งตนเอง',
      titleColor: 'text-slate-950',
      description:
        'ติดป้ายหน้าหอประชุม ให้ผู้เข้าร่วมสแกนเพื่อหาที่นั่งและดูผังห้องจริงด้วยตนเอง',
      borderColor: 'border-2 border-slate-400',
      bgGradient: 'bg-gradient-to-b from-slate-50/70 via-white to-slate-50/30',
      qrDataUrl: seatingQrDataUrl,
      qrBorder: 'border-slate-300',
      scanHint: 'สแกนเพื่อค้นหาที่นั่งตนเอง',
      hintColor: 'text-slate-600',
      url: seatingUrl,
      copyKey: 'SEATING',
      copyLabel: 'คัดลอกลิงก์ผังที่นั่ง',
      btnBg: 'bg-slate-900 hover:bg-slate-800',
    },
  };

  // Helper to render an individual QR Card
  const renderCard = (
    type: keyof typeof cardsConfig,
    variant: 'compact' | 'normal' | 'large' = 'normal'
  ) => {
    const cfg = cardsConfig[type];

    const paddingClass =
      variant === 'compact'
        ? 'p-2.5 print:p-2'
        : variant === 'large'
        ? 'p-5 print:p-4'
        : 'p-4 print:p-3';

    const spaceClass =
      variant === 'compact'
        ? 'space-y-1.5 print:space-y-1'
        : variant === 'large'
        ? 'space-y-3 print:space-y-2'
        : 'space-y-2.5 print:space-y-1.5';

    const qrSizeClass =
      variant === 'compact'
        ? 'w-28 h-28 print:w-26 print:h-26'
        : variant === 'large'
        ? 'w-52 h-52 print:w-44 print:h-44'
        : 'w-44 h-44 print:w-36 print:h-36';

    const titleSizeClass =
      variant === 'compact'
        ? 'text-xs font-black'
        : variant === 'large'
        ? 'text-base sm:text-lg font-black'
        : 'text-sm font-extrabold';

    const descSizeClass =
      variant === 'compact'
        ? 'text-[10px] leading-snug line-clamp-2'
        : variant === 'large'
        ? 'text-xs leading-relaxed text-slate-700'
        : 'text-[11px] text-slate-600 leading-relaxed';

    return (
      <div
        key={type}
        className={`rounded-2xl ${cfg.borderColor} ${cfg.bgGradient} ${paddingClass} flex flex-col justify-between ${spaceClass} shadow-xs print:shadow-none page-break-inside-avoid print:break-inside-avoid transition`}
      >
        <div className="space-y-1 text-center">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${cfg.badgeBg}`}
          >
            {cfg.badgeIcon}
            <span>{cfg.badgeText}</span>
          </span>
          <h4 className={`${titleSizeClass} ${cfg.titleColor}`}>{cfg.title}</h4>
          <p className={descSizeClass}>{cfg.description}</p>
        </div>

        <div className="flex flex-col items-center justify-center py-1">
          {cfg.qrDataUrl ? (
            <img
              src={cfg.qrDataUrl}
              alt={cfg.title}
              className={`${qrSizeClass} rounded-2xl border-2 ${cfg.qrBorder} bg-white p-2 shadow-xs object-contain`}
            />
          ) : (
            <div
              className={`${qrSizeClass} rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400`}
            >
              กำลังสร้าง QR...
            </div>
          )}
          <span className={`text-[10px] font-bold ${cfg.hintColor} mt-1 text-center`}>
            {cfg.scanHint}
          </span>
        </div>

        <div className="space-y-1 print:hidden pt-1">
          <button
            type="button"
            onClick={() => handleCopyText(cfg.url, cfg.copyKey)}
            className={`w-full py-1.5 px-3 rounded-xl ${cfg.btnBg} text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs`}
          >
            {copiedMode === cfg.copyKey ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>คัดลอกลิงก์แล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{cfg.copyLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in print:p-0 print:bg-white print:static print:block print:overflow-visible">
      {/* Dynamic Print CSS to prevent cutoff */}
      <style>{`
        @media print {
          @page {
            size: ${pageOrientation === 'LANDSCAPE' ? 'A4 landscape' : 'A4 portrait'};
            margin: ${printLayout === 'ONE_PAGE' ? '6mm 6mm' : '8mm 10mm'};
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break-after-always {
            break-after: page !important;
            page-break-after: always !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl max-w-7xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-h-none print:w-full print:static print:block print:overflow-visible print:h-auto">
        {/* Header (Screen only) */}
        <div className="print:hidden px-4 sm:px-6 py-4 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <QrCode className="w-6 h-6 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                  QR Code & ลิงก์ด่วนเข้าหน้าปฏิบัติงานบนมือถือ (แยกประจำโครงการ)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 shrink-0">
                  Mobile Direct Access
                </span>
              </div>
              <p className="text-xs text-purple-200 truncate">{event.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLineSummary}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="คัดลอกข้อความพร้อมลิงก์ของโครงการนี้สำหรับส่งเข้ากลุ่ม LINE"
            >
              {copiedMode === 'LINE_ALL' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>คัดลอกข้อความ LINE แล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกส่ง LINE</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="พิมพ์ใบ QR Code ประจำโครงการ"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>สั่งพิมพ์เอกสาร</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Configuration Controls Bar (Screen Only) */}
        <div className="print:hidden px-4 sm:px-6 py-2.5 bg-indigo-50/90 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-indigo-950 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>จัดหน้ากระดาษ A4 สำหรับพิมพ์:</span>
            </span>
            <div className="inline-flex rounded-xl bg-white p-1 border border-indigo-200 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setPrintLayout('TWO_PAGES');
                  setPageOrientation('LANDSCAPE');
                }}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  printLayout === 'TWO_PAGES'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📑 แยก 2 แผ่น A4 (แนะนำ • QR ใหญ่คมชัด สมบูรณ์ 100%)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintLayout('ONE_PAGE');
                  setPageOrientation('LANDSCAPE');
                }}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  printLayout === 'ONE_PAGE'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-50'
                }`}
              >
                <span>📄 รวมใน 1 แผ่น A4 (แนวนอน กะทัดรัด)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">แนวกระดาษ:</span>
            <div className="inline-flex rounded-xl bg-white p-1 border border-indigo-200 shadow-2xs text-[11px]">
              <button
                type="button"
                onClick={() => setPageOrientation('LANDSCAPE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  pageOrientation === 'LANDSCAPE'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                ↔ แนวนอน
              </button>
              <button
                type="button"
                onClick={() => setPageOrientation('PORTRAIT')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  pageOrientation === 'PORTRAIT'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                ↕ แนวตั้ง
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body / Printable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 print:p-0 print:overflow-visible">
          {/* ============================================================= */}
          {/* OPTION A: 2-PAGE LAYOUT (Recommended - Large, Complete, No Cutoff) */}
          {/* ============================================================= */}
          {printLayout === 'TWO_PAGES' ? (
            <div className="space-y-8 print:space-y-0">
              {/* PAGE 1: STAFF & VIPASSANA MASTERS */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 print:p-0 print:border-none print:shadow-none space-y-4">
                {/* Page 1 Header */}
                <div className="text-center space-y-1.5 border-b border-slate-200 pb-3.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold inline-flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                      <span>จุดสแกนเข้าระบบปฏิบัติงานด้วยสมาร์ทโฟน</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[11px] font-black border border-indigo-200">
                      📄 แผ่นที่ 1: สำหรับพระวิปัสสนาจารย์ และ อาจารย์/เจ้าหน้าที่ผู้ดูแล
                    </span>
                  </div>
                  <h2 className="text-base sm:text-xl font-black text-slate-900">{event.title}</h2>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>{dateRange}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{event.location || 'อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย จ.นครปฐม'}</span>
                    </span>
                  </div>
                </div>

                {/* Page 1 Cards (3 Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-4">
                  {renderCard('SMART', 'normal')}
                  {renderCard('SCAN', 'normal')}
                  {renderCard('INTERVIEW', 'normal')}
                </div>

                {/* Page 1 Footer: Instructions */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ขั้นตอนการปฏิบัติงาน:</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-0.5">
                    <div>1. สแกน QR ด้วยกล้องมือถือ/LINE เพื่อเข้าสู่ระบบ</div>
                    <div>2. เลือกรอบเวลาหรือกลุ่มที่ท่านรับผิดชอบ</div>
                    <div>3. กดเปิดกล้องสแกนป้ายคล้องคอของนิสิตเพื่อบันทึกทันที</div>
                  </div>
                </div>
              </div>

              {/* Page Break for Printing */}
              <div className="hidden print:block page-break-after-always" />

              {/* PAGE 2: SEATING CHECK-IN & ATTENDEE LOOKUP */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 print:p-0 print:border-none print:shadow-none space-y-4">
                {/* Page 2 Header */}
                <div className="text-center space-y-1.5 border-b border-slate-200 pb-3.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold inline-flex items-center gap-1.5">
                      <ScanLine className="w-3.5 h-3.5 text-teal-600" />
                      <span>จุดตรวจเช็คที่นั่ง & ค้นหาผังห้องจริง</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 text-[11px] font-black border border-teal-200">
                      📄 แผ่นที่ 2: สำหรับจุดทางเข้าห้องประชุม & ผู้เข้าร่วมโครงการ
                    </span>
                  </div>
                  <h2 className="text-base sm:text-xl font-black text-slate-900">{event.title}</h2>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>{dateRange}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{event.location || 'อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย จ.นครปฐม'}</span>
                    </span>
                  </div>
                </div>

                {/* Page 2 Cards (2 Cards - Large Extra Clear QR) */}
                <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-5 max-w-4xl mx-auto">
                  {renderCard('SEAT_SCAN', 'large')}
                  {renderCard('SEATING', 'large')}
                </div>

                {/* Page 2 Footer: Attendee Guidance */}
                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-950 space-y-1 max-w-4xl mx-auto">
                  <div className="font-extrabold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-700" />
                    <span>คำแนะนำสำหรับนิสิตและผู้เข้าร่วมโครงการ:</span>
                  </div>
                  <p className="text-[11.5px] text-teal-800 leading-relaxed">
                    ส่องกล้องมือถือสแกนที่ป้าย <strong>&quot;จุดค้นหาผังที่นั่งตนเอง&quot;</strong>{' '}
                    เพื่อเปิดดูแผนผังหอประชุม รู้แถวและตำแหน่งที่นั่งของตนเองได้ทันทีโดยไม่ต้องเข้าสู่ระบบ
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================= */
            /* OPTION B: 1-PAGE COMPACT LAYOUT (All 5 Cards on single A4) */
            /* ============================================================= */
            <div className="bg-white rounded-2xl border border-slate-200 p-4 print:p-0 print:border-none print:shadow-none space-y-3">
              {/* Single Page Header */}
              <div className="text-center space-y-1 border-b border-slate-200 pb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
                  <Smartphone className="w-3 h-3 text-amber-600" />
                  <span>จุดสแกนเข้าระบบปฏิบัติงานด้วยสมาร์ทโฟน (แยกประจำโครงการ)</span>
                </div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                  {event.title}
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-3 text-[10.5px] text-slate-600">
                  <span>📅 {dateRange}</span>
                  <span>📍 {event.location || 'อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย จ.นครปฐม'}</span>
                </div>
              </div>

              {/* All 5 Cards in 1 Row (Compact size) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 print:grid-cols-5 gap-2">
                {renderCard('SMART', 'compact')}
                {renderCard('SCAN', 'compact')}
                {renderCard('INTERVIEW', 'compact')}
                {renderCard('SEAT_SCAN', 'compact')}
                {renderCard('SEATING', 'compact')}
              </div>

              {/* Single Page Footer note */}
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 text-center">
                💡 สแกน QR ด้วยกล้องสมาร์ทโฟนหรือแอป LINE เพื่อเข้าสู่ระบบและเปิดกล้องสแกนป้ายคล้องคอได้ทันที
              </div>
            </div>
          )}
        </div>

        {/* Footer (Screen only) */}
        <div className="print:hidden px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 text-xs shrink-0">
          <a
            href={smartUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-bold underline"
          >
            <span>ทดสอบเปิดลิงก์ด่วนของโครงการนี้</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>พิมพ์เอกสาร A4</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300/80 text-slate-800 font-bold transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
