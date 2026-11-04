'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, RefreshCw, ExternalLink, Search } from 'lucide-react';
import { TimetableItem } from '@/types';

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
  handleScanTimetables,
  isScanningInstructors,
}) => {
  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            ตารางเรียนและตารางสอน (Class Schedules & Timetables)
          </h2>
          <p className="text-xs text-slate-500">
            รายการคาบสอนทั้งหมด {timetablesList.length} คาบ พร้อมข้อมูลห้องเรียนและอาจารย์ผู้สอน
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleScanTimetables}
            disabled={isScanningInstructors}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            title="สแกนตารางสอนและตรวจสอบไอดีอาจารย์ผู้สอน"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanningInstructors ? 'animate-spin' : ''}`} />
            <span>🔄 ซิงค์และสร้างไอดีอาจารย์จากตารางสอน</span>
          </button>

          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <span>ดูตารางสอนรายสัปดาห์</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-2 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสวิชา, ชื่อวิชา, ห้องเรียน หรือผู้สอน..."
            value={timetableSearch}
            onChange={(e) => setTimetableSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={timetableYearFilter}
          onChange={(e) => setTimetableYearFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
        >
          <option value="ALL">ปีการศึกษา: ทั้งหมด</option>
          <option value="2569">ปีการศึกษา 2569</option>
          <option value="2570">ปีการศึกษา 2570</option>
        </select>

        <select
          value={timetableSemesterFilter}
          onChange={(e) => setTimetableSemesterFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
        >
          <option value="ALL">ภาคเรียน: ทั้งหมด</option>
          <option value="1">ภาคเรียนที่ 1</option>
          <option value="2">ภาคเรียนที่ 2</option>
        </select>

        <select
          value={timetableDayFilter}
          onChange={(e) => setTimetableDayFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
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
                <th className="px-5 py-3.5">วันในสัปดาห์</th>
                <th className="px-5 py-3.5">เวลาเรียน</th>
                <th className="px-5 py-3.5">รหัสวิชา</th>
                <th className="px-5 py-3.5">ชื่อรายวิชา</th>
                <th className="px-5 py-3.5">ชั้นปี / ภาคเรียน</th>
                <th className="px-5 py-3.5">ห้องเรียน</th>
                <th className="px-5 py-3.5">อาจารย์ผู้สอน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTimetables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    ไม่พบตารางสอนตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredTimetables.slice(0, 50).map((t, idx) => {
                  const dayColor = DAY_COLORS[t.dayOfWeek] || 'bg-slate-50 text-slate-700 border-slate-200';
                  const dayLabel = DAY_NAMES[t.dayOfWeek] || `วัน ${t.dayOfWeek}`;

                  return (
                    <tr key={`${t.courseCode}-${t.dayOfWeek}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${dayColor}`}>
                          {dayLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-medium text-slate-800">
                        {t.startTime} - {t.endTime}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-700">
                        {t.courseCode}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {t.courseName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        ปี {t.yearLevel} (เทอม {t.semester}/{t.academicYear})
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {t.room || 'อาคารเรียน'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {t.instructor || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
