import { universityStore } from '@/shared/lib/store/university-store';
import { bookMeetingRoomAction, cancelBookingAction } from '@/modules/rooms/actions';
import { formatDateTime } from '@/shared/lib/locale/date-formatter';
import {
  Calendar as CalendarIcon,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  CalendarCheck,
  ShieldAlert,
} from 'lucide-react';

export default function RoomsPage() {
  const rooms = universityStore.getMeetingRooms();
  const bookings = universityStore.getMeetingBookings();

  // Tomorrow formatted for default start/end
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
          <CalendarIcon className="w-4 h-4" />
          <span>Module 2 • ระบบจองห้องประชุมออนไลน์ (Meeting Rooms & Bookings)</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">ระบบจองห้องประชุม (Anti-Double Booking)</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          โครงสร้างจริง meeting_rooms และ meeting_bookings พร้อมระบบตรวจจับเวลาซ้อนทับ 100% และซิงค์ Google Sheets
        </p>
      </div>

      {/* Room Catalog */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>แคตตาล็อกห้องประชุมที่เปิดให้บริการ</span>
          <span className="text-xs font-normal text-slate-400">({rooms.length} ห้อง)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={room.imageUrl || ''}
                    alt={room.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-emerald-300 font-bold text-xs flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{room.capacity} ที่นั่ง</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{room.name}</h3>
                  </div>

                  {room.equipment && (
                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">อุปกรณ์ประจำห้อง (Equipment)</p>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{room.equipment}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0">
                <a
                  href="#booking-form"
                  className="w-full block text-center py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition"
                >
                  เลือกจองห้องนี้
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Form & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4" id="booking-form">
        {/* Booking Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">แบบฟอร์มขอใช้ห้องประชุม</h2>
              <p className="text-[11px] text-slate-500">บันทึกลงตาราง meeting_bookings</p>
            </div>
          </div>

          <form action={bookMeetingRoomAction} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">เลือกห้องประชุม (roomId) *</label>
              <select
                name="roomId"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.capacity} ท่าน)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อผู้จอง / หน่วยงาน *</label>
              <input
                type="text"
                name="requesterName"
                defaultValue="พระครูสุตวราภิรม, ดร. (ภาควิชาพระพุทธศาสนา)"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">หัวข้อการประชุม (title) *</label>
              <input
                type="text"
                name="title"
                placeholder="เช่น การประชุมเตรียมงานวิชาการพุทธศาสตร์นานาชาติ"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">วันและเวลาเริ่ม (startTime) *</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  defaultValue={`${tomorrow}T09:00`}
                  required
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">วันและเวลาสิ้นสุด (endTime) *</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  defaultValue={`${tomorrow}T12:00`}
                  required
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">หมายเหตุเพิ่มเติม (remark)</label>
              <textarea
                name="remark"
                rows={2}
                placeholder="เช่น ต้องการเบาะรองนั่ง หรือประสานงานฝ่ายโสตทัศนูปกรณ์"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              ตรวจสอบเวลาและยืนยันการจอง
            </button>
          </form>
        </div>

        {/* Existing Bookings Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>ตารางการจองห้องประชุม</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs">
                {bookings.length} รายการ
              </span>
            </h2>
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Double-Booking Protection Active</span>
            </div>
          </div>

          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                      {b.roomName || 'ห้องประชุม'}
                    </span>
                    <span className="text-xs text-slate-500">
                      ผู้จอง: <strong>{b.requesterName}</strong>
                    </span>
                  </div>

                  <div>
                    {b.status === 'APPROVED' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        อนุมัติแล้ว (APPROVED)
                      </span>
                    ) : b.status === 'PENDING' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        รอพิจารณา (PENDING)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        ยกเลิกแล้ว (CANCELLED)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{b.title}</h3>
                  {b.remark && <p className="text-xs text-slate-500 mt-1">{b.remark}</p>}
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      {formatDateTime(b.startTime, 'th')} - {formatDateTime(b.endTime, 'th')}
                    </span>
                  </div>

                  {b.status === 'APPROVED' && (
                    <form action={cancelBookingAction}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <button
                        type="submit"
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                      >
                        ยกเลิกการจอง
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
