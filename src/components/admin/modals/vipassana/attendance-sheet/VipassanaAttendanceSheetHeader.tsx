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
    <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-amber-50/80 via-white to-purple-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 print:hidden">
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-600 text-white shadow-xs flex items-center gap-1">
            <span>🧘</span>
            <span>Vipassana 4-Period Attendance</span>
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {activeProgram === 'ENGLISH' ? 'English Program' : 'ภาคภาษาไทย (บรรพชิต/คฤหัสถ์)'}
          </span>
        </div>
        <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight">
          แบบฟอร์มบันทึกเวลาปฏิบัติวิปัสสนากัมมัฏฐาน 4 รอบ & พิมพ์เอกสารทางการ
        </h3>
        <p className="text-xs text-slate-600 line-clamp-1">
          {event.title} • {event.location || 'อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย จ.นครปฐม'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
        {/* View Switcher: Interactive vs Print */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              if (viewMode === 'INTERACTIVE') {
                setIsEditingPeriods((v) => !v);
              } else {
                setViewMode('INTERACTIVE');
              }
            }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'INTERACTIVE'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="คลิกเพื่อสลับโหมด หรือคลิกเพื่อเปิด/ปิดแผงแก้ไขช่วงเวลา 4 รอบ"
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
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'PRINT_PREVIEW'
                ? 'bg-white text-purple-900 shadow-xs ring-2 ring-purple-600/30 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title={viewMode === 'PRINT_PREVIEW' ? 'คลิกเพื่อเปิดหน้าต่างสั่งพิมพ์ A4 ทันที' : 'เปิดดูแบบฟอร์มกระดาษ A4 สำหรับพิมพ์'}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{viewMode === 'PRINT_PREVIEW' ? '🖨️ สั่งพิมพ์ A4 (คลิกพิมพ์)' : 'แบบฟอร์ม A4 พิมพ์'}</span>
          </button>
        </div>

        {/* Prominent Header 4-Periods Edit Button */}
        <button
          type="button"
          onClick={() => {
            setViewMode('INTERACTIVE');
            setIsEditingPeriods((v) => !v);
          }}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
            isEditingPeriods
              ? 'bg-purple-700 text-white border-purple-700'
              : 'border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900'
          }`}
          title="คลิกเพื่อแก้ไขช่วงเวลาทั้ง 4 รอบ (เช้ามืด, เช้า, บ่าย, ค่ำ)"
        >
          <Clock className="w-3.5 h-3.5 text-purple-600" />
          <span>{isEditingPeriods ? '✖ ปิดกล่องแก้ไข' : '⚙️ แก้ไขช่วงเวลา 4 รอบ'}</span>
        </button>

        {/* Action Shortcuts */}
        <button
          type="button"
          onClick={onOpenLiveScanner}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="เปิดจุดสแกนเช็คชื่ออัตโนมัติ (กล้องมือถือ/ปืนสแกนบาร์โค้ด)"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>📷 จุดสแกนสด</span>
        </button>

        <button
          type="button"
          onClick={onOpenBadgesModal}
          className="px-3.5 py-1.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="พิมพ์ป้ายชื่อคล้องคอพร้อม QR Code สำหรับนิสิต"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>🪪 พิมพ์ป้ายคล้องคอ</span>
        </button>

        <button
          type="button"
          onClick={onOpenInterviewModal}
          className="px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="เปิดแบบสอบอารมณ์สติปัฏฐาน 4 สำหรับพระวิปัสสนาจารย์ (กาย เวทนา จิต ธรรม)"
        >
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span>🧘 สอบอารมณ์สติปัฏฐาน 4</span>
        </button>

        <button
          type="button"
          onClick={onOpenCombinedEvalModal}
          className="px-3.5 py-1.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="เปิดระบบประมวลผลผ่านโครงการ 2 มิติ (เวลาเรียน + ผลสอบอารมณ์) และออกวุฒิบัตร"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>🏅 ประมวลผล & วุฒิบัตร</span>
        </button>

        <button
          type="button"
          onClick={onOpenGroupAssignmentModal}
          className="px-3.5 py-1.5 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="มอบหมายอาจารย์และเจ้าหน้าที่ผู้ช่วยประจำกลุ่ม และพระวิปัสสนาจารย์ประจำกลุ่ม (หลายคน/รูป)"
        >
          <Users className="w-3.5 h-3.5 text-indigo-700" />
          <span>👥 มอบหมายกลุ่ม</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
