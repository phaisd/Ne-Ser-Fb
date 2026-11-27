'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
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
  FileDown,
  Image as ImageIcon,
  Grid,
  Loader2,
  ExternalLink,
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
import { readSpreadsheetFile, getNextSequentialEmail } from '@/lib/utils/file-import-helpers';
import { downloadCsvFile } from '@/lib/utils/csv-helpers';
import { exportMultiPagePdf } from '@/lib/utils/pdf-export';
import { useWatermarkSettings } from '@/hooks/useWatermarkSettings';
import {
  ParsedMasterItem,
  STANDARD_POSITIONS,
  VipassanaMasterExportTab,
} from './master-import';

export type { ParsedMasterItem };
export { STANDARD_POSITIONS };

interface VipassanaMasterImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingUsers: UserAccount[];
  onSuccess: () => void;
}

export const VipassanaMasterImportExportModal: React.FC<VipassanaMasterImportExportModalProps> = ({
  isOpen,
  onClose,
  existingUsers,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'IMPORT' | 'EXPORT' | 'SLIPS'>('IMPORT');

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

  // ===================== SLIPS / BADGES TAB STATES =====================
  const [slipsLayout, setSlipsLayout] = useState<'SIX_PER_PAGE' | 'FOUR_PER_PAGE' | 'TWO_PER_PAGE' | 'ONE_PER_PAGE'>('SIX_PER_PAGE');
  const [slipsSearch, setSlipsSearch] = useState('');
  const [slipsPositionFilter, setSlipsPositionFilter] = useState('ALL');
  const [slipsQrCodes, setSlipsQrCodes] = useState<Record<string, string>>({});
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  // Watermark / Custom Background hook
  const {
    watermarkMode: slipsWatermarkMode,
    setWatermarkMode: setSlipsWatermarkMode,
    watermarkOpacity: slipsWatermarkOpacity,
    setWatermarkOpacity: setSlipsWatermarkOpacity,
    customWatermarkUrl: slipsCustomWatermarkUrl,
    setCustomWatermarkUrl: setSlipsCustomWatermarkUrl,
    systemLogoUrl: slipsSystemLogoUrl,
    watermarkInputRef: slipsWatermarkInputRef,
    activeWatermark: slipsActiveWatermark,
    handleWatermarkUpload: handleSlipsWatermarkUpload,
  } = useWatermarkSettings({ initialOpacity: 0.10 });

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

  // ─────────────────────────────────────────────────────────────────────────
  // Helper: Get next available vipassana sequential email
  // ─────────────────────────────────────────────────────────────────────────
  const getNextVipassanaEmail = (offsetIndex: number, currentList: UserAccount[], staged: ParsedMasterItem[]) => {
    return getNextSequentialEmail({
      prefix: 'vipassana',
      offsetIndex,
      existingEmails: currentList.map((u) => u.email),
      stagedEmails: staged.map((s) => s.email),
    });
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
      let ecclesiasticalTitle = '';
      let department = '';
      let contactAddress = '';
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
          obj['ตำแหน่งในโครงการ'] ||
          obj['หน้าที่'] ||
          'พระวิปัสสนาจารย์';

        ecclesiasticalTitle =
          obj['ecclesiasticaltitle'] ||
          obj['ตำแหน่งทางคณะสงฆ์'] ||
          obj['ตำแหน่งสงฆ์'] ||
          obj['สมณศักดิ์'] ||
          obj['สังกัดสงฆ์'] ||
          '';

        department =
          obj['department'] ||
          obj['หน่วยงาน'] ||
          obj['ภาควิชา'] ||
          obj['หน่วยงาน/ภาควิชา'] ||
          obj['สังกัด'] ||
          '';

        contactAddress =
          obj['contactaddress'] ||
          obj['ที่อยู่ติดต่อ'] ||
          obj['ที่อยู่'] ||
          obj['สังกัดวัด'] ||
          obj['วัด'] ||
          obj['ที่อยู่วัด'] ||
          obj['address'] ||
          '';

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
        ecclesiasticalTitle: ecclesiasticalTitle.trim() || existingMatch?.ecclesiasticalTitle || '',
        department: department.trim() || existingMatch?.department || 'ฝ่ายวิปัสสนาธุระ / พระวิปัสสนาจารย์',
        contactAddress: contactAddress.trim() || existingMatch?.contactAddress || '',
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

  // File upload handler (Excel .xlsx and CSV)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { rawText } = await readSpreadsheetFile(file);
      setRawText(rawText);
      parseRawTextToMasters(rawText);
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
      'ตำแหน่งในโครงการ',
      'ตำแหน่งทางคณะสงฆ์',
      'หน่วยงาน / ภาควิชา',
      'ที่อยู่ติดต่อ / สังกัดวัด',
      'ไอดีเข้าใช้งาน/อีเมล (เว้นว่างได้ เพื่อสร้างอัตโนมัติ)',
      'รหัสผ่านเริ่มต้น (เว้นว่างได้ เพื่อสร้างอัตโนมัติ)',
    ];

    const sampleRows = [
      [
        1,
        'พระธรรมวชิรมุนี',
        'Phra Dhammavajiramuni',
        'ประธานพระวิปัสสนาจารย์',
        'เจ้าคณะภาค ๑๐ / ที่ปรึกษาฯ',
        'ฝ่ายวิปัสสนาธุระ คณะพุทธศาสตร์',
        'วัดมหาธาตุยุวราชรังสฤษฎิ์ กรุงเทพฯ',
        'vipassana01@mcu.ac.th',
        'mcu123456',
      ],
      [
        2,
        'พระมหาบุญช่วย ปภสฺสโร',
        'Phra Maha Boonchuay Pabhassaro',
        'รองประธานพระวิปัสสนาจารย์',
        'เจ้าอาวาสวัดวังผาหมู',
        'คณะพุทธศาสตร์ ภาควิชาพระพุทธศาสนา',
        'วัดวังผาหมู อ.พระพรหม จ.นครศรีธรรมราช',
        '',
        '',
      ],
      [
        3,
        'พระครูปลัดสุวัฒนบัณฑิตคุณ',
        'Phra Khru Palat Suwattanabanditkun',
        'เลขานุการพระวิปัสสนาจารย์',
        'ผู้ช่วยเจ้าอาวาสวัดจากแดง',
        'สำนักงานคณบดี คณะพุทธศาสตร์',
        'วัดจากแดง อ.พระประแดง จ.สมุทรปราการ',
        '',
        '',
      ],
      [
        4,
        'พระอาจารย์มหาเอกสิทธิ์',
        'Phra Ajahn Ekkasit',
        'พระวิปัสสนาจารย์',
        'พระวิปัสสนาจารย์ประจำศูนย์',
        'ฝ่ายวิปัสสนาธุระ / พระวิปัสสนาจารย์',
        'สถาบันวิปัสสนาธุระ มจร วังน้อย พระนครศรีอยุธยา',
        '',
        '',
      ],
      [
        5,
        'Phra Ajahn John Smith',
        'Phra Ajahn John Smith',
        'พระวิปัสสนาจารย์',
        '-',
        'วิทยาลัยพุทธศาสตร์นานาชาติ (IBSC)',
        'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย วังน้อย',
        '',
        '',
      ],
    ];

    const sheet: XlsxSheet = {
      name: 'พระวิปัสสนาจารย์',
      title: 'แบบฟอร์มนำเข้ารายชื่อพระวิปัสสนาจารย์ ประจำปีการศึกษา',
      subtitle: 'รองรับข้อมูลตำแหน่งทางคณะสงฆ์, หน่วยงาน/ภาควิชา และที่อยู่ติดต่อ (ไอดีและรหัสผ่านสร้างให้อัตโนมัติ)',
      headers,
      rows: sampleRows,
      columnWidths: [8, 30, 30, 26, 28, 28, 36, 30, 22],
    };

    downloadXlsx('เทมเพลตนำเข้า_พระวิปัสสนาจารย์.xlsx', [sheet]);
  };

  const handleDownloadTemplateCsv = () => {
    const headers = [
      'ลำดับ',
      'ชื่อ-ฉายา (ภาษาไทย)',
      'ชื่อ-ฉายา (ภาษาอังกฤษ)',
      'ตำแหน่งในโครงการ',
      'ตำแหน่งทางคณะสงฆ์',
      'หน่วยงาน / ภาควิชา',
      'ที่อยู่ติดต่อ / สังกัดวัด',
      'ไอดีเข้าใช้งาน',
      'รหัสผ่าน',
    ];
    const sampleRows = [
      ['1', 'พระธรรมวชิรมุนี', 'Phra Dhammavajiramuni', 'ประธานพระวิปัสสนาจารย์', 'เจ้าคณะภาค ๑๐', 'ฝ่ายวิปัสสนาธุระ คณะพุทธศาสตร์', 'วัดมหาธาตุยุวราชรังสฤษฎิ์ กรุงเทพฯ', 'vipassana01@mcu.ac.th', 'mcu123456'],
      ['2', 'พระมหาบุญช่วย ปภสฺสโร', 'Phra Maha Boonchuay Pabhassaro', 'รองประธานพระวิปัสสนาจารย์', 'เจ้าอาวาสวัดวังผาหมู', 'คณะพุทธศาสตร์ ภาควิชาพระพุทธศาสนา', 'วัดวังผาหมู จ.นครศรีธรรมราช', '', ''],
      ['3', 'พระครูปลัดสุวัฒนบัณฑิตคุณ', 'Phra Khru Palat Suwattanabanditkun', 'เลขานุการพระวิปัสสนาจารย์', 'ผู้ช่วยเจ้าอาวาสวัดจากแดง', 'สำนักงานคณบดี คณะพุทธศาสตร์', 'วัดจากแดง จ.สมุทรปราการ', '', ''],
      ['4', 'พระอาจารย์มหาเอกสิทธิ์', 'Phra Ajahn Ekkasit', 'พระวิปัสสนาจารย์', 'พระวิปัสสนาจารย์ประจำศูนย์', 'ฝ่ายวิปัสสนาธุระ / พระวิปัสสนาจารย์', 'สถาบันวิปัสสนาธุระ มจร วังน้อย', '', ''],
    ];
    downloadCsvFile({
      filename: 'เทมเพลตนำเข้า_พระวิปัสสนาจารย์.csv',
      headers,
      rows: sampleRows,
    });
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
            ecclesiasticalTitle: item.ecclesiasticalTitle,
            department: item.department || 'ฝ่ายวิปัสสนาธุระ / พระวิปัสสนาจารย์',
            contactAddress: item.contactAddress,
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
  const handleExportXlsx = (dataToExport?: any) => {
    try {
      const list = Array.isArray(dataToExport) ? dataToExport : filteredMasters;
      if (!list || list.length === 0) {
        alert('ไม่พบรายการข้อมูลพระวิปัสสนาจารย์สำหรับส่งออก');
        return;
      }

      const headers = [
        'ลำดับ',
        'ชื่อ-ฉายา (ภาษาไทย)',
        'ชื่อ-ฉายา (ภาษาอังกฤษ)',
        'ตำแหน่งในโครงการ',
        'ตำแหน่งทางคณะสงฆ์',
        'หน่วยงาน / ภาควิชา',
        'ที่อยู่ติดต่อ / สังกัดวัด',
        'บทบาท (Role)',
        'ไอดีเข้าใช้งาน (Username/Email)',
        'รหัสผ่านเริ่มต้น (Default Password)',
        'สถานะ',
      ];

      const rows = list.map((m, idx) => [
        idx + 1,
        m.name || '',
        m.nameEn || '',
        m.instructorType || m.position || 'พระวิปัสสนาจารย์',
        m.ecclesiasticalTitle || '-',
        m.department || 'ฝ่ายวิปัสสนาธุระ / พระวิปัสสนาจารย์',
        m.contactAddress || '-',
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
        columnWidths: [8, 30, 30, 26, 26, 28, 34, 20, 32, 22, 14],
      };

      downloadXlsx(`บัญชีพระวิปัสสนาจารย์_${new Date().toISOString().split('T')[0]}.xlsx`, [sheet]);
    } catch (err) {
      console.error('Failed to export xlsx:', err);
      alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleExportCsv = (dataToExport?: any) => {
    try {
      const list = Array.isArray(dataToExport) ? dataToExport : filteredMasters;
      if (!list || list.length === 0) {
        alert('ไม่พบรายการข้อมูลพระวิปัสสนาจารย์สำหรับส่งออก');
        return;
      }

      const headers = [
        'ลำดับ',
        'ชื่อ-ฉายา (ภาษาไทย)',
        'ชื่อ-ฉายา (ภาษาอังกฤษ)',
        'ตำแหน่งในโครงการ',
        'ตำแหน่งทางคณะสงฆ์',
        'หน่วยงาน / ภาควิชา',
        'ที่อยู่ติดต่อ / สังกัดวัด',
        'บทบาท',
        'ไอดีเข้าใช้งาน',
        'รหัสผ่านเริ่มต้น',
        'สถานะ',
      ];
      const rows = list.map((m, idx) => [
        idx + 1,
        m.name || '',
        m.nameEn || '',
        m.instructorType || m.position || 'พระวิปัสสนาจารย์',
        m.ecclesiasticalTitle || '-',
        m.department || 'ฝ่ายวิปัสสนาธุระ / พระวิปัสสนาจารย์',
        m.contactAddress || '-',
        m.role || 'VIPASSANA_MASTER',
        m.email || '',
        m.defaultPassword || m.password || 'mcu123456',
        m.isActive !== false ? 'เปิดใช้งาน' : 'ระงับ',
      ]);

      downloadCsvFile({
        filename: `บัญชีพระวิปัสสนาจารย์_${new Date().toISOString().split('T')[0]}.csv`,
        headers,
        rows,
      });
    } catch (err) {
      console.error('Failed to export csv:', err);
      alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ CSV: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Slips / Badges Generator & Export Logic
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'SLIPS') return;

    let isMounted = true;
    const generateSlipsQr = async () => {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const entries: Array<[string, string]> = [];

      for (const m of currentMasters) {
        const idKey = m.id || m.email;
        if (!idKey) continue;
        const loginUrl = `${origin}/login?email=${encodeURIComponent(m.email)}&role=VIPASSANA_MASTER`;
        try {
          const url = await QRCode.toDataURL(loginUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 256,
            color: {
              dark: '#581c87', // Sacred deep purple
              light: '#ffffff',
            },
          });
          entries.push([idKey, url]);
        } catch (e) {
          console.error('Error generating master QR', e);
        }
      }

      if (isMounted) {
        setSlipsQrCodes(Object.fromEntries(entries));
      }
    };

    generateSlipsQr();

    return () => {
      isMounted = false;
    };
  }, [activeTab, currentMasters]);

  const slipsPerPage =
    slipsLayout === 'SIX_PER_PAGE'
      ? 6
      : slipsLayout === 'FOUR_PER_PAGE'
      ? 4
      : slipsLayout === 'TWO_PER_PAGE'
      ? 2
      : 1;

  const slipsFilteredMasters = useMemo(() => {
    return currentMasters.filter((m) => {
      if (slipsPositionFilter !== 'ALL') {
        const pos = m.instructorType || (m as any).position || 'พระวิปัสสนาจารย์';
        if (pos !== slipsPositionFilter) return false;
      }
      if (slipsSearch.trim()) {
        const q = slipsSearch.toLowerCase();
        return (
          (m.name || '').toLowerCase().includes(q) ||
          (m.nameEn || '').toLowerCase().includes(q) ||
          (m.email || '').toLowerCase().includes(q) ||
          (m.contactAddress || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [currentMasters, slipsPositionFilter, slipsSearch]);

  const slipsPages = useMemo(() => {
    const chunks: UserAccount[][] = [];
    for (let i = 0; i < slipsFilteredMasters.length; i += slipsPerPage) {
      chunks.push(slipsFilteredMasters.slice(i, i + slipsPerPage));
    }
    return chunks;
  }, [slipsFilteredMasters, slipsPerPage]);

  const handlePrintSlips = () => {
    try {
      window.print();
    } catch (err) {
      console.error('Print failed:', err);
      alert('ไม่สามารถเปิดคำสั่งพิมพ์ได้ กรุณาใช้ปุ่ม "บันทึก PDF" หรือ "บันทึกรูป PNG" แทน');
    }
  };

  const handleExportSlipsPdf = async () => {
    if (slipsPages.length === 0) return;
    setIsExportingPdf(true);
    setExportProgress('กำลังเตรียมข้อมูลเอกสาร PDF...');

    try {
      const pageElements = slipsPages
        .map((_, i) => document.getElementById(`master-slip-page-${i}`))
        .filter(Boolean) as HTMLElement[];

      await exportMultiPagePdf({
        pageElements,
        filename: `บัตรประจำตัวพระวิปัสสนาจารย์_คณะพุทธศาสตร์_มจร.pdf`,
        orientation: 'portrait',
        format: 'a4',
        scale: 2,
        onProgress: (msg) => setExportProgress(msg),
      });
    } catch (err) {
      console.error('Failed to export slips PDF:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExportingPdf(false);
      setExportProgress(null);
    }
  };

  const handleExportSlipsPng = async () => {
    if (slipsPages.length === 0) return;
    setIsExportingPng(true);
    setExportProgress('กำลังเตรียมรูปภาพ PNG...');

    try {
      const html2canvas = (await import('html2canvas-pro')).default;

      for (let i = 0; i < slipsPages.length; i++) {
        setExportProgress(`กำลังบันทึกรูปภาพ PNG หน้าที่ ${i + 1} จากทั้งหมด ${slipsPages.length} หน้า...`);
        const pageEl = document.getElementById(`master-slip-page-${i}`);
        if (!pageEl) continue;

        const screenHeaders = pageEl.querySelectorAll('.screen-only-header');
        screenHeaders.forEach((h) => ((h as HTMLElement).style.display = 'none'));

        const origBorder = pageEl.style.border;
        const origShadow = pageEl.style.boxShadow;
        const origRadius = pageEl.style.borderRadius;
        pageEl.style.border = 'none';
        pageEl.style.boxShadow = 'none';
        pageEl.style.borderRadius = '0';

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: pageEl.scrollWidth,
        });

        pageEl.style.border = origBorder;
        pageEl.style.boxShadow = origShadow;
        pageEl.style.borderRadius = origRadius;
        screenHeaders.forEach((h) => ((h as HTMLElement).style.display = ''));

        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        const fileName =
          slipsPages.length === 1
            ? `บัตรประจำตัวพระวิปัสสนาจารย์.png`
            : `บัตรประจำตัวพระวิปัสสนาจารย์_หน้า_${i + 1}.png`;
        link.download = fileName;
        link.click();

        if (slipsPages.length > 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    } catch (err) {
      console.error('Failed to export slips PNG:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกรูปภาพ PNG กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExportingPng(false);
      setExportProgress(null);
    }
  };

  if (!isOpen) return null;

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
        <div className="px-6 pt-3 bg-amber-50/50 border-b border-amber-200/70 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
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

            {/* TAB 3: SLIPS / BADGES */}
            <button
              type="button"
              onClick={() => setActiveTab('SLIPS')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border-t border-x ${
                activeTab === 'SLIPS'
                  ? 'bg-white text-purple-950 border-purple-300 shadow-xs ring-1 ring-purple-400/30'
                  : 'text-slate-600 border-transparent hover:bg-white/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="font-extrabold text-purple-900">
                🪪 ออกบัตรประจำตัวและภาระงานสอบอารมณ์ ({currentMasters.length} รูป)
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-purple-100 text-purple-800">
                พร้อม QR เข้าสู่ระบบ
              </span>
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
          )}

          {/* ======================= TAB 2: EXPORT ======================= */}
          {activeTab === 'EXPORT' && (
            <VipassanaMasterExportTab
              currentMasters={currentMasters}
              filteredMasters={filteredMasters}
              exportSearch={exportSearch}
              setExportSearch={setExportSearch}
              exportPositionFilter={exportPositionFilter}
              setExportPositionFilter={setExportPositionFilter}
              onExportXlsx={() => handleExportXlsx()}
              onExportCsv={() => handleExportCsv()}
            />
          )}

          {/* ======================= TAB 3: SLIPS / BADGES ======================= */}
          {activeTab === 'SLIPS' && (
            <div className="space-y-4">
              {/* Progress Notification */}
              {exportProgress && (
                <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white px-4 py-2.5 rounded-2xl text-xs flex items-center justify-between shadow-md animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span className="font-bold">{exportProgress}</span>
                  </div>
                  <span className="text-[11px] text-purple-200 hidden sm:inline">
                    ⚡ ระบบกำลังสร้างเอกสารความละเอียดสูง (2x Retina) กรุณารอสักครู่...
                  </span>
                </div>
              )}

              {/* Slips Control Toolbar (Hidden in Print) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 print:hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left: Layout Ratio Selector */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Grid className="w-4 h-4 text-purple-600" />
                      อัตราส่วนจัดพิมพ์:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSlipsLayout('SIX_PER_PAGE')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        slipsLayout === 'SIX_PER_PAGE'
                          ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      6 รูปต่อ A4 (6:1 บัตรมาตรฐาน)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlipsLayout('FOUR_PER_PAGE')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        slipsLayout === 'FOUR_PER_PAGE'
                          ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      4 รูปต่อ A4 (4:1 ป้ายคล้องคอ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlipsLayout('TWO_PER_PAGE')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        slipsLayout === 'TWO_PER_PAGE'
                          ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      2 รูปต่อ A4 (2:1 บัตรทางการ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlipsLayout('ONE_PER_PAGE')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        slipsLayout === 'ONE_PER_PAGE'
                          ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      1 รูปต่อ A4 (1:1 เต็มหน้า)
                    </button>
                  </div>

                  {/* Right: Export & Print Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* PDF Button */}
                    <button
                      type="button"
                      onClick={handleExportSlipsPdf}
                      disabled={slipsFilteredMasters.length === 0 || isExportingPdf || isExportingPng}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                      title="บันทึกบัตรพระวิปัสสนาจารย์เป็นเอกสาร PDF ทุกหน้ารวมกัน"
                    >
                      {isExportingPdf ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileDown className="w-3.5 h-3.5" />
                      )}
                      <span>{isExportingPdf ? 'กำลังสร้าง PDF...' : 'บันทึก PDF (Save PDF)'}</span>
                    </button>

                    {/* PNG Button */}
                    <button
                      type="button"
                      onClick={handleExportSlipsPng}
                      disabled={slipsFilteredMasters.length === 0 || isExportingPdf || isExportingPng}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                      title="บันทึกบัตรพระวิปัสสนาจารย์เป็นภาพ PNG ความคมชัดสูง"
                    >
                      {isExportingPng ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5" />
                      )}
                      <span>{isExportingPng ? 'กำลังสร้างรูป...' : 'บันทึกรูป PNG (Save PNG)'}</span>
                    </button>

                    {/* Print Button */}
                    <button
                      type="button"
                      onClick={handlePrintSlips}
                      disabled={slipsFilteredMasters.length === 0 || isExportingPdf || isExportingPng}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>สั่งพิมพ์ A4 (Print Now)</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="pt-2 border-t border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-600 shrink-0">ตำแหน่ง:</span>
                      <select
                        value={slipsPositionFilter}
                        onChange={(e) => setSlipsPositionFilter(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 cursor-pointer"
                      >
                        <option value="ALL">-- ทุกตำแหน่ง ({currentMasters.length} รูป) --</option>
                        {STANDARD_POSITIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Watermark / Background Controls */}
                    <div className="flex items-center gap-1.5 bg-purple-50/70 px-2 py-1 rounded-xl border border-purple-200/80">
                      <span className="font-bold text-purple-900 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-700" />
                        ลายน้ำ:
                      </span>
                      <select
                        value={slipsWatermarkMode}
                        onChange={(e) => {
                          const mode = e.target.value as 'MCU_LOGO' | 'CUSTOM' | 'NONE';
                          setSlipsWatermarkMode(mode);
                          if (mode === 'CUSTOM' && !slipsCustomWatermarkUrl) {
                            slipsWatermarkInputRef.current?.click();
                          }
                        }}
                        className="px-2 py-1 bg-white rounded-lg border border-purple-200 text-xs font-bold text-purple-950 focus:outline-none cursor-pointer"
                      >
                        <option value="MCU_LOGO">☸️ ตราสัญลักษณ์ มจร</option>
                        <option value="CUSTOM">🖼️ อัปโหลดภาพพื้นหลังเอง</option>
                        <option value="NONE">🚫 ไม่ใส่ลายน้ำ</option>
                      </select>

                      {slipsWatermarkMode !== 'NONE' && (
                        <select
                          value={slipsWatermarkOpacity}
                          onChange={(e) => setSlipsWatermarkOpacity(parseFloat(e.target.value))}
                          className="px-1.5 py-1 bg-white rounded-lg border border-purple-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                          title="ระดับความโปร่งแสงของลายน้ำ"
                        >
                          <option value={0.06}>จาง 6%</option>
                          <option value={0.10}>พอดี 10% (แนะนำ)</option>
                          <option value={0.15}>ชัด 15%</option>
                          <option value={0.20}>เข้ม 20%</option>
                        </select>
                      )}

                      {slipsWatermarkMode === 'CUSTOM' && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => slipsWatermarkInputRef.current?.click()}
                            className="px-2 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="เลือกรูปภาพพื้นหลังลายน้ำจากเครื่อง"
                          >
                            <Upload className="w-3 h-3" />
                            <span>{slipsCustomWatermarkUrl ? 'เปลี่ยนรูป' : 'เลือกรูป'}</span>
                          </button>
                          {slipsCustomWatermarkUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setSlipsCustomWatermarkUrl('');
                                setSlipsWatermarkMode('MCU_LOGO');
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="ยกเลิกภาพพื้นหลังที่อัปโหลด กลับไปใช้ตรา มจร"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                      <input
                        ref={slipsWatermarkInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleSlipsWatermarkUpload}
                      />
                    </div>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={slipsSearch}
                      onChange={(e) => setSlipsSearch(e.target.value)}
                      placeholder="ค้นหาชื่อ, ฉายา หรือสังกัดวัด..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Embedded Print Styles for Master Slips */}
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                    @media print {
                      @page {
                        size: A4 portrait;
                        margin: 6mm 6mm;
                      }
                      body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        visibility: hidden !important;
                      }
                      .a4-master-slip-sheet,
                      .a4-master-slip-sheet * {
                        visibility: visible !important;
                      }
                      .a4-master-slip-sheet {
                        position: static !important;
                        display: block !important;
                        width: 100% !important;
                        height: 284mm !important;
                        min-height: 284mm !important;
                        max-height: 284mm !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        overflow: hidden !important;
                        box-sizing: border-box !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        background: white !important;
                      }
                      .a4-master-slip-sheet:last-of-type,
                      .a4-master-slip-sheet:last-child {
                        page-break-after: auto !important;
                        break-after: auto !important;
                      }
                      .print\\:hidden, .no-print {
                        display: none !important;
                      }
                    }
                  `,
                }}
              />

              {/* Printable Sheets Area */}
              <div id="master-slips-container" className="space-y-6 print:space-y-0">
                {slipsFilteredMasters.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600 text-sm">ไม่พบข้อมูลพระวิปัสสนาจารย์ตามเงื่อนไขที่เลือก</p>
                    <p className="text-xs text-slate-400 mt-1">กรุณานำเข้าข้อมูลในแท็บแรก หรือปรับตัวกรองการค้นหา</p>
                  </div>
                ) : (
                  slipsPages.map((pageMasters, pageIdx) => (
                    <div
                      key={`slip-page-${pageIdx}`}
                      id={`master-slip-page-${pageIdx}`}
                      className="a4-master-slip-sheet bg-white p-4 sm:p-5 print:p-0 rounded-2xl border border-slate-200 print:border-none shadow-sm print:shadow-none mx-auto w-full max-w-[860px] print:max-w-none"
                    >
                      {/* Screen-only Sheet Header */}
                      <div className="screen-only-header flex items-center justify-between pb-2 mb-3 border-b border-slate-200 text-xs text-slate-500 print:hidden font-medium">
                        <span className="font-bold text-purple-900 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-600" />
                          <span>บัตรประจำตัวพระวิปัสสนาจารย์ • หน้าที่ {pageIdx + 1} / {slipsPages.length}</span>
                        </span>
                        <span>({pageMasters.length} รูปในแผ่นนี้ • A4 Portrait)</span>
                      </div>

                      {/* Grid of Master Badges on this Sheet */}
                      <div
                        className={`grid w-full h-full ${
                          slipsLayout === 'SIX_PER_PAGE'
                            ? 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2.5 print:gap-1.5 print:grid-rows-3'
                            : slipsLayout === 'FOUR_PER_PAGE'
                            ? 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3 print:gap-2 print:grid-rows-2'
                            : slipsLayout === 'TWO_PER_PAGE'
                            ? 'grid-cols-1 print:grid-cols-1 gap-4 print:gap-3 print:grid-rows-2'
                            : 'grid-cols-1 h-full'
                        }`}
                      >
                        {pageMasters.map((m, cardIdx) => {
                          const overallIndex = pageIdx * slipsPerPage + cardIdx;
                          const qrData = slipsQrCodes[m.id || m.email];
                          const posTitle = m.instructorType || (m as any).position || 'พระวิปัสสนาจารย์';
                          const isLeader = posTitle.includes('ประธาน');

                          return (
                            <div
                              key={m.id || m.email}
                              className={`border-2 rounded-2xl bg-gradient-to-br from-amber-50/40 via-white to-purple-50/30 flex flex-col justify-between shadow-2xs print:shadow-none print:break-inside-avoid print:page-break-inside-avoid relative overflow-hidden ${
                                isLeader
                                  ? 'border-amber-400/90 ring-1 ring-amber-400/40'
                                  : 'border-purple-300/80 ring-1 ring-purple-300/30'
                              } ${
                                slipsLayout === 'SIX_PER_PAGE'
                                  ? 'p-2.5 print:p-2 min-h-[225px] print:h-[90mm]'
                                  : slipsLayout === 'FOUR_PER_PAGE'
                                  ? 'p-3.5 print:p-3 min-h-[295px] print:h-[135mm]'
                                  : slipsLayout === 'TWO_PER_PAGE'
                                  ? 'p-3.5 print:p-3 min-h-[380px] print:h-[138mm]'
                                  : 'p-3.5 print:p-3 min-h-[550px] print:h-[280mm]'
                              }`}
                            >
                              {/* Background Watermark Layer - subtle & safe for QR scanning */}
                              {slipsWatermarkMode !== 'NONE' && slipsActiveWatermark && (
                                <div
                                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
                                  style={{ opacity: slipsWatermarkOpacity }}
                                >
                                  <img
                                    src={slipsActiveWatermark}
                                    alt="Watermark"
                                    className="object-contain max-w-[65%] max-h-[65%] filter grayscale contrast-125"
                                    crossOrigin="anonymous"
                                  />
                                </div>
                              )}

                              {/* Card Header */}
                              <div className="border-b border-amber-200/80 pb-1.5 flex items-start gap-2.5 shrink-0 relative z-10">
                                {slipsSystemLogoUrl ? (
                                  <img
                                    src={slipsSystemLogoUrl}
                                    alt="MCU Logo"
                                    className={`${slipsLayout === 'SIX_PER_PAGE' ? 'w-7 h-7' : 'w-8 h-8'} rounded-xl object-contain p-0.5 bg-white border border-amber-400/40 shrink-0 shadow-2xs mt-0.5`}
                                    crossOrigin="anonymous"
                                  />
                                ) : (
                                  <div className={`${slipsLayout === 'SIX_PER_PAGE' ? 'w-7 h-7 text-sm' : 'w-8 h-8 text-base'} rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}>
                                    ☸️
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className={`${slipsLayout === 'SIX_PER_PAGE' ? 'text-[9px]' : 'text-[9.5px]'} font-black uppercase text-amber-900 tracking-wide leading-tight`}>
                                    คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                                  </div>
                                  <div className={`${slipsLayout === 'SIX_PER_PAGE' ? 'text-[10px]' : 'text-[10.5px]'} font-extrabold text-slate-800 leading-tight`}>
                                    โครงการปฏิบัติวิปัสสนากัมมัฏฐาน ประจำปี ๒๕๖๙
                                  </div>
                                  <div className="mt-1 flex items-center">
                                    <span
                                      className={`px-2 py-0.5 rounded-full ${slipsLayout === 'SIX_PER_PAGE' ? 'text-[8.5px]' : 'text-[9px]'} font-black tracking-wide border inline-block ${
                                        isLeader
                                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                                          : 'bg-purple-100 text-purple-900 border-purple-200'
                                      }`}
                                    >
                                      {posTitle}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Master Profile & Ecclesiastical Details */}
                              <div className={`${slipsLayout === 'SIX_PER_PAGE' ? 'py-1 space-y-0.5' : 'py-2 space-y-1'} shrink-0 relative z-10`}>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <h4 className={`${slipsLayout === 'SIX_PER_PAGE' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-black text-slate-900 leading-snug`}>
                                    {m.name}
                                  </h4>
                                  {m.ecclesiasticalTitle && (
                                    <span className="text-[9px] sm:text-[10.5px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                                      {m.ecclesiasticalTitle}
                                    </span>
                                  )}
                                </div>
                                {m.nameEn && (
                                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium italic">
                                    {m.nameEn}
                                  </div>
                                )}
                                <div className="text-[9px] sm:text-[10px] text-slate-600 flex items-center gap-1.5 flex-wrap pt-0.5">
                                  <span className="font-semibold text-slate-700">สังกัด/ที่อยู่:</span>
                                  <span className="truncate">{m.contactAddress || m.department || 'ฝ่ายวิปัสสนาธุระ / คณะพุทธศาสตร์ มจร'}</span>
                                </div>
                              </div>

                              {/* Workload Brief Box */}
                              <div className={`bg-purple-50/70 border border-purple-200/80 rounded-xl ${slipsLayout === 'SIX_PER_PAGE' ? 'p-1.5 text-[9px]' : 'p-2 text-[10px]'} text-purple-950 space-y-0.5 shrink-0 relative z-10`}>
                                <div className="font-bold flex items-center gap-1.5 text-purple-900">
                                  <Sparkles className={`${slipsLayout === 'SIX_PER_PAGE' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-purple-600 shrink-0`} />
                                  <span className="leading-tight">ภาระงาน: สอบอารมณ์สติปัฏฐาน ๔ และประเมินผลการปฏิบัติธรรม</span>
                                </div>
                                <p className={`${slipsLayout === 'SIX_PER_PAGE' ? 'text-[8.5px]' : 'text-[9.5px]'} text-purple-800/90 leading-tight`}>
                                  รับผิดชอบตรวจอารมณ์กรรมฐาน (กาย เวทนา จิต ธรรม) ณ อาคารโพธิญาณมหาวิชชาลัย
                                </p>
                              </div>

                              {/* Credentials & Quick Scan Login QR Box */}
                              <div className={`bg-white/95 rounded-xl border border-slate-200/90 ${slipsLayout === 'SIX_PER_PAGE' ? 'p-1.5 my-auto' : 'p-2.5 my-auto'} flex items-center justify-between gap-2 shadow-2xs relative z-10`}>
                                <div className={`space-y-0.5 sm:space-y-1 ${slipsLayout === 'SIX_PER_PAGE' ? 'text-[9.5px]' : 'text-[10.5px]'} flex-1 min-w-0`}>
                                  <div className="text-[8.5px] sm:text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                    <Key className="w-3 h-3 text-amber-600" />
                                    <span>ข้อมูลสำหรับเข้าสู่ระบบ:</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="text-slate-500 font-medium shrink-0">ไอดี:</span>
                                    <span className="font-mono font-black text-amber-950 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80 text-[10px] sm:text-[11px] truncate">
                                      {m.email}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-500 font-medium shrink-0">รหัสผ่าน:</span>
                                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 text-[9.5px] sm:text-[10.5px]">
                                      {m.defaultPassword || m.password || 'mcu123456'}
                                    </span>
                                  </div>
                                </div>

                                {/* QR Code Box */}
                                <div className="flex flex-col items-center shrink-0">
                                  {qrData ? (
                                    <div className="p-0.5 sm:p-1 bg-white rounded-lg sm:rounded-xl border border-purple-200 shadow-2xs">
                                      <img
                                        src={qrData}
                                        alt={`QR ${m.name}`}
                                        className={`${slipsLayout === 'SIX_PER_PAGE' ? 'w-12 h-12 sm:w-13 sm:h-13' : 'w-16 h-16 sm:w-18 sm:h-18'} object-contain block bg-white`}
                                      />
                                    </div>
                                  ) : (
                                    <div className={`${slipsLayout === 'SIX_PER_PAGE' ? 'w-12 h-12' : 'w-16 h-16'} bg-purple-50 rounded-lg animate-pulse border border-purple-200`} />
                                  )}
                                  <span className="text-[7px] sm:text-[7.5px] font-bold text-purple-900 tracking-tight mt-0.5 text-center leading-tight">
                                    สแกนเข้าระบบด่วน
                                  </span>
                                </div>
                              </div>

                              {/* Card Footer */}
                              <div className="border-t border-slate-200/80 pt-1 text-[8px] sm:text-[8.5px] text-slate-400 flex items-center justify-between shrink-0 relative z-10">
                                <span className="font-medium text-slate-500 truncate">
                                  คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                                </span>
                                <span className="font-mono font-bold text-purple-900 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 shrink-0 ml-1">
                                  #VIP-{String(overallIndex + 1).padStart(2, '0')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {activeTab === 'IMPORT' ? (
              <span>พร้อมสร้างบัญชีและรหัสผ่านอัตโนมัติสำหรับบทบาท <strong>พระวิปัสสนาจารย์ (VIPASSANA_MASTER)</strong></span>
            ) : activeTab === 'EXPORT' ? (
              <span>แสดงทั้งหมด <strong>{filteredMasters.length}</strong> รูป</span>
            ) : (
              <span>แสดงบัตรทั้งหมด <strong>{slipsFilteredMasters.length}</strong> รูป ({slipsPages.length} หน้า A4)</span>
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
