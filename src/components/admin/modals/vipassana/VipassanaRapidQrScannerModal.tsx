'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  Camera,
  CameraOff,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Volume2,
  VolumeX,
  Search,
  Check,
  RefreshCw,
  User,
  ArrowRight,
  Flame,
  Layers,
  ChevronRight,
  FileCheck2,
} from 'lucide-react';
import type { StudentEvent, EventRegistration, SatipatthanaChecklist } from '@/types/event';
import type { EditableInterviewRow } from './VipassanaInterviewCardView';
import jsQR from 'jsqr';

interface BarcodeDetectorInstance {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
}

interface VipassanaRapidQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  registrations: EventRegistration[];
  rows: Record<string, EditableInterviewRow>;
  selectedSession: number;
  sessionDate: string;
  meditationMaster: string;
  onInterviewSaved: (regId: string, updatedRow: EditableInterviewRow) => void;
  onSelectStudentInMainView?: (regId: string) => void;
}

const COMMON_ADVICE_TAGS = [
  'กำหนดรู้ทุกขเวทนาได้ดี สติเกาะติดอารมณ์',
  'มีสมาธิตั้งมั่น จิตสงบผ่องใส',
  'มีความง่วง (ถีนมิทธะ) ปรับลมหายใจและเดินจงกรมถี่ขึ้น',
  'มีความฟุ้งซ่าน (อุทธัจจะ) ให้ดูพองยุบให้ละเอียด',
  'เวทนาทางกายรุนแรง ให้สังเกตไตรลักษณ์ (ไม่เที่ยง)',
  'สติในอิริยาบถย่อยดีขึ้น มีความสำรวมระวัง',
  'ให้เพิ่มเวลาเดินจงกรมก่อนนั่งสมาธิ',
];

function playBeep(type: 'SUCCESS' | 'WARN' | 'ERROR') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'SUCCESS') {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'WARN') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {}
}

