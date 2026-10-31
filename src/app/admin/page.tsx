import { universityStore } from '@/shared/lib/store/university-store';
import { formatDateTime } from '@/shared/lib/locale/date-formatter';
import Link from 'next/link';
import {
  ShieldCheck,
  FileSpreadsheet,
  Activity,
  Database,
  FileText,
  Calendar,
  Users,
  Grid3X3,
  BookOpen,
  Award,
  Layers,
  ArrowRight,
  Server,
  Cloud,
} from 'lucide-react';

export default function AdminPage() {
  const auditLogs = universityStore.getAuditLogs();
  const requests = universityStore.getRequests();
  const bookings = universityStore.getBookings();
  const students = universityStore.getStudents();
  const mode = process.env.DATA_SOURCE_MODE || 'HYBRID';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>ศูนย์กลางการบริหารจัดการ • Staff & Administrator Console</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">แผงควบคุมระบบบริการมหาวิทยาลัยดิจิทัล</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            มอนิเตอร์สถานะสถาปัตยกรรม Tri-Mode Google Sheets, Audit Logs, และการอนุมัติแบบเรียลไทม์
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Mode: {mode}
          </span>
        </div>
      </div>

      {/* Tri-Mode Architecture Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
              โหมดที่ 1 (Active)
            </span>
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Hybrid Auto-Sync Engine</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            อ่าน/เขียนเร็วระดับ Milliseconds ด้วย PostgreSQL (Prisma ORM) พร้อมส่งต่อแถวข้อมูลลง Google Sheets แบบอัตโนมัติ
          </p>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>ACID Transactions + Auto Sheets Append</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              โหมดที่ 2 (Ready)
            </span>
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Import & Export Center</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            ดึงรายชื่อนิสิต (Pull) และส่งออกประวัติ (Push) เชื่อมโยง Google Sheets Tab: Students_Master และ Courses_Master
          </p>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Batch Two-Way Synchronization</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              โหมดที่ 3 (Supported)
            </span>
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Direct Sheets Mode</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            รองรับการสลับรันแบบ Zero-DB โดยให้ Google Sheets API v4 เป็นฐานข้อมูลหลักโดยตรงผ่านตัวแปรแวดล้อม
          </p>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-amber-700 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>DATA_SOURCE_MODE=SHEETS</span>
          </div>
        </div>
      </div>

      {/* Quick Admin Actions */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900">การเข้าถึงระบบควบคุมแต่ละส่วน</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/requests"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-bold text-xs text-slate-900">อนุมัติคำร้อง</p>
                <p className="text-[11px] text-slate-400">{requests.filter(r => r.status === 'PENDING').length} รอดำเนินการ</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            href="/rooms"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-bold text-xs text-slate-900">จัดการจองห้อง</p>
                <p className="text-[11px] text-slate-400">{bookings.length} รายการจอง</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            href="/students"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-bold text-xs text-slate-900">ซิงค์ Sheets นิสิต</p>
                <p className="text-[11px] text-slate-400">{students.length} นิสิต</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            href="/timetable"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-cyan-400 hover:shadow-xs transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Grid3X3 className="w-5 h-5 text-cyan-600" />
              <div>
                <p className="font-bold text-xs text-slate-900">จัดตารางสอน</p>
                <p className="text-[11px] text-slate-400">Clash Warning On</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </div>

      {/* Real-time Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-slate-900">Audit Logs (บันทึกกิจกรรมความปลอดภัยในระบบ)</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time Stream</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">วันและเวลา</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Resource ID</th>
                <th className="py-3 px-4">รายละเอียดเพิ่มเติม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    ยังไม่มีกิจกรรมใหม่ในเซสชันนี้
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt, 'th')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {log.resource}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {log.resourceId || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
