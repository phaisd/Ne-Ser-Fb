'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  XCircle,
  Save,
  Search,
  Filter,
  Users,
  Calendar,
  Sparkles,
  Award,
  ChevronDown,
  Info,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import type { StudentEvent, EventRegistration, SatipatthanaChecklist } from '@/types/event';
import { VipassanaInterviewCardView, EditableInterviewRow, VipassanaGroupAssignmentModal } from './vipassana';

interface VipassanaInterviewSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  registrations: EventRegistration[];
  onSaved?: () => void;
}

const CHECKLIST_FIELDS: Array<{
  key: keyof SatipatthanaChecklist;
  labelTh: string;
  labelEn: string;
  group: 'KAYA_MAIN' | 'KAYA_SUB' | 'VEDANA' | 'CITTA' | 'DHAMMA';
}> = [
  // กายานุปัสสนา - อิริยาบถหลัก
  { key: 'standing', labelTh: 'ขณยืน', labelEn: 'Standing', group: 'KAYA_MAIN' },
  { key: 'walking', labelTh: 'ขณะเดิน', labelEn: 'Walking', group: 'KAYA_MAIN' },
  { key: 'sitting', labelTh: 'ขณะนั่ง', labelEn: 'Sitting', group: 'KAYA_MAIN' },
  { key: 'lying', labelTh: 'ขณะนอน', labelEn: 'Lying', group: 'KAYA_MAIN' },
  // กายานุปัสสนา - อิริยาบถย่อย
  { key: 'bathing', labelTh: 'สรงน้ำ', labelEn: 'Bath', group: 'KAYA_SUB' },
  { key: 'dressing', labelTh: 'นุ่งห่ม', labelEn: 'Dress', group: 'KAYA_SUB' },
  { key: 'eating', labelTh: 'ฉัน', labelEn: 'Eat', group: 'KAYA_SUB' },
  { key: 'toileting', labelTh: 'ขับถ่าย', labelEn: 'Toilet', group: 'KAYA_SUB' },
  { key: 'others', labelTh: 'อื่นๆ', labelEn: 'Others', group: 'KAYA_SUB' },
  // เวทนานุปัสสนา (ขณะยืน/นั่ง)
  { key: 'sukha', labelTh: 'สุข', labelEn: 'Happy', group: 'VEDANA' },
  { key: 'dukkha', labelTh: 'ทุกข์', labelEn: 'Suffer', group: 'VEDANA' },
  { key: 'upekkha', labelTh: 'เฉยๆ', labelEn: 'Neutral', group: 'VEDANA' },
  // จิตตานุปัสสนา (ขณะปฏิบัติ)
  { key: 'raga', labelTh: 'ราคะ', labelEn: 'Greed', group: 'CITTA' },
  { key: 'dosa', labelTh: 'โทสะ', labelEn: 'Hatred', group: 'CITTA' },
  { key: 'moha', labelTh: 'โมหะ', labelEn: 'Delusion', group: 'CITTA' },
  // ธัมมานุปัสสนา (ขณะปฏิบัติเกิด)
  { key: 'nivarana5', labelTh: 'นิวรณ์ 5', labelEn: '5 Hindrances', group: 'DHAMMA' },
  { key: 'ayatana6', labelTh: 'อายตนะ 6', labelEn: '6 Ayatanas', group: 'DHAMMA' },
];

