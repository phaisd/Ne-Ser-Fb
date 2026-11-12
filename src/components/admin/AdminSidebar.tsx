'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckSquare,
  Users,
  Table2,
  X,
  ExternalLink,
  Calendar,
  LayoutDashboard,
  BookOpen,
  Palette,
  UserCog,
  LogOut,
  Award,
  GraduationCap,
} from 'lucide-react';
import { SystemSettings } from '@/types';
import { isAdminOrOfficer } from '@/lib/auth-client';

export type AdminTab =
  | 'DASHBOARD'
  | 'CERTIFICATES'
  | 'STUDENTS'
  | 'ADMISSIONS'
  | 'COURSES'
  | 'TIMETABLES'
  | 'ATTENDANCE'
  | 'EVENTS'
  | 'USERS'
  | 'BRANDING'
  | 'SHEETS';

export interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  settings: SystemSettings;
  pendingRequestsCount: number;
  studentsTotalCount: number;
  isOfficer: boolean;
  isSuperAdmin: boolean;
  currentUser: any;
  handleLogout: () => void;
}

export function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  settings,
  pendingRequestsCount,
  studentsTotalCount,
  isOfficer,
  isSuperAdmin,
  currentUser,
  handleLogout,
}: AdminSidebarProps) {
  if (!isAdminOrOfficer(currentUser)) {
    return null;
  }

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 print:hidden lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
      {/* Sidebar Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-700 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-md">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Admin Logo"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-xl">{settings.logoEmoji || '☸️'}</span>
            )}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-orange-400 tracking-wider uppercase">
              ADMIN CONSOLE
            </div>
            <div className="text-sm font-bold text-white truncate">
              {settings.facultyNameTh || 'คณะพุทธศาสตร์'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {settings.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar Navigation Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Section 1: Main Backend Operations */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            ระบบหลัก (Operations)
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => {
                setActiveTab('DASHBOARD');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'DASHBOARD'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>แดชบอร์ดภาพรวม</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('CERTIFICATES');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'CERTIFICATES'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>อนุมัติหนังสือรับรอง</span>
              </div>
              {pendingRequestsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('STUDENTS');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'STUDENTS'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-orange-400" />
                <span>ทะเบียนนิสิต</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {studentsTotalCount}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ADMISSIONS');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'ADMISSIONS'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>รับสมัครนิสิตใหม่</span>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  settings.showEnrollmentMenu !== false
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {settings.showEnrollmentMenu !== false ? 'เปิด' : 'ซ่อน'}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('COURSES');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'COURSES'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>หลักสูตร & รายวิชา</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('TIMETABLES');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'TIMETABLES'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>ตารางเรียน & ตารางสอน</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ATTENDANCE');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'ATTENDANCE'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-teal-400" />
              <span>เวลาเรียน & ใบกรอกคะแนน</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('EVENTS');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'EVENTS'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>งานกิจกรรมนิสิต</span>
            </button>
          </nav>
        </div>

        {/* Section 2: Administration & Configuration */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            {isOfficer ? 'การจัดการอาจารย์ (Instructor Ops)' : 'การจัดการและตั้งค่า (Administration)'}
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => {
                setActiveTab('USERS');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'USERS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserCog className="w-4 h-4 text-sky-400" />
              <span>{isOfficer ? 'จัดการไอดี & รหัสอาจารย์' : 'จัดการผู้ใช้และบทบาท'}</span>
            </button>

            {!isOfficer && (
              <>
                <button
                  onClick={() => {
                    setActiveTab('BRANDING');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'BRANDING'
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Palette className="w-4 h-4 text-pink-400" />
                  <span>ตั้งค่าโลโก้ & ข้อความ</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('SHEETS');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'SHEETS'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Table2 className="w-4 h-4 text-emerald-400" />
                  <span>เชื่อมต่อ Google Sheets</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Sidebar Bottom Profile & Public Site Link */}
      <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm ${
              isSuperAdmin
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400/30'
                : isOfficer
                ? 'bg-sky-600'
                : 'bg-orange-600'
            }`}
          >
            {isSuperAdmin ? '👑' : isOfficer ? '👮' : currentUser?.name ? currentUser.name.charAt(0) : 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white leading-snug break-words">
              {(() => {
                const rawName = (currentUser?.name || 'ผู้ใช้งาน').replace('อาจารย์ไพศาล', 'พระมหาไพศาล ดิษฐพันธ์');
                if (rawName.includes('(') && rawName.includes(')')) {
                  return rawName;
                }
                const roleSuffix = isSuperAdmin
                  ? 'ผู้ดูแลระบบสูงสุด'
                  : isOfficer
                  ? 'เจ้าหน้าที่'
                  : currentUser?.role === 'ADMIN'
                  ? 'ผู้ดูแลระบบ'
                  : 'อาจารย์ผู้สอน';
                return `${rawName} (${roleSuffix})`;
              })()}
            </div>
            <div className="text-[10px] text-purple-300 font-mono truncate mt-0.5">
              {currentUser?.email || ''}
            </div>
            <div className="text-[9px] text-emerald-400 font-bold uppercase mt-0.5">
              สิทธิ์:{' '}
              {isSuperAdmin
                ? 'SUPER ADMIN'
                : currentUser?.role === 'STUDENT' && currentUser?.isActingOfficer
                ? 'นิสิต (☑️ ช่วยงานเจ้าหน้าที่)'
                : currentUser?.role === 'INSTRUCTOR' && currentUser?.isActingOfficer
                ? 'อาจารย์ (☑️ ช่วยงานเจ้าหน้าที่)'
                : isOfficer
                ? 'เจ้าหน้าที่ (OFFICER)'
                : currentUser?.role || 'ADMIN'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Link
            href="/"
            target="_blank"
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
            title="เปิดหน้าบ้านในแท็บใหม่"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>เปิดหน้าบ้าน</span>
          </Link>
          <button
            onClick={handleLogout}
            className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-medium transition flex items-center justify-center"
            title="ออกจากระบบ"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  </>
  );
}
