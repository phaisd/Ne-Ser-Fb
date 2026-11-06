'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  FileText,
  CheckSquare,
  Users,
  Table2,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  EyeOff,
  QrCode,
  Archive,
  Printer,
  ArrowLeft,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  GraduationCap,
  Calendar,
  AlertCircle,
  LayoutDashboard,
  Sliders,
  SlidersHorizontal,
  BookOpen,
  Settings,
  Palette,
  UserCog,
  UploadCloud,
  LogOut,
  RefreshCw,
  Plus,
  Key,
  Globe,
  HelpCircle,
  Menu,
  ChevronRight,
  Sparkles,
  Lock,
  Mail,
  Phone,
  MapPin,
  Building2,
  CheckCircle2,
  Ban,
  UserCheck,
  Edit,
  ShieldAlert,
  Image as ImageIcon,
  Trash2,
  Camera,
  Download,
  Type,
  MoveVertical,
  Layers,
  Send,
  Paperclip,
  AlertTriangle,
  ZoomIn,
  FileCheck2,
  RotateCcw,
  CheckCheck,
  Square,
  ArrowRight,
  Copy,
  Hash,
  FileEdit,
  Save,
  Award
} from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf-export';
import { getAuthUser, saveAuthSession, clearAuthSession } from '@/lib/auth-client';
import {
  AdminSheetsTab,
  AdminTimetablesTab,
  AdminAttendanceTab,
  AdminCoursesTab,
  AdminStudentsTab,
  AdminDashboardTab,
  AdminUsersTab,
  AdminBrandingTab,
  AdminCertificatesTab,
  AdminEventsTab,
} from '@/components/admin/tabs';
import {
  StudentDeleteModal,
  TeachingSlipModal,
  BatchTeachingSlipsModal,
  EditUserModal,
  AutoProvisionModal,
  AddUserModal,
  CertRejectModal,
  ArchiveSummaryModal,
  BulkPromotionModal,
  AdminCertificatePreviewModal,
} from '@/components/admin/modals';
import { NewAcademicYearWorkflowModal } from '@/components/admin/NewAcademicYearWorkflowModal';
import { AdminSidebar, AdminTab } from '@/components/admin/AdminSidebar';

import {
  CertificateRequest,
  SignatoryItem,
  SystemSettings,
  UserAccount,
  Student,
  Course,
  TimetableItem,
  AttendanceRecord
} from '@/types';
import {
  matchInstructorStrict,
  getSubstantiveTokens,
  INSTRUCTOR_TITLE_REGEX,
  INSTRUCTOR_THAI_TITLE_PREFIX,
  formatThaiDate,
  formatEnglishDate,
  maskPassport
} from '@/lib/utils';

const SIGNER_PRESETS = [
  {
    id: 'DEAN',
    label: '1. คณบดีคณะพุทธศาสตร์ (พระครูสุธีกิตติบัณฑิต, รศ.ดร.)',
    name: 'พระครูสุธีกิตติบัณฑิต, รศ.ดร.',
    title: 'คณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'VICE_ACADEMIC',
    label: '2. รองคณบดีฝ่ายวิชาการ (ปฏิบัติหน้าที่แทนคณบดี)',
    name: 'พระมหาหรรษา ธมฺมหาโส, ศ.ดร.',
    title: 'รองคณบดีฝ่ายวิชาการ ปฏิบัติหน้าที่แทนคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'VICE_STUDENT',
    label: '3. รองคณบดีฝ่ายกิจการนิสิต (รับรองความประพฤติ/กิจกรรม)',
    name: 'พระมหาบุญเลิศ ช่วยธานี, ศ.ดร.',
    title: 'รองคณบดีฝ่ายกิจการนิสิต คณะพุทธศาสตร์',
  },
  {
    id: 'SECRETARY',
    label: '4. เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์',
    name: '',
    title: 'เลขานุการสำนักงานคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'ACTING_DEAN',
    label: '5. ผู้รักษาราชการแทนคณบดีคณะพุทธศาสตร์',
    name: '',
    title: 'รักษาราชการแทนคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'REGISTRAR',
    label: '6. ผู้อำนวยการส่วนทะเบียนและวัดผล (นายทะเบียน)',
    name: 'พระมหาสุริยัน ปญฺญาวชิโร, ผศ.ดร.',
    title: 'ผู้อำนวยการส่วนทะเบียนและวัดผล',
  },
  {
    id: 'BLANK',
    label: '7. เว้นว่างไว้สำหรับลงนามสดด้วยลายมือปากกา (Handwritten)',
    name: '',
    title: 'คณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'CUSTOM',
    label: '8. กำหนดเอง (พิมพ์ชื่อและตำแหน่งระบุเอง)',
    name: '',
    title: '',
  },
];

