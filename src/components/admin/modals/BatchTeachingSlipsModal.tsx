'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  FileText,
  Users,
  CheckSquare,
  Square,
  Scissors,
  Grid,
  Filter,
  SlidersHorizontal,
  PenTool,
  CheckCircle2,
  BookOpen,
  Key,
  X,
  Sparkles,
  QrCode,
  FileSpreadsheet,
} from 'lucide-react';
import { SignatoryItem, SystemSettings, UserAccount } from '@/types';
import {
  buildBatchTeachingSlipsFilename,
  buildBatchTeachingSlipsSheets,
  downloadXlsx,
  TeachingSlipCourseRow,
} from '@/lib/utils';

export type SlipLayoutRatio = '1:1' | '2:1' | '4:1' | '6:1' | '8:1';

interface BatchTeachingSlipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructors: UserAccount[];
  availableAcademicYears?: string[];
  getCoursesForInstructor: (user: UserAccount, year?: string, semester?: string) => TeachingSlipCourseRow[];
  settings?: Partial<SystemSettings>;
  signatories?: SignatoryItem[];
  adminName?: string;
}

interface TeachingSlipCardProps {
  user: UserAccount;
  courses: TeachingSlipCourseRow[];
  qrCodeDataUrl: string | null;
  academicYearText: string;
  semesterText: string;
  deanName?: string;
  adminName?: string;
  qrScale?: number;
}

