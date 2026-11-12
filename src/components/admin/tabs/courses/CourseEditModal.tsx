'use client';

import React from 'react';
import {
  UserCheck,
  UserPlus,
  Save,
  X,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  History,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Course } from '@/types';

export interface CourseEditModalProps {
  editingCourse: Course | null;
  onClose: () => void;
  isSaving: boolean;
  saveSuccessMsg: string | null;
  saveErrorMsg: string | null;
  availableInstructors: string[];
  primaryTeacher: string;
  setPrimaryTeacher: (val: string) => void;
  coTeacher: string;
  setCoTeacher: (val: string) => void;
  isCoordinator: boolean;
  setIsCoordinator: (val: boolean) => void;
  isCustomInstructor: boolean;
  setIsCustomInstructor: (val: boolean) => void;
  customInstructorText: string;
  setCustomInstructorText: (val: string) => void;
  computedInstructorString: string;
  formCourseCode: string;
  setFormCourseCode: (val: string) => void;
  formCourseName: string;
  setFormCourseName: (val: string) => void;
  formCourseNameEn: string;
  setFormCourseNameEn: (val: string) => void;
  formCredits: number;
  setFormCredits: (val: number) => void;
  formDegreeLevel: string;
  setFormDegreeLevel: (val: string) => void;
  formProgramType: 'THAI' | 'ENGLISH';
  setFormProgramType: (val: 'THAI' | 'ENGLISH') => void;
  formAcademicYear: string;
  setFormAcademicYear: (val: string) => void;
  formSemester: number;
  setFormSemester: (val: number) => void;
  formRoom: string;
  setFormRoom: (val: string) => void;
  formDayOfWeek: number;
  setFormDayOfWeek: (val: number) => void;
  formStartTime: string;
  setFormStartTime: (val: string) => void;
  formEndTime: string;
  setFormEndTime: (val: string) => void;
  formChangeReason: string;
  setFormChangeReason: (val: string) => void;
  onSave: () => void;
  onOpenHistory: (course: Course) => void;
  onOpenDelete: (course: Course) => void;
}

