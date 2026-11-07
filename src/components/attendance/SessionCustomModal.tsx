'use client';

import React, { useState } from 'react';
import {
  X,
  SlidersHorizontal,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  BookOpen,
  FileText,
  CheckCircle2,
} from 'lucide-react';

interface SessionCustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionCustom: {
    sessionNumber: number;
    sessionType: 'NORMAL' | 'MAKEUP' | 'SPECIAL' | 'EXAM';
    date: string;
    startTime: string;
    endTime: string;
    room: string;
    leadInstructor: string;
    coInstructors: string[];
    customCoInstructorText: string;
    sessionTopic: string;
    note: string;
    isCustomized: boolean;
  };
  setSessionCustom: React.Dispatch<
    React.SetStateAction<{
      sessionNumber: number;
      sessionType: 'NORMAL' | 'MAKEUP' | 'SPECIAL' | 'EXAM';
      date: string;
      startTime: string;
      endTime: string;
      room: string;
      leadInstructor: string;
      coInstructors: string[];
      customCoInstructorText: string;
      sessionTopic: string;
      note: string;
      isCustomized: boolean;
    }>
  >;
  instructors: string[];
  currentUser: any;
}

export function SessionCustomModal({
  isOpen,
  onClose,
  sessionCustom,
  setSessionCustom,
  instructors,
  currentUser,
}: SessionCustomModalProps) {
  const [coSearch, setCoSearch] = useState('');

  if (!isOpen) return null;

  const filteredInstructors = instructors.filter((inst) => {
    if (!coSearch.trim()) return true;
    return inst.toLowerCase().includes(coSearch.toLowerCase().trim());
  });

  const toggleCoInstructor = (name: string) => {
    setSessionCustom((prev) => {
      const exists = prev.coInstructors.includes(name);
      return {
        ...prev,
        isCustomized: true,
        coInstructors: exists
          ? prev.coInstructors.filter((i) => i !== name)
          : [...prev.coInstructors, name],
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <SlidersHorizontal className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">ปรับแต่งข้อมูลคาบเรียน (Session Settings)</h3>
              <p className="text-xs text-emerald-200">
                กำหนดคาบที่, ประเภทการสอน, เวลา, ห้องเรียน และอาจารย์ผู้สอนร่วม
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Row 1: Session Number & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">คาบเรียนที่ (1-16):</label>
              <input
                type="number"
                min={1}
                max={20}
                value={sessionCustom.sessionNumber}
                onChange={(e) =>
                  setSessionCustom((prev) => ({
                    ...prev,
                    isCustomized: true,
                    sessionNumber: parseInt(e.target.value, 10) || 1,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">ประเภทการสอน:</label>
              <select
                value={sessionCustom.sessionType}
                onChange={(e: any) =>
                  setSessionCustom((prev) => ({
                    ...prev,
                    isCustomized: true,
                    sessionType: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="NORMAL">คาบเรียนปกติ</option>
                <option value="MAKEUP">คาบสอนชดเชย</option>
                <option value="SPECIAL">บรรยายพิเศษ / สัมมนา</option>
                <option value="EXAM">สอบย่อย / สอบเก็บคะแนน</option>
              </select>
            </div>
          </div>

          {/* Row 2: Date, Time & Room */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                วันที่สอนจริง:
              </label>
              <input
                type="date"
                value={sessionCustom.date}
                onChange={(e) =>
                  setSessionCustom((prev) => ({
                    ...prev,
                    isCustomized: true,
                    date: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                เวลาเริ่ม - สิ้นสุด:
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="09:00"
                  value={sessionCustom.startTime}
                  onChange={(e) =>
                    setSessionCustom((prev) => ({
                      ...prev,
                      isCustomized: true,
                      startTime: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs text-center font-bold"
                />
                <span>-</span>
                <input
                  type="text"
                  placeholder="12:00"
                  value={sessionCustom.endTime}
                  onChange={(e) =>
                    setSessionCustom((prev) => ({
                      ...prev,
                      isCustomized: true,
                      endTime: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs text-center font-bold"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                ห้องเรียน:
              </label>
              <input
                type="text"
                placeholder="เช่น C301 หรือ อาคารเรียนรวม"
                value={sessionCustom.room}
                onChange={(e) =>
                  setSessionCustom((prev) => ({
                    ...prev,
                    isCustomized: true,
                    room: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Row 3: Session Topic & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                หัวข้อบทเรียน (Topic):
              </label>
              <input
                type="text"
                placeholder="เช่น บทที่ 3: ปฏิจจสมุปบาท"
                value={sessionCustom.sessionTopic}
                onChange={(e) =>
                  setSessionCustom((prev) => ({
                    ...prev,
                    isCustomized: true,
                    sessionTopic: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                บันทึกเพิ่มเติม (Note):
              </label>
              <input
                type="text"
                placeholder="เช่น บรรยายออนไลน์ผ่าน Zoom / เช็คชื่อย้อนหลัง"
                value={sessionCustom.note}
                onChange={(e) =>
                  setSessionCustom((prev) => ({
                    ...prev,
                    isCustomized: true,
                    note: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Row 4: Lead Instructor & Co-Instructors */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                อาจารย์ผู้สอนหลักในคาบนี้:
              </label>
              <input
                type="text"
                value={sessionCustom.leadInstructor}
                onChange={(e) =>
                  setSessionCustom((prev) => ({
                    ...prev,
                    isCustomized: true,
                    leadInstructor: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  อาจารย์ผู้สอนร่วม / ผู้ช่วยสอน (TAs):
                </span>
                <span className="text-[11px] text-slate-400">
                  เลือกจากรายชื่อ หรือพิมพ์ระบุด้านล่าง
                </span>
              </label>

              {/* Selected Co-instructors Pills */}
              {sessionCustom.coInstructors.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-indigo-50/70 rounded-xl border border-indigo-100 mb-2">
                  {sessionCustom.coInstructors.map((name, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] shadow-xs"
                    >
                      <span>👨‍🏫 {name}</span>
                      <button
                        type="button"
                        onClick={() => toggleCoInstructor(name)}
                        className="hover:bg-indigo-700 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search and Select Co-instructors */}
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="พิมพ์ค้นหาชื่ออาจารย์ผู้สอนร่วม..."
                  value={coSearch}
                  onChange={(e) => setCoSearch(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50"
                />
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1 bg-white">
                  {filteredInstructors.slice(0, 16).map((inst, i) => {
                    const isSelected = sessionCustom.coInstructors.includes(inst);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleCoInstructor(inst)}
                        className={`text-left px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-800 font-bold border border-indigo-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{inst}</span>
                        {isSelected && <span className="text-indigo-600 font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Co-instructor text input */}
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="หรือพิมพ์ชื่ออาจารย์ผู้ช่วยสอนเพิ่มเติม คั่นด้วยจุลภาค (,)"
                  value={sessionCustom.customCoInstructorText}
                  onChange={(e) =>
                    setSessionCustom((prev) => ({
                      ...prev,
                      isCustomized: true,
                      customCoInstructorText: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setSessionCustom((prev) => ({
                ...prev,
                isCustomized: false,
                coInstructors: [],
                customCoInstructorText: '',
                sessionTopic: '',
                note: '',
              }));
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
          >
            คืนค่าเริ่มต้น
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ยืนยันการตั้งค่าคาบเรียน</span>
          </button>
        </div>
      </div>
    </div>
  );
}
