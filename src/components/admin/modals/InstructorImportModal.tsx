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
  Users,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { UserAccount } from '@/types';
import {
  detectDelimiter,
  splitCSVLines,
  parseCSVRow,
  recombineAcademicTitles,
} from '@/lib/parsers/csvParser';
import { stripLeadingTitles } from '@/lib/utils/name-matcher';

interface InstructorImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingUsers: UserAccount[];
  onSuccess: () => void;
}

export interface ParsedInstructorItem {
  name: string;
  nameEn?: string;
  email?: string;
  gmail?: string;
  department?: string;
  instructorType?: string;
  password?: string;
  isExisting?: boolean;
  existingMatchName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Robust CSV / TSV / Excel text parser for Instructors
// ─────────────────────────────────────────────────────────────────────────────
function parseCSVToInstructors(rawText: string, existingList: UserAccount[]): ParsedInstructorItem[] {
  const lines = splitCSVLines(rawText);
  if (lines.length === 0) return [];

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = parseCSVRow(lines[0], delimiter);
  const normalizedHeaders = rawHeaders.map((h) =>
    h.toLowerCase().replace(/[\s\-_]/g, '')
  );

  // Check if first line is a header
  const isHeaderPresent = normalizedHeaders.some((h) =>
    ['name', 'ชื่อ', 'ชื่ออาจารย์', 'ชื่อสกุล', 'ชื่อนามสกุล', 'fullname', 'อาจารย์', 'email', 'อีเมล', 'department', 'ภาควิชา'].includes(h)
  );

  const startLine = isHeaderPresent ? 1 : 0;
  const parsedList: ParsedInstructorItem[] = [];

  for (let i = startLine; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    let values = parseCSVRow(lines[i], delimiter);
    if (values.length === 0 || values.every((v) => !v.trim())) continue;

    // Smart Recombination for Academic / Monastic Titles with Commas (เช่น พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.)
    values = recombineAcademicTitles(values);

    let name = '';
    let nameEn = '';
    let email = '';
    let gmail = '';
    let department = '';
    let instructorType = '';
    let password = '';

    if (isHeaderPresent) {
      const obj: Record<string, string> = {};
      normalizedHeaders.forEach((h, idx) => {
        obj[h] = values[idx] !== undefined ? values[idx] : '';
      });

      name =
        obj['name'] ||
        obj['ชื่อ'] ||
        obj['ชื่ออาจารย์'] ||
        obj['ชื่อสกุล'] ||
        obj['ชื่อนามสกุล'] ||
        obj['fullname'] ||
        obj['อาจารย์'] ||
        '';

      nameEn =
        obj['nameen'] ||
        obj['englishname'] ||
        obj['ชื่อภาษาอังกฤษ'] ||
        obj['ชื่ออังกฤษ'] ||
        '';

      email =
        obj['email'] ||
        obj['อีเมล'] ||
        obj['อีเมลมหาวิทยาลัย'] ||
        obj['อีเมลmcu'] ||
        obj['mcumail'] ||
        obj['mcuemail'] ||
        obj['อีเมลมหาวิทยาลัย@mcuacth'] ||
        obj['mail'] ||
        obj['e-mail'] ||
        '';

      gmail =
        obj['gmail'] ||
        obj['จีเมล'] ||
        obj['อีเมลส่วนตัว'] ||
        obj['gmailส่วนตัว'] ||
        obj['gmailส่วนตัว@gmailcom'] ||
        obj['อีเมลgmail'] ||
        obj['personalemail'] ||
        '';

      department =
        obj['department'] ||
        obj['ภาควิชา'] ||
        obj['สังกัด'] ||
        obj['สาขาวิชา'] ||
        obj['กลุ่มวิชา'] ||
        obj['คณะ'] ||
        '';

      instructorType =
        obj['type'] ||
        obj['ประเภท'] ||
        obj['ประเภทอาจารย์'] ||
        obj['สถานะอาจารย์'] ||
        obj['ตำแหน่ง'] ||
        '';

      password = obj['password'] || obj['รหัสผ่าน'] || '';
    } else {
      // Positional fallback:
      name = values[0] || '';
      const emails: string[] = [];
      const nonEmails: string[] = [];
      for (let k = 1; k < values.length; k++) {
        const val = (values[k] || '').trim();
        if (val.includes('@')) {
          emails.push(val);
        } else if (val) {
          nonEmails.push(val);
        }
      }

      emails.forEach((em) => {
        if (em.toLowerCase().endsWith('@gmail.com') || em.toLowerCase().includes('gmail')) {
          if (!gmail) gmail = em;
          else if (!email) email = em;
        } else {
          if (!email) email = em;
          else if (!gmail) gmail = em;
        }
      });

      if (nonEmails[0]) department = nonEmails[0];
      if (nonEmails[1]) instructorType = nonEmails[1];
      if (nonEmails[2]) password = nonEmails[2];
    }

    if (!name.trim()) continue;

    // Standardize instructor type
    let cleanType = instructorType.trim();
    if (cleanType.includes('พิเศษ')) cleanType = 'อาจารย์พิเศษ';
    else if (cleanType.includes('ผู้ช่วย') || cleanType.toUpperCase().includes('TA')) cleanType = 'ผู้ช่วยสอน (TA)';
    else if (cleanType.includes('ประจำ')) cleanType = 'อาจารย์ประจำ';
    else if (!cleanType) cleanType = 'อาจารย์ประจำ';

    // Match with existing instructors
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const strippedName = stripLeadingTitles(cleanName);

    const existingMatch = existingList.find((u) => {
      if (cleanEmail && ((u.email || '').toLowerCase() === cleanEmail || (u.gmail || '').toLowerCase() === cleanEmail)) {
        return true;
      }
      if (u.name.trim() === cleanName) return true;
      if (u.aliases && u.aliases.some((al) => al.trim() === cleanName || al.trim() === strippedName)) return true;
      if (stripLeadingTitles(u.name || '') === strippedName && strippedName.length >= 3) return true;
      return false;
    });

    parsedList.push({
      name: cleanName,
      nameEn: nameEn.trim() || undefined,
      email: cleanEmail || undefined,
      gmail: gmail.trim() || undefined,
      department: department.trim() || 'คณะพุทธศาสตร์ มจร',
      instructorType: cleanType,
      password: password.trim() || undefined,
      isExisting: Boolean(existingMatch),
      existingMatchName: existingMatch?.name,
    });
  }

  return parsedList;
}

export const InstructorImportModal: React.FC<InstructorImportModalProps> = ({
  isOpen,
  onClose,
  existingUsers,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'PASTE' | 'FILE'>('PASTE');
  const [pastedText, setPastedText] = useState('');
  const [parsedList, setParsedList] = useState<ParsedInstructorItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process text whenever pastedText changes
  const handleParseText = (text: string) => {
    setPastedText(text);
    setSubmitError(null);
    setSubmitSuccess(null);
    const parsed = parseCSVToInstructors(text, existingUsers);
    setParsedList(parsed);
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleParseText(content);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Download Sample CSV
  const handleDownloadTemplate = () => {
    const headers = 'ชื่อ-นามสกุล,อีเมลมหาวิทยาลัย (@mcu.ac.th),Gmail ส่วนตัว (@gmail.com),ภาควิชา,ประเภทอาจารย์,รหัสผ่านเริ่มต้น';
    const sampleRows = [
      'พระมหาดวงเด่น ฐิตญาโณ,duangden@mcu.ac.th,duangden.thita@gmail.com,ภาควิชาพระพุทธศาสนา,อาจารย์ประจำ,mcu123456',
      '"พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.",jeerawat@mcu.ac.th,jeerawat.mcu@gmail.com,ภาควิชาพระพุทธศาสนา,อาจารย์ประจำ,mcu123456',
      'รศ.ดร.สมชาย บุญมี,somchai.b@mcu.ac.th,somchai.boonmee@gmail.com,ภาควิชาปรัชญา,อาจารย์พิเศษ,mcu123456',
      'Dr. John Smith,john.smith@mcu.ac.th,john.smith.intl@gmail.com,International Program,อาจารย์พิเศษ,mcu123456',
      'พระครูปลัดสุวัฒนบัณฑิตคุณ,,,ภาควิชาศาสนาและปรัชญา,อาจารย์ประจำ,mcu123456',
    ];
    const csvContent = '\uFEFF' + [headers, ...sampleRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_instructors_import.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Execute Batch Import
  const handleExecuteImport = async () => {
    if (parsedList.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch-import-instructors',
          instructors: parsedList.map((item) => ({
            name: item.name,
            nameEn: item.nameEn,
            email: item.email,
            gmail: item.gmail,
            department: item.department,
            instructorType: item.instructorType,
            password: item.password,
            role: 'INSTRUCTOR',
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(
          data.message ||
            `นำเข้าข้อมูลสำเร็จ: เพิ่มอาจารย์ใหม่ ${data.createdCount || 0} ท่าน, อัปเดตข้อมูลเดิม ${data.updatedCount || 0} ท่าน`
        );
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setSubmitError(data.error || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const newCount = parsedList.filter((p) => !p.isExisting).length;
  const existingCount = parsedList.filter((p) => p.isExisting).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>นำเข้าและอัปเดตข้อมูลอาจารย์ผู้สอนเป็นชุด</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  Batch Import & Bulk Update
                </span>
              </h2>
              <p className="text-xs text-emerald-200/80">
                รองรับการคัดลอกจาก Excel มาวาง หรืออัปโหลดไฟล์ CSV เพื่อเพิ่มหรือแก้ไขข้อมูลอาจารย์พร้อมกันหลายท่าน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Subheader / Mode switcher & Template download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('PASTE')}
                className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'PASTE'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>คัดลอกจาก Excel มาวาง (Quick Paste)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('FILE')}
                className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'FILE'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>อัปโหลดไฟล์ CSV (.csv)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>ดาวน์โหลดไฟล์ตัวอย่าง CSV</span>
            </button>
          </div>

          {/* Tab 1: Paste Input */}
          {activeTab === 'PASTE' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                วางข้อมูลรายชื่ออาจารย์ (คัดลอกจากตาราง Excel หรือพิมพ์คั่นด้วย Tab หรือเครื่องหมายจุลภาค ,):
              </label>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => handleParseText(e.target.value)}
                placeholder={`ตัวอย่าง (คัดลอกจาก Excel วางได้ทันที):\nชื่อ-นามสกุล\tอีเมลมหาวิทยาลัย (@mcu.ac.th)\tGmail ส่วนตัว (@gmail.com)\tภาควิชา\tประเภทอาจารย์\nพระมหาดวงเด่น ฐิตญาโณ\tduangden@mcu.ac.th\tduangden.thita@gmail.com\tภาควิชาพระพุทธศาสนา\tอาจารย์ประจำ\n"พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร."\tjeerawat@mcu.ac.th\tjeerawat.mcu@gmail.com\tภาควิชาพระพุทธศาสนา\tอาจารย์ประจำ`}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed bg-slate-50/50"
              />
              <p className="text-[11px] text-slate-400">
                💡 คำแนะนำ: หากไม่ระบุอีเมล MCU ระบบจะสร้างอีเมลอัตโนมัติให้ (เช่น teacher123@mcu.ac.th) พร้อมรหัสผ่านเริ่มต้น mcu123456 และหากมี Gmail ส่วนตัว ระบบจะผูกเข้าบัญชีอาจารย์เพื่อใช้ซิงค์กับ Google Sheets และการแจ้งเตือนให้อัตโนมัติ
              </p>
            </div>
          )}

          {/* Tab 2: File Upload */}
          {activeTab === 'FILE' && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl bg-emerald-50/40 hover:bg-emerald-50/80 transition text-center cursor-pointer space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                  <FileUp className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    คลิกเพื่อเลือกไฟล์ CSV หรือลากไฟล์มาวางที่นี่
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    รองรับไฟล์ .csv (การเข้ารหัสภาษาไทย UTF-8)
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Status Alerts */}
          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedList.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>รายการที่ตรวจพบ ({parsedList.length} ท่าน):</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    + อาจารย์ใหม่ {newCount} ท่าน
                  </span>
                  {existingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      🔄 อัปเดตอาจารย์เดิม {existingCount} ท่าน
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPastedText('');
                    setParsedList([]);
                  }}
                  className="text-xs text-slate-400 hover:text-rose-600 transition cursor-pointer"
                >
                  ล้างรายการทั้งหมด
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-64 shadow-2xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">ชื่อ-นามสกุลอาจารย์</th>
                      <th className="py-2.5 px-3">อีเมล MCU (@mcu.ac.th)</th>
                      <th className="py-2.5 px-3">Gmail ส่วนตัว (@gmail.com)</th>
                      <th className="py-2.5 px-3">ภาควิชา / สังกัด</th>
                      <th className="py-2.5 px-3">ประเภทอาจารย์</th>
                      <th className="py-2.5 px-3 text-center">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          <div>{item.name}</div>
                          {item.nameEn && (
                            <div className="text-[10px] text-slate-400 font-normal font-mono">
                              {item.nameEn}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {item.email ? (
                            <span className="text-emerald-700 font-bold">{item.email}</span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">
                              (ระบบสร้างให้อัตโนมัติ)
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {item.gmail ? (
                            <span className="text-sky-700 font-medium">{item.gmail}</span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {item.department || 'คณะพุทธศาสตร์ มจร'}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.instructorType === 'อาจารย์ประจำ'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : item.instructorType === 'อาจารย์พิเศษ'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {item.instructorType}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          {item.isExisting ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                              🔄 มีในระบบแล้ว (จะอัปเดต)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                              + อาจารย์ใหม่
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

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-medium">
            {parsedList.length > 0
              ? `พร้อมนำเข้าและอัปเดต ${parsedList.length} ท่าน (${newCount} ใหม่, ${existingCount} อัปเดต)`
              : 'กรุณาวางข้อมูลหรืออัปโหลดไฟล์ CSV'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold cursor-pointer transition shadow-2xs disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={parsedList.length === 0 || isSubmitting}
              onClick={handleExecuteImport}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold cursor-pointer transition shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ยืนยันบันทึกข้อมูล ({parsedList.length} ท่าน)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
