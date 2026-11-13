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
  GraduationCap,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { getAuthUser, isAdminOrOfficer, saveAuthSession } from '@/lib/auth-client';
import {
  Student,
  STUDY_STATUS_OPTIONS,
  getStatusBadge,
  DeleteTarget,
  formatPassportMask,
  parseCSVToStudents,
  downloadStudentsCSV,
  downloadSampleStudentsCSV,
  StudentFiltersBar,
  StudentMobileCards,
  StudentTableView,
  StudentBulkActionBar,
  StudentDetailModal,
  StudentEditModal,
  StudentDeleteModal,
  StudentImportModal,
} from '@/components/students';

export default function StudentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      setCurrentUser(user);
      setIsAuthChecking(false);
    } else {
      fetch('/api/auth')
        .then((r) => r.json())
        .then((d) => {
          if (d.authenticated && d.user) {
            setCurrentUser(d.user);
            saveAuthSession(d.user, true);
          }
        })
        .catch(() => {})
        .finally(() => setIsAuthChecking(false));
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qSearch = params.get('search');
      if (qSearch) {
        setSearch(qSearch);
      }
    }
  }, []);

  const isAdmin = isAdminOrOfficer(currentUser);

  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [programFilter, setProgramFilter] = useState<'ALL' | 'THAI' | 'ENGLISH'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [nationalityFilter, setNationalityFilter] = useState<'ALL' | 'THAI' | 'INTERNATIONAL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [unmaskPassport, setUnmaskPassport] = useState(false);

  const formatPassport = (p?: string) => formatPassportMask(p, unmaskPassport);

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Multi-selection (Checkboxes)
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    targets: { studentCode: string; fullName: string; major?: string; yearLevel?: number }[];
    isBulk: boolean;
  }>({ isOpen: false, targets: [], isBulk: false });
  const [isDeleting, setIsDeleting] = useState(false);
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

          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const qSearch = params.get('search')?.trim();
            const shouldEdit = params.get('edit') === 'true';
            if (qSearch && shouldEdit && Array.isArray(data.data)) {
              const target = data.data.find((s: Student) => s.studentCode === qSearch);
              if (target) {
                startEdit(target);
              }
            }
          }
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
      programType: student.programType || 'THAI',
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
    } catch (err: unknown) {
      alert('บันทึกข้อมูลล้มเหลว: ' + (err instanceof Error ? err.message : String(err)));
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

  // Delete Student handler (Single & Bulk)
  const handleConfirmDelete = async () => {
    if (deleteModal.targets.length === 0) return;
    setIsDeleting(true);
    try {
      const codes = deleteModal.targets.map((t) => t.studentCode);
      const res = await fetch('/api/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentCodes: codes }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`ลบข้อมูลนิสิตเรียบร้อยแล้ว จำนวน ${data.deletedCount || codes.length} รูป/คน`);
        const deletedSet = new Set(codes);
        setSelectedCodes((prev) => {
          const next = new Set(prev);
          codes.forEach((c) => next.delete(c));
          return next;
        });
        setDeleteModal({ isOpen: false, targets: [], isBulk: false });
        loadStudents();
      } else {
        alert('เกิดข้อผิดพลาดในการลบ: ' + (data.error || 'ไม่สามารถลบได้'));
      }
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsDeleting(false);
    }
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
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBulkSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Export Handlers (Unified CSV Format with /admin)
  // ─────────────────────────────────────────────────────────────
  const exportStudentsToCSV = (list: Student[], filename: string) => {
    downloadStudentsCSV(list, filename);
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
    downloadSampleStudentsCSV('sample_students_template.csv');
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
      let res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch-update',
          items: importParsedList,
          mode: importMode,
        }),
      });

      if (res.status === 401) {
        const localUser = getAuthUser();
        if (localUser && (localUser.email || localUser.id)) {
          await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'sync-session',
              email: localUser.email,
              gmail: localUser.gmail,
              id: localUser.id,
              rememberMe: true,
            }),
          });
          res = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'batch-update',
              items: importParsedList,
              mode: importMode,
            }),
          });
        }
      }

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
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setImportSaving(false);
    }
  };

  const thaiCount = students.filter((s) => s.nationality === 'ไทย' || s.nationality === 'Thai').length;
  const intlCount = students.length - thaiCount;
  const thaiProgramCount = students.filter((s) => s.programType === 'THAI').length;
  const engProgramCount = students.filter((s) => s.programType === 'ENGLISH').length;

  // Access Control: Only Admin / Super Admin can view the Student Directory
  if (!isAuthChecking && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          พื้นที่สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin Only)
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          ระบบฐานข้อมูลทะเบียนนิสิต (Directory) สงวนสิทธิ์การเข้าถึงเฉพาะผู้ดูแลระบบและเจ้าหน้าที่ดูแลระบบ คณะพุทธศาสตร์ เท่านั้น เพื่อคุ้มครองข้อมูลส่วนบุคคลของนิสิต
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
          >
            ← กลับสู่หน้าหลัก
          </Link>
          <Link
            href="/admin"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-xs transition shadow-md"
          >
            เข้าสู่ระบบผู้ดูแลระบบ (Login Admin) →
          </Link>
        </div>
      </div>
    );
  }

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
      <StudentFiltersBar
        search={search}
        setSearch={setSearch}
        programFilter={programFilter}
        setProgramFilter={setProgramFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        yearFilter={yearFilter}
        setYearFilter={setYearFilter}
        nationalityFilter={nationalityFilter}
        setNationalityFilter={setNationalityFilter}
        unmaskPassport={unmaskPassport}
        setUnmaskPassport={setUnmaskPassport}
        filteredCount={filtered.length}
      />

      {/* Students Table & Mobile Card View */}
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
          {/* 1. Mobile Cards View (< sm: 640px) */}
          <StudentMobileCards
            students={filtered}
            selectedCodes={selectedCodes}
            toggleSelectCode={toggleSelectCode}
            toggleSelectAll={toggleSelectAll}
            isAllSelected={isAllSelected}
            onViewDetails={(s) => setSelectedStudent(s)}
            onEdit={(s) => startEdit(s)}
            onDelete={(target) => setDeleteModal({ isOpen: true, targets: [target], isBulk: false })}
          />

          {/* 2. Desktop Table View (>= sm: 640px) */}
          <StudentTableView
            students={filtered}
            selectedCodes={selectedCodes}
            toggleSelectCode={toggleSelectCode}
            toggleSelectAll={toggleSelectAll}
            isAllSelected={isAllSelected}
            unmaskPassport={unmaskPassport}
            onViewDetails={(s) => setSelectedStudent(s)}
            onEdit={(s) => startEdit(s)}
            onDelete={(target) => setDeleteModal({ isOpen: true, targets: [target], isBulk: false })}
          />

          {filtered.length > 50 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
              แสดง 50 รายการแรกจาก {filtered.length} รายการ (พิมพ์ในช่องค้นหาเพื่อเจาะจงนิสิตที่ต้องการ)
            </div>
          )}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <StudentBulkActionBar
        selectedCodes={selectedCodes}
        students={students}
        bulkStatus={bulkStatus}
        setBulkStatus={setBulkStatus}
        bulkProgram={bulkProgram}
        setBulkProgram={setBulkProgram}
        bulkSaving={bulkSaving}
        onBulkUpdate={handleBulkUpdateSelected}
        onBulkDelete={(targets) => setDeleteModal({ isOpen: true, targets, isBulk: true })}
        onExportSelected={handleExportSelected}
        onClearSelection={() => setSelectedCodes(new Set())}
      />

      {/* 1. View Student Details Modal */}
      <StudentDetailModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onEdit={(s) => startEdit(s)}
        unmaskPassport={unmaskPassport}
        setUnmaskPassport={setUnmaskPassport}
      />

      {/* 2. Edit Student Profile Modal */}
      <StudentEditModal
        editingStudent={editingStudent}
        editForm={editForm}
        setEditForm={setEditForm}
        onClose={() => setEditingStudent(null)}
        onSave={handleSaveStudent}
        saving={saving}
      />

      {/* 3. Delete Student Confirmation Modal */}
      <StudentDeleteModal
        isOpen={deleteModal.isOpen}
        targets={deleteModal.targets}
        isBulk={deleteModal.isBulk}
        isDeleting={isDeleting}
        onClose={() => setDeleteModal({ isOpen: false, targets: [], isBulk: false })}
        onConfirm={handleConfirmDelete}
      />

      {/* 4. Batch Import Modal */}
      <StudentImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        importTab={importTab}
        setImportTab={setImportTab}
        importMode={importMode}
        setImportMode={setImportMode}
        importRawText={importRawText}
        onPasteChange={handlePasteChange}
        onFileUpload={handleFileUpload}
        onDownloadTemplate={downloadTemplateCSV}
        importParsedList={importParsedList}
        students={students}
        onExecuteImport={handleExecuteBatchImport}
        importSaving={importSaving}
      />
    </div>
  );
}
