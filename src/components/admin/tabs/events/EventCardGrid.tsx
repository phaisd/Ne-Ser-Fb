'use client';

import React from 'react';
import {
  Calendar,
  MapPin,
  GraduationCap,
  Globe,
  Users,
  Eye,
  EyeOff,
  Camera,
  Sparkles,
  FileSpreadsheet,
  Award,
  Edit3,
  Trash2,
  QrCode,
} from 'lucide-react';
import type { StudentEvent, EventRegistration } from '@/types';
import { getAuthUser } from '@/lib/auth-client';

interface EventCardGridProps {
  eventsList: StudentEvent[];
  registrationsList: EventRegistration[];
  selectedEventId: string;
  onSelectEventId: (id: string) => void;
  onOpenEditEvent: (event: StudentEvent, e?: React.MouseEvent) => void;
  onOpenDeleteEvent: (event: StudentEvent, e?: React.MouseEvent) => void;
  onOpenVipassanaScanner: (event: StudentEvent) => void;
  onOpenVipassanaBadges: (event: StudentEvent) => void;
  onOpenVipassanaModal: (event: StudentEvent) => void;
  onOpenVipassanaInterview: (event: StudentEvent) => void;
  onOpenVipassanaEvaluation: (event: StudentEvent) => void;
  onOpenVipassanaQr?: (event: StudentEvent) => void;
  onOpenVipassanaSeating?: (event: StudentEvent) => void;
  onOpenVipassanaSeatScanner?: (event: StudentEvent) => void;
  currentUser?: any;
}

