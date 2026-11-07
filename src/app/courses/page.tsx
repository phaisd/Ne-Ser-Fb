'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  BookOpen,
  User,
  Plus,
  Globe,
  School,
  CheckCircle2,
  FileUp,
  FileDown,
} from 'lucide-react';
import {
  Course,
  TimetableItem,
  CourseModalMode,
  DAYS_OF_WEEK,
  CourseCatalogTab,
  CourseTimetableTab,
  CourseFacultyTab,
  CourseModals,
} from '@/components/courses';
import { getAuthUser, isAdminOrOfficer, saveAuthSession } from '@/lib/auth-client';

export default function CoursesPage() {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'TIMETABLE' | 'FACULTY'>('CATALOG');
  const [courses, setCourses] = useState<Course[]>([]);
  const [timetables, setTimetables] = useState<TimetableItem[]>([]);
  const [instructors, setInstructors] = useState<string[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(() => getAuthUser());
  const [loading, setLoading] = useState(true);

  const canManage = isAdminOrOfficer(currentUser);

  // Filters for Catalog
  const [search, setSearch] = useState('');
  const [filterProgram, setFilterProgram] = useState<'ALL' | 'THAI' | 'ENGLISH'>('ALL');
  const [filterDegree, setFilterDegree] = useState<string>('ALL');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [filterSemester, setFilterSemester] = useState<string>('ALL');
  const [selectedMajor, setSelectedMajor] = useState<string>('ALL');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('ALL');

  // Timetable 4-Dimensional Filters & View Mode
  const [ttYear, setTtYear] = useState<number>(1);
  const [ttDegree, setTtDegree] = useState<string>('BACHELOR');
  const [ttProgram, setTtProgram] = useState<'THAI' | 'ENGLISH'>('THAI');
  const [ttMajor, setTtMajor] = useState<string>('ALL');
  const [ttDay] = useState<number | 'ALL'>('ALL');
  const [ttViewMode, setTtViewMode] = useState<'MATRIX' | 'LIST'>('MATRIX');

  // Faculty View Filter
  const [facultySearch, setFacultySearch] = useState('');
  const [selectedInstructor] = useState<string>('ALL');

  // Pagination for Catalog
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modals
  const [modalMode, setModalMode] = useState<CourseModalMode>('NONE');
  const [targetCourse, setTargetCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<Partial<Course>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Import State
  const [importInputType, setImportInputType] = useState<'FILE' | 'TEXT'>('FILE');
  const [importRawText, setImportRawText] = useState('');
  const [importParsedCourses, setImportParsedCourses] = useState<Course[]>([]);
  const [importMode, setImportMode] = useState<'UPSERT' | 'APPEND'>('UPSERT');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, ttRes, instRes, setRes, authRes] = await Promise.all([
        fetch('/api/courses').then((r) => r.json()),
        fetch('/api/timetables').then((r) => r.json()),
        fetch('/api/timetables?action=instructors').then((r) => r.json()),
        fetch('/api/system-settings').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/auth').then((r) => r.json()).catch(() => ({ authenticated: false, user: null })),
      ]);

      if (cRes.success) setCourses(cRes.data);
      if (ttRes.success) setTimetables(ttRes.data);
      if (instRes.success) setInstructors(instRes.data);
      if (setRes && setRes.success) setSettings(setRes.data);
      if (authRes && authRes.authenticated && authRes.user) {
        setCurrentUser(authRes.user);
        saveAuthSession(authRes.user, true);
      } else {
        const localUser = getAuthUser();
        setCurrentUser(localUser);
      }
    } catch (e) {
      console.error('Failed to load courses data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Distinct academic years available in system
  const availableAcademicYears = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.academicYear) set.add(String(c.academicYear));
    });
    timetables.forEach((t) => {
      if (t.academicYear) set.add(String(t.academicYear));
    });
    if (set.size === 0) set.add('2569');
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [courses, timetables]);

  // Filtered courses for catalog
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchCode = c.courseCode?.toLowerCase().includes(q);
        const matchName = c.courseName?.toLowerCase().includes(q);
        const matchNameEn = c.courseNameEn?.toLowerCase().includes(q);
        const matchRoom = c.room?.toLowerCase().includes(q);
        const matchInst = c.instructor?.toLowerCase().includes(q);
        const matchMajor = c.major?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchNameEn && !matchRoom && !matchInst && !matchMajor) {
          return false;
        }
      }

      if (filterAcademicYear !== 'ALL' && c.academicYear && String(c.academicYear) !== filterAcademicYear) {
        return false;
      }

      if (filterProgram !== 'ALL' && c.programType !== filterProgram) {
        return false;
      }

      if (filterDegree !== 'ALL' && c.degreeLevel !== filterDegree) {
        return false;
      }

      if (filterYear !== 'ALL' && String(c.yearLevel) !== filterYear) {
        return false;
      }

      if (filterSemester !== 'ALL' && String(c.semester) !== filterSemester) {
        return false;
      }

      if (selectedMajor !== 'ALL' && c.major !== selectedMajor) {
        return false;
      }

      return true;
    });
  }, [courses, search, filterAcademicYear, filterProgram, filterDegree, filterYear, filterSemester, selectedMajor]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterAcademicYear, filterProgram, filterDegree, filterYear, filterSemester, selectedMajor]);

  // Paginated Catalog items
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage) || 1;
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const thaiCoursesCount = courses.filter((c) => c.programType === 'THAI').length;
  const engCoursesCount = courses.filter((c) => c.programType === 'ENGLISH').length;
  const uniqueInstructorsCount = useMemo(() => {
    const s = new Set<string>();
    courses.forEach((c) => {
      if (c.instructor) s.add(c.instructor);
    });
    return s.size;
  }, [courses]);

  // Faculty Teaching Loads grouping
  const facultyGrouped = useMemo(() => {
    const map = new Map<string, Course[]>();
    courses.forEach((c) => {
      const inst = c.instructor || 'ยังไม่ได้มอบหมายผู้สอน';
      if (!map.has(inst)) map.set(inst, []);
      map.get(inst)!.push(c);
    });

    let list = Array.from(map.entries()).map(([name, cList]) => ({
      instructor: name,
      courses: cList,
      totalCredits: cList.reduce((acc, curr) => acc + (Number(curr.credits) || 0), 0),
    }));

    if (facultySearch.trim()) {
      const q = facultySearch.toLowerCase();
      list = list.filter(
        (f) =>
          f.instructor.toLowerCase().includes(q) ||
          f.courses.some(
            (c) =>
              c.courseCode?.toLowerCase().includes(q) ||
              c.courseName?.toLowerCase().includes(q) ||
              c.courseNameEn?.toLowerCase().includes(q)
          )
      );
    }

    if (selectedInstructor !== 'ALL') {
      list = list.filter((f) => f.instructor === selectedInstructor);
    }

    return list.sort((a, b) => b.courses.length - a.courses.length);
  }, [courses, facultySearch, selectedInstructor]);

  // Open Create Modal
  const openCreateModal = () => {
    setFormData({
      courseCode: '',
      courseName: '',
      courseNameEn: '',
      credits: 3,
      programType: 'THAI',
      degreeLevel: 'ปริญญาตรี',
      faculty: 'คณะพุทธศาสตร์',
      department: 'ภาควิชาพระพุทธศาสนา',
      major: 'พระพุทธศาสนา',
      yearLevel: 1,
      section: '1',
      academicYear: '2569',
      semester: 1,
      room: 'D 516/1',
      dayOfWeek: 1,
      startTime: '09.00',
      endTime: '11.30',
      instructor: '',
      description: '',
    });
    setModalMode('CREATE');
  };

  const openEditModal = (c: Course) => {
    setTargetCourse(c);
    setFormData({ ...c });
    setModalMode('EDIT');
  };

  const openViewModal = (c: Course) => {
    setTargetCourse(c);
    setModalMode('VIEW');
  };

  const openDeleteModal = (c: Course) => {
    setTargetCourse(c);
    setModalMode('DELETE');
  };

  const openImportModal = () => {
    setImportRawText('');
    setImportParsedCourses([]);
    setImportInputType('FILE');
    setImportMode('UPSERT');
    setModalMode('IMPORT');
  };

  // Handle Export CSV (compatible with Excel via UTF-8 BOM)
  const handleExportCSV = () => {
    const listToExport = filteredCourses.length > 0 ? filteredCourses : courses;
    const headers = [
      'รหัสวิชา',
      'ชื่อรายวิชา (ไทย)',
      'ชื่อรายวิชา (อังกฤษ)',
      'หน่วยกิต',
      'หลักสูตร',
      'ระดับหลักสูตร',
      'สาขาวิชา',
      'ชั้นปี',
      'ตอนเรียน (Section)',
      'ปีการศึกษา',
      'ภาคเรียน',
      'อาจารย์ผู้สอน',
      'วันเรียน',
      'เวลาเริ่ม',
      'เวลาสิ้นสุด',
      'ห้องเรียน',
      'คำอธิบายรายวิชา',
    ];

    const rows = listToExport.map((c) => {
      const dayLabel = DAYS_OF_WEEK.find((d) => d.id === c.dayOfWeek)?.label || '';
      return [
        c.courseCode,
        c.courseName,
        c.courseNameEn || '',
        String(c.credits || 3),
        c.programType === 'ENGLISH' ? 'ENGLISH' : 'THAI',
        c.degreeLevel || 'ปริญญาตรี',
        c.major || '',
        String(c.yearLevel || 1),
        c.section || '1',
        c.academicYear || '2569',
        String(c.semester || 1),
        c.instructor || '',
        dayLabel,
        c.startTime || '',
        c.endTime || '',
        c.room || '',
        c.description || '',
      ];
    });

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((r) =>
          r.map((val) => `"${(val || '').replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MCU_courses_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`ส่งออกข้อมูล ${listToExport.length} รายการเป็นไฟล์ CSV เรียบร้อย`);
  };

  // Execute Bulk Import
  const handleExecuteImport = async () => {
    if (importParsedCourses.length === 0) {
      alert('ไม่พบรายวิชาที่ถูกต้องในการนำเข้า');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          mode: importMode,
          courses: importParsedCourses,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          `นำเข้าสำเร็จ: เพิ่ม ${data.added} รายการ, อัปเดต ${data.updated} รายการ`
        );
        setModalMode('NONE');
        loadData();
      } else {
        alert('เกิดข้อผิดพลาดในการนำเข้า: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Save (Create or Edit)
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseCode || !formData.courseName) {
      alert('กรุณากรอกรหัสวิชาและชื่อรายวิชา');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'CREATE') {
        const res = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setCourses((prev) => [data.data, ...prev]);
          showToast(`เพิ่มรายวิชา ${data.data.courseCode} สำเร็จ`);
          setModalMode('NONE');
        } else {
          alert('เกิดข้อผิดพลาด: ' + data.error);
        }
      } else if (modalMode === 'EDIT' && targetCourse) {
        const res = await fetch('/api/courses', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: targetCourse.id,
            courseCode: targetCourse.courseCode,
            updates: formData,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setCourses((prev) =>
            prev.map((item) =>
              (targetCourse.id && item.id === targetCourse.id) ||
              item.courseCode === targetCourse.courseCode
                ? data.data
                : item
            )
          );
          showToast(`แก้ไขข้อมูลรายวิชา ${data.data.courseCode} สำเร็จ`);
          setModalMode('NONE');
        } else {
          alert('เกิดข้อผิดพลาด: ' + data.error);
        }
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete
  const handleDeleteCourse = async () => {
    if (!targetCourse) return;
    setSubmitting(true);
    try {
      const param = targetCourse.id
        ? `id=${targetCourse.id}`
        : `courseCode=${targetCourse.courseCode}`;
      const res = await fetch(`/api/courses?${param}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCourses((prev) =>
          prev.filter(
            (item) =>
              item.id !== targetCourse.id && item.courseCode !== targetCourse.courseCode
          )
        );
        showToast(`ลบรายวิชา ${targetCourse.courseCode} สำเร็จ`);
        setModalMode('NONE');
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl font-medium animate-in fade-in slide-in-from-top-4 print:hidden">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <School className="w-4 h-4" />
            <span>ระบบบริการการศึกษา • มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            ทะเบียนรายวิชาและตารางสอน
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            จัดการฐานข้อมูลรายวิชา หลักสูตรภาษาไทย / นานาชาติ หน่วยกิต ระดับการศึกษา และมอบหมายภาระงานสอนอาจารย์
          </p>
        </div>

        {/* Tab switcher & Actions (Add, Import, Export) */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Tab buttons (Responsive Touch Scroll) */}
          <div className="w-full sm:w-auto flex items-center p-1 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth text-xs sm:text-sm font-semibold border border-slate-200">
            <button
              onClick={() => setActiveTab('CATALOG')}
              className={`flex-1 sm:flex-initial whitespace-nowrap shrink-0 min-h-[40px] px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'CATALOG'
                  ? 'bg-white text-blue-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>ทะเบียนวิชา ({courses.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('TIMETABLE')}
              className={`flex-1 sm:flex-initial whitespace-nowrap shrink-0 min-h-[40px] px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'TIMETABLE'
                  ? 'bg-white text-blue-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>ตารางเรียน</span>
            </button>
            {canManage && (
              <button
                onClick={() => setActiveTab('FACULTY')}
                className={`flex-1 sm:flex-initial whitespace-nowrap shrink-0 min-h-[40px] px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'FACULTY'
                    ? 'bg-white text-blue-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4 text-purple-600" />
                <span>ภาระงานสอน</span>
              </button>
            )}
          </div>

          {/* Action buttons (Admin & Officer Only) */}
          {canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                title="ส่งออกรายวิชาทั้งหมดเป็นไฟล์ CSV/Excel"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 transition shadow-sm cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-emerald-600" />
                <span>Export CSV/Excel</span>
              </button>

              <button
                onClick={openImportModal}
                title="นำเข้ารายวิชาจากไฟล์ CSV หรือตาราง Excel"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs sm:text-sm font-semibold border border-purple-200 transition shadow-sm cursor-pointer"
              >
                <FileUp className="w-4 h-4 text-purple-600" />
                <span>Import CSV/Excel</span>
              </button>

              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition hover:shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มรายวิชา</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{courses.length}</div>
            <div className="text-xs text-slate-500">รายวิชาทั้งหมดในระบบ</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="text-xl">🇹🇭</span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{thaiCoursesCount}</div>
            <div className="text-xs text-slate-500">หลักสูตรภาคภาษาไทย</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{engCoursesCount}</div>
            <div className="text-xs text-slate-500">หลักสูตรภาษาอังกฤษ (EN)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{uniqueInstructorsCount}</div>
            <div className="text-xs text-slate-500">อาจารย์ผู้สอนในระบบ</div>
          </div>
        </div>
      </div>

      {/* Academic Year Selection Tabs (ตรวจดูย้อนหลัง / สลับปีการศึกษา) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-sm border border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-300">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-blue-200 font-semibold uppercase tracking-wider">
              ปีการศึกษา (Academic Year Selector)
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>
                {filterAcademicYear === 'ALL'
                  ? 'แสดงทุกปีการศึกษา (รวมประวัติตารางสอนย้อนหลัง)'
                  : `ปีการศึกษา ${filterAcademicYear} (ปัจจุบัน/ที่เลือก)`}
              </span>
              {filterAcademicYear !== 'ALL' && (
                <span className="text-[10px] bg-blue-500/40 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">
                  กำลังกรองข้อมูลปี {filterAcademicYear}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-black/20 rounded-xl backdrop-blur-sm">
          <button
            onClick={() => setFilterAcademicYear('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterAcademicYear === 'ALL'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            ทุกปี (ย้อนหลัง)
          </button>
          {availableAcademicYears.map((yr) => (
            <button
              key={yr}
              onClick={() => setFilterAcademicYear(yr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterAcademicYear === yr
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              ปีการศึกษา {yr}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center text-slate-500">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          กำลังโหลดฐานข้อมูลรายวิชาและตารางสอน...
        </div>
      ) : activeTab === 'CATALOG' || (!canManage && activeTab === 'FACULTY') ? (
        <CourseCatalogTab
          search={search}
          setSearch={setSearch}
          filterProgram={filterProgram}
          setFilterProgram={setFilterProgram}
          filterDegree={filterDegree}
          setFilterDegree={setFilterDegree}
          selectedMajor={selectedMajor}
          setSelectedMajor={setSelectedMajor}
          filterYear={filterYear}
          setFilterYear={setFilterYear}
          filterSemester={filterSemester}
          setFilterSemester={setFilterSemester}
          filteredCourses={filteredCourses}
          paginatedCourses={paginatedCourses}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onViewCourse={openViewModal}
          onEditCourse={openEditModal}
          onDeleteCourse={openDeleteModal}
          canManage={canManage}
        />
      ) : activeTab === 'TIMETABLE' ? (
        <CourseTimetableTab
          courses={courses}
          timetables={timetables}
          settings={settings}
          filterAcademicYear={filterAcademicYear}
          ttYear={ttYear}
          setTtYear={setTtYear}
          ttDegree={ttDegree}
          setTtDegree={setTtDegree}
          ttProgram={ttProgram}
          setTtProgram={setTtProgram}
          ttMajor={ttMajor}
          setTtMajor={setTtMajor}
          ttDay={ttDay}
          ttViewMode={ttViewMode}
          setTtViewMode={setTtViewMode}
        />
      ) : (
        <CourseFacultyTab
          facultySearch={facultySearch}
          setFacultySearch={setFacultySearch}
          facultyGrouped={facultyGrouped}
          onAssignCourseToInstructor={(instructorName) => {
            setFormData({
              courseCode: '',
              courseName: '',
              credits: 3,
              programType: 'THAI',
              degreeLevel: 'ปริญญาตรี',
              instructor: instructorName,
              academicYear: '2569',
              semester: 1,
            });
            setModalMode('CREATE');
          }}
          onEditCourse={openEditModal}
        />
      )}

      {/* Course Modals (Import, Create/Edit, View, Delete) */}
      <CourseModals
        modalMode={modalMode}
        setModalMode={setModalMode}
        targetCourse={targetCourse}
        formData={formData}
        setFormData={setFormData}
        instructors={instructors}
        submitting={submitting}
        onSaveCourse={handleSaveCourse}
        onDeleteCourse={handleDeleteCourse}
        importInputType={importInputType}
        setImportInputType={setImportInputType}
        importRawText={importRawText}
        setImportRawText={setImportRawText}
        importParsedCourses={importParsedCourses}
        setImportParsedCourses={setImportParsedCourses}
        importMode={importMode}
        setImportMode={setImportMode}
        onExecuteImport={handleExecuteImport}
        canManage={canManage}
      />
    </div>
  );
}
