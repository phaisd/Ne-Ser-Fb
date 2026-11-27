'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  HelpCircle,
  Info,
  Layers,
  Trash2,
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
import { readSpreadsheetFile } from '@/lib/utils/file-import-helpers';
import { downloadXlsx, type XlsxSheet } from '@/lib/utils/xlsx-export';
import { getAuthUser } from '@/lib/auth-client';

interface EventGroupImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventsList: StudentEvent[];
  initialEventId?: string;
  initialEventTitle?: string;
  registrationsList: EventRegistration[];
  onImported: () => void;
}

type ImportSourceTab = 'paste' | 'clone' | 'directory';

const SAMPLE_CSV = [
  'กลุ่ม,เลขเฉพาะกลุ่ม,รหัสนิสิต,ชื่อ-นามสกุล,หลักสูตร,หลักสูตรภาษา,สาขาวิชา,ชั้นปี,สถานภาพ/เพศ,พรรษา(ถ้ามี)',
  '1,B1T01,6801401003,พระวิชัย วิชโย,ปริญญาตรี,THAI,บาลีสันสกฤต,4,พระภิกษุ,41',
  '1,B1T02,6701501004,พระมหากุศล กุสลจิตโต,ปริญญาตรี,THAI,ศาสนาและปรัชญา,3,พระภิกษุ,20',
  '1,B1T03,6701501075,พระดำรงพล กตปุญฺโญ,ปริญญาตรี,THAI,วิปัสสนาภาวนา,3,พระภิกษุ,',
  '1,B1T16,6801501076,สามเณรอภิสร ใสสะอาด,ปริญญาตรี,THAI,พระพุทธศาสนา,2,สามเณร,',
  '2,B2T01,6701501046,Bounmy Xaymonty,ปริญญาตรี,THAI,พระพุทธศาสนา,3,ฆราวาสชาย,',
  '12,B1201,6601501013,แม่ชีสุวีรา,ปริญญาตรี,THAI,พระพุทธศาสนา,4,แม่ชี,',
].join('\n');

