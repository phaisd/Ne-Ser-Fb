'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  GraduationCap,
  Calendar,
  UserCheck,
  FileText,
  Archive,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Info,
  X,
  BookOpen,
} from 'lucide-react';

interface NewAcademicYearWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'DASHBOARD' | 'TIMETABLES' | 'COURSES' | 'ATTENDANCE' | 'USERS' | 'STUDENTS' | 'CERTIFICATES' | 'SHEETS' | 'BRANDING') => void;
  onOpenArchiveModal?: () => void;
  currentAcademicYear?: string;
}

export const NewAcademicYearWorkflowModal: React.FC<NewAcademicYearWorkflowModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenArchiveModal,
  currentAcademicYear = '2569',
}) => {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  คำแนะนำขั้นตอนการทำงานเมื่อเปิดปีการศึกษาใหม่ (Recommended Workflow)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                  Best Practice
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ขั้นตอนมาตรฐาน 5 ประการสำหรับผู้ดูแลระบบและเจ้าหน้าที่บริการการศึกษา
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-3.5">
          {steps.map((st) => (
            <div
              key={st.step}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/40 border border-slate-200/90 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 flex-1">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0 mt-0.5">
                  {st.step}
                </span>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">
                      {st.title}
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${st.badgeColor}`}>
                      {st.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {st.description}
                  </p>
                  <div className="text-[11px] text-amber-800 flex items-center gap-1 font-medium pt-0.5">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{st.note}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 self-end md:self-center">
                {st.actionType === 'link' ? (
                  <Link
                    href={st.href}
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                  >
                    <span>{st.actionText}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                ) : st.actionType === 'tab' ? (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab(st.tab);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <span>{st.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenArchiveModal && onOpenArchiveModal();
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <span>{st.actionText}</span>
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
          <span>ระบบบริหารงานวิชาการและทะเบียน คณะพุทธศาสตร์ มจร.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
