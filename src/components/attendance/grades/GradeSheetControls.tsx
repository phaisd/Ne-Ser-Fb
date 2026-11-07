'use client';

import React, { useRef } from 'react';
import {
  Printer,
  Save,
  Sparkles,
  Upload,
  Download,
  SlidersHorizontal,
  CheckCircle2,
  Globe,
  Edit3,
  BookOpen,
} from 'lucide-react';

interface GradeSheetControlsProps {
  currentCourse: any;
  availableCourses: any[];
  selectedCourseCode: string;
  handleCourseChange: (code: string) => void;
  formLanguage: 'THAI' | 'ENGLISH';
  setFormLanguage: (lang: 'THAI' | 'ENGLISH') => void;
  printBlankForm: boolean;
  setPrintBlankForm: (val: boolean) => void;
  saving: boolean;
  saveMessage: string | null;
  setSaveMessage: (msg: string | null) => void;
  showConfigPanel: boolean;
  setShowConfigPanel: (val: boolean | ((prev: boolean) => boolean)) => void;
  handleSyncFromAttendance: () => void;
  handleExportCsv: () => void;
  handleImportCsv: (file: File) => void;
  handleSaveGradeSheet: () => void;
  // Score weights
  maxAssignScore: number;
  setMaxAssignScore: (val: number) => void;
  maxAffectiveScore: number;
  setMaxAffectiveScore: (val: number) => void;
  maxMidtermScore: number;
  setMaxMidtermScore: (val: number) => void;
  maxFinalScore: number;
  setMaxFinalScore: (val: number) => void;
  totalMaxWeight: number;
  // Header metadata
  yearLevelText: string;
  setYearLevelText: (val: string) => void;
  majorText: string;
  setMajorText: (val: string) => void;
  semesterText: string;
  setSemesterText: (val: string) => void;
  academicYearText: string;
  setAcademicYearText: (val: string) => void;
  creditText: string;
  setCreditText: (val: string) => void;
  lecturerName: string;
  setLecturerName: (val: string) => void;
  departmentHeadName: string;
  setDepartmentHeadName: (val: string) => void;
  submitDateTextTh: string;
  setSubmitDateTextTh: (val: string) => void;
  submitDateTextEn: string;
  setSubmitDateTextEn: (val: string) => void;
}

