'use client';

import React, { useRef } from 'react';
import {
  FileUp,
  X,
  FileSpreadsheet,
  Download,
  FileText,
  Upload,
  CheckCircle2,
  Plus,
  Edit2,
  BookOpen,
  GraduationCap,
  User,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  Course,
  CourseModalMode,
  DAYS_OF_WEEK,
  DEGREE_LEVELS,
  MAJORS,
  parseCSVToCourses,
  downloadSampleCourseTemplate,
} from './types';

export interface CourseModalsProps {
  modalMode: CourseModalMode;
  setModalMode: (mode: CourseModalMode) => void;
  targetCourse: Course | null;
  formData: Partial<Course>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Course>>>;
  instructors: string[];
  submitting: boolean;
  onSaveCourse: (e: React.FormEvent) => void;
  onDeleteCourse: () => void;
  importInputType: 'FILE' | 'TEXT';
  setImportInputType: (t: 'FILE' | 'TEXT') => void;
  importRawText: string;
  setImportRawText: (val: string) => void;
  importParsedCourses: Course[];
  setImportParsedCourses: (courses: Course[]) => void;
  importMode: 'UPSERT' | 'APPEND';
  setImportMode: (mode: 'UPSERT' | 'APPEND') => void;
  onExecuteImport: () => void;
  canManage?: boolean;
}

