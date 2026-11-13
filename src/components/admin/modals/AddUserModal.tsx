'use client';

import React from 'react';
import { UserCog, Mail, Info, ShieldCheck } from 'lucide-react';
import { UserAccount } from '@/types';

interface AddUserModalProps {
  isOpen: boolean;
  newUserForm: any;
  setNewUserForm: any;
  isOfficer?: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddUserModal({
  isOpen,
  newUserForm,
  setNewUserForm,
  isOfficer = false,
  onClose,
  onSubmit,
}: AddUserModalProps) {
  if (!isOpen) return null;

  const hasAnyEmail = Boolean(newUserForm.email?.trim() || newUserForm.gmail?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-sky-600" />
            <span>เพิ่มบัญชีผู้ใช้งานใหม่ (Add New User)</span>
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tip for Gmail-only users / external instructors / assistant */}
        <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <p className="font-bold">รองรับผู้ใช้ภายนอก / แอดมินสำรอง ที่ไม่มีอีเมล @mcu.ac.th</p>
            <p className="text-[11px] text-amber-800">
              สำหรับอาจารย์ผู้สอนภายนอก, ผู้ช่วยสอน หรือบัญชีสำรอง สามารถระบุเฉพาะ <strong>Gmail</strong> โดยเว้นว่างช่องอีเมลมหาวิทยาลัยได้ และสามารถเข้าสู่ระบบด้วย Google หรือรหัสผ่านได้ทันที
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อ - นามสกุล / สมณศักดิ์ (ภาษาไทย) <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              required
              value={newUserForm.name || ''}
              onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
              placeholder="เช่น พระมหาดวงเด่น, ดร.สมชาย, หรือ อาจารย์พิเศษภายนอก"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อ - นามสกุลภาษาอังกฤษ (English Name) (ถ้ามี):
            </label>
            <input
              type="text"
              value={newUserForm.nameEn || ''}
              onChange={(e) => setNewUserForm({ ...newUserForm, nameEn: e.target.value })}
              placeholder="e.g. Dr. Somchai Jaidee"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>อีเมล Gmail จริง:</span>
                <span className="text-[10px] text-amber-600 font-normal">ล็อกอินด้วย Google</span>
              </label>
              <input
                type="email"
                value={newUserForm.gmail || ''}
                onChange={(e) => setNewUserForm({ ...newUserForm, gmail: e.target.value })}
                placeholder="example@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>อีเมลมหาวิทยาลัย (@mcu.ac.th):</span>
                <span className="text-[10px] text-slate-400 font-normal">(ถ้ามี)</span>
              </label>
              <input
                type="text"
                value={newUserForm.email || ''}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="example@mcu.ac.th"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
              />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 block">
            * ต้องระบุอีเมลอย่างน้อย 1 ช่องทาง (ระบุเฉพาะ Gmail หรือ @mcu.ac.th หรือระบุทั้งสองอย่างได้)
          </span>

          {/* ประเภทอาจารย์ (ก่อนหน่วยงาน / ภาควิชา) */}
          <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <label className="font-bold text-slate-800 block text-xs">
              ประเภทอาจารย์ / สถานะการสอน:
            </label>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: 'อาจารย์ประจำ', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                { label: 'อาจารย์พิเศษ', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
                { label: 'อาจารย์ผู้ช่วยสอน', color: 'bg-amber-100 text-amber-800 border-amber-300' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setNewUserForm({ ...newUserForm, instructorType: item.label })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    (newUserForm.instructorType || 'อาจารย์ประจำ') === item.label
                      ? `${item.color} ring-2 ring-indigo-400 shadow-xs`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Editable Input Box */}
            <input
              type="text"
              value={newUserForm.instructorType || ''}
              onChange={(e) => setNewUserForm({ ...newUserForm, instructorType: e.target.value })}
              placeholder="เลือกจากปุ่มด้านบน หรือพิมพ์ระบุ เช่น อาจารย์ประจำ, อาจารย์พิเศษ, อาจารย์ผู้ช่วยสอน"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">บทบาทและสิทธิ์การใช้งาน (Role):</label>
              {isOfficer ? (
                <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 font-semibold flex items-center justify-between text-xs">
                  <span>อาจารย์ผู้สอน (INSTRUCTOR)</span>
                  <span className="text-[10px] text-slate-400 font-normal">ล็อกเฉพาะอาจารย์</span>
                </div>
              ) : (
                <select
                  value={newUserForm.role || 'INSTRUCTOR'}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="INSTRUCTOR">อาจารย์ผู้สอน (เช็คชื่อ / ตารางสอน)</option>
                  <option value="OFFICER">เจ้าหน้าที่ดูแลระบบ (พิจารณาคำร้อง)</option>
                  <option value="ADMIN">ผู้ดูแลระบบ (Admin Access)</option>
                </select>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">หน่วยงาน / ภาควิชา:</label>
              <input
                type="text"
                value={newUserForm.department || ''}
                onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                placeholder="เช่น คณะพุทธศาสตร์ หรือ อาจารย์พิเศษภายนอก"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">รหัสผ่านเริ่มต้น:</label>
            <input
              type="text"
              value={newUserForm.password || 'mcu123456'}
              onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              รหัสเริ่มต้นมาตรฐานคือ mcu123456 (ผู้ใช้จะต้องตั้งรหัสผ่านใหม่เมื่อเข้าสู่ระบบครั้งแรก)
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!newUserForm.name?.trim() || !hasAnyEmail}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold transition cursor-pointer shadow-md shadow-sky-600/20"
            >
              บันทึกผู้ใช้ใหม่
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
