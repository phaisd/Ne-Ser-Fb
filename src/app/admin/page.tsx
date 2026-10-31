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
  ArrowRight,
  Cloud,
} from 'lucide-react';

export default function AdminPage() {
  const requests = universityStore.getCertificateRequests();
  const bookings = universityStore.getMeetingBookings();
  const students = universityStore.getStudents();
  const courses = universityStore.getCourses();
  const events = universityStore.getEvents();
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
            โครงสร้างจริง Real Production Database (PostgreSQL Prisma + Google Sheets v4 Tri-Mode Engine)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Mode: {mode}
          </span>
        </div>
      </div>

      {/* Tri-Mode Architecture Cards */}
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
            อ่านและเขียนลง PostgreSQL (Prisma ORM) พร้อมส่งสำเนาแถวข้อมูลลง Google Sheets แบบอัตโนมัติ
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
            ดึงข้อมูลนิสิต (Pull) และส่งออกรายงานทะเบียน (Push) เชื่อมโยง Google Sheets Tab: Students_Master
          </p>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Two-Way Batch Synchronization</span>
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
          <h3 className="font-bold text-slate-900 text-sm">Direct Google Sheets Mode</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            สลับระบบมารันแบบ Standalone Zero-DB ตรงกับ Google Sheets API v4 ผ่าน DATA_SOURCE_MODE=SHEETS
          </p>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-amber-700 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Zero-Infrastructure Standalone</span>
          </div>
        </div>
      </div>

      {/* Quick Admin Navigation */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900">แผงควบคุมระบบงานแต่ละโมดูล</h2>
          <Link
            href="/admin/sync"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>เปิด Import / Export Center</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/requests"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-bold text-xs text-slate-900">พิจารณาคำร้อง</p>
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
                <p className="font-bold text-xs text-slate-900">จองห้องประชุม</p>
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
            href="/events"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-rose-400 hover:shadow-xs transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-rose-600" />
              <div>
                <p className="font-bold text-xs text-slate-900">กลุ่มวิปัสสนากรรมฐาน</p>
                <p className="text-[11px] text-slate-400">{events.length} โครงการ</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}
