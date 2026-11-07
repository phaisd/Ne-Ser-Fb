'use client';

import React from 'react';
import { Globe, Edit3, Trash2 } from 'lucide-react';
import { Student, getStatusBadge, DeleteTarget, formatPassportMask } from './types';

interface StudentTableViewProps {
  students: Student[];
  selectedCodes: Set<string>;
  toggleSelectCode: (code: string) => void;
  toggleSelectAll: () => void;
  isAllSelected: boolean;
  unmaskPassport: boolean;
  onViewDetails: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (target: DeleteTarget) => void;
}

export function StudentTableView({
  students,
  selectedCodes,
  toggleSelectCode,
  toggleSelectAll,
  isAllSelected,
  unmaskPassport,
  onViewDetails,
  onEdit,
  onDelete,
}: StudentTableViewProps) {
  const displayStudents = students.slice(0, 50);

  return (
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3.5 w-12 text-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                title={isAllSelected ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมดที่แสดงอยู่'}
              />
            </th>
            <th className="px-5 py-3.5">รหัสนิสิต</th>
            <th className="px-5 py-3.5">ชื่อ - นามสกุล</th>
            <th className="px-5 py-3.5">หลักสูตร & สัญชาติ</th>
            <th className="px-5 py-3.5">สถานภาพ</th>
            <th className="px-5 py-3.5">ชั้นปี & สาขาวิชา</th>
            <th className="px-5 py-3.5 text-right">การจัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {displayStudents.map((s, idx) => {
            const isThai = s.nationality === 'ไทย' || s.nationality === 'Thai';
            const isEnProg = s.programType === 'ENGLISH';
            const statusBadge = getStatusBadge(s.studyStatus);
            const isSelected = selectedCodes.has(s.studentCode);

            return (
              <tr
                key={`${s.studentCode}-${idx}`}
                className={`hover:bg-slate-50/80 transition-colors ${
                  isSelected ? 'bg-orange-50/50' : ''
                }`}
              >
                {/* Checkbox */}
                <td className="px-4 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectCode(s.studentCode)}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                </td>

                {/* Student Code */}
                <td className="px-5 py-4 font-mono font-extrabold text-sm sm:text-base text-orange-700 tracking-tight whitespace-nowrap">
                  {s.studentCode}
                </td>

                {/* Name */}
                <td className="px-5 py-4 font-medium text-slate-900 max-w-xs">
                  <div className="font-bold text-sm sm:text-base">
                    {s.fullName || `${s.title || ''} ${s.firstName} ${s.lastName}`}
                  </div>
                  {s.email && <div className="text-[11px] text-slate-400 font-normal">{s.email}</div>}
                  {s.remarks && (
                    <div className="text-[11px] text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded mt-1 line-clamp-1 border border-amber-100">
                      หมายเหตุ: {s.remarks}
                    </div>
                  )}
                </td>

                {/* Program & Nationality */}
                <td className="px-5 py-4 space-y-1">
                  <div>
                    {isEnProg ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        <Globe className="w-3 h-3" />
                        ภาคภาษาอังกฤษ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span>🇹🇭</span>
                        ภาคภาษาไทย
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isThai ? 'สัญชาติไทย' : `สัญชาติ ${s.nationality || 'ต่างชาติ'}`}
                    {s.passportNo && (
                      <span className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded ml-1 text-[11px]">
                        Pass: {formatPassportMask(s.passportNo, unmaskPassport)}
                      </span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge.color}`}
                  >
                    {statusBadge.label}
                  </span>
                </td>

                {/* Year & Major */}
                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-800">
                    ชั้นปีที่ {s.yearLevel || '-'} ({s.degree || 'ป.ตรี'})
                  </div>
                  <div className="text-xs text-slate-400 line-clamp-1">
                    {s.major || s.department || '-'}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onEdit(s)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition inline-flex items-center gap-1 cursor-pointer"
                      title="แก้ไขข้อมูลนิสิต"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewDetails(s)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 transition cursor-pointer"
                    >
                      ดูข้อมูล
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
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition inline-flex items-center gap-1 cursor-pointer"
                      title="ลบนิสิตท่านนี้ออกจากระบบ"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
