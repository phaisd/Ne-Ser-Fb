'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  BookOpen,
  Clock,
  MapPin,
  User,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Eye,
  GraduationCap,
  Globe,
  Layers,
  Award,
  Sparkles,
  ChevronRight,
  School,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  FileSpreadsheet,
  FileUp,
  FileDown,
  FileText
} from 'lucide-react';

interface Course {
  id?: string;
  courseCode: string;
  courseName: string;
  courseNameEn?: string;
  credits: number;
  programType?: 'THAI' | 'ENGLISH' | 'BILINGUAL';
  degreeLevel?: string;
  faculty?: string;
  department?: string;
  major?: string;
  yearLevel?: number;
  section?: string;
  term?: string;
  academicYear?: string;
  semester?: number;
  room?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  instructor?: string;
  description?: string;
  status?: string;
  isActive?: boolean;
}

interface TimetableItem {
  academicYear: string;
  semester: number;
  yearLevel: number;
  timetableTitle: string;
  courseCode: string;
  courseName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  instructor?: string;
  periodLabel?: string;
}

const DAYS_OF_WEEK = [
  { id: 1, label: 'วันจันทร์', color: 'bg-yellow-500' },
  { id: 2, label: 'วันอังคาร', color: 'bg-pink-500' },
  { id: 3, label: 'วันพุธ', color: 'bg-emerald-500' },
  { id: 4, label: 'วันพฤหัสบดี', color: 'bg-orange-500' },
  { id: 5, label: 'วันศุกร์', color: 'bg-blue-500' },
  { id: 6, label: 'วันเสาร์', color: 'bg-purple-500' },
  { id: 7, label: 'วันอาทิตย์', color: 'bg-red-500' },
];

const DEGREE_LEVELS = ['ปริญญาตรี', 'ปริญญาโท', 'ปริญญาเอก', 'ประกาศนียบัตร'];
const MAJORS = [
  'พระพุทธศาสนา',
  'ศาสนาและปรัชญา',
  'วิปัสสนาภาวนา',
  'บาลีสันสกฤต',
  'พุทธจิตวิทยา',
  'สันติศึกษา',
];

