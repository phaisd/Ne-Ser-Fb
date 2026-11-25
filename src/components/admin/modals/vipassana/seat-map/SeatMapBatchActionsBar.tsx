'use client';

import React from 'react';
import { CheckSquare, CheckCircle2, X } from 'lucide-react';
import type { ParticipantStatusCategory } from '@/services/events/seatingUtils';

interface SeatMapBatchActionsBarProps {
  selectedSeats: Set<string>;
  onClearSelection: () => void;
  onBatchDisable: (seats: string[]) => Promise<void>;
  onBatchEnable: (seats: string[]) => Promise<void>;
  onBatchDesignateStatus: (seats: string[], status: ParticipantStatusCategory | null) => Promise<void>;
  isSaving: boolean;
}

export const SeatMapBatchActionsBar: React.FC<SeatMapBatchActionsBarProps> = ({
  selectedSeats,
  onClearSelection,
  onBatchDisable,
  onBatchEnable,
  onBatchDesignateStatus,
  isSaving,
}) => {
  if (selectedSeats.size === 0) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center justify-center gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-[96vw]">
      <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 pr-2 border-r border-slate-700 whitespace-nowrap">
        <CheckSquare className="w-4 h-4 text-amber-400" />
        <span>เลือก {selectedSeats.size} ที่นั่ง</span>
      </div>

      {/* Action: ทำเป็นทางเดิน/เสา */}
      <button
        type="button"
        onClick={() => onBatchDisable(Array.from(selectedSeats))}
        disabled={isSaving}
        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs border border-slate-600 whitespace-nowrap disabled:opacity-50"
        title="แปลงที่นั่งที่เลือกทั้งหมดให้เป็นทางเดินหรือเสา (—)"
      >
        <span className="text-slate-400 font-mono font-black text-sm leading-none">—</span>
        <span>ทำเป็นทางเดิน/เสา</span>
      </button>

      {/* Action: คืนค่าเป็นที่นั่งปกติ */}
      <button
        type="button"
        onClick={() => onBatchEnable(Array.from(selectedSeats))}
        disabled={isSaving}
        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap disabled:opacity-50"
        title="คืนค่าที่นั่งที่เลือกให้กลับมาเป็นที่นั่งปกติ"
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
        <span>คืนค่าเป็นที่นั่งปกติ</span>
      </button>

      {/* Action: กำหนดสัญลักษณ์กลุ่ม */}
      <select
        onChange={(e) => {
          const val = e.target.value;
          if (val) {
            onBatchDesignateStatus(
              Array.from(selectedSeats),
              val === 'CLEAR' ? null : (val as ParticipantStatusCategory)
            );
            e.target.value = '';
          }
        }}
        defaultValue=""
        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-xl text-xs font-medium cursor-pointer focus:outline-hidden whitespace-nowrap"
      >
        <option value="" disabled>
          กำหนดกลุ่มผู้ปฏิบัติ...
        </option>
        <option value="MONK">🟠 พระภิกษุ</option>
        <option value="BHIKKHUNI">🟤 ภิกษุณี / Inter</option>
        <option value="SAMANERA">🔴 สามเณร</option>
        <option value="MAECHI">🟡 แม่ชี</option>
        <option value="LAY_MALE">🔵 ฆราวาสชาย</option>
        <option value="LAY_FEMALE">🟢 ฆราวาสหญิง</option>
        <option value="CLEAR">⚪ ล้างสัญลักษณ์กลุ่ม</option>
      </select>

      {/* Action: ยกเลิกการเลือก */}
      <button
        type="button"
        onClick={onClearSelection}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
        title="ยกเลิกการเลือกทั้งหมด"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
