'use client';

import React from 'react';
import {
  Clock,
  UserCheck,
  Search,
  Check,
  Sparkles,
} from 'lucide-react';
import type { EventRegistration } from '@/types/event';
import type { PeriodKey, ScannerRecentItem } from './types';

interface ScannerSidePanelProps {
  rightPanelTab: 'SCANS' | 'CHECKLIST';
  setRightPanelTab: (tab: 'SCANS' | 'CHECKLIST') => void;
  recentScans: ScannerRecentItem[];
  onClearRecentScans: () => void;
  groupRegistrations: EventRegistration[];
  dayKey: string;
  selectedPeriod: PeriodKey;
  checklistSearch: string;
  setChecklistSearch: (val: string) => void;
  onOverrideStudentStatus: (code: string, status: 'PRESENT' | 'LATE' | 'SICK') => void;
  onProcessScanCode: (code: string) => void;
  isSubmitting: boolean;
}

export const ScannerSidePanel: React.FC<ScannerSidePanelProps> = ({
  rightPanelTab,
  setRightPanelTab,
  recentScans,
  onClearRecentScans,
  groupRegistrations,
  dayKey,
  selectedPeriod,
  checklistSearch,
  setChecklistSearch,
  onOverrideStudentStatus,
  onProcessScanCode,
  isSubmitting,
}) => {
  return (
    <div className="lg:col-span-5 flex flex-col space-y-3">
      {/* Right Column Header: Tabs */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl font-bold">
          <button
            type="button"
            onClick={() => setRightPanelTab('SCANS')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              rightPanelTab === 'SCANS'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>ประวัติสแกน ({recentScans.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setRightPanelTab('CHECKLIST')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              rightPanelTab === 'CHECKLIST'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>รายชื่อกลุ่ม ({groupRegistrations.length})</span>
          </button>
        </div>

        {rightPanelTab === 'SCANS' && recentScans.length > 0 && (
          <button
            type="button"
            onClick={onClearRecentScans}
            className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ล้างประวัติ
          </button>
        )}
      </div>

      {/* TAB 1: GROUP CHECKLIST VIEW (FOR พระพี่เลี้ยง) */}
      {rightPanelTab === 'CHECKLIST' ? (
        <div className="flex-1 flex flex-col space-y-2 min-h-0">
          {/* Search in group checklist */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={checklistSearch}
              onChange={(e) => setChecklistSearch(e.target.value)}
              placeholder="ค้นหารหัส หรือชื่อในกลุ่ม..."
              className="w-full pl-8 pr-3 py-1.5 bg-white rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Students list */}
          <div className="border border-slate-200 rounded-2xl flex-1 max-h-[440px] overflow-y-auto bg-slate-50/50 p-2 space-y-1.5 shadow-2xs">
            {groupRegistrations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                ไม่พบนิสิตในกลุ่มที่เลือก หรือไม่มีรายการลงทะเบียน
              </div>
            ) : (
              groupRegistrations.map((r) => {
                const att = (r.dailyAttendance as any)?.[dayKey]?.[selectedPeriod];
                const isChecked = att && (att.status === 'PRESENT' || att.status === 'LATE');
                return (
                  <div
                    key={r.id}
                    className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2 text-xs ${
                      isChecked
                        ? 'bg-emerald-50/80 border-emerald-200 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-purple-200 shadow-2xs'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {r.groupSpecificCode && (
                          <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-200">
                            {r.groupSpecificCode}
                          </span>
                        )}
                        <span className="font-extrabold text-slate-900 truncate">
                          {r.studentName}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                        <span>{r.studentCode}</span>
                        {r.vasa && <span>• พรรษา {r.vasa}</span>}
                        {r.groupNumber && <span>• กลุ่ม {r.groupNumber}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isChecked ? (
                        <div className="flex items-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-black shadow-xs ${
                              att.status === 'LATE'
                                ? 'bg-amber-500 text-white'
                                : att.status === 'SICK'
                                ? 'bg-blue-600 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>
                              {att.status === 'LATE' ? 'มาสาย' : att.status === 'SICK' ? 'ป่วย' : 'มา'}
                              {att.checkInTime ? ` (${att.checkInTime})` : ''}
                            </span>
                          </span>
                          <select
                            value={att.status || 'PRESENT'}
                            onChange={(e) =>
                              onOverrideStudentStatus(
                                r.studentCode,
                                e.target.value as 'PRESENT' | 'LATE' | 'SICK'
                              )
                            }
                            className="text-[10px] font-bold bg-white border border-slate-300 rounded px-1 py-0.5 text-slate-700 cursor-pointer focus:outline-none"
                            title="คลิกเพื่อเปลี่ยนสถานะ เช่น เปลี่ยนเป็นมา หรือ เปลี่ยนเป็นสาย"
                          >
                            <option value="PRESENT">ปกติ (มา)</option>
                            <option value="LATE">สาย</option>
                            <option value="SICK">ป่วย</option>
                          </select>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onProcessScanCode(r.studentCode)}
                          disabled={isSubmitting}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold cursor-pointer transition flex items-center gap-1 shadow-xs disabled:opacity-50"
                          title="คลิกเพื่อเช็คชื่อให้นิสิตรูปนี้ทันที"
                        >
                          <Check className="w-3 h-3" />
                          <span>เช็คชื่อด่วน</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* TAB 2: RECENT SCANS LOG */
        <div className="border border-slate-200 rounded-2xl flex-1 max-h-[460px] overflow-y-auto bg-slate-50/50 p-2 space-y-1.5 shadow-2xs">
          {recentScans.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              ยังไม่มีรายการสแกนในรอบนี้<br />
              <span className="text-[11px] opacity-75">พร้อมรับสัญญาณสแกนจากป้ายชื่อ...</span>
            </div>
          ) : (
            recentScans.map((scan) => (
              <div
                key={scan.id}
                className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="font-extrabold text-slate-900 truncate">
                    {scan.studentName}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <span className="font-bold text-purple-700">{scan.studentCode}</span>
                    {scan.groupNumber && (
                      <span className="bg-slate-100 text-slate-700 px-1 rounded font-sans">
                        กลุ่ม {scan.groupNumber}
                      </span>
                    )}
                    {scan.vasa && <span className="font-sans">พรรษา {scan.vasa}</span>}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {scan.isOverDuplicateLimit ? (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200">
                      ⚠️ สแกนซ้ำ ({scan.scanCount} ครั้ง)
                    </span>
                  ) : scan.isDuplicate ? (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                      ℹ️ ซ้ำรอบนี้
                    </span>
                  ) : (
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                        scan.status === 'PRESENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : scan.status === 'LATE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {scan.status === 'PRESENT' ? 'มา' : scan.status === 'LATE' ? 'สาย' : 'ป่วย'}
                    </span>
                  )}
                  <div className="text-[9.5px] font-mono text-slate-400 mt-0.5">
                    {scan.time} น.
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick tips */}
      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
        <div className="font-bold flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>คำแนะนำการใช้งานจุดสแกน:</span>
        </div>
        <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[10.5px]">
          <li>สำหรับโต๊ะหน้าศาลา: เสียบปืนสแกนบาร์โค้ด USB เข้าเครื่อง แล้วยิงป้ายชื่อได้ทันที</li>
          <li>สำหรับพระพี่เลี้ยง: เปิดหน้านี้บนมือถือ/แท็บเล็ต แล้วกดเปิดกล้องเพื่อสแกน QR นิสิตในกลุ่ม</li>
          <li>หากนิสิตมาสายเกิน 30 นาที สามารถสลับสถานะเป็น <strong>"สาย"</strong> ก่อนสแกนได้</li>
        </ul>
      </div>
    </div>
  );
};