export const VipassanaInterviewSheetModal: React.FC<VipassanaInterviewSheetModalProps> = ({
  isOpen,
  onClose,
  event,
  registrations,
  onSaved,
}) => {
  const [programMode, setProgramMode] = useState<'AUTO' | 'THAI' | 'ENGLISH'>('AUTO');
  const [selectedGroup, setSelectedGroup] = useState<number | 'ALL'>('ALL');

  const isEnglishProgram = useMemo(() => {
    if (programMode === 'ENGLISH') return true;
    if (programMode === 'THAI') return false;
    return (
      event.targetProgram === 'ENGLISH' ||
      event.title.toLowerCase().includes('inter') ||
      selectedGroup === 12
    );
  }, [programMode, event, selectedGroup]);

  const [selectedSession, setSelectedSession] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [meditationMaster, setMeditationMaster] = useState('');
  const [sessionDate, setSessionDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Responsive View Mode: CARD (Mobile-first touch) vs TABLE (Wide desktop grid)
  const [layoutMode, setLayoutMode] = useState<'CARD' | 'TABLE'>('CARD');

  const [rows, setRows] = useState<Record<string, EditableInterviewRow>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGroupAssignmentModalOpen, setIsGroupAssignmentModalOpen] = useState(false);

  // Group Vipassana Masters from MeditationConfig
  const currentGroupMasters = useMemo(() => {
    if (selectedGroup === 'ALL') return [];
    const gKey = String(selectedGroup);
    return event.meditationConfig?.groupAssignments?.[gKey]?.vipassanaMasters || [];
  }, [selectedGroup, event.meditationConfig?.groupAssignments]);

  // Auto-fill master name if empty and group has assigned masters
  useEffect(() => {
    if (currentGroupMasters.length > 0 && !meditationMaster.trim()) {
      setMeditationMaster(currentGroupMasters[0]);
    }
  }, [currentGroupMasters, meditationMaster]);

  // Available groups
  const availableGroups = useMemo(() => {
    const setG = new Set<number>();
    registrations.forEach((r) => {
      const gNum = r.groupNumber || (r.groupName ? parseInt(r.groupName.replace(/\D/g, ''), 10) : 0);
      if (gNum && gNum > 0) setG.add(gNum);
    });
    return Array.from(setG).sort((a, b) => a - b);
  }, [registrations]);

  // Set default group to first group if available
  useEffect(() => {
    if (availableGroups.length > 0 && selectedGroup === 'ALL') {
      setSelectedGroup(availableGroups[0]);
    }
  }, [availableGroups, selectedGroup]);

  // Initialize row data from registrations when session or registrations change
  useEffect(() => {
    const sessionKey = `s${selectedSession}`;
    const nextRows: Record<string, EditableInterviewRow> = {};

    registrations.forEach((r) => {
      const savedInterview = r.vipassanaInterviews?.[sessionKey];
      const gNum = r.groupNumber || (r.groupName ? parseInt(r.groupName.replace(/\D/g, ''), 10) : undefined);

      nextRows[r.id] = {
        regId: r.id,
        studentCode: r.studentCode,
        groupSpecificCode: r.groupSpecificCode,
        studentName: r.studentName,
        age: r.age,
        vasa: r.vasa,
        groupNumber: gNum,
        major: r.major,
        yearLevel: r.yearLevel,
        programType: r.programType,
        checklist: savedInterview?.checklist ? { ...savedInterview.checklist } : {},
        result: savedInterview?.result || 'PENDING',
        remarks: savedInterview?.remarks || '',
      };

      if (!meditationMaster && savedInterview?.meditationMasterName) {
        setMeditationMaster(savedInterview.meditationMasterName);
      }
      if (savedInterview?.date) {
        setSessionDate(savedInterview.date);
      }
    });

    setRows(nextRows);
  }, [registrations, selectedSession]);

  // Filtered rows by group and search query
  const filteredRows = useMemo(() => {
    const list = Object.values(rows);
    return list.filter((r) => {
      const matchGroup = selectedGroup === 'ALL' || r.groupNumber === selectedGroup;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        r.studentCode.toLowerCase().includes(q) ||
        (r.groupSpecificCode && r.groupSpecificCode.toLowerCase().includes(q)) ||
        r.studentName.toLowerCase().includes(q);

      return matchGroup && matchQuery;
    });
  }, [rows, selectedGroup, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredRows.length;
    const passed = filteredRows.filter((r) => r.result === 'PASS').length;
    const notPassed = filteredRows.filter((r) => r.result === 'NOT_PASS').length;
    const pending = total - passed - notPassed;
    return { total, passed, notPassed, pending };
  }, [filteredRows]);

  if (!isOpen) return null;

  // Toggle checklist value: null/undefined -> true (/) -> false (X) -> undefined
  const handleToggleCheck = (regId: string, field: keyof SatipatthanaChecklist) => {
    setRows((prev) => {
      const current = prev[regId];
      if (!current) return prev;
      const currentVal = current.checklist[field];
      let nextVal: boolean | undefined;

      if (currentVal === true) {
        nextVal = false; // X
      } else if (currentVal === false) {
        nextVal = undefined; // blank
      } else {
        nextVal = true; // /
      }

      return {
        ...prev,
        [regId]: {
          ...current,
          checklist: {
            ...current.checklist,
            [field]: nextVal,
          },
        },
      };
    });
  };

  const handleSetResult = (regId: string, result: 'PASS' | 'NOT_PASS' | 'PENDING') => {
    setRows((prev) => {
      const current = prev[regId];
      if (!current) return prev;
      return {
        ...prev,
        [regId]: {
          ...current,
          result,
        },
      };
    });
  };

  const handleUpdateRemarks = (regId: string, remarks: string) => {
    setRows((prev) => {
      const current = prev[regId];
      if (!current) return prev;
      return {
        ...prev,
        [regId]: {
          ...current,
          remarks,
        },
      };
    });
  };

  // Quick action: Pass all main Kaya for a specific practitioner
  const handleQuickPassKaya = (regId: string) => {
    setRows((prev) => {
      const current = prev[regId];
      if (!current) return prev;
      return {
        ...prev,
        [regId]: {
          ...current,
          checklist: {
            ...current.checklist,
            standing: true,
            walking: true,
            sitting: true,
            lying: true,
          },
        },
      };
    });
  };

  // Bulk actions: Set all filtered to PASS
  const handleBulkPass = () => {
    setRows((prev) => {
      const next = { ...prev };
      filteredRows.forEach((r) => {
        if (next[r.regId]) {
          next[r.regId] = {
            ...next[r.regId],
            result: 'PASS',
          };
        }
      });
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const entries = Object.values(rows).map((r) => ({
        registrationId: r.regId,
        checklist: r.checklist,
        result: r.result,
        remarks: r.remarks,
      }));

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_vipassana_interview',
          eventId: event.id,
          sessionNumber: selectedSession,
          sessionDate,
          meditationMasterName: meditationMaster,
          entries,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ไม่สามารถบันทึกข้อมูลได้');
      }

      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-[98vw] 2xl:max-w-7xl h-[98vh] sm:max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header - Screen only */}
        <div className="print:hidden px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-sm sm:text-lg font-black tracking-tight text-amber-50 truncate">
                  แบบสอบอารมณ์สติปัฏฐาน 4
                </h3>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-400 text-amber-950 shrink-0">
                  {isEnglishProgram ? 'Inter' : 'ไทย / บรรพชิต'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-200/90 truncate max-w-sm sm:max-w-xl">
                {event.title} • อาคารโพธิญาณมหาวิชชาลัย
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1 transition border border-white/20 cursor-pointer shadow-xs"
              title="พิมพ์เอกสาร A4 แนวนอน"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">พิมพ์ A4 แนวนอน</span>
              <span className="sm:hidden">พิมพ์</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Controls Toolbar - Screen only */}
        <div className="print:hidden px-3 sm:px-6 py-2.5 sm:py-3 bg-amber-50/70 border-b border-amber-200/60 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs shrink-0 overflow-x-auto">
          {/* Row 1: Session tabs & Group & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Session selector */}
            <div className="flex items-center bg-white p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-amber-300/80 shadow-xs">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSelectedSession(num)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs transition cursor-pointer ${
                    selectedSession === num
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-900 hover:bg-amber-50'
                  }`}
                >
                  ครั้งที่ {num}
                </button>
              ))}
            </div>

            {/* Group selector */}
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-amber-300/80 shadow-xs text-xs">
              <Users className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="font-bold text-amber-900">กลุ่ม:</span>
              <select
                value={selectedGroup}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedGroup(v === 'ALL' ? 'ALL' : parseInt(v, 10));
                }}
                className="bg-transparent font-bold text-amber-900 outline-none cursor-pointer"
              >
                <option value="ALL">ทุกกลุ่ม ({availableGroups.length})</option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>
                    {g === 12 ? 'กลุ่ม 12 (English)' : `กลุ่ม ${g}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Language / Program Mode */}
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-amber-300/80 shadow-xs text-xs">
              <span className="font-bold text-amber-900">แบบฟอร์ม:</span>
              <select
                value={programMode}
                onChange={(e) => setProgramMode(e.target.value as any)}
                className="bg-transparent font-bold text-amber-900 outline-none cursor-pointer"
              >
                <option value="AUTO">อัตโนมัติ ({isEnglishProgram ? 'Inter' : 'ไทย'})</option>
                <option value="THAI">🇹🇭 ภาษาไทย (บรรพชิต)</option>
                <option value="ENGLISH">🌐 English (Inter)</option>
              </select>
            </div>

            {/* Search input */}
            <div className="relative flex-1 sm:flex-initial min-w-[130px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหารหัส / ชื่อ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-xl border border-slate-300 bg-white text-xs w-full sm:w-44 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Row 2: Master Name, Date & Mode Selector */}
          <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-300 text-xs shadow-2xs">
              <span className="font-semibold text-slate-600 text-[10.5px]">พระวิปัสสนาจารย์:</span>
              <input
                type="text"
                placeholder="ระบุชื่ออาจารย์..."
                value={meditationMaster}
                onChange={(e) => setMeditationMaster(e.target.value)}
                className="text-xs font-bold text-amber-950 outline-none w-28 sm:w-36"
              />
            </div>

            {/* Quick 1-Click Master selection pills if group has multiple masters */}
            {currentGroupMasters.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10.5px] text-slate-500 font-medium hidden lg:inline">พระประจำกลุ่ม:</span>
                {currentGroupMasters.map((mName, mIdx) => {
                  const isSelected = meditationMaster.trim() === mName.trim();
                  return (
                    <button
                      key={mIdx}
                      type="button"
                      onClick={() => setMeditationMaster(mName)}
                      className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-2xs font-bold'
                          : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100'
                      }`}
                      title={`คลิกเลือก "${mName}" เป็นผู้สอบอารมณ์`}
                    >
                      <span>🧘</span>
                      <span className="truncate max-w-[130px]">{mName}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Manage Group Masters Button */}
            <button
              type="button"
              onClick={() => setIsGroupAssignmentModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
              title="เปิดหน้าต่างมอบหมายอาจารย์และพระวิปัสสนาจารย์ประจำกลุ่ม"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>👥 จัดการพระประจำกลุ่ม</span>
            </button>

            {/* Bulk pass button */}
            <button
              type="button"
              onClick={handleBulkPass}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
              title="ตั้งผลการปฏิบัติผ่านทุกคนในกลุ่มที่แสดงอยู่"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>ผ่านกลุ่มนี้ทั้งหมด</span>
            </button>
          </div>
        </div>

        {/* View Layout Toggle Bar & Stats Bar - Screen only */}
        <div className="print:hidden px-3 sm:px-6 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 shrink-0">
          {/* Mobile-Friendly Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-200/90 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setLayoutMode('CARD')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                layoutMode === 'CARD'
                  ? 'bg-white text-amber-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="โหมดการ์ดประเมินรายรูป: เหมาะสำหรับสมาร์ทโฟน/แท็บเล็ต แตะง่ายไม่เลื่อนจอไปมา"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-600" />
              <span>📱 การ์ดรายรูป (มือถือ)</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('TABLE')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                layoutMode === 'TABLE'
                  ? 'bg-white text-amber-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="โหมดตารางรวม 24 ช่อง: เหมาะสำหรับจอคอมพิวเตอร์และเทียบกับใบกระดาษ A4"
            >
              <TableIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>📋 ตาราง 24 ช่อง (Desktop)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 font-semibold text-[10.5px] sm:text-xs">
            <span>
              รวม: <strong className="font-bold text-slate-900">{stats.total}</strong> รูป/คน
            </span>
            <span className="text-emerald-700">
              ผ่าน: <strong>{stats.passed}</strong>
            </span>
            <span className="text-red-700">
              ไม่ผ่าน: <strong>{stats.notPassed}</strong>
            </span>
            <span className="text-amber-700">
              รอประเมิน: <strong>{stats.pending}</strong>
            </span>
          </div>
        </div>

        {/* Scrollable Main Assessment Area */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 print:p-0 print:overflow-visible bg-slate-50/30">
          {/* Printable Document Header (Visible ONLY when printed) */}
          {isEnglishProgram ? (
            <div className="hidden print:block mb-3 text-center">
              <h2 className="text-base font-extrabold text-black uppercase">
                The Name List for the 1<sup>ST</sup> - 4<sup>th</sup> students of the faculty of Buddhism. (Inter)
              </h2>
              <h3 className="text-sm font-bold text-black mt-0.5">
                The Insight Meditation Practice, {new Date().getFullYear()}
              </h3>
              <p className="text-xs font-semibold text-black">
                AT Bodhiyanmahavijjalai, Nakhon Pathom
              </p>
              <div className="grid grid-cols-2 border border-black mt-2 text-xs font-bold divide-x divide-black text-left">
                <div className="p-1.5 flex items-center justify-between">
                  <span className="text-sm font-black">25Group : {selectedGroup === 'ALL' ? 'All' : selectedGroup}</span>
                  <span className="font-normal text-[10.5px]">Exam Session #{selectedSession}</span>
                </div>
                <div className="p-1.5 text-right space-y-0.5">
                  <div>Name: <strong>{meditationMaster || '...................................................'}</strong> : Meditation Master</div>
                  <div className="font-normal text-[10px]">Date: ({sessionDate || '......../............/...........'}) (At Bodhiyanmahavijjalai)</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden print:block mb-3 text-center">
              <h2 className="text-base font-extrabold text-black">
                แบบสอบอารมณ์สติปัฏฐาน 4 ของนิสิตคณะพุทธศาสตร์ (บรรพชิต)
              </h2>
              <h3 className="text-sm font-bold text-black mt-0.5">
                โครงการปฏิบัติวิปัสสนากัมมัฏฐาน {event.startDate && event.endDate ? `วันที่ ${event.startDate} - ${event.endDate}` : 'ประจำปี'}
              </h3>
              <p className="text-xs font-semibold text-black">
                ณ อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย ต.ศาลายา อ.พุทธมณฑล จ.นครปฐม
              </p>
              <div className="text-xs font-semibold mt-1">
                สอบอารมณ์วันที่ {sessionDate ? new Date(sessionDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '......... เดือน ................... พ.ศ. ...........'} ครั้งที่ : {selectedSession}
              </div>
              <div className="flex items-center justify-between text-xs font-bold mt-2 px-2 border-b-2 border-black pb-1">
                <span>กลุ่มที่ : {selectedGroup === 'ALL' ? 'ทั้งหมด' : selectedGroup}</span>
                <span>พระวิปัสสนาจารย์ : {meditationMaster || '..................................................................................'}</span>
                <span>ครั้งที่ : {selectedSession}</span>
              </div>
            </div>
          )}

          {/* VIEW 1: MOBILE CARD VIEW (Active when layoutMode === 'CARD', hidden on print) */}
          {layoutMode === 'CARD' && (
            <div className="print:hidden">
              <VipassanaInterviewCardView
                rows={filteredRows}
                isEnglishProgram={isEnglishProgram}
                onToggleCheck={handleToggleCheck}
                onSetResult={handleSetResult}
                onUpdateRemarks={handleUpdateRemarks}
                onQuickPassKaya={handleQuickPassKaya}
              />
            </div>
          )}

          {/* VIEW 2: 24-COLUMN TABLE VIEW (Active when layoutMode === 'TABLE' OR when printing) */}
          <div
            className={`${
              layoutMode === 'CARD' ? 'hidden print:block' : 'block'
            } border border-slate-300 rounded-2xl overflow-hidden shadow-xs print:border-black print:rounded-none bg-white`}
          >
            <table className="w-full border-collapse text-left text-[11px] print:text-[9.5px]">
              {/* Complex Table Header matching official PDF */}
              <thead className="bg-slate-100 text-slate-800 font-bold print:bg-white print:text-black">
                {/* Row 1: Main Category Groups */}
                <tr className="border-b border-slate-300 print:border-black text-center divide-x divide-slate-200 print:divide-black">
                  <th rowSpan={3} className="px-2 py-1 w-12 text-center">
                    ที่ (No.)
                  </th>
                  <th rowSpan={3} className="px-3 py-1 min-w-[150px] text-left">
                    ชื่อ ฉายา/นามสกุล (Name/Pali Name)
                  </th>
                  <th rowSpan={3} className="px-1.5 py-1 w-10 text-center">
                    อายุ
                  </th>
                  <th rowSpan={3} className="px-1.5 py-1 w-10 text-center">
                    พรรษา
                  </th>
                  <th rowSpan={3} className="px-1.5 py-1 w-10 text-center">
                    กลุ่ม
                  </th>
                  <th rowSpan={3} className="px-2 py-1 w-16 text-center">
                    ชั้นปี/สาขา
                  </th>
                  {/* Satipatthana 4 Groups */}
                  <th
                    colSpan={9}
                    className="px-2 py-1 bg-amber-100/60 print:bg-white font-extrabold text-amber-950 print:text-black"
                  >
                    กายานุปัสสนาสติปัฏฐาน (Kayanupassa-satipatthana)
                  </th>
                  <th
                    colSpan={3}
                    className="px-2 py-1 bg-blue-100/60 print:bg-white font-extrabold text-blue-950 print:text-black"
                  >
                    เวทนาฯ (Vedana)
                  </th>
                  <th
                    colSpan={3}
                    className="px-2 py-1 bg-purple-100/60 print:bg-white font-extrabold text-purple-950 print:text-black"
                  >
                    จิตตาฯ (Citta)
                  </th>
                  <th
                    colSpan={2}
                    className="px-2 py-1 bg-rose-100/60 print:bg-white font-extrabold text-rose-950 print:text-black"
                  >
                    ธัมมาฯ (Dhamma)
                  </th>
                  <th
                    colSpan={2}
                    className="px-2 py-1 bg-emerald-100/60 print:bg-white font-extrabold text-emerald-950 print:text-black"
                  >
                    ผลการปฏิบัติ ครั้งที่ {selectedSession}
                  </th>
                  <th rowSpan={3} className="px-3 py-1 min-w-[120px] text-left">
                    หมายเหตุ / ข้อแนะนำ
                  </th>
                </tr>

                {/* Row 2: Sub-Groups */}
                <tr className="border-b border-slate-300 print:border-black text-center divide-x divide-slate-200 print:divide-black text-[10px] print:text-[8.5px]">
                  <th colSpan={4} className="py-0.5 bg-amber-50 print:bg-white">
                    อิริยาบถหลัก (Main)
                  </th>
                  <th colSpan={5} className="py-0.5 bg-amber-50/70 print:bg-white">
                    อิริยาบถย่อย (Activities)
                  </th>
                  <th colSpan={3} className="py-0.5 bg-blue-50 print:bg-white">
                    ขณะยืน/นั่ง
                  </th>
                  <th colSpan={3} className="py-0.5 bg-purple-50 print:bg-white">
                    ขณะปฏิบัติ
                  </th>
                  <th colSpan={2} className="py-0.5 bg-rose-50 print:bg-white">
                    ขณะปฏิบัติเกิด
                  </th>
                  <th
                    rowSpan={2}
                    className="py-1 w-12 bg-emerald-50 text-emerald-800 print:bg-white print:text-black"
                  >
                    ผ่าน
                  </th>
                  <th
                    rowSpan={2}
                    className="py-1 w-12 bg-red-50 text-red-800 print:bg-white print:text-black"
                  >
                    ไม่ผ่าน
                  </th>
                </tr>

                {/* Row 3: Individual Check Items */}
                <tr className="border-b border-slate-300 print:border-black text-center divide-x divide-slate-200 print:divide-black text-[9.5px] print:text-[8px]">
                  {/* Kaya Main */}
                  <th className="py-1 w-8">ขณยืน</th>
                  <th className="py-1 w-8">ขณะเดิน</th>
                  <th className="py-1 w-8">ขณะนั่ง</th>
                  <th className="py-1 w-8">ขณะนอน</th>
                  {/* Kaya Sub */}
                  <th className="py-1 w-8">สรงน้ำ</th>
                  <th className="py-1 w-8">นุ่งห่ม</th>
                  <th className="py-1 w-8">ฉัน</th>
                  <th className="py-1 w-8">ขับถ่าย</th>
                  <th className="py-1 w-8">อื่นๆ</th>
                  {/* Vedana */}
                  <th className="py-1 w-8">สุข</th>
                  <th className="py-1 w-8">ทุกข์</th>
                  <th className="py-1 w-8">เฉยๆ</th>
                  {/* Citta */}
                  <th className="py-1 w-8">ราคะ</th>
                  <th className="py-1 w-8">โทสะ</th>
                  <th className="py-1 w-8">โมหะ</th>
                  {/* Dhamma */}
                  <th className="py-1 w-10">นิวรณ์ 5</th>
                  <th className="py-1 w-12">อายตนะ 6</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-200 print:divide-black">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={24} className="px-4 py-8 text-center text-slate-400">
                      ไม่พบรายชื่อนิสิตในกลุ่มนี้
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => (
                    <tr
                      key={row.regId}
                      className="hover:bg-amber-50/40 transition divide-x divide-slate-200 print:divide-black"
                    >
                      {/* Code / No. */}
                      <td className="px-1.5 py-1.5 text-center font-mono font-bold text-slate-700">
                        {row.groupSpecificCode || row.studentCode || idx + 1}
                      </td>

                      {/* Name */}
                      <td className="px-2 py-1.5 font-bold text-slate-900 leading-tight">
                        <div>{row.studentName}</div>
                        {row.groupSpecificCode && row.studentCode && (
                          <div className="font-mono text-[9.5px] text-slate-400 print:hidden font-normal">
                            {row.studentCode}
                          </div>
                        )}
                      </td>

                      {/* Age */}
                      <td className="px-1 py-1 text-center font-mono text-slate-600">
                        {row.age || '-'}
                      </td>

                      {/* Vasa */}
                      <td className="px-1 py-1 text-center font-mono text-slate-600">
                        {row.vasa || '-'}
                      </td>

                      {/* Group */}
                      <td className="px-1 py-1 text-center font-mono font-bold text-amber-900">
                        {row.groupNumber || '-'}
                      </td>

                      {/* Major / Year */}
                      <td className="px-1.5 py-1 text-center font-mono text-[10px] text-slate-600">
                        {row.yearLevel ? `ปี ${row.yearLevel}` : ''}
                      </td>

                      {/* 17 Check Columns */}
                      {CHECKLIST_FIELDS.map((field) => {
                        const val = row.checklist[field.key];
                        return (
                          <td
                            key={field.key}
                            onClick={() => handleToggleCheck(row.regId, field.key)}
                            className={`p-0 text-center font-bold text-xs cursor-pointer select-none transition ${
                              val === true
                                ? 'bg-emerald-50 text-emerald-800 font-black'
                                : val === false
                                ? 'bg-red-50 text-red-800 font-black'
                                : 'hover:bg-slate-100 text-slate-300'
                            }`}
                            title={`คลิกเพื่อเช็ค: ${field.labelTh}`}
                          >
                            {val === true ? '/' : val === false ? 'X' : ''}
                          </td>
                        );
                      })}

                      {/* Result: PASS */}
                      <td
                        onClick={() => handleSetResult(row.regId, 'PASS')}
                        className={`p-1 text-center cursor-pointer select-none transition ${
                          row.result === 'PASS'
                            ? 'bg-emerald-100/80 font-black text-emerald-800'
                            : 'hover:bg-emerald-50 text-slate-300'
                        }`}
                      >
                        {row.result === 'PASS' ? '✓' : ''}
                      </td>

                      {/* Result: NOT_PASS */}
                      <td
                        onClick={() => handleSetResult(row.regId, 'NOT_PASS')}
                        className={`p-1 text-center cursor-pointer select-none transition ${
                          row.result === 'NOT_PASS'
                            ? 'bg-red-100/80 font-black text-red-800'
                            : 'hover:bg-red-50 text-slate-300'
                        }`}
                      >
                        {row.result === 'NOT_PASS' ? '✗' : ''}
                      </td>

                      {/* Remarks */}
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={(e) => handleUpdateRemarks(row.regId, e.target.value)}
                          placeholder="คำแนะนำ..."
                          className="w-full px-1.5 py-0.5 text-[10.5px] bg-transparent outline-none focus:bg-white rounded border border-transparent focus:border-amber-400"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Printable Document Footer (Signatures & Rules) */}
          {isEnglishProgram ? (
            <div className="hidden print:block mt-4 text-[10.5px] leading-relaxed border-t border-black pt-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1 max-w-xl text-[10px]">
                  <p className="font-bold">หมายเหตุ (Remarks):</p>
                  <p>
                    กรุณาใส่หมายเลข / และ x ในช่องที่สภาวธรรมที่ปรากฎจริง เช่น ช่อง &quot;ขณะยืน&quot; นิสิตกำหนดได้ใส่ / แต่ถ้านิสิตกำหนดไม่ได้ใส่เลข x ในช่องนั้นๆ
                  </p>
                  <p>
                    แต่ละครั้งที่สอบอารมณ์ ในการสอบอารมณ์ให้ขึ้นอยู่ที่ดุลยพินิจของพระวิปัสสนาจารย์
                  </p>
                  <p className="font-bold">
                    ✓ = กำหนด , ผ่าน (Pass) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; x = ไม่กำหนด , ไม่ผ่าน (Not pass)
                  </p>
                  <p className="italic text-[9.5px] pt-1">
                    **หลังจากสรุปผลการสอบอารมณ์เสร็จเรียบร้อย กรุณาส่งบัญชีเล่มนี้คืนที่สำนักงานคณบดีคณะพุทธศาสตร์
                  </p>
                  <p className="italic text-[9.5px]">
                    แต่ละครั้งที่สอบอารมณ์ ในการสอบอารมณ์ให้ขึ้นอยู่ที่ดุลยพินิจของพระวิปัสสนาจารย์ (ผลการปฏิบัติ ผ่าน หรือไม่ผ่าน)
                  </p>
                </div>

                <div className="text-center pt-2 min-w-[220px]">
                  <p className="mb-6">
                    ( {meditationMaster || (currentGroupMasters.length > 0 ? currentGroupMasters.join('  /  ') : '..................................................................')} )
                  </p>
                  <p className="font-bold">Meditation Master</p>
                  <p className="text-[10px] text-slate-600">{sessionDate || '......../............/...........'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden print:block mt-4 text-[10.5px] leading-relaxed border-t border-black pt-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1 text-[10px] max-w-xl">
                  <p>
                    กรุณาใส่หมายเลข / และ X ในช่องที่สภาวธรรมที่ปรากฏจริง เช่น ช่อง &quot;ขณะยืน&quot; นิสิตกำหนดได้ ใส่ เครื่องหมาย / (ถูก) แต่ถ้านิสิตกำหนดไม่ได้ ใส่ X ในช่องนั้นๆ
                  </p>
                  <p>
                    * แต่ละครั้งที่สอบอารมณ์ ให้ขึ้นอยู่กับดุลยพินิจของพระวิปัสสนาจารย์ (ผลการปฏิบัติ ผ่าน หรือ ไม่ผ่าน)
                  </p>
                  <p className="font-semibold text-[9.5px] pt-1">
                    **พ-พระพุทธศาสนา, ศ-ศาสนา, ป-ปรัชญา, บ-บาลีสันสกฤต, ว-วิปัสสนาภาวนา เช่น 2ว = ปี2 สาขาวิชาวิปัสสนาภาวนา
                  </p>
                </div>

                <div className="text-center pt-2 min-w-[250px]">
                  <p className="mb-6">
                    รับรองตามนี้ {meditationMaster || (currentGroupMasters.length > 0 ? currentGroupMasters.join('  /  ') : '..........................................................................')}
                  </p>
                  <p className="font-bold">พระวิปัสสนาจารย์</p>
                  <p className="text-[10px] text-slate-600">วันที่ {sessionDate || '......../............/...........'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer - Screen only */}
        <div className="print:hidden px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
            {errorMsg && <span className="font-bold text-red-600">• {errorMsg}</span>}
            {saveSuccess && (
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                บันทึกผลสอบอารมณ์เรียบร้อยแล้ว!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer flex-1 sm:flex-initial"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white shadow-md flex items-center justify-center gap-2 transition cursor-pointer flex-1 sm:flex-initial"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'กำลังบันทึก...' : `บันทึกผลสอบอารมณ์ (ครั้งที่ ${selectedSession})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Vipassana Group Assignment Modal */}
      {isGroupAssignmentModalOpen && (
        <VipassanaGroupAssignmentModal
          isOpen={isGroupAssignmentModalOpen}
          onClose={() => setIsGroupAssignmentModalOpen(false)}
          event={event}
          registrations={registrations}
          onAssignmentsSaved={() => {
            if (onSaved) onSaved();
          }}
        />
      )}
    </div>
  );
};
