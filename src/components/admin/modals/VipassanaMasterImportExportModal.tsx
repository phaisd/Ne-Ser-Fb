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
  ChevronRight,
  FileUp,
  RefreshCw,
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
import {
  ParsedMasterItem,
  STANDARD_POSITIONS,
  VipassanaMasterExportTab,
  VipassanaMasterSlipTab,
  VipassanaMasterImportTab,
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
            <VipassanaMasterImportTab
              handleDownloadTemplateXlsx={handleDownloadTemplateXlsx}
              handleDownloadTemplateCsv={handleDownloadTemplateCsv}
              passwordOption={passwordOption}
              setPasswordOption={setPasswordOption}
              rawText={rawText}
              setRawText={setRawText}
              parseRawTextToMasters={parseRawTextToMasters}
              handleFileUpload={handleFileUpload}
              fileInputRef={fileInputRef}
              handleTextChange={handleTextChange}
              parsedList={parsedList}
              setParsedList={setParsedList}
              submitSuccess={submitSuccess}
              submitError={submitError}
              lastCreatedList={lastCreatedList}
              handleExportXlsx={handleExportXlsx}
            />
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
            <VipassanaMasterSlipTab currentMasters={currentMasters} />
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
              <span>แสดงบัตรทั้งหมด <strong>{currentMasters.length}</strong> รูป</span>
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
