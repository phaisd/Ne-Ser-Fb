'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  Archive,
  Search,
  Eye,
  EyeOff,
  ShieldCheck,
  FileCheck2,
  Paperclip,
  Trash2,
  FileSpreadsheet,
  Download,
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { CertificateRequest } from '@/types';
import { calculateNextDocNo } from '@/lib/utils';

interface AdminCertificatesTabProps {
  requests: CertificateRequest[];
  filteredRequests: CertificateRequest[];
  availableYears: string[];
  filterYear: string;
  setFilterYear: (yr: string) => void;
  setArchivingYear: (yr: string) => void;
  setIsArchiveModalOpen: (open: boolean) => void;
  setAcademicArchives: (archives: any[]) => void;
  statusFilter: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
  setStatusFilter: (st: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') => void;
  pendingRequests: CertificateRequest[];
  approvedRequests: CertificateRequest[];
  rejectedRequests: CertificateRequest[];
  search: string;
  setSearch: (s: string) => void;
  unmaskPassport: boolean;
  setUnmaskPassport: (u: boolean) => void;
  formatPassport: (num?: string) => string;
  approvingId: string | null;
  setApprovingId: (id: string | null) => void;
  docNoInput: string;
  setDocNoInput: (v: string) => void;
  handleApprove: (id: string, defaultDocNo?: string, prefix?: '8002' | '8002.1') => void;
  handleOpenRejectModal: (r: CertificateRequest) => void;
  setPreviewRequest: (r: CertificateRequest | null) => void;
  setPreviewTab: (t: 'DOCUMENT' | 'ATTACHMENTS') => void;
  onRefreshData?: () => void;
  onSuccessMessage?: (msg: string) => void;
}

export function AdminCertificatesTab({
  requests,
  filteredRequests,
  availableYears,
  filterYear,
  setFilterYear,
  setArchivingYear,
  setIsArchiveModalOpen,
  setAcademicArchives,
  statusFilter,
  setStatusFilter,
  pendingRequests,
  approvedRequests,
  rejectedRequests,
  search,
  setSearch,
  unmaskPassport,
  setUnmaskPassport,
  formatPassport,
  approvingId,
  setApprovingId,
  docNoInput,
  setDocNoInput,
  handleApprove,
  handleOpenRejectModal,
  setPreviewRequest,
  setPreviewTab,
  onRefreshData,
  onSuccessMessage,
}: AdminCertificatesTabProps) {
  const [requestToDelete, setRequestToDelete] = useState<CertificateRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showClearMockModal, setShowClearMockModal] = useState(false);
  const [isClearingMock, setIsClearingMock] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [quickApprovePrefix, setQuickApprovePrefix] = useState<'8002' | '8002.1'>('8002');

