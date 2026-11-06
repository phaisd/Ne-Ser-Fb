'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Crown,
  UserCheck,
  Users,
  GraduationCap,
  Check,
  X,
  Lock,
  Save,
  RotateCcw,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { UserAccount } from '@/types';

export type SystemRoleKey = 'SUPER_ADMIN' | 'ADMIN' | 'OFFICER' | 'INSTRUCTOR' | 'STUDENT';

export interface PermissionItem {
  id: string;
  moduleName: string;
  description: string;
  routeHint: string;
  roles: Record<SystemRoleKey, boolean>;
  lockedRoles?: SystemRoleKey[]; // Roles that cannot be toggled off (e.g. SUPER_ADMIN)
}

export const DEFAULT_PERMISSIONS_MATRIX: PermissionItem[] = [
  {
    id: 'cert_request_track',
    moduleName: '1. ยื่นคำร้องและติดตามสถานะหนังสือรับรอง',
    description: 'เข้าใช้งานหน้ายื่นคำร้องออนไลน์ ตรวจสอบสถานะ และดาวน์โหลดหนังสือรับรองที่อนุมัติแล้ว',
    routeHint: '/certificates',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      INSTRUCTOR: true,
      STUDENT: true,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'cert_approve_manage',
    moduleName: '2. อนุมัติคำร้อง ออกเลขที่หนังสือ และดูรายการคำร้องทั้งหมด',
    description: 'ตรวจสอบเอกสารแนบ อนุมัติ/ตีกลับคำร้อง กำหนดผู้ลงนาม และดูแท็บรายการคำร้องทั้งหมด',
    routeHint: '/admin & /certificates',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      INSTRUCTOR: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'students_manage',
    moduleName: '3. เข้าถึงและแก้ไขฐานข้อมูลทะเบียนนิสิต (PDPA)',
    description: 'ค้นหา แก้ไขประวัตินิสิต สถานภาพ วีซ่า/พาสปอร์ต เลื่อนชั้นปี และนำเข้า/ส่งออก CSV',
    routeHint: '/students & /admin',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      INSTRUCTOR: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'courses_view',
    moduleName: '4. เปิดดูทะเบียนรายวิชาและตารางเรียนรวม',
    description: 'ค้นหารายวิชา ดูตารางเรียนแยกตามชั้นปี/สาขาวิชา และสั่งพิมพ์ตารางเรียน',
    routeHint: '/courses',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      INSTRUCTOR: true,
      STUDENT: true,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'courses_manage',
    moduleName: '5. เพิ่ม/แก้ไข/ลบรายวิชา นำเข้า CSV และดูภาระงานสอน',
    description: 'แสดงปุ่มเพิ่มวิชา แก้ไข ลบ นำเข้า/ส่งออก CSV และแท็บสรุปภาระงานสอนอาจารย์ในหน้า /courses',
    routeHint: '/courses & /api/courses',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      INSTRUCTOR: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'attendance_grades_own',
    moduleName: '6. เช็คชื่อนิสิต สรุปสิทธิ์สอบ และกรอกคะแนนวัดผล (วิชาที่สอน)',
    description: 'บันทึกเวลาเรียนรายคาบ ตรวจสอบสิทธิ์สอบ 80% และออกใบกรอกคะแนนวัดผล (Grade Sheet) ประจำวิชา',
    routeHint: '/attendance',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      INSTRUCTOR: true,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'attendance_grades_all',
    moduleName: '7. จัดการเวลาเรียนและใบกรอกคะแนนวัดผลทุกรายวิชาทั้งคณะ',
    description: 'ดูประวัติการเช็คชื่อทุกรายวิชา ล้างข้อมูลตัวอย่าง และตรวจใบกรอกคะแนนของอาจารย์ทุกท่าน',
    routeHint: '/admin (บันทึกเวลาเรียน)',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      INSTRUCTOR: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'events_checkin',
    moduleName: '8. จัดการโครงการและเช็คชื่อเข้าร่วมกิจกรรมนิสิต',
    description: 'สร้างโครงการกิจกรรม และกดเช็คชื่อนิสิตเข้าร่วมกิจกรรมหน้างาน',
    routeHint: '/events & /admin',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      INSTRUCTOR: true,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'users_instructors_manage',
    moduleName: '9. จัดการไอดีอาจารย์ รีเซ็ตรหัสผ่าน และออกบัตรภาระงานสอนเป็นชุด',
    description: 'สร้าง/แก้ไขบัญชีอาจารย์ รีเซ็ตรหัสผ่าน และพิมพ์บัตรแจ้งภาระงานสอน (4:1, 6:1, 8:1)',
    routeHint: '/admin (จัดการผู้ใช้)',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      INSTRUCTOR: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'system_branding_sheets',
    moduleName: '10. ตั้งค่าตราตั้ง โลโก้ ผู้ลงนาม และเชื่อมต่อ Google Sheets หลัก',
    description: 'ปรับแต่งโลโก้คณะ รายชื่อผู้ลงนาม นโยบายความปลอดภัย และซิงค์ฐานข้อมูล Google Sheets',
    routeHint: '/admin (ตั้งค่าตราตั้ง & Google Sheets)',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: false,
      INSTRUCTOR: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
];

interface RolePermissionsMatrixViewProps {
  users: UserAccount[];
  studentsCount: number;
  isSuperAdmin?: boolean;
  isOfficer?: boolean;
  handleUpdateRole: (userId: string, newRole: any) => void;
  handleStartEditUser: (u: UserAccount) => void;
}

export const RolePermissionsMatrixView: React.FC<RolePermissionsMatrixViewProps> = ({
  users,
  studentsCount,
  isSuperAdmin = false,
  isOfficer = false,
  handleUpdateRole,
  handleStartEditUser,
}) => {
  const [permissions, setPermissions] = useState<PermissionItem[]>(DEFAULT_PERMISSIONS_MATRIX);
  const [selectedRoleCard, setSelectedRoleCard] = useState<SystemRoleKey>('ADMIN');
  const [memberSearch, setMemberSearch] = useState('');
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Load saved rolePermissions from /api/system-settings if available
  useEffect(() => {
    fetch('/api/system-settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data?.rolePermissions) && d.data.rolePermissions.length > 0) {
          setPermissions(d.data.rolePermissions);
        }
      })
      .catch(() => {});
  }, []);

  const handleTogglePermission = (permId: string, roleKey: SystemRoleKey) => {
    if (isOfficer) return; // Officers view only
    setPermissions((prev) =>
      prev.map((item) => {
        if (item.id !== permId) return item;
        if (item.lockedRoles?.includes(roleKey)) return item;
        return {
          ...item,
          roles: {
            ...item.roles,
            [roleKey]: !item.roles[roleKey],
          },
        };
      })
    );
  };

  const handleSavePermissions = async () => {
    setSavingMatrix(true);
    try {
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolePermissions: permissions }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveToast('บันทึกตารางกำหนดบทบาทและสิทธิ์การเข้าถึง (RBAC Matrix) เรียบร้อยแล้ว!');
        setTimeout(() => setSaveToast(null), 4000);
      }
    } catch (e) {
      console.error('Failed saving role permissions:', e);
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleResetDefaultPermissions = () => {
    if (!window.confirm('ยืนยันการคืนค่าตารางสิทธิ์การเข้าถึงกลับเป็นค่ามาตรฐานเริ่มต้นหรือไม่?')) return;
    setPermissions(DEFAULT_PERMISSIONS_MATRIX);
    setSaveToast('คืนค่าตารางสิทธิ์มาตรฐานเรียบร้อยแล้ว (กดปุ่มบันทึกเพื่อยืนยัน)');
    setTimeout(() => setSaveToast(null), 4000);
  };

  const superAdmins = users.filter(
    (u) => u.role === 'SUPER_ADMIN' || u.isSuperAdmin || u.email === 'phaisal.dis@mcu.ac.th'
  );
  const admins = users.filter(
    (u) => u.role === 'ADMIN' && !u.isSuperAdmin && u.email !== 'phaisal.dis@mcu.ac.th'
  );
  const officers = users.filter((u) => u.role === 'OFFICER');
  const instructors = users.filter((u) => u.role === 'INSTRUCTOR');

  const ROLE_CARDS: {
    key: SystemRoleKey;
    title: string;
    badge: string;
    count: number;
    desc: string;
    colorClass: string;
    activeBorder: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'SUPER_ADMIN',
      title: 'ผู้ดูแลระบบสูงสุด',
      badge: 'SUPER_ADMIN',
      count: superAdmins.length,
      desc: 'สิทธิ์สูงสุดในการควบคุมระบบทั้งหมด ตั้งค่าตราตั้ง โลโก้ ซิงค์ Google Sheets และแต่งตั้ง Admin',
      colorClass: 'from-purple-600 to-indigo-700 text-white',
      activeBorder: 'ring-2 ring-purple-600 border-purple-600 bg-purple-50/40',
      icon: <Crown className="w-5 h-5 text-amber-300" />,
    },
    {
      key: 'ADMIN',
      title: 'ผู้ดูแลระบบคณะ',
      badge: 'ADMIN',
      count: admins.length,
      desc: 'บริหารจัดการคำร้อง ทะเบียนนิสิต ทะเบียนรายวิชา ตารางสอน เวลาเรียน และจัดการผู้ใช้',
      colorClass: 'from-indigo-600 to-blue-700 text-white',
      activeBorder: 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/40',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-200" />,
    },
    {
      key: 'OFFICER',
      title: 'เจ้าหน้าที่ทะเบียน / คณะ',
      badge: 'OFFICER',
      count: officers.length,
      desc: 'ตรวจสอบคำร้อง แก้ไขทะเบียนนิสิต จัดการรายวิชา/ตารางสอน และออกบัตรภาระงานอาจารย์',
      colorClass: 'from-sky-600 to-cyan-600 text-white',
      activeBorder: 'ring-2 ring-sky-600 border-sky-600 bg-sky-50/40',
      icon: <UserCheck className="w-5 h-5 text-sky-100" />,
    },
    {
      key: 'INSTRUCTOR',
      title: 'อาจารย์ผู้สอน',
      badge: 'INSTRUCTOR',
      count: instructors.length,
      desc: 'เช็คชื่อเวลาเรียน สรุปสิทธิ์สอบ กรอกคะแนนวัดผล (Grade Sheet) ในรายวิชาที่รับผิดชอบสอน',
      colorClass: 'from-emerald-600 to-teal-600 text-white',
      activeBorder: 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50/40',
      icon: <Users className="w-5 h-5 text-emerald-100" />,
    },
    {
      key: 'STUDENT',
      title: 'นิสิต (ไทย / นานาชาติ)',
      badge: 'STUDENT',
      count: studentsCount,
      desc: 'ยื่นคำร้องขอหนังสือรับรองออนไลน์ ตรวจสอบสถานะ ดูตารางเรียน และลงทะเบียนกิจกรรมนิสิต',
      colorClass: 'from-amber-500 to-orange-600 text-white',
      activeBorder: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/40',
      icon: <GraduationCap className="w-5 h-5 text-amber-100" />,
    },
  ];

  // Filtered users for quick role assignment at bottom
  const roleAssignmentUsers = users.filter((u) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.gmail?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {saveToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-between shadow-sm animate-in fade-in">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            {saveToast}
          </span>
          <button
            type="button"
            onClick={() => setSaveToast(null)}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Role Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {ROLE_CARDS.map((rc) => {
          const isSelected = selectedRoleCard === rc.key;
          return (
            <div
              key={rc.key}
              onClick={() => setSelectedRoleCard(rc.key)}
              className={`rounded-2xl border p-4 transition cursor-pointer flex flex-col justify-between bg-white shadow-xs hover:shadow-md ${
                isSelected ? rc.activeBorder : 'border-slate-200/90'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${rc.colorClass} flex items-center justify-center shadow-sm`}
                  >
                    {rc.icon}
                  </div>
                  <span className="text-xl font-black text-slate-900">{rc.count}</span>
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">{rc.title}</div>
                  <div className="text-[10px] font-mono font-bold text-slate-400">{rc.badge}</div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{rc.desc}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-indigo-600">
                <span>
                  สิทธิ์ที่เปิด:{' '}
                  {permissions.filter((p) => p.roles[rc.key]).length}/{permissions.length} ระบบ
                </span>
                <span>ดูสมาชิก →</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Interactive Role & Permission Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>ตารางกำหนดบทบาทและสิทธิ์การเข้าถึงแต่ละระบบ (RBAC Permission Matrix)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              คลิกที่ช่องเครื่องหมายในตารางเพื่อ เปิด (✓) หรือ ปิด (✕) สิทธิ์การเข้าถึงและปุ่มจัดการในแต่ละหน้าสำหรับแต่ละบทบาท
            </p>
          </div>

          {!isOfficer && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetDefaultPermissions}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>คืนค่ามาตรฐาน</span>
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={savingMatrix}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingMatrix ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าสิทธิ์'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-[11px] uppercase font-extrabold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 min-w-[280px]">ระบบงาน / ความสามารถ (Module & Feature)</th>
                <th className="px-3 py-3.5 text-center w-28 bg-purple-50/60 text-purple-900">
                  👑 Super Admin
                </th>
                <th className="px-3 py-3.5 text-center w-28 bg-indigo-50/60 text-indigo-900">
                  🛡️ Admin
                </th>
                <th className="px-3 py-3.5 text-center w-28 bg-sky-50/60 text-sky-900">
                  👮 เจ้าหน้าที่ (Officer)
                </th>
                <th className="px-3 py-3.5 text-center w-28 bg-emerald-50/60 text-emerald-900">
                  👨‍🏫 อาจารย์ผู้สอน
                </th>
                <th className="px-3 py-3.5 text-center w-28 bg-amber-50/60 text-amber-900">
                  🎓 นิสิต (Student)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissions.map((perm) => (
                <tr key={perm.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{perm.moduleName}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                        {perm.routeHint}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{perm.description}</div>
                  </td>

                  {(
                    ['SUPER_ADMIN', 'ADMIN', 'OFFICER', 'INSTRUCTOR', 'STUDENT'] as SystemRoleKey[]
                  ).map((rKey) => {
                    const enabled = perm.roles[rKey];
                    const isLocked = perm.lockedRoles?.includes(rKey) || isOfficer;

                    return (
                      <td key={rKey} className="px-3 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, rKey)}
                          disabled={isLocked}
                          title={
                            isLocked
                              ? 'สิทธิ์หลักของระบบ (ล็อกไว้เพื่อความปลอดภัย)'
                              : 'คลิกเพื่อสลับ เปิด/ปิด สิทธิ์นี้'
                          }
                          className={`w-8 h-8 rounded-xl inline-flex items-center justify-center transition ${
                            enabled
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-rose-50 hover:text-rose-500'
                          } ${isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer shadow-2xs'}`}
                        >
                          {enabled ? (
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Quick Role Assignment by Role & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-sky-600" />
              <span>
                กำหนดและปรับเปลี่ยนบทบาทผู้ใช้งานรายบุคคล (Quick Role Assignment)
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ค้นหาชื่อบุคลากรและเปลี่ยนบทบาท (Super Admin / Admin / เจ้าหน้าที่ / อาจารย์) ได้ทันทีในคลิกเดียว
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อบุคลากร หรืออีเมลเพื่อเปลี่ยนบทบาท..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
          {roleAssignmentUsers.slice(0, 30).map((u) => {
            const isSuper =
              u.role === 'SUPER_ADMIN' || u.isSuperAdmin || u.email === 'phaisal.dis@mcu.ac.th';
            return (
              <div
                key={u.id}
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-200 bg-slate-50/50 hover:bg-white transition flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                    {isSuper && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    <span className="truncate">{u.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {u.email || u.gmail || u.department}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isSuper && u.email === 'phaisal.dis@mcu.ac.th' ? (
                    <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      ผู้ดูแลสูงสุดหลัก
                    </span>
                  ) : (
                    <select
                      value={isSuper ? 'SUPER_ADMIN' : u.role}
                      disabled={isOfficer}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer focus:outline-none ${
                        isSuper
                          ? 'bg-purple-50 text-purple-800 border-purple-300'
                          : u.role === 'ADMIN'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                          : u.role === 'OFFICER'
                          ? 'bg-sky-50 text-sky-800 border-sky-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {isSuperAdmin && <option value="SUPER_ADMIN">👑 Super Admin</option>}
                      <option value="ADMIN">🛡️ Admin</option>
                      <option value="OFFICER">👮 เจ้าหน้าที่ (Officer)</option>
                      <option value="INSTRUCTOR">👨‍🏫 อาจารย์ผู้สอน</option>
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => handleStartEditUser(u)}
                    className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-[11px] font-bold transition cursor-pointer"
                    title="แก้ไขข้อมูลและบทบาท"
                  >
                    แก้ไข
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
