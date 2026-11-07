'use client';

import React from 'react';
import { CertificateRequest, SystemSettings } from '@/types';
import { CertTemplateType } from './types';

interface CertPrintPaperProps {
  previewRequest: CertificateRequest;
  previewTemplate: CertTemplateType;
  docFontSize: number;
  docTitleFontSize: number;
  docTitleFontWeight: 'font-normal' | 'font-semibold' | 'font-bold' | 'font-black';
  signerFontSize: number;
  studentSignFontSize: number;
  docLineSpacing: number;
  docSignerOffset: number;
  photoBoxOffsetX: number;
  dotsCount: number;
  headerTitleSpacing: number;
  headerTopSpacing: number;
  docFontFamily: string;
  studentSignAlign: 'left' | 'center' | 'right';
  studentSignOffsetX: number;
  showPhotoBox: boolean;
  showStudentSign: boolean;
  customStudentSignName: string;
  setCustomStudentSignName: (val: string) => void;
  customStudentDots: string;
  setCustomStudentDots: (val: string) => void;
  showQrCode: boolean;
  qrCodeDataUrl: string;
  showSignerOrg: boolean;
  signerOrgCustomText: string;
  useThaiNumerals: boolean;
  customSigner: { name: string; title: string };
  docNoPrefix: '8002' | '8002.1';
  docNoInputModal: string;
  setDocNoInputModal: (val: string) => void;
  customBodyText: string;
  setCustomBodyText: (val: string) => void;
  previewAge: string;
  previewVassa: string;
  settings: SystemSettings;
  currentUser: any;
  fmtNum: (val: string | number | undefined | null, isThai?: boolean) => string;
  sanitizeName: (name?: string) => string;
}

