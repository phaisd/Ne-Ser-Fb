'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  GraduationCap,
  Calendar,
  UserCheck,
  FileText,
  Archive,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Info,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

interface AcademicYearWorkflowCardProps {
  onNavigateTab: (tab: 'DASHBOARD' | 'TIMETABLES' | 'COURSES' | 'ATTENDANCE' | 'USERS' | 'STUDENTS' | 'CERTIFICATES' | 'SHEETS' | 'BRANDING') => void;
  onOpenArchiveModal?: () => void;
  onOpenScanInstructors?: () => void;
  currentAcademicYear?: string;
}

export const AcademicYearWorkflowCard: React.FC<AcademicYearWorkflowCardProps> = ({
  onNavigateTab,
  onOpenArchiveModal,
  onOpenScanInstructors,
  currentAcademicYear = '2569',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]); // default mockup progress

  const toggleStep = (stepNo: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNo) ? prev.filter((s) => s !== stepNo) : [...prev, stepNo]
    );
  };

  const steps = [
    {
      step: 1,
      title: 'เลื่อนชั้นปีการศึกษานิสิต (Bulk Student Promotion)',
      badge: 'งานทะเบียนนิสิต',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description:
        'ปรับเลื่อนชั้นปีนิสิตทุกคนขึ้น 1 ระดับชั้น (ปี 1 ➔ ปี 2, ปี 2 ➔ ปี 3, ปี 4 ➔ สำเร็จการศึกษา/จบการศึกษา) เพื่อให้ข้อมูลชั้นปีในใบรับรองและการลงทะเบียนตรงกับปีการศึกษาใหม่',
      actionText: 'ไปที่หน้าเลื่อนชั้นปีนิสิต (/students)',
      actionType: 'link' as const,
      href: '/students',
      note: 'แนะนำให้ดำเนินการเป็นขั้นตอนแรกสุดก่อนการออกหนังสือรับรองหรือจัดกลุ่มเรียน',
    },
    {
      step: 2,
      title: 'นำเข้าตารางเรียนและตารางสอนปีการศึกษาใหม่ (Import Timetables)',
      badge: 'งานตารางสอน',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description:
        'อัปโหลดไฟล์ Excel ตารางสอนประจำภาคการศึกษา/ปีการศึกษาใหม่ หรือเพิ่มข้อมูลรายวิชา วัน-เวลา ห้องเรียน และระบุชื่ออาจารย์ผู้สอนให้ครบถ้วนในระบบ',
      actionText: 'ไปที่แท็บจัดการตารางสอน',
      actionType: 'tab' as const,
      tab: 'TIMETABLES' as const,
      note: 'รองรับการจัดเก็บหลายปีการศึกษาพร้อมกัน เช่น 2569, 2570 โดยข้อมูลเก่าจะไม่สูญหาย',
    },
    {
      step: 3,
      title: 'ซิงค์และตรวจสอบบัญชีอาจารย์ผู้สอน (Sync & Auto-Provision Instructors)',
      badge: 'จัดการผู้ใช้ & สิทธิ์',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      description:
        'กดปุ่ม "🔄 ซิงค์และสร้างไอดีอาจารย์จากตารางสอน" เพื่อให้ระบบตรวจสอบชื่อผู้สอนในตารางใหม่ หากพบอาจารย์ใหม่ที่ยังไม่มีไอดี ระบบจะเตรียมบัญชีผู้ใช้และรหัสผ่านเริ่มต้นให้อัตโนมัติ',
      actionText: 'ไปที่แท็บจัดการผู้ใช้งาน',
      actionType: 'tab' as const,
      tab: 'USERS' as const,
      note: 'รองรับทั้งอาจารย์ประจำ (@mcu.ac.th), อาจารย์ภายนอก (Gmail) และอาจารย์พิเศษ',
    },
    {
      step: 4,
      title: 'ออกบัตรแจ้งภาระงานสอนและรหัสผ่าน (Issue Teaching Slip)',
      badge: 'บัตรภาระงาน & LINE',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      description:
        'กดปุ่ม "📄 บัตรแจ้งภาระงาน" ในแท็บจัดการผู้ใช้ เพื่อออกเอกสารแจ้งวิชาที่สอน วัน-เวลา ห้องเรียน และรหัสผ่านเข้าสู่ระบบเช็คชื่อนิสิต โดยสามารถเลือกปีการศึกษาใหม่ได้จากแถบด้านบนบัตร',
      actionText: 'เปิดดูรายชื่ออาจารย์เพื่อออกบัตร',
      actionType: 'tab' as const,
      tab: 'USERS' as const,
      note: 'มีปุ่ม "คัดลอกส่ง LINE" สำหรับส่งแจ้งอาจารย์ทางกลุ่มไลน์ได้อย่างสะดวกรวดเร็วในคลิกเดียว',
    },
    {
      step: 5,
      title: 'จัดเก็บประวัติปีการศึกษาเดิม (Academic Archive)',
      badge: 'คลังประวัติสารบรรณ',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      description:
        'จัดทำ Snapshot สรุปยอดคำร้อง สถิติการออกหนังสือ และประวัติการเรียนของปีการศึกษาเดิม เพื่อการตรวจสอบย้อนหลัง 5 ปีตามมาตรฐานระเบียบสารบรรณสำนักนายกรัฐมนตรีและ พ.ร.บ. ข้อมูลข่าวสาร',
      actionText: 'เปิดระบบจัดเก็บประวัติปีการศึกษา',
      actionType: 'archive' as const,
      note: 'ข้อมูลปีเดิมจะถูกเก็บรักษาอย่างปลอดภัย สามารถเรียกดูหรือพิมพ์ใบรับรองย้อนหลังได้ตลอดเวลา',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-indigo-500/30 space-y-5 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/30 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>คำแนะนำขั้นตอนการทำงานเมื่อเปิดปีการศึกษาใหม่ (Recommended Workflow)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 pt-1">
            <span>คู่มือการเตรียมระบบวิชาการ & ทะเบียน ประจำปีการศึกษาใหม่</span>
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed max-w-3xl">
            แนวทางปฏิบัติมาตรฐาน 5 ขั้นตอนสำหรับผู้ดูแลระบบและเจ้าหน้าที่บริการการศึกษา เมื่อเริ่มต้นภาคการศึกษาหรือปีการศึกษาใหม่ เพื่อให้ข้อมูลเชื่อมโยงกันอย่างสมบูรณ์ ถูกต้อง และรวดเร็ว
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 transition cursor-pointer"
          >
            {isExpanded ? (
              <>
                <span>ย่อเก็บ</span>
                <ChevronDown className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>ขยายดูขั้นตอน</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Workflow Steps */}
      {isExpanded && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {steps.map((st) => {
              const isDone = completedSteps.includes(st.step);
              return (
                <div
                  key={st.step}
                  className={`rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 border ${
                    isDone
                      ? 'bg-slate-800/80 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-800/50 hover:bg-slate-800/80 border-indigo-500/20'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                          {st.step}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${st.badgeColor}`}>
                          {st.badge}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleStep(st.step)}
                        className={`text-xs p-1 rounded-md transition cursor-pointer ${
                          isDone ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={isDone ? 'คลิกเพื่อเปลี่ยนเป็นยังไม่เสร็จ' : 'คลิกเพื่อทำเครื่องหมายว่าเสร็จแล้ว'}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${isDone ? 'fill-emerald-400/20 text-emerald-400' : ''}`} />
                      </button>
                    </div>

                    <h4 className="font-bold text-sm text-white leading-snug">
                      {st.title}
                    </h4>

                    <p className="text-xs text-slate-300/90 leading-relaxed">
                      {st.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-700/60 space-y-2">
                    <div className="text-[10px] text-amber-300/90 flex items-start gap-1">
                      <Info className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                      <span>{st.note}</span>
                    </div>

                    {st.actionType === 'link' ? (
                      <Link
                        href={st.href}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm text-center"
                      >
                        <span>{st.actionText}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    ) : st.actionType === 'tab' ? (
                      <button
                        type="button"
                        onClick={() => onNavigateTab(st.tab)}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        <span>{st.actionText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenArchiveModal && onOpenArchiveModal()}
                        className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        <span>{st.actionText}</span>
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Helpful Tips Summary */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                ความคืบหน้าการเตรียมระบบ: <b>{completedSteps.length}/5 ขั้นตอน</b>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCompletedSteps([1, 2, 3, 4, 5])}
                className="text-[11px] text-indigo-300 hover:text-white underline cursor-pointer"
              >
                ทำเครื่องหมายเสร็จทั้งหมด
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={() => setCompletedSteps([])}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                รีเซ็ตขั้นตอน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
