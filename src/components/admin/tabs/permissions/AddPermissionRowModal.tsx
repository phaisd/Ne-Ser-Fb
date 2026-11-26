'use client';

import React, { useState } from 'react';
import { ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

interface AddPermissionRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPermission: (perm: {
    name: string;
    desc: string;
    route: string;
    grantToAssistant?: boolean;
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
  const [grantToAssistant, setGrantToAssistant] = useState(true);

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
      grantToAssistant,
    });
    setNewPermName('');
    setNewPermDesc('');
    setNewPermRoute('/admin');
    setGrantToAssistant(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <span>➕ เพิ่มหัวข้อสิทธิ์ / เมนูระบบงานใหม่</span>
            </h3>
            <p className="text-xs text-slate-500">
              กำหนดสิทธิ์เริ่มต้นแยกกันระหว่าง <strong>แอดมิน</strong> และ <strong>ผู้ช่วย</strong>
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

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อระบบงาน / เมนูใหม่ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น จัดการแบบฟอร์มสัมภาษณ์ / ระบบเอกสารวิชาการ"
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
              placeholder="เช่น /admin?tab=ADMISSIONS หรือ /events"
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

          {/* Role Policy Matrix Preset */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>การกำหนดบทบาทเริ่มต้น (Role Permissions Preset):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs space-y-1">
                <div className="font-bold text-indigo-900 flex items-center gap-1">
                  <span>🛡️ สำหรับแอดมิน (Admin)</span>
                </div>
                <p className="text-slate-500 text-[10.5px]">
                  <strong>สิทธิ์เต็ม (Full Access):</strong> ดู, สร้าง, แก้ไข, เปิด/ปิด เมนู และ <strong>ลบข้อมูล (Delete)</strong>
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-teal-100 shadow-2xs space-y-1">
                <div className="font-bold text-teal-900 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>🎓 สำหรับผู้ช่วย (Assistant)</span>
                </div>
                <p className="text-slate-500 text-[10.5px]">
                  <strong>สิทธิ์ปฏิบัติการ (Safe Access):</strong> ดู, สร้าง, แก้ไข, เปิด/ปิด เมนู <strong>(ยกเว้นการลบข้อมูล)</strong>
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={grantToAssistant}
                onChange={(e) => setGrantToAssistant(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
              />
              <span className="font-semibold text-slate-700 text-xs">
                มอบสิทธิ์เริ่มต้นนี้ให้แก่ <strong>ผู้ช่วยเจ้าหน้าที่ (ACTING_OFFICER)</strong> ทันที
              </span>
            </label>

            <div className="text-[10.5px] text-amber-700 bg-amber-50/80 p-2 rounded-lg border border-amber-200 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                ความปลอดภัย: สิทธิ์ &ldquo;การลบข้อมูล (Delete)&rdquo; จะถูกสงวนไว้เฉพาะแอดมินเท่านั้น ผู้ช่วยจะไม่สามารถลบข้อมูลใดๆ ได้
              </span>
            </div>
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
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition"
          >
            + บันทึกเพิ่มหัวข้อสิทธิ์
          </button>
        </div>
      </div>
    </div>
  );
};
