'use client';

import React from 'react';
import { StudentScoreItem } from '@/types';
import { GroupedMajorSection } from '../majorGrouping';
import { ComputedGradeRow } from './types';
import { calculateMcuGrade } from '@/lib/grading/gradeCalculator';

interface GradeSheetMobileCardsProps {
  groupedSections: GroupedMajorSection<ComputedGradeRow>[];
  formLanguage: 'THAI' | 'ENGLISH';
  maxAssignScore: number;
  maxAffectiveScore: number;
  maxMidtermScore: number;
  maxFinalScore: number;
  handleUpdateStudentScore: (
    studentCode: string,
    field: keyof StudentScoreItem,
    rawValue: string
  ) => void;
}

export function GradeSheetMobileCards({
  groupedSections,
  formLanguage,
  maxAssignScore,
  maxAffectiveScore,
  maxMidtermScore,
  maxFinalScore,
  handleUpdateStudentScore,
}: GradeSheetMobileCardsProps) {
  if (groupedSections.length === 0) {
    return (
      <div className="block sm:hidden bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
        ไม่พบรายชื่อนิสิตในรายวิชานี้
      </div>
    );
  }

  return (
    <div className="block sm:hidden space-y-4">
      {groupedSections.map((sec) => (
        <div key={`m-sec-${sec.groupKey}`} className="space-y-3">
          {/* Section Header */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold">
            <span className={`px-2.5 py-0.5 rounded-full border text-[11px] ${sec.meta.badgeColor}`}>
              {formLanguage === 'ENGLISH' ? sec.meta.labelEn : sec.meta.labelTh}
            </span>
            <span className="text-slate-500 font-medium">จำนวน {sec.items.length} รูป/คน</span>
          </div>

          {/* Student Score Cards */}
          <div className="space-y-3">
            {sec.items.map((row) => {
              const isIneligible =
                row.eligibilityStatus === 'INELIGIBLE' ||
                row.remark.includes('หมดสิทธิ์');

              return (
                <div
                  key={`m-card-${row.studentCode}`}
                  className={`p-4 rounded-2xl border transition shadow-2xs space-y-3 ${
                    isIneligible
                      ? 'bg-rose-50/70 border-rose-300'
                      : 'bg-white border-slate-200/90'
                  }`}
                >
                  {/* Header: Name, Student Code, Grade Badge */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 leading-snug">
                        {row.indexInMajor}. {row.studentName}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 shadow-2xs">
                          {row.studentCode}
                        </span>
                        {isIneligible && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                            ⚠️ หมดสิทธิ์สอบ
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-500 font-medium">เกรด / รวม</div>
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <span className="font-mono font-black text-sm text-slate-800">
                          {row.totalScore !== null ? row.totalScore : '-'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-indigo-600 text-white shadow-2xs">
                          {row.gradeOverride || (row.totalScore !== null ? calculateMcuGrade(row.totalScore) : '-')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Score Input Boxes in 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* 1. รายงาน */}
                    <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/70 space-y-1">
                      <label className="font-bold text-amber-900 block text-[11px]">
                        รายงาน (เต็ม {maxAssignScore})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={maxAssignScore}
                        step="0.5"
                        value={row.assignScore ?? ''}
                        onChange={(e) =>
                          handleUpdateStudentScore(row.studentCode, 'assignScore', e.target.value)
                        }
                        placeholder="-"
                        className="w-full h-10 px-2 text-center rounded-lg border border-amber-300 bg-white font-mono font-extrabold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    {/* 2. จิตพิสัย */}
                    <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/70 space-y-1">
                      <label className="font-bold text-emerald-900 block text-[11px]">
                        จิตพิสัย (เต็ม {maxAffectiveScore})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={maxAffectiveScore}
                        step="0.5"
                        value={row.affectiveScore ?? ''}
                        onChange={(e) =>
                          handleUpdateStudentScore(row.studentCode, 'affectiveScore', e.target.value)
                        }
                        placeholder="-"
                        className="w-full h-10 px-2 text-center rounded-lg border border-emerald-300 bg-white font-mono font-extrabold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    {/* 3. ระหว่างภาค */}
                    <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-200/70 space-y-1">
                      <label className="font-bold text-sky-900 block text-[11px]">
                        ระหว่างภาค (เต็ม {maxMidtermScore})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={maxMidtermScore}
                        step="0.5"
                        value={row.midtermScore ?? ''}
                        onChange={(e) =>
                          handleUpdateStudentScore(row.studentCode, 'midtermScore', e.target.value)
                        }
                        placeholder="-"
                        className="w-full h-10 px-2 text-center rounded-lg border border-sky-300 bg-white font-mono font-extrabold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>

                    {/* 4. ปลายภาค */}
                    <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-200/70 space-y-1">
                      <label className="font-bold text-purple-900 block text-[11px]">
                        ปลายภาค (เต็ม {maxFinalScore})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={maxFinalScore}
                        step="0.5"
                        value={row.finalScore ?? ''}
                        onChange={(e) =>
                          handleUpdateStudentScore(row.studentCode, 'finalScore', e.target.value)
                        }
                        placeholder="-"
                        className="w-full h-10 px-2 text-center rounded-lg border border-purple-300 bg-white font-mono font-extrabold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  {/* Grade Override & Remarks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-[11px]">เกรด (หรือระบุพิเศษ):</label>
                      <select
                        value={row.gradeOverride}
                        onChange={(e) =>
                          handleUpdateStudentScore(row.studentCode, 'gradeOverride', e.target.value)
                        }
                        className="w-full h-9 px-2 text-xs font-bold rounded-lg border border-slate-300 bg-white cursor-pointer"
                      >
                        <option value="">{row.totalScore !== null ? `${calculateMcuGrade(row.totalScore)} (คำนวณอัตโนมัติ)` : '- เลือกระดับเกรด -'}</option>
                        <option value="A">A</option>
                        <option value="B+">B+</option>
                        <option value="B">B</option>
                        <option value="C+">C+</option>
                        <option value="C">C</option>
                        <option value="D+">D+</option>
                        <option value="D">D</option>
                        <option value="F">F</option>
                        <option value="S">S</option>
                        <option value="U">U</option>
                        <option value="I">I (รอผล)</option>
                        <option value="ขาดสอบ">ขาดสอบ</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-[11px]">หมายเหตุ:</label>
                      <input
                        type="text"
                        value={row.remark}
                        onChange={(e) =>
                          handleUpdateStudentScore(row.studentCode, 'remark', e.target.value)
                        }
                        placeholder="เช่น ส่งงานครบ, ขาดสอบ..."
                        className="w-full h-9 px-2 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
