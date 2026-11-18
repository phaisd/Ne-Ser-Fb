'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
  GraduationCap,
  MessageSquare,
  Check,
} from 'lucide-react';
import type { SatipatthanaChecklist } from '@/types/event';

export interface EditableInterviewRow {
  regId: string;
  studentCode: string;
  groupSpecificCode?: string;
  studentName: string;
  age?: number | string;
  vasa?: string | number;
  groupNumber?: number;
  major?: string;
  yearLevel?: number;
  programType?: string;
  checklist: SatipatthanaChecklist;
  result: 'PASS' | 'NOT_PASS' | 'PENDING';
  remarks: string;
}

interface VipassanaInterviewCardViewProps {
  rows: EditableInterviewRow[];
  isEnglishProgram: boolean;
  onToggleCheck: (regId: string, field: keyof SatipatthanaChecklist) => void;
  onSetResult: (regId: string, result: 'PASS' | 'NOT_PASS' | 'PENDING') => void;
  onUpdateRemarks: (regId: string, remarks: string) => void;
  onQuickPassKaya: (regId: string) => void;
}

interface SatipatthanaCategory {
  titleTh: string;
  titleEn: string;
  badgeBg: string;
  badgeText: string;
  items: Array<{
    key: keyof SatipatthanaChecklist;
    labelTh: string;
    labelEn: string;
  }>;
}

const CATEGORIES: SatipatthanaCategory[] = [
  {
    titleTh: '๑. กายานุปัสสนา (อิริยาบถหลัก)',
    titleEn: '1. Kayanupassana (Main)',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900 border-amber-300',
    items: [
      { key: 'standing', labelTh: 'ขณะยืน', labelEn: 'Standing' },
      { key: 'walking', labelTh: 'ขณะเดิน', labelEn: 'Walking' },
      { key: 'sitting', labelTh: 'ขณะนั่ง', labelEn: 'Sitting' },
      { key: 'lying', labelTh: 'ขณะนอน', labelEn: 'Lying' },
    ],
  },
  {
    titleTh: 'กายานุปัสสนา (อิริยาบถย่อย)',
    titleEn: 'Kayanupassana (Sub-activities)',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800 border-amber-200',
    items: [
      { key: 'bathing', labelTh: 'สรงน้ำ/อาบน้ำ', labelEn: 'Bath' },
      { key: 'dressing', labelTh: 'นุ่งห่ม', labelEn: 'Dress' },
      { key: 'eating', labelTh: 'ฉัน/รับประทาน', labelEn: 'Eat' },
      { key: 'toileting', labelTh: 'ขับถ่าย', labelEn: 'Toilet' },
      { key: 'others', labelTh: 'อื่นๆ', labelEn: 'Others' },
    ],
  },
  {
    titleTh: '๒. เวทนานุปัสสนา (ขณะยืน/นั่ง)',
    titleEn: '2. Vedananupassana',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900 border-blue-300',
    items: [
      { key: 'sukha', labelTh: 'สุข', labelEn: 'Happy' },
      { key: 'dukkha', labelTh: 'ทุกข์', labelEn: 'Suffer' },
      { key: 'upekkha', labelTh: 'เฉยๆ', labelEn: 'Neutral' },
    ],
  },
  {
    titleTh: '๓. จิตตานุปัสสนา (ขณะปฏิบัติ)',
    titleEn: '3. Cittanupassana',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900 border-purple-300',
    items: [
      { key: 'raga', labelTh: 'ราคะ', labelEn: 'Greed' },
      { key: 'dosa', labelTh: 'โทสะ', labelEn: 'Hatred' },
      { key: 'moha', labelTh: 'โมหะ', labelEn: 'Delusion' },
    ],
  },
  {
    titleTh: '๔. ธัมมานุปัสสนา (ขณะปฏิบัติเกิด)',
    titleEn: '4. Dhammanupassana',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900 border-rose-300',
    items: [
      { key: 'nivarana5', labelTh: 'นิวรณ์ 5', labelEn: '5 Hindrances' },
      { key: 'ayatana6', labelTh: 'อายตนะ 6', labelEn: '6 Ayatanas' },
    ],
  },
];

