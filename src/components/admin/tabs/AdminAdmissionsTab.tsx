'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  ExternalLink,
  Calendar,
  FileText,
  Trash2,
  Edit3,
  Save,
  X,
  ArrowRight,
  Globe,
  RefreshCw,
  Download,
  Sparkles,
} from 'lucide-react';
import { AdmissionApplication, AdmissionStatus, SystemSettings } from '@/types';
import { downloadCsvFile } from '@/lib/utils';

export interface AdminAdmissionsTabProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  onRefreshStudents?: () => void;
  setActionSuccess: (msg: string | null) => void;
}

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

export function AdminAdmissionsTab({
  settings,
  setSettings,
  onRefreshStudents,
  setActionSuccess,
}: AdminAdmissionsTabProps) {
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
        setEditingApp(null);
        loadAdmissions();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการบันทึก');
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
        setActionSuccess(`เปลี่ยนสถานะของ ${app.firstName} เป็น "${STATUS_BADGES[nextStatus].label}" เรียบร้อยแล้ว`);
        loadAdmissions();
      }
    } catch {}
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
        setActionSuccess(
          data.message || `โอนเข้าทะเบียนนิสิตสำเร็จ (รหัสนิสิต: ${data.studentCode})`
        );
        loadAdmissions();
        if (onRefreshStudents) onRefreshStudents();
      } else {
        alert(data.error || 'ไม่สามารถโอนข้อมูลได้');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการโอนข้อมูลเข้าทะเบียนนิสิต');
    } finally {
      setTransferringId(null);
    }
  };

  const handleDeleteApplicant = async (app: AdmissionApplication) => {
    if (!window.confirm(`ยืนยันการลบใบสมัคร ${app.applicationCode} (${app.firstName}) หรือไม่?`)) {
      return;
    }
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: app.id }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess('ลบใบสมัครเรียบร้อยแล้ว');
        loadAdmissions();
      }
    } catch {}
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
      STATUS_BADGES[a.status]?.label || a.status,
      a.assignedStudentCode || '',
    ]);
    downloadCsvFile(`admissions-${settings.admissionAcademicYear || '2570'}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Control Panel: Visibility Toggles & Schedule Settings */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-orange-600" />
              <span>ระบบจัดการรับสมัครและขึ้นทะเบียนนิสิตใหม่ออนไลน์ (Admissions & Enrollment Management)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ควบคุมการเปิด/ปิดแสดงผลบนหน้าเว็บไซต์หลัก ตรวจสอบเอกสาร นัดสัมภาษณ์ และโอนผู้สมัครเข้าสู่ทะเบียนนิสิตปัจจุบัน
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/enroll"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-extrabold transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดหน้ารับสมัคร (/enroll)</span>
            </Link>
            <button
              type="button"
              onClick={loadAdmissions}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>

        {/* 2 Master Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Switch 1: Show/Hide on Public Homepage & Navbar */}
          <div
            className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
              settings.showEnrollmentMenu !== false
                ? 'bg-emerald-50/60 border-emerald-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="space-y-1">
              <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <span>🎓 แสดงเมนูและการ์ด &ldquo;สมัครเรียน / นิสิตใหม่&rdquo; บนหน้าแรก (/)</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    settings.showEnrollmentMenu !== false
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {settings.showEnrollmentMenu !== false ? '🟢 เปิดแสดงหน้าเว็บ' : '🔴 ปิดซ่อนจากหน้าเว็บ'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                เปิดหรือซ่อนปุ่มสมัครเรียนนิสิตใหม่บนแบนเนอร์หน้าแรก การ์ดบริการ และแถบเมนูด้านบนสุด (Navbar)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={settings.showEnrollmentMenu !== false}
                onChange={(e) => {
                  const val = e.target.checked;
                  handleSaveAdmissionConfig({ showEnrollmentMenu: val });
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Switch 2: Open/Close Online Application Form */}
          <div
            className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
              settings.admissionOpen !== false
                ? 'bg-amber-50/60 border-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="space-y-1">
              <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <span>📝 เปิดรับการยื่นใบสมัครออนไลน์รอบปัจจุบัน</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    settings.admissionOpen !== false
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {settings.admissionOpen !== false ? '🟢 เปิดรับใบสมัคร' : '🔴 ปิดรับใบสมัคร'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                หากปิดรับสมัคร ผู้สมัครเดิมจะยังสามารถเข้ามาเช็คผลสัมภาษณ์และพิมพ์ใบรายงานตัวในแท็บที่ 3-4 ได้ตามปกติ
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={settings.admissionOpen !== false}
                onChange={(e) => {
                  const val = e.target.checked;
                  handleSaveAdmissionConfig({ admissionOpen: val });
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </div>

        {/* Default Schedule & Academic Year Config */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ปีการศึกษาที่เปิดรับสมัคร</label>
            <input
              type="text"
              value={settings.admissionAcademicYear || '2570'}
              onChange={(e) => setSettings({ ...settings, admissionAcademicYear: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block font-bold text-slate-700 mb-1">วัน-เวลาสอบสัมภาษณ์เริ่มต้น</label>
            <input
              type="text"
              value={settings.admissionDefaultInterviewDate || ''}
              onChange={(e) =>
                setSettings({ ...settings, admissionDefaultInterviewDate: e.target.value })
              }
              placeholder="เช่น 20 พฤษภาคม 2570 เวลา 09.00-12.00 น."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block font-bold text-slate-700 mb-1">สถานที่ / ห้องสอบสัมภาษณ์เริ่มต้น</label>
            <input
              type="text"
              value={settings.admissionDefaultInterviewRoom || ''}
              onChange={(e) =>
                setSettings({ ...settings, admissionDefaultInterviewRoom: e.target.value })
              }
              placeholder="เช่น อาคารเรียนรวม ห้อง C301"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => handleSaveAdmissionConfig()}
              disabled={savingConfig}
              className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white font-bold transition cursor-pointer"
            >
              {savingConfig ? 'กำลังบันทึก...' : '💾 บันทึกกำหนดการรับสมัคร'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter('ALL')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-400 transition"
        >
          <div className="text-xs font-bold text-slate-500">ผู้สมัครทั้งหมด</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{counts.total} รูป/คน</div>
          <div className="text-[11px] text-slate-500 mt-1">
            🇹🇭 ไทย {counts.thai} • 🌐 EN {counts.english}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('SUBMITTED')}
          className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-xs cursor-pointer hover:border-amber-400 transition"
        >
          <div className="text-xs font-bold text-amber-800">๑. รอตรวจเอกสาร</div>
          <div className="text-2xl font-black text-amber-900 mt-1">{counts.submitted}</div>
          <div className="text-[11px] text-amber-700 mt-1">คลิกเพื่อกรองรายการ</div>
        </div>

        <div
          onClick={() => setStatusFilter('DOC_VERIFIED')}
          className="bg-sky-50/70 p-4 rounded-2xl border border-sky-200 shadow-xs cursor-pointer hover:border-sky-400 transition"
        >
          <div className="text-xs font-bold text-sky-800">๒. รอสอบสัมภาษณ์</div>
          <div className="text-2xl font-black text-sky-900 mt-1">{counts.verified}</div>
          <div className="text-[11px] text-sky-700 mt-1">ตรวจเอกสารผ่านแล้ว</div>
        </div>

        <div
          onClick={() => setStatusFilter('INTERVIEW_PASS')}
          className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 shadow-xs cursor-pointer hover:border-indigo-400 transition"
        >
          <div className="text-xs font-bold text-indigo-800">๓. ผ่านการสัมภาษณ์</div>
          <div className="text-2xl font-black text-indigo-900 mt-1">{counts.interviewPass}</div>
          <div className="text-[11px] text-indigo-700 mt-1">พร้อมขึ้นทะเบียนนิสิต</div>
        </div>

        <div
          onClick={() => setStatusFilter('ENROLLED')}
          className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-xs cursor-pointer hover:border-emerald-400 transition col-span-2 lg:col-span-1"
        >
          <div className="text-xs font-bold text-emerald-800">๔. ขึ้นทะเบียนนิสิตแล้ว</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{counts.enrolled}</div>
          <div className="text-[11px] text-emerald-700 mt-1">พร้อมโอนเข้าทะเบียนนิสิต</div>
        </div>
      </div>

      {/* 3. Applicants Table & Filters */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหารหัสใบสมัคร, ชื่อ-ฉายา/นามสกุล, เลขบัตรประชาชน/Passport, สาขาวิชา..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800"
            >
              <option value="ALL">ทุกสถานะ ({applications.length})</option>
              <option value="SUBMITTED">๑. รอตรวจเอกสาร</option>
              <option value="DOC_VERIFIED">๒. ตรวจเอกสารผ่าน / รอสัมภาษณ์</option>
              <option value="INTERVIEW_PASS">๓. ผ่านสัมภาษณ์</option>
              <option value="ENROLLED">๔. ขึ้นทะเบียนนิสิตแล้ว</option>
              <option value="REJECTED">✕ ไม่ผ่านเกณฑ์</option>
            </select>

            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800"
            >
              <option value="ALL">ทุกหลักสูตรภาษา</option>
              <option value="THAI">🇹🇭 หลักสูตรภาษาไทย</option>
              <option value="ENGLISH">🌐 หลักสูตรภาษาอังกฤษ</option>
            </select>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 font-extrabold">รหัสใบสมัคร / วันที่</th>
                <th className="py-3 px-3 font-extrabold">ชื่อ-ฉายา/นามสกุล</th>
                <th className="py-3 px-3 font-extrabold">หลักสูตร / สาขาวิชา</th>
                <th className="py-3 px-3 font-extrabold">ติดต่อ / เอกสาร</th>
                <th className="py-3 px-3 font-extrabold">สถานะการสมัคร (4 ขั้นตอน)</th>
                <th className="py-3 px-3 font-extrabold text-right">การจัดการ / โอนเข้าทะเบียน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    กำลังโหลดข้อมูลใบสมัคร...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    ไม่พบรายการใบสมัครที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredList.map((app) => {
                  const badge = STATUS_BADGES[app.status] || STATUS_BADGES.SUBMITTED;
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 align-top">
                        <div className="font-mono font-extrabold text-indigo-800">
                          {app.applicationCode}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          ID: {app.citizenId}
                        </div>
                        {app.assignedStudentCode && (
                          <div className="mt-1 inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono font-black text-[11px]">
                            รหัสนิสิต: {app.assignedStudentCode}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 align-top">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {app.titleName} {app.firstName} {app.lastName}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-800 font-bold border border-orange-200">
                            {app.applicantType === 'MONK' ? '☸️ บรรพชิต' : '👤 คฤหัสถ์'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                            {app.nationality || 'ไทย'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 align-top">
                        <div className="font-bold text-slate-900">
                          {app.degreeLevel} •{' '}
                          <span
                            className={
                              app.programType === 'ENGLISH' ? 'text-purple-700' : 'text-emerald-700'
                            }
                          >
                            {app.programType === 'ENGLISH' ? '🌐 ภาคอังกฤษ' : '🇹🇭 ภาคไทย'}
                          </span>
                        </div>
                        <div className="text-slate-600 mt-0.5">{app.major}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {app.studyPlan} • วุฒิ: {app.previousEducation}
                        </div>
                      </td>

                      <td className="py-3 px-3 align-top">
                        <div className="font-semibold text-slate-800">📞 {app.phone}</div>
                        {app.lineId && (
                          <div className="text-[11px] text-emerald-700">LINE: {app.lineId}</div>
                        )}
                        {app.documentUrl && (
                          <a
                            href={app.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline"
                          >
                            <FileText className="w-3 h-3" />
                            <span>เปิดดูเอกสารแนบ</span>
                          </a>
                        )}
                      </td>

                      <td className="py-3 px-3 align-top space-y-1.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${badge.badgeClass}`}
                        >
                          {badge.label}
                        </span>
                        <div>
                          <select
                            aria-label="เปลี่ยนสถานะใบสมัครด่วน"
                            value={app.status}
                            onChange={(e) =>
                              handleQuickStatusChange(app, e.target.value as AdmissionStatus)
                            }
                            className="mt-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-[11px] font-bold text-slate-800 cursor-pointer"
                          >
                            <option value="SUBMITTED">๑. รอตรวจเอกสาร</option>
                            <option value="DOC_VERIFIED">๒. ตรวจเอกสารผ่าน (นัดสัมภาษณ์)</option>
                            <option value="INTERVIEW_PASS">๓. ผ่านสัมภาษณ์ (ให้ขึ้นทะเบียน)</option>
                            <option value="ENROLLED">๔. ขึ้นทะเบียนนิสิตแล้ว</option>
                            <option value="REJECTED">✕ ไม่ผ่านเกณฑ์</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3 px-3 align-top text-right space-y-1.5">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(app)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>นัดสัมภาษณ์/รหัส</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteApplicant(app)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                            title="ลบใบสมัคร"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* 1-Click Transfer to Student Registry */}
                        <div>
                          {app.transferredToRegistry ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>โอนเข้าทะเบียนนิสิตแล้ว</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={transferringId === app.id}
                              onClick={() => handleTransferToStudentRegistry(app)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-[11px] font-extrabold shadow-2xs transition cursor-pointer disabled:opacity-50"
                            >
                              <GraduationCap className="w-3.5 h-3.5" />
                              <span>
                                {transferringId === app.id
                                  ? 'กำลังโอน...'
                                  : 'โอนเข้าทะเบียนนิสิต (1-Click)'}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Applicant / Interview Schedule Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  จัดการใบสมัคร & นัดสอบสัมภาษณ์ ({editingApp.applicationCode})
                </h3>
                <p className="text-xs text-slate-500">
                  {editingApp.titleName} {editingApp.firstName} {editingApp.lastName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">สถานะการสมัคร</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AdmissionStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900"
                >
                  <option value="SUBMITTED">๑. ยื่นใบสมัครแล้ว (รอตรวจเอกสาร)</option>
                  <option value="DOC_VERIFIED">๒. ตรวจเอกสารผ่าน (รอสอบสัมภาษณ์)</option>
                  <option value="INTERVIEW_PASS">๓. ผ่านการสอบสัมภาษณ์ (พร้อมขึ้นทะเบียน)</option>
                  <option value="ENROLLED">๔. ขึ้นทะเบียนนิสิตใหม่เรียบร้อยแล้ว</option>
                  <option value="REJECTED">✕ ไม่ผ่านเกณฑ์ / ยกเลิก</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  กำหนดรหัสประจำตัวนิสิตใหม่ (สำหรับผู้ผ่านสัมภาษณ์/ขึ้นทะเบียน)
                </label>
                <input
                  type="text"
                  value={editStudentCode}
                  onChange={(e) => setEditStudentCode(e.target.value)}
                  placeholder="เช่น 6901201001 (หากเว้นว่าง ระบบจะรันให้อัตโนมัติตอนขึ้นทะเบียน)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">วันและเวลาสอบสัมภาษณ์</label>
                <input
                  type="text"
                  value={editInterviewDate}
                  onChange={(e) => setEditInterviewDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">สถานที่ / ห้องสอบสัมภาษณ์</label>
                <input
                  type="text"
                  value={editInterviewRoom}
                  onChange={(e) => setEditInterviewRoom(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">หมายเหตุแจ้งผู้สมัคร</label>
                <textarea
                  rows={2}
                  value={editInterviewNote}
                  onChange={(e) => setEditInterviewNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveApplicantUpdate}
                disabled={savingApp}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingApp ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
