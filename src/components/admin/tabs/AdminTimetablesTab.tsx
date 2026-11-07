'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  RefreshCw,
  ExternalLink,
  Search,
  Upload,
  Download,
  ChevronDown,
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  Printer,
  Globe,
} from 'lucide-react';
import { TimetableItem } from '@/types';
import { CourseImportModal } from '../modals';

const DAY_COLORS: Record<number, string> = {
  1: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  2: 'bg-pink-50 text-pink-800 border-pink-200',
  3: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  4: 'bg-orange-50 text-orange-800 border-orange-200',
  5: 'bg-blue-50 text-blue-800 border-blue-200',
  6: 'bg-purple-50 text-purple-800 border-purple-200',
  0: 'bg-red-50 text-red-800 border-red-200',
};

const DAY_NAMES: Record<number, string> = {
  1: 'วันจันทร์',
  2: 'วันอังคาร',
  3: 'วันพุธ',
  4: 'วันพฤหัสบดี',
  5: 'วันศุกร์',
  6: 'วันเสาร์',
  0: 'วันอาทิตย์',
};

interface AdminTimetablesTabProps {
  timetablesList: TimetableItem[];
  filteredTimetables: TimetableItem[];
  timetableSearch: string;
  setTimetableSearch: (val: string) => void;
  timetableYearFilter: string;
  setTimetableYearFilter: (val: string) => void;
  timetableSemesterFilter: string;
  setTimetableSemesterFilter: (val: string) => void;
  timetableDayFilter: string;
  setTimetableDayFilter: (val: string) => void;
  timetableMajorFilter?: string;
  setTimetableMajorFilter?: (val: string) => void;
  timetableProgramFilter?: string;
  setTimetableProgramFilter?: (val: string) => void;
  handleScanTimetables: () => void;
  isScanningInstructors: boolean;
}

