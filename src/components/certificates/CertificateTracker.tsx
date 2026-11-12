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
  FileText,
  Paperclip,
  Camera,
  User,
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
            const natLabel =
              !r.nationality || r.nationality === 'ต่างชาติ' || r.nationality.toLowerCase() === 'international'
                ? 'ต่างชาติ (Intl)'
                : `ต่างชาติ (${r.nationality})`;

            const statusAccent =
              r.status === 'APPROVED'
                ? 'border-l-4 border-l-emerald-500'
                : r.status === 'REJECTED'
                ? 'border-l-4 border-l-rose-500'
                : 'border-l-4 border-l-amber-400';

            return (
              <div
                key={r.id}
                className={`bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition space-y-3.5 ${statusAccent}`}
              >
                {/* Row 1: Student ID + Nationality Pill on Left, Status Badge on Right */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="font-mono text-xs font-extrabold text-purple-700 bg-purple-50 border border-purple-200/70 px-2.5 py-1 rounded-lg whitespace-nowrap">
                      {r.studentCode}
                    </span>
                    {isThai ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 whitespace-nowrap">
                        🇹🇭 คนไทย
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 whitespace-nowrap">
                        🌐 {natLabel}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {r.status === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        อนุมัติแล้ว
                      </span>
                    ) : r.status === 'REJECTED' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        ปฏิเสธ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        รอตรวจสอบ
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: Student Full Name & Certificate Type Box */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-base font-extrabold text-slate-900 leading-snug break-words">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{r.fullName}</span>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/90 border border-slate-100 text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                    <FileText className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span className="min-w-0 break-words">{r.certType}</span>
                  </div>
                </div>

                {/* Row 3: Meta Info & Supporting Document Badges */}
                <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      ยื่นเมื่อ: {new Date(r.createdAt).toLocaleDateString('th-TH')}
                    </span>
                    {r.docNo && (
                      <span className="font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
                        เลขที่: อว {r.docNoPrefix || (r.docNo?.includes('8002.1') ? '8002.1' : '8002')}/{r.docNo.replace(/^(8002\.1|8002)\s*\/\s*/i, '')}
                      </span>
                    )}
                    {r.passportNo && (
                      <span
                        className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]"
                        title="เลขหนังสือเดินทางถูกปกปิดบางส่วนตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)"
                      >
                        🔒 Pass: {maskPassport(r.passportNo)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {r.enrollmentSlipUrl ? (
                      <a
                        href={r.enrollmentSlipUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
                      >
                        <FileCheck2 className="w-3 h-3 text-emerald-600" /> สำเนาลงเรียน ✓
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
                        ไม่มีสำเนาลงเรียน
                      </span>
                    )}
                    {r.passportCopyUrl && (
                      <a
                        href={r.passportCopyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200 transition"
                      >
                        <Paperclip className="w-3 h-3 text-sky-600" /> สำเนาพาสปอร์ต ✓
                      </a>
                    )}
                    {r.photoUrl && (
                      <a
                        href={r.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition"
                      >
                        <Camera className="w-3 h-3 text-amber-600" /> รูปถ่าย ✓
                      </a>
                    )}
                    {canManageCertificates && (
                      <button
                        onClick={() => onPreviewRequest(r)}
                        className="px-3 py-1 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        ดูตัวอย่าง / พิมพ์
                      </button>
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
