'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserCheck,
  KeyRound,
  GraduationCap,
  Lock,
  CheckSquare,
  LogOut,
} from 'lucide-react';
import { canAccessAdminConsole } from '@/lib/auth-client';
import ThemeModeToggle from '@/components/ThemeModeToggle';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavbarMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminRoute: boolean;
  pathname: string;
  currentUser: any;
  userHasProjectDuty: boolean;
  isInstructorOnly: boolean;
  isStaffOrInstructor: boolean;
  activeVipassanaStation: {
    eventId: string;
    eventTitle: string;
    action: string;
    url: string;
  } | null;
  adminNavItems: NavItem[];
  publicNavItems: NavItem[];
  selectedLanguageCode: string;
  onSelectLanguage: (code: string) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const NavbarMobileDrawer: React.FC<NavbarMobileDrawerProps> = ({
  isOpen,
  onClose,
  isAdminRoute,
  pathname,
  currentUser,
  userHasProjectDuty,
  isInstructorOnly,
  isStaffOrInstructor,
  activeVipassanaStation,
  adminNavItems,
  publicNavItems,
  selectedLanguageCode,
  onSelectLanguage,
  onOpenProfile,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-Down or Drawer Container */}
      <div
        className={`fixed inset-x-0 top-16 z-50 lg:hidden border-b shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-3 duration-200 ${
          isAdminRoute
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto">
          {/* User summary card in drawer */}
          {currentUser ? (
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                isAdminRoute
                  ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                  : 'bg-orange-50/70 border-orange-200 text-orange-950'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs truncate">{currentUser.name}</div>
                  <div className="text-[10px] opacity-70 truncate">
                    {currentUser.email || currentUser.role}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProfile();
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-800 shadow-xs border border-slate-200 shrink-0 cursor-pointer"
              >
                โปรไฟล์
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-md transition"
            >
              <KeyRound className="w-4 h-4" />
              <span>เข้าสู่ระบบอาจารย์ / เจ้าหน้าที่</span>
            </Link>
          )}

          {/* Quick Portal Switcher Pills in Drawer */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              onClick={onClose}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                !isAdminRoute
                  ? 'bg-orange-500 text-white border-orange-600'
                  : 'bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>หน้านิสิต (หน้าบ้าน)</span>
            </Link>

            {canAccessAdminConsole(currentUser) ? (
              <Link
                href={
                  userHasProjectDuty
                    ? activeVipassanaStation?.url || '/admin?tab=EVENTS'
                    : isInstructorOnly
                    ? '/admin?tab=ATTENDANCE'
                    : '/admin'
                }
                onClick={onClose}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                  isAdminRoute && pathname.startsWith('/admin')
                    ? 'bg-purple-600 text-white border-purple-700'
                    : 'bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>
                  {currentUser?.role === 'VIPASSANA_MASTER'
                    ? 'หน้าสอบอารมณ์'
                    : userHasProjectDuty && activeVipassanaStation
                    ? 'หน้าสแกน/สอบอารมณ์'
                    : isInstructorOnly
                    ? 'ระบบเวลาเรียน'
                    : 'ระบบ Admin'}
                </span>
              </Link>
            ) : isStaffOrInstructor ? (
              <Link
                href="/attendance"
                onClick={onClose}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                  pathname === '/attendance'
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>บันทึกเวลาเรียน</span>
              </Link>
            ) : null}
          </div>

          {/* Navigation Links list */}
          <div className="space-y-1">
            <div className="text-[11px] font-extrabold text-slate-400 px-2 py-1 uppercase tracking-wider">
              เมนูหลัก (Navigation)
            </div>
            {(isAdminRoute ? adminNavItems : publicNavItems).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition min-h-[44px] ${
                    isAdminRoute
                      ? isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : isActive
                        ? 'bg-orange-100 text-orange-900 shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive
                        ? isAdminRoute
                          ? 'text-white'
                          : 'text-orange-600'
                        : 'opacity-70'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Display Mode (โหมดกลางวัน / โหมดกลางคืน) */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5">
            <div className="text-[11px] font-extrabold text-slate-400 px-2 uppercase tracking-wider">
              โหมดการแสดงผล (Display Mode)
            </div>
            <ThemeModeToggle variant="full" />
          </div>

          {/* Language Selector in Drawer */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
            <div className="text-[11px] font-extrabold text-slate-400 px-2 uppercase tracking-wider">
              แปลภาษา (Languages)
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { code: 'th', flag: '🇹🇭', label: 'ไทย (Thai)' },
                { code: 'en', flag: '🇬🇧', label: 'English' },
                { code: 'my', flag: '🇲🇲', label: 'မြန်မာ (Burmese)' },
                { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
                { code: 'km', flag: '🇰🇭', label: 'ភាសាខ្มែរ' },
                { code: 'zh-CN', flag: '🇨🇳', label: '中文' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    onSelectLanguage(item.code);
                    onClose();
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition text-left cursor-pointer min-h-[40px] ${
                    selectedLanguageCode === item.code
                      ? 'bg-orange-500 text-white border-orange-600'
                      : isAdminRoute
                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>{item.flag}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Logout button if logged in */}
          {currentUser && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition min-h-[44px] cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
