import { universityStore } from '@/shared/lib/store/university-store';
import { formatDateFull } from '@/shared/lib/locale/date-formatter';
import { generateQrDataUrl } from '@/shared/lib/qr';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, GraduationCap } from 'lucide-react';
import { PrintButton } from '@/shared/components/PrintButton';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CertificatePrintPage({ params }: Props) {
  const { id } = await params;
  const req = universityStore.getCertificateRequestById(id);

  if (!req) {
    notFound();
  }

  const student = req.studentCode ? universityStore.getStudentByCode(req.studentCode) : null;
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${req.id}`;
  const qrDataUrl = await generateQrDataUrl(verifyUrl);

  const fullName = student
    ? `${student.title || ''}${student.firstName} ${student.lastName}`
    : req.requesterName || 'นิสิตมหาวิทยาลัย';

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6">
      {/* Action Toolbar */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center no-print">
        <Link
          href="/certificates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับหน้ารายการคำร้อง</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">เอกสารฉบับทางการ A4</span>
          <PrintButton label="สั่งพิมพ์เอกสาร (Print A4)" />
        </div>
      </div>

      {/* Standard A4 Paper */}
      <div className="max-w-[210mm] mx-auto min-h-[297mm] bg-white border border-slate-300 shadow-xl p-12 sm:p-16 flex flex-col justify-between text-slate-800 print:border-none print:shadow-none print:p-8 print:m-0">
        <div>
          {/* University Crest Header */}
          <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-2xl shadow-inner">
              <GraduationCap className="w-9 h-9" />
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-wide uppercase">
              มหาวิทยาลัยพุทธศาสตร์และดิจิทัลศึกษา
            </h1>
            <p className="text-xs sm:text-sm font-serif tracking-widest text-slate-600 uppercase">
              UNIVERSITY OF BUDDHIST AND DIGITAL SCIENCES
            </p>
            <p className="text-[11px] text-slate-500 font-serif">
              สำนักทะเบียนและประมวลผลการศึกษา • Office of the University Registrar
            </p>
          </div>

          {/* Reference & Date */}
          <div className="mt-8 flex justify-between items-center text-xs">
            <div>
              <p><strong>ที่:</strong> มพด. ๐๖๒๑.๐๓/{req.id}</p>
            </div>
            <div className="text-right">
              <p><strong>ออกให้ ณ วันที่:</strong> {formatDateFull(req.updatedAt || req.createdAt, 'th')}</p>
              <p className="text-[10px] text-slate-500">{formatDateFull(req.updatedAt || req.createdAt, 'en')}</p>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="my-10 text-center space-y-1">
            <h2 className="text-xl font-bold font-serif text-slate-900 underline underline-offset-8 decoration-1">
              {req.certificateTypeName || 'หนังสือรับรอง'}
            </h2>
            <p className="text-xs text-slate-500 font-serif italic uppercase tracking-wider">
              OFFICIAL CERTIFICATION DOCUMENT
            </p>
          </div>

          {/* Body Text */}
          <div className="space-y-6 text-sm leading-relaxed text-justify">
            <p className="indent-12">
              หนังสือฉบับนี้ให้ไว้เพื่อรับรองว่า <strong>{fullName}</strong> รหัสนิสิต <strong>{req.studentCode || '-'}</strong> ปัจจุบันเป็นนิสิตระดับ <strong>{student?.degree || 'ปริญญาตรี'}</strong> ชั้นปีที่ <strong>{student?.yearLevel || 3}</strong> สังกัด <strong>{student?.faculty || 'คณะพุทธศาสตร์'}</strong> ภาควิชา <strong>{student?.department || 'ภาควิชาพระพุทธศาสนา'}</strong> สาขาวิชา <strong>{student?.major || 'สาขาวิชาพระพุทธศาสนา'}</strong> มีสถานภาพการศึกษาเป็น <strong>นิสิตปกติ (STUDY STATUS: {student?.studyStatus || 'ปกติ'})</strong>
            </p>

            <p className="indent-12 text-xs text-slate-600 font-serif leading-relaxed italic">
              This is to officially certify that <strong>{fullName}</strong>, Student ID <strong>{req.studentCode || '-'}</strong>, is currently a registered student in good standing in the <strong>{student?.faculty || 'Faculty of Buddhism'}</strong>, majoring in <strong>{student?.major || 'Buddhist Studies'}</strong>, pursuing a {student?.degree || "Bachelor's Degree"}.
            </p>

            {req.note && (
              <p className="indent-12 text-xs">
                ออกให้ตามความประสงค์ของนิสิต เพื่อ: <strong>{req.note}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Footer, Verification QR & Signature */}
        <div className="pt-8 border-t border-slate-200 mt-12 grid grid-cols-2 gap-6 items-end">
          <div className="flex items-center gap-4">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Verification QR Code"
                className="w-24 h-24 border border-slate-300 p-1 rounded-lg shadow-xs"
              />
            )}
            <div className="text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1 font-semibold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>e-Verification Secured</span>
              </div>
              <p className="font-mono text-[10px] text-slate-600 break-all">{req.id}</p>
              <p className="text-[10px]">สแกนเพื่อตรวจสอบความถูกต้องผ่านระบบทะเบียน</p>
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="h-10 flex items-center justify-center">
              <span className="font-serif italic text-lg text-slate-700 tracking-widest font-semibold border-b border-dashed border-slate-400 pb-1 px-8">
                Phra Khru Suthavaraphirom
              </span>
            </div>
            <p className="font-bold text-xs text-slate-900">(พระครูสุตวราภิรม, ดร.)</p>
            <p className="text-[11px] text-slate-500">ผู้อำนวยการสำนักทะเบียนและประมวลผลการศึกษา</p>
            <p className="text-[10px] text-slate-400">Director of Academic Records</p>
          </div>
        </div>
      </div>
    </div>
  );
}
