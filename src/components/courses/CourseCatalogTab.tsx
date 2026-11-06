'use client';

import React from 'react';
import {
  Search,
  Filter,
  Globe,
  GraduationCap,
  User,
  MapPin,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Course, DAYS_OF_WEEK, DEGREE_LEVELS, MAJORS } from './types';

export interface CourseCatalogTabProps {
  search: string;
  setSearch: (val: string) => void;
  filterProgram: 'ALL' | 'THAI' | 'ENGLISH';
  setFilterProgram: (val: 'ALL' | 'THAI' | 'ENGLISH') => void;
  filterDegree: string;
  setFilterDegree: (val: string) => void;
  selectedMajor: string;
  setSelectedMajor: (val: string) => void;
  filterYear: string;
  setFilterYear: (val: string) => void;
  filterSemester: string;
  setFilterSemester: (val: string) => void;
  filteredCourses: Course[];
  paginatedCourses: Course[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  itemsPerPage: number;
  onViewCourse: (c: Course) => void;
  onEditCourse: (c: Course) => void;
  onDeleteCourse: (c: Course) => void;
  canManage?: boolean;
}

export function CourseCatalogTab({
  search,
  setSearch,
  filterProgram,
  setFilterProgram,
  filterDegree,
  setFilterDegree,
  selectedMajor,
  setSelectedMajor,
  filterYear,
  setFilterYear,
  filterSemester,
  setFilterSemester,
  filteredCourses,
  paginatedCourses,
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  onViewCourse,
  onEditCourse,
  onDeleteCourse,
  canManage = false,
}: CourseCatalogTabProps) {
  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหารหัสวิชา (เช่น 000 113), ชื่อวิชาไทย/อังกฤษ, อาจารย์ผู้สอน, ห้องเรียน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Program Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
            <button
              onClick={() => setFilterProgram('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterProgram === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทุกหลักสูตร
            </button>
            <button
              onClick={() => setFilterProgram('THAI')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                filterProgram === 'THAI'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇹🇭</span> ภาคภาษาไทย
            </button>
            <button
              onClick={() => setFilterProgram('ENGLISH')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                filterProgram === 'ENGLISH'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> ภาคภาษาอังกฤษ
            </button>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> กรองเพิ่มเติม:
          </span>

          {/* Degree Level */}
          <select
            value={filterDegree}
            onChange={(e) => setFilterDegree(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">ระดับการศึกษา: ทั้งหมด</option>
            {DEGREE_LEVELS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Major */}
          <select
            value={selectedMajor}
            onChange={(e) => setSelectedMajor(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">สาขาวิชา: ทั้งหมด</option>
            {MAJORS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Year Level */}
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">ชั้นปี: ทั้งหมด</option>
            <option value="1">ชั้นปีที่ 1</option>
            <option value="2">ชั้นปีที่ 2</option>
            <option value="3">ชั้นปีที่ 3</option>
            <option value="4">ชั้นปีที่ 4</option>
          </select>

          {/* Semester */}
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">ภาคการศึกษา: ทั้งหมด</option>
            <option value="1">ภาคเรียนที่ 1</option>
            <option value="2">ภาคเรียนที่ 2</option>
          </select>

          {(search ||
            filterProgram !== 'ALL' ||
            filterDegree !== 'ALL' ||
            filterYear !== 'ALL' ||
            filterSemester !== 'ALL' ||
            selectedMajor !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setFilterProgram('ALL');
                setFilterDegree('ALL');
                setFilterYear('ALL');
                setFilterSemester('ALL');
                setSelectedMajor('ALL');
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              ล้างตัวกรอง
            </button>
          )}

          <span className="ml-auto text-slate-400 font-medium">
            พบ {filteredCourses.length} รายวิชา
          </span>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">รหัสวิชา</th>
                <th className="px-5 py-3.5">ชื่อรายวิชา (ไทย / อังกฤษ)</th>
                <th className="px-5 py-3.5">หลักสูตร & ระดับ</th>
                <th className="px-5 py-3.5 text-center">หน่วยกิต</th>
                <th className="px-5 py-3.5">อาจารย์ผู้สอน</th>
                <th className="px-5 py-3.5">วัน-เวลา & ห้องเรียน</th>
                {canManage && <th className="px-5 py-3.5 text-right">การจัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCourses.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-6 py-12 text-center text-slate-400">
                    ไม่พบข้อมูลรายวิชาที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                paginatedCourses.map((c, i) => {
                  const isEn = c.programType === 'ENGLISH' || c.section === 'EN';
                  const dayObj = DAYS_OF_WEEK.find((d) => d.id === c.dayOfWeek);

                  return (
                    <tr
                      key={`${c.id || c.courseCode}-${c.section || '1'}-${i}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Course Code */}
                      <td className="px-5 py-4 font-mono font-bold">
                        <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs border border-blue-100">
                          {c.courseCode}
                        </span>
                        {c.section && (
                          <span className="ml-1.5 text-[11px] text-slate-400 font-normal">
                            Sec {c.section}
                          </span>
                        )}
                      </td>

                      {/* Course Names */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug">
                          {c.courseName}
                        </div>
                        {c.courseNameEn && (
                          <div className="text-xs text-slate-400 font-sans mt-0.5">
                            {c.courseNameEn}
                          </div>
                        )}
                        {c.major && (
                          <span className="inline-block mt-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            สาขา{c.major}
                          </span>
                        )}
                      </td>

                      {/* Program & Degree */}
                      <td className="px-5 py-4 space-y-1">
                        <div>
                          {isEn ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <Globe className="w-3 h-3" />
                              หลักสูตรนานาชาติ (EN)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span>🇹🇭</span>
                              หลักสูตรภาคไทย
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.degreeLevel || 'ปริญญาตรี'}</span>
                          {c.yearLevel && (
                            <span className="text-slate-400 font-normal">
                              (ปี {c.yearLevel})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Credits */}
                      <td className="px-5 py-4 text-center font-bold text-slate-800">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-xs">
                          {c.credits} หน่วยกิต
                        </span>
                      </td>

                      {/* Instructor */}
                      <td className="px-5 py-4 max-w-[200px]">
                        {c.instructor ? (
                          <div className="flex items-start gap-1.5 text-xs text-slate-700">
                            <User className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{c.instructor}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            ยังไม่ระบุผู้สอน
                          </span>
                        )}
                      </td>

                      {/* Schedule & Room */}
                      <td className="px-5 py-4 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          {dayObj && (
                            <span
                              className={`w-2 h-2 rounded-full ${dayObj.color} shrink-0`}
                            />
                          )}
                          <span>{dayObj ? dayObj.label : 'ไม่ระบุวัน'}</span>
                          {c.startTime && c.endTime && (
                            <span className="text-slate-500">
                              ({c.startTime} - {c.endTime} น.)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          <span className="line-clamp-1">{c.room || 'ไม่ระบุห้อง'}</span>
                        </div>
                      </td>

                      {/* Actions (Admin & Officer Only) */}
                      {canManage && (
                        <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => onViewCourse(c)}
                            title="ดูรายละเอียด"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditCourse(c)}
                            title="แก้ไขรายวิชา"
                            className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteCourse(c)}
                            title="ลบรายวิชา"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              แสดง {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredCourses.length)} จาก{' '}
              {filteredCourses.length} รายการ
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-slate-700">
                หน้า {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
