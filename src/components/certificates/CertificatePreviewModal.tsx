'use client';

import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  X,
  UserCog,
  Type,
  MoveVertical,
  Sparkles,
} from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf-export';
import { CertificateRequest } from './types';

interface CertificatePreviewModalProps {
  previewRequest: CertificateRequest | null;
  onClose: () => void;
  settings?: any;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  previewRequest,
  onClose,
  settings,
}) => {
  const [pdfDownloading, setPdfDownloading] = useState<boolean>(false);

  // Document Customizer States for Preview
  const [previewTemplate, setPreviewTemplate] = useState<'THAI_STANDARD' | 'BANK_LETTER' | 'ENG_CERT' | 'INTERNAL_MEMO' | 'STAFF_CERT'>('THAI_STANDARD');
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
  const [customSigner, setCustomSigner] = useState({
    name: settings?.signerNameTh && settings.signerNameTh !== '-' ? settings.signerNameTh : 'พระครูสิริรัตนบัณฑิต, ผศ.ดร.',
    title: settings?.signerTitleTh && settings.signerTitleTh !== '-' ? settings.signerTitleTh : 'รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์',
  });

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

  useEffect(() => {
    if (previewRequest) {
      if (previewRequest.targetAudience === 'STAFF' || previewRequest.applicantType === 'STAFF' || previewRequest.docTemplate?.startsWith('STAFF_')) {
        setPreviewTemplate('STAFF_CERT');
      } else if (previewRequest.docTemplate === 'BANK_LETTER' || previewRequest.certType?.includes('ธนาคาร') || previewRequest.bankTargetTh) {
        setPreviewTemplate('BANK_LETTER');
      } else if (previewRequest.docTemplate === 'ENG_CERT' || previewRequest.certType?.includes('English') || previewRequest.certType?.includes('CONCERN')) {
        setPreviewTemplate('ENG_CERT');
      } else if (previewRequest.docTemplate === 'INTERNAL_MEMO') {
        setPreviewTemplate('INTERNAL_MEMO');
      } else {
        setPreviewTemplate('THAI_STANDARD');
      }
    }
  }, [previewRequest]);

  const handleDownloadPdf = async () => {
    if (!previewRequest) return;
    setPdfDownloading(true);
    try {
      const safeName = (previewRequest.fullName || 'student').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');
      const filename = `หนังสือรับรอง_${safeName}_อว8002-${previewRequest.docNo || previewRequest.id}.pdf`;
      await exportElementToPdf('printable-student-cert', filename);
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใช้ปุ่มพิมพ์เอกสาร');
    } finally {
      setPdfDownloading(false);
    }
  };

  if (!previewRequest) return null;

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-sm">เครื่องมือปรับแต่งและตัวอย่างหนังสือรับรอง (Interactive Document Customizer)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={pdfDownloading}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{pdfDownloading ? 'กำลังสร้าง PDF...' : 'โหลด PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์</span>
                </button>
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Customizer Toolbar (Hidden on Print) */}
            <div className="p-4 bg-purple-50/80 border-b border-purple-200/80 space-y-3 print:hidden text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="font-bold text-purple-900 flex items-center gap-1.5">
                  <UserCog className="w-4 h-4 text-purple-600" />
                  <span>ปรับแต่งรูปแบบเอกสาร (Document Controls)</span>
                </label>
                <span className="text-[11px] text-purple-700 bg-purple-100/90 px-2.5 py-0.5 rounded-full font-semibold">
                  ✍️ คลิกบนข้อความเพื่อพิมพ์แก้ไขสดได้ทันที
                </span>
              </div>

              {/* Template Selector & Signer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                    <option value="STAFF_CERT">👔 หนังสือรับรองอาจารย์และบุคลากร</option>
                    <option value="BANK_LETTER">🏦 ขอความอนุเคราะห์ธนาคาร (หน้า 1)</option>
                    <option value="ENG_CERT">🌐 รับรองภาษาอังกฤษ (TO WHOM) (PDF 2)</option>
                    <option value="INTERNAL_MEMO">📑 บันทึกข้อความราชการ (หน้า 10)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชื่อผู้ลงนาม:
                  </label>
                  <input
                    type="text"
                    value={customSigner.name}
                    onChange={(e) => setCustomSigner({ ...customSigner, name: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ตำแหน่งผู้ลงนาม:
                  </label>
                  <input
                    type="text"
                    value={customSigner.title}
                    onChange={(e) => setCustomSigner({ ...customSigner, title: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
                  />
                </div>
              </div>

              {/* Typography & Layout Spacing Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-purple-200/60">
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

                {/* Font Size (Content & ที่ อว) */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm" title="ขนาดตัวอักษรเนื้อหา และ ที่ อว (ปรับเท่ากัน)">
                  <span className="font-semibold text-slate-600">ขนาดเนื้อหา & ที่ อว:</span>
                  <button
                    type="button"
                    onClick={() => setDocFontSize((s) => Math.max(11, s - 1))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-bold text-purple-800">{docFontSize}pt</span>
                  <button
                    type="button"
                    onClick={() => setDocFontSize((s) => Math.min(24, s + 1))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Signer Font Size */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-blue-200 shadow-sm" title="ขนาดตัวอักษรผู้ลงนามและตำแหน่ง (สีน้ำเงิน)">
                  <span className="font-semibold text-blue-700">ขนาดผู้ลงนาม:</span>
                  <button
                    type="button"
                    onClick={() => setSignerFontSize((s) => Math.max(9, s - 1))}
                    className="w-5 h-5 rounded bg-blue-50 hover:bg-blue-100 font-bold text-blue-800 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-bold text-blue-900">{signerFontSize}pt</span>
                  <button
                    type="button"
                    onClick={() => setSignerFontSize((s) => Math.min(22, s + 1))}
                    className="w-5 h-5 rounded bg-blue-50 hover:bg-blue-100 font-bold text-blue-800 cursor-pointer"
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
                    <option value={1.3}>1.3</option>
                    <option value={1.5}>1.5</option>
                    <option value={1.7}>1.7</option>
                    <option value={2.0}>2.0</option>
                  </select>
                </div>

                {/* Signature Offset */}
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm">
                  <span className="font-semibold text-slate-600">ขยับลายเซ็น:</span>
                  <button
                    type="button"
                    onClick={() => setDocSignerOffset((o) => Math.max(0, o - 10))}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
                  >
                    ⬆
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocSignerOffset((o) => Math.min(120, o + 10))}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
                  >
                    ⬇
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

                {/* Photo Box Shift */}
                {showPhotoBox && (
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-rose-200 shadow-sm" title="ขยับกรอบรูป">
                    <span className="font-semibold text-rose-700">กรอบรูป:</span>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX((x) => Math.max(0, x - 20))}
                      className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 font-bold text-xs text-rose-800 cursor-pointer"
                    >
                      ◀ ซ้าย
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX(0)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                        photoBoxOffsetX === 0 ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      ชิดซ้าย
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX(100)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                        photoBoxOffsetX === 100 ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      กลาง
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX((x) => Math.min(300, x + 20))}
                      className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 font-bold text-xs text-rose-800 cursor-pointer"
                    >
                      ขวา ▶
                    </button>
                  </div>
                )}

                {/* Dots Length */}
                {showStudentSign && (
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-amber-200 shadow-sm" title="ปรับความยาวจุดไข่ปลา">
                    <span className="font-semibold text-amber-800">จุดไข่ปลา:</span>
                    <button
                      type="button"
                      onClick={() => setDotsCount((d) => Math.max(8, d - 4))}
                      className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 font-bold text-xs text-amber-900 cursor-pointer"
                    >
                      - สั้นลง
                    </button>
                    <span className="w-8 text-center font-bold text-amber-900 font-mono text-xs">{dotsCount} จุด</span>
                    <button
                      type="button"
                      onClick={() => setDotsCount((d) => Math.min(55, d + 4))}
                      className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 font-bold text-xs text-amber-900 cursor-pointer"
                    >
                      + ยาวขึ้น
                    </button>
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
                    >
                      -
                    </button>
                    <span className="w-7 text-center font-bold text-indigo-900">{studentSignFontSize}pt</span>
                    <button
                      type="button"
                      onClick={() => setStudentSignFontSize((s) => Math.min(24, s + 1))}
                      className="w-5 h-5 rounded bg-indigo-50 hover:bg-indigo-100 font-bold text-indigo-800 cursor-pointer"
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

                {/* Toggles */}
                <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-xl border border-purple-200 shadow-sm">
                  <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPhotoBox}
                      onChange={(e) => setShowPhotoBox(e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <span>กรอบรูป 1.5 - 2&quot;</span>
                  </label>
                  <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showStudentSign}
                      onChange={(e) => setShowStudentSign(e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <span>ลายเซ็นนิสิต</span>
                  </label>
                </div>
              </div>

              <div className="text-[11px] text-amber-800 bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span><b>คำแนะนำ:</b> ท่านสามารถใช้เมาส์คลิกที่ข้อความใดๆ ในเอกสารเพื่อพิมพ์แก้ไขคำ เปลี่ยนชื่อธนาคาร หรือปรับข้อความได้ทันทีก่อนสั่งพิมพ์หรือดาวน์โหลด PDF</span>
              </div>
            </div>

            {/* Modal Printable Sheet Area (Exact A4 Desk Preview) */}
            <div className="w-full overflow-x-auto bg-slate-200/60 p-4 sm:p-8 rounded-2xl flex justify-center border border-slate-200">
              <div
                id="printable-student-cert"
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
              {/* TEMPLATE 1: BANK_LETTER */}
              {previewTemplate === 'BANK_LETTER' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start pb-2" style={{ fontSize: `${docFontSize}pt` }}>
                      <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                        ที่ อว {previewRequest.docNoPrefix || (previewRequest.docNo?.includes('8002.1') ? '8002.1' : '8002')} / {previewRequest.docNo?.replace(/^(8002\.1|8002)\s*\/\s*/i, '') || '077'}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-right outline-none focus:bg-purple-50">
                        {new Date(previewRequest.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
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
                        <span className="font-bold">สิ่งที่ส่งมาด้วย</span> หนังสือรับรองนิสิต จำนวน 1 ฉบับ
                      </div>
                    </div>

                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="indent-8 outline-none focus:bg-purple-50 pt-2 text-justify"
                      style={{ fontSize: `${docFontSize}pt`, lineHeight: docLineSpacing }}
                    >
                      เนื่องด้วย <strong className="font-bold">{sanitizeName(previewRequest.monasticName || previewRequest.fullName)}</strong> สัญชาติ{' '}
                      <strong className="font-bold">{previewRequest.nationality || 'Bangladeshi'}</strong> ประเทศ{' '}
                      <strong className="font-bold">{previewRequest.country || 'Bangladesh'}</strong>{' '}
                      {previewRequest.passportNo && (
                        <>ถือหนังสือเดินทางเลขที่ <strong className="font-mono font-bold">{previewRequest.passportNo}</strong> </>
                      )}
                      รหัสนิสิต <strong className="font-mono font-bold">{previewRequest.studentCode}</strong> เป็นนิสิตหลักสูตร
                      {previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'} (ระดับ{previewRequest.degreeLevel || 'ปริญญาตรี'} หลักสูตร 4 ปี) ชั้นปีที่{' '}
                      {previewRequest.studentCode.substring(0, 2) ? '1' : '1'} สาขาวิชา{previewRequest.major || 'พระพุทธศาสนา'} (ภาคภาษาอังกฤษ)
                      คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย มีความประสงค์จะทำธุรกรรมกับธนาคาร เพื่ออำนวยความสะดวกในการทำธุรกรรมกับมหาวิทยาลัยในระหว่างที่กำลังศึกษาอยู่ในภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา
                    </p>

                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="indent-8 outline-none focus:bg-purple-50"
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
                        ({customSigner.name})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        {customSigner.title}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-600 outline-none focus:bg-purple-50">
                        มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">ติดต่อผู้ประสานงาน:</p>
                      <p>{settings.facultyNameTh ? `สำนักงาน${settings.facultyNameTh}` : 'สำนักงานคณะพุทธศาสตร์'}</p>
                      <p>โทร. {settings.contactPhone || '035-247-8000 ต่อ 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 2: ENG_CERT */}
              {previewTemplate === 'ENG_CERT' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
                    <div
                      className="flex justify-between items-start pb-2 transition-all"
                      style={{
                        marginTop: `${headerTopSpacing}px`,
                        fontSize: `${docFontSize}pt`,
                      }}
                    >
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 space-y-0.5">
                        <p className="font-bold">Office of Dean</p>
                        <p>Tel. {settings.contactPhone || '0-3524-8000 ext. 8323'}</p>
                        <p>Fax. 0-3524-8096</p>
                        <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                        <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                        <p className="font-mono font-bold pt-1">
                          MCU No. {previewRequest.docNoPrefix || (previewRequest.docNo?.includes('8002.1') ? '8002.1' : '8002')} / {previewRequest.docNo?.replace(/^(8002\.1|8002)\s*\/\s*/i, '') || '166'}
                        </p>
                      </div>
                      <div></div>
                    </div>

                    <div
                      className="pb-2 text-center transition-all"
                      style={{ paddingTop: `${headerTitleSpacing}px` }}
                    >
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        className="font-bold tracking-wider outline-none focus:bg-purple-50"
                        style={{ fontSize: `${Math.round(docFontSize * 1.5)}pt` }}
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

                    <div
                      className="pt-6 ml-auto w-80 text-center space-y-1"
                      style={{
                        marginTop: `${docSignerOffset}px`,
                        fontSize: `${signerFontSize}pt`,
                      }}
                    >
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold text-slate-900 outline-none focus:bg-purple-50">
                        ({customSigner.name})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-800 font-medium outline-none focus:bg-purple-50">
                        {customSigner.title}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-600 outline-none focus:bg-purple-50">
                        Mahachulalongkornrajavidyalaya University
                      </div>
                    </div>

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
                                className="tracking-wider font-mono outline-none focus:bg-purple-50 select-text"
                                title="คลิกเพื่อลบหรือพิมพ์จุดไข่ปลาได้อิสระ"
                              >
                                {'.'.repeat(dotsCount)}
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
                                title="คลิกเพื่อแก้ไขชื่อ-นามสกุลได้โดยตรง"
                              >
                                ({sanitizeName(previewRequest.fullName)})
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">{settings.facultyNameEn ? `Faculty of ${settings.facultyNameEn.replace(/^Faculty of /i, '')}` : 'Faculty of Buddhism'}</p>
                      <p>Tel. {settings.contactPhone ? `+66 ${settings.contactPhone.replace(/^0/, '')}` : '+66 35 248 000 ext. 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 3: INTERNAL_MEMO */}
              {previewTemplate === 'INTERNAL_MEMO' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 border-b pb-3">
                      <div className="w-14 h-14 rounded-full bg-slate-50 border flex items-center justify-center p-1 overflow-hidden shrink-0">
                        <span className="text-3xl">🦅</span>
                      </div>
                      <div className="text-center flex-1">
                        <h2 className="text-2xl font-black tracking-wide">บันทึกข้อความ</h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-b pb-3">
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        <span className="font-bold">ส่วนงาน:</span> คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-right outline-none focus:bg-purple-50">
                        <span className="font-bold">วันที่:</span> {new Date(previewRequest.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        <span className="font-bold">ที่:</span> อว {previewRequest.docNoPrefix || (previewRequest.docNo?.includes('8002.1') ? '8002.1' : '8002')} / {previewRequest.docNo?.replace(/^(8002\.1|8002)\s*\/\s*/i, '') || 'xxx'}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        <span className="font-bold">เรื่อง:</span> ขอความอนุเคราะห์ออกหนังสือรับรองให้แก่นิสิต
                      </div>
                    </div>

                    <div contentEditable suppressContentEditableWarning className="font-bold text-xs pt-1 outline-none focus:bg-purple-50">
                      เรียน ผู้อำนวยการกองกิจการนิสิต / คณบดีคณะพุทธศาสตร์
                    </div>

                    <p contentEditable suppressContentEditableWarning className="indent-8 outline-none focus:bg-purple-50 pt-2 leading-relaxed">
                      ด้วย <strong className="font-bold">{sanitizeName(previewRequest.monasticName || previewRequest.fullName)}</strong> รหัสนิสิต <strong className="font-mono font-bold">{previewRequest.studentCode}</strong> อายุ {previewRequest.age ? String(previewRequest.age).replace(/\s*ปี$/g, '').trim() : '-'} ปี {previewRequest.vassa && String(previewRequest.vassa).trim() !== '-' && <>พรรษา {String(previewRequest.vassa).replace(/\s*พรรษา$/g, '').trim()} </>}สัญชาติ {previewRequest.nationality || '-'} {previewRequest.passportNo && <>ถือหนังสือเดินทางเลขที่ {previewRequest.passportNo}</>} เป็นนิสิตคณะพุทธศาสตร์ หลักสูตร{previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'} สาขาวิชา{previewRequest.major || 'พระพุทธศาสนา'} ได้ยื่นคำร้องเพื่อขอรับรอง{previewRequest.requestPurpose || previewRequest.certType}
                    </p>

                    <p contentEditable suppressContentEditableWarning className="indent-8 outline-none focus:bg-purple-50">
                      ในการนี้ คณะพุทธศาสตร์ จึงขอความอนุเคราะห์ในการออกหนังสือรับรองให้แก่นิสิตดังกล่าว เพื่อเป็นเอกสารประกอบการดำเนินการต่อไป
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
                        ({customSigner.name})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        {customSigner.title}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">{settings.facultyNameTh ? `สำนักงาน${settings.facultyNameTh}` : 'สำนักงานคณะพุทธศาสตร์'}</p>
                      <p>โทรศัพท์ {settings.contactPhone || '035-247-8000 ต่อ 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 4: THAI_STANDARD */}
              {previewTemplate === 'THAI_STANDARD' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
                    <div
                      className="flex justify-between items-start pb-2 transition-all"
                      style={{
                        marginTop: `${headerTopSpacing}px`,
                        fontSize: `${docFontSize}pt`,
                      }}
                    >
                      <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                        ที่ อว {previewRequest.docNoPrefix || (previewRequest.docNo?.includes('8002.1') ? '8002.1' : '8002')} / {previewRequest.docNo?.replace(/^(8002\.1|8002)\s*\/\s*/i, '') || 'xxx'}
                      </div>
                      <div></div>
                    </div>

                    <div
                      className="pb-2 text-center transition-all"
                      style={{ paddingTop: `${headerTitleSpacing}px` }}
                    >
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        className="font-bold tracking-wide outline-none focus:bg-purple-50"
                        style={{ fontSize: `${Math.round(docFontSize * 1.5)}pt` }}
                      >
                        หนังสือรับรอง
                      </span>
                    </div>

                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="indent-10 leading-relaxed outline-none focus:bg-purple-50 pt-2 text-justify"
                      style={{ fontSize: `${docFontSize}pt`, lineHeight: docLineSpacing }}
                    >
                      โดยหนังสือนี้ขอรับรองว่า <strong className="font-bold">{sanitizeName(previewRequest.monasticName || previewRequest.fullName)}</strong>{' '}
                      {previewRequest.age && String(previewRequest.age).trim() !== '-' && (
                        <>อายุ <strong className="font-bold">{String(previewRequest.age).replace(/\s*ปี$/g, '').trim()}</strong> ปี </>
                      )}
                      {previewRequest.vassa && String(previewRequest.vassa).trim() !== '-' && (
                        <>พรรษา <strong className="font-bold">{String(previewRequest.vassa).replace(/\s*พรรษา$/g, '').trim()}</strong> </>
                      )}
                      สัญชาติ <strong className="font-bold">{previewRequest.nationality || 'ไทย'}</strong>{' '}
                      {previewRequest.country && previewRequest.country !== 'Thailand' && (
                        <>ประเทศ <strong className="font-bold">{previewRequest.country}</strong> </>
                      )}
                      {previewRequest.passportNo && (
                        <>ถือหนังสือเดินทางเลขที่ <strong className="font-mono font-bold">{previewRequest.passportNo}</strong> และวีซ่าประเภท {previewRequest.visaType || 'คนอยู่ชั่วคราว (Non-Immigrant Visa)'} </>
                      )}
                      เป็นนิสิตคณะพุทธศาสตร์ หลักสูตร{previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'}{' '}
                      (ระดับ{previewRequest.degreeLevel || 'ปริญญาตรี'} หลักสูตร 4 ปี) ชั้นปีที่{' '}
                      {previewRequest.studentCode.substring(0, 2) ? '2' : '1'} สาขาวิชา {previewRequest.major || 'พระพุทธศาสนา'}{' '}
                      ({previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai' ? 'ภาคภาษาไทย' : 'ภาคภาษาอังกฤษ'}) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย รหัสประจำตัวนิสิต{' '}
                      <strong className="font-mono font-bold">{previewRequest.studentCode}</strong> เพื่อเป็นหลักฐาน สำหรับ
                      <strong className="font-bold underline ml-1">{previewRequest.requestPurpose || previewRequest.certType}</strong> จึงออกหนังสือนี้ไว้เป็นสำคัญ
                    </p>

                    <div
                      contentEditable
                      suppressContentEditableWarning
                      className="text-center pt-2 outline-none focus:bg-purple-50"
                      style={{ fontSize: `${docFontSize}pt` }}
                    >
                      ให้ไว้ ณ วันที่ {new Date(previewRequest.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>

                    <div
                      className="pt-6 ml-auto w-80 text-center space-y-1.5"
                      style={{
                        marginTop: `${docSignerOffset}px`,
                        fontSize: `${signerFontSize}pt`,
                      }}
                    >
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold text-slate-900 outline-none focus:bg-purple-50">
                        ({customSigner.name})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-800 font-medium outline-none focus:bg-purple-50">
                        {customSigner.title}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-600 outline-none focus:bg-purple-50">
                        คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                      </div>
                    </div>

                    <div className="pt-2 flex items-end justify-between">
                      <div className="space-y-3">
                        {showPhotoBox && (
                          <div
                            className="w-28 h-36 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs p-2 text-center bg-slate-50/20 shadow-sm transition-transform"
                            style={{ transform: `translateX(${photoBoxOffsetX}px)` }}
                          >
                            <span>ติดรูปถ่าย<br />1.5 - 2 นิ้ว</span>
                          </div>
                        )}
                        {showStudentSign && (
                          <div className="pt-1 inline-flex flex-col">
                            <div className="flex items-baseline gap-1 text-slate-800" style={{ fontSize: `${Math.max(11, docFontSize - 2)}pt` }}>
                              <span className="shrink-0 font-medium">ลงชื่อ</span>
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                className="tracking-wider font-mono outline-none focus:bg-purple-50 select-text"
                                title="คลิกเพื่อลบหรือพิมพ์จุดไข่ปลาได้อิสระ"
                              >
                                {'.'.repeat(dotsCount)}
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
                                title="คลิกเพื่อแก้ไขชื่อ-นามสกุลได้โดยตรง"
                              >
                                ({sanitizeName(previewRequest.fullName)})
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">{settings.facultyNameTh ? `สำนักงาน${settings.facultyNameTh}` : 'สำนักงานคณะพุทธศาสตร์'}</p>
                      <p>โทรศัพท์ {settings.contactPhone || '035-247-8000 ต่อ 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 5: STAFF_CERT */}
              {previewTemplate === 'STAFF_CERT' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
                    <div
                      className="flex justify-between items-start pb-2 transition-all"
                      style={{
                        marginTop: `${headerTopSpacing}px`,
                        fontSize: `${docFontSize}pt`,
                      }}
                    >
                      <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                        ที่ อว {previewRequest.docNoPrefix || (previewRequest.docNo?.includes('8002.1') ? '8002.1' : '8002')} / {previewRequest.docNo?.replace(/^(8002\.1|8002)\s*\/\s*/i, '') || 'xxx'}
                      </div>
                      <div></div>
                    </div>

                    <div
                      className="pb-2 text-center transition-all"
                      style={{ paddingTop: `${headerTitleSpacing}px` }}
                    >
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        className="font-bold tracking-wide outline-none focus:bg-purple-50"
                        style={{ fontSize: `${Math.round(docFontSize * 1.5)}pt` }}
                      >
                        หนังสือรับรอง
                      </span>
                    </div>

                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="indent-10 leading-relaxed outline-none focus:bg-purple-50 pt-2 text-justify"
                      style={{ fontSize: `${docFontSize}pt`, lineHeight: docLineSpacing }}
                    >
                      โดยหนังสือนี้ขอรับรองว่า <strong className="font-bold">{previewRequest.fullName}</strong>{' '}
                      {previewRequest.age && <>อายุ <strong className="font-bold">{previewRequest.age}</strong> ปี </>}
                      {previewRequest.vassa && <>พรรษา <strong className="font-bold">{previewRequest.vassa}</strong> </>}
                      สังกัด<strong className="font-bold">{previewRequest.department || 'คณะพุทธศาสตร์'}</strong> มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย{' '}
                      ปัจจุบันดำรงตำแหน่ง <strong className="font-bold">{previewRequest.position || previewRequest.degreeLevel || 'อาจารย์ผู้สอน'}</strong>{' '}
                      ได้ปฏิบัติงานและภาระหน้าที่ตามที่ได้รับมอบหมายจริง เพื่อเป็นหลักฐานสำหรับ{' '}
                      <strong className="font-bold underline ml-1">{previewRequest.requestPurpose || previewRequest.certType}</strong> จึงออกหนังสือนี้ไว้เป็นสำคัญ
                    </p>

                    <div
                      contentEditable
                      suppressContentEditableWarning
                      className="text-center pt-3 outline-none focus:bg-purple-50"
                      style={{ fontSize: `${docFontSize}pt` }}
                    >
                      ให้ไว้ ณ วันที่ {new Date(previewRequest.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>

                    <div
                      className="pt-6 ml-auto w-80 text-center space-y-1.5"
                      style={{
                        marginTop: `${docSignerOffset}px`,
                        fontSize: `${signerFontSize}pt`,
                      }}
                    >
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold text-slate-900 outline-none focus:bg-purple-50">
                        ({customSigner.name})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-800 font-medium outline-none focus:bg-purple-50">
                        {customSigner.title}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-600 outline-none focus:bg-purple-50">
                        คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">{settings.facultyNameTh ? `สำนักงาน${settings.facultyNameTh}` : 'สำนักงานคณะพุทธศาสตร์'}</p>
                      <p>โทรศัพท์ {settings.contactPhone || '035-247-8000 ต่อ 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t flex flex-wrap items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500 font-sans">
                💡 สามารถเลือกสั่งพิมพ์ หรือดาวน์โหลดเป็นไฟล์ PDF คุณภาพสูงลงเครื่องได้โดยตรง
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={pdfDownloading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                  title="ดาวน์โหลดเป็นไฟล์ PDF ลงเครื่อง"
                >
                  <Download className="w-4 h-4" />
                  <span>{pdfDownloading ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลดไฟล์ PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์เอกสารนี้</span>
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
                #printable-student-cert, #printable-student-cert * {
                  visibility: visible !important;
                }
                #printable-student-cert {
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
          </div>
        </div>
  );
};
