import Link from 'next/link';
import { universityStore } from '@/shared/lib/store/university-store';
import { formatDateFull } from '@/shared/lib/locale/date-formatter';
import {
  FileText,
  Calendar,
  CheckCircle2,
  BookOpen,
  Users,
  Grid3X3,
  Award,
  ArrowRight,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const requests = universityStore.getCertificateRequests();
  const rooms = universityStore.getMeetingRooms();
  const bookings = universityStore.getMeetingBookings();
  const students = universityStore.getStudents();
  const courses = universityStore.getCourses();
  const events = universityStore.getEvents();

  const pendingRequests = requests.filter((r) => r.status === 'PENDING').length;
  const today = new Date();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-800 p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Building2 className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-200" />
            <span>{formatDateFull(today, 'th')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            ระบบบริการมหาวิทยาลัยดิจิทัล
          </h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            ศูนย์กลางบริการการศึกษาและบริหารมหาวิทยาลัย รองรับนิสิตบรรพชิตและคฤหัสถ์ (พระ, สามเณร, นาย, นางสาว)
            เชื่อมโยงฐานข้อมูลจริง (Prisma Schema) พร้อมระบบ Auto-Sync สู่ Google Sheets แบบเรียลไทม์
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/certificates"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-900 font-semibold text-sm hover:bg-blue-50 shadow-md transition"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>ยื่นคำร้องขอหนังสือรับรอง</span>
            </Link>
            <Link
              href="/rooms"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/40 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm hover:bg-blue-600/60 transition"
            >
              <Calendar className="w-4 h-4 text-emerald-300" />
              <span>จองห้องประชุมออนไลน์</span>
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-700 text-amber-300 font-semibold text-sm hover:bg-slate-900 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>แผงควบคุมเจ้าหน้าที่ (Admin)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Key Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">คำร้องรอพิจารณา</p>
            <p className="text-2xl font-bold text-slate-900">{pendingRequests} <span className="text-xs font-normal text-slate-400">รายการ</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">ห้องประชุมพร้อมใช้งาน</p>
            <p className="text-2xl font-bold text-slate-900">{rooms.length} <span className="text-xs font-normal text-slate-400">ห้อง</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">นิสิตในทะเบียน</p>
            <p className="text-2xl font-bold text-slate-900">{students.length} <span className="text-xs font-normal text-slate-400">รูป/คน</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">วิชาที่เปิดสอน</p>
            <p className="text-2xl font-bold text-slate-900">{courses.length} <span className="text-xs font-normal text-slate-400">รายวิชา</span></p>
          </div>
        </div>
      </div>

      {/* 7 Core Modules Interactive Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">โมดูลระบบบริการตามโครงสร้างจริง (Production Modules)</h2>
          <p className="text-xs text-slate-500">ตรงตามโครงสร้าง Prisma Schema จริง: certificate_requests, meeting_rooms, students, courses, attendance_sessions, events</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Module 1 */}
          <Link
            href="/certificates"
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                1. คำร้องขอหนังสือรับรอง (certificate_requests)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                หนังสือรับรองการเป็นนิสิต, ความประพฤติ, ผ่อนผันการเกณฑ์ทหาร, ทรานสคริปต์ พร้อมพิมพ์ฟอร์ม A4 และ QR Code
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>เข้าสู่บริการยื่นคำร้อง</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 2 */}
          <Link
            href="/rooms"
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                2. จองห้องประชุมออนไลน์ (meeting_bookings)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ตรวจจับการจองซ้อนทับ (Anti-Double Booking 100%) ตรวจสอบอุปกรณ์ประจำห้อง และบันทึกลง Google Sheets ทันที
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
              <span>จองห้องประชุม</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 3 */}
          <Link
            href="/attendance"
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-purple-500/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                3. เช็คชื่อ & สิทธิ์สอบ 80% (attendance_sessions)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                เช็คชื่อรายคาบ (เป้าหมาย ๑๖ คาบ) พร้อม Dynamic Timed QR Code และคำนวณเกณฑ์สิทธิ์สอบตาม calculation_rules
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
              <span>ตรวจสอบสิทธิ์สอบ</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 4 */}
          <Link
            href="/curriculum"
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-500/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                4. ทะเบียนรายวิชา (courses)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                โครงสร้างรายวิชา TH/EN ภาค/ปีการศึกษา คาบเป้าหมาย และระบบนำเข้าข้อมูลจาก Google Sheets (Import Sync)
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600">
              <span>ดูรายวิชาที่เปิดสอน</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 5 */}
          <Link
            href="/students"
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                5. ทะเบียนนิสิต & Sheets Center (students)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                แฟ้มประวัตินิสิตบรรพชิตและคฤหัสถ์ (พระ, สามเณร, นาย, นางสาว) พร้อมระบบ Import (Pull) และ Export (Push)
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
              <span>จัดการทะเบียนนิสิต</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 6 */}
          <Link
            href="/timetable"
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-cyan-500/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Grid3X3 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                6. ตารางเรียน-ตารางสอน (Matrix Grid)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                จัดสรรห้องเรียน วันเวลา (day_of_week 1-7) พร้อมระบบตรวจจับตารางชน (Clash Detection) และพิมพ์ตารางสอน
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-cyan-600">
              <span>เปิดตารางเรียน</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 7 */}
          <Link
            href="/events"
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-rose-500/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between md:col-span-2 lg:col-span-1"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                7. กิจกรรม & การอบรมวิปัสสนากรรมฐาน (events)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                จัดกลุ่มปฏิบัติธรรม (group_number, group_name), meditation_config และระบบเช็คชื่อรายวัน (daily_attendance)
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-600">
              <span>ดูกิจกรรมและกลุ่มปฏิบัติธรรม</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
