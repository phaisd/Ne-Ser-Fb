'use client';

import React from 'react';
import { Search, User, Edit2 } from 'lucide-react';
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
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
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
        <div className="text-xs text-slate-500 shrink-0">
          พบอาจารย์ผู้สอน {facultyGrouped.length} ท่าน
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facultyGrouped.map((f, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
          >
            <div className="flex items-start justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {f.instructor}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    รับผิดชอบ {f.courses.length} รายวิชา • รวม {f.totalCredits} หน่วยกิต
                  </p>
                </div>
              </div>
              <button
                onClick={() => onAssignCourseToInstructor(f.instructor)}
                className="text-xs px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold transition shrink-0"
              >
                + มอบหมายวิชาสอน
              </button>
            </div>

            {/* Course list under instructor */}
            <div className="space-y-2">
              {f.courses.map((c, cIdx) => (
                <div
                  key={cIdx}
                  className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        {c.courseCode}
                      </span>
                      <span className="truncate">{c.courseName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
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
                      onClick={() => onEditCourse(c)}
                      className="p-1 text-slate-400 hover:text-amber-600 rounded"
                      title="แก้ไขวิชานี้"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
