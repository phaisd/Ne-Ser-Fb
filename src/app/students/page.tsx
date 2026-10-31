import { universityStore } from '@/shared/lib/store/university-store';
import { importStudentsFromSheetsAction, exportStudentsToSheetsAction } from '@/modules/students/actions';
import {
  Users,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Mail,
  Phone,
  GraduationCap,
} from 'lucide-react';

export default function StudentsPage() {
  const students = universityStore.getStudents();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Module 5 • ทะเบียนนิสิต & Import/Export Center (students)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">ทะเบียนนิสิต & ซิงค์ Google Sheets</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            โครงสร้างจริง table: students (พระ, สามเณร, คฤหัสถ์, คณะพุทธศาสตร์, ชั้นปี, study_status)
          </p>
        </div>

        {/* Import & Export Center Buttons (แนวทางที่ 2) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <form action={importStudentsFromSheetsAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-xs transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Import นิสิตจาก Google Sheets (Pull)</span>
            </button>
          </form>

          <form action={exportStudentsToSheetsAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export ไปยัง Google Sheets (Push)</span>
            </button>
          </form>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 p-4 rounded-2xl border border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-indigo-950">Google Sheets Tab: Students_Master (Two-way Synchronized)</p>
            <p className="text-[11px] text-slate-500">รองรับการนำเข้ารายชื่อนิสิตบรรพชิตและคฤหัสถ์ หรือส่งออกรายงานทะเบียนครบทุกคอลัมน์</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="font-mono text-slate-700 font-semibold">{students.length} นิสิตในฐานข้อมูล</span>
        </div>
      </div>

      {/* Students Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900">แฟ้มประวัตินิสิต (Student Directory)</h2>
          <span className="text-xs text-slate-500">มมร./มจร. Buddhist University Registry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">รหัสนิสิต</th>
                <th className="py-3 px-4">คำนำหน้าและชื่อ-สกุล / ฉายา</th>
                <th className="py-3 px-4">คณะ / ภาควิชา / สาขา</th>
                <th className="py-3 px-4">ระดับ / ชั้นปี</th>
                <th className="py-3 px-4">สถานภาพ (study_status)</th>
                <th className="py-3 px-4">ช่องทางติดต่อ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((std) => (
                <tr key={std.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {std.studentCode}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">
                      <span className="text-amber-800 font-medium mr-1">{std.title}</span>
                      {std.firstName} {std.lastName}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">{std.faculty || 'คณะพุทธศาสตร์'}</p>
                    <p className="text-[11px] text-slate-500">{std.major || std.department || '-'}</p>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <p className="font-medium text-slate-800">{std.degree || 'ปริญญาตรี'}</p>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium text-[11px]">
                      ชั้นปีที่ {std.yearLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      {std.studyStatus || 'ปกติ'}
                    </span>
                  </td>
                  <td className="py-3 px-4 space-y-0.5">
                    {std.email && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{std.email}</span>
                      </div>
                    )}
                    {std.phoneNumber && (
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{std.phoneNumber}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
