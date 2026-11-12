'use client';

import React from 'react';
import {
  GraduationCap,
  Search,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import {
  AdmissionApplication,
  AdmissionFirstYearCourseItem,
  AdmissionPortalConfig,
  SystemSettings,
} from '@/types';

interface EnrollRegisterVoucherTabProps {
  portalConfig: AdmissionPortalConfig;
  settings: Partial<SystemSettings>;
  matchedApp: AdmissionApplication | null;
  lookupQuery: string;
  setLookupQuery: (val: string) => void;
  lookupLoading: boolean;
  lookupError: string | null;
  confirmingEnroll: boolean;
  confirmSuccessMsg: string | null;
  enabledFirstYearCourses: AdmissionFirstYearCourseItem[];
  totalFirstYearCredits: number;
  onSearch: () => void;
  onConfirmEnrollment: () => void;
}

export function EnrollRegisterVoucherTab({
  portalConfig,
  settings,
  matchedApp,
  lookupQuery,
  setLookupQuery,
  lookupLoading,
  lookupError,
  confirmingEnroll,
  confirmSuccessMsg,
  enabledFirstYearCourses,
  totalFirstYearCredits,
  onSearch,
  onConfirmEnrollment,
}: EnrollRegisterVoucherTabProps) {
  return (
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
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="กรอกเลขบัตรประชาชน 13 หลัก / Passport / รหัสใบสมัคร..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono text-slate-900"
          />
          <button
            type="button"
            onClick={onSearch}
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
              onClick={onConfirmEnrollment}
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
  );
}
