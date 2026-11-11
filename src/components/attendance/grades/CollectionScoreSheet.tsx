'use client';

import React, { useMemo, useState } from 'react';
import {
  Save,
  Download,
  Printer,
  SlidersHorizontal,
  ArrowRight,
  CheckCircle2,
  Edit3,
} from 'lucide-react';
import { CollectionScoreColumn } from '@/types/attendance';
import {
  calculateCollectionSum,
  clampCollectionCount,
  DEFAULT_COLLECTION_MAX_SCORE,
  MAX_COLLECTION_COUNT,
  MIN_COLLECTION_COUNT,
  scaleCollectionToTarget,
} from '@/lib/grading/collectionScores';
import { downloadXlsx } from '@/lib/utils/xlsx-export';
import { ComputedGradeRowWithMeta } from './types';

interface GroupedMajorSection {
  groupKey: string;
  meta: {
    labelTh: string;
    labelEn: string;
    badgeColor: string;
  };
  items: ComputedGradeRowWithMeta[];
}

export interface CollectionScoreSheetProps {
  courseCode: string;
  courseName?: string;
  semesterText?: string;
  academicYearText?: string;
  lecturerName?: string;
  formLanguage: 'THAI' | 'ENGLISH';
  groupedSections: GroupedMajorSection[];
  collectionCount: number;
  collectionColumns: CollectionScoreColumn[];
  collectionScores: Record<string, (number | null)[]>;
  maxAssignScore: number;
  maxMidtermScore: number;
  saving: boolean;
  onChangeCount: (nextCount: number) => void;
  onUpdateColumn: (index: number, patch: Partial<CollectionScoreColumn>) => void;
  onSetAllMaxScores: (maxScore: number) => void;
  onUpdateCellScore: (studentCode: string, colIndex: number, rawValue: string) => void;
  onApplyToMainSheet: (targetField: 'assignScore' | 'midtermScore') => number;
  onSave: () => void;
}

const COUNT_OPTIONS = Array.from(
  { length: MAX_COLLECTION_COUNT - MIN_COLLECTION_COUNT + 1 },
  (_, i) => MIN_COLLECTION_COUNT + i,
);

