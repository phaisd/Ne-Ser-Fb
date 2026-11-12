'use client';

import React from 'react';
import { BookOpen, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  AdmissionPortalConfig,
  AdmissionQualificationCard,
  AdmissionRequiredDocItem,
} from '@/types';

const QUAL_THEME_CLASSES: Record<
  'orange' | 'sky' | 'purple' | 'emerald',
  { card: string; badge: string }
> = {
  orange: {
    card: 'bg-orange-50/70 border-orange-200',
    badge: 'bg-orange-100 text-orange-900',
  },
  sky: {
    card: 'bg-sky-50/70 border-sky-200',
    badge: 'bg-sky-100 text-sky-900',
  },
  purple: {
    card: 'bg-purple-50/70 border-purple-200',
    badge: 'bg-purple-100 text-purple-900',
  },
  emerald: {
    card: 'bg-emerald-50/70 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-900',
  },
};

const THAI_NUMERALS = ['๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙', '๑๐'];
function toThaiOrderLabel(index: number): string {
  return THAI_NUMERALS[index] || String(index + 1);
}

interface EnrollOverviewTabProps {
  portalConfig: AdmissionPortalConfig;
  academicYear: string;
  enabledQualifications: AdmissionQualificationCard[];
  enabledRequiredDocs: AdmissionRequiredDocItem[];
  onGoToApply: () => void;
}

export function EnrollOverviewTab({
  portalConfig,
  academicYear,
  enabledQualifications,
  enabledRequiredDocs,
  onGoToApply,
}: EnrollOverviewTabProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-600" />
            <span>{portalConfig.overviewTitle || 'คุณสมบัติผู้สมัครและเอกสารหลักฐานที่ต้องใช้'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {portalConfig.overviewSubtitle ||
              'การรับสมัครคัดเลือกบุคคลเข้าศึกษาในคณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}{' '}
            ประจำปีการศึกษา {academicYear}
          </p>
        </div>
        {portalConfig.showApplyTab && (
          <button
            type="button"
            onClick={onGoToApply}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-extrabold shadow-md transition cursor-pointer self-start"
          >
            <FileText className="w-4 h-4" />
            <span>ดำเนินการยื่นใบสมัครออนไลน์ทันที</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {enabledQualifications.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {enabledQualifications.map((card) => {
            const style = QUAL_THEME_CLASSES[card.themeColor] || QUAL_THEME_CLASSES.orange;
            return (
              <div key={card.id} className={`rounded-2xl border p-5 space-y-3 ${style.card}`}>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold ${style.badge}`}
                >
                  <span>{card.badgeText}</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-700 leading-relaxed list-disc pl-4">
                  {card.items.map((item, itemIdx) => (
                    <li key={itemIdx}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {enabledRequiredDocs.length > 0 && (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {portalConfig.requiredDocsTitle ||
                'เอกสารหลักฐานที่ต้องเตรียม (สามารถแนบไฟล์ออนไลน์ในขั้นตอนสมัคร หรือนำมายื่นในวันสัมภาษณ์/รายงานตัว)'}
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
            {enabledRequiredDocs.map((doc, idx) => (
              <div
                key={doc.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex items-start gap-2.5"
              >
                <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 font-black flex items-center justify-center shrink-0">
                  {toThaiOrderLabel(idx)}
                </span>
                <div>
                  <div className="font-bold text-slate-900">{doc.title}</div>
                  {doc.description && (
                    <div className="text-slate-500 mt-0.5">{doc.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
