'use client';

import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Search,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileCheck2,
  Paperclip,
  Camera,
} from 'lucide-react';
import { CertificateRequest } from './types';
import { maskPassport } from '@/lib/utils/formatters';

interface CertificateTrackerProps {
  trackCode: string;
  setTrackCode: (val: string) => void;
  filterCertYear: string;
  setFilterCertYear: (val: string) => void;
  availableCertYears: string[];
  filteredRequests: CertificateRequest[];
  onPreviewRequest: (r: CertificateRequest) => void;
  canManageCertificates?: boolean;
}

export const CertificateTracker: React.FC<CertificateTrackerProps> = ({
  trackCode,
  setTrackCode,
  filterCertYear,
  setFilterCertYear,
  availableCertYears,
  filteredRequests,
  onPreviewRequest,
  canManageCertificates = false,
}) => {
  const { t, isEn } = useLanguage();
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm max-w-xl mx-auto space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={isEn ? "Enter Student ID (e.g. 6801501123), Name, or Document No..." : "กรอกรหัสนิสิต (เช่น 6801501123), ชื่อ หรือเลขที่เอกสาร..."}
            value={trackCode}
            onChange={(e) => setTrackCode(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        {/* Year Filter Pills for Track Tab */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-purple-600" /> {isEn ? 'Filter Year:' : 'กรองตามปี พ.ศ.:'}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterCertYear('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterCertYear === 'ALL'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isEn ? 'All' : 'ทั้งหมด'}
            </button>
            {availableCertYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setFilterCertYear(yr)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterCertYear === yr
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ปี {yr}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
            ไม่พบประวัติคำร้องตามที่ระบุ
          </div>
        ) : (
          filteredRequests.map((r) => {
            const isThai = r.nationality === 'ไทย' || r.nationality === 'Thai';

            return (
              <div
                key={r.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md">
                        {r.studentCode}
                      </span>
                      <span className="font-bold text-slate-900">{r.fullName}</span>
                      {isThai ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          🇹🇭 คนไทย
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          🌐 ต่างชาติ ({r.nationality || 'Intl'})
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-semibold text-slate-800">{r.certType}</div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>ยื่นเมื่อ: {new Date(r.createdAt).toLocaleDateString('th-TH')}</span>
                      {r.docNo && (
                        <span className="font-mono text-purple-700 font-bold">
                          เลขที่: อว {r.docNoPrefix || (r.docNo?.includes('8002.1') ? '8002.1' : '8002')}/{r.docNo.replace(/^(8002\.1|8002)\s*\/\s*/i, '')}
                        </span>
                      )}
                      {r.passportNo && (
                        <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]" title="เลขหนังสือเดินทางถูกปกปิดบางส่วนตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)">
                          🔒 Pass: {maskPassport(r.passportNo)}
                        </span>
                      )}
                    </div>

                    {/* Supporting document badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      {r.enrollmentSlipUrl ? (
                        <a
                          href={r.enrollmentSlipUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition"
                        >
                          <FileCheck2 className="w-3 h-3 text-emerald-600" /> สำเนาลงเรียน ✓
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          ไม่มีสำเนาลงเรียน
                        </span>
                      )}
                      {r.passportCopyUrl && (
                        <a
                          href={r.passportCopyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 transition"
                        >
                          <Paperclip className="w-3 h-3 text-sky-600" /> สำเนาพาสปอร์ต ✓
                        </a>
                      )}
                      {r.photoUrl && (
                        <a
                          href={r.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 transition"
                        >
                          <Camera className="w-3 h-3 text-amber-600" /> รูปถ่าย ✓
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                    {canManageCertificates && (
                      <button
                        onClick={() => onPreviewRequest(r)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        ดูตัวอย่าง / พิมพ์
                      </button>
                    )}

                    {r.status === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3.5 h-3.5" />
                        อนุมัติแล้ว
                      </span>
                    ) : r.status === 'REJECTED' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        <XCircle className="w-3.5 h-3.5" />
                        ปฏิเสธ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        <Clock className="w-3.5 h-3.5" />
                        รอตรวจสอบ
                      </span>
                    )}
                  </div>
                </div>

                {/* Prominent Rejection Reason alert box */}
                {r.status === 'REJECTED' && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5 animate-in fade-in duration-200">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-rose-950 flex flex-wrap items-center gap-1.5">
                        <span>เหตุผลที่เจ้าหน้าที่ปฏิเสธ:</span>
                        <span className="text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-md font-extrabold">
                          {r.rejectReason || r.note || 'เอกสารไม่ครบถ้วนหรือไม่เป็นไปตามระเบียบ'}
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-700">
                        💡 คำแนะนำ: กรุณาตรวจสอบข้อมูลหรือเตรียมเอกสารแนบตามที่ระบุข้างต้น แล้วยื่นคำร้องใหม่อีกครั้งผ่านแท็บ &quot;แบบฟอร์มยื่นคำร้อง&quot;
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
