'use client';

import React from 'react';
import {
  FileUp,
  Download,
  UserCog,
  Key,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { ParsedOfficerItem } from './types';

interface OfficerImportTabProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownloadTemplate: (type: 'CSV' | 'XLSX', role: 'ALL' | 'OFFICER' | 'ACTING') => void;
  defaultRoleOption: 'AUTO' | 'OFFICER' | 'ACTING_OFFICER' | 'STAFF';
  setDefaultRoleOption: (opt: 'AUTO' | 'OFFICER' | 'ACTING_OFFICER' | 'STAFF') => void;
  passwordOption: 'Fb8323mcu' | 'mcu123456' | 'custom';
  setPasswordOption: (opt: 'Fb8323mcu' | 'mcu123456' | 'custom') => void;
  customPassword: string;
  setCustomPassword: (pwd: string) => void;
  rawText: string;
  handleTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  parsedList: ParsedOfficerItem[];
  setParsedList: React.Dispatch<React.SetStateAction<ParsedOfficerItem[]>>;
  submitError: string | null;
  submitSuccess: string | null;
}

export const OfficerImportTab: React.FC<OfficerImportTabProps> = ({
  fileInputRef,
  handleFileUpload,
  handleDownloadTemplate,
  defaultRoleOption,
  setDefaultRoleOption,
  passwordOption,
  setPasswordOption,
  customPassword,
  setCustomPassword,
  rawText,
  handleTextChange,
  parsedList,
  setParsedList,
  submitError,
  submitSuccess,
}) => {
  return (
    <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
      {/* Control Bar: Templates & Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>เลือกไฟล์ Excel / CSV</span>
          </button>

          {/* Template Download Group */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300">
            <span className="text-[11px] font-bold text-slate-500 pl-1.5 flex items-center gap-1">
              <Download className="w-3 h-3 text-slate-400" />
              <span>เทมเพลต:</span>
            </span>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('XLSX', 'ALL')}
              className="px-2 py-1 rounded-lg hover:bg-slate-100 text-teal-800 font-bold transition cursor-pointer text-[11px]"
              title="เทมเพลตรวม เจ้าหน้าที่หลักสูตร และ ผู้ช่วยเจ้าหน้าที่"
            >
              รวม (.xlsx)
            </button>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('CSV', 'OFFICER')}
              className="px-2 py-1 rounded-lg hover:bg-teal-50 text-teal-700 font-bold transition cursor-pointer text-[11px] border-l border-slate-200"
              title="เทมเพลตเฉพาะ เจ้าหน้าที่หลักสูตร (OFFICER)"
            >
              เจ้าหน้าที่ (.csv)
            </button>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('CSV', 'ACTING')}
              className="px-2 py-1 rounded-lg hover:bg-amber-50 text-amber-700 font-bold transition cursor-pointer text-[11px] border-l border-slate-200"
              title="เทมเพลตเฉพาะ ผู้ช่วยเจ้าหน้าที่ (ผู้ช่วยงาน)"
            >
              ผู้ช่วยเจ้าหน้าที่ (.csv)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Target Role Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <UserCog className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-bold text-slate-700">กำหนดบทบาทนำเข้า:</span>
            <select
              value={defaultRoleOption}
              onChange={(e) => setDefaultRoleOption(e.target.value as any)}
              className="bg-transparent font-bold text-teal-800 outline-none cursor-pointer text-xs"
            >
              <option value="AUTO">🔍 ตรวจจับอัตโนมัติ (จากไฟล์)</option>
              <option value="OFFICER">👤 เจ้าหน้าที่หลักสูตร (OFFICER) ทั้งหมด</option>
              <option value="ACTING_OFFICER">🎓 ผู้ช่วยเจ้าหน้าที่ (ผู้ช่วยงาน) ทั้งหมด</option>
              <option value="STAFF">💼 เจ้าหน้าที่สายสนับสนุน (STAFF) ทั้งหมด</option>
            </select>
          </div>

          {/* Password Option: Fb8323mcu */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <Key className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-bold text-slate-700">รหัสผ่าน:</span>
            <select
              value={passwordOption}
              onChange={(e) => setPasswordOption(e.target.value as any)}
              className="bg-transparent font-bold text-emerald-800 outline-none cursor-pointer text-xs"
            >
              <option value="Fb8323mcu">🔑 Fb8323mcu (แนะนำตามโจทย์)</option>
              <option value="mcu123456">mcu123456 (ค่าเดิมระบบ)</option>
              <option value="custom">กำหนดเอง...</option>
            </select>
            {passwordOption === 'custom' && (
              <input
                type="text"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                className="w-24 px-2 py-0.5 rounded border border-slate-300 font-mono text-xs"
                placeholder="รหัสผ่าน"
              />
            )}
          </div>
        </div>
      </div>

      {/* Paste Area */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-slate-600">
          <label className="font-bold">
            วางข้อมูลจากตาราง Excel หรือพิมพ์รายชื่อ (รองรับคอลัมน์: ชื่อ, ตำแหน่ง, ภาควิชา, เบอร์โทร, อีเมล, รหัสผ่าน):
          </label>
          <span className="text-[11px] text-slate-500">
            * หากเว้นว่างอีเมล ระบบจะสร้าง <strong>officer01@mcu.ac.th</strong> ให้อัตโนมัติ
          </span>
        </div>
        <textarea
          rows={5}
          value={rawText}
          onChange={handleTextChange}
          placeholder={`ตัวอย่างเช่น:
นางสาวจิตรา ศิริสุข	เจ้าหน้าที่หลักสูตร	ภาควิชาพระพุทธศาสนา	081-234-5678
ดร.สมเกียรติ กิจเจริญ	ผู้ช่วยเจ้าหน้าที่	สำนักงานคณบดี คณะพุทธศาสตร์	089-876-5432
พระมหาสุริยา สุริโย	เจ้าหน้าที่หลักสูตร	หลักสูตรนานาชาติ	035-248-000`}
          className="w-full p-3 font-mono text-xs rounded-2xl border border-slate-300 bg-slate-50/50 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      {/* Preview Table */}
      {parsedList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>รายการที่ตรวจพบ ({parsedList.length} ท่าน):</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                สร้างใหม่: {parsedList.filter((p) => !p.isExisting).length} ท่าน
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                อัปเดตเดิม: {parsedList.filter((p) => p.isExisting).length} ท่าน
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">ชื่อ-นามสกุล</th>
                  <th className="py-2 px-3">ตำแหน่ง / บทบาท</th>
                  <th className="py-2 px-3">ภาควิชา / หน่วยงาน</th>
                  <th className="py-2 px-3">เบอร์โทร</th>
                  <th className="py-2 px-3">ไอดีที่จะสร้าง/ใช้</th>
                  <th className="py-2 px-3">รหัสผ่าน</th>
                  <th className="py-2 px-3">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-2 px-3 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{item.name}</td>
                    <td className="py-2 px-3">
                      <div className="flex flex-col gap-1 min-w-[170px]">
                        <select
                          value={item.isActingOfficer ? 'ACTING_OFFICER' : item.role === 'STAFF' ? 'STAFF' : 'OFFICER'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setParsedList((prev) =>
                              prev.map((p, pIdx) => {
                                if (pIdx !== idx) return p;
                                if (val === 'ACTING_OFFICER') {
                                  return {
                                    ...p,
                                    role: 'INSTRUCTOR',
                                    isActingOfficer: true,
                                    position: p.position.includes('เจ้าหน้าที่') && !p.position.includes('ผู้ช่วย')
                                      ? p.position.replace('เจ้าหน้าที่', 'ผู้ช่วยเจ้าหน้าที่')
                                      : p.position || 'ผู้ช่วยเจ้าหน้าที่ (ผู้ช่วยงาน)',
                                  };
                                } else if (val === 'STAFF') {
                                  return {
                                    ...p,
                                    role: 'STAFF',
                                    isActingOfficer: false,
                                    position: p.position || 'เจ้าหน้าที่สายสนับสนุน',
                                  };
                                } else {
                                  return {
                                    ...p,
                                    role: 'OFFICER',
                                    isActingOfficer: false,
                                    position: p.position || 'เจ้าหน้าที่หลักสูตร',
                                  };
                                }
                              })
                            );
                          }}
                          className={`text-[11px] font-bold py-1 px-2 rounded-lg border outline-none cursor-pointer transition ${
                            item.isActingOfficer
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : item.role === 'STAFF'
                              ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                              : 'bg-teal-50 text-teal-900 border-teal-300'
                          }`}
                        >
                          <option value="OFFICER">👤 เจ้าหน้าที่หลักสูตร (OFFICER)</option>
                          <option value="ACTING_OFFICER">🎓 ผู้ช่วยเจ้าหน้าที่ (ผู้ช่วยงาน)</option>
                          <option value="STAFF">💼 เจ้าหน้าที่สายสนับสนุน (STAFF)</option>
                        </select>
                        <span className="text-[10px] text-slate-500 font-medium truncate max-w-[160px]" title={item.position}>
                          {item.position}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{item.department || '-'}</td>
                    <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{item.phoneNumber || '-'}</td>
                    <td className="py-2 px-3 font-mono font-semibold text-emerald-700">{item.email}</td>
                    <td className="py-2 px-3 font-mono text-slate-700 font-semibold">{item.password}</td>
                    <td className="py-2 px-3">
                      {item.isExisting ? (
                        <span className="text-[10.5px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          พบบัญชีเดิม (Update)
                        </span>
                      ) : (
                        <span className="text-[10.5px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          สร้างบัญชีใหม่
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {submitError && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {submitSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}
    </div>
  );
};
