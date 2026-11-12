'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileUp,
  Download,
} from 'lucide-react';
import { Student } from '@/types';
import {
  parseCSVToStudents,
  downloadSampleStudentsCSV,
} from '@/components/students/studentCsvParser';

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingStudents: Student[];
  onSuccess: () => void;
}

export function StudentImportModal({
  isOpen,
  onClose,
  existingStudents,
  onSuccess,
}: StudentImportModalProps) {
  const [tab, setTab] = useState<'FILE' | 'PASTE'>('FILE');
  const [rawText, setRawText] = useState('');
  const [parsedList, setParsedList] = useState<Partial<Student>[]>([]);
  const [importMode, setImportMode] = useState<'UPDATE_ONLY' | 'UPSERT'>('UPSERT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      const parsed = parseCSVToStudents(text);
      setParsedList(parsed);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handlePasteChange = (val: string) => {
    setRawText(val);
    const parsed = parseCSVToStudents(val);
    setParsedList(parsed);
  };

  const matchedCount = parsedList.filter((item) =>
    existingStudents.some((s) => s.studentCode === item.studentCode)
  ).length;
  const newCount = parsedList.length - matchedCount;

  const handleExecuteImport = async () => {
    if (parsedList.length === 0) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch-update',
          items: parsedList,
          mode: importMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ นำเข้าข้อมูลสำเร็จเรียบร้อยแล้ว: ${data.message || `${parsedList.length} รายการ`}`);
        onSuccess();
        onClose();
      } else {
        alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Sample CSV Template (Unified with Export CSV structure)
  const handleDownloadSampleCsv = () => {
    downloadSampleStudentsCSV('sample_students_template.csv');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-orange-50 via-white to-amber-50 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-orange-600" />
              <span>นำเข้าข้อมูลทะเบียนนิสิตจากไฟล์ Excel / CSV (Batch Import)</span>
            </h3>
            <p className="text-xs text-slate-500">
              อัปโหลดไฟล์ (.csv, .xlsx, .tsv) หรือคัดลอกจาก Excel / Google Sheets เพื่ออัปเดตหรือเพิ่มนิสิตใหม่ยกชุด
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Controls Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl font-bold">
            <button
              type="button"
              onClick={() => setTab('FILE')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                tab === 'FILE' ? 'bg-white text-orange-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>อัปโหลดไฟล์ (.csv / .tsv)</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('PASTE')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                tab === 'PASTE' ? 'bg-white text-orange-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>วางข้อความจาก Excel (Ctrl+V)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-orange-600" />
            <span>ดาวน์โหลดไฟล์ตัวอย่าง (Template)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {tab === 'FILE' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/40 hover:bg-orange-50/70 rounded-2xl p-8 text-center cursor-pointer transition space-y-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 mx-auto flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-800">
                คลิกเพื่อเลือกไฟล์ CSV หรือส่งออกจาก Excel (.csv, .tsv, .txt)
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                รองรับไฟล์ที่ส่งออกจากระบบโดยตรง: รหัสนิสิต, คำนำหน้า, ชื่อ, นามสกุล, ระดับการศึกษา (ปริญญาตรี/โท/เอก/ใบประกาศนียบัตร), หลักสูตร, สาขาวิชา, ชั้นปี, สัญชาติ, Passport, GPA, ที่อยู่, อีเมล
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                วางข้อความตารางจาก Excel หรือ Google Sheets (กดเลือกคอลัมน์แล้ว Copy มาวาง):
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder={`รหัสนิสิต\tคำนำหน้า\tชื่อ\tนามสกุล\tระดับการศึกษา\tหลักสูตร\tสาขาวิชา\tชั้นปี\n6801502001\tพระ\tสมชาย\tใจดี\tปริญญาตรี\tRegular\tพระพุทธศาสนา\t1\n6801502002\tVen.\tDhammapala\t\tปริญญาโท\tInternational\tพระพุทธศาสนา\t2`}
                className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          )}

          {/* Parsed Preview Section */}
          {parsedList.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    ตรวจพบข้อมูล {parsedList.length} รายการ:
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    อัปเดตข้อมูลเดิม {matchedCount} คน
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-bold">
                    เพิ่มนิสิตใหม่ {newCount} คน
                  </span>
                </div>

                {/* Import Mode Radio */}
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="importMode"
                      value="UPSERT"
                      checked={importMode === 'UPSERT'}
                      onChange={() => setImportMode('UPSERT')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span>อัปเดตเดิม + เพิ่มใหม่ (UPSERT)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="importMode"
                      value="UPDATE_ONLY"
                      checked={importMode === 'UPDATE_ONLY'}
                      onChange={() => setImportMode('UPDATE_ONLY')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span>อัปเดตเฉพาะคนที่มีอยู่เดิม (UPDATE ONLY)</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 border-b font-bold sticky top-0">
                    <tr>
                      <th className="p-2 w-10 text-center">#</th>
                      <th className="p-2">รหัสนิสิต</th>
                      <th className="p-2">ชื่อ - สกุล</th>
                      <th className="p-2">ระดับการศึกษา</th>
                      <th className="p-2">หลักสูตร</th>
                      <th className="p-2">สาขาวิชา</th>
                      <th className="p-2">ชั้นปี</th>
                      <th className="p-2 text-center">สถานะในระบบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedList.slice(0, 100).map((item, idx) => {
                      const existing = existingStudents.find((s) => s.studentCode === item.studentCode);
                      const exists = Boolean(existing);
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-2 font-mono font-bold text-slate-800">{item.studentCode}</td>
                          <td className="p-2 font-medium">{item.fullName || item.firstName || existing?.fullName || '-'}</td>
                          <td className="p-2 text-slate-700 font-semibold">{item.degree || existing?.degree || 'ปริญญาตรี'}</td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.programType === 'ENGLISH' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {item.programType === 'ENGLISH' ? 'International' : 'Regular'}
                            </span>
                          </td>
                          <td className="p-2 text-slate-600">{item.major || existing?.major || '-'}</td>
                          <td className="p-2 font-mono">{item.yearLevel ? `ปี ${item.yearLevel}` : (existing?.yearLevel ? `ปี ${existing.yearLevel}` : '-')}</td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              exists
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {exists ? '🔄 มีอยู่แล้ว (อัปเดต)' : '+ นิสิตใหม่'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            {parsedList.length > 0 ? `พร้อมนำเข้า ${parsedList.length} รายการ` : 'กรุณาอัปโหลดไฟล์หรือวางข้อมูล'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer transition"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={parsedList.length === 0 || isSubmitting}
              onClick={handleExecuteImport}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer transition shadow-md shadow-orange-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึกลงระบบ & Sheets...' : `ยืนยันนำเข้าข้อมูล (${parsedList.length} คน)`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default StudentImportModal;
