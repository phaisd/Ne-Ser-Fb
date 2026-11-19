'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Search,
  Check,
  Save,
  FileSpreadsheet,
  Globe,
  Sparkles,
  ChevronRight,
  BookOpen,
  Camera,
  Timer,
  Pencil,
} from 'lucide-react';
import { StudentEvent, EventRegistration } from '@/types';
import { VipassanaBadgesModal } from './VipassanaBadgesModal';
import { VipassanaLiveScannerModal } from './VipassanaLiveScannerModal';
import { VipassanaAttendancePrintSheet } from './vipassana/VipassanaAttendancePrintSheet';

interface VipassanaAttendanceSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  registrations: EventRegistration[];
  onAttendanceSaved?: () => void;
}

type PeriodStatus = 'PRESENT' | 'LATE' | 'SICK' | 'ABSENT' | 'UNCHECKED';

export interface MeditationPeriodConfig {
  id: 'p1' | 'p2' | 'p3' | 'p4';
  nameTh: string;
  nameEn?: string;
  time: string;
}

export const DEFAULT_PERIODS: MeditationPeriodConfig[] = [
  { id: 'p1', nameTh: 'ภาคเช้ามืด', nameEn: 'Dawn Period', time: '04.00-04.30' },
  { id: 'p2', nameTh: 'ภาคเช้า', nameEn: 'Morning Period', time: '08.00-08.30' },
  { id: 'p3', nameTh: 'ภาคบ่าย', nameEn: 'Afternoon Period', time: '12.30-13.00' },
  { id: 'p4', nameTh: 'ภาคค่ำ', nameEn: 'Evening Period', time: '17.30-18.00' },
];

interface StudentAttendanceRow {
  registrationId: string;
  studentCode: string;
  studentName: string;
  vasa?: string | number;
  groupNumber?: number;
  groupName?: string;
  programType?: string;
  yearLevel?: number;
  major?: string;
  p1: PeriodStatus; // 04.00 - 04.30
  p2: PeriodStatus; // 08.00 - 08.30
  p3: PeriodStatus; // 12.30 - 13.00
  p4: PeriodStatus; // 17.30 - 18.00
  p1Time?: string;
  p2Time?: string;
  p3Time?: string;
  p4Time?: string;
  remark?: string;
}

