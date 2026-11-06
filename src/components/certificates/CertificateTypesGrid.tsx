'use client';

import React from 'react';
import {
  GraduationCap,
  Home,
  Award,
  Landmark,
  Smartphone,
  Globe,
  PlaneTakeoff,
  FileCheck,
  MapPin,
  BookOpen,
  UserCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { CertTypeItem } from './types';

interface CertificateTypesGridProps {
  settings: any;
  certTypes: CertTypeItem[];
  visibleCards: CertTypeItem[];
  cardAudienceFilter: 'THAI' | 'INTERNATIONAL' | 'STAFF' | 'CANDIDATE' | 'ALL';
  setCardAudienceFilter: (val: 'THAI' | 'INTERNATIONAL' | 'STAFF' | 'CANDIDATE' | 'ALL') => void;
  isStaffUser: boolean;
  selectedCert: CertTypeItem | null;
  onCardSelect: (card: CertTypeItem) => void;
}

export const renderCertIcon = (iconName?: string, target?: string) => {
  const iconClass =
    target === 'STAFF'
      ? 'w-6 h-6 text-amber-600'
      : target === 'CANDIDATE'
      ? 'w-6 h-6 text-emerald-600'
      : target === 'THAI'
      ? 'w-6 h-6 text-blue-600'
      : 'w-6 h-6 text-purple-600';

  switch (iconName) {
    case 'GraduationCap':
      return <GraduationCap className={iconClass} />;
    case 'Home':
      return <Home className={iconClass} />;
    case 'Award':
      return <Award className={iconClass} />;
    case 'Landmark':
      return <Landmark className={iconClass} />;
    case 'Smartphone':
      return <Smartphone className={iconClass} />;
    case 'Globe':
      return <Globe className={iconClass} />;
    case 'PlaneTakeoff':
      return <PlaneTakeoff className={iconClass} />;
    case 'FileCheck':
      return <FileCheck className={iconClass} />;
    case 'MapPin':
      return <MapPin className={iconClass} />;
    case 'BookOpen':
      return <BookOpen className={iconClass} />;
    case 'UserCheck':
      return <UserCheck className={iconClass} />;
    default:
      return <FileText className={iconClass} />;
  }
};

export const CertificateTypesGrid: React.FC<CertificateTypesGridProps> = ({
  settings,
  certTypes,
  visibleCards,
  cardAudienceFilter,
  setCardAudienceFilter,
  isStaffUser,
  selectedCert,
  onCardSelect,
}) => {
  return (
    <>
      {/* Important Notices for Students */}
      {(settings?.visaAlertEnabled !== false || settings?.timelineAlertEnabled !== false || settings?.accuracyAlertEnabled !== false) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* กล่องที่ 1: แจ้งเตือนสีแดง (สำหรับการต่อวีซ่า 30 วัน) */}
          {settings?.visaAlertEnabled !== false && (
            <div className="p-4 sm:p-5 rounded-2xl bg-red-50/90 border-2 border-red-400 text-red-950 shadow-sm flex items-start gap-3.5 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-600/30 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-200/90 text-red-900 font-extrabold text-[10px] uppercase tracking-wider">
                  ⚠️ แจ้งเตือนสำคัญ (Visa Alert)
                </span>
                <p className="font-bold text-sm text-red-950 leading-snug">
                  {settings?.visaAlertTitle || 'สำหรับการต่อวีซ่า ให้ดำเนินการก่อนหนังสือเดินทางหมดอายุ 30 วัน'}
                </p>
                {settings?.visaAlertDesc && (
                  <p className="text-xs text-red-800 leading-relaxed">
                    {settings.visaAlertDesc}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* กล่องที่ 2: ระยะเวลาดำเนินการ */}
          {settings?.timelineAlertEnabled !== false && (
            <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/90 border-2 border-sky-400 text-sky-950 shadow-sm flex items-start gap-3.5 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-600/30 mt-0.5">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-200/90 text-sky-900 font-extrabold text-[10px] uppercase tracking-wider">
                  ⏱️ ระยะเวลาดำเนินการ (Timeline)
                </span>
                <p className="font-bold text-sm text-sky-950 leading-snug">
                  {settings?.timelineAlertTitle || 'การดำเนินการ จะเสร็จสิ้น ประมาณ 1-2 วัน ไม่นับวันหยุด หรือ กรุณาตรวจดูเส้นทางการดำเนินการหนังสือว่า "อนุมัติ"'}
                </p>
                {settings?.timelineAlertDesc && (
                  <p className="text-xs text-sky-800 leading-relaxed">
                    {settings.timelineAlertDesc}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* กล่องที่ 3: ความถูกต้องครบถ้วนของข้อมูล */}
          {settings?.accuracyAlertEnabled !== false && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border-2 border-amber-400 text-amber-950 shadow-sm flex items-start gap-3.5 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30 mt-0.5">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-200/90 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider">
                  📋 ความถูกต้องของข้อมูล (Accuracy)
                </span>
                <p className="font-bold text-sm text-amber-950 leading-snug">
                  {settings?.accuracyAlertTitle || 'กรุณากรอกข้อมูลให้ครบถ้วน มิฉะนั้นเอกสารจะไม่สมบูรณ์และจะยกเลิกการขอหนังสือ'}
                </p>
                {settings?.accuracyAlertDesc && (
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {settings.accuracyAlertDesc}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section A: Card Selector */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-black">
                1
              </span>
              เลือกประเภทหนังสือรับรองที่ต้องการ (คลิกที่การ์ด)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              กรุณาตรวจสอบว่าหนังสือสำหรับคนไทยหรือสำหรับนิสิตต่างชาติ เพื่อให้ออกเอกสารถูกต้องตามระเบียบ
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setCardAudienceFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                cardAudienceFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({visibleCards.length})
            </button>
            <button
              type="button"
              onClick={() => setCardAudienceFilter('THAI')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                cardAudienceFilter === 'THAI'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <span>🇹🇭 สำหรับคนไทย</span>
            </button>
            <button
              type="button"
              onClick={() => setCardAudienceFilter('INTERNATIONAL')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                cardAudienceFilter === 'INTERNATIONAL'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              <span>🌐 นิสิตต่างชาติ</span>
            </button>

            {/* Staff Filter Button: ONLY visible if isStaffUser is TRUE */}
            {isStaffUser && (
              <button
                type="button"
                onClick={() => {
                  setCardAudienceFilter('STAFF');
                  const firstStaff = certTypes.find((c) => c.targetAudience === 'STAFF');
                  if (firstStaff) onCardSelect(firstStaff);
                }}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  cardAudienceFilter === 'STAFF'
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/20'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300'
                }`}
              >
                <span>👔 สำหรับอาจารย์และเจ้าหน้าที่</span>
              </button>
            )}

            {/* Candidate Filter Button */}
            <button
              type="button"
              onClick={() => {
                setCardAudienceFilter('CANDIDATE');
                const firstCand = certTypes.find((c) => c.targetAudience === 'CANDIDATE' || c.category === 'ADMISSION');
                if (firstCand) onCardSelect(firstCand);
              }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                cardAudienceFilter === 'CANDIDATE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span>🎓 ผู้ผ่านการคัดเลือกใหม่</span>
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleCards.map((card) => {
            const isSelected = selectedCert?.id === card.id;
            const isThai = card.targetAudience === 'THAI';
            const isStaff = card.targetAudience === 'STAFF';
            const isCandidate = card.targetAudience === 'CANDIDATE' || card.category === 'ADMISSION';

            return (
              <div
                key={card.id}
                onClick={() => onCardSelect(card)}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-left flex flex-col justify-between ${
                  isSelected
                    ? isStaff
                      ? 'border-amber-500 bg-amber-50/40 shadow-md ring-2 ring-amber-500/20'
                      : isCandidate
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
                      : isThai
                      ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20'
                      : 'border-purple-600 bg-purple-50/40 shadow-md ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-sm'
                }`}
              >
                <div>
                  {/* Card Header: Icon & Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        isStaff ? 'bg-amber-100' : isCandidate ? 'bg-emerald-100' : isThai ? 'bg-blue-100' : 'bg-purple-100'
                      }`}
                    >
                      {renderCertIcon(card.iconName, card.targetAudience)}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isStaff ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          👔 อาจารย์/บุคลากร
                        </span>
                      ) : isCandidate ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          🎓 ผู้ผ่านการคัดเลือก
                        </span>
                      ) : isThai ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                          🇹🇭 นิสิตไทย
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">
                          🌐 ต่างชาติ (Intl)
                        </span>
                      )}

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Title & Code */}
                  <h3
                    className={`font-bold text-sm leading-snug line-clamp-2 ${
                      isSelected
                        ? isStaff
                          ? 'text-amber-950 font-black'
                          : isCandidate
                          ? 'text-emerald-950 font-black'
                          : isThai
                          ? 'text-blue-900'
                          : 'text-purple-900'
                        : 'text-slate-800'
                    }`}
                  >
                    {card.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Bottom Status */}
                <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-400 font-semibold">{card.code || 'CERT'}</span>
                  <span
                    className={`font-semibold ${
                      isSelected
                        ? isStaff
                          ? 'text-amber-800'
                          : isCandidate
                          ? 'text-emerald-800'
                          : isThai
                          ? 'text-blue-700'
                          : 'text-purple-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {isSelected ? '✓ เลือกประเภทนี้แล้ว' : 'กดเพื่อเลือก'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {selectedCert && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-xs ${
              selectedCert.targetAudience === 'STAFF'
                ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-sm'
                : selectedCert.targetAudience === 'CANDIDATE' || selectedCert.category === 'ADMISSION'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm'
                : selectedCert.targetAudience === 'THAI'
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-purple-50 border-purple-200 text-purple-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="font-bold">ประเภทที่เลือกขณะนี้:</div>
              <div className="font-semibold underline text-sm">{selectedCert.name}</div>
              <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-white border border-current shadow-xs">
                {selectedCert.targetAudience === 'STAFF'
                  ? 'สำหรับอาจารย์และเจ้าหน้าที่'
                  : selectedCert.targetAudience === 'CANDIDATE' || selectedCert.category === 'ADMISSION'
                  ? 'สำหรับผู้ผ่านการคัดเลือกเข้าเรียนใหม่'
                  : selectedCert.targetAudience === 'THAI'
                  ? 'สำหรับคนไทย'
                  : 'สำหรับนิสิตต่างประเทศ'}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
