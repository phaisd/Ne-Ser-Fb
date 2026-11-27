'use client';

import React from 'react';
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
  Search,
  Copy,
  Check,
} from 'lucide-react';
import type { StudentEvent, EventRegistration } from '@/types/event';
import type { UserAccount } from '@/types/instructor';
import { formatGroupDisplay } from '@/lib/events/groupImport';
import { useGroupAssignments } from './useGroupAssignments';

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
  const {
    availableGroups,
    activeGroup,
    setActiveGroup,
    assignments,
    currentAssignment,
    systemUsers,
    isLoadingUsers,
    userAssignedGroupsMap,
    advisorSearch,
    setAdvisorSearch,
    masterSearch,
    setMasterSearch,
    selectedUserAdvisorId,
    setSelectedUserAdvisorId,
    customAdvisorName,
    setCustomAdvisorName,
    selectedUserMasterId,
    setSelectedUserMasterId,
    customMasterName,
    setCustomMasterName,
    filteredAdvisors,
    filteredRegularAdvisors,
    filteredVipassanaAdvisors,
    filteredMasters,
    filteredMasterVipassana,
    filteredMasterOthers,
    isSaving,
    saveSuccess,
    errorMsg,
    handleAddAdvisor,
    handleRemoveAdvisor,
    handleAddMaster,
    handleRemoveMaster,
    handleUpdateNotes,
    handleSaveAll,
    handleCopyFromGroup,
    practitionerCountForGroup,
  } = useGroupAssignments({
    isOpen,
    event,
    registrations,
    initialUsers,
    onAssignmentsSaved,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate">
                  มอบหมายอาจารย์และพระวิปัสสนาจารย์ประจำกลุ่ม
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold bg-amber-400 text-amber-950 shrink-0">
                  รองรับหลายท่านต่อกลุ่ม
                </span>
              </div>
              <p className="text-[10.5px] sm:text-xs text-purple-200 truncate max-w-xl">
                {event.title} • กำหนดผู้ดูแลเช็คชื่อ 4 รอบ และพระเถระผู้สอบอารมณ์สติปัฏฐาน 4
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
          {/* Left Column: Group Tabs Selector (Horizontal scroll on mobile, Vertical on desktop) */}
          <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-2 sm:p-3 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden flex md:flex-col gap-1.5 shrink-0 scrollbar-none">
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
              const gDisplay = formatGroupDisplay(gNum, registrations, assign?.groupName);
              const isEnglishGroup = gDisplay.toLowerCase().includes('english') || gDisplay.toLowerCase().includes('inter');

              return (
                <button
                  key={gNum}
                  type="button"
                  onClick={() => setActiveGroup(gNum)}
                  className={`text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between gap-2 shrink-0 md:shrink min-w-[155px] md:min-w-0 ${
                    isSelected
                      ? 'bg-purple-50 text-purple-950 border border-purple-300 font-bold shadow-xs'
                      : 'hover:bg-slate-100 text-slate-700 border border-transparent font-medium'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs truncate flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded-full text-[11px] font-bold inline-flex items-center justify-center shrink-0 ${
                        isEnglishGroup ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {gNum}
                      </span>
                      <span className="font-bold truncate">{gDisplay}</span>
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
          <div className="flex-1 p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 bg-slate-50">
            {/* Mobile Fast Switch Dropdown (visible on mobile only) */}
            <div className="flex md:hidden items-center justify-between gap-2 bg-purple-50/90 p-2.5 rounded-xl border border-purple-200">
              <span className="text-xs font-bold text-purple-900 shrink-0">เลือกกลุ่ม:</span>
              <select
                value={activeGroup}
                onChange={(e) => setActiveGroup(parseInt(e.target.value, 10))}
                className="flex-1 py-1 px-2.5 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-950 focus:outline-none"
              >
                {availableGroups.map((g) => {
                  const title = formatGroupDisplay(g, registrations, assignments[String(g)]?.groupName);
                  const pCount = practitionerCountForGroup(g);
                  const advCount = assignments[String(g)]?.advisors?.length || 0;
                  const mstCount = assignments[String(g)]?.vipassanaMasters?.length || 0;
                  return (
                    <option key={g} value={g}>
                      {title} ({pCount} คน • อ.{advCount} | พระ {mstCount})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Group Banner */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base sm:text-lg font-black text-slate-800">
                    {formatGroupDisplay(activeGroup, registrations, currentAssignment.groupName)}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                    นิสิตผู้ปฏิบัติ {practitionerCountForGroup(activeGroup)} รูป/คน
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  ท่านที่ระบุจะปรากฏในช่องเลือกลงชื่อตอนเช็คชื่อ 4 รอบ และในช่องรับรองท้ายใบพิมพ์ A4 ทางการ
                </p>
              </div>

              {/* Quick jump next group + Copy from other group tool */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs w-full sm:w-auto justify-end">
                {availableGroups.length > 1 && (
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const fromG = e.target.value;
                      if (fromG) {
                        handleCopyFromGroup(parseInt(fromG, 10));
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 sm:flex-none px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-[11px] font-bold text-purple-900 cursor-pointer transition outline-none shadow-2xs"
                    title="คัดลอกรายชื่ออาจารย์และพระวิปัสสนาจารย์จากกลุ่มอื่นมาใส่ในกลุ่มนี้"
                  >
                    <option value="" disabled>📋 คัดลอกผู้ดูแลจากกลุ่ม...</option>
                    {availableGroups.filter((g) => g !== activeGroup).map((g) => (
                      <option key={g} value={g}>
                        {formatGroupDisplay(g, registrations, assignments[String(g)]?.groupName)} (อ.{assignments[String(g)]?.advisors?.length || 0} | พระ {assignments[String(g)]?.vipassanaMasters?.length || 0})
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => setActiveGroup((prev) => Math.max(1, prev - 1))}
                  disabled={activeGroup <= 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer font-bold text-xs"
                >
                  ◀ ก่อนหน้า
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGroup((prev) => Math.min(availableGroups[availableGroups.length - 1], prev + 1))}
                  disabled={activeGroup >= availableGroups[availableGroups.length - 1]}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer font-bold text-xs"
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

              {/* Add Advisor Inputs: Search Box + Dropdown + Custom Text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Search & Select from system accounts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ค้นหาและเลือกจากบัญชีในระบบ:</span>
                    </label>
                    {advisorSearch && (
                      <button
                        type="button"
                        onClick={() => setAdvisorSearch('')}
                        className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                      >
                        ล้างคำค้น ({filteredAdvisors.length} ท่าน)
                      </button>
                    )}
                  </div>

                  {/* Search input with icon */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="พิมพ์ค้นหาชื่ออาจารย์/เจ้าหน้าที่ เช่น ขันทอง, สมชาย..."
                      value={advisorSearch}
                      onChange={(e) => setAdvisorSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/20 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                    {advisorSearch && (
                      <button
                        type="button"
                        onClick={() => setAdvisorSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="ล้างคำค้นหา"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Quick click matching badges when searching */}
                  {advisorSearch.trim() && (
                    <div className="p-2 bg-indigo-50/70 rounded-xl border border-indigo-100 space-y-1.5 animate-in fade-in">
                      <div className="text-[10.5px] font-bold text-indigo-900 flex items-center justify-between">
                        <span>ผลการค้นหา (พบ {filteredAdvisors.length} ท่าน):</span>
                        <span className="text-[10px] font-normal text-indigo-700">แตะเพื่อเพิ่มทันที</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {filteredAdvisors.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">
                            ไม่พบชื่อนี้ในระบบ (สามารถพิมพ์เพิ่มเองที่ช่องขวา)
                          </span>
                        ) : (
                          filteredAdvisors.slice(0, 10).map((u) => {
                            const isAdded = currentAssignment.advisors?.includes(u.name);
                            const otherGroups = (userAssignedGroupsMap[u.name] || []).filter((g) => g !== activeGroup);
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  if (!isAdded) handleAddAdvisor(u.name);
                                }}
                                disabled={isAdded}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 text-left ${
                                  isAdded
                                    ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-2xs active:scale-95'
                                }`}
                              >
                                <Plus className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[180px]">{u.name}</span>
                                {isAdded ? (
                                  <span className="text-[10px] font-normal opacity-75">(เพิ่มแล้ว)</span>
                                ) : otherGroups.length > 0 ? (
                                  <span className="text-[10px] font-normal bg-indigo-800/60 px-1 rounded text-indigo-100">
                                    กลุ่ม {otherGroups.join(',')}
                                  </span>
                                ) : null}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Select dropdown filtered by search */}
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
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">
                      {isLoadingUsers
                        ? 'กำลังโหลดรายชื่อ...'
                        : advisorSearch.trim()
                        ? `-- เลือกจากผลการค้นหา (${filteredAdvisors.length} ท่าน) --`
                        : `-- หรือเลือกจากรายชื่อระบบ (${systemUsers.length}) --`}
                    </option>
                    {filteredRegularAdvisors.length > 0 && (
                      <optgroup label={`อาจารย์และเจ้าหน้าที่ประจำ (${filteredRegularAdvisors.length})`}>
                        {filteredRegularAdvisors.map((u) => {
                          const otherGroups = (userAssignedGroupsMap[u.name] || []).filter((g) => g !== activeGroup);
                          const grpHint = otherGroups.length > 0 ? ` [ดูแลกลุ่ม ${otherGroups.join(',')}]` : '';
                          return (
                            <option key={u.id} value={u.id}>
                              {u.name} [{u.role || 'อาจารย์'}]{u.department ? ` - ${u.department}` : ''}{grpHint}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    {filteredVipassanaAdvisors.length > 0 && (
                      <optgroup label={`พระวิปัสสนาจารย์ (${filteredVipassanaAdvisors.length})`}>
                        {filteredVipassanaAdvisors.map((u) => {
                          const otherGroups = (userAssignedGroupsMap[u.name] || []).filter((g) => g !== activeGroup);
                          const grpHint = otherGroups.length > 0 ? ` [ดูแลกลุ่ม ${otherGroups.join(',')}]` : '';
                          return (
                            <option key={u.id} value={u.id}>
                              {u.name} {u.instructorType ? `(${u.instructorType})` : ''}{grpHint}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Type custom name */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    หรือพิมพ์ชื่ออาจารย์ / เจ้าหน้าที่ผู้ช่วยเอง:
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
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่ม</span>
                    </button>
                  </div>
                  <span className="text-[10.5px] text-slate-400 block">
                    * ใช้สำหรับอาจารย์พิเศษ, วิทยากรภายนอก หรือผู้ช่วยงานที่ยังไม่มีบัญชีในระบบ
                  </span>
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

              {/* Add Master Inputs: Search Box + Dropdown + Custom Text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Search & Select from system accounts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-amber-600" />
                      <span>ค้นหาและเลือกพระอาจารย์จากในระบบ:</span>
                    </label>
                    {masterSearch && (
                      <button
                        type="button"
                        onClick={() => setMasterSearch('')}
                        className="text-[10px] text-amber-700 hover:underline cursor-pointer"
                      >
                        ล้างคำค้น ({filteredMasters.length} รูป)
                      </button>
                    )}
                  </div>

                  {/* Search input with icon */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="พิมพ์ค้นหาสมณศักดิ์, ฉายา, หรือชื่อพระอาจารย์..."
                      value={masterSearch}
                      onChange={(e) => setMasterSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-amber-300 bg-amber-50/25 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition"
                    />
                    {masterSearch && (
                      <button
                        type="button"
                        onClick={() => setMasterSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="ล้างคำค้นหา"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Quick click matching badges when searching */}
                  {masterSearch.trim() && (
                    <div className="p-2 bg-amber-50/80 rounded-xl border border-amber-200 space-y-1.5 animate-in fade-in">
                      <div className="text-[10.5px] font-bold text-amber-950 flex items-center justify-between">
                        <span>ผลการค้นหา (พบ {filteredMasters.length} รูป/ท่าน):</span>
                        <span className="text-[10px] font-normal text-amber-800">แตะเพื่อเพิ่มทันที</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {filteredMasters.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">
                            ไม่พบชื่อพระอาจารย์ในระบบ (สามารถพิมพ์เพิ่มเองที่ช่องขวา)
                          </span>
                        ) : (
                          filteredMasters.slice(0, 10).map((u) => {
                            const isAdded = currentAssignment.vipassanaMasters?.includes(u.name);
                            const otherGroups = (userAssignedGroupsMap[u.name] || []).filter((g) => g !== activeGroup);
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  if (!isAdded) handleAddMaster(u.name);
                                }}
                                disabled={isAdded}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 text-left ${
                                  isAdded
                                    ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                                    : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shadow-2xs active:scale-95'
                                }`}
                              >
                                <Plus className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[180px]">{u.name}</span>
                                {isAdded ? (
                                  <span className="text-[10px] font-normal opacity-75">(เพิ่มแล้ว)</span>
                                ) : otherGroups.length > 0 ? (
                                  <span className="text-[10px] font-normal bg-amber-800/60 px-1 rounded text-amber-100">
                                    กลุ่ม {otherGroups.join(',')}
                                  </span>
                                ) : null}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Select dropdown filtered by search */}
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
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="">
                      {isLoadingUsers
                        ? 'กำลังโหลดรายชื่อ...'
                        : masterSearch.trim()
                        ? `-- เลือกจากผลการค้นหา (${filteredMasters.length} รูป/ท่าน) --`
                        : `-- หรือเลือกจากรายชื่อระบบ (${systemUsers.length}) --`}
                    </option>
                    {filteredMasterVipassana.length > 0 && (
                      <optgroup label={`⭐ พระวิปัสสนาจารย์ (${filteredMasterVipassana.length})`}>
                        {filteredMasterVipassana.map((u) => {
                          const otherGroups = (userAssignedGroupsMap[u.name] || []).filter((g) => g !== activeGroup);
                          const grpHint = otherGroups.length > 0 ? ` [สอบอารมณ์กลุ่ม ${otherGroups.join(',')}]` : '';
                          return (
                            <option key={u.id} value={u.id}>
                              {u.name} {u.instructorType ? `[${u.instructorType}]` : ''} {u.ecclesiasticalTitle ? `(${u.ecclesiasticalTitle})` : ''}{grpHint}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    {filteredMasterOthers.length > 0 && (
                      <optgroup label={`อาจารย์และพระภิกษุรูปอื่นในระบบ (${filteredMasterOthers.length})`}>
                        {filteredMasterOthers.map((u) => {
                          const otherGroups = (userAssignedGroupsMap[u.name] || []).filter((g) => g !== activeGroup);
                          const grpHint = otherGroups.length > 0 ? ` [ดูแลกลุ่ม ${otherGroups.join(',')}]` : '';
                          return (
                            <option key={u.id} value={u.id}>
                              {u.name} [{u.role || 'อาจารย์'}]{grpHint}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Type custom monk name */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    หรือพิมพ์สมณศักดิ์ / ฉายา / ชื่อพระอาจารย์เอง:
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
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่ม</span>
                    </button>
                  </div>
                  <span className="text-[10.5px] text-slate-400 block">
                    * ระบุพระวิปัสสนาจารย์ที่ได้รับอาราธนามาจากภายนอก หรือพระมหาเถระผู้ทรงคุณวุฒิ
                  </span>
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
        <div className="px-4 sm:px-5 py-3 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
            {errorMsg && <span className="font-bold text-red-600">• {errorMsg}</span>}
            {saveSuccess && (
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                บันทึกการมอบหมายเรียบร้อย!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer text-center"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 disabled:bg-slate-400 text-white shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
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
