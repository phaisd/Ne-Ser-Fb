'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  ExternalLink,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  ChevronDown,
  Check,
  Archive,
} from 'lucide-react';
import { Student } from '@/types';
import { maskPassport } from '@/lib/utils';
import { StudentImportModal, ArchivedStudentsModal } from '../modals';

interface AdminStudentsTabProps {
  studentsCount: { total: number; thai: number; intl: number };
  filteredStudents: Student[];
  allStudents?: Student[];
  onRefresh?: () => void;
  studentSearch: string;
  setStudentSearch: (val: string) => void;
  studentProgramFilter: string;
  setStudentProgramFilter: (val: any) => void;
  studentStatusFilter: string;
  setStudentStatusFilter: (val: string) => void;
  studentYearFilter: string;
  setStudentYearFilter: (val: string) => void;
  unmaskPassport: boolean;
  setUnmaskPassport: (val: boolean) => void;
  adminSelectedStudentCodes: Set<string>;
  setAdminSelectedStudentCodes: (val: Set<string>) => void;
  isAllAdminStudentsSelected: boolean;
  toggleSelectAllAdminStudents: () => void;
  toggleSelectAdminStudent: (code: string) => void;
  openPromotionModal: () => void;
  openDeleteBulkStudentsModal: () => void;
  openDeleteSingleStudentModal: (student: Student) => void;
}

