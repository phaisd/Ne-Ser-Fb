'use client';

import React from 'react';
import {
  X,
  Printer,
  Clock,
  Sparkles,
  Camera,
  Award,
  Users,
  CreditCard,
} from 'lucide-react';
import { StudentEvent } from '@/types';

interface VipassanaAttendanceSheetHeaderProps {
  event: StudentEvent;
  activeProgram: 'THAI' | 'ENGLISH';
  viewMode: 'INTERACTIVE' | 'PRINT_PREVIEW';
  setViewMode: (mode: 'INTERACTIVE' | 'PRINT_PREVIEW') => void;
  isEditingPeriods: boolean;
  setIsEditingPeriods: React.Dispatch<React.SetStateAction<boolean>>;
  onPrintA4: () => void;
  onOpenLiveScanner: () => void;
  onOpenBadgesModal: () => void;
  onOpenInterviewModal: () => void;
  onOpenCombinedEvalModal: () => void;
  onOpenGroupAssignmentModal: () => void;
  onClose: () => void;
}

export const VipassanaAttendanceSheetHeader: React.FC<VipassanaAttendanceSheetHeaderProps> = ({
  event,
  activeProgram,
  viewMode,
  setViewMode,
  isEditingPeriods,
  setIsEditingPeriods,
  onPrintA4,
  onOpenLiveScanner,
  onOpenBadgesModal,
  onOpenInterviewModal,
  onOpenCombinedEvalModal,
  onOpenGroupAssignmentModal,
  onClose,
}) => {
  return (
    <div className="border-b border-slate-200 bg-gradient-to-r from-amber-50/90 via-white to-purple-50/90 shrink-0 print:hidden">
      {/* Top Main Row */}
      <div className="px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-3">
        {/* Title Group - Protected from shrinking */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-600 text-white shadow-xs inline-flex items-center gap-1.5 whitespace-nowrap">
              <span>🧘</span>
              <span>บันทึกเวลา 4 รอบ</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80 whitespace-nowrap">
              {activeProgram === 'ENGLISH' ? '🌐 English Program' : '🇹🇭 ภาคภาษาไทย'}
            </span>
          </div>

          <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight truncate">
            บันทึกเวลาปฏิบัติธรรม 4 รอบ & พิมพ์เอกสารทางการ
          </h3>

          <p className="text-xs text-slate-500 truncate max-w-2xl hidden sm:block">
            {event.title} • {event.location || 'อาคารวิปัสสนาธุระ (อาคารสมเด็จพระพุฒาจารย์ (อาจ อาสภมหาเถร) มจร'}
          </p>
        </div>

        {/* Primary Controls & Close Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View Switcher: Interactive vs Print */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl text-xs font-bold border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'INTERACTIVE') {
                  setIsEditingPeriods((v) => !v);
                } else {
                  setViewMode('INTERACTIVE');
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === 'INTERACTIVE'
                  ? 'bg-white text-purple-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="คลิกเพื่อสลับโหมด หรือเปิด/ปิดแผงแก้ไขช่วงเวลา 4 รอบ"
            >
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>บันทึกเวลา 4 รอบ</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'PRINT_PREVIEW') {
                  onPrintA4();
                } else {
                  setViewMode('PRINT_PREVIEW');
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                viewMode === 'PRINT_PREVIEW'
                  ? 'bg-white text-purple-900 shadow-xs ring-2 ring-purple-600/30 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={viewMode === 'PRINT_PREVIEW' ? 'คลิกเพื่อสั่งพิมพ์ A4 ทันที' : 'เปิดดูแบบฟอร์มกระดาษ A4 สำหรับพิมพ์'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{viewMode === 'PRINT_PREVIEW' ? '🖨️ สั่งพิมพ์ A4' : 'แบบฟอร์ม A4'}</span>
            </button>
          </div>

          {/* Quick Scanner Shortcut */}
          <button
            type="button"
            onClick={onOpenLiveScanner}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            title="เปิดจุดสแกนเช็คชื่ออัตโนมัติ (กล้องมือถือ/ปืนสแกนบาร์โค้ด)"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">จุดสแกนสด</span>
            <span className="sm:hidden">สแกน</span>
          </button>

          {/* Close Button - Always pinned, never wrapped or pushed off */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0 ml-1"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Secondary Action Bar: Contextual Tools & Shortcuts */}
      <div className="px-4 py-2 sm:px-6 bg-slate-50/70 border-t border-slate-200/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap shrink-0 hidden sm:inline">
          เครื่องมือด่วน:
        </span>

        {/* 1. Edit Periods */}
        <button
          type="button"
          onClick={() => {
            setViewMode('INTERACTIVE');
            setIsEditingPeriods((v) => !v);
          }}
          className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0 ${
            isEditingPeriods
              ? 'bg-purple-700 text-white border-purple-700'
              : 'border-purple-300 bg-white hover:bg-purple-50 text-purple-900'
          }`}
          title="แก้ไขเวลาทั้ง 4 รอบ (เช้ามืด, เช้า, บ่าย, ค่ำ)"
        >
          <Clock className={`w-3.5 h-3.5 ${isEditingPeriods ? 'text-white' : 'text-purple-600'}`} />
          <span>{isEditingPeriods ? '✖ ปิดแก้ไขเวลา' : '⚙️ เวลา 4 รอบ'}</span>
        </button>

        {/* 2. Badges */}
        <button
          type="button"
          onClick={onOpenBadgesModal}
          className="px-2.5 py-1 rounded-lg border border-purple-200 bg-white hover:bg-purple-50 text-purple-900 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
          title="พิมพ์ป้ายชื่อคล้องคอพร้อม QR Code สำหรับนิสิต"
        >
          <CreditCard className="w-3.5 h-3.5 text-purple-600" />
          <span>ป้ายคล้องคอ</span>
        </button>

        {/* 3. Interview */}
        <button
          type="button"
          onClick={onOpenInterviewModal}
          className="px-2.5 py-1 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 text-amber-900 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
          title="เปิดแบบสอบอารมณ์สติปัฏฐาน 4 สำหรับพระวิปัสสนาจารย์ (กาย เวทนา จิต ธรรม)"
        >
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span>สอบอารมณ์</span>
        </button>

        {/* 4. Certificates */}
        <button
          type="button"
          onClick={onOpenCombinedEvalModal}
          className="px-2.5 py-1 rounded-lg border border-teal-300 bg-white hover:bg-teal-50 text-teal-900 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
          title="เปิดระบบประมวลผลผ่านโครงการ 2 มิติ (เวลาเรียน + ผลสอบอารมณ์) และออกวุฒิบัตร"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>วุฒิบัตร</span>
        </button>

        {/* 5. Group Assignment */}
        <button
          type="button"
          onClick={onOpenGroupAssignmentModal}
          className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
          title="มอบหมายอาจารย์และเจ้าหน้าที่ผู้ช่วยประจำกลุ่ม และพระวิปัสสนาจารย์ประจำกลุ่ม"
        >
          <Users className="w-3.5 h-3.5 text-indigo-700" />
          <span>มอบหมายกลุ่ม</span>
        </button>
      </div>
    </div>
  );
};
