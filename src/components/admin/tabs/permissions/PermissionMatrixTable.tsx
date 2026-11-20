'use client';

import React from 'react';
import {
  ShieldCheck,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import {
  SystemRoleKey,
  RoleColumnConfig,
  PermissionItem,
  THEME_STYLES,
} from './types';

interface PermissionMatrixTableProps {
  roleColumns: RoleColumnConfig[];
  permissions: PermissionItem[];
  isOfficer?: boolean;
  savingMatrix: boolean;
  onOpenAddRole: () => void;
  onOpenAddPerm: () => void;
  onResetDefaults: () => void;
  onSavePermissions: () => void;
  onTogglePermission: (permId: string, roleKey: SystemRoleKey) => void;
  onDeletePermissionRow: (perm: PermissionItem) => void;
}

export const PermissionMatrixTable: React.FC<PermissionMatrixTableProps> = ({
  roleColumns,
  permissions,
  isOfficer,
  savingMatrix,
  onOpenAddRole,
  onOpenAddPerm,
  onResetDefaults,
  onSavePermissions,
  onTogglePermission,
  onDeletePermissionRow,
}) => {
  return (
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
              onClick={onOpenAddRole}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-extrabold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span>เพิ่มบทบาทใหม่</span>
            </button>
            <button
              type="button"
              onClick={onOpenAddPerm}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-extrabold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-sky-600" />
              <span>เพิ่มหัวข้อสิทธิ์ใหม่</span>
            </button>
            <button
              type="button"
              onClick={onResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>คืนค่ามาตรฐาน</span>
            </button>
            <button
              type="button"
              onClick={onSavePermissions}
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
                        onClick={() => onDeletePermissionRow(perm)}
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
                        onClick={() => onTogglePermission(perm.id, rKey)}
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
  );
};
