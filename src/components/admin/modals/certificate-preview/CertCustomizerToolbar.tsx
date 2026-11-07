'use client';

import React from 'react';
import {
  UserCog,
  Hash,
  RefreshCw,
  Save,
  FileEdit,
  Type,
  MoveVertical,
  Sparkles,
  Paperclip,
} from 'lucide-react';
import { CertificateRequest, SignatoryItem, SystemSettings } from '@/types';
import { CertTemplateType } from './types';

interface CertCustomizerToolbarProps {
  previewRequest: CertificateRequest;
  previewTemplate: CertTemplateType;
  setPreviewTemplate: (val: CertTemplateType) => void;
  selectedSignerPreset: string;
  setSelectedSignerPreset: (val: string) => void;
  activeSignatoriesList: SignatoryItem[];
  settings: SystemSettings;
  customSigner: { name: string; title: string };
  setCustomSigner: React.Dispatch<React.SetStateAction<{ name: string; title: string }>>;
  docNoPrefix: '8002' | '8002.1';
  setDocNoPrefix: (val: '8002' | '8002.1') => void;
  docNoInputModal: string;
  setDocNoInputModal: (val: string) => void;
  handleSaveDocNoModal: (customVal?: string, prefixOverride?: '8002' | '8002.1') => Promise<void>;
  computeNextDocNo: () => string;
  computeNextSeqOnly: () => string;
  isSavingDocNo: boolean;
  isCustomTextOpen: boolean;
  setIsCustomTextOpen: (val: boolean) => void;
  customBodyText: string;
  docFontFamily: string;
  setDocFontFamily: (val: string) => void;
  docTitleFontSize: number;
  setDocTitleFontSize: React.Dispatch<React.SetStateAction<number>>;
  docTitleFontWeight: 'font-normal' | 'font-semibold' | 'font-bold' | 'font-black';
  setDocTitleFontWeight: (val: 'font-normal' | 'font-semibold' | 'font-bold' | 'font-black') => void;
  docFontSize: number;
  setDocFontSize: React.Dispatch<React.SetStateAction<number>>;
  signerFontSize: number;
  setSignerFontSize: React.Dispatch<React.SetStateAction<number>>;
  docLineSpacing: number;
  setDocLineSpacing: (val: number) => void;
  docSignerOffset: number;
  setDocSignerOffset: React.Dispatch<React.SetStateAction<number>>;
  headerTitleSpacing: number;
  setHeaderTitleSpacing: React.Dispatch<React.SetStateAction<number>>;
  headerTopSpacing: number;
  setHeaderTopSpacing: React.Dispatch<React.SetStateAction<number>>;
  showPhotoBox: boolean;
  setShowPhotoBox: (val: boolean) => void;
  photoBoxOffsetX: number;
  setPhotoBoxOffsetX: React.Dispatch<React.SetStateAction<number>>;
  showStudentSign: boolean;
  setShowStudentSign: (val: boolean) => void;
  customStudentDots: string;
  setCustomStudentDots: (val: string) => void;
  dotsCount: number;
  setDotsCount: React.Dispatch<React.SetStateAction<number>>;
  customStudentSignName: string;
  setCustomStudentSignName: (val: string) => void;
  studentSignFontSize: number;
  setStudentSignFontSize: React.Dispatch<React.SetStateAction<number>>;
  studentSignAlign: 'left' | 'center' | 'right';
  setStudentSignAlign: (val: 'left' | 'center' | 'right') => void;
  studentSignOffsetX: number;
  setStudentSignOffsetX: React.Dispatch<React.SetStateAction<number>>;
  useThaiNumerals: boolean;
  setUseThaiNumerals: (val: boolean) => void;
  showSignerOrg: boolean;
  setShowSignerOrg: (val: boolean) => void;
  signerOrgCustomText: string;
  setSignerOrgCustomText: (val: string) => void;
  showQrCode: boolean;
  setShowQrCode: (val: boolean) => void;
  setPreviewTab: (val: 'DOCUMENT' | 'ATTACHMENTS') => void;
  handleOpenRejectModal: (req: CertificateRequest) => void;
}

