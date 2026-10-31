import { universityStore } from '@/shared/lib/store/university-store';
import { formatDateTime } from '@/shared/lib/locale/date-formatter';
import { submitCertificateRequestAction } from '@/modules/certificates/actions';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Printer,
  QrCode,
  Send,
  FileCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function CertificatesPage() {
  const requests = universityStore.getCertificateRequests();
  const certTypes = universityStore.getCertificateTypes();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Module 1 • ระบบคำร้องขอหนังสือรับรอง (Certificate Requests)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">ยื่นขอหนังสือรับรองออนไลน์</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            ขอหนังสือรับรองการเป็นนิสิต, หนังสือรับรองความประพฤติ, หนังสือรับรองผ่อนผันการเกณฑ์ทหาร, หรือทรานสคริปต์
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/requests"
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs"
          >
            <FileCheck className="w-4 h-4 text-amber-400" />
            <span>คิวพิจารณาคำร้อง (เจ้าหน้าที่ทะเบียน)</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Submission */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">แบบฟอร์มยื่นคำร้อง</h2>
              <p className="text-[11px] text-slate-500">เชื่อมต่อโครงสร้างจริง table: certificate_requests</p>
            </div>
          </div>

          <form action={submitCertificateRequestAction} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ประเภทหนังสือรับรอง *</label>
              <select
                name="certificateTypeId"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {certTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">รหัสนิสิต (Student Code) *</label>
              <input
                type="text"
                name="studentCode"
                defaultValue="65010214"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล / ฉายา-สมณศักดิ์ *</label>
              <input
                type="text"
                name="requesterName"
                defaultValue="พระมหาธนพัฒน์ โชติปญฺโญ (สิทธิโชค)"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">วัตถุประสงค์การขอ (note) *</label>
              <textarea
                name="note"
                rows={3}
                required
                placeholder="ระบุเหตุผล เช่น ใช้ประกอบการยื่นขอหนังสือเดินทางเพื่อเข้าร่วมการประชุมพุทธศาสนานานาชาติ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              ยืนยันการยื่นคำร้อง (Submit Request)
            </button>
          </form>
        </div>

        {/* Requests List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>ประวัติคำร้องในระบบ</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs">
                {requests.length} รายการ
              </span>
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Auto-Sync to Google Sheets Active</span>
            </div>
          </div>

          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                      {req.id}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      ผู้ขอ: <strong>{req.requesterName}</strong> ({req.studentCode})
                    </span>
                  </div>

                  <div>
                    {req.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        อนุมัติแล้ว (APPROVED)
                      </span>
                    )}
                    {req.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        รอการตรวจสอบ (PENDING)
                      </span>
                    )}
                    {req.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        ปฏิเสธ (REJECTED)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{req.certificateTypeName}</h3>
                  {req.note && (
                    <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong>วัตถุประสงค์ (Note):</strong> {req.note}
                    </p>
                  )}
                  {req.reason && (
                    <div className="mt-2 text-xs bg-rose-50 text-rose-700 p-2.5 rounded-lg border border-rose-100">
                      <strong>เหตุผลที่ไม่อนุมัติ (Reason):</strong> {req.reason}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                  <span>ยื่นเมื่อ: {formatDateTime(req.createdAt, 'th')}</span>

                  <div className="flex items-center gap-2">
                    {req.status === 'APPROVED' ? (
                      <Link
                        href={`/certificates/${req.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>พิมพ์หนังสือรับรองทางการ (A4)</span>
                      </Link>
                    ) : (
                      <span className="text-slate-400 text-[11px]">รอเจ้าหน้าที่อนุมัติ</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
