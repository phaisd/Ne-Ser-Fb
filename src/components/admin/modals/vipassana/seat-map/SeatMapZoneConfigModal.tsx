'use client';

import React from 'react';
import { X, Settings, Plus, Trash2, Save } from 'lucide-react';
import type { EventSeatingConfig, SeatZone } from '@/types/event';
import { ZONE_COLORS } from './types';

interface SeatMapZoneConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EventSeatingConfig;
  setConfig: React.Dispatch<React.SetStateAction<EventSeatingConfig>>;
  onSave: (config: EventSeatingConfig) => Promise<void>;
  isSaving: boolean;
  onAddZone: () => void;
  onRemoveZone: (zoneId: string) => void;
  onUpdateZone: (zoneId: string, updates: Partial<SeatZone>) => void;
}

export const SeatMapZoneConfigModal: React.FC<SeatMapZoneConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  setConfig,
  onSave,
  isSaving,
  onAddZone,
  onRemoveZone,
  onUpdateZone,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 w-full sm:w-96 h-full bg-white shadow-2xl border-l border-slate-200 z-30 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-400" />
          <span>ตั้งค่าผังและขนาดโซนที่นั่ง</span>
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
        {/* Venue Info */}
        <div className="space-y-2">
          <label className="font-bold text-slate-700 block">สถานที่จัดงาน / อาคาร:</label>
          <input
            type="text"
            value={config.venueName || ''}
            onChange={(e) => setConfig({ ...config, venueName: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            placeholder="เช่น อาคาร มวก. 48 พรรษา"
          />
          <label className="font-bold text-slate-700 block">ห้อง / หอประชุม:</label>
          <input
            type="text"
            value={config.roomName || ''}
            onChange={(e) => setConfig({ ...config, roomName: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            placeholder="เช่น หอประชุมใหญ่ ชั้น 3"
          />
        </div>

        {/* Zones List */}
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">รายการโซน ({config.zones.length}):</span>
            <button
              type="button"
              onClick={onAddZone}
              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>เพิ่มโซน</span>
            </button>
          </div>

          {config.zones.map((zone, zIdx) => (
            <div key={zone.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">โซนที่ {zIdx + 1}</span>
                {config.zones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveZone(zone.id)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                    title="ลบโซนนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-medium">ชื่อโซน:</label>
                <input
                  type="text"
                  value={zone.name}
                  onChange={(e) => onUpdateZone(zone.id, { name: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-600">แถว (Rows):</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={zone.rows}
                    onChange={(e) => onUpdateZone(zone.id, { rows: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600">คอลัมน์ (Cols):</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={zone.cols}
                    onChange={(e) => onUpdateZone(zone.id, { cols: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-bold">รหัสนำ (Prefix):</label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="เว้นว่างได้"
                    value={zone.prefix || ''}
                    onChange={(e) => onUpdateZone(zone.id, { prefix: e.target.value.toUpperCase() })}
                    className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs uppercase placeholder:text-slate-400 placeholder:normal-case"
                    title="สามารถเว้นว่างได้เพื่อให้แสดงเป็น A-01, B-01 หรือใส่ 0 เพื่อให้เป็น 0A-01"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-600">สีโซน:</span>
                {Object.keys(ZONE_COLORS).map((cKey) => (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => onUpdateZone(zone.id, { color: cKey })}
                    className={`w-5 h-5 rounded-full ${ZONE_COLORS[cKey].bg} ${
                      zone.color === cKey ? 'ring-2 ring-slate-800 scale-110' : 'opacity-70'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition"
        >
          ปิด
        </button>
        <button
          type="button"
          onClick={() => onSave(config)}
          disabled={isSaving}
          className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>บันทึกการตั้งค่าผัง</span>
        </button>
      </div>
    </div>
  );
};
