'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  ExternalLink,
  Search,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  Users,
  Award,
  ChevronRight,
} from 'lucide-react';
import { AttendanceRecord, TimetableItem, Student, AuthUser } from '@/types';
import { GradeSheetTab } from '@/components/attendance/GradeSheetTab';
import { matchInstructorStrict, getSubstantiveTokens } from '@/lib/utils/name-matcher';

interface AdminAttendanceTabProps {
  attendanceList: AttendanceRecord[];
  filteredAttendance: AttendanceRecord[];
  attendanceSearch: string;
  setAttendanceSearch: (val: string) => void;
  attendanceStatusFilter: string;
  setAttendanceStatusFilter: (val: string) => void;
  timetablesList?: TimetableItem[];
  studentsList?: Student[];
  currentUser?: AuthUser | null;
  logoUrl?: string;
  onRefresh?: () => void;
}

export const AdminAttendanceTab: React.FC<AdminAttendanceTabProps> = ({
  attendanceList,
  filteredAttendance,
  attendanceSearch,
  setAttendanceSearch,
  attendanceStatusFilter,
  setAttendanceStatusFilter,
  timetablesList = [],
  studentsList = [],
  currentUser,
  logoUrl,
  onRefresh,
}) => {
  const [subTab, setSubTab] = useState<'LOGS' | 'GRADE_SHEET'>('LOGS');
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(
    timetablesList[0]?.courseCode || ''
  );
  const [teachingSemesterFilter, setTeachingSemesterFilter] = useState<'2' | '1' | 'ALL'>('2');
  const [isClearing, setIsClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string>('');

  // Extract teaching courses matching the logged-in instructor
  const myTeachingCourses = useMemo(() => {
    if (!currentUser) return [];
    const direct = timetablesList.filter((t) => matchInstructorStrict(currentUser, t.instructor));
    if (direct.length > 0) return direct;
    const tokens = getSubstantiveTokens(currentUser);
    if (tokens.length === 0) return [];
    return timetablesList.filter((t) => {
      const inst = (t.instructor || '').toLowerCase();
      return tokens.some((tok) => tok.length >= 4 && inst.includes(tok));
    });
  }, [timetablesList, currentUser]);

  const filteredTeachingCourses = useMemo(() => {
    if (teachingSemesterFilter === 'ALL') return myTeachingCourses;
    return myTeachingCourses.filter((t) => String(t.semester) === teachingSemesterFilter);
  }, [myTeachingCourses, teachingSemesterFilter]);

  // Set default selectedCourseCode to instructor's course (prioritize Semester 2)
  useEffect(() => {
    if (myTeachingCourses.length > 0) {
      const sem2 = myTeachingCourses.find((t) => String(t.semester) === '2');
      if (sem2) {
        setSelectedCourseCode(sem2.courseCode);
      } else {
        setSelectedCourseCode(myTeachingCourses[0].courseCode);
      }
    }
  }, [myTeachingCourses]);

  const getDayName = (day?: number) => {
    switch (day) {
      case 1:
        return 'วันจันทร์';
      case 2:
        return 'วันอังคาร';
      case 3:
        return 'วันพุธ';
      case 4:
        return 'วันพฤหัสบดี';
      case 5:
        return 'วันศุกร์';
      case 6:
        return 'วันเสาร์';
      case 7:
        return 'วันอาทิตย์';
      default:
        return 'วันเรียน';
    }
  };

  const handleClearAllAttendance = async () => {
    if (
      !window.confirm(
        `ยืนยันการล้างข้อมูลตัวอย่าง / ประวัติการเช็คชื่อทั้งหมด (${attendanceList.length} รายการ) หรือไม่?\n\nการดำเนินการนี้จะล้างข้อมูลในตาราง Attendance ทั้งในระบบและ Google Sheets`
      )
    ) {
      return;
    }

    setIsClearing(true);
    try {
      const res = await fetch('/api/attendance?action=clear-all', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setToastMsg(data.message || 'ล้างข้อมูลตัวอย่างเรียบร้อยแล้ว');
        setTimeout(() => setToastMsg(''), 4000);
        onRefresh?.();
      }
    } catch (err) {
      console.error('Failed to clear attendance:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteSingleRecord = async (id: string, studentName: string) => {
    if (!window.confirm(`ยืนยันการลบรายการเช็คชื่อของ "${studentName || id}" หรือไม่?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/attendance?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg('ลบรายการเช็คชื่อเรียบร้อยแล้ว');
        setTimeout(() => setToastMsg(''), 3000);
        onRefresh?.();
      }
    } catch (err) {
      console.error('Failed to delete attendance record:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const currentCourse = useMemo(() => {
    const listToSearch = myTeachingCourses.length > 0 ? myTeachingCourses : timetablesList;
    return (
      listToSearch.find((t) => t.courseCode === selectedCourseCode) ||
      timetablesList.find((t) => t.courseCode === selectedCourseCode) ||
      listToSearch[0] ||
      timetablesList[0] ||
      null
    );
  }, [timetablesList, myTeachingCourses, selectedCourseCode]);

  // Compute student roster and attendance eligibility for the selected course in Admin mode
  const courseStudentsForGradeSheet = useMemo(() => {
    if (!currentCourse) return [];
    const cAny = currentCourse as any;
    const isEngCourse =
      cAny.programType === 'INTERNATIONAL' ||
      cAny.major?.toLowerCase().includes('english') ||
      cAny.major?.toLowerCase().includes('นานาชาติ') ||
      /^[A-Za-z0-9\s\-.,()]+$/.test(currentCourse.courseName || '');

    const targetYear = Number((currentCourse as any).yearLevel) || 0;

    let matchedStudents = studentsList.filter((s) => {
      const stuStatus = (s as any).status || s.studyStatus;
      if (stuStatus && stuStatus !== 'กำลังศึกษา' && stuStatus !== 'STUDYING') return false;
      if (targetYear > 0 && s.yearLevel && Number(s.yearLevel) !== targetYear) return false;
      const isIntlStu =
        s.nationality && s.nationality !== 'ไทย' && s.nationality.toLowerCase() !== 'thai';
      return isEngCourse ? isIntlStu : !isIntlStu;
    });

    if (matchedStudents.length === 0) {
      matchedStudents = studentsList.slice(0, 30);
    }

    const courseAtt = attendanceList.filter((a) => a.courseCode === currentCourse.courseCode);
    const uniqueDates = Array.from(new Set(courseAtt.map((a) => a.date).filter(Boolean)));
    const sessionsRecorded = uniqueDates.length;

    return matchedStudents.map((s) => {
      const sRecords = courseAtt.filter((r) => r.studentCode === s.studentCode);
      const sPresent = sRecords.filter((r) => r.status === 'PRESENT').length;
      const sLate = sRecords.filter((r) => r.status === 'LATE').length;
      const sLeave = sRecords.filter((r) => r.status === 'LEAVE').length;
      const sAbsent = sRecords.filter((r) => r.status === 'ABSENT').length;
      const effectiveAbsences = sAbsent + Math.floor(sLate / 3);
      const attendedScore = sPresent + sLate * 0.75 + sLeave;
      const attendedPercent =
        sessionsRecorded > 0
          ? Math.min(100, Math.round((attendedScore / sessionsRecorded) * 100))
          : 100;

      const eligibilityStatus: 'ELIGIBLE' | 'WARNING' | 'INELIGIBLE' =
        effectiveAbsences > 3 ? 'INELIGIBLE' : effectiveAbsences === 3 ? 'WARNING' : 'ELIGIBLE';

      return {
        studentCode: s.studentCode,
        studentName: s.fullName || `${s.title || ''} ${s.firstName || ''} ${s.lastName || ''}`.trim(),
        major: s.major,
        yearLevel: s.yearLevel,
        nationality: s.nationality,
        attendedPercent,
        eligibilityStatus,
      };
    });
  }, [currentCourse, studentsList, attendanceList]);

  return (
    <div className="space-y-4">
      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>✅ {toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg('')}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Instructor Teaching Courses & Timetable Section */}
      {myTeachingCourses.length > 0 && (
        <div className="bg-gradient-to-br from-teal-900 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl border border-teal-500/30 shadow-lg space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-400/30">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>ภาระงานสอนและรายวิชาที่รับผิดชอบ</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/30 text-teal-200 border border-teal-400/30">
                    พบ {filteredTeachingCourses.length} รายการ
                  </span>
                </h3>
                <p className="text-xs text-teal-200/70 mt-0.5">
                  อาจารย์ผู้สอน: {currentUser?.name || 'อาจารย์'} • ตารางสอนตามหลักสูตร
                </p>
              </div>
            </div>

            {/* Semester Switch Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-teal-500/30 text-xs shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTeachingSemesterFilter('2')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                  teachingSemesterFilter === '2'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ภาคเรียนที่ 2/2569
              </button>
              <button
                type="button"
                onClick={() => setTeachingSemesterFilter('1')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                  teachingSemesterFilter === '1'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ภาคเรียนที่ 1/2569
              </button>
              <button
                type="button"
                onClick={() => setTeachingSemesterFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                  teachingSemesterFilter === 'ALL'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ทั้งหมด
              </button>
            </div>
          </div>

          {/* Course Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {filteredTeachingCourses.map((c, idx) => (
              <div
                key={`${c.courseCode}_${c.dayOfWeek}_${c.startTime}_${idx}`}
                className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-teal-500/50 p-4 rounded-xl transition shadow-md flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-400/30 font-black text-xs font-mono">
                      {c.courseCode}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                        ภาค {c.semester}/{c.academicYear}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                        ชั้นปีที่ {c.yearLevel}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{c.courseName}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {c.timetableTitle || 'หลักสูตรพุทธศาสตรบัณฑิต'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>
                        {getDayName(c.dayOfWeek)} {c.startTime} - {c.endTime} น.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{c.room || 'ไม่ระบุห้องเรียน'}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 truncate">
                    <span className="text-slate-500">ผู้สอน: </span>
                    <span className="text-teal-200 font-medium">{c.instructor}</span>
                  </div>
                </div>

                {/* Quick Action Buttons for this Course */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourseCode(c.courseCode);
                      setSubTab('GRADE_SHEET');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                    <span>กรอกคะแนน (Grade Sheet)</span>
                  </button>
                  <Link
                    href={`/attendance?course=${encodeURIComponent(c.courseCode)}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                    title="บันทึกเวลาเรียนรายวิชานี้"
                  >
                    <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                    <span>เช็คชื่อ</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header Card with Sub-Tab Switcher (Responsive for Mobile) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5 print:hidden">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-teal-600 shrink-0" />
            <span>ระบบเวลาเรียน & ใบกรอกคะแนนผลการสอบ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ประวัติการเช็คชื่อเข้าชั้นเรียน ({attendanceList.length} รายการ) และจัดการใบกรอกคะแนนวัดผลรายวิชา
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSubTab('LOGS')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                subTab === 'LOGS'
                  ? 'bg-teal-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">ประวัติเช็คชื่อ ({attendanceList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('GRADE_SHEET')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                subTab === 'GRADE_SHEET'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-indigo-700 hover:text-indigo-950'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">ใบกรอกคะแนนวัดผล</span>
            </button>
          </div>

          <Link
            href="/attendance"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer w-full sm:w-auto"
          >
            <span>เปิดหน้าระบบอาจารย์</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      </div>

      {subTab === 'GRADE_SHEET' ? (
        <GradeSheetTab
          currentUser={currentUser || { name: 'ผู้ดูแลระบบ', email: 'admin@mcu.ac.th', role: 'ADMIN' }}
          currentCourse={currentCourse}
          availableCourses={myTeachingCourses.length > 0 ? myTeachingCourses : timetablesList}
          selectedCourseCode={currentCourse?.courseCode || selectedCourseCode}
          handleCourseChange={(code: string) => setSelectedCourseCode(code)}
          studentsList={courseStudentsForGradeSheet}
          logoUrl={logoUrl}
        />
      ) : (
        <>
          {/* Filters Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาด้วยรหัสวิชา, รหัสนิสิต, ชื่อ หรือผู้บันทึก..."
                value={attendanceSearch}
                onChange={(e) => setAttendanceSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl font-bold shrink-0">
                <button
                  onClick={() => setAttendanceStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    attendanceStatusFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setAttendanceStatusFilter('PRESENT')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    attendanceStatusFilter === 'PRESENT'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-700'
                  }`}
                >
                  🟢 มาเรียน
                </button>
                <button
                  onClick={() => setAttendanceStatusFilter('LATE')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    attendanceStatusFilter === 'LATE'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-amber-700'
                  }`}
                >
                  🟡 มาสาย
                </button>
                <button
                  onClick={() => setAttendanceStatusFilter('ABSENT')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    attendanceStatusFilter === 'ABSENT'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-rose-700'
                  }`}
                >
                  🔴 ขาด
                </button>
                <button
                  onClick={() => setAttendanceStatusFilter('LEAVE')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    attendanceStatusFilter === 'LEAVE'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-700'
                  }`}
                >
                  🔵 ลา
                </button>
              </div>

              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                  title="รีเฟรชข้อมูล"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>รีเฟรช</span>
                </button>
              )}

              {attendanceList.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllAttendance}
                  disabled={isClearing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isClearing ? 'กำลังล้างข้อมูล...' : 'ล้างข้อมูลตัวอย่าง / ลบทั้งหมด'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Attendance Display: Mobile Cards (< md) & Desktop Table (>= md) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* 1. Mobile Cards View (< md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredAttendance.length === 0 ? (
                <div className="py-12 px-4 text-center text-slate-400 text-xs">
                  ยังไม่มีประวัติการเช็คชื่อ หรือไม่พบรายการตามเงื่อนไขที่เลือก
                </div>
              ) : (
                filteredAttendance.map((a) => {
                  const parsedDate = a.date ? new Date(a.date) : null;
                  const dateText =
                    parsedDate && !Number.isNaN(parsedDate.getTime())
                      ? parsedDate.toLocaleDateString('th-TH')
                      : a.date || '-';

                  const statusConfig = {
                    PRESENT: { label: 'มาเรียน', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
                    LATE: { label: 'มาสาย', color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
                    ABSENT: { label: 'ขาดเรียน', color: 'bg-rose-50 text-rose-800 border-rose-200', dot: 'bg-rose-500' },
                    LEAVE: { label: 'ลากิจ/ลาป่วย', color: 'bg-blue-50 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
                  }[a.status] || { label: a.status, color: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' };

                  return (
                    <div key={`att-card-${a.id}`} className="p-4 space-y-2.5 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70">
                          📅 {dateText}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.color}`}>
                          <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                          <span>{statusConfig.label}</span>
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-teal-800 text-xs bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {a.courseCode || '-'}
                          </span>
                          <span className="font-mono font-bold text-slate-600 text-xs">{a.studentCode}</span>
                        </div>
                        <h4 className="text-[13.5px] font-bold text-slate-900 mt-1 leading-snug">
                          {a.studentName}
                        </h4>
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-xs flex items-center justify-between text-slate-500">
                        <span className="text-[11px] truncate">ผู้บันทึก: {a.recordedBy || 'อาจารย์ประจำวิชา'}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSingleRecord(a.id, a.studentName)}
                          disabled={deletingId === a.id}
                          className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-bold transition cursor-pointer text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 2. Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
                  <tr>
                    <th className="px-5 py-3.5">วันที่ / เวลา</th>
                    <th className="px-5 py-3.5">รหัสวิชา</th>
                    <th className="px-5 py-3.5">รหัสนิสิต</th>
                    <th className="px-5 py-3.5">ชื่อนิสิต</th>
                    <th className="px-5 py-3.5 text-center">สถานะ</th>
                    <th className="px-5 py-3.5">ผู้บันทึกข้อมูล</th>
                    <th className="px-5 py-3.5">หมายเหตุ</th>
                    <th className="px-4 py-3.5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400">
                        ยังไม่มีประวัติการเช็คชื่อ หรือไม่พบรายการตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((a) => {
                      const parsedDate = a.date ? new Date(a.date) : null;
                      const dateText =
                        parsedDate && !Number.isNaN(parsedDate.getTime())
                          ? parsedDate.toLocaleDateString('th-TH')
                          : a.date || '-';

                      return (
                        <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                            {dateText}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-teal-800">
                            {a.courseCode || '-'}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-700">
                            {a.studentCode}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            {a.studentName}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                a.status === 'PRESENT'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : a.status === 'LATE'
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : a.status === 'ABSENT'
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : 'bg-blue-100 text-blue-800 border-blue-200'
                              }`}
                            >
                              {a.status === 'PRESENT'
                                ? 'มาเรียน'
                                : a.status === 'LATE'
                                ? 'มาสาย'
                                : a.status === 'ABSENT'
                                ? 'ขาดเรียน'
                                : 'ลา'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {a.recordedBy || 'อาจารย์ประจำวิชา'}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">{a.note || '-'}</td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteSingleRecord(a.id, a.studentName)}
                              disabled={deletingId === a.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-bold transition cursor-pointer disabled:opacity-40"
                              title="ลบรายการนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบ</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
