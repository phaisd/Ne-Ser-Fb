'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  CheckCircle,
  Menu,
  ChevronRight,
  Sparkles,
  Lock,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { getAuthUser, saveAuthSession, clearAuthSession, isAdminOrOfficer } from '@/lib/auth-client';
import {
  AdminSheetsTab,
  AdminTimetablesTab,
  AdminAttendanceTab,
  AdminCoursesTab,
  AdminStudentsTab,
  AdminDashboardTab,
  AdminUsersTab,
  AdminBrandingTab,
  AdminCertificatesTab,
  AdminEventsTab,
  AdminAdmissionsTab,
} from '@/components/admin/tabs';
import {
  StudentDeleteModal,
  TeachingSlipModal,
  BatchTeachingSlipsModal,
  EditUserModal,
  AutoProvisionModal,
  AddUserModal,
  CertRejectModal,
  ArchiveSummaryModal,
  BulkPromotionModal,
  AdminCertificatePreviewModal,
} from '@/components/admin/modals';
import { NewAcademicYearWorkflowModal } from '@/components/admin/NewAcademicYearWorkflowModal';
import { AdminSidebar, AdminTab } from '@/components/admin/AdminSidebar';
import {
  useAdminSettings,
  useAdminUsers,
  useAdminCertificates,
  useAdminStudents,
} from '@/hooks/admin';

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Core Data Counts & Loading
  const [studentsCount, setStudentsCount] = useState({ total: 0, thai: 0, intl: 0 });
  const [coursesCount, setCoursesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Academic Archives
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  const [isNewYearWorkflowModalOpen, setIsNewYearWorkflowModalOpen] = useState<boolean>(false);
  const [archivingYear, setArchivingYear] = useState<string>('2569');
  const [academicArchives, setAcademicArchives] = useState<any[]>([]);
  const [archiveLoading, setArchiveLoading] = useState<boolean>(false);

  // Sheets status
  const [sheetStatus, setSheetStatus] = useState<any>(null);
  const [syncingSheet, setSyncingSheet] = useState(false);

  // Current admin session
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Data collections for full views
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [timetablesList, setTimetablesList] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [eventRegistrationsList, setEventRegistrationsList] = useState<any[]>([]);

  // Distinct Academic Years for teaching and courses (sorted latest first)
  const availableAcademicYears = useMemo(() => {
    const set = new Set<string>();
    timetablesList.forEach((t) => {
      if (t.academicYear) set.add(String(t.academicYear).trim());
    });
    coursesList.forEach((c) => {
      if (c.academicYear) set.add(String(c.academicYear).trim());
    });
    if (set.size === 0) set.add('2569');
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [timetablesList, coursesList]);

  // Role Access Checks
  const isSuperAdmin = useMemo(() => {
    return (
      currentUser?.role === 'SUPER_ADMIN' ||
      currentUser?.isSuperAdmin === true ||
      currentUser?.email === 'phaisal.dis@mcu.ac.th'
    );
  }, [currentUser]);

  const isOfficer = useMemo(() => {
    const isRegularOfficer = currentUser?.role === 'OFFICER';
    const isActing =
      Boolean(currentUser?.isActingOfficer) &&
      currentUser?.role !== 'ADMIN' &&
      currentUser?.role !== 'SUPER_ADMIN';
    return (isRegularOfficer || isActing) && !isSuperAdmin;
  }, [currentUser, isSuperAdmin]);

  // Load Data function definition (hoisted for hooks)
  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/certificates').then((res) => res.json()),
      fetch('/api/students').then((res) => res.json()),
      fetch('/api/courses').then((res) => res.json()),
      fetch('/api/timetables').then((res) => res.json()),
      fetch('/api/attendance').then((res) => res.json()),
      fetch('/api/users').then((res) => res.json()),
      fetch('/api/system-settings').then((res) => res.json()),
      fetch('/api/sheets-sync').then((res) => res.json()),
      fetch('/api/events').then((res) => res.json()),
    ])
      .then(([reqRes, stdRes, crsRes, ttbRes, attRes, usrRes, setRes, shtRes, evtRes]) => {
        if (reqRes.success) adminCerts.setRequests(reqRes.data);
        if (stdRes.success) {
          setStudentsList(stdRes.data);
          const total = stdRes.data.length;
          const thai = stdRes.data.filter((s: any) => s.nationality === 'ไทย' || s.nationality === 'Thai').length;
          setStudentsCount({ total, thai, intl: total - thai });
        }
        if (crsRes.success) {
          setCoursesList(crsRes.data);
          setCoursesCount(crsRes.data.length);
        }
        if (ttbRes.success) setTimetablesList(ttbRes.data);
        if (attRes.success) setAttendanceList(attRes.data);
        if (usrRes.success) {
          adminUsers.setUsers(usrRes.data);
          // Sync currentUser name with the real account in database
          setCurrentUser((prev: any) => {
            if (!prev) return prev;
            const prevEmail = (prev.email || '').toLowerCase();
            const prevGmail = (prev.gmail || '').toLowerCase();
            const matched = (usrRes.data as any[]).find(
              (u) =>
                (prev.id && u.id === prev.id) ||
                (prevEmail && (u.email?.toLowerCase() === prevEmail || u.gmail?.toLowerCase() === prevEmail)) ||
                (prevGmail && (u.email?.toLowerCase() === prevGmail || u.gmail?.toLowerCase() === prevGmail))
            );
            const fullNameAccount =
              prevEmail === 'phaisal.dis@mcu.ac.th'
                ? (usrRes.data as any[]).find((u) => u.email === 'phaisa.vilo@gmail.com') || matched
                : matched;

            if (fullNameAccount && fullNameAccount.name) {
              const roleLabel =
                prev.role === 'SUPER_ADMIN' || prev.isSuperAdmin || prevEmail === 'phaisal.dis@mcu.ac.th'
                  ? 'ผู้ดูแลระบบสูงสุด'
                  : prev.role === 'OFFICER'
                  ? 'เจ้าหน้าที่'
                  : prev.role === 'ADMIN'
                  ? 'ผู้ดูแลระบบ'
                  : fullNameAccount.isActingOfficer
                  ? 'อาจารย์ผู้สอน • ช่วยงานเจ้าหน้าที่'
                  : 'อาจารย์ผู้สอน';
              const cleanBaseName = String(fullNameAccount.name).replace(/\s*\(.*?\)\s*$/, '').trim();
              const formattedName = `${cleanBaseName} (${roleLabel})`;
              const updatedUser = {
                ...prev,
                name: formattedName,
                isActingOfficer: Boolean(fullNameAccount.isActingOfficer),
              };
              saveAuthSession(updatedUser, true);
              return updatedUser;
            }
            if (prev.name && prev.name.includes('อาจารย์ไพศาล')) {
              const updatedUser = {
                ...prev,
                name: 'พระมหาไพศาล ดิษฐพันธ์ (ผู้ดูแลระบบสูงสุด)',
              };
              saveAuthSession(updatedUser, true);
              return updatedUser;
            }
            return prev;
          });
        }
        if (setRes.success && setRes.data) adminSettings.setSettings(setRes.data);
        if (shtRes) setSheetStatus(shtRes);
        if (evtRes && evtRes.success) {
          setEventsList(evtRes.events || []);
          setEventRegistrationsList(evtRes.registrations || []);
        }
      })
      .finally(() => setLoading(false));
  };

  // Admin Custom Hooks
  const adminSettings = useAdminSettings({
    onSuccess: (msg) => setActionSuccess(msg),
  });

  const adminUsers = useAdminUsers({
    isOfficer,
    loadData,
    setActionSuccess,
    timetablesList,
    coursesList,
    studentsList,
    availableAcademicYears,
  });

  const adminCerts = useAdminCertificates({
    loadData,
    setActionSuccess,
  });

  const adminStudents = useAdminStudents({
    studentsList,
    setStudentsList,
    setStudentsCount,
    currentUser,
    loadData,
  });

  // Courses filter states
  const [courseSearch, setCourseSearch] = useState('');
  const [courseProgramFilter, setCourseProgramFilter] = useState<'ALL' | 'THAI' | 'ENGLISH'>('ALL');
  const [courseDegreeFilter, setCourseDegreeFilter] = useState<string>('ALL');

  // Timetables filter states
  const [timetableSearch, setTimetableSearch] = useState('');
  const [timetableYearFilter, setTimetableYearFilter] = useState<string>('ALL');
  const [timetableSemesterFilter, setTimetableSemesterFilter] = useState<string>('ALL');
  const [timetableDayFilter, setTimetableDayFilter] = useState<string>('ALL');
  const [timetableMajorFilter, setTimetableMajorFilter] = useState<string>('ALL');
  const [timetableProgramFilter, setTimetableProgramFilter] = useState<string>('ALL');

  // Attendance filter states
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<string>('ALL');

  const handleToggleEventStatus = async (regId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ATTENDED' ? 'REGISTERED' : 'ATTENDED';
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkin', registrationId: regId, status: nextStatus }),
    });
    if (res.ok) {
      setEventRegistrationsList((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status: nextStatus } : r))
      );
    }
  };

  useEffect(() => {
    loadData();
    const checkAuth = async () => {
      try {
        let user = getAuthUser();
        const res = await fetch('/api/auth');
        const d = await res.json();
        if (d.authenticated && d.user) {
          user = d.user;
          saveAuthSession(d.user, true);
        } else if (user && (user.email || user.id)) {
          // Restore signed server session cookie if client session exists in localStorage/cookie
          const syncRes = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'sync-session',
              email: user.email,
              gmail: user.gmail,
              id: user.id,
              rememberMe: true,
            }),
          });
          const syncData = await syncRes.json();
          if (syncData.success && syncData.user) {
            user = syncData.user;
            saveAuthSession(syncData.user, true);
            loadData();
          }
        }
        setCurrentUser(user);
      } catch (e) {
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();

    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab') as AdminTab | null;
        if (
          tabParam &&
          [
            'DASHBOARD',
            'CERTIFICATES',
            'STUDENTS',
            'COURSES',
            'TIMETABLES',
            'ATTENDANCE',
            'EVENTS',
            'USERS',
            'BRANDING',
            'SHEETS',
          ].includes(tabParam)
        ) {
          setActiveTab(tabParam);
        }
        if (urlParams.get('promote') === 'true') {
          setTimeout(() => {
            adminStudents.openPromotionModal();
          }, 600);
        }
      }
    } catch (e) {}
  }, []);

  // Redirect Officer away from restricted tabs (BRANDING, SHEETS) to DASHBOARD
  useEffect(() => {
    if (isOfficer && (activeTab === 'BRANDING' || activeTab === 'SHEETS')) {
      setActiveTab('DASHBOARD');
    }
  }, [isOfficer, activeTab]);

  const handleArchiveYear = async () => {
    if (!confirm(`ยืนยันการสรุปปิดยอดและจัดเก็บประวัติปีการศึกษา ${archivingYear} หรือไม่?`)) return;
    setArchiveLoading(true);
    try {
      const res = await fetch('/api/archives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: archivingYear }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`สรุปปิดยอดและจัดเก็บประวัติปีการศึกษา ${archivingYear} สำเร็จเรียบร้อย`);
        fetch('/api/archives')
          .then((r) => r.json())
          .then((d) => d.success && setAcademicArchives(d.data));
        setIsArchiveModalOpen(false);
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: unknown) {
      alert('การจัดเก็บประวัติล้มเหลว: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setArchiveLoading(false);
    }
  };

  // Google Sheets Initial Sync
  const handleInitialSync = async () => {
    if (!confirm('ยืนยันการส่งออกข้อมูลตั้งต้นทั้งหมดไปยัง Google Sheets?')) return;
    setSyncingSheet(true);
    try {
      const res = await fetch('/api/sheets-sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`ซิงค์ข้อมูล Google Sheets สำเร็จ! (${data.syncedTabs.join(', ')})`);
        loadData();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (e: unknown) {
      alert((e instanceof Error ? e.message : String(e)));
    } finally {
      setSyncingSheet(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (e) {}
    clearAuthSession();
    window.location.href = '/login';
  };

  // Filter Courses
  const filteredCourses = useMemo(() => {
    return coursesList.filter((c) => {
      if (courseProgramFilter !== 'ALL') {
        if (courseProgramFilter === 'ENGLISH' && c.programType !== 'ENGLISH') return false;
        if (courseProgramFilter === 'THAI' && c.programType === 'ENGLISH') return false;
      }
      if (courseDegreeFilter !== 'ALL' && c.degreeLevel !== courseDegreeFilter) return false;
      if (courseSearch.trim()) {
        const q = courseSearch.toLowerCase();
        return (
          c.courseCode?.toLowerCase().includes(q) ||
          c.courseName?.toLowerCase().includes(q) ||
          c.courseNameEn?.toLowerCase().includes(q) ||
          c.instructor?.toLowerCase().includes(q) ||
          c.primaryTeacherName?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [coursesList, courseProgramFilter, courseDegreeFilter, courseSearch]);

  // Filter Timetables
  const filteredTimetables = useMemo(() => {
    return timetablesList.filter((t) => {
      if (timetableYearFilter !== 'ALL' && t.academicYear !== timetableYearFilter) return false;
      if (timetableSemesterFilter !== 'ALL' && String(t.semester) !== timetableSemesterFilter) return false;
      if (timetableDayFilter !== 'ALL' && String(t.dayOfWeek) !== timetableDayFilter) return false;
      if (timetableMajorFilter !== 'ALL' && t.major !== timetableMajorFilter) return false;
      if (timetableProgramFilter !== 'ALL' && t.programType !== timetableProgramFilter) return false;
      if (timetableSearch.trim()) {
        const q = timetableSearch.toLowerCase();
        return (
          t.courseCode?.toLowerCase().includes(q) ||
          t.courseName?.toLowerCase().includes(q) ||
          t.instructor?.toLowerCase().includes(q) ||
          t.room?.toLowerCase().includes(q) ||
          t.major?.toLowerCase().includes(q) ||
          t.degreeLevel?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [timetablesList, timetableYearFilter, timetableSemesterFilter, timetableDayFilter, timetableMajorFilter, timetableProgramFilter, timetableSearch]);

  // Filter Attendance
  const filteredAttendance = useMemo(() => {
    return attendanceList.filter((a) => {
      if (attendanceStatusFilter !== 'ALL' && a.status !== attendanceStatusFilter) return false;
      if (attendanceSearch.trim()) {
        const q = attendanceSearch.toLowerCase();
        return (
          a.courseCode?.toLowerCase().includes(q) ||
          a.studentCode?.toLowerCase().includes(q) ||
          a.studentName?.toLowerCase().includes(q) ||
          a.recordedBy?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [attendanceList, attendanceStatusFilter, attendanceSearch]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-xs font-bold text-slate-300">กำลังตรวจสอบสิทธิ์ Admin Console...</span>
        </div>
      </div>
    );
  }

  // Strictly block non-admin / instructor / unauthenticated users from Admin Console
  if (!currentUser || !isAdminOrOfficer(currentUser)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">
              สงวนสิทธิ์เฉพาะผู้ดูแลระบบและเจ้าหน้าที่ (Admin Only)
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {currentUser
                ? `บัญชีของคุณ (${currentUser.name}) เป็นสิทธิ์อาจารย์ผู้สอน ซึ่งไม่มีสิทธิ์เข้าถึงส่วนหลังบ้าน Admin Console กรุณาใช้งานผ่านระบบบันทึกเวลาเรียน`
                : 'กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบหรือเจ้าหน้าที่เพื่อเข้าใช้งานส่วนนี้'}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            {currentUser ? (
              <Link
                href="/attendance"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
              >
                <CheckSquare className="w-4 h-4" />
                <span>ไปยังระบบเช็คชื่ออาจารย์</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Lock className="w-4 h-4" />
                <span>เข้าสู่ระบบ</span>
              </Link>
            )}
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold transition"
            >
              <span>กลับหน้าหลัก</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans print:h-auto print:overflow-visible print:block">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={adminSettings.settings}
        pendingRequestsCount={adminCerts.pendingRequests.length}
        studentsTotalCount={studentsCount.total}
        isOfficer={isOfficer}
        isSuperAdmin={isSuperAdmin}
        currentUser={currentUser}
        handleLogout={handleLogout}
      />

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT AREA WITH TOP HEADER
         ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden print:hidden min-w-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 shrink-0 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-400 min-w-0">
              <span className="hidden sm:inline text-slate-800 font-bold shrink-0">Admin Console</span>
              <ChevronRight className="hidden sm:inline w-3.5 h-3.5 shrink-0" />
              <span className="text-orange-600 font-bold uppercase truncate">
                {activeTab === 'DASHBOARD' && 'ภาพรวมระบบ (Dashboard)'}
                {activeTab === 'CERTIFICATES' && 'งานอนุมัติหนังสือรับรอง'}
                {activeTab === 'STUDENTS' && 'งานทะเบียนนิสิต'}
                {activeTab === 'ADMISSIONS' && 'ระบบรับสมัครและขึ้นทะเบียนนิสิตใหม่'}
                {activeTab === 'COURSES' && 'หลักสูตรและรายวิชา'}
                {activeTab === 'TIMETABLES' && 'ตารางเรียนและตารางสอน'}
                {activeTab === 'ATTENDANCE' && 'บันทึกเวลาเรียน'}
                {activeTab === 'EVENTS' && 'งานกิจกรรมและโครงการนิสิต'}
                {activeTab === 'USERS' && 'จัดการผู้ใช้งานและบทบาท'}
                {activeTab === 'BRANDING' && 'ตั้งค่าโลโก้และข้อความระบบ'}
                {activeTab === 'SHEETS' && 'การเชื่อมต่อ Google Sheets API'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {sheetStatus?.connected ? (
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Google Sheets เชื่อมต่อแล้ว
              </span>
            ) : (
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                โหมดข้อมูลภายใน (Local)
              </span>
            )}

            <button
              type="button"
              onClick={() => setIsNewYearWorkflowModalOpen(true)}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
              title="ดูคำแนะนำขั้นตอนการทำงานเมื่อเปิดปีการศึกษาใหม่"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">ขั้นตอนเปิดปีการศึกษาใหม่</span>
              <span className="sm:hidden">เปิดปีใหม่</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-sm shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">กลับสู่หน้าบ้าน (Public)</span>
              <span className="sm:hidden">หน้าบ้าน</span>
            </Link>
          </div>
        </header>

        {/* Action Alert Banner */}
        {actionSuccess && (
          <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-emerald-700 font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* TAB A: DASHBOARD OVERVIEW */}
          {activeTab === 'DASHBOARD' && (
            <AdminDashboardTab
              pendingRequests={adminCerts.pendingRequests}
              approvedRequests={adminCerts.approvedRequests}
              studentsCount={studentsCount}
              studentsList={studentsList}
              coursesCount={coursesCount}
              coursesList={coursesList}
              users={adminUsers.users}
              setActiveTab={setActiveTab}
              setStatusFilter={adminCerts.setStatusFilter}
              setApprovingId={adminCerts.setApprovingId}
              onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
            />
          )}

          {/* TAB B: CERTIFICATES MANAGEMENT */}
          {activeTab === 'CERTIFICATES' && (
            <AdminCertificatesTab
              requests={adminCerts.requests}
              filteredRequests={adminCerts.filteredRequests}
              availableYears={adminCerts.availableYears}
              filterYear={adminCerts.filterYear}
              setFilterYear={adminCerts.setFilterYear}
              setArchivingYear={setArchivingYear}
              setIsArchiveModalOpen={setIsArchiveModalOpen}
              setAcademicArchives={setAcademicArchives}
              statusFilter={adminCerts.statusFilter}
              setStatusFilter={adminCerts.setStatusFilter}
              pendingRequests={adminCerts.pendingRequests}
              approvedRequests={adminCerts.approvedRequests}
              rejectedRequests={adminCerts.rejectedRequests}
              search={adminCerts.search}
              setSearch={adminCerts.setSearch}
              unmaskPassport={adminCerts.unmaskPassport}
              setUnmaskPassport={adminCerts.setUnmaskPassport}
              formatPassport={adminCerts.formatPassport}
              approvingId={adminCerts.approvingId}
              setApprovingId={adminCerts.setApprovingId}
              docNoInput={adminCerts.docNoInput}
              setDocNoInput={adminCerts.setDocNoInput}
              handleApprove={adminCerts.handleApprove}
              handleOpenRejectModal={adminCerts.handleOpenRejectModal}
              setPreviewRequest={adminCerts.setPreviewRequest}
              setPreviewTab={adminCerts.setPreviewTab}
              onRefreshData={loadData}
              onSuccessMessage={(msg) => setActionSuccess(msg)}
            />
          )}

          {/* TAB B.5: ADMISSIONS & NEW STUDENT ENROLLMENT */}
          {activeTab === 'ADMISSIONS' && (
            <AdminAdmissionsTab
              settings={adminSettings.settings}
              setSettings={adminSettings.setSettings}
              onRefreshStudents={loadData}
              setActionSuccess={setActionSuccess}
            />
          )}

          {/* TAB C: USER & ROLE MANAGEMENT */}
          {activeTab === 'USERS' && (
            <AdminUsersTab
              users={adminUsers.users}
              filteredUsers={adminUsers.filteredUsers}
              studentsList={studentsList}
              userSearch={adminUsers.userSearch}
              setUserSearch={adminUsers.setUserSearch}
              userRoleFilter={adminUsers.userRoleFilter}
              setUserRoleFilter={adminUsers.setUserRoleFilter}
              isScanningInstructors={adminUsers.isScanningInstructors}
              handleScanTimetables={adminUsers.handleScanTimetables}
              setIsAddUserOpen={adminUsers.setIsAddUserOpen}
              setActiveTab={setActiveTab}
              setStudentSearch={adminStudents.setStudentSearch}
              handleStartEditUser={adminUsers.handleStartEditUser}
              handleOpenTeachingSlip={adminUsers.handleOpenTeachingSlip}
              handleCopyLineTeachingMessage={adminUsers.handleCopyLineTeachingMessage}
              copiedLineUserId={adminUsers.copiedLineUserId}
              handleToggleSuspend={adminUsers.handleToggleSuspend}
              handleUpdateRole={adminUsers.handleUpdateRole}
              handleToggleActingOfficer={adminUsers.handleToggleActingOfficer}
              handleResetPassword={adminUsers.handleResetPassword}
              forcePasswordChangeOnFirstLogin={adminSettings.settings?.forcePasswordChangeOnFirstLogin !== false}
              onToggleForcePasswordChange={adminSettings.handleToggleForcePasswordChange}
              onOpenNewYearWorkflow={() => setIsNewYearWorkflowModalOpen(true)}
              onOpenBatchTeachingSlips={() => adminUsers.setIsBatchTeachingSlipOpen(true)}
              isOfficer={isOfficer}
              isSuperAdmin={isSuperAdmin}
              onRefresh={loadData}
            />
          )}

          {/* TAB D: BRANDING & SYSTEM SETTINGS */}
          {!isOfficer && activeTab === 'BRANDING' && (
            <AdminBrandingTab
              settings={adminSettings.settings}
              setSettings={adminSettings.setSettings}
              savingSettings={adminSettings.savingSettings}
              setSavingSettings={adminSettings.setSavingSettings}
              handleSaveSettings={adminSettings.handleSaveSettings}
              handleLogoFileUpload={adminSettings.handleLogoFileUpload}
              uploadingLogo={adminSettings.uploadingLogo}
              logoFileInputRef={adminSettings.logoFileInputRef}
              setActionSuccess={setActionSuccess}
              activeSignatoriesList={adminSettings.activeSignatoriesList}
              isAddingSignatory={adminSettings.isAddingSignatory}
              setIsAddingSignatory={adminSettings.setIsAddingSignatory}
              newSignatoryForm={adminSettings.newSignatoryForm}
              setNewSignatoryForm={adminSettings.setNewSignatoryForm}
              handleAddSignatory={adminSettings.handleAddSignatory}
              handleResetSignatories={adminSettings.handleResetSignatories}
              editingSignatoryId={adminSettings.editingSignatoryId}
              setEditingSignatoryId={adminSettings.setEditingSignatoryId}
              editSignatoryForm={adminSettings.editSignatoryForm}
              setEditSignatoryForm={adminSettings.setEditSignatoryForm}
              handleSaveEditSignatory={adminSettings.handleSaveEditSignatory}
              handleDeleteSignatory={adminSettings.handleDeleteSignatory}
            />
          )}

          {/* TAB E: GOOGLE SHEETS SETTINGS */}
          {!isOfficer && activeTab === 'SHEETS' && (
            <AdminSheetsTab
              sheetStatus={sheetStatus}
              syncingSheet={syncingSheet}
              onInitialSync={handleInitialSync}
            />
          )}

          {/* TAB F: STUDENTS MANAGEMENT VIEW */}
          {activeTab === 'STUDENTS' && (
            <AdminStudentsTab
              studentsCount={studentsCount}
              filteredStudents={adminStudents.filteredStudents}
              allStudents={studentsList}
              onRefresh={() => loadData()}
              studentSearch={adminStudents.studentSearch}
              setStudentSearch={adminStudents.setStudentSearch}
              studentProgramFilter={adminStudents.studentProgramFilter}
              setStudentProgramFilter={adminStudents.setStudentProgramFilter}
              studentStatusFilter={adminStudents.studentStatusFilter}
              setStudentStatusFilter={adminStudents.setStudentStatusFilter}
              studentYearFilter={adminStudents.studentYearFilter}
              setStudentYearFilter={adminStudents.setStudentYearFilter}
              unmaskPassport={adminCerts.unmaskPassport}
              setUnmaskPassport={adminCerts.setUnmaskPassport}
              adminSelectedStudentCodes={adminStudents.adminSelectedStudentCodes}
              setAdminSelectedStudentCodes={adminStudents.setAdminSelectedStudentCodes}
              isAllAdminStudentsSelected={adminStudents.isAllAdminStudentsSelected}
              toggleSelectAllAdminStudents={adminStudents.toggleSelectAllAdminStudents}
              toggleSelectAdminStudent={adminStudents.toggleSelectAdminStudent}
              openPromotionModal={adminStudents.openPromotionModal}
              openDeleteBulkStudentsModal={adminStudents.openDeleteBulkStudentsModal}
              openDeleteSingleStudentModal={adminStudents.openDeleteSingleStudentModal}
            />
          )}

          {/* TAB G: COURSES MANAGEMENT VIEW */}
          {activeTab === 'COURSES' && (
            <AdminCoursesTab
              coursesCount={coursesCount}
              filteredCourses={filteredCourses}
              courseSearch={courseSearch}
              setCourseSearch={setCourseSearch}
              courseProgramFilter={courseProgramFilter}
              setCourseProgramFilter={setCourseProgramFilter}
              instructors={adminUsers.users.filter((u) => u.role === 'INSTRUCTOR')}
              onRefreshCourses={loadData}
            />
          )}

          {/* TAB H: TIMETABLES MANAGEMENT VIEW */}
          {activeTab === 'TIMETABLES' && (
            <AdminTimetablesTab
              timetablesList={timetablesList}
              filteredTimetables={filteredTimetables}
              timetableSearch={timetableSearch}
              setTimetableSearch={setTimetableSearch}
              timetableYearFilter={timetableYearFilter}
              setTimetableYearFilter={setTimetableYearFilter}
              timetableSemesterFilter={timetableSemesterFilter}
              setTimetableSemesterFilter={setTimetableSemesterFilter}
              timetableDayFilter={timetableDayFilter}
              setTimetableDayFilter={setTimetableDayFilter}
              timetableMajorFilter={timetableMajorFilter}
              setTimetableMajorFilter={setTimetableMajorFilter}
              timetableProgramFilter={timetableProgramFilter}
              setTimetableProgramFilter={setTimetableProgramFilter}
              handleScanTimetables={adminUsers.handleScanTimetables}
              isScanningInstructors={adminUsers.isScanningInstructors}
            />
          )}

          {/* TAB I: ATTENDANCE MANAGEMENT VIEW */}
          {activeTab === 'ATTENDANCE' && (
            <AdminAttendanceTab
              attendanceList={attendanceList}
              filteredAttendance={filteredAttendance}
              attendanceSearch={attendanceSearch}
              setAttendanceSearch={setAttendanceSearch}
              attendanceStatusFilter={attendanceStatusFilter}
              setAttendanceStatusFilter={setAttendanceStatusFilter}
              timetablesList={timetablesList}
              studentsList={studentsList}
              currentUser={currentUser}
              logoUrl={adminSettings.settings.logoUrl}
              onRefresh={loadData}
            />
          )}

          {/* TAB J: EVENTS MANAGEMENT VIEW */}
          {activeTab === 'EVENTS' && (
            <AdminEventsTab
              eventsList={eventsList}
              registrationsList={eventRegistrationsList}
              onToggleStatus={handleToggleEventStatus}
              onRefresh={() => {
                fetch('/api/events')
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.success) {
                      setEventsList(d.events || []);
                      setEventRegistrationsList(d.registrations || []);
                    }
                  });
                loadData();
              }}
              settings={adminSettings.settings}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      <AddUserModal
        isOpen={adminUsers.isAddUserOpen}
        newUserForm={adminUsers.newUserForm}
        setNewUserForm={adminUsers.setNewUserForm}
        isOfficer={isOfficer}
        onClose={() => adminUsers.setIsAddUserOpen(false)}
        onSubmit={adminUsers.handleCreateUser}
      />

      <EditUserModal
        editingUser={adminUsers.editingUser}
        editUserForm={adminUsers.editUserForm}
        setEditUserForm={adminUsers.setEditUserForm as any}
        editUserSaving={adminUsers.editUserSaving}
        isOfficer={isOfficer}
        onClose={() => adminUsers.setEditingUser(null)}
        onSubmit={adminUsers.handleSaveEditUser}
      />

      <AdminCertificatePreviewModal
        previewRequest={adminCerts.previewRequest}
        setPreviewRequest={adminCerts.setPreviewRequest}
        previewTab={adminCerts.previewTab}
        setPreviewTab={adminCerts.setPreviewTab}
        requests={adminCerts.requests}
        settings={adminSettings.settings}
        activeSignatoriesList={adminSettings.activeSignatoriesList}
        currentUser={currentUser}
        handleApprove={adminCerts.handleApprove}
        handleOpenRejectModal={adminCerts.handleOpenRejectModal}
        setRejectReasonInput={adminCerts.setRejectReasonInput}
        loadData={loadData}
        setActionSuccess={setActionSuccess}
      />

      <CertRejectModal
        rejectingRequest={adminCerts.rejectingRequest}
        rejectReasonInput={adminCerts.rejectReasonInput}
        setRejectReasonInput={adminCerts.setRejectReasonInput}
        rejectSubmitting={adminCerts.rejectSubmitting}
        onClose={() => adminCerts.setRejectingRequest(null)}
        onConfirm={adminCerts.handleConfirmReject}
      />

      <ArchiveSummaryModal
        isOpen={isArchiveModalOpen}
        availableYears={adminCerts.availableYears}
        archivingYear={archivingYear}
        setArchivingYear={setArchivingYear}
        requests={adminCerts.requests}
        academicArchives={academicArchives}
        archiveLoading={archiveLoading}
        onArchiveYear={handleArchiveYear}
        onClose={() => setIsArchiveModalOpen(false)}
      />

      <TeachingSlipModal
        user={adminUsers.teachingSlipUser}
        teachingSlipQr={adminUsers.teachingSlipQr}
        availableAcademicYears={availableAcademicYears}
        getCoursesForInstructor={adminUsers.getCoursesForInstructor}
        onCopyLineMessage={adminUsers.handleCopyLineTeachingMessage}
        onClose={() => adminUsers.setTeachingSlipUser(null)}
        settings={adminSettings.settings}
        signatories={adminSettings.activeSignatoriesList}
        adminName={currentUser?.name || 'ผู้ดูแลระบบ'}
      />

      <BatchTeachingSlipsModal
        isOpen={adminUsers.isBatchTeachingSlipOpen}
        onClose={() => adminUsers.setIsBatchTeachingSlipOpen(false)}
        instructors={adminUsers.users.filter(
          (u) =>
            u.role === 'INSTRUCTOR' ||
            u.role === 'ADMIN' ||
            u.role === 'OFFICER' ||
            u.role === 'SUPER_ADMIN'
        )}
        availableAcademicYears={availableAcademicYears}
        getCoursesForInstructor={adminUsers.getCoursesForInstructor}
        settings={adminSettings.settings}
        signatories={adminSettings.activeSignatoriesList}
        adminName={currentUser?.name || 'ผู้ดูแลระบบ'}
      />

      <BulkPromotionModal
        isOpen={adminStudents.isPromotionModalOpen}
        onClose={() => adminStudents.setIsPromotionModalOpen(false)}
        showConfirm={adminStudents.showPromotionConfirm}
        setShowConfirm={adminStudents.setShowPromotionConfirm}
        promotionStats={adminStudents.promotionStats}
        promotionTargetYear={adminStudents.promotionTargetYear}
        setPromotionTargetYear={adminStudents.setPromotionTargetYear}
        promotionProgramFilter={adminStudents.promotionProgramFilter}
        setPromotionProgramFilter={adminStudents.setPromotionProgramFilter}
        promotionActionFilter={adminStudents.promotionActionFilter}
        setPromotionActionFilter={adminStudents.setPromotionActionFilter}
        promotionSearch={adminStudents.promotionSearch}
        setPromotionSearch={adminStudents.setPromotionSearch}
        filteredPromotionItems={adminStudents.filteredPromotionItems}
        setFilteredPromotionSelection={adminStudents.setFilteredPromotionSelection}
        setFilteredPromotionAction={adminStudents.setFilteredPromotionAction}
        onResetRecommendation={adminStudents.openPromotionModal}
        onToggleSelect={adminStudents.togglePromotionSelect}
        onActionChange={adminStudents.handlePromotionItemActionChange}
        onCustomFieldChange={adminStudents.handlePromotionCustomFieldChange}
        promotionSubmitting={adminStudents.promotionSubmitting}
        onExecuteBulkPromotion={adminStudents.handleExecuteBulkPromotion}
      />

      <NewAcademicYearWorkflowModal
        isOpen={isNewYearWorkflowModalOpen}
        onClose={() => setIsNewYearWorkflowModalOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
      />

      <StudentDeleteModal
        isOpen={adminStudents.studentDeleteModal.isOpen}
        isBulk={adminStudents.studentDeleteModal.isBulk}
        targets={adminStudents.studentDeleteModal.targets}
        isDeleting={adminStudents.isDeletingStudents}
        onClose={() =>
          adminStudents.setStudentDeleteModal({ isOpen: false, targets: [], isBulk: false })
        }
        onConfirm={adminStudents.handleConfirmDeleteStudents}
      />

      <AutoProvisionModal
        isOpen={adminUsers.provisionModal.isOpen}
        totalTimetableInstructors={adminUsers.provisionModal.totalTimetableInstructors}
        existingCount={adminUsers.provisionModal.existingCount}
        newCount={adminUsers.provisionModal.newCount}
        alreadyExisting={adminUsers.provisionModal.alreadyExisting}
        candidates={adminUsers.provisionModal.candidates}
        isSubmitting={adminUsers.isSubmittingProvision}
        onToggleCandidateSelect={adminUsers.handleToggleCandidateSelect}
        onUpdateCandidateField={adminUsers.handleUpdateCandidateField}
        onClose={() => adminUsers.setProvisionModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={adminUsers.handleConfirmBatchProvision}
      />
    </div>
  );
}
