'use client';

import React from 'react';
import { Calendar, Printer } from 'lucide-react';
import { CertificateRequest } from './types';
import { maskPassport } from '@/lib/utils/formatters';

interface CertificateAdminTabProps {
  filteredRequests: CertificateRequest[];
  totalRequestsCount: number;
  filterCertYear: string;
  setFilterCertYear: (val: string) => void;
  availableCertYears: string[];
  onPreviewRequest: (r: CertificateRequest) => void;
}

export const CertificateAdminTab: React.FC<CertificateAdminTabProps> = ({
  filteredRequests,
  totalRequestsCount,
  filterCertYear,
  setFilterCertYear,
  availableCertYears,
  onPreviewRequest,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-800">
            รายการคำร้องทั้งหมดในระบบ ({filteredRequests.length} จาก {totalRequestsCount} รายการ)
          </h3>
          <p className="text-xs text-slate-500">ข้อมูลเชื่อมต่อแบบสองทางกับ Google Sheets</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
            <span className="text-slate-500 pl-2 pr-1 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-600" /> ปี พ.ศ.:
            </span>
            <button
              onClick={() => setFilterCertYear('ALL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterCertYear === 'ALL'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด (ย้อนหลัง)
            </button>
            {availableCertYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setFilterCertYear(yr)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterCertYear === yr
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ปี {yr}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold">
              นิสิตไทย: {filteredRequests.filter((r) => r.nationality === 'ไทย' || r.nationality === 'Thai').length}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-bold">
              นิสิตต่างชาติ: {filteredRequests.filter((r) => r.nationality !== 'ไทย' && r.nationality !== 'Thai').length}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
            <tr>
              <th className="px-6 py-4">วันที่ยื่น</th>
              <th className="px-6 py-4">รหัสนิสิต</th>
              <th className="px-6 py-4">ชื่อ - นามสกุล</th>
              <th className="px-6 py-4">สัญชาติ / เอกสาร</th>
              <th className="px-6 py-4">ประเภทคำร้อง</th>
              <th className="px-6 py-4">เลขที่เอกสาร</th>
              <th className="px-6 py-4 text-center">สถานะ</th>
              <th className="px-6 py-4 text-right">พิมพ์</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRequests.map((r) => {
              const isThai = r.nationality === 'ไทย' || r.nationality === 'Thai';

              return (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-purple-700">
                    {r.studentCode}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <div>{r.fullName}</div>
                    <div className="text-[11px] text-slate-400">{r.degreeLevel} {r.major}</div>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {isThai ? (
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        ไทย
                      </span>
                    ) : (
                      <div>
                        <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          {r.nationality || 'ต่างชาติ'}
                        </span>
                        {r.passportNo && (
                          <div className="font-mono text-[11px] text-slate-500 mt-0.5" title="เลขหนังสือเดินทางถูกปกปิดบางส่วนตามนโยบาย PDPA">
                            🔒 Pass: {maskPassport(r.passportNo)}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                    {r.certType}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-700 font-bold">
                    {r.docNo ? `8002/${r.docNo}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        r.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status === 'APPROVED'
                        ? 'อนุมัติแล้ว'
                        : r.status === 'REJECTED'
                        ? 'ปฏิเสธ'
                        : 'รอดำเนินการ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onPreviewRequest(r)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      พิมพ์
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
