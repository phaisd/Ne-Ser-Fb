'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Sparkles,
  RefreshCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  Copy,
  Check,
  Users,
  Clock,
  ShieldCheck,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { Course, Student, AttendanceRecord } from '@/types';

interface ClassroomQrProjectorProps {
  availableCourses: Course[];
  currentCourse: Course | null;
  onSelectCourse: (courseCode: string) => void;
  date: string;
  onChangeDate: (newDate: string) => void;
  sessionNumber: number;
  onChangeSessionNumber: (num: number) => void;
  targetStudents: Student[];
  currentUser: any;
  recordedBy: string;
  onRecordsSynced: (records: AttendanceRecord[]) => void;
}

export function ClassroomQrProjector({
  availableCourses,
  currentCourse,
  onSelectCourse,
  date,
  onChangeDate,
  sessionNumber,
  onChangeSessionNumber,
  targetStudents,
  currentUser,
  recordedBy,
  onRecordsSynced,
}: ClassroomQrProjectorProps) {
  const [pin, setPin] = useState<string>('10106');
  const [checkInStatus, setCheckInStatus] = useState<'PRESENT' | 'LATE'>('PRESENT');
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [checkedInRecords, setCheckedInRecords] = useState<AttendanceRecord[]>([]);
  const [activeListTab, setActiveListTab] = useState<'CHECKED_IN' | 'MISSING'>('CHECKED_IN');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [syncingQuickCheckIn, setSyncingQuickCheckIn] = useState<string | null>(null);
  const projectorRef = useRef<HTMLDivElement>(null);

  // Initialize base URL from window.location.origin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Load or initialize QR session when course or date changes
  useEffect(() => {
    if (!currentCourse) return;
    fetch(
      `/api/attendance/qr-checkin?courseCode=${encodeURIComponent(
        currentCourse.courseCode
      )}&date=${encodeURIComponent(date)}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.session) {
          setPin(d.session.pin);
          setCheckInStatus(d.session.checkInStatus || 'PRESENT');
          setIsOpen(d.session.isOpen !== false);
          if (d.checkedInRecords) {
            setCheckedInRecords(d.checkedInRecords);
          }
        }
      })
      .catch(() => {});
  }, [currentCourse?.courseCode, date]);

  // Poll live check-ins every 3 seconds while projector is open
  useEffect(() => {
    if (!currentCourse) return;
    const interval = setInterval(() => {
      fetch(
        `/api/attendance/qr-checkin?courseCode=${encodeURIComponent(
          currentCourse.courseCode
        )}&date=${encodeURIComponent(date)}`
      )
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.checkedInRecords)) {
            setCheckedInRecords((prev) => {
              if (d.checkedInRecords.length !== prev.length) {
                // Also refresh global attendance records so parent tabs stay in sync
                fetch('/api/attendance')
                  .then((res) => res.json())
                  .then((allData) => {
                    if (allData.success && Array.isArray(allData.data)) {
                      onRecordsSynced(allData.data);
                    }
                  })
                  .catch(() => {});
              }
              return d.checkedInRecords;
            });
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [currentCourse?.courseCode, date]);

  const checkInUrl = currentCourse
    ? `${baseUrl || 'http://localhost:3020'}/attendance/checkin?course=${encodeURIComponent(
        currentCourse.courseCode
      )}&date=${encodeURIComponent(date)}&pin=${encodeURIComponent(pin)}`
    : '';

  // Generate real scannable QR code whenever checkInUrl changes
  useEffect(() => {
    if (!checkInUrl) {
      setQrDataUrl('');
      return;
    }
    QRCode.toDataURL(checkInUrl, {
      width: 340,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [checkInUrl]);

  // Save updated session settings (PIN / Status / Open-Close) to server
  const updateServerSession = async (overrides: {
    newPin?: string;
    newStatus?: 'PRESENT' | 'LATE';
    newIsOpen?: boolean;
    newSessionNum?: number;
  }) => {
    if (!currentCourse) return;
    const nextPin = overrides.newPin ?? pin;
    const nextStatus = overrides.newStatus ?? checkInStatus;
    const nextIsOpen = overrides.newIsOpen ?? isOpen;
    const nextSessionNum = overrides.newSessionNum ?? sessionNumber;

    try {
      const res = await fetch('/api/attendance/qr-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPSERT_SESSION',
          courseCode: currentCourse.courseCode,
          courseName: currentCourse.courseName,
          date,
          sessionNumber: nextSessionNum,
          pin: nextPin,
          checkInStatus: nextStatus,
          isOpen: nextIsOpen,
          instructorName: currentUser?.name || currentCourse.instructor || recordedBy,
          room: currentCourse.room || '-',
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setPin(data.session.pin);
        setCheckInStatus(data.session.checkInStatus);
        setIsOpen(data.session.isOpen);
      }
    } catch {}
  };

  const handleRegeneratePin = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const nextPin = String(randomNum);
    setPin(nextPin);
    updateServerSession({ newPin: nextPin });
  };

  const handleToggleFullscreen = () => {
    if (!projectorRef.current) return;
    if (!document.fullscreenElement) {
      projectorRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Manual 1-click check-in from instructor's missing students list
  const handleManualQuickCheckIn = async (stu: Student) => {
    if (!currentCourse) return;
    setSyncingQuickCheckIn(stu.studentCode);
    try {
      const res = await fetch('/api/attendance/qr-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'STUDENT_CHECKIN',
          courseCode: currentCourse.courseCode,
          date,
          pin,
          studentCode: stu.studentCode,
          studentName:
            stu.fullName || `${stu.title || ''} ${stu.firstName} ${stu.lastName}`.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.record) {
        setCheckedInRecords((prev) => [data.record, ...prev]);
        fetch('/api/attendance')
          .then((r) => r.json())
          .then((allData) => {
            if (allData.success) onRecordsSynced(allData.data);
          });
      }
    } finally {
      setSyncingQuickCheckIn(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
        <Lock className="w-10 h-10 text-amber-600 mx-auto" />
        <h3 className="font-bold text-slate-800 text-sm">
          กรุณาเข้าสู่ระบบอาจารย์ผู้สอนเพื่อเปิดจอ QR Code ประจำวิชา
        </h3>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3 text-slate-500 text-sm">
        <p>ไม่พบรายวิชาที่ท่านสอนสำหรับเปิดจอ QR Code</p>
      </div>
    );
  }

  const checkedInCodes = new Set(
    checkedInRecords.map((r) => r.studentCode.trim().toLowerCase())
  );
  const missingStudents = targetStudents.filter(
    (s) => !checkedInCodes.has(s.studentCode.trim().toLowerCase())
  );
  const totalEnrolled = targetStudents.length || 1;
  const checkedInCount = checkedInRecords.length;
  const progressPct = Math.min(100, Math.round((checkedInCount / totalEnrolled) * 100));

  return (
    <div
      ref={projectorRef}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden print:hidden space-y-0"
    >
      {/* 1. Top Control Bar for Instructor */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>โหมดฉายโปรเจกเตอร์ QR เช็คชื่อสด</span>
          </span>

          {/* Course Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={(currentCourse as any).sectionKey || currentCourse.courseCode}
              onChange={(e) => onSelectCourse(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer max-w-[160px] sm:max-w-xs md:max-w-none truncate"
            >
              {availableCourses.map((c, idx) => (
                <option
                  key={`${(c as any).sectionKey || c.courseCode}-${idx}`}
                  value={(c as any).sectionKey || c.courseCode}
                  className="text-slate-900"
                >
                  {c.courseCode} — {c.courseName} (ปี {(c as any).yearLevel || 1})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <input
              type="date"
              value={date}
              onChange={(e) => onChangeDate(e.target.value)}
              className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
            />
          </div>

          {/* Session Number */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">คาบที่:</span>
            <select
              value={sessionNumber}
              onChange={(e) => {
                const n = Number(e.target.value);
                onChangeSessionNumber(n);
                updateServerSession({ newSessionNum: n });
              }}
              className="bg-transparent text-amber-300 font-extrabold focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n} className="text-slate-900">
                  คาบที่ {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Controls: Status Mode, Open/Close, Fullscreen */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Toggle PRESENT vs LATE */}
          <div className="inline-flex p-0.5 rounded-xl bg-slate-800 border border-slate-700">
            <button
              type="button"
              onClick={() => {
                setCheckInStatus('PRESENT');
                updateServerSession({ newStatus: 'PRESENT' });
              }}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition cursor-pointer ${
                checkInStatus === 'PRESENT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🟢 มาเรียนปกติ
            </button>
            <button
              type="button"
              onClick={() => {
                setCheckInStatus('LATE');
                updateServerSession({ newStatus: 'LATE' });
              }}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition cursor-pointer ${
                checkInStatus === 'LATE'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🟡 มาสาย (Late)
            </button>
          </div>

          {/* Open / Close Session */}
          <button
            type="button"
            onClick={() => {
              const next = !isOpen;
              setIsOpen(next);
              updateServerSession({ newIsOpen: next });
            }}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition cursor-pointer ${
              isOpen
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-rose-600 border-rose-500 text-white'
            }`}
          >
            {isOpen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isOpen ? 'เปิดรับสแกนอยู่' : 'ปิดรับสแกนแล้ว'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="ขยายเต็มจอโปรเจกเตอร์"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span>{isFullscreen ? 'ย่อหน้าจอ' : 'ขยายเต็มจอ'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Split Layout: Left QR & PIN | Right Live Check-In Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* LEFT COLUMN (7 cols): Big Scannable QR Code & PIN */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-5 bg-gradient-to-b from-white to-slate-50/70">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <span>วิชา {currentCourse.courseCode}</span>
              <span>•</span>
              <span>ห้อง {currentCourse.room || '-'}</span>
              <span>•</span>
              <span>คาบที่ {sessionNumber}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 pt-1">
              {currentCourse.courseName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              อาจารย์ผู้สอน: <strong className="text-slate-800">{currentUser.name}</strong> | วันที่เรียน:{' '}
              <strong className="font-mono text-slate-800">{date}</strong>
            </p>
          </div>

          {/* QR Code & PIN Showcase Box */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-md max-w-xl w-full">
            {/* Real Scannable QR Image */}
            <div className="relative p-3 bg-white rounded-2xl border-2 border-slate-900 shadow-xs shrink-0">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code สำหรับสแกนเช็คชื่อ"
                  className={`w-56 h-56 sm:w-64 sm:h-64 object-contain ${
                    !isOpen ? 'opacity-25 blur-xs' : ''
                  }`}
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  <QrCode className="w-24 h-24 animate-pulse" />
                </div>
              )}
              {!isOpen && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="px-4 py-2 rounded-xl bg-rose-600 text-white font-extrabold text-sm shadow-lg">
                    ปิดรับการสแกนแล้ว
                  </span>
                </div>
              )}
            </div>

            {/* Giant PIN & Quick Actions */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                  รหัสเข้าเรียนประจำคาบ (PIN)
                </span>
                <div className="text-4xl sm:text-5xl font-mono font-black text-emerald-600 tracking-widest mt-1 bg-emerald-50 px-4 py-2 rounded-2xl border-2 border-emerald-200">
                  {pin}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <p className="font-bold text-slate-800">📱 ขั้นตอนสำหรับนิสิต:</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                  <li>เปิดกล้องมือถือ หรือแอป LINE สแกน QR Code</li>
                  <li>กรอกรหัสนิสิต 10 หลักของตนเอง</li>
                  <li>
                    ยืนยันรหัส PIN <strong className="text-emerald-700">{pin}</strong> แล้วกดเช็คชื่อ
                  </li>
                </ol>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRegeneratePin}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="สุ่มรหัส PIN ใหม่เพื่อป้องกันการส่งรหัสให้เพื่อนที่ไม่ได้อยู่ในห้องเรียน"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>สุ่มรหัส PIN ใหม่</span>
                </button>

                <a
                  href={checkInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>เปิดหน้าเช็คชื่อนิสิต</span>
                </a>
              </div>
            </div>
          </div>

          {/* Host / Wi-Fi URL Config Bar (For Classroom Projector over Wi-Fi) */}
          <div className="w-full max-w-xl p-3 rounded-2xl bg-slate-100 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
              <span className="font-bold text-slate-600 shrink-0">🔗 ลิงก์สแกน:</span>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value.replace(/\/$/, ''))}
                placeholder="http://localhost:3020 หรือ IP เครื่องในวง Wi-Fi"
                className="flex-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-mono text-[11px] text-slate-800"
                title="หากนิสิตสแกนผ่าน Wi-Fi เดียวกัน สามารถเปลี่ยน localhost เป็น IP ของคอมพิวเตอร์อาจารย์ เช่น http://192.168.1.50:3020"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(checkInUrl);
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
              }}
              className="px-3 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">คัดลอกลิงก์แล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกลิงก์เช็คชื่อ</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Real-Time Live Student Check-In Feed */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white">
          <div className="p-5 space-y-4">
            {/* Live Counter & Progress Bar */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-extrabold text-emerald-950">
                    สถานะการสแกนเช็คชื่อสด (Real-time Feed)
                  </span>
                </div>
                <span className="text-sm font-black text-emerald-700">
                  {checkedInCount} / {targetStudents.length} รูป/คน ({progressPct}%)
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-emerald-200/70 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Sub-tabs: Checked-In vs Missing */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveListTab('CHECKED_IN')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeListTab === 'CHECKED_IN'
                    ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>เช็คชื่อแล้ว ({checkedInCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveListTab('MISSING')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeListTab === 'MISSING'
                    ? 'bg-white text-rose-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>ยังไม่สแกน ({missingStudents.length})</span>
              </button>
            </div>

            {/* Student List Feed */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 border border-slate-200/80 rounded-2xl">
              {activeListTab === 'CHECKED_IN' ? (
                checkedInRecords.length === 0 ? (
                  <div className="py-14 px-4 text-center space-y-2 text-slate-400 text-xs">
                    <Users className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold">รอนิสิตสแกน QR Code เข้าชั้นเรียน...</p>
                    <p className="text-[11px]">
                      เมื่อนิสิตกดยืนยันเช็คชื่อในมือถือ รายชื่อจะเด้งขึ้นที่นี่อัตโนมัติทันที
                    </p>
                  </div>
                ) : (
                  checkedInRecords
                    .slice()
                    .reverse()
                    .map((rec, idx) => (
                      <div
                        key={`${rec.studentCode}-${idx}`}
                        className="p-3 hover:bg-slate-50 flex items-center justify-between gap-2 text-xs animate-in fade-in"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {rec.studentName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            รหัส: {rec.studentCode}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold shrink-0 ${
                            rec.status === 'LATE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {rec.status === 'LATE' ? '🟡 มาสาย' : '🟢 มาเรียน'}
                        </span>
                      </div>
                    ))
                )
              ) : missingStudents.length === 0 ? (
                <div className="py-12 px-4 text-center text-emerald-700 font-bold text-xs">
                  🎉 นิสิตในรายวิชานี้เช็คชื่อครบทุกคนแล้ว!
                </div>
              ) : (
                missingStudents.map((stu) => (
                  <div
                    key={stu.studentCode}
                    className="p-3 hover:bg-slate-50 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">
                        {stu.fullName || `${stu.title || ''} ${stu.firstName} ${stu.lastName}`}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        รหัส: {stu.studentCode}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={syncingQuickCheckIn === stu.studentCode}
                      onClick={() => handleManualQuickCheckIn(stu)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold shrink-0 transition cursor-pointer"
                      title="กดเพื่อเช็คชื่อให้นิสิตท่านนี้โดยตรง (กรณีไม่มีมือถือหรือแบตหมด)"
                    >
                      {syncingQuickCheckIn === stu.studentCode ? 'กำลังบันทึก...' : '+ เช็คชื่อให้'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>🔄 อัปเดตรายชื่ออัตโนมัติทุก 3 วินาที</span>
            <span className="font-semibold text-emerald-700">
              บันทึกตรงเข้าตารางเช็คชื่อ & Google Sheets
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
