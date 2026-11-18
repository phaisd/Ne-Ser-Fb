'use client';

import { useState, useMemo } from 'react';
import type { StudentEvent, EventRegistration, SystemSettings } from '@/types';
import { downloadCsvFile } from '@/lib/utils';

export const DEFAULT_EVENT_FORM: Partial<StudentEvent> = {
  title: '',
  description: '',
  eventType: 'SPECIAL',
  durationFormat: 'SINGLE_DAY',
  totalDays: 1,
  attendanceMode: 'SINGLE_SCAN',
  meditationDaysRequired: 10,
  targetDegree: 'ALL',
  targetProgram: 'ALL',
  targetYearLevels: [1, 2, 3, 4],
  targetMajors: [],
  location: 'อาคารโพธิญาณมหาวิชชาลัย จ.นครปฐม',
  eventTime: '08:30 - 16:30 น.',
  activityHours: 6,
  status: 'ACTIVE',
  showCoordinator: true,
  coordinatorName: '',
  coordinatorTitle: 'ผู้รับผิดชอบโครงการ',
  coordinatorPhone: '',
  coordinatorEmail: '',
};

interface UseAdminEventsParams {
  eventsList: StudentEvent[];
  registrationsList: EventRegistration[];
  onToggleStatus: (registrationId: string, currentStatus: string) => Promise<void>;
  onRefresh: () => void;
  settings?: SystemSettings;
}

export function useAdminEvents({
  eventsList,
  registrationsList,
  onToggleStatus,
  onRefresh,
  settings,
}: UseAdminEventsParams) {
  // Filter States
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [degreeFilter, setDegreeFilter] = useState<string>('ALL');
  const [programFilter, setProgramFilter] = useState<string>('ALL');
  const [yearLevelFilter, setYearLevelFilter] = useState<string>('ALL');
  const [majorFilter, setMajorFilter] = useState<string>('ALL');

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

  // Modal States for Vipassana
  const [vipassanaModalEvent, setVipassanaModalEvent] = useState<StudentEvent | null>(null);
  const [vipassanaBadgesEvent, setVipassanaBadgesEvent] = useState<StudentEvent | null>(null);
  const [vipassanaScannerEvent, setVipassanaScannerEvent] = useState<StudentEvent | null>(null);
  const [vipassanaInterviewEvent, setVipassanaInterviewEvent] = useState<StudentEvent | null>(null);
  const [vipassanaEvaluationEvent, setVipassanaEvaluationEvent] = useState<StudentEvent | null>(null);

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
      const matchSearch =
        !search.trim() ||
        r.studentCode?.toLowerCase().includes(search.toLowerCase()) ||
        r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
        r.eventTitle?.toLowerCase().includes(search.toLowerCase()) ||
        r.groupName?.toLowerCase().includes(search.toLowerCase()) ||
        r.groupSpecificCode?.toLowerCase().includes(search.toLowerCase());

      const matchEvent = selectedEventId === 'ALL' || r.eventId === selectedEventId;
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchDegree =
        degreeFilter === 'ALL' ||
        (r.degreeLevel && r.degreeLevel.includes(degreeFilter)) ||
        (degreeFilter === 'ปริญญาตรี' && (!r.degreeLevel || r.degreeLevel.includes('ตรี')));
      const matchProgram =
        programFilter === 'ALL' ||
        (programFilter === 'THAI' && (r.programType === 'THAI' || !r.programType)) ||
        (programFilter === 'ENGLISH' && (r.programType === 'ENGLISH' || r.programType === 'INTER'));
      const matchYear =
        yearLevelFilter === 'ALL' ||
        String(r.yearLevel) === yearLevelFilter;
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

  const handleOpenAddEvent = () => {
    setEditingEventId(null);
    setEventForm(DEFAULT_EVENT_FORM);
    setIsEventModalOpen(true);
  };

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

  const submitEventForm = async (openGroupImportAfter = false) => {
    if (!eventForm.title?.trim()) {
      alert('กรุณาระบุชื่อโครงการ/กิจกรรม');
      return;
    }

    setIsSubmittingEvent(true);
    try {
      if (editingEventId) {
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
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleOpenDeleteEvent = (event: StudentEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingEvent(event);
  };

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
        if (selectedEventId === deletingEvent.id) {
          setSelectedEventId('ALL');
        }
        setDeletingEvent(null);
        onRefresh();
      } else {
        alert('ลบโครงการไม่สำเร็จ: ' + data.error);
      }
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const handleSyncSheets = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sheets-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetName: 'Events' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('ซิงค์ข้อมูลกิจกรรมกับ Google Sheets สำเร็จ');
        onRefresh();
      } else {
        alert('ซิงค์ไม่สำเร็จ: ' + data.error);
      }
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportCsv = () => {
    if (filteredRegistrations.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }
    const headers = [
      'กลุ่ม',
      'เลขเฉพาะกลุ่ม',
      'รหัสนิสิต',
      'ชื่อ-นามสกุล',
      'ระดับการศึกษา',
      'หลักสูตรภาษา',
      'ชั้นปี',
      'สาขาวิชา',
      'พรรษา',
      'สถานะ',
      'กิจกรรม',
      'วันที่เข้าร่วม',
      'หมายเหตุ',
    ];
    const rowsData = filteredRegistrations.map((r) => [
      r.groupNumber || (r.groupName ? r.groupName.replace(/\D/g, '') : '-'),
      r.groupSpecificCode || '-',
      r.studentCode,
      r.studentName,
      r.degreeLevel || '-',
      r.programType || '-',
      r.yearLevel ? `ปี ${r.yearLevel}` : '-',
      r.major || '-',
      r.vasa || '-',
      r.status === 'ATTENDED' ? 'เข้าร่วมแล้ว' : 'ยังไม่เข้าร่วม',
      r.eventTitle || '-',
      r.attendedAt ? new Date(r.attendedAt).toLocaleDateString('th-TH') : '-',
      r.remarks || '-',
    ]);
    downloadCsvFile('รายชื่อผู้เข้าร่วมกิจกรรม.csv', headers, rowsData);
  };

  return {
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
    // Group Import Modal State
    groupImportEventId,
    setGroupImportEventId,
  };
}
