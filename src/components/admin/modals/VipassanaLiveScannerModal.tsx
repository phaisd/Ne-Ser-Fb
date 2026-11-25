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
  Lock,
  Unlock,
} from 'lucide-react';
import type { StudentEvent, EventRegistration, MeditationPeriodConfig } from '@/types/event';
import { playBeep, triggerHaptic } from '@/lib/utils/audio-feedback';
import { getAuthUser } from '@/lib/auth-client';
import { formatGroupDisplay } from '@/lib/events/groupImport';
import jsQR from 'jsqr';
import {
  type PeriodKey,
  type ScannerRecentItem,
  type BarcodeDetectorInstance,
  type VipassanaLiveScannerModalProps,
  PERIOD_CONFIG,
  autoDetectPeriod,
  ScannerPolicyDrawer,
  ScannerSidePanel,
} from './vipassana/scanner';

export function VipassanaLiveScannerModal({
  isOpen,
  onClose,
  event,
  registrations,
  onCheckInRecorded,
}: VipassanaLiveScannerModalProps) {
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
  // Lock Screen / Kiosk Mode (Enabled by default to prevent accidental exit when placing phone down)
  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(true);
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

  // Deduplicate registrations to prevent inflated counts
  const uniqueRegistrations = useMemo(() => {
    const seen = new Set<string>();
    const list: EventRegistration[] = [];
    (registrations || []).forEach((r) => {
      const key = (r.studentCode || r.id).trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(r);
      }
    });
    return list;
  }, [registrations]);

  // Helper to detect International / English practitioner
  const isEnglishPractitioner = useCallback((r?: EventRegistration | null): boolean => {
    if (!r) return false;
    if (String(r.programType || '').toUpperCase() === 'ENGLISH') return true;
    if (r.groupSpecificCode && /^B\d*E/i.test(r.groupSpecificCode)) return true;
    const major = String(r.major || '').toLowerCase();
    if (
      major.includes('buddhist studies') ||
      major.includes('english') ||
      major.includes('international') ||
      major.includes('inter')
    ) {
      return true;
    }
    const name = String(r.studentName || '').trim();
    if (!/[\u0E00-\u0E7F]/.test(name) && /[a-zA-Z]/.test(name)) return true;
    return false;
  }, []);

  // Scanner states
  const [inputCode, setInputCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kioskState, setKioskState] = useState<'READY' | 'SAVING' | 'SUCCESS_COOLDOWN' | 'ERROR_COOLDOWN'>('READY');
  const kioskStateRef = useRef<'READY' | 'SAVING' | 'SUCCESS_COOLDOWN' | 'ERROR_COOLDOWN'>('READY');
  const isSubmittingRef = useRef(false);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    kioskStateRef.current = kioskState;
  }, [kioskState]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

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
      scanCount?: number;
      isOverDuplicateLimit?: boolean;
    }>
  >([]);

  const [lastFeedback, setLastFeedback] = useState<{
    type: 'SUCCESS' | 'WARN' | 'ERROR';
    message: string;
    student?: EventRegistration;
    time?: string;
    isDuplicate?: boolean;
    scanCount?: number;
    isOverDuplicateLimit?: boolean;
    firstCheckInTime?: string;
    scannedCode?: string;
    status?: 'PRESENT' | 'LATE' | 'SICK';
    badgeTitle?: string;
    badgeTitleEn?: string;
    subNote?: string;
    subNoteEn?: string;
    isEnglish?: boolean;
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
    uniqueRegistrations.forEach((r) => {
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
  }, [uniqueRegistrations]);

  const dayKey = `day_${selectedDayNumber}`;

  // Filtered registrations for Group Checklist view
  const groupRegistrations = useMemo(() => {
    return uniqueRegistrations.filter((r) => {
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
  }, [uniqueRegistrations, selectedGroup, checklistSearch]);

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
      let res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vipassana_batch_offline_sync',
          eventId: event.id,
          items: itemsToSync,
          recordedBy: scannerOfficerName.trim() || undefined,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        const localUser = getAuthUser();
        if (localUser && (localUser.email || localUser.id)) {
          await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'sync-session',
              email: localUser.email,
              gmail: localUser.gmail,
              id: localUser.id,
              rememberMe: true,
            }),
          });
          res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'vipassana_batch_offline_sync',
              eventId: event.id,
              items: itemsToSync,
              recordedBy: scannerOfficerName.trim() || undefined,
            }),
          });
        }
      }

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

  // Keep input focused for physical USB barcode/QR scanner (Desktop only — avoid popping up mobile keyboard)
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      inputRef.current?.focus();
    }
  }, [isOpen, isSubmitting, lastFeedback]);

  // Handle Scan Submission
  const processScanCode = useCallback(
    async (codeToProcess: string) => {
      const cleanCode = codeToProcess.trim();
      if (
        !cleanCode ||
        isSubmittingRef.current ||
        kioskStateRef.current === 'SAVING' ||
        kioskStateRef.current === 'SUCCESS_COOLDOWN'
      ) {
        return;
      }

      // Throttle rapid repeated triggers
      const nowTs = Date.now();
      if (nowTs - scanThrottleRef.current < 1600) return;
      scanThrottleRef.current = nowTs;

      setIsSubmitting(true);
      isSubmittingRef.current = true;
      setKioskState('SAVING');
      kioskStateRef.current = 'SAVING';
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

        let res = await fetch('/api/events', {
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

        // Auto-recover session on mobile if 401/403
        if (res.status === 401 || res.status === 403) {
          const localUser = getAuthUser();
          if (localUser && (localUser.email || localUser.id)) {
            await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'sync-session',
                email: localUser.email,
                gmail: localUser.gmail,
                id: localUser.id,
                rememberMe: true,
              }),
            });
            res = await fetch('/api/events', {
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
          }
        }

        const data = await res.json();

        if (data.success && data.registration) {
          const reg = data.registration;
          const isDuplicate = Boolean(data.isAlreadyCheckedIn);
          const scanCount = data.scanCount || (isDuplicate ? 2 : 1);
          const isExcessive = Boolean(data.isExcessiveScan) || scanCount > 3;
          const isOverDuplicateLimit = Boolean(data.isOverDuplicateLimit) || scanCount > 2;
          const regGroup = reg.groupNumber || (reg.groupName ? parseInt(reg.groupName.replace(/\D/g, ''), 10) : undefined);
          const isWrongGroup = selectedGroup !== 'ALL' && regGroup !== selectedGroup;

          if (soundEnabled) {
            playBeep(isExcessive ? 'ERROR' : isOverDuplicateLimit ? 'WARN' : isDuplicate ? 'WARN' : 'SUCCESS');
          }
          triggerHaptic(isExcessive ? 'ERROR' : isOverDuplicateLimit ? 'WARN' : isDuplicate ? 'WARN' : targetStatus === 'LATE' ? 'WARN' : 'SUCCESS');

          const isEng = isEnglishPractitioner(reg);
          let badgeTitle = '';
          let badgeTitleEn = '';
          let subNote = '';
          let subNoteEn = '';
          let msg = '';

          if (isExcessive) {
            badgeTitle = '🚨 ไม่ตั้งใจปฏิบัติ (สแกนเกิน 3 ครั้ง)';
            badgeTitleEn = '🚨 Unmindful Flag (>3 Scans)';
            subNote = `สแกนซ้ำผิดปกติ ${scanCount} ครั้งในรอบนี้`;
            subNoteEn = `Flagged: Unmindful Practice (${scanCount} scans in session)`;
            msg = isEng
              ? `🚨 Flagged: Unmindful Practice (${reg.studentName} scanned #${scanCount})`
              : `🚨 บันทึก: ไม่ตั้งใจปฏิบัติ! (${reg.studentName} สแกนซ้ำเกิน 3 ครั้ง • ครั้งที่ ${scanCount})`;
          } else if (isOverDuplicateLimit) {
            badgeTitle = `⚠️ สแกนซ้ำครั้งที่ ${scanCount} • เชิญท่านต่อไป`;
            badgeTitleEn = `⚠️ Repeated Scan #${scanCount} • Next, please`;
            subNote = `สแกนซ้ำเกิน 2 ครั้ง • เชิญท่านต่อไป`;
            subNoteEn = `Repeated scan • Next participant, please`;
            msg = isEng
              ? `⚠️ Repeated Scan #${scanCount}: ${reg.studentName} • Next, please`
              : `⚠️ บันทึกว่าสแกนซ้ำ (ครั้งที่ ${scanCount}): ${reg.studentName} • เชิญท่านต่อไป`;
          } else if (isDuplicate) {
            badgeTitle = 'ℹ️ เช็คชื่อแล้ว • เชิญท่านต่อไป';
            badgeTitleEn = 'ℹ️ Already Checked • Next, please';
            subNote = `เช็คชื่อไปแล้วเมื่อ ${data.firstCheckInTime || checkInTime} น. • เชิญท่านต่อไป`;
            subNoteEn = `Already checked at ${data.firstCheckInTime || checkInTime} • Next, please`;
            msg = isEng
              ? `ℹ️ Already checked: ${reg.studentName} (${data.firstCheckInTime || checkInTime}) • Next, please`
              : `ℹ️ เช็คชื่อแล้ว: ${reg.studentName} (${data.firstCheckInTime || checkInTime} น.) • เชิญท่านต่อไป`;
          } else if (targetStatus === 'LATE') {
            badgeTitle = '⚠️ เรียบร้อย (มาสาย) • เชิญท่านต่อไป';
            badgeTitleEn = '⚠️ Recorded (Late) • Next, please';
            subNote = `บันทึกเวลาปฏิบัติธรรมเรียบร้อย • เชิญท่านต่อไป`;
            subNoteEn = `Attendance recorded (Late) • Next participant, please`;
            msg = isEng
              ? `⚠️ Recorded (Late): ${reg.studentName}${lateNote} • Next, please`
              : `⚠️ เรียบร้อย (มาสาย): ${reg.studentName}${lateNote} • เชิญท่านต่อไป`;
          } else {
            badgeTitle = '✓ เรียบร้อย • เชิญท่านต่อไป';
            badgeTitleEn = '✓ Done • Next, please';
            subNote = `บันทึกเวลาเข้าปฏิบัติธรรมเรียบร้อย • เชิญท่านต่อไป`;
            subNoteEn = `Attendance recorded successfully • Next participant, please`;
            msg = isEng
              ? `✓ Done! ${reg.studentName} • Next, please`
              : `✓ เรียบร้อย • เชิญท่านต่อไป: ${reg.studentName}`;
          }

          if (isWrongGroup) {
            const wrongMsg = isEng
              ? ` ⚠️ (Note: Student belongs to Group ${regGroup || '-'})`
              : ` ⚠️ (สังเกต: นิสิตสังกัดกลุ่มที่ ${regGroup || '-'})`;
            msg += wrongMsg;
          }

          setLastFeedback({
            type: isOverDuplicateLimit ? 'WARN' : isDuplicate ? 'WARN' : targetStatus === 'LATE' ? 'WARN' : 'SUCCESS',
            message: msg,
            student: reg,
            time: checkInTime,
            isDuplicate,
            scanCount,
            isOverDuplicateLimit,
            firstCheckInTime: data.firstCheckInTime,
            status: targetStatus,
            badgeTitle,
            badgeTitleEn,
            subNote,
            subNoteEn,
            isEnglish: isEng,
          });

          // Add to recent scans list
          setRecentScans((prev) => [
            {
              id: `${reg.id}-${nowTs}`,
              studentCode: reg.studentCode,
              studentName: reg.studentName,
              groupNumber: regGroup,
              vasa: reg.vasa,
              period: selectedPeriod,
              time: checkInTime,
              status: targetStatus,
              isDuplicate,
              scanCount,
              isOverDuplicateLimit,
            },
            ...prev.slice(0, 19),
          ]);

          if (onCheckInRecorded) {
            onCheckInRecorded();
          }

          // Pacing cooldown: Show recorded notification for 1.8s then switch back to READY
          setKioskState('SUCCESS_COOLDOWN');
          kioskStateRef.current = 'SUCCESS_COOLDOWN';
          if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
          cooldownTimerRef.current = setTimeout(() => {
            setKioskState('READY');
            kioskStateRef.current = 'READY';
          }, 1800);
        } else {
          if (soundEnabled) playBeep('ERROR');
          triggerHaptic('ERROR');
          const notFoundTitle = '❌ ไม่พบรหัสนิสิต • ติดต่อเจ้าหน้าที่';
          const notFoundTitleEn = '❌ Not Found • Contact Staff';
          const notFoundSub = `รหัส ${cleanCode} ไม่มีในทะเบียนโครงการ • ติดต่อโต๊ะลงทะเบียน`;
          const notFoundSubEn = `Code ${cleanCode} not registered • Please contact staff desk`;

          setLastFeedback({
            type: 'ERROR',
            message: `❌ ไม่พบรหัสนิสิต (${cleanCode}) • กรุณาติดต่อเจ้าหน้าที่`,
            badgeTitle: notFoundTitle,
            badgeTitleEn: notFoundTitleEn,
            subNote: notFoundSub,
            subNoteEn: notFoundSubEn,
            scannedCode: cleanCode,
          });

          setKioskState('ERROR_COOLDOWN');
          kioskStateRef.current = 'ERROR_COOLDOWN';
          if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
          cooldownTimerRef.current = setTimeout(() => {
            setKioskState('READY');
            kioskStateRef.current = 'READY';
          }, 2200);
        }
      } catch (err: unknown) {
        // Fallback to offline queue if practitioner is found in local uniqueRegistrations prop
        const localReg = uniqueRegistrations.find(
          (r) =>
            r.studentCode?.toLowerCase() === cleanCode.toLowerCase() ||
            (r.groupSpecificCode && r.groupSpecificCode.toLowerCase() === cleanCode.toLowerCase()) ||
            r.id === cleanCode
        );

        if (localReg) {
          const isEng = isEnglishPractitioner(localReg);
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
            message: isEng
              ? `✓ Done (Offline Saved): ${localReg.studentName} • Next, please`
              : `✓ บันทึกเรียบร้อย (โหมดออฟไลน์): ${localReg.studentName} • เชิญท่านต่อไป`,
            student: localReg,
            time: checkInTime,
            status: targetStatus,
            badgeTitle: '✓ บันทึกเรียบร้อย (ออฟไลน์) • เชิญท่านต่อไป',
            badgeTitleEn: '✓ Done (Offline) • Next, please',
            subNote: 'บันทึกในเครื่องแล้ว รอเชื่อมต่อเน็ต • เชิญท่านต่อไป',
            subNoteEn: 'Saved locally, pending sync • Next, please',
            isEnglish: isEng,
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

          setKioskState('SUCCESS_COOLDOWN');
          kioskStateRef.current = 'SUCCESS_COOLDOWN';
          if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
          cooldownTimerRef.current = setTimeout(() => {
            setKioskState('READY');
            kioskStateRef.current = 'READY';
          }, 1800);
        } else {
          if (soundEnabled) playBeep('ERROR');
          triggerHaptic('ERROR');
          const notFoundTitle = '⚠️ กรุณาสแกนใหม่ หรือ ติดต่อเจ้าหน้าที่';
          const notFoundTitleEn = '⚠️ Please scan again or contact staff';
          const notFoundSub = `อ่าน QR Code ไม่สำเร็จ หรือ ไม่พบรหัส (${cleanCode}) • กรุณาถือใกล้/นิ่งขึ้น หรือติดต่อเจ้าหน้าที่`;
          const notFoundSubEn = `QR unreadable or code (${cleanCode}) not found • Hold closer or contact staff`;

          setLastFeedback({
            type: 'ERROR',
            message: `⚠️ กรุณาสแกนใหม่ (ถือใกล้/นิ่งขึ้น) หรือ ติดต่อเจ้าหน้าที่`,
            badgeTitle: notFoundTitle,
            badgeTitleEn: notFoundTitleEn,
            subNote: notFoundSub,
            subNoteEn: notFoundSubEn,
            scannedCode: cleanCode,
          });

          setKioskState('ERROR_COOLDOWN');
          kioskStateRef.current = 'ERROR_COOLDOWN';
          if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
          cooldownTimerRef.current = setTimeout(() => {
            setKioskState('READY');
            kioskStateRef.current = 'READY';
          }, 2200);
        }
      } finally {
        setIsSubmitting(false);
        isSubmittingRef.current = false;
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
      soundEnabled,
      onCheckInRecorded,
      uniqueRegistrations,
      offlineQueue,
      OFFLINE_QUEUE_KEY,
      evalMode,
      periodPolicies,
      lateGraceMinutes,
      scannerOfficerName,
      selectedGroup,
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
        // Only detect when kiosk is ready and not currently submitting
        if (kioskStateRef.current === 'READY' && !isSubmittingRef.current) {
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
        ? uniqueRegistrations
        : uniqueRegistrations.filter((r) => {
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
  }, [uniqueRegistrations, dayKey, selectedPeriod, selectedGroup]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-1 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[98vh] sm:max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER (Compact on Mobile so Camera Scanner is immediately visible) */}
        <div className="px-3.5 py-2.5 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                <span>LIVE SCANNER</span>
              </span>
              {/* Online / Offline Sync Badge */}
              {offlineQueue.length === 0 ? (
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
                  <span>รอซิงค์ {offlineQueue.length}</span>
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
            {/* Screen Lock / Prevent Accidental Exit Toggle */}
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
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
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
                  className="bg-transparent font-bold text-purple-950 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="ALL">ทุกกลุ่ม (All Groups)</option>
                  {availableGroups.map((g) => (
                    <option key={g} value={g}>
                      {formatGroupDisplay(g, registrations, event.meditationConfig?.groupAssignments?.[String(g)]?.groupName)}
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
                  className="bg-transparent font-bold text-amber-950 focus:outline-none cursor-pointer"
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

          {/* Collapsible Row: 4-Period Switcher (Single 4-Column Row on Mobile) */}
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
                    <span className="text-[10px] font-mono opacity-80 hidden md:inline">({conf.timeRange})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Advanced Controls (Hidden by default on mobile to keep camera visible) */}
          {!isToolbarCollapsed && showAdvancedControls && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200 animate-in fade-in duration-150">
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
                  className="w-36 text-xs font-bold text-slate-800 outline-none"
                />
              </div>

              {/* Evaluation Mode Switcher (AUTO vs MANUAL) */}
              <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEvalMode('AUTO')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    evalMode === 'AUTO'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Timer className="w-3 h-3" />
                  <span>ตัดสายอัตโนมัติ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEvalMode('MANUAL')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    evalMode === 'MANUAL'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>เลือกสถานะเอง</span>
                </button>
              </div>

              {/* If AUTO: Late Threshold Dropdown */}
              {evalMode === 'AUTO' ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-amber-950">
                    <span className="font-bold text-[11px]">เกิน</span>
                    <select
                      value={lateGraceMinutes}
                      onChange={(e) => setLateGraceMinutes(parseInt(e.target.value, 10))}
                      className="px-1 py-0.5 bg-white rounded border border-amber-300 font-extrabold text-amber-900 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value={5}>5 นาที</option>
                      <option value={10}>10 นาที</option>
                      <option value={15}>15 นาที</option>
                      <option value={20}>20 นาที</option>
                      <option value={30}>30 นาที</option>
                      <option value={45}>45 นาที</option>
                      <option value={60}>60 นาที</option>
                    </select>
                    <span className="text-[11px] font-bold">= สาย</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowConfigDrawer((v) => !v)}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition flex items-center gap-1"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                    <span>{showConfigDrawer ? 'ซ่อนตั้งเวลา' : '⚙️ เวลาเริ่มรอบ'}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
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
        <ScannerPolicyDrawer
          isOpen={showConfigDrawer}
          onClose={() => setShowConfigDrawer(false)}
          selectedPeriod={selectedPeriod}
          periodPolicies={periodPolicies}
          setPeriodPolicies={setPeriodPolicies}
        />

        {/* BODY AREA */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">
          
          {/* LEFT COLUMN: CAMERA FEED & SCANNER INPUT (7 COLS) */}
          <div className="lg:col-span-7 space-y-3">
            
            {/* Camera Scanner Box (Placed FIRST so it is immediately visible on mobile without scrolling) */}
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
                      <div className="text-sm sm:text-base font-black text-white">⏳ กำลังบันทึกข้อมูล...</div>
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
                            ? (lastFeedback.badgeTitleEn || lastFeedback.badgeTitle)
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
                            <span className="font-sans font-semibold">กลุ่ม {lastFeedback.student.groupNumber}</span>
                          )}
                          {lastFeedback.student.seatNumber && (
                            <span className="font-sans font-semibold bg-white/20 px-1 rounded">ที่นั่ง {lastFeedback.student.seatNumber}</span>
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

            {/* KIOSK LIVE READINESS & RESULT BANNER (Prominently displayed below camera) */}
            {kioskState === 'SAVING' ? (
              <div className="bg-blue-50 border-2 border-blue-400/90 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-xs animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-blue-700">กำลังประมวลผล • Processing</div>
                  <div className="text-sm sm:text-base font-black text-blue-950">⏳ กำลังบันทึกข้อมูล... • Saving...</div>
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
                          ? (lastFeedback.badgeTitleEn || lastFeedback.badgeTitle)
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
                        <span>• {lastFeedback.isEnglish ? `Group ${lastFeedback.student.groupNumber}` : `กลุ่ม ${lastFeedback.student.groupNumber}`}</span>
                      )}
                      {lastFeedback.student?.seatNumber && (
                        <span>• {lastFeedback.isEnglish ? `Seat ${lastFeedback.student.seatNumber}` : `ที่นั่ง ${lastFeedback.student.seatNumber}`}</span>
                      )}
                      {lastFeedback.time && (
                        <span>• {lastFeedback.isEnglish ? `Time ${lastFeedback.time}` : `เวลา ${lastFeedback.time} น.`}</span>
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
                    {lastFeedback?.isEnglish ? 'Alert / Notification' : 'แจ้งเตือน'}
                  </div>
                  <div className="text-sm sm:text-base font-black text-rose-950">
                    {lastFeedback?.isEnglish
                      ? (lastFeedback.badgeTitleEn || lastFeedback.message)
                      : (lastFeedback?.badgeTitle || lastFeedback?.message || '✗ ไม่พบข้อมูลนิสิต')}
                  </div>
                  {lastFeedback?.subNote && (
                    <div className="text-xs text-rose-700 font-semibold mt-0.5">
                      {lastFeedback.isEnglish ? (lastFeedback.subNoteEn || lastFeedback.subNote) : lastFeedback.subNote}
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

            {/* Hardware Scanner & Fast Input Box (Compact single-line under Camera) */}
            <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-2.5 sm:p-3.5 shadow-2xs">
              <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="ยิงปืนบาร์โค้ด หรือพิมพ์รหัส (เช่น T307, 6501...)..."
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-purple-300 font-mono text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !inputCode.trim()}
                  className="px-3.5 sm:px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
                >
                  {isSubmitting ? 'บันทึก...' : 'เช็คชื่อ'}
                </button>
              </form>
            </div>

            {/* LIVE FEEDBACK CARD */}
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
                          ? (lastFeedback.badgeTitleEn || lastFeedback.badgeTitle)
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
                          <span>{lastFeedback.time} {lastFeedback.isEnglish ? '' : 'น.'}</span>
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
          <ScannerSidePanel
            rightPanelTab={rightPanelTab}
            setRightPanelTab={setRightPanelTab}
            recentScans={recentScans}
            onClearRecentScans={() => setRecentScans([])}
            groupRegistrations={groupRegistrations}
            dayKey={dayKey}
            selectedPeriod={selectedPeriod}
            checklistSearch={checklistSearch}
            setChecklistSearch={setChecklistSearch}
            onOverrideStudentStatus={handleOverrideStudentStatus}
            onProcessScanCode={processScanCode}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
