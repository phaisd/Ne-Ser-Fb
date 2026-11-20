'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import {
  RolePermissionsMatrixViewProps,
  SystemRoleKey,
  RoleColumnConfig,
  PermissionItem,
  DEFAULT_ROLE_COLUMNS,
  DEFAULT_PERMISSIONS_MATRIX,
} from './types';
import { RoleOverviewCards } from './RoleOverviewCards';
import { PermissionMatrixTable } from './PermissionMatrixTable';
import { AddCustomRoleModal } from './AddCustomRoleModal';
import { AddPermissionRowModal } from './AddPermissionRowModal';

export const RolePermissionsMatrixView: React.FC<RolePermissionsMatrixViewProps> = ({
  users,
  studentsCount,
  isOfficer = false,
  onOpenVipassanaMasterModal,
  onOpenOfficerModal,
}) => {
  const [roleColumns, setRoleColumns] = useState<RoleColumnConfig[]>(DEFAULT_ROLE_COLUMNS);
  const [permissions, setPermissions] = useState<PermissionItem[]>(DEFAULT_PERMISSIONS_MATRIX);
  const [selectedRoleCard, setSelectedRoleCard] = useState<SystemRoleKey>('ACTING_OFFICER');
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Modals state
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isAddPermOpen, setIsAddPermOpen] = useState(false);

  // Load saved rolePermissions & roleColumns from /api/system-settings
  useEffect(() => {
    fetch('/api/system-settings')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !d.data) return;

        // 1. Merge roleColumns
        let loadedCols: RoleColumnConfig[] = DEFAULT_ROLE_COLUMNS;
        if (Array.isArray(d.data.roleColumns) && d.data.roleColumns.length > 0) {
          const savedCols = d.data.roleColumns as RoleColumnConfig[];
          const savedKeys = new Set(savedCols.map((c) => c.key));
          const mergedCols = [...savedCols];

          if (!savedKeys.has('ACTING_OFFICER')) {
            const officerIdx = mergedCols.findIndex((c) => c.key === 'OFFICER');
            const actingCol = DEFAULT_ROLE_COLUMNS.find((c) => c.key === 'ACTING_OFFICER')!;
            if (officerIdx !== -1) {
              mergedCols.splice(officerIdx + 1, 0, actingCol);
            } else {
              mergedCols.push(actingCol);
            }
          }

          if (!savedKeys.has('STAFF')) {
            const actingIdx = mergedCols.findIndex((c) => c.key === 'ACTING_OFFICER');
            const staffCol = DEFAULT_ROLE_COLUMNS.find((c) => c.key === 'STAFF')!;
            if (actingIdx !== -1) {
              mergedCols.splice(actingIdx + 1, 0, staffCol);
            } else {
              mergedCols.push(staffCol);
            }
          }

          if (!savedKeys.has('VIPASSANA_MASTER')) {
            const instructorIdx = mergedCols.findIndex((c) => c.key === 'INSTRUCTOR');
            const vipassanaCol = DEFAULT_ROLE_COLUMNS.find((c) => c.key === 'VIPASSANA_MASTER')!;
            if (instructorIdx !== -1) {
              mergedCols.splice(instructorIdx + 1, 0, vipassanaCol);
            } else {
              mergedCols.push(vipassanaCol);
            }
          }

          mergedCols.forEach((col) => {
            if (col.key === 'OFFICER') {
              col.title = 'เจ้าหน้าที่หลักสูตร (OFFICER)';
              col.shortHeader = '📋 เจ้าหน้าที่หลักสูตร';
            } else if (col.key === 'ACTING_OFFICER') {
              col.title = 'ผู้ช่วยเจ้าหน้าที่ (ผู้ช่วยงาน)';
              col.shortHeader = '🎓 ผู้ช่วยเจ้าหน้าที่ (ผู้ช่วยงาน)';
            } else if (col.key === 'STAFF') {
              col.title = 'เจ้าหน้าที่สายสนับสนุน (STAFF)';
              col.shortHeader = '💼 สายสนับสนุน (STAFF)';
            }
          });
          loadedCols = mergedCols;
          setRoleColumns(mergedCols);
        }

        // 2. Merge rolePermissions
        if (Array.isArray(d.data.rolePermissions) && d.data.rolePermissions.length > 0) {
          const defaultMap = new Map(DEFAULT_PERMISSIONS_MATRIX.map((p) => [p.id, p]));
          const savedPermIds = new Set((d.data.rolePermissions as PermissionItem[]).map((p) => p.id));
          const hydratedPerms: PermissionItem[] = (d.data.rolePermissions as PermissionItem[]).map((item) => {
            const defItem = defaultMap.get(item.id);
            const nextRoles: Record<string, boolean> = { ...(item.roles || {}) };
            if (nextRoles.ACTING_OFFICER === undefined) {
              nextRoles.ACTING_OFFICER =
                defItem?.roles.ACTING_OFFICER !== undefined
                  ? defItem.roles.ACTING_OFFICER
                  : Boolean(nextRoles.OFFICER && item.id !== 'users_instructors_manage');
            }
            if (nextRoles.VIPASSANA_MASTER === undefined) {
              nextRoles.VIPASSANA_MASTER =
                defItem?.roles.VIPASSANA_MASTER !== undefined
                  ? defItem.roles.VIPASSANA_MASTER
                  : (item.id === 'vipassana_interview_eval' || item.id === 'vipassana_events_view' || item.id === 'vipassana_report_print');
            }
            if (item.id === 'vipassana_interview_eval' || item.id === 'vipassana_events_view' || item.id === 'vipassana_report_print') {
              nextRoles.VIPASSANA_MASTER = true;
            }
            loadedCols.forEach((col) => {
              if (nextRoles[col.key] === undefined) {
                nextRoles[col.key] = false;
              }
            });
            return {
              ...item,
              lockedRoles: defItem?.lockedRoles || item.lockedRoles,
              roles: nextRoles,
            };
          });

          DEFAULT_PERMISSIONS_MATRIX.forEach((defItem) => {
            if (!savedPermIds.has(defItem.id)) {
              const nextRoles: Record<string, boolean> = { ...(defItem.roles || {}) };
              loadedCols.forEach((col) => {
                if (nextRoles[col.key] === undefined) {
                  nextRoles[col.key] = false;
                }
              });
              hydratedPerms.push({
                ...defItem,
                roles: nextRoles,
              });
            }
          });

          setPermissions(hydratedPerms);
        }
      })
      .catch(() => {});
  }, []);

  const handleTogglePermission = (permId: string, roleKey: SystemRoleKey) => {
    if (isOfficer) return;
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
  const handleAddRoleColumn = async ({
    title,
    code,
    desc,
    theme,
    baseRoleKey,
  }: {
    title: string;
    code: string;
    desc: string;
    theme: RoleColumnConfig['colorTheme'];
    baseRoleKey: SystemRoleKey;
  }) => {
    const generatedCode =
      code
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, '_') || `ROLE_${Date.now().toString(36).toUpperCase()}`;

    if (roleColumns.some((c) => c.key === generatedCode)) {
      alert(`รหัสบทบาท "${generatedCode}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
      return;
    }

    const newCol: RoleColumnConfig = {
      key: generatedCode,
      title,
      shortHeader: `🏷️ ${title}`,
      badge: generatedCode,
      desc: desc.trim() || `บทบาทเพิ่มเติมสำหรับ ${title}`,
      colorTheme: theme,
      isCustom: true,
    };

    const nextColumns = [...roleColumns, newCol];
    const nextPermissions = permissions.map((p) => ({
      ...p,
      roles: {
        ...p.roles,
        [generatedCode]: Boolean(p.roles[baseRoleKey]),
      },
    }));

    setRoleColumns(nextColumns);
    setPermissions(nextPermissions);
    setSelectedRoleCard(generatedCode);
    setIsAddRoleOpen(false);

    await persistMatrixAndRoles(
      nextPermissions,
      nextColumns,
      `เพิ่มบทบาทใหม่ "${title}" (${generatedCode}) และบันทึกสิทธิ์เรียบร้อยแล้ว!`
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
  const handleAddPermissionRow = async ({
    name,
    desc,
    route,
  }: {
    name: string;
    desc: string;
    route: string;
  }) => {
    const rowNumber = permissions.length + 1;
    const formattedTitle = /^\d+\./.test(name) ? name : `${rowNumber}. ${name}`;
    const initialRoles: Record<string, boolean> = {};
    roleColumns.forEach((c) => {
      initialRoles[c.key] = c.key === 'SUPER_ADMIN' || c.key === 'ADMIN';
    });

    const newRow: PermissionItem = {
      id: `perm_custom_${Date.now()}`,
      moduleName: formattedTitle,
      description: desc.trim() || 'กำหนดสิทธิ์การเข้าถึงและการจัดการเฉพาะส่วนงาน',
      routeHint: route.trim() || '/admin',
      roles: initialRoles,
      lockedRoles: ['SUPER_ADMIN'],
      isCustom: true,
    };

    const nextPermissions = [...permissions, newRow];
    setPermissions(nextPermissions);
    setIsAddPermOpen(false);

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
  const staffCount = users.filter((u) => u.role === 'STAFF').length;
  const instructorsCount = users.filter((u) => u.role === 'INSTRUCTOR').length;
  const vipassanaMastersCount = users.filter((u) => u.role === 'VIPASSANA_MASTER').length;

  const getRoleCount = (key: SystemRoleKey): number => {
    if (key === 'SUPER_ADMIN') return superAdminsCount;
    if (key === 'ADMIN') return adminsCount;
    if (key === 'OFFICER') return officersCount;
    if (key === 'ACTING_OFFICER') return actingOfficersCount;
    if (key === 'STAFF') return staffCount;
    if (key === 'INSTRUCTOR') return instructorsCount;
    if (key === 'VIPASSANA_MASTER') return vipassanaMastersCount;
    if (key === 'STUDENT') return studentsCount;
    return users.filter((u) => (u.role as string) === key).length;
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
      <RoleOverviewCards
        roleColumns={roleColumns}
        permissions={permissions}
        selectedRoleCard={selectedRoleCard}
        setSelectedRoleCard={setSelectedRoleCard}
        getRoleCount={getRoleCount}
        isOfficer={isOfficer}
        handleDeleteCustomRole={handleDeleteCustomRole}
        onOpenVipassanaMasterModal={onOpenVipassanaMasterModal}
        onOpenOfficerModal={onOpenOfficerModal}
      />

      {/* 2. Interactive Role & Permission Matrix Table */}
      <PermissionMatrixTable
        roleColumns={roleColumns}
        permissions={permissions}
        isOfficer={isOfficer}
        savingMatrix={savingMatrix}
        onOpenAddRole={() => setIsAddRoleOpen(true)}
        onOpenAddPerm={() => setIsAddPermOpen(true)}
        onResetDefaults={handleResetDefaultPermissions}
        onSavePermissions={handleSavePermissions}
        onTogglePermission={handleTogglePermission}
        onDeletePermissionRow={handleDeletePermissionRow}
      />

      {/* Modal 1: Add Custom Role */}
      <AddCustomRoleModal
        isOpen={isAddRoleOpen}
        onClose={() => setIsAddRoleOpen(false)}
        roleColumns={roleColumns}
        onAddRole={handleAddRoleColumn}
      />

      {/* Modal 2: Add Permission Row */}
      <AddPermissionRowModal
        isOpen={isAddPermOpen}
        onClose={() => setIsAddPermOpen(false)}
        onAddPermission={handleAddPermissionRow}
      />
    </div>
  );
};
