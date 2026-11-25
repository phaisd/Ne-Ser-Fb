'use client';

import React from 'react';
import {
  Search,
  Sparkles,
  Calendar,
  Award,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  Clock,
  QrCode,
  MapPin,
} from 'lucide-react';
import type { StudentEvent, EventRegistration } from '@/types';
import { getAuthUser } from '@/lib/auth-client';
import { hasProjectDuty } from '@/lib/events/projectDuty';

interface EventParticipantsTableProps {
  eventsList: StudentEvent[];
  selectedEventId: string;
  setSelectedEventId: (id: string) => void;
  search: string;
  setSearch: (search: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  degreeFilter: string;
  setDegreeFilter: (filter: string) => void;
  programFilter: string;
  setProgramFilter: (filter: string) => void;
  yearLevelFilter: string;
  setYearLevelFilter: (filter: string) => void;
  majorFilter: string;
  setMajorFilter: (filter: string) => void;
  availableMajors: string[];
  filteredRegistrations: EventRegistration[];
  updatingId: string | null;
  onToggle: (regId: string, currentStatus: string) => void;
  isSyncing: boolean;
  onSyncSheets: () => void;
  onExportCsv: () => void;
  onExportXlsx?: () => void;
  onOpenGroupImport: (eventId: string) => void;
  onOpenVipassanaModal: (event: StudentEvent) => void;
  onOpenVipassanaBadges: (event: StudentEvent) => void;
  onOpenVipassanaInterview: (event: StudentEvent) => void;
  onOpenVipassanaEvaluation?: (event: StudentEvent) => void;
  onOpenVipassanaQr?: (event: StudentEvent) => void;
  onOpenVipassanaSeating?: (event: StudentEvent) => void;
  onOpenVipassanaSeatScanner?: (event: StudentEvent) => void;
  currentUser?: any;
}

export const EventParticipantsTable: React.FC<EventParticipantsTableProps> = ({
  eventsList,
  selectedEventId,
  setSelectedEventId,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  degreeFilter,
  setDegreeFilter,
  programFilter,
  setProgramFilter,
  yearLevelFilter,
  setYearLevelFilter,
  majorFilter,
  setMajorFilter,
  availableMajors,
  filteredRegistrations,
  updatingId,
  onToggle,
  isSyncing,
  onSyncSheets,
  onExportCsv,
  onExportXlsx,
  onOpenGroupImport,
  onOpenVipassanaModal,
  onOpenVipassanaBadges,
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
      Boolean(activeUser?.isActingOfficer) ||
      (userRole === 'INSTRUCTOR' && hasProjectDuty(activeUser, eventsList, filteredRegistrations)));

  // Role permissions based on user requirements:
  // - Advisor & Officer: only Attendance 4 rounds
  // - Vipassana Master: only Interview 4 Satipatthana
  // - Admins: all action buttons
  const canAccessAttendance = isAdmin || isAdvisorOrOfficer;
  const canAccessInterview = isAdmin || isVipassanaMaster;

  return (
    <>
      {/* Advanced Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 text-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัสนิสิต (เช่น T307, 6601...), ชื่อ-สกุล หรือกลุ่ม..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* VIPASSANA ACTION BUTTONS */}
            {(() => {
              const currentEvt =
                eventsList.find(
                  (e) =>
                    e.id === selectedEventId &&
                    (e.eventType === 'MEDITATION' || e.durationFormat === 'LONG_TERM_MEDITATION')
                ) || eventsList.find((e) => e.eventType === 'MEDITATION');

              if (!currentEvt) return null;

              return (
                <>
                  {/* QR เข้าระบบมือถือ (สำหรับสร้าง QR และคัดลอกลิงก์ประจำโครงการ) */}
                  {onOpenVipassanaQr && (
                    <button
                      type="button"
                      onClick={() => onOpenVipassanaQr(currentEvt)}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="สร้าง QR Code และลิงก์ด่วนประจำโครงการนี้ สำหรับส่งให้พระวิปัสสนาจารย์และอาจารย์ผู้ดูแลเปิดสแกนบนมือถือ"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-300" />
                      <span>📱 QR เข้าระบบมือถือ</span>
                    </button>
                  )}

                  {/* พิมพ์ป้ายคล้องคอ (เฉพาะ Admin ทุกระดับ) */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onOpenVipassanaBadges(currentEvt)}
                      className="px-3 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="พิมพ์ป้ายชื่อคล้องคอพร้อม QR Code"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                      <span>🪪 พิมพ์ป้ายคล้องคอ</span>
                    </button>
                  )}

                  {/* แผนผังที่นั่ง & เช็คอิน (สำหรับ Admin ทุกระดับ และ อาจารย์/เจ้าหน้าที่ผู้ดูแล) */}
                  {canAccessAttendance && onOpenVipassanaSeating && (
                    <button
                      type="button"
                      onClick={() => onOpenVipassanaSeating(currentEvt)}
                      className="px-3 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="เปิดผังที่นั่ง จัดที่นั่งอัตโนมัติ และสแกนเช็คชื่อเข้าที่นั่ง"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-300" />
                      <span>🪑 ผังที่นั่ง & เช็คอิน</span>
                    </button>
                  )}

                  {/* เช็คชื่อ 4 รอบ & พิมพ์ A4 (สำหรับ Admin ทุกระดับ และ อาจารย์/เจ้าหน้าที่ผู้ดูแล) */}
                  {canAccessAttendance && (
                    <button
                      type="button"
                      onClick={() => onOpenVipassanaModal(currentEvt)}
                      className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="เปิดแบบฟอร์มบันทึกเวลา 4 รอบ และพิมพ์เอกสาร A4 ทางการ"
                    >
                      <Calendar className="w-3.5 h-3.5 text-purple-200" />
                      <span>📋 เช็คชื่อ 4 รอบ & พิมพ์ A4</span>
                    </button>
                  )}

                  {/* สอบอารมณ์สติปัฏฐาน 4 (สำหรับ Admin ทุกระดับ และ พระวิปัสสนาจารย์) */}
                  {canAccessInterview && (
                    <button
                      type="button"
                      onClick={() => onOpenVipassanaInterview(currentEvt)}
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="เปิดแบบสอบอารมณ์สติปัฏฐาน 4 และประเมินผลสำหรับพระวิปัสสนาจารย์"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-200" />
                      <span>🧘 สอบอารมณ์สติปัฏฐาน 4</span>
                    </button>
                  )}

                  {/* ประมวลผล & วุฒิบัตร (เฉพาะ Admin ทุกระดับ) */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onOpenVipassanaEvaluation?.(currentEvt)}
                      className="px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="เปิดระบบประมวลผลผ่านโครงการร่วม 2 มิติ และออกวุฒิบัตรดิจิทัล"
                    >
                      <Award className="w-3.5 h-3.5 text-teal-200" />
                      <span>🎓 ประมวลผล & วุฒิบัตร</span>
                    </button>
                  )}
                </>
              );
            })()}

            {/* General Administrative Buttons (เฉพาะ Admin ทุกระดับ) */}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={onSyncSheets}
                  disabled={isSyncing}
                  className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                  title="ซิงค์ข้อมูลกิจกรรมและผู้เข้าร่วมกับ Google Sheets"
                >
                  <FileSpreadsheet
                    className={`w-3.5 h-3.5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`}
                  />
                  <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ Google Sheets'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onOpenGroupImport(
                      selectedEventId !== 'ALL' ? selectedEventId : eventsList[0]?.id || ''
                    )
                  }
                  className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="นำเข้าหรือดึงรายชื่อนิสิตแบบจัดกลุ่มพร้อมเลขเฉพาะกลุ่ม"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  <span>นำเข้า / ดึงนิสิตเป็นกลุ่ม</span>
                </button>

                {onExportXlsx && (
                  <button
                    type="button"
                    onClick={onExportXlsx}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="ดาวน์โหลดรายชื่อผู้เข้าร่วมตามตัวกรองปัจจุบันเป็นไฟล์ Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
                    <span>ส่งออก Excel (.xlsx)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onExportCsv}
                  className="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="ดาวน์โหลดรายชื่อผู้เข้าร่วมตามตัวกรองปัจจุบันเป็นไฟล์ CSV"
                >
                  <Download className="w-3.5 h-3.5 text-blue-700" />
                  <span>ส่งออก CSV</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Multi-Dimensional Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* 1. โครงการ */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">โครงการ:</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 truncate"
            >
              <option value="ALL">-- ทุกโครงการ --</option>
              {eventsList.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          {/* 2. ระดับหลักสูตร */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">ระดับหลักสูตร:</label>
            <select
              value={degreeFilter}
              onChange={(e) => setDegreeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="ALL">ทุกระดับ (ป.ตรี/โท/เอก)</option>
              <option value="ปริญญาตรี">ปริญญาตรี</option>
              <option value="ปริญญาโท">ปริญญาโท</option>
              <option value="ปริญญาเอก">ปริญญาเอก</option>
            </select>
          </div>

          {/* 3. หลักสูตรภาษา */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">หลักสูตรภาษา:</label>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="ALL">ทุกหลักสูตรภาษา</option>
              <option value="THAI">ภาคภาษาไทย</option>
              <option value="ENGLISH">ภาคภาษาอังกฤษ (Inter)</option>
            </select>
          </div>

          {/* 4. ชั้นปี */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">ชั้นปี:</label>
            <select
              value={yearLevelFilter}
              onChange={(e) => setYearLevelFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="ALL">ทุกชั้นปี (1 - 4)</option>
              <option value="1">ปี 1 (First year)</option>
              <option value="2">ปี 2 (Second year)</option>
              <option value="3">ปี 3 (Third year)</option>
              <option value="4">ปี 4 (Fourth year)</option>
            </select>
          </div>

          {/* 5. สาขาวิชา */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">สาขาวิชา:</label>
            <select
              value={majorFilter}
              onChange={(e) => setMajorFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 truncate"
            >
              <option value="ALL">ทุกสาขาวิชา</option>
              {availableMajors.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* 6. สถานะการเข้าร่วม */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">สถานะการเข้าร่วม:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="ATTENDED">ผ่านการเข้าร่วมแล้ว (✓)</option>
              <option value="REGISTERED">รอเช็คชื่อ (⏳)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-2">
            <span>รายชื่อผู้เข้าร่วมโครงการ</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono text-[11px] font-bold">
              {filteredRegistrations.length} รายการ
            </span>
          </span>
          <span className="text-[11px] text-slate-500">
            ข้อมูลเชื่อมต่อกับ Google Sheets แท็บ <code>EventRegistrations</code>
          </span>
        </div>

        {filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            ไม่พบข้อมูลผู้เข้าร่วมตามเงื่อนไขการค้นหาที่เลือก
          </div>
        ) : (
          <>
            {/* 1. Mobile Cards View (< lg) */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {filteredRegistrations.slice(0, 150).map((r, i) => (
                <div key={`m-reg-${r.id}`} className="p-4 space-y-2.5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {r.studentCode}
                      </span>
                      {r.seatNumber && (
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          🪑 {r.seatNumber}
                        </span>
                      )}
                    </div>
                    {r.status === 'ATTENDED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> ผ่านแล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        <Clock className="w-3 h-3 text-slate-400" /> รอเช็คชื่อ
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[13.5px] font-bold text-slate-900 leading-snug">{r.studentName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{r.eventTitle || '-'}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                      {r.degreeLevel || 'ปริญญาตรี'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {r.major || 'พระพุทธศาสนา'} ปี {r.yearLevel || 1}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 font-semibold border border-amber-200">
                      {r.groupNumber
                        ? r.groupNumber === 12
                          ? 'กลุ่ม 12 (ไทย)'
                          : `กลุ่ม ${r.groupNumber}`
                        : r.groupName || 'ทั่วไป'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {r.attendedAt ? `เข้าร่วม: ${new Date(r.attendedAt).toLocaleDateString('th-TH')}` : 'ยังไม่ระบุเวลา'}
                    </span>
                    <button
                      onClick={() => onToggle(r.id, r.status)}
                      disabled={updatingId === r.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs ${
                        r.status === 'ATTENDED'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {updatingId === r.id
                        ? 'กำลังบันทึก...'
                        : r.status === 'ATTENDED'
                        ? 'ยกเลิกผ่าน'
                        : '✓ อนุมัติผ่าน'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Desktop Table View (>= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/50 uppercase font-semibold text-slate-400 border-b">
                  <tr>
                    <th className="px-4 py-3.5 w-12 text-center">ลำดับ</th>
                    <th className="px-4 py-3.5 w-28">รหัสนิสิต</th>
                    <th className="px-4 py-3.5">ชื่อ - นามสกุล</th>
                    <th className="px-4 py-3.5">โครงการ / กิจกรรม</th>
                    <th className="px-4 py-3.5">หลักสูตร / ภาษา</th>
                    <th className="px-4 py-3.5">สาขาวิชา / ชั้นปี</th>
                    <th className="px-4 py-3.5">กลุ่ม</th>
                    <th className="px-4 py-3.5">วันที่เข้าร่วม</th>
                    <th className="px-4 py-3.5 text-center">สถานะการเข้าร่วม</th>
                    <th className="px-4 py-3.5 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegistrations.slice(0, 150).map((r, i) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-slate-400 text-center">{i + 1}</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-amber-800">{r.studentCode}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">{r.studentName}</td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-[200px] truncate" title={r.eventTitle}>
                        {r.eventTitle || '-'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            {r.degreeLevel || 'ปริญญาตรี'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              r.programType === 'ENGLISH' || r.programType === 'INTER'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {r.programType === 'ENGLISH' || r.programType === 'INTER' ? '🌐 Inter' : '🇹🇭 ภาคไทย'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div>{r.major || 'พระพุทธศาสนา'}</div>
                        <div className="text-[11px] text-slate-400">ชั้นปีที่ {r.yearLevel || 1}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        <div>
                          {r.groupNumber
                            ? r.groupNumber === 12
                              ? `กลุ่ม 12 (ไทย)`
                              : r.programType === 'ENGLISH' || r.programType === 'INTER'
                              ? `Group ${r.groupNumber} (English)`
                              : `กลุ่ม ${r.groupNumber} (ไทย)`
                            : r.groupName || 'ทั่วไป'}
                        </div>
                        {r.seatNumber ? (
                          <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200" title={`ที่นั่ง: ${r.seatNumber} (${r.seatZone || 'โซนมาตรฐาน'})${r.seatCheckinAt ? ' - เช็คอินเข้าที่นั่งแล้ว' : ''}`}>
                            <span>🪑 {r.seatNumber}</span>
                            {r.seatCheckinAt && <span className="text-emerald-600 font-black">✓</span>}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-normal">ยังไม่มีที่นั่ง</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                        {r.attendedAt ? new Date(r.attendedAt).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {r.status === 'ATTENDED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            ผ่านเข้าร่วมแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                            <Clock className="w-3 h-3 text-slate-400" />
                            รอเช็คชื่อ
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => onToggle(r.id, r.status)}
                          disabled={updatingId === r.id}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer ${
                            r.status === 'ATTENDED'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {updatingId === r.id
                            ? 'กำลังบันทึก...'
                            : r.status === 'ATTENDED'
                            ? 'ยกเลิกผ่าน'
                            : '✓ อนุมัติผ่าน'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
};
