'use client';

import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Grid,
  FileDown,
  Image as ImageIcon,
  Printer,
  Search,
  Sparkles,
  Key,
  Loader2,
} from 'lucide-react';
import { UserAccount } from '@/types';
import { exportMultiPagePdf } from '@/lib/utils/pdf-export';
import { useWatermarkSettings } from '@/hooks/useWatermarkSettings';
import { STANDARD_POSITIONS } from './types';

interface VipassanaMasterSlipTabProps {
  currentMasters: UserAccount[];
}

export function VipassanaMasterSlipTab({ currentMasters }: VipassanaMasterSlipTabProps) {
  const { activeWatermark } = useWatermarkSettings({ initialOpacity: 0.10 });

  const [slipsLayout, setSlipsLayout] = useState<'ONE_PER_PAGE' | 'TWO_PER_PAGE' | 'FOUR_PER_PAGE' | 'SIX_PER_PAGE'>('SIX_PER_PAGE');
  const [slipsPositionFilter, setSlipsPositionFilter] = useState('ALL');
  const [slipsSearch, setSlipsSearch] = useState('');
  const [slipsQrCodes, setSlipsQrCodes] = useState<Record<string, string>>({});
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  // Generate QR Codes
  useEffect(() => {
    let isMounted = true;
    const generateSlipsQr = async () => {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const entries: Array<[string, string]> = [];

      for (const m of currentMasters) {
        const idKey = m.id || m.email;
        if (!idKey) continue;
        const loginUrl = `${origin}/login?email=${encodeURIComponent(m.email)}&role=VIPASSANA_MASTER`;
        try {
          const url = await QRCode.toDataURL(loginUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 256,
            color: {
              dark: '#581c87', // Sacred deep purple
              light: '#ffffff',
            },
          });
          entries.push([idKey, url]);
        } catch (e) {
          console.error('Error generating master QR', e);
        }
      }

      if (isMounted) {
        setSlipsQrCodes(Object.fromEntries(entries));
      }
    };

    generateSlipsQr();

    return () => {
      isMounted = false;
    };
  }, [currentMasters]);

  const slipsPerPage =
    slipsLayout === 'SIX_PER_PAGE'
      ? 6
      : slipsLayout === 'FOUR_PER_PAGE'
      ? 4
      : slipsLayout === 'TWO_PER_PAGE'
      ? 2
      : 1;

  const slipsFilteredMasters = useMemo(() => {
    return currentMasters.filter((m) => {
      if (slipsPositionFilter !== 'ALL') {
        const pos = m.instructorType || (m as any).position || 'พระวิปัสสนาจารย์';
        if (pos !== slipsPositionFilter) return false;
      }
      if (slipsSearch.trim()) {
        const q = slipsSearch.toLowerCase();
        return (
          (m.name || '').toLowerCase().includes(q) ||
          (m.nameEn || '').toLowerCase().includes(q) ||
          (m.email || '').toLowerCase().includes(q) ||
          (m.contactAddress || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [currentMasters, slipsPositionFilter, slipsSearch]);

  const slipsPages = useMemo(() => {
    const chunks: UserAccount[][] = [];
    for (let i = 0; i < slipsFilteredMasters.length; i += slipsPerPage) {
      chunks.push(slipsFilteredMasters.slice(i, i + slipsPerPage));
    }
    return chunks;
  }, [slipsFilteredMasters, slipsPerPage]);

  const handlePrintSlips = () => {
    try {
      window.print();
    } catch (err) {
      console.error('Print failed:', err);
      alert('ไม่สามารถเปิดคำสั่งพิมพ์ได้ กรุณาใช้ปุ่ม "บันทึก PDF" หรือ "บันทึกรูป PNG" แทน');
    }
  };

  const handleExportSlipsPdf = async () => {
    if (slipsPages.length === 0) return;
    setIsExportingPdf(true);
    setExportProgress('กำลังเตรียมข้อมูลเอกสาร PDF...');

    try {
      const pageElements = slipsPages
        .map((_, i) => document.getElementById(`master-slip-page-${i}`))
        .filter(Boolean) as HTMLElement[];

      await exportMultiPagePdf({
        pageElements,
        filename: `บัตรประจำตัวพระวิปัสสนาจารย์_คณะพุทธศาสตร์_มจร.pdf`,
        orientation: 'portrait',
        format: 'a4',
        scale: 2,
        onProgress: (msg) => setExportProgress(msg),
      });
    } catch (err) {
      console.error('Failed to export slips PDF:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExportingPdf(false);
      setExportProgress(null);
    }
  };

  const handleExportSlipsPng = async () => {
    if (slipsPages.length === 0) return;
    setIsExportingPng(true);
    setExportProgress('กำลังเตรียมรูปภาพ PNG...');

    try {
      const html2canvas = (await import('html2canvas-pro')).default;

      for (let i = 0; i < slipsPages.length; i++) {
        setExportProgress(`กำลังบันทึกรูปภาพ PNG หน้าที่ ${i + 1} จากทั้งหมด ${slipsPages.length} หน้า...`);
        const pageEl = document.getElementById(`master-slip-page-${i}`);
        if (!pageEl) continue;

        const screenHeaders = pageEl.querySelectorAll('.screen-only-header');
        screenHeaders.forEach((h) => ((h as HTMLElement).style.display = 'none'));

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
        screenHeaders.forEach((h) => ((h as HTMLElement).style.display = ''));

        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        const fileName =
          slipsPages.length === 1
            ? `บัตรประจำตัวพระวิปัสสนาจารย์.png`
            : `บัตรประจำตัวพระวิปัสสนาจารย์_หน้า_${i + 1}.png`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Failed to export slips PNG:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกภาพ PNG');
    } finally {
      setIsExportingPng(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Notification */}
      {exportProgress && (
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white px-4 py-2.5 rounded-2xl text-xs flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
            <span className="font-bold">{exportProgress}</span>
          </div>
          <span className="text-[11px] text-purple-200 hidden sm:inline">
            ⚡ ระบบกำลังสร้างเอกสารความละเอียดสูง (2x Retina) กรุณารอสักครู่...
          </span>
        </div>
      )}

      {/* Slips Control Toolbar (Hidden in Print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Layout Ratio Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Grid className="w-4 h-4 text-purple-600" />
              อัตราส่วนจัดพิมพ์:
            </span>
            <button
              type="button"
              onClick={() => setSlipsLayout('SIX_PER_PAGE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                slipsLayout === 'SIX_PER_PAGE'
                  ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              6 รูปต่อ A4 (6:1 บัตรมาตรฐาน)
            </button>
            <button
              type="button"
              onClick={() => setSlipsLayout('FOUR_PER_PAGE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                slipsLayout === 'FOUR_PER_PAGE'
                  ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              4 รูปต่อ A4 (4:1 ป้ายคล้องคอ)
            </button>
            <button
              type="button"
              onClick={() => setSlipsLayout('TWO_PER_PAGE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                slipsLayout === 'TWO_PER_PAGE'
                  ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              2 รูปต่อ A4 (2:1 บัตรทางการ)
            </button>
            <button
              type="button"
              onClick={() => setSlipsLayout('ONE_PER_PAGE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                slipsLayout === 'ONE_PER_PAGE'
                  ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              1 รูปต่อ A4 (1:1 เต็มหน้า)
            </button>
          </div>

          {/* Right: Export & Print Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportSlipsPdf}
              disabled={slipsFilteredMasters.length === 0 || isExportingPdf || isExportingPng}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
              title="บันทึกบัตรพระวิปัสสนาจารย์เป็นเอกสาร PDF ทุกหน้ารวมกัน"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>{isExportingPdf ? 'กำลังสร้าง PDF...' : 'บันทึก PDF (Save PDF)'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportSlipsPng}
              disabled={slipsFilteredMasters.length === 0 || isExportingPdf || isExportingPng}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
              title="บันทึกบัตรพระวิปัสสนาจารย์เป็นภาพ PNG ความคมชัดสูง"
            >
              {isExportingPng ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
              <span>{isExportingPng ? 'กำลังสร้างรูป...' : 'บันทึกรูป PNG (Save PNG)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintSlips}
              disabled={slipsFilteredMasters.length === 0 || isExportingPdf || isExportingPng}
              className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>สั่งพิมพ์ A4 (Print Now)</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 shrink-0">ตำแหน่ง:</span>
              <select
                value={slipsPositionFilter}
                onChange={(e) => setSlipsPositionFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 cursor-pointer"
              >
                <option value="ALL">-- ทุกตำแหน่ง ({currentMasters.length} รูป) --</option>
                {STANDARD_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={slipsSearch}
                onChange={(e) => setSlipsSearch(e.target.value)}
                placeholder="ค้นหาชื่อ, ฉายา, วัด..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
              />
            </div>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            แสดงผล <strong>{slipsFilteredMasters.length}</strong> จาก {currentMasters.length} รูป (แบ่งเป็น {slipsPages.length} หน้า A4)
          </span>
        </div>
      </div>

      {/* Printable Sheet View */}
      <div className="space-y-6 bg-slate-200/60 p-3 sm:p-6 rounded-2xl border border-slate-300/80 max-h-[68vh] overflow-y-auto">
        {slipsPages.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center text-slate-400 font-medium text-xs">
            ไม่พบข้อมูลพระวิปัสสนาจารย์ที่ตรงกับเงื่อนไขการค้นหา
          </div>
        ) : (
          slipsPages.map((pageChunk, pageIndex) => (
            <div
              key={`page-${pageIndex}`}
              id={`master-slip-page-${pageIndex}`}
              className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-300 mx-auto max-w-[210mm] min-h-[297mm] flex flex-col justify-between print:m-0 print:p-4 print:shadow-none print:border-none print:max-w-none print:w-full print:min-h-0 page-break-after-always"
              style={{ boxSizing: 'border-box' }}
            >
              {/* Screen-only page indicator */}
              <div className="screen-only-header pb-3 mb-2 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 print:hidden">
                <span>หน้า {pageIndex + 1} จากทั้งหมด {slipsPages.length} หน้า</span>
                <span className="text-purple-700">โครงการปฏิบัติวิปัสสนากัมมัฏฐาน นิสิตคณะพุทธศาสตร์</span>
              </div>

              {/* Cards Grid */}
              <div
                className={`grid gap-3 sm:gap-4 flex-1 ${
                  slipsLayout === 'SIX_PER_PAGE'
                    ? 'grid-cols-2 grid-rows-3'
                    : slipsLayout === 'FOUR_PER_PAGE'
                    ? 'grid-cols-2 grid-rows-2'
                    : slipsLayout === 'TWO_PER_PAGE'
                    ? 'grid-cols-1 grid-rows-2'
                    : 'grid-cols-1 grid-rows-1'
                }`}
              >
                {pageChunk.map((m, cardIdx) => {
                  const overallIndex = pageIndex * slipsPerPage + cardIdx;
                  const qrData = slipsQrCodes[m.id || m.email];
                  const positionLabel = m.instructorType || (m as any).position || 'พระวิปัสสนาจารย์';

                  return (
                    <div
                      key={m.id || m.email || overallIndex}
                      className="border-2 border-purple-300/90 rounded-2xl p-3 sm:p-4 bg-gradient-to-b from-purple-50/40 via-white to-purple-50/20 flex flex-col justify-between relative overflow-hidden shadow-xs hover:border-purple-400 transition"
                      style={{
                        minHeight: slipsLayout === 'SIX_PER_PAGE' ? '82mm' : slipsLayout === 'FOUR_PER_PAGE' ? '125mm' : 'auto',
                      }}
                    >
                      {/* Watermark Emblem in Background */}
                      {activeWatermark && (
                        <div
                          className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-7 select-none z-0"
                          style={{
                            backgroundImage: `url(${activeWatermark})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            backgroundSize: '48%',
                          }}
                        />
                      )}

                      {/* Header Section */}
                      <div className="border-b border-purple-200/90 pb-1.5 shrink-0 relative z-10">
                        <div className="flex items-center gap-2">
                          <img
                            src={activeWatermark || '/logo.png'}
                            alt="MCU Logo"
                            className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] sm:text-[11px] font-extrabold text-slate-800 leading-tight">
                              คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                            </div>
                            <div className="text-[8.5px] sm:text-[9.5px] text-purple-900 font-semibold leading-tight">
                              โครงการปฏิบัติวิปัสสนากัมมัฏฐาน ประจำปี ๒๕๖๙
                            </div>
                          </div>
                        </div>

                        {/* Position Badge Under Header Title */}
                        <div className="mt-1.5 flex items-center">
                          <span className="text-[8.5px] sm:text-[10px] font-bold text-purple-900 bg-purple-100/90 px-2 py-0.5 rounded-full border border-purple-300/80 shadow-2xs">
                            {positionLabel}
                          </span>
                        </div>
                      </div>

                      {/* Master Name & Details */}
                      <div className="space-y-0.5 my-auto shrink-0 relative z-10">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <h4 className={`font-black text-slate-900 ${slipsLayout === 'SIX_PER_PAGE' ? 'text-xs sm:text-[13.5px]' : 'text-sm sm:text-base'} leading-snug tracking-tight`}>
                            {m.name}
                          </h4>
                          {m.ecclesiasticalTitle && (
                            <span className="text-[9px] sm:text-[10.5px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                              {m.ecclesiasticalTitle}
                            </span>
                          )}
                        </div>
                        {m.nameEn && (
                          <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium italic">
                            {m.nameEn}
                          </div>
                        )}
                        <div className="text-[9px] sm:text-[10px] text-slate-600 flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="font-semibold text-slate-700">สังกัด/ที่อยู่:</span>
                          <span className="truncate">{m.contactAddress || m.department || 'ฝ่ายวิปัสสนาธุระ / คณะพุทธศาสตร์ มจร'}</span>
                        </div>
                      </div>

                      {/* Workload Brief Box */}
                      <div className={`bg-purple-50/70 border border-purple-200/80 rounded-xl ${slipsLayout === 'SIX_PER_PAGE' ? 'p-1.5 text-[9px]' : 'p-2 text-[10px]'} text-purple-950 space-y-0.5 shrink-0 relative z-10`}>
                        <div className="font-bold flex items-center gap-1.5 text-purple-900">
                          <Sparkles className={`${slipsLayout === 'SIX_PER_PAGE' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-purple-600 shrink-0`} />
                          <span className="leading-tight">ภาระงาน: สอบอารมณ์สติปัฏฐาน ๔ และประเมินผลการปฏิบัติธรรม</span>
                        </div>
                        <p className={`${slipsLayout === 'SIX_PER_PAGE' ? 'text-[8.5px]' : 'text-[9.5px]'} text-purple-800/90 leading-tight`}>
                          รับผิดชอบตรวจอารมณ์กรรมฐาน (กาย เวทนา จิต ธรรม) ณ อาคารโพธิญาณมหาวิชชาลัย
                        </p>
                      </div>

                      {/* Credentials & Quick Scan Login QR Box */}
                      <div className={`bg-white/95 rounded-xl border border-slate-200/90 ${slipsLayout === 'SIX_PER_PAGE' ? 'p-1.5 my-auto' : 'p-2.5 my-auto'} flex items-center justify-between gap-2 shadow-2xs relative z-10`}>
                        <div className={`space-y-0.5 sm:space-y-1 ${slipsLayout === 'SIX_PER_PAGE' ? 'text-[9.5px]' : 'text-[10.5px]'} flex-1 min-w-0`}>
                          <div className="text-[8.5px] sm:text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                            <Key className="w-3 h-3 text-amber-600" />
                            <span>ข้อมูลสำหรับเข้าสู่ระบบ:</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-slate-500 font-medium shrink-0">ไอดี:</span>
                            <span className="font-mono font-black text-amber-950 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80 text-[10px] sm:text-[11px] truncate">
                              {m.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium shrink-0">รหัสผ่าน:</span>
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 text-[9.5px] sm:text-[10.5px]">
                              {m.defaultPassword || m.password || 'mcu123456'}
                            </span>
                          </div>
                        </div>

                        {/* QR Code Box */}
                        <div className="flex flex-col items-center shrink-0">
                          {qrData ? (
                            <div className="p-0.5 sm:p-1 bg-white rounded-lg sm:rounded-xl border border-purple-200 shadow-2xs">
                              <img
                                src={qrData}
                                alt={`QR ${m.name}`}
                                className={`${slipsLayout === 'SIX_PER_PAGE' ? 'w-12 h-12 sm:w-13 sm:h-13' : 'w-16 h-16 sm:w-18 sm:h-18'} object-contain block bg-white`}
                              />
                            </div>
                          ) : (
                            <div className={`${slipsLayout === 'SIX_PER_PAGE' ? 'w-12 h-12' : 'w-16 h-16'} bg-purple-50 rounded-lg animate-pulse border border-purple-200`} />
                          )}
                          <span className="text-[7px] sm:text-[7.5px] font-bold text-purple-900 tracking-tight mt-0.5 text-center leading-tight">
                            สแกนเข้าระบบด่วน
                          </span>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="border-t border-slate-200/80 pt-1 text-[8px] sm:text-[8.5px] text-slate-400 flex items-center justify-between shrink-0 relative z-10">
                        <span className="font-medium text-slate-500 truncate">
                          คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                        </span>
                        <span className="font-mono font-bold text-purple-900 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 shrink-0 ml-1">
                          #VIP-{String(overallIndex + 1).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