// CSV Parser Helper
function parseCSVToCourses(rawText: string): Course[] {
  const text = rawText.trim();
  if (!text) return [];

  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' || char === "'") {
      if (inQuotes && next === char) {
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' && next === '\n') || char === '\n' || char === '\r') {
      if (!inQuotes) {
        lines.push(current);
        current = '';
        if (char === '\r' && next === '\n') i++;
      } else {
        current += '\n';
      }
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current);
  if (lines.length < 2) return [];

  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const delimiter = headerLine.includes('\t') ? '\t' : ',';

  const parseLine = (line: string): string[] => {
    const cols: string[] = [];
    let col = '';
    let inQ = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      const n = line[j + 1];
      if (c === '"') {
        if (inQ && n === '"') {
          col += '"';
          j++;
        } else {
          inQ = !inQ;
        }
      } else if (c === delimiter && !inQ) {
        cols.push(col.trim());
        col = '';
      } else {
        col += c;
      }
    }
    cols.push(col.trim());
    return cols;
  };

  const headers = parseLine(headerLine).map((h) => h.toLowerCase().replace(/[\s\-_]/g, ''));
  const parsedCourses: Course[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const obj: Record<string, string> = {};

    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });

    const code =
      obj['coursecode'] ||
      obj['รหัสวิชา'] ||
      obj['code'] ||
      obj['รหัส'] ||
      obj['subjectcode'] ||
      values[0] ||
      '';

    const name =
      obj['coursename'] ||
      obj['ชื่อรายวิชา'] ||
      obj['ชื่อรายวิชา(ไทย)'] ||
      obj['ชื่อวิชา'] ||
      obj['ชื่อวิชาไทย'] ||
      obj['name'] ||
      obj['nameth'] ||
      values[1] ||
      '';

    if (!code.trim() || !name.trim()) continue;

    const nameEn =
      obj['coursenameen'] ||
      obj['ชื่อรายวิชา(อังกฤษ)'] ||
      obj['ชื่อภาษาอังกฤษ'] ||
      obj['nameen'] ||
      obj['englishname'] ||
      '';

    const creditsRaw =
      obj['credits'] ||
      obj['หน่วยกิต'] ||
      obj['credit'] ||
      obj['หน่วยกิตรวม'] ||
      '3';
    const credits = parseInt(creditsRaw.replace(/[^0-9]/g, '') || '3', 10);

    const progRaw = (
      obj['programtype'] ||
      obj['หลักสูตร'] ||
      obj['program'] ||
      obj['หลักสูตร(thaiหรือenglish)'] ||
      ''
    ).toLowerCase();

    const isEnglish =
      progRaw.includes('en') ||
      progRaw.includes('eng') ||
      progRaw.includes('นานาชาติ') ||
      progRaw.includes('inter') ||
      obj['section'] === 'EN' ||
      /^[A-Za-z0-9\s:,-]+$/.test(name);

    const dayRaw = (obj['dayofweek'] || obj['วันเรียน'] || obj['วัน'] || '1').toLowerCase();
    let dayOfWeek = 1;
    if (dayRaw.includes('จันทร์') || dayRaw === '1' || dayRaw.includes('mon')) dayOfWeek = 1;
    else if (dayRaw.includes('อังคาร') || dayRaw === '2' || dayRaw.includes('tue')) dayOfWeek = 2;
    else if (dayRaw.includes('พุธ') || dayRaw === '3' || dayRaw.includes('wed')) dayOfWeek = 3;
    else if (dayRaw.includes('พฤหัส') || dayRaw === '4' || dayRaw.includes('thu')) dayOfWeek = 4;
    else if (dayRaw.includes('ศุกร์') || dayRaw === '5' || dayRaw.includes('fri')) dayOfWeek = 5;
    else if (dayRaw.includes('เสาร์') || dayRaw === '6' || dayRaw.includes('sat')) dayOfWeek = 6;
    else if (dayRaw.includes('อาทิตย์') || dayRaw === '7' || dayRaw.includes('sun')) dayOfWeek = 7;

    parsedCourses.push({
      courseCode: code.trim(),
      courseName: name.trim(),
      courseNameEn: nameEn.trim(),
      credits: credits || 3,
      programType: isEnglish ? 'ENGLISH' : 'THAI',
      degreeLevel: obj['degreelevel'] || obj['ระดับหลักสูตร'] || obj['ระดับการศึกษา'] || 'ปริญญาตรี',
      major: obj['major'] || obj['สาขาวิชา'] || obj['สาขา'] || 'พระพุทธศาสนา',
      yearLevel: parseInt(obj['yearlevel'] || obj['ชั้นปี'] || '1', 10) || 1,
      section: obj['section'] || obj['ตอนเรียน'] || obj['กลุ่ม'] || (isEnglish ? 'EN' : '1'),
      academicYear: obj['academicyear'] || obj['ปีการศึกษา'] || '2569',
      semester: parseInt(obj['semester'] || obj['ภาคเรียน'] || obj['เทอม'] || '1', 10) || 1,
      instructor: obj['instructor'] || obj['อาจารย์ผู้สอน'] || obj['ผู้สอน'] || '',
      room: obj['room'] || obj['ห้องเรียน'] || obj['ห้อง'] || '',
      dayOfWeek: dayOfWeek,
      startTime: obj['starttime'] || obj['เวลาเริ่ม'] || '09.00',
      endTime: obj['endtime'] || obj['เวลาสิ้นสุด'] || '11.30',
      description: obj['description'] || obj['คำอธิบายรายวิชา'] || '',
    });
  }

  return parsedCourses;
}

