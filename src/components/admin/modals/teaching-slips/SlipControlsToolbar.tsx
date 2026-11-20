'use client';

import React from 'react';
import {
  Sparkles,
  QrCode,
  CheckSquare,
  Square,
  Grid,
  FileSpreadsheet,
  Printer,
  PenTool,
} from 'lucide-react';
import { SlipLayoutRatio } from './types';

interface SlipControlsToolbarProps {
  ratio: SlipLayoutRatio;
  setRatio: (ratio: SlipLayoutRatio) => void;
  qrScale: number;
  setQrScale: (scale: number) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  availableAcademicYears: string[];
  selectedSemester: string;
  setSelectedSemester: (semester: string) => void;
  filterDept: string;
  setFilterDept: (dept: string) => void;
  departments: string[];
  onlyWithCourses: boolean;
  setOnlyWithCourses: (val: boolean) => void;
  signMode: 'OFFICER' | 'DEAN' | 'NONE';
  setSignMode: (mode: 'OFFICER' | 'DEAN' | 'NONE') => void;
  isAllSelected: boolean;
  handleToggleSelectAll: () => void;
  handleExportXlsx: () => void;
  handlePrint: () => void;
  filteredCount: number;
  selectedCount: number;
}

export function SlipControlsToolbar({
  ratio,
  setRatio,
  qrScale,
  setQrScale,
  selectedYear,
  setSelectedYear,
  availableAcademicYears,
  selectedSemester,
  setSelectedSemester,
  filterDept,
  setFilterDept,
  departments,
  onlyWithCourses,
  setOnlyWithCourses,
  signMode,
  setSignMode,
  isAllSelected,
  handleToggleSelectAll,
  handleExportXlsx,
  handlePrint,
  filteredCount,
  selectedCount,
}: SlipControlsToolbarProps) {
  return (
    <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3.5 print:hidden">
      {/* Ratio Selector Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <Grid className="w-4 h-4 text-indigo-600" />
          <span>เลือกอัตราส่วนการจัดพิมพ์ต่อกระดาษ A4 (Layout Ratio):</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
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

          <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-slate-700 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100">
            <input
              type="checkbox"
              checked={onlyWithCourses}
              onChange={(e) => setOnlyWithCourses(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>เฉพาะอาจารย์ที่มีตารางสอน</span>
          </label>
        </div>

        {/* Signer Mode Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <PenTool className="w-3.5 h-3.5" />
            <span>ช่องลงนาม:</span>
          </span>
          <div className="inline-flex items-center p-0.5 bg-white border border-slate-300 rounded-xl">
            <button
              type="button"
              onClick={() => setSignMode('OFFICER')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                signMode === 'OFFICER'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เจ้าหน้าที่
            </button>
            <button
              type="button"
              onClick={() => setSignMode('DEAN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                signMode === 'DEAN'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              คณบดี
            </button>
            <button
              type="button"
              onClick={() => setSignMode('NONE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                signMode === 'NONE'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ไม่มี
            </button>
          </div>
        </div>
      </div>

      {/* Selection Summary and Print / Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/60">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            {isAllSelected ? (
              <>
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                <span>ยกเลิกการเลือกทั้งหมด</span>
              </>
            ) : (
              <>
                <Square className="w-4 h-4 text-slate-400" />
                <span>เลือกทั้งหมด ({filteredCount} ท่าน)</span>
              </>
            )}
          </button>
          <span className="text-xs text-slate-500">
            เลือกพิมพ์ <strong>{selectedCount}</strong> จาก {filteredCount} ท่าน
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportXlsx}
            disabled={selectedCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={selectedCount === 0}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>สั่งพิมพ์ / บันทึกเป็น PDF ({selectedCount} ใบ)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