export const AdminTimetablesTab: React.FC<AdminTimetablesTabProps> = ({
  timetablesList,
  filteredTimetables,
  timetableSearch,
  setTimetableSearch,
  timetableYearFilter,
  setTimetableYearFilter,
  timetableSemesterFilter,
  setTimetableSemesterFilter,
  timetableDayFilter,
  setTimetableDayFilter,
  timetableMajorFilter = 'ALL',
  setTimetableMajorFilter,
  timetableProgramFilter = 'ALL',
  setTimetableProgramFilter,
  handleScanTimetables,
  isScanningInstructors,
}) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Export Timetables to CSV with UTF-8 BOM for Thai Excel compatibility
  const exportTimetablesToCSV = (items: TimetableItem[], filename: string) => {
    const headers = [
      'รหัสวิชา',
      'ชื่อรายวิชา',
      'ระดับหลักสูตร',
      'หลักสูตร',
      'สาขาวิชา',
      'ชั้นปี',
      'ภาคเรียน',
      'ปีการศึกษา',
      'วันเรียน',
      'รหัสวัน (1=จันทร์)',
      'เวลาเริ่ม',
      'เวลาสิ้นสุด',
      'ห้องเรียน',
      'อาจารย์ผู้สอน',
    ];

    const rows = items.map((t) => [
      `"${(t.courseCode || '').replace(/"/g, '""')}"`,
      `"${(t.courseName || '').replace(/"/g, '""')}"`,
      `"${(t.degreeLevel || 'ปริญญาตรี').replace(/"/g, '""')}"`,
      `"${t.programType === 'ENGLISH' ? 'หลักสูตรภาษาอังกฤษ (English Program)' : 'หลักสูตรภาษาไทย (Thai Program)'}"`,
      `"${(t.major || 'ทั่วไป').replace(/"/g, '""')}"`,
      `"${t.yearLevel ?? ''}"`,
      `"${t.semester ?? ''}"`,
      `"${t.academicYear || ''}"`,
      `"${DAY_NAMES[t.dayOfWeek] || ''}"`,
      `"${t.dayOfWeek ?? ''}"`,
      `"${t.startTime || ''}"`,
      `"${t.endTime || ''}"`,
      `"${(t.room || '').replace(/"/g, '""')}"`,
      `"${(t.instructor || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  const handlePrintPdf = () => {
    setIsExportMenuOpen(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────
          SCREEN VIEW (Hidden on Print)
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4 print:hidden">
        {/* Header Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              ตารางเรียนและตารางสอน (Class Schedules & Timetables)
            </h2>
            <p className="text-xs text-slate-500">
              รายการคาบสอนทั้งหมด {timetablesList.length} คาบ พร้อมข้อมูลระดับหลักสูตร, สาขาวิชา, ห้องเรียน และอาจารย์ผู้สอน
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Import Modal Button */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
              title="นำเข้าตารางเรียนและรายวิชาจากไฟล์ Excel หรือ CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>📥 นำเข้า Excel / CSV</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>📤 ส่งออก / พิมพ์</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1">
                  <button
                    type="button"
                    onClick={() =>
                      exportTimetablesToCSV(
                        filteredTimetables,
                        `timetables_filtered_${new Date().toISOString().slice(0, 10)}.csv`
                      )
                    }
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-slate-700 cursor-pointer"
                  >
                    <span>ส่งออกตารางที่กรองอยู่ ({filteredTimetables.length} คาบ)</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">.csv</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      exportTimetablesToCSV(
                        timetablesList,
                        `timetables_all_${new Date().toISOString().slice(0, 10)}.csv`
                      )
                    }
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-slate-700 border-t border-slate-100 cursor-pointer"
                  >
                    <span>ส่งออกตารางเรียนทั้งหมด ({timetablesList.length} คาบ)</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">.csv</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintPdf}
                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-indigo-700 font-bold flex items-center justify-between border-t border-slate-100 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5 text-indigo-600" />
                      <span>พิมพ์ตารางสอน / ส่งออก PDF</span>
                    </span>
                    <span className="text-[10px] bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-800 font-mono">Print / PDF</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleScanTimetables}
              disabled={isScanningInstructors}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
              title="สแกนตารางสอนและตรวจสอบไอดีอาจารย์ผู้สอน"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningInstructors ? 'animate-spin' : ''}`} />
              <span>🔄 ซิงค์ไอดีอาจารย์</span>
            </button>

            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <span>ดูหน้าตารางสอน</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Guide Banner for Adding Schedules for Next Term/Year */}
        <div className="bg-gradient-to-r from-amber-50/80 via-indigo-50/50 to-blue-50/80 p-4 rounded-2xl border border-amber-200/70 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-300/60 flex items-center justify-center shrink-0 text-amber-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1.5 flex-1">
              <h3 className="font-bold text-slate-800 text-[13px] flex items-center gap-1.5">
                <span>💡 คำแนะนำ: วิธีเพิ่มตารางเรียนในภาคการศึกษาหรือปีการศึกษาถัดไป (เช่น 2/2569 หรือ 1/2570)</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                ท่านสามารถเพิ่มและอัปเดตตารางเรียนล่วงหน้าได้ <strong className="text-indigo-700">2 วิธีหลัก</strong>:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100">
                  <span className="font-bold text-indigo-900 block mb-1">
                    1. นำเข้าเป็นไฟล์ Excel / CSV (รวดเร็วและแม่นยำที่สุด)
                  </span>
                  <p className="text-slate-600 text-[11px] leading-normal">
                    กดปุ่ม <span className="font-semibold text-indigo-700">"📥 นำเข้า Excel / CSV"</span> ด้านบน แล้วคลิก <span className="font-semibold text-emerald-700">"ดาวน์โหลดไฟล์ต้นแบบ (.CSV)"</span> จากนั้นกรอกข้อมูลปีการศึกษาถัดไป (เช่น <code className="bg-slate-100 px-1 rounded">2570</code>), ภาคเรียน (<code className="bg-slate-100 px-1 rounded">1</code>), วัน-เวลาเรียน แล้วอัปโหลดไฟล์เข้ามา ระบบจะตรวจสอบและเพิ่มเข้าสู่ตารางทันที
                  </p>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                  <span className="font-bold text-amber-900 block mb-1">
                    2. เพิ่มรายวิชาทีละรายการผ่านหน้าเว็บ
                  </span>
                  <p className="text-slate-600 text-[11px] leading-normal">
                    คลิกปุ่ม <Link href="/courses" className="font-semibold text-indigo-600 underline">"ดูหน้าตารางสอน (/courses)"</Link> แล้วกดปุ่ม <span className="font-semibold text-emerald-700">+ เพิ่มรายวิชา</span> ระบุปีการศึกษา (2570), ภาคเรียน, วันเรียน, และเวลาคาบสอนได้ทันที โดยสามารถสลับตัวเลือกปีกรองดูตารางของแต่ละปีการศึกษาได้อิสระ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-2 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัสวิชา, ชื่อวิชา, สาขาวิชา, ห้องเรียน หรือผู้สอน..."
              value={timetableSearch}
              onChange={(e) => setTimetableSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Program Filter */}
          {setTimetableProgramFilter && (
            <select
              value={timetableProgramFilter}
              onChange={(e) => setTimetableProgramFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer"
            >
              <option value="ALL">หลักสูตร: ทั้งหมด</option>
              <option value="THAI">🇹🇭 หลักสูตรภาษาไทย</option>
              <option value="ENGLISH">🌐 หลักสูตรภาษาอังกฤษ (Inter)</option>
            </select>
          )}

          {/* Major Filter */}
          {setTimetableMajorFilter && (
            <select
              value={timetableMajorFilter}
              onChange={(e) => setTimetableMajorFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer"
            >
              <option value="ALL">สาขาวิชา: ทั้งหมด</option>
              <option value="พระพุทธศาสนา">สาขาวิชาพระพุทธศาสนา</option>
              <option value="ศาสนาและปรัชญา">สาขาวิชาศาสนาและปรัชญา</option>
              <option value="วิปัสสนาภาวนา">สาขาวิชาวิปัสสนาภาวนา</option>
              <option value="บาลีสันสกฤต">สาขาวิชาบาลีสันสกฤต</option>
            </select>
          )}

          <select
            value={timetableYearFilter}
            onChange={(e) => setTimetableYearFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer"
          >
            <option value="ALL">ปีการศึกษา: ทั้งหมด</option>
            <option value="2569">ปีการศึกษา 2569</option>
            <option value="2570">ปีการศึกษา 2570</option>
          </select>

          <select
            value={timetableSemesterFilter}
            onChange={(e) => setTimetableSemesterFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer"
          >
            <option value="ALL">ภาคเรียน: ทั้งหมด</option>
            <option value="1">ภาคเรียนที่ 1</option>
            <option value="2">ภาคเรียนที่ 2</option>
          </select>

          <select
            value={timetableDayFilter}
            onChange={(e) => setTimetableDayFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer"
          >
            <option value="ALL">วัน: ทุกวัน</option>
            <option value="1">วันจันทร์</option>
            <option value="2">วันอังคาร</option>
            <option value="3">วันพุธ</option>
            <option value="4">วันพฤหัสบดี</option>
            <option value="5">วันศุกร์</option>
            <option value="6">วันเสาร์</option>
            <option value="0">วันอาทิตย์</option>
          </select>

          <span className="text-slate-400 font-medium ml-auto">
            พบ {filteredTimetables.length} รายการ
          </span>
        </div>

        {/* Timetables Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3.5">วันในสัปดาห์</th>
                  <th className="px-4 py-3.5">เวลาเรียน</th>
                  <th className="px-4 py-3.5">รหัสวิชา</th>
                  <th className="px-5 py-3.5">ชื่อรายวิชา</th>
                  <th className="px-4 py-3.5">หลักสูตร & สาขาวิชา</th>
                  <th className="px-4 py-3.5">ชั้นปี / ภาคเรียน</th>
                  <th className="px-4 py-3.5">ห้องเรียน</th>
                  <th className="px-4 py-3.5">อาจารย์ผู้สอน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTimetables.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      ไม่พบตารางสอนตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredTimetables.slice(0, 50).map((t, idx) => {
                    const dayColor = DAY_COLORS[t.dayOfWeek] || 'bg-slate-50 text-slate-700 border-slate-200';
                    const dayLabel = DAY_NAMES[t.dayOfWeek] || `วัน ${t.dayOfWeek}`;
                    const isEn = t.programType === 'ENGLISH';

                    return (
                      <tr key={`${t.courseCode}-${t.dayOfWeek}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${dayColor}`}>
                            {dayLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-medium text-slate-800 whitespace-nowrap">
                          {t.startTime} - {t.endTime}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-indigo-700 whitespace-nowrap">
                          {t.courseCode}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-900 max-w-xs">
                          {t.courseName}
                        </td>
                        <td className="px-4 py-3.5 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isEn ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <Globe className="w-2.5 h-2.5" /> Inter/EN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                🇹🇭 ภาคไทย
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {t.degreeLevel || 'ปริญญาตรี'}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-800 text-[11px]">
                            {t.major || 'ทั่วไป'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                          ปี {t.yearLevel} (เทอม {t.semester}/{t.academicYear})
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {t.room || 'อาคารเรียน'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 font-medium">
                          {t.instructor || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filteredTimetables.length > 50 && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
              แสดง 50 รายการแรกจาก {filteredTimetables.length} รายการ (ใช้ช่องค้นหาด้านบนเพื่อระบุรายวิชาที่ต้องการ)
            </div>
          )}
        </div>

        {/* Course & Timetable Excel / CSV Import Modal */}
        <CourseImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            handleScanTimetables();
          }}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          OFFICIAL PRINT VIEW (Landscape A4 - Only visible on print/PDF)
         ───────────────────────────────────────────────────────────── */}
      <div className="hidden print:block font-sans text-black p-4">
        {/* Header with University & Faculty branding */}
        <div className="text-center space-y-1 mb-4 border-b-2 border-black pb-3">
          <h1 className="text-lg font-bold">มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (MCU)</h1>
          <h2 className="text-base font-bold">คณะพุทธศาสตร์ — ตารางเรียนและตารางสอน</h2>
          <div className="text-xs text-slate-700 flex flex-wrap justify-center gap-4 pt-1 font-semibold">
            {timetableYearFilter !== 'ALL' && <span>ปีการศึกษา: {timetableYearFilter}</span>}
            {timetableSemesterFilter !== 'ALL' && <span>ภาคการศึกษาที่: {timetableSemesterFilter}</span>}
            {timetableMajorFilter !== 'ALL' && <span>สาขาวิชา: {timetableMajorFilter}</span>}
            {timetableProgramFilter !== 'ALL' && (
              <span>หลักสูตร: {timetableProgramFilter === 'ENGLISH' ? 'ภาษาอังกฤษ (English Program)' : 'ภาษาไทย (Thai Program)'}</span>
            )}
            <span>จำนวน: {filteredTimetables.length} คาบ</span>
          </div>
        </div>

        {/* Printable Table */}
        <table className="w-full text-left text-[11px] border border-collapse border-slate-400">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-400 text-center font-bold">
              <th className="border border-slate-400 p-1.5 w-16">วันเรียน</th>
              <th className="border border-slate-400 p-1.5 w-24">เวลา</th>
              <th className="border border-slate-400 p-1.5 w-20">รหัสวิชา</th>
              <th className="border border-slate-400 p-1.5">ชื่อรายวิชา</th>
              <th className="border border-slate-400 p-1.5 w-20">หลักสูตร</th>
              <th className="border border-slate-400 p-1.5 w-28">สาขาวิชา</th>
              <th className="border border-slate-400 p-1.5 w-16">ชั้นปี/เทอม</th>
              <th className="border border-slate-400 p-1.5 w-20">ห้องเรียน</th>
              <th className="border border-slate-400 p-1.5">อาจารย์ผู้สอน</th>
            </tr>
          </thead>
          <tbody>
            {filteredTimetables.map((t, idx) => (
              <tr key={`print-row-${idx}`} className="border-b border-slate-300">
                <td className="border border-slate-300 p-1.5 text-center font-medium">{DAY_NAMES[t.dayOfWeek]}</td>
                <td className="border border-slate-300 p-1.5 text-center font-mono">{t.startTime} - {t.endTime}</td>
                <td className="border border-slate-300 p-1.5 text-center font-mono font-bold">{t.courseCode}</td>
                <td className="border border-slate-300 p-1.5 font-medium">{t.courseName}</td>
                <td className="border border-slate-300 p-1.5 text-center">{t.programType === 'ENGLISH' ? 'Inter/EN' : 'ภาคไทย'}</td>
                <td className="border border-slate-300 p-1.5 text-center">{t.major || '-'}</td>
                <td className="border border-slate-300 p-1.5 text-center">ปี {t.yearLevel} ({t.semester}/{t.academicYear})</td>
                <td className="border border-slate-300 p-1.5 text-center font-mono">{t.room}</td>
                <td className="border border-slate-300 p-1.5">{t.instructor}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer with sign-off */}
        <div className="mt-8 pt-4 flex justify-between items-end text-xs text-slate-700">
          <div>
            <p>พิมพ์จากระบบบริหารจัดการคณะพุทธศาสตร์ เมื่อ: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.</p>
          </div>
          <div className="text-center space-y-8">
            <p>ลงชื่อ..............................................................</p>
            <p>(..............................................................)<br />ฝ่ายวิชาการและทะเบียน คณะพุทธศาสตร์</p>
          </div>
        </div>
      </div>
    </div>
  );
};
