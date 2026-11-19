'use client';

import React from 'react';
import { Clock, Pencil } from 'lucide-react';
import { MeditationPeriodConfig, PeriodStats } from './types';

interface VipassanaAttendanceStatsBarProps {
  p1Conf: MeditationPeriodConfig;
  p2Conf: MeditationPeriodConfig;
  p3Conf: MeditationPeriodConfig;
  p4Conf: MeditationPeriodConfig;
  stats: PeriodStats;
  isEditingPeriods: boolean;
  setIsEditingPeriods: React.Dispatch<React.SetStateAction<boolean>>;
  onMarkAllPeriodPresent: (period: 'p1' | 'p2' | 'p3' | 'p4') => void;
}

export const VipassanaAttendanceStatsBar: React.FC<VipassanaAttendanceStatsBarProps> = ({
  p1Conf,
  p2Conf,
  p3Conf,
  p4Conf,
  stats,
  isEditingPeriods,
  setIsEditingPeriods,
  onMarkAllPeriodPresent,
}) => {
  return (
    <>
      {/* Stat Summary Cards Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50 border border-purple-200 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
            <Clock className="w-4 h-4" />
          </span>
          <div>
            <div className="font-extrabold text-xs text-purple-950 flex items-center gap-1.5">
              <span>ช่วงเวลาปฏิบัติธรรม 4 รอบต่อวัน</span>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                กำหนดเวลา 4 ภาค
              </span>
            </div>
            <div className="text-[10.5px] text-purple-800 mt-0.5 font-medium">
              1. เช้ามืด ({p1Conf.time}) • 2. เช้า ({p2Conf.time}) • 3. บ่าย ({p3Conf.time}) • 4. ค่ำ ({p4Conf.time})
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsEditingPeriods((v) => !v)}
          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>{isEditingPeriods ? '✖ ปิดกล่องแก้ไข' : '⚙️ แก้ไขช่วงเวลา 4 รอบ'}</span>
        </button>
      </div>

      {/* Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
          <div className="text-[10px] text-slate-500">จำนวนนิสิตในกลุ่ม</div>
          <div className="text-base font-extrabold text-slate-900 font-mono">{stats.total} รูป/คน</div>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
          <div className="text-[10px] flex items-center justify-between gap-1 mb-1">
            <button
              type="button"
              onClick={() => setIsEditingPeriods(true)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-amber-300 text-amber-950 font-bold hover:bg-amber-100 cursor-pointer transition text-[10px]"
              title="คลิกเพื่อแก้ไขช่วงเวลาภาคเช้ามืด"
            >
              <Pencil className="w-2.5 h-2.5 text-amber-700" />
              <span>1. เช้ามืด ({p1Conf.time})</span>
            </button>
            <button
              type="button"
              onClick={() => onMarkAllPeriodPresent('p1')}
              className="text-[9px] text-amber-700 hover:underline cursor-pointer font-bold shrink-0"
            >
              [มาครบ]
            </button>
          </div>
          <div className="text-base font-extrabold font-mono">{stats.p1Present} / {stats.total}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900">
          <div className="text-[10px] flex items-center justify-between gap-1 mb-1">
            <button
              type="button"
              onClick={() => setIsEditingPeriods(true)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-blue-300 text-blue-950 font-bold hover:bg-blue-100 cursor-pointer transition text-[10px]"
              title="คลิกเพื่อแก้ไขช่วงเวลาภาคเช้า"
            >
              <Pencil className="w-2.5 h-2.5 text-blue-700" />
              <span>2. เช้า ({p2Conf.time})</span>
            </button>
            <button
              type="button"
              onClick={() => onMarkAllPeriodPresent('p2')}
              className="text-[9px] text-blue-700 hover:underline cursor-pointer font-bold shrink-0"
            >
              [มาครบ]
            </button>
          </div>
          <div className="text-base font-extrabold font-mono">{stats.p2Present} / {stats.total}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
          <div className="text-[10px] flex items-center justify-between gap-1 mb-1">
            <button
              type="button"
              onClick={() => setIsEditingPeriods(true)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-950 font-bold hover:bg-emerald-100 cursor-pointer transition text-[10px]"
              title="คลิกเพื่อแก้ไขช่วงเวลาภาคบ่าย"
            >
              <Pencil className="w-2.5 h-2.5 text-emerald-700" />
              <span>3. บ่าย ({p3Conf.time})</span>
            </button>
            <button
              type="button"
              onClick={() => onMarkAllPeriodPresent('p3')}
              className="text-[9px] text-emerald-700 hover:underline cursor-pointer font-bold shrink-0"
            >
              [มาครบ]
            </button>
          </div>
          <div className="text-base font-extrabold font-mono">{stats.p3Present} / {stats.total}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900">
          <div className="text-[10px] flex items-center justify-between gap-1 mb-1">
            <button
              type="button"
              onClick={() => setIsEditingPeriods(true)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-purple-300 text-purple-950 font-bold hover:bg-purple-100 cursor-pointer transition text-[10px]"
              title="คลิกเพื่อแก้ไขช่วงเวลาภาคค่ำ"
            >
              <Pencil className="w-2.5 h-2.5 text-purple-700" />
              <span>4. ค่ำ ({p4Conf.time})</span>
            </button>
            <button
              type="button"
              onClick={() => onMarkAllPeriodPresent('p4')}
              className="text-[9px] text-purple-700 hover:underline cursor-pointer font-bold shrink-0"
            >
              [มาครบ]
            </button>
          </div>
          <div className="text-base font-extrabold font-mono">{stats.p4Present} / {stats.total}</div>
        </div>
      </div>
    </>
  );
};
