'use client';

import React from 'react';
import Link from 'next/link';
import { CheckSquare, ExternalLink, Search } from 'lucide-react';
import { AttendanceRecord } from '@/types';

interface AdminAttendanceTabProps {
  attendanceList: AttendanceRecord[];
  filteredAttendance: AttendanceRecord[];
  attendanceSearch: string;
  setAttendanceSearch: (val: string) => void;
  attendanceStatusFilter: string;
  setAttendanceStatusFilter: (val: string) => void;
}

export const AdminAttendanceTab: React.FC<AdminAttendanceTabProps> = ({
  attendanceList,
  filteredAttendance,
  attendanceSearch,
  setAttendanceSearch,
  attendanceStatusFilter,
  setAttendanceStatusFilter,
}) => {
  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-teal-600" />
            บันทึกตรวจเวลาเรียน (Attendance Records & Logs)
          </h2>
          <p className="text-xs text-slate-500">
            ประวัติการเช็คชื่อเข้าชั้นเรียนของนิสิตทั้งหมด {attendanceList.length} รายการ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/attendance"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
          >
            <span>เปิดหน้าระบบเช็คชื่ออาจารย์</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
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

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl font-bold w-full sm:w-auto shrink-0">
          <button
            onClick={() => setAttendanceStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              attendanceStatusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setAttendanceStatusFilter('PRESENT')}
            className={`px-3 py-1.5 rounded-lg transition ${
              attendanceStatusFilter === 'PRESENT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700'
            }`}
          >
            🟢 มาเรียน
          </button>
          <button
            onClick={() => setAttendanceStatusFilter('LATE')}
            className={`px-3 py-1.5 rounded-lg transition ${
              attendanceStatusFilter === 'LATE' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700'
            }`}
          >
            🟡 มาสาย
          </button>
          <button
            onClick={() => setAttendanceStatusFilter('ABSENT')}
            className={`px-3 py-1.5 rounded-lg transition ${
              attendanceStatusFilter === 'ABSENT' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700'
            }`}
          >
            🔴 ขาด
          </button>
          <button
            onClick={() => setAttendanceStatusFilter('LEAVE')}
            className={`px-3 py-1.5 rounded-lg transition ${
              attendanceStatusFilter === 'LEAVE' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-700'
            }`}
          >
            🔵 ลา
          </button>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    ไม่พบประวัติการเช็คชื่อตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {a.date ? new Date(a.date).toLocaleDateString('th-TH') : '-'}
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
                          ? 'เข้าเรียน'
                          : a.status === 'LATE'
                          ? 'มาสาย'
                          : a.status === 'ABSENT'
                          ? 'ขาดเรียน'
                          : 'ลา'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {a.recordedBy || 'อาจารย์ผู้สอน'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {a.note || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
