'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Edit2, ChevronDown, ChevronUp, ChevronsUpDown, BookOpen } from 'lucide-react';
import { Course } from './types';

export interface FacultyWorkloadItem {
  instructor: string;
  courses: Course[];
  totalCredits: number;
}

export interface CourseFacultyTabProps {
  facultySearch: string;
  setFacultySearch: (val: string) => void;
  facultyGrouped: FacultyWorkloadItem[];
  onAssignCourseToInstructor: (instructorName: string) => void;
  onEditCourse: (c: Course) => void;
}

export function CourseFacultyTab({
  facultySearch,
  setFacultySearch,
  facultyGrouped,
  onAssignCourseToInstructor,
  onEditCourse,
}: CourseFacultyTabProps) {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Detect mobile screen (< 768px)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isCardExpanded = (instructor: string) => {
    // When searching, automatically expand all matches so user immediately sees results
    if (facultySearch.trim().length > 0) return true;
    if (expandedMap[instructor] !== undefined) {
      return expandedMap[instructor];
    }
    // Default: On mobile screens, collapse cards to save space; on desktop, expand
    return !isMobile;
  };

  const toggleExpand = (instructor: string) => {
    const current = isCardExpanded(instructor);
    setExpandedMap((prev) => ({
      ...prev,
      [instructor]: !current,
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    facultyGrouped.forEach((f) => {
      next[f.instructor] = true;
    });
    setExpandedMap(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    facultyGrouped.forEach((f) => {
      next[f.instructor] = false;
    });
    setExpandedMap(next);
  };

  return (
    <div className="space-y-4">
      {/* Search and Quick Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่ออาจารย์ผู้สอน หรือรหัสวิชาที่รับผิดชอบ..."
            value={facultySearch}
            onChange={(e) => setFacultySearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 flex-wrap">
          <div className="text-xs text-slate-500">
            พบอาจารย์ผู้สอน {facultyGrouped.length} ท่าน
          </div>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={expandAll}
              className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg font-medium transition cursor-pointer flex items-center gap-1"
              title="คลี่ขยายทุกการ์ด"
            >
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              <span>ขยายทั้งหมด</span>
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg font-medium transition cursor-pointer flex items-center gap-1"
              title="หุบย่อทุกการ์ด"
            >
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              <span>ย่อทั้งหมด</span>
            </button>
          </div>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facultyGrouped.map((f, idx) => {
          const expanded = isCardExpanded(f.instructor);
          const hasCourses = f.courses && f.courses.length > 0;

          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
            >
              {/* Card Header & Summary (Clickable to expand/collapse) */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div
                    onClick={() => toggleExpand(f.instructor)}
                    className="flex items-start gap-3 cursor-pointer select-none flex-1 min-w-0 group"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExpand(f.instructor);
                      }
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-emerald-200 transition">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition truncate">
                        {f.instructor}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        รับผิดชอบ {f.courses.length} รายวิชา • รวม {f.totalCredits} หน่วยกิต
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssignCourseToInstructor(f.instructor);
                      }}
                      className="text-xs px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold transition shrink-0 cursor-pointer"
                    >
                      + มอบหมายวิชาสอน
                    </button>

                    {/* Chevron toggle button in header */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(f.instructor);
                      }}
                      title={expanded ? 'หุบย่อรายวิชา' : 'คลี่ขยายดูรายวิชา'}
                      aria-label={expanded ? 'หุบย่อรายวิชา' : 'คลี่ขยายดูรายวิชา'}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/70 rounded-lg transition cursor-pointer"
                    >
                      {expanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsed state preview banner */}
                {!expanded && hasCourses && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(f.instructor)}
                    className="w-full mt-3 py-2 px-3 bg-slate-50 hover:bg-blue-50/70 text-slate-600 hover:text-blue-700 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs font-medium transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>แสดงรายวิชาที่สอน ({f.courses.length} วิชา • {f.totalCredits} หน่วยกิต)</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-600 font-semibold text-[11px]">
                      <span>คลี่ดู</span>
                      <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                    </div>
                  </button>
                )}

                {/* Empty courses state */}
                {!hasCourses && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 text-center py-1">
                    ยังไม่มีรายวิชาที่รับผิดชอบ
                  </div>
                )}
              </div>

              {/* Expanded state: Course list & bottom collapse button */}
              {expanded && hasCourses && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-slate-100 mt-0">
                  <div className="space-y-2 pt-3">
                    {f.courses.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 flex items-center justify-between gap-2 text-xs transition"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/60">
                              {c.courseCode}
                            </span>
                            <span className="truncate">{c.courseName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>
                              {c.programType === 'ENGLISH' ? '🌐 ภาษาอังกฤษ' : '🇹🇭 ภาษาไทย'}
                            </span>
                            <span>•</span>
                            <span>{c.credits} หน่วยกิต</span>
                            {c.room && (
                              <>
                                <span>•</span>
                                <span>ห้อง {c.room}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onEditCourse(c)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="แก้ไขวิชานี้"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Collapse Toggle Row (As indicated by red arrow) */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px]">
                      รวม {f.courses.length} วิชา ({f.totalCredits} หน่วยกิต)
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleExpand(f.instructor)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 transition cursor-pointer shadow-2xs group"
                      title="หุบย่อรายวิชาในการ์ดนี้เพื่อประหยัดเนื้อที่"
                    >
                      <span>หุบย่อ</span>
                      <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-blue-700 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

