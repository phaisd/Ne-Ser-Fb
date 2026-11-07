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
  HelpCircle
} from 'lucide-react';

import { Student, TimetableItem, AttendanceHistoryItem } from '@/types';
import { getSubstantiveTokens, matchInstructorStrict } from '@/lib/utils';
import { calculateMaxAllowedAbsences } from '@/lib/attendance/attendanceEvaluator';
import { EligibilityTab, SemesterRoadmapTab, AddStudentToCourseModal, GradeSheetTab, ClassroomQrProjector, groupAndSortByMajor, RollCallTab, AttendanceHistoryTab, SessionCustomModal } from '@/components/attendance';
import { CourseEnrollment } from '@/types';
import { getAuthUser, isAdminOrOfficer, clearAuthSession, saveAuthSession } from '@/lib/auth-client';
import { toSafeCsvCell } from '@/lib/security';
import UserProfileModal from '@/components/UserProfileModal';

export default function AttendancePage() {
  const [activeMode, setActiveMode] = useState<'ROLL_CALL' | 'ROADMAP' | 'QR_CODE' | 'ELIGIBILITY' | 'GRADE_SHEET' | 'HISTORY'>('ROLL_CALL');
  
  // Data states
  const [timetables, setTimetables] = useState<TimetableItem[]>([]);
  const [instructors, setInstructors] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [customEnrollments, setCustomEnrollments] = useState<CourseEnrollment[]>([]);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth & Current Instructor State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Instructor & Course Selection
  const [selectedInstructor, setSelectedInstructor] = useState<string>('ALL');
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [recordedBy, setRecordedBy] = useState<string>('');

  // ─────────────────────────────────────────────────────────────
  // Session Customization States (Date / Time / Room / Co-instructors / TAs)
  // ─────────────────────────────────────────────────────────────
  const [sessionCustom, setSessionCustom] = useState<{
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
  }>({
    sessionNumber: 1,
    sessionType: 'NORMAL',
    date: new Date().toISOString().substring(0, 10),
    startTime: '09:00',
    endTime: '12:00',
    room: 'C301',
    leadInstructor: '',
    coInstructors: [],
    customCoInstructorText: '',
    sessionTopic: '',
    note: '',
    isCustomized: false,
  });
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [coInstructorSearch, setCoInstructorSearch] = useState<string>('');

  // Attendance state: studentCode -> status
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE'>>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Student filter mode
  const [showOnlyTargetYear, setShowOnlyTargetYear] = useState(true);
  // Student program filter: 'AUTO' (automatic by course) | 'ENGLISH' | 'THAI' | 'ALL'
  const [studentProgramFilter, setStudentProgramFilter] = useState<'AUTO' | 'ENGLISH' | 'THAI' | 'ALL'>('AUTO');

  // ─────────────────────────────────────────────────────────────
  // Exam Eligibility States & Settings
  // ─────────────────────────────────────────────────────────────
  const [semesterTotalSessions, setSemesterTotalSessions] = useState<number>(16);
  const [minAttendancePercent, setMinAttendancePercent] = useState<number>(80);
  const [lateToAbsentRatio, setLateToAbsentRatio] = useState<number>(3);
  const [includeLeaveAsExcused, setIncludeLeaveAsExcused] = useState<boolean>(true);
  const [eligibilitySearch, setEligibilitySearch] = useState<string>('');
  const [eligibilityStatusFilter, setEligibilityStatusFilter] = useState<'ALL' | 'ELIGIBLE' | 'WARNING' | 'INELIGIBLE'>('ALL');
  const [showEligibilitySettings, setShowEligibilitySettings] = useState<boolean>(false);

  // Load User from LocalStorage or API on mount
  useEffect(() => {
    try {
      const u = getAuthUser();
      if (u) {
        setCurrentUser(u);
        setRecordedBy(u.name);
      } else {
        fetch('/api/auth')
          .then((r) => r.json())
          .then((d) => {
            if (d.authenticated && d.user) {
              setCurrentUser(d.user);
              setRecordedBy(d.user.name);
              localStorage.setItem('mcu_current_user', JSON.stringify(d.user));
            }
          })
          .catch(() => {});
      }
    } catch (e) {}
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (e) {}
    clearAuthSession();
    setCurrentUser(null);
    setSelectedInstructor('ALL');
    setSelectedCourseCode('');
    setRecordedBy('');
  };

  // Load initial data
  useEffect(() => {
    Promise.all([
      fetch('/api/timetables').then((res) => res.json()),
      fetch('/api/timetables?action=instructors').then((res) => res.json()),
      fetch('/api/students').then((res) => res.json()),
      fetch('/api/attendance').then((res) => res.json()),
      fetch('/api/enrollments').then((res) => res.json()),
    ])
      .then(([ttRes, instRes, stuRes, attRes, enrRes]) => {
        if (ttRes.success) {
          const list: TimetableItem[] = ttRes.data;
          setTimetables(list);
        }
        if (instRes.success) setInstructors(instRes.data);
        if (stuRes.success) setStudents(stuRes.data);
        if (attRes.success) setHistoryRecords(attRes.data);
        if (enrRes?.success) setCustomEnrollments(enrRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Role Checks
  const isAdmin = isAdminOrOfficer(currentUser);
  const isTeacher = Boolean(currentUser && !isAdmin);

  // Helper to detect English/Inter course
  const checkIsEnglishCourse = (c: TimetableItem) => {
    const tt = c.timetableTitle || '';
    const cn = c.courseName || '';
    return (
      (c as any).programType === 'ENGLISH' ||
      (c as any).programType === 'INTERNATIONAL' ||
      /ภาษาอังกฤษ|inter|eng|english|นานาชาติ/i.test(tt) ||
      /^[A-Za-z0-9\s:,\-\(\)\/\.\*]+$/.test(cn.trim())
    );
  };

  // Helper to format dayOfWeek number into readable Thai/English day label
  const formatDayLabel = (dayOfWeek?: number, isEn?: boolean) => {
    const mapTh: Record<number, string> = {
      1: 'จันทร์',
      2: 'อังคาร',
      3: 'พุธ',
      4: 'พฤหัสบดี',
      5: 'ศุกร์',
      6: 'เสาร์',
      7: 'อาทิตย์',
    };
    const mapEn: Record<number, string> = {
      1: 'Mon',
      2: 'Tue',
      3: 'Wed',
      4: 'Thu',
      5: 'Fri',
      6: 'Sat',
      7: 'Sun',
    };
    if (!dayOfWeek) return '-';
    return (isEn ? mapEn[dayOfWeek] : mapTh[dayOfWeek]) || String(dayOfWeek);
  };

  // Available courses strictly filtered for teacher & deduplicated across shared major timetables
  const availableCourses = useMemo(() => {
    const rawMatched = isTeacher
      ? timetables.filter((t) => matchInstructorStrict(currentUser, t.instructor))
      : selectedInstructor === 'ALL'
      ? timetables
      : timetables.filter((t) => t.instructor?.toLowerCase().includes(selectedInstructor.toLowerCase()));

    const extractMajorFromTitle = (title?: string): string => {
      if (!title) return '';
      if (title.includes('พระพุทธศาสนา')) return 'พระพุทธศาสนา';
      if (title.includes('วิปัสสนาภาวนา')) return 'วิปัสสนาภาวนา';
      if (title.includes('ศาสนาและปรัชญา')) return 'ศาสนาและปรัชญา';
      if (title.includes('บาลีสันสกฤต')) return 'บาลีสันสกฤต';
      return '';
    };

    const groupedMap = new Map<
      string,
      TimetableItem & { sectionKey: string; sharedMajors: string[] }
    >();

    for (const item of rawMatched) {
      const isEn = checkIsEnglishCourse(item);
      const normCode = (item.courseCode || '').trim().toUpperCase();
      const normStart = (item.startTime || '').trim();
      // Distinct Teaching Section Key: courseCode + Program (EN/TH) + YearLevel + DayOfWeek + StartTime
      const sectionKey = `${normCode}__${isEn ? 'EN' : 'TH'}__Y${item.yearLevel || 1}__D${item.dayOfWeek || 1}__T${normStart}`;
      const maj = extractMajorFromTitle(item.timetableTitle);

      const existing = groupedMap.get(sectionKey);
      if (!existing) {
        groupedMap.set(sectionKey, {
          ...item,
          sectionKey,
          sharedMajors: maj ? [maj] : [],
        });
      } else {
        if (maj && !existing.sharedMajors.includes(maj)) {
          existing.sharedMajors.push(maj);
        }
        // Keep the fuller instructor string if one timetable entry has more complete co-instructor names
        if ((item.instructor || '').length > (existing.instructor || '').length) {
          existing.instructor = item.instructor;
        }
      }
    }

    return Array.from(groupedMap.values());
  }, [timetables, currentUser, isTeacher, selectedInstructor]);

  // Current selected course details (matches by unique sectionKey first, then falls back to courseCode)
  const currentCourse = useMemo(() => {
    return (
      availableCourses.find(
        (t) => (t as any).sectionKey === selectedCourseCode || t.courseCode === selectedCourseCode
      ) || availableCourses[0]
    );
  }, [availableCourses, selectedCourseCode]);

  // Auto-sync selected course when availableCourses changes
  useEffect(() => {
    if (availableCourses.length > 0) {
      const match = availableCourses.find(
        (c) => (c as any).sectionKey === selectedCourseCode || c.courseCode === selectedCourseCode
      );
      if (!match) {
        const first = availableCourses[0];
        setSelectedCourseCode((first as any).sectionKey || first.courseCode);
        setRecordedBy(currentUser ? currentUser.name : (first.instructor || 'อาจารย์ประจำวิชา'));
      }
    } else {
      setSelectedCourseCode('');
    }
  }, [availableCourses, selectedCourseCode, currentUser]);

  // ─────────────────────────────────────────────────────────────
  // 16-WEEK SEMESTER ROADMAP & FAST NEXT-SESSION PROVISIONING
  // ─────────────────────────────────────────────────────────────
  interface SemesterSessionItem {
    sessionNumber: number;
    date: string;
    dateFormattedTh: string;
    dayNameTh: string;
    startTime: string;
    endTime: string;
    room: string;
    status: 'COMPLETED' | 'NEXT_UP' | 'UPCOMING';
    sessionType: 'NORMAL' | 'MAKEUP' | 'SPECIAL' | 'EXAM';
    stats?: {
      totalStudents: number;
      present: number;
      late: number;
      absent: number;
      leave: number;
      attendancePercent: number;
      recordedBy?: string;
    };
  }

  const semesterRoadmapSessions = useMemo<SemesterSessionItem[]>(() => {
    if (!currentCourse) return [];

    const recordsByDate = new Map<string, AttendanceHistoryItem[]>();
    historyRecords.forEach((r) => {
      if (r.courseCode === currentCourse.courseCode) {
        if (!recordsByDate.has(r.date)) {
          recordsByDate.set(r.date, []);
        }
        recordsByDate.get(r.date)!.push(r);
      }
    });

    const sortedRecordedDates = Array.from(recordsByDate.keys()).sort();

    let startDate = new Date('2026-06-15T00:00:00');
    if (sortedRecordedDates.length > 0) {
      const firstRec = new Date(sortedRecordedDates[0] + 'T00:00:00');
      if (!isNaN(firstRec.getTime())) {
        startDate = firstRec;
      }
    }

    const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const thaiDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

    const sessions: SemesterSessionItem[] = [];
    let foundNextUp = false;

    for (let i = 0; i < semesterTotalSessions; i++) {
      const sessionNum = i + 1;
      let sDate = new Date(startDate);
      sDate.setDate(startDate.getDate() + (i * 7));

      let sessionDateStr = sDate.toISOString().substring(0, 10);
      if (i < sortedRecordedDates.length) {
        sessionDateStr = sortedRecordedDates[i];
        sDate = new Date(sessionDateStr + 'T00:00:00');
      }

      const dateFormattedTh = `${sDate.getDate()} ${thaiMonthsShort[sDate.getMonth()]} ${(sDate.getFullYear() + 543).toString().substring(2)}`;
      const dayNameTh = thaiDays[sDate.getDay()];

      const recordsForThis = recordsByDate.get(sessionDateStr);

      if (recordsForThis && recordsForThis.length > 0) {
        const present = recordsForThis.filter((r) => r.status === 'PRESENT').length;
        const late = recordsForThis.filter((r) => r.status === 'LATE').length;
        const absent = recordsForThis.filter((r) => r.status === 'ABSENT').length;
        const leave = recordsForThis.filter((r) => r.status === 'LEAVE').length;
        const totalStudents = recordsForThis.length;
        const attendancePercent = totalStudents > 0 ? Math.round(((present + late) / totalStudents) * 100) : 0;

        sessions.push({
          sessionNumber: sessionNum,
          date: sessionDateStr,
          dateFormattedTh,
          dayNameTh,
          startTime: currentCourse.startTime || '09:00',
          endTime: currentCourse.endTime || '12:00',
          room: currentCourse.room || 'C301',
          status: 'COMPLETED',
          sessionType: 'NORMAL',
          stats: {
            totalStudents,
            present,
            late,
            absent,
            leave,
            attendancePercent,
            recordedBy: recordsForThis[0].recordedBy,
          },
        });
      } else {
        let status: 'NEXT_UP' | 'UPCOMING' = 'UPCOMING';
        if (!foundNextUp) {
          status = 'NEXT_UP';
          foundNextUp = true;
        }

        sessions.push({
          sessionNumber: sessionNum,
          date: sessionDateStr,
          dateFormattedTh,
          dayNameTh,
          startTime: currentCourse.startTime || '09:00',
          endTime: currentCourse.endTime || '12:00',
          room: currentCourse.room || 'C301',
          status,
          sessionType: 'NORMAL',
        });
      }
    }

    return sessions;
  }, [currentCourse, historyRecords, semesterTotalSessions]);

  const nextUpcomingSession = useMemo(() => {
    return semesterRoadmapSessions.find((s) => s.status === 'NEXT_UP') || null;
  }, [semesterRoadmapSessions]);

  const completedSessionsCount = useMemo(() => {
    return semesterRoadmapSessions.filter((s) => s.status === 'COMPLETED').length;
  }, [semesterRoadmapSessions]);

  const handleFastOpenSession = (sess: SemesterSessionItem) => {
    setDate(sess.date);
    setSessionCustom((prev) => ({
      ...prev,
      sessionNumber: sess.sessionNumber,
      date: sess.date,
      startTime: sess.startTime,
      endTime: sess.endTime,
      room: sess.room,
      sessionType: sess.sessionType || 'NORMAL',
      leadInstructor: currentUser ? currentUser.name : (currentCourse ? currentCourse.instructor || '' : ''),
      isCustomized: true,
    }));
    setActiveMode('ROLL_CALL');
    setSavedSuccess(`🚀 เปิดระบบเช็คชื่อคาบที่ ${sess.sessionNumber} (${sess.dayNameTh}ที่ ${sess.dateFormattedTh}) เรียบร้อยแล้ว!`);

    setTimeout(() => {
      const el = document.getElementById('roll-call-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  // Sync session details when currentCourse changes (unless customized)
  useEffect(() => {
    if (currentCourse) {
      setSessionCustom((prev) => {
        if (prev.isCustomized) return prev;
        const distinctDates = new Set(
          historyRecords
            .filter((h) => h.courseCode === currentCourse.courseCode)
            .map((h) => h.date)
        );
        const nextSessionNum = Math.min(16, distinctDates.size + 1);

        return {
          ...prev,
          sessionNumber: nextSessionNum,
          date: date,
          startTime: currentCourse.startTime || '09:00',
          endTime: currentCourse.endTime || '12:00',
          room: currentCourse.room || 'C301',
          leadInstructor: currentUser ? currentUser.name : (currentCourse.instructor || ''),
          isCustomized: false,
        };
      });
    }
  }, [currentCourse, currentUser, historyRecords, date]);

  const handleCourseChange = (keyOrCode: string) => {
    const found = availableCourses.find(
      (t) => (t as any).sectionKey === keyOrCode || t.courseCode === keyOrCode
    );
    if (found) {
      setSelectedCourseCode((found as any).sectionKey || found.courseCode);
      setRecordedBy(currentUser ? currentUser.name : (found.instructor || 'อาจารย์ประจำวิชา'));
      setStudentProgramFilter('AUTO');
    }
  };

  // Determine if selected course is an International / English Program course
  const isInterCourse = useMemo(() => {
    if (!currentCourse) return false;
    const tt = currentCourse.timetableTitle || '';
    const cn = currentCourse.courseName || '';
    const isEnTitle = /ภาษาอังกฤษ|inter|eng|english|นานาชาติ/i.test(tt);
    const isEnName = /^[A-Za-z0-9\s:,\-\(\)\/\.]+$/.test(cn.trim());
    return (currentCourse as any).programType === 'ENGLISH' || isEnTitle || isEnName;
  }, [currentCourse]);

  // Active program filter mode
  const activeProgramMode = useMemo<'ENGLISH' | 'THAI' | 'ALL'>(() => {
    if (studentProgramFilter === 'AUTO') {
      return isInterCourse ? 'ENGLISH' : 'THAI';
    }
    return studentProgramFilter;
  }, [studentProgramFilter, isInterCourse]);

  // Custom enrollments for currently selected course
  const currentCourseEnrollments = useMemo(() => {
    if (!currentCourse) return [];
    const clean = currentCourse.courseCode.toLowerCase().trim();
    return customEnrollments.filter((e) => e.courseCode.toLowerCase().trim() === clean);
  }, [customEnrollments, currentCourse]);

  const customEnrolledCodeSet = useMemo(() => {
    return new Set(currentCourseEnrollments.map((e) => e.studentCode.toLowerCase().trim()));
  }, [currentCourseEnrollments]);

  const handleRemoveEnrollment = async (studentCode: string, studentName: string) => {
    if (!currentCourse) return;
    const confirmMsg = `ยืนยันการนำนิสิต "${studentName}" (${studentCode}) ออกจากห้องเรียนวิชา ${currentCourse.courseCode} หรือไม่?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          courseCode: currentCourse.courseCode,
          studentCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomEnrollments((prev) =>
          prev.filter(
            (e) =>
              !(
                e.courseCode.toLowerCase() === currentCourse.courseCode.toLowerCase() &&
                e.studentCode.toLowerCase() === studentCode.toLowerCase()
              )
          )
        );
        alert(`นำนิสิตออกจากห้องเรียนวิชา ${currentCourse.courseCode} เรียบร้อยแล้ว`);
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการนำออก');
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    }
  };

  // Determine students to display: filter by target year and program type
  const targetYear = currentCourse?.yearLevel || 1;

  // Counts for the program filter badges
  const { yearAllCount, yearEnglishCount, yearThaiCount } = useMemo(() => {
    if (!currentCourse) return { yearAllCount: 0, yearEnglishCount: 0, yearThaiCount: 0 };
    const baseList = showOnlyTargetYear
      ? students.filter((s) => s.yearLevel === targetYear)
      : students;

    const engCount = baseList.filter((s) => {
      const p = (s.programType || '').toUpperCase();
      const isThaiNat = s.nationality === 'ไทย' || s.nationality === 'Thai';
      return p === 'ENGLISH' || p === 'INTER' || (!isThaiNat && p !== 'THAI');
    }).length;

    const thaiCount = baseList.filter((s) => {
      const p = (s.programType || '').toUpperCase();
      return p === 'THAI' || p === '' || !s.programType;
    }).length;

    return {
      yearAllCount: baseList.length,
      yearEnglishCount: engCount,
      yearThaiCount: thaiCount,
    };
  }, [students, showOnlyTargetYear, targetYear, currentCourse]);

  const { groupedTargetSections, targetStudents } = useMemo(() => {
    if (!currentCourse) return { groupedTargetSections: [], targetStudents: [] };

    // 1. Year level filter
    let list = showOnlyTargetYear
      ? students.filter((s) => s.yearLevel === targetYear)
      : [...students];

    // 2. Program type filter (แยกนิสิตภาคภาษาไทย และ ภาคภาษาอังกฤษ)
    if (activeProgramMode === 'ENGLISH') {
      list = list.filter((s) => {
        const p = (s.programType || '').toUpperCase();
        const isThaiNat = s.nationality === 'ไทย' || s.nationality === 'Thai';
        return p === 'ENGLISH' || p === 'INTER' || (!isThaiNat && p !== 'THAI');
      });
    } else if (activeProgramMode === 'THAI') {
      list = list.filter((s) => {
        const p = (s.programType || '').toUpperCase();
        return p === 'THAI' || p === '' || !s.programType;
      });
    }

    // 3. Always include custom enrolled students (นิสิตเทียบโอน/เดินเรียนประจำวิชานี้)
    if (customEnrolledCodeSet.size > 0) {
      const existingCodes = new Set(list.map((s) => s.studentCode.toLowerCase().trim()));
      const extraStudents = students.filter((s) => {
        const code = s.studentCode.toLowerCase().trim();
        return customEnrolledCodeSet.has(code) && !existingCodes.has(code);
      });
      extraStudents.forEach((s) => existingCodes.add(s.studentCode.toLowerCase().trim()));

      // Fallback synthesis if a newly enrolled student is not yet in `students` array
      const fallbackEnrolledStudents: Student[] = [];
      if (currentCourse) {
        customEnrollments
          .filter(
            (e) =>
              e.courseCode.trim().toLowerCase() === currentCourse.courseCode.trim().toLowerCase() &&
              !existingCodes.has(e.studentCode.toLowerCase().trim())
          )
          .forEach((e) => {
            const majorMatch = (e.notes || '').match(/\[สาขาวิชา:\s*([^\]]+)\]/);
            const extractedMajor = majorMatch ? majorMatch[1].trim() : 'พระพุทธศาสนา';
            fallbackEnrolledStudents.push({
              studentCode: e.studentCode.trim(),
              title: '',
              firstName: e.studentName || e.studentCode,
              lastName: '',
              fullName: e.studentName || e.studentCode,
              major: extractedMajor,
              yearLevel: targetYear || 1,
              studyStatus: 'STUDYING',
              email: '',
              phoneNumber: '',
              programType: activeProgramMode === 'ENGLISH' ? 'ENGLISH' : 'THAI',
              nationality: activeProgramMode === 'ENGLISH' ? 'International' : 'ไทย',
            });
            existingCodes.add(e.studentCode.toLowerCase().trim());
          });
      }

      list = [...list, ...extraStudents, ...fallbackEnrolledStudents];
    }

    // 4. Group by Major (พระพุทธศาสนา -> วิปัสสนาภาวนา -> ศาสนาและปรัชญา -> บาลีสันสกฤต) & sort by studentCode ascending
    const { sections, flatSorted } = groupAndSortByMajor(list);
    return {
      groupedTargetSections: sections,
      targetStudents: flatSorted,
    };
  }, [students, showOnlyTargetYear, targetYear, currentCourse, activeProgramMode, customEnrolledCodeSet, customEnrollments]);

  // Initialize attendance map when student list changes
  useEffect(() => {
    if (targetStudents.length > 0) {
      const initialMap: Record<string, 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE'> = {};
      targetStudents.forEach((s) => {
        initialMap[s.studentCode] = attendanceMap[s.studentCode] || 'PRESENT';
      });
      setAttendanceMap(initialMap);
    }
  }, [selectedCourseCode, showOnlyTargetYear, targetYear, targetStudents]);

  const handleStatusChange = (code: string, status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE') => {
    setAttendanceMap((prev) => ({ ...prev, [code]: status }));
  };

  const setAllStatus = (status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE') => {
    const nextMap: Record<string, 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE'> = {};
    targetStudents.forEach((s) => {
      nextMap[s.studentCode] = status;
    });
    setAttendanceMap(nextMap);
  };

  // Live stats for roll call
  const total = targetStudents.length;
  const present = targetStudents.filter((s) => (attendanceMap[s.studentCode] || 'PRESENT') === 'PRESENT').length;
  const late = targetStudents.filter((s) => attendanceMap[s.studentCode] === 'LATE').length;
  const absent = targetStudents.filter((s) => attendanceMap[s.studentCode] === 'ABSENT').length;
  const leave = targetStudents.filter((s) => attendanceMap[s.studentCode] === 'LEAVE').length;
  const percent = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  // Filter History Records strictly for teacher
  const visibleHistoryRecords = useMemo(() => {
    if (isTeacher) {
      const myCourseCodes = new Set(availableCourses.map((c) => c.courseCode));
      return historyRecords.filter((h) => {
        const matchCourse = h.courseCode && myCourseCodes.has(h.courseCode);
        const matchRecorded = h.recordedBy && matchInstructorStrict(currentUser, h.recordedBy);
        return matchCourse || matchRecorded;
      });
    }
    return historyRecords;
  }, [historyRecords, isTeacher, availableCourses, currentUser]);

  // ─────────────────────────────────────────────────────────────
  // Exam Eligibility Calculation Engine
  // ─────────────────────────────────────────────────────────────
  const { eligibilityList, eligibilityStats, recordedSessionsCount, maxAllowedAbsences } = useMemo(() => {
    if (!currentCourse) {
      return {
        eligibilityList: [],
        eligibilityStats: { total: 0, eligible: 0, warning: 0, ineligible: 0 },
        recordedSessionsCount: 0,
        maxAllowedAbsences: 3,
      };
    }

    const courseRecords = historyRecords.filter((h) => h.courseCode === currentCourse.courseCode);
    const uniqueDates = Array.from(new Set(courseRecords.map((h) => h.date).filter(Boolean)));
    const sessionsRecorded = uniqueDates.length;

    // University regulation: Maximum allowed absences based on percentage requirement (e.g. 16 * 20% = 3 absences)
    const maxAbsences = calculateMaxAllowedAbsences(semesterTotalSessions, minAttendancePercent);

    const list = targetStudents.map((s) => {
      const sRecords = courseRecords.filter((r) => r.studentCode === s.studentCode);
      const sPresent = sRecords.filter((r) => r.status === 'PRESENT').length;
      const sLate = sRecords.filter((r) => r.status === 'LATE').length;
      const sLeave = sRecords.filter((r) => r.status === 'LEAVE').length;
      const sAbsent = sRecords.filter((r) => r.status === 'ABSENT').length;

      // Effective absences = Absent + floor(Late / 3)
      const effectiveAbsences = sAbsent + Math.floor(sLate / lateToAbsentRatio);
      const remainingAbsences = maxAbsences - effectiveAbsences;

      // Attended Score
      const attendedScore = sPresent + (sLate * 0.75) + (includeLeaveAsExcused ? sLeave : 0);

      // Percentage of class attended so far
      const attendedPercent = sessionsRecorded > 0
        ? Math.min(100, Math.round((attendedScore / sessionsRecorded) * 100))
        : 100;

      // Overall Semester Status
      let status: 'ELIGIBLE' | 'WARNING' | 'INELIGIBLE' = 'ELIGIBLE';
      let statusText = 'มีสิทธิ์สอบ';
      let reason = `อยู่ในเกณฑ์ (ยังขาดได้อีก ${Math.max(0, remainingAbsences)} ครั้ง)`;

      if (effectiveAbsences > maxAbsences) {
        status = 'INELIGIBLE';
        statusText = 'หมดสิทธิ์สอบ';
        reason = `ขาดเรียน ${effectiveAbsences} ครั้ง (เกินเกณฑ์ ${maxAbsences} ครั้ง)`;
      } else if (remainingAbsences === 0 || attendedPercent < minAttendancePercent) {
        status = 'WARNING';
        statusText = 'เฝ้าระวัง/เสี่ยงหมดสิทธิ์';
        reason = remainingAbsences === 0
          ? `ใช้โควตาขาดครบ ${maxAbsences} ครั้งแล้ว (ห้ามขาดอีก)`
          : `เวลาเรียนปัจจุบัน ${attendedPercent}% (ต่ำกว่าเกณฑ์ ${minAttendancePercent}%)`;
      }

      return {
        studentCode: s.studentCode,
        studentName: s.fullName || `${s.title || ''} ${s.firstName} ${s.lastName}`,
        major: s.major,
        yearLevel: s.yearLevel,
        present: sPresent,
        late: sLate,
        leave: sLeave,
        absent: sAbsent,
        effectiveAbsences,
        attendedScore,
        attendedPercent,
        remainingAbsences,
        status,
        statusText,
        reason,
      };
    });

    const eligible = list.filter((i) => i.status === 'ELIGIBLE').length;
    const warning = list.filter((i) => i.status === 'WARNING').length;
    const ineligible = list.filter((i) => i.status === 'INELIGIBLE').length;

    return {
      eligibilityList: list,
      eligibilityStats: {
        total: list.length,
        eligible,
        warning,
        ineligible,
      },
      recordedSessionsCount: sessionsRecorded,
      maxAllowedAbsences: maxAbsences,
    };
  }, [
    currentCourse,
    historyRecords,
    targetStudents,
    semesterTotalSessions,
    minAttendancePercent,
    lateToAbsentRatio,
    includeLeaveAsExcused,
  ]);

  // Filtered list for Exam Eligibility view
  const filteredEligibilityList = useMemo(() => {
    return eligibilityList.filter((item) => {
      if (eligibilityStatusFilter !== 'ALL' && item.status !== eligibilityStatusFilter) {
        return false;
      }
      if (eligibilitySearch.trim()) {
        const q = eligibilitySearch.toLowerCase().trim();
        const matchCode = item.studentCode.toLowerCase().includes(q);
        const matchName = item.studentName.toLowerCase().includes(q);
        const matchMajor = item.major?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchMajor) return false;
      }
      return true;
    });
  }, [eligibilityList, eligibilityStatusFilter, eligibilitySearch]);

  // Export Eligibility Roster to CSV/Excel
  const handleExportEligibilityCsv = () => {
    if (!currentCourse || eligibilityList.length === 0) return;
    const headers = [
      'ลำดับ',
      'รหัสนิสิต',
      'ชื่อ-นามสกุล',
      'สาขาวิชา',
      'ชั้นปี',
      'มา(ครั้ง)',
      'สาย(ครั้ง)',
      'ลา(ครั้ง)',
      'ขาด(ครั้ง)',
      'ขาดสุทธิ(ครั้ง)',
      'เวลาเรียนจริง(%)',
      'โควตาขาดที่เหลือ(ครั้ง)',
      'ผลการประเมินสิทธิ์สอบ',
      'เหตุผล/เงื่อนไข',
    ];

    const rows = eligibilityList.map((item, idx) => [
      idx + 1,
      toSafeCsvCell(item.studentCode),
      toSafeCsvCell(item.studentName),
      toSafeCsvCell(item.major || '-'),
      item.yearLevel || 1,
      item.present,
      item.late,
      item.leave,
      item.absent,
      item.effectiveAbsences,
      `${item.attendedPercent}%`,
      item.remainingAbsences >= 0 ? item.remainingAbsences : 0,
      toSafeCsvCell(item.statusText),
      toSafeCsvCell(item.reason),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Exam_Eligibility_${currentCourse.courseCode.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulate Attendance Data for Testing
  const handleSimulateAttendance = async () => {
    if (!currentCourse) return;
    if (
      !confirm(
        `ต้องการจำลองการบันทึกเวลาเรียน 12 คาบ สำหรับวิชา ${currentCourse.courseCode} (${currentCourse.courseName}) เพื่อทดสอบระบบคำนวณสิทธิ์สอบใช่หรือไม่?`
      )
    )
      return;

    const baseDates = [
      '2026-06-15', '2026-06-22', '2026-06-29', '2026-07-06',
      '2026-07-13', '2026-07-20', '2026-07-27', '2026-08-03',
      '2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31'
    ];

    const records: any[] = [];
    baseDates.forEach((dt, dateIdx) => {
      targetStudents.forEach((s, sIdx) => {
        let status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' = 'PRESENT';
        if (sIdx % 17 === 0 && dateIdx % 2 === 0) {
          status = 'ABSENT';
        } else if (sIdx % 11 === 0 && (dateIdx === 2 || dateIdx === 5 || dateIdx === 9)) {
          status = 'ABSENT';
        } else if (sIdx % 7 === 0 && dateIdx % 3 === 0) {
          status = 'LATE';
        } else if (sIdx % 13 === 0 && dateIdx === 4) {
          status = 'LEAVE';
        }

        records.push({
          courseCode: currentCourse.courseCode,
          courseName: currentCourse.courseName,
          date: dt,
          studentCode: s.studentCode,
          studentName: s.fullName || `${s.title || ''} ${s.firstName} ${s.lastName}`,
          status,
          recordedBy: currentUser ? currentUser.name : (currentCourse.instructor || 'อาจารย์ผู้สอน'),
        });
      });
    });

    try {
      setSaving(true);
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ จำลองบันทึกข้อมูลเวลาเรียนสำเร็จ ${data.count} รายการ (12 สัปดาห์) ระบบได้คำนวณสิทธิ์สอบให้นิสิตทุกคนเรียบร้อยแล้ว!`);
        const refRes = await fetch('/api/attendance');
        const refData = await refRes.json();
        if (refData.success) setHistoryRecords(refData.data);
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Submit attendance to Google Sheets & local cache
  const handleSave = async () => {
    if (!currentCourse) {
      alert('กรุณาเลือกรายวิชาที่สอนก่อนบันทึก');
      return;
    }
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบอาจารย์ผู้สอนก่อนทำการบันทึกข้อมูล');
      return;
    }

    setSaving(true);
    setSavedSuccess(null);

    try {
      const allCoInstructors = [
        ...sessionCustom.coInstructors,
        ...(sessionCustom.customCoInstructorText ? sessionCustom.customCoInstructorText.split(',').map((s) => s.trim()) : [])
      ].filter(Boolean);

      const lead = sessionCustom.leadInstructor || (currentUser ? currentUser.name : (recordedBy || 'อาจารย์ประจำวิชา'));
      const fullRecordedBy = allCoInstructors.length > 0
        ? `${lead} [ร่วมกับ: ${allCoInstructors.join(', ')}]`
        : lead;

      const typeLabel = sessionCustom.sessionType === 'MAKEUP' ? 'สอนชดเชย' : sessionCustom.sessionType === 'SPECIAL' ? 'บรรยายพิเศษ' : sessionCustom.sessionType === 'EXAM' ? 'สอบเก็บคะแนน' : 'คาบปกติ';
      const sessionNote = [
        `คาบที่ ${sessionCustom.sessionNumber} (${typeLabel})`,
        sessionCustom.sessionTopic ? `หัวข้อ: ${sessionCustom.sessionTopic}` : null,
        `ห้อง: ${sessionCustom.room} (${sessionCustom.startTime}-${sessionCustom.endTime} น.)`,
        sessionCustom.note ? `บันทึก: ${sessionCustom.note}` : null
      ].filter(Boolean).join(' | ');

      const targetDate = sessionCustom.date || date;

      const records = targetStudents.map((s) => ({
        courseCode: currentCourse.courseCode,
        courseName: currentCourse.courseName,
        date: targetDate,
        studentCode: s.studentCode,
        studentName: s.fullName || `${s.title || ''} ${s.firstName} ${s.lastName}`,
        status: attendanceMap[s.studentCode] || 'PRESENT',
        recordedBy: fullRecordedBy,
        note: sessionNote,
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });

      const resData = await res.json();
      if (resData.success) {
        setSavedSuccess(`บันทึกการเช็คชื่อ ${resData.count} รายการ ส่งตรงเข้า Google Sheets (แท็บ Attendance) สำเร็จเรียบร้อย!`);
        fetch('/api/attendance')
          .then((r) => r.json())
          .then((d) => d.success && setHistoryRecords(d.data));
      } else {
        alert('เกิดข้อผิดพลาด: ' + resData.error);
      }
    } catch (err: any) {
      alert('บันทึกล้มเหลว: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

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

      {/* Page Header (Hidden on Print) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-emerald-600" />
            ระบบตรวจเข้าเรียน & สรุปสิทธิ์สอบปลายภาค
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เช็คชื่อเข้าชั้นเรียนและประเมินสิทธิ์สอบไล่ตามเกณฑ์เวลาเรียน 80% ตลอดทั้งภาคการศึกษา
          </p>
        </div>

        {/* Mode switcher tabs (2 แถว / 2 Rows Layout: แสดงครบทุกแท็บ ไม่ต้องเลื่อนสกอร์บาร์) */}
        <div className="w-full xl:w-auto flex flex-col gap-1.5 p-1.5 bg-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold shadow-2xs">
          {/* แถวที่ 1 (3 แท็บ): เช็คชื่อ, แผนผัง, สรุปสิทธิ์สอบ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveMode('ROLL_CALL')}
              className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl transition cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 ${
                activeMode === 'ROLL_CALL'
                  ? 'bg-white text-emerald-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>อาจารย์เช็คชื่อ (Roll-Call)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('ROADMAP')}
              className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl transition cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 ${
                activeMode === 'ROADMAP'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-700 hover:text-emerald-700 font-bold bg-white/70'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>แผนผัง 16 คาบ (Roadmap)</span>
              {nextUpcomingSession && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5 shrink-0" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('ELIGIBILITY')}
              className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl transition cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 ${
                activeMode === 'ELIGIBILITY'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-700 hover:text-emerald-700 font-bold bg-emerald-50/50 hover:bg-white/50'
              }`}
            >
              <Award className="w-4 h-4 shrink-0" />
              <span>สรุปสิทธิ์สอบ (Exam Eligibility)</span>
            </button>
          </div>

          {/* แถวที่ 2 (3 แท็บ): ใบกรอกคะแนน, QR ห้องเรียน, ประวัติ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveMode('GRADE_SHEET')}
              className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl transition cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 ${
                activeMode === 'GRADE_SHEET'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-indigo-800 hover:text-indigo-950 font-bold bg-indigo-50/80 border border-indigo-200/70 hover:bg-indigo-100/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>ใบกรอกคะแนนวัดผล (Grade Sheet)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('QR_CODE')}
              className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl transition cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 ${
                activeMode === 'QR_CODE'
                  ? 'bg-white text-emerald-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>เปิดจอ QR ห้องเรียน</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('HISTORY')}
              className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl transition cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 ${
                activeMode === 'HISTORY'
                  ? 'bg-white text-emerald-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <History className="w-4 h-4 text-slate-500 shrink-0" />
              <span>ประวัติการเช็คชื่อ ({visibleHistoryRecords.length})</span>
            </button>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-sm animate-in fade-in duration-200 print:hidden">
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
          AUTH STATUS BAR / LOGIN PROMPT (Hidden on Print)
         ───────────────────────────────────────────────────────────── */}
      <div className="print:hidden">
        {currentUser ? (
          <div
            className={`rounded-2xl p-4 sm:p-5 shadow-sm border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isAdmin
                ? 'bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white border-purple-800'
                : 'bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-800'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl backdrop-blur border flex items-center justify-center font-bold text-lg shrink-0 shadow-inner ${
                  isAdmin ? 'bg-purple-500/20 border-purple-400/30 text-purple-200' : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                }`}
              >
                {isAdmin ? '👑' : currentUser.name ? currentUser.name.charAt(0) : 'อ'}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                      isAdmin
                        ? 'bg-purple-500/30 text-purple-200 border-purple-400/30'
                        : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/30'
                    }`}
                  >
                    {isAdmin ? '👑 สิทธิ์ผู้ดูแลระบบ (Admin Mode)' : '🔒 สิทธิ์อาจารย์ผู้สอนประจำวิชา'}
                  </span>
                  <span className="text-xs text-white/70 font-mono">
                    {currentUser.email}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  ยินดีต้อนรับ: {currentUser.name}
                </h2>
                <p className="text-xs text-white/80">
                  {isAdmin
                    ? 'ผู้ดูแลระบบสามารถตรวจสอบและดูรายวิชาของอาจารย์ทุกท่านในคณะได้'
                    : `ระบบจำกัดการเข้าถึงเฉพาะรายวิชาที่ท่านรับผิดชอบบรรยายเท่านั้น (พบ ${availableCourses.length} รายวิชาในภาคเรียนนี้)`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-100 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 rounded-xl transition cursor-pointer shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>แก้ไขโปรไฟล์ & รหัสผ่าน</span>
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
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
          availableCourses={availableCourses as any}
          currentCourse={currentCourse as any}
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
            setHistoryRecords(allRecords as any);
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
