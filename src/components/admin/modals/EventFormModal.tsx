'use client';

import React from 'react';
import {
  Award,
  Calendar,
  Check,
  GraduationCap,
  MapPin,
  Phone,
  RefreshCw,
  Upload,
  Users,
} from 'lucide-react';
import type { StudentEvent } from '@/types';

interface EventFormModalProps {
  isOpen: boolean;
  editingEventId: string | null;
  eventForm: Partial<StudentEvent>;
  setEventForm: React.Dispatch<React.SetStateAction<Partial<StudentEvent>>>;
  isSubmittingEvent: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onSubmitAndOpenGroupImport: () => void;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  editingEventId,
  eventForm,
  setEventForm,
  isSubmittingEvent,
  onClose,
  onSubmit,
  onSubmitAndOpenGroupImport,
}) => {
  if (!isOpen) return null;

  return (
    <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {editingEventId ? 'แก้ไขข้อมูลโครงการ/กิจกรรม' : 'เพิ่มโครงการ/กิจกรรมใหม่'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    กำหนดวัน เวลา สถานที่ หลักสูตรเป้าหมาย และข้อมูลผู้รับผิดชอบโครงการ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onClose()}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0 text-xs">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Event Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ชื่อโครงการ / กิจกรรม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น โครงการปฏิบัติวิปัสสนากัมมัฏฐานประจำปี นิสิตคณะพุทธศาสตร์"
                  value={eventForm.title || ''}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-semibold"
                />
              </div>

              {/* Event Type & Activity Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ประเภทกิจกรรม:</label>
                  <select
                    value={eventForm.eventType || 'SPECIAL'}
                    onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                  >
                    <option value="MEDITATION">🧘 วิปัสสนากัมมัฏฐาน</option>
                    <option value="CEREMONY">🏛️ พิธีการ/วันสำคัญทางพระพุทธศาสนา</option>
                    <option value="ACADEMIC">📚 วิชาการ / อบรม / เสวนา</option>
                    <option value="VOLUNTEER">🤝 จิตอาสา / บำเพ็ญสาธารณประโยชน์</option>
                    <option value="SPECIAL">🌟 กิจกรรมและโครงการทั่วไป</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">จำนวนชั่วโมงกิจกรรม (Activity Hours):</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="เช่น 3 หรือ 72"
                    value={eventForm.activityHours || 3}
                    onChange={(e) => setEventForm({ ...eventForm, activityHours: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-amber-900"
                  />
                </div>
              </div>

              {/* Date & Time Settings with Duration Presets */}
              <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="font-bold text-amber-950 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>ระยะเวลาและรูปแบบการจัดโครงการ</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    3 รูปแบบมาตรฐานคณะพุทธศาสตร์
                  </span>
                </div>

                {/* Duration Presets Pills */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    เลือกรูปแบบระยะเวลา (1-Click Preset):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* 1. จบใน 1 วัน */}
                    <button
                      type="button"
                      onClick={() => {
                        const start = eventForm.startDate || new Date().toISOString().substring(0, 10);
                        setEventForm({
                          ...eventForm,
                          durationFormat: 'SINGLE_DAY',
                          totalDays: 1,
                          startDate: start,
                          endDate: start,
                          eventTime: '08:30 - 16:30 น. (เริ่มเช้า เสร็จเย็น)',
                          activityHours: eventForm.activityHours && eventForm.activityHours <= 8 ? eventForm.activityHours : 6,
                          attendanceMode: 'SINGLE_SCAN',
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                        eventForm.durationFormat === 'SINGLE_DAY'
                          ? 'bg-sky-50 border-sky-400 text-sky-900 ring-2 ring-sky-300/40 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between text-xs">
                        <span>☀️ จบใน 1 วัน</span>
                        {eventForm.durationFormat === 'SINGLE_DAY' && (
                          <span className="text-[9px] bg-sky-600 text-white px-1.5 py-0.2 rounded font-bold">✓ เลือก</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">เริ่มเช้า - เสร็จเย็นหรือค่ำ (08.30-16.30 น.)</p>
                    </button>

                    {/* 2. แบบ 2 - 3 วัน เหมาวัน */}
                    <button
                      type="button"
                      onClick={() => {
                        const start = eventForm.startDate || new Date().toISOString().substring(0, 10);
                        const endD = new Date(start);
                        endD.setDate(endD.getDate() + 2); // 3 days
                        const endStr = endD.toISOString().substring(0, 10);
                        setEventForm({
                          ...eventForm,
                          durationFormat: 'MULTI_DAY',
                          totalDays: 3,
                          startDate: start,
                          endDate: endStr,
                          eventTime: 'เหมาวัน (3 วัน 2 คืน / 08:30 - 17:00 น.)',
                          activityHours: eventForm.activityHours && eventForm.activityHours > 8 && eventForm.activityHours < 40 ? eventForm.activityHours : 18,
                          attendanceMode: 'DAILY_CHECKIN',
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                        eventForm.durationFormat === 'MULTI_DAY'
                          ? 'bg-amber-100/70 border-amber-500 text-amber-950 ring-2 ring-amber-400/40 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between text-xs">
                        <span>⛺ 2 - 3 วัน (เหมาวัน)</span>
                        {eventForm.durationFormat === 'MULTI_DAY' && (
                          <span className="text-[9px] bg-amber-600 text-white px-1.5 py-0.2 rounded font-bold">✓ เลือก</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">ค่ายอบรม / สัมมนาเชิงปฏิบัติการ (พักค้างคืน)</p>
                    </button>

                    {/* 3. ปฏิบัติวิปัสสนากัมมัฏฐาน 10 - 12 วัน */}
                    <button
                      type="button"
                      onClick={() => {
                        const start = eventForm.startDate || new Date().toISOString().substring(0, 10);
                        const endD = new Date(start);
                        endD.setDate(endD.getDate() + 9); // 10 days
                        const endStr = endD.toISOString().substring(0, 10);
                        setEventForm({
                          ...eventForm,
                          durationFormat: 'LONG_TERM_MEDITATION',
                          eventType: 'MEDITATION',
                          totalDays: 10,
                          meditationDaysRequired: 10,
                          startDate: start,
                          endDate: endStr,
                          eventTime: 'ปฏิบัติวิปัสสนากัมมัฏฐานต่อเนื่อง (10 วัน 10 คืน)',
                          activityHours: 80,
                          attendanceMode: 'DAILY_CHECKIN',
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                        eventForm.durationFormat === 'LONG_TERM_MEDITATION'
                          ? 'bg-purple-50 border-purple-400 text-purple-900 ring-2 ring-purple-300/40 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between text-xs">
                        <span>🧘 วิปัสสนา 10-12 วัน</span>
                        {eventForm.durationFormat === 'LONG_TERM_MEDITATION' && (
                          <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.2 rounded font-bold">✓ เลือก</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">โครงการปฏิบัติธรรมประจำปีของ มจร</p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">วันที่เริ่ม:</label>
                    <input
                      type="date"
                      value={eventForm.startDate || ''}
                      onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">วันที่สิ้นสุด:</label>
                    <input
                      type="date"
                      value={eventForm.endDate || ''}
                      onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">เวลากิจกรรม:</label>
                    <input
                      type="text"
                      placeholder="เช่น 08:30 - 16:30 น."
                      value={eventForm.eventTime || '08:30 - 16:30 น.'}
                      onChange={(e) => setEventForm({ ...eventForm, eventTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">สถานที่จัดกิจกรรม:</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                    <input
                      type="text"
                      placeholder="เช่น อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย หรือ อาคารเรียนรวม คณะพุทธศาสตร์ มจร"
                      value={eventForm.location || ''}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Target Audience & Eligibility Criteria */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-3">
                <div className="font-bold text-blue-950 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>กลุ่มเป้าหมายผู้เข้าร่วมโครงการ (Eligibility)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">ระดับหลักสูตร:</label>
                    <select
                      value={eventForm.targetDegree || 'ALL'}
                      onChange={(e) => setEventForm({ ...eventForm, targetDegree: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="ALL">ทุกระดับ (ปริญญาตรี, โท, เอก)</option>
                      <option value="BACHELOR">เฉพาะปริญญาตรี (B.A.)</option>
                      <option value="MASTER">เฉพาะปริญญาโท (M.A.)</option>
                      <option value="DOCTORAL">เฉพาะปริญญาเอก (Ph.D.)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">หลักสูตรภาษา:</label>
                    <select
                      value={eventForm.targetProgram || 'ALL'}
                      onChange={(e) => setEventForm({ ...eventForm, targetProgram: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="ALL">ทุกหลักสูตรภาษา (ไทย + อังกฤษ)</option>
                      <option value="THAI">เฉพาะภาคภาษาไทย (Thai Program)</option>
                      <option value="ENGLISH">เฉพาะภาคภาษาอังกฤษ (International Program)</option>
                    </select>
                  </div>
                </div>

                {/* Target Year Levels Checkboxes */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">ชั้นปีที่เข้าร่วม:</label>
                  <div className="flex flex-wrap items-center gap-3">
                    {[1, 2, 3, 4].map((yr) => {
                      const isChecked = (eventForm.targetYearLevels || []).includes(yr);
                      return (
                        <label key={yr} className="flex items-center gap-1.5 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const curr = eventForm.targetYearLevels || [];
                              if (e.target.checked) {
                                setEventForm({ ...eventForm, targetYearLevels: [...curr, yr].sort() });
                              } else {
                                setEventForm({ ...eventForm, targetYearLevels: curr.filter((y) => y !== yr) });
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>ปี {yr}</span>
                        </label>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setEventForm({ ...eventForm, targetYearLevels: [1, 2, 3, 4] })}
                      className="text-[11px] text-blue-700 hover:underline font-semibold ml-2 cursor-pointer"
                    >
                      (เลือกทุกชั้นปี)
                    </button>
                  </div>
                </div>
              </div>

              {/* Coordinator Information & Toggle */}
              <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-purple-950 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>ข้อมูลผู้รับผิดชอบโครงการ</span>
                  </div>

                  {/* Switch Toggle: Show/Hide Coordinator */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-[11px] font-semibold text-purple-900">
                      {eventForm.showCoordinator !== false ? 'เปิดแสดงผู้รับผิดชอบ' : 'ซ่อนผู้รับผิดชอบ'}
                    </span>
                    <input
                      type="checkbox"
                      checked={eventForm.showCoordinator !== false}
                      onChange={(e) => setEventForm({ ...eventForm, showCoordinator: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 relative"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">ชื่อผู้รับผิดชอบโครงการ:</label>
                    <input
                      type="text"
                      placeholder="เช่น พระครูสุธีกิตติบัณฑิต, รศ.ดร. หรือ นายดวงดี โอฐสู"
                      value={eventForm.coordinatorName || ''}
                      onChange={(e) => setEventForm({ ...eventForm, coordinatorName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">ตำแหน่ง / สังกัด:</label>
                    <input
                      type="text"
                      placeholder="เช่น คณบดีคณะพุทธศาสตร์ / นักวิชาการศึกษา"
                      value={eventForm.coordinatorTitle || ''}
                      onChange={(e) => setEventForm({ ...eventForm, coordinatorTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">เบอร์โทรศัพท์ติดต่อ:</label>
                    <input
                      type="text"
                      placeholder="เช่น 035-248-000 ต่อ 8323"
                      value={eventForm.coordinatorPhone || ''}
                      onChange={(e) => setEventForm({ ...eventForm, coordinatorPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">อีเมลติดต่อ:</label>
                    <input
                      type="email"
                      placeholder="เช่น buddhism@mcu.ac.th"
                      value={eventForm.coordinatorEmail || ''}
                      onChange={(e) => setEventForm({ ...eventForm, coordinatorEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
              </div>

              {/* Form Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 border-t bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={onSubmitAndOpenGroupImport}
                  disabled={isSubmittingEvent}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>บันทึก &amp; นำเข้านิสิตเป็นกลุ่ม</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onClose()}
                    disabled={isSubmittingEvent}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEvent}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingEvent ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{isSubmittingEvent ? 'กำลังบันทึก...' : editingEventId ? 'บันทึกการแก้ไข' : 'บันทึกโครงการ'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
    </>
  );
};
