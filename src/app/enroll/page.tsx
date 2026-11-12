'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Award,
  UserCheck,
  Printer,
  Sparkles,
  Phone,
  MapPin,
  UploadCloud,
  ArrowRight,
  AlertCircle,
  BookOpen,
  Globe,
  ShieldCheck,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { AdmissionApplication, SystemSettings } from '@/types';
import {
  DEFAULT_ADMISSION_PORTAL_CONFIG,
  resolveAdmissionPortalConfig,
} from '@/lib/admission-config';

type EnrollTab = 'OVERVIEW' | 'APPLY' | 'STATUS' | 'REGISTER';

const QUAL_THEME_CLASSES: Record<
  'orange' | 'sky' | 'purple' | 'emerald',
  { card: string; badge: string }
> = {
  orange: {
    card: 'bg-orange-50/70 border-orange-200',
    badge: 'bg-orange-100 text-orange-900',
  },
  sky: {
    card: 'bg-sky-50/70 border-sky-200',
    badge: 'bg-sky-100 text-sky-900',
  },
  purple: {
    card: 'bg-purple-50/70 border-purple-200',
    badge: 'bg-purple-100 text-purple-900',
  },
  emerald: {
    card: 'bg-emerald-50/70 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-900',
  },
};

const THAI_NUMERALS = ['๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙', '๑๐'];
function toThaiOrderLabel(index: number): string {
  return THAI_NUMERALS[index] || String(index + 1);
}

