'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { DeleteTarget } from './types';

interface StudentDeleteModalProps {
  isOpen: boolean;
  targets: DeleteTarget[];
  isBulk: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function StudentDeleteModal({
  isOpen,
  targets,
  isBulk,
  isDeleting,
  onClose,
  onConfirm,
}: StudentDeleteModalProps) {
  if (!isOpen || targets.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isBulk
                  ? `ยืนยันการลบนิสิต ${targets.length} ท่าน`
                  : 'ยืนยันการลบข้อมูลนิสิต'}
              </h3>
              <p className="text-xs text-slate-500">
                ข้อมูลจะถูกลบออกจากระบบและประวัติการลงทะเบียน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Targets List */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-700">
            รายชื่อที่ต้องการลบ ({targets.length} รายการ):
          </div>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50 text-xs">
            {targets.map((t) => (
              <div key={t.studentCode} className="p-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-rose-700 mr-2">
                    {t.studentCode}
                  </span>
                  <span className="font-medium text-slate-800">{t.fullName}</span>
                </div>
                {t.major && (
                  <span className="text-[11px] text-slate-400">
                    {t.major} {t.yearLevel ? `(ปี ${t.yearLevel})` : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>
            คำเตือน: การกระทำนี้ไม่สามารถย้อนกลับได้ กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {isDeleting
                ? 'กำลังลบข้อมูล...'
                : `ยืนยันการลบ (${targets.length} ท่าน)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
