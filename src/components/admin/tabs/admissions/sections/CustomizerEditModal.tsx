'use client';

import React from 'react';
import { Pencil, X, Save } from 'lucide-react';
import { EditModalState } from './types';
import { DepartmentBannerColorTheme } from '@/types';

interface CustomizerEditModalProps {
  editingItem: NonNullable<EditModalState>;
  setEditingItem: React.Dispatch<React.SetStateAction<EditModalState>>;
  onSave: () => void;
}

export function CustomizerEditModal({
  editingItem,
  setEditingItem,
  onSave,
}: CustomizerEditModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) setEditingItem(null);
      }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                {editingItem.type === 'banner' && 'แก้ไขสไลด์แบนเนอร์สาขาวิชา'}
                {editingItem.type === 'qualification' && 'แก้ไขกลุ่มคุณสมบัติผู้สมัคร'}
                {editingItem.type === 'document' && 'แก้ไขรายการเอกสารหลักฐาน'}
                {editingItem.type === 'selectOption' && `แก้ไขตัวเลือก: ${editingItem.categoryTitle}`}
                {editingItem.type === 'course' && `แก้ไขข้อมูลรายวิชา (${editingItem.degreeTitle})`}
              </h4>
              <p className="text-[11px] text-slate-500">
                ปรับปรุงรายละเอียด และกดปุ่ม &ldquo;บันทึกการแก้ไข&rdquo;
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditingItem(null)}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-3.5 text-xs">
          {editingItem.type === 'banner' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ชื่อสาขาวิชา (Major Name)
                </label>
                <input
                  type="text"
                  value={editingItem.majorName}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, majorName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ระดับการศึกษาที่เปิดสอน
                  </label>
                  <input
                    type="text"
                    value={editingItem.degreeLevel}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, degreeLevel: e.target.value })
                    }
                    placeholder="เช่น พธ.บ. • พธ.ม. • พธ.ด."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    โทนสีสบายตา (Color Theme)
                  </label>
                  <select
                    value={editingItem.colorTheme}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        colorTheme: e.target.value as DepartmentBannerColorTheme,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="sage">🌿 เขียวเซจธรรมชาติ (สบายตา)</option>
                    <option value="emerald">💎 เขียวมรกตสุขุม (ภูมิฐาน)</option>
                    <option value="forest">🌲 เขียวป่าไม้อบอุ่น (สายภาวนา)</option>
                    <option value="amber">☸️ ส้มทองอำพัน (พุทธศาสตร์)</option>
                    <option value="indigo">🏛️ กรมท่าสุขุม (ปรัชญา)</option>
                    <option value="earth">🍂 น้ำตาลเอิร์ธโทน (โบราณ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  คำโปรย / จุดเด่นหลักของสาขาวิชา (Tagline)
                </label>
                <textarea
                  rows={2}
                  value={editingItem.tagline}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, tagline: e.target.value })
                  }
                  placeholder="แนะนำจุดเด่นและเป้าหมายการเรียนการสอนของสาขาวิชา..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  จุดเด่นย่อย (Highlights - บรรทัดละ 1 ข้อ)
                </label>
                <textarea
                  rows={3}
                  value={editingItem.highlightsText}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, highlightsText: e.target.value })
                  }
                  placeholder="เช่น มีทุนการศึกษาสนับสนุน&#10;เปิดสอนภาคปกติและภาคพิเศษ&#10;เน้นการวิจัยเชิงลึก"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ป้ายกำกับพิเศษ (Badge Text)
                  </label>
                  <input
                    type="text"
                    value={editingItem.badgeText}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, badgeText: e.target.value })
                    }
                    placeholder="เช่น 🌟 แนะนำ, 🧘 เน้นปฏิบัติ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ข้อความบนปุ่มกด (Action Text)
                  </label>
                  <input
                    type="text"
                    value={editingItem.actionText}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, actionText: e.target.value })
                    }
                    placeholder="เช่น สมัครเรียนสาขานี้ →"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>
            </>
          )}

          {editingItem.type === 'qualification' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ข้อความ Badge / หัวข้อกลุ่มคุณสมบัติ
                </label>
                <input
                  type="text"
                  value={editingItem.badgeText}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, badgeText: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">สีประจำการ์ด</label>
                <select
                  value={editingItem.themeColor}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      themeColor: e.target.value as 'orange' | 'sky' | 'purple' | 'emerald',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800"
                >
                  <option value="orange">สีส้ม (Orange)</option>
                  <option value="sky">สีฟ้า (Sky)</option>
                  <option value="purple">สีม่วง (Purple)</option>
                  <option value="emerald">สีเขียว (Emerald)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  รายการคุณสมบัติย่อย (1 บรรทัดต่อ 1 ข้อ)
                </label>
                <textarea
                  rows={5}
                  value={editingItem.itemsText}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, itemsText: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 leading-relaxed font-normal"
                />
              </div>
            </>
          )}

          {editingItem.type === 'document' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อเอกสารหลักฐาน</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  รายละเอียดและจำนวนชุดที่ต้องเตรียม
                </label>
                <textarea
                  rows={3}
                  value={editingItem.description}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                />
              </div>
            </>
          )}

          {editingItem.type === 'selectOption' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ข้อความที่แสดงใน Dropdown (Label)
                </label>
                <input
                  type="text"
                  value={editingItem.label}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, label: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ค่าที่บันทึกลงฐานข้อมูล (Value)
                </label>
                <input
                  type="text"
                  value={editingItem.value}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, value: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-800"
                />
              </div>
            </>
          )}

          {editingItem.type === 'course' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รหัสวิชา</label>
                  <input
                    type="text"
                    value={editingItem.code}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, code: e.target.value })
                    }
                    placeholder="เช่น 000 101"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-indigo-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">จำนวนหน่วยกิต</label>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={editingItem.credits}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        credits: Math.max(0, parseInt(e.target.value || '0', 10)),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-center text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อรายวิชา</label>
                <input
                  type="text"
                  value={editingItem.nameTh}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, nameTh: e.target.value })
                  }
                  placeholder="เช่น พระไตรปิฎกศึกษา (Tipitaka Studies)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">หมวดวิชา</label>
                <input
                  type="text"
                  value={editingItem.courseType}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, courseType: e.target.value })
                  }
                  placeholder="เช่น วิชาแกนพระพุทธศาสนา, วิชาปฏิบัติการ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                />
              </div>
            </>
          )}

          {/* Common Toggle: Enabled/Disabled */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 mt-2">
            <div>
              <span className="font-bold text-slate-800">เปิดแสดงผลในหน้า /enroll</span>
              <p className="text-[10px] text-slate-500">
                {editingItem.enabled ? '🟢 แสดงรายการนี้ในระบบ' : '🔴 ซ่อนรายการนี้ชั่วคราว'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={editingItem.enabled}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, enabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setEditingItem(null)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm cursor-pointer transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>บันทึกการแก้ไข</span>
          </button>
        </div>
      </div>
    </div>
  );
}
