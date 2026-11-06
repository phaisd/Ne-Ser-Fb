'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Printer,
  FileText,
  Paperclip,
  FileCheck2,
  Globe,
  Layers,
  ExternalLink,
  UploadCloud,
  ZoomIn,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  UserCog,
  Hash,
  RefreshCw,
  Save,
  FileEdit,
  SlidersHorizontal,
  Type,
  MoveVertical,
  Sparkles,
  Download,
} from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf-export';
import { CertificateRequest, SystemSettings, SignatoryItem } from '@/types';

export interface AdminCertificatePreviewModalProps {
  previewRequest: CertificateRequest | null;
  setPreviewRequest: React.Dispatch<React.SetStateAction<CertificateRequest | null>>;
  previewTab: 'DOCUMENT' | 'ATTACHMENTS';
  setPreviewTab: React.Dispatch<React.SetStateAction<'DOCUMENT' | 'ATTACHMENTS'>>;
  requests: CertificateRequest[];
  settings: SystemSettings;
  activeSignatoriesList: SignatoryItem[];
  currentUser: any;
  handleApprove: (id: string, defaultDocNo?: string, prefix?: '8002' | '8002.1') => Promise<void>;
  handleOpenRejectModal: (request: CertificateRequest) => void;
  setRejectReasonInput: React.Dispatch<React.SetStateAction<string>>;
  loadData: () => void;
  setActionSuccess: React.Dispatch<React.SetStateAction<string | null>>;
}

