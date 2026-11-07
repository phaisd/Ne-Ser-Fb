'use client';

import React from 'react';
import { Eye } from 'lucide-react';

interface PrintScaleToolbarProps {
  showPrintPreviewOnScreen: boolean;
  setShowPrintPreviewOnScreen: (val: boolean | ((prev: boolean) => boolean)) => void;
  printSizePreset: 'COMPACT' | 'STANDARD' | 'LARGE' | 'CUSTOM';
  applyPrintSizePreset: (preset: 'COMPACT' | 'STANDARD' | 'LARGE') => void;
  printRowHeightPx: number;
  printFontSizePx: number;
  handleCustomPrintScaleChange: (newRow: number, newFont: number) => void;
}

export function PrintScaleToolbar({
  showPrintPreviewOnScreen,
  setShowPrintPreviewOnScreen,
  printSizePreset,
  applyPrintSizePreset,
  printRowHeightPx,
  printFontSizePx,
  handleCustomPrintScaleChange,
}: PrintScaleToolbarProps) {
  return (
    <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 print:hidden">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowPrintPreviewOnScreen((prev) => !prev)}
          className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100/60 flex items-center gap-1.5 shadow-2xs cursor-pointer transition"
        >
          <Eye className="w-4 h-4" />
          <span>
            {showPrintPreviewOnScreen
              ? 'ซ่อนตัวอย่างกระดาษ A4'
              : 'แสดงตัวอย่างกระดาษ A4'}
          </span>
        </button>

        {/* Quick Presets for Row Height & Font Size */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-bold text-slate-700 mr-1">
            📏 ขนาดแถว & ตัวอักษร A4:
          </span>
          <button
            type="button"
            onClick={() => applyPrintSizePreset('COMPACT')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border ${
              printSizePreset === 'COMPACT'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="เหมาะสำหรับรายวิชาที่มีนิสิตจำนวนมาก (แถวสูง 24px / ฟอนต์ 12.5px)"
          >
            กะทัดรัด
          </button>
          <button
            type="button"
            onClick={() => applyPrintSizePreset('STANDARD')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border ${
              printSizePreset === 'STANDARD'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="ขนาดมาตรฐานใหม่ อ่านง่าย ช่องกรอกคะแนนสบายตา (แถวสูง 28px / ฟอนต์ 14px)"
          >
            มาตรฐาน (แนะนำ)
          </button>
          <button
            type="button"
            onClick={() => applyPrintSizePreset('LARGE')}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border ${
              printSizePreset === 'LARGE'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="แถวสูงพิเศษและตัวอักษรใหญ่ เขียนคะแนนด้วยปากกาสะดวกมาก (แถวสูง 34px / ฟอนต์ 15.5px)"
          >
            แถวสูง-ตัวใหญ่
          </button>
        </div>
      </div>

      {/* Fine-Tune Controls for Instructor */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-300">
          <span className="text-slate-600 font-semibold">ความสูงแถว:</span>
          <button
            type="button"
            onClick={() => handleCustomPrintScaleChange(printRowHeightPx - 2, printFontSizePx)}
            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-extrabold text-slate-700 flex items-center justify-center cursor-pointer"
            title="ลดความสูงแถว"
          >
            −
          </button>
          <span className="font-mono font-extrabold text-indigo-700 min-w-[38px] text-center">
            {printRowHeightPx}px
          </span>
          <button
            type="button"
            onClick={() => handleCustomPrintScaleChange(printRowHeightPx + 2, printFontSizePx)}
            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-extrabold text-slate-700 flex items-center justify-center cursor-pointer"
            title="เพิ่มความสูงแถว"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-300">
          <span className="text-slate-600 font-semibold">ขนาดตัวอักษร:</span>
          <button
            type="button"
            onClick={() => handleCustomPrintScaleChange(printRowHeightPx, printFontSizePx - 0.5)}
            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-extrabold text-slate-700 flex items-center justify-center cursor-pointer"
            title="ลดขนาดตัวอักษร"
          >
            −
          </button>
          <span className="font-mono font-extrabold text-indigo-700 min-w-[42px] text-center">
            {printFontSizePx}px
          </span>
          <button
            type="button"
            onClick={() => handleCustomPrintScaleChange(printRowHeightPx, printFontSizePx + 0.5)}
            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-extrabold text-slate-700 flex items-center justify-center cursor-pointer"
            title="เพิ่มขนาดตัวอักษร"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
