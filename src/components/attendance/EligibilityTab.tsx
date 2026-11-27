'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Lock,
  AlertTriangle,
  BookOpen,
  SlidersHorizontal,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  XCircle,
  Info,
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { Course, TimetableItem, AuthUser, StudentEligibility } from '@/types';
import { groupAndSortByMajor } from './majorGrouping';

export interface EligibilityRowItem {
  studentCode: string;
  studentName: string;
  major?: string;
  yearLevel?: number;
  present: number;
  late: number;
  leave: number;
  absent: number;
  attendedPercent: number;
  remainingAbsences: number;
  status: 'ELIGIBLE' | 'WARNING' | 'INELIGIBLE';
  statusText?: string;
  reason?: string;
  isCustomEnrolled?: boolean;
}

interface EligibilityTabProps {
  currentUser?: AuthUser | null;
  currentCourse?: TimetableItem | Course | null;
  availableCourses: (TimetableItem | Course)[];
  selectedCourseCode: string;
  handleCourseChange: (code: string) => void;
  showEligibilitySettings: boolean;
  setShowEligibilitySettings: (show: boolean) => void;
  minAttendancePercent: number;
  setMinAttendancePercent: (percent: number) => void;
  semesterTotalSessions: number;
  setSemesterTotalSessions: (sessions: number) => void;
  lateToAbsentRatio: number;
  setLateToAbsentRatio: (ratio: number) => void;
  includeLeaveAsExcused: boolean;
  setIncludeLeaveAsExcused: (excused: boolean) => void;
  handleExportEligibilityCsv: () => void;
  eligibilityStats: {
    total: number;
    eligible: number;
    warning: number;
    ineligible: number;
  };
  recordedSessionsCount: number;
  maxAllowedAbsences: number;
  handleSimulateAttendance: () => void;
  eligibilitySearch: string;
  setEligibilitySearch: (q: string) => void;
  eligibilityStatusFilter: 'ALL' | 'ELIGIBLE' | 'WARNING' | 'INELIGIBLE';
  setEligibilityStatusFilter: (status: 'ALL' | 'ELIGIBLE' | 'WARNING' | 'INELIGIBLE') => void;
  eligibilityList: EligibilityRowItem[];
  filteredEligibilityList: EligibilityRowItem[];
}

