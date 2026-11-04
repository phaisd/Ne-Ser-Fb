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
  Copy
} from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf-export';
import { getAuthUser, clearAuthSession } from '@/lib/auth-client';
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
} from '@/components/admin/tabs';
import {
  StudentDeleteModal,
  TeachingSlipModal,
  EditUserModal,
  AutoProvisionModal,
  AddUserModal,
  CertRejectModal,
  ArchiveSummaryModal,
  BulkPromotionModal,
} from '@/components/admin/modals';

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

type AdminTab =
  | 'DASHBOARD'
  | 'CERTIFICATES'
  | 'STUDENTS'
  | 'COURSES'
  | 'TIMETABLES'
  | 'ATTENDANCE'
  | 'USERS'
  | 'BRANDING'
  | 'SHEETS';

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
    id: 'ACTING_DEAN',
    label: '4. ผู้รักษาราชการแทนคณบดีคณะพุทธศาสตร์',
    name: '',
    title: 'รักษาราชการแทนคณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'REGISTRAR',
    label: '5. ผู้อำนวยการส่วนทะเบียนและวัดผล (นายทะเบียน)',
    name: 'พระมหาสุริยัน ปญฺญาวชิโร, ผศ.ดร.',
    title: 'ผู้อำนวยการส่วนทะเบียนและวัดผล',
  },
  {
    id: 'BLANK',
    label: '6. เว้นว่างไว้สำหรับลงนามสดด้วยลายมือปากกา (Handwritten)',
    name: '',
    title: 'คณบดีคณะพุทธศาสตร์',
  },
  {
    id: 'CUSTOM',
    label: '7. กำหนดเอง (พิมพ์ชื่อและตำแหน่งระบุเอง)',
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
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Rejection Dialog states
  const [rejectingRequest, setRejectingRequest] = useState<CertificateRequest | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('');
  const [rejectSubmitting, setRejectSubmitting] = useState<boolean>(false);

  // Preview & Attachment Inspection States
  const [previewTab, setPreviewTab] = useState<'DOCUMENT' | 'ATTACHMENTS'>('DOCUMENT');
  const [inspectionDocTab, setInspectionDocTab] = useState<'ENROLLMENT' | 'PASSPORT' | 'SIDE_BY_SIDE'>('ENROLLMENT');
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState<boolean>(false);

  // Document Customizer & Archiving States
  const [previewTemplate, setPreviewTemplate] = useState<'THAI_STANDARD' | 'BANK_LETTER' | 'ENG_CERT' | 'INTERNAL_MEMO'>('THAI_STANDARD');
  const [docFontSize, setDocFontSize] = useState<number>(15);
  const [signerFontSize, setSignerFontSize] = useState<number>(14);
  const [studentSignFontSize, setStudentSignFontSize] = useState<number>(14);
  const [docLineSpacing, setDocLineSpacing] = useState<number>(1.6);
  const [docSignerOffset, setDocSignerOffset] = useState<number>(20);
  const [photoBoxOffsetX, setPhotoBoxOffsetX] = useState<number>(0);
  const [dotsCount, setDotsCount] = useState<number>(22);
  const [headerTitleSpacing, setHeaderTitleSpacing] = useState<number>(24);
  const [headerTopSpacing, setHeaderTopSpacing] = useState<number>(0);
  const [docFontFamily, setDocFontFamily] = useState<string>('Sarabun, "TH Sarabun New", "TH Sarabun PSK", sans-serif');
  const [studentSignAlign, setStudentSignAlign] = useState<'left' | 'center' | 'right'>('center');
  const [studentSignOffsetX, setStudentSignOffsetX] = useState<number>(0);
  const [showPhotoBox, setShowPhotoBox] = useState<boolean>(true);
  const [showStudentSign, setShowStudentSign] = useState<boolean>(true);
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [pdfDownloading, setPdfDownloading] = useState<boolean>(false);

  // Academic Year Archiving
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  const [archivingYear, setArchivingYear] = useState<string>('2569');
  const [academicArchives, setAcademicArchives] = useState<any[]>([]);
  const [archiveLoading, setArchiveLoading] = useState<boolean>(false);

  const formatPassport = (p?: string) => {
    if (!p) return '-';
    if (unmaskPassport) return p;
    if (p.length <= 4) return '••••';
    return `${p.slice(0, 2)}••••${p.slice(-2)}`;
  };

  useEffect(() => {
    if (previewRequest) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3020';
      const verifyUrl = `${origin}/verify?docNo=${encodeURIComponent(previewRequest.docNo || previewRequest.id)}`;
      QRCode.toDataURL(verifyUrl, {
        width: 180,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      }).then(setQrCodeDataUrl).catch(() => setQrCodeDataUrl(''));

      // Auto choose best template based on request
      if (previewRequest.certType?.includes('ธนาคาร') || previewRequest.certType?.includes('Banking') || (previewRequest as any).bankTargetTh) {
        setPreviewTemplate('BANK_LETTER');
      } else if (previewRequest.certType?.includes('English') || previewRequest.certType?.includes('CONCERN')) {
        setPreviewTemplate('ENG_CERT');
      } else {
        setPreviewTemplate('THAI_STANDARD');
      }
    } else {
      setQrCodeDataUrl('');
    }
  }, [previewRequest]);

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
    department: 'คณะพุทธศาสตร์ มจร',
    role: 'INSTRUCTOR' as 'SUPER_ADMIN' | 'ADMIN' | 'OFFICER' | 'INSTRUCTOR',
  });
  const [editUserSaving, setEditUserSaving] = useState(false);
    // Teaching assignment slip & LINE copy state
  const [teachingSlipUser, setTeachingSlipUser] = useState<any | null>(null);
  const [teachingSlipQr, setTeachingSlipQr] = useState<string | null>(null);
  const [copiedLineUserId, setCopiedLineUserId] = useState<string | null>(null);

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    gmail: '',
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

  // Signatory Customization for Print Preview
  const [selectedSignerPreset, setSelectedSignerPreset] = useState<string>('DEAN');
  const [customSigner, setCustomSigner] = useState({
    name: 'พระครูสุธีกิตติบัณฑิต, รศ.ดร.',
    title: 'คณบดีคณะพุทธศาสตร์',
  });

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

  useEffect(() => {
    if (previewRequest) {
      setSelectedSignerPreset('DEAN');
      setCustomSigner({
        name: settings.signerNameTh || 'พระครูสุธีกิตติบัณฑิต, รศ.ดร.',
        title: settings.signerTitleTh || 'คณบดีคณะพุทธศาสตร์',
      });
    }
  }, [previewRequest, settings.signerNameTh, settings.signerTitleTh]);

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
    name: 'อาจารย์ไพศาล (ผู้ดูแลระบบสูงสุด)',
    role: 'SUPER_ADMIN',
    email: 'phaisal.dis@mcu.ac.th',
  });

  // Data collections for full views
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [timetablesList, setTimetablesList] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);

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
    ])
      .then(([reqRes, stdRes, crsRes, ttbRes, attRes, usrRes, setRes, shtRes]) => {
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
        if (usrRes.success) setUsers(usrRes.data);
        if (setRes.success && setRes.data) setSettings(setRes.data);
        if (shtRes) setSheetStatus(shtRes);
      })
      .finally(() => setLoading(false));
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
            if (d.authenticated && d.user) setCurrentUser(d.user);
          })
          .catch(() => {});
      }

      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab') as AdminTab | null;
        if (tabParam && ['DASHBOARD', 'CERTIFICATES', 'STUDENTS', 'COURSES', 'TIMETABLES', 'ATTENDANCE', 'USERS', 'BRANDING', 'SHEETS'].includes(tabParam)) {
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
  const handleApprove = async (id: string, defaultDocNo?: string) => {
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

    try {
      const res = await fetch('/api/certificates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'APPROVED',
          docNo: finalDocNo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`อนุมัติคำร้องเรียบร้อย! ออกเลขที่หนังสือ: อว 8002/${finalDocNo}`);
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

  const handleUploadAdditionalAttachment = async (file: File, type: 'enrollment' | 'passport' | 'photo') => {
    if (!previewRequest) return;
    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        const updatePayload: any = { id: previewRequest.id };
        if (type === 'enrollment') updatePayload.enrollmentSlipUrl = data.url;
        else if (type === 'passport') updatePayload.passportCopyUrl = data.url;
        else if (type === 'photo') updatePayload.photoUrl = data.url;

        await fetch('/api/certificates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });

        setPreviewRequest((prev) => (prev ? { ...prev, ...updatePayload } : null));
        loadData();
        setActionSuccess('อัปโหลดและแนบเอกสารสำเร็จเรียบร้อย');
      } else {
        alert(data.error || 'อัปโหลดล้มเหลว');
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!previewRequest) return;
    setPdfDownloading(true);
    try {
      const safeName = (previewRequest.fullName || 'student').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');
      const filename = `หนังสือรับรอง_${safeName}_อว8002-${previewRequest.docNo || previewRequest.id}.pdf`;
      await exportElementToPdf('printable-certificate', filename);
    } catch (e) {
      console.error('Download PDF error:', e);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด PDF กรุณาลองใช้ปุ่ม สั่งพิมพ์ (Print to PDF)');
    } finally {
      setPdfDownloading(false);
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
      department: user.department || 'คณะพุทธศาสตร์ มจร',
      role: user.role || 'INSTRUCTOR',
    });
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editUserForm.email.trim()) {
      alert('กรุณากรอกอีเมลสำหรับเข้าสู่ระบบ');
      return;
    }
    setEditUserSaving(true);
    try {
      const aliases = editUserForm.aliasesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-profile',
          userId: editingUser.id,
          updates: {
            ...editUserForm,
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

    const getCoursesForInstructor = (user: any) => {
    if (!user) return [];
    const matched = timetablesList.filter((t) => matchInstructorStrict(user, t.instructor));
    const unique: any[] = [];
    const seen = new Set<string>();
    matched.forEach((c) => {
      const key = `${c.courseCode}-${c.dayOfWeek || ''}-${c.startTime || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(c);
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

  const generateInstructorLineMessage = (user: any) => {
    const courses = getCoursesForInstructor(user);
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

ฝ่ายทะเบียนและวิชาการ ขอแจ้งข้อมูลภาระงานสอนและบัญชีเข้าสู่ระบบตรวจเช็คชื่อนิสิตเข้าชั้นเรียน ประจำปีการศึกษา 2569 ดังนี้ครับ:

📚 รายวิชาที่ท่านรับผิดชอบบรรยาย:
${coursesText}

🔑 ข้อมูลเข้าสู่ระบบตรวจเช็คชื่อนิสิต (Attendance System):
• ลิงก์เข้าใช้งาน: http://localhost:3020/attendance
• อีเมลเข้าสู่ระบบ (Username): ${user.email}
• รหัสผ่านเริ่มต้น (Default Password): ${user.defaultPassword || 'mcu123456'}
(หรือสามารถกดปุ่ม "เข้าสู่ระบบด้วย Google / บัญชี มจร." ได้โดยตรงทันที)

* หมายเหตุ: ระบบจำกัดสิทธิ์ให้อาจารย์ตรวจเช็คชื่อได้เฉพาะรายวิชาที่ท่านรับผิดชอบบรรยายเท่านั้น หากพบว่ารายวิชาคลาดเคลื่อน โปรดติดต่อสำนักงานคณะพุทธศาสตร์ครับ`;
  };

  const handleCopyLineTeachingMessage = (user: any) => {
    const text = generateInstructorLineMessage(user);
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
    if (!newUserForm.name || !newUserForm.email) {
      alert('กรุณากรอกชื่อและอีเมลให้ครบถ้วน');
      return;
    }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-user', userData: newUserForm }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`สร้างบัญชีผู้ใช้ [${newUserForm.name}] สำเร็จเรียบร้อย`);
        setIsAddUserOpen(false);
        setNewUserForm({
          name: '',
          email: '',
          gmail: '',
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

    return users.filter((u) => {
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
  }, [users, studentsList, userRoleFilter, userSearch]);

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

  const handleConfirmDeleteStudents = async () => {
    if (studentDeleteModal.targets.length === 0) return;
    setIsDeletingStudents(true);
    try {
      const codes = studentDeleteModal.targets.map((t) => t.studentCode);
      const res = await fetch('/api/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentCodes: codes }),
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

        alert(`ลบข้อมูลนิสิตเรียบร้อยแล้ว จำนวน ${data.deletedCount || codes.length} รูป/คน`);
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
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. BACKEND SIDEBAR (เมนูด้านข้าง)
         ───────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-700 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-md">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Admin Logo"
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-xl">{settings.logoEmoji || '☸️'}</span>
              )}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-orange-400 tracking-wider uppercase">
                ADMIN CONSOLE
              </div>
              <div className="text-sm font-bold text-white truncate">
                {settings.facultyNameTh || 'คณะพุทธศาสตร์'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {settings.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Section 1: Main Backend Operations */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              ระบบหลัก (Operations)
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab('DASHBOARD');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'DASHBOARD'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-blue-400" />
                <span>แดชบอร์ดภาพรวม</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('CERTIFICATES');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'CERTIFICATES'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>อนุมัติหนังสือรับรอง</span>
                </div>
                {pendingRequests.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('STUDENTS');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'STUDENTS'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-orange-400" />
                  <span>ทะเบียนนิสิต</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {studentsCount.total}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('COURSES');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'COURSES'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>หลักสูตร & รายวิชา</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('TIMETABLES');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'TIMETABLES'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>ตารางเรียน & ตารางสอน</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('ATTENDANCE');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'ATTENDANCE'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <CheckSquare className="w-4 h-4 text-teal-400" />
                <span>บันทึกตรวจเวลาเรียน</span>
              </button>
            </nav>
          </div>

          {/* Section 2: Administration & Configuration */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              การจัดการและตั้งค่า (Administration)
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab('USERS');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'USERS'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <UserCog className="w-4 h-4 text-sky-400" />
                <span>จัดการผู้ใช้และบทบาท</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('BRANDING');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'BRANDING'
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4 text-pink-400" />
                <span>ตั้งค่าโลโก้ & ข้อความ</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('SHEETS');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'SHEETS'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Table2 className="w-4 h-4 text-emerald-400" />
                <span>เชื่อมต่อ Google Sheets</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Sidebar Bottom Profile & Public Site Link */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm ${
              currentUser.role === 'SUPER_ADMIN' || currentUser.email === 'phaisal.dis@mcu.ac.th'
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400/30'
                : 'bg-orange-600'
            }`}>
              {currentUser.role === 'SUPER_ADMIN' || currentUser.email === 'phaisal.dis@mcu.ac.th' ? '👑' : currentUser.name ? currentUser.name.charAt(0) : 'A'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{currentUser.name || 'อาจารย์ไพศาล'}</div>
              <div className="text-[10px] text-purple-300 font-mono truncate">
                {currentUser.email || 'phaisal.dis@mcu.ac.th'}
              </div>
              <div className="text-[9px] text-emerald-400 font-bold uppercase mt-0.5">
                สิทธิ์: {currentUser.role === 'SUPER_ADMIN' || currentUser.email === 'phaisal.dis@mcu.ac.th' ? 'SUPER ADMIN' : currentUser.role || 'ADMIN'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/"
              target="_blank"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
              title="เปิดหน้าบ้านในแท็บใหม่"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดหน้าบ้าน</span>
            </Link>
            <button
              onClick={handleLogout}
              className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-medium transition flex items-center justify-center"
              title="ออกจากระบบ"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA WITH TOP HEADER
         ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
            />
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB D: BRANDING & SYSTEM SETTINGS (ปรับแต่งโลโก้ & ข้อความ)
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'BRANDING' && (
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
          {activeTab === 'SHEETS' && (
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
            />
          )}
        </main>
      </div>

      <AddUserModal
        isOpen={isAddUserOpen}
        newUserForm={newUserForm}
        setNewUserForm={setNewUserForm}
        onClose={() => setIsAddUserOpen(false)}
        onSubmit={handleCreateUser}
      />

      <EditUserModal
        editingUser={editingUser}
        editUserForm={editUserForm}
        setEditUserForm={setEditUserForm as any}
        editUserSaving={editUserSaving}
        onClose={() => setEditingUser(null)}
        onSubmit={handleSaveEditUser}
      />

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: PRINT & PREVIEW CERTIFICATE
         ───────────────────────────────────────────────────────────── */}
      {previewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`bg-white rounded-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-4 transition-all duration-200 ${
            previewTab === 'ATTACHMENTS' ? 'max-w-5xl' : 'max-w-3xl'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {previewTab === 'DOCUMENT'
                      ? 'ตัวอย่างเอกสารทางการ (Official Document Preview)'
                      : 'ตรวจสอบเอกสารสำเนาที่แนบมา (Attached Copies Inspection)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    คำร้อง: <span className="font-bold text-slate-800">{previewRequest.fullName}</span> ({previewRequest.studentCode})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Tab Switcher: Document vs Attachments */}
                <div className="flex p-0.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('DOCUMENT')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      previewTab === 'DOCUMENT'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>ตัวอย่างหนังสือ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('ATTACHMENTS')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      previewTab === 'ATTACHMENTS'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>ตรวจเอกสารแนบ</span>
                    {previewRequest.enrollmentSlipUrl ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="มีสำเนาลงเรียนแล้ว"></span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="ขาดสำเนาลงเรียน"></span>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setPreviewRequest(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {previewTab === 'ATTACHMENTS' ? (
              /* ── ATTACHMENT INSPECTION SCREEN ── */
              <div className="space-y-4 animate-in fade-in py-1">
                {/* Student Info Bar */}
                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-purple-600 block text-[11px] font-bold">ข้อมูลผู้ยื่นคำร้อง:</span>
                    <span className="font-bold text-slate-900 text-sm">{previewRequest.fullName}</span>
                    <span className="text-purple-700 font-mono font-bold ml-2">({previewRequest.studentCode})</span>
                    <span className="text-slate-600 ml-2">| หลักสูตร: {previewRequest.degreeLevel || 'ปริญญาตรี'} สาขา: {previewRequest.major || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">สถานะคำร้อง:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-xs ${
                      previewRequest.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : previewRequest.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {previewRequest.status === 'APPROVED' ? 'อนุมัติแล้ว' : previewRequest.status === 'REJECTED' ? 'ปฏิเสธ' : 'รอพิจารณา'}
                    </span>
                  </div>
                </div>

                {/* Document View Switcher (สลับตรวจข้อ 1 หรือข้อ 2 หรือเทียบข้างกัน) */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 rounded-2xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setInspectionDocTab('ENROLLMENT')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                        inspectionDocTab === 'ENROLLMENT'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>ข้อ 1. ใบสำเนาการลงทะเบียนเรียน / ใบเสร็จ</span>
                      {previewRequest.enrollmentSlipUrl ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-300" title="มีไฟล์แนบแล้ว"></span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="ยังไม่แนบ"></span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setInspectionDocTab('PASSPORT')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                        inspectionDocTab === 'PASSPORT'
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>ข้อ 2. สำเนาหนังสือเดินทาง (Passport)</span>
                      {previewRequest.passportCopyUrl ? (
                        <span className="w-2 h-2 rounded-full bg-sky-300" title="มีไฟล์แนบแล้ว"></span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-normal">
                          {previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai' ? '(ไทย)' : '(ยังไม่แนบ)'}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setInspectionDocTab('SIDE_BY_SIDE')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                        inspectionDocTab === 'SIDE_BY_SIDE'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                      title="ดูเทียบเอกสารทั้ง 2 ฉบับพร้อมกันแบบ 2 ฝั่ง"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>เทียบ 2 ฝั่ง (Side-by-Side)</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium px-2">
                    * รูปถ่ายนิสิต 1.5 - 2 นิ้ว ให้นิสิตนำมาติดเองบนหนังสือรับรองตอนรับเอกสาร
                  </div>
                </div>

                {/* Preview View Area */}
                <div className={`grid gap-4 ${inspectionDocTab === 'SIDE_BY_SIDE' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {/* ───────────────── PREVIEW ข้อ 1: ใบสำเนาลงเรียน / ใบเสร็จ ───────────────── */}
                  {(inspectionDocTab === 'ENROLLMENT' || inspectionDocTab === 'SIDE_BY_SIDE') && (
                    <div className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${
                      previewRequest.enrollmentSlipUrl ? 'bg-emerald-50/20 border-emerald-300' : 'bg-amber-50/50 border-amber-300'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white ${
                            previewRequest.enrollmentSlipUrl ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}>
                            <FileCheck2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                              <span>ข้อ 1: ใบสำเนาการลงทะเบียนเรียน / ใบเสร็จรับเงิน</span>
                              {previewRequest.enrollmentSlipUrl ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  ✓ แนบแล้ว
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                                  ⚠️ ขาดเอกสารนี้
                                </span>
                              )}
                            </h4>
                            <p className="text-[11px] text-slate-500">เอกสารสำคัญใช้ตรวจสอบสถานะการเป็นนิสิตและการลงทะเบียนเรียน</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          {previewRequest.enrollmentSlipUrl && (
                            <a
                              href={previewRequest.enrollmentSlipUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-1 shadow-xs transition"
                              title="เปิดเอกสารในแท็บใหม่"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>เปิดแท็บใหม่</span>
                            </a>
                          )}

                          <label className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 font-bold flex items-center gap-1 cursor-pointer transition shadow-xs">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{uploadingAttachment ? 'กำลังอัปโหลด...' : 'แนบไฟล์แทน'}</span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadAdditionalAttachment(f, 'enrollment');
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Interactive Document Preview Box */}
                      {previewRequest.enrollmentSlipUrl ? (
                        <div className="space-y-2">
                          {previewRequest.enrollmentSlipUrl.toLowerCase().endsWith('.pdf') ? (
                            <div className="rounded-xl overflow-hidden border border-emerald-200 bg-slate-900 shadow-inner">
                              <iframe
                                src={`${previewRequest.enrollmentSlipUrl}#toolbar=0&navpanes=0`}
                                className="w-full h-[520px] bg-white"
                                title="พรีวิวสำเนาลงเรียน (PDF)"
                              />
                            </div>
                          ) : (
                            <div
                              onClick={() => setZoomImage(previewRequest.enrollmentSlipUrl!)}
                              className="relative h-[520px] bg-slate-900/5 rounded-xl border border-emerald-200 overflow-hidden flex items-center justify-center cursor-zoom-in group shadow-inner"
                              title="คลิกเพื่อดูภาพขยายใหญ่เต็มจอ"
                            >
                              <img
                                src={previewRequest.enrollmentSlipUrl}
                                alt="ใบสำเนาการลงทะเบียนเรียน"
                                className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition gap-1.5">
                                <ZoomIn className="w-4 h-4" />
                                <span>คลิกเพื่อดูภาพขยายใหญ่ (Lightbox Zoom)</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                            <span>
                              ชนิดไฟล์: {previewRequest.enrollmentSlipUrl.toLowerCase().endsWith('.pdf') ? 'เอกสาร PDF' : 'ไฟล์รูปภาพ'}
                            </span>
                            {!previewRequest.enrollmentSlipUrl.toLowerCase().endsWith('.pdf') && (
                              <button
                                type="button"
                                onClick={() => setZoomImage(previewRequest.enrollmentSlipUrl!)}
                                className="text-purple-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <ZoomIn className="w-3.5 h-3.5" /> คลิกซูมดูภาพขนาดเต็ม
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 bg-white/90 rounded-xl border border-amber-200 text-xs text-center space-y-3 my-4">
                          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                          <div>
                            <p className="font-bold text-amber-950 text-sm">นิสิตยังไม่ได้แนบใบสำเนาการลงทะเบียนเรียน</p>
                            <p className="text-xs text-amber-800 max-w-md mx-auto mt-1">
                              หากไม่พบคีย์ข้อมูลการลงทะเบียนเรียนในระบบ สามารถกดปฏิเสธคำร้องพร้อมแจ้งให้นิสิตส่งเอกสารเข้ามาใหม่ได้ทันที
                            </p>
                          </div>
                          {previewRequest.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenRejectModal(previewRequest);
                                setRejectReasonInput('ขาดสำเนาเอกสารการลงทะเบียน');
                              }}
                              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-200 cursor-pointer inline-flex items-center gap-1.5 transition"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>ปฏิเสธคำร้อง (ระบุว่าขาดสำเนาลงทะเบียนเรียน)</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ───────────────── PREVIEW ข้อ 2: สำเนาหนังสือเดินทาง (Passport) ───────────────── */}
                  {(inspectionDocTab === 'PASSPORT' || inspectionDocTab === 'SIDE_BY_SIDE') && (
                    <div className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${
                      previewRequest.passportCopyUrl ? 'bg-sky-50/20 border-sky-300' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white ${
                            previewRequest.passportCopyUrl ? 'bg-sky-600' : 'bg-slate-400'
                          }`}>
                            <Globe className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                              <span>ข้อ 2: สำเนาหนังสือเดินทาง (Passport Copy)</span>
                              {previewRequest.passportCopyUrl ? (
                                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                                  ✓ แนบแล้ว
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                                  {previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai' ? 'สัญชาติไทย' : 'ยังไม่ได้แนบ'}
                                </span>
                              )}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-mono">
                              เลขที่หนังสือเดินทาง: {previewRequest.passportNo || 'ไม่มี (ใช้เลขบัตร ปชช. ในระบบทะเบียน)'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          {previewRequest.passportCopyUrl && (
                            <a
                              href={previewRequest.passportCopyUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-1 shadow-xs transition"
                              title="เปิดเอกสารในแท็บใหม่"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>เปิดแท็บใหม่</span>
                            </a>
                          )}

                          <label className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 font-bold flex items-center gap-1 cursor-pointer transition shadow-xs">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{uploadingAttachment ? 'กำลังอัปโหลด...' : 'แนบไฟล์แทน'}</span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadAdditionalAttachment(f, 'passport');
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Interactive Document Preview Box */}
                      {previewRequest.passportCopyUrl ? (
                        <div className="space-y-2">
                          {previewRequest.passportCopyUrl.toLowerCase().endsWith('.pdf') ? (
                            <div className="rounded-xl overflow-hidden border border-sky-200 bg-slate-900 shadow-inner">
                              <iframe
                                src={`${previewRequest.passportCopyUrl}#toolbar=0&navpanes=0`}
                                className="w-full h-[520px] bg-white"
                                title="พรีวิวสำเนาพาสปอร์ต (PDF)"
                              />
                            </div>
                          ) : (
                            <div
                              onClick={() => setZoomImage(previewRequest.passportCopyUrl!)}
                              className="relative h-[520px] bg-slate-900/5 rounded-xl border border-sky-200 overflow-hidden flex items-center justify-center cursor-zoom-in group shadow-inner"
                              title="คลิกเพื่อดูภาพขยายใหญ่เต็มจอ"
                            >
                              <img
                                src={previewRequest.passportCopyUrl}
                                alt="สำเนาหนังสือเดินทาง"
                                className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition gap-1.5">
                                <ZoomIn className="w-4 h-4" />
                                <span>คลิกเพื่อดูภาพขยายใหญ่ (Lightbox Zoom)</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                            <span>
                              ชนิดไฟล์: {previewRequest.passportCopyUrl.toLowerCase().endsWith('.pdf') ? 'เอกสาร PDF' : 'ไฟล์รูปภาพ'}
                            </span>
                            {!previewRequest.passportCopyUrl.toLowerCase().endsWith('.pdf') && (
                              <button
                                type="button"
                                onClick={() => setZoomImage(previewRequest.passportCopyUrl!)}
                                className="text-purple-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <ZoomIn className="w-3.5 h-3.5" /> คลิกซูมดูภาพขนาดเต็ม
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 bg-white/90 rounded-xl border border-slate-200 text-xs text-center space-y-2 my-4">
                          <p className="font-bold text-slate-700 text-sm">
                            {previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai'
                              ? '🇹🇭 นิสิตสัญชาติไทย (ใช้ฐานข้อมูลทะเบียนประวัตินิสิต)'
                              : 'ยังไม่มีสำเนาพาสปอร์ตแนบมาในระบบ'}
                          </p>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            เลขพาสปอร์ตที่บันทึก: <strong className="font-mono text-purple-700">{previewRequest.passportNo || 'ไม่มี'}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ───────────────── SUMMARY & ACTION FOOTER BAR ───────────────── */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 flex flex-wrap items-center gap-3">
                      <span>สรุปเอกสาร:</span>
                      <span className={previewRequest.enrollmentSlipUrl ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                        1. สำเนาลงเรียน {previewRequest.enrollmentSlipUrl ? '✓ เรียบร้อย' : '⚠️ ยังไม่แนบ'}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className={previewRequest.passportCopyUrl ? 'text-sky-700 font-bold' : 'text-slate-600'}>
                        2. สำเนาพาสปอร์ต {previewRequest.passportCopyUrl ? '✓ แนบแล้ว' : '(ใช้ข้อมูลทะเบียน)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 font-medium">
                      📸 <strong>ข้อ 3. รูปถ่ายนิสิต (ขนาด 1.5 - 2 นิ้ว):</strong> ให้นิสิตนำรูปถ่ายจริงมาติดบนหนังสือรับรองด้วยตนเองในวันมารับเอกสารฉบับจริง (เว้นช่องเส้นประไว้บนแบบฟอร์มแล้ว)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('DOCUMENT')}
                      className="px-4 py-2.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-purple-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <FileText className="w-4 h-4" />
                      <span>สลับไปดูตัวอย่างหนังสือรับรอง</span>
                    </button>

                    {previewRequest.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(previewRequest)}
                          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>ปฏิเสธคำร้อง</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await handleApprove(previewRequest.id);
                            setPreviewRequest(null);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>อนุมัติคำร้อง</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ── DOCUMENT PREVIEW & CUSTOMIZER ── */
              <>
                {/* Quick Attachment Indicator Bar inside Document tab */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-700">เอกสารแนบ:</span>
                    {previewRequest.enrollmentSlipUrl ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        <FileCheck2 className="w-3.5 h-3.5" /> มีใบสำเนาลงเรียนแล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                        ⚠️ ขาดสำเนาการลงทะเบียนเรียน
                      </span>
                    )}
                    {previewRequest.passportCopyUrl && (
                      <span className="inline-flex items-center gap-1 font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md">
                        <Paperclip className="w-3.5 h-3.5" /> สำเนาพาสปอร์ต
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('ATTACHMENTS')}
                      className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 underline cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>คลิกเพื่อตรวจสอบเอกสารสำเนาแนบ</span>
                    </button>
                    {previewRequest.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleOpenRejectModal(previewRequest)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition"
                      >
                        ปฏิเสธคำร้อง
                      </button>
                    )}
                  </div>
                </div>

                {/* Signatory & Document Customization Toolbar (Hidden on Print) */}
                <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200/80 space-y-3 print:hidden text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="font-bold text-purple-900 flex items-center gap-1.5">
                      <UserCog className="w-4 h-4 text-purple-600" />
                      <span>เครื่องมือปรับแต่งเอกสาร &amp; เลือกแบบฟอร์ม (Document Customizer)</span>
                    </label>
                    <span className="text-[11px] text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full font-semibold">
                      ✍️ ปรับแต่งได้สดๆ และคลิกแก้ไขข้อความบนเอกสารได้ทันที
                    </span>
                  </div>

              {/* Template Selector & Signer Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                {/* Template Selection */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชนิดแบบฟอร์มเอกสาร:
                  </label>
                  <select
                    value={previewTemplate}
                    onChange={(e: any) => setPreviewTemplate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-300 bg-white font-bold text-xs text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm cursor-pointer"
                  >
                    <option value="THAI_STANDARD">📜 รับรองนิสิต (ไทย) + รูปถ่าย (หน้า 2-9)</option>
                    <option value="BANK_LETTER">🏦 ขอความอนุเคราะห์ธนาคาร (หน้า 1)</option>
                    <option value="ENG_CERT">🌐 รับรองภาษาอังกฤษ (TO WHOM) (PDF 2)</option>
                    <option value="INTERNAL_MEMO">📑 บันทึกข้อความราชการ (หน้า 10)</option>
                  </select>
                </div>

                {/* Dropdown Preset */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ตำแหน่งผู้ลงนาม:
                  </label>
                  <select
                    value={selectedSignerPreset}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedSignerPreset(val);
                      const found = activeSignatoriesList.find((p) => p.id === val);
                      if (found) {
                        if (val === 'DEAN') {
                          setCustomSigner({
                            name: settings.signerNameTh || found.name,
                            title: settings.signerTitleTh || found.title,
                          });
                        } else {
                          setCustomSigner({
                            name: found.name,
                            title: found.title,
                          });
                        }
                      }
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white font-medium text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm cursor-pointer"
                  >
                    {activeSignatoriesList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                    <option value="CUSTOM">✍️ กำหนดเอง (พิมพ์ระบุเอง)</option>
                  </select>
                </div>

                {/* Custom Signer Name Input */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชื่อผู้ลงนาม (แก้ไขได้):
                  </label>
                  <input
                    type="text"
                    placeholder="ชื่อผู้ลงนาม"
                    value={customSigner.name}
                    onChange={(e) => {
                      setCustomSigner({ ...customSigner, name: e.target.value });
                      setSelectedSignerPreset('CUSTOM');
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
                  />
                </div>

                {/* Custom Signer Title Input */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ตำแหน่งผู้ลงนาม:
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น รองคณบดีฝ่ายวิชาการ"
                    value={customSigner.title}
                    onChange={(e) => {
                      setCustomSigner({ ...customSigner, title: e.target.value });
                      setSelectedSignerPreset('CUSTOM');
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
                  />
                </div>
              </div>

              {/* Typography & Layout Spacing Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-200/60">
                {/* Font Family Selector (Official Government Fonts) */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm">
                  <Type className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-semibold text-slate-600">ฟอนต์:</span>
                  <select
                    value={docFontFamily}
                    onChange={(e) => setDocFontFamily(e.target.value)}
                    className="bg-transparent font-bold text-purple-900 focus:outline-none cursor-pointer text-xs"
                    title="เลือกฟอนต์หนังสือราชการไทยหรืออังกฤษ"
                  >
                    <optgroup label="🇹🇭 ฟอนต์ราชการไทย">
                      <option value="'Sarabun', 'TH Sarabun New', 'TH Sarabun PSK', sans-serif">
                        TH Sarabun (มาตรฐานหนังสือราชการ)
                      </option>
                      <option value="'Krub', sans-serif">Krub (ราชการทางการ)</option>
                      <option value="'Bai Jamjuree', sans-serif">Bai Jamjuree (ทางการ)</option>
                    </optgroup>
                    <optgroup label="🌐 ฟอนต์สากล / ภาษาอังกฤษ (Official EN)">
                      <option value="'Times New Roman', Times, serif">
                        Times New Roman (มาตรฐานสากล)
                      </option>
                      <option value="'Georgia', serif">Georgia (ทางการ)</option>
                      <option value="'Garamond', serif">Garamond (ทางการคลาสสิก)</option>
                      <option value="'Arial', sans-serif">Arial (สากล Clean)</option>
                    </optgroup>
                  </select>
                </div>

                {/* Font Size (Content & ที่ อว) */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm" title="ขนาดตัวอักษรเนื้อหา และ ที่ อว (ปรับเท่ากัน)">
                  <span className="font-semibold text-slate-600">ขนาดเนื้อหา & ที่ อว:</span>
                  <button
                    type="button"
                    onClick={() => setDocFontSize((s) => Math.max(11, s - 1))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                    title="ลดขนาดตัวอักษรเนื้อหาและที่ อว"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-bold text-purple-800">{docFontSize}pt</span>
                  <button
                    type="button"
                    onClick={() => setDocFontSize((s) => Math.min(24, s + 1))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                    title="เพิ่มขนาดตัวอักษรเนื้อหาและที่ อว"
                  >
                    +
                  </button>
                </div>

                {/* Signer Font Size (สีน้ำเงิน) */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-blue-200 shadow-sm" title="ขนาดตัวอักษรผู้ลงนามและตำแหน่ง (สีน้ำเงิน)">
                  <span className="font-semibold text-blue-700">ขนาดผู้ลงนาม:</span>
                  <button
                    type="button"
                    onClick={() => setSignerFontSize((s) => Math.max(9, s - 1))}
                    className="w-5 h-5 rounded bg-blue-50 hover:bg-blue-100 font-bold text-blue-800 cursor-pointer"
                    title="ลดขนาดตัวอักษรชื่อและตำแหน่งผู้ลงนาม"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-bold text-blue-900">{signerFontSize}pt</span>
                  <button
                    type="button"
                    onClick={() => setSignerFontSize((s) => Math.min(22, s + 1))}
                    className="w-5 h-5 rounded bg-blue-50 hover:bg-blue-100 font-bold text-blue-800 cursor-pointer"
                    title="เพิ่มขนาดตัวอักษรชื่อและตำแหน่งผู้ลงนาม"
                  >
                    +
                  </button>
                </div>

                {/* Line Spacing */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm">
                  <MoveVertical className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-semibold text-slate-600">ระยะบรรทัด:</span>
                  <select
                    value={docLineSpacing}
                    onChange={(e) => setDocLineSpacing(parseFloat(e.target.value))}
                    className="bg-transparent font-bold text-purple-800 focus:outline-none cursor-pointer"
                  >
                    <option value={1.3}>1.3 (แน่น)</option>
                    <option value={1.5}>1.5 (มาตรฐาน)</option>
                    <option value={1.7}>1.7 (โปร่ง)</option>
                    <option value={2.0}>2.0 (กว้าง)</option>
                  </select>
                </div>

                {/* Signature Vertical Offset */}
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm">
                  <span className="font-semibold text-slate-600">ขยับลายเซ็น:</span>
                  <button
                    type="button"
                    onClick={() => setDocSignerOffset((o) => Math.max(0, o - 10))}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
                    title="เลื่อนบล็อกลายเซ็นขึ้น"
                  >
                    ⬆ ขึ้น
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocSignerOffset((o) => Math.min(120, o + 10))}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
                    title="เลื่อนบล็อกลายเซ็นลง"
                  >
                    ⬇ ลง
                  </button>
                </div>

                {/* Header & Title Spacing (เว้นช่องใส่ตรา 1-2 นิ้ว หรือแบบฟอร์มกระดาษราชการ) */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-sky-200 shadow-sm text-xs" title="ปรับระยะห่างความสูงระหว่าง ที่ อว กับ หนังสือรับรอง เพื่อเว้นช่องใส่ตรา 1-2 นิ้ว หรือแบบฟอร์มสำเร็จรูปของหน่วยงาน">
                  <span className="font-semibold text-sky-800">เว้นช่องตรา (ที่ อว ↔ ชื่อเรื่อง):</span>
                  <button
                    type="button"
                    onClick={() => setHeaderTitleSpacing((s) => Math.max(0, s - 10))}
                    className="w-5 h-5 rounded bg-sky-50 hover:bg-sky-100 font-bold text-sky-800 flex items-center justify-center cursor-pointer"
                    title="ลดระยะห่าง (-10px)"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-bold text-sky-900 min-w-16 text-center">
                    {headerTitleSpacing}px {headerTitleSpacing >= 180 ? '(~2 นิ้ว)' : headerTitleSpacing >= 135 ? '(~1.5 นิ้ว)' : headerTitleSpacing >= 90 ? '(~1 นิ้ว)' : headerTitleSpacing === 24 ? '(ปกติ)' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHeaderTitleSpacing((s) => Math.min(260, s + 10))}
                    className="w-5 h-5 rounded bg-sky-50 hover:bg-sky-100 font-bold text-sky-800 flex items-center justify-center cursor-pointer"
                    title="เพิ่มระยะห่าง (+10px)"
                  >
                    +
                  </button>
                  
                  {/* Preset shortcut chips */}
                  <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-200">
                    <button
                      type="button"
                      onClick={() => setHeaderTitleSpacing(24)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        headerTitleSpacing === 24 ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="ระยะมาตรฐาน (24px)"
                    >
                      ปกติ
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeaderTitleSpacing(96)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        headerTitleSpacing === 96 ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="เว้นช่องตรา 1 นิ้ว (96px)"
                    >
                      1 นิ้ว
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeaderTitleSpacing(144)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        headerTitleSpacing === 144 ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="เว้นช่องตรา 1.5 นิ้ว (144px)"
                    >
                      1.5 นิ้ว
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeaderTitleSpacing(192)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        headerTitleSpacing === 192 ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="เว้นช่องตรา 2 นิ้ว (192px)"
                    >
                      2 นิ้ว
                    </button>
                  </div>
                </div>

                {/* Top Margin (เว้นหัวกระดาษแบบฟอร์มหน่วยงาน) */}
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-sky-200 shadow-sm text-xs" title="ขยับ ที่ อว ลงเพื่อเว้นหัวกระดาษที่มีข้อความแบบฟอร์มพิมพ์ไว้แล้ว">
                  <span className="font-semibold text-slate-600">ขยับ ที่ อว ลง:</span>
                  <button
                    type="button"
                    onClick={() => setHeaderTopSpacing((t) => Math.max(0, t - 10))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                    title="ลดระยะหัวกระดาษ (-10px)"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-bold text-slate-800 w-8 text-center">
                    {headerTopSpacing}px
                  </span>
                  <button
                    type="button"
                    onClick={() => setHeaderTopSpacing((t) => Math.min(150, t + 10))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                    title="เพิ่มระยะหัวกระดาษ (+10px)"
                  >
                    +
                  </button>
                </div>

                {/* Photo Box Shift (กรอบรูป เลื่อนขวา/ซ้าย) */}
                {showPhotoBox && (
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-rose-200 shadow-sm" title="ขยับกรอบรูปไปทางขวาหรือซ้าย">
                    <span className="font-semibold text-rose-700">กรอบรูป:</span>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX((x) => Math.max(0, x - 20))}
                      className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 font-bold text-xs text-rose-800 cursor-pointer"
                      title="เลื่อนกรอบรูปไปทางซ้าย"
                    >
                      ◀ ซ้าย
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX(0)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                        photoBoxOffsetX === 0 ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-700'
                      }`}
                      title="ชิดซ้าย"
                    >
                      ชิดซ้าย
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX(100)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                        photoBoxOffsetX === 100 ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-700'
                      }`}
                      title="กึ่งกลาง"
                    >
                      กลาง
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX((x) => Math.min(300, x + 20))}
                      className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 font-bold text-xs text-rose-800 cursor-pointer"
                      title="เลื่อนกรอบรูปไปทางขวา"
                    >
                      ขวา ▶
                    </button>
                    <span className="text-[10px] text-rose-600 font-mono">({photoBoxOffsetX}px)</span>
                  </div>
                )}

                {/* Dots Length (ความยาวจุดไข่ปลา) */}
                {showStudentSign && (
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-amber-200 shadow-sm" title="ปรับความยาวจุดไข่ปลาให้สั้นลงหรือยาวขึ้น">
                    <span className="font-semibold text-amber-800">จุดไข่ปลา:</span>
                    <button
                      type="button"
                      onClick={() => setDotsCount((d) => Math.max(8, d - 4))}
                      className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 font-bold text-xs text-amber-900 cursor-pointer"
                      title="ลดความยาวจุดไข่ปลา (ลบออก)"
                    >
                      - สั้นลง
                    </button>
                    <span className="w-8 text-center font-bold text-amber-900 font-mono text-xs">{dotsCount} จุด</span>
                    <button
                      type="button"
                      onClick={() => setDotsCount((d) => Math.min(55, d + 4))}
                      className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 font-bold text-xs text-amber-900 cursor-pointer"
                      title="เพิ่มความยาวจุดไข่ปลา"
                    >
                      + ยาวขึ้น
                    </button>
                  </div>
                )}

                {/* Student Name Font Size (ขนาดชื่อนิสิต) */}
                {showStudentSign && (
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-indigo-200 shadow-sm" title="ขนาดตัวอักษรชื่อ-นามสกุลนิสิต">
                    <span className="font-semibold text-indigo-700">ขนาดชื่อนิสิต:</span>
                    <button
                      type="button"
                      onClick={() => setStudentSignFontSize((s) => Math.max(9, s - 1))}
                      className="w-5 h-5 rounded bg-indigo-50 hover:bg-indigo-100 font-bold text-indigo-800 cursor-pointer"
                      title="ลดขนาดตัวอักษรชื่อ-นามสกุล"
                    >
                      -
                    </button>
                    <span className="w-7 text-center font-bold text-indigo-900">{studentSignFontSize}pt</span>
                    <button
                      type="button"
                      onClick={() => setStudentSignFontSize((s) => Math.min(24, s + 1))}
                      className="w-5 h-5 rounded bg-indigo-50 hover:bg-indigo-100 font-bold text-indigo-800 cursor-pointer"
                      title="เพิ่มขนาดตัวอักษรชื่อ-นามสกุล"
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Student Signature (Name) Shift */}
                {showStudentSign && (
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm text-xs">
                    <span className="font-semibold text-slate-600">ตำแหน่ง (ชื่อ):</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSignAlign('left');
                        setStudentSignOffsetX(0);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                        studentSignAlign === 'left' && studentSignOffsetX === 0
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="จัดชิดซ้ายของจุดไข่ปลา"
                    >
                      ◀ ซ้าย
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSignAlign('center');
                        setStudentSignOffsetX(0);
                      }}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                        studentSignAlign === 'center' && studentSignOffsetX === 0
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="จัดกึ่งกลางของจุดไข่ปลา"
                    >
                      กึ่งกลาง
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSignAlign('right');
                        setStudentSignOffsetX(0);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                        studentSignAlign === 'right' && studentSignOffsetX === 0
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="จัดชิดขวาของจุดไข่ปลา"
                    >
                      ขวา ▶
                    </button>
                    {/* Fine-tuning offset nudge */}
                    <div className="flex items-center gap-0.5 ml-1 pl-1.5 border-l border-slate-200">
                      <button
                        type="button"
                        onClick={() => setStudentSignOffsetX((x) => x - 5)}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                        title="ขยับละเอียดไปทางซ้าย (-5px)"
                      >
                        -
                      </button>
                      <span className="font-mono text-[10px] text-slate-500 w-8 text-center" title="ระยะขยับละเอียด (px)">
                        {studentSignOffsetX > 0 ? `+${studentSignOffsetX}` : studentSignOffsetX}px
                      </span>
                      <button
                        type="button"
                        onClick={() => setStudentSignOffsetX((x) => x + 5)}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                        title="ขยับละเอียดไปทางขวา (+5px)"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Toggle Elements */}
                <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-xl border border-purple-200 shadow-sm">
                  <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPhotoBox}
                      onChange={(e) => setShowPhotoBox(e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <span>กรอบรูป 1.5 - 2&quot;</span>
                  </label>
                  <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showStudentSign}
                      onChange={(e) => setShowStudentSign(e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <span>ลายเซ็นนิสิต</span>
                  </label>
                  <label className="flex items-center gap-1 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showQrCode}
                      onChange={(e) => setShowQrCode(e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <span>QR Code</span>
                  </label>
                </div>
              </div>

              <div className="text-[11px] text-amber-800 bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span><b>คำแนะนำ:</b> ท่านสามารถใช้เมาส์คลิกที่ข้อความใดๆ ในเอกสารด้านล่างนี้ เพื่อพิมพ์แก้ไขคำ เปลี่ยนชื่อธนาคาร หรือพิมพ์/ลบจุดไข่ปลาได้ทันทีก่อนสั่งพิมพ์หรือดาวน์โหลด PDF</span>
              </div>
            </div>

            {/* Official Paper Letter Canvas Desk Wrapper (Exact A4 210mm x 297mm Layout) */}
            <div className="w-full overflow-x-auto bg-slate-200/60 p-4 sm:p-8 rounded-2xl flex justify-center border border-slate-200">
              <div
                id="printable-certificate"
                style={{
                  fontFamily: docFontFamily,
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '25mm 20mm 15mm 25mm',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                }}
                className="bg-white border border-slate-300 shadow-2xl text-slate-900 shrink-0 print:border-none print:shadow-none print:m-0"
              >
              {/* TEMPLATE 1: BANK_LETTER (หนังสือขอความอนุเคราะห์ธนาคาร หน้า 1) */}
              {previewTemplate === 'BANK_LETTER' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
                    {/* Top Reference */}
                    <div className="flex justify-between items-start pb-2" style={{ fontSize: `${docFontSize}pt` }}>
                      <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                        ที่ อว 8002 / {previewRequest.docNo || '077'}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-right outline-none focus:bg-purple-50">
                        {new Date(previewRequest.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2" style={{ fontSize: `${docFontSize}pt` }}>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        <span className="font-bold">เรื่อง</span> ขอความอนุเคราะห์อัพเดตการใช้ Mobile Banking ให้แก่นิสิต / เปิดบัญชีธนาคาร
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        <span className="font-bold">เจริญพร</span> ผู้จัดการธนาคารกรุงไทย สาขาโลตัส นวนคร
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        <span className="font-bold">สิ่งที่ส่งมาด้วย</span> หนังสือรับรองนิสิต จำนวน 1 ฉบับ
                      </div>
                    </div>

                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="indent-8 outline-none focus:bg-purple-50 pt-2 text-justify"
                      style={{ fontSize: `${docFontSize}pt`, lineHeight: docLineSpacing }}
                    >
                      เนื่องด้วย <strong className="font-bold">{previewRequest.fullName}</strong> สัญชาติ{' '}
                      <strong className="font-bold">{previewRequest.nationality || 'Bangladeshi'}</strong> ประเทศ{' '}
                      <strong className="font-bold">{previewRequest.country || 'Bangladesh'}</strong>{' '}
                      {previewRequest.passportNo && (
                        <>ถือหนังสือเดินทางเลขที่ <strong className="font-mono font-bold">{previewRequest.passportNo}</strong> </>
                      )}
                      รหัสนิสิต <strong className="font-mono font-bold">{previewRequest.studentCode}</strong> เป็นนิสิตหลักสูตร
                      {previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'} (ระดับ{previewRequest.degreeLevel || 'ปริญญาตรี'} หลักสูตร 4 ปี) ชั้นปีที่{' '}
                      {previewRequest.studentCode.substring(0, 2) ? '1' : '1'} สาขาวิชา{previewRequest.major || 'พระพุทธศาสนา'} (ภาคภาษาอังกฤษ)
                      คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย มีความประสงค์จะทำธุรกรรมกับธนาคาร เพื่ออำนวยความสะดวกในการทำธุรกรรมกับมหาวิทยาลัยในระหว่างที่กำลังศึกษาอยู่ในภาควิชาพระพุทธศาสนา คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา
                    </p>

                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="indent-8 outline-none focus:bg-purple-50"
                      style={{ fontSize: `${docFontSize}pt` }}
                    >
                      จึงเจริญพรมาเพื่อให้ความอนุเคราะห์ในเรื่องการเปิดบัญชีหรืออัพเดตการใช้งานแอปพลิเคชั่นของธนาคารแก่นิสิตดังกล่าว จักขอบคุณยิ่ง
                    </p>

                    <div
                      className="pt-6 text-center ml-auto w-72 space-y-1"
                      style={{
                        marginTop: `${docSignerOffset}px`,
                        fontSize: `${signerFontSize}pt`,
                      }}
                    >
                      <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                        ขอเจริญพร
                      </div>
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                        ({customSigner.name || 'พระครูสิริรัตนบัณฑิต, ผศ.ดร.'})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        {customSigner.title || 'รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์'}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-600 outline-none focus:bg-purple-50">
                        {settings.universityNameTh}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer (ชิดล่างสุดของเอกสาร) */}
                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">ติดต่อผู้ประสานงาน:</p>
                      <p>{settings.facultyNameTh ? `สำนักงาน${settings.facultyNameTh}` : 'สำนักงานคณะพุทธศาสตร์'}</p>
                      <p>โทร. {settings.contactPhone || '035-247-8000 ต่อ 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-1">
                      <div contentEditable suppressContentEditableWarning className="text-[11px] font-medium text-slate-700 outline-none focus:bg-purple-50 px-1.5 py-0.5 rounded">
                        ผู้ออกเอกสารหรือปริ้นเอกสาร : <span className="font-bold text-slate-900">{currentUser?.name || 'อาจารย์ไพศาล (ผู้ดูแลระบบ)'}</span>
                      </div>
                      {showQrCode && qrCodeDataUrl && (
                        <img src={qrCodeDataUrl} alt="Verify" className="w-14 h-14 object-contain" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 2: ENG_CERT (TO WHOM IT MAY CONCERN หน้า PDF 2) */}
              {previewTemplate === 'ENG_CERT' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
                    {/* Top Left Office Header - Top Right is clean/empty */}
                    <div
                      className="flex justify-between items-start pb-2 transition-all"
                      style={{
                        marginTop: `${headerTopSpacing}px`,
                        fontSize: `${docFontSize}pt`,
                      }}
                    >
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 space-y-0.5">
                        <p className="font-bold text-slate-900">Office of Dean</p>
                        <p>Tel. {settings.contactPhone || '0-3524-8000 ext. 8323'}</p>
                        <p>Fax. 0-3524-8096</p>
                        <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                        <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                        <p className="font-mono font-bold pt-1 text-slate-900">
                          MCU No. 8002 / {previewRequest.docNo || '166'}
                        </p>
                      </div>
                      <div></div>
                    </div>

                    {/* Centered Title with customizable vertical spacing */}
                    <div
                      className="pb-2 text-center transition-all"
                      style={{ paddingTop: `${headerTitleSpacing}px` }}
                    >
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        className="font-bold tracking-wider outline-none focus:bg-purple-50"
                        style={{ fontSize: `${Math.round(docFontSize * 1.5)}pt` }}
                      >
                        TO WHOM IT MAY CONCERN
                      </span>
                    </div>

                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="indent-8 outline-none focus:bg-purple-50 pt-2 leading-relaxed text-justify"
                      style={{ fontSize: `${docFontSize}pt`, lineHeight: docLineSpacing }}
                    >
                      This is to certify that <strong className="font-bold">{previewRequest.fullName}</strong>, whose age is{' '}
                      <strong className="font-bold">{previewRequest.age || '29'}</strong> years old,{' '}
                      <strong className="font-bold">{previewRequest.nationality || 'Myanmar'}</strong> Nationality, holding Passport No.{' '}
                      <strong className="font-mono font-bold">{previewRequest.passportNo || 'MF772427'}</strong>, is currently enrolled as a student of the Faculty of Buddhism, Mahachulalongkornrajavidyalaya University, Lamsai Sub-District, Wangnoi District, Phra Nakhon Si Ayutthaya Province, 13170, Thailand. He/She is studying in the {previewRequest.degreeLevel || 'Bachelor of Arts Program (4-Year Undergraduate Program)'}, Major in {previewRequest.major || 'Religion and Philosophy (English Program)'}, Year 4, in the second semester of an Academic Year 2026, His/Her student identification is <strong className="font-mono font-bold">{previewRequest.studentCode}</strong>.
                    </p>

                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="indent-8 outline-none focus:bg-purple-50"
                      style={{ fontSize: `${docFontSize}pt` }}
                    >
                      This letter of certification is therefore issued as evidence.
                    </p>

                    <div
                      contentEditable
                      suppressContentEditableWarning
                      className="text-center pt-2 outline-none focus:bg-purple-50"
                      style={{ fontSize: `${docFontSize}pt` }}
                    >
                      Issued on {new Date(previewRequest.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>

                    {/* 1. Dean / Authorized Signer Block: ABOVE the photo box, on the right (Adjustable font size) */}
                    <div
                      className="pt-6 ml-auto w-80 text-center space-y-1"
                      style={{
                        marginTop: `${docSignerOffset}px`,
                        fontSize: `${signerFontSize}pt`,
                      }}
                    >
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold text-slate-900 outline-none focus:bg-purple-50">
                        ({customSigner.name ? customSigner.name : 'Asst. Prof. Phrakhru Sirirattanabundit, Ph.D.'})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-800 font-medium outline-none focus:bg-purple-50">
                        {customSigner.title ? customSigner.title : 'Vice Dean, Faculty of Buddhism'}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-600 outline-none focus:bg-purple-50">
                        Mahachulalongkornrajavidyalaya University
                      </div>
                    </div>

                    {/* 2. Photo Box & Student Signature: BELOW Dean signature, on the left */}
                    <div className="pt-2 flex items-end justify-between">
                      <div className="space-y-3">
                        {showPhotoBox && (
                          <div
                            className="w-28 h-36 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs p-2 text-center bg-slate-50/20 transition-transform"
                            style={{ transform: `translateX(${photoBoxOffsetX}px)` }}
                          >
                            <span>ติดรูปถ่าย<br />Photo 1.5 - 2&quot;</span>
                          </div>
                        )}
                        {showStudentSign && (
                          <div className="pt-1 inline-flex flex-col">
                            <div className="flex items-baseline gap-1 text-slate-800" style={{ fontSize: `${Math.max(11, docFontSize - 2)}pt` }}>
                              <span className="shrink-0 font-medium">Signature</span>
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                className="tracking-wider font-mono outline-none focus:bg-purple-50 select-text"
                                title="คลิกเพื่อลบหรือพิมพ์จุดไข่ปลาได้อิสระ"
                              >
                                {'.'.repeat(dotsCount)}
                              </span>
                            </div>
                            <div
                              className="w-full flex"
                              style={{
                                justifyContent:
                                  studentSignAlign === 'left'
                                    ? 'flex-start'
                                    : studentSignAlign === 'right'
                                    ? 'flex-end'
                                    : 'center',
                              }}
                            >
                              <div
                                style={{
                                  transform: `translateX(${studentSignOffsetX}px)`,
                                  fontSize: `${studentSignFontSize}pt`,
                                  whiteSpace: 'nowrap',
                                }}
                                className="mt-1 font-bold text-slate-900 transition-all outline-none focus:bg-purple-50 whitespace-nowrap cursor-text"
                                contentEditable
                                suppressContentEditableWarning
                                title="คลิกเพื่อแก้ไขชื่อ-นามสกุลได้โดยตรง"
                              >
                                ({previewRequest.fullName})
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Bottom Footer (ชิดล่างสุดของเอกสาร) */}
                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">{settings.facultyNameEn ? `Faculty of ${settings.facultyNameEn.replace(/^Faculty of /i, '')}` : 'Faculty of Buddhism'}</p>
                      <p>Tel. {settings.contactPhone ? `+66 ${settings.contactPhone.replace(/^0/, '')}` : '+66 35 248 000 ext. 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-1">
                      <div contentEditable suppressContentEditableWarning className="text-[11px] font-medium text-slate-700 outline-none focus:bg-purple-50 px-1.5 py-0.5 rounded">
                        ผู้ออกเอกสารหรือปริ้นเอกสาร : <span className="font-bold text-slate-900">{currentUser?.name || 'Academic Officer'}</span>
                      </div>
                      {showQrCode && qrCodeDataUrl && (
                        <img src={qrCodeDataUrl} alt="QR" className="w-14 h-14 object-contain" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 3: INTERNAL_MEMO (บันทึกข้อความราชการ หน้า 10) */}
              {previewTemplate === 'INTERNAL_MEMO' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
                    {/* Garuda Crest & Heading */}
                    <div className="flex items-center gap-4 border-b pb-3">
                      <div className="w-14 h-14 rounded-full bg-slate-50 border flex items-center justify-center p-1 overflow-hidden shrink-0">
                        <span className="text-3xl">🦅</span>
                      </div>
                      <div className="text-center flex-1">
                        <h2 className="text-2xl font-black tracking-wide">บันทึกข้อความ</h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-b pb-3 pt-2">
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        <span className="font-bold">ส่วนงาน:</span> {settings.facultyNameTh} {settings.universityNameTh} โทร. {settings.contactPhone}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-right outline-none focus:bg-purple-50">
                        <span className="font-bold">วันที่:</span> {new Date(previewRequest.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        <span className="font-bold">ที่:</span> อว 8002 / {previewRequest.docNo || 'xxx'}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        <span className="font-bold">เรื่อง:</span> ขอความอนุเคราะห์ออกหนังสือรับรองให้แก่นิสิต
                      </div>
                    </div>

                    <div contentEditable suppressContentEditableWarning className="font-bold text-xs pt-1 outline-none focus:bg-purple-50">
                      เรียน ผู้อำนวยการกองกิจการนิสิต / คณบดีคณะพุทธศาสตร์
                    </div>

                    <p contentEditable suppressContentEditableWarning className="indent-8 outline-none focus:bg-purple-50 pt-2 leading-relaxed">
                      ด้วย <strong className="font-bold">{previewRequest.fullName}</strong> รหัสนิสิต <strong className="font-mono font-bold">{previewRequest.studentCode}</strong> อายุ {previewRequest.age || '-'} ปี สัญชาติ {previewRequest.nationality || '-'} {previewRequest.passportNo && <>ถือหนังสือเดินทางเลขที่ {previewRequest.passportNo}</>} เป็นนิสิตคณะพุทธศาสตร์ หลักสูตร{previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'} สาขาวิชา{previewRequest.major || 'พระพุทธศาสนา'} ได้ยื่นคำร้องเพื่อขอรับรอง{previewRequest.requestPurpose || previewRequest.certType}
                    </p>

                    <p contentEditable suppressContentEditableWarning className="indent-8 outline-none focus:bg-purple-50">
                      ในการนี้ คณะพุทธศาสตร์ จึงขอความอนุเคราะห์ในการออกหนังสือรับรองให้แก่นิสิตดังกล่าว เพื่อเป็นเอกสารประกอบการดำเนินการต่อไป
                    </p>

                    <p contentEditable suppressContentEditableWarning className="indent-8 outline-none focus:bg-purple-50">
                      จึงเรียนมาเพื่อโปรดทราบและดำเนินการต่อไป
                    </p>

                    <div
                      className="pt-6 text-center ml-auto w-72 space-y-1"
                      style={{
                        marginTop: `${docSignerOffset}px`,
                        fontSize: `${signerFontSize}pt`,
                      }}
                    >
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                        ({customSigner.name || 'พระครูสิริรัตนบัณฑิต, ผศ.ดร.'})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        {customSigner.title || 'รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์'}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer */}
                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">{settings.facultyNameTh ? `สำนักงาน${settings.facultyNameTh}` : 'สำนักงานคณะพุทธศาสตร์'}</p>
                      <p>โทรศัพท์ {settings.contactPhone || '035-247-8000 ต่อ 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-1">
                      <div contentEditable suppressContentEditableWarning className="text-[11px] font-medium text-slate-700 outline-none focus:bg-purple-50 px-1.5 py-0.5 rounded">
                        ผู้ออกเอกสารหรือปริ้นเอกสาร : <span className="font-bold text-slate-900">{currentUser?.name || 'อาจารย์ไพศาล (ผู้ดูแลระบบ)'}</span>
                      </div>
                      {showQrCode && qrCodeDataUrl && (
                        <img src={qrCodeDataUrl} alt="QR Code" className="w-14 h-14 object-contain" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 4: THAI_STANDARD (หนังสือรับรองนิสิตมาตรฐานภาษาไทย หน้า 2-9) */}
              {previewTemplate === 'THAI_STANDARD' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header Reference: ที่ อว 8002 / docNo with same docFontSize */}
                    <div
                      className="flex justify-between items-start pb-2 transition-all"
                      style={{
                        marginTop: `${headerTopSpacing}px`,
                        fontSize: `${docFontSize}pt`,
                      }}
                    >
                      <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                        ที่ อว 8002 / {previewRequest.docNo || 'xxx'}
                      </div>
                      {/* Top right removed as requested */}
                      <div></div>
                    </div>

                    {/* Title with customizable vertical spacing (เว้นช่องใส่ตรา 1-2 นิ้ว หรือแบบฟอร์มสำเร็จรูป) */}
                    <div
                      className="pb-2 text-center transition-all"
                      style={{ paddingTop: `${headerTitleSpacing}px` }}
                    >
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        className="font-bold tracking-wide outline-none focus:bg-purple-50"
                        style={{ fontSize: `${Math.round(docFontSize * 1.5)}pt` }}
                      >
                        หนังสือรับรอง
                      </span>
                    </div>

                    {/* Body Paragraph: Font size matches ที่ อว, text-justify */}
                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="indent-10 leading-relaxed outline-none focus:bg-purple-50 pt-2 text-justify"
                      style={{ fontSize: `${docFontSize}pt`, lineHeight: docLineSpacing }}
                    >
                      โดยหนังสือนี้ขอรับรองว่า <strong className="font-bold">{previewRequest.fullName}</strong>{' '}
                      {previewRequest.age && <>อายุ <strong className="font-bold">{previewRequest.age}</strong> ปี </>}
                      สัญชาติ <strong className="font-bold">{previewRequest.nationality || 'ไทย'}</strong>{' '}
                      {previewRequest.country && previewRequest.country !== 'Thailand' && (
                        <>ประเทศ <strong className="font-bold">{previewRequest.country}</strong> </>
                      )}
                      {previewRequest.passportNo && (
                        <>ถือหนังสือเดินทางเลขที่ <strong className="font-mono font-bold">{previewRequest.passportNo}</strong> และวีซ่าประเภท {previewRequest.visaType || 'คนอยู่ชั่วคราว (Non-Immigrant Visa)'} </>
                      )}
                      เป็นนิสิตคณะพุทธศาสตร์ หลักสูตร{previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'}{' '}
                      (ระดับ{previewRequest.degreeLevel || 'ปริญญาตรี'} หลักสูตร 4 ปี) ชั้นปีที่{' '}
                      {previewRequest.studentCode.substring(0, 2) ? '2' : '1'} สาขาวิชา {previewRequest.major || 'พระพุทธศาสนา'}{' '}
                      ({previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai' ? 'ภาคภาษาไทย' : 'ภาคภาษาอังกฤษ'}) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย รหัสประจำตัวนิสิต{' '}
                      <strong className="font-mono font-bold">{previewRequest.studentCode}</strong> เพื่อเป็นหลักฐาน สำหรับ
                      <strong className="font-bold underline ml-1">{previewRequest.requestPurpose || previewRequest.certType}</strong> จึงออกหนังสือนี้ไว้เป็นสำคัญ
                    </p>

                    <div
                      contentEditable
                      suppressContentEditableWarning
                      className="text-center pt-2 outline-none focus:bg-purple-50"
                      style={{ fontSize: `${docFontSize}pt` }}
                    >
                      ให้ไว้ ณ วันที่ {new Date(previewRequest.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>

                    {/* 1. Dean / Authorized Signer Block: ABOVE THE PHOTO BOX (ขนาดปรับได้ สีน้ำเงิน) */}
                    <div
                      className="pt-6 ml-auto w-80 text-center space-y-1.5"
                      style={{
                        marginTop: `${docSignerOffset}px`,
                        fontSize: `${signerFontSize}pt`,
                      }}
                    >
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold text-slate-900 outline-none focus:bg-purple-50">
                        ({customSigner.name || 'พระครูสิริรัตนบัณฑิต, ผศ.ดร.'})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-800 font-medium outline-none focus:bg-purple-50">
                        {customSigner.title || 'รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์'}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-600 outline-none focus:bg-purple-50">
                        {settings.facultyNameTh} {settings.universityNameTh}
                      </div>
                    </div>

                    {/* 2. Student Photo Box & Student Signature Block: BELOW DEAN SIGNATURE */}
                    <div className="pt-2 flex items-end justify-between">
                      <div className="space-y-3">
                        {showPhotoBox && (
                          <div
                            className="w-28 h-36 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs p-2 text-center bg-slate-50/20 shadow-sm transition-transform"
                            style={{ transform: `translateX(${photoBoxOffsetX}px)` }}
                          >
                            <span>ติดรูปถ่าย<br />1.5 - 2 นิ้ว</span>
                          </div>
                        )}
                        {showStudentSign && (
                          <div className="pt-1 inline-flex flex-col">
                            <div className="flex items-baseline gap-1 text-slate-800" style={{ fontSize: `${Math.max(11, docFontSize - 2)}pt` }}>
                              <span className="shrink-0 font-medium">ลงชื่อ</span>
                              <span
                                contentEditable
                                suppressContentEditableWarning
                                className="tracking-wider font-mono outline-none focus:bg-purple-50 select-text"
                                title="คลิกเพื่อลบหรือพิมพ์จุดไข่ปลาได้อิสระ"
                              >
                                {'.'.repeat(dotsCount)}
                              </span>
                            </div>
                            {/* (ชื่อ-นามสกุล): จัดกึ่งกลาง ชิดซ้าย หรือชิดขวาได้อัตโนมัติ พร้อมปุ่มขยับละเอียด */}
                            <div
                              className="w-full flex"
                              style={{
                                justifyContent:
                                  studentSignAlign === 'left'
                                    ? 'flex-start'
                                    : studentSignAlign === 'right'
                                    ? 'flex-end'
                                    : 'center',
                              }}
                            >
                              <div
                                style={{
                                  transform: `translateX(${studentSignOffsetX}px)`,
                                  fontSize: `${studentSignFontSize}pt`,
                                  whiteSpace: 'nowrap',
                                }}
                                className="mt-1 font-bold text-slate-900 transition-all outline-none focus:bg-purple-50 whitespace-nowrap cursor-text"
                                contentEditable
                                suppressContentEditableWarning
                                title="คลิกเพื่อแก้ไขชื่อ-นามสกุลได้โดยตรง"
                              >
                                ({previewRequest.fullName})
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Footer (ภาพที่ 2 และ 3): ชิดล่างสุดของเอกสาร */}
                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    {/* ภาพที่ 2: ข้อมูลติดต่อสำนักงาน (แก้ไขข้อความได้สด) */}
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">{settings.facultyNameTh ? `สำนักงาน${settings.facultyNameTh}` : 'สำนักงานคณะพุทธศาสตร์'}</p>
                      <p>โทรศัพท์ {settings.contactPhone || '035-247-8000 ต่อ 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>

                    {/* ภาพที่ 3: ผู้ออกเอกสาร/ปริ้นเอกสาร + QR Code */}
                    <div className="flex flex-col items-center text-center space-y-1">
                      <div contentEditable suppressContentEditableWarning className="text-[11px] font-medium text-slate-700 outline-none focus:bg-purple-50 px-1.5 py-0.5 rounded">
                        ผู้ออกเอกสารหรือปริ้นเอกสาร : <span className="font-bold text-slate-900">{currentUser?.name || 'อาจารย์ไพศาล (ผู้ดูแลระบบ)'}</span>
                      </div>
                      {showQrCode && qrCodeDataUrl && (
                        <img src={qrCodeDataUrl} alt="QR Code" className="w-14 h-14 object-contain" />
                      )}
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
              <Link
                href={`/verify?docNo=${encodeURIComponent(previewRequest.docNo || previewRequest.id)}`}
                target="_blank"
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
              >
                <ExternalLink className="w-4 h-4 text-purple-600" />
                <span>ตรวจสอบความถูกต้อง (Verify View)</span>
              </Link>

              <div className="flex items-center gap-2">
                {/* Direct PDF Download Button */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={pdfDownloading}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition disabled:opacity-50"
                  title="ดาวน์โหลดเป็นไฟล์ PDF คุณภาพสูงลงเครื่องทันที"
                >
                  <Download className="w-4 h-4" />
                  <span>{pdfDownloading ? 'กำลังสร้างไฟล์ PDF...' : 'ดาวน์โหลดไฟล์ PDF (Download)'}</span>
                </button>

                {/* Print Button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์เอกสาร (Print)</span>
                </button>
              </div>
            </div>

            {/* Print Stylesheet for exact A4 paper formatting */}
            <style jsx global>{`
              @page {
                size: A4 portrait;
                margin: 0;
              }
              @media print {
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                }
                body * {
                  visibility: hidden !important;
                }
                #printable-certificate, #printable-certificate * {
                  visibility: visible !important;
                }
                #printable-certificate {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  min-height: 297mm !important;
                  max-height: 297mm !important;
                  padding: 25mm 20mm 15mm 25mm !important;
                  margin: 0 !important;
                  background: #ffffff !important;
                  border: none !important;
                  box-shadow: none !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  overflow: hidden !important;
                }
              }
            `}</style>
            </>
          )}
          </div>
        </div>
      )}

      <CertRejectModal
        rejectingRequest={rejectingRequest}
        rejectReasonInput={rejectReasonInput}
        setRejectReasonInput={setRejectReasonInput}
        rejectSubmitting={rejectSubmitting}
        onClose={() => setRejectingRequest(null)}
        onConfirm={handleConfirmReject}
      />

      {/* ─────────────────────────────────────────────────────────────
          MODAL: LIGHTBOX ZOOM
         ───────────────────────────────────────────────────────────── */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl p-2 overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-900 flex items-center justify-center font-bold text-sm shadow-md cursor-pointer"
            >
              ✕
            </button>
            <img
              src={zoomImage}
              alt="ภาพขยายเอกสารแนบ"
              className="max-h-[85vh] max-w-full object-contain mx-auto rounded-lg"
            />
          </div>
        </div>
      )}

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
        getCoursesForInstructor={getCoursesForInstructor}
        onCopyLineMessage={handleCopyLineTeachingMessage}
        onClose={() => setTeachingSlipUser(null)}
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