export function VipassanaAttendanceSheetModal({
  isOpen,
  onClose,
  event,
  registrations,
  onAttendanceSaved,
}: VipassanaAttendanceSheetModalProps) {
  // 1. View mode: INTERACTIVE vs PRINT_PREVIEW
  const [viewMode, setViewMode] = useState<'INTERACTIVE' | 'PRINT_PREVIEW'>('INTERACTIVE');

  // 2. Filter states
  const [selectedGroup, setSelectedGroup] = useState<number | 'ALL'>(3);
  const [programMode, setProgramMode] = useState<'AUTO' | 'THAI' | 'ENGLISH'>('AUTO');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [printBlankRows, setPrintBlankRows] = useState(false);

  // 3. Local working copy of attendance for current day
  const dayKey = `day_${selectedDayNumber}`;
  const [attendanceState, setAttendanceState] = useState<Record<string, {
    p1: PeriodStatus;
    p2: PeriodStatus;
    p3: PeriodStatus;
    p4: PeriodStatus;
    remark?: string;
  }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sub-modal states for Live Scanner & Badges Generator
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);
  const [isLiveScannerOpen, setIsLiveScannerOpen] = useState(false);

  // Editable check-in times state & late threshold
  const [timeState, setTimeState] = useState<Record<string, {
    p1?: string;
    p2?: string;
    p3?: string;
    p4?: string;
  }>>({});
  const [lateGraceMinutes, setLateGraceMinutes] = useState<number>(15);

  // Editable Period Configurations (04.00-04.30, 08.00-08.30, etc.)
  const [periodSettings, setPeriodSettings] = useState<MeditationPeriodConfig[]>(() => {
    if (
      event.meditationConfig?.periods &&
      Array.isArray(event.meditationConfig.periods) &&
      event.meditationConfig.periods.length === 4
    ) {
      return event.meditationConfig.periods;
    }
    return DEFAULT_PERIODS;
  });
  const [isEditingPeriods, setIsEditingPeriods] = useState(false);
  const [isSavingPeriods, setIsSavingPeriods] = useState(false);

  const p1Conf = periodSettings.find((p) => p.id === 'p1') || DEFAULT_PERIODS[0];
  const p2Conf = periodSettings.find((p) => p.id === 'p2') || DEFAULT_PERIODS[1];
  const p3Conf = periodSettings.find((p) => p.id === 'p3') || DEFAULT_PERIODS[2];
  const p4Conf = periodSettings.find((p) => p.id === 'p4') || DEFAULT_PERIODS[3];

  const handleSavePeriodSettings = async () => {
    setIsSavingPeriods(true);
    try {
      const updatedConfig = {
        ...(event.meditationConfig || {}),
        periods: periodSettings,
      };
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_event',
          id: event.id,
          updates: {
            meditationConfig: updatedConfig,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        event.meditationConfig = updatedConfig;
        setIsEditingPeriods(false);
        setSaveSuccessMsg('บันทึกการแก้ไขช่วงเวลาทั้ง 4 รอบลงในโครงการสำเร็จ');
        setTimeout(() => setSaveSuccessMsg(null), 3500);
        if (onAttendanceSaved) onAttendanceSaved();
      } else {
        alert('บันทึกไม่สำเร็จ: ' + (data.error || 'Unknown error'));
      }
    } catch (e: unknown) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsSavingPeriods(false);
    }
  };

  // Available groups for this event
  const availableGroups = useMemo(() => {
    const groupNums = new Set<number>();
    registrations.forEach((r) => {
      if (r.groupNumber) groupNums.add(r.groupNumber);
      else if (r.groupName) {
        const m = r.groupName.match(/\d+/);
        if (m) groupNums.add(parseInt(m[0], 10));
      }
    });
    // Add default groups if none found
    if (groupNums.size === 0) {
      [1, 2, 3, 12].forEach((g) => groupNums.add(g));
    }
    return Array.from(groupNums).sort((a, b) => a - b);
  }, [registrations]);

  // Determine current active language/program
  const activeProgram = useMemo<'THAI' | 'ENGLISH'>(() => {
    if (programMode !== 'AUTO') return programMode;
    // Auto-detect based on selected group
    if (selectedGroup === 12) return 'ENGLISH';
    // Check registrations in this group
    const inGroup = registrations.filter((r) => r.groupNumber === selectedGroup);
    if (inGroup.some((r) => r.programType === 'ENGLISH')) return 'ENGLISH';
    return 'THAI';
  }, [programMode, selectedGroup, registrations]);

  // Filtered registrations for selected group & search
  const groupRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      // Group filter
      if (selectedGroup !== 'ALL') {
        const gNum = r.groupNumber || (r.groupName ? parseInt(r.groupName.replace(/\D/g, ''), 10) : 0);
        if (gNum !== selectedGroup) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = r.studentCode.toLowerCase().includes(q);
        const matchName = r.studentName.toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }
      return true;
    });
  }, [registrations, selectedGroup, searchQuery]);

  // Sync / Initialize attendanceState when group or day changes
  const attendanceRows: StudentAttendanceRow[] = useMemo(() => {
    return groupRegistrations.map((r) => {
      const savedForDay = r.dailyAttendance?.[dayKey];
      const localState = attendanceState[r.id];

      const p1 = (localState?.p1 || (savedForDay?.p1?.status as PeriodStatus) || 'PRESENT');
      const p2 = (localState?.p2 || (savedForDay?.p2?.status as PeriodStatus) || 'PRESENT');
      const p3 = (localState?.p3 || (savedForDay?.p3?.status as PeriodStatus) || 'PRESENT');
      const p4 = (localState?.p4 || (savedForDay?.p4?.status as PeriodStatus) || 'PRESENT');
      const p1Time = timeState[r.id]?.p1 !== undefined ? timeState[r.id]?.p1 : (savedForDay?.p1?.checkInTime || '');
      const p2Time = timeState[r.id]?.p2 !== undefined ? timeState[r.id]?.p2 : (savedForDay?.p2?.checkInTime || '');
      const p3Time = timeState[r.id]?.p3 !== undefined ? timeState[r.id]?.p3 : (savedForDay?.p3?.checkInTime || '');
      const p4Time = timeState[r.id]?.p4 !== undefined ? timeState[r.id]?.p4 : (savedForDay?.p4?.checkInTime || '');
      const remark = localState?.remark ?? r.remarks ?? '';

      return {
        registrationId: r.id,
        studentCode: r.studentCode,
        studentName: r.studentName,
        vasa: r.vasa || '',
        groupNumber: r.groupNumber || (r.groupName ? parseInt(r.groupName.replace(/\D/g, ''), 10) : undefined),
        groupName: r.groupName,
        programType: r.programType,
        yearLevel: r.yearLevel,
        major: r.major,
        p1,
        p2,
        p3,
        p4,
        p1Time,
        p2Time,
        p3Time,
        p4Time,
        remark,
      };
    });
  }, [groupRegistrations, dayKey, attendanceState]);

  // Handler to toggle / set a period status
  const handleSetPeriodStatus = (regId: string, period: 'p1' | 'p2' | 'p3' | 'p4', status: PeriodStatus) => {
    setAttendanceState((prev) => {
      const current = prev[regId] || {
        p1: 'PRESENT',
        p2: 'PRESENT',
        p3: 'PRESENT',
        p4: 'PRESENT',
      };
      return {
        ...prev,
        [regId]: {
          ...current,
          [period]: status,
        },
      };
    });
  };

  // Handler to set remark
  const handleSetRemark = (regId: string, remark: string) => {
    setAttendanceState((prev) => {
      const current = prev[regId] || {
        p1: 'PRESENT',
        p2: 'PRESENT',
        p3: 'PRESENT',
        p4: 'PRESENT',
      };
      return {
        ...prev,
        [regId]: {
          ...current,
          remark,
        },
      };
    });
  };

  // Mark all students present for a specific period
  const handleMarkAllPeriodPresent = (period: 'p1' | 'p2' | 'p3' | 'p4') => {
    setAttendanceState((prev) => {
      const updated = { ...prev };
      groupRegistrations.forEach((r) => {
        const current = updated[r.id] || {
          p1: 'PRESENT',
          p2: 'PRESENT',
          p3: 'PRESENT',
          p4: 'PRESENT',
        };
        updated[r.id] = {
          ...current,
          [period]: 'PRESENT',
        };
      });
      return updated;
    });
  };

  // Handler to set individual period time
  const handleSetPeriodTime = (regId: string, period: 'p1' | 'p2' | 'p3' | 'p4', timeStr: string) => {
    setTimeState((prev) => ({
      ...prev,
      [regId]: {
        ...prev[regId],
        [period]: timeStr,
      },
    }));
  };

  // Auto-evaluate late status based on check-in times
  const handleAutoEvaluateLate = () => {
    const periodStarts: Record<'p1' | 'p2' | 'p3' | 'p4', number> = {
      p1: 4 * 60,       // 04:00
      p2: 8 * 60,       // 08:00
      p3: 12 * 60 + 30, // 12:30
      p4: 17 * 60 + 30, // 17:30
    };

    setAttendanceState((prev) => {
      const updated = { ...prev };
      attendanceRows.forEach((row) => {
        const cur = updated[row.registrationId] || {
          p1: row.p1,
          p2: row.p2,
          p3: row.p3,
          p4: row.p4,
        };

        const evalPeriod = (pkey: 'p1' | 'p2' | 'p3' | 'p4') => {
          const tStr = (timeState[row.registrationId]?.[pkey] !== undefined
            ? timeState[row.registrationId]?.[pkey]
            : row[`${pkey}Time` as keyof StudentAttendanceRow]) as string;
          if (!tStr || !tStr.includes(':')) return cur[pkey];
          if (cur[pkey] === 'SICK') return 'SICK';
          const [h, m] = tStr.split(':').map(Number);
          const tTotal = (h || 0) * 60 + (m || 0);
          const startTotal = periodStarts[pkey];
          const diff = tTotal - startTotal;
          if (diff > lateGraceMinutes) return 'LATE';
          return 'PRESENT';
        };

        updated[row.registrationId] = {
          ...cur,
          p1: evalPeriod('p1'),
          p2: evalPeriod('p2'),
          p3: evalPeriod('p3'),
          p4: evalPeriod('p4'),
        };
      });
      return updated;
    });

    setSaveSuccessMsg(`ปรับสถานะ มา/สาย ให้ทุกคนตามเกณฑ์เวลาเกิน ${lateGraceMinutes} นาที เรียบร้อย`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Save attendance to server
  const handleSaveAttendance = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      const records = attendanceRows.map((row) => ({
        registrationId: row.registrationId,
        p1: { status: row.p1, checkInTime: row.p1Time },
        p2: { status: row.p2, checkInTime: row.p2Time },
        p3: { status: row.p3, checkInTime: row.p3Time },
        p4: { status: row.p4, checkInTime: row.p4Time },
        remark: row.remark,
      }));

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_vipassana_attendance',
          eventId: event.id,
          dayKey,
          records,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg(`บันทึกเวลาปฏิบัติธรรมวันที่ ${selectedDayNumber} (${records.length} รูป/คน) สำเร็จเรียบร้อย`);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
        if (onAttendanceSaved) onAttendanceSaved();
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + (data.error || 'Unknown error'));
      }
    } catch (e: unknown) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate stats for current day
  const stats = useMemo(() => {
    let p1Present = 0;
    let p2Present = 0;
    let p3Present = 0;
    let p4Present = 0;
    let sickCount = 0;
    let riskCount = 0;

    attendanceRows.forEach((row) => {
      if (row.p1 === 'PRESENT' || row.p1 === 'LATE') p1Present++;
      if (row.p2 === 'PRESENT' || row.p2 === 'LATE') p2Present++;
      if (row.p3 === 'PRESENT' || row.p3 === 'LATE') p3Present++;
      if (row.p4 === 'PRESENT' || row.p4 === 'LATE') p4Present++;

      const sicks = [row.p1, row.p2, row.p3, row.p4].filter((s) => s === 'SICK').length;
      if (sicks > 0) sickCount++;

      const absences = [row.p1, row.p2, row.p3, row.p4].filter((s) => s === 'ABSENT').length;
      if (absences >= 2) riskCount++;
    });

    return {
      total: attendanceRows.length,
      p1Present,
      p2Present,
      p3Present,
      p4Present,
      sickCount,
      riskCount,
    };
  }, [attendanceRows]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Container Card */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER (Hidden in Print) */}
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
                    // Clicking again toggles the 4-period edit panel so user always gets immediate action
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
                onClick={() => setViewMode('PRINT_PREVIEW')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'PRINT_PREVIEW'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>แบบฟอร์ม A4 พิมพ์</span>
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

            {/* Live Scanner & Badges Shortcuts in Header */}
            <button
              type="button"
              onClick={() => setIsLiveScannerOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="เปิดจุดสแกนเช็คชื่ออัตโนมัติ (กล้องมือถือ/ปืนสแกนบาร์โค้ด)"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📷 จุดสแกนสด</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBadgesModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="พิมพ์ป้ายชื่อคล้องคอพร้อม QR Code สำหรับนิสิต"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>🪪 พิมพ์ป้ายคล้องคอ</span>
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

        {/* CONTROLS TOOLBAR (Hidden in Print) */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Group Selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                กลุ่ม:
              </span>
              <select
                value={selectedGroup}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10);
                  setSelectedGroup(val);
                }}
                className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                {availableGroups.map((g) => (
                  <option key={g} value={g}>
                    {g === 12 ? `กลุ่มที่ 12 (English Program)` : `กลุ่มที่ ${g}`}
                  </option>
                ))}
                <option value="ALL">ทุกกลุ่ม (All)</option>
              </select>
            </div>

            {/* Language / Program Mode */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                แบบฟอร์ม:
              </span>
              <select
                value={programMode}
                onChange={(e) => setProgramMode(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-semibold text-slate-800 focus:outline-none"
              >
                <option value="AUTO">อัตโนมัติตามกลุ่ม</option>
                <option value="THAI">🇹🇭 ภาษาไทย (บรรพชิต/คฤหัสถ์)</option>
                <option value="ENGLISH">🌐 English Program</option>
              </select>
            </div>

            {/* Day Selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                วันที่ปฏิบัติ:
              </span>
              <select
                value={selectedDayNumber}
                onChange={(e) => setSelectedDayNumber(parseInt(e.target.value, 10))}
                className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    วันที่ {d} ({10 + d} ธันวาคม / Dec {10 + d})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box in interactive mode */}
            {viewMode === 'INTERACTIVE' && (
              <div className="relative min-w-[160px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหารหัส หรือชื่อนิสิต..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Live Scanner & Badges Shortcuts */}
            <button
              type="button"
              onClick={() => setIsLiveScannerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="เปิดจุดสแกนเช็คชื่ออัตโนมัติ (กล้องมือถือ/ปืนสแกนบาร์โค้ด)"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>จุดสแกนสด</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBadgesModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="พิมพ์ป้ายชื่อคล้องคอพร้อม QR Code สำหรับนิสิต"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>พิมพ์ป้ายคล้องคอ</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditingPeriods((v) => !v)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isEditingPeriods
                  ? 'bg-purple-700 text-white border-purple-700'
                  : 'border-purple-300 bg-white hover:bg-purple-50 text-purple-900'
              }`}
              title="แก้ไขช่วงเวลา 4 รอบ (เช่น 04.00-04.30) และบันทึกลงโครงการ"
            >
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>⚙️ แก้ไขช่วงเวลา 4 รอบ</span>
            </button>

            {viewMode === 'INTERACTIVE' ? (
              <>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveAttendance}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกเวลาปฏิบัติ'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('PRINT_PREVIEW')}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>ดูแบบฟอร์มพิมพ์ A4</span>
                </button>
              </>
            ) : (
              <>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer mr-2">
                  <input
                    type="checkbox"
                    checked={printBlankRows}
                    onChange={(e) => setPrintBlankRows(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>พิมพ์แบบฟอร์มเปล่า (สำหรับเซ็นสด)</span>
                </label>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>สั่งพิมพ์เอกสาร A4 (Print Now)</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* SUCCESS NOTIFICATION */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-900 flex items-center gap-2 print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* MODAL BODY (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {viewMode === 'INTERACTIVE' ? (
            /* VIEW 1: INTERACTIVE ATTENDANCE TABLE */
            <div className="space-y-4">
              {/* PERIOD TIMES EDIT DRAWER */}
              {isEditingPeriods && (
                <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50 border-2 border-purple-300 p-4 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-700" />
                      <h4 className="font-extrabold text-sm text-purple-950">
                        แก้ไขช่วงเวลาปฏิบัติธรรม 4 รอบ (จะอัปเดตลงในการ์ด, หัวตาราง, และเอกสารพิมพ์ A4):
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPeriodSettings(DEFAULT_PERIODS)}
                        className="text-xs text-purple-700 hover:underline cursor-pointer font-semibold"
                      >
                        [ใช้เวลามาตรฐานเดิม]
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingPeriods(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* P1 */}
                    <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-1.5">
                      <div className="font-bold text-amber-900 flex items-center justify-between">
                        <span>รอบที่ 1: เช้ามืด</span>
                        <span className="text-[10px] text-slate-400 font-mono">p1</span>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">ชื่อรอบ:</label>
                        <input
                          type="text"
                          value={periodSettings.find((p) => p.id === 'p1')?.nameTh || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPeriodSettings((prev) =>
                              prev.map((p) => (p.id === 'p1' ? { ...p, nameTh: val } : p))
                            );
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">ช่วงเวลา (เช่น 04.00-04.30):</label>
                        <input
                          type="text"
                          value={periodSettings.find((p) => p.id === 'p1')?.time || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPeriodSettings((prev) =>
                              prev.map((p) => (p.id === 'p1' ? { ...p, time: val } : p))
                            );
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-mono font-bold text-amber-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    {/* P2 */}
                    <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-2xs space-y-1.5">
                      <div className="font-bold text-blue-900 flex items-center justify-between">
                        <span>รอบที่ 2: เช้า</span>
                        <span className="text-[10px] text-slate-400 font-mono">p2</span>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">ชื่อรอบ:</label>
                        <input
                          type="text"
                          value={periodSettings.find((p) => p.id === 'p2')?.nameTh || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPeriodSettings((prev) =>
                              prev.map((p) => (p.id === 'p2' ? { ...p, nameTh: val } : p))
                            );
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">ช่วงเวลา (เช่น 08.00-08.30):</label>
                        <input
                          type="text"
                          value={periodSettings.find((p) => p.id === 'p2')?.time || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPeriodSettings((prev) =>
                              prev.map((p) => (p.id === 'p2' ? { ...p, time: val } : p))
                            );
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-mono font-bold text-blue-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    {/* P3 */}
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-1.5">
                      <div className="font-bold text-emerald-900 flex items-center justify-between">
                        <span>รอบที่ 3: บ่าย</span>
                        <span className="text-[10px] text-slate-400 font-mono">p3</span>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">ชื่อรอบ:</label>
                        <input
                          type="text"
                          value={periodSettings.find((p) => p.id === 'p3')?.nameTh || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPeriodSettings((prev) =>
                              prev.map((p) => (p.id === 'p3' ? { ...p, nameTh: val } : p))
                            );
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">ช่วงเวลา (เช่น 12.30-13.00):</label>
                        <input
                          type="text"
                          value={periodSettings.find((p) => p.id === 'p3')?.time || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPeriodSettings((prev) =>
                              prev.map((p) => (p.id === 'p3' ? { ...p, time: val } : p))
                            );
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    {/* P4 */}
                    <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-2xs space-y-1.5">
                      <div className="font-bold text-purple-900 flex items-center justify-between">
                        <span>รอบที่ 4: ค่ำ</span>
                        <span className="text-[10px] text-slate-400 font-mono">p4</span>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">ชื่อรอบ:</label>
                        <input
                          type="text"
                          value={periodSettings.find((p) => p.id === 'p4')?.nameTh || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPeriodSettings((prev) =>
                              prev.map((p) => (p.id === 'p4' ? { ...p, nameTh: val } : p))
                            );
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">ช่วงเวลา (เช่น 17.30-18.00):</label>
                        <input
                          type="text"
                          value={periodSettings.find((p) => p.id === 'p4')?.time || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPeriodSettings((prev) =>
                              prev.map((p) => (p.id === 'p4' ? { ...p, time: val } : p))
                            );
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-mono font-bold text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingPeriods(false)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer text-xs"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      disabled={isSavingPeriods}
                      onClick={handleSavePeriodSettings}
                      className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingPeriods ? 'กำลังบันทึก...' : 'บันทึกช่วงเวลาลงโครงการ'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Stat Summary Cards Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50 border border-purple-200 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="font-extrabold text-xs text-purple-950 flex items-center gap-1.5">
                      <span>ช่วงเวลาปฏิบัติธรรม 4 รอบต่อวัน</span>
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                        กำหนดเวลา 4 ภาค
                      </span>
                    </div>
                    <div className="text-[10.5px] text-purple-800 mt-0.5 font-medium">
                      1. เช้ามืด ({p1Conf.time}) • 2. เช้า ({p2Conf.time}) • 3. บ่าย ({p3Conf.time}) • 4. ค่ำ ({p4Conf.time})
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingPeriods((v) => !v)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{isEditingPeriods ? '✖ ปิดกล่องแก้ไข' : '⚙️ แก้ไขช่วงเวลา 4 รอบ'}</span>
                </button>
              </div>

              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                  <div className="text-[10px] text-slate-500">จำนวนนิสิตในกลุ่ม</div>
                  <div className="text-base font-extrabold text-slate-900 font-mono">{stats.total} รูป/คน</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
                  <div className="text-[10px] flex items-center justify-between gap-1 mb-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingPeriods(true)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-amber-300 text-amber-950 font-bold hover:bg-amber-100 cursor-pointer transition text-[10px]"
                      title="คลิกเพื่อแก้ไขช่วงเวลาภาคเช้ามืด"
                    >
                      <Pencil className="w-2.5 h-2.5 text-amber-700" />
                      <span>1. เช้ามืด ({p1Conf.time})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkAllPeriodPresent('p1')}
                      className="text-[9px] text-amber-700 hover:underline cursor-pointer font-bold shrink-0"
                    >
                      [มาครบ]
                    </button>
                  </div>
                  <div className="text-base font-extrabold font-mono">{stats.p1Present} / {stats.total}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900">
                  <div className="text-[10px] flex items-center justify-between gap-1 mb-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingPeriods(true)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-blue-300 text-blue-950 font-bold hover:bg-blue-100 cursor-pointer transition text-[10px]"
                      title="คลิกเพื่อแก้ไขช่วงเวลาภาคเช้า"
                    >
                      <Pencil className="w-2.5 h-2.5 text-blue-700" />
                      <span>2. เช้า ({p2Conf.time})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkAllPeriodPresent('p2')}
                      className="text-[9px] text-blue-700 hover:underline cursor-pointer font-bold shrink-0"
                    >
                      [มาครบ]
                    </button>
                  </div>
                  <div className="text-base font-extrabold font-mono">{stats.p2Present} / {stats.total}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                  <div className="text-[10px] flex items-center justify-between gap-1 mb-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingPeriods(true)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-950 font-bold hover:bg-emerald-100 cursor-pointer transition text-[10px]"
                      title="คลิกเพื่อแก้ไขช่วงเวลาภาคบ่าย"
                    >
                      <Pencil className="w-2.5 h-2.5 text-emerald-700" />
                      <span>3. บ่าย ({p3Conf.time})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkAllPeriodPresent('p3')}
                      className="text-[9px] text-emerald-700 hover:underline cursor-pointer font-bold shrink-0"
                    >
                      [มาครบ]
                    </button>
                  </div>
                  <div className="text-base font-extrabold font-mono">{stats.p3Present} / {stats.total}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900">
                  <div className="text-[10px] flex items-center justify-between gap-1 mb-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingPeriods(true)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-purple-300 text-purple-950 font-bold hover:bg-purple-100 cursor-pointer transition text-[10px]"
                      title="คลิกเพื่อแก้ไขช่วงเวลาภาคค่ำ"
                    >
                      <Pencil className="w-2.5 h-2.5 text-purple-700" />
                      <span>4. ค่ำ ({p4Conf.time})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkAllPeriodPresent('p4')}
                      className="text-[9px] text-purple-700 hover:underline cursor-pointer font-bold shrink-0"
                    >
                      [มาครบ]
                    </button>
                  </div>
                  <div className="text-base font-extrabold font-mono">{stats.p4Present} / {stats.total}</div>
                </div>
              </div>

              {/* Dynamic Late Evaluation Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-50/70 border border-purple-200/90 px-3.5 py-2.5 rounded-2xl text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <Timer className="w-4 h-4 text-purple-700 shrink-0" />
                  <span className="font-extrabold text-purple-950">
                    ปรับสถานะสายอัตโนมัติจากเวลาที่บันทึกไว้:
                  </span>
                  <span className="text-slate-600">หากเวลาเข้าเกิน</span>
                  <select
                    value={lateGraceMinutes}
                    onChange={(e) => setLateGraceMinutes(parseInt(e.target.value, 10))}
                    className="px-2 py-1 bg-white rounded-lg border border-purple-300 font-extrabold text-purple-950 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value={10}>10 นาที</option>
                    <option value={15}>15 นาที (มาตรฐาน)</option>
                    <option value={20}>20 นาที</option>
                    <option value={30}>30 นาที (ผ่อนปรน)</option>
                    <option value={45}>45 นาที</option>
                  </select>
                  <span className="text-slate-600 font-medium">จากเวลาเริ่มรอบ ➔ ปรับเป็น "สาย"</span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoEvaluateLate}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  title="คำนวณและปรับสถานะ มา/สาย ให้ทุกคนในกลุ่มตามเวลาที่บันทึกไว้ทันที"
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>คำนวณปรับสถานะสาย</span>
                </button>
              </div>

              {/* Attendance Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px]">
                        <th className="py-2.5 px-3 font-bold text-center w-12">ที่</th>
                        <th className="py-2.5 px-3 font-bold w-24">รหัส</th>
                        <th className="py-2.5 px-3 font-bold min-w-[180px]">ชื่อ ฉายา/นามสกุล</th>
                        <th className="py-2.5 px-2 font-bold text-center w-14">พรรษา</th>
                        <th className="py-2.5 px-2 font-bold text-center w-16">กลุ่ม</th>
                        <th className="py-2.5 px-2 font-bold text-center bg-amber-50/70 border-l border-r border-amber-200">
                          <div>{p1Conf.nameTh}</div>
                          <button
                            type="button"
                            onClick={() => setIsEditingPeriods(true)}
                            className="mt-0.5 inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-white/80 border border-amber-300 text-[9.5px] font-mono text-amber-950 font-bold cursor-pointer hover:bg-amber-100 transition shadow-2xs"
                            title="คลิกเพื่อแก้ไขช่วงเวลานี้"
                          >
                            <Pencil className="w-2.5 h-2.5 text-amber-700" />
                            <span>{p1Conf.time}</span>
                          </button>
                        </th>
                        <th className="py-2.5 px-2 font-bold text-center bg-blue-50/70 border-r border-blue-200">
                          <div>{p2Conf.nameTh}</div>
                          <button
                            type="button"
                            onClick={() => setIsEditingPeriods(true)}
                            className="mt-0.5 inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-white/80 border border-blue-300 text-[9.5px] font-mono text-blue-950 font-bold cursor-pointer hover:bg-blue-100 transition shadow-2xs"
                            title="คลิกเพื่อแก้ไขช่วงเวลานี้"
                          >
                            <Pencil className="w-2.5 h-2.5 text-blue-700" />
                            <span>{p2Conf.time}</span>
                          </button>
                        </th>
                        <th className="py-2.5 px-2 font-bold text-center bg-emerald-50/70 border-r border-emerald-200">
                          <div>{p3Conf.nameTh}</div>
                          <button
                            type="button"
                            onClick={() => setIsEditingPeriods(true)}
                            className="mt-0.5 inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-white/80 border border-emerald-300 text-[9.5px] font-mono text-emerald-950 font-bold cursor-pointer hover:bg-emerald-100 transition shadow-2xs"
                            title="คลิกเพื่อแก้ไขช่วงเวลานี้"
                          >
                            <Pencil className="w-2.5 h-2.5 text-emerald-700" />
                            <span>{p3Conf.time}</span>
                          </button>
                        </th>
                        <th className="py-2.5 px-2 font-bold text-center bg-purple-50/70 border-r border-purple-200">
                          <div>{p4Conf.nameTh}</div>
                          <button
                            type="button"
                            onClick={() => setIsEditingPeriods(true)}
                            className="mt-0.5 inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-white/80 border border-purple-300 text-[9.5px] font-mono text-purple-950 font-bold cursor-pointer hover:bg-purple-100 transition shadow-2xs"
                            title="คลิกเพื่อแก้ไขช่วงเวลานี้"
                          >
                            <Pencil className="w-2.5 h-2.5 text-purple-700" />
                            <span>{p4Conf.time}</span>
                          </button>
                        </th>
                        <th className="py-2.5 px-3 font-bold min-w-[120px]">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceRows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-slate-400">
                            ไม่พบนิสิตในกลุ่มนี้ หรือยังไม่มีการลงทะเบียน
                          </td>
                        </tr>
                      ) : (
                        attendanceRows.map((row, idx) => {
                          const periods: Array<{ key: 'p1' | 'p2' | 'p3' | 'p4'; val: PeriodStatus }> = [
                            { key: 'p1', val: row.p1 },
                            { key: 'p2', val: row.p2 },
                            { key: 'p3', val: row.p3 },
                            { key: 'p4', val: row.p4 },
                          ];

                          return (
                            <tr key={row.registrationId} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{row.studentCode}</td>
                              <td className="py-2.5 px-3 font-medium text-slate-900">
                                <div>{row.studentName}</div>
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {row.major ? `สาขา${row.major}` : ''} {row.yearLevel ? `ปี ${row.yearLevel}` : ''}
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-slate-600">{row.vasa || '-'}</td>
                              <td className="py-2.5 px-2 text-center">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {row.groupNumber || (selectedGroup !== 'ALL' ? selectedGroup : '-')}
                                </span>
                              </td>

                              {/* 4 Periods Status Selectors */}
                              {periods.map(({ key, val }) => {
                                const timeVal = row[`${key}Time` as keyof StudentAttendanceRow];
                                return (
                                  <td key={key} className="py-1.5 px-1.5 text-center align-middle">
                                    <div className="flex flex-col items-center justify-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleSetPeriodStatus(row.registrationId, key, 'PRESENT')}
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                            val === 'PRESENT'
                                              ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-700'
                                              : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700'
                                          }`}
                                          title="มา (Present)"
                                        >
                                          มา
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSetPeriodStatus(row.registrationId, key, 'LATE')}
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                            val === 'LATE'
                                              ? 'bg-amber-500 text-white shadow-2xs ring-1 ring-amber-600'
                                              : 'bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-700'
                                          }`}
                                          title="สาย (Late)"
                                        >
                                          สาย
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSetPeriodStatus(row.registrationId, key, 'SICK')}
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                            val === 'SICK'
                                              ? 'bg-blue-600 text-white shadow-2xs ring-1 ring-blue-700'
                                              : 'bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-700'
                                          }`}
                                          title="ป่วย (Sick)"
                                        >
                                          ป่วย
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSetPeriodStatus(row.registrationId, key, 'ABSENT')}
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                            val === 'ABSENT'
                                              ? 'bg-rose-600 text-white shadow-2xs ring-1 ring-rose-700'
                                              : 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-700'
                                          }`}
                                          title="ขาด (Absent)"
                                        >
                                          ขาด
                                        </button>
                                      </div>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <input
                                          type="text"
                                          value={timeVal || ''}
                                          onChange={(e) => handleSetPeriodTime(row.registrationId, key, e.target.value)}
                                          placeholder="--:--"
                                          className="w-14 text-center text-[9.5px] font-mono border border-slate-200 rounded px-1 py-0.2 bg-white text-slate-800 hover:border-purple-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-500/20"
                                          title="คลิกเพื่อแก้ไขเวลาเข้าจริง (เช่น 04:15 หรือ 04:15:00)"
                                        />
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}

                              {/* Remark Input */}
                              <td className="py-1.5 px-2">
                                <input
                                  type="text"
                                  value={row.remark}
                                  onChange={(e) => handleSetRemark(row.registrationId, e.target.value)}
                                  placeholder="บันทึก..."
                                  className="w-full px-2 py-1 text-[11px] rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-400"
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rules Alert Box */}
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 text-xs text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>เกณฑ์การประเมินการเข้าร่วมวิปัสสนากัมมัฏฐาน:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-700 text-[11px]">
                  <li>นิสิตจะต้องลงชื่อตามช่วงเวลาที่กำหนดให้ข้างต้นนี้ หากไม่ลงชื่อตามช่วงเวลาที่กำหนด ถือว่าขาดในช่วงระยะเวลานั้น ๆ</li>
                  <li><strong>หากขาด ๔ ช่วงเวลา เท่ากับว่าขาด ๑ วัน และถือว่าไม่ผ่านการปฏิบัติ</strong></li>
                  <li>In order to get one full-day credit, you must sign in for 4 periods which can be done in different days.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* VIEW 2: OFFICIAL PRINTABLE A4 FORM */
            <VipassanaAttendancePrintSheet
              activeProgram={activeProgram}
              selectedDayNumber={selectedDayNumber}
              selectedGroup={selectedGroup}
              p1Conf={p1Conf}
              p2Conf={p2Conf}
              p3Conf={p3Conf}
              p4Conf={p4Conf}
              printBlankRows={printBlankRows}
              attendanceRows={attendanceRows}
            />
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0 print:hidden">
          <div className="text-slate-500">
            แสดงนิสิตทั้งหมด <strong>{attendanceRows.length}</strong> รายการ • วันที่ {selectedDayNumber} ({dayKey})
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer transition"
            >
              ปิดหน้าต่าง
            </button>
            {viewMode === 'INTERACTIVE' && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveAttendance}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกเวลาปฏิบัติ'}</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Badges Modal */}
      {isBadgesModalOpen && (
        <VipassanaBadgesModal
          isOpen={isBadgesModalOpen}
          onClose={() => setIsBadgesModalOpen(false)}
          event={event}
          registrations={registrations}
        />
      )}

      {/* Live Scanner Modal */}
      {isLiveScannerOpen && (
        <VipassanaLiveScannerModal
          isOpen={isLiveScannerOpen}
          onClose={() => setIsLiveScannerOpen(false)}
          event={event}
          registrations={registrations}
          onCheckInRecorded={() => {
            if (onAttendanceSaved) onAttendanceSaved();
          }}
        />
      )}
    </div>
  );
}
