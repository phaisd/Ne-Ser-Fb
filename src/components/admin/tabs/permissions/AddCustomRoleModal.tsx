'use client';

import React, { useState } from 'react';
import { RoleColumnConfig, SystemRoleKey } from './types';

interface AddCustomRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleColumns: RoleColumnConfig[];
  onAddRole: (role: {
    title: string;
    code: string;
    desc: string;
    theme: RoleColumnConfig['colorTheme'];
    baseRoleKey: SystemRoleKey;
  }) => void;
}

export const AddCustomRoleModal: React.FC<AddCustomRoleModalProps> = ({
  isOpen,
  onClose,
  roleColumns,
  onAddRole,
}) => {
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleTheme, setNewRoleTheme] = useState<RoleColumnConfig['colorTheme']>('teal');
  const [newRoleBaseKey, setNewRoleBaseKey] = useState<SystemRoleKey>('ACTING_OFFICER');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const cleanTitle = newRoleTitle.trim();
    if (!cleanTitle) {
      alert('กรุณาระบุชื่อบทบาท (เช่น เจ้าหน้าที่หลักสูตรนานาชาติ)');
      return;
    }
    onAddRole({
      title: cleanTitle,
      code: newRoleCode,
      desc: newRoleDesc,
      theme: newRoleTheme,
      baseRoleKey: newRoleBaseKey,
    });
    setNewRoleTitle('');
    setNewRoleCode('');
    setNewRoleDesc('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              ➕ เพิ่มบทบาทผู้ใช้งานใหม่ (Add Custom Role)
            </h3>
            <p className="text-xs text-slate-500">
              สร้างคอลัมน์บทบาทใหม่ในตารางเพื่อกำหนดสิทธิ์เฉพาะทาง
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อบทบาทภาษาไทย <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น เจ้าหน้าที่หลักสูตรนานาชาติ, ผู้ช่วยสอน (TA)"
              value={newRoleTitle}
              onChange={(e) => setNewRoleTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              รหัสบทบาทภาษาอังกฤษ (ไม่บังคับ — ระบบสร้างให้อัตโนมัติได้)
            </label>
            <input
              type="text"
              placeholder="เช่น CURRICULUM_STAFF, EVENT_STAFF"
              value={newRoleCode}
              onChange={(e) => setNewRoleCode(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              คัดลอกสิทธิ์ตั้งต้นจากบทบาทใด:
            </label>
            <select
              value={newRoleBaseKey}
              onChange={(e) => setNewRoleBaseKey(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
            >
              {roleColumns.map((c) => (
                <option key={c.key} value={c.key}>
                  ต้นแบบจาก: {c.title} ({c.badge})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">โทนสีป้ายกำกับ:</label>
            <select
              value={newRoleTheme}
              onChange={(e) => setNewRoleTheme(e.target.value as RoleColumnConfig['colorTheme'])}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
            >
              <option value="teal">เขียวมิ้นต์ (Teal)</option>
              <option value="sky">ฟ้า (Sky Blue)</option>
              <option value="indigo">น้ำเงินคราม (Indigo)</option>
              <option value="purple">ม่วง (Purple)</option>
              <option value="emerald">เขียวมรกต (Emerald)</option>
              <option value="amber">ส้มอำพัน (Amber)</option>
              <option value="rose">ชมพูโรส (Rose)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">คำอธิบายขอบเขตหน้าที่:</label>
            <textarea
              rows={2}
              placeholder="ระบุหน้าที่ความรับผิดชอบโดยย่อ..."
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 cursor-pointer"
          >
            + สร้างบทบาทใหม่
          </button>
        </div>
      </div>
    </div>
  );
};
