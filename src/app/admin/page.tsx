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
      const stored = localStorage.getItem('mcu_current_user');
      if (stored) setCurrentUser(JSON.parse(stored));

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
    localStorage.removeItem('mcu_current_user');
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
            <div className="space-y-6">
              {/* Welcome Identity Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
                    <ShieldCheck className="w-4 h-4" />
                    แผงควบคุมหลัก • ระบบบริหารงานวิชาการและทะเบียน
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black">
                    ยินดีต้อนรับสู่ส่วนจัดการหลังบ้าน (Admin Backend)
                  </h1>
                  <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                    ศูนย์กลางควบคุมการออกหนังสือรับรอง, ทะเบียนนิสิต ภาคภาษาไทยและภาษาอังกฤษ, จัดการรายวิชาตารางสอน และตั้งค่าโลโก้ตราสถาบัน
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab('BRANDING')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20"
                  >
                    <Palette className="w-4 h-4 text-pink-400" />
                    <span>ปรับแต่งโลโก้ & ข้อความ</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('USERS')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-600/30"
                  >
                    <UserCog className="w-4 h-4" />
                    <span>จัดการผู้ใช้และบทบาท</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  onClick={() => {
                    setActiveTab('CERTIFICATES');
                    setStatusFilter('PENDING');
                  }}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-amber-400 cursor-pointer transition space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-amber-700">
                    <span>คำร้องรออนุมัติ</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-3xl font-extrabold text-amber-900">{pendingRequests.length}</div>
                  <div className="text-[11px] text-amber-600 font-medium">คลิกเพื่อพิจารณาออกเลขที่</div>
                </div>

                <div
                  onClick={() => {
                    setActiveTab('CERTIFICATES');
                    setStatusFilter('APPROVED');
                  }}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-400 cursor-pointer transition space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                    <span>อนุมัติแล้ว</span>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-900">{approvedRequests.length}</div>
                  <div className="text-[11px] text-emerald-600 font-medium">ออกเลขที่และพร้อมพิมพ์</div>
                </div>

                <div
                  onClick={() => setActiveTab('STUDENTS')}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-orange-400 cursor-pointer transition space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-orange-700">
                    <span>นิสิตในระบบ</span>
                    <Users className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">{studentsCount.total}</div>
                  <div className="text-[11px] text-slate-500">
                    🇹🇭 {studentsCount.thai} • 🌐 {studentsCount.intl} รูป/คน
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('COURSES')}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-400 cursor-pointer transition space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-blue-700">
                    <span>รายวิชาที่เปิดสอน</span>
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">{coursesCount}</div>
                  <div className="text-[11px] text-slate-500">ภาคไทย & ภาษาอังกฤษ</div>
                </div>
              </div>

              {/* Quick Actions & Recent Pending Requests */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      คำร้องขอหนังสือรับรองล่าสุดที่รออนุมัติ ({pendingRequests.length})
                    </h3>
                    <button
                      onClick={() => setActiveTab('CERTIFICATES')}
                      className="text-xs font-bold text-purple-600 hover:text-purple-800"
                    >
                      ดูทั้งหมด →
                    </button>
                  </div>

                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      ไม่มีคำร้องที่รอการอนุมัติในขณะนี้
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {pendingRequests.slice(0, 5).map((r) => (
                        <div
                          key={r.id}
                          className="py-3 flex items-center justify-between gap-4 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2 font-bold text-slate-800">
                              <span className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                                {r.studentCode}
                              </span>
                              <span>{r.fullName}</span>
                            </div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              {r.certType} • ยื่นเมื่อ {new Date(r.createdAt).toLocaleDateString('th-TH')}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setActiveTab('CERTIFICATES');
                              setApprovingId(r.id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                          >
                            อนุมัติทันที
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Navigation Panels */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-3">
                  <h3 className="font-bold text-slate-800 text-sm border-b pb-3 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-orange-600" />
                    เมนูการจัดการด่วน (Quick Links)
                  </h3>
                  <div className="space-y-2 text-xs">
                    <button
                      onClick={() => setActiveTab('BRANDING')}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-pink-50 text-slate-700 hover:text-pink-900 border border-slate-200/80 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold">เปลี่ยนโลโก้ & ข้อมูลมหาวิทยาลัย</div>
                        <div className="text-[11px] text-slate-400">ชื่อคณะ, ผู้ลงนาม, เบอร์ติดต่อ</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => setActiveTab('USERS')}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200/80 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold">จัดการผู้ใช้งาน & กำหนดบทบาท</div>
                        <div className="text-[11px] text-slate-400">Admin, เจ้าหน้าที่, อาจารย์ ({users.length} ท่าน)</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <Link
                      href="/students"
                      className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-900 border border-slate-200/80 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold">นำเข้า/ส่งออก ทะเบียนนิสิตเป็นชุด</div>
                        <div className="text-[11px] text-slate-400">Import/Export Excel, สถานภาพย้ายเข้า</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>

                    <button
                      onClick={() => setActiveTab('SHEETS')}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200/80 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold">สถานะการเชื่อมต่อ Google Sheets</div>
                        <div className="text-[11px] text-slate-400">ตรวจเช็คความพร้อมและซิงค์ชีต</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <Link
                      href="/verify"
                      target="_blank"
                      className="w-full text-left p-3 rounded-xl bg-purple-50/80 hover:bg-purple-100 text-purple-900 border border-purple-200 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span>ระบบตรวจเอกสาร ตม. (/verify)</span>
                        </div>
                        <div className="text-[11px] text-purple-600">สแกน QR Code ตรวจสอบความถูกต้องกับสารบบ มจร.</div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-purple-500" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Best Practice: Security & Data Retention Policy Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-sm">
                      แนวทางปฏิบัติที่ดีที่สุด: มาตรการความมั่นคงปลอดภัยข้อมูลและการจัดเก็บสารบรรณ (Best Practice)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    PDPA & Thai Gov Archives Compliant
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>1. ปกปิดข้อมูล (Data Masking)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      หน้าสาธารณะซ่อนเลข Passport บางหลักอัตโนมัติ ป้องกันการคัดลอกข้อมูลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล
                    </p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                    <div className="font-bold text-sky-300 flex items-center gap-1">
                      <UserCog className="w-3.5 h-3.5" />
                      <span>2. จำกัดสิทธิ์ (Access Control)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      เฉพาะ Admin และเจ้าหน้าที่ทะเบียนที่มีสิทธิ์เท่านั้น ที่สามารถเปิดดูเลขหนังสือเดินทางฉบับเต็มได้
                    </p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                    <div className="font-bold text-emerald-300 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5" />
                      <span>3. ตรวจสอบด้วย QR สำหรับ ตม.</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      เอกสารทุกใบพิมพ์ QR Code ให้เจ้าหน้าที่ ตม. / สถานทูต สแกนเทียบกับเล่มพาสปอร์ตตัวจริงได้ทันที
                    </p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                    <div className="font-bold text-purple-300 flex items-center gap-1">
                      <Archive className="w-3.5 h-3.5" />
                      <span>4. อายุการจัดเก็บ 5 ปี (Retention)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      เก็บรักษาข้อมูลตลอดการศึกษา และสำรองประวัติต่ออีก 5 ปีตามระเบียบงานสารบรรณสำนักนายกฯ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB B: CERTIFICATES MANAGEMENT
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'CERTIFICATES' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      งานอนุมัติคำร้องหนังสือรับรอง (Certificate Approvals)
                    </h2>
                    <p className="text-xs text-slate-500">
                      พิจารณาคำร้อง ออกเลขที่ อว 8002/xxx และสั่งพิมพ์หนังสือรับรอง
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Year Selector */}
                    <div className="flex items-center gap-1 p-1 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold">
                      <span className="text-purple-700 pl-2 pr-1 font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" /> ปี พ.ศ.:
                      </span>
                      <button
                        onClick={() => setFilterYear('ALL')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          filterYear === 'ALL'
                            ? 'bg-purple-700 text-white shadow-sm'
                            : 'text-purple-700 hover:bg-purple-100'
                        }`}
                      >
                        ทั้งหมด
                      </button>
                      {availableYears.map((yr) => (
                        <button
                          key={yr}
                          onClick={() => setFilterYear(yr)}
                          className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                            filterYear === yr
                              ? 'bg-purple-700 text-white shadow-sm'
                              : 'text-purple-700 hover:bg-purple-100'
                          }`}
                        >
                          ปี {yr}
                        </button>
                      ))}

                      {/* Academic Year Archiving Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setArchivingYear(filterYear === 'ALL' ? '2569' : filterYear);
                          setIsArchiveModalOpen(true);
                          fetch('/api/archives')
                            .then((r) => r.json())
                            .then((d) => d.success && setAcademicArchives(d.data));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 transition font-bold flex items-center gap-1 cursor-pointer"
                        title="สรุปสถิติและปิดยอดจัดเก็บประวัติแยกปีการศึกษา"
                      >
                        <Archive className="w-3.5 h-3.5 text-purple-600" />
                        <span>ปิดยอดปีการศึกษา</span>
                      </button>
                    </div>

                    {/* Status filter */}
                    <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
                      <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-3 py-1 rounded-lg transition ${
                          statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        ทั้งหมด
                      </button>
                      <button
                        onClick={() => setStatusFilter('PENDING')}
                        className={`px-3 py-1 rounded-lg transition ${
                          statusFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-700'
                        }`}
                      >
                        รอตรวจ ({pendingRequests.length})
                      </button>
                      <button
                        onClick={() => setStatusFilter('APPROVED')}
                        className={`px-3 py-1 rounded-lg transition ${
                          statusFilter === 'APPROVED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700'
                        }`}
                      >
                        อนุมัติ ({approvedRequests.length})
                      </button>
                      <button
                        onClick={() => setStatusFilter('REJECTED')}
                        className={`px-3 py-1 rounded-lg transition ${
                          statusFilter === 'REJECTED' ? 'bg-red-600 text-white shadow-sm' : 'text-red-700'
                        }`}
                      >
                        ปฏิเสธ ({rejectedRequests.length})
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาด้วยรหัสนิสิต, ชื่อ-สกุล หรือเลขที่หนังสือ..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setUnmaskPassport(!unmaskPassport)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer ${
                      unmaskPassport
                        ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title="เปิด/ปิดการปกปิดเลขหนังสือเดินทางตามนโยบาย PDPA (Data Protection)"
                  >
                    {unmaskPassport ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{unmaskPassport ? 'แสดงเลขเต็ม (Officer Mode)' : '🔒 ซ่อนเลข Passport (PDPA Mask)'}</span>
                  </button>
                  <Link
                    href="/verify"
                    target="_blank"
                    className="px-3 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0"
                    title="เปิดหน้าระบบตรวจสอบเอกสารสำหรับ ตม. และสถานทูต"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>ระบบตรวจเอกสาร ตม. (/verify)</span>
                  </Link>
                </div>
              </div>

              {/* Requests Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
                      <tr>
                        <th className="px-5 py-3.5">วันที่ยื่น</th>
                        <th className="px-5 py-3.5">รหัสนิสิต</th>
                        <th className="px-5 py-3.5">ชื่อ - นามสกุล</th>
                        <th className="px-5 py-3.5">ประเภทหนังสือรับรอง</th>
                        <th className="px-5 py-3.5">เลขที่หนังสือราชการ</th>
                        <th className="px-5 py-3.5 text-center">สถานะ</th>
                        <th className="px-5 py-3.5 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRequests.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                            ไม่พบรายการคำร้องตามเงื่อนไขที่เลือก
                          </td>
                        </tr>
                      ) : (
                        filteredRequests.map((r) => {
                          const isApprovingThis = approvingId === r.id;

                          return (
                            <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                                {new Date(r.createdAt).toLocaleDateString('th-TH')}
                              </td>
                              <td className="px-5 py-4 font-mono font-bold text-purple-700">
                                {r.studentCode}
                              </td>
                              <td className="px-5 py-4 font-medium text-slate-900">
                                <div>{r.fullName}</div>
                                <div className="text-[11px] text-slate-400">
                                  {r.nationality === 'ไทย' || r.nationality === 'Thai'
                                    ? '🇹🇭 สัญชาติไทย'
                                    : `🌐 สัญชาติ ${r.nationality || 'ต่างชาติ'} (Pass: ${formatPassport(r.passportNo)})`}
                                </div>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  {r.enrollmentSlipUrl ? (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="มีสำเนาการลงทะเบียนเรียนแนบมาแล้ว">
                                      <FileCheck2 className="w-3 h-3 text-emerald-600" /> สำเนาลงเรียน ✓
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="ยังไม่มีสำเนาการลงทะเบียนเรียน">
                                      ⚠️ ขาดสำเนาลงเรียน
                                    </span>
                                  )}
                                  {r.passportCopyUrl && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                                      <Paperclip className="w-2.5 h-2.5" /> สำเนาพาสปอร์ต
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                                {r.certType}
                              </td>
                              <td className="px-5 py-4 text-xs font-mono">
                                {r.docNo ? (
                                  <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                                    อว 8002/{r.docNo}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">ยังไม่ออกเลข</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    r.status === 'APPROVED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : r.status === 'REJECTED'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {r.status === 'APPROVED'
                                    ? 'อนุมัติแล้ว'
                                    : r.status === 'REJECTED'
                                    ? 'ปฏิเสธ'
                                    : 'รอพิจารณา'}
                                </span>
                                {r.status === 'REJECTED' && r.rejectReason && (
                                  <div className="text-[10px] text-red-600 mt-1 max-w-[150px] truncate mx-auto font-medium" title={`เหตุผล: ${r.rejectReason}`}>
                                    ⚠️ {r.rejectReason}
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                {isApprovingThis ? (
                                  <div className="flex items-center justify-end gap-1.5 animate-in fade-in">
                                    <input
                                      type="text"
                                      placeholder="001/2569"
                                      value={docNoInput}
                                      onChange={(e) => setDocNoInput(e.target.value)}
                                      className="w-24 px-2 py-1 text-xs border border-purple-300 rounded font-mono"
                                    />
                                    <button
                                      onClick={() => handleApprove(r.id)}
                                      className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-bold"
                                    >
                                      ยืนยัน
                                    </button>
                                    <button
                                      onClick={() => setApprovingId(null)}
                                      className="px-2 py-1 rounded bg-slate-200 text-slate-600 text-xs"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                                    {r.status === 'PENDING' && (
                                      <button
                                        onClick={() => setApprovingId(r.id)}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer"
                                      >
                                        อนุมัติ
                                      </button>
                                    )}
                                    {r.status === 'PENDING' && (
                                      <button
                                        onClick={() => handleOpenRejectModal(r)}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                        title="ปฏิเสธคำร้องพร้อมระบุเหตุผล"
                                      >
                                        ปฏิเสธ
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setPreviewRequest(r);
                                        setPreviewTab('ATTACHMENTS');
                                      }}
                                      className={`px-2 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer border ${
                                        r.enrollmentSlipUrl
                                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 font-bold'
                                          : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                      }`}
                                      title="ตรวจเอกสารแนบ เช่น สำเนาลงเรียน, พาสปอร์ต"
                                    >
                                      <Paperclip className="w-3.5 h-3.5" />
                                      <span>ตรวจเอกสาร</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setPreviewRequest(r);
                                        setPreviewTab('DOCUMENT');
                                      }}
                                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>พิมพ์/ดู</span>
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB C: USER & ROLE MANAGEMENT (ผู้ใช้และบทบาท)
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'USERS' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-sky-600" />
                    จัดการผู้ใช้งานและกำหนดบทบาท (Users & Roles Management)
                  </h2>
                  <p className="text-xs text-slate-500">
                    กำหนดสิทธิ์การใช้งานระบบ เช่น ผู้ดูแลระบบ (ADMIN), เจ้าหน้าที่ทะเบียน (OFFICER), และอาจารย์ผู้สอน (INSTRUCTOR)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleScanTimetables}
                    disabled={isScanningInstructors}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                    title="สแกนตารางสอนและเตรียมสร้างไอดีสำหรับอาจารย์ใหม่ที่ยังไม่มีบัญชี"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanningInstructors ? 'animate-spin' : ''}`} />
                    <span>🔄 ซิงค์และสร้างไอดีอาจารย์จากตารางสอน</span>
                  </button>

                  <button
                    onClick={() => setIsAddUserOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มบัญชีผู้ใช้งาน</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาด้วยชื่ออาจารย์, อีเมล @mcu.ac.th, Gmail หรือภาควิชา..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl font-bold w-full md:w-auto shrink-0">
                  <button
                    onClick={() => setUserRoleFilter('ALL')}
                    className={`px-2.5 py-1.5 rounded-lg transition ${
                      userRoleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    ทั้งหมด ({users.length})
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('SUPER_ADMIN')}
                    className={`px-2.5 py-1.5 rounded-lg transition ${
                      userRoleFilter === 'SUPER_ADMIN' ? 'bg-purple-700 text-white shadow-sm' : 'text-purple-700'
                    }`}
                  >
                    👑 Super Admin ({users.filter((u) => u.role === 'SUPER_ADMIN' || u.isSuperAdmin || u.email === 'phaisal.dis@mcu.ac.th').length})
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('ADMIN')}
                    className={`px-2.5 py-1.5 rounded-lg transition ${
                      userRoleFilter === 'ADMIN' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-700'
                    }`}
                  >
                    Admin ({users.filter((u) => u.role === 'ADMIN').length})
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('OFFICER')}
                    className={`px-2.5 py-1.5 rounded-lg transition ${
                      userRoleFilter === 'OFFICER' ? 'bg-sky-600 text-white shadow-sm' : 'text-sky-700'
                    }`}
                  >
                    เจ้าหน้าที่ ({users.filter((u) => u.role === 'OFFICER').length})
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('INSTRUCTOR')}
                    className={`px-2.5 py-1.5 rounded-lg transition ${
                      userRoleFilter === 'INSTRUCTOR' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700'
                    }`}
                  >
                    อาจารย์ ({users.filter((u) => u.role === 'INSTRUCTOR').length})
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('STUDENT')}
                    className={`px-2.5 py-1.5 rounded-lg transition ${
                      userRoleFilter === 'STUDENT' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-800 hover:bg-amber-50'
                    }`}
                  >
                    🎓 นิสิต ({studentsList.length})
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('SUSPENDED')}
                    className={`px-2.5 py-1.5 rounded-lg transition ${
                      userRoleFilter === 'SUSPENDED' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700'
                    }`}
                  >
                    ⛔ ถูกระงับ ({users.filter((u) => u.isSuspended || u.isActive === false).length})
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
                      <tr>
                        <th className="px-5 py-3.5">ผู้ใช้งาน</th>
                        <th className="px-5 py-3.5">อีเมลล็อกอิน (@mcu / Gmail)</th>
                        <th className="px-5 py-3.5">หน่วยงาน/ภาควิชา</th>
                        <th className="px-5 py-3.5">บทบาท (Role)</th>
                        <th className="px-5 py-3.5 text-center">สถานะ</th>
                        <th className="px-5 py-3.5 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredUsers.slice(0, 100).map((u) => {
                        const isSuper = u.role === 'SUPER_ADMIN' || u.isSuperAdmin || u.email === 'phaisal.dis@mcu.ac.th';
                        const isStudent = u.role === 'STUDENT';
                        const isSuspended = !isSuper && (u.isSuspended || u.isActive === false);

                        return (
                          <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${isSuspended ? 'bg-rose-50/30' : ''}`}>
                            <td className="px-5 py-3.5 font-medium text-slate-900">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-xl border font-bold flex items-center justify-center shrink-0 ${
                                  isSuper
                                    ? 'bg-purple-100 border-purple-300 text-purple-800'
                                    : isSuspended
                                    ? 'bg-rose-100 border-rose-300 text-rose-800'
                                    : isStudent
                                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                                    : 'bg-slate-100 border-slate-200 text-slate-700'
                                }`}>
                                  {isSuper ? '👑' : isSuspended ? '⛔' : isStudent ? '🎓' : u.name ? u.name.charAt(0) : 'อ'}
                                </div>
                                <div>
                                  <div className="font-bold flex items-center gap-1.5">
                                    <span>{u.name}</span>
                                    {isSuper && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                        SUPER ADMIN
                                      </span>
                                    )}
                                    {isStudent && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                        นิสิต
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {isStudent ? `รหัสนิสิต: ${u.id}` : `ID: ${u.id}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 space-y-0.5">
                              <div className="font-mono text-slate-800 font-medium flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{u.email}</span>
                              </div>
                              {u.gmail && (
                                <div className="font-mono text-slate-500 text-[11px] flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 rounded">G</span>
                                  <span>{u.gmail}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-slate-600">
                              {u.department || 'คณะพุทธศาสตร์'}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                  isSuper
                                    ? 'bg-purple-50 text-purple-800 border-purple-300 shadow-xs'
                                    : u.role === 'ADMIN'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : u.role === 'OFFICER'
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : isStudent
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {isSuper
                                  ? '👑 ผู้ดูแลระบบสูงสุด'
                                  : u.role === 'ADMIN'
                                  ? 'ผู้ดูแลระบบ'
                                  : u.role === 'OFFICER'
                                  ? 'เจ้าหน้าที่'
                                  : isStudent
                                  ? '🎓 นิสิต (STUDENT)'
                                  : 'อาจารย์ผู้สอน'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {isSuper ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  ถาวร (Super Admin)
                                </span>
                              ) : isSuspended ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                                  <Ban className="w-2.5 h-2.5" />
                                  <span>{isStudent ? 'พ้นสภาพ/ระงับ' : 'ถูกระงับการใช้'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>{isStudent ? 'ปกติ (ลงทะเบียน)' : 'ปกติ'}</span>
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {isStudent ? (
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  <button
                                    onClick={() => {
                                      setActiveTab('STUDENTS');
                                      setStudentSearch(u.id);
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition flex items-center gap-1 cursor-pointer"
                                    title="เปิดดูประวัตินิสิตฉบับเต็ม"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>ดูประวัตินิสิต</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      alert(`ข้อมูลการเข้าสู่ระบบของนิสิต:\n\nชื่อ-สกุล: ${u.name}\nรหัสนิสิต: ${u.id}\nอีเมลล็อกอิน: ${u.email}\nรหัสผ่านเริ่มต้น: ${u.id} หรือ mcu123456\n\nหมายเหตุ: นิสิตสามารถใช้บัญชีนี้เข้าระบบเพื่อขอเอกสารรับรอง หรือเช็คชื่อเข้าชั้นเรียนได้`);
                                    }}
                                    className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                                    title="ดูรหัสผ่านและวิธีเข้าสู่ระบบ"
                                  >
                                    รหัสล็อกอิน
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {/* Edit Email & Profile Button */}
                                  <button
                                    onClick={() => handleStartEditUser(u)}
                                    className="px-2 py-1 rounded-lg text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 transition flex items-center gap-1 cursor-pointer"
                                    title="แก้ไขอีเมลจริง, Gmail และข้อมูลผู้ใช้"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>แก้ไข</span>
                                  </button>

                                  {/* Teaching Slip & Credentials Slip Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenTeachingSlip(u)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition flex items-center gap-1 cursor-pointer"
                                    title="เปิดบัตรแจ้งภาระงานสอน ตารางวิชาที่สอน และรหัสผ่าน พร้อมพิมพ์เป็นทางการ"
                                  >
                                    <FileText className="w-3 h-3 text-indigo-600" />
                                    <span>บัตรแจ้งภาระงาน</span>
                                  </button>

                                  {/* Quick Copy LINE Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleCopyLineTeachingMessage(u)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                      copiedLineUserId === u.id
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                                    }`}
                                    title="คัดลอกข้อความสรุปภาระงานสอนและรหัสผ่าน สำหรับส่งใน LINE"
                                  >
                                    {copiedLineUserId === u.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-emerald-600" />}
                                    <span>{copiedLineUserId === u.id ? 'คัดลอกแล้ว!' : 'ส่ง LINE'}</span>
                                  </button>

                                  {/* Suspend / Unsuspend Toggle */}
                                  {!isSuper ? (
                                    isSuspended ? (
                                      <button
                                        onClick={() => handleToggleSuspend(u.id, true, u.name)}
                                        className="px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition flex items-center gap-1 cursor-pointer"
                                        title="ปลดระงับการใช้งานบัญชีนี้"
                                      >
                                        <UserCheck className="w-3 h-3" />
                                        <span>ปลดระงับ</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleToggleSuspend(u.id, false, u.name)}
                                        className="px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
                                        title="ระงับการใช้งานบัญชีนี้ชั่วคราว"
                                      >
                                        <Ban className="w-3 h-3" />
                                        <span>ระงับ</span>
                                      </button>
                                    )
                                  ) : null}

                                  {/* Change Role dropdown */}
                                  <select
                                    value={u.role || 'INSTRUCTOR'}
                                    disabled={isSuper}
                                    onChange={(e) => handleUpdateRole(u.id, e.target.value as any)}
                                    className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] bg-white text-slate-700 cursor-pointer focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                  >
                                    {isSuper && <option value="SUPER_ADMIN">👑 Super Admin</option>}
                                    <option value="INSTRUCTOR">อาจารย์ผู้สอน</option>
                                    <option value="OFFICER">เจ้าหน้าที่</option>
                                    <option value="ADMIN">ผู้ดูแลระบบ</option>
                                  </select>

                                  {/* Reset password */}
                                  <button
                                    onClick={() => handleResetPassword(u.id, u.name)}
                                    className="px-2 py-1 rounded-lg text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition cursor-pointer"
                                    title="รีเซ็ตรหัสผ่านเป็น mcu123456"
                                  >
                                    รีเซ็ตรหัส
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB D: BRANDING & SYSTEM SETTINGS (ปรับแต่งโลโก้ & ข้อความ)
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'BRANDING' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-pink-600" />
                  ปรับแต่งอัตลักษณ์ โลโก้ และข้อมูลสถาบัน (Branding & System Customization)
                </h2>
                <p className="text-xs text-slate-500">
                  ปรับแต่งโลโก้มหาวิทยาลัย, ข้อความหัวกระดาษหนังสือราชการ, ชื่อคณบดี/ผู้ลงนาม และข้อมูลติดต่อที่แสดงทั่วทั้งระบบ
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* 1. Logo Settings */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-pink-600" />
                      <span>1. โลโก้และตราสัญลักษณ์สถาบัน (University Logo & Crest)</span>
                    </h3>
                    <span className="text-[11px] text-pink-600 bg-pink-50 border border-pink-200 font-semibold px-2 py-0.5 rounded-full">
                      รองรับทั้งอัปโหลดไฟล์ และระบุ URL
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    {/* Live Preview */}
                    <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-3">
                      <div className="relative group">
                        <div className="w-28 h-28 rounded-2xl bg-white border-2 border-dashed border-slate-300 shadow-sm flex items-center justify-center p-2 overflow-hidden">
                          {settings.logoUrl ? (
                            <img
                              src={settings.logoUrl}
                              alt="Logo Preview"
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                (e.target as any).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-5xl">{settings.logoEmoji || '☸️'}</span>
                          )}
                        </div>
                        {settings.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setSettings({ ...settings, logoUrl: '' })}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 cursor-pointer"
                            title="ลบรูปภาพโลโก้"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">ตัวอย่างโลโก้จริง</div>
                        <div className="text-[10px] text-slate-400">จะแสดงบนหัวกระดาษพิมพ์และ Navbar</div>
                      </div>
                      {settings.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, logoUrl: '' })}
                          className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>ล้างรูปภาพ (ใช้ Emoji)</span>
                        </button>
                      )}
                    </div>

                    {/* Inputs & Upload Box */}
                    <div className="md:col-span-2 space-y-4 text-xs">
                      {/* Upload Box (Drag & Drop or Click) */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                          <UploadCloud className="w-4 h-4 text-pink-600" />
                          <span>อัปโหลดรูปภาพโลโก้จากเครื่องคอมพิวเตอร์ (Upload Image File):</span>
                        </label>

                        <input
                          type="file"
                          ref={logoFileInputRef}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleLogoFileUpload(e.target.files[0]);
                            }
                          }}
                          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                          className="hidden"
                        />

                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleLogoFileUpload(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => logoFileInputRef.current?.click()}
                          className="border-2 border-dashed border-pink-300 hover:border-pink-500 bg-pink-50/30 hover:bg-pink-50/60 rounded-2xl p-5 text-center cursor-pointer transition space-y-2 group"
                        >
                          <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
                            {uploadingLogo ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <Camera className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-xs">
                              {uploadingLogo ? 'กำลังอัปโหลดรูปภาพ...' : 'คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากไฟล์มาวางที่นี่'}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              รองรับไฟล์ PNG, JPG, JPEG, SVG, WebP (แนะนำไฟล์พื้นหลังโปร่งใส PNG หรือ SVG)
                            </div>
                          </div>
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-sm">
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>เลือกรูปภาพจากเครื่อง</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Direct URL Input */}
                      <div className="pt-2 border-t border-slate-100">
                        <label className="font-bold text-slate-700 block mb-1">
                          หรือ ระบุเป็น URL รูปภาพโดยตรง (Logo Image URL):
                        </label>
                        <input
                          type="text"
                          value={settings.logoUrl}
                          onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                          placeholder="https://www.mcu.ac.th/images/logo-mcu.png หรือ /uploads/logo-...png"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 bg-slate-50/50"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-full sm:w-auto">
                          <label className="font-bold text-slate-700 block mb-1">
                            Emoji ตัวแทน (สำรอง):
                          </label>
                          <input
                            type="text"
                            value={settings.logoEmoji || '☸️'}
                            onChange={(e) => setSettings({ ...settings, logoEmoji: e.target.value })}
                            className="w-20 px-3.5 py-2 rounded-xl border border-slate-200 text-center text-lg"
                          />
                        </div>

                        <div className="flex-1">
                          <span className="text-[11px] text-slate-500 block mb-1 font-semibold">
                            ตราสัญลักษณ์มาตรฐานสำเร็จรูป:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSettings({
                                  ...settings,
                                  logoUrl: 'https://www.mcu.ac.th/images/logo-mcu.png',
                                  logoEmoji: '☸️',
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer transition flex items-center gap-1"
                            >
                              <span>☸️ ตราธรรมจักร มจร.</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setSettings({
                                  ...settings,
                                  logoUrl: '',
                                  logoEmoji: '🏛️',
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer transition flex items-center gap-1"
                            >
                              <span>🏛️ สัญลักษณ์คณะ</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Quick Save for Logo */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-[11px] text-slate-500">
                          {settings.logoUrl ? (
                            <span className="text-emerald-700 font-medium">
                              ✓ โลโก้ปัจจุบัน: <span className="font-mono text-[10px]">{settings.logoUrl.length > 40 ? `${settings.logoUrl.slice(0, 40)}...` : settings.logoUrl}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">ยังไม่ได้ระบุรูปภาพโลโก้ (ใช้ Emoji สำรอง {settings.logoEmoji || '☸️'})</span>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={savingSettings}
                          onClick={async () => {
                            setSavingSettings(true);
                            try {
                              const res = await fetch('/api/system-settings', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(settings),
                              });
                              const data = await res.json();
                              if (data.success) {
                                if (data.data?.logoUrl) {
                                  setSettings((prev) => ({ ...prev, logoUrl: data.data.logoUrl }));
                                }
                                if (typeof window !== 'undefined') {
                                  window.dispatchEvent(new Event('mcu_settings_updated'));
                                }
                                setActionSuccess('✅ บันทึกรูปภาพโลโก้และตราสัญลักษณ์เรียบร้อยแล้ว!');
                              } else {
                                alert(data.error);
                              }
                            } catch (e: any) {
                              alert(e.message);
                            } finally {
                              setSavingSettings(false);
                            }
                          }}
                          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-600/20 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{savingSettings ? 'กำลังบันทึก...' : '💾 บันทึกโลโก้นี้ทันที'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. University & Faculty Names */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                    <Building2 className="w-4 h-4 text-pink-600" />
                    2. ชื่อมหาวิทยาลัยและคณะ (Institution & Faculty Names)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        ชื่อมหาวิทยาลัย (ภาษาไทย):
                      </label>
                      <input
                        type="text"
                        value={settings.universityNameTh}
                        onChange={(e) =>
                          setSettings({ ...settings, universityNameTh: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        ชื่อมหาวิทยาลัย (ภาษาอังกฤษ):
                      </label>
                      <input
                        type="text"
                        value={settings.universityNameEn}
                        onChange={(e) =>
                          setSettings({ ...settings, universityNameEn: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        ชื่อคณะ/หน่วยงาน (ภาษาไทย):
                      </label>
                      <input
                        type="text"
                        value={settings.facultyNameTh}
                        onChange={(e) =>
                          setSettings({ ...settings, facultyNameTh: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        ชื่อคณะ/หน่วยงาน (ภาษาอังกฤษ):
                      </label>
                      <input
                        type="text"
                        value={settings.facultyNameEn}
                        onChange={(e) =>
                          setSettings({ ...settings, facultyNameEn: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Authorized Signatories & Dropdown Management */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-pink-600" />
                      <span>3. ข้อมูลผู้ลงนามหนังสือรับรอง และจัดการตัวเลือกใน Dropdown</span>
                    </h3>
                    <span className="text-[11px] text-pink-700 bg-pink-50 border border-pink-200 font-semibold px-2.5 py-0.5 rounded-full">
                      ระบบจัดการรายชื่อผ่านหน้าจอ
                    </span>
                  </div>

                  {/* Primary Default Signer */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700">
                      ผู้ลงนามหลักค่าเริ่มต้น (Default Primary Signatory - คณบดี):
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">ชื่อผู้ลงนามหลัก (ภาษาไทย):</label>
                        <input
                          type="text"
                          value={settings.signerNameTh}
                          onChange={(e) => setSettings({ ...settings, signerNameTh: e.target.value })}
                          placeholder="พระครูสุธีกิตติบัณฑิต, รศ.ดร."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">ตำแหน่งผู้ลงนามหลัก (ภาษาไทย):</label>
                        <input
                          type="text"
                          value={settings.signerTitleTh}
                          onChange={(e) => setSettings({ ...settings, signerTitleTh: e.target.value })}
                          placeholder="คณบดีคณะพุทธศาสตร์"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">ชื่อผู้ลงนามหลัก (ภาษาอังกฤษ):</label>
                        <input
                          type="text"
                          value={settings.signerNameEn}
                          onChange={(e) => setSettings({ ...settings, signerNameEn: e.target.value })}
                          placeholder="Assoc. Prof. Dr. Phrakhrusutheekittibandhit"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">ตำแหน่งผู้ลงนามหลัก (ภาษาอังกฤษ):</label>
                        <input
                          type="text"
                          value={settings.signerTitleEn}
                          onChange={(e) => setSettings({ ...settings, signerTitleEn: e.target.value })}
                          placeholder="Dean of the Faculty of Buddhism"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Signatories List Management */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <UserCog className="w-4 h-4 text-purple-600" />
                          <span>จัดการรายชื่อและตำแหน่งในเมนู Dropdown (Signatories in Dropdown Menu)</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          ท่านสามารถเพิ่ม แก้ไขชื่อ หรือลบตำแหน่งผู้ลงนาม เพื่อให้ปรากฏในเมนู Dropdown ในหน้าพรีวิวเอกสาร
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsAddingSignatory(!isAddingSignatory)}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ เพิ่มผู้ลงนามใหม่</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleResetSignatories}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                          title="คืนค่าเป็นชุดมาตรฐาน 6 รูปแบบเริ่มต้น"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>รีเซ็ตค่าเริ่มต้น</span>
                        </button>
                      </div>
                    </div>

                    {/* Add Signatory Form Box (if open) */}
                    {isAddingSignatory && (
                      <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-3 animate-fade-in text-xs">
                        <div className="font-bold text-purple-950 flex items-center justify-between">
                          <span>กรอกข้อมูลผู้ลงนามใหม่:</span>
                          <button
                            type="button"
                            onClick={() => setIsAddingSignatory(false)}
                            className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="font-semibold text-slate-700 block mb-1">
                              1. ข้อความในเมนู Dropdown (Label):
                            </label>
                            <input
                              type="text"
                              placeholder="เช่น 7. ผู้ช่วยคณบดีฝ่าย..."
                              value={newSignatoryForm.label}
                              onChange={(e) => setNewSignatoryForm({ ...newSignatoryForm, label: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-700 block mb-1">
                              2. ชื่อและสมณศักดิ์ (Name):
                            </label>
                            <input
                              type="text"
                              placeholder="เช่น พระมหา... หรือเว้นว่างสำหรับเซ็นสด"
                              value={newSignatoryForm.name}
                              onChange={(e) => setNewSignatoryForm({ ...newSignatoryForm, name: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-700 block mb-1">
                              3. ตำแหน่งทางการ (Title):
                            </label>
                            <input
                              type="text"
                              placeholder="เช่น ผู้ช่วยคณบดีฝ่ายวิชาการ"
                              value={newSignatoryForm.title}
                              onChange={(e) => setNewSignatoryForm({ ...newSignatoryForm, title: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingSignatory(false)}
                            className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            onClick={handleAddSignatory}
                            className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm cursor-pointer"
                          >
                            บันทึกเพิ่มเข้ารายชื่อ
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Table of Signatories */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                            <tr>
                              <th className="p-3 w-1/3">ข้อความในเมนู Dropdown (Label)</th>
                              <th className="p-3 w-1/4">ชื่อผู้ลงนาม (Name)</th>
                              <th className="p-3">ตำแหน่ง (Title)</th>
                              <th className="p-3 text-right">การจัดการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeSignatoriesList.map((item) => {
                              const isEditing = editingSignatoryId === item.id;

                              if (isEditing) {
                                return (
                                  <tr key={item.id} className="bg-purple-50/50">
                                    <td className="p-2.5">
                                      <input
                                        type="text"
                                        value={editSignatoryForm.label}
                                        onChange={(e) => setEditSignatoryForm({ ...editSignatoryForm, label: e.target.value })}
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 text-xs bg-white font-medium"
                                      />
                                    </td>
                                    <td className="p-2.5">
                                      <input
                                        type="text"
                                        value={editSignatoryForm.name}
                                        placeholder="เว้นว่างสำหรับเซ็นสด"
                                        onChange={(e) => setEditSignatoryForm({ ...editSignatoryForm, name: e.target.value })}
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 text-xs bg-white"
                                      />
                                    </td>
                                    <td className="p-2.5">
                                      <input
                                        type="text"
                                        value={editSignatoryForm.title}
                                        onChange={(e) => setEditSignatoryForm({ ...editSignatoryForm, title: e.target.value })}
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 text-xs bg-white"
                                      />
                                    </td>
                                    <td className="p-2.5 text-right whitespace-nowrap space-x-1">
                                      <button
                                        type="button"
                                        onClick={handleSaveEditSignatory}
                                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                                      >
                                        บันทึก
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingSignatoryId(null)}
                                        className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs cursor-pointer"
                                      >
                                        ยกเลิก
                                      </button>
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3 font-semibold text-slate-900">
                                    <div className="flex items-center gap-1.5">
                                      <span>{item.label}</span>
                                      {(item as any).isDefault && (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                          เริ่มต้น
                                        </span>
                                      )}
                                      {!item.name && (
                                        <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                                          เซ็นสด
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-700 font-medium">
                                    {item.name ? item.name : <span className="text-slate-400 italic">เว้นว่าง (ลงนามสดด้วยปากกา)</span>}
                                  </td>
                                  <td className="p-3 text-slate-600">
                                    {item.title}
                                  </td>
                                  <td className="p-3 text-right whitespace-nowrap space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingSignatoryId(item.id);
                                        setEditSignatoryForm(item);
                                      }}
                                      className="p-1.5 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                                      title="แก้ไขชื่อหรือตำแหน่ง"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSignatory(item.id, item.label)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                      title="ลบออกจากเมนู Dropdown"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Contact & Announcements */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                    <Mail className="w-4 h-4 text-pink-600" />
                    4. ข้อมูลติดต่อและข้อความประกาศ (Contact & Announcements)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">เบอร์โทรศัพท์ติดต่อ:</label>
                      <input
                        type="text"
                        value={settings.contactPhone ?? ''}
                        onChange={(e) =>
                          setSettings({ ...settings, contactPhone: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">อีเมลติดต่อสถาบัน:</label>
                      <input
                        type="text"
                        value={settings.contactEmail ?? ''}
                        onChange={(e) =>
                          setSettings({ ...settings, contactEmail: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">เว็บไซต์ทางการคณะ (Website URL):</label>
                      <input
                        type="text"
                        value={settings.websiteUrl ?? ''}
                        onChange={(e) =>
                          setSettings({ ...settings, websiteUrl: e.target.value })
                        }
                        placeholder="https://fb.mcu.ac.th/"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">ที่ตั้งสำนักงาน/ที่อยู่ภาษาไทย (Address):</label>
                      <input
                        type="text"
                        value={settings.addressTh ?? ''}
                        onChange={(e) =>
                          setSettings({ ...settings, addressTh: e.target.value })
                        }
                        placeholder="อาคารเรียนรวม ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา 13170"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">
                        ข้อความประกาศต้อนรับหน้าแรก (Announcement Text):
                      </label>
                      <textarea
                        rows={2}
                        value={settings.announcementText}
                        onChange={(e) =>
                          setSettings({ ...settings, announcementText: e.target.value })
                        }
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. กล่องแจ้งเตือนสำคัญหน้าระบบหนังสือรับรอง (Certificate Notice Banners) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-purple-600" />
                        ข้อความกล่องแจ้งเตือน 3 กล่อง หน้าระบบขอหนังสือรับรอง (/certificates)
                      </h4>
                      <p className="text-xs text-slate-500">
                        ผู้ดูแลระบบสามารถเปิด/ปิดการแสดงผล และแก้ไขข้อความหัวข้อหรือคำแนะนำเพื่อสื่อสารกับนิสิตได้ตลอดเวลา
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* กล่องที่ 1: สีแดง (วีซ่า / Visa Alert) */}
                    <div className="p-4 rounded-2xl bg-red-50/70 border-2 border-red-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-red-950 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                          กล่องที่ 1 (สีแดง): แจ้งเตือนสำคัญ (VISA ALERT)
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-red-900 text-xs">
                          <input
                            type="checkbox"
                            checked={settings.visaAlertEnabled !== false}
                            onChange={(e) =>
                              setSettings({ ...settings, visaAlertEnabled: e.target.checked })
                            }
                            className="rounded border-red-300 text-red-600 focus:ring-red-500 w-4 h-4"
                          />
                          <span>แสดงกล่องนี้</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        <div>
                          <label className="font-bold text-red-950 block mb-1">ข้อความหัวข้อหลัก:</label>
                          <input
                            type="text"
                            value={settings.visaAlertTitle ?? ''}
                            onChange={(e) =>
                              setSettings({ ...settings, visaAlertTitle: e.target.value })
                            }
                            placeholder="สำหรับการต่อวีซ่า ให้ดำเนินการก่อนหนังสือเดินทางหมดอายุ 30 วัน"
                            className="w-full px-3 py-2 rounded-xl border border-red-200 bg-white text-xs font-semibold text-red-950 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-red-900 block mb-1">ข้อความคำอธิบายย่อย:</label>
                          <input
                            type="text"
                            value={settings.visaAlertDesc ?? ''}
                            onChange={(e) =>
                              setSettings({ ...settings, visaAlertDesc: e.target.value })
                            }
                            placeholder="* เพื่อให้มีระยะเวลาเพียงพอต่อการพิจารณาของ ตม. และป้องกันการเสียค่าปรับ"
                            className="w-full px-3 py-2 rounded-xl border border-red-200 bg-white text-xs text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* กล่องที่ 2: สีฟ้า (ระยะเวลาดำเนินการ / Timeline) */}
                    <div className="p-4 rounded-2xl bg-sky-50/70 border-2 border-sky-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sky-950 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                          กล่องที่ 2 (สีฟ้า): ระยะเวลาดำเนินการ (TIMELINE)
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-sky-900 text-xs">
                          <input
                            type="checkbox"
                            checked={settings.timelineAlertEnabled !== false}
                            onChange={(e) =>
                              setSettings({ ...settings, timelineAlertEnabled: e.target.checked })
                            }
                            className="rounded border-sky-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                          />
                          <span>แสดงกล่องนี้</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        <div>
                          <label className="font-bold text-sky-950 block mb-1">ข้อความหัวข้อหลัก:</label>
                          <input
                            type="text"
                            value={settings.timelineAlertTitle ?? ''}
                            onChange={(e) =>
                              setSettings({ ...settings, timelineAlertTitle: e.target.value })
                            }
                            placeholder="การดำเนินการ จะเสร็จสิ้น ประมาณ 1-2 วัน ไม่นับวันหยุด หรือ กรุณาตรวจดูเส้นทางการดำเนินการหนังสือว่า &quot;อนุมัติ&quot;"
                            className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white text-xs font-semibold text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-sky-900 block mb-1">ข้อความคำอธิบายย่อย:</label>
                          <input
                            type="text"
                            value={settings.timelineAlertDesc ?? ''}
                            onChange={(e) =>
                              setSettings({ ...settings, timelineAlertDesc: e.target.value })
                            }
                            placeholder="* สามารถตรวจสอบความคืบหน้าได้ตลอดเวลาที่แท็บ &quot;เช็คสถานะคำร้อง&quot;"
                            className="w-full px-3 py-2 rounded-xl border border-sky-200 bg-white text-xs text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* กล่องที่ 3: สีส้ม/เหลือง (ความถูกต้องของข้อมูล / Accuracy) */}
                    <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-amber-950 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                          กล่องที่ 3 (สีส้ม/เหลือง): ความถูกต้องของข้อมูล (ACCURACY)
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900 text-xs">
                          <input
                            type="checkbox"
                            checked={settings.accuracyAlertEnabled !== false}
                            onChange={(e) =>
                              setSettings({ ...settings, accuracyAlertEnabled: e.target.checked })
                            }
                            className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          <span>แสดงกล่องนี้</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        <div>
                          <label className="font-bold text-amber-950 block mb-1">ข้อความหัวข้อหลัก:</label>
                          <input
                            type="text"
                            value={settings.accuracyAlertTitle ?? ''}
                            onChange={(e) =>
                              setSettings({ ...settings, accuracyAlertTitle: e.target.value })
                            }
                            placeholder="กรุณากรอกข้อมูลให้ครบถ้วน มิฉะนั้นเอกสารจะไม่สมบูรณ์และจะยกเลิกการขอหนังสือ"
                            className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs font-semibold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-amber-900 block mb-1">ข้อความคำอธิบายย่อย:</label>
                          <input
                            type="text"
                            value={settings.accuracyAlertDesc ?? ''}
                            onChange={(e) =>
                              setSettings({ ...settings, accuracyAlertDesc: e.target.value })
                            }
                            placeholder="* ตรวจสอบตัวสะกดชื่อ-นามสกุลภาษาอังกฤษและเลขพาสปอร์ตให้ตรงกับเล่มจริง"
                            className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-lg shadow-pink-600/30 transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{savingSettings ? 'กำลังบันทึกการตั้งค่า...' : 'บันทึกการตั้งค่าระบบและโลโก้'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB E: GOOGLE SHEETS SETTINGS
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'SHEETS' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Table2 className="w-5 h-5 text-emerald-600" />
                  การเชื่อมต่อ Google Sheets API (Database & Real-time Sync)
                </h2>
                <p className="text-xs text-slate-500">
                  ตรวจสอบการเชื่อมต่อสองทาง (Two-Way Sync) ระหว่างระบบกับ Google Sheets
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                {sheetStatus?.connected ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm">เชื่อมต่อกับ Google Sheets สำเร็จเรียบร้อย</div>
                      <div className="text-xs text-emerald-700 mt-0.5">
                        ชื่อ Spreadsheet: <span className="font-semibold">{sheetStatus.spreadsheetTitle}</span>
                      </div>
                      {sheetStatus.sheets && (
                        <div className="text-xs text-emerald-700 mt-1">
                          แท็บที่พบในชีต: {sheetStatus.sheets.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm">โหมดข้อมูลภายใน (Local JSON Data Mode)</div>
                      <div className="text-xs text-amber-700 mt-0.5">
                        ระบบกำลังอ่านและบันทึกข้อมูลผ่านไฟล์ในเครื่องอย่างสมบูรณ์
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleInitialSync}
                    disabled={syncingSheet}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>
                      {syncingSheet
                        ? 'กำลังส่งข้อมูลขึ้น Google Sheets...'
                        : 'ส่งออกข้อมูลตั้งต้นขึ้นสู่ Google Sheets (Initial Sync)'}
                    </span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                  <div className="font-bold text-slate-800">📌 ข้อชี้แจงการทำงาน:</div>
                  <p>• เมื่อมีการบันทึกการเช็คชื่อ หรือแก้ไขข้อมูลนิสิต ข้อมูลจะถูกเขียนลง Google Sheets ให้อัตโนมัติในทันที</p>
                  <p>• เมื่อขึ้นปีใหม่ ไม่จำเป็นต้องกดปุ่ม Initial Sync ซ้ำ ข้อมูลปีก่อนหน้าจะถูกแยกเก็บตามปี พ.ศ. และปีการศึกษาอย่างปลอดภัย</p>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB F: STUDENTS MANAGEMENT VIEW (ทะเบียนนิสิต)
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'STUDENTS' && (
            <div className="space-y-4">
              {/* Header Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    ระบบทะเบียนนิสิต (Student Directory & Registry)
                  </h2>
                  <p className="text-xs text-slate-500">
                    ข้อมูลทะเบียนนิสิตทั้งหมด {studentsCount.total} รูป/คน (ภาคภาษาไทย {studentsCount.thai} • ภาคภาษาอังกฤษ {studentsCount.intl})
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={openPromotionModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>🎓 เลื่อนชั้นปีการศึกษา (Bulk Promotion)</span>
                  </button>
                  <Link
                    href="/students"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition cursor-pointer"
                  >
                    <span>เปิดหน้าจอจัดการทะเบียนนิสิตเต็มรูปแบบ</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาด้วยรหัสนิสิต, ชื่อ-สกุล, สัญชาติ หรือ Passport..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  {/* Program Filter Pills */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold w-full md:w-auto shrink-0">
                    <button
                      onClick={() => setStudentProgramFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        studentProgramFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      ทุกหลักสูตร
                    </button>
                    <button
                      onClick={() => setStudentProgramFilter('THAI')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        studentProgramFilter === 'THAI' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700'
                      }`}
                    >
                      🇹🇭 ภาคไทย
                    </button>
                    <button
                      onClick={() => setStudentProgramFilter('ENGLISH')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        studentProgramFilter === 'ENGLISH' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-700'
                      }`}
                    >
                      🌐 ภาคอังกฤษ (EN)
                    </button>
                  </div>
                </div>

                {/* Secondary Filters */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                  <select
                    value={studentStatusFilter}
                    onChange={(e) => setStudentStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                  >
                    <option value="ALL">สถานภาพ: ทั้งหมด</option>
                    <option value="กำลังศึกษา">กำลังศึกษา (ปกติ)</option>
                    <option value="ย้ายเข้า">ย้ายเข้า</option>
                    <option value="ย้ายออก">ย้ายออก</option>
                    <option value="เทียบโอน">เทียบโอน</option>
                    <option value="สำเร็จการศึกษา">สำเร็จการศึกษา</option>
                  </select>

                  <select
                    value={studentYearFilter}
                    onChange={(e) => setStudentYearFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                  >
                    <option value="ALL">ชั้นปี: ทั้งหมด</option>
                    <option value="1">ชั้นปีที่ 1</option>
                    <option value="2">ชั้นปีที่ 2</option>
                    <option value="3">ชั้นปีที่ 3</option>
                    <option value="4">ชั้นปีที่ 4</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setUnmaskPassport(!unmaskPassport)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ml-auto cursor-pointer ${
                      unmaskPassport
                        ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {unmaskPassport ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{unmaskPassport ? 'แสดง Passport เต็ม' : '🔒 ซ่อนเลข Passport (PDPA)'}</span>
                  </button>

                  <span className="text-slate-400 font-medium">
                    แสดง {filteredStudents.length} รายการ
                  </span>
                </div>
              </div>

              {/* Bulk Deletion Action Banner */}
              {adminSelectedStudentCodes.size > 0 && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-rose-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                      {adminSelectedStudentCodes.size}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-rose-900">
                        เลือกนิสิต {adminSelectedStudentCodes.size} รูป/คน
                      </div>
                      <div className="text-[11px] text-rose-600">
                        สามารถเลือกดำเนินการลบข้อมูลนิสิตตัวอย่างหรือข้อมูลที่ไม่ต้องการออกยกชุดได้ทันที
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminSelectedStudentCodes(new Set())}
                      className="text-xs text-rose-700 hover:text-rose-900 underline font-semibold ml-2 cursor-pointer"
                    >
                      ยกเลิกการเลือก
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={openDeleteBulkStudentsModal}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>🗑️ ลบนิสิตที่เลือกยกชุด ({adminSelectedStudentCodes.size} คน)</span>
                  </button>
                </div>
              )}

              {/* Students Data Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
                      <tr>
                        <th className="px-3.5 py-3.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isAllAdminStudentsSelected}
                            onChange={toggleSelectAllAdminStudents}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                            title={isAllAdminStudentsSelected ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมดที่แสดง'}
                          />
                        </th>
                        <th className="px-4 py-3.5">รหัสนิสิต</th>
                        <th className="px-4 py-3.5">ชื่อ - นามสกุล</th>
                        <th className="px-4 py-3.5">สัญชาติ / Passport</th>
                        <th className="px-4 py-3.5">หลักสูตร / ชั้นปี</th>
                        <th className="px-4 py-3.5 text-center">สถานภาพ</th>
                        <th className="px-4 py-3.5 text-center">เกรด (GPA)</th>
                        <th className="px-4 py-3.5 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-10 text-slate-400">
                            ไม่พบข้อมูลนิสิตตามเงื่อนไขที่เลือก
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.slice(0, 100).map((s) => {
                          const isEnglish = s.programType === 'ENGLISH' || (s.nationality !== 'ไทย' && s.nationality !== 'Thai' && Boolean(s.passportNo));
                          const isSelected = adminSelectedStudentCodes.has(s.studentCode);

                          return (
                            <tr
                              key={s.studentCode || s.id}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                isSelected ? 'bg-rose-50/40' : ''
                              }`}
                            >
                              <td className="px-3.5 py-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectAdminStudent(s.studentCode)}
                                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3.5 font-mono font-bold text-orange-700">
                                {s.studentCode}
                              </td>
                              <td className="px-4 py-3.5 font-medium text-slate-900">
                                <div>{s.fullName || `${s.firstName || ''} ${s.lastName || ''}`}</div>
                                <div className="text-[11px] text-slate-400">{s.email || '-'}</div>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="text-slate-700 font-medium">
                                  {s.nationality === 'ไทย' || s.nationality === 'Thai' ? '🇹🇭 ไทย' : `🌐 ${s.nationality || 'ต่างชาติ'}`}
                                </div>
                                {s.passportNo && (
                                  <div className="font-mono text-[11px] text-purple-700">
                                    Pass: {formatPassport(s.passportNo)}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isEnglish
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {isEnglish ? '🌐 EN Program' : '🇹🇭 ภาคไทย'}
                                </span>
                                <span className="ml-1.5 text-slate-500 text-[11px]">
                                  ปี {s.yearLevel || 1}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    s.studyStatus === 'สำเร็จการศึกษา'
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                      : s.studyStatus === 'ย้ายออก'
                                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                                      : s.studyStatus === 'ย้ายเข้า'
                                      ? 'bg-sky-100 text-sky-800 border-sky-200'
                                      : s.studyStatus === 'เทียบโอน'
                                      ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {s.studyStatus || 'ปกติ'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                                {s.gpa ? Number(s.gpa).toFixed(2) : '-'}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                                  <Link
                                    href={`/students?search=${s.studentCode}`}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 transition inline-flex items-center gap-1"
                                  >
                                    <span>แก้ไข</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => openDeleteSingleStudentModal(s)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition inline-flex items-center gap-1 cursor-pointer"
                                    title="ลบนิสิตท่านนี้ออกจากระบบ"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-600" />
                                    <span>ลบ</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {filteredStudents.length > 100 && (
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
                    แสดง 100 รายการแรกจากทั้งหมด {filteredStudents.length} รายการ (ใช้ช่องค้นหาเพื่อค้นหานิสิตที่ต้องการ)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB G: COURSES MANAGEMENT VIEW (หลักสูตร & รายวิชา)
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'COURSES' && (
            <div className="space-y-4">
              {/* Header Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    คลังหลักสูตรและรายวิชา (Curriculum & Courses Management)
                  </h2>
                  <p className="text-xs text-slate-500">
                    รายวิชาทั้งหมด {coursesCount} วิชา (ภาคภาษาไทยและภาษาอังกฤษ, หน่วยกิต, ระดับปริญญา)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    <span>เปิดหน้าจอหลักสูตรเต็มรูปแบบ</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาด้วยรหัสวิชา, ชื่อวิชา (ไทย/อังกฤษ) หรืออาจารย์ผู้สอน..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl font-bold w-full md:w-auto shrink-0">
                  <button
                    onClick={() => setCourseProgramFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      courseProgramFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    ทุกหลักสูตร
                  </button>
                  <button
                    onClick={() => setCourseProgramFilter('THAI')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      courseProgramFilter === 'THAI' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700'
                    }`}
                  >
                    🇹🇭 ภาคไทย
                  </button>
                  <button
                    onClick={() => setCourseProgramFilter('ENGLISH')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      courseProgramFilter === 'ENGLISH' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-700'
                    }`}
                  >
                    🌐 ภาคอังกฤษ (EN)
                  </button>
                </div>
              </div>

              {/* Courses Data Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
                      <tr>
                        <th className="px-5 py-3.5">รหัสวิชา</th>
                        <th className="px-5 py-3.5">ชื่อรายวิชา</th>
                        <th className="px-5 py-3.5">หลักสูตร</th>
                        <th className="px-5 py-3.5 text-center">หน่วยกิต</th>
                        <th className="px-5 py-3.5">อาจารย์ผู้สอน</th>
                        <th className="px-5 py-3.5">ระดับหลักสูตร</th>
                        <th className="px-5 py-3.5 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredCourses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-400">
                            ไม่พบรายวิชาตามเงื่อนไขที่เลือก
                          </td>
                        </tr>
                      ) : (
                        filteredCourses.slice(0, 50).map((c) => {
                          const isEnglish = c.programType === 'ENGLISH';

                          return (
                            <tr key={c.id || c.courseCode} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-3.5 font-mono font-bold text-emerald-800">
                                {c.courseCode}
                              </td>
                              <td className="px-5 py-3.5 font-medium text-slate-900">
                                <div className="font-bold">{c.courseName}</div>
                                {c.courseNameEn && (
                                  <div className="text-[11px] text-slate-400 font-normal">{c.courseNameEn}</div>
                                )}
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isEnglish
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {isEnglish ? '🌐 ภาคอังกฤษ' : '🇹🇭 ภาคไทย'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-800">
                                {c.credits || 3}
                              </td>
                              <td className="px-5 py-3.5 text-slate-700">
                                {c.primaryTeacherName || c.instructor || '-'}
                              </td>
                              <td className="px-5 py-3.5 text-slate-600">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                                  {c.degreeLevel || 'ปริญญาตรี'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <Link
                                  href={`/courses?search=${c.courseCode}`}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition inline-flex items-center gap-1"
                                >
                                  <span>จัดการ</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB H: TIMETABLES MANAGEMENT VIEW (ตารางเรียน & ตารางสอน)
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'TIMETABLES' && (
            <div className="space-y-4">
              {/* Header Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    ตารางเรียนและตารางสอน (Class Schedules & Timetables)
                  </h2>
                  <p className="text-xs text-slate-500">
                    รายการคาบสอนทั้งหมด {timetablesList.length} คาบ พร้อมข้อมูลห้องเรียนและอาจารย์ผู้สอน
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleScanTimetables}
                    disabled={isScanningInstructors}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                    title="สแกนตารางสอนและตรวจสอบไอดีอาจารย์ผู้สอน"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanningInstructors ? 'animate-spin' : ''}`} />
                    <span>🔄 ซิงค์และสร้างไอดีอาจารย์จากตารางสอน</span>
                  </button>

                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                  >
                    <span>ดูตารางสอนรายสัปดาห์</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-2 text-xs">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาด้วยรหัสวิชา, ชื่อวิชา, ห้องเรียน หรือผู้สอน..."
                    value={timetableSearch}
                    onChange={(e) => setTimetableSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <select
                  value={timetableYearFilter}
                  onChange={(e) => setTimetableYearFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="ALL">ปีการศึกษา: ทั้งหมด</option>
                  <option value="2569">ปีการศึกษา 2569</option>
                  <option value="2570">ปีการศึกษา 2570</option>
                </select>

                <select
                  value={timetableSemesterFilter}
                  onChange={(e) => setTimetableSemesterFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="ALL">ภาคเรียน: ทั้งหมด</option>
                  <option value="1">ภาคเรียนที่ 1</option>
                  <option value="2">ภาคเรียนที่ 2</option>
                </select>

                <select
                  value={timetableDayFilter}
                  onChange={(e) => setTimetableDayFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="ALL">วัน: ทุกวัน</option>
                  <option value="1">วันจันทร์</option>
                  <option value="2">วันอังคาร</option>
                  <option value="3">วันพุธ</option>
                  <option value="4">วันพฤหัสบดี</option>
                  <option value="5">วันศุกร์</option>
                  <option value="6">วันเสาร์</option>
                  <option value="0">วันอาทิตย์</option>
                </select>

                <span className="text-slate-400 font-medium ml-auto">
                  พบ {filteredTimetables.length} รายการ
                </span>
              </div>

              {/* Timetables Data Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
                      <tr>
                        <th className="px-5 py-3.5">วันในสัปดาห์</th>
                        <th className="px-5 py-3.5">เวลาเรียน</th>
                        <th className="px-5 py-3.5">รหัสวิชา</th>
                        <th className="px-5 py-3.5">ชื่อรายวิชา</th>
                        <th className="px-5 py-3.5">ชั้นปี / ภาคเรียน</th>
                        <th className="px-5 py-3.5">ห้องเรียน</th>
                        <th className="px-5 py-3.5">อาจารย์ผู้สอน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredTimetables.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-400">
                            ไม่พบตารางสอนตามเงื่อนไขที่เลือก
                          </td>
                        </tr>
                      ) : (
                        filteredTimetables.slice(0, 50).map((t, idx) => {
                          const dayColor = DAY_COLORS[t.dayOfWeek] || 'bg-slate-50 text-slate-700 border-slate-200';
                          const dayLabel = DAY_NAMES[t.dayOfWeek] || `วัน ${t.dayOfWeek}`;

                          return (
                            <tr key={`${t.courseCode}-${t.dayOfWeek}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${dayColor}`}>
                                  {dayLabel}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-mono font-medium text-slate-800">
                                {t.startTime} - {t.endTime}
                              </td>
                              <td className="px-5 py-3.5 font-mono font-bold text-indigo-700">
                                {t.courseCode}
                              </td>
                              <td className="px-5 py-3.5 font-medium text-slate-900">
                                {t.courseName}
                              </td>
                              <td className="px-5 py-3.5 text-slate-600">
                                ปี {t.yearLevel} (เทอม {t.semester}/{t.academicYear})
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {t.room || 'อาคารเรียน'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-slate-700 font-medium">
                                {t.instructor || '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              TAB I: ATTENDANCE MANAGEMENT VIEW (บันทึกตรวจเวลาเรียน)
             ───────────────────────────────────────────────────────── */}
          {activeTab === 'ATTENDANCE' && (
            <div className="space-y-4">
              {/* Header Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-teal-600" />
                    บันทึกตรวจเวลาเรียน (Attendance Records & Logs)
                  </h2>
                  <p className="text-xs text-slate-500">
                    ประวัติการเช็คชื่อเข้าชั้นเรียนของนิสิตทั้งหมด {attendanceList.length} รายการ
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/attendance"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
                  >
                    <span>เปิดหน้าระบบเช็คชื่ออาจารย์</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาด้วยรหัสวิชา, รหัสนิสิต, ชื่อ หรือผู้บันทึก..."
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl font-bold w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => setAttendanceStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      attendanceStatusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    onClick={() => setAttendanceStatusFilter('PRESENT')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      attendanceStatusFilter === 'PRESENT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700'
                    }`}
                  >
                    🟢 มาเรียน
                  </button>
                  <button
                    onClick={() => setAttendanceStatusFilter('LATE')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      attendanceStatusFilter === 'LATE' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700'
                    }`}
                  >
                    🟡 มาสาย
                  </button>
                  <button
                    onClick={() => setAttendanceStatusFilter('ABSENT')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      attendanceStatusFilter === 'ABSENT' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700'
                    }`}
                  >
                    🔴 ขาด
                  </button>
                  <button
                    onClick={() => setAttendanceStatusFilter('LEAVE')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      attendanceStatusFilter === 'LEAVE' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-700'
                    }`}
                  >
                    🔵 ลา
                  </button>
                </div>
              </div>

              {/* Attendance Data Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
                      <tr>
                        <th className="px-5 py-3.5">วันที่ / เวลา</th>
                        <th className="px-5 py-3.5">รหัสวิชา</th>
                        <th className="px-5 py-3.5">รหัสนิสิต</th>
                        <th className="px-5 py-3.5">ชื่อนิสิต</th>
                        <th className="px-5 py-3.5 text-center">สถานะ</th>
                        <th className="px-5 py-3.5">ผู้บันทึกข้อมูล</th>
                        <th className="px-5 py-3.5">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredAttendance.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-400">
                            ไม่พบประวัติการเช็คชื่อตามเงื่อนไขที่เลือก
                          </td>
                        </tr>
                      ) : (
                        filteredAttendance.map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                              {a.date ? new Date(a.date).toLocaleDateString('th-TH') : '-'}
                            </td>
                            <td className="px-5 py-3.5 font-mono font-bold text-teal-800">
                              {a.courseCode || '-'}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-700">
                              {a.studentCode}
                            </td>
                            <td className="px-5 py-3.5 font-medium text-slate-900">
                              {a.studentName}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  a.status === 'PRESENT'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : a.status === 'LATE'
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : a.status === 'ABSENT'
                                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                                    : 'bg-blue-100 text-blue-800 border-blue-200'
                                }`}
                              >
                                {a.status === 'PRESENT'
                                  ? 'เข้าเรียน'
                                  : a.status === 'LATE'
                                  ? 'มาสาย'
                                  : a.status === 'ABSENT'
                                  ? 'ขาดเรียน'
                                  : 'ลา'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-600">
                              {a.recordedBy || 'อาจารย์ผู้สอน'}
                            </td>
                            <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                              {a.note || '-'}
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
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: ADD USER MODAL
         ───────────────────────────────────────────────────────────── */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserCog className="w-4 h-4 text-sky-600" />
                เพิ่มบัญชีผู้ใช้งานใหม่
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อ - นามสกุล / สมณศักดิ์:</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="เช่น พระมหาดวงเด่น หรือ ดร.สมชาย"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">อีเมลทางการ (@mcu.ac.th):</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="example@mcu.ac.th"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">อีเมลสำรอง Gmail (ถ้ามี):</label>
                <input
                  type="email"
                  value={newUserForm.gmail}
                  onChange={(e) => setNewUserForm({ ...newUserForm, gmail: e.target.value })}
                  placeholder="example.mcu@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">บทบาทและสิทธิ์การใช้งาน (Role):</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                >
                  <option value="INSTRUCTOR">อาจารย์ผู้สอน (เช็คชื่อเวลาเรียน)</option>
                  <option value="OFFICER">เจ้าหน้าที่ทะเบียน (พิจารณาคำร้องและทะเบียนนิสิต)</option>
                  <option value="ADMIN">ผู้ดูแลระบบสูงสุด (Admin Full Access)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">รหัสผ่านเริ่มต้น:</label>
                <input
                  type="text"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold cursor-pointer"
                >
                  บันทึกผู้ใช้ใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: EDIT USER & REAL EMAIL MODAL
         ───────────────────────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-sky-600" />
                <span>แก้ไขข้อมูลผู้ใช้งาน & อีเมลจริง</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อ - นามสกุล / สมณศักดิ์:</label>
                <input
                  type="text"
                  required
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  placeholder="เช่น พระมหาดวงเด่น หรือ ดร.สมชาย"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  อีเมลทางการ (@mcu.ac.th):
                </label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  placeholder="name@mcu.ac.th"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>อีเมล Gmail จริงของอาจารย์:</span>
                  <span className="text-[10px] text-amber-600 font-normal">สำหรับเข้าสู่ระบบด้วย Google</span>
                </label>
                <input
                  type="email"
                  value={editUserForm.gmail}
                  onChange={(e) => setEditUserForm({ ...editUserForm, gmail: e.target.value })}
                  placeholder="teacher.real@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * เมื่อบันทึกแล้ว อาจารย์สามารถใช้ Gmail จริงนี้เข้าสู่ระบบผ่านปุ่ม Google ได้ทันที
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">หน่วยงาน / ภาควิชา:</label>
                <input
                  type="text"
                  value={editUserForm.department}
                  onChange={(e) => setEditUserForm({ ...editUserForm, department: e.target.value })}
                  placeholder="เช่น คณะพุทธศาสตร์ ภาควิชาพระพุทธศาสนา"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">บทบาทและสิทธิ์การใช้งาน (Role):</label>
                <select
                  value={editUserForm.role}
                  disabled={editingUser.email === 'phaisal.dis@mcu.ac.th' || editingUser.isSuperAdmin}
                  onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="INSTRUCTOR">อาจารย์ผู้สอน (INSTRUCTOR)</option>
                  <option value="OFFICER">เจ้าหน้าที่บริการการศึกษา (OFFICER)</option>
                  <option value="ADMIN">ผู้ดูแลระบบ (ADMIN)</option>
                  {(editingUser.email === 'phaisal.dis@mcu.ac.th' || editingUser.isSuperAdmin) && (
                    <option value="SUPER_ADMIN">👑 ผู้ดูแลระบบสูงสุด (SUPER_ADMIN)</option>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={editUserSaving}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  {editUserSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* ─────────────────────────────────────────────────────────────
          MODAL: REJECTION WITH REASON PRESETS
         ───────────────────────────────────────────────────────────── */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <div className="p-2 rounded-xl bg-rose-100">
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">ปฏิเสธคำร้องหนังสือรับรอง</h3>
                  <p className="text-[11px] text-slate-500">
                    เลขที่คำร้อง: {rejectingRequest.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-slate-800">
                ผู้ยื่นคำร้อง: <span className="text-rose-900">{rejectingRequest.fullName}</span>
                {rejectingRequest.studentCode && <span className="text-slate-500 font-normal ml-1">({rejectingRequest.studentCode})</span>}
              </div>
              <div className="text-[11px] text-slate-600">
                ประเภท: {rejectingRequest.certType || 'หนังสือรับรอง'}
              </div>
            </div>

            {/* Quick Reason Presets */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                เลือกเหตุผลที่ปฏิเสธ (คลิกเพื่อเลือกทันที):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {REJECT_PRESET_REASONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReasonInput(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer text-left ${
                      rejectReasonInput === preset
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-rose-50 border-slate-200 text-slate-700 hover:border-rose-300'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason Textarea */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                ข้อความระบุเหตุผล / คำแนะนำถึงผู้ยื่นคำร้อง:
              </label>
              <textarea
                rows={3}
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="ระบุเหตุผลเพิ่มเติม เช่น ขาดสำเนาการลงทะเบียนเรียน หรือเอกสารไม่ชัดเจน..."
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:outline-none resize-none"
              />
              <p className="text-[10px] text-slate-500">
                * ข้อความนี้จะแสดงในหน้าระบบติดตามสถานะของผู้ยื่นคำร้อง เพื่อให้นิสิตแก้ไขหรือแนบเอกสารใหม่
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={rejectSubmitting}
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-200 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>{rejectSubmitting ? 'กำลังบันทึก...' : 'ยืนยันปฏิเสธคำร้อง'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: ACADEMIC YEAR ARCHIVING & SUMMARY
         ───────────────────────────────────────────────────────────── */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    ปิดยอดและจัดเก็บประวัติปีการศึกษา (Academic Year Archiving)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ตามระเบียบงานสารบรรณ มจร. และการประกันคุณภาพการศึกษา
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsArchiveModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Year Selector */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">เลือกปีการศึกษาที่ต้องการปิดยอด:</span>
              <div className="flex items-center gap-2">
                {availableYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setArchivingYear(yr)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                      archivingYear === yr
                        ? 'bg-purple-700 text-white shadow-md'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    ปีการศึกษา {yr}
                  </button>
                ))}
              </div>
            </div>

            {/* Statistics Preview for the Selected Year */}
            {(() => {
              const yearReqs = requests.filter((r) => {
                const yr = r.createdAt ? new Date(r.createdAt).getFullYear() + 543 : null;
                return String(yr) === archivingYear;
              });
              const approved = yearReqs.filter((r) => r.status === 'APPROVED').length;
              const rejected = yearReqs.filter((r) => r.status === 'REJECTED').length;
              const pending = yearReqs.filter((r) => r.status === 'PENDING').length;
              const foreign = yearReqs.filter((r) => r.passportNo && r.passportNo.trim() !== '').length;
              const thai = yearReqs.length - foreign;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                      <div className="text-2xl font-black text-purple-700">{yearReqs.length}</div>
                      <div className="text-[11px] font-bold text-slate-600">คำร้องทั้งหมด</div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div className="text-2xl font-black text-emerald-700">{approved}</div>
                      <div className="text-[11px] font-bold text-slate-600">อนุมัติสำเร็จ</div>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                      <div className="text-2xl font-black text-rose-700">{rejected}</div>
                      <div className="text-[11px] font-bold text-slate-600">ปฏิเสธคำร้อง</div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                      <div className="text-2xl font-black text-amber-700">{pending}</div>
                      <div className="text-[11px] font-bold text-slate-600">รอดำเนินการ</div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>สัดส่วนนิสิตผู้ยื่นคำร้อง:</span>
                      <span className="text-purple-700">ไทย {thai} รูป/คน | ต่างชาติ {foreign} รูป/คน</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                      <div
                        className="bg-orange-500 h-full"
                        style={{ width: `${yearReqs.length ? (thai / yearReqs.length) * 100 : 50}%` }}
                      />
                      <div
                        className="bg-blue-600 h-full"
                        style={{ width: `${yearReqs.length ? (foreign / yearReqs.length) * 100 : 50}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={archiveLoading}
                onClick={handleArchiveYear}
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <Archive className="w-4 h-4" />
                <span>{archiveLoading ? 'กำลังบันทึกประวัติ...' : `ยืนยันปิดยอดปีการศึกษา ${archivingYear}`}</span>
              </button>
            </div>

            {/* Archived History List */}
            {academicArchives.length > 0 && (
              <div className="pt-4 border-t space-y-2">
                <h4 className="font-bold text-slate-800 text-xs">
                  ประวัติการปิดยอดที่บันทึกไว้ในระบบ:
                </h4>
                <div className="space-y-1.5">
                  {academicArchives.map((arch, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-purple-900">ปีการศึกษา {arch.academicYear}</span>
                        <span className="text-slate-400 text-[11px] ml-2">
                          (บันทึกเมื่อ: {new Date(arch.archivedAt).toLocaleDateString('th-TH')})
                        </span>
                      </div>
                      <div className="font-semibold text-slate-700">
                        {arch.approvedCount} / {arch.totalRequests} ฉบับ
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TEACHING ASSIGNMENT & CREDENTIAL SLIP (บัตรแจ้งภาระงานสอน & รหัสผ่าน)
         ───────────────────────────────────────────────────────────── */}
      {teachingSlipUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-6 print:max-h-none print:shadow-none print:border-none print:p-0">
            {/* Top Toolbar (Hidden on Print) */}
            <div className="flex items-center justify-between border-b pb-3 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    บัตรแจ้งภาระงานสอนและรหัสผ่านเข้าสู่ระบบ (Official Teaching Slip)
                  </h3>
                  <p className="text-xs text-slate-500">
                    สำหรับส่งมอบให้อาจารย์ผู้สอนประจำรายวิชา ภาคการศึกษาที่ 1 ปีการศึกษา 2569
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLineTeachingMessage(teachingSlipUser)}
                  className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-600" />
                  <span>คัดลอกส่ง LINE</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์บัตร (Print/PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTeachingSlipUser(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="space-y-6 border border-slate-200 rounded-2xl p-6 sm:p-8 bg-slate-50/30 print:border-none print:p-0">
              {/* Document Header */}
              <div className="text-center space-y-1 border-b border-slate-200 pb-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 font-bold text-xl shadow-inner mb-2">
                  ☸️
                </div>
                <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                </h4>
                <p className="text-xs text-slate-600 font-semibold">
                  หนังสือแจ้งภาระงานสอนและข้อมูลบัญชีเข้าสู่ระบบตรวจเข้าเรียน ประจำปีการศึกษา 2569
                </p>
              </div>

              {/* Instructor Information Card */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 font-medium">อาจารย์ผู้สอน:</span>{' '}
                    <strong className="text-slate-900 text-sm">{teachingSlipUser.name}</strong>
                    {teachingSlipUser.nameEn && (
                      <div className="text-[11px] text-slate-500">{teachingSlipUser.nameEn}</div>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">สังกัดภาควิชา:</span>{' '}
                    <strong className="text-slate-800">{teachingSlipUser.department || 'คณะพุทธศาสตร์ มจร.'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">อีเมลมหาวิทยาลัย (@mcu.ac.th):</span>{' '}
                    <span className="font-mono font-bold text-indigo-700">{teachingSlipUser.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Gmail สำรอง:</span>{' '}
                    <span className="font-mono text-slate-600">{teachingSlipUser.gmail || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Teaching Assignments Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>รายวิชาที่รับผิดชอบบรรยายในภาคเรียนนี้:</span>
                  </span>
                  <span className="text-slate-500 font-normal">
                    (ทั้งภาคภาษาไทยและหลักสูตรนานาชาติ)
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 w-10 text-center">ลำดับ</th>
                        <th className="px-3 py-2 w-24">รหัสวิชา</th>
                        <th className="px-3 py-2">ชื่อรายวิชา</th>
                        <th className="px-3 py-2 text-center w-16">ชั้นปี</th>
                        <th className="px-3 py-2 text-center w-28">วัน-เวลาเรียน</th>
                        <th className="px-3 py-2 text-center w-24">ห้องเรียน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const courses = getCoursesForInstructor(teachingSlipUser);
                        if (courses.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="text-center py-6 text-slate-400">
                                ไม่พบรายวิชาที่ระบุชื่อผู้สอนในตารางสอนภาคเรียนนี้
                              </td>
                            </tr>
                          );
                        }
                        return courses.map((c: any, i: number) => {
                          const isEn = /inter|eng|english|นานาชาติ/i.test(c.timetableTitle || '') || /^[A-Za-z0-9\s:,-]+$/.test(c.courseName);
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-center font-mono text-slate-400">{i + 1}</td>
                              <td className="px-3 py-2 font-mono font-bold text-indigo-700">{c.courseCode}</td>
                              <td className="px-3 py-2 font-medium text-slate-900">
                                <div>{c.courseName}</div>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${isEn ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {isEn ? '🌐 International (EN)' : '🇹🇭 ภาคไทย'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center font-semibold">ปี {c.yearLevel || 1}</td>
                              <td className="px-3 py-2 text-center font-mono text-[11px]">{c.startTime || '-'}-{c.endTime || '-'} น.</td>
                              <td className="px-3 py-2 text-center font-bold text-slate-700">{c.room || '-'}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Login Credentials & QR Access Box */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="space-y-1.5 flex-1">
                  <div className="font-extrabold text-emerald-950 text-sm flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-emerald-600" />
                    <span>ข้อมูลเข้าสู่ระบบตรวจเช็คชื่อนิสิต (Attendance System)</span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div>
                      • ลิงก์เข้าใช้งาน: <strong className="font-mono text-purple-700">http://localhost:3020/attendance</strong>
                    </div>
                    <div>
                      • ชื่อผู้ใช้ (Username): <strong className="font-mono text-slate-900">{teachingSlipUser.email}</strong>
                    </div>
                    <div>
                      • รหัสผ่านเริ่มต้น (Default Password): <strong className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">{teachingSlipUser.defaultPassword || 'mcu123456'}</strong>
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1">
                      * อาจารย์สามารถกดปุ่ม <strong>"เข้าสู่ระบบด้วย Google / บัญชี มจร."</strong> ได้โดยตรงโดยไม่ต้องกรอกรหัสผ่าน
                    </div>
                  </div>
                </div>

                {teachingSlipQr && (
                  <div className="text-center shrink-0 p-2 bg-white rounded-xl border border-emerald-200 shadow-sm">
                    <img src={teachingSlipQr} alt="QR Code เข้าระบบ" className="w-24 h-24 mx-auto" />
                    <div className="text-[10px] font-bold text-slate-600 mt-1">สแกนเข้าสู่ระบบ</div>
                  </div>
                )}
              </div>

              {/* Sign-off box for print */}
              <div className="grid grid-cols-2 gap-8 pt-6 mt-6 text-xs text-slate-800 text-center border-t border-slate-200">
                <div className="space-y-8">
                  <div>ลงชื่อ..................................................................</div>
                  <div>( {teachingSlipUser.name} )<br /><span className="text-slate-500">อาจารย์ผู้รับทราบภาระงานสอน</span></div>
                </div>
                <div className="space-y-8">
                  <div>ลงชื่อ..................................................................</div>
                  <div>( พระครูสุธีกิตติบัณฑิต, รศ.ดร. )<br /><span className="text-slate-500">คณบดีคณะพุทธศาสตร์</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: BULK ACADEMIC YEAR PROMOTION (เลื่อนชั้นปียกชุด)
         ───────────────────────────────────────────────────────────── */}
      {isPromotionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-6xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                    <span>เลื่อนชั้นปีการศึกษาและปรับสถานะนิสิตแบบยกชุด</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                      Bulk Academic Promotion
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ระบบช่วยคำนวณการเลื่อนชั้นปีอัตโนมัติล่วงหน้า (+1 ปี หรือ สำเร็จการศึกษาสำหรับปี 4) โดยเจ้าหน้าที่สามารถตรวจสอบข้อยกเว้น (ซ้ำชั้น / ดรอป / รักษาสภาพ) แล้วกดปุ่มยืนยันยกชุด
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPromotionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Statistics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-400 font-semibold text-[11px]">ทั้งหมดในระบบ</div>
                <div className="text-lg font-black text-slate-800">{promotionStats.total}</div>
                <div className="text-[10px] text-slate-500">รูป/คน</div>
              </div>
              <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-200/80">
                <div className="text-indigo-600 font-bold text-[11px] flex items-center justify-center gap-1">
                  <CheckSquare className="w-3 h-3" /> เลือกทำรายการ
                </div>
                <div className="text-lg font-black text-indigo-700">{promotionStats.selectedCount}</div>
                <div className="text-[10px] text-indigo-500">รูป/คน</div>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80">
                <div className="text-emerald-700 font-bold text-[11px]">เลื่อนชั้นปกติ (+1)</div>
                <div className="text-lg font-black text-emerald-700">{promotionStats.promoteCount}</div>
                <div className="text-[10px] text-emerald-600">รูป/คน</div>
              </div>
              <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200/80">
                <div className="text-purple-700 font-bold text-[11px]">🎓 สำเร็จการศึกษา</div>
                <div className="text-lg font-black text-purple-700">{promotionStats.gradCount}</div>
                <div className="text-[10px] text-purple-600">รูป/คน</div>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80">
                <div className="text-amber-800 font-bold text-[11px]">⚠️ ซ้ำชั้น (คงปีเดิม)</div>
                <div className="text-lg font-black text-amber-800">{promotionStats.repeatCount}</div>
                <div className="text-[10px] text-amber-600">รูป/คน</div>
              </div>
              <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200/80">
                <div className="text-sky-800 font-bold text-[11px]">⏸️ รักษาสภาพ/ดรอป</div>
                <div className="text-lg font-black text-sky-800">{promotionStats.dropCount}</div>
                <div className="text-[10px] text-sky-600">รูป/คน</div>
              </div>
              <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200">
                <div className="text-slate-500 font-semibold text-[11px]">ข้ามไม่ทำรายการ</div>
                <div className="text-lg font-black text-slate-600">{promotionStats.unselectedCount}</div>
                <div className="text-[10px] text-slate-400">รูป/คน</div>
              </div>
            </div>

            {/* Filter Toolbar & Quick Batch Controls */}
            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Year Level Pills */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 font-bold">
                  <span className="text-[11px] text-slate-400 px-2 font-medium">ชั้นปีปัจจุบัน:</span>
                  {(['ALL', '1', '2', '3', '4'] as const).map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setPromotionTargetYear(yr)}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs ${
                        promotionTargetYear === yr
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {yr === 'ALL' ? 'ทั้งหมด' : `ปี ${yr}`}
                    </button>
                  ))}
                </div>

                {/* Program Pills */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 font-bold">
                  {(['ALL', 'THAI', 'ENGLISH'] as const).map((prog) => (
                    <button
                      key={prog}
                      type="button"
                      onClick={() => setPromotionProgramFilter(prog)}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-xs ${
                        promotionProgramFilter === prog
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {prog === 'ALL' ? 'ทุกหลักสูตร' : prog === 'THAI' ? '🇹🇭 ภาคไทย' : '🌐 ภาคอังกฤษ'}
                    </button>
                  ))}
                </div>

                {/* Action Filter */}
                <select
                  value={promotionActionFilter}
                  onChange={(e) => setPromotionActionFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium cursor-pointer"
                >
                  <option value="ALL">ตัวกรองการดำเนินการ: ทั้งหมด</option>
                  <option value="SELECTED_ONLY">เฉพาะที่เลือกทำรายการ (✓)</option>
                  <option value="UNSELECTED_ONLY">เฉพาะที่ไม่ได้เลือก</option>
                  <option value="PROMOTE">🟢 เฉพาะเลื่อนชั้นปกติ (+1)</option>
                  <option value="GRADUATE">🎓 เฉพาะสำเร็จการศึกษา</option>
                  <option value="REPEAT">⚠️ เฉพาะซ้ำชั้น</option>
                  <option value="DROP">⏸️ เฉพาะรักษาสภาพ/ดรอป</option>
                </select>
              </div>

              {/* Search & Batch Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาด้วยรหัสนิสิต, ชื่อ-สกุล หรือสาขาวิชา..."
                    value={promotionSearch}
                    onChange={(e) => setPromotionSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={() => setFilteredPromotionSelection(true, filteredPromotionItems)}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-1 transition cursor-pointer text-xs"
                    title="เลือกทุกรายการที่แสดงในตารางขณะนี้"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>เลือกที่แสดง ({filteredPromotionItems.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilteredPromotionSelection(false, filteredPromotionItems)}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-1 transition cursor-pointer text-xs"
                    title="ยกเลิกการเลือกทุกรายการที่แสดง"
                  >
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                    <span>ยกเลิกที่แสดง</span>
                  </button>

                  {/* Bulk Set Action Dropdown */}
                  <select
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const val = e.target.value as any;
                      setFilteredPromotionAction(val, filteredPromotionItems);
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-700 cursor-pointer text-xs"
                  >
                    <option value="" disabled>
                      ⚡ ปรับกลุ่มที่แสดงเป็น...
                    </option>
                    <option value="PROMOTE">🟢 เลื่อนชั้นปกติ (+1 ปี)</option>
                    <option value="REPEAT">⚠️ ซ้ำชั้น (คงชั้นปีเดิม)</option>
                    <option value="DROP">⏸️ รักษาสภาพ / ดรอป</option>
                    <option value="GRADUATE">🎓 สำเร็จการศึกษา</option>
                  </select>

                  <button
                    type="button"
                    onClick={openPromotionModal}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-600 flex items-center gap-1 transition cursor-pointer text-xs"
                    title="คืนค่าการตั้งค่าทั้งหมดกลับเป็นค่าที่ระบบคำนวณให้อัตโนมัติ"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>คืนค่าแนะนำ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-inner max-h-[46vh]">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    <th className="px-3.5 py-2.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredPromotionItems.length > 0 &&
                          filteredPromotionItems.every((item) => item.selected)
                        }
                        onChange={(e) =>
                          setFilteredPromotionSelection(e.target.checked, filteredPromotionItems)
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-2.5">รหัสนิสิต / ข้อมูลนิสิต</th>
                    <th className="px-3 py-2.5 text-center">ปัจจุบัน</th>
                    <th className="px-2 py-2.5 text-center w-8"></th>
                    <th className="px-3 py-2.5">การดำเนินการ / ข้อยกเว้น</th>
                    <th className="px-3 py-2.5 text-center">ผลลัพธ์ที่จะบันทึก</th>
                    <th className="px-3 py-2.5">บันทึกเหตุผล / หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPromotionItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        ไม่พบข้อมูลนิสิตตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    filteredPromotionItems.map((item) => {
                      const isEnglish = item.programType === 'ENGLISH';
                      return (
                        <tr
                          key={item.studentCode}
                          className={`hover:bg-slate-50/80 transition ${
                            item.selected ? 'bg-indigo-50/20' : 'opacity-60 bg-slate-50/40'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="px-3.5 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => togglePromotionSelect(item.studentCode)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>

                          {/* Student Info */}
                          <td className="px-3 py-2">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{item.studentCode}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold ${
                                  isEnglish
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {isEnglish ? 'EN' : 'TH'}
                              </span>
                            </div>
                            <div className="text-slate-700 font-medium truncate max-w-[200px]">
                              {item.fullName}
                            </div>
                            {item.major && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                {item.major}
                              </div>
                            )}
                          </td>

                          {/* Current Status */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-bold text-slate-800">ชั้นปีที่ {item.currentYear}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {item.currentStatus}
                              </span>
                            </div>
                          </td>

                          {/* Arrow */}
                          <td className="px-2 py-2 text-center text-slate-400">
                            <ArrowRight className="w-4 h-4 mx-auto text-indigo-500" />
                          </td>

                          {/* Action Selector */}
                          <td className="px-3 py-2">
                            <select
                              value={item.actionType}
                              onChange={(e) =>
                                handlePromotionItemActionChange(
                                  item.studentCode,
                                  e.target.value as any
                                )
                              }
                              className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                                item.actionType === 'PROMOTE'
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : item.actionType === 'GRADUATE'
                                  ? 'bg-purple-50 border-purple-300 text-purple-800'
                                  : item.actionType === 'REPEAT'
                                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                                  : item.actionType === 'DROP'
                                  ? 'bg-sky-50 border-sky-300 text-sky-900'
                                  : item.actionType === 'RETIRE'
                                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                                  : 'bg-slate-50 border-slate-300 text-slate-800'
                              }`}
                            >
                              <option value="PROMOTE">🟢 เลื่อนชั้นปกติ (+1 ปี)</option>
                              <option value="REPEAT">⚠️ ซ้ำชั้น (คงชั้นปีเดิม)</option>
                              <option value="DROP">⏸️ รักษาสภาพ / ดรอป (คงปีเดิม)</option>
                              <option value="GRADUATE">🎓 สำเร็จการศึกษา</option>
                              <option value="RETIRE">❌ พ้นสภาพนิสิต</option>
                              <option value="CUSTOM">⚙️ กำหนดชั้นปีและสถานะเอง (Custom)</option>
                            </select>

                            {/* Custom Controls if selected */}
                            {item.actionType === 'CUSTOM' && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <select
                                  value={item.newYear}
                                  onChange={(e) =>
                                    handlePromotionCustomFieldChange(
                                      item.studentCode,
                                      'newYear',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] bg-white font-bold"
                                >
                                  <option value={1}>ปี 1</option>
                                  <option value={2}>ปี 2</option>
                                  <option value={3}>ปี 3</option>
                                  <option value={4}>ปี 4</option>
                                </select>
                                <select
                                  value={item.newStatus}
                                  onChange={(e) =>
                                    handlePromotionCustomFieldChange(
                                      item.studentCode,
                                      'newStatus',
                                      e.target.value
                                    )
                                  }
                                  className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] bg-white font-bold"
                                >
                                  <option value="ปกติ">ปกติ</option>
                                  <option value="ซ้ำชั้น">ซ้ำชั้น</option>
                                  <option value="รักษาสภาพ">รักษาสภาพ</option>
                                  <option value="สำเร็จการศึกษา">สำเร็จการศึกษา</option>
                                  <option value="เทียบโอน">เทียบโอน</option>
                                  <option value="พ้นสภาพ">พ้นสภาพ</option>
                                </select>
                              </div>
                            )}
                          </td>

                          {/* Proposed Result Preview */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-extrabold text-indigo-700">
                                ชั้นปีที่ {item.newYear}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                  item.newStatus === 'สำเร็จการศึกษา'
                                    ? 'bg-purple-100 text-purple-700 border-purple-200'
                                    : item.newStatus === 'ซ้ำชั้น'
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : item.newStatus === 'รักษาสภาพ'
                                    ? 'bg-sky-100 text-sky-800 border-sky-200'
                                    : item.newStatus === 'พ้นสภาพ'
                                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                                    : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {item.newStatus}
                              </span>
                            </div>
                          </td>

                          {/* Note / Exemption Remarks */}
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.note}
                              onChange={(e) =>
                                handlePromotionCustomFieldChange(
                                  item.studentCode,
                                  'note',
                                  e.target.value
                                )
                              }
                              placeholder="เช่น ติดแก้ I, ขอดรอป 1 เทอม"
                              className="w-full px-2.5 py-1 rounded-xl border border-slate-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="text-slate-500 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>
                  กำลังเลือกดำเนินการ <strong className="text-slate-900">{promotionStats.selectedCount}</strong> จาก{' '}
                  {promotionStats.total} คน
                </span>
                {promotionStats.repeatCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                    ⚠️ ซ้ำชั้น {promotionStats.repeatCount} คน
                  </span>
                )}
                {promotionStats.dropCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold text-[10px]">
                    ⏸️ รักษาสภาพ {promotionStats.dropCount} คน
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsPromotionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={promotionStats.selectedCount === 0 || promotionSubmitting}
                  onClick={() => setShowPromotionConfirm(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>
                    🚀 ตรวจสอบและยืนยันเลื่อนชั้นปี ({promotionStats.selectedCount} คน)
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 5: CONFIRMATION FOR BULK PROMOTION
         ───────────────────────────────────────────────────────────── */}
      {showPromotionConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  ยืนยันการดำเนินการเลื่อนชั้นปีการศึกษา
                </h3>
                <p className="text-xs text-slate-500">
                  กรุณาตรวจสอบสรุปยอดการปรับปรุงข้อมูลก่อนยืนยันบันทึก
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="font-bold text-slate-800 border-b pb-1.5 flex justify-between">
                <span>จำนวนนิสิตที่จะบันทึกอัปเดต:</span>
                <span className="text-indigo-700 font-extrabold text-sm">
                  {promotionStats.selectedCount} รูป/คน
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-emerald-700 font-semibold">🟢 เลื่อนชั้นปกติ (+1 ปี):</span>
                  <span className="font-bold">{promotionStats.promoteCount}</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-purple-700 font-semibold">🎓 สำเร็จการศึกษา:</span>
                  <span className="font-bold">{promotionStats.gradCount}</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-amber-700 font-semibold">⚠️ ซ้ำชั้น (คงปีเดิม):</span>
                  <span className="font-bold">{promotionStats.repeatCount}</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-sky-700 font-semibold">⏸️ รักษาสภาพ / ดรอป:</span>
                  <span className="font-bold">{promotionStats.dropCount}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>ข้อควรทราบ:</strong> การยืนยันนี้จะทำการปรับระดับชั้นปีและสถานภาพในฐานข้อมูลทันที และเตรียมซิงค์ไปยัง Google Sheets โดยอัตโนมัติ
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={promotionSubmitting}
                onClick={() => setShowPromotionConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                ย้อนกลับไปแก้ไข
              </button>
              <button
                type="button"
                disabled={promotionSubmitting}
                onClick={handleExecuteBulkPromotion}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {promotionSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึกข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>ยืนยันบันทึกเลื่อนชั้นปีทันที</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
