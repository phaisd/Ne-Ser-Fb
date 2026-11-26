import React from 'react';
import { CheckSquare } from 'lucide-react';
import type { EventRegistration, EventSeatingConfig, SeatZone } from '@/types/event';
import {
  STATUS_THEMES,
  detectParticipantStatus,
  type ParticipantStatusCategory,
} from '@/services/events/seatingUtils';
import { ZONE_COLORS, formatSeatCode } from './index';

export interface SeatMapCanvasProps {
  isBatchMode: boolean;
  setIsBatchMode: (mode: boolean) => void;
  setSelectedSeats: React.Dispatch<React.SetStateAction<Set<string>>>;
  onOpenRangeModal: () => void;
  zoomLevel: number;
  filteredZones: SeatZone[];
  config: EventSeatingConfig;
  disabledSet: Set<string>;
  selectedSeats: Set<string>;
  selectedSeat: string | null;
  setSelectedSeat: (seat: string | null) => void;
  seatOccupantMap: Map<string, EventRegistration>;
  searchQuery: string;
  inspectionDay: number | 'ALL' | string;
  inspectionPeriod: string;
  onSeatClick: (seatCode: string, e: React.MouseEvent, zone: SeatZone) => void;
  onToggleColAisle: (zone: SeatZone, colNum: number) => void;
}

