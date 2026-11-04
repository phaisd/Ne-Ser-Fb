'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  ShieldAlert
} from 'lucide-react';

interface Student {
  studentCode: string;
  fullName?: string;
  title?: string;
  firstName: string;
  lastName: string;
  yearLevel?: number;
  major?: string;
}

interface TimetableItem {
  timetableTitle?: string;
  courseCode: string;
  courseName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  instructor?: string;
  yearLevel: number;
}

interface AttendanceHistoryItem {
  id: string;
  courseCode?: string;
  date: string;
  studentCode: string;
  studentName: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE';
  recordedBy?: string;
  createdAt: string;
}

const TITLE_REGEX = /\b(phra|phramaha|ven|dr|ph\.?d|asst|assoc|prof|mr|mrs|ms|พระ|พระมหา|พระครู|ผศ|รศ|ศ|ดร|อ\.ดร|อ)\b/gi;
const THAI_TITLE_PREFIX = /^(ดร\.|ผศ\.|รศ\.|ศ\.|อ\.ดร\.|อ\.|พระมหา|พระครู|พระ)/;

function getSubstantiveTokens(user: any): string[] {
  if (!user) return [];
  const substantive = new Set<string>();

  // 1. Defined Aliases in instructor profile (high priority)
  if (Array.isArray(user.aliases)) {
    user.aliases.forEach((al: string) => {
      const clean = al.trim().toLowerCase();
      if (clean && clean.length >= 3 && !['phra', 'พระ', 'ดร.', 'dr.', 'ven.'].includes(clean)) {
        substantive.add(clean);
      }
    });
  }

  // 2. Substantive tokens from user name and nameEn
  const names = [user.name || '', user.nameEn || ''];
  names.forEach((n) => {
    const cleanStr = n.replace(/[,*\/]/g, ' ');
    cleanStr.split(/\s+/).forEach((part: string) => {
      let token = part.trim().toLowerCase();
      token = token.replace(/^[.\s]+|[.\s]+$/g, '');
      token = token.replace(THAI_TITLE_PREFIX, '');
      token = token.replace(TITLE_REGEX, '');
      token = token.trim();
      if (
        token.length >= 3 &&
        !['phra', 'พระ', 'ดร', 'dr', 'ven', 'asst', 'assoc', 'prof', 'ผศ', 'รศ', 'อาจารย์'].includes(token)
      ) {
        substantive.add(token);
      }
    });
  });

  return Array.from(substantive);
}

function matchInstructorStrict(user: any, instString?: string): boolean {
  if (!user || !instString) return false;
  const targetLower = instString.toLowerCase();
  const tokens = getSubstantiveTokens(user);
  if (tokens.length === 0) return false;

  return tokens.some((token) => {
    // If Thai script: check substring (Thai script does not use spaces between words)
    if (/[\u0E00-\u0E7F]/.test(token)) {
      return targetLower.includes(token);
    }
    // If Latin/English script: use regex word boundary to prevent false positives (e.g. 'phra' matching 'phramaha')
    try {
      const reg = new RegExp('\\b' + token + '\\b', 'i');
      return reg.test(targetLower);
    } catch {
      return targetLower.includes(token);
    }
  });
}

const DEMO_INSTRUCTORS = [
  { name: 'พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.', email: 'duangden@mcu.ac.th', title: 'ผศ.ดร. (ภาควิชาศาสนาและปรัชญา)' },
  { name: 'Ven. Dr. Dharma Priya Bhikkhu', email: 'dharmapriya@mcu.ac.th', title: 'Ph.D. (หลักสูตรนานาชาติ EN)' },
  { name: 'ผศ.ดร.ธนาธิป ฮาดเนาลี', email: 'dhanardhip@mcu.ac.th', title: 'ผศ.ดร. (ภาควิชาศาสนาและปรัชญา)' },
  { name: 'พระมหายงยุทธ ธีรธมฺโม, ผศ.ดร.', email: 'yongyut@mcu.ac.th', title: 'ผศ.ดร. (ภาควิชาพระพุทธศาสนา)' },
  { name: 'Assoc. Prof. Dr. Jutamas Vareesangthip', email: 'jutamas@mcu.ac.th', title: 'Assoc. Prof. Dr. (หลักสูตรนานาชาติ)' },
  { name: 'พระมหาไพศาล (ผู้ดูแลระบบสูงสุด)', email: 'phaisal.dis@mcu.ac.th', title: '👑 ผู้ดูแลระบบ (เห็นทุกวิชา)' },
];