export const VipassanaInterviewCardView: React.FC<VipassanaInterviewCardViewProps> = ({
  rows,
  isEnglishProgram,
  onToggleCheck,
  onSetResult,
  onUpdateRemarks,
  onQuickPassKaya,
}) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpand = (regId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [regId]: !prev[regId],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    rows.forEach((r) => {
      all[r.regId] = true;
    });
    setExpandedCards(all);
  };

  const collapseAll = () => {
    setExpandedCards({});
  };

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
        ไม่พบรายชื่อนิสิตในเงื่อนไขการค้นหา
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6">
      {/* Top Mobile Controls for Cards */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-600">
        <span className="font-bold">
          แสดงแบบการ์ดประเมิน ({rows.length} รูป/คน)
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 cursor-pointer"
          >
            กางทั้งหมด
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 cursor-pointer"
          >
            ย่อทั้งหมด
          </button>
        </div>
      </div>

      {/* Practitioner Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {rows.map((row, idx) => {
          // Default to expanded for first 3 cards, or respect user toggle
          const isExpanded = expandedCards[row.regId] ?? (idx < 3);

          return (
            <div
              key={row.regId}
              className={`rounded-2xl border transition-all duration-200 bg-white shadow-xs overflow-hidden ${
                row.result === 'PASS'
                  ? 'border-emerald-300 ring-1 ring-emerald-400/30'
                  : row.result === 'NOT_PASS'
                  ? 'border-rose-300 ring-1 ring-rose-400/30'
                  : 'border-slate-200 hover:border-amber-300'
              }`}
            >
              {/* Card Header */}
              <div className="p-3.5 sm:p-4 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Group Badge */}
                    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                      กลุ่ม {row.groupNumber || '-'}
                    </span>
                    {/* Specific Code */}
                    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {row.groupSpecificCode || row.studentCode}
                    </span>
                    {row.vasa && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-800 border border-purple-200">
                        พรรษา {row.vasa}
                      </span>
                    )}
                    {row.yearLevel && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                        ปี {row.yearLevel}
                      </span>
                    )}
                  </div>

                  {/* Accordion Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(row.regId)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    aria-label="ย่อ/ขยายการ์ด"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Name */}
                <div className="mt-1.5">
                  <h4 className="font-black text-slate-900 text-sm sm:text-base leading-snug">
                    {row.studentName}
                  </h4>
                  {row.groupSpecificCode && row.studentCode && (
                    <p className="font-mono text-[10px] text-slate-400">
                      รหัสนิสิต: {row.studentCode}
                    </p>
                  )}
                </div>

                {/* 1-Tap Big Evaluation Decision Buttons (Optimized for Mobile Thumbs) */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => onSetResult(row.regId, 'PASS')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-h-[44px] ${
                      row.result === 'PASS'
                        ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-500'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✓ ผ่านการสอบอารมณ์</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSetResult(row.regId, 'NOT_PASS')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-h-[44px] ${
                      row.result === 'NOT_PASS'
                        ? 'bg-rose-600 text-white shadow-rose-600/30 ring-2 ring-rose-500'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>✗ ยังไม่ผ่าน</span>
                  </button>
                </div>
              </div>

              {/* Expandable Satipatthana 4 Checkpoints */}
              {isExpanded && (
                <div className="p-3.5 sm:p-4 space-y-3.5 bg-white">
                  {/* Quick Action: Pass all main Kaya */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-[11px] font-bold text-slate-700">
                      รายการกำหนดสภาวธรรมสติปัฏฐาน 4:
                    </span>
                    <button
                      type="button"
                      onClick={() => onQuickPassKaya(row.regId)}
                      className="text-[10.5px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>ผ่านอิริยาบถหลักทั้งหมด</span>
                    </button>
                  </div>

                  {/* Categories */}
                  <div className="space-y-2.5">
                    {CATEGORIES.map((cat, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-slate-800">
                            {isEnglishProgram ? cat.titleEn : cat.titleTh}
                          </span>
                        </div>

                        {/* Checkpoint Pills */}
                        <div className="flex flex-wrap gap-1.5">
                          {cat.items.map((item) => {
                            const val = row.checklist[item.key];
                            const isPass = val === true;
                            const isFail = val === false;

                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => onToggleCheck(row.regId, item.key)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition select-none cursor-pointer border min-h-[36px] ${
                                  isPass
                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                    : isFail
                                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                                }`}
                                title="คลิกเพื่อสลับ: ผ่าน (/) -> ไม่ผ่าน (X) -> ว่าง"
                              >
                                <span className="font-bold">
                                  {isPass ? '✓' : isFail ? '✗' : '○'}
                                </span>
                                <span>{isEnglishProgram ? item.labelEn : item.labelTh}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Remarks Input */}
                  <div className="pt-1">
                    <label className="text-[10.5px] font-bold text-slate-500 block mb-1">
                      หมายเหตุ / คำแนะนำจากพระวิปัสสนาจารย์:
                    </label>
                    <div className="relative">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={row.remarks || ''}
                        onChange={(e) => onUpdateRemarks(row.regId, e.target.value)}
                        placeholder="ข้อแนะนำหรือบันทึกผลการปฏิบัติ..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
