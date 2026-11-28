'use client';

import React, { useState, useMemo } from 'react';
import {
  Archive,
  RotateCcw,
  Trash2,
  Download,
  Search,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { downloadXlsx, type XlsxSheet } from '@/lib/utils/xlsx-export';

export interface ArchivedMasterItem {
  id: string;
  name: string;
  nameEn?: string;
  email: string;
  department?: string;
  instructorType?: string;
  role?: string;
  ecclesiasticalTitle?: string;
  contactAddress?: string;
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
}

interface VipassanaMasterArchiveTabProps {
  archivedMasters: ArchivedMasterItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onRestore: (userId: string, name: string) => Promise<void>;
  onDeletePermanent?: (userId: string, name: string) => Promise<void>;
}

export const VipassanaMasterArchiveTab: React.FC<VipassanaMasterArchiveTabProps> = ({
  archivedMasters,
  isLoading,
  onRefresh,
  onRestore,
  onDeletePermanent,
}) => {
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('ALL');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Distinct archive reasons
  const distinctReasons = useMemo(() => {
    const set = new Set<string>();
    archivedMasters.forEach((m) => {
      if (m.archiveReason) set.add(m.archiveReason);
    });
    return Array.from(set);
  }, [archivedMasters]);

  // Filtered list
  const filteredList = useMemo(() => {
    return archivedMasters.filter((m) => {
      if (reasonFilter !== 'ALL') {
        if ((m.archiveReason || '') !== reasonFilter) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (m.name || '').toLowerCase().includes(q);
        const matchEn = (m.nameEn || '').toLowerCase().includes(q);
        const matchEmail = (m.email || '').toLowerCase().includes(q);
        const matchReason = (m.archiveReason || '').toLowerCase().includes(q);
        return matchName || matchEn || matchEmail || matchReason;
      }
      return true;
    });
  }, [archivedMasters, reasonFilter, search]);

  // Export archived masters to Excel
  const handleExportArchiveXlsx = () => {
    if (filteredList.length === 0) {
      alert('ไม่พบข้อมูลพระวิปัสสนาจารย์ในแฟ้มประวัติสำหรับส่งออก');
      return;
    }

    const headers = [
      'ลำดับ',
      'ชื่อ-ฉายา (ภาษาไทย)',
      'ชื่อ-ฉายา (ภาษาอังกฤษ)',
      'ตำแหน่ง',
      'ไอดีเข้าใช้งาน (Email)',
      'หน่วยงาน / ภาควิชา',
      'ปีการศึกษา / เหตุผลการจัดเก็บ',
      'วันที่จัดเก็บเข้าแฟ้มประวัติ',
      'ผู้ดำเนินการ',
    ];

    const rows = filteredList.map((m, idx) => [
      idx + 1,
      m.name || '',
      m.nameEn || '',
      m.instructorType || 'พระวิปัสสนาจารย์',
      m.email || '',
      m.department || '-',
      m.archiveReason || 'จัดเก็บปีก่อนหน้า',
      m.archivedAt ? new Date(m.archivedAt).toLocaleDateString('th-TH') : '-',
      m.archivedBy || 'Admin',
    ]);

    const sheet: XlsxSheet = {
      name: 'แฟ้มประวัติพระวิปัสสนาจารย์',
      title: 'ทำเนียบประวัติพระวิปัสสนาจารย์ปีก่อนหน้า (Archived Masters)',
      subtitle: `ส่งออกเมื่อ ${new Date().toLocaleDateString('th-TH')} • จำนวนทั้งหมด ${rows.length} รูป`,
      headers,
      rows,
      columnWidths: [8, 30, 30, 24, 30, 28, 36, 20, 20],
    };

    downloadXlsx(
      `แฟ้มประวัติพระวิปัสสนาจารย์ปีก่อนหน้า_${new Date().toISOString().split('T')[0]}.xlsx`,
      [sheet]
    );
  };

  const handleRestoreClick = async (id: string, name: string) => {
    if (!window.confirm(`ต้องการกู้คืนบัญชี "${name}" กลับสู่ระบบพระวิปัสสนาจารย์ประจำปีปัจจุบันหรือไม่?`)) {
      return;
    }
    setActionInProgress(id);
    try {
      await onRestore(id, name);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteClick = async (id: string, name: string) => {
    if (!onDeletePermanent) return;
    if (
      !window.confirm(
        `คำเตือน: ต้องการลบบัญชี "${name}" ออกจากระบบและแฟ้มประวัติอย่างถาวรหรือไม่?\n(การกระทำนี้ไม่สามารถย้อนกลับได้)`
      )
    ) {
      return;
    }
    setActionInProgress(id);
    try {
      await onDeletePermanent(id, name);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview & Export Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl border border-indigo-950 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white">
              คลังแฟ้มประวัติพระวิปัสสนาจารย์ปีก่อนหน้า (Archived Vipassana Masters)
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {archivedMasters.length} รูป
            </span>
          </div>
          <p className="text-[11.5px] text-slate-300">
            เก็บรักษาประวัติพระวิปัสสนาจารย์ของปีที่แล้ว/ปีก่อนหน้าอย่างปลอดภัย ไม่สูญหาย สามารถส่งออกรายงาน Excel หรือกู้คืนกลับมาใช้งานได้ตลอดเวลา
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportArchiveXlsx}
            disabled={filteredList.length === 0}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
            title="ส่งออกรายชื่อพระวิปัสสนาจารย์ในแฟ้มประวัติเป็นไฟล์ Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออกประวัติ Excel ({filteredList.length})</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
            title="โหลดข้อมูลแฟ้มประวัติล่าสุด"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาตามชื่อ-ฉายา, อีเมล, หรือปีการศึกษา..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {distinctReasons.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-500 text-[11px] font-bold">ปีการศึกษา/เหตุผล:</span>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="bg-slate-50 text-slate-800 text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
            >
              <option value="ALL">ทั้งหมด ({archivedMasters.length})</option>
              {distinctReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Archive Table */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
          <Archive className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            {search || reasonFilter !== 'ALL'
              ? 'ไม่พบข้อมูลพระวิปัสสนาจารย์ที่ตรงกับเงื่อนไขการค้นหา'
              : 'ยังไม่มีข้อมูลพระวิปัสสนาจารย์ในแฟ้มประวัติ'}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            เมื่อท่านกดย้ายพระวิปัสสนาจารย์ชุดปีก่อนหน้าเข้าแฟ้มประวัติ ข้อมูลทั้งหมดจะปรากฏในหน้านี้อย่างปลอดภัย
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200 shadow-2xs z-10">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-2.5 px-3">ชื่อ-ฉายา</th>
                  <th className="py-2.5 px-3">ตำแหน่ง</th>
                  <th className="py-2.5 px-3">ไอดีเข้าใช้งาน (Email)</th>
                  <th className="py-2.5 px-3">ปีการศึกษา / หมายเหตุ</th>
                  <th className="py-2.5 px-3 text-center">วันที่จัดเก็บ</th>
                  <th className="py-2.5 px-3 text-center w-32">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((m, idx) => {
                  const isProcessing = actionInProgress === m.id;
                  return (
                    <tr key={m.id || idx} className="hover:bg-amber-50/40 transition">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        {m.nameEn && (
                          <div className="text-[11px] text-slate-400 font-sans">{m.nameEn}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-100 text-amber-900">
                          {m.instructorType || 'พระวิปัสสนาจารย์'}
                        </span>
                        {m.department && (
                          <div className="text-[10.5px] text-slate-500 mt-0.5">{m.department}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {m.email || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Calendar className="w-3 h-3 text-indigo-500" />
                          <span>{m.archiveReason || 'จัดเก็บปีก่อนหน้า'}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 text-[11px]">
                        {m.archivedAt
                          ? new Date(m.archivedAt).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRestoreClick(m.id, m.name)}
                            disabled={isProcessing}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer border border-emerald-300 disabled:opacity-50"
                            title="กู้คืนพระวิปัสสนาจารย์รูปนี้กลับเข้าสู่ระบบประจำปีปัจจุบัน"
                          >
                            <RotateCcw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                            <span>กู้คืน</span>
                          </button>

                          {onDeletePermanent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(m.id, m.name)}
                              disabled={isProcessing}
                              className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition cursor-pointer disabled:opacity-50"
                              title="ลบถาวรออกจากระบบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
