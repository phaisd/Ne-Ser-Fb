'use client';

import React, { useState } from 'react';
import { X, Layers, CheckSquare, CheckCircle2 } from 'lucide-react';
import type { EventSeatingConfig } from '@/types/event';
import { getSeatsInRectangle } from './seatGridUtils';

interface SeatMapRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EventSeatingConfig;
  activeZoneId?: string;
  onBatchDisable: (seats: string[]) => Promise<void>;
  onBatchEnable: (seats: string[]) => Promise<void>;
  onSelectRangeOnMap: (seats: string[]) => void;
}

export const SeatMapRangeModal: React.FC<SeatMapRangeModalProps> = ({
  isOpen,
  onClose,
  config,
  activeZoneId,
  onBatchDisable,
  onBatchEnable,
  onSelectRangeOnMap,
}) => {
  const [rangeStartSeat, setRangeStartSeat] = useState('');
  const [rangeEndSeat, setRangeEndSeat] = useState('');
  const [rangeZoneId, setRangeZoneId] = useState('');

  if (!isOpen) return null;

  const targetZone =
    config.zones.find((z) => z.id === (rangeZoneId || activeZoneId)) || config.zones[0];
  const seats =
    rangeStartSeat && rangeEndSeat && targetZone
      ? getSeatsInRectangle(rangeStartSeat, rangeEndSeat, targetZone)
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-700 to-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-300" />
            <h4 className="font-bold text-sm sm:text-base">เลือกกลุ่มที่นั่งเป็นช่วง (Range Selection)</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            ระบุรหัสที่นั่งเริ่มต้นและสิ้นสุด เช่น <b>D-03</b> ถึง <b>I-03</b> (แนวเสา/ทางเดิน) หรือ <b>D-10</b> ถึง <b>G-12</b> (กลุ่มสี่เหลี่ยม) ระบบจะคำนวณและเลือกทุกที่นั่งในกรอบให้อัตโนมัติ
          </p>

          {config.zones.length > 1 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">โซนที่ต้องการเลือก:</label>
              <select
                value={rangeZoneId || config.zones[0]?.id}
                onChange={(e) => setRangeZoneId(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold"
              >
                {config.zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.rows} แถว × {z.cols} คอลัมน์)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">จากที่นั่ง (Start):</label>
              <input
                type="text"
                placeholder="เช่น D-03 หรือ D-10"
                value={rangeStartSeat}
                onChange={(e) => setRangeStartSeat(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ถึงที่นั่ง (End):</label>
              <input
                type="text"
                placeholder="เช่น I-03 หรือ G-12"
                value={rangeEndSeat}
                onChange={(e) => setRangeEndSeat(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 uppercase"
              />
            </div>
          </div>

          {/* Range Preview */}
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center justify-between">
              <span>จำนวนที่นั่งที่ครอบคลุม:</span>
              <span className="px-2 py-0.5 bg-amber-200 text-amber-950 rounded-full font-black">
                {seats.length} ที่นั่ง
              </span>
            </div>
            {seats.length > 0 && (
              <p className="text-[11px] text-amber-800 line-clamp-2 font-mono">
                {seats.slice(0, 10).join(', ')}
                {seats.length > 10 ? ` และอีก ${seats.length - 10} ที่นั่ง` : ''}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (seats.length === 0) return;
                onBatchDisable(seats);
                onClose();
              }}
              disabled={!rangeStartSeat || !rangeEndSeat || seats.length === 0}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span className="font-mono text-sm leading-none">—</span>
              <span>แปลงเป็นทางเดิน/เสาทันที (—)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (seats.length === 0) return;
                  onSelectRangeOnMap(seats);
                  onClose();
                }}
                disabled={!rangeStartSeat || !rangeEndSeat || seats.length === 0}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>เลือกกลุ่มนี้บนผัง</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (seats.length === 0) return;
                  onBatchEnable(seats);
                  onClose();
                }}
                disabled={!rangeStartSeat || !rangeEndSeat || seats.length === 0}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>คืนค่าเป็นที่นั่ง</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
