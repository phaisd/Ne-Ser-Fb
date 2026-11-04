'use client';

import React from 'react';
import { Edit } from 'lucide-react';
import { UserAccount, UserRole } from '@/types';

interface EditUserFormState {
  name: string;
  nameEn?: string;
  email: string;
  gmail: string;
  department: string;
  role: UserRole;
}

interface EditUserModalProps {
  editingUser: UserAccount | null;
  editUserForm: EditUserFormState;
  setEditUserForm: React.Dispatch<React.SetStateAction<EditUserFormState>>;
  editUserSaving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  editingUser,
  editUserForm,
  setEditUserForm,
  editUserSaving,
  onClose,
  onSubmit,
}) => {
  if (!editingUser) return null;

  const isSuper = editingUser.email === 'phaisal.dis@mcu.ac.th' || editingUser.isSuperAdmin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Edit className="w-4 h-4 text-sky-600" />
            <span>แก้ไขข้อมูลผู้ใช้งาน & อีเมลจริง</span>
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
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
            <label className="font-bold text-slate-700 block mb-1">
              อีเมลทางการ (@mcu.ac.th):
            </label>
            <input
              type="email"
              required
              value={editUserForm.email}
              onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
              placeholder="name@mcu.ac.th"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
              <span>อีเมล Gmail จริงของอาจารย์:</span>
              <span className="text-[10px] text-amber-600 font-normal">สำหรับเข้าสู่ระบบด้วย Google</span>
            </label>
            <input
              type="email"
              value={editUserForm.gmail}
              onChange={(e) => setEditUserForm({ ...editUserForm, gmail: e.target.value })}
              placeholder="teacher.real@gmail.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              * เมื่อบันทึกแล้ว อาจารย์สามารถใช้ Gmail จริงนี้เข้าสู่ระบบผ่านปุ่ม Google ได้ทันที
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
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={editUserSaving}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold cursor-pointer"
            >
              {editUserSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
