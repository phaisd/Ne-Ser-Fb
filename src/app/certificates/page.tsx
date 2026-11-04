'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Send,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  GraduationCap,
  Home,
  Award,
  Landmark,
  Smartphone,
  Globe,
  PlaneTakeoff,
  Printer,
  Eye,
  CheckCircle2,
  FileCheck,
  MapPin,
  BookOpen,
  UserCheck,
  X,
  Download,
  Calendar,
  UserCog,
  Layers,
  Type,
  MoveVertical,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Paperclip,
  UploadCloud,
  FileCheck2,
  Camera
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
  signerNameTh?: string;
  signerTitleTh?: string;
  signerNameEn?: string;
  signerTitleEn?: string;
  coordinatorNameTh?: string;
  coordinatorPhoneTh?: string;
  rejectReason?: string;
  note?: string;
  enrollmentSlipUrl?: string;
  passportCopyUrl?: string;
  photoUrl?: string;
  attachmentUrl?: string;
}

interface CertTypeItem {
  id: string;
  code?: string;
  name: string;
  targetAudience: 'THAI' | 'INTERNATIONAL' | 'ALL';
  badge?: string;
  category?: string;
  iconName?: string;
  description?: string;
  templateType?: string;
}

interface Student {
  studentCode: string;
  fullName?: string;
  title?: string;
  firstName: string;
  lastName: string;
  major?: string;
  degree?: string;
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
}

