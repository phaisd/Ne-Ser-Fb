'use client';

import React from 'react';
import { Archive } from 'lucide-react';
import { CertificateRequest } from '@/types';

interface ArchiveSummaryModalProps {
  isOpen: boolean;
  availableYears: string[];
  archivingYear: string;
  setArchivingYear: (yr: string) => void;
  requests: CertificateRequest[];
  academicArchives: any[];
  archiveLoading: boolean;
  onArchiveYear: (e?: any) => void;
  onClose: () => void;
}

export function ArchiveSummaryModal({
  isOpen,
  availableYears,
  archivingYear,
  setArchivingYear,
  requests,
  academicArchives,
  archiveLoading,
  onArchiveYear,
  onClose,
}: ArchiveSummaryModalProps) {
  if (!isOpen) return null;

  const yearReqs = requests.filter((r) => {
    const yr = r.createdAt ? new Date(r.createdAt).getFullYear() + 543 : null;
    return String(yr) === archivingYear;
  });
  const approved = yearReqs.filter((r) => r.status === 'APPROVED').length;
  const rejected = yearReqs.filter((r) => r.status === 'REJECTED').length;
  const pending = yearReqs.filter((r) => r.status === 'PENDING').length;
  const foreign = yearReqs.filter((r) => r.passportNo && r.passportNo.trim() !== '').length;
  const thai = yearReqs.length - foreign;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                ปิดยอดและจัดเก็บประวัติปีการศึกษา (Academic Year Archiving)
              </h3>
              <p className="text-xs text-slate-500">
                ตามระเบียบงานสารบรรณ มจร. และการประกันคุณภาพการศึกษา
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Year Selector */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">เลือกปีการศึกษาที่ต้องการปิดยอด:</span>
          <div className="flex items-center gap-2">
            {availableYears.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setArchivingYear(yr)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  archivingYear === yr
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                ปีการศึกษา {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Statistics Preview for the Selected Year */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
              <div className="text-2xl font-black text-purple-700">{yearReqs.length}</div>
              <div className="text-[11px] font-bold text-slate-600">คำร้องทั้งหมด</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="text-2xl font-black text-emerald-700">{approved}</div>
              <div className="text-[11px] font-bold text-slate-600">อนุมัติสำเร็จ</div>
            </div>
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
              <div className="text-2xl font-black text-rose-700">{rejected}</div>
              <div className="text-[11px] font-bold text-slate-600">ปฏิเสธคำร้อง</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
              <div className="text-2xl font-black text-amber-700">{pending}</div>
              <div className="text-[11px] font-bold text-slate-600">รอดำเนินการ</div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>สัดส่วนนิสิตผู้ยื่นคำร้อง:</span>
              <span className="text-purple-700">ไทย {thai} รูป/คน | ต่างชาติ {foreign} รูป/คน</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
              <div
                className="bg-orange-500 h-full"
                style={{ width: `${yearReqs.length ? (thai / yearReqs.length) * 100 : 50}%` }}
              />
              <div
                className="bg-blue-600 h-full"
                style={{ width: `${yearReqs.length ? (foreign / yearReqs.length) * 100 : 50}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={archiveLoading}
            onClick={onArchiveYear}
            className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <Archive className="w-4 h-4" />
            <span>{archiveLoading ? 'กำลังบันทึกประวัติ...' : `ยืนยันปิดยอดปีการศึกษา ${archivingYear}`}</span>
          </button>
        </div>

        {/* Archived History List */}
        {academicArchives.length > 0 && (
          <div className="pt-4 border-t space-y-2">
            <h4 className="font-bold text-slate-800 text-xs">
              ประวัติการปิดยอดที่บันทึกไว้ในระบบ:
            </h4>
            <div className="space-y-1.5">
              {academicArchives.map((arch, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-purple-900">ปีการศึกษา {arch.academicYear}</span>
                    <span className="text-slate-400 text-[11px] ml-2">
                      (บันทึกเมื่อ: {new Date(arch.archivedAt).toLocaleDateString('th-TH')})
                    </span>
                  </div>
                  <div className="font-semibold text-slate-700">
                    {arch.approvedCount} / {arch.totalRequests} ฉบับ
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
