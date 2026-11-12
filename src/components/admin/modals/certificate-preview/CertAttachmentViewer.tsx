'use client';

import React, { useState } from 'react';
import {
  FileCheck2,
  Globe,
  Layers,
  ExternalLink,
  UploadCloud,
  ZoomIn,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  FileText,
  X,
  Calendar,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { CertificateRequest } from '@/types';
import { InspectionDocTab } from './types';

function evaluateExpiryStatus(rawDate?: string): {
  status: 'EXPIRED' | 'WARNING' | 'VALID' | 'UNKNOWN' | 'EMPTY';
  daysRemaining: number | null;
  label: string;
} {
  const clean = (rawDate || '').trim();
  if (!clean || clean === '-') {
    return { status: 'EMPTY', daysRemaining: null, label: 'ไม่ได้ระบุข้อมูล' };
  }

  // Normalize common month typos (e.g. DCE -> DEC)
  let normalized = clean
    .replace(/\bDCE\b/gi, 'DEC')
    .replace(/\bJNA\b/gi, 'JAN')
    .replace(/\bFBE\b/gi, 'FEB')
    .replace(/\bMRA\b/gi, 'MAR')
    .replace(/\bARP\b/gi, 'APR')
    .replace(/\bJNU\b/gi, 'JUN')
    .replace(/\bJLU\b/gi, 'JUL')
    .replace(/\bAGU\b/gi, 'AUG')
    .replace(/\bSPE\b/gi, 'SEP')
    .replace(/\bOTC\b/gi, 'OCT')
    .replace(/\bNVO\b/gi, 'NOV');

  let parsedDate: Date | null = null;

  // Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = normalized.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10) - 1;
    let y = parseInt(dmyMatch[3], 10);
    if (y > 2400) y -= 543;
    parsedDate = new Date(y, m, d);
  } else {
    // Check if 4-digit year is Buddhist Era (> 2400)
    normalized = normalized.replace(/\b(2[45]\d{2})\b/, (yr) => String(parseInt(yr, 10) - 543));
    const t = Date.parse(normalized);
    if (!Number.isNaN(t)) {
      parsedDate = new Date(t);
    }
  }

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return { status: 'UNKNOWN', daysRemaining: null, label: 'ตรวจสอบวันที่จากเอกสารแนบ' };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetStart = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
  const diffDays = Math.round((targetStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'EXPIRED',
      daysRemaining: diffDays,
      label: `หมดอายุแล้ว (เลยกำหนด ${Math.abs(diffDays)} วัน)`,
    };
  }
  if (diffDays <= 30) {
    return {
      status: 'WARNING',
      daysRemaining: diffDays,
      label: diffDays === 0 ? 'หมดอายุวันนี้!' : `ใกล้หมดอายุ (เหลือ ${diffDays} วัน - ต่ำกว่า 30 วัน)`,
    };
  }
  return {
    status: 'VALID',
    daysRemaining: diffDays,
    label: `ยังไม่หมดอายุ (คงเหลือ ${diffDays} วัน)`,
  };
}

interface CertAttachmentViewerProps {
  previewRequest: CertificateRequest;
  setPreviewRequest: React.Dispatch<React.SetStateAction<CertificateRequest | null>>;
  setPreviewTab: (tab: 'DOCUMENT' | 'ATTACHMENTS') => void;
  handleOpenRejectModal: (request: CertificateRequest) => void;
  setRejectReasonInput: (reason: string) => void;
  handleApprove: (id: string, defaultDocNo?: string, prefix?: '8002' | '8002.1') => Promise<void>;
  loadData: () => void;
  setActionSuccess: (msg: string | null) => void;
}

