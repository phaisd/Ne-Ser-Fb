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
  Building,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export default function CertificatesPage() {
  const requests = universityStore.getRequests();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Module 1 • ทะเบียนและประมวลผลการศึกษา</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">ระบบยื่นขอหนังสือรับรองและคำร้องออนไลน์</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            ยื่นคำร้อง ติดตามสถานะแบบเรียลไทม์ และพิมพ์เอกสาร A4 มาตรฐานพร้อม Verification QR Code
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/requests"
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <FileCheck className="w-4 h-4 text-amber-400" />
            <span>เข้าคิวพิจารณาคำร้อง (เจ้าหน้าที่)</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Submission Section */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">แบบฟอร์มยื่นคำร้องใหม่</h2>
              <p className="text-[11px] text-slate-500">ระบบจะส่งข้อมูลสำเนาลง Google Sheets ทันที</p>
            </div>
          </div>

          <form action={submitCertificateRequestAction} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">รหัสนิสิต (Student ID) *</label>
              <input
                type="text"
                name="studentId"
                defaultValue="65010214"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น 65010214"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล (Full Name) *</label>
              <input
                type="text"
                name="studentName"
                defaultValue="นายธนพัฒน์ สิทธิโชค"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น นายธนพัฒน์ สิทธิโชค"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ประเภทหนังสือรับรอง (Document Type) *</label>
              <select
                name="type"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="STUDENT_STATUS_CERTIFICATE">หนังสือรับรองสถานภาพนิสิต (Certificate of Student Status)</option>
                <option value="OFFICIAL_TRANSCRIPT">ใบรายงานผลการศึกษา (Official Transcript)</option>
                <option value="STUDENT_LOAN_CERTIFICATE">หนังสือรับรองเพื่อยื่นกู้ยืม กยศ./กรอ.</option>
                <option value="MILITARY_DEFERMENT">หนังสือรับรองเพื่อผ่อนผันการเกณฑ์ทหาร</option>
                <option value="LEAVE_REQUEST">คำร้องขอลาเรียน/ลากิจกรณีพิเศษ</option>
                <option value="OTHER">คำร้องทั่วไปอื่นๆ</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">วัตถุประสงค์ในการขอ *</label>
              <textarea
                name="purpose"
                rows={3}
                required
                placeholder="ระบุหน่วยงานและเหตุผล เช่น เพื่อใช้ประกอบการสมัครเข้ารับการฝึกงานภาคฤดูร้อน ณ บริษัท..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">จำนวนฉบับ</label>
                <input
                  type="number"
                  name="copiesCount"
                  defaultValue={1}
                  min={1}
                  max={5}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">การรับเอกสาร</label>
                <select
                  name="deliveryMethod"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="DIGITAL">เอกสารดิจิทัล (PDF)</option>
                  <option value="PICKUP">รับด้วยตนเองที่สำนักทะเบียน</option>
                  <option value="POSTAL">จัดส่งทางไปรษณีย์ EMS</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              ยืนยันการยื่นคำร้อง (Submit Request)
            </button>
          </form>
        </div>

        {/* Request Tracker List Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>รายการคำร้องในระบบ</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs">
                {requests.length} รายการ
              </span>
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>เชื่อมต่อ Google Sheets Auto-Sync</span>
            </div>
          </div>

          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      {req.requestNumber}
                    </span>
                    <span className="text-xs text-slate-500">
                      โดย <strong>{req.studentName}</strong> ({req.studentId})
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {req.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        อนุมัติแล้ว (Approved)
                      </span>
                    )}
                    {req.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        รอการตรวจสอบ (Pending)
                      </span>
                    )}
                    {req.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        ไม่อนุมัติ (Rejected)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{req.titleTh}</h3>
                  <p className="text-xs text-slate-500 italic">{req.titleEn}</p>
                  <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <strong className="text-slate-700">เหตุผล:</strong> {req.purpose}
                  </p>
                </div>

                {req.officerNotes && (
                  <div className="text-xs bg-blue-50 text-blue-800 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>บันทึกจากเจ้าหน้าที่:</strong> {req.officerNotes}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                  <div className="flex items-center gap-3">
                    <span>ยื่นเมื่อ: {formatDateTime(req.createdAt, 'th')}</span>
                    {req.syncedToSheets && (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        ✓ Sheets Synced
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === 'APPROVED' ? (
                      <Link
                        href={`/certificates/${req.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>พิมพ์ฟอร์ม A4 พร้อม QR</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/verify/${req.verificationToken}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200 transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>ลิงก์ตรวจสอบ (Token)</span>
                      </Link>
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
