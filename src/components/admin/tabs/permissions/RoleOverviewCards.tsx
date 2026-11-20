'use client';

import React from 'react';
import {
  Crown,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Briefcase,
  Users,
  Sparkles,
  Layers,
  Trash2,
} from 'lucide-react';
import {
  SystemRoleKey,
  RoleColumnConfig,
  PermissionItem,
  THEME_STYLES,
} from './types';

interface RoleOverviewCardsProps {
  roleColumns: RoleColumnConfig[];
  permissions: PermissionItem[];
  selectedRoleCard: SystemRoleKey;
  setSelectedRoleCard: (key: SystemRoleKey) => void;
  getRoleCount: (key: SystemRoleKey) => number;
  isOfficer?: boolean;
  handleDeleteCustomRole: (col: RoleColumnConfig) => void;
  onOpenVipassanaMasterModal?: () => void;
  onOpenOfficerModal?: () => void;
}

export const RoleOverviewCards: React.FC<RoleOverviewCardsProps> = ({
  roleColumns,
  permissions,
  selectedRoleCard,
  setSelectedRoleCard,
  getRoleCount,
  isOfficer,
  handleDeleteCustomRole,
  onOpenVipassanaMasterModal,
  onOpenOfficerModal,
}) => {
  const getRoleIcon = (key: SystemRoleKey) => {
    if (key === 'SUPER_ADMIN') return <Crown className="w-5 h-5 text-amber-300" />;
    if (key === 'ADMIN') return <ShieldCheck className="w-5 h-5 text-indigo-200" />;
    if (key === 'OFFICER') return <UserCheck className="w-5 h-5 text-sky-100" />;
    if (key === 'ACTING_OFFICER') return <GraduationCap className="w-5 h-5 text-teal-100" />;
    if (key === 'STAFF') return <Briefcase className="w-5 h-5 text-blue-100" />;
    if (key === 'INSTRUCTOR') return <Users className="w-5 h-5 text-emerald-100" />;
    if (key === 'VIPASSANA_MASTER') return <Sparkles className="w-5 h-5 text-rose-100" />;
    if (key === 'STUDENT') return <GraduationCap className="w-5 h-5 text-amber-100" />;
    return <Layers className="w-5 h-5 text-white" />;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
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
              {rc.key === 'VIPASSANA_MASTER' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  🧘 วิปัสสนา
                </span>
              )}
            </div>

            {rc.key === 'VIPASSANA_MASTER' && onOpenVipassanaMasterModal && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenVipassanaMasterModal();
                }}
                className="mt-2.5 w-full py-1.5 px-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-[11px] font-bold shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>🧘 จัดการ Excel & รหัสผ่าน</span>
              </button>
            )}

            {rc.key === 'OFFICER' && onOpenOfficerModal && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenOfficerModal();
                }}
                className="mt-2.5 w-full py-1.5 px-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl text-[11px] font-bold shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>📋 จัดการ Excel & รหัสผ่าน (Fb8323mcu)</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
