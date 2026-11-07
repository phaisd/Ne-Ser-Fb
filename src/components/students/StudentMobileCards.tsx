'use client';

import React from 'react';
import { Globe, Edit3, Trash2 } from 'lucide-react';
import { Student, getStatusBadge, DeleteTarget } from './types';

interface StudentMobileCardsProps {
  students: Student[];
  selectedCodes: Set<string>;
  toggleSelectCode: (code: string) => void;
  toggleSelectAll: () => void;
  isAllSelected: boolean;
  onViewDetails: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (target: DeleteTarget) => void;
}

export function StudentMobileCards({
  students,
  selectedCodes,
  toggleSelectCode,
  toggleSelectAll,
  isAllSelected,
  onViewDetails,
  onEdit,
  onDelete,
}: StudentMobileCardsProps) {
  const displayStudents = students.slice(0, 50);

  return (
    <div className="block sm:hidden divide-y divide-slate-100">
      {/* Select All Bar on Mobile */}
      <div className="p-3 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={toggleSelectAll}
            className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
          />
          <span>เลือกทั้งหมด ({displayStudents.length} รายการ)</span>
        </label>
        <span className="text-[11px] text-slate-500 font-normal">
          {selectedCodes.size > 0 ? `เลือกแล้ว ${selectedCodes.size}` : ''}
        </span>
      </div>

      {/* Cards List */}
      <div className="p-3 space-y-3 bg-slate-50/50">
        {displayStudents.map((s, idx) => {
          const isThai = s.nationality === 'ไทย' || s.nationality === 'Thai';
          const isEnProg = s.programType === 'ENGLISH';
          const statusBadge = getStatusBadge(s.studyStatus);
          const isSelected = selectedCodes.has(s.studentCode);

          return (
            <div
              key={`m-student-${s.studentCode}-${idx}`}
              className={`p-4 rounded-2xl bg-white border transition shadow-2xs space-y-2.5 ${
                isSelected
                  ? 'border-orange-400 bg-orange-50/40 ring-2 ring-orange-500/20'
                  : 'border-slate-200/90'
              }`}
            >
              {/* Top Row: Checkbox, Code, Status Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectCode(s.studentCode)}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-mono font-extrabold text-sm sm:text-base text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-200 shadow-2xs">
                    {s.studentCode}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${statusBadge.color}`}
                >
                  {statusBadge.label}
                </span>
              </div>

              {/* Middle Row: Name & Contact */}
              <div className="space-y-1">
                <div className="font-extrabold text-sm text-slate-900 leading-snug">
                  {s.fullName || `${s.title || ''} ${s.firstName} ${s.lastName}`}
                </div>
                {s.email && (
                  <div className="text-xs text-slate-500 font-normal truncate">
                    ✉️ {s.email}
                  </div>
                )}
                {s.phoneNumber && (
                  <div className="text-xs text-slate-500 font-normal">
                    📞 {s.phoneNumber}
                  </div>
                )}
                {s.remarks && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 line-clamp-2">
                    หมายเหตุ: {s.remarks}
                  </div>
                )}
              </div>

              {/* Meta Pills: Program, Degree, Major */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
                {isEnProg ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    <Globe className="w-3 h-3" />
                    <span>Inter</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span>🇹🇭 ภาคไทย</span>
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  ปี {s.yearLevel || '-'} ({s.degree || 'ป.ตรี'})
                </span>
                <span className="px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[160px]">
                  {s.major || s.department || '-'}
                </span>
                {!isThai && s.nationality && (
                  <span className="px-2 py-0.5 rounded-md text-slate-500 bg-slate-50 border border-slate-200">
                    {s.nationality}
                  </span>
                )}
              </div>

              {/* Bottom Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onViewDetails(s)}
                  className="py-1.5 px-2 rounded-xl text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition text-center cursor-pointer min-h-[36px] flex items-center justify-center gap-1"
                >
                  ดูข้อมูล
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(s)}
                  className="py-1.5 px-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition text-center cursor-pointer min-h-[36px] flex items-center justify-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  แก้ไข
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onDelete({
                      studentCode: s.studentCode,
                      fullName:
                        s.fullName ||
                        `${s.title || ''} ${s.firstName} ${s.lastName}`.trim() ||
                        s.studentCode,
                      major: s.major,
                      yearLevel: s.yearLevel,
                    })
                  }
                  className="py-1.5 px-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition text-center cursor-pointer min-h-[36px] flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                  ลบ
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