export const AdminStudentsTab: React.FC<AdminStudentsTabProps> = ({
  studentsCount,
  filteredStudents,
  allStudents = [],
  onRefresh,
  studentSearch,
  setStudentSearch,
  studentProgramFilter,
  setStudentProgramFilter,
  studentStatusFilter,
  setStudentStatusFilter,
  studentYearFilter,
  setStudentYearFilter,
  unmaskPassport,
  setUnmaskPassport,
  adminSelectedStudentCodes,
  setAdminSelectedStudentCodes,
  isAllAdminStudentsSelected,
  toggleSelectAllAdminStudents,
  toggleSelectAdminStudent,
  openPromotionModal,
  openDeleteBulkStudentsModal,
  openDeleteSingleStudentModal,
}) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  const exportStudentsToCSV = (list: Student[], filename: string) => {
    const headers = [
      'รหัสนิสิต',
      'คำนำหน้า',
      'ชื่อ',
      'นามสกุล',
      'หลักสูตร',
      'สาขาวิชา',
      'คณะ',
      'ชั้นปี',
      'สัญชาติ',
      'เลขประจำตัวประชาชน/Passport',
      'สถานภาพ',
      'เกรดเฉลี่ยสะสม (GPA)',
      'ที่อยู่',
      'เบอร์โทรศัพท์',
      'อีเมล',
    ];

    const rows = list.map((s) => [
      `"${s.studentCode || ''}"`,
      `"${s.title || ''}"`,
      `"${s.firstName || ''}"`,
      `"${s.lastName || ''}"`,
      `"${s.programType === 'ENGLISH' ? 'International' : 'Regular'}"`,
      `"${s.major || ''}"`,
      `"${s.faculty || ''}"`,
      `"${s.yearLevel || ''}"`,
      `"${s.nationality || ''}"`,
      `"${s.passportNo || ''}"`,
      `"${s.studyStatus || ''}"`,
      `"${s.gpa || ''}"`,
      `"${(s.address || '').replace(/"/g, '""')}"`,
      `"${s.phoneNumber || ''}"`,
      `"${s.email || ''}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            ระบบทะเบียนนิสิต (Student Directory & Registry)
          </h2>
          <p className="text-xs text-slate-500">
            ข้อมูลทะเบียนนิสิตทั้งหมด {studentsCount.total} รูป/คน (ภาคภาษาไทย {studentsCount.thai} • ภาคภาษาอังกฤษ {studentsCount.intl})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Import Button */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            title="นำเข้าข้อมูลนิสิตจากไฟล์ Excel / CSV หรือวางข้อความ"
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
              title="ส่งออกรายชื่อนิสิตเป็นไฟล์ Excel / CSV"
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
                    เลือกรูปแบบการส่งออก (UTF-8 BOM สำหรับ Excel)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const list = allStudents.length > 0 ? allStudents : filteredStudents;
                      exportStudentsToCSV(list, `students_all_${new Date().toISOString().slice(0, 10)}.csv`);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
                  >
                    <span>📄 ส่งออกทั้งหมด</span>
                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                      {studentsCount.total} คน
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportStudentsToCSV(filteredStudents, `students_filtered_${new Date().toISOString().slice(0, 10)}.csv`);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 transition flex items-center justify-between cursor-pointer"
                  >
                    <span>🔍 ส่งออกตามตัวกรองที่แสดง</span>
                    <span className="font-mono text-[10px] bg-amber-50 px-1.5 py-0.5 rounded text-amber-700 font-bold border border-amber-200">
                      {filteredStudents.length} คน
                    </span>
                  </button>
                  {adminSelectedStudentCodes.size > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const baseList = allStudents.length > 0 ? allStudents : filteredStudents;
                        const selectedList = baseList.filter((s) => adminSelectedStudentCodes.has(s.studentCode));
                        exportStudentsToCSV(selectedList, `students_selected_${new Date().toISOString().slice(0, 10)}.csv`);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-800 transition flex items-center justify-between cursor-pointer font-bold border-t border-slate-100"
                    >
                      <span>✅ ส่งออกเฉพาะที่เลือก</span>
                      <span className="font-mono text-[10px] bg-rose-100 px-1.5 py-0.5 rounded text-rose-800">
                        {adminSelectedStudentCodes.size} คน
                      </span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Archived Students Button */}
          <button
            type="button"
            onClick={() => setIsArchiveModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
            title="เปิดดูแฟ้มประวัตินิสิตที่ถูกลบ/จำหน่ายออก และกู้คืนข้อมูล (Google Sheets: Students_Archive)"
          >
            <Archive className="w-3.5 h-3.5 text-amber-700" />
            <span>📁 แฟ้มประวัติที่ถูกลบ</span>
          </button>

          <button
            type="button"
            onClick={openPromotionModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            <span>🎓 เลื่อนชั้นปี</span>
          </button>
          <Link
            href="/students"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition cursor-pointer"
          >
            <span>จอเต็มรูปแบบ</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัสนิสิต, ชื่อ-สกุล, สัญชาติ หรือ Passport..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {/* Program Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold w-full md:w-auto shrink-0">
            <button
              onClick={() => setStudentProgramFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                studentProgramFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              ทุกหลักสูตร
            </button>
            <button
              onClick={() => setStudentProgramFilter('THAI')}
              className={`px-3 py-1.5 rounded-lg transition ${
                studentProgramFilter === 'THAI' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700'
              }`}
            >
              🇹🇭 ภาคไทย
            </button>
            <button
              onClick={() => setStudentProgramFilter('ENGLISH')}
              className={`px-3 py-1.5 rounded-lg transition ${
                studentProgramFilter === 'ENGLISH' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-700'
              }`}
            >
              🌐 ภาคอังกฤษ (EN)
            </button>
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <select
            value={studentStatusFilter}
            onChange={(e) => setStudentStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="ALL">สถานภาพ: ทั้งหมด</option>
            <option value="กำลังศึกษา">กำลังศึกษา (ปกติ)</option>
            <option value="ย้ายเข้า">ย้ายเข้า</option>
            <option value="ย้ายออก">ย้ายออก</option>
            <option value="เทียบโอน">เทียบโอน</option>
            <option value="สำเร็จการศึกษา">สำเร็จการศึกษา</option>
          </select>

          <select
            value={studentYearFilter}
            onChange={(e) => setStudentYearFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="ALL">ชั้นปี: ทั้งหมด</option>
            <option value="1">ชั้นปีที่ 1</option>
            <option value="2">ชั้นปีที่ 2</option>
            <option value="3">ชั้นปีที่ 3</option>
            <option value="4">ชั้นปีที่ 4</option>
          </select>

          <button
            type="button"
            onClick={() => setUnmaskPassport(!unmaskPassport)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ml-auto cursor-pointer ${
              unmaskPassport
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {unmaskPassport ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>{unmaskPassport ? 'แสดง Passport เต็ม' : '🔒 ซ่อนเลข Passport (PDPA)'}</span>
          </button>

          <span className="text-slate-400 font-medium">
            แสดง {filteredStudents.length} รายการ
          </span>
        </div>
      </div>

      {/* Bulk Deletion Action Banner */}
      {adminSelectedStudentCodes.size > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-rose-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
              {adminSelectedStudentCodes.size}
            </span>
            <div>
              <div className="text-xs font-bold text-rose-900">
                เลือกนิสิต {adminSelectedStudentCodes.size} รูป/คน
              </div>
              <div className="text-[11px] text-rose-600">
                สามารถเลือกดำเนินการลบข้อมูลนิสิตตัวอย่างหรือข้อมูลที่ไม่ต้องการออกยกชุดได้ทันที
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAdminSelectedStudentCodes(new Set())}
              className="text-xs text-rose-700 hover:text-rose-900 underline font-semibold ml-2 cursor-pointer"
            >
              ยกเลิกการเลือก
            </button>
          </div>
          <button
            type="button"
            onClick={openDeleteBulkStudentsModal}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>🗑️ ลบนิสิตที่เลือกยกชุด ({adminSelectedStudentCodes.size} คน)</span>
          </button>
        </div>
      )}

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
              <tr>
                <th className="px-3.5 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllAdminStudentsSelected}
                    onChange={toggleSelectAllAdminStudents}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    title={isAllAdminStudentsSelected ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมดที่แสดง'}
                  />
                </th>
                <th className="px-4 py-3.5">รหัสนิสิต</th>
                <th className="px-4 py-3.5">ชื่อ - นามสกุล</th>
                <th className="px-4 py-3.5">สัญชาติ / Passport</th>
                <th className="px-4 py-3.5">หลักสูตร / ชั้นปี</th>
                <th className="px-4 py-3.5 text-center">สถานภาพ</th>
                <th className="px-4 py-3.5 text-center">เกรด (GPA)</th>
                <th className="px-4 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    ไม่พบข้อมูลนิสิตตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredStudents.slice(0, 100).map((s, idx) => {
                  const isEnglish = s.programType === 'ENGLISH' || (s.nationality !== 'ไทย' && s.nationality !== 'Thai' && Boolean(s.passportNo));
                  const isSelected = adminSelectedStudentCodes.has(s.studentCode);

                  return (
                    <tr
                      key={`${s.studentCode || s.id || 'stu'}-${idx}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td className="px-3.5 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectAdminStudent(s.studentCode)}
                          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5 font-mono font-extrabold text-sm text-orange-700 tracking-tight whitespace-nowrap">
                        {s.studentCode}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        <div>{s.fullName || `${s.firstName || ''} ${s.lastName || ''}`}</div>
                        <div className="text-[11px] text-slate-400">{s.email || '-'}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-700 font-medium">
                          {s.nationality === 'ไทย' || s.nationality === 'Thai' ? '🇹🇭 ไทย' : `🌐 ${s.nationality || 'ต่างชาติ'}`}
                        </div>
                        {s.passportNo && (
                          <div className="font-mono text-[11px] text-purple-700">
                            Pass: {maskPassport(s.passportNo, unmaskPassport)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isEnglish
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isEnglish ? '🌐 EN Program' : '🇹🇭 ภาคไทย'}
                        </span>
                        <span className="ml-1.5 text-slate-500 text-[11px]">
                          ปี {s.yearLevel || 1}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            s.studyStatus === 'สำเร็จการศึกษา'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : s.studyStatus === 'ย้ายออก'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : s.studyStatus === 'ย้ายเข้า'
                              ? 'bg-sky-100 text-sky-800 border-sky-200'
                              : s.studyStatus === 'เทียบโอน'
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {s.studyStatus || 'ปกติ'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                        {s.gpa ? Number(s.gpa).toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <Link
                            href={`/students?search=${s.studentCode}&edit=true`}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 transition inline-flex items-center gap-1"
                          >
                            <span>แก้ไข</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openDeleteSingleStudentModal(s)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition inline-flex items-center gap-1 cursor-pointer"
                            title="ลบนิสิตท่านนี้ออกจากระบบ"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>ลบ</span>
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
        {filteredStudents.length > 100 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
            แสดง 100 รายการแรกจากทั้งหมด {filteredStudents.length} รายการ (ใช้ช่องค้นหาเพื่อค้นหานิสิตที่ต้องการ)
          </div>
        )}
      </div>

      {/* Student Import Modal */}
      <StudentImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingStudents={allStudents.length > 0 ? allStudents : filteredStudents}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

      {/* Archived Students Modal (Google Sheets: Students_Archive) */}
      <ArchivedStudentsModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onStudentRestored={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
