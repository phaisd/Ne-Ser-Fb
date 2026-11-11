import Link from 'next/link';
import { 
  Users, 
  Calendar, 
  CheckSquare, 
  FileText, 
  Table2, 
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Search,
  Globe,
  Clock,
  Sparkles,
  Phone,
  Mail,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { getStudents, getCourses, getCertificateRequests, getAttendanceRecords, getSystemSettings } from '@/lib/data-store';
import { HeroWildSection } from '@/components/home/HeroWildSection';
import { CookieConsentBanner } from '@/components/home/CookieConsentBanner';

export const revalidate = 0;

export default async function HomePage() {
  const [students, courses, certRequests, attendance, settings] = await Promise.all([
    getStudents(),
    getCourses(),
    getCertificateRequests(),
    getAttendanceRecords(),
    getSystemSettings(),
  ]);

  const hasSheets = !!process.env.GOOGLE_SHEET_ID && !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const pendingRequests = certRequests.filter((r) => r.status === 'PENDING');
  const thaiStudents = students.filter((s) => s.nationality === 'ไทย' || s.nationality === 'Thai').length;
  const intlStudents = students.length - thaiStudents;

  return (
    <div className="space-y-8">
      {/* 1. Public Hero Banner (รองรับทั้ง Creative Wild Theme และ Classic) */}
      {settings?.heroWildEnabled !== false ? (
        <HeroWildSection settings={settings} />
      ) : (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 p-8 sm:p-10 text-white shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold backdrop-blur">
              <GraduationCap className="w-4 h-4" />
              คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              ระบบบริการนิสิตและวิชาการออนไลน์
              <span className="block text-amber-200 text-2xl sm:text-3xl font-bold mt-1">
                Public Academic & Student Services Portal
              </span>
            </h1>

            <p className="text-orange-100 text-sm sm:text-base leading-relaxed">
              ศูนย์รวมบริการสำหรับนิสิตและบุคคลภายนอก: ยื่นขอหนังสือรับรองทุกประเภท (สำหรับคนไทยและนิสิตต่างประเทศ), 
              ตรวจสอบสถานะคำร้อง, และค้นหาตารางเรียนห้องเรียนประจำภาคการศึกษา
            </p>

            {/* Quick Action Buttons for Students */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              {settings?.showCertificatesMenu !== false && (
                <Link
                  href="/certificates"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-orange-700 shadow-md hover:bg-orange-50 transition"
                >
                  <FileText className="w-4 h-4" />
                  ยื่นคำร้องขอหนังสือรับรอง (เลือกการ์ด)
                </Link>
              )}

              {settings?.showCertificatesMenu !== false && (
                <Link
                  href="/certificates"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-800/80 hover:bg-orange-900 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition border border-white/20"
                >
                  <Search className="w-4 h-4" />
                  ตรวจสอบสถานะคำร้อง
                </Link>
              )}

              {settings?.showCoursesMenu !== false && (
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 rounded-xl bg-black/20 hover:bg-black/30 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition border border-white/20"
                >
                  <Calendar className="w-4 h-4" />
                  ตารางเรียนและรายวิชา
                </Link>
              )}

              {settings?.showEventsMenu === true && (
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600/80 hover:bg-amber-700 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition border border-white/20"
                >
                  <Sparkles className="w-4 h-4" />
                  กิจกรรมและโครงการนิสิต
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Public Services Grid (สำหรับนักศึกษา & บุคคลภายนอก) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              บริการออนไลน์สำหรับนิสิต (Student Services)
            </h2>
            <p className="text-xs text-slate-500">เลือกบริการที่ต้องการใช้งานได้ทันที</p>
          </div>
          <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            Public Portal
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Service 1: ยื่นคำร้องขอหนังสือรับรอง */}
          {settings?.showCertificatesMenu !== false && (
            <Link
              href="/certificates"
              className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                    ระบบการ์ด 16 เรื่อง
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">ยื่นคำร้องขอหนังสือรับรอง</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  เลือกประเภทการ์ดเอกสารได้ตรงใจ: หนังสือรับรองสภาพนิสิต, เปิดบัญชีธนาคาร, ต่ออายุ Visa, ขอหอพัก, ทุนการศึกษา 
                  (แยกสำหรับนิสิตไทยและต่างชาติ)
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
                <span>เลือกการ์ดเอกสาร &rarr;</span>
                <span className="text-slate-400 font-normal">Auto-fill จากรหัสนิสิต</span>
              </div>
            </Link>
          )}

          {/* Service 2: ตารางเรียนและรายวิชา */}
          {settings?.showCoursesMenu !== false && (
            <Link
              href="/courses"
              className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    213 รายวิชา
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">ตารางเรียนและรายวิชา</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  ดูตารางสอนรายสัปดาห์ตามชั้นปีที่ 1–4 ห้องเรียน เวลาเรียน และอาจารย์ผู้สอน พร้อมฐานข้อมูลค้นหารหัสวิชาและหน่วยกิต
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
                <span>ดูตารางสอน &rarr;</span>
                <span className="text-slate-400 font-normal">ทุกชั้นปี</span>
              </div>
            </Link>
          )}

          {/* Service 3: ตรวจสอบทะเบียนนิสิต */}
          {settings?.showStudentsSearch !== false && (
            <Link
              href="/students"
              className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-orange-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center group-hover:scale-105 transition">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    🔒 เฉพาะผู้ดูแลระบบ
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">ระบบทะเบียนนิสิต (Admin)</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  ฐานข้อมูลทะเบียนนิสิต ตรวจสอบประวัติการศึกษา ข้อมูลสัญชาติ และการเลื่อนชั้นปี (สงวนสิทธิ์เฉพาะผู้ดูแลระบบ)
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                <span>จัดการทะเบียนนิสิต &rarr;</span>
                <span className="text-slate-400 font-normal">นิสิต {students.length} รูป/คน</span>
              </div>
            </Link>
          )}

          {/* Service 4: งานกิจกรรมและโครงการนิสิต (แสดงเมื่อเปิดใช้งาน) */}
          {settings?.showEventsMenu === true && (
            <Link
              href="/events"
              className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                    กิจกรรมนิสิต
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">งานกิจกรรมและโครงการนิสิต</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  ตรวจสอบและลงทะเบียนเข้าร่วมโครงการปฏิบัติวิปัสสนากัมมัฏฐาน ค่ายคุณธรรม และกิจกรรมเสริมสร้างคุณลักษณะบัณฑิต
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                <span>ดูกิจกรรมทั้งหมด &rarr;</span>
                <span className="text-slate-400 font-normal">ทุกสาขาวิชา</span>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* 3. Admin Console Entry Box (สำหรับอาจารย์และเจ้าหน้าที่) */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
              สำหรับเจ้าหน้าที่คณะและอาจารย์ผู้สอน (Admin Console)
            </div>
            <h3 className="text-xl sm:text-2xl font-black">
              แผงควบคุมหลังบ้าน: จัดการคำร้อง, เช็คชื่อ และเชื่อมต่อ Google Sheets
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              เข้าถึงเครื่องมือสำหรับบุคลากร: พิจารณาและอนุมัติคำร้อง, ออกเลขที่หนังสือ อว 8002/xxx, 
              พิมพ์หนังสือรับรองพร้อมลายเซ็น, ระบบเช็คชื่อเข้าชั้นเรียนสำหรับอาจารย์ และตรวจสอบการซิงค์ข้อมูล Google Sheets
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 font-semibold border border-slate-700">
                ⏳ คำร้องรอตรวจสอบ: {pendingRequests.length} รายการ
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 font-semibold border border-slate-700">
                ✓ บันทึกเช็คชื่อ: {attendance.length} รายการ
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                📊 Google Sheets: 5 แท็บข้อมูล
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition text-center"
            >
              <Lock className="w-4 h-4" />
              เข้าสู่ระบบ Admin Console
            </Link>

            <Link
              href="/attendance"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition text-center"
            >
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              เปิดระบบเช็คชื่อ (อาจารย์)
            </Link>
          </div>
        </div>
      </div>

      {/* Cookie / PDPA Consent Notice Banner (Shown on Homepage `/` only) */}
      <CookieConsentBanner />
    </div>
  );
}
