'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  AlertCircle,
  Calendar,
  Globe,
  GraduationCap,
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
  return (
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
  );
}
