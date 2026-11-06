'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Save,
  Sparkles,
  Upload,
  Download,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
  Eye,
  Edit3,
  BookOpen,
  Clock,
  MapPin,
} from 'lucide-react';
import { CourseGradeSheet, StudentScoreItem } from '@/types';
import { toSafeCsvCell, cleanImportedCsvCell } from '@/lib/security';
import { groupAndSortByMajor, classifyMajor } from './majorGrouping';

export interface GradeSheetStudentInput {
  studentCode: string;
  studentName: string;
  major?: string;
  yearLevel?: number;
  nationality?: string;
  attendedPercent?: number;
  eligibilityStatus?: 'ELIGIBLE' | 'WARNING' | 'INELIGIBLE';
}

export interface GradeSheetTabProps {
  currentUser: any;
  currentCourse: any;
  availableCourses: any[];
  selectedCourseCode: string;
  handleCourseChange: (code: string) => void;
  studentsList: GradeSheetStudentInput[];
  logoUrl?: string;
}

const GRADING_SCALE = [
  { grade: 'A', level: '4', min: 90, max: 100, labelTh: '90-100', labelEn: '90-100' },
  { grade: 'B+', level: '3.5', min: 85, max: 89.99, labelTh: '85-89', labelEn: '85-89' },
  { grade: 'B', level: '3', min: 80, max: 84.99, labelTh: '80-84', labelEn: '80-84' },
  { grade: 'C+', level: '2.5', min: 75, max: 79.99, labelTh: '75-79', labelEn: '75-79' },
  { grade: 'C', level: '2', min: 70, max: 74.99, labelTh: '70-74', labelEn: '70-74' },
  { grade: 'D+', level: '1.5', min: 65, max: 69.99, labelTh: '65-69', labelEn: '65-69' },
  { grade: 'D', level: '1', min: 60, max: 64.99, labelTh: '60-64', labelEn: '60-64' },
  { grade: 'F', level: '0', min: 0, max: 59.99, labelTh: 'Below 60', labelEn: 'below 60' },
];

export function calculateMcuGrade(total: number | null | undefined): string {
  if (total === null || total === undefined || isNaN(total)) return '';
  const rounded = Math.round(total);
  if (rounded >= 90) return 'A';
  if (rounded >= 85) return 'B+';
  if (rounded >= 80) return 'B';
  if (rounded >= 75) return 'C+';
  if (rounded >= 70) return 'C';
  if (rounded >= 65) return 'D+';
  if (rounded >= 60) return 'D';
  return 'F';
}

function getEnglishOrdinalYear(year?: string | number): string {
  const y = Number(year) || 1;
  if (y === 1) return 'First';
  if (y === 2) return 'Second';
  if (y === 3) return 'Third';
  if (y === 4) return 'Fourth';
  return `${y}th`;
}

