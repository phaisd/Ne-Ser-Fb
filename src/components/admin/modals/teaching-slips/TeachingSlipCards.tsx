'use client';

import React from 'react';
import { Key } from 'lucide-react';
import { TeachingSlipCardProps } from './types';

/* -------------------------------------------------------------
   CARD VARIANT 1: 1:1 Full Sheet A4
   ------------------------------------------------------------- */
export function FullCard({
  user,
  courses,
  qrCodeDataUrl,
  academicYearText,
  semesterText,
  deanName,
  adminName,
  qrScale = 1.5,
}: TeachingSlipCardProps) {
  const attendanceUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/attendance`
      : 'https://ne-ser-fb.vercel.app/attendance';

  return (
    <div className="space-y-4 text-xs text-slate-800">
      <div className="text-center space-y-1 border-b border-slate-200 pb-3">
        <div className="text-2xl">☸️</div>
        <h4 className="font-extrabold text-slate-900 text-base">
          คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
        </h4>
        <p className="text-xs text-slate-700 font-bold">
          หนังสือแจ้งภาระงานสอนและข้อมูลบัญชีเข้าสู่ระบบตรวจเช็คชื่อ ประจำ{semesterText} {academicYearText}
        </p>
      </div>

      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-400 font-medium">อาจารย์ผู้สอน:</span>{' '}
          <strong className="text-slate-900 text-sm">{user.name}</strong>
        </div>
        <div>
          <span className="text-slate-400 font-medium">สังกัด:</span>{' '}
          <strong>{user.department || 'คณะพุทธศาสตร์ มจร.'}</strong>
          {user.instructorType && (
            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              {user.instructorType}
            </span>
          )}
        </div>
        <div>
          <span className="text-slate-400 font-medium">อีเมลเข้าสู่ระบบ:</span>{' '}
          <span className="font-mono font-bold text-indigo-700">{user.email || user.gmail}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium">รหัสผ่านเริ่มต้น:</span>{' '}
          <span className="font-mono font-bold text-emerald-800">{user.defaultPassword || 'mcu123456'}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="font-bold text-slate-800 flex items-center justify-between">
          <span>รายวิชาที่รับผิดชอบบรรยาย ({courses.length} รายวิชา):</span>
        </div>
        <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 border-b">
            <tr>
              <th className="px-2 py-1.5 text-center w-8">#</th>
              <th className="px-2 py-1.5 w-20">รหัสวิชา</th>
              <th className="px-2 py-1.5">ชื่อรายวิชา</th>
              <th className="px-2 py-1.5 text-center w-16">ชั้นปี</th>
              <th className="px-2 py-1.5 text-center w-28">วัน-เวลาเรียน</th>
              <th className="px-2 py-1.5 text-center w-20">ห้องเรียน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-slate-400">
                  ไม่พบรายวิชาในภาคการศึกษานี้
                </td>
              </tr>
            ) : (
              courses.map((c, i) => (
                <tr key={i}>
                  <td className="px-2 py-1.5 text-center text-slate-400">{i + 1}</td>
                  <td className="px-2 py-1.5 font-mono font-bold text-indigo-700">{c.courseCode}</td>
                  <td className="px-2 py-1.5 font-medium">{c.courseName}</td>
                  <td className="px-2 py-1.5 text-center">
                    ปี {c.yearLevel || 1}
                    {c.semester ? ` (ภาค ${c.semester})` : ''}
                  </td>
                  <td className="px-2 py-1.5 text-center font-mono text-[11px]">
                    {c.dayShort ? `${c.dayShort} ` : ''}
                    {c.startTime || '-'}-{c.endTime || '-'} น.
                  </td>
                  <td className="px-2 py-1.5 text-center font-bold">{c.room || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
        <div>
          <div className="font-bold text-emerald-950">ข้อมูลเข้าระบบ: {attendanceUrl}</div>
          <div className="text-slate-600 text-[11px]">
            เข้าสู่ระบบด้วย Username ด้านบน หรือกด &quot;เข้าสู่ระบบด้วย Google / บัญชี มจร.&quot;
          </div>
          <div className="text-slate-700 text-[11px] font-medium pt-1">
            ผู้ออกเข้าระบบ โดย <strong className="text-slate-900">{adminName || 'ผู้ดูแลระบบ'}</strong>
          </div>
        </div>
        {qrCodeDataUrl && (
          <div className="text-center shrink-0">
            <img
              src={qrCodeDataUrl}
              alt="QR"
              style={{
                width: `${Math.round(64 * qrScale)}px`,
                height: `${Math.round(64 * qrScale)}px`,
              }}
              className="border border-emerald-300 rounded-lg bg-white p-1 object-contain shadow-xs inline-block"
            />
            <div className="text-[9px] text-slate-500 font-bold mt-0.5">สแกนเข้าสู่ระบบ</div>
          </div>
        )}
      </div>

      <div className="pt-4 grid grid-cols-2 gap-8 text-center text-xs">
        <div className="space-y-4">
          <div>ลงชื่อ..................................................</div>
          <div>( {user.name} )<br /><span className="text-slate-400 text-[10px]">อาจารย์ผู้รับทราบภาระงานสอน</span></div>
        </div>
        <div className="space-y-4">
          <div>ลงชื่อ..................................................</div>
          <div>( {deanName} )<br /><span className="text-slate-400 text-[10px]">คณบดีคณะพุทธศาสตร์</span></div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   CARD VARIANT 2: 2:1 Half Sheet A5
   ------------------------------------------------------------- */
export function HalfCard({
  user,
  courses,
  qrCodeDataUrl,
  academicYearText,
  semesterText,
  adminName,
  qrScale = 1.5,
}: TeachingSlipCardProps) {
  const attendanceUrl =
    typeof window !== 'undefined' ? `${window.location.host}/attendance` : 'ระบบเช็คชื่อ';

  return (
    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 text-xs text-slate-800 shadow-xs">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">☸️</span>
          <div>
            <h5 className="font-bold text-slate-900 text-[13px]">
              บัตรแจ้งภาระงานสอน คณะพุทธศาสตร์ มจร.
            </h5>
            <p className="text-[10px] text-slate-500 font-medium">
              {semesterText} {academicYearText}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
            {courses.length} วิชา
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg">
        <div>
          <span className="text-slate-500">อาจารย์:</span> <strong className="text-slate-900">{user.name}</strong>
        </div>
        <div>
          <span className="text-slate-500">สังกัด:</span> <strong>{user.department || 'คณะพุทธศาสตร์'}</strong>
          {user.instructorType && (
            <span className="ml-1 text-[9px] font-bold px-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              {user.instructorType}
            </span>
          )}
        </div>
        <div>
          <span className="text-slate-500">อีเมล/User:</span>{' '}
          <strong className="font-mono text-indigo-700">{user.email || user.gmail}</strong>
        </div>
        <div>
          <span className="text-slate-500">รหัสผ่าน:</span>{' '}
          <strong className="font-mono text-emerald-800">{user.defaultPassword || 'mcu123456'}</strong>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[11px] font-bold text-slate-700">รายวิชาที่สอน:</div>
        <table className="w-full text-left text-[11px] border rounded overflow-hidden">
          <thead className="bg-slate-100 text-slate-600 font-semibold text-[10px]">
            <tr>
              <th className="p-1 w-16">รหัสวิชา</th>
              <th className="p-1">ชื่อรายวิชา</th>
              <th className="p-1 text-center w-24">วัน-เวลา</th>
              <th className="p-1 text-center w-16">ห้อง</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.slice(0, 4).map((c, i) => (
              <tr key={i}>
                <td className="p-1 font-mono font-bold text-indigo-700">{c.courseCode}</td>
                <td className="p-1 truncate max-w-[180px]">
                  {c.courseName}
                  {c.semester ? ` (ภาค ${c.semester})` : ''}
                </td>
                <td className="p-1 text-center font-mono text-[10px]">
                  {c.dayShort ? `${c.dayShort} ` : ''}
                  {c.startTime || '-'}-{c.endTime || '-'}
                </td>
                <td className="p-1 text-center font-semibold">{c.room || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t text-[10px] text-slate-500">
        <div className="space-y-0.5 min-w-0">
          <div>
            <span>เข้าเช็คชื่อนิสิต: </span>
            <strong className="font-mono text-purple-700">{attendanceUrl}</strong>
          </div>
          <div className="text-slate-600">ผู้ออกเข้าระบบ โดย <strong className="text-slate-800">{adminName || 'ผู้ดูแลระบบ'}</strong></div>
          <div className="text-slate-700 font-medium pt-0.5">ลงชื่อผู้รับทราบ: .......................................</div>
        </div>
        {qrCodeDataUrl && (
          <div className="text-center shrink-0">
            <img
              src={qrCodeDataUrl}
              alt="QR"
              style={{
                width: `${Math.round(48 * qrScale)}px`,
                height: `${Math.round(48 * qrScale)}px`,
              }}
              className="border border-emerald-300 rounded bg-white p-0.5 object-contain shadow-xs inline-block"
            />
            <div className="text-[8px] text-slate-500 font-bold mt-0.5">สแกนเข้า</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   CARD VARIANT 3: 4:1 Quarter Card (การ์ดตัดแจก 4 ส่วน - แนะนำ)
   ------------------------------------------------------------- */
export function QuarterCard({
  user,
  courses,
  qrCodeDataUrl,
  academicYearText,
  semesterText,
  adminName,
  qrScale = 1.5,
}: TeachingSlipCardProps) {
  return (
    <div className="h-full flex flex-col justify-between p-3 bg-white border border-slate-300 rounded-xl text-slate-800 shadow-xs relative overflow-hidden">
      <div>
        <div className="flex items-start justify-between gap-1.5 border-b border-slate-200 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">☸️</span>
            <div>
              <h6 className="font-extrabold text-slate-900 text-xs leading-tight">
                บัตรแจ้งภาระงานสอน คณะพุทธศาสตร์
              </h6>
              <p className="text-[9.5px] text-slate-500 font-semibold">
                {semesterText} {academicYearText}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 shrink-0">
            {courses.length} วิชา
          </span>
        </div>

        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 mb-2 space-y-0.5 text-[11px]">
          <div>
            <span className="text-slate-400 font-medium">อาจารย์:</span>{' '}
            <strong className="text-slate-900 text-xs">{user.name}</strong>
          </div>
          <div className="text-[10px] text-slate-600 truncate">
            {user.department || 'คณะพุทธศาสตร์ มจร.'}
          </div>
        </div>

        <div className="space-y-1 mb-2">
          <div className="text-[10px] font-bold text-slate-700 flex items-center justify-between">
            <span>ตารางรายวิชาบรรยาย:</span>
          </div>
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b text-[9.5px]">
                <tr>
                  <th className="px-1.5 py-0.5 w-14">รหัสวิชา</th>
                  <th className="px-1.5 py-0.5">ชื่อวิชา</th>
                  <th className="px-1.5 py-0.5 text-center w-12">ห้อง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[10px]">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-2 text-slate-400 text-[9.5px]">
                      ไม่พบตารางสอนในเทอมนี้
                    </td>
                  </tr>
                ) : (
                  courses.slice(0, 3).map((c, i) => (
                    <tr key={i}>
                      <td className="px-1.5 py-0.5 font-mono font-bold text-indigo-700">{c.courseCode}</td>
                      <td className="px-1.5 py-0.5 truncate max-w-[130px] font-medium" title={c.courseName}>
                        {c.courseName}
                        {c.dayShort ? ` (${c.dayShort})` : ''}
                      </td>
                      <td className="px-1.5 py-0.5 text-center font-bold text-slate-700">{c.room || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {courses.length > 3 && (
            <div className="text-[9px] text-slate-400 text-right">
              + มีอีก {courses.length - 3} วิชา (ตรวจดูในระบบ)
            </div>
          )}
        </div>
      </div>

      <div className="p-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 rounded-lg flex items-center justify-between gap-2 text-[10px]">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="font-bold text-emerald-950 flex items-center gap-1 text-[10.5px]">
            <Key className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>เข้าเช็คชื่อนิสิต:</span>
          </div>
          <div className="truncate text-slate-700 text-[9.5px]">
            User: <strong className="font-mono text-slate-900">{user.email || user.gmail}</strong>
          </div>
          <div className="text-slate-700 text-[9.5px]">
            Pass: <strong className="font-mono text-emerald-800 bg-white px-1 rounded border border-emerald-300">{user.defaultPassword || 'mcu123456'}</strong>
          </div>
          <div className="text-slate-600 text-[8.5px] truncate pt-0.5 border-t border-emerald-200/60 mt-0.5">
            ผู้ออกเข้าระบบ โดย <strong className="text-slate-800">{adminName || 'ผู้ดูแลระบบ'}</strong>
          </div>
        </div>

        {qrCodeDataUrl && (
          <div className="text-center shrink-0">
            <img
              src={qrCodeDataUrl}
              alt="QR"
              style={{
                width: `${Math.round(44 * qrScale)}px`,
                height: `${Math.round(44 * qrScale)}px`,
              }}
              className="border border-emerald-300 rounded bg-white p-0.5 object-contain shadow-xs inline-block"
            />
            <div className="text-[8px] text-slate-500 font-bold mt-0.5">สแกนเข้า</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   CARD VARIANT 4: 6:1 Mini Slip (สลิปย่อ 6 ช่อง สำหรับแนบซอง/แจก)
   ------------------------------------------------------------- */
export function MiniSlipCard({
  user,
  courses,
  qrCodeDataUrl,
  academicYearText,
  semesterText,
  adminName,
  qrScale = 1.5,
}: TeachingSlipCardProps) {
  return (
    <div className="h-full flex flex-col justify-between p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 shadow-xs relative overflow-hidden text-[10px]">
      <div>
        <div className="flex items-center justify-between border-b pb-1 mb-1">
          <div className="font-bold text-slate-900 text-[11px] truncate flex items-center gap-1">
            <span>☸️</span>
            <span>บัตรภาระงาน: {user.name}</span>
          </div>
          <span className="text-[8.5px] bg-slate-100 text-slate-600 font-bold px-1 rounded">
            {courses.length} วิชา
          </span>
        </div>

        <div className="text-[9px] text-slate-500 truncate mb-1">
          {semesterText} {academicYearText} • {user.department || 'คณะพุทธศาสตร์'}
        </div>

        <div className="space-y-0.5 mb-1.5">
          {courses.slice(0, 2).map((c, i) => (
            <div key={i} className="flex items-center justify-between text-[9px] bg-slate-50 px-1 py-0.5 rounded">
              <span className="font-mono font-bold text-indigo-700 truncate max-w-[65px]">{c.courseCode}</span>
              <span className="truncate max-w-[100px] text-slate-800">{c.courseName}</span>
              <span className="font-bold text-slate-600">{c.room || '-'}</span>
            </div>
          ))}
          {courses.length > 2 && (
            <div className="text-[8px] text-slate-400 text-right">+ อีก {courses.length - 2} วิชา</div>
          )}
        </div>
      </div>

      <div className="p-1.5 bg-emerald-50/90 border border-emerald-200 rounded flex items-center justify-between gap-1.5">
        <div className="text-[8.5px] min-w-0 truncate text-slate-700 space-y-0.5">
          <div>User: <strong className="font-mono text-slate-900">{user.email || user.gmail}</strong></div>
          <div>Pass: <strong className="font-mono text-emerald-800 bg-white px-1 rounded border border-emerald-300">{user.defaultPassword || 'mcu123456'}</strong></div>
          <div className="text-[7.5px] text-slate-600 truncate border-t border-emerald-200/60 pt-0.5 mt-0.5">
            ผู้ออกเข้าระบบ โดย <strong className="text-slate-800">{adminName || 'ผู้ดูแลระบบ'}</strong>
          </div>
        </div>
        {qrCodeDataUrl && (
          <div className="text-center shrink-0">
            <img
              src={qrCodeDataUrl}
              alt="QR"
              style={{
                width: `${Math.round(36 * qrScale)}px`,
                height: `${Math.round(36 * qrScale)}px`,
              }}
              className="rounded border border-emerald-300 bg-white p-0.5 object-contain shadow-xs inline-block"
            />
            <div className="text-[7.5px] text-slate-500 font-bold leading-none mt-0.5">สแกน</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   CARD VARIANT 5: 8:1 Mini Slip (สลิปย่อ 8 ช่อง • ประหยัดสุด)
   ------------------------------------------------------------- */
export function EightCard({
  user,
  courses,
  qrCodeDataUrl,
  academicYearText,
  semesterText,
  adminName,
  qrScale = 1.5,
}: TeachingSlipCardProps) {
  return (
    <div className="h-full flex flex-col justify-between p-2 bg-white border border-slate-300 rounded-lg text-slate-800 shadow-xs relative overflow-hidden text-[9px] leading-tight">
      <div>
        <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
          <div className="font-bold text-slate-900 text-[10px] truncate flex items-center gap-1">
            <span>☸️</span>
            <span className="truncate">บัตรภาระงาน: {user.name}</span>
          </div>
          <span className="text-[7.5px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-1 rounded shrink-0">
            {courses.length} วิชา
          </span>
        </div>

        <div className="text-[8px] text-slate-500 truncate mb-1">
          {semesterText} {academicYearText} • {user.department || 'คณะพุทธศาสตร์'}
        </div>

        <div className="space-y-0.5 mb-1">
          {courses.slice(0, 2).map((c, i) => (
            <div key={i} className="flex items-center justify-between text-[7.5px] bg-slate-50 px-1 py-0.5 rounded">
              <span className="font-mono font-bold text-indigo-700 truncate max-w-[55px]">{c.courseCode}</span>
              <span className="truncate max-w-[85px] text-slate-800 font-medium">{c.courseName}</span>
              <span className="font-bold text-slate-600">{c.room || '-'}</span>
            </div>
          ))}
          {courses.length > 2 && (
            <div className="text-[7px] text-slate-400 text-right">+ มีอีก {courses.length - 2} วิชา</div>
          )}
          {courses.length === 0 && (
            <div className="text-[7.5px] text-slate-400 text-center py-0.5">ไม่พบตารางสอนในเทอมนี้</div>
          )}
        </div>
      </div>

      <div className="p-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 rounded flex items-center justify-between gap-1">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="font-bold text-emerald-950 flex items-center gap-1 text-[8.5px]">
            <Key className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
            <span>เข้าเช็คชื่อนิสิต:</span>
          </div>
          <div className="truncate text-slate-700 text-[8px]">
            User: <strong className="font-mono text-slate-900">{user.email || user.gmail}</strong>
          </div>
          <div className="text-slate-700 text-[8px]">
            Pass: <strong className="font-mono text-emerald-800 bg-white px-1 rounded border border-emerald-300">{user.defaultPassword || 'mcu123456'}</strong>
          </div>
          <div className="text-slate-600 text-[7px] truncate pt-0.5 border-t border-emerald-200/50 mt-0.5">
            ผู้ออกเข้าระบบ โดย <strong className="text-slate-800">{adminName || 'ผู้ดูแลระบบ'}</strong>
          </div>
        </div>

        {qrCodeDataUrl && (
          <div className="text-center shrink-0">
            <img
              src={qrCodeDataUrl}
              alt="QR"
              style={{
                width: `${Math.round(30 * qrScale)}px`,
                height: `${Math.round(30 * qrScale)}px`,
              }}
              className="border border-emerald-300 rounded bg-white p-0.5 object-contain shadow-xs inline-block"
            />
            <div className="text-[6.5px] text-slate-500 font-bold leading-none mt-0.5">สแกนเข้า</div>
          </div>
        )}
      </div>
    </div>
  );
}
