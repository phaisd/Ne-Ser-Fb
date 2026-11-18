'use client';

import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AdmissionPortalConfig } from '@/types';
import { EditModalState } from './types';

interface CustomizerQualificationsSectionProps {
  config: AdmissionPortalConfig;
  updateConfig: (updater: (prev: AdmissionPortalConfig) => AdmissionPortalConfig) => void;
  addQualificationCard: () => void;
  addRequiredDoc: () => void;
  setEditingItem: (item: EditModalState) => void;
}

export function CustomizerQualificationsSection({
  config,
  updateConfig,
  addQualificationCard,
  addRequiredDoc,
  setEditingItem,
}: CustomizerQualificationsSectionProps) {
  return (
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
                    setEditingItem({
                      type: 'qualification',
                      id: card.id,
                      badgeText: card.badgeText,
                      themeColor: card.themeColor,
                      itemsText: card.items.join('\n'),
                      enabled: card.enabled,
                    })
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer transition text-xs"
                  title="แก้ไขกลุ่มคุณสมบัตินี้"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>แก้ไข</span>
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
                  title="ลบกลุ่มคุณสมบัตินี้"
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
                      setEditingItem({
                        type: 'document',
                        id: doc.id,
                        title: doc.title,
                        description: doc.description,
                        enabled: doc.enabled,
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer transition text-[11px]"
                    title="แก้ไขเอกสารนี้"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>แก้ไข</span>
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
                    title="ลบเอกสารนี้"
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
  );
}
