'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserCheck,
  ChevronDown,
  Briefcase,
  User,
  KeyRound,
  History,
  LogOut,
  Laptop,
  ShieldCheck,
} from 'lucide-react';

interface NavbarUserMenuProps {
  currentUser: any;
  isAdminRoute: boolean;
  isStaffOrInstructor: boolean;
  isStudent: boolean;
  autoLogoutMins: number;
  suspiciousAlertsCount: number;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
  onToggleAutoLogout: () => void;
  onOpenProfile: (tab: 'PROFILE' | 'PASSWORD' | 'HISTORY') => void;
  onLogout: () => void;
}

export const NavbarUserMenu: React.FC<NavbarUserMenuProps> = ({
  currentUser,
  isAdminRoute,
  isStaffOrInstructor,
  isStudent,
  autoLogoutMins,
  suspiciousAlertsCount,
  isUserMenuOpen,
  setIsUserMenuOpen,
  onToggleAutoLogout,
  onOpenProfile,
  onLogout,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Auto-Logout / Personal Mode Toggle Pill */}
      {autoLogoutMins === 0 ? (
        <button
          onClick={onToggleAutoLogout}
          title="โหมดเครื่องส่วนตัว (ปิด Auto-Logout ไม่เตือน) — คลิกเพื่อเปิดระบบป้องกัน 15 นาที"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer"
        >
          <Laptop className="w-3.5 h-3.5 text-amber-500" />
          <span>เครื่องส่วนตัว</span>
        </button>
      ) : (
        <button
          onClick={onToggleAutoLogout}
          title={`ระบบป้องกัน Auto-Logout ${autoLogoutMins} นาที — คลิกเพื่อสลับเป็นโหมดเครื่องส่วนตัว`}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Auto-Logout {autoLogoutMins}น.</span>
        </button>
      )}

      {/* User Profile & Actions Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          title="คลิกเพื่อเปิดเมนูบัญชีผู้ใช้"
          className={`group flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer hover:shadow-md ${
            isAdminRoute
              ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 hover:border-emerald-500/50'
              : 'bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-200 hover:border-orange-300'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline truncate max-w-[130px]">{currentUser.name}</span>
          {suspiciousAlertsCount > 0 && (
            <span
              title={`พบประวัติความปลอดภัยที่ควรตรวจสอบ ${suspiciousAlertsCount} รายการ`}
              className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0"
            />
          )}
          <span className="text-[10px] opacity-70 font-normal hidden md:inline ml-0.5 underline">
            (แก้ไข)
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform opacity-70 ${
              isUserMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isUserMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsUserMenuOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
              {/* User Header */}
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 -mt-2 mb-1.5 rounded-t-2xl">
                <div className="text-[10px] font-bold text-orange-600 uppercase flex items-center gap-1">
                  <span>
                    {currentUser.role === 'SUPER_ADMIN' || currentUser.isSuperAdmin
                      ? '👑 ผู้ดูแลระบบสูงสุด'
                      : currentUser.role === 'ADMIN'
                      ? '🛡️ ผู้ดูแลระบบ'
                      : currentUser.role === 'OFFICER'
                      ? '👮 เจ้าหน้าที่'
                      : isStudent
                      ? currentUser.isActingOfficer
                        ? '🎓 นิสิต (☑️ ช่วยงานเจ้าหน้าที่)'
                        : '🎓 นิสิต'
                      : currentUser.isActingOfficer
                      ? '🔒 อาจารย์ผู้สอน (☑️ ช่วยงานเจ้าหน้าที่)'
                      : '🔒 อาจารย์ผู้สอน'}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  {currentUser.email}
                </div>
              </div>

              {/* Dropdown Items */}
              <div className="p-1 space-y-0.5 text-xs font-semibold">
                {isStaffOrInstructor && (
                  <Link
                    href="/workload"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-3 py-2 text-left rounded-xl hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span>ภาระงานสอนของฉัน</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenProfile('PROFILE');
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-orange-50 hover:text-orange-900 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <User className="w-4 h-4 text-orange-600" />
                  <span>{isStudent ? 'แก้ไขโปรไฟล์นิสิต' : 'แก้ไขโปรไฟล์อาจารย์'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenProfile('PASSWORD');
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-orange-50 hover:text-orange-900 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>รีเซ็ตรหัสผ่านใหม่</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenProfile('HISTORY');
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-orange-50 hover:text-orange-900 flex items-center justify-between gap-2 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <History className="w-4 h-4 text-indigo-600" />
                    <span>ประวัติการเข้าใช้งาน</span>
                  </span>
                  {suspiciousAlertsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                      {suspiciousAlertsCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="border-t border-slate-100 my-1" />

              {/* Logout Option */}
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition font-bold text-xs cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
