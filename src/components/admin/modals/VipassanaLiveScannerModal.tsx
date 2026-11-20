'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  Camera,
  CameraOff,
  Barcode,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Sparkles,
  Users,
  Search,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  UserCheck,
  SlidersHorizontal,
  Timer,
  Check,
} from 'lucide-react';
import type { StudentEvent, EventRegistration, MeditationPeriodConfig } from '@/types/event';
import { playBeep, triggerHaptic } from '@/lib/utils/audio-feedback';
import { getAuthUser } from '@/lib/auth-client';
import jsQR from 'jsqr';

interface BarcodeDetectorInstance {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
}

interface VipassanaLiveScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  registrations: EventRegistration[];
  onCheckInRecorded?: () => void;
}

type PeriodKey = 'p1' | 'p2' | 'p3' | 'p4';

const PERIOD_CONFIG: Record<
  PeriodKey,
  { nameTh: string; nameEn: string; timeRange: string; defaultStart: string; defaultEnd: string }
> = {
  p1: { nameTh: 'ภาคเช้ามืด', nameEn: 'Dawn Period', timeRange: '04.00-04.30', defaultStart: '03:30', defaultEnd: '06:00' },
  p2: { nameTh: 'ภาคเช้า', nameEn: 'Morning Period', timeRange: '08.00-08.30', defaultStart: '07:30', defaultEnd: '10:30' },
  p3: { nameTh: 'ภาคบ่าย', nameEn: 'Afternoon Period', timeRange: '12.30-13.00', defaultStart: '11:30', defaultEnd: '15:00' },
  p4: { nameTh: 'ภาคค่ำ', nameEn: 'Evening Period', timeRange: '17.30-18.00', defaultStart: '16:30', defaultEnd: '21:00' },
};

