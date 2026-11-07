'use client';

import React from 'react';
import { Search, Filter, Eye, EyeOff } from 'lucide-react';
import { STUDY_STATUS_OPTIONS } from './types';

interface StudentFiltersBarProps {
  search: string;
  setSearch: (val: string) => void;
  programFilter: 'ALL' | 'THAI' | 'ENGLISH';
  setProgramFilter: (val: 'ALL' | 'THAI' | 'ENGLISH') => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  yearFilter: string;
  setYearFilter: (val: string) => void;
  nationalityFilter: 'ALL' | 'THAI' | 'INTERNATIONAL';
  setNationalityFilter: (val: 'ALL' | 'THAI' | 'INTERNATIONAL') => void;
  unmaskPassport: boolean;
  setUnmaskPassport: (val: boolean) => void;
  filteredCount: number;
}

export function StudentFiltersBar({
  search,
  setSearch,
  programFilter,
  setProgramFilter,
  statusFilter,
  setStatusFilter,
  yearFilter,
  setYearFilter,
  nationalityFilter,
  setNationalityFilter,
  unmaskPassport,
  setUnmaskPassport,
  filteredCount,
}: StudentFiltersBarProps) {
  const isAnyFilterActive =
    Boolean(search) ||
    programFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    yearFilter !== 'ALL' ||
    nationalityFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearch('');
    setProgramFilter('ALL');
    setStatusFilter('ALL');
    setYearFilter('ALL');
    setNationalityFilter('ALL');
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Box */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสนิสิต (เช่น 680150...), ชื่อ, สัญชาติ, หมายเหตุ, หรือ Passport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {/* Program Filter Pills (Responsive Touch Friendly) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold w-full md:w-auto shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setProgramFilter('ALL')}
            className={`flex-1 md:flex-initial text-center whitespace-nowrap shrink-0 min-h-[38px] px-3.5 py-2 rounded-xl transition cursor-pointer ${
              programFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทุกหลักสูตร
          </button>
          <button
            type="button"
            onClick={() => setProgramFilter('THAI')}
            className={`flex-1 md:flex-initial text-center whitespace-nowrap shrink-0 min-h-[38px] px-3.5 py-2 rounded-xl transition cursor-pointer ${
              programFilter === 'THAI'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            🇹🇭 ภาคไทย
          </button>
          <button
            type="button"
            onClick={() => setProgramFilter('ENGLISH')}
            className={`flex-1 md:flex-initial text-center whitespace-nowrap shrink-0 min-h-[38px] px-3.5 py-2 rounded-xl transition cursor-pointer ${
              programFilter === 'ENGLISH'
                ? 'bg-purple-600 text-white shadow-sm font-bold'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            🌐 ภาคอังกฤษ (EN)
          </button>
        </div>
      </div>

      {/* Secondary Filter Row: Status, Year, Nationality */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
        <span className="font-semibold text-slate-400 mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> กรองเพิ่มเติม:
        </span>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
        >
          <option value="ALL">สถานภาพ: ทั้งหมด</option>
          {STUDY_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Year Filter */}
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
        >
          <option value="ALL">ชั้นปี: ทั้งหมด</option>
          <option value="1">ชั้นปีที่ 1</option>
          <option value="2">ชั้นปีที่ 2</option>
          <option value="3">ชั้นปีที่ 3</option>
          <option value="4">ชั้นปีที่ 4</option>
        </select>

        {/* Nationality Filter */}
        <select
          value={nationalityFilter}
          onChange={(e) => setNationalityFilter(e.target.value as any)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
        >
          <option value="ALL">สัญชาติ: ทั้งหมด</option>
          <option value="THAI">🇹🇭 สัญชาติไทย</option>
          <option value="INTERNATIONAL">🌐 สัญชาติต่างชาติ</option>
        </select>

        {isAnyFilterActive && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
          >
            ล้างตัวกรอง
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setUnmaskPassport(!unmaskPassport)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              unmaskPassport
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="เปิด/ปิดการปกปิดเลขหนังสือเดินทางตามนโยบาย PDPA (Data Protection)"
          >
            {unmaskPassport ? (
              <Eye className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>
              {unmaskPassport ? 'แสดงเลข Passport เต็ม' : '🔒 ซ่อนเลข Passport (PDPA Mask)'}
            </span>
          </button>
          <span className="text-slate-400 font-medium">แสดง {filteredCount} รายการ</span>
        </div>
      </div>
    </div>
  );
}
