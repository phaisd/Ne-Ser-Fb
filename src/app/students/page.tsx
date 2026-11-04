'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  Filter,
  CheckCircle,
  Mail,
  Phone,
  Globe,
  FileText,
  MapPin,
  Calendar,
  CreditCard,
  UserCheck,
  Edit3,
  Save,
  X,
  AlertCircle,
  Sparkles,
  BookOpen,
  ArrowRightLeft,
  Download,
  Upload,
  FileSpreadsheet,
  FileUp,
  FileDown,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckSquare,
  Square,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  ChevronDown,
  GraduationCap
} from 'lucide-react';

interface Student {
  studentCode: string;
  title?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  yearLevel?: number;
  degree?: string;
  department?: string;
  major?: string;
  studyStatus?: string;
  faculty?: string;
  phoneNumber?: string;
  email?: string;
  nationality?: string;
  country?: string;
  age?: number | string;
  gender?: string;
  passportNo?: string;
  passportExpireDate?: string;
  visaType?: string;
  visaExpireDate?: string;
  gpa?: number | string;
  address?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  programType?: 'THAI' | 'ENGLISH';
  remarks?: string;
}

const STUDY_STATUS_OPTIONS = [
  { value: 'ปกติ', label: 'ปกติ (Normal)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'ย้ายเข้า', label: 'ย้ายเข้า (Transferred in)', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'ย้ายออก', label: 'ย้ายออก (Transferred out)', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'เทียบโอน', label: 'เทียบโอน (Credit Transfer)', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'พักการเรียน', label: 'พักการเรียน / รักษาสถานภาพ', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'สำเร็จการศึกษา', label: 'สำเร็จการศึกษา (Graduated)', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { value: 'พ้นสภาพ', label: 'พ้นสภาพ (Dismissed)', color: 'bg-red-100 text-red-800 border-red-300' },
];

function getStatusBadge(status?: string) {
  const match = STUDY_STATUS_OPTIONS.find((s) => s.value === status);
  if (match) return match;
  return { value: status || 'ปกติ', label: status || 'ปกติ', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV Parser Helper for Batch Import
// ─────────────────────────────────────────────────────────────────────────────
function parseCSVToStudents(rawText: string): Partial<Student>[] {
  const text = rawText.trim();
  if (!text) return [];

  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' || char === "'") {
      if (inQuotes && next === char) {
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' && next === '\n') || char === '\n' || char === '\r') {
      if (!inQuotes) {
        lines.push(current);
        current = '';
        if (char === '\r' && next === '\n') i++;
      } else {
        current += '\n';
      }
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current);
  if (lines.length < 2) return [];

  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const delimiter = headerLine.includes('\t') ? '\t' : ',';

  const parseLine = (line: string): string[] => {
    const cols: string[] = [];
    let col = '';
    let inQ = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      const n = line[j + 1];
      if (c === '"') {
        if (inQ && n === '"') {
          col += '"';
          j++;
        } else {
          inQ = !inQ;
        }
      } else if (c === delimiter && !inQ) {
        cols.push(col.trim());
        col = '';
      } else {
        col += c;
      }
    }
    cols.push(col.trim());
    return cols;
  };

  const headers = parseLine(headerLine).map((h) => h.toLowerCase().replace(/[\s\-_]/g, ''));
  const parsedList: Partial<Student>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const obj: Record<string, string> = {};

    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });

    const studentCode = (
      obj['studentcode'] ||
      obj['รหัสนิสิต'] ||
      obj['รหัส'] ||
      obj['code'] ||
      obj['id'] ||
      values[0] ||
      ''
    ).trim();

    if (!studentCode) continue;

    const title = obj['title'] || obj['คำนำหน้า'] || '';
    const firstName = obj['firstname'] || obj['ชื่อ'] || obj['ชื่อตัว'] || '';
    const lastName = obj['lastname'] || obj['นามสกุล'] || '';
    let fullName = obj['fullname'] || obj['ชื่อเต็ม'] || obj['ชื่อ-นามสกุล'] || obj['ชื่อและนามสกุล'] || obj['name'] || '';
    if (!fullName && (firstName || lastName)) {
      fullName = `${title} ${firstName} ${lastName}`.trim();
    }

    const rawStatus = obj['studystatus'] || obj['สถานภาพ'] || obj['สถานะ'] || obj['status'] || '';
    let studyStatus = rawStatus;
    if (rawStatus.includes('ย้ายเข้า') || rawStatus.toLowerCase().includes('transfer in')) studyStatus = 'ย้ายเข้า';
    else if (rawStatus.includes('ย้ายออก') || rawStatus.toLowerCase().includes('transfer out')) studyStatus = 'ย้ายออก';
    else if (rawStatus.includes('เทียบโอน') || rawStatus.toLowerCase().includes('credit transfer')) studyStatus = 'เทียบโอน';
    else if (rawStatus.includes('พัก') || rawStatus.toLowerCase().includes('leave')) studyStatus = 'พักการเรียน';
    else if (rawStatus.includes('สำเร็จ') || rawStatus.toLowerCase().includes('graduat')) studyStatus = 'สำเร็จการศึกษา';
    else if (rawStatus.includes('พ้น') || rawStatus.toLowerCase().includes('dismiss')) studyStatus = 'พ้นสภาพ';
    else if (rawStatus.includes('ปกติ') || rawStatus.toLowerCase().includes('normal')) studyStatus = 'ปกติ';

    const rawProg = (obj['programtype'] || obj['หลักสูตร'] || obj['program'] || obj['ภาค'] || '').toLowerCase();
    let programType: 'THAI' | 'ENGLISH' | undefined;
    if (rawProg.includes('en') || rawProg.includes('eng') || rawProg.includes('inter') || rawProg.includes('อังกฤษ')) {
      programType = 'ENGLISH';
    } else if (rawProg.includes('th') || rawProg.includes('thai') || rawProg.includes('ไทย')) {
      programType = 'THAI';
    }

    const remarks = obj['remarks'] || obj['หมายเหตุ'] || obj['remark'] || obj['note'] || '';
    const rawYear = obj['yearlevel'] || obj['ชั้นปี'] || obj['ปี'] || obj['year'] || '';
    const yearLevel = rawYear ? parseInt(rawYear.replace(/[^0-9]/g, ''), 10) : undefined;
    const major = obj['major'] || obj['สาขาวิชา'] || obj['สาขา'] || '';
    const department = obj['department'] || obj['ภาควิชา'] || '';
    const faculty = obj['faculty'] || obj['คณะ'] || '';
    const degree = obj['degree'] || obj['ระดับการศึกษา'] || '';
    const phoneNumber = obj['phonenumber'] || obj['เบอร์โทร'] || obj['เบอร์โทรศัพท์'] || obj['โทร'] || obj['phone'] || '';
    const email = obj['email'] || obj['อีเมล'] || obj['mail'] || '';
    const nationality = obj['nationality'] || obj['สัญชาติ'] || '';
    const country = obj['country'] || obj['ประเทศ'] || '';
    const passportNo = obj['passportno'] || obj['เลขพาสปอร์ต'] || obj['passport'] || '';
    const visaExpireDate = obj['visaexpiredate'] || obj['วันหมดอายุวีซ่า'] || obj['visaexpire'] || '';

    const studentItem: Partial<Student> = {
      studentCode,
      ...(title && { title }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(fullName && { fullName }),
      ...(studyStatus && { studyStatus }),
      ...(programType && { programType }),
      ...(remarks !== undefined && remarks !== '' && { remarks }),
      ...(yearLevel && { yearLevel }),
      ...(major && { major }),
      ...(department && { department }),
      ...(faculty && { faculty }),
      ...(degree && { degree }),
      ...(phoneNumber && { phoneNumber }),
      ...(email && { email }),
      ...(nationality && { nationality }),
      ...(country && { country }),
      ...(passportNo && { passportNo }),
      ...(visaExpireDate && { visaExpireDate }),
    };

    parsedList.push(studentItem);
  }

  return parsedList;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [programFilter, setProgramFilter] = useState<'ALL' | 'THAI' | 'ENGLISH'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [nationalityFilter, setNationalityFilter] = useState<'ALL' | 'THAI' | 'INTERNATIONAL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [unmaskPassport, setUnmaskPassport] = useState(false);

  const formatPassport = (p?: string) => {
    if (!p) return '';
    if (unmaskPassport) return p;
    if (p.length <= 4) return '••••';
    return `${p.slice(0, 2)}••••${p.slice(-2)}`;
  };

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Multi-selection (Checkboxes)
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>('ย้ายเข้า');
  const [bulkProgram, setBulkProgram] = useState<'THAI' | 'ENGLISH'>('THAI');
  const [bulkRemarks, setBulkRemarks] = useState<string>('');
  const [bulkSaving, setBulkSaving] = useState(false);

  // Export Menu State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Batch Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<'FILE' | 'PASTE'>('FILE');
  const [importRawText, setImportRawText] = useState('');
  const [importParsedList, setImportParsedList] = useState<Partial<Student>[]>([]);
  const [importMode, setImportMode] = useState<'UPDATE_ONLY' | 'UPSERT'>('UPDATE_ONLY');
  const [importSaving, setImportSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadStudents = () => {
    setLoading(true);
    fetch('/api/students')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStudents(data.data);
          setFiltered(data.data);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    let result = students;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.studentCode?.toLowerCase().includes(q) ||
          s.firstName?.toLowerCase().includes(q) ||
          s.lastName?.toLowerCase().includes(q) ||
          s.fullName?.toLowerCase().includes(q) ||
          s.passportNo?.toLowerCase().includes(q) ||
          s.nationality?.toLowerCase().includes(q) ||
          s.major?.toLowerCase().includes(q) ||
          s.remarks?.toLowerCase().includes(q)
      );
    }

    if (yearFilter !== 'ALL') {
      const y = parseInt(yearFilter, 10);
      result = result.filter((s) => s.yearLevel === y);
    }

    if (programFilter !== 'ALL') {
      result = result.filter((s) => s.programType === programFilter);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((s) => s.studyStatus === statusFilter);
    }

    if (nationalityFilter === 'THAI') {
      result = result.filter((s) => s.nationality === 'ไทย' || s.nationality === 'Thai');
    } else if (nationalityFilter === 'INTERNATIONAL') {
      result = result.filter((s) => s.nationality !== 'ไทย' && s.nationality !== 'Thai');
    }

    setFiltered(result);
  }, [search, yearFilter, programFilter, statusFilter, nationalityFilter, students]);

  // Open Edit Modal
  const startEdit = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      ...student,
      programType: student.programType || (student.nationality === 'ไทย' || student.nationality === 'Thai' ? 'THAI' : 'ENGLISH'),
      studyStatus: student.studyStatus || 'ปกติ',
      remarks: student.remarks || '',
    });
    setSelectedStudent(null);
  };

  // Handle Save
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setSaving(true);
    try {
      const res = await fetch('/api/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentCode: editingStudent.studentCode,
          ...editForm,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const updated = data.data;
        setStudents((prev) =>
          prev.map((s) => (s.studentCode === updated.studentCode ? { ...s, ...updated } : s))
        );
        setToastMessage(`แก้ไขข้อมูลนิสิต [${updated.studentCode} ${updated.fullName}] และซิงค์ Google Sheets สำเร็จเรียบร้อย!`);
        setEditingStudent(null);
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + data.error);
      }
    } catch (err: any) {
      alert('บันทึกข้อมูลล้มเหลว: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Multi-selection (Checkboxes) Handlers
  // ─────────────────────────────────────────────────────────────
  const isAllSelected =
    filtered.length > 0 && filtered.every((s) => selectedCodes.has(s.studentCode));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCodes(new Set());
    } else {
      const next = new Set(selectedCodes);
      filtered.forEach((s) => next.add(s.studentCode));
      setSelectedCodes(next);
    }
  };

  const toggleSelectCode = (code: string) => {
    const next = new Set(selectedCodes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedCodes(next);
  };

  // Bulk Update Selected Students (from Floating Action Bar)
  const handleBulkUpdateSelected = async (targetType: 'STATUS' | 'PROGRAM' | 'REMARKS') => {
    if (selectedCodes.size === 0) return;

    setBulkSaving(true);
    try {
      const updatesList: Partial<Student>[] = Array.from(selectedCodes).map((code) => {
        const item: Partial<Student> = { studentCode: code };
        if (targetType === 'STATUS') item.studyStatus = bulkStatus;
        if (targetType === 'PROGRAM') item.programType = bulkProgram;
        if (targetType === 'REMARKS') item.remarks = bulkRemarks;
        return item;
      });

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch-update',
          items: updatesList,
          mode: 'UPDATE_ONLY',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage(
          `อัปเดตข้อมูลนิสิตเป็นชุดสำเร็จ (${data.updated} คน) และซิงค์ Google Sheets เรียบร้อย!`
        );
        setSelectedCodes(new Set());
        loadStudents();
      } else {
        alert('เกิดข้อผิดพลาดในการอัปเดต: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setBulkSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Export Handlers
  // ─────────────────────────────────────────────────────────────
  const exportStudentsToCSV = (list: Student[], filename: string) => {
    const headers = [
      'รหัสนิสิต',
      'คำนำหน้า',
      'ชื่อ',
      'นามสกุล',
      'ชื่อเต็ม',
      'ชั้นปี',
      'ระดับการศึกษา',
      'สาขาวิชา',
      'สถานภาพ',
      'หลักสูตร',
      'เบอร์โทรศัพท์',
      'อีเมล',
      'สัญชาติ',
      'หมายเหตุ',
    ];

    const rows = list.map((s) => [
      s.studentCode || '',
      s.title || '',
      s.firstName || '',
      s.lastName || '',
      s.fullName || `${s.title || ''} ${s.firstName} ${s.lastName}`.trim(),
      String(s.yearLevel || 1),
      s.degree || 'ปริญญาตรี',
      s.major || 'พระพุทธศาสนา',
      s.studyStatus || 'ปกติ',
      s.programType === 'ENGLISH' ? 'ENGLISH' : 'THAI',
      s.phoneNumber || '',
      s.email || '',
      s.nationality || 'ไทย',
      s.remarks || '',
    ]);

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  const handleExportAll = () => {
    exportStudentsToCSV(students, `students_all_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportFiltered = () => {
    exportStudentsToCSV(filtered, `students_filtered_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportSelected = () => {
    const selectedList = students.filter((s) => selectedCodes.has(s.studentCode));
    exportStudentsToCSV(selectedList, `students_selected_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const downloadTemplateCSV = () => {
    const headers = [
      'รหัสนิสิต',
      'คำนำหน้า',
      'ชื่อ',
      'นามสกุล',
      'ชื่อเต็ม',
      'ชั้นปี',
      'ระดับการศึกษา',
      'สาขาวิชา',
      'สถานภาพ',
      'หลักสูตร',
      'เบอร์โทรศัพท์',
      'อีเมล',
      'สัญชาติ',
      'หมายเหตุ',
    ];

    const sampleRows = [
      [
        '6801502001',
        'พระ',
        'สมชาย',
        'ใจดี',
        'พระสมชาย ใจดี',
        '1',
        'ปริญญาตรี',
        'พระพุทธศาสนา',
        'ปกติ',
        'THAI',
        '0812345678',
        'somchai@mcu.ac.th',
        'ไทย',
        'เอกสารครบถ้วน',
      ],
      [
        '6801502002',
        'Ven.',
        'Dhammarakso',
        '',
        'Ven. Dhammarakso',
        '2',
        'ปริญญาตรี',
        'พระพุทธศาสนา',
        'ย้ายเข้า',
        'ENGLISH',
        '',
        'dhammarakso@mcu.ac.th',
        'Myanmar',
        'ย้ายมาจากต่างวิทยาเขต พร้อมใบเทียบเกรด',
      ],
      [
        '6801502003',
        'นาย',
        'ประสิทธิ์',
        'มีชัย',
        'นายประสิทธิ์ มีชัย',
        '3',
        'ปริญญาตรี',
        'พระพุทธศาสนา',
        'เทียบโอน',
        'THAI',
        '0899998888',
        'prasit@mcu.ac.th',
        'ไทย',
        'เทียบโอน 42 หน่วยกิตจาก มมร.',
      ],
    ];

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...sampleRows.map((r) => r.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_batch_edit_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  // ─────────────────────────────────────────────────────────────
  // Batch Import Handlers
  // ─────────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportRawText(text);
      const parsed = parseCSVToStudents(text);
      setImportParsedList(parsed);
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (text: string) => {
    setImportRawText(text);
    const parsed = parseCSVToStudents(text);
    setImportParsedList(parsed);
  };

  const handleExecuteBatchImport = async () => {
    if (importParsedList.length === 0) {
      alert('ไม่พบข้อมูลนิสิตที่สามารถนำเข้าได้ กรุณาตรวจสอบข้อมูล');
      return;
    }

    setImportSaving(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch-update',
          items: importParsedList,
          mode: importMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage(
          `นำเข้าและอัปเดตข้อมูลสำเร็จ: อัปเดต ${data.updated} คน${
            data.added > 0 ? `, เพิ่มใหม่ ${data.added} คน` : ''
          } (ซิงค์ Google Sheets เรียบร้อย)`
        );
        setIsImportModalOpen(false);
        setImportRawText('');
        setImportParsedList([]);
        loadStudents();
      } else {
        alert('เกิดข้อผิดพลาดในการนำเข้า: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setImportSaving(false);
    }
  };

  const thaiCount = students.filter((s) => s.nationality === 'ไทย' || s.nationality === 'Thai').length;
  const intlCount = students.length - thaiCount;
  const thaiProgramCount = students.filter((s) => s.programType === 'THAI').length;
  const engProgramCount = students.filter((s) => s.programType === 'ENGLISH').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-orange-600" />
            ระบบทะเบียนนิสิต (Student Directory & Editing)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ค้นหา ตรวจสอบ และแก้ไขข้อมูลทะเบียนนิสิต (หลักสูตรไทย/อังกฤษ, สถานภาพ ย้ายเข้า/ย้ายออก/เทียบโอน, หมายเหตุ, วีซ่า, ที่อยู่)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Bulk Promotion Button linking to Admin Promotion Tool */}
          <Link
            href="/admin?tab=STUDENTS&promote=true"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-sm hover:shadow transition cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>🎓 เลื่อนชั้นปีการศึกษา (Bulk Promotion)</span>
          </Link>

          {/* Import Batch Button */}
          <button
            onClick={() => {
              setIsImportModalOpen(true);
              setImportTab('FILE');
              setImportRawText('');
              setImportParsedList([]);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm hover:shadow transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>นำเข้าข้อมูลเป็นชุด (Import)</span>
          </button>

          {/* Export Dropdown Button */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>ส่งออก (Export)</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs">
                <button
                  onClick={handleExportAll}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-orange-50 hover:text-orange-700 font-medium flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-bold">ส่งออกนิสิตทั้งหมด</div>
                    <div className="text-[11px] text-slate-400">{students.length} รายการ (.csv / Excel)</div>
                  </div>
                </button>
                <button
                  onClick={handleExportFiltered}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-orange-50 hover:text-orange-700 font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Filter className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-bold">ส่งออกเฉพาะที่กรองอยู่</div>
                    <div className="text-[11px] text-slate-400">{filtered.length} รายการ</div>
                  </div>
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={downloadTemplateCSV}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-orange-50 hover:text-orange-700 font-medium flex items-center gap-2 cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-orange-600" />
                  <div>
                    <div className="font-bold">ดาวน์โหลดแบบฟอร์มตัวอย่าง</div>
                    <div className="text-[11px] text-slate-400">Template สำหรับแก้ไขข้อมูลเป็นชุด</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
            🇹🇭 ภาคไทย: {thaiProgramCount}
          </span>
          <span className="bg-purple-50 border border-purple-200 text-purple-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
            🌐 ภาคอังกฤษ: {engProgramCount}
          </span>
          <span className="bg-orange-50 border border-orange-200 text-orange-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
            พบ {filtered.length} จาก {students.length} คน
          </span>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัสนิสิต (เช่น 680150...), ชื่อ, สัญชาติ, หมายเหตุ, หรือ Passport..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Program Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold w-full md:w-auto shrink-0">
            <button
              onClick={() => setProgramFilter('ALL')}
              className={`px-3 py-2 rounded-lg transition ${
                programFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทุกหลักสูตร
            </button>
            <button
              onClick={() => setProgramFilter('THAI')}
              className={`px-3 py-2 rounded-lg transition ${
                programFilter === 'THAI'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              🇹🇭 ภาคไทย
            </button>
            <button
              onClick={() => setProgramFilter('ENGLISH')}
              className={`px-3 py-2 rounded-lg transition ${
                programFilter === 'ENGLISH'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              🌐 ภาคอังกฤษ (EN)
            </button>
          </div>
        </div>

        {/* Secondary Filter Row: Status, Year, Nationality */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> กรองเพิ่มเติม:
          </span>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="ALL">สถานภาพ: ทั้งหมด</option>
            {STUDY_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Year Filter */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="ALL">ชั้นปี: ทั้งหมด</option>
            <option value="1">ชั้นปีที่ 1</option>
            <option value="2">ชั้นปีที่ 2</option>
            <option value="3">ชั้นปีที่ 3</option>
            <option value="4">ชั้นปีที่ 4</option>
          </select>

          {/* Nationality Filter */}
          <select
            value={nationalityFilter}
            onChange={(e) => setNationalityFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="ALL">สัญชาติ: ทั้งหมด</option>
            <option value="THAI">🇹🇭 สัญชาติไทย</option>
            <option value="INTERNATIONAL">🌐 สัญชาติต่างชาติ</option>
          </select>

          {(search ||
            programFilter !== 'ALL' ||
            statusFilter !== 'ALL' ||
            yearFilter !== 'ALL' ||
            nationalityFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setProgramFilter('ALL');
                setStatusFilter('ALL');
                setYearFilter('ALL');
                setNationalityFilter('ALL');
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              ล้างตัวกรอง
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setUnmaskPassport(!unmaskPassport)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                unmaskPassport
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="เปิด/ปิดการปกปิดเลขหนังสือเดินทางตามนโยบาย PDPA (Data Protection)"
            >
              {unmaskPassport ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              <span>{unmaskPassport ? 'แสดงเลข Passport เต็ม' : '🔒 ซ่อนเลข Passport (PDPA Mask)'}</span>
            </button>
            <span className="text-slate-400 font-medium">
              แสดง {filtered.length} รายการ
            </span>
          </div>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
          กำลังโหลดข้อมูลทะเบียนนิสิต...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
          ไม่พบข้อมูลนิสิตที่ตรงกับเงื่อนไขการค้นหา
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      title={isAllSelected ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมดที่แสดงอยู่'}
                    />
                  </th>
                  <th className="px-5 py-3.5">รหัสนิสิต</th>
                  <th className="px-5 py-3.5">ชื่อ - นามสกุล</th>
                  <th className="px-5 py-3.5">หลักสูตร & สัญชาติ</th>
                  <th className="px-5 py-3.5">สถานภาพ</th>
                  <th className="px-5 py-3.5">ชั้นปี & สาขาวิชา</th>
                  <th className="px-5 py-3.5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.slice(0, 50).map((s, idx) => {
                  const isThai = s.nationality === 'ไทย' || s.nationality === 'Thai';
                  const isEnProg = s.programType === 'ENGLISH';
                  const statusBadge = getStatusBadge(s.studyStatus);
                  const isSelected = selectedCodes.has(s.studentCode);

                  return (
                    <tr
                      key={`${s.studentCode}-${idx}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-orange-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectCode(s.studentCode)}
                          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                      </td>

                      {/* Student Code */}
                      <td className="px-5 py-4 font-mono font-bold text-orange-600">
                        {s.studentCode}
                      </td>

                      {/* Name */}
                      <td className="px-5 py-4 font-medium text-slate-900 max-w-xs">
                        <div className="font-bold">{s.fullName || `${s.title || ''} ${s.firstName} ${s.lastName}`}</div>
                        {s.email && <div className="text-[11px] text-slate-400 font-normal">{s.email}</div>}
                        {s.remarks && (
                          <div className="text-[11px] text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded mt-1 line-clamp-1 border border-amber-100">
                            หมายเหตุ: {s.remarks}
                          </div>
                        )}
                      </td>

                      {/* Program & Nationality */}
                      <td className="px-5 py-4 space-y-1">
                        <div>
                          {isEnProg ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <Globe className="w-3 h-3" />
                              ภาคภาษาอังกฤษ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span>🇹🇭</span>
                              ภาคภาษาไทย
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {isThai ? 'สัญชาติไทย' : `สัญชาติ ${s.nationality || 'ต่างชาติ'}`}
                          {s.passportNo && (
                            <span className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded ml-1 text-[11px]">
                              Pass: {formatPassport(s.passportNo)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Year & Major */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          ชั้นปีที่ {s.yearLevel || '-'} ({s.degree || 'ป.ตรี'})
                        </div>
                        <div className="text-xs text-slate-400 line-clamp-1">{s.major || s.department || '-'}</div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => startEdit(s)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition inline-flex items-center gap-1 cursor-pointer"
                            title="แก้ไขข้อมูลนิสิต"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            แก้ไข
                          </button>
                          <button
                            onClick={() => setSelectedStudent(s)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 transition cursor-pointer"
                          >
                            ดูข้อมูล
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 50 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
              แสดง 50 รายการแรกจาก {filtered.length} รายการ (พิมพ์ในช่องค้นหาเพื่อเจาะจงนิสิตที่ต้องการ)
            </div>
          )}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedCodes.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[94%] bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
              {selectedCodes.size}
            </span>
            <div>
              <div className="text-sm font-bold">เลือกนิสิต {selectedCodes.size} คน</div>
              <div className="text-xs text-slate-400">แก้ไขสถานภาพ หรือหลักสูตรพร้อมกันเป็นชุด</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Bulk Status Select & Apply */}
            <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 pl-1 font-medium">เปลี่ยนสถานภาพ:</span>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="bg-slate-900 text-white rounded-lg px-2.5 py-1 text-xs border border-slate-700 focus:outline-none focus:border-orange-500"
              >
                {STUDY_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleBulkUpdateSelected('STATUS')}
                disabled={bulkSaving}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold px-3 py-1 rounded-lg transition cursor-pointer"
              >
                {bulkSaving ? 'กำลังบันทึก...' : 'ปรับใช้'}
              </button>
            </div>

            {/* Bulk Program Select & Apply */}
            <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
              <span className="text-slate-400 pl-1 font-medium">เปลี่ยนหลักสูตร:</span>
              <select
                value={bulkProgram}
                onChange={(e) => setBulkProgram(e.target.value as any)}
                className="bg-slate-900 text-white rounded-lg px-2.5 py-1 text-xs border border-slate-700 focus:outline-none focus:border-orange-500"
              >
                <option value="THAI">🇹🇭 ภาคไทย</option>
                <option value="ENGLISH">🌐 ภาคอังกฤษ</option>
              </select>
              <button
                onClick={() => handleBulkUpdateSelected('PROGRAM')}
                disabled={bulkSaving}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-3 py-1 rounded-lg transition cursor-pointer"
              >
                {bulkSaving ? 'กำลังบันทึก...' : 'ปรับใช้'}
              </button>
            </div>

            {/* Export Selected */}
            <button
              onClick={handleExportSelected}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="ส่งออกเฉพาะรายชื่อที่เลือก"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span>ส่งออก ({selectedCodes.size})</span>
            </button>

            {/* Clear selection */}
            <button
              onClick={() => setSelectedCodes(new Set())}
              className="text-slate-400 hover:text-white p-2 transition ml-1 cursor-pointer"
              title="ยกเลิกการเลือก"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. VIEW STUDENT DETAILS MODAL
         ───────────────────────────────────────────────────────────── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                    {selectedStudent.studentCode}
                  </span>
                  {selectedStudent.programType === 'ENGLISH' ? (
                    <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                      🌐 หลักสูตรภาคภาษาอังกฤษ
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      🇹🇭 หลักสูตรภาคภาษาไทย
                    </span>
                  )}
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(selectedStudent.studyStatus).color}`}>
                    {getStatusBadge(selectedStudent.studyStatus).label}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  {selectedStudent.fullName || `${selectedStudent.title || ''} ${selectedStudent.firstName} ${selectedStudent.lastName}`}
                </h3>
                <p className="text-xs text-slate-500">{selectedStudent.faculty || 'คณะพุทธศาสตร์'}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Academic Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-xs text-slate-500 block">ระดับการศึกษา</span>
                <span className="font-semibold text-slate-800">{selectedStudent.degree || 'ปริญญาตรี'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-xs text-slate-500 block">ชั้นปี</span>
                <span className="font-semibold text-slate-800">ปีที่ {selectedStudent.yearLevel || '-'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-xs text-slate-500 block">สาขาวิชา</span>
                <span className="font-semibold text-slate-800">{selectedStudent.major || '-'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-xs text-slate-500 block">เกรดเฉลี่ย (GPA)</span>
                <span className="font-semibold text-slate-800">{selectedStudent.gpa || '-'}</span>
              </div>
            </div>

            {/* Remarks Callout (if filled) */}
            {selectedStudent.remarks && (
              <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-amber-700" />
                  หมายเหตุสถานภาพ:
                </div>
                <div className="text-amber-800 font-medium pl-5">
                  {selectedStudent.remarks}
                </div>
              </div>
            )}

            {/* Passport & Visa Info */}
            <div className="bg-purple-50/60 border border-purple-200/80 p-4 rounded-xl space-y-3">
              <div className="text-xs font-bold text-purple-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-700" />
                ข้อมูลหนังสือเดินทางและสัญชาติ
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">สัญชาติ / ประเทศ:</span>
                  <span className="font-bold text-slate-800">
                    {selectedStudent.nationality || '-'} / {selectedStudent.country || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">อายุ:</span>
                  <span className="font-bold text-slate-800">{selectedStudent.age ? `${selectedStudent.age} ปี` : '-'}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 block">Passport No:</span>
                    <button
                      type="button"
                      onClick={() => setUnmaskPassport(!unmaskPassport)}
                      className="text-[10px] text-purple-600 hover:text-purple-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      {unmaskPassport ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{unmaskPassport ? 'ซ่อน' : 'ดูเต็ม'}</span>
                    </button>
                  </div>
                  <span className="font-mono font-bold text-purple-700">
                    {selectedStudent.passportNo ? formatPassport(selectedStudent.passportNo) : 'ไม่มีข้อมูล'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">ประเภทวีซ่า:</span>
                  <span className="font-bold text-slate-800">{selectedStudent.visaType || 'ไม่มีข้อมูล'}</span>
                </div>
              </div>
            </div>

            {/* Address & Contact */}
            <div className="space-y-2 text-xs text-slate-600 border-t pt-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  ที่อยู่: {selectedStudent.address || '-'}{' '}
                  {selectedStudent.subdistrict && `ตำบล${selectedStudent.subdistrict} `}
                  {selectedStudent.district && `อำเภอ${selectedStudent.district} `}
                  {selectedStudent.province && `จังหวัด${selectedStudent.province} `}
                  {selectedStudent.postalCode && selectedStudent.postalCode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>เบอร์โทร: {selectedStudent.phoneNumber || 'ไม่มีข้อมูล'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>อีเมล: {selectedStudent.email || 'ไม่มีข้อมูล'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => startEdit(selectedStudent)}
                className="py-2.5 px-4 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                แก้ไขข้อมูลนิสิต
              </button>
              <Link
                href="/certificates"
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                ออกหนังสือรับรอง
              </Link>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. EDIT STUDENT PROFILE MODAL
         ───────────────────────────────────────────────────────────── */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                    {editingStudent.studentCode}
                  </span>
                  <span className="text-xs font-bold text-slate-600">แก้ไขข้อมูลทะเบียนนิสิต</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {editForm.fullName || `${editForm.title || ''} ${editForm.firstName || ''} ${editForm.lastName || ''}`}
                </h3>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-6">
              {/* SECTION A: ข้อมูลการศึกษาและชื่อ-สกุล */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-orange-600">
                  <Users className="w-4 h-4" />
                  1. ข้อมูลส่วนตัว หลักสูตร และสถานภาพการศึกษา
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">คำนำหน้า (Title)</label>
                    <input
                      type="text"
                      placeholder="เช่น พระ, พระมหา, นาย, Ven."
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">ชื่อ (First Name) *</label>
                    <input
                      type="text"
                      required
                      value={editForm.firstName || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">นามสกุล (Last Name)</label>
                    <input
                      type="text"
                      value={editForm.lastName || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* หลักสูตร และ สถานภาพนิสิต */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      หลักสูตร (Curriculum Program) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={editForm.programType || (editForm.nationality === 'ไทย' || editForm.nationality === 'Thai' ? 'THAI' : 'ENGLISH')}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, programType: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white font-semibold focus:outline-none focus:border-orange-500"
                    >
                      <option value="THAI">🇹🇭 หลักสูตรภาคภาษาไทย (Thai Program)</option>
                      <option value="ENGLISH">🌐 หลักสูตรภาคภาษาอังกฤษ (English Program)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
                      สถานภาพนิสิต (Study Status) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={editForm.studyStatus || 'ปกติ'}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, studyStatus: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white font-semibold focus:outline-none focus:border-orange-500"
                    >
                      {STUDY_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">ชั้นปี (Year Level)</label>
                    <select
                      value={editForm.yearLevel || 1}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, yearLevel: parseInt(e.target.value, 10) }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="1">ปีที่ 1</option>
                      <option value="2">ปีที่ 2</option>
                      <option value="3">ปีที่ 3</option>
                      <option value="4">ปีที่ 4</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">ระดับการศึกษา (Degree)</label>
                    <select
                      value={editForm.degree || 'ปริญญาตรี'}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, degree: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="ปริญญาตรี">ปริญญาตรี</option>
                      <option value="ปริญญาโท">ปริญญาโท</option>
                      <option value="ปริญญาเอก">ปริญญาเอก</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">สาขาวิชา (Major)</label>
                    <input
                      type="text"
                      value={editForm.major || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, major: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Remarks Field */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    หมายเหตุ (Remarks / Note) <span className="text-slate-400 font-normal">(ระบุรายละเอียด เช่น ย้ายมาจากสถาบันใด, เทียบโอนกี่หน่วยกิต, เหตุผลการย้าย ฯลฯ)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="เช่น ย้ายเข้าจากวิทยาเขตเชียงใหม่ ภาคเรียนที่ 1/2569, เทียบโอน 18 หน่วยกิต, หรือระบุสาเหตุการย้ายออก..."
                    value={editForm.remarks || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, remarks: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* SECTION B: ข้อมูลสัญชาติ หนังสือเดินทาง วีซ่า */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-purple-600">
                  <CreditCard className="w-4 h-4" />
                  2. สัญชาติ หนังสือเดินทาง และวีซ่า
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">อายุ (Age)</label>
                    <input
                      type="text"
                      placeholder="เช่น 26"
                      value={editForm.age || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, age: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">เพศ (Gender)</label>
                    <select
                      value={editForm.gender || 'ชาย'}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="ชาย">ชาย</option>
                      <option value="หญิง">หญิง</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">สัญชาติ (Nationality)</label>
                    <input
                      type="text"
                      placeholder="เช่น ไทย, Myanmar, Vietnamese"
                      value={editForm.nationality || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, nationality: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">ประเทศ (Country)</label>
                    <input
                      type="text"
                      placeholder="เช่น Thailand, Myanmar"
                      value={editForm.country || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, country: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">หมายเลข Passport (Passport No)</label>
                    <input
                      type="text"
                      placeholder="เช่น MB123456"
                      value={editForm.passportNo || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, passportNo: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">วันหมดอายุ Passport</label>
                    <input
                      type="text"
                      placeholder="เช่น 12 พ.ย. 2572 หรือ 2029-11-12"
                      value={editForm.passportExpireDate || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, passportExpireDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">ประเภทวีซ่า (Visa Type)</label>
                    <input
                      type="text"
                      placeholder="เช่น Non-ED, Tourist, ผ่อนผัน"
                      value={editForm.visaType || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, visaType: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">วันหมดอายุวีซ่า (Visa Expire Date)</label>
                    <input
                      type="text"
                      placeholder="เช่น 24 ส.ค. 2569 หรือ 2026-08-24"
                      value={editForm.visaExpireDate || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, visaExpireDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: ที่อยู่และการติดต่อ */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
                  <MapPin className="w-4 h-4" />
                  3. ข้อมูลการติดต่อ ที่อยู่ และเกรด
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">เกรดเฉลี่ยสะสม (GPA)</label>
                    <input
                      type="text"
                      placeholder="เช่น 3.45"
                      value={editForm.gpa || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, gpa: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">เบอร์โทรศัพท์ (Phone)</label>
                    <input
                      type="text"
                      placeholder="เช่น 081-234-5678"
                      value={editForm.phoneNumber || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">อีเมล (Email)</label>
                    <input
                      type="email"
                      placeholder="student@mcu.ac.th"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">ที่อยู่ / วัด / หอพัก (Address)</label>
                  <input
                    type="text"
                    placeholder="เช่น 79 หมู่ 1 วัดมหาจุฬาลงกรณราชวิทยาลัย"
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">ตำบล/แขวง</label>
                    <input
                      type="text"
                      placeholder="เช่น ลำไทร"
                      value={editForm.subdistrict || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, subdistrict: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">อำเภอ/เขต</label>
                    <input
                      type="text"
                      placeholder="เช่น วังน้อย"
                      value={editForm.district || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, district: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">จังหวัด</label>
                    <input
                      type="text"
                      placeholder="เช่น พระนครศรีอยุธยา"
                      value={editForm.province || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, province: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">รหัสไปรษณีย์</label>
                    <input
                      type="text"
                      placeholder="เช่น 13170"
                      value={editForm.postalCode || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-md shadow-orange-500/20 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'กำลังบันทึกและซิงค์ Sheets...' : 'บันทึกการแก้ไขข้อมูล'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. BATCH IMPORT & BULK UPDATE MODAL
         ───────────────────────────────────────────────────────────── */}
      {isImportModalOpen && (
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
                onClick={() => setIsImportModalOpen(false)}
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
                onClick={downloadTemplateCSV}
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
                  onChange={handleFileUpload}
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
                  <p className="text-xs text-slate-500 max-w-sm">
                    รองรับไฟล์ที่มีคอลัมน์: รหัสนิสิต, สถานภาพ, หลักสูตร, หมายเหตุ ฯลฯ
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
                  onChange={(e) => handlePasteChange(e.target.value)}
                  placeholder={`รหัสนิสิต\tสถานภาพ\tหลักสูตร\tหมายเหตุ\n6801502001\tย้ายเข้า\tTHAI\tย้ายมาจากวิทยาเขตเชียงใหม่\n6801502002\tเทียบโอน\tENGLISH\tเทียบโอน 36 หน่วยกิต`}
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
                            <td className="px-3 py-2">
                              {item.studyStatus ? (
                                <span className="px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800">
                                  {item.studyStatus}
                                </span>
                              ) : (
                                <span className="text-slate-400">ไม่เปลี่ยน ({existing?.studyStatus || 'ปกติ'})</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {item.programType ? (
                                <span className={`px-2 py-0.5 rounded font-bold ${
                                  item.programType === 'ENGLISH' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {item.programType === 'ENGLISH' ? '🌐 ภาคอังกฤษ' : '🇹🇭 ภาคไทย'}
                                </span>
                              ) : (
                                <span className="text-slate-400">ไม่เปลี่ยน</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {item.remarks || '-'}
                            </td>
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
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                disabled={importParsedList.length === 0 || importSaving}
                onClick={handleExecuteBatchImport}
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
      )}
    </div>
  );
}
