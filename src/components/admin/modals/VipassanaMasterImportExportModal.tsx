'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  AlertCircle,
  Download,
  Users,
  Sparkles,
  Award,
  Key,
  ShieldCheck,
  Search,
  Filter,
  Copy,
  Printer,
  ChevronRight,
  FileUp,
  RefreshCw,
} from 'lucide-react';
import { UserAccount } from '@/types';
import {
  detectDelimiter,
  splitCSVLines,
  parseCSVRow,
  recombineAcademicTitles,
} from '@/lib/parsers/csvParser';
import { stripLeadingTitles } from '@/lib/utils/name-matcher';
import { downloadXlsx, type XlsxSheet } from '@/lib/utils/xlsx-export';

interface VipassanaMasterImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingUsers: UserAccount[];
  onSuccess: () => void;
}

export interface ParsedMasterItem {
  id?: string;
  name: string;
  nameEn?: string;
  position: string; // ประธาน, รองประธาน, พระวิปัสสนาจารย์, เลขานุการ, ฯลฯ
  email: string;
  password: string;
  isExisting?: boolean;
  existingMatchName?: string;
}

// Standard positions list
const STANDARD_POSITIONS = [
  'ประธานพระวิปัสสนาจารย์',
  'รองประธานพระวิปัสสนาจารย์',
  'พระวิปัสสนาจารย์',
  'เลขานุการพระวิปัสสนาจารย์',
  'ผู้ช่วยเลขานุการพระวิปัสสนาจารย์',
];

