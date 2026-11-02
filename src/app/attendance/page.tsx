'use client';

import { useState, useEffect } from 'react';
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
  ArrowRight
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
  const [filterMyCoursesOnly, setFilterMyCoursesOnly] = useState<boolean>(true);

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
    setRecordedBy('อาจารย์ประจำวิชา');
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
          if (list.length > 0) {
            setSelectedCourseCode(list[0].courseCode);
            setRecordedBy(list[0].instructor || 'อาจารย์ผู้สอนประจำวิชา');
          }
        }
        if (instRes.success) setInstructors(instRes.data);
        if (stuRes.success) setStudents(stuRes.data);
        if (attRes.success) setHistoryRecords(attRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter courses by selected instructor or logged-in teacher
  const availableCourses = timetables.filter((t) => {
    if (currentUser && filterMyCoursesOnly && currentUser.role !== 'ADMIN') {
      const words = (currentUser.name || '').split(/[\s,]+/);
      const matched = words.some((w: string) => w.length > 3 && t.instructor?.includes(w));
      if (matched) return true;
    }
    if (selectedInstructor === 'ALL') return true;
    return t.instructor?.toLowerCase().includes(selectedInstructor.toLowerCase());
  });

  // Current selected course details
  const currentCourse = timetables.find((t) => t.courseCode === selectedCourseCode) || availableCourses[0];

  // Auto-fill lecturer name when course changes
  const handleCourseChange = (code: string) => {
    setSelectedCourseCode(code);
    const found = timetables.find((t) => t.courseCode === code);
    if (found && found.instructor) {
      setRecordedBy(currentUser ? currentUser.name : found.instructor);
    }
  };

  // Determine students to display: filter by target year if enabled
  const targetYear = currentCourse?.yearLevel || 1;
  const targetStudents = showOnlyTargetYear
    ? students.filter((s) => s.yearLevel === targetYear)
    : students;

  // Initialize attendance map when student list changes
  useEffect(() => {
    if (targetStudents.length > 0) {
      const initialMap: Record<string, 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE'> = {};
      targetStudents.forEach((s) => {
        initialMap[s.studentCode] = attendanceMap[s.studentCode] || 'PRESENT';
      });
      setAttendanceMap(initialMap);
    }
  }, [selectedCourseCode, showOnlyTargetYear, targetYear]);

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

  // Save attendance batch
  const handleSave = async () => {
    if (!currentCourse) {
      alert('กรุณาเลือกรายวิชา');
      return;
    }

    setSaving(true);
    setSavedSuccess(null);
    try {
      const records = targetStudents.map((s) => ({
        courseCode: currentCourse.courseCode,
        date,
        studentCode: s.studentCode,
        studentName: s.fullName || `${s.title || ''} ${s.firstName} ${s.lastName}`,
        status: attendanceMap[s.studentCode] || 'PRESENT',
        recordedBy: recordedBy || 'อาจารย์ประจำวิชา',
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
            เช็คชื่อเข้าชั้นเรียนตามรายวิชา/อาจารย์ผู้สอน พร้อมบันทึกลง Google Sheets แบบ Real-time
          </p>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto text-sm font-semibold">
          <button
            onClick={() => setActiveMode('ROLL_CALL')}
            className={`px-3.5 py-2 rounded-lg transition ${
              activeMode === 'ROLL_CALL'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            อาจารย์เช็คชื่อ (Roll-Call)
          </button>
          <button
            onClick={() => setActiveMode('QR_CODE')}
            className={`px-3.5 py-2 rounded-lg transition ${
              activeMode === 'QR_CODE'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เปิดจอ QR ห้องเรียน
          </button>
          <button
            onClick={() => setActiveMode('HISTORY')}
            className={`px-3.5 py-2 rounded-lg transition ${
              activeMode === 'HISTORY'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ประวัติการเช็คชื่อ ({historyRecords.length})
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600" />
            <span>{savedSuccess}</span>
          </div>
          <button onClick={() => setSavedSuccess(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Mode 1: Lecturer Roll-Call Checklist */}
      {activeMode === 'ROLL_CALL' && (
        <div className="space-y-6">
          {/* Instructor Auth Status Card */}
          {currentUser ? (
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-emerald-300 font-bold text-lg shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0) : 'อ'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                      อาจารย์ผู้สอนประจำระบบ
                    </span>
                    <span className="text-xs text-emerald-300/80 font-mono">
                      {currentUser.email}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-0.5">
                    ยินดีต้อนรับ: {currentUser.name}
                  </h2>
                  <p className="text-xs text-emerald-200/80">
                    ระบบคัดกรองเฉพาะรายวิชาที่ท่านสอนและบันทึกชื่อผู้ตรวจเช็คให้อัตโนมัติ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-white/90 bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl cursor-pointer border border-white/10 transition">
                  <input
                    type="checkbox"
                    checked={filterMyCoursesOnly}
                    onChange={(e) => setFilterMyCoursesOnly(e.target.checked)}
                    className="rounded border-emerald-400 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span>แสดงเฉพาะวิชาที่ฉันสอน</span>
                </label>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-xl transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  ออกจากระบบ
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
                  <KeyRound className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900">
                    อาจารย์สามารถเข้าสู่ระบบเพื่อเช็คชื่อรายวิชาของท่านได้ทันที
                  </h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    ล็อกอินด้วยอีเมล <strong>@mcu.ac.th</strong> หรือ <strong>Gmail</strong> เพื่อให้ระบบกรองเฉพาะวิชาที่ท่านสอน และลงชื่อผู้บันทึกให้อัตโนมัติ
                  </p>
                </div>
              </div>

              <Link
                href="/login?redirect=/attendance"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm hover:shadow transition shrink-0"
              >
                <span>เข้าสู่ระบบอาจารย์</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Filter Panel: Lecturer & Course Selector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. อาจารย์ผู้สอน */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  เลือกชื่ออาจารย์ผู้สอน:
                </label>
                <select
                  value={selectedInstructor}
                  onChange={(e) => {
                    const inst = e.target.value;
                    setSelectedInstructor(inst);
                    // Filter courses matching this instructor
                    const matched = timetables.filter((t) => inst === 'ALL' || t.instructor?.includes(inst));
                    if (matched.length > 0) {
                      setSelectedCourseCode(matched[0].courseCode);
                      if (matched[0].instructor) setRecordedBy(matched[0].instructor);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="ALL">-- อาจารย์ทุกท่าน ({instructors.length} ท่าน) --</option>
                  {instructors.map((inst, i) => (
                    <option key={i} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. รายวิชาที่สอน */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  รายวิชาที่สอน ({availableCourses.length} วิชา):
                </label>
                <select
                  value={selectedCourseCode}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {availableCourses.map((c, i) => (
                    <option key={i} value={c.courseCode}>
                      {c.courseCode} — {c.courseName} (ปี {c.yearLevel})
                    </option>
                  ))}
                </select>
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Course info banner */}
            {currentCourse && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex flex-wrap items-center gap-4">
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
            )}

            {/* Live Stats Bar */}
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
                  onClick={() => setAllStatus('PRESENT')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                >
                  ✓ มาทุกคน
                </button>
                <button
                  onClick={() => setAllStatus('ABSENT')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition"
                >
                  ✕ ขาดทุกคน
                </button>
              </div>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">
                บัญชีรายชื่อนิสิต ({targetStudents.length} รูป/คน)
              </h3>
              <button
                onClick={handleSave}
                disabled={saving || targetStudents.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
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
                                onClick={() => handleStatusChange(s.studentCode, 'PRESENT')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                  currentStatus === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                              >
                                มา
                              </button>
                              <button
                                onClick={() => handleStatusChange(s.studentCode, 'LATE')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                  currentStatus === 'LATE'
                                    ? 'bg-yellow-500 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-yellow-50 hover:text-yellow-700'
                                }`}
                              >
                                สาย
                              </button>
                              <button
                                onClick={() => handleStatusChange(s.studentCode, 'ABSENT')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                  currentStatus === 'ABSENT'
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700'
                                }`}
                              >
                                ขาด
                              </button>
                              <button
                                onClick={() => handleStatusChange(s.studentCode, 'LEAVE')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
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

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                ผู้บันทึก: <strong className="text-slate-700">{recordedBy || 'อาจารย์ประจำวิชา'}</strong>
              </span>
              <button
                onClick={handleSave}
                disabled={saving || targetStudents.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition shadow-md shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                {saving ? 'กำลังบันทึกลง Google Sheets...' : 'บันทึกการเช็คชื่อ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Classroom QR Code Check-in */}
      {activeMode === 'QR_CODE' && (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            โหมดฉายโปรเจกเตอร์ในชั้นเรียน
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {currentCourse ? `${currentCourse.courseCode} — ${currentCourse.courseName}` : 'เช็คชื่อเข้าชั้นเรียน'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              อาจารย์ผู้สอน: <strong>{recordedBy}</strong> | วันที่: {date}
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
                {currentCourse?.courseCode.replace(/\s+/g, '') || 'MCU88'}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-500 max-w-md mx-auto">
            <p>
              ให้นิสิตเปิดเบราว์เซอร์ในมือถือ เข้าเมนูเช็คชื่อ หรือสแกน QR Code แล้วกรอกรหัสนิสิตของตนเอง ข้อมูลจะถูกบันทึกส่งตรงเข้า Google Sheets ทันที
            </p>
          </div>
        </div>
      )}

      {/* Mode 3: History & Logs */}
      {activeMode === 'HISTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              ประวัติการบันทึกการเข้าเรียนทั้งหมดใน Google Sheets ({historyRecords.length} แถว)
            </h3>
            <span className="text-xs text-slate-500">ข้อมูลจากแท็บ Attendance</span>
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
                {historyRecords.slice(0, 50).map((h, i) => (
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
                ))}
              </tbody>
            </table>
          </div>
          {historyRecords.length > 50 && (
            <div className="p-4 bg-slate-50 border-t text-center text-xs text-slate-500">
              แสดง 50 รายการล่าสุด
            </div>
          )}
        </div>
      )}
    </div>
  );
}
