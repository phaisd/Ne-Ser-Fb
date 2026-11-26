import React from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { ScannerFeedback } from './types';

export interface ScannerCameraViewProps {
  isCameraActive: boolean;
  setIsCameraActive: React.Dispatch<React.SetStateAction<boolean>>;
  cameraFacing: 'environment' | 'user';
  setCameraFacing: React.Dispatch<React.SetStateAction<'environment' | 'user'>>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  kioskState: 'IDLE' | 'READY' | 'SAVING' | 'SUCCESS_COOLDOWN' | 'ERROR_COOLDOWN';
  lastFeedback: ScannerFeedback | null;
  setLastFeedback: React.Dispatch<React.SetStateAction<ScannerFeedback | null>>;
  cameraError: string | null;
}

export const ScannerCameraView: React.FC<ScannerCameraViewProps> = ({
  isCameraActive,
  setIsCameraActive,
  cameraFacing,
  setCameraFacing,
  videoRef,
  kioskState,
  lastFeedback,
  setLastFeedback,
  cameraError,
}) => {
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 text-white shadow-sm">
      <div className="px-3 sm:px-4 py-2 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold truncate">
          <Camera className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="truncate">กล้องสแกน QR ป้ายคล้องคอ</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isCameraActive && (
            <button
              type="button"
              onClick={() =>
                setCameraFacing((f) => (f === 'environment' ? 'user' : 'environment'))
              }
              className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-[11px] font-semibold cursor-pointer transition whitespace-nowrap"
            >
              สลับ ({cameraFacing === 'environment' ? 'หลัง' : 'หน้า'})
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCameraActive((v) => !v)}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1 whitespace-nowrap ${
              isCameraActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isCameraActive ? (
              <>
                <CameraOff className="w-3.5 h-3.5" />
                <span>ปิดกล้อง</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>เปิดกล้องสแกน</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Camera Preview Area */}
      <div className="relative min-h-[210px] sm:min-h-[240px] max-h-[320px] flex items-center justify-center bg-black/60 overflow-hidden">
        {/* HUD: SAVING IN PROGRESS */}
        {kioskState === 'SAVING' && (
          <div className="absolute top-2 left-2 right-2 z-30 p-2.5 sm:p-3 rounded-2xl shadow-2xl border bg-indigo-950/90 text-white border-indigo-400 backdrop-blur-md flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-black shadow-md">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold text-indigo-300">กำลังประมวลผล QR Code</div>
              <div className="text-sm sm:text-base font-black text-white">
                ⏳ กำลังบันทึกข้อมูล...
              </div>
            </div>
          </div>
        )}

        {/* HUD: SUCCESS / DUPLICATE / ERROR VISUAL NOTIFICATION */}
        {lastFeedback && kioskState !== 'SAVING' && (
          <div
            className={`absolute top-2 left-2 right-2 z-30 p-2.5 sm:p-3 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-3 flex items-center gap-2.5 sm:gap-3 ${
              lastFeedback.isOverDuplicateLimit
                ? 'bg-orange-600/95 text-white border-orange-300 shadow-orange-950/50'
                : lastFeedback.type === 'SUCCESS'
                ? 'bg-emerald-600/95 text-white border-emerald-300 shadow-emerald-950/50'
                : lastFeedback.type === 'WARN'
                ? 'bg-amber-500/95 text-white border-amber-200 shadow-amber-950/50'
                : 'bg-rose-600/95 text-white border-rose-300 shadow-rose-950/50'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black shadow-md ${
                lastFeedback.isOverDuplicateLimit
                  ? 'bg-white text-orange-700'
                  : lastFeedback.type === 'SUCCESS'
                  ? 'bg-white text-emerald-700'
                  : lastFeedback.type === 'WARN'
                  ? 'bg-white text-amber-600'
                  : 'bg-white text-rose-700 animate-bounce'
              }`}
            >
              {lastFeedback.isOverDuplicateLimit ? (
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              ) : lastFeedback.type === 'SUCCESS' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : lastFeedback.type === 'WARN' ? (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              ) : (
                <X className="w-6 h-6 text-rose-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black tracking-wide uppercase shadow-2xs ${
                    lastFeedback.isOverDuplicateLimit
                      ? 'bg-orange-950/60 text-orange-100'
                      : lastFeedback.type === 'SUCCESS'
                      ? 'bg-emerald-900/60 text-emerald-100'
                      : lastFeedback.type === 'WARN'
                      ? 'bg-amber-900/60 text-amber-100'
                      : 'bg-rose-900/60 text-rose-100'
                  }`}
                >
                  {lastFeedback.isEnglish
                    ? lastFeedback.badgeTitleEn || lastFeedback.badgeTitle
                    : lastFeedback.badgeTitle}
                </span>
                {lastFeedback.isEnglish && (
                  <span className="bg-indigo-900/60 text-indigo-100 text-[10px] font-black px-1.5 py-0.2 rounded">
                    INTER / EN
                  </span>
                )}
                {lastFeedback.time && (
                  <span className="font-mono text-[10.5px] text-white/90">
                    {lastFeedback.time} {lastFeedback.isEnglish ? '' : 'น.'}
                  </span>
                )}
              </div>

              <div className="font-black text-sm sm:text-base text-white leading-tight truncate mt-0.5">
                {lastFeedback.student?.studentName || lastFeedback.message}
              </div>

              {lastFeedback.student ? (
                <div className="flex items-center gap-2 text-xs text-white/90 font-mono flex-wrap pt-0.5">
                  {lastFeedback.student.groupSpecificCode && (
                    <span className="bg-white/25 px-1.5 py-0.2 rounded font-black text-white">
                      {lastFeedback.student.groupSpecificCode}
                    </span>
                  )}
                  <span>{lastFeedback.student.studentCode}</span>
                  {lastFeedback.student.groupNumber && (
                    <span className="font-sans font-semibold">
                      กลุ่ม {lastFeedback.student.groupNumber}
                    </span>
                  )}
                  {lastFeedback.student.seatNumber && (
                    <span className="font-sans font-semibold bg-white/20 px-1 rounded">
                      ที่นั่ง {lastFeedback.student.seatNumber}
                    </span>
                  )}
                  {lastFeedback.student.vasa && (
                    <span className="font-sans text-[11px]">
                      ({lastFeedback.student.vasa} พรรษา)
                    </span>
                  )}
                </div>
              ) : lastFeedback.scannedCode ? (
                <div className="text-[11px] text-white/85 font-mono pt-0.5">
                  รหัสที่สแกน: <strong>{lastFeedback.scannedCode}</strong> (ไม่มีในทะเบียนโครงการ)
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setLastFeedback(null)}
              className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition cursor-pointer self-start"
              title="ปิดการแจ้งเตือน"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isCameraActive ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-emerald-400/80 rounded-2xl relative shadow-2xl">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400" />
                <div className="w-full h-0.5 bg-emerald-400/60 absolute top-1/2 -translate-y-1/2 animate-pulse" />
              </div>
            </div>

            {/* READY STATUS BADGE INSIDE RETICLE FOOTER */}
            {kioskState === 'READY' && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-emerald-500/70 text-emerald-300 text-xs font-black flex items-center gap-2 shadow-xl whitespace-nowrap animate-in fade-in">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>🟢 พร้อมสแกนคนต่อไป • Next, please</span>
              </div>
            )}
          </>
        ) : (
          <div className="p-5 sm:p-8 text-center space-y-2.5 text-slate-300">
            <button
              type="button"
              onClick={() => setIsCameraActive(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>แตะเพื่อเปิดกล้องสแกน QR ป้ายคล้องคอ</span>
            </button>
            <p className="text-[11px] text-slate-400">
              หรือใช้ปืนสแกนบาร์โค้ด USB / พิมพ์รหัสนิสิตด้านล่าง
            </p>
            {cameraError && (
              <p className="text-xs text-rose-400 font-semibold">{cameraError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
