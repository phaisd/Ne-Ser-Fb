'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, RefreshCw, ShieldCheck, Archive } from 'lucide-react';

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
  onConfirm: (reason?: string) => void | Promise<void>;
}

export const StudentDeleteModal: React.FC<StudentDeleteModalProps> = ({
  isOpen,
  isBulk,
  targets,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('จำหน่ายออก / พ้นสภาพ');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen || targets.length === 0) return null;

  const finalReason = reason === 'อื่น ๆ' ? (customReason.trim() || 'ลบข้อมูลนิสิตออกจากระบบ') : reason;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-800">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {isBulk ? `ย้ายนิสิตเข้าสู่แฟ้มประวัติที่ถูกลบ (${targets.length} คน)` : 'ย้ายนิสิตเข้าสู่แฟ้มประวัติที่ถูกลบ'}
            </h3>
            <p className="text-xs text-slate-500">
              ย้ายข้อมูลไปยังแท็บ <span className="font-semibold text-emerald-700">Students_Archive</span> บน Google Sheets
            </p>
          </div>
        </div>

        {/* Safe Archive Banner */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          <div className="leading-relaxed">
            <strong>ระบบความปลอดภัย (Safe Archive):</strong> ข้อมูลจะไม่สูญหายถาวร แต่จะถูกย้ายไปเก็บสำรองไว้ในแท็บ <strong>Students_Archive</strong> บน Google Sheets สามารถตรวจสอบประวัติ หรือกดกู้คืน (Restore) กลับเข้าสู่ทะเบียนได้ตลอดเวลา
          </div>
        </div>

        {/* Reason Selector */}
        <div className="space-y-1.5 text-xs">
          <label className="font-bold text-slate-700 block">
            เหตุผลการจำหน่าย/ลบข้อมูล:
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white cursor-pointer"
          >
            <option value="จำหน่ายออก / พ้นสภาพ">จำหน่ายออก / พ้นสภาพการเป็นนิสิต</option>
            <option value="สำเร็จการศึกษา">สำเร็จการศึกษาแล้ว (Graduated)</option>
            <option value="ลาออก">ลาออกจากการศึกษา (Resigned)</option>
            <option value="ข้อมูลซ้ำซ้อน / ลบด้วยตนเอง">ข้อมูลซ้ำซ้อน / ลบข้อมูลทดสอบ</option>
            <option value="อื่น ๆ">ระบุเหตุผลอื่น ๆ...</option>
          </select>
          {reason === 'อื่น ๆ' && (
            <input
              type="text"
              placeholder="พิมพ์ระบุเหตุผลเพิ่มเติม..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          )}
        </div>

        {/* Target Students List */}
        <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50 p-2 text-xs">
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
            onClick={() => onConfirm(finalReason)}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>กำลังย้ายเข้าแฟ้มประวัติ...</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                <span>ย้ายเข้าแฟ้มประวัติ {isBulk ? `(${targets.length} คน)` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
