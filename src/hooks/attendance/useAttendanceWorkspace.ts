'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Student, TimetableItem, AttendanceHistoryItem, CourseEnrollment } from '@/types';
import { matchInstructorStrict } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error';
import { downloadCsvFile } from '@/lib/utils/csv-export';
import { toSafeCsvCell } from '@/lib/security';
import { toast } from '@/lib/toast';
import { AuthUser, getAuthUser, isAdminOrOfficer, clearAuthSession } from '@/lib/auth-client';
import {
  AttendanceStatusValue,
  buildAvailableCourses,
  buildSemesterRoadmapSessions,
  checkIsEnglishCourse,
  computeExamEligibility,
  computeProgramCounts,
  filterStudentsForCourse,
  SemesterSessionItem,
} from '@/lib/attendance/workspaceHelpers';

export function useAttendanceWorkspace() {
  const [activeMode, setActiveMode] = useState<
    'ROLL_CALL' | 'ROADMAP' | 'QR_CODE' | 'ELIGIBILITY' | 'GRADE_SHEET' | 'HISTORY'
  >('ROLL_CALL');

  // Data states
  const [timetables, setTimetables] = useState<TimetableItem[]>([]);
  const [instructors, setInstructors] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [customEnrollments, setCustomEnrollments] = useState<CourseEnrollment[]>([]);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth & Current Instructor State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Mobile Collapsible UI States
  const [isModeMenuExpanded, setIsModeMenuExpanded] = useState(false);
  const [isAuthCardExpanded, setIsAuthCardExpanded] = useState(false);

  // Instructor & Course Selection
  const [selectedInstructor, setSelectedInstructor] = useState<string>('ALL');
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [recordedBy, setRecordedBy] = useState<string>('');

  // Session Customization States
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
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE'>
  >({});
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Student filter mode
  const [showOnlyTargetYear, setShowOnlyTargetYear] = useState(true);
  const [studentProgramFilter, setStudentProgramFilter] = useState<'AUTO' | 'ENGLISH' | 'THAI' | 'ALL'>('AUTO');

  // Exam Eligibility States & Settings
  const [semesterTotalSessions, setSemesterTotalSessions] = useState<number>(16);
  const [minAttendancePercent, setMinAttendancePercent] = useState<number>(80);
  const [lateToAbsentRatio, setLateToAbsentRatio] = useState<number>(3);
  const [includeLeaveAsExcused, setIncludeLeaveAsExcused] = useState<boolean>(true);
  const [eligibilitySearch, setEligibilitySearch] = useState<string>('');
  const [eligibilityStatusFilter, setEligibilityStatusFilter] = useState<
    'ALL' | 'ELIGIBLE' | 'WARNING' | 'INELIGIBLE'
  >('ALL');
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
  const [showAllFallback, setShowAllFallback] = useState<boolean>(false);

  // Available courses strictly filtered for teacher & deduplicated across shared major timetables
  const availableCourses = useMemo(
    () => buildAvailableCourses(timetables, { isTeacher, currentUser, selectedInstructor, showAllFallback }),
    [timetables, currentUser, isTeacher, selectedInstructor, showAllFallback]
  );

  // Current selected course details
  const currentCourse = useMemo(() => {
    return (
      availableCourses.find(
        (t) => t.sectionKey === selectedCourseCode || t.courseCode === selectedCourseCode
      ) || availableCourses[0]
    );
  }, [availableCourses, selectedCourseCode]);

  // Auto-sync selected course & initial mode when availableCourses changes
  const requestedCourseRef = useRef<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const paramCourse = searchParams.get('course');
      const paramMode = searchParams.get('mode');
      if (paramCourse) requestedCourseRef.current = paramCourse;
      if (
        paramMode === 'ROLL_CALL' ||
        paramMode === 'ROADMAP' ||
        paramMode === 'QR_CODE' ||
        paramMode === 'ELIGIBILITY' ||
        paramMode === 'GRADE_SHEET' ||
        paramMode === 'HISTORY'
      ) {
        setActiveMode(paramMode);
      }
    }
  }, []);

  useEffect(() => {
    if (availableCourses.length > 0) {
      if (requestedCourseRef.current) {
        const req = requestedCourseRef.current;
        const paramMatch = availableCourses.find(
          (c) => c.sectionKey === req || c.courseCode === req
        );
        if (paramMatch) {
          requestedCourseRef.current = null;
          setSelectedCourseCode(paramMatch.sectionKey || paramMatch.courseCode);
          setRecordedBy(currentUser ? currentUser.name : (paramMatch.instructor || 'อาจารย์ประจำวิชา'));
          return;
        }
      }
      const match = availableCourses.find(
        (c) => c.sectionKey === selectedCourseCode || c.courseCode === selectedCourseCode
      );
      if (!match) {
        const first = availableCourses[0];
        setSelectedCourseCode(first.sectionKey || first.courseCode);
        setRecordedBy(currentUser ? currentUser.name : (first.instructor || 'อาจารย์ประจำวิชา'));
      }
    } else {
      setSelectedCourseCode('');
    }
  }, [availableCourses, selectedCourseCode, currentUser]);

  const semesterRoadmapSessions = useMemo(
    () => buildSemesterRoadmapSessions(currentCourse, historyRecords, semesterTotalSessions),
    [currentCourse, historyRecords, semesterTotalSessions]
  );

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
      (t) => t.sectionKey === keyOrCode || t.courseCode === keyOrCode
    );
    if (found) {
      setSelectedCourseCode(found.sectionKey || found.courseCode);
      setRecordedBy(currentUser ? currentUser.name : (found.instructor || 'อาจารย์ประจำวิชา'));
      setStudentProgramFilter('AUTO');
    }
  };

  // Determine if selected course is an International / English Program course
  const isInterCourse = useMemo(
    () => (currentCourse ? checkIsEnglishCourse(currentCourse) : false),
    [currentCourse]
  );

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
        toast.success(`นำนิสิตออกจากห้องเรียนวิชา ${currentCourse.courseCode} เรียบร้อยแล้ว`);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการนำออก');
      }
    } catch (err: unknown) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + getErrorMessage(err));
    }
  };

  const targetYear = currentCourse?.yearLevel || 1;

  const { yearAllCount, yearEnglishCount, yearThaiCount } = useMemo(
    () => computeProgramCounts(students, showOnlyTargetYear, targetYear, Boolean(currentCourse)),
    [students, showOnlyTargetYear, targetYear, currentCourse]
  );

  const { groupedTargetSections, targetStudents } = useMemo(
    () =>
      filterStudentsForCourse(students, customEnrollments, currentCourse, {
        showOnlyTargetYear,
        targetYear,
        activeProgramMode,
      }),
    [students, customEnrollments, currentCourse, showOnlyTargetYear, targetYear, activeProgramMode]
  );

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

  const { eligibilityList, eligibilityStats, recordedSessionsCount, maxAllowedAbsences } = useMemo(
    () =>
      computeExamEligibility(currentCourse, historyRecords, targetStudents, {
        semesterTotalSessions,
        minAttendancePercent,
        lateToAbsentRatio,
        includeLeaveAsExcused,
      }),
    [
      currentCourse,
      historyRecords,
      targetStudents,
      semesterTotalSessions,
      minAttendancePercent,
      lateToAbsentRatio,
      includeLeaveAsExcused,
    ]
  );

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

    downloadCsvFile(
      `Exam_Eligibility_${currentCourse.courseCode.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.csv`,
      headers,
      rows
    );
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
      '2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31',
    ];

    interface BatchAttendancePayload {
      courseCode: string;
      courseName: string;
      date: string;
      studentCode: string;
      studentName: string;
      status: AttendanceStatusValue;
      recordedBy: string;
    }

    const records: BatchAttendancePayload[] = [];
    baseDates.forEach((dt, dateIdx) => {
      targetStudents.forEach((s, sIdx) => {
        let status: AttendanceStatusValue = 'PRESENT';
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
        toast.success(
          `✅ จำลองบันทึกข้อมูลเวลาเรียนสำเร็จ ${data.count} รายการ (12 สัปดาห์) ระบบได้คำนวณสิทธิ์สอบให้นิสิตทุกคนเรียบร้อยแล้ว!`
        );
        const refRes = await fetch('/api/attendance');
        const refData = await refRes.json();
        if (refData.success) setHistoryRecords(refData.data);
      }
    } catch (e: unknown) {
      toast.error('เกิดข้อผิดพลาด: ' + getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // Submit attendance to Google Sheets & local cache
  const handleSave = async () => {
    if (!currentCourse) {
      toast.warning('กรุณาเลือกรายวิชาที่สอนก่อนบันทึก');
      return;
    }
    if (!currentUser) {
      toast.error('กรุณาเข้าสู่ระบบอาจารย์ผู้สอนก่อนทำการบันทึกข้อมูล');
      return;
    }

    setSaving(true);
    setSavedSuccess(null);

    try {
      const allCoInstructors = [
        ...sessionCustom.coInstructors,
        ...(sessionCustom.customCoInstructorText
          ? sessionCustom.customCoInstructorText.split(',').map((s) => s.trim())
          : []),
      ].filter(Boolean);

      const lead =
        sessionCustom.leadInstructor ||
        (currentUser ? currentUser.name : (recordedBy || 'อาจารย์ประจำวิชา'));
      const fullRecordedBy =
        allCoInstructors.length > 0
          ? `${lead} [ร่วมกับ: ${allCoInstructors.join(', ')}]`
          : lead;

      const typeLabel =
        sessionCustom.sessionType === 'MAKEUP'
          ? 'สอนชดเชย'
          : sessionCustom.sessionType === 'SPECIAL'
          ? 'บรรยายพิเศษ'
          : sessionCustom.sessionType === 'EXAM'
          ? 'สอบเก็บคะแนน'
          : 'คาบปกติ';
      const sessionNote = [
        `คาบที่ ${sessionCustom.sessionNumber} (${typeLabel})`,
        sessionCustom.sessionTopic ? `หัวข้อ: ${sessionCustom.sessionTopic}` : null,
        `ห้อง: ${sessionCustom.room} (${sessionCustom.startTime}-${sessionCustom.endTime} น.)`,
        sessionCustom.note ? `บันทึก: ${sessionCustom.note}` : null,
      ]
        .filter(Boolean)
        .join(' | ');

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
        const msg = `บันทึกการเช็คชื่อ ${resData.count} รายการ ส่งตรงเข้า Google Sheets (แท็บ Attendance) สำเร็จเรียบร้อย!`;
        setSavedSuccess(msg);
        toast.success(msg);
        fetch('/api/attendance')
          .then((r) => r.json())
          .then((d) => d.success && setHistoryRecords(d.data));
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + resData.error);
      }
    } catch (err: unknown) {
      toast.error('บันทึกล้มเหลว: ' + getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return {
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
  };
}
