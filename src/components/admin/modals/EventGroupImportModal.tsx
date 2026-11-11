'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  Layers,
  Upload,
  Users,
  X,
} from 'lucide-react';
import type { EventRegistration, StudentEvent } from '@/types/event';
import type { Student } from '@/types/student';
import {
  buildGroupCloneItems,
  buildGroupedStudentsFromDirectory,
  GroupedParticipantInput,
  parseGroupedParticipantsText,
  summarizeGroups,
} from '@/lib/events/groupImport';

interface EventGroupImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventsList: StudentEvent[];
  initialEventId?: string;
  registrationsList: EventRegistration[];
  onImported: () => void;
}

type ImportSourceTab = 'paste' | 'clone' | 'directory';

const SAMPLE_CSV = [
  'กลุ่ม,เลขเฉพาะกลุ่ม,ชื่อ-นามสกุล,หลักสูตรภาษา,สาขาวิชา,ชั้นปี',
  '1,T101,พระมหาสมชาย กิตฺติโสภโณ,THAI,พระพุทธศาสนา,2',
  '1,T102,สามเณรธีรภัทร สุขใจ,THAI,พระพุทธศาสนา,2',
  '2,T201,นายก้องภพ ใจดี,THAI,ศาสนาและปรัชญา,3',
  '3,I301,Ven. Dhammapalo,ENGLISH,Buddhism,1',
].join('\n');

