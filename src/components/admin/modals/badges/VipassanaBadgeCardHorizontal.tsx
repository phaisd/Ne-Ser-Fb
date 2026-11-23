'use client';

import React from 'react';
import type { EventRegistration } from '@/types/event';
import type { BadgeThemeStyles, BadgeFontScale } from './types';

interface VipassanaBadgeCardHorizontalProps {
  reg: EventRegistration;
  overallIdx: number;
  printCardHeight: string;
  watermarkMode: string;
  activeWatermark: string;
  watermarkOpacity: number;
  systemLogoUrl: string;
  isEnglish: boolean;
  eventYearTh: string;
  themeConfig: BadgeThemeStyles;
  fontScale: BadgeFontScale;
  qrDimension: number;
  qrCodeUrl?: string;
  showScanPass: boolean;
  showStudentName?: boolean;
  footerLocationText?: string;
}

export const VipassanaBadgeCardHorizontal: React.FC<VipassanaBadgeCardHorizontalProps> = ({
  reg,
  overallIdx,
  printCardHeight,
  watermarkMode,
  activeWatermark,
  watermarkOpacity,
  systemLogoUrl,
  isEnglish,
  eventYearTh,
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
      className={`${cardFontClass} border-2 border-dashed border-slate-300 rounded-2xl bg-white p-2.5 sm:p-3 print:p-1.5 print:border-slate-400 print:rounded-none flex flex-col justify-between shadow-2xs hover:border-purple-400 transition print:break-inside-avoid print:page-break-inside-avoid relative overflow-hidden ${printCardHeight}`}
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

      {/* Top: Header */}
      <div className={`text-center border-b ${themeConfig.headerBorder} pb-1 shrink-0 relative z-10`}>
        <div className={`flex items-center justify-center gap-1.5 ${fontScale.headerOrg} font-extrabold uppercase tracking-wide ${themeConfig.headerOrg} leading-tight`}>
          {systemLogoUrl ? (
            <img
              src={systemLogoUrl}
              alt="MCU Logo"
              className="w-4 h-4 object-contain inline-block shrink-0 rounded-xs"
              crossOrigin="anonymous"
            />
          ) : (
            <span>☸️</span>
          )}
          <span>{isEnglish ? 'Faculty of Buddhism • MCU' : 'คณะพุทธศาสตร์ มจร'}</span>
        </div>
        <div className={`${fontScale.headerProject} font-bold ${themeConfig.headerProject} leading-tight pt-0.5 break-words line-clamp-2`}>
          {isEnglish ? 'Annual Vipassana Meditation' : `โครงการปฏิบัติวิปัสสนากัมมัฏฐาน ปี ${eventYearTh}`}
        </div>
      </div>

      {/* Middle: Left Info + Right QR */}
      <div className="py-1 flex items-center justify-between gap-2 flex-1 my-auto relative z-10">
        <div className="flex-1 space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.2 rounded-full ${fontScale.groupPill} font-black border ${themeConfig.groupPill}`}>
              กลุ่ม {gNum || '-'}
            </span>
            {reg.groupSpecificCode && (
              <span className={`font-mono font-black ${fontScale.code} px-2 py-0.2 rounded ${themeConfig.participantCode} shadow-2xs`}>
                {reg.groupSpecificCode}
              </span>
            )}
          </div>

          {showStudentName && (
            <div className={`font-extrabold ${fontScale.name} ${themeConfig.participantName} leading-snug line-clamp-2 break-words pt-0.5`}>
              {reg.studentName}
            </div>
          )}

          <div className={`font-mono font-bold ${fontScale.code} ${themeConfig.participantCode}`}>
            {reg.studentCode}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-1.5 leading-tight pt-0.5">
            <span className={`${fontScale.degree} font-extrabold ${themeConfig.degreeText}`}>
              {reg.degreeLevel || (isEnglish ? "Bachelor's Degree" : 'ปริญญาตรี')}
            </span>
            {reg.vasa && <span className="text-[8.5px] text-slate-500">({reg.vasa} พรรษา)</span>}
            {cleanedMajor && (
              <span className={`${fontScale.major} font-semibold ${themeConfig.majorText} truncate max-w-[130px]`} title={cleanedMajor}>
                {cleanedMajor}
              </span>
            )}
          </div>
        </div>

        {/* Right QR Code */}
        <div className="shrink-0 flex flex-col items-center relative z-10">
          {qrCodeUrl ? (
            <div className={`p-1 bg-white rounded-xl border ${themeConfig.qrBorder} shadow-2xs`}>
              <img
                src={qrCodeUrl}
                alt={`QR ${reg.studentCode}`}
                className="object-contain block bg-white"
                style={{
                  width: `${Math.round(qrDimension * 0.9)}px`,
                  height: `${Math.round(qrDimension * 0.9)}px`,
                }}
              />
            </div>
          ) : (
            <div
              className="bg-slate-100 rounded-md animate-pulse"
              style={{
                width: `${Math.round(qrDimension * 0.9)}px`,
                height: `${Math.round(qrDimension * 0.9)}px`,
              }}
            />
          )}
          {showScanPass && (
            <span className="text-[7px] font-mono text-slate-500 mt-0.5">
              SCAN PASS
            </span>
          )}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className={`border-t ${themeConfig.footerBorder} pt-0.5 text-[8.5px] flex items-center justify-between gap-1.5 shrink-0 relative z-10`}>
        <span className={`${themeConfig.footerLabel} truncate flex-1`} title={footerLocationText}>
          {footerLocationText || (isEnglish ? 'Practice Venue' : 'สถานที่ปฏิบัติ')}
        </span>
        <span className="font-mono font-normal text-slate-300/75 select-none shrink-0">
          #{String(overallIdx + 1).padStart(3, '0')}
        </span>
      </div>
    </div>
  );
};