export function AdminCertificatePreviewModal({
  previewRequest,
  setPreviewRequest,
  previewTab,
  setPreviewTab,
  requests,
  settings,
  activeSignatoriesList,
  currentUser,
  handleApprove,
  handleOpenRejectModal,
  setRejectReasonInput,
  loadData,
  setActionSuccess,
}: AdminCertificatePreviewModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [inspectionDocTab, setInspectionDocTab] = useState<'ENROLLMENT' | 'PASSPORT' | 'SIDE_BY_SIDE'>('ENROLLMENT');
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState<boolean>(false);

  // Document Customizer States
  const [previewTemplate, setPreviewTemplate] = useState<'THAI_STANDARD' | 'BANK_LETTER' | 'ENG_CERT' | 'INTERNAL_MEMO'>('THAI_STANDARD');
  const [docFontSize, setDocFontSize] = useState<number>(16);
  const [signerFontSize, setSignerFontSize] = useState<number>(14);
  const [studentSignFontSize, setStudentSignFontSize] = useState<number>(14);
  const [docLineSpacing, setDocLineSpacing] = useState<number>(1.6);
  const [docSignerOffset, setDocSignerOffset] = useState<number>(20);
  const [photoBoxOffsetX, setPhotoBoxOffsetX] = useState<number>(0);
  const [dotsCount, setDotsCount] = useState<number>(22);
  const [headerTitleSpacing, setHeaderTitleSpacing] = useState<number>(24);
  const [headerTopSpacing, setHeaderTopSpacing] = useState<number>(0);
  const [docFontFamily, setDocFontFamily] = useState<string>('Sarabun, "TH Sarabun New", "TH Sarabun PSK", sans-serif');
  const [studentSignAlign, setStudentSignAlign] = useState<'left' | 'center' | 'right'>('center');
  const [studentSignOffsetX, setStudentSignOffsetX] = useState<number>(0);
  const [showPhotoBox, setShowPhotoBox] = useState<boolean>(true);
  const [showStudentSign, setShowStudentSign] = useState<boolean>(true);
  const [customStudentSignName, setCustomStudentSignName] = useState<string>('');
  const [customStudentDots, setCustomStudentDots] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [pdfDownloading, setPdfDownloading] = useState<boolean>(false);
  const [docTitleFontSize, setDocTitleFontSize] = useState<number>(18);
  const [docTitleFontWeight, setDocTitleFontWeight] = useState<'font-normal' | 'font-semibold' | 'font-bold' | 'font-black'>('font-bold');
  const [showSignerOrg, setShowSignerOrg] = useState<boolean>(true);
  const [signerOrgCustomText, setSignerOrgCustomText] = useState<string>('');
  const [useThaiNumerals, setUseThaiNumerals] = useState<boolean>(true);

  // Signatory Customization for Print Preview
  const [selectedSignerPreset, setSelectedSignerPreset] = useState<string>('DEAN');
  const [customSigner, setCustomSigner] = useState({
    name: 'พระครูสุธีกิตติบัณฑิต, รศ.ดร.',
    title: 'คณบดีคณะพุทธศาสตร์',
  });

  const toThaiDigits = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '';
    const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
    return String(val).replace(/[0-9]/g, (d) => thaiDigits[parseInt(d, 10)]);
  };

  const fmtNum = (val: string | number | undefined | null, isThai = true): string => {
    if (val === undefined || val === null) return '';
    if (useThaiNumerals && isThai) {
      return toThaiDigits(val);
    }
    return String(val);
  };

  // Document Number & Custom Body States for Preview Modal
  const [docNoInputModal, setDocNoInputModal] = useState<string>('');
  const [docNoPrefix, setDocNoPrefix] = useState<'8002' | '8002.1'>('8002');
  const [isSavingDocNo, setIsSavingDocNo] = useState<boolean>(false);
  const [customBodyText, setCustomBodyText] = useState<string>('');
  const [isCustomTextOpen, setIsCustomTextOpen] = useState<boolean>(false);
  const [customTextMode, setCustomTextMode] = useState<'HIGHLIGHT' | 'RAW'>('HIGHLIGHT');
  const [previewAge, setPreviewAge] = useState<string>('');
  const [previewVassa, setPreviewVassa] = useState<string>('');

  const isMonastic = (name?: string): boolean => {
    if (!name) return false;
    return /^(พระมหา|พระครู|พระปลัด|พระสมุห์|พระใบฎีกา|พระราช|พระเทพ|พระธรรม|พระพรหม|สมเด็จพระ|พระ|สามเณร|Ven\.|Phra)/i.test(name.trim());
  };

  const sanitizeName = (name?: string): string => {
    if (!name) return '';
    let cleaned = name.trim();
    cleaned = cleaned.replace(/^(พระมหา[\s\u200B]*)+พระมหา/gi, 'พระมหา');
    cleaned = cleaned.replace(/^(พระครู[\s\u200B]*)+พระครู/gi, 'พระครู');
    cleaned = cleaned.replace(/^(พระ[\s\u200B]*)+พระ/gi, 'พระ');
    cleaned = cleaned.replace(/^(สามเณร[\s\u200B]*)+สามเณร/gi, 'สามเณร');
    cleaned = cleaned.replace(/^(นาย[\s\u200B]*)+นาย/gi, 'นาย');
    cleaned = cleaned.replace(/^(นางสาว[\s\u200B]*)+นางสาว/gi, 'นางสาว');
    cleaned = cleaned.replace(/^(นาง[\s\u200B]*)+นาง/gi, 'นาง');
    return cleaned.trim();
  };

  const buildDefaultBodyText = (ageVal?: string, vassaVal?: string): string => {
    if (!previewRequest) return '';
    const effAge = ageVal !== undefined ? ageVal : previewAge;
    const effVassa = vassaVal !== undefined ? vassaVal : previewVassa;

    const ageStr = effAge ? `อายุ ${fmtNum(effAge)} ปี ` : '';
    const vassaStr = effVassa ? `พรรษา ${fmtNum(effVassa)} ` : '';

    return `โดยหนังสือนี้ขอรับรองว่า ${sanitizeName(previewRequest.fullName)} ${ageStr}${vassaStr}สัญชาติ ${previewRequest.nationality || 'ไทย'} ${previewRequest.country && previewRequest.country !== 'Thailand' ? `ประเทศ ${previewRequest.country} ` : ''}${previewRequest.passportNo ? `ถือหนังสือเดินทางเลขที่ ${previewRequest.passportNo} และวีซ่าประเภท ${previewRequest.visaType || 'คนอยู่ชั่วคราว (Non-Immigrant Visa)'} ` : ''}เป็นนิสิตคณะพุทธศาสตร์ หลักสูตร${previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'} (ระดับ${previewRequest.degreeLevel || 'ปริญญาตรี'} หลักสูตร ${fmtNum(4)} ปี) ชั้นปีที่ ${fmtNum(previewRequest.studentCode.substring(0, 2) ? '2' : '1')} สาขาวิชา ${previewRequest.major || 'พระพุทธศาสนา'} (${previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai' ? 'ภาคภาษาไทย' : 'ภาคภาษาอังกฤษ'}) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย รหัสประจำตัวนิสิต ${fmtNum(previewRequest.studentCode)} เพื่อเป็นหลักฐาน สำหรับ ${previewRequest.requestPurpose || previewRequest.certType} จึงออกหนังสือนี้ไว้เป็นสำคัญ`;
  };

  const computeNextDocNo = (): string => {
    const currentYear = new Date().getFullYear() + 543;
    let maxSeq = 0;

    requests.forEach((r) => {
      const raw = r.docNo || '';
      const cleaned = raw.replace(/^8002\s*\/\s*/i, '');
      const match = cleaned.match(/^(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq && num < 10000) {
          maxSeq = num;
        }
      }
    });

    const nextNum = maxSeq > 0 ? maxSeq + 1 : requests.filter((r) => r.status === 'APPROVED').length + 1;
    const seqStr = String(nextNum).padStart(3, '0');
    return `${seqStr}/${currentYear}`;
  };

  const computeNextSeqOnly = (): string => {
    let maxSeq = 0;
    requests.forEach((r) => {
      const raw = r.docNo || '';
      const cleaned = raw.replace(/^8002\s*\/\s*/i, '');
      const match = cleaned.match(/^(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq && num < 10000) {
          maxSeq = num;
        }
      }
    });
    const nextNum = maxSeq > 0 ? maxSeq + 1 : requests.filter((r) => r.status === 'APPROVED').length + 1;
    return String(nextNum).padStart(3, '0');
  };

  useEffect(() => {
    if (previewRequest) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3020';
      const effectiveDoc = docNoInputModal || previewRequest.docNo || previewRequest.id;
      const verifyUrl = `${origin}/verify?docNo=${encodeURIComponent(effectiveDoc)}`;
      QRCode.toDataURL(verifyUrl, {
        width: 180,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      }).then(setQrCodeDataUrl).catch(() => setQrCodeDataUrl(''));

      if (previewRequest.certType?.includes('ธนาคาร') || previewRequest.certType?.includes('Banking') || (previewRequest as any).bankTargetTh) {
        setPreviewTemplate('BANK_LETTER');
      } else if (previewRequest.certType?.includes('English') || previewRequest.certType?.includes('CONCERN')) {
        setPreviewTemplate('ENG_CERT');
      } else {
        setPreviewTemplate('THAI_STANDARD');
      }
    } else {
      setQrCodeDataUrl('');
    }
  }, [previewRequest, docNoInputModal]);

  useEffect(() => {
    if (previewRequest) {
      const isSec = (previewRequest as any).docNoPrefix === '8002.1' || (previewRequest.docNo && previewRequest.docNo.includes('8002.1'));
      setDocNoPrefix(isSec ? '8002.1' : '8002');
      if (previewRequest.docNo) {
        setDocNoInputModal(previewRequest.docNo.replace(/^(8002\.1|8002)\s*\/\s*/i, ''));
      } else {
        setDocNoInputModal(computeNextDocNo());
      }
      setCustomBodyText(previewRequest.customBodyText || '');
      setCustomStudentSignName(sanitizeName(previewRequest.fullName));
      setCustomStudentDots('');
      setPreviewAge(previewRequest.age !== undefined && previewRequest.age !== null ? String(previewRequest.age) : '');
      setPreviewVassa(previewRequest.vassa !== undefined && previewRequest.vassa !== null ? String(previewRequest.vassa) : '');
      setCustomTextMode('HIGHLIGHT');
    }
  }, [previewRequest?.id]);

  useEffect(() => {
    if (previewRequest) {
      setSelectedSignerPreset('DEAN');
      const defaultDean = activeSignatoriesList.find((s) => s.id === 'DEAN');
      const validName =
        settings.signerNameTh && settings.signerNameTh !== '-'
          ? settings.signerNameTh
          : defaultDean?.name || 'พระราชอุดมวัชรเมธี, ผศ.ดร.';
      const validTitle =
        settings.signerTitleTh && settings.signerTitleTh !== '-'
          ? settings.signerTitleTh
          : defaultDean?.title || 'คณบดีคณะพุทธศาสตร์';
      setCustomSigner({
        name: validName,
        title: validTitle,
      });
    }
  }, [previewRequest, settings.signerNameTh, settings.signerTitleTh, activeSignatoriesList]);

  const handleSaveDocNoModal = async (customVal?: string, prefixOverride?: '8002' | '8002.1') => {
    if (!previewRequest) return;
    const val = (customVal !== undefined ? customVal : docNoInputModal).trim();
    if (!val) {
      alert('กรุณาระบุเลขที่หนังสือ');
      return;
    }
    const currentPrefix = prefixOverride || docNoPrefix;
    setIsSavingDocNo(true);
    try {
      const res = await fetch('/api/certificates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: previewRequest.id,
          docNo: val,
          docNoPrefix: currentPrefix,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewRequest((prev) => (prev ? { ...prev, docNo: val, docNoPrefix: currentPrefix } : null));
        setDocNoInputModal(val);
        setDocNoPrefix(currentPrefix);
        loadData();
        setActionSuccess(`บันทึกเลขที่หนังสือ [ที่ อว ${currentPrefix} / ${val}] เรียบร้อยแล้ว`);
      } else {
        alert('บันทึกไม่สำเร็จ: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSavingDocNo(false);
    }
  };

  const handleSaveCustomBodyText = async () => {
    if (!previewRequest) return;
    try {
      const res = await fetch('/api/certificates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: previewRequest.id,
          customBodyText: customBodyText.trim(),
          age: previewAge.trim() || undefined,
          vassa: previewVassa.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewRequest((prev) => (prev ? {
          ...prev,
          customBodyText: customBodyText.trim(),
          age: previewAge.trim() || undefined,
          vassa: previewVassa.trim() || undefined,
        } : null));
        loadData();
        setActionSuccess('บันทึกข้อความเนื้อหาและข้อมูลตัวแปร (อายุ/พรรษา) เรียบร้อยแล้ว');
      } else {
        alert('บันทึกไม่สำเร็จ: ' + data.error);
      }
    } catch (err: any) {
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    }
  };

  const handleUploadAdditionalAttachment = async (file: File, type: 'enrollment' | 'passport' | 'photo') => {
    if (!previewRequest) return;
    setUploadingAttachment(true);
    try {
      const formData = new FormData();
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

  const handleDownloadPdf = async () => {
    if (!previewRequest) return;
    setPdfDownloading(true);
    try {
      const safeName = (previewRequest.fullName || 'student').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');
      const activeDoc = (docNoInputModal || previewRequest.docNo || previewRequest.id).replace(/\//g, '-');
      const filename = `หนังสือรับรอง_${safeName}_อว8002-${activeDoc}.pdf`;
      await exportElementToPdf('printable-certificate', filename);
    } catch (e) {
      console.error('Download PDF error:', e);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด PDF กรุณาลองใช้ปุ่ม สั่งพิมพ์ (Print to PDF)');
    } finally {
      setPdfDownloading(false);
    }
  };

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: PRINT & PREVIEW CERTIFICATE
         ───────────────────────────────────────────────────────────── */}
      {previewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`bg-white rounded-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-4 transition-all duration-200 ${
            previewTab === 'ATTACHMENTS' ? 'max-w-5xl' : 'max-w-3xl'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {previewTab === 'DOCUMENT'
                      ? 'ตัวอย่างเอกสารทางการ (Official Document Preview)'
                      : 'ตรวจสอบเอกสารสำเนาที่แนบมา (Attached Copies Inspection)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    คำร้อง: <span className="font-bold text-slate-800">{previewRequest.fullName}</span> ({previewRequest.studentCode})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Tab Switcher: Document vs Attachments */}
                <div className="flex p-0.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('DOCUMENT')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      previewTab === 'DOCUMENT'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>ตัวอย่างหนังสือ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('ATTACHMENTS')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      previewTab === 'ATTACHMENTS'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>ตรวจเอกสารแนบ</span>
                    {previewRequest.enrollmentSlipUrl ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="มีสำเนาลงเรียนแล้ว"></span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="ขาดสำเนาลงเรียน"></span>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setPreviewRequest(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {previewTab === 'ATTACHMENTS' ? (
              /* ── ATTACHMENT INSPECTION SCREEN ── */
              <div className="space-y-4 animate-in fade-in py-1">
                {/* Student Info Bar */}
                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-purple-600 block text-[11px] font-bold">ข้อมูลผู้ยื่นคำร้อง:</span>
                    <span className="font-bold text-slate-900 text-sm">{previewRequest.fullName}</span>
                    <span className="text-purple-700 font-mono font-bold ml-2">({previewRequest.studentCode})</span>
                    <span className="text-slate-600 ml-2">| หลักสูตร: {previewRequest.degreeLevel || 'ปริญญาตรี'} สาขา: {previewRequest.major || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">สถานะคำร้อง:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-xs ${
                      previewRequest.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : previewRequest.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {previewRequest.status === 'APPROVED' ? 'อนุมัติแล้ว' : previewRequest.status === 'REJECTED' ? 'ปฏิเสธ' : 'รอพิจารณา'}
                    </span>
                  </div>
                </div>

                {/* Document View Switcher (สลับตรวจข้อ 1 หรือข้อ 2 หรือเทียบข้างกัน) */}
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
                          {previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai' ? '(ไทย)' : '(ยังไม่แนบ)'}
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
                <div className={`grid gap-4 ${inspectionDocTab === 'SIDE_BY_SIDE' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {/* ───────────────── PREVIEW ข้อ 1: ใบสำเนาลงเรียน / ใบเสร็จ ───────────────── */}
                  {(inspectionDocTab === 'ENROLLMENT' || inspectionDocTab === 'SIDE_BY_SIDE') && (
                    <div className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${
                      previewRequest.enrollmentSlipUrl ? 'bg-emerald-50/20 border-emerald-300' : 'bg-amber-50/50 border-amber-300'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white ${
                            previewRequest.enrollmentSlipUrl ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}>
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
                            <p className="text-[11px] text-slate-500">เอกสารสำคัญใช้ตรวจสอบสถานะการเป็นนิสิตและการลงทะเบียนเรียน</p>
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
                              ชนิดไฟล์: {previewRequest.enrollmentSlipUrl.toLowerCase().endsWith('.pdf') ? 'เอกสาร PDF' : 'ไฟล์รูปภาพ'}
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
                        <div className="p-8 bg-white/90 rounded-xl border border-amber-200 text-xs text-center space-y-3 my-4">
                          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                          <div>
                            <p className="font-bold text-amber-950 text-sm">นิสิตยังไม่ได้แนบใบสำเนาการลงทะเบียนเรียน</p>
                            <p className="text-xs text-amber-800 max-w-md mx-auto mt-1">
                              หากไม่พบคีย์ข้อมูลการลงทะเบียนเรียนในระบบ สามารถกดปฏิเสธคำร้องพร้อมแจ้งให้นิสิตส่งเอกสารเข้ามาใหม่ได้ทันที
                            </p>
                          </div>
                          {previewRequest.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenRejectModal(previewRequest);
                                setRejectReasonInput('ขาดสำเนาเอกสารการลงทะเบียน');
                              }}
                              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-200 cursor-pointer inline-flex items-center gap-1.5 transition"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>ปฏิเสธคำร้อง (ระบุว่าขาดสำเนาลงทะเบียนเรียน)</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ───────────────── PREVIEW ข้อ 2: สำเนาหนังสือเดินทาง (Passport) ───────────────── */}
                  {(inspectionDocTab === 'PASSPORT' || inspectionDocTab === 'SIDE_BY_SIDE') && (
                    <div className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${
                      previewRequest.passportCopyUrl ? 'bg-sky-50/20 border-sky-300' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white ${
                            previewRequest.passportCopyUrl ? 'bg-sky-600' : 'bg-slate-400'
                          }`}>
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
                                  {previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai' ? 'สัญชาติไทย' : 'ยังไม่ได้แนบ'}
                                </span>
                              )}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-mono">
                              เลขที่หนังสือเดินทาง: {previewRequest.passportNo || 'ไม่มี (ใช้เลขบัตร ปชช. ในระบบทะเบียน)'}
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
                              ชนิดไฟล์: {previewRequest.passportCopyUrl.toLowerCase().endsWith('.pdf') ? 'เอกสาร PDF' : 'ไฟล์รูปภาพ'}
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
                            เลขพาสปอร์ตที่บันทึก: <strong className="font-mono text-purple-700">{previewRequest.passportNo || 'ไม่มี'}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ───────────────── SUMMARY & ACTION FOOTER BAR ───────────────── */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 flex flex-wrap items-center gap-3">
                      <span>สรุปเอกสาร:</span>
                      <span className={previewRequest.enrollmentSlipUrl ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                        1. สำเนาลงเรียน {previewRequest.enrollmentSlipUrl ? '✓ เรียบร้อย' : '⚠️ ยังไม่แนบ'}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className={previewRequest.passportCopyUrl ? 'text-sky-700 font-bold' : 'text-slate-600'}>
                        2. สำเนาพาสปอร์ต {previewRequest.passportCopyUrl ? '✓ แนบแล้ว' : '(ใช้ข้อมูลทะเบียน)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 font-medium">
                      📸 <strong>ข้อ 3. รูปถ่ายนิสิต (ขนาด 1.5 - 2 นิ้ว):</strong> ให้นิสิตนำรูปถ่ายจริงมาติดบนหนังสือรับรองด้วยตนเองในวันมารับเอกสารฉบับจริง (เว้นช่องเส้นประไว้บนแบบฟอร์มแล้ว)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('DOCUMENT')}
                      className="px-4 py-2.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-purple-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <FileText className="w-4 h-4" />
                      <span>สลับไปดูตัวอย่างหนังสือรับรอง</span>
                    </button>

                    {previewRequest.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(previewRequest)}
                          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>ปฏิเสธคำร้อง</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await handleApprove(previewRequest.id);
                            setPreviewRequest(null);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>อนุมัติคำร้อง</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ── DOCUMENT PREVIEW & CUSTOMIZER ── */
              <>
                {/* Quick Attachment Indicator Bar inside Document tab */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-700">เอกสารแนบ:</span>
                    {previewRequest.enrollmentSlipUrl ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        <FileCheck2 className="w-3.5 h-3.5" /> มีใบสำเนาลงเรียนแล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                        ⚠️ ขาดสำเนาการลงทะเบียนเรียน
                      </span>
                    )}
                    {previewRequest.passportCopyUrl && (
                      <span className="inline-flex items-center gap-1 font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md">
                        <Paperclip className="w-3.5 h-3.5" /> สำเนาพาสปอร์ต
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('ATTACHMENTS')}
                      className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 underline cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>คลิกเพื่อตรวจสอบเอกสารสำเนาแนบ</span>
                    </button>
                    {previewRequest.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleOpenRejectModal(previewRequest)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition"
                      >
                        ปฏิเสธคำร้อง
                      </button>
                    )}
                  </div>
                </div>

                {/* Signatory & Document Customization Toolbar (Hidden on Print) */}
                <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200/80 space-y-3 print:hidden text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="font-bold text-purple-900 flex items-center gap-1.5">
                      <UserCog className="w-4 h-4 text-purple-600" />
                      <span>เครื่องมือปรับแต่งเอกสาร &amp; เลือกแบบฟอร์ม (Document Customizer)</span>
                    </label>
                    <span className="text-[11px] text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full font-semibold">
                      ✍️ ปรับแต่งได้สดๆ และคลิกแก้ไขข้อความบนเอกสารได้ทันที
                    </span>
                  </div>

              {/* Template Selector & Signer Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                {/* Template Selection */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชนิดแบบฟอร์มเอกสาร:
                  </label>
                  <select
                    value={previewTemplate}
                    onChange={(e: any) => setPreviewTemplate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-300 bg-white font-bold text-xs text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm cursor-pointer"
                  >
                    <option value="THAI_STANDARD">📜 รับรองนิสิต (ไทย) + รูปถ่าย (หน้า 2-9)</option>
                    <option value="BANK_LETTER">🏦 ขอความอนุเคราะห์ธนาคาร (หน้า 1)</option>
                    <option value="ENG_CERT">🌐 รับรองภาษาอังกฤษ (TO WHOM) (PDF 2)</option>
                    <option value="INTERNAL_MEMO">📑 บันทึกข้อความราชการ (หน้า 10)</option>
                  </select>
                </div>

                {/* Dropdown Preset */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ตำแหน่งผู้ลงนาม:
                  </label>
                  <select
                    value={selectedSignerPreset}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedSignerPreset(val);
                      if (val === 'SECRETARY') {
                        setDocNoPrefix('8002.1');
                      } else if (val === 'DEAN') {
                        setDocNoPrefix('8002');
                      }
                      const found = activeSignatoriesList.find((p) => p.id === val);
                      if (found) {
                        if (val === 'DEAN') {
                          const validName =
                            settings.signerNameTh && settings.signerNameTh !== '-'
                              ? settings.signerNameTh
                              : found.name || 'พระราชอุดมวัชรเมธี, ผศ.ดร.';
                          const validTitle =
                            settings.signerTitleTh && settings.signerTitleTh !== '-'
                              ? settings.signerTitleTh
                              : found.title || 'คณบดีคณะพุทธศาสตร์';
                          setCustomSigner({
                            name: validName,
                            title: validTitle,
                          });
                        } else {
                          setCustomSigner({
                            name: found.name,
                            title: found.title,
                          });
                        }
                      }
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white font-medium text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm cursor-pointer"
                  >
                    {activeSignatoriesList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                    <option value="CUSTOM">✍️ กำหนดเอง (พิมพ์ระบุเอง)</option>
                  </select>
                </div>

                {/* Custom Signer Name Input */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชื่อผู้ลงนาม (แก้ไขได้):
                  </label>
                  <input
                    type="text"
                    placeholder="ชื่อผู้ลงนาม"
                    value={customSigner.name}
                    onChange={(e) => {
                      setCustomSigner({ ...customSigner, name: e.target.value });
                      setSelectedSignerPreset('CUSTOM');
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
                  />
                </div>

                {/* Custom Signer Title Input */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ตำแหน่งผู้ลงนาม:
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น รองคณบดีฝ่ายวิชาการ"
                    value={customSigner.title}
                    onChange={(e) => {
                      setCustomSigner({ ...customSigner, title: e.target.value });
                      setSelectedSignerPreset('CUSTOM');
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
                  />
                </div>
              </div>

              {/* Document Number & Content Customization Row */}
              <div className="p-3 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white rounded-xl border border-indigo-200/80 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
                {/* Document Number Control (ที่ อว 8002 / หรือ ที่ อว 8002.1 /) */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                    <Hash className="w-4 h-4 text-indigo-600" />
                    <span>เลขที่หนังสือ:</span>
                  </div>

                  {/* Prefix Selector Toggle: คณบดี (8002) vs เลขานุการ (8002.1) */}
                  <div className="flex items-center p-0.5 bg-indigo-100/90 rounded-xl border border-indigo-200 text-xs font-bold shadow-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setDocNoPrefix('8002');
                        handleSaveDocNoModal(undefined, '8002');
                      }}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        docNoPrefix === '8002'
                          ? 'bg-indigo-700 text-white shadow-xs'
                          : 'text-indigo-800 hover:bg-indigo-200/60'
                      }`}
                      title="เลขที่หนังสือระดับคณะ/คณบดี: ที่ อว 8002 /"
                    >
                      <span>🏛️ คณบดี</span>
                      <span className="font-mono text-[11px] opacity-90">(อว 8002 /)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDocNoPrefix('8002.1');
                        handleSaveDocNoModal(undefined, '8002.1');
                      }}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        docNoPrefix === '8002.1'
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'text-purple-800 hover:bg-purple-200/60'
                      }`}
                      title="เลขที่หนังสือระดับสำนักงานคณบดี/เลขานุการ: ที่ อว 8002.1 /"
                    >
                      <span>📑 เลขานุการ</span>
                      <span className="font-mono text-[11px] opacity-90">(อว 8002.1 /)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-indigo-300 shadow-inner">
                    <span className="font-mono text-indigo-700 font-bold">
                      ที่ อว {docNoPrefix} /
                    </span>
                    <input
                      type="text"
                      value={docNoInputModal}
                      onChange={(e) => setDocNoInputModal(e.target.value)}
                      placeholder="เช่น 716/2569 หรือ 166"
                      className="font-mono font-bold text-indigo-950 px-1 py-0.5 outline-none w-28 bg-transparent"
                      title="พิมพ์เลขที่หนังสือที่ต้องการ หรือกดปุ่มออกเลขอัตโนมัติ"
                    />
                  </div>

                  {/* Auto sequence button */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = computeNextDocNo();
                      setDocNoInputModal(next);
                      handleSaveDocNoModal(next);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                    title="คำนวณและรันเลขอัตโนมัติต่อเนื่องจากฉบับล่าสุดในระบบ"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>🔄 ออกเลขอัตโนมัติ (ต่อเนื่อง)</span>
                  </button>

                  {/* Number only button */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = computeNextSeqOnly();
                      setDocNoInputModal(next);
                      handleSaveDocNoModal(next);
                    }}
                    className="px-2 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold transition cursor-pointer"
                    title="ออกเฉพาะตัวเลข 3 หลัก เช่น 716 (ไม่ระบุปี)"
                  >
                    เฉพาะเลข ({computeNextSeqOnly()})
                  </button>

                  {/* Save DocNo Button */}
                  <button
                    type="button"
                    disabled={isSavingDocNo}
                    onClick={() => handleSaveDocNoModal()}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer flex items-center gap-1 shadow-xs disabled:opacity-50"
                    title="บันทึกเลขที่หนังสือลงในฐานข้อมูลคำร้อง"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingDocNo ? 'กำลังบันทึก...' : '💾 บันทึกเลขนี้'}</span>
                  </button>
                </div>

                {/* Custom Body Text Drawer Toggle Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomTextOpen(!isCustomTextOpen)}
                    className={`px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      isCustomTextOpen || customBodyText
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-300'
                    }`}
                    title="คลิกเพื่อเปิดกล่องแก้ไข/เพิ่มเติมข้อความต้นฉบับในหนังสือ"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>✍️ แก้ไข/เพิ่มเติมข้อความต้นฉบับ {customBodyText ? '✨ (กำลังใช้ข้อความกำหนดเอง)' : ''}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Document Body Text Editor & Smart Colored Variables Highlight */}
              {isCustomTextOpen && (
                <div className="p-4 bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50/80 rounded-2xl border-2 border-amber-300 shadow-md space-y-3.5 print:hidden text-xs animate-in fade-in">
                  {/* Top Bar with Mode Switcher & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500 text-white font-bold">
                        <FileEdit className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-amber-950 flex items-center gap-1.5">
                          <span>แก้ไข / เพิ่มเติม ข้อความต้นฉบับ & แถบสีข้อมูลตัวแปร</span>
                          {isMonastic(previewRequest.fullName) && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold border border-amber-300">
                              ☸️ มีช่องพรรษาสำหรับพระภิกษุ/บรรพชิต
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-amber-800/80">
                          แถบสีเน้นข้อมูลตัวแปรจะแสดงเฉพาะในกล่องนี้ เพื่อให้แก้ไขง่าย ไม่ลน และไม่ลบผิด
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* View Mode Toggle */}
                      <div className="flex items-center bg-white p-0.5 rounded-xl border border-amber-300 shadow-xs">
                        <button
                          type="button"
                          onClick={() => setCustomTextMode('HIGHLIGHT')}
                          className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                            customTextMode === 'HIGHLIGHT'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-amber-900 hover:bg-amber-50'
                          }`}
                          title="แสดงมุมมองแถบสีตัวแปร แยกแยะชัดเจน ป้องกันการพิมพ์ผิด"
                        >
                          <span>🎨 มุมมองแถบสี (Smart Highlight)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!customBodyText) {
                              setCustomBodyText(buildDefaultBodyText());
                            }
                            setCustomTextMode('RAW');
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                            customTextMode === 'RAW'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-amber-900 hover:bg-amber-50'
                          }`}
                          title="กล่องพิมพ์ข้อความอิสระ (Textarea)"
                        >
                          <span>📝 กล่องพิมพ์อิสระ (Textarea)</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const defaultText = buildDefaultBodyText();
                          setCustomBodyText(defaultText);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold transition cursor-pointer flex items-center gap-1"
                        title="ดึงข้อความเริ่มต้นที่รวม อายุ และ พรรษา มาใส่ในกล่อง"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                        <span>ดึงข้อความเริ่มต้น</span>
                      </button>

                      {customBodyText && (
                        <button
                          type="button"
                          onClick={() => setCustomBodyText('')}
                          className="px-2.5 py-1.5 rounded-xl bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold transition cursor-pointer"
                          title="ล้างข้อความกำหนดเอง แล้วกลับไปใช้ข้อความจัดรูปแบบเริ่มต้น"
                        >
                          ล้างกลับค่าเดิม
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleSaveCustomBodyText}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold transition cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>บันทึกเนื้อหานี้ลงในระบบ</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick-Variable Edit Inputs Bar (แทนค่าข้อมูลจากระบบด่วน: อายุ, พรรษา, ฯลฯ) */}
                  <div className="p-3 bg-white/90 backdrop-blur-xs rounded-xl border border-amber-200/90 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
                      <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                        <span>แถบแทนค่าข้อมูลตัวแปรจากระบบ (คลิกแก้ไขที่นี่ ข้อความและเอกสารจะอัปเดตทันที):</span>
                      </span>
                      <span className="text-amber-700 font-normal">
                        * ระบบตรวจจับพระภิกษุ/บรรพชิต และเปิดช่องพรรษาให้อัตโนมัติ
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Name pill */}
                      <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200 text-purple-900">
                        <span className="font-bold text-[10px] text-purple-700">👤 ชื่อ:</span>
                        <span className="font-bold">{sanitizeName(previewRequest.fullName)}</span>
                      </div>

                      {/* Age Input (อายุ) */}
                      <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300 text-amber-900 shadow-xs">
                        <span className="font-bold text-[10px] text-amber-800">🎂 อายุ:</span>
                        <input
                          type="text"
                          value={previewAge}
                          placeholder="เช่น 28"
                          onChange={(e) => {
                            const val = e.target.value;
                            setPreviewAge(val);
                            if (customBodyText) {
                              setCustomBodyText(buildDefaultBodyText(val, previewVassa));
                            }
                          }}
                          className="w-14 px-1.5 py-0.5 rounded border border-amber-300 bg-white font-bold text-center text-amber-950 outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <span className="font-medium text-amber-800">ปี</span>
                      </div>

                      {/* Vassa Input (พรรษา) — พระภิกษุ / บรรพชิต */}
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-xs transition-all ${
                        isMonastic(previewRequest.fullName) || previewVassa
                          ? 'bg-yellow-100/90 border-yellow-400 text-yellow-950 ring-1 ring-yellow-400/50'
                          : 'bg-yellow-50/60 border-yellow-200 text-yellow-800'
                      }`}>
                        <span className="font-bold text-[10px] text-yellow-800 flex items-center gap-0.5">
                          <span>☸️ พรรษา:</span>
                        </span>
                        <input
                          type="text"
                          value={previewVassa}
                          placeholder={isMonastic(previewRequest.fullName) ? 'เช่น 8' : 'ระบุพรรษา'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPreviewVassa(val);
                            if (customBodyText) {
                              setCustomBodyText(buildDefaultBodyText(previewAge, val));
                            }
                          }}
                          className="w-16 px-1.5 py-0.5 rounded border border-yellow-400 bg-white font-bold text-center text-yellow-950 outline-none focus:ring-1 focus:ring-yellow-500"
                        />
                        <span className="font-medium text-yellow-900">พรรษา</span>
                        {isMonastic(previewRequest.fullName) && (
                          <span className="text-[9px] bg-yellow-200/80 text-yellow-900 px-1 py-0.2 rounded font-bold">
                            สงฆ์
                          </span>
                        )}
                      </div>

                      {/* Nationality */}
                      <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 text-emerald-900">
                        <span className="font-bold text-[10px] text-emerald-700">🇹🇭 สัญชาติ:</span>
                        <span className="font-bold">{previewRequest.nationality || 'ไทย'}</span>
                      </div>

                      {/* Student Code */}
                      <div className="flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200 text-teal-900 font-mono">
                        <span className="font-bold text-[10px] text-teal-700 font-sans">🏷️ รหัส:</span>
                        <span className="font-bold">{fmtNum(previewRequest.studentCode)}</span>
                      </div>

                      {/* Purpose badge */}
                      <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 text-rose-900">
                        <span className="font-bold text-[10px] text-rose-700">📋 เพื่อ:</span>
                        <span className="font-bold underline">{previewRequest.requestPurpose || previewRequest.certType}</span>
                      </div>
                    </div>
                  </div>

                  {/* DISPLAY MODE 1: Smart Highlight View (แถบสีแยกแยะตัวแปรชัดเจน) */}
                  {customTextMode === 'HIGHLIGHT' ? (
                    <div className="p-4 bg-white rounded-xl border border-amber-300 shadow-inner space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold border-b pb-1.5">
                        <span className="flex items-center gap-1 text-amber-900 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ตัวอย่างข้อความพร้อมแถบสีเน้นข้อมูลตัวแปร (แสดงเฉพาะในกล่องนี้):</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          * บนเอกสาร A4 และพิมพ์จะเป็นตัวหนังสือปกติ ไม่มีแถบสี
                        </span>
                      </div>

                      <div className="leading-relaxed text-xs text-slate-800 text-justify pt-1 space-y-1">
                        <div>
                          <span>โดยหนังสือนี้ขอรับรองว่า </span>
                          {/* Name Badge */}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-300 font-bold shadow-2xs" title="ข้อมูลชื่อ-นามสกุล">
                            👤 {sanitizeName(previewRequest.fullName)}
                          </span>
                          {/* Age Badge */}
                          {previewAge && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-2xs" title="ข้อมูลอายุ (ปี)">
                              🎂 อายุ {fmtNum(previewAge)} ปี
                            </span>
                          )}
                          {/* Vassa Badge (พรรษา) */}
                          {previewVassa && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg bg-yellow-100 text-yellow-950 border border-yellow-400 font-bold shadow-2xs" title="ข้อมูลพรรษา (สำหรับบรรพชิต/พระภิกษุ)">
                              ☸️ พรรษา {fmtNum(previewVassa)}
                            </span>
                          )}
                          {/* Nationality Badge */}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold shadow-2xs" title="ข้อมูลสัญชาติ">
                            🇹🇭 สัญชาติ {previewRequest.nationality || 'ไทย'}
                          </span>
                          {previewRequest.country && previewRequest.country !== 'Thailand' && (
                            <span> ประเทศ <strong className="font-bold">{previewRequest.country}</strong> </span>
                          )}
                          {previewRequest.passportNo && (
                            <span> ถือหนังสือเดินทางเลขที่ <strong className="font-mono font-bold">{fmtNum(previewRequest.passportNo, false)}</strong> และวีซ่าประเภท <strong className="font-bold">{previewRequest.visaType || 'คนอยู่ชั่วคราว (Non-Immigrant Visa)'}</strong> </span>
                          )}
                          <span> เป็นนิสิตคณะพุทธศาสตร์ หลักสูตร</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-lg bg-sky-100 text-sky-900 border border-sky-300 font-bold shadow-2xs">
                            🎓 {previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'}
                          </span>
                          <span> (ระดับ{previewRequest.degreeLevel || 'ปริญญาตรี'} หลักสูตร {fmtNum(4)} ปี) ชั้นปีที่ </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold shadow-2xs">
                            📚 {fmtNum(previewRequest.studentCode.substring(0, 2) ? '2' : '1')}
                          </span>
                          <span> สาขาวิชา </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold shadow-2xs">
                            📖 {previewRequest.major || 'พระพุทธศาสนา'}
                          </span>
                          <span> ({previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai' ? 'ภาคภาษาไทย' : 'ภาคภาษาอังกฤษ'}) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย รหัสประจำตัวนิสิต </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-lg bg-teal-100 text-teal-900 border border-teal-300 font-mono font-bold shadow-2xs">
                            🏷️ {fmtNum(previewRequest.studentCode)}
                          </span>
                          <span> เพื่อเป็นหลักฐาน สำหรับ </span>
                          <span className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-lg bg-rose-100 text-rose-900 border border-rose-300 font-bold underline shadow-2xs">
                            📋 {previewRequest.requestPurpose || previewRequest.certType}
                          </span>
                          <span> จึงออกหนังสือนี้ไว้เป็นสำคัญ</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* DISPLAY MODE 2: Free Text Area */
                    <textarea
                      rows={4}
                      value={customBodyText}
                      onChange={(e) => setCustomBodyText(e.target.value)}
                      placeholder="พิมพ์แก้ไขหรือเพิ่มเติมข้อความเนื้อหาในหนังสือรับรองได้ที่นี่ (หากเว้นว่างไว้ ระบบจะใช้ข้อความจัดรูปแบบมาตรฐานอัตโนมัติ)"
                      className="w-full p-3 rounded-xl border border-amber-300 bg-white font-medium text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                    />
                  )}

                  <p className="text-[11px] text-amber-900 flex items-center justify-between">
                    <span>
                      💡 <b>คำแนะนำ:</b> ท่านสามารถกรอกเปลี่ยนค่าอายุหรือพรรษาด้านบนได้ทันที หรือสลับเป็นโหมดพิมพ์อิสระหากต้องการพิมพ์ประโยคพิเศษเพิ่มเติม
                    </span>
                  </p>
                </div>
              )}

              {/* Typography & Layout Spacing Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-200/60">
                {/* Font Family Selector (Official Government Fonts) */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm">
                  <Type className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-semibold text-slate-600">ฟอนต์:</span>
                  <select
                    value={docFontFamily}
                    onChange={(e) => setDocFontFamily(e.target.value)}
                    className="bg-transparent font-bold text-purple-900 focus:outline-none cursor-pointer text-xs"
                    title="เลือกฟอนต์หนังสือราชการไทยหรืออังกฤษ"
                  >
                    <optgroup label="🇹🇭 ฟอนต์ราชการไทย">
                      <option value="'Sarabun', 'TH Sarabun New', 'TH Sarabun PSK', sans-serif">
                        TH Sarabun (มาตรฐานหนังสือราชการ)
                      </option>
                      <option value="'Krub', sans-serif">Krub (ราชการทางการ)</option>
                      <option value="'Bai Jamjuree', sans-serif">Bai Jamjuree (ทางการ)</option>
                    </optgroup>
                    <optgroup label="🌐 ฟอนต์สากล / ภาษาอังกฤษ (Official EN)">
                      <option value="'Times New Roman', Times, serif">
                        Times New Roman (มาตรฐานสากล)
                      </option>
                      <option value="'Georgia', serif">Georgia (ทางการ)</option>
                      <option value="'Garamond', serif">Garamond (ทางการคลาสสิก)</option>
                      <option value="'Arial', sans-serif">Arial (สากล Clean)</option>
                    </optgroup>
                  </select>
                </div>

                {/* Title Font Size & Weight (หัวเรื่อง: หนังสือรับรอง) */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm" title="ปรับขนาดและความหนาของหัวเรื่อง (หนังสือรับรอง)">
                  <span className="font-semibold text-purple-900">หัวเรื่อง:</span>
                  <button
                    type="button"
                    onClick={() => setDocTitleFontSize((s) => Math.max(14, s - 1))}
                    className="w-5 h-5 rounded bg-purple-50 hover:bg-purple-100 font-bold text-purple-800 cursor-pointer"
                    title="ลดขนาดตัวอักษรหัวเรื่อง"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-purple-900">{docTitleFontSize}pt</span>
                  <button
                    type="button"
                    onClick={() => setDocTitleFontSize((s) => Math.min(36, s + 1))}
                    className="w-5 h-5 rounded bg-purple-50 hover:bg-purple-100 font-bold text-purple-800 cursor-pointer"
                    title="เพิ่มขนาดตัวอักษรหัวเรื่อง"
                  >
                    +
                  </button>
                  <select
                    value={docTitleFontWeight}
                    onChange={(e: any) => setDocTitleFontWeight(e.target.value)}
                    className="bg-purple-50 px-1.5 py-0.5 rounded text-xs font-bold text-purple-900 border border-purple-200 cursor-pointer focus:outline-none"
                    title="เลือกความหนาของตัวอักษรหัวเรื่อง"
                  >
                    <option value="font-normal">ปกติ (Normal)</option>
                    <option value="font-semibold">กึ่งหนา (Semibold)</option>
                    <option value="font-bold">ตัวหนา (Bold)</option>
                    <option value="font-black">หนาพิเศษ (Extra Bold)</option>
                  </select>
                </div>

                {/* Font Size (Content & ที่ อว) */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm" title="ขนาดตัวอักษรเนื้อหา และ ที่ อว (ปรับเท่ากัน)">
                  <span className="font-semibold text-slate-600">ขนาดเนื้อหา & ที่ อว:</span>
                  <button
                    type="button"
                    onClick={() => setDocFontSize((s) => Math.max(11, s - 1))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                    title="ลดขนาดตัวอักษรเนื้อหาและที่ อว"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-bold text-purple-800">{docFontSize}pt</span>
                  <button
                    type="button"
                    onClick={() => setDocFontSize((s) => Math.min(24, s + 1))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                    title="เพิ่มขนาดตัวอักษรเนื้อหาและที่ อว"
                  >
                    +
                  </button>
                </div>

                {/* Signer Font Size (สีน้ำเงิน) */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-blue-200 shadow-sm" title="ขนาดตัวอักษรผู้ลงนามและตำแหน่ง (สีน้ำเงิน)">
                  <span className="font-semibold text-blue-700">ขนาดผู้ลงนาม:</span>
                  <button
                    type="button"
                    onClick={() => setSignerFontSize((s) => Math.max(9, s - 1))}
                    className="w-5 h-5 rounded bg-blue-50 hover:bg-blue-100 font-bold text-blue-800 cursor-pointer"
                    title="ลดขนาดตัวอักษรชื่อและตำแหน่งผู้ลงนาม"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-bold text-blue-900">{signerFontSize}pt</span>
                  <button
                    type="button"
                    onClick={() => setSignerFontSize((s) => Math.min(22, s + 1))}
                    className="w-5 h-5 rounded bg-blue-50 hover:bg-blue-100 font-bold text-blue-800 cursor-pointer"
                    title="เพิ่มขนาดตัวอักษรชื่อและตำแหน่งผู้ลงนาม"
                  >
                    +
                  </button>
                </div>

                {/* Line Spacing */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm">
                  <MoveVertical className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-semibold text-slate-600">ระยะบรรทัด:</span>
                  <select
                    value={docLineSpacing}
                    onChange={(e) => setDocLineSpacing(parseFloat(e.target.value))}
                    className="bg-transparent font-bold text-purple-800 focus:outline-none cursor-pointer"
                  >
                    <option value={1.3}>1.3 (แน่น)</option>
                    <option value={1.5}>1.5 (มาตรฐาน)</option>
                    <option value={1.7}>1.7 (โปร่ง)</option>
                    <option value={2.0}>2.0 (กว้าง)</option>
                  </select>
                </div>

                {/* Signature Vertical Offset */}
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm">
                  <span className="font-semibold text-slate-600">ขยับลายเซ็น:</span>
                  <button
                    type="button"
                    onClick={() => setDocSignerOffset((o) => Math.max(0, o - 10))}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
                    title="เลื่อนบล็อกลายเซ็นขึ้น"
                  >
                    ⬆ ขึ้น
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocSignerOffset((o) => Math.min(120, o + 10))}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
                    title="เลื่อนบล็อกลายเซ็นลง"
                  >
                    ⬇ ลง
                  </button>
                </div>

                {/* Header & Title Spacing (เว้นช่องใส่ตรา 1-2 นิ้ว หรือแบบฟอร์มกระดาษราชการ) */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-sky-200 shadow-sm text-xs" title="ปรับระยะห่างความสูงระหว่าง ที่ อว กับ หนังสือรับรอง เพื่อเว้นช่องใส่ตรา 1-2 นิ้ว หรือแบบฟอร์มสำเร็จรูปของหน่วยงาน">
                  <span className="font-semibold text-sky-800">เว้นช่องตรา (ที่ อว ↔ ชื่อเรื่อง):</span>
                  <button
                    type="button"
                    onClick={() => setHeaderTitleSpacing((s) => Math.max(0, s - 10))}
                    className="w-5 h-5 rounded bg-sky-50 hover:bg-sky-100 font-bold text-sky-800 flex items-center justify-center cursor-pointer"
                    title="ลดระยะห่าง (-10px)"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-bold text-sky-900 min-w-16 text-center">
                    {headerTitleSpacing}px {headerTitleSpacing >= 180 ? '(~2 นิ้ว)' : headerTitleSpacing >= 135 ? '(~1.5 นิ้ว)' : headerTitleSpacing >= 90 ? '(~1 นิ้ว)' : headerTitleSpacing === 24 ? '(ปกติ)' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHeaderTitleSpacing((s) => Math.min(260, s + 10))}
                    className="w-5 h-5 rounded bg-sky-50 hover:bg-sky-100 font-bold text-sky-800 flex items-center justify-center cursor-pointer"
                    title="เพิ่มระยะห่าง (+10px)"
                  >
                    +
                  </button>
                  
                  {/* Preset shortcut chips */}
                  <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-200">
                    <button
                      type="button"
                      onClick={() => setHeaderTitleSpacing(24)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        headerTitleSpacing === 24 ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="ระยะมาตรฐาน (24px)"
                    >
                      ปกติ
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeaderTitleSpacing(96)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        headerTitleSpacing === 96 ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="เว้นช่องตรา 1 นิ้ว (96px)"
                    >
                      1 นิ้ว
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeaderTitleSpacing(144)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        headerTitleSpacing === 144 ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="เว้นช่องตรา 1.5 นิ้ว (144px)"
                    >
                      1.5 นิ้ว
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeaderTitleSpacing(192)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        headerTitleSpacing === 192 ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="เว้นช่องตรา 2 นิ้ว (192px)"
                    >
                      2 นิ้ว
                    </button>
                  </div>
                </div>

                {/* Top Margin (เว้นหัวกระดาษแบบฟอร์มหน่วยงาน) */}
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-sky-200 shadow-sm text-xs" title="ขยับ ที่ อว ลงเพื่อเว้นหัวกระดาษที่มีข้อความแบบฟอร์มพิมพ์ไว้แล้ว">
                  <span className="font-semibold text-slate-600">ขยับ ที่ อว ลง:</span>
                  <button
                    type="button"
                    onClick={() => setHeaderTopSpacing((t) => Math.max(0, t - 10))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                    title="ลดระยะหัวกระดาษ (-10px)"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-bold text-slate-800 w-8 text-center">
                    {headerTopSpacing}px
                  </span>
                  <button
                    type="button"
                    onClick={() => setHeaderTopSpacing((t) => Math.min(150, t + 10))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                    title="เพิ่มระยะหัวกระดาษ (+10px)"
                  >
                    +
                  </button>
                </div>

                {/* Photo Box Shift (กรอบรูป เลื่อนขวา/ซ้าย) */}
                {showPhotoBox && (
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-rose-200 shadow-sm" title="ขยับกรอบรูปไปทางขวาหรือซ้าย">
                    <span className="font-semibold text-rose-700">กรอบรูป:</span>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX((x) => Math.max(0, x - 20))}
                      className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 font-bold text-xs text-rose-800 cursor-pointer"
                      title="เลื่อนกรอบรูปไปทางซ้าย"
                    >
                      ◀ ซ้าย
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX(0)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                        photoBoxOffsetX === 0 ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-700'
                      }`}
                      title="ชิดซ้าย"
                    >
                      ชิดซ้าย
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX(100)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                        photoBoxOffsetX === 100 ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-700'
                      }`}
                      title="กึ่งกลาง"
                    >
                      กลาง
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX((x) => Math.min(300, x + 20))}
                      className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 font-bold text-xs text-rose-800 cursor-pointer"
                      title="เลื่อนกรอบรูปไปทางขวา"
                    >
                      ขวา ▶
                    </button>
                    <span className="text-[10px] text-rose-600 font-mono">({photoBoxOffsetX}px)</span>
                  </div>
                )}

                {/* Dots Length (ความยาวจุดไข่ปลา) */}
                {showStudentSign && (
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-amber-200 shadow-sm" title="ปรับความยาวจุดไข่ปลาให้สั้นลงหรือยาวขึ้น">
                    <span className="font-semibold text-amber-800">จุดไข่ปลา:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomStudentDots('');
                        setDotsCount((d) => Math.max(0, d - 2));
                      }}
                      className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 font-bold text-xs text-amber-900 cursor-pointer"
                      title="ลดความยาวจุดไข่ปลา (ลบออก)"
                    >
                      - สั้นลง
                    </button>
                    <span className="w-8 text-center font-bold text-amber-900 font-mono text-xs">{dotsCount} จุด</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomStudentDots('');
                        setDotsCount((d) => Math.min(55, d + 2));
                      }}
                      className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 font-bold text-xs text-amber-900 cursor-pointer"
                      title="เพิ่มความยาวจุดไข่ปลา"
                    >
                      + ยาวขึ้น
                    </button>
                  </div>
                )}

                {/* Custom Student Signature Name Input */}
                {showStudentSign && (
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-indigo-200 shadow-sm text-xs" title="แก้ไขข้อความชื่อ-นามสกุล ใต้ลายเซ็นนิสิต">
                    <span className="font-semibold text-indigo-700">ชื่อใต้ลายเซ็น:</span>
                    <input
                      type="text"
                      value={customStudentSignName}
                      onChange={(e) => setCustomStudentSignName(e.target.value)}
                      placeholder="ชื่อ-นามสกุลนิสิต"
                      className="px-2 py-0.5 rounded border border-indigo-200 text-xs text-indigo-950 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-400 w-44"
                    />
                  </div>
                )}

                {/* Student Name Font Size (ขนาดชื่อนิสิต) */}
                {showStudentSign && (
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-indigo-200 shadow-sm" title="ขนาดตัวอักษรชื่อ-นามสกุลนิสิต">
                    <span className="font-semibold text-indigo-700">ขนาดชื่อนิสิต:</span>
                    <button
                      type="button"
                      onClick={() => setStudentSignFontSize((s) => Math.max(9, s - 1))}
                      className="w-5 h-5 rounded bg-indigo-50 hover:bg-indigo-100 font-bold text-indigo-800 cursor-pointer"
                      title="ลดขนาดตัวอักษรชื่อ-นามสกุล"
                    >
                      -
                    </button>
                    <span className="w-7 text-center font-bold text-indigo-900">{studentSignFontSize}pt</span>
                    <button
                      type="button"
                      onClick={() => setStudentSignFontSize((s) => Math.min(24, s + 1))}
                      className="w-5 h-5 rounded bg-indigo-50 hover:bg-indigo-100 font-bold text-indigo-800 cursor-pointer"
                      title="เพิ่มขนาดตัวอักษรชื่อ-นามสกุล"
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Student Signature (Name) Shift */}
                {showStudentSign && (
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm text-xs">
                    <span className="font-semibold text-slate-600">ตำแหน่ง (ชื่อ):</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSignAlign('left');
                        setStudentSignOffsetX(0);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                        studentSignAlign === 'left' && studentSignOffsetX === 0
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="จัดชิดซ้ายของจุดไข่ปลา"
                    >
                      ◀ ซ้าย
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSignAlign('center');
                        setStudentSignOffsetX(0);
                      }}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                        studentSignAlign === 'center' && studentSignOffsetX === 0
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="จัดกึ่งกลางของจุดไข่ปลา"
                    >
                      กึ่งกลาง
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSignAlign('right');
                        setStudentSignOffsetX(0);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                        studentSignAlign === 'right' && studentSignOffsetX === 0
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="จัดชิดขวาของจุดไข่ปลา"
                    >
                      ขวา ▶
                    </button>
                    {/* Fine-tuning offset nudge */}
                    <div className="flex items-center gap-0.5 ml-1 pl-1.5 border-l border-slate-200">
                      <button
                        type="button"
                        onClick={() => setStudentSignOffsetX((x) => x - 5)}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                        title="ขยับละเอียดไปทางซ้าย (-5px)"
                      >
                        -
                      </button>
                      <span className="font-mono text-[10px] text-slate-500 w-8 text-center" title="ระยะขยับละเอียด (px)">
                        {studentSignOffsetX > 0 ? `+${studentSignOffsetX}` : studentSignOffsetX}px
                      </span>
                      <button
                        type="button"
                        onClick={() => setStudentSignOffsetX((x) => x + 5)}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                        title="ขยับละเอียดไปทางขวา (+5px)"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Toggle Elements */}
                <div className="flex flex-wrap items-center gap-2.5 bg-white px-3 py-1.5 rounded-xl border border-purple-200 shadow-sm text-xs">
                  {/* Thai Numerals Toggle */}
                  {previewTemplate !== 'ENG_CERT' && (
                    <label className="flex items-center gap-1.5 font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg shadow-xs cursor-pointer hover:bg-indigo-100 transition" title="แปลงตัวเลขทั้งหมดในหนังสือเป็นตัวเลขไทย (๑ ๒ ๓ ๔) ตามระเบียบสารบรรณ">
                      <input
                        type="checkbox"
                        checked={useThaiNumerals}
                        onChange={(e) => setUseThaiNumerals(e.target.checked)}
                        className="rounded text-indigo-600 cursor-pointer"
                      />
                      <span>🇹🇭 เลขไทย (๑ ๒ ๓)</span>
                    </label>
                  )}

                  {/* Signer Organization Toggle & Text Edit */}
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200" title="เปิด/ปิด หรือแก้ไขชื่อคณะ/มหาวิทยาลัย ใต้ตำแหน่งผู้ลงนาม">
                    <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSignerOrg}
                        onChange={(e) => setShowSignerOrg(e.target.checked)}
                        className="rounded text-purple-600 cursor-pointer"
                      />
                      <span>แสดงสังกัดท้ายลายเซ็น</span>
                    </label>
                    {showSignerOrg && (
                      <input
                        type="text"
                        placeholder="แก้ไขสังกัด (ค่าเริ่มต้น: คณะ... มจร.)"
                        value={signerOrgCustomText}
                        onChange={(e) => setSignerOrgCustomText(e.target.value)}
                        className="px-2 py-0.5 rounded border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-400 w-48"
                      />
                    )}
                  </div>

                  <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPhotoBox}
                      onChange={(e) => setShowPhotoBox(e.target.checked)}
                      className="rounded text-purple-600 cursor-pointer"
                    />
                    <span>กรอบรูป 1.5 - 2&quot;</span>
                  </label>
                  <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showStudentSign}
                      onChange={(e) => setShowStudentSign(e.target.checked)}
                      className="rounded text-purple-600 cursor-pointer"
                    />
                    <span>ลายเซ็นนิสิต</span>
                  </label>
                  <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showQrCode}
                      onChange={(e) => setShowQrCode(e.target.checked)}
                      className="rounded text-purple-600 cursor-pointer"
                    />
                    <span>QR Code</span>
                  </label>
                </div>
              </div>

              <div className="text-[11px] text-amber-800 bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span><b>คำแนะนำ:</b> ท่านสามารถใช้เมาส์คลิกที่ข้อความใดๆ ในเอกสารด้านล่างนี้ เพื่อพิมพ์แก้ไขคำ เปลี่ยนชื่อธนาคาร หรือพิมพ์/ลบจุดไข่ปลาได้ทันทีก่อนสั่งพิมพ์หรือดาวน์โหลด PDF</span>
              </div>
            </div>

            {/* Official Paper Letter Canvas Desk Wrapper (Exact A4 210mm x 297mm Layout) */}
            <div className="w-full overflow-x-auto bg-slate-200/60 p-4 sm:p-8 rounded-2xl flex justify-center border border-slate-200">
              <div
                id="printable-certificate"
                style={{
                  fontFamily: docFontFamily,
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '25mm 20mm 15mm 25mm',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                }}
                className="bg-white border border-slate-300 shadow-2xl text-slate-900 shrink-0 print:border-none print:shadow-none print:m-0"
              >
              {/* TEMPLATE 1: BANK_LETTER (หนังสือขอความอนุเคราะห์ธนาคาร หน้า 1) */}
              {previewTemplate === 'BANK_LETTER' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
                    {/* Top Reference */}
                    <div className="flex justify-between items-start pb-2" style={{ fontSize: `${docFontSize}pt` }}>
                      <div className="flex items-center gap-1 font-bold outline-none text-slate-900">
                        <span>ที่ อว {fmtNum(docNoPrefix || '8002')} / </span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const text = e.currentTarget.textContent?.trim() || '';
                            if (text) setDocNoInputModal(text);
                          }}
                          className="border-b border-dashed border-indigo-400 min-w-16 px-1 hover:bg-indigo-50 focus:bg-purple-50 focus:border-indigo-600 focus:outline-none transition cursor-text"
                          title="คลิกเพื่อแก้ไขหรือพิมพ์เลขที่หนังสือได้โดยตรง"
                        >
                          {fmtNum(docNoInputModal || previewRequest.docNo || '077')}
                        </span>
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-right outline-none focus:bg-purple-50">
                        {fmtNum(new Date(previewRequest.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }))}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2" style={{ fontSize: `${docFontSize}pt` }}>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        <span className="font-bold">เรื่อง</span> ขอความอนุเคราะห์อัพเดตการใช้ Mobile Banking ให้แก่นิสิต / เปิดบัญชีธนาคาร
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        <span className="font-bold">เจริญพร</span> ผู้จัดการธนาคารกรุงไทย สาขาโลตัส นวนคร
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        <span className="font-bold">สิ่งที่ส่งมาด้วย</span> หนังสือรับรองนิสิต จำนวน {fmtNum(1)} ฉบับ
                      </div>
                    </div>

                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="indent-8 outline-none focus:bg-purple-50 pt-2 text-justify font-normal text-slate-900"
                      style={{ fontSize: `${docFontSize}pt`, lineHeight: docLineSpacing }}
                    >
                      เนื่องด้วย <strong className="font-bold">{sanitizeName(previewRequest.fullName)}</strong> สัญชาติ{' '}
                      <strong className="font-bold">{previewRequest.nationality || 'Bangladeshi'}</strong> ประเทศ{' '}
                      <strong className="font-bold">{previewRequest.country || 'Bangladesh'}</strong>{' '}
                      {previewRequest.passportNo && (
                        <>ถือหนังสือเดินทางเลขที่ <strong className="font-mono font-bold">{fmtNum(previewRequest.passportNo, false)}</strong> </>
                      )}
                      รหัสนิสิต <strong className="font-mono font-bold">{fmtNum(previewRequest.studentCode)}</strong> เป็นนิสิตหลักสูตร
                      <strong className="font-bold">{previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'}</strong> (ระดับ<strong className="font-bold">{previewRequest.degreeLevel || 'ปริญญาตรี'}</strong> หลักสูตร {fmtNum(4)} ปี) ชั้นปีที่{' '}
                      <strong className="font-bold">{fmtNum(previewRequest.studentCode.substring(0, 2) ? '1' : '1')}</strong> สาขาวิชา<strong className="font-bold">{previewRequest.major || 'พระพุทธศาสนา'}</strong> (<strong className="font-bold">ภาคภาษาอังกฤษ</strong>)
                      คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย มีความประสงค์จะทำธุรกรรมกับธนาคาร เพื่ออำนวยความสะดวกในการทำธุรกรรมกับมหาวิทยาลัยในระหว่างที่กำลังศึกษาอยู่ในภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา
                    </p>

                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="indent-8 outline-none focus:bg-purple-50 font-normal"
                      style={{ fontSize: `${docFontSize}pt` }}
                    >
                      จึงเจริญพรมาเพื่อให้ความอนุเคราะห์ในเรื่องการเปิดบัญชีหรืออัพเดตการใช้งานแอปพลิเคชั่นของธนาคารแก่นิสิตดังกล่าว จักขอบคุณยิ่ง
                    </p>

                    <div
                      className="pt-6 text-center ml-auto w-72 space-y-1"
                      style={{
                        marginTop: `${docSignerOffset}px`,
                        fontSize: `${signerFontSize}pt`,
                      }}
                    >
                      <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                        ขอเจริญพร
                      </div>
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                        ({customSigner.name || 'พระครูสิริรัตนบัณฑิต, ผศ.ดร.'})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        {customSigner.title || 'รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์'}
                      </div>
                      {showSignerOrg && (
                        <div contentEditable suppressContentEditableWarning className="text-slate-600 outline-none focus:bg-purple-50">
                          {signerOrgCustomText || settings.universityNameTh}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Footer (ชิดล่างสุดของเอกสาร) */}
                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">ติดต่อผู้ประสานงาน:</p>
                      <p>{settings.facultyNameTh ? `สำนักงาน${settings.facultyNameTh}` : 'สำนักงานคณะพุทธศาสตร์'}</p>
                      <p>โทร. {settings.contactPhone || '035-247-8000 ต่อ 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-1">
                      <div contentEditable suppressContentEditableWarning className="text-[11px] font-medium text-slate-700 outline-none focus:bg-purple-50 px-1.5 py-0.5 rounded">
                        ผู้ออกเอกสารหรือปริ้นเอกสาร : <span className="font-bold text-slate-900">{currentUser?.name || 'อาจารย์ไพศาล (ผู้ดูแลระบบ)'}</span>
                      </div>
                      {showQrCode && qrCodeDataUrl && (
                        <img src={qrCodeDataUrl} alt="Verify" className="w-14 h-14 object-contain" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 2: ENG_CERT (TO WHOM IT MAY CONCERN หน้า PDF 2) */}
              {previewTemplate === 'ENG_CERT' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
                    {/* Top Left Office Header - Top Right is clean/empty */}
                    <div
                      className="flex justify-between items-start pb-2 transition-all"
                      style={{
                        marginTop: `${headerTopSpacing}px`,
                        fontSize: `${docFontSize}pt`,
                      }}
                    >
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 space-y-0.5">
                        <p className="font-bold text-slate-900">Office of Dean</p>
                        <p>Tel. {settings.contactPhone || '0-3524-8000 ext. 8323'}</p>
                        <p>Fax. 0-3524-8096</p>
                        <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                        <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                        <p className="font-mono font-bold pt-1 text-slate-900 flex items-center gap-1">
                          <span>MCU No. {docNoPrefix || '8002'} / </span>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const text = e.currentTarget.textContent?.trim() || '';
                              if (text) setDocNoInputModal(text);
                            }}
                            className="border-b border-dashed border-indigo-400 min-w-16 px-1 hover:bg-indigo-50 focus:bg-purple-50 focus:outline-none transition cursor-text"
                            title="Click to edit document number directly"
                          >
                            {docNoInputModal || previewRequest.docNo || '166'}
                          </span>
                        </p>
                      </div>
                      <div></div>
                    </div>

                    {/* Centered Title with customizable vertical spacing */}
                    <div
                      className="pb-2 text-center transition-all"
                      style={{ paddingTop: `${headerTitleSpacing}px` }}
                    >
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        className={`${docTitleFontWeight} tracking-wider outline-none focus:bg-purple-50`}
                        style={{ fontSize: `${docTitleFontSize}pt` }}
                      >
                        TO WHOM IT MAY CONCERN
                      </span>
                    </div>

                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="indent-8 outline-none focus:bg-purple-50 pt-2 leading-relaxed text-justify"
                      style={{ fontSize: `${docFontSize}pt`, lineHeight: docLineSpacing }}
                    >
                      This is to certify that <strong className="font-bold">{previewRequest.fullName}</strong>, whose age is{' '}
                      <strong className="font-bold">{previewRequest.age || '29'}</strong> years old,{' '}
                      <strong className="font-bold">{previewRequest.nationality || 'Myanmar'}</strong> Nationality, holding Passport No.{' '}
                      <strong className="font-mono font-bold">{previewRequest.passportNo || 'MF772427'}</strong>, is currently enrolled as a student of the Faculty of Buddhism, Mahachulalongkornrajavidyalaya University, Lamsai Sub-District, Wangnoi District, Phra Nakhon Si Ayutthaya Province, 13170, Thailand. He/She is studying in the {previewRequest.degreeLevel || 'Bachelor of Arts Program (4-Year Undergraduate Program)'}, Major in {previewRequest.major || 'Religion and Philosophy (English Program)'}, Year 4, in the second semester of an Academic Year 2026, His/Her student identification is <strong className="font-mono font-bold">{previewRequest.studentCode}</strong>.
                    </p>

                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="indent-8 outline-none focus:bg-purple-50"
                      style={{ fontSize: `${docFontSize}pt` }}
                    >
                      This letter of certification is therefore issued as evidence.
                    </p>

                    <div
                      contentEditable
                      suppressContentEditableWarning
                      className="text-center pt-2 outline-none focus:bg-purple-50"
                      style={{ fontSize: `${docFontSize}pt` }}
                    >
                      Issued on {new Date(previewRequest.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>

                    {/* 1. Dean / Authorized Signer Block: ABOVE the photo box, on the right (Adjustable font size) */}
                    <div
                      className="pt-6 ml-auto w-80 text-center space-y-1"
                      style={{
                        marginTop: `${docSignerOffset}px`,
                        fontSize: `${signerFontSize}pt`,
                      }}
                    >
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold text-slate-900 outline-none focus:bg-purple-50">
                        ({customSigner.name ? customSigner.name : 'Asst. Prof. Phrakhru Sirirattanabundit, Ph.D.'})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-800 font-medium outline-none focus:bg-purple-50">
                        {customSigner.title ? customSigner.title : 'Vice Dean, Faculty of Buddhism'}
                      </div>
                      {showSignerOrg && (
                        <div contentEditable suppressContentEditableWarning className="text-slate-600 outline-none focus:bg-purple-50">
                          {signerOrgCustomText || 'Mahachulalongkornrajavidyalaya University'}
                        </div>
                      )}
                    </div>

                    {/* 2. Photo Box & Student Signature: BELOW Dean signature, on the left */}
                    <div className="pt-2 flex items-end justify-between">
                      <div className="space-y-3">
                        {showPhotoBox && (
                          <div
                            className="w-28 h-36 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs p-2 text-center bg-slate-50/20 transition-transform"
                            style={{ transform: `translateX(${photoBoxOffsetX}px)` }}
                          >
                            <span>ติดรูปถ่าย<br />Photo 1.5 - 2&quot;</span>
                          </div>
                        )}
                        {showStudentSign && (
                          <div className="pt-1 inline-flex flex-col">
                            <div className="flex items-baseline gap-1 text-slate-800" style={{ fontSize: `${Math.max(11, docFontSize - 2)}pt` }}>
                              <span className="shrink-0 font-medium">Signature</span>
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => setCustomStudentDots(e.currentTarget.textContent || '')}
                                className="tracking-wider font-mono outline-none focus:bg-purple-50 select-text"
                                title="คลิกเพื่อลบ พิมพ์ หรือแก้ไขจุดไข่ปลาได้อิสระ"
                              >
                                {customStudentDots !== '' ? customStudentDots : '.'.repeat(dotsCount)}
                              </span>
                            </div>
                            <div
                              className="w-full flex"
                              style={{
                                justifyContent:
                                  studentSignAlign === 'left'
                                    ? 'flex-start'
                                    : studentSignAlign === 'right'
                                    ? 'flex-end'
                                    : 'center',
                              }}
                            >
                              <div
                                style={{
                                  transform: `translateX(${studentSignOffsetX}px)`,
                                  fontSize: `${studentSignFontSize}pt`,
                                  whiteSpace: 'nowrap',
                                }}
                                className="mt-1 font-bold text-slate-900 transition-all outline-none focus:bg-purple-50 whitespace-nowrap cursor-text"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  const raw = e.currentTarget.textContent || '';
                                  setCustomStudentSignName(raw.replace(/[()]/g, '').trim());
                                }}
                                title="คลิกเพื่อแก้ไขชื่อ-นามสกุลได้โดยตรง"
                              >
                                ({sanitizeName(customStudentSignName || previewRequest.fullName)})
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Bottom Footer (ชิดล่างสุดของเอกสาร) */}
                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">{settings.facultyNameEn ? `Faculty of ${settings.facultyNameEn.replace(/^Faculty of /i, '')}` : 'Faculty of Buddhism'}</p>
                      <p>Tel. {settings.contactPhone ? `+66 ${settings.contactPhone.replace(/^0/, '')}` : '+66 35 248 000 ext. 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-1">
                      <div contentEditable suppressContentEditableWarning className="text-[11px] font-medium text-slate-700 outline-none focus:bg-purple-50 px-1.5 py-0.5 rounded">
                        ผู้ออกเอกสารหรือปริ้นเอกสาร : <span className="font-bold text-slate-900">{currentUser?.name || 'Academic Officer'}</span>
                      </div>
                      {showQrCode && qrCodeDataUrl && (
                        <img src={qrCodeDataUrl} alt="QR" className="w-14 h-14 object-contain" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 3: INTERNAL_MEMO (บันทึกข้อความราชการ หน้า 10) */}
              {previewTemplate === 'INTERNAL_MEMO' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
                    {/* Garuda Crest & Heading */}
                    <div className="flex items-center gap-4 border-b pb-3">
                      <div className="w-14 h-14 rounded-full bg-slate-50 border flex items-center justify-center p-1 overflow-hidden shrink-0">
                        <span className="text-3xl">🦅</span>
                      </div>
                      <div className="text-center flex-1">
                        <h2 className="text-2xl font-black tracking-wide">บันทึกข้อความ</h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-b pb-3 pt-2">
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        <span className="font-bold">ส่วนงาน:</span> {settings.facultyNameTh} {settings.universityNameTh} โทร. {settings.contactPhone}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-right outline-none focus:bg-purple-50">
                        <span className="font-bold">วันที่:</span> {fmtNum(new Date(previewRequest.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }))}
                      </div>
                      <div className="flex items-center gap-1 font-bold outline-none text-slate-900">
                        <span>ที่: อว {fmtNum(docNoPrefix || '8002')} / </span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const text = e.currentTarget.textContent?.trim() || '';
                            if (text) setDocNoInputModal(text);
                          }}
                          className="border-b border-dashed border-indigo-400 min-w-16 px-1 hover:bg-indigo-50 focus:bg-purple-50 focus:border-indigo-600 focus:outline-none transition cursor-text"
                          title="คลิกเพื่อแก้ไขหรือพิมพ์เลขที่หนังสือได้โดยตรง"
                        >
                          {fmtNum(docNoInputModal || previewRequest.docNo || 'xxx')}
                        </span>
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        <span className="font-bold">เรื่อง:</span> ขอความอนุเคราะห์ออกหนังสือรับรองให้แก่นิสิต
                      </div>
                    </div>

                    <div contentEditable suppressContentEditableWarning className="font-bold text-xs pt-1 outline-none focus:bg-purple-50">
                      เรียน ผู้อำนวยการกองกิจการนิสิต / คณบดีคณะพุทธศาสตร์
                    </div>

                    <p contentEditable suppressContentEditableWarning className="indent-8 outline-none focus:bg-purple-50 pt-2 leading-relaxed font-normal text-slate-900">
                      ด้วย <strong className="font-bold">{sanitizeName(previewRequest.fullName)}</strong> รหัสนิสิต <strong className="font-mono font-bold">{fmtNum(previewRequest.studentCode)}</strong> {previewAge && <>อายุ <strong className="font-bold">{fmtNum(previewAge)}</strong> ปี </>}{previewVassa && <>พรรษา <strong className="font-bold">{fmtNum(previewVassa)}</strong> </>}สัญชาติ <strong className="font-bold">{previewRequest.nationality || '-'}</strong> {previewRequest.passportNo && <>ถือหนังสือเดินทางเลขที่ <strong className="font-mono font-bold">{fmtNum(previewRequest.passportNo, false)}</strong></>} เป็นนิสิตคณะพุทธศาสตร์ หลักสูตร<strong className="font-bold">{previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'}</strong> สาขาวิชา<strong className="font-bold">{previewRequest.major || 'พระพุทธศาสนา'}</strong> ได้ยื่นคำร้องเพื่อขอรับรอง<strong className="font-bold">{previewRequest.requestPurpose || previewRequest.certType}</strong>
                    </p>

                    <p contentEditable suppressContentEditableWarning className="indent-8 outline-none focus:bg-purple-50 font-normal">
                      ในการนี้ คณะพุทธศาสตร์ จึงขอความอนุเคราะห์ในการออกหนังสือรับรองให้แก่นิสิตดังกล่าว เพื่อเป็นเอกสารประกอบการดำเนินการต่อไป
                    </p>

                    <p contentEditable suppressContentEditableWarning className="indent-8 outline-none focus:bg-purple-50 font-normal">
                      จึงเรียนมาเพื่อโปรดทราบและดำเนินการต่อไป
                    </p>

                    <div
                      className="pt-6 text-center ml-auto w-72 space-y-1"
                      style={{
                        marginTop: `${docSignerOffset}px`,
                        fontSize: `${signerFontSize}pt`,
                      }}
                    >
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                        ({customSigner.name || 'พระครูสิริรัตนบัณฑิต, ผศ.ดร.'})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        {customSigner.title || 'รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์'}
                      </div>
                      {showSignerOrg && (
                        <div contentEditable suppressContentEditableWarning className="text-slate-600 outline-none focus:bg-purple-50">
                          {signerOrgCustomText || `${settings.facultyNameTh} ${settings.universityNameTh}`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Footer */}
                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">{settings.facultyNameTh ? `สำนักงาน${settings.facultyNameTh}` : 'สำนักงานคณะพุทธศาสตร์'}</p>
                      <p>โทรศัพท์ {settings.contactPhone || '035-247-8000 ต่อ 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-1">
                      <div contentEditable suppressContentEditableWarning className="text-[11px] font-medium text-slate-700 outline-none focus:bg-purple-50 px-1.5 py-0.5 rounded">
                        ผู้ออกเอกสารหรือปริ้นเอกสาร : <span className="font-bold text-slate-900">{currentUser?.name || 'อาจารย์ไพศาล (ผู้ดูแลระบบ)'}</span>
                      </div>
                      {showQrCode && qrCodeDataUrl && (
                        <img src={qrCodeDataUrl} alt="QR Code" className="w-14 h-14 object-contain" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 4: THAI_STANDARD (หนังสือรับรองนิสิตมาตรฐานภาษาไทย หน้า 2-9) */}
              {previewTemplate === 'THAI_STANDARD' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header Reference: ที่ อว 8002 / docNo with same docFontSize */}
                    <div
                      className="flex justify-between items-start pb-2 transition-all"
                      style={{
                        marginTop: `${headerTopSpacing}px`,
                        fontSize: `${docFontSize}pt`,
                      }}
                    >
                      <div className="flex items-center gap-1 font-normal outline-none text-slate-900">
                        <span className="font-normal">ที่ อว {fmtNum(docNoPrefix || '8002')} / </span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const text = e.currentTarget.textContent?.trim() || '';
                            if (text) setDocNoInputModal(text);
                          }}
                          className="font-bold border-b border-dashed border-indigo-400 min-w-16 px-1 hover:bg-indigo-50 focus:bg-purple-50 focus:border-indigo-600 focus:outline-none transition cursor-text"
                          title="คลิกเพื่อแก้ไขหรือพิมพ์เลขที่หนังสือได้โดยตรง"
                        >
                          {fmtNum(docNoInputModal || previewRequest.docNo || 'xxx')}
                        </span>
                      </div>
                      {/* Top right removed as requested */}
                      <div></div>
                    </div>

                    {/* Title with customizable vertical spacing (เว้นช่องใส่ตรา 1-2 นิ้ว หรือแบบฟอร์มสำเร็จรูป) */}
                    <div
                      className="pb-2 text-center transition-all"
                      style={{ paddingTop: `${headerTitleSpacing}px` }}
                    >
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        className={`${docTitleFontWeight} tracking-wide outline-none focus:bg-purple-50`}
                        style={{ fontSize: `${docTitleFontSize}pt` }}
                      >
                        หนังสือรับรอง
                      </span>
                    </div>

                    {/* Body Paragraph: Font size matches ที่ อว, text-justify */}
                    {customBodyText ? (
                      <p
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setCustomBodyText(e.currentTarget.textContent || '')}
                        className="indent-10 leading-relaxed outline-none focus:bg-purple-50 pt-2 text-justify font-normal text-slate-900"
                        style={{ fontSize: `${docFontSize}pt`, lineHeight: docLineSpacing }}
                      >
                        {customBodyText}
                      </p>
                    ) : (
                      <p
                        contentEditable
                        suppressContentEditableWarning
                        className="indent-10 leading-relaxed outline-none focus:bg-purple-50 pt-2 text-justify font-normal text-slate-900"
                        style={{ fontSize: `${docFontSize}pt`, lineHeight: docLineSpacing }}
                      >
                        โดยหนังสือนี้ขอรับรองว่า <strong className="font-bold">{sanitizeName(previewRequest.fullName)}</strong>{' '}
                        {previewAge && (
                          <>อายุ <strong className="font-bold">{fmtNum(previewAge)}</strong> ปี </>
                        )}
                        {previewVassa && (
                          <>พรรษา <strong className="font-bold">{fmtNum(previewVassa)}</strong> </>
                        )}
                        สัญชาติ <strong className="font-bold">{previewRequest.nationality || 'ไทย'}</strong>{' '}
                        {previewRequest.country && previewRequest.country !== 'Thailand' && (
                          <>ประเทศ <strong className="font-bold">{previewRequest.country}</strong> </>
                        )}
                        {previewRequest.passportNo && (
                          <>ถือหนังสือเดินทางเลขที่ <strong className="font-mono font-bold">{fmtNum(previewRequest.passportNo, false)}</strong> และวีซ่าประเภท <strong className="font-bold">{previewRequest.visaType || 'คนอยู่ชั่วคราว (Non-Immigrant Visa)'}</strong> </>
                        )}
                        เป็นนิสิตคณะพุทธศาสตร์ หลักสูตร<strong className="font-bold">{previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'}</strong>{' '}
                        (ระดับ<strong className="font-bold">{previewRequest.degreeLevel || 'ปริญญาตรี'}</strong> หลักสูตร {fmtNum(4)} ปี) ชั้นปีที่{' '}
                        <strong className="font-bold">{fmtNum(previewRequest.studentCode.substring(0, 2) ? '2' : '1')}</strong> สาขาวิชา <strong className="font-bold">{previewRequest.major || 'พระพุทธศาสนา'}</strong>{' '}
                        (<strong className="font-bold">{previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai' ? 'ภาคภาษาไทย' : 'ภาคภาษาอังกฤษ'}</strong>) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย รหัสประจำตัวนิสิต{' '}
                        <strong className="font-mono font-bold">{fmtNum(previewRequest.studentCode)}</strong> เพื่อเป็นหลักฐาน สำหรับ
                        <strong className="font-bold underline ml-1">{previewRequest.requestPurpose || previewRequest.certType}</strong> จึงออกหนังสือนี้ไว้เป็นสำคัญ
                      </p>
                    )}

                    <div
                      contentEditable
                      suppressContentEditableWarning
                      className="text-center pt-2 outline-none focus:bg-purple-50 font-normal"
                      style={{ fontSize: `${docFontSize}pt` }}
                    >
                      ให้ไว้ ณ วันที่ {fmtNum(new Date(previewRequest.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }))}
                    </div>

                    {/* 1. Dean / Authorized Signer Block: ABOVE THE PHOTO BOX (ขนาดปรับได้ สีน้ำเงิน) */}
                    <div
                      className="pt-6 ml-auto w-auto min-w-[20rem] max-w-sm text-center space-y-1.5"
                      style={{
                        marginTop: `${docSignerOffset}px`,
                        fontSize: `${signerFontSize}pt`,
                      }}
                    >
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold text-slate-900 outline-none focus:bg-purple-50">
                        ({(customSigner.name && customSigner.name !== '-') ? customSigner.name : 'พระราชอุดมวัชรเมธี, ผศ.ดร.'})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-800 font-medium outline-none focus:bg-purple-50">
                        {(customSigner.title && customSigner.title !== '-') ? customSigner.title : 'คณบดีคณะพุทธศาสตร์'}
                      </div>
                      {showSignerOrg && (
                        <div contentEditable suppressContentEditableWarning className="text-slate-600 outline-none focus:bg-purple-50">
                          {signerOrgCustomText ? (
                            signerOrgCustomText
                          ) : (
                            <div className="space-y-0.5 leading-tight">
                              <div>{settings.facultyNameTh || 'คณะพุทธศาสตร์'}</div>
                              <div>{settings.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. Student Photo Box & Student Signature Block: BELOW DEAN SIGNATURE */}
                    <div className="pt-2 flex items-end justify-between">
                      <div className="space-y-3">
                        {showPhotoBox && (
                          <div
                            className="w-28 h-36 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs p-2 text-center bg-slate-50/20 shadow-sm transition-transform"
                            style={{ transform: `translateX(${photoBoxOffsetX}px)` }}
                          >
                            <span>ติดรูปถ่าย<br />{fmtNum('1.5')} - {fmtNum(2)} นิ้ว</span>
                          </div>
                        )}
                        {showStudentSign && (
                          <div className="pt-1 inline-flex flex-col">
                            <div className="flex items-baseline gap-1 text-slate-800" style={{ fontSize: `${Math.max(11, docFontSize - 2)}pt` }}>
                              <span className="shrink-0 font-medium">ลงชื่อ</span>
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => setCustomStudentDots(e.currentTarget.textContent || '')}
                                className="tracking-wider font-mono outline-none focus:bg-purple-50 select-text"
                                title="คลิกเพื่อลบ พิมพ์ หรือแก้ไขจุดไข่ปลาได้อิสระ"
                              >
                                {customStudentDots !== '' ? customStudentDots : '.'.repeat(dotsCount)}
                              </span>
                            </div>
                            {/* (ชื่อ-นามสกุล): จัดกึ่งกลาง ชิดซ้าย หรือชิดขวาได้อัตโนมัติ พร้อมปุ่มขยับละเอียด */}
                            <div
                              className="w-full flex"
                              style={{
                                justifyContent:
                                  studentSignAlign === 'left'
                                    ? 'flex-start'
                                    : studentSignAlign === 'right'
                                    ? 'flex-end'
                                    : 'center',
                              }}
                            >
                              <div
                                style={{
                                  transform: `translateX(${studentSignOffsetX}px)`,
                                  fontSize: `${studentSignFontSize}pt`,
                                  whiteSpace: 'nowrap',
                                }}
                                className="mt-1 font-bold text-slate-900 transition-all outline-none focus:bg-purple-50 whitespace-nowrap cursor-text"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  const raw = e.currentTarget.textContent || '';
                                  setCustomStudentSignName(raw.replace(/[()]/g, '').trim());
                                }}
                                title="คลิกเพื่อแก้ไขชื่อ-นามสกุลได้โดยตรง"
                              >
                                ({sanitizeName(customStudentSignName || previewRequest.fullName)})
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Footer (ภาพที่ 2 และ 3): ชิดล่างสุดของเอกสาร */}
                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    {/* ภาพที่ 2: ข้อมูลติดต่อสำนักงาน (แก้ไขข้อความได้สด) */}
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">{settings.facultyNameTh ? `สำนักงาน${settings.facultyNameTh}` : 'สำนักงานคณะพุทธศาสตร์'}</p>
                      <p>โทรศัพท์ {settings.contactPhone || '035-247-8000 ต่อ 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>

                    {/* ภาพที่ 3: ผู้ออกเอกสาร/ปริ้นเอกสาร + QR Code */}
                    <div className="flex flex-col items-center text-center space-y-1">
                      <div contentEditable suppressContentEditableWarning className="text-[11px] font-medium text-slate-700 outline-none focus:bg-purple-50 px-1.5 py-0.5 rounded">
                        ผู้ออกเอกสารหรือปริ้นเอกสาร : <span className="font-bold text-slate-900">{currentUser?.name || 'อาจารย์ไพศาล (ผู้ดูแลระบบ)'}</span>
                      </div>
                      {showQrCode && qrCodeDataUrl && (
                        <img src={qrCodeDataUrl} alt="QR Code" className="w-14 h-14 object-contain" />
                      )}
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
              <Link
                href={`/verify?docNo=${encodeURIComponent(previewRequest.docNo || previewRequest.id)}`}
                target="_blank"
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
              >
                <ExternalLink className="w-4 h-4 text-purple-600" />
                <span>ตรวจสอบความถูกต้อง (Verify View)</span>
              </Link>

              <div className="flex items-center gap-2">
                {/* Direct PDF Download Button */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={pdfDownloading}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition disabled:opacity-50"
                  title="ดาวน์โหลดเป็นไฟล์ PDF คุณภาพสูงลงเครื่องทันที"
                >
                  <Download className="w-4 h-4" />
                  <span>{pdfDownloading ? 'กำลังสร้างไฟล์ PDF...' : 'ดาวน์โหลดไฟล์ PDF (Download)'}</span>
                </button>

                {/* Print Button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์เอกสาร (Print)</span>
                </button>
              </div>
            </div>

            {/* Print Stylesheet for exact A4 paper formatting */}
            <style jsx global>{`
              @page {
                size: A4 portrait;
                margin: 0;
              }
              @media print {
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                }
                body * {
                  visibility: hidden !important;
                }
                #printable-certificate, #printable-certificate * {
                  visibility: visible !important;
                }
                #printable-certificate {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  min-height: 297mm !important;
                  max-height: 297mm !important;
                  padding: 25mm 20mm 15mm 25mm !important;
                  margin: 0 !important;
                  background: #ffffff !important;
                  border: none !important;
                  box-shadow: none !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  overflow: hidden !important;
                }
              }
            `}</style>
            </>
          )}
          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────
          MODAL: LIGHTBOX ZOOM
         ───────────────────────────────────────────────────────────── */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl p-2 overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-900 flex items-center justify-center font-bold text-sm shadow-md cursor-pointer"
            >
              ✕
            </button>
            <img
              src={zoomImage}
              alt="ภาพขยายเอกสารแนบ"
              className="max-h-[85vh] max-w-full object-contain mx-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
