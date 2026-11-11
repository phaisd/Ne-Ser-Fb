'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  History,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Course } from '@/types';
import { getErrorMessage } from '@/lib/utils/error';

interface CourseDeleteModalProps {
  course: Course | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CourseDeleteModal: React.FC<CourseDeleteModalProps> = ({
  course,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!course) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">ยืนยันการลบรายวิชา?</h4>
              <p className="text-xs text-slate-500 mt-1">
                คุณต้องการลบรายวิชานี้ออกจากคลังหลักสูตรใช่หรือไม่?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer transition shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">รหัสวิชา:</span>
            <span className="font-mono font-bold text-emerald-800">{course.courseCode}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">ชื่อวิชา:</span>
            <span className="font-bold text-slate-900">{course.courseName}</span>
          </div>
          {course.courseNameEn && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">En:</span>
              <span className="text-slate-600">{course.courseNameEn}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">หน่วยกิต:</span>
            <span className="font-medium text-slate-700">{course.credits || 3} หน่วยกิต</span>
          </div>
        </div>

        <div className="text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
          ⚠️ การลบรายวิชานี้จะนำวิชาออกจากระบบคลังรายวิชาและตารางเรียนโดยสมบูรณ์
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>กำลังลบ...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบรายวิชา</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface CourseHistoryModalProps {
  course: Course | null;
  onClose: () => void;
}

export const CourseHistoryModal: React.FC<CourseHistoryModalProps> = ({ course, onClose }) => {
  if (!course) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 border-b pb-3">
          <div>
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <span>ประวัติอาจารย์ผู้สอนย้อนหลัง</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="font-mono font-bold text-emerald-800">{course.courseCode}</span>{' '}
              {course.courseName} • ภาคเรียนที่ {course.semester || 1}/{course.academicYear || '2569'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer transition shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs flex flex-wrap items-center justify-between gap-2">
          <span className="text-emerald-900 font-semibold">อาจารย์ผู้สอนปัจจุบัน:</span>
          <span className="font-bold text-emerald-800">
            {course.instructor?.replace(/\*/g, '').trim() || 'ยังไม่ระบุอาจารย์ผู้สอน'}
          </span>
        </div>

        <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
          {(course.instructorHistory?.length || 0) === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs space-y-1.5 border border-dashed border-slate-200 rounded-2xl">
              <History className="w-7 h-7 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-500">
                ยังไม่มีประวัติการเปลี่ยนอาจารย์ผู้สอนในรายการนี้
              </p>
              <p>
                เมื่อมีการสับเปลี่ยนอาจารย์ผู้สอนในอนาคต ระบบจะบันทึกชื่อเดิม ชื่อใหม่ วันเวลา และผู้แก้ไขไว้ให้ดูย้อนหลังโดยอัตโนมัติ
              </p>
            </div>
          ) : (
            [...(course.instructorHistory || [])]
              .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
              .map((entry, idx) => (
                <div
                  key={`${entry.changedAt}-${idx}`}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      ภาค {entry.semester}/{entry.academicYear}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      แก้ไขเมื่อ{' '}
                      {new Date(entry.changedAt).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      โดย <strong className="text-slate-600">{entry.changedBy}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold">อาจารย์เดิม</div>
                      <div className="font-semibold text-rose-700">{entry.previousInstructor || '-'}</div>
                    </div>
                    <div className="text-slate-400 font-bold text-center">→</div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold">อาจารย์ใหม่</div>
                      <div className="font-bold text-emerald-700">{entry.newInstructor || '-'}</div>
                    </div>
                  </div>
                  {entry.reason && (
                    <div className="text-[11px] text-slate-600 bg-white/80 px-2.5 py-1.5 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-500">หมายเหตุ:</span> {entry.reason}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>

        <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
          💡 <strong>หมายเหตุ:</strong> ประวัตินี้สำหรับติดตามการเปลี่ยนตัวอาจารย์ผู้สอน
          หากต้องการแก้ไขตัวสะกดชื่อ-นามสกุลหรือตำแหน่งทางวิชาการของอาจารย์ท่านเดิม กรุณาแก้ไขที่เมนู{' '}
          <strong>จัดการผู้ใช้งานและกำหนดบทบาท</strong>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

interface CourseCloneModalProps {
  isOpen: boolean;
  availableAcademicYears?: string[];
  onClose: () => void;
  onCloned?: () => void;
}

export const CourseCloneModal: React.FC<CourseCloneModalProps> = ({
  isOpen,
  availableAcademicYears = [],
  onClose,
  onCloned,
}) => {
  const [cloneSourceYear, setCloneSourceYear] = useState('2568');
  const [cloneSourceSem, setCloneSourceSem] = useState(1);
  const [cloneTargetYear, setCloneTargetYear] = useState('2569');
  const [cloneTargetSem, setCloneTargetSem] = useState(1);
  const [cloneKeepInstructors, setCloneKeepInstructors] = useState(true);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneMsg, setCloneMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCloneMsg(null);
    if (availableAcademicYears.length > 0) {
      const latestYear = availableAcademicYears[0];
      const nextYearNum = Number(latestYear);
      setCloneSourceYear(latestYear);
      if (!Number.isNaN(nextYearNum)) {
        setCloneTargetYear(String(nextYearNum + 1));
      }
    }
  }, [isOpen, availableAcademicYears]);

  if (!isOpen) return null;

  const handleCloneTerm = async () => {
    if (!cloneSourceYear.trim() || !cloneTargetYear.trim()) {
      setCloneMsg({ type: 'error', text: 'กรุณาระบุปีการศึกษาต้นทางและปลายทาง' });
      return;
    }
    if (cloneSourceYear.trim() === cloneTargetYear.trim() && cloneSourceSem === cloneTargetSem) {
      setCloneMsg({ type: 'error', text: 'ปีการศึกษาและภาคการศึกษาปลายทางต้องแตกต่างจากต้นทาง' });
      return;
    }
    setIsCloning(true);
    setCloneMsg(null);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clone-term',
          sourceAcademicYear: cloneSourceYear.trim(),
          sourceSemester: cloneSourceSem,
          targetAcademicYear: cloneTargetYear.trim(),
          targetSemester: cloneTargetSem,
          keepInstructors: cloneKeepInstructors,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ไม่สามารถคัดลอกรายวิชาได้');
      }
      setCloneMsg({
        type: 'success',
        text: data.message || `คัดลอกรายวิชาสำเร็จ (${data.cloned} วิชา)`,
      });
      if (onCloned) onCloned();
    } catch (err: unknown) {
      setCloneMsg({ type: 'error', text: getErrorMessage(err, 'เกิดข้อผิดพลาดในการคัดลอกรายวิชา') });
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isCloning) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-start justify-between gap-3 border-b pb-3">
          <div>
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Copy className="w-5 h-5 text-amber-600" />
              <span>คัดลอกรายวิชาข้ามปีการศึกษา / ภาคเรียน</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              สร้างชุดรายวิชาสำหรับภาคการศึกษาใหม่โดยเก็บข้อมูลปีการศึกษาก่อนหน้าไว้ครบถ้วน ไม่เขียนทับประวัติเดิม
            </p>
          </div>
          <button
            type="button"
            onClick={() => !isCloning && onClose()}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer transition shrink-0"
          >
            ✕
          </button>
        </div>

        {cloneMsg && (
          <div
            className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 ${
              cloneMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {cloneMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{cloneMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-700">1. ต้นทาง (ข้อมูลที่จะคัดลอก)</div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                ปีการศึกษาต้นทาง
              </label>
              <input
                type="text"
                value={cloneSourceYear}
                onChange={(e) => setCloneSourceYear(e.target.value)}
                placeholder="2568"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                ภาคการศึกษาต้นทาง
              </label>
              <select
                value={cloneSourceSem}
                onChange={(e) => setCloneSourceSem(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
              >
                <option value={1}>ภาคเรียนที่ 1</option>
                <option value={2}>ภาคเรียนที่ 2</option>
                <option value={3}>ภาคฤดูร้อน (3)</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
            <div className="text-xs font-bold text-amber-900">2. ปลายทาง (ภาคการศึกษาใหม่)</div>
            <div>
              <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                ปีการศึกษาปลายทาง
              </label>
              <input
                type="text"
                value={cloneTargetYear}
                onChange={(e) => setCloneTargetYear(e.target.value)}
                placeholder="2569"
                className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                ภาคการศึกษาปลายทาง
              </label>
              <select
                value={cloneTargetSem}
                onChange={(e) => setCloneTargetSem(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs"
              >
                <option value={1}>ภาคเรียนที่ 1</option>
                <option value={2}>ภาคเรียนที่ 2</option>
                <option value={3}>ภาคฤดูร้อน (3)</option>
              </select>
            </div>
          </div>
        </div>

        <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={cloneKeepInstructors}
            onChange={(e) => setCloneKeepInstructors(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500"
          />
          <div>
            <div className="font-bold text-slate-800">
              คงรายชื่ออาจารย์ผู้สอนเดิมจากภาคต้นทางไว้เบื้องต้น
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              หากติ๊กออก ระบบจะสร้างรายวิชาในปีใหม่โดยเว้นว่างอาจารย์ผู้สอนไว้เพื่อรอการมอบหมายใหม่
              (รายการที่มีอยู่ในภาคปลายทางแล้วจะถูกข้ามโดยอัตโนมัติ)
            </div>
          </div>
        </label>

        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={isCloning}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition"
          >
            ปิด
          </button>
          <button
            type="button"
            onClick={handleCloneTerm}
            disabled={isCloning}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isCloning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>กำลังคัดลอก...</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>เริ่มคัดลอกรายวิชา</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
