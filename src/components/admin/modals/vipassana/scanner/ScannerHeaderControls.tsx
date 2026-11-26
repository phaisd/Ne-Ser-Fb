import React from 'react';
import {
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  X,
  RefreshCw,
  Users,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { StudentEvent, EventRegistration } from '@/types/event';
import { formatGroupDisplay } from '@/lib/events/groupImport';
import { PERIOD_CONFIG, type PeriodKey } from './types';

export interface ScannerHeaderControlsProps {
  event: StudentEvent;
  selectedPeriod: PeriodKey;
  setSelectedPeriod: (period: PeriodKey) => void;
  selectedDayNumber: number;
  setSelectedDayNumber: (day: number) => void;
  selectedGroup: number | 'ALL';
  setSelectedGroup: (group: number | 'ALL') => void;
  availableGroups: number[];
  registrations: EventRegistration[];
  stats: { checkedCount: number; total: number; percent: number };
  offlineQueueCount: number;
  syncOfflineQueue: () => void;
  isSyncingOffline: boolean;
  isScreenLocked: boolean;
  setIsScreenLocked: React.Dispatch<React.SetStateAction<boolean>>;
  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  isToolbarCollapsed: boolean;
  setIsToolbarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  showAdvancedControls: boolean;
  setShowAdvancedControls: React.Dispatch<React.SetStateAction<boolean>>;
  scannerOfficerName: string;
  setScannerOfficerName: (name: string) => void;
  evalMode: 'AUTO' | 'MANUAL';
  setEvalMode: (mode: 'AUTO' | 'MANUAL') => void;
  manualStatus: 'PRESENT' | 'LATE' | 'SICK';
  setManualStatus: (status: 'PRESENT' | 'LATE' | 'SICK') => void;
  showConfigDrawer: boolean;
  setShowConfigDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  lateThresholdMinutes: number;
  setLateThresholdMinutes: (mins: number) => void;
}

export const ScannerHeaderControls: React.FC<ScannerHeaderControlsProps> = ({
  event,
  selectedPeriod,
  setSelectedPeriod,
  selectedDayNumber,
  setSelectedDayNumber,
  selectedGroup,
  setSelectedGroup,
  availableGroups,
  registrations,
  stats,
  offlineQueueCount,
  syncOfflineQueue,
  isSyncingOffline,
  isScreenLocked,
  setIsScreenLocked,
  soundEnabled,
  setSoundEnabled,
  onClose,
  isToolbarCollapsed,
  setIsToolbarCollapsed,
  showAdvancedControls,
  setShowAdvancedControls,
  scannerOfficerName,
  setScannerOfficerName,
  evalMode,
  setEvalMode,
  manualStatus,
  setManualStatus,
  showConfigDrawer,
  setShowConfigDrawer,
  lateThresholdMinutes,
  setLateThresholdMinutes,
}) => {
  return (
    <>
      {/* HEADER (Compact on Mobile so Camera Scanner is immediately visible) */}
      <div className="px-3.5 py-2.5 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between gap-2 shrink-0">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
              <span>LIVE SCANNER</span>
            </span>
            {/* Online / Offline Sync Badge */}
            {offlineQueueCount === 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span>🟢 พร้อมใช้งาน</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={syncOfflineQueue}
                disabled={isSyncingOffline}
                className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1 shadow-sm transition cursor-pointer animate-pulse"
                title="คลิกเพื่อส่งข้อมูลที่บันทึกออฟไลน์ขึ้นเซิร์ฟเวอร์ทันที"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingOffline ? 'animate-spin' : ''}`} />
                <span>รอซิงค์ {offlineQueueCount}</span>
              </button>
            )}
            <span className="hidden md:inline text-xs text-purple-200 font-medium">
              จุดสแกนเช็คชื่ออัตโนมัติ (Barcode / QR / ป้ายคล้องคอ)
            </span>
          </div>
          <h3 className="font-extrabold text-sm sm:text-lg tracking-tight truncate">
            สแกนเช็คชื่อปฏิบัติธรรม 4 รอบ ({PERIOD_CONFIG[selectedPeriod].nameTh})
          </h3>
          <p className="hidden sm:block text-xs text-purple-200/80 line-clamp-1">
            {event.title}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Screen Lock Toggle */}
          <button
            type="button"
            onClick={() => setIsScreenLocked((v) => !v)}
            className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold border ${
              isScreenLocked
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                : 'bg-purple-800/80 text-purple-200 border-purple-700 hover:bg-purple-700'
            }`}
            title={
              isScreenLocked
                ? 'กำลังล็อกหน้าจอป้องกันมือไปโดนปุ่มออก (คลิกเพื่อปลดล็อกเมื่อต้องการออกจากหน้านี้)'
                : 'คลิกเพื่อล็อกหน้าจอป้องกันการเผลอกดออก'
            }
          >
            {isScreenLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{isScreenLocked ? 'ล็อกจออยู่' : 'ปลดล็อกแล้ว'}</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              soundEnabled
                ? 'bg-purple-800/80 text-purple-200 hover:bg-purple-700'
                : 'bg-rose-900/60 text-rose-300 hover:bg-rose-800 border border-rose-400/40'
            }`}
            title={soundEnabled ? 'ปิดเสียงแจ้งเตือน (ใช้ข้อความแจ้งบนจอและสั่นแทน)' : 'เปิดเสียงแจ้งเตือน'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-400" />
            )}
            <span className="hidden sm:inline">{soundEnabled ? 'เสียงเปิด' : 'โหมดเงียบ'}</span>
          </button>

          {!isScreenLocked && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="ปิดหน้าต่างสแกน"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* SETTINGS / PERIOD SELECTOR TOOLBAR */}
      <div className="px-3 sm:px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-col gap-1.5 text-xs shrink-0">
        {/* Primary Always-Visible Row: Group, Day, Progress, Options & Collapse/Expand */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Group Selector for พระพี่เลี้ยง / Group Advisors */}
            <div className="flex items-center gap-1 bg-purple-50/90 px-2 py-1 rounded-xl border border-purple-200 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span className="font-extrabold text-purple-950">กลุ่ม:</span>
              <select
                value={selectedGroup}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10);
                  setSelectedGroup(val);
                }}
                className="bg-transparent font-bold text-purple-950 text-xs focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">ทุกกลุ่ม (All Groups)</option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>
                    {formatGroupDisplay(
                      g,
                      registrations,
                      event.meditationConfig?.groupAssignments?.[String(g)]?.groupName
                    )}
                  </option>
                ))}
              </select>
            </div>

            {/* Day Selector */}
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-300 shadow-2xs">
              <span className="font-bold text-slate-700">วันที่:</span>
              <select
                value={selectedDayNumber}
                onChange={(e) => setSelectedDayNumber(parseInt(e.target.value, 10))}
                className="bg-transparent font-bold text-amber-950 focus:outline-hidden cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    วันที่ {d} ({10 + d} ธ.ค.)
                  </option>
                ))}
              </select>
            </div>

            <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 font-mono font-bold text-[11px]">
              {stats.checkedCount}/{stats.total} ({stats.percent}%)
            </span>
          </div>

          {/* Right Controls: Options & Collapse/Expand */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (isToolbarCollapsed) {
                  setIsToolbarCollapsed(false);
                  setShowAdvancedControls(true);
                } else {
                  setShowAdvancedControls((v) => !v);
                }
              }}
              className={`px-2 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                showAdvancedControls && !isToolbarCollapsed
                  ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                  : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
              title="แสดง/ซ่อนช่องปืนสแกน USB, ชื่อผู้สแกน และเกณฑ์เวลาสาย"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>ตัวเลือก</span>
            </button>

            <button
              type="button"
              onClick={() => setIsToolbarCollapsed((v) => !v)}
              className="px-2 py-1 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold text-[11px] flex items-center gap-0.5 transition cursor-pointer shadow-2xs"
              title={isToolbarCollapsed ? 'คลี่แถบรอบเวลาออก' : 'หุบแถบเครื่องมือเพื่อขยายพื้นที่กล้องสแกน'}
            >
              {isToolbarCollapsed ? (
                <>
                  <span>คลี่ออก</span>
                  <ChevronDown className="w-3.5 h-3.5 text-purple-700" />
                </>
              ) : (
                <>
                  <span>หุบเข้า</span>
                  <ChevronUp className="w-3.5 h-3.5 text-purple-700" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Row: 4-Period Switcher */}
        {!isToolbarCollapsed && (
          <div className="grid grid-cols-4 sm:flex sm:items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
            {(Object.keys(PERIOD_CONFIG) as PeriodKey[]).map((pkey) => {
              const conf = PERIOD_CONFIG[pkey];
              const isSelected = selectedPeriod === pkey;
              return (
                <button
                  key={pkey}
                  type="button"
                  onClick={() => setSelectedPeriod(pkey)}
                  className={`px-1.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 truncate ${
                    isSelected
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className="truncate">{conf.nameTh}</span>
                  <span className="text-[10px] font-mono opacity-80 hidden md:inline">
                    ({conf.timeRange})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Advanced Controls */}
        {!isToolbarCollapsed && showAdvancedControls && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200 animate-in fade-in duration-150">
            {/* Scanner Officer Name */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-300 shadow-2xs">
              <span className="font-semibold text-slate-600 text-[11px] whitespace-nowrap">
                ผู้สแกน:
              </span>
              <input
                type="text"
                placeholder="ระบุชื่ออาจารย์/จนท..."
                value={scannerOfficerName}
                onChange={(e) => {
                  const val = e.target.value;
                  setScannerOfficerName(val);
                  try {
                    localStorage.setItem('vipassana_scanner_officer_name', val);
                  } catch {}
                }}
                className="w-36 text-xs font-bold text-slate-800 outline-hidden"
              />
            </div>

            {/* Evaluation Mode Switcher (AUTO vs MANUAL) */}
            <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setEvalMode('AUTO')}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  evalMode === 'AUTO'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="คำนวณ 'ทันเวลา' หรือ 'สาย' อัตโนมัติตามเวลาระบบ"
              >
                อัตโนมัติ (ตามเวลา)
              </button>
              <button
                type="button"
                onClick={() => setEvalMode('MANUAL')}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  evalMode === 'MANUAL'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="ผู้สแกนเลือกสถานะเอง เช่น กรณีต้องการบันทึกเป็นลาป่วย/ขาด"
              >
                กำหนดเอง
              </button>
            </div>

            {/* Manual Status Buttons */}
            {evalMode === 'MANUAL' && (
              <div className="flex items-center gap-1">
                {(['PRESENT', 'LATE', 'SICK'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setManualStatus(st)}
                    className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                      manualStatus === st
                        ? st === 'PRESENT'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : st === 'LATE'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white border-slate-300 text-slate-600'
                    }`}
                  >
                    {st === 'PRESENT' ? 'มาทัน' : st === 'LATE' ? 'มาสาย' : 'ลา/ป่วย'}
                  </button>
                ))}
              </div>
            )}

            {/* Policy Drawer Trigger */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowConfigDrawer((v) => !v)}
                className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  showConfigDrawer
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-2xs font-extrabold'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
                title="ตั้งค่าเกณฑ์เวลาเริ่มต้น-สิ้นสุด และเวลาสายของแต่ละรอบ"
              >
                <span>{showConfigDrawer ? 'ซ่อนตั้งเวลา' : '⚙️ เวลาเริ่มรอบ'}</span>
              </button>

              <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-white px-2 py-1 rounded-xl border border-slate-200">
                <span>เกณฑ์สาย:</span>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={lateThresholdMinutes}
                  onChange={(e) => setLateThresholdMinutes(parseInt(e.target.value, 10) || 0)}
                  className="w-10 text-center font-bold text-slate-800 bg-slate-100 rounded px-1 outline-hidden"
                />
                <span>นาที</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
