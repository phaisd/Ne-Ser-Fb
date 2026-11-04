'use client';

import React from 'react';
import {
  UserCog,
  RefreshCw,
  Plus,
  Search,
  Mail,
  Ban,
  Check,
  Eye,
  Edit,
  FileText,
  Copy,
  UserCheck,
} from 'lucide-react';
import { UserAccount, Student } from '@/types';

interface AdminUsersTabProps {
  users: UserAccount[];
  filteredUsers: any[];
  studentsList: Student[];
  userSearch: string;
  setUserSearch: (val: string) => void;
  userRoleFilter: string;
  setUserRoleFilter: (val: string) => void;
  isScanningInstructors: boolean;
  handleScanTimetables: () => void;
  setIsAddUserOpen: (val: boolean) => void;
  setActiveTab: (tab: any) => void;
  setStudentSearch: (val: string) => void;
  handleStartEditUser: (u: UserAccount) => void;
  handleOpenTeachingSlip: (u: UserAccount) => void;
  handleCopyLineTeachingMessage: (u: UserAccount) => void;
  copiedLineUserId: string | null;
  handleToggleSuspend: (id: string, isSuspended: boolean, name: string) => void;
  handleUpdateRole: (id: string, newRole: any) => void;
  handleResetPassword: (id: string, name: string) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  users,
  filteredUsers,
  studentsList,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  isScanningInstructors,
  handleScanTimetables,
  setIsAddUserOpen,
  setActiveTab,
  setStudentSearch,
  handleStartEditUser,
  handleOpenTeachingSlip,
  handleCopyLineTeachingMessage,
  copiedLineUserId,
  handleToggleSuspend,
  handleUpdateRole,
  handleResetPassword,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-sky-600" />
            จัดการผู้ใช้งานและกำหนดบทบาท (Users & Roles Management)
          </h2>
          <p className="text-xs text-slate-500">
            กำหนดสิทธิ์การใช้งานระบบ เช่น ผู้ดูแลระบบ (ADMIN), เจ้าหน้าที่ทะเบียน (OFFICER), และอาจารย์ผู้สอน (INSTRUCTOR)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleScanTimetables}
            disabled={isScanningInstructors}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            title="สแกนตารางสอนและเตรียมสร้างไอดีสำหรับอาจารย์ใหม่ที่ยังไม่มีบัญชี"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanningInstructors ? 'animate-spin' : ''}`} />
            <span>🔄 ซิงค์และสร้างไอดีอาจารย์จากตารางสอน</span>
          </button>

          <button
            onClick={() => setIsAddUserOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มบัญชีผู้ใช้งาน</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วยชื่ออาจารย์, อีเมล @mcu.ac.th, Gmail หรือภาควิชา..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl font-bold w-full md:w-auto shrink-0">
          <button
            onClick={() => setUserRoleFilter('ALL')}
            className={`px-2.5 py-1.5 rounded-lg transition ${
              userRoleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            ทั้งหมด ({users.length})
          </button>
          <button
            onClick={() => setUserRoleFilter('SUPER_ADMIN')}
            className={`px-2.5 py-1.5 rounded-lg transition ${
              userRoleFilter === 'SUPER_ADMIN' ? 'bg-purple-700 text-white shadow-sm' : 'text-purple-700'
            }`}
          >
            👑 Super Admin ({users.filter((u) => u.role === 'SUPER_ADMIN' || u.isSuperAdmin || u.email === 'phaisal.dis@mcu.ac.th').length})
          </button>
          <button
            onClick={() => setUserRoleFilter('ADMIN')}
            className={`px-2.5 py-1.5 rounded-lg transition ${
              userRoleFilter === 'ADMIN' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-700'
            }`}
          >
            Admin ({users.filter((u) => u.role === 'ADMIN').length})
          </button>
          <button
            onClick={() => setUserRoleFilter('OFFICER')}
            className={`px-2.5 py-1.5 rounded-lg transition ${
              userRoleFilter === 'OFFICER' ? 'bg-sky-600 text-white shadow-sm' : 'text-sky-700'
            }`}
          >
            เจ้าหน้าที่ ({users.filter((u) => u.role === 'OFFICER').length})
          </button>
          <button
            onClick={() => setUserRoleFilter('INSTRUCTOR')}
            className={`px-2.5 py-1.5 rounded-lg transition ${
              userRoleFilter === 'INSTRUCTOR' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700'
            }`}
          >
            อาจารย์ ({users.filter((u) => u.role === 'INSTRUCTOR').length})
          </button>
          <button
            onClick={() => setUserRoleFilter('STUDENT')}
            className={`px-2.5 py-1.5 rounded-lg transition ${
              userRoleFilter === 'STUDENT' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            🎓 นิสิต ({studentsList.length})
          </button>
          <button
            onClick={() => setUserRoleFilter('SUSPENDED')}
            className={`px-2.5 py-1.5 rounded-lg transition ${
              userRoleFilter === 'SUSPENDED' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700'
            }`}
          >
            ⛔ ถูกระงับ ({users.filter((u) => u.isSuspended || u.isActive === false).length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
              <tr>
                <th className="px-5 py-3.5">ผู้ใช้งาน</th>
                <th className="px-5 py-3.5">อีเมลล็อกอิน (@mcu / Gmail)</th>
                <th className="px-5 py-3.5">หน่วยงาน/ภาควิชา</th>
                <th className="px-5 py-3.5">บทบาท (Role)</th>
                <th className="px-5 py-3.5 text-center">สถานะ</th>
                <th className="px-5 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.slice(0, 100).map((u) => {
                const isSuper = u.role === 'SUPER_ADMIN' || u.isSuperAdmin || u.email === 'phaisal.dis@mcu.ac.th';
                const isStudent = u.role === 'STUDENT';
                const isSuspended = !isSuper && (u.isSuspended || u.isActive === false);

                return (
                  <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${isSuspended ? 'bg-rose-50/30' : ''}`}>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl border font-bold flex items-center justify-center shrink-0 ${
                          isSuper
                            ? 'bg-purple-100 border-purple-300 text-purple-800'
                            : isSuspended
                            ? 'bg-rose-100 border-rose-300 text-rose-800'
                            : isStudent
                            ? 'bg-amber-100 border-amber-300 text-amber-800'
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          {isSuper ? '👑' : isSuspended ? '⛔' : isStudent ? '🎓' : u.name ? u.name.charAt(0) : 'อ'}
                        </div>
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isSuper && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                SUPER ADMIN
                              </span>
                            )}
                            {isStudent && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                นิสิต
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {isStudent ? `รหัสนิสิต: ${u.id}` : `ID: ${u.id}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 space-y-0.5">
                      <div className="font-mono text-slate-800 font-medium flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                      {u.gmail && (
                        <div className="font-mono text-slate-500 text-[11px] flex items-center gap-1">
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 rounded">G</span>
                          <span>{u.gmail}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {u.department || 'คณะพุทธศาสตร์'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isSuper
                            ? 'bg-purple-50 text-purple-800 border-purple-300 shadow-xs'
                            : u.role === 'ADMIN'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : u.role === 'OFFICER'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : isStudent
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isSuper
                          ? '👑 ผู้ดูแลระบบสูงสุด'
                          : u.role === 'ADMIN'
                          ? 'ผู้ดูแลระบบ'
                          : u.role === 'OFFICER'
                          ? 'เจ้าหน้าที่'
                          : isStudent
                          ? '🎓 นิสิต (STUDENT)'
                          : 'อาจารย์ผู้สอน'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {isSuper ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          ถาวร (Super Admin)
                        </span>
                      ) : isSuspended ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                          <Ban className="w-2.5 h-2.5" />
                          <span>{isStudent ? 'พ้นสภาพ/ระงับ' : 'ถูกระงับการใช้'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-2.5 h-2.5" />
                          <span>{isStudent ? 'ปกติ (ลงทะเบียน)' : 'ปกติ'}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {isStudent ? (
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              setActiveTab('STUDENTS');
                              setStudentSearch(u.id);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition flex items-center gap-1 cursor-pointer"
                            title="เปิดดูประวัตินิสิตฉบับเต็ม"
                          >
                            <Eye className="w-3 h-3" />
                            <span>ดูประวัตินิสิต</span>
                          </button>
                          <button
                            onClick={() => {
                              alert(`ข้อมูลการเข้าสู่ระบบของนิสิต:\n\nชื่อ-สกุล: ${u.name}\nรหัสนิสิต: ${u.id}\nอีเมลล็อกอิน: ${u.email}\nรหัสผ่านเริ่มต้น: ${u.id} หรือ mcu123456\n\nหมายเหตุ: นิสิตสามารถใช้บัญชีนี้เข้าระบบเพื่อขอเอกสารรับรอง หรือเช็คชื่อเข้าชั้นเรียนได้`);
                            }}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                            title="ดูรหัสผ่านและวิธีเข้าสู่ระบบ"
                          >
                            รหัสล็อกอิน
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Edit Email & Profile Button */}
                          <button
                            onClick={() => handleStartEditUser(u)}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 transition flex items-center gap-1 cursor-pointer"
                            title="แก้ไขอีเมลจริง, Gmail และข้อมูลผู้ใช้"
                          >
                            <Edit className="w-3 h-3" />
                            <span>แก้ไข</span>
                          </button>

                          {/* Teaching Slip & Credentials Slip Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenTeachingSlip(u)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition flex items-center gap-1 cursor-pointer"
                            title="เปิดบัตรแจ้งภาระงานสอน ตารางวิชาที่สอน และรหัสผ่าน พร้อมพิมพ์เป็นทางการ"
                          >
                            <FileText className="w-3 h-3 text-indigo-600" />
                            <span>บัตรแจ้งภาระงาน</span>
                          </button>

                          {/* Quick Copy LINE Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyLineTeachingMessage(u)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                              copiedLineUserId === u.id
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                            title="คัดลอกข้อความสรุปภาระงานสอนและรหัสผ่าน สำหรับส่งใน LINE"
                          >
                            {copiedLineUserId === u.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-emerald-600" />}
                            <span>{copiedLineUserId === u.id ? 'คัดลอกแล้ว!' : 'ส่ง LINE'}</span>
                          </button>

                          {/* Suspend / Unsuspend Toggle */}
                          {!isSuper ? (
                            isSuspended ? (
                              <button
                                onClick={() => handleToggleSuspend(u.id, true, u.name)}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition flex items-center gap-1 cursor-pointer"
                                title="ปลดระงับการใช้งานบัญชีนี้"
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>ปลดระงับ</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleSuspend(u.id, false, u.name)}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
                                title="ระงับการใช้งานบัญชีนี้ชั่วคราว"
                              >
                                <Ban className="w-3 h-3" />
                                <span>ระงับ</span>
                              </button>
                            )
                          ) : null}

                          {/* Change Role dropdown */}
                          <select
                            value={u.role || 'INSTRUCTOR'}
                            disabled={isSuper}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value as any)}
                            className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] bg-white text-slate-700 cursor-pointer focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            {isSuper && <option value="SUPER_ADMIN">👑 Super Admin</option>}
                            <option value="INSTRUCTOR">อาจารย์ผู้สอน</option>
                            <option value="OFFICER">เจ้าหน้าที่</option>
                            <option value="ADMIN">ผู้ดูแลระบบ</option>
                          </select>

                          {/* Reset password */}
                          <button
                            onClick={() => handleResetPassword(u.id, u.name)}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition cursor-pointer"
                            title="รีเซ็ตรหัสผ่านเป็น mcu123456"
                          >
                            รีเซ็ตรหัส
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
