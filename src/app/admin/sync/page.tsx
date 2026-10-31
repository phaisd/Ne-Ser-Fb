import { universityStore } from '@/shared/lib/store/university-store';
import {
  importStudentsCsvAction,
  importCoursesCsvAction,
  exportExamEligibilityToSheetsAction,
  exportEventParticipantsToSheetsAction,
} from '@/modules/sync/actions';
import { importStudentsFromSheetsAction, exportStudentsToSheetsAction } from '@/modules/students/actions';
import { importCoursesFromSheetsAction } from '@/modules/curriculum/actions';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Upload,
  Download,
  ArrowLeft,
  CheckCircle2,
  Users,
  BookOpen,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function SyncCenterPage() {
  const students = universityStore.getStudents();
  const courses = universityStore.getCourses();
  const enrollments = universityStore.getEnrollments();
  const registrations = universityStore.getEventRegistrations();

  const sampleStudentsCsv = `studentCode,title,firstName,lastName,yearLevel,faculty,department,studyStatus
67010501,พระ,ปิยะณัฐ,สุทธิญาณ,1,คณะพุทธศาสตร์,ภาควิชาพระพุทธศาสนา,ปกติ
67010502,สามเณร,อรรถพล,ทองสุข,1,คณะพุทธศาสตร์,ภาควิชาพระพุทธศาสนา,ปกติ
67020503,นาย,ชยพล,เลิศมงคล,1,คณะครุศาสตร์,ภาควิชาหลักสูตรและการสอน,ปกติ`;

  const sampleCoursesCsv = `courseCode,courseName,credits,section,term,room,dayOfWeek,startTime,endTime
000108,พุทธประวัติและอารยธรรมพุทธ,3,1,1/2569,ห้องบรรยาย 201,1,13:00,16:00
000210,ภาษาสันสกฤตเบื้องต้น,3,1,1/2569,ห้องเรียน 405,4,09:00,12:00`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4" />
            <span>[แนวทางที่ 2] Import & Export Synchronization Center</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">ศูนย์เชื่อมต่อข้อมูลและรายงาน (Google Sheets & CSV)</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            นำเข้าทะเบียนนิสิต ตารางรายวิชา และส่งออกรายงานสิทธิ์สอบ 80% กับรายชื่อกลุ่มวิปัสสนากรรมฐานสู่ Google Sheets
          </p>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับแผงควบคุม</span>
        </Link>
      </div>

      {/* Overview Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-400">นิสิตในระบบ</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{students.length} <span className="text-xs font-normal text-slate-400">รูป/คน</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-400">รายวิชาในหลักสูตร</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{courses.length} <span className="text-xs font-normal text-slate-400">วิชา</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-400">รายงานเวลาเรียน</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{enrollments.length} <span className="text-xs font-normal text-slate-400">รายการ</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-400">ผู้ร่วมวิปัสสนา</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{registrations.length} <span className="text-xs font-normal text-slate-400">รูป/คน</span></p>
        </div>
      </div>

      {/* Export Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-600" />
          <span>ส่งออกรายงานสู่ Google Sheets (Export Reports)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Export 1: Exam Eligibility */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Sheet: Exam_Eligibility_Report
              </span>
              <h3 className="font-bold text-slate-900 text-sm">รายงานสรุปเวลาเรียนและสิทธิ์สอบ (เกณฑ์ 80%)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ส่งออกสรุปคาบที่มาจริง เปอร์เซ็นต์เข้าเรียน และสถานะมีสิทธิ์สอบ (ELIGIBLE / INELIGIBLE) ของนิสิตทุกคน
              </p>
            </div>
            <form action={exportExamEligibilityToSheetsAction}>
              <button
                type="submit"
                className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                ส่งออกรายงานสิทธิ์สอบ (Push to Sheets)
              </button>
            </form>
          </div>

          {/* Export 2: Vipassana Participants */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Sheet: Event_Participants_Report
              </span>
              <h3 className="font-bold text-slate-900 text-sm">รายงานผู้เข้าร่วมการอบรมวิปัสสนากรรมฐาน</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ส่งออกรายชื่อนิสิตบรรพชิต/คฤหัสถ์ กลุ่มที่ปฏิบัติธรรม (group_number, group_name) และสถานะการเช็คชื่อ
              </p>
            </div>
            <form action={exportEventParticipantsToSheetsAction}>
              <button
                type="submit"
                className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                ส่งออกรายชื่อกลุ่มปฏิบัติธรรม (Push)
              </button>
            </form>
          </div>

          {/* Export 3: Students Master */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Sheet: Students_Master
              </span>
              <h3 className="font-bold text-slate-900 text-sm">ส่งออกแฟ้มทะเบียนนิสิตฉบับสมบูรณ์</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ส่งออกข้อมูลนิสิตทุกคอลัมน์ (รหัสนิสิต, คำนำหน้า, คณะพุทธศาสตร์, ภาควิชา, ชั้นปี, study_status)
              </p>
            </div>
            <form action={exportStudentsToSheetsAction}>
              <button
                type="submit"
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                ส่งออกทะเบียนนิสิต (Push to Sheets)
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-600" />
          <span>นำเข้าข้อมูลผ่าน CSV หรือ Google Sheets (Import Center)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Import 1: Students */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">1. นำเข้าทะเบียนนิสิต (students)</h3>
              </div>
              <form action={importStudentsFromSheetsAction}>
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 cursor-pointer"
                >
                  Pull จาก Sheets
                </button>
              </form>
            </div>

            <p className="text-xs text-slate-500">
              รองรับคอลัมน์: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">studentCode, title, firstName, lastName, yearLevel, faculty, department, studyStatus</code>
            </p>

            <form action={importStudentsCsvAction} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">วางข้อมูล CSV นิสิต:</label>
                <textarea
                  name="csvContent"
                  rows={4}
                  defaultValue={sampleStudentsCsv}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                ประมวลผลนำเข้านิสิต (Import Students CSV)
              </button>
            </form>
          </div>

          {/* Import 2: Courses */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">2. นำเข้าตารางรายวิชา (courses)</h3>
              </div>
              <form action={importCoursesFromSheetsAction}>
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 cursor-pointer"
                >
                  Pull จาก Sheets
                </button>
              </form>
            </div>

            <p className="text-xs text-slate-500">
              รองรับคอลัมน์: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">courseCode, courseName, credits, section, term, room, dayOfWeek, startTime, endTime</code>
            </p>

            <form action={importCoursesCsvAction} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">วางข้อมูล CSV รายวิชา:</label>
                <textarea
                  name="csvContent"
                  rows={4}
                  defaultValue={sampleCoursesCsv}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                ประมวลผลนำเข้ารายวิชา (Import Courses CSV)
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
