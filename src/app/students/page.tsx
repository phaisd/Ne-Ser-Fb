import { universityStore } from '@/shared/lib/store/university-store';
import { importStudentsFromSheetsAction, exportStudentsToSheetsAction } from '@/modules/students/actions';
import {
  Users,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
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
            <span>Module 5 • ระบบทะเบียนนิสิต & Import/Export Center</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">ทะเบียนนิสิต & ซิงค์ Google Sheets</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            ระบบจัดเก็บแฟ้มประวัตินิสิต และศูนย์กลางเชื่อมต่อข้อมูลสองทาง (Two-Way Sync) กับ Google Sheets
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
              <span>Import จาก Google Sheets (Pull)</span>
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
            <p className="font-bold text-indigo-950">Google Sheets Tab: Students_Master</p>
            <p className="text-[11px] text-slate-500">สามารถกด Pull เพื่อดึงนิสิตใหม่เข้าสู่ระบบ หรือกด Push เพื่อสำเนาข้อมูลขึ้น Cloud Sheets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="font-mono text-slate-700 font-semibold">{students.length} นิสิตพร้อมซิงค์</span>
        </div>
      </div>

      {/* Students Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900">รายชื่อนิสิตในระบบการศึกษา</h2>
          <span className="text-xs text-slate-500">ปีการศึกษา 2569</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">รหัสนิสิต</th>
                <th className="py-3 px-4">ชื่อ-สกุล (TH / EN)</th>
                <th className="py-3 px-4">คณะ / สาขาวิชา</th>
                <th className="py-3 px-4">ชั้นปี</th>
                <th className="py-3 px-4">GPA</th>
                <th className="py-3 px-4">ช่องทางติดต่อ</th>
                <th className="py-3 px-4">สถานะ</th>
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
                      {std.titleTh} {std.firstNameTh} {std.lastNameTh}
                    </p>
                    <p className="text-[11px] text-slate-400 italic">
                      {std.titleEn} {std.firstNameEn} {std.lastNameEn}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">{std.faculty}</p>
                    <p className="text-[11px] text-slate-500">{std.major}</p>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium text-[11px]">
                      ปี {std.yearLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                    {std.gpa.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{std.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{std.phone}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      ปกติ (Active)
                    </span>
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