export function CollectionScoreSheet({
  courseCode,
  courseName,
  semesterText,
  academicYearText,
  lecturerName,
  formLanguage,
  groupedSections,
  collectionCount,
  collectionColumns,
  collectionScores,
  maxAssignScore,
  maxMidtermScore,
  saving,
  onChangeCount,
  onUpdateColumn,
  onSetAllMaxScores,
  onUpdateCellScore,
  onApplyToMainSheet,
  onSave,
}: CollectionScoreSheetProps) {
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [uniformMaxInput, setUniformMaxInput] = useState(String(DEFAULT_COLLECTION_MAX_SCORE));
  const [transferFeedback, setTransferFeedback] = useState<string | null>(null);

  const safeCount = clampCollectionCount(collectionCount);
  const visibleColumns = useMemo(
    () => collectionColumns.slice(0, safeCount),
    [collectionColumns, safeCount],
  );

  const totalCollectionMax = useMemo(
    () =>
      visibleColumns.reduce(
        (acc, col) => acc + (Number.isFinite(col.maxScore) && col.maxScore > 0 ? col.maxScore : 0),
        0,
      ),
    [visibleColumns],
  );

  const handleApplyUniformMax = () => {
    const parsed = parseFloat(uniformMaxInput);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onSetAllMaxScores(parsed);
  };

  const handleTransfer = (targetField: 'assignScore' | 'midtermScore') => {
    const updatedCount = onApplyToMainSheet(targetField);
    const label = targetField === 'assignScore' ? `รายงาน (เต็ม ${maxAssignScore})` : `ระหว่างภาค (เต็ม ${maxMidtermScore})`;
    setTransferFeedback(
      updatedCount > 0
        ? `โอนคะแนนเก็บเทียบสัดส่วนเข้าสู่ช่อง "${label}" สำเร็จ (${updatedCount} รูป/คน) — อย่าลืมกด "บันทึกคะแนน"`
        : 'ยังไม่มีคะแนนเก็บของนิสิตที่กรอกไว้ จึงยังไม่ได้โอนคะแนน',
    );
    setTimeout(() => setTransferFeedback(null), 6000);
  };

  const handleExportExcel = () => {
    const headers = [
      'ที่ (No.)',
      'สาขาวิชา (Major)',
      'รหัสนิสิต (CodeID)',
      'ชื่อ-ฉายา-นามสกุล (Full Name)',
      ...visibleColumns.map((col) => `${col.label} (${col.maxScore})`),
      `รวมคะแนนเก็บ (${totalCollectionMax})`,
      `เทียบรายงาน (${maxAssignScore})`,
      `เทียบระหว่างภาค (${maxMidtermScore})`,
    ];

    const rows: (string | number | null)[][] = [];
    groupedSections.forEach((sec) => {
      sec.items.forEach((row) => {
        const studentArr = collectionScores[row.studentCode];
        const { sum, filledCount } = calculateCollectionSum(studentArr, safeCount);
        const cellValues = visibleColumns.map((_, idx) => {
          const v = studentArr?.[idx];
          return typeof v === 'number' && Number.isFinite(v) ? v : null;
        });
        rows.push([
          row.indexInMajor,
          sec.meta.labelTh,
          row.studentCode,
          row.studentName,
          ...cellValues,
          filledCount > 0 ? sum : null,
          filledCount > 0 ? scaleCollectionToTarget(sum, totalCollectionMax, maxAssignScore) : null,
          filledCount > 0 ? scaleCollectionToTarget(sum, totalCollectionMax, maxMidtermScore) : null,
        ]);
      });
    });

    const columnWidths = [
      8,
      20,
      16,
      30,
      ...visibleColumns.map(() => 14),
      18,
      18,
      20,
    ];

    downloadXlsx(`ใบคะแนนเก็บ_${courseCode || 'course'}.xlsx`, [
      {
        name: 'ใบคะแนนเก็บ',
        title: `ใบคะแนนเก็บระหว่างภาค ${courseCode} ${courseName || ''}`.trim(),
        subtitle: `ภาคการศึกษา ${semesterText || '-'} / ปีการศึกษา ${academicYearText || '-'} | จำนวน ${safeCount} ครั้ง (รวมเต็ม ${totalCollectionMax} คะแนน)`,
        headers,
        rows,
        columnWidths,
      },
    ]);
  };

  const handlePrintCollectionSheet = () => {
    window.print();
  };

  const totalColSpan = 5 + safeCount;

  return (
    <div className="space-y-4">
      {/* Screen Toolbar & Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5 print:hidden">
        {/* Top Header & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex flex-wrap items-center gap-2">
              <span>📋 ใบคะแนนเก็บระหว่างภาค ({safeCount} ครั้ง)</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                รวมเต็ม {totalCollectionMax} คะแนน
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              บันทึกคะแนนเก็บย่อยได้ตั้งแต่ 5 ถึง 10 ครั้ง พร้อมคำนวณรวมและเทียบสัดส่วนโอนเข้าช่องรายงานหรือระหว่างภาคอัตโนมัติ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowColumnConfig((prev) => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                showColumnConfig
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>ตั้งชื่อช่อง / คะแนนเต็ม</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintCollectionSheet}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ใบคะแนนเก็บ A4</span>
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกคะแนนเก็บ'}</span>
            </button>
          </div>
        </div>

        {/* Assessment Count Selector (5-10) & Transfer Controls */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700">จำนวนครั้งที่เก็บคะแนน (5-10 ครั้ง):</span>
            <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              {COUNT_OPTIONS.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChangeCount(num)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    safeCount === num
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {num} ครั้ง
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">เทียบสัดส่วนโอนคะแนน:</span>
            <button
              type="button"
              onClick={() => handleTransfer('assignScore')}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>โอน</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span>ช่องรายงาน (เต็ม {maxAssignScore})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTransfer('midtermScore')}
              className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>โอน</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span>ช่องระหว่างภาค (เต็ม {maxMidtermScore})</span>
            </button>
          </div>
        </div>

        {transferFeedback && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{transferFeedback}</span>
          </div>
        )}

        {/* Collapsible Column Titles & Max Scores Config */}
        {showColumnConfig && (
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200/70 pb-2.5">
              <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                <span>กำหนดชื่อหัวข้อและคะแนนเต็มแต่ละครั้ง ({safeCount} ครั้ง)</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-indigo-900">ตั้งคะแนนเต็มเท่ากันทุกช่อง:</span>
                <input
                  type="number"
                  min={1}
                  step="1"
                  value={uniformMaxInput}
                  onChange={(e) => setUniformMaxInput(e.target.value)}
                  className="w-16 h-8 px-2 text-center rounded-lg border border-indigo-300 bg-white font-mono font-bold text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleApplyUniformMax}
                  className="px-2.5 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition cursor-pointer"
                >
                  นำไปใช้ทั้งหมด
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {visibleColumns.map((col, idx) => (
                <div key={col.id} className="bg-white p-2.5 rounded-xl border border-indigo-200/80 space-y-1.5">
                  <div className="text-[10px] font-bold text-indigo-600">ช่องที่ {idx + 1}</div>
                  <input
                    type="text"
                    value={col.label}
                    onChange={(e) => onUpdateColumn(idx, { label: e.target.value })}
                    placeholder={`ครั้งที่ ${idx + 1}`}
                    className="w-full h-8 px-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">คะแนนเต็ม:</span>
                    <input
                      type="number"
                      min={1}
                      step="0.5"
                      value={col.maxScore}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value);
                        onUpdateColumn(idx, {
                          maxScore: Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
                        });
                      }}
                      className="w-16 h-7 px-2 text-center rounded-lg border border-slate-300 font-mono font-bold text-xs text-slate-900"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Cards View */}
        <div className="lg:hidden space-y-4">
          {groupedSections.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">ไม่พบรายชื่อนิสิตในรายวิชานี้</div>
          ) : (
            groupedSections.map((sec) => (
              <div key={sec.groupKey} className="space-y-3">
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-300">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${sec.meta.badgeColor}`}>
                    {formLanguage === 'ENGLISH' ? sec.meta.labelEn : sec.meta.labelTh}
                  </span>
                  <span className="text-slate-600 font-bold text-[11px]">
                    {sec.items.length} รูป/คน
                  </span>
                </div>

                {sec.items.map((row) => {
                  const arr = collectionScores[row.studentCode];
                  const { sum, filledCount } = calculateCollectionSum(arr, safeCount);
                  const scaledReport = scaleCollectionToTarget(sum, totalCollectionMax, maxAssignScore);

                  return (
                    <div
                      key={row.studentCode}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <div className="font-extrabold text-sm text-slate-900">
                            {row.indexInMajor}. {row.studentName}
                          </div>
                          <span className="inline-block mt-1 font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                            {row.studentCode}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-slate-500">รวม / เทียบรายงาน</div>
                          <div className="font-mono font-black text-sm text-slate-900">
                            {filledCount > 0 ? `${sum}/${totalCollectionMax}` : '-'}
                            {filledCount > 0 && (
                              <span className="ml-1.5 text-xs text-amber-700">({scaledReport})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {visibleColumns.map((col, idx) => (
                          <div
                            key={col.id}
                            className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 space-y-1"
                          >
                            <label className="font-bold text-slate-700 block text-[11px] truncate">
                              {col.label} <span className="text-slate-400">({col.maxScore})</span>
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={col.maxScore}
                              step="0.5"
                              value={arr?.[idx] ?? ''}
                              onChange={(e) => onUpdateCellScore(row.studentCode, idx, e.target.value)}
                              placeholder="-"
                              className="w-full h-9 px-2 text-center rounded-lg border border-slate-300 bg-white font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="py-2.5 px-2 text-center w-[52px] min-w-[52px] sticky left-0 z-20 bg-slate-800 align-top">
                  <span className="block font-bold leading-tight">ที่</span>
                  <span className="block text-[10px] text-slate-300 font-normal leading-tight mt-0.5">(No.)</span>
                </th>
                <th className="py-2.5 px-2.5 w-[124px] min-w-[124px] sticky left-[52px] z-20 bg-slate-800 shadow-[4px_0_8px_rgba(0,0,0,0.2)] align-top">
                  <span className="block font-bold leading-tight">รหัสนิสิต</span>
                  <span className="block text-[10px] text-slate-300 font-normal leading-tight mt-0.5">(CodeID)</span>
                </th>
                <th className="py-2.5 px-3 min-w-[190px] align-top">
                  <span className="block font-bold leading-tight">ชื่อ-ฉายา-นามสกุล</span>
                  <span className="block text-[10px] text-slate-300 font-normal leading-tight mt-0.5">(Full Name)</span>
                </th>
                {visibleColumns.map((col) => (
                  <th key={col.id} className="py-2.5 px-2 text-center min-w-[80px] align-top">
                    <span className="block truncate max-w-[92px] mx-auto leading-tight">{col.label}</span>
                    <span className="block text-[10px] text-amber-300 font-normal leading-tight mt-0.5">
                      (เต็ม {col.maxScore})
                    </span>
                  </th>
                ))}
                <th className="py-2.5 px-2.5 text-center min-w-[78px] bg-slate-900 align-top">
                  <span className="block font-bold leading-tight">รวม</span>
                  <span className="block text-[10px] text-slate-300 font-normal leading-tight mt-0.5">(Total)</span>
                  <span className="block text-[10px] text-slate-300 font-normal leading-tight mt-0.5">
                    ({totalCollectionMax})
                  </span>
                </th>
                <th className="py-2.5 px-2.5 text-center min-w-[96px] bg-indigo-950 align-top">
                  <span className="block font-bold leading-tight">เทียบสัดส่วน</span>
                  <span className="block text-[10px] text-indigo-200 font-normal leading-tight mt-0.5">(Scaled)</span>
                  <span className="block text-[10px] text-amber-300 font-normal leading-tight mt-0.5">
                    รายงาน ({maxAssignScore})
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {groupedSections.length === 0 ? (
                <tr>
                  <td colSpan={totalColSpan} className="py-8 text-center text-slate-400">
                    ไม่พบรายชื่อนิสิตในรายวิชานี้
                  </td>
                </tr>
              ) : (
                groupedSections.map((sec) => (
                  <React.Fragment key={sec.groupKey}>
                    <tr className="bg-slate-100/90 border-y border-slate-300">
                      <td colSpan={totalColSpan} className="py-2 px-4 font-extrabold text-slate-900 text-xs">
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
                            จำนวน {sec.items.length} รูป/คน
                          </span>
                        </div>
                      </td>
                    </tr>
                    {sec.items.map((row) => {
                      const arr = collectionScores[row.studentCode];
                      const { sum, filledCount } = calculateCollectionSum(arr, safeCount);
                      const scaledAssign = scaleCollectionToTarget(
                        sum,
                        totalCollectionMax,
                        maxAssignScore,
                      );

                      return (
                        <tr key={row.studentCode} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-2 w-[52px] min-w-[52px] text-center font-mono font-bold text-slate-600 sticky left-0 z-10 bg-white">
                            {row.indexInMajor}
                          </td>
                          <td className="py-2 px-2.5 w-[124px] min-w-[124px] font-mono font-extrabold text-sm text-slate-800 tracking-tight whitespace-nowrap sticky left-[52px] z-10 bg-white shadow-[4px_0_8px_rgba(0,0,0,0.06)]">
                            {row.studentCode}
                          </td>
                          <td className="py-2 px-3 font-semibold text-sm text-slate-900">
                            {row.studentName}
                          </td>
                          {visibleColumns.map((col, idx) => (
                            <td key={col.id} className="py-1.5 px-1.5 text-center">
                              <input
                                type="number"
                                min={0}
                                max={col.maxScore}
                                step="0.5"
                                value={arr?.[idx] ?? ''}
                                onChange={(e) => onUpdateCellScore(row.studentCode, idx, e.target.value)}
                                placeholder="-"
                                className="min-h-[36px] w-16 px-1.5 py-1 text-center rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-mono font-bold text-sm text-slate-900 bg-white shadow-2xs"
                              />
                            </td>
                          ))}
                          <td className="py-2 px-2.5 text-center font-mono font-black text-slate-900 bg-slate-50">
                            {filledCount > 0 ? sum : '-'}
                          </td>
                          <td className="py-2 px-2.5 text-center font-mono font-extrabold text-amber-800 bg-amber-50/60">
                            {filledCount > 0 ? scaledAssign : '-'}
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
      </div>

      {/* Printable A4 Collection Score Sheet */}
      <div className="hidden print:block bg-white text-black p-4 text-[11px] font-serif">
        <div className="text-center space-y-1 mb-3 border-b border-black pb-2">
          <div className="font-bold text-sm">
            แบบบันทึกคะแนนเก็บระหว่างภาค ({safeCount} ครั้ง) / Continuous Assessment Score Sheet
          </div>
          <div className="text-xs">
            รายวิชา (Course): <span className="font-bold">{courseCode}</span> {courseName || ''} | ภาคการศึกษา/ปี: {semesterText || '-'}/{academicYearText || '-'}
          </div>
          <div className="text-[11px]">
            อาจารย์ผู้สอน (Instructor): {lecturerName || '-'} | คะแนนเต็มรวม: {totalCollectionMax} คะแนน
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-[10px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-black px-1.5 py-1 text-center w-8">ที่</th>
              <th className="border border-black px-1.5 py-1 text-center w-24">รหัสนิสิต</th>
              <th className="border border-black px-2 py-1 text-left">ชื่อ-ฉายา-นามสกุล</th>
              {visibleColumns.map((col) => (
                <th key={col.id} className="border border-black px-1 py-1 text-center">
                  <div>{col.label}</div>
                  <div className="font-normal">({col.maxScore})</div>
                </th>
              ))}
              <th className="border border-black px-1.5 py-1 text-center">รวม ({totalCollectionMax})</th>
              <th className="border border-black px-1.5 py-1 text-center">รายงาน ({maxAssignScore})</th>
            </tr>
          </thead>
          <tbody>
            {groupedSections.map((sec) => (
              <React.Fragment key={sec.groupKey}>
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={totalColSpan} className="border border-black px-2 py-1">
                    {sec.meta.labelTh} ({sec.items.length} รูป/คน)
                  </td>
                </tr>
                {sec.items.map((row) => {
                  const arr = collectionScores[row.studentCode];
                  const { sum, filledCount } = calculateCollectionSum(arr, safeCount);
                  const scaledAssign = scaleCollectionToTarget(sum, totalCollectionMax, maxAssignScore);
                  return (
                    <tr key={row.studentCode}>
                      <td className="border border-black px-1 py-1 text-center">{row.indexInMajor}</td>
                      <td className="border border-black px-1.5 py-1 text-center font-mono">{row.studentCode}</td>
                      <td className="border border-black px-2 py-1">{row.studentName}</td>
                      {visibleColumns.map((col, idx) => (
                        <td key={col.id} className="border border-black px-1 py-1 text-center font-mono">
                          {typeof arr?.[idx] === 'number' ? arr[idx] : ''}
                        </td>
                      ))}
                      <td className="border border-black px-1 py-1 text-center font-mono font-bold">
                        {filledCount > 0 ? sum : ''}
                      </td>
                      <td className="border border-black px-1 py-1 text-center font-mono font-bold">
                        {filledCount > 0 ? scaledAssign : ''}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