export const SeatMapCanvas: React.FC<SeatMapCanvasProps> = ({
  isBatchMode,
  setIsBatchMode,
  setSelectedSeats,
  onOpenRangeModal,
  zoomLevel,
  filteredZones,
  config,
  disabledSet,
  selectedSeats,
  selectedSeat,
  setSelectedSeat,
  seatOccupantMap,
  searchQuery,
  inspectionDay,
  inspectionPeriod,
  onSeatClick,
  onToggleColAisle,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-auto p-2 sm:p-6 items-center">
      {/* Front Stage Graphic */}
      <div className="w-full max-w-3xl mb-3 sm:mb-6 flex flex-col items-center shrink-0">
        <div className="w-full py-1.5 sm:py-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-900 rounded-lg sm:rounded-xl shadow-md text-center font-black tracking-wider text-[11px] sm:text-sm border border-amber-400 flex items-center justify-center gap-1.5 sm:gap-2">
          <span>🏛️ ด้านหน้าหอประชุม / แท่นบรรยาย / พระวิปัสสนาจารย์ (STAGE FRONT)</span>
        </div>
        <div className="w-20 sm:w-32 h-1 bg-amber-400/50 rounded-full mt-1" />
      </div>

      {/* Batch Mode Notice Banner */}
      {isBatchMode && (
        <div className="w-full max-w-3xl mb-4 py-2 px-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 flex flex-wrap items-center justify-between gap-2 text-xs font-medium shrink-0 animate-in fade-in duration-150 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <b>โหมดเลือกกลุ่มเปิดอยู่:</b> คลิกที่นั่งเพื่อเลือก หรือกด <b>Shift + คลิก</b> เพื่อเลือกกรอบสี่เหลี่ยม (เช่น D-03..I-03 หรือ D-10..G-12) / สามารถคลิกหัวแถวหรือหัวคอลัมน์เพื่อเลือกทั้งแถว
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onOpenRangeModal}
              className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              ระบุช่วงที่นั่ง...
            </button>
            <button
              type="button"
              onClick={() => {
                setIsBatchMode(false);
                setSelectedSeats(new Set());
              }}
              className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              ปิดโหมดนี้
            </button>
          </div>
        </div>
      )}

      {/* Zones Grid Container */}
      <div
        className="flex flex-col gap-8 transition-transform duration-150 origin-top"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        {filteredZones.map((zone) => {
          const zoneColor = ZONE_COLORS[zone.color] || ZONE_COLORS.amber;

          return (
            <div
              key={zone.id}
              className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 flex flex-col items-center"
            >
              {/* Zone Header */}
              <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${zoneColor.bg}`} />
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-800">
                    {zone.name}
                  </h4>
                  <span className="text-xs text-slate-400 font-normal">
                    ({zone.rows} แถว × {zone.cols} คอลัมน์ = {zone.rows * zone.cols} ที่นั่ง)
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">{zone.description || ''}</span>
              </div>

              {/* Column Headers (1..cols) */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-7 text-center text-[10px] font-bold text-slate-400">แถว</div>
                <div
                  className="grid gap-1.5"
                  style={{ gridTemplateColumns: `repeat(${zone.cols}, minmax(36px, 1fr))` }}
                >
                  {Array.from({ length: zone.cols }, (_, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => {
                        if (isBatchMode) {
                          const colSeats: string[] = [];
                          for (let r = 0; r < zone.rows; r++) {
                            colSeats.push(formatSeatCode(zone, r, cIdx).toUpperCase());
                          }
                          setSelectedSeats((prev) => {
                            const next = new Set(prev);
                            const allPresent = colSeats.every((s) => next.has(s));
                            if (allPresent) {
                              colSeats.forEach((s) => next.delete(s));
                            } else {
                              colSeats.forEach((s) => next.add(s));
                            }
                            return next;
                          });
                        } else {
                          onToggleColAisle(zone, cIdx + 1);
                        }
                      }}
                      className={`text-center text-[10px] font-bold rounded cursor-pointer transition py-0.5 ${
                        isBatchMode
                          ? 'text-amber-900 bg-amber-100 hover:bg-amber-200 ring-1 ring-amber-300 font-black'
                          : 'text-slate-400 hover:text-amber-800 hover:bg-amber-100'
                      }`}
                      title={
                        isBatchMode
                          ? `คลิกคอลัมน์ ${cIdx + 1 < 10 ? `0${cIdx + 1}` : cIdx + 1} เพื่อเลือกทั้งคอลัมน์`
                          : `คลิกคอลัมน์ ${cIdx + 1 < 10 ? `0${cIdx + 1}` : cIdx + 1} เพื่อสลับเปิด/ปิดเป็นทางเดินและทางบิณฑบาตร`
                      }
                    >
                      {cIdx + 1 < 10 ? `0${cIdx + 1}` : cIdx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seat Grid Rows */}
              <div className="flex flex-col gap-1.5">
                {Array.from({ length: zone.rows }, (_, rIdx) => {
                  const rowChar = String.fromCharCode(65 + rIdx); // A, B, C...
                  return (
                    <div key={rIdx} className="flex items-center gap-1.5">
                      {/* Row Label */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isBatchMode) {
                            const rowSeats: string[] = [];
                            for (let c = 0; c < zone.cols; c++) {
                              rowSeats.push(formatSeatCode(zone, rIdx, c).toUpperCase());
                            }
                            setSelectedSeats((prev) => {
                              const next = new Set(prev);
                              const allPresent = rowSeats.every((s) => next.has(s));
                              if (allPresent) {
                                rowSeats.forEach((s) => next.delete(s));
                              } else {
                                rowSeats.forEach((s) => next.add(s));
                              }
                              return next;
                            });
                          } else {
                            setSelectedSeat(formatSeatCode(zone, rIdx, 0));
                          }
                        }}
                        className={`w-7 text-center text-xs font-black py-1 rounded cursor-pointer transition ${
                          isBatchMode
                            ? 'text-amber-950 bg-amber-100 hover:bg-amber-200 ring-1 ring-amber-300'
                            : 'text-slate-600 hover:text-amber-900 bg-slate-100 hover:bg-amber-100'
                        }`}
                        title={
                          isBatchMode
                            ? `คลิกแถว ${rowChar} เพื่อเลือกทั้งแถว`
                            : `แถว ${rowChar} - คลิกเพื่อจัดการกำหนดสถานะแถวนี้`
                        }
                      >
                        {rowChar}
                      </button>

                      {/* Row Seats */}
                      <div
                        className="grid gap-1.5"
                        style={{ gridTemplateColumns: `repeat(${zone.cols}, minmax(36px, 1fr))` }}
                      >
                        {Array.from({ length: zone.cols }, (_, cIdx) => {
                          const seatCode = formatSeatCode(zone, rIdx, cIdx);
                          const isDisabled = disabledSet.has(seatCode.toUpperCase());
                          const occupant = seatOccupantMap.get(seatCode.toUpperCase());
                          const isCheckedIn = Boolean(occupant?.seatCheckinAt);
                          const isSelected = selectedSeat?.toUpperCase() === seatCode.toUpperCase();
                          const isBatchSelected = selectedSeats.has(seatCode.toUpperCase());

                          const designatedKey = (config.seatDesignations || {})[
                            seatCode.toUpperCase()
                          ] as ParticipantStatusCategory;
                          const designatedTheme = designatedKey ? STATUS_THEMES[designatedKey] : null;

                          // Search match
                          const isSearchMatched =
                            Boolean(searchQuery) &&
                            (seatCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (occupant &&
                                (occupant.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  occupant.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  occupant.groupSpecificCode
                                    ?.toLowerCase()
                                    .includes(searchQuery.toLowerCase()))));

                          if (isDisabled) {
                            return (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={(e) => onSeatClick(seatCode, e, zone)}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-200/90 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[9px] hover:bg-slate-300 transition cursor-pointer relative ${
                                  isBatchSelected
                                    ? 'ring-4 ring-amber-500 scale-105 z-20 shadow-md bg-amber-100/90 text-amber-950 font-black border-amber-500'
                                    : ''
                                }`}
                                title={`ที่นั่ง ${seatCode} (เว้นเป็นทางเดิน/เสา) - คลิกเพื่อจัดการ`}
                              >
                                —
                                {isBatchSelected && (
                                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-md z-30 ring-1 ring-white">
                                    ✓
                                  </span>
                                )}
                              </button>
                            );
                          }

                          if (occupant) {
                            const occCategory = detectParticipantStatus(occupant.studentName, occupant.role).category;
                            const theme = STATUS_THEMES[occCategory] || STATUS_THEMES.UNKNOWN;

                            const isDaily = inspectionDay !== 'ALL';
                            const dayKey = isDaily ? `day_${inspectionDay}` : '';
                            const att = isDaily ? occupant.dailyAttendance?.[dayKey]?.[inspectionPeriod] : null;
                            const isScanned = Boolean(
                              att && (att.status === 'PRESENT' || att.status === 'LATE' || att.checkInTime)
                            );
                            const isSeatOccupied = att?.seatOccupied;

                            let dailyBgClass = theme.bgClass;
                            let dailyBorderClass = theme.borderClass;
                            let dailyTextClass = theme.textClass;
                            let dailyBadge: { text: string; bg: string; pulse?: boolean } | null = null;
                            let isDimmed = false;

                            if (isDaily) {
                              if (isScanned && isSeatOccupied === false) {
                                dailyBgClass = 'bg-rose-600';
                                dailyBorderClass = 'border-rose-300 ring-4 ring-rose-400';
                                dailyTextClass = 'text-white font-black';
                                dailyBadge = { text: '🚨 ไม่อยู่', bg: 'bg-rose-800 text-white', pulse: true };
                              } else if (isScanned && isSeatOccupied === true) {
                                dailyBgClass = 'bg-emerald-600';
                                dailyBorderClass = 'border-emerald-300 ring-2 ring-emerald-400';
                                dailyTextClass = 'text-white font-bold';
                                dailyBadge = { text: '✓ อยู่', bg: 'bg-emerald-800 text-white' };
                              } else if (isScanned && isSeatOccupied === undefined) {
                                dailyBgClass = theme.bgClass;
                                dailyBorderClass = 'border-blue-400 ring-2 ring-blue-300';
                                dailyTextClass = theme.textClass;
                                dailyBadge = { text: '✓ สแกน', bg: 'bg-blue-600 text-white' };
                              } else if (!isScanned && isSeatOccupied === true) {
                                dailyBgClass = 'bg-amber-400';
                                dailyBorderClass = 'border-amber-600 ring-2 ring-amber-400';
                                dailyTextClass = 'text-slate-950 font-black';
                                dailyBadge = { text: '⚠️ ไม่สแกน', bg: 'bg-amber-800 text-amber-100' };
                              } else {
                                isDimmed = true;
                                dailyBgClass = 'bg-slate-100';
                                dailyBorderClass = 'border-dashed border-slate-300';
                                dailyTextClass = 'text-slate-400';
                              }
                            }

                            return (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={(e) => onSeatClick(seatCode, e, zone)}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${
                                  isDaily ? dailyBgClass : theme.bgClass
                                } ${isDaily ? '' : theme.hoverClass} ${
                                  isDaily ? dailyTextClass : theme.textClass
                                } flex flex-col items-center justify-center shadow-xs transition cursor-pointer relative border ${
                                  isDaily ? dailyBorderClass : theme.borderClass
                                } ${isDimmed ? 'opacity-35 hover:opacity-100' : ''} ${
                                  isBatchSelected
                                    ? 'ring-4 ring-amber-500 scale-105 z-20 shadow-md bg-amber-100/90 text-amber-950 font-black border-amber-500'
                                    : isSelected
                                    ? 'ring-4 ring-amber-400 scale-105 z-10'
                                    : ''
                                } ${isSearchMatched ? 'ring-4 ring-yellow-300 animate-bounce' : ''}`}
                                title={
                                  isDaily
                                    ? `[${seatCode}] ${occupant.studentName} (${occupant.studentCode})\nสถานะตรวจที่นั่ง: ${
                                        isScanned && isSeatOccupied === false
                                          ? '🚨 สแกนเข้าแต่ที่นั่งว่าง (ไม่อยู่ที่นั่ง)'
                                          : isScanned && isSeatOccupied === true
                                          ? '🟢 สแกนแล้ว และนั่งอยู่ปกติ'
                                          : isScanned
                                          ? '🔵 สแกนแล้ว (ยังไม่ตรวจที่นั่ง)'
                                          : !isScanned && isSeatOccupied === true
                                          ? '🟡 นั่งอยู่ แต่ยังไม่ได้สแกน'
                                          : '⚪ ยังไม่สแกนในรอบนี้'
                                      }\nเวลาสแกน: ${att?.checkInTime || '-'}`
                                    : `[${theme.label}${isCheckedIn ? ' • เช็คอินแล้ว' : ''}] ${seatCode}: ${
                                        occupant.studentName
                                      }${occupant.vasa ? ` (${occupant.vasa} พรรษา)` : ''} (${occupant.studentCode})`
                                }
                              >
                                <span className="text-[10px] leading-none">{seatCode}</span>
                                <span className="text-[8px] font-medium truncate max-w-[34px] opacity-95">
                                  {occupant.groupSpecificCode ||
                                    (occupant.groupNumber
                                      ? `ก.${occupant.groupNumber}`
                                      : occupant.studentName.split(' ')[0])}
                                </span>
                                {isBatchSelected ? (
                                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-md z-30 ring-1 ring-white">
                                    ✓
                                  </span>
                                ) : isDaily ? (
                                  dailyBadge && (
                                    <span
                                      className={`absolute -top-1 -right-1 px-1 py-0.2 rounded-full text-[7.5px] font-black shadow-xs ${
                                        dailyBadge.bg
                                      } ${dailyBadge.pulse ? 'animate-pulse ring-2 ring-white' : ''}`}
                                    >
                                      {dailyBadge.text}
                                    </span>
                                  )
                                ) : (
                                  isCheckedIn && (
                                    <span
                                      className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 text-white rounded-full border-1.5 border-white flex items-center justify-center text-[8px] font-black shadow-xs"
                                      title="เช็คอินเข้าที่นั่งแล้ว"
                                    >
                                      ✓
                                    </span>
                                  )
                                )}
                              </button>
                            );
                          }

                          if (designatedTheme) {
                            return (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={(e) => onSeatClick(seatCode, e, zone)}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${designatedTheme.designatedBgClass} ${designatedTheme.designatedBorderClass} ${designatedTheme.designatedTextClass} font-bold flex flex-col items-center justify-center transition cursor-pointer relative hover:scale-105 ${
                                  isBatchSelected
                                    ? 'ring-4 ring-amber-500 scale-105 z-20 shadow-md bg-amber-100/90 text-amber-950 font-black border-amber-500'
                                    : isSelected
                                    ? 'ring-3 ring-amber-500 scale-105 z-10'
                                    : ''
                                } ${isSearchMatched ? 'ring-4 ring-yellow-300 animate-bounce' : ''}`}
                                title={`[สงวนสิทธิ์สำหรับ: ${designatedTheme.label}] ${seatCode} (ว่าง) - คลิกเพื่อจัดนิสิตลงที่นั่ง`}
                              >
                                <span className="text-[10px] leading-none">{seatCode}</span>
                                <span className="text-[8px] opacity-90 truncate max-w-[34px]">
                                  {designatedTheme.shortLabel}
                                </span>
                                {isBatchSelected && (
                                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-md z-30 ring-1 ring-white">
                                    ✓
                                  </span>
                                )}
                              </button>
                            );
                          }

                          // Vacant seat without designation
                          return (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={(e) => onSeatClick(seatCode, e, zone)}
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white hover:bg-amber-50 text-slate-600 border border-slate-300 hover:border-amber-400 font-bold flex flex-col items-center justify-center transition cursor-pointer relative ${
                                isBatchSelected
                                  ? 'ring-4 ring-amber-500 scale-105 z-20 shadow-md bg-amber-100/90 text-amber-950 font-black border-amber-500'
                                  : isSelected
                                  ? 'ring-3 ring-amber-500 scale-105 z-10'
                                  : ''
                              } ${isSearchMatched ? 'ring-4 ring-yellow-300 animate-bounce' : ''}`}
                              title={`[ที่นั่งว่าง] ${seatCode} - คลิกเพื่อจัดนิสิตลงที่นั่งนี้`}
                            >
                              <span className="text-[10px] leading-none text-slate-500">{seatCode}</span>
                              <span className="text-[8px] text-slate-300">ว่าง</span>
                              {isBatchSelected && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-md z-30 ring-1 ring-white">
                                  ✓
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
