'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Award, 
  ExternalLink, 
  Search, 
  CheckCircle2, 
  Clock, 
  Users, 
  Sparkles, 
  Plus, 
  Check, 
  Filter,
  Calendar,
  MapPin,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  UserCheck,
  FileSpreadsheet,
  Download,
  RefreshCw,
  GraduationCap,
  Globe,
  Building,
  Phone,
  Mail,
  Layers,
  X,
  AlertTriangle,
  Upload
} from 'lucide-react';
import { StudentEvent, EventRegistration, SystemSettings } from '@/types';
import { downloadCsvFile } from '@/lib/utils';
import {
  EventFormModal,
  EventGroupImportModal,
  VipassanaAttendanceSheetModal,
} from '../modals';

interface AdminEventsTabProps {
  eventsList: StudentEvent[];
  registrationsList: EventRegistration[];
  onToggleStatus: (registrationId: string, currentStatus: string) => Promise<void>;
  onRefresh: () => void;
  settings?: SystemSettings;
}

const DEFAULT_EVENT_FORM: Partial<StudentEvent> = {
  title: '',
  description: '',
  eventType: 'SPECIAL',
  durationFormat: 'SINGLE_DAY',
  totalDays: 1,
  attendanceMode: 'SINGLE_SCAN',
  meditationDaysRequired: 10,
  startDate: new Date().toISOString().substring(0, 10),
  endDate: new Date().toISOString().substring(0, 10),
  eventTime: '08:30 - 16:30 น.',
  location: 'อาคารเรียนรวม คณะพุทธศาสตร์ มจร',
  academicYear: '2569',
  semester: 1,
  maxParticipants: 100,
  activityHours: 3,
  status: 'ACTIVE',
  targetDegree: 'ALL',
  targetProgram: 'ALL',
  targetMajors: [],
  targetYearLevels: [1, 2, 3, 4],
  coordinatorName: '',
  coordinatorTitle: 'ผู้รับผิดชอบโครงการ คณะพุทธศาสตร์',
  coordinatorPhone: '',
  coordinatorEmail: '',
  showCoordinator: true,
};