export const EventCardGrid: React.FC<EventCardGridProps> = ({
  eventsList,
  registrationsList,
  selectedEventId,
  onSelectEventId,
  onOpenEditEvent,
  onOpenDeleteEvent,
  onOpenVipassanaScanner,
  onOpenVipassanaBadges,
  onOpenVipassanaModal,
  onOpenVipassanaInterview,
  onOpenVipassanaEvaluation,
  onOpenVipassanaQr,
  onOpenVipassanaSeating,
  onOpenVipassanaSeatScanner,
  currentUser,
}) => {
  const activeUser = currentUser || (typeof window !== 'undefined' ? getAuthUser() : null);
  const userRole = String(activeUser?.role || '').toUpperCase();
  const isSuper =
    activeUser?.role === 'SUPER_ADMIN' ||
    activeUser?.isSuperAdmin === true ||
    activeUser?.email?.toLowerCase() === 'phaisal.dis@mcu.ac.th';
  const isAdmin = !activeUser || isSuper || userRole === 'ADMIN';
  const isVipassanaMaster = userRole === 'VIPASSANA_MASTER';
  const isAdvisorOrOfficer =
    !isAdmin &&
    !isVipassanaMaster &&
    (userRole === 'OFFICER' ||
      userRole === 'STAFF' ||
      userRole === 'INSTRUCTOR' ||
      Boolean(activeUser?.isActingOfficer));

  // Role permissions based on user requirements:
  // - Advisor & Officer (ผู้ดูแลช่วงเวลาปฏิบัติ): only red-circled buttons (Scanner, Attendance 4 rounds)
  // - Vipassana Master (พระวิปัสสนาจารย์): only blue-circled button (Interview 4 Satipatthana)
  // - Admins (Admin ทุกระดับ): all buttons
  const canAccessScanner = isAdmin || isAdvisorOrOfficer;
  const canAccessAttendance = isAdmin || isAdvisorOrOfficer;
  const canAccessInterview = isAdmin || isVipassanaMaster;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-amber-600" />
          รายการโครงการและกิจกรรมทั้งหมด ({eventsList.length} โครงการ) — คลิกการ์ดเพื่อกรองรายชื่อนิสิต
        </span>
        <button
          type="button"
          onClick={() => onSelectEventId('ALL')}
          className={`text-xs px-2.5 py-1 rounded-lg transition cursor-pointer ${
            selectedEventId === 'ALL'
              ? 'bg-amber-600 text-white font-bold'
              : 'text-amber-800 hover:bg-amber-100 bg-amber-50'
          }`}
        >
          แสดงทุกโครงการ
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventsList.map((e) => {
          const count = registrationsList.filter((r) => r.eventId === e.id).length;
          const attended = registrationsList.filter(
            (r) => r.eventId === e.id && r.status === 'ATTENDED'
          ).length;
          const isSelected = selectedEventId === e.id;

          return (
            <div
              key={e.id}
              onClick={() => onSelectEventId(isSelected ? 'ALL' : e.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-gradient-to-br from-amber-50 via-white to-amber-50/50 border-amber-400 ring-2 ring-amber-500/30 shadow-md'
                  : 'bg-white border-slate-200/90 hover:border-amber-300 hover:shadow-sm'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      {e.eventType === 'MEDITATION'
                        ? '🧘 ปฏิบัติกัมมัฏฐาน'
                        : e.eventType === 'CEREMONY'
                        ? '🏛️ พิธีการ/วันสำคัญ'
                        : e.eventType === 'ACADEMIC'
                        ? '📚 วิชาการ/เสวนา'
                        : e.eventType === 'VOLUNTEER'
                        ? '🤝 จิตอาสา'
                        : '🌟 กิจกรรมพิเศษ'}
                    </span>
                    {/* Duration Format Badge */}
                    {e.durationFormat === 'LONG_TERM_MEDITATION' || e.eventType === 'MEDITATION' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        🧘 {e.totalDays || 10} วัน
                      </span>
                    ) : e.durationFormat === 'MULTI_DAY' ||
                      (e.startDate && e.endDate && e.startDate !== e.endDate) ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        ⛺ เหมาวัน ({e.totalDays || 3} วัน)
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        ☀️ 1 วัน
                      </span>
                    )}

                    {/* Group Assignment Badge */}
                    {e.meditationConfig?.groupAssignments &&
                      Object.keys(e.meditationConfig.groupAssignments).length > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          👥 มอบหมาย {Object.keys(e.meditationConfig.groupAssignments).length} กลุ่มแล้ว
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/80">
                    <span>
                      นิสิตในโครงการ: <strong className="text-indigo-700 font-bold">{count}</strong> คน
                    </span>
                    {attended > 0 && (
                      <span className="text-emerald-700 font-bold border-l border-slate-300 pl-1.5">
                        (เช็คชื่อแล้ว {attended})
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                  {e.title}
                </h4>

                {/* Date & Time */}
                <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      {e.startDate ? new Date(e.startDate).toLocaleDateString('th-TH') : '-'}
                      {e.endDate &&
                        e.endDate !== e.startDate &&
                        ` - ${new Date(e.endDate).toLocaleDateString('th-TH')}`}
                    </span>
                    {e.eventTime && (
                      <span className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 text-[10px]">
                        ⏰ {e.eventTime}
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-slate-600 line-clamp-1" title={e.location}>
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{e.location || 'คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}</span>
                  </div>

                  {/* Target Audience Badges */}
                  <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-200/60">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      <GraduationCap className="w-3 h-3" />
                      {e.targetDegree === 'BACHELOR'
                        ? 'ป.ตรี'
                        : e.targetDegree === 'MASTER'
                        ? 'ป.โท'
                        : e.targetDegree === 'DOCTORAL'
                        ? 'ป.เอก'
                        : 'ทุกระดับชั้น'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                      <Globe className="w-3 h-3" />
                      {e.targetProgram === 'THAI'
                        ? 'ภาคไทย'
                        : e.targetProgram === 'ENGLISH'
                        ? 'Inter (อังกฤษ)'
                        : 'ทุกหลักสูตร'}
                    </span>
                    {e.targetYearLevels && e.targetYearLevels.length > 0 && e.targetYearLevels.length < 4 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                        ปี {e.targetYearLevels.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Coordinator Display & Toggle Badge */}
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200/60 text-[10px]">
                    <div className="flex items-center gap-1 text-slate-600 truncate">
                      <Users className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        ผู้รับผิดชอบ: <strong>{e.coordinatorName || 'สำนักงานคณบดี'}</strong>
                      </span>
                    </div>
                    <span
                      className={`px-1.5 py-0.2 rounded font-bold shrink-0 flex items-center gap-0.5 ${
                        e.showCoordinator !== false
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                      title={e.showCoordinator !== false ? 'เปิดแสดงชื่อผู้รับผิดชอบ' : 'ซ่อนชื่อผู้รับผิดชอบ'}
                    >
                      {e.showCoordinator !== false ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                      {e.showCoordinator !== false ? 'เปิดแสดง' : 'ซ่อน'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
                {/* ปุ่ม QR เข้าระบบโครงการบนมือถือ (แยกแต่ละโครงการ) */}
                {onOpenVipassanaQr && (
                  <button
                    type="button"
                    onClick={(evt) => {
                      evt.stopPropagation();
                      onOpenVipassanaQr(e);
                    }}
                    className="px-2.5 py-1 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                    title="สร้าง QR Code และคัดลอกลิงก์ประจำโครงการนี้ สำหรับส่งให้พระวิปัสสนาจารย์และอาจารย์ผู้ดูแลเปิดสแกนบนมือถือ"
                  >
                    <QrCode className="w-3 h-3 text-amber-300" />
                    <span>QR เข้าระบบมือถือ</span>
                  </button>
                )}

                {(e.eventType === 'MEDITATION' ||
                  e.durationFormat === 'LONG_TERM_MEDITATION' ||
                  e.meditationConfig?.isMeditationEvent ||
                  e.title?.includes('วิปัสสนา') ||
                  e.title?.includes('กัมมัฏฐาน') ||
                  e.title?.toLowerCase().includes('meditation')) && (
                  <>
                    {/* ปุ่มเส้นสีแดง 1: จุดสแกนสด (สำหรับ Admin ทุกระดับ และ อาจารย์/เจ้าหน้าที่ผู้ดูแล) */}
                    {canAccessScanner && (
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.stopPropagation();
                          onOpenVipassanaScanner(e);
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                        title="เปิดจุดสแกนเช็คชื่ออัตโนมัติ (กล้องมือถือ/ปืนสแกนบาร์โค้ด)"
                      >
                        <Camera className="w-3 h-3 text-emerald-200" />
                        <span>จุดสแกนสด</span>
                      </button>
                    )}

                    {/* ปุ่มพิมพ์ป้ายคล้องคอ (เฉพาะ Admin ทุกระดับ) */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.stopPropagation();
                          onOpenVipassanaBadges(e);
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 transition font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                        title="พิมพ์ป้ายชื่อคล้องคอพร้อม QR Code"
                      >
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        <span>พิมพ์ป้ายคล้องคอ</span>
                      </button>
                    )}

                    {/* ปุ่มแผนผังที่นั่ง & เช็คอินที่นั่ง (สำหรับ Admin ทุกระดับ และ อาจารย์/เจ้าหน้าที่ผู้ดูแล) */}
                    {canAccessScanner && onOpenVipassanaSeating && (
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.stopPropagation();
                          onOpenVipassanaSeating(e);
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white transition font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                        title="เปิดผังที่นั่ง จัดที่นั่งอัตโนมัติ และตรวจเช็คจุดที่นั่ง"
                      >
                        <MapPin className="w-3 h-3 text-amber-300" />
                        <span>ผังที่นั่ง & เช็คอิน</span>
                      </button>
                    )}

                    {/* ปุ่มเส้นสีแดง 2: เช็คชื่อ 4 รอบ & พิมพ์ (สำหรับ Admin ทุกระดับ และ อาจารย์/เจ้าหน้าที่ผู้ดูแล) */}
                    {canAccessAttendance && (
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.stopPropagation();
                          onOpenVipassanaModal(e);
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                        title="เปิดแบบฟอร์มบันทึกเวลา 4 รอบ และพิมพ์เอกสาร A4"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-purple-200" />
                        <span>เช็คชื่อ 4 รอบ & พิมพ์</span>
                      </button>
                    )}

                    {/* ปุ่มเส้นสีน้ำเงิน: สอบอารมณ์สติปัฏฐาน 4 (สำหรับ Admin ทุกระดับ และ พระวิปัสสนาจารย์) */}
                    {canAccessInterview && (
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.stopPropagation();
                          onOpenVipassanaInterview(e);
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                        title="เปิดแบบสอบอารมณ์สติปัฏฐาน 4 สำหรับพระวิปัสสนาจารย์"
                      >
                        <Award className="w-3 h-3 text-amber-200" />
                        <span>สอบอารมณ์สติปัฏฐาน 4</span>
                      </button>
                    )}

                    {/* ปุ่มประมวลผล & วุฒิบัตร (เฉพาะ Admin ทุกระดับ) */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.stopPropagation();
                          onOpenVipassanaEvaluation(e);
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                        title="เปิดระบบประมวลผลผ่านโครงการร่วม 2 มิติ และออกวุฒิบัตรดิจิทัล"
                      >
                        <Award className="w-3 h-3 text-teal-200" />
                        <span>ประมวลผล & วุฒิบัตร</span>
                      </button>
                    )}
                  </>
                )}

                {/* ปุ่มแก้ไข & ลบโครงการ (เฉพาะ Admin ทุกระดับ) */}
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={(evt) => onOpenEditEvent(e, evt)}
                      className="px-2.5 py-1 text-xs rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 transition font-medium flex items-center gap-1 cursor-pointer"
                      title="แก้ไขรายละเอียดโครงการ"
                    >
                      <Edit3 className="w-3 h-3 text-slate-500" />
                      <span>แก้ไข</span>
                    </button>
                    <button
                      type="button"
                      onClick={(evt) => onOpenDeleteEvent(e, evt)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                      title="ลบโครงการนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
