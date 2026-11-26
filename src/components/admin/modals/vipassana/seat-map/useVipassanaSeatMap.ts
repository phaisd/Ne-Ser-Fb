'use client';

import { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import type { StudentEvent, EventRegistration, EventSeatingConfig, SeatZone } from '@/types/event';
import {
  generateZoneSeatCodes,
  detectParticipantStatus,
  normalizeSeatCode,
  STATUS_THEMES,
  type ParticipantStatusCategory,
} from '@/services/events/seatingUtils';
import { parseXlsxBuffer } from '@/lib/utils/xlsx-import';
import {
  INSPECTION_PERIODS,
  type InspectionPeriodKey,
  ZONE_COLORS,
  parseSeatCode,
  formatSeatCode,
  getSeatsInRectangle,
  exportSeatingXlsx,
  exportSeatingCsv,
  downloadBlankTemplate,
} from './index';

export interface UseVipassanaSeatMapOptions {
  event: StudentEvent;
  rawRegistrations?: EventRegistration[];
  onRefresh: () => void;
  onClose: () => void;
}

export function useVipassanaSeatMap({
  event,
  rawRegistrations,
  onRefresh,
  onClose,
}: UseVipassanaSeatMapOptions) {
  // Strictly deduplicate registrations by eventId + studentCode
  const registrations: EventRegistration[] = useMemo(() => {
    const seen = new Set<string>();
    return (rawRegistrations || []).filter((r: EventRegistration) => {
      if (event?.id && r.eventId && r.eventId !== event.id) return false;
      const sCode = (r.studentCode || r.id || '').trim().toLowerCase();
      const key = `${r.eventId || event?.id || ''}_${sCode}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rawRegistrations, event?.id]);
  // Current Seating Config
  const [config, setConfig] = useState<EventSeatingConfig>(() => {
    if (event.seatingConfig && event.seatingConfig.zones && event.seatingConfig.zones.length > 0) {
      return event.seatingConfig;
    }
    // Default 1 zone: 12 rows x 15 cols = 180 seats
    return {
      enabled: true,
      layoutType: 'GRID',
      venueName: event.location || 'อาคาร มวก. 48 พรรษา คณะพุทธศาสตร์ มจร',
      roomName: 'หอประชุมใหญ่',
      zones: [
        {
          id: 'zone-a',
          name: 'โซน A (พระภิกษุ - สามเณร)',
          color: 'amber',
          rows: 10,
          cols: 15,
          prefix: '',
          description: 'ฝั่งด้านหน้า / ทิศตะวันออก',
        },
      ],
      disabledSeats: [],
      updatedAt: new Date().toISOString(),
    };
  });

  const [activeZoneId, setActiveZoneId] = useState<string>('ALL');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [autoSortBy, setAutoSortBy] = useState<
    'STATUS_GENDER' | 'STATUS_INTER' | 'VASSA' | 'MAX_CAPACITY' | 'GROUP' | 'STUDENT_CODE' | 'NAME'
  >('STATUS_GENDER');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Manual assign target student
  const [assignTargetStudentCode, setAssignTargetStudentCode] = useState<string>('');

  // Excel / CSV Import & Export Modal State
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [importExportTab, setImportExportTab] = useState<'EXPORT' | 'IMPORT'>('EXPORT');

  // Print A4 Seating Chart Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importRawText, setImportRawText] = useState('');
  const [importPreviewRows, setImportPreviewRows] = useState<
    Array<{
      studentCode: string;
      studentName: string;
      seatNumber: string;
      seatZone: string;
      vasa?: string;
      role?: string;
      seatCheckedIn?: boolean;
      checkinText?: string;
      status: 'VALID' | 'DUPLICATE_SEAT' | 'NOT_FOUND';
      statusNote?: string;
    }>
  >([]);
  const [isImporting, setIsImporting] = useState(false);
  const [resetExistingSeats, setResetExistingSeats] = useState<boolean>(true);

  // Batch Seat Selection State (โหมดเลือกหลายที่นั่ง / จัดการกลุ่มทางเดินและเสา)
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [lastClickedSeat, setLastClickedSeat] = useState<string | null>(null);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState<boolean>(false);


  // Daily & Period Seat Inspection State (ตรวจเช็คที่นั่งรายวัน/สุ่มรอบ)
  const totalDays = useMemo(() => {
    if (event.totalDays && event.totalDays > 0) return event.totalDays;
    if (event.startDate && event.endDate) {
      const s = new Date(event.startDate).getTime();
      const e = new Date(event.endDate).getTime();
      const diff = Math.round((e - s) / 86400000) + 1;
      if (diff > 0 && diff <= 30) return diff;
    }
    return 10;
  }, [event.totalDays, event.startDate, event.endDate]);

  const [inspectionDay, setInspectionDay] = useState<number | 'ALL'>('ALL');
  const [inspectionPeriod, setInspectionPeriod] = useState<InspectionPeriodKey>(() => {
    const now = new Date();
    const curMin = now.getHours() * 60 + now.getMinutes();
    if (curMin < 6 * 60) return 'p1';
    if (curMin < 12 * 60) return 'p2';
    if (curMin < 17 * 60) return 'p3';
    return 'p4';
  });
  const [isSavingInspection, setIsSavingInspection] = useState(false);
  const [isAbsentReportOpen, setIsAbsentReportOpen] = useState(false);

  // Mobile QR Code Modal State
  const [isMobileQrOpen, setIsMobileQrOpen] = useState(false);
  const [mobileScannerQrDataUrl, setMobileScannerQrDataUrl] = useState('');
  const [mobileSeatingQrDataUrl, setMobileSeatingQrDataUrl] = useState('');
  const [copiedMobileUrl, setCopiedMobileUrl] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const mobileSeatScanUrl = event
    ? `${origin}/admin?tab=EVENTS&eventId=${encodeURIComponent(event.id)}&action=SEAT_SCAN`
    : '';
  const mobilePublicSeatingUrl = event
    ? `${origin}/events/seating?eventId=${encodeURIComponent(event.id)}`
    : '';

  useEffect(() => {
    if (!isMobileQrOpen || !event) return;
    let active = true;

    Promise.all([
      QRCode.toDataURL(mobileSeatScanUrl, {
        width: 380,
        margin: 1,
        color: { dark: '#047857', light: '#ffffff' },
      }),
      QRCode.toDataURL(mobilePublicSeatingUrl, {
        width: 380,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      }),
    ])
      .then(([scannerQr, seatingQr]) => {
        if (!active) return;
        setMobileScannerQrDataUrl(scannerQr);
        setMobileSeatingQrDataUrl(seatingQr);
      })
      .catch((err) => console.error('Failed to generate mobile seating QR:', err));

    return () => {
      active = false;
    };
  }, [isMobileQrOpen, event, mobileSeatScanUrl, mobilePublicSeatingUrl]);

  const handleCopyMobileUrl = async (url: string, key: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedMobileUrl(key);
      setTimeout(() => setCopiedMobileUrl(null), 2500);
    } catch {
      alert('ไม่สามารถคัดลอกได้');
    }
  };

  // Sync state if event prop changes
  useEffect(() => {
    if (event.seatingConfig && event.seatingConfig.zones && event.seatingConfig.zones.length > 0) {
      setConfig(event.seatingConfig);
    }
  }, [event]);

  // Index registrations by seatNumber
  const seatOccupantMap = useMemo(() => {
    const map = new Map<string, EventRegistration>();
    registrations.forEach((r) => {
      if (r.seatNumber) {
        const raw = r.seatNumber.trim().toUpperCase();
        map.set(raw, r);
        const norm = normalizeSeatCode(raw);
        if (norm) {
          map.set(norm, r);
        }
      }
    });
    return map;
  }, [registrations]);

  // Calculate stats
  const stats = useMemo(() => {
    let totalGridSlots = 0;
    const disabledSet = new Set((config.disabledSeats || []).map((s) => s.trim().toUpperCase()));

    config.zones.forEach((z) => {
      totalGridSlots += z.rows * z.cols;
    });

    const activeSeats = totalGridSlots - disabledSet.size;
    const assignedCount = registrations.filter((r) => Boolean(r.seatNumber)).length;
    const checkedInCount = registrations.filter((r) => Boolean(r.seatNumber && r.seatCheckinAt)).length;
    const unassignedCount = Math.max(0, registrations.length - assignedCount);

    const statusCounts: Record<ParticipantStatusCategory, number> = {
      MONK: 0,
      BHIKKHUNI: 0,
      SAMANERA: 0,
      MAECHI: 0,
      LAY_MALE: 0,
      LAY_FEMALE: 0,
      UNKNOWN: 0,
    };

    registrations.forEach((r) => {
      if (r.seatNumber) {
        const cat = detectParticipantStatus(r.studentName, r.role).category;
        statusCounts[cat] = (statusCounts[cat] || 0) + 1;
      }
    });

    return {
      totalCapacity: activeSeats,
      totalParticipants: registrations.length,
      assignedCount,
      checkedInCount,
      vacantCount: Math.max(0, activeSeats - assignedCount),
      disabledCount: disabledSet.size,
      unassignedCount,
      statusCounts,
    };
  }, [config, registrations]);

  // Daily & Period Inspection Stats & Absent from Seat List
  const dailyStats = useMemo(() => {
    if (inspectionDay === 'ALL') return null;
    const dayKey = `day_${inspectionDay}`;

    const absentList: Array<{
      reg: EventRegistration;
      seatNumber: string;
      scanTime?: string;
    }> = [];

    let scannedTotal = 0;
    let presentInSeat = 0;
    let absentFromSeat = 0;
    let unscannedPresent = 0;
    let notScanned = 0;

    registrations.forEach((r) => {
      if (!r.seatNumber) return;
      const att = r.dailyAttendance?.[dayKey]?.[inspectionPeriod];
      const isScanned = Boolean(att && (att.status === 'PRESENT' || att.status === 'LATE' || att.checkInTime));
      const occ = att?.seatOccupied;

      if (isScanned) {
        scannedTotal++;
        if (occ === false) {
          absentFromSeat++;
          absentList.push({
            reg: r,
            seatNumber: r.seatNumber,
            scanTime: att?.checkInTime,
          });
        } else if (occ === true) {
          presentInSeat++;
        }
      } else {
        if (occ === true) {
          unscannedPresent++;
        } else {
          notScanned++;
        }
      }
    });

    return {
      dayKey,
      scannedTotal,
      presentInSeat,
      absentFromSeat,
      unscannedPresent,
      notScanned,
      absentList,
    };
  }, [registrations, inspectionDay, inspectionPeriod]);

  // Handle Save Seat Inspection for a single seat
  const handleSaveSeatInspection = async (
    target: { registrationId?: string; studentCode?: string; seatNumber?: string },
    seatOccupied: boolean | null
  ) => {
    if (inspectionDay === 'ALL') return;
    setIsSavingInspection(true);
    try {
      const dayKey = `day_${inspectionDay}`;
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_daily_seat_inspection',
          eventId: event.id,
          dayKey,
          periodKey: inspectionPeriod,
          records: [{ ...target, seatOccupied }],
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      setMessage({
        text:
          seatOccupied === false
            ? '🚨 บันทึกที่นั่งว่าง (ไม่อยู่ที่นั่ง) เรียบร้อย'
            : seatOccupied === true
            ? '✓ บันทึกว่าอยู่ที่นั่งปกติ เรียบร้อย'
            : 'ล้างสถานะการตรวจรอบนี้เรียบร้อย',
        type: 'success',
      });
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'เกิดข้อผิดพลาดในการบันทึก', type: 'error' });
    } finally {
      setIsSavingInspection(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Handle Batch Mark All Scanned Students as Occupied
  const handleMarkAllScannedOccupied = async () => {
    if (inspectionDay === 'ALL') return;
    const dayKey = `day_${inspectionDay}`;

    const scannedInRegs = registrations.filter((r) => {
      if (!r.seatNumber) return false;
      const att = r.dailyAttendance?.[dayKey]?.[inspectionPeriod];
      return Boolean(att && (att.status === 'PRESENT' || att.status === 'LATE' || att.checkInTime));
    });

    if (scannedInRegs.length === 0) {
      alert(
        `ยังไม่พบข้อมูลผู้สแกนเข้าในรอบนี้ (วันที่ ${inspectionDay} • ${
          INSPECTION_PERIODS.find((p) => p.id === inspectionPeriod)?.nameTh
        })`
      );
      return;
    }

    if (
      !confirm(
        `ยืนยันตั้งค่าผู้สแกนเข้าทั้งหมด ${scannedInRegs.length} ท่านว่า "อยู่ที่นั่งครบ"?\n\nหลังจากกดแล้ว ท่านสามารถดูผังและแตะเฉพาะเก้าอี้/เบาะที่ว่างได้ทันที`
      )
    ) {
      return;
    }

    setIsSavingInspection(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_daily_seat_inspection',
          eventId: event.id,
          dayKey,
          periodKey: inspectionPeriod,
          records: scannedInRegs.map((r) => ({
            registrationId: r.id,
            studentCode: r.studentCode,
            seatNumber: r.seatNumber,
            seatOccupied: true,
          })),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      setMessage({
        text: `✓ ตั้งค่าผู้สแกนแล้ว ${scannedInRegs.length} ท่านว่า "อยู่ที่นั่ง" เรียบร้อย ท่านสามารถแตะเฉพาะที่นั่งว่างได้เลย`,
        type: 'success',
      });
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'เกิดข้อผิดพลาด', type: 'error' });
    } finally {
      setIsSavingInspection(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // Handle Save Seating Config
  const handleSaveConfig = async (newConfig: EventSeatingConfig) => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_seating_config',
          eventId: event.id,
          config: newConfig,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      setConfig(newConfig);
      setMessage({ text: 'บันทึกการตั้งค่าผังที่นั่งเรียบร้อยแล้ว', type: 'success' });
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'เกิดข้อผิดพลาดในการบันทึก', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Handle Auto Assign Seats
  const handleAutoAssign = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_seats_auto',
          eventId: event.id,
          options: { sortBy: autoSortBy },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'จัดที่นั่งไม่สำเร็จ');
      setMessage({ text: data.message || 'จัดที่นั่งอัตโนมัติสำเร็จ', type: 'success' });
      setIsAssignModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'เกิดข้อผิดพลาด', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  // Handle Clear All Seats
  const handleClearAllSeats = async () => {
    if (!confirm('ยืนยันล้างข้อมูลการจัดที่นั่งทั้งหมดของโครงการนี้?')) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear_event_seats',
          eventId: event.id,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'ล้างที่นั่งไม่สำเร็จ');
      setMessage({ text: data.message || 'ล้างที่นั่งทั้งหมดเรียบร้อยแล้ว', type: 'success' });
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'เกิดข้อผิดพลาด', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Handle Reset / Deduplicate Registrations
  const [isDeduplicating, setIsDeduplicating] = useState(false);
  const handleDeduplicateRegistrations = async () => {
    if (!confirm('ยืนยันรีเซ็ตและล้างข้อมูลผู้เข้าร่วมที่ซ้ำซ้อนในโครงการนี้? (ระบบจะรวมและเก็บข้อมูลที่นั่งและการตรวจเช็คเดิมไว้)')) return;
    setIsDeduplicating(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deduplicate_registrations',
          eventId: event.id,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'รีเซ็ตข้อมูลซ้ำซ้อนไม่สำเร็จ');
      setMessage({
        text: data.message || `รีเซ็ตข้อมูลสำเร็จ คงเหลือผู้เข้าร่วม ${data.data?.totalRemaining || 309} คน`,
        type: 'success',
      });
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล', type: 'error' });
    } finally {
      setIsDeduplicating(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // ==================== EXCEL & CSV EXPORT / IMPORT ====================

  // Export Seating to Excel (.xlsx)
  const handleExportSeatingXlsx = () => {
    exportSeatingXlsx(event, config, registrations);
  };

  // Export Seating to CSV (.csv)
  const handleExportSeatingCsv = () => {
    exportSeatingCsv(event, registrations);
  };

  // Download Blank Excel Template
  const handleDownloadBlankTemplate = () => {
    downloadBlankTemplate();
  };

  // Parse Matrix to Preview Rows
  const processImportMatrix = (matrix: string[][]) => {
    if (matrix.length === 0) {
      setImportPreviewRows([]);
      return;
    }

    let headerIdx = 0;
    let codeCol = -1;
    let groupCodeCol = -1;
    let seatCol = -1;
    let zoneCol = -1;
    let nameCol = -1;
    let checkinCol = -1;
    let vasaCol = -1;
    let roleCol = -1;

    for (let i = 0; i < Math.min(6, matrix.length); i++) {
      const row = matrix[i].map((c) => String(c || '').trim().toLowerCase());
      const cIdx = row.findIndex(
        (cell) =>
          cell === 'รหัสนิสิต' ||
          cell === 'studentcode' ||
          cell === 'code' ||
          cell === 'รหัส' ||
          (cell.includes('รหัส') && !cell.includes('กลุ่ม'))
      );
      const gIdx = row.findIndex(
        (cell) =>
          cell.includes('เลขเฉพาะกลุ่ม') ||
          cell.includes('รหัสเฉพาะกลุ่ม') ||
          cell.includes('รหัสกลุ่ม') ||
          cell.includes('groupspecificcode') ||
          cell.includes('groupcode')
      );
      const sIdx = row.findIndex(
        (cell) =>
          cell.includes('หมายเลขที่นั่ง') ||
          cell.includes('seatnumber') ||
          cell.includes('ที่นั่ง') ||
          cell === 'seat'
      );
      if ((cIdx !== -1 || gIdx !== -1) && sIdx !== -1) {
        headerIdx = i;
        codeCol = cIdx !== -1 ? cIdx : gIdx;
        groupCodeCol = gIdx;
        seatCol = sIdx;
        zoneCol = row.findIndex((cell) => cell.includes('โซน') || cell.includes('zone'));
        nameCol = row.findIndex((cell) => cell.includes('ชื่อ') || cell.includes('name'));
        checkinCol = row.findIndex(
          (cell) =>
            cell.includes('ตรวจเช็ค') ||
            cell.includes('เช็คอิน') ||
            cell.includes('checkin') ||
            cell.includes('เข้าที่นั่ง')
        );
        vasaCol = row.findIndex(
          (cell) => cell.includes('พรรษา') || cell === 'vasa' || cell === 'vassa' || cell.includes('vassa')
        );
        roleCol = row.findIndex(
          (cell) =>
            cell.includes('สถานภาพ') ||
            cell.includes('เพศ') ||
            cell === 'role' ||
            cell === 'status'
        );
        break;
      }
    }

    if (codeCol === -1 || seatCol === -1) {
      codeCol = 1;
      groupCodeCol = matrix[0] && matrix[0].length >= 3 ? 2 : -1;
      seatCol = matrix[0] && matrix[0].length >= 10 ? 9 : (matrix[0] ? matrix[0].length - 1 : -1);
      headerIdx = 0;
    }

    const normalizeName = (name: string) =>
      name
        .replace(/^(พระมหา|พระครู|พระ|สามเณร|แม่ชี|นาย|นางสาว|นาง|ดร\.)\s*/, '')
        .replace(/\s+/g, '')
        .toLowerCase();

    const regMap = new Map<string, EventRegistration>();
    registrations.forEach((r) => {
      if (r.studentCode) regMap.set(r.studentCode.trim().toLowerCase(), r);
      if (r.groupSpecificCode) regMap.set(r.groupSpecificCode.trim().toLowerCase(), r);
      if (r.studentName) {
        regMap.set(`name:${normalizeName(r.studentName)}`, r);
      }
    });

    const parsed: typeof importPreviewRows = [];
    const usedSeats = new Map<string, string>();

    for (let i = headerIdx + 1; i < matrix.length; i++) {
      const row = matrix[i];
      if (!row || row.length === 0) continue;

      const rawCode = codeCol !== -1 ? String(row[codeCol] || '').trim() : '';
      const rawGroupCode = groupCodeCol !== -1 ? String(row[groupCodeCol] || '').trim() : '';
      const rawName = nameCol !== -1 ? String(row[nameCol] || '').trim() : '';
      let rawSeat = seatCol !== -1 && row[seatCol] ? String(row[seatCol] || '').trim().toUpperCase() : '';
      if (rawSeat) {
        rawSeat = normalizeSeatCode(rawSeat);
      }
      const rawZone = zoneCol !== -1 && row[zoneCol] ? String(row[zoneCol]).trim() : '';
      // พรรษา: undefined = ไม่มีคอลัมน์ (ไม่แตะข้อมูลเดิม), '' = เว้นว่าง (ล้างค่า)
      let rawVasa: string | undefined = undefined;
      if (vasaCol !== -1) {
        const v = String(row[vasaCol] ?? '').replace(/\s*พรรษา$/g, '').trim();
        rawVasa = v === '-' ? '' : v;
      }
      const rawRole = roleCol !== -1 && row[roleCol] ? String(row[roleCol]).trim() : undefined;

      if (!rawCode && !rawGroupCode && !rawSeat) continue;
      if (rawCode.includes('รหัส') || rawCode.toLowerCase().includes('student')) continue;

      let seatCheckedIn: boolean | undefined = undefined;
      let checkinText = '';
      if (checkinCol !== -1 && row[checkinCol] !== undefined) {
        checkinText = String(row[checkinCol] || '').trim();
        const rawChk = checkinText.toLowerCase();
        if (
          rawChk.includes('เช็คอินแล้ว') ||
          rawChk.includes('เข้าที่นั่งแล้ว') ||
          rawChk === 'y' ||
          rawChk === 'yes' ||
          rawChk === '1' ||
          rawChk === 'true' ||
          rawChk === 'checked' ||
          rawChk === 'attended' ||
          rawChk === 'pass'
        ) {
          seatCheckedIn = true;
        } else if (
          rawChk.includes('ยังไม่') ||
          rawChk === 'n' ||
          rawChk === 'no' ||
          rawChk === '0' ||
          rawChk === 'false'
        ) {
          seatCheckedIn = false;
        }
      }

      let matchedReg = rawCode ? regMap.get(rawCode.toLowerCase()) : undefined;
      if (!matchedReg && rawGroupCode) {
        matchedReg = regMap.get(rawGroupCode.toLowerCase());
      }
      if (!matchedReg && rawName) {
        matchedReg = regMap.get(`name:${normalizeName(rawName)}`);
      }

      let status: 'VALID' | 'DUPLICATE_SEAT' | 'NOT_FOUND' = 'VALID';
      let statusNote = '';

      if (!matchedReg) {
        status = 'NOT_FOUND';
        statusNote = 'ไม่พบรหัสในโครงการนี้';
      } else if (rawSeat) {
        if (usedSeats.has(rawSeat)) {
          status = 'DUPLICATE_SEAT';
          statusNote = `ที่นั่งซ้ำกับรหัส ${usedSeats.get(rawSeat)}`;
        } else {
          usedSeats.set(rawSeat, rawCode || rawGroupCode);
        }
      }

      parsed.push({
        studentCode: matchedReg?.studentCode || rawCode || rawGroupCode,
        studentName: matchedReg?.studentName || (nameCol !== -1 ? row[nameCol] : '') || '-',
        seatNumber: rawSeat,
        seatZone: rawZone || matchedReg?.seatZone || '',
        vasa: rawVasa,
        role: rawRole || matchedReg?.role,
        seatCheckedIn,
        checkinText,
        status,
        statusNote,
      });
    }

    setImportPreviewRows(parsed);
  };

  // Handle File Upload (.xlsx or .csv)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    try {
      if (file.name.endsWith('.xlsx')) {
        const buffer = await file.arrayBuffer();
        const matrix = await parseXlsxBuffer(buffer);
        processImportMatrix(matrix);
      } else {
        const text = await file.text();
        setImportRawText(text);
        const matrix = text
          .split(/\r?\n/)
          .filter((line) => line.trim())
          .map((line) => {
            if (line.includes('\t')) return line.split('\t');
            const row: string[] = [];
            let inQuotes = false;
            let current = '';
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                row.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            row.push(current.trim());
            return row;
          });
        processImportMatrix(matrix);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message);
    }
  };

  // Handle Paste Text
  const handlePasteText = (text: string) => {
    setImportRawText(text);
    if (!text.trim()) {
      setImportPreviewRows([]);
      return;
    }
    const matrix = text
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line) => {
        if (line.includes('\t')) return line.split('\t');
        const row: string[] = [];
        let inQuotes = false;
        let current = '';
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            row.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        row.push(current.trim());
        return row;
      });
    processImportMatrix(matrix);
  };

  // Apply Imported Seating to System
  const handleApplyImportedSeating = async () => {
    const validRows = importPreviewRows.filter((r) => r.status !== 'NOT_FOUND');
    if (validRows.length === 0) {
      alert('ไม่พบรายการที่ถูกต้องสำหรับนำเข้า');
      return;
    }

    setIsImporting(true);
    try {
      // 1. Calculate required rows and columns from imported seat codes
      let maxRowIdx = 0;
      let maxColIdx = 0;
      let hasPrefixedZone = false;

      validRows.forEach((r) => {
        if (!r.seatNumber) return;
        const norm = normalizeSeatCode(r.seatNumber);
        // Single letter row: e.g. "A-01", "S-14"
        const singleMatch = norm.match(/^([A-Z])[-_](\d+)$/i);
        if (singleMatch) {
          const rowChar = singleMatch[1].toUpperCase();
          const rNum = rowChar.charCodeAt(0) - 64; // A=1, B=2, ..., S=19
          const cNum = parseInt(singleMatch[2], 10);
          if (rNum > maxRowIdx) maxRowIdx = rNum;
          if (cNum > maxColIdx) maxColIdx = cNum;
        } else {
          // Prefixed zone like "B-A-01" or numbered row like "1-01"
          const multiMatch = norm.match(/^([A-Z0-9]+)[-_]([A-Z]|\d+)[-_](\d+)$/i);
          if (multiMatch) {
            hasPrefixedZone = true;
            const rPart = multiMatch[2].toUpperCase();
            const rNum = /^[A-Z]$/.test(rPart) ? rPart.charCodeAt(0) - 64 : parseInt(rPart, 10);
            const cNum = parseInt(multiMatch[3], 10);
            if (rNum > maxRowIdx) maxRowIdx = rNum;
            if (cNum > maxColIdx) maxColIdx = cNum;
          }
        }
      });

      // 2. If imported seats require more rows/cols than current config, auto-expand and save seatingConfig
      if (maxRowIdx > 0 && config.zones.length > 0) {
        const firstZone = config.zones[0];
        const needMoreRows = maxRowIdx > firstZone.rows;
        const needMoreCols = maxColIdx > firstZone.cols;
        const needPrefixFix = !hasPrefixedZone && firstZone.prefix === 'A';

        if (needMoreRows || needMoreCols || needPrefixFix) {
          const updatedZones = config.zones.map((z, idx) => {
            if (idx === 0) {
              return {
                ...z,
                rows: Math.max(z.rows, maxRowIdx),
                cols: Math.max(z.cols, maxColIdx),
                prefix: needPrefixFix ? '' : (z.prefix || ''),
              };
            }
            return z;
          });

          const updatedConfig: EventSeatingConfig = {
            ...config,
            zones: updatedZones,
            updatedAt: new Date().toISOString(),
          };

          await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'save_seating_config',
              eventId: event.id,
              config: updatedConfig,
            }),
          });
          setConfig(updatedConfig);
        }
      }

      // 3. Save student seating assignments
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_import_seating',
          eventId: event.id,
          resetExistingSeats,
          rows: validRows.map((r) => ({
            studentCode: r.studentCode,
            seatNumber: r.seatNumber ? normalizeSeatCode(r.seatNumber) : undefined,
            seatZone: r.seatZone,
            vasa: r.vasa,
            role: r.role,
            seatCheckedIn: r.seatCheckedIn,
          })),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'นำเข้าไม่สำเร็จ');

      const assignedInFile = validRows.filter((r) => Boolean(r.seatNumber)).length;
      const unassignedInFile = validRows.length - assignedInFile;

      setMessage({
        text:
          data.message ||
          `บันทึกผังที่นั่งจากไฟล์สำเร็จ ${validRows.length} คน (มีที่นั่ง ${assignedInFile} คน${
            unassignedInFile > 0 ? `, ยังไม่มีที่นั่งในไฟล์ ${unassignedInFile} คน สามารถกด "จัดที่นั่งอัตโนมัติ" เพิ่มเติมได้` : ''
          })!`,
        type: 'success',
      });
      setIsImportExportModalOpen(false);
      setImportPreviewRows([]);
      setImportFileName('');
      setImportRawText('');
      onRefresh();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Toggle seat disabled (e.g. Aisle or Pillar)
  const handleToggleDisableSeat = async (seatCode: string) => {
    const disabled = new Set(config.disabledSeats || []);
    if (disabled.has(seatCode)) {
      disabled.delete(seatCode);
    } else {
      disabled.add(seatCode);
    }
    const newConfig = {
      ...config,
      disabledSeats: Array.from(disabled),
    };
    await handleSaveConfig(newConfig);
  };

  // Set seat representative status designation (e.g. MONK, MAECHI, etc.)
  const handleDesignateSeatStatus = async (seatCode: string, status: ParticipantStatusCategory | null) => {
    const designations = { ...(config.seatDesignations || {}) };
    const upperCode = seatCode.trim().toUpperCase();
    if (!status) {
      delete designations[upperCode];
    } else {
      designations[upperCode] = status;
    }
    const newConfig = {
      ...config,
      seatDesignations: designations,
    };
    await handleSaveConfig(newConfig);
  };

  // Set representative status designation for an entire row
  const handleDesignateRowStatus = async (
    zone: SeatZone,
    _rowChar: string,
    rIdx: number,
    status: ParticipantStatusCategory | null
  ) => {
    const designations = { ...(config.seatDesignations || {}) };

    for (let c = 0; c < zone.cols; c++) {
      const upperCode = formatSeatCode(zone, rIdx, c).toUpperCase();
      if (!status) {
        delete designations[upperCode];
      } else {
        designations[upperCode] = status;
      }
    }

    const newConfig = {
      ...config,
      seatDesignations: designations,
    };
    await handleSaveConfig(newConfig);
  };

  // Set representative status designation for an entire column
  const handleDesignateColStatus = async (
    zone: SeatZone,
    cIdx: number,
    status: ParticipantStatusCategory | null
  ) => {
    const designations = { ...(config.seatDesignations || {}) };

    for (let r = 0; r < zone.rows; r++) {
      const upperCode = formatSeatCode(zone, r, cIdx - 1).toUpperCase();
      if (!status) {
        delete designations[upperCode];
      } else {
        designations[upperCode] = status;
      }
    }

    const newConfig = {
      ...config,
      seatDesignations: designations,
    };
    await handleSaveConfig(newConfig);
  };

  // Toggle an entire column as Aisle / Walkway (ทางเดินและทางบิณฑบาตร)
  const handleToggleColAisle = async (zone: SeatZone, cIdx: number) => {
    const disabled = new Set(config.disabledSeats || []);

    let allDisabled = true;
    for (let r = 0; r < zone.rows; r++) {
      const seatCode = formatSeatCode(zone, r, cIdx - 1).toUpperCase();
      if (!disabled.has(seatCode)) {
        allDisabled = false;
        break;
      }
    }

    for (let r = 0; r < zone.rows; r++) {
      const seatCode = formatSeatCode(zone, r, cIdx - 1).toUpperCase();
      if (allDisabled) {
        disabled.delete(seatCode);
      } else {
        disabled.add(seatCode);
      }
    }

    const newConfig = {
      ...config,
      disabledSeats: Array.from(disabled),
    };
    await handleSaveConfig(newConfig);
  };



  // Seat Click Handler supporting Single Click, Shift+Click (Range), and Batch Selection
  const handleSeatClick = (seatCode: string, e: React.MouseEvent, zone: SeatZone) => {
    const upperCode = seatCode.toUpperCase();

    // 1. Shift + Click: Select rectangle between last clicked seat and this seat
    if (e.shiftKey && lastClickedSeat) {
      const box = getSeatsInRectangle(lastClickedSeat, upperCode, zone);
      setSelectedSeats((prev) => {
        const next = new Set(prev);
        box.forEach((s) => next.add(s));
        return next;
      });
      setLastClickedSeat(upperCode);
      setIsBatchMode(true);
      return;
    }

    // 2. Batch Selection Mode: Toggle this seat in/out of selection
    if (isBatchMode) {
      setSelectedSeats((prev) => {
        const next = new Set(prev);
        if (next.has(upperCode)) {
          next.delete(upperCode);
        } else {
          next.add(upperCode);
        }
        return next;
      });
      setLastClickedSeat(upperCode);
      return;
    }

    // 3. Normal Single Seat Click: Open seat details drawer
    setSelectedSeat(upperCode);
    setLastClickedSeat(upperCode);
  };

  // Batch Action: Disable Selected Seats (Make Aisle / Pillar)
  const handleBatchDisableSeats = async (seatsToDisable: string[]) => {
    if (seatsToDisable.length === 0) return;
    setIsSaving(true);
    try {
      const disabled = new Set((config.disabledSeats || []).map((s) => s.trim().toUpperCase()));
      const upperSeats = seatsToDisable.map((s) => s.trim().toUpperCase());
      upperSeats.forEach((s) => disabled.add(s));

      // Check if any of these seats currently has an occupant and unassign them so registrations stay safe
      const occupantsToClear: string[] = [];
      upperSeats.forEach((s) => {
        const occ = seatOccupantMap.get(s);
        if (occ && occ.id) {
          occupantsToClear.push(occ.id);
        }
      });

      if (occupantsToClear.length > 0) {
        for (const regId of occupantsToClear) {
          await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_participant_seat',
              registrationId: regId,
              seatNumber: null,
            }),
          }).catch(() => {});
        }
      }

      const newConfig: EventSeatingConfig = {
        ...config,
        disabledSeats: Array.from(disabled),
        updatedAt: new Date().toISOString(),
      };

      await handleSaveConfig(newConfig);
      setSelectedSeats(new Set());
      setIsBatchMode(false);
      setMessage({
        text: `กำหนดที่นั่ง ${upperSeats.length} ที่ เป็นทางเดิน/เสา เรียบร้อยแล้ว`,
        type: 'success',
      });
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'เกิดข้อผิดพลาดในการแปลงเป็นทางเดิน/เสา', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Batch Action: Restore Disabled Seats back to Normal Usable Seats
  const handleBatchEnableSeats = async (seatsToEnable: string[]) => {
    if (seatsToEnable.length === 0) return;
    setIsSaving(true);
    try {
      const disabled = new Set((config.disabledSeats || []).map((s) => s.trim().toUpperCase()));
      const upperSeats = seatsToEnable.map((s) => s.trim().toUpperCase());
      upperSeats.forEach((s) => disabled.delete(s));

      const newConfig: EventSeatingConfig = {
        ...config,
        disabledSeats: Array.from(disabled),
        updatedAt: new Date().toISOString(),
      };

      await handleSaveConfig(newConfig);
      setSelectedSeats(new Set());
      setIsBatchMode(false);
      setMessage({
        text: `คืนค่าที่นั่ง ${upperSeats.length} ที่ ให้กลับมาใช้งานได้ตามปกติเรียบร้อยแล้ว`,
        type: 'success',
      });
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'เกิดข้อผิดพลาดในการคืนค่าที่นั่ง', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Batch Action: Set representative status designation (พระภิกษุ, แม่ชี, ฯลฯ) for all selected seats
  const handleBatchDesignateStatus = async (
    seatsToDesignate: string[],
    status: ParticipantStatusCategory | null
  ) => {
    if (seatsToDesignate.length === 0) return;
    setIsSaving(true);
    try {
      const designations = { ...(config.seatDesignations || {}) };
      seatsToDesignate.forEach((s) => {
        const upper = s.trim().toUpperCase();
        if (!status) {
          delete designations[upper];
        } else {
          designations[upper] = status;
        }
      });

      const newConfig: EventSeatingConfig = {
        ...config,
        seatDesignations: designations,
        updatedAt: new Date().toISOString(),
      };

      await handleSaveConfig(newConfig);
      setSelectedSeats(new Set());
      setIsBatchMode(false);
      setMessage({
        text: `กำหนดสัญลักษณ์กลุ่ม ${seatsToDesignate.length} ที่นั่ง เรียบร้อยแล้ว`,
        type: 'success',
      });
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'เกิดข้อผิดพลาดในการกำหนดกลุ่มที่นั่ง', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Assign or Swap seat manually
  const handleAssignSeatManually = async (seatCode: string, registrationId: string | null) => {
    setIsSaving(true);
    try {
      if (!registrationId) {
        // Unassign current occupant
        const currentOcc = seatOccupantMap.get(seatCode.toUpperCase());
        if (currentOcc) {
          await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_participant_seat',
              registrationId: currentOcc.id,
              seatNumber: null,
            }),
          });
        }
      } else {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_participant_seat',
            registrationId,
            seatNumber: seatCode,
          }),
        });
      }
      setSelectedSeat(null);
      setAssignTargetStudentCode('');
      onRefresh();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Add Zone
  const handleAddZone = () => {
    const nextChar = String.fromCharCode(65 + config.zones.length); // A, B, C, D...
    const colors = ['amber', 'blue', 'emerald', 'purple', 'rose', 'teal', 'indigo'];
    const nextColor = colors[config.zones.length % colors.length];

    const newZone: SeatZone = {
      id: `zone-${nextChar.toLowerCase()}`,
      name: `โซน ${nextChar}`,
      color: nextColor,
      rows: 10,
      cols: 15,
      prefix: nextChar,
      description: `แถวผังที่นั่งโซน ${nextChar}`,
    };

    const newConfig = {
      ...config,
      zones: [...config.zones, newZone],
    };
    handleSaveConfig(newConfig);
  };

  // Remove Zone
  const handleRemoveZone = (zoneId: string) => {
    if (config.zones.length <= 1) {
      alert('โครงการต้องมีผังที่นั่งอย่างน้อย 1 โซน');
      return;
    }
    if (!confirm('ยืนยันลบโซนนี้? ที่นั่งในโซนนี้จะถูกยกเลิก')) return;
    const newConfig = {
      ...config,
      zones: config.zones.filter((z) => z.id !== zoneId),
    };
    handleSaveConfig(newConfig);
  };

  // Update Zone field
  const handleUpdateZone = (zoneId: string, updates: Partial<SeatZone>) => {
    const newConfig = {
      ...config,
      zones: config.zones.map((z) => (z.id === zoneId ? { ...z, ...updates } : z)),
    };
    setConfig(newConfig);
  };



  const disabledSet = useMemo(
    () => new Set((config.disabledSeats || []).map((s) => s.trim().toUpperCase())),
    [config.disabledSeats]
  );

  const filteredZones = useMemo(
    () => (activeZoneId === 'ALL' ? config.zones : config.zones.filter((z) => z.id === activeZoneId)),
    [activeZoneId, config.zones]
  );

  const selectedOccupant = selectedSeat ? seatOccupantMap.get(selectedSeat.toUpperCase()) : null;

  return {
    registrations,
    config,
    setConfig,
    activeZoneId,
    setActiveZoneId,
    zoomLevel,
    setZoomLevel,
    searchQuery,
    setSearchQuery,
    selectedSeat,
    setSelectedSeat,
    isConfigDrawerOpen,
    setIsConfigDrawerOpen,
    isAssignModalOpen,
    setIsAssignModalOpen,
    autoSortBy,
    setAutoSortBy,
    isSaving,
    message,
    setMessage,
    assignTargetStudentCode,
    setAssignTargetStudentCode,
    isImportExportModalOpen,
    setIsImportExportModalOpen,
    importExportTab,
    setImportExportTab,
    isPrintModalOpen,
    setIsPrintModalOpen,
    importFileName,
    importRawText,
    importPreviewRows,
    setImportPreviewRows,
    isImporting,
    resetExistingSeats,
    setResetExistingSeats,
    isMobileQrOpen,
    setIsMobileQrOpen,
    isBatchMode,
    setIsBatchMode,
    selectedSeats,
    setSelectedSeats,
    isRangeModalOpen,
    setIsRangeModalOpen,
    totalDays,
    inspectionDay,
    setInspectionDay,
    inspectionPeriod,
    setInspectionPeriod,
    isSavingInspection,
    isAbsentReportOpen,
    setIsAbsentReportOpen,
    isDeduplicating,
    disabledSet,
    filteredZones,
    selectedOccupant,
    seatOccupantMap,
    stats,
    dailyStats,
    handleSaveConfig,
    handleToggleDisableSeat,
    handleDesignateSeatStatus,
    handleDesignateRowStatus,
    handleDesignateColStatus,
    handleToggleColAisle,
    handleSeatClick,
    handleBatchDisableSeats,
    handleBatchEnableSeats,
    handleBatchDesignateStatus,
    mobileScannerQrDataUrl,
    mobileSeatingQrDataUrl,
    mobileSeatScanUrl,
    mobilePublicSeatingUrl,
    copiedMobileUrl,
    handleCopyMobileUrl,
    handleExportSeatingXlsx,
    handleExportSeatingCsv,
    handleDownloadBlankTemplate,
    handleFileUpload,
    handlePasteText,
    handleApplyImportedSeating,
    handleSaveSeatInspection,
    handleMarkAllScannedOccupied,
    handleDeduplicateRegistrations,
    handleClearAllSeats,
    handleAutoAssign,
    handleAssignSeatManually,
    handleAddZone,
    handleRemoveZone,
    handleUpdateZone,
  };
}
