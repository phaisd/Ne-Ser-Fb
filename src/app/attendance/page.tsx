'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  CheckSquare, 
  Calendar, 
  UserCheck, 
  Save, 
  Check, 
  Clock, 
  Search, 
  User, 
  QrCode, 
  BookOpen, 
  Sparkles,
  History,
  GraduationCap,
  KeyRound,
  LogOut,
  ArrowRight,
  Lock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Info,
  ShieldAlert,
  Award,
  Printer,
  FileSpreadsheet,
  SlidersHorizontal,
  MapPin,
  Users,
  Tag,
  Plus,
  UserPlus,
  X,
  Edit3,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  LayoutGrid
} from 'lucide-react';

import { Student, TimetableItem, AttendanceHistoryItem, CourseEnrollment } from '@/types';
import { matchInstructorStrict } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error';
import { downloadCsvFile } from '@/lib/utils/csv-export';
import { formatDayLabel, checkIsEnglishCourse } from '@/lib/attendance/workspaceHelpers';
import { EligibilityTab, SemesterRoadmapTab, AddStudentToCourseModal, GradeSheetTab, ClassroomQrProjector, RollCallTab, AttendanceHistoryTab, SessionCustomModal } from '@/components/attendance';
import { useLanguage } from '@/hooks/useLanguage';
import { useAttendanceWorkspace } from '@/hooks/attendance/useAttendanceWorkspace';
import UserProfileModal from '@/components/UserProfileModal';

