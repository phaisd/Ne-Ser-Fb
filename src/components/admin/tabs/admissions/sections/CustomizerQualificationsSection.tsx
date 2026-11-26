'use client';

import React from 'react';
import { Plus, Pencil, Trash2, CreditCard, Landmark } from 'lucide-react';
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

      {/* Application Fees Management (ส่วนตั้งค่าค่าธรรมเนียมการสมัคร) */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-700" />
              <span>กำหนดค่าธรรมเนียมการสมัครเข้าศึกษา (Application Fees)</span>
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              เปิด/ปิดการแสดงข้อมูลค่าสมัคร และระบุอัตราค่าสมัครตามระดับการศึกษา (ปริญญาตรี/โท/เอก) เพื่อให้ผู้สมัครทราบล่วงหน้า
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateConfig((prev) => ({
                ...prev,
                showApplicationFee: prev.showApplicationFee === false ? true : false,
              }))
            }
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs border cursor-pointer transition shrink-0 ${
              config.showApplicationFee !== false
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                : 'bg-slate-200 text-slate-600 border-slate-300'
            }`}
          >
            {config.showApplicationFee !== false ? '🟢 เปิดแสดงค่าสมัคร' : '🔴 ปิดซ่อนค่าสมัคร'}
          </button>
        </div>

        {config.showApplicationFee !== false && (
          <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">หัวข้อการ์ดค่าสมัคร</label>
                <input
                  type="text"
                  value={config.applicationFeeTitle || ''}
                  onChange={(e) =>
                    updateConfig((prev) => ({ ...prev, applicationFeeTitle: e.target.value }))
                  }
                  placeholder="อัตราค่าธรรมเนียมการสมัครเข้าศึกษา (Application Fees)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">คำอธิบายย่อย</label>
                <input
                  type="text"
                  value={config.applicationFeeSubtitle || ''}
                  onChange={(e) =>
                    updateConfig((prev) => ({ ...prev, applicationFeeSubtitle: e.target.value }))
                  }
                  placeholder="ค่าธรรมเนียมการสมัครตามระดับการศึกษา สามารถชำระในวันสอบสัมภาษณ์..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-amber-700" />
                  <span>ข้อมูลบัญชีธนาคารสำหรับชำระเงิน</span>
                </label>
                <input
                  type="text"
                  value={config.applicationFeeBankInfo || ''}
                  onChange={(e) =>
                    updateConfig((prev) => ({ ...prev, applicationFeeBankInfo: e.target.value }))
                  }
                  placeholder="เช่น ธนาคารกรุงไทย • เลขที่บัญชี 101-0-12345-6 • ชื่อบัญชี คณะพุทธศาสตร์ มจร"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>
            </div>

            {/* List of Fees per Degree */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-xs">
                  อัตราค่าสมัครตามระดับการศึกษา ({config.applicationFees?.length || 0} รายการ)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newId = `fee-${Date.now()}`;
                    updateConfig((prev) => ({
                      ...prev,
                      applicationFees: [
                        ...(prev.applicationFees || []),
                        {
                          id: newId,
                          degreeLevel: 'หลักสูตรใหม่',
                          amount: 300,
                          currency: 'บาท',
                          note: 'ชำระในวันสัมภาษณ์',
                          enabled: true,
                        },
                      ],
                    }));
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มระดับ/ค่าสมัครใหม่</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(config.applicationFees || []).map((fee) => (
                  <div
                    key={fee.id}
                    className={`p-3.5 rounded-xl border space-y-2.5 transition ${
                      fee.enabled ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[11px] font-bold text-slate-500">ระดับ:</span>
                        <input
                          type="text"
                          value={fee.degreeLevel}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateConfig((prev) => ({
                              ...prev,
                              applicationFees: (prev.applicationFees || []).map((f) =>
                                f.id === fee.id ? { ...f, degreeLevel: val } : f
                              ),
                            }));
                          }}
                          className="font-extrabold text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-300 text-xs flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            updateConfig((prev) => ({
                              ...prev,
                              applicationFees: (prev.applicationFees || []).map((f) =>
                                f.id === fee.id ? { ...f, enabled: !f.enabled } : f
                              ),
                            }))
                          }
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                            fee.enabled
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-700 border-rose-300'
                          }`}
                        >
                          {fee.enabled ? 'แสดง' : 'ซ่อน'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateConfig((prev) => ({
                              ...prev,
                              applicationFees: (prev.applicationFees || []).filter(
                                (f) => f.id !== fee.id
                              ),
                            }))
                          }
                          className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          จำนวนเงิน (บาท) (0 = ฟรี/ทุน):
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={fee.amount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateConfig((prev) => ({
                              ...prev,
                              applicationFees: (prev.applicationFees || []).map((f) =>
                                f.id === fee.id ? { ...f, amount: val } : f
                              ),
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-amber-800 bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          สกุลเงิน:
                        </span>
                        <input
                          type="text"
                          value={fee.currency || 'บาท'}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateConfig((prev) => ({
                              ...prev,
                              applicationFees: (prev.applicationFees || []).map((f) =>
                                f.id === fee.id ? { ...f, currency: val } : f
                              ),
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-700 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-0.5">
                        คำอธิบาย / เงื่อนไขเพิ่มเติม:
                      </span>
                      <input
                        type="text"
                        value={fee.note || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateConfig((prev) => ({
                            ...prev,
                            applicationFees: (prev.applicationFees || []).map((f) =>
                              f.id === fee.id ? { ...f, note: val } : f
                            ),
                          }));
                        }}
                        placeholder="เช่น บรรพชิตได้รับการยกเว้น / ทุนการศึกษา"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white text-[11px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
