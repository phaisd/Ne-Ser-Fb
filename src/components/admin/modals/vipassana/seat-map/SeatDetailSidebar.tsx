import React from 'react';
import {
  X,
  CheckCircle2,
  Trash2,
  Check,
} from 'lucide-react';
import type { EventRegistration, EventSeatingConfig, SeatZone } from '@/types/event';
import {
  STATUS_THEMES,
  type ParticipantStatusCategory,
} from '@/services/events/seatingUtils';
import { INSPECTION_PERIODS, parseSeatCode } from './index';

export interface SeatDetailSidebarProps {
  selectedSeat: string | null;
  onClose: () => void;
  config: EventSeatingConfig;
  disabledSet: Set<string>;
  selectedOccupant: EventRegistration | null | undefined;
  inspectionDay: number | 'ALL' | string;
  inspectionPeriod: string;
  isSavingInspection: boolean;
  onSaveSeatInspection: (
    target: { registrationId: string; studentCode: string; seatNumber: string },
    isOccupied: boolean | null
  ) => void;
  onAssignSeatManually: (seat: string, registrationIdOrCode: string | null) => void;
  onToggleDisableSeat: (seat: string) => void;
  onDesignateSeatStatus: (seat: string, status: ParticipantStatusCategory | null) => void;
  onDesignateRowStatus: (
    zone: SeatZone,
    rowChar: string,
    rIdx: number,
    status: ParticipantStatusCategory | null
  ) => void;
  onDesignateColStatus: (
    zone: SeatZone,
    colNum: number,
    status: ParticipantStatusCategory | null
  ) => void;
  assignTargetStudentCode: string;
  setAssignTargetStudentCode: (code: string) => void;
  registrations: EventRegistration[];
  isSaving: boolean;
}

