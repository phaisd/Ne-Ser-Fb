'use client';

import React from 'react';
import Link from 'next/link';
import { Award, ArrowRight } from 'lucide-react';
import { canAccessAdminConsole } from '@/lib/auth-client';

interface NavbarVipassanaBannerProps {
  pathname: string;
  currentUser: any;
  userHasProjectDuty: boolean;
  activeVipassanaStation: {
    eventId: string;
    eventTitle: string;
    action: string;
    url: string;
  } | null;
}

export const NavbarVipassanaBanner: React.FC<NavbarVipassanaBannerProps> = ({
  pathname,
  currentUser,
  userHasProjectDuty,
  activeVipassanaStation,
}) => {
  if (
    pathname.startsWith('/admin') ||
    !currentUser ||
    !userHasProjectDuty ||
    !canAccessAdminConsole(currentUser) ||
    (!activeVipassanaStation && currentUser?.role !== 'VIPASSANA_MASTER')
  ) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-700 text-white px-3 sm:px-6 py-2.5 shadow-lg border-b border-amber-400/50 print:hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Award className="w-4 h-4 text-amber-200 shrink-0 animate-bounce" />
          <span className="font-bold truncate">
            {activeVipassanaStation?.eventTitle
              ? `ค้างงานโครงการ: ${activeVipassanaStation.eventTitle}`
              : 'ท่านกำลังอยู่ในระบบปฏิบัติธรรมวิปัสสนา'}
          </span>
        </div>
        <Link
          href={activeVipassanaStation?.url || '/admin?tab=EVENTS'}
          className="px-3 py-1.5 rounded-xl bg-white text-slate-950 hover:bg-amber-50 font-black text-xs flex items-center gap-1.5 shrink-0 shadow-md transition"
        >
          <span>
            {activeVipassanaStation?.action === 'INTERVIEW' ||
            currentUser?.role === 'VIPASSANA_MASTER'
              ? '🧘 กลับไปหน้าสอบอารมณ์ทันที'
              : '📷 กลับไปหน้าสแกนตรวจเช็คชื่อทันที'}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-orange-600" />
        </Link>
      </div>
    </div>
  );
};
