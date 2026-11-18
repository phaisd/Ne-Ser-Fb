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
} from 'lucide-react';
import type { StudentEvent, EventRegistration } from '@/types';
import { downloadCsvFile } from '@/lib/utils';

interface VipassanaCombinedEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  registrations: EventRegistration[];
  onRefresh?: () => void;
}

interface StudentEvaluationRow {
  registration: EventRegistration;
  id: string;
  studentCode: string;
  groupSpecificCode?: string;
  studentName: string;
  groupNumber?: number;
  degreeLevel?: string;
  programType?: string;
  yearLevel?: number;
  vasa?: string | number;
  // Dimension 1: Attendance
  totalPeriodsRequired: number;
  attendedPeriods: number;
  absentPeriods: number;
  attendancePercent: number;
  attendancePassed: boolean;
  // Dimension 2: Meditation Master Interviews
  interviewS1?: 'PASS' | 'NOT_PASS' | 'PENDING';
  interviewS2?: 'PASS' | 'NOT_PASS' | 'PENDING';
  interviewS3?: 'PASS' | 'NOT_PASS' | 'PENDING';
  interviewsPassed: boolean;
  // Dimension 3: Combined Result
  overallStatus: 'PASSED' | 'REVIEW' | 'FAILED';
  // Dimension 4: Certificate
  certificateIssued: boolean;
  certificateDocNo?: string;
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

      // 3. Combined Decision
      let overallStatus: 'PASSED' | 'REVIEW' | 'FAILED' = 'REVIEW';
      if (attendancePassed && interviewsPassed) {
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
  }, [registrations, totalPeriodsRequired]);

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

  // Export Combined CSV
  const handleExportCsv = () => {
    const headers = [
      'กลุ่ม',
      'เลขเฉพาะกลุ่ม',
      'รหัสนิสิต',
      'ชื่อ-ฉายา/นามสกุล',
      'พรรษา',
      'หลักสูตร',
      'สาขาวิชา',
      'ชั้นปี',
      'ช่วงเวลาที่เข้า (รอบ)',
      'ขาด (รอบ)',
      'ร้อยละการเข้า (%)',
      'สถานะเวลา',
      'สอบอารมณ์ครั้งที่ 1',
      'สอบอารมณ์ครั้งที่ 2',
      'สอบอารมณ์ครั้งที่ 3',
      'สถานะสอบอารมณ์',
      'ผลประเมินรวม',
      'เลขที่วุฒิบัตร',
    ];

    const rows = filteredRows.map((r) => [
      r.groupNumber || '-',
      r.groupSpecificCode || '-',
      r.studentCode,
      r.studentName,
      r.vasa || '-',
      r.programType || '-',
      r.registration.major || '-',
      r.yearLevel || 1,
      r.attendedPeriods,
      r.absentPeriods,
      `${r.attendancePercent}%`,
      r.attendancePassed ? 'ผ่านเกณฑ์เวลา' : 'เวลาไม่ถึง',
      r.interviewS1 || '-',
      r.interviewS2 || '-',
      r.interviewS3 || '-',
      r.interviewsPassed ? 'ผ่านครบ' : 'ยังไม่ครบ/มีไม่ผ่าน',
      r.overallStatus === 'PASSED' ? 'ผ่านโครงการ' : r.overallStatus === 'REVIEW' ? 'รอพิจารณา' : 'ไม่ผ่าน',
      r.certificateDocNo || '-',
    ]);

    downloadCsvFile(`vipassana_combined_evaluation_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
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
                  ระบบประมวลผลผ่านโครงการและออกวุฒิบัตร (Combined Evaluation & Certificates)
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
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyLineBroadcast}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="คัดลอกข้อความสรุปผลโครงการสำหรับส่งเข้ากลุ่ม LINE นิสิต"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{copiedLineMsg ? '✓ คัดลอกสำเร็จ!' : 'สรุปข้อความส่ง LINE'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>ส่งออก Excel / CSV</span>
            </button>

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
        <div className="px-6 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
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
                  <th className="p-3 bg-emerald-50 text-emerald-950 text-center border-l border-emerald-200">
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

                        {/* Combined Overall Decision */}
                        <td className="p-3 text-center border-l border-emerald-200 bg-emerald-50/30">
                          {row.overallStatus === 'PASSED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>ผ่านโครงการ</span>
                            </span>
                          ) : row.overallStatus === 'FAILED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>ไม่ผ่าน</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                              <Clock className="w-3.5 h-3.5 text-amber-700" />
                              <span>ดุลยพินิจ/รอผล</span>
                            </span>
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
        {showCertDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    อนุมัติผ่านโครงการและออกวุฒิบัตรดิจิทัล
                  </h3>
                  <p className="text-xs text-slate-500">
                    ระบบจะสร้างเลขที่วุฒิบัตรและบันทึกข้อมูลเข้าสู่ระบบประกาศนียบัตรอัตโนมัติ
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs">
                กำลังจะออกวุฒิบัตรให้นิสิตที่เลือกทั้งหมด <strong>{selectedRegIds.size}</strong> รูป/คน
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">หมวดหมู่เลขที่เอกสาร (Prefix):</label>
                  <input
                    type="text"
                    value={docNoPrefix}
                    onChange={(e) => setDocNoPrefix(e.target.value)}
                    placeholder="เช่น 8002 หรือ 8002.1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    ตัวอย่างเลขที่: มจร {docNoPrefix}/ว.วป-2569-001
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">วันที่ออก (ภาษาไทย):</label>
                    <input
                      type="text"
                      value={issueDateTh}
                      onChange={(e) => setIssueDateTh(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Date (English):</label>
                    <input
                      type="text"
                      value={issueDateEn}
                      onChange={(e) => setIssueDateEn(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">ผู้ลงนาม (คณบดี/ผู้มีอำนาจ):</label>
                  <input
                    type="text"
                    value={signerNameTh}
                    onChange={(e) => setSignerNameTh(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">ตำแหน่งผู้ลงนาม:</label>
                  <input
                    type="text"
                    value={signerTitleTh}
                    onChange={(e) => setSignerTitleTh(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCertDialog(false)}
                  disabled={isIssuingCerts}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmIssueCertificates}
                  disabled={isIssuingCerts}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Award className="w-4 h-4" />
                  <span>{isIssuingCerts ? 'กำลังออกวุฒิบัตร...' : `ยืนยันออกวุฒิบัตร (${selectedRegIds.size} รายการ)`}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
