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
  CheckCircle2,
  FileText,
} from 'lucide-react';
import type { StudentEvent, EventRegistration } from '@/types/event';

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
  const [layoutMode, setLayoutMode] = useState<'SIX_PER_PAGE' | 'FOUR_PER_PAGE'>('SIX_PER_PAGE');
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

  // Pre-generate QR codes for badges
  useEffect(() => {
    if (!isOpen || filteredRegistrations.length === 0) return;

    let isMounted = true;
    setIsGeneratingQr(true);

    async function generateCodes() {
      const urls: Record<string, string> = {};
      for (const reg of filteredRegistrations) {
        try {
          // Payload contains groupSpecificCode (or studentCode) for fast scanning
          const payload = (reg.groupSpecificCode || reg.studentCode).trim();
          const dataUrl = await QRCode.toDataURL(payload, {
            width: 250,
            margin: 1,
            color: {
              dark: '#1e1b4b',
              light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
          });
          urls[reg.id] = dataUrl;
        } catch (e) {
          console.error('Failed to generate QR code for', reg.studentCode, e);
        }
      }
      if (isMounted) {
        setQrCodeUrls(urls);
        setIsGeneratingQr(false);
      }
    }

    generateCodes();

    return () => {
      isMounted = false;
    };
  }, [isOpen, filteredRegistrations]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Container */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
              {event.title} • {filteredRegistrations.length} รูป/คน
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={isGeneratingQr}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
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
          <div className="flex flex-wrap items-center gap-3">
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
                <option value="ALL">ทุกกลุ่ม (ทั้งหมด {registrations.length} รูป/คน)</option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>
                    {g === 12 ? `กลุ่มที่ 12 (English Program)` : `กลุ่มที่ ${g}`}
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
                onChange={(e) => setLayoutMode(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-medium text-slate-800 focus:outline-none"
              >
                <option value="SIX_PER_PAGE">6 ป้ายต่อหน้า A4 (ขนาดมาตรฐาน 8.5 x 11 ซม.)</option>
                <option value="FOUR_PER_PAGE">4 ป้ายต่อหน้า A4 (ขนาดใหญ่ 10 x 14 ซม.)</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative min-w-[200px]">
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

          <div className="text-[11px] text-slate-500">
            แสดงผล <strong className="text-purple-700 font-bold">{filteredRegistrations.length}</strong> ใบ
            {isGeneratingQr && ' (กำลังสร้าง QR Code...)'}
          </div>
        </div>

        {/* PRINT STYLES */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #badges-print-area, #badges-print-area * {
              visibility: visible;
            }
            #badges-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 10mm;
            }
            .badge-page-break {
              break-after: page;
              page-break-after: always;
            }
          }
        `}</style>

        {/* BADGES CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60">
          <div id="badges-print-area" className="mx-auto max-w-[900px]">
            {filteredRegistrations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                ไม่พบนิสิตในกลุ่มที่เลือก หรือไม่มีรายการลงทะเบียน
              </div>
            ) : (
              <div
                className={`grid gap-4 ${
                  layoutMode === 'SIX_PER_PAGE'
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2'
                }`}
              >
                {filteredRegistrations.map((reg, index) => {
                  const gNum = reg.groupNumber || (reg.groupName ? parseInt(reg.groupName.replace(/\D/g, ''), 10) : undefined);
                  const isEnglish = reg.programType === 'ENGLISH' || gNum === 12;

                  return (
                    <div
                      key={reg.id}
                      className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-4 flex flex-col justify-between shadow-xs print:shadow-none print:border-solid print:border-black/50 hover:border-purple-300 transition"
                      style={{ minHeight: layoutMode === 'SIX_PER_PAGE' ? '300px' : '360px' }}
                    >
                      {/* Top Header */}
                      <div className="text-center border-b border-slate-200 pb-2">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-900">
                          {isEnglish ? 'Faculty of Buddhism • MCU' : 'คณะพุทธศาสตร์ มจร'}
                        </div>
                        <div className="text-[11px] font-bold text-slate-800 leading-tight">
                          {isEnglish ? 'Annual Vipassana Meditation' : 'โครงการปฏิบัติวิปัสสนากัมมัฏฐาน'}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {isEnglish ? 'Bodhiyan Mahavijjalai' : 'อาคารโพธิญาณมหาวิชชาลัย จ.นครปฐม'}
                        </div>
                      </div>

                      {/* Middle Body: Group & Info & QR */}
                      <div className="py-2 flex items-center justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          {/* Group Pill */}
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-xs font-black border border-purple-200">
                            <span>กลุ่ม :</span>
                            <span className="text-sm">{gNum || '-'}</span>
                          </div>

                          {/* Student Name */}
                          <div className="font-extrabold text-slate-900 text-sm leading-snug pt-1">
                            {reg.studentName}
                          </div>

                          {/* Group Specific Code & Student Code */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {reg.groupSpecificCode && (
                              <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-purple-700 text-white shadow-xs">
                                {reg.groupSpecificCode}
                              </span>
                            )}
                            <span className="font-mono font-bold text-xs text-purple-900">
                              {reg.studentCode}
                            </span>
                          </div>

                          {/* Vasa & Year */}
                          <div className="text-[10.5px] text-slate-600 flex flex-wrap gap-x-2">
                            {reg.vasa && <span>พรรษา: <strong>{reg.vasa}</strong></span>}
                            {reg.yearLevel && <span>ชั้นปี: <strong>{reg.yearLevel}</strong></span>}
                            {reg.major && <span className="truncate max-w-[140px]">สาขา: {reg.major}</span>}
                          </div>
                        </div>

                        {/* QR Code */}
                        <div className="shrink-0 flex flex-col items-center">
                          {qrCodeUrls[reg.id] ? (
                            <img
                              src={qrCodeUrls[reg.id]}
                              alt={`QR ${reg.studentCode}`}
                              className="w-20 h-20 sm:w-22 sm:h-22 rounded-lg border border-slate-200 p-0.5 bg-white"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-slate-100 rounded-lg animate-pulse" />
                          )}
                          <span className="text-[8.5px] font-mono text-slate-500 mt-0.5">
                            SCAN PASS
                          </span>
                        </div>
                      </div>

                      {/* Bottom Footer: Instructions */}
                      <div className="border-t border-slate-100 pt-2 text-[9px] text-slate-500 flex items-center justify-between">
                        <span>บัตรประจำตัวผู้เข้าปฏิบัติ</span>
                        <span className="font-mono font-bold text-slate-400">
                          #{String(index + 1).padStart(3, '0')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