export const VipassanaMasterImportExportModal: React.FC<VipassanaMasterImportExportModalProps> = ({
  isOpen,
  onClose,
  existingUsers,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'IMPORT' | 'EXPORT'>('IMPORT');

  // ===================== IMPORT TAB STATES =====================
  const [rawText, setRawText] = useState('');
  const [passwordOption, setPasswordOption] = useState<'mcu123456' | 'vp2569' | 'custom'>('mcu123456');
  const [customPassword, setCustomPassword] = useState('Vp@2569');
  const [parsedList, setParsedList] = useState<ParsedMasterItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastCreatedList, setLastCreatedList] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===================== EXPORT TAB STATES =====================
  const [exportSearch, setExportSearch] = useState('');
  const [exportPositionFilter, setExportPositionFilter] = useState('ALL');

  // List of current Vipassana Masters in the system
  const currentMasters = useMemo(() => {
    return existingUsers.filter((u) => {
      if (u.role === 'VIPASSANA_MASTER') return true;
      const type = (u.instructorType || '').toLowerCase();
      return type.includes('วิปัสสนา') || type.includes('ประธาน') || type.includes('เลขานุการ');
    });
  }, [existingUsers]);

  // Filtered masters for export table
  const filteredMasters = useMemo(() => {
    return currentMasters.filter((m) => {
      if (exportPositionFilter !== 'ALL') {
        if ((m.instructorType || 'พระวิปัสสนาจารย์') !== exportPositionFilter) return false;
      }
      if (exportSearch.trim()) {
        const q = exportSearch.toLowerCase();
        const matchName = (m.name || '').toLowerCase().includes(q);
        const matchEn = (m.nameEn || '').toLowerCase().includes(q);
        const matchEmail = (m.email || '').toLowerCase().includes(q);
        return matchName || matchEn || matchEmail;
      }
      return true;
    });
  }, [currentMasters, exportPositionFilter, exportSearch]);

  if (!isOpen) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // Helper: Get next available vipassana sequential email
  // ─────────────────────────────────────────────────────────────────────────
  const getNextVipassanaEmail = (offsetIndex: number, currentList: UserAccount[], staged: ParsedMasterItem[]) => {
    let seq = 1;
    let attempts = 0;
    while (attempts < 500) {
      const candidate = `vipassana${String(seq).padStart(2, '0')}@mcu.ac.th`.toLowerCase();
      const usedInDb = currentList.some((u) => (u.email || '').toLowerCase() === candidate);
      const usedInStaged = staged.slice(0, offsetIndex).some((s) => s.email.toLowerCase() === candidate);
      if (!usedInDb && !usedInStaged) {
        return candidate;
      }
      seq++;
      attempts++;
    }
    return `vipassana${Date.now().toString().slice(-4)}@mcu.ac.th`;
  };

  // Helper: Get password based on current option
  const getPasswordForIndex = (idx: number) => {
    if (passwordOption === 'mcu123456') return 'mcu123456';
    if (passwordOption === 'vp2569') return `Vp@2569#${String(idx + 1).padStart(2, '0')}`;
    return customPassword.trim() || 'mcu123456';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Parse raw text into structured masters
  // ─────────────────────────────────────────────────────────────────────────
  const parseRawTextToMasters = (text: string) => {
    const lines = splitCSVLines(text);
    if (lines.length === 0) {
      setParsedList([]);
      return;
    }

    const delimiter = detectDelimiter(lines[0]);
    const rawHeaders = parseCSVRow(lines[0], delimiter);
    const normalizedHeaders = rawHeaders.map((h) =>
      h.toLowerCase().replace(/[\s\-_]/g, '')
    );

    const isHeaderPresent = normalizedHeaders.some((h) =>
      ['name', 'ชื่อ', 'ชื่อพระ', 'พระอาจารย์', 'ชื่อฉายา', 'ตำแหน่ง', 'position', 'email', 'อีเมล'].includes(h)
    );

    const startLine = isHeaderPresent ? 1 : 0;
    const result: ParsedMasterItem[] = [];

    for (let i = startLine; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      let values = parseCSVRow(lines[i], delimiter);
      if (values.length === 0 || values.every((v) => !v.trim())) continue;

      values = recombineAcademicTitles(values);

      let name = '';
      let nameEn = '';
      let position = 'พระวิปัสสนาจารย์';
      let email = '';
      let password = '';

      if (isHeaderPresent) {
        const obj: Record<string, string> = {};
        normalizedHeaders.forEach((h, idx) => {
          obj[h] = values[idx] !== undefined ? values[idx] : '';
        });

        name =
          obj['name'] ||
          obj['ชื่อ'] ||
          obj['ชื่อฉายา'] ||
          obj['ชื่อพระ'] ||
          obj['พระวิปัสสนาจารย์'] ||
          obj['fullname'] ||
          '';

        nameEn =
          obj['nameen'] ||
          obj['englishname'] ||
          obj['ชื่อภาษาอังกฤษ'] ||
          obj['ชื่ออังกฤษ'] ||
          '';

        position =
          obj['position'] ||
          obj['ตำแหน่ง'] ||
          obj['หน้าที่'] ||
          'พระวิปัสสนาจารย์';

        email = obj['email'] || obj['อีเมล'] || obj['ไอดี'] || obj['username'] || '';
        password = obj['password'] || obj['รหัสผ่าน'] || '';
      } else {
        // Positional fallback:
        // Col 0: No. or Name
        const isFirstColNumber = /^\d+$/.test(values[0]?.trim());
        const nameIdx = isFirstColNumber ? 1 : 0;

        name = values[nameIdx] || '';
        nameEn = values[nameIdx + 1] && !values[nameIdx + 1].includes('@') ? values[nameIdx + 1] : '';
        position = values[nameIdx + 2] || 'พระวิปัสสนาจารย์';

        for (let k = nameIdx + 1; k < values.length; k++) {
          const val = (values[k] || '').trim();
          if (val.includes('@')) {
            email = val;
          } else if (val.toLowerCase().startsWith('vp') || val.toLowerCase().startsWith('mcu')) {
            password = val;
          }
        }
      }

      if (!name.trim()) continue;

      // Clean position string
      let cleanPos = position.trim();
      if (!cleanPos || cleanPos === '-') cleanPos = 'พระวิปัสสนาจารย์';
      if (cleanPos.includes('ประธาน') && !cleanPos.includes('รอง')) cleanPos = 'ประธานพระวิปัสสนาจารย์';
      else if (cleanPos.includes('รองประธาน')) cleanPos = 'รองประธานพระวิปัสสนาจารย์';
      else if (cleanPos.includes('เลขานุการ') && !cleanPos.includes('ผู้ช่วย')) cleanPos = 'เลขานุการพระวิปัสสนาจารย์';
      else if (cleanPos.includes('ผู้ช่วยเลขา')) cleanPos = 'ผู้ช่วยเลขานุการพระวิปัสสนาจารย์';

      const cleanName = name.trim();
      const stripped = stripLeadingTitles(cleanName);

      // Check existing
      const existingMatch = existingUsers.find((u) => {
        if (email && (u.email || '').toLowerCase() === email.toLowerCase()) return true;
        if (u.name.trim() === cleanName) return true;
        if (u.aliases && u.aliases.some((al) => al.trim() === cleanName || al.trim() === stripped)) return true;
        if (stripLeadingTitles(u.name || '') === stripped && stripped.length >= 3) return true;
        return false;
      });

      // Auto generate email if not provided
      const finalEmail = email.trim() || (existingMatch?.email || getNextVipassanaEmail(result.length, existingUsers, result));
      const finalPassword = password.trim() || getPasswordForIndex(result.length);

      result.push({
        name: cleanName,
        nameEn: nameEn.trim() || existingMatch?.nameEn,
        position: cleanPos,
        email: finalEmail,
        password: finalPassword,
        isExisting: !!existingMatch,
        existingMatchName: existingMatch?.name,
      });
    }

    setParsedList(result);
  };

  // Re-parse when raw text changes
  const handleTextChange = (val: string) => {
    setRawText(val);
    parseRawTextToMasters(val);
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setRawText(text);
      parseRawTextToMasters(text);
    } catch (err) {
      alert('ไม่สามารถอ่านไฟล์ได้: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Download Templates (.xlsx and .csv)
  // ─────────────────────────────────────────────────────────────────────────
  const handleDownloadTemplateXlsx = () => {
    const headers = [
      'ลำดับ',
      'ชื่อ-ฉายา (ภาษาไทย)',
      'ชื่อ-ฉายา (ภาษาอังกฤษ)',
      'ตำแหน่ง',
      'ไอดีเข้าใช้งาน/อีเมล (เว้นว่างได้ เพื่อสร้างอัตโนมัติ)',
      'รหัสผ่านเริ่มต้น (เว้นว่างได้ เพื่อสร้างอัตโนมัติ)',
    ];

    const sampleRows = [
      [1, 'พระธรรมวชิรมุนี', 'Phra Dhammavajiramuni', 'ประธานพระวิปัสสนาจารย์', 'vipassana01@mcu.ac.th', 'mcu123456'],
      [2, 'พระมหาบุญช่วย ปภสฺสโร', 'Phra Maha Boonchuay Pabhassaro', 'รองประธานพระวิปัสสนาจารย์', '', ''],
      [3, 'พระครูปลัดสุวัฒนบัณฑิตคุณ', 'Phra Khru Palat Suwattanabanditkun', 'เลขานุการพระวิปัสสนาจารย์', '', ''],
      [4, 'พระอาจารย์มหาเอกสิทธิ์', 'Phra Ajahn Ekkasit', 'พระวิปัสสนาจารย์', '', ''],
      [5, 'Phra Ajahn John Smith', 'Phra Ajahn John Smith', 'พระวิปัสสนาจารย์', '', ''],
    ];

    const sheet: XlsxSheet = {
      name: 'พระวิปัสสนาจารย์',
      title: 'แบบฟอร์มนำเข้ารายชื่อพระวิปัสสนาจารย์ ประจำปีการศึกษา',
      subtitle: 'ไอดีและรหัสผ่านหากเว้นว่างไว้ ระบบจะสร้างให้อัตโนมัติ (vipassana01@mcu.ac.th / mcu123456)',
      headers,
      rows: sampleRows,
      columnWidths: [8, 32, 32, 28, 30, 24],
    };

    downloadXlsx('เทมเพลตนำเข้า_พระวิปัสสนาจารย์.xlsx', [sheet]);
  };

  const handleDownloadTemplateCsv = () => {
    const headers = 'ลำดับ,ชื่อ-ฉายา (ภาษาไทย),ชื่อ-ฉายา (ภาษาอังกฤษ),ตำแหน่ง,ไอดีเข้าใช้งาน,รหัสผ่าน';
    const sampleRows = [
      '1,พระธรรมวชิรมุนี,Phra Dhammavajiramuni,ประธานพระวิปัสสนาจารย์,vipassana01@mcu.ac.th,mcu123456',
      '2,พระมหาบุญช่วย ปภสฺสโร,Phra Maha Boonchuay Pabhassaro,รองประธานพระวิปัสสนาจารย์,,',
      '3,พระครูปลัดสุวัฒนบัณฑิตคุณ,Phra Khru Palat Suwattanabanditkun,เลขานุการพระวิปัสสนาจารย์,,',
      '4,พระอาจารย์มหาเอกสิทธิ์,Phra Ajahn Ekkasit,พระวิปัสสนาจารย์,,',
    ];
    const csvContent = '\uFEFF' + [headers, ...sampleRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'เทมเพลตนำเข้า_พระวิปัสสนาจารย์.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Execute Batch Import
  // ─────────────────────────────────────────────────────────────────────────
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
            password: item.password,
            instructorType: item.position,
            department: 'ฝ่ายวิปัสสนาธุระ / พระวิปัสสนาจารย์',
            role: 'VIPASSANA_MASTER',
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
      }

      setLastCreatedList(data.processed || parsedList);
      setSubmitSuccess(
        `บันทึกสำเร็จ: สร้างบัญชีพระวิปัสสนาจารย์ใหม่ ${data.createdCount || 0} รูป, อัปเดตข้อมูล ${data.updatedCount || 0} รูป`
      );

      // Notify parent to refresh user list
      onSuccess();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Export Handlers (.xlsx and .csv)
  // ─────────────────────────────────────────────────────────────────────────
  const handleExportXlsx = (dataToExport: any[] = filteredMasters) => {
    const headers = [
      'ลำดับ',
      'ชื่อ-ฉายา (ภาษาไทย)',
      'ชื่อ-ฉายา (ภาษาอังกฤษ)',
      'ตำแหน่ง',
      'บทบาท (Role)',
      'ไอดีเข้าใช้งาน (Username/Email)',
      'รหัสผ่านเริ่มต้น (Default Password)',
      'สถานะ',
    ];

    const rows = dataToExport.map((m, idx) => [
      idx + 1,
      m.name || '',
      m.nameEn || '',
      m.instructorType || 'พระวิปัสสนาจารย์',
      m.role || 'VIPASSANA_MASTER',
      m.email || '',
      m.defaultPassword || m.password || 'mcu123456',
      m.isActive !== false ? 'เปิดใช้งาน' : 'ระงับ',
    ]);

    const sheet: XlsxSheet = {
      name: 'พระวิปัสสนาจารย์',
      title: 'ทำเนียบพระวิปัสสนาจารย์และรหัสผ่านเข้าใช้งานระบบ',
      subtitle: `ส่งออกเมื่อ ${new Date().toLocaleDateString('th-TH')} • จำนวนทั้งหมด ${rows.length} รูป`,
      headers,
      rows,
      columnWidths: [8, 30, 30, 26, 20, 32, 22, 14],
    };

    downloadXlsx(`บัญชีพระวิปัสสนาจารย์_${new Date().toISOString().split('T')[0]}.xlsx`, [sheet]);
  };

  const handleExportCsv = (dataToExport: any[] = filteredMasters) => {
    const headers = 'ลำดับ,ชื่อ-ฉายา (ภาษาไทย),ชื่อ-ฉายา (ภาษาอังกฤษ),ตำแหน่ง,ไอดีเข้าใช้งาน,รหัสผ่านเริ่มต้น,สถานะ';
    const rows = dataToExport.map((m, idx) => {
      const name = `"${(m.name || '').replace(/"/g, '""')}"`;
      const nameEn = `"${(m.nameEn || '').replace(/"/g, '""')}"`;
      const pos = `"${(m.instructorType || 'พระวิปัสสนาจารย์').replace(/"/g, '""')}"`;
      const email = m.email || '';
      const pwd = m.defaultPassword || m.password || 'mcu123456';
      const status = m.isActive !== false ? 'เปิดใช้งาน' : 'ระงับ';
      return `${idx + 1},${name},${nameEn},${pos},${email},${pwd},${status}`;
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `บัญชีพระวิปัสสนาจารย์_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Award className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  ระบบจัดการและนำเข้า/ส่งออก พระวิปัสสนาจารย์
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950 shadow-xs">
                  Auto ID & Password
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5">
                สร้างไอดี vipassanaXX@mcu.ac.th และรหัสผ่านอัตโนมัติ รองรับตำแหน่งประธาน รองประธาน พระวิปัสสนาจารย์ และเลขานุการ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 bg-amber-50/50 border-b border-amber-200/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('IMPORT')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border-t border-x ${
                activeTab === 'IMPORT'
                  ? 'bg-white text-amber-950 border-amber-300 shadow-xs'
                  : 'text-slate-600 border-transparent hover:bg-white/50'
              }`}
            >
              <Upload className="w-4 h-4 text-amber-600" />
              <span>📥 นำเข้าเป็นชุด & สร้างไอดีอัตโนมัติ (Batch Import)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('EXPORT')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border-t border-x ${
                activeTab === 'EXPORT'
                  ? 'bg-white text-amber-950 border-amber-300 shadow-xs'
                  : 'text-slate-600 border-transparent hover:bg-white/50'
              }`}
            >
              <Download className="w-4 h-4 text-amber-600" />
              <span>📤 ส่งออกรายชื่อและรหัสผ่าน (Export Excel: {currentMasters.length} รูป)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-5">
          {/* ======================= TAB 1: IMPORT ======================= */}
          {activeTab === 'IMPORT' && (
            <div className="space-y-5">
              {/* Top Action Card: Download Template */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 rounded-2xl border border-amber-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h4 className="text-sm font-bold text-amber-950">ขั้นตอนที่ 1: เตรียมไฟล์รายชื่อพระวิปัสสนาจารย์</h4>
                  </div>
                  <p className="text-xs text-slate-600">
                    ดาวน์โหลดเทมเพลต Excel ที่จัดคอลัมน์ชื่อไทย, ชื่ออังกฤษ, ตำแหน่ง (ประธาน, รองประธาน, พระวิปัสสนาจารย์, เลขานุการ) ไว้อย่างถูกต้อง
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
                      accept=".csv, .txt, .tsv"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>เลือกไฟล์ (.csv/.tsv)</span>
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
                          <th className="p-2.5">ตำแหน่ง</th>
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
          )}

          {/* ======================= TAB 2: EXPORT ======================= */}
          {activeTab === 'EXPORT' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Search */}
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ, ฉายา, หรือไอดี..."
                      value={exportSearch}
                      onChange={(e) => setExportSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Position Filter */}
                  <select
                    value={exportPositionFilter}
                    onChange={(e) => setExportPositionFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 outline-none"
                  >
                    <option value="ALL">ทุกตำแหน่ง ({currentMasters.length})</option>
                    {STANDARD_POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportXlsx()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    title="ดาวน์โหลดรายชื่อพระวิปัสสนาจารย์และรหัสผ่านทั้งหมดเป็นไฟล์ Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>ส่งออก Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCsv()}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Table of Existing Masters */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[55vh]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-3 text-center w-12">ลำดับ</th>
                        <th className="p-3">ชื่อ-ฉายา (ไทย)</th>
                        <th className="p-3">ชื่ออังกฤษ</th>
                        <th className="p-3">ตำแหน่ง</th>
                        <th className="p-3">ไอดีเข้าใช้งาน (Login ID)</th>
                        <th className="p-3">รหัสผ่านเริ่มต้น</th>
                        <th className="p-3 text-center">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMasters.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                            ไม่พบรายชื่อพระวิปัสสนาจารย์ตามเงื่อนไขที่ค้นหา
                          </td>
                        </tr>
                      ) : (
                        filteredMasters.map((m, idx) => (
                          <tr key={m.id || idx} className="hover:bg-amber-50/20 transition">
                            <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-900">{m.name}</td>
                            <td className="p-3 text-slate-600 font-serif">{m.nameEn || '-'}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                  (m.instructorType || '').includes('ประธาน') && !(m.instructorType || '').includes('รอง')
                                    ? 'bg-purple-100 text-purple-900'
                                    : (m.instructorType || '').includes('รองประธาน')
                                    ? 'bg-indigo-100 text-indigo-900'
                                    : (m.instructorType || '').includes('เลขา')
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {m.instructorType || 'พระวิปัสสนาจารย์'}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-semibold text-amber-950">{m.email}</td>
                            <td className="p-3 font-mono text-slate-700 bg-slate-50/70 px-2 rounded">
                              {m.defaultPassword || m.password || 'mcu123456'}
                            </td>
                            <td className="p-3 text-center">
                              {m.isActive !== false ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  ใช้งานได้
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                                  ระงับ
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {activeTab === 'IMPORT' ? (
              <span>พร้อมสร้างบัญชีและรหัสผ่านอัตโนมัติสำหรับบทบาท <strong>พระวิปัสสนาจารย์ (VIPASSANA_MASTER)</strong></span>
            ) : (
              <span>แสดงทั้งหมด <strong>{filteredMasters.length}</strong> รูป</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>

            {activeTab === 'IMPORT' && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isSubmitting || parsedList.length === 0}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white shadow-md flex items-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'กำลังสร้างบัญชี...'
                    : `สร้างและบันทึกบัญชีพระอาจารย์ (${parsedList.length} รูป)`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
