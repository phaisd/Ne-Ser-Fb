'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdmissionApplication, AdmissionStatus, SystemSettings } from '@/types';
import { downloadCsvFile } from '@/lib/utils';
import { toast } from '@/lib/toast';

const STATUS_BADGES: Record<
  AdmissionStatus,
  { label: string; badgeClass: string }
> = {
  SUBMITTED: {
    label: '๑. ยื่นใบสมัครแล้ว (รอตรวจเอกสาร)',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  DOC_VERIFIED: {
    label: '๒. ตรวจเอกสารผ่าน (รอสัมภาษณ์)',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
  },
  INTERVIEW_PASS: {
    label: '๓. ผ่านสัมภาษณ์ (พร้อมขึ้นทะเบียน)',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  },
  ENROLLED: {
    label: '๔. ขึ้นทะเบียนนิสิตแล้ว',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  REJECTED: {
    label: '✕ ไม่ผ่านเกณฑ์ / ยกเลิก',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
  },
};

export interface UseAdminAdmissionsOptions {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  onRefreshStudents?: () => void;
  setActionSuccess: (msg: string | null) => void;
}

export function useAdminAdmissions({
  settings,
  setSettings,
  onRefreshStudents,
  setActionSuccess,
}: UseAdminAdmissionsOptions) {
  const [subTab, setSubTab] = useState<'APPLICANTS' | 'PORTAL'>('APPLICANTS');
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdmissionStatus>('ALL');
  const [programFilter, setProgramFilter] = useState<'ALL' | 'THAI' | 'ENGLISH'>('ALL');
  const [savingConfig, setSavingConfig] = useState(false);

  // Editing modal/row state
  const [editingApp, setEditingApp] = useState<AdmissionApplication | null>(null);
  const [editStatus, setEditStatus] = useState<AdmissionStatus>('SUBMITTED');
  const [editInterviewDate, setEditInterviewDate] = useState('');
  const [editInterviewRoom, setEditInterviewRoom] = useState('');
  const [editInterviewNote, setEditInterviewNote] = useState('');
  const [editStudentCode, setEditStudentCode] = useState('');
  const [savingApp, setSavingApp] = useState(false);
  const [transferringId, setTransferringId] = useState<string | null>(null);

  const loadAdmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admissions');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setApplications(data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmissions();
  }, []);

  const filteredList = useMemo(() => {
    return applications.filter((a) => {
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (programFilter !== 'ALL' && a.programType !== programFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${a.applicationCode} ${a.citizenId} ${a.passportNo || ''} ${a.titleName} ${a.firstName} ${a.lastName} ${a.major} ${a.assignedStudentCode || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [applications, statusFilter, programFilter, search]);

  const counts = useMemo(() => {
    const total = applications.length;
    const submitted = applications.filter((a) => a.status === 'SUBMITTED').length;
    const verified = applications.filter((a) => a.status === 'DOC_VERIFIED').length;
    const interviewPass = applications.filter((a) => a.status === 'INTERVIEW_PASS').length;
    const enrolled = applications.filter((a) => a.status === 'ENROLLED').length;
    const thai = applications.filter((a) => a.programType === 'THAI').length;
    const english = total - thai;
    return { total, submitted, verified, interviewPass, enrolled, thai, english };
  }, [applications]);

  const handleSaveAdmissionConfig = async (nextOverrides?: Partial<SystemSettings>) => {
    setSavingConfig(true);
    const updatedPayload = {
      ...settings,
      ...(nextOverrides || {}),
    };
    if (nextOverrides) {
      setSettings(updatedPayload);
    }
    try {
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess('บันทึกการตั้งค่าระบบรับสมัครนิสิตใหม่เรียบร้อยแล้ว');
        window.dispatchEvent(new Event('mcu_settings_updated'));
      }
    } catch {
      // ignore
    } finally {
      setSavingConfig(false);
    }
  };

  const openEditModal = (app: AdmissionApplication) => {
    setEditingApp(app);
    setEditStatus(app.status);
    setEditInterviewDate(app.interviewDate || settings.admissionDefaultInterviewDate || '');
    setEditInterviewRoom(app.interviewRoom || settings.admissionDefaultInterviewRoom || '');
    setEditInterviewNote(app.interviewNote || '');
    setEditStudentCode(app.assignedStudentCode || '');
  };

  const handleSaveApplicantUpdate = async () => {
    if (!editingApp) return;
    setSavingApp(true);
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: editingApp.id,
          updates: {
            status: editStatus,
            interviewDate: editInterviewDate,
            interviewRoom: editInterviewRoom,
            interviewNote: editInterviewNote,
            assignedStudentCode: editStudentCode,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message || 'อัปเดตสถานะผู้สมัครเรียบร้อยแล้ว');
        toast.success(data.message || 'อัปเดตสถานะผู้สมัครเรียบร้อยแล้ว');
        setEditingApp(null);
        loadAdmissions();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSavingApp(false);
    }
  };

  const handleQuickStatusChange = async (app: AdmissionApplication, nextStatus: AdmissionStatus) => {
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: app.id,
          updates: { status: nextStatus },
        }),
      });
      const data = await res.json();
      if (data.success) {
        const msg = `เปลี่ยนสถานะของ ${app.firstName} เป็น "${STATUS_BADGES[nextStatus]?.label || nextStatus}" เรียบร้อยแล้ว`;
        setActionSuccess(msg);
        toast.success(msg);
        loadAdmissions();
      }
    } catch {
      // ignore
    }
  };

  const handleTransferToStudentRegistry = async (app: AdmissionApplication) => {
    const confirmMsg = `ยืนยันการโอนข้อมูลของ "${app.titleName} ${app.firstName} ${app.lastName}" เข้าสู่ระบบทะเบียนนิสิตปัจจุบัน (Students) หรือไม่?`;
    if (!window.confirm(confirmMsg)) return;

    setTransferringId(app.id);
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer_to_registry',
          id: app.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const msg = data.message || `โอนเข้าทะเบียนนิสิตสำเร็จ (รหัสนิสิต: ${data.studentCode})`;
        setActionSuccess(msg);
        toast.success(msg);
        loadAdmissions();
        if (onRefreshStudents) onRefreshStudents();
      } else {
        toast.error(data.error || 'ไม่สามารถโอนข้อมูลได้');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการโอนข้อมูลเข้าทะเบียนนิสิต');
    } finally {
      setTransferringId(null);
    }
  };

  const handleDeleteApplicant = async (app: AdmissionApplication) => {
    if (!confirm(`ต้องการลบใบสมัครเลขที่ ${app.applicationCode} ของ "${app.titleName}${app.firstName} ${app.lastName}" หรือไม่?`)) {
      return;
    }
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id: app.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess('ลบใบสมัครเรียบร้อยแล้ว');
        toast.success('ลบใบสมัครเรียบร้อยแล้ว');
        loadAdmissions();
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'รหัสใบสมัคร',
      'ปีการศึกษา',
      'สถานภาพ',
      'เลขบัตร/Passport',
      'คำนำหน้า',
      'ชื่อ',
      'ฉายา/นามสกุล',
      'ระดับปริญญา',
      'หลักสูตรภาษา',
      'สาขาวิชา',
      'แผนการเรียน',
      'วุฒิเดิม',
      'เบอร์โทร',
      'อีเมล',
      'LINE ID',
      'สถานะ',
      'รหัสนิสิตใหม่',
    ];
    const rows = filteredList.map((a) => [
      a.applicationCode,
      a.academicYear,
      a.applicantType === 'MONK' ? 'บรรพชิต' : 'คฤหัสถ์',
      a.citizenId,
      a.titleName,
      a.firstName,
      a.lastName,
      a.degreeLevel,
      a.programType,
      a.major,
      a.studyPlan,
      a.previousEducation,
      a.phone,
      a.email || '',
      a.lineId || '',
      a.status,
      a.assignedStudentCode || '',
    ]);

    downloadCsvFile(`admissions-${settings.admissionAcademicYear || '2570'}.csv`, headers, rows);
  };

  return {
    subTab,
    setSubTab,
    applications,
    setApplications,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    programFilter,
    setProgramFilter,
    savingConfig,
    editingApp,
    setEditingApp,
    editStatus,
    setEditStatus,
    editInterviewDate,
    setEditInterviewDate,
    editInterviewRoom,
    setEditInterviewRoom,
    editInterviewNote,
    setEditInterviewNote,
    editStudentCode,
    setEditStudentCode,
    savingApp,
    transferringId,
    loadAdmissions,
    filteredList,
    counts,
    handleSaveAdmissionConfig,
    openEditModal,
    handleSaveApplicantUpdate,
    handleQuickStatusChange,
    handleTransferToStudentRegistry,
    handleDeleteApplicant,
    handleExportCsv,
  };
}