function EnrollPortalContent() {
  const searchParams = useSearchParams();
  const initialTabParam = (searchParams.get('tab') || '').toUpperCase();
  const initialCheckId = searchParams.get('check_id') || '';

  const [activeTab, setActiveTab] = useState<EnrollTab>(
    initialTabParam === 'APPLY'
      ? 'APPLY'
      : initialTabParam === 'STATUS'
      ? 'STATUS'
      : initialTabParam === 'REGISTER'
      ? 'REGISTER'
      : 'OVERVIEW'
  );

  const [settings, setSettings] = useState<Partial<SystemSettings>>({
    universityNameTh: 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
    facultyNameTh: 'คณะพุทธศาสตร์',
    admissionOpen: true,
    admissionAcademicYear: '2570',
    admissionDefaultInterviewDate: '20 พฤษภาคม 2570 เวลา 09.00 - 12.00 น.',
    admissionDefaultInterviewRoom: 'อาคารสมเด็จพระพุฒาจารย์ (อาคารเรียนรวม) คณะพุทธศาสตร์ มจร วังน้อย',
    admissionCoordinatorName: 'สำนักงานคณบดีคณะพุทธศาสตร์ ฝ่ายทะเบียนและวัดผล',
    admissionCoordinatorPhone: '035-248-000 ต่อ 8323',
  });

  // Application Form State (Tab 2)
  const [applicantType, setApplicantType] = useState<'MONK' | 'LAYMAN'>('MONK');
  const [nationalityType, setNationalityType] = useState<'THAI' | 'INTERNATIONAL'>('THAI');
  const [citizenId, setCitizenId] = useState('');
  const [nationality, setNationality] = useState('ไทย');
  const [titleName, setTitleName] = useState('พระ');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [degreeLevel, setDegreeLevel] = useState<string>(
    DEFAULT_ADMISSION_PORTAL_CONFIG.degreeOptions[0]?.value || 'ปริญญาตรี'
  );
  const [programType, setProgramType] = useState<'THAI' | 'ENGLISH'>('THAI');
  const [major, setMajor] = useState(
    DEFAULT_ADMISSION_PORTAL_CONFIG.majorOptions[0]?.value || ''
  );
  const [previousEducation, setPreviousEducation] = useState(
    DEFAULT_ADMISSION_PORTAL_CONFIG.previousEducationOptions[0]?.value ||
      'มัธยมศึกษาตอนปลาย (ม.6) หรือเทียบเท่า'
  );
  const [studyPlan, setStudyPlan] = useState(
    DEFAULT_ADMISSION_PORTAL_CONFIG.studyPlanOptions[0]?.value ||
      'ภาคปกติ (วันจันทร์ - วันพฤหัสบดี)'
  );
  const [gpa, setGpa] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [lineId, setLineId] = useState('');
  const [address, setAddress] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [certifiedTrue, setCertifiedTrue] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<AdmissionApplication | null>(null);

  // Status Lookup & Registration State (Tab 3 & Tab 4)
  const [lookupQuery, setLookupQuery] = useState(initialCheckId);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [matchedApp, setMatchedApp] = useState<AdmissionApplication | null>(null);
  const [confirmingEnroll, setConfirmingEnroll] = useState(false);
  const [confirmSuccessMsg, setConfirmSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = () => {
      fetch('/api/system-settings')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data) {
            setSettings((prev) => ({ ...prev, ...d.data }));
          }
        })
        .catch(() => {});
    };
    loadSettings();
    window.addEventListener('mcu_settings_updated', loadSettings);
    return () => window.removeEventListener('mcu_settings_updated', loadSettings);
  }, []);

  const portalConfig = useMemo(
    () => resolveAdmissionPortalConfig(settings.admissionPortalConfig),
    [settings.admissionPortalConfig]
  );

  const visibleTabs = useMemo(() => {
    const tabs: Array<{ id: EnrollTab; label: string; icon: typeof BookOpen }> = [];
    if (portalConfig.showOverviewTab) {
      tabs.push({ id: 'OVERVIEW', label: '๑. ขั้นตอนและคุณสมบัติ', icon: BookOpen });
    }
    if (portalConfig.showApplyTab) {
      tabs.push({ id: 'APPLY', label: '๒. ยื่นใบสมัครออนไลน์', icon: FileText });
    }
    if (portalConfig.showStatusTab) {
      tabs.push({ id: 'STATUS', label: '๓. ตรวจสอบสถานะ & นัดสัมภาษณ์', icon: Search });
    }
    if (portalConfig.showRegisterTab) {
      tabs.push({ id: 'REGISTER', label: '๔. ขึ้นทะเบียนนิสิตใหม่ออนไลน์', icon: GraduationCap });
    }
    return tabs;
  }, [portalConfig]);

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some((t) => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  const enabledQualifications = useMemo(
    () => portalConfig.qualifications.filter((q) => q.enabled !== false),
    [portalConfig.qualifications]
  );
  const enabledRequiredDocs = useMemo(
    () => portalConfig.requiredDocuments.filter((d) => d.enabled !== false),
    [portalConfig.requiredDocuments]
  );
  const enabledDegreeOptions = useMemo(
    () => portalConfig.degreeOptions.filter((o) => o.enabled !== false),
    [portalConfig.degreeOptions]
  );
  const enabledMajorOptions = useMemo(
    () => portalConfig.majorOptions.filter((o) => o.enabled !== false),
    [portalConfig.majorOptions]
  );
  const enabledStudyPlanOptions = useMemo(
    () => portalConfig.studyPlanOptions.filter((o) => o.enabled !== false),
    [portalConfig.studyPlanOptions]
  );
  const enabledPrevEduOptions = useMemo(
    () => portalConfig.previousEducationOptions.filter((o) => o.enabled !== false),
    [portalConfig.previousEducationOptions]
  );
  const enabledFirstYearCourses = useMemo(
    () => portalConfig.firstYearCourses.filter((c) => c.enabled !== false),
    [portalConfig.firstYearCourses]
  );
  const totalFirstYearCredits = useMemo(
    () => enabledFirstYearCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0),
    [enabledFirstYearCourses]
  );

  useEffect(() => {
    if (enabledDegreeOptions.length > 0 && !enabledDegreeOptions.some((o) => o.value === degreeLevel)) {
      setDegreeLevel(enabledDegreeOptions[0].value);
    }
  }, [enabledDegreeOptions, degreeLevel]);

  useEffect(() => {
    if (enabledMajorOptions.length > 0 && !enabledMajorOptions.some((o) => o.value === major)) {
      setMajor(enabledMajorOptions[0].value);
    }
  }, [enabledMajorOptions, major]);

  useEffect(() => {
    if (
      enabledStudyPlanOptions.length > 0 &&
      !enabledStudyPlanOptions.some((o) => o.value === studyPlan)
    ) {
      setStudyPlan(enabledStudyPlanOptions[0].value);
    }
  }, [enabledStudyPlanOptions, studyPlan]);

  useEffect(() => {
    if (
      enabledPrevEduOptions.length > 0 &&
      !enabledPrevEduOptions.some((o) => o.value === previousEducation)
    ) {
      setPreviousEducation(enabledPrevEduOptions[0].value);
    }
  }, [enabledPrevEduOptions, previousEducation]);

  useEffect(() => {
    if (initialCheckId) {
      handleSearchApplication(initialCheckId);
    }
  }, [initialCheckId]);

  const handleSearchApplication = async (qOverride?: string) => {
    const q = (qOverride !== undefined ? qOverride : lookupQuery).trim();
    if (!q) {
      setLookupError('กรุณากรอกเลขบัตรประชาชน 13 หลัก / พาสปอร์ต หรือรหัสใบสมัคร');
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    setConfirmSuccessMsg(null);
    try {
      const res = await fetch(`/api/admissions?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setMatchedApp(data.data);
      } else {
        setMatchedApp(null);
        setLookupError(data.error || 'ไม่พบข้อมูลใบสมัครที่ระบุ');
      }
    } catch {
      setLookupError('เกิดข้อผิดพลาดในการค้นหาข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleQuickTest = (testId: string, targetTab: EnrollTab) => {
    setLookupQuery(testId);
    setActiveTab(targetTab);
    handleSearchApplication(testId);
  };

  const handleUploadDocFile = async (file: File) => {
    if (!file) return;
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('scope', 'certificates');
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setDocumentUrl(data.url);
      } else {
        alert(data.error || 'อัปโหลดไฟล์ไม่สำเร็จ');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการอัปโหลดเอกสาร');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleResetForm = () => {
    setCitizenId('');
    setFirstName('');
    setLastName('');
    setGpa('');
    setPhone('');
    setEmail('');
    setLineId('');
    setAddress('');
    setDocumentUrl('');
    setCertifiedTrue(false);
    setSubmitError(null);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!citizenId.trim() || !firstName.trim() || !lastName.trim() || !phone.trim() || !address.trim()) {
      setSubmitError('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วนทุกช่อง');
      return;
    }
    if (!certifiedTrue) {
      setSubmitError('กรุณาติ๊กยืนยันคำรับรองความถูกต้องของข้อมูลผู้สมัคร');
      return;
    }

    setSubmitting(true);
    try {
      const matchedDegreeLabel = enabledDegreeOptions.find((o) => o.value === degreeLevel)?.label;
      const curriculumName =
        matchedDegreeLabel ||
        (degreeLevel === 'ปริญญาเอก'
          ? 'หลักสูตรพุทธศาสตรดุษฎีบัณฑิต (ปริญญาเอก - พธ.ด.)'
          : degreeLevel === 'ปริญญาโท'
          ? 'หลักสูตรพุทธศาสตรมหาบัณฑิต (ปริญญาโท - พธ.ม.)'
          : degreeLevel === 'ประกาศนียบัตร'
          ? 'หลักสูตรประกาศนียบัตรบัณฑิต'
          : 'หลักสูตรพุทธศาสตรบัณฑิต (ปริญญาตรี - พธ.บ.)');

      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          academicYear: settings.admissionAcademicYear || '2570',
          applicantType,
          nationalityType,
          citizenId: citizenId.trim(),
          passportNo: nationalityType === 'INTERNATIONAL' ? citizenId.trim() : '',
          nationality: nationalityType === 'THAI' ? 'ไทย' : nationality || 'International',
          titleName: titleName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          monasticName: applicantType === 'MONK' ? lastName.trim() : '',
          degreeLevel,
          curriculumName,
          major,
          programType,
          studyPlan,
          previousEducation,
          gpa: gpa.trim(),
          phone: phone.trim(),
          email: email.trim(),
          lineId: lineId.trim(),
          address: address.trim(),
          documentUrl: documentUrl.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSubmittedApp(data.data);
        setMatchedApp(data.data);
        setLookupQuery(data.data.applicationCode);
      } else {
        setSubmitError(data.error || 'ไม่สามารถบันทึกใบสมัครได้ กรุณาลองใหม่');
      }
    } catch {
      setSubmitError('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmEnrollment = async () => {
    if (!matchedApp) return;
    setConfirmingEnroll(true);
    setConfirmSuccessMsg(null);
    setLookupError(null);
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_enroll',
          query: matchedApp.applicationCode,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMatchedApp(data.data);
        setConfirmSuccessMsg(data.message || 'ยืนยันสิทธิ์และขึ้นทะเบียนนิสิตใหม่ออนไลน์เรียบร้อยแล้ว!');
      } else {
        setLookupError(data.error || 'ไม่สามารถยืนยันสิทธิ์ได้');
      }
    } catch {
      setLookupError('เกิดข้อผิดพลาดในการยืนยันสิทธิ์');
    } finally {
      setConfirmingEnroll(false);
    }
  };

  const getStepNumber = (status?: AdmissionApplication['status']) => {
    if (!status) return 0;
    if (status === 'SUBMITTED') return 1;
    if (status === 'DOC_VERIFIED') return 2;
    if (status === 'INTERVIEW_PASS') return 3;
    if (status === 'ENROLLED') return 4;
    return 0;
  };

  const academicYear = settings.admissionAcademicYear || '2570';

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-amber-900 p-6 sm:p-10 text-white shadow-xl border border-amber-500/20 print:hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
              <GraduationCap className="w-4 h-4" />
              <span>ปีการศึกษา {academicYear} • คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              ระบบรับสมัครและขึ้นทะเบียนนิสิตใหม่ออนไลน์
              <span className="block text-amber-300 text-lg sm:text-2xl font-bold mt-1">
                Online Admission & New Student Registration Portal (พธ.บ. • พธ.ม. • พธ.ด.)
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              เปิดรับสมัครพระภิกษุ-สามเณร (บรรพชิต) และประชาชนทั่วไป (คฤหัสถ์) ทั้งหลักสูตรภาษาไทยและหลักสูตรนานาชาติ (International Program) ครบวงจรใน 4 ขั้นตอน: ยื่นใบสมัคร ➔ ตรวจเอกสาร ➔ สอบสัมภาษณ์ ➔ ขึ้นทะเบียนนิสิตและพิมพ์ใบรายงานตัวออนไลน์
            </p>
          </div>

          {/* Coordinator Contact Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 space-y-2 shrink-0 lg:w-80">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>ศูนย์ประสานงานการรับสมัครนิสิตใหม่</span>
            </div>
            <div className="text-sm font-extrabold text-white">
              {settings.admissionCoordinatorName || 'สำนักงานคณบดีคณะพุทธศาสตร์'}
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <span>โทร:</span>
              <span className="font-bold text-amber-200">
                {settings.admissionCoordinatorPhone || settings.contactPhone || '035-248-000 ต่อ 8323'}
              </span>
            </div>
            <div className="pt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  settings.admissionOpen !== false
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    settings.admissionOpen !== false ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`}
                />
                {settings.admissionOpen !== false
                  ? `เปิดรับสมัครออนไลน์ ปี ${academicYear}`
                  : 'ปิดรับยื่นใบสมัครรอบปัจจุบัน'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4-Step Process Flow Cards */}
      {portalConfig.showProcessSteps && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white rounded-2xl border border-orange-200/80 p-4 shadow-sm flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-extrabold">
                ขั้นตอนที่ ๑
              </span>
              <FileText className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">๑. ยื่นใบสมัครออนไลน์</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              กรอกข้อมูลผู้สมัคร เลือกระดับปริญญาและสาขาวิชา พร้อมรับรหัสใบสมัครทันที
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('APPLY')}
            className="w-full py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition cursor-pointer"
          >
            กรอกใบสมัครออนไลน์ →
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-sky-200/80 p-4 shadow-sm flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-extrabold">
                ขั้นตอนที่ ๒
              </span>
              <Search className="w-4 h-4 text-sky-600" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">๒. ตรวจสอบเอกสาร</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              เจ้าหน้าที่ตรวจสอบคุณสมบัติและเอกสารหลักฐานการสมัครของท่าน
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('STATUS')}
            className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition cursor-pointer"
          >
            เช็คสถานะเอกสาร →
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-indigo-200/80 p-4 shadow-sm flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-extrabold">
                ขั้นตอนที่ ๓
              </span>
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">๓. สอบสัมภาษณ์</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ตรวจสอบวัน เวลา และห้องสอบสัมภาษณ์ พร้อมติดตามผลสัมภาษณ์ออนไลน์
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('STATUS')}
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
          >
            ตารางสอบสัมภาษณ์ →
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-sm flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                ขั้นตอนที่ ๔
              </span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">๔. ขึ้นทะเบียนนิสิตใหม่</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ยืนยันสิทธิ์เข้าศึกษา รับรหัสประจำตัวนิสิต และพิมพ์ใบรายงานตัวออนไลน์
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('REGISTER')}
            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
          >
            ขึ้นทะเบียนนิสิตออนไลน์ →
          </button>
        </div>
      </div>
      )}

      {/* 3. Quick Test Simulation Links Bar (สำหรับทดสอบ Flow ทั้ง 4 ขั้นตอนทันที) */}
      {portalConfig.showQuickTestBar && (
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>แถบทดสอบระบบด่วน (คลิกเพื่อจำลองการตรวจสถานะและขึ้นทะเบียน):</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleQuickTest('1349900123456', 'REGISTER')}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold transition cursor-pointer shadow-2xs"
          >
            🟢 ทดสอบขั้นตอนที่ ๔ (พร้อมขึ้นทะเบียน: 1349900123456)
          </button>
          <button
            type="button"
            onClick={() => handleQuickTest('1349900987654', 'STATUS')}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-sky-800 border border-sky-300 font-bold transition cursor-pointer shadow-2xs"
          >
            🔵 ทดสอบขั้นตอนที่ ๒-๓ (รอสัมภาษณ์: 1349900987654)
          </button>
          <button
            type="button"
            onClick={() => handleQuickTest('1349900555555', 'REGISTER')}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-purple-800 border border-purple-300 font-bold transition cursor-pointer shadow-2xs"
          >
            🟣 ดูนิสิตที่ขึ้นทะเบียนแล้ว (1349900555555)
          </button>
        </div>
      </div>
      )}

      {/* 4. Main Tab Navigation */}
      {visibleTabs.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs print:hidden">
          {visibleTabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <div className="text-sm font-extrabold text-slate-900">
            ขณะนี้ผู้ดูแลระบบปิดการแสดงผลเนื้อหาในหน้านี้ชั่วคราว
          </div>
          <p className="text-xs text-slate-500">
            กรุณาติดต่อ {settings.admissionCoordinatorName || 'เจ้าหน้าที่ฝ่ายทะเบียน'} โทร. {settings.admissionCoordinatorPhone || '-'}
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: OVERVIEW & QUALIFICATIONS
         ───────────────────────────────────────────────────────────── */}
      {portalConfig.showOverviewTab && activeTab === 'OVERVIEW' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-600" />
                <span>{portalConfig.overviewTitle || 'คุณสมบัติผู้สมัครและเอกสารหลักฐานที่ต้องใช้'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {portalConfig.overviewSubtitle ||
                  'การรับสมัครคัดเลือกบุคคลเข้าศึกษาในคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}{' '}
                ประจำปีการศึกษา {academicYear}
              </p>
            </div>
            {portalConfig.showApplyTab && (
              <button
                type="button"
                onClick={() => setActiveTab('APPLY')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-extrabold shadow-md transition cursor-pointer self-start"
              >
                <FileText className="w-4 h-4" />
                <span>ดำเนินการยื่นใบสมัครออนไลน์ทันที</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {enabledQualifications.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {enabledQualifications.map((card) => {
                const style = QUAL_THEME_CLASSES[card.themeColor] || QUAL_THEME_CLASSES.orange;
                return (
                  <div key={card.id} className={`rounded-2xl border p-5 space-y-3 ${style.card}`}>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold ${style.badge}`}
                    >
                      <span>{card.badgeText}</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700 leading-relaxed list-disc pl-4">
                      {card.items.map((item, itemIdx) => (
                        <li key={itemIdx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {/* Required Documents */}
          {enabledRequiredDocs.length > 0 && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {portalConfig.requiredDocsTitle ||
                    'เอกสารหลักฐานที่ต้องเตรียม (สามารถแนบไฟล์ออนไลน์ในขั้นตอนสมัคร หรือนำมายื่นในวันสัมภาษณ์/รายงานตัว)'}
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                {enabledRequiredDocs.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex items-start gap-2.5"
                  >
                    <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 font-black flex items-center justify-center shrink-0">
                      {toThaiOrderLabel(idx)}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{doc.title}</div>
                      {doc.description && (
                        <div className="text-slate-500 mt-0.5">{doc.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: ONLINE APPLICATION FORM
         ───────────────────────────────────────────────────────────── */}
      {portalConfig.showApplyTab && activeTab === 'APPLY' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <span>
                {portalConfig.applyFormTitle || 'แบบฟอร์มยื่นใบสมัครเข้าศึกษาออนไลน์ คณะพุทธศาสตร์ มจร'}{' '}
                (ปีการศึกษา {academicYear})
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {portalConfig.applyFormSubtitle ||
                'กรอกข้อมูลผู้สมัครให้ครบถ้วน ระบบจะออกรหัสใบสมัครเพื่อใช้ตรวจสอบสถานะและขึ้นทะเบียนนิสิตออนไลน์ทันที'}
            </p>
          </div>

          {settings.admissionOpen === false ? (
            <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
              <h3 className="text-base font-extrabold text-rose-900">
                ขณะนี้ปิดรับการยื่นใบสมัครออนไลน์ชั่วคราว
              </h3>
              <p className="text-xs text-rose-700 max-w-lg mx-auto">
                สำหรับผู้สมัครที่ได้ยื่นใบสมัครไว้แล้ว ท่านยังสามารถตรวจสอบสถานะการสมัคร ตารางสอบสัมภาษณ์ และขึ้นทะเบียนนิสิตใหม่ได้ที่แท็บที่ ๓ และ ๔ ตามปกติ
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('STATUS')}
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold cursor-pointer"
                >
                  ไปหน้าตรวจสอบสถานะ
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('REGISTER')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                >
                  ไปหน้าขึ้นทะเบียนนิสิต
                </button>
              </div>
            </div>
          ) : submittedApp ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50/90 border-2 border-emerald-300 space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-emerald-200 text-emerald-900 text-xs font-extrabold">
                  บันทึกใบสมัครออนไลน์สำเร็จ
                </span>
                <h3 className="text-xl font-black text-slate-900 pt-1">
                  รหัสใบสมัครของคุณคือ: <span className="text-emerald-700 font-mono">{submittedApp.applicationCode}</span>
                </h3>
                <p className="text-xs text-slate-600">
                  ผู้สมัคร: <strong>{submittedApp.titleName} {submittedApp.firstName} {submittedApp.lastName}</strong> • {submittedApp.degreeLevel} ({submittedApp.major})
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedApp(null);
                    setActiveTab('STATUS');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold shadow-sm cursor-pointer"
                >
                  ตรวจสอบสถานะและตารางสัมภาษณ์ →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedApp(null);
                    handleResetForm();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  ยื่นใบสมัครเพิ่มอีกชุด
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitApplication} className="space-y-5 text-xs sm:text-sm">
              {submitError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Row 1: Applicant Type & Nationality Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๑. สถานภาพผู้สมัคร <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={applicantType}
                    onChange={(e) => {
                      const next = e.target.value as 'MONK' | 'LAYMAN';
                      setApplicantType(next);
                      setTitleName(next === 'MONK' ? 'พระ' : 'นาย');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900"
                  >
                    <option value="MONK">พระภิกษุ / สามเณร (บรรพชิต)</option>
                    <option value="LAYMAN">บุคคลทั่วไป (คฤหัสถ์ ชาย-หญิง)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๒. ประเภทผู้สมัคร (ไทย / ต่างชาติ) <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={nationalityType}
                    onChange={(e) => {
                      const next = e.target.value as 'THAI' | 'INTERNATIONAL';
                      setNationalityType(next);
                      if (next === 'THAI') {
                        setNationality('ไทย');
                      } else {
                        setNationality('Myanmar');
                        setProgramType('ENGLISH');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900"
                  >
                    <option value="THAI">🇹🇭 สัญชาติไทย (บัตรประชาชน 13 หลัก)</option>
                    <option value="INTERNATIONAL">🌐 ชาวต่างชาติ / International (Passport No.)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๓. {nationalityType === 'THAI' ? 'เลขประจำตัวประชาชน (๑๓ หลัก)' : 'เลขหนังสือเดินทาง (Passport No.)'}{' '}
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={citizenId}
                    onChange={(e) => setCitizenId(e.target.value)}
                    placeholder={
                      nationalityType === 'THAI' ? 'เช่น 1349900123456 (ไม่ต้องใส่ขีด)' : 'เช่น MA8899001'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Row 2: Title, First Name, Last Name / Monastic Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๔. คำนำหน้า / สมณศักดิ์ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={titleName}
                    onChange={(e) => setTitleName(e.target.value)}
                    placeholder={
                      applicantType === 'MONK'
                        ? 'เช่น พระ, พระมหา, พระครู, สามเณร, Ven.'
                        : 'เช่น นาย, นาง, นางสาว, Mr., Ms.'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๕. ชื่อ (First Name) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="ระบุชื่อตัว"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๖. {applicantType === 'MONK' ? 'ฉายา / นามสกุล *' : 'นามสกุล (Last Name) *'}{' '}
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={
                      applicantType === 'MONK'
                        ? 'เช่น ธีรญาโณ (นามสกุล)'
                        : 'ระบุนามสกุลจริง'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Row 3: Degree Level, Program Type, Major */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๗. ระดับหลักสูตรที่สมัคร <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={degreeLevel}
                    onChange={(e) => setDegreeLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900"
                  >
                    {enabledDegreeOptions.map((opt) => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๘. หลักสูตรภาษา <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={programType}
                    onChange={(e) => setProgramType(e.target.value as 'THAI' | 'ENGLISH')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900"
                  >
                    <option value="THAI">🇹🇭 หลักสูตรภาษาไทย (Thai Program)</option>
                    <option value="ENGLISH">🌐 หลักสูตรภาษาอังกฤษ (International Program)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๙. สาขาวิชาที่ประสงค์สมัคร <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900"
                  >
                    {enabledMajorOptions.map((opt) => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Previous Education, Study Plan, GPA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๑๐. วุฒิการศึกษาเดิมที่ใช้สมัคร <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={previousEducation}
                    onChange={(e) => setPreviousEducation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900"
                  >
                    {enabledPrevEduOptions.map((opt) => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๑๑. แผนการเรียนที่ประสงค์สมัคร <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={studyPlan}
                    onChange={(e) => setStudyPlan(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900"
                  >
                    {enabledStudyPlanOptions.map((opt) => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๑๒. เกรดเฉลี่ยสะสม (GPAX) (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    placeholder="เช่น 3.25"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Row 5: Phone, Email, LINE ID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๑๓. หมายเลขโทรศัพท์ติดต่อ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 081-234-5678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๑๔. อีเมล (Email)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๑๕. LINE ID (สำหรับรับแจ้งเตือนสัมภาษณ์)
                  </label>
                  <input
                    type="text"
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    placeholder="ระบุไอดีไลน์ (ถ้ามี)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Row 6: Address & Optional Document Upload */}
              <div
                className={`grid grid-cols-1 ${
                  portalConfig.showDocumentUploadField ? 'md:grid-cols-2' : ''
                } gap-4`}
              >
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๑๖. {applicantType === 'MONK' ? 'วัดที่จำพรรษา / ที่อยู่ปัจจุบัน *' : 'ที่อยู่ปัจจุบันที่ติดต่อได้ *'}{' '}
                    <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="ระบุชื่อวัด/บ้านเลขที่ หมู่ที่ ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                {portalConfig.showDocumentUploadField && (
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-800">
                      ๑๗. แนบไฟล์หรือลิงก์เอกสารหลักฐานเบื้องต้น (ไม่บังคับ - นำมายื่นวันสัมภาษณ์ได้)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={documentUrl}
                        onChange={(e) => setDocumentUrl(e.target.value)}
                        placeholder="วางลิงก์ Google Drive หรือกดอัปโหลดไฟล์ด้านขวา..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900"
                      />
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold cursor-pointer shrink-0">
                        <UploadCloud className="w-4 h-4" />
                        <span>{uploadingDoc ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์'}</span>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadDocFile(f);
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      รองรับไฟล์รูปภาพหรือ PDF (สำเนาใบสุทธิ/บัตรประชาชน/Passport หรือใบ รบ./ปพ.1)
                    </p>
                  </div>
                )}
              </div>

              {/* Certification Checkbox */}
              <label className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={certifiedTrue}
                  onChange={(e) => setCertifiedTrue(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-orange-600"
                />
                <span className="text-xs text-slate-700 leading-relaxed font-medium">
                  {portalConfig.certificationStatement ||
                    'ข้าพเจ้าขอรับรองว่าข้อความข้างต้นเป็นความจริงทุกประการ หากตรวจสอบภายหลังพบว่ามีคุณสมบัติไม่ตรงตามที่มหาวิทยาลัยกำหนด ข้าพเจ้ายินยอมให้ตัดสิทธิ์การเข้าศึกษาโดยไม่มีเงื่อนไข'}
                </span>
              </label>

              {/* Form Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>ล้างข้อมูล</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs sm:text-sm font-extrabold shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'กำลังบันทึกใบสมัคร...' : 'บันทึกยื่นใบสมัครออนไลน์'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: CHECK STATUS & INTERVIEW SCHEDULE
         ───────────────────────────────────────────────────────────── */}
      {portalConfig.showStatusTab && activeTab === 'STATUS' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-sky-600" />
              <span>
                {portalConfig.statusSectionTitle || 'ตรวจสอบสถานะการสมัคร & ตารางนัดสอบสัมภาษณ์'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {portalConfig.statusSectionSubtitle ||
                'กรอกเลขประจำตัวประชาชน 13 หลัก, เลขพาสปอร์ต หรือรหัสใบสมัคร (เช่น MCU-FB-2570-0001)'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchApplication()}
              placeholder="กรอกเลขบัตรประชาชน 13 หลัก / Passport / รหัสใบสมัคร..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono text-slate-900"
            />
            <button
              type="button"
              onClick={() => handleSearchApplication()}
              disabled={lookupLoading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-extrabold shadow-sm transition cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{lookupLoading ? 'กำลังค้นหา...' : 'ค้นหาสถานะ'}</span>
            </button>
          </div>

          {lookupError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          {matchedApp && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-5">
              {/* Applicant Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                      {matchedApp.applicationCode}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      ปีการศึกษา {matchedApp.academicYear}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      เลขประจำตัว: {matchedApp.citizenId}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-2">
                    {matchedApp.titleName} {matchedApp.firstName} {matchedApp.lastName}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {matchedApp.curriculumName} • <strong>{matchedApp.major}</strong> ({matchedApp.studyPlan})
                  </p>
                </div>

                {matchedApp.assignedStudentCode && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-right">
                    <div className="text-[10px] font-bold text-emerald-700 uppercase">รหัสประจำตัวนิสิตใหม่</div>
                    <div className="text-xl font-black font-mono text-emerald-900">
                      {matchedApp.assignedStudentCode}
                    </div>
                  </div>
                )}
              </div>

              {/* 4-Step Progress Tracker */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { step: 1, title: '๑. ยื่นใบสมัครแล้ว', desc: 'ระบบได้รับข้อมูลผู้สมัคร' },
                  { step: 2, title: '๒. ตรวจสอบเอกสาร', desc: 'ตรวจคุณสมบัติผ่านแล้ว' },
                  { step: 3, title: '๓. สอบสัมภาษณ์', desc: 'ผ่านการสอบสัมภาษณ์' },
                  { step: 4, title: '๔. ขึ้นทะเบียนนิสิต', desc: 'ออกรหัสประจำตัวนิสิต' },
                ].map((item) => {
                  const currentStep = getStepNumber(matchedApp.status);
                  const done = currentStep >= item.step;
                  return (
                    <div
                      key={item.step}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                        done
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {done ? '✓' : item.step}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold">{item.title}</div>
                        <div className="text-[11px] opacity-80">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interview Schedule Box */}
              <div className="bg-white rounded-2xl border border-indigo-200 p-4 sm:p-5 space-y-2">
                <div className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>กำหนดการสอบสัมภาษณ์และหมายเหตุจากเจ้าหน้าที่</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <span className="text-slate-500 block">วันและเวลาสอบสัมภาษณ์:</span>
                    <strong className="text-slate-900 text-sm">
                      {matchedApp.interviewDate || settings.admissionDefaultInterviewDate}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <span className="text-slate-500 block">สถานที่ / ห้องสอบสัมภาษณ์:</span>
                    <strong className="text-slate-900 text-sm">
                      {matchedApp.interviewRoom || settings.admissionDefaultInterviewRoom}
                    </strong>
                  </div>
                </div>
                {matchedApp.interviewNote && (
                  <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 font-semibold mt-2">
                    💬 หมายเหตุ: {matchedApp.interviewNote}
                  </p>
                )}
              </div>

              {/* Next Action CTA */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <Link
                  href="/certificates"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold transition"
                >
                  <Globe className="w-4 h-4" />
                  <span>ขอหนังสือรับรองผู้ผ่านการคัดเลือก (สำหรับต่อวีซ่า Non-ED)</span>
                </Link>

                {portalConfig.showRegisterTab &&
                  (matchedApp.status === 'INTERVIEW_PASS' || matchedApp.status === 'ENROLLED') && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('REGISTER')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-sm cursor-pointer"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>
                        {matchedApp.status === 'ENROLLED'
                          ? 'ดูและพิมพ์ใบรายงานตัวนิสิตใหม่ →'
                          : 'ไปหน้ายืนยันสิทธิ์และขึ้นทะเบียนนิสิตออนไลน์ →'}
                      </span>
                    </button>
                  )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: ONLINE REGISTRATION & OFFICIAL CERTIFICATE VOUCHER
         ───────────────────────────────────────────────────────────── */}
      {portalConfig.showRegisterTab && activeTab === 'REGISTER' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-5 print:hidden">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <span>
                  {portalConfig.registerSectionTitle ||
                    'ยืนยันสิทธิ์และขึ้นทะเบียนนิสิตใหม่ออนไลน์ (Online Student Enrollment)'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {portalConfig.registerSectionSubtitle ||
                  'สำหรับผู้สมัครที่ผ่านการสอบสัมภาษณ์แล้ว กรอกเลขบัตรประชาชน/พาสปอร์ต หรือรหัสใบสมัคร เพื่อยืนยันสิทธิ์และสั่งพิมพ์ใบรายงานตัวนิสิตใหม่'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchApplication()}
                placeholder="กรอกเลขบัตรประชาชน 13 หลัก / Passport / รหัสใบสมัคร..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono text-slate-900"
              />
              <button
                type="button"
                onClick={() => handleSearchApplication()}
                disabled={lookupLoading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow-sm transition cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{lookupLoading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสิทธิ์ขึ้นทะเบียน'}</span>
              </button>
            </div>

            {lookupError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            {confirmSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{confirmSuccessMsg}</span>
              </div>
            )}

            {matchedApp && matchedApp.status === 'INTERVIEW_PASS' && (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-amber-900">
                    🎉 ขอแสดงความยินดี! ท่านผ่านการสอบสัมภาษณ์เข้าศึกษาต่อแล้ว
                  </div>
                  <p className="text-xs text-amber-800">
                    กรุณากดปุ่ม <strong>&ldquo;ยืนยันสิทธิ์ขึ้นทะเบียนนิสิตใหม่&rdquo;</strong> เพื่อรับรหัสประจำตัวนิสิตและออกใบรายงานตัว
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmEnrollment}
                  disabled={confirmingEnroll}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-md cursor-pointer shrink-0"
                >
                  {confirmingEnroll ? 'กำลังขึ้นทะเบียน...' : '✓ ยืนยันสิทธิ์ขึ้นทะเบียนนิสิตใหม่'}
                </button>
              </div>
            )}
          </div>

          {/* Official Registration Certificate Voucher (Printable A4) */}
          {matchedApp && (matchedApp.status === 'INTERVIEW_PASS' || matchedApp.status === 'ENROLLED') && (
            <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-lg p-6 sm:p-10 space-y-6 print:border-0 print:shadow-none print:p-0">
              {/* Top Action Bar (Hidden in Print) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 print:hidden">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-extrabold text-slate-900">
                    ใบรายงานตัวและขึ้นทะเบียนนิสิตใหม่ออนไลน์ (Official Registration Voucher)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์ใบรายงานตัวและแผนการเรียน (Print A4)</span>
                </button>
              </div>

              {/* Certificate Header with 1.5-inch Photo Frame */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b-2 border-slate-800 pb-5">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-600">
                    {settings.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    ใบรายงานตัวและขึ้นทะเบียนนิสิตใหม่ออนไลน์
                  </h3>
                  <p className="text-xs font-bold text-slate-700">
                    {matchedApp.curriculumName} • คณะพุทธศาสตร์ ประจำปีการศึกษา {matchedApp.academicYear}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-300 font-mono font-bold text-slate-900">
                      รหัสใบสมัคร: {matchedApp.applicationCode}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-emerald-100 border border-emerald-300 font-mono font-black text-emerald-900">
                      รหัสประจำตัวนิสิต: {matchedApp.assignedStudentCode || 'รอออกรหัสเมื่อยืนยันสิทธิ์'}
                    </span>
                  </div>
                </div>

                {/* 1.5 inch Photo Box */}
                <div className="w-[1.5in] h-[1.8in] border-2 border-dashed border-slate-400 rounded-lg flex flex-col items-center justify-center text-center p-2 text-[10px] text-slate-500 shrink-0">
                  <span className="font-bold">ติดรูปถ่าย</span>
                  <span>ขนาด ๑.๕ นิ้ว</span>
                  <span className="text-[9px] mt-1">(ชุดบรรพชิต/ชุดนิสิต)</span>
                </div>
              </div>

              {/* Student Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500">ชื่อ - ฉายา / นามสกุล:</span>{' '}
                  <strong className="text-slate-900 text-sm">
                    {matchedApp.titleName} {matchedApp.firstName} {matchedApp.lastName}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">สถานภาพ / สัญชาติ:</span>{' '}
                  <strong className="text-slate-900">
                    {matchedApp.applicantType === 'MONK' ? 'บรรพชิต (พระภิกษุ/สามเณร)' : 'คฤหัสถ์'} •{' '}
                    {matchedApp.nationality || 'ไทย'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">สาขาวิชา / หลักสูตร:</span>{' '}
                  <strong className="text-slate-900">{matchedApp.major}</strong>
                </div>
                <div>
                  <span className="text-slate-500">แผนการเรียน:</span>{' '}
                  <strong className="text-slate-900">{matchedApp.studyPlan}</strong>
                </div>
                <div>
                  <span className="text-slate-500">วุฒิการศึกษาเดิม:</span>{' '}
                  <strong className="text-slate-900">{matchedApp.previousEducation}</strong>
                </div>
                <div>
                  <span className="text-slate-500">โทรศัพท์ติดต่อ:</span>{' '}
                  <strong className="text-slate-900">{matchedApp.phone}</strong>
                </div>
              </div>

              {/* First Semester Course Plan Table */}
              {portalConfig.showFirstYearCoursePlan && enabledFirstYearCourses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    ตารางแผนการลงทะเบียนเรียน ภาคการศึกษาที่ ๑ ชั้นปีที่ ๑ (รวม {totalFirstYearCredits} หน่วยกิต)
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-300">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-800 border-b border-slate-300">
                        <tr>
                          <th className="py-2.5 px-3 font-bold w-12 text-center">ลำดับ</th>
                          <th className="py-2.5 px-3 font-bold w-28">รหัสวิชา</th>
                          <th className="py-2.5 px-3 font-bold">ชื่อรายวิชา</th>
                          <th className="py-2.5 px-3 font-bold w-36">หมวดวิชา</th>
                          <th className="py-2.5 px-3 font-bold w-20 text-center">หน่วยกิต</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {enabledFirstYearCourses.map((c, idx) => (
                          <tr key={c.id}>
                            <td className="py-2 px-3 text-center font-semibold">{idx + 1}</td>
                            <td className="py-2 px-3 font-mono font-bold text-indigo-900">{c.code}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{c.nameTh}</td>
                            <td className="py-2 px-3 text-slate-600">{c.type}</td>
                            <td className="py-2 px-3 text-center font-bold">{c.credits}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-extrabold text-slate-900 border-t-2 border-slate-300">
                          <td colSpan={4} className="py-2.5 px-3 text-right">
                            รวมหน่วยกิตลงทะเบียนประจำภาคการศึกษาที่ ๑
                          </td>
                          <td className="py-2.5 px-3 text-center text-emerald-800">
                            {totalFirstYearCredits} หน่วยกิต
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Signatures Footer */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-700">
                <div className="space-y-6">
                  <div>ลงชื่อ .......................................................... ผู้รายงานตัว</div>
                  <div>
                    ({matchedApp.titleName} {matchedApp.firstName} {matchedApp.lastName})
                  </div>
                </div>
                <div className="space-y-6">
                  <div>ลงชื่อ .......................................................... เจ้าหน้าที่รับรายงานตัว</div>
                  <div>(ฝ่ายทะเบียนและวัดผล คณะพุทธศาสตร์ มจร)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EnrollPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-sm text-slate-500">
          กำลังโหลดระบบรับสมัครและขึ้นทะเบียนนิสิตใหม่ออนไลน์...
        </div>
      }
    >
      <EnrollPortalContent />
    </Suspense>
  );
}
