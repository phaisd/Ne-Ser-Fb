'use client';

import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  X,
  FileSpreadsheet,
  GraduationCap,
  Scissors,
  CheckCircle2,
  Key,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { Student, SystemSettings } from '@/types';

interface BatchStudentAccessSlipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  selectedStudentCodes?: Set<string>;
  settings?: Partial<SystemSettings>;
}

export const BatchStudentAccessSlipsModal: React.FC<BatchStudentAccessSlipsModalProps> = ({
  isOpen,
  onClose,
  students = [],
  selectedStudentCodes = new Set(),
  settings,
}) => {
  const [filterYear, setFilterYear] = useState<string>('1'); // Default to Year 1 (New students)
  const [filterProgram, setFilterProgram] = useState<string>('ALL');
  const [useSelectedOnly, setUseSelectedOnly] = useState<boolean>(selectedStudentCodes.size > 0);
  const [cardsPerPage, setCardsPerPage] = useState<'4' | '2' | '1'>('4');
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  // Filter students based on controls
  const displayStudents = useMemo(() => {
    return students.filter((s) => {
      if (useSelectedOnly && selectedStudentCodes.size > 0) {
        if (!selectedStudentCodes.has(s.studentCode)) return false;
      }
      if (filterYear !== 'ALL') {
        if (String(s.yearLevel ?? '') !== filterYear) return false;
      }
      if (filterProgram === 'THAI') {
        const isEng = s.programType === 'ENGLISH' || (s.nationality && s.nationality !== 'ไทย' && s.nationality !== 'Thai');
        if (isEng) return false;
      } else if (filterProgram === 'ENGLISH') {
        const isEng = s.programType === 'ENGLISH' || (s.nationality && s.nationality !== 'ไทย' && s.nationality !== 'Thai');
        if (!isEng) return false;
      }
      return true;
    });
  }, [students, filterYear, filterProgram, useSelectedOnly, selectedStudentCodes]);

  // Generate QR codes for visible students (up to 120 per batch for performance)
  useEffect(() => {
    if (!isOpen || displayStudents.length === 0) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ne-ser-fb.vercel.app';
    const batch = displayStudents.slice(0, 150);
    const promises = batch.map(async (s) => {
      try {
        const loginUrl = `${origin}/login?code=${s.studentCode}`;
        const url = await QRCode.toDataURL(loginUrl, { width: 140, margin: 1 });
        return { code: s.studentCode, url };
      } catch {
        return null;
      }
    });

    Promise.all(promises).then((results) => {
      const map: Record<string, string> = {};
      results.forEach((r) => {
        if (r) map[r.code] = r.url;
      });
      setQrMap(map);
    });
  }, [isOpen, displayStudents]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['รหัสนิสิต', 'ชื่อ-นามสกุล', 'ระดับการศึกษา', 'สาขาวิชา', 'ชั้นปี', 'หลักสูตร', 'Username', 'Default Password', 'Email'];
    const rows = displayStudents.map((s) => {
      const name = [s.title, s.firstName, s.lastName].filter(Boolean).join(' ') || s.fullName || '';
      const pass = s.password || s.studentCode;
      const email = s.email || `${s.studentCode}@mcu.ac.th`;
      const prog = s.programType === 'ENGLISH' ? 'International' : 'Thai';
      return [s.studentCode, `"${name}"`, s.degree || 'ปริญญาตรี', `"${s.major || ''}"`, s.yearLevel || '', prog, s.studentCode, pass, email];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_credentials_batch_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs print:p-0 print:bg-white animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[96vh] overflow-y-auto space-y-4 print:shadow-none print:border-none print:max-h-none print:w-full print:p-0">
        {/* Toolbar Header (Hidden on print) */}
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-orange-100 text-orange-700">
                <GraduationCap className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">
                  พิมพ์บัตรแจ้งรหัสผ่านเข้าระบบสำหรับนิสิต ยกชั้นปี / ยกชุด (Batch Student Access Cards)
                </h3>
                <p className="text-[11px] text-slate-500">
                  เลือกชั้นปีที่ต้องการ (เช่น ปี 1 เข้าใหม่) จัดหน้าอัตโนมัติ สั่งพิมพ์ตัดแจก หรือเซฟ PDF ยกชั้นปี
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Year Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">ชั้นปี:</span>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-orange-800"
                >
                  <option value="ALL">ทุกชั้นปี (ทั้งหมด)</option>
                  <option value="1">ปี 1 (นิสิตเข้าใหม่)</option>
                  <option value="2">ปี 2</option>
                  <option value="3">ปี 3</option>
                  <option value="4">ปี 4</option>
                </select>
              </div>

              {/* Program Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">หลักสูตร:</span>
                <select
                  value={filterProgram}
                  onChange={(e) => setFilterProgram(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="ALL">ทุกหลักสูตร</option>
                  <option value="THAI">🇹🇭 ภาคภาษาไทย</option>
                  <option value="ENGLISH">🌐 ภาคภาษาอังกฤษ</option>
                </select>
              </div>

              {/* Layout Per Page */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">จัดหน้า:</span>
                <select
                  value={cardsPerPage}
                  onChange={(e) => setCardsPerPage(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="4">4 บัตร / หน้า A4 (แนะนำ)</option>
                  <option value="2">2 บัตร / หน้า A4</option>
                  <option value="1">1 บัตร / หน้า A4 (เต็มหน้า)</option>
                </select>
              </div>

              {selectedStudentCodes.size > 0 && (
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                  <input
                    type="checkbox"
                    checked={useSelectedOnly}
                    onChange={(e) => setUseSelectedOnly(e.target.checked)}
                    className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                  />
                  <span>พิมพ์เฉพาะที่เลือก ({selectedStudentCodes.size} คน)</span>
                </label>
              )}
            </div>

            {/* Print & Export Actions */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="font-mono text-slate-500 text-[11px] font-semibold">
                พร้อมพิมพ์: <b className="text-orange-700">{displayStudents.length}</b> ใบ
              </span>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>ส่งออก Excel</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={displayStudents.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>สั่งพิมพ์ยกชุด ({displayStudents.length} ใบ)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Printable Cards Grid Area */}
        <div className="space-y-4 print:space-y-0">
          {displayStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              ไม่พบนิสิตตามเงื่อนไขที่เลือก กรุณาเปลี่ยนตัวกรองชั้นปีหรือหลักสูตร
            </div>
          ) : (
            <div
              className={`grid gap-4 print:gap-0 ${
                cardsPerPage === '4'
                  ? 'grid-cols-1 md:grid-cols-2 print:grid-cols-2'
                  : cardsPerPage === '2'
                  ? 'grid-cols-1 md:grid-cols-2 print:grid-cols-1'
                  : 'grid-cols-1 print:grid-cols-1'
              }`}
            >
              {displayStudents.map((s, idx) => {
                const displayName =
                  [s.title, s.firstName, s.lastName].filter(Boolean).join(' ') ||
                  s.fullName ||
                  'นิสิตคณะพุทธศาสตร์';
                const pass = s.password || s.studentCode;
                const qr = qrMap[s.studentCode];

                return (
                  <div
                    key={`${s.studentCode}-${idx}`}
                    className={`border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-white print:border-slate-400 print:rounded-none print:p-4 print:shadow-none relative space-y-2.5 ${
                      cardsPerPage === '4' ? 'print:h-[48vh] print:break-inside-avoid' : 'print:h-[48vh] print:break-inside-avoid'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b-2 border-orange-500/70 pb-2">
                      <div className="flex items-center gap-2">
                        {settings?.logoUrl ? (
                          <img
                            src={settings.logoUrl}
                            alt="Logo"
                            className="w-8 h-8 object-contain rounded-lg p-0.5 bg-white border border-slate-200"
                          />
                        ) : (
                          <span className="text-xl">{settings?.logoEmoji || '☸️'}</span>
                        )}
                        <div>
                          <div className="font-black text-slate-900 text-xs leading-none">
                            {settings?.facultyNameTh || 'คณะพุทธศาสตร์'}
                          </div>
                          <div className="text-[10px] text-slate-600 leading-tight mt-0.5">
                            มจร • บัตรแจ้งรหัสผ่านเข้าระบบบริการการศึกษา
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-[10px] font-mono text-orange-800 font-bold">
                        ปี {s.yearLevel || 1}
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <div className="col-span-2">
                        <span className="text-slate-500 text-[10px] block">ชื่อ - ฉายา / นามสกุล:</span>
                        <strong className="text-slate-900 text-xs block font-bold truncate">
                          {displayName}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] block">รหัสนิสิต:</span>
                        <span className="font-mono font-black text-orange-700 text-xs block">
                          {s.studentCode}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] block">ระดับ / ชั้นปี:</span>
                        <span className="text-slate-800 font-semibold block text-[10px]">
                          {s.degree || 'ปริญญาตรี'} • ปี {s.yearLevel || 1}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-slate-500 text-[10px] block">สาขาวิชา:</span>
                        <span className="text-slate-800 font-medium block truncate text-[10px]">
                          {s.major || s.curriculumName || 'สาขาวิชาพระพุทธศาสนา'}
                        </span>
                      </div>
                    </div>

                    {/* Credentials & QR */}
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-orange-50/70 border border-orange-200">
                      <div className="space-y-1 text-[11px] flex-1">
                        <div className="flex items-center justify-between bg-white px-2 py-0.5 rounded border border-orange-200 font-mono">
                          <span className="text-slate-500 text-[10px]">Username:</span>
                          <span className="font-bold text-slate-900">{s.studentCode}</span>
                        </div>
                        <div className="flex items-center justify-between bg-white px-2 py-0.5 rounded border border-orange-200 font-mono">
                          <span className="text-slate-500 text-[10px]">Password:</span>
                          <span className="font-black text-orange-700">{pass}</span>
                        </div>
                        <div className="text-[9px] text-orange-900/80 leading-tight pt-0.5">
                          🔗 ลิงก์: <b className="font-mono">ne-ser-fb.vercel.app/login</b>
                        </div>
                      </div>

                      {/* QR */}
                      <div className="shrink-0 flex flex-col items-center p-1 bg-white rounded-lg border border-orange-200">
                        {qr ? (
                          <img src={qr} alt="QR" className="w-16 h-16 object-contain" />
                        ) : (
                          <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-[9px] text-slate-400">
                            QR...
                          </div>
                        )}
                        <span className="text-[8px] font-bold text-slate-600">สแกนล็อกอิน</span>
                      </div>
                    </div>

                    {/* Cut line note */}
                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-slate-400" />
                        <span>ตัดแจกนิสิต • กรุณาเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งแรก</span>
                      </span>
                      <span>งานบริการการศึกษา คณะพุทธศาสตร์</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
