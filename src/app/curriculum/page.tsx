import { universityStore } from '@/shared/lib/store/university-store';
import { createCourseAction, importCoursesFromSheetsAction } from '@/modules/curriculum/actions';
import {
  BookOpen,
  Plus,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export default function CurriculumPage() {
  const courses = universityStore.getCourses();

  const dayNames = ['', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Module 4 • ทะเบียนรายวิชาและหลักสูตร (Course Catalog)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">รายวิชาและแผนการจัดการเรียนรู้</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            โครงสร้างจริง table: courses ครบทุกฟิลด์: course_code, term, section, target_sessions, calculation_rules
          </p>
        </div>

        {/* Google Sheets Import Action */}
        <div className="flex items-center gap-2">
          <form action={importCoursesFromSheetsAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import รายวิชาจาก Google Sheets (Courses_Master)</span>
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Course Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">เพิ่มรายวิชาในหลักสูตร</h2>
              <p className="text-[11px] text-slate-500">บันทึกลงตาราง courses</p>
            </div>
          </div>

          <form action={createCourseAction} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">รหัสวิชา (courseCode) *</label>
                <input
                  type="text"
                  name="courseCode"
                  placeholder="เช่น 000105"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ตอนเรียน (section) *</label>
                <input
                  type="text"
                  name="section"
                  defaultValue="1"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อวิชาภาษาไทย (courseName) *</label>
              <input
                type="text"
                name="courseName"
                placeholder="เช่น ภาษาบาลีไวยากรณ์ขั้นพื้นฐาน"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อวิชาภาษาอังกฤษ (courseNameEn)</label>
              <input
                type="text"
                name="courseNameEn"
                placeholder="เช่น Basic Pali Grammar"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">หน่วยกิต (credits)</label>
                <input
                  type="number"
                  name="credits"
                  defaultValue={3}
                  min={1}
                  max={6}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ภาคการศึกษา (term)</label>
                <input
                  type="text"
                  name="term"
                  defaultValue="1/2569"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">คาบเป้าหมาย</label>
                <input
                  type="number"
                  name="targetSessions"
                  defaultValue={16}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ห้องเรียน (room)</label>
              <input
                type="text"
                name="room"
                defaultValue="ห้องบรรยาย 301 อาคารเรียนรวม"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">วันในสัปดาห์</label>
                <select
                  name="dayOfWeek"
                  className="w-full px-2 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="1">จันทร์</option>
                  <option value="2">อังคาร</option>
                  <option value="3">พุธ</option>
                  <option value="4">พฤหัสบดี</option>
                  <option value="5">ศุกร์</option>
                  <option value="6">เสาร์</option>
                  <option value="7">อาทิตย์</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เวลาเริ่ม</label>
                <input
                  type="text"
                  name="startTime"
                  defaultValue="09:00"
                  required
                  className="w-full px-2 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เวลาสิ้นสุด</label>
                <input
                  type="text"
                  name="endTime"
                  defaultValue="12:00"
                  required
                  className="w-full px-2 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              บันทึกรายวิชา (Save Course)
            </button>
          </form>
        </div>

        {/* Course Catalog Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>รายวิชาที่เปิดสอนในหลักสูตร</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs">
                {courses.length} วิชา
              </span>
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">รหัสวิชา (ตอน)</th>
                  <th className="py-3 px-4">ชื่อวิชา (TH / EN)</th>
                  <th className="py-3 px-4">หน่วยกิต (ภาค/ปี)</th>
                  <th className="py-3 px-4">วันและเวลาเรียน</th>
                  <th className="py-3 px-4">ห้องเรียน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {c.courseCode} <span className="text-slate-500 font-normal">(Sec {c.section})</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{c.courseName}</p>
                      {c.courseNameEn && <p className="text-[11px] text-slate-400 italic">{c.courseNameEn}</p>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900">{c.credits}</span> นก.{' '}
                      <span className="text-slate-400 text-[11px]">({c.term})</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-medium text-slate-800">{dayNames[c.dayOfWeek || 1]}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{c.startTime} - {c.endTime}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.room || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
