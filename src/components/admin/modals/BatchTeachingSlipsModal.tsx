'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  FileText,
  Users,
  FileSpreadsheet,
  Scissors,
} from 'lucide-react';
import {
  buildBatchTeachingSlipsFilename,
  buildBatchTeachingSlipsSheets,
  downloadXlsx,
} from '@/lib/utils';
import {
  BatchTeachingSlipsModalProps,
  SlipLayoutRatio,
} from './teaching-slips/types';
import {
  FullCard,
  HalfCard,
  QuarterCard,
  MiniSlipCard,
  EightCard,
} from './teaching-slips/TeachingSlipCards';
import { SlipControlsToolbar } from './teaching-slips/SlipControlsToolbar';

export type { SlipLayoutRatio, BatchTeachingSlipsModalProps };

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
  const pages = [];
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

        {/* 2. Interactive Control Bar: Ratio Selection, Filters & Scaling */}
        <SlipControlsToolbar
          ratio={ratio}
          setRatio={setRatio}
          qrScale={qrScale}
          setQrScale={setQrScale}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          availableAcademicYears={availableAcademicYears}
          selectedSemester={selectedSemester}
          setSelectedSemester={setSelectedSemester}
          filterDept={filterDept}
          setFilterDept={setFilterDept}
          departments={departments}
          onlyWithCourses={onlyWithCourses}
          setOnlyWithCourses={setOnlyWithCourses}
          signMode={signMode}
          setSignMode={setSignMode}
          isAllSelected={selectedUserIds.size === filteredInstructors.length}
          handleToggleSelectAll={toggleSelectAll}
          handleExportXlsx={handleExportExcel}
          handlePrint={() => window.print()}
          filteredCount={filteredInstructors.length}
          selectedCount={activeInstructors.length}
        />

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
                  <div className="w-full h-full flex flex-col justify-between gap-4 relative">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b-2 border-dashed border-slate-300 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] text-slate-500 z-10 shadow-xs">
                      ✂️
                    </div>

                    {sheetInstructors.map((user, idx) => (
                      <div key={user.id} className="flex-1 flex flex-col justify-center">
                        {idx > 0 && (
                          <div className="text-center text-[10px] text-slate-400 font-mono mb-1 no-print">
                            - - - ตัดแบ่งครึ่งแผ่น A5 - - -
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
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-r-2 border-dashed border-slate-300 pointer-events-none" />
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
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-r-2 border-dashed border-slate-300 pointer-events-none" />
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