export const VipassanaRapidQrScannerModal: React.FC<VipassanaRapidQrScannerModalProps> = ({
  isOpen,
  onClose,
  event,
  registrations,
  rows,
  selectedSession,
  sessionDate,
  meditationMaster,
  onInterviewSaved,
  onSelectStudentInMainView,
}) => {
  // Scanner state
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'SUCCESS' | 'WARN' | 'ERROR' } | null>(null);

  // Active Scanned Student Row for Instant Evaluation
  const [activeRegId, setActiveRegId] = useState<string | null>(null);
  const [activeDraft, setActiveDraft] = useState<EditableInterviewRow | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastScannedCodeRef = useRef<string>('');
  const lastScanTimestampRef = useRef<number>(0);

  // Index registrations for fast lookup by studentCode or groupSpecificCode or id
  const registrationLookup = useMemo(() => {
    const map = new Map<string, EventRegistration>();
    registrations.forEach((r) => {
      if (r.studentCode) map.set(r.studentCode.trim().toLowerCase(), r);
      if (r.groupSpecificCode) map.set(r.groupSpecificCode.trim().toLowerCase(), r);
      if (r.id) map.set(r.id.trim().toLowerCase(), r);
    });
    return map;
  }, [registrations]);

  // When activeRegId changes, initialize draft from parent rows or fallback
  useEffect(() => {
    if (!activeRegId) {
      setActiveDraft(null);
      return;
    }
    const existing = rows[activeRegId];
    if (existing) {
      setActiveDraft({ ...existing });
    } else {
      const reg = registrations.find((r) => r.id === activeRegId);
      if (reg) {
        setActiveDraft({
          regId: reg.id,
          studentCode: reg.studentCode,
          groupSpecificCode: reg.groupSpecificCode,
          studentName: reg.studentName,
          vasa: reg.vasa,
          groupNumber: reg.groupNumber,
          major: reg.major,
          yearLevel: reg.yearLevel,
          programType: reg.programType,
          checklist: {},
          result: 'PENDING',
          remarks: '',
        });
      }
    }
  }, [activeRegId, rows, registrations]);

  // Process a Scanned String
  const processScanCode = useCallback(
    (rawCode: string) => {
      const clean = String(rawCode || '').trim();
      if (!clean) return;

      const now = Date.now();
      // Debounce: ignore same code within 2.5 seconds
      if (clean === lastScannedCodeRef.current && now - lastScanTimestampRef.current < 2500) {
        return;
      }

      lastScannedCodeRef.current = clean;
      lastScanTimestampRef.current = now;

      const target = registrationLookup.get(clean.toLowerCase());
      if (target) {
        if (soundEnabled) playBeep('SUCCESS');
        setActiveRegId(target.id);
        setScanMessage({
          text: `พบข้อมูล: ${target.studentName} (${target.groupSpecificCode || target.studentCode})`,
          type: 'SUCCESS',
        });
      } else {
        if (soundEnabled) playBeep('WARN');
        setScanMessage({
          text: `ไม่พบข้อมูลนิสิตจากรหัส: ${clean}`,
          type: 'WARN',
        });
      }
      setTimeout(() => setScanMessage(null), 3500);
    },
    [registrationLookup, soundEnabled]
  );

  // Camera stream lifecycle
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isCancelled = false;

    if (isOpen && isCameraActive) {
      setCameraError(null);
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            facingMode: cameraFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        .then((s) => {
          if (isCancelled) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          console.error('Camera access error:', err);
          setCameraError('ไม่สามารถเข้าถึงกล้องได้: ' + (err.message || 'โปรดตรวจสอบสิทธิ์กล้องในเบราว์เซอร์'));
          setIsCameraActive(false);
        });
    }

    return () => {
      isCancelled = true;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, isCameraActive, cameraFacing]);

  // QR Scanning Loop
  useEffect(() => {
    if (!isCameraActive || !isOpen) return;

    let animId: number;
    let detector: BarcodeDetectorInstance | null = null;

    if ('BarcodeDetector' in window) {
      try {
        const DetectorCtor = (
          window as unknown as {
            BarcodeDetector: new (opts: { formats: string[] }) => BarcodeDetectorInstance;
          }
        ).BarcodeDetector;
        detector = new DetectorCtor({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13'],
        });
      } catch {}
    }

    const checkFrame = async () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        try {
          if (detector) {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              processScanCode(barcodes[0].rawValue);
            }
          } else {
            if (!canvasRef.current) {
              canvasRef.current = document.createElement('canvas');
            }
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              const targetWidth = Math.min(video.videoWidth, 640);
              const targetHeight = Math.round((targetWidth / video.videoWidth) * video.videoHeight);
              canvas.width = targetWidth;
              canvas.height = targetHeight;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: 'dontInvert',
                });
                if (code && code.data) {
                  processScanCode(code.data);
                }
              }
            }
          }
        } catch {}
      }
      animId = requestAnimationFrame(checkFrame);
    };

    animId = requestAnimationFrame(checkFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isCameraActive, isOpen, processScanCode]);

  // Toggle checklist item
  const toggleCheck = (field: keyof SatipatthanaChecklist) => {
    if (!activeDraft) return;
    setActiveDraft({
      ...activeDraft,
      checklist: {
        ...activeDraft.checklist,
        [field]: !activeDraft.checklist[field],
      },
    });
  };

  // Quick Pass (1-click pass all main kayanupassana postures)
  const handleQuickPass = () => {
    if (!activeDraft) return;
    setActiveDraft({
      ...activeDraft,
      result: 'PASS',
      checklist: {
        ...activeDraft.checklist,
        standing: true,
        walking: true,
        sitting: true,
        lying: true,
      },
    });
  };

  // Save Interview & Scan Next
  const handleSaveAndScanNext = async () => {
    if (!activeDraft || !activeRegId) return;

    setIsSavingDraft(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_vipassana_interview',
          eventId: event.id,
          sessionNumber: selectedSession,
          sessionDate,
          meditationMasterName: meditationMaster,
          entries: [
            {
              registrationId: activeDraft.regId,
              checklist: activeDraft.checklist,
              result: activeDraft.result,
              remarks: activeDraft.remarks,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'บันทึกข้อมูลไม่สำเร็จ');
      }

      onInterviewSaved(activeRegId, activeDraft);
      if (soundEnabled) playBeep('SUCCESS');

      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2000);

      // Reset active student and immediately prepare for next scan
      setActiveRegId(null);
      setActiveDraft(null);
      lastScannedCodeRef.current = '';
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSavingDraft(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 text-white rounded-3xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-700 via-orange-800 to-amber-950 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Camera className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-amber-50 tracking-tight">
                  สแกน QR สอบอารมณ์ด่วน (Vipassana Rapid QR Interview)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-amber-950">
                  รอบที่ {selectedSession}
                </span>
              </div>
              <p className="text-xs text-amber-200/90 truncate max-w-md">
                {event.title} • พระวิปัสสนาจารย์: {meditationMaster || 'คณะทำงานพระวิปัสสนาจารย์'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition cursor-pointer ${
                soundEnabled ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'
              }`}
              title={soundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white/90 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
          {/* Left Column: Camera Viewfinder & Manual Input (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="relative aspect-4/3 sm:aspect-square bg-slate-950 rounded-2xl border-2 border-slate-700 overflow-hidden shadow-inner flex items-center justify-center">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder Target Box with pulsing scan line */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
                    <div className="w-56 h-56 border-2 border-amber-400/80 rounded-3xl relative shadow-[0_0_30px_rgba(245,158,11,0.25)] flex items-center justify-center">
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse" />
                      <div className="text-[11px] font-bold text-amber-200/90 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-xs">
                        เล็ง QR Code บนป้ายคล้องคอ
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 text-slate-400 space-y-2">
                  <CameraOff className="w-12 h-12 mx-auto text-slate-600" />
                  <div className="font-bold text-slate-300">กล้องถูกปิดอยู่</div>
                  <button
                    type="button"
                    onClick={() => setIsCameraActive(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold cursor-pointer hover:bg-amber-500 transition"
                  >
                    เปิดกล้อง
                  </button>
                </div>
              )}

              {/* Status Message Toast */}
              {scanMessage && (
                <div
                  className={`absolute bottom-3 inset-x-3 py-2 px-3 rounded-xl text-center font-bold text-xs shadow-lg backdrop-blur-sm transition-all animate-in fade-in ${
                    scanMessage.type === 'SUCCESS'
                      ? 'bg-emerald-600/90 text-white'
                      : 'bg-rose-600/90 text-white'
                  }`}
                >
                  {scanMessage.text}
                </div>
              )}
            </div>

            {/* Camera Controls & Manual Input Fallback */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsCameraActive(!isCameraActive)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                <span>{isCameraActive ? 'พักกล้อง' : 'เปิดกล้อง'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCameraFacing(cameraFacing === 'environment' ? 'user' : 'environment')}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition cursor-pointer"
                title="สลับกล้องหน้า/หลัง"
              >
                สลับกล้อง ({cameraFacing === 'environment' ? 'หลัง' : 'หน้า'})
              </button>
            </div>

            {/* Manual QR Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                processScanCode(manualInput);
                setManualInput('');
              }}
              className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 ml-2" />
              <input
                type="text"
                placeholder="พิมพ์รหัสนิสิต หรือเลขกลุ่ม (เช่น T321)..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="bg-transparent text-white placeholder-slate-400 outline-none flex-1 text-xs px-2"
              />
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition cursor-pointer"
              >
                ค้นหา
              </button>
            </form>

            {cameraError && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px] leading-relaxed">
                {cameraError}
              </div>
            )}
          </div>

          {/* Right Column: Scanned Student Evaluation Form (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-slate-800/60 rounded-2xl border border-slate-700 p-4 sm:p-5">
            {activeDraft ? (
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Student Info Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-800 to-slate-800 border border-amber-600/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-lg font-black shrink-0">
                      {activeDraft.groupSpecificCode || (activeDraft.groupNumber ? `G${activeDraft.groupNumber}` : 'นิสิต')}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-black text-amber-100 truncate">
                        {activeDraft.studentName}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-300 flex-wrap mt-0.5">
                        <span className="font-mono text-amber-300">{activeDraft.studentCode}</span>
                        {activeDraft.groupNumber && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200">
                            กลุ่มที่ {activeDraft.groupNumber}
                          </span>
                        )}
                        {activeDraft.vasa && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700">
                            พรรษา {activeDraft.vasa}
                          </span>
                        )}
                        <span>{activeDraft.programType === 'ENGLISH' ? 'International' : 'ภาคภาษาไทย'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickPass}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs transition shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                    title="ให้ผ่านรอบนี้ทันทีพร้อมติ๊กอิริยาบถหลัก"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ผ่านทันที</span>
                  </button>
                </div>

                {/* Satipatthana 4 Interactive Checklists */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[46vh] pr-1">
                  {/* 1. กายานุปัสสนา */}
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-700/80 space-y-2">
                    <div className="font-bold text-amber-300 text-xs flex items-center justify-between">
                      <span>๑. กายานุปัสสนา (อิริยาบถหลัก & ย่อย)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Kayanupassana</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                      {[
                        { key: 'standing', label: 'ขณยืน (Standing)' },
                        { key: 'walking', label: 'ขณะเดิน (Walking)' },
                        { key: 'sitting', label: 'ขณะนั่ง (Sitting)' },
                        { key: 'lying', label: 'ขณะนอน (Lying)' },
                      ].map((item) => {
                        const checked = Boolean(activeDraft.checklist[item.key as keyof SatipatthanaChecklist]);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => toggleCheck(item.key as keyof SatipatthanaChecklist)}
                            className={`p-1.5 rounded-lg font-semibold flex items-center justify-between transition cursor-pointer border ${
                              checked
                                ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                            }`}
                          >
                            <span>{item.label}</span>
                            {checked && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 text-[10px] pt-1 border-t border-slate-800">
                      {[
                        { key: 'bathing', label: 'สรงน้ำ' },
                        { key: 'dressing', label: 'นุ่งห่ม' },
                        { key: 'eating', label: 'ฉัน/ทาน' },
                        { key: 'toileting', label: 'ขับถ่าย' },
                        { key: 'others', label: 'อื่นๆ' },
                      ].map((item) => {
                        const checked = Boolean(activeDraft.checklist[item.key as keyof SatipatthanaChecklist]);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => toggleCheck(item.key as keyof SatipatthanaChecklist)}
                            className={`py-1 px-1.5 rounded-md font-medium text-center transition cursor-pointer border ${
                              checked
                                ? 'bg-amber-700 text-amber-100 border-amber-600'
                                : 'bg-slate-800/60 text-slate-400 border-slate-750 hover:bg-slate-700'
                            }`}
                          >
                            {item.label} {checked ? '✓' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2 & 3. เวทนา & จิต */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* เวทนา */}
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-700/80 space-y-1.5">
                      <div className="font-bold text-teal-300 text-[11px]">๒. เวทนานุปัสสนา</div>
                      <div className="grid grid-cols-3 gap-1 text-[10.5px]">
                        {[
                          { key: 'sukha', label: 'สุข (Happy)' },
                          { key: 'dukkha', label: 'ทุกข์ (Suffer)' },
                          { key: 'upekkha', label: 'เฉยๆ (Neutral)' },
                        ].map((item) => {
                          const checked = Boolean(activeDraft.checklist[item.key as keyof SatipatthanaChecklist]);
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => toggleCheck(item.key as keyof SatipatthanaChecklist)}
                              className={`p-1 rounded-lg font-medium text-center transition cursor-pointer border ${
                                checked
                                  ? 'bg-teal-600 text-white border-teal-500'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                              }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* จิต */}
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-700/80 space-y-1.5">
                      <div className="font-bold text-sky-300 text-[11px]">๓. จิตตานุปัสสนา</div>
                      <div className="grid grid-cols-3 gap-1 text-[10.5px]">
                        {[
                          { key: 'raga', label: 'ราคะ' },
                          { key: 'dosa', label: 'โทสะ' },
                          { key: 'moha', label: 'โมหะ' },
                        ].map((item) => {
                          const checked = Boolean(activeDraft.checklist[item.key as keyof SatipatthanaChecklist]);
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => toggleCheck(item.key as keyof SatipatthanaChecklist)}
                              className={`p-1 rounded-lg font-medium text-center transition cursor-pointer border ${
                                checked
                                  ? 'bg-sky-600 text-white border-sky-500'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                              }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 4. ธัมมานุปัสสนา */}
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-700/80 space-y-1.5">
                    <div className="font-bold text-purple-300 text-[11px]">๔. ธัมมานุปัสสนา (นิวรณ์ 5 & อายตนะ 6)</div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                      {[
                        { key: 'nivarana5', label: 'กำหนดรู้นิวรณ์ ๕ (5 Hindrances)' },
                        { key: 'ayatana6', label: 'กำหนดรู้อายตนะ ๖ (6 Ayatanas)' },
                      ].map((item) => {
                        const checked = Boolean(activeDraft.checklist[item.key as keyof SatipatthanaChecklist]);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => toggleCheck(item.key as keyof SatipatthanaChecklist)}
                            className={`p-1.5 rounded-lg font-medium text-center transition cursor-pointer border ${
                              checked
                                ? 'bg-purple-600 text-white border-purple-500'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Result Selector: PASS, NOT_PASS, PENDING */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-300 text-xs">ผลสอบอารมณ์รอบนี้:</span>
                    <button
                      type="button"
                      onClick={() => setActiveDraft({ ...activeDraft, result: 'PASS' })}
                      className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                        activeDraft.result === 'PASS'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>ผ่าน</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDraft({ ...activeDraft, result: 'NOT_PASS' })}
                      className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                        activeDraft.result === 'NOT_PASS'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <XCircle className="w-4 h-4 text-rose-300" />
                      <span>ไม่ผ่าน</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDraft({ ...activeDraft, result: 'PENDING' })}
                      className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                        activeDraft.result === 'PENDING'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <Clock className="w-4 h-4 text-amber-300" />
                      <span>รอประเมิน</span>
                    </button>
                  </div>

                  {/* Remarks & Quick Tag Advice */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="font-bold">คำแนะนำสภาวะธรรม / ข้อสังเกตของพระอาจารย์:</span>
                      <span className="text-[10px] text-slate-400">คลิกที่ข้อความด้านล่างเพื่อเติมด่วน</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {COMMON_ADVICE_TAGS.map((tag, tIdx) => (
                        <button
                          key={tIdx}
                          type="button"
                          onClick={() => {
                            const cur = activeDraft.remarks.trim();
                            const next = cur ? `${cur}; ${tag}` : tag;
                            setActiveDraft({ ...activeDraft, remarks: next });
                          }}
                          className="text-[10px] bg-slate-800 hover:bg-amber-900/60 text-slate-300 hover:text-amber-200 border border-slate-700 px-2 py-0.5 rounded-md transition cursor-pointer"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={2}
                      placeholder="ระบุคำแนะนำสภาวะธรรม เช่น การกำหนดรู้อาการพองยุบ การจัดการกับเวทนา..."
                      value={activeDraft.remarks}
                      onChange={(e) => setActiveDraft({ ...activeDraft, remarks: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 text-xs outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-2 border-t border-slate-700 flex items-center justify-between gap-2">
                  {onSelectStudentInMainView && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectStudentInMainView(activeDraft.regId);
                        onClose();
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                    >
                      เปิดในตารางหลัก
                    </button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRegId(null);
                        setActiveDraft(null);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-semibold text-xs transition cursor-pointer"
                    >
                      ยกเลิก / สแกนใหม่
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAndScanNext}
                      disabled={isSavingDraft}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingDraft ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileCheck2 className="w-4 h-4" />
                      )}
                      <span>
                        {isSavingDraft ? 'กำลังบันทึก...' : '💾 บันทึกผล & สแกนรูปถัดไปทันที'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 text-slate-400 my-auto">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                  <Camera className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-200 text-base">
                    พร้อมสแกน QR Code บนป้ายคล้องคอของนิสิต
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                    นำกล้องส่องที่ป้ายคล้องคอของนิสิต เพื่อเปิดฟอร์มประเมินสติปัฏฐาน 4 ขึ้นมาบันทึกผลได้ทันที
                    (รองรับทั้งรหัสประจำกลุ่ม เช่น T321 หรือรหัสนิสิต)
                  </p>
                </div>
                {saveToast && (
                  <div className="p-2.5 rounded-xl bg-emerald-600/90 text-white font-bold text-xs animate-in fade-in flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>บันทึกผลสอบอารมณ์เรียบร้อยแล้ว! พร้อมสแกนรูปถัดไป</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
