'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Landmark,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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
  // Mobile accordion state for qualification cards
  const [expandedQualMap, setExpandedQualMap] = useState<Record<string, boolean>>(() => {
    // Default: first card open on mobile for preview, or all accessible
    if (enabledQualifications.length > 0) {
      return { [enabledQualifications[0].id]: true };
    }
    return {};
  });
  const [isDocsExpanded, setIsDocsExpanded] = useState<boolean>(false);
  const [isFeesExpanded, setIsFeesExpanded] = useState<boolean>(false);

  const toggleQualCard = (id: string) => {
    setExpandedQualMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    enabledQualifications.forEach((q) => {
      all[q.id] = true;
    });
    setExpandedQualMap(all);
    setIsDocsExpanded(true);
    setIsFeesExpanded(true);
  };

  const collapseAll = () => {
    setExpandedQualMap({});
    setIsDocsExpanded(false);
    setIsFeesExpanded(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-8 space-y-6">
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-extrabold shadow-md transition cursor-pointer self-start sm:self-auto"
          >
            <FileText className="w-4 h-4" />
            <span>ดำเนินการยื่นใบสมัครออนไลน์ทันที</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Qualification Cards Section */}
      {enabledQualifications.length > 0 && (
        <div className="space-y-3">
          {/* Mobile Master Action: Expand All / Collapse All */}
          <div className="flex items-center justify-between text-xs sm:hidden px-1 text-slate-600">
            <span className="font-bold text-slate-800">แตะหัวข้อเพื่อคลี่/ยุบรายละเอียด:</span>
            <div className="flex items-center gap-1.5 font-bold">
              <button
                type="button"
                onClick={expandAll}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer text-[11px]"
              >
                คลี่ทั้งหมด
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer text-[11px]"
              >
                ยุบทั้งหมด
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
            {enabledQualifications.map((card) => {
              const style = QUAL_THEME_CLASSES[card.themeColor] || QUAL_THEME_CLASSES.orange;
              const isExpanded = !!expandedQualMap[card.id];

              return (
                <div
                  key={card.id}
                  className={`rounded-2xl border p-4 sm:p-5 space-y-3 transition-all ${style.card} shadow-2xs`}
                >
                  {/* Card Header (Tap to toggle on mobile) */}
                  <div
                    onClick={() => toggleQualCard(card.id)}
                    className="flex items-center justify-between cursor-pointer select-none gap-2"
                  >
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold ${style.badge}`}
                    >
                      <span>{card.badgeText}</span>
                    </div>

                    {/* Mobile Chevron Toggle Button */}
                    <button
                      type="button"
                      aria-label={isExpanded ? 'ยุบเก็บ' : 'คลี่ขยาย'}
                      className="md:hidden p-1.5 rounded-full hover:bg-black/5 text-slate-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <span className="text-[11px] font-bold text-slate-500">
                        {isExpanded ? 'ย่อ' : 'ดู'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-800 stroke-[2.5]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-800 stroke-[2.5]" />
                      )}
                    </button>
                  </div>

                  {/* Bullet Points Container (Collapsible on mobile, always visible on desktop) */}
                  <div className={`${isExpanded ? 'block' : 'hidden md:block'} space-y-2 pt-1`}>
                    <ul className="space-y-2 text-xs text-slate-700 leading-relaxed list-disc pl-4">
                      {card.items.map((item, itemIdx) => (
                        <li key={itemIdx}>{item}</li>
                      ))}
                    </ul>

                    {/* Bottom-right collapse button on mobile when expanded (matches user's red marks) */}
                    <div className="flex md:hidden justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => toggleQualCard(card.id)}
                        className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1 px-2.5 rounded-lg bg-black/5 cursor-pointer shadow-2xs"
                      >
                        <span>ยุบย่อ</span>
                        <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Required Documents Section (Collapsible on mobile) */}
      {enabledRequiredDocs.length > 0 && (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-5 space-y-3 shadow-2xs">
          <div
            onClick={() => setIsDocsExpanded((prev) => !prev)}
            className="flex items-center justify-between cursor-pointer select-none gap-2"
          >
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {portalConfig.requiredDocsTitle ||
                  'เอกสารหลักฐานที่ต้องเตรียม (แนบไฟล์ออนไลน์หรือยื่นวันสัมภาษณ์)'}
              </span>
            </h3>

            {/* Mobile Chevron Toggle */}
            <button
              type="button"
              className="md:hidden p-1 rounded-full text-slate-700 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1"
            >
              <span className="text-[11px] font-bold text-slate-500">
                {isDocsExpanded ? 'ย่อ' : 'ดู'}
              </span>
              {isDocsExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-800 stroke-[2.5]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-800 stroke-[2.5]" />
              )}
            </button>
          </div>

          <div className={`${isDocsExpanded ? 'block' : 'hidden md:block'} pt-1 space-y-3`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              {enabledRequiredDocs.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex items-start gap-2.5 shadow-2xs"
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

            {/* Bottom-right collapse button on mobile */}
            <div className="flex md:hidden justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsDocsExpanded(false)}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1 px-2.5 rounded-lg bg-slate-200/70 cursor-pointer shadow-2xs"
              >
                <span>ยุบย่อ</span>
                <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Fees Section (Collapsible on mobile) */}
      {portalConfig.showApplicationFee !== false &&
        Array.isArray(portalConfig.applicationFees) &&
        portalConfig.applicationFees.some((f) => f.enabled) && (
          <div className="rounded-2xl bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-white border border-amber-200/90 p-4 sm:p-6 space-y-4 shadow-2xs">
            <div
              onClick={() => setIsFeesExpanded((prev) => !prev)}
              className="flex items-center justify-between cursor-pointer select-none gap-2 border-b border-amber-200/60 pb-3"
            >
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
                  <span>
                    {portalConfig.applicationFeeTitle ||
                      'อัตราค่าธรรมเนียมการสมัครเข้าศึกษา (Application Fees)'}
                  </span>
                </h3>
                {portalConfig.applicationFeeSubtitle && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    {portalConfig.applicationFeeSubtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 shrink-0 border border-amber-300">
                  💰 ค่าธรรมเนียมตามหลักสูตร
                </span>
                <button
                  type="button"
                  className="md:hidden p-1 rounded-full text-amber-800 hover:bg-amber-100 transition cursor-pointer flex items-center gap-1"
                >
                  <span className="text-[11px] font-bold text-amber-800">
                    {isFeesExpanded ? 'ย่อ' : 'ดู'}
                  </span>
                  {isFeesExpanded ? (
                    <ChevronUp className="w-4 h-4 text-amber-900 stroke-[2.5]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-amber-900 stroke-[2.5]" />
                  )}
                </button>
              </div>
            </div>

            <div className={`${isFeesExpanded ? 'block' : 'hidden md:block'} space-y-4`}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                {portalConfig.applicationFees
                  .filter((f) => f.enabled)
                  .map((fee) => (
                    <div
                      key={fee.id}
                      className="bg-white p-3 sm:p-4 rounded-xl border border-amber-200/80 flex flex-col justify-between space-y-2 shadow-2xs"
                    >
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          {fee.degreeLevel}
                        </div>
                        {fee.note && (
                          <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {fee.note}
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">ค่าสมัคร:</span>
                        <span className="font-mono font-black text-amber-800 text-base">
                          {fee.amount > 0 ? (
                            <>
                              {fee.amount.toLocaleString()}{' '}
                              <span className="text-xs font-normal text-slate-600">
                                {fee.currency || 'บาท'}
                              </span>
                            </>
                          ) : (
                            <span className="text-emerald-700 text-xs font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ฟรี / ได้รับทุน
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {portalConfig.applicationFeeBankInfo && (
                <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2.5">
                  <Landmark className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">ช่องทางชำระค่าธรรมเนียม:</span>
                    <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                      {portalConfig.applicationFeeBankInfo}
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom-right collapse button on mobile */}
              <div className="flex md:hidden justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsFeesExpanded(false)}
                  className="text-[11px] font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1 py-1 px-2.5 rounded-lg bg-amber-100 cursor-pointer shadow-2xs"
                >
                  <span>ยุบย่อ</span>
                  <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