export const BatchTeachingSlipsModal: React.FC<BatchTeachingSlipsModalProps> = ({
  isOpen,
  onClose,
  instructors = [],
  availableAcademicYears = ['2569'],
  getCoursesForInstructor,
  settings,
  signatories,
  adminName,
}) => {
  const [ratio, setRatio] = useState<SlipLayoutRatio>('4:1');
  const [selectedYear, setSelectedYear] = useState<string>(
    availableAcademicYears.length > 0 ? availableAcademicYears[0] : '2569'
  );
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [onlyWithCourses, setOnlyWithCourses] = useState<boolean>(true);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrScale, setQrScale] = useState<number>(1.5);
  const [signMode, setSignMode] = useState<'OFFICER' | 'DEAN' | 'NONE'>('OFFICER');

  // Generate Attendance QR Code with dynamic domain and high resolution
  useEffect(() => {
    let active = true;
    const targetUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/attendance`
        : 'https://ne-ser-fb.vercel.app/attendance';

    QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 1,
      color: { dark: '#022c22', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setQrCodeDataUrl(url);
      })
      .catch(() => {
        if (active) setQrCodeDataUrl(null);
      });
    return () => {
      active = false;
    };
  }, []);

  // Filter instructors list
  const filteredInstructors = instructors.filter((user) => {
    if (filterDept !== 'ALL' && user.department && user.department !== filterDept) {
      return false;
    }
    if (onlyWithCourses) {
      const courses = getCoursesForInstructor(user, selectedYear, selectedSemester);
      if (courses.length === 0) return false;
    }
    return true;
  });

  // Unique departments for filter dropdown
  const departments = Array.from(
    new Set(instructors.map((u) => u.department).filter(Boolean))
  ) as string[];

  // Auto-select all filtered instructors on initial open or filter change
  useEffect(() => {
    if (isOpen) {
      setSelectedUserIds(new Set(filteredInstructors.map((u) => u.id)));
    }
  }, [isOpen, selectedYear, selectedSemester, filterDept, onlyWithCourses]);

  if (!isOpen) return null;

  // Selected instructors list
  const activeInstructors = filteredInstructors.filter((u) => selectedUserIds.has(u.id));

  // Determine items per page and chunking
  const itemsPerPageMap: Record<SlipLayoutRatio, number> = {
    '1:1': 1,
    '2:1': 2,
    '4:1': 4,
    '6:1': 6,
    '8:1': 8,
  };
  const itemsPerPage = itemsPerPageMap[ratio];

  // Chunk instructors into pages
  const pages: UserAccount[][] = [];
  for (let i = 0; i < activeInstructors.length; i += itemsPerPage) {
    pages.push(activeInstructors.slice(i, i + itemsPerPage));
  }

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredInstructors.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredInstructors.map((u) => u.id)));
    }
  };

  const toggleUser = (id: string) => {
    const next = new Set(selectedUserIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedUserIds(next);
  };

  const academicYearText = selectedYear === 'ALL' ? 'ทุกปีการศึกษา' : `ปีการศึกษา ${selectedYear}`;
  const semesterText =
    selectedSemester === 'ALL' ? 'ทุกภาคการศึกษา' : `ภาคการศึกษาที่ ${selectedSemester}`;

  const deanName =
    settings?.signerNameTh && settings.signerNameTh !== '-'
      ? settings.signerNameTh
      : signatories?.find((s) => s.id === 'DEAN')?.name || 'พระราชอุดมวัชรเมธี, ผศ.ดร.';

  const handleExportExcel = () => {
    if (activeInstructors.length === 0) {
      alert('กรุณาเลือกอาจารย์อย่างน้อย 1 ท่านก่อนส่งออกไฟล์ Excel');
      return;
    }

    const attendanceUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/attendance`
        : 'https://ne-ser-fb.vercel.app/attendance';

    const sheets = buildBatchTeachingSlipsSheets({
      instructors: activeInstructors,
      getCoursesForInstructor,
      selectedYear,
      selectedSemester,
      attendanceUrl,
      adminName,
    });
    const filename = buildBatchTeachingSlipsFilename(selectedYear, selectedSemester);
    downloadXlsx(filename, sheets);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:static print:block animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[96vh] overflow-y-auto space-y-4 print:shadow-none print:border-none print:max-h-none print:p-0 print:w-full print:rounded-none print:overflow-visible print:h-auto print:space-y-0">
        {/* Print Styles for Perfect Multi-Up A4 Output */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 7mm;
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
            .no-print, .print\\:hidden {
              display: none !important;
            }
            .a4-print-sheet {
              width: 100% !important;
              height: 276mm !important;
              min-height: 276mm !important;
              max-height: 278mm !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
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
        `}</style>

        {/* 1. Modal Header Toolbar (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 flex-wrap">
                <span>ออกบัตรแจ้งภาระงานสอนเป็นชุดสำหรับกลุ่มอาจารย์</span>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                  Batch Print &amp; Excel
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                กำหนดจำนวนอาจารย์ต่อ 1 แผ่นกระดาษ A4 เพื่อพิมพ์ตัดแจก หรือส่งออกเป็นไฟล์ Excel (.xlsx) 2 ชีทได้ทันที
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={activeInstructors.length === 0}
              title="ส่งออกข้อมูลบัตรภาระงานสอนและรหัสผ่านของอาจารย์ที่เลือกเป็นไฟล์ Excel (.xlsx) 2 ชีท (แยกรายวิชา & สรุปรายอาจารย์)"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ส่งออก Excel (.xlsx) ({activeInstructors.length} ท่าน)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={activeInstructors.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ออกกระดาษ A4 ({pages.length} แผ่น)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2. Interactive Control Bar: Ratio Selection & Filters (Hidden in Print) */}
        <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs no-print">
          {/* Ratio Selector Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Grid className="w-4 h-4 text-indigo-600" />
              <span>เลือกอัตราส่วนการจัดพิมพ์ต่อกระดาษ A4 (Layout Ratio):</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* 1:1 Full Sheet */}
              <button
                type="button"
                onClick={() => setRatio('1:1')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  ratio === '1:1'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>1:1 (เต็มแผ่น A4)</span>
              </button>

              {/* 2:1 Half Sheet */}
              <button
                type="button"
                onClick={() => setRatio('2:1')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  ratio === '2:1'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>2:1 (ครึ่งแผ่น A5)</span>
              </button>

              {/* 4:1 Quarter Card - Recommended */}
              <button
                type="button"
                onClick={() => setRatio('4:1')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  ratio === '4:1'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm ring-2 ring-emerald-400/40'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>4:1 (การ์ด 4 ส่วน • นิยมตัดแจก)</span>
              </button>

              {/* 6:1 Mini Slip */}
              <button
                type="button"
                onClick={() => setRatio('6:1')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  ratio === '6:1'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>6:1 (สลิปย่อ 6 ส่วน)</span>
              </button>

              {/* 8:1 Mini Slip - Ultra Economical */}
              <button
                type="button"
                onClick={() => setRatio('8:1')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  ratio === '8:1'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm ring-2 ring-purple-400/40'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>8:1 (สลิปย่อ 8 ส่วน • ประหยัดสุด)</span>
              </button>
            </div>
          </div>

          {/* QR Code Scaling Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>ขนาด QR Code บนกระดาษ A4:</span>
              </span>
              <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg">
                {[
                  { scale: 1, label: '1x (ขนาดเดิม)' },
                  { scale: 1.3, label: '1.3x' },
                  { scale: 1.5, label: '1.5x (แนะนำ)' },
                  { scale: 2, label: '2x (ใหญ่ 2 เท่า)' },
                ].map((item) => (
                  <button
                    key={item.scale}
                    type="button"
                    onClick={() => setQrScale(item.scale)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      qrScale === item.scale
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>ปรับขยายขนาด QR Code ได้ตามต้องการ เพื่อให้กล้องมือถือสแกนได้สะดวกและคมชัด</span>
            </div>
          </div>

          {/* Filters: Year, Semester, Department, OnlyWithCourses */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">ปีการศึกษา:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none"
                >
                  {availableAcademicYears.map((yr) => (
                    <option key={yr} value={yr}>
                      ปีการศึกษา {yr}
                    </option>
                  ))}
                  <option value="ALL">ทุกปีการศึกษา</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">ภาคเรียน:</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none"
                >
                  <option value="ALL">ทุกภาคเรียน</option>
                  <option value="1">ภาคเรียนที่ 1</option>
                  <option value="2">ภาคเรียนที่ 2</option>
                </select>
              </div>

              {departments.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">สังกัด:</span>
                  <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none max-w-[160px] truncate"
                  >
                    <option value="ALL">ทุกสังกัด / ภาควิชา</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-1.5 text-slate-700 font-semibold cursor-pointer ml-1">
                <input
                  type="checkbox"
                  checked={onlyWithCourses}
                  onChange={(e) => setOnlyWithCourses(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>เฉพาะอาจารย์ที่มีตารางสอนในเทอมนี้</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 transition cursor-pointer flex items-center gap-1"
              >
                {selectedUserIds.size === filteredInstructors.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ยกเลิกเลือกทั้งหมด</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                    <span>เลือกทั้งหมด ({filteredInstructors.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 text-slate-600">
            <span className="font-medium">
              กำลังเลือก <strong className="text-indigo-700">{activeInstructors.length}</strong> จาก{' '}
              {filteredInstructors.length} ท่าน (จะพิมพ์ลงกระดาษ A4 ทั้งหมด{' '}
              <strong className="text-purple-700">{pages.length} แผ่น</strong> ที่อัตราส่วน {ratio})
            </span>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>ส่งออก Excel มี 2 ชีท: แยกรายวิชา &amp; สรุปรายอาจารย์</span>
              </span>
              <span className="flex items-center gap-1">
                <Scissors className="w-3 h-3 text-amber-600" />
                <span>มีเส้นประตัดกรรไกร (Cut Lines) อัตโนมัติ</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3. Instructors Checkbox Tag Cloud (Hidden in Print) */}
        <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-200/60 space-y-2 no-print">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>รายชื่ออาจารย์ที่เลือกพิมพ์:</span>
            <span className="text-[11px] text-slate-500 font-normal">
              คลิกที่ชื่อเพื่อเปิด/ปิดการพิมพ์เป็นรายบุคคล
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {filteredInstructors.map((u) => {
              const isSelected = selectedUserIds.has(u.id);
              const count = getCoursesForInstructor(u, selectedYear, selectedSemester).length;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUser(u.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100 line-through opacity-70'
                  }`}
                >
                  <span>{u.name}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count} วิชา
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. A4 Printable Sheets Preview */}
        <div className="space-y-6 print:space-y-0">
          {pages.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2 no-print bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <div className="font-bold text-slate-600">ไม่พบรายชื่ออาจารย์ตามเงื่อนไขที่เลือก</div>
              <div className="text-xs">โปรดเลือกติ๊กรายชื่ออาจารย์ หรือปรับตัวกรองปีการศึกษา</div>
            </div>
          ) : (
            pages.map((sheetInstructors, sheetIdx) => (
              <div
                key={`sheet-${sheetIdx}`}
                className="a4-print-sheet bg-white rounded-2xl border border-slate-300 shadow-lg p-6 sm:p-7 relative print:border-none print:shadow-none print:rounded-none print:p-0"
              >
                {/* Screen Sheet Header Badge (Hidden in Print) */}
                <div className="no-print mb-4 pb-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    แผ่นกระดาษ A4 ที่ {sheetIdx + 1} จาก {pages.length} (อัตราส่วน {ratio})
                  </span>
                  <span>{sheetInstructors.length} ท่านบนแผ่นนี้</span>
                </div>

                {/* Grid Container according to selected ratio */}
                {ratio === '1:1' && (
                  <div className="w-full flex-1">
                    {sheetInstructors.map((user) => (
                      <FullCard
                        key={user.id}
                        user={user}
                        courses={getCoursesForInstructor(user, selectedYear, selectedSemester)}
                        qrCodeDataUrl={qrCodeDataUrl}
                        academicYearText={academicYearText}
                        semesterText={semesterText}
                        deanName={deanName}
                        adminName={adminName}
                        qrScale={qrScale}
                      />
                    ))}
                  </div>
                )}

                {ratio === '2:1' && (
                  <div className="w-full h-full flex flex-col justify-between divide-y-2 divide-dashed divide-slate-300 relative">
                    {sheetInstructors.map((user, idx) => (
                      <div key={user.id} className="py-3 flex-1 flex flex-col justify-center relative">
                        {idx > 0 && (
                          <div className="absolute -top-3 left-0 right-0 flex items-center justify-center pointer-events-none no-print">
                            <span className="bg-white px-2 text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Scissors className="w-3 h-3 text-slate-500" /> เส้นตัดแบ่งครึ่งแผ่น A5
                            </span>
                          </div>
                        )}
                        <HalfCard
                          user={user}
                          courses={getCoursesForInstructor(user, selectedYear, selectedSemester)}
                          qrCodeDataUrl={qrCodeDataUrl}
                          academicYearText={academicYearText}
                          semesterText={semesterText}
                          deanName={deanName}
                          adminName={adminName}
                          qrScale={qrScale}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {ratio === '4:1' && (
                  <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-4 relative">
                    {/* Visual Cut Lines for Screen Preview & Print */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-r-2 border-dashed border-slate-300 pointer-events-none" />
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b-2 border-dashed border-slate-300 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] text-slate-500 z-10 shadow-xs">
                      ✂️
                    </div>

                    {sheetInstructors.map((user) => (
                      <div key={user.id} className="p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden">
                        <QuarterCard
                          user={user}
                          courses={getCoursesForInstructor(user, selectedYear, selectedSemester)}
                          qrCodeDataUrl={qrCodeDataUrl}
                          academicYearText={academicYearText}
                          semesterText={semesterText}
                          adminName={adminName}
                          qrScale={qrScale}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {ratio === '6:1' && (
                  <div className="w-full h-full grid grid-cols-2 grid-rows-3 gap-3 relative">
                    {/* Vertical Center Cut Line */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-r-2 border-dashed border-slate-300 pointer-events-none" />
                    {/* Horizontal 1/3 and 2/3 Cut Lines */}
                    <div className="absolute inset-x-0 top-1/3 border-b-2 border-dashed border-slate-300 pointer-events-none" />
                    <div className="absolute inset-x-0 top-2/3 border-b-2 border-dashed border-slate-300 pointer-events-none" />

                    {sheetInstructors.map((user) => (
                      <div key={user.id} className="p-1.5 flex flex-col justify-between overflow-hidden">
                        <MiniSlipCard
                          user={user}
                          courses={getCoursesForInstructor(user, selectedYear, selectedSemester)}
                          qrCodeDataUrl={qrCodeDataUrl}
                          academicYearText={academicYearText}
                          semesterText={semesterText}
                          adminName={adminName}
                          qrScale={qrScale}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {ratio === '8:1' && (
                  <div className="w-full h-full grid grid-cols-2 grid-rows-4 gap-2 relative">
                    {/* Vertical Center Cut Line */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-r-2 border-dashed border-slate-300 pointer-events-none" />
                    {/* Horizontal Cut Lines at 1/4, 2/4, 3/4 */}
                    <div className="absolute inset-x-0 top-1/4 border-b-2 border-dashed border-slate-300 pointer-events-none" />
                    <div className="absolute inset-x-0 top-2/4 border-b-2 border-dashed border-slate-300 pointer-events-none" />
                    <div className="absolute inset-x-0 top-3/4 border-b-2 border-dashed border-slate-300 pointer-events-none" />

                    {sheetInstructors.map((user) => (
                      <div key={user.id} className="p-1 flex flex-col justify-between overflow-hidden">
                        <EightCard
                          user={user}
                          courses={getCoursesForInstructor(user, selectedYear, selectedSemester)}
                          qrCodeDataUrl={qrCodeDataUrl}
                          academicYearText={academicYearText}
                          semesterText={semesterText}
                          adminName={adminName}
                          qrScale={qrScale}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
   CARD VARIANT 1: 1:1 Full Sheet A4
   ------------------------------------------------------------- */
function FullCard({ user, courses, qrCodeDataUrl, academicYearText, semesterText, deanName, adminName, qrScale = 1.5 }: TeachingSlipCardProps) {
  const attendanceUrl = typeof window !== 'undefined' ? `${window.location.origin}/attendance` : 'https://ne-ser-fb.vercel.app/attendance';

  return (
    <div className="space-y-4 text-xs text-slate-800">
      <div className="text-center space-y-1 border-b border-slate-200 pb-3">
        <div className="text-2xl">☸️</div>
        <h4 className="font-extrabold text-slate-900 text-base">
          คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
        </h4>
        <p className="text-xs text-slate-700 font-bold">
          หนังสือแจ้งภาระงานสอนและข้อมูลบัญชีเข้าสู่ระบบตรวจเช็คชื่อ ประจำ{semesterText} {academicYearText}
        </p>
      </div>

      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-400 font-medium">อาจารย์ผู้สอน:</span>{' '}
          <strong className="text-slate-900 text-sm">{user.name}</strong>
        </div>
        <div>
          <span className="text-slate-400 font-medium">สังกัด:</span>{' '}
          <strong>{user.department || 'คณะพุทธศาสตร์ มจร.'}</strong>
          {user.instructorType && (
            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              {user.instructorType}
            </span>
          )}
        </div>
        <div>
          <span className="text-slate-400 font-medium">อีเมลเข้าสู่ระบบ:</span>{' '}
          <span className="font-mono font-bold text-indigo-700">{user.email || user.gmail}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium">รหัสผ่านเริ่มต้น:</span>{' '}
          <span className="font-mono font-bold text-emerald-800">{user.defaultPassword || 'mcu123456'}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="font-bold text-slate-800 flex items-center justify-between">
          <span>รายวิชาที่รับผิดชอบบรรยาย ({courses.length} รายวิชา):</span>
        </div>
        <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 border-b">
            <tr>
              <th className="px-2 py-1.5 text-center w-8">#</th>
              <th className="px-2 py-1.5 w-20">รหัสวิชา</th>
              <th className="px-2 py-1.5">ชื่อรายวิชา</th>
              <th className="px-2 py-1.5 text-center w-16">ชั้นปี</th>
              <th className="px-2 py-1.5 text-center w-28">วัน-เวลาเรียน</th>
              <th className="px-2 py-1.5 text-center w-20">ห้องเรียน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-slate-400">
                  ไม่พบรายวิชาในภาคการศึกษานี้
                </td>
              </tr>
            ) : (
              courses.map((c, i) => (
                <tr key={i}>
                  <td className="px-2 py-1.5 text-center text-slate-400">{i + 1}</td>
                  <td className="px-2 py-1.5 font-mono font-bold text-indigo-700">{c.courseCode}</td>
                  <td className="px-2 py-1.5 font-medium">{c.courseName}</td>
                  <td className="px-2 py-1.5 text-center">
                    ปี {c.yearLevel || 1}
                    {c.semester ? ` (ภาค ${c.semester})` : ''}
                  </td>
                  <td className="px-2 py-1.5 text-center font-mono text-[11px]">
                    {c.dayShort ? `${c.dayShort} ` : ''}
                    {c.startTime || '-'}-{c.endTime || '-'} น.
                  </td>
                  <td className="px-2 py-1.5 text-center font-bold">{c.room || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
        <div>
          <div className="font-bold text-emerald-950">ข้อมูลเข้าระบบ: {attendanceUrl}</div>
          <div className="text-slate-600 text-[11px]">
            เข้าสู่ระบบด้วย Username ด้านบน หรือกด &quot;เข้าสู่ระบบด้วย Google / บัญชี มจร.&quot;
          </div>
          <div className="text-slate-700 text-[11px] font-medium pt-1">
            ผู้ออกเข้าระบบ โดย <strong className="text-slate-900">{adminName || 'ผู้ดูแลระบบ'}</strong>
          </div>
        </div>
        {qrCodeDataUrl && (
          <div className="text-center shrink-0">
            <img
              src={qrCodeDataUrl}
              alt="QR"
              style={{
                width: `${Math.round(64 * qrScale)}px`,
                height: `${Math.round(64 * qrScale)}px`,
              }}
              className="border border-emerald-300 rounded-lg bg-white p-1 object-contain shadow-xs inline-block"
            />
            <div className="text-[9px] text-slate-500 font-bold mt-0.5">สแกนเข้าสู่ระบบ</div>
          </div>
        )}
      </div>

      <div className="pt-4 grid grid-cols-2 gap-8 text-center text-xs">
        <div className="space-y-4">
          <div>ลงชื่อ..................................................</div>
          <div>( {user.name} )<br /><span className="text-slate-400 text-[10px]">อาจารย์ผู้รับทราบภาระงานสอน</span></div>
        </div>
        <div className="space-y-4">
          <div>ลงชื่อ..................................................</div>
          <div>( {deanName} )<br /><span className="text-slate-400 text-[10px]">คณบดีคณะพุทธศาสตร์</span></div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   CARD VARIANT 2: 2:1 Half Sheet A5
   ------------------------------------------------------------- */
function HalfCard({ user, courses, qrCodeDataUrl, academicYearText, semesterText, adminName, qrScale = 1.5 }: TeachingSlipCardProps) {
  const attendanceUrl = typeof window !== 'undefined' ? `${window.location.host}/attendance` : 'ระบบเช็คชื่อ';

  return (
    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 text-xs text-slate-800 shadow-xs">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">☸️</span>
          <div>
            <h5 className="font-bold text-slate-900 text-[13px]">
              บัตรแจ้งภาระงานสอน คณะพุทธศาสตร์ มจร.
            </h5>
            <p className="text-[10px] text-slate-500 font-medium">
              {semesterText} {academicYearText}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
            {courses.length} วิชา
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg">
        <div>
          <span className="text-slate-500">อาจารย์:</span> <strong className="text-slate-900">{user.name}</strong>
        </div>
        <div>
          <span className="text-slate-500">สังกัด:</span> <strong>{user.department || 'คณะพุทธศาสตร์'}</strong>
          {user.instructorType && (
            <span className="ml-1 text-[9px] font-bold px-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              {user.instructorType}
            </span>
          )}
        </div>
        <div>
          <span className="text-slate-500">อีเมล/User:</span>{' '}
          <strong className="font-mono text-indigo-700">{user.email || user.gmail}</strong>
        </div>
        <div>
          <span className="text-slate-500">รหัสผ่าน:</span>{' '}
          <strong className="font-mono text-emerald-800">{user.defaultPassword || 'mcu123456'}</strong>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[11px] font-bold text-slate-700">รายวิชาที่สอน:</div>
        <table className="w-full text-left text-[11px] border rounded overflow-hidden">
          <thead className="bg-slate-100 text-slate-600 font-semibold text-[10px]">
            <tr>
              <th className="p-1 w-16">รหัสวิชา</th>
              <th className="p-1">ชื่อรายวิชา</th>
              <th className="p-1 text-center w-24">วัน-เวลา</th>
              <th className="p-1 text-center w-16">ห้อง</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.slice(0, 4).map((c, i) => (
              <tr key={i}>
                <td className="p-1 font-mono font-bold text-indigo-700">{c.courseCode}</td>
                <td className="p-1 truncate max-w-[180px]">
                  {c.courseName}
                  {c.semester ? ` (ภาค ${c.semester})` : ''}
                </td>
                <td className="p-1 text-center font-mono text-[10px]">
                  {c.dayShort ? `${c.dayShort} ` : ''}
                  {c.startTime || '-'}-{c.endTime || '-'}
                </td>
                <td className="p-1 text-center font-semibold">{c.room || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t text-[10px] text-slate-500">
        <div className="space-y-0.5 min-w-0">
          <div>
            <span>เข้าเช็คชื่อนิสิต: </span>
            <strong className="font-mono text-purple-700">{attendanceUrl}</strong>
          </div>
          <div className="text-slate-600">ผู้ออกเข้าระบบ โดย <strong className="text-slate-800">{adminName || 'ผู้ดูแลระบบ'}</strong></div>
          <div className="text-slate-700 font-medium pt-0.5">ลงชื่อผู้รับทราบ: .......................................</div>
        </div>
        {qrCodeDataUrl && (
          <div className="text-center shrink-0">
            <img
              src={qrCodeDataUrl}
              alt="QR"
              style={{
                width: `${Math.round(48 * qrScale)}px`,
                height: `${Math.round(48 * qrScale)}px`,
              }}
              className="border border-emerald-300 rounded bg-white p-0.5 object-contain shadow-xs inline-block"
            />
            <div className="text-[8px] text-slate-500 font-bold mt-0.5">สแกนเข้า</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   CARD VARIANT 3: 4:1 Quarter Card (การ์ดตัดแจก 4 ส่วน - แนะนำ)
   ------------------------------------------------------------- */
function QuarterCard({ user, courses, qrCodeDataUrl, academicYearText, semesterText, adminName, qrScale = 1.5 }: TeachingSlipCardProps) {
  return (
    <div className="h-full flex flex-col justify-between p-3 bg-white border border-slate-300 rounded-xl text-slate-800 shadow-xs relative overflow-hidden">
      {/* Top Banner */}
      <div>
        <div className="flex items-start justify-between gap-1.5 border-b border-slate-200 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">☸️</span>
            <div>
              <h6 className="font-extrabold text-slate-900 text-xs leading-tight">
                บัตรแจ้งภาระงานสอน คณะพุทธศาสตร์
              </h6>
              <p className="text-[9.5px] text-slate-500 font-semibold">
                {semesterText} {academicYearText}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 shrink-0">
            {courses.length} วิชา
          </span>
        </div>

        {/* Instructor Info Box */}
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 mb-2 space-y-0.5 text-[11px]">
          <div>
            <span className="text-slate-400 font-medium">อาจารย์:</span>{' '}
            <strong className="text-slate-900 text-xs">{user.name}</strong>
          </div>
          <div className="text-[10px] text-slate-600 truncate">
            {user.department || 'คณะพุทธศาสตร์ มจร.'}
          </div>
        </div>

        {/* Courses Table / List */}
        <div className="space-y-1 mb-2">
          <div className="text-[10px] font-bold text-slate-700 flex items-center justify-between">
            <span>ตารางรายวิชาบรรยาย:</span>
          </div>
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b text-[9.5px]">
                <tr>
                  <th className="px-1.5 py-0.5 w-14">รหัสวิชา</th>
                  <th className="px-1.5 py-0.5">ชื่อวิชา</th>
                  <th className="px-1.5 py-0.5 text-center w-12">ห้อง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[10px]">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-2 text-slate-400 text-[9.5px]">
                      ไม่พบตารางสอนในเทอมนี้
                    </td>
                  </tr>
                ) : (
                  courses.slice(0, 3).map((c, i) => (
                    <tr key={i}>
                      <td className="px-1.5 py-0.5 font-mono font-bold text-indigo-700">{c.courseCode}</td>
                      <td className="px-1.5 py-0.5 truncate max-w-[130px] font-medium" title={c.courseName}>
                        {c.courseName}
                        {c.dayShort ? ` (${c.dayShort})` : ''}
                      </td>
                      <td className="px-1.5 py-0.5 text-center font-bold text-slate-700">{c.room || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {courses.length > 3 && (
            <div className="text-[9px] text-slate-400 text-right">
              + มีอีก {courses.length - 3} วิชา (ตรวจดูในระบบ)
            </div>
          )}
        </div>
      </div>

      {/* Bottom Credentials & QR Slip */}
      <div className="p-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 rounded-lg flex items-center justify-between gap-2 text-[10px]">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="font-bold text-emerald-950 flex items-center gap-1 text-[10.5px]">
            <Key className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>เข้าเช็คชื่อนิสิต:</span>
          </div>
          <div className="truncate text-slate-700 text-[9.5px]">
            User: <strong className="font-mono text-slate-900">{user.email || user.gmail}</strong>
          </div>
          <div className="text-slate-700 text-[9.5px]">
            Pass: <strong className="font-mono text-emerald-800 bg-white px-1 rounded border border-emerald-300">{user.defaultPassword || 'mcu123456'}</strong>
          </div>
          <div className="text-slate-600 text-[8.5px] truncate pt-0.5 border-t border-emerald-200/60 mt-0.5">
            ผู้ออกเข้าระบบ โดย <strong className="text-slate-800">{adminName || 'ผู้ดูแลระบบ'}</strong>
          </div>
        </div>

        {qrCodeDataUrl && (
          <div className="text-center shrink-0">
            <img
              src={qrCodeDataUrl}
              alt="QR"
              style={{
                width: `${Math.round(44 * qrScale)}px`,
                height: `${Math.round(44 * qrScale)}px`,
              }}
              className="border border-emerald-300 rounded bg-white p-0.5 object-contain shadow-xs inline-block"
            />
            <div className="text-[8px] text-slate-500 font-bold mt-0.5">สแกนเข้า</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   CARD VARIANT 4: 6:1 Mini Slip (สลิปย่อ 6 ช่อง สำหรับแนบซอง/แจก)
   ------------------------------------------------------------- */
function MiniSlipCard({ user, courses, qrCodeDataUrl, academicYearText, semesterText, adminName, qrScale = 1.5 }: TeachingSlipCardProps) {
  return (
    <div className="h-full flex flex-col justify-between p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 shadow-xs relative overflow-hidden text-[10px]">
      <div>
        <div className="flex items-center justify-between border-b pb-1 mb-1">
          <div className="font-bold text-slate-900 text-[11px] truncate flex items-center gap-1">
            <span>☸️</span>
            <span>บัตรภาระงาน: {user.name}</span>
          </div>
          <span className="text-[8.5px] bg-slate-100 text-slate-600 font-bold px-1 rounded">
            {courses.length} วิชา
          </span>
        </div>

        <div className="text-[9px] text-slate-500 truncate mb-1">
          {semesterText} {academicYearText} • {user.department || 'คณะพุทธศาสตร์'}
        </div>

        {/* Short Course Bullets */}
        <div className="space-y-0.5 mb-1.5">
          {courses.slice(0, 2).map((c, i) => (
            <div key={i} className="flex items-center justify-between text-[9px] bg-slate-50 px-1 py-0.5 rounded">
              <span className="font-mono font-bold text-indigo-700 truncate max-w-[65px]">{c.courseCode}</span>
              <span className="truncate max-w-[100px] text-slate-800">{c.courseName}</span>
              <span className="font-bold text-slate-600">{c.room || '-'}</span>
            </div>
          ))}
          {courses.length > 2 && (
            <div className="text-[8px] text-slate-400 text-right">+ อีก {courses.length - 2} วิชา</div>
          )}
        </div>
      </div>

      {/* Mini Auth Box */}
      <div className="p-1.5 bg-emerald-50/90 border border-emerald-200 rounded flex items-center justify-between gap-1.5">
        <div className="text-[8.5px] min-w-0 truncate text-slate-700 space-y-0.5">
          <div>User: <strong className="font-mono text-slate-900">{user.email || user.gmail}</strong></div>
          <div>Pass: <strong className="font-mono text-emerald-800 bg-white px-1 rounded border border-emerald-300">{user.defaultPassword || 'mcu123456'}</strong></div>
          <div className="text-[7.5px] text-slate-600 truncate border-t border-emerald-200/60 pt-0.5 mt-0.5">
            ผู้ออกเข้าระบบ โดย <strong className="text-slate-800">{adminName || 'ผู้ดูแลระบบ'}</strong>
          </div>
        </div>
        {qrCodeDataUrl && (
          <div className="text-center shrink-0">
            <img
              src={qrCodeDataUrl}
              alt="QR"
              style={{
                width: `${Math.round(36 * qrScale)}px`,
                height: `${Math.round(36 * qrScale)}px`,
              }}
              className="rounded border border-emerald-300 bg-white p-0.5 object-contain shadow-xs inline-block"
            />
            <div className="text-[7.5px] text-slate-500 font-bold leading-none mt-0.5">สแกน</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   CARD VARIANT 5: 8:1 Mini Slip (สลิปย่อ 8 ช่อง พิมพ์ 8 ใบต่อแผ่น A4 • ประหยัดสุด)
   ------------------------------------------------------------- */
function EightCard({ user, courses, qrCodeDataUrl, academicYearText, semesterText, adminName, qrScale = 1.5 }: TeachingSlipCardProps) {
  return (
    <div className="h-full flex flex-col justify-between p-2 bg-white border border-slate-300 rounded-lg text-slate-800 shadow-xs relative overflow-hidden text-[9px] leading-tight">
      <div>
        <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
          <div className="font-bold text-slate-900 text-[10px] truncate flex items-center gap-1">
            <span>☸️</span>
            <span className="truncate">บัตรภาระงาน: {user.name}</span>
          </div>
          <span className="text-[7.5px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-1 rounded shrink-0">
            {courses.length} วิชา
          </span>
        </div>

        <div className="text-[8px] text-slate-500 truncate mb-1">
          {semesterText} {academicYearText} • {user.department || 'คณะพุทธศาสตร์'}
        </div>

        {/* Short Course Bullets (Max 2 courses) */}
        <div className="space-y-0.5 mb-1">
          {courses.slice(0, 2).map((c, i) => (
            <div key={i} className="flex items-center justify-between text-[7.5px] bg-slate-50 px-1 py-0.5 rounded">
              <span className="font-mono font-bold text-indigo-700 truncate max-w-[55px]">{c.courseCode}</span>
              <span className="truncate max-w-[85px] text-slate-800 font-medium">{c.courseName}</span>
              <span className="font-bold text-slate-600">{c.room || '-'}</span>
            </div>
          ))}
          {courses.length > 2 && (
            <div className="text-[7px] text-slate-400 text-right">+ มีอีก {courses.length - 2} วิชา</div>
          )}
          {courses.length === 0 && (
            <div className="text-[7.5px] text-slate-400 text-center py-0.5">ไม่พบตารางสอนในเทอมนี้</div>
          )}
        </div>
      </div>

      {/* Mini Auth & QR Box */}
      <div className="p-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 rounded flex items-center justify-between gap-1">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="font-bold text-emerald-950 flex items-center gap-1 text-[8.5px]">
            <Key className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
            <span>เข้าเช็คชื่อนิสิต:</span>
          </div>
          <div className="truncate text-slate-700 text-[8px]">
            User: <strong className="font-mono text-slate-900">{user.email || user.gmail}</strong>
          </div>
          <div className="text-slate-700 text-[8px]">
            Pass: <strong className="font-mono text-emerald-800 bg-white px-1 rounded border border-emerald-300">{user.defaultPassword || 'mcu123456'}</strong>
          </div>
          <div className="text-slate-600 text-[7px] truncate pt-0.5 border-t border-emerald-200/50 mt-0.5">
            ผู้ออกเข้าระบบ โดย <strong className="text-slate-800">{adminName || 'ผู้ดูแลระบบ'}</strong>
          </div>
        </div>

        {qrCodeDataUrl && (
          <div className="text-center shrink-0">
            <img
              src={qrCodeDataUrl}
              alt="QR"
              style={{
                width: `${Math.round(30 * qrScale)}px`,
                height: `${Math.round(30 * qrScale)}px`,
              }}
              className="border border-emerald-300 rounded bg-white p-0.5 object-contain shadow-xs inline-block"
            />
            <div className="text-[6.5px] text-slate-500 font-bold leading-none mt-0.5">สแกนเข้า</div>
          </div>
        )}
      </div>
    </div>
  );
}
