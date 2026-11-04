'use client';

import React, { useState } from 'react';
import { UserPlus, CheckCircle2, Users, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export interface ProvisionCandidate {
  rawName: string;
  name: string;
  nameEn?: string;
  email: string;
  password?: string;
  defaultPassword?: string;
  department: string;
  role: string;
  coursesCount: number;
  courses?: any[];
  aliases?: string[];
  selected?: boolean;
}

export interface ExistingInstructorMatch {
  rawName: string;
  accountId: string;
  accountName: string;
  accountNameEn?: string;
  accountEmail: string;
  courseCount: number;
}

interface AutoProvisionModalProps {
  isOpen: boolean;
  totalTimetableInstructors: number;
  existingCount: number;
  newCount: number;
  alreadyExisting: ExistingInstructorMatch[];
  candidates: ProvisionCandidate[];
  isSubmitting: boolean;
  onToggleCandidateSelect: (index: number) => void;
  onUpdateCandidateField: (index: number, field: string, val: any) => void;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export const AutoProvisionModal: React.FC<AutoProvisionModalProps> = ({
  isOpen,
  totalTimetableInstructors,
  existingCount,
  newCount,
  alreadyExisting,
  candidates,
  isSubmitting,
  onToggleCandidateSelect,
  onUpdateCandidateField,
  onClose,
  onConfirm,
}) => {
  const [showExisting, setShowExisting] = useState(false);

  if (!isOpen) return null;

  const selectedCount = candidates.filter((c) => c.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                🔄 ผลการสแกนและสร้างไอดีอาจารย์อัตโนมัติจากตารางสอน
              </h3>
              <p className="text-xs text-slate-500">
                ระบบตรวจพบอาจารย์ทั้งหมด {totalTimetableInstructors} ชื่อจากตารางสอน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-slate-400 font-medium">ชื่ออาจารย์ในตารางสอน</div>
            <div className="text-xl font-black text-slate-800">{totalTimetableInstructors}</div>
            <div className="text-[11px] text-slate-500">ท่าน</div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
            <div className="text-emerald-700 font-bold">มีบัญชีในระบบแล้ว</div>
            <div className="text-xl font-black text-emerald-800">{existingCount}</div>
            <div className="text-[11px] text-emerald-600">ไม่ต้องสร้างซ้ำ</div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200">
            <div className="text-indigo-700 font-bold">ตรวจพบใหม่ (รอสร้าง)</div>
            <div className="text-xl font-black text-indigo-800">{newCount}</div>
            <div className="text-[11px] text-indigo-600">พร้อมสร้างไอดี</div>
          </div>
        </div>

        {/* Existing Instructors Accordion */}
        {alreadyExisting.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowExisting(!showExisting)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 text-left font-bold text-slate-700 flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>รายชื่ออาจารย์ที่มีบัญชีในระบบแล้ว ({alreadyExisting.length} ท่าน)</span>
              </span>
              {showExisting ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showExisting && (
              <div className="max-h-36 overflow-y-auto p-2 divide-y divide-slate-100 bg-white">
                {alreadyExisting.map((ex, i) => (
                  <div key={i} className="py-1 px-2 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-800">{ex.accountName}</span>
                      {ex.accountNameEn && <span className="text-slate-400 ml-1">({ex.accountNameEn})</span>}
                    </div>
                    <span className="font-mono text-slate-500">{ex.accountEmail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Candidate Instructors Table */}
        <div className="flex-1 overflow-hidden flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>รายชื่ออาจารย์ใหม่ที่พร้อมสร้างบัญชี ({candidates.length} ท่าน)</span>
            <span className="text-indigo-600">เลือก {selectedCount} จาก {candidates.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-white">
            {candidates.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                อาจารย์ทุกท่านในตารางสอนมีบัญชีผู้ใช้งานในระบบเรียบร้อยแล้ว ไม่พบอาจารย์ใหม่ที่ต้องสร้าง
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 w-8 text-center">เลือก</th>
                    <th className="px-3 py-2">ชื่ออาจารย์ (ภาษาไทย / ตารางสอน)</th>
                    <th className="px-3 py-2">ชื่อภาษาอังกฤษ (nameEn)</th>
                    <th className="px-3 py-2">อีเมลระบบที่สร้างให้อัตโนมัติ</th>
                    <th className="px-3 py-2">ภาควิชา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((cand, idx) => (
                    <tr key={idx} className={cand.selected ? 'bg-indigo-50/30' : 'bg-slate-50/50'}>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(cand.selected)}
                          onChange={() => onToggleCandidateSelect(idx)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={cand.name}
                          onChange={(e) => onUpdateCandidateField(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 font-medium"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={cand.nameEn || ''}
                          onChange={(e) => onUpdateCandidateField(idx, 'nameEn', e.target.value)}
                          placeholder="e.g. Ven. Dr. Phramaha..."
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 font-medium"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="email"
                          value={cand.email}
                          onChange={(e) => onUpdateCandidateField(idx, 'email', e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 font-mono text-[11px]"
                        />
                      </td>
                      <td className="px-3 py-2 text-slate-600 text-[11px]">
                        {cand.department}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <div className="text-slate-500 text-[11px]">
            * รหัสผ่านเริ่มต้นสำหรับทุกบัญชีที่สร้างคือ <strong className="font-mono text-slate-800">mcu123456</strong> (สามารถเปลี่ยนได้ภายหลัง)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={selectedCount === 0 || isSubmitting}
              onClick={onConfirm}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold shadow-md shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังสร้างบัญชี...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันสร้างบัญชีอาจารย์ ({selectedCount} ท่าน)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
