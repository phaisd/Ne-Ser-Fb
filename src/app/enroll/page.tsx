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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AdmissionApplication, SystemSettings } from '@/types';
import {
  DEFAULT_ADMISSION_PORTAL_CONFIG,
  resolveAdmissionPortalConfig,
} from '@/lib/admission-config';
import { EnrollOverviewTab } from '@/components/enroll/EnrollOverviewTab';
import { EnrollApplyFormTab } from '@/components/enroll/EnrollApplyFormTab';
import { EnrollStatusTab } from '@/components/enroll/EnrollStatusTab';
import { EnrollRegisterVoucherTab } from '@/components/enroll/EnrollRegisterVoucherTab';
import { AdmissionDepartmentBannerSlider } from '@/components/enroll/AdmissionDepartmentBannerSlider';

type EnrollTab = 'OVERVIEW' | 'APPLY' | 'STATUS' | 'REGISTER';

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
  const [selectedMajorForApply, setSelectedMajorForApply] = useState<string | undefined>(undefined);

  const handleSelectMajorFromBanner = (majorName: string) => {
    setSelectedMajorForApply(majorName);
    setActiveTab('APPLY');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  };

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

  // Status Lookup & Registration State (Tab 3 & Tab 4)
  const [lookupQuery, setLookupQuery] = useState(initialCheckId);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [matchedApp, setMatchedApp] = useState<AdmissionApplication | null>(null);
  const [confirmingEnroll, setConfirmingEnroll] = useState(false);
  const [confirmSuccessMsg, setConfirmSuccessMsg] = useState<string | null>(null);

  // Mobile responsive accordion & collapsible controls
  const [isProcessStepsExpanded, setIsProcessStepsExpanded] = useState(false);
  const [isQuickTestExpanded, setIsQuickTestExpanded] = useState(false);
  const [isCoordinatorExpanded, setIsCoordinatorExpanded] = useState(false);

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
  const enabledFirstYearCourses = useMemo(
    () => portalConfig.firstYearCourses.filter((c) => c.enabled !== false),
    [portalConfig.firstYearCourses]
  );
  const totalFirstYearCredits = useMemo(
    () => enabledFirstYearCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0),
    [enabledFirstYearCourses]
  );

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

          {/* Coordinator Contact Card (Collapsible & Tap-to-call on Mobile) */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 sm:p-5 space-y-2 shrink-0 lg:w-80 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>{settings.admissionCoordinatorTitle || 'ศูนย์ประสานงานการรับสมัครนิสิตใหม่'}</span>
              </div>
              <span
                className={`sm:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  settings.admissionOpen !== false
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    settings.admissionOpen !== false ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`}
                />
                {settings.admissionOpen !== false ? 'เปิดรับสมัคร' : 'ปิดรับ'}
              </span>
            </div>

            <div className="text-sm font-extrabold text-white">
              {settings.admissionCoordinatorName || 'สำนักงานคณบดีคณะพุทธศาสตร์ ฝ่ายทะเบียนและวัดผล'}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
              <div className="text-xs text-slate-300 flex items-center gap-1.5">
                <span>โทร:</span>
                <a
                  href={`tel:${String(settings.admissionCoordinatorPhone || settings.contactPhone || '035248000').replace(/[^0-9]/g, '')}`}
                  className="font-bold text-amber-300 hover:underline flex items-center gap-1"
                >
                  <span>{settings.admissionCoordinatorPhone || settings.contactPhone || '035-248-000 ต่อ 8323'}</span>
                  <Phone className="w-3 h-3 text-amber-400 sm:hidden" />
                </a>
              </div>

              {/* Direct Touch Dial Button on Mobile */}
              <a
                href={`tel:${String(settings.admissionCoordinatorPhone || settings.contactPhone || '035248000').replace(/[^0-9]/g, '')}`}
                className="sm:hidden px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] inline-flex items-center gap-1 shadow-xs"
              >
                <Phone className="w-3 h-3" />
                <span>โทรสอบถาม</span>
              </a>
            </div>

            <div className="hidden sm:flex pt-1 items-center gap-2">
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

      {/* 1.5 Department Banner Slider (สไลด์แบนเนอร์สาขาวิชาโทนสีสบายตา) */}
      {portalConfig.showDepartmentBannerSlider && (
        <AdmissionDepartmentBannerSlider
          banners={portalConfig.departmentBanners}
          autoSlideInterval={portalConfig.bannerAutoSlideInterval}
          onSelectMajor={handleSelectMajorFromBanner}
        />
      )}

      {/* 2. 4-Step Process Flow Cards (Collapsible & Compact on Mobile) */}
      {portalConfig.showProcessSteps && (
        <div className="space-y-3 print:hidden">
          {/* Mobile Quick Touch Stepper & Accordion Header */}
          <div className="sm:hidden bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-xs font-black text-slate-900">๔ ขั้นตอนการรับสมัคร &amp; ขึ้นทะเบียน</span>
              </div>
              <button
                type="button"
                onClick={() => setIsProcessStepsExpanded((prev) => !prev)}
                className="text-xs font-bold text-orange-700 hover:text-orange-900 flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 transition cursor-pointer"
              >
                <span>{isProcessStepsExpanded ? 'ย่อเก็บ' : 'ดูรายละเอียด'}</span>
                {isProcessStepsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Quick Touch Stepper (Tap to jump to tab directly) */}
            <div className="grid grid-cols-4 gap-1.5 pt-0.5 text-center">
              <button
                type="button"
                onClick={() => setActiveTab('APPLY')}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                  activeTab === 'APPLY'
                    ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50/50'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-extrabold leading-tight">๑. สมัคร</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('STATUS')}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                  activeTab === 'STATUS'
                    ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-sky-50/50'
                }`}
              >
                <Search className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-extrabold leading-tight">๒. เอกสาร</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('STATUS')}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                  activeTab === 'STATUS'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50/50'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-extrabold leading-tight">๓. สัมภาษณ์</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('REGISTER')}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                  activeTab === 'REGISTER'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50/50'
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-extrabold leading-tight">๔. ทะเบียน</span>
              </button>
            </div>
          </div>

          {/* Full Process Cards: always visible on sm:, collapsible on mobile */}
          <div className={`${isProcessStepsExpanded ? 'grid' : 'hidden sm:grid'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`}>
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
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {portalConfig.showRegisterTab
                    ? '๔. ขึ้นทะเบียนนิสิตใหม่'
                    : '๔. รายงานตัวและขึ้นทะเบียน'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {portalConfig.showRegisterTab
                    ? 'ยืนยันสิทธิ์เข้าศึกษา รับรหัสประจำตัวนิสิต และพิมพ์ใบรายงานตัวออนไลน์'
                    : 'ผู้ผ่านการสอบสัมภาษณ์ ติดต่อสำนักทะเบียนและวัดผล มจร เพื่อรายงานตัวและขึ้นทะเบียน'}
                </p>
              </div>
              {portalConfig.showRegisterTab ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('REGISTER')}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  ขึ้นทะเบียนนิสิตออนไลน์ →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('STATUS')}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  ดูประกาศผล &amp; คำแนะนำ →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Quick Test Simulation Links Bar (Collapsible on Mobile) */}
      {portalConfig.showQuickTestBar && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 sm:p-4 text-xs print:hidden">
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setIsQuickTestExpanded((prev) => !prev)}
          >
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>แถบทดสอบระบบด่วน (จำลองตรวจสถานะ &amp; ขึ้นทะเบียน)</span>
            </div>
            <button
              type="button"
              className="sm:hidden text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <span>{isQuickTestExpanded ? 'ย่อเก็บ' : 'คลิกเพื่อทดสอบ'}</span>
              {isQuickTestExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className={`${isQuickTestExpanded ? 'flex' : 'hidden sm:flex'} flex-wrap items-center gap-2 pt-2.5 sm:pt-2`}>
            <button
              type="button"
              onClick={() =>
                handleQuickTest(
                  '1349900123456',
                  portalConfig.showRegisterTab ? 'REGISTER' : 'STATUS'
                )
              }
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold transition cursor-pointer shadow-2xs text-[11px] sm:text-xs"
            >
              🟢 ผู้ผ่านสัมภาษณ์ (1349900123456)
            </button>
            <button
              type="button"
              onClick={() => handleQuickTest('1349900987654', 'STATUS')}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-sky-800 border border-sky-300 font-bold transition cursor-pointer shadow-2xs text-[11px] sm:text-xs"
            >
              🔵 รอสัมภาษณ์ (1349900987654)
            </button>
            <button
              type="button"
              onClick={() =>
                handleQuickTest(
                  '1349900555555',
                  portalConfig.showRegisterTab ? 'REGISTER' : 'STATUS'
                )
              }
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-purple-800 border border-purple-300 font-bold transition cursor-pointer shadow-2xs text-[11px] sm:text-xs"
            >
              🟣 ขึ้นทะเบียนแล้ว (1349900555555)
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Tab Navigation (2x2 Grid on Mobile, Flex on Desktop) */}
      {visibleTabs.length > 0 ? (
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-200 shadow-xs print:hidden">
          {visibleTabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 sm:min-w-[180px] inline-flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer text-center ${
                  active
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-slate-50/70 sm:bg-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">{t.label}</span>
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
        <EnrollOverviewTab
          portalConfig={portalConfig}
          academicYear={academicYear}
          enabledQualifications={enabledQualifications}
          enabledRequiredDocs={enabledRequiredDocs}
          onGoToApply={() => setActiveTab('APPLY')}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: ONLINE APPLICATION FORM
         ───────────────────────────────────────────────────────────── */}
      {portalConfig.showApplyTab && activeTab === 'APPLY' && (
        <EnrollApplyFormTab
          portalConfig={portalConfig}
          settings={settings}
          academicYear={academicYear}
          initialMajor={selectedMajorForApply}
          onSubmittedApplication={(app) => {
            setMatchedApp(app);
            setLookupQuery(app.applicationCode);
          }}
          onGoToStatus={() => setActiveTab('STATUS')}
          onGoToRegister={() => setActiveTab('REGISTER')}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: CHECK STATUS & INTERVIEW SCHEDULE
         ───────────────────────────────────────────────────────────── */}
      {portalConfig.showStatusTab && activeTab === 'STATUS' && (
        <EnrollStatusTab
          portalConfig={portalConfig}
          settings={settings}
          matchedApp={matchedApp}
          lookupQuery={lookupQuery}
          setLookupQuery={setLookupQuery}
          lookupLoading={lookupLoading}
          lookupError={lookupError}
          onSearch={() => handleSearchApplication()}
          onGoToRegister={() => setActiveTab('REGISTER')}
          getStepNumber={getStepNumber}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: ONLINE REGISTRATION & OFFICIAL CERTIFICATE VOUCHER
         ───────────────────────────────────────────────────────────── */}
      {portalConfig.showRegisterTab && activeTab === 'REGISTER' && (
        <EnrollRegisterVoucherTab
          portalConfig={portalConfig}
          settings={settings}
          matchedApp={matchedApp}
          lookupQuery={lookupQuery}
          setLookupQuery={setLookupQuery}
          lookupLoading={lookupLoading}
          lookupError={lookupError}
          confirmingEnroll={confirmingEnroll}
          confirmSuccessMsg={confirmSuccessMsg}
          enabledFirstYearCourses={enabledFirstYearCourses}
          totalFirstYearCredits={totalFirstYearCredits}
          onSearch={() => handleSearchApplication()}
          onConfirmEnrollment={handleConfirmEnrollment}
        />
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
