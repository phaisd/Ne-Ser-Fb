'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Copy,
  CheckCircle2,
  X,
  Key,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import { Student, SystemSettings } from '@/types';

interface StudentAccessSlipModalProps {
  student: Student | null;
  onClose: () => void;
  settings?: Partial<SystemSettings>;
}

export const StudentAccessSlipModal: React.FC<StudentAccessSlipModalProps> = ({
  student,
  onClose,
  settings,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!student) return;
    const loginUrl = `${window.location.origin}/login?code=${student.studentCode}`;
    QRCode.toDataURL(loginUrl, { width: 180, margin: 1 })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Failed to generate student QR code:', err));
  }, [student]);

  if (!student) return null;

  const displayName =
    [student.title, student.firstName, student.lastName].filter(Boolean).join(' ') ||
    student.fullName ||
    'นิสิตคณะพุทธศาสตร์';

  const defaultPassword = student.password || student.studentCode;
  const username = student.studentCode;
  const studentEmail = student.email || `${student.studentCode}@mcu.ac.th`;
  const programLabel =
    student.programType === 'ENGLISH' || (student.nationality && student.nationality !== 'ไทย' && student.nationality !== 'Thai')
      ? '🌐 หลักสูตรนานาชาติ / ภาษาอังกฤษ (International Program)'
      : '🇹🇭 หลักสูตรภาษาไทย (Thai Program)';

  const handleCopyLine = () => {
    const text = [
      `🔔 [บัตรแจ้งรหัสผ่านเข้าระบบบริการการศึกษา คณะพุทธศาสตร์ มจร]`,
      `👤 นิสิต: ${displayName}`,
      `🆔 รหัสนิสิต: ${student.studentCode}`,
      `🎓 ระดับ/สาขาวิชา: ${student.degree || 'ปริญญาตรี'} - ${student.major || student.curriculumName || 'พระพุทธศาสนา'} (ปี ${student.yearLevel || 1})`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🔑 ข้อมูลเข้าใช้งานระบบ:`,
      `• ชื่อผู้ใช้ (Username): ${username}`,
      `• รหัสผ่านเริ่มต้น (Default Password): ${defaultPassword}`,
      `• ลิงก์เข้าสู่ระบบ: https://ne-ser-fb.vercel.app/login`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `⚠️ คำแนะนำ: กรุณาเปลี่ยนรหัสผ่านส่วนตัวทันทีเมื่อเข้าสู่ระบบครั้งแรกเพื่อความปลอดภัย`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs print:p-0 print:bg-white animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto space-y-4 print:shadow-none print:border-none print:max-h-none print:w-full print:p-0">
        {/* Top Action Toolbar (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-700">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                บัตรแจ้งรหัสผ่านเข้าระบบสำหรับนิสิต (Student Access Card)
              </h3>
              <p className="text-[11px] text-slate-500">
                พิมพ์บัตรแจกนิสิต หรือคัดลอกข้อความส่งทาง LINE สะดวกและปลอดภัย
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer shadow-xs"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกส่ง LINE'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-orange-600/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์บัตร (Print)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div
          id="student-access-slip-print"
          className="border-2 border-dashed border-slate-300 rounded-2xl p-5 sm:p-6 bg-gradient-to-b from-white via-orange-50/20 to-white print:border-slate-800 print:rounded-xl print:p-6 print:m-0 space-y-4"
        >
          {/* Slip Header */}
          <div className="flex items-start justify-between gap-3 border-b-2 border-orange-500/80 pb-3">
            <div className="flex items-center gap-3">
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="MCU Logo"
                  className="w-12 h-12 object-contain rounded-xl p-0.5 bg-white border border-slate-200"
                />
              ) : (
                <span className="text-3xl">{settings?.logoEmoji || '☸️'}</span>
              )}
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                  {settings?.facultyNameTh || 'คณะพุทธศาสตร์'}
                </h4>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {settings?.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}
                </p>
                <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md bg-orange-100 text-orange-900 font-bold text-[10px]">
                  <span>🪪 บัตรแจ้งรหัสผ่านและสิทธิ์เข้าใช้งานระบบบริการการศึกษา</span>
                </div>
              </div>
            </div>

            <div className="text-right text-[10px] text-slate-500 font-mono">
              <div>STUDENT PASS</div>
              <div className="font-bold text-slate-700">{student.studentCode}</div>
            </div>
          </div>

          {/* Student Profile Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-slate-500 text-[11px] block">ชื่อ - ฉายา / นามสกุล:</span>
              <strong className="text-slate-900 text-sm block font-bold mt-0.5">
                {displayName}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 text-[11px] block">รหัสนิสิต (Student ID):</span>
              <strong className="text-orange-700 font-mono text-sm block font-black mt-0.5">
                {student.studentCode}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 text-[11px] block">ระดับการศึกษา / ชั้นปี:</span>
              <span className="text-slate-800 font-semibold block mt-0.5">
                {student.degree || 'ปริญญาตรี'} • ชั้นปีที่ {student.yearLevel || 1}
              </span>
            </div>

            <div>
              <span className="text-slate-500 text-[11px] block">สาขาวิชา / หลักสูตร:</span>
              <span className="text-slate-800 font-semibold block mt-0.5 truncate">
                {student.major || student.curriculumName || 'สาขาวิชาพระพุทธศาสนา'}
              </span>
            </div>

            <div className="sm:col-span-2 text-[11px] text-slate-600">
              <span className="text-slate-500">ภาคภาษา: </span>
              <span className="font-medium">{programLabel}</span>
            </div>
          </div>

          {/* Login Credentials Box + QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center p-4 rounded-xl bg-orange-50/70 border border-orange-200">
            <div className="sm:col-span-2 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-orange-950 text-xs">
                <Key className="w-3.5 h-3.5 text-orange-600" />
                <span>ข้อมูลเข้าสู่ระบบบริการนิสิต (Login Credentials):</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5 pl-1">
                <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-orange-200">
                  <span className="text-slate-500 text-[11px]">ชื่อผู้ใช้ (Username):</span>
                  <span className="font-mono font-bold text-slate-900 text-xs select-all">
                    {username}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-orange-200">
                  <span className="text-slate-500 text-[11px]">รหัสผ่านเริ่มต้น (Default Password):</span>
                  <span className="font-mono font-black text-orange-700 text-xs select-all">
                    {defaultPassword}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-orange-200">
                  <span className="text-slate-500 text-[11px]">อีเมลมหาวิทยาลัย:</span>
                  <span className="font-mono text-slate-700 text-[11px] truncate max-w-[190px]">
                    {studentEmail}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-orange-900/80 pt-0.5 leading-relaxed">
                👉 เข้าใช้งานได้ที่: <span className="font-mono font-bold text-orange-800">https://ne-ser-fb.vercel.app/login</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-orange-200 text-center shadow-xs">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Login QR Code" className="w-24 h-24 object-contain" />
              ) : (
                <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                  กำลังสร้าง QR...
                </div>
              )}
              <span className="text-[9px] font-bold text-slate-600 mt-1">สแกนเข้าสู่ระบบ</span>
            </div>
          </div>

          {/* Security Advisory & Cut Line */}
          <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>กรุณาเก็บรักษารหัสผ่านเป็นความลับ และเปลี่ยนรหัสผ่านส่วนตัวในการใช้งานครั้งแรก</span>
            </div>
            <div className="text-slate-400 font-mono text-[9px]">
              งานบริการการศึกษาและทะเบียน คณะพุทธศาสตร์ มจร
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
