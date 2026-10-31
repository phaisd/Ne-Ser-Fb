import { universityStore } from '@/shared/lib/store/university-store';
import { addScheduleSlotAction } from '@/modules/scheduling/actions';
import { PrintButton } from '@/shared/components/PrintButton';
import {
  Grid3X3,
  Calendar,
  Clock,
  Plus,
  MapPin,
  Sparkles,
} from 'lucide-react';

export default function TimetablePage() {
  const courses = universityStore.getCourses();

  const days: { dayNum: number; labelTh: string; labelEn: string; color: string }[] = [
    { dayNum: 1, labelTh: 'วันจันทร์', labelEn: 'Monday', color: 'bg-yellow-500/10 text-yellow-800 border-yellow-200' },
    { dayNum: 2, labelTh: 'วันอังคาร', labelEn: 'Tuesday', color: 'bg-pink-500/10 text-pink-800 border-pink-200' },
    { dayNum: 3, labelTh: 'วันพุธ', labelEn: 'Wednesday', color: 'bg-emerald-500/10 text-emerald-800 border-emerald-200' },
    { dayNum: 4, labelTh: 'วันพฤหัสบดี', labelEn: 'Thursday', color: 'bg-orange-500/10 text-orange-800 border-orange-200' },
    { dayNum: 5, labelTh: 'วันศุกร์', labelEn: 'Friday', color: 'bg-blue-500/10 text-blue-800 border-blue-200' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 uppercase tracking-wider">
            <Grid3X3 className="w-4 h-4" />
            <span>Module 6 • ตารางเรียน-ตารางสอน (Matrix Grid & Clash Detection)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">ตารางสอนประจำสัปดาห์ (ภาคเรียน ๑/๒๕๖๙)</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            แสดงผลตารางสอนสองภาษา (TH/EN) พร้อมระบบตรวจสอบคาบเรียนและห้องเรียนชนกัน (Clash Detection)
          </p>
        </div>

        <div className="no-print">
          <PrintButton
            label="สั่งพิมพ์ตารางเรียน (Print Matrix)"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
          />
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-900">ผังตารางเรียนรายสัปดาห์ • Weekly Class Matrix</h2>
            <p className="text-[11px] text-slate-500">คณะพุทธศาสตร์ มหาวิทยาลัยดิจิทัล (Semester 1/2569)</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Clash Detection Active</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {days.map((d) => {
            const dayCourses = courses.filter((c) => c.dayOfWeek === d.dayNum);

            return (
              <div key={d.dayNum} className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 hover:bg-slate-50/50 transition">
                {/* Day Label Column */}
                <div className="md:w-36 shrink-0 flex items-center">
                  <div className={`px-3 py-1.5 rounded-xl border font-bold text-xs ${d.color}`}>
                    <p>{d.labelTh}</p>
                    <p className="text-[10px] font-normal opacity-80">{d.labelEn}</p>
                  </div>
                </div>

                {/* Slots Area */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dayCourses.length === 0 ? (
                    <div className="p-3 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs flex items-center justify-center">
                      ไม่มีการเรียนการสอนในวันนี้ (No classes)
                    </div>
                  ) : (
                    dayCourses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2 hover:border-cyan-400 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {course.courseCode} (Sec {course.section})
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-cyan-600" />
                            {course.startTime} - {course.endTime}
                          </span>
                        </div>

                        <p className="font-semibold text-slate-900 text-xs line-clamp-1">
                          {course.courseName}
                        </p>

                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{course.room || 'ระบุห้องภายหลัง'}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-700">{course.credits}</span> หน่วยกิต
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Schedule Slot Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl no-print space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">จัดสรรตารางเรียนใหม่ (ป้องกันตารางชน)</h2>
            <p className="text-[11px] text-slate-500">ระบบจะตรวจสอบเวลาและห้องเรียนซ้ำซ้อนโดยอัตโนมัติ</p>
          </div>
        </div>

        <form action={addScheduleSlotAction} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">รหัสวิชา (courseCode) *</label>
              <input
                type="text"
                name="courseCode"
                placeholder="เช่น 000215"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อวิชา (courseName) *</label>
              <input
                type="text"
                name="courseName"
                placeholder="เช่น ธรรมศึกษาและวินัยมุข"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">วันในสัปดาห์ (dayOfWeek)</label>
              <select
                name="dayOfWeek"
                className="w-full px-2 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
              >
                <option value="1">วันจันทร์</option>
                <option value="2">วันอังคาร</option>
                <option value="3">วันพุธ</option>
                <option value="4">วันพฤหัสบดี</option>
                <option value="5">วันศุกร์</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">เวลาเริ่ม (HH:mm) *</label>
              <input
                type="text"
                name="startTime"
                defaultValue="09:00"
                required
                className="w-full px-2 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">เวลาสิ้นสุด (HH:mm) *</label>
              <input
                type="text"
                name="endTime"
                defaultValue="12:00"
                required
                className="w-full px-2 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ห้องเรียน (room) *</label>
              <input
                type="text"
                name="room"
                defaultValue="ห้องบรรยาย B-301"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">หน่วยกิต (credits)</label>
              <input
                type="number"
                name="credits"
                defaultValue={3}
                min={1}
                max={6}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 transition cursor-pointer"
          >
            ตรวจสอบตารางชน & บันทึกลงตาราง (Clash Check & Save)
          </button>
        </form>
      </div>
    </div>
  );
}