export function CertAttachmentViewer({
  previewRequest,
  setPreviewRequest,
  setPreviewTab,
  handleOpenRejectModal,
  setRejectReasonInput,
  handleApprove,
  loadData,
  setActionSuccess,
}: CertAttachmentViewerProps) {
  const [inspectionDocTab, setInspectionDocTab] = useState<InspectionDocTab>('ENROLLMENT');
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState<boolean>(false);

  const handleUploadAdditionalAttachment = async (
    file: File,
    type: 'enrollment' | 'passport' | 'photo'
  ) => {
    if (!previewRequest) return;
    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append('scope', 'admin');
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        const updatePayload: any = { id: previewRequest.id };
        if (type === 'enrollment') updatePayload.enrollmentSlipUrl = data.url;
        else if (type === 'passport') updatePayload.passportCopyUrl = data.url;
        else if (type === 'photo') updatePayload.photoUrl = data.url;

        await fetch('/api/certificates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });

        setPreviewRequest((prev) => (prev ? { ...prev, ...updatePayload } : null));
        loadData();
        setActionSuccess('อัปโหลดและแนบเอกสารสำเร็จเรียบร้อย');
      } else {
        alert(data.error || 'อัปโหลดล้มเหลว');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const passportExpiryInfo = evaluateExpiryStatus(previewRequest.passportExpireDate);
  const visaExpiryInfo = evaluateExpiryStatus(previewRequest.visaExpireDate);
  const isThaiApplicant =
    previewRequest.nationality === 'ไทย' ||
    previewRequest.nationality === 'Thai' ||
    previewRequest.targetAudience === 'THAI';

  return (
    <div className="space-y-4 animate-in fade-in py-1">
      {/* Student Info Bar */}
      <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-purple-600 block text-[11px] font-bold">ข้อมูลผู้ยื่นคำร้อง:</span>
          <span className="font-bold text-slate-900 text-sm">{previewRequest.fullName}</span>
          <span className="text-purple-700 font-mono font-bold ml-2">({previewRequest.studentCode})</span>
          <span className="text-slate-600 ml-2">
            | หลักสูตร: {previewRequest.degreeLevel || 'ปริญญาตรี'} สาขา: {previewRequest.major || '-'}
          </span>
          {previewRequest.nationality && (
            <span className="ml-2 px-2 py-0.5 rounded-md bg-white border border-purple-200 text-purple-800 font-bold text-[11px]">
              สัญชาติ: {previewRequest.nationality}
            </span>
          )}
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">สถานะคำร้อง:</span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-xs ${
              previewRequest.status === 'APPROVED'
                ? 'bg-emerald-100 text-emerald-800'
                : previewRequest.status === 'REJECTED'
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {previewRequest.status === 'APPROVED'
              ? 'อนุมัติแล้ว'
              : previewRequest.status === 'REJECTED'
              ? 'ปฏิเสธ'
              : 'รอพิจารณา'}
          </span>
        </div>
      </div>

      {/* Passport & Visa Expiry Inspection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Card 1: Passport Expiry Box */}
        <div
          className={`p-3.5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs shadow-2xs transition ${
            passportExpiryInfo.status === 'EXPIRED'
              ? 'bg-rose-50/90 border-rose-400 text-rose-950'
              : passportExpiryInfo.status === 'WARNING'
              ? 'bg-amber-50/90 border-amber-400 text-amber-950'
              : passportExpiryInfo.status === 'VALID'
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-white shadow-xs ${
                passportExpiryInfo.status === 'EXPIRED'
                  ? 'bg-rose-600'
                  : passportExpiryInfo.status === 'WARNING'
                  ? 'bg-amber-500'
                  : passportExpiryInfo.status === 'VALID'
                  ? 'bg-emerald-600'
                  : 'bg-sky-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-extrabold text-xs text-slate-900">
                  วันหมดอายุ Passport (Passport Expire Date)
                </span>
                {previewRequest.passportNo && (
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white/90 border border-slate-200 text-sky-800">
                    No: {previewRequest.passportNo}
                  </span>
                )}
              </div>
              <div className="text-sm font-black font-mono tracking-wide">
                {previewRequest.passportExpireDate && previewRequest.passportExpireDate.trim() !== ''
                  ? previewRequest.passportExpireDate
                  : isThaiApplicant
                  ? 'ไม่ระบุ (นิสิตสัญชาติไทย)'
                  : 'ไม่ได้ระบุวันหมดอายุ Passport'}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    passportExpiryInfo.status === 'EXPIRED'
                      ? 'bg-rose-200/90 text-rose-900'
                      : passportExpiryInfo.status === 'WARNING'
                      ? 'bg-amber-200/90 text-amber-900'
                      : passportExpiryInfo.status === 'VALID'
                      ? 'bg-emerald-200/80 text-emerald-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {passportExpiryInfo.status === 'EXPIRED' && <ShieldAlert className="w-3 h-3 text-rose-700" />}
                  {passportExpiryInfo.status === 'WARNING' && <AlertTriangle className="w-3 h-3 text-amber-700" />}
                  {passportExpiryInfo.status === 'VALID' && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                  <span>{passportExpiryInfo.label}</span>
                </span>
              </div>
            </div>
          </div>

          {passportExpiryInfo.status === 'EXPIRED' && previewRequest.status === 'PENDING' && (
            <button
              type="button"
              onClick={() => {
                handleOpenRejectModal(previewRequest);
                setRejectReasonInput(
                  `หนังสือเดินทาง (Passport) หมดอายุแล้ว (${previewRequest.passportExpireDate}) กรุณาต่ออายุหนังสือเดินทางก่อนยื่นคำร้อง`
                );
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs transition"
            >
              ปฏิเสธ (Passport หมดอายุ)
            </button>
          )}
        </div>

        {/* Card 2: Visa Expiry Box */}
        <div
          className={`p-3.5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs shadow-2xs transition ${
            visaExpiryInfo.status === 'EXPIRED'
              ? 'bg-rose-50/90 border-rose-400 text-rose-950'
              : visaExpiryInfo.status === 'WARNING'
              ? 'bg-amber-50/90 border-amber-400 text-amber-950'
              : visaExpiryInfo.status === 'VALID'
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-white shadow-xs ${
                visaExpiryInfo.status === 'EXPIRED'
                  ? 'bg-rose-600'
                  : visaExpiryInfo.status === 'WARNING'
                  ? 'bg-amber-500'
                  : visaExpiryInfo.status === 'VALID'
                  ? 'bg-emerald-600'
                  : 'bg-purple-600'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-extrabold text-xs text-slate-900">
                  วันหมดอายุวีซ่า (Visa Expire Date)
                </span>
                {previewRequest.visaType && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white/90 border border-slate-200 text-purple-800">
                    ประเภท: {previewRequest.visaType}
                  </span>
                )}
              </div>
              <div className="text-sm font-black font-mono tracking-wide">
                {previewRequest.visaExpireDate && previewRequest.visaExpireDate.trim() !== ''
                  ? previewRequest.visaExpireDate
                  : isThaiApplicant
                  ? 'ไม่ระบุ (นิสิตสัญชาติไทย)'
                  : 'ไม่ได้ระบุวันหมดอายุวีซ่า'}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    visaExpiryInfo.status === 'EXPIRED'
                      ? 'bg-rose-200/90 text-rose-900'
                      : visaExpiryInfo.status === 'WARNING'
                      ? 'bg-amber-200/90 text-amber-900'
                      : visaExpiryInfo.status === 'VALID'
                      ? 'bg-emerald-200/80 text-emerald-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {visaExpiryInfo.status === 'EXPIRED' && <ShieldAlert className="w-3 h-3 text-rose-700" />}
                  {visaExpiryInfo.status === 'WARNING' && <AlertTriangle className="w-3 h-3 text-amber-700" />}
                  {visaExpiryInfo.status === 'VALID' && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                  <span>{visaExpiryInfo.label}</span>
                </span>
              </div>
            </div>
          </div>

          {visaExpiryInfo.status === 'EXPIRED' && previewRequest.status === 'PENDING' && (
            <button
              type="button"
              onClick={() => {
                handleOpenRejectModal(previewRequest);
                setRejectReasonInput(
                  `วีซ่าหมดอายุแล้ว (${previewRequest.visaExpireDate}) กรุณาติดต่อสำนักงานคณบดีเพื่อตรวจสอบเอกสาร`
                );
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs transition"
            >
              ปฏิเสธ (วีซ่าหมดอายุ)
            </button>
          )}
        </div>
      </div>

      {/* Document View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setInspectionDocTab('ENROLLMENT')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              inspectionDocTab === 'ENROLLMENT'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>ข้อ 1. ใบสำเนาการลงทะเบียนเรียน / ใบเสร็จ</span>
            {previewRequest.enrollmentSlipUrl ? (
              <span className="w-2 h-2 rounded-full bg-emerald-300" title="มีไฟล์แนบแล้ว"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="ยังไม่แนบ"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setInspectionDocTab('PASSPORT')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              inspectionDocTab === 'PASSPORT'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>ข้อ 2. สำเนาหนังสือเดินทาง (Passport)</span>
            {previewRequest.passportCopyUrl ? (
              <span className="w-2 h-2 rounded-full bg-sky-300" title="มีไฟล์แนบแล้ว"></span>
            ) : (
              <span className="text-[10px] text-slate-400 font-normal">
                {previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai'
                  ? '(ไทย)'
                  : '(ยังไม่แนบ)'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setInspectionDocTab('SIDE_BY_SIDE')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              inspectionDocTab === 'SIDE_BY_SIDE'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title="ดูเทียบเอกสารทั้ง 2 ฉบับพร้อมกันแบบ 2 ฝั่ง"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>เทียบ 2 ฝั่ง (Side-by-Side)</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2">
          * รูปถ่ายนิสิต 1.5 - 2 นิ้ว ให้นิสิตนำมาติดเองบนหนังสือรับรองตอนรับเอกสาร
        </div>
      </div>

      {/* Preview View Area */}
      <div
        className={`grid gap-4 ${
          inspectionDocTab === 'SIDE_BY_SIDE' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {/* PREVIEW ข้อ 1: ใบสำเนาลงเรียน / ใบเสร็จ */}
        {(inspectionDocTab === 'ENROLLMENT' || inspectionDocTab === 'SIDE_BY_SIDE') && (
          <div
            className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${
              previewRequest.enrollmentSlipUrl
                ? 'bg-emerald-50/20 border-emerald-300'
                : 'bg-amber-50/50 border-amber-300'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white ${
                    previewRequest.enrollmentSlipUrl ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <span>ข้อ 1: ใบสำเนาการลงทะเบียนเรียน / ใบเสร็จรับเงิน</span>
                    {previewRequest.enrollmentSlipUrl ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        ✓ แนบแล้ว
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                        ⚠️ ขาดเอกสารนี้
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    เอกสารสำคัญใช้ตรวจสอบสถานะการเป็นนิสิตและการลงทะเบียนเรียน
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {previewRequest.enrollmentSlipUrl && (
                  <a
                    href={previewRequest.enrollmentSlipUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-1 shadow-xs transition"
                    title="เปิดเอกสารในแท็บใหม่"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>เปิดแท็บใหม่</span>
                  </a>
                )}

                <label className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 font-bold flex items-center gap-1 cursor-pointer transition shadow-xs">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{uploadingAttachment ? 'กำลังอัปโหลด...' : 'แนบไฟล์แทน'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadAdditionalAttachment(f, 'enrollment');
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Interactive Document Preview Box */}
            {previewRequest.enrollmentSlipUrl ? (
              <div className="space-y-2">
                {previewRequest.enrollmentSlipUrl.toLowerCase().endsWith('.pdf') ? (
                  <div className="rounded-xl overflow-hidden border border-emerald-200 bg-slate-900 shadow-inner">
                    <iframe
                      src={`${previewRequest.enrollmentSlipUrl}#toolbar=0&navpanes=0`}
                      className="w-full h-[520px] bg-white"
                      title="พรีวิวสำเนาลงเรียน (PDF)"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => setZoomImage(previewRequest.enrollmentSlipUrl!)}
                    className="relative h-[520px] bg-slate-900/5 rounded-xl border border-emerald-200 overflow-hidden flex items-center justify-center cursor-zoom-in group shadow-inner"
                    title="คลิกเพื่อดูภาพขยายใหญ่เต็มจอ"
                  >
                    <img
                      src={previewRequest.enrollmentSlipUrl}
                      alt="ใบสำเนาการลงทะเบียนเรียน"
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition gap-1.5">
                      <ZoomIn className="w-4 h-4" />
                      <span>คลิกเพื่อดูภาพขยายใหญ่ (Lightbox Zoom)</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span>
                    ชนิดไฟล์:{' '}
                    {previewRequest.enrollmentSlipUrl.toLowerCase().endsWith('.pdf')
                      ? 'เอกสาร PDF'
                      : 'ไฟล์รูปภาพ'}
                  </span>
                  {!previewRequest.enrollmentSlipUrl.toLowerCase().endsWith('.pdf') && (
                    <button
                      type="button"
                      onClick={() => setZoomImage(previewRequest.enrollmentSlipUrl!)}
                      className="text-purple-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" /> คลิกซูมดูภาพขนาดเต็ม
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-8 bg-white/90 rounded-xl border border-amber-200 text-xs text-center space-y-3 my-2 sm:my-4">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <div>
                  <p className="font-bold text-amber-950 text-sm">
                    นิสิตยังไม่ได้แนบใบสำเนาการลงทะเบียนเรียน
                  </p>
                  <p className="text-xs text-amber-800 max-w-md mx-auto mt-1 leading-relaxed">
                    หากไม่พบคีย์ข้อมูลการลงทะเบียนเรียนในระบบ
                    สามารถกดปฏิเสธคำร้องพร้อมแจ้งให้นิสิตส่งเอกสารเข้ามาใหม่ได้ทันที
                  </p>
                </div>
                {previewRequest.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenRejectModal(previewRequest);
                      setRejectReasonInput('ขาดสำเนาเอกสารการลงทะเบียน');
                    }}
                    className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-200 cursor-pointer inline-flex items-center gap-1.5 transition"
                  >
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>ปฏิเสธคำร้อง (ระบุว่าขาดสำเนาลงทะเบียนเรียน)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* PREVIEW ข้อ 2: สำเนาหนังสือเดินทาง (Passport) */}
        {(inspectionDocTab === 'PASSPORT' || inspectionDocTab === 'SIDE_BY_SIDE') && (
          <div
            className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${
              previewRequest.passportCopyUrl
                ? 'bg-sky-50/20 border-sky-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white ${
                    previewRequest.passportCopyUrl ? 'bg-sky-600' : 'bg-slate-400'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <span>ข้อ 2: สำเนาหนังสือเดินทาง (Passport Copy)</span>
                    {previewRequest.passportCopyUrl ? (
                      <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                        ✓ แนบแล้ว
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                        {previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai'
                          ? 'สัญชาติไทย'
                          : 'ยังไม่ได้แนบ'}
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    เลขที่หนังสือเดินทาง: {previewRequest.passportNo || 'ไม่มี (ใช้เลขบัตร ปชช. ในระบบทะเบียน)'}
                    {' | '}วันหมดอายุ Passport: <strong className="text-slate-800">{previewRequest.passportExpireDate || '-'}</strong>
                    {' | '}วันหมดอายุวีซ่า: <strong className="text-slate-800">{previewRequest.visaExpireDate || '-'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {previewRequest.passportCopyUrl && (
                  <a
                    href={previewRequest.passportCopyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-1 shadow-xs transition"
                    title="เปิดเอกสารในแท็บใหม่"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>เปิดแท็บใหม่</span>
                  </a>
                )}

                <label className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 font-bold flex items-center gap-1 cursor-pointer transition shadow-xs">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{uploadingAttachment ? 'กำลังอัปโหลด...' : 'แนบไฟล์แทน'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadAdditionalAttachment(f, 'passport');
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Interactive Document Preview Box */}
            {previewRequest.passportCopyUrl ? (
              <div className="space-y-2">
                {previewRequest.passportCopyUrl.toLowerCase().endsWith('.pdf') ? (
                  <div className="rounded-xl overflow-hidden border border-sky-200 bg-slate-900 shadow-inner">
                    <iframe
                      src={`${previewRequest.passportCopyUrl}#toolbar=0&navpanes=0`}
                      className="w-full h-[520px] bg-white"
                      title="พรีวิวสำเนาพาสปอร์ต (PDF)"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => setZoomImage(previewRequest.passportCopyUrl!)}
                    className="relative h-[520px] bg-slate-900/5 rounded-xl border border-sky-200 overflow-hidden flex items-center justify-center cursor-zoom-in group shadow-inner"
                    title="คลิกเพื่อดูภาพขยายใหญ่เต็มจอ"
                  >
                    <img
                      src={previewRequest.passportCopyUrl}
                      alt="สำเนาหนังสือเดินทาง"
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition gap-1.5">
                      <ZoomIn className="w-4 h-4" />
                      <span>คลิกเพื่อดูภาพขยายใหญ่ (Lightbox Zoom)</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span>
                    ชนิดไฟล์:{' '}
                    {previewRequest.passportCopyUrl.toLowerCase().endsWith('.pdf')
                      ? 'เอกสาร PDF'
                      : 'ไฟล์รูปภาพ'}
                  </span>
                  {!previewRequest.passportCopyUrl.toLowerCase().endsWith('.pdf') && (
                    <button
                      type="button"
                      onClick={() => setZoomImage(previewRequest.passportCopyUrl!)}
                      className="text-purple-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" /> คลิกซูมดูภาพขนาดเต็ม
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 bg-white/90 rounded-xl border border-slate-200 text-xs text-center space-y-2 my-4">
                <p className="font-bold text-slate-700 text-sm">
                  {previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai'
                    ? '🇹🇭 นิสิตสัญชาติไทย (ใช้ฐานข้อมูลทะเบียนประวัตินิสิต)'
                    : 'ยังไม่มีสำเนาพาสปอร์ตแนบมาในระบบ'}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  เลขพาสปอร์ตที่บันทึก:{' '}
                  <strong className="font-mono text-purple-700">
                    {previewRequest.passportNo || 'ไม่มี'}
                  </strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SUMMARY & ACTION FOOTER BAR */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3.5 text-xs">
        <div className="space-y-1.5">
          <div className="font-bold text-slate-900 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span>สรุปเอกสาร:</span>
            <span
              className={
                previewRequest.enrollmentSlipUrl
                  ? 'text-emerald-700 font-bold'
                  : 'text-amber-700 font-bold'
              }
            >
              1. สำเนาลงเรียน {previewRequest.enrollmentSlipUrl ? '✓ เรียบร้อย' : '⚠️ ยังไม่แนบ'}
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span
              className={
                previewRequest.passportCopyUrl ? 'text-sky-700 font-bold' : 'text-slate-600'
              }
            >
              2. สำเนาพาสปอร์ต {previewRequest.passportCopyUrl ? '✓ แนบแล้ว' : '(ใช้ข้อมูลทะเบียน)'}
            </span>
          </div>
          <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
            📸 <strong>ข้อ 3. รูปถ่ายนิสิต (ขนาด 1.5 - 2 นิ้ว):</strong>{' '}
            ให้นิสิตนำรูปถ่ายจริงมาติดบนหนังสือรับรองด้วยตนเองในวันมารับเอกสารฉบับจริง (เว้นช่องเส้นประไว้บนแบบฟอร์มแล้ว)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setPreviewTab('DOCUMENT')}
            className="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-purple-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>สลับไปดูตัวอย่างหนังสือรับรอง</span>
          </button>

          {previewRequest.status === 'PENDING' && (
            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleOpenRejectModal(previewRequest)}
                className="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <XCircle className="w-4 h-4 shrink-0" />
                <span>ปฏิเสธคำร้อง</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleApprove(previewRequest.id);
                  setPreviewRequest(null);
                }}
                className="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>อนุมัติคำร้อง</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2 shadow-2xl">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 font-bold transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomImage}
              alt="ภาพขยายเอกสารแนบ"
              className="max-w-full max-h-[85vh] object-contain mx-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
