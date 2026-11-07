'use client';

import React from 'react';
import { History } from 'lucide-react';
import { AttendanceHistoryItem, TimetableItem } from '@/types';

interface AttendanceHistoryTabProps {
  visibleHistoryRecords: AttendanceHistoryItem[];
  isTeacher: boolean;
  availableCourses: TimetableItem[];
}

export function AttendanceHistoryTab({
  visibleHistoryRecords,
  isTeacher,
  availableCourses,
}: AttendanceHistoryTabProps) {
  return (
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
                  <td className="px-6 py-4 font-mono font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">
                    {h.studentCode}
                  </td>
                  <td className="px-6 py-4 font-medium text-sm sm:text-base text-slate-900">{h.studentName}</td>
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
  );
}
