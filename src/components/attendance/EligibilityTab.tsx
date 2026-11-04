'use client';

import React from 'react';
import {
  Lock,
  AlertTriangle,
  BookOpen,
  SlidersHorizontal,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  XCircle,
  Info,
  Sparkles,
  Search,
} from 'lucide-react';

interface EligibilityTabProps {
  currentUser: any;
  currentCourse: any;
  availableCourses: any[];
  selectedCourseCode: string;
  handleCourseChange: (code: string) => void;
  showEligibilitySettings: boolean;
  setShowEligibilitySettings: (show: boolean) => void;
  minAttendancePercent: number;
  setMinAttendancePercent: (percent: number) => void;
  semesterTotalSessions: number;
  setSemesterTotalSessions: (sessions: number) => void;
  lateToAbsentRatio: number;
  setLateToAbsentRatio: (ratio: number) => void;
  includeLeaveAsExcused: boolean;
  setIncludeLeaveAsExcused: (excused: boolean) => void;
  handleExportEligibilityCsv: () => void;
  eligibilityStats: {
    total: number;
    eligible: number;
    warning: number;
    ineligible: number;
  };
  recordedSessionsCount: number;
  maxAllowedAbsences: number;
  handleSimulateAttendance: () => void;
  eligibilitySearch: string;
  setEligibilitySearch: (q: string) => void;
  eligibilityStatusFilter: 'ALL' | 'ELIGIBLE' | 'WARNING' | 'INELIGIBLE';
  setEligibilityStatusFilter: (status: 'ALL' | 'ELIGIBLE' | 'WARNING' | 'INELIGIBLE') => void;
  eligibilityList: any[];
  filteredEligibilityList: any[];
}

