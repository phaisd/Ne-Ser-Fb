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
} from 'lucide-react';
import { Course, UserAccount } from '@/types';
import { CourseImportModal } from '../modals';

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

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  // Form states
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

  // Instructor assignment states
  const [primaryTeacher, setPrimaryTeacher] = useState('');
  const [isCoordinator, setIsCoordinator] = useState(true); // Has '*' mark
  const [coTeacher, setCoTeacher] = useState('');
  const [isCustomInstructor, setIsCustomInstructor] = useState(false);
  const [customInstructorText, setCustomInstructorText] = useState('');

  // Degree filter in toolbar
  const [degreeFilter, setDegreeFilter] = useState('ALL');

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
        updates: {
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
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered courses including local degree filter
  const displayedCourses = useMemo(() => {
    return filteredCourses.filter((c) => {
      if (degreeFilter !== 'ALL' && c.degreeLevel !== degreeFilter) return false;
      return true;
    });
  }, [filteredCourses, degreeFilter]);

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

          {/* Program Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl font-bold shrink-0">
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

      {/* ─────────────────────────────────────────────────────────────
          MODAL: แก้ไขข้อมูลรายวิชา & สับเปลี่ยนอาจารย์ผู้สอน
         ───────────────────────────────────────────────────────────── */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[92vh] space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
                    {editingCourse.courseCode}
                  </span>
                  <span className="text-xs text-slate-400">• {editingCourse.degreeLevel || 'ปริญญาตรี'}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  แก้ไขรายวิชาและสับเปลี่ยนอาจารย์ผู้สอน
                </h3>
                <p className="text-xs text-slate-500">
                  ปรับเปลี่ยนผู้สอนหลัก, ผู้สอนร่วม หรือสับเปลี่ยนอาจารย์ตามปีการศึกษา
                </p>
              </div>
              <button
                onClick={() => setEditingCourse(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification messages */}
            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}
            {saveErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{saveErrorMsg}</span>
              </div>
            )}

            {/* SECTION 1: INSTRUCTOR ASSIGNMENT (จุดเน้นหลัก) */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>การมอบหมายอาจารย์ผู้สอน (Instructor Assignment)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomInstructor(!isCustomInstructor)}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  {isCustomInstructor ? 'สลับกลับเป็นแบบเลือกจากรายชื่อ' : '✏️ กรอกชื่ออิสระ (อาจารย์พิเศษภายนอก)'}
                </button>
              </div>

              {!isCustomInstructor ? (
                <div className="space-y-3">
                  {/* Primary Instructor */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      1. อาจารย์ผู้สอนหลัก (Primary Instructor)
                    </label>
                    <select
                      value={primaryTeacher}
                      onChange={(e) => setPrimaryTeacher(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">-- เลือกอาจารย์ผู้สอนจากคลังคณาจารย์ ({availableInstructors.length} ท่าน) --</option>
                      {availableInstructors.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>

                    {/* Coordinator Checkbox */}
                    <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isCoordinator}
                        onChange={(e) => setIsCoordinator(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-700 font-medium">
                        กำหนดเป็น <strong>อาจารย์ผู้รับผิดชอบรายวิชา</strong> (จะมีเครื่องหมาย <code className="text-emerald-700 font-bold">*</code> ต่อท้ายชื่อ)
                      </span>
                    </label>
                  </div>

                  {/* Co-Instructor */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      2. อาจารย์ผู้สอนร่วม (Co-Instructor / Team Teaching) (ถ้ามี)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={coTeacher}
                        onChange={(e) => setCoTeacher(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="">-- ไม่มีอาจารย์ผู้สอนร่วม (ผู้สอนเดี่ยว) --</option>
                        {availableInstructors
                          .filter((name) => name !== primaryTeacher)
                          .map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                      </select>
                      {coTeacher && (
                        <button
                          type="button"
                          onClick={() => setCoTeacher('')}
                          className="px-2.5 py-1 text-slate-400 hover:text-rose-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition"
                          title="ล้างผู้สอนร่วม"
                        >
                          ลบ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Custom Text Input Mode */
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700">
                    ระบุชื่ออาจารย์ผู้สอนอิสระ (สำหรับอาจารย์พิเศษ หรือผู้สอนหลายท่าน)
                  </label>
                  <input
                    type="text"
                    value={customInstructorText}
                    onChange={(e) => setCustomInstructorText(e.target.value)}
                    placeholder="เช่น พระครูสุตพุทธานุวัตร, ดร.*/ดร.สมชาย ใจดี"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[10px] text-slate-500">
                    คำแนะนำ: ใช้เครื่องหมาย <code className="font-bold text-emerald-700">*</code> ต่อท้ายชื่อผู้รับผิดชอบรายวิชา และคั่นระหว่างผู้สอนด้วย <code className="font-bold text-emerald-700">/</code>
                  </p>
                </div>
              )}

              {/* Real-time Preview Banner */}
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-100/60 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-800">พรีวิวชื่อที่จะบันทึก:</span>
                <span className="font-bold font-mono text-emerald-900">
                  {computedInstructorString || <span className="text-slate-400 font-normal italic">ยังไม่ระบุ</span>}
                </span>
              </div>
            </div>

            {/* SECTION 2: COURSE DETAILS & SCHEDULE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ชื่อรายวิชา (ภาษาไทย)
                </label>
                <input
                  type="text"
                  value={formCourseName}
                  onChange={(e) => setFormCourseName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ชื่อรายวิชา (ภาษาอังกฤษ)
                </label>
                <input
                  type="text"
                  value={formCourseNameEn}
                  onChange={(e) => setFormCourseNameEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ระดับการศึกษา
                </label>
                <select
                  value={formDegreeLevel}
                  onChange={(e) => setFormDegreeLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="ปริญญาตรี">ปริญญาตรี</option>
                  <option value="ปริญญาโท">ปริญญาโท</option>
                  <option value="ปริญญาเอก">ปริญญาเอก</option>
                  <option value="ประกาศนียบัตร">ประกาศนียบัตร</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  หลักสูตรภาษา
                </label>
                <select
                  value={formProgramType}
                  onChange={(e) => setFormProgramType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="THAI">🇹🇭 ภาคภาษาไทย</option>
                  <option value="ENGLISH">🌐 ภาคภาษาอังกฤษ (Inter)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ปีการศึกษา
                </label>
                <input
                  type="text"
                  value={formAcademicYear}
                  onChange={(e) => setFormAcademicYear(e.target.value)}
                  placeholder="2569"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ภาคการศึกษา
                </label>
                <select
                  value={formSemester}
                  onChange={(e) => setFormSemester(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value={1}>ภาคเรียนที่ 1</option>
                  <option value={2}>ภาคเรียนที่ 2</option>
                  <option value={3}>ภาคเรียนฤดูร้อน</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ห้องเรียน
                </label>
                <input
                  type="text"
                  value={formRoom}
                  onChange={(e) => setFormRoom(e.target.value)}
                  placeholder="เช่น B401, C205"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  หน่วยกิต
                </label>
                <input
                  type="number"
                  value={formCredits}
                  onChange={(e) => setFormCredits(Number(e.target.value))}
                  min={1}
                  max={12}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-[11px] text-slate-400">
                * ข้อมูลที่แก้ไขจะถูกบันทึกและซิงค์เชื่อมต่อไปยังตารางเรียนตารางสอนโดยตรง
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveCourse}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>บันทึกการแก้ไข</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
