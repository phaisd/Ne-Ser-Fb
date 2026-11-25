'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Award,
  ExternalLink,
  CheckCircle2,
  Clock,
  Users,
  Sparkles,
  Plus,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import type { StudentEvent, EventRegistration, SystemSettings } from '@/types';
import dynamic from 'next/dynamic';
import { useAdminEvents } from '@/hooks/admin';
import { getAuthUser } from '@/lib/auth-client';
import { hasProjectDuty } from '@/lib/events/projectDuty';
import {
  EventFormModal,
  EventGroupImportModal,
  VipassanaAttendanceSheetModal,
  VipassanaBadgesModal,
  VipassanaInterviewSheetModal,
  VipassanaCombinedEvaluationModal,
  VipassanaEventQrModal,
  VipassanaSeatScannerModal,
} from '../modals';
import { EventCardGrid, EventParticipantsTable } from './events';

const VipassanaSeatMapModal = dynamic(
  () => import('../modals/vipassana/VipassanaSeatMapModal').then((m) => m.VipassanaSeatMapModal),
  { ssr: false }
);

const VipassanaLiveScannerModal = dynamic(
  () => import('../modals/VipassanaLiveScannerModal').then((m) => m.VipassanaLiveScannerModal),
  { ssr: false }
);

interface AdminEventsTabProps {
  eventsList: StudentEvent[];
  registrationsList: EventRegistration[];
  onToggleStatus: (registrationId: string, currentStatus: string) => Promise<void>;
  onRefresh: () => void;
  settings?: SystemSettings;
  currentUser?: any;
}

