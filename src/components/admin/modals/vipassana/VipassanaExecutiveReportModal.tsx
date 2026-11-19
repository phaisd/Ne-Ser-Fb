'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  FileText,
  Calendar,
  Building,
  Sparkles,
  Edit3,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Info,
} from 'lucide-react';
import type { StudentEvent, EventRegistration } from '@/types/event';
import type { StudentEvaluationRow } from '../VipassanaCombinedEvaluationModal';
import { downloadXlsx, type XlsxSheet } from '@/lib/utils/xlsx-export';

interface VipassanaExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  registrations: EventRegistration[];
  evaluationRows: StudentEvaluationRow[];
  stats: {
    total: number;
    passed: number;
    review: number;
    failed: number;
    certIssued: number;
  };
}

export const VipassanaExecutiveReportModal: React.FC<VipassanaExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  event,
  registrations,
  evaluationRows,
  stats,
}) => {
  // Document Parameters (Editable before Print / Export)
  const [memoNo, setMemoNo] = useState('อว ๔๕.๐๓ / พิเศษ ๒๕๖๙');
  const [memoDate, setMemoDate] = useState(() => {
    const today = new Date();
    const thMonths = [
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม',
    ];
    const thYear = today.getFullYear() + 543;
    return `${today.getDate()} ${thMonths[today.getMonth()]} ${thYear}`;
  });
  const [memoSubject, setMemoSubject] = useState(
    `รายงานสรุปผลการประเมินโครงการปฏิบัติวิปัสสนากัมมัฏฐาน ประจำปีการศึกษา ๒๕๖๙ และเสนอพิจารณาอนุมัติผล`
  );
  const [masterChairmanName, setMasterChairmanName] = useState(
    'พระมหาไพศาล ดิษฐพันธ์'
  );
  const [coordinatorName, setCoordinatorName] = useState(
    event.coordinatorName || 'พระมหาสุรพงษ์ อาจารวํโส'
  );
  const [coordinatorTitle, setCoordinatorTitle] = useState(
    event.coordinatorTitle || 'รองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์ / ผู้รับผิดชอบโครงการ'
  );
  const [deanName, setDeanName] = useState(
    'พระธรรมวัชรบัณฑิต, ศ.ดร.'
  );

  // Custom observation text (pre-filled with analysis)
  const [customObservations, setCustomObservations] = useState(
    `๑. ด้านสภาวะธรรมทางกาย (กายานุปัสสนา): นิสิตส่วนใหญ่สามารถกำหนดรู้อิริยาบถหลัก (ยืน เดิน นั่ง นอน) ได้อย่างต่อเนื่อง มีสติระลึกรู้อิริยาบถย่อยดีขึ้นตามลำดับ\n` +
      `๒. ด้านเวทนา (เวทนานุปัสสนา): ในช่วง ๓-๕ วันแรก นิสิตส่วนใหญ่เผชิญกับทุกขเวทนาทางกาย (อาการปวดเมื่อย ชา ตึง) แต่ได้รับการแนะนำให้ใช้ขันติธรรมและการกำหนดรู้ไตรลักษณ์ จนสามารถก้าวข้ามเวทนาได้\n` +
      `๓. ด้านจิตและนิวรณ์ (จิตตานุปัสสนา & ธัมมานุปัสสนา): พบอาการถีนมิทธะ (ความง่วงเหงาหาวนอน) และอุทธัจจะ (ความฟุ้งซ่าน) ในช่วงบ่าย พระวิปัสสนาจารย์ได้แนะนำให้ปรับการเดินจงกรมให้ถี่ขึ้นและกำหนดรู้อาการพอง-ยุบให้ละเอียด\n` +
      `๔. ข้อเสนอแนะเชิงพัฒนา: ควรส่งเสริมการฝึกเจริญสติในชีวิตประจำวันอย่างต่อเนื่องหลังจบโครงการ และสนับสนุนสื่อการสอนปฏิบัติธรรมสองภาษาสำหรับนิสิตนานาชาติ`
  );

  // Compute Percentages
  const passPercent = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) : '0.00';
  const failPercent = stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(2) : '0.00';
  const reviewPercent = stats.total > 0 ? ((stats.review / stats.total) * 100).toFixed(2) : '0.00';

  // Breakdown by Degree Level
  const degreeStats = useMemo(() => {
    const map = new Map<string, { total: number; passed: number; failed: number; review: number }>();
    ['ปริญญาตรี', 'ปริญญาโท', 'ปริญญาเอก'].forEach((d) => {
      map.set(d, { total: 0, passed: 0, failed: 0, review: 0 });
    });

    evaluationRows.forEach((r) => {
      let deg = 'ปริญญาตรี';
      const rawDeg = String(r.degreeLevel || '').toLowerCase();
      if (rawDeg.includes('เอก') || rawDeg.includes('phd') || rawDeg.includes('doctor')) {
        deg = 'ปริญญาเอก';
      } else if (rawDeg.includes('โท') || rawDeg.includes('master')) {
        deg = 'ปริญญาโท';
      }

      const curr = map.get(deg) || { total: 0, passed: 0, failed: 0, review: 0 };
      curr.total += 1;
      if (r.overallStatus === 'PASSED') curr.passed += 1;
      else if (r.overallStatus === 'FAILED') curr.failed += 1;
      else curr.review += 1;
      map.set(deg, curr);
    });

    return Array.from(map.entries()).map(([deg, s]) => ({
      degree: deg,
      total: s.total,
      passed: s.passed,
      failed: s.failed,
      review: s.review,
      passPercent: s.total > 0 ? ((s.passed / s.total) * 100).toFixed(1) : '0.0',
    }));
  }, [evaluationRows]);

  // Breakdown by Program Type (THAI vs ENGLISH)
  const programStats = useMemo(() => {
    let thaiTotal = 0;
    let thaiPassed = 0;
    let interTotal = 0;
    let interPassed = 0;

    evaluationRows.forEach((r) => {
      if (r.programType === 'ENGLISH') {
        interTotal += 1;
        if (r.overallStatus === 'PASSED') interPassed += 1;
      } else {
        thaiTotal += 1;
        if (r.overallStatus === 'PASSED') thaiPassed += 1;
      }
    });

    return {
      thai: {
        total: thaiTotal,
        passed: thaiPassed,
        passPercent: thaiTotal > 0 ? ((thaiPassed / thaiTotal) * 100).toFixed(1) : '0.0',
      },
      inter: {
        total: interTotal,
        passed: interPassed,
        passPercent: interTotal > 0 ? ((interPassed / interTotal) * 100).toFixed(1) : '0.0',
      },
    };
  }, [evaluationRows]);

  // Breakdown by Group
  const groupStats = useMemo(() => {
    const map = new Map<number, { total: number; passed: number; failed: number; review: number }>();
    evaluationRows.forEach((r) => {
      const g = r.groupNumber || 1;
      const curr = map.get(g) || { total: 0, passed: 0, failed: 0, review: 0 };
      curr.total += 1;
      if (r.overallStatus === 'PASSED') curr.passed += 1;
      else if (r.overallStatus === 'FAILED') curr.failed += 1;
      else curr.review += 1;
      map.set(g, curr);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([groupNum, s]) => ({
        groupNum,
        total: s.total,
        passed: s.passed,
        failed: s.failed,
        review: s.review,
        passPercent: s.total > 0 ? ((s.passed / s.total) * 100).toFixed(1) : '0.0',
      }));
  }, [evaluationRows]);

  // Real comments aggregated from interview sessions
  const actualMasterObservations = useMemo(() => {
    const list: Array<{ studentName: string; group?: number; session: number; remarks: string }> = [];
    registrations.forEach((reg) => {
      const ints = reg.vipassanaInterviews;
      if (!ints) return;
      if (ints.s1?.remarks?.trim()) {
        list.push({ studentName: reg.studentName, group: reg.groupNumber, session: 1, remarks: ints.s1.remarks.trim() });
      }
      if (ints.s2?.remarks?.trim()) {
        list.push({ studentName: reg.studentName, group: reg.groupNumber, session: 2, remarks: ints.s2.remarks.trim() });
      }
      if (ints.s3?.remarks?.trim()) {
        list.push({ studentName: reg.studentName, group: reg.groupNumber, session: 3, remarks: ints.s3.remarks.trim() });
      }
    });
    return list;
  }, [registrations]);

  // Handle Excel Export
  const handleExportExcel = () => {
    // Sheet 1: Executive Summary Memo
    const sheet1Rows: Array<Array<string | number>> = [
      ['บันทึกข้อความสรุปผลโครงการสำหรับเสนอคณบดี'],
      ['ส่วนงาน', 'คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'],
      ['ที่', memoNo],
      ['วันที่', memoDate],
      ['เรื่อง', memoSubject],
      ['เรียน', 'คณบดีคณะพุทธศาสตร์'],
      [''],
      ['๑. ข้อมูลทั่วไปของโครงการ'],
      ['ชื่อโครงการ', event.title],
      ['สถานที่จัด', event.location || 'อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย จ.นครปฐม'],
      ['ระยะเวลา', `${event.startDate || '-'} ถึง ${event.endDate || '-'}`],
      ['เวลากิจกรรม', event.eventTime || 'ปฏิบัติวิปัสสนากัมมัฏฐานต่อเนื่อง ๔ ช่วงเวลาต่อวัน'],
      [''],
      ['๒. สรุปสถิติผลการเข้าร่วมและประเมินผลโครงการ (Key Performance Indicators)'],
      ['รายการสถิติ', 'จำนวน (รูป/คน)', 'คิดเป็นร้อยละ (%)'],
      ['นิสิตลงทะเบียนเข้าร่วมทั้งหมด', stats.total, '100.00%'],
      ['ผู้ผ่านการประเมินตามเกณฑ์สมบูรณ์', stats.passed, `${passPercent}%`],
      ['ผู้ไม่ผ่านเกณฑ์', stats.failed, `${failPercent}%`],
      ['ผู้อยู่ในดุลยพินิจคณะกรรมการ/รอสอบซ่อม', stats.review, `${reviewPercent}%`],
      ['ออกวุฒิบัตรดิจิทัลแล้ว', stats.certIssued, stats.total > 0 ? `${((stats.certIssued / stats.total) * 100).toFixed(2)}%` : '0.00%'],
      [''],
      ['๓. สรุปผลจำแนกตามระดับการศึกษา'],
      ['ระดับการศึกษา', 'จำนวนทั้งหมด', 'ผ่านเกณฑ์', 'ไม่ผ่าน', 'รอผล', 'ร้อยละผู้ผ่าน (%)'],
      ...degreeStats.map((d) => [d.degree, d.total, d.passed, d.failed, d.review, `${d.passPercent}%`]),
      [''],
      ['๔. สรุปผลจำแนกตามหลักสูตรภาษา'],
      ['หลักสูตร', 'จำนวนทั้งหมด', 'ผ่านเกณฑ์', 'ร้อยละผู้ผ่าน (%)'],
      ['หลักสูตรภาษาไทย (Thai Program)', programStats.thai.total, programStats.thai.passed, `${programStats.thai.passPercent}%`],
      ['หลักสูตรนานาชาติ (International Program)', programStats.inter.total, programStats.inter.passed, `${programStats.inter.passPercent}%`],
      [''],
      ['๕. ปัญหา อุปสรรค และข้อสังเกตจากพระวิปัสสนาจารย์'],
      [customObservations],
      [''],
      ['๖. ผู้รับรองและเสนอรายงาน'],
      ['ประธานคณะทำงานพระวิปัสสนาจารย์', masterChairmanName],
      ['ผู้รับผิดชอบโครงการ', coordinatorName, coordinatorTitle],
      ['คณบดีคณะพุทธศาสตร์', deanName],
    ];

    const sheet1: XlsxSheet = {
      name: 'บันทึกข้อความสรุปผล (Memo)',
      title: `บันทึกข้อความ: ${memoSubject}`,
      subtitle: `โครงการ: ${event.title} | วันที่ ${memoDate}`,
      headers: ['หัวข้อ / รายการ', 'รายละเอียด / ค่าสถิติ', 'หมายเหตุ / ร้อยละ'],
      rows: sheet1Rows,
      columnWidths: [36, 42, 30],
    };

    // Sheet 2: Group Statistics
    const sheet2Headers = ['กลุ่มที่', 'จำนวนนิสิตทั้งหมด (รูป/คน)', 'ผ่านเกณฑ์', 'ไม่ผ่าน', 'รอผล', 'ร้อยละผู้ผ่าน (%)'];
    const sheet2Rows = groupStats.map((g) => [
      `กลุ่มที่ ${g.groupNum}`,
      g.total,
      g.passed,
      g.failed,
      g.review,
      `${g.passPercent}%`,
    ]);

    const sheet2: XlsxSheet = {
      name: 'สถิติแยกตามกลุ่ม (By Group)',
      title: `สถิติการประเมินผลแยกตามกลุ่ม: ${event.title}`,
      subtitle: `ข้อมูล ณ วันที่ ${memoDate}`,
      headers: sheet2Headers,
      rows: sheet2Rows,
      columnWidths: [16, 26, 16, 16, 16, 20],
    };

    // Sheet 3: Actual Observations from Masters
    const sheet3Headers = ['ลำดับ', 'ชื่อ-นามสกุล นิสิต', 'กลุ่ม', 'สอบอารมณ์ครั้งที่', 'ข้อสังเกต / คำแนะนำสภาวะธรรม'];
    const sheet3Rows = actualMasterObservations.map((obs, idx) => [
      idx + 1,
      obs.studentName,
      obs.group ? `กลุ่มที่ ${obs.group}` : '-',
      `รอบที่ ${obs.session}`,
      obs.remarks,
    ]);

    const sheet3: XlsxSheet = {
      name: 'ข้อสังเกตพระวิปัสสนาจารย์',
      title: `รวบรวมข้อสังเกตและคำแนะนำสภาวะธรรมจากการสอบอารมณ์: ${event.title}`,
      subtitle: `จำนวน ${actualMasterObservations.length} รายการบันทึก`,
      headers: sheet3Headers,
      rows: sheet3Rows.length > 0 ? sheet3Rows : [[1, '-', '-', '-', 'ยังไม่มีข้อความบันทึกสภาวะธรรมเพิ่มเติม']],
      columnWidths: [8, 28, 12, 18, 55],
    };

    downloadXlsx(`บันทึกข้อความสรุปผลโครงการ_${event.title.replace(/\s+/g, '_')}.xlsx`, [
      sheet1,
      sheet2,
      sheet3,
    ]);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Control Bar (Screen Only) */}
        <div className="print:hidden px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <FileText className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  บันทึกข้อความสรุปผลโครงการสำหรับเสนอคณบดี (Executive Summary Report)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-400 text-amber-950">
                  แบบฟอร์มทางการ
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 truncate max-w-xl">
                {event.title} • พิมพ์ A4 นำเสนอผู้บริหาร พร้อมสถิติ ร้อยละ และช่องลงนาม 3 ตำแหน่ง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="ส่งออกเอกสารสรุปผลและสถิติเป็นไฟล์ Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ส่งออก Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
              title="สั่งพิมพ์เอกสาร A4 หรือบันทึกเป็น PDF"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์บันทึกข้อความ (PDF / A4)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Memo Container */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          {/* A4 Paper Sheet Canvas */}
          <div className="max-w-[210mm] mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-slate-200 print:border-none print:shadow-none print:rounded-none print:p-8 text-slate-900 leading-normal text-[13px] font-serif sm:font-sans">
            {/* Header: MCU Emblem & Official Title */}
            <div className="relative border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-[10px] text-slate-500 shrink-0 print:border-black">
                  [ตรา มจร]
                </div>
                <div className="text-center flex-1 pr-16">
                  <h1 className="text-2xl font-black tracking-widest text-slate-900 font-serif">
                    บันทึกข้อความ
                  </h1>
                </div>
              </div>

              {/* Memo Formal Meta Table */}
              <div className="grid grid-cols-12 gap-y-1.5 text-xs pt-3 font-sans">
                <div className="col-span-12 flex items-baseline">
                  <span className="font-bold w-20 shrink-0">ส่วนงาน:</span>
                  <span className="font-semibold text-slate-800 flex-1">
                    คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย โทร. ๐๓๕-๒๔๘-๐๐๐ ต่อ ๘๓๒๓
                  </span>
                </div>
                <div className="col-span-6 flex items-baseline">
                  <span className="font-bold w-20 shrink-0">ที่:</span>
                  <input
                    type="text"
                    value={memoNo}
                    onChange={(e) => setMemoNo(e.target.value)}
                    className="font-semibold text-slate-800 bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-amber-500 w-full print:border-none"
                  />
                </div>
                <div className="col-span-6 flex items-baseline justify-end">
                  <span className="font-bold mr-2">วันที่:</span>
                  <input
                    type="text"
                    value={memoDate}
                    onChange={(e) => setMemoDate(e.target.value)}
                    className="font-semibold text-slate-800 bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-amber-500 text-right print:border-none w-44"
                  />
                </div>
                <div className="col-span-12 flex items-baseline pt-1">
                  <span className="font-bold w-20 shrink-0">เรื่อง:</span>
                  <input
                    type="text"
                    value={memoSubject}
                    onChange={(e) => setMemoSubject(e.target.value)}
                    className="font-bold text-slate-900 bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-amber-500 flex-1 print:border-none"
                  />
                </div>
                <div className="col-span-12 flex items-baseline pt-1 border-t border-slate-200 mt-1">
                  <span className="font-bold w-20 shrink-0">เรียน:</span>
                  <span className="font-bold text-slate-900">คณบดีคณะพุทธศาสตร์</span>
                </div>
              </div>
            </div>

            {/* Memo Content Body */}
            <div className="space-y-4 text-xs sm:text-[12.5px] leading-relaxed text-slate-800 font-sans">
              {/* Paragraph 1: Background */}
              <p className="indent-8 text-justify">
                ตามที่ คณะพุทธศาสตร์ ได้ดำเนินการจัด{' '}
                <strong className="text-slate-900">{event.title}</strong> ประจำปีการศึกษา{' '}
                {event.academicYear || '๒๕๖๙'} ระหว่างวันที่ {event.startDate || '-'} ถึงวันที่{' '}
                {event.endDate || '-'} ณ {event.location || 'อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย จ.นครปฐม'}{' '}
                โดยมีวัตถุประสงค์เพื่อส่งเสริมให้นิสิตได้ฝึกอบรมจิตตภาวนาตามหลักสติปัฏฐาน ๔
                และบูรณาการการประเมินผล ๒ มิติ ได้แก่ มิติเวลาปฏิบัติธรรม ๔ ช่วงเวลาต่อวัน และมิติการสอบอารมณ์สติปัฏฐาน ๔ นั้น
              </p>

              {/* Paragraph 2: Executive Results Summary */}
              <p className="indent-8 text-justify">
                บัดนี้ คณะทำงานพระวิปัสสนาจารย์และผู้รับผิดชอบโครงการได้ดำเนินโครงการและประมวลผลการเข้าร่วมปฏิบัติธรรมของนิสิตเรียบร้อยแล้ว จึงขอรายงานสรุปผลการประเมินโครงการ ดังนี้
              </p>

              {/* KPI Summary Cards / Table */}
              <div className="my-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-300 print:bg-white print:border-black">
                <div className="font-bold text-slate-900 mb-2 text-xs flex items-center justify-between">
                  <span>ตารางที่ ๑ สรุปภาพรวมการประเมินผลโครงการ (Key Performance Indicators)</span>
                  <span className="text-emerald-700 font-black">ผ่านเกณฑ์ {passPercent}%</span>
                </div>
                <table className="w-full text-center border-collapse text-[11.5px]">
                  <thead>
                    <tr className="bg-slate-200/80 print:bg-slate-100 text-slate-800 border-y border-slate-300 print:border-black">
                      <th className="py-1.5 px-2 text-left">รายการสถิติการประเมิน</th>
                      <th className="py-1.5 px-2">จำนวน (รูป/คน)</th>
                      <th className="py-1.5 px-2">คิดเป็นร้อยละ (%)</th>
                      <th className="py-1.5 px-2">สถานะวุฒิบัตรดิจิทัล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 print:divide-black">
                    <tr>
                      <td className="py-1.5 px-2 text-left font-semibold">๑. นิสิตลงทะเบียนเข้าร่วมโครงการทั้งหมด</td>
                      <td className="py-1.5 px-2 font-black">{stats.total}</td>
                      <td className="py-1.5 px-2 font-bold">๑๐๐.๐๐ %</td>
                      <td className="py-1.5 px-2 text-slate-500">-</td>
                    </tr>
                    <tr className="bg-emerald-50/70 print:bg-white font-bold text-emerald-950">
                      <td className="py-1.5 px-2 text-left">๒. ผู้ผ่านเกณฑ์มาตรฐานสมบูรณ์ (เวลา &gt;= 80% และสอบอารมณ์ผ่าน)</td>
                      <td className="py-1.5 px-2 font-black text-emerald-700 print:text-black">{stats.passed}</td>
                      <td className="py-1.5 px-2 font-black text-emerald-700 print:text-black">{passPercent} %</td>
                      <td className="py-1.5 px-2 font-semibold text-emerald-800 print:text-black">พร้อมออกวุฒิบัตรดิจิทัล</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 text-left font-medium">๓. ผู้อยู่ในดุลยพินิจคณะกรรมการ / รอสอบซ่อม</td>
                      <td className="py-1.5 px-2 font-bold text-amber-700 print:text-black">{stats.review}</td>
                      <td className="py-1.5 px-2 font-medium text-amber-800 print:text-black">{reviewPercent} %</td>
                      <td className="py-1.5 px-2 text-amber-800 print:text-black">รอผลการสอบซ่อม</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 text-left font-medium">๔. ผู้ไม่ผ่านเกณฑ์การประเมิน</td>
                      <td className="py-1.5 px-2 font-bold text-rose-700 print:text-black">{stats.failed}</td>
                      <td className="py-1.5 px-2 font-medium text-rose-800 print:text-black">{failPercent} %</td>
                      <td className="py-1.5 px-2 text-rose-800 print:text-black">ไม่อนุมัติวุฒิบัตร</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sub-table: Degree Level & Program Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                <div className="p-3 rounded-xl border border-slate-300 print:border-black">
                  <div className="font-bold text-slate-900 mb-1 text-[11.5px]">
                    ตารางที่ ๒ จำแนกตามระดับการศึกษา
                  </div>
                  <table className="w-full text-center border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 print:border-black font-semibold">
                        <th className="py-1 text-left px-1.5">ระดับ</th>
                        <th className="py-1 px-1">รวม</th>
                        <th className="py-1 px-1 text-emerald-700 print:text-black">ผ่าน</th>
                        <th className="py-1 px-1 text-rose-700 print:text-black">ไม่ผ่าน</th>
                        <th className="py-1 px-1">ร้อยละ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 print:divide-black">
                      {degreeStats.map((d) => (
                        <tr key={d.degree}>
                          <td className="py-1 px-1.5 text-left font-medium">{d.degree}</td>
                          <td className="py-1 px-1 font-bold">{d.total}</td>
                          <td className="py-1 px-1 text-emerald-700 print:text-black font-bold">{d.passed}</td>
                          <td className="py-1 px-1 text-rose-700 print:text-black">{d.failed}</td>
                          <td className="py-1 px-1 font-semibold">{d.passPercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 rounded-xl border border-slate-300 print:border-black">
                  <div className="font-bold text-slate-900 mb-1 text-[11.5px]">
                    ตารางที่ ๓ จำแนกตามหลักสูตรภาษา
                  </div>
                  <table className="w-full text-center border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 print:border-black font-semibold">
                        <th className="py-1 text-left px-1.5">หลักสูตร</th>
                        <th className="py-1 px-1">รวม</th>
                        <th className="py-1 px-1 text-emerald-700 print:text-black">ผ่าน</th>
                        <th className="py-1 px-1">ร้อยละ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 print:divide-black">
                      <tr>
                        <td className="py-1 px-1.5 text-left font-medium">ภาคภาษาไทย</td>
                        <td className="py-1 px-1 font-bold">{programStats.thai.total}</td>
                        <td className="py-1 px-1 text-emerald-700 print:text-black font-bold">{programStats.thai.passed}</td>
                        <td className="py-1 px-1 font-semibold">{programStats.thai.passPercent}%</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-1.5 text-left font-medium">นานาชาติ (Inter)</td>
                        <td className="py-1 px-1 font-bold">{programStats.inter.total}</td>
                        <td className="py-1 px-1 text-emerald-700 print:text-black font-bold">{programStats.inter.passed}</td>
                        <td className="py-1 px-1 font-semibold">{programStats.inter.passPercent}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Master Observations & Feedback */}
              <div className="space-y-1.5 pt-1">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span>๓. ปัญหา อุปสรรค และข้อสังเกตจากพระวิปัสสนาจารย์ (Observations & Insights):</span>
                  <span className="text-[10px] text-slate-400 font-normal print:hidden">
                    (สามารถแก้ไขข้อความได้โดยตรงในช่องด้านล่าง)
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={customObservations}
                  onChange={(e) => setCustomObservations(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 text-[11.5px] leading-relaxed bg-slate-50/50 print:bg-white print:border-none print:p-0 print:resize-none outline-none focus:border-amber-500"
                />
              </div>

              {/* Section 4: Recommendations for Decision */}
              <div className="space-y-1 pt-1">
                <div className="font-bold text-slate-900 text-xs">๔. ข้อเสนอเพื่อโปรดพิจารณา:</div>
                <p className="indent-8 text-justify">
                  เพื่อให้การดำเนินงานด้านกิจการนิสิตและการรับรองมาตรฐานการปฏิบัติวิปัสสนากัมมัฏฐานเป็นไปด้วยความเรียบร้อย ถูกต้องตามระเบียบของมหาวิทยาลัย คณะทำงานจึงเห็นควรดำเนินการ ดังนี้
                </p>
                <div className="pl-6 space-y-0.5">
                  <div>๑. โปรดทราบผลการดำเนินโครงการปฏิบัติวิปัสสนากัมมัฏฐาน ประจำปีการศึกษา ๒๕๖๙</div>
                  <div>
                    ๒. โปรดพิจารณาอนุมัติผลการประเมินนิสิตผู้ผ่านเกณฑ์ จำนวน {stats.passed} รูป/คน และเห็นชอบการออกวุฒิบัตรดิจิทัล
                  </div>
                </div>
                <p className="indent-8 pt-1">จึงเรียนมาเพื่อโปรดทราบและพิจารณาอนุมัติ</p>
              </div>

              {/* Signatures: 3 Official Signing Blocks */}
              <div className="pt-6 mt-4 border-t border-slate-200 print:border-black space-y-8">
                {/* Row 1: Master Chairman & Coordinator */}
                <div className="grid grid-cols-2 gap-8 text-center text-[11.5px]">
                  {/* Left: Master Chairman */}
                  <div className="space-y-1">
                    <div className="text-slate-400">ลงชื่อ ...........................................................</div>
                    <div className="font-bold text-slate-900">( {masterChairmanName} )</div>
                    <div className="text-slate-600 font-medium">ประธานคณะทำงานพระวิปัสสนาจารย์</div>
                    <div className="text-slate-500 text-[10.5px]">วันที่ {memoDate}</div>
                  </div>

                  {/* Right: Project Coordinator */}
                  <div className="space-y-1">
                    <div className="text-slate-400">ลงชื่อ ...........................................................</div>
                    <div className="font-bold text-slate-900">( {coordinatorName} )</div>
                    <div className="text-slate-600 font-medium">{coordinatorTitle}</div>
                    <div className="text-slate-500 text-[10.5px]">วันที่ {memoDate}</div>
                  </div>
                </div>

                {/* Row 2: Dean Decision & Signature Box */}
                <div className="p-4 rounded-xl border-2 border-slate-800 bg-slate-50/70 print:bg-white text-[11.5px] space-y-3 max-w-lg mx-auto">
                  <div className="font-bold text-slate-900 text-center border-b border-slate-300 pb-1">
                    คำสั่งการ / ความเห็นของคณบดีคณะพุทธศาสตร์
                  </div>
                  <div className="flex items-center justify-around font-semibold">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                      <span>[  ] ทราบ</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                      <span>[  ] อนุมัติผลการประเมินและให้ออกวุฒิบัตรได้</span>
                    </label>
                  </div>
                  <div className="pt-3 text-center space-y-1">
                    <div className="text-slate-400">ลงชื่อ ...........................................................</div>
                    <div className="font-bold text-slate-900">( {deanName} )</div>
                    <div className="font-bold text-slate-800">คณบดีคณะพุทธศาสตร์</div>
                    <div className="text-slate-500 text-[10.5px]">วันที่ ......./......./.......</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