export default function AttendancePage() {
  const [activeMode, setActiveMode] = useState<'ROLL_CALL' | 'QR_CODE' | 'HISTORY'>('ROLL_CALL');
  
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

  // Attendance state: studentCode -> status
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE'>>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Student filter mode
  const [showOnlyTargetYear, setShowOnlyTargetYear] = useState(true);

  // Load User from LocalStorage or API on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mcu_current_user');
      if (stored) {
        const u = JSON.parse(stored);
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
    localStorage.removeItem('mcu_current_user');
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
      // Teacher can strictly ONLY see and check courses where they are the instructor
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

  // Live stats
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
      const records = targetStudents.map((s) => ({
        courseCode: currentCourse.courseCode,
        courseName: currentCourse.courseName,
        date,
        studentCode: s.studentCode,
        studentName: s.fullName || `${s.title || ''} ${s.firstName} ${s.lastName}`,
        status: attendanceMap[s.studentCode] || 'PRESENT',
        recordedBy: currentUser ? currentUser.name : (recordedBy || 'อาจารย์ประจำวิชา'),
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });

      const resData = await res.json();
      if (resData.success) {
        setSavedSuccess(`บันทึกการเช็คชื่อ ${resData.count} รายการ ส่งตรงเข้า Google Sheets (แท็บ Attendance) สำเร็จเรียบร้อย!`);
        // Refresh history
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-emerald-600" />
            ระบบตรวจเข้าเรียนสำหรับอาจารย์ประจำวิชา
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เช็คชื่อเข้าชั้นเรียนเฉพาะรายวิชาที่อาจารย์รับผิดชอบสอน พร้อมบันทึกลง Google Sheets แบบ Real-time
          </p>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto text-sm font-semibold">
          <button
            onClick={() => setActiveMode('ROLL_CALL')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeMode === 'ROLL_CALL'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            อาจารย์เช็คชื่อ (Roll-Call)
          </button>
          <button
            onClick={() => setActiveMode('QR_CODE')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeMode === 'QR_CODE'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เปิดจอ QR ห้องเรียน
          </button>
          <button
            onClick={() => setActiveMode('HISTORY')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeMode === 'HISTORY'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ประวัติการเช็คชื่อ ({visibleHistoryRecords.length})
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-sm animate-in fade-in duration-200">
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
          AUTH STATUS BAR / LOGIN PROMPT
         ───────────────────────────────────────────────────────────── */}
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
            {/* Quick Switch Dropdown for Demo/Testing */}
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
                  กรุณาเข้าสู่ระบบอาจารย์ผู้สอนเพื่อดำเนินการเช็คชื่อเข้าเรียน
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                  ตามนโยบายของคณะพุทธศาสตร์ อาจารย์ผู้สอนแต่ละท่านสามารถตรวจเช็คชื่อเข้าชั้นเรียนได้<strong>เฉพาะรายวิชาที่ตนเองรับผิดชอบบรรยายเท่านั้น</strong> และไม่สามารถเข้าดูหรือแก้ไขรายวิชาที่ไม่ได้เป็นอาจารย์ผู้สอนได้
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

          {/* Demo Account Quick Switcher for Testing */}
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

      {/* ─────────────────────────────────────────────────────────────
          MODE 1: ROLL CALL
         ───────────────────────────────────────────────────────────── */}
      {activeMode === 'ROLL_CALL' && (
        <div className="space-y-6">
          {/* If NOT logged in, show lock guard */}
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
              {/* Filter Panel: Lecturer & Course Selector */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
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

                {/* Warning if no courses matched */}
                {isTeacher && availableCourses.length === 0 && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>ไม่พบรายวิชาที่ท่านเป็นอาจารย์ผู้สอนในตารางสอนภาคเรียนนี้</span>
                    </div>
                    <p className="text-slate-600">
                      ระบบตรวจเช็คชื่อถูกจำกัดสิทธิ์ให้แสดงเฉพาะวิชาที่ท่านเป็นผู้สอนเท่านั้น หากท่านมีชั่วโมงสอนแต่ไม่พบวิชา โปรดติดต่อฝ่ายทะเบียนและประมวลผลการศึกษาเพื่อตรวจสอบชื่อในตารางสอน
                    </p>
                  </div>
                )}

                {/* Course info banner */}
                {currentCourse && (() => {
                  const isEn = /inter|eng|english|นานาชาติ/i.test(currentCourse.timetableTitle || '') || /^[A-Za-z0-9\s:,-]+$/.test(currentCourse.courseName);
                  return (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg font-bold border ${isEn ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                          {isEn ? '🌐 หลักสูตรนานาชาติ (International/EN)' : '🇹🇭 หลักสูตรภาษาไทย (Thai Program)'}
                        </span>
                        <div>
                          <span className="text-slate-400">วิชา:</span>{' '}
                          <strong className="text-slate-800 font-mono">{currentCourse.courseCode}</strong> {currentCourse.courseName}
                        </div>
                        <div>
                          <span className="text-slate-400">ชั้นปี:</span>{' '}
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            ชั้นปีที่ {currentCourse.yearLevel}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">ผู้สอน:</span>{' '}
                          <strong className="text-slate-700">{currentCourse.instructor}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">เวลาเรียน:</span> {currentCourse.startTime || '-'} - {currentCourse.endTime || '-'} น.
                        </div>
                        <div>
                          <span className="text-slate-400">ห้องเรียน:</span> {currentCourse.room || '-'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                          <input
                            type="checkbox"
                            checked={showOnlyTargetYear}
                            onChange={(e) => setShowOnlyTargetYear(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>เฉพาะนิสิตชั้นปีที่ {currentCourse.yearLevel}</span>
                        </label>
                      </div>
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

                    {/* Quick shortcut buttons */}
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
          MODE 2: CLASSROOM QR CODE CHECK-IN
         ───────────────────────────────────────────────────────────── */}
      {activeMode === 'QR_CODE' && (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-6">
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
          MODE 3: ATTENDANCE HISTORY
         ───────────────────────────────────────────────────────────── */}
      {activeMode === 'HISTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
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
