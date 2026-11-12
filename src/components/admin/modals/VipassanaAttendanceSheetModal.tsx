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
} from 'lucide-react';
import { StudentEvent, EventRegistration } from '@/types';

interface VipassanaAttendanceSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  registrations: EventRegistration[];
  onAttendanceSaved?: () => void;
}

type PeriodStatus = 'PRESENT' | 'LATE' | 'SICK' | 'ABSENT' | 'UNCHECKED';

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

  // Save attendance to server
  const handleSaveAttendance = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      const records = attendanceRows.map((row) => ({
        registrationId: row.registrationId,
        p1: { status: row.p1 },
        p2: { status: row.p2 },
        p3: { status: row.p3 },
        p4: { status: row.p4 },
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
    let riskCount = 0;

    attendanceRows.forEach((row) => {
      if (row.p1 === 'PRESENT' || row.p1 === 'LATE') p1Present++;
      if (row.p2 === 'PRESENT' || row.p2 === 'LATE') p2Present++;
      if (row.p3 === 'PRESENT' || row.p3 === 'LATE') p3Present++;
      if (row.p4 === 'PRESENT' || row.p4 === 'LATE') p4Present++;

      const absences = [row.p1, row.p2, row.p3, row.p4].filter((s) => s === 'ABSENT').length;
      if (absences >= 2) riskCount++;
    });

    return {
      total: attendanceRows.length,
      p1Present,
      p2Present,
      p3Present,
      p4Present,
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

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* View Switcher: Interactive vs Print */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('INTERACTIVE')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'INTERACTIVE'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
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
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                  <div className="text-[10px] text-slate-500">จำนวนนิสิตในกลุ่ม</div>
                  <div className="text-base font-extrabold text-slate-900 font-mono">{stats.total} รูป/คน</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
                  <div className="text-[10px] flex items-center justify-between">
                    <span>1. เช้ามืด (04.00-04.30)</span>
                    <button
                      type="button"
                      onClick={() => handleMarkAllPeriodPresent('p1')}
                      className="text-[9px] text-amber-700 hover:underline cursor-pointer font-bold"
                    >
                      [มาครบ]
                    </button>
                  </div>
                  <div className="text-base font-extrabold font-mono">{stats.p1Present} / {stats.total}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900">
                  <div className="text-[10px] flex items-center justify-between">
                    <span>2. เช้า (08.00-08.30)</span>
                    <button
                      type="button"
                      onClick={() => handleMarkAllPeriodPresent('p2')}
                      className="text-[9px] text-blue-700 hover:underline cursor-pointer font-bold"
                    >
                      [มาครบ]
                    </button>
                  </div>
                  <div className="text-base font-extrabold font-mono">{stats.p2Present} / {stats.total}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                  <div className="text-[10px] flex items-center justify-between">
                    <span>3. บ่าย (12.30-13.00)</span>
                    <button
                      type="button"
                      onClick={() => handleMarkAllPeriodPresent('p3')}
                      className="text-[9px] text-emerald-700 hover:underline cursor-pointer font-bold"
                    >
                      [มาครบ]
                    </button>
                  </div>
                  <div className="text-base font-extrabold font-mono">{stats.p3Present} / {stats.total}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900">
                  <div className="text-[10px] flex items-center justify-between">
                    <span>4. ค่ำ (17.30-18.00)</span>
                    <button
                      type="button"
                      onClick={() => handleMarkAllPeriodPresent('p4')}
                      className="text-[9px] text-purple-700 hover:underline cursor-pointer font-bold"
                    >
                      [มาครบ]
                    </button>
                  </div>
                  <div className="text-base font-extrabold font-mono">{stats.p4Present} / {stats.total}</div>
                </div>
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
                          <div>ภาคเช้ามืด</div>
                          <div className="text-[9.5px] font-mono text-slate-500 font-normal">04.00-04.30</div>
                        </th>
                        <th className="py-2.5 px-2 font-bold text-center bg-blue-50/70 border-r border-blue-200">
                          <div>ภาคเช้า</div>
                          <div className="text-[9.5px] font-mono text-slate-500 font-normal">08.00-08.30</div>
                        </th>
                        <th className="py-2.5 px-2 font-bold text-center bg-emerald-50/70 border-r border-emerald-200">
                          <div>ภาคบ่าย</div>
                          <div className="text-[9.5px] font-mono text-slate-500 font-normal">12.30-13.00</div>
                        </th>
                        <th className="py-2.5 px-2 font-bold text-center bg-purple-50/70 border-r border-purple-200">
                          <div>ภาคค่ำ</div>
                          <div className="text-[9.5px] font-mono text-slate-500 font-normal">17.30-18.00</div>
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
                              {periods.map(({ key, val }) => (
                                <td key={key} className="py-1.5 px-1.5 text-center align-middle">
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
                                </td>
                              ))}

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
            /* VIEW 2: OFFICIAL PRINTABLE A4 FORM (MATCHES USER'S PDF 100%) */
            <div className="flex flex-col items-center">
              {/* PRINT STYLES */}
              <style jsx global>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #official-a4-sheet, #official-a4-sheet * {
                    visibility: visible;
                  }
                  #official-a4-sheet {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    margin: 0;
                    padding: 0;
                  }
                }
              `}</style>

              {/* A4 PAPER CONTAINER */}
              <div
                id="official-a4-sheet"
                className="w-full max-w-[800px] bg-white border border-slate-300 p-8 sm:p-10 shadow-lg text-slate-900 font-serif leading-tight print:border-none print:shadow-none print:p-0"
              >
                {activeProgram === 'ENGLISH' ? (
                  /* ================= ENGLISH PROGRAM FORM ================= */
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="text-center space-y-1">
                      <h2 className="text-sm sm:text-base font-bold tracking-tight">
                        The Name List for the 1<sup>st</sup> - 4<sup>th</sup> students of the Faculty of Buddhism. (English Program)
                      </h2>
                      <h3 className="text-xs sm:text-sm font-semibold">
                        The Meditation Practice on December 11 - 22, 2025
                      </h3>
                      <p className="text-xs">AT Bodhiyanmahavijjalai, Nakhon Pathom</p>
                      <p className="text-xs pt-1">
                        Date( &nbsp; &nbsp;{selectedDayNumber ? 10 + selectedDayNumber : '..........'}&nbsp; &nbsp; / December / 2025 )
                      </p>
                    </div>

                    {/* Subhead: Group */}
                    <div className="flex items-center justify-between border-b-2 border-black pb-1">
                      <div className="text-base font-bold font-sans">
                        Group : {selectedGroup !== 'ALL' ? selectedGroup : '12'}
                      </div>
                    </div>

                    {/* Table */}
                    <table className="w-full border-collapse border border-black text-center text-[10.5px]">
                      <thead>
                        <tr className="border-b border-black">
                          <th rowSpan={2} className="border-r border-black p-1 w-8">No.</th>
                          <th rowSpan={2} className="border-r border-black p-1 w-16">Code</th>
                          <th rowSpan={2} className="border-r border-black p-1 text-left min-w-[150px]">Name/ Pali Name</th>
                          <th rowSpan={2} className="border-r border-black p-1 w-10">Vasa</th>
                          <th rowSpan={2} className="border-r border-black p-1 w-10">
                            <span className="block transform -rotate-90">Group</span>
                          </th>
                          <th colSpan={4} className="border-r border-black p-1 font-bold">
                            Signature
                          </th>
                          <th rowSpan={2} className="p-1 w-12">
                            <span className="block transform -rotate-90">Remark</span>
                          </th>
                        </tr>
                        <tr className="border-b border-black text-[9.5px]">
                          <th className="border-r border-black p-1 w-20">
                            <div>Dawn Period</div>
                            <div className="font-mono text-[8.5px]">04.00-04.30</div>
                          </th>
                          <th className="border-r border-black p-1 w-20">
                            <div>Morning Period</div>
                            <div className="font-mono text-[8.5px]">08.00-08.30</div>
                          </th>
                          <th className="border-r border-black p-1 w-20">
                            <div>Afternoon Period</div>
                            <div className="font-mono text-[8.5px]">12.30-13.00</div>
                          </th>
                          <th className="border-r border-black p-1 w-20">
                            <div>Evening Period</div>
                            <div className="font-mono text-[8.5px]">17.30-18.00</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {printBlankRows
                          ? Array.from({ length: 22 }, (_, idx) => (
                              <tr key={idx} className="border-b border-black/70 h-7">
                                <td className="border-r border-black/70 font-mono text-[9.5px]">{idx + 1}</td>
                                <td className="border-r border-black/70"></td>
                                <td className="border-r border-black/70"></td>
                                <td className="border-r border-black/70"></td>
                                <td className="border-r border-black/70">{selectedGroup !== 'ALL' ? selectedGroup : ''}</td>
                                <td className="border-r border-black/70"></td>
                                <td className="border-r border-black/70"></td>
                                <td className="border-r border-black/70"></td>
                                <td className="border-r border-black/70"></td>
                                <td></td>
                              </tr>
                            ))
                          : attendanceRows.map((row, idx) => (
                              <tr key={idx} className="border-b border-black/70 h-6.5 text-[10px]">
                                <td className="border-r border-black/70 font-mono text-[9.5px] p-0.5">{idx + 1}</td>
                                <td className="border-r border-black/70 font-mono p-0.5 font-semibold">{row.studentCode}</td>
                                <td className="border-r border-black/70 text-left px-1.5 p-0.5 truncate max-w-[180px]">
                                  {row.studentName}
                                </td>
                                <td className="border-r border-black/70 font-mono p-0.5">{row.vasa || '-'}</td>
                                <td className="border-r border-black/70 p-0.5">
                                  {row.groupNumber || (selectedGroup !== 'ALL' ? selectedGroup : '')}
                                </td>
                                <td className="border-r border-black/70 p-0.5 text-center">
                                  {row.p1 === 'PRESENT' ? '✓' : row.p1 === 'ABSENT' ? 'ขาด' : ''}
                                </td>
                                <td className="border-r border-black/70 p-0.5 text-center">
                                  {row.p2 === 'PRESENT' ? '✓' : row.p2 === 'ABSENT' ? 'ขาด' : ''}
                                </td>
                                <td className="border-r border-black/70 p-0.5 text-center">
                                  {row.p3 === 'PRESENT' ? '✓' : row.p3 === 'ABSENT' ? 'ขาด' : ''}
                                </td>
                                <td className="border-r border-black/70 p-0.5 text-center">
                                  {row.p4 === 'PRESENT' ? '✓' : row.p4 === 'ABSENT' ? 'ขาด' : ''}
                                </td>
                                <td className="p-0.5 text-left text-[9px] px-1 truncate">{row.remark || ''}</td>
                              </tr>
                            ))}
                      </tbody>
                    </table>

                    {/* Footer */}
                    <div className="pt-2 space-y-4 text-xs">
                      <div>
                        หมายเหตุ .......................................................................................................................................................................................
                      </div>

                      <div className="text-center pt-2 space-y-2">
                        <div className="font-bold">รับรองตามนี้</div>
                        <div className="text-[11px]">
                          ......................................................... ผู้ดูแลกลุ่ม ......... / ............ / ..........
                        </div>
                      </div>

                      {/* Footnote Rules */}
                      <div className="pt-4 border-t border-black/40 text-[9.5px] space-y-1">
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <div>• Please sign–in during the scheduled times above. Or you will not get credit for your ATTANDANCE !</div>
                            <div>• In order to get one full-day credit, you must sign in for 4 periods which can be done in different days.</div>
                          </div>
                          <span className="font-mono font-bold text-xs">1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ================= THAI PROGRAM FORM ================= */
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="text-center space-y-1">
                      <h2 className="text-sm sm:text-base font-bold tracking-tight">
                        บัญชีเช็คชื่อและเวลาปฏิบัติวิปัสสนากัมมัฏฐาน แต่ละวัน
                      </h2>
                      <h3 className="text-xs sm:text-sm font-semibold">
                        นิสิตคณะพุทธศาสตร์ ชั้นปีที่ 1 - 4 ปีการศึกษา 2568 (บรรพชิต)
                      </h3>
                      <p className="text-xs">ณ อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย ต.ศาลายา อ.พุทธมณฑล จ.นครปฐม</p>
                      <p className="text-xs pt-1">
                        วัน ........................... ที่ &nbsp; &nbsp;{selectedDayNumber ? 10 + selectedDayNumber : '..........'}&nbsp; &nbsp; เดือน ธันวาคม พ.ศ. 2568
                      </p>
                    </div>

                    {/* Subhead: Group and Big Number Watermark */}
                    <div className="flex items-center justify-between border-b-2 border-black pb-1">
                      <div className="text-base font-bold font-sans">
                        กลุ่มที่ : {selectedGroup !== 'ALL' ? selectedGroup : '3'}
                      </div>
                      <div className="text-2xl font-black font-sans px-2 border border-black rounded">
                        {selectedGroup !== 'ALL' ? selectedGroup : '3'}
                      </div>
                    </div>

                    {/* Table */}
                    <table className="w-full border-collapse border border-black text-center text-[10.5px]">
                      <thead>
                        <tr className="border-b border-black">
                          <th rowSpan={2} className="border-r border-black p-1 w-8">ที่</th>
                          <th rowSpan={2} className="border-r border-black p-1 w-16">รหัส</th>
                          <th rowSpan={2} className="border-r border-black p-1 text-left min-w-[150px]">ชื่อ ฉายา/นามสกุล</th>
                          <th rowSpan={2} className="border-r border-black p-1 w-10">
                            <span className="block transform -rotate-90">กลุ่ม</span>
                          </th>
                          <th colSpan={4} className="border-r border-black p-1 font-bold">
                            ลงชื่อ / ในแต่ละช่วงเวลา
                          </th>
                          <th rowSpan={2} className="p-1 w-16">
                            หมายเหตุ
                          </th>
                        </tr>
                        <tr className="border-b border-black text-[9.5px]">
                          <th className="border-r border-black p-1 w-20">
                            <div>ภาคเช้ามืด</div>
                            <div className="font-mono text-[8.5px]">04.00-04.30</div>
                          </th>
                          <th className="border-r border-black p-1 w-20">
                            <div>ภาคเช้า</div>
                            <div className="font-mono text-[8.5px]">08.00-08.30</div>
                          </th>
                          <th className="border-r border-black p-1 w-20">
                            <div>ภาคบ่าย</div>
                            <div className="font-mono text-[8.5px]">12.30-13.00</div>
                          </th>
                          <th className="border-r border-black p-1 w-20">
                            <div>ภาคค่ำ</div>
                            <div className="font-mono text-[8.5px]">17.30-18.00</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {printBlankRows
                          ? Array.from({ length: 22 }, (_, idx) => (
                              <tr key={idx} className="border-b border-black/70 h-7">
                                <td className="border-r border-black/70 font-mono text-[9.5px]">{idx + 1}</td>
                                <td className="border-r border-black/70"></td>
                                <td className="border-r border-black/70"></td>
                                <td className="border-r border-black/70">{selectedGroup !== 'ALL' ? selectedGroup : ''}</td>
                                <td className="border-r border-black/70"></td>
                                <td className="border-r border-black/70"></td>
                                <td className="border-r border-black/70"></td>
                                <td className="border-r border-black/70"></td>
                                <td></td>
                              </tr>
                            ))
                          : attendanceRows.map((row, idx) => (
                              <tr key={idx} className="border-b border-black/70 h-6.5 text-[10px]">
                                <td className="border-r border-black/70 font-mono text-[9.5px] p-0.5">{idx + 1}</td>
                                <td className="border-r border-black/70 font-mono p-0.5 font-semibold">{row.studentCode}</td>
                                <td className="border-r border-black/70 text-left px-1.5 p-0.5 truncate max-w-[180px]">
                                  {row.studentName}
                                </td>
                                <td className="border-r border-black/70 p-0.5">
                                  {row.groupNumber || (selectedGroup !== 'ALL' ? selectedGroup : '')}
                                </td>
                                <td className="border-r border-black/70 p-0.5 text-center">
                                  {row.p1 === 'PRESENT' ? '✓' : row.p1 === 'ABSENT' ? 'ขาด' : ''}
                                </td>
                                <td className="border-r border-black/70 p-0.5 text-center">
                                  {row.p2 === 'PRESENT' ? '✓' : row.p2 === 'ABSENT' ? 'ขาด' : ''}
                                </td>
                                <td className="border-r border-black/70 p-0.5 text-center">
                                  {row.p3 === 'PRESENT' ? '✓' : row.p3 === 'ABSENT' ? 'ขาด' : ''}
                                </td>
                                <td className="border-r border-black/70 p-0.5 text-center">
                                  {row.p4 === 'PRESENT' ? '✓' : row.p4 === 'ABSENT' ? 'ขาด' : ''}
                                </td>
                                <td className="p-0.5 text-left text-[9px] px-1 truncate">{row.remark || ''}</td>
                              </tr>
                            ))}
                      </tbody>
                    </table>

                    {/* Footer */}
                    <div className="pt-2 space-y-4 text-xs">
                      <div>
                        บันทึก.........................................................................................................................................................................................
                      </div>

                      <div className="text-center pt-2 space-y-2">
                        <div className="font-bold">รับรองตามนี้</div>
                        <div className="text-[11px]">
                          ................................................................./........................................................................... อาจารย์ประจำกลุ่ม กลุ่มที่ : {selectedGroup !== 'ALL' ? selectedGroup : '3'}
                        </div>
                      </div>

                      {/* Footnote Rules */}
                      <div className="pt-4 border-t border-black/40 text-[9.5px] space-y-1">
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <div>• นิสิตจะต้องลงชื่อตามช่วงเวลาที่กำหนดให้ข้างต้นนี้ หากไม่ลงชื่อตามช่วงเวลาที่กำหนด ถือว่าขาดในช่วงระยะเวลานั้น ๆ</div>
                            <div>• หากขาด ๔ ช่วงเวลา เท่ากับว่าขาด ๑ วัน และถือว่าไม่ผ่านการปฏิบัติ</div>
                          </div>
                          <span className="font-mono font-bold text-xs">1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
    </div>
  );
}
