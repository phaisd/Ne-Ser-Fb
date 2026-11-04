'use client';

import React from 'react';
import { UserCog } from 'lucide-react';
import { UserAccount } from '@/types';

interface AddUserModalProps {
  isOpen: boolean;
  newUserForm: any;
  setNewUserForm: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddUserModal({
  isOpen,
  newUserForm,
  setNewUserForm,
  onClose,
  onSubmit,
}: AddUserModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-sky-600" />
            เพิ่มบัญชีผู้ใช้งานใหม่
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">ชื่อ - นามสกุล / สมณศักดิ์:</label>
            <input
              type="text"
              required
              value={newUserForm.name}
              onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
              placeholder="เช่น พระมหาดวงเด่น หรือ ดร.สมชาย"
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">อีเมลทางการ (@mcu.ac.th):</label>
            <input
              type="email"
              required
              value={newUserForm.email}
              onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              placeholder="example@mcu.ac.th"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">อีเมลสำรอง Gmail (ถ้ามี):</label>
            <input
              type="email"
              value={newUserForm.gmail}
              onChange={(e) => setNewUserForm({ ...newUserForm, gmail: e.target.value })}
              placeholder="example.mcu@gmail.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">บทบาทและสิทธิ์การใช้งาน (Role):</label>
            <select
              value={newUserForm.role}
              onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
            >
              <option value="INSTRUCTOR">อาจารย์ผู้สอน (เช็คชื่อเวลาเรียน)</option>
              <option value="OFFICER">เจ้าหน้าที่ทะเบียน (พิจารณาคำร้องและทะเบียนนิสิต)</option>
              <option value="ADMIN">ผู้ดูแลระบบสูงสุด (Admin Full Access)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">รหัสผ่านเริ่มต้น:</label>
            <input
              type="text"
              value={newUserForm.password || ''}
              onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold cursor-pointer"
            >
              บันทึกผู้ใช้ใหม่
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
