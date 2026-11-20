'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Sparkles,
  Search,
  CheckCircle2,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Camera,
  Printer,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  QrCode,
  MapPin,
  Save,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Upload,
  Download,
  FileText,
  AlertTriangle,
  ArrowUpDown,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import type { StudentEvent, EventRegistration, EventSeatingConfig, SeatZone } from '@/types/event';
import { generateZoneSeatCodes, detectParticipantStatus } from '@/services/events/seatingService';
import { downloadXlsx, type XlsxSheet } from '@/lib/utils/xlsx-export';
import { parseXlsxBuffer } from '@/lib/utils/xlsx-import';

interface VipassanaSeatMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  registrations: EventRegistration[];
  onRefresh: () => void;
  onOpenSeatScanner?: (event: StudentEvent) => void;
}

const ZONE_COLORS: Record<string, { bg: string; border: string; text: string; lightBg: string; ring: string }> = {
  amber: { bg: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-900', lightBg: 'bg-amber-50', ring: 'ring-amber-500' },
  blue: { bg: 'bg-blue-600', border: 'border-blue-400', text: 'text-blue-900', lightBg: 'bg-blue-50', ring: 'ring-blue-500' },
  emerald: { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-emerald-900', lightBg: 'bg-emerald-50', ring: 'ring-emerald-500' },
  purple: { bg: 'bg-purple-600', border: 'border-purple-400', text: 'text-purple-900', lightBg: 'bg-purple-50', ring: 'ring-purple-500' },
  rose: { bg: 'bg-rose-600', border: 'border-rose-400', text: 'text-rose-900', lightBg: 'bg-rose-50', ring: 'ring-rose-500' },
  teal: { bg: 'bg-teal-600', border: 'border-teal-400', text: 'text-teal-900', lightBg: 'bg-teal-50', ring: 'ring-teal-500' },
  indigo: { bg: 'bg-indigo-600', border: 'border-indigo-400', text: 'text-indigo-900', lightBg: 'bg-indigo-50', ring: 'ring-indigo-500' },
};

export const VipassanaSeatMapModal: React.FC<VipassanaSeatMapModalProps> = ({
  isOpen,
  onClose,
  event,
  registrations,
  onRefresh,
  onOpenSeatScanner,
}) => {
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
          prefix: 'A',
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
    'STATUS_GENDER' | 'STATUS_INTER' | 'MAX_CAPACITY' | 'GROUP' | 'STUDENT_CODE' | 'NAME'
  >('STATUS_GENDER');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Manual assign target student
  const [assignTargetStudentCode, setAssignTargetStudentCode] = useState<string>('');

  // Excel / CSV Import & Export Modal State
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [importExportTab, setImportExportTab] = useState<'EXPORT' | 'IMPORT'>('EXPORT');
  const [importFileName, setImportFileName] = useState('');
  const [importRawText, setImportRawText] = useState('');
  const [importPreviewRows, setImportPreviewRows] = useState<
    Array<{
      studentCode: string;
      studentName: string;
      seatNumber: string;
      seatZone: string;
      status: 'VALID' | 'DUPLICATE_SEAT' | 'NOT_FOUND';
      statusNote?: string;
    }>
  >([]);
  const [isImporting, setIsImporting] = useState(false);

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
        map.set(r.seatNumber.trim().toUpperCase(), r);
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

    return {
      totalCapacity: activeSeats,
      totalParticipants: registrations.length,
      assignedCount,
      checkedInCount,
      vacantCount: Math.max(0, activeSeats - assignedCount),
      unassignedCount,
    };
  }, [config, registrations]);

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

  // ==================== EXCEL & CSV EXPORT / IMPORT ====================

  // Export Seating to Excel (.xlsx)
  const handleExportSeatingXlsx = () => {
    const rows = registrations.map((r, idx) => {
      const st = detectParticipantStatus(r.studentName, r.role);
      return [
        idx + 1,
        r.studentCode,
        r.groupSpecificCode || '',
        r.studentName,
        st.label,
        r.programType || 'THAI',
        r.degreeLevel || 'ปริญญาตรี',
        r.major || '',
        r.groupNumber || '',
        r.seatNumber || '',
        r.seatZone || '',
      ];
    });

    const sheet: XlsxSheet = {
      name: 'ผังที่นั่ง',
      title: `ผังที่นั่ง: ${event.title}`,
      subtitle: `สถานที่: ${config.venueName || event.location || 'คณะพุทธศาสตร์'} • วันที่ส่งออก: ${new Date().toLocaleDateString('th-TH')}`,
      headers: [
        'ลำดับ',
        'รหัสนิสิต',
        'เลขเฉพาะกลุ่ม',
        'ชื่อ-ฉายา/สกุล',
        'สถานภาพ/เพศ',
        'หลักสูตรภาษา',
        'ระดับการศึกษา',
        'สาขาวิชา',
        'กลุ่มที่',
        'หมายเลขที่นั่ง (Seat No.)',
        'โซนที่นั่ง (Zone)',
      ],
      rows,
      columnWidths: [8, 16, 14, 28, 16, 14, 16, 24, 10, 22, 20],
    };

    downloadXlsx(
      `ผังที่นั่ง_${event.title.replace(/[\/\\:*?"<>|]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      [sheet]
    );
  };

  // Export Seating to CSV (.csv)
  const handleExportSeatingCsv = () => {
    const headers = [
      'ลำดับ',
      'รหัสนิสิต',
      'เลขเฉพาะกลุ่ม',
      'ชื่อ-ฉายา/สกุล',
      'สถานภาพ/เพศ',
      'หลักสูตรภาษา',
      'ระดับการศึกษา',
      'สาขาวิชา',
      'กลุ่มที่',
      'หมายเลขที่นั่ง',
      'โซนที่นั่ง',
    ];

    const lines = [headers.join(',')];
    registrations.forEach((r, idx) => {
      const st = detectParticipantStatus(r.studentName, r.role);
      const row = [
        idx + 1,
        `"${r.studentCode}"`,
        `"${r.groupSpecificCode || ''}"`,
        `"${r.studentName}"`,
        `"${st.label}"`,
        `"${r.programType || 'THAI'}"`,
        `"${r.degreeLevel || 'ปริญญาตรี'}"`,
        `"${r.major || ''}"`,
        `"${r.groupNumber || ''}"`,
        `"${r.seatNumber || ''}"`,
        `"${r.seatZone || ''}"`,
      ];
      lines.push(row.join(','));
    });

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ผังที่นั่ง_${event.title.replace(/[\/\\:*?"<>|]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Blank Excel Template
  const handleDownloadBlankTemplate = () => {
    const sampleRows = [
      [1, '6701501001', 'T101', 'พระมหาสมชาย กิตฺติโสภโณ', 'พระภิกษุ', 'THAI', 'ปริญญาตรี', 'พระพุทธศาสนา', 1, 'A-01', 'โซน A'],
      [2, '6701501002', 'T102', 'สามเณรธีรภัทร สุขใจ', 'สามเณร', 'THAI', 'ปริญญาตรี', 'พระพุทธศาสนา', 1, 'A-02', 'โซน A'],
      [3, '6701501003', 'T103', 'แม่ชีวิมล บุญประเสริฐ', 'แม่ชี', 'THAI', 'ปริญญาตรี', 'พระพุทธศาสนา', 2, 'B-01', 'โซน B'],
      [4, '6701501004', 'T104', 'นายก้องภพ ใจดี', 'คฤหัสถ์ชาย', 'THAI', 'ปริญญาตรี', 'ปรัชญา', 2, 'B-02', 'โซน B'],
      [5, '6701501005', 'T105', 'นางสาวพรทิพย์ สดใส', 'คฤหัสถ์หญิง', 'THAI', 'ปริญญาตรี', 'ปรัชญา', 3, 'C-01', 'โซน C'],
      [6, '6701501006', 'I301', 'Ven. Dhammapalo', 'พระภิกษุ', 'ENGLISH', 'ปริญญาตรี', 'Buddhism', 12, 'A-03', 'โซน A'],
    ];

    const sheet: XlsxSheet = {
      name: 'แม่แบบจัดผังที่นั่ง',
      title: 'แม่แบบไฟล์ Excel กำหนดหมายเลขที่นั่ง (Seating Template)',
      subtitle: 'คำแนะนำ: ระบุรหัสนิสิต และหมายเลขที่นั่งที่ต้องการจัดสรร (เช่น A-01, A-02)',
      headers: [
        'ลำดับ',
        'รหัสนิสิต',
        'เลขเฉพาะกลุ่ม',
        'ชื่อ-ฉายา/สกุล',
        'สถานภาพ/เพศ',
        'หลักสูตรภาษา',
        'ระดับการศึกษา',
        'สาขาวิชา',
        'กลุ่มที่',
        'หมายเลขที่นั่ง (Seat No.)',
        'โซนที่นั่ง (Zone)',
      ],
      rows: sampleRows,
      columnWidths: [8, 16, 14, 28, 16, 14, 16, 24, 10, 22, 20],
    };

    downloadXlsx(
      `แม่แบบผังที่นั่ง_Seating_Template.xlsx`,
      [sheet]
    );
  };

  // Parse Matrix to Preview Rows
  const processImportMatrix = (matrix: string[][]) => {
    if (matrix.length === 0) {
      setImportPreviewRows([]);
      return;
    }

    let headerIdx = 0;
    let codeCol = -1;
    let seatCol = -1;
    let zoneCol = -1;
    let nameCol = -1;

    for (let i = 0; i < Math.min(5, matrix.length); i++) {
      const row = matrix[i].map((c) => String(c || '').trim().toLowerCase());
      const cIdx = row.findIndex(
        (cell) =>
          cell.includes('รหัสนิสิต') ||
          cell.includes('studentcode') ||
          cell === 'code' ||
          cell === 'รหัส'
      );
      const sIdx = row.findIndex(
        (cell) =>
          cell.includes('หมายเลขที่นั่ง') ||
          cell.includes('seatnumber') ||
          cell.includes('ที่นั่ง') ||
          cell === 'seat'
      );
      if (cIdx !== -1 && sIdx !== -1) {
        headerIdx = i;
        codeCol = cIdx;
        seatCol = sIdx;
        zoneCol = row.findIndex((cell) => cell.includes('โซน') || cell.includes('zone'));
        nameCol = row.findIndex((cell) => cell.includes('ชื่อ') || cell.includes('name'));
        break;
      }
    }

    if (codeCol === -1 || seatCol === -1) {
      codeCol = 1;
      seatCol = matrix[0].length >= 10 ? 9 : matrix[0].length - 1;
      headerIdx = 0;
    }

    const regMap = new Map<string, EventRegistration>();
    registrations.forEach((r) => {
      if (r.studentCode) regMap.set(r.studentCode.trim().toLowerCase(), r);
      if (r.groupSpecificCode) regMap.set(r.groupSpecificCode.trim().toLowerCase(), r);
    });

    const parsed: typeof importPreviewRows = [];
    const usedSeats = new Map<string, string>();

    for (let i = headerIdx + 1; i < matrix.length; i++) {
      const row = matrix[i];
      if (!row || row.length === 0) continue;

      const rawCode = String(row[codeCol] || '').trim();
      const rawSeat = String(row[seatCol] || '').trim().toUpperCase();
      const rawZone = zoneCol !== -1 && row[zoneCol] ? String(row[zoneCol]).trim() : '';

      if (!rawCode && !rawSeat) continue;
      if (rawCode.includes('รหัส') || rawCode.toLowerCase().includes('student')) continue;

      const matchedReg = regMap.get(rawCode.toLowerCase());
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
          usedSeats.set(rawSeat, rawCode);
        }
      }

      parsed.push({
        studentCode: rawCode,
        studentName: matchedReg?.studentName || (nameCol !== -1 ? row[nameCol] : '') || '-',
        seatNumber: rawSeat,
        seatZone: rawZone || matchedReg?.seatZone || '',
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
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_import_seating',
          eventId: event.id,
          rows: validRows.map((r) => ({
            studentCode: r.studentCode,
            seatNumber: r.seatNumber,
            seatZone: r.seatZone,
          })),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'นำเข้าไม่สำเร็จ');

      setMessage({ text: data.message || 'บันทึกผังที่นั่งจากไฟล์สำเร็จ!', type: 'success' });
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

  if (!isOpen) return null;

  const disabledSet = new Set((config.disabledSeats || []).map((s) => s.trim().toUpperCase()));
  const filteredZones = activeZoneId === 'ALL' ? config.zones : config.zones.filter((z) => z.id === activeZoneId);

  // Selected occupant
  const selectedOccupant = selectedSeat ? seatOccupantMap.get(selectedSeat.toUpperCase()) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-7xl max-h-[96vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Users className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight">
                  แผนผังที่นั่ง & ตรวจเช็คผู้เข้าที่นั่ง
                </h3>
                <span className="text-[11px] bg-amber-400 text-slate-900 font-extrabold px-2 py-0.5 rounded-full">
                  Grid Matrix
                </span>
              </div>
              <p className="text-xs text-amber-200/90 truncate max-w-md sm:max-w-xl">
                {event.title} • {config.venueName || event.location || 'คณะพุทธศาสตร์'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSeatScanner && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSeatScanner(event);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-xs cursor-pointer"
                title="เปิดกล้องสแกนตรวจเช็คผู้เข้าที่นั่ง"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-200" />
                <span>เปิดจุดสแกนที่นั่ง</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsConfigDrawerOpen(!isConfigDrawerOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer border ${
                isConfigDrawerOpen
                  ? 'bg-amber-400 text-slate-900 border-amber-300'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
              title="ตั้งค่าขนาดโซน แถว และคอลัมน์"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ตั้งค่าโซน/ผัง</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {message && (
          <div
            className={`px-4 py-2 text-xs font-medium flex items-center justify-between ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 text-xs">ปิด</button>
          </div>
        )}

        {/* Toolbar & Stats Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Left: Zone Switcher Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveZoneId('ALL')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeZoneId === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              ทุกโซน ({config.zones.length})
            </button>
            {config.zones.map((zone) => {
              const zoneColor = ZONE_COLORS[zone.color] || ZONE_COLORS.amber;
              const isActive = activeZoneId === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setActiveZoneId(zone.id)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 border ${
                    isActive
                      ? `${zoneColor.bg} text-white ${zoneColor.border} shadow-xs`
                      : `bg-white ${zoneColor.text} hover:${zoneColor.lightBg} border-slate-200`
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : zoneColor.bg}`} />
                  <span>{zone.name}</span>
                  <span className="text-[10px] opacity-80">({zone.rows * zone.cols})</span>
                </button>
              );
            })}
          </div>

          {/* Right: Actions, Search & Zoom */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search participant */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ/รหัส/ที่นั่ง..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white w-40 sm:w-48"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ×
                </button>
              )}
            </div>

            {/* Auto Assign Seats Button */}
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              disabled={isSaving}
              className="px-2.5 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer"
              title="จัดที่นั่งอัตโนมัติ เรียงตามสถานภาพ เพศ หรือกลุ่ม"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>จัดที่นั่งอัตโนมัติ</span>
            </button>

            {/* Excel / CSV Import & Export Button */}
            <button
              type="button"
              onClick={() => {
                setImportExportTab('EXPORT');
                setIsImportExportModalOpen(true);
              }}
              className="px-2.5 py-1 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer"
              title="นำเข้าหรือส่งออกข้อมูลผังที่นั่งด้วยไฟล์ Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-200" />
              <span className="hidden sm:inline">นำเข้า/ส่งออก Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>

            {/* Clear all seats */}
            <button
              type="button"
              onClick={handleClearAllSeats}
              disabled={isSaving || stats.assignedCount === 0}
              className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer disabled:opacity-40"
              title="ล้างข้อมูลการจัดที่นั่งทั้งหมด"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                className="p-1 text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
                title="ย่อขนาดผัง"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold px-1.5 text-slate-600 min-w-8 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.1))}
                className="p-1 text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
                title="ขยายขนาดผัง"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1 text-slate-400 hover:text-slate-700 text-[10px] font-medium border-l border-slate-200 pl-1.5 pr-1 cursor-pointer"
                title="รีเซ็ตขนาด 100%"
              >
                1x
              </button>
            </div>
          </div>
        </div>

        {/* Stats Pill Banner */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              ผู้เข้าร่วม: <b className="text-slate-900">{stats.totalParticipants}</b> คน
            </span>
            <span className="flex items-center gap-1">
              ความจุผัง: <b className="text-slate-900">{stats.totalCapacity}</b> ที่นั่ง
            </span>
            <span className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md font-semibold border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              จัดแล้ว: <b>{stats.assignedCount}</b> ที่นั่ง ({stats.totalParticipants > 0 ? Math.round((stats.assignedCount / stats.totalParticipants) * 100) : 0}%)
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              เข้าที่นั่งแล้ว: <b>{stats.checkedInCount}</b> คน
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
              ที่นั่งว่าง: <b>{stats.vacantCount}</b> ที่
            </span>
            {stats.unassignedCount > 0 && (
              <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-bold">
                ⚠️ ยังไม่มีที่นั่ง: {stats.unassignedCount} คน
              </span>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 border border-emerald-600 inline-block" /> เช็คอินแล้ว
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-blue-600 border border-blue-700 inline-block" /> มีผู้จอง
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-white border border-slate-300 inline-block" /> ว่าง
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-slate-300 border border-slate-400 inline-block" /> ทางเดิน/เสา
            </span>
          </div>
        </div>

        {/* Main Content Area: Seat Grid + Side Drawer */}
        <div className="relative flex-1 flex overflow-hidden bg-slate-100/70">
          {/* Stage / Front of the Hall Indicator */}
          <div className="flex-1 flex flex-col overflow-auto p-4 sm:p-6 items-center">
            {/* Front Stage Graphic */}
            <div className="w-full max-w-3xl mb-6 flex flex-col items-center shrink-0">
              <div className="w-full py-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-900 rounded-xl shadow-md text-center font-black tracking-wider text-xs sm:text-sm border border-amber-400 flex items-center justify-center gap-2">
                <span>🏛️ ด้านหน้าหอประชุม / แท่นบรรยาย / พระวิปัสสนาจารย์ (STAGE FRONT)</span>
              </div>
              <div className="w-32 h-1 bg-amber-400/50 rounded-full mt-1" />
            </div>

            {/* Zones Grid Container */}
            <div
              className="flex flex-col gap-8 transition-transform duration-150 origin-top"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {filteredZones.map((zone) => {
                const zoneColor = ZONE_COLORS[zone.color] || ZONE_COLORS.amber;
                const prefix = (zone.prefix || zone.name.substring(0, 1) || 'Z').trim().toUpperCase();

                return (
                  <div
                    key={zone.id}
                    className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 flex flex-col items-center"
                  >
                    {/* Zone Header */}
                    <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${zoneColor.bg}`} />
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-800">
                          {zone.name}
                        </h4>
                        <span className="text-xs text-slate-400 font-normal">
                          ({zone.rows} แถว × {zone.cols} คอลัมน์ = {zone.rows * zone.cols} ที่นั่ง)
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{zone.description || ''}</span>
                    </div>

                    {/* Column Headers (1..cols) */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-7 text-center text-[10px] font-bold text-slate-400">แถว</div>
                      <div
                        className="grid gap-1.5"
                        style={{ gridTemplateColumns: `repeat(${zone.cols}, minmax(36px, 1fr))` }}
                      >
                        {Array.from({ length: zone.cols }, (_, cIdx) => (
                          <div key={cIdx} className="text-center text-[10px] font-bold text-slate-400">
                            {cIdx + 1 < 10 ? `0${cIdx + 1}` : cIdx + 1}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Seat Grid Rows */}
                    <div className="flex flex-col gap-1.5">
                      {Array.from({ length: zone.rows }, (_, rIdx) => {
                        const rowChar = String.fromCharCode(65 + rIdx); // A, B, C...
                        return (
                          <div key={rIdx} className="flex items-center gap-1.5">
                            {/* Row Label */}
                            <div className="w-7 text-center text-xs font-black text-slate-500 bg-slate-100 py-1 rounded">
                              {rowChar}
                            </div>

                            {/* Row Seats */}
                            <div
                              className="grid gap-1.5"
                              style={{ gridTemplateColumns: `repeat(${zone.cols}, minmax(36px, 1fr))` }}
                            >
                              {Array.from({ length: zone.cols }, (_, cIdx) => {
                                const colStr = cIdx + 1 < 10 ? `0${cIdx + 1}` : `${cIdx + 1}`;
                                const seatCode =
                                  zone.rows <= 26 ? `${prefix}${rowChar}-${colStr}` : `${prefix}${rIdx + 1}-${colStr}`;
                                const isDisabled = disabledSet.has(seatCode.toUpperCase());
                                const occupant = seatOccupantMap.get(seatCode.toUpperCase());
                                const isCheckedIn = Boolean(occupant?.seatCheckinAt);
                                const isSelected = selectedSeat?.toUpperCase() === seatCode.toUpperCase();

                                // Search match
                                const isSearchMatched =
                                  Boolean(searchQuery) &&
                                  (seatCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (occupant &&
                                      (occupant.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        occupant.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        occupant.groupSpecificCode?.toLowerCase().includes(searchQuery.toLowerCase()))));

                                if (isDisabled) {
                                  return (
                                    <button
                                      key={cIdx}
                                      type="button"
                                      onClick={() => setSelectedSeat(seatCode)}
                                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-200/80 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[9px] hover:bg-slate-300 transition cursor-pointer"
                                      title={`ที่นั่ง ${seatCode} (เว้นเป็นทางเดิน/เสา) - คลิกเพื่อจัดการ`}
                                    >
                                      —
                                    </button>
                                  );
                                }

                                if (isCheckedIn) {
                                  return (
                                    <button
                                      key={cIdx}
                                      type="button"
                                      onClick={() => setSelectedSeat(seatCode)}
                                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold flex flex-col items-center justify-center shadow-xs transition cursor-pointer relative ${
                                        isSelected ? 'ring-3 ring-amber-400 scale-105 z-10' : ''
                                      } ${isSearchMatched ? 'ring-4 ring-yellow-300 animate-bounce' : ''}`}
                                      title={`[เช็คอินเข้าที่นั่งแล้ว] ${seatCode}: ${occupant?.studentName} (${occupant?.studentCode})`}
                                    >
                                      <span className="text-[10px] leading-none">{seatCode}</span>
                                      <span className="text-[8px] font-medium truncate max-w-[34px] opacity-90">
                                        {occupant?.studentName.split(' ')[0]}
                                      </span>
                                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-200 rounded-full border-2 border-white" />
                                    </button>
                                  );
                                }

                                if (occupant) {
                                  return (
                                    <button
                                      key={cIdx}
                                      type="button"
                                      onClick={() => setSelectedSeat(seatCode)}
                                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold flex flex-col items-center justify-center shadow-xs transition cursor-pointer ${
                                        isSelected ? 'ring-3 ring-amber-400 scale-105 z-10' : ''
                                      } ${isSearchMatched ? 'ring-4 ring-yellow-300 animate-bounce' : ''}`}
                                      title={`[จัดที่นั่งแล้ว - รอเข้าที่] ${seatCode}: ${occupant.studentName} (${occupant.studentCode})`}
                                    >
                                      <span className="text-[10px] leading-none">{seatCode}</span>
                                      <span className="text-[8px] font-medium truncate max-w-[34px] opacity-90">
                                        {occupant.groupSpecificCode || (occupant.groupNumber ? `ก.${occupant.groupNumber}` : occupant.studentName.split(' ')[0])}
                                      </span>
                                    </button>
                                  );
                                }

                                // Vacant seat
                                return (
                                  <button
                                    key={cIdx}
                                    type="button"
                                    onClick={() => setSelectedSeat(seatCode)}
                                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white hover:bg-amber-50 text-slate-600 border border-slate-300 hover:border-amber-400 font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                                      isSelected ? 'ring-3 ring-amber-500 scale-105 z-10' : ''
                                    } ${isSearchMatched ? 'ring-4 ring-yellow-300 animate-bounce' : ''}`}
                                    title={`[ที่นั่งว่าง] ${seatCode} - คลิกเพื่อจัดนิสิตลงที่นั่งนี้`}
                                  >
                                    <span className="text-[10px] leading-none text-slate-500">{seatCode}</span>
                                    <span className="text-[8px] text-slate-300">ว่าง</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Selected Seat Inspector Drawer */}
          {selectedSeat && (
            <div className="w-80 sm:w-96 bg-white border-l border-slate-200 shadow-xl flex flex-col shrink-0 animate-in slide-in-from-right duration-200 z-20">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    รายละเอียดจุดที่นั่ง
                  </span>
                  <h4 className="text-xl font-black text-white flex items-center gap-2">
                    {selectedSeat}
                    {disabledSet.has(selectedSeat.toUpperCase()) && (
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-normal">
                        ทางเดิน/เสา
                      </span>
                    )}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSeat(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
                {/* Seat Occupant Info */}
                {selectedOccupant ? (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">ข้อมูลผู้ได้รับจัดที่นั่ง:</span>
                      {selectedOccupant.seatCheckinAt ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> เช็คอินแล้ว
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">
                          รอเข้าที่นั่ง
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-slate-800">
                      <div className="text-sm font-extrabold text-slate-900">
                        {selectedOccupant.studentName}
                      </div>
                      <div className="text-slate-600">
                        รหัสนิสิต: <span className="font-bold">{selectedOccupant.studentCode}</span>
                        {selectedOccupant.groupSpecificCode && ` (${selectedOccupant.groupSpecificCode})`}
                      </div>
                      <div className="text-slate-600">
                        สังกัดกลุ่ม: <span className="font-bold">กลุ่มที่ {selectedOccupant.groupNumber || '-'}</span>
                      </div>
                      <div className="text-slate-600">
                        สาขาวิชา: {selectedOccupant.major || '-'}
                      </div>
                      {selectedOccupant.seatCheckinAt && (
                        <div className="text-[11px] text-emerald-700 pt-1 border-t border-slate-200">
                          เข้าที่นั่งเมื่อ: {new Date(selectedOccupant.seatCheckinAt).toLocaleTimeString('th-TH')} น.
                        </div>
                      )}
                    </div>

                    {/* Unassign action */}
                    <button
                      type="button"
                      onClick={() => handleAssignSeatManually(selectedSeat, null)}
                      disabled={isSaving}
                      className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ยกเลิกการจัดที่นั่งนี้ (ว่าง)</span>
                    </button>
                  </div>
                ) : disabledSet.has(selectedSeat.toUpperCase()) ? (
                  <div className="bg-slate-100 rounded-xl p-4 border border-dashed border-slate-300 text-center space-y-2">
                    <p className="text-slate-600 font-medium">ที่นั่งนี้ถูกเว้นว่างไว้เป็นทางเดินหรือเสาอาคาร</p>
                    <button
                      type="button"
                      onClick={() => handleToggleDisableSeat(selectedSeat)}
                      className="px-3 py-1.5 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-bold transition cursor-pointer"
                    >
                      เปิดใช้งานเป็นที่นั่งปกติ
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200 space-y-3">
                    <div className="text-emerald-900 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      ที่นั่งนี้กำลังว่างอยู่
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      สามารถเลือกนิสิตที่ยังไม่มีที่นั่งมาลงที่จุดนี้ได้ทันที:
                    </p>

                    {/* Quick assign unassigned student */}
                    <div className="space-y-2">
                      <select
                        value={assignTargetStudentCode}
                        onChange={(e) => setAssignTargetStudentCode(e.target.value)}
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">-- เลือกนิสิตที่ยังไม่มีที่นั่ง --</option>
                        {registrations
                          .filter((r) => !r.seatNumber)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.studentName} ({r.studentCode}) {r.groupNumber ? `- กลุ่ม ${r.groupNumber}` : ''}
                            </option>
                          ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          if (!assignTargetStudentCode) {
                            alert('กรุณาเลือกนิสิตก่อน');
                            return;
                          }
                          handleAssignSeatManually(selectedSeat, assignTargetStudentCode);
                        }}
                        disabled={!assignTargetStudentCode || isSaving}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>กำหนดให้นิสิตนั่งตรงนี้</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-emerald-200">
                      <button
                        type="button"
                        onClick={() => handleToggleDisableSeat(selectedSeat)}
                        className="w-full py-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition font-medium cursor-pointer"
                      >
                        เว้นที่นั่งนี้เป็นทางเดิน/เสา (Disable)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Config Drawer (Zone Settings) */}
          {isConfigDrawerOpen && (
            <div className="w-80 sm:w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col shrink-0 animate-in slide-in-from-right duration-200 z-30">
              <div className="p-4 bg-amber-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-300" />
                  <h4 className="font-bold text-base">ตั้งค่าผังและขนาดโซน</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfigDrawerOpen(false)}
                  className="p-1 text-slate-300 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-5 text-xs">
                {/* Venue & Room Info */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">สถานที่ / อาคาร:</label>
                  <input
                    type="text"
                    value={config.venueName || ''}
                    onChange={(e) => setConfig({ ...config, venueName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="เช่น อาคาร มวก. 48 พรรษา"
                  />
                  <label className="font-bold text-slate-700 block">ห้อง / หอประชุม:</label>
                  <input
                    type="text"
                    value={config.roomName || ''}
                    onChange={(e) => setConfig({ ...config, roomName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    placeholder="เช่น หอประชุมใหญ่ ชั้น 3"
                  />
                </div>

                {/* Zones List */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">รายการโซน ({config.zones.length}):</span>
                    <button
                      type="button"
                      onClick={handleAddZone}
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>เพิ่มโซน</span>
                    </button>
                  </div>

                  {config.zones.map((zone, zIdx) => (
                    <div key={zone.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">โซนที่ {zIdx + 1}</span>
                        {config.zones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveZone(zone.id)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                            title="ลบโซนนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-600 font-medium">ชื่อโซน:</label>
                        <input
                          type="text"
                          value={zone.name}
                          onChange={(e) => handleUpdateZone(zone.id, { name: e.target.value })}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-600">แถว (Rows):</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={zone.rows}
                            onChange={(e) => handleUpdateZone(zone.id, { rows: parseInt(e.target.value, 10) || 1 })}
                            className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600">คอลัมน์ (Cols):</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={zone.cols}
                            onChange={(e) => handleUpdateZone(zone.id, { cols: parseInt(e.target.value, 10) || 1 })}
                            className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600">รหัสนำ (Prefix):</label>
                          <input
                            type="text"
                            maxLength={3}
                            value={zone.prefix || ''}
                            onChange={(e) => handleUpdateZone(zone.id, { prefix: e.target.value.toUpperCase() })}
                            className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs uppercase"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-600">สีโซน:</span>
                        {Object.keys(ZONE_COLORS).map((cKey) => (
                          <button
                            key={cKey}
                            type="button"
                            onClick={() => handleUpdateZone(zone.id, { color: cKey })}
                            className={`w-5 h-5 rounded-full ${ZONE_COLORS[cKey].bg} ${
                              zone.color === cKey ? 'ring-2 ring-slate-800 scale-110' : 'opacity-70'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigDrawerOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  ปิด
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveConfig(config)}
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกการตั้งค่าผัง</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Auto Assign Modal Popup */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl p-5 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>จัดที่นั่งอัตโนมัติ (Auto-Assign)</span>
                </h4>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                ระบบจะคำนวณและจัดที่นั่งให้แก่ผู้เข้าร่วมโครงการทั้งหมด ({registrations.length} คน) ตามเกณฑ์ที่เลือก เพื่อให้ใช้พื้นที่ห้องได้คุ้มค่าสูงสุด:
              </p>

              <div className="space-y-2">
                {/* 1. จัดเรียงตามสถานภาพและเพศ (แนะนำสูงสุดเมื่อสถานที่จำกัด) */}
                <label
                  className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition ${
                    autoSortBy === 'STATUS_GENDER' ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30' : 'bg-slate-50 border-slate-200'
                  }`}
                  onClick={() => setAutoSortBy('STATUS_GENDER')}
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black">แนะนำ</span>
                      <span>จัดตามสถานภาพ & เพศ (อัดแน่นเต็มความจุ ไม่แยกกลุ่ม)</span>
                    </div>
                    <div className="text-[11px] text-slate-600 leading-snug">
                      เรียง: พระภิกษุ ➔ สามเณร ➔ ภิกษุณี ➔ แม่ชี ➔ ฆราวาสชาย ➔ ฆราวาสหญิง
                    </div>
                    <div className="text-[10px] text-amber-800 font-medium">
                      * จัดนั่งเรียงต่อเนื่องกันจนเต็มความจุห้อง ถูกต้องตามพระวินัย โดยไม่ต้องคำนึงถึงกลุ่ม
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="autoSortBy"
                    checked={autoSortBy === 'STATUS_GENDER'}
                    onChange={() => setAutoSortBy('STATUS_GENDER')}
                    className="accent-amber-600 mt-1"
                  />
                </label>

                {/* 2. จัดเรียงตามสถานภาพ + แยกหลักสูตรภาษา (ไทย / ต่างประเทศ Inter) */}
                <label
                  className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition ${
                    autoSortBy === 'STATUS_INTER' ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30' : 'bg-slate-50 border-slate-200'
                  }`}
                  onClick={() => setAutoSortBy('STATUS_INTER')}
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="font-bold text-xs text-slate-900">
                      จัดตามสถานภาพ + แยกภาษา (ไทย ➔ นานาชาติ Inter)
                    </div>
                    <div className="text-[11px] text-slate-600">
                      จัดพระภิกษุไทย/Inter และ ฆราวาสไทย/Inter เป็นสัดส่วนเรียงตามแถว
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="autoSortBy"
                    checked={autoSortBy === 'STATUS_INTER'}
                    onChange={() => setAutoSortBy('STATUS_INTER')}
                    className="accent-amber-600 mt-1"
                  />
                </label>

                {/* 3. จัดเต็มความจุตามรหัสนิสิต (Max Capacity) */}
                <label
                  className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition ${
                    autoSortBy === 'MAX_CAPACITY' ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30' : 'bg-slate-50 border-slate-200'
                  }`}
                  onClick={() => setAutoSortBy('MAX_CAPACITY')}
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="font-bold text-xs text-slate-900">เรียงตามรหัสนิสิต (Max Capacity)</div>
                    <div className="text-[11px] text-slate-600">
                      เรียงรหัสนิสิตน้อยไปหามาก อัดแน่นทุกที่นั่งต่อเนื่องกัน ไม่แยกกลุ่ม
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="autoSortBy"
                    checked={autoSortBy === 'MAX_CAPACITY'}
                    onChange={() => setAutoSortBy('MAX_CAPACITY')}
                    className="accent-amber-600 mt-1"
                  />
                </label>

                {/* 4. เรียงตามกลุ่มปฏิบัติธรรม */}
                <label
                  className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition ${
                    autoSortBy === 'GROUP' ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30' : 'bg-slate-50 border-slate-200'
                  }`}
                  onClick={() => setAutoSortBy('GROUP')}
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="font-bold text-xs text-slate-900">เรียงตามกลุ่มปฏิบัติธรรม</div>
                    <div className="text-[11px] text-slate-600">กลุ่มที่ 1, 2, 3.. นั่งเรียงติดกันตามแถว</div>
                  </div>
                  <input
                    type="radio"
                    name="autoSortBy"
                    checked={autoSortBy === 'GROUP'}
                    onChange={() => setAutoSortBy('GROUP')}
                    className="accent-amber-600 mt-1"
                  />
                </label>

                {/* 5. เรียงตามตัวอักษรชื่อ-สกุล */}
                <label
                  className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition ${
                    autoSortBy === 'NAME' ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30' : 'bg-slate-50 border-slate-200'
                  }`}
                  onClick={() => setAutoSortBy('NAME')}
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="font-bold text-xs text-slate-900">เรียงตามตัวอักษรชื่อ-สกุล</div>
                    <div className="text-[11px] text-slate-600">ก - ฮ</div>
                  </div>
                  <input
                    type="radio"
                    name="autoSortBy"
                    checked={autoSortBy === 'NAME'}
                    onChange={() => setAutoSortBy('NAME')}
                    className="accent-amber-600 mt-1"
                  />
                </label>
              </div>

              {/* Shortcut to Excel import/export */}
              <div className="p-3 bg-indigo-50/80 rounded-xl text-[11px] text-indigo-900 border border-indigo-200 flex items-center justify-between gap-2">
                <span>ต้องการกำหนดที่นั่งด้วยตนเองผ่านไฟล์?</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAssignModalOpen(false);
                    setIsImportExportModalOpen(true);
                  }}
                  className="font-bold underline text-indigo-700 hover:text-indigo-900 whitespace-nowrap cursor-pointer"
                >
                  นำเข้า/ส่งออก Excel &rarr;
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleAutoAssign}
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>เริ่มจัดที่นั่งทันที</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Excel / CSV Import & Export Modal Popup */}
        {isImportExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
              {/* Header */}
              <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-300" />
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base">
                      นำเข้า / ส่งออกผังที่นั่ง (Excel & CSV)
                    </h4>
                    <p className="text-[11px] text-indigo-200">
                      {event.title} • จัดสรรที่นั่งอิสระด้วยไฟล์ Excel
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsImportExportModalOpen(false);
                    setImportPreviewRows([]);
                  }}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setImportExportTab('EXPORT')}
                  className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
                    importExportTab === 'EXPORT'
                      ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>📤 ส่งออกไฟล์ (Export)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportExportTab('IMPORT')}
                  className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
                    importExportTab === 'IMPORT'
                      ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>📥 นำเข้าไฟล์ (Import)</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
                {importExportTab === 'EXPORT' ? (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 text-indigo-900 space-y-1">
                      <div className="font-bold">คำแนะนำการส่งออก:</div>
                      <p className="text-[11px] text-indigo-800 leading-relaxed">
                        ไฟล์ที่ส่งออกจะรวบรวมรายชื่อผู้เข้าร่วมโครงการทั้งหมด ({registrations.length} ท่าน) พร้อมสถานภาพ (พระภิกษุ/สามเณร/แม่ชี/ฆราวาส), หลักสูตรภาษา (ไทย/Inter), กลุ่ม, และหมายเลขที่นั่งปัจจุบัน ท่านสามารถนำไปกำหนดเลขที่นั่งในโปรแกรม Excel ได้อย่างอิสระ แล้วนำกลับมาอัปโหลดในแท็บ &quot;นำเข้า&quot;
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleExportSeatingXlsx}
                        className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 hover:bg-emerald-100/60 transition text-left space-y-2 cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                            <span>ดาวน์โหลดไฟล์ Excel (.xlsx)</span>
                          </span>
                          <Download className="w-4 h-4 text-emerald-600 group-hover:translate-y-0.5 transition" />
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          ไฟล์สมบูรณ์ มีการจัดรูปแบบหัวตารางให้อ่านง่าย รองรับ Microsoft Excel และ Google Sheets
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportSeatingCsv}
                        className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50/50 hover:bg-blue-100/60 transition text-left space-y-2 cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-blue-950 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span>ดาวน์โหลดไฟล์ CSV (.csv)</span>
                          </span>
                          <Download className="w-4 h-4 text-blue-600 group-hover:translate-y-0.5 transition" />
                        </div>
                        <p className="text-[11px] text-blue-800">
                          ไฟล์ CSV มาตรฐานพร้อม UTF-8 BOM สำหรับเปิดในโปรแกรมสเปรดชีตอื่นๆ
                        </p>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={handleDownloadBlankTemplate}
                        className="w-full py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-slate-500" />
                        <span>ดาวน์โหลดแม่แบบผังที่นั่งเปล่า (Blank Template)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* File Upload Box */}
                    <div className="p-4 border-2 border-dashed border-indigo-300 rounded-2xl bg-indigo-50/40 text-center space-y-2 relative hover:bg-indigo-50/70 transition">
                      <input
                        type="file"
                        accept=".xlsx,.csv,.tsv,.txt"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-8 h-8 text-indigo-600 mx-auto" />
                      <div className="font-extrabold text-xs text-indigo-950">
                        คลิกเพื่อเลือกไฟล์ หรือลากไฟล์ Excel (.xlsx) / CSV มาวางที่นี่
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ระบบจะตรวจจับคอลัมน์รหัสนิสิตและหมายเลขที่นั่งให้อัตโนมัติ
                      </div>
                      {importFileName && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-indigo-200 text-indigo-800 text-[11px] font-bold shadow-xs">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                          <span>ไฟล์ที่เลือก: {importFileName}</span>
                        </div>
                      )}
                    </div>

                    {/* Paste alternative */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        หรือคัดลอก (Copy) ข้อมูลจาก Excel แล้วนำมาวางในช่องนี้:
                      </label>
                      <textarea
                        rows={3}
                        value={importRawText}
                        onChange={(e) => handlePasteText(e.target.value)}
                        placeholder="วางข้อมูล เช่น: 6701501001 [Tab] A-01 หรือวางทั้งตารางจาก Excel..."
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-[11px] focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                      />
                    </div>

                    {/* Preview Table */}
                    {importPreviewRows.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <span>ตัวอย่างข้อมูลที่ตรวจพบ ({importPreviewRows.length} รายการ)</span>
                          </span>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-emerald-700 font-bold">
                              ✓ ถูกต้อง: {importPreviewRows.filter((r) => r.status === 'VALID').length}
                            </span>
                            {importPreviewRows.some((r) => r.status === 'DUPLICATE_SEAT') && (
                              <span className="text-amber-700 font-bold">
                                ⚠️ ที่นั่งซ้ำ: {importPreviewRows.filter((r) => r.status === 'DUPLICATE_SEAT').length}
                              </span>
                            )}
                            {importPreviewRows.some((r) => r.status === 'NOT_FOUND') && (
                              <span className="text-rose-700 font-bold">
                                ❌ ไม่พบรหัส: {importPreviewRows.filter((r) => r.status === 'NOT_FOUND').length}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-600 sticky top-0 font-bold border-b">
                              <tr>
                                <th className="p-2 w-28">รหัสนิสิต</th>
                                <th className="p-2">ชื่อผู้เข้าร่วม</th>
                                <th className="p-2 w-24">เลขที่นั่ง</th>
                                <th className="p-2 w-24">โซน</th>
                                <th className="p-2 w-32 text-center">สถานะ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {importPreviewRows.slice(0, 100).map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="p-2 font-mono font-bold text-slate-800">{row.studentCode}</td>
                                  <td className="p-2 text-slate-700 truncate max-w-[140px]">{row.studentName}</td>
                                  <td className="p-2 font-mono font-extrabold text-indigo-700">
                                    {row.seatNumber || '-'}
                                  </td>
                                  <td className="p-2 text-slate-500">{row.seatZone || '-'}</td>
                                  <td className="p-2 text-center">
                                    {row.status === 'VALID' ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        ✓ พร้อมบันทึก
                                      </span>
                                    ) : row.status === 'DUPLICATE_SEAT' ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800" title={row.statusNote}>
                                        ⚠️ ที่นั่งซ้ำ
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800" title={row.statusNote}>
                                        ❌ ไม่พบรหัส
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportExportModalOpen(false);
                    setImportPreviewRows([]);
                  }}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  ปิด
                </button>

                {importExportTab === 'IMPORT' && (
                  <button
                    type="button"
                    onClick={handleApplyImportedSeating}
                    disabled={isImporting || importPreviewRows.filter((r) => r.status !== 'NOT_FOUND').length === 0}
                    className="px-5 py-2 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {isImporting
                        ? 'กำลังบันทึกข้อมูล...'
                        : `ยืนยันบันทึกผังที่นั่ง (${importPreviewRows.filter((r) => r.status !== 'NOT_FOUND').length} คน)`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
