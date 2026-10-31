import { universityStore } from '@/shared/lib/store/university-store';
import { registerEventAction, checkInAndIssueCertAction } from '@/modules/events/actions';
import { formatDateTime } from '@/shared/lib/locale/date-formatter';
import {
  Award,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Sparkles,
  Download,
  ShieldCheck,
  Send,
} from 'lucide-react';

export default function EventsPage() {
  const events = universityStore.getEvents();
  const participations = universityStore.getParticipations();
  const students = universityStore.getStudents();

  // Total accumulated hours for Thanapat (65010214)
  const studentParts = participations.filter((p) => p.studentCode === '65010214' && p.attended);
  const totalHours = studentParts.reduce((acc, p) => acc + p.activityHours, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider">
          <Award className="w-4 h-4" />
          <span>Module 7 • กิจกรรมพัฒนานิสิตและสะสมชั่วโมงเสริมทักษะ</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">ระบบกิจกรรม & เกียรติบัตรอิเล็กทรอนิกส์ (E-Certificate)</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          ลงทะเบียนกิจกรรมวิชาการ/จิตอาสา เช็คชื่อเข้าร่วม สะสมชั่วโมงกิจกรรม และรับ E-Certificate อัตโนมัติ
        </p>
      </div>

      {/* Student Activity Accumulator Card */}
      <div className="bg-gradient-to-r from-rose-700 via-pink-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>กระเป๋าสะสมกิจกรรม (Activity Passport)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            นายธนพัฒน์ สิทธิโชค (รหัส 65010214)
          </h2>
          <p className="text-xs text-rose-100 leading-relaxed">
            ชั่วโมงกิจกรรมได้รับการรับรองโดยมหาวิทยาลัย สามารถนำไปใช้ยื่นจบการศึกษาหรือยื่นเอกสารกองทุน กยศ.
          </p>
        </div>

        <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
          <div className="text-center">
            <p className="text-xs text-rose-200">กิจกรรมที่ผ่าน</p>
            <p className="text-2xl font-black text-white">{studentParts.length} <span className="text-xs font-normal">งาน</span></p>
          </div>
          <div className="w-px h-10 bg-white/20"></div>
          <div className="text-center">
            <p className="text-xs text-rose-200">ชั่วโมงสะสม</p>
            <p className="text-3xl font-black text-amber-300">{totalHours} <span className="text-xs font-normal text-white">ชม.</span></p>
          </div>
        </div>
      </div>

      {/* Events Directory Catalog */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>กิจกรรมที่เปิดรับลงทะเบียน</span>
          <span className="text-xs text-slate-400">({events.length} กิจกรรม)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={e.coverImageUrl}
                    alt={e.titleTh}
                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-300 font-bold text-xs flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>+{e.activityHours} ชม.</span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">
                    {e.category}
                  </span>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {e.titleTh}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{e.startDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{e.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        ผู้ลงทะเบียนแล้ว <strong>{e.currentParticipants}</strong> / {e.maxParticipants} ท่าน
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <form action={registerEventAction}>
                  <input type="hidden" name="eventId" value={e.id} />
                  <input type="hidden" name="studentCode" value="65010214" />
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                  >
                    ลงทะเบียนเข้าร่วมกิจกรรม (Register)
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Participations & E-Certificates Issued */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>ประวัติการเข้าร่วมและเกียรติบัตรที่ได้รับ (E-Certificates)</span>
          <span className="text-xs text-slate-400">({participations.length} รายการ)</span>
        </h2>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">ชื่อกิจกรรม</th>
                <th className="py-3 px-4">นิสิตผู้เข้าร่วม</th>
                <th className="py-3 px-4">ชั่วโมงกิจกรรม</th>
                <th className="py-3 px-4">สถานะการเช็คชื่อ</th>
                <th className="py-3 px-4">รหัส E-Certificate</th>
                <th className="py-3 px-4 text-right">ดำเนินการ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participations.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">
                    {p.eventTitle}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{p.studentName}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{p.studentCode}</p>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-amber-600">+{p.activityHours}</span> ชั่วโมง
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {p.attended ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        เข้าร่วมสำเร็จ
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        ลงทะเบียนแล้ว (รอเช็คชื่อ)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">
                    {p.certCode || '-'}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {!p.attended ? (
                      <form action={checkInAndIssueCertAction}>
                        <input type="hidden" name="participationId" value={p.id} />
                        <button
                          type="submit"
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                        >
                          เช็คชื่อและออก E-Cert
                        </button>
                      </form>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>ออกใบประกาศแล้ว</span>
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
