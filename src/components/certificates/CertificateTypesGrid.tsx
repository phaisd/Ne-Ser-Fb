'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import {
  GraduationCap,
  Home,
  Award,
  Landmark,
  Smartphone,
  Globe,
  PlaneTakeoff,
  FileCheck,
  MapPin,
  BookOpen,
  UserCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  LogIn,
  Calendar,
  Lock,
  User,
} from 'lucide-react';
import { CertTypeItem } from './types';
import { isAdmissionPeriodActive } from '@/lib/utils';
import { isAdminOrOfficer } from '@/lib/auth-client';

interface CertificateTypesGridProps {
  settings: any;
  certTypes: CertTypeItem[];
  visibleCards: CertTypeItem[];
  cardAudienceFilter: 'THAI' | 'INTERNATIONAL' | 'STAFF' | 'CANDIDATE' | 'ALL';
  setCardAudienceFilter: (val: 'THAI' | 'INTERNATIONAL' | 'STAFF' | 'CANDIDATE' | 'ALL') => void;
  isStaffUser: boolean;
  currentUser?: any;
  selectedCert: CertTypeItem | null;
  onCardSelect: (card: CertTypeItem) => void;
  onProceedToForm?: () => void;
}

export const renderCertIcon = (iconName?: string, target?: string) => {
  const iconClass =
    target === 'STAFF'
      ? 'w-6 h-6 text-amber-600'
      : target === 'CANDIDATE'
      ? 'w-6 h-6 text-emerald-600'
      : target === 'THAI'
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
    case 'UserCheck':
      return <UserCheck className={iconClass} />;
    default:
      return <FileText className={iconClass} />;
  }
};

