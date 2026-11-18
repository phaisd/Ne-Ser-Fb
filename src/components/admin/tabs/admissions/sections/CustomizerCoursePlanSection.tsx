'use client';

import React from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { AdmissionPortalConfig } from '@/types';
import { DEFAULT_ADMISSION_PORTAL_CONFIG } from '@/lib/admission-config';
import { EditModalState } from './types';

interface CustomizerCoursePlanSectionProps {
  config: AdmissionPortalConfig;
  updateConfig: (updater: (prev: AdmissionPortalConfig) => AdmissionPortalConfig) => void;
  addCourseForDegree: (
    degreeKey: 'bachelor' | 'master' | 'doctoral' | 'certificate',
    defaultCode: string,
    defaultType: string
  ) => void;
  setEditingItem: (item: EditModalState) => void;
}

export function CustomizerCoursePlanSection({
  config,
  updateConfig,
  addCourseForDegree,
  setEditingItem,
}: CustomizerCoursePlanSectionProps) {
  const renderDegreeCourseSection = (
    degreeKey: 'bachelor' | 'master' | 'doctoral' | 'certificate',
    degreeLabel: string,
    titleConfigKey:
      | 'firstYearCourseTitleBachelor'
      | 'firstYearCourseTitleMaster'
      | 'firstYearCourseTitleDoctoral'
      | 'firstYearCourseTitleCertificate',
    coursesConfigKey:
      | 'firstYearCourses'
      | 'firstYearCoursesMaster'
      | 'firstYearCoursesDoctoral'
      | 'firstYearCoursesCertificate',
    defaultTitle: string,
    badgeBg: string,
    badgeText: string,
    defaultNewCode: string,
    defaultNewType: string
  ) => {
    const courses = config[coursesConfigKey] || [];
    const currentTitle = config[titleConfigKey] || defaultTitle;
    const enabledCount = courses.filter((c) => c.enabled).length;
    const totalCredits = courses
      .filter((c) => c.enabled)
      .reduce((sum, c) => sum + Number(c.credits || 0), 0);

    return (
      <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
        {/* Degree Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-1 rounded-xl text-xs font-black border ${badgeBg} ${badgeText}`}>
              🎓 {degreeLabel}
            </span>
            <span className="text-xs font-bold text-slate-600">
              ({enabledCount}/{courses.length} วิชาที่แสดง • รวม {totalCredits} หน่วยกิต)
            </span>
          </div>
          <button
            type="button"
            onClick={() => addCourseForDegree(degreeKey, defaultNewCode, defaultNewType)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มรายวิชา</span>
          </button>
        </div>

        {/* Editable Title for this Degree Table */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
              <Pencil className="w-3 h-3 text-indigo-600" />
              <span>หัวข้อตารางเรียน ({degreeLabel}):</span>
            </label>
            <button
              type="button"
              onClick={() =>
                updateConfig((prev) => ({
                  ...prev,
                  [titleConfigKey]: defaultTitle,
                }))
              }
              className="text-[10px] text-slate-400 hover:text-indigo-600 underline cursor-pointer"
            >
              คืนค่าหัวข้อเริ่มต้น
            </button>
          </div>
          <input
            type="text"
            value={currentTitle}
            onChange={(e) => {
              const val = e.target.value;
              updateConfig((prev) => ({
                ...prev,
                [titleConfigKey]: val,
              }));
            }}
            placeholder={`ระบุหัวข้อตารางเรียน ${degreeLabel}...`}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Course Rows */}
        <div className="space-y-2">
          {courses.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-white text-slate-400 text-xs">
              ยังไม่มีรายวิชาสำหรับ{degreeLabel} คลิก &ldquo;+ เพิ่มรายวิชา&rdquo; เพื่อเพิ่มรายวิชา
            </div>
          ) : (
            courses.map((course, idx) => (
              <div
                key={course.id}
                className={`p-3 rounded-xl border flex flex-col lg:flex-row lg:items-center gap-2 transition ${
                  course.enabled
                    ? 'bg-white border-slate-200 shadow-2xs'
                    : 'bg-slate-100/80 border-slate-200 opacity-70'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-400 w-6 shrink-0">#{idx + 1}</span>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={course.code}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateConfig((prev) => ({
                        ...prev,
                        [coursesConfigKey]: (prev[coursesConfigKey] || []).map((c) =>
                          c.id === course.id ? { ...c, code: val } : c
                        ),
                      }));
                    }}
                    placeholder="รหัสวิชา"
                    className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-indigo-900 text-xs"
                  />
                  <input
                    type="text"
                    value={course.nameTh}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateConfig((prev) => ({
                        ...prev,
                        [coursesConfigKey]: (prev[coursesConfigKey] || []).map((c) =>
                          c.id === course.id ? { ...c, nameTh: val } : c
                        ),
                      }));
                    }}
                    placeholder="ชื่อรายวิชา"
                    className="sm:col-span-5 px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold text-slate-900 text-xs"
                  />
                  <input
                    type="text"
                    value={course.type}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateConfig((prev) => ({
                        ...prev,
                        [coursesConfigKey]: (prev[coursesConfigKey] || []).map((c) =>
                          c.id === course.id ? { ...c, type: val } : c
                        ),
                      }));
                    }}
                    placeholder="หมวดวิชา"
                    className="sm:col-span-3 px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs"
                  />
                  <div className="sm:col-span-2 flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={course.credits}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value || '0', 10));
                        updateConfig((prev) => ({
                          ...prev,
                          [coursesConfigKey]: (prev[coursesConfigKey] || []).map((c) =>
                            c.id === course.id ? { ...c, credits: val } : c
                          ),
                        }));
                      }}
                      placeholder="หน่วยกิต"
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-center text-slate-900 text-xs"
                    />
                    <span className="text-[10px] text-slate-400 shrink-0">นก.</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      updateConfig((prev) => ({
                        ...prev,
                        [coursesConfigKey]: (prev[coursesConfigKey] || []).map((c) =>
                          c.id === course.id ? { ...c, enabled: !c.enabled } : c
                        ),
                      }))
                    }
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold border text-[11px] cursor-pointer ${
                      course.enabled
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {course.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{course.enabled ? 'แสดง' : 'ซ่อน'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingItem({
                        type: 'course',
                        degreeKey,
                        degreeTitle: degreeLabel,
                        id: course.id,
                        code: course.code,
                        nameTh: course.nameTh,
                        courseType: course.type,
                        credits: course.credits,
                        enabled: course.enabled,
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer transition"
                    title="แก้ไขรายวิชานี้"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateConfig((prev) => ({
                        ...prev,
                        [coursesConfigKey]: (prev[coursesConfigKey] || []).filter(
                          (c) => c.id !== course.id
                        ),
                      }))
                    }
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                    title="ลบรายวิชานี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div>
          <label className="block font-bold text-slate-700 mb-1">หัวข้อส่วนขึ้นทะเบียนนิสิตใหม่ (แท็บ ๔)</label>
          <input
            type="text"
            value={config.registerSectionTitle || ''}
            onChange={(e) =>
              updateConfig((prev) => ({ ...prev, registerSectionTitle: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">คำอธิบายส่วนขึ้นทะเบียนนิสิต</label>
          <input
            type="text"
            value={config.registerSectionSubtitle || ''}
            onChange={(e) =>
              updateConfig((prev) => ({ ...prev, registerSectionSubtitle: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
          />
        </div>
        <div className="md:col-span-2 flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
          <div>
            <div className="font-bold text-slate-900">📋 แสดงตารางแผนการลงทะเบียนเรียน ปี 1 เทอม 1 ในใบรายงานตัวนิสิตใหม่</div>
            <div className="text-[11px] text-slate-500">เปิด/ปิด ตารางรายวิชาในเอกสารใบรายงานตัว A4 ของผู้สมัครทุกระดับการศึกษา</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={config.showFirstYearCoursePlan !== false}
              onChange={(e) =>
                updateConfig((prev) => ({ ...prev, showFirstYearCoursePlan: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* Quick jump navigation / explanation for the 4 degree tables */}
      <div className="flex flex-wrap items-center gap-2 bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100">
        <span className="text-[11px] font-extrabold text-indigo-900">ตารางแผนการเรียน 4 ระดับการศึกษา:</span>
        <span className="text-[11px] text-indigo-700">
          ท่านสามารถแก้ไขหัวข้อตารางและจัดการรายวิชาแยกตามระดับการศึกษา เพื่อแสดงในใบรายงานตัวนิสิตใหม่โดยอัตโนมัติ
        </span>
      </div>

      {/* 1. Bachelor's Degree Course Plan */}
      {renderDegreeCourseSection(
        'bachelor',
        'ระดับปริญญาตรี (พธ.บ.)',
        'firstYearCourseTitleBachelor',
        'firstYearCourses',
        DEFAULT_ADMISSION_PORTAL_CONFIG.firstYearCourseTitleBachelor ||
          'รายวิชาแผนการเรียนชั้นปีที่ ๑ ภาคเรียนที่ ๑ (ระดับปริญญาตรี)',
        'bg-indigo-50 border-indigo-200',
        'text-indigo-800',
        '000 108',
        'วิชาเลือกเสรี'
      )}

      {/* 2. Master's Degree Course Plan */}
      {renderDegreeCourseSection(
        'master',
        'ระดับปริญญาโท (พธ.ม.)',
        'firstYearCourseTitleMaster',
        'firstYearCoursesMaster',
        DEFAULT_ADMISSION_PORTAL_CONFIG.firstYearCourseTitleMaster ||
          'รายวิชาแผนการเรียนชั้นปีที่ ๑ ภาคเรียนที่ ๑ (ระดับปริญญาโท)',
        'bg-purple-50 border-purple-200',
        'text-purple-800',
        '600 105',
        'วิชาแกน'
      )}

      {/* 3. Doctoral Degree Course Plan */}
      {renderDegreeCourseSection(
        'doctoral',
        'ระดับปริญญาเอก (พธ.ด.)',
        'firstYearCourseTitleDoctoral',
        'firstYearCoursesDoctoral',
        DEFAULT_ADMISSION_PORTAL_CONFIG.firstYearCourseTitleDoctoral ||
          'รายวิชาแผนการเรียนชั้นปีที่ ๑ ภาคเรียนที่ ๑ (ระดับปริญญาเอก)',
        'bg-amber-50 border-amber-200',
        'text-amber-900',
        '700 105',
        'วิชาสัมมนาขั้นสูง'
      )}

      {/* 4. Graduate Certificate Course Plan */}
      {renderDegreeCourseSection(
        'certificate',
        'ระดับประกาศนียบัตร (ป.บัณฑิต)',
        'firstYearCourseTitleCertificate',
        'firstYearCoursesCertificate',
        DEFAULT_ADMISSION_PORTAL_CONFIG.firstYearCourseTitleCertificate ||
          'รายวิชาแผนการเรียนชั้นปีที่ ๑ ภาคเรียนที่ ๑ (ระดับประกาศนียบัตรบัณฑิต)',
        'bg-teal-50 border-teal-200',
        'text-teal-900',
        '500 105',
        'วิชาบังคับ'
      )}
    </div>
  );
}