export const AdminEventsTab: React.FC<AdminEventsTabProps> = ({
  eventsList,
  registrationsList: rawRegistrationsList,
  onToggleStatus,
  onRefresh,
  settings,
  currentUser,
}) => {
  // Strictly deduplicate registrationsList by eventId + studentCode
  const registrationsList = React.useMemo(() => {
    const seen = new Set<string>();
    return (rawRegistrationsList || []).filter((r) => {
      const sCode = (r.studentCode || r.id || '').trim().toLowerCase();
      const key = `${r.eventId || ''}_${sCode}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rawRegistrationsList]);
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
  const {
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
    totalEvents,
    totalRegs,
    attendedCount,
    pendingCount,
    isTogglingVisibility,
    handleToggleEventsVisibility,
    updatingId,
    handleToggle,
    isSyncing,
    handleSyncSheets,
    handleExportCsv,
    handleExportXlsx,
    // Add/Edit Event Modal State
    isEventModalOpen,
    setIsEventModalOpen,
    editingEventId,
    eventForm,
    setEventForm,
    isSubmittingEvent,
    handleOpenAddEvent,
    handleOpenEditEvent,
    submitEventForm,
    // Delete Event Modal State
    deletingEvent,
    setDeletingEvent,
    isDeletingEvent,
    handleOpenDeleteEvent,
    handleConfirmDeleteEvent,
    // Vipassana Modals State
    vipassanaModalEvent,
    setVipassanaModalEvent,
    vipassanaBadgesEvent,
    setVipassanaBadgesEvent,
    vipassanaScannerEvent,
    setVipassanaScannerEvent,
    vipassanaInterviewEvent,
    setVipassanaInterviewEvent,
    vipassanaEvaluationEvent,
    setVipassanaEvaluationEvent,
    vipassanaQrEvent,
    setVipassanaQrEvent,
    // Group Import Modal State
    groupImportEventId,
    setGroupImportEventId,
  } = useAdminEvents({
    eventsList,
    registrationsList,
    onToggleStatus,
    onRefresh,
    settings,
  });

  // Vipassana Seating Map & Seat Scanner State
  const [vipassanaSeatingEvent, setVipassanaSeatingEvent] = React.useState<StudentEvent | null>(null);
  const [vipassanaSeatScannerEvent, setVipassanaSeatScannerEvent] = React.useState<StudentEvent | null>(null);

  // Auto-open specific Event & Scanner/Interview Modal from Mobile QR Deep Link
  const deepLinkHandledRef = useRef(false);
  useEffect(() => {
    if (deepLinkHandledRef.current || typeof window === 'undefined' || eventsList.length === 0) {
      return;
    }

    // If an instructor does not have project duty, do not auto-open scan station
    const userHasDuty = hasProjectDuty(activeUser, eventsList, registrationsList);
    if (activeUser && activeUser.role === 'INSTRUCTOR' && !activeUser.isActingOfficer && !userHasDuty) {
      try {
        sessionStorage.removeItem('mcu_active_vipassana_station');
        localStorage.removeItem('mcu_active_vipassana_station');
      } catch {}
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const qEventId = params.get('eventId');
    const qAction = (params.get('action') || '').toUpperCase();

    if (!qEventId) return;

    const targetEvent = eventsList.find((e) => e.id === qEventId);
    if (!targetEvent) return;

    deepLinkHandledRef.current = true;
    setSelectedEventId(targetEvent.id);

    let resolvedAction: 'INTERVIEW' | 'SCAN' | 'ATTENDANCE' | 'SEATING' | 'SEAT_SCAN' = 'SCAN';
    if (qAction === 'INTERVIEW') {
      resolvedAction = 'INTERVIEW';
      setVipassanaInterviewEvent(targetEvent);
    } else if (qAction === 'SCAN') {
      resolvedAction = 'SCAN';
      setVipassanaScannerEvent(targetEvent);
    } else if (qAction === 'ATTENDANCE') {
      resolvedAction = 'ATTENDANCE';
      setVipassanaModalEvent(targetEvent);
    } else if (qAction === 'SEATING') {
      resolvedAction = 'SEATING';
      setVipassanaSeatingEvent(targetEvent);
    } else if (qAction === 'SEAT_SCAN') {
      resolvedAction = 'SEAT_SCAN';
      setVipassanaSeatScannerEvent(targetEvent);
    } else if (qAction === 'AUTO') {
      if (isVipassanaMaster) {
        resolvedAction = 'INTERVIEW';
        setVipassanaInterviewEvent(targetEvent);
      } else {
        resolvedAction = 'SCAN';
        setVipassanaScannerEvent(targetEvent);
      }
    }

    // Persist active mobile station so user can return from anywhere if they accidentally navigate away
    try {
      const stationData = JSON.stringify({
        eventId: targetEvent.id,
        eventTitle: targetEvent.title,
        action: resolvedAction,
        url: `/admin?tab=EVENTS&eventId=${encodeURIComponent(targetEvent.id)}&action=${resolvedAction}`,
        savedAt: Date.now(),
      });
      sessionStorage.setItem('mcu_active_vipassana_station', stationData);
      localStorage.setItem('mcu_active_vipassana_station', stationData);
    } catch {}
  }, [
    eventsList,
    isVipassanaMaster,
    setSelectedEventId,
    setVipassanaInterviewEvent,
    setVipassanaScannerEvent,
    setVipassanaModalEvent,
  ]);

  // Also persist station whenever Scanner / Interview / Attendance / Seating modal is opened on this device
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const activeEvt =
      vipassanaSeatScannerEvent ||
      vipassanaSeatingEvent ||
      vipassanaScannerEvent ||
      vipassanaInterviewEvent ||
      vipassanaModalEvent;
    if (!activeEvt) return;
    const activeAction = vipassanaInterviewEvent
      ? 'INTERVIEW'
      : vipassanaSeatScannerEvent
      ? 'SEAT_SCAN'
      : vipassanaSeatingEvent
      ? 'SEATING'
      : vipassanaScannerEvent
      ? 'SCAN'
      : 'ATTENDANCE';
    try {
      const stationData = JSON.stringify({
        eventId: activeEvt.id,
        eventTitle: activeEvt.title,
        action: activeAction,
        url: `/admin?tab=EVENTS&eventId=${encodeURIComponent(activeEvt.id)}&action=${activeAction}`,
        savedAt: Date.now(),
      });
      sessionStorage.setItem('mcu_active_vipassana_station', stationData);
      localStorage.setItem('mcu_active_vipassana_station', stationData);
    } catch {}
  }, [
    vipassanaScannerEvent,
    vipassanaInterviewEvent,
    vipassanaModalEvent,
    vipassanaSeatingEvent,
    vipassanaSeatScannerEvent,
  ]);

  // Intercept accidental mobile hardware Back button / Swipe Back when a Vipassana modal is open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isAnyModalOpen = Boolean(
      vipassanaScannerEvent ||
        vipassanaInterviewEvent ||
        vipassanaModalEvent ||
        vipassanaSeatingEvent ||
        vipassanaSeatScannerEvent
    );
    if (!isAnyModalOpen) return;

    // Push a guard state onto history so pressing Back triggers popstate instead of leaving /admin
    window.history.pushState({ vipassanaGuard: true }, '', window.location.href);

    const handlePopState = () => {
      const confirmLeave = window.confirm(
        '⚠️ ท่านกำลังอยู่ในโหมดสแกนตรวจเช็คชื่อ / สอบอารมณ์\nต้องการออกจากหน้าปฏิบัติงานนี้หรือไม่? (กด "ยกเลิก" เพื่ออยู่หน้าเดิมต่อไป)'
      );
      if (!confirmLeave) {
        // Stay on the current modal
        window.history.pushState({ vipassanaGuard: true }, '', window.location.href);
      } else {
        setVipassanaScannerEvent(null);
        setVipassanaInterviewEvent(null);
        setVipassanaModalEvent(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    vipassanaScannerEvent,
    vipassanaInterviewEvent,
    vipassanaModalEvent,
    setVipassanaScannerEvent,
    setVipassanaInterviewEvent,
    setVipassanaModalEvent,
  ]);

  return (
    <div className="space-y-6 print:space-y-0">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            {isVipassanaMaster
              ? '🧘 โครงการวิปัสสนากัมมัฏฐาน & ระบบสอบอารมณ์สติปัฏฐาน 4'
              : isAdvisorOrOfficer
              ? '📋 โครงการปฏิบัติธรรม & บันทึกเวลาปฏิบัติ 4 รอบ'
              : 'งานกิจกรรมและโครงการนิสิต (Student Activities & Events Management)'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isVipassanaMaster
              ? 'บันทึกการสอบอารมณ์สติปัฏฐาน 4 (กาย เวทนา จิต ธรรม) ให้คำแนะนำสภาวะธรรม และประเมินผลสำหรับพระวิปัสสนาจารย์'
              : isAdvisorOrOfficer
              ? 'จุดสแกนเช็คชื่อสดด้วย QR Code และแบบฟอร์มบันทึกเวลาปฏิบัติธรรม 4 รอบต่อวันสำหรับอาจารย์และเจ้าหน้าที่ผู้ดูแล'
              : 'จัดการโครงการ กำหนดหลักสูตร/ชั้นปีเป้าหมาย วันเวลา สถานที่ ผู้รับผิดชอบ และระบบเช็คชื่อเข้าร่วมกิจกรรม'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenAddEvent}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>➕ เพิ่มโครงการ/กิจกรรมใหม่</span>
            </button>
          )}
          <Link
            href="/events"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <span>หน้าระบบสำหรับนิสิต</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Public Visibility Toggle Banner (เฉพาะ Admin ทุกระดับ) */}
      {isAdmin && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm transition print:hidden ${
            settings?.showEventsMenu === true
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                settings?.showEventsMenu === true
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {settings?.showEventsMenu === true ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span>การแสดงผลระบบกิจกรรมนิสิตบนหน้าเว็บหลัก:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                    settings?.showEventsMenu === true
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {settings?.showEventsMenu === true ? '🟢 กำลังเปิดแสดงที่หน้าหลัก' : '🔴 ปิดซ่อนอยู่ (หน้าหลักไม่แสดง)'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {settings?.showEventsMenu === true
                  ? 'นิสิตและบุคคลภายนอกสามารถมองเห็นเมนู "กิจกรรมนิสิต" บนแถบเมนูหลัก (Navbar) และหน้าแรกได้'
                  : 'ระบบนี้ถูกปิดซ่อนไว้จากหน้าเว็บหลักแล้ว เพื่อให้ผู้ดูแลระบบเตรียมข้อมูลโครงการให้เรียบร้อยก่อนเปิดตัว'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isTogglingVisibility}
            onClick={handleToggleEventsVisibility}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0 disabled:opacity-50 ${
              settings?.showEventsMenu === true
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isTogglingVisibility ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : settings?.showEventsMenu === true ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            <span>
              {settings?.showEventsMenu === true ? 'คลิกเพื่อปิดซ่อนจากหน้าหลัก' : 'คลิกเพื่อเปิดแสดงที่หน้าหลัก'}
            </span>
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalEvents}</div>
            <div className="text-[11px] font-medium text-slate-500">โครงการทั้งหมด</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalRegs}</div>
            <div className="text-[11px] font-medium text-slate-500">ยอดลงทะเบียนรวม</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">{attendedCount}</div>
            <div className="text-[11px] font-medium text-slate-500">ผ่านการเข้าร่วมแล้ว</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-700">{pendingCount}</div>
            <div className="text-[11px] font-medium text-slate-500">รอเช็คชื่อ/รอตรวจ</div>
          </div>
        </div>
      </div>

      {/* Events Showcase & Management Cards */}
      <div className="print:hidden">
        <EventCardGrid
          eventsList={eventsList}
          registrationsList={registrationsList}
          selectedEventId={selectedEventId}
          onSelectEventId={setSelectedEventId}
          onOpenEditEvent={handleOpenEditEvent}
          onOpenDeleteEvent={handleOpenDeleteEvent}
          onOpenVipassanaScanner={setVipassanaScannerEvent}
          onOpenVipassanaBadges={setVipassanaBadgesEvent}
          onOpenVipassanaModal={setVipassanaModalEvent}
          onOpenVipassanaInterview={setVipassanaInterviewEvent}
          onOpenVipassanaEvaluation={setVipassanaEvaluationEvent}
          onOpenVipassanaQr={setVipassanaQrEvent}
          onOpenVipassanaSeating={setVipassanaSeatingEvent}
          onOpenVipassanaSeatScanner={setVipassanaSeatScannerEvent}
          currentUser={activeUser}
        />
      </div>

      {/* Registrations List with Filter Toolbar */}
      <div className="print:hidden">
        <EventParticipantsTable
          eventsList={eventsList}
          selectedEventId={selectedEventId}
          setSelectedEventId={setSelectedEventId}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          degreeFilter={degreeFilter}
          setDegreeFilter={setDegreeFilter}
          programFilter={programFilter}
          setProgramFilter={setProgramFilter}
          yearLevelFilter={yearLevelFilter}
          setYearLevelFilter={setYearLevelFilter}
          majorFilter={majorFilter}
          setMajorFilter={setMajorFilter}
          availableMajors={availableMajors}
          filteredRegistrations={filteredRegistrations}
          updatingId={updatingId}
          onToggle={handleToggle}
          isSyncing={isSyncing}
          onSyncSheets={handleSyncSheets}
          onExportCsv={handleExportCsv}
          onExportXlsx={handleExportXlsx}
          onOpenGroupImport={setGroupImportEventId}
          onOpenVipassanaModal={setVipassanaModalEvent}
          onOpenVipassanaBadges={setVipassanaBadgesEvent}
          onOpenVipassanaInterview={setVipassanaInterviewEvent}
          onOpenVipassanaEvaluation={setVipassanaEvaluationEvent}
          onOpenVipassanaQr={setVipassanaQrEvent}
          onOpenVipassanaSeating={setVipassanaSeatingEvent}
          onOpenVipassanaSeatScanner={setVipassanaSeatScannerEvent}
          currentUser={activeUser}
        />
      </div>

      {/* Modal: Add / Edit Event */}
      <EventFormModal
        isOpen={isEventModalOpen}
        editingEventId={editingEventId}
        eventForm={eventForm}
        setEventForm={setEventForm}
        isSubmittingEvent={isSubmittingEvent}
        onClose={() => setIsEventModalOpen(false)}
        onSubmit={async (e) => {
          e.preventDefault();
          await submitEventForm(false);
        }}
        onSubmitAndOpenGroupImport={() => submitEventForm(true)}
      />

      {/* Modal: Confirm Delete Event */}
      {deletingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">ยืนยันการลบโครงการ</h3>
                <p className="text-xs text-slate-500">ระบบจะลบข้อมูลโครงการนี้ออกจากระบบ</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{deletingEvent.title}</div>
              <div className="text-slate-500">สถานที่: {deletingEvent.location || 'คณะพุทธศาสตร์'}</div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>โครงการที่ถูกลบจะไม่สามารถกู้คืนได้ โปรดยืนยันหากต้องการลบรายการนี้</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingEvent(null)}
                disabled={isDeletingEvent}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEvent}
                disabled={isDeletingEvent}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isDeletingEvent ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeletingEvent ? 'กำลังลบ...' : 'ยืนยันลบโครงการ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vipassana 4-Period Daily Attendance & Printable Form Modal */}
      {vipassanaModalEvent && (
        <VipassanaAttendanceSheetModal
          isOpen={!!vipassanaModalEvent}
          onClose={() => setVipassanaModalEvent(null)}
          event={vipassanaModalEvent}
          registrations={registrationsList.filter((r) => r.eventId === vipassanaModalEvent.id)}
          onAttendanceSaved={onRefresh}
        />
      )}

      {/* Vipassana Badges Modal */}
      {vipassanaBadgesEvent && (
        <VipassanaBadgesModal
          isOpen={!!vipassanaBadgesEvent}
          onClose={() => setVipassanaBadgesEvent(null)}
          event={vipassanaBadgesEvent}
          registrations={registrationsList.filter((r) => r.eventId === vipassanaBadgesEvent.id)}
        />
      )}

      {/* Vipassana Live Scanner Modal */}
      {vipassanaScannerEvent && (
        <VipassanaLiveScannerModal
          isOpen={!!vipassanaScannerEvent}
          onClose={() => setVipassanaScannerEvent(null)}
          event={vipassanaScannerEvent}
          registrations={registrationsList.filter((r) => r.eventId === vipassanaScannerEvent.id)}
          onCheckInRecorded={onRefresh}
        />
      )}

      {/* Vipassana Interview (สติปัฏฐาน 4) Sheet Modal */}
      {vipassanaInterviewEvent && (
        <VipassanaInterviewSheetModal
          isOpen={!!vipassanaInterviewEvent}
          onClose={() => setVipassanaInterviewEvent(null)}
          event={vipassanaInterviewEvent}
          registrations={registrationsList.filter((r) => r.eventId === vipassanaInterviewEvent.id)}
          onSaved={onRefresh}
        />
      )}

      {/* Vipassana Combined Evaluation & Digital Certificates Modal */}
      {vipassanaEvaluationEvent && (
        <VipassanaCombinedEvaluationModal
          isOpen={!!vipassanaEvaluationEvent}
          onClose={() => setVipassanaEvaluationEvent(null)}
          event={vipassanaEvaluationEvent}
          registrations={registrationsList.filter((r) => r.eventId === vipassanaEvaluationEvent.id)}
          onRefresh={onRefresh}
        />
      )}

      {/* Vipassana Event QR & Mobile Direct Access Modal */}
      {vipassanaQrEvent && (
        <VipassanaEventQrModal
          isOpen={!!vipassanaQrEvent}
          onClose={() => setVipassanaQrEvent(null)}
          event={vipassanaQrEvent}
        />
      )}

      {/* Vipassana Seating Map & Seat Management Modal */}
      {vipassanaSeatingEvent && (
        <VipassanaSeatMapModal
          isOpen={!!vipassanaSeatingEvent}
          onClose={() => setVipassanaSeatingEvent(null)}
          event={vipassanaSeatingEvent}
          registrations={registrationsList.filter((r) => r.eventId === vipassanaSeatingEvent.id)}
          onRefresh={onRefresh}
          onOpenSeatScanner={(e: StudentEvent) => setVipassanaSeatScannerEvent(e)}
          onOpenEventQr={(e: StudentEvent) => setVipassanaQrEvent(e)}
        />
      )}

      {/* Vipassana Seat Scanner Modal (Staff Rapid Checkin) */}
      {vipassanaSeatScannerEvent && (
        <VipassanaSeatScannerModal
          isOpen={!!vipassanaSeatScannerEvent}
          onClose={() => setVipassanaSeatScannerEvent(null)}
          event={vipassanaSeatScannerEvent}
          registrations={registrationsList.filter((r) => r.eventId === vipassanaSeatScannerEvent.id)}
          onCheckinSuccess={onRefresh}
        />
      )}

      {/* Grouped Student Import / Pull Modal */}
      {groupImportEventId !== null && (
        <EventGroupImportModal
          isOpen={groupImportEventId !== null}
          onClose={() => setGroupImportEventId(null)}
          eventsList={
            eventsList.some((e) => e.id === groupImportEventId)
              ? eventsList
              : [
                  {
                    id: groupImportEventId,
                    title:
                      eventsList.find((e) => e.id === groupImportEventId)?.title ||
                      eventForm.title ||
                      'โครงการที่เลือก',
                    academicYear: eventForm.academicYear || '2569',
                    eventType: eventForm.eventType || 'SPECIAL',
                    startDate: eventForm.startDate || '',
                    endDate: eventForm.endDate || '',
                    eventTime: eventForm.eventTime || '',
                    location: eventForm.location || '',
                    semester: eventForm.semester || 1,
                    maxParticipants: eventForm.maxParticipants || 100,
                    activityHours: eventForm.activityHours || 3,
                    status: eventForm.status || 'ACTIVE',
                    isActive: true,
                    targetDegree: eventForm.targetDegree || 'ALL',
                    targetProgram: eventForm.targetProgram || 'ALL',
                    targetYearLevels: eventForm.targetYearLevels || [1, 2, 3, 4],
                    targetMajors: eventForm.targetMajors || [],
                  } as StudentEvent,
                  ...eventsList,
                ]
          }
          initialEventId={groupImportEventId || undefined}
          initialEventTitle={
            eventsList.find((e) => e.id === groupImportEventId)?.title ||
            eventForm.title ||
            undefined
          }
          registrationsList={registrationsList}
          onImported={onRefresh}
        />
      )}
    </div>
  );
};