export const CertificateTypesGrid: React.FC<CertificateTypesGridProps> = ({
  settings,
  certTypes,
  visibleCards,
  cardAudienceFilter,
  setCardAudienceFilter,
  isStaffUser,
  currentUser,
  selectedCert,
  onCardSelect,
  onProceedToForm,
}) => {
  const { t, isEn } = useLanguage();
  const admissionStatus = isAdmissionPeriodActive(settings);
  const isInstructorOnly = Boolean(
    currentUser &&
      String(currentUser.role || '').toUpperCase() === 'INSTRUCTOR' &&
      !isAdminOrOfficer(currentUser),
  );
  const showCandidateButton =
    !isInstructorOnly &&
    (admissionStatus.isOpen || settings?.hideCandidateTabWhenClosed !== true);

  const isStudentAudience =
    cardAudienceFilter === 'ALL' ||
    cardAudienceFilter === 'THAI' ||
    cardAudienceFilter === 'INTERNATIONAL';

  const isCandidateAudience = cardAudienceFilter === 'CANDIDATE';
  const isStaffAudience = cardAudienceFilter === 'STAFF';

  // Auth requirement conditions:
  const requiresStudentLogin = isStudentAudience && !currentUser;
  const requiresStaffLogin = isStaffAudience && !isStaffUser;
  return (
    <>
      {/* Important Notices for Students (hidden for Instructors who only request Staff certs) */}
      {!isInstructorOnly &&
        (settings?.visaAlertEnabled !== false ||
          settings?.timelineAlertEnabled !== false ||
          settings?.accuracyAlertEnabled !== false) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* กล่องที่ 1: แจ้งเตือนสีแดง (สำหรับการต่อวีซ่า 30 วัน) */}
          {settings?.visaAlertEnabled !== false && (
            <div className="p-4 sm:p-5 rounded-2xl bg-red-50/90 dark:bg-red-950/30 border-2 border-red-400 dark:border-red-500/50 text-red-950 dark:text-red-100 shadow-sm flex items-start gap-3.5 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-600/30 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-200/90 dark:bg-red-900/60 text-red-900 dark:text-red-200 font-extrabold text-[10px] uppercase tracking-wider">
                  ⚠️ {t.certVisaAlertTitle}
                </span>
                <p className="font-bold text-sm text-red-950 dark:text-white leading-snug">
                  {isEn ? t.certVisaAlertDesc : (settings?.visaAlertTitle || 'สำหรับการต่อวีซ่า ให้ดำเนินการก่อนหนังสือเดินทางหมดอายุ 30 วัน')}
                </p>
                {settings?.visaAlertDesc && !isEn && (
                  <p className="text-xs text-red-800 dark:text-red-200/90 leading-relaxed">
                    {settings.visaAlertDesc}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* กล่องที่ 2: ระยะเวลาดำเนินการ */}
          {settings?.timelineAlertEnabled !== false && (
            <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/90 dark:bg-sky-950/30 border-2 border-sky-400 dark:border-sky-500/50 text-sky-950 dark:text-sky-100 shadow-sm flex items-start gap-3.5 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-600/30 mt-0.5">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-200/90 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200 font-extrabold text-[10px] uppercase tracking-wider">
                  ⏱️ {t.certTimelineAlertTitle}
                </span>
                <p className="font-bold text-sm text-sky-950 dark:text-white leading-snug">
                  {isEn ? t.certTimelineAlertDesc : (settings?.timelineAlertTitle || 'การดำเนินการ จะเสร็จสิ้น ประมาณ 1-2 วัน ไม่นับวันหยุด หรือ กรุณาตรวจดูเส้นทางการดำเนินการหนังสือว่า "อนุมัติ"')}
                </p>
                {settings?.timelineAlertDesc && !isEn && (
                  <p className="text-xs text-sky-800 dark:text-sky-200/90 leading-relaxed">
                    {settings.timelineAlertDesc}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* กล่องที่ 3: ความถูกต้องครบถ้วนของข้อมูล */}
          {settings?.accuracyAlertEnabled !== false && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-500/50 text-amber-950 dark:text-amber-100 shadow-sm flex items-start gap-3.5 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30 mt-0.5">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-200/90 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-extrabold text-[10px] uppercase tracking-wider">
                  📋 {t.certAccuracyAlertTitle}
                </span>
                <p className="font-bold text-sm text-amber-950 dark:text-white leading-snug">
                  {isEn ? t.certAccuracyAlertDesc : (settings?.accuracyAlertTitle || 'กรุณากรอกข้อมูลให้ครบถ้วน มิฉะนั้นเอกสารจะไม่สมบูรณ์และจะยกเลิกการขอหนังสือ')}
                </p>
                {settings?.accuracyAlertDesc && !isEn && (
                  <p className="text-xs text-amber-800 dark:text-amber-200/90 leading-relaxed">
                    {settings.accuracyAlertDesc}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section A: Card Selector */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center text-sm font-black">
                1
              </span>
              {t.certStep1Title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.certStep1Sub}
            </p>
          </div>

          {/* Category Filter Pills (Mobile Grid - All Visible Without Horizontal Scroll) */}
          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2 p-2 bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800 rounded-2xl text-xs font-bold">
            {!isInstructorOnly && (
              <>
                <button
                  type="button"
                  onClick={() => setCardAudienceFilter('ALL')}
                  className={`min-h-[42px] px-3 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    cardAudienceFilter === 'ALL'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm ring-2 ring-slate-900/15'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <span>📋 {t.certFilterAll} ({visibleCards.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardAudienceFilter('THAI')}
                  className={`min-h-[42px] px-3 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    cardAudienceFilter === 'THAI'
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/25'
                      : 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50'
                  }`}
                >
                  <span>🇹🇭 {t.certFilterThai}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardAudienceFilter('INTERNATIONAL')}
                  className={`col-span-2 sm:col-span-1 min-h-[42px] px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    cardAudienceFilter === 'INTERNATIONAL'
                      ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-500/25'
                      : 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50'
                  }`}
                >
                  <span>🌐 {isEn ? t.certFilterInter : 'นิสิตต่างประเทศ (International)'}</span>
                </button>
              </>
            )}

            {/* Staff Filter Button: visible if isStaffUser is TRUE or admin enables showStaffCertificatesInPortal */}
            {(isStaffUser || settings?.showStaffCertificatesInPortal === true) && (
              <button
                type="button"
                onClick={() => setCardAudienceFilter('STAFF')}
                className={`col-span-2 sm:col-span-1 min-h-[42px] px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  cardAudienceFilter === 'STAFF'
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/20'
                    : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-amber-950/40 border border-amber-300 dark:border-amber-900/50'
                }`}
              >
                <span>👔 {t.certFilterStaff}</span>
              </button>
            )}

            {/* Candidate Filter Button */}
            {showCandidateButton && (
              <button
                type="button"
                onClick={() => setCardAudienceFilter('CANDIDATE')}
                className={`col-span-2 sm:col-span-1 min-h-[42px] px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  cardAudienceFilter === 'CANDIDATE'
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/25'
                    : 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50'
                }`}
              >
                <span>🎓 {t.certFilterCandidate}</span>
                {!admissionStatus.isOpen && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-normal border border-amber-300 dark:border-amber-800">
                    ปิดรับ
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* User Authenticated Badge (if logged in) */}
        {currentUser && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-3.5 bg-gradient-to-r from-purple-50 via-white to-purple-50/50 dark:from-purple-950/40 dark:via-slate-900 dark:to-purple-950/20 border border-purple-200 dark:border-purple-800/60 rounded-2xl text-xs">
            <div className="flex items-center gap-2.5 text-purple-900 dark:text-purple-200">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Logged in as:' : 'เข้าสู่ระบบในชื่อ:'}</span>
                <strong className="font-extrabold text-purple-950 dark:text-white">{currentUser.name || currentUser.fullName}</strong>
                {currentUser.studentCode && (
                  <span className="font-mono px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold text-[11px] border border-transparent dark:border-purple-800">
                    {currentUser.studentCode}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isEn ? 'Authenticated Account' : 'ยืนยันตัวตนในระบบแล้ว'}</span>
            </span>
          </div>
        )}

        {/* Content View: Login Prompt vs Candidate Notice vs Normal Cards Grid */}
        {requiresStudentLogin ? (
          /* REPLACE IMAGE 2 WITH LOGIN REQUIRED PROMPT FOR STUDENTS */
          <div className="p-8 sm:p-12 text-center bg-gradient-to-b from-purple-50/70 via-white to-purple-50/30 dark:from-purple-950/30 dark:via-slate-900 dark:to-purple-950/20 rounded-3xl border-2 border-dashed border-purple-300/80 dark:border-purple-800/80 shadow-xs space-y-4 animate-in fade-in">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/25">
              <LogIn className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isEn
                  ? 'Students please log in to request certificates'
                  : 'นิสิตกรุณาเข้าระบบสำหรับการขอหนังสือรับรอง'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isEn
                  ? 'To ensure accuracy of records and protect student privacy (PDPA), please log in with your student account before requesting.'
                  : 'เพื่อความถูกต้องของข้อมูลตามระบบทะเบียนและความปลอดภัยของข้อมูลส่วนบุคคล (PDPA) กรุณาเข้าสู่ระบบด้วยบัญชีนิสิตก่อนยื่นคำร้อง'}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login?callbackUrl=/certificates"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{isEn ? 'Log in now (Student)' : 'เข้าสู่ระบบ (Login)'}</span>
              </Link>
              {showCandidateButton && (
                <button
                  type="button"
                  onClick={() => setCardAudienceFilter('CANDIDATE')}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer"
                >
                  🎓 {isEn ? 'Newly Admitted Candidates (Click here)' : 'ผู้ผ่านการคัดเลือกเข้าเรียนใหม่ (คลิกที่นี่)'}
                </button>
              )}
            </div>
          </div>
        ) : requiresStaffLogin ? (
          /* STAFF LOGIN REQUIRED PROMPT */
          <div className="p-8 sm:p-12 text-center bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20 rounded-3xl border-2 border-dashed border-amber-300 dark:border-amber-800/80 shadow-xs space-y-4 animate-in fade-in">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/25">
              <Lock className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                เฉพาะอาจารย์และเจ้าหน้าที่คณะพุทธศาสตร์เท่านั้น
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                กรุณาเข้าสู่ระบบด้วยบัญชีอาจารย์หรือบุคลากรเพื่อยื่นคำร้องขอหนังสือรับรองการปฏิบัติงาน/ภาระงานสอน
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <Link
                href="/login?callbackUrl=/certificates"
                className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบอาจารย์/บุคลากร</span>
              </Link>
            </div>
          </div>
        ) : isCandidateAudience && !admissionStatus.isOpen ? (
          /* CANDIDATE CLOSED NOTICE */
          <div className="p-8 sm:p-12 text-center bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20 rounded-3xl border-2 border-dashed border-amber-300 dark:border-amber-800/80 shadow-xs space-y-4 animate-in fade-in">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                ขณะนี้อยู่นอกช่วงเวลาเปิดรับคำร้องสำหรับผู้ผ่านการคัดเลือกใหม่
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {admissionStatus.reason || 'กรุณาติดตามกำหนดการเปิดรับสมัครและยื่นคำร้องของคณะพุทธศาสตร์'}
              </p>
              {admissionStatus.periodText && (
                <div className="pt-1">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 shadow-2xs">
                    📅 กำหนดการเปิดรับคำร้อง: {admissionStatus.periodText}
                  </span>
                </div>
              )}
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCardAudienceFilter('THAI')}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition cursor-pointer"
              >
                ← กลับไปดูหนังสือรับรองสำหรับนิสิต
              </button>
            </div>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleCards.map((card) => {
              const isSelected = selectedCert?.id === card.id;
              const isThai = card.targetAudience === 'THAI';
              const isStaff = card.targetAudience === 'STAFF';
              const isCandidate = card.targetAudience === 'CANDIDATE' || card.category === 'ADMISSION';

              return (
                <div
                  key={card.id}
                  onClick={() => onCardSelect(card)}
                  className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-left flex flex-col justify-between ${
                    isSelected
                      ? isStaff
                        ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 shadow-md ring-2 ring-amber-500/20'
                        : isCandidate
                        ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-500/20'
                        : isThai
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/20'
                        : 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/30 shadow-md ring-2 ring-purple-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 shadow-sm'
                  }`}
                >
                  <div>
                    {/* Card Header: Icon & Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isStaff
                            ? 'bg-amber-100 dark:bg-amber-950/60'
                            : isCandidate
                            ? 'bg-emerald-100 dark:bg-emerald-950/60'
                            : isThai
                            ? 'bg-blue-100 dark:bg-blue-950/60'
                            : 'bg-purple-100 dark:bg-purple-950/60'
                        }`}
                      >
                        {renderCertIcon(card.iconName, card.targetAudience)}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isStaff ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                            👔 {isEn ? 'Faculty / Staff' : 'อาจารย์/บุคลากร'}
                          </span>
                        ) : isCandidate ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                            🎓 {isEn ? 'Candidate' : 'ผู้ผ่านการคัดเลือก'}
                          </span>
                        ) : isThai ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-transparent dark:border-blue-900/40">
                            🇹🇭 {isEn ? 'Thai Student' : 'นิสิตไทย'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-transparent dark:border-purple-900/40">
                            🌐 {isEn ? 'International' : 'ต่างชาติ (Intl)'}
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
                          ? isStaff
                            ? 'text-amber-950 dark:text-amber-200 font-black'
                            : isCandidate
                            ? 'text-emerald-950 dark:text-emerald-200 font-black'
                            : isThai
                            ? 'text-blue-900 dark:text-blue-200'
                            : 'text-purple-900 dark:text-purple-200'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {isEn ? ((card as any).titleEn || (card as any).nameEn || card.name) : ((card as any).titleTh || card.name)}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {isEn ? ((card as any).descriptionEn || card.description) : ((card as any).descriptionTh || card.description)}
                    </p>
                  </div>

                  {/* Bottom Status */}
                  <div className="mt-4 pt-3 border-t border-slate-100/80 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-400 dark:text-slate-400 font-semibold">{card.code || 'CERT'}</span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isSelected
                          ? isStaff
                            ? 'text-amber-800 dark:text-amber-300'
                            : isCandidate
                            ? 'text-emerald-800 dark:text-emerald-300'
                            : isThai
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-purple-700 dark:text-purple-300'
                          : 'text-slate-400 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                      }`}
                    >
                      <span>{isSelected ? (isEn ? 'Selected ✓' : '✓ เลือกแล้ว (คลิกเพื่อไปกรอกแบบฟอร์ม)') : (isEn ? 'Click to select →' : 'คลิกเลือกการ์ดนี้เพื่อไปข้อ 2')}</span>
                      <span className="text-xs">➔</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedCert && (
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-xs animate-in fade-in duration-200 ${
              selectedCert.targetAudience === 'STAFF'
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-950 dark:text-amber-100'
                : selectedCert.targetAudience === 'CANDIDATE' || selectedCert.category === 'ADMISSION'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100'
                : selectedCert.targetAudience === 'THAI'
                ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-100'
                : 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-100'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="font-bold text-slate-600 dark:text-slate-300">ประเภทที่เลือกไว้:</span>
              <span className="font-black text-sm sm:text-base underline">{selectedCert.name}</span>
              <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-current shadow-2xs">
                {selectedCert.targetAudience === 'STAFF'
                  ? 'สำหรับอาจารย์และเจ้าหน้าที่'
                  : selectedCert.targetAudience === 'CANDIDATE' || selectedCert.category === 'ADMISSION'
                  ? 'สำหรับผู้ผ่านการคัดเลือกเข้าเรียนใหม่'
                  : selectedCert.targetAudience === 'THAI'
                  ? 'สำหรับคนไทย'
                  : 'สำหรับนิสิตต่างประเทศ'}
              </span>
            </div>

            {onProceedToForm && (
              <button
                type="button"
                onClick={onProceedToForm}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
              >
                <span>ดำเนินการต่อ: กรอกแบบฟอร์มคำร้อง (ไปข้อ 2)</span>
                <span>➔</span>
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
