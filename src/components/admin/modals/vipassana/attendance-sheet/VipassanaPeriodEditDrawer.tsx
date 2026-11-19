'use client';

import React from 'react';
import { Clock, X, Save } from 'lucide-react';
import { MeditationPeriodConfig, DEFAULT_PERIODS } from './types';

interface VipassanaPeriodEditDrawerProps {
  periodSettings: MeditationPeriodConfig[];
  setPeriodSettings: React.Dispatch<React.SetStateAction<MeditationPeriodConfig[]>>;
  isSavingPeriods: boolean;
  onSave: () => void;
  onClose: () => void;
}

export const VipassanaPeriodEditDrawer: React.FC<VipassanaPeriodEditDrawerProps> = ({
  periodSettings,
  setPeriodSettings,
  isSavingPeriods,
  onSave,
  onClose,
}) => {
  const periodCards: Array<{
    id: 'p1' | 'p2' | 'p3' | 'p4';
    label: string;
    borderClass: string;
    textClass: string;
    sampleTime: string;
  }> = [
    { id: 'p1', label: 'รอบที่ 1: เช้ามืด', borderClass: 'border-amber-200', textClass: 'text-amber-900', sampleTime: '04.00-04.30' },
    { id: 'p2', label: 'รอบที่ 2: เช้า', borderClass: 'border-blue-200', textClass: 'text-blue-900', sampleTime: '08.00-08.30' },
    { id: 'p3', label: 'รอบที่ 3: บ่าย', borderClass: 'border-emerald-200', textClass: 'text-emerald-900', sampleTime: '12.30-13.00' },
    { id: 'p4', label: 'รอบที่ 4: ค่ำ', borderClass: 'border-purple-200', textClass: 'text-purple-900', sampleTime: '17.30-18.00' },
  ];

  return (
    <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50 border-2 border-purple-300 p-4 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-700" />
          <h4 className="font-extrabold text-sm text-purple-950">
            แก้ไขช่วงเวลาปฏิบัติธรรม 4 รอบ (จะอัปเดตลงในการ์ด, หัวตาราง, และเอกสารพิมพ์ A4):
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPeriodSettings(DEFAULT_PERIODS)}
            className="text-xs text-purple-700 hover:underline cursor-pointer font-semibold"
          >
            [ใช้เวลามาตรฐานเดิม]
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {periodCards.map((card) => {
          const current = periodSettings.find((p) => p.id === card.id);
          return (
            <div key={card.id} className={`p-3 bg-white rounded-xl border ${card.borderClass} shadow-2xs space-y-1.5`}>
              <div className={`font-bold ${card.textClass} flex items-center justify-between`}>
                <span>{card.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">{card.id}</span>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">ชื่อรอบ:</label>
                <input
                  type="text"
                  value={current?.nameTh || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPeriodSettings((prev) =>
                      prev.map((p) => (p.id === card.id ? { ...p, nameTh: val } : p))
                    );
                  }}
                  className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">ช่วงเวลา (เช่น {card.sampleTime}):</label>
                <input
                  type="text"
                  value={current?.time || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPeriodSettings((prev) =>
                      prev.map((p) => (p.id === card.id ? { ...p, time: val } : p))
                    );
                  }}
                  className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer text-xs"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          disabled={isSavingPeriods}
          onClick={onSave}
          className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSavingPeriods ? 'กำลังบันทึก...' : 'บันทึกช่วงเวลาลงโครงการ'}</span>
        </button>
      </div>
    </div>
  );
};
