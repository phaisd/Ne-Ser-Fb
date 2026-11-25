'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface NavbarSessionConflictModalProps {
  isOpen: boolean;
  message?: string;
  activeDevice?: string;
}

export const NavbarSessionConflictModal: React.FC<NavbarSessionConflictModalProps> = ({
  isOpen,
  message,
  activeDevice,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 text-center space-y-4 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-extrabold text-slate-900">
            เซสชันสิ้นสุดลง: มีการเข้าสู่ระบบจากเครื่องอื่น
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {message ||
              'บัญชีนี้ได้รับการเข้าสู่ระบบจากอุปกรณ์อื่นล่าสุด ระบบได้ทำการออกจากระบบเครื่องนี้โดยอัตโนมัติเพื่อความปลอดภัย'}
          </p>
          {activeDevice && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-mono font-bold border border-slate-200">
              <span>อุปกรณ์ล่าสุด: {activeDevice}</span>
            </div>
          )}
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              window.location.href = '/login';
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            เข้าสู่ระบบใหม่อีกครั้ง
          </button>
        </div>
      </div>
    </div>
  );
};
