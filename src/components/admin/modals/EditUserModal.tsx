'use client';

import React from 'react';
import { Edit } from 'lucide-react';
import { UserAccount, UserRole } from '@/types';

interface EditUserFormState {
  name: string;
  nameEn?: string;
  email: string;
  gmail: string;
  instructorType?: string;
  department: string;
  role: UserRole;
  aliasesText?: string;
  isActingOfficer?: boolean;
}

interface EditUserModalProps {
  editingUser: UserAccount | null;
  editUserForm: EditUserFormState;
  setEditUserForm: React.Dispatch<React.SetStateAction<EditUserFormState>>;
  editUserSaving: boolean;
  isOfficer?: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  editingUser,
  editUserForm,
  setEditUserForm,
  editUserSaving,
  isOfficer = false,
  onClose,
  onSubmit,
}) => {
  if (!editingUser) return null;

  const isSuper =
    editingUser.role === 'SUPER_ADMIN' ||
    editingUser.email === 'phaisal.dis@mcu.ac.th' ||
    editingUser.isSuperAdmin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Edit className="w-4 h-4 text-sky-600" />
            <span>แก้ไขข้อมูลผู้ใช้งาน & อีเมลจริง</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body with Scrollbar */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto pr-1.5 space-y-3.5 text-xs py-2">
          <div>
            <label className="font-bold text-slate-700 block mb-1">ชื่อ - นามสกุล / สมณศักดิ์ (ไทย):</label>
            <input
              type="text"
              required
              value={editUserForm.name}
              onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
              placeholder="เช่น พระมหาดวงเด่น หรือ ดร.สมชาย"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อ - นามสกุล (English) (สำหรับอาจารย์ที่มีสอนภาคภาษาอังกฤษ):
            </label>
            <input
              type="text"
              value={editUserForm.nameEn || ''}
              onChange={(e) => setEditUserForm({ ...editUserForm, nameEn: e.target.value })}
              placeholder="e.g. Ven. Dr. Phramaha Duangden"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
            />
          </div>

          <div>
            <div className="p-2.5 mb-2 bg-amber-50/80 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
              💡 <strong>คำแนะนำ:</strong> หากอาจารย์ไม่ใช้อีเมลมหาวิทยาลัย (@mcu.ac.th) สามารถลบอีเมล @mcu ออก แล้วระบุเพียง <strong>Gmail ใหม่</strong> ในช่องด้านล่างนี้ได้เลย อาจารย์จะสามารถใช้ Gmail ใหม่นี้เข้าสู่ระบบผ่าน Google หรือรหัสผ่านได้ทันที
            </div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
              <span>อีเมลทางการ (@mcu.ac.th):</span>
              <span className="text-[10px] text-slate-400 font-normal">(ลบ/เว้นว่างได้หากใช้เฉพาะ Gmail)</span>
            </label>
            <input
              type="text"
              value={editUserForm.email}
              onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
              placeholder="เว้นว่างได้ หากต้องการใช้ Gmail ใหม่เป็นหลัก"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
              <span>อีเมล Gmail จริง:</span>
              <span className="text-[10px] text-amber-600 font-normal">สำหรับเข้าสู่ระบบด้วย Google หรืออีเมลหลัก</span>
            </label>
            <input
              type="email"
              value={editUserForm.gmail}
              onChange={(e) => setEditUserForm({ ...editUserForm, gmail: e.target.value })}
              placeholder="teacher.real@gmail.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              * รองรับอาจารย์ภายนอก/บัญชีสำรอง สามารถใช้ Gmail นี้เข้าสู่ระบบผ่านปุ่ม Google หรือระบุเป็นรหัสผู้ใช้ได้ทันที
            </span>
          </div>

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
                  onClick={() => setEditUserForm({ ...editUserForm, instructorType: item.label })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    (editUserForm.instructorType || 'อาจารย์ประจำ') === item.label
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
              value={editUserForm.instructorType || ''}
              onChange={(e) => setEditUserForm({ ...editUserForm, instructorType: e.target.value })}
              placeholder="เลือกจากปุ่มด้านบน หรือพิมพ์ระบุ เช่น อาจารย์ประจำ, อาจารย์พิเศษ, อาจารย์ผู้ช่วยสอน"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-xs"
            />
            <span className="text-[10px] text-slate-400 block">
              * ข้อมูลนี้จะแสดงบนบัตรแจ้งภาระงานสอน และใช้จัดกลุ่มในระบบ
            </span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">หน่วยงาน / ภาควิชา:</label>
            <input
              type="text"
              value={editUserForm.department}
              onChange={(e) => setEditUserForm({ ...editUserForm, department: e.target.value })}
              placeholder="เช่น คณะพุทธศาสตร์ ภาควิชาพระพุทธศาสนา"
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">บทบาทและสิทธิ์การใช้งาน (Role):</label>
            {isOfficer ? (
              <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 font-semibold flex items-center justify-between text-xs">
                <span>อาจารย์ผู้สอน (INSTRUCTOR)</span>
                <span className="text-[10px] text-slate-400 font-normal">(เฉพาะ Super Admin ที่เปลี่ยนได้)</span>
              </div>
            ) : (
              <select
                value={editUserForm.role}
                disabled={isSuper}
                onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="INSTRUCTOR">อาจารย์ผู้สอน (INSTRUCTOR)</option>
                <option value="OFFICER">เจ้าหน้าที่บริการการศึกษา (OFFICER)</option>
                <option value="ADMIN">ผู้ดูแลระบบ (ADMIN)</option>
                {isSuper && (
                  <option value="SUPER_ADMIN">👑 ผู้ดูแลระบบสูงสุด (SUPER_ADMIN)</option>
                )}
              </select>
            )}

            {!isOfficer && !isSuper && editUserForm.role === 'INSTRUCTOR' && (
              <label className="mt-2.5 flex items-start gap-2.5 p-3 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={Boolean(editUserForm.isActingOfficer)}
                  onChange={(e) =>
                    setEditUserForm({ ...editUserForm, isActingOfficer: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <div className="text-xs leading-relaxed">
                  <div className="font-bold text-sky-900">
                    ☑️ ช่วยงานเจ้าหน้าที่ (เสริมสิทธิ์เจ้าหน้าที่โดยไม่เปลี่ยนบทบาทอาจารย์)
                  </div>
                  <div className="text-[11px] text-sky-700">
                    เมื่อติ๊กเลือก อาจารย์ท่านนี้จะยังคงมีชื่อในตารางสอนและใบภาระงานสอนตามปกติทุกประการ แต่จะมีปุ่มเข้าหลังบ้าน (Admin Console) เพื่อช่วยตรวจเอกสารคำร้องและงานทะเบียนได้จนกว่าแอดมินจะติ๊กออก
                  </div>
                </div>
              </label>
            )}
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 sticky bottom-0 bg-white/95 backdrop-blur-xs py-1.5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer transition text-xs"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={editUserSaving}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold cursor-pointer transition shadow-md shadow-sky-600/20 text-xs"
            >
              {editUserSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
