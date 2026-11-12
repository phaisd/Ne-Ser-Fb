'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  CreditCard,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  Mail,
  Edit3,
  FileText,
  ArrowRightLeft,
} from 'lucide-react';
import { Student, getStatusBadge, formatPassportMask } from './types';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
  onEdit: (student: Student) => void;
  unmaskPassport: boolean;
  setUnmaskPassport: (val: boolean) => void;
}

export function StudentDetailModal({
  student,
  onClose,
  onEdit,
  unmaskPassport,
  setUnmaskPassport,
}: StudentDetailModalProps) {
  if (!student) return null;

  const statusBadge = getStatusBadge(student.studyStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                {student.studentCode}
              </span>
              {student.programType === 'ENGLISH' ? (
                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                  🌐 หลักสูตรภาคภาษาอังกฤษ
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  🇹🇭 หลักสูตรภาคภาษาไทย
                </span>
              )}
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.color}`}
              >
                {statusBadge.label}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-2">
              {student.fullName ||
                `${student.title || ''} ${student.firstName} ${student.lastName}`}
            </h3>
            <p className="text-xs text-slate-500">{student.faculty || 'คณะพุทธศาสตร์'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Academic Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-xs text-slate-500 block">ระดับการศึกษา</span>
            <span className="font-semibold text-slate-800">
              {student.degree || 'ปริญญาตรี'}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-xs text-slate-500 block">ชั้นปี</span>
            <span className="font-semibold text-slate-800">
              ปีที่ {student.yearLevel || '-'}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-xs text-slate-500 block">สาขาวิชา</span>
            <span className="font-semibold text-slate-800">{student.major || '-'}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-xs text-slate-500 block">เกรดเฉลี่ย (GPA)</span>
            <span className="font-semibold text-slate-800">{student.gpa || '-'}</span>
          </div>
        </div>

        {/* Remarks Callout (if filled) */}
        {student.remarks && (
          <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-1">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-amber-700" />
              หมายเหตุสถานภาพ:
            </div>
            <div className="text-amber-800 font-medium pl-5">{student.remarks}</div>
          </div>
        )}

        {/* Passport & Visa Info */}
        <div className="bg-purple-50/60 border border-purple-200/80 p-4 rounded-xl space-y-3">
          <div className="text-xs font-bold text-purple-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-700" />
            ข้อมูลหนังสือเดินทางและสัญชาติ
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">สัญชาติ / ประเทศ:</span>
              <span className="font-bold text-slate-800">
                {student.nationality || '-'} / {student.country || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">อายุ:</span>
              <span className="font-bold text-slate-800">
                {student.age ? `${student.age} ปี` : '-'}
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 block">Passport No:</span>
                <button
                  type="button"
                  onClick={() => setUnmaskPassport(!unmaskPassport)}
                  className="text-[10px] text-purple-600 hover:text-purple-800 flex items-center gap-0.5 cursor-pointer"
                >
                  {unmaskPassport ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{unmaskPassport ? 'ซ่อน' : 'ดูเต็ม'}</span>
                </button>
              </div>
              <span className="font-mono font-bold text-purple-700">
                {student.passportNo
                  ? formatPassportMask(student.passportNo, unmaskPassport)
                  : 'ไม่มีข้อมูล'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">ประเภทวีซ่า:</span>
              <span className="font-bold text-slate-800">
                {student.visaType || 'ไม่มีข้อมูล'}
              </span>
            </div>
          </div>
        </div>

        {/* Address & Contact */}
        <div className="space-y-2 text-xs text-slate-600 border-t pt-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              ที่อยู่: {student.address || '-'}{' '}
              {student.subdistrict && `ตำบล${student.subdistrict} `}
              {student.district && `อำเภอ${student.district} `}
              {student.province && `จังหวัด${student.province} `}
              {student.postalCode && student.postalCode}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <span>อีเมล: {student.email || 'ไม่มีข้อมูล'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => onEdit(student)}
            className="py-2.5 px-4 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Edit3 className="w-4 h-4" />
            แก้ไขข้อมูลนิสิต
          </button>
          <Link
            href="/certificates"
            className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition flex items-center justify-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            ออกหนังสือรับรอง
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
