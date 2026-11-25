'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

export type StatusBadgeType =
  // Attendance
  | 'PRESENT'
  | 'LATE'
  | 'ABSENT'
  | 'LEAVE'
  | 'SICK'
  // Event & Vipassana
  | 'ATTENDED'
  | 'REGISTERED'
  // Exam Eligibility
  | 'ELIGIBLE'
  | 'WARNING'
  | 'INELIGIBLE'
  // User Account
  | 'ACTIVE'
  | 'SUSPENDED';

interface StatusBadgeProps {
  status: StatusBadgeType | string;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'subtle' | 'solid';
  showIcon?: boolean;
  className?: string;
}

interface StatusConfig {
  defaultLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  solid: string;
  subtle: string;
}

const STATUS_CONFIGS: Record<string, StatusConfig> = {
  PRESENT: {
    defaultLabel: 'มาเรียน',
    icon: CheckCircle2,
    solid: 'bg-emerald-600 text-white',
    subtle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  LATE: {
    defaultLabel: 'มาสาย',
    icon: Clock,
    solid: 'bg-amber-500 text-white',
    subtle: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  ABSENT: {
    defaultLabel: 'ขาดเรียน',
    icon: XCircle,
    solid: 'bg-rose-600 text-white',
    subtle: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  LEAVE: {
    defaultLabel: 'ลา',
    icon: HelpCircle,
    solid: 'bg-blue-600 text-white',
    subtle: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  SICK: {
    defaultLabel: 'ป่วย',
    icon: HelpCircle,
    solid: 'bg-indigo-600 text-white',
    subtle: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  ATTENDED: {
    defaultLabel: 'เข้าร่วมแล้ว',
    icon: UserCheck,
    solid: 'bg-emerald-600 text-white',
    subtle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  REGISTERED: {
    defaultLabel: 'ลงทะเบียนแล้ว',
    icon: Clock,
    solid: 'bg-sky-600 text-white',
    subtle: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  ELIGIBLE: {
    defaultLabel: 'มีสิทธิ์สอบ',
    icon: CheckCircle2,
    solid: 'bg-emerald-600 text-white',
    subtle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  WARNING: {
    defaultLabel: 'เฝ้าระวัง/เสี่ยงหมดสิทธิ์',
    icon: AlertTriangle,
    solid: 'bg-amber-500 text-white',
    subtle: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  INELIGIBLE: {
    defaultLabel: 'หมดสิทธิ์สอบ',
    icon: ShieldAlert,
    solid: 'bg-rose-600 text-white',
    subtle: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  ACTIVE: {
    defaultLabel: 'เปิดใช้งาน',
    icon: CheckCircle2,
    solid: 'bg-emerald-600 text-white',
    subtle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  SUSPENDED: {
    defaultLabel: 'ระงับการใช้งาน',
    icon: XCircle,
    solid: 'bg-slate-700 text-white',
    subtle: 'bg-slate-100 text-slate-700 border-slate-300',
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  defaultLabel: 'ไม่ระบุ',
  icon: HelpCircle,
  solid: 'bg-slate-600 text-white',
  subtle: 'bg-slate-50 text-slate-700 border-slate-200',
};

const SIZE_CLASSES = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-1',
  sm: 'px-2 py-0.5 text-xs gap-1.5',
  md: 'px-2.5 py-1 text-xs gap-1.5 font-bold',
};

export function getStatusBadgeConfig(status: string): StatusConfig {
  const normKey = String(status || '').toUpperCase().trim();
  return STATUS_CONFIGS[normKey] || DEFAULT_CONFIG;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
  variant = 'subtle',
  showIcon = true,
  className = '',
}) => {
  const config = getStatusBadgeConfig(status);
  const Icon = config.icon;
  const displayText = label || config.defaultLabel;

  const colorClass =
    variant === 'solid'
      ? `${config.solid} shadow-xs`
      : `${config.subtle} border`;

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  return (
    <span
      className={`inline-flex items-center rounded-lg font-bold transition whitespace-nowrap ${colorClass} ${sizeClass} ${className}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{displayText}</span>
    </span>
  );
};
