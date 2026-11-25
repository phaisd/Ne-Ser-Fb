'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { PERIOD_CONFIG, type PeriodKey } from './types';

interface ScannerPolicyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPeriod: PeriodKey;
  periodPolicies: Record<PeriodKey, { startTime: string; endTime: string }>;
  setPeriodPolicies: React.Dispatch<
    React.SetStateAction<Record<PeriodKey, { startTime: string; endTime: string }>>
  >;
}

export const ScannerPolicyDrawer: React.FC<ScannerPolicyDrawerProps> = ({
  isOpen,
  onClose,
  selectedPeriod,
  periodPolicies,
  setPeriodPolicies,
}) => {
  if (!isOpen) return null;

  return (
    <div className="bg-purple-50/70 border-b border-purple-200 p-3 text-xs animate-in slide-in-from-top-2 duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-purple-700" />
          <span className="font-extrabold text-purple-950">
            ปรับเวลาเริ่ม-สิ้นสุดของรอบ {PERIOD_CONFIG[selectedPeriod].nameTh}:
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1 font-semibold text-slate-700">
            <span>เวลาเริ่มรอบ:</span>
            <input
              type="time"
              value={periodPolicies[selectedPeriod]?.startTime || '04:00'}
              onChange={(e) =>
                setPeriodPolicies((prev) => ({
                  ...prev,
                  [selectedPeriod]: { ...prev[selectedPeriod], startTime: e.target.value },
                }))
              }
              className="px-2 py-1 bg-white rounded border border-purple-300 font-mono font-bold text-slate-900"
            />
          </label>
          <label className="flex items-center gap-1 font-semibold text-slate-700">
            <span>เวลาสิ้นสุดรอบ:</span>
            <input
              type="time"
              value={periodPolicies[selectedPeriod]?.endTime || '04:30'}
              onChange={(e) =>
                setPeriodPolicies((prev) => ({
                  ...prev,
                  [selectedPeriod]: { ...prev[selectedPeriod], endTime: e.target.value },
                }))
              }
              className="px-2 py-1 bg-white rounded border border-purple-300 font-mono font-bold text-slate-900"
            />
          </label>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition cursor-pointer"
          >
            เรียบร้อย
          </button>
        </div>
      </div>
    </div>
  );
};
