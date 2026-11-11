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
            <div className="p-4 sm:p-5 rounded-2xl bg-red-50/90 border-2 border-red-400 text-red-950 shadow-sm flex items-start gap-3.5 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-600/30 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-200/90 text-red-900 font-extrabold text-[10px] uppercase tracking-wider">
                  ⚠️ {t.certVisaAlertTitle}
                </span>
                <p className="font-bold text-sm text-red-950 leading-snug">
                  {isEn ? t.certVisaAlertDesc : (settings?.visaAlertTitle || 'สำหรับการต่อวีซ่า ให้ดำเนินการก่อนหนังสือเดินทางหมดอายุ 30 วัน')}
                </p>
                {settings?.visaAlertDesc && !isEn && (
                  <p className="text-xs text-red-800 leading-relaxed">
                    {settings.visaAlertDesc}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* กล่องที่ 2: ระยะเวลาดำเนินการ */}
          {settings?.timelineAlertEnabled !== false && (
            <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/90 border-2 border-sky-400 text-sky-950 shadow-sm flex items-start gap-3.5 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-600/30 mt-0.5">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-200/90 text-sky-900 font-extrabold text-[10px] uppercase tracking-wider">
                  ⏱️ {t.certTimelineAlertTitle}
                </span>
                <p className="font-bold text-sm text-sky-950 leading-snug">
                  {isEn ? t.certTimelineAlertDesc : (settings?.timelineAlertTitle || 'การดำเนินการ จะเสร็จสิ้น ประมาณ 1-2 วัน ไม่นับวันหยุด หรือ กรุณาตรวจดูเส้นทางการดำเนินการหนังสือว่า "อนุมัติ"')}
                </p>
                {settings?.timelineAlertDesc && !isEn && (
                  <p className="text-xs text-sky-800 leading-relaxed">
                    {settings.timelineAlertDesc}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* กล่องที่ 3: ความถูกต้องครบถ้วนของข้อมูล */}
          {settings?.accuracyAlertEnabled !== false && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border-2 border-amber-400 text-amber-950 shadow-sm flex items-start gap-3.5 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30 mt-0.5">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-200/90 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider">
                  📋 {t.certAccuracyAlertTitle}
                </span>
                <p className="font-bold text-sm text-amber-950 leading-snug">
                  {isEn ? t.certAccuracyAlertDesc : (settings?.accuracyAlertTitle || 'กรุณากรอกข้อมูลให้ครบถ้วน มิฉะนั้นเอกสารจะไม่สมบูรณ์และจะยกเลิกการขอหนังสือ')}
                </p>
                {settings?.accuracyAlertDesc && !isEn && (
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
              {t.certStep1Title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t.certStep1Sub}
            </p>
          </div>

          {/* Category Filter Pills (Touch-Friendly & Scrollable) */}
          <div className="w-full sm:w-auto flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth text-xs font-bold">
            {!isInstructorOnly && (
              <>
                <button
                  type="button"
                  onClick={() => setCardAudienceFilter('ALL')}
                  className={`shrink-0 min-h-[38px] px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                    cardAudienceFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.certFilterAll} ({visibleCards.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCardAudienceFilter('THAI')}
                  className={`shrink-0 min-h-[38px] px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    cardAudienceFilter === 'THAI'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <span>🇹🇭 {t.certFilterThai}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardAudienceFilter('INTERNATIONAL')}
                  className={`shrink-0 min-h-[38px] px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    cardAudienceFilter === 'INTERNATIONAL'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <span>🌐 {t.certFilterInter}</span>
                </button>
              </>
            )}

            {/* Staff Filter Button: visible if isStaffUser is TRUE or admin enables showStaffCertificatesInPortal */}
            {(isStaffUser || settings?.showStaffCertificatesInPortal === true) && (
              <button
                type="button"
                onClick={() => setCardAudienceFilter('STAFF')}
                className={`shrink-0 min-h-[38px] px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  cardAudienceFilter === 'STAFF'
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/20'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300'
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
                className={`shrink-0 min-h-[38px] px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  cardAudienceFilter === 'CANDIDATE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <span>🎓 {t.certFilterCandidate}</span>
                {!admissionStatus.isOpen && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-normal">
                    ปิดรับ
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* User Authenticated Badge (if logged in) */}
        {currentUser && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-3.5 bg-gradient-to-r from-purple-50 via-white to-purple-50/50 border border-purple-200 rounded-2xl text-xs">
            <div className="flex items-center gap-2.5 text-purple-900">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-500">{isEn ? 'Logged in as:' : 'เข้าสู่ระบบในชื่อ:'}</span>
                <strong className="font-extrabold text-purple-950">{currentUser.name || currentUser.fullName}</strong>
                {currentUser.studentCode && (
                  <span className="font-mono px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[11px]">
                    {currentUser.studentCode}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isEn ? 'Authenticated Account' : 'ยืนยันตัวตนในระบบแล้ว'}</span>
            </span>
          </div>
        )}

        {/* Content View: Login Prompt vs Candidate Notice vs Normal Cards Grid */}
        {requiresStudentLogin ? (
          /* REPLACE IMAGE 2 WITH LOGIN REQUIRED PROMPT FOR STUDENTS */
          <div className="p-8 sm:p-12 text-center bg-gradient-to-b from-purple-50/70 via-white to-purple-50/30 rounded-3xl border-2 border-dashed border-purple-300/80 shadow-xs space-y-4 animate-in fade-in">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/25">
              <LogIn className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {isEn
                  ? 'Students please log in to request certificates'
                  : 'นิสิตกรุณาเข้าระบบสำหรับการขอหนังสือรับรอง'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
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
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition cursor-pointer"
                >
                  🎓 {isEn ? 'Newly Admitted Candidates (Click here)' : 'ผู้ผ่านการคัดเลือกเข้าเรียนใหม่ (คลิกที่นี่)'}
                </button>
              )}
            </div>
          </div>
        ) : requiresStaffLogin ? (
          /* STAFF LOGIN REQUIRED PROMPT */
          <div className="p-8 sm:p-12 text-center bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 rounded-3xl border-2 border-dashed border-amber-300 shadow-xs space-y-4 animate-in fade-in">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/25">
              <Lock className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                เฉพาะอาจารย์และเจ้าหน้าที่คณะพุทธศาสตร์เท่านั้น
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
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
          <div className="p-8 sm:p-12 text-center bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30 rounded-3xl border-2 border-dashed border-amber-300 shadow-xs space-y-4 animate-in fade-in">
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
                        ? 'border-amber-500 bg-amber-50/40 shadow-md ring-2 ring-amber-500/20'
                        : isCandidate
                        ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
                        : isThai
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
                          isStaff ? 'bg-amber-100' : isCandidate ? 'bg-emerald-100' : isThai ? 'bg-blue-100' : 'bg-purple-100'
                        }`}
                      >
                        {renderCertIcon(card.iconName, card.targetAudience)}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isStaff ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            👔 {isEn ? 'Faculty / Staff' : 'อาจารย์/บุคลากร'}
                          </span>
                        ) : isCandidate ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            🎓 {isEn ? 'Candidate' : 'ผู้ผ่านการคัดเลือก'}
                          </span>
                        ) : isThai ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                            🇹🇭 {isEn ? 'Thai Student' : 'นิสิตไทย'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">
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
                            ? 'text-amber-950 font-black'
                            : isCandidate
                            ? 'text-emerald-950 font-black'
                            : isThai
                            ? 'text-blue-900'
                            : 'text-purple-900'
                          : 'text-slate-800'
                      }`}
                    >
                      {isEn ? ((card as any).titleEn || (card as any).nameEn || card.name) : ((card as any).titleTh || card.name)}
                    </h3>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {isEn ? ((card as any).descriptionEn || card.description) : ((card as any).descriptionTh || card.description)}
                    </p>
                  </div>

                  {/* Bottom Status */}
                  <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-400 font-semibold">{card.code || 'CERT'}</span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isSelected
                          ? isStaff
                            ? 'text-amber-800'
                            : isCandidate
                            ? 'text-emerald-800'
                            : isThai
                            ? 'text-blue-700'
                            : 'text-purple-700'
                          : 'text-slate-400 group-hover:text-purple-600'
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
                ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                : selectedCert.targetAudience === 'CANDIDATE' || selectedCert.category === 'ADMISSION'
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : selectedCert.targetAudience === 'THAI'
                ? 'bg-blue-50/90 border-blue-200 text-blue-900'
                : 'bg-purple-50/90 border-purple-200 text-purple-900'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="font-bold text-slate-600">ประเภทที่เลือกไว้:</span>
              <span className="font-black text-sm sm:text-base underline">{selectedCert.name}</span>
              <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-white border border-current shadow-2xs">
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
