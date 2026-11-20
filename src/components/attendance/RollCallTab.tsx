'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Calendar,
  CheckSquare,
  BookOpen,
  User,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  SlidersHorizontal,
  Save,
  AlertTriangle,
  UserCheck,
  UserPlus,
  Lock,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { Student, TimetableItem, AuthUser } from '@/types';
import type { MajorSectionGroup, SemesterSessionItem } from '@/lib/attendance/workspaceHelpers';

export type AttendanceMode =
  | 'ROLL_CALL'
  | 'ROADMAP'
  | 'QR_CODE'
  | 'ELIGIBILITY'
  | 'GRADE_SHEET'
  | 'HISTORY';

interface RollCallTabProps {
  currentUser?: AuthUser | null;
  currentCourse: TimetableItem | undefined;
  availableCourses: TimetableItem[];
  selectedCourseCode: string;
  handleCourseChange: (keyOrCode: string) => void;
  date: string;
  setDate: (d: string) => void;
  recordedBy: string;
  isTeacher: boolean;
  instructors: string[];
  selectedInstructor: string;
  setSelectedInstructor: (inst: string) => void;
  timetables: TimetableItem[];
  setSelectedCourseCode: (code: string) => void;
  setRecordedBy: (by: string) => void;
  showOnlyTargetYear: boolean;
  setShowOnlyTargetYear: (val: boolean) => void;
  studentProgramFilter: 'AUTO' | 'ENGLISH' | 'THAI' | 'ALL';
  setStudentProgramFilter: (val: 'AUTO' | 'ENGLISH' | 'THAI' | 'ALL') => void;
  activeProgramMode: 'ENGLISH' | 'THAI' | 'ALL';
  yearAllCount: number;
  yearEnglishCount: number;
  yearThaiCount: number;
  sessionCustom: {
    sessionNumber: number;
    sessionType: 'NORMAL' | 'MAKEUP' | 'SPECIAL' | 'EXAM';
    date: string;
    startTime: string;
    endTime: string;
    room: string;
    leadInstructor: string;
    coInstructors: string[];
    customCoInstructorText: string;
    sessionTopic: string;
    note: string;
    isCustomized: boolean;
  };
  setShowSessionModal: (val: boolean) => void;
  semesterTotalSessions: number;
  completedSessionsCount: number;
  nextUpcomingSession?: SemesterSessionItem | null;
  handleFastOpenSession: (sess: SemesterSessionItem) => void;
  setActiveMode: (mode: AttendanceMode) => void;
  targetStudents: Student[];
  groupedTargetSections: MajorSectionGroup[];
  attendanceMap: Record<string, 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE'>;
  handleStatusChange: (code: string, status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE') => void;
  setAllStatus: (status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE') => void;
  total: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  percent: number;
  customEnrolledCodeSet: Set<string>;
  handleRemoveEnrollment: (studentCode: string, studentName: string) => void;
  setIsAddStudentModalOpen: (val: boolean) => void;
  saving: boolean;
  handleSave: () => Promise<void>;
  checkIsEnglishCourse: (c: TimetableItem) => boolean;
  formatDayLabel: (dayOfWeek?: number, isEn?: boolean) => string;
}

export function RollCallTab({
  currentUser,
  currentCourse,
  availableCourses,
  selectedCourseCode,
  handleCourseChange,
  date,
  setDate,
  recordedBy,
  isTeacher,
  instructors,
  selectedInstructor,
  setSelectedInstructor,
  timetables,
  setSelectedCourseCode,
  setRecordedBy,
  showOnlyTargetYear,
  setShowOnlyTargetYear,
  studentProgramFilter,
  setStudentProgramFilter,
  activeProgramMode,
  yearAllCount,
  yearEnglishCount,
  yearThaiCount,
  sessionCustom,
  setShowSessionModal,
  semesterTotalSessions,
  completedSessionsCount,
  nextUpcomingSession,
  handleFastOpenSession,
  setActiveMode,
  targetStudents,
  groupedTargetSections,
  attendanceMap,
  handleStatusChange,
  setAllStatus,
  total,
  present,
  late,
  absent,
  leave,
  percent,
  customEnrolledCodeSet,
  handleRemoveEnrollment,
  setIsAddStudentModalOpen,
  saving,
  handleSave,
  checkIsEnglishCourse,
  formatDayLabel,
}: RollCallTabProps) {
  const { t, isEn: isLangEn } = useLanguage();

  // Collapsible state controlled by the single red chevron button at the bottom-right corner
  // When false (default), ONLY the core blue-frame items (Instructor, Course, Date, and 1-line Session Summary) are shown!
  const [isExtraToolsOpen, setIsExtraToolsOpen] = useState(false);
  const [showRoadmapBanner, setShowRoadmapBanner] = useState(false);
  const [showCourseCards, setShowCourseCards] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Filtered sections by studentSearch query
  const filteredGroupedSections = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return groupedTargetSections;
    return groupedTargetSections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((s) => {
          const fullName = (s.fullName || `${s.title || ''} ${s.firstName} ${s.lastName}`).toLowerCase();
          return (
            s.studentCode.toLowerCase().includes(q) ||
            fullName.includes(q) ||
            (s.major || '').toLowerCase().includes(q)
          );
        }),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [groupedTargetSections, studentSearch]);

  if (!currentUser) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 print:hidden">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
          <Lock className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="font-extrabold text-slate-800 text-base">
          เข้าสู่ระบบอาจารย์ผู้สอนเพื่อเริ่มต้นเช็คชื่อ
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          เพื่อความปลอดภัยของข้อมูลและการประกันคุณภาพการศึกษา
          ระบบจะแสดงเฉพาะรายวิชาและบัญชีรายชื่อนิสิตตามรายวิชาที่ท่านรับผิดชอบบรรยายเท่านั้น
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-5 print:hidden">
      {/* ─────────────────────────────────────────────────────────────
          COLLAPSIBLE 16-WEEK ROADMAP PROGRESS BANNER
         ───────────────────────────────────────────────────────────── */}
      {currentCourse && showRoadmapBanner && (
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-emerald-700/40 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold">
                <Calendar className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>แผนผังการเรียนการสอนภาคเรียนที่ 1/2569 (เป้าหมาย {semesterTotalSessions} คาบ)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRoadmapBanner(false)}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-emerald-100 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>ยุบเก็บ</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span className="font-mono text-emerald-300">{currentCourse.courseCode}</span>
              <span>{currentCourse.courseName}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
              <span>
                สอนแล้ว <strong className="text-white font-bold">{completedSessionsCount}</strong> /{' '}
                {semesterTotalSessions} คาบ (
                {Math.round((completedSessionsCount / semesterTotalSessions) * 100)}%)
              </span>
              <div className="w-28 sm:w-36 bg-slate-700 rounded-full h-2 overflow-hidden border border-slate-600">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (completedSessionsCount / semesterTotalSessions) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {nextUpcomingSession ? (
              <button
                type="button"
                onClick={() => handleFastOpenSession(nextUpcomingSession)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition transform hover:scale-[1.02] cursor-pointer"
                title="คลิกเพื่อเปิดเช็คชื่อคาบถัดไปทันทีโดยไม่ต้องเลือกวันเอง"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping" />
                <span>
                  🚀 เปิดเช็คชื่อคาบถัดไป (คาบที่ {nextUpcomingSession.sessionNumber} —{' '}
                  {nextUpcomingSession.dateFormattedTh})
                </span>
              </button>
            ) : (
              <div className="px-3.5 py-2 bg-emerald-900/60 text-emerald-200 rounded-xl text-xs font-bold border border-emerald-700/50 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>สอนครบตามเกณฑ์ 16 คาบแล้ว</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveMode('ROADMAP')}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-emerald-300" />
              <span>ดูแผนผัง 16 คาบ</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Panel: Core Blue-Frame Items + Bottom-Right Red Chevron Toggle */}
      <div
        id="roll-call-section"
        className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3"
      >
        {/* Core Selectors (Blue Frame): 1. อาจารย์ผู้สอน, 2. รายวิชาที่สอน, 3. วันที่สอน/เช็คชื่อ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4">
          {/* 1. อาจารย์ผู้สอน */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              อาจารย์ผู้รับผิดชอบบรรยาย:
            </label>
            {isTeacher ? (
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 font-bold text-xs sm:text-sm flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="truncate">{currentUser.name}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/90 text-emerald-800 font-extrabold shrink-0 border border-emerald-300">
                  🔒 ล็อคเฉพาะวิชาที่ตนสอน
                </span>
              </div>
            ) : (
              <select
                value={selectedInstructor}
                onChange={(e) => {
                  const inst = e.target.value;
                  setSelectedInstructor(inst);
                  const matched = timetables.filter(
                    (t) => inst === 'ALL' || t.instructor?.includes(inst)
                  );
                  if (matched.length > 0) {
                    setSelectedCourseCode(matched[0].courseCode);
                    if (matched[0].instructor) setRecordedBy(matched[0].instructor);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">-- อาจารย์ทุกท่าน ({instructors.length} ท่าน) --</option>
                {instructors.map((inst, i) => (
                  <option key={i} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. รายวิชาที่สอน */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              รายวิชาที่รับผิดชอบสอน ({availableCourses.length} วิชา):
            </label>
            {availableCourses.length === 0 ? (
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>ไม่พบรายวิชาที่สอนในภาคเรียนนี้</span>
              </div>
            ) : (
              <select
                value={(currentCourse as any)?.sectionKey || selectedCourseCode}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                {(() => {
                  const interCourses = availableCourses.filter((c) => checkIsEnglishCourse(c));
                  const thaiCourses = availableCourses.filter((c) => !checkIsEnglishCourse(c));

                  return (
                    <>
                      {interCourses.length > 0 && (
                        <optgroup label="🌐 หลักสูตรนานาชาติ (Inter / English Program)">
                          {interCourses.map((c, i) => {
                            const sKey = (c as any).sectionKey || c.courseCode;
                            return (
                              <option key={`en-${sKey}-${i}`} value={sKey}>
                                🌐 [Inter/EN] {c.courseCode} — {c.courseName} (ปี {c.yearLevel})
                              </option>
                            );
                          })}
                        </optgroup>
                      )}
                      {thaiCourses.length > 0 && (
                        <optgroup label="🇹🇭 หลักสูตรภาษาไทย (Thai Program)">
                          {thaiCourses.map((c, i) => {
                            const sKey = (c as any).sectionKey || c.courseCode;
                            return (
                              <option key={`th-${sKey}-${i}`} value={sKey}>
                                🇹🇭 [ภาคไทย] {c.courseCode} — {c.courseName} (ปี {c.yearLevel})
                              </option>
                            );
                          })}
                        </optgroup>
                      )}
                    </>
                  );
                })()}
              </select>
            )}
          </div>

          {/* 3. วันที่เช็คชื่อ */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              วันที่สอน / เช็คชื่อ:
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* 4. Bottom Row of Blue Frame: Compact Session Summary + Bottom-Right Red Chevron Toggle */}
        {currentCourse && (
          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-slate-700 min-w-0">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-900 text-white shrink-0">
                คาบที่ {sessionCustom.sessionNumber}
              </span>
              <span className="font-bold text-slate-900">{currentCourse.courseCode}</span>
              <span className="text-slate-400">•</span>
              <span className="text-[11px] text-slate-600">
                ⏰ {sessionCustom.startTime}-{sessionCustom.endTime}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-[11px] text-slate-700 font-semibold">
                🚪 {sessionCustom.room}
              </span>
            </div>

            {/* Red Chevron Toggle Button at Bottom-Right Corner (shown here when collapsed) */}
            {!isExtraToolsOpen && (
              <button
                type="button"
                onClick={() => setIsExtraToolsOpen(true)}
                className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition cursor-pointer shrink-0 shadow-2xs"
                title="คลี่เครื่องมือเสริม (ตั้งค่าคาบ, ตัวกรองหลักสูตร, การ์ดวิชา, แผนผัง 16 คาบ)"
                aria-label="คลี่เครื่องมือเสริม"
              >
                <ChevronDown className="w-5 h-5 stroke-[2.75]" />
              </button>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            EXPANDED EXTRA TOOLS DRAWER (Only shown when Red Chevron is clicked)
           ───────────────────────────────────────────────────────────── */}
        {currentCourse && isExtraToolsOpen && (
          <div className="pt-3 border-t border-slate-200/80 space-y-3 animate-in fade-in duration-150">
            {/* Quick Action Buttons inside Extra Tools Drawer */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowSessionModal(true)}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                <span>⚙️ ตั้งค่าคาบ</span>
              </button>

              {nextUpcomingSession && (
                <button
                  type="button"
                  onClick={() => handleFastOpenSession(nextUpcomingSession)}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 text-[11px] sm:text-xs font-extrabold flex items-center gap-1 transition cursor-pointer"
                  title={`เปิดเช็คชื่อคาบถัดไป: คาบที่ ${nextUpcomingSession.sessionNumber} (${nextUpcomingSession.dateFormattedTh})`}
                >
                  <span>🚀 เปิดคาบที่ {nextUpcomingSession.sessionNumber}</span>
                </button>
              )}

              {availableCourses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCourseCards((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border flex items-center gap-1 transition cursor-pointer ${
                    showCourseCards
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>การ์ดวิชา ({availableCourses.length})</span>
                  {showCourseCards ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowRoadmapBanner((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border flex items-center gap-1 transition cursor-pointer ${
                  showRoadmapBanner
                    ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>แผนผัง ({completedSessionsCount}/{semesterTotalSessions})</span>
                {showRoadmapBanner ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* COURSE CARDS GRID (Sub-collapsible inside drawer) */}
            {availableCourses.length > 0 && showCourseCards && (
              <div className="pt-2 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      การ์ดรายวิชาที่รับผิดชอบสอน ({availableCourses.length} วิชา) —
                      แตะการ์ดเพื่อสลับวิชาได้ทันที:
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {availableCourses.map((c, idx) => {
                    const sKey = (c as any).sectionKey || c.courseCode;
                    const currentKey = (currentCourse as any)?.sectionKey || selectedCourseCode;
                    const isSelected = sKey === currentKey;
                    const isEn = checkIsEnglishCourse(c);
                    const sharedMajors: string[] = (c as any).sharedMajors || [];

                    return (
                      <button
                        key={`card-${sKey}-${idx}`}
                        type="button"
                        onClick={() => {
                          handleCourseChange(sKey);
                          if (typeof window !== 'undefined' && window.innerWidth < 768) {
                            setShowCourseCards(false);
                          }
                        }}
                        className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? isEn
                              ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400/40'
                              : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/40'
                            : 'bg-slate-50/70 hover:bg-white text-slate-800 border-slate-200/90 hover:border-emerald-400 hover:shadow-xs'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-lg ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : isEn
                                  ? 'bg-indigo-100 text-indigo-900'
                                  : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              {c.courseCode}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : isEn
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isEn ? '🌐 Inter/EN' : '🇹🇭 ภาคไทย'} • ปี {c.yearLevel || 1}
                            </span>
                          </div>

                          <div
                            className={`font-bold text-xs leading-snug line-clamp-2 ${
                              isSelected ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {c.courseName}
                          </div>

                          {sharedMajors.length > 1 && (
                            <div
                              className={`text-[10px] font-semibold truncate ${
                                isSelected ? 'text-white/85' : 'text-slate-500'
                              }`}
                              title={`เรียนรวม ${sharedMajors.length} สาขาวิชา: ${sharedMajors.join(' • ')}`}
                            >
                              👥 เรียนรวม {sharedMajors.length} สาขา ({sharedMajors.join(', ')})
                            </div>
                          )}
                        </div>

                        <div
                          className={`flex items-center justify-between text-[11px] pt-1.5 border-t ${
                            isSelected
                              ? 'border-white/20 text-white/90'
                              : 'border-slate-200/80 text-slate-500'
                          }`}
                        >
                          <span className="truncate">
                            📅 {formatDayLabel(c.dayOfWeek, isEn)}{' '}
                            {c.startTime ? `${c.startTime}-${c.endTime}` : ''}
                          </span>
                          <span
                            className="font-bold shrink-0 ml-1 truncate max-w-[140px]"
                            title={c.room || '-'}
                          >
                            🚪 {c.room || '-'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ENHANCED SESSION DETAILS & PROGRAM FILTER */}
            {(() => {
              const isEn =
                /inter|eng|english|นานาชาติ/i.test(currentCourse.timetableTitle || '') ||
                /^[A-Za-z0-9\s:,-]+$/.test(currentCourse.courseName);
              const allCo = [
                ...sessionCustom.coInstructors,
                ...(sessionCustom.customCoInstructorText
                  ? sessionCustom.customCoInstructorText.split(',').map((s) => s.trim())
                  : []),
              ].filter(Boolean);

              const sessionTypeConfig = {
                NORMAL: {
                  label: 'คาบเรียนปกติ',
                  color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                },
                MAKEUP: {
                  label: 'คาบสอนชดเชย',
                  color: 'bg-amber-100 text-amber-800 border-amber-300',
                },
                SPECIAL: {
                  label: 'บรรยายพิเศษ',
                  color: 'bg-purple-100 text-purple-800 border-purple-300',
                },
                EXAM: {
                  label: 'สอบย่อย/เก็บคะแนน',
                  color: 'bg-rose-100 text-rose-800 border-rose-300',
                },
              }[sessionCustom.sessionType] || {
                label: 'คาบเรียนปกติ',
                color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
              };

              return (
                <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-emerald-50/20 p-3.5 sm:p-4 shadow-sm space-y-3 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/70">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                          isEn
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isEn ? '🌐 หลักสูตรนานาชาติ (Inter/EN)' : '🇹🇭 หลักสูตรภาษาไทย (Thai)'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${sessionTypeConfig.color}`}
                      >
                        {sessionTypeConfig.label}
                      </span>
                      {sessionCustom.isCustomized && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          ปรับแต่งแล้ว
                        </span>
                      )}
                    </div>

                    {/* Program & Year Filters */}
                    <div className="w-full sm:w-auto flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
                      <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setStudentProgramFilter('ENGLISH')}
                          className={`px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
                            activeProgramMode === 'ENGLISH'
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">🌐 {t.attFilterInter}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                              activeProgramMode === 'ENGLISH'
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {yearEnglishCount}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentProgramFilter('THAI')}
                          className={`px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
                            activeProgramMode === 'THAI'
                              ? 'bg-emerald-600 text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">🇹🇭 {t.attFilterThai}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                              activeProgramMode === 'THAI'
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {yearThaiCount}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentProgramFilter('ALL')}
                          className={`px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
                            activeProgramMode === 'ALL'
                              ? 'bg-slate-800 text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">👥 {t.attFilterAllStudents}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                              activeProgramMode === 'ALL'
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {yearAllCount}
                          </span>
                        </button>
                      </div>

                      <label className="flex items-center justify-center xs:justify-start gap-1.5 cursor-pointer text-slate-600 text-xs py-1 xs:py-0 xs:pl-2 xs:border-l xs:border-slate-200 shrink-0">
                        <input
                          type="checkbox"
                          checked={showOnlyTargetYear}
                          onChange={(e) => setShowOnlyTargetYear(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="whitespace-nowrap">
                          {isLangEn ? `Year ${currentCourse.yearLevel} only` : `เฉพาะปี ${currentCourse.yearLevel}`}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Session Parameters Display */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs">
                    <div className="flex items-center gap-2 bg-white/90 p-2 sm:p-2.5 rounded-xl border border-slate-200/80">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-400 font-semibold">{t.attActualDate}</div>
                        <div className="font-bold text-slate-800 truncate">{sessionCustom.date || date}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/90 p-2 sm:p-2.5 rounded-xl border border-slate-200/80">
                      <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-400 font-semibold">{t.attClassTime}</div>
                        <div className="font-bold text-slate-800 truncate">
                          {sessionCustom.startTime} - {sessionCustom.endTime} {isLangEn ? '' : 'น.'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/90 p-2 sm:p-2.5 rounded-xl border border-slate-200/80">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-400 font-semibold">{t.attClassroom}</div>
                        <div className="font-bold text-slate-800 truncate">{sessionCustom.room}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/90 p-2 sm:p-2.5 rounded-xl border border-slate-200/80">
                      <User className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="truncate min-w-0">
                        <div className="text-[10px] text-slate-400 font-semibold">{t.attLeadInstructor}</div>
                        <div className="font-bold text-slate-800 truncate">
                          {sessionCustom.leadInstructor ||
                            currentCourse.instructor ||
                            (isLangEn ? 'Course Instructor' : 'อาจารย์ประจำวิชา')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Co-instructors */}
                  {allCo.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <span className="font-bold text-indigo-900 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        อาจารย์ผู้สอนร่วม / ผู้ช่วยสอน (TAs) ในคาบนี้ ({allCo.length} ท่าน):
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {allCo.map((inst, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-semibold"
                          >
                            <span>👨‍🏫 {inst}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Session Topic / Note */}
                  {(sessionCustom.sessionTopic || sessionCustom.note) && (
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                      {sessionCustom.sessionTopic && (
                        <div>
                          <span className="font-bold text-slate-700">📖 หัวข้อการสอน:</span>{' '}
                          <span className="text-slate-900 font-medium">{sessionCustom.sessionTopic}</span>
                        </div>
                      )}
                      {sessionCustom.note && (
                        <div>
                          <span className="font-bold text-slate-700">📝 บันทึกคาบ:</span>{' '}
                          <span className="text-slate-600">{sessionCustom.note}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Red Chevron Toggle Button at Bottom-Right Corner (shown here when expanded to collapse back to Blue Frame) */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsExtraToolsOpen(false);
                  setShowCourseCards(false);
                  setShowRoadmapBanner(false);
                }}
                className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition cursor-pointer shadow-2xs"
                title="ยุบเก็บเครื่องมือเสริม (เหลือเฉพาะกรอบเลือกวิชา)"
                aria-label="ยุบเก็บเครื่องมือเสริม"
              >
                <ChevronUp className="w-5 h-5 stroke-[2.75]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Roster Card (การ์ดบันทึกรายชื่อนิสิต — อยู่ชิดด้านบนบนมือถือทันทีเมื่อยุบเมนู) */}
      {currentCourse && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 space-y-3">
            {/* Row 1: Title & Save Button */}
            <div className="flex items-center justify-between flex-wrap gap-2.5">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>บัญชีรายชื่อนิสิต ({targetStudents.length} รูป/คน)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                      activeProgramMode === 'ENGLISH'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : activeProgramMode === 'THAI'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {activeProgramMode === 'ENGLISH'
                      ? '🌐 Inter'
                      : activeProgramMode === 'THAI'
                      ? '🇹🇭 ภาคไทย'
                      : '👥 รวม 2 ภาค'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-normal truncate max-w-[240px] sm:max-w-none">
                  ({currentCourse.courseCode} — {currentCourse.courseName})
                </span>
              </h3>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition shadow-2xs cursor-pointer flex-1 sm:flex-initial"
                  title="เพิ่มรหัสนิสิต ชื่อนิสิต และสาขาวิชา สำหรับนิสิตเทียบโอน/เดินเรียน เข้าในบัญชีรายชื่อวิชานี้"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>+ เพิ่มนิสิต</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || targetStudents.length === 0}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm cursor-pointer flex-1 sm:flex-initial"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>{saving ? 'กำลังบันทึก...' : 'บันทึกเช็คชื่อ'}</span>
                </button>
              </div>
            </div>

            {/* Row 2: Live Attendance Stats + Quick Bulk Actions + Student Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-200/80">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs font-semibold">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  มา: <strong>{present}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                  สาย: <strong>{late}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                  ขาด: <strong>{absent}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  ลา: <strong>{leave}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-white font-mono">
                  {percent}%
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* Quick Search Input */}
                <div className="relative flex-1 sm:flex-initial min-w-[160px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหารหัส / ชื่อนิสิต..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full sm:w-48 pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setAllStatus('PRESENT')}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200/80 border border-emerald-300/70 transition cursor-pointer shrink-0"
                >
                  ✓ มาทุกคน
                </button>
                <button
                  type="button"
                  onClick={() => setAllStatus('ABSENT')}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-red-100/80 text-red-800 hover:bg-red-200/80 border border-red-300/70 transition cursor-pointer shrink-0"
                >
                  ✕ ขาดทุกคน
                </button>
              </div>
            </div>
          </div>

          {filteredGroupedSections.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              {studentSearch.trim()
                ? `ไม่พบนิสิตที่ตรงกับคำค้นหา "${studentSearch}"`
                : 'ไม่พบนิสิตในกลุ่มเรียนที่เลือก'}
            </div>
          ) : (
            <>
              {/* 1. Mobile Card View */}
              <div className="block sm:hidden divide-y divide-slate-200">
                {filteredGroupedSections.map((sec) => (
                  <div key={`m-sec-${sec.groupKey}`} className="space-y-3 p-3 bg-slate-50/60">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1 pt-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${sec.meta.badgeColor}`}
                      >
                        {activeProgramMode === 'ENGLISH' ? sec.meta.labelEn : sec.meta.labelTh}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        จำนวน {sec.items.length} รูป/คน
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {sec.items.map((s: Student & { indexInMajor?: number }) => {
                        const currentStatus = attendanceMap[s.studentCode] || 'PRESENT';
                        return (
                          <div
                            key={`m-card-${s.studentCode}`}
                            className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                                  {s.indexInMajor}. {s.fullName || `${s.title || ''} ${s.firstName} ${s.lastName}`}
                                </div>
                                <div className="flex items-center gap-2 pt-1 flex-wrap">
                                  <span className="font-mono font-extrabold text-sm sm:text-base text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                                    {s.studentCode}
                                  </span>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-xs text-slate-500 font-medium truncate">
                                    {s.major || sec.meta.labelTh.replace(/^สาขาวิชา/, '')}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                                  currentStatus === 'PRESENT'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : currentStatus === 'LATE'
                                    ? 'bg-amber-100 text-amber-800'
                                    : currentStatus === 'ABSENT'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {currentStatus === 'PRESENT'
                                  ? 'มาปกติ'
                                  : currentStatus === 'LATE'
                                  ? 'มาสาย'
                                  : currentStatus === 'ABSENT'
                                  ? 'ขาดเรียน'
                                  : 'ลากิจ/ป่วย'}
                              </span>
                            </div>

                            <div className="grid grid-cols-4 gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(s.studentCode, 'PRESENT')}
                                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center min-h-[42px] cursor-pointer ${
                                  currentStatus === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30'
                                    : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                                }`}
                              >
                                มา
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(s.studentCode, 'LATE')}
                                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center min-h-[42px] cursor-pointer ${
                                  currentStatus === 'LATE'
                                    ? 'bg-yellow-500 text-slate-950 shadow-xs ring-2 ring-yellow-400/40'
                                    : 'bg-slate-100 text-slate-700 hover:bg-yellow-50'
                                }`}
                              >
                                สาย
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(s.studentCode, 'ABSENT')}
                                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center min-h-[42px] cursor-pointer ${
                                  currentStatus === 'ABSENT'
                                    ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-500/30'
                                    : 'bg-slate-100 text-slate-700 hover:bg-red-50'
                                }`}
                              >
                                ขาด
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(s.studentCode, 'LEAVE')}
                                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center min-h-[42px] cursor-pointer ${
                                  currentStatus === 'LEAVE'
                                    ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/30'
                                    : 'bg-slate-100 text-slate-700 hover:bg-blue-50'
                                }`}
                              >
                                ลา
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/50 text-xs uppercase font-semibold text-slate-400 border-b">
                    <tr>
                      <th className="px-6 py-3.5 w-16">ลำดับ</th>
                      <th className="px-6 py-3.5 w-32">รหัสนิสิต</th>
                      <th className="px-6 py-3.5">ชื่อ - นามสกุล</th>
                      <th className="px-6 py-3.5">สาขาวิชา</th>
                      <th className="px-6 py-3.5 text-center w-64">สถานะการเข้าเรียน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGroupedSections.map((sec) => (
                      <React.Fragment key={sec.groupKey}>
                        <tr className="bg-slate-100/90 border-y border-slate-200">
                          <td colSpan={5} className="px-6 py-2.5 text-xs font-extrabold text-slate-800">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${sec.meta.badgeColor}`}
                                >
                                  {activeProgramMode === 'ENGLISH'
                                    ? sec.meta.labelEn
                                    : sec.meta.labelTh}
                                </span>
                                <span className="text-slate-500 font-normal text-[11px]">
                                  (
                                  {activeProgramMode === 'ENGLISH'
                                    ? sec.meta.labelTh
                                    : sec.meta.labelEn}
                                  )
                                </span>
                              </div>
                              <span className="text-slate-600 font-bold text-[11px]">
                                จำนวน {sec.items.length} รูป/คน (ลำดับที่ 1 - {sec.items.length})
                              </span>
                            </div>
                          </td>
                        </tr>
                        {sec.items.map((s: Student & { indexInMajor?: number }) => {
                          const currentStatus = attendanceMap[s.studentCode] || 'PRESENT';
                          return (
                            <tr
                              key={`${sec.groupKey}-${s.studentCode}`}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500">
                                {s.indexInMajor}
                              </td>
                              <td className="px-6 py-4 font-mono font-extrabold text-sm sm:text-base text-emerald-800 tracking-tight whitespace-nowrap">
                                {s.studentCode}
                              </td>
                              <td className="px-6 py-4 font-medium text-sm sm:text-base text-slate-900">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>
                                    {s.fullName || `${s.title || ''} ${s.firstName} ${s.lastName}`}
                                  </span>
                                  {customEnrolledCodeSet.has(
                                    s.studentCode.toLowerCase().trim()
                                  ) && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                                      <span>⚡ เทียบโอน/เดินเรียน</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveEnrollment(
                                            s.studentCode,
                                            s.fullName || s.studentCode
                                          );
                                        }}
                                        className="text-amber-700 hover:text-rose-700 hover:bg-amber-200/80 rounded-full w-3.5 h-3.5 flex items-center justify-center transition cursor-pointer"
                                        title="นำนิสิตเทียบโอนท่านนี้ออกจากห้องเรียนนี้"
                                      >
                                        ✕
                                      </button>
                                    </span>
                                  )}
                                  {(s.programType || '').toUpperCase() === 'ENGLISH' ||
                                  (!['ไทย', 'Thai'].includes(s.nationality || '') &&
                                    s.programType !== 'THAI') ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      🌐 Inter
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      🇹🇭 ภาคไทย
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-500">
                                {s.major || sec.meta.labelTh.replace(/^สาขาวิชา/, '')}
                              </td>
                              <td className="px-3 sm:px-6 py-3.5">
                                <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(s.studentCode, 'PRESENT')}
                                    className={`min-h-[38px] min-w-[38px] sm:min-w-[42px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                                      currentStatus === 'PRESENT'
                                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                                  >
                                    มา
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(s.studentCode, 'LATE')}
                                    className={`min-h-[38px] min-w-[38px] sm:min-w-[42px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                                      currentStatus === 'LATE'
                                        ? 'bg-yellow-500 text-slate-950 shadow-sm ring-2 ring-yellow-400/40'
                                        : 'bg-slate-100 text-slate-700 hover:bg-yellow-50 hover:text-yellow-700'
                                    }`}
                                  >
                                    สาย
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(s.studentCode, 'ABSENT')}
                                    className={`min-h-[38px] min-w-[38px] sm:min-w-[42px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                                      currentStatus === 'ABSENT'
                                        ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-500/30'
                                        : 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700'
                                    }`}
                                  >
                                    ขาด
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(s.studentCode, 'LEAVE')}
                                    className={`min-h-[38px] min-w-[38px] sm:min-w-[42px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                                      currentStatus === 'LEAVE'
                                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
                                        : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                                    }`}
                                  >
                                    ลา
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              อาจารย์ผู้บันทึก:{' '}
              <strong className="text-slate-800">
                {currentUser ? currentUser.name : recordedBy}
              </strong>
            </span>
            <button
              onClick={handleSave}
              disabled={saving || targetStudents.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'กำลังบันทึกลง Google Sheets...' : 'บันทึกการเช็คชื่อ'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
