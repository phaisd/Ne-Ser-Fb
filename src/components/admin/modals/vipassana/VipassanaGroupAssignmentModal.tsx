'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Users,
  Award,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Sparkles,
  Info,
  UserCheck,
  ShieldAlert,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import type { StudentEvent, EventRegistration, MeditationGroupAssignment, MeditationConfig } from '@/types/event';
import type { UserAccount } from '@/types/instructor';

interface VipassanaGroupAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  registrations: EventRegistration[];
  systemUsers?: UserAccount[];
  onAssignmentsSaved?: (updatedEvent: StudentEvent) => void;
}

export const VipassanaGroupAssignmentModal: React.FC<VipassanaGroupAssignmentModalProps> = ({
  isOpen,
  onClose,
  event,
  registrations,
  systemUsers: initialUsers,
  onAssignmentsSaved,
}) => {
  // 1. Group list calculation: derived from registrations or standard 1..12
  const availableGroups = useMemo(() => {
    const setG = new Set<number>();
    registrations.forEach((r) => {
      const gNum = r.groupNumber || (r.groupName ? parseInt(r.groupName.replace(/\D/g, ''), 10) : 0);
      if (gNum && gNum > 0) setG.add(gNum);
    });

    // If registrations have fewer than standard groups, ensure at least groups 1..12 exist
    for (let i = 1; i <= 12; i++) {
      setG.add(i);
    }
    return Array.from(setG).sort((a, b) => a - b);
  }, [registrations]);

  // 2. Active selected group tab
  const [activeGroup, setActiveGroup] = useState<number>(1);

  // 3. Local working copy of group assignments
  const [assignments, setAssignments] = useState<Record<string, MeditationGroupAssignment>>({});
  const [systemUsers, setSystemUsers] = useState<UserAccount[]>(initialUsers || []);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Sync if initialUsers prop changes
  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      setSystemUsers(initialUsers);
    }
  }, [initialUsers]);

  // Grouped system users for easy selection
  const vipassanaMasterUsers = useMemo(() => {
    return systemUsers.filter((u) => u.role === 'VIPASSANA_MASTER' || (u.instructorType || '').includes('วิปัสสนา'));
  }, [systemUsers]);

  const regularStaffUsers = useMemo(() => {
    return systemUsers.filter((u) => u.role !== 'VIPASSANA_MASTER' && !(u.instructorType || '').includes('วิปัสสนา'));
  }, [systemUsers]);

  // Input states for adding new advisor/master
  const [selectedUserAdvisorId, setSelectedUserAdvisorId] = useState<string>('');
  const [customAdvisorName, setCustomAdvisorName] = useState<string>('');

  const [selectedUserMasterId, setSelectedUserMasterId] = useState<string>('');
  const [customMasterName, setCustomMasterName] = useState<string>('');

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 4. Initialize from event config
  useEffect(() => {
    if (isOpen) {
      const existing = event.meditationConfig?.groupAssignments || {};
      // Deep copy to prevent unintended mutations
      const cloned: Record<string, MeditationGroupAssignment> = {};
      Object.keys(existing).forEach((k) => {
        cloned[k] = {
          groupNumber: existing[k].groupNumber,
          groupName: existing[k].groupName || `กลุ่ม ${k}`,
          advisors: [...(existing[k].advisors || [])],
          vipassanaMasters: [...(existing[k].vipassanaMasters || [])],
          notes: existing[k].notes || '',
        };
      });

      // Ensure every available group has an entry
      availableGroups.forEach((g) => {
        const key = String(g);
        if (!cloned[key]) {
          cloned[key] = {
            groupNumber: g,
            groupName: g === 12 ? 'กลุ่ม 12 (นานาชาติ / English)' : `กลุ่ม ${g}`,
            advisors: [],
            vipassanaMasters: [],
            notes: '',
          };
        }
      });

      setAssignments(cloned);
      if (availableGroups.length > 0 && !cloned[String(activeGroup)]) {
        setActiveGroup(availableGroups[0]);
      }
    }
  }, [isOpen, event, availableGroups]);

  // 5. Fetch system users for quick selection
  useEffect(() => {
    if (isOpen && systemUsers.length === 0) {
      setIsLoadingUsers(true);
      fetch('/api/users')
        .then((res) => res.json())
        .then((resData) => {
          const list: UserAccount[] = Array.isArray(resData)
            ? resData
            : Array.isArray(resData?.data)
            ? resData.data
            : Array.isArray(resData?.users)
            ? resData.users
            : [];
          if (list.length > 0) {
            setSystemUsers(list);
          }
        })
        .catch((err) => console.warn('Could not load users for assignment:', err))
        .finally(() => setIsLoadingUsers(false));
    }
  }, [isOpen, systemUsers.length]);

  if (!isOpen) return null;

  const currentGroupKey = String(activeGroup);
  const currentAssignment = assignments[currentGroupKey] || {
    groupNumber: activeGroup,
    groupName: `กลุ่ม ${activeGroup}`,
    advisors: [],
    vipassanaMasters: [],
    notes: '',
  };

  // Add Advisor
  const handleAddAdvisor = (nameToAdd?: string) => {
    const name = (nameToAdd || customAdvisorName).trim();
    if (!name) return;

    setAssignments((prev) => {
      const cur = prev[currentGroupKey] || {
        groupNumber: activeGroup,
        groupName: `กลุ่ม ${activeGroup}`,
        advisors: [],
        vipassanaMasters: [],
      };
      if (cur.advisors?.includes(name)) return prev;
      return {
        ...prev,
        [currentGroupKey]: {
          ...cur,
          advisors: [...(cur.advisors || []), name],
        },
      };
    });
    setCustomAdvisorName('');
    setSelectedUserAdvisorId('');
  };

  // Remove Advisor
  const handleRemoveAdvisor = (nameToRemove: string) => {
    setAssignments((prev) => {
      const cur = prev[currentGroupKey];
      if (!cur) return prev;
      return {
        ...prev,
        [currentGroupKey]: {
          ...cur,
          advisors: (cur.advisors || []).filter((a) => a !== nameToRemove),
        },
      };
    });
  };

  // Add Vipassana Master
  const handleAddMaster = (nameToAdd?: string) => {
    const name = (nameToAdd || customMasterName).trim();
    if (!name) return;

    setAssignments((prev) => {
      const cur = prev[currentGroupKey] || {
        groupNumber: activeGroup,
        groupName: `กลุ่ม ${activeGroup}`,
        advisors: [],
        vipassanaMasters: [],
      };
      if (cur.vipassanaMasters?.includes(name)) return prev;
      return {
        ...prev,
        [currentGroupKey]: {
          ...cur,
          vipassanaMasters: [...(cur.vipassanaMasters || []), name],
        },
      };
    });
    setCustomMasterName('');
    setSelectedUserMasterId('');
  };

  // Remove Vipassana Master
  const handleRemoveMaster = (nameToRemove: string) => {
    setAssignments((prev) => {
      const cur = prev[currentGroupKey];
      if (!cur) return prev;
      return {
        ...prev,
        [currentGroupKey]: {
          ...cur,
          vipassanaMasters: (cur.vipassanaMasters || []).filter((m) => m !== nameToRemove),
        },
      };
    });
  };

  // Update Notes
  const handleUpdateNotes = (notes: string) => {
    setAssignments((prev) => {
      const cur = prev[currentGroupKey] || {
        groupNumber: activeGroup,
        groupName: `กลุ่ม ${activeGroup}`,
        advisors: [],
        vipassanaMasters: [],
      };
      return {
        ...prev,
        [currentGroupKey]: {
          ...cur,
          notes,
        },
      };
    });
  };

  // Save changes to backend
  const handleSaveAll = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const updatedMeditationConfig: MeditationConfig = {
        ...(event.meditationConfig || {}),
        groupAssignments: assignments,
      };

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_event',
          id: event.id,
          updates: {
            meditationConfig: updatedMeditationConfig,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ไม่สามารถบันทึกข้อมูลได้');
      }

      // Update in-memory event object
      event.meditationConfig = updatedMeditationConfig;

      setSaveSuccess(true);
      if (onAssignmentsSaved) {
        onAssignmentsSaved({
          ...event,
          meditationConfig: updatedMeditationConfig,
        });
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Group stats count
  const practitionerCountForGroup = (gNum: number) => {
    return registrations.filter((r) => {
      const n = r.groupNumber || (r.groupName ? parseInt(r.groupName.replace(/\D/g, ''), 10) : 0);
      return n === gNum;
    }).length;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Users className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  มอบหมายอาจารย์และพระวิปัสสนาจารย์ประจำกลุ่ม
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950">
                  รองรับหลายท่านต่อกลุ่ม
                </span>
              </div>
              <p className="text-xs text-purple-200 truncate max-w-xl">
                {event.title} • กำหนดผู้ดูแลเช็คชื่อ 4 รอบ และพระเถระผู้สอบอารมณ์สติปัฏฐาน 4
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
          {/* Left Column: Group Tabs Selector */}
          <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-3 overflow-y-auto flex md:flex-col gap-1.5 shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1 hidden md:block">
              เลือกกลุ่มเพื่อจัดการ
            </div>
            {availableGroups.map((gNum) => {
              const gKey = String(gNum);
              const assign = assignments[gKey];
              const pCount = practitionerCountForGroup(gNum);
              const advCount = assign?.advisors?.length || 0;
              const mstCount = assign?.vipassanaMasters?.length || 0;
              const isSelected = activeGroup === gNum;

              return (
                <button
                  key={gNum}
                  type="button"
                  onClick={() => setActiveGroup(gNum)}
                  className={`text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between gap-2 shrink-0 md:shrink ${
                    isSelected
                      ? 'bg-purple-50 text-purple-950 border border-purple-300 font-bold shadow-xs'
                      : 'hover:bg-slate-100 text-slate-700 border border-transparent font-medium'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs truncate flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold inline-flex items-center justify-center shrink-0">
                        {gNum}
                      </span>
                      <span>กลุ่ม {gNum}</span>
                      {gNum === 12 && <span className="text-[10px] text-amber-700">(Inter)</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>นิสิต: {pCount} คน</span>
                      <span>•</span>
                      <span className="text-indigo-600 font-semibold">อ.{advCount}</span>
                      <span>|</span>
                      <span className="text-amber-700 font-semibold">พระ {mstCount}</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 hidden md:block ${isSelected ? 'text-purple-600' : 'text-slate-300'}`} />
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Assignment for Active Group */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50">
            {/* Group Banner */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base sm:text-lg font-black text-slate-800">
                    {currentAssignment.groupName || `กลุ่มที่ ${activeGroup}`}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                    นิสิตผู้ปฏิบัติ {practitionerCountForGroup(activeGroup)} รูป/คน
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  ท่านที่ระบุจะปรากฏในช่องเลือกลงชื่อตอนเช็คชื่อ 4 รอบ และในช่องรับรองท้ายใบพิมพ์ A4 ทางการ
                </p>
              </div>

              {/* Quick jump next group */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveGroup((prev) => Math.max(1, prev - 1))}
                  disabled={activeGroup <= 1}
                  className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                >
                  ◀ ก่อนหน้า
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGroup((prev) => Math.min(availableGroups[availableGroups.length - 1], prev + 1))}
                  disabled={activeGroup >= availableGroups[availableGroups.length - 1]}
                  className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                >
                  ถัดไป ▶
                </button>
              </div>
            </div>

            {/* SECTION 1: อาจารย์ประจำกลุ่ม & เจ้าหน้าที่ (ผู้ช่วย) */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-indigo-50 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">
                      อาจารย์ประจำกลุ่ม และ เจ้าหน้าที่ (ผู้ช่วย)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      ทำหน้าที่ดูแลเช็คชื่อเข้าปฏิบัติธรรม 4 รอบต่อวัน และประสานงานความเรียบร้อย
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {currentAssignment.advisors?.length || 0} ท่าน
                </span>
              </div>

              {/* Current Advisors Tag List */}
              <div className="flex flex-wrap gap-2 min-h-[38px] p-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                {(!currentAssignment.advisors || currentAssignment.advisors.length === 0) ? (
                  <span className="text-xs text-slate-400 italic flex items-center gap-1.5 p-1">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    ยังไม่ได้ระบุอาจารย์ประจำกลุ่มหรือผู้ช่วย (พิมพ์หรือเลือกเพิ่มด้านล่าง)
                  </span>
                ) : (
                  currentAssignment.advisors.map((adv, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-indigo-200 text-indigo-950 rounded-xl text-xs font-semibold shadow-2xs hover:border-indigo-400 transition"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{adv}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAdvisor(adv)}
                        className="text-slate-400 hover:text-red-500 p-0.5 rounded-full transition cursor-pointer"
                        title="ลบรายชื่อนี้ออกจากกลุ่ม"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add Advisor Inputs: Dropdown + Custom Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Select from system accounts */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">
                    เลือกจากบัญชีอาจารย์/เจ้าหน้าที่ในระบบ:
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={selectedUserAdvisorId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const found = systemUsers.find((u) => u.id === val);
                          if (found) handleAddAdvisor(found.name);
                        }
                        setSelectedUserAdvisorId('');
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">
                        {isLoadingUsers ? 'กำลังโหลดรายชื่อ...' : `-- เลือกจากรายชื่อระบบ (${systemUsers.length}) --`}
                      </option>
                      <optgroup label={`อาจารย์และเจ้าหน้าที่ประจำ (${regularStaffUsers.length})`}>
                        {regularStaffUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} [{u.role || 'อาจารย์'}]{u.department ? ` - ${u.department}` : ''}
                          </option>
                        ))}
                      </optgroup>
                      {vipassanaMasterUsers.length > 0 && (
                        <optgroup label={`พระวิปัสสนาจารย์ (${vipassanaMasterUsers.length})`}>
                          {vipassanaMasterUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} {u.instructorType ? `(${u.instructorType})` : ''}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>

                {/* Type custom name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">
                    หรือพิมพ์ชื่ออาจารย์ / เจ้าหน้าที่ผู้ช่วย:
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="เช่น ผศ.ดร.บุญมี ใจเย็น หรือ นายสมบัติ (ผู้ช่วย)"
                      value={customAdvisorName}
                      onChange={(e) => setCustomAdvisorName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAdvisor();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddAdvisor()}
                      disabled={!customAdvisorName.trim()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่ม</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: พระมหาเถระ / พระวิปัสสนาจารย์ประจำกลุ่ม */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-amber-50 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">
                      พระมหาเถระ / พระวิปัสสนาจารย์ประจำกลุ่ม
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      ทำหน้าที่สอบอารมณ์สติปัฏฐาน 4 (กาย เวทนา จิต ธรรม) ตลอดระยะเวลาการปฏิบัติ
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  {currentAssignment.vipassanaMasters?.length || 0} รูป
                </span>
              </div>

              {/* Current Masters Tag List */}
              <div className="flex flex-wrap gap-2 min-h-[38px] p-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                {(!currentAssignment.vipassanaMasters || currentAssignment.vipassanaMasters.length === 0) ? (
                  <span className="text-xs text-slate-400 italic flex items-center gap-1.5 p-1">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    ยังไม่ได้ระบุพระวิปัสสนาจารย์ประจำกลุ่ม (พิมพ์หรือเลือกเพิ่มด้านล่าง)
                  </span>
                ) : (
                  currentAssignment.vipassanaMasters.map((m, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-300 text-amber-950 rounded-xl text-xs font-semibold shadow-2xs hover:border-amber-400 transition"
                    >
                      <span className="text-amber-600 font-bold">🧘</span>
                      <span>{m}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaster(m)}
                        className="text-slate-400 hover:text-red-500 p-0.5 rounded-full transition cursor-pointer"
                        title="ลบรายชื่อพระวิปัสสนาจารย์นี้ออกจากกลุ่ม"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add Master Inputs: Dropdown + Custom Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Select from system accounts */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">
                    เลือกพระอาจารย์จากบัญชีในระบบ:
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={selectedUserMasterId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const found = systemUsers.find((u) => u.id === val);
                          if (found) handleAddMaster(found.name);
                        }
                        setSelectedUserMasterId('');
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <option value="">
                        {isLoadingUsers ? 'กำลังโหลดรายชื่อ...' : `-- เลือกจากรายชื่อระบบ (${systemUsers.length}) --`}
                      </option>
                      {vipassanaMasterUsers.length > 0 && (
                        <optgroup label={`⭐ พระวิปัสสนาจารย์ (${vipassanaMasterUsers.length})`}>
                          {vipassanaMasterUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} {u.instructorType ? `[${u.instructorType}]` : ''} {u.ecclesiasticalTitle ? `(${u.ecclesiasticalTitle})` : ''}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label={`อาจารย์และพระภิกษุรูปอื่นในระบบ (${regularStaffUsers.length})`}>
                        {regularStaffUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} [{u.role || 'อาจารย์'}]
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Type custom monk name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">
                    หรือพิมพ์สมณศักดิ์ / ฉายา / ชื่อพระอาจารย์:
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="เช่น พระครูปลัด... หรือ พระมหา... หรือ Phra Ajahn..."
                      value={customMasterName}
                      onChange={(e) => setCustomMasterName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMaster();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddMaster()}
                      disabled={!customMasterName.trim()}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่ม</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: บันทึกสถานที่ / คำแนะนำประจำกลุ่ม */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                สถานที่ปฏิบัติ / หมายเหตุประจำกลุ่ม:
              </label>
              <input
                type="text"
                placeholder="เช่น อาคารโพธิญาณมหาวิชชาลัย ชั้น 2 โซนตะวันออก"
                value={currentAssignment.notes || ''}
                onChange={(e) => handleUpdateNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            {errorMsg && <span className="font-bold text-red-600">• {errorMsg}</span>}
            {saveSuccess && (
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                บันทึกการมอบหมายอาจารย์และพระวิปัสสนาจารย์ประจำกลุ่มเรียบร้อย!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 disabled:bg-slate-400 text-white shadow-md flex items-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการมอบหมายทุกกลุ่ม'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
