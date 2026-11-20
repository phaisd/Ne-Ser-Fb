'use client';

import React, { useState } from 'react';

interface AddPermissionRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPermission: (perm: {
    name: string;
    desc: string;
    route: string;
  }) => void;
}

export const AddPermissionRowModal: React.FC<AddPermissionRowModalProps> = ({
  isOpen,
  onClose,
  onAddPermission,
}) => {
  const [newPermName, setNewPermName] = useState('');
  const [newPermDesc, setNewPermDesc] = useState('');
  const [newPermRoute, setNewPermRoute] = useState('/admin');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const cleanName = newPermName.trim();
    if (!cleanName) {
      alert('กรุณาระบุชื่อระบบงาน / ความสามารถ');
      return;
    }
    onAddPermission({
      name: cleanName,
      desc: newPermDesc,
      route: newPermRoute,
    });
    setNewPermName('');
    setNewPermDesc('');
    setNewPermRoute('/admin');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              ➕ เพิ่มหัวข้อสิทธิ์ / ระบบงานใหม่ (Add Permission)
            </h3>
            <p className="text-xs text-slate-500">
              เพิ่มแถวรายการสิทธิ์ใหม่ลงในตาราง RBAC Matrix
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
              ชื่อระบบงาน / ความสามารถ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น อนุมัติชั่วโมงกิจกรรมวิปัสสนากัมมัฏฐาน"
              value={newPermName}
              onChange={(e) => setNewPermName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Path / หน้าจอที่เกี่ยวข้อง:
            </label>
            <input
              type="text"
              placeholder="เช่น /events & /admin"
              value={newPermRoute}
              onChange={(e) => setNewPermRoute(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              คำอธิบายรายละเอียดของสิทธิ์:
            </label>
            <textarea
              rows={2}
              placeholder="อธิบายสิ่งที่ผู้มีสิทธิ์นี้สามารถดำเนินการได้..."
              value={newPermDesc}
              onChange={(e) => setNewPermDesc(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
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
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 cursor-pointer"
          >
            + เพิ่มหัวข้อสิทธิ์
          </button>
        </div>
      </div>
    </div>
  );
};
