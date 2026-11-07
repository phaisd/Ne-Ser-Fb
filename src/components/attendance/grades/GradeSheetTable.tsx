'use client';

import React from 'react';
import { StudentScoreItem } from '@/types';
import { GroupedMajorSection } from '../majorGrouping';
import { ComputedGradeRow } from './types';
import { calculateMcuGrade } from '@/lib/grading/gradeCalculator';

interface GradeSheetTableProps {
  groupedSections: GroupedMajorSection<ComputedGradeRow>[];
  formLanguage: 'THAI' | 'ENGLISH';
  maxAssignScore: number;
  maxAffectiveScore: number;
  maxMidtermScore: number;
  maxFinalScore: number;
  totalMaxWeight: number;
  handleUpdateStudentScore: (
    studentCode: string,
    field: keyof StudentScoreItem,
    rawValue: string
  ) => void;
}

export function GradeSheetTable({
  groupedSections,
  formLanguage,
  maxAssignScore,
  maxAffectiveScore,
  maxMidtermScore,
  maxFinalScore,
  totalMaxWeight,
  handleUpdateStudentScore,
}: GradeSheetTableProps) {
  return (
    <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-slate-800 text-white">
          <tr>
            <th className="py-3 px-3 text-center w-12 sticky left-0 z-20 bg-slate-800">ที่</th>
            <th className="py-3 px-3 w-28 sticky left-12 z-20 bg-slate-800">รหัสนิสิต</th>
            <th className="py-3 px-3 min-w-[200px] sticky left-40 z-20 bg-slate-800 shadow-[4px_0_8px_rgba(0,0,0,0.2)]">
              ชื่อ-ฉายา-นามสกุล
            </th>
            <th className="py-3 px-2 text-center w-24">
              รายงาน
              <span className="block text-[10px] text-amber-300 font-normal">
                (เต็ม {maxAssignScore})
              </span>
            </th>
            <th className="py-3 px-2 text-center w-24">
              จิตพิสัย
              <span className="block text-[10px] text-emerald-300 font-normal">
                (เต็ม {maxAffectiveScore})
              </span>
            </th>
            <th className="py-3 px-2 text-center w-24">
              ระหว่างภาค
              <span className="block text-[10px] text-sky-300 font-normal">
                (เต็ม {maxMidtermScore})
              </span>
            </th>
            <th className="py-3 px-2 text-center w-24">
              ปลายภาค
              <span className="block text-[10px] text-purple-300 font-normal">
                (เต็ม {maxFinalScore})
              </span>
            </th>
            <th className="py-3 px-2 text-center w-20 bg-slate-900">
              รวม
              <span className="block text-[10px] text-slate-300 font-normal">
                ({totalMaxWeight})
              </span>
            </th>
            <th className="py-3 px-2 text-center w-24 bg-indigo-950">
              ระดับ (Grade)
            </th>
            <th className="py-3 px-3 min-w-[160px]">หมายเหตุ (Remark)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {groupedSections.length === 0 ? (
            <tr>
              <td colSpan={10} className="py-8 text-center text-slate-400">
                ไม่พบรายชื่อนิสิตในรายวิชานี้
              </td>
            </tr>
          ) : (
            groupedSections.map((sec) => (
              <React.Fragment key={sec.groupKey}>
                {/* Major Group Sub-Header Row */}
                <tr className="bg-slate-100/90 border-y border-slate-300">
                  <td colSpan={10} className="py-2 px-4 font-extrabold text-slate-900 text-xs">
                    <div className="sticky left-4 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${sec.meta.badgeColor}`}>
                          {formLanguage === 'ENGLISH' ? sec.meta.labelEn : sec.meta.labelTh}
                        </span>
                        <span className="text-slate-500 font-normal text-[11px]">
                          ({formLanguage === 'ENGLISH' ? sec.meta.labelTh : sec.meta.labelEn})
                        </span>
                      </span>
                      <span className="text-slate-600 font-bold text-[11px]">
                        จำนวน {sec.items.length} รูป/คน (เรียงรหัสนิสิต 1 - {sec.items.length})
                      </span>
                    </div>
                  </td>
                </tr>
                {sec.items.map((row) => {
                  const isIneligible =
                    row.eligibilityStatus === 'INELIGIBLE' ||
                    row.remark.includes('หมดสิทธิ์');
                  const stickyCellBg = isIneligible ? 'bg-rose-50' : 'bg-white';
                  return (
                    <tr
                      key={row.studentCode}
                      className={`hover:bg-slate-50 transition ${
                        isIneligible ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td className={`py-2 px-3 text-center font-mono font-bold text-slate-600 sticky left-0 z-10 ${stickyCellBg}`}>
                        {row.indexInMajor}
                      </td>
                      <td className={`py-2 px-3 font-mono font-extrabold text-sm sm:text-base text-slate-800 tracking-tight whitespace-nowrap sticky left-12 z-10 ${stickyCellBg}`}>
                        {row.studentCode}
                      </td>
                      <td className={`py-2 px-3 font-semibold text-sm sm:text-base text-slate-900 sticky left-40 z-10 ${stickyCellBg} shadow-[4px_0_8px_rgba(0,0,0,0.06)]`}>
                        {row.studentName}
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={maxAssignScore}
                          step="0.5"
                          value={row.assignScore ?? ''}
                          onChange={(e) =>
                            handleUpdateStudentScore(
                              row.studentCode,
                              'assignScore',
                              e.target.value
                            )
                          }
                          placeholder="-"
                          className="min-h-[38px] w-16 sm:w-20 px-2 py-1.5 text-center rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-mono font-bold text-sm text-slate-900 bg-white shadow-2xs"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={maxAffectiveScore}
                          step="0.5"
                          value={row.affectiveScore ?? ''}
                          onChange={(e) =>
                            handleUpdateStudentScore(
                              row.studentCode,
                              'affectiveScore',
                              e.target.value
                            )
                          }
                          placeholder="-"
                          className="min-h-[38px] w-16 sm:w-20 px-2 py-1.5 text-center rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-mono font-bold text-sm text-slate-900 bg-white shadow-2xs"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={maxMidtermScore}
                          step="0.5"
                          value={row.midtermScore ?? ''}
                          onChange={(e) =>
                            handleUpdateStudentScore(
                              row.studentCode,
                              'midtermScore',
                              e.target.value
                            )
                          }
                          placeholder="-"
                          className="min-h-[38px] w-16 sm:w-20 px-2 py-1.5 text-center rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-mono font-bold text-sm text-slate-900 bg-white shadow-2xs"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={maxFinalScore}
                          step="0.5"
                          value={row.finalScore ?? ''}
                          onChange={(e) =>
                            handleUpdateStudentScore(
                              row.studentCode,
                              'finalScore',
                              e.target.value
                            )
                          }
                          placeholder="-"
                          className="min-h-[38px] w-16 sm:w-20 px-2 py-1.5 text-center rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-mono font-bold text-sm text-slate-900 bg-white shadow-2xs"
                        />
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-extrabold text-sm text-slate-900 bg-slate-50">
                        {row.totalScore !== null ? row.totalScore : '-'}
                      </td>
                      <td className="py-1.5 px-2 text-center bg-indigo-50/40">
                        <select
                          value={row.gradeOverride}
                          onChange={(e) =>
                            handleUpdateStudentScore(
                              row.studentCode,
                              'gradeOverride',
                              e.target.value
                            )
                          }
                          className="min-h-[38px] w-20 sm:w-24 px-1.5 py-1.5 text-center rounded-xl border border-indigo-200 bg-white font-extrabold text-indigo-900 text-xs sm:text-sm cursor-pointer shadow-2xs"
                          title="คำนวณเกรดอัตโนมัติ หรือเลือกเกรดพิเศษ (S, U, I, ขาดสอบ)"
                        >
                          <option value="">
                            {row.totalScore !== null
                              ? `${calculateMcuGrade(row.totalScore)} (Auto)`
                              : '-'}
                          </option>
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
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={row.remark}
                          onChange={(e) =>
                            handleUpdateStudentScore(
                              row.studentCode,
                              'remark',
                              e.target.value
                            )
                          }
                          placeholder="เช่น หมดสิทธิ์สอบทุกวิชา"
                          className={`min-h-[38px] w-full px-2.5 py-1.5 rounded-xl border text-xs sm:text-sm ${
                            isIneligible
                              ? 'border-rose-300 bg-rose-50 text-rose-800 font-bold'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