export default function CertificatesPage() {
  const [activeTab, setActiveTab] = useState<'REQUEST' | 'TRACK' | 'ADMIN'>('REQUEST');
  const [certTypes, setCertTypes] = useState<CertTypeItem[]>([]);
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter for Certificate Type Cards
  const [cardAudienceFilter, setCardAudienceFilter] = useState<'ALL' | 'THAI' | 'INTERNATIONAL'>('ALL');
  const [selectedCert, setSelectedCert] = useState<CertTypeItem | null>(null);

  // Form Fields
  const [studentCode, setStudentCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [major, setMajor] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('ปริญญาตรี');
  const [requestPurpose, setRequestPurpose] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Extended Profile Fields (From ทะเบียนนิสิต / Excel)
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('ชาย');
  const [nationality, setNationality] = useState('');
  const [country, setCountry] = useState('');
  const [passportNo, setPassportNo] = useState('');
  const [passportExpireDate, setPassportExpireDate] = useState('');
  const [visaType, setVisaType] = useState('Non-Immigrant Visa');
  const [visaExpireDate, setVisaExpireDate] = useState('');
  const [gpa, setGpa] = useState('');
  const [address, setAddress] = useState('');
  const [subdistrict, setSubdistrict] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Bank Specific Fields
  const [bankTargetTh, setBankTargetTh] = useState('ผู้จัดการธนาคารกรุงไทย สาขาโลตัส นวนคร');
  const [bankActionTh, setBankActionTh] = useState('เปิดบัญชีธนาคารและเปิดใช้งานแอปพลิเคชั่น Mobile Banking');

  // Supporting Documents Upload States
  const [enrollmentSlipUrl, setEnrollmentSlipUrl] = useState<string>('');
  const [passportCopyUrl, setPassportCopyUrl] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [uploadingDoc, setUploadingDoc] = useState<'enrollment' | 'passport' | 'photo' | null>(null);

  const handleFileUpload = async (file: File, type: 'enrollment' | 'passport' | 'photo') => {
    setUploadingDoc(type);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (type === 'enrollment') setEnrollmentSlipUrl(data.url);
        else if (type === 'passport') setPassportCopyUrl(data.url);
        else if (type === 'photo') setPhotoUrl(data.url);
      } else {
        alert('อัปโหลดไฟล์ล้มเหลว: ' + (data.error || 'ไม่สามารถอัปโหลดได้'));
      }
    } catch (err: any) {
      alert('อัปโหลดไฟล์ล้มเหลว: ' + err.message);
    } finally {
      setUploadingDoc(null);
    }
  };

  // PDPA Data Masking Helper (Best Practice)
  const maskPassport = (no?: string) => {
    if (!no) return '';
    const clean = no.trim();
    if (clean.length <= 4) return '••••';
    return `${clean.slice(0, 2)}••••${clean.slice(-2)}`;
  };

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Track & Search & Year Filter
  const [trackCode, setTrackCode] = useState('');
  const [filterCertYear, setFilterCertYear] = useState<string>('ALL');

  // Preview / Print Modal
  const [previewRequest, setPreviewRequest] = useState<CertificateRequest | null>(null);
  const [pdfDownloading, setPdfDownloading] = useState<boolean>(false);

  // Document Customizer States for Preview
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
  const [customSigner, setCustomSigner] = useState({
    name: 'พระครูสิริรัตนบัณฑิต, ผศ.ดร.',
    title: 'รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์',
  });

  useEffect(() => {
    if (previewRequest) {
      if (previewRequest.docTemplate === 'BANK_LETTER' || previewRequest.certType?.includes('ธนาคาร') || previewRequest.bankTargetTh) {
        setPreviewTemplate('BANK_LETTER');
      } else if (previewRequest.docTemplate === 'ENG_CERT' || previewRequest.certType?.includes('English') || previewRequest.certType?.includes('CONCERN')) {
        setPreviewTemplate('ENG_CERT');
      } else if (previewRequest.docTemplate === 'INTERNAL_MEMO') {
        setPreviewTemplate('INTERNAL_MEMO');
      } else {
        setPreviewTemplate('THAI_STANDARD');
      }
    }
  }, [previewRequest]);

  const handleDownloadPdf = async () => {
    if (!previewRequest) return;
    setPdfDownloading(true);
    try {
      const safeName = (previewRequest.fullName || 'student').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');
      const filename = `หนังสือรับรอง_${safeName}_อว8002-${previewRequest.docNo || previewRequest.id}.pdf`;
      await exportElementToPdf('printable-student-cert', filename);
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใช้ปุ่มพิมพ์เอกสาร');
    } finally {
      setPdfDownloading(false);
    }
  };

  // System Settings (Contact, Faculty, Web URLs)
  const [settings, setSettings] = useState<any>({
    facultyNameTh: 'คณะพุทธศาสตร์',
    facultyNameEn: 'Faculty of Buddhism',
    contactPhone: '035-248-000 ต่อ 8323',
    websiteUrl: 'https://fb.mcu.ac.th/',
    systemServiceUrl: 'https://fb-service.mcu.ac.th/',
  });

  // Available Buddhist Years in Certificate Requests
  const availableCertYears = useMemo(() => {
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

  // Filtered Requests for Track & Admin
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (trackCode.trim()) {
        const q = trackCode.trim().toLowerCase();
        const match =
          r.studentCode?.toLowerCase().includes(q) ||
          r.id?.toLowerCase().includes(q) ||
          r.fullName?.toLowerCase().includes(q) ||
          r.docNo?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterCertYear !== 'ALL' && r.createdAt) {
        const yr = String(new Date(r.createdAt).getFullYear() + 543);
        if (yr !== filterCertYear) return false;
      }
      return true;
    });
  }, [requests, trackCode, filterCertYear]);

  useEffect(() => {
    fetch('/api/system-settings')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) setSettings(res.data);
      })
      .catch(() => {});

    Promise.all([
      fetch('/api/certificates?action=types').then((res) => res.json()),
      fetch('/api/certificates').then((res) => res.json()),
      fetch('/api/students').then((res) => res.json()),
    ])
      .then(([typesRes, reqsRes, studentsRes]) => {
        if (typesRes.success && typesRes.data) {
          setCertTypes(typesRes.data);
          if (typesRes.data.length > 0) {
            setSelectedCert(typesRes.data[0]);
          }
        }
        if (reqsRes.success) setRequests(reqsRes.data);
        if (studentsRes.success) {
          setStudents(studentsRes.data);
          // Auto-fill logged-in student info
          try {
            const stored = localStorage.getItem('mcu_current_user');
            if (stored) {
              const u = JSON.parse(stored);
              if (u.role === 'STUDENT' && u.studentCode) {
                setStudentCode(u.studentCode);
                setTrackCode(u.studentCode);
                const found = studentsRes.data.find((s: any) => s.studentCode === u.studentCode);
                if (found) {
                  const studentFullName = found.fullName || `${found.title || ''} ${found.firstName} ${found.lastName}`.trim();
                  setFullName(studentFullName);
                  setMajor(found.major || '');
                  setDegreeLevel(found.degree || 'ปริญญาตรี');
                  if (found.phoneNumber) setPhone(found.phoneNumber);
                  if (found.email) setEmail(found.email);
                  if (found.age) setAge(String(found.age));
                  if (found.gender) setGender(found.gender);
                  if (found.nationality) setNationality(found.nationality);
                  if (found.country) setCountry(found.country);
                  if (found.passportNo) setPassportNo(found.passportNo);
                  if (found.passportExpireDate) setPassportExpireDate(found.passportExpireDate);
                  if (found.visaType) setVisaType(found.visaType);
                  if (found.visaExpireDate) setVisaExpireDate(found.visaExpireDate);
                  if (found.gpa) setGpa(String(found.gpa));
                  if (found.address) setAddress(found.address);
                  if (found.subdistrict) setSubdistrict(found.subdistrict);
                  if (found.district) setDistrict(found.district);
                  if (found.province) setProvince(found.province);
                  if (found.postalCode) setPostalCode(found.postalCode);
                }
              }
            }
          } catch (e) {}
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Auto-fill student info when entering student code
  const handleStudentCodeChange = (code: string) => {
    setStudentCode(code);
    const found = students.find((s) => s.studentCode === code.trim());
    if (found) {
      const studentFullName = found.fullName || `${found.title || ''} ${found.firstName} ${found.lastName}`.trim();
      setFullName(studentFullName);
      setMajor(found.major || '');
      setDegreeLevel(found.degree || 'ปริญญาตรี');
      if (found.phoneNumber) setPhone(found.phoneNumber);
      if (found.email) setEmail(found.email);

      // Fill extended profile fields
      if (found.age) setAge(String(found.age));
      if (found.gender) setGender(found.gender);
      if (found.nationality) setNationality(found.nationality);
      if (found.country) setCountry(found.country);
      if (found.passportNo) setPassportNo(found.passportNo);
      if (found.passportExpireDate) setPassportExpireDate(found.passportExpireDate);
      if (found.visaType) setVisaType(found.visaType);
      if (found.visaExpireDate) setVisaExpireDate(found.visaExpireDate);
      if (found.gpa) setGpa(String(found.gpa));
      if (found.address) setAddress(found.address);
      if (found.subdistrict) setSubdistrict(found.subdistrict);
      if (found.district) setDistrict(found.district);
      if (found.province) setProvince(found.province);
      if (found.postalCode) setPostalCode(found.postalCode);

      // Auto switch card filter based on student nationality
      const isThai = found.nationality === 'ไทย' || found.nationality === 'Thai';
      if (isThai) {
        setCardAudienceFilter('THAI');
        const defaultThai = certTypes.find((c) => c.targetAudience === 'THAI');
        if (defaultThai) setSelectedCert(defaultThai);
      } else if (found.nationality) {
        setCardAudienceFilter('INTERNATIONAL');
        const defaultInt = certTypes.find((c) => c.targetAudience === 'INTERNATIONAL');
        if (defaultInt) setSelectedCert(defaultInt);
      }
    }
  };

  const handleCardSelect = (item: CertTypeItem) => {
    setSelectedCert(item);
    if (!requestPurpose || requestPurpose === selectedCert?.name) {
      setRequestPurpose(item.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode || !fullName || !selectedCert) {
      alert('กรุณากรอกรหัสนิสิต, ชื่อ-สกุล และเลือกประเภทหนังสือรับรอง');
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(null);
    try {
      const payload: any = {
        studentCode,
        fullName,
        certType: selectedCert.name,
        targetAudience: selectedCert.targetAudience,
        degreeLevel,
        major,
        requestPurpose: requestPurpose || selectedCert.name,
        email,
        phone,
        age,
        gender,
        nationality: nationality || (selectedCert.targetAudience === 'THAI' ? 'ไทย' : 'International'),
        country,
        passportNo,
        passportExpireDate,
        visaType,
        visaExpireDate,
        gpa,
        address,
        subdistrict,
        district,
        province,
        postalCode,
        bankTargetTh,
        bankActionTh,
        docTemplate: selectedCert.templateType,
        enrollmentSlipUrl: enrollmentSlipUrl || undefined,
        passportCopyUrl: passportCopyUrl || undefined,
        photoUrl: photoUrl || undefined,
        status: 'PENDING',
      };

      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(
          `ยื่นคำร้องสำเร็จ! รหัสคำร้อง: ${data.data.id} สำหรับ [${selectedCert.name}] ข้อมูลถูกส่งเข้าสู่ระบบและ Google Sheets เรียบร้อยแล้ว`
        );
        setRequests((prev) => [data.data, ...prev]);
        // Reset form
        setStudentCode('');
        setFullName('');
        setRequestPurpose('');
        setEnrollmentSlipUrl('');
        setPassportCopyUrl('');
        setPhotoUrl('');
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('ยื่นคำร้องล้มเหลว: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Cards
  const visibleCards = certTypes.filter((c) => {
    if (cardAudienceFilter === 'ALL') return true;
    return c.targetAudience === cardAudienceFilter || c.targetAudience === 'ALL';
  });

  // Helper icon renderer
  const renderCertIcon = (iconName?: string, target?: string) => {
    const iconClass =
      target === 'THAI'
        ? 'w-6 h-6 text-blue-600'
        : 'w-6 h-6 text-purple-600';

    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className={iconClass} />;
      case 'Home':
        return <Home className={iconClass} />;
      case 'Award':
        return <Award className={iconClass} />;
      case 'Landmark':
        return <Landmark className={iconClass} />;
      case 'Smartphone':
        return <Smartphone className={iconClass} />;
      case 'Globe':
        return <Globe className={iconClass} />;
      case 'PlaneTakeoff':
        return <PlaneTakeoff className={iconClass} />;
      case 'FileCheck':
        return <FileCheck className={iconClass} />;
      case 'MapPin':
        return <MapPin className={iconClass} />;
      case 'BookOpen':
        return <BookOpen className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-600" />
            ระบบหนังสือรับรองและคำร้อง (Certificates Portal)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เลือกประเภทหนังสือรับรองแบบการ์ด แยกหมวดหมู่นิสิตไทยและนิสิตต่างชาติ พร้อมออกเอกสารและซิงค์ Google Sheets
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto text-sm font-semibold">
          <button
            onClick={() => setActiveTab('REQUEST')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'REQUEST'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            แบบฟอร์มยื่นคำร้อง
          </button>
          <button
            onClick={() => setActiveTab('TRACK')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'TRACK'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เช็คสถานะคำร้อง
          </button>
          <button
            onClick={() => setActiveTab('ADMIN')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'ADMIN'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            รายการทั้งหมด ({requests.length})
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-purple-600 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
          <button onClick={() => setSubmitSuccess(null)} className="text-purple-600 hover:text-purple-800 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* ----------------- 1. REQUEST FORM TAB ----------------- */}
      {activeTab === 'REQUEST' && (
        <div className="space-y-6">
          {/* Important Notices for Students (กล่องแจ้งเตือนสำคัญก่อนเลือกประเภทหนังสือ) */}
          {(settings.visaAlertEnabled !== false || settings.timelineAlertEnabled !== false || settings.accuracyAlertEnabled !== false) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* กล่องที่ 1: แจ้งเตือนสีแดง (สำหรับการต่อวีซ่า 30 วัน) */}
              {settings.visaAlertEnabled !== false && (
                <div className="p-4 sm:p-5 rounded-2xl bg-red-50/90 border-2 border-red-400 text-red-950 shadow-sm flex items-start gap-3.5 transition-all hover:shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-600/30 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-200/90 text-red-900 font-extrabold text-[10px] uppercase tracking-wider">
                      ⚠️ แจ้งเตือนสำคัญ (Visa Alert)
                    </span>
                    <p className="font-bold text-sm text-red-950 leading-snug">
                      {settings.visaAlertTitle || 'สำหรับการต่อวีซ่า ให้ดำเนินการก่อนหนังสือเดินทางหมดอายุ 30 วัน'}
                    </p>
                    {settings.visaAlertDesc && (
                      <p className="text-xs text-red-800 leading-relaxed">
                        {settings.visaAlertDesc}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* กล่องที่ 2: ระยะเวลาดำเนินการ (1-2 วัน ไม่นับวันหยุด / ตรวจดูสถานะ "อนุมัติ") */}
              {settings.timelineAlertEnabled !== false && (
                <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/90 border-2 border-sky-400 text-sky-950 shadow-sm flex items-start gap-3.5 transition-all hover:shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-600/30 mt-0.5">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-200/90 text-sky-900 font-extrabold text-[10px] uppercase tracking-wider">
                      ⏱️ ระยะเวลาดำเนินการ (Timeline)
                    </span>
                    <p className="font-bold text-sm text-sky-950 leading-snug">
                      {settings.timelineAlertTitle || 'การดำเนินการ จะเสร็จสิ้น ประมาณ 1-2 วัน ไม่นับวันหยุด หรือ กรุณาตรวจดูเส้นทางการดำเนินการหนังสือว่า "อนุมัติ"'}
                    </p>
                    {settings.timelineAlertDesc && (
                      <p className="text-xs text-sky-800 leading-relaxed">
                        {settings.timelineAlertDesc}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* กล่องที่ 3: ความถูกต้องครบถ้วนของข้อมูล (มิฉะนั้นจะยกเลิกการขอ) */}
              {settings.accuracyAlertEnabled !== false && (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border-2 border-amber-400 text-amber-950 shadow-sm flex items-start gap-3.5 transition-all hover:shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30 mt-0.5">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-200/90 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider">
                      📋 ความถูกต้องของข้อมูล (Accuracy)
                    </span>
                    <p className="font-bold text-sm text-amber-950 leading-snug">
                      {settings.accuracyAlertTitle || 'กรุณากรอกข้อมูลให้ครบถ้วน มิฉะนั้นเอกสารจะไม่สมบูรณ์และจะยกเลิกการขอหนังสือ'}
                    </p>
                    {settings.accuracyAlertDesc && (
                      <p className="text-xs text-amber-800 leading-relaxed">
                        {settings.accuracyAlertDesc}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section A: Card Selector */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-black">
                    1
                  </span>
                  เลือกประเภทหนังสือรับรองที่ต้องการ (คลิกที่การ์ด)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  กรุณาตรวจสอบว่าหนังสือสำหรับคนไทยหรือสำหรับนิสิตต่างชาติ เพื่อให้ออกเอกสารถูกต้องตามระเบียบ
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCardAudienceFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    cardAudienceFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด ({certTypes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCardAudienceFilter('THAI')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    cardAudienceFilter === 'THAI'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <span>🇹🇭 สำหรับคนไทย</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardAudienceFilter('INTERNATIONAL')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    cardAudienceFilter === 'INTERNATIONAL'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <span>🌐 นิสิตต่างชาติ</span>
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleCards.map((card) => {
                const isSelected = selectedCert?.id === card.id;
                const isThai = card.targetAudience === 'THAI';

                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardSelect(card)}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-left flex flex-col justify-between ${
                      isSelected
                        ? isThai
                          ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20'
                          : 'border-purple-600 bg-purple-50/40 shadow-md ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Card Header: Icon & Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            isThai ? 'bg-blue-100' : 'bg-purple-100'
                          }`}
                        >
                          {renderCertIcon(card.iconName, card.targetAudience)}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isThai ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                              🇹🇭 นิสิตไทย
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">
                              🌐 ต่างชาติ (Intl)
                            </span>
                          )}

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Title & Code */}
                      <h3
                        className={`font-bold text-sm leading-snug line-clamp-2 ${
                          isSelected
                            ? isThai
                              ? 'text-blue-900'
                              : 'text-purple-900'
                            : 'text-slate-800'
                        }`}
                      >
                        {card.name}
                      </h3>

                      <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    {/* Bottom Status */}
                    <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-400 font-semibold">{card.code || 'CERT'}</span>
                      <span
                        className={`font-semibold ${
                          isSelected
                            ? isThai
                              ? 'text-blue-700'
                              : 'text-purple-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {isSelected ? '✓ เลือกประเภทนี้แล้ว' : 'กดเพื่อเลือก'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedCert && (
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-xs ${
                  selectedCert.targetAudience === 'THAI'
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-purple-50 border-purple-200 text-purple-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="font-bold">ประเภทที่เลือกขณะนี้:</div>
                  <div className="font-semibold underline text-sm">{selectedCert.name}</div>
                  <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-white border border-current">
                    {selectedCert.targetAudience === 'THAI' ? 'สำหรับคนไทย' : 'สำหรับนิสิตต่างประเทศ'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section B: Student Information Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-black">
                2
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  กรอกข้อมูลนิสิตผู้ยื่นคำร้อง
                </h2>
                <p className="text-xs text-slate-500">
                  เมื่อพิมพ์รหัสนิสิต ระบบจะดึงข้อมูลจากทะเบียนนิสิต (อายุ, สัญชาติ, หนังสือเดินทาง, วีซ่า, ที่อยู่) มาใส่ให้อัตโนมัติ
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Basic Student Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    รหัสนิสิต / เลขที่ใบสมัคร / เลขพาสปอร์ต <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 6801501123 หรือ Passport No. (หรือพิมพ์ NEW หากยังไม่มีรหัส)"
                    value={studentCode}
                    onChange={(e) => handleStudentCodeChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    * นิสิตปัจจุบัน: กรอกรหัสนิสิต | ผู้สมัครสอบเข้าศึกษา: กรอกเลขที่ใบสมัคร หรือ Passport No.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    ชื่อ - นามสกุล (Full Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ชื่อและนามสกุลนิสิต (ไทย หรือ อังกฤษ)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Academic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">สาขาวิชา (Major)</label>
                  <input
                    type="text"
                    placeholder="เช่น ศาสนาและปรัชญา / พระพุทธศาสนา"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">ระดับการศึกษา (Degree Level)</label>
                  <select
                    value={degreeLevel}
                    onChange={(e) => setDegreeLevel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    <option value="ปริญญาตรี">ปริญญาตรี (Undergraduate)</option>
                    <option value="ปริญญาโท">ปริญญาโท (Master Degree)</option>
                    <option value="ปริญญาเอก">ปริญญาเอก (Ph.D.)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">เกรดเฉลี่ยสะสม (GPA)</label>
                  <input
                    type="text"
                    placeholder="เช่น 3.50"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Extended Profile (Age, Nationality, Passport, Visa) */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    ข้อมูลสัญชาติและเอกสารประจำตัว (เชื่อมต่อทะเบียนนิสิต)
                  </span>
                  <span className="text-[11px] text-slate-400">ระบุในเนื้อความหนังสือรับรอง</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">อายุ (Age)</label>
                    <input
                      type="text"
                      placeholder="เช่น 26 ปี"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">เพศ (Gender)</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="ชาย">ชาย (Male)</option>
                      <option value="หญิง">หญิง (Female)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">สัญชาติ (Nationality)</label>
                    <input
                      type="text"
                      placeholder="ไทย / Myanmar / Vietnamese ฯลฯ"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">ประเทศ (Country)</label>
                    <input
                      type="text"
                      placeholder="เช่น Thailand / Myanmar / Vietnam"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Passport & Visa Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">เลขที่หนังสือเดินทาง (Passport No.)</label>
                    <input
                      type="text"
                      placeholder="เช่น A11511416 / MF772427"
                      value={passportNo}
                      onChange={(e) => setPassportNo(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">วันหมดอายุ Passport</label>
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={passportExpireDate}
                      onChange={(e) => setPassportExpireDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">ประเภทวีซ่า (Visa Type)</label>
                    <input
                      type="text"
                      placeholder="Non-Immigrant Visa"
                      value={visaType}
                      onChange={(e) => setVisaType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">วันหมดอายุวีซ่า</label>
                    <input
                      type="text"
                      placeholder="เช่น 28 DCE 2026"
                      value={visaExpireDate}
                      onChange={(e) => setVisaExpireDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    ที่อยู่ปัจจุบัน / วัด / หอพัก (Address)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น Mahachulalongkornrajavidyalaya University, วัดทองจันทริการาม ฯลฯ"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">ตำบล / แขวง (Subdistrict)</label>
                  <input
                    type="text"
                    placeholder="เช่น ลำไทร / Lamsai"
                    value={subdistrict}
                    onChange={(e) => setSubdistrict(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">อำเภอ / เขต (District)</label>
                  <input
                    type="text"
                    placeholder="เช่น วังน้อย / Wangnoi"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">จังหวัด (Province)</label>
                  <input
                    type="text"
                    placeholder="เช่น พระนครศรีอยุธยา / อยุธยา"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Bank-Specific Inputs (If selected card has category BANK) */}
              {selectedCert?.category === 'BANK' && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                  <div className="font-bold text-xs text-amber-900 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-amber-700" />
                    ข้อมูลสำหรับหนังสือถึงธนาคาร
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-amber-800 block mb-1">ผู้จัดการธนาคาร / สาขาเป้าหมาย</label>
                      <input
                        type="text"
                        value={bankTargetTh}
                        onChange={(e) => setBankTargetTh(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-amber-800 block mb-1">การดำเนินธุรกรรมที่ขอ</label>
                      <input
                        type="text"
                        value={bankActionTh}
                        onChange={(e) => setBankActionTh(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Purpose / Additional Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  วัตถุประสงค์ในการขอ / หมายเหตุเพิ่มเติม
                </label>
                <textarea
                  rows={2}
                  placeholder="ระบุวัตถุประสงค์ในการขอเพิ่มเติม เช่น เพื่อยื่นเปิดบัญชีธนาคาร, ต่ออายุวีซ่า ณ ตม."
                  value={requestPurpose}
                  onChange={(e) => setRequestPurpose(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    placeholder="08x-xxx-xxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">อีเมล (Email)</label>
                  <input
                    type="email"
                    placeholder="student@mcu.ac.th"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Supporting Documents Section (เอกสารประกอบคำร้อง) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-purple-700" />
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      แนบเอกสารประกอบคำร้อง (Supporting Documents)
                    </span>
                  </div>
                  <span className="text-[11px] text-purple-700 font-semibold">
                    รองรับไฟล์ JPG, PNG หรือ PDF
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Document 1: ใบสำเนาการลงทะเบียนเรียน */}
                  <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
                        สำเนาลงเรียน / ใบเสร็จ
                      </span>
                      {enrollmentSlipUrl && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          แนบแล้ว ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      ใบเสร็จลงทะเบียน หรือหลักฐานยืนยันการเป็นนิสิต
                    </p>
                    {enrollmentSlipUrl ? (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs">
                        <a
                          href={enrollmentSlipUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-800 underline truncate max-w-[150px] font-medium"
                        >
                          ดูเอกสารแนบ
                        </a>
                        <button
                          type="button"
                          onClick={() => setEnrollmentSlipUrl('')}
                          className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                        >
                          ลบ
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-bold cursor-pointer transition">
                        <UploadCloud className="w-4 h-4" />
                        <span>{uploadingDoc === 'enrollment' ? 'กำลังอัปโหลด...' : 'เลือกไฟล์สำเนา'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(f, 'enrollment');
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Document 2: สำเนาหนังสือเดินทาง */}
                  <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-sky-600" />
                        สำเนาพาสปอร์ต / บัตร ปชช.
                      </span>
                      {passportCopyUrl && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          แนบแล้ว ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      หน้าที่มีรูปถ่ายและวันหมดอายุชัดเจน
                    </p>
                    {passportCopyUrl ? (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50/60 border border-sky-200 text-xs">
                        <a
                          href={passportCopyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-800 underline truncate max-w-[150px] font-medium"
                        >
                          ดูเอกสารแนบ
                        </a>
                        <button
                          type="button"
                          onClick={() => setPassportCopyUrl('')}
                          className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                        >
                          ลบ
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-sky-300 text-sky-700 hover:bg-sky-50 text-xs font-bold cursor-pointer transition">
                        <UploadCloud className="w-4 h-4" />
                        <span>{uploadingDoc === 'passport' ? 'กำลังอัปโหลด...' : 'เลือกไฟล์พาสปอร์ต'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(f, 'passport');
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Document 3: รูปถ่าย 1.5 - 2 นิ้ว */}
                  <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-amber-600" />
                        รูปถ่าย 1.5 - 2 นิ้ว
                      </span>
                      {photoUrl && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          แนบแล้ว ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      หน้าตรงชุดสุภาพ สำหรับติดหนังสือรับรอง
                    </p>
                    {photoUrl ? (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-200 text-xs">
                        <a
                          href={photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-800 underline truncate max-w-[150px] font-medium"
                        >
                          ดูรูปถ่าย
                        </a>
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                        >
                          ลบ
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-bold cursor-pointer transition">
                        <UploadCloud className="w-4 h-4" />
                        <span>{uploadingDoc === 'photo' ? 'กำลังอัปโหลด...' : 'เลือกรูปถ่าย'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(f, 'photo');
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'กำลังส่งคำร้องและซิงค์ข้อมูล...' : 'ส่งคำร้องขอหนังสือรับรอง'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- 2. TRACK REQUEST STATUS TAB ----------------- */}
      {activeTab === 'TRACK' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm max-w-xl mx-auto space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="กรอกรหัสนิสิต (เช่น 6801501123), ชื่อ หรือเลขที่เอกสาร..."
                value={trackCode}
                onChange={(e) => setTrackCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            {/* Year Filter Pills for Track Tab */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-600" /> กรองตามปี พ.ศ.:
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterCertYear('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    filterCertYear === 'ALL'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ทั้งหมด
                </button>
                {availableCertYears.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setFilterCertYear(yr)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      filterCertYear === yr
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ปี {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                ไม่พบประวัติคำร้องตามที่ระบุ
              </div>
            ) : (
              filteredRequests.map((r) => {
                const isThai = r.nationality === 'ไทย' || r.nationality === 'Thai';

                return (
                  <div
                    key={r.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md">
                            {r.studentCode}
                          </span>
                          <span className="font-bold text-slate-900">{r.fullName}</span>
                          {isThai ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              🇹🇭 คนไทย
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                              🌐 ต่างชาติ ({r.nationality || 'Intl'})
                            </span>
                          )}
                        </div>

                        <div className="text-sm font-semibold text-slate-800">{r.certType}</div>

                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>ยื่นเมื่อ: {new Date(r.createdAt).toLocaleDateString('th-TH')}</span>
                          {r.docNo && (
                            <span className="font-mono text-purple-700 font-bold">
                              เลขที่: อว 8002/{r.docNo}
                            </span>
                          )}
                          {r.passportNo && (
                            <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]" title="เลขหนังสือเดินทางถูกปกปิดบางส่วนตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)">
                              🔒 Pass: {maskPassport(r.passportNo)}
                            </span>
                          )}
                        </div>

                        {/* Supporting document badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          {r.enrollmentSlipUrl ? (
                            <a
                              href={r.enrollmentSlipUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition"
                            >
                              <FileCheck2 className="w-3 h-3 text-emerald-600" /> สำเนาลงเรียน ✓
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              ไม่มีสำเนาลงเรียน
                            </span>
                          )}
                          {r.passportCopyUrl && (
                            <a
                              href={r.passportCopyUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 transition"
                            >
                              <Paperclip className="w-3 h-3 text-sky-600" /> สำเนาพาสปอร์ต ✓
                            </a>
                          )}
                          {r.photoUrl && (
                            <a
                              href={r.photoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 transition"
                            >
                              <Camera className="w-3 h-3 text-amber-600" /> รูปถ่าย ✓
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                        <button
                          onClick={() => setPreviewRequest(r)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          ดูตัวอย่าง / พิมพ์
                        </button>

                        {r.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3.5 h-3.5" />
                            อนุมัติแล้ว
                          </span>
                        ) : r.status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3.5 h-3.5" />
                            ปฏิเสธ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            รอตรวจสอบ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Prominent Rejection Reason alert box */}
                    {r.status === 'REJECTED' && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5 animate-in fade-in duration-200">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="font-bold text-rose-950 flex flex-wrap items-center gap-1.5">
                            <span>เหตุผลที่เจ้าหน้าที่ปฏิเสธ:</span>
                            <span className="text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-md font-extrabold">
                              {r.rejectReason || r.note || 'เอกสารไม่ครบถ้วนหรือไม่เป็นไปตามระเบียบ'}
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-700">
                            💡 คำแนะนำ: กรุณาตรวจสอบข้อมูลหรือเตรียมเอกสารแนบตามที่ระบุข้างต้น แล้วยื่นคำร้องใหม่อีกครั้งผ่านแท็บ &quot;แบบฟอร์มยื่นคำร้อง&quot;
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ----------------- 3. ADMIN / ALL REQUESTS TAB ----------------- */}
      {activeTab === 'ADMIN' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                รายการคำร้องทั้งหมดในระบบ ({filteredRequests.length} จาก {requests.length} รายการ)
              </h3>
              <p className="text-xs text-slate-500">ข้อมูลเชื่อมต่อแบบสองทางกับ Google Sheets</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Year Selector Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
                <span className="text-slate-500 pl-2 pr-1 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" /> ปี พ.ศ.:
                </span>
                <button
                  onClick={() => setFilterCertYear('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    filterCertYear === 'ALL'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด (ย้อนหลัง)
                </button>
                {availableCertYears.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setFilterCertYear(yr)}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      filterCertYear === yr
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ปี {yr}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold">
                  นิสิตไทย: {filteredRequests.filter((r) => r.nationality === 'ไทย' || r.nationality === 'Thai').length}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-bold">
                  นิสิตต่างชาติ: {filteredRequests.filter((r) => r.nationality !== 'ไทย' && r.nationality !== 'Thai').length}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-4">วันที่ยื่น</th>
                  <th className="px-6 py-4">รหัสนิสิต</th>
                  <th className="px-6 py-4">ชื่อ - นามสกุล</th>
                  <th className="px-6 py-4">สัญชาติ / เอกสาร</th>
                  <th className="px-6 py-4">ประเภทคำร้อง</th>
                  <th className="px-6 py-4">เลขที่เอกสาร</th>
                  <th className="px-6 py-4 text-center">สถานะ</th>
                  <th className="px-6 py-4 text-right">พิมพ์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((r) => {
                  const isThai = r.nationality === 'ไทย' || r.nationality === 'Thai';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-purple-700">
                        {r.studentCode}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div>{r.fullName}</div>
                        <div className="text-[11px] text-slate-400">{r.degreeLevel} {r.major}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {isThai ? (
                          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            ไทย
                          </span>
                        ) : (
                          <div>
                            <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                              {r.nationality || 'ต่างชาติ'}
                            </span>
                            {r.passportNo && (
                              <div className="font-mono text-[11px] text-slate-500 mt-0.5" title="เลขหนังสือเดินทางถูกปกปิดบางส่วนตามนโยบาย PDPA">
                                🔒 Pass: {maskPassport(r.passportNo)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                        {r.certType}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-700 font-bold">
                        {r.docNo ? `8002/${r.docNo}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
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
                            : 'รอดำเนินการ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setPreviewRequest(r)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          พิมพ์
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- 4. OFFICIAL DOCUMENT PREVIEW & PRINT MODAL ----------------- */}
      {previewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-sm">เครื่องมือปรับแต่งและตัวอย่างหนังสือรับรอง (Interactive Document Customizer)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={pdfDownloading}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{pdfDownloading ? 'กำลังสร้าง PDF...' : 'โหลด PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewRequest(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Customizer Toolbar (Hidden on Print) */}
            <div className="p-4 bg-purple-50/80 border-b border-purple-200/80 space-y-3 print:hidden text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="font-bold text-purple-900 flex items-center gap-1.5">
                  <UserCog className="w-4 h-4 text-purple-600" />
                  <span>ปรับแต่งรูปแบบเอกสาร (Document Controls)</span>
                </label>
                <span className="text-[11px] text-purple-700 bg-purple-100/90 px-2.5 py-0.5 rounded-full font-semibold">
                  ✍️ คลิกบนข้อความเพื่อพิมพ์แก้ไขสดได้ทันที
                </span>
              </div>

              {/* Template Selector & Signer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ชื่อผู้ลงนาม:
                  </label>
                  <input
                    type="text"
                    value={customSigner.name}
                    onChange={(e) => setCustomSigner({ ...customSigner, name: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ตำแหน่งผู้ลงนาม:
                  </label>
                  <input
                    type="text"
                    value={customSigner.title}
                    onChange={(e) => setCustomSigner({ ...customSigner, title: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
                  />
                </div>
              </div>

              {/* Typography & Layout Spacing Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-purple-200/60">
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
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-bold text-purple-800">{docFontSize}pt</span>
                  <button
                    type="button"
                    onClick={() => setDocFontSize((s) => Math.min(24, s + 1))}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Signer Font Size */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-blue-200 shadow-sm" title="ขนาดตัวอักษรผู้ลงนามและตำแหน่ง (สีน้ำเงิน)">
                  <span className="font-semibold text-blue-700">ขนาดผู้ลงนาม:</span>
                  <button
                    type="button"
                    onClick={() => setSignerFontSize((s) => Math.max(9, s - 1))}
                    className="w-5 h-5 rounded bg-blue-50 hover:bg-blue-100 font-bold text-blue-800 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-bold text-blue-900">{signerFontSize}pt</span>
                  <button
                    type="button"
                    onClick={() => setSignerFontSize((s) => Math.min(22, s + 1))}
                    className="w-5 h-5 rounded bg-blue-50 hover:bg-blue-100 font-bold text-blue-800 cursor-pointer"
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
                    <option value={1.3}>1.3</option>
                    <option value={1.5}>1.5</option>
                    <option value={1.7}>1.7</option>
                    <option value={2.0}>2.0</option>
                  </select>
                </div>

                {/* Signature Offset */}
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-sm">
                  <span className="font-semibold text-slate-600">ขยับลายเซ็น:</span>
                  <button
                    type="button"
                    onClick={() => setDocSignerOffset((o) => Math.max(0, o - 10))}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
                  >
                    ⬆
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocSignerOffset((o) => Math.min(120, o + 10))}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
                  >
                    ⬇
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

                {/* Photo Box Shift */}
                {showPhotoBox && (
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-rose-200 shadow-sm" title="ขยับกรอบรูป">
                    <span className="font-semibold text-rose-700">กรอบรูป:</span>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX((x) => Math.max(0, x - 20))}
                      className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 font-bold text-xs text-rose-800 cursor-pointer"
                    >
                      ◀ ซ้าย
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX(0)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                        photoBoxOffsetX === 0 ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      ชิดซ้าย
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX(100)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                        photoBoxOffsetX === 100 ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      กลาง
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoBoxOffsetX((x) => Math.min(300, x + 20))}
                      className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 font-bold text-xs text-rose-800 cursor-pointer"
                    >
                      ขวา ▶
                    </button>
                  </div>
                )}

                {/* Dots Length */}
                {showStudentSign && (
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-amber-200 shadow-sm" title="ปรับความยาวจุดไข่ปลา">
                    <span className="font-semibold text-amber-800">จุดไข่ปลา:</span>
                    <button
                      type="button"
                      onClick={() => setDotsCount((d) => Math.max(8, d - 4))}
                      className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 font-bold text-xs text-amber-900 cursor-pointer"
                    >
                      - สั้นลง
                    </button>
                    <span className="w-8 text-center font-bold text-amber-900 font-mono text-xs">{dotsCount} จุด</span>
                    <button
                      type="button"
                      onClick={() => setDotsCount((d) => Math.min(55, d + 4))}
                      className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 font-bold text-xs text-amber-900 cursor-pointer"
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
                    >
                      -
                    </button>
                    <span className="w-7 text-center font-bold text-indigo-900">{studentSignFontSize}pt</span>
                    <button
                      type="button"
                      onClick={() => setStudentSignFontSize((s) => Math.min(24, s + 1))}
                      className="w-5 h-5 rounded bg-indigo-50 hover:bg-indigo-100 font-bold text-indigo-800 cursor-pointer"
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

                {/* Toggles */}
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
                </div>
              </div>

              <div className="text-[11px] text-amber-800 bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span><b>คำแนะนำ:</b> ท่านสามารถใช้เมาส์คลิกที่ข้อความใดๆ ในเอกสารเพื่อพิมพ์แก้ไขคำ เปลี่ยนชื่อธนาคาร หรือปรับข้อความได้ทันทีก่อนสั่งพิมพ์หรือดาวน์โหลด PDF</span>
              </div>
            </div>

            {/* Modal Printable Sheet Area (Exact A4 Desk Preview) */}
            <div className="w-full overflow-x-auto bg-slate-200/60 p-4 sm:p-8 rounded-2xl flex justify-center border border-slate-200">
              <div
                id="printable-student-cert"
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
              {/* TEMPLATE 1: BANK_LETTER */}
              {previewTemplate === 'BANK_LETTER' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
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
                        ({customSigner.name})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        {customSigner.title}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-600 outline-none focus:bg-purple-50">
                        มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">ติดต่อผู้ประสานงาน:</p>
                      <p>{settings.facultyNameTh ? `สำนักงาน${settings.facultyNameTh}` : 'สำนักงานคณะพุทธศาสตร์'}</p>
                      <p>โทร. {settings.contactPhone || '035-247-8000 ต่อ 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 2: ENG_CERT */}
              {previewTemplate === 'ENG_CERT' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
                    <div
                      className="flex justify-between items-start pb-2 transition-all"
                      style={{
                        marginTop: `${headerTopSpacing}px`,
                        fontSize: `${docFontSize}pt`,
                      }}
                    >
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 space-y-0.5">
                        <p className="font-bold">Office of Dean</p>
                        <p>Tel. {settings.contactPhone || '0-3524-8000 ext. 8323'}</p>
                        <p>Fax. 0-3524-8096</p>
                        <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                        <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                        <p className="font-mono font-bold pt-1">
                          MCU No. 8002 / {previewRequest.docNo || '166'}
                        </p>
                      </div>
                      <div></div>
                    </div>

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

                    <div
                      className="pt-6 ml-auto w-80 text-center space-y-1"
                      style={{
                        marginTop: `${docSignerOffset}px`,
                        fontSize: `${signerFontSize}pt`,
                      }}
                    >
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold text-slate-900 outline-none focus:bg-purple-50">
                        ({customSigner.name})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-800 font-medium outline-none focus:bg-purple-50">
                        {customSigner.title}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-600 outline-none focus:bg-purple-50">
                        Mahachulalongkornrajavidyalaya University
                      </div>
                    </div>

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

                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">{settings.facultyNameEn ? `Faculty of ${settings.facultyNameEn.replace(/^Faculty of /i, '')}` : 'Faculty of Buddhism'}</p>
                      <p>Tel. {settings.contactPhone ? `+66 ${settings.contactPhone.replace(/^0/, '')}` : '+66 35 248 000 ext. 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 3: INTERNAL_MEMO */}
              {previewTemplate === 'INTERNAL_MEMO' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
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
                        <span className="font-bold">ส่วนงาน:</span> คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
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

                    <div
                      className="pt-6 text-center ml-auto w-72 space-y-1"
                      style={{
                        marginTop: `${docSignerOffset}px`,
                        fontSize: `${signerFontSize}pt`,
                      }}
                    >
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50">
                        ({customSigner.name})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50">
                        {customSigner.title}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">{settings.facultyNameTh ? `สำนักงาน${settings.facultyNameTh}` : 'สำนักงานคณะพุทธศาสตร์'}</p>
                      <p>โทรศัพท์ {settings.contactPhone || '035-247-8000 ต่อ 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATE 4: THAI_STANDARD */}
              {previewTemplate === 'THAI_STANDARD' && (
                <div className="space-y-4 text-justify flex-1 flex flex-col justify-between">
                  <div>
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
                      <div></div>
                    </div>

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

                    <div
                      className="pt-6 ml-auto w-80 text-center space-y-1.5"
                      style={{
                        marginTop: `${docSignerOffset}px`,
                        fontSize: `${signerFontSize}pt`,
                      }}
                    >
                      <div className="h-10" />
                      <div contentEditable suppressContentEditableWarning className="font-bold text-slate-900 outline-none focus:bg-purple-50">
                        ({customSigner.name})
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-800 font-medium outline-none focus:bg-purple-50">
                        {customSigner.title}
                      </div>
                      <div contentEditable suppressContentEditableWarning className="text-slate-600 outline-none focus:bg-purple-50">
                        คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                      </div>
                    </div>

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

                  <div className="mt-auto pt-6 border-t border-slate-200/80 flex justify-between items-end text-xs text-slate-600">
                    <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 p-1.5 rounded space-y-0.5">
                      <p className="font-bold text-slate-800">{settings.facultyNameTh ? `สำนักงาน${settings.facultyNameTh}` : 'สำนักงานคณะพุทธศาสตร์'}</p>
                      <p>โทรศัพท์ {settings.contactPhone || '035-247-8000 ต่อ 8323'}</p>
                      <p className="text-purple-700 font-mono">{settings.websiteUrl || 'https://fb.mcu.ac.th/'}</p>
                      <p className="text-purple-700 font-mono">{settings.systemServiceUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://fb-service.mcu.ac.th/')}</p>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t flex flex-wrap items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500 font-sans">
                💡 สามารถเลือกสั่งพิมพ์ หรือดาวน์โหลดเป็นไฟล์ PDF คุณภาพสูงลงเครื่องได้โดยตรง
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewRequest(null)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={pdfDownloading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                  title="ดาวน์โหลดเป็นไฟล์ PDF ลงเครื่อง"
                >
                  <Download className="w-4 h-4" />
                  <span>{pdfDownloading ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลดไฟล์ PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์เอกสารนี้</span>
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
                #printable-student-cert, #printable-student-cert * {
                  visibility: visible !important;
                }
                #printable-student-cert {
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
          </div>
        </div>
      )}
    </div>
  );
}
