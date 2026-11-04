'use client';

import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Lock,
  AlertTriangle,
  PlayCircle,
  Users,
  Check,
  X,
  History,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface SemesterRoadmapTabProps {
  currentUser: any;
  currentCourse: any;
  semesterRoadmapSessions: any[];
  semesterTotalSessions: number;
  completedSessionsCount: number;
  nextUpcomingSession: any;
  handleFastOpenSession: (session: any) => void;
  setActiveMode: (mode: any) => void;
}

export function SemesterRoadmapTab({
  currentUser,
  currentCourse,
  semesterRoadmapSessions,
  semesterTotalSessions,
  completedSessionsCount,
  nextUpcomingSession,
  handleFastOpenSession,
  setActiveMode,
}: SemesterRoadmapTabProps) {
  if (!currentUser) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
        <Lock className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800 text-base">
          เข้าสู่ระบบอาจารย์ผู้สอนเพื่อดูแผนผัง 16 คาบเรียน
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          ระบบแผนผังจะจำลองตารางสอนตลอดทั้งภาคเรียนพร้อมข้อมูลการเช็คชื่อจริงในแต่ละสัปดาห์
        </p>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-center text-amber-900 space-y-2">
        <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
        <p className="font-bold text-sm">ไม่พบรายวิชาที่ท่านรับผิดชอบบรรยายในภาคเรียนนี้</p>
      </div>
    );
  }

  const progressPercent = Math.round((completedSessionsCount / semesterTotalSessions) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Course Header Banner with 16-Week Progress */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-emerald-700/40 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold">
              <Calendar className="w-4 h-4 text-emerald-300" />
              <span>แผนผังความก้าวหน้าการเรียนการสอน (Course Semester Roadmap)</span>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2.5">
              <span className="font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                {currentCourse.courseCode}
              </span>
              <span>{currentCourse.courseName}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
              <span>ชั้นปีที่ {currentCourse.yearLevel}</span>
              <span>•</span>
              <span>ห้องเรียน: {currentCourse.room || 'C301'}</span>
              <span>•</span>
              <span>เวลา: {currentCourse.startTime || '09:00'} - {currentCourse.endTime || '12:00'} น.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {nextUpcomingSession ? (
              <button
                type="button"
                onClick={() => handleFastOpenSession(nextUpcomingSession)}
                className="px-5 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 rounded-2xl text-xs sm:text-sm font-black shadow-xl shadow-emerald-950/50 flex items-center gap-2.5 transition transform hover:scale-[1.02] cursor-pointer"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping" />
                <span>🚀 เปิดเช็คชื่อคาบถัดไป (คาบที่ {nextUpcomingSession.sessionNumber} — {nextUpcomingSession.dateFormattedTh})</span>
              </button>
            ) : (
              <div className="px-4 py-2.5 bg-emerald-900/80 text-emerald-200 rounded-2xl text-xs font-bold border border-emerald-600/50 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>สอนครบตามเกณฑ์ 16 คาบของภาคเรียนแล้ว</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar & Overall Metric */}
        <div className="pt-3 border-t border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <span className="text-slate-300 font-medium whitespace-nowrap">
              สอนแล้ว <strong className="text-white font-bold">{completedSessionsCount}</strong> จากทั้งหมด {semesterTotalSessions} คาบ
            </span>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700/80 shadow-inner">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
            <span className="font-mono font-bold text-emerald-300 text-sm whitespace-nowrap">
              {progressPercent}%
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>สอนแล้ว ({completedSessionsCount})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-300 animate-pulse" />
              <span>คาบถัดไป (1)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span>ยังไม่ถึง ({Math.max(0, semesterTotalSessions - completedSessionsCount - (nextUpcomingSession ? 1 : 0))})</span>
            </span>
          </div>
        </div>
      </div>

      {/* 16-Week Session Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>ตารางผังการสอน 16 คาบตลอดภาคเรียนที่ 1/2569</span>
          </h3>
          <span className="text-xs text-slate-500">
            คลิกที่การ์ดเพื่อเปิดเช็คชื่อหรือดูสรุปผลของคาบนั้นๆ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {semesterRoadmapSessions.map((session) => {
            const isCompleted = session.status === 'COMPLETED';
            const isNextUp = session.status === 'NEXT_UP';

            return (
              <div
                key={session.sessionNumber}
                className={`rounded-2xl p-4 transition-all duration-200 border flex flex-col justify-between space-y-3 ${
                  isNextUp
                    ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-2 border-emerald-500 shadow-md shadow-emerald-500/10 scale-[1.02]'
                    : isCompleted
                    ? 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-sm'
                    : 'bg-slate-50/70 border-slate-200 opacity-80 hover:opacity-100 hover:bg-white'
                }`}
              >
                {/* Header: Session Number & Status */}
                <div className="flex items-start justify-between gap-2 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        isNextUp
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {session.sessionNumber}
                    </span>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">
                        คาบที่ {session.sessionNumber}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {session.dayNameTh}
                      </div>
                    </div>
                  </div>

                  {isNextUp ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-xs animate-pulse">
                      <Sparkles className="w-2.5 h-2.5" /> คาบถัดไป
                    </span>
                  ) : isCompleted ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> สอนแล้ว
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold text-[10px]">
                      ยังไม่ถึง
                    </span>
                  )}
                </div>

                {/* Date & Time Info */}
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{session.dateFormattedTh}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{session.startTime} - {session.endTime} น.</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>ห้อง {session.room}</span>
                  </div>
                </div>

                {/* Attendance Stats (if completed) or Prompt (if next up / upcoming) */}
                {isCompleted && session.stats ? (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="text-[11px]">มาเรียน:</span>
                      <span className="text-emerald-700 font-mono">
                        {session.stats.attendancePercent}% ({session.stats.present + session.stats.late}/{session.stats.totalStudents})
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold">
                      <span className="bg-emerald-100 text-emerald-800 rounded p-0.5" title="มา">
                        มา {session.stats.present}
                      </span>
                      <span className="bg-amber-100 text-amber-800 rounded p-0.5" title="สาย">
                        สาย {session.stats.late}
                      </span>
                      <span className="bg-blue-100 text-blue-800 rounded p-0.5" title="ลา">
                        ลา {session.stats.leave}
                      </span>
                      <span className="bg-rose-100 text-rose-800 rounded p-0.5" title="ขาด">
                        ขาด {session.stats.absent}
                      </span>
                    </div>
                  </div>
                ) : isNextUp ? (
                  <div className="p-2.5 rounded-xl bg-emerald-100/60 border border-emerald-300 text-emerald-950 text-xs font-semibold text-center">
                    🎯 คาบเรียนถัดไปที่ต้องเช็คชื่อ
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-100/60 text-slate-400 text-xs text-center font-medium">
                    ตามกำหนดการสัปดาห์
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-2">
                  {isNextUp ? (
                    <button
                      type="button"
                      onClick={() => handleFastOpenSession(session)}
                      className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>เปิดเช็คชื่อคาบนี้</span>
                    </button>
                  ) : isCompleted ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleFastOpenSession(session);
                      }}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>ดู/แก้ไขการเช็คชื่อ</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleFastOpenSession(session)}
                      className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <span>เปิดเช็คชื่อล่วงหน้า</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
