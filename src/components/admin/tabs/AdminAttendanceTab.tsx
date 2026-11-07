'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CheckSquare, ExternalLink, Search, FileSpreadsheet, Trash2, RefreshCw } from 'lucide-react';
import { AttendanceRecord, TimetableItem, Student } from '@/types';
import { GradeSheetTab } from '@/components/attendance/GradeSheetTab';

interface AdminAttendanceTabProps {
  attendanceList: AttendanceRecord[];
  filteredAttendance: AttendanceRecord[];
  attendanceSearch: string;
  setAttendanceSearch: (val: string) => void;
  attendanceStatusFilter: string;
  setAttendanceStatusFilter: (val: string) => void;
  timetablesList?: TimetableItem[];
  studentsList?: Student[];
  currentUser?: any;
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
  const [isClearing, setIsClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string>('');

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
    return (
      timetablesList.find((t) => t.courseCode === selectedCourseCode) ||
      timetablesList[0] ||
      null
    );
  }, [timetablesList, selectedCourseCode]);

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

      {/* Header Card with Sub-Tab Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-teal-600" />
            <span>ระบบเวลาเรียน & ใบกรอกคะแนนผลการสอบ (Attendance & Examination Grade Sheets)</span>
          </h2>
          <p className="text-xs text-slate-500">
            ตรวจสอบประวัติการเช็คชื่อเข้าชั้นเรียน ({attendanceList.length} รายการ) และจัดการใบกรอกคะแนนวัดผลรายวิชา
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSubTab('LOGS')}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                subTab === 'LOGS'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>ประวัติเช็คชื่อ ({attendanceList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('GRADE_SHEET')}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                subTab === 'GRADE_SHEET'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 hover:text-indigo-950'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ใบกรอกคะแนนวัดผล (Grade Sheet)</span>
            </button>
          </div>

          <Link
            href="/attendance"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
          >
            <span>เปิดหน้าระบบอาจารย์</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {subTab === 'GRADE_SHEET' ? (
        <GradeSheetTab
          currentUser={currentUser || { name: 'ผู้ดูแลระบบ', role: 'ADMIN' }}
          currentCourse={currentCourse}
          availableCourses={timetablesList}
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

          {/* Attendance Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
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