export function EligibilityTab({
  currentUser,
  currentCourse,
  availableCourses,
  selectedCourseCode,
  handleCourseChange,
  showEligibilitySettings,
  setShowEligibilitySettings,
  minAttendancePercent,
  setMinAttendancePercent,
  semesterTotalSessions,
  setSemesterTotalSessions,
  lateToAbsentRatio,
  setLateToAbsentRatio,
  includeLeaveAsExcused,
  setIncludeLeaveAsExcused,
  handleExportEligibilityCsv,
  eligibilityStats,
  recordedSessionsCount,
  maxAllowedAbsences,
  handleSimulateAttendance,
  eligibilitySearch,
  setEligibilitySearch,
  eligibilityStatusFilter,
  setEligibilityStatusFilter,
  eligibilityList,
  filteredEligibilityList,
}: EligibilityTabProps) {
  const groupedEligibilitySections = useMemo(() => {
    return groupAndSortByMajor(filteredEligibilityList).sections;
  }, [filteredEligibilityList]);

  // Print Spacing, Padding & Margin Customization (Default: ULTRA_COMPACT to save paper)
  const [printSpacingPreset, setPrintSpacingPreset] = useState<'ULTRA_COMPACT' | 'COMPACT' | 'COMFORTABLE' | 'CUSTOM'>('ULTRA_COMPACT');
  const [printCellPaddingPx, setPrintCellPaddingPx] = useState<number>(2);
  const [printFontSizePx, setPrintFontSizePx] = useState<number>(11);
  const [printPageMarginMm, setPrintPageMarginMm] = useState<number>(6);
  const [showPrintLayoutConfig, setShowPrintLayoutConfig] = useState<boolean>(false);
  const [isExtraToolsOpen, setIsExtraToolsOpen] = useState<boolean>(false);
  const [showCourseCards, setShowCourseCards] = useState<boolean>(false);
  // เปิด/ปิด คอลัมน์ "เหตุผล / เงื่อนไข" (ปิดเพื่อให้ตารางกระชับ ไม่ห่างเกินไป)
  const [showReasonColumn, setShowReasonColumn] = useState<boolean>(true);
  // สลับมุมมองบนมือถือ: 'card' (การ์ด - ค่าเริ่มต้น) หรือ 'table' (ตารางเลื่อนข้าง)
  const [mobileViewMode, setMobileViewMode] = useState<'card' | 'table'>('card');
  const tableColCount = showReasonColumn ? 11 : 10;

  const toggleReasonColumn = useCallback(() => {
    setShowReasonColumn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mcu_eligibility_show_reason_v1', next ? '1' : '0');
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      const savedReason = localStorage.getItem('mcu_eligibility_show_reason_v1');
      if (savedReason !== null) setShowReasonColumn(savedReason === '1');
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mcu_eligibility_print_layout_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.preset) setPrintSpacingPreset(parsed.preset);
        if (typeof parsed.cellPadding === 'number') setPrintCellPaddingPx(parsed.cellPadding);
        if (typeof parsed.fontSize === 'number') setPrintFontSizePx(parsed.fontSize);
        if (typeof parsed.pageMargin === 'number') setPrintPageMarginMm(parsed.pageMargin);
      }
    } catch {}
  }, []);

  const applyPrintLayoutPreset = useCallback((preset: 'ULTRA_COMPACT' | 'COMPACT' | 'COMFORTABLE') => {
    setPrintSpacingPreset(preset);
    const nextPad = preset === 'ULTRA_COMPACT' ? 2 : preset === 'COMPACT' ? 4 : 6;
    const nextFont = preset === 'ULTRA_COMPACT' ? 11 : preset === 'COMPACT' ? 12 : 13;
    const nextMargin = preset === 'ULTRA_COMPACT' ? 6 : preset === 'COMPACT' ? 8 : 10;
    setPrintCellPaddingPx(nextPad);
    setPrintFontSizePx(nextFont);
    setPrintPageMarginMm(nextMargin);
    try {
      localStorage.setItem(
        'mcu_eligibility_print_layout_v1',
        JSON.stringify({
          preset,
          cellPadding: nextPad,
          fontSize: nextFont,
          pageMargin: nextMargin,
        })
      );
    } catch {}
  }, []);

  const updateCustomPrintLayout = useCallback((pad: number, font: number, margin: number) => {
    const cPad = Math.max(1, Math.min(10, pad));
    const cFont = Math.max(9.5, Math.min(15, Number(font.toFixed(1))));
    const cMargin = Math.max(4, Math.min(16, margin));
    setPrintSpacingPreset('CUSTOM');
    setPrintCellPaddingPx(cPad);
    setPrintFontSizePx(cFont);
    setPrintPageMarginMm(cMargin);
    try {
      localStorage.setItem(
        'mcu_eligibility_print_layout_v1',
        JSON.stringify({
          preset: 'CUSTOM',
          cellPadding: cPad,
          fontSize: cFont,
          pageMargin: cMargin,
        })
      );
    } catch {}
  }, []);

  if (!currentUser) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
        <Lock className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800 text-base">
          เข้าสู่ระบบอาจารย์ผู้สอนเพื่อดูสรุปสิทธิ์สอบ
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          ระบบคำนวณสิทธิ์สอบอ้างอิงจากเวลาเรียน 80% ทั้งภาคการศึกษาเฉพาะในรายวิชาที่ท่านเป็นอาจารย์ผู้สอนเท่านั้น
        </p>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-center text-amber-900 space-y-2">
        <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
        <p className="font-bold text-sm">ไม่พบรายวิชาที่ท่านรับผิดชอบบรรยายในภาคเรียนนี้</p>
      </div>
    );
  }

  return (
    <div id="printable-eligibility-report" className="space-y-6 print:space-y-1.5">
      {/* Top Selector & Collapsible Tools Bar */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 print:hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          {/* Course Dropdown Selector (Always visible, 1 line) */}
          <div className="flex-1 min-w-0">
            <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>เลือกรายวิชาที่ต้องการสรุปสิทธิ์สอบ ({availableCourses.length} วิชา):</span>
            </label>
            <select
              value={(currentCourse as any)?.sectionKey || selectedCourseCode}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              {availableCourses.map((c, i) => {
                const sKey = (c as any).sectionKey || c.courseCode;
                return (
                  <option key={`opt-elig-${sKey}-${i}`} value={sKey}>
                    {c.courseCode} — {c.courseName} (ปี {c.yearLevel || 1})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Primary Actions (Export & Print) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportEligibilityCsv}
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>ส่งออก Excel/CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span>พิมพ์รายงาน A4</span>
            </button>
          </div>
        </div>

        {/* Summary Line + Bottom-Right Red Chevron Toggle */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 text-slate-600 min-w-0">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-900">
              เกณฑ์ {minAttendancePercent}%
            </span>
            <span className="font-bold text-slate-900">{currentCourse.courseCode}</span>
            <span className="text-slate-400">•</span>
            <span>บันทึกแล้ว {recordedSessionsCount}/{semesterTotalSessions} คาบ</span>
          </div>

          {!isExtraToolsOpen && (
            <button
              type="button"
              onClick={() => setIsExtraToolsOpen(true)}
              className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition cursor-pointer shrink-0 shadow-2xs"
              title="คลี่เครื่องมือเสริม (การ์ดรายวิชา, ตั้งค่าเกณฑ์คำนวณ, ปรับช่องไฟพิมพ์)"
              aria-label="คลี่เครื่องมือเสริม"
            >
              <ChevronDown className="w-5 h-5 stroke-[2.75]" />
            </button>
          )}
        </div>

        {/* Expanded Extra Tools Drawer */}
        {isExtraToolsOpen && (
          <div className="pt-3 border-t border-slate-200/80 space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEligibilitySettings(!showEligibilitySettings)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                  showEligibilitySettings
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>เกณฑ์คำนวณ ({minAttendancePercent}%)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintLayoutConfig(!showPrintLayoutConfig)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                  showPrintLayoutConfig
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <span>📏 ปรับช่องไฟพิมพ์ ({printCellPaddingPx}px)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCourseCards((prev) => !prev)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                  showCourseCards
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>การ์ดวิชา ({availableCourses.length})</span>
                {showCourseCards ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

        {/* Print Spacing & Margin Customizer Panel */}
        {showPrintLayoutConfig && (
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/90 space-y-3 text-xs animate-in fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-extrabold text-emerald-950 mr-1">
                  🖨️ รูปแบบความชิดของตารางเวลาพิมพ์ (ประหยัดกระดาษ):
                </span>
                <button
                  type="button"
                  onClick={() => applyPrintLayoutPreset('ULTRA_COMPACT')}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                    printSpacingPreset === 'ULTRA_COMPACT'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  ชิดพิเศษ-ประหยัดกระดาษ (แนะนำ)
                </button>
                <button
                  type="button"
                  onClick={() => applyPrintLayoutPreset('COMPACT')}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                    printSpacingPreset === 'COMPACT'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  กระชับมาตรฐาน
                </button>
                <button
                  type="button"
                  onClick={() => applyPrintLayoutPreset('COMFORTABLE')}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                    printSpacingPreset === 'COMFORTABLE'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  โปร่งสบายตา
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Cell Padding Adjuster */}
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-300">
                  <span className="text-slate-600 font-semibold">ช่องไฟแถว (Padding):</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateCustomPrintLayout(printCellPaddingPx - 1, printFontSizePx, printPageMarginMm)
                    }
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                  >
                    −
                  </button>
                  <span className="font-mono font-extrabold text-emerald-700 min-w-[32px] text-center">
                    {printCellPaddingPx}px
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateCustomPrintLayout(printCellPaddingPx + 1, printFontSizePx, printPageMarginMm)
                    }
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Page Margin Adjuster */}
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-300">
                  <span className="text-slate-600 font-semibold">ขอบกระดาษ (Margin):</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateCustomPrintLayout(printCellPaddingPx, printFontSizePx, printPageMarginMm - 1)
                    }
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                  >
                    −
                  </button>
                  <span className="font-mono font-extrabold text-emerald-700 min-w-[38px] text-center">
                    {printPageMarginMm}mm
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateCustomPrintLayout(printCellPaddingPx, printFontSizePx, printPageMarginMm + 1)
                    }
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Print Font Size Adjuster */}
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-300">
                  <span className="text-slate-600 font-semibold">ฟอนต์พิมพ์:</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateCustomPrintLayout(printCellPaddingPx, printFontSizePx - 0.5, printPageMarginMm)
                    }
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                  >
                    −
                  </button>
                  <span className="font-mono font-extrabold text-emerald-700 min-w-[38px] text-center">
                    {printFontSizePx}px
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateCustomPrintLayout(printCellPaddingPx, printFontSizePx + 0.5, printPageMarginMm)
                    }
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Toggle: Show/Hide Reason Column */}
                <button
                  type="button"
                  onClick={toggleReasonColumn}
                  role="switch"
                  aria-checked={showReasonColumn}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border font-semibold transition cursor-pointer ${
                    showReasonColumn
                      ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      : 'bg-emerald-600 border-emerald-700 text-white'
                  }`}
                  title="เปิด/ปิด คอลัมน์ เหตุผล / เงื่อนไข ทั้งบนหน้าจอและตอนพิมพ์ (ปิดเพื่อให้ตารางกระชับขึ้น)"
                >
                  <span>ช่อง เหตุผล/เงื่อนไข:</span>
                  <span
                    className={`relative inline-flex w-8 h-4 rounded-full transition ${
                      showReasonColumn ? 'bg-emerald-500' : 'bg-white/40'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${
                        showReasonColumn ? 'left-4' : 'left-0.5'
                      }`}
                    />
                  </span>
                  <span className="font-extrabold">{showReasonColumn ? 'แสดง' : 'ซ่อน'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

            {/* Course Cards Grid (Sub-collapsible) */}
            {showCourseCards && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 animate-in fade-in duration-150">
                {availableCourses.map((c, i) => {
                  const sKey = (c as any).sectionKey || c.courseCode;
                  const isSelected =
                    sKey === selectedCourseCode ||
                    (!(c as any).sectionKey && c.courseCode === selectedCourseCode);
                  const ttTitle =
                    'timetableTitle' in c ? String((c as TimetableItem).timetableTitle || '') : '';
                  const isEn =
                    (c as any).programType === 'ENGLISH' ||
                    (c as any).programType === 'INTERNATIONAL' ||
                    /inter|eng|english|นานาชาติ/i.test(ttTitle) ||
                    /^[A-Za-z0-9\s:,\-\(\)\/\.]+$/.test((c.courseName || '').trim());

                  return (
                    <button
                      key={`elig-card-${sKey}-${i}`}
                      type="button"
                      onClick={() => {
                        handleCourseChange(sKey);
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          setShowCourseCards(false);
                        }
                      }}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/30'
                          : 'bg-slate-50/70 hover:bg-white text-slate-800 border-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-md ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                            }`}
                          >
                            {c.courseCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : isEn
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isEn ? '🌐 Inter/EN' : '🇹🇭 ภาคไทย'} • ปี {c.yearLevel || 1}
                          </span>
                        </div>
                        <div
                          className={`font-bold text-xs mt-1.5 line-clamp-1 ${
                            isSelected ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {c.courseName}
                        </div>
                      </div>
                      <div
                        className={`flex items-center justify-between text-[10px] pt-1 border-t ${
                          isSelected
                            ? 'border-white/20 text-emerald-100'
                            : 'border-slate-200/70 text-slate-500'
                        }`}
                      >
                        <span className="truncate">
                          {c.dayOfWeek || ''} {c.startTime ? `${c.startTime}-${c.endTime}` : ''}
                        </span>
                        <span className="font-semibold shrink-0 ml-1">ห้อง {c.room || '-'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Collapsible Settings Panel */}
            {showEligibilitySettings && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                    ตั้งค่าเกณฑ์เวลาเรียนและการประเมินสิทธิ์สอบ (University Exam Rules)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ตามระเบียบมหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      จำนวนคาบเรียนทั้งเทอม:
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={semesterTotalSessions}
                        onChange={(e) =>
                          setSemesterTotalSessions(Math.max(1, parseInt(e.target.value) || 16))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                      />
                      <span className="text-slate-400 font-medium">คาบ</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      เกณฑ์เวลาเรียนขั้นต่ำ:
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={minAttendancePercent}
                        onChange={(e) =>
                          setMinAttendancePercent(
                            Math.max(50, Math.min(100, parseInt(e.target.value) || 80))
                          )
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-emerald-700"
                      />
                      <span className="text-slate-400 font-medium">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      สัดส่วนการมาสาย:
                    </label>
                    <select
                      value={lateToAbsentRatio}
                      onChange={(e) => setLateToAbsentRatio(parseInt(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                    >
                      <option value="3">สาย 3 ครั้ง = ขาด 1 ครั้ง</option>
                      <option value="2">สาย 2 ครั้ง = ขาด 1 ครั้ง</option>
                      <option value="4">สาย 4 ครั้ง = ขาด 1 ครั้ง</option>
                      <option value="999">ไม่นับสายเป็นขาด</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 pb-2">
                      <input
                        type="checkbox"
                        checked={includeLeaveAsExcused}
                        onChange={(e) => setIncludeLeaveAsExcused(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>ลามีใบรับรอง = อนุโลม</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom-Right Red Chevron Toggle to collapse extra tools */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsExtraToolsOpen(false);
                  setShowCourseCards(false);
                  setShowEligibilitySettings(false);
                  setShowPrintLayoutConfig(false);
                }}
                className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition cursor-pointer shadow-2xs"
                title="ยุบเก็บเครื่องมือเสริม"
                aria-label="ยุบเก็บเครื่องมือเสริม"
              >
                <ChevronUp className="w-5 h-5 stroke-[2.75]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Print-Only Compact 1-Line Summary Bar (Replaces 5 large cards on print to save paper) */}
      <div className="hidden print:flex items-center justify-between px-3 py-1 rounded border border-slate-400 bg-slate-50 text-[11px] font-bold text-slate-900">
        <span>นิสิตทั้งหมด: {eligibilityStats.total} รูป/คน</span>
        <span>เช็คชื่อแล้ว: {recordedSessionsCount}/{semesterTotalSessions} คาบ</span>
        <span className="text-emerald-800">
          ✓ มีสิทธิ์สอบ (≥{minAttendancePercent}%): {eligibilityStats.eligible} รูป/คน
        </span>
        <span className="text-amber-800">
          ⚠️ เฝ้าระวัง: {eligibilityStats.warning} รูป/คน
        </span>
        <span className="text-rose-800">
          ✕ หมดสิทธิ์สอบ (&lt;{minAttendancePercent}%): {eligibilityStats.ineligible} รูป/คน
        </span>
      </div>

      {/* Real-time Summary Statistics Banner (Hidden on Print to save vertical space) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center print:hidden">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500">นิสิตทั้งหมด</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{eligibilityStats.total}</div>
          <div className="text-[10px] text-slate-400">รูป/คน</div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500">เช็คชื่อแล้วในระบบ</div>
          <div className="text-2xl font-black text-indigo-700 mt-0.5">
            {recordedSessionsCount} <span className="text-xs text-slate-400 font-normal">/ {semesterTotalSessions}</span>
          </div>
          <div className="text-[10px] text-indigo-600 font-semibold">
            {Math.round((recordedSessionsCount / semesterTotalSessions) * 100)}% ของเทอม
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-800 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> มีสิทธิ์สอบ (≥{minAttendancePercent}%)
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-0.5">{eligibilityStats.eligible}</div>
          <div className="text-[10px] text-emerald-600 font-semibold">
            {eligibilityStats.total > 0 ? Math.round((eligibilityStats.eligible / eligibilityStats.total) * 100) : 0}% ของชั้นเรียน
          </div>
        </div>

        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-amber-800 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> กลุ่มเฝ้าระวัง
          </div>
          <div className="text-2xl font-black text-amber-700 mt-0.5">{eligibilityStats.warning}</div>
          <div className="text-[10px] text-amber-700">ขาดครบโควตา ({maxAllowedAbsences} คาบ)</div>
        </div>

        <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200/80 shadow-sm col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-rose-800 flex items-center justify-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" /> หมดสิทธิ์สอบ (&lt;{minAttendancePercent}%)
          </div>
          <div className="text-2xl font-black text-rose-700 mt-0.5">{eligibilityStats.ineligible}</div>
          <div className="text-[10px] text-rose-600 font-semibold">ขาดเกิน {maxAllowedAbsences} ครั้ง</div>
        </div>
      </div>

      {/* If no sessions recorded yet, show a simulation prompt */}
      {recordedSessionsCount === 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block">วิชานี้ยังไม่มีบันทึกเวลาเรียนในระบบ:</span>
              <span className="text-slate-500">
                ระบบคำนวณเบื้องต้นให้นิสิตทุกคนมีสิทธิ์สอบเต็ม 100% ท่านสามารถคลิกปุ่มเพื่อจำลองข้อมูลการสอน 12 คาบสำหรับทดสอบคำนวณสิทธิ์สอบได้ทันที
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSimulateAttendance}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ จำลองบันทึก 12 คาบเพื่อทดสอบ</span>
          </button>
        </div>
      )}

      {/* Filter Toolbar & Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสนิสิต หรือชื่อ-นามสกุล..."
            value={eligibilitySearch}
            onChange={(e) => setEligibilitySearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* Mobile View Toggle: Card vs Table */}
          <div className="flex sm:hidden items-center shrink-0">
            <button
              type="button"
              onClick={() => setMobileViewMode((prev) => (prev === 'card' ? 'table' : 'card'))}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="สลับมุมมองระหว่างแบบการ์ดและตาราง"
            >
              {mobileViewMode === 'card' ? (
                <>
                  <TableIcon className="w-3.5 h-3.5 text-slate-600" />
                  <span>ตาราง</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
                  <span>การ์ด</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0 justify-center overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setEligibilityStatusFilter('ALL')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                eligibilityStatusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({eligibilityList.length})
            </button>
            <button
              type="button"
              onClick={() => setEligibilityStatusFilter('ELIGIBLE')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                eligibilityStatusFilter === 'ELIGIBLE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              มีสิทธิ์ ({eligibilityStats.eligible})
            </button>
            <button
              type="button"
              onClick={() => setEligibilityStatusFilter('WARNING')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                eligibilityStatusFilter === 'WARNING'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              เฝ้าระวัง ({eligibilityStats.warning})
            </button>
            <button
              type="button"
              onClick={() => setEligibilityStatusFilter('INELIGIBLE')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                eligibilityStatusFilter === 'INELIGIBLE'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              หมดสิทธิ์ ({eligibilityStats.ineligible})
            </button>
          </div>
        </div>
      </div>

      {/* Roster & Exam Eligibility (Mobile Card View + Desktop Table) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* 1. Mobile Card View (shown on mobile when mobileViewMode === 'card') */}
        <div className={`${mobileViewMode === 'card' ? 'block sm:hidden' : 'hidden'} print:hidden divide-y divide-slate-200`}>
          {groupedEligibilitySections.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {eligibilitySearch.trim()
                ? `ไม่พบนิสิตที่ตรงกับคำค้นหา "${eligibilitySearch}"`
                : 'ไม่พบข้อมูลนิสิตตามเงื่อนไขที่เลือก'}
            </div>
          ) : (
            groupedEligibilitySections.map((sec) => (
              <div key={`m-elig-sec-${sec.groupKey}`} className="space-y-3 p-3 bg-slate-50/60">
                {/* Major Sub-Header */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1 pt-1">
                  <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${sec.meta.badgeColor}`}>
                    {sec.meta.labelTh}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    จำนวน {sec.items.length} รูป/คน
                  </span>
                </div>

                <div className="space-y-2.5">
                  {sec.items.map((row) => {
                    const isEligible = row.status === 'ELIGIBLE';
                    const isWarning = row.status === 'WARNING';
                    const isIneligible = row.status === 'INELIGIBLE';

                    return (
                      <div
                        key={`m-card-${row.studentCode}`}
                        className={`p-3.5 rounded-2xl border shadow-2xs space-y-2.5 transition ${
                          isIneligible
                            ? 'bg-rose-50/70 border-rose-200'
                            : isWarning
                            ? 'bg-amber-50/60 border-amber-200'
                            : 'bg-white border-slate-200/90'
                        }`}
                      >
                        {/* Header: Number, Name, Code, Major & Status Badge */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-sm text-slate-900 leading-snug">
                              {row.indexInMajor}. {row.studentName}
                            </div>
                            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                              <span className="font-mono font-extrabold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 shadow-2xs">
                                {row.studentCode}
                              </span>
                              {row.major && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[11px] text-slate-500 font-medium truncate">
                                    {row.major.replace(/^สาขาวิชา/, '')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold shrink-0 border ${
                              isEligible
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : isWarning
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {isEligible && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                            {isIneligible && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                            <span>{row.statusText}</span>
                          </span>
                        </div>

                        {/* Attendance Progress & Quota */}
                        <div className="space-y-1.5 pt-0.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-600 flex items-center gap-1.5">
                              <span>เวลาเรียนจริง:</span>
                              <span className="font-mono font-extrabold text-slate-800">{row.attendedPercent}%</span>
                            </span>
                            <div>
                              {row.remainingAbsences > 0 ? (
                                <span className="text-emerald-700 font-bold text-[11px]">
                                  ขาดได้อีก {row.remainingAbsences} ครั้ง
                                </span>
                              ) : row.remainingAbsences === 0 ? (
                                <span className="text-amber-800 font-bold text-[11px] px-1.5 py-0.5 rounded bg-amber-100">
                                  ห้ามขาดอีก
                                </span>
                              ) : (
                                <span className="text-rose-700 font-bold text-[11px] px-1.5 py-0.5 rounded bg-rose-100">
                                  เกินเกณฑ์ {Math.abs(row.remainingAbsences)} ครั้ง
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Visual Progress Bar */}
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                row.attendedPercent >= minAttendancePercent
                                  ? 'bg-emerald-500'
                                  : row.attendedPercent >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, row.attendedPercent))}%` }}
                            />
                          </div>
                        </div>

                        {/* 4 Attendance Stats: มา สาย ลา ขาด */}
                        <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
                          <div className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-100/80">
                            <div className="text-[10px] font-bold text-emerald-800">มา</div>
                            <div className="text-sm font-black text-emerald-700">{row.present}</div>
                          </div>
                          <div className="p-1.5 rounded-xl bg-yellow-50 border border-yellow-100/80">
                            <div className="text-[10px] font-bold text-yellow-800">สาย</div>
                            <div className="text-sm font-black text-yellow-700">{row.late}</div>
                          </div>
                          <div className="p-1.5 rounded-xl bg-blue-50 border border-blue-100/80">
                            <div className="text-[10px] font-bold text-blue-800">ลา</div>
                            <div className="text-sm font-black text-blue-700">{row.leave}</div>
                          </div>
                          <div className="p-1.5 rounded-xl bg-rose-50 border border-rose-100/80">
                            <div className="text-[10px] font-bold text-rose-800">ขาด</div>
                            <div className="text-sm font-black text-rose-700">{row.absent}</div>
                          </div>
                        </div>

                        {/* Reason / Condition Note (if any) */}
                        {(showReasonColumn || row.reason) && row.reason && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                            <span className="font-semibold text-slate-600">เงื่อนไข: </span>
                            {row.reason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 2. Desktop Table & Print View (shown on sm: and up, or when mobileViewMode === 'table') */}
        <div className={`${mobileViewMode === 'card' ? 'hidden sm:block' : 'block'} print:block overflow-x-auto`}>
          <table className="w-full text-left text-xs text-slate-600 print:text-[10px]">
            <thead className="bg-slate-50 uppercase text-[11px] font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">ลำดับ</th>
                <th className="px-4 py-3 w-28">รหัสนิสิต</th>
                <th className="px-4 py-3">ชื่อ - นามสกุล</th>
                <th className="px-3 py-3 text-center w-12 text-emerald-700">มา</th>
                <th className="px-3 py-3 text-center w-12 text-yellow-700">สาย</th>
                <th className="px-3 py-3 text-center w-12 text-blue-700">ลา</th>
                <th className="px-3 py-3 text-center w-12 text-rose-700">ขาด</th>
                <th className="px-4 py-3 text-center w-36">เวลาเรียนจริง (%)</th>
                <th className="px-4 py-3 text-center w-28">โควตาขาดที่เหลือ</th>
                <th className="px-4 py-3 text-center w-32">สิทธิ์เข้าสอบ</th>
                {showReasonColumn && <th className="px-4 py-3">เหตุผล / เงื่อนไข</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedEligibilitySections.length === 0 ? (
                <tr>
                  <td colSpan={tableColCount} className="text-center py-12 text-slate-400">
                    ไม่พบข้อมูลนิสิตตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                groupedEligibilitySections.map((sec) => (
                  <React.Fragment key={sec.groupKey}>
                    {/* Major Sub-Header Row */}
                    <tr className="bg-slate-100/90 border-y border-slate-200">
                      <td colSpan={tableColCount} className="px-4 py-2 font-extrabold text-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${sec.meta.badgeColor}`}>
                              {sec.meta.labelTh}
                            </span>
                            <span className="text-slate-500 font-normal text-[11px]">
                              ({sec.meta.labelEn})
                            </span>
                          </span>
                          <span className="text-slate-600 font-bold text-[11px]">
                            จำนวน {sec.items.length} รูป/คน (ลำดับที่ 1 - {sec.items.length})
                          </span>
                        </div>
                      </td>
                    </tr>
                    {sec.items.map((row) => (
                      <tr
                        key={row.studentCode}
                        className={`hover:bg-slate-50/80 transition ${
                          row.status === 'INELIGIBLE'
                            ? 'bg-rose-50/30'
                            : row.status === 'WARNING'
                            ? 'bg-amber-50/20'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-500">
                          {row.indexInMajor}
                        </td>
                        <td className="px-4 py-2.5 font-mono font-extrabold text-sm sm:text-base text-slate-800 tracking-tight whitespace-nowrap">
                          {row.studentCode}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-sm sm:text-base text-slate-900">
                          <div>{row.studentName}</div>
                          {row.major && (
                            <div className="text-[10px] text-slate-400 print:hidden">{row.major}</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-emerald-700 bg-emerald-50/30">
                          {row.present}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-yellow-700 bg-yellow-50/30">
                          {row.late}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-blue-700 bg-blue-50/30">
                          {row.leave}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-rose-700 bg-rose-50/30">
                          {row.absent}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden flex-1 print:hidden">
                              <div
                                className={`h-full rounded-full ${
                                  row.attendedPercent >= minAttendancePercent
                                    ? 'bg-emerald-500'
                                    : row.attendedPercent >= 70
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${row.attendedPercent}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-700 w-10 text-right print:w-auto print:text-center">
                              {row.attendedPercent}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center font-medium">
                          {row.remainingAbsences > 0 ? (
                            <span className="text-emerald-700 font-semibold">
                              ขาดได้อีก {row.remainingAbsences} ครั้ง
                            </span>
                          ) : row.remainingAbsences === 0 ? (
                            <span className="text-amber-800 font-bold px-2 py-0.5 rounded bg-amber-100">
                              ห้ามขาดอีก
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold px-2 py-0.5 rounded bg-rose-100">
                              เกิน {Math.abs(row.remainingAbsences)} ครั้ง
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              row.status === 'ELIGIBLE'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : row.status === 'WARNING'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {row.status === 'ELIGIBLE' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {row.status === 'WARNING' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                            {row.status === 'INELIGIBLE' && <XCircle className="w-3 h-3 text-rose-600" />}
                            <span>{row.statusText}</span>
                          </span>
                        </td>
                        {showReasonColumn && (
                          <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                            {row.reason}
                          </td>
                        )}
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Sign-off block for Print (Compact spacing to fit on single page) */}
      <div className="hidden print:grid grid-cols-2 gap-6 pt-3 mt-2 text-[11px] text-slate-900 text-center break-inside-avoid">
        <div className="space-y-4">
          <div>ลงชื่อ..................................................................</div>
          <div>
            ( {currentUser ? currentUser.name : (currentCourse.instructor || 'อาจารย์ผู้รับผิดชอบรายวิชา')} )
            <br />
            <span className="text-slate-600">อาจารย์ผู้รับผิดชอบรายวิชา</span>
          </div>
        </div>
        <div className="space-y-4">
          <div>ลงชื่อ..................................................................</div>
          <div>
            ( พระราชอุดมวัชรเมธี, ผศ.ดร. )
            <br />
            <span className="text-slate-600">คณบดีคณะพุทธศาสตร์</span>
          </div>
        </div>
      </div>

      {/* Dynamic Print CSS for Tight Row Spacing, Custom Padding & Page Margins */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: ${printPageMarginMm}mm;
          }
          #printable-eligibility-report table {
            font-size: ${printFontSizePx}px !important;
            border-collapse: collapse !important;
          }
          #printable-eligibility-report table th,
          #printable-eligibility-report table td {
            padding-top: ${printCellPaddingPx}px !important;
            padding-bottom: ${printCellPaddingPx}px !important;
            padding-left: 4px !important;
            padding-right: 4px !important;
            line-height: 1.2 !important;
            border: 1px solid #cbd5e1 !important;
          }
          #printable-eligibility-report table span {
            padding-top: 0px !important;
            padding-bottom: 0px !important;
          }
        }
      `}</style>
    </div>
  );
}
