'use client';

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  BookOpen,
  FileText,
  Search,
  GraduationCap,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';
import {
  AdmissionFirstYearCourseItem,
  AdmissionPortalConfig,
  AdmissionQualificationCard,
  AdmissionRequiredDocItem,
  AdmissionSelectOptionItem,
  SystemSettings,
} from '@/types';
import {
  DEFAULT_ADMISSION_PORTAL_CONFIG,
  resolveAdmissionPortalConfig,
} from '@/lib/admission-config';

interface AdmissionPortalCustomizerProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  onSaveSettings: (nextSettings: SystemSettings) => Promise<void>;
  savingConfig: boolean;
}

type CustomizerSection = 'VISIBILITY' | 'SECTION1' | 'SECTION2' | 'SECTION3' | 'SECTION4';

export function AdmissionPortalCustomizer({
  settings,
  setSettings,
  onSaveSettings,
  savingConfig,
}: AdmissionPortalCustomizerProps) {
  const [activeSubSection, setActiveSubSection] = useState<CustomizerSection>('VISIBILITY');
  const config: AdmissionPortalConfig = resolveAdmissionPortalConfig(settings.admissionPortalConfig);

  const updateConfig = (updater: (prev: AdmissionPortalConfig) => AdmissionPortalConfig) => {
    const nextConfig = updater(resolveAdmissionPortalConfig(settings.admissionPortalConfig));
    setSettings((prev) => ({
      ...prev,
      admissionPortalConfig: nextConfig,
    }));
  };

  const handleSave = async () => {
    await onSaveSettings({
      ...settings,
      admissionPortalConfig: config,
    });
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('ต้องการรีเซ็ตการตั้งค่าเนื้อหาและตัวเลือกหน้า /enroll ทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      return;
    }
    const nextSettings = {
      ...settings,
      admissionPortalConfig: DEFAULT_ADMISSION_PORTAL_CONFIG,
    };
    setSettings(nextSettings);
    await onSaveSettings(nextSettings);
  };

  // --- Helper builders for adding items ---
  const addQualificationCard = () => {
    const newCard: AdmissionQualificationCard = {
      id: `qual-${Date.now().toString(36)}`,
      badgeText: '✨ คุณสมบัติกลุ่มผู้สมัครใหม่',
      themeColor: 'emerald',
      enabled: true,
      items: ['สำเร็จการศึกษาตามเกณฑ์ที่คณะพุทธศาสตร์กำหนด'],
    };
    updateConfig((prev) => ({ ...prev, qualifications: [...prev.qualifications, newCard] }));
  };

  const addRequiredDoc = () => {
    const newDoc: AdmissionRequiredDocItem = {
      id: `doc-${Date.now().toString(36)}`,
      title: 'เอกสารประกอบการสมัครเพิ่มเติม',
      description: 'ระบุรายละเอียดและจำนวนชุดที่ต้องเตรียม',
      enabled: true,
    };
    updateConfig((prev) => ({ ...prev, requiredDocuments: [...prev.requiredDocuments, newDoc] }));
  };

  const addSelectOption = (
    key: 'degreeOptions' | 'majorOptions' | 'studyPlanOptions' | 'previousEducationOptions',
    defaultLabel: string
  ) => {
    const newItem: AdmissionSelectOptionItem = {
      id: `opt-${Date.now().toString(36)}`,
      value: defaultLabel,
      label: defaultLabel,
      enabled: true,
    };
    updateConfig((prev) => ({ ...prev, [key]: [...prev[key], newItem] }));
  };

  const addFirstYearCourse = () => {
    const newCourse: AdmissionFirstYearCourseItem = {
      id: `fyc-${Date.now().toString(36)}`,
      code: '000 108',
      nameTh: 'รายวิชาใหม่ (New Course)',
      type: 'วิชาเลือกเสรี',
      credits: 3,
      enabled: true,
    };
    updateConfig((prev) => ({ ...prev, firstYearCourses: [...prev.firstYearCourses, newCourse] }));
  };

  const renderSelectOptionEditor = (
    title: string,
    key: 'degreeOptions' | 'majorOptions' | 'studyPlanOptions' | 'previousEducationOptions',
    addPlaceholder: string
  ) => {
    const list = config[key];
    return (
      <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
            {title} ({list.filter((i) => i.enabled).length}/{list.length} รายการที่แสดง)
          </h4>
          <button
            type="button"
            onClick={() => addSelectOption(key, addPlaceholder)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มตัวเลือก</span>
          </button>
        </div>

        <div className="space-y-2">
          {list.map((opt, idx) => (
            <div
              key={opt.id}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-2 transition ${
                opt.enabled ? 'bg-white border-slate-200' : 'bg-slate-100/80 border-slate-200 opacity-70'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-400 w-6 shrink-0">#{idx + 1}</span>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      [key]: prev[key].map((item) =>
                        item.id === opt.id
                          ? { ...item, label: val, value: key === 'degreeOptions' ? item.value : val }
                          : item
                      ),
                    }));
                  }}
                  placeholder="ข้อความที่แสดงใน Dropdown"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900"
                />
                <input
                  type="text"
                  value={opt.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      [key]: prev[key].map((item) =>
                        item.id === opt.id ? { ...item, value: val } : item
                      ),
                    }));
                  }}
                  placeholder="ค่าที่บันทึก (Value)"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-700"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    updateConfig((prev) => ({
                      ...prev,
                      [key]: prev[key].map((item) =>
                        item.id === opt.id ? { ...item, enabled: !item.enabled } : item
                      ),
                    }))
                  }
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                    opt.enabled
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {opt.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{opt.enabled ? 'แสดง' : 'ซ่อน'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateConfig((prev) => ({
                      ...prev,
                      [key]: prev[key].filter((item) => item.id !== opt.id),
                    }))
                  }
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                  title="ลบรายการนี้"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-6">
      {/* Header + Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            <span>จัดการเนื้อหา เพิ่ม/แก้ไข/ลบ และเปิด-ปิดการแสดงผลหน้า /enroll</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ปรับแต่งครบทั้ง 4 ส่วนบนหน้าสมัครเรียนสาธารณะ: คุณสมบัติผู้สมัคร &amp; เอกสาร, แบบฟอร์มยื่นใบสมัคร, ตรวจสอบสถานะ &amp; นัดสัมภาษณ์, และขึ้นทะเบียนนิสิตใหม่
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตค่าเริ่มต้น</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={savingConfig}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{savingConfig ? 'กำลังบันทึก...' : 'บันทึกการปรับแต่งหน้า /enroll'}</span>
          </button>
        </div>
      </div>

      {/* Sub-section Selector Pills */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-extrabold">
        {[
          { id: 'VISIBILITY' as const, label: '👁️ เปิด/ปิด 4 ส่วนหลัก', icon: Eye },
          { id: 'SECTION1' as const, label: '๑. คุณสมบัติ & เอกสารหลักฐาน', icon: BookOpen },
          { id: 'SECTION2' as const, label: '๒. แบบฟอร์ม & สาขา/หลักสูตร', icon: FileText },
          { id: 'SECTION3' as const, label: '๓. ตรวจสอบสถานะ & นัดสัมภาษณ์', icon: Search },
          { id: 'SECTION4' as const, label: '๔. ขึ้นทะเบียน & แผนการเรียนปี 1', icon: GraduationCap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubSection(tab.id)}
              className={`flex-1 min-w-[165px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl transition cursor-pointer ${
                isActive
                  ? 'bg-white text-indigo-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SUB-SECTION 0: VISIBILITY TOGGLES FOR ALL 4 SECTIONS
         ───────────────────────────────────────────────────────────── */}
      {activeSubSection === 'VISIBILITY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {[
            {
              key: 'showOverviewTab' as const,
              title: '๑. ส่วน/แท็บ "คุณสมบัติผู้สมัครและเอกสารหลักฐานที่ต้องใช้"',
              desc: 'เปิด/ปิด การแสดงแท็บที่ 1 (คุณสมบัติบรรพชิต คฤหัสถ์ ต่างชาติ และรายการเอกสารหลักฐาน)',
            },
            {
              key: 'showApplyTab' as const,
              title: '๒. ส่วน/แท็บ "แบบฟอร์มยื่นใบสมัครเข้าศึกษาออนไลน์"',
              desc: 'เปิด/ปิด การแสดงแท็บที่ 2 (แบบฟอร์มกรอกสมัครเรียนออนไลน์บนหน้า /enroll)',
            },
            {
              key: 'showStatusTab' as const,
              title: '๓. ส่วน/แท็บ "ตรวจสอบสถานะการสมัคร & ตารางนัดสอบสัมภาษณ์"',
              desc: 'เปิด/ปิด การแสดงแท็บที่ 3 (ช่องค้นหาสถานะใบสมัคร 4 ขั้นตอน และวัน-ห้องสอบสัมภาษณ์)',
            },
            {
              key: 'showRegisterTab' as const,
              title: '๔. ส่วน/แท็บ "ยืนยันสิทธิ์และขึ้นทะเบียนนิสิตใหม่ออนไลน์"',
              desc: 'เปิด/ปิด การแสดงแท็บที่ 4 (หน้ายืนยันสิทธิ์รับรหัสนิสิต และพิมพ์ใบรายงานตัว A4)',
            },
            {
              key: 'showProcessSteps' as const,
              title: 'การ์ดผังกระบวนการ 4 ขั้นตอนด้านบนหน้า /enroll',
              desc: 'เปิด/ปิด การแสดงการ์ดสรุปขั้นตอนที่ 1–4 ด้านบนของหน้ารับสมัคร',
            },
            {
              key: 'showQuickTestBar' as const,
              title: 'แถบทดสอบระบบด่วน 3 รหัส (Quick Test Simulation Links)',
              desc: 'เปิด/ปิด แถบปุ่มจำลองรหัสทดสอบ (1349900123456 ฯลฯ) แนะนำให้ปิดเมื่อเปิดรับสมัครจริง',
            },
          ].map((item) => {
            const checked = config[item.key] !== false;
            return (
              <div
                key={item.key}
                className={`p-4 rounded-2xl border flex items-start justify-between gap-3 transition ${
                  checked ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="font-extrabold text-slate-900 flex flex-wrap items-center gap-1.5">
                    <span>{item.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        checked ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {checked ? '🟢 เปิดแสดง' : '🔴 ปิดซ่อน'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      updateConfig((prev) => ({ ...prev, [item.key]: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-SECTION 1: QUALIFICATIONS & REQUIRED DOCUMENTS
         ───────────────────────────────────────────────────────────── */}
      {activeSubSection === 'SECTION1' && (
        <div className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">หัวข้อส่วนที่ ๑ (คุณสมบัติผู้สมัคร)</label>
              <input
                type="text"
                value={config.overviewTitle || ''}
                onChange={(e) => updateConfig((prev) => ({ ...prev, overviewTitle: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">คำอธิบายย่อยส่วนที่ ๑</label>
              <input
                type="text"
                value={config.overviewSubtitle || ''}
                onChange={(e) =>
                  updateConfig((prev) => ({ ...prev, overviewSubtitle: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Qualification Cards Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900">
                การ์ดคุณสมบัติผู้สมัคร ({config.qualifications.length} กลุ่ม)
              </h4>
              <button
                type="button"
                onClick={addQualificationCard}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มกลุ่มคุณสมบัติใหม่</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {config.qualifications.map((card) => (
                <div
                  key={card.id}
                  className={`p-4 rounded-2xl border space-y-3 ${
                    card.enabled ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-100 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={card.badgeText}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateConfig((prev) => ({
                          ...prev,
                          qualifications: prev.qualifications.map((q) =>
                            q.id === card.id ? { ...q, badgeText: val } : q
                          ),
                        }));
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 font-extrabold text-slate-900"
                    />
                    <select
                      value={card.themeColor}
                      onChange={(e) => {
                        const val = e.target.value as 'orange' | 'sky' | 'purple' | 'emerald';
                        updateConfig((prev) => ({
                          ...prev,
                          qualifications: prev.qualifications.map((q) =>
                            q.id === card.id ? { ...q, themeColor: val } : q
                          ),
                        }));
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 font-bold"
                    >
                      <option value="orange">สีส้ม</option>
                      <option value="sky">สีฟ้า</option>
                      <option value="purple">สีม่วง</option>
                      <option value="emerald">สีเขียว</option>
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        updateConfig((prev) => ({
                          ...prev,
                          qualifications: prev.qualifications.map((q) =>
                            q.id === card.id ? { ...q, enabled: !q.enabled } : q
                          ),
                        }))
                      }
                      className={`px-2.5 py-1.5 rounded-xl font-bold border cursor-pointer ${
                        card.enabled
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {card.enabled ? 'แสดง' : 'ซ่อน'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateConfig((prev) => ({
                          ...prev,
                          qualifications: prev.qualifications.filter((q) => q.id !== card.id),
                        }))
                      }
                      className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bullet items inside card */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500">รายการคุณสมบัติย่อย (1 บรรทัดต่อ 1 ข้อ):</div>
                    <textarea
                      rows={4}
                      value={card.items.join('\n')}
                      onChange={(e) => {
                        const lines = e.target.value.split('\n');
                        updateConfig((prev) => ({
                          ...prev,
                          qualifications: prev.qualifications.map((q) =>
                            q.id === card.id ? { ...q, items: lines } : q
                          ),
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Required Documents Editor */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex-1 min-w-[260px]">
                <label className="block font-bold text-slate-700 mb-1">หัวข้อรายการเอกสารหลักฐานที่ต้องเตรียม</label>
                <input
                  type="text"
                  value={config.requiredDocsTitle || ''}
                  onChange={(e) =>
                    updateConfig((prev) => ({ ...prev, requiredDocsTitle: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                />
              </div>
              <button
                type="button"
                onClick={addRequiredDoc}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer self-end"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรายการเอกสาร</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {config.requiredDocuments.map((doc, idx) => (
                <div
                  key={doc.id}
                  className={`p-3.5 rounded-2xl border space-y-2 ${
                    doc.enabled ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-orange-700">เอกสารข้อที่ {idx + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            requiredDocuments: prev.requiredDocuments.map((d) =>
                              d.id === doc.id ? { ...d, enabled: !d.enabled } : d
                            ),
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg font-bold border cursor-pointer ${
                          doc.enabled
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {doc.enabled ? 'แสดง' : 'ซ่อน'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateConfig((prev) => ({
                            ...prev,
                            requiredDocuments: prev.requiredDocuments.filter((d) => d.id !== doc.id),
                          }))
                        }
                        className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={doc.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateConfig((prev) => ({
                        ...prev,
                        requiredDocuments: prev.requiredDocuments.map((d) =>
                          d.id === doc.id ? { ...d, title: val } : d
                        ),
                      }));
                    }}
                    placeholder="ชื่อเอกสาร"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                  <input
                    type="text"
                    value={doc.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateConfig((prev) => ({
                        ...prev,
                        requiredDocuments: prev.requiredDocuments.map((d) =>
                          d.id === doc.id ? { ...d, description: val } : d
                        ),
                      }));
                    }}
                    placeholder="คำอธิบายรายละเอียดเอกสาร"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-SECTION 2: ONLINE APPLICATION FORM OPTIONS
         ───────────────────────────────────────────────────────────── */}
      {activeSubSection === 'SECTION2' && (
        <div className="space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">หัวข้อแบบฟอร์มรับสมัคร (แท็บ ๒)</label>
              <input
                type="text"
                value={config.applyFormTitle || ''}
                onChange={(e) => updateConfig((prev) => ({ ...prev, applyFormTitle: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">คำอธิบายแบบฟอร์ม</label>
              <input
                type="text"
                value={config.applyFormSubtitle || ''}
                onChange={(e) =>
                  updateConfig((prev) => ({ ...prev, applyFormSubtitle: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">📎 เปิดแสดงช่องแนบไฟล์ / ลิงก์เอกสารเบื้องต้นในแบบฟอร์ม</div>
                <div className="text-[11px] text-slate-500">ผู้สมัครสามารถอัปโหลด PDF/รูปภาพ หรือวางลิงก์ Google Drive ในขั้นตอนยื่นใบสมัครได้</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={config.showDocumentUploadField !== false}
                  onChange={(e) =>
                    updateConfig((prev) => ({ ...prev, showDocumentUploadField: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {renderSelectOptionEditor(
            'ระดับหลักสูตรที่เปิดรับสมัคร (Degree Levels)',
            'degreeOptions',
            'หลักสูตรใหม่'
          )}
          {renderSelectOptionEditor(
            'สาขาวิชาที่เปิดรับสมัคร (Majors / Programs)',
            'majorOptions',
            'สาขาวิชาใหม่'
          )}
          {renderSelectOptionEditor(
            'แผนการเรียนที่เปิดรับสมัคร (Study Plans)',
            'studyPlanOptions',
            'แผนการเรียนใหม่'
          )}
          {renderSelectOptionEditor(
            'ตัวเลือกวุฒิการศึกษาเดิม (Previous Education)',
            'previousEducationOptions',
            'วุฒิการศึกษาอื่น ๆ'
          )}

          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-1.5">
            <label className="block font-bold text-amber-950">ข้อความคำรับรองของผู้สมัครท้ายแบบฟอร์ม</label>
            <textarea
              rows={2}
              value={config.certificationStatement || ''}
              onChange={(e) =>
                updateConfig((prev) => ({ ...prev, certificationStatement: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-slate-900"
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-SECTION 3: STATUS CHECK & INTERVIEW SCHEDULE
         ───────────────────────────────────────────────────────────── */}
      {activeSubSection === 'SECTION3' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">หัวข้อส่วนตรวจสอบสถานะ &amp; นัดสัมภาษณ์ (แท็บ ๓)</label>
              <input
                type="text"
                value={config.statusSectionTitle || ''}
                onChange={(e) =>
                  updateConfig((prev) => ({ ...prev, statusSectionTitle: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">คำอธิบายช่องค้นหา</label>
              <input
                type="text"
                value={config.statusSectionSubtitle || ''}
                onChange={(e) =>
                  updateConfig((prev) => ({ ...prev, statusSectionSubtitle: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">หมายเหตุการจัดการตารางสัมภาษณ์รายบุคคล:</div>
              <p className="text-[11px] leading-relaxed">
                วัน-เวลา และห้องสอบสัมภาษณ์เริ่มต้นของทุกคนสามารถตั้งค่าได้ในแท็บ <strong>&ldquo;รายชื่อผู้สมัคร &amp; สวิตช์หลัก&rdquo;</strong> หรือกดปุ่ม <strong>&ldquo;นัดสัมภาษณ์/รหัส&rdquo;</strong> ในแต่ละแถวผู้สมัครเพื่อกำหนดวัน-เวลา/ห้องสอบเฉพาะรายบุคคลได้เลยครับ
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-SECTION 4: ONLINE REGISTRATION & FIRST YEAR COURSE PLAN
         ───────────────────────────────────────────────────────────── */}
      {activeSubSection === 'SECTION4' && (
        <div className="space-y-5 text-xs">
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
                <div className="text-[11px] text-slate-500">เปิด/ปิด ตารางรายวิชาในเอกสารใบรายงานตัว A4</div>
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900">
                รายวิชาแผนการเรียนชั้นปีที่ ๑ ภาคเรียนที่ ๑ ({config.firstYearCourses.filter((c) => c.enabled).length} วิชาที่แสดง • รวม{' '}
                {config.firstYearCourses
                  .filter((c) => c.enabled)
                  .reduce((sum, c) => sum + Number(c.credits || 0), 0)}{' '}
                หน่วยกิต)
              </h4>
              <button
                type="button"
                onClick={addFirstYearCourse}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรายวิชา</span>
              </button>
            </div>

            <div className="space-y-2">
              {config.firstYearCourses.map((course) => (
                <div
                  key={course.id}
                  className={`p-3 rounded-xl border flex flex-col lg:flex-row lg:items-center gap-2 ${
                    course.enabled ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 opacity-70'
                  }`}
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={course.code}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateConfig((prev) => ({
                          ...prev,
                          firstYearCourses: prev.firstYearCourses.map((c) =>
                            c.id === course.id ? { ...c, code: val } : c
                          ),
                        }));
                      }}
                      placeholder="รหัสวิชา"
                      className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-indigo-900"
                    />
                    <input
                      type="text"
                      value={course.nameTh}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateConfig((prev) => ({
                          ...prev,
                          firstYearCourses: prev.firstYearCourses.map((c) =>
                            c.id === course.id ? { ...c, nameTh: val } : c
                          ),
                        }));
                      }}
                      placeholder="ชื่อรายวิชา"
                      className="sm:col-span-5 px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold text-slate-900"
                    />
                    <input
                      type="text"
                      value={course.type}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateConfig((prev) => ({
                          ...prev,
                          firstYearCourses: prev.firstYearCourses.map((c) =>
                            c.id === course.id ? { ...c, type: val } : c
                          ),
                        }));
                      }}
                      placeholder="หมวดวิชา"
                      className="sm:col-span-3 px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700"
                    />
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={course.credits}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value || '0', 10));
                        updateConfig((prev) => ({
                          ...prev,
                          firstYearCourses: prev.firstYearCourses.map((c) =>
                            c.id === course.id ? { ...c, credits: val } : c
                          ),
                        }));
                      }}
                      placeholder="หน่วยกิต"
                      className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-center text-slate-900"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        updateConfig((prev) => ({
                          ...prev,
                          firstYearCourses: prev.firstYearCourses.map((c) =>
                            c.id === course.id ? { ...c, enabled: !c.enabled } : c
                          ),
                        }))
                      }
                      className={`px-2.5 py-1.5 rounded-lg font-bold border cursor-pointer ${
                        course.enabled
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {course.enabled ? 'แสดง' : 'ซ่อน'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateConfig((prev) => ({
                          ...prev,
                          firstYearCourses: prev.firstYearCourses.filter((c) => c.id !== course.id),
                        }))
                      }
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
