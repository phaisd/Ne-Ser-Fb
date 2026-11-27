'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  AlertCircle,
  Calendar,
  Globe,
  GraduationCap,
  Megaphone,
  CheckCircle2,
  Users,
  ExternalLink,
  Building2,
  Printer,
  FileCheck,
  Phone,
  Clock,
  Filter,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { AdmissionApplication, AdmissionPortalConfig, SystemSettings } from '@/types';

interface EnrollStatusTabProps {
  portalConfig: AdmissionPortalConfig;
  settings: Partial<SystemSettings>;
  matchedApp: AdmissionApplication | null;
  lookupQuery: string;
  setLookupQuery: (val: string) => void;
  lookupLoading: boolean;
  lookupError: string | null;
  onSearch: () => void;
  onGoToRegister: () => void;
  getStepNumber: (status?: AdmissionApplication['status']) => number;
}

export function EnrollStatusTab({
  portalConfig,
  settings,
  matchedApp,
  lookupQuery,
  setLookupQuery,
  lookupLoading,
  lookupError,
  onSearch,
  onGoToRegister,
  getStepNumber,
}: EnrollStatusTabProps) {
  // Mode: Search Individual vs Public Roster of Passed Interviewees
  const [statusMode, setStatusMode] = useState<'SEARCH' | 'ROSTER'>('SEARCH');

  // Roster state
  const [rosterApplications, setRosterApplications] = useState<AdmissionApplication[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterDegreeFilter, setRosterDegreeFilter] = useState<string>('ALL');
  const [rosterMajorFilter, setRosterMajorFilter] = useState<string>('ALL');
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [rosterViewMode, setRosterViewMode] = useState<'card' | 'table'>('card');

  const loadRoster = async () => {
    setLoadingRoster(true);
    try {
      const res = await fetch('/api/admissions');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRosterApplications(data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (statusMode === 'ROSTER' && rosterApplications.length === 0) {
      loadRoster();
    }
  }, [statusMode]);

  // Filter only those who passed the interview (INTERVIEW_PASS or ENROLLED)
  const passedApplicants = useMemo(() => {
    return rosterApplications.filter(
      (a) => a.status === 'INTERVIEW_PASS' || a.status === 'ENROLLED'
    );
  }, [rosterApplications]);

  // Filtered roster by search and select
  const filteredPassedList = useMemo(() => {
    return passedApplicants.filter((a) => {
      if (rosterDegreeFilter !== 'ALL' && a.degreeLevel !== rosterDegreeFilter) {
        return false;
      }
      if (rosterMajorFilter !== 'ALL' && a.major !== rosterMajorFilter) {
        return false;
      }
      if (rosterSearch.trim()) {
        const q = rosterSearch.trim().toLowerCase();
        const hay = `${a.applicationCode} ${a.titleName} ${a.firstName} ${a.lastName} ${a.major} ${a.assignedStudentCode || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [passedApplicants, rosterDegreeFilter, rosterMajorFilter, rosterSearch]);

  const uniqueMajors = useMemo(() => {
    const set = new Set<string>();
    passedApplicants.forEach((a) => {
      if (a.major) set.add(a.major);
    });
    return Array.from(set);
  }, [passedApplicants]);

  const registrarOfficeName =
    portalConfig.registrarOfficeName ||
    'สำนักทะเบียนและวัดผล มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย';
  const registrarOfficeContact =
    portalConfig.registrarOfficeContact ||
    'อาคารเรียนรวม / สำนักงานอธิการบดี ชั้น 3 โทร. 035-248-000 ต่อ 8100';
  const registrarWebsiteUrl = portalConfig.registrarWebsiteUrl || 'https://reg.mcu.ac.th';
  const noticeTitle =
    portalConfig.passedInterviewNoticeTitle ||
    'ประกาศรายชื่อผู้ผ่านการสอบสัมภาษณ์ และขั้นตอนการขึ้นทะเบียนนิสิต';
  const noticeText =
    portalConfig.passedInterviewNoticeText ||
    'ขอให้ผู้มีรายชื่อผ่านการสอบสัมภาษณ์ (มีสิทธิ์เข้าศึกษา) เตรียมเอกสารหลักฐานตัวจริง และดำเนินการติดต่อสำนักทะเบียนและวัดผล มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย เพื่อรายงานตัวและขึ้นทะเบียนนิสิตใหม่ตามกำหนดการ';

  const showRosterFeature = portalConfig.showPassedInterviewRoster !== false;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-8 space-y-6">
      {/* Header & Sub-mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-sky-600" />
            <span>
              {portalConfig.statusSectionTitle || 'ตรวจสอบสถานะการสมัคร & ตารางนัดสอบสัมภาษณ์'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {portalConfig.statusSectionSubtitle ||
              'กรอกเลขประจำตัวประชาชน 13 หลัก, เลขพาสปอร์ต หรือรหัสใบสมัคร เพื่อตรวจสอบสถานะและดูประกาศผล'}
          </p>
        </div>

        {/* View Mode Buttons */}
        {showRosterFeature && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusMode('SEARCH')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusMode === 'SEARCH'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-sky-600" />
              <span>ค้นหาผลรายบุคคล</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusMode('ROSTER')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusMode === 'ROSTER'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-300" />
              <span>ประกาศรายชื่อผู้ผ่านสัมภาษณ์</span>
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODE A: INDIVIDUAL SEARCH
         ───────────────────────────────────────────────────────────── */}
      {statusMode === 'SEARCH' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder="กรอกเลขบัตรประชาชน 13 หลัก / Passport / รหัสใบสมัคร..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono text-slate-900"
            />
            <button
              type="button"
              onClick={onSearch}
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
                    <div className="text-[10px] font-bold text-emerald-700 uppercase">
                      รหัสประจำตัวนิสิตใหม่
                    </div>
                    <div className="text-xl font-black font-mono text-emerald-900">
                      {matchedApp.assignedStudentCode}
                    </div>
                  </div>
                )}
              </div>

              {/* 4-Step Progress Tracker (2x2 Grid on Mobile, 4 Cols on Desktop) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  { step: 1, title: '๑. ยื่นใบสมัครแล้ว', desc: 'ระบบได้รับข้อมูลผู้สมัคร' },
                  { step: 2, title: '๒. ตรวจสอบเอกสาร', desc: 'ตรวจคุณสมบัติผ่านแล้ว' },
                  { step: 3, title: '๓. สอบสัมภาษณ์', desc: 'ผ่านการสอบสัมภาษณ์' },
                  {
                    step: 4,
                    title: portalConfig.showRegisterTab
                      ? '๔. ขึ้นทะเบียนนิสิต'
                      : '๔. ติดต่อสำนักทะเบียน',
                    desc: portalConfig.showRegisterTab
                      ? 'ออกรหัสประจำตัวนิสิต'
                      : 'ขึ้นทะเบียนที่สำนักทะเบียน',
                  },
                ].map((item) => {
                  const currentStep = getStepNumber(matchedApp.status);
                  const done = currentStep >= item.step;
                  return (
                    <div
                      key={item.step}
                      className={`p-2.5 sm:p-3.5 rounded-2xl border flex items-start gap-2 sm:gap-3 ${
                        done
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {done ? '✓' : item.step}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] sm:text-xs font-extrabold truncate">{item.title}</div>
                        <div className="text-[10px] sm:text-[11px] opacity-80 leading-tight">{item.desc}</div>
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

              {/* Official Registrar Guidance Box for Passed Applicants */}
              {(matchedApp.status === 'INTERVIEW_PASS' || matchedApp.status === 'ENROLLED') && (
                <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-emerald-500/40 shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        <CheckCircle2 className="w-5 h-5" />
                      </span>
                      <div>
                        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                          ผลการสอบคัดเลือก (Admission Result)
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-white">
                          🎉 ขอแสดงความยินดี! ท่านผ่านการสอบสัมภาษณ์ (มีสิทธิ์เข้าศึกษา)
                        </h4>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 self-start sm:self-auto">
                      มีสิทธิ์ขึ้นทะเบียนนิสิตใหม่
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-200 leading-relaxed">
                    <p className="font-bold text-emerald-200">{noticeTitle}</p>
                    <p className="text-slate-300">{noticeText}</p>
                  </div>

                  {/* Registrar Contact Card */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>หน่วยงานรับขึ้นทะเบียน:</span>
                      </div>
                      <div className="font-extrabold text-white text-xs">{registrarOfficeName}</div>
                      <div className="text-[11px] text-slate-300">{registrarOfficeContact}</div>
                    </div>

                    <div className="flex flex-col justify-center sm:items-end gap-2 pt-2 md:pt-0">
                      {registrarWebsiteUrl && (
                        <a
                          href={registrarWebsiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition transform hover:scale-[1.02] cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>ไปยังระบบสำนักทะเบียนและวัดผล มจร ➔</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                      onClick={onGoToRegister}
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
          MODE B: PUBLIC ROSTER OF INTERVIEW PASSERS
         ───────────────────────────────────────────────────────────── */}
      {statusMode === 'ROSTER' && showRosterFeature && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Official Announcement Header Card */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-5 sm:p-7 rounded-3xl border border-emerald-500/30 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold">
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>ประกาศรายชื่ออย่างเป็นทางการ • คณะพุทธศาสตร์ มจร</span>
                </div>
                <h3 className="text-base sm:text-xl font-black text-white">{noticeTitle}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/15 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์ประกาศรายชื่อ</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{noticeText}</p>

            {/* Registrar Contact Information Box */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>สถานที่และหน่วยงานรับขึ้นทะเบียนนิสิต:</span>
                </div>
                <div className="font-extrabold text-white text-sm">{registrarOfficeName}</div>
                <div className="text-slate-300 text-xs">{registrarOfficeContact}</div>
              </div>

              {registrarWebsiteUrl && (
                <a
                  href={registrarWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition transform hover:scale-[1.02] cursor-pointer shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>เข้าสู่ระบบสำนักทะเบียน (reg.mcu.ac.th) ➔</span>
                </a>
              )}
            </div>
          </div>

          {/* Roster Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <Filter className="w-3.5 h-3.5 text-emerald-700" />
                <span>ตัวกรอง:</span>
              </div>

              {/* Degree Filter */}
              <select
                value={rosterDegreeFilter}
                onChange={(e) => setRosterDegreeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer"
              >
                <option value="ALL">ทุกระดับการศึกษา</option>
                <option value="ปริญญาตรี">ปริญญาตรี (พธ.บ.)</option>
                <option value="ปริญญาโท">ปริญญาโท (พธ.ม.)</option>
                <option value="ปริญญาเอก">ปริญญาเอก (พธ.ด.)</option>
                <option value="ประกาศนียบัตร">ประกาศนียบัตร</option>
              </select>

              {/* Major Filter */}
              {uniqueMajors.length > 0 && (
                <select
                  value={rosterMajorFilter}
                  onChange={(e) => setRosterMajorFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer max-w-xs truncate"
                >
                  <option value="ALL">ทุกสาขาวิชา</option>
                  {uniqueMajors.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quick Search & Mobile View Switcher */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Mobile View Switcher */}
              <button
                type="button"
                onClick={() => setRosterViewMode((prev) => (prev === 'card' ? 'table' : 'card'))}
                className="md:hidden px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 transition shrink-0 cursor-pointer shadow-2xs"
                title="สลับมุมมองระหว่างการ์ดและตาราง"
              >
                {rosterViewMode === 'card' ? (
                  <>
                    <TableIcon className="w-3.5 h-3.5 text-slate-600" />
                    <span>ตาราง</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
                    <span>การ์ด</span>
                  </>
                )}
              </button>

              <div className="relative flex-1 sm:w-60">
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="ค้นหาชื่อ, รหัสใบสมัคร..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1.5 rounded-xl shrink-0 whitespace-nowrap">
                พบ {filteredPassedList.length} รูป/คน
              </span>
            </div>
          </div>

          {/* Roster Cards (Mobile) + Table (Desktop) */}
          {loadingRoster ? (
            <div className="py-12 text-center text-xs text-slate-500">
              กำลังโหลดรายชื่อผู้ผ่านการสอบสัมภาษณ์...
            </div>
          ) : filteredPassedList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
              ไม่พบรายชื่อผู้ผ่านการคัดเลือกตามเงื่อนไขที่เลือก
            </div>
          ) : (
            <>
              {/* 1. Mobile Cards */}
              <div className={`${rosterViewMode === 'card' ? 'block md:hidden' : 'hidden'} space-y-3`}>
                {filteredPassedList.map((app, idx) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-sm text-slate-900 leading-snug">
                          {idx + 1}. {app.titleName} {app.firstName} {app.lastName}
                          {app.monasticName && (
                            <span className="text-slate-500 font-normal ml-1">
                              ({app.monasticName})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          <span className="font-mono font-extrabold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                            {app.applicationCode}
                          </span>
                          <span className="text-xs text-slate-500 font-medium truncate">
                            {app.degreeLevel} • {app.major}
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>ผ่านสัมภาษณ์</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-slate-500">รหัสนิสิตใหม่:</span>
                      <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {app.assignedStudentCode || 'รอขึ้นทะเบียน'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. Desktop Table */}
              <div className={`${rosterViewMode === 'card' ? 'hidden md:block' : 'block'} overflow-x-auto rounded-2xl border border-slate-200`}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                      <th className="py-3 px-3.5 text-center w-12">ลำดับ</th>
                      <th className="py-3 px-3.5">รหัสใบสมัคร</th>
                      <th className="py-3 px-3.5">ชื่อ - ฉายา / นามสกุล</th>
                      <th className="py-3 px-3.5">ระดับการศึกษา</th>
                      <th className="py-3 px-3.5">สาขาวิชา</th>
                      <th className="py-3 px-3.5 text-center">ผลการคัดเลือก</th>
                      <th className="py-3 px-3.5 text-center">รหัสนิสิต (ถ้ามี)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredPassedList.map((app, idx) => (
                      <tr
                        key={app.id}
                        className="hover:bg-emerald-50/50 transition duration-150 odd:bg-white even:bg-slate-50/50"
                      >
                        <td className="py-3 px-3.5 text-center font-bold text-slate-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold text-indigo-900">
                          {app.applicationCode}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-900">
                          {app.titleName} {app.firstName} {app.lastName}
                          {app.monasticName && (
                            <span className="text-slate-500 font-normal ml-1">
                              ({app.monasticName})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-[11px]">
                            {app.degreeLevel}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-medium text-slate-700">{app.major}</td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>ผ่านสัมภาษณ์ (มีสิทธิ์เข้าศึกษา)</span>
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-900">
                          {app.assignedStudentCode || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
