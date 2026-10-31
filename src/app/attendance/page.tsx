import { universityStore } from '@/shared/lib/store/university-store';
import { checkInAttendanceAction } from '@/modules/attendance/actions';
import { generateQrDataUrl } from '@/shared/lib/qr';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  QrCode,
  UserCheck,
  Percent,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export default async function AttendancePage() {
  const summaries = universityStore.getAttendanceSummaries();
  const students = universityStore.getStudents();

  // Dynamic countdown QR for live session check-in
  const qrTokenData = `ATT-SESSION-${Date.now()}-EXP60`;
  const qrImage = await generateQrDataUrl(qrTokenData);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4" />
          <span>Module 3 • ระบบตรวจสอบเวลาเข้าเรียนและสิทธิ์สอบ</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">เวลาเข้าเรียน & สิทธิ์สอบ (เกณฑ์ขั้นต่ำ 80%)</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          เช็คชื่อรายคาบ คำนวณเปอร์เซ็นต์เข้าเรียนอัตโนมัติ ป้ายเตือนขาดสิทธิ์สอบ และ QR Code สแกนเช็คชื่อแบบเรียลไทม์
        </p>
      </div>

      {/* Top Banner: QR Countdown Check-in Widget for Classrooms */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Dynamic Classroom QR • สลับรหัสอัตโนมัติ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            QR Code เช็คชื่อประจำคาบเรียน: CS201 Algorithms
          </h2>
          <p className="text-xs text-purple-200 leading-relaxed">
            อาจารย์สามารถเปิดหน้าจอนี้ผ่าน Projector ประจำห้องเรียนเพื่อให้นิสิตใช้สมาร์ตโฟนสแกนเข้าชั้นเรียน
            ระบบจะอัปเดตสถิติเวลาเรียนและส่งสำเนาเข้า Google Sheets ทันที
          </p>
          <div className="text-xs text-purple-300 flex items-center gap-3">
            <span>เกณฑ์การคำนวณ:</span>
            <span className="font-mono bg-purple-950/60 px-2.5 py-1 rounded border border-purple-800">
              Rate = (มา + สาย×0.5) / คาบทั้งหมด × 100%
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-lg text-slate-900">
          {qrImage && (
            <img
              src={qrImage}
              alt="Class Attendance QR Code"
              className="w-36 h-36 rounded-lg"
            />
          )}
          <span className="text-[11px] font-mono text-purple-700 font-bold mt-2">
            สแกนเพื่อเช็คชื่อเข้าชั้นเรียน
          </span>
          <span className="text-[10px] text-slate-400">หมดอายุใน 60 วินาที</span>
        </div>
      </div>

      {/* Manual Check-in Form & Live Attendance Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Check-in Panel (For Instructors) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">บันทึกเวลาเรียนรายบุคคล (อาจารย์)</h2>
              <p className="text-[11px] text-slate-500">เลือกสถานะเพื่อบันทึกประวัติการเข้าเรียน</p>
            </div>
          </div>

          <form action={checkInAttendanceAction} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">เลือกนิสิต *</label>
              <select
                name="studentId"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.studentCode}>
                    {s.studentCode} - {s.firstNameTh} {s.lastNameTh} ({s.major})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">รหัสวิชา *</label>
              <select
                name="courseCode"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="CS201">CS201 - การวิเคราะห์และออกแบบขั้นตอนวิธี</option>
                <option value="CS202">CS202 - ระบบจัดการฐานข้อมูล</option>
                <option value="SE301">SE301 - วิศวกรรมซอฟต์แวร์</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">สถานะการเข้าเรียน *</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-emerald-50 cursor-pointer">
                  <input type="radio" name="status" value="PRESENT" defaultChecked />
                  <span className="font-semibold text-emerald-700">มาเรียน (Present)</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-amber-50 cursor-pointer">
                  <input type="radio" name="status" value="LATE" />
                  <span className="font-semibold text-amber-700">มาสาย (Late)</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-blue-50 cursor-pointer">
                  <input type="radio" name="status" value="LEAVE" />
                  <span className="font-semibold text-blue-700">ลา (Leave)</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 cursor-pointer">
                  <input type="radio" name="status" value="ABSENT" />
                  <span className="font-semibold text-rose-700">ขาดเรียน (Absent)</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-purple-500/20 transition cursor-pointer"
            >
              บันทึกเวลาเรียน (Save Attendance)
            </button>
          </form>
        </div>

        {/* Student Exam Eligibility Summary Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>รายงานสิทธิ์สอบนิสิตประจำภาคการศึกษา</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs">
                {summaries.length} คน
              </span>
            </h2>
            <span className="text-xs text-slate-500">เกณฑ์มาตรฐาน: เข้าเรียน ≥ 80%</span>
          </div>

          <div className="space-y-4">
            {summaries.map((item, idx) => (
              <div
                key={idx}
                className={`bg-white p-5 rounded-2xl border shadow-xs transition space-y-3 ${
                  item.isEligible ? 'border-slate-200' : 'border-rose-300 bg-rose-50/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{item.studentName}</span>
                    <span className="text-xs text-slate-500 ml-2">ID: {item.studentCode}</span>
                    <p className="text-xs text-purple-700 font-medium">{item.courseCode} - {item.courseName}</p>
                  </div>

                  <div>
                    {item.isEligible ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        มีสิทธิ์สอบ (Eligible)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        หมดสิทธิ์สอบ (Ineligible &lt; 80%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">อัตราการเข้าชั้นเรียน</span>
                    <span className="font-bold text-slate-900">{item.attendanceRate}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.isEligible ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, item.attendanceRate)}%` }}
                    />
                  </div>
                </div>

                {/* Session breakdown pill */}
                <div className="grid grid-cols-5 gap-2 pt-2 text-center text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-slate-400">ทั้งหมด</p>
                    <p className="font-bold text-slate-800">{item.totalSessions} คาบ</p>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800">
                    <p>มาเรียน</p>
                    <p className="font-bold">{item.presentCount}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-800">
                    <p>มาสาย</p>
                    <p className="font-bold">{item.lateCount}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-800">
                    <p>การลา</p>
                    <p className="font-bold">{item.leaveCount}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-800">
                    <p>ขาดเรียน</p>
                    <p className="font-bold">{item.absentCount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
