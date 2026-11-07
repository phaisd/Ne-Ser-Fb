'use client';

import React from 'react';
import {
  X,
  Users,
  BookOpen,
  ArrowRightLeft,
  CreditCard,
  MapPin,
  Save,
} from 'lucide-react';
import { Student, STUDY_STATUS_OPTIONS } from './types';

interface StudentEditModalProps {
  editingStudent: Student | null;
  editForm: Partial<Student>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<Student>>>;
  onClose: () => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
}

export function StudentEditModal({
  editingStudent,
  editForm,
  setEditForm,
  onClose,
  onSave,
  saving,
}: StudentEditModalProps) {
  if (!editingStudent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                {editingStudent.studentCode}
              </span>
              <span className="text-xs font-bold text-slate-600">แก้ไขข้อมูลทะเบียนนิสิต</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              {editForm.fullName ||
                `${editForm.title || ''} ${editForm.firstName || ''} ${editForm.lastName || ''}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-6">
          {/* SECTION A: ข้อมูลการศึกษาและชื่อ-สกุล */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-orange-600">
              <Users className="w-4 h-4" />
              1. ข้อมูลส่วนตัว หลักสูตร และสถานภาพการศึกษา
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  คำนำหน้า (Title)
                </label>
                <input
                  type="text"
                  placeholder="เช่น พระ, พระมหา, นาย, Ven."
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  ชื่อ (First Name) *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.firstName || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  นามสกุล (Last Name)
                </label>
                <input
                  type="text"
                  value={editForm.lastName || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* หลักสูตร และ สถานภาพนิสิต */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  หลักสูตร (Curriculum Program) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={
                    editForm.programType ||
                    (editForm.nationality === 'ไทย' || editForm.nationality === 'Thai'
                      ? 'THAI'
                      : 'ENGLISH')
                  }
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, programType: e.target.value as any }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="THAI">🇹🇭 หลักสูตรภาคภาษาไทย (Thai Program)</option>
                  <option value="ENGLISH">🌐 หลักสูตรภาคภาษาอังกฤษ (English Program)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
                  สถานภาพนิสิต (Study Status) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editForm.studyStatus || 'ปกติ'}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, studyStatus: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {STUDY_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  ชั้นปี (Year Level)
                </label>
                <select
                  value={editForm.yearLevel || 1}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, yearLevel: parseInt(e.target.value, 10) }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="1">ปีที่ 1</option>
                  <option value="2">ปีที่ 2</option>
                  <option value="3">ปีที่ 3</option>
                  <option value="4">ปีที่ 4</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  ระดับการศึกษา (Degree)
                </label>
                <select
                  value={editForm.degree || 'ปริญญาตรี'}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, degree: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="ปริญญาตรี">ปริญญาตรี</option>
                  <option value="ปริญญาโท">ปริญญาโท</option>
                  <option value="ปริญญาเอก">ปริญญาเอก</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  สาขาวิชา (Major)
                </label>
                <input
                  type="text"
                  value={editForm.major || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, major: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Remarks Field */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                หมายเหตุ (Remarks / Note){' '}
                <span className="text-slate-400 font-normal">
                  (ระบุรายละเอียด เช่น ย้ายมาจากสถาบันใด, เทียบโอนกี่หน่วยกิต, เหตุผลการย้าย ฯลฯ)
                </span>
              </label>
              <textarea
                rows={2}
                placeholder="เช่น ย้ายเข้าจากวิทยาเขตเชียงใหม่ ภาคเรียนที่ 1/2569, เทียบโอน 18 หน่วยกิต, หรือระบุสาเหตุการย้ายออก..."
                value={editForm.remarks || ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev, remarks: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* SECTION B: ข้อมูลสัญชาติ หนังสือเดินทาง วีซ่า */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-purple-600">
              <CreditCard className="w-4 h-4" />
              2. สัญชาติ หนังสือเดินทาง และวีซ่า
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">อายุ (Age)</label>
                <input
                  type="text"
                  placeholder="เช่น 26"
                  value={editForm.age || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, age: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">เพศ (Gender)</label>
                <select
                  value={editForm.gender || 'ชาย'}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  สัญชาติ (Nationality)
                </label>
                <input
                  type="text"
                  placeholder="เช่น ไทย, Myanmar, Vietnamese"
                  value={editForm.nationality || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, nationality: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  ประเทศ (Country)
                </label>
                <input
                  type="text"
                  placeholder="เช่น Thailand, Myanmar"
                  value={editForm.country || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  หมายเลข Passport (Passport No)
                </label>
                <input
                  type="text"
                  placeholder="เช่น MB123456"
                  value={editForm.passportNo || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, passportNo: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  วันหมดอายุ Passport
                </label>
                <input
                  type="text"
                  placeholder="เช่น 12 พ.ย. 2572 หรือ 2029-11-12"
                  value={editForm.passportExpireDate || ''}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, passportExpireDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  ประเภทวีซ่า (Visa Type)
                </label>
                <input
                  type="text"
                  placeholder="เช่น Non-ED, Tourist, ผ่อนผัน"
                  value={editForm.visaType || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, visaType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  วันหมดอายุวีซ่า (Visa Expire Date)
                </label>
                <input
                  type="text"
                  placeholder="เช่น 24 ส.ค. 2569 หรือ 2026-08-24"
                  value={editForm.visaExpireDate || ''}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, visaExpireDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION C: ที่อยู่และการติดต่อ */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
              <MapPin className="w-4 h-4" />
              3. ข้อมูลการติดต่อ ที่อยู่ และเกรด
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  เกรดเฉลี่ยสะสม (GPA)
                </label>
                <input
                  type="text"
                  placeholder="เช่น 3.45"
                  value={editForm.gpa || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, gpa: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  เบอร์โทรศัพท์ (Phone)
                </label>
                <input
                  type="text"
                  placeholder="เช่น 081-234-5678"
                  value={editForm.phoneNumber || ''}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  อีเมล (Email)
                </label>
                <input
                  type="email"
                  placeholder="เช่น student@mcu.ac.th"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                ที่อยู่ (Address)
              </label>
              <input
                type="text"
                placeholder="เลขที่ หมู่ ซอย ถนน วัด..."
                value={editForm.address || ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  ตำบล / แขวง
                </label>
                <input
                  type="text"
                  value={editForm.subdistrict || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, subdistrict: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  อำเภอ / เขต
                </label>
                <input
                  type="text"
                  value={editForm.district || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, district: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">จังหวัด</label>
                <input
                  type="text"
                  value={editForm.province || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, province: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  รหัสไปรษณีย์
                </label>
                <input
                  type="text"
                  value={editForm.postalCode || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, postalCode: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Submit / Cancel Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-md shadow-orange-500/20 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'กำลังบันทึกและซิงค์ Sheets...' : 'บันทึกการแก้ไขข้อมูล'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
