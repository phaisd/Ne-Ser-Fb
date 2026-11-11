'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Copy, Printer, BookOpen, Key, Calendar, SlidersHorizontal, CheckCircle2, UserCheck, PenTool } from 'lucide-react';
import { SignatoryItem, SystemSettings, UserAccount } from '@/types';
import { TeachingSlipCourseRow } from '@/lib/utils';

type SignMode = 'OFFICER' | 'ADMIN' | 'DEAN' | 'ONLY_INSTRUCTOR' | 'NONE';

interface TeachingSlipModalProps {
  user: UserAccount | null;
  teachingSlipQr: string | null;
  availableAcademicYears?: string[];
  getCoursesForInstructor: (user: UserAccount, year?: string, semester?: string) => TeachingSlipCourseRow[];
  onCopyLineMessage: (user: UserAccount, year?: string, semester?: string) => void;
  onClose: () => void;
  settings?: Partial<SystemSettings>;
  signatories?: SignatoryItem[];
  adminName?: string;
}

export const TeachingSlipModal: React.FC<TeachingSlipModalProps> = ({
  user,
  teachingSlipQr,
  availableAcademicYears = ['2569'],
  getCoursesForInstructor,
  onCopyLineMessage,
  onClose,
  settings,
  signatories,
  adminName,
}) => {
  const [selectedYear, setSelectedYear] = useState<string>(
    availableAcademicYears.length > 0 ? availableAcademicYears[0] : '2569'
  );
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [signMode, setSignMode] = useState<'OFFICER' | 'ADMIN' | 'DEAN' | 'ONLY_INSTRUCTOR' | 'NONE'>('OFFICER');
  const [customSignerName, setCustomSignerName] = useState<string>('');

  useEffect(() => {
    if (availableAcademicYears.length > 0 && !availableAcademicYears.includes(selectedYear) && selectedYear !== 'ALL') {
      setSelectedYear(availableAcademicYears[0]);
    }
  }, [availableAcademicYears]);

  if (!user) return null;

  const courses = getCoursesForInstructor(user, selectedYear, selectedSemester);

  const academicYearText = selectedYear === 'ALL' ? 'ทุกปีการศึกษา' : `ปีการศึกษา ${selectedYear}`;
  const semesterText =
    selectedSemester === 'ALL'
      ? 'ทุกภาคการศึกษา'
      : `ภาคการศึกษาที่ ${selectedSemester}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto space-y-4 print:shadow-none print:border-none print:max-h-none print:w-full">
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                บัตรแจ้งภาระงานสอนและรหัสผ่านเข้าสู่ระบบ (Official Teaching Slip)
              </h3>
              <p className="text-xs text-slate-500">
                สำหรับส่งมอบให้อาจารย์ผู้สอน {semesterText} {academicYearText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onCopyLineMessage(user, selectedYear, selectedSemester)}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer"
              title="คัดลอกข้อความภาระงานสอนประจำปีการศึกษาและภาคเรียนนี้สำหรับส่ง LINE"
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

        {/* Academic Year, Semester & Sign-off Selector Controls (Interactive on Screen, Hidden on Print) */}
        <div className="p-3 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-slate-50 rounded-2xl border border-sky-200/80 space-y-2.5 text-xs print:hidden shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <SlidersHorizontal className="w-4 h-4 text-sky-600" />
              <span>เลือกปีการศึกษา & ภาคเรียน:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Year Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 font-medium">ปีการศึกษา:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-sky-300 bg-white font-bold text-sky-950 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  {availableAcademicYears.map((yr) => (
                    <option key={yr} value={yr}>
                      ปีการศึกษา {yr} {yr === availableAcademicYears[0] ? '✨ (ปีล่าสุด)' : ''}
                    </option>
                  ))}
                  <option value="ALL">ทุกปีการศึกษา (รวมทั้งหมด)</option>
                </select>
              </div>

              {/* Semester Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 font-medium">ภาคเรียน:</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-sky-300 bg-white font-bold text-sky-950 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="ALL">ทุกภาคเรียน (ภาค 1 และ 2)</option>
                  <option value="1">ภาคการศึกษาที่ 1</option>
                  <option value="2">ภาคการศึกษาที่ 2</option>
                </select>
              </div>
            </div>
          </div>

          {/* Signatory Selector Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-sky-200/60">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <PenTool className="w-4 h-4 text-indigo-600" />
              <span>ผู้ลงนามฝ่ายออกบัตร (ชุดข้อความทางขวา):</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={signMode}
                onChange={(e) => setSignMode(e.target.value as SignMode)}
                className="px-3 py-1.5 rounded-xl border border-indigo-300 bg-white font-bold text-indigo-950 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="OFFICER">🏢 เจ้าหน้าที่บริการการศึกษาและทะเบียน (แนะนำ)</option>
                <option value="ADMIN">💻 ผู้ดูแลระบบสารสนเทศ (System Admin)</option>
                <option value="DEAN">🏛️ คณบดีคณะพุทธศาสตร์ (ผู้บริหาร)</option>
                <option value="ONLY_INSTRUCTOR">👤 แสดงเฉพาะอาจารย์ (ซ่อนช่องขวา)</option>
                <option value="NONE">❌ ซ่อนส่วนลงนามทั้งหมด (ไม่แสดงลายเซ็น)</option>
              </select>

              {(signMode === 'OFFICER' || signMode === 'ADMIN') && (
                <input
                  type="text"
                  placeholder="ระบุชื่อเจ้าหน้าที่ (เว้นว่าง = ขีดเส้นลงนาม)"
                  value={customSignerName}
                  onChange={(e) => setCustomSignerName(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-52"
                />
              )}
            </div>
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
            <p className="text-xs text-slate-700 font-bold">
              หนังสือแจ้งภาระงานสอนและข้อมูลบัญชีเข้าสู่ระบบตรวจเข้าเรียน ประจำ{semesterText} {academicYearText}
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
                <span className="text-slate-400 font-medium">สังกัด / ประเภท:</span>{' '}
                <strong className="text-slate-800">{user.department || 'คณะพุทธศาสตร์ มจร.'}</strong>
                {user.instructorType && (
                  <span className="ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {user.instructorType}
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-400 font-medium">อีเมลเข้าสู่ระบบ:</span>{' '}
                <span className="font-mono font-bold text-indigo-700">{user.email || user.gmail}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Gmail ที่เชื่อมโยง:</span>{' '}
                <span className="font-mono text-slate-600">{user.gmail || '-'}</span>
              </div>
            </div>
          </div>

          {/* Teaching Assignments Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>
                  รายวิชาที่รับผิดชอบบรรยาย ({semesterText} {academicYearText}):
                </span>
              </span>
              <span className="text-slate-500 font-normal">
                (พบ {courses.length} รายวิชา — ครอบคลุมทั้งภาคภาษาไทยและหลักสูตรนานาชาติ)
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 w-10 text-center">ลำดับ</th>
                    <th className="px-3 py-2 w-24">รหัสวิชา</th>
                    <th className="px-3 py-2">ชื่อรายวิชา</th>
                    <th className="px-3 py-2 text-center w-24">ปีการศึกษา/ภาค</th>
                    <th className="px-3 py-2 text-center w-16">ชั้นปี</th>
                    <th className="px-3 py-2 text-center w-28">วัน-เวลาเรียน</th>
                    <th className="px-3 py-2 text-center w-24">ห้องเรียน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 space-y-1">
                        <div className="font-bold text-slate-500">
                          ไม่พบรายวิชาที่ระบุชื่อผู้สอนใน {semesterText} {academicYearText}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          (โปรดเลือกปีการศึกษาอื่น หรือตรวจสอบการนำเข้าตารางสอนในแท็บ &quot;ตารางสอน&quot;)
                        </div>
                      </td>
                    </tr>
                  ) : (
                    courses.map((c, i) => {
                      const isEn =
                        /inter|eng|english|นานาชาติ/i.test(c.timetableTitle || '') ||
                        /^[A-Za-z0-9\s:,-]+$/.test(c.courseName || '');
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-center font-mono text-slate-400">{i + 1}</td>
                          <td className="px-3 py-2 font-mono font-bold text-indigo-700">{c.courseCode}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">
                            <div>{c.courseName}</div>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                isEn ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {isEn ? '🌐 International (EN)' : '🇹🇭 ภาคไทย'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center font-mono text-[11px] font-semibold text-slate-700">
                            {c.semester ? `${c.semester}/` : ''}{c.academicYear || '2569'}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold">ปี {c.yearLevel || 1}</td>
                          <td className="px-3 py-2 text-center font-mono text-[11px]">
                            {c.dayShort ? `${c.dayShort} ` : c.dayLabel ? `${c.dayLabel} ` : ''}
                            {c.startTime || '-'}-{c.endTime || '-'} น.
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-slate-700">{c.room || '-'}</td>
                        </tr>
                      );
                    })
                  )}
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
                  • ลิงก์เข้าใช้งาน:{' '}
                  <strong className="font-mono text-purple-700">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/attendance`
                      : 'https://ne-ser-fb.vercel.app/attendance'}
                  </strong>
                </div>
                <div>
                  • ชื่อผู้ใช้ (Username): <strong className="font-mono text-slate-900">{user.email || user.gmail}</strong>
                </div>
                <div>
                  • รหัสผ่านเริ่มต้น (Default Password): <strong className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">{user.defaultPassword || 'mcu123456'}</strong>
                </div>
                <div>
                  • ผู้ออกเข้าระบบ: <strong className="font-semibold text-slate-900">{adminName || 'ผู้ดูแลระบบ'}</strong>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  * อาจารย์สามารถกดปุ่ม <strong>&quot;เข้าสู่ระบบด้วย Google / บัญชี มจร.&quot;</strong> ได้โดยตรงโดยไม่ต้องกรอกรหัสผ่าน
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
          {signMode !== 'NONE' && (
            <div
              className={`pt-6 mt-6 text-xs text-slate-800 text-center border-t border-slate-200 ${
                signMode === 'ONLY_INSTRUCTOR' ? 'flex justify-center' : 'grid grid-cols-2 gap-8'
              }`}
            >
              {/* Instructor Signature Box */}
              <div className={`space-y-6 ${signMode === 'ONLY_INSTRUCTOR' ? 'max-w-xs w-full' : ''}`}>
                <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 px-1 py-0.5 rounded cursor-text">
                  ลงชื่อ..................................................................
                </div>
                <div className="space-y-1">
                  <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50 px-1 py-0.5 rounded cursor-text">
                    ( {user.name} )
                  </div>
                  <div contentEditable suppressContentEditableWarning className="text-slate-500 font-medium outline-none focus:bg-purple-50 px-1 py-0.5 rounded cursor-text">
                    อาจารย์ผู้รับทราบภาระงานสอน
                  </div>
                </div>
              </div>

              {/* Issuer Signature Box (Right Side) */}
              {signMode !== 'ONLY_INSTRUCTOR' && (
                <div className="space-y-6">
                  <div contentEditable suppressContentEditableWarning className="outline-none focus:bg-purple-50 px-1 py-0.5 rounded cursor-text">
                    ลงชื่อ..................................................................
                  </div>
                  <div className="space-y-1">
                    {signMode === 'DEAN' ? (
                      <>
                        <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50 px-1 py-0.5 rounded cursor-text">
                          ( {(settings?.signerNameTh && settings.signerNameTh !== '-') ? settings.signerNameTh : (signatories?.find((s) => s.id === 'DEAN')?.name || 'พระราชอุดมวัชรเมธี, ผศ.ดร.')} )
                        </div>
                        <div contentEditable suppressContentEditableWarning className="text-slate-500 font-medium outline-none focus:bg-purple-50 px-1 py-0.5 rounded cursor-text">
                          {(settings?.signerTitleTh && settings.signerTitleTh !== '-') ? settings.signerTitleTh : (signatories?.find((s) => s.id === 'DEAN')?.title || 'คณบดีคณะพุทธศาสตร์')}
                        </div>
                      </>
                    ) : signMode === 'ADMIN' ? (
                      <>
                        <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50 px-1 py-0.5 rounded cursor-text">
                          ( {customSignerName.trim() ? customSignerName : 'ผู้ดูแลระบบสารสนเทศ คณะพุทธศาสตร์'} )
                        </div>
                        <div contentEditable suppressContentEditableWarning className="text-slate-500 font-medium outline-none focus:bg-purple-50 px-1 py-0.5 rounded cursor-text">
                          ผู้ดูแลระบบงานบริการการศึกษา
                        </div>
                        <div className="text-[10px] text-slate-400">งานเทคโนโลยีสารสนเทศ คณะพุทธศาสตร์</div>
                      </>
                    ) : (
                      <>
                        <div contentEditable suppressContentEditableWarning className="font-bold outline-none focus:bg-purple-50 px-1 py-0.5 rounded cursor-text">
                          ( {customSignerName.trim() ? customSignerName : '..................................................................'} )
                        </div>
                        <div contentEditable suppressContentEditableWarning className="text-slate-500 font-medium outline-none focus:bg-purple-50 px-1 py-0.5 rounded cursor-text">
                          เจ้าหน้าที่บริการการศึกษาและทะเบียน
                        </div>
                        <div className="text-[10px] text-slate-400">ผู้ออกบัตรแจ้งภาระงานสอนและรหัสผ่าน</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