export function GradeSheetControls({
  currentCourse,
  availableCourses,
  selectedCourseCode,
  handleCourseChange,
  formLanguage,
  setFormLanguage,
  printBlankForm,
  setPrintBlankForm,
  saving,
  saveMessage,
  setSaveMessage,
  showConfigPanel,
  setShowConfigPanel,
  handleSyncFromAttendance,
  handleExportCsv,
  handleImportCsv,
  handleSaveGradeSheet,
  maxAssignScore,
  setMaxAssignScore,
  maxAffectiveScore,
  setMaxAffectiveScore,
  maxMidtermScore,
  setMaxMidtermScore,
  maxFinalScore,
  setMaxFinalScore,
  totalMaxWeight,
  yearLevelText,
  setYearLevelText,
  majorText,
  setMajorText,
  semesterText,
  setSemesterText,
  academicYearText,
  setAcademicYearText,
  creditText,
  setCreditText,
  lecturerName,
  setLecturerName,
  departmentHeadName,
  setDepartmentHeadName,
  submitDateTextTh,
  setSubmitDateTextTh,
  submitDateTextEn,
  setSubmitDateTextEn,
}: GradeSheetControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5 print:hidden">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              📝 ระบบใบกรอกคะแนนผลการสอบ (Official MCU Grade Sheet)
            </span>
            <span className="text-xs text-slate-500">
              จัดกลุ่มตามสาขาวิชาอัตโนมัติ (พระพุทธศาสนา • วิปัสสนาภาวนา • ศาสนาและปรัชญา • บาลีสันสกฤต)
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            {currentCourse.courseCode} — {currentCourse.courseName}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Language Form Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFormLanguage('THAI')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                formLanguage === 'THAI'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇹🇭 ใบกรอกคะแนน (ไทย)
            </button>
            <button
              type="button"
              onClick={() => setFormLanguage('ENGLISH')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                formLanguage === 'ENGLISH'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Result of Exam (EN)</span>
            </button>
          </div>

          {/* Print Mode Selector: With Scores vs Blank Form for Pen */}
          <button
            type="button"
            onClick={() => setPrintBlankForm(!printBlankForm)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              printBlankForm
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="สลับระหว่างพิมพ์คะแนนที่กรอกแล้ว หรือพิมพ์ตารางช่องว่างสำหรับกรอกด้วยปากกา"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{printBlankForm ? 'โหมดพิมพ์: ช่องว่างกรอกปากกา' : 'โหมดพิมพ์: แสดงคะแนนที่กรอก'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ใบกรอกคะแนน A4</span>
          </button>
        </div>
      </div>

      {/* Save Notification */}
      {saveMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveMessage}</span>
          </div>
          <button onClick={() => setSaveMessage(null)} className="text-emerald-700 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Course Cards Grid & Quick Actions */}
      <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>คลิกเลือกรายวิชาที่รับผิดชอบสอน ({availableCourses.length} วิชา):</span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSyncFromAttendance}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="คำนวณคะแนนจิตพิสัยจากเวลาเรียนจริง และดึงหมายเหตุหมดสิทธิ์สอบอัตโนมัติ"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ดึงคะแนนจิตพิสัย & สิทธิ์สอบอัตโนมัติ</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConfigPanel((prev) => !prev)}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>ตั้งค่าหัวกระดาษ/สัดส่วนคะแนน</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-sky-700 border border-sky-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImportCsv(file);
                  e.target.value = '';
                }
              }}
            />

            <button
              type="button"
              onClick={handleSaveGradeSheet}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกคะแนน'}</span>
            </button>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {availableCourses.map((c, idx) => {
            const sKey = (c as any).sectionKey || c.courseCode;
            const isSelected =
              sKey === selectedCourseCode || (!(c as any).sectionKey && c.courseCode === selectedCourseCode);
            const isEn =
              (c as any).programType === 'ENGLISH' ||
              (c as any).programType === 'INTERNATIONAL' ||
              /inter|eng|english|นานาชาติ/i.test(c.timetableTitle || '') ||
              /^[A-Za-z0-9\s:,\-\(\)\/\.]+$/.test((c.courseName || '').trim());

            return (
              <button
                key={`${sKey}-${idx}`}
                type="button"
                onClick={() => handleCourseChange(sKey)}
                className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-500/30'
                    : 'bg-white hover:bg-indigo-50/50 text-slate-800 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-50 text-indigo-800 border border-indigo-200/70'
                      }`}
                    >
                      {c.courseCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : isEn
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isEn ? '🌐 Inter/EN' : '🇹🇭 ภาคไทย'} • ปี {c.yearLevel || 1}
                    </span>
                  </div>
                  <div
                    className={`font-bold text-xs mt-1.5 line-clamp-1 ${
                      isSelected ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {c.courseName}
                  </div>
                </div>

                <div
                  className={`flex items-center justify-between text-[10px] pt-1 border-t ${
                    isSelected ? 'border-white/20 text-indigo-100' : 'border-slate-100 text-slate-500'
                  }`}
                >
                  <span className="truncate">
                    {c.dayOfWeek || ''} {c.startTime ? `${c.startTime}-${c.endTime}` : ''}
                  </span>
                  <span className="font-semibold shrink-0 ml-1">ห้อง {c.room || '-'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible Header & Score Weights Configuration */}
      {showConfigPanel && (
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-4 text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-indigo-200/70 pb-2">
            <span className="font-bold text-indigo-950">
              ⚙️ ตั้งค่าข้อมูลหัวกระดาษใบกรอกคะแนน และสัดส่วนคะแนนเต็ม (รวม {totalMaxWeight} คะแนน)
            </span>
            {totalMaxWeight !== 100 && (
              <span className="text-rose-600 font-bold">
                ⚠️ ผลรวมคะแนนเต็มปัจจุบันคือ {totalMaxWeight} คะแนน (แนะนำให้รวมได้ 100 คะแนน)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">คะแนนเต็ม รายงาน (Assign):</label>
              <input
                type="number"
                value={maxAssignScore}
                onChange={(e) => setMaxAssignScore(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">คะแนนเต็ม จิตพิสัย (Attd.):</label>
              <input
                type="number"
                value={maxAffectiveScore}
                onChange={(e) => setMaxAffectiveScore(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">คะแนนเต็ม สอบระหว่างภาค:</label>
              <input
                type="number"
                value={maxMidtermScore}
                onChange={(e) => setMaxMidtermScore(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">คะแนนเต็ม สอบปลายภาค:</label>
              <input
                type="number"
                value={maxFinalScore}
                onChange={(e) => setMaxFinalScore(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">ชั้นปีที่ (Year):</label>
              <input
                type="text"
                value={yearLevelText}
                onChange={(e) => setYearLevelText(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">สาขาวิชาหลักบนหัวกระดาษ:</label>
              <input
                type="text"
                value={majorText}
                onChange={(e) => setMajorText(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">ภาคการศึกษา:</label>
              <input
                type="text"
                value={semesterText}
                onChange={(e) => setSemesterText(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">ปีการศึกษา:</label>
              <input
                type="text"
                value={academicYearText}
                onChange={(e) => setAcademicYearText(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">หน่วยกิต (Credit):</label>
              <input
                type="text"
                value={creditText}
                onChange={(e) => setCreditText(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">อาจารย์ผู้บรรยาย (Lecturer):</label>
              <input
                type="text"
                value={lecturerName}
                onChange={(e) => setLecturerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">ชื่อหัวหน้าภาค / ผู้อำนวยการหลักสูตร (ถ้ามี):</label>
              <input
                type="text"
                value={departmentHeadName}
                onChange={(e) => setDepartmentHeadName(e.target.value)}
                placeholder="เว้นว่างไว้เพื่อลงนามด้วยปากกา"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">กำหนดส่ง (Submit Date):</label>
              <input
                type="text"
                value={formLanguage === 'ENGLISH' ? submitDateTextEn : submitDateTextTh}
                onChange={(e) =>
                  formLanguage === 'ENGLISH'
                    ? setSubmitDateTextEn(e.target.value)
                    : setSubmitDateTextTh(e.target.value)
                }
                placeholder="เว้นว่างไว้เพื่อแสดงเส้นประสำหรับกรอกเอง"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