export function CourseEditModal({
  editingCourse,
  onClose,
  isSaving,
  saveSuccessMsg,
  saveErrorMsg,
  availableInstructors,
  primaryTeacher,
  setPrimaryTeacher,
  coTeacher,
  setCoTeacher,
  isCoordinator,
  setIsCoordinator,
  isCustomInstructor,
  setIsCustomInstructor,
  customInstructorText,
  setCustomInstructorText,
  computedInstructorString,
  formCourseCode,
  setFormCourseCode,
  formCourseName,
  setFormCourseName,
  formCourseNameEn,
  setFormCourseNameEn,
  formCredits,
  setFormCredits,
  formDegreeLevel,
  setFormDegreeLevel,
  formProgramType,
  setFormProgramType,
  formAcademicYear,
  setFormAcademicYear,
  formSemester,
  setFormSemester,
  formRoom,
  setFormRoom,
  formDayOfWeek,
  setFormDayOfWeek,
  formStartTime,
  setFormStartTime,
  formEndTime,
  setFormEndTime,
  formChangeReason,
  setFormChangeReason,
  onSave,
  onOpenHistory,
  onOpenDelete,
}: CourseEditModalProps) {
  if (!editingCourse) return null;

  return (
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[92vh] space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
                    {editingCourse.courseCode}
                  </span>
                  <span className="text-xs text-slate-400">• {editingCourse.degreeLevel || 'ปริญญาตรี'}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  แก้ไขรายวิชาและสับเปลี่ยนอาจารย์ผู้สอน
                </h3>
                <p className="text-xs text-slate-500">
                  ปรับเปลี่ยนผู้สอนหลัก, ผู้สอนร่วม หรือสับเปลี่ยนอาจารย์ตามปีการศึกษา
                </p>
              </div>
              <button
                onClick={() => onClose()}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification messages */}
            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}
            {saveErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{saveErrorMsg}</span>
              </div>
            )}

            {/* SECTION 1: INSTRUCTOR ASSIGNMENT (จุดเน้นหลัก) */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>การมอบหมายอาจารย์ผู้สอน (Instructor Assignment)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomInstructor(!isCustomInstructor)}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  {isCustomInstructor ? 'สลับกลับเป็นแบบเลือกจากรายชื่อ' : '✏️ กรอกชื่ออิสระ (อาจารย์พิเศษภายนอก)'}
                </button>
              </div>

              {!isCustomInstructor ? (
                <div className="space-y-3">
                  {/* Primary Instructor */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      1. อาจารย์ผู้สอนหลัก (Primary Instructor)
                    </label>
                    <select
                      value={primaryTeacher}
                      onChange={(e) => setPrimaryTeacher(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">-- เลือกอาจารย์ผู้สอนจากคลังคณาจารย์ ({availableInstructors.length} ท่าน) --</option>
                      {availableInstructors.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>

                    {/* Coordinator Checkbox */}
                    <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isCoordinator}
                        onChange={(e) => setIsCoordinator(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-700 font-medium">
                        กำหนดเป็น <strong>อาจารย์ผู้รับผิดชอบรายวิชา</strong> (จะมีเครื่องหมาย <code className="text-emerald-700 font-bold">*</code> ต่อท้ายชื่อ)
                      </span>
                    </label>
                  </div>

                  {/* Co-Instructor */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      2. อาจารย์ผู้สอนร่วม (Co-Instructor / Team Teaching) (ถ้ามี)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={coTeacher}
                        onChange={(e) => setCoTeacher(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="">-- ไม่มีอาจารย์ผู้สอนร่วม (ผู้สอนเดี่ยว) --</option>
                        {availableInstructors
                          .filter((name) => name !== primaryTeacher)
                          .map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                      </select>
                      {coTeacher && (
                        <button
                          type="button"
                          onClick={() => setCoTeacher('')}
                          className="px-2.5 py-1 text-slate-400 hover:text-rose-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition"
                          title="ล้างผู้สอนร่วม"
                        >
                          ลบ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Custom Text Input Mode */
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700">
                    ระบุชื่ออาจารย์ผู้สอนอิสระ (สำหรับอาจารย์พิเศษ หรือผู้สอนหลายท่าน)
                  </label>
                  <input
                    type="text"
                    value={customInstructorText}
                    onChange={(e) => setCustomInstructorText(e.target.value)}
                    placeholder="เช่น พระครูสุตพุทธานุวัตร, ดร.*/ดร.สมชาย ใจดี"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[10px] text-slate-500">
                    คำแนะนำ: ใช้เครื่องหมาย <code className="font-bold text-emerald-700">*</code> ต่อท้ายชื่อผู้รับผิดชอบรายวิชา และคั่นระหว่างผู้สอนด้วย <code className="font-bold text-emerald-700">/</code>
                  </p>
                </div>
              )}

              {/* Real-time Preview Banner */}
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-100/60 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-800">พรีวิวชื่อที่จะบันทึก:</span>
                <span className="font-bold font-mono text-emerald-900">
                  {computedInstructorString || <span className="text-slate-400 font-normal italic">ยังไม่ระบุ</span>}
                </span>
              </div>
            </div>

            {/* SECTION 2: COURSE DETAILS & SCHEDULE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  รหัสวิชา (Course Code)
                </label>
                <input
                  type="text"
                  required
                  value={formCourseCode}
                  onChange={(e) => setFormCourseCode(e.target.value)}
                  placeholder="เช่น 000 101 หรือ 101 322"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ชื่อรายวิชา (ภาษาไทย)
                </label>
                <input
                  type="text"
                  value={formCourseName}
                  onChange={(e) => setFormCourseName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ชื่อรายวิชา (ภาษาอังกฤษ)
                </label>
                <input
                  type="text"
                  value={formCourseNameEn}
                  onChange={(e) => setFormCourseNameEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ระดับการศึกษา
                </label>
                <select
                  value={formDegreeLevel}
                  onChange={(e) => setFormDegreeLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="ปริญญาตรี">ปริญญาตรี</option>
                  <option value="ปริญญาโท">ปริญญาโท</option>
                  <option value="ปริญญาเอก">ปริญญาเอก</option>
                  <option value="ประกาศนียบัตร">ประกาศนียบัตร</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  หลักสูตรภาษา
                </label>
                <select
                  value={formProgramType}
                  onChange={(e) => setFormProgramType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="THAI">🇹🇭 ภาคภาษาไทย</option>
                  <option value="ENGLISH">🌐 ภาคภาษาอังกฤษ (Inter)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ปีการศึกษา
                </label>
                <input
                  type="text"
                  value={formAcademicYear}
                  onChange={(e) => setFormAcademicYear(e.target.value)}
                  placeholder="2569"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ภาคการศึกษา
                </label>
                <select
                  value={formSemester}
                  onChange={(e) => setFormSemester(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value={1}>ภาคเรียนที่ 1</option>
                  <option value={2}>ภาคเรียนที่ 2</option>
                  <option value={3}>ภาคเรียนฤดูร้อน</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ห้องเรียน
                </label>
                <input
                  type="text"
                  value={formRoom}
                  onChange={(e) => setFormRoom(e.target.value)}
                  placeholder="เช่น B401, C205"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  หน่วยกิต
                </label>
                <input
                  type="number"
                  value={formCredits}
                  onChange={(e) => setFormCredits(Number(e.target.value))}
                  min={1}
                  max={12}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Change Reason (Logged automatically into Instructor History when instructor changes) */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-[11px] font-bold text-indigo-900 inline-flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-indigo-600" />
                  <span>เหตุผลการเปลี่ยนอาจารย์ผู้สอน / หมายเหตุประวัติ (ไม่บังคับ)</span>
                </label>
                {(editingCourse.instructorHistory?.length || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenHistory(editingCourse)}
                    className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer"
                  >
                    ดูประวัติเดิม ({editingCourse.instructorHistory!.length} รายการ)
                  </button>
                )}
              </div>
              <input
                type="text"
                value={formChangeReason}
                onChange={(e) => setFormChangeReason(e.target.value)}
                placeholder="เช่น เปลี่ยนผู้สอนประจำภาคการศึกษาใหม่, มอบหมายสอนแทน (ระบบบันทึกประวัติย้อนหลังอัตโนมัติ)"
                className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onOpenDelete(editingCourse)}
                className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบรายวิชานี้</span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>บันทึกการแก้ไข</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
  );
}
