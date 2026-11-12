'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ExternalLink,
  Search,
  UserCheck,
  UserPlus,
  Edit3,
  Save,
  X,
  GraduationCap,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Filter,
  ArrowRightLeft,
  Building,
  Check,
  Upload,
  Download,
  ChevronDown,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  History,
  Copy,
} from 'lucide-react';
import { Course, UserAccount } from '@/types';
import { downloadCsvFile, getErrorMessage } from '@/lib/utils';
import {
  CourseCloneModal,
  CourseDeleteModal,
  CourseHistoryModal,
  CourseImportModal,
} from '../modals';
import { CourseEditModal } from './courses/CourseEditModal';

interface AdminCoursesTabProps {
  coursesCount: number;
  filteredCourses: Course[];
  courseSearch: string;
  setCourseSearch: (val: string) => void;
  courseProgramFilter: string;
  setCourseProgramFilter: (val: any) => void;
  instructors?: UserAccount[];
  onRefreshCourses?: () => void;
}

export const AdminCoursesTab: React.FC<AdminCoursesTabProps> = ({
  coursesCount,
  filteredCourses,
  courseSearch,
  setCourseSearch,
  courseProgramFilter,
  setCourseProgramFilter,
  instructors = [],
  onRefreshCourses,
}) => {
  // Local states for editing modal
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Import / Export states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Export Courses to CSV with UTF-8 BOM for Excel
  const exportCoursesToCSV = (list: Course[], filename: string) => {
    const headers = [
      'รหัสวิชา',
      'ชื่อรายวิชา (ไทย)',
      'ชื่อรายวิชา (อังกฤษ)',
      'หน่วยกิต',
      'หลักสูตร',
      'ระดับหลักสูตร',
      'สาขาวิชา',
      'ชั้นปี',
      'ตอนเรียน',
      'ปีการศึกษา',
      'ภาคเรียน',
      'อาจารย์ผู้สอน',
      'วันเรียน',
      'เวลาเริ่ม',
      'เวลาสิ้นสุด',
      'ห้องเรียน',
      'คำอธิบายรายวิชา',
    ];

    const dayNameMap: Record<number, string> = {
      1: 'วันจันทร์',
      2: 'วันอังคาร',
      3: 'วันพุธ',
      4: 'วันพฤหัสบดี',
      5: 'วันศุกร์',
      6: 'วันเสาร์',
      7: 'วันอาทิตย์',
      0: 'วันอาทิตย์',
    };

    const rows = list.map((c) => [
      c.courseCode || '',
      c.courseName || '',
      c.courseNameEn || '',
      String(c.credits || 3),
      c.programType === 'ENGLISH' ? 'ENGLISH' : 'THAI',
      c.degreeLevel || 'ปริญญาตรี',
      c.major || '',
      String(c.yearLevel || 1),
      c.section || '',
      c.academicYear || '',
      String(c.semester || 1),
      c.instructor || '',
      dayNameMap[c.dayOfWeek || 1] || 'ไม่ระบุวัน',
      c.startTime || '',
      c.endTime || '',
      c.room || '',
      c.description || '',
    ]);

    downloadCsvFile(filename, headers, rows);
    setIsExportMenuOpen(false);
  };

  // Form states
  const [formCourseCode, setFormCourseCode] = useState('');
  const [formCourseName, setFormCourseName] = useState('');
  const [formCourseNameEn, setFormCourseNameEn] = useState('');
  const [formCredits, setFormCredits] = useState<number>(3);
  const [formDegreeLevel, setFormDegreeLevel] = useState('ปริญญาตรี');
  const [formProgramType, setFormProgramType] = useState<'THAI' | 'ENGLISH'>('THAI');
  const [formAcademicYear, setFormAcademicYear] = useState('2569');
  const [formSemester, setFormSemester] = useState<number>(1);
  const [formRoom, setFormRoom] = useState('');
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(1);
  const [formStartTime, setFormStartTime] = useState('09.00');
  const [formEndTime, setFormEndTime] = useState('11.30');

  // Deletion state
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Instructor assignment states
  const [primaryTeacher, setPrimaryTeacher] = useState('');
  const [isCoordinator, setIsCoordinator] = useState(true); // Has '*' mark
  const [coTeacher, setCoTeacher] = useState('');
  const [isCustomInstructor, setIsCustomInstructor] = useState(false);
  const [customInstructorText, setCustomInstructorText] = useState('');

  // Filter states in toolbar
  const [degreeFilter, setDegreeFilter] = useState('ALL');
  const [academicYearFilter, setAcademicYearFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');

  // Instructor change reason, history modal, and clone-term modal states
  const [formChangeReason, setFormChangeReason] = useState('');
  const [historyCourse, setHistoryCourse] = useState<Course | null>(null);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

  const availableAcademicYears = useMemo(() => {
    const years = new Set<string>();
    filteredCourses.forEach((c) => {
      const yr = c.academicYear?.trim() || c.term?.split('/')[1]?.trim();
      if (yr) years.add(yr);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [filteredCourses]);

  // Extract unique instructor names from prop or from course list
  const availableInstructors = useMemo(() => {
    const names = new Set<string>();
    instructors.forEach((i) => {
      if (i.name && i.name.trim()) names.add(i.name.trim());
    });
    // Add any instructors from courses list
    filteredCourses.forEach((c) => {
      if (c.instructor) {
        c.instructor.split('/').forEach((part) => {
          const clean = part.replace(/\*/g, '').trim();
          if (clean && clean.length > 3) names.add(clean);
        });
      }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'th'));
  }, [instructors, filteredCourses]);

  // Open Edit Modal
  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setFormCourseCode(course.courseCode || '');
    setFormCourseName(course.courseName || '');
    setFormCourseNameEn(course.courseNameEn || '');
    setFormCredits(course.credits || 3);
    setFormDegreeLevel(course.degreeLevel || 'ปริญญาตรี');
    setFormProgramType(course.programType === 'ENGLISH' ? 'ENGLISH' : 'THAI');
    setFormAcademicYear(course.academicYear || '2569');
    setFormSemester(course.semester || 1);
    setFormRoom(course.room || '');
    setFormDayOfWeek(course.dayOfWeek || 1);
    setFormStartTime(course.startTime || '09.00');
    setFormEndTime(course.endTime || '11.30');

    // Parse existing instructor string
    const rawInst = course.instructor || course.primaryTeacherName || '';
    setCustomInstructorText(rawInst);

    if (rawInst.includes('/')) {
      const parts = rawInst.split('/');
      const p1 = parts[0]?.trim() || '';
      const p2 = parts[1]?.trim() || '';
      setIsCoordinator(p1.includes('*'));
      setPrimaryTeacher(p1.replace(/\*/g, '').trim());
      setCoTeacher(p2.replace(/\*/g, '').trim());
      setIsCustomInstructor(false);
    } else if (rawInst) {
      setIsCoordinator(rawInst.includes('*'));
      setPrimaryTeacher(rawInst.replace(/\*/g, '').trim());
      setCoTeacher('');
      setIsCustomInstructor(false);
    } else {
      setPrimaryTeacher('');
      setCoTeacher('');
      setIsCoordinator(true);
      setIsCustomInstructor(false);
    }

    setFormChangeReason('');
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  // Compute final instructor string
  const computedInstructorString = useMemo(() => {
    if (isCustomInstructor) {
      return customInstructorText.trim();
    }
    if (!primaryTeacher) return '';
    let res = primaryTeacher.trim();
    if (isCoordinator) {
      res += '*';
    }
    if (coTeacher && coTeacher.trim()) {
      res += `/${coTeacher.trim()}`;
    }
    return res;
  }, [isCustomInstructor, customInstructorText, primaryTeacher, isCoordinator, coTeacher]);

  // Save changes via PATCH /api/courses
  const handleSaveCourse = async () => {
    if (!editingCourse) return;
    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const finalInstructor = computedInstructorString;
      const payload = {
        id: editingCourse.id || editingCourse.courseCode,
        courseCode: editingCourse.courseCode,
        section: editingCourse.section || '1',
        reason: formChangeReason.trim() || undefined,
        updates: {
          courseCode: formCourseCode.trim(),
          courseName: formCourseName.trim(),
          courseNameEn: formCourseNameEn.trim(),
          credits: Number(formCredits),
          degreeLevel: formDegreeLevel,
          programType: formProgramType,
          academicYear: formAcademicYear,
          semester: Number(formSemester),
          term: `${formSemester}/${formAcademicYear}`,
          room: formRoom.trim(),
          dayOfWeek: Number(formDayOfWeek),
          startTime: formStartTime,
          endTime: formEndTime,
          section: editingCourse.section || '1',
          instructor: finalInstructor,
          primaryTeacherName: primaryTeacher || finalInstructor.replace(/\*/g, '').split('/')[0]?.trim(),
        },
      };

      const res = await fetch('/api/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'บันทึกข้อมูลไม่สำเร็จ');
      }

      setSaveSuccessMsg('บันทึกการสับเปลี่ยนอาจารย์ผู้สอนและข้อมูลรายวิชาเรียบร้อยแล้ว!');
      if (onRefreshCourses) {
        onRefreshCourses();
      }

      setTimeout(() => {
        setEditingCourse(null);
        setSaveSuccessMsg(null);
      }, 1500);
    } catch (err: unknown) {
      setSaveErrorMsg((err instanceof Error ? err.message : String(err)) || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete course via DELETE /api/courses
  const handleConfirmDelete = async () => {
    if (!deletingCourse) return;
    const target = deletingCourse;
    // Close confirmation dialog and edit modal immediately
    setDeletingCourse(null);
    if (editingCourse?.id === target.id || editingCourse?.courseCode === target.courseCode) {
      setEditingCourse(null);
    }

    setIsDeleting(true);
    try {
      const idOrCode = target.id || target.courseCode;
      const res = await fetch(`/api/courses?id=${encodeURIComponent(idOrCode)}&courseCode=${encodeURIComponent(target.courseCode)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ลบรายวิชาไม่สำเร็จ');
      }

      if (onRefreshCourses) {
        onRefreshCourses();
      }
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'เกิดข้อผิดพลาดในการลบรายวิชา'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered courses including local degree, academicYear, semester, and year filters
  const displayedCourses = useMemo(() => {
    return filteredCourses.filter((c) => {
      if (degreeFilter !== 'ALL' && c.degreeLevel !== degreeFilter) return false;

      // Filter by Academic Year
      if (academicYearFilter !== 'ALL') {
        const cYearStr = c.academicYear?.trim() || c.term?.split('/')[1]?.trim();
        if (cYearStr !== academicYearFilter) return false;
      }

      // Filter by Semester
      if (semesterFilter !== 'ALL') {
        const cSem =
          c.semester !== undefined && c.semester !== null
            ? String(c.semester)
            : c.term
            ? c.term.split('/')[0]?.trim()
            : undefined;
        if (cSem !== semesterFilter) return false;
      }

      // Filter by Year Level
      if (yearFilter !== 'ALL') {
        const cYear = c.yearLevel !== undefined && c.yearLevel !== null ? String(c.yearLevel) : '1';
        if (cYear !== yearFilter) return false;
      }

      return true;
    });
  }, [filteredCourses, degreeFilter, academicYearFilter, semesterFilter, yearFilter]);

  const dayNames = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            คลังหลักสูตรและรายวิชา (Curriculum & Courses Management)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            รายวิชาทั้งหมด {coursesCount} วิชา • สามารถสับเปลี่ยนหรือมอบหมายอาจารย์ผู้สอนหลัก / ผู้สอนร่วม ได้ทันที
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Clone Term Button */}
          <button
            type="button"
            onClick={() => setIsCloneModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            title="คัดลอกรายวิชาทั้งหมดจากปีการศึกษา/ภาคเรียนเดิม ไปสร้างเป็นปีการศึกษาใหม่โดยไม่ทับประวัติเดิม"
          >
            <Copy className="w-3.5 h-3.5 text-amber-600" />
            <span>📋 คัดลอกข้ามปีการศึกษา</span>
          </button>

          {/* Import Button */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            title="นำเข้ารายวิชาและตารางสอนจากไฟล์ Excel / CSV หรือคัดลอกจากตาราง"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>📥 นำเข้า Excel / CSV</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              title="ส่งออกรายวิชาและตารางสอนเป็นไฟล์ Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>📤 ส่งออก Excel / CSV</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsExportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs text-slate-700 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-100">
                    เลือกชุดข้อมูลส่งออก (UTF-8 BOM สำหรับ Excel)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      exportCoursesToCSV(filteredCourses, `courses_all_${new Date().toISOString().slice(0, 10)}.csv`);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
                  >
                    <span>📊 รายวิชาทั้งหมดในระบบ</span>
                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                      {filteredCourses.length} วิชา
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportCoursesToCSV(displayedCourses, `courses_filtered_${new Date().toISOString().slice(0, 10)}.csv`);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
                  >
                    <span>🔍 เฉพาะรายการที่ค้นหา/กรอง</span>
                    <span className="font-mono text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-700 font-bold border border-emerald-200">
                      {displayedCourses.length} วิชา
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {onRefreshCourses && (
            <button
              onClick={onRefreshCourses}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="โหลดข้อมูลล่าสุด"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>รีเฟรช</span>
            </button>
          )}
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <span>เปิดหน้าจอหลักสูตรเต็มรูปแบบ</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Advice / Academic Guide Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl p-4 text-xs text-slate-700 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="font-bold text-emerald-950 flex items-center gap-2 text-sm">
              <span>แนวปฏิบัติการสับเปลี่ยนอาจารย์ผู้สอน (Faculty Teaching Assignments)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                มาตรฐานวิชาการ มจร
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong>1. อาจารย์ผู้รับผิดชอบรายวิชา:</strong> กำกับด้วยเครื่องหมายดอกจัน (<code className="bg-white/80 px-1 py-0.5 rounded font-mono text-emerald-700 font-bold">*</code>) ต่อท้ายชื่ออาจารย์ เพื่อออกใบภาระงานสอนและใบรับรอง<br />
              <strong>2. การสอนร่วม (Team Teaching):</strong> คั่นด้วยเครื่องหมายทับ (<code className="bg-white/80 px-1 py-0.5 rounded font-mono text-emerald-700 font-bold">/</code>) เช่น <code className="bg-white/80 px-1 py-0.5 rounded text-slate-800 font-mono">อาจารย์ ก, ดร.* / อาจารย์ ข, ผศ.ดร.</code><br />
              <strong>3. การซิงค์อัตโนมัติ:</strong> เมื่อแก้ไขอาจารย์ในรายวิชานี้ ระบบจะอัปเดตไปยังตารางเรียนตารางสอน (Timetable) และ Google Sheets ที่เกี่ยวข้องโดยอัตโนมัติ
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสวิชา, ชื่อวิชา (ไทย/อังกฤษ) หรือชื่ออาจารย์ผู้สอน..."
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Degree Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">ระดับ:</span>
            <select
              value={degreeFilter}
              onChange={(e) => setDegreeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">ทุกระดับการศึกษา</option>
              <option value="ปริญญาตรี">ปริญญาตรี</option>
              <option value="ปริญญาโท">ปริญญาโท</option>
              <option value="ปริญญาเอก">ปริญญาเอก</option>
              <option value="ประกาศนียบัตร">ประกาศนียบัตร</option>
            </select>
          </div>

          {/* Academic Year Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">ปีการศึกษา:</span>
            <select
              value={academicYearFilter}
              onChange={(e) => setAcademicYearFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">ปีการศึกษา: ทั้งหมด</option>
              {availableAcademicYears.map((yr) => (
                <option key={yr} value={yr}>
                  ปี {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">ภาคการศึกษา:</span>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">ภาคการศึกษา: ทั้งหมด</option>
              <option value="1">ภาคเรียนที่ 1</option>
              <option value="2">ภาคเรียนที่ 2</option>
              <option value="3">ภาคฤดูร้อน (3)</option>
            </select>
          </div>

          {/* Year Level Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">ชั้นปี:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">ชั้นปี: ทั้งหมด</option>
              <option value="1">ชั้นปีที่ 1</option>
              <option value="2">ชั้นปีที่ 2</option>
              <option value="3">ชั้นปีที่ 3</option>
              <option value="4">ชั้นปีที่ 4</option>
            </select>
          </div>

          {/* Program Filter */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl font-bold shrink-0">
            <button
              onClick={() => setCourseProgramFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                courseProgramFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setCourseProgramFilter('THAI')}
              className={`px-3 py-1.5 rounded-lg transition ${
                courseProgramFilter === 'THAI' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700'
              }`}
            >
              🇹🇭 ภาคไทย
            </button>
            <button
              onClick={() => setCourseProgramFilter('ENGLISH')}
              className={`px-3 py-1.5 rounded-lg transition ${
                courseProgramFilter === 'ENGLISH' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-700'
              }`}
            >
              🌐 Inter (EN)
            </button>
          </div>

          {/* Reset Filters button */}
          {(degreeFilter !== 'ALL' || academicYearFilter !== 'ALL' || semesterFilter !== 'ALL' || yearFilter !== 'ALL' || courseProgramFilter !== 'ALL' || courseSearch.trim()) && (
            <button
              onClick={() => {
                setDegreeFilter('ALL');
                setAcademicYearFilter('ALL');
                setSemesterFilter('ALL');
                setYearFilter('ALL');
                setCourseProgramFilter('ALL');
                setCourseSearch('');
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition inline-flex items-center gap-1 cursor-pointer shrink-0"
              title="ล้างตัวกรองทั้งหมด"
            >
              <X className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>
      </div>

      {/* Courses Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
              <tr>
                <th className="px-5 py-3.5">รหัสวิชา</th>
                <th className="px-5 py-3.5">ชื่อรายวิชา</th>
                <th className="px-5 py-3.5">หลักสูตร / ระดับ</th>
                <th className="px-5 py-3.5 text-center">หน่วยกิต</th>
                <th className="px-5 py-3.5">อาจารย์ผู้สอน / ผู้รับผิดชอบ</th>
                <th className="px-5 py-3.5">ห้อง / เวลา</th>
                <th className="px-5 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayedCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    ไม่พบรายวิชาตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                displayedCourses.slice(0, 50).map((c) => {
                  const isEnglish = c.programType === 'ENGLISH';
                  const instText = c.instructor || c.primaryTeacherName || '';
                  const hasCoordinatorMark = instText.includes('*');
                  const isTeamTeaching = instText.includes('/');

                  return (
                    <tr key={c.id || c.courseCode} className="hover:bg-slate-50/80 transition-colors">
                      {/* Code */}
                      <td className="px-5 py-3.5 font-mono font-bold text-emerald-800">
                        {c.courseCode}
                      </td>

                      {/* Course Name */}
                      <td className="px-5 py-3.5 font-medium text-slate-900 max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-1">{c.courseName}</div>
                        {c.courseNameEn && (
                          <div className="text-[11px] text-slate-400 font-normal line-clamp-1">
                            {c.courseNameEn}
                          </div>
                        )}
                      </td>

                      {/* Program & Degree */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isEnglish
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isEnglish ? '🌐 Inter (EN)' : '🇹🇭 ภาคไทย'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {c.degreeLevel || 'ปริญญาตรี'} • ปี {c.yearLevel || 1}
                            {c.academicYear
                              ? ` • ภาค ${c.semester || 1}/${c.academicYear}`
                              : c.term
                              ? ` • ภาค ${c.term}`
                              : c.semester
                              ? ` (เทอม ${c.semester})`
                              : ''}
                          </span>
                        </div>
                      </td>

                      {/* Credits */}
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-800">
                        {c.credits || 3}
                      </td>

                      {/* Instructor with Quick Edit Button */}
                      <td className="px-5 py-3.5 text-slate-800">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-slate-900">
                              {instText ? instText.replace(/\*/g, '') : <span className="text-slate-400 italic">ยังไม่ระบุอาจารย์</span>}
                            </span>
                            {hasCoordinatorMark && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                                title="อาจารย์ผู้รับผิดชอบรายวิชา (*)"
                              >
                                <span>* ผู้รับผิดชอบ</span>
                              </span>
                            )}
                            {isTeamTeaching && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                                title="สอนร่วมกัน 2 ท่านขึ้นไป"
                              >
                                สอนร่วม
                              </span>
                            )}
                          </div>

                          {/* Quick Change Instructor Button */}
                          <div>
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold hover:underline cursor-pointer"
                            >
                              <ArrowRightLeft className="w-3 h-3 text-emerald-600" />
                              <span>สับเปลี่ยน/มอบหมายอาจารย์</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Room & Time */}
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap text-[11px]">
                        <div>ห้อง: {c.room || '-'}</div>
                        <div className="text-slate-400">
                          {c.dayOfWeek ? dayNames[(c.dayOfWeek - 1) % 7] : '-'} {c.startTime ? `${c.startTime}-${c.endTime}` : ''}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setHistoryCourse(c)}
                            className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition inline-flex items-center gap-1 cursor-pointer ${
                              (c.instructorHistory?.length || 0) > 0
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                            title="ดูประวัติการเปลี่ยนอาจารย์ผู้สอนย้อนหลัง"
                          >
                            <History className="w-3 h-3" />
                            <span>ประวัติ{(c.instructorHistory?.length || 0) > 0 ? ` (${c.instructorHistory!.length})` : ''}</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition inline-flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-600/20"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>แก้ไข</span>
                          </button>
                          <Link
                            href={`/courses?search=${c.courseCode}`}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition inline-flex items-center"
                            title="ดูมุมมองรายวิชาละเอียด"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => setDeletingCourse(c)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition inline-flex items-center cursor-pointer"
                            title="ลบรายวิชานี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {displayedCourses.length > 50 && (
          <div className="px-5 py-3 bg-slate-50 border-t text-center text-xs text-slate-500">
            แสดง 50 รายการแรกจากทั้งหมด {displayedCourses.length} รายการ (ใช้ช่องค้นหาเพื่อเจาะจงรายวิชา)
          </div>
        )}
      </div>

      <CourseEditModal
        editingCourse={editingCourse}
        onClose={() => setEditingCourse(null)}
        isSaving={isSaving}
        saveSuccessMsg={saveSuccessMsg}
        saveErrorMsg={saveErrorMsg}
        availableInstructors={availableInstructors}
        primaryTeacher={primaryTeacher}
        setPrimaryTeacher={setPrimaryTeacher}
        coTeacher={coTeacher}
        setCoTeacher={setCoTeacher}
        isCoordinator={isCoordinator}
        setIsCoordinator={setIsCoordinator}
        isCustomInstructor={isCustomInstructor}
        setIsCustomInstructor={setIsCustomInstructor}
        customInstructorText={customInstructorText}
        setCustomInstructorText={setCustomInstructorText}
        computedInstructorString={computedInstructorString}
        formCourseCode={formCourseCode}
        setFormCourseCode={setFormCourseCode}
        formCourseName={formCourseName}
        setFormCourseName={setFormCourseName}
        formCourseNameEn={formCourseNameEn}
        setFormCourseNameEn={setFormCourseNameEn}
        formCredits={formCredits}
        setFormCredits={setFormCredits}
        formDegreeLevel={formDegreeLevel}
        setFormDegreeLevel={setFormDegreeLevel}
        formProgramType={formProgramType}
        setFormProgramType={setFormProgramType}
        formAcademicYear={formAcademicYear}
        setFormAcademicYear={setFormAcademicYear}
        formSemester={formSemester}
        setFormSemester={setFormSemester}
        formRoom={formRoom}
        setFormRoom={setFormRoom}
        formDayOfWeek={formDayOfWeek}
        setFormDayOfWeek={setFormDayOfWeek}
        formStartTime={formStartTime}
        setFormStartTime={setFormStartTime}
        formEndTime={formEndTime}
        setFormEndTime={setFormEndTime}
        formChangeReason={formChangeReason}
        setFormChangeReason={setFormChangeReason}
        onSave={handleSaveCourse}
        onOpenHistory={(course) => setHistoryCourse(course)}
        onOpenDelete={(course) => setDeletingCourse(course)}
      />
      <CourseDeleteModal
        course={deletingCourse}
        isDeleting={isDeleting}
        onClose={() => setDeletingCourse(null)}
        onConfirm={handleConfirmDelete}
      />

      <CourseHistoryModal
        course={historyCourse}
        onClose={() => setHistoryCourse(null)}
      />

      <CourseCloneModal
        isOpen={isCloneModalOpen}
        availableAcademicYears={availableAcademicYears}
        onClose={() => setIsCloneModalOpen(false)}
        onCloned={onRefreshCourses}
      />

      {/* Course Import Modal */}
      <CourseImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingCourses={filteredCourses}
        onSuccess={() => {
          if (onRefreshCourses) onRefreshCourses();
        }}
      />
    </div>
  );
};
