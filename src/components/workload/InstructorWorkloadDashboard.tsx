'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Award,
  Clock,
  Globe,
  Calendar,
  CheckSquare,
  QrCode,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  MapPin,
  ChevronDown,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  History,
} from 'lucide-react';
import { AttendanceRecord, CourseGradeSheet, LoginAuditRecord } from '@/types';
import {
  buildInstructorDashboardSummary,
  getIsoDayOfWeek,
  WorkloadCourseItem,
  WorkloadStats,
} from '@/lib/utils';

export interface InstructorWorkloadDashboardProps {
  allCoursesCount: number;
  filteredCourses: WorkloadCourseItem[];
  stats: WorkloadStats;
  attendanceRecords: AttendanceRecord[];
  gradesMap: Record<string, CourseGradeSheet>;
  loadingDetails?: boolean;
  loginHistory?: LoginAuditRecord[];
  loginSecurity?: {
    hasSuspiciousActivity?: boolean;
    failedAttemptsCount?: number;
    supersededCount?: number;
    unfamiliarIpCount?: number;
    latestSuccessRecord?: LoginAuditRecord | null;
  } | null;
}

export function InstructorWorkloadDashboard({
  allCoursesCount,
  filteredCourses,
  stats,
  attendanceRecords,
  gradesMap,
  loadingDetails = false,
  loginHistory = [],
  loginSecurity = null,
}: InstructorWorkloadDashboardProps) {
  const [collapsed, setCollapsed] = useState(false);

  const today = useMemo(() => new Date(), []);
  const todayIsoDay = useMemo(() => getIsoDayOfWeek(today), [today]);
  const todayFormattedTh = useMemo(() => {
    try {
      return today.toLocaleDateString('th-TH', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [today]);

  const summary = useMemo(
    () =>
      buildInstructorDashboardSummary(
        filteredCourses,
        attendanceRecords,
        gradesMap,
        todayIsoDay,
        stats,
      ),
    [filteredCourses, attendanceRecords, gradesMap, todayIsoDay, stats],
  );

  const attendancePct =
    stats.totalCourses > 0
      ? Math.round((summary.coursesWithAttendance / stats.totalCourses) * 100)
      : 0;
  const gradesPct =
    stats.totalCourses > 0
      ? Math.round((summary.coursesWithGrades / stats.totalCourses) * 100)
      : 0;
  const maxDailyHours = Math.max(
    1,
    ...summary.dailyBuckets.map((b) => b.hours),
  );

  const defaultAttendanceCourseParam = filteredCourses[0]?.attendanceSectionKey
    ? `course=${encodeURIComponent(filteredCourses[0].attendanceSectionKey)}`
    : '';

  const buildAttendanceHref = (sectionKey?: string, mode?: string) => {
    const params = new URLSearchParams();
    if (sectionKey) params.set('course', sectionKey);
    if (mode) params.set('mode', mode);
    const qs = params.toString();
    return qs ? `/attendance?${qs}` : '/attendance';
  };

  return (
    <section className="space-y-4 print:hidden" aria-label="แดชบอร์ดอาจารย์ผู้สอน">
      {/* Dashboard Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>แดชบอร์ดภาพรวมการสอน (Instructor Dashboard)</span>
          </h2>
          {todayFormattedTh && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              {todayFormattedTh}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 transition cursor-pointer"
        >
          <span>{collapsed ? 'แสดงแดชบอร์ด' : 'ย่อแดชบอร์ด'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>
      </div>

      {/* 1. Core KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>รายวิชาที่รับผิดชอบ</span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{stats.totalCourses}</span>
            <span className="text-xs text-slate-500 font-semibold">รายวิชา</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
              ไทย {stats.thaiCourses}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">
              EN {stats.englishCourses}
            </span>
            <span className="text-slate-400">จาก {allCoursesCount} วิชา</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>หน่วยกิต & ชั่วโมงสอน</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{stats.totalCredits}</span>
            <span className="text-xs text-slate-500 font-semibold">หน่วยกิต</span>
            <span className="text-slate-300">|</span>
            <span className="text-lg font-black text-amber-700">{stats.weeklyHours}</span>
            <span className="text-xs text-slate-500 font-semibold">ชม./สัปดาห์</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>มีตารางสอน {summary.teachingDaysCount} วัน/สัปดาห์</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>บันทึกเวลาเรียนแล้ว</span>
            <CheckSquare className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-sky-700">
              {loadingDetails ? '...' : summary.coursesWithAttendance}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              / {stats.totalCourses} รายวิชา ({attendancePct}%)
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-500 transition-all"
              style={{ width: `${attendancePct}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            เช็คชื่อสะสม {summary.totalCheckedSessions} ครั้ง
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>กรอกคะแนน / คะแนนเก็บ</span>
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-700">
              {loadingDetails ? '...' : summary.coursesWithGrades}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              / {stats.totalCourses} รายวิชา ({gradesPct}%)
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500 transition-all"
              style={{ width: `${gradesPct}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ใช้ใบคะแนนเก็บ {summary.coursesWithCollection} รายวิชา
          </div>
        </div>
      </div>

      {/* 2. Interactive 3-Column Operational Dashboard */}
      {!collapsed && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Panel A: Today & Upcoming Classes */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>คาบสอนวันนี้ & วันถัดไป</span>
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  วันนี้ {summary.schedule.todayCourses.length} วิชา
                </span>
              </div>

              {summary.schedule.todayCourses.length > 0 ? (
                <div className="space-y-2">
                  {summary.schedule.todayCourses.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-mono font-extrabold text-indigo-800">
                              {c.courseCode}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                              {c.startTime || '-'}-{c.endTime || '-'} น.
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                            {c.courseName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>ห้อง {c.room || 'ไม่ระบุ'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={buildAttendanceHref(c.attendanceSectionKey, 'ROLL_CALL')}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-700 text-white text-[11px] font-bold transition"
                        >
                          <CheckSquare className="w-3 h-3 text-emerald-400" />
                          <span>เช็คชื่อทันที</span>
                        </Link>
                        <Link
                          href={buildAttendanceHref(c.attendanceSectionKey, 'QR_CODE')}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold transition"
                        >
                          <QrCode className="w-3 h-3 text-indigo-600" />
                          <span>QR</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800">วันนี้ไม่มีตารางบรรยาย</div>
                  <div className="text-[11px] text-slate-500">
                    ใช้เวลานี้ตรวจบันทึกเวลาเรียนหรืออัปเดตคะแนนเก็บนิสิตได้ครับ
                  </div>
                </div>
              )}

              {summary.schedule.nextDayOfWeek !== null &&
                summary.schedule.nextDayCourses.length > 0 && (
                  <div className="pt-1 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                      <span>คาบสอนถัดไป: {summary.schedule.nextDayLabel}</span>
                      <span className="text-indigo-600">
                        (อีก {summary.schedule.daysUntil} วัน)
                      </span>
                    </div>
                    <div className="space-y-1">
                      {summary.schedule.nextDayCourses.slice(0, 2).map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px]"
                        >
                          <span className="truncate font-semibold text-slate-800">
                            <span className="font-mono font-bold text-indigo-700 mr-1.5">
                              {c.courseCode}
                            </span>
                            {c.courseName}
                          </span>
                          <span className="font-mono text-slate-500 shrink-0">
                            {c.startTime || '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Panel B: Weekly Teaching Load Chart (Mon-Sun) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>ภาระงานสอนรายวัน (จ.-อา.)</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-500">
                  รวม {stats.weeklyHours} ชม.
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {summary.dailyBuckets.map((b) => {
                  const pct = Math.round((b.hours / maxDailyHours) * 100);
                  const isToday = b.dayOfWeek === todayIsoDay;
                  return (
                    <div key={b.dayOfWeek} className="flex items-center gap-2.5 text-xs">
                      <span
                        className={`w-10 text-center py-0.5 rounded-md font-extrabold text-[11px] shrink-0 ${
                          isToday
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : b.coursesCount > 0
                            ? 'bg-slate-100 text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {b.shortLabel}
                      </span>
                      <div className="flex-1 h-5 rounded-lg bg-slate-100 overflow-hidden relative">
                        {b.hours > 0 && (
                          <div
                            className={`h-full rounded-lg transition-all ${
                              isToday ? 'bg-indigo-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(10, pct)}%` }}
                          />
                        )}
                        <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-bold text-slate-700 mix-blend-multiply">
                          {b.coursesCount > 0
                            ? `${b.coursesCount} วิชา • ${b.hours} ชม.`
                            : 'ว่าง'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>วันที่มีแถบสีน้ำเงิน = วันนี้</span>
              <span className="font-bold text-slate-700">
                วันว่าง {7 - summary.teachingDaysCount} วัน/สัปดาห์
              </span>
            </div>
          </div>

          {/* Panel C: Action Checklist & Quick Shortcuts */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>รายการติดตามงานสอน (To-Do)</span>
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  {summary.pendingAttendanceCourses.length + summary.pendingGradeCourses.length} รายการ
                </span>
              </div>

              {filteredCourses.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-500">
                  ยังไม่มีรายวิชาตามตัวกรองที่เลือก
                </div>
              ) : summary.pendingAttendanceCourses.length === 0 &&
                summary.pendingGradeCourses.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold">เยี่ยมมาก! ดำเนินการครบทุกรายวิชา</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      ทุกรายวิชามีบันทึกเวลาเรียนและข้อมูลคะแนนเรียบร้อยแล้ว
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {summary.pendingAttendanceCourses.slice(0, 3).map((c) => (
                    <div
                      key={`att-${c.id}`}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-amber-950 truncate">
                          <span className="font-mono mr-1">{c.courseCode}</span>
                          ยังไม่เคยเช็คชื่อ
                        </div>
                        <div className="text-[10px] text-amber-700 truncate">{c.courseName}</div>
                      </div>
                      <Link
                        href={buildAttendanceHref(c.attendanceSectionKey, 'ROLL_CALL')}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shrink-0 transition"
                      >
                        เช็คชื่อ
                      </Link>
                    </div>
                  ))}

                  {summary.pendingGradeCourses.slice(0, 3).map((c) => (
                    <div
                      key={`grd-${c.id}`}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-purple-50/70 border border-purple-200/80 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-purple-950 truncate">
                          <span className="font-mono mr-1">{c.courseCode}</span>
                          ยังไม่มีคะแนน / คะแนนเก็บ
                        </div>
                        <div className="text-[10px] text-purple-700 truncate">{c.courseName}</div>
                      </div>
                      <Link
                        href={buildAttendanceHref(c.attendanceSectionKey, 'GRADE_SHEET')}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shrink-0 transition"
                      >
                        กรอกคะแนน
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Navigation Shortcuts */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 mb-2">ทางลัดงานอาจารย์:</div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
                <Link
                  href={defaultAttendanceCourseParam ? `/attendance?${defaultAttendanceCourseParam}&mode=QR_CODE` : '/attendance?mode=QR_CODE'}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-center transition"
                >
                  📱 QR เช็คชื่อ
                </Link>
                <Link
                  href={defaultAttendanceCourseParam ? `/attendance?${defaultAttendanceCourseParam}&mode=GRADE_SHEET` : '/attendance?mode=GRADE_SHEET'}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 text-center transition"
                >
                  📝 ใบคะแนน/คะแนนเก็บ
                </Link>
                <Link
                  href={defaultAttendanceCourseParam ? `/attendance?${defaultAttendanceCourseParam}&mode=ELIGIBILITY` : '/attendance?mode=ELIGIBILITY'}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-center transition"
                >
                  🎓 ตรวจสอบสิทธิ์สอบ
                </Link>
                <Link
                  href="/students"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 text-center transition"
                >
                  👥 ทะเบียนนิสิต
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Account Security & Login History Bar */}
      {!collapsed && (
        <div
          className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
            loginSecurity?.hasSuspiciousActivity
              ? 'bg-rose-50/80 border-rose-300 text-rose-950'
              : 'bg-white border-slate-200/80 text-slate-800'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                loginSecurity?.hasSuspiciousActivity
                  ? 'bg-rose-600 text-white'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}
            >
              {loginSecurity?.hasSuspiciousActivity ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-extrabold">
                <span>
                  {loginSecurity?.hasSuspiciousActivity
                    ? '⚠️ ตรวจพบกิจกรรมบัญชีที่ควรตรวจสอบ (อาจมีการเข้าใช้จากผู้อื่น)'
                    : '🛡️ ประวัติการเข้าใช้ระบบ & ความปลอดภัยบัญชี: ปกติ'}
                </span>
                {(loginSecurity?.failedAttemptsCount || 0) > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                    รหัสผ่านผิด {loginSecurity?.failedAttemptsCount} ครั้ง
                  </span>
                )}
                {(loginSecurity?.supersededCount || 0) > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                    ถูกเข้าซ้อน {loginSecurity?.supersededCount} ครั้ง
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {loginSecurity?.latestSuccessRecord
                  ? `เข้าใช้งานล่าสุด: ${loginSecurity.latestSuccessRecord.device} • IP: ${
                      loginSecurity.latestSuccessRecord.ip &&
                      loginSecurity.latestSuccessRecord.ip !== 'unknown-client'
                        ? loginSecurity.latestSuccessRecord.ip
                        : 'local'
                    } • บันทึกทั้งหมด ${loginHistory.length} รายการ`
                  : `ตรวจสอบอุปกรณ์และ IP ที่เข้าสู่ระบบย้อนหลัง เพื่อป้องกันผู้อื่นแอบใช้บัญชี (${loginHistory.length} รายการ)`}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('mcu_open_profile_modal', { detail: { tab: 'HISTORY' } }),
                );
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shrink-0 transition cursor-pointer ${
              loginSecurity?.hasSuspiciousActivity
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                : 'bg-slate-900 hover:bg-indigo-700 text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>ตรวจสอบประวัติการเข้าใช้งาน</span>
          </button>
        </div>
      )}
    </section>
  );
}
