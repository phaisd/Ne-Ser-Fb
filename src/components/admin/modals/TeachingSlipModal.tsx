'use client';

import React from 'react';
import { FileText, Copy, Printer, BookOpen, Key } from 'lucide-react';
import { UserAccount } from '@/types';

interface TeachingSlipModalProps {
  user: UserAccount | null;
  teachingSlipQr: string | null;
  getCoursesForInstructor: (user: UserAccount) => any[];
  onCopyLineMessage: (user: UserAccount) => void;
  onClose: () => void;
}

export const TeachingSlipModal: React.FC<TeachingSlipModalProps> = ({
  user,
  teachingSlipQr,
  getCoursesForInstructor,
  onCopyLineMessage,
  onClose,
}) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto space-y-4 print:shadow-none print:border-none print:max-h-none print:w-full">
        {/* Header toolbar */}
        <div className="flex items-center justify-between border-b pb-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                บัตรแจ้งภาระงานสอนและรหัสผ่านเข้าสู่ระบบ (Official Teaching Slip)
              </h3>
              <p className="text-xs text-slate-500">
                สำหรับส่งมอบให้อาจารย์ผู้สอนประจำรายวิชา ภาคการศึกษาที่ 1 ปีการศึกษา 2569
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCopyLineMessage(user)}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-600" />
              <span>คัดลอกส่ง LINE</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์บัตร (Print/PDF)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="space-y-6 border border-slate-200 rounded-2xl p-6 sm:p-8 bg-slate-50/30 print:border-none print:p-0">
          {/* Document Header */}
          <div className="text-center space-y-1 border-b border-slate-200 pb-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 font-bold text-xl shadow-inner mb-2">
              ☸️
            </div>
            <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">
              คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
            </h4>
            <p className="text-xs text-slate-600 font-semibold">
              หนังสือแจ้งภาระงานสอนและข้อมูลบัญชีเข้าสู่ระบบตรวจเข้าเรียน ประจำปีการศึกษา 2569
            </p>
          </div>

          {/* Instructor Information Card */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 font-medium">อาจารย์ผู้สอน:</span>{' '}
                <strong className="text-slate-900 text-sm">{user.name}</strong>
                {user.nameEn && (
                  <div className="text-[11px] text-slate-500">{user.nameEn}</div>
                )}
              </div>
              <div>
                <span className="text-slate-400 font-medium">สังกัดภาควิชา:</span>{' '}
                <strong className="text-slate-800">{user.department || 'คณะพุทธศาสตร์ มจร.'}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-medium">อีเมลมหาวิทยาลัย (@mcu.ac.th):</span>{' '}
                <span className="font-mono font-bold text-indigo-700">{user.email}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Gmail สำรอง:</span>{' '}
                <span className="font-mono text-slate-600">{user.gmail || '-'}</span>
              </div>
            </div>
          </div>

          {/* Teaching Assignments Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>รายวิชาที่รับผิดชอบบรรยายในภาคเรียนนี้:</span>
              </span>
              <span className="text-slate-500 font-normal">
                (ทั้งภาคภาษาไทยและหลักสูตรนานาชาติ)
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 w-10 text-center">ลำดับ</th>
                    <th className="px-3 py-2 w-24">รหัสวิชา</th>
                    <th className="px-3 py-2">ชื่อรายวิชา</th>
                    <th className="px-3 py-2 text-center w-16">ชั้นปี</th>
                    <th className="px-3 py-2 text-center w-28">วัน-เวลาเรียน</th>
                    <th className="px-3 py-2 text-center w-24">ห้องเรียน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const courses = getCoursesForInstructor(user);
                    if (courses.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-400">
                            ไม่พบรายวิชาที่ระบุชื่อผู้สอนในตารางสอนภาคเรียนนี้
                          </td>
                        </tr>
                      );
                    }
                    return courses.map((c: any, i: number) => {
                      const isEn = /inter|eng|english|นานาชาติ/i.test(c.timetableTitle || '') || /^[A-Za-z0-9\s:,-]+$/.test(c.courseName);
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-center font-mono text-slate-400">{i + 1}</td>
                          <td className="px-3 py-2 font-mono font-bold text-indigo-700">{c.courseCode}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">
                            <div>{c.courseName}</div>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${isEn ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {isEn ? '🌐 International (EN)' : '🇹🇭 ภาคไทย'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center font-semibold">ปี {c.yearLevel || 1}</td>
                          <td className="px-3 py-2 text-center font-mono text-[11px]">{c.startTime || '-'}-{c.endTime || '-'} น.</td>
                          <td className="px-3 py-2 text-center font-bold text-slate-700">{c.room || '-'}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Login Credentials & QR Access Box */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="space-y-1.5 flex-1">
              <div className="font-extrabold text-emerald-950 text-sm flex items-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-600" />
                <span>ข้อมูลเข้าสู่ระบบตรวจเช็คชื่อนิสิต (Attendance System)</span>
              </div>
              <div className="space-y-1 text-slate-700">
                <div>
                  • ลิงก์เข้าใช้งาน: <strong className="font-mono text-purple-700">http://localhost:3020/attendance</strong>
                </div>
                <div>
                  • ชื่อผู้ใช้ (Username): <strong className="font-mono text-slate-900">{user.email}</strong>
                </div>
                <div>
                  • รหัสผ่านเริ่มต้น (Default Password): <strong className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">{user.defaultPassword || 'mcu123456'}</strong>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  * อาจารย์สามารถกดปุ่ม <strong>"เข้าสู่ระบบด้วย Google / บัญชี มจร."</strong> ได้โดยตรงโดยไม่ต้องกรอกรหัสผ่าน
                </div>
              </div>
            </div>

            {teachingSlipQr && (
              <div className="text-center shrink-0 p-2 bg-white rounded-xl border border-emerald-200 shadow-sm">
                <img src={teachingSlipQr} alt="QR Code เข้าระบบ" className="w-24 h-24 mx-auto" />
                <div className="text-[10px] font-bold text-slate-600 mt-1">สแกนเข้าสู่ระบบ</div>
              </div>
            )}
          </div>

          {/* Sign-off box for print */}
          <div className="grid grid-cols-2 gap-8 pt-6 mt-6 text-xs text-slate-800 text-center border-t border-slate-200">
            <div className="space-y-8">
              <div>ลงชื่อ..................................................................</div>
              <div>( {user.name} )<br /><span className="text-slate-500">อาจารย์ผู้รับทราบภาระงานสอน</span></div>
            </div>
            <div className="space-y-8">
              <div>ลงชื่อ..................................................................</div>
              <div>( พระครูสุธีกิตติบัณฑิต, รศ.ดร. )<br /><span className="text-slate-500">คณบดีคณะพุทธศาสตร์</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
