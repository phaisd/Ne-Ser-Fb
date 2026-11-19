'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Lock,
  ShieldCheck,
  Sparkles,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Archive,
  FileSpreadsheet,
  Award,
  ChevronDown,
  Settings,
  Key,
  Shield,
  MoreVertical,
} from 'lucide-react';
import { UserAccount, Student } from '@/types';
import type { AdminTab } from '../AdminSidebar';
import type { AdminUserFilterItem } from '@/hooks/admin/useAdminUsers';
import {
  ArchivedInstructorsModal,
  InstructorImportModal,
  VipassanaMasterImportExportModal,
  OfficerImportExportModal,
} from '../modals';
import { RolePermissionsMatrixView } from './RolePermissionsMatrixView';

interface AdminUsersTabProps {
  users: UserAccount[];
  filteredUsers: AdminUserFilterItem[];
  studentsList: Student[];
  userSearch: string;
  setUserSearch: (val: string) => void;
  userRoleFilter: string;
  setUserRoleFilter: (val: string) => void;
  isScanningInstructors: boolean;
  handleScanTimetables: () => void;
  setIsAddUserOpen: (val: boolean) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<AdminTab>> | ((tab: AdminTab) => void);
  setStudentSearch: (val: string) => void;
  handleStartEditUser: (u: UserAccount | AdminUserFilterItem) => void;
  handleOpenTeachingSlip: (u: UserAccount | AdminUserFilterItem) => void;
  handleCopyLineTeachingMessage: (u: UserAccount | AdminUserFilterItem) => void;
  copiedLineUserId: string | null;
  handleToggleSuspend: (id: string, isSuspended: boolean, name: string) => void;
  handleUpdateRole: (id: string, newRole: any) => void;
  handleToggleActingOfficer?: (
    id: string,
    isActingOfficer: boolean,
    name: string,
    userType?: 'STUDENT' | 'INSTRUCTOR'
  ) => void;
  handleResetPassword: (id: string, name: string) => void;
  forcePasswordChangeOnFirstLogin?: boolean;
  onToggleForcePasswordChange?: (enabled: boolean) => void;
  onOpenNewYearWorkflow?: () => void;
  onOpenBatchTeachingSlips?: () => void;
  isOfficer?: boolean;
  isSuperAdmin?: boolean;
  onRefresh?: () => void;
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
  handleToggleActingOfficer,
  handleResetPassword,
  forcePasswordChangeOnFirstLogin = true,
  onToggleForcePasswordChange,
  onOpenNewYearWorkflow,
  onOpenBatchTeachingSlips,
  isOfficer = false,
  isSuperAdmin = false,
  onRefresh,
}) => {
  // Sub-tab State: 'DIRECTORY' (รายชื่อผู้ใช้งาน) vs 'ROLES_MATRIX' (บทบาทและสิทธิ์การเข้าถึง)
  const [usersSubTab, setUsersSubTab] = useState<'DIRECTORY' | 'ROLES_MATRIX'>('DIRECTORY');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [isVipassanaMasterModalOpen, setIsVipassanaMasterModalOpen] = useState(false);
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);
  const [activeActionDropdownId, setActiveActionDropdownId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const handleArchiveInstructor = async (u: UserAccount) => {
    const isSuspended = u.isSuspended || u.isActive === false;
    const promptDefault = isSuspended
      ? 'ระงับการใช้งาน/เกษียณอายุ/จำหน่ายออก'
      : 'เกษียณอายุ/ลาออก/จำหน่ายออกจากระบบ';
    const reason = window.prompt(
      `ระบุเหตุผลในการย้าย "${u.name}" เข้าสู่แฟ้มประวัติ:\n(ข้อมูลจะถูกนำออกจากรายชื่อปัจจุบัน และเก็บประวัติไว้ที่ Google Sheets แท็บ Instructors_Archive สามารถกู้คืนได้ทุกเมื่อ)`,
      promptDefault
    );
    if (reason === null) return; // User cancelled

    setArchivingId(u.id);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive-user',
          userId: u.id,
          reason: reason.trim() || 'เกษียณอายุ/ลาออก/จำหน่ายออกจากระบบ',
          archivedBy: 'ผู้ดูแลระบบ (Admin)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`ย้ายข้อมูลอาจารย์ "${u.name}" เข้าสู่แฟ้มประวัติเรียบร้อยแล้ว`);
        window.location.reload();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการย้ายเข้าแฟ้มประวัติ');
      }
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setArchivingId(null);
    }
  };

  // Reset to page 1 whenever search, role filter or total count changes
  useEffect(() => {
    setCurrentPage(1);
  }, [userSearch, userRoleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);

  const startIndex = (activePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredUsers.length);
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, startIndex, endIndex]);

  const renderPagination = (position: 'top' | 'bottom') => {
    if (filteredUsers.length === 0) return null;

    const pageNumbers: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, activePage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let p = startPage; p <= endPage; p++) {
      pageNumbers.push(p);
    }

    return (
      <div
        className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 bg-slate-50/90 ${
          position === 'top' ? 'border-b border-slate-200/80' : 'border-t border-slate-200/80'
        } text-xs text-slate-600`}
      >
        {/* Left: Summary and Page Size */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              แสดงลำดับที่ <span className="font-bold text-slate-900">{startIndex + 1}</span> -{' '}
              <span className="font-bold text-slate-900">{endIndex}</span> จากทั้งหมด{' '}
              <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {filteredUsers.length}
              </span>{' '}
              รายชื่อ
            </span>
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-slate-500">แสดงหน้าละ:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer shadow-2xs"
            >
              <option value={10}>10 ท่าน</option>
              <option value={15}>15 ท่าน (แนะนำ)</option>
              <option value={25}>25 ท่าน</option>
              <option value={50}>50 ท่าน</option>
              <option value={100}>100 ท่าน</option>
            </select>
          </div>
        </div>

        {/* Right: Left/Right Pagination Controller */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={activePage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-slate-700 transition cursor-pointer disabled:cursor-not-allowed shadow-2xs"
            title="ไปหน้าแรกสุด (ซ้ายสุด)"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page (Left Button) */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={activePage === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-slate-800 font-bold transition cursor-pointer disabled:cursor-not-allowed shadow-2xs"
            title="เลื่อนไปหน้าก่อนหน้า (ซ้าย)"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
            <span className="hidden md:inline text-xs">◀ ก่อนหน้า</span>
          </button>

          {/* Page Number Buttons */}
          <div className="flex items-center gap-1 mx-1">
            {startPage > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="w-7 h-7 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  1
                </button>
                {startPage > 2 && <span className="px-1 text-slate-400 font-bold">...</span>}
              </>
            )}

            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  activePage === p
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-sm ring-2 ring-sky-500/20'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && <span className="px-1 text-slate-400 font-bold">...</span>}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-7 h-7 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          {/* Next Page (Right Button) */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={activePage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-slate-800 font-bold transition cursor-pointer disabled:cursor-not-allowed shadow-2xs"
            title="เลื่อนไปหน้าถัดไป (ขวา)"
          >
            <span className="hidden md:inline text-xs">ถัดไป ▶</span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={activePage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-slate-700 transition cursor-pointer disabled:cursor-not-allowed shadow-2xs"
            title="ไปหน้าสุดท้าย (ขวาสุด)"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>

          {/* Page Badge Indicator */}
          <div className="ml-2 hidden sm:flex items-center text-[11px] font-bold text-slate-500 bg-slate-200/70 px-2 py-1 rounded-lg">
            หน้า {activePage}/{totalPages}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-sky-600" />
              <span>
                {isOfficer
                  ? 'จัดการไอดีและรหัสผ่านอาจารย์ผู้สอน (Instructor Credentials Management)'
                  : 'จัดการผู้ใช้งานและกำหนดบทบาท (Users & Roles Management)'}
              </span>
            </h2>
            {isOfficer && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                👮 โหมดเจ้าหน้าที่ (Officer Mode)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isOfficer
              ? 'ตรวจสอบ แก้ไขไอดี-อีเมล ออกบัตรแจ้งภาระงานสอน และรีเซ็ตรหัสผ่านสำหรับอาจารย์ผู้สอน'
              : 'กำหนดสิทธิ์การใช้งานระบบ เช่น ผู้ดูแลระบบ (ADMIN), เจ้าหน้าที่ดูแลระบบ (OFFICER), และอาจารย์ผู้สอน (INSTRUCTOR)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenNewYearWorkflow && (
            <button
              type="button"
              onClick={onOpenNewYearWorkflow}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-900 border border-purple-200/80 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title="ดูคำแนะนำขั้นตอนการทำงานเมื่อเปิดปีการศึกษาใหม่"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>📋 ขั้นตอนเปิดปีการศึกษาใหม่</span>
            </button>
          )}

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

          {onOpenBatchTeachingSlips && (
            <button
              type="button"
              onClick={onOpenBatchTeachingSlips}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
              title="พิมพ์บัตรแจ้งภาระงานสอนเป็นชุด (A4 อัตรา 1:1 - 8:1) หรือส่งออกไฟล์ Excel (.xlsx) สำหรับกลุ่มอาจารย์"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>🖨️ ออกบัตรภาระงานเป็นชุด (พิมพ์ / Excel)</span>
            </button>
          )}

          {/* Archived Instructors Modal Button */}
          <button
            type="button"
            onClick={() => setIsArchiveModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition cursor-pointer"
            title="เปิดดูแฟ้มประวัติอาจารย์ที่เกษียณอายุ ลาออก หรือจำหน่ายออก พร้อมระบบกู้คืน"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>📁 แฟ้มประวัติอาจารย์ (เกษียณ/จำหน่าย)</span>
          </button>

          {/* Batch Import Instructors Modal Button */}
          <button
            type="button"
            onClick={() => setIsBatchImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            title="นำเข้าและอัปเดตข้อมูลอาจารย์หลายท่านพร้อมกันเป็นชุดด้วย Excel / CSV หรือคัดลอกมาวาง"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>📥 นำเข้าอาจารย์เป็นชุด (Batch)</span>
          </button>

          {/* Vipassana Masters Import/Export & Auto ID/Password Modal Button */}
          <button
            type="button"
            onClick={() => setIsVipassanaMasterModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition cursor-pointer"
            title="นำเข้า/ส่งออก พระวิปัสสนาจารย์ พร้อมสร้างไอดี-รหัสผ่านอัตโนมัติ (ประธาน, รองประธาน, พระวิปัสสนาจารย์, เลขานุการ)"
          >
            <Award className="w-3.5 h-3.5 text-amber-200" />
            <span>🧘 พระวิปัสสนาจารย์ (Excel & รหัสผ่าน)</span>
          </button>

          {/* Officer & Assistants Import/Export & Auto ID/Password Modal Button */}
          <button
            type="button"
            onClick={() => setIsOfficerModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 hover:from-teal-700 hover:to-teal-900 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
            title="นำเข้า/ส่งออก เจ้าหน้าที่หลักสูตร และผู้ช่วยเจ้าหน้าที่ พร้อมสร้างไอดี officerXX@mcu.ac.th และรหัสผ่านอัตโนมัติ (Fb8323mcu)"
          >
            <UserCog className="w-3.5 h-3.5 text-teal-200" />
            <span>📋 เจ้าหน้าที่ & ผู้ช่วย (Excel & รหัสผ่าน)</span>
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

      {/* Sub-Tab Switcher: Directory vs Roles & Permissions Matrix */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setUsersSubTab('DIRECTORY')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              usersSubTab === 'DIRECTORY'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <UserCog className="w-4 h-4" />
            <span>👥 รายชื่อผู้ใช้งานและไอดีอาจารย์ ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setUsersSubTab('ROLES_MATRIX')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              usersSubTab === 'ROLES_MATRIX'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>🛡️ หน้าบทบาทและกำหนดสิทธิ์การเข้าถึง (Roles & Permissions Matrix)</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              usersSubTab === 'ROLES_MATRIX'
                ? 'bg-white/20 text-white'
                : 'bg-indigo-100 text-indigo-700'
            }`}>
              RBAC
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 px-3 hidden md:flex items-center gap-1.5">
          <span>💡 คลิกสลับแท็บเพื่อดูตารางเปรียบเทียบสิทธิ์ 7 บทบาท (รวมพระวิปัสสนาจารย์) หรือปรับแต่งสิทธิ์การเข้าถึงแต่ละเมนู</span>
        </div>
      </div>

      {usersSubTab === 'ROLES_MATRIX' ? (
        <RolePermissionsMatrixView
          users={users}
          studentsCount={studentsList.length}
          isSuperAdmin={isSuperAdmin}
          isOfficer={isOfficer}
          handleUpdateRole={handleUpdateRole}
          handleStartEditUser={handleStartEditUser}
          onOpenVipassanaMasterModal={() => setIsVipassanaMasterModalOpen(true)}
          onOpenOfficerModal={() => setIsOfficerModalOpen(true)}
        />
      ) : (
        <>
          {/* New Academic Year Workflow Helper Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-indigo-50/70 to-purple-50 p-3.5 rounded-2xl border border-sky-200/80 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900">
              💡 ข้อแนะนำเมื่อเริ่มต้นปีการศึกษาใหม่:
            </span>{' '}
            <span>
              หากต้องการออกบัตรแจ้งภาระงานสอนปีใหม่ กรุณา <strong>1) นำเข้าตารางสอนปีใหม่</strong> ในแท็บ &quot;ตารางสอน&quot; ก่อน ➔ <strong>2) กดปุ่ม &quot;🔄 ซิงค์และสร้างไอดีอาจารย์จากตารางสอน&quot;</strong> ➔ <strong>3) กดปุ่ม &quot;🖨️ ออกบัตรภาระงานเป็นชุด (พิมพ์ / Excel)&quot;</strong> เพื่อพิมพ์ตัดแจกอาจารย์ตามอัตรา 4:1, 6:1 หรือ 8:1 หรือส่งออกเป็นไฟล์ Excel (.xlsx) ได้ทันที
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onOpenBatchTeachingSlips && (
            <button
              type="button"
              onClick={onOpenBatchTeachingSlips}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>ออกบัตรเป็นชุด / Excel</span>
            </button>
          )}
          {onOpenNewYearWorkflow && (
            <button
              type="button"
              onClick={onOpenNewYearWorkflow}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
            >
              ดูขั้นตอนทั้งหมด →
            </button>
          )}
        </div>
      </div>

      {/* Security Policy Card: Force Password Change on First Login */}
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

      {/* Filters (2 Rows for optimal layout and search field width) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5 text-xs">
        {/* ROW 1: Search Box + Green Line Set (ทั้งหมด, Super Admin, Admin, เจ้าหน้าที่, อาจารย์) */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Expanded Search Box */}
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

          {/* Green Line Set: ทั้งหมด, Super Admin, Admin, เจ้าหน้าที่, อาจารย์ */}
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
                  Admin ({users.filter((u) => u.role === 'ADMIN').length})
                </button>
                <button
                  onClick={() => setUserRoleFilter('OFFICER')}
                  className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                    userRoleFilter === 'OFFICER' ? 'bg-sky-600 text-white shadow-xs' : 'text-sky-700 hover:bg-white/60'
                  }`}
                >
                  เจ้าหน้าที่ ({users.filter((u) => u.role === 'OFFICER').length})
                </button>
              </>
            )}
            <button
              onClick={() => setUserRoleFilter('INSTRUCTOR')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                userRoleFilter === 'INSTRUCTOR' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-white/60'
              }`}
            >
              อาจารย์ ({isOfficer ? filteredUsers.length : users.filter((u) => u.role === 'INSTRUCTOR').length})
            </button>
          </div>
        </div>

        {/* ROW 2: Blue Line Set (พระวิปัสสนาจารย์, นิสิต, ช่วยงานเจ้าหน้าที่, ถูกระงับ) + Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          {/* Blue Line Set */}
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
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-sky-800 hover:bg-white/60'
              }`}
              title="ดูรายชื่ออาจารย์และนิสิตที่ได้รับมอบหมายให้ช่วยงานเจ้าหน้าที่"
            >
              ☑️ ช่วยงานเจ้าหน้าที่ (
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
              onClick={() => setIsVipassanaMasterModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs shadow-2xs transition cursor-pointer"
              title="นำเข้า/ส่งออก พระวิปัสสนาจารย์ พร้อมสร้างไอดีและรหัสผ่านอัตโนมัติ"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-700" />
              <span>นำเข้า/ส่งออก Excel พระวิปัสสนาจารย์</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Top Pagination Toolbar (ตัวแบ่งหน้า เลื่อนซ้าย-ขวา) */}
        {renderPagination('top')}

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
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserCog className="w-8 h-8 text-slate-300" />
                      <span className="font-semibold text-sm text-slate-600">ไม่พบรายชื่อผู้ใช้งานที่ตรงกับเงื่อนไขการค้นหา</span>
                      <span className="text-xs text-slate-400">ลองปรับคำค้นหา หรือเปลี่ยนตัวกรองบทบาทด้านบน</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
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
                        <span>{u.email || u.gmail}</span>
                      </div>
                      {u.gmail && u.gmail !== u.email && (
                        <div className="font-mono text-slate-500 text-[11px] flex items-center gap-1">
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 rounded">G</span>
                          <span>{u.gmail}</span>
                        </div>
                      )}
                      {u.email?.endsWith('@gmail.com') && !u.gmail && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                          เข้าสู่ระบบด้วย Gmail
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <div>{u.department || 'คณะพุทธศาสตร์'}</div>
                      {u.instructorType && (
                        <span
                          className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            u.instructorType === 'อาจารย์พิเศษ'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : u.instructorType === 'อาจารย์ผู้ช่วยสอน'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {u.instructorType}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col items-start gap-1.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isSuper
                              ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-xs'
                              : u.role === 'ADMIN'
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              : u.role === 'OFFICER'
                              ? 'bg-teal-100 text-teal-800 border-teal-300'
                              : u.role === 'STAFF'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : u.role === 'VIPASSANA_MASTER'
                              ? 'bg-rose-100 text-rose-800 border-rose-300 shadow-2xs'
                              : isStudent
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : u.isActingOfficer
                              ? 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400/30'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isSuper
                            ? '👑 ผู้ดูแลระบบสูงสุด'
                            : u.role === 'ADMIN'
                            ? '🛡️ ผู้ดูแลระบบ (Admin)'
                            : u.role === 'OFFICER'
                            ? '📋 เจ้าหน้าที่หลักสูตร'
                            : u.role === 'STAFF'
                            ? '💼 เจ้าหน้าที่สายสนับสนุน'
                            : u.role === 'VIPASSANA_MASTER'
                            ? '🧘 พระวิปัสสนาจารย์'
                            : isStudent
                            ? '🎓 นิสิต (STUDENT)'
                            : u.isActingOfficer
                            ? '🎓 ผู้ช่วยเจ้าหน้าที่'
                            : '👨‍🏫 อาจารย์ผู้สอน'}
                        </span>

                        {/* Checkbox: ☑️ ช่วยงานเจ้าหน้าที่ สำหรับทั้งอาจารย์และนิสิต */}
                        {!isSuper && (u.role === 'INSTRUCTOR' || u.role === 'VIPASSANA_MASTER' || isStudent || !u.role) && (
                          <label
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition select-none ${
                              isOfficer
                                ? 'opacity-60 cursor-not-allowed'
                                : 'cursor-pointer'
                            } ${
                              u.isActingOfficer
                                ? 'bg-sky-100 text-sky-900 border-sky-300 shadow-2xs ring-1 ring-sky-500/20'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                            title={
                              isOfficer
                                ? 'เฉพาะผู้ดูแลระบบ (Admin / Super Admin) เท่านั้นที่กำหนดสิทธิ์ช่วยงานเจ้าหน้าที่ได้'
                                : isStudent
                                ? 'ติ๊กเลือกเพื่อให้นิสิตท่านนี้ช่วยงานเจ้าหน้าที่ (เข้าหลังบ้าน ตรวจคำร้อง จัดการทะเบียน) โดยคงสถานะนิสิตตามปกติจนกว่าแอดมินจะยกเลิก'
                                : 'ติ๊กเลือกเพื่อให้อาจารย์ท่านนี้ช่วยงานเจ้าหน้าที่ (เข้าหลังบ้าน ตรวจคำร้อง จัดการทะเบียน) โดยคงสถานะอาจารย์ผู้สอนและตารางสอนตามปกติจนกว่าแอดมินจะยกเลิก'
                            }
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(u.isActingOfficer)}
                              disabled={isOfficer}
                              onChange={(e) =>
                                handleToggleActingOfficer &&
                                handleToggleActingOfficer(
                                  u.id,
                                  e.target.checked,
                                  u.name,
                                  isStudent ? 'STUDENT' : 'INSTRUCTOR'
                                )
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <span>ช่วยงานเจ้าหน้าที่</span>
                          </label>
                        )}
                      </div>
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
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          {/* Edit Email & Profile Button */}
                          <button
                            type="button"
                            onClick={() => handleStartEditUser(u)}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 transition flex items-center gap-1 cursor-pointer shrink-0"
                            title="แก้ไขอีเมลจริง, Gmail และข้อมูลผู้ใช้"
                          >
                            <Edit className="w-3 h-3" />
                            <span>แก้ไข</span>
                          </button>

                          {/* Teaching Slip & Credentials Slip Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenTeachingSlip(u)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition flex items-center gap-1 cursor-pointer shrink-0"
                            title="เปิดบัตรแจ้งภาระงานสอน ตารางวิชาที่สอน และรหัสผ่าน พร้อมพิมพ์เป็นทางการ"
                          >
                            <FileText className="w-3 h-3 text-indigo-600" />
                            <span>บัตรแจ้งภาระงาน</span>
                          </button>

                          {/* Action Dropdown Menu */}
                          <div className="relative inline-block text-left shrink-0">
                            <button
                              type="button"
                              onClick={() => setActiveActionDropdownId(activeActionDropdownId === u.id ? null : u.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                                activeActionDropdownId === u.id
                                  ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                                  : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200'
                              }`}
                              title="เมนูจัดการเพิ่มเติม (ส่ง LINE, รีเซ็ตรหัส, เปลี่ยนบทบาท, ระงับ, ย้ายเก็บ)"
                            >
                              <Settings className="w-3 h-3 text-slate-500" />
                              <span>จัดการ</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${activeActionDropdownId === u.id ? 'rotate-180' : ''}`} />
                            </button>

                            {activeActionDropdownId === u.id && (
                              <>
                                {/* Backdrop for click-away */}
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setActiveActionDropdownId(null)}
                                />
                                <div
                                  className={`absolute right-0 ${
                                    paginatedUsers.indexOf(u) >= Math.max(2, paginatedUsers.length - 3)
                                      ? 'bottom-full mb-1.5'
                                      : 'top-full mt-1.5'
                                  } w-64 rounded-xl bg-white shadow-xl border border-slate-200 z-40 py-1.5 text-left text-xs animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100`}
                                >
                                  {/* Section 1: Quick Messaging & Credentials */}
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleCopyLineTeachingMessage(u);
                                      }}
                                      className="w-full px-3 py-1.5 text-left hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 flex items-center justify-between transition cursor-pointer font-medium"
                                    >
                                      <div className="flex items-center gap-2">
                                        {copiedLineUserId === u.id ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5 text-emerald-600" />
                                        )}
                                        <span>{copiedLineUserId === u.id ? 'คัดลอกข้อความ LINE แล้ว!' : 'ส่งข้อความ LINE (ภาระงาน/รหัส)'}</span>
                                      </div>
                                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">LINE</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveActionDropdownId(null);
                                        handleResetPassword(u.id, u.name);
                                      }}
                                      className="w-full px-3 py-1.5 text-left hover:bg-amber-50 text-slate-700 hover:text-amber-800 flex items-center justify-between transition cursor-pointer font-medium"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Key className="w-3.5 h-3.5 text-amber-600" />
                                        <span>รีเซ็ตรหัสผ่าน</span>
                                      </div>
                                      <span className="text-[10px] text-amber-700 font-mono bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                        mcu123456
                                      </span>
                                    </button>
                                  </div>

                                  {/* Section 2: Role Management */}
                                  <div className="px-3 py-2 bg-slate-50/70">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <Shield className="w-3 h-3 text-indigo-500" /> ปรับเปลี่ยนบทบาท (Role)
                                      </span>
                                      {isOfficer && (
                                        <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded border border-amber-200">
                                          สิทธิ์ดูอย่างเดียว
                                        </span>
                                      )}
                                    </div>
                                    {isOfficer ? (
                                      <div className="text-xs font-semibold text-emerald-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                                        อาจารย์ผู้สอน
                                      </div>
                                    ) : (
                                      <select
                                        value={
                                          u.isActingOfficer && (u.role === 'INSTRUCTOR' || !u.role)
                                            ? 'ACTING_OFFICER'
                                            : u.role || 'INSTRUCTOR'
                                        }
                                        disabled={isSuper}
                                        onChange={(e) => {
                                          handleUpdateRole(u.id, e.target.value as any);
                                          setActiveActionDropdownId(null);
                                        }}
                                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                                      >
                                        {isSuper && <option value="SUPER_ADMIN">👑 Super Admin</option>}
                                        <option value="ADMIN">🛡️ ผู้ดูแลระบบ (Admin)</option>
                                        <option value="OFFICER">📋 เจ้าหน้าที่หลักสูตร (OFFICER)</option>
                                        <option value="ACTING_OFFICER">🎓 ผู้ช่วยเจ้าหน้าที่ (อาจารย์ช่วยงาน)</option>
                                        <option value="STAFF">💼 เจ้าหน้าที่สายสนับสนุน (STAFF)</option>
                                        <option value="INSTRUCTOR">👨‍🏫 อาจารย์ผู้สอน</option>
                                        <option value="VIPASSANA_MASTER">🧘 พระวิปัสสนาจารย์ (สอบอารมณ์/วัดผล)</option>
                                      </select>
                                    )}
                                  </div>

                                  {/* Section 3: Account Actions (Suspend / Archive) */}
                                  {!isSuper && (
                                    <div className="py-1">
                                      {/* Suspend / Unsuspend */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveActionDropdownId(null);
                                          handleToggleSuspend(u.id, isSuspended, u.name);
                                        }}
                                        className={`w-full px-3 py-1.5 text-left transition cursor-pointer font-medium flex items-center gap-2 ${
                                          isSuspended
                                            ? 'hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800'
                                            : 'hover:bg-rose-50 text-rose-700 hover:text-rose-800'
                                        }`}
                                      >
                                        {isSuspended ? (
                                          <>
                                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>ปลดระงับการใช้งาน</span>
                                          </>
                                        ) : (
                                          <>
                                            <Ban className="w-3.5 h-3.5 text-rose-600" />
                                            <span>ระงับการใช้งานบัญชีชั่วคราว</span>
                                          </>
                                        )}
                                      </button>

                                      {/* Archive */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveActionDropdownId(null);
                                          handleArchiveInstructor(u as UserAccount);
                                        }}
                                        disabled={archivingId === u.id}
                                        className="w-full px-3 py-1.5 text-left hover:bg-rose-50 text-slate-600 hover:text-rose-800 flex items-center gap-2 transition cursor-pointer font-medium disabled:opacity-50"
                                      >
                                        <Archive className="w-3.5 h-3.5 text-rose-500" />
                                        <span>{archivingId === u.id ? 'กำลังย้าย...' : 'ย้ายเก็บเข้าแฟ้มประวัติ (Archive)'}</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Toolbar (ตัวแบ่งหน้า เลื่อนซ้าย-ขวา) */}
        {renderPagination('bottom')}
      </div>
        </>
      )}

      {/* Archived Instructors Modal (Google Sheets: Instructors_Archive) */}
      <ArchivedInstructorsModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onInstructorRestored={() => {
          window.location.reload();
        }}
      />

      {/* Batch Import Instructors Modal */}
      <InstructorImportModal
        isOpen={isBatchImportOpen}
        onClose={() => setIsBatchImportOpen(false)}
        existingUsers={users}
        onSuccess={() => {
          if (onRefresh) onRefresh();
          else if (typeof window !== 'undefined') window.location.reload();
        }}
      />

      {/* Vipassana Masters Import & Export & Auto ID/Password Modal */}
      <VipassanaMasterImportExportModal
        isOpen={isVipassanaMasterModalOpen}
        onClose={() => setIsVipassanaMasterModalOpen(false)}
        existingUsers={users}
        onSuccess={() => {
          if (onRefresh) onRefresh();
          else if (typeof window !== 'undefined') window.location.reload();
        }}
      />

      {/* Officer & Staff Import & Export & Auto ID/Password Modal */}
      <OfficerImportExportModal
        isOpen={isOfficerModalOpen}
        onClose={() => setIsOfficerModalOpen(false)}
        existingUsers={users}
        onSuccess={() => {
          if (onRefresh) onRefresh();
          else if (typeof window !== 'undefined') window.location.reload();
        }}
      />
    </div>
  );
};
