import React from 'react';
import { Barcode } from 'lucide-react';

export interface ScannerHardwareInputProps {
  inputCode: string;
  setInputCode: (val: string) => void;
  isSubmitting: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (e: React.FormEvent) => void;
}

export const ScannerHardwareInput: React.FC<ScannerHardwareInputProps> = ({
  inputCode,
  setInputCode,
  isSubmitting,
  inputRef,
  onSubmit,
}) => {
  return (
    <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-2.5 sm:p-3.5 shadow-2xs">
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Barcode className="w-4 h-4 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="ยิงปืนบาร์โค้ด หรือพิมพ์รหัส (เช่น T307, 6501...)..."
            disabled={isSubmitting}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-purple-300 font-mono text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !inputCode.trim()}
          className="px-3.5 sm:px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
        >
          {isSubmitting ? 'บันทึก...' : 'เช็คชื่อ'}
        </button>
      </form>
    </div>
  );
};
