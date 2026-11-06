'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  UserPlus,
  Search,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Edit3,
  Users,
} from 'lucide-react';
import { Student, CourseEnrollment } from '@/types';

interface AddStudentToCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseCode: string;
  courseName: string;
  allStudents: Student[];
  currentEnrolledCodes: Set<string>;
  onEnrolledSuccess: (newEnrollment: CourseEnrollment, addedOrUpdatedStudent?: Student) => void;
  currentUserName?: string;
}

const MAJOR_OPTIONS = [
  { id: 'พระพุทธศาสนา', labelTh: 'สาขาวิชาพระพุทธศาสนา', labelEn: 'Buddhist Studies' },
  { id: 'วิปัสสนาภาวนา', labelTh: 'สาขาวิชาวิปัสสนาภาวนา', labelEn: 'Vipassana Meditation' },
  { id: 'ศาสนาและปรัชญา', labelTh: 'สาขาวิชาศาสนาและปรัชญา', labelEn: 'Religion and Philosophy' },
  { id: 'บาลีสันสกฤต', labelTh: 'สาขาวิชาบาลีสันสกฤต', labelEn: 'Pali and Sanskrit' },
];

export const AddStudentToCourseModal: React.FC<AddStudentToCourseModalProps> = ({
  isOpen,
  onClose,
  courseCode,
  courseName,
  allStudents,
  currentEnrolledCodes,
  onEnrolledSuccess,
  currentUserName,
}) => {
  const [activeTab, setActiveTab] = useState<'MANUAL_FORM' | 'SEARCH_DB'>('MANUAL_FORM');

  // Shared enrollment metadata
  const [enrollmentType, setEnrollmentType] = useState('เทียบโอน / เดินเรียน');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Manual Form states (สำหรับกรอก รหัสนิสิต + ชื่อ-สกุล + สาขาวิชา ด้วยตนเอง)
  const [manualCode, setManualCode] = useState('');
  const [manualFullName, setManualFullName] = useState('');
  const [manualMajor, setManualMajor] = useState('พระพุทธศาสนา');
  const [manualYearLevel, setManualYearLevel] = useState<number>(1);
  const [manualProgramType, setManualProgramType] = useState<'THAI' | 'ENGLISH'>('THAI');
  const [savingManual, setSavingManual] = useState(false);

  // Search DB states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TRANSFER' | 'REGULAR'>('ALL');
  const [submittingCode, setSubmittingCode] = useState<string | null>(null);

  // Auto-fill if the typed manualCode matches an existing student in allStudents
  useEffect(() => {
    const clean = manualCode.trim().toLowerCase();
    if (clean.length < 5) return;
    const found = allStudents.find((s) => s.studentCode.trim().toLowerCase() === clean);
    if (found) {
      const fName =
        found.fullName || `${found.title || ''} ${found.firstName} ${found.lastName}`.trim();
      setManualFullName(fName);
      if (found.major) setManualMajor(found.major);
      if (found.yearLevel) setManualYearLevel(found.yearLevel);
      if (found.programType === 'ENGLISH') setManualProgramType('ENGLISH');
      else setManualProgramType('THAI');
    }
  }, [manualCode, allStudents]);

  const filteredCandidates = useMemo(() => {
    return allStudents.filter((s) => {
      if (statusFilter === 'TRANSFER') {
        const st = (s.studyStatus || '').toLowerCase();
        const rm = (s.remarks || '').toLowerCase();
        if (!st.includes('เทียบโอน') && !rm.includes('เทียบโอน')) return false;
      } else if (statusFilter === 'REGULAR') {
        const st = (s.studyStatus || '').toLowerCase();
        if (st.includes('เทียบโอน')) return false;
      }

      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        s.studentCode.toLowerCase().includes(q) ||
        (s.fullName || '').toLowerCase().includes(q) ||
        (s.firstName || '').toLowerCase().includes(q) ||
        (s.lastName || '').toLowerCase().includes(q) ||
        (s.major || '').toLowerCase().includes(q) ||
        (s.nationality || '').toLowerCase().includes(q)
      );
    });
  }, [allStudents, search, statusFilter]);

  if (!isOpen) return null;

  // Handler 1: Submit Manual Form (Upserts student into DB + Enrolls into Course)
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanCode = manualCode.trim();
    const cleanName = manualFullName.trim();

    if (!cleanCode || !cleanName) {
      setFeedback({
        type: 'error',
        text: 'กรุณากรอกทั้ง "รหัสนิสิต" และ "ชื่อ-ฉายา-นามสกุล" ให้ครบถ้วน',
      });
      return;
    }

    setSavingManual(true);
    try {
      // Split name into parts for Student schema compatibility
      const parts = cleanName.split(/\s+/);
      const firstName = parts[0] || cleanName;
      const lastName = parts.slice(1).join(' ') || '';

      const studentPayload: Student = {
        studentCode: cleanCode,
        title: '',
        firstName,
        lastName,
        fullName: cleanName,
        major: manualMajor,
        department: manualMajor,
        faculty: 'คณะพุทธศาสตร์',
        yearLevel: manualYearLevel,
        degree: 'ปริญญาตรี',
        studyStatus: `ปกติ (${enrollmentType})`,
        programType: manualProgramType,
        nationality: manualProgramType === 'ENGLISH' ? 'ต่างชาติ' : 'ไทย',
        remarks: notes
          ? `${enrollmentType}: ${notes}`
          : `${enrollmentType} (เพิ่มโดย ${currentUserName || 'อาจารย์ผู้สอน'})`,
        isActive: true,
      };

      // 1. Upsert into /api/students so the student record & major exist in the database
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'UPSERT',
          items: [studentPayload],
        }),
      });

      // 2. Enroll into this course via /api/enrollments
      const enrollRes = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode,
          courseName,
          studentCode: cleanCode,
          studentName: cleanName,
          enrollmentType,
          enrolledBy: currentUserName || 'อาจารย์ผู้สอน',
          notes: notes ? `${manualMajor} | ${notes}` : `สาขาวิชา${manualMajor}`,
        }),
      });

      const enrollData = await enrollRes.json();
      if (enrollData.success && enrollData.data) {
        setFeedback({
          type: 'success',
          text: `บันทึกและเพิ่ม "${cleanName}" (${cleanCode} • สาขาวิชา${manualMajor}) เข้าบัญชีรายชื่อวิชานี้เรียบร้อยแล้ว!`,
        });
        setManualCode('');
        setManualFullName('');
        onEnrolledSuccess(enrollData.data, studentPayload);
      } else {
        setFeedback({
          type: 'error',
          text: enrollData.error || 'เกิดข้อผิดพลาดในการบันทึกเข้าห้องเรียน',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message,
      });
    } finally {
      setSavingManual(false);
    }
  };

  // Handler 2: Enroll existing student from Search DB tab
  const handleEnrollExisting = async (student: Student) => {
    setSubmittingCode(student.studentCode);
    setFeedback(null);

    const sName =
      student.fullName || `${student.title || ''}${student.firstName} ${student.lastName}`.trim();

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode,
          courseName,
          studentCode: student.studentCode,
          studentName: sName,
          enrollmentType,
          enrolledBy: currentUserName || 'อาจารย์ผู้สอน',
          notes,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setFeedback({
          type: 'success',
          text: `เพิ่ม ${sName} (${student.studentCode}) เข้าห้องเรียนวิชานี้เรียบร้อยแล้ว`,
        });
        onEnrolledSuccess(data.data, student);
      } else {
        setFeedback({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการบันทึก' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message });
    } finally {
      setSubmittingCode(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                ➕ เพิ่มรายชื่อนิสิตเข้าห้องเรียน (สำหรับเทียบโอน / เดินเรียน)
              </h3>
              <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  วิชา: <strong>{courseCode}</strong> — {courseName}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-5 pt-3 bg-slate-50 border-b border-slate-200 flex gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('MANUAL_FORM')}
            className={`px-4 py-2.5 rounded-t-xl border-t border-x flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'MANUAL_FORM'
                ? 'bg-white text-orange-700 border-slate-200 shadow-2xs -mb-px'
                : 'bg-slate-100/70 text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>1. กรอกเพิ่มรหัส • ชื่อนิสิต • สาขาวิชา (กำหนดเอง)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SEARCH_DB')}
            className={`px-4 py-2.5 rounded-t-xl border-t border-x flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'SEARCH_DB'
                ? 'bg-white text-orange-700 border-slate-200 shadow-2xs -mb-px'
                : 'bg-slate-100/70 text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. ค้นหาจากทะเบียนนิสิตในระบบ ({allStudents.length})</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-5 mt-4 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* TAB 1: MANUAL FORM (กรอกเพิ่ม รหัสนิสิต + ชื่อ-ฉายา-นามสกุล + สาขาวิชา) */}
        {activeTab === 'MANUAL_FORM' ? (
          <form onSubmit={handleManualSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 text-[11px] leading-relaxed">
              💡 <strong>คำแนะนำ:</strong> อาจารย์สามารถพิมพ์ <strong>รหัสนิสิต</strong>,{' '}
              <strong>ชื่อ-ฉายา-นามสกุล</strong> และเลือก <strong>สาขาวิชา</strong>{' '}
              สำหรับนิสิตเทียบโอนหรือนิสิตเดินเรียนได้โดยตรง ระบบจะจัดกลุ่มเข้าสาขาวิชาและเรียงลำดับรหัสนิสิตให้โดยอัตโนมัติทั้งในหน้าเช็คชื่อ สรุปสิทธิ์สอบ และใบกรอกคะแนน A4
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4">
                <label className="font-extrabold text-slate-800 block mb-1">
                  รหัสนิสิต 10 หลัก <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="เช่น 6801501088"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="sm:col-span-8">
                <label className="font-extrabold text-slate-800 block mb-1">
                  ชื่อ - ฉายา - นามสกุล <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={manualFullName}
                  onChange={(e) => setManualFullName(e.target.value)}
                  placeholder="เช่น พระมหาสมชาย ญาณวโร หรือ นายสมศักดิ์ รักเรียน"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>
            </div>

            {/* Major Selector (4 Official Majors) */}
            <div>
              <label className="font-extrabold text-slate-800 block mb-1.5">
                เลือกสาขาวิชาของนิสิต (สำหรับจัดกลุ่มเรียงลำดับในใบเช็คชื่อ & ใบเกรด A4):{' '}
                <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MAJOR_OPTIONS.map((m) => {
                  const selected = manualMajor === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setManualMajor(m.id)}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        selected
                          ? 'bg-orange-600 text-white border-orange-700 shadow-xs font-bold'
                          : 'bg-white hover:bg-orange-50/50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">{m.labelTh}</div>
                        <div
                          className={`text-[10px] ${
                            selected ? 'text-orange-100' : 'text-slate-400'
                          }`}
                        >
                          {m.labelEn}
                        </div>
                      </div>
                      {selected && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Program, Year Level, Enrollment Type & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">หลักสูตร (Program):</label>
                <select
                  value={manualProgramType}
                  onChange={(e) => setManualProgramType(e.target.value as 'THAI' | 'ENGLISH')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  <option value="THAI">🇹🇭 ภาคภาษาไทย (ปกติ)</option>
                  <option value="ENGLISH">🌐 ภาคภาษาอังกฤษ (Inter)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ชั้นปีของนิสิต:</label>
                <select
                  value={manualYearLevel}
                  onChange={(e) => setManualYearLevel(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  <option value={1}>ชั้นปีที่ 1</option>
                  <option value={2}>ชั้นปีที่ 2</option>
                  <option value={3}>ชั้นปีที่ 3</option>
                  <option value={4}>ชั้นปีที่ 4</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ประเภทการเรียน:</label>
                <select
                  value={enrollmentType}
                  onChange={(e) => setEnrollmentType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  <option value="เทียบโอน / เดินเรียน">เทียบโอน / เดินเรียน (Transfer)</option>
                  <option value="ลงทะเบียนเรียนซ้ำ (Retake)">ลงทะเบียนเรียนซ้ำ (Retake)</option>
                  <option value="วิชาเลือกเสรี / เรียนร่วม (Cross-enroll)">
                    เรียนร่วมต่างสาขา (Cross-enroll)
                  </option>
                  <option value="นิสิตพิเศษ / ฟังการบรรยาย (Audit)">นิสิตพิเศษ (Audit)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                หมายเหตุเพิ่มเติม (ถ้ามี):
              </label>
              <input
                type="text"
                placeholder="เช่น เทียบโอนเดินเรียนกับชั้นปีที่ 1, เรียนเก็บหน่วยกิตเพิ่ม..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="submit"
                disabled={savingManual}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-extrabold shadow-md flex items-center gap-2 cursor-pointer transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {savingManual
                    ? 'กำลังบันทึกข้อมูล...'
                    : '➕ บันทึกและเพิ่มเข้าบัญชีรายชื่อวิชานี้'}
                </span>
              </button>
            </div>
          </form>
        ) : (
          /* TAB 2: SEARCH EXISTING STUDENTS IN DB */
          <>
            {/* Configuration Row: Enrollment Type & Notes */}
            <div className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ประเภทการลงทะเบียน / กรณีพิเศษ:
                </label>
                <select
                  value={enrollmentType}
                  onChange={(e) => setEnrollmentType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="เทียบโอน / เดินเรียน">เทียบโอน / เดินเรียน (Transfer)</option>
                  <option value="ลงทะเบียนเรียนซ้ำ (Retake)">
                    ลงทะเบียนเรียนซ้ำ (Retake / รีเกรด)
                  </option>
                  <option value="วิชาเลือกเสรี / เรียนร่วม (Cross-enroll)">
                    วิชาเลือกเสรี / เรียนร่วม (Cross-enroll)
                  </option>
                  <option value="นิสิตพิเศษ / ฟังการบรรยาย (Audit)">
                    นิสิตพิเศษ / ฟังการบรรยาย (Audit)
                  </option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  หมายเหตุเพิ่มเติม (ถ้ามี):
                </label>
                <input
                  type="text"
                  placeholder="เช่น เทียบโอนเดินเรียน..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-5 pb-3 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
              <div className="relative w-full sm:flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหารหัสนิสิต, ชื่อ-สกุล, หรือสาขาวิชา..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-1 shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ทั้งหมด ({allStudents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('TRANSFER')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 cursor-pointer ${
                    statusFilter === 'TRANSFER'
                      ? 'bg-orange-600 text-white font-bold'
                      : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>กลุ่มเทียบโอน</span>
                </button>
              </div>
            </div>

            {/* Candidate List */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
              {filteredCandidates.length === 0 ? (
                <div className="py-10 text-center space-y-2 text-slate-400 text-xs">
                  <p>ไม่พบนิสิตที่ตรงกับคำค้นหาในระบบ</p>
                  <button
                    type="button"
                    onClick={() => {
                      setManualCode(/^\d+$/.test(search.trim()) ? search.trim() : '');
                      setManualFullName(!/^\d+$/.test(search.trim()) ? search.trim() : '');
                      setActiveTab('MANUAL_FORM');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-600 text-white font-bold text-xs cursor-pointer"
                  >
                    ✍️ คลิกเพื่อกรอกเพิ่มนิสิตใหม่เข้าห้องเรียนโดยตรง
                  </button>
                </div>
              ) : (
                filteredCandidates.slice(0, 50).map((s) => {
                  const isAlreadyEnrolled = currentEnrolledCodes.has(s.studentCode);
                  const isSubmitting = submittingCode === s.studentCode;
                  const isTransfer =
                    (s.studyStatus || '').includes('เทียบโอน') ||
                    (s.remarks || '').includes('เทียบโอน');
                  const sName =
                    s.fullName || `${s.title || ''}${s.firstName} ${s.lastName}`.trim();

                  return (
                    <div
                      key={s.studentCode}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs ${
                        isAlreadyEnrolled
                          ? 'bg-emerald-50/50 border-emerald-200/80 opacity-75'
                          : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                          ปี {s.yearLevel || 1}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>{sName}</span>
                            <span className="font-mono text-slate-500 font-normal">
                              ({s.studentCode})
                            </span>
                            {isTransfer && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
                                เทียบโอน
                              </span>
                            )}
                            {s.programType === 'ENGLISH' ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                                Inter
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                ภาคไทย
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            สาขา: {s.major || s.department || '-'} • สัญชาติ:{' '}
                            {s.nationality || 'ไทย'}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isAlreadyEnrolled ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                            <Check className="w-3.5 h-3.5" />
                            อยู่ในห้องเรียนแล้ว
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEnrollExisting(s)}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>{isSubmitting ? 'กำลังเพิ่ม...' : '➕ เพิ่มเข้าห้อง'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