export const EventGroupImportModal: React.FC<EventGroupImportModalProps> = ({
  isOpen,
  onClose,
  eventsList,
  initialEventId,
  initialEventTitle,
  registrationsList,
  onImported,
}) => {
  if (!isOpen) return null;

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
  const [isClearing, setIsClearing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const existingParticipantCount = useMemo(() => {
    return registrationsList.filter((r) => r.eventId === targetEventId).length;
  }, [registrationsList, targetEventId]);

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
    if (activeTab !== 'paste') return { items: [], warnings: [], duplicates: [], detectedGroups: [] };
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
    try {
      const { rows, rawText: text } = await readSpreadsheetFile(file);
      const tsv = rows && rows.length > 0 ? rows.map((r) => r.join('\t')).join('\n') : text;
      setRawText(tsv);
      setErrorMsg(null);
    } catch (err: unknown) {
      setErrorMsg('ไม่สามารถอ่านไฟล์ได้: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDownloadSampleXlsx = () => {
    const headers = [
      'กลุ่ม',
      'เลขเฉพาะกลุ่ม',
      'รหัสนิสิต',
      'ชื่อ-นามสกุล',
      'หลักสูตร',
      'หลักสูตรภาษา',
      'สาขาวิชา',
      'ชั้นปี',
      'สถานภาพ/เพศ',
      'พรรษา(ถ้ามี)',
    ];
    const sampleRows = [
      ['1', 'B1T01', '6801401003', 'พระวิชัย วิชโย', 'ปริญญาตรี', 'THAI', 'บาลีสันสกฤต', '4', 'พระภิกษุ', '41'],
      ['1', 'B1T02', '6701501004', 'พระมหากุศล กุสลจิตโต', 'ปริญญาตรี', 'THAI', 'ศาสนาและปรัชญา', '3', 'พระภิกษุ', '20'],
      ['1', 'B1T03', '6701501075', 'พระดำรงพล กตปุญฺโญ', 'ปริญญาตรี', 'THAI', 'วิปัสสนาภาวนา', '3', 'พระภิกษุ', ''],
      ['1', 'B1T16', '6801501076', 'สามเณรอภิสร ใสสะอาด', 'ปริญญาตรี', 'THAI', 'พระพุทธศาสนา', '2', 'สามเณร', ''],
      ['2', 'B2T01', '6701501046', 'Bounmy Xaymonty', 'ปริญญาตรี', 'THAI', 'พระพุทธศาสนา', '3', 'ฆราวาสชาย', ''],
      ['12', 'B1201', '6601501013', 'แม่ชีสุวีรา', 'ปริญญาตรี', 'THAI', 'พระพุทธศาสนา', '4', 'แม่ชี', ''],
    ];
    const sheet: XlsxSheet = {
      name: 'แบบฟอร์มจัดกลุ่มนิสิต',
      title: 'แบบฟอร์มนำเข้ารายชื่อนิสิตแบบจัดกลุ่ม (เลขเฉพาะกลุ่ม)',
      subtitle: 'ใส่รหัสประจำกลุ่มในคอลัมน์ "เลขเฉพาะกลุ่ม" (เช่น B1T01) • คอลัมน์พรรษาระบุเฉพาะพระภิกษุ (แม่ชี/ฆราวาสให้เว้นว่าง)',
      headers,
      rows: sampleRows,
      columnWidths: [8, 16, 16, 32, 14, 16, 22, 10, 16, 14],
    };
    downloadXlsx('แบบฟอร์มนำเข้ารายชื่อนิสิตแบบจัดกลุ่ม_10คอลัมน์.xlsx', [sheet]);
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

  const handleClearExistingRegistrations = async () => {
    if (!targetEventId) return;
    const ev = eventsList.find((e) => e.id === targetEventId);
    const evTitle = ev?.title || 'โครงการนี้';
    if (
      !window.confirm(
        `คุณแน่ใจหรือไม่ว่าต้องการล้างรายชื่อนิสิตทั้งหมดของ "${evTitle}" (${existingParticipantCount} คน) ออกทั้งหมด?\n\nข้อมูลการจัดกลุ่มและรายชื่อจะถูกลบออกจากระบบและ Google Sheets เพื่อให้สามารถนำเข้าชุดใหม่ได้ตั้งแต่ต้น`
      )
    ) {
      return;
    }

    setIsClearing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      let res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear_event_registrations',
          eventId: targetEventId,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        const localUser = getAuthUser();
        if (localUser && (localUser.email || localUser.id)) {
          await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'sync-session',
              email: localUser.email,
              gmail: localUser.gmail,
              id: localUser.id,
              rememberMe: true,
            }),
          });
          res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'clear_event_registrations',
              eventId: targetEventId,
            }),
          });
        }
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'ล้างรายชื่อไม่สำเร็จ');
        return;
      }
      setSuccessMsg(data.message || 'ล้างรายชื่อนิสิตเดิมออกเรียบร้อยแล้ว');
      onImported();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsClearing(false);
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
      let res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_import_registrations',
          eventId: targetEventId,
          items: previewItems,
          mode: importMode,
        }),
      });

      // Auto-refresh signed server session cookie if client session exists
      if (res.status === 401 || res.status === 403) {
        const localUser = getAuthUser();
        if (localUser && (localUser.email || localUser.id)) {
          await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'sync-session',
              email: localUser.email,
              gmail: localUser.gmail,
              id: localUser.id,
              rememberMe: true,
            }),
          });
          res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'batch_import_registrations',
              eventId: targetEventId,
              items: previewItems,
              mode: importMode,
            }),
          });
        }
      }

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
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
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
          <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  กิจกรรมปลายทางที่จะนำเข้านิสิต:
                </label>
                <select
                  value={targetEventId}
                  onChange={(e) => setTargetEventId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                >
                  {!eventsList.some((ev) => ev.id === targetEventId) && targetEventId && (
                    <option value={targetEventId}>
                      {initialEventTitle || 'โครงการที่เลือก'}
                    </option>
                  )}
                  {eventsList.length === 0 && !targetEventId ? (
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
                  <option value="APPEND">
                    1. เพิ่ม/อัปเดตข้อมูลกลุ่มนิสิต (แนะนำ: อัปเดตรายชื่อเดิม และเพิ่มคนใหม่)
                  </option>
                  <option value="REPLACE_EVENT">
                    2. แทนที่รายชื่อทั้งหมดของกิจกรรมนี้ (ล้างรายชื่อเดิมในระบบและ Google Sheets ออก แล้วใส่ชุดนี้แทน)
                  </option>
                </select>
              </div>
            </div>

            {/* Quick Clear Existing Banner */}
            {existingParticipantCount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-semibold">
                  <Users className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    ปัจจุบันมีนิสิตในกิจกรรมนี้แล้ว{' '}
                    <strong className="text-amber-800 underline font-bold">{existingParticipantCount}</strong>{' '}
                    คน
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isClearing || isSubmitting}
                  onClick={handleClearExistingRegistrations}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isClearing ? 'กำลังล้างข้อมูล...' : 'ล้างข้อมูลเก่าออกทั้งหมด (เริ่มใส่ข้อมูลใหม่)'}</span>
                </button>
              </div>
            )}
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
              <span>1. วางจาก Excel / อัปโหลดไฟล์ Excel & CSV</span>
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
                  <label className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-sm">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>เลือกไฟล์ Excel (.xlsx) / CSV</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.tsv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleDownloadSampleXlsx}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold text-white flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                    title="ดาวน์โหลดแม่แบบตาราง Excel (.xlsx) มีหัวตารางและตัวอย่างข้อมูล"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>เทมเพลต Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSample}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 font-semibold text-emerald-800 flex items-center gap-1.5 cursor-pointer transition"
                    title="ดาวน์โหลดแม่แบบ CSV (UTF-8 with BOM)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>เทมเพลต CSV</span>
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

              {/* Guidance Notice for Vasa and Status/Gender */}
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>คำแนะนำเกี่ยวกับคอลัมน์ &quot;สถานภาพ/เพศ&quot; และ &quot;พรรษา(ถ้ามี)&quot;:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-950">
                  <li>
                    <strong>พรรษา(ถ้ามี):</strong> ระบุเฉพาะพระภิกษุสงฆ์ (จำนวนปีพรรษา เช่น 41, 20) ส่วนสามเณร แม่ชี และฆราวาส <u>สามารถเว้นว่างได้</u>
                  </li>
                  <li>
                    <strong>สถานภาพ/เพศ:</strong> ระบุ พระภิกษุ, สามเณร, แม่ชี, ฆราวาสชาย, ฆราวาสหญิง (หากเว้นว่าง ระบบจะตรวจจับจากคำนำหน้าชื่อให้อัตโนมัติ)
                  </li>
                </ul>
              </div>

              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                onDrop={async (e) => {
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    try {
                      const { rows, rawText: text } = await readSpreadsheetFile(file);
                      const tsv = rows && rows.length > 0 ? rows.map((r) => r.join('\t')).join('\n') : text;
                      setRawText(tsv);
                      setErrorMsg(null);
                    } catch (err: unknown) {
                      setErrorMsg('ไม่สามารถอ่านไฟล์ที่ลากวางได้: ' + (err instanceof Error ? err.message : String(err)));
                    }
                  }
                }}
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes('Files')) {
                    e.preventDefault();
                  }
                }}
                placeholder={
                  'วางข้อมูลจาก Excel หรือ CSV ได้เลย (รองรับ 10 คอลัมน์):\nกลุ่ม\tเลขเฉพาะกลุ่ม\tรหัสนิสิต\tชื่อ-นามสกุล\tหลักสูตร\tหลักสูตรภาษา\tสาขาวิชา\tชั้นปี\tสถานภาพ/เพศ\tพรรษา(ถ้ามี)\n1\tB1T01\t6801401003\tพระวิชัย วิชโย\tปริญญาตรี\tTHAI\tบาลีสันสกฤต\t4\tพระภิกษุ\t41\n1\tB1T02\t6701501004\tพระมหากุศล กุสลจิตโต\tปริญญาตรี\tTHAI\tศาสนาและปรัชญา\t3\tพระภิกษุ\t20\n1\tB1T03\t6701501075\tพระดำรงพล กตปุญฺโญ\tปริญญาตรี\tTHAI\tวิปัสสนาภาวนา\t3\tพระภิกษุ\t\n1\tB1T16\t6801501076\tสามเณรอภิสร ใสสะอาด\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t2\tสามเณร\t\n2\tB2T01\t6701501046\tBounmy Xaymonty\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t3\tฆราวาสชาย\t\n12\tB1201\t6601501013\tแม่ชีสุวีรา\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t4\tแม่ชี\t'
                }
                className="w-full p-3 rounded-2xl border border-slate-300 font-mono text-xs bg-slate-50/40 focus:ring-2 focus:ring-emerald-500 outline-none"
              />

              {/* Duplicate Warning Box (Red Text / Red Alert) */}
              {parsedPaste.duplicates && parsedPaste.duplicates.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-red-50/90 border-2 border-red-300 text-red-700 space-y-2 shadow-xs animate-in fade-in">
                  <div className="font-bold flex items-center justify-between text-xs text-red-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        แจ้งเตือน: พบรหัสนิสิต / ชื่อนิสิตซ้ำในรายการที่วาง ({parsedPaste.duplicates.length} รายการ)
                      </span>
                    </div>
                    <span className="text-[11px] font-normal text-red-600">
                      (กรุณาตรวจสอบข้อมูล)
                    </span>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                    {parsedPaste.duplicates.map((dup, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-2 rounded-xl bg-white/90 border border-red-200 shadow-2xs text-red-700"
                      >
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white shrink-0">
                          แถวที่ {dup.row}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-red-900">
                            รหัส: <span className="underline decoration-red-400 font-mono">{dup.studentCode || '-'}</span> | ชื่อ: <span className="underline decoration-red-400">{dup.studentName}</span>
                          </span>
                          {dup.groupSpecificCode && (
                            <span className="text-emerald-700 font-semibold ml-1.5 font-mono">
                              [กลุ่ม: {dup.groupSpecificCode}]
                            </span>
                          )}
                          <div className="text-[10px] text-red-600 mt-0.5 font-sans">
                            {dup.duplicateType === 'both' && (
                              <span>⚠️ ซ้ำทั้งรหัสนิสิตและชื่อกับแถวที่ <strong>{dup.originalRow}</strong></span>
                            )}
                            {dup.duplicateType === 'code' && (
                              <span>⚠️ รหัสนิสิตซ้ำกับแถวที่ <strong>{dup.originalRow}</strong></span>
                            )}
                            {dup.duplicateType === 'name' && (
                              <span>⚠️ ชื่อนิสิตซ้ำกับแถวที่ <strong>{dup.originalRow}</strong></span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-red-600 font-sans leading-relaxed">
                    💡 <strong>คำแนะนำ:</strong> หากนิสิตมีเลขเฉพาะกลุ่มต่างกัน (เช่น B1207 และ B1210) ระบบจะนำเข้าให้ครบทั้ง 2 แถวตามเลขกลุ่ม แต่หากเป็นข้อมูลที่วางซ้ำซ้อนโดยไม่ได้ตั้งใจ กรุณาลบแถวที่ซ้ำออกจากกล่องข้อความก่อนกดยืนยันนำเข้า
                  </p>
                </div>
              )}

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
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-slate-100 text-slate-700 sticky top-0">
                  <tr>
                    <th className="px-2.5 py-2 font-bold text-center">กลุ่ม</th>
                    <th className="px-2.5 py-2 font-bold">เลขเฉพาะกลุ่ม</th>
                    <th className="px-2.5 py-2 font-bold">รหัสนิสิต</th>
                    <th className="px-2.5 py-2 font-bold">ชื่อ-นามสกุล</th>
                    <th className="px-2.5 py-2 font-bold">หลักสูตร</th>
                    <th className="px-2.5 py-2 font-bold text-center">หลักสูตรภาษา</th>
                    <th className="px-2.5 py-2 font-bold">สาขาวิชา</th>
                    <th className="px-2.5 py-2 font-bold text-center">ชั้นปี</th>
                    <th className="px-2.5 py-2 font-bold text-center">สถานภาพ/เพศ</th>
                    <th className="px-2.5 py-2 font-bold text-center">พรรษา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-3 py-6 text-center text-slate-400">
                        กรุณาวางข้อมูล หรือเลือกไฟล์ CSV / TSV เพื่อดูตัวอย่างก่อนนำเข้า
                      </td>
                    </tr>
                  ) : (
                    previewItems.slice(0, 50).map((it, idx) => {
                      const isDup = it.isDuplicate;
                      return (
                        <tr
                          key={`${it.studentCode}-${it.groupSpecificCode || ''}-${idx}`}
                          className={
                            isDup
                              ? 'bg-red-50/80 hover:bg-red-100/70 text-red-950 font-medium'
                              : 'hover:bg-slate-50'
                          }
                        >
                          <td className="px-2.5 py-1.5 text-center font-semibold text-indigo-700">
                            {it.groupNumber || (it.groupName ? it.groupName.replace(/[^\d]/g, '') : '-')}
                          </td>
                          <td className="px-2.5 py-1.5 font-mono font-bold text-emerald-700">
                            {it.groupSpecificCode || '-'}
                          </td>
                          <td
                            className={`px-2.5 py-1.5 font-mono ${
                              isDup ? 'text-red-700 font-bold' : 'text-slate-800'
                            }`}
                          >
                            {it.studentCode || '-'}
                          </td>
                          <td
                            className={`px-2.5 py-1.5 font-medium ${
                              isDup ? 'text-red-950 font-bold' : 'text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{it.studentName}</span>
                              {isDup && (
                                <span
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-300 shrink-0"
                                  title={it.duplicateMessage}
                                >
                                  ⚠️ ซ้ำแถว {it.duplicateRow}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2.5 py-1.5 text-slate-600">
                            {it.degreeLevel || '-'}
                          </td>
                          <td className="px-2.5 py-1.5 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                it.programType === 'ENGLISH'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {it.programType || 'THAI'}
                            </span>
                          </td>
                          <td className="px-2.5 py-1.5 text-slate-600 truncate max-w-[130px]" title={it.major}>
                            {it.major || '-'}
                          </td>
                          <td className="px-2.5 py-1.5 text-center font-mono text-slate-600">
                            {it.yearLevel ? `ปี ${it.yearLevel}` : '-'}
                          </td>
                          <td className="px-2.5 py-1.5 text-center">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {it.role || 'นิสิต'}
                            </span>
                          </td>
                          <td className="px-2.5 py-1.5 text-center font-mono text-slate-700 font-semibold">
                            {it.vasa || '-'}
                          </td>
                        </tr>
                      );
                    })
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
