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
  Save,
  RotateCcw,
  Plus,
  Sparkles,
  Trash2,
  Briefcase,
  Layers,
} from 'lucide-react';
import { UserAccount } from '@/types';

export type SystemRoleKey =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'OFFICER'
  | 'ACTING_OFFICER'
  | 'INSTRUCTOR'
  | 'STUDENT'
  | string;

export interface RoleColumnConfig {
  key: SystemRoleKey;
  title: string;
  shortHeader: string;
  badge: string;
  desc: string;
  colorTheme: 'purple' | 'indigo' | 'sky' | 'teal' | 'emerald' | 'amber' | 'rose';
  isCustom?: boolean;
}

export interface PermissionItem {
  id: string;
  moduleName: string;
  description: string;
  routeHint: string;
  roles: Record<string, boolean>;
  lockedRoles?: string[]; // Roles that cannot be toggled off (e.g. SUPER_ADMIN)
  isCustom?: boolean;
}

export const DEFAULT_ROLE_COLUMNS: RoleColumnConfig[] = [
  {
    key: 'SUPER_ADMIN',
    title: 'ผู้ดูแลระบบสูงสุด',
    shortHeader: '👑 Super Admin',
    badge: 'SUPER_ADMIN',
    desc: 'สิทธิ์สูงสุดในการควบคุมระบบทั้งหมด ตั้งค่าตราตั้ง โลโก้ ซิงค์ Google Sheets และแต่งตั้ง Admin',
    colorTheme: 'purple',
  },
  {
    key: 'ADMIN',
    title: 'ผู้ดูแลระบบคณะ',
    shortHeader: '🛡️ Admin',
    badge: 'ADMIN',
    desc: 'บริหารจัดการคำร้อง ทะเบียนนิสิต ทะเบียนรายวิชา ตารางสอน เวลาเรียน และจัดการผู้ใช้',
    colorTheme: 'indigo',
  },
  {
    key: 'OFFICER',
    title: 'เจ้าหน้าที่ดูแลระบบ',
    shortHeader: '👮 เจ้าหน้าที่ดูแลระบบ (Officer)',
    badge: 'OFFICER',
    desc: 'ตรวจสอบคำร้อง แก้ไข/เลื่อนชั้นปีนิสิต จัดการรายวิชา/ตารางสอน และออกบัตรภาระงานอาจารย์',
    colorTheme: 'sky',
  },
  {
    key: 'ACTING_OFFICER',
    title: 'เจ้าหน้าที่หลักสูตร / ผู้ช่วยเจ้าหน้าที่',
    shortHeader: '🤝 ผู้ช่วยเจ้าหน้าที่ / หลักสูตร',
    badge: 'ACTING_OFFICER',
    desc: 'อาจารย์หรือนิสิตที่ได้รับมอบหมาย (☑️ ช่วยงานเจ้าหน้าที่) ช่วยตรวจคำร้อง จัดตารางสอน และเช็คชื่อกิจกรรม โดยจำกัดสิทธิ์บางเรื่องที่สำคัญ',
    colorTheme: 'teal',
  },
  {
    key: 'INSTRUCTOR',
    title: 'อาจารย์ผู้สอน',
    shortHeader: '👨‍🏫 อาจารย์ผู้สอน',
    badge: 'INSTRUCTOR',
    desc: 'เช็คชื่อเวลาเรียน สรุปสิทธิ์สอบ กรอกคะแนนวัดผล (Grade Sheet) ในรายวิชาที่รับผิดชอบสอน',
    colorTheme: 'emerald',
  },
  {
    key: 'STUDENT',
    title: 'นิสิต (ไทย / นานาชาติ)',
    shortHeader: '🎓 นิสิต (Student)',
    badge: 'STUDENT',
    desc: 'ยื่นคำร้องขอหนังสือรับรองออนไลน์ ตรวจสอบสถานะ ดูตารางเรียน และลงทะเบียนกิจกรรมนิสิต',
    colorTheme: 'amber',
  },
];

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
      ACTING_OFFICER: true,
      INSTRUCTOR: true,
      STUDENT: true,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'cert_approve_manage',
    moduleName: '2. ตรวจสอบคำร้อง ออกเลขที่หนังสือ และพิมพ์ใบรับรอง',
    description: 'ตรวจสอบเอกสารแนบ อนุมัติ/ตีกลับคำร้อง กำหนดผู้ลงนาม และดูแท็บรายการคำร้องทั้งหมด',
    routeHint: '/admin & /certificates',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: true,
      INSTRUCTOR: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'students_view_edit',
    moduleName: '3. ค้นหาและแก้ไขข้อมูลทะเบียนนิสิตทั่วไป (PDPA)',
    description: 'ค้นหารายชื่อนิสิต ตรวจสอบสถานภาพ วันหมดอายุพาสปอร์ต/วีซ่า และแก้ไขข้อมูลพื้นฐานของนิสิต',
    routeHint: '/students & /admin',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: true,
      INSTRUCTOR: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'students_promote_archive',
    moduleName: '4. เลื่อนชั้นปีการศึกษา / ย้ายจำหน่ายนิสิตเข้าแฟ้มประวัติ (Students_Archive)',
    description: 'เลื่อนชั้นปีนิสิตแบบยกชุด ย้ายนิสิตจบการศึกษา/พ้นสภาพ/ลาออก เข้าแฟ้มประวัติ และกู้คืนข้อมูล',
    routeHint: '/admin (ทะเบียนนิสิต)',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: false,
      INSTRUCTOR: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'courses_view',
    moduleName: '5. เปิดดูทะเบียนรายวิชาและตารางเรียนรวม',
    description: 'ค้นหารายวิชา ดูตารางเรียนแยกตามชั้นปี/สาขาวิชา และสั่งพิมพ์ตารางเรียน',
    routeHint: '/courses',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: true,
      INSTRUCTOR: true,
      STUDENT: true,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'courses_manage',
    moduleName: '6. เพิ่ม/แก้ไข/ลบรายวิชา นำเข้า CSV และจัดตารางสอนหลักสูตร',
    description: 'แสดงปุ่มเพิ่มวิชา แก้ไขผู้สอน ลบ นำเข้า/ส่งออก CSV และคัดลอกรายวิชาข้ามปีการศึกษา',
    routeHint: '/courses & /api/courses',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: true,
      INSTRUCTOR: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'attendance_grades_own',
    moduleName: '7. เช็คชื่อนิสิต สรุปสิทธิ์สอบ และกรอกคะแนนวัดผล (วิชาที่สอน)',
    description: 'บันทึกเวลาเรียนรายคาบ ตรวจสอบสิทธิ์สอบ 80% และออกใบกรอกคะแนนวัดผล (Grade Sheet) ประจำวิชา',
    routeHint: '/attendance',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: true,
      INSTRUCTOR: true,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'attendance_grades_all',
    moduleName: '8. จัดการเวลาเรียนและใบกรอกคะแนนวัดผลทุกรายวิชาทั้งคณะ',
    description: 'ดูประวัติการเช็คชื่อทุกรายวิชา ล้างข้อมูลตัวอย่าง และตรวจใบกรอกคะแนนของอาจารย์ทุกท่าน',
    routeHint: '/admin (บันทึกเวลาเรียน)',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: false,
      INSTRUCTOR: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'events_checkin',
    moduleName: '9. จัดการโครงการและเช็คชื่อเข้าร่วมกิจกรรมนิสิต',
    description: 'สร้างโครงการกิจกรรม และกดเช็คชื่อนิสิตเข้าร่วมกิจกรรมหน้างาน',
    routeHint: '/events & /admin',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: true,
      INSTRUCTOR: true,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'users_instructors_manage',
    moduleName: '10. จัดการไอดีอาจารย์ รีเซ็ตรหัสผ่าน และกำหนดสิทธิ์ผู้ใช้งาน',
    description: 'สร้าง/แก้ไขบัญชีอาจารย์ รีเซ็ตรหัสผ่าน แต่งตั้งผู้ช่วยเจ้าหน้าที่ และพิมพ์บัตรแจ้งภาระงานสอน',
    routeHint: '/admin (จัดการผู้ใช้)',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: true,
      ACTING_OFFICER: false,
      INSTRUCTOR: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'system_branding_sheets',
    moduleName: '11. ตั้งค่าตราตั้ง โลโก้ ผู้ลงนาม และเชื่อมต่อ Google Sheets หลัก',
    description: 'ปรับแต่งโลโก้คณะ รายชื่อผู้ลงนาม นโยบายความปลอดภัย และซิงค์ฐานข้อมูล Google Sheets',
    routeHint: '/admin (ตั้งค่าตราตั้ง & Google Sheets)',
    roles: {
      SUPER_ADMIN: true,
      ADMIN: true,
      OFFICER: false,
      ACTING_OFFICER: false,
      INSTRUCTOR: false,
      STUDENT: false,
    },
    lockedRoles: ['SUPER_ADMIN'],
  },
];

