'use client';

import React from 'react';

interface CertStaffFormSectionProps {
  fullName: string;
  setFullName: (val: string) => void;
  staffPosition: string;
  setStaffPosition: (val: string) => void;
  staffDepartment: string;
  setStaffDepartment: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  requestPurpose: string;
  setRequestPurpose: (val: string) => void;
}

export function CertStaffFormSection({
  fullName,
  setFullName,
  staffPosition,
  setStaffPosition,
  staffDepartment,
  setStaffDepartment,
  email,
  setEmail,
  phone,
  setPhone,
  requestPurpose,
  setRequestPurpose,
}: CertStaffFormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            ชื่อ - นามสกุล บุคลากร/อาจารย์ (Full Name) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="ชื่อ-นามสกุล และสมณศักดิ์ (ถ้ามี)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            ตำแหน่งทางวิชาการ / บทบาทหน้าที่ <span className="text-red-500">*</span>
          </label>
          <select
            value={staffPosition}
            onChange={(e) => setStaffPosition(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          >
            <option value="อาจารย์ประจำหลักสูตร">อาจารย์ประจำหลักสูตร (Full-time Faculty)</option>
            <option value="อาจารย์พิเศษ">อาจารย์พิเศษ (Adjunct / Special Lecturer)</option>
            <option value="อาจารย์ผู้ช่วยสอน (TA)">อาจารย์ผู้ช่วยสอน (Teaching Assistant)</option>
            <option value="เจ้าหน้าที่บริหารงานทั่วไป">เจ้าหน้าที่บริหารงานทั่วไป (Officer)</option>
            <option value="นักวิชาการศึกษา">นักวิชาการศึกษา (Academic Officer)</option>
            <option value="ผู้บริหาร / คณบดี / รองคณบดี">ผู้บริหาร / คณบดี / รองคณบดี (Executive)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            สังกัด / ภาควิชา (Department) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="เช่น ภาควิชาพระพุทธศาสนา, สำนักงานคณบดี"
            value={staffDepartment}
            onChange={(e) => setStaffDepartment(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">อีเมลติดต่อ (Email)</label>
          <input
            type="email"
            placeholder="อีเมลติดต่อกลับ"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">เบอร์โทรศัพท์ (Phone)</label>
          <input
            type="text"
            placeholder="เบอร์โทรศัพท์ที่ติดต่อได้"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1.5">
          วัตถุประสงค์ในการขอหนังสือรับรอง (Purpose) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="เช่น เพื่อประกอบการยื่นขอวีซ่า, ทำธุรกรรมธนาคาร, ประกอบการประเมินผลงานทางวิชาการ หรือการต่อสัญญา"
          value={requestPurpose}
          onChange={(e) => setRequestPurpose(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
        />
      </div>
    </div>
  );
}
