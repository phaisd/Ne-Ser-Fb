'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Printer,
  Sliders,
  ChevronDown,
  X,
  Check,
  LayoutGrid,
  List,
  MapPin,
  User,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Course, TimetableItem, DAYS_OF_WEEK } from './types';

const normCode = (s?: string) => String(s || '').replace(/\s+/g, '').toUpperCase();

export interface CourseTimetableTabProps {
  courses: Course[];
  timetables: TimetableItem[];
  settings: any;
  filterAcademicYear: string;
  ttYear: number;
  setTtYear: (val: number) => void;
  ttDegree: string;
  setTtDegree: (val: string) => void;
  ttProgram: 'THAI' | 'ENGLISH';
  setTtProgram: (val: 'THAI' | 'ENGLISH') => void;
  ttMajor: string;
  setTtMajor: (val: string) => void;
  ttDay: number | 'ALL';
  ttViewMode: 'MATRIX' | 'LIST';
  setTtViewMode: (val: 'MATRIX' | 'LIST') => void;
}

export function CourseTimetableTab({
  courses,
  timetables,
  settings,
  filterAcademicYear,
  ttYear,
  setTtYear,
  ttDegree,
  setTtDegree,
  ttProgram,
  setTtProgram,
  ttMajor,
  setTtMajor,
  ttDay,
  ttViewMode,
  setTtViewMode,
}: CourseTimetableTabProps) {
  // Print Landscape & Margin Settings (A4 Landscape 1-Page Fit)
  const [printMargin, setPrintMargin] = useState<'NARROW' | 'NORMAL' | 'WIDE'>('NARROW');
  const [showPrintMarginMenu, setShowPrintMarginMenu] = useState(false);

  const findCourseForItem = (item: TimetableItem) => {
    const target = normCode(item.courseCode);
    return courses.find((c) => normCode(c.courseCode) === target);
  };

  const handlePrintTimetable = () => {
    setShowPrintMarginMenu(false);
    if (ttViewMode !== 'MATRIX') {
      setTtViewMode('MATRIX');
      setTimeout(() => {
        window.print();
      }, 150);
    } else {
      window.print();
    }
  };

  // Available Majors for Timetable Filter
  const availableTimetableMajors = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.major && c.major.trim()) set.add(c.major.trim());
    });
    timetables.forEach((t) => {
      if (t.timetableTitle) {
        if (t.timetableTitle.includes('พระพุทธศาสนา')) set.add('พระพุทธศาสนา');
        if (t.timetableTitle.includes('ศาสนาและปรัชญา')) set.add('ศาสนาและปรัชญา');
        if (t.timetableTitle.includes('บาลีสันสกฤต')) set.add('บาลีสันสกฤต');
        if (t.timetableTitle.includes('วิปัสสนาภาวนา')) set.add('วิปัสสนาภาวนา');
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [courses, timetables]);

  // Active Days for current Degree Level
  const activeDaysForDegree = useMemo(() => {
    if (ttDegree === 'BACHELOR') {
      return settings?.timetableDaysBachelor && settings.timetableDaysBachelor.length > 0
        ? settings.timetableDaysBachelor
        : [1, 2, 3, 4];
    }
    if (ttDegree === 'MASTER') {
      return settings?.timetableDaysMaster && settings.timetableDaysMaster.length > 0
        ? settings.timetableDaysMaster
        : [6, 7];
    }
    if (ttDegree === 'DOCTORAL') {
      return settings?.timetableDaysDoctoral && settings.timetableDaysDoctoral.length > 0
        ? settings.timetableDaysDoctoral
        : [6, 7];
    }
    if (ttDegree === 'CERTIFICATE') {
      return settings?.timetableDaysCertificate && settings.timetableDaysCertificate.length > 0
        ? settings.timetableDaysCertificate
        : [6, 7];
    }
    return [1, 2, 3, 4, 5, 6, 7];
  }, [ttDegree, settings]);

  // Display Days for the Timetable Table
  const displayDays = useMemo(() => {
    return DAYS_OF_WEEK.filter((d) => {
      if (ttDay !== 'ALL' && d.id !== ttDay) return false;
      return activeDaysForDegree.includes(d.id);
    });
  }, [activeDaysForDegree, ttDay]);

  // Timetable Degree Note
  const currentDegreeNote = useMemo(() => {
    if (ttDegree === 'BACHELOR') {
      return (
        settings?.timetableNotesBachelor ??
        'หมายเหตุ\t๑. วันพระและวันนักขัตฤกษ์เป็นวันหยุดทั่วไป (ตารางเรียนวันใดตรงกับวันพระให้ยกไปเรียนวันศุกร์)\n\t๒. *รายวิชาข้อสอบกลาง'
      );
    }
    if (ttDegree === 'MASTER') {
      return (
        settings?.timetableNotesMaster ??
        'หมายเหตุ\t๑. จัดการเรียนการสอนวันเสาร์ - วันอาทิตย์ ตามตารางที่หลักสูตรกำหนด'
      );
    }
    if (ttDegree === 'DOCTORAL') {
      return (
        settings?.timetableNotesDoctoral ??
        'หมายเหตุ\t๑. จัดการเรียนการสอนวันเสาร์ - วันอาทิตย์ ตามตารางที่หลักสูตรกำหนด'
      );
    }
    if (ttDegree === 'CERTIFICATE') {
      return (
        settings?.timetableNotesCertificate ??
        'หมายเหตุ\t๑. จัดการเรียนการสอนตามประกาศตารางเรียนหลักสูตรประกาศนียบัตร'
      );
    }
    return settings?.timetableNotesBachelor || '';
  }, [ttDegree, settings]);

  const degreeLabelTh = useMemo(() => {
    if (ttDegree === 'BACHELOR') return 'ระดับปริญญาตรี (พธ.บ.)';
    if (ttDegree === 'MASTER') return 'ระดับปริญญาโท (พธ.ม.)';
    if (ttDegree === 'DOCTORAL') return 'ระดับปริญญาเอก (พธ.ด.)';
    if (ttDegree === 'CERTIFICATE') return 'หลักสูตรประกาศนียบัตร';
    return 'ทุกระดับการศึกษา';
  }, [ttDegree]);

  // Filtered Timetable Items (4 Dimensions)
  const filteredTimetableItems = useMemo(() => {
    const matchedList = timetables.filter((t) => {
      if (t.yearLevel !== ttYear) return false;
      if (filterAcademicYear !== 'ALL' && t.academicYear && String(t.academicYear) !== filterAcademicYear) {
        return false;
      }
      if (ttDay !== 'ALL' && t.dayOfWeek !== ttDay) return false;
      if (!activeDaysForDegree.includes(t.dayOfWeek)) return false;

      const isEnglish =
        t.timetableTitle?.includes('ภาษาอังกฤษ') ||
        t.timetableTitle?.toLowerCase().includes('english') ||
        t.timetableTitle?.toLowerCase().includes('inter');
      if (ttProgram === 'ENGLISH' && !isEnglish) return false;
      if (ttProgram === 'THAI' && isEnglish) return false;

      if (ttMajor !== 'ALL') {
        const titleMatch = t.timetableTitle?.includes(ttMajor);
        const course = courses.find((c) => c.courseCode === t.courseCode);
        const courseMatch = course?.major?.includes(ttMajor);
        if (!titleMatch && !courseMatch) return false;
      }

      if (ttDegree === 'MASTER') {
        const isMaster = t.timetableTitle?.includes('มหาบัณฑิต');
        const course = courses.find((c) => c.courseCode === t.courseCode);
        if (!isMaster && course?.degreeLevel !== 'ปริญญาโท') return false;
      } else if (ttDegree === 'DOCTORAL') {
        const isDoc = t.timetableTitle?.includes('ดุษฎีบัณฑิต');
        const course = courses.find((c) => c.courseCode === t.courseCode);
        if (!isDoc && course?.degreeLevel !== 'ปริญญาเอก') return false;
      } else if (ttDegree === 'CERTIFICATE') {
        const isCert = t.timetableTitle?.includes('ประกาศนียบัตร');
        const course = courses.find((c) => c.courseCode === t.courseCode);
        if (!isCert && course?.degreeLevel !== 'ประกาศนียบัตร') return false;
      } else if (ttDegree === 'BACHELOR') {
        if (
          t.timetableTitle?.includes('มหาบัณฑิต') ||
          t.timetableTitle?.includes('ดุษฎีบัณฑิต') ||
          t.timetableTitle?.includes('ประกาศนียบัตร')
        ) {
          return false;
        }
      }

      return true;
    });

    const seen = new Set<string>();
    const deduplicated: TimetableItem[] = [];

    matchedList.forEach((item) => {
      const normTime = (item.startTime || '').replace(/[:.]/g, '.').trim();
      const key = `${item.courseCode}_${item.dayOfWeek}_${normTime}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(item);
      }
    });

    return deduplicated;
  }, [timetables, courses, ttYear, filterAcademicYear, ttDay, ttProgram, ttMajor, ttDegree, activeDaysForDegree]);

  return (
    <div className="space-y-5">
      {/* 4-Dimensional Filter Control Panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                ตารางเรียนและตารางสอน คณะพุทธศาสตร์ (4 มิติ)
              </h3>
              <p className="text-xs text-slate-400">
                เลือกเงื่อนไขหลักสูตร, ภาษา, สาขาวิชา และชั้นปี เพื่อดูตารางเรียนรายสัปดาห์
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Print Button & Margin Selector (A4 Landscape 1-Page Fit) */}
            <div className="relative inline-flex items-center">
              <div className="inline-flex rounded-xl shadow-xs border border-amber-300 bg-amber-500 hover:bg-amber-600 transition overflow-hidden">
                <button
                  type="button"
                  onClick={handlePrintTimetable}
                  className="px-3.5 py-1.5 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
                  title="พิมพ์ตารางเรียนเป็นกระดาษ A4 แนวนอน (พอดี 1 หน้า ไม่ล้นไปหน้าที่ 2)"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>พิมพ์ตารางเรียน (A4 แนวนอน)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintMarginMenu(!showPrintMarginMenu)}
                  className="px-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white border-l border-amber-400 transition cursor-pointer flex items-center gap-0.5 text-[11px]"
                  title="ปรับระยะขอบกระดาษ (ชิดขอบ / ขอบกว้าง)"
                >
                  <Sliders className="w-3 h-3 text-amber-100" />
                  <ChevronDown className="w-3 h-3 text-white" />
                </button>
              </div>

              {/* Margin Settings Dropdown */}
              {showPrintMarginMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-600" />
                      <span>ตั้งค่ากระดาษ A4 แนวนอน</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPrintMarginMenu(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="py-2 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                      ระยะขอบกระดาษ (Margins):
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPrintMargin('NARROW');
                        setShowPrintMarginMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl transition flex items-center justify-between cursor-pointer ${
                        printMargin === 'NARROW'
                          ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs flex items-center gap-1">
                          <span>ชิดขอบ (4mm)</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                            แนะนำ
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          พอดี 1 หน้ากระดาษ A4 ไม่ล้นไปหน้าที่ 2
                        </div>
                      </div>
                      {printMargin === 'NARROW' && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrintMargin('NORMAL');
                        setShowPrintMarginMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl transition flex items-center justify-between cursor-pointer ${
                        printMargin === 'NORMAL'
                          ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs">ขอบมาตรฐาน (8mm)</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          ระยะขอบสมดุล เหมาะสำหรับ 3-4 วัน
                        </div>
                      </div>
                      {printMargin === 'NORMAL' && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrintMargin('WIDE');
                        setShowPrintMarginMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl transition flex items-center justify-between cursor-pointer ${
                        printMargin === 'WIDE'
                          ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs">ขอบกว้าง (12mm)</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          เว้นระยะขอบกว้างสบายตา
                        </div>
                      </div>
                      {printMargin === 'WIDE' && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handlePrintTimetable}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>สั่งพิมพ์ทันที</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* View Switcher: Matrix vs Cards */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setTtViewMode('MATRIX')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  ttViewMode === 'MATRIX'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>ตารางรายสัปดาห์ (Matrix)</span>
              </button>
              <button
                onClick={() => setTtViewMode('LIST')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  ttViewMode === 'LIST'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>แบบรายการการ์ด</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Dimension Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* 1. ระดับหลักสูตร (Degree Level) */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              1. ระดับหลักสูตร (Degree Level):
            </label>
            <select
              value={ttDegree}
              onChange={(e) => setTtDegree(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="BACHELOR">🎓 ปริญญาตรี (พธ.บ.)</option>
              <option value="MASTER">🎓 ปริญญาโท (พธ.ม.)</option>
              <option value="DOCTORAL">🎓 ปริญญาเอก (พธ.ด.)</option>
              <option value="CERTIFICATE">📜 ประกาศนียบัตร</option>
              <option value="ALL">ทุกระดับการศึกษา</option>
            </select>
          </div>

          {/* 2. หลักสูตรภาษา (Program Type) */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              2. หลักสูตรภาษา (Program):
            </label>
            <select
              value={ttProgram}
              onChange={(e) => setTtProgram(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="THAI">🇹🇭 ภาคภาษาไทย (Regular)</option>
              <option value="ENGLISH">🌐 ภาคภาษาอังกฤษ (International)</option>
            </select>
          </div>

          {/* 3. สาขาวิชา (Major) */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              3. สาขาวิชา (Major):
            </label>
            <select
              value={ttMajor}
              onChange={(e) => setTtMajor(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="ALL">-- ทุกสาขาวิชา --</option>
              {availableTimetableMajors.map((m) => (
                <option key={m} value={m}>
                  สาขาวิชา{m}
                </option>
              ))}
            </select>
          </div>

          {/* 4. ชั้นปี (Year Level) */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              4. ชั้นปี (Year Level):
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setTtYear(y)}
                  className={`py-2 rounded-xl font-bold border transition text-center cursor-pointer ${
                    ttYear === y
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-600/20'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  ปี {y}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PRINTABLE TIMETABLE SHEET CONTAINER */}
      <div id="timetable-printable-sheet" className="timetable-printable-wrapper space-y-4 print:space-y-1">
        {/* 1. Official Document Header (Visible ONLY when printed on Landscape A4) */}
        <div className="hidden print:flex items-center justify-between border-b-2 border-amber-600 pb-1 mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-300 flex items-center justify-center text-lg shrink-0 font-bold">
              ☸️
            </div>
            <div>
              <div className="text-[12.5px] font-extrabold text-slate-900 leading-tight">
                {settings?.facultyNameTh || 'คณะพุทธศาสตร์'} {settings?.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}
              </div>
              <div className="text-[10px] font-bold text-amber-800">
                ตารางเรียนและตารางสอน {filterAcademicYear !== 'ALL' ? `ปีการศึกษา ${filterAcademicYear}` : 'ประจำภาคการศึกษา'} ({degreeLabelTh})
              </div>
            </div>
          </div>
          <div className="text-right text-[9px] text-slate-700 leading-tight">
            <div className="font-bold text-slate-900">
              {ttProgram === 'ENGLISH' ? '🌐 ภาคภาษาอังกฤษ (Inter)' : '🇹🇭 ภาคภาษาไทย'} • {ttMajor === 'ALL' ? 'ทุกสาขาวิชา' : `สาขาวิชา${ttMajor}`} • ชั้นปีที่ {ttYear}
            </div>
            <div className="text-slate-500 text-[8px] mt-0.5 font-mono">
              พิมพ์เมื่อ: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น. (พอดี 1 แผ่น A4)
            </div>
          </div>
        </div>

        {/* 2. Active Filter Summary Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl text-xs print:bg-amber-50/50 print:border-amber-300 print:p-1 print:rounded-lg print:text-[9px] print:mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-amber-950 flex items-center gap-1">
              <span>📌 กำลังแสดงตารางเรียน:</span>
            </span>
            <span className="bg-white px-2.5 py-1 print:px-1.5 print:py-0 rounded-lg border border-amber-200 font-semibold text-amber-900 shadow-2xs print:shadow-none print:text-[9px]">
              {degreeLabelTh}
            </span>
            <span className="bg-white px-2.5 py-1 print:px-1.5 print:py-0 rounded-lg border border-amber-200 font-semibold text-purple-800 shadow-2xs print:shadow-none print:text-[9px]">
              📅 {displayDays.map((d) => d.label.replace('วัน', '')).join(', ')}
            </span>
            <span className="bg-white px-2.5 py-1 print:px-1.5 print:py-0 rounded-lg border border-amber-200 font-semibold text-emerald-800 shadow-2xs print:shadow-none print:text-[9px]">
              {ttProgram === 'ENGLISH' ? '🌐 ภาคภาษาอังกฤษ (Inter)' : '🇹🇭 ภาคภาษาไทย'}
            </span>
            <span className="bg-white px-2.5 py-1 print:px-1.5 print:py-0 rounded-lg border border-amber-200 font-semibold text-blue-800 shadow-2xs print:shadow-none print:text-[9px]">
              {ttMajor === 'ALL' ? 'ทุกสาขาวิชา' : `สาขาวิชา${ttMajor}`}
            </span>
            <span className="bg-amber-600 text-white px-2.5 py-1 print:px-1.5 print:py-0 rounded-lg font-bold shadow-xs print:shadow-none print:text-[9px]">
              ชั้นปีที่ {ttYear}
            </span>
            <span className="text-slate-400 font-mono text-[11px] print:text-[8.5px]">
              (พบ {filteredTimetableItems.length} คาบเรียน)
            </span>
          </div>
          <div className="text-slate-500 text-[11px] font-medium print:hidden">
            สัญลักษณ์ <span className="text-amber-700 font-bold font-mono">*</span> = อาจารย์ผู้รับผิดชอบรายวิชา • คั่น <span className="text-slate-600 font-bold font-mono">/</span> = ผู้สอนร่วม
          </div>
        </div>

        {/* 3. VIEW 1: MATRIX VIEW (WEEKLY TIMETABLE TABLE) - Visible in MATRIX mode OR when printing */}
        <div className={`${ttViewMode === 'MATRIX' ? 'block' : 'hidden print:block'} bg-white rounded-3xl print:rounded-lg border border-slate-200/90 print:border-slate-300 shadow-sm print:shadow-none overflow-hidden`}>
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse min-w-[950px] print:min-w-full print:w-full print:table-fixed">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 text-xs border-b border-slate-200 print:border-slate-300">
                  <th className="w-32 print:w-[10%] py-3.5 px-4 print:py-1 print:px-1.5 font-bold border-r border-slate-200 print:border-slate-300 text-center print:text-[9.5px]">
                    วัน / เวลา
                  </th>
                  <th className="py-3.5 px-4 print:py-1 print:px-1.5 font-bold border-r border-slate-200 print:border-slate-300 text-center bg-amber-50/50 print:w-[35%] print:text-[9.5px]">
                    <div>{settings?.morningPeriodLabel || 'คาบเช้า (09:00 - 11:30 น.)'}</div>
                    <div className="text-[10px] print:text-[8px] text-slate-400 font-normal">{settings?.morningPeriodSub || 'ภาคการศึกษาปกติ'}</div>
                  </th>
                  <th className="w-24 print:w-[7%] py-3.5 px-2 print:py-1 print:px-0.5 font-bold border-r border-slate-200 print:border-slate-300 text-center bg-slate-200/50 text-slate-600 text-[11px] print:text-[8px]">
                    <div>{settings?.lunchPeriodLabel || 'พักกลางวัน'}</div>
                    <span className="text-[9.5px] print:text-[7.5px] font-normal font-mono text-slate-500">{settings?.lunchPeriodTime || '11:30 - 13:00'}</span>
                  </th>
                  <th className="py-3.5 px-4 print:py-1 print:px-1.5 font-bold border-r border-slate-200 print:border-slate-300 text-center bg-blue-50/40 print:w-[34%] print:text-[9.5px]">
                    <div>{settings?.afternoonPeriodLabel || 'คาบบ่าย (13:00 - 15:30 น.)'}</div>
                    <div className="text-[10px] print:text-[8px] text-slate-400 font-normal">{settings?.afternoonPeriodSub || 'ภาคการศึกษาปกติ'}</div>
                  </th>
                  <th className="w-64 print:w-[14%] py-3.5 px-4 print:py-1 print:px-1.5 font-bold text-center bg-purple-50/30 print:text-[9.5px]">
                    <div>{settings?.eveningPeriodLabel || 'คาบเย็น / ปฏิบัติการ (16:00 - 18:30 น.)'}</div>
                    <div className="text-[10px] print:text-[8px] text-slate-400 font-normal">{settings?.eveningPeriodSub || 'วิชาสัมมนา / กัมมัฏฐาน'}</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 print:divide-slate-300 text-xs">
                {displayDays.map((day) => {
                  const dayItems = filteredTimetableItems.filter((t) => t.dayOfWeek === day.id);

                  const morningItems = dayItems.filter((t) => {
                    const clean = (t.startTime || '').replace(/[:.]/g, '.').trim();
                    const h = parseFloat(clean);
                    return isNaN(h) || h < 12;
                  });

                  const afternoonItems = dayItems.filter((t) => {
                    const clean = (t.startTime || '').replace(/[:.]/g, '.').trim();
                    const h = parseFloat(clean);
                    return !isNaN(h) && h >= 12 && h < 16;
                  });

                  const eveningItems = dayItems.filter((t) => {
                    const clean = (t.startTime || '').replace(/[:.]/g, '.').trim();
                    const h = parseFloat(clean);
                    return !isNaN(h) && h >= 16;
                  });

                  return (
                    <tr key={day.id} className={`${day.rowBg} ${day.borderLeft} transition-colors`}>
                      {/* Day Label Cell */}
                      <td className="p-3 print:p-1 text-center border-r border-slate-200 print:border-slate-300 font-bold align-top">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 print:px-1.5 print:py-0.5 rounded-xl print:rounded-md text-xs print:text-[9.5px] font-semibold ${day.badgeBg} border shadow-2xs print:shadow-none`}>
                          <span className={`w-2.5 h-2.5 print:w-2 print:h-2 rounded-full ${day.color}`} />
                          <span>{day.label}</span>
                        </span>
                      </td>

                      {/* Morning Slot */}
                      <td className="p-2.5 print:p-1 border-r border-slate-200 print:border-slate-300 align-top">
                        {morningItems.length === 0 ? (
                          <div className={`h-full min-h-[85px] print:min-h-[36px] rounded-2xl print:rounded-md border border-dashed ${day.slotBg} flex items-center justify-center text-xs print:text-[8.5px] italic font-medium`}>
                            - ไม่มีวิชาเรียน -
                          </div>
                        ) : (
                          <div className="space-y-2 print:space-y-0.5">
                            {morningItems.map((item, idx) => {
                              const course = findCourseForItem(item);
                              const credits = course?.credits || 3;
                              const inst = course?.instructor || item.instructor || 'ยังไม่ระบุอาจารย์';
                              const isCoord = inst.includes('*');
                              const isTeam = inst.includes('/');

                              return (
                                <div
                                  key={idx}
                                  className="p-3.5 print:p-1.5 rounded-2xl print:rounded-lg bg-white border border-slate-200/90 print:border-slate-300 shadow-xs hover:border-amber-400 hover:shadow-md transition space-y-2 print:space-y-0.5 group print:shadow-none"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono font-bold text-xs print:text-[9px] text-amber-900 bg-amber-50 px-2 py-0.5 print:px-1 print:py-0 rounded border border-amber-200">
                                      {item.courseCode}
                                    </span>
                                    <span className="text-[11px] print:text-[8px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 print:px-1 print:py-0 rounded">
                                      {credits} หน่วยกิต
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-slate-900 text-xs print:text-[9.5px] leading-snug print:leading-tight group-hover:text-amber-700 transition line-clamp-2 print:line-clamp-2">
                                    {item.courseName}
                                  </h4>
                                  <div className="space-y-1 print:space-y-0.5 pt-1.5 print:pt-0.5 border-t border-slate-100 text-[11px] print:text-[8px] text-slate-600">
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                      <MapPin className="w-3 h-3 print:w-2 print:h-2 text-rose-500 shrink-0" />
                                      <span className="font-medium line-clamp-1">{item.room || 'ไม่ระบุห้อง'}</span>
                                    </div>
                                    <div className="flex items-start gap-1 text-slate-600 leading-tight">
                                      <User className="w-3 h-3 print:w-2 print:h-2 text-emerald-600 shrink-0 mt-0.5" />
                                      <span className={`line-clamp-2 ${isCoord ? 'text-slate-900 font-semibold' : ''}`}>
                                        {inst.replace(/\*/g, '')}
                                        {isCoord && <span className="text-amber-600 font-bold ml-1">*</span>}
                                        {isTeam && (
                                          <span className="ml-1 text-[9px] print:text-[7.5px] bg-blue-50 text-blue-700 px-1 py-0.2 rounded font-semibold border border-blue-200">
                                            สอนร่วม
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    <div className="text-[10px] print:text-[7.5px] text-slate-400 font-mono">
                                      ⏰ {item.startTime} - {item.endTime} น.
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Lunch Break Cell */}
                      <td className="p-2 print:p-1 border-r border-slate-200 print:border-slate-300 bg-slate-100/40 text-center text-[10.5px] print:text-[8px] text-slate-600 font-medium align-middle">
                        <div>🍱 {settings?.lunchPeriodLabel || 'พักฉัน / พักกลางวัน'}</div>
                        {settings?.lunchPeriodTime && (
                          <div className="text-[9.5px] print:text-[7.5px] text-slate-400 font-mono mt-0.5">{settings.lunchPeriodTime}</div>
                        )}
                      </td>

                      {/* Afternoon Slot */}
                      <td className="p-2.5 print:p-1 border-r border-slate-200 print:border-slate-300 align-top">
                        {afternoonItems.length === 0 ? (
                          <div className={`h-full min-h-[85px] print:min-h-[36px] rounded-2xl print:rounded-md border border-dashed ${day.slotBg} flex items-center justify-center text-xs print:text-[8.5px] italic font-medium`}>
                            - ไม่มีวิชาเรียน -
                          </div>
                        ) : (
                          <div className="space-y-2 print:space-y-0.5">
                            {afternoonItems.map((item, idx) => {
                              const course = findCourseForItem(item);
                              const credits = course?.credits || 3;
                              const inst = course?.instructor || item.instructor || 'ยังไม่ระบุอาจารย์';
                              const isCoord = inst.includes('*');
                              const isTeam = inst.includes('/');

                              return (
                                <div
                                  key={idx}
                                  className="p-3.5 print:p-1.5 rounded-2xl print:rounded-lg bg-white border border-slate-200/90 print:border-slate-300 shadow-xs hover:border-amber-400 hover:shadow-md transition space-y-2 print:space-y-0.5 group print:shadow-none"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono font-bold text-xs print:text-[9px] text-amber-900 bg-amber-50 px-2 py-0.5 print:px-1 print:py-0 rounded border border-amber-200">
                                      {item.courseCode}
                                    </span>
                                    <span className="text-[11px] print:text-[8px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 print:px-1 print:py-0 rounded">
                                      {credits} หน่วยกิต
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-slate-900 text-xs print:text-[9.5px] leading-snug print:leading-tight group-hover:text-amber-700 transition line-clamp-2 print:line-clamp-2">
                                    {item.courseName}
                                  </h4>
                                  <div className="space-y-1 print:space-y-0.5 pt-1.5 print:pt-0.5 border-t border-slate-100 text-[11px] print:text-[8px] text-slate-600">
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                      <MapPin className="w-3 h-3 print:w-2 print:h-2 text-rose-500 shrink-0" />
                                      <span className="font-medium line-clamp-1">{item.room || 'ไม่ระบุห้อง'}</span>
                                    </div>
                                    <div className="flex items-start gap-1 text-slate-600 leading-tight">
                                      <User className="w-3 h-3 print:w-2 print:h-2 text-emerald-600 shrink-0 mt-0.5" />
                                      <span className={`line-clamp-2 ${isCoord ? 'text-slate-900 font-semibold' : ''}`}>
                                        {inst.replace(/\*/g, '')}
                                        {isCoord && <span className="text-amber-600 font-bold ml-1">*</span>}
                                        {isTeam && (
                                          <span className="ml-1 text-[9px] print:text-[7.5px] bg-blue-50 text-blue-700 px-1 py-0.2 rounded font-semibold border border-blue-200">
                                            สอนร่วม
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    <div className="text-[10px] print:text-[7.5px] text-slate-400 font-mono">
                                      ⏰ {item.startTime} - {item.endTime} น.
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Evening / Lab Slot */}
                      <td className="p-2.5 print:p-1 align-top">
                        {eveningItems.length === 0 ? (
                          <div className={`h-full min-h-[85px] print:min-h-[36px] rounded-2xl print:rounded-md border border-dashed ${day.slotBg} flex items-center justify-center text-xs print:text-[8.5px] italic font-medium`}>
                            - ไม่มีวิชาเรียน -
                          </div>
                        ) : (
                          <div className="space-y-2 print:space-y-0.5">
                            {eveningItems.map((item, idx) => {
                              const course = findCourseForItem(item);
                              const credits = course?.credits || 3;
                              const inst = course?.instructor || item.instructor || 'ยังไม่ระบุอาจารย์';

                              return (
                                <div
                                  key={idx}
                                  className="p-3.5 print:p-1.5 rounded-2xl print:rounded-lg bg-white border border-slate-200/90 print:border-slate-300 shadow-xs hover:border-purple-400 hover:shadow-md transition space-y-2 print:space-y-0.5 group print:shadow-none"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono font-bold text-xs print:text-[9px] text-purple-900 bg-purple-50 px-2 py-0.5 print:px-1 print:py-0 rounded border border-purple-200">
                                      {item.courseCode}
                                    </span>
                                    <span className="text-[11px] print:text-[8px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 print:px-1 print:py-0 rounded">
                                      {credits} หน่วยกิต
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-slate-900 text-xs print:text-[9.5px] leading-snug print:leading-tight group-hover:text-purple-700 transition line-clamp-2 print:line-clamp-2">
                                    {item.courseName}
                                  </h4>
                                  <div className="space-y-1 print:space-y-0.5 pt-1.5 print:pt-0.5 border-t border-slate-100 text-[11px] print:text-[8px] text-slate-600">
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                      <MapPin className="w-3 h-3 print:w-2 print:h-2 text-rose-500 shrink-0" />
                                      <span className="font-medium line-clamp-1">{item.room || 'ไม่ระบุห้อง'}</span>
                                    </div>
                                    <div className="flex items-start gap-1 text-slate-600 leading-tight">
                                      <User className="w-3 h-3 print:w-2 print:h-2 text-emerald-600 shrink-0 mt-0.5" />
                                      <span className="line-clamp-2">{inst.replace(/\*/g, '')}</span>
                                    </div>
                                    <div className="text-[10px] print:text-[7.5px] text-slate-400 font-mono">
                                      ⏰ {item.startTime} - {item.endTime} น.
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* VIEW 2: CARDS LIST VIEW (Hidden when printing) */}
        {ttViewMode === 'LIST' && (
          <div className="print:hidden">
            {filteredTimetableItems.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                ไม่มีตารางเรียนสำหรับเงื่อนไขที่เลือก (ชั้นปีที่ {ttYear} • {ttProgram === 'ENGLISH' ? 'ภาคอังกฤษ' : 'ภาคไทย'})
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTimetableItems.map((item, idx) => {
                  const dayObj =
                    DAYS_OF_WEEK.find((d) => d.id === item.dayOfWeek) || DAYS_OF_WEEK[0];
                  const course = findCourseForItem(item);
                  const credits = course?.credits || 3;
                  const inst = course?.instructor || item.instructor || 'ยังไม่ระบุอาจารย์';
                  const isCoord = inst.includes('*');
                  const isTeam = inst.includes('/');

                  return (
                    <div
                      key={idx}
                      className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                          <span className={`w-2 h-2 rounded-full ${dayObj.color}`} />
                          {dayObj.label}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          {item.courseCode} ({credits} นก.)
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 leading-snug">
                          {item.courseName}
                        </h4>
                        {item.timetableTitle && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                            {item.timetableTitle}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>เวลา {item.startTime} - {item.endTime} น.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>{item.room || 'ไม่ระบุห้อง'}</span>
                        </div>
                        {inst && (
                          <div className="flex items-start gap-2">
                            <User className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">
                              {inst.replace(/\*/g, '')}
                              {isCoord && <span className="text-amber-600 font-bold ml-1">* ผู้รับผิดชอบ</span>}
                              {isTeam && (
                                <span className="ml-1 text-[9px] bg-blue-50 text-blue-700 px-1 py-0.2 rounded font-semibold border border-blue-200">
                                  สอนร่วม
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Timetable Degree Note Box */}
        {currentDegreeNote && (
          <div className="bg-amber-50/80 border-2 border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2 print:bg-amber-50/50 print:border print:border-amber-300 print:rounded-lg print:p-1.5 print:mt-1 print:space-y-0.5">
            <div className="flex items-center gap-2 text-xs print:text-[9.5px] font-bold text-amber-950">
              <AlertCircle className="w-4 h-4 print:w-3 print:h-3 text-amber-600 shrink-0" />
              <span>หมายเหตุตารางเรียน ({degreeLabelTh}):</span>
            </div>
            <div className="text-xs print:text-[9px] text-slate-800 leading-relaxed print:leading-snug whitespace-pre-wrap font-medium pl-6 print:pl-4 [tab-size:4]">
              {currentDegreeNote}
            </div>
          </div>
        )}

        {/* Document Print Footer Line */}
        <div className="hidden print:flex items-center justify-between pt-1 border-t border-slate-200 text-[8px] text-slate-500">
          <div>
            * หมายเหตุ: สัญลักษณ์ <span className="font-bold font-mono">*</span> = อาจารย์ผู้รับผิดชอบรายวิชา • คั่น <span className="font-bold font-mono">/</span> = ผู้สอนร่วม • ตารางเรียนอาจมีการปรับปรุงตามประกาศของคณะ
          </div>
          <div className="font-mono">
            ระบบบริการการศึกษาและตารางสอน คณะพุทธศาสตร์ มจร • หน้า 1/1
          </div>
        </div>
      </div>

      {/* Global Print Stylesheet for Guaranteed 1-Page Landscape A4 Printing */}
      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: ${
            printMargin === 'NARROW'
              ? '4mm 6mm'
              : printMargin === 'NORMAL'
              ? '7mm 9mm'
              : '11mm 13mm'
          };
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
            font-family: 'Sarabun', 'Bai Jamjuree', sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, footer, aside, .print\\:hidden {
            display: none !important;
          }
          body * {
            visibility: hidden;
          }
          #timetable-printable-sheet,
          #timetable-printable-sheet * {
            visibility: visible;
          }
          #timetable-printable-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
          }
          #timetable-printable-sheet table {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
        }
      `}</style>
    </div>
  );
}
