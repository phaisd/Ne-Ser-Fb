'use client';

import React from 'react';
import { XCircle, CheckCircle } from 'lucide-react';
import { CertificateRequest } from '@/types';

export const REJECT_PRESET_REASONS = [
  'ข้อมูลไม่ครบถ้วน',
  'ไม่ใช่นิสิตในคณะ',
  'ไม่ใช่บุคลากรในคณะ',
  'ขาดสำเนาเอกสารการลงทะเบียน',
  'รูปถ่ายไม่ถูกต้องตามระเบียบ (ต้องขนาด 1.5-2 นิ้ว หน้าตรงชุดสุภาพ)',
  'หนังสือเดินทาง/วีซ่าไม่ตรงกับข้อมูลในระบบ',
  'สำเนาเอกสารแนบไม่ชัดเจนหรือไม่สมบูรณ์',
];

interface CertRejectModalProps {
  rejectingRequest: CertificateRequest | null;
  rejectReasonInput: string;
  setRejectReasonInput: (val: string) => void;
  rejectSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CertRejectModal({
  rejectingRequest,
  rejectReasonInput,
  setRejectReasonInput,
  rejectSubmitting,
  onClose,
  onConfirm,
}: CertRejectModalProps) {
  if (!rejectingRequest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4">
        <div className="flex items-center justify-between border-b border-rose-100 pb-3">
          <div className="flex items-center gap-2 text-rose-700">
            <div className="p-2 rounded-xl bg-rose-100">
              <XCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">ปฏิเสธคำร้องหนังสือรับรอง</h3>
              <p className="text-[11px] text-slate-500">
                เลขที่คำร้อง: {rejectingRequest.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs space-y-1">
          <div className="font-bold text-slate-800">
            ผู้ยื่นคำร้อง: <span className="text-rose-900">{rejectingRequest.fullName}</span>
            {rejectingRequest.studentCode && (
              <span className="text-slate-500 font-normal ml-1">({rejectingRequest.studentCode})</span>
            )}
          </div>
          <div className="text-[11px] text-slate-600">
            ประเภท: {rejectingRequest.certType || 'หนังสือรับรอง'}
          </div>
        </div>

        {/* Quick Reason Presets */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            เลือกเหตุผลที่ปฏิเสธ (คลิกเพื่อเลือกทันที):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {REJECT_PRESET_REASONS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setRejectReasonInput(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer text-left ${
                  rejectReasonInput === preset
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-slate-50 hover:bg-rose-50 border-slate-200 text-slate-700 hover:border-rose-300'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Reason Textarea */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            ข้อความระบุเหตุผล / คำแนะนำถึงผู้ยื่นคำร้อง:
          </label>
          <textarea
            rows={3}
            value={rejectReasonInput}
            onChange={(e) => setRejectReasonInput(e.target.value)}
            placeholder="ระบุเหตุผลเพิ่มเติม เช่น ขาดสำเนาการลงทะเบียนเรียน หรือเอกสารไม่ชัดเจน..."
            className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:outline-none resize-none"
          />
          <p className="text-[10px] text-slate-500">
            * ข้อความนี้จะแสดงในหน้าระบบติดตามสถานะของผู้ยื่นคำร้อง เพื่อให้นิสิตแก้ไขหรือแนบเอกสารใหม่
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={rejectSubmitting}
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-200 cursor-pointer disabled:opacity-50"
          >
            {rejectSubmitting ? (
              <span>กำลังบันทึก...</span>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>ยืนยันปฏิเสธคำร้อง</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
