'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import type { StudentEvent, EventRegistration, MeditationPeriodConfig } from '@/types/event';
import { playBeep, triggerHaptic } from '@/lib/utils/audio-feedback';
import { getAuthUser } from '@/lib/auth-client';
import jsQR from 'jsqr';
import {
  type PeriodKey,
  type ScannerRecentItem,
  type BarcodeDetectorInstance,
  type ScannerFeedback,
  PERIOD_CONFIG,
  autoDetectPeriod,
} from './types';

export interface UseVipassanaLiveScannerOptions {
  isOpen: boolean;
  event: StudentEvent;
  registrations: EventRegistration[];
  onCheckInRecorded?: () => void;
}

export function useVipassanaLiveScanner({
  isOpen,
  event,
  registrations,
  onCheckInRecorded,
}: UseVipassanaLiveScannerOptions) {
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



  return {
    selectedDayNumber,
    setSelectedDayNumber,
    selectedPeriod,
    setSelectedPeriod,
    statusMode,
    setStatusMode,
    soundEnabled,
    setSoundEnabled,
    evalMode,
    setEvalMode,
    lateGraceMinutes,
    setLateGraceMinutes,
    showConfigDrawer,
    setShowConfigDrawer,
    isToolbarCollapsed,
    setIsToolbarCollapsed,
    showAdvancedControls,
    setShowAdvancedControls,
    isScreenLocked,
    setIsScreenLocked,
    periodPolicies,
    setPeriodPolicies,
    uniqueRegistrations,
    inputCode,
    setInputCode,
    isSubmitting,
    kioskState,
    recentScans,
    setRecentScans,
    lastFeedback,
    setLastFeedback,
    isCameraActive,
    setIsCameraActive,
    cameraFacing,
    setCameraFacing,
    cameraError,
    videoRef,
    canvasRef,
    inputRef,
    selectedGroup,
    setSelectedGroup,
    rightPanelTab,
    setRightPanelTab,
    checklistSearch,
    setChecklistSearch,
    availableGroups,
    scannerOfficerName,
    setScannerOfficerName,
    offlineQueue,
    syncOfflineQueue,
    isSyncingOffline,
    dayKey,
    groupRegistrations,
    stats,
    handleFormSubmit,
    processScanCode,
    handleOverrideStudentStatus,
  };
}
