'use client';

import { useState, useEffect } from 'react';
import { 
  Award, 
  Calendar, 
  MapPin, 
  Users, 
  Search, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Check, 
  UserPlus, 
  FileText,
  Filter,
  CheckSquare
} from 'lucide-react';
import { getAuthUser, isAdminOrOfficer, saveAuthSession } from '@/lib/auth-client';

interface StudentEvent {
  id: string;
  title: string;
  description?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  academicYear?: string;
  semester?: number;
  maxParticipants?: number;
  status?: string;
}

interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle?: string;
  studentCode: string;
  studentName: string;
  status: 'REGISTERED' | 'ATTENDED' | 'CANCELLED';
  role?: string;
  major?: string;
  yearLevel?: number;
  department?: string;
  groupName?: string;
  createdAt: string;
}

interface Student {
  studentCode: string;
  fullName?: string;
  title?: string;
  firstName: string;
  lastName: string;
  major?: string;
  department?: string;
  yearLevel?: number;
}

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'STUDENT_TRANSCRIPT' | 'CHECKIN'>('EVENTS');
  const [events, setEvents] = useState<StudentEvent[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const canManageCheckin =
    isAdminOrOfficer(currentUser) || currentUser?.role === 'INSTRUCTOR';

  // Student search for transcript
  const [searchStudentCode, setSearchStudentCode] = useState('');

  // Register Modal
  const [selectedEventForReg, setSelectedEventForReg] = useState<StudentEvent | null>(null);
  const [regStudentCode, setRegStudentCode] = useState('');
  const [regStudentName, setRegStudentName] = useState('');
  const [regMajor, setRegMajor] = useState('');
  const [regYear, setRegYear] = useState('1');
  const [regGroup, setRegGroup] = useState('กลุ่มทั่วไป');
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Check-in filter
  const [checkinEventId, setCheckinEventId] = useState<string>('');

  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      setCurrentUser(user);
    } else {
      fetch('/api/auth')
        .then((r) => r.json())
        .then((d) => {
          if (d.authenticated && d.user) {
            setCurrentUser(d.user);
            saveAuthSession(d.user, true);
          }
        })
        .catch(() => {});
    }

    Promise.all([
      fetch('/api/events').then((res) => res.json()),
      fetch('/api/students').then((res) => res.json()),
    ])
      .then(([eData, sData]) => {
        if (eData.success) {
          setEvents(eData.events || []);
          setRegistrations(eData.registrations || []);
          if (eData.events && eData.events.length > 0) {
            setCheckinEventId(eData.events[0].id);
          }
        }
        if (sData.success) {
          setStudents(sData.data || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Auto-fill student in modal
  const handleRegCodeChange = (code: string) => {
    setRegStudentCode(code);
    const found = students.find((s) => s.studentCode === code.trim());
    if (found) {
      setRegStudentName(found.fullName || `${found.title || ''} ${found.firstName} ${found.lastName}`);
      setRegMajor(found.major || '');
      setRegYear(String(found.yearLevel || 1));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForReg || !regStudentCode || !regStudentName) {
      alert('กรุณากรอกรหัสนิสิตและชื่อ-สกุล');
      return;
    }

    setSubmittingReg(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventForReg.id,
          studentCode: regStudentCode,
          studentName: regStudentName,
          major: regMajor,
          yearLevel: regYear,
          groupName: regGroup,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setRegSuccess(`ลงทะเบียนเข้าร่วม "${selectedEventForReg.title}" สำเร็จเรียบร้อย!`);
        setRegistrations((prev) => [resData.data, ...prev]);
        setSelectedEventForReg(null);
        setRegStudentCode('');
        setRegStudentName('');
      } else {
        alert('เกิดข้อผิดพลาด: ' + resData.error);
      }
    } catch (err: any) {
      alert('ลงทะเบียนล้มเหลว: ' + err.message);
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleToggleCheckin = async (regId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ATTENDED' ? 'REGISTERED' : 'ATTENDED';
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkin',
          registrationId: regId,
          status: nextStatus,
        }),
      });

      if (res.ok) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === regId ? { ...r, status: nextStatus } : r))
        );
      }
    } catch (err) {
      console.error('Error toggling checkin:', err);
    }
  };

  // Filtered registrations for transcript tab
  const studentTranscriptRecords = searchStudentCode.trim()
    ? registrations.filter((r) => r.studentCode.toLowerCase().includes(searchStudentCode.trim().toLowerCase()))
    : [];

  // Filtered registrations for checkin tab
  const checkinRecords = checkinEventId
    ? registrations.filter((r) => r.eventId === checkinEventId)
    : registrations;

  const currentCheckinEvent = events.find((e) => e.id === checkinEventId);
  const attendedCount = checkinRecords.filter((r) => r.status === 'ATTENDED').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-600" />
            ระบบเข้าร่วมกิจกรรมของนิสิต (Student Activities)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            โครงการปฏิบัติวิปัสสนากัมมัฏฐาน ค่ายคุณธรรม ตรวจสอบชั่วโมงกิจกรรม และเช็คชื่อเข้าร่วม
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto text-sm font-semibold">
          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`px-3.5 py-2 rounded-lg transition ${
              activeTab === 'EVENTS'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            โครงการ/กิจกรรม ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('STUDENT_TRANSCRIPT')}
            className={`px-3.5 py-2 rounded-lg transition ${
              activeTab === 'STUDENT_TRANSCRIPT'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ตรวจสอบกิจกรรมรายบุคคล
          </button>
          {canManageCheckin && (
            <button
              onClick={() => setActiveTab('CHECKIN')}
              className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${
                activeTab === 'CHECKIN'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เช็คชื่อเข้าร่วมกิจกรรม
            </button>
          )}
        </div>
      </div>

      {regSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{regSuccess}</span>
          </div>
          <button onClick={() => setRegSuccess(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: Events Directory */}
      {activeTab === 'EVENTS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((evt) => {
              const regCount = registrations.filter((r) => r.eventId === evt.id).length;
              return (
                <div
                  key={evt.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                        <Sparkles className="w-3.5 h-3.5" />
                        {evt.eventType === 'MEDITATION' ? 'วิปัสสนากัมมัฏฐาน' : 'กิจกรรมเสริมหลักสูตร'}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        ปีการศึกษา {evt.academicYear || '2569'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {evt.title}
                    </h3>

                    <div className="space-y-2 text-xs text-slate-600 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          {evt.startDate ? evt.startDate : 'ภาคการศึกษาที่ ' + (evt.semester || 1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="line-clamp-1">{evt.location || 'คณะพุทธศาสตร์'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>
                          ผู้เข้าร่วมที่ลงทะเบียนแล้ว:{' '}
                          <strong className="text-slate-800">{regCount}</strong> คน
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      onClick={() => setSelectedEventForReg(evt)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      ลงทะเบียนเข้าร่วม
                    </button>
                    <button
                      onClick={() => {
                        setCheckinEventId(evt.id);
                        setActiveTab('CHECKIN');
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-amber-700 transition"
                    >
                      ดูรายชื่อผู้เข้าร่วม ({regCount}) &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Student Transcript */}
      {activeTab === 'STUDENT_TRANSCRIPT' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm max-w-2xl mx-auto space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              ตรวจสอบบันทึกการเข้าร่วมกิจกรรมของนิสิต
            </h2>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="กรอกรหัสนิสิต (เช่น T307 หรือ 660101005)..."
                value={searchStudentCode}
                onChange={(e) => setSearchStudentCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
            <p className="text-xs text-slate-400">
              * ข้อมูลดึงจากฐานข้อมูลและ Google Sheets (แท็บ EventRegistrations)
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {!searchStudentCode.trim() ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
                พิมพ์รหัสนิสิตในช่องค้นหาด้านบน เพื่อดูบันทึกและประวัติการเข้าร่วมกิจกรรม
              </div>
            ) : studentTranscriptRecords.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
                ไม่พบประวัติการลงทะเบียนกิจกรรมสำหรับรหัสนิสิต &quot;{searchStudentCode}&quot;
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm block">
                      {studentTranscriptRecords[0].studentName} ({studentTranscriptRecords[0].studentCode})
                    </span>
                    <span className="text-xs text-amber-700">
                      สาขาวิชา: {studentTranscriptRecords[0].major || '-'} | ชั้นปีที่ {studentTranscriptRecords[0].yearLevel || '-'}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white text-amber-800 text-xs font-bold shadow-sm">
                    เข้าร่วม {studentTranscriptRecords.filter((r) => r.status === 'ATTENDED').length} จาก {studentTranscriptRecords.length} กิจกรรม
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {studentTranscriptRecords.map((r) => (
                      <div key={r.id} className="p-5 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-sm">{r.eventTitle}</h4>
                          <div className="text-xs text-slate-500">
                            กลุ่ม: {r.groupName || 'ทั่วไป'} | วันที่ลงทะเบียน: {new Date(r.createdAt).toLocaleDateString('th-TH')}
                          </div>
                        </div>
                        <div>
                          {r.status === 'ATTENDED' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              ผ่านการเข้าร่วมแล้ว
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              ลงทะเบียนไว้ (รอตรวจ)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Event Check-in */}
      {activeTab === 'CHECKIN' && canManageCheckin && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  เลือกโครงการ/กิจกรรมที่จะเช็คชื่อ:
                </label>
                <select
                  value={checkinEventId}
                  onChange={(e) => setCheckinEventId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>

              {currentCheckinEvent && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-xs font-semibold text-amber-800 self-start md:self-end">
                  <span>ผู้เข้าร่วมทั้งหมด: {checkinRecords.length} คน</span>
                  <span>|</span>
                  <span className="text-emerald-700 font-bold">มาแล้ว: {attendedCount} คน</span>
                </div>
              )}
            </div>
          </div>

          {/* Table of registered students for this event */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">
                รายชื่อนิสิตที่ลงทะเบียน ({checkinRecords.length} คน)
              </h3>
              <span className="text-xs text-slate-500">
                คลิกปุ่มสถานะเพื่อสลับเป็น &quot;มาแล้ว&quot; หรือ &quot;ยังไม่มา&quot; (ซิงค์ตรงเข้า Google Sheets)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-400 border-b">
                  <tr>
                    <th className="px-6 py-3.5 w-16">ลำดับ</th>
                    <th className="px-6 py-3.5">รหัสนิสิต</th>
                    <th className="px-6 py-3.5">ชื่อ - นามสกุล</th>
                    <th className="px-6 py-3.5">สาขา / ชั้นปี</th>
                    <th className="px-6 py-3.5">กลุ่ม</th>
                    <th className="px-6 py-3.5 text-center">สถานะการเข้าร่วม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {checkinRecords.map((r, i) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">{i + 1}</td>
                      <td className="px-6 py-4 font-mono font-bold text-amber-800">{r.studentCode}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{r.studentName}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {r.major || '-'} {r.yearLevel ? `(ปี ${r.yearLevel})` : ''}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">{r.groupName || 'ทั่วไป'}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleCheckin(r.id, r.status)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                            r.status === 'ATTENDED'
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {r.status === 'ATTENDED' ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              มาเข้าร่วมแล้ว
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              รอเช็คชื่อ (คลิกเพื่อเช็ค)
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {selectedEventForReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                  ลงทะเบียนกิจกรรม
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  {selectedEventForReg.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEventForReg(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-sm">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  รหัสนิสิต <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 660101005 หรือ T307"
                  value={regStudentCode}
                  onChange={(e) => handleRegCodeChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ชื่อ - นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ชื่อและนามสกุลนิสิต"
                  value={regStudentName}
                  onChange={(e) => setRegStudentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">สาขาวิชา</label>
                  <input
                    type="text"
                    placeholder="เช่น พระพุทธศาสนา"
                    value={regMajor}
                    onChange={(e) => setRegMajor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ชั้นปี</label>
                  <select
                    value={regYear}
                    onChange={(e) => setRegYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="1">ปีที่ 1</option>
                    <option value="2">ปีที่ 2</option>
                    <option value="3">ปีที่ 3</option>
                    <option value="4">ปีที่ 4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">กลุ่มปฏิบัติ/ที่นั่ง</label>
                <input
                  type="text"
                  placeholder="เช่น กลุ่มที่ 1 หรือ ทั่วไป"
                  value={regGroup}
                  onChange={(e) => setRegGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReg}
                className="w-full py-3 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 disabled:opacity-50 transition shadow-md shadow-amber-600/20 mt-2"
              >
                {submittingReg ? 'กำลังลงทะเบียน...' : 'ยืนยันการลงทะเบียน'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
