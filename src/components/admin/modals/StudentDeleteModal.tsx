'use client';

import React from 'react';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

interface StudentDeleteTarget {
  studentCode: string;
  fullName: string;
  major?: string;
  yearLevel?: number;
}

interface StudentDeleteModalProps {
  isOpen: boolean;
  isBulk: boolean;
  targets: StudentDeleteTarget[];
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export const StudentDeleteModal: React.FC<StudentDeleteModalProps> = ({
  isOpen,
  isBulk,
  targets,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || targets.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {isBulk ? `ยืนยันการลบนิสิตยกชุด (${targets.length} คน)` : 'ยืนยันการลบข้อมูลนิสิต'}
            </h3>
            <p className="text-xs text-slate-500">
              การกระทำนี้จะลบข้อมูลออกจากระบบทะเบียนและอัปเดต Google Sheets
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <span>
            <strong>คำเตือน:</strong> หากยืนยันแล้ว ข้อมูลนิสิตจะไม่สามารถกู้คืนได้ผ่านหน้านี้ โปรดตรวจสอบรายชื่อด้านล่างให้ถูกต้อง
          </span>
        </div>

        {/* Target Students List */}
        <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50 p-2 text-xs">
          {targets.map((t) => (
            <div key={t.studentCode} className="py-2 px-2 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">{t.fullName}</span>
                <span className="font-mono text-slate-500 text-[11px] ml-2">({t.studentCode})</span>
              </div>
              {t.yearLevel && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                  ปี {t.yearLevel}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>กำลังลบข้อมูล...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันการลบ {isBulk ? `(${targets.length} คน)` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