export const AdminEventsTab: React.FC<AdminEventsTabProps> = ({
  eventsList,
  registrationsList,
  onToggleStatus,
  onRefresh,
  settings,
}) => {
  // Search & Filtering State
  const [search, setSearch] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [degreeFilter, setDegreeFilter] = useState('ALL');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [yearLevelFilter, setYearLevelFilter] = useState('ALL');
  const [majorFilter, setMajorFilter] = useState('ALL');
  
  // Public Visibility Toggle State
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const handleToggleEventsVisibility = async () => {
    setIsTogglingVisibility(true);
    try {
      const nextVal = !(settings?.showEventsMenu === true);
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, showEventsMenu: nextVal }),
      });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('mcu_settings_updated'));
        }
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  // Action Loading States
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal States for Add / Edit Event
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<Partial<StudentEvent>>(DEFAULT_EVENT_FORM);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // Modal State for Delete Event
  const [deletingEvent, setDeletingEvent] = useState<StudentEvent | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  // Modal State for Vipassana 4-Period Daily Attendance Sheet
  const [vipassanaModalEvent, setVipassanaModalEvent] = useState<StudentEvent | null>(null);

  // Modal State for Grouped Student Import / Pull
  const [groupImportEventId, setGroupImportEventId] = useState<string | null>(null);

  // Extract available majors from registrations & students
  const availableMajors = useMemo(() => {
    const set = new Set<string>();
    registrationsList.forEach((r) => {
      if (r.major && r.major.trim()) set.add(r.major.trim());
    });
    return Array.from(set).sort();
  }, [registrationsList]);

  // Filtered Participants List
  const filteredRegistrations = useMemo(() => {
    return registrationsList.filter((r) => {
      // Search
      const matchSearch =
        !search.trim() ||
        r.studentCode?.toLowerCase().includes(search.toLowerCase()) ||
        r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
        r.eventTitle?.toLowerCase().includes(search.toLowerCase()) ||
        r.groupName?.toLowerCase().includes(search.toLowerCase());

      // Event
      const matchEvent = selectedEventId === 'ALL' || r.eventId === selectedEventId;

      // Status
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;

      // Degree
      const matchDegree =
        degreeFilter === 'ALL' ||
        (r.degreeLevel && r.degreeLevel.includes(degreeFilter)) ||
        (degreeFilter === 'ปริญญาตรี' && (!r.degreeLevel || r.degreeLevel.includes('ตรี')));

      // Program Language
      const matchProgram =
        programFilter === 'ALL' ||
        (programFilter === 'THAI' && (r.programType === 'THAI' || !r.programType)) ||
        (programFilter === 'ENGLISH' && (r.programType === 'ENGLISH' || r.programType === 'INTER'));

      // Year Level
      const matchYear =
        yearLevelFilter === 'ALL' ||
        String(r.yearLevel) === yearLevelFilter;

      // Major
      const matchMajor =
        majorFilter === 'ALL' ||
        (r.major && r.major.trim() === majorFilter);

      return (
        matchSearch &&
        matchEvent &&
        matchStatus &&
        matchDegree &&
        matchProgram &&
        matchYear &&
        matchMajor
      );
    });
  }, [
    registrationsList,
    search,
    selectedEventId,
    statusFilter,
    degreeFilter,
    programFilter,
    yearLevelFilter,
    majorFilter,
  ]);

  // KPI Calculations
  const totalEvents = eventsList.length;
  const totalRegs = registrationsList.length;
  const attendedCount = registrationsList.filter((r) => r.status === 'ATTENDED').length;
  const pendingCount = registrationsList.filter((r) => r.status !== 'ATTENDED').length;

  const handleToggle = async (regId: string, currentStatus: string) => {
    setUpdatingId(regId);
    try {
      await onToggleStatus(regId, currentStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  // Open Add Event Modal
  const handleOpenAddEvent = () => {
    setEditingEventId(null);
    setEventForm(DEFAULT_EVENT_FORM);
    setIsEventModalOpen(true);
  };

  // Open Edit Event Modal
  const handleOpenEditEvent = (event: StudentEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEventId(event.id);
    const inferredDuration =
      event.durationFormat ||
      (event.eventType === 'MEDITATION'
        ? 'LONG_TERM_MEDITATION'
        : event.startDate !== event.endDate
        ? 'MULTI_DAY'
        : 'SINGLE_DAY');
    setEventForm({
      ...event,
      durationFormat: inferredDuration,
      totalDays: event.totalDays || (inferredDuration === 'LONG_TERM_MEDITATION' ? 10 : inferredDuration === 'MULTI_DAY' ? 3 : 1),
      meditationDaysRequired: event.meditationDaysRequired || 10,
      attendanceMode: event.attendanceMode || (inferredDuration === 'SINGLE_DAY' ? 'SINGLE_SCAN' : 'DAILY_CHECKIN'),
      targetYearLevels: event.targetYearLevels || [1, 2, 3, 4],
      showCoordinator: event.showCoordinator !== false,
      eventTime: event.eventTime || '08:30 - 16:30 น.',
    });
    setIsEventModalOpen(true);
  };

  // Save Event (Create or Update)
  const submitEventForm = async (openGroupImportAfter = false) => {
    if (!eventForm.title?.trim()) {
      alert('กรุณาระบุชื่อโครงการ/กิจกรรม');
      return;
    }

    setIsSubmittingEvent(true);
    try {
      if (editingEventId) {
        // Update
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_event',
            id: editingEventId,
            updates: eventForm,
          }),
        });
        const data = await res.json();
        if (data.success) {
          const savedId = editingEventId;
          setIsEventModalOpen(false);
          onRefresh();
          if (openGroupImportAfter) {
            setGroupImportEventId(savedId);
          }
        } else {
          alert('แก้ไขโครงการไม่สำเร็จ: ' + data.error);
        }
      } else {
        // Create
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_event',
            eventData: eventForm,
          }),
        });
        const data = await res.json();
        if (data.success) {
          const createdId = data.data?.id || null;
          setIsEventModalOpen(false);
          onRefresh();
          if (openGroupImportAfter && createdId) {
            setSelectedEventId(createdId);
            setGroupImportEventId(createdId);
          }
        } else {
          alert('เพิ่มโครงการไม่สำเร็จ: ' + data.error);
        }
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitEventForm(false);
  };

  // Confirm Delete Event
  const handleConfirmDeleteEvent = async () => {
    if (!deletingEvent) return;
    setIsDeletingEvent(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_event',
          id: deletingEvent.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDeletingEvent(null);
        if (selectedEventId === deletingEvent.id) setSelectedEventId('ALL');
        onRefresh();
      } else {
        alert('ลบไม่สำเร็จ: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + err.message);
    } finally {
      setIsDeletingEvent(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (filteredRegistrations.length === 0) {
      alert('ไม่มีข้อมูลผู้เข้าร่วมในเงื่อนไขที่เลือก');
      return;
    }

    const headers = [
      'ลำดับ',
      'รหัสนิสิต',
      'ชื่อ-นามสกุล',
      'โครงการ/กิจกรรม',
      'ระดับหลักสูตร',
      'หลักสูตรภาษา',
      'สาขาวิชา',
      'ชั้นปี',
      'กลุ่ม',
      'สถานะการเข้าร่วม',
      'วันที่เข้าร่วม',
    ];

    const rows = filteredRegistrations.map((r, idx) => [
      idx + 1,
      r.studentCode,
      r.studentName || '',
      r.eventTitle || '',
      r.degreeLevel || 'ปริญญาตรี',
      r.programType === 'ENGLISH' ? 'ภาษาอังกฤษ (Inter)' : 'ภาษาไทย',
      r.major || '',
      `ปี ${r.yearLevel || 1}`,
      r.groupName || 'ทั่วไป',
      r.status === 'ATTENDED' ? 'ผ่านการเข้าร่วมแล้ว' : 'รอเช็คชื่อ',
      r.attendedAt ? new Date(r.attendedAt).toLocaleDateString('th-TH') : '-',
    ]);

    downloadCsvFile(`event_participants_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // Sync to Google Sheets
  const handleSyncSheets = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sheets-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        alert('ซิงค์ข้อมูลกิจกรรมและผู้เข้าร่วมไปยัง Google Sheets สำเร็จเรียบร้อย!');
        onRefresh();
      } else {
        alert('ซิงค์ไม่สำเร็จ: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('ไม่สามารถเชื่อมต่อกับ Google Sheets ได้: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            งานกิจกรรมและโครงการนิสิต (Student Activities & Events Management)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            จัดการโครงการ กำหนดหลักสูตร/ชั้นปีเป้าหมาย วันเวลา สถานที่ ผู้รับผิดชอบ และระบบเช็คชื่อเข้าร่วมกิจกรรม
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAddEvent}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>➕ เพิ่มโครงการ/กิจกรรมใหม่</span>
          </button>
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

      {/* Public Visibility Toggle Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm transition ${
        settings?.showEventsMenu === true
          ? 'bg-emerald-50/70 border-emerald-200'
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            settings?.showEventsMenu === true ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
          }`}>
            {settings?.showEventsMenu === true ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span>การแสดงผลระบบกิจกรรมนิสิตบนหน้าเว็บหลัก:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                settings?.showEventsMenu === true
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
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

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-600" />
            รายการโครงการและกิจกรรมทั้งหมด ({eventsList.length} โครงการ) — คลิกการ์ดเพื่อกรองรายชื่อนิสิต
          </span>
          <button
            type="button"
            onClick={() => setSelectedEventId('ALL')}
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
            const attended = registrationsList.filter((r) => r.eventId === e.id && r.status === 'ATTENDED').length;
            const isSelected = selectedEventId === e.id;

            return (
              <div
                key={e.id}
                onClick={() => setSelectedEventId(isSelected ? 'ALL' : e.id)}
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
                      ) : e.durationFormat === 'MULTI_DAY' || (e.startDate && e.endDate && e.startDate !== e.endDate) ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          ⛺ เหมาวัน ({e.totalDays || 3} วัน)
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          ☀️ 1 วัน
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      เข้าร่วม: <strong className="text-emerald-700">{attended}</strong> / {count} คน
                    </span>
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
                        {e.endDate && e.endDate !== e.startDate && ` - ${new Date(e.endDate).toLocaleDateString('th-TH')}`}
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
                  {(e.eventType === 'MEDITATION' || e.durationFormat === 'LONG_TERM_MEDITATION') && (
                    <button
                      type="button"
                      onClick={(evt) => {
                        evt.stopPropagation();
                        setVipassanaModalEvent(e);
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                      title="เปิดแบบฟอร์มบันทึกเวลา 4 รอบ และพิมพ์เอกสาร A4"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-purple-200" />
                      <span>เช็คชื่อ 4 รอบ & พิมพ์</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(evt) => handleOpenEditEvent(e, evt)}
                    className="px-2.5 py-1 text-xs rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 transition font-medium flex items-center gap-1 cursor-pointer"
                    title="แก้ไขรายละเอียดโครงการ"
                  >
                    <Edit3 className="w-3 h-3 text-slate-500" />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    type="button"
                    onClick={(evt) => {
                      evt.stopPropagation();
                      setDeletingEvent(e);
                    }}
                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                    title="ลบโครงการนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
            {(() => {
              const currentEvt =
                eventsList.find((e) => e.id === selectedEventId && (e.eventType === 'MEDITATION' || e.durationFormat === 'LONG_TERM_MEDITATION')) ||
                eventsList.find((e) => e.eventType === 'MEDITATION');
              if (!currentEvt) return null;
              return (
                <button
                  type="button"
                  onClick={() => setVipassanaModalEvent(currentEvt)}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="เปิดแบบฟอร์มบันทึกเวลา 4 รอบ และพิมพ์เอกสาร A4 ทางการ"
                >
                  <Calendar className="w-3.5 h-3.5 text-purple-200" />
                  <span>📋 เช็คชื่อวิปัสสนา 4 รอบ & พิมพ์ A4</span>
                </button>
              );
            })()}

            <button
              type="button"
              onClick={handleSyncSheets}
              disabled={isSyncing}
              className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
              title="ซิงค์ข้อมูลกิจกรรมและผู้เข้าร่วมกับ Google Sheets"
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ Google Sheets'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setGroupImportEventId(
                  selectedEventId !== 'ALL' ? selectedEventId : eventsList[0]?.id || ''
                )
              }
              className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="นำเข้าหรือดึงรายชื่อนิสิตแบบจัดกลุ่มพร้อมเลขเฉพาะกลุ่ม"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span>นำเข้า / ดึงนิสิตเป็นกลุ่ม</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="ดาวน์โหลดรายชื่อผู้เข้าร่วมตามตัวกรองปัจจุบันเป็น Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>ส่งออก Excel / CSV</span>
            </button>
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
          <div className="overflow-x-auto">
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
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          r.programType === 'ENGLISH' || r.programType === 'INTER'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {r.programType === 'ENGLISH' || r.programType === 'INTER' ? '🌐 Inter' : '🇹🇭 ภาคไทย'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <div>{r.major || 'พระพุทธศาสนา'}</div>
                      <div className="text-[11px] text-slate-400">
                        ชั้นปีที่ {r.yearLevel || 1}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">{r.groupName || 'ทั่วไป'}</td>
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
                        onClick={() => handleToggle(r.id, r.status)}
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
        )}
      </div>

      {/* Modal: Add / Edit Event */}
      <EventFormModal
        isOpen={isEventModalOpen}
        editingEventId={editingEventId}
        eventForm={eventForm}
        setEventForm={setEventForm}
        isSubmittingEvent={isSubmittingEvent}
        onClose={() => setIsEventModalOpen(false)}
        onSubmit={handleSaveEvent}
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
                <h3 className="font-extrabold text-slate-900 text-base">
                  ยืนยันการลบโครงการ
                </h3>
                <p className="text-xs text-slate-500">
                  ระบบจะลบข้อมูลโครงการนี้ออกจากระบบ
                </p>
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
                {isDeletingEvent ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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

      {/* Grouped Student Import / Pull Modal */}
      {groupImportEventId !== null && (
        <EventGroupImportModal
          isOpen={groupImportEventId !== null}
          onClose={() => setGroupImportEventId(null)}
          eventsList={eventsList}
          initialEventId={groupImportEventId || undefined}
          registrationsList={registrationsList}
          onImported={onRefresh}
        />
      )}
    </div>
  );
};
