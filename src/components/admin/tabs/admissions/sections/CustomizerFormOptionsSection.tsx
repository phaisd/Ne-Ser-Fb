'use client';

import React from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { AdmissionPortalConfig } from '@/types';
import { canUserDelete, getAuthUser } from '@/lib/auth-client';
import { EditModalState, SelectOptionKey } from './types';

interface CustomizerFormOptionsSectionProps {
  config: AdmissionPortalConfig;
  updateConfig: (updater: (prev: AdmissionPortalConfig) => AdmissionPortalConfig) => void;
  addSelectOption: (
    key: SelectOptionKey,
    defaultLabel: string,
    defaultValue?: string
  ) => void;
  setEditingItem: (item: EditModalState) => void;
}

export function CustomizerFormOptionsSection({
  config,
  updateConfig,
  addSelectOption,
  setEditingItem,
}: CustomizerFormOptionsSectionProps) {
  const renderSelectOptionEditor = (
    title: string,
    key: SelectOptionKey,
    addPlaceholder: string,
    addDefaultValue?: string
  ) => {
    const list = config[key] || [];
    return (
      <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
            {title} ({list.filter((i) => i.enabled).length}/{list.length} รายการที่แสดง)
          </h4>
          <button
            type="button"
            onClick={() => addSelectOption(key, addPlaceholder, addDefaultValue)}
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
                    const preserveValue =
                      key === 'degreeOptions' ||
                      key === 'applicantTypeOptions' ||
                      key === 'nationalityTypeOptions' ||
                      key === 'programLanguageOptions';
                    updateConfig((prev) => ({
                      ...prev,
                      [key]: (prev[key] || []).map((item) =>
                        item.id === opt.id
                          ? { ...item, label: val, value: preserveValue ? item.value : val }
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
                      [key]: (prev[key] || []).map((item) =>
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
                      [key]: (prev[key] || []).map((item) =>
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
                    setEditingItem({
                      type: 'selectOption',
                      key,
                      categoryTitle: title,
                      id: opt.id,
                      label: opt.label,
                      value: opt.value,
                      enabled: opt.enabled,
                    })
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer transition"
                  title="แก้ไขตัวเลือกนี้"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>แก้ไข</span>
                </button>
                {canUserDelete(typeof window !== 'undefined' ? getAuthUser() : null) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`ต้องการลบตัวเลือก "${opt.label}" หรือไม่?`)) {
                        updateConfig((prev) => ({
                          ...prev,
                          [key]: (prev[key] || []).filter((item) => item.id !== opt.id),
                        }));
                      }
                    }}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                    title="ลบรายการนี้ (เฉพาะแอดมิน)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
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
        {/* Field Display Switches */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div>
              <div className="font-bold text-slate-900">📎 เปิดแสดงช่องแนบไฟล์ / ลิงก์เอกสารเบื้องต้น</div>
              <div className="text-[11px] text-slate-500">ผู้สมัครสามารถอัปโหลด PDF หรือใส่ลิงก์ Drive ได้</div>
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

          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div>
              <div className="font-bold text-slate-900">📊 เปิดแสดงช่อง เกรดเฉลี่ยสะสม (GPAX - ข้อ ๑๒)</div>
              <div className="text-[11px] text-slate-500">เปิดหรือปิดการแสดงช่องเกรดสะสมในแบบฟอร์ม</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={config.showGpaField !== false}
                onChange={(e) =>
                  updateConfig((prev) => ({ ...prev, showGpaField: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div>
              <div className="font-bold text-slate-900">✉️ เปิดแสดงช่อง อีเมล (Email - ข้อ ๑๔)</div>
              <div className="text-[11px] text-slate-500">เปิดหรือปิดการแสดงช่องกรอกอีเมลในแบบฟอร์ม</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={config.showEmailField !== false}
                onChange={(e) =>
                  updateConfig((prev) => ({ ...prev, showEmailField: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div>
              <div className="font-bold text-slate-900">💬 เปิดแสดงช่อง LINE ID (ข้อ ๑๕)</div>
              <div className="text-[11px] text-slate-500">เปิดหรือปิดช่อง LINE ID สำหรับแจ้งเตือนสัมภาษณ์</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={config.showLineIdField !== false}
                onChange={(e) =>
                  updateConfig((prev) => ({ ...prev, showLineIdField: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>
      </div>

      {renderSelectOptionEditor(
        '๑. ตัวเลือกสถานภาพผู้สมัคร (ข้อ ๑: พระภิกษุ-สามเณร / บุคคลทั่วไป)',
        'applicantTypeOptions',
        'สถานภาพใหม่',
        'MONK'
      )}
      {renderSelectOptionEditor(
        '๒. ตัวเลือกประเภทผู้สมัคร (ข้อ ๒: สัญชาติไทย / ชาวต่างชาติ)',
        'nationalityTypeOptions',
        'ประเภทผู้สมัครใหม่',
        'THAI'
      )}
      {renderSelectOptionEditor(
        '๗. ระดับหลักสูตรที่เปิดรับสมัคร (ข้อ ๗: ปริญญาตรี / โท / เอก / ป.บัณฑิต)',
        'degreeOptions',
        'หลักสูตรใหม่'
      )}
      {renderSelectOptionEditor(
        '๘. ตัวเลือกหลักสูตรภาษา (ข้อ ๘: ภาษาไทย / ภาษาอังกฤษ)',
        'programLanguageOptions',
        'หลักสูตรภาษาใหม่',
        'THAI'
      )}
      {renderSelectOptionEditor(
        '๙. สาขาวิชาที่เปิดรับสมัคร (ข้อ ๙)',
        'majorOptions',
        'สาขาวิชาใหม่'
      )}
      {renderSelectOptionEditor(
        '๑๐. ตัวเลือกวุฒิการศึกษาเดิม (ข้อ ๑๐)',
        'previousEducationOptions',
        'วุฒิการศึกษาอื่น ๆ'
      )}
      {renderSelectOptionEditor(
        '๑๑. แผนการเรียนที่เปิดรับสมัคร (ข้อ ๑๑: ภาคปกติ / ภาคพิเศษ)',
        'studyPlanOptions',
        'แผนการเรียนใหม่'
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
  );
}