export function EligibilityTab({
  currentUser,
  currentCourse,
  availableCourses,
  selectedCourseCode,
  handleCourseChange,
  showEligibilitySettings,
  setShowEligibilitySettings,
  minAttendancePercent,
  setMinAttendancePercent,
  semesterTotalSessions,
  setSemesterTotalSessions,
  lateToAbsentRatio,
  setLateToAbsentRatio,
  includeLeaveAsExcused,
  setIncludeLeaveAsExcused,
  handleExportEligibilityCsv,
  eligibilityStats,
  recordedSessionsCount,
  maxAllowedAbsences,
  handleSimulateAttendance,
  eligibilitySearch,
  setEligibilitySearch,
  eligibilityStatusFilter,
  setEligibilityStatusFilter,
  eligibilityList,
  filteredEligibilityList,
}: EligibilityTabProps) {
  if (!currentUser) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
        <Lock className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800 text-base">
          เข้าสู่ระบบอาจารย์ผู้สอนเพื่อดูสรุปสิทธิ์สอบ
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          ระบบคำนวณสิทธิ์สอบอ้างอิงจากเวลาเรียน 80% ทั้งภาคการศึกษาเฉพาะในรายวิชาที่ท่านเป็นอาจารย์ผู้สอนเท่านั้น
        </p>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-center text-amber-900 space-y-2">
        <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
        <p className="font-bold text-sm">ไม่พบรายวิชาที่ท่านรับผิดชอบบรรยายในภาคเรียนนี้</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Selector & Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Course Dropdown */}
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              เลือกรายวิชาที่ต้องการประเมินสิทธิ์สอบ ({availableCourses.length} วิชา):
            </label>
            <select
              value={selectedCourseCode}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              {availableCourses.map((c, i) => (
                <option key={i} value={c.courseCode}>
                  {c.courseCode} — {c.courseName} (ชั้นปีที่ {c.yearLevel})
                </option>
              ))}
            </select>
          </div>

          {/* Actions & Settings Toggles */}
          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setShowEligibilitySettings(!showEligibilitySettings)}
              className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="ปรับเปลี่ยนเกณฑ์การคำนวณ (จำนวนคาบ, เกณฑ์ %)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>เกณฑ์คำนวณ ({minAttendancePercent}%)</span>
            </button>

            <button
              type="button"
              onClick={handleExportEligibilityCsv}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>ส่งออก Excel/CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์รายงาน (Print/PDF)</span>
            </button>
          </div>
        </div>

        {/* Collapsible Settings Panel */}
        {showEligibilitySettings && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                ตั้งค่าเกณฑ์เวลาเรียนและการประเมินสิทธิ์สอบ (University Exam Rules)
              </span>
              <span className="text-[11px] text-slate-500">
                ตามระเบียบมหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  จำนวนคาบเรียนทั้งเทอม:
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={semesterTotalSessions}
                    onChange={(e) => setSemesterTotalSessions(Math.max(1, parseInt(e.target.value) || 16))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                  />
                  <span className="text-slate-400 font-medium">คาบ</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  เกณฑ์เวลาเรียนขั้นต่ำ:
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={minAttendancePercent}
                    onChange={(e) => setMinAttendancePercent(Math.max(50, Math.min(100, parseInt(e.target.value) || 80)))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-emerald-700"
                  />
                  <span className="text-slate-400 font-medium">%</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  สัดส่วนการมาสาย:
                </label>
                <select
                  value={lateToAbsentRatio}
                  onChange={(e) => setLateToAbsentRatio(parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                >
                  <option value="3">สาย 3 ครั้ง = ขาด 1 ครั้ง</option>
                  <option value="2">สาย 2 ครั้ง = ขาด 1 ครั้ง</option>
                  <option value="4">สาย 4 ครั้ง = ขาด 1 ครั้ง</option>
                  <option value="999">ไม่นับสายเป็นขาด</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 pb-2">
                  <input
                    type="checkbox"
                    checked={includeLeaveAsExcused}
                    onChange={(e) => setIncludeLeaveAsExcused(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>ลามีใบรับรอง = อนุโลม</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Summary Statistics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500">นิสิตทั้งหมด</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{eligibilityStats.total}</div>
          <div className="text-[10px] text-slate-400">รูป/คน</div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500">เช็คชื่อแล้วในระบบ</div>
          <div className="text-2xl font-black text-indigo-700 mt-0.5">
            {recordedSessionsCount} <span className="text-xs text-slate-400 font-normal">/ {semesterTotalSessions}</span>
          </div>
          <div className="text-[10px] text-indigo-600 font-semibold">
            {Math.round((recordedSessionsCount / semesterTotalSessions) * 100)}% ของเทอม
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-800 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> มีสิทธิ์สอบ (≥{minAttendancePercent}%)
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-0.5">{eligibilityStats.eligible}</div>
          <div className="text-[10px] text-emerald-600 font-semibold">
            {eligibilityStats.total > 0 ? Math.round((eligibilityStats.eligible / eligibilityStats.total) * 100) : 0}% ของชั้นเรียน
          </div>
        </div>

        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 shadow-sm">
          <div className="text-[11px] font-bold text-amber-800 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> กลุ่มเฝ้าระวัง
          </div>
          <div className="text-2xl font-black text-amber-700 mt-0.5">{eligibilityStats.warning}</div>
          <div className="text-[10px] text-amber-700">ขาดครบโควตา ({maxAllowedAbsences} คาบ)</div>
        </div>

        <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200/80 shadow-sm col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-rose-800 flex items-center justify-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" /> หมดสิทธิ์สอบ (&lt;{minAttendancePercent}%)
          </div>
          <div className="text-2xl font-black text-rose-700 mt-0.5">{eligibilityStats.ineligible}</div>
          <div className="text-[10px] text-rose-600 font-semibold">ขาดเกิน {maxAllowedAbsences} ครั้ง</div>
        </div>
      </div>

      {/* If no sessions recorded yet, show a simulation prompt */}
      {recordedSessionsCount === 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block">วิชานี้ยังไม่มีบันทึกเวลาเรียนในระบบ:</span>
              <span className="text-slate-500">
                ระบบคำนวณเบื้องต้นให้นิสิตทุกคนมีสิทธิ์สอบเต็ม 100% ท่านสามารถคลิกปุ่มเพื่อจำลองข้อมูลการสอน 12 คาบสำหรับทดสอบคำนวณสิทธิ์สอบได้ทันที
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSimulateAttendance}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ จำลองบันทึก 12 คาบเพื่อทดสอบ</span>
          </button>
        </div>
      )}

      {/* Filter Toolbar & Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสนิสิต หรือชื่อ-นามสกุล..."
            value={eligibilitySearch}
            onChange={(e) => setEligibilitySearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold w-full sm:w-auto shrink-0 justify-center">
          <button
            type="button"
            onClick={() => setEligibilityStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              eligibilityStatusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({eligibilityList.length})
          </button>
          <button
            type="button"
            onClick={() => setEligibilityStatusFilter('ELIGIBLE')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              eligibilityStatusFilter === 'ELIGIBLE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            มีสิทธิ์สอบ ({eligibilityStats.eligible})
          </button>
          <button
            type="button"
            onClick={() => setEligibilityStatusFilter('WARNING')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              eligibilityStatusFilter === 'WARNING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            เฝ้าระวัง ({eligibilityStats.warning})
          </button>
          <button
            type="button"
            onClick={() => setEligibilityStatusFilter('INELIGIBLE')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              eligibilityStatusFilter === 'INELIGIBLE'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            หมดสิทธิ์สอบ ({eligibilityStats.ineligible})
          </button>
        </div>
      </div>

      {/* Roster & Exam Eligibility Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 print:text-[10px]">
            <thead className="bg-slate-50 uppercase text-[11px] font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">ลำดับ</th>
                <th className="px-4 py-3 w-28">รหัสนิสิต</th>
                <th className="px-4 py-3">ชื่อ - นามสกุล</th>
                <th className="px-3 py-3 text-center w-12 text-emerald-700">มา</th>
                <th className="px-3 py-3 text-center w-12 text-yellow-700">สาย</th>
                <th className="px-3 py-3 text-center w-12 text-blue-700">ลา</th>
                <th className="px-3 py-3 text-center w-12 text-rose-700">ขาด</th>
                <th className="px-4 py-3 text-center w-36">เวลาเรียนจริง (%)</th>
                <th className="px-4 py-3 text-center w-28">โควตาขาดที่เหลือ</th>
                <th className="px-4 py-3 text-center w-32">สิทธิ์เข้าสอบ</th>
                <th className="px-4 py-3">เหตุผล / เงื่อนไข</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEligibilityList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-400">
                    ไม่พบข้อมูลนิสิตตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredEligibilityList.map((row, idx) => (
                  <tr
                    key={row.studentCode}
                    className={`hover:bg-slate-50/80 transition ${
                      row.status === 'INELIGIBLE'
                        ? 'bg-rose-50/30'
                        : row.status === 'WARNING'
                        ? 'bg-amber-50/20'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-800">
                      {row.studentCode}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      <div>{row.studentName}</div>
                      {row.major && (
                        <div className="text-[10px] text-slate-400">{row.major}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-emerald-700 bg-emerald-50/30">
                      {row.present}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-yellow-700 bg-yellow-50/30">
                      {row.late}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-blue-700 bg-blue-50/30">
                      {row.leave}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-rose-700 bg-rose-50/30">
                      {row.absent}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden flex-1">
                          <div
                            className={`h-full rounded-full ${
                              row.attendedPercent >= minAttendancePercent
                                ? 'bg-emerald-500'
                                : row.attendedPercent >= 70
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${row.attendedPercent}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-700 w-10 text-right">
                          {row.attendedPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center font-medium">
                      {row.remainingAbsences > 0 ? (
                        <span className="text-emerald-700 font-semibold">
                          ขาดได้อีก {row.remainingAbsences} ครั้ง
                        </span>
                      ) : row.remainingAbsences === 0 ? (
                        <span className="text-amber-800 font-bold px-2 py-0.5 rounded bg-amber-100">
                          ห้ามขาดอีก
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold px-2 py-0.5 rounded bg-rose-100">
                          เกิน {Math.abs(row.remainingAbsences)} ครั้ง
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          row.status === 'ELIGIBLE'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : row.status === 'WARNING'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {row.status === 'ELIGIBLE' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {row.status === 'WARNING' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                        {row.status === 'INELIGIBLE' && <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>{row.statusText}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                      {row.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Sign-off block for Print */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-8 mt-6 text-xs text-slate-800 text-center">
        <div className="space-y-12">
          <div>ลงชื่อ..................................................................</div>
          <div>( {currentUser ? currentUser.name : (currentCourse.instructor || 'อาจารย์ผู้รับผิดชอบรายวิชา')} )<br /><span className="text-slate-500">อาจารย์ผู้รับผิดชอบรายวิชา</span></div>
        </div>
        <div className="space-y-12">
          <div>ลงชื่อ..................................................................</div>
          <div>( พระครูสุธีกิตติบัณฑิต, รศ.ดร. )<br /><span className="text-slate-500">คณบดีคณะพุทธศาสตร์</span></div>
        </div>
      </div>
    </div>
  );
}
