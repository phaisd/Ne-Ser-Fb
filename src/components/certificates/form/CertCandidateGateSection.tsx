'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  Search,
  LogIn,
  ShieldAlert,
  UserCheck2,
  Briefcase,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { CertTypeItem } from '../types';

interface CandidateVerifiedInfo {
  fullName: string;
  applicationNo: string;
  degreeLevel: string;
  major: string;
}

interface CertCandidateGateSectionProps {
  currentUser: {
    id?: string;
    name?: string;
    role?: string;
    studentCode?: string;
  } | null;
  selectedCert: CertTypeItem | null;
  setSelectedCert: (cert: CertTypeItem | null) => void;
  certTypes: CertTypeItem[];
  cardAudienceFilter: 'ALL' | 'THAI' | 'INTERNATIONAL' | 'STAFF' | 'CANDIDATE';
  setCardAudienceFilter: (filter: 'ALL' | 'THAI' | 'INTERNATIONAL' | 'STAFF' | 'CANDIDATE') => void;
  settings: {
    admissionPeriodOpen?: boolean;
    admissionPeriodDates?: string;
  };
  candidateVerified: CandidateVerifiedInfo | null;
  setCandidateVerified: (info: CandidateVerifiedInfo | null) => void;
  candidateAppNo: string;
  setCandidateAppNo: (val: string) => void;
  candidateIdCard: string;
  setCandidateIdCard: (val: string) => void;
  candidateVerifyError: string | null;
  candidateVerifying: boolean;
  onVerifyCandidate: () => void;
}

export function CertCandidateGateSection({
  currentUser,
  selectedCert,
  setSelectedCert,
  certTypes,
  cardAudienceFilter,
  setCardAudienceFilter,
  settings,
  candidateVerified,
  setCandidateVerified,
  candidateAppNo,
  setCandidateAppNo,
  candidateIdCard,
  setCandidateIdCard,
  candidateVerifyError,
  candidateVerifying,
  onVerifyCandidate,
}: CertCandidateGateSectionProps) {
  return (
    <>
      {!currentUser && selectedCert?.targetAudience !== 'CANDIDATE' && selectedCert?.category !== 'ADMISSION' && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200 text-slate-800 shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-900 font-extrabold text-[11px] uppercase tracking-wider">
                  🔒 มาตรการความปลอดภัยและยืนยันตัวตน (Authentication Required)
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                นิสิตและบุคลากรต้องเข้าสู่ระบบก่อนยื่นคำร้องขอหนังสือรับรอง
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ตามระเบียบของมหาวิทยาลัย เพื่อป้องกันการกรอกข้อมูลสวมสิทธิ์ กรอกข้อมูลผิดพลาด หรือบุคคลภายนอกที่ไม่ได้รับอนุญาตเข้ามายื่นคำร้องแทน
                นิสิตและอาจารย์ทุกคนจะต้องเข้าสู่ระบบก่อนยื่นคำร้อง เมื่อเข้าสู่ระบบแล้วข้อมูลของท่านจะถูกดึงมาใส่ให้อัตโนมัติโดยไม่ต้องพิมพ์เอง
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-purple-200/60">
            <Link
              href="/login?redirect=/certificates"
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> เข้าสู่ระบบด้วยบัญชีนิสิต (Student Login)
            </Link>
            <Link
              href="/login?redirect=/certificates"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-purple-600" /> เข้าสู่ระบบอาจารย์ / เจ้าหน้าที่
            </Link>
            <button
              type="button"
              onClick={() => {
                setCardAudienceFilter('CANDIDATE');
                const adm = certTypes.find((c) => c.category === 'ADMISSION' || c.targetAudience === 'CANDIDATE');
                if (adm) setSelectedCert(adm);
              }}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline ml-auto cursor-pointer"
            >
              🎓 ผู้ผ่านการคัดเลือกใหม่ (ยังไม่มีรหัสนิสิต)? คลิกตรวจสอบสิทธิ์ที่นี่
            </button>
          </div>
        </div>
      )}

      {currentUser && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <UserCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              เข้าสู่ระบบแล้ว: <span className="font-bold">{currentUser.name}</span>{' '}
              <span className="text-emerald-700 font-mono">
                ({currentUser.role === 'STUDENT' ? `รหัสนิสิต: ${currentUser.studentCode || currentUser.id}` : `บทบาท: ${currentUser.role}`})
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-950">
            ยืนยันตัวตนเรียบร้อย ✓
          </span>
        </div>
      )}

      {(selectedCert?.targetAudience === 'CANDIDATE' || selectedCert?.category === 'ADMISSION' || cardAudienceFilter === 'CANDIDATE') && (
        <div className="p-5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                ✓
              </span>
              <h3 className="text-sm font-bold text-emerald-950">
                ระบบคัดกรองและตรวจสอบคุณสมบัติผู้ผ่านการคัดเลือกเข้าศึกษา (Candidate Portal)
              </h3>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${settings.admissionPeriodOpen !== false ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'}`}>
              {settings.admissionPeriodOpen !== false ? '🟢 เปิดรับคำร้อง' : '🔴 ปิดรับคำร้อง'}
            </span>
          </div>

          {settings.admissionPeriodOpen === false ? (
            <div className="p-3.5 rounded-xl bg-red-100 border border-red-300 text-red-950 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">ขณะนี้อยู่นอกช่วงเวลาการยื่นขอหนังสือรับรองสำหรับผู้ผ่านการคัดเลือก</p>
                <p className="text-[11px] text-red-800 mt-0.5">
                  ระบบเปิดให้บริการเฉพาะช่วงรับสมัครและประกาศผล ({settings.admissionPeriodDates || 'มีนาคม - กรกฎาคม'}) หากมีความจำเป็นเร่งด่วนสำหรับการขอ Visa กรุณาติดต่อสำนักงานคณะพุทธศาสตร์โดยตรง
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-emerald-800">
              สำหรับผู้ผ่านการคัดเลือกเข้าเป็นนิสิตใหม่ที่ยังไม่มีรหัสนิสิต กรุณากรอก <strong>เลขที่ใบสมัคร</strong> คู่กับ <strong>เลขบัตรประชาชน หรือ เลขหนังสือเดินทาง</strong> เพื่อยืนยันสิทธิ์ก่อนยื่นคำร้อง
            </p>
          )}

          {settings.admissionPeriodOpen !== false && !candidateVerified && (
            <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-3 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    เลขที่ใบสมัคร (Application No.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น APP-69001, APP-69002 หรือ 6901xxx"
                    value={candidateAppNo}
                    onChange={(e) => setCandidateAppNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    เลขบัตรประชาชน / เลข Passport <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="กรอกเลขประจำตัวตามใบสมัคร"
                    value={candidateIdCard}
                    onChange={(e) => setCandidateIdCard(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {candidateVerifyError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{candidateVerifyError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onVerifyCandidate}
                  disabled={candidateVerifying}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {candidateVerifying ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" /> กำลังตรวจสอบ...
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" /> ตรวจสอบสิทธิ์ผู้ผ่านการคัดเลือก
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {candidateVerified && (
            <div className="p-3.5 rounded-xl bg-white border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-sm">{candidateVerified.fullName}</span>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    เลขที่ใบสมัคร: <strong className="font-mono">{candidateVerified.applicationNo}</strong> | หลักสูตร: {candidateVerified.degreeLevel} สาขาวิชา {candidateVerified.major}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCandidateVerified(null);
                  setCandidateAppNo('');
                  setCandidateIdCard('');
                }}
                className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                เปลี่ยนผู้สมัคร
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