export function GradeSheetTab({
  currentUser,
  currentCourse,
  availableCourses,
  selectedCourseCode,
  handleCourseChange,
  studentsList,
  logoUrl,
}: GradeSheetTabProps) {
  const [formLanguage, setFormLanguage] = useState<'THAI' | 'ENGLISH'>('THAI');
  const [printBlankForm, setPrintBlankForm] = useState<boolean>(false);
  const [showPrintPreviewOnScreen, setShowPrintPreviewOnScreen] = useState<boolean>(true);
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  // A4 Print Table Row Height & Font Size Customization (Default upgraded from 22px/12px to 28px/14px for clear reading & handwriting)
  const [printSizePreset, setPrintSizePreset] = useState<'COMPACT' | 'STANDARD' | 'LARGE' | 'CUSTOM'>('STANDARD');
  const [printRowHeightPx, setPrintRowHeightPx] = useState<number>(28);
  const [printFontSizePx, setPrintFontSizePx] = useState<number>(14);
  const [resolvedLogoUrl, setResolvedLogoUrl] = useState<string>(
    logoUrl && logoUrl !== '/mcu-seal.png' ? logoUrl : '/uploads/logo-1793607622279.png'
  );

  // Load saved A4 print row/font preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mcu_grade_sheet_print_scale_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.preset) setPrintSizePreset(parsed.preset);
        if (typeof parsed.rowHeight === 'number') setPrintRowHeightPx(parsed.rowHeight);
        if (typeof parsed.fontSize === 'number') setPrintFontSizePx(parsed.fontSize);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const applyPrintSizePreset = (preset: 'COMPACT' | 'STANDARD' | 'LARGE') => {
    setPrintSizePreset(preset);
    const nextRow = preset === 'COMPACT' ? 24 : preset === 'STANDARD' ? 28 : 34;
    const nextFont = preset === 'COMPACT' ? 12.5 : preset === 'STANDARD' ? 14 : 15.5;
    setPrintRowHeightPx(nextRow);
    setPrintFontSizePx(nextFont);
    try {
      localStorage.setItem(
        'mcu_grade_sheet_print_scale_v1',
        JSON.stringify({ preset, rowHeight: nextRow, fontSize: nextFont })
      );
    } catch {}
  };

  const handleCustomPrintScaleChange = (newRowHeight: number, newFontSize: number) => {
    const clampedRow = Math.max(20, Math.min(44, newRowHeight));
    const clampedFont = Math.max(11, Math.min(18, Number(newFontSize.toFixed(1))));
    setPrintSizePreset('CUSTOM');
    setPrintRowHeightPx(clampedRow);
    setPrintFontSizePx(clampedFont);
    try {
      localStorage.setItem(
        'mcu_grade_sheet_print_scale_v1',
        JSON.stringify({ preset: 'CUSTOM', rowHeight: clampedRow, fontSize: clampedFont })
      );
    } catch {}
  };

  // Max score weights (Default: Assign 20 + Affective 10 + Midterm 30 + Final 40 = 100)
  const [maxAssignScore, setMaxAssignScore] = useState<number>(20);
  const [maxAffectiveScore, setMaxAffectiveScore] = useState<number>(10);
  const [maxMidtermScore, setMaxMidtermScore] = useState<number>(30);
  const [maxFinalScore, setMaxFinalScore] = useState<number>(40);

  // Header metadata
  const [semesterText, setSemesterText] = useState<string>('1');
  const [academicYearText, setAcademicYearText] = useState<string>('2569');
  const [yearLevelText, setYearLevelText] = useState<string>('1');
  const [majorText, setMajorText] = useState<string>('สาขาวิชาศาสนาและปรัชญา');
  const [creditText, setCreditText] = useState<string>('3 (3-0-6)');
  const [lecturerName, setLecturerName] = useState<string>('');
  const [departmentHeadName, setDepartmentHeadName] = useState<string>('');
  const [submitDateTextTh, setSubmitDateTextTh] = useState<string>('');
  const [submitDateTextEn, setSubmitDateTextEn] = useState<string>('');

  // Scores map: studentCode -> StudentScoreItem
  const [scoresMap, setScoresMap] = useState<Record<string, StudentScoreItem>>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch configured logoUrl from /api/system-settings so it always matches Admin Branding settings
  useEffect(() => {
    if (logoUrl && logoUrl !== '/mcu-seal.png' && !logoUrl.includes('mcu.ac.th/images/logo-mcu.png')) {
      setResolvedLogoUrl(logoUrl);
      return;
    }
    fetch('/api/system-settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.logoUrl && !d.data.logoUrl.includes('mcu.ac.th/images/logo-mcu.png')) {
          setResolvedLogoUrl(d.data.logoUrl);
        }
      })
      .catch(() => {});
  }, [logoUrl]);

  // Auto-detect language and default metadata when course changes
  useEffect(() => {
    if (!currentCourse) return;
    const isEngCourse =
      currentCourse.programType === 'INTERNATIONAL' ||
      currentCourse.programType === 'ENGLISH' ||
      currentCourse.major?.toLowerCase().includes('english') ||
      currentCourse.major?.toLowerCase().includes('นานาชาติ') ||
      /inter|eng|english|นานาชาติ/i.test(currentCourse.timetableTitle || '') ||
      /^[A-Za-z0-9\s\-.,():/]+$/.test(currentCourse.courseName || '');

    setFormLanguage(isEngCourse ? 'ENGLISH' : 'THAI');
    setSemesterText(String(currentCourse.semester || '1'));
    setAcademicYearText(String(currentCourse.academicYear || '2569'));
    setYearLevelText(String(currentCourse.yearLevel || '1'));
    setMajorText(
      currentCourse.major
        ? currentCourse.major.startsWith('สาขา') || isEngCourse
          ? currentCourse.major
          : `สาขาวิชา${currentCourse.major}`
        : isEngCourse
        ? 'Buddhist Studies'
        : 'สาขาวิชาพระพุทธศาสนา'
    );
    setCreditText(String(currentCourse.credits || '3'));
    setLecturerName(currentCourse.instructor || currentUser?.name || '');

    // Load saved grade sheet for this course from /api/grades
    fetch(`/api/grades?courseCode=${encodeURIComponent(currentCourse.courseCode)}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          const saved: CourseGradeSheet = resData.data;
          if (saved.formLanguage) setFormLanguage(saved.formLanguage);
          if (saved.maxAssignScore !== undefined) setMaxAssignScore(saved.maxAssignScore);
          if (saved.maxAffectiveScore !== undefined) setMaxAffectiveScore(saved.maxAffectiveScore);
          if (saved.maxMidtermScore !== undefined) setMaxMidtermScore(saved.maxMidtermScore);
          if (saved.maxFinalScore !== undefined) setMaxFinalScore(saved.maxFinalScore);
          if (saved.semester) setSemesterText(saved.semester);
          if (saved.academicYear) setAcademicYearText(saved.academicYear);
          if (saved.yearLevelText) setYearLevelText(saved.yearLevelText);
          if (saved.majorText) setMajorText(saved.majorText);
          if (saved.creditText) setCreditText(saved.creditText);
          if (saved.lecturerName) setLecturerName(saved.lecturerName);
          if (saved.departmentHeadName !== undefined) setDepartmentHeadName(saved.departmentHeadName);
          if (saved.submitDateTextTh !== undefined) setSubmitDateTextTh(saved.submitDateTextTh);
          if (saved.submitDateTextEn !== undefined) setSubmitDateTextEn(saved.submitDateTextEn);
          if (saved.scores) setScoresMap(saved.scores);
        } else {
          // Initialize empty scores with auto-populated ineligible remarks from attendance
          const initialMap: Record<string, StudentScoreItem> = {};
          studentsList.forEach((stu) => {
            const isIneligible = stu.eligibilityStatus === 'INELIGIBLE';
            initialMap[stu.studentCode] = {
              studentCode: stu.studentCode,
              studentName: stu.studentName,
              assignScore: null,
              affectiveScore: null,
              midtermScore: null,
              finalScore: null,
              remark: isIneligible ? (isEngCourse ? 'Ineligible' : 'หมดสิทธิ์สอบทุกวิชา') : '',
            };
          });
          setScoresMap(initialMap);
        }
      })
      .catch(() => {});
  }, [currentCourse?.courseCode]);

  // Helper to update a single student's score field
  const handleUpdateStudentScore = (
    studentCode: string,
    field: keyof StudentScoreItem,
    rawValue: string
  ) => {
    setScoresMap((prev) => {
      const existing = prev[studentCode] || { studentCode };
      const updated: StudentScoreItem = { ...existing };

      if (
        field === 'assignScore' ||
        field === 'affectiveScore' ||
        field === 'midtermScore' ||
        field === 'finalScore'
      ) {
        if (rawValue.trim() === '') {
          updated[field] = null;
        } else {
          const num = parseFloat(rawValue);
          const maxLimit =
            field === 'assignScore'
              ? maxAssignScore
              : field === 'affectiveScore'
              ? maxAffectiveScore
              : field === 'midtermScore'
              ? maxMidtermScore
              : maxFinalScore;
          updated[field] = isNaN(num) ? null : Math.max(0, Math.min(maxLimit, num));
        }
      } else {
        (updated as any)[field] = rawValue;
      }

      return {
        ...prev,
        [studentCode]: updated,
      };
    });
  };

  // Auto-sync Attendance (จิตพิสัย / Attd.) and Exam Eligibility status
  const handleSyncFromAttendance = () => {
    setScoresMap((prev) => {
      const next = { ...prev };
      studentsList.forEach((stu) => {
        const current = next[stu.studentCode] || { studentCode: stu.studentCode };
        const attPct = stu.attendedPercent !== undefined ? stu.attendedPercent : 100;
        const computedAffective = Math.round(((attPct / 100) * maxAffectiveScore) * 10) / 10;
        const isIneligible = stu.eligibilityStatus === 'INELIGIBLE';

        next[stu.studentCode] = {
          ...current,
          studentCode: stu.studentCode,
          studentName: stu.studentName,
          affectiveScore: isIneligible ? 0 : Math.round(computedAffective),
          remark: isIneligible
            ? formLanguage === 'ENGLISH'
              ? 'Ineligible'
              : 'หมดสิทธิ์สอบทุกวิชา'
            : current.remark || '',
        };
      });
      return next;
    });
    setSaveMessage('ดึงคะแนนจิตพิสัย (เวลาเรียน) และสถานะสิทธิ์สอบของนิสิตครบทุกคนเรียบร้อยแล้ว');
    setTimeout(() => setSaveMessage(null), 4000);
  };

  // Group and sort students by Major (พระพุทธศาสนา -> วิปัสสนาภาวนา -> ศาสนาและปรัชญา -> บาลีสันสกฤต)
  // and sort by studentCode ascending within each Major
  const { groupedSections, computedRows } = useMemo(() => {
    const baseComputed = studentsList.map((stu) => {
      const item = scoresMap[stu.studentCode] || { studentCode: stu.studentCode };
      const assign = item.assignScore;
      const affective = item.affectiveScore;
      const midterm = item.midtermScore;
      const final = item.finalScore;

      const hasAnyScore =
        (assign !== null && assign !== undefined) ||
        (affective !== null && affective !== undefined) ||
        (midterm !== null && midterm !== undefined) ||
        (final !== null && final !== undefined);

      const total = hasAnyScore
        ? Number(((assign || 0) + (affective || 0) + (midterm || 0) + (final || 0)).toFixed(1))
        : null;

      const computedGrade = item.gradeOverride
        ? item.gradeOverride
        : total !== null
        ? calculateMcuGrade(total)
        : '';

      const defaultIneligibleRemark =
        stu.eligibilityStatus === 'INELIGIBLE'
          ? formLanguage === 'ENGLISH'
            ? 'Ineligible'
            : 'หมดสิทธิ์สอบทุกวิชา'
          : '';

      const remark = item.remark !== undefined ? item.remark : defaultIneligibleRemark;

      return {
        studentCode: stu.studentCode,
        studentName: stu.studentName,
        major: stu.major,
        assignScore: assign,
        affectiveScore: affective,
        midtermScore: midterm,
        finalScore: final,
        totalScore: total,
        grade: computedGrade,
        gradeOverride: item.gradeOverride || '',
        remark,
        eligibilityStatus: stu.eligibilityStatus,
      };
    });

    const { sections, flatSorted } = groupAndSortByMajor(baseComputed);
    return {
      groupedSections: sections,
      computedRows: flatSorted,
    };
  }, [studentsList, scoresMap, formLanguage]);

  // Summary Statistics for Footer
  const summaryStats = useMemo(() => {
    const counts: Record<string, number> = {
      A: 0,
      'B+': 0,
      B: 0,
      'C+': 0,
      C: 0,
      'D+': 0,
      D: 0,
      F: 0,
      S: 0,
      U: 0,
    };

    let examinedCount = 0;
    let absentOrIneligibleCount = 0;
    const validTotals: number[] = [];

    computedRows.forEach((r) => {
      const isAbsent =
        r.remark?.includes('ขาดสอบ') ||
        r.remark?.includes('หมดสิทธิ์') ||
        r.remark?.toLowerCase().includes('ineligible') ||
        r.remark?.toLowerCase().includes('absent') ||
        r.grade === 'ขาดสอบ' ||
        r.grade === 'I' ||
        r.grade === 'W';

      if (isAbsent && r.totalScore === null) {
        absentOrIneligibleCount += 1;
      } else if (r.totalScore !== null || (r.grade && counts[r.grade] !== undefined)) {
        examinedCount += 1;
      }

      if (r.grade && counts[r.grade] !== undefined) {
        counts[r.grade] += 1;
      }

      if (r.totalScore !== null && !isNaN(r.totalScore)) {
        validTotals.push(r.totalScore);
      }
    });

    const maxScore = validTotals.length > 0 ? Math.max(...validTotals) : null;
    const minScore = validTotals.length > 0 ? Math.min(...validTotals) : null;

    return {
      totalStudents: computedRows.length,
      examinedCount,
      absentOrIneligibleCount,
      counts,
      maxScore,
      minScore,
      hasGradedAny: validTotals.length > 0 || Object.values(counts).some((c) => c > 0),
    };
  }, [computedRows]);

  // Save to /api/grades
  const handleSaveGradeSheet = async () => {
    if (!currentCourse) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const sheetPayload: CourseGradeSheet = {
        courseCode: currentCourse.courseCode,
        courseName: currentCourse.courseName,
        semester: semesterText,
        academicYear: academicYearText,
        formLanguage,
        maxAssignScore,
        maxAffectiveScore,
        maxMidtermScore,
        maxFinalScore,
        submitDateTextTh,
        submitDateTextEn,
        departmentHeadName,
        lecturerName,
        creditText,
        yearLevelText,
        majorText,
        scores: scoresMap,
        updatedBy: currentUser?.name || lecturerName,
      };

      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode: currentCourse.courseCode,
          sheet: sheetPayload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage(`บันทึกใบกรอกคะแนนวิชา ${currentCourse.courseCode} เรียบร้อยแล้ว`);
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        alert('บันทึกไม่สำเร็จ: ' + data.error);
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Export CSV (Protected with CSV Formula Injection Sanitizer)
  const handleExportCsv = () => {
    if (!currentCourse) return;
    const headers = [
      'ลำดับในสาขา',
      'รหัสนิสิต',
      'ชื่อ-ฉายา-นามสกุล',
      'สาขาวิชา',
      `รายงาน (${maxAssignScore})`,
      `จิตพิสัย (${maxAffectiveScore})`,
      `สอบระหว่างภาค (${maxMidtermScore})`,
      `สอบปลายภาค (${maxFinalScore})`,
      'รวม (100)',
      'ระดับ (Grade)',
      'หมายเหตุ',
    ];

    const rows = computedRows.map((r) => [
      r.indexInMajor,
      toSafeCsvCell(r.studentCode),
      toSafeCsvCell(r.studentName),
      toSafeCsvCell(r.majorMeta.labelTh),
      r.assignScore ?? '',
      r.affectiveScore ?? '',
      r.midtermScore ?? '',
      r.finalScore ?? '',
      r.totalScore ?? '',
      toSafeCsvCell(r.grade),
      toSafeCsvCell(r.remark),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `GradeSheet_${currentCourse.courseCode.replace(/\s+/g, '_')}_${academicYearText}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import CSV (Protected with CSV Formula Injection Cleaner)
  const handleImportCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        alert('ไม่พบข้อมูลในไฟล์ CSV');
        return;
      }

      let importedCount = 0;
      setScoresMap((prev) => {
        const next = { ...prev };
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => cleanImportedCsvCell(c));
          const codeCandidate = cols[1]?.match(/^\d{7,13}$/) ? cols[1] : cols[0];
          if (!codeCandidate) continue;

          const hasMajorCol = cols.length >= 9;
          const assignRaw = hasMajorCol ? cols[4] : cols[1];
          const attdRaw = hasMajorCol ? cols[5] : cols[2];
          const midRaw = hasMajorCol ? cols[6] : cols[3];
          const finalRaw = hasMajorCol ? cols[7] : cols[4];
          const remarkRaw = hasMajorCol ? cols[10] : cols[5];

          const parseNumOrNull = (v?: string, max = 100) => {
            if (!v || v.trim() === '') return null;
            const n = parseFloat(v);
            return isNaN(n) ? null : Math.max(0, Math.min(max, n));
          };

          next[codeCandidate] = {
            ...(next[codeCandidate] || { studentCode: codeCandidate }),
            studentCode: codeCandidate,
            assignScore: parseNumOrNull(assignRaw, maxAssignScore),
            affectiveScore: parseNumOrNull(attdRaw, maxAffectiveScore),
            midtermScore: parseNumOrNull(midRaw, maxMidtermScore),
            finalScore: parseNumOrNull(finalRaw, maxFinalScore),
            remark: remarkRaw !== undefined ? remarkRaw : next[codeCandidate]?.remark || '',
          };
          importedCount++;
        }
        return next;
      });

      setSaveMessage(`นำเข้าคะแนนจากไฟล์ CSV สำเร็จ ${importedCount} รายชื่อ (กรุณากดปุ่ม "บันทึกคะแนน" เพื่อยืนยัน)`);
    };
    reader.readAsText(file, 'utf-8');
  };

  if (!currentUser) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
        <Lock className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800 text-base">
          เข้าสู่ระบบอาจารย์ผู้สอนหรือผู้ดูแลระบบเพื่อจัดการใบกรอกคะแนนผลการสอบ
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          ระบบใบกรอกคะแนนผลการสอบเชื่อมต่อกับรายชื่อนิสิตและเวลาเรียนประจำวิชาโดยอัตโนมัติ
        </p>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-center text-amber-900 space-y-2">
        <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
        <p className="font-bold text-sm">ไม่พบรายวิชาที่เลือกในภาคเรียนนี้</p>
      </div>
    );
  }

  const totalMaxWeight = maxAssignScore + maxAffectiveScore + maxMidtermScore + maxFinalScore;

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. INTERACTIVE CONTROL & SCORE ENTRY PANEL (Hidden on Print)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5 print:hidden">
        {/* Top Header & Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                📝 ระบบใบกรอกคะแนนผลการสอบ (Official MCU Grade Sheet)
              </span>
              <span className="text-xs text-slate-500">
                จัดกลุ่มตามสาขาวิชาอัตโนมัติ (พระพุทธศาสนา • วิปัสสนาภาวนา • ศาสนาและปรัชญา • บาลีสันสกฤต)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              {currentCourse.courseCode} — {currentCourse.courseName}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Language Form Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormLanguage('THAI')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  formLanguage === 'THAI'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇹🇭 ใบกรอกคะแนน (ไทย)
              </button>
              <button
                type="button"
                onClick={() => setFormLanguage('ENGLISH')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  formLanguage === 'ENGLISH'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Result of Exam (EN)</span>
              </button>
            </div>

            {/* Print Mode Selector: With Scores vs Blank Form for Pen */}
            <button
              type="button"
              onClick={() => setPrintBlankForm(!printBlankForm)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                printBlankForm
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="สลับระหว่างพิมพ์คะแนนที่กรอกแล้ว หรือพิมพ์ตารางช่องว่างสำหรับกรอกด้วยปากกา"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{printBlankForm ? 'โหมดพิมพ์: ช่องว่างกรอกปากกา' : 'โหมดพิมพ์: แสดงคะแนนที่กรอก'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบกรอกคะแนน A4</span>
            </button>
          </div>
        </div>

        {/* Save Notification */}
        {saveMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveMessage}</span>
            </div>
            <button onClick={() => setSaveMessage(null)} className="text-emerald-700 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Course Cards Grid & Quick Actions */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>คลิกเลือกรายวิชาที่รับผิดชอบสอน ({availableCourses.length} วิชา):</span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSyncFromAttendance}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="คำนวณคะแนนจิตพิสัยจากเวลาเรียนจริง และดึงหมายเหตุหมดสิทธิ์สอบอัตโนมัติ"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>ดึงคะแนนจิตพิสัย & สิทธิ์สอบอัตโนมัติ</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfigPanel(!showConfigPanel)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>ตั้งค่าหัวกระดาษ/สัดส่วนคะแนน</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-sky-700 border border-sky-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import CSV</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImportCsv(file);
                    e.target.value = '';
                  }
                }}
              />

              <button
                type="button"
                onClick={handleSaveGradeSheet}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'กำลังบันทึก...' : 'บันทึกคะแนน'}</span>
              </button>
            </div>
          </div>

          {/* Course Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {availableCourses.map((c, idx) => {
              const sKey = (c as any).sectionKey || c.courseCode;
              const isSelected = sKey === selectedCourseCode || (!(c as any).sectionKey && c.courseCode === selectedCourseCode);
              const isEn =
                (c as any).programType === 'ENGLISH' ||
                (c as any).programType === 'INTERNATIONAL' ||
                /inter|eng|english|นานาชาติ/i.test(c.timetableTitle || '') ||
                /^[A-Za-z0-9\s:,\-\(\)\/\.]+$/.test((c.courseName || '').trim());

              return (
                <button
                  key={`${sKey}-${idx}`}
                  type="button"
                  onClick={() => handleCourseChange(sKey)}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-500/30'
                      : 'bg-white hover:bg-indigo-50/50 text-slate-800 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-200/70'
                        }`}
                      >
                        {c.courseCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : isEn
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isEn ? '🌐 Inter/EN' : '🇹🇭 ภาคไทย'} • ปี {c.yearLevel || 1}
                      </span>
                    </div>
                    <div
                      className={`font-bold text-xs mt-1.5 line-clamp-1 ${
                        isSelected ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {c.courseName}
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between text-[10px] pt-1 border-t ${
                      isSelected ? 'border-white/20 text-indigo-100' : 'border-slate-100 text-slate-500'
                    }`}
                  >
                    <span className="truncate">
                      {c.dayOfWeek || ''} {c.startTime ? `${c.startTime}-${c.endTime}` : ''}
                    </span>
                    <span className="font-semibold shrink-0 ml-1">ห้อง {c.room || '-'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Header & Score Weights Configuration */}
        {showConfigPanel && (
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-4 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-indigo-200/70 pb-2">
              <span className="font-bold text-indigo-950">
                ⚙️ ตั้งค่าข้อมูลหัวกระดาษใบกรอกคะแนน และสัดส่วนคะแนนเต็ม (รวม {totalMaxWeight} คะแนน)
              </span>
              {totalMaxWeight !== 100 && (
                <span className="text-rose-600 font-bold">
                  ⚠️ ผลรวมคะแนนเต็มปัจจุบันคือ {totalMaxWeight} คะแนน (แนะนำให้รวมได้ 100 คะแนน)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">คะแนนเต็ม รายงาน (Assign):</label>
                <input
                  type="number"
                  value={maxAssignScore}
                  onChange={(e) => setMaxAssignScore(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">คะแนนเต็ม จิตพิสัย (Attd.):</label>
                <input
                  type="number"
                  value={maxAffectiveScore}
                  onChange={(e) => setMaxAffectiveScore(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">คะแนนเต็ม สอบระหว่างภาค:</label>
                <input
                  type="number"
                  value={maxMidtermScore}
                  onChange={(e) => setMaxMidtermScore(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">คะแนนเต็ม สอบปลายภาค:</label>
                <input
                  type="number"
                  value={maxFinalScore}
                  onChange={(e) => setMaxFinalScore(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชั้นปีที่ (Year):</label>
                <input
                  type="text"
                  value={yearLevelText}
                  onChange={(e) => setYearLevelText(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">สาขาวิชาหลักบนหัวกระดาษ:</label>
                <input
                  type="text"
                  value={majorText}
                  onChange={(e) => setMajorText(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">ภาคการศึกษา:</label>
                <input
                  type="text"
                  value={semesterText}
                  onChange={(e) => setSemesterText(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">ปีการศึกษา:</label>
                <input
                  type="text"
                  value={academicYearText}
                  onChange={(e) => setAcademicYearText(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">หน่วยกิต (Credit):</label>
                <input
                  type="text"
                  value={creditText}
                  onChange={(e) => setCreditText(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">อาจารย์ผู้บรรยาย (Lecturer):</label>
                <input
                  type="text"
                  value={lecturerName}
                  onChange={(e) => setLecturerName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อหัวหน้าภาค / ผู้อำนวยการหลักสูตร (ถ้ามี):</label>
                <input
                  type="text"
                  value={departmentHeadName}
                  onChange={(e) => setDepartmentHeadName(e.target.value)}
                  placeholder="เว้นว่างไว้เพื่อลงนามด้วยปากกา"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">กำหนดส่ง (Submit Date):</label>
                <input
                  type="text"
                  value={formLanguage === 'ENGLISH' ? submitDateTextEn : submitDateTextTh}
                  onChange={(e) =>
                    formLanguage === 'ENGLISH'
                      ? setSubmitDateTextEn(e.target.value)
                      : setSubmitDateTextTh(e.target.value)
                  }
                  placeholder="เว้นว่างไว้เพื่อแสดงเส้นประสำหรับกรอกเอง"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Interactive Score Input Table (Grouped by Major & Sorted by StudentCode) */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="py-3 px-3 text-center w-12">ที่</th>
                <th className="py-3 px-3 w-28">รหัสนิสิต</th>
                <th className="py-3 px-3 min-w-[200px]">ชื่อ-ฉายา-นามสกุล</th>
                <th className="py-3 px-2 text-center w-24">
                  รายงาน
                  <span className="block text-[10px] text-amber-300 font-normal">
                    (เต็ม {maxAssignScore})
                  </span>
                </th>
                <th className="py-3 px-2 text-center w-24">
                  จิตพิสัย
                  <span className="block text-[10px] text-emerald-300 font-normal">
                    (เต็ม {maxAffectiveScore})
                  </span>
                </th>
                <th className="py-3 px-2 text-center w-24">
                  ระหว่างภาค
                  <span className="block text-[10px] text-sky-300 font-normal">
                    (เต็ม {maxMidtermScore})
                  </span>
                </th>
                <th className="py-3 px-2 text-center w-24">
                  ปลายภาค
                  <span className="block text-[10px] text-purple-300 font-normal">
                    (เต็ม {maxFinalScore})
                  </span>
                </th>
                <th className="py-3 px-2 text-center w-20 bg-slate-900">
                  รวม
                  <span className="block text-[10px] text-slate-300 font-normal">
                    ({totalMaxWeight})
                  </span>
                </th>
                <th className="py-3 px-2 text-center w-24 bg-indigo-950">
                  ระดับ (Grade)
                </th>
                <th className="py-3 px-3 min-w-[160px]">หมายเหตุ (Remark)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {groupedSections.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    ไม่พบรายชื่อนิสิตในรายวิชานี้
                  </td>
                </tr>
              ) : (
                groupedSections.map((sec) => (
                  <React.Fragment key={sec.groupKey}>
                    {/* Major Group Sub-Header Row */}
                    <tr className="bg-slate-100/90 border-y border-slate-300">
                      <td colSpan={10} className="py-2 px-4 font-extrabold text-slate-900 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${sec.meta.badgeColor}`}>
                              {formLanguage === 'ENGLISH' ? sec.meta.labelEn : sec.meta.labelTh}
                            </span>
                            <span className="text-slate-500 font-normal text-[11px]">
                              ({formLanguage === 'ENGLISH' ? sec.meta.labelTh : sec.meta.labelEn})
                            </span>
                          </span>
                          <span className="text-slate-600 font-bold text-[11px]">
                            จำนวน {sec.items.length} รูป/คน (เรียงรหัสนิสิต 1 - {sec.items.length})
                          </span>
                        </div>
                      </td>
                    </tr>
                    {sec.items.map((row) => {
                      const isIneligible =
                        row.eligibilityStatus === 'INELIGIBLE' ||
                        row.remark.includes('หมดสิทธิ์');
                      return (
                        <tr
                          key={row.studentCode}
                          className={`hover:bg-slate-50 transition ${
                            isIneligible ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-600">
                            {row.indexInMajor}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">
                            {row.studentCode}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {row.studentName}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={maxAssignScore}
                              step="0.5"
                              value={row.assignScore ?? ''}
                              onChange={(e) =>
                                handleUpdateStudentScore(
                                  row.studentCode,
                                  'assignScore',
                                  e.target.value
                                )
                              }
                              placeholder="-"
                              className="w-16 px-2 py-1 text-center rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none font-mono font-bold text-slate-900 bg-white"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={maxAffectiveScore}
                              step="0.5"
                              value={row.affectiveScore ?? ''}
                              onChange={(e) =>
                                handleUpdateStudentScore(
                                  row.studentCode,
                                  'affectiveScore',
                                  e.target.value
                                )
                              }
                              placeholder="-"
                              className="w-16 px-2 py-1 text-center rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none font-mono font-bold text-slate-900 bg-white"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={maxMidtermScore}
                              step="0.5"
                              value={row.midtermScore ?? ''}
                              onChange={(e) =>
                                handleUpdateStudentScore(
                                  row.studentCode,
                                  'midtermScore',
                                  e.target.value
                                )
                              }
                              placeholder="-"
                              className="w-16 px-2 py-1 text-center rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none font-mono font-bold text-slate-900 bg-white"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={maxFinalScore}
                              step="0.5"
                              value={row.finalScore ?? ''}
                              onChange={(e) =>
                                handleUpdateStudentScore(
                                  row.studentCode,
                                  'finalScore',
                                  e.target.value
                                )
                              }
                              placeholder="-"
                              className="w-16 px-2 py-1 text-center rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none font-mono font-bold text-slate-900 bg-white"
                            />
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-extrabold text-sm text-slate-900 bg-slate-50">
                            {row.totalScore !== null ? row.totalScore : '-'}
                          </td>
                          <td className="py-1.5 px-2 text-center bg-indigo-50/40">
                            <select
                              value={row.gradeOverride}
                              onChange={(e) =>
                                handleUpdateStudentScore(
                                  row.studentCode,
                                  'gradeOverride',
                                  e.target.value
                                )
                              }
                              className="w-20 px-1.5 py-1 text-center rounded-lg border border-indigo-200 bg-white font-extrabold text-indigo-900 text-xs"
                              title="คำนวณเกรดอัตโนมัติ หรือเลือกเกรดพิเศษ (S, U, I, ขาดสอบ)"
                            >
                              <option value="">
                                {row.totalScore !== null
                                  ? `${calculateMcuGrade(row.totalScore)} (Auto)`
                                  : '-'}
                              </option>
                              <option value="A">A</option>
                              <option value="B+">B+</option>
                              <option value="B">B</option>
                              <option value="C+">C+</option>
                              <option value="C">C</option>
                              <option value="D+">D+</option>
                              <option value="D">D</option>
                              <option value="F">F</option>
                              <option value="S">S</option>
                              <option value="U">U</option>
                              <option value="I">I (รอผล)</option>
                              <option value="ขาดสอบ">ขาดสอบ</option>
                            </select>
                          </td>
                          <td className="py-1.5 px-3">
                            <input
                              type="text"
                              value={row.remark}
                              onChange={(e) =>
                                handleUpdateStudentScore(
                                  row.studentCode,
                                  'remark',
                                  e.target.value
                                )
                              }
                              placeholder="เช่น หมดสิทธิ์สอบทุกวิชา"
                              className={`w-full px-2.5 py-1 rounded-lg border text-xs ${
                                isIneligible
                                  ? 'border-rose-300 bg-rose-50 text-rose-800 font-bold'
                                  : 'border-slate-200 bg-white text-slate-700'
                              }`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Toggle Screen Preview & Customize A4 Table Row Height / Font Size */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPrintPreviewOnScreen(!showPrintPreviewOnScreen)}
              className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100/60 flex items-center gap-1.5 shadow-2xs cursor-pointer transition"
            >
              <Eye className="w-4 h-4" />
              <span>
                {showPrintPreviewOnScreen
                  ? 'ซ่อนตัวอย่างกระดาษ A4'
                  : 'แสดงตัวอย่างกระดาษ A4'}
              </span>
            </button>

            {/* Quick Presets for Row Height & Font Size */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-700 mr-1">
                📏 ขนาดแถว & ตัวอักษร A4:
              </span>
              <button
                type="button"
                onClick={() => applyPrintSizePreset('COMPACT')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border ${
                  printSizePreset === 'COMPACT'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
                title="เหมาะสำหรับรายวิชาที่มีนิสิตจำนวนมาก (แถวสูง 24px / ฟอนต์ 12.5px)"
              >
                กะทัดรัด
              </button>
              <button
                type="button"
                onClick={() => applyPrintSizePreset('STANDARD')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border ${
                  printSizePreset === 'STANDARD'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
                title="ขนาดมาตรฐานใหม่ อ่านง่าย ช่องกรอกคะแนนสบายตา (แถวสูง 28px / ฟอนต์ 14px)"
              >
                มาตรฐาน (แนะนำ)
              </button>
              <button
                type="button"
                onClick={() => applyPrintSizePreset('LARGE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border ${
                  printSizePreset === 'LARGE'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
                title="แถวสูงพิเศษและตัวอักษรใหญ่ เขียนคะแนนด้วยปากกาสะดวกมาก (แถวสูง 34px / ฟอนต์ 15.5px)"
              >
                แถวสูง-ตัวใหญ่
              </button>
            </div>
          </div>

          {/* Fine-Tune Controls for Instructor */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-300">
              <span className="text-slate-600 font-semibold">ความสูงแถว:</span>
              <button
                type="button"
                onClick={() => handleCustomPrintScaleChange(printRowHeightPx - 2, printFontSizePx)}
                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-extrabold text-slate-700 flex items-center justify-center cursor-pointer"
                title="ลดความสูงแถว"
              >
                −
              </button>
              <span className="font-mono font-extrabold text-indigo-700 min-w-[38px] text-center">
                {printRowHeightPx}px
              </span>
              <button
                type="button"
                onClick={() => handleCustomPrintScaleChange(printRowHeightPx + 2, printFontSizePx)}
                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-extrabold text-slate-700 flex items-center justify-center cursor-pointer"
                title="เพิ่มความสูงแถว"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-300">
              <span className="text-slate-600 font-semibold">ขนาดตัวอักษร:</span>
              <button
                type="button"
                onClick={() => handleCustomPrintScaleChange(printRowHeightPx, printFontSizePx - 0.5)}
                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-extrabold text-slate-700 flex items-center justify-center cursor-pointer"
                title="ลดขนาดตัวอักษร"
              >
                −
              </button>
              <span className="font-mono font-extrabold text-indigo-700 min-w-[42px] text-center">
                {printFontSizePx}px
              </span>
              <button
                type="button"
                onClick={() => handleCustomPrintScaleChange(printRowHeightPx, printFontSizePx + 0.5)}
                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-extrabold text-slate-700 flex items-center justify-center cursor-pointer"
                title="เพิ่มขนาดตัวอักษร"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. OFFICIAL A4 PRINT DOCUMENT (1:1 Match with MCU PDF Forms)
         ───────────────────────────────────────────────────────────── */}
      <div
        id="printable-grade-sheet"
        className={`${
          showPrintPreviewOnScreen ? 'block' : 'hidden print:block'
        } bg-white mx-auto shadow-xl print:shadow-none border border-slate-300 print:border-none text-black`}
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '12mm 14mm 12mm 14mm',
          fontFamily: '"TH Sarabun New", "Sarabun", serif',
          boxSizing: 'border-box',
        }}
      >
        {formLanguage === 'THAI' ? (
          /* ============================================================
             แบบฟอร์มที่ 1: ใบกรอกคะแนนผลการสอบ (ภาคภาษาไทย)
             ============================================================ */
          <div className="flex flex-col justify-between h-full text-black">
            <div>
              {/* Header Section: Left Seal | Center Titles + Left Course Info | Right Grade Scale Box */}
              <div className="grid grid-cols-12 gap-2 items-start">
                {/* Left + Center (9 cols) */}
                <div className="col-span-9 space-y-2">
                  <div className="flex items-start gap-3">
                    {/* MCU Seal in Black & White as configured in system settings */}
                    <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                      <img
                        src={resolvedLogoUrl}
                        alt="ตรามหาวิทยาลัย"
                        className="w-22 h-22 object-contain grayscale contrast-125"
                        style={{ filter: 'grayscale(100%) contrast(125%)' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('/uploads/logo-1793607622279.png')) {
                            target.src = '/uploads/logo-1793607622279.png';
                          }
                        }}
                      />
                    </div>

                    {/* Center University Titles */}
                    <div className="flex-1 text-center pt-1 leading-snug">
                      <div className="text-[18px] font-bold">ใบกรอกคะแนนผลการสอบ</div>
                      <div className="text-[17px] font-bold">
                        มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                      </div>
                      <div className="text-[16px] font-bold">
                        คณะพุทธศาสตร์ ชั้นปีที่ {yearLevelText}
                      </div>
                      <div className="text-[16px] font-bold">
                        {groupedSections.length === 1
                          ? groupedSections[0].meta.labelTh
                          : majorText}
                      </div>
                      <div className="text-[16px] font-bold">
                        ภาคการศึกษาที่ {semesterText} ปีการศึกษา {academicYearText}
                      </div>
                    </div>
                  </div>

                  {/* Course Dotted Info Lines */}
                  <div className="space-y-1.5 text-[14px] pt-1 pl-2">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold shrink-0">วิชา</span>
                      <span className="border-b border-dotted border-black flex-1 px-2 font-bold">
                        {currentCourse.courseName}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold shrink-0">รหัสวิชา</span>
                      <span className="border-b border-dotted border-black flex-1 px-2 font-bold">
                        {currentCourse.courseCode}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold shrink-0">อาจารย์ผู้บรรยาย</span>
                      <span className="border-b border-dotted border-black flex-1 px-2 font-bold">
                        {lecturerName}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold shrink-0">กำหนดส่ง</span>
                      {submitDateTextTh ? (
                        <span className="border-b border-dotted border-black flex-1 px-2">
                          {submitDateTextTh}
                        </span>
                      ) : (
                        <span>
                          วันที่...................เดือน............................................พ.ศ.{' '}
                          {academicYearText}
                        </span>
                      )}
                    </div>
                    <div className="text-center font-bold text-[15px] pt-1">
                      (โปรดกรอกคะแนนด้วยปากกาเท่านั้น ห้ามกรอกด้วยดินสอดำ)
                    </div>
                  </div>
                </div>

                {/* Right Grade Scale Table (3 cols) */}
                <div className="col-span-3">
                  <table className="w-full border-collapse border border-black text-[12px] text-center">
                    <thead>
                      <tr className="font-bold">
                        <th className="border border-black py-1 px-1">ระดับ</th>
                        <th className="border border-black py-1 px-1">ค่าระดับ</th>
                        <th className="border border-black py-1 px-1">เกณฑ์คะแนน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {GRADING_SCALE.map((g) => (
                        <tr key={g.grade}>
                          <td className="border border-black py-0.5 font-semibold">{g.grade}</td>
                          <td className="border border-black py-0.5">{g.level}</td>
                          <td className="border border-black py-0.5">{g.labelTh}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Main Student Score Table (Thai - Grouped by Major & numbered 1..N per Major) */}
              <table
                className="w-full border-collapse border border-black mt-2"
                style={{ fontSize: `${printFontSizePx}px` }}
              >
                <thead>
                  <tr className="font-bold text-center">
                    <th className="border border-black w-9 py-1.5">ที่</th>
                    <th className="border border-black w-28 py-1.5">รหัส</th>
                    <th className="border border-black py-1.5">ชื่อ-ฉายา-นามสกุล</th>
                    <th className="border border-black w-10 py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        รายงาน
                      </div>
                    </th>
                    <th className="border border-black w-10 py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        จิตพิสัย
                      </div>
                    </th>
                    <th className="border border-black w-10 py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        สอบระหว่างภาค
                      </div>
                    </th>
                    <th className="border border-black w-10 py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        สอบปลายภาค
                      </div>
                    </th>
                    <th className="border border-black w-11 py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        รวม
                      </div>
                    </th>
                    <th className="border border-black w-13 py-1.5">ระดับ</th>
                    <th className="border border-black w-32 py-1.5">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedSections.map((sec) => (
                    <React.Fragment key={sec.groupKey}>
                      {/* Major Sub-Header Row */}
                      <tr style={{ height: `${Math.max(24, printRowHeightPx - 2)}px` }}>
                        <td
                          colSpan={10}
                          className="border border-black text-center font-bold py-1 bg-slate-50/40"
                          style={{ fontSize: `${printFontSizePx}px` }}
                        >
                          {sec.meta.labelTh}
                        </td>
                      </tr>
                      {sec.items.map((row) => (
                        <tr
                          key={row.studentCode}
                          style={{ height: `${printRowHeightPx}px` }}
                        >
                          <td className="border border-black text-center px-1.5 align-middle">
                            {row.indexInMajor}
                          </td>
                          <td
                            className="border border-black text-center px-1.5 font-mono font-semibold align-middle"
                            style={{ fontSize: `${Math.max(11.5, printFontSizePx - 0.5)}px` }}
                          >
                            {row.studentCode}
                          </td>
                          <td className="border border-black px-2.5 align-middle">{row.studentName}</td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.assignScore !== null &&
                            row.assignScore !== undefined
                              ? row.assignScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.affectiveScore !== null &&
                            row.affectiveScore !== undefined
                              ? row.affectiveScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.midtermScore !== null &&
                            row.midtermScore !== undefined
                              ? row.midtermScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.finalScore !== null &&
                            row.finalScore !== undefined
                              ? row.finalScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 font-bold align-middle">
                            {!printBlankForm && row.totalScore !== null ? row.totalScore : ''}
                          </td>
                          <td className="border border-black text-center px-1 font-bold align-middle">
                            {!printBlankForm ? row.grade : ''}
                          </td>
                          <td
                            className="border border-black text-center px-1.5 align-middle"
                            style={{ fontSize: `${Math.max(11, printFontSizePx - 1)}px` }}
                          >
                            {row.remark}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary & Signatures (Thai) */}
            <div className="pt-3 text-[13px] space-y-1.5 leading-snug">
              <div className="flex items-center justify-between px-4">
                <span className="font-bold">สรุปผลการสอบ</span>
                <span>
                  ผู้เข้าสอบทั้งหมด{' '}
                  <span className="inline-block min-w-[45px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny
                      ? summaryStats.examinedCount
                      : ''}
                  </span>{' '}
                  รูป/คน
                </span>
                <span>
                  ขาดสอบ{' '}
                  <span className="inline-block min-w-[45px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny
                      ? summaryStats.absentOrIneligibleCount
                      : ''}
                  </span>{' '}
                  รูป/คน
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 px-4">
                <div>
                  ได้ระดับ A จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['A'] : ''}
                  </span>{' '}
                  รูป
                </div>
                <div>
                  ได้ระดับ B+ จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['B+'] : ''}
                  </span>{' '}
                  รูป
                </div>
                <div>
                  ได้ระดับ B จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['B'] : ''}
                  </span>{' '}
                  รูป
                </div>

                <div>
                  ได้ระดับ C+ จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['C+'] : ''}
                  </span>{' '}
                  รูป
                </div>
                <div className="col-span-2">
                  ได้ระดับ C จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['C'] : ''}
                  </span>{' '}
                  รูป
                </div>

                <div>
                  ได้ระดับ D+ จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['D+'] : ''}
                  </span>{' '}
                  รูป
                </div>
                <div>
                  ได้ระดับ D จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['D'] : ''}
                  </span>{' '}
                  รูป
                </div>
                <div>
                  ได้ระดับ F จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['F'] : ''}
                  </span>{' '}
                  รูป
                </div>

                <div>
                  ได้ระดับ S จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['S'] : ''}
                  </span>{' '}
                  รูป
                </div>
                <div className="col-span-2">
                  ได้ระดับ U จำนวน{' '}
                  <span className="inline-block min-w-[36px] text-center border-b border-dotted border-black font-bold">
                    {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['U'] : ''}
                  </span>{' '}
                  รูป
                </div>
              </div>

              <div className="text-center pt-0.5">
                คะแนนสูงสุด{' '}
                <span className="inline-block min-w-[55px] text-center border-b border-dotted border-black font-bold">
                  {!printBlankForm && summaryStats.maxScore !== null ? summaryStats.maxScore : ''}
                </span>{' '}
                รูป/คน &nbsp;&nbsp;&nbsp; คะแนนต่ำสุด{' '}
                <span className="inline-block min-w-[55px] text-center border-b border-dotted border-black font-bold">
                  {!printBlankForm && summaryStats.minScore !== null ? summaryStats.minScore : ''}
                </span>{' '}
                รูป/คน
              </div>

              <div className="text-center font-bold pt-1">รับรองว่าถูกต้องตามนี้</div>

              <div className="grid grid-cols-2 gap-6 pt-3 text-center">
                <div className="space-y-1">
                  <div>
                    ลงชื่อ........................................................หัวหน้าภาค
                  </div>
                  {departmentHeadName && (
                    <div className="text-[12px]">({departmentHeadName})</div>
                  )}
                  <div>............/................../..................</div>
                </div>
                <div className="space-y-1">
                  <div>
                    ลงชื่อ........................................................อาจารย์ผู้บรรยาย
                  </div>
                  {lecturerName && <div className="text-[12px]">({lecturerName})</div>}
                  <div>............/................../..................</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 pt-1">
                **สำหรับผู้ที่หมดสิทธิ์ทุกรายวิชา ได้สำรวจเพื่อสหธรรมิกในชั้นเรียน การให้คะแนนสอบสำหรับผู้ที่ดุลยพินิจของอาจารย์ผู้สอน
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================
             แบบฟอร์มที่ 2: Result of Examination (English Program)
             ============================================================ */
          <div
            className="flex flex-col justify-between h-full text-black"
            style={{ fontFamily: '"Times New Roman", "Sarabun", serif' }}
          >
            <div>
              {/* Header Section: Left Seal | Center Titles + Left Course Info | Right Grade Scale Box */}
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-9 space-y-2">
                  <div className="flex items-start gap-3">
                    {/* MCU Seal in Black & White as configured in system settings */}
                    <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                      <img
                        src={resolvedLogoUrl}
                        alt="MCU Seal"
                        className="w-22 h-22 object-contain grayscale contrast-125"
                        style={{ filter: 'grayscale(100%) contrast(125%)' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('/uploads/logo-1793607622279.png')) {
                            target.src = '/uploads/logo-1793607622279.png';
                          }
                        }}
                      />
                    </div>

                    <div className="flex-1 text-center pt-1 leading-snug">
                      <div className="text-[16px] font-bold">Result of Examination</div>
                      <div className="text-[15px] font-bold">
                        Bachelor of Arts Program (English Program)
                      </div>
                      <div className="text-[14px] font-bold">
                        Faculty of Buddhism, Mahachulalongkornrajavidyalaya University
                      </div>
                      <div className="text-[14px] font-bold">
                        The {getEnglishOrdinalYear(yearLevelText)} Year Students,{' '}
                        {groupedSections.length === 1
                          ? groupedSections[0].meta.labelEn
                          : `Major : ${majorText.replace(/^สาขาวิชา/, '') || 'Buddhist Studies'}`}
                      </div>
                      <div className="text-[14px] font-bold">
                        The {semesterText === '2' ? 'Second' : 'First'} Semester, Academic Year{' '}
                        {academicYearText}/{Number(academicYearText) - 543 || 2026}
                      </div>
                    </div>
                  </div>

                  {/* Course Dotted Info Lines */}
                  <div className="space-y-1.5 text-[13px] pt-1 pl-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-semibold shrink-0">Subject :</span>
                      <span className="border-b border-dotted border-black flex-1 px-2 font-bold">
                        {currentCourse.courseName}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-semibold shrink-0">Code :</span>
                        <span className="border-b border-dotted border-black flex-1 px-2 font-bold">
                          {currentCourse.courseCode}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-semibold shrink-0">Credit :</span>
                        <span className="border-b border-dotted border-black flex-1 px-2 font-bold">
                          {creditText}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-semibold shrink-0">Lecturer :</span>
                      <span className="border-b border-dotted border-black flex-1 px-2 font-bold">
                        {lecturerName}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-semibold shrink-0">Submit on Date :</span>
                      <span className="border-b border-dotted border-black flex-1 px-2">
                        {submitDateTextEn || ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Grade Scale Table (3 cols) */}
                <div className="col-span-3">
                  <table className="w-full border-collapse border border-black text-[12px] text-center">
                    <thead>
                      <tr className="font-bold">
                        <th className="border border-black py-1 px-1">Level</th>
                        <th className="border border-black py-1 px-1">Grade</th>
                        <th className="border border-black py-1 px-1">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {GRADING_SCALE.map((g) => (
                        <tr key={g.grade}>
                          <td className="border border-black py-0.5">{g.level}</td>
                          <td className="border border-black py-0.5 font-semibold">{g.grade}</td>
                          <td className="border border-black py-0.5">{g.labelEn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Main Student Score Table (English - Grouped by Major & numbered 1..N per Major) */}
              <table
                className="w-full border-collapse border border-black mt-2"
                style={{ fontSize: `${printFontSizePx}px` }}
              >
                <thead>
                  <tr className="font-bold text-center">
                    <th className="border border-black w-9 py-1.5">No.</th>
                    <th className="border border-black w-28 py-1.5">Resgis No.</th>
                    <th className="border border-black py-1.5">Name</th>
                    <th className="border border-black w-12 py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        Major
                      </div>
                    </th>
                    <th className="border border-black w-10 py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        Assign
                      </div>
                    </th>
                    <th className="border border-black w-10 py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        Attd.
                      </div>
                    </th>
                    <th className="border border-black w-10 py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        Mid-Term
                      </div>
                    </th>
                    <th className="border border-black w-10 py-1.5 align-bottom">
                      <div
                        className="mx-auto leading-none py-1"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        Final
                      </div>
                    </th>
                    <th className="border border-black w-11 py-1.5">Total</th>
                    <th className="border border-black w-13 py-1.5">Grade</th>
                    <th className="border border-black w-24 py-1.5">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedSections.map((sec) => (
                    <React.Fragment key={sec.groupKey}>
                      <tr style={{ height: `${Math.max(24, printRowHeightPx - 2)}px` }}>
                        <td
                          colSpan={3}
                          className="border border-black text-center font-bold py-1 bg-slate-50/40"
                          style={{ fontSize: `${printFontSizePx}px` }}
                        >
                          {sec.meta.labelEn}
                        </td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                      </tr>
                      {sec.items.map((row) => (
                        <tr
                          key={row.studentCode}
                          style={{ height: `${printRowHeightPx}px` }}
                        >
                          <td className="border border-black text-center px-1.5 align-middle">
                            {row.indexInMajor}
                          </td>
                          <td
                            className="border border-black text-center px-1.5 font-mono font-semibold align-middle"
                            style={{ fontSize: `${Math.max(11.5, printFontSizePx - 0.5)}px` }}
                          >
                            {row.studentCode}
                          </td>
                          <td className="border border-black px-2.5 align-middle">{row.studentName}</td>
                          <td className="border border-black text-center px-1.5 align-middle">
                            {row.majorMeta.shortEn}
                          </td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.assignScore !== null &&
                            row.assignScore !== undefined
                              ? row.assignScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.affectiveScore !== null &&
                            row.affectiveScore !== undefined
                              ? row.affectiveScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.midtermScore !== null &&
                            row.midtermScore !== undefined
                              ? row.midtermScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 align-middle">
                            {!printBlankForm &&
                            row.finalScore !== null &&
                            row.finalScore !== undefined
                              ? row.finalScore
                              : ''}
                          </td>
                          <td className="border border-black text-center px-1 font-bold align-middle">
                            {!printBlankForm && row.totalScore !== null ? row.totalScore : ''}
                          </td>
                          <td className="border border-black text-center px-1 font-bold align-middle">
                            {!printBlankForm ? row.grade : ''}
                          </td>
                          <td
                            className="border border-black text-center px-1.5 align-middle"
                            style={{ fontSize: `${Math.max(11, printFontSizePx - 1)}px` }}
                          >
                            {row.remark}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary & Signatures (English) */}
            <div className="pt-3 text-[13px] space-y-2 leading-snug">
              <div className="text-center font-bold">Conclusion of Result</div>

              <div className="grid grid-cols-2 gap-8 px-10">
                <div className="space-y-1">
                  <div>
                    Level A :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['A'] : ''}
                    </span>{' '}
                    Persons
                  </div>
                  <div>
                    Level B :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['B'] : ''}
                    </span>{' '}
                    Persons
                  </div>
                  <div>
                    Level C :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['C'] : ''}
                    </span>{' '}
                    Persons
                  </div>
                  <div>
                    Level D :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['D'] : ''}
                    </span>{' '}
                    Persons
                  </div>
                </div>

                <div className="space-y-1">
                  <div>
                    Level B+ :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny
                        ? summaryStats.counts['B+']
                        : ''}
                    </span>{' '}
                    Persons
                  </div>
                  <div>
                    Level C+ :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny
                        ? summaryStats.counts['C+']
                        : ''}
                    </span>{' '}
                    Persons
                  </div>
                  <div>
                    Level D+ :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny
                        ? summaryStats.counts['D+']
                        : ''}
                    </span>{' '}
                    Persons
                  </div>
                  <div>
                    Level F :{' '}
                    <span className="inline-block min-w-[70px] text-center border-b border-dotted border-black font-bold">
                      {!printBlankForm && summaryStats.hasGradedAny ? summaryStats.counts['F'] : ''}
                    </span>{' '}
                    Persons
                  </div>
                </div>
              </div>

              <div className="text-center font-bold pt-1">Verification of Truth</div>

              <div className="grid grid-cols-2 gap-6 pt-3 text-center">
                <div className="space-y-1">
                  <div>Signature ........................................................</div>
                  <div className="font-semibold">
                    Director of B.A. in{' '}
                    {groupedSections.length === 1
                      ? groupedSections[0].meta.labelEn.replace(/^Major:\s*/i, '')
                      : majorText.replace(/^สาขาวิชา/, '') || 'Buddhist Studies'}
                  </div>
                  <div>........../............../............</div>
                </div>
                <div className="space-y-1">
                  <div>Signature ........................................................</div>
                  <div className="font-semibold">Lecturer</div>
                  <div>........../............../............</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print-specific CSS to ensure clean 1-page A4 output */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body * {
            visibility: hidden;
          }
          #printable-grade-sheet,
          #printable-grade-sheet * {
            visibility: visible;
          }
          #printable-grade-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            min-height: auto !important;
            padding: 4mm 6mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