export const SeatDetailSidebar: React.FC<SeatDetailSidebarProps> = ({
  selectedSeat,
  onClose,
  config,
  disabledSet,
  selectedOccupant,
  inspectionDay,
  inspectionPeriod,
  isSavingInspection,
  onSaveSeatInspection,
  onAssignSeatManually,
  onToggleDisableSeat,
  onDesignateSeatStatus,
  onDesignateRowStatus,
  onDesignateColStatus,
  assignTargetStudentCode,
  setAssignTargetStudentCode,
  registrations,
  isSaving,
}) => {
  if (!selectedSeat) return null;

  return (
    <div className="fixed sm:static inset-x-0 bottom-0 sm:inset-auto w-full sm:w-96 max-h-[80vh] sm:max-h-none bg-white border-t sm:border-t-0 sm:border-l border-slate-200 shadow-2xl sm:shadow-xl flex flex-col shrink-0 rounded-t-2xl sm:rounded-none z-40 sm:z-20 animate-in slide-in-from-bottom sm:slide-in-from-right duration-200">
      <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between">
        <div>
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
            รายละเอียดจุดที่นั่ง
          </span>
          <h4 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            {selectedSeat}
            {disabledSet.has(selectedSeat.toUpperCase()) && (
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-normal">
                ทางเดิน/เสา
              </span>
            )}
          </h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
        {/* Daily & Period Inspection Box (ตรวจนิสิตสแกนเข้าแต่ไม่เข้านั่ง) */}
        {inspectionDay !== 'ALL' && selectedOccupant && (
          <div className="bg-gradient-to-br from-indigo-50/90 to-purple-50/90 rounded-2xl p-4 border-2 border-indigo-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-200/80">
              <div className="font-extrabold text-xs text-indigo-950 flex items-center gap-1.5">
                <span className="text-base">
                  {INSPECTION_PERIODS.find((p) => p.id === inspectionPeriod)?.icon}
                </span>
                <span>
                  ตรวจที่นั่ง วันที่ {inspectionDay} • {INSPECTION_PERIODS.find((p) => p.id === inspectionPeriod)?.nameTh}
                </span>
              </div>
              <span className="text-[10px] text-indigo-600 font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                {INSPECTION_PERIODS.find((p) => p.id === inspectionPeriod)?.time}
              </span>
            </div>

            {(() => {
              const dayKey = `day_${inspectionDay}`;
              const att = selectedOccupant.dailyAttendance?.[dayKey]?.[inspectionPeriod];
              const isScanned = Boolean(
                att && (att.status === 'PRESENT' || att.status === 'LATE' || att.checkInTime)
              );
              const isOccupied = att?.seatOccupied;

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-xl border border-indigo-100">
                      <span className="text-slate-500 block text-[10px]">การสแกนรอบนี้:</span>
                      {isScanned ? (
                        <span className="font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5">
                          ✓ สแกนแล้ว {att?.checkInTime ? `(${att.checkInTime})` : ''}
                        </span>
                      ) : (
                        <span className="font-bold text-slate-500 block mt-0.5">
                          ❌ ยังไม่พบการสแกน
                        </span>
                      )}
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-indigo-100">
                      <span className="text-slate-500 block text-[10px]">ผลการตรวจที่นั่ง:</span>
                      {isOccupied === true ? (
                        <span className="font-extrabold text-emerald-700 block mt-0.5">
                          🟢 นั่งอยู่ปกติ
                        </span>
                      ) : isOccupied === false ? (
                        <span className="font-extrabold text-rose-700 block mt-0.5">
                          🔴 ตรวจพบว่าว่าง
                        </span>
                      ) : (
                        <span className="text-slate-400 block mt-0.5">ยังไม่บันทึกผล</span>
                      )}
                    </div>
                  </div>

                  {/* Inspection Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onSaveSeatInspection(
                          {
                            registrationId: selectedOccupant.id,
                            studentCode: selectedOccupant.studentCode,
                            seatNumber: selectedSeat,
                          },
                          false
                        )
                      }
                      disabled={isSavingInspection}
                      className={`p-3 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer shadow-xs ${
                        isOccupied === false
                          ? 'bg-rose-600 text-white ring-3 ring-rose-400'
                          : 'bg-white hover:bg-rose-50 text-rose-800 border-2 border-rose-400'
                      }`}
                    >
                      <span className="text-xl">🪑</span>
                      <span>ที่นั่งว่าง (ไม่อยู่)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onSaveSeatInspection(
                          {
                            registrationId: selectedOccupant.id,
                            studentCode: selectedOccupant.studentCode,
                            seatNumber: selectedSeat,
                          },
                          true
                        )
                      }
                      disabled={isSavingInspection}
                      className={`p-3 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer shadow-xs ${
                        isOccupied === true
                          ? 'bg-emerald-600 text-white ring-3 ring-emerald-400'
                          : 'bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-400'
                      }`}
                    >
                      <span className="text-xl">✅</span>
                      <span>นั่งอยู่ปกติ</span>
                    </button>
                  </div>

                  {isOccupied !== undefined && (
                    <button
                      type="button"
                      onClick={() =>
                        onSaveSeatInspection(
                          {
                            registrationId: selectedOccupant.id,
                            studentCode: selectedOccupant.studentCode,
                            seatNumber: selectedSeat,
                          },
                          null
                        )
                      }
                      disabled={isSavingInspection}
                      className="w-full text-center text-[10.5px] text-slate-400 hover:text-slate-700 transition cursor-pointer pt-0.5 underline"
                    >
                      ล้างผลตรวจรอบนี้ (คืนค่าเริ่มต้น)
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Seat Occupant Info */}
        {selectedOccupant ? (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">ข้อมูลผู้ได้รับจัดที่นั่ง:</span>
              {selectedOccupant.seatCheckinAt ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> เช็คอินแล้ว
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">
                  รอเข้าที่นั่ง
                </span>
              )}
            </div>

            <div className="space-y-1 text-slate-800">
              <div className="text-sm font-extrabold text-slate-900">
                {selectedOccupant.studentName}
              </div>
              <div className="text-slate-600">
                รหัสนิสิต: <span className="font-bold">{selectedOccupant.studentCode}</span>
                {selectedOccupant.groupSpecificCode && ` (${selectedOccupant.groupSpecificCode})`}
              </div>
              <div className="text-slate-600">
                สังกัดกลุ่ม: <span className="font-bold">
                  {selectedOccupant.groupNumber
                    ? selectedOccupant.groupNumber === 12
                      ? 'กลุ่ม 12 (ไทย)'
                      : selectedOccupant.programType === 'ENGLISH' || selectedOccupant.programType === 'INTER'
                      ? `Group ${selectedOccupant.groupNumber} (English)`
                      : `กลุ่มที่ ${selectedOccupant.groupNumber}`
                    : selectedOccupant.groupName || '-'}
                </span>
              </div>
              <div className="text-slate-600">
                สาขาวิชา: {selectedOccupant.major || '-'}
              </div>
              {selectedOccupant.vasa && (
                <div className="text-amber-800 font-bold flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 w-fit text-[11px]">
                  <span>พรรษา:</span>
                  <span>{selectedOccupant.vasa} พรรษา</span>
                </div>
              )}
              {selectedOccupant.seatCheckinAt && (
                <div className="text-[11px] text-emerald-700 pt-1 border-t border-slate-200">
                  เข้าที่นั่งเมื่อ: {new Date(selectedOccupant.seatCheckinAt).toLocaleTimeString('th-TH')} น.
                </div>
              )}
            </div>

            {/* Unassign action */}
            <button
              type="button"
              onClick={() => onAssignSeatManually(selectedSeat, null)}
              disabled={isSaving}
              className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ยกเลิกการจัดที่นั่งนี้ (ว่าง)</span>
            </button>
          </div>
        ) : disabledSet.has(selectedSeat.toUpperCase()) ? (
          <div className="bg-slate-100 rounded-xl p-4 border border-dashed border-slate-300 text-center space-y-2">
            <p className="text-slate-600 font-medium">ที่นั่งนี้ถูกเว้นว่างไว้เป็นทางเดินหรือเสาอาคาร</p>
            <button
              type="button"
              onClick={() => onToggleDisableSeat(selectedSeat)}
              className="px-3 py-1.5 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-bold transition cursor-pointer"
            >
              เปิดใช้งานเป็นที่นั่งปกติ
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200 space-y-3">
            <div className="text-emerald-900 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              ที่นั่งนี้กำลังว่างอยู่
            </div>
            <p className="text-slate-600 text-[11px]">
              สามารถเลือกนิสิตที่ยังไม่มีที่นั่งมาลงที่จุดนี้ได้ทันที:
            </p>

            {/* Quick assign unassigned student */}
            <div className="space-y-2">
              <select
                value={assignTargetStudentCode}
                onChange={(e) => setAssignTargetStudentCode(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- เลือกนิสิตที่ยังไม่มีที่นั่ง --</option>
                {registrations
                  .filter((r) => !r.seatNumber)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.studentName} ({r.studentCode}) {r.vasa ? `[${r.vasa} พรรษา]` : ''} {r.groupNumber ? `- กลุ่ม ${r.groupNumber}` : ''}
                    </option>
                  ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  if (!assignTargetStudentCode) {
                    alert('กรุณาเลือกนิสิตก่อน');
                    return;
                  }
                  onAssignSeatManually(selectedSeat, assignTargetStudentCode);
                }}
                disabled={!assignTargetStudentCode || isSaving}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>กำหนดให้นิสิตนั่งตรงนี้</span>
              </button>
            </div>

            <div className="pt-2 border-t border-emerald-200">
              <button
                type="button"
                onClick={() => onToggleDisableSeat(selectedSeat)}
                className="w-full py-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition font-medium cursor-pointer"
              >
                เว้นที่นั่งนี้เป็นทางเดิน/เสา (Disable)
              </button>
            </div>
          </div>
        )}

        {/* Designation Controls (กำหนดสถานะตัวแทน พระ ภิกษุณี แม่ชี สามเณร ฆราวาส) */}
        {!disabledSet.has(selectedSeat.toUpperCase()) && (
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="text-amber-600">🏷️</span>
                <span>กำหนดสถานะตัวแทนที่นั่ง:</span>
              </span>
              {config.seatDesignations?.[selectedSeat.toUpperCase()] && (
                <button
                  type="button"
                  onClick={() => onDesignateSeatStatus(selectedSeat, null)}
                  className="text-[10.5px] text-rose-600 hover:underline font-bold cursor-pointer"
                >
                  ล้างสถานะ
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {(['MONK', 'BHIKKHUNI', 'SAMANERA', 'MAECHI', 'LAY_MALE', 'LAY_FEMALE'] as ParticipantStatusCategory[]).map((cat) => {
                const th = STATUS_THEMES[cat];
                const isCurrent = config.seatDesignations?.[selectedSeat.toUpperCase()] === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onDesignateSeatStatus(selectedSeat, isCurrent ? null : cat)}
                    className={`px-2 py-1.5 text-xs rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                      isCurrent
                        ? `${th.badgeClass} ring-2 ring-slate-900 shadow-xs`
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: th.dotColor }} />
                    <span className="truncate">{th.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Row / Column Designation Tools */}
            <div className="pt-2 border-t border-slate-200/90 space-y-1.5">
              <div className="text-[10.5px] font-bold text-slate-500">
                ⚡ กำหนดให้ทั้งแถวหรือทั้งคอลัมน์ (1 คลิก):
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const zone =
                      config.zones.find(
                        (z) => z.prefix && selectedSeat.toUpperCase().startsWith(z.prefix.toUpperCase())
                      ) || config.zones[0];
                    const parsed = parseSeatCode(selectedSeat, zone);
                    const rIdx = parsed ? parsed.rIdx : 0;
                    const rowChar = String.fromCharCode(65 + rIdx);
                    onDesignateRowStatus(
                      zone,
                      rowChar,
                      rIdx,
                      e.target.value === 'CLEAR' ? null : (e.target.value as ParticipantStatusCategory)
                    );
                    e.target.value = '';
                  }}
                  className="w-full text-[10.5px] p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 cursor-pointer"
                >
                  <option value="">ทั้งแถวนี้ ▾</option>
                  <option value="MONK">แถวนี้: พระภิกษุ</option>
                  <option value="BHIKKHUNI">แถวนี้: ภิกษุณี/Inter</option>
                  <option value="SAMANERA">แถวนี้: สามเณร</option>
                  <option value="MAECHI">แถวนี้: แม่ชี</option>
                  <option value="LAY_MALE">แถวนี้: ฆราวาสชาย</option>
                  <option value="LAY_FEMALE">แถวนี้: ฆราวาสหญิง</option>
                  <option value="CLEAR">ล้างสถานะทั้งแถว</option>
                </select>

                <select
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const zone =
                      config.zones.find(
                        (z) => z.prefix && selectedSeat.toUpperCase().startsWith(z.prefix.toUpperCase())
                      ) || config.zones[0];
                    const parsed = parseSeatCode(selectedSeat, zone);
                    const colNum = parsed ? parsed.cIdx + 1 : 1;
                    onDesignateColStatus(
                      zone,
                      colNum,
                      e.target.value === 'CLEAR' ? null : (e.target.value as ParticipantStatusCategory)
                    );
                    e.target.value = '';
                  }}
                  className="w-full text-[10.5px] p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 cursor-pointer"
                >
                  <option value="">ทั้งคอลัมน์ ▾</option>
                  <option value="MONK">คอลัมน์นี้: พระภิกษุ</option>
                  <option value="BHIKKHUNI">คอลัมน์นี้: ภิกษุณี/Inter</option>
                  <option value="SAMANERA">คอลัมน์นี้: สามเณร</option>
                  <option value="MAECHI">คอลัมน์นี้: แม่ชี</option>
                  <option value="LAY_MALE">คอลัมน์นี้: ฆราวาสชาย</option>
                  <option value="LAY_FEMALE">คอลัมน์นี้: ฆราวาสหญิง</option>
                  <option value="CLEAR">ล้างสถานะทั้งคอลัมน์</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
