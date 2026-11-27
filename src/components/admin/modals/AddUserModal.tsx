'use client';

import React from 'react';
import { UserCog, Mail, Info, ShieldCheck, ClipboardList, GraduationCap, Briefcase } from 'lucide-react';
import { UserAccount, UserRole } from '@/types';

export interface NewUserFormData {
  name: string;
  nameEn: string;
  email: string;
  gmail: string;
  instructorType: string;
  department: string;
  ecclesiasticalTitle?: string;
  contactAddress?: string;
  role: UserRole;
  isActingOfficer?: boolean;
  password: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  newUserForm: NewUserFormData;
  setNewUserForm: React.Dispatch<React.SetStateAction<NewUserFormData>>;
  isOfficer?: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddUserModal({
  isOpen,
  newUserForm,
  setNewUserForm,
  isOfficer = false,
  onClose,
  onSubmit,
}: AddUserModalProps) {
  if (!isOpen) return null;

  const hasAnyEmail = Boolean(newUserForm.email?.trim() || newUserForm.gmail?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-sky-600" />
            <span>เพิ่มบัญชีผู้ใช้งานใหม่ (Add New User)</span>
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tip for Gmail-only users / external instructors / assistant */}
        <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <p className="font-bold">รองรับผู้ใช้ภายนอก / แอดมินสำรอง ที่ไม่มีอีเมล @mcu.ac.th</p>
            <p className="text-[11px] text-amber-800">
              สำหรับอาจารย์ผู้สอนภายนอก, ผู้ช่วยสอน หรือบัญชีสำรอง สามารถระบุเฉพาะ <strong>Gmail</strong> โดยเว้นว่างช่องอีเมลมหาวิทยาลัยได้ และสามารถเข้าสู่ระบบด้วย Google หรือรหัสผ่านได้ทันที
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อ - นามสกุล / สมณศักดิ์ (ภาษาไทย) <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              required
              value={newUserForm.name || ''}
              onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
              placeholder="เช่น พระมหาดวงเด่น, ดร.สมชาย, หรือ อาจารย์พิเศษภายนอก"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ชื่อ - นามสกุลภาษาอังกฤษ (English Name) (ถ้ามี):
            </label>
            <input
              type="text"
              value={newUserForm.nameEn || ''}
              onChange={(e) => setNewUserForm({ ...newUserForm, nameEn: e.target.value })}
              placeholder="e.g. Dr. Somchai Jaidee"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>อีเมล Gmail จริง:</span>
                <span className="text-[10px] text-amber-600 font-normal">ล็อกอินด้วย Google</span>
              </label>
              <input
                type="email"
                value={newUserForm.gmail || ''}
                onChange={(e) => setNewUserForm({ ...newUserForm, gmail: e.target.value })}
                placeholder="example@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>อีเมลมหาวิทยาลัย (@mcu.ac.th):</span>
                <span className="text-[10px] text-slate-400 font-normal">(ถ้ามี)</span>
              </label>
              <input
                type="text"
                value={newUserForm.email || ''}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="example@mcu.ac.th"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
              />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 block">
            * ต้องระบุอีเมลอย่างน้อย 1 ช่องทาง (ระบุเฉพาะ Gmail หรือ @mcu.ac.th หรือระบุทั้งสองอย่างได้)
          </span>

          {/* ประเภทอาจารย์ / สถานะการสอน */}
          <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <label className="font-bold text-slate-800 block text-xs">
              ประเภทอาจารย์ / สถานะการสอน:
            </label>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: 'อาจารย์ประจำ', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                { label: 'อาจารย์พิเศษ', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
                { label: 'อาจารย์ผู้ช่วยสอน', color: 'bg-amber-100 text-amber-800 border-amber-300' },
                { label: 'เจ้าหน้าที่หลักสูตร', color: 'bg-sky-100 text-sky-800 border-sky-300' },
                { label: 'เจ้าหน้าที่', color: 'bg-blue-100 text-blue-800 border-blue-400' },
                { label: 'ผู้ช่วยเจ้าหน้าที่ (อาจารย์ช่วยงาน)', color: 'bg-teal-100 text-teal-800 border-teal-300' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    const isActing = item.label.includes('ผู้ช่วยเจ้าหน้าที่');
                    const isOfficerRole = item.label === 'เจ้าหน้าที่หลักสูตร';
                    const isStaffRole = item.label === 'เจ้าหน้าที่';
                    let nextRole = newUserForm.role;
                    let nextActing = false;

                    if (isActing) {
                      nextRole = 'INSTRUCTOR';
                      nextActing = true;
                    } else if (isOfficerRole) {
                      nextRole = 'OFFICER';
                    } else if (isStaffRole) {
                      nextRole = 'STAFF';
                    } else {
                      nextRole = 'INSTRUCTOR';
                    }

                    setNewUserForm({
                      ...newUserForm,
                      instructorType: item.label,
                      role: nextRole,
                      isActingOfficer: nextActing,
                    });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    (newUserForm.instructorType || 'อาจารย์ประจำ') === item.label
                      ? `${item.color} ring-2 ring-indigo-400 shadow-xs`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Editable Input Box */}
            <input
              type="text"
              value={newUserForm.instructorType || ''}
              onChange={(e) => setNewUserForm({ ...newUserForm, instructorType: e.target.value })}
              placeholder="เลือกจากปุ่มด้านบน หรือพิมพ์ระบุ เช่น อาจารย์ประจำ, อาจารย์พิเศษ, อาจารย์ผู้ช่วยสอน, เจ้าหน้าที่หลักสูตร, เจ้าหน้าที่"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-xs"
            />
            <span className="text-[10px] text-slate-400 block">
              * ข้อมูลนี้จะแสดงบนบัตรแจ้งภาระงานสอน และใช้จัดกลุ่มในระบบ
            </span>
          </div>

          {/* หน่วยงาน / ภาควิชา: Full width */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">หน่วยงาน / ภาควิชา:</label>
            <input
              type="text"
              value={newUserForm.department || ''}
              onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
              placeholder="เช่น สำนักงานคณบดี คณะพุทธศาสตร์ มจร หรือ คณะพุทธศาสตร์ ภาควิชาพระพุทธศาสนา"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
            />
          </div>

          {/* ตำแหน่งทางคณะสงฆ์ และ ที่อยู่ติดต่อ: 2 คอลัมน์ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">ตำแหน่งทางคณะสงฆ์ / สมณศักดิ์:</label>
              <input
                type="text"
                value={newUserForm.ecclesiasticalTitle || ''}
                onChange={(e) => setNewUserForm({ ...newUserForm, ecclesiasticalTitle: e.target.value })}
                placeholder="เช่น เจ้าอาวาสวัด..., เจ้าคณะตำบล..., พระครู..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">ที่อยู่ติดต่อ / สังกัดวัด:</label>
              <input
                type="text"
                value={newUserForm.contactAddress || ''}
                onChange={(e) => setNewUserForm({ ...newUserForm, contactAddress: e.target.value })}
                placeholder="เช่น วัดมหาธาตุยุวราชรังสฤษฎิ์ กรุงเทพฯ"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          {/* บทบาทและสิทธิ์การใช้งาน (Role): Full width */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">บทบาทและสิทธิ์การใช้งาน (Role):</label>
            {(() => {
              const currentRoleSelection: UserRole =
                newUserForm.isActingOfficer && (newUserForm.role === 'INSTRUCTOR' || !newUserForm.role)
                  ? 'ACTING_OFFICER'
                  : newUserForm.role || 'INSTRUCTOR';

              return (
                <div className="space-y-2">
                  {isOfficer ? (
                    <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 font-semibold flex items-center justify-between text-xs">
                      <span>{currentRoleSelection === 'ACTING_OFFICER' ? '🎓 ผู้ช่วยเจ้าหน้าที่ (ผู้ช่วยงาน)' : '👨‍🏫 อาจารย์ผู้สอน (INSTRUCTOR)'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">ล็อกเฉพาะอาจารย์</span>
                    </div>
                  ) : (
                    <select
                      value={currentRoleSelection}
                      onChange={(e) => {
                        const val = e.target.value as UserRole;
                        if (val === 'ACTING_OFFICER') {
                          setNewUserForm({
                            ...newUserForm,
                            role: 'INSTRUCTOR',
                            isActingOfficer: true,
                            instructorType:
                              newUserForm.instructorType && !newUserForm.instructorType.includes('ผู้ช่วย')
                                ? 'ผู้ช่วยเจ้าหน้าที่ (อาจารย์ช่วยงาน)'
                                : newUserForm.instructorType || 'ผู้ช่วยเจ้าหน้าที่ (อาจารย์ช่วยงาน)',
                          });
                        } else if (val === 'OFFICER') {
                          setNewUserForm({
                            ...newUserForm,
                            role: 'OFFICER',
                            isActingOfficer: false,
                            instructorType:
                              !newUserForm.instructorType || newUserForm.instructorType === 'อาจารย์ประจำ'
                                ? 'เจ้าหน้าที่หลักสูตร'
                                : newUserForm.instructorType,
                          });
                        } else if (val === 'STAFF') {
                          setNewUserForm({
                            ...newUserForm,
                            role: 'STAFF',
                            isActingOfficer: false,
                            instructorType:
                              !newUserForm.instructorType || newUserForm.instructorType === 'อาจารย์ประจำ'
                                ? 'เจ้าหน้าที่'
                                : newUserForm.instructorType,
                          });
                        } else if (val === 'ADMIN') {
                          setNewUserForm({
                            ...newUserForm,
                            role: 'ADMIN',
                            isActingOfficer: false,
                          });
                        } else if (val === 'VIPASSANA_MASTER') {
                          setNewUserForm({
                            ...newUserForm,
                            role: 'VIPASSANA_MASTER',
                            isActingOfficer: false,
                          });
                        } else {
                          setNewUserForm({
                            ...newUserForm,
                            role: 'INSTRUCTOR',
                            isActingOfficer: false,
                          });
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer text-xs"
                    >
                      <option value="ADMIN">🛡️ ผู้ดูแลระบบ (ADMIN)</option>
                      <option value="OFFICER">📋 เจ้าหน้าที่หลักสูตร (OFFICER)</option>
                      <option value="ACTING_OFFICER">🎓 ผู้ช่วยเจ้าหน้าที่ (ผู้ช่วยงาน)</option>
                      <option value="STAFF">💼 เจ้าหน้าที่สายสนับสนุน / วิชาการ (STAFF)</option>
                      <option value="INSTRUCTOR">👨‍🏫 อาจารย์ผู้สอน (INSTRUCTOR)</option>
                      <option value="VIPASSANA_MASTER">🧘 พระวิปัสสนาจารย์ (สอบอารมณ์ / วัดผลปฏิบัติ)</option>
                    </select>
                  )}

                  {/* Role Explanation Card */}
                  {currentRoleSelection === 'ADMIN' && (
                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-[11px] text-purple-900 leading-relaxed flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>🛡️ ผู้ดูแลระบบ (ADMIN):</strong> มีสิทธิ์เข้าถึงและจัดการระบบทั้งหมด ตั้งค่าระบบ จัดการข้อมูลอาจารย์ นิสิต และนโยบายความปลอดภัย
                      </div>
                    </div>
                  )}
                  {currentRoleSelection === 'OFFICER' && (
                    <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-[11px] text-teal-900 leading-relaxed flex items-start gap-2">
                      <ClipboardList className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>📋 เจ้าหน้าที่หลักสูตร (OFFICER):</strong> มีสิทธิ์บริหารจัดการข้อมูลหลักสูตร ตารางสอน งานบริการการศึกษา ทะเบียนนิสิต และตรวจสอบคำร้อง
                      </div>
                    </div>
                  )}
                  {currentRoleSelection === 'ACTING_OFFICER' && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                      <GraduationCap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>🎓 ผู้ช่วยเจ้าหน้าที่ (ผู้ช่วยงาน):</strong> ผู้ได้รับมอบหมายให้ช่วยงานเจ้าหน้าที่หลักสูตร สามารถช่วยลงทะเบียน ตรวจสอบคำร้อง และออกเอกสารได้ โดยยังคงมีสถานะเดิมตามปกติ
                      </div>
                    </div>
                  )}
                  {currentRoleSelection === 'STAFF' && (
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-900 leading-relaxed flex items-start gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>💼 เจ้าหน้าที่สายสนับสนุน (STAFF):</strong> บุคลากรสายสนับสนุนวิชาการ / ธุรการของคณะ
                      </div>
                    </div>
                  )}
                  {currentRoleSelection === 'VIPASSANA_MASTER' && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                      <span className="text-base leading-none">🧘</span>
                      <div>
                        <strong>🧘 พระวิปัสสนาจารย์ (VIPASSANA_MASTER):</strong> ทำหน้าที่สอบอารมณ์และประเมินผลการปฏิบัติธรรมในโครงการปฏิบัติวิปัสสนากัมมัฏฐาน
                      </div>
                    </div>
                  )}
                  {currentRoleSelection === 'INSTRUCTOR' && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed flex items-start gap-2">
                      <span className="text-base leading-none">👨‍🏫</span>
                      <div>
                        <strong>👨‍🏫 อาจารย์ผู้สอน (INSTRUCTOR):</strong> ทำหน้าที่เช็คชื่อในชั้นเรียน ส่งเกรด และดูแลกลุ่มกิจกรรม
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">รหัสผ่านเริ่มต้น:</label>
            <input
              type="text"
              value={newUserForm.password || 'mcu123456'}
              onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              รหัสเริ่มต้นมาตรฐานคือ mcu123456 (ผู้ใช้จะต้องตั้งรหัสผ่านใหม่เมื่อเข้าสู่ระบบครั้งแรก)
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!newUserForm.name?.trim() || !hasAnyEmail}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold transition cursor-pointer shadow-md shadow-sky-600/20"
            >
              บันทึกผู้ใช้ใหม่
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
