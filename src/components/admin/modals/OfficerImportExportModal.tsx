'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  ShieldCheck,
  Search,
  Filter,
  Copy,
  Printer,
  ChevronRight,
  FileUp,
  RefreshCw,
  Key,
  UserCog,
  Briefcase,
  Check,
  Building,
  Phone,
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
import { parseXlsxToTsv } from '@/lib/utils/xlsx-import';
import { downloadCsvFile } from '@/lib/utils';

interface OfficerImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingUsers: UserAccount[];
  onSuccess: () => void;
}

export interface ParsedOfficerItem {
  id?: string;
  name: string;
  nameEn?: string;
  position: string; // 'เจ้าหน้าที่หลักสูตร' | 'ผู้ช่วยเจ้าหน้าที่' | 'เจ้าหน้าที่ฝ่ายวิชาการ' | 'เจ้าหน้าที่ดูแลระบบ'
  department?: string; // สาขาวิชา / ภาควิชา / หน่วยงาน
  phoneNumber?: string;
  email: string;
  password: string;
  role: 'OFFICER' | 'INSTRUCTOR' | 'STAFF';
  isActingOfficer: boolean;
  isExisting?: boolean;
  existingMatchName?: string;
}

const OFFICER_POSITIONS = [
  'เจ้าหน้าที่หลักสูตร',
  'ผู้ช่วยเจ้าหน้าที่ (อาจารย์ช่วยงาน)',
  'เจ้าหน้าที่ดูแลระบบ',
  'เจ้าหน้าที่ฝ่ายวิชาการ',
  'เจ้าหน้าที่ทะเบียนและวัดผล',
  'เจ้าหน้าที่กิจการนิสิต',
];

