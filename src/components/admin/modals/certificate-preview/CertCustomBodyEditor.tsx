'use client';

import React from 'react';
import {
  FileEdit,
  CheckCircle2,
  RefreshCw,
  Save,
  SlidersHorizontal,
} from 'lucide-react';
import { CertificateRequest } from '@/types';
import { CustomTextMode } from './types';

interface CertCustomBodyEditorProps {
  previewRequest: CertificateRequest;
  isCustomTextOpen: boolean;
  customTextMode: CustomTextMode;
  setCustomTextMode: (val: CustomTextMode) => void;
  customBodyText: string;
  setCustomBodyText: (val: string) => void;
  previewAge: string;
  setPreviewAge: (val: string) => void;
  previewVassa: string;
  setPreviewVassa: (val: string) => void;
  buildDefaultBodyText: (ageVal?: string, vassaVal?: string) => string;
  handleSaveCustomBodyText: () => Promise<void>;
  fmtNum: (val: string | number | undefined | null, isThai?: boolean) => string;
  sanitizeName: (name?: string) => string;
  isMonastic: (name?: string) => boolean;
}

export function CertCustomBodyEditor({
  previewRequest,
  isCustomTextOpen,
  customTextMode,
  setCustomTextMode,
  customBodyText,
  setCustomBodyText,
  previewAge,
  setPreviewAge,
  previewVassa,
  setPreviewVassa,
  buildDefaultBodyText,
  handleSaveCustomBodyText,
  fmtNum,
  sanitizeName,
  isMonastic,
}: CertCustomBodyEditorProps) {
  if (!isCustomTextOpen) return null;

  return (
    <div className="p-4 bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50/80 rounded-2xl border-2 border-amber-300 shadow-md space-y-3.5 print:hidden text-xs animate-in fade-in">
      {/* Top Bar with Mode Switcher & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500 text-white font-bold">
            <FileEdit className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-amber-950 flex items-center gap-1.5">
              <span>แก้ไข / เพิ่มเติม ข้อความต้นฉบับ &amp; แถบสีข้อมูลตัวแปร</span>
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

      {/* Quick-Variable Edit Inputs Bar */}
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
            <span className="font-bold">{sanitizeName(previewRequest.monasticName || previewRequest.fullName)}</span>
          </div>

          {/* Age Input */}
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

          {/* Vassa Input */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-xs transition-all ${
              isMonastic(previewRequest.fullName) || previewVassa
                ? 'bg-yellow-100/90 border-yellow-400 text-yellow-950 ring-1 ring-yellow-400/50'
                : 'bg-yellow-50/60 border-yellow-200 text-yellow-800'
            }`}
          >
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
            <span className="font-bold underline">
              {previewRequest.requestPurpose || previewRequest.certType}
            </span>
          </div>
        </div>
      </div>

      {/* DISPLAY MODE 1: Smart Highlight View */}
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
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-300 font-bold shadow-2xs"
                title="ข้อมูลชื่อ-นามสกุล (หรือ ชื่อ-ฉายา/นามสกุล ในบรรทัดแรก)"
              >
                👤 {sanitizeName(previewRequest.monasticName || previewRequest.fullName)}
              </span>
              {/* Age Badge */}
              {previewAge && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-2xs"
                  title="ข้อมูลอายุ (ปี)"
                >
                  🎂 อายุ {fmtNum(previewAge)} ปี
                </span>
              )}
              {/* Vassa Badge */}
              {previewVassa && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg bg-yellow-100 text-yellow-950 border border-yellow-400 font-bold shadow-2xs"
                  title="ข้อมูลพรรษา (สำหรับบรรพชิต/พระภิกษุ)"
                >
                  ☸️ พรรษา {fmtNum(previewVassa)}
                </span>
              )}
              {/* Nationality Badge */}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold shadow-2xs"
                title="ข้อมูลสัญชาติ"
              >
                🇹🇭 สัญชาติ {previewRequest.nationality || 'ไทย'}
              </span>
              {previewRequest.country && previewRequest.country !== 'Thailand' && (
                <span>
                  {' '}
                  ประเทศ <strong className="font-bold">{previewRequest.country}</strong>{' '}
                </span>
              )}
              {previewRequest.passportNo && (
                <span>
                  {' '}
                  ถือหนังสือเดินทางเลขที่{' '}
                  <strong className="font-mono font-bold">
                    {fmtNum(previewRequest.passportNo, false)}
                  </strong>{' '}
                  และวีซ่าประเภท{' '}
                  <strong className="font-bold">
                    {previewRequest.visaType || 'คนอยู่ชั่วคราว (Non-Immigrant Visa)'}
                  </strong>{' '}
                </span>
              )}
              <span> เป็นนิสิตคณะพุทธศาสตร์ หลักสูตร</span>
              <span className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-lg bg-sky-100 text-sky-900 border border-sky-300 font-bold shadow-2xs">
                🎓 {previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'}
              </span>
              <span>
                {' '}
                (ระดับ{previewRequest.degreeLevel || 'ปริญญาตรี'} หลักสูตร {fmtNum(4)} ปี) ชั้นปีที่{' '}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold shadow-2xs">
                📚 {fmtNum(previewRequest.studentCode.substring(0, 2) ? '2' : '1')}
              </span>
              <span> สาขาวิชา </span>
              <span className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold shadow-2xs">
                📖 {previewRequest.major || 'พระพุทธศาสนา'}
              </span>
              <span>
                {' '}
                ({previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai'
                  ? 'ภาคภาษาไทย'
                  : 'ภาคภาษาอังกฤษ'}
                ) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย รหัสประจำตัวนิสิต{' '}
              </span>
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
          💡 <b>คำแนะนำ:</b> ท่านสามารถกรอกเปลี่ยนค่าอายุหรือพรรษาด้านบนได้ทันที
          หรือสลับเป็นโหมดพิมพ์อิสระหากต้องการพิมพ์ประโยคพิเศษเพิ่มเติม
        </span>
      </p>
    </div>
  );
}
