'use client';

import React from 'react';
import { Search, Copy, FileSpreadsheet, Download } from 'lucide-react';
import { UserAccount } from '@/types';
import { OfficerExportTabProps } from './types';

export function OfficerExportTab({
  filteredOfficers,
  exportSearch,
  setExportSearch,
  exportRoleFilter,
  setExportRoleFilter,
  copiedLineId,
  copiedAllTable,
  onCopySingleLine,
  onCopyAllTable,
  onExportXlsx,
  onExportCsv,
}: OfficerExportTabProps) {
  return (
    <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล, ภาควิชา..."
              value={exportSearch}
              onChange={(e) => setExportSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs w-48 sm:w-60 outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs">
            <span className="font-bold text-slate-600">ประเภท:</span>
            <select
              value={exportRoleFilter}
              onChange={(e) => setExportRoleFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="OFFICER">เจ้าหน้าที่หลักสูตร (OFFICER)</option>
              <option value="ACTING">ผู้ช่วยเจ้าหน้าที่ (ผู้ช่วยงาน)</option>
              <option value="STAFF">เจ้าหน้าที่ทั่วไป (STAFF)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopyAllTable}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="คัดลอกข้อความสรุปรายชื่อและรหัสผ่านสำหรับส่งใน LINE"
          >
            <Copy className="w-3.5 h-3.5 text-emerald-700" />
            <span>{copiedAllTable ? '✓ คัดลอกสำเร็จ!' : 'คัดลอกสำหรับส่ง LINE'}</span>
          </button>

          <button
            type="button"
            onClick={onExportXlsx}
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ส่งออก Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Officer Export Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
              <th className="py-2.5 px-3">บทบาทในระบบ</th>
              <th className="py-2.5 px-3">ตำแหน่ง / สังกัด</th>
              <th className="py-2.5 px-3">เบอร์โทร</th>
              <th className="py-2.5 px-3">ไอดีเข้าสู่ระบบ (Username)</th>
              <th className="py-2.5 px-3">รหัสผ่านเริ่มต้น</th>
              <th className="py-2.5 px-3 text-right">การกระทำ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOfficers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                  ไม่พบข้อมูลเจ้าหน้าที่ตามเงื่อนไขที่ค้นหา
                </td>
              </tr>
            ) : (
              filteredOfficers.map((u, idx) => {
                const isActing = Boolean((u as any).isActingOfficer);
                const pwd = u.defaultPassword || (u as any).password || 'Fb8323mcu';
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2 px-3 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                        u.role === 'OFFICER'
                          ? 'bg-teal-100 text-teal-800'
                          : isActing
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {u.role === 'OFFICER' ? 'เจ้าหน้าที่หลักสูตร' : isActing ? 'ผู้ช่วยเจ้าหน้าที่' : 'เจ้าหน้าที่ (Staff)'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{u.department || 'สำนักงานคณบดี คณะพุทธศาสตร์'}</td>
                    <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{(u as any).phoneNumber || '-'}</td>
                    <td className="py-2 px-3 font-mono font-bold text-emerald-800">{u.email}</td>
                    <td className="py-2 px-3 font-mono font-bold text-amber-800 bg-amber-50/50 px-2 rounded">
                      {pwd}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onCopySingleLine(u)}
                        className="px-2 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 transition cursor-pointer"
                        title="คัดลอกข้อมูลบัญชีนี้เพื่อส่งให้เจ้าหน้าที่"
                      >
                        {copiedLineId === u.id ? '✓ คัดลอกแล้ว' : 'คัดลอกส่ง LINE'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