export function CertCustomizerToolbar({
  previewRequest,
  previewTemplate,
  setPreviewTemplate,
  selectedSignerPreset,
  setSelectedSignerPreset,
  activeSignatoriesList,
  settings,
  customSigner,
  setCustomSigner,
  docNoPrefix,
  setDocNoPrefix,
  docNoInputModal,
  setDocNoInputModal,
  handleSaveDocNoModal,
  computeNextDocNo,
  computeNextSeqOnly,
  isSavingDocNo,
  isCustomTextOpen,
  setIsCustomTextOpen,
  customBodyText,
  docFontFamily,
  setDocFontFamily,
  docTitleFontSize,
  setDocTitleFontSize,
  docTitleFontWeight,
  setDocTitleFontWeight,
  docFontSize,
  setDocFontSize,
  signerFontSize,
  setSignerFontSize,
  docLineSpacing,
  setDocLineSpacing,
  docSignerOffset,
  setDocSignerOffset,
  headerTitleSpacing,
  setHeaderTitleSpacing,
  headerTopSpacing,
  setHeaderTopSpacing,
  showPhotoBox,
  setShowPhotoBox,
  photoBoxOffsetX,
  setPhotoBoxOffsetX,
  showStudentSign,
  setShowStudentSign,
  customStudentDots,
  setCustomStudentDots,
  dotsCount,
  setDotsCount,
  customStudentSignName,
  setCustomStudentSignName,
  studentSignFontSize,
  setStudentSignFontSize,
  studentSignAlign,
  setStudentSignAlign,
  studentSignOffsetX,
  setStudentSignOffsetX,
  useThaiNumerals,
  setUseThaiNumerals,
  showSignerOrg,
  setShowSignerOrg,
  signerOrgCustomText,
  setSignerOrgCustomText,
  showQrCode,
  setShowQrCode,
  setPreviewTab,
  handleOpenRejectModal,
}: CertCustomizerToolbarProps) {
  return (
    <div className="space-y-3">
      {/* Signatory & Document Customization Toolbar */}
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
            <label className="font-bold text-slate-700 block mb-1">ชนิดแบบฟอร์มเอกสาร:</label>
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
            <label className="font-bold text-slate-700 block mb-1">ตำแหน่งผู้ลงนาม:</label>
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
            <label className="font-bold text-slate-700 block mb-1">ชื่อผู้ลงนาม (แก้ไขได้):</label>
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
            <label className="font-bold text-slate-700 block mb-1">ตำแหน่งผู้ลงนาม:</label>
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950">
              <Hash className="w-4 h-4 text-indigo-600" />
              <span>เลขที่หนังสือ:</span>
            </div>

            {/* Prefix Selector Toggle */}
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
              <span className="font-mono text-indigo-700 font-bold">ที่ อว {docNoPrefix} /</span>
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
              <span>
                ✍️ แก้ไข/เพิ่มเติมข้อความต้นฉบับ {customBodyText ? '✨ (กำลังใช้ข้อความกำหนดเอง)' : ''}
              </span>
            </button>
          </div>
        </div>

        {/* Typography & Layout Spacing Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-200/60">
          {/* Font Family Selector */}
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
                <option value="'Times New Roman', Times, serif">Times New Roman (มาตรฐานสากล)</option>
                <option value="'Georgia', serif">Georgia (ทางการ)</option>
                <option value="'Garamond', serif">Garamond (ทางการคลาสสิก)</option>
                <option value="'Arial', sans-serif">Arial (สากล Clean)</option>
              </optgroup>
            </select>
          </div>

          {/* Title Font Size & Weight */}
          <div
            className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm"
            title="ปรับขนาดและความหนาของหัวเรื่อง (หนังสือรับรอง)"
          >
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
          <div
            className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm"
            title="ขนาดตัวอักษรเนื้อหา และ ที่ อว (ปรับเท่ากัน)"
          >
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

          {/* Signer Font Size */}
          <div
            className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-blue-200 shadow-sm"
            title="ขนาดตัวอักษรผู้ลงนามและตำแหน่ง (สีน้ำเงิน)"
          >
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

          {/* Header & Title Spacing */}
          <div
            className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-sky-200 shadow-sm text-xs"
            title="ปรับระยะห่างความสูงระหว่าง ที่ อว กับ หนังสือรับรอง เพื่อเว้นช่องใส่ตรา 1-2 นิ้ว หรือแบบฟอร์มสำเร็จรูปของหน่วยงาน"
          >
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
              {headerTitleSpacing}px{' '}
              {headerTitleSpacing >= 180
                ? '(~2 นิ้ว)'
                : headerTitleSpacing >= 135
                ? '(~1.5 นิ้ว)'
                : headerTitleSpacing >= 90
                ? '(~1 นิ้ว)'
                : headerTitleSpacing === 24
                ? '(ปกติ)'
                : ''}
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
                  headerTitleSpacing === 24
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="ระยะมาตรฐาน (24px)"
              >
                ปกติ
              </button>
              <button
                type="button"
                onClick={() => setHeaderTitleSpacing(96)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                  headerTitleSpacing === 96
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="เว้นช่องตรา 1 นิ้ว (96px)"
              >
                1 นิ้ว
              </button>
              <button
                type="button"
                onClick={() => setHeaderTitleSpacing(144)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                  headerTitleSpacing === 144
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="เว้นช่องตรา 1.5 นิ้ว (144px)"
              >
                1.5 นิ้ว
              </button>
              <button
                type="button"
                onClick={() => setHeaderTitleSpacing(192)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                  headerTitleSpacing === 192
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="เว้นช่องตรา 2 นิ้ว (192px)"
              >
                2 นิ้ว
              </button>
            </div>
          </div>

          {/* Top Margin */}
          <div
            className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-sky-200 shadow-sm text-xs"
            title="ขยับ ที่ อว ลงเพื่อเว้นหัวกระดาษที่มีข้อความแบบฟอร์มพิมพ์ไว้แล้ว"
          >
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
            <div
              className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-rose-200 shadow-sm"
              title="ขยับกรอบรูปไปทางขวาหรือซ้าย"
            >
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

          {/* Dots Length */}
          {showStudentSign && (
            <div
              className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-amber-200 shadow-sm"
              title="ปรับความยาวจุดไข่ปลาให้สั้นลงหรือยาวขึ้น"
            >
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
              <span className="w-8 text-center font-bold text-amber-900 font-mono text-xs">
                {dotsCount} จุด
              </span>
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
            <div
              className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-indigo-200 shadow-sm text-xs"
              title="แก้ไขข้อความชื่อ-นามสกุล ใต้ลายเซ็นนิสิต"
            >
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

          {/* Student Name Font Size */}
          {showStudentSign && (
            <div
              className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-indigo-200 shadow-sm"
              title="ขนาดตัวอักษรชื่อ-นามสกุลนิสิต"
            >
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

          {/* Student Signature Shift */}
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
                <span
                  className="font-mono text-[10px] text-slate-500 w-8 text-center"
                  title="ระยะขยับละเอียด (px)"
                >
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
            {previewTemplate !== 'ENG_CERT' && (
              <label
                className="flex items-center gap-1.5 font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg shadow-xs cursor-pointer hover:bg-indigo-100 transition"
                title="แปลงตัวเลขทั้งหมดในหนังสือเป็นตัวเลขไทย (๑ ๒ ๓ ๔) ตามระเบียบสารบรรณ"
              >
                <input
                  type="checkbox"
                  checked={useThaiNumerals}
                  onChange={(e) => setUseThaiNumerals(e.target.checked)}
                  className="rounded text-indigo-600 cursor-pointer"
                />
                <span>🇹🇭 เลขไทย (๑ ๒ ๓)</span>
              </label>
            )}

            {/* Signer Organization Toggle */}
            <div
              className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200"
              title="เปิด/ปิด หรือแก้ไขชื่อคณะ/มหาวิทยาลัย ใต้ตำแหน่งผู้ลงนาม"
            >
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
          <span>
            <b>คำแนะนำ:</b> ท่านสามารถใช้เมาส์คลิกที่ข้อความใดๆ ในเอกสารด้านล่างนี้
            เพื่อพิมพ์แก้ไขคำ เปลี่ยนชื่อธนาคาร หรือพิมพ์/ลบจุดไข่ปลาได้ทันทีก่อนสั่งพิมพ์หรือดาวน์โหลด PDF
          </span>
        </div>
      </div>
    </div>
  );
}
