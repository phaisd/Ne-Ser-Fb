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
  X,
  Edit3,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

import { Student, TimetableItem, AttendanceHistoryItem } from '@/types';
import { getSubstantiveTokens, matchInstructorStrict } from '@/lib/utils';
import { EligibilityTab, SemesterRoadmapTab } from '@/components/attendance';
import { getAuthUser, clearAuthSession, saveAuthSession } from '@/lib/auth-client';


const DEMO_INSTRUCTORS = [
  { name: 'พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.', email: 'duangden@mcu.ac.th', title: 'ผศ.ดร. (ภาควิชาศาสนาและปรัชญา)' },
  { name: 'Ven. Dr. Dharma Priya Bhikkhu', email: 'dharmapriya@mcu.ac.th', title: 'Ph.D. (หลักสูตรนานาชาติ EN)' },
  { name: 'ผศ.ดร.ธนาธิป ฮาดเนาลี', email: 'dhanardhip@mcu.ac.th', title: 'ผศ.ดร. (ภาควิชาศาสนาและปรัชญา)' },
  { name: 'พระมหายงยุทธ ธีรธมฺโม, ผศ.ดร.', email: 'yongyut@mcu.ac.th', title: 'ผศ.ดร. (ภาควิชาพระพุทธศาสนา)' },
  { name: 'Assoc. Prof. Dr. Jutamas Vareesangthip', email: 'jutamas@mcu.ac.th', title: 'Assoc. Prof. Dr. (หลักสูตรนานาชาติ)' },
  { name: 'พระมหาไพศาล (ผู้ดูแลระบบสูงสุด)', email: 'phaisal.dis@mcu.ac.th', title: '👑 ผู้ดูแลระบบ (เห็นทุกวิชา)' },
];

