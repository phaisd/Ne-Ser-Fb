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
  UserX,
  Shield,
  Trash2,
} from 'lucide-react';
import { ArchivedInstructor } from '@/types';

interface ArchivedInstructorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstructorRestored?: () => void;
}

export const ArchivedInstructorsModal: React.FC<ArchivedInstructorsModalProps> = ({
  isOpen,
  onClose,
  onInstructorRestored,
}) => {
  const [archivedInstructors, setArchivedInstructors] = useState<ArchivedInstructor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadArchived = async () => {
    setIsLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/users?archived=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setArchivedInstructors(data.data);
      }
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'ไม่สามารถโหลดข้อมูลแฟ้มประวัติอาจารย์ได้: ' + (err instanceof Error ? err.message : String(err)) });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadArchived();
    }
  }, [isOpen]);

  const handleRestore = async (instructor: ArchivedInstructor) => {
    const confirmMsg = `ยืนยันการกู้คืนบัญชีอาจารย์ "${instructor.name}" กลับเข้าสู่ระบบผู้ใช้งานปกติหรือไม่?`;
    if (!confirm(confirmMsg)) return;

    setRestoringId(instructor.id);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore-user', userId: instructor.id }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({
          type: 'success',
          text: `กู้คืนบัญชีอาจารย์ ${instructor.name} เรียบร้อยแล้ว (อัปเดตกลับเข้า Google Sheets เรียบร้อย)`,
        });
        setArchivedInstructors((prev) => prev.filter((i) => i.id !== instructor.id));
        if (onInstructorRestored) {
          onInstructorRestored();
        }
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการกู้คืน' });
      }
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (err instanceof Error ? err.message : String(err)) });
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (instructor: ArchivedInstructor) => {
    const confirmMsg = `⚠️ คำเตือน: คุณต้องการลบข้อมูลของ "${instructor.name}" ออกจากแฟ้มประวัติอย่างถาวรหรือไม่?\n(การกระทำนี้ไม่สามารถย้อนกลับได้)`;
    if (!confirm(confirmMsg)) return;

    setDeletingId(instructor.id);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'permanent-delete', userId: instructor.id }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({
          type: 'success',
          text: `ลบข้อมูลอาจารย์ ${instructor.name} ออกจากระบบถาวรเรียบร้อยแล้ว`,
        });
        setArchivedInstructors((prev) => prev.filter((i) => i.id !== instructor.id));
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการลบ' });
      }
    } catch (err: unknown) {
      setFeedbackMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (err instanceof Error ? err.message : String(err)) });
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  const filtered = archivedInstructors.filter((inst) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      inst.id?.toLowerCase().includes(q) ||
      inst.name?.toLowerCase().includes(q) ||
      inst.nameEn?.toLowerCase().includes(q) ||
      inst.email?.toLowerCase().includes(q) ||
      inst.gmail?.toLowerCase().includes(q) ||
      inst.department?.toLowerCase().includes(q) ||
      inst.archiveReason?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                📁 แฟ้มประวัติอาจารย์ที่เกษียณ / จำหน่ายออก / บัญชีทดสอบ
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-semibold">
                  {archivedInstructors.length} ท่าน
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ซิงค์และบันทึกประวัติไว้ที่ Google Sheets แท็บ <strong>Instructors_Archive</strong> สามารถกู้คืนได้ทุกเมื่อ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`mx-5 mt-4 p-3.5 rounded-xl text-sm flex items-center gap-2.5 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
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

        {/* Search & Action bar */}
        <div className="p-5 pb-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่ออาจารย์, อีเมล, สังกัด หรือเหตุผลการจำหน่าย..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
          <button
            onClick={loadArchived}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            รีเฟรชข้อมูล
          </button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm">กำลังโหลดข้อมูลแฟ้มประวัติอาจารย์...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
              <UserX className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-1" />
              <p className="font-medium text-slate-600 dark:text-slate-300 text-sm">
                {search ? 'ไม่พบข้อมูลอาจารย์ที่ตรงกับคำค้นหา' : 'ไม่มีข้อมูลอาจารย์ในแฟ้มประวัติ'}
              </p>
              <p className="text-xs text-slate-400">
                เมื่อมีการจำหน่ายอาจารย์ที่เกษียณอายุ ลาออก หรือลบบัญชีทดสอบ รายชื่อจะถูกเก็บสำรองไว้ที่นี่
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">รหัส / บัญชี</th>
                      <th className="py-3 px-4 font-semibold">ชื่อ - นามสกุล</th>
                      <th className="py-3 px-4 font-semibold">สังกัด / ภาควิชา</th>
                      <th className="py-3 px-4 font-semibold">เหตุผลการจำหน่าย</th>
                      <th className="py-3 px-4 font-semibold">วัน-เวลาที่ย้ายเข้า</th>
                      <th className="py-3 px-4 font-semibold text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filtered.map((inst) => (
                      <tr
                        key={inst.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                          <div>{inst.id}</div>
                          <div className="text-[11px] text-slate-500 font-sans mt-0.5">{inst.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{inst.name}</div>
                          {inst.nameEn && (
                            <div className="text-[11px] text-slate-400 italic">{inst.nameEn}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                          {inst.department || 'คณะพุทธศาสตร์'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {inst.archiveReason || 'เกษียณอายุ/จำหน่ายออก'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {inst.archivedAt
                            ? new Date(inst.archivedAt).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleRestore(inst)}
                              disabled={restoringId === inst.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors disabled:opacity-50"
                              title="กู้คืนบัญชีนี้กลับสู่ระบบผู้ใช้งานปกติ"
                            >
                              <RotateCcw
                                className={`w-3.5 h-3.5 ${
                                  restoringId === inst.id ? 'animate-spin' : ''
                                }`}
                              />
                              {restoringId === inst.id ? 'กำลังกู้คืน...' : '♻️ กู้คืนบัญชี'}
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(inst)}
                              disabled={deletingId === inst.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                              title="ลบถาวร"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>ระบบเก็บข้อมูลประวัติอย่างปลอดภัย ไม่กระทบตารางสอนย้อนหลังหรือใบภาระงานในอดีต</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
