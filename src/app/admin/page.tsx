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
  Send
} from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf-export';

interface CertificateRequest {
  id: string;
  createdAt: string;
  studentCode: string;
  fullName: string;
  certType: string;
  degreeLevel?: string;
  major?: string;
  requestPurpose?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  docNo?: string;
  email?: string;
  phone?: string;
  targetAudience?: 'THAI' | 'INTERNATIONAL' | 'ALL';
  age?: number | string;
  gender?: string;
  nationality?: string;
  country?: string;
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
  bankTargetTh?: string;
  bankActionTh?: string;
  issueDateTh?: string;
  issueDateEn?: string;
  docTemplate?: string;
}

interface SignatoryItem {
  id: string;
  label: string;
  name: string;
  title: string;
  isDefault?: boolean;
}

interface SystemSettings {
  universityNameTh: string;
  universityNameEn: string;
  facultyNameTh: string;
  facultyNameEn: string;
  logoUrl: string;
  logoEmoji?: string;
  signerNameTh: string;
  signerTitleTh: string;
  signerNameEn: string;
  signerTitleEn: string;
  contactPhone: string;
  contactEmail: string;
  addressTh: string;
  addressEn: string;
  announcementText: string;
  signatories?: SignatoryItem[];
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  gmail?: string;
  department?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OFFICER' | 'INSTRUCTOR';
  coursesCount?: number;
  isActive?: boolean;
  isSuspended?: boolean;
  suspendReason?: string;
  isSuperAdmin?: boolean;
  createdAt?: string;
}

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

  // Document Customizer & Archiving States
  const [previewTemplate, setPreviewTemplate] = useState<'THAI_STANDARD' | 'BANK_LETTER' | 'ENG_CERT' | 'INTERNAL_MEMO'>('THAI_STANDARD');
  const [docFontSize, setDocFontSize] = useState<number>(15);
  const [docLineSpacing, setDocLineSpacing] = useState<number>(1.6);
  const [docSignerOffset, setDocSignerOffset] = useState<number>(20);
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
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    gmail: '',
    department: 'คณะพุทธศาสตร์ มจร',
    role: 'INSTRUCTOR' as 'SUPER_ADMIN' | 'ADMIN' | 'OFFICER' | 'INSTRUCTOR',
  });
  const [editUserSaving, setEditUserSaving] = useState(false);
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

  const handleReject = async (id: string) => {
    if (!confirm('ยืนยันที่จะปฏิเสธคำร้องนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch('/api/certificates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'REJECTED' }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess('ปฏิเสธคำร้องเรียบร้อยแล้ว');
        loadData();
      }
    } catch (err: any) {
      alert('ข้อผิดพลาด: ' + err.message);
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

  const handleStartEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setEditUserForm({
      name: user.name || '',
      email: user.email || '',
      gmail: user.gmail || '',
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
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-profile',
          userId: editingUser.id,
          updates: editUserForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`แก้ไขข้อมูลอีเมลและโปรไฟล์ของ ${editUserForm.name} สำเร็จ`);
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
  const filteredUsers = users.filter((u) => {
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
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                                      >
                                        อนุมัติ
                                      </button>
                                    )}
                                    {r.status === 'PENDING' && (
                                      <button
                                        onClick={() => handleReject(r.id)}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                                      >
                                        ปฏิเสธ
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setPreviewRequest(r)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1"
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

                <div className="flex items-center gap-2">
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
                      {filteredUsers.slice(0, 50).map((u) => {
                        const isSuper = u.role === 'SUPER_ADMIN' || u.isSuperAdmin || u.email === 'phaisal.dis@mcu.ac.th';
                        const isSuspended = !isSuper && (u.isSuspended || u.isActive === false);

                        return (
                          <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${isSuspended ? 'bg-rose-50/30' : ''}`}>
                            <td className="px-5 py-3.5 font-medium text-slate-900">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-xl border text-slate-700 font-bold flex items-center justify-center shrink-0 ${
                                  isSuper ? 'bg-purple-100 border-purple-300 text-purple-800' : isSuspended ? 'bg-rose-100 border-rose-300 text-rose-800' : 'bg-slate-100 border-slate-200'
                                }`}>
                                  {isSuper ? '👑' : isSuspended ? '⛔' : u.name ? u.name.charAt(0) : 'อ'}
                                </div>
                                <div>
                                  <div className="font-bold flex items-center gap-1.5">
                                    <span>{u.name}</span>
                                    {isSuper && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                        SUPER ADMIN
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400">ID: {u.id}</div>
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
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {isSuper
                                  ? '👑 ผู้ดูแลระบบสูงสุด'
                                  : u.role === 'ADMIN'
                                  ? 'ผู้ดูแลระบบ'
                                  : u.role === 'OFFICER'
                                  ? 'เจ้าหน้าที่'
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
                                  <span>ถูกระงับการใช้</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>ปกติ</span>
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
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
                        value={settings.contactPhone}
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
                        value={settings.contactEmail}
                        onChange={(e) =>
                          setSettings({ ...settings, contactEmail: e.target.value })
                        }
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
                <div className="flex items-center gap-2">
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

              {/* Students Data Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
                      <tr>
                        <th className="px-5 py-3.5">รหัสนิสิต</th>
                        <th className="px-5 py-3.5">ชื่อ - นามสกุล</th>
                        <th className="px-5 py-3.5">สัญชาติ / Passport</th>
                        <th className="px-5 py-3.5">หลักสูตร / ชั้นปี</th>
                        <th className="px-5 py-3.5 text-center">สถานภาพ</th>
                        <th className="px-5 py-3.5 text-center">เกรด (GPA)</th>
                        <th className="px-5 py-3.5 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-400">
                            ไม่พบข้อมูลนิสิตตามเงื่อนไขที่เลือก
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.slice(0, 50).map((s) => {
                          const isEnglish = s.programType === 'ENGLISH' || (s.nationality !== 'ไทย' && s.nationality !== 'Thai' && Boolean(s.passportNo));

                          return (
                            <tr key={s.studentCode || s.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-3.5 font-mono font-bold text-orange-700">
                                {s.studentCode}
                              </td>
                              <td className="px-5 py-3.5 font-medium text-slate-900">
                                <div>{s.fullName || `${s.firstName || ''} ${s.lastName || ''}`}</div>
                                <div className="text-[11px] text-slate-400">{s.email || '-'}</div>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="text-slate-700 font-medium">
                                  {s.nationality === 'ไทย' || s.nationality === 'Thai' ? '🇹🇭 ไทย' : `🌐 ${s.nationality || 'ต่างชาติ'}`}
                                </div>
                                {s.passportNo && (
                                  <div className="font-mono text-[11px] text-purple-700">
                                    Pass: {formatPassport(s.passportNo)}
                                  </div>
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
                                  {isEnglish ? '🌐 EN Program' : '🇹🇭 ภาคไทย'}
                                </span>
                                <span className="ml-1.5 text-slate-500 text-[11px]">
                                  ปี {s.yearLevel || 1}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-center">
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
                              <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-700">
                                {s.gpa ? Number(s.gpa).toFixed(2) : '-'}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <Link
                                  href={`/students?search=${s.studentCode}`}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 transition inline-flex items-center gap-1"
                                >
                                  <span>แก้ไขข้อมูล</span>
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
                <div className="flex items-center gap-2">
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
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  ตัวอย่างเอกสารทางการ (Official Document Preview)
                </h3>
              </div>
              <button
                onClick={() => setPreviewRequest(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
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
                {/* Font Size */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm">
                  <Type className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-semibold text-slate-600">ฟอนต์:</span>
                  <button
                    type="button"
                    onClick={() => setDocFontSize((s) => Math.max(12, s - 1))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                    title="ลดขนาดตัวอักษร"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-bold text-purple-800">{docFontSize}pt</span>
                  <button
                    type="button"
                    onClick={() => setDocFontSize((s) => Math.min(22, s + 1))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                    title="เพิ่มขนาดตัวอักษร"
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

                {/* Signature Offset */}
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
                <span><b>คำแนะนำ:</b> ท่านสามารถใช้เมาส์คลิกที่ข้อความใดๆ ในเอกสารด้านล่างนี้ เพื่อพิมพ์แก้ไขคำ เปลี่ยนชื่อธนาคาร หรือปรับข้อความได้ทันทีก่อนสั่งพิมพ์หรือดาวน์โหลด PDF</span>
              </div>
            </div>

            {/* Official Paper Letter Canvas */}
            <div
              id="printable-certificate"
              style={{
                fontSize: `${docFontSize}pt`,
                lineHeight: docLineSpacing,
              }}
              className="p-8 sm:p-12 bg-white border border-slate-300 rounded-xl shadow-inner font-serif text-slate-900 space-y-4 print:m-0 print:p-0 print:border-none print:shadow-none"
            >
              {/* TEMPLATE 1: BANK_LETTER (หนังสือขอความอนุเคราะห์ธนาคาร หน้า 1) */}
              {previewTemplate === 'BANK_LETTER' && (
                <div className="space-y-4 text-justify">
                  {/* Top Reference */}
                  <div className="flex justify-between items-start text-xs border-b pb-2">
                    <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                      ที่ อว 8002 / {previewRequest.docNo || '077'}
                    </div>
                    <div contentEditable suppressContentEditableWarning className="text-right outline-none focus:bg-purple-50">
                      {new Date(previewRequest.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
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

                  <p contentEditable suppressContentEditableWarning className="indent-8 outline-none focus:bg-purple-50 pt-2">
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

                  <p contentEditable suppressContentEditableWarning className="indent-8 outline-none focus:bg-purple-50">
                    จึงเจริญพรมาเพื่อให้ความอนุเคราะห์ในเรื่องการเปิดบัญชีหรืออัพเดตการใช้งานแอปพลิเคชั่นของธนาคารแก่นิสิตดังกล่าว จักขอบคุณยิ่ง
                  </p>

                  <div className="pt-4 text-center ml-auto w-72 space-y-1 text-xs" style={{ marginTop: `${docSignerOffset}px` }}>
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
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                      {settings.universityNameTh}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 space-y-0.5">
                      <p className="font-bold text-slate-800">ติดต่อผู้ประสานงาน:</p>
                      <p>สำนักงานคณะพุทธศาสตร์</p>
                      <p>โทร. 089-516-7544 / 095-470-7849</p>
                    </div>
                    {showQrCode && qrCodeDataUrl && (
                      <div className="flex items-center gap-2 p-1.5 bg-slate-50 border rounded-lg">
                        <img src={qrCodeDataUrl} alt="Verify" className="w-14 h-14 object-contain" />
                        <div className="text-[10px] text-slate-500 font-mono">
                          อว 8002/{previewRequest.docNo || previewRequest.id}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TEMPLATE 2: ENG_CERT (TO WHOM IT MAY CONCERN หน้า PDF 2) */}
              {previewTemplate === 'ENG_CERT' && (
                <div className="space-y-4 text-justify font-sans">
                  {/* Top Dean Header */}
                  <div className="flex justify-between items-start text-xs border-b pb-3">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 space-y-0.5">
                      <p className="font-bold">Office of Dean</p>
                      <p>Tel. 0-3524-8000 ext. 8323</p>
                      <p>Fax. 0-3524-8096</p>
                      <p className="text-purple-700">https://fb.mcu.ac.th/</p>
                    </div>
                    <div contentEditable suppressContentEditableWarning className="font-mono font-bold text-right outline-none focus:bg-purple-50">
                      MCU No. 8002 / {previewRequest.docNo || '166'}
                    </div>
                  </div>

                  <div contentEditable suppressContentEditableWarning className="text-center font-bold text-lg tracking-wider pt-2 pb-1 outline-none focus:bg-purple-50">
                    TO WHOM IT MAY CONCERN
                  </div>

                  <p contentEditable suppressContentEditableWarning className="indent-8 outline-none focus:bg-purple-50">
                    This is to certify that <strong className="font-bold">{previewRequest.fullName}</strong>, whose age is{' '}
                    <strong className="font-bold">{previewRequest.age || '29'}</strong> years old,{' '}
                    <strong className="font-bold">{previewRequest.nationality || 'Myanmar'}</strong> Nationality, holding Passport No.{' '}
                    <strong className="font-mono font-bold">{previewRequest.passportNo || 'MF772427'}</strong>, is currently enrolled as a student of the Faculty of Buddhism, Mahachulalongkornrajavidyalaya University, Lamsai Sub-District, Wangnoi District, Phra Nakhon Si Ayutthaya Province, 13170, Thailand. He/She is studying in the {previewRequest.degreeLevel || 'Bachelor of Arts Program (4-Year Undergraduate Program)'}, Major in {previewRequest.major || 'Religion and Philosophy (English Program)'}, Year 4, in the second semester of an Academic Year 2026, His/Her student identification is <strong className="font-mono font-bold">{previewRequest.studentCode}</strong>.
                  </p>

                  <p contentEditable suppressContentEditableWarning className="indent-8 outline-none focus:bg-purple-50">
                    This letter of certification is therefore issued as evidence.
                  </p>

                  <div contentEditable suppressContentEditableWarning className="text-center text-xs outline-none focus:bg-purple-50 pt-2">
                    Issued on {new Date(previewRequest.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>

                  {/* Signer Block & Photo Box */}
                  <div className="pt-6 flex justify-between items-end" style={{ marginTop: `${docSignerOffset}px` }}>
                    <div className="space-y-3">
                      {showPhotoBox && (
                        <div className="w-28 h-36 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs p-2 text-center">
                          <span>ติดรูปถ่าย<br />Photo 1.5 - 2&quot;</span>
                        </div>
                      )}
                      {showStudentSign && (
                        <div className="text-xs text-slate-600 pt-1">
                          <p>Signature ....................................................</p>
                          <p className="mt-1 font-bold">({previewRequest.fullName})</p>
                        </div>
                      )}
                    </div>

                    <div className="text-center space-y-1 text-xs min-w-[240px]">
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                        ({customSigner.name ? customSigner.name : 'Asst. Prof. Phrakhru Sirirattanabundit, Ph.D.'})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        {customSigner.title ? customSigner.title : 'Vice Dean, Faculty of Buddhism'}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        Mahachulalongkornrajavidyalaya University
                      </div>
                      {showQrCode && qrCodeDataUrl && (
                        <div className="pt-2 flex justify-center">
                          <img src={qrCodeDataUrl} alt="QR" className="w-16 h-16 object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 3: INTERNAL_MEMO (บันทึกข้อความราชการ หน้า 10) */}
              {previewTemplate === 'INTERNAL_MEMO' && (
                <div className="space-y-4 text-justify">
                  {/* Garuda Crest & Heading */}
                  <div className="flex items-center gap-4 border-b pb-3">
                    <div className="w-14 h-14 rounded-full bg-slate-50 border flex items-center justify-center p-1 overflow-hidden shrink-0">
                      <span className="text-3xl">🦅</span>
                    </div>
                    <div className="text-center flex-1">
                      <h2 className="text-2xl font-black tracking-wide">บันทึกข้อความ</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-b pb-3">
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

                  <p contentEditable suppressContentEditableWarning className="indent-8 outline-none focus:bg-purple-50">
                    ด้วย <strong className="font-bold">{previewRequest.fullName}</strong> รหัสนิสิต <strong className="font-mono font-bold">{previewRequest.studentCode}</strong> อายุ {previewRequest.age || '-'} ปี สัญชาติ {previewRequest.nationality || '-'} {previewRequest.passportNo && <>ถือหนังสือเดินทางเลขที่ {previewRequest.passportNo}</>} เป็นนิสิตคณะพุทธศาสตร์ หลักสูตร{previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'} สาขาวิชา{previewRequest.major || 'พระพุทธศาสนา'} ได้ยื่นคำร้องเพื่อขอรับรอง{previewRequest.requestPurpose || previewRequest.certType}
                  </p>

                  <p contentEditable suppressContentEditableWarning className="indent-8 outline-none focus:bg-purple-50">
                    ในการนี้ คณะพุทธศาสตร์ จึงขอความอนุเคราะห์ในการออกหนังสือรับรองให้แก่นิสิตดังกล่าว เพื่อเป็นเอกสารประกอบการดำเนินการต่อไป
                  </p>

                  <p contentEditable suppressContentEditableWarning className="indent-8 outline-none focus:bg-purple-50">
                    จึงเรียนมาเพื่อโปรดทราบและดำเนินการต่อไป
                  </p>

                  <div className="pt-6 text-center ml-auto w-72 space-y-1 text-xs" style={{ marginTop: `${docSignerOffset}px` }}>
                    <div className="h-10" />
                    <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                      ({customSigner.name || 'พระครูสิริรัตนบัณฑิต, ผศ.ดร.'})
                    </div>
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                      {customSigner.title || 'รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์'}
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 4: THAI_STANDARD (หนังสือรับรองนิสิตมาตรฐานภาษาไทย หน้า 2-9) */}
              {previewTemplate === 'THAI_STANDARD' && (
                <div className="space-y-4 text-justify">
                  {/* Header Reference */}
                  <div className="flex justify-between items-start text-xs border-b pb-3">
                    <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                      ที่ อว 8002 / {previewRequest.docNo || 'xxx'}
                    </div>
                    <div contentEditable suppressContentEditableWarning className="text-right text-slate-500 outline-none focus:bg-purple-50">
                      สำนักงานคณะพุทธศาสตร์ มจร.
                    </div>
                  </div>

                  <div contentEditable suppressContentEditableWarning className="text-center font-bold text-xl pt-2 pb-1 outline-none focus:bg-purple-50">
                    หนังสือรับรอง
                  </div>

                  <p contentEditable suppressContentEditableWarning className="indent-8 leading-relaxed outline-none focus:bg-purple-50">
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
                    {previewRequest.studentCode.substring(0, 2) ? '2' : '1'} สาขาวิชา{previewRequest.major || 'พระพุทธศาสนา'}{' '}
                    ({previewRequest.nationality === 'ไทย' || previewRequest.nationality === 'Thai' ? 'ภาคภาษาไทย' : 'ภาคภาษาอังกฤษ'}) มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย รหัสประจำตัวนิสิต{' '}
                    <strong className="font-mono font-bold">{previewRequest.studentCode}</strong> เพื่อเป็นหลักฐาน สำหรับ
                    <strong className="font-bold underline ml-1">{previewRequest.requestPurpose || previewRequest.certType}</strong> จึงออกหนังสือนี้ไว้เป็นสำคัญ
                  </p>

                  <div contentEditable suppressContentEditableWarning className="text-center text-xs pt-2 outline-none focus:bg-purple-50">
                    ให้ไว้ ณ วันที่ {new Date(previewRequest.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>

                  {/* Signer Block & Photo Box */}
                  <div className="pt-6 flex justify-between items-end" style={{ marginTop: `${docSignerOffset}px` }}>
                    <div className="space-y-3">
                      {showPhotoBox && (
                        <div className="w-28 h-36 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs p-2 text-center">
                          <span>ติดรูปถ่าย<br />1.5 - 2 นิ้ว</span>
                        </div>
                      )}
                      {showStudentSign && (
                        <div className="text-xs text-slate-600 pt-1">
                          <p>ลงชื่อ ..............................................................</p>
                          <p className="mt-1 font-bold">({previewRequest.fullName})</p>
                        </div>
                      )}
                      <div contentEditable suppressContentEditableWarning className="text-[11px] text-slate-500 pt-1 outline-none focus:bg-purple-50">
                        <p className="font-bold text-slate-700">สำนักงานคณะพุทธศาสตร์</p>
                        <p>โทรศัพท์ 035-247-8000 ต่อ 8323</p>
                        <p className="text-purple-700 font-mono">https://fb.mcu.ac.th/</p>
                      </div>
                    </div>

                    <div className="text-center space-y-1.5 text-xs min-w-[240px]">
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold text-slate-900 outline-none focus:bg-purple-50">
                        ({customSigner.name || 'พระครูสิริรัตนบัณฑิต, ผศ.ดร.'})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-700 font-medium outline-none focus:bg-purple-50">
                        {customSigner.title || 'รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์'}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-[11px] text-slate-500 outline-none focus:bg-purple-50">
                        {settings.facultyNameTh} {settings.universityNameTh}
                      </div>
                      {showQrCode && qrCodeDataUrl && (
                        <div className="pt-2 flex justify-center">
                          <img src={qrCodeDataUrl} alt="QR Code" className="w-16 h-16 object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-certificate, #printable-certificate * {
                  visibility: visible !important;
                }
                #printable-certificate {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 20mm 25mm !important;
                  background: white !important;
                  border: none !important;
                  box-shadow: none !important;
                }
              }
            `}</style>
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
    </div>
  );
}
