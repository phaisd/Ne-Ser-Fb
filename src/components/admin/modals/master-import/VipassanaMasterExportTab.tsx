'use client';

import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import { UserAccount } from '@/types';
import { STANDARD_POSITIONS } from './types';

interface VipassanaMasterExportTabProps {
  currentMasters: UserAccount[];
  filteredMasters: UserAccount[];
  exportSearch: string;
  setExportSearch: (search: string) => void;
  exportPositionFilter: string;
  setExportPositionFilter: (pos: string) => void;
  onExportXlsx: () => void;
  onExportCsv: () => void;
}

export const VipassanaMasterExportTab: React.FC<VipassanaMasterExportTabProps> = ({
  currentMasters,
  filteredMasters,
  exportSearch,
  setExportSearch,
  exportPositionFilter,
  setExportPositionFilter,
  onExportXlsx,
  onExportCsv,
}) => {
  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, ฉายา, อีเมล..."
              value={exportSearch}
              onChange={(e) => setExportSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <select
              value={exportPositionFilter}
              onChange={(e) => setExportPositionFilter(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
            >
              <option value="ALL">ทุกตำแหน่ง</option>
              {STANDARD_POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onExportXlsx()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="ดาวน์โหลดรายชื่อพระวิปัสสนาจารย์และรหัสผ่านทั้งหมดเป็นไฟล์ Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออก Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => onExportCsv()}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Table of Existing Masters */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[55vh]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
              <tr>
                <th className="p-3 text-center w-12">ลำดับ</th>
                <th className="p-3">ชื่อ-ฉายา (ไทย)</th>
                <th className="p-3">ชื่ออังกฤษ</th>
                <th className="p-3">ตำแหน่งโครงการ</th>
                <th className="p-3">ตำแหน่งทางคณะสงฆ์</th>
                <th className="p-3">หน่วยงาน/ภาควิชา</th>
                <th className="p-3">ที่อยู่ติดต่อ/สังกัดวัด</th>
                <th className="p-3">ไอดีเข้าใช้งาน (Login ID)</th>
                <th className="p-3">รหัสผ่านเริ่มต้น</th>
                <th className="p-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMasters.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                    ไม่พบรายชื่อพระวิปัสสนาจารย์ตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredMasters.map((m, idx) => (
                  <tr key={m.id || idx} className="hover:bg-amber-50/20 transition">
                    <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{m.name}</td>
                    <td className="p-3 text-slate-600 font-serif">{m.nameEn || '-'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          (m.instructorType || '').includes('ประธาน') && !(m.instructorType || '').includes('รอง')
                            ? 'bg-purple-100 text-purple-900'
                            : (m.instructorType || '').includes('รองประธาน')
                            ? 'bg-indigo-100 text-indigo-900'
                            : (m.instructorType || '').includes('เลขา')
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {m.instructorType || 'พระวิปัสสนาจารย์'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{m.ecclesiasticalTitle || '-'}</td>
                    <td className="p-3 text-slate-600 text-[11px]">{m.department || 'ฝ่ายวิปัสสนาธุระ / พระวิปัสสนาจารย์'}</td>
                    <td className="p-3 text-slate-600 text-[11px] max-w-[180px] truncate" title={m.contactAddress}>
                      {m.contactAddress || '-'}
                    </td>
                    <td className="p-3 font-mono font-semibold text-amber-950">{m.email}</td>
                    <td className="p-3 font-mono text-slate-700 bg-slate-50/70 px-2 rounded">
                      {m.defaultPassword || m.password || 'mcu123456'}
                    </td>
                    <td className="p-3 text-center">
                      {m.isActive !== false ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ใช้งานได้
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                          ระงับ
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
