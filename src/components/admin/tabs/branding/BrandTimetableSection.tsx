'use client';

import React from 'react';
import {
  Clock,
  RefreshCw,
  Eye,
  Calendar,
  GraduationCap,
  Check,
} from 'lucide-react';
import { SystemSettings } from '@/types';

interface BrandTimetableSectionProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export function BrandTimetableSection({
  settings,
  setSettings,
}: BrandTimetableSectionProps) {
  const dayList = [
    { id: 1, label: 'จันทร์', short: 'จ.' },
    { id: 2, label: 'อังคาร', short: 'อ.' },
    { id: 3, label: 'พุธ', short: 'พ.' },
    { id: 4, label: 'พฤหัสฯ', short: 'พฤ.' },
    { id: 5, label: 'ศุกร์', short: 'ศ.' },
    { id: 6, label: 'เสาร์', short: 'ส.' },
    { id: 7, label: 'อาทิตย์', short: 'อา.' },
  ];

  return (
    <div className="space-y-5">
      {/* 5. Timetable Period Times Configuration */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              กำหนดช่วงเวลาคาบเรียนในตารางสอน (Timetable Period Times)
            </h4>
            <p className="text-xs text-slate-500">
              ปรับแต่งข้อความหัวตารางและช่วงเวลาในแต่ละคาบเรียน (เช้า, กลางวัน, บ่าย, ค่ำ/ปฏิบัติการ) เพื่อแสดงผลในตารางสอนหน้าระบบ (/courses)
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSettings({
                ...settings,
                morningPeriodLabel: 'คาบเช้า (09:00 - 11:30 น.)',
                morningPeriodSub: 'ภาคการศึกษาปกติ',
                lunchPeriodLabel: 'พักฉัน / พักกลางวัน',
                lunchPeriodTime: '11:30 - 13:00',
                afternoonPeriodLabel: 'คาบบ่าย (13:00 - 15:30 น.)',
                afternoonPeriodSub: 'ภาคการศึกษาปกติ',
                eveningPeriodLabel: 'คาบเย็น / ปฏิบัติการ (16:00 - 18:30 น.)',
                eveningPeriodSub: 'วิชาสัมมนา / กัมมัฏฐาน',
              });
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-600 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>รีเซ็ตเป็นค่ามาตรฐาน มจร</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* คาบเช้า */}
          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2.5">
            <div className="font-bold text-amber-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                1. คาบเช้า (Morning)
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-medium">Slot 1</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">หัวข้อคาบและเวลา</label>
              <input
                type="text"
                value={settings.morningPeriodLabel ?? 'คาบเช้า (09:00 - 11:30 น.)'}
                onChange={(e) => setSettings({ ...settings, morningPeriodLabel: e.target.value })}
                placeholder="คาบเช้า (09:00 - 11:30 น.)"
                className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">คำอธิบายย่อย</label>
              <input
                type="text"
                value={settings.morningPeriodSub ?? 'ภาคการศึกษาปกติ'}
                onChange={(e) => setSettings({ ...settings, morningPeriodSub: e.target.value })}
                placeholder="ภาคการศึกษาปกติ"
                className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* พักกลางวัน / พักฉัน */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                2. พักฉัน / กลางวัน (Lunch)
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-medium">Slot 2</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">ข้อความป้ายพัก</label>
              <input
                type="text"
                value={settings.lunchPeriodLabel ?? 'พักฉัน / พักกลางวัน'}
                onChange={(e) => setSettings({ ...settings, lunchPeriodLabel: e.target.value })}
                placeholder="พักฉัน / พักกลางวัน"
                className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">ช่วงเวลา</label>
              <input
                type="text"
                value={settings.lunchPeriodTime ?? '11:30 - 13:00'}
                onChange={(e) => setSettings({ ...settings, lunchPeriodTime: e.target.value })}
                placeholder="11:30 - 13:00"
                className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500 font-mono"
              />
            </div>
          </div>

          {/* คาบบ่าย */}
          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-2.5">
            <div className="font-bold text-blue-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                3. คาบบ่าย (Afternoon)
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono font-medium">Slot 3</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">หัวข้อคาบและเวลา</label>
              <input
                type="text"
                value={settings.afternoonPeriodLabel ?? 'คาบบ่าย (13:00 - 15:30 น.)'}
                onChange={(e) => setSettings({ ...settings, afternoonPeriodLabel: e.target.value })}
                placeholder="คาบบ่าย (13:00 - 15:30 น.)"
                className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">คำอธิบายย่อย</label>
              <input
                type="text"
                value={settings.afternoonPeriodSub ?? 'ภาคการศึกษาปกติ'}
                onChange={(e) => setSettings({ ...settings, afternoonPeriodSub: e.target.value })}
                placeholder="ภาคการศึกษาปกติ"
                className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* คาบเย็น / ปฏิบัติการ */}
          <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/80 space-y-2.5">
            <div className="font-bold text-purple-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                4. คาบเย็น / สัมมนา (Evening)
              </span>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-mono font-medium">Slot 4</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">หัวข้อคาบและเวลา</label>
              <input
                type="text"
                value={settings.eveningPeriodLabel ?? 'คาบเย็น / ปฏิบัติการ (16:00 - 18:30 น.)'}
                onChange={(e) => setSettings({ ...settings, eveningPeriodLabel: e.target.value })}
                placeholder="คาบเย็น / ปฏิบัติการ (16:00 - 18:30 น.)"
                className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">คำอธิบายย่อย</label>
              <input
                type="text"
                value={settings.eveningPeriodSub ?? 'วิชาสัมมนา / กัมมัฏฐาน'}
                onChange={(e) => setSettings({ ...settings, eveningPeriodSub: e.target.value })}
                placeholder="วิชาสัมมนา / กัมมัฏฐาน"
                className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Live Preview on /courses */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            ตัวอย่างการแสดงผลหัวตารางสอน (Live Preview on /courses):
          </span>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-semibold">
              <div>{settings.morningPeriodLabel || 'คาบเช้า (09:00 - 11:30 น.)'}</div>
              <div className="text-[10px] text-amber-700/70 font-normal">{settings.morningPeriodSub || 'ภาคการศึกษาปกติ'}</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
              <div>{settings.lunchPeriodLabel || 'พักฉัน / พักกลางวัน'}</div>
              <div className="text-[10px] text-slate-500 font-mono">{settings.lunchPeriodTime || '11:30 - 13:00'}</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-semibold">
              <div>{settings.afternoonPeriodLabel || 'คาบบ่าย (13:00 - 15:30 น.)'}</div>
              <div className="text-[10px] text-blue-700/70 font-normal">{settings.afternoonPeriodSub || 'ภาคการศึกษาปกติ'}</div>
            </div>
            <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 font-semibold">
              <div>{settings.eveningPeriodLabel || 'คาบเย็น / ปฏิบัติการ (16:00 - 18:30 น.)'}</div>
              <div className="text-[10px] text-purple-700/70 font-normal">{settings.eveningPeriodSub || 'วิชาสัมมนา / กัมมัฏฐาน'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Degree Timetable Days & Notes */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              กำหนดวันเรียนที่แสดงบนตารางและหมายเหตุท้ายตารางแยกตามระดับหลักสูตร (Degree Timetable Days & Notes)
            </h4>
            <p className="text-xs text-slate-500">
              กำหนดว่าแต่ละระดับหลักสูตรจะแสดงวันใดบ้างบนตารางสอน (เช่น ป.ตรี แสดง จันทร์-พฤหัส, ป.โท/เอก แสดง เสาร์-อาทิตย์) และปรับแต่งข้อความหมายเหตุท้ายตาราง
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSettings({
                ...settings,
                timetableDaysBachelor: [1, 2, 3, 4],
                timetableDaysMaster: [6, 7],
                timetableDaysDoctoral: [6, 7],
                timetableDaysCertificate: [6, 7],
                timetableNotesBachelor: "หมายเหตุ\t๑. วันพระและวันนักขัตฤกษ์เป็นวันหยุดทั่วไป (ตารางเรียนวันใดตรงกับวันพระให้ยกไปเรียนวันศุกร์)\n\t๒. *รายวิชาข้อสอบกลาง",
                timetableNotesMaster: "หมายเหตุ\t๑. จัดการเรียนการสอนวันเสาร์ - วันอาทิตย์ ตามตารางที่หลักสูตรกำหนด",
                timetableNotesDoctoral: "หมายเหตุ\t๑. จัดการเรียนการสอนวันเสาร์ - วันอาทิตย์ ตามตารางที่หลักสูตรกำหนด",
                timetableNotesCertificate: "หมายเหตุ\t๑. จัดการเรียนการสอนตามประกาศตารางเรียนหลักสูตรประกาศนียบัตร",
              });
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-600 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>รีเซ็ตวันและหมายเหตุเป็นค่าเริ่มต้น</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          {/* 1. ปริญญาตรี */}
          {(() => {
            const currentDays = settings.timetableDaysBachelor && settings.timetableDaysBachelor.length > 0
              ? settings.timetableDaysBachelor
              : [1, 2, 3, 4];
            const noteText = settings.timetableNotesBachelor ?? "หมายเหตุ\t๑. วันพระและวันนักขัตฤกษ์เป็นวันหยุดทั่วไป (ตารางเรียนวันใดตรงกับวันพระให้ยกไปเรียนวันศุกร์)\n\t๒. *รายวิชาข้อสอบกลาง";

            return (
              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200/80">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-amber-700" />
                    <span className="font-extrabold text-amber-950 text-sm">🎓 ระดับปริญญาตรี (พธ.บ.)</span>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    แสดง {currentDays.length} วัน
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 text-[11px]">เลือกวันที่จะแสดงบนตารางสอน:</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, timetableDaysBachelor: [1, 2, 3, 4] })}
                        className="text-[10px] text-amber-700 hover:underline cursor-pointer font-medium"
                      >
                        [จ.-พฤ.]
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, timetableDaysBachelor: [1, 2, 3, 4, 5] })}
                        className="text-[10px] text-amber-700 hover:underline cursor-pointer font-medium"
                      >
                        [จ.-ศ.]
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, timetableDaysBachelor: [1, 2, 3, 4, 5, 6, 7] })}
                        className="text-[10px] text-amber-700 hover:underline cursor-pointer font-medium"
                      >
                        [ทุกวัน]
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dayList.map((d) => {
                      const active = currentDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            const next = active
                              ? currentDays.length > 1
                                ? currentDays.filter((x) => x !== d.id)
                                : currentDays
                              : [...currentDays, d.id].sort((a, b) => a - b);
                            setSettings({ ...settings, timetableDaysBachelor: next });
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            active
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-white text-slate-500 border border-slate-200 hover:border-amber-400'
                          }`}
                        >
                          <span>{d.label}</span>
                          {active && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px] block mb-1">
                    กล่องข้อความหมายเหตุท้ายตาราง (Footer Notes):
                  </label>
                  <textarea
                    rows={3}
                    value={noteText}
                    onChange={(e) => setSettings({ ...settings, timetableNotesBachelor: e.target.value })}
                    placeholder="หมายเหตุ ๑. วันพระและวันนักขัตฤกษ์เป็นวันหยุดทั่วไป..."
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium leading-relaxed"
                  />
                </div>
              </div>
            );
          })()}

          {/* 2. ปริญญาโท */}
          {(() => {
            const currentDays = settings.timetableDaysMaster && settings.timetableDaysMaster.length > 0
              ? settings.timetableDaysMaster
              : [6, 7];
            const noteText = settings.timetableNotesMaster ?? "หมายเหตุ\t๑. จัดการเรียนการสอนวันเสาร์ - วันอาทิตย์ ตามตารางที่หลักสูตรกำหนด";

            return (
              <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-700" />
                    <span className="font-extrabold text-blue-950 text-sm">🎓 ระดับปริญญาโท (พธ.ม.)</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                    แสดง {currentDays.length} วัน
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 text-[11px]">เลือกวันที่จะแสดงบนตารางสอน:</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, timetableDaysMaster: [6, 7] })}
                        className="text-[10px] text-blue-700 hover:underline cursor-pointer font-medium"
                      >
                        [ส.-อา.]
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, timetableDaysMaster: [5, 6, 7] })}
                        className="text-[10px] text-blue-700 hover:underline cursor-pointer font-medium"
                      >
                        [ศ.-อา.]
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, timetableDaysMaster: [1, 2, 3, 4, 5, 6, 7] })}
                        className="text-[10px] text-blue-700 hover:underline cursor-pointer font-medium"
                      >
                        [ทุกวัน]
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dayList.map((d) => {
                      const active = currentDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            const next = active
                              ? currentDays.length > 1
                                ? currentDays.filter((x) => x !== d.id)
                                : currentDays
                              : [...currentDays, d.id].sort((a, b) => a - b);
                            setSettings({ ...settings, timetableDaysMaster: next });
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            active
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-400'
                          }`}
                        >
                          <span>{d.label}</span>
                          {active && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px] block mb-1">
                    กล่องข้อความหมายเหตุท้ายตาราง (Footer Notes):
                  </label>
                  <textarea
                    rows={3}
                    value={noteText}
                    onChange={(e) => setSettings({ ...settings, timetableNotesMaster: e.target.value })}
                    placeholder="หมายเหตุ ๑. จัดการเรียนการสอนวันเสาร์ - อาทิตย์..."
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium leading-relaxed"
                  />
                </div>
              </div>
            );
          })()}

          {/* 3. ปริญญาเอก */}
          {(() => {
            const currentDays = settings.timetableDaysDoctoral && settings.timetableDaysDoctoral.length > 0
              ? settings.timetableDaysDoctoral
              : [6, 7];
            const noteText = settings.timetableNotesDoctoral ?? "หมายเหตุ\t๑. จัดการเรียนการสอนวันเสาร์ - วันอาทิตย์ ตามตารางที่หลักสูตรกำหนด";

            return (
              <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-purple-200/80">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-700" />
                    <span className="font-extrabold text-purple-950 text-sm">🎓 ระดับปริญญาเอก (พธ.ด.)</span>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                    แสดง {currentDays.length} วัน
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 text-[11px]">เลือกวันที่จะแสดงบนตารางสอน:</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, timetableDaysDoctoral: [6, 7] })}
                        className="text-[10px] text-purple-700 hover:underline cursor-pointer font-medium"
                      >
                        [ส.-อา.]
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, timetableDaysDoctoral: [5, 6, 7] })}
                        className="text-[10px] text-purple-700 hover:underline cursor-pointer font-medium"
                      >
                        [ศ.-อา.]
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, timetableDaysDoctoral: [1, 2, 3, 4, 5, 6, 7] })}
                        className="text-[10px] text-purple-700 hover:underline cursor-pointer font-medium"
                      >
                        [ทุกวัน]
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dayList.map((d) => {
                      const active = currentDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            const next = active
                              ? currentDays.length > 1
                                ? currentDays.filter((x) => x !== d.id)
                                : currentDays
                              : [...currentDays, d.id].sort((a, b) => a - b);
                            setSettings({ ...settings, timetableDaysDoctoral: next });
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            active
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-white text-slate-500 border border-slate-200 hover:border-purple-400'
                          }`}
                        >
                          <span>{d.label}</span>
                          {active && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px] block mb-1">
                    กล่องข้อความหมายเหตุท้ายตาราง (Footer Notes):
                  </label>
                  <textarea
                    rows={3}
                    value={noteText}
                    onChange={(e) => setSettings({ ...settings, timetableNotesDoctoral: e.target.value })}
                    placeholder="หมายเหตุ ๑. จัดการเรียนการสอนวันเสาร์ - อาทิตย์..."
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium leading-relaxed"
                  />
                </div>
              </div>
            );
          })()}

          {/* 4. ประกาศนียบัตร */}
          {(() => {
            const currentDays = settings.timetableDaysCertificate && settings.timetableDaysCertificate.length > 0
              ? settings.timetableDaysCertificate
              : [6, 7];
            const noteText = settings.timetableNotesCertificate ?? "หมายเหตุ\t๑. จัดการเรียนการสอนตามประกาศตารางเรียนหลักสูตรประกาศนียบัตร";

            return (
              <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    <span className="font-extrabold text-emerald-950 text-sm">📜 หลักสูตรประกาศนียบัตร</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                    แสดง {currentDays.length} วัน
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 text-[11px]">เลือกวันที่จะแสดงบนตารางสอน:</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, timetableDaysCertificate: [6, 7] })}
                        className="text-[10px] text-emerald-700 hover:underline cursor-pointer font-medium"
                      >
                        [ส.-อา.]
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, timetableDaysCertificate: [1, 2, 3, 4, 5] })}
                        className="text-[10px] text-emerald-700 hover:underline cursor-pointer font-medium"
                      >
                        [จ.-ศ.]
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, timetableDaysCertificate: [1, 2, 3, 4, 5, 6, 7] })}
                        className="text-[10px] text-emerald-700 hover:underline cursor-pointer font-medium"
                      >
                        [ทุกวัน]
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dayList.map((d) => {
                      const active = currentDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            const next = active
                              ? currentDays.length > 1
                                ? currentDays.filter((x) => x !== d.id)
                                : currentDays
                              : [...currentDays, d.id].sort((a, b) => a - b);
                            setSettings({ ...settings, timetableDaysCertificate: next });
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            active
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-400'
                          }`}
                        >
                          <span>{d.label}</span>
                          {active && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px] block mb-1">
                    กล่องข้อความหมายเหตุท้ายตาราง (Footer Notes):
                  </label>
                  <textarea
                    rows={3}
                    value={noteText}
                    onChange={(e) => setSettings({ ...settings, timetableNotesCertificate: e.target.value })}
                    placeholder="หมายเหตุ ๑. จัดการเรียนการสอนตามประกาศ..."
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium leading-relaxed"
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
