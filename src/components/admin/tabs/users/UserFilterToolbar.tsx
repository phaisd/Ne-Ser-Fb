'use client';

import React from 'react';
import { Search, FileSpreadsheet } from 'lucide-react';
import { UserAccount, Student } from '@/types';
import type { AdminUserFilterItem } from '@/hooks/admin/useAdminUsers';

interface UserFilterToolbarProps {
  userSearch: string;
  setUserSearch: (val: string) => void;
  userRoleFilter: string;
  setUserRoleFilter: (val: string) => void;
  users: UserAccount[];
  filteredUsers: AdminUserFilterItem[];
  studentsList: Student[];
  isOfficer?: boolean;
  onOpenVipassanaMasterModal: () => void;
}

export function UserFilterToolbar({
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  users,
  filteredUsers,
  studentsList,
  isOfficer = false,
  onOpenVipassanaMasterModal,
}: UserFilterToolbarProps) {
  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5 text-xs">
      {/* ROW 1: Search Box + Green Line Set */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วยชื่ออาจารย์, ฉายา, อีเมล @mcu.ac.th, Gmail หรือภาควิชา..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
          />
          {userSearch && (
            <button
              type="button"
              onClick={() => setUserSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-0.5"
              title="ล้างคำค้นหา"
            >
              ✕
            </button>
          )}
        </div>

        {/* Roles Line Set */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 rounded-xl font-bold shrink-0">
          <button
            onClick={() => setUserRoleFilter('ALL')}
            className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
              userRoleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isOfficer ? `อาจารย์ทั้งหมด (${filteredUsers.length})` : `ทั้งหมด (${users.length})`}
          </button>
          {!isOfficer && (
            <>
              <button
                onClick={() => setUserRoleFilter('SUPER_ADMIN')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  userRoleFilter === 'SUPER_ADMIN' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-700 hover:bg-white/60'
                }`}
              >
                👑 Super Admin ({users.filter((u) => u.role === 'SUPER_ADMIN' || u.isSuperAdmin || u.email === 'phaisal.dis@mcu.ac.th').length})
              </button>
              <button
                onClick={() => setUserRoleFilter('ADMIN')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  userRoleFilter === 'ADMIN' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-700 hover:bg-white/60'
                }`}
              >
                Admin ({users.filter((u) => u.role === 'ADMIN' && !u.isSuperAdmin && u.email !== 'phaisal.dis@mcu.ac.th').length})
              </button>
              <button
                onClick={() => setUserRoleFilter('OFFICER')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  userRoleFilter === 'OFFICER' ? 'bg-sky-600 text-white shadow-xs' : 'text-sky-700 hover:bg-white/60'
                }`}
              >
                📋 เจ้าหน้าที่หลักสูตร ({users.filter((u) => u.role === 'OFFICER').length})
              </button>
              <button
                onClick={() => setUserRoleFilter('STAFF')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  userRoleFilter === 'STAFF' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700 hover:bg-white/60'
                }`}
              >
                💼 สายสนับสนุน ({users.filter((u) => u.role === 'STAFF').length})
              </button>
            </>
          )}
          <button
            onClick={() => setUserRoleFilter('INSTRUCTOR')}
            className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
              userRoleFilter === 'INSTRUCTOR' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-white/60'
            }`}
          >
            👨‍🏫 อาจารย์ ({isOfficer ? filteredUsers.length : users.filter((u) => (u.role || 'INSTRUCTOR') === 'INSTRUCTOR').length})
          </button>
        </div>
      </div>

      {/* ROW 2: Blue Line Set + Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 rounded-xl font-bold">
          {!isOfficer && (
            <button
              onClick={() => setUserRoleFilter('VIPASSANA_MASTER')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                userRoleFilter === 'VIPASSANA_MASTER'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-white/60'
              }`}
            >
              <span>🧘 พระวิปัสสนาจารย์ ({users.filter((u) => u.role === 'VIPASSANA_MASTER').length})</span>
            </button>
          )}
          <button
            onClick={() => setUserRoleFilter('STUDENT')}
            className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
              userRoleFilter === 'STUDENT' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-800 hover:bg-white/60'
            }`}
          >
            🎓 นิสิต ({studentsList.length})
          </button>
          <button
            onClick={() => setUserRoleFilter('ACTING_OFFICER')}
            className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
              userRoleFilter === 'ACTING_OFFICER'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-teal-800 hover:bg-white/60'
            }`}
            title="ดูรายชื่ออาจารย์และนิสิตที่ได้รับมอบหมายให้เป็นผู้ช่วยเจ้าหน้าที่ (ช่วยงานเจ้าหน้าที่)"
          >
            ☑️ ผู้ช่วยเจ้าหน้าที่ (
            {users.filter((u) => u.isActingOfficer).length +
              studentsList.filter((s) => s.isActingOfficer).length}
            )
          </button>
          <button
            onClick={() => setUserRoleFilter('SUSPENDED')}
            className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
              userRoleFilter === 'SUSPENDED' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-white/60'
            }`}
          >
            ⛔ ถูกระงับ ({users.filter((u) => u.isSuspended || u.isActive === false).length})
          </button>
        </div>

        {/* Right side of Row 2: Vipassana Master Excel shortcut */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenVipassanaMasterModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs shadow-2xs transition cursor-pointer"
            title="นำเข้า/ส่งออก พระวิปัสสนาจารย์ พร้อมสร้างไอดีและรหัสผ่านอัตโนมัติ"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-700" />
            <span>นำเข้า/ส่งออก Excel พระวิปัสสนาจารย์</span>
          </button>
        </div>
      </div>
    </div>
  );
}
