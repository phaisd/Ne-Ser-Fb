'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Clock,
  BookOpen,
  KeyRound,
  Calendar,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

function StudentQrCheckInContent() {
  const searchParams = useSearchParams();
  const initialCourse = searchParams.get('course') || '';
  const initialDate =
    searchParams.get('date') || new Date().toISOString().split('T')[0];
  const initialPin = searchParams.get('pin') || '';

  const [courseCode, setCourseCode] = useState(initialCourse);
  const [date, setDate] = useState(initialDate);
  const [pin, setPin] = useState(initialPin);
  const [studentCode, setStudentCode] = useState('');
  const [customStudentName, setCustomStudentName] = useState('');
  const [requireManualName, setRequireManualName] = useState(false);

  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [lookedUpStudent, setLookedUpStudent] = useState<any>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkInResult, setCheckInResult] = useState<any>(null);

  // Load saved student code on mobile browser
  useEffect(() => {
    try {
      const savedCode = localStorage.getItem('mcu_student_last_code');
      if (savedCode) setStudentCode(savedCode);
    } catch {}
  }, []);

  // Load session info when courseCode & date are present
  useEffect(() => {
    if (!courseCode.trim()) return;
    fetch(
      `/api/attendance/qr-checkin?courseCode=${encodeURIComponent(
        courseCode.trim()
      )}&date=${encodeURIComponent(date)}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.session) {
          setSessionInfo(d.session);
        }
      })
      .catch(() => {});
  }, [courseCode, date]);

  // Auto-lookup student info when studentCode changes (8+ chars)
  useEffect(() => {
    const clean = studentCode.trim();
    if (clean.length < 7 || !courseCode.trim()) {
      setLookedUpStudent(null);
      return;
    }

    const timer = setTimeout(() => {
      setLookingUp(true);
      fetch(
        `/api/attendance/qr-checkin?courseCode=${encodeURIComponent(
          courseCode.trim()
        )}&date=${encodeURIComponent(date)}&studentCode=${encodeURIComponent(
          clean
        )}`
      )
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.studentInfo) {
            setLookedUpStudent(d.studentInfo);
            setRequireManualName(false);
          } else {
            setLookedUpStudent(null);
          }
        })
        .catch(() => {})
        .finally(() => setLookingUp(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [studentCode, courseCode, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!courseCode.trim()) {
      setErrorMsg('กรุณาระบุรหัสวิชา');
      return;
    }
    if (!studentCode.trim()) {
      setErrorMsg('กรุณากรอกรหัสนิสิต 10 หลัก');
      return;
    }
    if (!pin.trim()) {
      setErrorMsg('กรุณากรอกรหัสเข้าเรียนประจำคาบ (PIN) ที่แสดงบนจอหน้าห้องเรียน');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance/qr-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'STUDENT_CHECKIN',
          courseCode: courseCode.trim(),
          date: date.trim(),
          pin: pin.trim(),
          studentCode: studentCode.trim(),
          studentName: customStudentName.trim(),
        }),
      });
      const data = await res.json();

      if (!data.success) {
        if (data.requireStudentName) {
          setRequireManualName(true);
        }
        setErrorMsg(data.error || 'ไม่สามารถเช็คชื่อได้');
        return;
      }

      try {
        localStorage.setItem('mcu_student_last_code', studentCode.trim());
      } catch {}

      setCheckInResult(data);
    } catch (err: unknown) {
      setErrorMsg((err instanceof Error ? err.message : String(err)) || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-4 px-2 sm:px-0 space-y-5">
      {/* Top Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/attendance"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้าระบบเข้าเรียน</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
          <QrCode className="w-3.5 h-3.5" />
          <span>ระบบนิสิตสแกนเช็คชื่อเข้าเรียน</span>
        </span>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-6 text-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur">
              คณะพุทธศาสตร์ มจร • Smart Check-In
            </span>
            {sessionInfo && (
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                  !sessionInfo.isOpen
                    ? 'bg-rose-500 text-white'
                    : sessionInfo.checkInStatus === 'LATE'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-emerald-400 text-slate-950'
                }`}
              >
                {!sessionInfo.isOpen
                  ? '🔴 ปิดรับเช็คชื่อแล้ว'
                  : sessionInfo.checkInStatus === 'LATE'
                  ? '🟡 โหมดเช็คชื่อ: มาสาย'
                  : '🟢 เปิดรับเช็คชื่อ: มาเรียนปกติ'}
              </span>
            )}
          </div>

          <h1 className="text-xl font-black leading-snug">
            {sessionInfo
              ? `${sessionInfo.courseCode} — ${sessionInfo.courseName}`
              : courseCode
              ? `รายวิชา ${courseCode}`
              : 'ลงชื่อเข้าชั้นเรียนผ่าน QR Code'}
          </h1>

          {sessionInfo && (
            <div className="text-xs text-emerald-100 flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
              <span>👨‍🏫 ผู้สอน: {sessionInfo.instructorName}</span>
              <span>📅 วันที่: {sessionInfo.date}</span>
              <span>🏫 ห้อง: {sessionInfo.room || '-'} (คาบที่ {sessionInfo.sessionNumber})</span>
            </div>
          )}
        </div>

        {/* Digital Receipt if Checked In Successfully */}
        {checkInResult ? (
          <div className="p-6 text-center space-y-5 animate-in fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
                {checkInResult.alreadyCheckedIn
                  ? '✓ บันทึกเช็คชื่อไว้เรียบร้อยแล้ว'
                  : '✅ เช็คชื่อเข้าชั้นเรียนสำเร็จ!'}
              </span>
              <h2 className="text-xl font-black text-slate-900 pt-1">
                {checkInResult.record?.studentName}
              </h2>
              <p className="text-sm font-mono font-bold text-emerald-700">
                รหัสนิสิต: {checkInResult.record?.studentCode}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">รายวิชา:</span>
                <span className="font-bold text-slate-900">
                  {checkInResult.record?.courseCode} {checkInResult.record?.courseName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">วันที่เรียน:</span>
                <span className="font-mono font-bold text-slate-800">
                  {checkInResult.record?.date}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">สถานะที่บันทึก:</span>
                <span
                  className={`font-extrabold px-2 py-0.5 rounded-full ${
                    checkInResult.record?.status === 'LATE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {checkInResult.record?.status === 'LATE'
                    ? 'มาสาย (LATE)'
                    : 'มาเรียนปกติ (PRESENT)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ช่องทางบันทึก:</span>
                <span className="text-slate-700 font-semibold">
                  {checkInResult.record?.recordedBy}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCheckInResult(null);
              }}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              เช็คชื่อให้นิสิตท่านอื่น / กลับหน้าฟอร์ม
            </button>
          </div>
        ) : (
          /* Check-In Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* If courseCode wasn't in URL, allow entering it */}
            {!initialCourse && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสวิชา (Course Code):
                  </label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="เช่น 000 135"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    วันที่เรียน:
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                    required
                  />
                </div>
              </div>
            )}

            {/* Student ID Input */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>1. กรอกรหัสนิสิต 10 หลัก (Student ID):</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="เช่น 6801501003"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:outline-none font-mono font-black text-lg tracking-wider text-slate-900 bg-slate-50/60"
                required
              />

              {/* Auto-verified Student Card */}
              {lookingUp && (
                <p className="text-[11px] text-slate-400 mt-1.5">
                  กำลังค้นหาข้อมูลนิสิต...
                </p>
              )}
              {lookedUpStudent && (
                <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-extrabold text-emerald-950">
                      ✓ {lookedUpStudent.fullName}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold">
                      {lookedUpStudent.major}{' '}
                      {lookedUpStudent.yearLevel ? `• ชั้นปีที่ ${lookedUpStudent.yearLevel}` : ''}
                    </div>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>
              )}
            </div>

            {/* Optional Manual Name if studentCode is new/transfer */}
            {requireManualName && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <label className="block text-xs font-extrabold text-amber-950">
                  ระบุชื่อ-ฉายา-นามสกุล (สำหรับนิสิตตกหล่น/เรียนข้ามสาขา):
                </label>
                <input
                  type="text"
                  value={customStudentName}
                  onChange={(e) => setCustomStudentName(e.target.value)}
                  placeholder="เช่น พระมหาสมชาย ญาณวโร"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white text-sm font-bold"
                  required
                />
              </div>
            )}

            {/* PIN Input */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>2. รหัสเข้าเรียนประจำคาบ (PIN บนจอหน้าห้อง):</span>
              </label>
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                placeholder="กรอกรหัส PIN บนจอโปรเจกเตอร์"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:outline-none font-mono font-black text-lg tracking-widest text-center text-emerald-800 bg-emerald-50/40"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || (sessionInfo && !sessionInfo.isOpen)}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {submitting
                  ? 'กำลังบันทึกการเข้าเรียน...'
                  : 'ยืนยันเช็คชื่อเข้าชั้นเรียน (Confirm Check-In)'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function StudentQrCheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-sm text-slate-500">
          กำลังโหลดหน้าเช็คชื่อเข้าเรียน...
        </div>
      }
    >
      <StudentQrCheckInContent />
    </Suspense>
  );
}
