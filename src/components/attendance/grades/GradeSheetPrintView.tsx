'use client';

import React from 'react';
import { Printer, FileCheck2 } from 'lucide-react';
import { GroupedMajorSection } from '../majorGrouping';
import { ComputedGradeRow } from './types';
import {
  MCU_GRADING_SCALE as GRADING_SCALE,
  calculateGradeSummaryStats,
} from '@/lib/grading/gradeCalculator';

interface GradeSheetPrintViewProps {
  showPrintPreviewOnScreen: boolean;
  formLanguage: 'THAI' | 'ENGLISH';
  resolvedLogoUrl: string;
  currentCourse: any;
  yearLevelText: string;
  majorText: string;
  semesterText: string;
  academicYearText: string;
  creditText: string;
  lecturerName: string;
  departmentHeadName: string;
  submitDateTextTh: string;
  submitDateTextEn: string;
  printFontSizePx: number;
  printRowHeightPx: number;
  groupedSections: GroupedMajorSection<ComputedGradeRow>[];
  printBlankForm: boolean;
  summaryStats: ReturnType<typeof calculateGradeSummaryStats>;
}

function getEnglishOrdinalYear(year?: string | number): string {
  const y = Number(year) || 1;
  if (y === 1) return 'First';
  if (y === 2) return 'Second';
  if (y === 3) return 'Third';
  if (y === 4) return 'Fourth';
  return `${y}th`;
}

