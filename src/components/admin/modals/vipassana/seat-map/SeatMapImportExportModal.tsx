import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Upload,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';

export interface SeatingImportPreviewRow {
  studentCode: string;
  studentName: string;
  seatNumber: string;
  seatZone: string;
  vasa?: number | string;
  seatCheckedIn?: boolean;
  status: 'VALID' | 'DUPLICATE_SEAT' | 'NOT_FOUND';
  statusNote?: string;
}

export interface SeatMapImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  registrationsCount: number;
  importExportTab: 'EXPORT' | 'IMPORT';
  setImportExportTab: (tab: 'EXPORT' | 'IMPORT') => void;
  onExportXlsx: () => void;
  onExportCsv: () => void;
  onDownloadBlankTemplate: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importFileName: string;
  importRawText: string;
  onPasteText: (text: string) => void;
  resetExistingSeats: boolean;
  setResetExistingSeats: (reset: boolean) => void;
  importPreviewRows: SeatingImportPreviewRow[];
  isImporting: boolean;
  onApplyImport: () => void;
}

export const SeatMapImportExportModal: React.FC<SeatMapImportExportModalProps> = ({
  isOpen,
  onClose,
  eventTitle,
  registrationsCount,
  importExportTab,
  setImportExportTab,
  onExportXlsx,
  onExportCsv,
  onDownloadBlankTemplate,
  onFileUpload,
  importFileName,
  importRawText,
  onPasteText,
  resetExistingSeats,
  setResetExistingSeats,
  importPreviewRows,
  isImporting,
  onApplyImport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-indigo-300" />
            <div>
              <h4 className="font-extrabold text-sm sm:text-base">
                นำเข้า / ส่งออกผังที่นั่ง (Excel & CSV)
              </h4>
              <p className="text-[11px] text-indigo-200">
                {eventTitle} • จัดสรรที่นั่งอิสระด้วยไฟล์ Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setImportExportTab('EXPORT')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              importExportTab === 'EXPORT'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>📤 ส่งออกไฟล์ (Export)</span>
          </button>
          <button
            type="button"
            onClick={() => setImportExportTab('IMPORT')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              importExportTab === 'IMPORT'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>📥 นำเข้าไฟล์ (Import)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {importExportTab === 'EXPORT' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 text-indigo-900 space-y-1">
                <div className="font-bold">คำแนะนำการส่งออก:</div>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  ไฟล์ที่ส่งออกจะรวบรวมรายชื่อผู้เข้าร่วมโครงการทั้งหมด ({registrationsCount} ท่าน) พร้อมสถานภาพ (พระภิกษุ/สามเณร/แม่ชี/ฆราวาส), พรรษา (เฉพาะพระภิกษุ), หลักสูตรภาษา (ไทย/Inter), กลุ่ม, หมายเลขที่นั่ง, โซน, และสถานะตรวจเช็คผู้เข้าที่นั่ง (วันเวลาเช็คอิน, ผู้ตรวจเช็ค) ท่านสามารถนำไปกำหนดเลขที่นั่งหรือบันทึกเช็คอินในโปรแกรม Excel ได้อย่างอิสระ แล้วนำกลับมาอัปโหลดในแท็บ &quot;นำเข้า&quot;
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={onExportXlsx}
                  className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 hover:bg-emerald-100/60 transition text-left space-y-2 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      <span>ดาวน์โหลดไฟล์ Excel (.xlsx)</span>
                    </span>
                    <Download className="w-4 h-4 text-emerald-600 group-hover:translate-y-0.5 transition" />
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    ไฟล์สมบูรณ์ มีการจัดรูปแบบหัวตารางให้อ่านง่าย รองรับ Microsoft Excel และ Google Sheets
                  </p>
                </button>

                <button
                  type="button"
                  onClick={onExportCsv}
                  className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50/50 hover:bg-blue-100/60 transition text-left space-y-2 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-blue-950 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>ดาวน์โหลดไฟล์ CSV (.csv)</span>
                    </span>
                    <Download className="w-4 h-4 text-blue-600 group-hover:translate-y-0.5 transition" />
                  </div>
                  <p className="text-[11px] text-blue-800">
                    ไฟล์ CSV มาตรฐานพร้อม UTF-8 BOM สำหรับเปิดในโปรแกรมสเปรดชีตอื่นๆ
                  </p>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onDownloadBlankTemplate}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>ดาวน์โหลดแม่แบบผังที่นั่งเปล่า (Blank Template)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Upload Box */}
              <div className="p-4 border-2 border-dashed border-indigo-300 rounded-2xl bg-indigo-50/40 text-center space-y-2 relative hover:bg-indigo-50/70 transition">
                <input
                  type="file"
                  accept=".xlsx,.csv,.tsv,.txt"
                  onChange={onFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-indigo-600 mx-auto" />
                <div className="font-extrabold text-xs text-indigo-950">
                  คลิกเพื่อเลือกไฟล์ หรือลากไฟล์ Excel (.xlsx) / CSV มาวางที่นี่
                </div>
                <div className="text-[10px] text-slate-500">
                  ระบบจะตรวจจับคอลัมน์รหัสนิสิต หมายเลขที่นั่ง โซน พรรษา(ถ้ามี) และสถานะตรวจเช็คเข้าที่นั่งให้อัตโนมัติ
                </div>
                <div className="text-[10px] text-amber-700 font-semibold">
                  💡 คอลัมน์ &quot;พรรษา(ถ้ามี)&quot; ใส่เฉพาะพระภิกษุ (ตัวเลข เช่น 5) • สามเณร/สามเณรี/แม่ชี/ฆราวาส ให้เว้นว่างได้เลย
                </div>
                {importFileName && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-indigo-200 text-indigo-800 text-[11px] font-bold shadow-xs">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ไฟล์ที่เลือก: {importFileName}</span>
                  </div>
                )}
              </div>

              {/* Paste alternative */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  หรือคัดลอก (Copy) ข้อมูลจาก Excel แล้วนำมาวางในช่องนี้:
                </label>
                <textarea
                  rows={3}
                  value={importRawText}
                  onChange={(e) => onPasteText(e.target.value)}
                  placeholder="วางข้อมูล เช่น: 6701501001 [Tab] A-01 หรือวางทั้งตารางจาก Excel..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-[11px] focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>

              {/* Reset Option Before Import */}
              <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="resetExistingSeatsCheck"
                  checked={resetExistingSeats}
                  onChange={(e) => setResetExistingSeats(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer w-4 h-4 shrink-0"
                />
                <label
                  htmlFor="resetExistingSeatsCheck"
                  className="text-xs text-amber-950 cursor-pointer select-none"
                >
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>รีเซ็ตผังที่นั่งเดิมทั้งหมดก่อนนำเข้า (แนะนำ)</span>
                  </span>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                    ล้างผังที่นั่งเดิมในระบบออกทั้งหมดก่อนนำเข้า เพื่อป้องกันที่นั่งค้างหรือซ้ำซ้อน และอัปเดตเฉพาะนิสิตในทะเบียนกลุ่ม ({registrationsCount} คน)
                  </p>
                </label>
              </div>

              {/* Preview Table */}
              {importPreviewRows.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <span>ตัวอย่างข้อมูลที่ตรวจพบ ({importPreviewRows.length} รายการ)</span>
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-emerald-700 font-bold">
                        ✓ ถูกต้อง: {importPreviewRows.filter((r) => r.status === 'VALID').length}
                      </span>
                      {importPreviewRows.some((r) => r.status === 'DUPLICATE_SEAT') && (
                        <span className="text-amber-700 font-bold">
                          ⚠️ ที่นั่งซ้ำ: {importPreviewRows.filter((r) => r.status === 'DUPLICATE_SEAT').length}
                        </span>
                      )}
                      {importPreviewRows.some((r) => r.status === 'NOT_FOUND') && (
                        <span className="text-rose-700 font-bold">
                          ❌ ไม่พบรหัส: {importPreviewRows.filter((r) => r.status === 'NOT_FOUND').length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 font-bold border-b">
                        <tr>
                          <th className="p-2 w-28">รหัสนิสิต</th>
                          <th className="p-2">ชื่อผู้เข้าร่วม</th>
                          <th className="p-2 w-16 text-center">พรรษา</th>
                          <th className="p-2 w-24">เลขที่นั่ง</th>
                          <th className="p-2 w-20">โซน</th>
                          <th className="p-2 w-28 text-center">ตรวจเช็คเข้าที่นั่ง</th>
                          <th className="p-2 w-28 text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreviewRows.slice(0, 100).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-slate-800">{row.studentCode}</td>
                            <td className="p-2 text-slate-700 truncate max-w-[140px]">{row.studentName}</td>
                            <td className="p-2 text-center font-mono text-amber-700 font-bold">
                              {row.vasa ? row.vasa : <span className="text-slate-300">-</span>}
                            </td>
                            <td className="p-2 font-mono font-extrabold text-indigo-700">
                              {row.seatNumber || '-'}
                            </td>
                            <td className="p-2 text-slate-500">{row.seatZone || '-'}</td>
                            <td className="p-2 text-center">
                              {row.seatCheckedIn === true ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  ✓ เช็คอินแล้ว
                                </span>
                              ) : row.seatCheckedIn === false ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                  ยังไม่เข้าที่นั่ง
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {row.status === 'VALID' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  ✓ พร้อมบันทึก
                                </span>
                              ) : row.status === 'DUPLICATE_SEAT' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800" title={row.statusNote}>
                                  ⚠️ ที่นั่งซ้ำ
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800" title={row.statusNote}>
                                  ❌ ไม่พบรหัส
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            ปิด
          </button>

          {importExportTab === 'IMPORT' && (
            <button
              type="button"
              onClick={onApplyImport}
              disabled={isImporting || importPreviewRows.filter((r) => r.status !== 'NOT_FOUND').length === 0}
              className="px-5 py-2 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {isImporting
                  ? 'กำลังบันทึกข้อมูล...'
                  : `ยืนยันบันทึกผังที่นั่ง (${importPreviewRows.filter((r) => r.status !== 'NOT_FOUND').length} คน)`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
