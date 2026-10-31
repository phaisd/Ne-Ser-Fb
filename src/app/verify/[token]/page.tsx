import { universityStore } from '@/shared/lib/store/university-store';
import { formatDateFull, formatDateTime } from '@/shared/lib/locale/date-formatter';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, FileText, ArrowLeft, Calendar, User, Building } from 'lucide-react';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function VerifyCertificatePage({ params }: Props) {
  const { token } = await params;
  const req = universityStore.getRequestById(token);

  if (!req) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-rose-200 text-center shadow-lg space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
          ✕
        </div>
        <h1 className="text-lg font-bold text-slate-900">ไม่พบเอกสารในระบบ (Invalid Document)</h1>
        <p className="text-xs text-slate-500">
          รหัส Token ไม่ถูกต้อง หรือเอกสารนี้ไม่ได้ออกโดยระบบบริการมหาวิทยาลัยดิจิทัล
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  const student = universityStore.getStudentByCode(req.studentId);

  return (
    <div className="max-w-2xl mx-auto my-12 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Verification Success Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">เอกสารได้รับการรับรองอย่างถูกต้อง</h1>
          <p className="text-emerald-100 text-xs">
            Authentic Official Document Verified by National Digital University
          </p>
        </div>

        {/* Certificate Details */}
        <div className="p-6 sm:p-8 space-y-6 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            <div>
              <p className="text-slate-400 text-xs">เลขที่คำร้อง / อ้างอิง</p>
              <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{req.requestNumber}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">สถานะการรับรอง</p>
              <p className="font-bold text-emerald-600 flex items-center gap-1 text-sm mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
                {req.status === 'APPROVED' ? 'อนุมัติและมีผลสมบูรณ์' : 'อยู่ระหว่างรอการอนุมัติ'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-slate-400 text-xs">ชื่อเอกสาร (Document Name)</p>
              <p className="font-bold text-slate-900 text-base">{req.titleTh}</p>
              <p className="text-xs text-slate-500 italic">{req.titleEn}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-800">
                  {student ? `${student.titleTh} ${student.firstNameTh} ${student.lastNameTh}` : req.studentName}
                </span>
                <span className="text-xs text-slate-400">({req.studentId})</span>
              </div>
              <p className="text-xs text-slate-600">
                สังกัด: {student?.faculty || 'คณะวิทยาศาสตร์และเทคโนโลยี'} • สาขา: {student?.major || 'วิทยาการคอมพิวเตอร์'}
              </p>
            </div>

            <div>
              <p className="text-slate-400 text-xs">วัตถุประสงค์ในการขอ</p>
              <p className="text-slate-700 mt-1">{req.purpose}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-slate-400 text-xs">วันที่ออกเอกสาร (พ.ศ.)</p>
                <p className="font-medium text-slate-800 mt-0.5">{formatDateFull(req.approvedAt || req.createdAt, 'th')}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Date of Issue (A.D.)</p>
                <p className="font-medium text-slate-800 mt-0.5">{formatDateFull(req.approvedAt || req.createdAt, 'en')}</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้าหลักระบบ</span>
            </Link>

            {req.status === 'APPROVED' && (
              <Link
                href={`/certificates/${req.id}`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                ดูเอกสารต้นฉบับ A4
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