export function GradeSheetPrintView({
  showPrintPreviewOnScreen,
  formLanguage,
  resolvedLogoUrl,
  currentCourse,
  yearLevelText,
  majorText,
  semesterText,
  academicYearText,
  creditText,
  lecturerName,
  departmentHeadName,
  submitDateTextTh,
  submitDateTextEn,
  printFontSizePx,
  printRowHeightPx,
  groupedSections,
  printBlankForm,
  summaryStats,
}: GradeSheetPrintViewProps) {
  return (
    <>
      {showPrintPreviewOnScreen && (
        <div className="mx-auto max-w-[210mm] mb-2.5 p-3 rounded-2xl bg-indigo-50/90 border border-indigo-200 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-start gap-2.5">
            <FileCheck2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-extrabold text-indigo-950">
                ตัวอย่างก่อนพิมพ์จริง (A4 Print Preview 1:1)
              </div>
              <div className="text-slate-600 mt-0.5">
                ภาพด้านล่างนี้เป็นฟอร์มเดียวกับเอกสารที่สั่งพิมพ์ลงกระดาษ A4 จริง (แถบสีน้ำเงินนี้จะไม่ถูกพิมพ์ออกกระดาษ)
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์ใบกรอกคะแนน A4</span>
          </button>
        </div>
      )}

      <div className="overflow-x-auto pb-2 print:overflow-visible print:pb-0">
      <div
        id="printable-grade-sheet"
        className={`${
          showPrintPreviewOnScreen ? 'block' : 'hidden print:block'
        } bg-white mx-auto shadow-xl print:shadow-none border border-slate-300 print:border-none text-black`}
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '12mm 14mm 12mm 14mm',
          fontFamily: '"TH Sarabun New", "Sarabun", serif',
          boxSizing: 'border-box',
        }}
      >
        {formLanguage === 'THAI' ? (
          /* ============================================================
             แบบฟอร์มที่ 1: ใบกรอกคะแนนผลการสอบ (ภาคภาษาไทย)
             ============================================================ */
          <div className="flex flex-col justify-between h-full text-black">
            <div>
              {/* Header Section: Left Seal | Center Titles + Left Course Info | Right Grade Scale Box */}
              <div className="grid grid-cols-12 gap-2 items-start">
                {/* Left + Center (9 cols) */}
                <div className="col-span-9 space-y-2">
                  <div className="flex items-start gap-3">
                    {/* MCU Seal in Black & White as configured in system settings */}
                    <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                      <img
                        src={resolvedLogoUrl}
                        alt="ตรามหาวิทยาลัย"
                        className="w-22 h-22 object-contain grayscale contrast-125"
                        style={{ filter: 'grayscale(100%) contrast(125%)' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('/uploads/logo-1793607622279.png')) {
                            target.src = '/uploads/logo-1793607622279.png';
                          }
                        }}
                      />
                    </div>

                    {/* Center University Titles */}
                    <div className="flex-1 text-center pt-1 leading-snug">
                      <div className="text-[18px] font-bold">ใบกรอกคะแนนผลการสอบ</div>
                      <div className="text-[17px] font-bold">
                        มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                      </div>
                      <div className="text-[16px] font-bold">
                        คณะพุทธศาสตร์ ชั้นปีที่ {yearLevelText}
                      </div>
                      <div className="text-[16px] font-bold">
                        {groupedSections.length === 1
                          ? groupedSections[0].meta.labelTh
                          : majorText}
                      </div>
                      <div className="text-[16px] font-bold">
                        ภาคการศึกษาที่ {semesterText} ปีการศึกษา {academicYearText}
                      </div>
                    </div>
                  </div>

                  {/* Course Dotted Info Lines */}
                  <div className="space-y-1.5 text-[14px] pt-1 pl-2">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold shrink-0">วิชา</span>
                      <span className="border-b border-dotted border-black flex-1 px-2 font-bold">
                        {currentCourse.courseName}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold shrink-0">รหัสวิชา</span>
                      <span className="border-b border-dotted border-black flex-1 px-2 font-bold">
                        {currentCourse.courseCode}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold shrink-0">อาจารย์ผู้บรรยาย</span>
                      <span className="border-b border-dotted border-black flex-1 px-2 font-bold">
                        {lecturerName}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold shrink-0">กำหนดส่ง</span>
                      {submitDateTextTh ? (
                        <span className="border-b border-dotted border-black flex-1 px-2">
                          {submitDateTextTh}
                        </span>
                      ) : (
                        <span>
                          วันที่...................เดือน............................................พ.ศ.{' '}
                          {academicYearText}
                        </span>
                      )}
                    </div>
                    <div className="text-center font-bold text-[15px] pt-1">
                      (โปรดกรอกคะแนนด้วยปากกาเท่านั้น ห้ามกรอกด้วยดินสอดำ)
                    </div>
                  </div>
                </div>

                {/* Right Grade Scale Table (3 cols) */}
                <div className="col-span-3">
                  <table className="w-full border-collapse border border-black text-[12px] text-center">
                    <thead>
                      <tr className="font-bold">
                        <th className="border border-black py-1 px-1">ระดับ</th>
                        <th className="border border-black py-1 px-1">ค่าระดับ</th>
                        <th className="border border-black py-1 px-1">เกณฑ์คะแนน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {GRADING_SCALE.map((g) => (
                        <tr key={g.grade}>
                          <td className="border border-black py-0.5 font-semibold">{g.grade}</td>
                          <td className="border border-black py-0.5">{g.level}</td>
                          <td className="border border-black py-0.5">{g.labelTh}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Main Student Score Table (Thai - Grouped by Major & numbered 1..N per Major) */}
              <table
                className="w-full table-fixed border-collapse border border-black mt-2"
                style={{ fontSize: `${printFontSizePx}px` }}
              >
                <thead>
                  <tr className="font-bold text-center">
                    <th className="border border-black w-[30px] py-1.5">ที่</th>
                    <th className="border border-black w-[86px] py-1.5">รหัส</th>
                    <th className="border border-black py-1.5">ชื่อ-ฉายา-นามสกุล</th>
                    <th className="border border-black w-[30px] py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        รายงาน
                      </div>
                    </th>
                    <th className="border border-black w-[30px] py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        จิตพิสัย
                      </div>
                    </th>
                    <th className="border border-black w-[30px] py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        สอบระหว่างภาค
                      </div>
                    </th>
                    <th className="border border-black w-[30px] py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        สอบปลายภาค
                      </div>
                    </th>
                    <th className="border border-black w-[34px] py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        รวม
                      </div>
                    </th>
                    <th className="border border-black w-[40px] py-1.5">ระดับ</th>
                    <th className="border border-black w-[92px] py-1.5">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedSections.map((sec) => (
                    <React.Fragment key={sec.groupKey}>
                      {/* Major Sub-Header Row */}
                      <tr style={{ height: `${Math.max(24, printRowHeightPx - 2)}px` }}>
                        <td
                          colSpan={10}
                          className="border border-black text-center font-bold py-1 bg-slate-50/40"
                          style={{ fontSize: `${printFontSizePx}px` }}
                        >
                          {sec.meta.labelTh}
                        </td>
                      </tr>
                      {sec.items.map((row) => (
                        <tr
                          key={row.studentCode}
                          style={{ height: `${printRowHeightPx}px` }}
                        >
                          <td className="border border-black text-center px-1.5 align-middle">
                            {row.indexInMajor}
                          </td>
                          <td
                            className="border border-black text-center px-1.5 font-mono font-semibold align-middle"
                            style={{ fontSize: `${Math.max(11.5, printFontSizePx - 0.5)}px` }}
                          >
                            {row.studentCode}
                          </td>
                          <td className="border border-black px-2.5 align-middle">{row.studentName}</td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.assignScore !== null &&
                            row.assignScore !== undefined
                              ? row.assignScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.affectiveScore !== null &&
                            row.affectiveScore !== undefined
                              ? row.affectiveScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.midtermScore !== null &&
                            row.midtermScore !== undefined
                              ? row.midtermScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.finalScore !== null &&
                            row.finalScore !== undefined
                              ? row.finalScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 font-bold align-middle">
                            {!printBlankForm && row.totalScore !== null ? row.totalScore : ''}
                          </td>
                          <td className="border border-black text-center px-1 font-bold align-middle">
                            {!printBlankForm ? row.grade : ''}
                          </td>
                          <td
                            className="border border-black text-center px-1.5 align-middle"
                            style={{ fontSize: `${Math.max(11, printFontSizePx - 1)}px` }}
                          >
                            {row.remark}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary & Signatures (Thai) */}
            <div className="pt-3 text-[13px] space-y-1.5 leading-snug">
              <div className="flex items-center justify-between px-4">
                <span className="font-bold">สรุปผลการสอบ</span>
                <span>
                  ผู้เข้าสอบทั้งหมด{' '}
                  <span className="inline-block min-w-[45px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny
                      ? summaryStats.examinedCount
                      : ''}
                  </span>{' '}
                  รูป/คน
                </span>
                <span>
                  ขาดสอบ{' '}
                  <span className="inline-block min-w-[45px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny
                      ? summaryStats.absentOrIneligibleCount
                      : ''}
                  </span>{' '}
                  รูป/คน
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 px-4">
                <div>
                  ได้ระดับ A จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['A'] : ''}
                  </span>{' '}
                  รูป
                </div>
                <div>
                  ได้ระดับ B+ จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['B+'] : ''}
                  </span>{' '}
                  รูป
                </div>
                <div>
                  ได้ระดับ B จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['B'] : ''}
                  </span>{' '}
                  รูป
                </div>

                <div>
                  ได้ระดับ C+ จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['C+'] : ''}
                  </span>{' '}
                  รูป
                </div>
                <div className="col-span-2">
                  ได้ระดับ C จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['C'] : ''}
                  </span>{' '}
                  รูป
                </div>

                <div>
                  ได้ระดับ D+ จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['D+'] : ''}
                  </span>{' '}
                  รูป
                </div>
                <div>
                  ได้ระดับ D จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['D'] : ''}
                  </span>{' '}
                  รูป
                </div>
                <div>
                  ได้ระดับ F จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['F'] : ''}
                  </span>{' '}
                  รูป
                </div>

                <div>
                  ได้ระดับ S จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['S'] : ''}
                  </span>{' '}
                  รูป
                </div>
                <div className="col-span-2">
                  ได้ระดับ U จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['U'] : ''}
                  </span>{' '}
                  รูป
                </div>
              </div>

              <div className="text-center pt-0.5">
                คะแนนสูงสุด{' '}
                <span className="inline-block min-w-[55px] text-center border-b border-dotted border-black font-bold">
                  {!printBlankForm && summaryStats.maxScore !== null ? summaryStats.maxScore : ''}
                </span>{' '}
                รูป/คน &nbsp;&nbsp;&nbsp; คะแนนต่ำสุด{' '}
                <span className="inline-block min-w-[55px] text-center border-b border-dotted border-black font-bold">
                  {!printBlankForm && summaryStats.minScore !== null ? summaryStats.minScore : ''}
                </span>{' '}
                รูป/คน
              </div>

              <div className="text-center font-bold pt-1">รับรองว่าถูกต้องตามนี้</div>

              <div className="grid grid-cols-2 gap-6 pt-3 text-center">
                <div className="space-y-1">
                  <div>
                    ลงชื่อ........................................................หัวหน้าภาค
                  </div>
                  {departmentHeadName && (
                    <div className="text-[12px]">({departmentHeadName})</div>
                  )}
                  <div>............/................../..................</div>
                </div>
                <div className="space-y-1">
                  <div>
                    ลงชื่อ........................................................อาจารย์ผู้บรรยาย
                  </div>
                  {lecturerName && <div className="text-[12px]">({lecturerName})</div>}
                  <div>............/................../..................</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 pt-1">
                **สำหรับผู้ที่หมดสิทธิ์ทุกรายวิชา ได้สำรวจเพื่อสหธรรมิกในชั้นเรียน การให้คะแนนสอบสำหรับผู้ที่ดุลยพินิจของอาจารย์ผู้สอน
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================
             แบบฟอร์มที่ 2: Result of Examination (English Program)
             ============================================================ */
          <div
            className="flex flex-col justify-between h-full text-black"
            style={{ fontFamily: '"Times New Roman", "Sarabun", serif' }}
          >
            <div>
              {/* Header Section: Left Seal | Center Titles + Left Course Info | Right Grade Scale Box */}
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-9 space-y-2">
                  <div className="flex items-start gap-3">
                    {/* MCU Seal in Black & White as configured in system settings */}
                    <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                      <img
                        src={resolvedLogoUrl}
                        alt="MCU Seal"
                        className="w-22 h-22 object-contain grayscale contrast-125"
                        style={{ filter: 'grayscale(100%) contrast(125%)' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('/uploads/logo-1793607622279.png')) {
                            target.src = '/uploads/logo-1793607622279.png';
                          }
                        }}
                      />
                    </div>

                    <div className="flex-1 text-center pt-1 leading-snug">
                      <div className="text-[16px] font-bold">Result of Examination</div>
                      <div className="text-[15px] font-bold">
                        Bachelor of Arts Program (English Program)
                      </div>
                      <div className="text-[14px] font-bold">
                        Faculty of Buddhism, Mahachulalongkornrajavidyalaya University
                      </div>
                      <div className="text-[14px] font-bold">
                        The {getEnglishOrdinalYear(yearLevelText)} Year Students,{' '}
                        {groupedSections.length === 1
                          ? groupedSections[0].meta.labelEn
                          : `Major : ${majorText.replace(/^สาขาวิชา/, '') || 'Buddhist Studies'}`}
                      </div>
                      <div className="text-[14px] font-bold">
                        The {semesterText === '2' ? 'Second' : 'First'} Semester, Academic Year{' '}
                        {academicYearText}/{Number(academicYearText) - 543 || 2026}
                      </div>
                    </div>
                  </div>

                  {/* Course Dotted Info Lines */}
                  <div className="space-y-1.5 text-[13px] pt-1 pl-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-semibold shrink-0">Subject :</span>
                      <span className="border-b border-dotted border-black flex-1 px-2 font-bold">
                        {currentCourse.courseName}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-semibold shrink-0">Code :</span>
                        <span className="border-b border-dotted border-black flex-1 px-2 font-bold">
                          {currentCourse.courseCode}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-semibold shrink-0">Credit :</span>
                        <span className="border-b border-dotted border-black flex-1 px-2 font-bold">
                          {creditText}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-semibold shrink-0">Lecturer :</span>
                      <span className="border-b border-dotted border-black flex-1 px-2 font-bold">
                        {lecturerName}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-semibold shrink-0">Submit on Date :</span>
                      <span className="border-b border-dotted border-black flex-1 px-2">
                        {submitDateTextEn || ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Grade Scale Table (3 cols) */}
                <div className="col-span-3">
                  <table className="w-full border-collapse border border-black text-[12px] text-center">
                    <thead>
                      <tr className="font-bold">
                        <th className="border border-black py-1 px-1">Level</th>
                        <th className="border border-black py-1 px-1">Grade</th>
                        <th className="border border-black py-1 px-1">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {GRADING_SCALE.map((g) => (
                        <tr key={g.grade}>
                          <td className="border border-black py-0.5">{g.level}</td>
                          <td className="border border-black py-0.5 font-semibold">{g.grade}</td>
                          <td className="border border-black py-0.5">{g.labelEn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Main Student Score Table (English - Grouped by Major & numbered 1..N per Major) */}
              <table
                className="w-full table-fixed border-collapse border border-black mt-2"
                style={{ fontSize: `${printFontSizePx}px` }}
              >
                <thead>
                  <tr className="font-bold text-center">
                    <th className="border border-black w-[28px] py-1.5">No.</th>
                    <th className="border border-black w-[84px] py-1.5">Resgis No.</th>
                    <th className="border border-black py-1.5">Name</th>
                    <th className="border border-black w-[44px] py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        Major
                      </div>
                    </th>
                    <th className="border border-black w-[30px] py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        Assign
                      </div>
                    </th>
                    <th className="border border-black w-[30px] py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        Attd.
                      </div>
                    </th>
                    <th className="border border-black w-[30px] py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        Mid-Term
                      </div>
                    </th>
                    <th className="border border-black w-[30px] py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        Final
                      </div>
                    </th>
                    <th className="border border-black w-[34px] py-1.5">Total</th>
                    <th className="border border-black w-[42px] py-1.5">Grade</th>
                    <th className="border border-black w-[78px] py-1.5">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedSections.map((sec) => (
                    <React.Fragment key={sec.groupKey}>
                      <tr style={{ height: `${Math.max(24, printRowHeightPx - 2)}px` }}>
                        <td
                          colSpan={3}
                          className="border border-black text-center font-bold py-1 bg-slate-50/40"
                          style={{ fontSize: `${printFontSizePx}px` }}
                        >
                          {sec.meta.labelEn}
                        </td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                      </tr>
                      {sec.items.map((row) => (
                        <tr
                          key={row.studentCode}
                          style={{ height: `${printRowHeightPx}px` }}
                        >
                          <td className="border border-black text-center px-1.5 align-middle">
                            {row.indexInMajor}
                          </td>
                          <td
                            className="border border-black text-center px-1.5 font-mono font-semibold align-middle"
                            style={{ fontSize: `${Math.max(11.5, printFontSizePx - 0.5)}px` }}
                          >
                            {row.studentCode}
                          </td>
                          <td className="border border-black px-2.5 align-middle">{row.studentName}</td>
                          <td className="border border-black text-center px-1.5 align-middle">
                            {row.majorMeta.shortEn}
                          </td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.assignScore !== null &&
                            row.assignScore !== undefined
                              ? row.assignScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.affectiveScore !== null &&
                            row.affectiveScore !== undefined
                              ? row.affectiveScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.midtermScore !== null &&
                            row.midtermScore !== undefined
                              ? row.midtermScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.finalScore !== null &&
                            row.finalScore !== undefined
                              ? row.finalScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 font-bold align-middle">
                            {!printBlankForm && row.totalScore !== null ? row.totalScore : ''}
                          </td>
                          <td className="border border-black text-center px-1 font-bold align-middle">
                            {!printBlankForm ? row.grade : ''}
                          </td>
                          <td
                            className="border border-black text-center px-1.5 align-middle"
                            style={{ fontSize: `${Math.max(11, printFontSizePx - 1)}px` }}
                          >
                            {row.remark}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary & Signatures (English) */}
            <div className="pt-3 text-[13px] space-y-2 leading-snug">
              <div className="text-center font-bold">Conclusion of Result</div>

              <div className="grid grid-cols-2 gap-8 px-10">
                <div className="space-y-1">
                  <div>
                    Level A :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['A'] : ''}
                    </span>{' '}
                    Persons
                  </div>
                  <div>
                    Level B :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['B'] : ''}
                    </span>{' '}
                    Persons
                  </div>
                  <div>
                    Level C :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['C'] : ''}
                    </span>{' '}
                    Persons
                  </div>
                  <div>
                    Level D :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['D'] : ''}
                    </span>{' '}
                    Persons
                  </div>
                </div>

                <div className="space-y-1">
                  <div>
                    Level B+ :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny
                        ? summaryStats.counts['B+']
                        : ''}
                    </span>{' '}
                    Persons
                  </div>
                  <div>
                    Level C+ :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny
                        ? summaryStats.counts['C+']
                        : ''}
                    </span>{' '}
                    Persons
                  </div>
                  <div>
                    Level D+ :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny
                        ? summaryStats.counts['D+']
                        : ''}
                    </span>{' '}
                    Persons
                  </div>
                  <div>
                    Level F :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['F'] : ''}
                    </span>{' '}
                    Persons
                  </div>
                </div>
              </div>

              <div className="text-center font-bold pt-1">Verification of Truth</div>

              <div className="grid grid-cols-2 gap-6 pt-3 text-center">
                <div className="space-y-1">
                  <div>Signature ........................................................</div>
                  <div className="font-semibold">
                    Director of B.A. in{' '}
                    {groupedSections.length === 1
                      ? groupedSections[0].meta.labelEn.replace(/^Major:\s*/i, '')
                      : majorText.replace(/^สาขาวิชา/, '') || 'Buddhist Studies'}
                  </div>
                  <div>........../............../............</div>
                </div>
                <div className="space-y-1">
                  <div>Signature ........................................................</div>
                  <div className="font-semibold">Lecturer</div>
                  <div>........../............../............</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Print-specific CSS to ensure clean 1-page A4 output */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body * {
            visibility: hidden;
          }
          #printable-grade-sheet,
          #printable-grade-sheet * {
            visibility: visible;
          }
          #printable-grade-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            min-height: auto !important;
            padding: 4mm 6mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </>
  );
}
