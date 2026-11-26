'use client';

import { useState, useMemo } from 'react';
import { Course } from '@/types';
import { downloadCsvFile } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error';

export interface UseAdminCoursesOptions {
  coursesList: Course[];
  setCoursesList?: React.Dispatch<React.SetStateAction<Course[]>>;
  onRefreshCourses?: () => void;
  setActionSuccess?: (msg: string | null) => void;
}

export function useAdminCourses({
  coursesList,
  setCoursesList,
  onRefreshCourses,
  setActionSuccess,
}: UseAdminCoursesOptions) {
  // Filter states
  const [courseSearch, setCourseSearch] = useState('');
  const [courseProgramFilter, setCourseProgramFilter] = useState<'ALL' | 'THAI' | 'ENGLISH'>('ALL');
  const [courseDegreeFilter, setCourseDegreeFilter] = useState<string>('ALL');

  // Editing state
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Modal / Menu states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return coursesList.filter((c) => {
      if (courseProgramFilter !== 'ALL') {
        if (courseProgramFilter === 'ENGLISH' && c.programType !== 'ENGLISH') return false;
        if (courseProgramFilter === 'THAI' && c.programType === 'ENGLISH') return false;
      }
      if (courseDegreeFilter !== 'ALL' && c.degreeLevel !== courseDegreeFilter) return false;
      if (courseSearch.trim()) {
        const q = courseSearch.toLowerCase();
        return (
          c.courseCode?.toLowerCase().includes(q) ||
          c.courseName?.toLowerCase().includes(q) ||
          c.courseNameEn?.toLowerCase().includes(q) ||
          c.instructor?.toLowerCase().includes(q) ||
          c.primaryTeacherName?.toLowerCase().includes(q) ||
          c.major?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [coursesList, courseProgramFilter, courseDegreeFilter, courseSearch]);

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
      c.dayOfWeek !== undefined ? dayNameMap[Number(c.dayOfWeek)] || String(c.dayOfWeek) : '',
      c.startTime || '',
      c.endTime || '',
      c.room || '',
      c.description || '',
    ]);

    downloadCsvFile(filename, headers, rows);
  };

  const handleSaveCourse = async (updatedCourse: Course, cascadeToTimetable: boolean) => {
    setIsSaving(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          course: updatedCourse,
          cascadeToTimetable,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg('บันทึกข้อมูลรายวิชาเรียบร้อยแล้ว');
        if (setCoursesList) {
          setCoursesList((prev) =>
            prev.map((c) =>
              (c.id && c.id === updatedCourse.id) ||
              (c.courseCode === updatedCourse.courseCode && c.section === updatedCourse.section)
                ? { ...c, ...updatedCourse }
                : c
            )
          );
        }
        if (onRefreshCourses) onRefreshCourses();
        if (setActionSuccess) setActionSuccess('บันทึกการแก้ไขรายวิชาเรียบร้อยแล้ว');
      } else {
        setSaveErrorMsg(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err: unknown) {
      setSaveErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ' + getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    const confirmPrompt = `ยืนยันการลบรายวิชา "${course.courseCode} - ${course.courseName}" ตอนเรียน ${course.section || '1'}?`;
    if (!window.confirm(confirmPrompt)) return;

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          courseCode: course.courseCode,
          section: course.section,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (setCoursesList) {
          setCoursesList((prev) =>
            prev.filter(
              (c) =>
                !(c.courseCode === course.courseCode && String(c.section) === String(course.section))
            )
          );
        }
        if (onRefreshCourses) onRefreshCourses();
        if (setActionSuccess) setActionSuccess(`ลบรายวิชา ${course.courseCode} เรียบร้อยแล้ว`);
      } else {
        alert(data.error || 'ไม่สามารถลบรายวิชาได้');
      }
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาด: ' + getErrorMessage(err));
    }
  };

  return {
    courseSearch,
    setCourseSearch,
    courseProgramFilter,
    setCourseProgramFilter,
    courseDegreeFilter,
    setCourseDegreeFilter,
    editingCourse,
    setEditingCourse,
    isSaving,
    saveSuccessMsg,
    setSaveSuccessMsg,
    saveErrorMsg,
    setSaveErrorMsg,
    isImportModalOpen,
    setIsImportModalOpen,
    isExportMenuOpen,
    setIsExportMenuOpen,
    filteredCourses,
    exportCoursesToCSV,
    handleSaveCourse,
    handleDeleteCourse,
  };
}
