'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Users,
  Search,
  Filter,
  Download,
  Share2,
  FileText,
  Printer,
  ExternalLink,
  ShieldCheck,
  Check,
  ChevronDown,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import type { StudentEvent, EventRegistration } from '@/types';
import { downloadCsvFile, downloadXlsx, type XlsxSheet } from '@/lib/utils';
import { VipassanaExecutiveReportModal } from './vipassana';
import {
  StudentEvaluationRow,
  VipassanaBatchCertDialog,
} from './evaluation';

export type { StudentEvaluationRow };

interface VipassanaCombinedEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  registrations: EventRegistration[];
  onRefresh?: () => void;
}

export const VipassanaCombinedEvaluationModal: React.FC<VipassanaCombinedEvaluationModalProps> = ({
  isOpen,
  onClose,
  event,
  registrations,
  onRefresh,
}) => {
  const isEnglishProgram =
    event.targetProgram === 'ENGLISH' || event.title.toLowerCase().includes('inter');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'REVIEW' | 'FAILED' | 'CERT_ISSUED'>('ALL');
  const [selectedRegIds, setSelectedRegIds] = useState<Set<string>>(new Set());

  // Manual Committee Decision Overrides (ดุลยพินิจ ผลรวมโครงการ: ผ่าน / ไม่ผ่าน / คืนค่า)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, 'PASS' | 'NOT_PASS' | 'RESET'>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Export Dropdown State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExecutiveReport, setShowExecutiveReport] = useState(false);

  // Batch Certificate Issuance Form State
  const [showCertDialog, setShowCertDialog] = useState(false);
  const [isIssuingCerts, setIsIssuingCerts] = useState(false);
  const [docNoPrefix, setDocNoPrefix] = useState('8002');
  const [issueDateTh, setIssueDateTh] = useState('22 ธันวาคม 2568');
  const [issueDateEn, setIssueDateEn] = useState('December 22, 2025');
  const [signerNameTh, setSignerNameTh] = useState('พระธรรมวชิราจารย์, ศ.ดร.');
  const [signerTitleTh, setSignerTitleTh] = useState('คณบดีคณะพุทธศาสตร์');

  // LINE Notification Summary State
  const [copiedLineMsg, setCopiedLineMsg] = useState(false);

  const totalDays = event.totalDays || (event.eventType === 'MEDITATION' ? 10 : 1);
  const totalPeriodsRequired = totalDays * 4;

  // Process rows
  const evaluationRows: StudentEvaluationRow[] = useMemo(() => {
    return registrations.map((r) => {
      // 1. Calculate Attendance
      let attendedPeriods = 0;
      let absentPeriods = 0;

      if (r.dailyAttendance) {
        Object.values(r.dailyAttendance).forEach((day) => {
          if (day) {
            ['p1', 'p2', 'p3', 'p4'].forEach((pKey) => {
              const p = day[pKey];
              if (p) {
                if (p.status === 'PRESENT' || p.status === 'LATE') {
                  attendedPeriods += 1;
                } else if (p.status === 'ABSENT') {
                  absentPeriods += 1;
                }
              }
            });
          }
        });
      }

      // If registered but no daily attendance entries yet
      const attendancePercent =
        totalPeriodsRequired > 0 ? Math.round((attendedPeriods / totalPeriodsRequired) * 100) : 0;
      // Rule: missing <= 4 periods is passing (ขาด 4 ช่วงเวลา เท่ากับขาด 1 วัน)
      const attendancePassed = absentPeriods <= 4 && (attendancePercent >= 80 || attendedPeriods >= totalPeriodsRequired - 4);

      // 2. Calculate Interviews
      const s1 = r.vipassanaInterviews?.s1?.result;
      const s2 = r.vipassanaInterviews?.s2?.result;
      const s3 = r.vipassanaInterviews?.s3?.result;

      // Has passed if at least s1 passed and none failed
      const anyFail = s1 === 'NOT_PASS' || s2 === 'NOT_PASS' || s3 === 'NOT_PASS';
      const hasPass = s1 === 'PASS' || s2 === 'PASS' || s3 === 'PASS' || r.passedMeditation === true;
      const interviewsPassed = hasPass && !anyFail;

      // 3. Combined Decision with Committee Override
      const override = statusOverrides[r.id];
      let overallStatus: 'PASSED' | 'REVIEW' | 'FAILED' = 'REVIEW';

      if (override === 'PASS' || (!override && r.finalMeditationResult === 'PASS')) {
        overallStatus = 'PASSED';
      } else if (override === 'NOT_PASS' || (!override && r.finalMeditationResult === 'NOT_PASS')) {
        overallStatus = 'FAILED';
      } else if (attendancePassed && interviewsPassed) {
        overallStatus = 'PASSED';
      } else if (anyFail || absentPeriods > 8) {
        overallStatus = 'FAILED';
      } else {
        overallStatus = 'REVIEW';
      }

      const gNum = r.groupNumber || (r.groupName ? parseInt(r.groupName.replace(/\D/g, ''), 10) : undefined);

      return {
        registration: r,
        id: r.id,
        studentCode: r.studentCode,
        groupSpecificCode: r.groupSpecificCode,
        studentName: r.studentName,
        groupNumber: gNum,
        degreeLevel: r.degreeLevel,
        programType: r.programType,
        yearLevel: r.yearLevel,
        vasa: r.vasa,
        totalPeriodsRequired,
        attendedPeriods,
        absentPeriods,
        attendancePercent,
        attendancePassed,
        interviewS1: s1,
        interviewS2: s2,
        interviewS3: s3,
        interviewsPassed,
        overallStatus,
        certificateIssued: Boolean(r.certificateIssued || r.certificateDocNo),
        certificateDocNo: r.certificateDocNo,
      };
    });
  }, [registrations, totalPeriodsRequired, statusOverrides]);

  // Available groups
  const availableGroups = useMemo(() => {
    const s = new Set<number>();
    evaluationRows.forEach((r) => {
      if (r.groupNumber) s.add(r.groupNumber);
    });
    return Array.from(s).sort((a, b) => a - b);
  }, [evaluationRows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return evaluationRows.filter((r) => {
      const matchGroup = selectedGroup === 'ALL' || r.groupNumber === selectedGroup;
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'CERT_ISSUED'
          ? r.certificateIssued
          : r.overallStatus === statusFilter;

      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        r.studentCode.toLowerCase().includes(q) ||
        (r.groupSpecificCode && r.groupSpecificCode.toLowerCase().includes(q)) ||
        r.studentName.toLowerCase().includes(q);

      return matchGroup && matchStatus && matchQuery;
    });
  }, [evaluationRows, selectedGroup, statusFilter, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = evaluationRows.length;
    const passed = evaluationRows.filter((r) => r.overallStatus === 'PASSED').length;
    const review = evaluationRows.filter((r) => r.overallStatus === 'REVIEW').length;
    const failed = evaluationRows.filter((r) => r.overallStatus === 'FAILED').length;
    const certIssued = evaluationRows.filter((r) => r.certificateIssued).length;
    return { total, passed, review, failed, certIssued };
  }, [evaluationRows]);

  if (!isOpen) return null;

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedRegIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all filtered
  const handleSelectAllFiltered = () => {
    if (selectedRegIds.size === filteredRows.length) {
      setSelectedRegIds(new Set());
    } else {
      setSelectedRegIds(new Set(filteredRows.map((r) => r.id)));
    }
  };

  // Select only passed
  const handleSelectPassed = () => {
    const passedIds = filteredRows.filter((r) => r.overallStatus === 'PASSED').map((r) => r.id);
    setSelectedRegIds(new Set(passedIds));
  };

  // Select only review
  const handleSelectReview = () => {
    const reviewIds = filteredRows.filter((r) => r.overallStatus === 'REVIEW').map((r) => r.id);
    setSelectedRegIds(new Set(reviewIds));
  };

  // Update single evaluation status (ดุลยพินิจ ผลรวมโครงการ: ผ่าน / ไม่ผ่าน / คืนค่า)
  const handleUpdateEvaluationStatus = async (
    regId: string,
    decision: 'PASS' | 'NOT_PASS' | 'RESET'
  ) => {
    setUpdatingId(regId);
    setStatusOverrides((prev) => ({ ...prev, [regId]: decision }));
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_vipassana_evaluation_status',
          eventId: event.id,
          registrationId: regId,
          decision,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert('ไม่สามารถปรับผลการประเมินได้: ' + (data.error || ''));
        setStatusOverrides((prev) => {
          const next = { ...prev };
          delete next[regId];
          return next;
        });
      } else if (onRefresh) {
        onRefresh();
      }
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : String(err)));
      setStatusOverrides((prev) => {
        const next = { ...prev };
        delete next[regId];
        return next;
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Batch update evaluation status for all selected rows
  const handleBatchUpdateStatus = async (decision: 'PASS' | 'NOT_PASS') => {
    if (selectedRegIds.size === 0) return;
    const targetIds = Array.from(selectedRegIds);
    const actionLabel = decision === 'PASS' ? 'ผ่านโครงการ' : 'ไม่ผ่าน';
    if (
      !window.confirm(
        `ยืนยันการปรับผลรวมโครงการของนิสิตที่เลือกจำนวน ${targetIds.length} รายการ เป็น "${actionLabel}" หรือไม่?`
      )
    ) {
      return;
    }

    setUpdatingId('BATCH');
    const newOverrides = { ...statusOverrides };
    targetIds.forEach((id) => {
      newOverrides[id] = decision;
    });
    setStatusOverrides(newOverrides);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_vipassana_evaluation_status',
          eventId: event.id,
          registrationIds: targetIds,
          decision,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert('ไม่สามารถปรับผลการประเมินเป็นชุดได้: ' + (data.error || ''));
      } else {
        alert(`ปรับผลรวมโครงการเป็น "${actionLabel}" สำเร็จ ${targetIds.length} รายการ!`);
        if (onRefresh) onRefresh();
      }
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUpdatingId(null);
    }
  };

  // Batch Issue Certificates
  const handleConfirmIssueCertificates = async () => {
    if (selectedRegIds.size === 0) {
      alert('กรุณาเลือกนิสิตที่ต้องการออกวุฒิบัตร');
      return;
    }

    setIsIssuingCerts(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_approve_and_issue_certificates',
          eventId: event.id,
          registrationIds: Array.from(selectedRegIds),
          docNoPrefix,
          issueDateTh,
          issueDateEn,
          signerNameTh,
          signerTitleTh,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`ออกวุฒิบัตรและอนุมัติผ่านสำเร็จ ${data.data?.issuedCount || selectedRegIds.size} รายการ!`);
        setShowCertDialog(false);
        setSelectedRegIds(new Set());
        if (onRefresh) onRefresh();
      } else {
        alert('ออกวุฒิบัตรไม่สำเร็จ: ' + data.error);
      }
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsIssuingCerts(false);
    }
  };

  // Export Combined XLSX / CSV (All, Passed Only, Failed Only, Review Only)
  const exportData = (
    mode: 'ALL' | 'PASSED' | 'FAILED' | 'REVIEW',
    format: 'XLSX' | 'CSV'
  ) => {
    const targetRows = evaluationRows.filter((r) => {
      if (mode === 'ALL') return true;
      return r.overallStatus === mode;
    });

    if (targetRows.length === 0) {
      alert(
        `ไม่พบข้อมูลนิสิตในกลุ่ม "${
          mode === 'PASSED'
            ? 'ผู้ผ่านโครงการ'
            : mode === 'FAILED'
            ? 'ผู้ไม่ผ่านโครงการ'
            : mode === 'REVIEW'
            ? 'ผู้รอพิจารณา/ดุลยพินิจ'
            : 'ทั้งหมด'
        }" สำหรับการส่งออก`
      );
      return;
    }

    const modeLabel =
      mode === 'ALL'
        ? 'ทั้งหมด'
        : mode === 'PASSED'
        ? `ผู้ผ่าน_${targetRows.length}_รูป`
        : mode === 'FAILED'
        ? `ผู้ไม่ผ่าน_${targetRows.length}_รูป`
        : `รอพิจารณา_${targetRows.length}_รูป`;

    const safeTitle = (event.title || 'วิปัสสนากัมมัฏฐาน')
      .replace(/[/\\?%*:|"<>]/g, '_')
      .slice(0, 30);
    const dateTag = new Date().toISOString().slice(0, 10);
    const filename = `ผลประเมิน_${safeTitle}_${modeLabel}_${dateTag}`;

    const headers = [
      'ลำดับ',
      'กลุ่ม',
      'เลขเฉพาะกลุ่ม',
      'รหัสนิสิต',
      'ชื่อ-ฉายา/นามสกุล',
      'พรรษา',
      'ระดับการศึกษา',
      'หลักสูตร',
      'สาขาวิชา',
      'ชั้นปี',
      'เวลาปฏิบัติที่เข้า (รอบ)',
      'ขาด (รอบ)',
      'เกณฑ์รวม (รอบ)',
      'ร้อยละเวลา (%)',
      'สถานะเกณฑ์เวลา',
      'สอบอารมณ์ครั้งที่ 1',
      'สอบอารมณ์ครั้งที่ 2',
      'สอบอารมณ์ครั้งที่ 3',
      'สถานะสอบอารมณ์',
      'ผลรวมโครงการ',
      'มติ/ดุลยพินิจ',
      'สถานะวุฒิบัตร',
      'เลขที่วุฒิบัตร',
    ];

    const dataRows = targetRows.map((r, idx) => {
      const interviewStatus = r.interviewsPassed ? 'ผ่านครบตามเกณฑ์' : 'ยังไม่ครบ/รอประเมิน';
      const overallText =
        r.overallStatus === 'PASSED'
          ? 'ผ่านโครงการ'
          : r.overallStatus === 'FAILED'
          ? 'ไม่ผ่าน'
          : 'ดุลยพินิจ/รอผล';

      const overrideText =
        r.registration.finalMeditationResult === 'PASS' || statusOverrides[r.id] === 'PASS'
          ? 'มติผ่าน (ดุลยพินิจ)'
          : r.registration.finalMeditationResult === 'NOT_PASS' || statusOverrides[r.id] === 'NOT_PASS'
          ? 'มติไม่ผ่าน'
          : 'คำนวณตามเกณฑ์';

      return [
        idx + 1,
        r.groupNumber || '-',
        r.groupSpecificCode || '-',
        r.studentCode,
        r.studentName,
        r.vasa || '-',
        r.degreeLevel || 'ปริญญาตรี',
        r.programType === 'ENGLISH' ? 'นานาชาติ (Inter)' : 'ภาคภาษาไทย',
        r.registration.major || '-',
        r.yearLevel || 1,
        r.attendedPeriods,
        r.absentPeriods,
        r.totalPeriodsRequired,
        `${r.attendancePercent}%`,
        r.attendancePassed ? 'ผ่านเกณฑ์เวลา' : 'เวลาไม่ถึง',
        r.interviewS1 === 'PASS' ? 'ผ่าน' : r.interviewS1 === 'NOT_PASS' ? 'ไม่ผ่าน' : '-',
        r.interviewS2 === 'PASS' ? 'ผ่าน' : r.interviewS2 === 'NOT_PASS' ? 'ไม่ผ่าน' : '-',
        r.interviewS3 === 'PASS' ? 'ผ่าน' : r.interviewS3 === 'NOT_PASS' ? 'ไม่ผ่าน' : '-',
        interviewStatus,
        overallText,
        overrideText,
        r.certificateIssued ? 'ออกแล้ว' : 'ยังไม่ออก',
        r.certificateDocNo || '-',
      ];
    });

    if (format === 'CSV') {
      downloadCsvFile(`${filename}.csv`, headers, dataRows);
    } else {
      const sheet: XlsxSheet = {
        name:
          mode === 'PASSED'
            ? 'ผู้ผ่านโครงการ'
            : mode === 'FAILED'
            ? 'ผู้ไม่ผ่านโครงการ'
            : mode === 'REVIEW'
            ? 'ผู้รอพิจารณา'
            : 'ผลการประเมินรวม',
        title: `รายงานผลการประเมินโครงการ: ${event.title}`,
        subtitle: `ประเภท: ${modeLabel} | ข้อมูล ณ วันที่ ${new Date().toLocaleDateString(
          'th-TH'
        )} | จำนวน ${targetRows.length} รายการ`,
        headers,
        rows: dataRows,
        columnWidths: [
          8, 8, 14, 15, 26, 8, 14, 16, 20, 8, 12, 10, 12, 14, 16, 12, 12, 12, 18, 16, 18, 14, 25,
        ],
      };
      downloadXlsx(`${filename}.xlsx`, [sheet]);
    }
    setShowExportMenu(false);
  };

  // Copy LINE Broadcast Message
  const handleCopyLineBroadcast = () => {
    const text = `📢 ประกาศผลการประเมินโครงการปฏิบัติวิปัสสนากัมมัฏฐาน
คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
โครงการ: ${event.title}

📊 สรุปภาพรวม:
• นิสิตเข้าร่วมทั้งหมด: ${stats.total} รูป/คน
• ผ่านเกณฑ์สมบูรณ์: ${stats.passed} รูป/คน
• อยู่ระหว่างพิจารณา/สอบซ่อม: ${stats.review} รูป/คน
• ออกวุฒิบัตรดิจิทัลแล้ว: ${stats.certIssued} ฉบับ

✅ เกณฑ์การผ่านโครงการ:
1. การบันทึกเวลา 4 ช่วงเวลาต่อวัน: ขาดได้ไม่เกิน 4 ช่วงเวลา (คิดเป็น 1 วัน) หรือเวลาปฏิบัติ >= 80%
2. การสอบอารมณ์สติปัฏฐาน 4: ผ่านการประเมินจากพระวิปัสสนาจารย์

🔗 ตรวจสอบรายชื่อและวุฒิบัตรดิจิทัลได้ที่ระบบบริการการศึกษา คณะพุทธศาสตร์`;

    navigator.clipboard.writeText(text);
    setCopiedLineMsg(true);
    setTimeout(() => setCopiedLineMsg(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-7xl max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Award className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  ระบบประมวลผลผ่านโครงการ (Combined Evaluation)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400 text-emerald-950">
                  เกณฑ์พิจารณาร่วม 2 มิติ
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 truncate max-w-2xl">
                {event.title} • บูรณาการเวลาปฏิบัติ 4 รอบ/วัน ร่วมกับผลสอบอารมณ์สติปัฏฐาน 4
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Stats Ribbon */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-black text-slate-900">{stats.total}</div>
              <div className="text-[10.5px] text-slate-500">นิสิตทั้งหมด</div>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-black text-emerald-700">{stats.passed}</div>
              <div className="text-[10.5px] text-slate-500">ผ่านทั้ง 2 เกณฑ์</div>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-black text-amber-700">{stats.review}</div>
              <div className="text-[10.5px] text-slate-500">ดุลยพินิจ/รอพิจารณา</div>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-rose-200 shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 font-bold">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-black text-rose-700">{stats.failed}</div>
              <div className="text-[10.5px] text-slate-500">ไม่ผ่านเกณฑ์</div>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-purple-200 shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-black text-purple-700">{stats.certIssued}</div>
              <div className="text-[10.5px] text-slate-500">ออกวุฒิบัตรแล้ว</div>
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหารหัส / ชื่อ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-36 sm:w-48 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Group Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-600">กลุ่ม:</span>
              <select
                value={selectedGroup}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedGroup(v === 'ALL' ? 'ALL' : parseInt(v, 10));
                }}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">ทุกกลุ่ม ({availableGroups.length})</option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>
                    กลุ่ม {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-600">สถานะ:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">ทุกสถานะผลการประเมิน</option>
                <option value="PASSED">🟢 ผ่านทั้ง 2 เกณฑ์</option>
                <option value="REVIEW">🟡 รอพิจารณา/สอบซ่อม</option>
                <option value="FAILED">🔴 ไม่ผ่าน</option>
                <option value="CERT_ISSUED">🎓 ออกวุฒิบัตรแล้ว</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap relative">
            <button
              type="button"
              onClick={() => setShowExecutiveReport(true)}
              className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="พิมพ์หรือส่งออกบันทึกข้อความสรุปผลโครงการวิปัสสนาเสนอคณบดี (Excel / PDF / A4)"
            >
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span>บันทึกข้อความเสนอคณบดี (PDF / Excel)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLineBroadcast}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="คัดลอกข้อความสรุปผลโครงการสำหรับส่งเข้ากลุ่ม LINE นิสิต"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{copiedLineMsg ? '✓ คัดลอกสำเร็จ!' : 'สรุปข้อความส่ง LINE'}</span>
            </button>

            {/* Export Dropdown with Separate File Options */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-blue-700" />
                <span>ส่งออก Excel / CSV</span>
                <ChevronDown className={`w-3 h-3 text-blue-600 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs animate-in fade-in space-y-1">
                    <div className="px-3 py-1 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                      เลือกกลุ่มข้อมูลและรูปแบบที่ต้องการส่งออก
                    </div>

                    {/* Section 1: All Participants */}
                    <div className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition">
                      <div className="font-extrabold text-slate-800 text-[11px]">
                        📊 รายชื่อทั้งหมด ({stats.total} รูป/คน)
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => exportData('ALL', 'XLSX')}
                          className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>Excel (.xlsx)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => exportData('ALL', 'CSV')}
                          className="flex-1 py-1 px-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10.5px] flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Section 2: Passed Only */}
                    <div className="p-2 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/60 transition border border-emerald-100">
                      <div className="font-extrabold text-emerald-900 text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>เฉพาะผู้ผ่านโครงการ ({stats.passed} รูป/คน)</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => exportData('PASSED', 'XLSX')}
                          className="flex-1 py-1 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10.5px] flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>Excel (.xlsx)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => exportData('PASSED', 'CSV')}
                          className="flex-1 py-1 px-2 rounded-lg bg-emerald-200/80 hover:bg-emerald-300 text-emerald-900 font-bold text-[10.5px] flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Section 3: Failed Only */}
                    <div className="p-2 rounded-xl bg-rose-50/70 hover:bg-rose-100/60 transition border border-rose-100">
                      <div className="font-extrabold text-rose-900 text-[11px] flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>เฉพาะผู้ไม่ผ่านโครงการ ({stats.failed} รูป/คน)</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => exportData('FAILED', 'XLSX')}
                          className="flex-1 py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10.5px] flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>Excel (.xlsx)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => exportData('FAILED', 'CSV')}
                          className="flex-1 py-1 px-2 rounded-lg bg-rose-200/80 hover:bg-rose-300 text-rose-900 font-bold text-[10.5px] flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Section 4: Review / Discretion Only */}
                    <div className="p-2 rounded-xl bg-amber-50/70 hover:bg-amber-100/60 transition border border-amber-100">
                      <div className="font-extrabold text-amber-900 text-[11px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>เฉพาะผู้รอผล / ดุลยพินิจ ({stats.review} รูป/คน)</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => exportData('REVIEW', 'XLSX')}
                          className="flex-1 py-1 px-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10.5px] flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>Excel (.xlsx)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => exportData('REVIEW', 'CSV')}
                          className="flex-1 py-1 px-2 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-[10.5px] flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>CSV</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowCertDialog(true)}
              disabled={selectedRegIds.size === 0}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
            >
              <Award className="w-4 h-4 text-emerald-200" />
              <span>อนุมัติ & ออกวุฒิบัตร ({selectedRegIds.size})</span>
            </button>
          </div>
        </div>

        {/* Selection Quick Bar */}
        <div className="px-6 py-2 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="font-bold text-emerald-800 hover:underline cursor-pointer"
            >
              {selectedRegIds.size === filteredRows.length ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมดในหน้านี้'}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleSelectPassed}
              className="font-bold text-emerald-800 hover:underline cursor-pointer"
            >
              เลือกเฉพาะผู้ผ่านเกณฑ์ ({stats.passed})
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleSelectReview}
              className="font-bold text-amber-800 hover:underline cursor-pointer"
            >
              เลือกเฉพาะผู้รอผล/ดุลยพินิจ ({stats.review})
            </button>

            {selectedRegIds.size > 0 && (
              <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-300">
                <span className="font-bold text-slate-700">ดุลยพินิจเป็นชุด:</span>
                <button
                  type="button"
                  disabled={updatingId === 'BATCH'}
                  onClick={() => handleBatchUpdateStatus('PASS')}
                  className="px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  ✓ มติผ่าน ({selectedRegIds.size})
                </button>
                <button
                  type="button"
                  disabled={updatingId === 'BATCH'}
                  onClick={() => handleBatchUpdateStatus('NOT_PASS')}
                  className="px-2.5 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  ✕ มติไม่ผ่าน ({selectedRegIds.size})
                </button>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500">
            เลือกแล้ว <strong className="text-slate-900">{selectedRegIds.size}</strong> รายการ จากที่แสดง{' '}
            <strong className="text-slate-900">{filteredRows.length}</strong> รายการ
          </div>
        </div>

        {/* Main Combined Table */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50/40">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredRows.length > 0 && selectedRegIds.size === filteredRows.length}
                      onChange={handleSelectAllFiltered}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 w-12 text-center">กลุ่ม</th>
                  <th className="p-3 w-24">รหัส</th>
                  <th className="p-3 min-w-[160px]">ชื่อ-ฉายา / นามสกุล</th>
                  <th className="p-3 text-center">หลักสูตร / สาขา</th>
                  {/* Attendance Header */}
                  <th className="p-3 bg-amber-50 text-amber-950 text-center border-l border-amber-200">
                    เข้าเวลา (รอบ)
                  </th>
                  <th className="p-3 bg-amber-50 text-amber-950 text-center">
                    ขาด (รอบ)
                  </th>
                  <th className="p-3 bg-amber-50 text-amber-950 text-center">
                    เกณฑ์เวลา
                  </th>
                  {/* Interview Header */}
                  <th className="p-3 bg-purple-50 text-purple-950 text-center border-l border-purple-200">
                    สอบ 1
                  </th>
                  <th className="p-3 bg-purple-50 text-purple-950 text-center">
                    สอบ 2
                  </th>
                  <th className="p-3 bg-purple-50 text-purple-950 text-center">
                    สอบ 3
                  </th>
                  <th className="p-3 bg-purple-50 text-purple-950 text-center">
                    ผลสอบอารมณ์
                  </th>
                  {/* Overall & Cert Header */}
                  <th className="p-3 bg-emerald-50 text-emerald-950 text-center border-l border-emerald-200 min-w-[150px]">
                    ผลรวมโครงการ
                  </th>
                  <th className="p-3 text-right">วุฒิบัตรดิจิทัล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="p-12 text-center text-slate-400">
                      ไม่พบข้อมูลนิสิตตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const isSelected = selectedRegIds.has(row.id);

                    return (
                      <tr
                        key={row.id}
                        onClick={() => handleToggleSelect(row.id)}
                        className={`transition cursor-pointer select-none ${
                          isSelected ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(row.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center font-bold text-amber-900">
                          {row.groupNumber || '-'}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800">
                          <div>{row.groupSpecificCode || row.studentCode}</div>
                          {row.groupSpecificCode && (
                            <div className="text-[10px] text-slate-400 font-normal">{row.studentCode}</div>
                          )}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          <div>{row.studentName}</div>
                          {row.vasa && <span className="text-[10px] text-purple-700 font-normal">พรรษา {row.vasa}</span>}
                        </td>
                        <td className="p-3 text-center text-[11px]">
                          <div>{row.degreeLevel || 'ปริญญาตรี'}</div>
                          <div className="text-[10px] text-slate-400">
                            {row.programType === 'ENGLISH' ? '🌐 Inter' : '🇹🇭 ภาคไทย'} • ปี {row.yearLevel || 1}
                          </div>
                        </td>

                        {/* Attendance Columns */}
                        <td className="p-3 text-center font-mono font-bold text-amber-950 bg-amber-50/40 border-l border-amber-200">
                          {row.attendedPeriods} / {row.totalPeriodsRequired}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-600 bg-amber-50/40">
                          {row.absentPeriods > 0 ? (
                            <span className="text-rose-600 font-bold">{row.absentPeriods}</span>
                          ) : (
                            <span className="text-emerald-700">0</span>
                          )}
                        </td>
                        <td className="p-3 text-center bg-amber-50/40">
                          {row.attendancePassed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{row.attendancePercent}% (ผ่าน)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" />
                              <span>{row.attendancePercent}% (ไม่ถึง)</span>
                            </span>
                          )}
                        </td>

                        {/* Interview Columns */}
                        <td className="p-3 text-center font-mono bg-purple-50/40 border-l border-purple-200">
                          {row.interviewS1 === 'PASS' ? (
                            <span className="text-emerald-700 font-bold">✓</span>
                          ) : row.interviewS1 === 'NOT_PASS' ? (
                            <span className="text-rose-600 font-bold">✗</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono bg-purple-50/40">
                          {row.interviewS2 === 'PASS' ? (
                            <span className="text-emerald-700 font-bold">✓</span>
                          ) : row.interviewS2 === 'NOT_PASS' ? (
                            <span className="text-rose-600 font-bold">✗</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono bg-purple-50/40">
                          {row.interviewS3 === 'PASS' ? (
                            <span className="text-emerald-700 font-bold">✓</span>
                          ) : row.interviewS3 === 'NOT_PASS' ? (
                            <span className="text-rose-600 font-bold">✗</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center bg-purple-50/40">
                          {row.interviewsPassed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                              ผ่านครบ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800">
                              รอประเมิน
                            </span>
                          )}
                        </td>

                        {/* Combined Overall Decision: ผ่าน, ไม่ผ่าน, ดุลยพินิจ */}
                        <td className="p-3 text-center border-l border-emerald-200 bg-emerald-50/30">
                          {row.overallStatus === 'PASSED' ? (
                            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>ผ่านโครงการ</span>
                              </span>
                              <button
                                type="button"
                                disabled={updatingId === row.id}
                                onClick={() => handleUpdateEvaluationStatus(row.id, 'NOT_PASS')}
                                title="คลิกเพื่อเปลี่ยนเป็น ไม่ผ่าน"
                                className="text-[10.5px] font-bold text-slate-400 hover:text-rose-600 underline cursor-pointer p-0.5"
                              >
                                เปลี่ยน
                              </button>
                              {(row.registration.finalMeditationResult || statusOverrides[row.id]) && (
                                <button
                                  type="button"
                                  disabled={updatingId === row.id}
                                  onClick={() => handleUpdateEvaluationStatus(row.id, 'RESET')}
                                  title="คืนค่าผลตามเกณฑ์คำนวณอัตโนมัติ"
                                  className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 cursor-pointer p-0.5"
                                >
                                  ↺
                                </button>
                              )}
                            </div>
                          ) : row.overallStatus === 'FAILED' ? (
                            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>ไม่ผ่าน</span>
                              </span>
                              <button
                                type="button"
                                disabled={updatingId === row.id}
                                onClick={() => handleUpdateEvaluationStatus(row.id, 'PASS')}
                                title="ดุลยพินิจ: คลิกเพื่อเปลี่ยนเป็น ผ่านโครงการ"
                                className="text-[10.5px] font-bold text-slate-400 hover:text-emerald-700 underline cursor-pointer p-0.5"
                              >
                                เปลี่ยน
                              </button>
                              {(row.registration.finalMeditationResult || statusOverrides[row.id]) && (
                                <button
                                  type="button"
                                  disabled={updatingId === row.id}
                                  onClick={() => handleUpdateEvaluationStatus(row.id, 'RESET')}
                                  title="คืนค่าผลตามเกณฑ์คำนวณอัตโนมัติ"
                                  className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 cursor-pointer p-0.5"
                                >
                                  ↺
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                disabled={updatingId === row.id}
                                onClick={() => handleUpdateEvaluationStatus(row.id, 'PASS')}
                                title="ดุลยพินิจคณะกรรมการ: ปรับผลเป็น ผ่านโครงการ"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>ผ่าน</span>
                              </button>
                              <button
                                type="button"
                                disabled={updatingId === row.id}
                                onClick={() => handleUpdateEvaluationStatus(row.id, 'NOT_PASS')}
                                title="ดุลยพินิจคณะกรรมการ: ปรับผลเป็น ไม่ผ่าน"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5 stroke-[3]" />
                                <span>ไม่ผ่าน</span>
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Certificate Info */}
                        <td className="p-3 text-right">
                          {row.certificateIssued ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                <Award className="w-3 h-3 text-purple-600" />
                                <span>{row.certificateDocNo || 'ออกแล้ว'}</span>
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">ยังไม่ออก</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500">
            แสดง {filteredRows.length} รายการ • เกณฑ์เวลา: ขาดไม่เกิน 4 ช่วงเวลา (1 วัน) และสอบอารมณ์ผ่าน
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

        {/* Batch Certificate Issuance Dialog */}
        <VipassanaBatchCertDialog
          isOpen={showCertDialog}
          onClose={() => setShowCertDialog(false)}
          selectedCount={selectedRegIds.size}
          docNoPrefix={docNoPrefix}
          setDocNoPrefix={setDocNoPrefix}
          issueDateTh={issueDateTh}
          setIssueDateTh={setIssueDateTh}
          issueDateEn={issueDateEn}
          setIssueDateEn={setIssueDateEn}
          signerNameTh={signerNameTh}
          setSignerNameTh={setSignerNameTh}
          signerTitleTh={signerTitleTh}
          setSignerTitleTh={setSignerTitleTh}
          isIssuingCerts={isIssuingCerts}
          onConfirm={handleConfirmIssueCertificates}
        />

        {/* Executive Summary Memo Modal for Dean */}
        {showExecutiveReport && (
          <VipassanaExecutiveReportModal
            isOpen={showExecutiveReport}
            onClose={() => setShowExecutiveReport(false)}
            event={event}
            registrations={registrations}
            evaluationRows={evaluationRows}
            stats={stats}
          />
        )}
      </div>
    </div>
  );
};
