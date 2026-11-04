'use client';

import React from 'react';
import { Table2, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';

interface AdminSheetsTabProps {
  sheetStatus: {
    connected?: boolean;
    spreadsheetTitle?: string;
    sheets?: string[];
  } | null;
  syncingSheet: boolean;
  onInitialSync: () => void | Promise<void>;
}

export const AdminSheetsTab: React.FC<AdminSheetsTabProps> = ({
  sheetStatus,
  syncingSheet,
  onInitialSync,
}) => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Table2 className="w-5 h-5 text-emerald-600" />
          การเชื่อมต่อ Google Sheets API (Database & Real-time Sync)
        </h2>
        <p className="text-xs text-slate-500">
          ตรวจสอบการเชื่อมต่อสองทาง (Two-Way Sync) ระหว่างระบบกับ Google Sheets
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        {sheetStatus?.connected ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">เชื่อมต่อกับ Google Sheets สำเร็จเรียบร้อย</div>
              <div className="text-xs text-emerald-700 mt-0.5">
                ชื่อ Spreadsheet: <span className="font-semibold">{sheetStatus.spreadsheetTitle}</span>
              </div>
              {sheetStatus.sheets && (
                <div className="text-xs text-emerald-700 mt-1">
                  แท็บที่พบในชีต: {sheetStatus.sheets.join(', ')}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">โหมดข้อมูลภายใน (Local JSON Data Mode)</div>
              <div className="text-xs text-amber-700 mt-0.5">
                ระบบกำลังอ่านและบันทึกข้อมูลผ่านไฟล์ในเครื่องอย่างสมบูรณ์
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onInitialSync}
            disabled={syncingSheet}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>
              {syncingSheet
                ? 'กำลังส่งข้อมูลขึ้น Google Sheets...'
                : 'ส่งออกข้อมูลตั้งต้นขึ้นสู่ Google Sheets (Initial Sync)'}
            </span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <div className="font-bold text-slate-800">📌 ข้อชี้แจงการทำงาน:</div>
          <p>• เมื่อมีการบันทึกการเช็คชื่อ หรือแก้ไขข้อมูลนิสิต ข้อมูลจะถูกเขียนลง Google Sheets ให้อัตโนมัติในทันที</p>
          <p>• เมื่อขึ้นปีใหม่ ไม่จำเป็นต้องกดปุ่ม Initial Sync ซ้ำ ข้อมูลปีก่อนหน้าจะถูกแยกเก็บตามปี พ.ศ. และปีการศึกษาอย่างปลอดภัย</p>
        </div>
      </div>
    </div>
  );
};
