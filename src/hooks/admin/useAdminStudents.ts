'use client';

import { useState, useMemo, Dispatch, SetStateAction } from 'react';
import { Student } from '@/types';
import type { PromotionCandidate } from '@/components/admin/modals/BulkPromotionModal';
import { getErrorMessage } from '@/lib/utils/error';

interface UseAdminStudentsOptions {
  studentsList: any[];
  setStudentsList: Dispatch<SetStateAction<any[]>>;
  setStudentsCount: Dispatch<SetStateAction<{ total: number; thai: number; intl: number }>>;
  currentUser: any;
  loadData: () => void;
}

export function useAdminStudents({
  studentsList,
  setStudentsList,
  setStudentsCount,
  currentUser,
  loadData,
}: UseAdminStudentsOptions) {
  // Students filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [studentProgramFilter, setStudentProgramFilter] = useState<'ALL' | 'THAI' | 'ENGLISH'>('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('ALL');
  const [studentYearFilter, setStudentYearFilter] = useState<string>('ALL');

  // Student Deletion states in Admin
  const [adminSelectedStudentCodes, setAdminSelectedStudentCodes] = useState<Set<string>>(new Set());
  const [studentDeleteModal, setStudentDeleteModal] = useState<{
    isOpen: boolean;
    targets: { studentCode: string; fullName: string; major?: string; yearLevel?: number }[];
    isBulk: boolean;
  }>({ isOpen: false, targets: [], isBulk: false });
  const [isDeletingStudents, setIsDeletingStudents] = useState(false);

  // Bulk Student Promotion states
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [promotionTargetYear, setPromotionTargetYear] = useState<string>('ALL');
  const [promotionProgramFilter, setPromotionProgramFilter] = useState<'ALL' | 'THAI' | 'ENGLISH'>('ALL');
  const [promotionActionFilter, setPromotionActionFilter] = useState<string>('ALL');
  const [promotionSearch, setPromotionSearch] = useState<string>('');
  const [promotionDraft, setPromotionDraft] = useState<Record<string, PromotionCandidate>>({});
  const [showPromotionConfirm, setShowPromotionConfirm] = useState(false);
  const [promotionSubmitting, setPromotionSubmitting] = useState(false);

  // Filter Students
  const filteredStudents = useMemo(() => {
    return studentsList.filter((s) => {
      const isEnglish =
        s.programType === 'ENGLISH' ||
        (s.nationality !== 'ไทย' && s.nationality !== 'Thai' && Boolean(s.passportNo));
      if (studentProgramFilter === 'THAI' && isEnglish) return false;
      if (studentProgramFilter === 'ENGLISH' && !isEnglish) return false;
      if (studentStatusFilter !== 'ALL' && s.studyStatus !== studentStatusFilter) return false;
      if (studentYearFilter !== 'ALL' && String(s.yearLevel) !== studentYearFilter) return false;
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const fullName = (s.fullName || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
        return (
          s.studentCode?.toLowerCase().includes(q) ||
          fullName.includes(q) ||
          s.passportNo?.toLowerCase().includes(q) ||
          s.nationality?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [studentsList, studentProgramFilter, studentStatusFilter, studentYearFilter, studentSearch]);

  // Admin Student Selection & Deletion Helpers
  const isAllAdminStudentsSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false;
    const visibleStudents = filteredStudents.slice(0, 100);
    return (
      visibleStudents.length > 0 &&
      visibleStudents.every((s) => adminSelectedStudentCodes.has(s.studentCode))
    );
  }, [filteredStudents, adminSelectedStudentCodes]);

  const toggleSelectAllAdminStudents = () => {
    const visibleStudents = filteredStudents.slice(0, 100);
    const allSelected = visibleStudents.every((s) => adminSelectedStudentCodes.has(s.studentCode));
    const next = new Set(adminSelectedStudentCodes);
    if (allSelected) {
      visibleStudents.forEach((s) => next.delete(s.studentCode));
    } else {
      visibleStudents.forEach((s) => next.add(s.studentCode));
    }
    setAdminSelectedStudentCodes(next);
  };

  const toggleSelectAdminStudent = (studentCode: string) => {
    const next = new Set(adminSelectedStudentCodes);
    if (next.has(studentCode)) {
      next.delete(studentCode);
    } else {
      next.add(studentCode);
    }
    setAdminSelectedStudentCodes(next);
  };

  const openDeleteSingleStudentModal = (student: any) => {
    setStudentDeleteModal({
      isOpen: true,
      targets: [
        {
          studentCode: student.studentCode,
          fullName:
            student.fullName ||
            `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
            student.studentCode,
          major: student.major,
          yearLevel: student.yearLevel,
        },
      ],
      isBulk: false,
    });
  };

  const openDeleteBulkStudentsModal = () => {
    if (adminSelectedStudentCodes.size === 0) return;
    const targets = studentsList
      .filter((s) => adminSelectedStudentCodes.has(s.studentCode))
      .map((s) => ({
        studentCode: s.studentCode,
        fullName:
          s.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentCode,
        major: s.major,
        yearLevel: s.yearLevel,
      }));
    setStudentDeleteModal({
      isOpen: true,
      targets,
      isBulk: true,
    });
  };

  const handleConfirmDeleteStudents = async (reason?: string) => {
    if (studentDeleteModal.targets.length === 0) return;
    setIsDeletingStudents(true);
    try {
      const codes = studentDeleteModal.targets.map((t) => t.studentCode);
      const res = await fetch('/api/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentCodes: codes,
          deletedBy: currentUser?.name || 'ผู้ดูแลระบบ (Admin)',
          reason: reason || 'จำหน่าย/ลบข้อมูลนิสิตออกจากทะเบียน',
        }),
      });
      const data = await res.json();
      if (data.success) {
        const deletedSet = new Set(codes.map((c) => c.toLowerCase()));
        setStudentsList((prev) => {
          const next = prev.filter((s) => !deletedSet.has(String(s.studentCode).toLowerCase()));
          const total = next.length;
          const thai = next.filter(
            (s) =>
              s.programType === 'THAI' ||
              s.nationality === 'ไทย' ||
              s.nationality === 'Thai'
          ).length;
          setStudentsCount({ total, thai, intl: total - thai });
          return next;
        });

        setAdminSelectedStudentCodes((prev) => {
          const next = new Set(prev);
          codes.forEach((c) => next.delete(c));
          return next;
        });

        alert(
          `ย้ายข้อมูลนิสิตเข้าสู่แฟ้มประวัติ (Students_Archive บน Google Sheets) เรียบร้อยแล้ว จำนวน ${data.deletedCount || codes.length} รูป/คน`
        );
        setStudentDeleteModal({ isOpen: false, targets: [], isBulk: false });
      } else {
        alert('เกิดข้อผิดพลาดในการลบ: ' + (data.error || 'ไม่สามารถลบได้'));
      }
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + getErrorMessage(err));
    } finally {
      setIsDeletingStudents(false);
    }
  };

  // Open Bulk Promotion Modal with auto-calculated defaults
  const openPromotionModal = () => {
    const draft: Record<string, any> = {};
    studentsList.forEach((s) => {
      const currentYear = Number(s.yearLevel) || 1;
      const currentStatus = s.studyStatus || 'ปกติ';
      const isFinished = currentStatus === 'สำเร็จการศึกษา' || currentStatus === 'พ้นสภาพ';

      if (isFinished) {
        draft[s.studentCode] = {
          studentCode: s.studentCode,
          fullName:
            s.fullName || `${s.title || ''} ${s.firstName || ''} ${s.lastName || ''}`.trim(),
          currentYear,
          currentStatus,
          programType: s.programType,
          degree: s.degree,
          major: s.major,
          selected: false,
          actionType: currentStatus === 'สำเร็จการศึกษา' ? 'GRADUATE' : 'RETIRE',
          newYear: currentYear,
          newStatus: currentStatus,
          note: `สถานะเดิม: ${currentStatus}`,
        };
      } else if (currentYear >= 4) {
        draft[s.studentCode] = {
          studentCode: s.studentCode,
          fullName:
            s.fullName || `${s.title || ''} ${s.firstName || ''} ${s.lastName || ''}`.trim(),
          currentYear,
          currentStatus,
          programType: s.programType,
          degree: s.degree,
          major: s.major,
          selected: true,
          actionType: 'GRADUATE',
          newYear: 4,
          newStatus: 'สำเร็จการศึกษา',
          note: 'ปี 4 สำเร็จการศึกษาตามหลักสูตร',
        };
      } else {
        draft[s.studentCode] = {
          studentCode: s.studentCode,
          fullName:
            s.fullName || `${s.title || ''} ${s.firstName || ''} ${s.lastName || ''}`.trim(),
          currentYear,
          currentStatus,
          programType: s.programType,
          degree: s.degree,
          major: s.major,
          selected: true,
          actionType: 'PROMOTE',
          newYear: currentYear + 1,
          newStatus: 'ปกติ',
          note: `เลื่อนจากชั้นปี ${currentYear} สู่ชั้นปี ${currentYear + 1}`,
        };
      }
    });
    setPromotionDraft(draft);
    setPromotionTargetYear('ALL');
    setPromotionProgramFilter('ALL');
    setPromotionActionFilter('ALL');
    setPromotionSearch('');
    setIsPromotionModalOpen(true);
  };

  const handlePromotionItemActionChange = (
    studentCode: string,
    actionType: 'PROMOTE' | 'GRADUATE' | 'REPEAT' | 'DROP' | 'RETIRE' | 'CUSTOM'
  ) => {
    setPromotionDraft((prev) => {
      const current = prev[studentCode];
      if (!current) return prev;

      let newYear = current.newYear;
      let newStatus = current.newStatus;
      let note = current.note;

      if (actionType === 'PROMOTE') {
        if (current.currentYear >= 4) {
          newYear = 4;
          newStatus = 'สำเร็จการศึกษา';
          note = 'ปี 4 สำเร็จการศึกษาตามหลักสูตร';
        } else {
          newYear = current.currentYear + 1;
          newStatus = 'ปกติ';
          note = `เลื่อนจากชั้นปี ${current.currentYear} สู่ชั้นปี ${current.currentYear + 1}`;
        }
      } else if (actionType === 'REPEAT') {
        newYear = current.currentYear;
        newStatus = 'ซ้ำชั้น';
        note = `ซ้ำชั้นปีที่ ${current.currentYear} (ไม่เลื่อนชั้นปี)`;
      } else if (actionType === 'DROP') {
        newYear = current.currentYear;
        newStatus = 'รักษาสภาพ';
        note = `รักษาสภาพนิสิต / ดรอปเรียน ชั้นปีที่ ${current.currentYear}`;
      } else if (actionType === 'GRADUATE') {
        newYear = current.currentYear;
        newStatus = 'สำเร็จการศึกษา';
        note = 'สำเร็จการศึกษา';
      } else if (actionType === 'RETIRE') {
        newYear = current.currentYear;
        newStatus = 'พ้นสภาพ';
        note = 'พ้นสภาพนิสิต';
      }

      return {
        ...prev,
        [studentCode]: {
          ...current,
          actionType,
          newYear,
          newStatus,
          note,
        },
      };
    });
  };

  const handlePromotionCustomFieldChange = (
    studentCode: string,
    field: 'newYear' | 'newStatus' | 'note',
    value: string | number
  ) => {
    setPromotionDraft((prev) => {
      const current = prev[studentCode];
      if (!current) return prev;
      return {
        ...prev,
        [studentCode]: {
          ...current,
          [field]: value,
          actionType: 'CUSTOM',
        },
      };
    });
  };

  const togglePromotionSelect = (studentCode: string) => {
    setPromotionDraft((prev) => {
      const current = prev[studentCode];
      if (!current) return prev;
      return {
        ...prev,
        [studentCode]: {
          ...current,
          selected: !current.selected,
        },
      };
    });
  };

  const setFilteredPromotionSelection = (selected: boolean, items: Array<{ studentCode: string }>) => {
    setPromotionDraft((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        if (next[item.studentCode]) {
          next[item.studentCode] = {
            ...next[item.studentCode],
            selected,
          };
        }
      });
      return next;
    });
  };

  const setFilteredPromotionAction = (
    actionType: 'PROMOTE' | 'GRADUATE' | 'REPEAT' | 'DROP',
    items: Array<{ studentCode: string }>
  ) => {
    setPromotionDraft((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        const current = next[item.studentCode];
        if (!current) return;
        let newYear = current.newYear;
        let newStatus = current.newStatus;
        let note = current.note;

        if (actionType === 'PROMOTE') {
          if (current.currentYear >= 4) {
            newYear = 4;
            newStatus = 'สำเร็จการศึกษา';
            note = 'ปี 4 สำเร็จการศึกษาตามหลักสูตร';
          } else {
            newYear = current.currentYear + 1;
            newStatus = 'ปกติ';
            note = `เลื่อนจากชั้นปี ${current.currentYear} สู่ชั้นปี ${current.currentYear + 1}`;
          }
        } else if (actionType === 'REPEAT') {
          newYear = current.currentYear;
          newStatus = 'ซ้ำชั้น';
          note = `ซ้ำชั้นปีที่ ${current.currentYear}`;
        } else if (actionType === 'DROP') {
          newYear = current.currentYear;
          newStatus = 'รักษาสภาพ';
          note = `รักษาสภาพนิสิต ชั้นปีที่ ${current.currentYear}`;
        } else if (actionType === 'GRADUATE') {
          newYear = current.currentYear;
          newStatus = 'สำเร็จการศึกษา';
          note = 'สำเร็จการศึกษา';
        }

        next[item.studentCode] = {
          ...current,
          actionType,
          newYear,
          newStatus,
          note,
          selected: true,
        };
      });
      return next;
    });
  };

  const filteredPromotionItems = useMemo(() => {
    const items = Object.values(promotionDraft);
    return items.filter((item) => {
      if (promotionTargetYear !== 'ALL' && String(item.currentYear) !== promotionTargetYear) {
        return false;
      }
      if (promotionProgramFilter === 'THAI' && item.programType === 'ENGLISH') {
        return false;
      }
      if (promotionProgramFilter === 'ENGLISH' && item.programType !== 'ENGLISH') {
        return false;
      }
      if (promotionActionFilter !== 'ALL') {
        if (promotionActionFilter === 'SELECTED_ONLY' && !item.selected) return false;
        if (promotionActionFilter === 'UNSELECTED_ONLY' && item.selected) return false;
        if (['PROMOTE', 'GRADUATE', 'REPEAT', 'DROP', 'RETIRE'].includes(promotionActionFilter)) {
          if (item.actionType !== promotionActionFilter) return false;
        }
      }
      if (promotionSearch.trim()) {
        const q = promotionSearch.toLowerCase().trim();
        const matchCode = item.studentCode?.toLowerCase().includes(q);
        const matchName = item.fullName?.toLowerCase().includes(q);
        const matchMajor = item.major?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchMajor) return false;
      }
      return true;
    });
  }, [promotionDraft, promotionTargetYear, promotionProgramFilter, promotionActionFilter, promotionSearch]);

  const promotionStats = useMemo(() => {
    const all = Object.values(promotionDraft);
    const selected = all.filter((i) => i.selected);
    const promoteCount = selected.filter((i) => i.actionType === 'PROMOTE').length;
    const gradCount = selected.filter((i) => i.actionType === 'GRADUATE').length;
    const repeatCount = selected.filter((i) => i.actionType === 'REPEAT').length;
    const dropCount = selected.filter((i) => i.actionType === 'DROP').length;
    const retireCount = selected.filter((i) => i.actionType === 'RETIRE').length;
    const customCount = selected.filter((i) => i.actionType === 'CUSTOM').length;
    const unselectedCount = all.length - selected.length;
    return {
      total: all.length,
      selectedCount: selected.length,
      promoteCount,
      gradCount,
      repeatCount,
      dropCount,
      retireCount,
      customCount,
      unselectedCount,
    };
  }, [promotionDraft]);

  const handleExecuteBulkPromotion = async () => {
    const selectedList = Object.values(promotionDraft).filter((d) => d.selected);
    if (selectedList.length === 0) {
      alert('กรุณาเลือกนิสิตอย่างน้อย 1 คน สำหรับการเลื่อนชั้นปี');
      return;
    }

    setPromotionSubmitting(true);
    try {
      const updates = selectedList.map((item) => ({
        studentCode: item.studentCode,
        yearLevel: item.newYear,
        studyStatus: item.newStatus,
        remarks: item.note ? item.note : undefined,
      }));

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BULK_PROMOTE',
          items: updates,
          mode: 'UPDATE_ONLY',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'ไม่สามารถอัปเดตข้อมูลได้');
      }

      const archivedMsg =
        data.archived && data.archived > 0
          ? `\n📦 และย้ายนิสิตที่สำเร็จการศึกษา / พ้นสภาพ / ลาออก / ย้ายออก จำนวน ${data.archived} รูป/คน เข้าสู่แฟ้มประวัตินิสิต (Students_Archive) เรียบร้อยแล้ว เพื่อให้ยอดนิสิตปัจจุบันตรงตามจริง`
          : '';
      alert(
        `✅ ดำเนินการเลื่อนชั้นปีการศึกษาและปรับสถานะนิสิตสำเร็จทั้งหมด ${data.updated || selectedList.length} คน เรียบร้อยแล้ว!${archivedMsg}`
      );
      setShowPromotionConfirm(false);
      setIsPromotionModalOpen(false);
      loadData();
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาดในการเลื่อนชั้นปี: ' + (getErrorMessage(err) || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'));
    } finally {
      setPromotionSubmitting(false);
    }
  };

  const inactiveStudentsInRegistry = useMemo(() => {
    const inactiveKeywords = ['สำเร็จการศึกษา', 'จบการศึกษา', 'พ้นสภาพ', 'ลาออก', 'ย้ายออก', 'จำหน่าย'];
    return studentsList.filter((s: Student) => {
      const st = (s.studyStatus || '').trim();
      return inactiveKeywords.some((kw) => st === kw || st.includes(kw));
    });
  }, [studentsList]);

  const [isArchivingInactive, setIsArchivingInactive] = useState(false);

  const handleSweepInactiveToArchive = async () => {
    if (inactiveStudentsInRegistry.length === 0) return;
    if (
      !confirm(
        `ยืนยันการย้ายนิสิตที่มีสถานะ สำเร็จการศึกษา / พ้นสภาพ / ลาออก / ย้ายออก จำนวน ${inactiveStudentsInRegistry.length} รูป/คน ออกจากทะเบียนปัจจุบัน ไปเก็บใน "แฟ้มประวัตินิสิต (Students_Archive)" เพื่อให้ยอดนิสิตที่ยังศึกษาอยู่ตรงตามจริงหรือไม่?`
      )
    ) {
      return;
    }

    setIsArchivingInactive(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive-inactive',
          deletedBy: currentUser?.fullName || 'ผู้ดูแลระบบ (Admin)',
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'ไม่สามารถย้ายข้อมูลเข้าแฟ้มประวัติได้');
      }
      alert(`✅ ${data.message}`);
      loadData();
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาด: ' + getErrorMessage(err));
    } finally {
      setIsArchivingInactive(false);
    }
  };

  return {
    studentSearch,
    setStudentSearch,
    studentProgramFilter,
    setStudentProgramFilter,
    studentStatusFilter,
    setStudentStatusFilter,
    studentYearFilter,
    setStudentYearFilter,
    filteredStudents,
    adminSelectedStudentCodes,
    setAdminSelectedStudentCodes,
    isAllAdminStudentsSelected,
    toggleSelectAllAdminStudents,
    toggleSelectAdminStudent,
    studentDeleteModal,
    setStudentDeleteModal,
    isDeletingStudents,
    openDeleteSingleStudentModal,
    openDeleteBulkStudentsModal,
    handleConfirmDeleteStudents,
    inactiveStudentsInRegistry,
    isArchivingInactive,
    handleSweepInactiveToArchive,
    // Promotion
    isPromotionModalOpen,
    setIsPromotionModalOpen,
    promotionTargetYear,
    setPromotionTargetYear,
    promotionProgramFilter,
    setPromotionProgramFilter,
    promotionActionFilter,
    setPromotionActionFilter,
    promotionSearch,
    setPromotionSearch,
    promotionDraft,
    setPromotionDraft,
    showPromotionConfirm,
    setShowPromotionConfirm,
    promotionSubmitting,
    openPromotionModal,
    handlePromotionItemActionChange,
    handlePromotionCustomFieldChange,
    togglePromotionSelect,
    setFilteredPromotionSelection,
    setFilteredPromotionAction,
    filteredPromotionItems,
    promotionStats,
    handleExecuteBulkPromotion,
  };
}
