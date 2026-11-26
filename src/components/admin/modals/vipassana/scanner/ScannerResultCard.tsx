import React from 'react';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  Clock,
} from 'lucide-react';
import type { ScannerFeedback } from './types';

export interface ScannerResultCardProps {
  kioskState: 'IDLE' | 'READY' | 'SAVING' | 'SUCCESS_COOLDOWN' | 'ERROR_COOLDOWN';
  lastFeedback: ScannerFeedback | null;
}

export const ScannerResultCard: React.FC<ScannerResultCardProps> = ({
  kioskState,
  lastFeedback,
}) => {
  return (
    <>
      {/* KIOSK LIVE READINESS & RESULT BANNER */}
      {kioskState === 'SAVING' ? (
        <div className="bg-blue-50 border-2 border-blue-400/90 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-xs animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-blue-700">กำลังประมวลผล • Processing</div>
            <div className="text-sm sm:text-base font-black text-blue-950">
              ⏳ กำลังบันทึกข้อมูล... • Saving...
            </div>
          </div>
        </div>
      ) : kioskState === 'SUCCESS_COOLDOWN' && lastFeedback ? (
        <div
          className={`border-2 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-md transition-all animate-in zoom-in-95 ${
            lastFeedback.isOverDuplicateLimit
              ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white border-orange-300'
              : lastFeedback.isDuplicate
              ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white border-amber-200'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border-emerald-300'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 font-black text-white text-xl shadow-xs">
              {lastFeedback.isOverDuplicateLimit ? '⚠️' : '✓'}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs font-black tracking-wide uppercase opacity-95 flex items-center gap-1.5 flex-wrap">
                <span>
                  {lastFeedback.isEnglish
                    ? lastFeedback.badgeTitleEn || lastFeedback.badgeTitle
                    : lastFeedback.badgeTitle}
                </span>
                {lastFeedback.isEnglish && (
                  <span className="bg-white/25 text-white text-[10px] font-black px-1.5 py-0.2 rounded">
                    INTER / EN
                  </span>
                )}
              </div>
              <div className="text-base sm:text-lg font-black truncate">
                {lastFeedback.student?.studentName || lastFeedback.message}
              </div>
              <div className="text-xs opacity-90 font-mono flex items-center gap-2 flex-wrap">
                <span>{lastFeedback.student?.studentCode}</span>
                {lastFeedback.student?.groupNumber && (
                  <span>
                    •{' '}
                    {lastFeedback.isEnglish
                      ? `Group ${lastFeedback.student.groupNumber}`
                      : `กลุ่ม ${lastFeedback.student.groupNumber}`}
                  </span>
                )}
                {lastFeedback.student?.seatNumber && (
                  <span>
                    •{' '}
                    {lastFeedback.isEnglish
                      ? `Seat ${lastFeedback.student.seatNumber}`
                      : `ที่นั่ง ${lastFeedback.student.seatNumber}`}
                  </span>
                )}
                {lastFeedback.time && (
                  <span>
                    •{' '}
                    {lastFeedback.isEnglish
                      ? `Time ${lastFeedback.time}`
                      : `เวลา ${lastFeedback.time} น.`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0 pl-2">
            <span className="text-[11px] font-mono font-extrabold bg-black/25 px-2.5 py-1 rounded-lg inline-block">
              {lastFeedback.time} {lastFeedback.isEnglish ? '' : 'น.'}
            </span>
            <div className="text-[10px] font-black mt-1 text-emerald-100 flex items-center justify-end gap-1">
              <span>{lastFeedback.isEnglish ? '👉 Next, please' : '👉 เชิญท่านต่อไป'}</span>
            </div>
          </div>
        </div>
      ) : kioskState === 'ERROR_COOLDOWN' ? (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-3 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 font-black">
            <X className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-rose-700">
              {lastFeedback?.isEnglish
                ? lastFeedback.badgeTitleEn || lastFeedback.message
                : lastFeedback?.badgeTitle || lastFeedback?.message || '✗ ไม่พบข้อมูลนิสิต'}
            </div>
            {lastFeedback?.subNote && (
              <div className="text-xs text-rose-700 font-semibold mt-0.5">
                {lastFeedback.isEnglish
                  ? lastFeedback.subNoteEn || lastFeedback.subNote
                  : lastFeedback.subNote}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* KIOSK READY STATE */
        <div className="bg-emerald-50 border-2 border-emerald-400/80 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2 shadow-xs transition-all">
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600"></span>
            </span>
            <div>
              <div className="text-emerald-950 font-black text-sm sm:text-base flex items-center gap-2">
                <span>🟢 พร้อมสแกนคนต่อไป</span>
                <span className="text-emerald-700 font-bold text-xs sm:text-sm">
                  • Ready for next
                </span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-200 text-emerald-900">
                  AUTO
                </span>
              </div>
              <p className="text-[11.5px] text-emerald-700 font-medium">
                นำ QR Code บนป้ายคล้องคอมาแสดงที่กล้อง (ระยะ 15-20 ซม.) • Hold badge to camera
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 hidden sm:block">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-800 shadow-2xs">
              เว้นระยะ 1.8 วิ/คน
            </span>
          </div>
        </div>
      )}

      {/* FULL LIVE FEEDBACK CARD */}
      {lastFeedback && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border-2 transition-all animate-in fade-in slide-in-from-top-2 duration-200 shadow-md ${
            lastFeedback.isOverDuplicateLimit
              ? 'bg-gradient-to-r from-orange-50 via-amber-50 to-white border-orange-400 text-orange-950'
              : lastFeedback.type === 'SUCCESS'
              ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-400 text-emerald-950'
              : lastFeedback.type === 'WARN'
              ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-white border-amber-400 text-amber-950'
              : 'bg-gradient-to-r from-rose-50 via-red-50 to-white border-rose-400 text-rose-950'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                lastFeedback.isOverDuplicateLimit
                  ? 'bg-orange-600 text-white'
                  : lastFeedback.type === 'SUCCESS'
                  ? 'bg-emerald-600 text-white'
                  : lastFeedback.type === 'WARN'
                  ? 'bg-amber-500 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {lastFeedback.isOverDuplicateLimit ? (
                <AlertTriangle className="w-7 h-7" />
              ) : lastFeedback.type === 'SUCCESS' ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : lastFeedback.type === 'WARN' ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <X className="w-7 h-7" />
              )}
            </div>

            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-2xs ${
                    lastFeedback.isOverDuplicateLimit
                      ? 'bg-orange-700 text-white'
                      : lastFeedback.type === 'SUCCESS'
                      ? 'bg-emerald-700 text-white'
                      : lastFeedback.type === 'WARN'
                      ? 'bg-amber-600 text-white'
                      : 'bg-rose-700 text-white'
                  }`}
                >
                  {lastFeedback.isEnglish
                    ? lastFeedback.badgeTitleEn || lastFeedback.badgeTitle
                    : lastFeedback.badgeTitle}
                </span>
                {lastFeedback.isEnglish && (
                  <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                    ENGLISH PROGRAM / INTER
                  </span>
                )}
                {lastFeedback.time && (
                  <span className="font-mono font-bold text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {lastFeedback.time} {lastFeedback.isEnglish ? '' : 'น.'}
                    </span>
                  </span>
                )}
              </div>

              <div className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                {lastFeedback.message}
              </div>

              {lastFeedback.student && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs pt-1 text-slate-700">
                  {lastFeedback.student.groupSpecificCode && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-800 text-white font-black font-mono shadow-xs">
                      {lastFeedback.student.groupSpecificCode}
                    </span>
                  )}
                  <span className="font-mono font-bold text-purple-950">
                    {lastFeedback.student.studentCode}
                  </span>
                  {lastFeedback.student.groupNumber && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold border border-purple-200">
                      กลุ่มที่ {lastFeedback.student.groupNumber}
                    </span>
                  )}
                  {lastFeedback.student.vasa && (
                    <span>
                      พรรษา: <strong>{lastFeedback.student.vasa}</strong>
                    </span>
                  )}
                  {lastFeedback.student.major && (
                    <span className="truncate max-w-[160px]">
                      สาขา: {lastFeedback.student.major}
                    </span>
                  )}
                </div>
              )}

              {lastFeedback.scannedCode && !lastFeedback.student && (
                <div className="text-xs text-rose-700 font-mono pt-0.5">
                  รหัสที่ตรวจจับได้: <strong>{lastFeedback.scannedCode}</strong>{' '}
                  (กรุณาตรวจสอบว่านิสิตได้ลงทะเบียนในโครงการนี้หรือไม่)
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
