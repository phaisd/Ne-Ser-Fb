'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
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
  Archive,
  Trash2,
  History,
} from 'lucide-react';
import { UserAccount } from '@/types';
import { downloadXlsx, type XlsxSheet } from '@/lib/utils/xlsx-export';
import { readSpreadsheetFile } from '@/lib/utils/file-import-helpers';
import { downloadCsvFile } from '@/lib/utils/csv-helpers';
import {
  ParsedMasterItem,
  STANDARD_POSITIONS,
  cleanImportRawText,
  parseCSVToVipassanaMasters,
  VipassanaMasterExportTab,
  VipassanaMasterSlipTab,
  VipassanaMasterImportTab,
  VipassanaMasterArchiveTab,
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
  const [activeTab, setActiveTab] = useState<'IMPORT' | 'EXPORT' | 'SLIPS' | 'ARCHIVE'>('IMPORT');

  // ===================== IMPORT TAB STATES =====================
  const [rawText, setRawText] = useState('');
  const [passwordOption, setPasswordOption] = useState<'mcu123456' | 'vp2569' | 'custom'>('mcu123456');
  const [customPassword, setCustomPassword] = useState('Vp@2569');
  const [parsedList, setParsedList] = useState<ParsedMasterItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastCreatedList, setLastCreatedList] = useState<any[]>([]);
  const [archiveOldBeforeImport, setArchiveOldBeforeImport] = useState(false);

  // ===================== ARCHIVE TAB STATES =====================
  const [archivedMasters, setArchivedMasters] = useState<any[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);

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
  // Fetch Archived Masters from server
  // ─────────────────────────────────────────────────────────────────────────
  const fetchArchivedMasters = useCallback(async () => {
    setIsLoadingArchive(true);
    try {
      const res = await fetch('/api/users?archived=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const masters = data.data.filter((u: any) => {
          if (u.role === 'VIPASSANA_MASTER') return true;
          const type = (u.instructorType || '').toLowerCase();
          return type.includes('วิปัสสนา') || type.includes('ประธาน') || type.includes('เลขานุการ');
        });
        setArchivedMasters(masters);
      }
    } catch (err) {
      console.error('Failed to fetch archived masters:', err);
    } finally {
      setIsLoadingArchive(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchArchivedMasters();
    }
  }, [isOpen, fetchArchivedMasters]);

  // ─────────────────────────────────────────────────────────────────────────
  // Parse raw text into structured masters (using robust parser with banner skipping)
  // ─────────────────────────────────────────────────────────────────────────
  const parseRawTextToMasters = (text: string, forceStartFresh = archiveOldBeforeImport) => {
    // If archiving old masters before import, we treat existingUsers without currentMasters
    // so the new batch starts freshly at vipassana01@mcu.ac.th
    const effectiveExisting = forceStartFresh
      ? existingUsers.filter((u) => !currentMasters.some((m) => m.id === u.id))
      : existingUsers;

    const list = parseCSVToVipassanaMasters({
      text,
      existingUsers: effectiveExisting,
      passwordOption,
      customPassword,
    });
    setParsedList(list);
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
      const { rawText: uploadedText } = await readSpreadsheetFile(file);
      // Clean title / subtitle banners so textarea starts directly from headers
      const cleaned = cleanImportRawText(uploadedText);
      setRawText(cleaned);
      parseRawTextToMasters(cleaned);
    } catch (err) {
      alert('ไม่สามารถอ่านไฟล์ได้: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Archive or Clear Current Masters
  // ─────────────────────────────────────────────────────────────────────────
  const handleArchiveOldMasters = async () => {
    if (currentMasters.length === 0) return;
    const defaultReason = `จัดเก็บพระวิปัสสนาจารย์ปีก่อนหน้า (ปีการศึกษา ${new Date().getFullYear() + 543 - 1})`;
    const userReason = window.prompt(
      `ต้องการย้ายพระวิปัสสนาจารย์ชุดปัจจุบัน (${currentMasters.length} รูป) เข้าสู่แฟ้มประวัติ (Archive) หรือไม่?\n\n• เมื่อย้ายแล้ว ข้อมูลเดิมจะถูกจัดเก็บเข้าแฟ้มประวัติอย่างปลอดภัย ไม่สูญหาย\n• ระบบจะพร้อมนำเข้าข้อมูลชุดใหม่เริ่มตั้งแต่ vipassana01@mcu.ac.th\n\nระบุหมายเหตุ/ปีการศึกษาที่จัดเก็บ:`,
      defaultReason
    );
    if (userReason === null) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive-user',
          userIds: currentMasters.map((m) => m.id),
          archiveReason: userReason.trim() || defaultReason,
          archivedBy: 'ผู้ดูแลระบบ (Admin)',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการย้ายเข้าแฟ้มประวัติ');
      }

      alert(
        `ย้ายพระวิปัสสนาจารย์ชุดเดิม ${data.archivedCount || currentMasters.length} รูป เข้าสู่แฟ้มประวัติเรียบร้อยแล้ว\nระบบพร้อมนำเข้าข้อมูลชุดใหม่เริ่มตั้งแต่ vipassana01@mcu.ac.th`
      );
      onSuccess();
      fetchArchivedMasters();
      if (rawText) {
        parseRawTextToMasters(rawText, true);
      }
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearOldMasters = async () => {
    if (currentMasters.length === 0) return;
    const confirmed = window.confirm(
      `คำเตือน: คุณต้องการลบข้อมูลพระวิปัสสนาจารย์ชุดปัจจุบันทั้งหมด (${currentMasters.length} รูป) ออกจากระบบหรือไม่?\n\n• หากเป็นข้อมูลตัวอย่าง สามารถกดตกลงเพื่อลบออกได้เลย\n• หากเป็นข้อมูลจริงของปีก่อนหน้า แนะนำให้เลือก "ย้ายเข้าแฟ้มประวัติ" เพื่อเก็บประวัติไว้`
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      let deletedCount = 0;
      for (const master of currentMasters) {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete-user',
            id: master.id,
          }),
        });
        if (res.ok) deletedCount++;
      }

      alert(
        `ล้างข้อมูลพระวิปัสสนาจารย์เรียบร้อยแล้ว (${deletedCount} รูป)\nระบบพร้อมสำหรับการนำเข้าข้อมูลใหม่เริ่มต้นจาก vipassana01@mcu.ac.th`
      );
      onSuccess();
      if (rawText) {
        parseRawTextToMasters(rawText, true);
      }
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาดในการล้างข้อมูล: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreArchivedMaster = async (userId: string, name: string) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'restore-user',
        userId,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'เกิดข้อผิดพลาดในการกู้คืนบัญชี');
    }
    alert(`กู้คืนบัญชี "${name}" กลับสู่ระบบพระวิปัสสนาจารย์ประจำปีปัจจุบันเรียบร้อยแล้ว`);
    onSuccess();
    fetchArchivedMasters();
  };

  const handleDeleteArchivedMasterPermanent = async (userId: string, name: string) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete-user',
        id: userId,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'เกิดข้อผิดพลาดในการลบถาวร');
    }
    alert(`ลบบัญชี "${name}" ออกจากระบบและแฟ้มประวัติเรียบร้อยแล้ว`);
    fetchArchivedMasters();
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
      // 1. If user opted to archive old masters before importing new batch:
      if (archiveOldBeforeImport && currentMasters.length > 0) {
        const archiveRes = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'archive-user',
            userIds: currentMasters.map((m) => m.id),
            archiveReason: `จัดเก็บพระวิปัสสนาจารย์ชุดปีก่อนหน้า ก่อนนำเข้าชุดใหม่`,
            archivedBy: 'ผู้ดูแลระบบ (Admin)',
          }),
        });
        if (!archiveRes.ok) {
          console.warn('Failed to auto-archive old masters before import');
        }
      }

      // 2. Batch import new masters
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
        archiveOldBeforeImport && currentMasters.length > 0
          ? `บันทึกสำเร็จ: ย้ายชุดเดิม ${currentMasters.length} รูป เข้าแฟ้มประวัติ และสร้างบัญชีพระวิปัสสนาจารย์ใหม่ ${data.createdCount || 0} รูป เริ่มตั้งแต่ vipassana01`
          : `บันทึกสำเร็จ: สร้างบัญชีพระวิปัสสนาจารย์ใหม่ ${data.createdCount || 0} รูป, อัปเดตข้อมูล ${data.updatedCount || 0} รูป`
      );

      // Notify parent to refresh user list
      onSuccess();
      fetchArchivedMasters();
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

            {/* TAB 4: ARCHIVE */}
            <button
              type="button"
              onClick={() => setActiveTab('ARCHIVE')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border-t border-x ${
                activeTab === 'ARCHIVE'
                  ? 'bg-white text-indigo-950 border-indigo-300 shadow-xs ring-1 ring-indigo-400/30'
                  : 'text-slate-600 border-transparent hover:bg-white/50'
              }`}
            >
              <Archive className="w-4 h-4 text-indigo-600" />
              <span className="font-extrabold text-indigo-900">
                📁 แฟ้มประวัติปีก่อนหน้า (Archive: {archivedMasters.length} รูป)
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
              currentMastersCount={currentMasters.length}
              onArchiveOldMasters={handleArchiveOldMasters}
              onClearOldMasters={handleClearOldMasters}
              archiveOldBeforeImport={archiveOldBeforeImport}
              setArchiveOldBeforeImport={(val) => {
                setArchiveOldBeforeImport(val);
                if (rawText) parseRawTextToMasters(rawText, val);
              }}
              onViewArchiveTab={() => setActiveTab('ARCHIVE')}
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

          {/* ======================= TAB 4: ARCHIVE ======================= */}
          {activeTab === 'ARCHIVE' && (
            <VipassanaMasterArchiveTab
              archivedMasters={archivedMasters}
              isLoading={isLoadingArchive}
              onRefresh={fetchArchivedMasters}
              onRestore={handleRestoreArchivedMaster}
              onDeletePermanent={handleDeleteArchivedMasterPermanent}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {activeTab === 'IMPORT' ? (
              <span>พร้อมสร้างบัญชีและรหัสผ่านอัตโนมัติสำหรับบทบาท <strong>พระวิปัสสนาจารย์ (VIPASSANA_MASTER)</strong></span>
            ) : activeTab === 'EXPORT' ? (
              <span>แสดงทั้งหมด <strong>{filteredMasters.length}</strong> รูป</span>
            ) : activeTab === 'SLIPS' ? (
              <span>แสดงบัตรทั้งหมด <strong>{currentMasters.length}</strong> รูป</span>
            ) : (
              <span>แฟ้มประวัติทั้งหมด <strong>{archivedMasters.length}</strong> รูป</span>
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