export default function AttendancePage() {
  const [activeMode, setActiveMode] = useState<'ROLL_CALL' | 'ROADMAP' | 'QR_CODE' | 'ELIGIBILITY' | 'HISTORY'>('ROLL_CALL');
  
  // Data states
  const [timetables, setTimetables] = useState<TimetableItem[]>([]);
  const [instructors, setInstructors] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [historyRecords, setHistoryRecords] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth & Current Instructor State
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  // Quick switch instructor for testing
  const handleQuickSwitchInstructor = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google', email }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setRecordedBy(data.user.name);
        localStorage.setItem('mcu_current_user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    Promise.all([
      fetch('/api/timetables').then((res) => res.json()),
      fetch('/api/timetables?action=instructors').then((res) => res.json()),
      fetch('/api/students').then((res) => res.json()),
      fetch('/api/attendance').then((res) => res.json()),
    ])
      .then(([ttRes, instRes, stuRes, attRes]) => {
        if (ttRes.success) {
          const list: TimetableItem[] = ttRes.data;
          setTimetables(list);
        }
        if (instRes.success) setInstructors(instRes.data);
        if (stuRes.success) setStudents(stuRes.data);
        if (attRes.success) setHistoryRecords(attRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Role Checks
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isTeacher = Boolean(currentUser && !isAdmin);

  // Available courses strictly filtered for teacher
  const availableCourses = useMemo(() => {
    if (isTeacher) {
      return timetables.filter((t) => matchInstructorStrict(currentUser, t.instructor));
    }
    if (selectedInstructor === 'ALL') return timetables;
    return timetables.filter((t) => t.instructor?.toLowerCase().includes(selectedInstructor.toLowerCase()));
  }, [timetables, currentUser, isTeacher, selectedInstructor]);

  // Current selected course details
  const currentCourse = useMemo(() => {
    return availableCourses.find((t) => t.courseCode === selectedCourseCode) || availableCourses[0];
  }, [availableCourses, selectedCourseCode]);

  // Auto-sync selected course when availableCourses changes
  useEffect(() => {
    if (availableCourses.length > 0) {
      const match = availableCourses.find((c) => c.courseCode === selectedCourseCode);
      if (!match) {
        setSelectedCourseCode(availableCourses[0].courseCode);
        setRecordedBy(currentUser ? currentUser.name : (availableCourses[0].instructor || 'อาจารย์ประจำวิชา'));
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

  const handleCourseChange = (code: string) => {
    const found = availableCourses.find((t) => t.courseCode === code);
    if (found) {
      setSelectedCourseCode(found.courseCode);
      setRecordedBy(currentUser ? currentUser.name : (found.instructor || 'อาจารย์ประจำวิชา'));
    }
  };

  // Determine students to display: filter by target year if enabled
  const targetYear = currentCourse?.yearLevel || 1;
  const targetStudents = useMemo(() => {
    if (!currentCourse) return [];
    return showOnlyTargetYear
      ? students.filter((s) => s.yearLevel === targetYear)
      : students;
  }, [students, showOnlyTargetYear, targetYear, currentCourse]);

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
      `="${item.studentCode}"`,
      `"${item.studentName}"`,
      `"${item.major || '-'}"`,
      item.yearLevel || 1,
      item.present,
      item.late,
      item.leave,
      item.absent,
      item.effectiveAbsences,
      `${item.attendedPercent}%`,
      item.remainingAbsences >= 0 ? item.remainingAbsences : 0,
      `"${item.statusText}"`,
      `"${item.reason}"`,
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
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          PRINT ONLY HEADER (OFFICIAL FACULTY REPORT)
         ───────────────────────────────────────────────────────────── */}
      <div className="hidden print:block text-slate-900 border-b pb-4 mb-6 space-y-1">
        <div className="text-center font-bold text-lg">คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</div>
        <div className="text-center font-bold text-base">รายงานสรุปเวลาเรียนและการประเมินสิทธิ์สอบไล่ปลายภาค ภาคการศึกษาที่ 1 ปีการศึกษา 2569</div>
        {currentCourse && (
          <div className="text-xs text-center text-slate-600 pt-1">
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
              <select
                onChange={(e) => {
                  if (e.target.value) handleQuickSwitchInstructor(e.target.value);
                }}
                value=""
                className="px-3 py-2 text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl cursor-pointer"
                title="สลับบัญชีอาจารย์เพื่อทดสอบการแสดงผลเฉพาะรายวิชาของตนเอง"
              >
                <option value="" disabled className="text-slate-800">
                  🔄 สลับทดสอบอาจารย์ท่านอื่น...
                </option>
                {DEMO_INSTRUCTORS.map((d, idx) => (
                  <option key={idx} value={d.email} className="text-slate-800">
                    {d.name} ({d.title})
                  </option>
                ))}
              </select>

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

            <div className="pt-4 border-t border-amber-200/60">
              <div className="text-xs font-bold text-amber-900 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>หรือเลือกจำลองเข้าสู่ระบบเป็นอาจารย์ท่านใดท่านหนึ่ง เพื่อทดสอบระบบได้ทันที:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {DEMO_INSTRUCTORS.map((d, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickSwitchInstructor(d.email)}
                    className="text-left p-3 rounded-xl bg-white hover:bg-emerald-50 border border-amber-200 hover:border-emerald-300 shadow-sm transition group cursor-pointer"
                  >
                    <div className="font-bold text-xs text-slate-800 group-hover:text-emerald-800 truncate">
                      {d.name}
                    </div>
                    <div className="text-[11px] text-slate-400 group-hover:text-emerald-600 truncate">
                      {d.title}
                    </div>
                  </button>
                ))}
              </div>
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
                        value={selectedCourseCode}
                        onChange={(e) => handleCourseChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                      >
                        {availableCourses.map((c, i) => {
                          const isEn = /inter|eng|english|นานาชาติ/i.test(c.timetableTitle || '') || /^[A-Za-z0-9\s:,-]+$/.test(c.courseName);
                          return (
                            <option key={i} value={c.courseCode}>
                              {isEn ? '🌐 [Inter/EN] ' : '🇹🇭 [ภาคไทย] '}
                              {c.courseCode} — {c.courseName} (ปี {c.yearLevel})
                            </option>
                          );
                        })}
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
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <span>บัญชีรายชื่อนิสิต ({targetStudents.length} รูป/คน)</span>
                      <span className="text-xs text-slate-400 font-normal">
                        ({currentCourse.courseCode} — {currentCourse.courseName})
                      </span>
                    </h3>
                    <button
                      onClick={handleSave}
                      disabled={saving || targetStudents.length === 0}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'กำลังบันทึกลง Google Sheets...' : 'บันทึกการเช็คชื่อ'}
                    </button>
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
                          {targetStudents.map((s, idx) => {
                            const currentStatus = attendanceMap[s.studentCode] || 'PRESENT';
                            return (
                              <tr key={`${s.studentCode}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4 text-xs font-mono text-slate-400">{idx + 1}</td>
                                <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                                  {s.studentCode}
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900">
                                  {s.fullName || `${s.title || ''} ${s.firstName} ${s.lastName}`}
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500">
                                  {s.major || '-'}
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
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-6 print:hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            โหมดฉายโปรเจกเตอร์ในชั้นเรียน
          </div>

          {!currentUser ? (
            <div className="py-8 space-y-3">
              <Lock className="w-10 h-10 text-amber-600 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">
                กรุณาเข้าสู่ระบบอาจารย์ผู้สอนเพื่อเปิดจอ QR Code ประจำวิชา
              </h3>
            </div>
          ) : !currentCourse ? (
            <div className="py-8 space-y-3 text-slate-500 text-sm">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <p>ไม่พบรายวิชาที่ท่านสอนสำหรับเปิดจอ QR Code</p>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {currentCourse.courseCode} — {currentCourse.courseName}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  อาจารย์ผู้สอน: <strong>{currentUser ? currentUser.name : recordedBy}</strong> | วันที่: {date}
                </p>
              </div>

              {/* Big QR Placeholder & PIN Code */}
              <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 max-w-sm mx-auto space-y-4">
                <div className="w-48 h-48 mx-auto bg-white p-4 rounded-xl shadow-inner border flex items-center justify-center">
                  <QrCode className="w-36 h-36 text-slate-800" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">รหัสเข้าเรียนประจำคาบ (PIN)</div>
                  <div className="text-3xl font-mono font-black text-emerald-600 tracking-widest mt-1">
                    {currentCourse.courseCode.replace(/\s+/g, '') || 'MCU88'}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-500 max-w-md mx-auto">
                <p>
                  ให้นิสิตเปิดเบราว์เซอร์ในมือถือ เข้าเมนูเช็คชื่อ หรือสแกน QR Code แล้วกรอกรหัสนิสิตของตนเอง ข้อมูลจะถูกบันทึกส่งตรงเข้า Google Sheets ทันที
                </p>
              </div>
            </>
          )}
        </div>
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
    </div>
  );
}
