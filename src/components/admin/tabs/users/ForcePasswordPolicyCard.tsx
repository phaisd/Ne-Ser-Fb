'use client';

import React from 'react';
import { Lock } from 'lucide-react';

interface ForcePasswordPolicyCardProps {
  forcePasswordChangeOnFirstLogin: boolean;
  onToggleForcePasswordChange?: (enabled: boolean) => void;
  isOfficer?: boolean;
}

export function ForcePasswordPolicyCard({
  forcePasswordChangeOnFirstLogin,
  onToggleForcePasswordChange,
  isOfficer = false,
}: ForcePasswordPolicyCardProps) {
  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-4 rounded-2xl border border-amber-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 mt-0.5">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              ระบบบังคับเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งแรก (Force Password Change on First Login)
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                forcePasswordChangeOnFirstLogin
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border border-slate-300'
              }`}
            >
              {forcePasswordChangeOnFirstLogin ? 'เปิดใช้งานอยู่ (ON)' : 'ปิดใช้งาน (OFF)'}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            เมื่อเปิดใช้งาน อาจารย์และนิสิตที่เข้าสู่ระบบครั้งแรกด้วยรหัสผ่านเริ่มต้น (mcu123456 / รหัสนิสิต) จะต้องตั้งรหัสผ่านใหม่ส่วนตัวก่อนเข้าใช้งานระบบ เพื่อความปลอดภัยของข้อมูล
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
        {isOfficer ? (
          <span className="text-[11px] text-slate-500 font-semibold bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
            🔒 นโยบายระบบ (Super Admin)
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onToggleForcePasswordChange && onToggleForcePasswordChange(!forcePasswordChangeOnFirstLogin)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 cursor-pointer ${
                forcePasswordChangeOnFirstLogin ? 'bg-amber-600' : 'bg-slate-300'
              }`}
              title="คลิกเพื่อ เปิด/ปิด การบังคับเปลี่ยนรหัสผ่านเมื่อเข้าระบบครั้งแรก"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                  forcePasswordChangeOnFirstLogin ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-xs font-bold text-slate-700 min-w-[50px]">
              {forcePasswordChangeOnFirstLogin ? 'เปิดใช้งาน' : 'ปิดการใช้งาน'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
