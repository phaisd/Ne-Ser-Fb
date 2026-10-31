import { universityStore } from '@/shared/lib/store/university-store';
import { addScheduleSlotAction } from '@/modules/scheduling/actions';
import { PrintButton } from '@/shared/components/PrintButton';
import {
  Grid3X3,
  Calendar,
  Clock,
  AlertCircle,
  Plus,
  MapPin,
  User,
  Sparkles,
} from 'lucide-react';

export default function TimetablePage() {
  const schedules = universityStore.getSchedules();

  const days: { key: string; labelTh: string; labelEn: string; color: string }[] = [
    { key: 'MONDAY', labelTh: 'วันจันทร์', labelEn: 'Monday', color: 'bg-yellow-500/10 text-yellow-800 border-yellow-200' },
    { key: 'TUESDAY', labelTh: 'วันอังคาร', labelEn: 'Tuesday', color: 'bg-pink-500/10 text-pink-800 border-pink-200' },
    { key: 'WEDNESDAY', labelTh: 'วันพุธ', labelEn: 'Wednesday', color: 'bg-emerald-500/10 text-emerald-800 border-emerald-200' },
    { key: 'THURSDAY', labelTh: 'วันพฤหัสบดี', labelEn: 'Thursday', color: 'bg-orange-500/10 text-orange-800 border-orange-200' },
    { key: 'FRIDAY', labelTh: 'วันศุกร์', labelEn: 'Friday', color: 'bg-blue-500/10 text-blue-800 border-blue-200' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 uppercase tracking-wider">
            <Grid3X3 className="w-4 h-4" />
            <span>Module 6 • บริหารตารางเรียนและตารางสอน</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">ตารางเรียนและตารางสอน (Matrix Grid)</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            ผังเวลาเรียนสองภาษา (TH/EN) พร้อมระบบตรวจจับเวลาและห้องเรียนชน (Clash Detection)
          </p>
        </div>

        <div className="no-print">
          <PrintButton
            label="สั่งพิมพ์ตารางเรียน (Print Matrix)"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
          />
        </div>
      </div>

      {/* Timetable Matrix Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-900">ตารางสอนประจำสัปดาห์ • Weekly Academic Schedule</h2>
            <p className="text-[11px] text-slate-500">ภาคการศึกษาที่ 2 ปีการศึกษา 2569 (Semester 2/2026)</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Clash Detection Active</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {days.map((d) => {
            const daySlots = schedules.filter((s) => s.dayOfWeek === d.key);

            return (
              <div key={d.key} className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 hover:bg-slate-50/50 transition">
                {/* Day Label Column */}
                <div className="md:w-36 shrink-0 flex items-center">
                  <div className={`px-3 py-1.5 rounded-xl border font-bold text-xs ${d.color}`}>
                    <p>{d.labelTh}</p>
                    <p className="text-[10px] font-normal opacity-80">{d.labelEn}</p>
                  </div>
                </div>

                {/* Slots Area */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {daySlots.length === 0 ? (
                    <div className="p-3 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs flex items-center justify-center">
                      ไม่มีการเรียนการสอนในวันนี้ (No classes)
                    </div>
                  ) : (
                    daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2 hover:border-cyan-400 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {slot.courseCode} (Sec {slot.sectionNumber})
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-600" />
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>

                        <p className="font-semibold text-slate-900 text-xs line-clamp-1">
                          {slot.courseName}
                        </p>

                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{slot.roomCode}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[120px]">{slot.instructorName}</span>
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

      {/* Add Slot Form (For Scheduling Officers) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl no-print space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">จัดสรรตารางเรียนใหม่ (ห้อง/เวลา)</h2>
            <p className="text-[11px] text-slate-500">ระบบจะตรวจสอบตารางชน (Clash Detection) ทันทีที่กดบันทึก</p>
          </div>
        </div>

        <form action={addScheduleSlotAction} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">รหัสวิชา *</label>
              <input
                type="text"
                name="courseCode"
                placeholder="เช่น CS305"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 uppercase font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อวิชา *</label>
              <input
                type="text"
                name="courseName"
                placeholder="ชื่อวิชาเรียน"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">วันในสัปดาห์ *</label>
              <select
                name="dayOfWeek"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
              >
                <option value="MONDAY">วันจันทร์ (Monday)</option>
                <option value="TUESDAY">วันอังคาร (Tuesday)</option>
                <option value="WEDNESDAY">วันพุธ (Wednesday)</option>
                <option value="THURSDAY">วันพฤหัสบดี (Thursday)</option>
                <option value="FRIDAY">วันศุกร์ (Friday)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">เวลาเริ่ม (HH:mm) *</label>
              <input
                type="text"
                name="startTime"
                defaultValue="09:00"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">เวลาสิ้นสุด (HH:mm) *</label>
              <input
                type="text"
                name="endTime"
                defaultValue="12:00"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ห้องเรียน (Room Code) *</label>
              <input
                type="text"
                name="roomCode"
                defaultValue="ENG-402"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">อาจารย์ผู้สอน *</label>
              <input
                type="text"
                name="instructorName"
                defaultValue="ผศ.ดร. นครินทร์ สุขประเสริฐ"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 transition cursor-pointer"
          >
            บันทึกคาบเรียนลงตาราง (Check Clash & Save)
          </button>
        </form>
      </div>
    </div>
  );
}