export function VipassanaLiveScannerModal({
  isOpen,
  onClose,
  event,
  registrations,
  onCheckInRecorded,
}: VipassanaLiveScannerModalProps) {
  // Determine current period from system time
  const autoDetectPeriod = useCallback((): PeriodKey => {
    const now = new Date();
    const curHour = now.getHours();
    const curMin = now.getMinutes();
    const curTime = curHour * 60 + curMin;

    // p1: รอบเช้ามืด (03.30 - 07.00 น.)
    if (curTime >= 3 * 60 + 30 && curTime < 7 * 60) return 'p1';
    // p2: รอบเช้า (07.00 - 12.00 น.)
    if (curTime >= 7 * 60 && curTime < 12 * 60) return 'p2';
    // p3: รอบบ่าย (12.00 - 16.30 น.)
    if (curTime >= 12 * 60 && curTime < 16 * 60 + 30) return 'p3';
    // p4: รอบค่ำ (16.30 - 23.59 น. และ 00.00 - 03.30 น.)
    return 'p4';
  }, []);

  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>(autoDetectPeriod);
  const [statusMode, setStatusMode] = useState<'PRESENT' | 'LATE' | 'SICK'>('PRESENT');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Policy & Late threshold configuration
  const [evalMode, setEvalMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [lateGraceMinutes, setLateGraceMinutes] = useState<number>(15);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState<boolean>(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState<boolean>(false);
  const [periodPolicies, setPeriodPolicies] = useState<Record<PeriodKey, { startTime: string; endTime: string }>>(() => {
    const defaultPol: Record<PeriodKey, { startTime: string; endTime: string }> = {
      p1: { startTime: '04:30', endTime: '06:00' },
      p2: { startTime: '08:00', endTime: '11:00' },
      p3: { startTime: '13:00', endTime: '15:30' },
      p4: { startTime: '18:00', endTime: '21:30' },
    };
    if (event.meditationConfig?.periods && Array.isArray(event.meditationConfig.periods)) {
      event.meditationConfig.periods.forEach((p: MeditationPeriodConfig) => {
        if (p.id && p.time && p.time.includes('-')) {
          const parts = p.time.split('-');
          const s = parts[0].trim().replace('.', ':');
          const e = parts[1].trim().replace('.', ':');
          if (defaultPol[p.id as PeriodKey]) {
            defaultPol[p.id as PeriodKey] = { startTime: s, endTime: e };
          }
        }
      });
    }
    return defaultPol;
  });

  // Scanner states
  const [inputCode, setInputCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentScans, setRecentScans] = useState<
    Array<{
      id: string;
      studentCode: string;
      studentName: string;
      groupNumber?: number;
      vasa?: string | number;
      period: PeriodKey;
      time: string;
      status: 'PRESENT' | 'LATE' | 'SICK';
      isDuplicate?: boolean;
    }>
  >([]);

  const [lastFeedback, setLastFeedback] = useState<{
    type: 'SUCCESS' | 'WARN' | 'ERROR';
    message: string;
    student?: EventRegistration;
    time?: string;
    isDuplicate?: boolean;
    scannedCode?: string;
    status?: 'PRESENT' | 'LATE' | 'SICK';
  } | null>(null);

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scanThrottleRef = useRef<number>(0);

  // Group Advisor (พระพี่เลี้ยง) States
  const [selectedGroup, setSelectedGroup] = useState<number | 'ALL'>('ALL');
  const [rightPanelTab, setRightPanelTab] = useState<'SCANS' | 'CHECKLIST'>('SCANS');
  const [checklistSearch, setChecklistSearch] = useState('');

  // Available groups
  const availableGroups = useMemo(() => {
    const groupNums = new Set<number>();
    registrations.forEach((r) => {
      if (r.groupNumber) groupNums.add(r.groupNumber);
      else if (r.groupName) {
        const m = r.groupName.match(/\d+/);
        if (m) groupNums.add(parseInt(m[0], 10));
      }
    });
    if (groupNums.size === 0) {
      [1, 2, 3, 12].forEach((g) => groupNums.add(g));
    }
    return Array.from(groupNums).sort((a, b) => a - b);
  }, [registrations]);

  const dayKey = `day_${selectedDayNumber}`;

  // Filtered registrations for Group Checklist view
  const groupRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      if (selectedGroup !== 'ALL') {
        const gNum = r.groupNumber || (r.groupName ? parseInt(r.groupName.replace(/\D/g, ''), 10) : 0);
        if (gNum !== selectedGroup) return false;
      }
      if (checklistSearch.trim()) {
        const q = checklistSearch.toLowerCase();
        const matchCode =
          r.studentCode.toLowerCase().includes(q) ||
          (r.groupSpecificCode && r.groupSpecificCode.toLowerCase().includes(q));
        const matchName = r.studentName.toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }
      return true;
    });
  }, [registrations, selectedGroup, checklistSearch]);

  // Offline Cache Queue State
  const OFFLINE_QUEUE_KEY = `vipassana_scanner_offline_queue_${event.id}`;
  const [offlineQueue, setOfflineQueue] = useState<
    Array<{
      studentCodeOrId: string;
      dayKey: string;
      periodKey: PeriodKey;
      status: 'PRESENT' | 'LATE';
      checkInTime: string;
      scannedAt: string;
      studentName?: string;
    }>
  >([]);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  // Scanner Officer Name (อาจารย์ผู้ดูแล / เจ้าหน้าที่ ที่สแกนตรวจเช็ค)
  const [scannerOfficerName, setScannerOfficerName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vipassana_scanner_officer_name');
        if (saved) return saved;
        const currentUser = getAuthUser();
        if (currentUser?.name) {
          return String(currentUser.name).replace(/\s*\(.*?\)\s*$/, '').trim();
        }
      } catch {}
    }
    return '';
  });

  // Auto-select group if current user is assigned to a group in event.meditationConfig
  useEffect(() => {
    if (!isOpen || availableGroups.length === 0) return;
    const currentUser = typeof window !== 'undefined' ? getAuthUser() : null;
    const cleanUserName = String(currentUser?.name || scannerOfficerName || '')
      .replace(/\s*\(.*?\)\s*$/, '')
      .trim();
    if (!cleanUserName) return;

    const assignments = event.meditationConfig?.groupAssignments || {};
    for (const g of availableGroups) {
      const gConf = assignments[String(g)];
      const advisors = gConf?.advisors || [];
      const masters = gConf?.vipassanaMasters || [];
      if (
        advisors.some((a) => a.includes(cleanUserName) || cleanUserName.includes(a)) ||
        masters.some((m) => m.includes(cleanUserName) || cleanUserName.includes(m))
      ) {
        setSelectedGroup(g);
        break;
      }
    }
  }, [isOpen, availableGroups, event.meditationConfig?.groupAssignments]);

  // Load offline queue on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setOfflineQueue(parsed);
        }
      }
    } catch {}
  }, [OFFLINE_QUEUE_KEY]);

  // Sync offline queue helper
  const syncOfflineQueue = useCallback(async () => {
    try {
      const saved = localStorage.getItem(OFFLINE_QUEUE_KEY);
      const itemsToSync = saved ? JSON.parse(saved) : offlineQueue;
      if (!Array.isArray(itemsToSync) || itemsToSync.length === 0 || isSyncingOffline) return;

      setIsSyncingOffline(true);
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vipassana_batch_offline_sync',
          eventId: event.id,
          items: itemsToSync,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOfflineQueue([]);
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
        if (onCheckInRecorded) onCheckInRecorded();
      }
    } catch (e) {
      console.warn('Offline sync attempt paused (will retry):', e);
    } finally {
      setIsSyncingOffline(false);
    }
  }, [offlineQueue, isSyncingOffline, event.id, onCheckInRecorded, OFFLINE_QUEUE_KEY]);

  // Auto-sync interval & online event listener
  useEffect(() => {
    if (!isOpen) return;

    const handleOnline = () => {
      syncOfflineQueue();
    };

    window.addEventListener('online', handleOnline);
    const interval = setInterval(() => {
      if (navigator.onLine && offlineQueue.length > 0) {
        syncOfflineQueue();
      }
    }, 12000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [isOpen, offlineQueue.length, syncOfflineQueue]);

  // Keep input focused for physical USB barcode/QR scanner
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen, isSubmitting, lastFeedback]);

  // Handle Scan Submission
  const processScanCode = useCallback(
    async (codeToProcess: string) => {
      const cleanCode = codeToProcess.trim();
      if (!cleanCode || isSubmitting) return;

      // Throttle rapid repeated triggers
      const nowTs = Date.now();
      if (nowTs - scanThrottleRef.current < 1200) return;
      scanThrottleRef.current = nowTs;

      setIsSubmitting(true);
      setInputCode('');

      const now = new Date();
      let checkInTime = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      let targetStatus: 'PRESENT' | 'LATE' | 'SICK' = 'PRESENT';
      let lateNote = '';

      try {
        if (evalMode === 'AUTO') {
          const curPolicy = periodPolicies[selectedPeriod];
          const [startH, startM] = (curPolicy?.startTime || '04:00').split(':').map(Number);
          const startTotal = (startH || 0) * 60 + (startM || 0);
          const currentTotal = now.getHours() * 60 + now.getMinutes();
          const diffMinutes = currentTotal - startTotal;

          if (diffMinutes > lateGraceMinutes) {
            targetStatus = 'LATE';
            lateNote = ` (สาย +${diffMinutes} นาที / เกณฑ์ ${lateGraceMinutes} นาที)`;
          } else {
            targetStatus = 'PRESENT';
          }
        } else {
          targetStatus = statusMode;
        }

        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'vipassana_scan_checkin',
            eventId: event.id,
            studentCodeOrId: cleanCode,
            dayKey,
            periodKey: selectedPeriod,
            status: targetStatus,
            checkInTime,
            recordedBy: scannerOfficerName.trim() || undefined,
          }),
        });

        const data = await res.json();

        if (data.success && data.registration) {
          const reg = data.registration;
          const isDuplicate = data.isAlreadyCheckedIn;
          const regGroup = reg.groupNumber || (reg.groupName ? parseInt(reg.groupName.replace(/\D/g, ''), 10) : undefined);
          const isWrongGroup = selectedGroup !== 'ALL' && regGroup !== selectedGroup;

          if (soundEnabled) {
            playBeep(isDuplicate ? 'WARN' : 'SUCCESS');
          }
          triggerHaptic(isDuplicate ? 'WARN' : targetStatus === 'LATE' ? 'WARN' : 'SUCCESS');

          let msg = isDuplicate
            ? `เช็คชื่อซ้ำ: ${reg.studentName} ลงชื่อรอบนี้ไปแล้ว (${checkInTime} น.)`
            : `เช็คชื่อสำเร็จ: ${reg.studentName}${lateNote}`;

          if (isWrongGroup) {
            msg += ` ⚠️ (สังเกต: นิสิตสังกัดกลุ่มที่ ${regGroup || '-'})`;
          }

          setLastFeedback({
            type: isDuplicate ? 'WARN' : targetStatus === 'LATE' ? 'WARN' : 'SUCCESS',
            message: msg,
            student: reg,
            time: checkInTime,
            isDuplicate,
            status: targetStatus,
          });

          // Add to recent scans list
          setRecentScans((prev) => [
            {
              id: `${reg.id}-${nowTs}`,
              studentCode: reg.studentCode,
              studentName: reg.studentName,
              groupNumber: reg.groupNumber || (reg.groupName ? parseInt(reg.groupName.replace(/\D/g, ''), 10) : undefined),
              vasa: reg.vasa,
              period: selectedPeriod,
              time: checkInTime,
              status: targetStatus,
              isDuplicate,
            },
            ...prev.slice(0, 19),
          ]);

          if (onCheckInRecorded) {
            onCheckInRecorded();
          }
        } else {
          if (soundEnabled) playBeep('ERROR');
          triggerHaptic('ERROR');
          setLastFeedback({
            type: 'ERROR',
            message: data.error || `ไม่พบข้อมูลนิสิต (รหัส: ${cleanCode}) ในโครงการนี้`,
            scannedCode: cleanCode,
          });
        }
      } catch (err: unknown) {
        // Fallback to offline queue if practitioner is found in local registrations prop
        const localReg = registrations.find(
          (r) =>
            r.studentCode?.toLowerCase() === cleanCode.toLowerCase() ||
            (r.groupSpecificCode && r.groupSpecificCode.toLowerCase() === cleanCode.toLowerCase()) ||
            r.id === cleanCode
        );

        if (localReg) {
          const offlineItem = {
            studentCodeOrId: cleanCode,
            dayKey,
            periodKey: selectedPeriod,
            status: (targetStatus === 'SICK' ? 'PRESENT' : targetStatus) as 'PRESENT' | 'LATE',
            checkInTime,
            scannedAt: new Date().toISOString(),
            studentName: localReg.studentName,
          };

          const nextQueue = [...offlineQueue, offlineItem];
          setOfflineQueue(nextQueue);
          try {
            localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(nextQueue));
          } catch {}

          if (soundEnabled) playBeep('SUCCESS');
          triggerHaptic(targetStatus === 'LATE' ? 'WARN' : 'SUCCESS');

          setLastFeedback({
            type: targetStatus === 'LATE' ? 'WARN' : 'SUCCESS',
            message: `📦 บันทึกออฟไลน์สำเร็จ: ${localReg.studentName} (${checkInTime} น. • รอซิงค์เมื่อต่อเน็ต)`,
            student: localReg,
            time: checkInTime,
            status: targetStatus,
          });

          setRecentScans((prev) => [
            {
              id: `${localReg.id}-${nowTs}`,
              studentCode: localReg.studentCode,
              studentName: localReg.studentName + ' (📦 ออฟไลน์)',
              groupNumber: localReg.groupNumber || (localReg.groupName ? parseInt(localReg.groupName.replace(/\D/g, ''), 10) : undefined),
              vasa: localReg.vasa,
              period: selectedPeriod,
              time: checkInTime,
              status: targetStatus,
              isDuplicate: false,
            },
            ...prev.slice(0, 19),
          ]);
        } else {
          if (soundEnabled) playBeep('ERROR');
          triggerHaptic('ERROR');
          const errText = err instanceof Error ? err.message : String(err);
          setLastFeedback({
            type: 'ERROR',
            message: `ไม่พบข้อมูลนิสิต (รหัส: ${cleanCode}) - ${errText}`,
            scannedCode: cleanCode,
          });
        }
      } finally {
        setIsSubmitting(false);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    },
    [
      event.id,
      dayKey,
      selectedPeriod,
      statusMode,
      isSubmitting,
      soundEnabled,
      onCheckInRecorded,
      registrations,
      offlineQueue,
      OFFLINE_QUEUE_KEY,
      evalMode,
      periodPolicies,
      lateGraceMinutes,
    ]
  );

  // Form Submit handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      processScanCode(inputCode.trim());
    }
  };

  // Quick status override for Group Advisor Checklist
  const handleOverrideStudentStatus = async (
    studentCode: string,
    newStatus: 'PRESENT' | 'LATE' | 'SICK'
  ) => {
    try {
      const now = new Date();
      const checkInTime = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vipassana_scan_checkin',
          eventId: event.id,
          studentCodeOrId: studentCode,
          dayKey,
          periodKey: selectedPeriod,
          status: newStatus,
          checkInTime,
          recordedBy: scannerOfficerName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (soundEnabled) playBeep('SUCCESS');
        if (onCheckInRecorded) onCheckInRecorded();
      }
    } catch (e) {
      console.error('Failed to override status:', e);
    }
  };

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
          setCameraError('ไม่สามารถเข้าถึงกล้องได้: ' + (err.message || 'โปรดตรวจสอบการอนุญาตใช้งานกล้อง'));
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

  // Camera Barcode / QR Scanning Loop (Hardware BarcodeDetector with universal jsQR fallback)
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
          // 1. Try native BarcodeDetector if available
          if (detector) {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              processScanCode(barcodes[0].rawValue);
            }
          } else {
            // 2. Fallback to jsQR via hidden canvas (iOS Safari, older tablets, etc.)
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

  // Statistics for current period (scoped to selectedGroup if filtered)
  const stats = useMemo(() => {
    const targetPool =
      selectedGroup === 'ALL'
        ? registrations
        : registrations.filter((r) => {
            const gNum = r.groupNumber || (r.groupName ? parseInt(r.groupName.replace(/\D/g, ''), 10) : 0);
            return gNum === selectedGroup;
          });

    let checkedCount = 0;
    targetPool.forEach((r) => {
      const p = r.dailyAttendance?.[dayKey]?.[selectedPeriod];
      if (p && (p.status === 'PRESENT' || p.status === 'LATE')) {
        checkedCount++;
      }
    });
    return {
      total: targetPool.length,
      checkedCount,
      percent: targetPool.length > 0 ? Math.round((checkedCount / targetPool.length) * 100) : 0,
    };
  }, [registrations, dayKey, selectedPeriod, selectedGroup]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                <span>LIVE SCANNER</span>
              </span>
              {/* Online / Offline Sync Badge */}
              {offlineQueue.length === 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span>🟢 พร้อมใช้งาน</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={syncOfflineQueue}
                  disabled={isSyncingOffline}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1 shadow-sm transition cursor-pointer animate-pulse"
                  title="คลิกเพื่อส่งข้อมูลที่บันทึกออฟไลน์ขึ้นเซิร์ฟเวอร์ทันที"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingOffline ? 'animate-spin' : ''}`} />
                  <span>รอซิงค์ {offlineQueue.length} รายการ (คลิกซิงค์)</span>
                </button>
              )}
              <span className="text-xs text-purple-200 font-medium">
                จุดสแกนเช็คชื่ออัตโนมัติ (Barcode / QR / ป้ายคล้องคอ)
              </span>
            </div>
            <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
              ระบบสแกนเช็คชื่อปฏิบัติธรรม 4 รอบต่อวัน
            </h3>
            <p className="text-xs text-purple-200/80 line-clamp-1">
              {event.title}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Sound Mute Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                soundEnabled
                  ? 'bg-purple-800/80 text-purple-200 hover:bg-purple-700'
                  : 'bg-rose-900/60 text-rose-300 hover:bg-rose-800 border border-rose-400/40'
              }`}
              title={soundEnabled ? 'ปิดเสียงแจ้งเตือน (ใช้ข้อความแจ้งบนจอและสั่นแทน)' : 'เปิดเสียงแจ้งเตือน'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
              <span className="hidden sm:inline">{soundEnabled ? 'เสียงเปิด' : 'โหมดเงียบ (แจ้งเตือนบนจอ)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SETTINGS / PERIOD SELECTOR TOOLBAR */}
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col gap-2 text-xs shrink-0">
          {/* Primary Always-Visible Row: Group, Day, Options & Collapse/Expand */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Group Selector for พระพี่เลี้ยง / Group Advisors */}
              <div className="flex items-center gap-1 bg-purple-50/90 px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs">
                <span className="font-extrabold text-purple-950 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-purple-700" />
                  กลุ่ม:
                </span>
                <select
                  value={selectedGroup}
                  onChange={(e) => {
                    const val = e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10);
                    setSelectedGroup(val);
                  }}
                  className="bg-transparent font-bold text-purple-950 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="ALL">ทุกกลุ่ม (ส่วนกลาง)</option>
                  {availableGroups.map((g) => (
                    <option key={g} value={g}>
                      {g === 12 ? 'กลุ่ม 12 (English)' : `กลุ่ม ${g}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day Selector */}
              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-300 shadow-2xs">
                <span className="font-bold text-slate-700">วันที่:</span>
                <select
                  value={selectedDayNumber}
                  onChange={(e) => setSelectedDayNumber(parseInt(e.target.value, 10))}
                  className="bg-transparent font-bold text-amber-950 focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      วันที่ {d} ({10 + d} ธ.ค.)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Controls: Progress + Options & Collapse/Expand */}
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 font-mono font-bold text-[11px]">
                {stats.checkedCount}/{stats.total} ({stats.percent}%)
              </span>

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
                title="แสดง/ซ่อนตัวเลือกเกณฑ์เวลาสายและผู้สแกน"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>ตัวเลือก</span>
              </button>

              <button
                type="button"
                onClick={() => setIsToolbarCollapsed((v) => !v)}
                className="px-2 py-1 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold text-[11px] flex items-center gap-0.5 transition cursor-pointer shadow-2xs"
                title={isToolbarCollapsed ? 'คลี่แถบรอบเวลาออก' : 'หุบแถบเครื่องมือเพื่อขยายพื้นที่สแกนและรายชื่อ'}
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

          {/* Collapsible Row: Period Switcher */}
          {!isToolbarCollapsed && (
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-200/70">
              {/* Period Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl flex-wrap">
                {(Object.keys(PERIOD_CONFIG) as PeriodKey[]).map((pkey) => {
                  const conf = PERIOD_CONFIG[pkey];
                  const isSelected = selectedPeriod === pkey;
                  return (
                    <button
                      key={pkey}
                      type="button"
                      onClick={() => setSelectedPeriod(pkey)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <span>{conf.nameTh}</span>
                      <span className="text-[10px] font-mono opacity-80 hidden sm:inline">({conf.timeRange})</span>
                    </button>
                  );
                })}
              </div>

              {/* Scanner Officer Name (อาจารย์ผู้ดูแล / เจ้าหน้าที่ ที่สแกนตรวจเช็ค) */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-300 shadow-2xs">
                <span className="font-semibold text-slate-600 text-[11px] whitespace-nowrap">ผู้สแกน:</span>
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
                  className="w-28 sm:w-36 text-xs font-bold text-slate-800 outline-none"
                />
              </div>
            </div>
          )}

          {/* Advanced Controls (Hidden by default on mobile to keep screen clean) */}
          {!isToolbarCollapsed && showAdvancedControls && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200 animate-in fade-in duration-150">
              {/* Evaluation Mode Switcher (AUTO vs MANUAL) */}
              <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEvalMode('AUTO')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    evalMode === 'AUTO'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="ระบบจะคำนวณและตัดเป็น 'สาย' ให้อัตโนมัติเมื่อเกินเกณฑ์เวลาที่กำหนด"
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>ตัดสายอัตโนมัติ (Auto)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEvalMode('MANUAL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    evalMode === 'MANUAL'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Admin เลือกกำหนดสถานะที่ต้องการให้เป็นตามปุ่มที่เลือก"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>เลือกสถานะเอง (Manual)</span>
                </button>
              </div>

              {/* If AUTO: Late Threshold Dropdown & Policy summary */}
              {evalMode === 'AUTO' ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-amber-950">
                    <span className="font-bold text-[11px]">เกณฑ์เวลาสาย: เกิน</span>
                    <select
                      value={lateGraceMinutes}
                      onChange={(e) => setLateGraceMinutes(parseInt(e.target.value, 10))}
                      className="px-1.5 py-0.5 bg-white rounded border border-amber-300 font-extrabold text-amber-900 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value={5}>5 นาที (เข้มงวด)</option>
                      <option value={10}>10 นาที</option>
                      <option value={15}>15 นาที (มาตรฐาน)</option>
                      <option value={20}>20 นาที</option>
                      <option value={25}>25 นาที</option>
                      <option value={30}>30 นาที (ผ่อนปรน)</option>
                      <option value={45}>45 นาที</option>
                      <option value={60}>60 นาที (1 ชั่วโมง)</option>
                    </select>
                    <span className="text-[11px] font-bold">= สาย</span>
                  </div>

                  {/* Calculated Cutoff badge */}
                  {(() => {
                    const [h, m] = (periodPolicies[selectedPeriod]?.startTime || '04:00').split(':').map(Number);
                    const total = (h || 0) * 60 + (m || 0) + lateGraceMinutes;
                    const cutH = Math.floor(total / 60) % 24;
                    const cutM = total % 60;
                    const cutStr = `${String(cutH).padStart(2, '0')}:${String(cutM).padStart(2, '0')}`;
                    return (
                      <span className="text-[11px] text-slate-600 font-medium">
                        (เริ่ม {periodPolicies[selectedPeriod]?.startTime} น. ➔ หลัง <strong>{cutStr} น.</strong> = สาย)
                      </span>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={() => setShowConfigDrawer((v) => !v)}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition flex items-center gap-1"
                    title="แก้ไขเวลาเริ่มต้นและสิ้นสุดของแต่ละรอบ"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                    <span>{showConfigDrawer ? 'ซ่อนตั้งเวลา' : '⚙️ ปรับเวลาเริ่มรอบ'}</span>
                  </button>
                </div>
              ) : (
                /* If MANUAL: Status buttons */
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-700">สถานะที่บันทึก:</span>
                  <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white">
                    <button
                      type="button"
                      onClick={() => setStatusMode('PRESENT')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                        statusMode === 'PRESENT'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      ปกติ (มา)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusMode('LATE')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                        statusMode === 'LATE'
                          ? 'bg-amber-500 text-white'
                          : 'text-slate-600 hover:text-amber-700'
                      }`}
                    >
                      สาย
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusMode('SICK')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                        statusMode === 'SICK'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:text-blue-700'
                      }`}
                    >
                      ป่วย
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Policy Time Editor Drawer */}
        {showConfigDrawer && (
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
                  onClick={() => setShowConfigDrawer(false)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition cursor-pointer"
                >
                  เรียบร้อย
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BODY AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT COLUMN: SCANNER INPUT & CAMERA FEED (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Hardware Scanner & Fast Input Box */}
            <div className="bg-purple-50/60 border-2 border-purple-200 rounded-2xl p-4 shadow-xs">
              <form onSubmit={handleFormSubmit} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-purple-700" />
                    <span>ช่องรับสัญญาณปืนสแกนบาร์โค้ด / พิมพ์รหัสนิสิต:</span>
                  </label>
                  <span className="text-[10px] text-purple-700 font-mono">
                    (Auto-focused • พร้อมยิงสแกนทันที)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="ยิงบาร์โค้ด หรือพิมพ์รหัสนิสิต (เช่น 6501501071) แล้วกด Enter..."
                      disabled={isSubmitting}
                      className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-purple-300 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !inputCode.trim()}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </form>
            </div>

            {/* Camera Scanner Box */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 text-white">
              <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <Camera className="w-4 h-4 text-purple-400" />
                  <span>โหมดกล้องสแกน (Webcam / มือถือ)</span>
                </div>
                <div className="flex items-center gap-2">
                  {isCameraActive && (
                    <button
                      type="button"
                      onClick={() =>
                        setCameraFacing((f) => (f === 'environment' ? 'user' : 'environment'))
                      }
                      className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] font-semibold cursor-pointer transition"
                    >
                      สลับกล้อง ({cameraFacing === 'environment' ? 'หลัง' : 'หน้า'})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCameraActive((v) => !v)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1 ${
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
                        <span>เปิดกล้องสแกน QR</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Camera Preview Area */}
              <div className="relative min-h-[220px] max-h-[320px] flex items-center justify-center bg-black/60 overflow-hidden">
                {/* On-Screen Heads-Up Display (HUD) Visual Notification (Silent Meditation Friendly) */}
                {lastFeedback && (
                  <div
                    className={`absolute top-2 left-2 right-2 z-30 p-2.5 sm:p-3 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-3 flex items-center gap-2.5 sm:gap-3 ${
                      lastFeedback.type === 'SUCCESS'
                        ? 'bg-emerald-600/95 text-white border-emerald-300 shadow-emerald-950/50'
                        : lastFeedback.type === 'WARN'
                        ? 'bg-amber-500/95 text-white border-amber-200 shadow-amber-950/50'
                        : 'bg-rose-600/95 text-white border-rose-300 shadow-rose-950/50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black shadow-md ${
                        lastFeedback.type === 'SUCCESS'
                          ? 'bg-white text-emerald-700'
                          : lastFeedback.type === 'WARN'
                          ? 'bg-white text-amber-600'
                          : 'bg-white text-rose-700 animate-bounce'
                      }`}
                    >
                      {lastFeedback.type === 'SUCCESS' ? (
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
                            lastFeedback.type === 'SUCCESS'
                              ? 'bg-emerald-900/60 text-emerald-100'
                              : lastFeedback.type === 'WARN'
                              ? 'bg-amber-900/60 text-amber-100'
                              : 'bg-rose-900/60 text-rose-100'
                          }`}
                        >
                          {lastFeedback.type === 'SUCCESS'
                            ? '✓ สแกนสำเร็จ (SUCCESS)'
                            : lastFeedback.type === 'WARN'
                            ? lastFeedback.isDuplicate
                              ? 'ℹ️ เช็คชื่อซ้ำ (ALREADY CHECKED)'
                              : '⚠️ สแกนสำเร็จ (สาย)'
                            : '✗ ไม่พบข้อมูล (NOT FOUND)'}
                        </span>
                        {lastFeedback.time && (
                          <span className="font-mono text-[10.5px] text-white/90">
                            {lastFeedback.time} น.
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
                            <span className="font-sans font-semibold">กลุ่ม {lastFeedback.student.groupNumber}</span>
                          )}
                          {lastFeedback.student.vasa && (
                            <span className="font-sans text-[11px]">({lastFeedback.student.vasa} พรรษา)</span>
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
                  </>
                ) : (
                  <div className="p-8 text-center space-y-2 text-slate-400">
                    <Camera className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-xs">
                      กล้องปิดอยู่ — ท่านสามารถใช้ **ปืนสแกนบาร์โค้ด USB** ยิงได้ทันที หรือกด "เปิดกล้องสแกน QR" ด้านบน
                    </p>
                    {cameraError && (
                      <p className="text-xs text-rose-400 font-semibold">{cameraError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* LIVE FEEDBACK CARD */}
            {lastFeedback && (
              <div
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all animate-in fade-in slide-in-from-top-2 duration-200 shadow-md ${
                  lastFeedback.type === 'SUCCESS'
                    ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-400 text-emerald-950'
                    : lastFeedback.type === 'WARN'
                    ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-white border-amber-400 text-amber-950'
                    : 'bg-gradient-to-r from-rose-50 via-red-50 to-white border-rose-400 text-rose-950'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      lastFeedback.type === 'SUCCESS'
                        ? 'bg-emerald-600 text-white'
                        : lastFeedback.type === 'WARN'
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {lastFeedback.type === 'SUCCESS' ? (
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
                          lastFeedback.type === 'SUCCESS'
                            ? 'bg-emerald-700 text-white'
                            : lastFeedback.type === 'WARN'
                            ? 'bg-amber-600 text-white'
                            : 'bg-rose-700 text-white'
                        }`}
                      >
                        {lastFeedback.type === 'SUCCESS'
                          ? '✓ สแกนสำเร็จ (CHECK-IN SUCCESS)'
                          : lastFeedback.type === 'WARN'
                          ? lastFeedback.isDuplicate
                            ? 'ℹ️ เช็คชื่อซ้ำ (ALREADY CHECKED)'
                            : '⚠️ สแกนสำเร็จแต่สาย (LATE)'
                          : '✗ ไม่พบข้อมูลนิสิต (NOT FOUND)'}
                      </span>
                      {lastFeedback.time && (
                        <span className="font-mono font-bold text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lastFeedback.time} น.</span>
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
                        {lastFeedback.student.vasa && <span>พรรษา: <strong>{lastFeedback.student.vasa}</strong></span>}
                        {lastFeedback.student.major && <span className="truncate max-w-[160px]">สาขา: {lastFeedback.student.major}</span>}
                      </div>
                    )}

                    {lastFeedback.scannedCode && !lastFeedback.student && (
                      <div className="text-xs text-rose-700 font-mono pt-0.5">
                        รหัสที่ตรวจจับได้: <strong>{lastFeedback.scannedCode}</strong> (กรุณาตรวจสอบว่านิสิตได้ลงทะเบียนในโครงการนี้หรือไม่)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: RECENT SCANS LOG & GROUP CHECKLIST (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            {/* Tab Switcher between Recent Scans and Group Checklist */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
              <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200/80">
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
                  onClick={() => setRecentScans([])}
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
                      const att = r.dailyAttendance?.[dayKey]?.[selectedPeriod];
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
                                    handleOverrideStudentStatus(
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
                                onClick={() => processScanCode(r.studentCode)}
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
        </div>
      </div>
    </div>
  );
}
