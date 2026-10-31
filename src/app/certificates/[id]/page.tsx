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
  const req = universityStore.getRequestById(id);

  if (!req) {
    notFound();
  }

  const student = universityStore.getStudentByCode(req.studentId);
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${req.verificationToken}`;
  const qrDataUrl = await generateQrDataUrl(verifyUrl);

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6">
      {/* Top action toolbar (hidden on print) */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center no-print">
        <Link
          href="/certificates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับหน้ารายการ</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">เอกสารฉบับทางการ A4</span>
          <PrintButton label="สั่งพิมพ์เอกสาร (Print A4)" />
        </div>
      </div>

      {/* Standard A4 Paper Container */}
      <div className="max-w-[210mm] mx-auto min-h-[297mm] bg-white border border-slate-300 shadow-xl p-12 sm:p-16 flex flex-col justify-between text-slate-800 print:border-none print:shadow-none print:p-8 print:m-0">
        <div>
          {/* Header & University Crest */}
          <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-2xl shadow-inner">
              <GraduationCap className="w-9 h-9" />
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-wide uppercase">
              มหาวิทยาลัยดิจิทัลแห่งชาติ
            </h1>
            <p className="text-xs sm:text-sm font-serif tracking-widest text-slate-600 uppercase">
              NATIONAL DIGITAL UNIVERSITY OF SCIENCES AND TECHNOLOGY
            </p>
            <p className="text-[11px] text-slate-500">
              สำนักทะเบียนและประมวลผลการศึกษา • Office of the University Registrar
            </p>
          </div>

          {/* Document Reference & Date */}
          <div className="mt-8 flex justify-between items-center text-xs">
            <div>
              <p><strong>ที่ (Ref No.):</strong> อว. 0621.03/{req.requestNumber}</p>
            </div>
            <div className="text-right">
              <p><strong>ออกให้ ณ วันที่:</strong> {formatDateFull(req.approvedAt || req.createdAt, 'th')}</p>
              <p className="text-[10px] text-slate-500">{formatDateFull(req.approvedAt || req.createdAt, 'en')}</p>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="my-10 text-center space-y-1">
            <h2 className="text-xl font-bold font-serif text-slate-900 underline underline-offset-8 decoration-1">
              {req.titleTh}
            </h2>
            <p className="text-xs text-slate-500 font-serif italic uppercase tracking-wider">
              {req.titleEn}
            </p>
          </div>

          {/* Official Body Text (Bilingual) */}
          <div className="space-y-6 text-sm leading-relaxed text-justify">
            <p className="indent-12">
              หนังสือฉบับนี้ให้ไว้เพื่อรับรองว่า <strong>{student ? `${student.titleTh} ${student.firstNameTh} ${student.lastNameTh}` : req.studentName}</strong> รหัสนิสิต <strong>{req.studentId}</strong> เป็นนิสิตระดับปริญญาตรี สังกัด <strong>{student?.faculty || 'คณะวิทยาศาสตร์และเทคโนโลยี'}</strong> สาขาวิชา <strong>{student?.major || 'วิทยาการคอมพิวเตอร์'}</strong> เข้าศึกษาในปีการศึกษา {student?.academicYear || 2565} ปัจจุบันมีสถานภาพเป็น <strong>นิสิตปกติ (ACTIVE STATUS)</strong>
            </p>

            <p className="indent-12 text-xs text-slate-600 font-serif leading-relaxed italic">
              This is to certify that <strong>{student ? `${student.titleEn} ${student.firstNameEn} ${student.lastNameEn}` : req.studentName}</strong>, Student Identification Number <strong>{req.studentId}</strong>, is currently a registered full-time undergraduate student in good standing in the <strong>{student?.faculty || 'Faculty of Science and Technology'}</strong>, majoring in <strong>{student?.major || 'Computer Science'}</strong>, enrolled in the academic year {student?.academicYear ? student.academicYear - 543 : 2022}.
            </p>

            <p className="indent-12 text-xs">
              ออกให้ตามความประสงค์ของนิสิต เพื่อ: <strong>{req.purpose}</strong>
            </p>
          </div>
        </div>

        {/* Footer, Electronic Signature & Verification QR Code */}
        <div className="pt-8 border-t border-slate-200 mt-12 grid grid-cols-2 gap-6 items-end">
          {/* QR Verification Section */}
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
              <p className="font-mono text-[10px] text-slate-600 break-all">{req.verificationToken}</p>
              <p className="text-[10px]">สแกนเพื่อตรวจสอบความถูกต้องของเอกสารฉบับนี้</p>
            </div>
          </div>

          {/* Official Signature */}
          <div className="text-center space-y-2">
            <div className="h-10 flex items-center justify-center">
              <span className="font-serif italic text-lg text-slate-700 tracking-widest font-semibold border-b border-dashed border-slate-400 pb-1 px-8">
                Dr. Panuwat K.
              </span>
            </div>
            <p className="font-bold text-xs text-slate-900">(รองศาสตราจารย์ ดร. ภาณุวัฒน์ กลิ่นเกสร)</p>
            <p className="text-[11px] text-slate-500">นายทะเบียนมหาวิทยาลัยดิจิทัลแห่งชาติ</p>
            <p className="text-[10px] text-slate-400">University Registrar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
