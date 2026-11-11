'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  BookOpen,
  Calendar,
  MapPin,
  Globe,
  GraduationCap,
  Filter,
  Search,
  RotateCcw,
  Printer,
  FileSpreadsheet,
  CheckSquare,
  KeyRound,
  LayoutGrid,
  List,
  Sparkles,
  Award,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { AttendanceRecord, Course, CourseGradeSheet, LoginAuditRecord, TimetableItem } from '@/types';
import { InstructorWorkloadDashboard } from '@/components/workload/InstructorWorkloadDashboard';
import { getAuthUser, saveAuthSession } from '@/lib/auth-client';
import {
  buildInstructorWorkloadCourses,
  filterWorkloadCourses,
  computeWorkloadStats,
  buildBatchTeachingSlipsSheets,
  buildBatchTeachingSlipsFilename,
  downloadXlsx,
  WorkloadCourseItem,
} from '@/lib/utils';

const STANDARD_DEGREES = ['ปริญญาตรี', 'ปริญญาโท', 'ปริญญาเอก', 'ประกาศนียบัตร'];

const DAYS_ORDER = [
  { id: 1, label: 'วันจันทร์', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
  { id: 2, label: 'วันอังคาร', badge: 'bg-pink-100 text-pink-900 border-pink-300' },
  { id: 3, label: 'วันพุธ', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { id: 4, label: 'วันพฤหัสบดี', badge: 'bg-orange-100 text-orange-900 border-orange-300' },
  { id: 5, label: 'วันศุกร์', badge: 'bg-sky-100 text-sky-900 border-sky-300' },
  { id: 6, label: 'วันเสาร์', badge: 'bg-purple-100 text-purple-900 border-purple-300' },
  { id: 7, label: 'วันอาทิตย์', badge: 'bg-rose-100 text-rose-900 border-rose-300' },
];

export default function InstructorWorkloadPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [timetables, setTimetables] = useState<TimetableItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [gradesMap, setGradesMap] = useState<Record<string, CourseGradeSheet>>({});
  const [loginHistory, setLoginHistory] = useState<LoginAuditRecord[]>([]);
  const [loginSecurity, setLoginSecurity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDashboardDetails, setLoadingDashboardDetails] = useState(true);

  // Filters: ระดับ, ชั้นปี, หลักสูตรภาษา, ปีการศึกษา, ภาคเรียน, ค้นหา
  const [search, setSearch] = useState('');
  const [filterDegree, setFilterDegree] = useState<string>('ALL');
  const [filterYearLevel, setFilterYearLevel] = useState<string>('ALL');
  const [filterProgram, setFilterProgram] = useState<'ALL' | 'THAI' | 'ENGLISH'>('ALL');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('ALL');
  const [filterSemester, setFilterSemester] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'WEEKLY'>('CARDS');

  // Resolve authentication state
  useEffect(() => {
    const localUser = getAuthUser();
    if (localUser) {
      setCurrentUser(localUser);
      setAuthChecked(true);
    }

    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user) {
          setCurrentUser(d.user);
          saveAuthSession(d.user, true);
        } else if (!localUser) {
          setCurrentUser(null);
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));

    const handleLogin = () => setCurrentUser(getAuthUser());
    const handleLogout = () => setCurrentUser(null);
    window.addEventListener('mcu_user_logged_in', handleLogin);
    window.addEventListener('mcu_user_logged_out', handleLogout);
    return () => {
      window.removeEventListener('mcu_user_logged_in', handleLogin);
      window.removeEventListener('mcu_user_logged_out', handleLogout);
    };
  }, []);

  // Load timetables, courses, attendance summary, and grade sheets
  useEffect(() => {
    setLoading(true);
    setLoadingDashboardDetails(true);
    Promise.all([
      fetch('/api/timetables').then((r) => r.json()),
      fetch('/api/courses').then((r) => r.json()),
    ])
      .then(([ttRes, cRes]) => {
        if (ttRes?.success && Array.isArray(ttRes.data)) setTimetables(ttRes.data);
        if (cRes?.success && Array.isArray(cRes.data)) setCourses(cRes.data);
      })
      .catch((err) => {
        console.error('Failed to load workload data:', err);
      })
      .finally(() => setLoading(false));

    Promise.all([
      fetch('/api/attendance').then((r) => r.json()).catch(() => null),
      fetch('/api/grades').then((r) => r.json()).catch(() => null),
      fetch('/api/auth?action=history').then((r) => r.json()).catch(() => null),
    ])
      .then(([attRes, gradeRes, histRes]) => {
        if (attRes?.success && Array.isArray(attRes.data)) {
          setAttendanceRecords(attRes.data);
        }
        if (gradeRes?.success && gradeRes.data && typeof gradeRes.data === 'object') {
          setGradesMap(gradeRes.data);
        }
        if (histRes?.success) {
          if (Array.isArray(histRes.history)) setLoginHistory(histRes.history);
          if (histRes.security) setLoginSecurity(histRes.security);
        }
      })
      .finally(() => setLoadingDashboardDetails(false));
  }, []);

  // All courses assigned to the logged-in instructor
  const allMyCourses = useMemo<WorkloadCourseItem[]>(() => {
    if (!currentUser || currentUser.role === 'STUDENT') return [];
    return buildInstructorWorkloadCourses(currentUser, timetables, courses);
  }, [currentUser, timetables, courses]);

  // Dynamic filter options derived from the instructor's courses + system defaults
  const availableAcademicYears = useMemo(() => {
    const set = new Set<string>();
    allMyCourses.forEach((c) => c.academicYear && set.add(c.academicYear));
    timetables.forEach((t) => t.academicYear && set.add(String(t.academicYear).trim()));
    courses.forEach((c) => c.academicYear && set.add(String(c.academicYear).trim()));
    if (set.size === 0) set.add('2569');
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [allMyCourses, timetables, courses]);

  const availableDegrees = useMemo(() => {
    const set = new Set<string>(STANDARD_DEGREES);
    allMyCourses.forEach((c) => c.degreeLevel && set.add(c.degreeLevel));
    return Array.from(set);
  }, [allMyCourses]);

  const availableSemesters = useMemo(() => {
    const set = new Set<string>(['1', '2']);
    allMyCourses.forEach((c) => c.semester && set.add(String(c.semester)));
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [allMyCourses]);

  // Filtered workload courses
  const filteredCourses = useMemo(() => {
    return filterWorkloadCourses(allMyCourses, {
      search,
      degreeLevel: filterDegree,
      yearLevel: filterYearLevel,
      programType: filterProgram,
      academicYear: filterAcademicYear,
      semester: filterSemester,
    });
  }, [
    allMyCourses,
    search,
    filterDegree,
    filterYearLevel,
    filterProgram,
    filterAcademicYear,
    filterSemester,
  ]);

  const stats = useMemo(() => computeWorkloadStats(filteredCourses), [filteredCourses]);

  const hasActiveFilters =
    search.trim() !== '' ||
    filterDegree !== 'ALL' ||
    filterYearLevel !== 'ALL' ||
    filterProgram !== 'ALL' ||
    filterAcademicYear !== 'ALL' ||
    filterSemester !== 'ALL';

  const handleResetFilters = () => {
    setSearch('');
    setFilterDegree('ALL');
    setFilterYearLevel('ALL');
    setFilterProgram('ALL');
    setFilterAcademicYear('ALL');
    setFilterSemester('ALL');
  };

  const handleExportMyWorkloadExcel = () => {
    if (!currentUser) return;
    const attendanceUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/attendance`
        : 'https://ne-ser-fb.vercel.app/attendance';

    const sheets = buildBatchTeachingSlipsSheets({
      instructors: [currentUser],
      getCoursesForInstructor: () => filteredCourses,
      selectedYear: filterAcademicYear,
      selectedSemester: filterSemester,
      attendanceUrl,
      adminName: currentUser.name,
    });
    const filename = buildBatchTeachingSlipsFilename(filterAcademicYear, filterSemester);
    downloadXlsx(filename, sheets);
  };

  // Auth loading state
  if (!authChecked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2 text-slate-500 text-sm">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
          <KeyRound className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-slate-900">
            หน้าภาระงานสอนของอาจารย์ผู้สอน
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            กรุณาเข้าสู่ระบบด้วยบัญชีอาจารย์ผู้สอนของท่าน เพื่อดูรายวิชาที่รับผิดชอบบรรยาย ตารางสอนรายสัปดาห์ และจัดการเช็คชื่อนิสิต
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/login?redirect=/workload"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition"
          >
            <KeyRound className="w-4 h-4" />
            <span>เข้าสู่ระบบอาจารย์</span>
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>ดูตารางสอนรวม</span>
          </Link>
        </div>
      </div>
    );
  }

  // Student account notice
  if (currentUser.role === 'STUDENT') {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-amber-200 shadow-lg p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h1 className="text-lg font-extrabold text-slate-900">
          ส่วนนี้สำหรับอาจารย์ผู้สอนและบุคลากร
        </h1>
        <p className="text-sm text-slate-600">
          บัญชีของท่านเป็นบัญชีนิสิต สามารถตรวจสอบตารางเรียนหรือยื่นขอหนังสือรับรองได้จากเมนูด้านล่าง
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/courses"
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
          >
            ดูตารางเรียนและรายวิชา
          </Link>
          <Link
            href="/certificates"
            className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
          >
            ยื่นคำร้องหนังสือรับรอง
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* 1. Instructor Workload Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 print:bg-white print:text-slate-900 print:border-slate-300 print:shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold print:hidden">
              <UserCheck className="w-3.5 h-3.5" />
              <span>พอร์ทัลภาระงานสอนส่วนตัว (Instructor Workload Portal)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <Briefcase className="w-7 h-7 text-amber-400 shrink-0 print:text-indigo-700" />
              <span>ภาระงานสอนของ {currentUser.name}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 print:text-slate-600">
              <span>{currentUser.department || 'คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}</span>
              {currentUser.instructorType && (
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-amber-200 font-bold print:bg-slate-100 print:text-slate-800">
                  {currentUser.instructorType}
                </span>
              )}
              <span className="font-mono text-slate-400">• {currentUser.email || currentUser.gmail}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
            <button
              type="button"
              onClick={handleExportMyWorkloadExcel}
              disabled={filteredCourses.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ส่งออก Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              disabled={filteredCourses.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์บัตรภาระงาน</span>
            </button>

            <Link
              href="/attendance"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md transition"
            >
              <CheckSquare className="w-4 h-4" />
              <span>ไปหน้าเช็คชื่อนิสิต</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Instructor Operational Dashboard (Directly below Hero Header) */}
      <InstructorWorkloadDashboard
        allCoursesCount={allMyCourses.length}
        filteredCourses={filteredCourses}
        stats={stats}
        attendanceRecords={attendanceRecords}
        gradesMap={gradesMap}
        loadingDetails={loadingDashboardDetails}
        loginHistory={loginHistory}
        loginSecurity={loginSecurity}
      />

      {/* 3. Multi-Dimensional Filters Panel: ระดับ, หลักสูตรภาษา, ปีการศึกษา, ภาคเรียน */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหารหัสวิชา, ชื่อรายวิชา (ไทย/EN), สาขาวิชา หรือห้องเรียน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* หลักสูตรภาษา (Program Language Filter) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setFilterProgram('ALL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterProgram === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทุกหลักสูตรภาษา
            </button>
            <button
              type="button"
              onClick={() => setFilterProgram('THAI')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                filterProgram === 'THAI'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇹🇭</span>
              <span>ภาคภาษาไทย</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterProgram('ENGLISH')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                filterProgram === 'ENGLISH'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>ภาคภาษาอังกฤษ</span>
            </button>
          </div>
        </div>

        {/* Filter Row: ระดับการศึกษา, ชั้นปี, ปีการศึกษา, ภาคเรียน + View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>ตัวกรอง:</span>
            </span>

            {/* ระดับการศึกษา */}
            <select
              aria-label="กรองตามระดับการศึกษา"
              value={filterDegree}
              onChange={(e) => setFilterDegree(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">ระดับการศึกษา: ทั้งหมด</option>
              {availableDegrees.map((deg) => (
                <option key={deg} value={deg}>
                  ระดับ: {deg}
                </option>
              ))}
            </select>

            {/* ชั้นปี */}
            <select
              aria-label="กรองตามชั้นปี"
              value={filterYearLevel}
              onChange={(e) => setFilterYearLevel(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">ชั้นปี: ทั้งหมด</option>
              <option value="1">ชั้นปีที่ 1</option>
              <option value="2">ชั้นปีที่ 2</option>
              <option value="3">ชั้นปีที่ 3</option>
              <option value="4">ชั้นปีที่ 4</option>
            </select>

            {/* ปีการศึกษา */}
            <select
              aria-label="กรองตามปีการศึกษา"
              value={filterAcademicYear}
              onChange={(e) => setFilterAcademicYear(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">ปีการศึกษา: ทั้งหมด</option>
              {availableAcademicYears.map((yr) => (
                <option key={yr} value={yr}>
                  ปีการศึกษา {yr}
                </option>
              ))}
            </select>

            {/* ภาคเรียน */}
            <select
              aria-label="กรองตามภาคการศึกษา"
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">ภาคเรียน: ทั้งหมด</option>
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  ภาคเรียนที่ {sem}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ล้างตัวกรอง</span>
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl font-bold">
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'CARDS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>รายการรายวิชา</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('WEEKLY')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'WEEKLY'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>ตารางสอนรายสัปดาห์</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Workload Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">กำลังโหลดข้อมูลภาระงานสอนของท่าน...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {allMyCourses.length === 0
              ? 'ยังไม่พบรายวิชาที่ระบุชื่อท่านในตารางสอน'
              : 'ไม่พบรายวิชาที่ตรงกับเงื่อนไขตัวกรอง'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {allMyCourses.length === 0
              ? 'หากท่านมีรายวิชาที่รับผิดชอบบรรยายแต่ยังไม่แสดง กรุณาตรวจสอบชื่อ-ฉายา หรือติดต่อฝ่ายทะเบียนคณะเพื่อซิงค์ชื่อในตารางสอน'
              : 'ลองปรับเปลี่ยนระดับการศึกษา หลักสูตรภาษา ปีการศึกษา ภาคเรียน หรือกดปุ่ม "ล้างตัวกรอง"'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>แสดงรายวิชาทั้งหมดของฉัน</span>
            </button>
          )}
        </div>
      ) : viewMode === 'CARDS' ? (
        /* LIST / CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1">
          {filteredCourses.map((course) => {
            const isEn = course.programType === 'ENGLISH';
            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition p-5 flex flex-col justify-between gap-4 print:shadow-none print:break-inside-avoid"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {course.courseCode}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                          isEn
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isEn ? '🌐 ภาคภาษาอังกฤษ' : '🇹🇭 ภาคภาษาไทย'}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                        {course.degreeLevel} • ปี {course.yearLevel}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      ภาค {course.semester}/{course.academicYear}
                    </span>
                  </div>

                  {/* Course Title */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {course.courseName}
                    </h3>
                    {course.courseNameEn && course.courseNameEn !== course.courseName && (
                      <p className="text-xs text-slate-500 mt-0.5">{course.courseNameEn}</p>
                    )}
                  </div>

                  {/* Meta grid */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-semibold">
                        {course.dayLabel || '-'} {course.startTime ? `${course.startTime}-${course.endTime || '-'} น.` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate font-semibold">{course.room || 'ไม่ระบุห้อง'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {course.sharedMajors.length > 0
                          ? course.sharedMajors.join(', ')
                          : course.major || 'คณะพุทธศาสตร์'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{course.credits} หน่วยกิต</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 print:hidden">
                  <span className="text-[11px] text-slate-400 truncate max-w-[55%]" title={course.instructor}>
                    ผู้สอน: {course.instructor}
                  </span>
                  <Link
                    href={`/attendance?course=${encodeURIComponent(course.attendanceSectionKey)}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white text-xs font-bold transition shrink-0"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>เช็คชื่อ / คะแนน</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* WEEKLY SCHEDULE VIEW */
        <div className="space-y-4">
          {DAYS_ORDER.map((day) => {
            const dayCourses = filteredCourses.filter((c) => c.dayOfWeek === day.id);
            if (dayCourses.length === 0) return null;

            return (
              <div
                key={day.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-xs font-extrabold border ${day.badge}`}>
                      {day.label}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {dayCourses.length} รายวิชา
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {dayCourses.map((course) => {
                    const isEn = course.programType === 'ENGLISH';
                    return (
                      <div
                        key={course.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                          <div className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200 font-mono text-xs font-extrabold shrink-0 text-center">
                            {course.startTime || '-'}-{course.endTime || '-'} น.
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-indigo-700">
                                {course.courseCode}
                              </span>
                              <span className="font-extrabold text-sm text-slate-900">
                                {course.courseName}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isEn ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {isEn ? 'EN' : 'ไทย'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>
                                {course.degreeLevel} ปี {course.yearLevel} • ภาค {course.semester}/{course.academicYear}
                              </span>
                              <span className="font-semibold text-slate-700">
                                📍 {course.room || 'ไม่ระบุห้อง'}
                              </span>
                              {course.sharedMajors.length > 0 && (
                                <span>สาขา: {course.sharedMajors.join(', ')}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/attendance?course=${encodeURIComponent(course.attendanceSectionKey)}`}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white text-xs font-bold transition shrink-0 print:hidden"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>เช็คชื่อวิชานี้</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