const REJECT_PRESET_REASONS = [
  'ข้อมูลไม่ครบถ้วน',
  'ไม่ใช่นิสิตในคณะ',
  'ไม่ใช่บุคลากรในคณะ',
  'ขาดสำเนาเอกสารการลงทะเบียน',
  'รูปถ่ายไม่ถูกต้องตามระเบียบ (ต้องขนาด 1.5-2 นิ้ว หน้าตรงชุดสุภาพ)',
  'หนังสือเดินทาง/วีซ่าไม่ตรงกับข้อมูลในระบบ',
  'สำเนาเอกสารแนบไม่ชัดเจนหรือไม่สมบูรณ์',
];

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Core Data
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [studentsCount, setStudentsCount] = useState({ total: 0, thai: 0, intl: 0 });
  const [coursesCount, setCoursesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Certificates Approval states
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [docNoInput, setDocNoInput] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [previewRequest, setPreviewRequest] = useState<CertificateRequest | null>(null);
  const [unmaskPassport, setUnmaskPassport] = useState<boolean>(false);

  // Rejection Dialog states
  const [rejectingRequest, setRejectingRequest] = useState<CertificateRequest | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('');
  const [rejectSubmitting, setRejectSubmitting] = useState<boolean>(false);

  // Preview Tab State
  const [previewTab, setPreviewTab] = useState<'DOCUMENT' | 'ATTACHMENTS'>('DOCUMENT');

  // Academic Year Archiving & New Academic Year Workflow
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  const [isNewYearWorkflowModalOpen, setIsNewYearWorkflowModalOpen] = useState<boolean>(false);
  const [archivingYear, setArchivingYear] = useState<string>('2569');
  const [academicArchives, setAcademicArchives] = useState<any[]>([]);
  const [archiveLoading, setArchiveLoading] = useState<boolean>(false);

  const formatPassport = (p?: string) => {
    if (!p) return '-';
    if (unmaskPassport) return p;
    if (p.length <= 4) return '••••';
    return `${p.slice(0, 2)}••••${p.slice(-2)}`;
  };

  // Users & Roles State
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  // Auto-Provision Instructors from Timetables States
  const [isScanningInstructors, setIsScanningInstructors] = useState<boolean>(false);
  const [provisionModal, setProvisionModal] = useState<{
    isOpen: boolean;
    totalTimetableInstructors: number;
    existingCount: number;
    newCount: number;
    alreadyExisting: any[];
    candidates: any[];
  }>({
    isOpen: false,
    totalTimetableInstructors: 0,
    existingCount: 0,
    newCount: 0,
    alreadyExisting: [],
    candidates: [],
  });
  const [isSubmittingProvision, setIsSubmittingProvision] = useState<boolean>(false);
  const [showExistingList, setShowExistingList] = useState<boolean>(false);

  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    nameEn: '',
    email: '',
    gmail: '',
    aliasesText: '',
    instructorType: 'อาจารย์ประจำ',
    department: 'คณะพุทธศาสตร์ มจร',
    role: 'INSTRUCTOR' as 'SUPER_ADMIN' | 'ADMIN' | 'OFFICER' | 'INSTRUCTOR',
  });
  const [editUserSaving, setEditUserSaving] = useState(false);
    // Teaching assignment slip & LINE copy state
  const [teachingSlipUser, setTeachingSlipUser] = useState<any | null>(null);
  const [teachingSlipQr, setTeachingSlipQr] = useState<string | null>(null);
  const [copiedLineUserId, setCopiedLineUserId] = useState<string | null>(null);
  const [isBatchTeachingSlipOpen, setIsBatchTeachingSlipOpen] = useState(false);

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    nameEn: '',
    email: '',
    gmail: '',
    instructorType: 'อาจารย์ประจำ',
    department: 'คณะพุทธศาสตร์ มจร',
    role: 'INSTRUCTOR' as 'SUPER_ADMIN' | 'ADMIN' | 'OFFICER' | 'INSTRUCTOR',
    password: 'mcu123456',
  });

  // System Settings & Branding State
  const [settings, setSettings] = useState<SystemSettings>({
    universityNameTh: 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
    universityNameEn: 'Mahachulalongkornrajavidyalaya University',
    facultyNameTh: 'คณะพุทธศาสตร์',
    facultyNameEn: 'Faculty of Buddhism',
    logoUrl: 'https://www.mcu.ac.th/images/logo-mcu.png',
    logoEmoji: '☸️',
    signerNameTh: 'พระครูสุธีกิตติบัณฑิต, รศ.ดร.',
    signerTitleTh: 'คณบดีคณะพุทธศาสตร์',
    signerNameEn: 'Assoc. Prof. Dr. Phrakhrusutheekittibandhit',
    signerTitleEn: 'Dean of the Faculty of Buddhism',
    contactPhone: '035-248-000 ต่อ 8323',
    contactEmail: 'buddhism@mcu.ac.th',
    addressTh: 'เลขที่ 79 หมู่ 1 ถนนพหลโยธิน ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา 13170',
    addressEn: '79 Moo 1, Phahonyothin Road, Lamsai, Wangnoi, Phra Nakhon Si Ayutthaya 13170, Thailand',
    announcementText: 'ยินดีต้อนรับสู่งานบริการการศึกษาและทะเบียน คณะพุทธศาสตร์ มจร. วังน้อย',
    signatories: SIGNER_PRESETS,
    visaAlertTitle: 'สำหรับการต่อวีซ่า ให้ดำเนินการก่อนหนังสือเดินทางหมดอายุ 30 วัน',
    visaAlertDesc: '* เพื่อให้มีระยะเวลาเพียงพอต่อการพิจารณาของ ตม. และป้องกันการเสียค่าปรับ',
    visaAlertEnabled: true,
    timelineAlertTitle: 'การดำเนินการ จะเสร็จสิ้น ประมาณ 1-2 วัน ไม่นับวันหยุด หรือ กรุณาตรวจดูเส้นทางการดำเนินการหนังสือว่า "อนุมัติ"',
    timelineAlertDesc: '* สามารถตรวจสอบความคืบหน้าได้ตลอดเวลาที่แท็บ "เช็คสถานะคำร้อง"',
    timelineAlertEnabled: true,
    accuracyAlertTitle: 'กรุณากรอกข้อมูลให้ครบถ้วน มิฉะนั้นเอกสารจะไม่สมบูรณ์และจะยกเลิกการขอหนังสือ',
    accuracyAlertDesc: '* ตรวจสอบตัวสะกดชื่อ-นามสกุลภาษาอังกฤษและเลขพาสปอร์ตให้ตรงกับเล่มจริง',
    accuracyAlertEnabled: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Signatories Management State (Option 3: GUI Management)
  const [editingSignatoryId, setEditingSignatoryId] = useState<string | null>(null);
  const [editSignatoryForm, setEditSignatoryForm] = useState<SignatoryItem>({
    id: '',
    label: '',
    name: '',
    title: '',
  });
  const [isAddingSignatory, setIsAddingSignatory] = useState(false);
  const [newSignatoryForm, setNewSignatoryForm] = useState<SignatoryItem>({
    id: '',
    label: '',
    name: '',
    title: '',
  });

  const activeSignatoriesList = useMemo(() => {
    return settings.signatories && settings.signatories.length > 0
      ? settings.signatories
      : SIGNER_PRESETS;
  }, [settings.signatories]);

  const handleAddSignatory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSignatoryForm.label.trim()) {
      alert('กรุณาระบุข้อความที่แสดงในเมนู Dropdown');
      return;
    }
    const id = `SIGNER_${Date.now()}`;
    const newSignatory: SignatoryItem = {
      ...newSignatoryForm,
      id,
    };
    const currentList = settings.signatories || SIGNER_PRESETS;
    const updatedList = [...currentList, newSignatory];
    const newSettings = { ...settings, signatories: updatedList };
    setSettings(newSettings);
    setIsAddingSignatory(false);
    setNewSignatoryForm({ id: '', label: '', name: '', title: '' });

    try {
      await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      setActionSuccess('เพิ่มผู้ลงนามใหม่ในเมนู Dropdown เรียบร้อยแล้ว!');
    } catch {}
  };

  const handleSaveEditSignatory = async () => {
    if (!editingSignatoryId) return;
    const currentList = settings.signatories || SIGNER_PRESETS;
    const updatedList = currentList.map((item) =>
      item.id === editingSignatoryId ? { ...editSignatoryForm, id: editingSignatoryId } : item
    );
    const newSettings = { ...settings, signatories: updatedList };
    setSettings(newSettings);
    setEditingSignatoryId(null);

    try {
      await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      setActionSuccess('แก้ไขข้อมูลผู้ลงนามเรียบร้อยแล้ว!');
    } catch {}
  };

  const handleDeleteSignatory = async (id: string, label: string) => {
    if (!confirm(`ยืนยันการลบผู้ลงนาม "${label}" ออกจากเมนู Dropdown?`)) return;
    const currentList = settings.signatories || SIGNER_PRESETS;
    const updatedList = currentList.filter((item) => item.id !== id);
    const newSettings = { ...settings, signatories: updatedList };
    setSettings(newSettings);

    try {
      await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      setActionSuccess('ลบผู้ลงนามออกจากเมนูเรียบร้อยแล้ว');
    } catch {}
  };

  const handleResetSignatories = async () => {
    if (!confirm('ยืนยันการคืนค่ารายชื่อผู้ลงนามทั้งหมดเป็นชุดมาตรฐานเริ่มต้น?')) return;
    const newSettings = { ...settings, signatories: SIGNER_PRESETS };
    setSettings(newSettings);

    try {
      await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      setActionSuccess('คืนค่ารายชื่อผู้ลงนามเริ่มต้นเรียบร้อยแล้ว!');
    } catch {}
  };

  const handleLogoFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      let finalUrl = '';

      // Step 1: Upload via multipart/form-data
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.url) {
          finalUrl = data.url;
        }
      } catch (uploadErr) {
        console.warn('Multipart upload failed, attempting Base64 fallback', uploadErr);
      }

      // Step 2: Fallback to Base64 data URL if direct upload fails
      if (!finalUrl) {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || '');
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        if (base64Data) {
          try {
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dataUrl: base64Data }),
            });
            const data = await res.json();
            if (data.success && data.url) {
              finalUrl = data.url;
            } else {
              finalUrl = base64Data;
            }
          } catch {
            finalUrl = base64Data;
          }
        }
      }

      if (finalUrl) {
        const updatedSettings = { ...settings, logoUrl: finalUrl };
        setSettings(updatedSettings);

        // Step 3: Immediate Auto-Save to /api/system-settings so user never loses it
        const saveRes = await fetch('/api/system-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSettings),
        });
        const saveData = await saveRes.json();

        if (saveData.success) {
          if (saveData.data?.logoUrl) {
            setSettings((prev) => ({ ...prev, logoUrl: saveData.data.logoUrl }));
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('mcu_settings_updated'));
          }
          setActionSuccess('✅ อัปโหลดและบันทึกรูปภาพโลโก้ลงในระบบสำเร็จเรียบร้อยแล้ว!');
        } else {
          setActionSuccess('อัปโหลดรูปภาพสำเร็จแล้ว โปรดคลิกปุ่มบันทึกการตั้งค่าเพื่อยืนยัน');
        }
      }
    } catch (err: any) {
      console.error('Logo upload error:', err);
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + (err.message || 'ไม่สามารถอัปโหลดได้'));
    } finally {
      setUploadingLogo(false);
    }
  };

  // Sheets status
  const [sheetStatus, setSheetStatus] = useState<any>(null);
  const [syncingSheet, setSyncingSheet] = useState(false);

  // Current admin session
  const [currentUser, setCurrentUser] = useState<any>({
    name: 'พระมหาไพศาล ดิษฐพันธ์ (ผู้ดูแลระบบสูงสุด)',
    role: 'SUPER_ADMIN',
    email: 'phaisal.dis@mcu.ac.th',
  });

  // Role Access Checks
  const isSuperAdmin = useMemo(() => {
    return (
      currentUser?.role === 'SUPER_ADMIN' ||
      currentUser?.isSuperAdmin === true ||
      currentUser?.email === 'phaisal.dis@mcu.ac.th'
    );
  }, [currentUser]);

  const isOfficer = useMemo(() => {
    return currentUser?.role === 'OFFICER' && !isSuperAdmin;
  }, [currentUser, isSuperAdmin]);

  // Data collections for full views
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [timetablesList, setTimetablesList] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [eventRegistrationsList, setEventRegistrationsList] = useState<any[]>([]);

  // Courses filter states
  const [courseSearch, setCourseSearch] = useState('');
  const [courseProgramFilter, setCourseProgramFilter] = useState<'ALL' | 'THAI' | 'ENGLISH'>('ALL');
  const [courseDegreeFilter, setCourseDegreeFilter] = useState<string>('ALL');

  // Students filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [studentProgramFilter, setStudentProgramFilter] = useState<'ALL' | 'THAI' | 'ENGLISH'>('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('ALL');
  const [studentYearFilter, setStudentYearFilter] = useState<string>('ALL');

  // Student Deletion states in Admin
  const [adminSelectedStudentCodes, setAdminSelectedStudentCodes] = useState<Set<string>>(new Set());
  const [studentDeleteModal, setStudentDeleteModal] = useState<{
    isOpen: boolean;
    targets: { studentCode: string; fullName: string; major?: string; yearLevel?: number }[];
    isBulk: boolean;
  }>({ isOpen: false, targets: [], isBulk: false });
  const [isDeletingStudents, setIsDeletingStudents] = useState(false);

  // Bulk Student Promotion states
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [promotionTargetYear, setPromotionTargetYear] = useState<string>('ALL');
  const [promotionProgramFilter, setPromotionProgramFilter] = useState<'ALL' | 'THAI' | 'ENGLISH'>('ALL');
  const [promotionActionFilter, setPromotionActionFilter] = useState<string>('ALL');
  const [promotionSearch, setPromotionSearch] = useState<string>('');
  const [promotionDraft, setPromotionDraft] = useState<
    Record<
      string,
      {
        studentCode: string;
        fullName: string;
        currentYear: number;
        currentStatus: string;
        programType?: string;
        degree?: string;
        major?: string;
        selected: boolean;
        actionType: 'PROMOTE' | 'GRADUATE' | 'REPEAT' | 'DROP' | 'RETIRE' | 'CUSTOM';
        newYear: number;
        newStatus: string;
        note: string;
      }
    >
  >({});
  const [showPromotionConfirm, setShowPromotionConfirm] = useState(false);
  const [promotionSubmitting, setPromotionSubmitting] = useState(false);

  // Timetables filter states
  const [timetableSearch, setTimetableSearch] = useState('');
  const [timetableYearFilter, setTimetableYearFilter] = useState<string>('ALL');
  const [timetableSemesterFilter, setTimetableSemesterFilter] = useState<string>('ALL');
  const [timetableDayFilter, setTimetableDayFilter] = useState<string>('ALL');

  // Attendance filter states
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<string>('ALL');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/certificates').then((res) => res.json()),
      fetch('/api/students').then((res) => res.json()),
      fetch('/api/courses').then((res) => res.json()),
      fetch('/api/timetables').then((res) => res.json()),
      fetch('/api/attendance').then((res) => res.json()),
      fetch('/api/users').then((res) => res.json()),
      fetch('/api/system-settings').then((res) => res.json()),
      fetch('/api/sheets-sync').then((res) => res.json()),
      fetch('/api/events').then((res) => res.json()),
    ])
      .then(([reqRes, stdRes, crsRes, ttbRes, attRes, usrRes, setRes, shtRes, evtRes]) => {
        if (reqRes.success) setRequests(reqRes.data);
        if (stdRes.success) {
          setStudentsList(stdRes.data);
          const total = stdRes.data.length;
          const thai = stdRes.data.filter((s: any) => s.nationality === 'ไทย' || s.nationality === 'Thai').length;
          setStudentsCount({ total, thai, intl: total - thai });
        }
        if (crsRes.success) {
          setCoursesList(crsRes.data);
          setCoursesCount(crsRes.data.length);
        }
        if (ttbRes.success) setTimetablesList(ttbRes.data);
        if (attRes.success) setAttendanceList(attRes.data);
        if (usrRes.success) {
          setUsers(usrRes.data);
          // Sync currentUser name with the real ชื่อ-นามสกุล in the system database
          setCurrentUser((prev: any) => {
            if (!prev) return prev;
            const prevEmail = (prev.email || '').toLowerCase();
            const prevGmail = (prev.gmail || '').toLowerCase();
            const matched = (usrRes.data as any[]).find(
              (u) =>
                (prev.id && u.id === prev.id) ||
                (prevEmail && (u.email?.toLowerCase() === prevEmail || u.gmail?.toLowerCase() === prevEmail)) ||
                (prevGmail && (u.email?.toLowerCase() === prevGmail || u.gmail?.toLowerCase() === prevGmail))
            );
            // If Super Admin phaisal.dis@mcu.ac.th, also check user-1793862082551 (พระมหาไพศาล ดิษฐพันธ์) for full name
            const fullNameAccount =
              prevEmail === 'phaisal.dis@mcu.ac.th'
                ? (usrRes.data as any[]).find((u) => u.email === 'phaisa.vilo@gmail.com') || matched
                : matched;

            if (fullNameAccount && fullNameAccount.name) {
              const roleLabel =
                prev.role === 'SUPER_ADMIN' || prev.isSuperAdmin || prevEmail === 'phaisal.dis@mcu.ac.th'
                  ? 'ผู้ดูแลระบบสูงสุด'
                  : prev.role === 'OFFICER'
                  ? 'เจ้าหน้าที่'
                  : prev.role === 'ADMIN'
                  ? 'ผู้ดูแลระบบ'
                  : 'อาจารย์ผู้สอน';
              const cleanBaseName = String(fullNameAccount.name).replace(/\s*\(.*?\)\s*$/, '').trim();
              const formattedName = `${cleanBaseName} (${roleLabel})`;
              const updatedUser = {
                ...prev,
                name: formattedName,
              };
              saveAuthSession(updatedUser, true);
              return updatedUser;
            }
            if (prev.name && prev.name.includes('อาจารย์ไพศาล')) {
              const updatedUser = {
                ...prev,
                name: 'พระมหาไพศาล ดิษฐพันธ์ (ผู้ดูแลระบบสูงสุด)',
              };
              saveAuthSession(updatedUser, true);
              return updatedUser;
            }
            return prev;
          });
        }
        if (setRes.success && setRes.data) setSettings(setRes.data);
        if (shtRes) setSheetStatus(shtRes);
        if (evtRes && evtRes.success) {
          setEventsList(evtRes.events || []);
          setEventRegistrationsList(evtRes.registrations || []);
        }
      })
      .finally(() => setLoading(false));
  };

  const handleToggleEventStatus = async (regId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ATTENDED' ? 'REGISTERED' : 'ATTENDED';
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkin', registrationId: regId, status: nextStatus }),
    });
    if (res.ok) {
      setEventRegistrationsList((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status: nextStatus } : r))
      );
    }
  };

  useEffect(() => {
    loadData();
    try {
      const user = getAuthUser();
      if (user) {
        setCurrentUser(user);
      } else {
        fetch('/api/auth')
          .then((r) => r.json())
          .then((d) => {
            if (d.authenticated && d.user) {
              setCurrentUser(d.user);
              saveAuthSession(d.user, true);
            } else {
              // Persist default Super Admin session when working from Admin Console
              saveAuthSession(
                {
                  name: 'พระมหาไพศาล ดิษฐพันธ์ (ผู้ดูแลระบบสูงสุด)',
                  role: 'SUPER_ADMIN',
                  email: 'phaisal.dis@mcu.ac.th',
                  isSuperAdmin: true,
                },
                true
              );
            }
          })
          .catch(() => {});
      }

      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab') as AdminTab | null;
        if (tabParam && ['DASHBOARD', 'CERTIFICATES', 'STUDENTS', 'COURSES', 'TIMETABLES', 'ATTENDANCE', 'EVENTS', 'USERS', 'BRANDING', 'SHEETS'].includes(tabParam)) {
          setActiveTab(tabParam);
        }
        if (urlParams.get('promote') === 'true') {
          setTimeout(() => {
            openPromotionModal();
          }, 600);
        }
      }
    } catch (e) {}
  }, []);

  // Redirect Officer away from restricted tabs (BRANDING, SHEETS) to DASHBOARD
  useEffect(() => {
    if (isOfficer && (activeTab === 'BRANDING' || activeTab === 'SHEETS')) {
      setActiveTab('DASHBOARD');
    }
  }, [isOfficer, activeTab]);

  // Distinct Buddhist Years from requests
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      if (r.createdAt) {
        const yr = new Date(r.createdAt).getFullYear() + 543;
        set.add(String(yr));
      }
    });
    if (set.size === 0) set.add('2569');
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [requests]);

  // Certificate Approvals
  const handleApprove = async (id: string, defaultDocNo?: string, prefix?: '8002' | '8002.1') => {
    const targetReq = requests.find((r) => r.id === id);
    const targetYear = targetReq?.createdAt
      ? new Date(targetReq.createdAt).getFullYear() + 543
      : new Date().getFullYear() + 543;

    const approvedThisYear = requests.filter((r) => {
      if (r.status !== 'APPROVED') return false;
      const y = r.createdAt ? new Date(r.createdAt).getFullYear() + 543 : null;
      return y === targetYear;
    }).length;

    const nextSeq = String(approvedThisYear + 1).padStart(3, '0');
    const autoDocNo = `${nextSeq}/${targetYear}`;
    const finalDocNo = docNoInput.trim() || defaultDocNo || autoDocNo;
    const finalPrefix = prefix || (targetReq as any)?.docNoPrefix || '8002';

    try {
      const res = await fetch('/api/certificates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'APPROVED',
          docNo: finalDocNo,
          docNoPrefix: finalPrefix,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`อนุมัติคำร้องเรียบร้อย! ออกเลขที่หนังสือ: อว ${finalPrefix}/${finalDocNo}`);
        setApprovingId(null);
        setDocNoInput('');
        loadData();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('การอนุมัติล้มเหลว: ' + err.message);
    }
  };

  const handleOpenRejectModal = (request: CertificateRequest) => {
    setRejectingRequest(request);
    setRejectReasonInput('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    setRejectSubmitting(true);
    try {
      const finalReason = rejectReasonInput.trim() || 'ข้อมูลไม่ครบถ้วนหรือไม่เป็นไปตามระเบียบ';
      const res = await fetch('/api/certificates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rejectingRequest.id,
          status: 'REJECTED',
          rejectReason: finalReason,
          note: finalReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`ปฏิเสธคำร้องของ ${rejectingRequest.fullName} เรียบร้อยแล้ว (เหตุผล: ${finalReason})`);
        setRejectingRequest(null);
        setRejectReasonInput('');
        if (previewRequest?.id === rejectingRequest.id) {
          setPreviewRequest(null);
        }
        loadData();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('ข้อผิดพลาด: ' + err.message);
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleArchiveYear = async () => {
    if (!confirm(`ยืนยันการสรุปปิดยอดและจัดเก็บประวัติปีการศึกษา ${archivingYear} หรือไม่?`)) return;
    setArchiveLoading(true);
    try {
      const res = await fetch('/api/archives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: archivingYear }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`สรุปปิดยอดและจัดเก็บประวัติปีการศึกษา ${archivingYear} สำเร็จเรียบร้อย`);
        fetch('/api/archives')
          .then((r) => r.json())
          .then((d) => d.success && setAcademicArchives(d.data));
        setIsArchiveModalOpen(false);
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('การจัดเก็บประวัติล้มเหลว: ' + err.message);
    } finally {
      setArchiveLoading(false);
    }
  };

  // User & Roles actions
  const handleUpdateRole = async (userId: string, newRole: 'SUPER_ADMIN' | 'ADMIN' | 'OFFICER' | 'INSTRUCTOR') => {
    if (isOfficer) {
      alert('เจ้าหน้าที่ (OFFICER) ไม่มีสิทธิ์ในการปรับเปลี่ยนระดับสิทธิ์ของผู้ใช้งาน กรุณาติดต่อ Super Admin');
      return;
    }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-role', userId, newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`อัปเดตบทบาทผู้ใช้งานเป็น ${newRole} สำเร็จ`);
        loadData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Auto-Provision Handlers
  const handleScanTimetables = async () => {
    setIsScanningInstructors(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan-timetables' }),
      });
      const data = await res.json();
      if (data.success) {
        setProvisionModal({
          isOpen: true,
          totalTimetableInstructors: data.totalTimetableInstructors || 0,
          existingCount: data.existingCount || 0,
          newCount: data.newCount || 0,
          alreadyExisting: data.alreadyExisting || [],
          candidates: (data.candidates || []).map((c: any) => ({ ...c, selected: true })),
        });
        setShowExistingList(false);
      } else {
        alert('เกิดข้อผิดพลาดในการสแกน: ' + (data.error || 'ไม่สามารถสแกนได้'));
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    } finally {
      setIsScanningInstructors(false);
    }
  };

  const handleToggleCandidateSelect = (idx: number) => {
    setProvisionModal((prev) => {
      const nextCand = [...prev.candidates];
      nextCand[idx] = { ...nextCand[idx], selected: !nextCand[idx].selected };
      return { ...prev, candidates: nextCand };
    });
  };

  const handleUpdateCandidateField = (idx: number, field: string, val: any) => {
    setProvisionModal((prev) => {
      const nextCand = [...prev.candidates];
      nextCand[idx] = { ...nextCand[idx], [field]: val };
      return { ...prev, candidates: nextCand };
    });
  };

  const handleConfirmBatchProvision = async () => {
    const selected = provisionModal.candidates.filter((c) => c.selected);
    if (selected.length === 0) {
      alert('กรุณาเลือกอาจารย์ใหม่อย่างน้อย 1 ท่านเพื่อสร้างบัญชี');
      return;
    }

    setIsSubmittingProvision(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch-provision-instructors',
          candidates: selected,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `สร้างบัญชีอาจารย์ใหม่สำเร็จ ${data.createdCount} ท่าน`);
        setProvisionModal((prev) => ({ ...prev, isOpen: false }));
        loadData();
      } else {
        alert('เกิดข้อผิดพลาด: ' + (data.error || 'ไม่สามารถสร้างบัญชีได้'));
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    } finally {
      setIsSubmittingProvision(false);
    }
  };

  const handleStartEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setEditUserForm({
      name: user.name || '',
      nameEn: user.nameEn || '',
      email: user.email || '',
      gmail: user.gmail || '',
      aliasesText: Array.isArray(user.aliases) ? user.aliases.join(', ') : '',
      instructorType: user.instructorType || 'อาจารย์ประจำ',
      department: user.department || 'คณะพุทธศาสตร์ มจร',
      role: user.role || 'INSTRUCTOR',
    });
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const primaryEmail = (editUserForm.email || editUserForm.gmail || '').trim();
    if (!primaryEmail) {
      alert('กรุณากรอกอีเมลสำหรับเข้าสู่ระบบ (Gmail หรือ @mcu.ac.th)');
      return;
    }
    setEditUserSaving(true);
    try {
      const aliases = editUserForm.aliasesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const roleToSave = isOfficer ? 'INSTRUCTOR' : editUserForm.role;

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-profile',
          userId: editingUser.id,
          updates: {
            ...editUserForm,
            role: roleToSave,
            email: editUserForm.email?.trim() || primaryEmail,
            gmail: editUserForm.gmail?.trim() || (primaryEmail.endsWith('@gmail.com') ? primaryEmail : ''),
            aliases,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`แก้ไขข้อมูลโปรไฟล์และอีเมลของ ${editUserForm.name} สำเร็จ`);
        setEditingUser(null);
        loadData();
      } else {
        alert(data.error || 'ไม่สามารถแก้ไขข้อมูลได้');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setEditUserSaving(false);
    }
  };

  const handleToggleSuspend = async (userId: string, isSuspended: boolean, userName: string) => {
    const promptMsg = isSuspended
      ? `ยืนยันการปลดระงับการใช้งานบัญชี "${userName}" หรือไม่?`
      : `ยืนยันการระงับการใช้งานบัญชี "${userName}" หรือไม่?\n(ผู้ใช้รายนี้จะไม่สามารถเข้าสู่ระบบได้จนกว่าจะได้รับการปลดระงับ)`;
    if (!confirm(promptMsg)) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-suspend',
          userId,
          isSuspended: !isSuspended,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        loadData();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการดำเนินการ');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Distinct Academic Years for teaching and courses (sorted latest first)
  const availableAcademicYears = useMemo(() => {
    const set = new Set<string>();
    timetablesList.forEach((t) => {
      if (t.academicYear) set.add(String(t.academicYear).trim());
    });
    coursesList.forEach((c) => {
      if (c.academicYear) set.add(String(c.academicYear).trim());
    });
    if (set.size === 0) set.add('2569');
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [timetablesList, coursesList]);

  const getCoursesForInstructor = (user: any, filterYear: string = 'ALL', filterSemester: string = 'ALL') => {
    if (!user) return [];

    // 1. Match from Timetables (ตารางสอน)
    const matchedTimetables = timetablesList.filter((t) => {
      if (filterYear !== 'ALL' && t.academicYear && String(t.academicYear) !== String(filterYear)) return false;
      if (filterSemester !== 'ALL' && t.semester && String(t.semester) !== String(filterSemester)) return false;
      return matchInstructorStrict(user, t.instructor);
    });

    // 2. Match from Courses (ตารางรายวิชา)
    const matchedCourses = coursesList.filter((c) => {
      if (filterYear !== 'ALL' && c.academicYear && String(c.academicYear) !== String(filterYear)) return false;
      if (filterSemester !== 'ALL' && c.semester && String(c.semester) !== String(filterSemester)) return false;
      return matchInstructorStrict(user, c.instructor);
    });

    const unique: any[] = [];
    const seen = new Set<string>();

    matchedTimetables.forEach((c) => {
      const key = `${c.courseCode}-${c.academicYear || ''}-${c.semester || ''}-${c.dayOfWeek || ''}-${c.startTime || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
      }
    });

    matchedCourses.forEach((c) => {
      const key = `${c.courseCode}-${c.academicYear || ''}-${c.semester || ''}-${c.dayOfWeek || ''}-${c.startTime || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push({
          academicYear: c.academicYear || '2569',
          semester: c.semester || 1,
          yearLevel: c.yearLevel || 1,
          timetableTitle: c.programType === 'ENGLISH' ? 'หลักสูตรนานาชาติ' : 'ภาคภาษาไทย',
          courseCode: c.courseCode,
          courseName: c.courseName,
          dayOfWeek: c.dayOfWeek || 1,
          startTime: c.startTime || '',
          endTime: c.endTime || '',
          room: c.room || '',
          instructor: c.instructor || user.name,
          periodLabel: '',
        });
      }
    });

    return unique;
  };

  const handleOpenTeachingSlip = async (user: any) => {
    setTeachingSlipUser(user);
    try {
      const qrDataUrl = await QRCode.toDataURL('http://localhost:3020/attendance', {
        width: 160,
        margin: 1,
      });
      setTeachingSlipQr(qrDataUrl);
    } catch {
      setTeachingSlipQr(null);
    }
  };

  const generateInstructorLineMessage = (user: any, selectedYear?: string, selectedSemester?: string) => {
    const yearToUse = selectedYear && selectedYear !== 'ALL' ? selectedYear : (availableAcademicYears[0] || '2569');
    const semToUse = selectedSemester && selectedSemester !== 'ALL' ? `ภาคการศึกษาที่ ${selectedSemester} ` : '';
    const courses = getCoursesForInstructor(user, selectedYear, selectedSemester);
    const coursesText = courses.length > 0
      ? courses
          .map(
            (c, i) =>
              `${i + 1}. [${c.courseCode}] ${c.courseName} (ชั้นปีที่ ${c.yearLevel || 1}, ห้อง ${c.room || '-'}, เวลา ${c.startTime || '-'}-${c.endTime || '-'} น.)`
          )
          .join('\n')
      : '• (ไม่พบรายวิชาที่ระบุในตารางสอน หรืออยู่ระหว่างจัดตารางสอน)';

    return `เรียน ${user.name}
คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย

ฝ่ายทะเบียนและวิชาการ ขอแจ้งข้อมูลภาระงานสอนและบัญชีเข้าสู่ระบบตรวจเช็คชื่อนิสิตเข้าชั้นเรียน ${semToUse}ประจำปีการศึกษา ${yearToUse} ดังนี้ครับ:

📚 รายวิชาที่ท่านรับผิดชอบบรรยาย:
${coursesText}

🔑 ข้อมูลเข้าสู่ระบบตรวจเช็คชื่อนิสิต (Attendance System):
• ลิงก์เข้าใช้งาน: http://localhost:3020/attendance
• อีเมลเข้าสู่ระบบ (Username): ${user.email}
• รหัสผ่านเริ่มต้น (Default Password): ${user.defaultPassword || 'mcu123456'}
(หรือสามารถกดปุ่ม "เข้าสู่ระบบด้วย Google / บัญชี มจร." ได้โดยตรงทันที)

* หมายเหตุ: ระบบจำกัดสิทธิ์ให้อาจารย์ตรวจเช็คชื่อได้เฉพาะรายวิชาที่ท่านรับผิดชอบบรรยายเท่านั้น หากพบว่ารายวิชาคลาดเคลื่อน โปรดติดต่อสำนักงานคณะพุทธศาสตร์ครับ`;
  };

  const handleCopyLineTeachingMessage = (user: any, selectedYear?: string, selectedSemester?: string) => {
    const text = generateInstructorLineMessage(user, selectedYear, selectedSemester);
    navigator.clipboard.writeText(text);
    setCopiedLineUserId(user.id);
    setTimeout(() => setCopiedLineUserId(null), 3000);
    alert(`✅ คัดลอกข้อความภาระงานสอนและรหัสผ่านของ "${user.name}" เรียบร้อยแล้ว!\nสามารถนำไปวาง (Paste) ส่งให้อาจารย์ใน LINE ส่วนตัวหรือ LINE กลุ่มได้ทันทีครับ`);
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (!confirm(`ยืนยันการรีเซ็ตรหัสผ่านของ "${userName}" เป็น "mcu123456" ใช่หรือไม่?`)) return;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', userId }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`รีเซ็ตรหัสผ่านของ ${userName} เรียบร้อย (รหัสผ่านใหม่: mcu123456)`);
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryEmail = (newUserForm.email || newUserForm.gmail || '').trim();
    if (!newUserForm.name?.trim() || !primaryEmail) {
      alert('กรุณากรอกชื่อ และระบุอีเมลอย่างน้อย 1 ช่องทาง (Gmail หรือ @mcu.ac.th)');
      return;
    }
    try {
      const emailToSave = newUserForm.email?.trim() || primaryEmail;
      const gmailToSave = newUserForm.gmail?.trim() || (primaryEmail.endsWith('@gmail.com') ? primaryEmail : '');
      const roleToSave = isOfficer ? 'INSTRUCTOR' : (newUserForm.role || 'INSTRUCTOR');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-user',
          userData: {
            ...newUserForm,
            role: roleToSave,
            email: emailToSave,
            gmail: gmailToSave,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`สร้างบัญชีผู้ใช้ [${newUserForm.name}] สำเร็จเรียบร้อย`);
        setIsAddUserOpen(false);
        setNewUserForm({
          name: '',
          nameEn: '',
          email: '',
          gmail: '',
          instructorType: 'อาจารย์ประจำ',
          department: 'คณะพุทธศาสตร์ มจร',
          role: 'INSTRUCTOR',
          password: 'mcu123456',
        });
        loadData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Save System Settings & Branding
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('mcu_settings_updated'));
        }
        setActionSuccess('บันทึกการตั้งค่าระบบ โลโก้ และข้อมูลผู้ลงนามเรียบร้อยแล้ว!');
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleForcePasswordChange = async (enabled: boolean) => {
    try {
      setSettings((prev) => ({ ...prev, forcePasswordChangeOnFirstLogin: enabled }));
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, forcePasswordChangeOnFirstLogin: enabled }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(
          enabled
            ? 'เปิดระบบบังคับเปลี่ยนรหัสผ่านเมื่อเข้าใช้งานครั้งแรกแล้ว (อาจารย์และนิสิตต้องตั้งรหัสผ่านใหม่ก่อนใช้งาน)'
            : 'ปิดระบบบังคับเปลี่ยนรหัสผ่านเมื่อเข้าใช้งานครั้งแรกแล้ว'
        );
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า: ' + e.message);
    }
  };

  // Google Sheets Initial Sync
  const handleInitialSync = async () => {
    if (!confirm('ยืนยันการส่งออกข้อมูลตั้งต้นทั้งหมดไปยัง Google Sheets?')) return;
    setSyncingSheet(true);
    try {
      const res = await fetch('/api/sheets-sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`ซิงค์ข้อมูล Google Sheets สำเร็จ! (${data.syncedTabs.join(', ')})`);
        loadData();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSyncingSheet(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (e) {}
    clearAuthSession();
    window.location.href = '/login';
  };

  // Filter requests
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const approvedRequests = requests.filter((r) => r.status === 'APPROVED');
  const rejectedRequests = requests.filter((r) => r.status === 'REJECTED');

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (filterYear !== 'ALL' && r.createdAt) {
      const yr = String(new Date(r.createdAt).getFullYear() + 543);
      if (yr !== filterYear) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.studentCode?.toLowerCase().includes(q) ||
        r.fullName?.toLowerCase().includes(q) ||
        r.certType?.toLowerCase().includes(q) ||
        r.docNo?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter Users
  const filteredUsers = useMemo(() => {
    // If Officer: strictly hide SUPER_ADMIN and ADMIN accounts! Officers only manage INSTRUCTOR (and view students if requested)
    let baseUsers = users;
    if (isOfficer) {
      baseUsers = users.filter(
        (u) =>
          u.role !== 'SUPER_ADMIN' &&
          u.role !== 'ADMIN' &&
          !u.isSuperAdmin &&
          u.email !== 'phaisal.dis@mcu.ac.th'
      );
    }

    if (userRoleFilter === 'STUDENT') {
      const q = userSearch.trim().toLowerCase();
      return studentsList
        .filter((s) => {
          if (!q) return true;
          return (
            (s.fullName || '').toLowerCase().includes(q) ||
            (s.studentCode || '').toLowerCase().includes(q) ||
            (s.email || '').toLowerCase().includes(q) ||
            (s.major || '').toLowerCase().includes(q) ||
            (s.degree || '').toLowerCase().includes(q)
          );
        })
        .map((s) => ({
          id: s.studentCode || s.id,
          name: s.fullName || `${s.title || ''}${s.firstName || ''} ${s.lastName || ''}`.trim(),
          email: s.email || `${s.studentCode}@mcu.ac.th`,
          gmail: s.gmail || '',
          department: `${s.major || s.faculty || 'คณะพุทธศาสตร์'}${s.degree ? ` (${s.degree})` : ''}`,
          role: 'STUDENT' as any,
          isSuspended: s.studyStatus === 'พ้นสภาพ' || s.isActive === false,
          isActive: s.isActive !== false,
          isSuperAdmin: false,
          studentData: s,
        }));
    }

    return baseUsers.filter((u) => {
      if (userRoleFilter === 'SUSPENDED') {
        if (!u.isSuspended && u.isActive !== false) return false;
      } else if (userRoleFilter === 'SUPER_ADMIN') {
        if (u.role !== 'SUPER_ADMIN' && !u.isSuperAdmin && u.email !== 'phaisal.dis@mcu.ac.th') return false;
      } else if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) {
        return false;
      }

      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        return (
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.gmail?.toLowerCase().includes(q) ||
          u.department?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, studentsList, userRoleFilter, userSearch, isOfficer]);

  // Filter Courses
  const filteredCourses = useMemo(() => {
    return coursesList.filter((c) => {
      if (courseProgramFilter !== 'ALL') {
        if (courseProgramFilter === 'ENGLISH' && c.programType !== 'ENGLISH') return false;
        if (courseProgramFilter === 'THAI' && c.programType === 'ENGLISH') return false;
      }
      if (courseDegreeFilter !== 'ALL' && c.degreeLevel !== courseDegreeFilter) return false;
      if (courseSearch.trim()) {
        const q = courseSearch.toLowerCase();
        return (
          c.courseCode?.toLowerCase().includes(q) ||
          c.courseName?.toLowerCase().includes(q) ||
          c.courseNameEn?.toLowerCase().includes(q) ||
          c.instructor?.toLowerCase().includes(q) ||
          c.primaryTeacherName?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [coursesList, courseProgramFilter, courseDegreeFilter, courseSearch]);

  // Filter Students
  const filteredStudents = useMemo(() => {
    return studentsList.filter((s) => {
      const isEnglish = s.programType === 'ENGLISH' || (s.nationality !== 'ไทย' && s.nationality !== 'Thai' && Boolean(s.passportNo));
      if (studentProgramFilter === 'THAI' && isEnglish) return false;
      if (studentProgramFilter === 'ENGLISH' && !isEnglish) return false;
      if (studentStatusFilter !== 'ALL' && s.studyStatus !== studentStatusFilter) return false;
      if (studentYearFilter !== 'ALL' && String(s.yearLevel) !== studentYearFilter) return false;
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const fullName = (s.fullName || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
        return (
          s.studentCode?.toLowerCase().includes(q) ||
          fullName.includes(q) ||
          s.passportNo?.toLowerCase().includes(q) ||
          s.nationality?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [studentsList, studentProgramFilter, studentStatusFilter, studentYearFilter, studentSearch]);

  // Admin Student Selection & Deletion Helpers
  const isAllAdminStudentsSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false;
    const visibleStudents = filteredStudents.slice(0, 100);
    return visibleStudents.length > 0 && visibleStudents.every((s) => adminSelectedStudentCodes.has(s.studentCode));
  }, [filteredStudents, adminSelectedStudentCodes]);

  const toggleSelectAllAdminStudents = () => {
    const visibleStudents = filteredStudents.slice(0, 100);
    const allSelected = visibleStudents.every((s) => adminSelectedStudentCodes.has(s.studentCode));
    const next = new Set(adminSelectedStudentCodes);
    if (allSelected) {
      visibleStudents.forEach((s) => next.delete(s.studentCode));
    } else {
      visibleStudents.forEach((s) => next.add(s.studentCode));
    }
    setAdminSelectedStudentCodes(next);
  };

  const toggleSelectAdminStudent = (studentCode: string) => {
    const next = new Set(adminSelectedStudentCodes);
    if (next.has(studentCode)) {
      next.delete(studentCode);
    } else {
      next.add(studentCode);
    }
    setAdminSelectedStudentCodes(next);
  };

  const openDeleteSingleStudentModal = (student: any) => {
    setStudentDeleteModal({
      isOpen: true,
      targets: [
        {
          studentCode: student.studentCode,
          fullName: student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.studentCode,
          major: student.major,
          yearLevel: student.yearLevel,
        },
      ],
      isBulk: false,
    });
  };

  const openDeleteBulkStudentsModal = () => {
    if (adminSelectedStudentCodes.size === 0) return;
    const targets = studentsList
      .filter((s) => adminSelectedStudentCodes.has(s.studentCode))
      .map((s) => ({
        studentCode: s.studentCode,
        fullName: s.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentCode,
        major: s.major,
        yearLevel: s.yearLevel,
      }));
    setStudentDeleteModal({
      isOpen: true,
      targets,
      isBulk: true,
    });
  };

  const handleConfirmDeleteStudents = async (reason?: string) => {
    if (studentDeleteModal.targets.length === 0) return;
    setIsDeletingStudents(true);
    try {
      const codes = studentDeleteModal.targets.map((t) => t.studentCode);
      const res = await fetch('/api/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentCodes: codes,
          deletedBy: currentUser?.name || 'ผู้ดูแลระบบ (Admin)',
          reason: reason || 'จำหน่าย/ลบข้อมูลนิสิตออกจากทะเบียน',
        }),
      });
      const data = await res.json();
      if (data.success) {
        const deletedSet = new Set(codes.map((c) => c.toLowerCase()));
        setStudentsList((prev) => {
          const next = prev.filter((s) => !deletedSet.has(String(s.studentCode).toLowerCase()));
          const total = next.length;
          const thai = next.filter((s) => s.programType === 'THAI' || s.nationality === 'ไทย' || s.nationality === 'Thai').length;
          setStudentsCount({ total, thai, intl: total - thai });
          return next;
        });

        setAdminSelectedStudentCodes((prev) => {
          const next = new Set(prev);
          codes.forEach((c) => next.delete(c));
          return next;
        });

        alert(`ย้ายข้อมูลนิสิตเข้าสู่แฟ้มประวัติ (Students_Archive บน Google Sheets) เรียบร้อยแล้ว จำนวน ${data.deletedCount || codes.length} รูป/คน`);
        setStudentDeleteModal({ isOpen: false, targets: [], isBulk: false });
      } else {
        alert('เกิดข้อผิดพลาดในการลบ: ' + (data.error || 'ไม่สามารถลบได้'));
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    } finally {
      setIsDeletingStudents(false);
    }
  };


  // Open Bulk Promotion Modal with auto-calculated defaults
  const openPromotionModal = () => {
    const draft: Record<string, any> = {};
    studentsList.forEach((s) => {
      const currentYear = Number(s.yearLevel) || 1;
      const currentStatus = s.studyStatus || 'ปกติ';
      const isFinished = currentStatus === 'สำเร็จการศึกษา' || currentStatus === 'พ้นสภาพ';

      if (isFinished) {
        draft[s.studentCode] = {
          studentCode: s.studentCode,
          fullName: s.fullName || `${s.title || ''} ${s.firstName || ''} ${s.lastName || ''}`.trim(),
          currentYear,
          currentStatus,
          programType: s.programType,
          degree: s.degree,
          major: s.major,
          selected: false,
          actionType: currentStatus === 'สำเร็จการศึกษา' ? 'GRADUATE' : 'RETIRE',
          newYear: currentYear,
          newStatus: currentStatus,
          note: `สถานะเดิม: ${currentStatus}`,
        };
      } else if (currentYear >= 4) {
        draft[s.studentCode] = {
          studentCode: s.studentCode,
          fullName: s.fullName || `${s.title || ''} ${s.firstName || ''} ${s.lastName || ''}`.trim(),
          currentYear,
          currentStatus,
          programType: s.programType,
          degree: s.degree,
          major: s.major,
          selected: true,
          actionType: 'GRADUATE',
          newYear: 4,
          newStatus: 'สำเร็จการศึกษา',
          note: 'ปี 4 สำเร็จการศึกษาตามหลักสูตร',
        };
      } else {
        draft[s.studentCode] = {
          studentCode: s.studentCode,
          fullName: s.fullName || `${s.title || ''} ${s.firstName || ''} ${s.lastName || ''}`.trim(),
          currentYear,
          currentStatus,
          programType: s.programType,
          degree: s.degree,
          major: s.major,
          selected: true,
          actionType: 'PROMOTE',
          newYear: currentYear + 1,
          newStatus: 'ปกติ',
          note: `เลื่อนจากชั้นปี ${currentYear} สู่ชั้นปี ${currentYear + 1}`,
        };
      }
    });
    setPromotionDraft(draft);
    setPromotionTargetYear('ALL');
    setPromotionProgramFilter('ALL');
    setPromotionActionFilter('ALL');
    setPromotionSearch('');
    setIsPromotionModalOpen(true);
  };

  const handlePromotionItemActionChange = (
    studentCode: string,
    actionType: 'PROMOTE' | 'GRADUATE' | 'REPEAT' | 'DROP' | 'RETIRE' | 'CUSTOM'
  ) => {
    setPromotionDraft((prev) => {
      const current = prev[studentCode];
      if (!current) return prev;

      let newYear = current.newYear;
      let newStatus = current.newStatus;
      let note = current.note;

      if (actionType === 'PROMOTE') {
        if (current.currentYear >= 4) {
          newYear = 4;
          newStatus = 'สำเร็จการศึกษา';
          note = 'ปี 4 สำเร็จการศึกษาตามหลักสูตร';
        } else {
          newYear = current.currentYear + 1;
          newStatus = 'ปกติ';
          note = `เลื่อนจากชั้นปี ${current.currentYear} สู่ชั้นปี ${current.currentYear + 1}`;
        }
      } else if (actionType === 'REPEAT') {
        newYear = current.currentYear;
        newStatus = 'ซ้ำชั้น';
        note = `ซ้ำชั้นปีที่ ${current.currentYear} (ไม่เลื่อนชั้นปี)`;
      } else if (actionType === 'DROP') {
        newYear = current.currentYear;
        newStatus = 'รักษาสภาพ';
        note = `รักษาสภาพนิสิต / ดรอปเรียน ชั้นปีที่ ${current.currentYear}`;
      } else if (actionType === 'GRADUATE') {
        newYear = current.currentYear;
        newStatus = 'สำเร็จการศึกษา';
        note = 'สำเร็จการศึกษา';
      } else if (actionType === 'RETIRE') {
        newYear = current.currentYear;
        newStatus = 'พ้นสภาพ';
        note = 'พ้นสภาพนิสิต';
      }

      return {
        ...prev,
        [studentCode]: {
          ...current,
          actionType,
          newYear,
          newStatus,
          note,
        },
      };
    });
  };

  const handlePromotionCustomFieldChange = (
    studentCode: string,
    field: 'newYear' | 'newStatus' | 'note',
    value: any
  ) => {
    setPromotionDraft((prev) => {
      const current = prev[studentCode];
      if (!current) return prev;
      return {
        ...prev,
        [studentCode]: {
          ...current,
          [field]: value,
          actionType: 'CUSTOM',
        },
      };
    });
  };

  const togglePromotionSelect = (studentCode: string) => {
    setPromotionDraft((prev) => {
      const current = prev[studentCode];
      if (!current) return prev;
      return {
        ...prev,
        [studentCode]: {
          ...current,
          selected: !current.selected,
        },
      };
    });
  };

  const setFilteredPromotionSelection = (selected: boolean, items: any[]) => {
    setPromotionDraft((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        if (next[item.studentCode]) {
          next[item.studentCode] = {
            ...next[item.studentCode],
            selected,
          };
        }
      });
      return next;
    });
  };

  const setFilteredPromotionAction = (
    actionType: 'PROMOTE' | 'GRADUATE' | 'REPEAT' | 'DROP',
    items: any[]
  ) => {
    setPromotionDraft((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        const current = next[item.studentCode];
        if (!current) return;
        let newYear = current.newYear;
        let newStatus = current.newStatus;
        let note = current.note;

        if (actionType === 'PROMOTE') {
          if (current.currentYear >= 4) {
            newYear = 4;
            newStatus = 'สำเร็จการศึกษา';
            note = 'ปี 4 สำเร็จการศึกษาตามหลักสูตร';
          } else {
            newYear = current.currentYear + 1;
            newStatus = 'ปกติ';
            note = `เลื่อนจากชั้นปี ${current.currentYear} สู่ชั้นปี ${current.currentYear + 1}`;
          }
        } else if (actionType === 'REPEAT') {
          newYear = current.currentYear;
          newStatus = 'ซ้ำชั้น';
          note = `ซ้ำชั้นปีที่ ${current.currentYear}`;
        } else if (actionType === 'DROP') {
          newYear = current.currentYear;
          newStatus = 'รักษาสภาพ';
          note = `รักษาสภาพนิสิต ชั้นปีที่ ${current.currentYear}`;
        } else if (actionType === 'GRADUATE') {
          newYear = current.currentYear;
          newStatus = 'สำเร็จการศึกษา';
          note = 'สำเร็จการศึกษา';
        }

        next[item.studentCode] = {
          ...current,
          actionType,
          newYear,
          newStatus,
          note,
          selected: true,
        };
      });
      return next;
    });
  };

  const filteredPromotionItems = useMemo(() => {
    const items = Object.values(promotionDraft);
    return items.filter((item) => {
      if (promotionTargetYear !== 'ALL' && String(item.currentYear) !== promotionTargetYear) {
        return false;
      }
      if (promotionProgramFilter === 'THAI' && item.programType === 'ENGLISH') {
        return false;
      }
      if (promotionProgramFilter === 'ENGLISH' && item.programType !== 'ENGLISH') {
        return false;
      }
      if (promotionActionFilter !== 'ALL') {
        if (promotionActionFilter === 'SELECTED_ONLY' && !item.selected) return false;
        if (promotionActionFilter === 'UNSELECTED_ONLY' && item.selected) return false;
        if (['PROMOTE', 'GRADUATE', 'REPEAT', 'DROP', 'RETIRE'].includes(promotionActionFilter)) {
          if (item.actionType !== promotionActionFilter) return false;
        }
      }
      if (promotionSearch.trim()) {
        const q = promotionSearch.toLowerCase().trim();
        const matchCode = item.studentCode?.toLowerCase().includes(q);
        const matchName = item.fullName?.toLowerCase().includes(q);
        const matchMajor = item.major?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchMajor) return false;
      }
      return true;
    });
  }, [promotionDraft, promotionTargetYear, promotionProgramFilter, promotionActionFilter, promotionSearch]);

  const promotionStats = useMemo(() => {
    const all = Object.values(promotionDraft);
    const selected = all.filter((i) => i.selected);
    const promoteCount = selected.filter((i) => i.actionType === 'PROMOTE').length;
    const gradCount = selected.filter((i) => i.actionType === 'GRADUATE').length;
    const repeatCount = selected.filter((i) => i.actionType === 'REPEAT').length;
    const dropCount = selected.filter((i) => i.actionType === 'DROP').length;
    const retireCount = selected.filter((i) => i.actionType === 'RETIRE').length;
    const customCount = selected.filter((i) => i.actionType === 'CUSTOM').length;
    const unselectedCount = all.length - selected.length;
    return {
      total: all.length,
      selectedCount: selected.length,
      promoteCount,
      gradCount,
      repeatCount,
      dropCount,
      retireCount,
      customCount,
      unselectedCount,
    };
  }, [promotionDraft]);

  const handleExecuteBulkPromotion = async () => {
    const selectedList = Object.values(promotionDraft).filter((d) => d.selected);
    if (selectedList.length === 0) {
      alert('กรุณาเลือกนิสิตอย่างน้อย 1 คน สำหรับการเลื่อนชั้นปี');
      return;
    }

    setPromotionSubmitting(true);
    try {
      const updates = selectedList.map((item) => ({
        studentCode: item.studentCode,
        yearLevel: item.newYear,
        studyStatus: item.newStatus,
        remarks: item.note ? item.note : undefined,
      }));

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BULK_PROMOTE',
          items: updates,
          mode: 'UPDATE_ONLY',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'ไม่สามารถอัปเดตข้อมูลได้');
      }

      alert(`✅ ดำเนินการเลื่อนชั้นปีการศึกษาและปรับสถานะนิสิตสำเร็จทั้งหมด ${data.updated || selectedList.length} คน เรียบร้อยแล้ว!`);
      setShowPromotionConfirm(false);
      setIsPromotionModalOpen(false);
      loadData();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการเลื่อนชั้นปี: ' + (err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'));
    } finally {
      setPromotionSubmitting(false);
    }
  };

  // Filter Timetables
  const filteredTimetables = useMemo(() => {
    return timetablesList.filter((t) => {
      if (timetableYearFilter !== 'ALL' && t.academicYear !== timetableYearFilter) return false;
      if (timetableSemesterFilter !== 'ALL' && String(t.semester) !== timetableSemesterFilter) return false;
      if (timetableDayFilter !== 'ALL' && String(t.dayOfWeek) !== timetableDayFilter) return false;
      if (timetableSearch.trim()) {
        const q = timetableSearch.toLowerCase();
        return (
          t.courseCode?.toLowerCase().includes(q) ||
          t.courseName?.toLowerCase().includes(q) ||
          t.instructor?.toLowerCase().includes(q) ||
          t.room?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [timetablesList, timetableYearFilter, timetableSemesterFilter, timetableDayFilter, timetableSearch]);

  // Filter Attendance
  const filteredAttendance = useMemo(() => {
    return attendanceList.filter((a) => {
      if (attendanceStatusFilter !== 'ALL' && a.status !== attendanceStatusFilter) return false;
      if (attendanceSearch.trim()) {
        const q = attendanceSearch.toLowerCase();
        return (
          a.courseCode?.toLowerCase().includes(q) ||
          a.studentCode?.toLowerCase().includes(q) ||
          a.studentName?.toLowerCase().includes(q) ||
          a.recordedBy?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [attendanceList, attendanceStatusFilter, attendanceSearch]);

  const DAY_NAMES = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
  const DAY_COLORS: Record<number, string> = {
    0: 'bg-red-50 text-red-700 border-red-200',
    1: 'bg-amber-50 text-amber-700 border-amber-200',
    2: 'bg-pink-50 text-pink-700 border-pink-200',
    3: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    4: 'bg-orange-50 text-orange-700 border-orange-200',
    5: 'bg-sky-50 text-sky-700 border-sky-200',
    6: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans print:h-auto print:overflow-visible print:block">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        pendingRequestsCount={pendingRequests.length}
        studentsTotalCount={studentsCount.total}
        isOfficer={isOfficer}
        isSuperAdmin={isSuperAdmin}
        currentUser={currentUser}
        handleLogout={handleLogout}
      />

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA WITH TOP HEADER
         ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden print:hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="text-slate-800 font-bold">Admin Console</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-orange-600 uppercase">
                {activeTab === 'DASHBOARD' && 'ภาพรวมระบบ (Dashboard)'}
                {activeTab === 'CERTIFICATES' && 'งานอนุมัติหนังสือรับรอง'}
                {activeTab === 'STUDENTS' && 'งานทะเบียนนิสิต'}
                {activeTab === 'COURSES' && 'หลักสูตรและรายวิชา'}
                {activeTab === 'TIMETABLES' && 'ตารางเรียนและตารางสอน'}
                {activeTab === 'ATTENDANCE' && 'บันทึกเวลาเรียน'}
                {activeTab === 'EVENTS' && 'งานกิจกรรมและโครงการนิสิต'}
                {activeTab === 'USERS' && 'จัดการผู้ใช้งานและบทบาท'}
                {activeTab === 'BRANDING' && 'ตั้งค่าโลโก้และข้อความระบบ'}
                {activeTab === 'SHEETS' && 'การเชื่อมต่อ Google Sheets API'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {sheetStatus?.connected ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Google Sheets เชื่อมต่อแล้ว
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                โหมดข้อมูลภายใน (Local)
              </span>
            )}

            <button
              type="button"
              onClick={() => setIsNewYearWorkflowModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              title="ดูคำแนะนำขั้นตอนการทำงานเมื่อเปิดปีการศึกษาใหม่"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">ขั้นตอนเปิดปีการศึกษาใหม่</span>
              <span className="sm:hidden">เปิดปีใหม่</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่หน้าบ้าน (Public)</span>
            </Link>
          </div>
        </header>

        {/* Action Alert Banner */}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-emerald-700 font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ─────────────────────────────────────────────────────────
              TAB A: DASHBOARD OVERVIEW
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'DASHBOARD' && (
            <AdminDashboardTab
              pendingRequests={pendingRequests}
              approvedRequests={approvedRequests}
              studentsCount={studentsCount}
              coursesCount={coursesCount}
              users={users}
              setActiveTab={setActiveTab}
              setStatusFilter={setStatusFilter}
              setApprovingId={setApprovingId}
              onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
            />
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB B: CERTIFICATES MANAGEMENT
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'CERTIFICATES' && (
            <AdminCertificatesTab
              requests={requests}
              filteredRequests={filteredRequests}
              availableYears={availableYears}
              filterYear={filterYear}
              setFilterYear={setFilterYear}
              setArchivingYear={setArchivingYear}
              setIsArchiveModalOpen={setIsArchiveModalOpen}
              setAcademicArchives={setAcademicArchives}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              pendingRequests={pendingRequests}
              approvedRequests={approvedRequests}
              rejectedRequests={rejectedRequests}
              search={search}
              setSearch={setSearch}
              unmaskPassport={unmaskPassport}
              setUnmaskPassport={setUnmaskPassport}
              formatPassport={formatPassport}
              approvingId={approvingId}
              setApprovingId={setApprovingId}
              docNoInput={docNoInput}
              setDocNoInput={setDocNoInput}
              handleApprove={handleApprove}
              handleOpenRejectModal={handleOpenRejectModal}
              setPreviewRequest={setPreviewRequest}
              setPreviewTab={setPreviewTab}
              onRefreshData={loadData}
              onSuccessMessage={(msg) => setActionSuccess(msg)}
            />
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB C: USER & ROLE MANAGEMENT (ผู้ใช้และบทบาท)
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'USERS' && (
            <AdminUsersTab
              users={users}
              filteredUsers={filteredUsers}
              studentsList={studentsList}
              userSearch={userSearch}
              setUserSearch={setUserSearch}
              userRoleFilter={userRoleFilter}
              setUserRoleFilter={setUserRoleFilter}
              isScanningInstructors={isScanningInstructors}
              handleScanTimetables={handleScanTimetables}
              setIsAddUserOpen={setIsAddUserOpen}
              setActiveTab={setActiveTab}
              setStudentSearch={setStudentSearch}
              handleStartEditUser={handleStartEditUser}
              handleOpenTeachingSlip={handleOpenTeachingSlip}
              handleCopyLineTeachingMessage={handleCopyLineTeachingMessage}
              copiedLineUserId={copiedLineUserId}
              handleToggleSuspend={handleToggleSuspend}
              handleUpdateRole={handleUpdateRole}
              handleResetPassword={handleResetPassword}
              forcePasswordChangeOnFirstLogin={settings?.forcePasswordChangeOnFirstLogin !== false}
              onToggleForcePasswordChange={handleToggleForcePasswordChange}
              onOpenNewYearWorkflow={() => setIsNewYearWorkflowModalOpen(true)}
              onOpenBatchTeachingSlips={() => setIsBatchTeachingSlipOpen(true)}
              isOfficer={isOfficer}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB D: BRANDING & SYSTEM SETTINGS (ปรับแต่งโลโก้ & ข้อความ)
             ───────────────────────────────────────────────────────── */}
          {!isOfficer && activeTab === 'BRANDING' && (
            <AdminBrandingTab
              settings={settings}
              setSettings={setSettings}
              savingSettings={savingSettings}
              setSavingSettings={setSavingSettings}
              handleSaveSettings={handleSaveSettings}
              handleLogoFileUpload={handleLogoFileUpload}
              uploadingLogo={uploadingLogo}
              logoFileInputRef={logoFileInputRef}
              setActionSuccess={setActionSuccess}
              activeSignatoriesList={activeSignatoriesList}
              isAddingSignatory={isAddingSignatory}
              setIsAddingSignatory={setIsAddingSignatory}
              newSignatoryForm={newSignatoryForm}
              setNewSignatoryForm={setNewSignatoryForm}
              handleAddSignatory={handleAddSignatory}
              handleResetSignatories={handleResetSignatories}
              editingSignatoryId={editingSignatoryId}
              setEditingSignatoryId={setEditingSignatoryId}
              editSignatoryForm={editSignatoryForm}
              setEditSignatoryForm={setEditSignatoryForm}
              handleSaveEditSignatory={handleSaveEditSignatory}
              handleDeleteSignatory={handleDeleteSignatory}
            />
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB E: GOOGLE SHEETS SETTINGS
             ───────────────────────────────────────────────────────── */}
          {!isOfficer && activeTab === 'SHEETS' && (
            <AdminSheetsTab
              sheetStatus={sheetStatus}
              syncingSheet={syncingSheet}
              onInitialSync={handleInitialSync}
            />
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB F: STUDENTS MANAGEMENT VIEW (ทะเบียนนิสิต)
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'STUDENTS' && (
            <AdminStudentsTab
              studentsCount={studentsCount}
              filteredStudents={filteredStudents}
              allStudents={studentsList}
              onRefresh={() => loadData()}
              studentSearch={studentSearch}
              setStudentSearch={setStudentSearch}
              studentProgramFilter={studentProgramFilter}
              setStudentProgramFilter={setStudentProgramFilter}
              studentStatusFilter={studentStatusFilter}
              setStudentStatusFilter={setStudentStatusFilter}
              studentYearFilter={studentYearFilter}
              setStudentYearFilter={setStudentYearFilter}
              unmaskPassport={unmaskPassport}
              setUnmaskPassport={setUnmaskPassport}
              adminSelectedStudentCodes={adminSelectedStudentCodes}
              setAdminSelectedStudentCodes={setAdminSelectedStudentCodes}
              isAllAdminStudentsSelected={isAllAdminStudentsSelected}
              toggleSelectAllAdminStudents={toggleSelectAllAdminStudents}
              toggleSelectAdminStudent={toggleSelectAdminStudent}
              openPromotionModal={openPromotionModal}
              openDeleteBulkStudentsModal={openDeleteBulkStudentsModal}
              openDeleteSingleStudentModal={openDeleteSingleStudentModal}
            />
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB G: COURSES MANAGEMENT VIEW (หลักสูตร & รายวิชา)
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'COURSES' && (
            <AdminCoursesTab
              coursesCount={coursesCount}
              filteredCourses={filteredCourses}
              courseSearch={courseSearch}
              setCourseSearch={setCourseSearch}
              courseProgramFilter={courseProgramFilter}
              setCourseProgramFilter={setCourseProgramFilter}
              instructors={users.filter((u) => u.role === 'INSTRUCTOR')}
              onRefreshCourses={loadData}
            />
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB H: TIMETABLES MANAGEMENT VIEW (ตารางเรียน & ตารางสอน)
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'TIMETABLES' && (
            <AdminTimetablesTab
              timetablesList={timetablesList}
              filteredTimetables={filteredTimetables}
              timetableSearch={timetableSearch}
              setTimetableSearch={setTimetableSearch}
              timetableYearFilter={timetableYearFilter}
              setTimetableYearFilter={setTimetableYearFilter}
              timetableSemesterFilter={timetableSemesterFilter}
              setTimetableSemesterFilter={setTimetableSemesterFilter}
              timetableDayFilter={timetableDayFilter}
              setTimetableDayFilter={setTimetableDayFilter}
              handleScanTimetables={handleScanTimetables}
              isScanningInstructors={isScanningInstructors}
            />
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB I: ATTENDANCE MANAGEMENT VIEW (บันทึกตรวจเวลาเรียน)
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'ATTENDANCE' && (
            <AdminAttendanceTab
              attendanceList={attendanceList}
              filteredAttendance={filteredAttendance}
              attendanceSearch={attendanceSearch}
              setAttendanceSearch={setAttendanceSearch}
              attendanceStatusFilter={attendanceStatusFilter}
              setAttendanceStatusFilter={setAttendanceStatusFilter}
              timetablesList={timetablesList}
              studentsList={studentsList}
              currentUser={currentUser}
              logoUrl={settings.logoUrl}
              onRefresh={loadData}
            />
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB J: EVENTS MANAGEMENT VIEW (งานกิจกรรมและโครงการนิสิต)
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'EVENTS' && (
            <AdminEventsTab
              eventsList={eventsList}
              registrationsList={eventRegistrationsList}
              onToggleStatus={handleToggleEventStatus}
              onRefresh={() => {
                fetch('/api/events')
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.success) {
                      setEventsList(d.events || []);
                      setEventRegistrationsList(d.registrations || []);
                    }
                  });
                loadData();
              }}
              settings={settings}
            />
          )}
        </main>
      </div>

      <AddUserModal
        isOpen={isAddUserOpen}
        newUserForm={newUserForm}
        setNewUserForm={setNewUserForm}
        isOfficer={isOfficer}
        onClose={() => setIsAddUserOpen(false)}
        onSubmit={handleCreateUser}
      />

      <EditUserModal
        editingUser={editingUser}
        editUserForm={editUserForm}
        setEditUserForm={setEditUserForm as any}
        editUserSaving={editUserSaving}
        isOfficer={isOfficer}
        onClose={() => setEditingUser(null)}
        onSubmit={handleSaveEditUser}
      />

      <AdminCertificatePreviewModal
        previewRequest={previewRequest}
        setPreviewRequest={setPreviewRequest}
        previewTab={previewTab}
        setPreviewTab={setPreviewTab}
        requests={requests}
        settings={settings}
        activeSignatoriesList={activeSignatoriesList}
        currentUser={currentUser}
        handleApprove={handleApprove}
        handleOpenRejectModal={handleOpenRejectModal}
        setRejectReasonInput={setRejectReasonInput}
        loadData={loadData}
        setActionSuccess={setActionSuccess}
      />

      <CertRejectModal
        rejectingRequest={rejectingRequest}
        rejectReasonInput={rejectReasonInput}
        setRejectReasonInput={setRejectReasonInput}
        rejectSubmitting={rejectSubmitting}
        onClose={() => setRejectingRequest(null)}
        onConfirm={handleConfirmReject}
      />
      <ArchiveSummaryModal
        isOpen={isArchiveModalOpen}
        availableYears={availableYears}
        archivingYear={archivingYear}
        setArchivingYear={setArchivingYear}
        requests={requests}
        academicArchives={academicArchives}
        archiveLoading={archiveLoading}
        onArchiveYear={handleArchiveYear}
        onClose={() => setIsArchiveModalOpen(false)}
      />

      <TeachingSlipModal
        user={teachingSlipUser}
        teachingSlipQr={teachingSlipQr}
        availableAcademicYears={availableAcademicYears}
        getCoursesForInstructor={getCoursesForInstructor}
        onCopyLineMessage={handleCopyLineTeachingMessage}
        onClose={() => setTeachingSlipUser(null)}
        settings={settings}
        signatories={activeSignatoriesList}
        adminName={currentUser?.name || 'ผู้ดูแลระบบ'}
      />

      <BatchTeachingSlipsModal
        isOpen={isBatchTeachingSlipOpen}
        onClose={() => setIsBatchTeachingSlipOpen(false)}
        instructors={users.filter((u) => u.role === 'INSTRUCTOR' || u.role === 'ADMIN' || u.role === 'OFFICER' || u.role === 'SUPER_ADMIN')}
        availableAcademicYears={availableAcademicYears}
        getCoursesForInstructor={getCoursesForInstructor}
        settings={settings}
        signatories={activeSignatoriesList}
        adminName={currentUser?.name || 'ผู้ดูแลระบบ'}
      />

      <BulkPromotionModal
        isOpen={isPromotionModalOpen}
        onClose={() => setIsPromotionModalOpen(false)}
        showConfirm={showPromotionConfirm}
        setShowConfirm={setShowPromotionConfirm}
        promotionStats={promotionStats}
        promotionTargetYear={promotionTargetYear}
        setPromotionTargetYear={setPromotionTargetYear}
        promotionProgramFilter={promotionProgramFilter}
        setPromotionProgramFilter={setPromotionProgramFilter}
        promotionActionFilter={promotionActionFilter}
        setPromotionActionFilter={setPromotionActionFilter}
        promotionSearch={promotionSearch}
        setPromotionSearch={setPromotionSearch}
        filteredPromotionItems={filteredPromotionItems}
        setFilteredPromotionSelection={setFilteredPromotionSelection}
        setFilteredPromotionAction={setFilteredPromotionAction}
        onResetRecommendation={openPromotionModal}
        onToggleSelect={togglePromotionSelect}
        onActionChange={handlePromotionItemActionChange}
        onCustomFieldChange={handlePromotionCustomFieldChange}
        promotionSubmitting={promotionSubmitting}
        onExecuteBulkPromotion={handleExecuteBulkPromotion}
      />

      {/* New Academic Year Recommended Workflow Modal */}
      <NewAcademicYearWorkflowModal
        isOpen={isNewYearWorkflowModalOpen}
        onClose={() => setIsNewYearWorkflowModalOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
      />
      {/* Modals from components */}
      <StudentDeleteModal
        isOpen={studentDeleteModal.isOpen}
        isBulk={studentDeleteModal.isBulk}
        targets={studentDeleteModal.targets}
        isDeleting={isDeletingStudents}
        onClose={() => setStudentDeleteModal({ isOpen: false, targets: [], isBulk: false })}
        onConfirm={handleConfirmDeleteStudents}
      />

      <AutoProvisionModal
        isOpen={provisionModal.isOpen}
        totalTimetableInstructors={provisionModal.totalTimetableInstructors}
        existingCount={provisionModal.existingCount}
        newCount={provisionModal.newCount}
        alreadyExisting={provisionModal.alreadyExisting}
        candidates={provisionModal.candidates}
        isSubmitting={isSubmittingProvision}
        onToggleCandidateSelect={handleToggleCandidateSelect}
        onUpdateCandidateField={handleUpdateCandidateField}
        onClose={() => setProvisionModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmBatchProvision}
      />
    </div>
  );
}
