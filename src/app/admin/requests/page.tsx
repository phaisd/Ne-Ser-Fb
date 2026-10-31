import { universityStore } from '@/shared/lib/store/university-store';
import { formatDateTime } from '@/shared/lib/locale/date-formatter';
import { updateCertificateStatusAction } from '@/modules/certificates/actions';
import Link from 'next/link';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  ArrowLeft,
  Check,
  X,
  FileCheck,
} from 'lucide-react';

export default function AdminRequestsPage() {
  const requests = universityStore.getCertificateRequests();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider">
            <FileCheck className="w-4 h-4" />
            <span>เจ้าหน้าที่ทะเบียน • Staff Approval Console</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">คิวตรวจสอบและอนุมัติคำร้องขอหนังสือรับรอง</h1>
          <p className="text-xs text-slate-500">
            โครงสร้างจริง certificate_requests: บันทึกการอนุมัติ/ปฏิเสธ พร้อมซิงค์ Google Sheets อัตโนมัติ
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับแผงควบคุม</span>
        </Link>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">รหัสคำร้อง (ID)</th>
                <th className="py-3 px-4">นิสิตผู้ยื่น</th>
                <th className="py-3 px-4">ประเภทหนังสือรับรอง</th>
                <th className="py-3 px-4">วัตถุประสงค์ (Note)</th>
                <th className="py-3 px-4">วันที่ยื่น</th>
                <th className="py-3 px-4">สถานะ (Status)</th>
                <th className="py-3 px-4 text-right">ดำเนินการ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {req.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{req.requesterName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">รหัส: {req.studentCode}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {req.certificateTypeName}
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate" title={req.note || ''}>
                    {req.note || '-'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                    {formatDateTime(req.createdAt, 'th')}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {req.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" />
                        APPROVED
                      </span>
                    )}
                    {req.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        PENDING
                      </span>
                    )}
                    {req.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3" />
                        REJECTED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {req.status === 'PENDING' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <form action={updateCertificateStatusAction}>
                          <input type="hidden" name="requestId" value={req.id} />
                          <input type="hidden" name="status" value="APPROVED" />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>อนุมัติ</span>
                          </button>
                        </form>

                        <form action={updateCertificateStatusAction}>
                          <input type="hidden" name="requestId" value={req.id} />
                          <input type="hidden" name="status" value="REJECTED" />
                          <input type="hidden" name="reason" value="เอกสารหลักฐานหรือข้อมูลไม่ตรงตามระเบียบการศึกษา" />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold text-xs cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>ปฏิเสธ</span>
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {req.status === 'APPROVED' && (
                          <Link
                            href={`/certificates/${req.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>พิมพ์ A4</span>
                          </Link>
                        )}
                        <span className="text-slate-400 text-[11px]">บันทึกแล้ว</span>
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