export default function AttendancePage() {
  const { t, isEn } = useLanguage();
  const {
    activeMode,
    setActiveMode,
    timetables,
    instructors,
    students,
    setStudents,
    customEnrollments,
    setCustomEnrollments,
    isAddStudentModalOpen,
    setIsAddStudentModalOpen,
    historyRecords,
    setHistoryRecords,
    loading,
    currentUser,
    setCurrentUser,
    isProfileModalOpen,
    setIsProfileModalOpen,
    isModeMenuExpanded,
    setIsModeMenuExpanded,
    isAuthCardExpanded,
    setIsAuthCardExpanded,
    selectedInstructor,
    setSelectedInstructor,
    selectedCourseCode,
    setSelectedCourseCode,
    date,
    setDate,
    recordedBy,
    setRecordedBy,
    sessionCustom,
    setSessionCustom,
    showSessionModal,
    setShowSessionModal,
    coInstructorSearch,
    setCoInstructorSearch,
    attendanceMap,
    setAttendanceMap,
    saving,
    savedSuccess,
    setSavedSuccess,
    showOnlyTargetYear,
    setShowOnlyTargetYear,
    studentProgramFilter,
    setStudentProgramFilter,
    semesterTotalSessions,
    setSemesterTotalSessions,
    minAttendancePercent,
    setMinAttendancePercent,
    lateToAbsentRatio,
    setLateToAbsentRatio,
    includeLeaveAsExcused,
    setIncludeLeaveAsExcused,
    eligibilitySearch,
    setEligibilitySearch,
    eligibilityStatusFilter,
    setEligibilityStatusFilter,
    showEligibilitySettings,
    setShowEligibilitySettings,
    handleLogout,
    isAdmin,
    isTeacher,
    showAllFallback,
    setShowAllFallback,
    availableCourses,
    currentCourse,
    semesterRoadmapSessions,
    nextUpcomingSession,
    completedSessionsCount,
    handleFastOpenSession,
    handleCourseChange,
    isInterCourse,
    activeProgramMode,
    currentCourseEnrollments,
    customEnrolledCodeSet,
    handleRemoveEnrollment,
    targetYear,
    yearAllCount,
    yearEnglishCount,
    yearThaiCount,
    groupedTargetSections,
    targetStudents,
    handleStatusChange,
    setAllStatus,
    total,
    present,
    late,
    absent,
    leave,
    percent,
    visibleHistoryRecords,
    eligibilityList,
    eligibilityStats,
    recordedSessionsCount,
    maxAllowedAbsences,
    filteredEligibilityList,
    handleExportEligibilityCsv,
    handleSimulateAttendance,
    handleSave,
  } = useAttendanceWorkspace();

  return (
    <div className="space-y-6 print:space-y-2">
      {/* ─────────────────────────────────────────────────────────────
          PRINT ONLY HEADER (OFFICIAL FACULTY REPORT)
         ───────────────────────────────────────────────────────────── */}
      <div className="hidden print:block text-slate-900 border-b border-slate-400 pb-2 mb-2 space-y-0.5">
        <div className="text-center font-bold text-base leading-tight">คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</div>
        <div className="text-center font-bold text-sm leading-tight">รายงานสรุปเวลาเรียนและการประเมินสิทธิ์สอบไล่ปลายภาค ภาคการศึกษาที่ 1 ปีการศึกษา 2569</div>
        {currentCourse && (
          <div className="text-[11px] text-center text-slate-700 pt-0.5">
            รายวิชา: <strong>{currentCourse.courseCode} {currentCourse.courseName}</strong> (ชั้นปีที่ {currentCourse.yearLevel}) | ผู้สอน: <strong>{currentCourse.instructor}</strong> | เกณฑ์เวลาเรียนขั้นต่ำ: <strong>{minAttendancePercent}%</strong> (ไม่น้อยกว่า {Math.ceil(semesterTotalSessions * (minAttendancePercent/100))} จาก {semesterTotalSessions} คาบ)
          </div>
        )}
      </div>

      {/* Fallback Banner when an Instructor has 0 auto-matched courses */}
      {currentUser && isTeacher && availableCourses.length === 0 && !showAllFallback && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm print:hidden">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold text-slate-900">
                ยังไม่พบรายวิชาที่ตรงกับชื่อบัญชีของท่านโดยอัตโนมัติ ({currentUser.name})
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                อาจเกิดจากชื่อในตารางสอนสะกดต่างจากชื่อบัญชีผู้ใช้ ท่านสามารถคลิกเพื่อเปิดดูรายวิชาทั้งหมดของคณะและเลือกวิชาที่สอนได้ทันที
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAllFallback(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shrink-0 shadow-sm"
          >
            📖 แสดงรายวิชาทั้งหมดของคณะ ({timetables.length} วิชา)
          </button>
        </div>
      )}

      {showAllFallback && isTeacher && (
        <div className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between shadow-2xs print:hidden">
          <span className="font-medium">
            ℹ️ กำลังแสดงรายวิชาทั้งหมดของคณะ ({availableCourses.length} วิชา) — ท่านสามารถเลือกรายวิชาที่ท่านสอนในแถบเลือกวิชาด้านล่างได้ทันที
          </span>
          <button
            type="button"
            onClick={() => setShowAllFallback(false)}
            className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer ml-3 shrink-0"
          >
            กลับไปกรองเฉพาะวิชาของฉัน
          </button>
        </div>
      )}

      {/* Page Header (Hidden on Print) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-4 print:hidden">
        {/* Row 1: Full System Title (2 lines on mobile, no truncation, scaled font size) */}
        <div className="min-w-0">
          <h1 className="text-[15px] sm:text-2xl lg:text-3xl font-extrabold text-slate-900 flex items-start sm:items-center gap-2 sm:gap-3 leading-snug">
            <CheckSquare className="w-5 h-5 sm:w-8 sm:h-8 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            <span className="break-words">{t.attTitle}</span>
          </h1>
          <p className="hidden sm:block text-sm text-slate-500 mt-1">
            {t.attDesc}
          </p>
        </div>

        {/* Row 2 on Mobile: Active Mode Status + "เมนูโหมด (6)" Toggle Button on its own row */}
        <div className="flex sm:hidden items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-950 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="leading-tight">
              {activeMode === 'ROLL_CALL' && 'อาจารย์เช็คชื่อ (Roll-Call)'}
              {activeMode === 'ROADMAP' && 'แผนผัง 16 คาบ (Roadmap)'}
              {activeMode === 'ELIGIBILITY' && 'สรุปสิทธิ์สอบ 80%'}
              {activeMode === 'GRADE_SHEET' && 'ใบกรอกคะแนนวัดผล'}
              {activeMode === 'QR_CODE' && 'เปิดจอ QR ห้องเรียน'}
              {activeMode === 'HISTORY' && `ประวัติการเช็คชื่อ (${visibleHistoryRecords.length})`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsModeMenuExpanded((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-1 transition cursor-pointer shadow-2xs shrink-0 ${
              isModeMenuExpanded
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span>{isModeMenuExpanded ? 'ยุบเมนู' : 'เมนูโหมด (6)'}</span>
            {isModeMenuExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Mode switcher tabs (2x3 Grid on Mobile when expanded; 2x3 Always Visible on Desktop sm+) */}
        <div
          className={`${
            isModeMenuExpanded ? 'flex' : 'hidden sm:flex'
          } w-full xl:w-auto flex-col gap-1.5 p-1.5 bg-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold shadow-2xs`}
        >
          {/* แถวที่ 1 (3 แท็บ): เช็คชื่อ, แผนผัง, สรุปสิทธิ์สอบ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveMode('ROLL_CALL');
                setIsModeMenuExpanded(false);
              }}
              className={`w-full px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl transition cursor-pointer min-h-[38px] sm:min-h-[40px] flex items-center justify-center gap-1.5 ${
                activeMode === 'ROLL_CALL'
                  ? 'bg-white text-emerald-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{isEn ? 'Roll-Call' : 'อาจารย์เช็คชื่อ'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('ROADMAP');
                setIsModeMenuExpanded(false);
              }}
              className={`w-full px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl transition cursor-pointer min-h-[38px] sm:min-h-[40px] flex items-center justify-center gap-1.5 ${
                activeMode === 'ROADMAP'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-700 hover:text-emerald-700 font-bold bg-white/70'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">{isEn ? '16-Week Roadmap' : 'แผนผัง 16 คาบ'}</span>
              {nextUpcomingSession && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5 shrink-0" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('ELIGIBILITY');
                setIsModeMenuExpanded(false);
              }}
              className={`w-full px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl transition cursor-pointer min-h-[38px] sm:min-h-[40px] flex items-center justify-center gap-1.5 ${
                activeMode === 'ELIGIBILITY'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-700 hover:text-emerald-700 font-bold bg-emerald-50/50 hover:bg-white/50'
              }`}
            >
              <Award className="w-4 h-4 shrink-0" />
              <span className="truncate">{isEn ? '80% Eligibility' : 'สรุปสิทธิ์สอบ 80%'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('GRADE_SHEET');
                setIsModeMenuExpanded(false);
              }}
              className={`w-full px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl transition cursor-pointer min-h-[38px] sm:min-h-[40px] flex items-center justify-center gap-1.5 sm:hidden ${
                activeMode === 'GRADE_SHEET'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-indigo-800 hover:text-indigo-950 font-bold bg-indigo-50/80 border border-indigo-200/70 hover:bg-indigo-100/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span className="truncate">{isEn ? 'Grade Sheet' : 'ใบกรอกคะแนน'}</span>
            </button>
          </div>

          {/* แถวที่ 2: ใบกรอกคะแนน (Desktop), QR ห้องเรียน, ประวัติ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveMode('GRADE_SHEET');
                setIsModeMenuExpanded(false);
              }}
              className={`hidden sm:flex w-full px-3.5 py-2.5 rounded-xl transition cursor-pointer min-h-[40px] items-center justify-center gap-1.5 ${
                activeMode === 'GRADE_SHEET'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-indigo-800 hover:text-indigo-950 font-bold bg-indigo-50/80 border border-indigo-200/70 hover:bg-indigo-100/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>{isEn ? 'Grade Book Sheet' : 'ใบกรอกคะแนนวัดผล (Grade Sheet)'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('QR_CODE');
                setIsModeMenuExpanded(false);
              }}
              className={`w-full px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl transition cursor-pointer min-h-[38px] sm:min-h-[40px] flex items-center justify-center gap-1.5 ${
                activeMode === 'QR_CODE'
                  ? 'bg-white text-emerald-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{isEn ? 'Classroom QR' : 'เปิดจอ QR ห้องเรียน'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('HISTORY');
                setIsModeMenuExpanded(false);
              }}
              className={`w-full px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl transition cursor-pointer min-h-[38px] sm:min-h-[40px] flex items-center justify-center gap-1.5 ${
                activeMode === 'HISTORY'
                  ? 'bg-white text-emerald-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <History className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="truncate">
                {isEn ? 'History' : 'ประวัติเช็คชื่อ'} ({visibleHistoryRecords.length})
              </span>
            </button>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-sm animate-in fade-in duration-200 print:hidden">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{savedSuccess}</span>
          </div>
          <button onClick={() => setSavedSuccess(null)} className="text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          AUTH STATUS BAR / LOGIN PROMPT (Collapsible on Mobile & Desktop)
         ───────────────────────────────────────────────────────────── */}
      <div className="print:hidden">
        {currentUser ? (
          <div
            className={`rounded-2xl px-3.5 py-2.5 sm:p-4 shadow-sm border transition-all ${
              isAdmin
                ? 'bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white border-purple-800'
                : 'bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-800'
            }`}
          >
            {/* Slim Always-Visible Bar with Collapse/Expand Toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl backdrop-blur border flex items-center justify-center font-bold text-sm sm:text-base shrink-0 shadow-inner ${
                    isAdmin
                      ? 'bg-purple-500/20 border-purple-400/30 text-purple-200'
                      : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                  }`}
                >
                  {isAdmin ? '👑' : currentUser.name ? currentUser.name.charAt(0) : 'อ'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        isAdmin
                          ? 'bg-purple-500/30 text-purple-200 border-purple-400/30'
                          : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/30'
                      }`}
                    >
                      {isAdmin ? '👑 Admin Mode' : '🔒 อาจารย์ผู้สอน'}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {currentUser.name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Desktop direct action buttons */}
                <div className="hidden md:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-100 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 rounded-xl transition cursor-pointer shadow-sm"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>แก้ไขโปรไฟล์ & รหัสผ่าน</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>

                {/* Toggle button for mobile / extra details */}
                <button
                  type="button"
                  onClick={() => setIsAuthCardExpanded((prev) => !prev)}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] font-bold text-white flex items-center gap-1 transition cursor-pointer"
                >
                  <span>{isAuthCardExpanded ? 'ยุบ' : 'บัญชี'}</span>
                  {isAuthCardExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Profile Details & Mobile Action Buttons */}
            {isAuthCardExpanded && (
              <div className="mt-3 pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="space-y-0.5 text-xs text-white/80">
                  <div className="font-mono text-[11px] text-white/70">{currentUser.email}</div>
                  <p>
                    {isAdmin
                      ? 'ผู้ดูแลระบบสามารถตรวจสอบและดูรายวิชาของอาจารย์ทุกท่านในคณะได้'
                      : `ระบบจำกัดการเข้าถึงเฉพาะรายวิชาที่ท่านรับผิดชอบบรรยายเท่านั้น (พบ ${availableCourses.length} รายวิชาในภาคเรียนนี้)`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:hidden">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-100 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 rounded-xl transition cursor-pointer shadow-sm"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>แก้ไขโปรไฟล์ & รหัสผ่าน</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-700 shrink-0 shadow-inner">
                  <Lock className="w-6 h-6 text-amber-700" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                      ระบบจำกัดสิทธิ์เฉพาะอาจารย์ผู้สอน
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    กรุณาเข้าสู่ระบบอาจารย์ผู้สอนเพื่อดำเนินการเช็คชื่อและสรุปสิทธิ์สอบ
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                    ตามนโยบายของคณะพุทธศาสตร์ อาจารย์ผู้สอนแต่ละท่านสามารถตรวจเช็คชื่อเข้าชั้นเรียนและประเมินสิทธิ์สอบได้<strong>เฉพาะรายวิชาที่ตนเองรับผิดชอบบรรยายเท่านั้น</strong>
                  </p>
                </div>
              </div>

              <Link
                href="/login?redirect=/attendance"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md transition shrink-0 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>เข้าสู่ระบบอาจารย์ผู้สอน</span>
              </Link>
            </div>
          </div>
        )}
      </div>
      {activeMode === 'ROADMAP' && (
        <SemesterRoadmapTab
          currentUser={currentUser}
          currentCourse={currentCourse}
          semesterRoadmapSessions={semesterRoadmapSessions}
          semesterTotalSessions={semesterTotalSessions}
          completedSessionsCount={completedSessionsCount}
          nextUpcomingSession={nextUpcomingSession}
          handleFastOpenSession={handleFastOpenSession}
          setActiveMode={setActiveMode}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE: EXAM ELIGIBILITY SUMMARY (สรุปสิทธิ์สอบทั้งภาคการศึกษา)
         ───────────────────────────────────────────────────────────── */}
      {activeMode === 'ELIGIBILITY' && (
        <EligibilityTab
          currentUser={currentUser}
          currentCourse={currentCourse}
          availableCourses={availableCourses}
          selectedCourseCode={selectedCourseCode}
          handleCourseChange={handleCourseChange}
          showEligibilitySettings={showEligibilitySettings}
          setShowEligibilitySettings={setShowEligibilitySettings}
          minAttendancePercent={minAttendancePercent}
          setMinAttendancePercent={setMinAttendancePercent}
          semesterTotalSessions={semesterTotalSessions}
          setSemesterTotalSessions={setSemesterTotalSessions}
          lateToAbsentRatio={lateToAbsentRatio}
          setLateToAbsentRatio={setLateToAbsentRatio}
          includeLeaveAsExcused={includeLeaveAsExcused}
          setIncludeLeaveAsExcused={setIncludeLeaveAsExcused}
          handleExportEligibilityCsv={handleExportEligibilityCsv}
          eligibilityStats={eligibilityStats}
          recordedSessionsCount={recordedSessionsCount}
          maxAllowedAbsences={maxAllowedAbsences}
          handleSimulateAttendance={handleSimulateAttendance}
          eligibilitySearch={eligibilitySearch}
          setEligibilitySearch={setEligibilitySearch}
          eligibilityStatusFilter={eligibilityStatusFilter}
          setEligibilityStatusFilter={setEligibilityStatusFilter}
          eligibilityList={eligibilityList}
          filteredEligibilityList={filteredEligibilityList}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE: OFFICIAL GRADE & EXAMINATION RESULT SHEET (ใบกรอกคะแนนผลการสอบ)
         ───────────────────────────────────────────────────────────── */}
      {activeMode === 'GRADE_SHEET' && (
        <GradeSheetTab
          currentUser={currentUser}
          currentCourse={currentCourse}
          availableCourses={availableCourses}
          selectedCourseCode={selectedCourseCode}
          handleCourseChange={handleCourseChange}
          studentsList={eligibilityList.map((item) => ({
            studentCode: item.studentCode,
            studentName: item.studentName,
            major: item.major,
            yearLevel: item.yearLevel,
            attendedPercent: item.attendedPercent,
            eligibilityStatus: item.status,
          }))}
        />
      )}


      {/* ─────────────────────────────────────────────────────────────
          MODE 1: ROLL CALL (Hidden on Print)
         ───────────────────────────────────────────────────────────── */}
      {activeMode === 'ROLL_CALL' && (
        <RollCallTab
          currentUser={currentUser}
          currentCourse={currentCourse}
          availableCourses={availableCourses}
          selectedCourseCode={selectedCourseCode}
          handleCourseChange={handleCourseChange}
          date={date}
          setDate={setDate}
          recordedBy={recordedBy}
          isTeacher={isTeacher}
          instructors={instructors}
          selectedInstructor={selectedInstructor}
          setSelectedInstructor={setSelectedInstructor}
          timetables={timetables}
          setSelectedCourseCode={setSelectedCourseCode}
          setRecordedBy={setRecordedBy}
          showOnlyTargetYear={showOnlyTargetYear}
          setShowOnlyTargetYear={setShowOnlyTargetYear}
          studentProgramFilter={studentProgramFilter}
          setStudentProgramFilter={setStudentProgramFilter}
          activeProgramMode={activeProgramMode}
          yearAllCount={yearAllCount}
          yearEnglishCount={yearEnglishCount}
          yearThaiCount={yearThaiCount}
          sessionCustom={sessionCustom}
          setShowSessionModal={setShowSessionModal}
          semesterTotalSessions={semesterTotalSessions}
          completedSessionsCount={completedSessionsCount}
          nextUpcomingSession={nextUpcomingSession}
          handleFastOpenSession={handleFastOpenSession}
          setActiveMode={setActiveMode}
          targetStudents={targetStudents}
          groupedTargetSections={groupedTargetSections}
          attendanceMap={attendanceMap}
          handleStatusChange={handleStatusChange}
          setAllStatus={setAllStatus}
          total={total}
          present={present}
          late={late}
          absent={absent}
          leave={leave}
          percent={percent}
          customEnrolledCodeSet={customEnrolledCodeSet}
          handleRemoveEnrollment={handleRemoveEnrollment}
          setIsAddStudentModalOpen={setIsAddStudentModalOpen}
          saving={saving}
          handleSave={handleSave}
          checkIsEnglishCourse={checkIsEnglishCourse}
          formatDayLabel={formatDayLabel}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE 2: CLASSROOM QR CODE CHECK-IN (Hidden on Print)
         ───────────────────────────────────────────────────────────── */}
      {activeMode === 'QR_CODE' && (
        <ClassroomQrProjector
          availableCourses={availableCourses}
          currentCourse={currentCourse}
          onSelectCourse={(code) => setSelectedCourseCode(code)}
          date={date}
          onChangeDate={(newDate) => {
            setDate(newDate);
            setSessionCustom((prev) => ({ ...prev, date: newDate }));
          }}
          sessionNumber={sessionCustom.sessionNumber || 1}
          onChangeSessionNumber={(num) =>
            setSessionCustom((prev) => ({ ...prev, sessionNumber: num }))
          }
          targetStudents={targetStudents}
          currentUser={currentUser}
          recordedBy={recordedBy}
          onRecordsSynced={(allRecords) => {
            setHistoryRecords(allRecords);
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE 3: ATTENDANCE HISTORY (Hidden on Print)
         ───────────────────────────────────────────────────────────── */}
      {activeMode === 'HISTORY' && (
        <AttendanceHistoryTab
          visibleHistoryRecords={visibleHistoryRecords}
          isTeacher={isTeacher}
          availableCourses={availableCourses}
        />
      )}
{/* Modal to Add Transfer / Cross-enroll Student */}
      {currentCourse && (
        <AddStudentToCourseModal
          isOpen={isAddStudentModalOpen}
          onClose={() => setIsAddStudentModalOpen(false)}
          courseCode={currentCourse.courseCode}
          courseName={currentCourse.courseName}
          allStudents={students}
          currentEnrolledCodes={new Set(targetStudents.map((s) => s.studentCode))}
          onEnrolledSuccess={(newEnr, addedOrUpdatedStudent) => {
            if (addedOrUpdatedStudent) {
              setStudents((prev) => {
                const codeKey = addedOrUpdatedStudent.studentCode.trim().toLowerCase();
                const exists = prev.some((s) => s.studentCode.trim().toLowerCase() === codeKey);
                if (exists) {
                  return prev.map((s) =>
                    s.studentCode.trim().toLowerCase() === codeKey ? { ...s, ...addedOrUpdatedStudent } : s
                  );
                }
                return [...prev, addedOrUpdatedStudent];
              });
            }
            setCustomEnrollments((prev) => [
              newEnr,
              ...prev.filter((e) => !(e.courseCode === newEnr.courseCode && e.studentCode === newEnr.studentCode)),
            ]);
            setAttendanceMap((prev) => ({
              ...prev,
              [newEnr.studentCode]: prev[newEnr.studentCode] || 'PRESENT',
            }));
            setIsAddStudentModalOpen(false);
          }}
          currentUserName={currentUser?.name}
        />
      )}

            {/* Session Customizer Modal */}
      <SessionCustomModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        sessionCustom={sessionCustom}
        setSessionCustom={setSessionCustom}
        instructors={instructors}
        currentUser={currentUser}
      />

{/* User Profile & Password Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(updated) => setCurrentUser(updated)}
      />
    </div>
  );
}
