import React from 'react';
import { AlertOctagon, X } from 'lucide-react';
import type { EventRegistration } from '@/types/event';
import { INSPECTION_PERIODS } from './types';

export interface AbsentReportItem {
  reg: EventRegistration;
  seatNumber: string;
  scanTime?: string;
}

export interface SeatMapAbsentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyStats: { absentList: AbsentReportItem[] } | null;
  inspectionDay: number | 'ALL' | string;
  inspectionPeriod: string;
  onSaveSeatInspection: (
    target: { registrationId: string; studentCode: string; seatNumber: string },
    isOccupied: boolean | null
  ) => void;
}

export const SeatMapAbsentReportModal: React.FC<SeatMapAbsentReportModalProps> = ({
  isOpen,
  onClose,
  dailyStats,
  inspectionDay,
  inspectionPeriod,
  onSaveSeatInspection,
}) => {
  if (!isOpen || !dailyStats) return null;

  const currentPeriod = INSPECTION_PERIODS.find((p) => p.id === inspectionPeriod);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-4 py-3 bg-gradient-to-r from-rose-700 to-rose-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-200" />
            <div>
              <h4 className="font-black text-sm sm:text-base leading-tight">
                รายงานผู้สแกนเข้า แต่ตรวจพบว่าที่นั่งว่าง ({dailyStats.absentList.length} ท่าน)
              </h4>
              <p className="text-[11px] text-rose-200">
                วันที่ {inspectionDay} • {currentPeriod?.nameTh}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-rose-200 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] leading-relaxed">
            💡 รายชื่อด้านล่างนี้คือผู้ที่มีการสแกนเข้ารอบปฏิบัติธรรม แต่เจ้าหน้าที่ตรวจพบว่าไม่อยู่ที่นั่ง (ที่นั่งว่าง) ใช้สำหรับดูสถิติและรายงานคณะกรรมการดำเนินงาน
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5 w-10 text-center">ลำดับ</th>
                  <th className="p-2.5 w-20">ที่นั่ง</th>
                  <th className="p-2.5 w-24">รหัส</th>
                  <th className="p-2.5">ชื่อ-สกุล</th>
                  <th className="p-2.5 w-20 text-center">กลุ่ม</th>
                  <th className="p-2.5 w-24 text-center">เวลาสแกน</th>
                  <th className="p-2.5 w-24 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyStats.absentList.map((item, idx) => (
                  <tr key={item.reg.id} className="hover:bg-rose-50/50">
                    <td className="p-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                    <td className="p-2 font-mono font-black text-rose-700">{item.seatNumber}</td>
                    <td className="p-2 font-mono text-slate-800">{item.reg.studentCode}</td>
                    <td className="p-2 font-bold text-slate-900">{item.reg.studentName}</td>
                    <td className="p-2 text-center text-slate-600">{item.reg.groupNumber || '-'}</td>
                    <td className="p-2 text-center font-mono text-slate-500">{item.scanTime || '-'}</td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          onSaveSeatInspection(
                            {
                              registrationId: item.reg.id,
                              studentCode: item.reg.studentCode,
                              seatNumber: item.seatNumber,
                            },
                            true
                          )
                        }
                        className="px-2 py-1 text-[10.5px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md transition cursor-pointer"
                      >
                        เปลี่ยนเป็นอยู่
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
