import React from 'react';
import { Sparkles, X } from 'lucide-react';

export type AutoSortCriterion =
  | 'STATUS_GENDER'
  | 'STATUS_INTER'
  | 'VASSA'
  | 'MAX_CAPACITY'
  | 'GROUP'
  | 'STUDENT_CODE'
  | 'NAME';

export interface SeatMapAutoAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  registrationsCount: number;
  autoSortBy: AutoSortCriterion;
  setAutoSortBy: (criterion: AutoSortCriterion) => void;
  onAutoAssign: () => void;
  isSaving: boolean;
  onOpenImportExport: () => void;
}

export const SeatMapAutoAssignModal: React.FC<SeatMapAutoAssignModalProps> = ({
  isOpen,
  onClose,
  registrationsCount,
  autoSortBy,
  setAutoSortBy,
  onAutoAssign,
  isSaving,
  onOpenImportExport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl p-5 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>จัดที่นั่งอัตโนมัติ (Auto-Assign)</span>
          </h4>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          ระบบจะคำนวณและจัดที่นั่งให้แก่ผู้เข้าร่วมโครงการทั้งหมด ({registrationsCount} คน) ตามเกณฑ์ที่เลือก เพื่อให้ใช้พื้นที่ห้องได้คุ้มค่าสูงสุด:
        </p>

        <div className="space-y-2">
          {/* 1. จัดเรียงตามสถานภาพและเพศ */}
          <label
            className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition ${
              autoSortBy === 'STATUS_GENDER'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-slate-50 border-slate-200'
            }`}
            onClick={() => setAutoSortBy('STATUS_GENDER')}
          >
            <div className="space-y-0.5 pr-2">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black">
                  แนะนำ
                </span>
                <span>จัดตามสถานภาพ & เพศ (อัดแน่นเต็มความจุ ไม่แยกกลุ่ม)</span>
              </div>
              <div className="text-[11px] text-slate-600 leading-snug">
                เรียง: พระภิกษุ ➔ สามเณร ➔ ภิกษุณี ➔ แม่ชี ➔ ฆราวาสชาย ➔ ฆราวาสหญิง
              </div>
              <div className="text-[10px] text-amber-800 font-medium">
                * จัดนั่งเรียงต่อเนื่องกันจนเต็มความจุห้อง ถูกต้องตามพระวินัย โดยไม่ต้องคำนึงถึงกลุ่ม
              </div>
            </div>
            <input
              type="radio"
              name="autoSortBy"
              checked={autoSortBy === 'STATUS_GENDER'}
              onChange={() => setAutoSortBy('STATUS_GENDER')}
              className="accent-amber-600 mt-1 cursor-pointer"
            />
          </label>

          {/* 2. จัดเรียงตามสถานภาพ + แยกภาษา */}
          <label
            className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition ${
              autoSortBy === 'STATUS_INTER'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-slate-50 border-slate-200'
            }`}
            onClick={() => setAutoSortBy('STATUS_INTER')}
          >
            <div className="space-y-0.5 pr-2">
              <div className="font-bold text-xs text-slate-900">
                จัดตามสถานภาพ + แยกภาษา (ไทย ➔ นานาชาติ Inter)
              </div>
              <div className="text-[11px] text-slate-600">
                จัดพระภิกษุไทย/Inter และ ฆราวาสไทย/Inter เป็นสัดส่วนเรียงตามแถว
              </div>
            </div>
            <input
              type="radio"
              name="autoSortBy"
              checked={autoSortBy === 'STATUS_INTER'}
              onChange={() => setAutoSortBy('STATUS_INTER')}
              className="accent-amber-600 mt-1 cursor-pointer"
            />
          </label>

          {/* 3. จัดเต็มความจุตามรหัสนิสิต (Max Capacity) */}
          <label
            className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition ${
              autoSortBy === 'MAX_CAPACITY'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-slate-50 border-slate-200'
            }`}
            onClick={() => setAutoSortBy('MAX_CAPACITY')}
          >
            <div className="space-y-0.5 pr-2">
              <div className="font-bold text-xs text-slate-900">
                เรียงตามรหัสนิสิต (Max Capacity)
              </div>
              <div className="text-[11px] text-slate-600">
                เรียงรหัสนิสิตน้อยไปหามาก อัดแน่นทุกที่นั่งต่อเนื่องกัน ไม่แยกกลุ่ม
              </div>
            </div>
            <input
              type="radio"
              name="autoSortBy"
              checked={autoSortBy === 'MAX_CAPACITY'}
              onChange={() => setAutoSortBy('MAX_CAPACITY')}
              className="accent-amber-600 mt-1 cursor-pointer"
            />
          </label>

          {/* 4. เรียงตามกลุ่มปฏิบัติธรรม */}
          <label
            className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition ${
              autoSortBy === 'GROUP'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-slate-50 border-slate-200'
            }`}
            onClick={() => setAutoSortBy('GROUP')}
          >
            <div className="space-y-0.5 pr-2">
              <div className="font-bold text-xs text-slate-900">
                เรียงตามกลุ่มปฏิบัติธรรม
              </div>
              <div className="text-[11px] text-slate-600">
                กลุ่มที่ 1, 2, 3.. นั่งเรียงติดกันตามแถว
              </div>
            </div>
            <input
              type="radio"
              name="autoSortBy"
              checked={autoSortBy === 'GROUP'}
              onChange={() => setAutoSortBy('GROUP')}
              className="accent-amber-600 mt-1 cursor-pointer"
            />
          </label>

          {/* 5. จัดเรียงตามพรรษา */}
          <label
            className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition ${
              autoSortBy === 'VASSA'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-slate-50 border-slate-200'
            }`}
            onClick={() => setAutoSortBy('VASSA')}
          >
            <div className="space-y-0.5 pr-2">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                  ตามพรรษา
                </span>
                <span>จัดตามพรรษา (พระภิกษุพรรษามาก ➔ พรรษาน้อย)</span>
              </div>
              <div className="text-[11px] text-slate-600">
                เรียงพระภิกษุตามพรรษามากไปน้อย จากนั้นตามด้วยสามเณร และฆราวาส ตามลำดับอาวุโส
              </div>
            </div>
            <input
              type="radio"
              name="autoSortBy"
              checked={autoSortBy === 'VASSA'}
              onChange={() => setAutoSortBy('VASSA')}
              className="accent-amber-600 mt-1 cursor-pointer"
            />
          </label>

          {/* 6. เรียงตามตัวอักษรชื่อ-สกุล */}
          <label
            className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition ${
              autoSortBy === 'NAME'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-slate-50 border-slate-200'
            }`}
            onClick={() => setAutoSortBy('NAME')}
          >
            <div className="space-y-0.5 pr-2">
              <div className="font-bold text-xs text-slate-900">
                เรียงตามตัวอักษรชื่อ-สกุล
              </div>
              <div className="text-[11px] text-slate-600">ก - ฮ</div>
            </div>
            <input
              type="radio"
              name="autoSortBy"
              checked={autoSortBy === 'NAME'}
              onChange={() => setAutoSortBy('NAME')}
              className="accent-amber-600 mt-1 cursor-pointer"
            />
          </label>
        </div>

        {/* Shortcut to Excel import/export */}
        <div className="p-3 bg-indigo-50/80 rounded-xl text-[11px] text-indigo-900 border border-indigo-200 flex items-center justify-between gap-2">
          <span>ต้องการกำหนดที่นั่งด้วยตนเองผ่านไฟล์?</span>
          <button
            type="button"
            onClick={onOpenImportExport}
            className="font-bold underline text-indigo-700 hover:text-indigo-900 whitespace-nowrap cursor-pointer"
          >
            นำเข้า/ส่งออก Excel &rarr;
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onAutoAssign}
            disabled={isSaving}
            className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>เริ่มจัดที่นั่งทันที</span>
          </button>
        </div>
      </div>
    </div>
  );
};
