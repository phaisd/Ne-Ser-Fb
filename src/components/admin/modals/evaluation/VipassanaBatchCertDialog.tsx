'use client';

import React from 'react';
import { Award, Sparkles } from 'lucide-react';

interface VipassanaBatchCertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  docNoPrefix: string;
  setDocNoPrefix: (val: string) => void;
  issueDateTh: string;
  setIssueDateTh: (val: string) => void;
  issueDateEn: string;
  setIssueDateEn: (val: string) => void;
  signerNameTh: string;
  setSignerNameTh: (val: string) => void;
  signerTitleTh: string;
  setSignerTitleTh: (val: string) => void;
  isIssuingCerts: boolean;
  onConfirm: () => void;
}

export const VipassanaBatchCertDialog: React.FC<VipassanaBatchCertDialogProps> = ({
  isOpen,
  onClose,
  selectedCount,
  docNoPrefix,
  setDocNoPrefix,
  issueDateTh,
  setIssueDateTh,
  issueDateEn,
  setIssueDateEn,
  signerNameTh,
  setSignerNameTh,
  signerTitleTh,
  setSignerTitleTh,
  isIssuingCerts,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base">
              อนุมัติผ่านโครงการและออกวุฒิบัตรดิจิทัล
            </h3>
            <p className="text-xs text-slate-500">
              ระบบจะสร้างเลขที่วุฒิบัตรและบันทึกข้อมูลเข้าสู่ระบบประกาศนียบัตรอัตโนมัติ
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs">
          กำลังจะออกวุฒิบัตรให้นิสิตที่เลือกทั้งหมด <strong>{selectedCount}</strong> รูป/คน
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">หมวดหมู่เลขที่เอกสาร (Prefix):</label>
            <input
              type="text"
              value={docNoPrefix}
              onChange={(e) => setDocNoPrefix(e.target.value)}
              placeholder="เช่น 8002 หรือ 8002.1"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              ตัวอย่างเลขที่: มจร {docNoPrefix}/ว.วป-2569-001
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">วันที่ออก (ภาษาไทย):</label>
              <input
                type="text"
                value={issueDateTh}
                onChange={(e) => setIssueDateTh(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Date (English):</label>
              <input
                type="text"
                value={issueDateEn}
                onChange={(e) => setIssueDateEn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ผู้ลงนาม (คณบดี/ผู้มีอำนาจ):</label>
            <input
              type="text"
              value={signerNameTh}
              onChange={(e) => setSignerNameTh(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ตำแหน่งผู้ลงนาม:</label>
            <input
              type="text"
              value={signerTitleTh}
              onChange={(e) => setSignerTitleTh(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer text-xs"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isIssuingCerts}
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isIssuingCerts ? 'กำลังออกวุฒิบัตร...' : 'ยืนยันออกวุฒิบัตรดิจิทัล'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
