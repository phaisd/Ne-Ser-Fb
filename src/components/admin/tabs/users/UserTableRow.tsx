'use client';

import React from 'react';
import {
  Mail,
  Ban,
  Check,
  Eye,
  Edit,
  FileText,
  Copy,
  UserCheck,
  Settings,
  ChevronDown,
  Key,
  Shield,
  Archive,
  Trash2,
} from 'lucide-react';
import { UserAccount } from '@/types';
import type { AdminUserFilterItem } from '@/hooks/admin/useAdminUsers';
import type { AdminTab } from '../../AdminSidebar';

interface UserTableRowProps {
  u: AdminUserFilterItem;
  rowIndex: number;
  totalRowCount: number;
  isOfficer?: boolean;
  activeActionDropdownId: string | null;
  setActiveActionDropdownId: (id: string | null) => void;
  copiedLineUserId: string | null;
  archivingId: string | null;
  handleStartEditUser: (u: UserAccount | AdminUserFilterItem) => void;
  handleOpenTeachingSlip: (u: UserAccount | AdminUserFilterItem) => void;
  handleCopyLineTeachingMessage: (u: UserAccount | AdminUserFilterItem) => void;
  handleResetPassword: (id: string, name: string) => void;
  handleUpdateRole: (id: string, newRole: any) => void;
  handleToggleSuspend: (id: string, isSuspended: boolean, name: string) => void;
  handleArchiveInstructor: (u: UserAccount) => void;
  handleDeleteUser?: (u: UserAccount | AdminUserFilterItem) => Promise<void>;
  handleToggleActingOfficer?: (
    id: string,
    isActingOfficer: boolean,
    name: string,
    userType?: 'STUDENT' | 'INSTRUCTOR'
  ) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<AdminTab>> | ((tab: AdminTab) => void);
  setStudentSearch: (val: string) => void;
}

export function UserTableRow({
  u,
  rowIndex,
  totalRowCount,
  isOfficer = false,
  activeActionDropdownId,
  setActiveActionDropdownId,
  copiedLineUserId,
  archivingId,
  handleStartEditUser,
  handleOpenTeachingSlip,
  handleCopyLineTeachingMessage,
  handleResetPassword,
  handleUpdateRole,
  handleToggleSuspend,
  handleArchiveInstructor,
  handleDeleteUser,
  handleToggleActingOfficer,
  setActiveTab,
  setStudentSearch,
}: UserTableRowProps) {
  const isSuper = u.role === 'SUPER_ADMIN' || u.isSuperAdmin || u.email === 'phaisal.dis@mcu.ac.th';
  const isStudent = u.role === 'STUDENT';
  const isSuspended = !isSuper && (u.isSuspended || u.isActive === false);

  return (
    <tr className={`hover:bg-slate-50/80 transition-colors ${isSuspended ? 'bg-rose-50/30' : ''}`}>
      <td className="px-5 py-3.5 font-medium text-slate-900">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl border font-bold flex items-center justify-center shrink-0 ${
              isSuper
                ? 'bg-purple-100 border-purple-300 text-purple-800'
                : isSuspended
                ? 'bg-rose-100 border-rose-300 text-rose-800'
                : isStudent
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
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
                : u.instructorType === 'เจ้าหน้าที่หลักสูตร'
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : u.instructorType.includes('เจ้าหน้าที่')
                ? 'bg-blue-50 text-blue-700 border-blue-200'
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
                isOfficer ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
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
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setActiveActionDropdownId(null)}
                  />
                  <div
                    className={`absolute right-0 ${
                      rowIndex >= Math.max(2, totalRowCount - 3)
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
                          <option value="ACTING_OFFICER">🎓 ผู้ช่วยเจ้าหน้าที่ (ผู้ช่วยงาน)</option>
                          <option value="STAFF">💼 เจ้าหน้าที่สายสนับสนุน (STAFF)</option>
                          <option value="INSTRUCTOR">👨‍🏫 อาจารย์ผู้สอน</option>
                          <option value="VIPASSANA_MASTER">🧘 พระวิปัสสนาจารย์ (สอบอารมณ์/วัดผล)</option>
                        </select>
                      )}
                    </div>

                    {/* Section 3: Account Actions (Suspend / Archive) */}
                    {!isSuper && (
                      <div className="py-1">
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

                        {handleDeleteUser && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionDropdownId(null);
                              handleDeleteUser(u);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-rose-50 text-rose-600 hover:text-rose-800 flex items-center gap-2 transition cursor-pointer font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>ลบบัญชีผู้ใช้งานนี้</span>
                          </button>
                        )}
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
}