export function CertPrintPaper({
  previewRequest,
  previewTemplate,
  docFontSize,
  docTitleFontSize,
  docTitleFontWeight,
  signerFontSize,
  studentSignFontSize,
  docLineSpacing,
  docSignerOffset,
  photoBoxOffsetX,
  dotsCount,
  headerTitleSpacing,
  headerTopSpacing,
  docFontFamily,
  studentSignAlign,
  studentSignOffsetX,
  showPhotoBox,
  showStudentSign,
  customStudentSignName,
  setCustomStudentSignName,
  customStudentDots,
  setCustomStudentDots,
  showQrCode,
  qrCodeDataUrl,
  showSignerOrg,
  signerOrgCustomText,
  useThaiNumerals,
  customSigner,
  docNoPrefix,
  docNoInputModal,
  setDocNoInputModal,
  customBodyText,
  setCustomBodyText,
  previewAge,
  previewVassa,
  settings,
  currentUser,
  fmtNum,
  sanitizeName,
}: CertPrintPaperProps) {
  return (
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
                  {fmtNum(
                    new Date(previewRequest.createdAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  )}
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
                  <>
                    ถือหนังสือเดินทางเลขที่{' '}
                    <strong className="font-mono font-bold">{fmtNum(previewRequest.passportNo, false)}</strong>{' '}
                  </>
                )}
                รหัสนิสิต <strong className="font-mono font-bold">{fmtNum(previewRequest.studentCode)}</strong> เป็นนิสิตหลักสูตร
                <strong className="font-bold">{previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'}</strong> (ระดับ
                <strong className="font-bold">{previewRequest.degreeLevel || 'ปริญญาตรี'}</strong> หลักสูตร {fmtNum(4)} ปี) ชั้นปีที่{' '}
                <strong className="font-bold">{fmtNum(previewRequest.studentCode.substring(0, 2) ? '1' : '1')}</strong> สาขาวิชา
                <strong className="font-bold">{previewRequest.major || 'พระพุทธศาสนา'}</strong> (
                <strong className="font-bold">ภาคภาษาอังกฤษ</strong>) คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                มีความประสงค์จะทำธุรกรรมกับธนาคาร เพื่ออำนวยความสะดวกในการทำธุรกรรมกับมหาวิทยาลัยในระหว่างที่กำลังศึกษาอยู่ในภาควิชาพระพุทธศาสนา
                คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา
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

            {/* Bottom Footer */}
            <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
              <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                <p className="font-bold text-slate-800">ติดต่อผู้ประสานงาน:</p>
                <p>{settings.facultyNameTh ? `สำนักงาน${settings.facultyNameTh}` : 'สำนักงานคณะพุทธศาสตร์'}</p>
                <p>โทร. {settings.contactPhone || '035-247-8000 ต่อ 8323'}</p>
                <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                <p className="text-purple-700 font-mono">
                  {settings.systemServiceUrl ||
                    (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}
                </p>
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

        {/* TEMPLATE 2: ENG_CERT (TO WHOM IT MAY CONCERN) */}
        {previewTemplate === 'ENG_CERT' && (
          <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
            <div>
              {/* Top Left Office Header */}
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
                  <p className="text-purple-700 font-mono">
                    {settings.systemServiceUrl ||
                      (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}
                  </p>
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

              {/* Centered Title */}
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

              {/* Dean Signer Block */}
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

              {/* Photo Box & Student Signature */}
              <div className="pt-2 flex items-end justify-between">
                <div className="space-y-3">
                  {showPhotoBox && (
                    <div
                      className="w-28 h-36 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs p-2 text-center bg-slate-50/20 transition-transform"
                      style={{ transform: `translateX(${photoBoxOffsetX}px)` }}
                    >
                      <span>
                        ติดรูปถ่าย
                        <br />
                        Photo 1.5 - 2&quot;
                      </span>
                    </div>
                  )}
                  {showStudentSign && (
                    <div className="pt-1 inline-flex flex-col">
                      <div
                        className="flex items-baseline gap-1 text-slate-800"
                        style={{ fontSize: `${Math.max(11, docFontSize - 2)}pt` }}
                      >
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

            {/* Bottom Footer */}
            <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
              <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                <p className="font-bold text-slate-800">
                  {settings.facultyNameEn
                    ? `Faculty of ${settings.facultyNameEn.replace(/^Faculty of /i, '')}`
                    : 'Faculty of Buddhism'}
                </p>
                <p>Tel. {settings.contactPhone ? `+66 ${settings.contactPhone.replace(/^0/, '')}` : '+66 35 248 000 ext. 8323'}</p>
                <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                <p className="text-purple-700 font-mono">
                  {settings.systemServiceUrl ||
                    (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}
                </p>
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

        {/* TEMPLATE 3: INTERNAL_MEMO (บันทึกข้อความราชการ) */}
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
                  <span className="font-bold">วันที่:</span>{' '}
                  {fmtNum(
                    new Date(previewRequest.createdAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  )}
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
                ด้วย <strong className="font-bold">{sanitizeName(previewRequest.fullName)}</strong> รหัสนิสิต{' '}
                <strong className="font-mono font-bold">{fmtNum(previewRequest.studentCode)}</strong>{' '}
                {previewAge && (
                  <>
                    อายุ <strong className="font-bold">{fmtNum(previewAge)}</strong> ปี{' '}
                  </>
                )}
                {previewVassa && (
                  <>
                    พรรษา <strong className="font-bold">{fmtNum(previewVassa)}</strong>{' '}
                  </>
                )}
                สัญชาติ <strong className="font-bold">{previewRequest.nationality || '-'}</strong>{' '}
                {previewRequest.passportNo && (
                  <>
                    ถือหนังสือเดินทางเลขที่{' '}
                    <strong className="font-mono font-bold">{fmtNum(previewRequest.passportNo, false)}</strong>
                  </>
                )}{' '}
                เป็นนิสิตคณะพุทธศาสตร์ หลักสูตร<strong className="font-bold">{previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'}</strong>{' '}
                สาขาวิชา<strong className="font-bold">{previewRequest.major || 'พระพุทธศาสนา'}</strong> ได้ยื่นคำร้องเพื่อขอรับรอง
                <strong className="font-bold">{previewRequest.requestPurpose || previewRequest.certType}</strong>
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
                <p className="text-purple-700 font-mono">
                  {settings.systemServiceUrl ||
                    (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}
                </p>
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
              {/* Header Reference: ที่ อว 8002 / docNo */}
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
                <div></div>
              </div>

              {/* Title with customizable vertical spacing */}
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

              {/* Body Paragraph */}
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
                    <>
                      อายุ <strong className="font-bold">{fmtNum(previewAge)}</strong> ปี{' '}
                    </>
                  )}
                  {previewVassa && (
                    <>
                      พรรษา <strong className="font-bold">{fmtNum(previewVassa)}</strong>{' '}
                    </>
                  )}
                  สัญชาติ <strong className="font-bold">{previewRequest.nationality || 'ไทย'}</strong>{' '}
                  {previewRequest.country && previewRequest.country !== 'Thailand' && (
                    <>
                      ประเทศ <strong className="font-bold">{previewRequest.country}</strong>{' '}
                    </>
                  )}
                  {previewRequest.passportNo && (
                    <>
                      ถือหนังสือเดินทางเลขที่{' '}
                      <strong className="font-mono font-bold">{fmtNum(previewRequest.passportNo, false)}</strong> และวีซ่าประเภท{' '}
                      <strong className="font-bold">{previewRequest.visaType || 'คนอยู่ชั่วคราว (Non-Immigrant Visa)'}</strong>{' '}
                    </>
                  )}
                  เป็นนิสิตคณะพุทธศาสตร์ หลักสูตร<strong className="font-bold">{previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'}</strong>{' '}
                  (ระดับ<strong className="font-bold">{previewRequest.degreeLevel || 'ปริญญาตรี'}</strong> หลักสูตร {fmtNum(4)} ปี) ชั้นปีที่{' '}
                  <strong className="font-bold">{fmtNum(previewRequest.studentCode.substring(0, 2) ? '2' : '1')}</strong> สาขาวิชา{' '}
                  <strong className="font-bold">{previewRequest.major || 'พระพุทธศาสนา'}</strong> (
                  <strong className="font-bold">{previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai' ? 'ภาคภาษาไทย' : 'ภาคภาษาอังกฤษ'}</strong>
                  ) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย รหัสประจำตัวนิสิต{' '}
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
                ให้ไว้ ณ วันที่{' '}
                {fmtNum(
                  new Date(previewRequest.createdAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                )}
              </div>

              {/* Dean / Authorized Signer Block */}
              <div
                className="pt-6 ml-auto w-auto min-w-[20rem] max-w-sm text-center space-y-1.5"
                style={{
                  marginTop: `${docSignerOffset}px`,
                  fontSize: `${signerFontSize}pt`,
                }}
              >
                <div className="h-10" />
                <div contentEditable suppressContentEditableWarning className="font-bold text-slate-900 outline-none focus:bg-purple-50">
                  ({customSigner.name && customSigner.name !== '-' ? customSigner.name : 'พระราชอุดมวัชรเมธี, ผศ.ดร.'})
                </div>
                <div contentEditable suppressContentEditableWarning className="text-slate-800 font-medium outline-none focus:bg-purple-50">
                  {customSigner.title && customSigner.title !== '-' ? customSigner.title : 'คณบดีคณะพุทธศาสตร์'}
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

              {/* Student Photo Box & Student Signature Block */}
              <div className="pt-2 flex items-end justify-between">
                <div className="space-y-3">
                  {showPhotoBox && (
                    <div
                      className="w-28 h-36 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs p-2 text-center bg-slate-50/20 shadow-sm transition-transform"
                      style={{ transform: `translateX(${photoBoxOffsetX}px)` }}
                    >
                      <span>
                        ติดรูปถ่าย
                        <br />
                        {fmtNum('1.5')} - {fmtNum(2)} นิ้ว
                      </span>
                    </div>
                  )}
                  {showStudentSign && (
                    <div className="pt-1 inline-flex flex-col">
                      <div
                        className="flex items-baseline gap-1 text-slate-800"
                        style={{ fontSize: `${Math.max(11, docFontSize - 2)}pt` }}
                      >
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

            {/* Bottom Footer */}
            <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
              <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                <p className="font-bold text-slate-800">{settings.facultyNameTh ? `สำนักงาน${settings.facultyNameTh}` : 'สำนักงานคณะพุทธศาสตร์'}</p>
                <p>โทรศัพท์ {settings.contactPhone || '035-247-8000 ต่อ 8323'}</p>
                <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                <p className="text-purple-700 font-mono">
                  {settings.systemServiceUrl ||
                    (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}
                </p>
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
      </div>
    </div>
  );
}
