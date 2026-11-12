'use client';

import React, { useRef } from 'react';
import {
  FileSpreadsheet,
  FileDown,
  AlertCircle,
  Upload,
  Check,
  Save,
} from 'lucide-react';
import { Student } from './types';

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importTab: 'FILE' | 'PASTE';
  setImportTab: (tab: 'FILE' | 'PASTE') => void;
  importMode: 'UPDATE_ONLY' | 'UPSERT';
  setImportMode: (mode: 'UPDATE_ONLY' | 'UPSERT') => void;
  importRawText: string;
  onPasteChange: (text: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  importParsedList: Partial<Student>[];
  students: Student[];
  onExecuteImport: () => Promise<void>;
  importSaving: boolean;
}

export function StudentImportModal({
  isOpen,
  onClose,
  importTab,
  setImportTab,
  importMode,
  setImportMode,
  importRawText,
  onPasteChange,
  onFileUpload,
  onDownloadTemplate,
  importParsedList,
  students,
  onExecuteImport,
  importSaving,
}: StudentImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-100 text-orange-700">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  นำเข้าและแก้ไขข้อมูลนิสิตเป็นชุด (Batch Import / Bulk Update)
                </h3>
                <p className="text-xs text-slate-500">
                  อัปเดตสถานภาพ, หลักสูตร, หมายเหตุ ฯลฯ ของนิสิตหลายรายการพร้อมกัน และซิงค์ลง Google Sheets อัตโนมัติ
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Import Options Bar: Tabs & Template Download */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-200 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setImportTab('FILE')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                importTab === 'FILE'
                  ? 'bg-white text-orange-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📁 อัปโหลดไฟล์ CSV / Excel
            </button>
            <button
              type="button"
              onClick={() => setImportTab('PASTE')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                importTab === 'PASTE'
                  ? 'bg-white text-orange-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 คัดลอกและวางข้อความ (Paste)
            </button>
          </div>

          {/* Download Template Button */}
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-semibold transition cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-orange-600" />
            <span>ดาวน์โหลดแม่แบบ CSV (Template)</span>
          </button>
        </div>

        {/* Import Mode Selection */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-amber-900">เลือกโหมดการนำเข้า:</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="radio"
                name="importMode"
                value="UPDATE_ONLY"
                checked={importMode === 'UPDATE_ONLY'}
                onChange={() => setImportMode('UPDATE_ONLY')}
                className="text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
              <span>อัปเดตเฉพาะนิสิตที่มีอยู่แล้ว (จับคู่ด้วยรหัสนิสิต)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="radio"
                name="importMode"
                value="UPSERT"
                checked={importMode === 'UPSERT'}
                onChange={() => setImportMode('UPSERT')}
                className="text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
              <span>อัปเดตเดิม + เพิ่มนิสิตใหม่ (Upsert)</span>
            </label>
          </div>
        </div>

        {/* Input Method Content */}
        {importTab === 'FILE' ? (
          <div className="border-2 border-dashed border-slate-300 hover:border-orange-400 rounded-2xl p-6 text-center bg-slate-50/50 transition">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.tsv,.txt"
              onChange={onFileUpload}
              className="hidden"
              id="student-csv-file"
            />
            <label
              htmlFor="student-csv-file"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-800">
                คลิกเพื่อเลือกไฟล์ CSV หรือ Excel (.csv, .tsv, .txt)
              </div>
              <p className="text-xs text-slate-500 max-w-md">
                รองรับไฟล์ที่ส่งออกจากระบบโดยตรง: รหัสนิสิต, คำนำหน้า, ชื่อ, นามสกุล, ระดับการศึกษา (ปริญญาตรี/โท/เอก/ใบประกาศนียบัตร), หลักสูตร, สาขาวิชา, ชั้นปี, สถานภาพ, หมายเหตุ ฯลฯ
              </p>
            </label>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              วางข้อมูลจาก Excel หรือ Google Sheets (คัดลอกแถวและคอลัมน์มาวางได้ทันที):
            </label>
            <textarea
              rows={6}
              value={importRawText}
              onChange={(e) => onPasteChange(e.target.value)}
              placeholder={`รหัสนิสิต\tคำนำหน้า\tชื่อ\tนามสกุล\tระดับการศึกษา\tหลักสูตร\tสถานภาพ\tหมายเหตุ\n6801502001\tพระ\tสมชาย\tใจดี\tปริญญาตรี\tRegular\tย้ายเข้า\tย้ายมาจากวิทยาเขตเชียงใหม่\n6801502002\tVen.\tDhammapala\t\tปริญญาโท\tInternational\tเทียบโอน\tเทียบโอน 36 หน่วยกิต`}
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        )}

        {/* Live Parsed Preview Table */}
        {importParsedList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  ผลการตรวจสอบข้อมูล (ตรวจพบ {importParsedList.length} รายการ):
                </span>
                {(() => {
                  const matched = importParsedList.filter((item) =>
                    students.some((s) => s.studentCode === item.studentCode)
                  ).length;
                  const newCodes = importParsedList.length - matched;
                  return (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        ตรงกับในระบบ {matched} คน
                      </span>
                      {newCodes > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                          รหัสใหม่ {newCodes} คน
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="px-3 py-2">รหัสนิสิต</th>
                    <th className="px-3 py-2">ชื่อนิสิต (เดิม/ใหม่)</th>
                    <th className="px-3 py-2">ระดับการศึกษา</th>
                    <th className="px-3 py-2">สถานภาพที่จะปรับปรุง</th>
                    <th className="px-3 py-2">หลักสูตร</th>
                    <th className="px-3 py-2">หมายเหตุ</th>
                    <th className="px-3 py-2">สถานะในระบบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importParsedList.slice(0, 100).map((item, idx) => {
                    const existing = students.find((s) => s.studentCode === item.studentCode);
                    const isMatched = !!existing;

                    return (
                      <tr key={idx} className={isMatched ? 'hover:bg-slate-50' : 'bg-amber-50/30'}>
                        <td className="px-3 py-2 font-mono font-bold text-orange-600">
                          {item.studentCode}
                        </td>
                        <td className="px-3 py-2">
                          {item.fullName || (existing ? existing.fullName : '-')}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-700">
                          {item.degree || existing?.degree || 'ปริญญาตรี'}
                        </td>
                        <td className="px-3 py-2">
                          {item.studyStatus ? (
                            <span className="px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800">
                              {item.studyStatus}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              ไม่เปลี่ยน ({existing?.studyStatus || 'ปกติ'})
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {item.programType ? (
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                item.programType === 'ENGLISH'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {item.programType === 'ENGLISH' ? '🌐 ภาคอังกฤษ' : '🇹🇭 ภาคไทย'}
                            </span>
                          ) : (
                            <span className="text-slate-400">ไม่เปลี่ยน</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{item.remarks || '-'}</td>
                        <td className="px-3 py-2">
                          {isMatched ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> พบในระบบ
                            </span>
                          ) : (
                            <span className="text-amber-600 font-bold">
                              {importMode === 'UPSERT' ? '+ เพิ่มใหม่' : '⚠ ข้าม (ไม่พบ)'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            disabled={importParsedList.length === 0 || importSaving}
            onClick={onExecuteImport}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>
              {importSaving
                ? 'กำลังบันทึกและซิงค์ Sheets...'
                : `ยืนยันการนำเข้าและบันทึก (${importParsedList.length} รายการ)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
