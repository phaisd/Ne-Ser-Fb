'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, ExternalLink, Search } from 'lucide-react';
import { Course } from '@/types';

interface AdminCoursesTabProps {
  coursesCount: number;
  filteredCourses: Course[];
  courseSearch: string;
  setCourseSearch: (val: string) => void;
  courseProgramFilter: string;
  setCourseProgramFilter: (val: any) => void;
}

export const AdminCoursesTab: React.FC<AdminCoursesTabProps> = ({
  coursesCount,
  filteredCourses,
  courseSearch,
  setCourseSearch,
  courseProgramFilter,
  setCourseProgramFilter,
}) => {
  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            คลังหลักสูตรและรายวิชา (Curriculum & Courses Management)
          </h2>
          <p className="text-xs text-slate-500">
            รายวิชาทั้งหมด {coursesCount} วิชา (ภาคภาษาไทยและภาษาอังกฤษ, หน่วยกิต, ระดับปริญญา)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <span>เปิดหน้าจอหลักสูตรเต็มรูปแบบ</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสวิชา, ชื่อวิชา (ไทย/อังกฤษ) หรืออาจารย์ผู้สอน..."
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl font-bold w-full md:w-auto shrink-0">
          <button
            onClick={() => setCourseProgramFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              courseProgramFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            ทุกหลักสูตร
          </button>
          <button
            onClick={() => setCourseProgramFilter('THAI')}
            className={`px-3 py-1.5 rounded-lg transition ${
              courseProgramFilter === 'THAI' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700'
            }`}
          >
            🇹🇭 ภาคไทย
          </button>
          <button
            onClick={() => setCourseProgramFilter('ENGLISH')}
            className={`px-3 py-1.5 rounded-lg transition ${
              courseProgramFilter === 'ENGLISH' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-700'
            }`}
          >
            🌐 ภาคอังกฤษ (EN)
          </button>
        </div>
      </div>

      {/* Courses Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
              <tr>
                <th className="px-5 py-3.5">รหัสวิชา</th>
                <th className="px-5 py-3.5">ชื่อรายวิชา</th>
                <th className="px-5 py-3.5">หลักสูตร</th>
                <th className="px-5 py-3.5 text-center">หน่วยกิต</th>
                <th className="px-5 py-3.5">อาจารย์ผู้สอน</th>
                <th className="px-5 py-3.5">ระดับหลักสูตร</th>
                <th className="px-5 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    ไม่พบรายวิชาตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredCourses.slice(0, 50).map((c) => {
                  const isEnglish = c.programType === 'ENGLISH';

                  return (
                    <tr key={c.id || c.courseCode} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-emerald-800">
                        {c.courseCode}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        <div className="font-bold">{c.courseName}</div>
                        {c.courseNameEn && (
                          <div className="text-[11px] text-slate-400 font-normal">{c.courseNameEn}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isEnglish
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isEnglish ? '🌐 ภาคอังกฤษ' : '🇹🇭 ภาคไทย'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-800">
                        {c.credits || 3}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {c.primaryTeacherName || c.instructor || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                          {c.degreeLevel || 'ปริญญาตรี'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/courses?search=${c.courseCode}`}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition inline-flex items-center gap-1"
                        >
                          <span>จัดการ</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
