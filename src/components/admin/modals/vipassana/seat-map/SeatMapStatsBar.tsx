import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCheck,
  AlertOctagon,
  Users,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Palette,
} from 'lucide-react';
import { INSPECTION_PERIODS, type InspectionPeriodKey } from './types';

export interface SeatingStatsData {
  totalParticipants: number;
  totalCapacity: number;
  assignedCount: number;
  checkedInCount: number;
  vacantCount: number;
  disabledCount: number;
  unassignedCount: number;
  statusCounts: {
    MONK: number;
    BHIKKHUNI: number;
    SAMANERA: number;
    MAECHI: number;
    LAY_MALE: number;
    LAY_FEMALE: number;
    UNKNOWN?: number;
  };
}

export interface SeatingDailyStatsData {
  scannedTotal: number;
  presentInSeat: number;
  absentFromSeat: number;
  notScanned: number;
  unscannedPresent: number;
}

export interface SeatMapStatsBarProps {
  inspectionDay: number | 'ALL' | string;
  setInspectionDay: (day: number | 'ALL') => void;
  totalDays: number;
  inspectionPeriod: string;
  setInspectionPeriod: (period: InspectionPeriodKey) => void;
  onMarkAllScannedOccupied: () => void;
  isSavingInspection: boolean;
  dailyStats: SeatingDailyStatsData | null;
  onOpenAbsentReport: () => void;
  stats: SeatingStatsData;
  onDeduplicateRegistrations: () => void;
  isDeduplicating: boolean;
}

