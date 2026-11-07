'use client';

import React, { useState, useEffect } from 'react';
import {
  Archive,
  RefreshCw,
  Search,
  X,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ArchivedStudent } from '@/types';

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
    const confirmMsg = `ยืนยันการกู้คืนข้อมูลนิสิต "${student.fullName || student.studentCode}" กลับเข้าสู่ทะเบียนนิสิตหลักหรือไม่?`;
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
          text: `กู้คืนข้อมูลนิสิต ${student.fullName || student.studentCode} เรียบร้อยแล้ว (อัปเดตกลับเข้า Google Sheets แล้ว)`,
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

  if (!isOpen) return null;

  const filtered = archivedStudents.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.studentCode?.toLowerCase().includes(q) ||
      s.fullName?.toLowerCase().includes(q) ||
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.major?.toLowerCase().includes(q) ||
      s.deletionReason?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  แฟ้มประวัตินิสิตที่จำหน่ายออก / ถูกลบ (Students_Archive)
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Google Sheets Live
                </span>
              </div>
              <p className="text-xs text-slate-500">
                ข้อมูลที่ถูกลบจะถูกสำรองไว้ที่แท็บ <strong>Students_Archive</strong> ใน Google Sheets เพื่อความปลอดภัยและสามารถกู้คืนได้
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
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
              placeholder="ค้นหารหัสนิสิต, ชื่อ, สาขาวิชา, เหตุผล..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
              ทั้งหมด <span className="font-bold text-slate-900">{filtered.length}</span> รายการ
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
              <span className="text-sm font-bold text-slate-700">ไม่มีข้อมูลนิสิตที่ถูกลบ</span>
              <span className="text-xs text-slate-400">ยังไม่มีประวัตินิสิตที่ถูกจำหน่ายออกหรือลบในแฟ้มนี้</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b sticky top-0">
                <tr>
                  <th className="px-4 py-3">รหัสนิสิต / ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3">สาขาวิชา / ชั้นปี</th>
                  <th className="px-4 py-3">เหตุผลการลบ</th>
                  <th className="px-4 py-3">วัน-เวลาที่ถูกลบ</th>
                  <th className="px-4 py-3">ผู้ดำเนินการ</th>
                  <th className="px-4 py-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s, idx) => (
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
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-semibold text-[11px]">
                        {s.deletionReason || 'ลบข้อมูลนิสิต'}
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
                        title="กู้คืนข้อมูลนิสิตกลับเข้าสู่ทะเบียนหลัก"
                      >
                        {restoringCode === s.studentCode ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>กำลังกู้คืน...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            <span>กู้คืนข้อมูล</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
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