const THEME_STYLES: Record<
  RoleColumnConfig['colorTheme'],
  { cardGrad: string; activeBorder: string; thBg: string }
> = {
  purple: {
    cardGrad: 'from-purple-600 to-indigo-700 text-white',
    activeBorder: 'ring-2 ring-purple-600 border-purple-600 bg-purple-50/40',
    thBg: 'bg-purple-50/70 text-purple-900',
  },
  indigo: {
    cardGrad: 'from-indigo-600 to-blue-700 text-white',
    activeBorder: 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/40',
    thBg: 'bg-indigo-50/70 text-indigo-900',
  },
  sky: {
    cardGrad: 'from-sky-600 to-cyan-600 text-white',
    activeBorder: 'ring-2 ring-sky-600 border-sky-600 bg-sky-50/40',
    thBg: 'bg-sky-50/70 text-sky-900',
  },
  teal: {
    cardGrad: 'from-teal-600 to-emerald-600 text-white',
    activeBorder: 'ring-2 ring-teal-600 border-teal-600 bg-teal-50/40',
    thBg: 'bg-teal-50/80 text-teal-900',
  },
  emerald: {
    cardGrad: 'from-emerald-600 to-green-600 text-white',
    activeBorder: 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50/40',
    thBg: 'bg-emerald-50/70 text-emerald-900',
  },
  amber: {
    cardGrad: 'from-amber-500 to-orange-600 text-white',
    activeBorder: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/40',
    thBg: 'bg-amber-50/70 text-amber-900',
  },
  rose: {
    cardGrad: 'from-rose-500 to-pink-600 text-white',
    activeBorder: 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/40',
    thBg: 'bg-rose-50/70 text-rose-900',
  },
};

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
  isOfficer = false,
}) => {
  const [roleColumns, setRoleColumns] = useState<RoleColumnConfig[]>(DEFAULT_ROLE_COLUMNS);
  const [permissions, setPermissions] = useState<PermissionItem[]>(DEFAULT_PERMISSIONS_MATRIX);
  const [selectedRoleCard, setSelectedRoleCard] = useState<SystemRoleKey>('ACTING_OFFICER');
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Add Role Modal State
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleTheme, setNewRoleTheme] = useState<RoleColumnConfig['colorTheme']>('teal');
  const [newRoleBaseKey, setNewRoleBaseKey] = useState<SystemRoleKey>('ACTING_OFFICER');

  // Add Permission Row Modal State
  const [isAddPermOpen, setIsAddPermOpen] = useState(false);
  const [newPermName, setNewPermName] = useState('');
  const [newPermDesc, setNewPermDesc] = useState('');
  const [newPermRoute, setNewPermRoute] = useState('/admin');

  // Load saved rolePermissions & roleColumns from /api/system-settings
  useEffect(() => {
    fetch('/api/system-settings')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !d.data) return;

        // 1. Merge roleColumns (ensure ACTING_OFFICER and all 6 core columns exist)
        let loadedCols: RoleColumnConfig[] = DEFAULT_ROLE_COLUMNS;
        if (Array.isArray(d.data.roleColumns) && d.data.roleColumns.length > 0) {
          const savedCols = d.data.roleColumns as RoleColumnConfig[];
          const savedKeys = new Set(savedCols.map((c) => c.key));
          const mergedCols = [...savedCols];
          // Ensure ACTING_OFFICER is inserted if missing from older saved settings
          if (!savedKeys.has('ACTING_OFFICER')) {
            const officerIdx = mergedCols.findIndex((c) => c.key === 'OFFICER');
            const actingCol = DEFAULT_ROLE_COLUMNS.find((c) => c.key === 'ACTING_OFFICER')!;
            if (officerIdx !== -1) {
              mergedCols.splice(officerIdx + 1, 0, actingCol);
            } else {
              mergedCols.push(actingCol);
            }
          }
          loadedCols = mergedCols;
          setRoleColumns(mergedCols);
        }

        // 2. Merge rolePermissions (backfill ACTING_OFFICER default permissions if missing)
        if (Array.isArray(d.data.rolePermissions) && d.data.rolePermissions.length > 0) {
          const defaultMap = new Map(DEFAULT_PERMISSIONS_MATRIX.map((p) => [p.id, p]));
          const hydratedPerms = (d.data.rolePermissions as PermissionItem[]).map((item) => {
            const defItem = defaultMap.get(item.id);
            const nextRoles: Record<string, boolean> = { ...(item.roles || {}) };
            if (nextRoles.ACTING_OFFICER === undefined) {
              nextRoles.ACTING_OFFICER =
                defItem?.roles.ACTING_OFFICER !== undefined
                  ? defItem.roles.ACTING_OFFICER
                  : Boolean(nextRoles.OFFICER && item.id !== 'users_instructors_manage');
            }
            loadedCols.forEach((col) => {
              if (nextRoles[col.key] === undefined) {
                nextRoles[col.key] = false;
              }
            });
            return {
              ...item,
              roles: nextRoles,
            };
          });
          setPermissions(hydratedPerms);
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

  const persistMatrixAndRoles = async (
    nextPermissions: PermissionItem[],
    nextColumns: RoleColumnConfig[],
    toastMessage: string
  ) => {
    setSavingMatrix(true);
    try {
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rolePermissions: nextPermissions,
          roleColumns: nextColumns,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveToast(toastMessage);
        setTimeout(() => setSaveToast(null), 4000);
      }
    } catch (e) {
      console.error('Failed saving role permissions:', e);
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleSavePermissions = async () => {
    await persistMatrixAndRoles(
      permissions,
      roleColumns,
      'บันทึกตารางกำหนดบทบาทและสิทธิ์การเข้าถึง (RBAC Matrix) เรียบร้อยแล้ว!'
    );
  };

  const handleResetDefaultPermissions = async () => {
    if (!window.confirm('ยืนยันการคืนค่าตารางบทบาทและสิทธิ์การเข้าถึงกลับเป็นค่ามาตรฐานเริ่มต้น (6 บทบาทหลัก) หรือไม่?'))
      return;
    setRoleColumns(DEFAULT_ROLE_COLUMNS);
    setPermissions(DEFAULT_PERMISSIONS_MATRIX);
    await persistMatrixAndRoles(
      DEFAULT_PERMISSIONS_MATRIX,
      DEFAULT_ROLE_COLUMNS,
      'คืนค่าตารางบทบาทและสิทธิ์มาตรฐานเรียบร้อยแล้ว!'
    );
  };

  // Add New Custom Role Column
  const handleAddRoleColumn = async () => {
    const cleanTitle = newRoleTitle.trim();
    if (!cleanTitle) {
      alert('กรุณาระบุชื่อบทบาท (เช่น เจ้าหน้าที่หลักสูตรนานาชาติ)');
      return;
    }

    const generatedCode =
      newRoleCode
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, '_') || `ROLE_${Date.now().toString(36).toUpperCase()}`;

    if (roleColumns.some((c) => c.key === generatedCode)) {
      alert(`รหัสบทบาท "${generatedCode}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
      return;
    }

    const newCol: RoleColumnConfig = {
      key: generatedCode,
      title: cleanTitle,
      shortHeader: `🏷️ ${cleanTitle}`,
      badge: generatedCode,
      desc: newRoleDesc.trim() || `บทบาทเพิ่มเติมสำหรับ ${cleanTitle}`,
      colorTheme: newRoleTheme,
      isCustom: true,
    };

    const nextColumns = [...roleColumns, newCol];
    const nextPermissions = permissions.map((p) => ({
      ...p,
      roles: {
        ...p.roles,
        [generatedCode]: Boolean(p.roles[newRoleBaseKey]),
      },
    }));

    setRoleColumns(nextColumns);
    setPermissions(nextPermissions);
    setSelectedRoleCard(generatedCode);
    setIsAddRoleOpen(false);
    setNewRoleTitle('');
    setNewRoleCode('');
    setNewRoleDesc('');

    await persistMatrixAndRoles(
      nextPermissions,
      nextColumns,
      `เพิ่มบทบาทใหม่ "${cleanTitle}" (${generatedCode}) และบันทึกสิทธิ์เรียบร้อยแล้ว!`
    );
  };

  // Delete Custom Role Column
  const handleDeleteCustomRole = async (col: RoleColumnConfig) => {
    if (!col.isCustom) return;
    if (!window.confirm(`ยืนยันการลบบทบาท "${col.title}" (${col.badge}) ออกจากตารางสิทธิ์หรือไม่?`)) return;

    const nextColumns = roleColumns.filter((c) => c.key !== col.key);
    const nextPermissions = permissions.map((p) => {
      const nextRoles = { ...p.roles };
      delete nextRoles[col.key];
      return { ...p, roles: nextRoles };
    });

    setRoleColumns(nextColumns);
    setPermissions(nextPermissions);
    if (selectedRoleCard === col.key) setSelectedRoleCard('ADMIN');

    await persistMatrixAndRoles(
      nextPermissions,
      nextColumns,
      `ลบบทบาท "${col.title}" เรียบร้อยแล้ว`
    );
  };

  // Add New Permission Row
  const handleAddPermissionRow = async () => {
    const cleanName = newPermName.trim();
    if (!cleanName) {
      alert('กรุณาระบุชื่อระบบงาน / ความสามารถ');
      return;
    }

    const rowNumber = permissions.length + 1;
    const formattedTitle = /^\d+\./.test(cleanName) ? cleanName : `${rowNumber}. ${cleanName}`;
    const initialRoles: Record<string, boolean> = {};
    roleColumns.forEach((c) => {
      initialRoles[c.key] = c.key === 'SUPER_ADMIN' || c.key === 'ADMIN';
    });

    const newRow: PermissionItem = {
      id: `perm_custom_${Date.now()}`,
      moduleName: formattedTitle,
      description: newPermDesc.trim() || 'กำหนดสิทธิ์การเข้าถึงและการจัดการเฉพาะส่วนงาน',
      routeHint: newPermRoute.trim() || '/admin',
      roles: initialRoles,
      lockedRoles: ['SUPER_ADMIN'],
      isCustom: true,
    };

    const nextPermissions = [...permissions, newRow];
    setPermissions(nextPermissions);
    setIsAddPermOpen(false);
    setNewPermName('');
    setNewPermDesc('');
    setNewPermRoute('/admin');

    await persistMatrixAndRoles(
      nextPermissions,
      roleColumns,
      `เพิ่มหัวข้อสิทธิ์ "${formattedTitle}" และบันทึกเรียบร้อยแล้ว!`
    );
  };

  // Delete Custom Permission Row
  const handleDeletePermissionRow = async (perm: PermissionItem) => {
    if (!perm.isCustom) return;
    if (!window.confirm(`ยืนยันการลบหัวข้อสิทธิ์ "${perm.moduleName}" ออกจากตารางหรือไม่?`)) return;

    const nextPermissions = permissions.filter((p) => p.id !== perm.id);
    setPermissions(nextPermissions);
    await persistMatrixAndRoles(
      nextPermissions,
      roleColumns,
      `ลบหัวข้อสิทธิ์ "${perm.moduleName}" เรียบร้อยแล้ว`
    );
  };

  // Compute user counts per role
  const superAdminsCount = users.filter(
    (u) => u.role === 'SUPER_ADMIN' || u.isSuperAdmin || u.email === 'phaisal.dis@mcu.ac.th'
  ).length;
  const adminsCount = users.filter(
    (u) => u.role === 'ADMIN' && !u.isSuperAdmin && u.email !== 'phaisal.dis@mcu.ac.th'
  ).length;
  const officersCount = users.filter((u) => u.role === 'OFFICER').length;
  const actingOfficersCount = users.filter((u) => Boolean(u.isActingOfficer)).length;
  const instructorsCount = users.filter((u) => u.role === 'INSTRUCTOR').length;

  const getRoleCount = (key: SystemRoleKey): number => {
    if (key === 'SUPER_ADMIN') return superAdminsCount;
    if (key === 'ADMIN') return adminsCount;
    if (key === 'OFFICER') return officersCount;
    if (key === 'ACTING_OFFICER') return actingOfficersCount;
    if (key === 'INSTRUCTOR') return instructorsCount;
    if (key === 'STUDENT') return studentsCount;
    return users.filter((u) => (u.role as string) === key).length;
  };

  const getRoleIcon = (key: SystemRoleKey) => {
    if (key === 'SUPER_ADMIN') return <Crown className="w-5 h-5 text-amber-300" />;
    if (key === 'ADMIN') return <ShieldCheck className="w-5 h-5 text-indigo-200" />;
    if (key === 'OFFICER') return <UserCheck className="w-5 h-5 text-sky-100" />;
    if (key === 'ACTING_OFFICER') return <Briefcase className="w-5 h-5 text-teal-100" />;
    if (key === 'INSTRUCTOR') return <Users className="w-5 h-5 text-emerald-100" />;
    if (key === 'STUDENT') return <GraduationCap className="w-5 h-5 text-amber-100" />;
    return <Layers className="w-5 h-5 text-white" />;
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {roleColumns.map((rc) => {
          const isSelected = selectedRoleCard === rc.key;
          const theme = THEME_STYLES[rc.colorTheme] || THEME_STYLES.teal;
          const count = getRoleCount(rc.key);

          return (
            <div
              key={rc.key}
              onClick={() => setSelectedRoleCard(rc.key)}
              className={`rounded-2xl border p-4 transition cursor-pointer flex flex-col justify-between bg-white shadow-xs hover:shadow-md relative ${
                isSelected ? theme.activeBorder : 'border-slate-200/90'
              }`}
            >
              {rc.isCustom && !isOfficer && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCustomRole(rc);
                  }}
                  title="ลบบทบาทที่สร้างเพิ่มนี้"
                  className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.cardGrad} flex items-center justify-center shadow-sm`}
                  >
                    {getRoleIcon(rc.key)}
                  </div>
                  <span className="text-xl font-black text-slate-900 pr-4">{count}</span>
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900 leading-snug">{rc.title}</div>
                  <div className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">{rc.badge}</div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">{rc.desc}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-indigo-600">
                <span>
                  เปิดสิทธิ์: {permissions.filter((p) => p.roles[rc.key]).length}/{permissions.length} ข้อ
                </span>
                {rc.key === 'ACTING_OFFICER' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                    ☑️ ช่วยงาน
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Interactive Role & Permission Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50/80 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>ตารางกำหนดบทบาทและสิทธิ์การเข้าถึงแต่ละระบบ (RBAC Permission Matrix)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              คลิกที่ช่องเครื่องหมายเพื่อ เปิด (✓) หรือ ปิด (✕) สิทธิ์ของแต่ละบทบาท หรือกดปุ่ม <strong>+ เพิ่มบทบาทใหม่ / + เพิ่มหัวข้อสิทธิ์ใหม่</strong> ได้ตามต้องการ
            </p>
          </div>

          {!isOfficer && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddRoleOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-extrabold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-teal-600" />
                <span>เพิ่มบทบาทใหม่</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddPermOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-extrabold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-sky-600" />
                <span>เพิ่มหัวข้อสิทธิ์ใหม่</span>
              </button>
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
                <th className="px-5 py-3.5 min-w-[290px]">ระบบงาน / ความสามารถ (Module & Feature)</th>
                {roleColumns.map((col) => {
                  const theme = THEME_STYLES[col.colorTheme] || THEME_STYLES.teal;
                  return (
                    <th
                      key={col.key}
                      className={`px-3 py-3.5 text-center min-w-[120px] ${theme.thBg}`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{col.shortHeader}</span>
                        {col.key === 'ACTING_OFFICER' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-200/70 text-teal-900 normal-case">
                            ☑️ ช่วยงานเจ้าหน้าที่
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissions.map((perm) => (
                <tr key={perm.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>{perm.moduleName}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                        {perm.routeHint}
                      </span>
                      {perm.isCustom && !isOfficer && (
                        <button
                          type="button"
                          onClick={() => handleDeletePermissionRow(perm)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
                          title="ลบหัวข้อสิทธิ์นี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{perm.description}</div>
                  </td>

                  {roleColumns.map((col) => {
                    const rKey = col.key;
                    const enabled = Boolean(perm.roles[rKey]);
                    const isLocked = perm.lockedRoles?.includes(rKey) || isOfficer;

                    return (
                      <td
                        key={rKey}
                        className={`px-3 py-3.5 text-center ${
                          rKey === 'ACTING_OFFICER' ? 'bg-teal-50/20' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(perm.id, rKey)}
                          disabled={isLocked}
                          title={
                            isLocked
                              ? 'สิทธิ์หลักของระบบ (ล็อกไว้เพื่อความปลอดภัย)'
                              : `คลิกเพื่อสลับ เปิด/ปิด สิทธิ์สำหรับ "${col.title}"`
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

      {/* Modal 1: Add New Custom Role */}
      {isAddRoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  ➕ เพิ่มบทบาทผู้ใช้งานใหม่ (Add Custom Role)
                </h3>
                <p className="text-xs text-slate-500">
                  สร้างคอลัมน์บทบาทใหม่ในตารางเพื่อกำหนดสิทธิ์เฉพาะทาง
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRoleOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ชื่อบทบาทภาษาไทย <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น เจ้าหน้าที่หลักสูตรนานาชาติ, ผู้ช่วยสอน (TA)"
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  รหัสบทบาทภาษาอังกฤษ (ไม่บังคับ — ระบบสร้างให้อัตโนมัติได้)
                </label>
                <input
                  type="text"
                  placeholder="เช่น CURRICULUM_STAFF, EVENT_STAFF"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  คัดลอกสิทธิ์ตั้งต้นจากบทบาทใด:
                </label>
                <select
                  value={newRoleBaseKey}
                  onChange={(e) => setNewRoleBaseKey(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  {roleColumns.map((c) => (
                    <option key={c.key} value={c.key}>
                      ต้นแบบจาก: {c.title} ({c.badge})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">โทนสีป้ายกำกับ:</label>
                <select
                  value={newRoleTheme}
                  onChange={(e) => setNewRoleTheme(e.target.value as RoleColumnConfig['colorTheme'])}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  <option value="teal">เขียวมิ้นต์ (Teal)</option>
                  <option value="sky">ฟ้า (Sky Blue)</option>
                  <option value="indigo">น้ำเงินคราม (Indigo)</option>
                  <option value="purple">ม่วง (Purple)</option>
                  <option value="emerald">เขียวมรกต (Emerald)</option>
                  <option value="amber">ส้มอำพัน (Amber)</option>
                  <option value="rose">ชมพูโรส (Rose)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">คำอธิบายขอบเขตหน้าที่:</label>
                <textarea
                  rows={2}
                  placeholder="ระบุหน้าที่ความรับผิดชอบโดยย่อ..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddRoleOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAddRoleColumn}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 cursor-pointer"
              >
                + สร้างบทบาทใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Add New Permission Row */}
      {isAddPermOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  ➕ เพิ่มหัวข้อสิทธิ์ / ระบบงานใหม่ (Add Permission)
                </h3>
                <p className="text-xs text-slate-500">
                  เพิ่มแถวรายการสิทธิ์ใหม่ลงในตาราง RBAC Matrix
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPermOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ชื่อระบบงาน / ความสามารถ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น อนุมัติชั่วโมงกิจกรรมวิปัสสนากัมมัฏฐาน"
                  value={newPermName}
                  onChange={(e) => setNewPermName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Path / หน้าจอที่เกี่ยวข้อง:
                </label>
                <input
                  type="text"
                  placeholder="เช่น /events & /admin"
                  value={newPermRoute}
                  onChange={(e) => setNewPermRoute(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  คำอธิบายรายละเอียดของสิทธิ์:
                </label>
                <textarea
                  rows={2}
                  placeholder="อธิบายสิ่งที่ผู้มีสิทธิ์นี้สามารถดำเนินการได้..."
                  value={newPermDesc}
                  onChange={(e) => setNewPermDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddPermOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAddPermissionRow}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 cursor-pointer"
              >
                + เพิ่มหัวข้อสิทธิ์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