export const SeatMapStatsBar: React.FC<SeatMapStatsBarProps> = ({
  inspectionDay,
  setInspectionDay,
  totalDays,
  inspectionPeriod,
  setInspectionPeriod,
  onMarkAllScannedOccupied,
  isSavingInspection,
  dailyStats,
  onOpenAbsentReport,
  stats,
  onDeduplicateRegistrations,
  isDeduplicating,
}) => {
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);

  return (
    <>
      {/* Daily & Period Inspection Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-3 sm:px-4 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 border-b border-indigo-950 shrink-0">
        {/* Day selection on Mobile: Clean native dropdown with explicit high-contrast options */}
        <div className="flex md:hidden items-center gap-2 w-full">
          <span className="text-[11px] font-bold text-amber-300 shrink-0 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>ตรวจรายวัน:</span>
          </span>
          <div className="relative flex-1">
            <select
              value={inspectionDay}
              onChange={(e) => {
                const val = e.target.value;
                setInspectionDay(val === 'ALL' ? 'ALL' : Number(val));
              }}
              style={{ colorScheme: 'dark' }}
              className="w-full bg-slate-800 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-lg border border-indigo-400 focus:outline-none focus:ring-2 focus:ring-amber-400 appearance-none cursor-pointer pr-8 shadow-xs"
            >
              <option
                value="ALL"
                className="bg-slate-900 text-amber-300 font-bold py-2"
                style={{ backgroundColor: '#0f172a', color: '#fcd34d' }}
              >
                📋 ผังรวม (ตลอดโครงการ)
              </option>
              {Array.from({ length: totalDays }, (_, idx) => {
                const dNum = idx + 1;
                return (
                  <option
                    key={dNum}
                    value={dNum}
                    className="bg-slate-900 text-white font-semibold py-2"
                    style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                  >
                    📅 วันที่ {dNum}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-amber-300 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Day selection on Desktop: Horizontal Buttons Strip */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap">
          <span className="text-[11px] font-bold text-amber-300 shrink-0 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>ตรวจรายวัน:</span>
          </span>

          <button
            type="button"
            onClick={() => setInspectionDay('ALL')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
              inspectionDay === 'ALL'
                ? 'bg-amber-400 text-slate-950 shadow-xs ring-2 ring-amber-300'
                : 'bg-white/10 hover:bg-white/20 text-slate-300'
            }`}
          >
            ผังรวม (ตลอดโครงการ)
          </button>

          {Array.from({ length: totalDays }, (_, idx) => {
            const dNum = idx + 1;
            const isSelected = inspectionDay === dNum;
            return (
              <button
                key={dNum}
                type="button"
                onClick={() => setInspectionDay(dNum)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-500 text-white shadow-xs ring-2 ring-indigo-300'
                    : 'bg-white/10 hover:bg-white/20 text-slate-300'
                }`}
              >
                วัน {dNum}
              </button>
            );
          })}
        </div>

        {/* Period selection & quick batch inspection buttons */}
        {inspectionDay !== 'ALL' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-white/10">
            <span className="text-[11px] font-bold text-indigo-300 shrink-0 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-300" />
              <span>รอบ:</span>
            </span>

            {INSPECTION_PERIODS.map((period) => {
              const isSelected = inspectionPeriod === period.id;
              return (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => setInspectionPeriod(period.id as InspectionPeriodKey)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 shadow-xs ring-2 ring-emerald-300'
                      : 'bg-white/10 hover:bg-white/20 text-slate-300'
                  }`}
                  title={`${period.nameTh} (${period.time})`}
                >
                  <span>{period.icon}</span>
                  <span>{period.nameTh}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={onMarkAllScannedOccupied}
              disabled={isSavingInspection}
              className="ml-1 px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
              title="ตั้งค่าให้นิสิตทุกคนที่สแกนแล้ว อยู่ที่นั่งครบทั้งหมด แล้วท่านค่อยแตะเฉพาะคนที่ไม่อยู่"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ถือว่าสแกนแล้วอยู่ครบ</span>
              <span className="sm:hidden">อยู่ครบ</span>
            </button>

            {dailyStats && dailyStats.absentFromSeat > 0 && (
              <button
                type="button"
                onClick={onOpenAbsentReport}
                className="px-2.5 py-1 text-xs font-black bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer shrink-0 animate-bounce"
                title="คลิกดูรายชื่อนิสิตที่สแกนเข้าแต่ตรวจพบว่าที่นั่งว่าง"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>🚨 สแกนแต่ไม่อยู่ {dailyStats.absentFromSeat} คน</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats & Legend Pill Banner */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2 flex flex-col gap-2 shrink-0 text-xs">
        {/* Stats Section Header with Expand/Collapse Button (ภาพ 2 กรอบสีน้ำเงิน) */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIsStatsExpanded((prev) => !prev)}
            className="flex items-center gap-1.5 text-slate-800 hover:text-indigo-600 font-bold text-[11px] sm:text-xs cursor-pointer select-none text-left"
          >
            <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>สถิติที่นั่ง</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              ผู้เข้าร่วม: {stats.totalParticipants} • จัดแล้ว {stats.assignedCount}/{stats.totalCapacity}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsStatsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200 transition cursor-pointer shrink-0"
            title={isStatsExpanded ? 'คลิกเพื่อยุบแถบสถิติ' : 'คลิกเพื่อคลี่แสดงสถิติทั้งหมด'}
          >
            {isStatsExpanded ? (
              <>
                <span>ยุบสถิติ</span>
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>คลี่ออก</span>
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Stats Details (Collapsible) */}
        {isStatsExpanded && (
          <>
            {inspectionDay === 'ALL' ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap text-slate-600 text-[11px] sm:text-xs pt-0.5">
                <span className="flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    ผู้เข้าร่วม: <b className="text-slate-900">{stats.totalParticipants}</b> คน
                  </span>
                  <button
                    type="button"
                    onClick={onDeduplicateRegistrations}
                    disabled={isDeduplicating}
                    className="p-0.5 hover:text-amber-700 hover:bg-amber-100 rounded transition text-slate-400 cursor-pointer ml-0.5"
                    title="รีเซ็ต/ล้างรายชื่อที่ซ้ำซ้อนให้ตรงกับจำนวนจริง (309 คน)"
                  >
                    <RotateCcw
                      className={`w-3 h-3 ${isDeduplicating ? 'animate-spin text-amber-600' : ''}`}
                    />
                  </button>
                </span>
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  ความจุ: <b className="text-slate-900">{stats.totalCapacity}</b> ที่
                </span>
                <span className="flex items-center gap-1 bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md font-semibold border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  จัดแล้ว: <b>{stats.assignedCount}</b> ที่ (
                  {stats.totalParticipants > 0
                    ? Math.round((stats.assignedCount / stats.totalParticipants) * 100)
                    : 0}
                  %)
                </span>
                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  เข้าที่นั่ง: <b>{stats.checkedInCount}</b> คน
                </span>
                <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                  ว่าง: <b>{stats.vacantCount}</b> ที่
                </span>
                {stats.unassignedCount > 0 && (
                  <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-bold">
                    ⚠️ ยังไม่มีที่นั่ง: {stats.unassignedCount} คน
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap text-slate-600 text-[11px] sm:text-xs pt-0.5">
                <span className="flex items-center gap-1 font-extrabold text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  <span>{INSPECTION_PERIODS.find((p) => p.id === inspectionPeriod)?.icon}</span>
                  <span>
                    ตรวจวันที่ {inspectionDay} •{' '}
                    {INSPECTION_PERIODS.find((p) => p.id === inspectionPeriod)?.nameTh}
                  </span>
                </span>
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  มีที่นั่ง: <b className="text-slate-900">{stats.assignedCount}</b> ที่
                </span>
                <span className="flex items-center gap-1 bg-blue-50 text-blue-900 px-2 py-0.5 rounded-md font-bold border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  สแกนแล้ว: <b>{dailyStats?.scannedTotal || 0}</b> คน
                </span>
                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded-md font-bold border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  อยู่ที่นั่ง: <b>{dailyStats?.presentInSeat || 0}</b> คน
                </span>
                <span
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-black ${
                    (dailyStats?.absentFromSeat || 0) > 0
                      ? 'bg-rose-600 text-white border border-rose-300 animate-pulse shadow-xs cursor-pointer'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                  onClick={() => (dailyStats?.absentFromSeat || 0) > 0 && onOpenAbsentReport()}
                >
                  <span>🚨 สแกนแต่ที่นั่งว่าง: {dailyStats?.absentFromSeat || 0} คน</span>
                </span>
                <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                  ยังไม่สแกน: <b>{dailyStats?.notScanned || 0}</b> คน
                </span>
                {(dailyStats?.unscannedPresent || 0) > 0 && (
                  <span className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300 font-bold shrink-0">
                    ⚠️ อยู่ที่นั่งแต่ไม่สแกน: {dailyStats?.unscannedPresent} คน
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {/* Color Legend Section (ภาพ 2 กรอบสีแดง/ส้ม: รองรับมือถือไม่ล้นจอ + ปุ่มยุบ/คลี่ออก) */}
        <div className="w-full pt-1 border-t border-slate-200 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsLegendExpanded((prev) => !prev)}
              className="flex items-center gap-1.5 text-slate-800 hover:text-amber-700 font-bold text-[11px] sm:text-xs cursor-pointer select-none"
            >
              <Palette className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>สัญลักษณ์สีที่นั่ง</span>
            </button>
            <button
              type="button"
              onClick={() => setIsLegendExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 transition cursor-pointer shrink-0"
              title={isLegendExpanded ? 'คลิกเพื่อยุบแถบสัญลักษณ์สี' : 'คลิกเพื่อคลี่แสดงสัญลักษณ์สีทั้งหมด'}
            >
              {isLegendExpanded ? (
                <>
                  <span>ยุบสัญลักษณ์สี</span>
                  <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  <span>คลี่ออก</span>
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          </div>

          {/* Color Badges (Responsive Flex-Wrap so they never overflow mobile screen) */}
          {isLegendExpanded && (
            <div className="w-full flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px] sm:text-[11px]">
              {inspectionDay === 'ALL' ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black shadow-2xs whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-slate-950" />
                    <span>พระภิกษุ ({stats.statusCounts.MONK})</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-900 text-amber-100 font-extrabold shadow-2xs whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-amber-300" />
                    <span>ภิกษุณี/Inter ({stats.statusCounts.BHIKKHUNI})</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-600 text-white font-extrabold shadow-2xs whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>สามเณร ({stats.statusCounts.SAMANERA})</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-2xs whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>แม่ชี ({stats.statusCounts.MAECHI})</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 text-white font-extrabold shadow-2xs whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>ฆราวาสชาย ({stats.statusCounts.LAY_MALE})</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-700 text-white font-extrabold shadow-2xs whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>ฆราวาสหญิง ({stats.statusCounts.LAY_FEMALE})</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-300 font-medium whitespace-nowrap">
                    <span className="w-2 h-2 rounded-xs bg-slate-200 border border-slate-400" />
                    <span>ว่าง ({stats.vacantCount})</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 font-medium whitespace-nowrap">
                    <span>— ทางเดิน/เสา ({stats.disabledCount})</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 whitespace-nowrap">
                    <span>✓ เช็คอินแล้ว</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-bold whitespace-nowrap">
                    <span>🟢 นั่งอยู่ปกติ</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-600 text-white font-black animate-pulse whitespace-nowrap">
                    <span>🚨 สแกนแต่ที่นั่งว่าง (ไม่อยู่)</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-medium whitespace-nowrap">
                    <span>🔵 สแกนแล้วรอตรวจ</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-600 font-medium whitespace-nowrap opacity-60">
                    <span>⚪ ยังไม่สแกน (ขาด)</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-bold whitespace-nowrap">
                    <span>⚠️ นั่งอยู่แต่ไม่สแกน</span>
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