  // Sync to Google Sheets
  const handleSyncSheets = async () => {
    setIsSyncingSheets(true);
    try {
      const res = await fetch('/api/certificates?action=sync_sheets', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (onSuccessMessage) {
          onSuccessMessage(`ซิงค์ข้อมูลไปยัง Google Sheets สำเร็จ (${data.count} รายการ)`);
        } else {
          alert(`ซิงค์ข้อมูลไปยัง Google Sheets สำเร็จ (${data.count} รายการ)`);
        }
      } else {
        alert('เกิดข้อผิดพลาดในการซิงค์: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('ไม่สามารถเชื่อมต่อกับ Google Sheets ได้: ' + err.message);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (requests.length === 0) {
      alert('ไม่มีรายการคำร้องที่จะส่งออก');
      return;
    }
    const headers = [
      'ID',
      'วันที่ยื่น',
      'รหัสนิสิต',
      'ชื่อ-สกุล',
      'ประเภทหนังสือ',
      'ระดับการศึกษา',
      'สาขาวิชา',
      'วัตถุประสงค์',
      'สถานะ',
      'เลขที่หนังสือ อว',
      'อีเมล',
      'เบอร์โทร',
      'สัญชาติ',
      'พาสปอร์ต',
    ];
    const rows = requests.map((r) => [
      `"${r.id}"`,
      `"${new Date(r.createdAt).toLocaleDateString('th-TH')}"`,
      `"${r.studentCode}"`,
      `"${(r.fullName || '').replace(/"/g, '""')}"`,
      `"${(r.certType || '').replace(/"/g, '""')}"`,
      `"${r.degreeLevel || ''}"`,
      `"${r.major || ''}"`,
      `"${(r.requestPurpose || '').replace(/"/g, '""')}"`,
      `"${r.status}"`,
      `"${r.docNo || ''}"`,
      `"${r.email || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.nationality || ''}"`,
      `"${r.passportNo || ''}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `certificate_requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Confirm delete single request
  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/certificates?id=${requestToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (onSuccessMessage) {
          onSuccessMessage(`ลบคำร้องของ "${requestToDelete.fullName}" เรียบร้อยแล้ว`);
        }
        setRequestToDelete(null);
        if (onRefreshData) onRefreshData();
      } else {
        alert('ลบไม่สำเร็จ: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Confirm clear mock data
  const handleConfirmClearMock = async () => {
    setIsClearingMock(true);
    try {
      const res = await fetch('/api/certificates?action=clear_mock', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (onSuccessMessage) {
          onSuccessMessage(data.message || 'ล้างข้อมูลทดสอบเรียบร้อยแล้ว');
        } else {
          alert(data.message || 'ล้างข้อมูลทดสอบเรียบร้อยแล้ว');
        }
        setShowClearMockModal(false);
        if (onRefreshData) onRefreshData();
      } else {
        alert('ล้างข้อมูลไม่สำเร็จ: ' + data.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsClearingMock(false);
    }
  };
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              งานอนุมัติคำร้องหนังสือรับรอง (Certificate Approvals)
            </h2>
            <p className="text-xs text-slate-500">
              พิจารณาคำร้อง ออกเลขที่ อว 8002/xxx และสั่งพิมพ์หนังสือรับรอง
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
            <div className="flex items-center gap-1 p-1 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold">
              <span className="text-purple-700 pl-2 pr-1 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-600" /> ปี พ.ศ.:
              </span>
              <button
                onClick={() => setFilterYear('ALL')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filterYear === 'ALL'
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'text-purple-700 hover:bg-purple-100'
                }`}
              >
                ทั้งหมด
              </button>
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setFilterYear(yr)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    filterYear === yr
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  ปี {yr}
                </button>
              ))}

              {/* Academic Year Archiving Button */}
              <button
                type="button"
                onClick={() => {
                  setArchivingYear(filterYear === 'ALL' ? '2569' : filterYear);
                  setIsArchiveModalOpen(true);
                  fetch('/api/archives')
                    .then((r) => r.json())
                    .then((d) => d.success && setAcademicArchives(d.data));
                }}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 transition font-bold flex items-center gap-1 cursor-pointer"
                title="สรุปสถิติและปิดยอดจัดเก็บประวัติแยกปีการศึกษา"
              >
                <Archive className="w-3.5 h-3.5 text-purple-600" />
                <span>ปิดยอดปีการศึกษา</span>
              </button>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1 rounded-lg transition ${
                  statusFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-700'
                }`}
              >
                รอตรวจ ({pendingRequests.length})
              </button>
              <button
                onClick={() => setStatusFilter('APPROVED')}
                className={`px-3 py-1 rounded-lg transition ${
                  statusFilter === 'APPROVED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700'
                }`}
              >
                อนุมัติ ({approvedRequests.length})
              </button>
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-3 py-1 rounded-lg transition ${
                  statusFilter === 'REJECTED' ? 'bg-red-600 text-white shadow-sm' : 'text-red-700'
                }`}
              >
                ปฏิเสธ ({rejectedRequests.length})
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัสนิสิต, ชื่อ-สกุล หรือเลขที่หนังสือ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          <button
            type="button"
            onClick={() => setUnmaskPassport(!unmaskPassport)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer ${
              unmaskPassport
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="เปิด/ปิดการปกปิดเลขหนังสือเดินทางตามนโยบาย PDPA (Data Protection)"
          >
            {unmaskPassport ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>{unmaskPassport ? 'แสดงเลขเต็ม (Officer Mode)' : '🔒 ซ่อนเลข Passport (PDPA Mask)'}</span>
          </button>
          <Link
            href="/verify"
            target="_blank"
            className="px-3 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0"
            title="เปิดหน้าระบบตรวจสอบเอกสารสำหรับ ตม. และสถานทูต"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>ระบบตรวจเอกสาร ตม. (/verify)</span>
          </Link>
        </div>

        {/* Action Toolbar for Data Sync & Export */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSyncSheets}
              disabled={isSyncingSheets}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
              title="ซิงค์และสำรองข้อมูลคำร้องทั้งหมดไปยัง Google Sheets"
            >
              {isSyncingSheets ? (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>{isSyncingSheets ? 'กำลังซิงค์...' : 'ซิงค์ Google Sheets'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="ดาวน์โหลดข้อมูลคำร้องทั้งหมดเป็นไฟล์ Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>ดาวน์โหลด CSV</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowClearMockModal(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-800 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="ล้างข้อมูลจำลอง/ทดสอบที่ตกค้างในระบบ (สำรองไฟล์ก่อนล้างอัตโนมัติ)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>ล้างข้อมูลทดสอบ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
              <tr>
                <th className="px-5 py-3.5">วันที่ยื่น</th>
                <th className="px-5 py-3.5">รหัสนิสิต</th>
                <th className="px-5 py-3.5">ชื่อ - นามสกุล</th>
                <th className="px-5 py-3.5">ประเภทหนังสือรับรอง</th>
                <th className="px-5 py-3.5">เลขที่หนังสือราชการ</th>
                <th className="px-5 py-3.5 text-center">สถานะ</th>
                <th className="px-5 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                    ไม่พบรายการคำร้องตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  const isApprovingThis = approvingId === r.id;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-purple-700">
                        {r.applicantType === 'STAFF' || r.targetAudience === 'STAFF' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              👔 อาจารย์/บุคลากร
                            </span>
                            <div className="text-[11px] text-slate-500 font-mono">{r.studentCode || 'STAFF'}</div>
                          </div>
                        ) : r.applicantType === 'CANDIDATE' || r.targetAudience === 'CANDIDATE' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              🎓 ผู้ผ่านการคัดเลือก
                            </span>
                            <div className="text-[11px] text-emerald-800 font-mono font-bold">{r.studentCode}</div>
                          </div>
                        ) : (
                          r.studentCode
                        )}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-900">
                        <div>{r.fullName}</div>
                        <div className="text-[11px] text-slate-400">
                          {r.nationality === 'ไทย' || r.nationality === 'Thai'
                            ? '🇹🇭 สัญชาติไทย'
                            : `🌐 สัญชาติ ${r.nationality || 'ต่างชาติ'} (Pass: ${formatPassport(r.passportNo)})`}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {r.enrollmentSlipUrl ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="มีสำเนาการลงทะเบียนเรียนแนบมาแล้ว">
                              <FileCheck2 className="w-3 h-3 text-emerald-600" /> สำเนาลงเรียน ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="ยังไม่มีสำเนาการลงทะเบียนเรียน">
                              ⚠️ ขาดสำเนาลงเรียน
                            </span>
                          )}
                          {r.passportCopyUrl && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                              <Paperclip className="w-2.5 h-2.5" /> สำเนาพาสปอร์ต
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                        {r.certType}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono">
                        {r.docNo ? (
                          <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            อว {r.docNoPrefix || (r.docNo.includes('8002.1') ? '8002.1' : '8002')}/{r.docNo.replace(/^(8002\.1|8002)\s*\/\s*/i, '')}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">ยังไม่ออกเลข</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
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
                            : 'รอพิจารณา'}
                        </span>
                        {r.status === 'REJECTED' && r.rejectReason && (
                          <div className="text-[10px] text-red-600 mt-1 max-w-[150px] truncate mx-auto font-medium" title={`เหตุผล: ${r.rejectReason}`}>
                            ⚠️ {r.rejectReason}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isApprovingThis ? (
                          <div className="flex items-center justify-end gap-1.5 animate-in fade-in">
                            <select
                              value={quickApprovePrefix}
                              onChange={(e) => setQuickApprovePrefix(e.target.value as any)}
                              className="px-1.5 py-1 text-xs border border-purple-300 rounded font-bold text-purple-900 bg-purple-50"
                              title="เลือกระดับเลขที่หนังสือ: คณบดี (8002) หรือ เลขานุการ (8002.1)"
                            >
                              <option value="8002">อว 8002 (คณบดี)</option>
                              <option value="8002.1">อว 8002.1 (เลขานุการ)</option>
                            </select>
                            <input
                              type="text"
                              placeholder={calculateNextDocNo(requests).docNoWithYear}
                              value={docNoInput}
                              onChange={(e) => setDocNoInput(e.target.value)}
                              className="w-24 px-2 py-1 text-xs border border-purple-300 rounded font-mono"
                            />
                            <button
                              onClick={() => handleApprove(r.id, undefined, quickApprovePrefix)}
                              className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-bold"
                            >
                              ยืนยัน
                            </button>
                            <button
                              onClick={() => setApprovingId(null)}
                              className="px-2 py-1 rounded bg-slate-200 text-slate-600 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            {r.status === 'PENDING' && (
                              <button
                                onClick={() => setApprovingId(r.id)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer"
                              >
                                อนุมัติ
                              </button>
                            )}
                            {r.status === 'PENDING' && (
                              <button
                                onClick={() => handleOpenRejectModal(r)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="ปฏิเสธคำร้องพร้อมระบุเหตุผล"
                              >
                                ปฏิเสธ
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setPreviewRequest(r);
                                setPreviewTab('ATTACHMENTS');
                              }}
                              className={`px-2 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer border ${
                                r.enrollmentSlipUrl
                                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 font-bold'
                                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200'
                              }`}
                              title="ตรวจเอกสารแนบ เช่น สำเนาลงเรียน, พาสปอร์ต"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>ตรวจเอกสาร</span>
                            </button>
                            <button
                              onClick={() => {
                                setPreviewRequest(r);
                                setPreviewTab('DOCUMENT');
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>พิมพ์/ดู</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setRequestToDelete(r)}
                              className="p-1.5 rounded-lg text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                              title="ลบคำร้องนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {requestToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  ยืนยันการลบคำร้อง
                </h3>
                <p className="text-xs text-slate-500">
                  ระบบจะลบรายการนี้ออกจากฐานข้อมูลและ Google Sheets
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-900 text-sm">{requestToDelete.fullName}</div>
              <div className="text-slate-600">รหัสนิสิต: <span className="font-mono font-bold text-purple-700">{requestToDelete.studentCode || '-'}</span></div>
              <div className="text-slate-600">ประเภทหนังสือ: <span className="font-medium text-slate-800">{requestToDelete.certType}</span></div>
              {requestToDelete.docNo && (
                <div className="text-slate-600">เลขที่ อว: <span className="font-mono text-purple-700 font-bold">{requestToDelete.docNo}</span></div>
              )}
              <div className="text-slate-600">สถานะ: <span className="font-semibold">{requestToDelete.status}</span></div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>คำร้องที่ถูกลบจะไม่สามารถกู้คืนได้ โปรดยืนยันหากต้องการลบรายการนี้</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRequestToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'กำลังลบ...' : 'ยืนยันลบคำร้อง'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Mock Data Modal */}
      {showClearMockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  ล้างข้อมูลทดสอบ (Mock Data)
                </h3>
                <p className="text-xs text-slate-500">
                  ลบรายการคำร้องทดสอบเดิมออกจากตารางอนุมัติ
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1 leading-relaxed">
              <p>ระบบจะทำการสำรองข้อมูลเดิมทั้งหมดไว้ที่ไฟล์ <code>certificate_requests.backup.json</code> โดยอัตโนมัติก่อนล้าง</p>
              <p className="text-slate-500">รายการคำร้องจริงที่ยื่นเข้ามาจะไม่ได้รับผลกระทบ</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearMockModal(false)}
                disabled={isClearingMock}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmClearMock}
                disabled={isClearingMock}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isClearingMock ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isClearingMock ? 'กำลังล้าง...' : 'ยืนยันล้างข้อมูลทดสอบ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
