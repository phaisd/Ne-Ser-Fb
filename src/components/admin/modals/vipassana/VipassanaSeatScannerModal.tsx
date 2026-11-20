'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  RotateCw,
  Search,
  Users,
  MapPin,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import type { StudentEvent, EventRegistration } from '@/types/event';
import { playBeep } from '@/lib/utils/audio-feedback';
import jsQR from 'jsqr';

interface VipassanaSeatScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  registrations: EventRegistration[];
  onCheckinSuccess: () => void;
}

export const VipassanaSeatScannerModal: React.FC<VipassanaSeatScannerModalProps> = ({
  isOpen,
  onClose,
  event,
  registrations,
  onCheckinSuccess,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Last Scanned Result to display prominently
  const [scannedResult, setScannedResult] = useState<{
    registration: EventRegistration;
    isAlreadyCheckedIn: boolean;
    timestamp: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastScannedCodeRef = useRef<string>('');
  const lastScanTimestampRef = useRef<number>(0);

  // Fast lookup by studentCode or groupSpecificCode or id
  const registrationLookup = useMemo(() => {
    const map = new Map<string, EventRegistration>();
    registrations.forEach((r) => {
      if (r.studentCode) map.set(r.studentCode.trim().toLowerCase(), r);
      if (r.groupSpecificCode) map.set(r.groupSpecificCode.trim().toLowerCase(), r);
      if (r.id) map.set(r.id.trim().toLowerCase(), r);
    });
    return map;
  }, [registrations]);

  // Scanned counter in this session
  const [sessionScannedCount, setSessionScannedCount] = useState<number>(0);

  // Total seated in this event
  const totalSeated = useMemo(() => {
    return registrations.filter((r) => Boolean(r.seatNumber && r.seatCheckinAt)).length;
  }, [registrations]);

  const handleProcessCode = async (rawCode: string) => {
    const clean = rawCode.trim();
    if (!clean || isProcessing) return;

    // Throttle identical scans within 3 seconds
    const now = Date.now();
    if (clean === lastScannedCodeRef.current && now - lastScanTimestampRef.current < 3000) {
      return;
    }

    lastScannedCodeRef.current = clean;
    lastScanTimestampRef.current = now;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'seat_scan_checkin',
          eventId: event.id,
          studentCodeOrId: clean,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        if (soundEnabled) playBeep('ERROR');
        setErrorMessage(data.error || 'ไม่พบข้อมูลผู้เข้าร่วมในโครงการนี้');
        setScannedResult(null);
      } else {
        if (soundEnabled) {
          playBeep(data.isAlreadyCheckedIn ? 'WARN' : 'SUCCESS');
        }
        setScannedResult({
          registration: data.registration,
          isAlreadyCheckedIn: data.isAlreadyCheckedIn,
          timestamp: new Date().toLocaleTimeString('th-TH'),
        });
        setSessionScannedCount((prev) => prev + 1);
        onCheckinSuccess();
      }
    } catch (err: any) {
      if (soundEnabled) playBeep('ERROR');
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsProcessing(false);
      setManualInput('');
    }
  };

  // Camera Stream Hook
  useEffect(() => {
    if (!isOpen || !isCameraActive) return;
    let stream: MediaStream | null = null;
    let animFrame: number;

    const startCamera = async () => {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: cameraFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err: any) {
        setCameraError(err.message || 'ไม่สามารถเปิดกล้องได้');
      }
    };

    startCamera();

    // Loop for scanning QR frames
    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code && code.data) {
            handleProcessCode(code.data);
          }
        }
      }
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrame);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, isCameraActive, cameraFacing]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
              <Camera className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>จุดสแกนตรวจเช็คผู้เข้าที่นั่ง</span>
                <span className="text-[10px] bg-emerald-400 text-slate-900 font-black px-2 py-0.5 rounded-full">
                  LIVE SCANNER
                </span>
              </h3>
              <p className="text-xs text-emerald-200/80 truncate max-w-xs sm:max-w-md">
                {event.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              type="button"
              onClick={() => setCameraFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="สลับกล้องหน้า/หลัง"
            >
              <RotateCw className="w-4 h-4 text-emerald-300" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Counter Bar */}
        <div className="bg-slate-900 text-slate-300 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3">
            <span>
              สแกนรอบนี้: <b className="text-emerald-400">{sessionScannedCount}</b> คน
            </span>
            <span>•</span>
            <span>
              เข้าที่นั่งรวมทั้งโครงการ: <b className="text-white">{totalSeated}</b> / {registrations.length} คน
            </span>
          </div>
          <span className="text-[11px] text-amber-400 font-medium">
            รองรับป้าย QR คล้องคอ & ปืนยิงบาร์โค้ด
          </span>
        </div>

        {/* Camera View Area */}
        <div className="relative bg-black flex items-center justify-center min-h-[220px] max-h-[300px] overflow-hidden shrink-0">
          {cameraError ? (
            <div className="text-center p-6 text-slate-400 space-y-2">
              <CameraOff className="w-10 h-10 mx-auto text-rose-500" />
              <p className="text-xs text-rose-400 font-bold">{cameraError}</p>
              <p className="text-[11px]">สามารถพิมพ์รหัสนิสิตหรือยิงปืนบาร์โค้ดที่ช่องด้านล่างแทนได้</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover max-h-[300px]"
              />
              {/* Overlay Target Box */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-emerald-400/80 rounded-2xl relative shadow-2xl">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-300 -mt-1 -ml-1 rounded-tl" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-300 -mt-1 -mr-1 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-300 -mb-1 -ml-1 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-300 -mb-1 -mr-1 rounded-br" />
                  <div className="absolute inset-x-2 top-1/2 h-0.5 bg-emerald-400/60 shadow-lg animate-pulse" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Manual Barcode / Student Code Input */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ยิงปืนบาร์โค้ด หรือพิมพ์รหัสนิสิต (เช่น 6601201001 หรือ T101)..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleProcessCode(manualInput);
                }
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
          <button
            type="button"
            onClick={() => handleProcessCode(manualInput)}
            disabled={!manualInput.trim() || isProcessing}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition cursor-pointer disabled:opacity-50"
          >
            ค้นหา/เช็ค
          </button>
        </div>

        {/* Result Feedback Display Area */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 animate-in fade-in">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
              <div>
                <div className="font-extrabold text-sm">ไม่พบข้อมูล</div>
                <div className="text-xs">{errorMessage}</div>
              </div>
            </div>
          )}

          {scannedResult ? (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-emerald-500 shadow-md space-y-4 animate-in zoom-in-95">
              {/* Top Status */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                    scannedResult.isAlreadyCheckedIn
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {scannedResult.isAlreadyCheckedIn ? 'เช็คชื่อซ้ำ (เข้าที่นั่งแล้ว)' : 'เช็คชื่อเข้าที่นั่งสำเร็จ!'}
                </span>
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {scannedResult.timestamp} น.
                </span>
              </div>

              {/* Huge Bold Seat Banner */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-xl shadow-inner text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1">
                  หมายเลขที่นั่งของคุณ (YOUR SEAT)
                </div>
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
                  {scannedResult.registration.seatNumber || 'ยังไม่กำหนด'}
                </div>
                <div className="text-sm font-bold text-emerald-100 mt-1">
                  {scannedResult.registration.seatZone || 'โซนมาตรฐาน'}
                </div>
              </div>

              {/* Participant Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-slate-500 text-[11px]">ชื่อ - ฉายา / สกุล:</div>
                  <div className="font-extrabold text-slate-900 text-sm">
                    {scannedResult.registration.studentName}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-slate-500 text-[11px]">รหัสนิสิต / เลขประจำตัว:</div>
                  <div className="font-extrabold text-slate-900 font-mono text-sm">
                    {scannedResult.registration.studentCode}
                    {scannedResult.registration.groupSpecificCode && (
                      <span className="text-xs text-amber-700 font-bold ml-1">
                        ({scannedResult.registration.groupSpecificCode})
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-slate-500 text-[11px]">กลุ่มปฏิบัติธรรม:</div>
                  <div className="font-bold text-slate-800">
                    {scannedResult.registration.groupName || `กลุ่มที่ ${scannedResult.registration.groupNumber || '-'}`}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-slate-500 text-[11px]">สาขาวิชา / ภาควิชา:</div>
                  <div className="font-medium text-slate-800 truncate">
                    {scannedResult.registration.major || 'คณะพุทธศาสตร์'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Users className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-bold text-sm text-slate-600">พร้อมสแกนป้ายชื่อนิสิต</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                ส่องกล้องไปที่ QR Code บนป้ายคล้องคอของนิสิต ระบบจะแสดงหมายเลขที่นั่งและบันทึกเวลาเข้าที่ทันที
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