export const OfficerImportExportModal: React.FC<OfficerImportExportModalProps> = ({
  isOpen,
  onClose,
  existingUsers,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'IMPORT' | 'EXPORT'>('IMPORT');

  // ===================== IMPORT TAB STATES =====================
  const [rawText, setRawText] = useState('');
  const [passwordOption, setPasswordOption] = useState<'Fb8323mcu' | 'mcu123456' | 'custom'>('Fb8323mcu');
  const [customPassword, setCustomPassword] = useState('Fb8323mcu');
  const [defaultRoleOption, setDefaultRoleOption] = useState<'AUTO' | 'OFFICER' | 'ACTING_OFFICER' | 'STAFF'>('AUTO');
  const [parsedList, setParsedList] = useState<ParsedOfficerItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===================== EXPORT TAB STATES =====================
  const [exportSearch, setExportSearch] = useState('');
  const [exportRoleFilter, setExportRoleFilter] = useState('ALL');
  const [copiedLineId, setCopiedLineId] = useState<string | null>(null);
  const [copiedAllTable, setCopiedAllTable] = useState(false);

  // List of current Officers & Assistants in the system
  const currentOfficers = useMemo(() => {
    return existingUsers.filter((u) => {
      if (u.role === 'OFFICER' || u.role === 'STAFF') return true;
      if (Boolean((u as any).isActingOfficer)) return true;
      const type = (u.instructorType || '').toLowerCase();
      return type.includes('เจ้าหน้าที่') || type.includes('ผู้ช่วยเจ้าหน้าที่');
    });
  }, [existingUsers]);

  // Filtered officers for export
  const filteredOfficers = useMemo(() => {
    return currentOfficers.filter((u) => {
      const isActing = Boolean((u as any).isActingOfficer);
      if (exportRoleFilter === 'OFFICER' && u.role !== 'OFFICER') return false;
      if (exportRoleFilter === 'ACTING' && !isActing) return false;
      if (exportRoleFilter === 'STAFF' && u.role !== 'STAFF') return false;

      if (exportSearch.trim()) {
        const q = exportSearch.toLowerCase();
        const matchName = (u.name || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchDept = (u.department || '').toLowerCase().includes(q);
        const matchPhone = ((u as any).phoneNumber || '').toLowerCase().includes(q);
        return matchName || matchEmail || matchDept || matchPhone;
      }
      return true;
    });
  }, [currentOfficers, exportRoleFilter, exportSearch]);

  if (!isOpen) return null;

  // Helper: Next sequential officer email
  const getNextOfficerEmail = (offsetIndex: number, currentList: UserAccount[], staged: ParsedOfficerItem[]) => {
    let seq = 1;
    let attempts = 0;
    while (attempts < 500) {
      const candidate = `officer${String(seq).padStart(2, '0')}@mcu.ac.th`.toLowerCase();
      const usedInDb = currentList.some((u) => (u.email || '').toLowerCase() === candidate);
      const usedInStaged = staged.slice(0, offsetIndex).some((s) => s.email.toLowerCase() === candidate);
      if (!usedInDb && !usedInStaged) {
        return candidate;
      }
      seq++;
      attempts++;
    }
    return `officer${Date.now().toString().slice(-4)}@mcu.ac.th`;
  };

  const getPasswordForIndex = () => {
    if (passwordOption === 'Fb8323mcu') return 'Fb8323mcu';
    if (passwordOption === 'mcu123456') return 'mcu123456';
    return customPassword.trim() || 'Fb8323mcu';
  };

  // Parse raw text into structured officer items
  const parseRawTextToOfficers = (text: string) => {
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
      h.includes('ชื่อ') ||
      h.includes('name') ||
      h.includes('ตำแหน่ง') ||
      h.includes('position') ||
      h.includes('อีเมล') ||
      h.includes('email') ||
      h.includes('โทร')
    );

    const dataLines = isHeaderPresent ? lines.slice(1) : lines;

    let colName = 0;
    let colPosition = -1;
    let colRole = -1;
    let colDept = -1;
    let colPhone = -1;
    let colEmail = -1;
    let colPassword = -1;

    if (isHeaderPresent) {
      normalizedHeaders.forEach((h, idx) => {
        if (h.includes('ชื่อ') || h.includes('name')) colName = idx;
        else if (h.includes('บทบาท') || h.includes('role')) colRole = idx;
        else if (h.includes('ตำแหน่ง') || h.includes('position') || h.includes('หน้าที่')) colPosition = idx;
        else if (h.includes('หน่วยงาน') || h.includes('ภาควิชา') || h.includes('สาขา') || h.includes('สังกัด') || h.includes('department')) colDept = idx;
        else if (h.includes('โทร') || h.includes('phone') || h.includes('tel') || h.includes('เบอร์')) colPhone = idx;
        else if (h.includes('อีเมล') || h.includes('email') || h.includes('ไอดี') || h.includes('username')) colEmail = idx;
        else if (h.includes('รหัสผ่าน') || h.includes('password') || h.includes('pass')) colPassword = idx;
      });
    } else {
      // Default fallback column indices: [0: Name, 1: Position, 2: Department, 3: Phone, 4: Email, 5: Password]
      colName = 0;
      colPosition = 1;
      colDept = 2;
      colPhone = 3;
      colEmail = 4;
      colPassword = 5;
    }

    const staged: ParsedOfficerItem[] = [];

    dataLines.forEach((line) => {
      if (!line || !line.trim()) return;
      const rawCols = parseCSVRow(line, delimiter);
      const cols = recombineAcademicTitles(rawCols);

      const rawName = String(cols[colName] || '').trim();
      if (!rawName || rawName === 'ชื่อ' || rawName === 'Name') return;

      const rawPosition = colPosition !== -1 && cols[colPosition] ? String(cols[colPosition]).trim() : '';
      const rawRole = colRole !== -1 && cols[colRole] ? String(cols[colRole]).trim() : '';
      const rawDept = colDept !== -1 && cols[colDept] ? String(cols[colDept]).trim() : 'สำนักงานคณบดี คณะพุทธศาสตร์';
      const rawPhone = colPhone !== -1 && cols[colPhone] ? String(cols[colPhone]).trim() : '';
      const rawEmail = colEmail !== -1 && cols[colEmail] ? String(cols[colEmail]).trim().toLowerCase() : '';
      const rawPassword = colPassword !== -1 && cols[colPassword] ? String(cols[colPassword]).trim() : '';

      // Determine Role & Acting status
      let role: 'OFFICER' | 'INSTRUCTOR' | 'STAFF' = 'OFFICER';
      let isActingOfficer = false;
      const posLow = (rawPosition + ' ' + rawRole).toLowerCase();

      if (defaultRoleOption === 'ACTING_OFFICER') {
        role = 'INSTRUCTOR';
        isActingOfficer = true;
      } else if (defaultRoleOption === 'OFFICER') {
        role = 'OFFICER';
        isActingOfficer = false;
      } else if (defaultRoleOption === 'STAFF') {
        role = 'STAFF';
        isActingOfficer = false;
      } else {
        // AUTO detection from rawRole and rawPosition
        if (posLow.includes('ผู้ช่วย') || posLow.includes('acting') || posLow.includes('อาจารย์ช่วย')) {
          role = 'INSTRUCTOR';
          isActingOfficer = true;
        } else if (posLow.includes('วิชาการ') || posLow.includes('staff') || posLow.includes('สนับ')) {
          role = 'STAFF';
          isActingOfficer = false;
        } else {
          role = 'OFFICER';
          isActingOfficer = false;
        }
      }

      // Check existing in database
      const stripped = stripLeadingTitles(rawName);
      const existingMatch = existingUsers.find((u) => {
        if (rawEmail && ((u.email || '').toLowerCase() === rawEmail || (u.gmail || '').toLowerCase() === rawEmail)) {
          return true;
        }
        if (u.name.trim() === rawName) return true;
        if (stripLeadingTitles(u.name || '') === stripped && stripped.length >= 3) return true;
        return false;
      });

      const assignedEmail = rawEmail || (existingMatch?.email ? existingMatch.email : getNextOfficerEmail(staged.length, existingUsers, staged));
      const assignedPassword = rawPassword || (existingMatch?.defaultPassword ? existingMatch.defaultPassword : getPasswordForIndex());

      staged.push({
        id: existingMatch?.id,
        name: rawName,
        position: rawPosition || (isActingOfficer ? 'ผู้ช่วยเจ้าหน้าที่ (อาจารย์ช่วยงาน)' : 'เจ้าหน้าที่หลักสูตร'),
        department: rawDept,
        phoneNumber: rawPhone,
        email: assignedEmail,
        password: assignedPassword,
        role,
        isActingOfficer,
        isExisting: Boolean(existingMatch),
        existingMatchName: existingMatch?.name,
      });
    });

    setParsedList(staged);
  };

  useEffect(() => {
    if (rawText) {
      parseRawTextToOfficers(rawText);
    }
  }, [defaultRoleOption]);

  // Textarea Change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    parseRawTextToOfficers(val);
  };

  // File Upload (.xlsx / .csv)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buf = await file.arrayBuffer();
        const tsv = await parseXlsxToTsv(buf);
        setRawText(tsv);
        parseRawTextToOfficers(tsv);
      } else {
        const text = await file.text();
        setRawText(text);
        parseRawTextToOfficers(text);
      }
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Download Sample Templates
  const handleDownloadTemplate = (
    type: 'XLSX' | 'CSV',
    roleMode: 'ALL' | 'OFFICER' | 'ACTING' = 'ALL'
  ) => {
    const headers = [
      'คำนำหน้า/ชื่อ-สกุล',
      'บทบาท (OFFICER / ผู้ช่วยเจ้าหน้าที่)',
      'ตำแหน่ง/หน้าที่',
      'ภาควิชา/หน่วยงาน',
      'เบอร์โทรศัพท์',
      'อีเมล (เว้นว่างเพื่อสร้างอัตโนมัติ officerXX@mcu.ac.th)',
      'รหัสผ่าน (เว้นว่างใช้ Fb8323mcu)',
    ];

    let sampleRows: string[][] = [];
    let fileTitle = '';

    if (roleMode === 'OFFICER') {
      fileTitle = 'เทมเพลต_เจ้าหน้าที่หลักสูตร_OFFICER_Fb8323mcu';
      sampleRows = [
        ['นางสาวจิตรา ศิริสุข', 'เจ้าหน้าที่หลักสูตร (OFFICER)', 'เจ้าหน้าที่หลักสูตร', 'ภาควิชาพระพุทธศาสนา', '081-234-5678', '', 'Fb8323mcu'],
        ['พระมหาสุริยา สุริโย', 'เจ้าหน้าที่หลักสูตร (OFFICER)', 'เจ้าหน้าที่หลักสูตร', 'หลักสูตรนานาชาติ (Buddhism)', '035-248-000', '', 'Fb8323mcu'],
        ['นายธนกฤต มณีรัตน์', 'เจ้าหน้าที่หลักสูตร (OFFICER)', 'เจ้าหน้าที่ประจำหลักสูตรบัณฑิตศึกษา', 'สำนักงานคณบดี คณะพุทธศาสตร์', '082-111-2233', '', 'Fb8323mcu'],
      ];
    } else if (roleMode === 'ACTING') {
      fileTitle = 'เทมเพลต_ผู้ช่วยเจ้าหน้าที่_อาจารย์ช่วยงาน_Fb8323mcu';
      sampleRows = [
        ['ดร.สมเกียรติ กิจเจริญ', 'ผู้ช่วยเจ้าหน้าที่ (อาจารย์ช่วยงาน)', 'ผู้ช่วยเจ้าหน้าที่หลักสูตร', 'สำนักงานคณบดี คณะพุทธศาสตร์', '089-876-5432', '', 'Fb8323mcu'],
        ['พระครูสมุห์ประพันธ์ ญาณวโร', 'ผู้ช่วยเจ้าหน้าที่ (อาจารย์ช่วยงาน)', 'อาจารย์ผู้ช่วยงานหลักสูตร', 'ภาควิชาปรัชญา', '084-555-6789', '', 'Fb8323mcu'],
        ['ผศ.ดร.วิชัย ธัมมธีโร', 'ผู้ช่วยเจ้าหน้าที่ (อาจารย์ช่วยงาน)', 'อาจารย์ผู้ช่วยงานหลักสูตร', 'ภาควิชาศาสนาและปรัชญา', '087-999-0011', '', 'Fb8323mcu'],
      ];
    } else {
      fileTitle = 'เทมเพลต_รวมเจ้าหน้าที่และผู้ช่วย_Fb8323mcu';
      sampleRows = [
        ['นางสาวจิตรา ศิริสุข', 'เจ้าหน้าที่หลักสูตร (OFFICER)', 'เจ้าหน้าที่ประจำหลักสูตร', 'ภาควิชาพระพุทธศาสนา', '081-234-5678', '', 'Fb8323mcu'],
        ['ดร.สมเกียรติ กิจเจริญ', 'ผู้ช่วยเจ้าหน้าที่ (อาจารย์ช่วยงาน)', 'ผู้ช่วยเจ้าหน้าที่หลักสูตร', 'สำนักงานคณบดี คณะพุทธศาสตร์', '089-876-5432', '', 'Fb8323mcu'],
        ['พระมหาสุริยา สุริโย', 'เจ้าหน้าที่หลักสูตร (OFFICER)', 'เจ้าหน้าที่หลักสูตร', 'หลักสูตรนานาชาติ (Buddhism)', '035-248-000', '', 'Fb8323mcu'],
        ['นายกิตติศักดิ์ พูลผล', 'เจ้าหน้าที่สายสนับสนุน (STAFF)', 'เจ้าหน้าที่สนับสนุนวิชาการ', 'สำนักงานคณบดี คณะพุทธศาสตร์', '086-555-1234', '', 'Fb8323mcu'],
      ];
    }

    if (type === 'CSV') {
      downloadCsvFile(`${fileTitle}.csv`, headers, sampleRows);
    } else {
      const sheet: XlsxSheet = {
        name: 'เจ้าหน้าที่และผู้ช่วย',
        title: 'แบบฟอร์มนำเข้าเจ้าหน้าที่หลักสูตร & ผู้ช่วยเจ้าหน้าที่ คณะพุทธศาสตร์ มจร',
        subtitle: 'รหัสผ่านเริ่มต้นกำหนดเป็น Fb8323mcu อัตโนมัติ (หากเว้นว่างอีเมล ระบบจะสร้าง officerXX@mcu.ac.th ให้อัตโนมัติ)',
        headers,
        rows: sampleRows,
        columnWidths: [26, 26, 26, 30, 16, 36, 18],
      };
      downloadXlsx(`${fileTitle}.xlsx`, [sheet]);
    }
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
            email: item.email,
            password: item.password || 'Fb8323mcu',
            instructorType: item.position,
            department: item.department || 'สำนักงานคณบดี คณะพุทธศาสตร์',
            phoneNumber: item.phoneNumber,
            role: item.role,
            isActingOfficer: item.isActingOfficer,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
      }

      setSubmitSuccess(
        `บันทึกสำเร็จ: เพิ่มบัญชีใหม่ ${data.createdCount || 0} ท่าน, อัปเดตข้อมูลเดิม ${data.updatedCount || 0} ท่าน`
      );

      onSuccess();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export Handlers
  const handleExportXlsx = () => {
    const headers = [
      'ลำดับ',
      'ชื่อ-นามสกุล',
      'บทบาทในระบบ',
      'หน้าที่/ตำแหน่ง',
      'ภาควิชา/หน่วยงาน',
      'เบอร์โทรศัพท์',
      'ไอดีเข้าใช้งาน (Username/Email)',
      'รหัสผ่านเริ่มต้น',
      'สถานะการใช้งาน',
    ];

    const dataRows = filteredOfficers.map((u, idx) => {
      const isActing = Boolean((u as any).isActingOfficer);
      const roleText = u.role === 'OFFICER' ? 'เจ้าหน้าที่หลักสูตร' : isActing ? 'อาจารย์ผู้ช่วยเจ้าหน้าที่' : 'เจ้าหน้าที่ทั่วไป (Staff)';
      const pwd = u.defaultPassword || (u as any).password || 'Fb8323mcu';

      return [
        idx + 1,
        u.name,
        roleText,
        u.instructorType || (isActing ? 'ผู้ช่วยเจ้าหน้าที่' : 'เจ้าหน้าที่หลักสูตร'),
        u.department || 'สำนักงานคณบดี คณะพุทธศาสตร์',
        (u as any).phoneNumber || '-',
        u.email,
        pwd,
        u.isActive !== false ? 'เปิดใช้งาน' : 'ระงับการใช้งาน',
      ];
    });

    const sheet: XlsxSheet = {
      name: 'เจ้าหน้าที่และผู้ช่วย',
      title: 'รายชื่อเจ้าหน้าที่หลักสูตรและผู้ช่วยเจ้าหน้าที่ คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
      subtitle: `ส่งออกข้อมูล ณ วันที่ ${new Date().toLocaleDateString('th-TH')} • จำนวน ${filteredOfficers.length} ท่าน (รหัสผ่านเริ่มต้น: Fb8323mcu)`,
      headers,
      rows: dataRows,
      columnWidths: [8, 28, 22, 24, 30, 16, 32, 18, 14],
    };

    downloadXlsx(`รายชื่อเจ้าหน้าที่และผู้ช่วยเจ้าหน้าที่_Fb8323mcu_${new Date().toISOString().substring(0, 10)}.xlsx`, [sheet]);
  };

  const handleExportCsv = () => {
    const headers = [
      'ลำดับ',
      'ชื่อ-นามสกุล',
      'บทบาทในระบบ',
      'หน้าที่/ตำแหน่ง',
      'ภาควิชา/หน่วยงาน',
      'เบอร์โทรศัพท์',
      'ไอดีเข้าใช้งาน (Username/Email)',
      'รหัสผ่านเริ่มต้น',
      'สถานะการใช้งาน',
    ];

    const dataRows = filteredOfficers.map((u, idx) => {
      const isActing = Boolean((u as any).isActingOfficer);
      const roleText = u.role === 'OFFICER' ? 'เจ้าหน้าที่หลักสูตร' : isActing ? 'อาจารย์ผู้ช่วยเจ้าหน้าที่' : 'เจ้าหน้าที่ทั่วไป (Staff)';
      const pwd = u.defaultPassword || (u as any).password || 'Fb8323mcu';

      return [
        idx + 1,
        u.name,
        roleText,
        u.instructorType || (isActing ? 'ผู้ช่วยเจ้าหน้าที่' : 'เจ้าหน้าที่หลักสูตร'),
        u.department || 'สำนักงานคณบดี คณะพุทธศาสตร์',
        (u as any).phoneNumber || '-',
        u.email,
        pwd,
        u.isActive !== false ? 'เปิดใช้งาน' : 'ระงับการใช้งาน',
      ];
    });

    downloadCsvFile(`รายชื่อเจ้าหน้าที่และผู้ช่วยเจ้าหน้าที่_Fb8323mcu.csv`, headers, dataRows);
  };

  const handleCopyLineBroadcast = () => {
    const lines = filteredOfficers.map((u, idx) => {
      const isActing = Boolean((u as any).isActingOfficer);
      const roleTag = u.role === 'OFFICER' ? 'เจ้าหน้าที่หลักสูตร' : isActing ? 'ผู้ช่วยเจ้าหน้าที่' : 'เจ้าหน้าที่';
      const pwd = u.defaultPassword || (u as any).password || 'Fb8323mcu';
      return `${idx + 1}. ${u.name} (${roleTag})\n   ไอดี: ${u.email}\n   รหัสผ่าน: ${pwd}`;
    });

    const fullMsg = `📋 ข้อมูลบัญชีผู้ใช้ระบบ: เจ้าหน้าที่หลักสูตรและผู้ช่วยเจ้าหน้าที่\nคณะพุทธศาสตร์ มจร\n\n${lines.join('\n\n')}\n\n🔗 เข้าใช้งานระบบได้ที่: https://ne-ser-fb.vercel.app/login`;
    navigator.clipboard.writeText(fullMsg);
    setCopiedAllTable(true);
    setTimeout(() => setCopiedAllTable(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-teal-300 border border-white/20 shadow-inner">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  ระบบจัดการและนำเข้า/ส่งออก เจ้าหน้าที่หลักสูตร &amp; ผู้ช่วยเจ้าหน้าที่
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-400 text-amber-950">
                  Auto ID &amp; Password: Fb8323mcu
                </span>
              </div>
              <p className="text-xs text-teal-200/90 mt-0.5">
                สร้างไอดี officerXX@mcu.ac.th และรหัสผ่านอัตโนมัติ (Fb8323mcu) รองรับเจ้าหน้าที่หลักสูตรและอาจารย์ช่วยงาน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('IMPORT')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'IMPORT'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>📥 นำเข้าเป็นชุด &amp; สร้างไอดีอัตโนมัติ (Batch Import)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('EXPORT')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'EXPORT'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>📤 ส่งออกรายชื่อและรหัสผ่าน (Export Excel: {currentOfficers.length} ท่าน)</span>
          </button>
        </div>

        {/* Tab 1: IMPORT */}
        {activeTab === 'IMPORT' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            {/* Control Bar: Templates & Options */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>เลือกไฟล์ Excel / CSV</span>
                </button>

                {/* Template Download Group */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300">
                  <span className="text-[11px] font-bold text-slate-500 pl-1.5 flex items-center gap-1">
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>เทมเพลต:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('XLSX', 'ALL')}
                    className="px-2 py-1 rounded-lg hover:bg-slate-100 text-teal-800 font-bold transition cursor-pointer text-[11px]"
                    title="เทมเพลตรวม เจ้าหน้าที่หลักสูตร และ ผู้ช่วยเจ้าหน้าที่"
                  >
                    รวม (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('CSV', 'OFFICER')}
                    className="px-2 py-1 rounded-lg hover:bg-teal-50 text-teal-700 font-bold transition cursor-pointer text-[11px] border-l border-slate-200"
                    title="เทมเพลตเฉพาะ เจ้าหน้าที่หลักสูตร (OFFICER)"
                  >
                    เจ้าหน้าที่ (.csv)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('CSV', 'ACTING')}
                    className="px-2 py-1 rounded-lg hover:bg-amber-50 text-amber-700 font-bold transition cursor-pointer text-[11px] border-l border-slate-200"
                    title="เทมเพลตเฉพาะ ผู้ช่วยเจ้าหน้าที่ (อาจารย์ช่วยงาน)"
                  >
                    ผู้ช่วยเจ้าหน้าที่ (.csv)
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Target Role Selector */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                  <UserCog className="w-3.5 h-3.5 text-teal-600" />
                  <span className="font-bold text-slate-700">กำหนดบทบาทนำเข้า:</span>
                  <select
                    value={defaultRoleOption}
                    onChange={(e) => setDefaultRoleOption(e.target.value as any)}
                    className="bg-transparent font-bold text-teal-800 outline-none cursor-pointer text-xs"
                  >
                    <option value="AUTO">🔍 ตรวจจับอัตโนมัติ (จากไฟล์)</option>
                    <option value="OFFICER">👤 เจ้าหน้าที่หลักสูตร (OFFICER) ทั้งหมด</option>
                    <option value="ACTING_OFFICER">🎓 ผู้ช่วยเจ้าหน้าที่ (อาจารย์ช่วยงาน) ทั้งหมด</option>
                    <option value="STAFF">💼 เจ้าหน้าที่สายสนับสนุน (STAFF) ทั้งหมด</option>
                  </select>
                </div>

                {/* Password Option: Fb8323mcu */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-bold text-slate-700">รหัสผ่าน:</span>
                  <select
                    value={passwordOption}
                    onChange={(e) => setPasswordOption(e.target.value as any)}
                    className="bg-transparent font-bold text-emerald-800 outline-none cursor-pointer text-xs"
                  >
                    <option value="Fb8323mcu">🔑 Fb8323mcu (แนะนำตามโจทย์)</option>
                    <option value="mcu123456">mcu123456 (ค่าเดิมระบบ)</option>
                    <option value="custom">กำหนดเอง...</option>
                  </select>
                  {passwordOption === 'custom' && (
                    <input
                      type="text"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      className="w-24 px-2 py-0.5 rounded border border-slate-300 font-mono text-xs"
                      placeholder="รหัสผ่าน"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Paste Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-600">
                <label className="font-bold">
                  วางข้อมูลจากตาราง Excel หรือพิมพ์รายชื่อ (รองรับคอลัมน์: ชื่อ, ตำแหน่ง, ภาควิชา, เบอร์โทร, อีเมล, รหัสผ่าน):
                </label>
                <span className="text-[11px] text-slate-500">
                  * หากเว้นว่างอีเมล ระบบจะสร้าง <strong>officer01@mcu.ac.th</strong> ให้อัตโนมัติ
                </span>
              </div>
              <textarea
                rows={5}
                value={rawText}
                onChange={handleTextChange}
                placeholder={`ตัวอย่างเช่น:
นางสาวจิตรา ศิริสุข	เจ้าหน้าที่หลักสูตร	ภาควิชาพระพุทธศาสนา	081-234-5678
ดร.สมเกียรติ กิจเจริญ	ผู้ช่วยเจ้าหน้าที่	สำนักงานคณบดี คณะพุทธศาสตร์	089-876-5432
พระมหาสุริยา สุริโย	เจ้าหน้าที่หลักสูตร	หลักสูตรนานาชาติ	035-248-000`}
                className="w-full p-3 font-mono text-xs rounded-2xl border border-slate-300 bg-slate-50/50 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {/* Preview Table */}
            {parsedList.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>รายการที่ตรวจพบ ({parsedList.length} ท่าน):</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      สร้างใหม่: {parsedList.filter((p) => !p.isExisting).length} ท่าน
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                      อัปเดตเดิม: {parsedList.filter((p) => p.isExisting).length} ท่าน
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">ชื่อ-นามสกุล</th>
                        <th className="py-2 px-3">ตำแหน่ง / บทบาท</th>
                        <th className="py-2 px-3">ภาควิชา / หน่วยงาน</th>
                        <th className="py-2 px-3">เบอร์โทร</th>
                        <th className="py-2 px-3">ไอดีที่จะสร้าง/ใช้</th>
                        <th className="py-2 px-3">รหัสผ่าน</th>
                        <th className="py-2 px-3">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-2 px-3 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{item.name}</td>
                          <td className="py-2 px-3">
                            <div className="flex flex-col gap-1 min-w-[170px]">
                              <select
                                value={item.isActingOfficer ? 'ACTING_OFFICER' : item.role === 'STAFF' ? 'STAFF' : 'OFFICER'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setParsedList((prev) =>
                                    prev.map((p, pIdx) => {
                                      if (pIdx !== idx) return p;
                                      if (val === 'ACTING_OFFICER') {
                                        return {
                                          ...p,
                                          role: 'INSTRUCTOR',
                                          isActingOfficer: true,
                                          position: p.position.includes('เจ้าหน้าที่') && !p.position.includes('ผู้ช่วย')
                                            ? p.position.replace('เจ้าหน้าที่', 'ผู้ช่วยเจ้าหน้าที่')
                                            : p.position || 'ผู้ช่วยเจ้าหน้าที่ (อาจารย์ช่วยงาน)',
                                        };
                                      } else if (val === 'STAFF') {
                                        return {
                                          ...p,
                                          role: 'STAFF',
                                          isActingOfficer: false,
                                          position: p.position || 'เจ้าหน้าที่สายสนับสนุน',
                                        };
                                      } else {
                                        return {
                                          ...p,
                                          role: 'OFFICER',
                                          isActingOfficer: false,
                                          position: p.position || 'เจ้าหน้าที่หลักสูตร',
                                        };
                                      }
                                    })
                                  );
                                }}
                                className={`text-[11px] font-bold py-1 px-2 rounded-lg border outline-none cursor-pointer transition ${
                                  item.isActingOfficer
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : item.role === 'STAFF'
                                    ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                                    : 'bg-teal-50 text-teal-900 border-teal-300'
                                }`}
                              >
                                <option value="OFFICER">👤 เจ้าหน้าที่หลักสูตร (OFFICER)</option>
                                <option value="ACTING_OFFICER">🎓 ผู้ช่วยเจ้าหน้าที่ (อาจารย์ช่วยงาน)</option>
                                <option value="STAFF">💼 เจ้าหน้าที่สายสนับสนุน (STAFF)</option>
                              </select>
                              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[160px]" title={item.position}>
                                {item.position}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{item.department || '-'}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{item.phoneNumber || '-'}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-emerald-700">{item.email}</td>
                          <td className="py-2 px-3 font-mono text-slate-700 font-semibold">{item.password}</td>
                          <td className="py-2 px-3">
                            {item.isExisting ? (
                              <span className="text-[10.5px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                พบบัญชีเดิม (Update)
                              </span>
                            ) : (
                              <span className="text-[10.5px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                สร้างบัญชีใหม่
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

            {submitError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: EXPORT */}
        {activeTab === 'EXPORT' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, อีเมล, ภาควิชา..."
                    value={exportSearch}
                    onChange={(e) => setExportSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs w-48 sm:w-60 outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs">
                  <span className="font-bold text-slate-600">ประเภท:</span>
                  <select
                    value={exportRoleFilter}
                    onChange={(e) => setExportRoleFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="ALL">ทั้งหมด ({currentOfficers.length})</option>
                    <option value="OFFICER">เจ้าหน้าที่หลักสูตร (OFFICER)</option>
                    <option value="ACTING">ผู้ช่วยเจ้าหน้าที่ (อาจารย์ช่วยงาน)</option>
                    <option value="STAFF">เจ้าหน้าที่ทั่วไป (STAFF)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLineBroadcast}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="คัดลอกข้อความสรุปรายชื่อและรหัสผ่านสำหรับส่งใน LINE"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{copiedAllTable ? '✓ คัดลอกสำเร็จ!' : 'คัดลอกสำหรับส่ง LINE'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportXlsx}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>ส่งออก Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Officer Export Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                    <th className="py-2.5 px-3">บทบาทในระบบ</th>
                    <th className="py-2.5 px-3">ตำแหน่ง / สังกัด</th>
                    <th className="py-2.5 px-3">เบอร์โทร</th>
                    <th className="py-2.5 px-3">ไอดีเข้าสู่ระบบ (Username)</th>
                    <th className="py-2.5 px-3">รหัสผ่านเริ่มต้น</th>
                    <th className="py-2.5 px-3 text-right">การกระทำ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOfficers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                        ไม่พบข้อมูลเจ้าหน้าที่ตามเงื่อนไขที่ค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredOfficers.map((u, idx) => {
                      const isActing = Boolean((u as any).isActingOfficer);
                      const pwd = u.defaultPassword || (u as any).password || 'Fb8323mcu';
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2 px-3 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{u.name}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                              u.role === 'OFFICER'
                                ? 'bg-teal-100 text-teal-800'
                                : isActing
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {u.role === 'OFFICER' ? 'เจ้าหน้าที่หลักสูตร' : isActing ? 'ผู้ช่วยเจ้าหน้าที่' : 'เจ้าหน้าที่ (Staff)'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{u.department || 'สำนักงานคณบดี คณะพุทธศาสตร์'}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{(u as any).phoneNumber || '-'}</td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-800">{u.email}</td>
                          <td className="py-2 px-3 font-mono font-bold text-amber-800 bg-amber-50/50 px-2 rounded">
                            {pwd}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                const text = `ข้อมูลเข้าสู่ระบบเจ้าหน้าที่ มจร:\nชื่อ: ${u.name}\nไอดี: ${u.email}\nรหัสผ่าน: ${pwd}\nลิงก์: https://ne-ser-fb.vercel.app/login`;
                                navigator.clipboard.writeText(text);
                                setCopiedLineId(u.id);
                                setTimeout(() => setCopiedLineId(null), 2500);
                              }}
                              className="px-2 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 transition cursor-pointer"
                              title="คัดลอกข้อมูลบัญชีนี้เพื่อส่งให้เจ้าหน้าที่"
                            >
                              {copiedLineId === u.id ? '✓ คัดลอกแล้ว' : 'คัดลอกส่ง LINE'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50 shrink-0">
          <div className="text-xs text-slate-500">
            {activeTab === 'IMPORT' ? (
              <span>ระบบรองรับการสร้างไอดีอัตโนมัติ officerXX@mcu.ac.th พร้อมรหัสผ่าน Fb8323mcu</span>
            ) : (
              <span>แสดงทั้งหมด {filteredOfficers.length} ท่าน จาก {currentOfficers.length} ท่านในระบบ</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>

            {activeTab === 'IMPORT' && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isSubmitting || parsedList.length === 0}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>
                  {isSubmitting
                    ? 'กำลังบันทึกข้อมูล...'
                    : `ยืนยันการนำเข้าข้อมูล (${parsedList.length} ท่าน)`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