export const EventGroupImportModal: React.FC<EventGroupImportModalProps> = ({
  isOpen,
  onClose,
  eventsList,
  initialEventId,
  registrationsList,
  onImported,
}) => {
  const defaultTargetId = useMemo(() => {
    if (initialEventId && initialEventId !== 'ALL') return initialEventId;
    return eventsList[0]?.id || '';
  }, [initialEventId, eventsList]);

  const [targetEventId, setTargetEventId] = useState<string>(defaultTargetId);
  const [importMode, setImportMode] = useState<'APPEND' | 'REPLACE_EVENT'>('APPEND');
  const [activeTab, setActiveTab] = useState<ImportSourceTab>('paste');

  // Tab 1: Paste / CSV state
  const [rawText, setRawText] = useState('');
  const [defaultGroupNum, setDefaultGroupNum] = useState<string>('');
  const [autoCodePrefix, setAutoCodePrefix] = useState<string>('G');

  // Tab 2: Clone by group from another event
  const [sourceEventId, setSourceEventId] = useState<string>('');
  const [selectedGroupKeys, setSelectedGroupKeys] = useState<string[]>([]);

  // Tab 3: Directory pull
  const [directoryStudents, setDirectoryStudents] = useState<Student[]>([]);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [dirSearch, setDirSearch] = useState('');
  const [dirYearFilter, setDirYearFilter] = useState('ALL');
  const [dirProgramFilter, setDirProgramFilter] = useState('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [dirGroupNum, setDirGroupNum] = useState<number>(1);
  const [dirGroupName, setDirGroupName] = useState<string>('');
  const [useGroupSpecificCode, setUseGroupSpecificCode] = useState<boolean>(true);
  const [dirCodePrefix, setDirCodePrefix] = useState<string>('G');
  const [dirStartSeq, setDirStartSeq] = useState<number>(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTargetEventId(defaultTargetId);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, defaultTargetId]);

  // Events that already have registrations to clone from
  const eventsWithRegistrations = useMemo(() => {
    const counts = new Map<string, number>();
    registrationsList.forEach((r) => {
      counts.set(r.eventId, (counts.get(r.eventId) || 0) + 1);
    });
    return eventsList
      .filter((ev) => (counts.get(ev.id) || 0) > 0 && ev.id !== targetEventId)
      .map((ev) => ({ event: ev, count: counts.get(ev.id) || 0 }));
  }, [eventsList, registrationsList, targetEventId]);

  useEffect(() => {
    if (activeTab === 'clone' && !sourceEventId && eventsWithRegistrations.length > 0) {
      setSourceEventId(eventsWithRegistrations[0].event.id);
    }
  }, [activeTab, sourceEventId, eventsWithRegistrations]);

  const sourceEventRegistrations = useMemo(
    () => registrationsList.filter((r) => r.eventId === sourceEventId),
    [registrationsList, sourceEventId]
  );

  const sourceGroups = useMemo(
    () => summarizeGroups(sourceEventRegistrations),
    [sourceEventRegistrations]
  );

  useEffect(() => {
    setSelectedGroupKeys(sourceGroups.map((g) => g.key));
  }, [sourceEventId, sourceGroups]);

  // Load directory students only when directory tab is selected
  useEffect(() => {
    if (!isOpen || activeTab !== 'directory' || directoryStudents.length > 0) return;
    let active = true;
    setIsLoadingDirectory(true);
    fetch('/api/students')
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.success && Array.isArray(data.data)) {
          setDirectoryStudents(data.data);
        }
      })
      .catch(() => {
        if (active) setErrorMsg('ไม่สามารถโหลดรายชื่อนิสิตจากฐานข้อมูลได้');
      })
      .finally(() => {
        if (active) setIsLoadingDirectory(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, activeTab, directoryStudents.length]);

  const filteredDirectoryStudents = useMemo(() => {
    const q = dirSearch.trim().toLowerCase();
    return directoryStudents.filter((s) => {
      if (dirYearFilter !== 'ALL' && String(s.yearLevel) !== dirYearFilter) return false;
      if (dirProgramFilter !== 'ALL' && s.programType !== dirProgramFilter) return false;
      if (
        q &&
        !s.studentCode?.toLowerCase().includes(q) &&
        !s.fullName?.toLowerCase().includes(q) &&
        !s.firstName?.toLowerCase().includes(q) &&
        !s.lastName?.toLowerCase().includes(q) &&
        !s.major?.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [directoryStudents, dirSearch, dirYearFilter, dirProgramFilter]);

  const parsedPaste = useMemo(() => {
    if (activeTab !== 'paste') return { items: [], warnings: [], detectedGroups: [] };
    const parsedNum = defaultGroupNum ? Number.parseInt(defaultGroupNum, 10) : undefined;
    return parseGroupedParticipantsText(rawText, {
      defaultGroupNumber: Number.isFinite(parsedNum) && (parsedNum as number) > 0 ? parsedNum : undefined,
      autoCodePrefix,
    });
  }, [activeTab, rawText, defaultGroupNum, autoCodePrefix]);

  const previewItems: GroupedParticipantInput[] = useMemo(() => {
    if (activeTab === 'paste') return parsedPaste.items;
    if (activeTab === 'clone') {
      if (selectedGroupKeys.length === 0) return [];
      return buildGroupCloneItems(sourceEventRegistrations, selectedGroupKeys);
    }
    const chosenSet = new Set(selectedStudentIds);
    const selectedStudents = directoryStudents.filter((s) => chosenSet.has(s.id || s.studentCode));
    return buildGroupedStudentsFromDirectory(selectedStudents, {
      groupNumber: dirGroupNum || 1,
      groupName: dirGroupName || undefined,
      useGroupSpecificCode,
      codePrefix: dirCodePrefix,
      startSequence: dirStartSeq,
    });
  }, [
    activeTab,
    parsedPaste.items,
    selectedGroupKeys,
    sourceEventRegistrations,
    selectedStudentIds,
    directoryStudents,
    dirGroupNum,
    dirGroupName,
    useGroupSpecificCode,
    dirCodePrefix,
    dirStartSeq,
  ]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setRawText(text);
    setErrorMsg(null);
  };

  const handleDownloadSample = () => {
    const blob = new Blob(['\uFEFF' + SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-grouped-participants.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleGroupKey = (key: string) => {
    setSelectedGroupKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleToggleStudent = (sid: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(sid) ? prev.filter((id) => id !== sid) : [...prev, sid]
    );
  };

  const handleSelectAllFilteredStudents = () => {
    const filteredIds = filteredDirectoryStudents.map((s) => s.id || s.studentCode);
    const allSelected =
      filteredIds.length > 0 && filteredIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      const removeSet = new Set(filteredIds);
      setSelectedStudentIds((prev) => prev.filter((id) => !removeSet.has(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleSubmit = async () => {
    if (!targetEventId) {
      setErrorMsg('กรุณาเลือกกิจกรรมปลายทางก่อนนำเข้า');
      return;
    }
    if (previewItems.length === 0) {
      setErrorMsg('ยังไม่มีรายชื่อผู้เข้าร่วมพร้อมนำเข้า');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_import_registrations',
          eventId: targetEventId,
          items: previewItems,
          mode: importMode,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'นำเข้าผู้เข้าร่วมไม่สำเร็จ');
        return;
      }

      setSuccessMsg(data.message || `นำเข้าผู้เข้าร่วมสำเร็จ ${previewItems.length} คน`);
      onImported();
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Sticky Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                นำเข้า / ดึงนิสิตแบบจัดกลุ่ม (รองรับเลขเฉพาะกลุ่ม)
              </h3>
              <p className="text-xs text-slate-500">
                ใช้รหัสประจำกลุ่ม (เช่น T321, G01-01) แทนรหัสนิสิตได้ทันที เพื่อจัดใบเช็คชื่อแยกกลุ่ม
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200/70 text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Target Event & Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                กิจกรรมปลายทางที่จะนำเข้านิสิต:
              </label>
              <select
                value={targetEventId}
                onChange={(e) => setTargetEventId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
              >
                {eventsList.length === 0 ? (
                  <option value="">-- ยังไม่มีโครงการ/กิจกรรม --</option>
                ) : (
                  eventsList.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.academicYear})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">รูปแบบการนำเข้า:</label>
              <select
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as 'APPEND' | 'REPLACE_EVENT')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
              >
                <option value="APPEND">เพิ่มต่อจากรายชื่อเดิม (ข้ามเลขซ้ำอัตโนมัติ)</option>
                <option value="REPLACE_EVENT">แทนที่รายชื่อทั้งหมดของกิจกรรมนี้</option>
              </select>
            </div>
          </div>

          {/* 3 Source Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>1. วางจาก Excel / อัปโหลด CSV (มีเลขเฉพาะกลุ่ม)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('clone')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'clone'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Copy className="w-4 h-4" />
              <span>2. ดึงเป็นกลุ่มๆ จากกิจกรรมอื่น</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>3. ดึงจากฐานข้อมูลนิสิต → จัดกลุ่มใหม่</span>
            </button>
          </div>

          {/* Tab 1 Content: Excel/CSV Paste */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>เลือกไฟล์ CSV / TSV</span>
                    <input
                      type="file"
                      accept=".csv,.tsv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleDownloadSample}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 font-semibold text-emerald-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลดไฟล์ตัวอย่าง CSV</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-slate-600">กลุ่มเริ่มต้น:</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="อัตโนมัติ"
                    value={defaultGroupNum}
                    onChange={(e) => setDefaultGroupNum(e.target.value)}
                    className="w-20 px-2.5 py-1 rounded-lg border border-slate-300 text-center font-mono"
                  />
                  <label className="text-[11px] font-semibold text-slate-600">รหัสนำหน้า (ถ้าว่าง):</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={autoCodePrefix}
                    onChange={(e) => setAutoCodePrefix(e.target.value)}
                    className="w-14 px-2 py-1 rounded-lg border border-slate-300 text-center font-mono uppercase"
                  />
                </div>
              </div>

              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={
                  'วางข้อมูลจาก Excel หรือ CSV ได้เลย เช่น:\nกลุ่ม\tเลขเฉพาะกลุ่ม\tชื่อ-นามสกุล\n3\tT321\tพระมหาสมชาย ใจดี\n3\tT322\tสามเณรธีรภัทร สุขใจ'
                }
                className="w-full p-3 rounded-2xl border border-slate-300 font-mono text-xs bg-slate-50/40 focus:ring-2 focus:ring-emerald-500 outline-none"
              />

              {parsedPaste.warnings.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                  {parsedPaste.warnings.slice(0, 3).map((w, i) => (
                    <div key={i}>• {w}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2 Content: Clone by group */}
          {activeTab === 'clone' && (
            <div className="space-y-3">
              {eventsWithRegistrations.length === 0 ? (
                <div className="p-6 text-center rounded-2xl border border-dashed border-slate-300 text-slate-500">
                  ยังไม่มีกิจกรรมอื่นที่มีรายชื่อผู้เข้าร่วมให้ดึงข้อมูล
                </div>
              ) : (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      เลือกกิจกรรมต้นทางที่จัดกลุ่มไว้แล้ว:
                    </label>
                    <select
                      value={sourceEventId}
                      onChange={(e) => setSourceEventId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                    >
                      {eventsWithRegistrations.map(({ event, count }) => (
                        <option key={event.id} value={event.id}>
                          {event.title} ({count} คน)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">
                      เลือกกลุ่มที่ต้องการดึง ({selectedGroupKeys.length}/{sourceGroups.length} กลุ่ม)
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedGroupKeys(sourceGroups.map((g) => g.key))}
                        className="text-indigo-600 font-bold hover:underline cursor-pointer"
                      >
                        เลือกทุกกลุ่ม
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedGroupKeys([])}
                        className="text-slate-500 hover:underline cursor-pointer"
                      >
                        ล้างที่เลือก
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {sourceGroups.map((grp) => {
                      const checked = selectedGroupKeys.includes(grp.key);
                      return (
                        <label
                          key={grp.key}
                          className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition ${
                            checked
                              ? 'bg-indigo-50 border-indigo-400'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleGroupKey(grp.key)}
                            className="mt-0.5 rounded accent-indigo-600"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800">{grp.groupName}</div>
                            <div className="text-[11px] text-slate-500">
                              {grp.count} คน • รหัส: {grp.sampleCodes.join(', ')}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 3 Content: Pull from student directory */}
          {activeTab === 'directory' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-blue-50/60 border border-blue-200">
                <div>
                  <label className="text-[11px] font-bold text-blue-900 block mb-1">เลขกลุ่ม:</label>
                  <input
                    type="number"
                    min={1}
                    value={dirGroupNum}
                    onChange={(e) => setDirGroupNum(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-blue-300 bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-blue-900 block mb-1">ชื่อกลุ่ม (ถ้ามี):</label>
                  <input
                    type="text"
                    placeholder={`กลุ่มที่ ${dirGroupNum}`}
                    value={dirGroupName}
                    onChange={(e) => setDirGroupName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-blue-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-blue-900 block mb-1">รหัสนำหน้าเฉพาะกลุ่ม:</label>
                  <input
                    type="text"
                    maxLength={4}
                    disabled={!useGroupSpecificCode}
                    value={dirCodePrefix}
                    onChange={(e) => setDirCodePrefix(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-blue-300 bg-white font-mono uppercase disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-blue-900 block mb-1">เริ่มนับเลขลำดับที่:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      disabled={!useGroupSpecificCode}
                      value={dirStartSeq}
                      onChange={(e) => setDirStartSeq(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 px-2.5 py-1.5 rounded-xl border border-blue-300 bg-white font-mono disabled:opacity-50"
                    />
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-blue-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useGroupSpecificCode}
                        onChange={(e) => setUseGroupSpecificCode(e.target.checked)}
                        className="accent-blue-600"
                      />
                      <span>สร้างเลขเฉพาะกลุ่ม</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="ค้นหารหัสนิสิต / ชื่อ / สาขา..."
                  value={dirSearch}
                  onChange={(e) => setDirSearch(e.target.value)}
                  className="sm:col-span-2 px-3 py-1.5 rounded-xl border border-slate-300"
                />
                <select
                  value={dirYearFilter}
                  onChange={(e) => setDirYearFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="ALL">ทุกชั้นปี</option>
                  <option value="1">ชั้นปี 1</option>
                  <option value="2">ชั้นปี 2</option>
                  <option value="3">ชั้นปี 3</option>
                  <option value="4">ชั้นปี 4</option>
                </select>
                <select
                  value={dirProgramFilter}
                  onChange={(e) => setDirProgramFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="ALL">ทุกหลักสูตร</option>
                  <option value="THAI">ภาคปกติ (ไทย)</option>
                  <option value="ENGLISH">นานาชาติ</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold">
                  พบนิสิต {filteredDirectoryStudents.length} คน • เลือกแล้ว {selectedStudentIds.length} คน
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllFilteredStudents}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  เลือก / ยกเลิกทั้งหมดที่กรองอยู่
                </button>
              </div>

              <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {isLoadingDirectory ? (
                  <div className="p-6 text-center text-slate-500">กำลังโหลดข้อมูลนิสิต...</div>
                ) : filteredDirectoryStudents.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">ไม่พบนิสิตตามตัวกรอง</div>
                ) : (
                  filteredDirectoryStudents.slice(0, 120).map((stu) => {
                    const sid = stu.id || stu.studentCode;
                    const checked = selectedStudentIds.includes(sid);
                    return (
                      <label
                        key={sid}
                        className={`px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-slate-50 ${
                          checked ? 'bg-blue-50/70' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleStudent(sid)}
                          className="rounded accent-blue-600"
                        />
                        <span className="font-mono text-slate-600 w-24 shrink-0">{stu.studentCode}</span>
                        <span className="font-semibold text-slate-800 flex-1 truncate">
                          {stu.fullName || [stu.title, stu.firstName, stu.lastName].filter(Boolean).join(' ')}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          ปี {stu.yearLevel} • {stu.major || '-'}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Live Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800">
                ตัวอย่างรายการที่จะนำเข้า ({previewItems.length} คน)
              </h4>
              {previewItems.length > 50 && (
                <span className="text-[11px] text-slate-500">แสดงตัวอย่าง 50 รายการแรก</span>
              )}
            </div>
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-slate-100 text-slate-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-bold">กลุ่ม</th>
                    <th className="px-3 py-2 font-bold">เลขเฉพาะกลุ่ม / รหัส</th>
                    <th className="px-3 py-2 font-bold">ชื่อ-ฉายา-นามสกุล</th>
                    <th className="px-3 py-2 font-bold">หลักสูตร / หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-5 text-center text-slate-400">
                        กรุณาวางข้อมูล เลือกกลุ่ม หรือเลือกนิสิตเพื่อดูตัวอย่างก่อนนำเข้า
                      </td>
                    </tr>
                  ) : (
                    previewItems.slice(0, 50).map((it, idx) => (
                      <tr key={`${it.studentCode}-${idx}`} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 font-semibold text-indigo-700">
                          {it.groupName || (it.groupNumber ? `กลุ่มที่ ${it.groupNumber}` : '-')}
                        </td>
                        <td className="px-3 py-1.5 font-mono font-bold text-slate-800">
                          {it.studentCode}
                        </td>
                        <td className="px-3 py-1.5 text-slate-800">{it.studentName}</td>
                        <td className="px-3 py-1.5 text-slate-500">
                          {it.programType || '-'} {it.remarks ? `• ${it.remarks}` : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || previewItems.length === 0 || !targetEventId}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white shadow-sm transition cursor-pointer"
          >
            {isSubmitting ? 'กำลังนำเข้าข้อมูล...' : `ยืนยันนำเข้า (${previewItems.length} คน)`}
          </button>
        </div>
      </div>
    </div>
  );
};
