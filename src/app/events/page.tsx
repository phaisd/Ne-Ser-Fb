import { universityStore } from '@/shared/lib/store/university-store';
import { registerEventAction, checkInEventAction } from '@/modules/events/actions';
import { formatDateTime } from '@/shared/lib/locale/date-formatter';
import {
  Award,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Send,
  HeartHandshake,
} from 'lucide-react';

export default function EventsPage() {
  const events = universityStore.getEvents();
  const registrations = universityStore.getEventRegistrations();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider">
          <Award className="w-4 h-4" />
          <span>Module 7 • กิจกรรมมหาวิทยาลัยและการอบรมวิปัสสนากรรมฐาน (events & event_registrations)</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">กิจกรรม & การอบรมวิปัสสนากรรมฐาน</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          โครงสร้างจริง events: จัดการกลุ่มปฏิบัติธรรม (group_number, group_name), meditation_config, และเช็คชื่อรายวัน (daily_attendance)
        </p>
      </div>

      {/* Events List Catalog */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>โครงการอบรมและกิจกรรมที่เปิดรับลงทะเบียน</span>
          <span className="text-xs text-slate-400">({events.length} โครงการ)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">
                    {e.meditationConfig ? 'โครงการปฏิบัติวิปัสสนา' : 'กิจกรรมวิชาการ/จิตอาสา'}
                  </span>
                  <div className="px-2.5 py-1 rounded-full bg-slate-900 text-amber-300 font-bold text-xs flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>+{e.activityHours} ชม.</span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  {e.title}
                </h3>

                <div className="space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatDateTime(e.startDate, 'th')} - {formatDateTime(e.endDate, 'th')}</span>
                  </div>

                  {e.meditationConfig && (
                    <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/60 text-amber-900 text-[11px] space-y-1">
                      <p className="font-bold flex items-center gap-1 text-amber-800">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>การอบรมวิปัสสนากรรมฐาน (meditation_config)</span>
                      </p>
                      <p>• สถานที่: {e.meditationConfig.location}</p>
                      <p>• พระวิปัสสนาจารย์: {e.meditationConfig.leaderMonk}</p>
                      <p>• จำนวนรอบเจริญภาวนา: วันละ {e.meditationConfig.roundsPerDay} รอบ</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>ลงทะเบียนแล้ว <strong>{e.registrationsCount || 0}</strong> รูป/คน</span>
                  </div>
                </div>
              </div>

              {/* Quick Registration Form */}
              <div className="p-5 pt-0">
                <form action={registerEventAction} className="space-y-2 text-xs">
                  <input type="hidden" name="eventId" value={e.id} />
                  <input
                    type="text"
                    name="participantName"
                    defaultValue="พระมหาธนพัฒน์ โชติปญฺโญ"
                    required
                    placeholder="ชื่อ-สกุล/ฉายาผู้เข้าร่วม"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[11px]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="groupNumber"
                      defaultValue={1}
                      min={1}
                      max={20}
                      className="px-2 py-1.5 rounded-lg border border-slate-300 text-[11px]"
                      placeholder="กลุ่มที่"
                    />
                    <input
                      type="text"
                      name="groupName"
                      defaultValue="กลุ่มเจริญสติปัญญา ๑"
                      className="px-2 py-1.5 rounded-lg border border-slate-300 text-[11px]"
                      placeholder="ชื่อกลุ่ม"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                  >
                    ลงทะเบียนเข้าร่วม (Register)
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registrations & Daily Attendance Tracking */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>ทะเบียนผู้เข้าร่วมและเช็คชื่อรายวัน (daily_attendance)</span>
          <span className="text-xs text-slate-400">({registrations.length} รายชื่อ)</span>
        </h2>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">โครงการกิจกรรม</th>
                <th className="py-3 px-4">ผู้เข้าร่วม (participant_name)</th>
                <th className="py-3 px-4">กลุ่มที่ / ชื่อกลุ่ม</th>
                <th className="py-3 px-4">เช็คชื่อรายวัน (daily_attendance)</th>
                <th className="py-3 px-4">สถานะการเช็คชื่อ</th>
                <th className="py-3 px-4 text-right">ดำเนินการ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">
                    {reg.eventTitle}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {reg.participantName}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                      กลุ่ม {reg.groupNumber}: {reg.groupName}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {reg.dailyAttendance && (
                      <div className="flex gap-1.5">
                        {Object.entries(reg.dailyAttendance).map(([day, checked]) => (
                          <span
                            key={day}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              checked
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {day}: {checked ? '✓' : '-'}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {reg.attendedAt ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        เสร็จสิ้นการอบรม
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        ลงทะเบียนแล้ว
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {!reg.attendedAt ? (
                      <form action={checkInEventAction}>
                        <input type="hidden" name="registrationId" value={reg.id} />
                        <button
                          type="submit"
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                        >
                          เช็คชื่อสำเร็จ
                        </button>
                      </form>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>ผ่านการอบรม ({reg.certCode})</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