export default function CoursesPage() {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'TIMETABLE' | 'FACULTY'>('CATALOG');
  const [courses, setCourses] = useState<Course[]>([]);
  const [timetables, setTimetables] = useState<TimetableItem[]>([]);
  const [instructors, setInstructors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Catalog
  const [search, setSearch] = useState('');
  const [filterProgram, setFilterProgram] = useState<'ALL' | 'THAI' | 'ENGLISH'>('ALL');
  const [filterDegree, setFilterDegree] = useState<string>('ALL');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [filterSemester, setFilterSemester] = useState<string>('ALL');
  const [selectedMajor, setSelectedMajor] = useState<string>('ALL');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('ALL');

  // Timetable Filters
  const [ttYear, setTtYear] = useState<number>(1);
  const [ttDay, setTtDay] = useState<number | 'ALL'>('ALL');

  // Faculty View Filter
  const [facultySearch, setFacultySearch] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('ALL');

  // Pagination for Catalog
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modals
  const [modalMode, setModalMode] = useState<'NONE' | 'CREATE' | 'EDIT' | 'VIEW' | 'DELETE' | 'IMPORT'>('NONE');
  const [targetCourse, setTargetCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<Partial<Course>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Import State
  const [importInputType, setImportInputType] = useState<'FILE' | 'TEXT'>('FILE');
  const [importRawText, setImportRawText] = useState('');
  const [importParsedCourses, setImportParsedCourses] = useState<Course[]>([]);
  const [importMode, setImportMode] = useState<'UPSERT' | 'APPEND'>('UPSERT');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, ttRes, instRes] = await Promise.all([
        fetch('/api/courses').then((r) => r.json()),
        fetch('/api/timetables').then((r) => r.json()),
        fetch('/api/timetables?action=instructors').then((r) => r.json()),
      ]);

      if (cRes.success) setCourses(cRes.data);
      if (ttRes.success) setTimetables(ttRes.data);
      if (instRes.success) setInstructors(instRes.data);
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

  // Open Edit Modal
  const openEditModal = (c: Course) => {
    setTargetCourse(c);
    setFormData({ ...c });
    setModalMode('EDIT');
  };

  // Open View Modal
  const openViewModal = (c: Course) => {
    setTargetCourse(c);
    setModalMode('VIEW');
  };

  // Open Delete Modal
  const openDeleteModal = (c: Course) => {
    setTargetCourse(c);
    setModalMode('DELETE');
  };

  // Open Import Modal
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

  // Download Import Template
  const downloadSampleTemplate = () => {
    const headers = [
      'รหัสวิชา',
      'ชื่อรายวิชา (ไทย)',
      'ชื่อรายวิชา (อังกฤษ)',
      'หน่วยกิต',
      'หลักสูตร (THAI หรือ ENGLISH)',
      'ระดับหลักสูตร (ปริญญาตรี/ปริญญาโท)',
      'สาขาวิชา',
      'ชั้นปี',
      'ตอนเรียน (Section)',
      'ปีการศึกษา',
      'ภาคเรียน',
      'อาจารย์ผู้สอน',
      'วันเรียน (วันจันทร์-วันอาทิตย์)',
      'เวลาเริ่ม',
      'เวลาสิ้นสุด',
      'ห้องเรียน',
      'คำอธิบายรายวิชา',
    ];

    const sampleRows = [
      [
        '000 113',
        'ตรรกศาสตร์เบื้องต้น',
        'Introduction to Logic',
        '3',
        'THAI',
        'ปริญญาตรี',
        'ศาสนาและปรัชญา',
        '2',
        '1',
        '2569',
        '2',
        'พระมหาดวงเด่น ฐิตญาโณ, ผศ.ดร.',
        'วันจันทร์',
        '12.30',
        '15.10',
        'อาคารเรียนรวม ชั้น 5 ห้อง D 516/2',
        'ศึกษาหลักการและกระบวนการคิดตามหลักตรรกศาสตร์',
      ],
      [
        '000 113',
        'Introduction to Logic',
        'Introduction to Logic',
        '3',
        'ENGLISH',
        'ปริญญาตรี',
        'พระพุทธศาสนา',
        '2',
        'EN',
        '2569',
        '2',
        'Ven. Dr. Dharma Priya Bhikkhu* / Phrasamu Kriengsak Sirisakko, Ph.D.',
        'วันพุธ',
        '09.00',
        '11.30',
        'Room No. D 519-520',
        'Basic principles of logic and reasoning in English medium',
      ],
    ];

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...sampleRows.map((r) =>
          r.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle File Input for Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportRawText(text);
      const parsed = parseCSVToCourses(text);
      setImportParsedCourses(parsed);
    };
    reader.readAsText(file);
  };

  // Handle Paste Text for Import
  const handleTextChange = (text: string) => {
    setImportRawText(text);
    const parsed = parseCSVToCourses(text);
    setImportParsedCourses(parsed);
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
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl font-medium animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
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
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Tab buttons */}
          <div className="flex p-1 bg-slate-100 rounded-xl text-sm font-semibold border border-slate-200">
            <button
              onClick={() => setActiveTab('CATALOG')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs sm:text-sm ${
                activeTab === 'CATALOG'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>ทะเบียนวิชา ({courses.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('TIMETABLE')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs sm:text-sm ${
                activeTab === 'TIMETABLE'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>ตารางเรียน</span>
            </button>
            <button
              onClick={() => setActiveTab('FACULTY')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs sm:text-sm ${
                activeTab === 'FACULTY'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>ภาระงานสอน</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              title="ส่งออกรายวิชาทั้งหมดเป็นไฟล์ CSV/Excel"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 transition shadow-sm"
            >
              <FileDown className="w-4 h-4 text-emerald-600" />
              <span>Export CSV/Excel</span>
            </button>

            <button
              onClick={openImportModal}
              title="นำเข้ารายวิชาจากไฟล์ CSV หรือตาราง Excel"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs sm:text-sm font-semibold border border-purple-200 transition shadow-sm"
            >
              <FileUp className="w-4 h-4 text-purple-600" />
              <span>Import CSV/Excel</span>
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มรายวิชา</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-sm border border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-300">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-blue-200 font-semibold uppercase tracking-wider">
              ปีการศึกษา (Academic Year Selector)
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{filterAcademicYear === 'ALL'
                ? 'แสดงทุกปีการศึกษา (รวมประวัติตารางสอนย้อนหลัง)'
                : `ปีการศึกษา ${filterAcademicYear} (ปัจจุบัน/ที่เลือก)`}</span>
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
      ) : activeTab === 'CATALOG' ? (
        /* TAB 1: COURSE REGISTRY & CATALOG */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหารหัสวิชา (เช่น 000 113), ชื่อวิชาไทย/อังกฤษ, อาจารย์ผู้สอน, ห้องเรียน..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Program Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
                <button
                  onClick={() => setFilterProgram('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filterProgram === 'ALL'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทุกหลักสูตร
                </button>
                <button
                  onClick={() => setFilterProgram('THAI')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                    filterProgram === 'THAI'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🇹🇭</span> ภาคภาษาไทย
                </button>
                <button
                  onClick={() => setFilterProgram('ENGLISH')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                    filterProgram === 'ENGLISH'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> ภาคภาษาอังกฤษ
                </button>
              </div>
            </div>

            {/* Secondary Filter Row */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> กรองเพิ่มเติม:
              </span>

              {/* Degree Level */}
              <select
                value={filterDegree}
                onChange={(e) => setFilterDegree(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">ระดับการศึกษา: ทั้งหมด</option>
                {DEGREE_LEVELS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Major */}
              <select
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">สาขาวิชา: ทั้งหมด</option>
                {MAJORS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Level */}
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">ชั้นปี: ทั้งหมด</option>
                <option value="1">ชั้นปีที่ 1</option>
                <option value="2">ชั้นปีที่ 2</option>
                <option value="3">ชั้นปีที่ 3</option>
                <option value="4">ชั้นปีที่ 4</option>
              </select>

              {/* Semester */}
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">ภาคการศึกษา: ทั้งหมด</option>
                <option value="1">ภาคเรียนที่ 1</option>
                <option value="2">ภาคเรียนที่ 2</option>
              </select>

              {(search ||
                filterProgram !== 'ALL' ||
                filterDegree !== 'ALL' ||
                filterYear !== 'ALL' ||
                filterSemester !== 'ALL' ||
                selectedMajor !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setFilterProgram('ALL');
                    setFilterDegree('ALL');
                    setFilterYear('ALL');
                    setFilterSemester('ALL');
                    setSelectedMajor('ALL');
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  ล้างตัวกรอง
                </button>
              )}

              <span className="ml-auto text-slate-400 font-medium">
                พบ {filteredCourses.length} รายวิชา
              </span>
            </div>
          </div>

          {/* Courses Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">รหัสวิชา</th>
                    <th className="px-5 py-3.5">ชื่อรายวิชา (ไทย / อังกฤษ)</th>
                    <th className="px-5 py-3.5">หลักสูตร & ระดับ</th>
                    <th className="px-5 py-3.5 text-center">หน่วยกิต</th>
                    <th className="px-5 py-3.5">อาจารย์ผู้สอน</th>
                    <th className="px-5 py-3.5">วัน-เวลา & ห้องเรียน</th>
                    <th className="px-5 py-3.5 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCourses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        ไม่พบข้อมูลรายวิชาที่ตรงกับเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  ) : (
                    paginatedCourses.map((c, i) => {
                      const isEn = c.programType === 'ENGLISH' || c.section === 'EN';
                      const dayObj = DAYS_OF_WEEK.find((d) => d.id === c.dayOfWeek);

                      return (
                        <tr
                          key={`${c.id || c.courseCode}-${c.section || '1'}-${i}`}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          {/* Course Code */}
                          <td className="px-5 py-4 font-mono font-bold">
                            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs border border-blue-100">
                              {c.courseCode}
                            </span>
                            {c.section && (
                              <span className="ml-1.5 text-[11px] text-slate-400 font-normal">
                                Sec {c.section}
                              </span>
                            )}
                          </td>

                          {/* Course Names */}
                          <td className="px-5 py-4 max-w-xs">
                            <div className="font-bold text-slate-900 leading-snug">
                              {c.courseName}
                            </div>
                            {c.courseNameEn && (
                              <div className="text-xs text-slate-400 font-sans mt-0.5">
                                {c.courseNameEn}
                              </div>
                            )}
                            {c.major && (
                              <span className="inline-block mt-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                สาขา{c.major}
                              </span>
                            )}
                          </td>

                          {/* Program & Degree */}
                          <td className="px-5 py-4 space-y-1">
                            <div>
                              {isEn ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  <Globe className="w-3 h-3" />
                                  หลักสูตรนานาชาติ (EN)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span>🇹🇭</span>
                                  หลักสูตรภาคไทย
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                              <span>{c.degreeLevel || 'ปริญญาตรี'}</span>
                              {c.yearLevel && (
                                <span className="text-slate-400 font-normal">
                                  (ปี {c.yearLevel})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Credits */}
                          <td className="px-5 py-4 text-center font-bold text-slate-800">
                            <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-xs">
                              {c.credits} หน่วยกิต
                            </span>
                          </td>

                          {/* Instructor */}
                          <td className="px-5 py-4 max-w-[200px]">
                            {c.instructor ? (
                              <div className="flex items-start gap-1.5 text-xs text-slate-700">
                                <User className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{c.instructor}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                ยังไม่ระบุผู้สอน
                              </span>
                            )}
                          </td>

                          {/* Schedule & Room */}
                          <td className="px-5 py-4 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              {dayObj && (
                                <span
                                  className={`w-2 h-2 rounded-full ${dayObj.color} shrink-0`}
                                />
                              )}
                              <span>{dayObj ? dayObj.label : 'ไม่ระบุวัน'}</span>
                              {c.startTime && c.endTime && (
                                <span className="text-slate-500">
                                  ({c.startTime} - {c.endTime} น.)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-slate-500">
                              <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                              <span className="line-clamp-1">{c.room || 'ไม่ระบุห้อง'}</span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => openViewModal(c)}
                              title="ดูรายละเอียด"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(c)}
                              title="แก้ไขรายวิชา"
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(c)}
                              title="ลบรายวิชา"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 font-medium">
                  แสดง {(currentPage - 1) * itemsPerPage + 1} -{' '}
                  {Math.min(currentPage * itemsPerPage, filteredCourses.length)} จาก{' '}
                  {filteredCourses.length} รายการ
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 font-semibold text-slate-700">
                    หน้า {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'TIMETABLE' ? (
        /* TAB 2: TIMETABLE VIEW */
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
              <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>เลือกระดับชั้นปี:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((y) => (
                  <button
                    key={y}
                    onClick={() => setTtYear(y)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      ttYear === y
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ชั้นปีที่ {y}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-2">กรองวันในสัปดาห์:</span>
              <button
                onClick={() => setTtDay('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  ttDay === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทุกวัน
              </button>
              {DAYS_OF_WEEK.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setTtDay(d.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    ttDay === d.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timetable Cards */}
          {timetables.filter(
            (t) =>
              t.yearLevel === ttYear &&
              (ttDay === 'ALL' || t.dayOfWeek === ttDay) &&
              (filterAcademicYear === 'ALL' || !t.academicYear || String(t.academicYear) === filterAcademicYear)
          ).length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
              ไม่มีตารางเรียนสำหรับเงื่อนไขที่เลือก (ปีการศึกษา {filterAcademicYear !== 'ALL' ? filterAcademicYear : 'ทั้งหมด'} ชั้นปีที่ {ttYear})
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timetables
                .filter(
                  (t) =>
                    t.yearLevel === ttYear &&
                    (ttDay === 'ALL' || t.dayOfWeek === ttDay) &&
                    (filterAcademicYear === 'ALL' || !t.academicYear || String(t.academicYear) === filterAcademicYear)
                )
                .map((item, idx) => {
                  const dayObj =
                    DAYS_OF_WEEK.find((d) => d.id === item.dayOfWeek) || DAYS_OF_WEEK[0];
                  return (
                    <div
                      key={idx}
                      className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                          <span className={`w-2 h-2 rounded-full ${dayObj.color}`} />
                          {dayObj.label}
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {item.courseCode}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 leading-snug">
                          {item.courseName}
                        </h4>
                        {item.timetableTitle && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                            {item.timetableTitle}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span>เวลา {item.startTime} - {item.endTime} น.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          <span>{item.room || 'ไม่ระบุห้อง'}</span>
                        </div>
                        {item.instructor && (
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="line-clamp-1">{item.instructor}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        /* TAB 3: FACULTY TEACHING LOADS & ASSIGNMENT */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่ออาจารย์ผู้สอน หรือรหัสวิชาที่รับผิดชอบ..."
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="text-xs text-slate-500 shrink-0">
              พบอาจารย์ผู้สอน {facultyGrouped.length} ท่าน
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facultyGrouped.map((f, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex items-start justify-between gap-3 border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {f.instructor}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        รับผิดชอบ {f.courses.length} รายวิชา • รวม {f.totalCredits} หน่วยกิต
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFormData({
                        courseCode: '',
                        courseName: '',
                        credits: 3,
                        programType: 'THAI',
                        degreeLevel: 'ปริญญาตรี',
                        instructor: f.instructor,
                        academicYear: '2569',
                        semester: 1,
                      });
                      setModalMode('CREATE');
                    }}
                    className="text-xs px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold transition shrink-0"
                  >
                    + มอบหมายวิชาสอน
                  </button>
                </div>

                {/* Course list under instructor */}
                <div className="space-y-2">
                  {f.courses.map((c, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            {c.courseCode}
                          </span>
                          <span className="truncate">{c.courseName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>
                            {c.programType === 'ENGLISH' ? '🌐 ภาษาอังกฤษ' : '🇹🇭 ภาษาไทย'}
                          </span>
                          <span>•</span>
                          <span>{c.credits} หน่วยกิต</span>
                          {c.room && (
                            <>
                              <span>•</span>
                              <span>ห้อง {c.room}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1 text-slate-400 hover:text-amber-600 rounded"
                          title="แก้ไขวิชานี้"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: IMPORT CSV / EXCEL */}
      {modalMode === 'IMPORT' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-start justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    นำเข้าข้อมูลรายวิชา (Import CSV / Excel)
                  </h3>
                  <p className="text-xs text-slate-500">
                    อัปโหลดไฟล์ CSV หรือคัดลอกตารางจาก Excel มาวางเพื่อนำเข้าสู่ฐานข้อมูลระบบ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalMode('NONE')}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download Card */}
            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>ยังไม่มีรูปแบบตาราง?</span>
                </div>
                <p className="text-blue-700">
                  ดาวน์โหลดไฟล์ต้นแบบตัวอย่าง CSV (เปิดใน Excel ได้ทันที) เพื่อกรอกข้อมูล
                </p>
              </div>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shrink-0 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลดแม่แบบ CSV</span>
              </button>
            </div>

            {/* Input Type Selector */}
            <div className="space-y-3">
              <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setImportInputType('FILE')}
                  className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    importInputType === 'FILE'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileUp className="w-4 h-4 text-blue-600" />
                  <span>เลือกไฟล์ (.csv, .txt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportInputType('TEXT')}
                  className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    importInputType === 'TEXT'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>คัดลอกตารางจาก Excel มาวาง</span>
                </button>
              </div>

              {importInputType === 'FILE' ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition hover:bg-blue-50/20 space-y-2"
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                  </div>
                  <div className="text-xs text-slate-400">
                    รองรับไฟล์ .csv (UTF-8) หรือไฟล์ข้อความที่คั่นด้วยจุลภาค
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .txt, .tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    วางข้อมูล CSV หรือคัดลอกจาก Excel (Ctrl+V):
                  </label>
                  <textarea
                    rows={6}
                    placeholder={`รหัสวิชา,ชื่อรายวิชา (ไทย),ชื่อรายวิชา (อังกฤษ),หน่วยกิต,หลักสูตร,อาจารย์ผู้สอน\n000 113,ตรรกศาสตร์เบื้องต้น,Introduction to Logic,3,THAI,พระมหาดวงเด่น ฐิตญาโณ`}
                    value={importRawText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Import Mode Options */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700">โหมดการนำเข้าข้อมูล:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                    importMode === 'UPSERT'
                      ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'UPSERT'}
                    onChange={() => setImportMode('UPSERT')}
                    className="mt-0.5"
                  />
                  <div>
                    <div>อัปเดตข้อมูลเดิม & เพิ่มใหม่ (Upsert)</div>
                    <div className="text-[11px] font-normal text-slate-500">
                      หากมีรหัสวิชาเดิมอยู่แล้วจะเขียนทับข้อมูลใหม่ (แนะนำ)
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                    importMode === 'APPEND'
                      ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'APPEND'}
                    onChange={() => setImportMode('APPEND')}
                    className="mt-0.5"
                  />
                  <div>
                    <div>เพิ่มต่อท้ายทั้งหมด (Append Only)</div>
                    <div className="text-[11px] font-normal text-slate-500">
                      เพิ่มทุกแถวเป็นรายการใหม่โดยไม่ตรวจวิชาซ้ำ
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Parsed Preview Table */}
            {importParsedCourses.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    ตรวจพบ {importParsedCourses.length} รายวิชาที่พร้อมนำเข้า
                  </span>
                  <span className="text-slate-400 font-normal">
                    (แสดงตัวอย่าง 5 รายการแรก)
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs max-h-48 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase border-b">
                      <tr>
                        <th className="px-3 py-2">รหัสวิชา</th>
                        <th className="px-3 py-2">ชื่อรายวิชา</th>
                        <th className="px-3 py-2">หลักสูตร</th>
                        <th className="px-3 py-2">หน่วยกิต</th>
                        <th className="px-3 py-2">อาจารย์ผู้สอน</th>
                        <th className="px-3 py-2">ห้องเรียน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importParsedCourses.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono font-bold text-blue-600">
                            {row.courseCode}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-800">
                            <div>{row.courseName}</div>
                            {row.courseNameEn && (
                              <div className="text-[10px] text-slate-400">{row.courseNameEn}</div>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row.programType === 'ENGLISH'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {row.programType === 'ENGLISH' ? '🌐 EN' : '🇹🇭 TH'}
                            </span>
                          </td>
                          <td className="px-3 py-2">{row.credits} นก.</td>
                          <td className="px-3 py-2 truncate max-w-[120px]">
                            {row.instructor || '-'}
                          </td>
                          <td className="px-3 py-2">{row.room || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalMode('NONE')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={submitting || importParsedCourses.length === 0}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-500/20 transition disabled:opacity-50 flex items-center gap-2"
              >
                <FileUp className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'กำลังนำเข้าข้อมูล...'
                    : `ยืนยันนำเข้าข้อมูล (${importParsedCourses.length} รายการ)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD OR EDIT COURSE */}
      {(modalMode === 'CREATE' || modalMode === 'EDIT') && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  {modalMode === 'CREATE' ? (
                    <Plus className="w-5 h-5" />
                  ) : (
                    <Edit2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {modalMode === 'CREATE'
                      ? 'เพิ่มทะเบียนรายวิชาใหม่'
                      : `แก้ไขข้อมูลรายวิชา: ${targetCourse?.courseCode}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    กรอกข้อมูลหลักสูตร หน่วยกิต และรายละเอียดตารางสอนเพื่อดึงเข้าตารางสอนอาจารย์
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalMode('NONE')}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-6">
              {/* SECTION 1: ข้อมูลทั่วไปรายวิชา */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  1. ข้อมูลพื้นฐานรายวิชา
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      รหัสวิชา (Course Code) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น 000 113"
                      value={formData.courseCode || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, courseCode: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      จำนวนหน่วยกิต (Credits) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={12}
                      placeholder="3"
                      value={formData.credits || 3}
                      onChange={(e) =>
                        setFormData({ ...formData, credits: parseInt(e.target.value, 10) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ตอนเรียน / Section
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น 1 หรือ EN"
                      value={formData.section || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, section: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อรายวิชา (ภาษาไทย) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น ตรรกศาสตร์เบื้องต้น"
                      value={formData.courseName || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, courseName: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อรายวิชา (ภาษาอังกฤษ)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น Introduction to Logic"
                      value={formData.courseNameEn || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, courseNameEn: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: หลักสูตรและระดับการศึกษา */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  2. หลักสูตรและระดับการศึกษา
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ประเภทหลักสูตร <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.programType || 'THAI'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          programType: e.target.value as any,
                          section:
                            e.target.value === 'ENGLISH' && (!formData.section || formData.section === '1')
                              ? 'EN'
                              : formData.section,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="THAI">🇹🇭 หลักสูตรภาคภาษาไทย (Thai Program)</option>
                      <option value="ENGLISH">🌐 หลักสูตรภาคภาษาอังกฤษ (English / International)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ระดับหลักสูตร (Degree Level)
                    </label>
                    <select
                      value={formData.degreeLevel || 'ปริญญาตรี'}
                      onChange={(e) =>
                        setFormData({ ...formData, degreeLevel: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {DEGREE_LEVELS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      สาขาวิชา (Major)
                    </label>
                    <input
                      type="text"
                      list="major-list"
                      placeholder="เช่น พระพุทธศาสนา, ศาสนาและปรัชญา"
                      value={formData.major || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, major: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <datalist id="major-list">
                      {MAJORS.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ระดับชั้นปีที่กำหนด (Year Level)
                    </label>
                    <select
                      value={formData.yearLevel || 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          yearLevel: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value={1}>ชั้นปีที่ 1</option>
                      <option value={2}>ชั้นปีที่ 2</option>
                      <option value={3}>ชั้นปีที่ 3</option>
                      <option value={4}>ชั้นปีที่ 4</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: อาจารย์ผู้สอนและตารางสอน */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  3. อาจารย์ผู้สอนและตารางสอน (เพื่อดึงเข้าตารางสอน)
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อาจารย์ผู้สอน / ผู้รับผิดชอบรายวิชา (Instructor)
                  </label>
                  <input
                    type="text"
                    list="instructor-list"
                    placeholder="พิมพ์ชื่ออาจารย์ผู้สอน หรือเลือกจากรายการที่มีอยู่..."
                    value={formData.instructor || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, instructor: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <datalist id="instructor-list">
                    {instructors.map((inst, idx) => (
                      <option key={idx} value={inst} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ปีการศึกษา
                    </label>
                    <input
                      type="text"
                      placeholder="2569"
                      value={formData.academicYear || '2569'}
                      onChange={(e) =>
                        setFormData({ ...formData, academicYear: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ภาคการศึกษา (Semester)
                    </label>
                    <select
                      value={formData.semester || 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          semester: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                    >
                      <option value={1}>ภาคเรียนที่ 1</option>
                      <option value={2}>ภาคเรียนที่ 2</option>
                      <option value={3}>ภาคฤดูร้อน</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ห้องเรียน (Room)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น D 516/1"
                      value={formData.room || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, room: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      วันที่เรียน
                    </label>
                    <select
                      value={formData.dayOfWeek || 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dayOfWeek: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เวลาเริ่ม
                    </label>
                    <input
                      type="text"
                      placeholder="09.00"
                      value={formData.startTime || '09.00'}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เวลาสิ้นสุด
                    </label>
                    <input
                      type="text"
                      placeholder="11.30"
                      value={formData.endTime || '11.30'}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    คำอธิบายรายวิชา (สังเขป)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ระบุวัตถุประสงค์ คำอธิบายรายวิชา หรือข้อกำหนดอื่น ๆ..."
                    value={formData.description || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode('NONE')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  {submitting
                    ? 'กำลังบันทึกข้อมูล...'
                    : modalMode === 'CREATE'
                    ? 'บันทึกเพิ่มรายวิชา'
                    : 'บันทึกการแก้ไขรายวิชา'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW COURSE DETAILS */}
      {modalMode === 'VIEW' && targetCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                  {targetCourse.courseCode}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2 leading-snug">
                  {targetCourse.courseName}
                </h3>
                {targetCourse.courseNameEn && (
                  <p className="text-sm text-slate-400 mt-0.5">{targetCourse.courseNameEn}</p>
                )}
              </div>
              <button
                onClick={() => setModalMode('NONE')}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium">ประเภทหลักสูตร:</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {targetCourse.programType === 'ENGLISH'
                    ? '🌐 หลักสูตรภาคภาษาอังกฤษ (EN)'
                    : '🇹🇭 หลักสูตรภาคภาษาไทย'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium">ระดับหลักสูตร:</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {targetCourse.degreeLevel || 'ปริญญาตรี'}{' '}
                  {targetCourse.yearLevel && `(ปี ${targetCourse.yearLevel})`}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium">หน่วยกิต:</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {targetCourse.credits} หน่วยกิต
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 font-medium">สาขาวิชา:</span>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {targetCourse.major || 'พระพุทธศาสนา'}
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2 text-xs">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                อาจารย์ผู้รับผิดชอบรายวิชา:
              </div>
              <div className="text-emerald-800 font-semibold pl-5 text-sm">
                {targetCourse.instructor || 'ยังไม่ได้มอบหมายผู้สอน'}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                ตารางเวลาเรียนและห้องเรียน:
              </div>
              <div className="pl-5 space-y-1 text-slate-600">
                <div>
                  วัน:{' '}
                  <span className="font-semibold text-slate-800">
                    {DAYS_OF_WEEK.find((d) => d.id === targetCourse.dayOfWeek)?.label ||
                      'ไม่ระบุวัน'}
                  </span>{' '}
                  เวลา:{' '}
                  <span className="font-mono font-semibold text-slate-800">
                    {targetCourse.startTime || '-'} - {targetCourse.endTime || '-'} น.
                  </span>
                </div>
                <div>
                  ห้องเรียน:{' '}
                  <span className="font-semibold text-slate-800">
                    {targetCourse.room || 'ไม่ระบุห้อง'}
                  </span>
                </div>
                <div>
                  ปีการศึกษา / ภาคเรียน:{' '}
                  <span className="font-semibold text-slate-800">
                    {targetCourse.academicYear || '2569'} / ภาคเรียนที่{' '}
                    {targetCourse.semester || 1} (Sec {targetCourse.section || '1'})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setFormData({ ...targetCourse });
                  setModalMode('EDIT');
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                แก้ไขรายวิชานี้
              </button>
              <button
                onClick={() => setModalMode('NONE')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM DELETE */}
      {modalMode === 'DELETE' && targetCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">ยืนยันการลบรายวิชา</h3>
                <p className="text-xs text-slate-500">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-1">
              <div className="font-mono font-bold text-blue-600">
                {targetCourse.courseCode} (Sec {targetCourse.section || '1'})
              </div>
              <div className="font-bold text-slate-800">{targetCourse.courseName}</div>
              {targetCourse.courseNameEn && (
                <div className="text-slate-400">{targetCourse.courseNameEn}</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setModalMode('NONE')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteCourse}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-500/20 transition disabled:opacity-50"
              >
                {submitting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
