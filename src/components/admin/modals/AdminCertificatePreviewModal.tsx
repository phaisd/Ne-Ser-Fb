'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Printer,
  FileText,
  Paperclip,
  ExternalLink,
  Download,
  X,
} from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf-export';
import { calculateNextDocNo } from '@/lib/utils';
import {
  AdminCertificatePreviewModalProps,
  CertTemplateType,
  CustomTextMode,
  CertAttachmentViewer,
  CertCustomizerToolbar,
  CertCustomBodyEditor,
  CertPrintPaper,
} from './certificate-preview';

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

  // Document Customizer States
  const [previewTemplate, setPreviewTemplate] = useState<CertTemplateType>('THAI_STANDARD');
  const [docFontSize, setDocFontSize] = useState<number>(16);
  const [signerFontSize, setSignerFontSize] = useState<number>(14);
  const [studentSignFontSize, setStudentSignFontSize] = useState<number>(14);
  const [docLineSpacing, setDocLineSpacing] = useState<number>(1.6);
  const [docSignerOffset, setDocSignerOffset] = useState<number>(20);
  const [photoBoxOffsetX, setPhotoBoxOffsetX] = useState<number>(0);
  const [dotsCount, setDotsCount] = useState<number>(22);
  const [headerTitleSpacing, setHeaderTitleSpacing] = useState<number>(24);
  const [headerTopSpacing, setHeaderTopSpacing] = useState<number>(0);
  const [docFontFamily, setDocFontFamily] = useState<string>(
    'Sarabun, "TH Sarabun New", "TH Sarabun PSK", sans-serif'
  );
  const [studentSignAlign, setStudentSignAlign] = useState<'left' | 'center' | 'right'>('center');
  const [studentSignOffsetX, setStudentSignOffsetX] = useState<number>(0);
  const [showPhotoBox, setShowPhotoBox] = useState<boolean>(true);
  const [showStudentSign, setShowStudentSign] = useState<boolean>(true);
  const [customStudentSignName, setCustomStudentSignName] = useState<string>('');
  const [customStudentDots, setCustomStudentDots] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [qrScale, setQrScale] = useState<number>(1.3);
  const [pdfDownloading, setPdfDownloading] = useState<boolean>(false);
  const [docTitleFontSize, setDocTitleFontSize] = useState<number>(18);
  const [docTitleFontWeight, setDocTitleFontWeight] = useState<
    'font-normal' | 'font-semibold' | 'font-bold' | 'font-black'
  >('font-bold');
  const [showSignerOrg, setShowSignerOrg] = useState<boolean>(true);
  const [signerOrgCustomText, setSignerOrgCustomText] = useState<string>('');
  const [useThaiNumerals, setUseThaiNumerals] = useState<boolean>(true);

  // Signatory Customization for Print Preview
  const [selectedSignerPreset, setSelectedSignerPreset] = useState<string>('DEAN');
  const [customSigner, setCustomSigner] = useState({
    name: 'พระครูสุธีกิตติบัณฑิต, รศ.ดร.',
    title: 'คณบดีคณะพุทธศาสตร์',
  });

  // Document Number & Custom Body States
  const [docNoInputModal, setDocNoInputModal] = useState<string>('');
  const [docNoPrefix, setDocNoPrefix] = useState<'8002' | '8002.1'>('8002');
  const [isSavingDocNo, setIsSavingDocNo] = useState<boolean>(false);
  const [customBodyText, setCustomBodyText] = useState<string>('');
  const [isCustomTextOpen, setIsCustomTextOpen] = useState<boolean>(false);
  const [customTextMode, setCustomTextMode] = useState<CustomTextMode>('HIGHLIGHT');
  const [previewAge, setPreviewAge] = useState<string>('');
  const [previewVassa, setPreviewVassa] = useState<string>('');

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

  const isMonastic = (name?: string): boolean => {
    if (!name) return false;
    return /^(พระมหา|พระครู|พระปลัด|พระสมุห์|พระใบฎีกา|พระราช|พระเทพ|พระธรรม|พระพรหม|สมเด็จพระ|พระ|สามเณร|Ven\.|Phra)/i.test(
      name.trim()
    );
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
    return calculateNextDocNo(requests).docNoWithYear;
  };

  const computeNextSeqOnly = (): string => {
    return calculateNextDocNo(requests).seqOnly;
  };

  useEffect(() => {
    if (previewRequest) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3020';
      const effectiveDoc = docNoInputModal || previewRequest.docNo || previewRequest.id;
      const verifyUrl = `${origin}/verify?docNo=${encodeURIComponent(effectiveDoc)}`;
      QRCode.toDataURL(verifyUrl, {
        width: 360,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then(setQrCodeDataUrl)
        .catch(() => setQrCodeDataUrl(''));

      if (
        previewRequest.certType?.includes('ธนาคาร') ||
        previewRequest.certType?.includes('Banking') ||
        (previewRequest as any).bankTargetTh
      ) {
        setPreviewTemplate('BANK_LETTER');
      } else if (
        previewRequest.certType?.includes('English') ||
        previewRequest.certType?.includes('CONCERN')
      ) {
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
      const isSec =
        (previewRequest as any).docNoPrefix === '8002.1' ||
        (previewRequest.docNo && previewRequest.docNo.includes('8002.1'));
      setDocNoPrefix(isSec ? '8002.1' : '8002');
      if (previewRequest.docNo) {
        setDocNoInputModal(previewRequest.docNo.replace(/^(ที่\s*)?(อว\s*)?(8002\.1|8002)\s*[\/.]?\s*/i, ''));
      } else {
        setDocNoInputModal(computeNextDocNo());
      }
      setCustomBodyText(previewRequest.customBodyText || '');
      setCustomStudentSignName(sanitizeName(previewRequest.fullName));
      setCustomStudentDots('');
      setPreviewAge(
        previewRequest.age !== undefined && previewRequest.age !== null
          ? String(previewRequest.age)
          : ''
      );
      setPreviewVassa(
        previewRequest.vassa !== undefined && previewRequest.vassa !== null
          ? String(previewRequest.vassa)
          : ''
      );
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
        setPreviewRequest((prev) =>
          prev ? { ...prev, docNo: val, docNoPrefix: currentPrefix } : null
        );
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
        setPreviewRequest((prev) =>
          prev
            ? {
                ...prev,
                customBodyText: customBodyText.trim(),
                age: previewAge.trim() || undefined,
                vassa: previewVassa.trim() || undefined,
              }
            : null
        );
        loadData();
        setActionSuccess('บันทึกข้อความเนื้อหาและข้อมูลตัวแปร (อายุ/พรรษา) เรียบร้อยแล้ว');
      } else {
        alert('บันทึกไม่สำเร็จ: ' + data.error);
      }
    } catch (err: any) {
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    }
  };

  const handleDownloadPdf = async () => {
    if (!previewRequest) return;
    setPdfDownloading(true);
    try {
      const safeName = (previewRequest.fullName || 'student').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');
      const activeDoc = (docNoInputModal || previewRequest.docNo || previewRequest.id).replace(
        /\//g,
        '-'
      );
      const filename = `หนังสือรับรอง_${safeName}_อว8002-${activeDoc}.pdf`;
      await exportElementToPdf('printable-certificate', filename);
    } catch (e) {
      console.error('Download PDF error:', e);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด PDF กรุณาลองใช้ปุ่ม สั่งพิมพ์ (Print to PDF)');
    } finally {
      setPdfDownloading(false);
    }
  };

  if (!previewRequest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`bg-white rounded-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-4 transition-all duration-200 ${
          previewTab === 'ATTACHMENTS' ? 'max-w-5xl' : 'max-w-3xl'
        }`}
      >
        {/* Header Tabs & Close */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewTab('DOCUMENT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                previewTab === 'DOCUMENT'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>ตัวอย่างหนังสือรับรอง (Preview &amp; Print)</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab('ATTACHMENTS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                previewTab === 'ATTACHMENTS'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Paperclip className="w-4 h-4" />
              <span>ตรวจเอกสารสำเนาแนบ</span>
              {previewRequest.enrollmentSlipUrl && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="มีไฟล์แนบ"></span>
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPreviewRequest(null)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 1: ATTACHMENTS VIEW */}
        {previewTab === 'ATTACHMENTS' ? (
          <CertAttachmentViewer
            previewRequest={previewRequest}
            setPreviewRequest={setPreviewRequest}
            setPreviewTab={setPreviewTab}
            handleOpenRejectModal={handleOpenRejectModal}
            setRejectReasonInput={setRejectReasonInput}
            handleApprove={handleApprove}
            loadData={loadData}
            setActionSuccess={setActionSuccess}
          />
        ) : (
          /* Tab 2: DOCUMENT PREVIEW VIEW */
          <>
            <CertCustomizerToolbar
              previewRequest={previewRequest}
              previewTemplate={previewTemplate}
              setPreviewTemplate={setPreviewTemplate}
              selectedSignerPreset={selectedSignerPreset}
              setSelectedSignerPreset={setSelectedSignerPreset}
              activeSignatoriesList={activeSignatoriesList}
              settings={settings}
              customSigner={customSigner}
              setCustomSigner={setCustomSigner}
              docNoPrefix={docNoPrefix}
              setDocNoPrefix={setDocNoPrefix}
              docNoInputModal={docNoInputModal}
              setDocNoInputModal={setDocNoInputModal}
              handleSaveDocNoModal={handleSaveDocNoModal}
              computeNextDocNo={computeNextDocNo}
              computeNextSeqOnly={computeNextSeqOnly}
              isSavingDocNo={isSavingDocNo}
              isCustomTextOpen={isCustomTextOpen}
              setIsCustomTextOpen={setIsCustomTextOpen}
              customBodyText={customBodyText}
              docFontFamily={docFontFamily}
              setDocFontFamily={setDocFontFamily}
              docTitleFontSize={docTitleFontSize}
              setDocTitleFontSize={setDocTitleFontSize}
              docTitleFontWeight={docTitleFontWeight}
              setDocTitleFontWeight={setDocTitleFontWeight}
              docFontSize={docFontSize}
              setDocFontSize={setDocFontSize}
              signerFontSize={signerFontSize}
              setSignerFontSize={setSignerFontSize}
              docLineSpacing={docLineSpacing}
              setDocLineSpacing={setDocLineSpacing}
              docSignerOffset={docSignerOffset}
              setDocSignerOffset={setDocSignerOffset}
              headerTitleSpacing={headerTitleSpacing}
              setHeaderTitleSpacing={setHeaderTitleSpacing}
              headerTopSpacing={headerTopSpacing}
              setHeaderTopSpacing={setHeaderTopSpacing}
              showPhotoBox={showPhotoBox}
              setShowPhotoBox={setShowPhotoBox}
              photoBoxOffsetX={photoBoxOffsetX}
              setPhotoBoxOffsetX={setPhotoBoxOffsetX}
              showStudentSign={showStudentSign}
              setShowStudentSign={setShowStudentSign}
              customStudentDots={customStudentDots}
              setCustomStudentDots={setCustomStudentDots}
              dotsCount={dotsCount}
              setDotsCount={setDotsCount}
              customStudentSignName={customStudentSignName}
              setCustomStudentSignName={setCustomStudentSignName}
              studentSignFontSize={studentSignFontSize}
              setStudentSignFontSize={setStudentSignFontSize}
              studentSignAlign={studentSignAlign}
              setStudentSignAlign={setStudentSignAlign}
              studentSignOffsetX={studentSignOffsetX}
              setStudentSignOffsetX={setStudentSignOffsetX}
              useThaiNumerals={useThaiNumerals}
              setUseThaiNumerals={setUseThaiNumerals}
              showSignerOrg={showSignerOrg}
              setShowSignerOrg={setShowSignerOrg}
              signerOrgCustomText={signerOrgCustomText}
              setSignerOrgCustomText={setSignerOrgCustomText}
              showQrCode={showQrCode}
              setShowQrCode={setShowQrCode}
              qrScale={qrScale}
              setQrScale={setQrScale}
              setPreviewTab={setPreviewTab}
              handleOpenRejectModal={handleOpenRejectModal}
            />

            <CertCustomBodyEditor
              previewRequest={previewRequest}
              isCustomTextOpen={isCustomTextOpen}
              customTextMode={customTextMode}
              setCustomTextMode={setCustomTextMode}
              customBodyText={customBodyText}
              setCustomBodyText={setCustomBodyText}
              previewAge={previewAge}
              setPreviewAge={setPreviewAge}
              previewVassa={previewVassa}
              setPreviewVassa={setPreviewVassa}
              buildDefaultBodyText={buildDefaultBodyText}
              handleSaveCustomBodyText={handleSaveCustomBodyText}
              fmtNum={fmtNum}
              sanitizeName={sanitizeName}
              isMonastic={isMonastic}
            />

            <CertPrintPaper
              previewRequest={previewRequest}
              previewTemplate={previewTemplate}
              docFontSize={docFontSize}
              docTitleFontSize={docTitleFontSize}
              docTitleFontWeight={docTitleFontWeight}
              signerFontSize={signerFontSize}
              studentSignFontSize={studentSignFontSize}
              docLineSpacing={docLineSpacing}
              docSignerOffset={docSignerOffset}
              photoBoxOffsetX={photoBoxOffsetX}
              dotsCount={dotsCount}
              headerTitleSpacing={headerTitleSpacing}
              headerTopSpacing={headerTopSpacing}
              docFontFamily={docFontFamily}
              studentSignAlign={studentSignAlign}
              studentSignOffsetX={studentSignOffsetX}
              showPhotoBox={showPhotoBox}
              showStudentSign={showStudentSign}
              customStudentSignName={customStudentSignName}
              setCustomStudentSignName={setCustomStudentSignName}
              customStudentDots={customStudentDots}
              setCustomStudentDots={setCustomStudentDots}
              showQrCode={showQrCode}
              qrCodeDataUrl={qrCodeDataUrl}
              qrScale={qrScale}
              showSignerOrg={showSignerOrg}
              signerOrgCustomText={signerOrgCustomText}
              useThaiNumerals={useThaiNumerals}
              customSigner={customSigner}
              docNoPrefix={docNoPrefix}
              docNoInputModal={docNoInputModal}
              setDocNoInputModal={setDocNoInputModal}
              customBodyText={customBodyText}
              setCustomBodyText={setCustomBodyText}
              previewAge={previewAge}
              previewVassa={previewVassa}
              settings={settings}
              currentUser={currentUser}
              fmtNum={fmtNum}
              sanitizeName={sanitizeName}
            />

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
              <Link
                href={`/verify?docNo=${encodeURIComponent(
                  previewRequest.docNo || previewRequest.id
                )}`}
                target="_blank"
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
              >
                <ExternalLink className="w-4 h-4 text-purple-600" />
                <span>ตรวจสอบความถูกต้อง (Verify View)</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={pdfDownloading}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition disabled:opacity-50"
                  title="ดาวน์โหลดเป็นไฟล์ PDF คุณภาพสูงลงเครื่องทันที"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {pdfDownloading ? 'กำลังสร้างไฟล์ PDF...' : 'ดาวน์โหลดไฟล์ PDF (Download)'}
                  </span>
                </button>

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
                html,
                body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                }
                body * {
                  visibility: hidden !important;
                }
                #printable-certificate,
                #printable-certificate * {
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
  );
}
