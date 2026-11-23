'use client';

import React from 'react';
import type { EventRegistration } from '@/types/event';
import type { BadgeThemeStyles, BadgeFontScale } from './types';

interface VipassanaBadgeCardVerticalProps {
  reg: EventRegistration;
  overallIdx: number;
  printCardHeight: string;
  watermarkMode: string;
  activeWatermark: string;
  watermarkOpacity: number;
  systemLogoUrl: string;
  isEnglish: boolean;
  eventYearTh: string;
  eventAcademicYear?: string;
  themeConfig: BadgeThemeStyles;
  fontScale: BadgeFontScale;
  qrDimension: number;
  qrCodeUrl?: string;
  showScanPass: boolean;
  showStudentName?: boolean;
  footerLocationText?: string;
}

export const VipassanaBadgeCardVertical: React.FC<VipassanaBadgeCardVerticalProps> = ({
  reg,
  overallIdx,
  printCardHeight,
  watermarkMode,
  activeWatermark,
  watermarkOpacity,
  systemLogoUrl,
  isEnglish,
  eventYearTh,
  eventAcademicYear,
  themeConfig,
  fontScale,
  qrDimension,
  qrCodeUrl,
  showScanPass,
  showStudentName = true,
  footerLocationText,
}) => {
  const gNum = reg.groupNumber || (reg.groupName ? parseInt(reg.groupName.replace(/\D/g, ''), 10) : undefined);
  const cardFontClass = isEnglish ? 'badge-font-en' : 'badge-font-th';

  // Strip prefix "สาขาวิชา" or "สาขา" so only the major name is shown
  const cleanedMajor = React.useMemo(() => {
    if (!reg.major) return isEnglish ? 'Buddhist Studies' : 'พระพุทธศาสนา';
    const stripped = reg.major.replace(/^(?:สาขาวิชา|สาขา)\s*:?\s*/gi, '').trim();
    return stripped || (isEnglish ? 'Buddhist Studies' : 'พระพุทธศาสนา');
  }, [reg.major, isEnglish]);

  return (
    <div
      className={`${cardFontClass} border-2 border-dashed border-slate-300 rounded-2xl bg-white p-2.5 sm:p-3 print:p-2 print:border-slate-300 print:rounded-2xl flex flex-col justify-between shadow-2xs hover:border-purple-400 transition print:break-inside-avoid print:page-break-inside-avoid relative overflow-hidden ${printCardHeight}`}
    >
      {/* Background Watermark Layer */}
      {watermarkMode !== 'NONE' && activeWatermark && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
          style={{ opacity: watermarkOpacity }}
        >
          <img
            src={activeWatermark}
            alt="Watermark"
            className="object-contain max-w-[70%] max-h-[70%] filter grayscale contrast-125"
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* 1. Top: Official 3-Line Header with Emblem */}
      <div className={`border-b ${themeConfig.headerBorder} pb-1 shrink-0 relative z-10`}>
        <div className="flex items-center gap-1.5">
          {systemLogoUrl ? (
            <img
              src={systemLogoUrl}
              alt="MCU Logo"
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 rounded-xs"
              crossOrigin="anonymous"
            />
          ) : (
            <span className="text-sm">☸️</span>
          )}
          <div className="min-w-0 flex-1 text-left leading-[1.18]">
            <div className={`${fontScale.headerOrg} font-extrabold ${themeConfig.headerOrg} uppercase tracking-wide break-words`}>
              {isEnglish ? 'Faculty of Buddhism • MCU' : 'คณะพุทธศาสตร์ มจร'}
            </div>
            {/* English institution name shrunk to fit on a single line */}
            <div
              className={`${
                isEnglish
                  ? 'text-[6.2px] sm:text-[6.8px] tracking-tight whitespace-nowrap overflow-hidden text-ellipsis leading-none'
                  : fontScale.headerUniv
              } font-bold ${themeConfig.headerUniv} ${isEnglish ? '' : 'break-words leading-tight'}`}
              title={isEnglish ? 'Mahachulalongkornrajavidyalaya University' : 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}
            >
              {isEnglish ? 'Mahachulalongkornrajavidyalaya University' : 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}
            </div>
            <div className={`${fontScale.headerProject} font-black ${themeConfig.headerProject} break-words leading-tight line-clamp-2 pt-0.5`}>
              {isEnglish ? `Annual Vipassana Practice ${eventAcademicYear || '2026'}` : `โครงการปฏิบัติวิปัสสนากัมมัฏฐาน ปี ${eventYearTh}`}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Subheader: Group Pill + Degree Level & Major (Prefix "สาขาวิชา" removed) */}
      <div className="flex items-center gap-1.5 pt-1 pb-0.5 shrink-0 relative z-10 flex-wrap">
        <span className={`rounded-full ${fontScale.groupPill} font-black border shrink-0 ${themeConfig.groupPill}`}>
          กลุ่ม {gNum || '-'}
        </span>
        <div className="min-w-0 text-left leading-tight flex-1">
          <div className={`${fontScale.degree} font-extrabold ${themeConfig.degreeText} break-words`}>
            {reg.degreeLevel || (isEnglish ? "Bachelor's Degree" : "ปริญญาตรี")}
          </div>
          <div className={`${fontScale.major} font-semibold ${themeConfig.majorText} break-words line-clamp-2`} title={cleanedMajor}>
            {cleanedMajor}
          </div>
        </div>
      </div>

      {/* 3. Participant: Group Code + Optional Student Name */}
      <div
        className={`flex items-baseline gap-1.5 px-0.5 py-0.5 shrink-0 min-w-0 relative z-10 flex-wrap ${
          !showStudentName ? 'justify-center' : ''
        }`}
      >
        <span className={`font-mono font-black ${fontScale.code} ${themeConfig.participantCode} shrink-0`}>
          {reg.groupSpecificCode || reg.studentCode}
        </span>
        {showStudentName && (
          <span
            className={`font-extrabold ${fontScale.name} ${themeConfig.participantName} leading-snug break-words line-clamp-2 flex-1 min-w-[120px]`}
            title={reg.studentName}
          >
            {reg.studentName}
          </span>
        )}
      </div>

      {/* 4. Center: High-Contrast Large QR Code */}
      <div className="flex flex-col items-center justify-center my-auto py-1 relative z-10">
        {qrCodeUrl ? (
          <div className={`p-1 bg-white rounded-xl border ${themeConfig.qrBorder} shadow-2xs transition-all duration-200`}>
            <img
              src={qrCodeUrl}
              alt={`QR ${reg.studentCode}`}
              className="object-contain block bg-white"
              style={{
                width: `${qrDimension}px`,
                height: `${qrDimension}px`,
              }}
            />
          </div>
        ) : (
          <div
            className="bg-slate-100 rounded-md animate-pulse"
            style={{
              width: `${qrDimension}px`,
              height: `${qrDimension}px`,
            }}
          />
        )}
        {showScanPass && (
          <span className="text-[7px] sm:text-[7.5px] font-mono font-bold text-slate-400 tracking-widest mt-0.5">
            SCAN PASS
          </span>
        )}
      </div>

      {/* 5. Bottom: Footer with Practice Location & Light-Gray Watermark Serial # */}
      <div className={`border-t ${themeConfig.footerBorder} pt-0.5 text-[8px] sm:text-[8.5px] flex items-center justify-between gap-1.5 shrink-0 relative z-10`}>
        <span className={`font-bold ${themeConfig.footerLabel} truncate flex-1`} title={footerLocationText}>
          {footerLocationText || (isEnglish ? 'Practice Venue' : 'สถานที่ปฏิบัติ')}
        </span>
        <span className="font-mono font-normal text-slate-300/75 select-none shrink-0">
          #{String(overallIdx + 1).padStart(3, '0')}
        </span>
      </div>
    </div>
  );
};
