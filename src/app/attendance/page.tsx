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
import { EligibilityTab, SemesterRoadmapTab, AddStudentToCourseModal, GradeSheetTab, ClassroomQrProjector, groupAndSortByMajor } from '@/components/attendance';
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
    const maxAbsences = Math.max(1, Math.floor(semesterTotalSessions * (1 - minAttendancePercent / 100)));

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-emerald-600" />
            ระบบตรวจเข้าเรียน & สรุปสิทธิ์สอบปลายภาค
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เช็คชื่อเข้าชั้นเรียนและประเมินสิทธิ์สอบไล่ตามเกณฑ์เวลาเรียน 80% ตลอดทั้งภาคการศึกษา
          </p>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex flex-wrap p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto text-xs sm:text-sm font-semibold gap-1">
          <button
            onClick={() => setActiveMode('ROLL_CALL')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition cursor-pointer ${
              activeMode === 'ROLL_CALL'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            อาจารย์เช็คชื่อ (Roll-Call)
          </button>
          <button
            onClick={() => setActiveMode('ROADMAP')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'ROADMAP'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-700 hover:text-emerald-700 font-bold bg-white/70'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>แผนผัง 16 คาบ (Roadmap)</span>
            {nextUpcomingSession && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5" />
            )}
          </button>
          <button
            onClick={() => setActiveMode('ELIGIBILITY')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'ELIGIBILITY'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-700 hover:text-emerald-700 font-bold bg-emerald-50/50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>สรุปสิทธิ์สอบ (Exam Eligibility)</span>
          </button>
          <button
            onClick={() => setActiveMode('GRADE_SHEET')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'GRADE_SHEET'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'text-indigo-800 hover:text-indigo-950 font-bold bg-indigo-50/80 border border-indigo-200/70'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ใบกรอกคะแนนวัดผล (Grade Sheet)</span>
          </button>
          <button
            onClick={() => setActiveMode('QR_CODE')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition cursor-pointer ${
              activeMode === 'QR_CODE'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เปิดจอ QR ห้องเรียน
          </button>
          <button
            onClick={() => setActiveMode('HISTORY')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition cursor-pointer ${
              activeMode === 'HISTORY'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ประวัติการเช็คชื่อ ({visibleHistoryRecords.length})
          </button>
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
        <div className="space-y-6 print:hidden">
          {!currentUser ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <Lock className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">
                เข้าสู่ระบบอาจารย์ผู้สอนเพื่อเริ่มต้นเช็คชื่อ
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                เพื่อความปลอดภัยของข้อมูลและการประกันคุณภาพการศึกษา ระบบจะแสดงเฉพาะรายวิชาและบัญชีรายชื่อนิสิตตามรายวิชาที่ท่านรับผิดชอบบรรยายเท่านั้น
              </p>
            </div>
          ) : (
            <>
              {/* ─────────────────────────────────────────────────────────────
                  FAST ACTION BAR: 16-WEEK PROGRESS & 1-CLICK NEXT SESSION
                 ───────────────────────────────────────────────────────────── */}
              {currentCourse && (
                <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-emerald-700/40 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold">
                      <Calendar className="w-4 h-4 text-emerald-300" />
                      <span>แผนผังการเรียนการสอนภาคเรียนที่ 1/2569 (เป้าหมาย {semesterTotalSessions} คาบ)</span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span className="font-mono text-emerald-300">{currentCourse.courseCode}</span>
                      <span>{currentCourse.courseName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
                      <span>
                        สอนแล้ว <strong className="text-white font-bold">{completedSessionsCount}</strong> / {semesterTotalSessions} คาบ ({Math.round((completedSessionsCount / semesterTotalSessions) * 100)}%)
                      </span>
                      <div className="w-28 sm:w-36 bg-slate-700 rounded-full h-2 overflow-hidden border border-slate-600">
                        <div
                          className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (completedSessionsCount / semesterTotalSessions) * 100)}%` }}
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
                        <span>🚀 เปิดเช็คชื่อคาบถัดไป (คาบที่ {nextUpcomingSession.sessionNumber} — {nextUpcomingSession.dateFormattedTh})</span>
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

              {/* Filter Panel: Lecturer & Course Selector */}
              <div id="roll-call-section" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. อาจารย์ผู้สอน */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
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
                          const matched = timetables.filter((t) => inst === 'ALL' || t.instructor?.includes(inst));
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

                {/* ─────────────────────────────────────────────────────────────
                    COURSE CARDS GRID (การ์ดรายวิชาที่รับผิดชอบสอน)
                   ───────────────────────────────────────────────────────────── */}
                {availableCourses.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span>การ์ดรายวิชาที่รับผิดชอบสอน ({availableCourses.length} วิชา) — คลิกการ์ดเพื่อสลับวิชาได้ทันที:</span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        แยกสีตามหลักสูตรภาษาไทย (เขียว) และหลักสูตรนานาชาติ Inter/EN (คราม)
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
                            onClick={() => handleCourseChange(sKey)}
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
                              <span className="font-bold shrink-0 ml-1 truncate max-w-[140px]" title={c.room || '-'}>
                                🚪 {c.room || '-'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    ENHANCED SESSION BANNER & CUSTOMIZATION CONTROLS
                   ───────────────────────────────────────────────────────────── */}
                {currentCourse && (() => {
                  const isEn = /inter|eng|english|นานาชาติ/i.test(currentCourse.timetableTitle || '') || /^[A-Za-z0-9\s:,-]+$/.test(currentCourse.courseName);
                  const allCo = [
                    ...sessionCustom.coInstructors,
                    ...(sessionCustom.customCoInstructorText ? sessionCustom.customCoInstructorText.split(',').map((s) => s.trim()) : [])
                  ].filter(Boolean);

                  const sessionTypeConfig = {
                    NORMAL: { label: 'คาบเรียนปกติ', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                    MAKEUP: { label: 'คาบสอนชดเชย', color: 'bg-amber-100 text-amber-800 border-amber-300' },
                    SPECIAL: { label: 'บรรยายพิเศษ', color: 'bg-purple-100 text-purple-800 border-purple-300' },
                    EXAM: { label: 'สอบย่อย/เก็บคะแนน', color: 'bg-rose-100 text-rose-800 border-rose-300' },
                  }[sessionCustom.sessionType] || { label: 'คาบเรียนปกติ', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };

                  return (
                    <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-emerald-50/20 p-4 shadow-sm space-y-3">
                      {/* Top Header Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200/70">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${isEn ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                            {isEn ? '🌐 หลักสูตรนานาชาติ (Inter/EN)' : '🇹🇭 หลักสูตรภาษาไทย (Thai)'}
                          </span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {currentCourse.courseCode}
                          </span>
                          <span className="font-bold text-slate-800 text-sm">
                            {currentCourse.courseName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                            ปี {currentCourse.yearLevel}
                          </span>

                          {/* Session Number & Type Badge */}
                          <div className="flex items-center gap-1.5 ml-1">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-900 text-white shadow-xs">
                              คาบที่ {sessionCustom.sessionNumber}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${sessionTypeConfig.color}`}>
                              {sessionTypeConfig.label}
                            </span>
                            {sessionCustom.isCustomized && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                ปรับแต่งแล้ว
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Button to Open Session Customization Modal */}
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            type="button"
                            onClick={() => setShowSessionModal(true)}
                            className="px-3.5 py-1.5 bg-white hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                            title="ปรับแต่ง วันที่ / เวลา / ห้องเรียน / เลือกอาจารย์ผู้สอนร่วม-ผู้ช่วยสอน"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>⚙️ ปรับแต่งคาบเรียน (วัน/เวลา/ห้อง/ผู้ช่วยสอน)</span>
                          </button>

                          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setStudentProgramFilter('ENGLISH')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                activeProgramMode === 'ENGLISH'
                                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                              title="แสดงเฉพาะนิสิตหลักสูตรนานาชาติ (Inter / ภาคภาษาอังกฤษ)"
                            >
                              <span>🌐 ภาคอินเตอร์</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                activeProgramMode === 'ENGLISH' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {yearEnglishCount}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setStudentProgramFilter('THAI')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                activeProgramMode === 'THAI'
                                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                              title="แสดงเฉพาะนิสิตหลักสูตรภาษาไทย"
                            >
                              <span>🇹🇭 ภาคไทย</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                activeProgramMode === 'THAI' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {yearThaiCount}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setStudentProgramFilter('ALL')}
                              className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                                activeProgramMode === 'ALL'
                                  ? 'bg-slate-800 text-white font-bold shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                              title="แสดงรวมนิสิตทั้ง 2 ภาค (กรณีเรียนร่วมกัน)"
                            >
                              <span>👥 ทั้งหมด</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                activeProgramMode === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {yearAllCount}
                              </span>
                            </button>
                          </div>

                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 text-xs pl-2 border-l border-slate-200">
                            <input
                              type="checkbox"
                              checked={showOnlyTargetYear}
                              onChange={(e) => setShowOnlyTargetYear(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span>เฉพาะปี {currentCourse.yearLevel}</span>
                          </label>
                        </div>
                      </div>

                      {/* Session Parameters Display */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-slate-200/80">
                          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="text-[10px] text-slate-400 font-semibold">วันที่สอนจริง:</div>
                            <div className="font-bold text-slate-800">{sessionCustom.date || date}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-slate-200/80">
                          <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="text-[10px] text-slate-400 font-semibold">เวลาเรียน:</div>
                            <div className="font-bold text-slate-800">
                              {sessionCustom.startTime} - {sessionCustom.endTime} น.
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-slate-200/80">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="text-[10px] text-slate-400 font-semibold">ห้องเรียน / สถานที่:</div>
                            <div className="font-bold text-slate-800 truncate">{sessionCustom.room}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-slate-200/80">
                          <User className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <div className="text-[10px] text-slate-400 font-semibold">อาจารย์ผู้สอนหลัก:</div>
                            <div className="font-bold text-slate-800 truncate">
                              {sessionCustom.leadInstructor || currentCourse.instructor || 'อาจารย์ประจำวิชา'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Co-instructors / Teaching Assistants Banner if present */}
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

                      {/* Session Topic / Note if entered */}
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

                {/* Live Stats Bar */}
                {currentCourse && (
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="text-slate-500 mr-1">นิสิตทั้งหมด: {total} คน</span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        มา: {present}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        สาย: {late}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800">
                        ขาด: {absent}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                        ลา: {leave}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-white font-mono">
                        เข้าเรียน {percent}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAllStatus('PRESENT')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                      >
                        ✓ มาทุกคน
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllStatus('ABSENT')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer"
                      >
                        ✕ ขาดทุกคน
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Student Roster Table */}
              {currentCourse && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>บัญชีรายชื่อนิสิต ({targetStudents.length} รูป/คน)</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          activeProgramMode === 'ENGLISH'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : activeProgramMode === 'THAI'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {activeProgramMode === 'ENGLISH'
                            ? '🌐 นิสิตภาคภาษาอังกฤษ (Inter)'
                            : activeProgramMode === 'THAI'
                            ? '🇹🇭 นิสิตภาคภาษาไทย'
                            : '👥 แสดงรวมทั้ง 2 ภาค'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-normal">
                        ({currentCourse.courseCode} — {currentCourse.courseName})
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setIsAddStudentModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition shadow-2xs cursor-pointer"
                        title="เพิ่มรหัสนิสิต ชื่อนิสิต และสาขาวิชา สำหรับนิสิตเทียบโอน/เดินเรียน เข้าในบัญชีรายชื่อวิชานี้"
                      >
                        <UserPlus className="w-4 h-4 text-amber-700" />
                        <span>+ เพิ่มนิสิต (เทียบโอน/เดินเรียน)</span>
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving || targetStudents.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'กำลังบันทึกลง Google Sheets...' : 'บันทึกการเช็คชื่อ'}
                      </button>
                    </div>
                  </div>

                  {targetStudents.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm">
                      ไม่พบนิสิตในกลุ่มเรียนที่เลือก
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
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
                          {groupedTargetSections.map((sec) => (
                            <React.Fragment key={sec.groupKey}>
                              {/* Major Group Header Row */}
                              <tr className="bg-slate-100/90 border-y border-slate-200">
                                <td colSpan={5} className="px-6 py-2.5 text-xs font-extrabold text-slate-800">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${sec.meta.badgeColor}`}>
                                        {activeProgramMode === 'ENGLISH' ? sec.meta.labelEn : sec.meta.labelTh}
                                      </span>
                                      <span className="text-slate-500 font-normal text-[11px]">
                                        ({activeProgramMode === 'ENGLISH' ? sec.meta.labelTh : sec.meta.labelEn})
                                      </span>
                                    </div>
                                    <span className="text-slate-600 font-bold text-[11px]">
                                      จำนวน {sec.items.length} รูป/คน (ลำดับที่ 1 - {sec.items.length})
                                    </span>
                                  </div>
                                </td>
                              </tr>
                              {sec.items.map((s) => {
                                const currentStatus = attendanceMap[s.studentCode] || 'PRESENT';
                                return (
                                  <tr key={`${sec.groupKey}-${s.studentCode}`} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500">{s.indexInMajor}</td>
                                    <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                                      {s.studentCode}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span>{s.fullName || `${s.title || ''} ${s.firstName} ${s.lastName}`}</span>
                                        {customEnrolledCodeSet.has(s.studentCode.toLowerCase().trim()) && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                                            <span>⚡ เทียบโอน/เดินเรียน</span>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveEnrollment(s.studentCode, s.fullName || s.studentCode);
                                              }}
                                              className="text-amber-700 hover:text-rose-700 hover:bg-amber-200/80 rounded-full w-3.5 h-3.5 flex items-center justify-center transition cursor-pointer"
                                              title="นำนิสิตเทียบโอนท่านนี้ออกจากห้องเรียนนี้"
                                            >
                                              ✕
                                            </button>
                                          </span>
                                        )}
                                        {((s.programType || '').toUpperCase() === 'ENGLISH' || (!['ไทย', 'Thai'].includes(s.nationality || '') && s.programType !== 'THAI')) ? (
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
                                    <td className="px-6 py-4">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleStatusChange(s.studentCode, 'PRESENT')}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                            currentStatus === 'PRESENT'
                                              ? 'bg-emerald-600 text-white shadow-sm'
                                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                          }`}
                                        >
                                          มา
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleStatusChange(s.studentCode, 'LATE')}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                            currentStatus === 'LATE'
                                              ? 'bg-yellow-500 text-white shadow-sm'
                                              : 'bg-slate-100 text-slate-600 hover:bg-yellow-50 hover:text-yellow-700'
                                          }`}
                                        >
                                          สาย
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleStatusChange(s.studentCode, 'ABSENT')}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                            currentStatus === 'ABSENT'
                                              ? 'bg-red-600 text-white shadow-sm'
                                              : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700'
                                          }`}
                                        >
                                          ขาด
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleStatusChange(s.studentCode, 'LEAVE')}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                            currentStatus === 'LEAVE'
                                              ? 'bg-blue-600 text-white shadow-sm'
                                              : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
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
                  )}

                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      อาจารย์ผู้บันทึก: <strong className="text-slate-800">{currentUser ? currentUser.name : recordedBy}</strong>
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
            </>
          )}
        </div>
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
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden print:hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <span>ประวัติการบันทึกการเข้าเรียน ({visibleHistoryRecords.length} แถว)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isTeacher
                  ? `แสดงเฉพาะประวัติการเช็คชื่อในรายวิชาที่ท่านรับผิดชอบสอน (${availableCourses.map((c) => c.courseCode).join(', ')})`
                  : 'แสดงประวัติการเช็คชื่อของอาจารย์ทุกท่าน (Admin Mode)'}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              ซิงค์ตรงกับ Google Sheets (แท็บ Attendance)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-4">วันที่</th>
                  <th className="px-6 py-4">รหัสวิชา</th>
                  <th className="px-6 py-4">รหัสนิสิต</th>
                  <th className="px-6 py-4">ชื่อนิสิต</th>
                  <th className="px-6 py-4 text-center">สถานะ</th>
                  <th className="px-6 py-4">ผู้บันทึก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleHistoryRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                      ไม่พบประวัติการเช็คชื่อในรายวิชาที่ท่านรับผิดชอบ
                    </td>
                  </tr>
                ) : (
                  visibleHistoryRecords.slice(0, 50).map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">{h.date}</td>
                      <td className="px-6 py-4 font-mono font-bold text-blue-600">{h.courseCode || '-'}</td>
                      <td className="px-6 py-4 font-mono text-slate-700">{h.studentCode}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{h.studentName}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            h.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : h.status === 'LATE'
                              ? 'bg-yellow-100 text-yellow-800'
                              : h.status === 'LEAVE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {h.status === 'PRESENT'
                            ? 'มา'
                            : h.status === 'LATE'
                            ? 'สาย'
                            : h.status === 'LEAVE'
                            ? 'ลา'
                            : 'ขาด'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{h.recordedBy || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {visibleHistoryRecords.length > 50 && (
            <div className="p-4 bg-slate-50 border-t text-center text-xs text-slate-500">
              แสดง 50 รายการล่าสุด
            </div>
          )}
        </div>
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
