'use client';

import React, { useState, useMemo } from 'react';
import {
  UserCog,
  RefreshCw,
  Plus,
  ShieldCheck,
  Sparkles,
  Printer,
  Archive,
  FileSpreadsheet,
  Award,
  GitMerge,
} from 'lucide-react';
import { UserAccount } from '@/types';
import {
  ArchivedInstructorsModal,
  InstructorImportModal,
  VipassanaMasterImportExportModal,
  OfficerImportExportModal,
  DuplicateAccountsModal,
} from '../modals';
import { RolePermissionsMatrixView } from './RolePermissionsMatrixView';
import { AdminUsersTabProps } from './users/types';
import { ForcePasswordPolicyCard } from './users/ForcePasswordPolicyCard';
import { UserFilterToolbar } from './users/UserFilterToolbar';
import { UserPagination } from './users/UserPagination';
import { UserTableRow } from './users/UserTableRow';

export type { AdminUsersTabProps };

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
  handleDeleteUser,
  handleMergeDuplicateUsers,
  isDuplicateModalOpen,
  setIsDuplicateModalOpen,
  forcePasswordChangeOnFirstLogin = true,
  onToggleForcePasswordChange,
  onOpenNewYearWorkflow,
  onOpenBatchTeachingSlips,
  isOfficer = false,
  isSuperAdmin = false,
  onRefresh,
}) => {
  // Sub-tab State: 'DIRECTORY' vs 'ROLES_MATRIX'
  const [usersSubTab, setUsersSubTab] = useState<'DIRECTORY' | 'ROLES_MATRIX'>('DIRECTORY');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [isVipassanaMasterModalOpen, setIsVipassanaMasterModalOpen] = useState(false);
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);
  const [localDuplicateModalOpen, setLocalDuplicateModalOpen] = useState(false);
  const isDupModalOpen = isDuplicateModalOpen !== undefined ? isDuplicateModalOpen : localDuplicateModalOpen;
  const setDupModalOpen = setIsDuplicateModalOpen || setLocalDuplicateModalOpen;
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
    if (reason === null) return;

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
    } catch (e: unknown) {
      alert((e instanceof Error ? e.message : String(e)));
    } finally {
      setArchivingId(null);
    }
  };

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredUsers.length);
  const paginatedUsers = useMemo(
    () => filteredUsers.slice(startIndex, endIndex),
    [filteredUsers, startIndex, endIndex]
  );

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

          <button
            type="button"
            onClick={() => setIsArchiveModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition cursor-pointer"
            title="เปิดดูแฟ้มประวัติอาจารย์ที่เกษียณอายุ ลาออก หรือจำหน่ายออก พร้อมระบบกู้คืน"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>📁 แฟ้มประวัติอาจารย์ (เกษียณ/จำหน่าย)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBatchImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            title="นำเข้าและอัปเดตข้อมูลอาจารย์หลายท่านพร้อมกันเป็นชุดด้วย Excel / CSV หรือคัดลอกมาวาง"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>📥 นำเข้าอาจารย์เป็นชุด (Batch)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsVipassanaMasterModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition cursor-pointer"
            title="นำเข้า/ส่งออก พระวิปัสสนาจารย์ พร้อมสร้างไอดี-รหัสผ่านอัตโนมัติ"
          >
            <Award className="w-3.5 h-3.5 text-amber-200" />
            <span>🧘 พระวิปัสสนาจารย์ (Excel & รหัสผ่าน)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOfficerModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 hover:from-teal-700 hover:to-teal-900 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
            title="นำเข้า/ส่งออก เจ้าหน้าที่หลักสูตร และผู้ช่วยเจ้าหน้าที่"
          >
            <UserCog className="w-3.5 h-3.5 text-teal-200" />
            <span>📋 เจ้าหน้าที่ & ผู้ช่วย (Excel & รหัสผ่าน)</span>
          </button>

          <button
            type="button"
            onClick={() => setDupModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer"
            title="ตรวจหาอาจารย์ที่มีชื่อซ้ำซ้อนในระบบ เพื่อรวมข้อมูล (Merge) หรือลบบัญชีซ้ำ"
          >
            <GitMerge className="w-3.5 h-3.5 text-amber-200" />
            <span>🔍 ตรวจหาและลบบัญชีซ้ำ</span>
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

      {/* Sub-Tab Switcher */}
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
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                usersSubTab === 'ROLES_MATRIX'
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              RBAC
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 px-3 hidden md:flex items-center gap-1.5">
          <span>💡 คลิกสลับแท็บเพื่อดูตารางเปรียบเทียบสิทธิ์ 7 บทบาท หรือปรับแต่งสิทธิ์การเข้าถึงแต่ละเมนู</span>
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
          <ForcePasswordPolicyCard
            forcePasswordChangeOnFirstLogin={forcePasswordChangeOnFirstLogin}
            onToggleForcePasswordChange={onToggleForcePasswordChange}
            isOfficer={isOfficer}
          />

          {/* Filters: Search & Roles */}
          <UserFilterToolbar
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            userRoleFilter={userRoleFilter}
            setUserRoleFilter={setUserRoleFilter}
            users={users}
            filteredUsers={filteredUsers}
            studentsList={studentsList}
            isOfficer={isOfficer}
            onOpenVipassanaMasterModal={() => setIsVipassanaMasterModalOpen(true)}
          />

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <UserPagination
              position="top"
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={filteredUsers.length}
              pageSize={pageSize}
              setPageSize={setPageSize}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
            />

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
                          <span className="font-semibold text-sm text-slate-600">
                            ไม่พบรายชื่อผู้ใช้งานที่ตรงกับเงื่อนไขการค้นหา
                          </span>
                          <span className="text-xs text-slate-400">
                            ลองปรับคำค้นหา หรือเปลี่ยนตัวกรองบทบาทด้านบน
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u, idx) => (
                      <UserTableRow
                        key={u.id}
                        u={u}
                        rowIndex={idx}
                        totalRowCount={paginatedUsers.length}
                        isOfficer={isOfficer}
                        activeActionDropdownId={activeActionDropdownId}
                        setActiveActionDropdownId={setActiveActionDropdownId}
                        copiedLineUserId={copiedLineUserId}
                        archivingId={archivingId}
                        handleStartEditUser={handleStartEditUser}
                        handleOpenTeachingSlip={handleOpenTeachingSlip}
                        handleCopyLineTeachingMessage={handleCopyLineTeachingMessage}
                        handleResetPassword={handleResetPassword}
                        handleUpdateRole={handleUpdateRole}
                        handleToggleSuspend={handleToggleSuspend}
                        handleArchiveInstructor={handleArchiveInstructor}
                        handleDeleteUser={handleDeleteUser}
                        handleToggleActingOfficer={handleToggleActingOfficer}
                        setActiveTab={setActiveTab}
                        setStudentSearch={setStudentSearch}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <UserPagination
              position="bottom"
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={filteredUsers.length}
              pageSize={pageSize}
              setPageSize={setPageSize}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
            />
          </div>
        </>
      )}

      {/* Modals */}
      <ArchivedInstructorsModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onInstructorRestored={() => {
          window.location.reload();
        }}
      />

      <InstructorImportModal
        isOpen={isBatchImportOpen}
        onClose={() => setIsBatchImportOpen(false)}
        existingUsers={users}
        onSuccess={() => {
          if (onRefresh) onRefresh();
          else if (typeof window !== 'undefined') window.location.reload();
        }}
      />

      {isVipassanaMasterModalOpen && (
        <VipassanaMasterImportExportModal
          isOpen={isVipassanaMasterModalOpen}
          onClose={() => setIsVipassanaMasterModalOpen(false)}
          existingUsers={users}
          onSuccess={() => {
            if (onRefresh) onRefresh();
            else if (typeof window !== 'undefined') window.location.reload();
          }}
        />
      )}

      {isOfficerModalOpen && (
        <OfficerImportExportModal
          isOpen={isOfficerModalOpen}
          onClose={() => setIsOfficerModalOpen(false)}
          existingUsers={users}
          onSuccess={() => {
            if (onRefresh) onRefresh();
            else if (typeof window !== 'undefined') window.location.reload();
          }}
        />
      )}

      {isDupModalOpen && (
        <DuplicateAccountsModal
          isOpen={isDupModalOpen}
          onClose={() => setDupModalOpen(false)}
          users={users}
          onMerge={
            handleMergeDuplicateUsers ||
            (async (pId, dId) => {
              const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'merge-duplicate-users', primaryId: pId, duplicateId: dId }),
              });
              const data = await res.json();
              if (data.success) {
                if (onRefresh) await onRefresh();
                return true;
              }
              alert(data.error || 'ไม่สามารถรวมบัญชีได้');
              return false;
            })
          }
          onDelete={
            handleDeleteUser ||
            (async (u) => {
              await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete-user', userId: u.id }),
              });
              if (onRefresh) await onRefresh();
            })
          }
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};
