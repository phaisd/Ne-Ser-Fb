'use client';

import React from 'react';
import { Download, Trash2 } from 'lucide-react';
import { STUDY_STATUS_OPTIONS, Student, DeleteTarget } from './types';

interface StudentBulkActionBarProps {
  selectedCodes: Set<string>;
  students: Student[];
  bulkStatus: string;
  setBulkStatus: (val: string) => void;
  bulkProgram: 'THAI' | 'ENGLISH';
  setBulkProgram: (val: 'THAI' | 'ENGLISH') => void;
  bulkSaving: boolean;
  onBulkUpdate: (targetType: 'STATUS' | 'PROGRAM') => void;
  onBulkDelete: (targets: DeleteTarget[]) => void;
  onExportSelected: () => void;
  onClearSelection: () => void;
}

export function StudentBulkActionBar({
  selectedCodes,
  students,
  bulkStatus,
  setBulkStatus,
  bulkProgram,
  setBulkProgram,
  bulkSaving,
  onBulkUpdate,
  onBulkDelete,
  onExportSelected,
  onClearSelection,
}: StudentBulkActionBarProps) {
  if (selectedCodes.size === 0) return null;

  const handleTriggerBulkDelete = () => {
    const targets: DeleteTarget[] = students
      .filter((s) => selectedCodes.has(s.studentCode))
      .map((s) => ({
        studentCode: s.studentCode,
        fullName:
          s.fullName ||
          `${s.title || ''} ${s.firstName} ${s.lastName}`.trim() ||
          s.studentCode,
        major: s.major,
        yearLevel: s.yearLevel,
      }));
    onBulkDelete(targets);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[94%] bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
          {selectedCodes.size}
        </span>
        <div>
          <div className="text-sm font-bold">เลือกนิสิต {selectedCodes.size} คน</div>
          <div className="text-xs text-slate-400">แก้ไขสถานภาพ หรือหลักสูตรพร้อมกันเป็นชุด</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Bulk Status Select & Apply */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
          <span className="text-slate-400 pl-1 font-medium">เปลี่ยนสถานภาพ:</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="bg-slate-900 text-white rounded-lg px-2.5 py-1 text-xs border border-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {STUDY_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onBulkUpdate('STATUS')}
            disabled={bulkSaving}
            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold px-3 py-1 rounded-lg transition cursor-pointer"
          >
            {bulkSaving ? 'กำลังบันทึก...' : 'ปรับใช้'}
          </button>
        </div>

        {/* Bulk Program Select & Apply */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
          <span className="text-slate-400 pl-1 font-medium">เปลี่ยนหลักสูตร:</span>
          <select
            value={bulkProgram}
            onChange={(e) => setBulkProgram(e.target.value as any)}
            className="bg-slate-900 text-white rounded-lg px-2.5 py-1 text-xs border border-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="THAI">🇹🇭 ภาคไทย</option>
            <option value="ENGLISH">🌐 ภาคอังกฤษ</option>
          </select>
          <button
            type="button"
            onClick={() => onBulkUpdate('PROGRAM')}
            disabled={bulkSaving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-3 py-1 rounded-lg transition cursor-pointer"
          >
            {bulkSaving ? 'กำลังบันทึก...' : 'ปรับใช้'}
          </button>
        </div>

        {/* Bulk Delete Selected */}
        <button
          type="button"
          onClick={handleTriggerBulkDelete}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          title="ลบนิสิตที่เลือกยกชุด"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>ลบที่เลือก ({selectedCodes.size})</span>
        </button>

        {/* Export Selected */}
        <button
          type="button"
          onClick={onExportSelected}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          title="ส่งออกเฉพาะรายชื่อที่เลือก"
        >
          <Download className="w-3.5 h-3.5 text-orange-400" />
          <span>ส่งออก ({selectedCodes.size})</span>
        </button>

        {/* Clear selection */}
        <button
          type="button"
          onClick={onClearSelection}
          className="text-slate-400 hover:text-white p-2 transition ml-1 cursor-pointer"
          title="ยกเลิกการเลือก"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
