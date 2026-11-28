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

interface ZoneSections {
  hasAisle: boolean;
  aisleColIdx: number;
  section1Cols: number[];
  section2Cols: number[];
  section1Label: string;
  section2Label: string;
  section1ShortLabel: string;
  section2ShortLabel: string;
}

/**
 * Calculates left section (I) and right section (II) for a zone,
 * detecting any central aisle column or splitting down the middle.
 */
function getZoneColumnSections(zone: SeatZone, disabledSet: Set<string>): ZoneSections {
  let aisleColIdx = -1;
  for (let c = 1; c < zone.cols - 1; c++) {
    let disabledCount = 0;
    for (let r = 0; r < zone.rows; r++) {
      const code = formatSeatCode(zone, r, c).toUpperCase();
      if (disabledSet.has(code)) disabledCount++;
    }
    if (disabledCount >= zone.rows * 0.7) {
      aisleColIdx = c;
      break;
    }
  }

  if (aisleColIdx !== -1) {
    const s1 = Array.from({ length: aisleColIdx }, (_, i) => i);
    const s2 = Array.from({ length: zone.cols - aisleColIdx - 1 }, (_, i) => aisleColIdx + 1 + i);
    const s1End = aisleColIdx;
    const s2Start = aisleColIdx + 2;
    return {
      hasAisle: true,
      aisleColIdx,
      section1Cols: s1,
      section2Cols: s2,
      section1Label: `คอลัมน์ 01 - ${s1End < 10 ? `0${s1End}` : s1End}`,
      section2Label: `คอลัมน์ ${s2Start < 10 ? `0${s2Start}` : s2Start} - ${zone.cols < 10 ? `0${zone.cols}` : zone.cols}`,
      section1ShortLabel: 'ฝั่ง I',
      section2ShortLabel: 'ฝั่ง II',
    };
  }

  if (zone.cols > 8) {
    const mid = Math.floor(zone.cols / 2);
    const s1 = Array.from({ length: mid }, (_, i) => i);
    const s2 = Array.from({ length: zone.cols - mid }, (_, i) => mid + i);
    return {
      hasAisle: false,
      aisleColIdx: -1,
      section1Cols: s1,
      section2Cols: s2,
      section1Label: `คอลัมน์ 01 - ${mid < 10 ? `0${mid}` : mid}`,
      section2Label: `คอลัมน์ ${mid + 1 < 10 ? `0${mid + 1}` : mid + 1} - ${zone.cols < 10 ? `0${zone.cols}` : zone.cols}`,
      section1ShortLabel: 'ฝั่ง I',
      section2ShortLabel: 'ฝั่ง II',
    };
  }

  return {
    hasAisle: false,
    aisleColIdx: -1,
    section1Cols: Array.from({ length: zone.cols }, (_, i) => i),
    section2Cols: [],
    section1Label: 'ผังทั้งหมด',
    section2Label: '',
    section1ShortLabel: 'ผังรวม',
    section2ShortLabel: '',
  };
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
  // Mobile/Desktop view mode:
  // 'SPLIT' = 2 cards stacked (Card I & Card II) for easy mobile viewing without horizontal overflow
  // 'FULL' = 1 unified wide grid (with Roman numeral I & II banners above)
  // 'SEC1' = show only Section I
  // 'SEC2' = show only Section II
  const [viewMode, setViewMode] = React.useState<'SPLIT' | 'FULL' | 'SEC1' | 'SEC2'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'SPLIT' : 'FULL';
    }
    return 'SPLIT';
  });

  const handleRowHeaderClick = (zone: SeatZone, rIdx: number, cols: number[]) => {
    if (isBatchMode) {
      const rowSeats: string[] = [];
      for (const c of cols) {
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
      setSelectedSeat(formatSeatCode(zone, rIdx, cols[0] ?? 0));
    }
  };

  const handleColHeaderClick = (zone: SeatZone, cIdx: number) => {
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
  };

  const renderSeat = (zone: SeatZone, rIdx: number, cIdx: number) => {
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
            occupant.groupSpecificCode?.toLowerCase().includes(searchQuery.toLowerCase()))));

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
  };

  /**
   * Renders a table card slice with column headers and rows for specified columns
   */
  const renderGridCard = (
    zone: SeatZone,
    colsToRender: number[],
    titleBadge?: string,
    subtitle?: string
  ) => {
    return (
      <div className="w-full flex flex-col items-center">
        {titleBadge && (
          <div className="w-full py-1 px-3 mb-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 font-black text-xs flex items-center justify-between shadow-2xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span>{titleBadge}</span>
            </span>
            {subtitle && (
              <span className="text-[10px] text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-300">
                {subtitle}
              </span>
            )}
          </div>
        )}

        {/* Column Headers */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-7 text-center text-[10px] font-bold text-slate-400">แถว</div>
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${colsToRender.length}, minmax(36px, 1fr))` }}
          >
            {colsToRender.map((cIdx) => (
              <button
                key={cIdx}
                type="button"
                onClick={() => handleColHeaderClick(zone, cIdx)}
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

        {/* Rows */}
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: zone.rows }, (_, rIdx) => {
            const rowChar = String.fromCharCode(65 + rIdx);
            return (
              <div key={rIdx} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRowHeaderClick(zone, rIdx, colsToRender)}
                  className={`w-7 text-center text-xs font-black py-1 rounded cursor-pointer transition ${
                    isBatchMode
                      ? 'text-amber-950 bg-amber-100 hover:bg-amber-200 ring-1 ring-amber-300'
                      : 'text-slate-600 hover:text-amber-900 bg-slate-100 hover:bg-amber-100'
                  }`}
                  title={
                    isBatchMode
                      ? `คลิกแถว ${rowChar} เพื่อเลือกที่นั่งในส่วนนี้`
                      : `แถว ${rowChar} - คลิกเพื่อจัดการกำหนดสถานะแถวนี้`
                  }
                >
                  {rowChar}
                </button>
                <div
                  className="grid gap-1.5"
                  style={{ gridTemplateColumns: `repeat(${colsToRender.length}, minmax(36px, 1fr))` }}
                >
                  {colsToRender.map((cIdx) => renderSeat(zone, rIdx, cIdx))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto p-2 sm:p-6 items-center">
      {/* Front Stage Graphic */}
      <div className="w-full max-w-3xl mb-2 sm:mb-4 flex flex-col items-center shrink-0">
        <div className="w-full py-1.5 sm:py-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-900 rounded-lg sm:rounded-xl shadow-md text-center font-black tracking-wider text-[11px] sm:text-sm border border-amber-400 flex items-center justify-center gap-1.5 sm:gap-2">
          <span>🏛️ ด้านหน้าหอประชุม / แท่นบรรยาย / พระวิปัสสนาจารย์ (STAGE FRONT)</span>
        </div>
        <div className="w-20 sm:w-32 h-1 bg-amber-400/50 rounded-full mt-1" />
      </div>

      {/* Batch Mode Notice Banner */}
      {isBatchMode && (
        <div className="w-full max-w-3xl mb-3 py-2 px-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 flex flex-wrap items-center justify-between gap-2 text-xs font-medium shrink-0 animate-in fade-in duration-150 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <b>โหมดเลือกกลุ่มเปิดอยู่:</b> คลิกที่นั่งเพื่อเลือก หรือกด <b>Shift + คลิก</b> เพื่อเลือกกรอบสี่เหลี่ยม / สามารถคลิกหัวแถวหรือหัวคอลัมน์เพื่อเลือกทั้งแถว
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

      {/* Responsive View Mode Switcher Pills (เหมาะสำหรับมือถือ) */}
      <div className="w-full max-w-3xl mb-3 flex flex-wrap items-center justify-between gap-1.5 bg-slate-100 p-1.5 sm:p-2 rounded-xl border border-slate-200 text-xs shrink-0">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <span>📱 มุมมองผัง:</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setViewMode('SPLIT')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
              viewMode === 'SPLIT'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200 border-slate-300'
            }`}
            title="แยกแสดงเป็น 2 การ์ด (ฝั่ง I และ ฝั่ง II) เพื่อดูพอดีกับหน้าจอมือถือ ไม่ต้องเลื่อนซ้ายขวา"
          >
            📑 แยก 2 การ์ด (I & II)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('FULL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
              viewMode === 'FULL'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200 border-slate-300'
            }`}
            title="แสดงผังรวมเต็มทุกคอลัมน์พร้อมป้ายกำกับฝั่ง I / II"
          >
            🏛️ ผังรวม (เต็ม)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('SEC1')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
              viewMode === 'SEC1'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200 border-slate-300'
            }`}
          >
            👈 เฉพาะฝั่ง I
          </button>
          <button
            type="button"
            onClick={() => setViewMode('SEC2')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
              viewMode === 'SEC2'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200 border-slate-300'
            }`}
          >
            👉 เฉพาะฝั่ง II
          </button>
        </div>
      </div>

      {/* Zones Grid Container */}
      <div
        className="flex flex-col gap-6 transition-transform duration-150 origin-top w-full items-center"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        {filteredZones.map((zone) => {
          const zoneColor = ZONE_COLORS[zone.color] || ZONE_COLORS.amber;
          const sections = getZoneColumnSections(zone, disabledSet);
          const canSplit = sections.hasAisle || sections.section2Cols.length > 0;
          const activeView = canSplit ? viewMode : 'FULL';

          return (
            <div
              key={zone.id}
              className="bg-white rounded-2xl p-3 sm:p-6 shadow-sm border border-slate-200 flex flex-col items-center w-full max-w-4xl"
            >
              {/* Zone Header (Clean, Responsive, No Multi-line Overlap) */}
              <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2.5 mb-3 border-b border-slate-100 gap-2">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full ${zoneColor.bg} shrink-0`} />
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-800">
                    {zone.name}
                  </h4>
                  <span className="text-[11px] sm:text-xs text-slate-600 font-bold bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    {zone.rows} แถว × {zone.cols} คอลัมน์ ({zone.rows * zone.cols} ที่นั่ง)
                  </span>
                </div>
                {zone.description && zone.description !== zone.name && (
                  <span className="text-[11px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md self-start sm:self-auto border border-slate-100">
                    {zone.description}
                  </span>
                )}
              </div>

              {/* Grid Views */}
              {activeView === 'SPLIT' && canSplit ? (
                <div className="w-full flex flex-col gap-5 items-center">
                  {/* Card 1: Section I */}
                  <div className="w-full max-w-xl p-2.5 sm:p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs flex flex-col items-center overflow-x-auto">
                    {renderGridCard(
                      zone,
                      sections.section1Cols,
                      `🏛️ ${zone.name} • ฝั่ง I (${sections.section1Label})`,
                      `${sections.section1Cols.length} คอลัมน์`
                    )}
                  </div>

                  {/* Card 2: Section II */}
                  <div className="w-full max-w-xl p-2.5 sm:p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs flex flex-col items-center overflow-x-auto">
                    {renderGridCard(
                      zone,
                      sections.section2Cols,
                      `🏛️ ${zone.name} • ฝั่ง II (${sections.section2Label})`,
                      `${sections.section2Cols.length} คอลัมน์`
                    )}
                  </div>
                </div>
              ) : activeView === 'SEC1' && canSplit ? (
                <div className="w-full max-w-xl p-2.5 sm:p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs flex flex-col items-center overflow-x-auto">
                  {renderGridCard(
                    zone,
                    sections.section1Cols,
                    `🏛️ ${zone.name} • ฝั่ง I (${sections.section1Label})`,
                    `${sections.section1Cols.length} คอลัมน์`
                  )}
                </div>
              ) : activeView === 'SEC2' && canSplit ? (
                <div className="w-full max-w-xl p-2.5 sm:p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs flex flex-col items-center overflow-x-auto">
                  {renderGridCard(
                    zone,
                    sections.section2Cols,
                    `🏛️ ${zone.name} • ฝั่ง II (${sections.section2Label})`,
                    `${sections.section2Cols.length} คอลัมน์`
                  )}
                </div>
              ) : (
                /* Full Unified Grid with Roman numeral I, Aisle, II Banners directly above columns */
                <div className="w-full overflow-x-auto flex flex-col items-center pb-2">
                  {canSplit && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-7 shrink-0" />
                      <div
                        className="grid gap-1.5 text-center font-black text-[11px]"
                        style={{ gridTemplateColumns: `repeat(${zone.cols}, minmax(36px, 1fr))` }}
                      >
                        <div
                          style={{ gridColumn: `span ${sections.section1Cols.length}` }}
                          className="bg-amber-100 text-amber-900 border border-amber-300 rounded py-0.5 shadow-2xs"
                        >
                          🏛️ ฝั่ง I ({sections.section1Label})
                        </div>
                        {sections.hasAisle && (
                          <div className="bg-slate-200 text-slate-600 rounded py-0.5 text-[10px] flex items-center justify-center font-bold">
                            ทางเดิน
                          </div>
                        )}
                        {sections.section2Cols.length > 0 && (
                          <div
                            style={{ gridColumn: `span ${sections.section2Cols.length}` }}
                            className="bg-indigo-100 text-indigo-900 border border-indigo-300 rounded py-0.5 shadow-2xs"
                          >
                            🏛️ ฝั่ง II ({sections.section2Label})
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {renderGridCard(
                    zone,
                    Array.from({ length: zone.cols }, (_, i) => i)
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