export function CourseModals({
  modalMode,
  setModalMode,
  targetCourse,
  formData,
  setFormData,
  instructors,
  submitting,
  onSaveCourse,
  onDeleteCourse,
  importInputType,
  setImportInputType,
  importRawText,
  setImportRawText,
  importParsedCourses,
  setImportParsedCourses,
  importMode,
  setImportMode,
  onExecuteImport,
  canManage = false,
}: CourseModalsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportRawText(text);
      const parsed = parseCSVToCourses(text);
      setImportParsedCourses(parsed);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text: string) => {
    setImportRawText(text);
    const parsed = parseCSVToCourses(text);
    setImportParsedCourses(parsed);
  };

  if (modalMode === 'NONE') return null;

  return (
    <>
      {/* MODAL: IMPORT CSV / EXCEL */}
      {modalMode === 'IMPORT' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    นำเข้าข้อมูลรายวิชา (Import CSV / Excel)
                  </h3>
                  <p className="text-xs text-slate-500">
                    อัปโหลดไฟล์ CSV หรือคัดลอกตารางจาก Excel มาวางเพื่อนำเข้าสู่ฐานข้อมูลระบบ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalMode('NONE')}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download Card */}
            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>ยังไม่มีรูปแบบตาราง?</span>
                </div>
                <p className="text-blue-700">
                  ดาวน์โหลดไฟล์ต้นแบบตัวอย่าง CSV (เปิดใน Excel ได้ทันที) เพื่อกรอกข้อมูล
                </p>
              </div>
              <button
                type="button"
                onClick={downloadSampleCourseTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shrink-0 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดแม่แบบ CSV</span>
              </button>
            </div>

            {/* Input Type Selector */}
            <div className="space-y-3">
              <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setImportInputType('FILE')}
                  className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    importInputType === 'FILE'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileUp className="w-4 h-4 text-blue-600" />
                  <span>เลือกไฟล์ (.csv, .txt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportInputType('TEXT')}
                  className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    importInputType === 'TEXT'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>คัดลอกตารางจาก Excel มาวาง</span>
                </button>
              </div>

              {importInputType === 'FILE' ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition hover:bg-blue-50/20 space-y-2"
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                  </div>
                  <div className="text-xs text-slate-400">
                    รองรับไฟล์ .csv (UTF-8) หรือไฟล์ข้อความที่คั่นด้วยจุลภาค
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .txt, .tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    วางข้อมูล CSV หรือคัดลอกจาก Excel (Ctrl+V):
                  </label>
                  <textarea
                    rows={6}
                    placeholder={`รหัสวิชา,ชื่อรายวิชา (ไทย),ชื่อรายวิชา (อังกฤษ),หน่วยกิต,หลักสูตร,อาจารย์ผู้สอน\n000 113,ตรรกศาสตร์เบื้องต้น,Introduction to Logic,3,THAI,พระมหาดวงเด่น ฐิตญาโณ`}
                    value={importRawText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Import Mode Options */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700">โหมดการนำเข้าข้อมูล:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                    importMode === 'UPSERT'
                      ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'UPSERT'}
                    onChange={() => setImportMode('UPSERT')}
                    className="mt-0.5"
                  />
                  <div>
                    <div>อัปเดตข้อมูลเดิม & เพิ่มใหม่ (Upsert)</div>
                    <div className="text-[11px] font-normal text-slate-500">
                      หากมีรหัสวิชาเดิมอยู่แล้วจะเขียนทับข้อมูลใหม่ (แนะนำ)
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                    importMode === 'APPEND'
                      ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'APPEND'}
                    onChange={() => setImportMode('APPEND')}
                    className="mt-0.5"
                  />
                  <div>
                    <div>เพิ่มต่อท้ายทั้งหมด (Append Only)</div>
                    <div className="text-[11px] font-normal text-slate-500">
                      เพิ่มทุกแถวเป็นรายการใหม่โดยไม่ตรวจวิชาซ้ำ
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Parsed Preview Table */}
            {importParsedCourses.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    ตรวจพบ {importParsedCourses.length} รายวิชาที่พร้อมนำเข้า
                  </span>
                  <span className="text-slate-400 font-normal">
                    (แสดงตัวอย่าง 5 รายการแรก)
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs max-h-48 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase border-b">
                      <tr>
                        <th className="px-3 py-2">รหัสวิชา</th>
                        <th className="px-3 py-2">ชื่อรายวิชา</th>
                        <th className="px-3 py-2">หลักสูตร</th>
                        <th className="px-3 py-2">หน่วยกิต</th>
                        <th className="px-3 py-2">อาจารย์ผู้สอน</th>
                        <th className="px-3 py-2">ห้องเรียน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importParsedCourses.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono font-bold text-blue-600">
                            {row.courseCode}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-800">
                            <div>{row.courseName}</div>
                            {row.courseNameEn && (
                              <div className="text-[10px] text-slate-400">{row.courseNameEn}</div>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row.programType === 'ENGLISH'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {row.programType === 'ENGLISH' ? '🌐 EN' : '🇹🇭 TH'}
                            </span>
                          </td>
                          <td className="px-3 py-2">{row.credits} นก.</td>
                          <td className="px-3 py-2 truncate max-w-[120px]">
                            {row.instructor || '-'}
                          </td>
                          <td className="px-3 py-2">{row.room || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalMode('NONE')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={submitting || importParsedCourses.length === 0}
                onClick={onExecuteImport}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-500/20 transition disabled:opacity-50 flex items-center gap-2"
              >
                <FileUp className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'กำลังนำเข้าข้อมูล...'
                    : `ยืนยันนำเข้าข้อมูล (${importParsedCourses.length} รายการ)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD OR EDIT COURSE */}
      {(modalMode === 'CREATE' || modalMode === 'EDIT') && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  {modalMode === 'CREATE' ? (
                    <Plus className="w-5 h-5" />
                  ) : (
                    <Edit2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {modalMode === 'CREATE'
                      ? 'เพิ่มทะเบียนรายวิชาใหม่'
                      : `แก้ไขข้อมูลรายวิชา: ${targetCourse?.courseCode}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    กรอกข้อมูลหลักสูตร หน่วยกิต และรายละเอียดตารางสอนเพื่อดึงเข้าตารางสอนอาจารย์
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalMode('NONE')}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSaveCourse} className="space-y-6">
              {/* SECTION 1: ข้อมูลทั่วไปรายวิชา */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  1. ข้อมูลพื้นฐานรายวิชา
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      รหัสวิชา (Course Code) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น 000 113"
                      value={formData.courseCode || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, courseCode: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      จำนวนหน่วยกิต (Credits) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={12}
                      placeholder="3"
                      value={formData.credits || 3}
                      onChange={(e) =>
                        setFormData({ ...formData, credits: parseInt(e.target.value, 10) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ตอนเรียน / Section
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น 1 หรือ EN"
                      value={formData.section || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, section: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อรายวิชา (ภาษาไทย) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น ตรรกศาสตร์เบื้องต้น"
                      value={formData.courseName || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, courseName: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อรายวิชา (ภาษาอังกฤษ)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น Introduction to Logic"
                      value={formData.courseNameEn || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, courseNameEn: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: หลักสูตรและระดับการศึกษา */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  2. หลักสูตรและระดับการศึกษา
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ประเภทหลักสูตร <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.programType || 'THAI'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          programType: e.target.value as any,
                          section:
                            e.target.value === 'ENGLISH' && (!formData.section || formData.section === '1')
                              ? 'EN'
                              : formData.section,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="THAI">🇹🇭 หลักสูตรภาคภาษาไทย (Thai Program)</option>
                      <option value="ENGLISH">🌐 หลักสูตรภาคภาษาอังกฤษ (English / International)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ระดับหลักสูตร (Degree Level)
                    </label>
                    <select
                      value={formData.degreeLevel || 'ปริญญาตรี'}
                      onChange={(e) =>
                        setFormData({ ...formData, degreeLevel: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {DEGREE_LEVELS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      สาขาวิชา (Major)
                    </label>
                    <input
                      type="text"
                      list="major-list"
                      placeholder="เช่น พระพุทธศาสนา, ศาสนาและปรัชญา"
                      value={formData.major || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, major: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <datalist id="major-list">
                      {MAJORS.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ระดับชั้นปีที่กำหนด (Year Level)
                    </label>
                    <select
                      value={formData.yearLevel || 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          yearLevel: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value={1}>ชั้นปีที่ 1</option>
                      <option value={2}>ชั้นปีที่ 2</option>
                      <option value={3}>ชั้นปีที่ 3</option>
                      <option value={4}>ชั้นปีที่ 4</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: อาจารย์ผู้สอนและตารางสอน */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  3. อาจารย์ผู้สอนและตารางสอน (เพื่อดึงเข้าตารางสอน)
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อาจารย์ผู้สอน / ผู้รับผิดชอบรายวิชา (Instructor)
                  </label>
                  <input
                    type="text"
                    list="instructor-list"
                    placeholder="พิมพ์ชื่ออาจารย์ผู้สอน หรือเลือกจากรายการที่มีอยู่..."
                    value={formData.instructor || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, instructor: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <datalist id="instructor-list">
                    {instructors.map((inst, idx) => (
                      <option key={idx} value={inst} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ปีการศึกษา
                    </label>
                    <input
                      type="text"
                      placeholder="2569"
                      value={formData.academicYear || '2569'}
                      onChange={(e) =>
                        setFormData({ ...formData, academicYear: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ภาคการศึกษา (Semester)
                    </label>
                    <select
                      value={formData.semester || 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          semester: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                    >
                      <option value={1}>ภาคเรียนที่ 1</option>
                      <option value={2}>ภาคเรียนที่ 2</option>
                      <option value={3}>ภาคฤดูร้อน</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ห้องเรียน (Room)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น D 516/1"
                      value={formData.room || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, room: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      วันที่เรียน
                    </label>
                    <select
                      value={formData.dayOfWeek || 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dayOfWeek: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เวลาเริ่ม
                    </label>
                    <input
                      type="text"
                      placeholder="09.00"
                      value={formData.startTime || '09.00'}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เวลาสิ้นสุด
                    </label>
                    <input
                      type="text"
                      placeholder="11.30"
                      value={formData.endTime || '11.30'}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    คำอธิบายรายวิชา (สังเขป)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ระบุวัตถุประสงค์ คำอธิบายรายวิชา หรือข้อกำหนดอื่น ๆ..."
                    value={formData.description || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode('NONE')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  {submitting
                    ? 'กำลังบันทึกข้อมูล...'
                    : modalMode === 'CREATE'
                    ? 'บันทึกเพิ่มรายวิชา'
                    : 'บันทึกการแก้ไขรายวิชา'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW COURSE DETAILS */}
      {modalMode === 'VIEW' && targetCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                  {targetCourse.courseCode}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2 leading-snug">
                  {targetCourse.courseName}
                </h3>
                {targetCourse.courseNameEn && (
                  <p className="text-sm text-slate-400 mt-0.5">{targetCourse.courseNameEn}</p>
                )}
              </div>
              <button
                onClick={() => setModalMode('NONE')}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium">ประเภทหลักสูตร:</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {targetCourse.programType === 'ENGLISH'
                    ? '🌐 หลักสูตรภาคภาษาอังกฤษ (EN)'
                    : '🇹🇭 หลักสูตรภาคภาษาไทย'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium">ระดับหลักสูตร:</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {targetCourse.degreeLevel || 'ปริญญาตรี'}{' '}
                  {targetCourse.yearLevel && `(ปี ${targetCourse.yearLevel})`}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium">หน่วยกิต:</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {targetCourse.credits} หน่วยกิต
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium">สาขาวิชา:</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {targetCourse.major || 'พระพุทธศาสนา'}
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2 text-xs">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                อาจารย์ผู้รับผิดชอบรายวิชา:
              </div>
              <div className="text-emerald-800 font-semibold pl-5 text-sm">
                {targetCourse.instructor || 'ยังไม่ได้มอบหมายผู้สอน'}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                ตารางเวลาเรียนและห้องเรียน:
              </div>
              <div className="pl-5 space-y-1 text-slate-600">
                <div>
                  วัน:{' '}
                  <span className="font-semibold text-slate-800">
                    {DAYS_OF_WEEK.find((d) => d.id === targetCourse.dayOfWeek)?.label ||
                      'ไม่ระบุวัน'}
                  </span>{' '}
                  เวลา:{' '}
                  <span className="font-mono font-semibold text-slate-800">
                    {targetCourse.startTime || '-'} - {targetCourse.endTime || '-'} น.
                  </span>
                </div>
                <div>
                  ห้องเรียน:{' '}
                  <span className="font-semibold text-slate-800">
                    {targetCourse.room || 'ไม่ระบุห้อง'}
                  </span>
                </div>
                <div>
                  ปีการศึกษา / ภาคเรียน:{' '}
                  <span className="font-semibold text-slate-800">
                    {targetCourse.academicYear || '2569'} / ภาคเรียนที่{' '}
                    {targetCourse.semester || 1} (Sec {targetCourse.section || '1'})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              {canManage && (
                <button
                  onClick={() => {
                    setFormData({ ...targetCourse });
                    setModalMode('EDIT');
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  แก้ไขรายวิชานี้
                </button>
              )}
              <button
                onClick={() => setModalMode('NONE')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM DELETE */}
      {modalMode === 'DELETE' && targetCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">ยืนยันการลบรายวิชา</h3>
                <p className="text-xs text-slate-500">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-1">
              <div className="font-mono font-bold text-blue-600">
                {targetCourse.courseCode} (Sec {targetCourse.section || '1'})
              </div>
              <div className="font-bold text-slate-800">{targetCourse.courseName}</div>
              {targetCourse.courseNameEn && (
                <div className="text-slate-400">{targetCourse.courseNameEn}</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setModalMode('NONE')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={onDeleteCourse}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-500/20 transition disabled:opacity-50"
              >
                {submitting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
