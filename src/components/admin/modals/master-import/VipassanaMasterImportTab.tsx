'use client';

import React from 'react';
import {
  Sparkles,
  FileSpreadsheet,
  Download,
  Key,
  FileUp,
  Upload,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { ParsedMasterItem } from './types';

interface VipassanaMasterImportTabProps {
  handleDownloadTemplateXlsx: () => void;
  handleDownloadTemplateCsv: () => void;
  passwordOption: 'mcu123456' | 'vp2569' | 'custom';
  setPasswordOption: (opt: 'mcu123456' | 'vp2569' | 'custom') => void;
  rawText: string;
  setRawText: (val: string) => void;
  parseRawTextToMasters: (txt: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleTextChange: (text: string) => void;
  parsedList: ParsedMasterItem[];
  setParsedList: (list: ParsedMasterItem[]) => void;
  submitSuccess: string | null;
  submitError: string | null;
  lastCreatedList: ParsedMasterItem[];
  handleExportXlsx: (list?: ParsedMasterItem[]) => void;
}

export const VipassanaMasterImportTab: React.FC<VipassanaMasterImportTabProps> = ({
  handleDownloadTemplateXlsx,
  handleDownloadTemplateCsv,
  passwordOption,
  setPasswordOption,
  rawText,
  setRawText,
  parseRawTextToMasters,
  handleFileUpload,
  fileInputRef,
  handleTextChange,
  parsedList,
  setParsedList,
  submitSuccess,
  submitError,
  lastCreatedList,
  handleExportXlsx,
}) => {
  return (
    <div className="space-y-5">
      {/* Top Action Card: Download Template */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 rounded-2xl border border-amber-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-bold text-amber-950">ขั้นตอนที่ 1: เตรียมไฟล์รายชื่อพระวิปัสสนาจารย์</h4>
          </div>
          <p className="text-xs text-slate-600">
            ดาวน์โหลดเทมเพลต Excel ที่จัดคอลัมน์ชื่อไทย, ชื่ออังกฤษ, ตำแหน่งในโครงการ, ตำแหน่งทางคณะสงฆ์, หน่วยงาน/ภาควิชา และที่อยู่ติดต่อ ไว้อย่างถูกต้อง
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadTemplateXlsx}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>เทมเพลต Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadTemplateCsv}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV (.csv)</span>
          </button>
        </div>
      </div>

      {/* Password & ID Settings */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Key className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-slate-800">
            ขั้นตอนที่ 2: รูปแบบการสร้างไอดีและรหัสผ่านอัตโนมัติ
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
            <span className="font-bold text-amber-900 block">รูปแบบไอดีอัตโนมัติ (Login Username / Email):</span>
            <p className="text-slate-600 text-[11.5px]">
              ระบบจะสร้างไอดีลำดับอัตโนมัติ เช่น <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold text-amber-950">vipassana01@mcu.ac.th</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold text-amber-950">vipassana02</code> ต่อเนื่องโดยไม่ซ้ำกับบัญชีเดิมในระบบ
            </p>
          </div>

          <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 block">รหัสผ่านเริ่มต้น (Default Password):</span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="pwdOpt"
                  checked={passwordOption === 'mcu123456'}
                  onChange={() => {
                    setPasswordOption('mcu123456');
                    if (rawText) parseRawTextToMasters(rawText);
                  }}
                  className="accent-amber-600"
                />
                <span className="font-semibold text-slate-800">mcu123456 (มาตรฐาน มจร)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="pwdOpt"
                  checked={passwordOption === 'vp2569'}
                  onChange={() => {
                    setPasswordOption('vp2569');
                    if (rawText) parseRawTextToMasters(rawText);
                  }}
                  className="accent-amber-600"
                />
                <span className="font-semibold text-slate-800">Vp@2569#01 (รหัสเฉพาะปี 69)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area: Upload or Paste */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <FileUp className="w-4 h-4 text-amber-600" />
            ขั้นตอนที่ 3: อัปโหลดไฟล์ หรือคัดลอกแถวจาก Excel มาวาง
          </span>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls, .csv, .txt, .tsv"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
              title="เลือกไฟล์ Excel (.xlsx) หรือ CSV เพื่อนำเข้าข้อมูล"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>เลือกไฟล์ Excel (.xlsx) / CSV</span>
            </button>
            {rawText && (
              <button
                type="button"
                onClick={() => {
                  setRawText('');
                  setParsedList([]);
                }}
                className="text-xs text-red-600 hover:underline cursor-pointer"
              >
                ล้างข้อมูล
              </button>
            )}
          </div>
        </div>

        <textarea
          rows={4}
          value={rawText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={`วางแถวข้อมูลจาก Excel ที่คัดลอกมา เช่น:\n1\tพระธรรมวชิรมุนี\tPhra Dhammavajiramuni\tประธานพระวิปัสสนาจารย์\n2\tพระมหาบุญช่วย ปภสฺสโร\tPhra Maha Boonchuay Pabhassaro\tรองประธานพระวิปัสสนาจารย์\n3\tพระครูปลัดสุวัฒนบัณฑิตคุณ\t\tเลขานุการพระวิปัสสนาจารย์\n4\tพระอาจารย์มหาเอกสิทธิ์\t\tพระวิปัสสนาจารย์`}
          className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      {/* Preview Table */}
      {parsedList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
          <div className="px-4 py-3 bg-amber-50/70 border-b border-amber-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-950">
                ตรวจสอบรายการเตรียมนำเข้า ({parsedList.length} รูป)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                สร้างใหม่ {parsedList.filter((p) => !p.isExisting).length}
              </span>
              {parsedList.filter((p) => p.isExisting).length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-sky-100 text-sky-800">
                  อัปเดตเดิม {parsedList.filter((p) => p.isExisting).length}
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 text-center w-12">ลำดับ</th>
                  <th className="p-2.5">ชื่อ-ฉายา (ไทย)</th>
                  <th className="p-2.5">ชื่ออังกฤษ (English)</th>
                  <th className="p-2.5">ตำแหน่งโครงการ</th>
                  <th className="p-2.5">ตำแหน่งทางคณะสงฆ์</th>
                  <th className="p-2.5">หน่วยงาน/ภาควิชา</th>
                  <th className="p-2.5">ที่อยู่ติดต่อ/วัด</th>
                  <th className="p-2.5">ไอดีเข้าใช้งาน (Login ID)</th>
                  <th className="p-2.5">รหัสผ่าน (Password)</th>
                  <th className="p-2.5 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/30 transition">
                    <td className="p-2.5 text-center font-mono text-slate-500 font-semibold">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                    <td className="p-2.5 text-slate-600 font-serif">{item.nameEn || '-'}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          item.position.includes('ประธาน') && !item.position.includes('รอง')
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : item.position.includes('รองประธาน')
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                            : item.position.includes('เลขา')
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {item.position}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-700">{item.ecclesiasticalTitle || '-'}</td>
                    <td className="p-2.5 text-slate-600 text-[11px]">{item.department || '-'}</td>
                    <td className="p-2.5 text-slate-600 text-[11px] max-w-[160px] truncate" title={item.contactAddress}>
                      {item.contactAddress || '-'}
                    </td>
                    <td className="p-2.5 font-mono text-[11px] font-semibold text-amber-900">
                      {item.email}
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-slate-700 bg-slate-50/60 px-2 rounded">
                      {item.password}
                    </td>
                    <td className="p-2.5 text-center">
                      {item.isExisting ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                          อัปเดตเดิม
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          สร้างใหม่
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status & Feedback message */}
      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{submitSuccess}</span>
          </div>
          {lastCreatedList.length > 0 && (
            <button
              type="button"
              onClick={() => handleExportXlsx(lastCreatedList)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดไฟล์ผลลัพธ์พร้อมรหัสผ่าน (.xlsx)</span>
            </button>
          )}
        </div>
      )}

      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-900 font-bold">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}
    </div>
  );
};
