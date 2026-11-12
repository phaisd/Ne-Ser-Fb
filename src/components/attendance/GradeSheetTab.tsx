'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { CollectionScoreColumn, CourseGradeSheet, StudentScoreItem } from '@/types';
import { toSafeCsvCell, cleanImportedCsvCell } from '@/lib/security';
import { groupAndSortByMajor } from './majorGrouping';
import {
  calculateMcuGrade,
  calculateTotalScore,
  calculateGradeSummaryStats,
} from '@/lib/grading/gradeCalculator';
import {
  calculateCollectionSum,
  clampCollectionCount,
  DEFAULT_COLLECTION_COUNT,
  normalizeCollectionColumns,
  scaleCollectionToTarget,
} from '@/lib/grading/collectionScores';

import {
  GradeSheetStudentInput,
  ComputedGradeRow,
  GradeSheetTabProps,
  GradeSheetControls,
  GradeSheetMobileCards,
  GradeSheetTable,
  CollectionScoreSheet,
  PrintScaleToolbar,
  GradeSheetPrintView,
} from './grades';

export { calculateMcuGrade };
export type { GradeSheetStudentInput, ComputedGradeRow, GradeSheetTabProps };

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

  // A4 Print Table Row Height & Font Size Customization
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
  const [activeGradeSubTab, setActiveGradeSubTab] = useState<'main' | 'collection'>('main');
  const [collectionCount, setCollectionCount] = useState<number>(DEFAULT_COLLECTION_COUNT);
  const [collectionColumns, setCollectionColumns] = useState<CollectionScoreColumn[]>(() =>
    normalizeCollectionColumns(DEFAULT_COLLECTION_COUNT)
  );
  const [collectionScores, setCollectionScores] = useState<Record<string, (number | null)[]>>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Fetch configured logoUrl from /api/system-settings
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
    setCollectionCount(DEFAULT_COLLECTION_COUNT);
    setCollectionColumns(normalizeCollectionColumns(DEFAULT_COLLECTION_COUNT));
    setCollectionScores({});

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
          const loadedCount = clampCollectionCount(saved.collectionCount);
          setCollectionCount(loadedCount);
          setCollectionColumns(normalizeCollectionColumns(loadedCount, saved.collectionColumns));
          setCollectionScores(saved.collectionScores || {});
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

  // Group and sort students by Major
  const { groupedSections, computedRows } = useMemo(() => {
    const baseComputed = studentsList.map((stu) => {
      const item = scoresMap[stu.studentCode] || { studentCode: stu.studentCode };
      const assign = item.assignScore;
      const affective = item.affectiveScore;
      const midterm = item.midtermScore;
      const final = item.finalScore;

      const total = calculateTotalScore({
        assignScore: assign,
        affectiveScore: affective,
        midtermScore: midterm,
        finalScore: final,
      });

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

    const { sections, flatSorted } = groupAndSortByMajor<ComputedGradeRow>(baseComputed);
    return {
      groupedSections: sections,
      computedRows: flatSorted,
    };
  }, [studentsList, scoresMap, formLanguage]);

  // Summary Statistics for Footer
  const summaryStats = useMemo(() => {
    return calculateGradeSummaryStats(computedRows);
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
        collectionCount,
        collectionColumns: normalizeCollectionColumns(collectionCount, collectionColumns),
        collectionScores,
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
    } catch (e: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  };

  // Export CSV
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

  // Import CSV
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

  const handleChangeCollectionCount = (nextCount: number) => {
    const clamped = clampCollectionCount(nextCount);
    setCollectionCount(clamped);
    setCollectionColumns((prev) => normalizeCollectionColumns(clamped, prev));
  };

  const handleUpdateCollectionColumn = (
    index: number,
    patch: Partial<CollectionScoreColumn>,
  ) => {
    setCollectionColumns((prev) => {
      const normalized = normalizeCollectionColumns(collectionCount, prev);
      return normalized.map((col, idx) => (idx === index ? { ...col, ...patch } : col));
    });
  };

  const handleSetAllCollectionMaxScores = (maxScore: number) => {
    if (!Number.isFinite(maxScore) || maxScore <= 0) return;
    setCollectionColumns((prev) =>
      normalizeCollectionColumns(collectionCount, prev).map((col) => ({
        ...col,
        maxScore,
      })),
    );
  };

  const handleUpdateCollectionCellScore = (
    studentCode: string,
    colIndex: number,
    rawValue: string,
  ) => {
    const colMax = collectionColumns[colIndex]?.maxScore ?? 10;
    const trimmed = rawValue.trim();
    let parsed: number | null = null;
    if (trimmed !== '') {
      const num = parseFloat(trimmed);
      if (Number.isFinite(num)) {
        parsed = Math.min(colMax, Math.max(0, num));
      } else {
        return;
      }
    }

    setCollectionScores((prev) => {
      const currentArr = [...(prev[studentCode] || [])];
      while (currentArr.length < collectionCount) {
        currentArr.push(null);
      }
      currentArr[colIndex] = parsed;
      return {
        ...prev,
        [studentCode]: currentArr,
      };
    });
  };

  const handleApplyCollectionToMainSheet = (
    targetField: 'assignScore' | 'midtermScore',
  ): number => {
    const safeCount = clampCollectionCount(collectionCount);
    const activeCols = collectionColumns.slice(0, safeCount);
    const totalColMax = activeCols.reduce(
      (acc, c) => acc + (Number.isFinite(c.maxScore) && c.maxScore > 0 ? c.maxScore : 0),
      0,
    );
    const targetMax = targetField === 'assignScore' ? maxAssignScore : maxMidtermScore;

    const scaledUpdates: { studentCode: string; studentName: string; scaled: number }[] = [];
    studentsList.forEach((stu) => {
      const arr = collectionScores[stu.studentCode];
      const { sum, filledCount } = calculateCollectionSum(arr, safeCount);
      if (filledCount === 0) return;
      scaledUpdates.push({
        studentCode: stu.studentCode,
        studentName: stu.studentName,
        scaled: scaleCollectionToTarget(sum, totalColMax, targetMax),
      });
    });

    if (scaledUpdates.length > 0) {
      setScoresMap((prev) => {
        const next = { ...prev };
        scaledUpdates.forEach(({ studentCode, studentName, scaled }) => {
          const existing = next[studentCode] || { studentCode, studentName };
          next[studentCode] = {
            ...existing,
            [targetField]: scaled,
          };
        });
        return next;
      });
    }

    return scaledUpdates.length;
  };

  const totalMaxWeight = maxAssignScore + maxAffectiveScore + maxMidtermScore + maxFinalScore;

  return (
    <div className="space-y-6">
      {/* 1. Interactive Control & Score Entry Panel */}
      <div className="space-y-5">
        <GradeSheetControls
          currentCourse={currentCourse}
          availableCourses={availableCourses}
          selectedCourseCode={selectedCourseCode}
          handleCourseChange={handleCourseChange}
          formLanguage={formLanguage}
          setFormLanguage={setFormLanguage}
          printBlankForm={printBlankForm}
          setPrintBlankForm={setPrintBlankForm}
          saving={saving}
          saveMessage={saveMessage}
          setSaveMessage={setSaveMessage}
          showConfigPanel={showConfigPanel}
          setShowConfigPanel={setShowConfigPanel}
          handleSyncFromAttendance={handleSyncFromAttendance}
          handleExportCsv={handleExportCsv}
          handleImportCsv={handleImportCsv}
          handleSaveGradeSheet={handleSaveGradeSheet}
          maxAssignScore={maxAssignScore}
          setMaxAssignScore={setMaxAssignScore}
          maxAffectiveScore={maxAffectiveScore}
          setMaxAffectiveScore={setMaxAffectiveScore}
          maxMidtermScore={maxMidtermScore}
          setMaxMidtermScore={setMaxMidtermScore}
          maxFinalScore={maxFinalScore}
          setMaxFinalScore={setMaxFinalScore}
          totalMaxWeight={totalMaxWeight}
          yearLevelText={yearLevelText}
          setYearLevelText={setYearLevelText}
          majorText={majorText}
          setMajorText={setMajorText}
          semesterText={semesterText}
          setSemesterText={setSemesterText}
          academicYearText={academicYearText}
          setAcademicYearText={setAcademicYearText}
          creditText={creditText}
          setCreditText={setCreditText}
          lecturerName={lecturerName}
          setLecturerName={setLecturerName}
          departmentHeadName={departmentHeadName}
          setDepartmentHeadName={setDepartmentHeadName}
          submitDateTextTh={submitDateTextTh}
          setSubmitDateTextTh={setSubmitDateTextTh}
          submitDateTextEn={submitDateTextEn}
          setSubmitDateTextEn={setSubmitDateTextEn}
        />

        {/* Sub-Tab Switcher: Official Exam Score Sheet vs Continuous Collection Sheet (5-10 items) */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs print:hidden">
          <button
            type="button"
            onClick={() => setActiveGradeSubTab('main')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center gap-2 ${
              activeGradeSubTab === 'main'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📝 ใบกรอกคะแนนผลการสอบ (Official Grade Sheet)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveGradeSubTab('collection')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center gap-2 ${
              activeGradeSubTab === 'collection'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
          >
            <span>📋 ใบคะแนนเก็บ ({collectionCount} ครั้ง / 5-10 ครั้ง)</span>
          </button>
        </div>

        {/* Score Inputs: Main Grade Sheet OR Collection Score Sheet */}
        {activeGradeSubTab === 'main' ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5 print:hidden">
            <GradeSheetMobileCards
              groupedSections={groupedSections}
              formLanguage={formLanguage}
              maxAssignScore={maxAssignScore}
              maxAffectiveScore={maxAffectiveScore}
              maxMidtermScore={maxMidtermScore}
              maxFinalScore={maxFinalScore}
              handleUpdateStudentScore={handleUpdateStudentScore}
            />

            <GradeSheetTable
              groupedSections={groupedSections}
              formLanguage={formLanguage}
              maxAssignScore={maxAssignScore}
              maxAffectiveScore={maxAffectiveScore}
              maxMidtermScore={maxMidtermScore}
              maxFinalScore={maxFinalScore}
              totalMaxWeight={totalMaxWeight}
              handleUpdateStudentScore={handleUpdateStudentScore}
            />

            <PrintScaleToolbar
              showPrintPreviewOnScreen={showPrintPreviewOnScreen}
              setShowPrintPreviewOnScreen={setShowPrintPreviewOnScreen}
              printSizePreset={printSizePreset}
              applyPrintSizePreset={applyPrintSizePreset}
              printRowHeightPx={printRowHeightPx}
              printFontSizePx={printFontSizePx}
              handleCustomPrintScaleChange={handleCustomPrintScaleChange}
            />
          </div>
        ) : (
          <CollectionScoreSheet
            courseCode={currentCourse?.courseCode || selectedCourseCode}
            courseName={currentCourse?.courseName}
            semesterText={semesterText}
            academicYearText={academicYearText}
            lecturerName={lecturerName}
            formLanguage={formLanguage}
            groupedSections={groupedSections}
            collectionCount={collectionCount}
            collectionColumns={collectionColumns}
            collectionScores={collectionScores}
            maxAssignScore={maxAssignScore}
            maxMidtermScore={maxMidtermScore}
            saving={saving}
            onChangeCount={handleChangeCollectionCount}
            onUpdateColumn={handleUpdateCollectionColumn}
            onSetAllMaxScores={handleSetAllCollectionMaxScores}
            onUpdateCellScore={handleUpdateCollectionCellScore}
            onApplyToMainSheet={handleApplyCollectionToMainSheet}
            onSave={handleSaveGradeSheet}
          />
        )}
      </div>

      {/* 2. Official A4 Print Document (Thai / English) */}
      {activeGradeSubTab === 'main' && (
        <GradeSheetPrintView
          showPrintPreviewOnScreen={showPrintPreviewOnScreen}
          formLanguage={formLanguage}
          resolvedLogoUrl={resolvedLogoUrl}
          currentCourse={currentCourse}
          yearLevelText={yearLevelText}
          majorText={majorText}
          semesterText={semesterText}
          academicYearText={academicYearText}
          creditText={creditText}
          lecturerName={lecturerName}
          departmentHeadName={departmentHeadName}
          submitDateTextTh={submitDateTextTh}
          submitDateTextEn={submitDateTextEn}
          printFontSizePx={printFontSizePx}
          printRowHeightPx={printRowHeightPx}
          groupedSections={groupedSections}
          printBlankForm={printBlankForm}
          summaryStats={summaryStats}
        />
      )}
    </div>
  );
}
