'use client';

import React from 'react';
import {
  ShieldCheck,
  UserCog,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
} from 'lucide-react';
import { SystemSettings, SignatoryItem } from '@/types';

interface BrandSignatoriesSectionProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  activeSignatoriesList: SignatoryItem[];
  isAddingSignatory: boolean;
  setIsAddingSignatory: (open: boolean) => void;
  newSignatoryForm: SignatoryItem;
  setNewSignatoryForm: React.Dispatch<React.SetStateAction<SignatoryItem>>;
  handleAddSignatory: (e?: any) => void;
  handleResetSignatories: () => void;
  editingSignatoryId: string | null;
  setEditingSignatoryId: (id: string | null) => void;
  editSignatoryForm: SignatoryItem;
  setEditSignatoryForm: React.Dispatch<React.SetStateAction<SignatoryItem>>;
  handleSaveEditSignatory: () => void;
  handleDeleteSignatory: (id: string, label: string) => void;
}

export function BrandSignatoriesSection({
  settings,
  setSettings,
  activeSignatoriesList,
  isAddingSignatory,
  setIsAddingSignatory,
  newSignatoryForm,
  setNewSignatoryForm,
  handleAddSignatory,
  handleResetSignatories,
  editingSignatoryId,
  setEditingSignatoryId,
  editSignatoryForm,
  setEditSignatoryForm,
  handleSaveEditSignatory,
  handleDeleteSignatory,
}: BrandSignatoriesSectionProps) {
  return (
    <div className="space-y-5">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-pink-600" />
            <span>3. ข้อมูลผู้ลงนามหนังสือรับรอง และจัดการตัวเลือกใน Dropdown</span>
          </h3>
          <span className="text-[11px] text-pink-700 bg-pink-50 border border-pink-200 font-semibold px-2.5 py-0.5 rounded-full">
            ระบบจัดการรายชื่อผ่านหน้าจอ
          </span>
        </div>

        {/* Primary Default Signer */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-700">
            ผู้ลงนามหลักค่าเริ่มต้น (Default Primary Signatory - คณบดี):
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-600 block mb-1">ชื่อผู้ลงนามหลัก (ภาษาไทย):</label>
              <input
                type="text"
                value={settings.signerNameTh || ''}
                onChange={(e) => setSettings({ ...settings, signerNameTh: e.target.value })}
                placeholder="พระครูสุธีกิตติบัณฑิต, รศ.ดร."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">ตำแหน่งผู้ลงนามหลัก (ภาษาไทย):</label>
              <input
                type="text"
                value={settings.signerTitleTh || ''}
                onChange={(e) => setSettings({ ...settings, signerTitleTh: e.target.value })}
                placeholder="คณบดีคณะพุทธศาสตร์"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">ชื่อผู้ลงนามหลัก (ภาษาอังกฤษ):</label>
              <input
                type="text"
                value={settings.signerNameEn || ''}
                onChange={(e) => setSettings({ ...settings, signerNameEn: e.target.value })}
                placeholder="Assoc. Prof. Dr. Phrakhrusutheekittibandhit"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">ตำแหน่งผู้ลงนามหลัก (ภาษาอังกฤษ):</label>
              <input
                type="text"
                value={settings.signerTitleEn || ''}
                onChange={(e) => setSettings({ ...settings, signerTitleEn: e.target.value })}
                placeholder="Dean of the Faculty of Buddhism"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Dropdown Signatories List Management */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <UserCog className="w-4 h-4 text-purple-600" />
                <span>จัดการรายชื่อและตำแหน่งในเมนู Dropdown (Signatories in Dropdown Menu)</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                ท่านสามารถเพิ่ม แก้ไขชื่อ หรือลบตำแหน่งผู้ลงนาม เพื่อให้ปรากฏในเมนู Dropdown ในหน้าพรีวิวเอกสาร
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddingSignatory(!isAddingSignatory)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มผู้ลงนามใหม่</span>
              </button>
              <button
                type="button"
                onClick={handleResetSignatories}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                title="คืนค่าเป็นชุดมาตรฐาน 6 รูปแบบเริ่มต้น"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>รีเซ็ตค่าเริ่มต้น</span>
              </button>
            </div>
          </div>

          {/* Add Signatory Form Box (if open) */}
          {isAddingSignatory && (
            <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-3 animate-fade-in text-xs">
              <div className="font-bold text-purple-950 flex items-center justify-between">
                <span>กรอกข้อมูลผู้ลงนามใหม่:</span>
                <button
                  type="button"
                  onClick={() => setIsAddingSignatory(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    1. ข้อความในเมนู Dropdown (Label):
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 7. ผู้ช่วยคณบดีฝ่าย..."
                    value={newSignatoryForm.label}
                    onChange={(e) => setNewSignatoryForm({ ...newSignatoryForm, label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    2. ชื่อและสมณศักดิ์ (Name):
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น พระมหา... หรือเว้นว่างสำหรับเซ็นสด"
                    value={newSignatoryForm.name}
                    onChange={(e) => setNewSignatoryForm({ ...newSignatoryForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    3. ตำแหน่งทางการ (Title):
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ผู้ช่วยคณบดีฝ่ายวิชาการ"
                    value={newSignatoryForm.title}
                    onChange={(e) => setNewSignatoryForm({ ...newSignatoryForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingSignatory(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleAddSignatory}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  บันทึกเพิ่มเข้ารายชื่อ
                </button>
              </div>
            </div>
          )}

          {/* Table of Signatories */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                  <tr>
                    <th className="p-3 w-1/3">ข้อความในเมนู Dropdown (Label)</th>
                    <th className="p-3 w-1/4">ชื่อผู้ลงนาม (Name)</th>
                    <th className="p-3">ตำแหน่ง (Title)</th>
                    <th className="p-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeSignatoriesList.map((item) => {
                    const isEditing = editingSignatoryId === item.id;

                    if (isEditing) {
                      return (
                        <tr key={item.id} className="bg-purple-50/50">
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={editSignatoryForm.label}
                              onChange={(e) => setEditSignatoryForm({ ...editSignatoryForm, label: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 text-xs bg-white font-medium"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={editSignatoryForm.name}
                              placeholder="เว้นว่างสำหรับเซ็นสด"
                              onChange={(e) => setEditSignatoryForm({ ...editSignatoryForm, name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 text-xs bg-white"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={editSignatoryForm.title}
                              onChange={(e) => setEditSignatoryForm({ ...editSignatoryForm, title: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 text-xs bg-white"
                            />
                          </td>
                          <td className="p-2.5 text-right whitespace-nowrap space-x-1">
                            <button
                              type="button"
                              onClick={handleSaveEditSignatory}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                            >
                              บันทึก
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSignatoryId(null)}
                              className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs cursor-pointer"
                            >
                              ยกเลิก
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{item.label}</span>
                            {(item as any).isDefault && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                เริ่มต้น
                              </span>
                            )}
                            {!item.name && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                                เซ็นสด
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-slate-700 font-medium">
                          {item.name ? item.name : <span className="text-slate-400 italic">เว้นว่าง (ลงนามสดด้วยปากกา)</span>}
                        </td>
                        <td className="p-3 text-slate-600">
                          {item.title}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSignatoryId(item.id);
                              setEditSignatoryForm(item);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                            title="แก้ไขชื่อหรือตำแหน่ง"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSignatory(item.id, item.label)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="ลบออกจากเมนู Dropdown"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
