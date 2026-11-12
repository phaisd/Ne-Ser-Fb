'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Archive,
  RefreshCw,
  Search,
  X,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  GraduationCap,
  Download,
} from 'lucide-react';
import { ArchivedStudent } from '@/types';

type ArchiveCategory = 'ALL' | 'GRADUATED' | 'RESIGNED_TRANSFERRED' | 'RETIRED' | 'OTHER';

function classifyArchiveCategory(s: ArchivedStudent): Exclude<ArchiveCategory, 'ALL'> {
  const combined = `${s.studyStatus || ''} ${s.deletionReason || ''}`.toLowerCase();
  if (combined.includes('สำเร็จการศึกษา') || combined.includes('จบการศึกษา') || combined.includes('graduat')) {
    return 'GRADUATED';
  }
  if (combined.includes('ลาออก') || combined.includes('ย้ายออก') || combined.includes('resign') || combined.includes('transfer')) {
    return 'RESIGNED_TRANSFERRED';
  }
  if (combined.includes('พ้นสภาพ') || combined.includes('retire') || combined.includes('dismiss')) {
    return 'RETIRED';
  }
  return 'OTHER';
}

interface ArchivedStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentRestored?: () => void;
}

export const ArchivedStudentsModal: React.FC<ArchivedStudentsModalProps> = ({
  isOpen,
  onClose,
  onStudentRestored,
}) => {
  const [archivedStudents, setArchivedStudents] = useState<ArchivedStudent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ArchiveCategory>('ALL');
  const [restoringCode, setRestoringCode] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadArchived = async () => {
    setIsLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/students?archived=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setArchivedStudents(data.data);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'ไม่สามารถโหลดข้อมูลแฟ้มประวัติได้: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadArchived();
    }
  }, [isOpen]);

  const handleRestore = async (student: ArchivedStudent) => {
    const confirmMsg = `ยืนยันการกู้คืนข้อมูลนิสิต "${student.fullName || student.studentCode}" กลับเข้าสู่ทะเบียนนิสิตปัจจุบัน (สถานะ: ปกติ) หรือไม่?`;
    if (!confirm(confirmMsg)) return;

    setRestoringCode(student.studentCode);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', studentCode: student.studentCode }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({
          type: 'success',
          text: `กู้คืนข้อมูลนิสิต ${student.fullName || student.studentCode} กลับเข้าสู่ทะเบียนปัจจุบันเรียบร้อยแล้ว`,
        });
        // Remove from local list
        setArchivedStudents((prev) => prev.filter((s) => s.studentCode !== student.studentCode));
        if (onStudentRestored) {
          onStudentRestored();
        }
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการกู้คืน' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message });
    } finally {
      setRestoringCode(null);
    }
  };

  const categoryCounts = useMemo(() => {
    const counts = {
      ALL: archivedStudents.length,
      GRADUATED: 0,
      RESIGNED_TRANSFERRED: 0,
      RETIRED: 0,
      OTHER: 0,
    };
    archivedStudents.forEach((s) => {
      const cat = classifyArchiveCategory(s);
      counts[cat]++;
    });
    return counts;
  }, [archivedStudents]);

  const filtered = useMemo(() => {
    return archivedStudents.filter((s) => {
      if (categoryFilter !== 'ALL' && classifyArchiveCategory(s) !== categoryFilter) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.studentCode?.toLowerCase().includes(q) ||
        s.fullName?.toLowerCase().includes(q) ||
        s.firstName?.toLowerCase().includes(q) ||
        s.lastName?.toLowerCase().includes(q) ||
        s.major?.toLowerCase().includes(q) ||
        s.studyStatus?.toLowerCase().includes(q) ||
        s.deletionReason?.toLowerCase().includes(q)
      );
    });
  }, [archivedStudents, categoryFilter, search]);

  const handleExportCsv = () => {
    if (filtered.length === 0) return;
    const headers = [
      'รหัสนิสิต',
      'คำนำหน้า',
      'ชื่อ',
      'นามสกุล',
      'ชื่อ-นามสกุล',
      'ชั้นปี',
      'สาขาวิชา',
      'หลักสูตร',
      'สถานภาพสุดท้าย',
      'สาเหตุการย้ายเก็บ',
      'วันที่ย้ายเข้าแฟ้มประวัติ',
      'ผู้ดำเนินการ',
    ];
    const rows = filtered.map((s) => [
      s.studentCode || '',
      s.title || '',
      s.firstName || '',
      s.lastName || '',
      s.fullName || '',
      String(s.yearLevel || 1),
      s.major || '',
      s.programType === 'ENGLISH' ? 'International (ENGLISH)' : 'ปกติ (THAI)',
      s.studyStatus || '',
      s.deletionReason || '',
      s.deletedAt || '',
      s.deletedBy || '',
    ]);
    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Students_Archive_${categoryFilter}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  แฟ้มประวัตินิสิต (สำเร็จการศึกษา / พ้นสภาพ / ลาออก / ย้ายออก)
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Students_Archive • Google Sheets
                </span>
              </div>
              <p className="text-xs text-slate-500">
                แยกเก็บประวัตินิสิตที่จบการศึกษา พ้นสภาพ ลาออก หรือย้ายออก ออกจากทะเบียนนิสิตปัจจุบัน เพื่อให้จำนวนนิสิตที่กำลังศึกษาตรงตามจริง
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Cards */}
        <div className="px-5 pt-3 pb-2 bg-slate-50/60 border-b border-slate-200/80 grid grid-cols-2 sm:grid-cols-5 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className={`text-[11px] font-bold ${categoryFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'}`}>
              📁 ทั้งหมดในแฟ้มประวัติ
            </div>
            <div className="text-lg font-black leading-tight mt-0.5">{categoryCounts.ALL} <span className="text-[10px] font-normal">คน</span></div>
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('GRADUATED')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
              categoryFilter === 'GRADUATED'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-purple-50/70 text-purple-900 border-purple-200 hover:bg-purple-100/70'
            }`}
          >
            <div className={`text-[11px] font-bold flex items-center gap-1 ${categoryFilter === 'GRADUATED' ? 'text-purple-100' : 'text-purple-700'}`}>
              <GraduationCap className="w-3.5 h-3.5" /> สำเร็จการศึกษา
            </div>
            <div className="text-lg font-black leading-tight mt-0.5">{categoryCounts.GRADUATED} <span className="text-[10px] font-normal">คน</span></div>
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('RESIGNED_TRANSFERRED')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
              categoryFilter === 'RESIGNED_TRANSFERRED'
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-sky-50/70 text-sky-900 border-sky-200 hover:bg-sky-100/70'
            }`}
          >
            <div className={`text-[11px] font-bold ${categoryFilter === 'RESIGNED_TRANSFERRED' ? 'text-sky-100' : 'text-sky-700'}`}>
              🚪 ลาออก / ย้ายออก
            </div>
            <div className="text-lg font-black leading-tight mt-0.5">{categoryCounts.RESIGNED_TRANSFERRED} <span className="text-[10px] font-normal">คน</span></div>
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('RETIRED')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
              categoryFilter === 'RETIRED'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50/70 text-rose-900 border-rose-200 hover:bg-rose-100/70'
            }`}
          >
            <div className={`text-[11px] font-bold ${categoryFilter === 'RETIRED' ? 'text-rose-100' : 'text-rose-700'}`}>
              ⚠️ พ้นสภาพนิสิต
            </div>
            <div className="text-lg font-black leading-tight mt-0.5">{categoryCounts.RETIRED} <span className="text-[10px] font-normal">คน</span></div>
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('OTHER')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer col-span-2 sm:col-span-1 ${
              categoryFilter === 'OTHER'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100/70'
            }`}
          >
            <div className={`text-[11px] font-bold ${categoryFilter === 'OTHER' ? 'text-amber-100' : 'text-amber-800'}`}>
              🗑️ จำหน่าย / อื่น ๆ
            </div>
            <div className="text-lg font-black leading-tight mt-0.5">{categoryCounts.OTHER} <span className="text-[10px] font-normal">คน</span></div>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 border-b shrink-0 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200/80 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหารหัสนิสิต, ชื่อ, สาขาวิชา, สถานะ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                title="ส่งออกรายชื่อนิสิตในแฟ้มประวัติเป็นไฟล์ CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ส่งออก CSV ({filtered.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={loadArchived}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="รีเฟรชข้อมูลจาก Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>โหลดข้อมูลใหม่</span>
            </button>
            <span className="text-xs text-slate-500 font-semibold">
              แสดง <span className="font-bold text-slate-900">{filtered.length}</span> รายการ
            </span>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
              <span className="text-xs font-semibold">กำลังโหลดข้อมูลจาก Google Sheets (Students_Archive)...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Archive className="w-10 h-10 text-slate-300" />
              <span className="text-sm font-bold text-slate-700">ไม่พบข้อมูลนิสิตในหมวดหมู่นี้</span>
              <span className="text-xs text-slate-400">ยังไม่มีประวัตินิสิตที่ถูกย้ายเก็บในหมวดหมู่ที่เลือก</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b sticky top-0">
                <tr>
                  <th className="px-4 py-3">รหัสนิสิต / ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3">สาขาวิชา / ชั้นปีสุดท้าย</th>
                  <th className="px-4 py-3">สถานะ / สาเหตุที่ย้ายเก็บ</th>
                  <th className="px-4 py-3">วัน-เวลาที่ย้ายเก็บ</th>
                  <th className="px-4 py-3">ผู้ดำเนินการ</th>
                  <th className="px-4 py-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s, idx) => {
                  const cat = classifyArchiveCategory(s);
                  const badgeStyle =
                    cat === 'GRADUATED'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : cat === 'RESIGNED_TRANSFERRED'
                      ? 'bg-sky-100 text-sky-800 border-sky-200'
                      : cat === 'RETIRED'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200/60';
                  return (
                    <tr key={`${s.studentCode || 'arch'}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{s.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim()}</div>
                        <div className="font-mono text-slate-400 text-[10px]">{s.studentCode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{s.major || '-'}</div>
                        <div className="text-[10px] text-slate-400">
                          ปี {s.yearLevel || 1} • {s.programType === 'ENGLISH' ? 'International' : 'ปกติ'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md border font-bold text-[11px] ${badgeStyle}`}>
                          {s.deletionReason || s.studyStatus || 'ย้ายเข้าแฟ้มประวัติ'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {s.deletedAt ? new Date(s.deletedAt).toLocaleString('th-TH') : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {s.deletedBy || 'Admin'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={restoringCode === s.studentCode}
                          onClick={() => handleRestore(s)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                          title="กู้คืนข้อมูลนิสิตกลับเข้าสู่ทะเบียนปัจจุบัน"
                        >
                          {restoringCode === s.studentCode ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>กำลังกู้คืน...</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              <span>กู้คืนเข้าทะเบียน</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>เชื่อมโยงแท็บ <strong>Students_Archive</strong> ใน Google Sheets แบบอัตโนมัติ 100%</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
