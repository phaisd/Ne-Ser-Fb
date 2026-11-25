'use client';

import React from 'react';
import {
  X,
  Smartphone,
  Camera,
  CheckCircle2,
  Copy,
  MapPin,
  ExternalLink,
  QrCode,
} from 'lucide-react';
import type { StudentEvent } from '@/types/event';

interface SeatMapQrShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent;
  mobileScannerQrDataUrl: string;
  mobileSeatingQrDataUrl: string;
  mobileSeatScanUrl: string;
  mobilePublicSeatingUrl: string;
  copiedMobileUrl: string | null;
  onCopyMobileUrl: (url: string, key: string) => void;
  onOpenSeatScanner?: (event: StudentEvent) => void;
  onOpenEventQr?: (event: StudentEvent) => void;
  onParentClose: () => void;
}

export const SeatMapQrShareModal: React.FC<SeatMapQrShareModalProps> = ({
  isOpen,
  onClose,
  event,
  mobileScannerQrDataUrl,
  mobileSeatingQrDataUrl,
  mobileSeatScanUrl,
  mobilePublicSeatingUrl,
  copiedMobileUrl,
  onCopyMobileUrl,
  onOpenSeatScanner,
  onOpenEventQr,
  onParentClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                QR Code & ลิงก์มือถือสำหรับตรวจเช็คและค้นหาที่นั่ง
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-sm sm:max-w-md">
                โครงการ: {event.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Staff Rapid Seat Scanner */}
            <div className="rounded-2xl border-2 border-emerald-400 bg-gradient-to-b from-emerald-50/70 via-white to-emerald-50/30 p-4 flex flex-col justify-between space-y-3">
              <div className="text-center space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-600 text-white">
                  <Camera className="w-3 h-3 text-emerald-100" />
                  <span>สำหรับเจ้าหน้าที่จุดเข้าห้อง</span>
                </span>
                <h4 className="font-bold text-slate-900 text-sm">
                  สแกนตรวจเช็คผู้เข้าที่นั่ง
                </h4>
                <p className="text-[11px] text-slate-600 leading-snug">
                  ใช้กล้องมือถือส่องป้ายชื่อเพื่อเช็คอินและบอกเลขที่นั่งทันที
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-1">
                {mobileScannerQrDataUrl ? (
                  <img
                    src={mobileScannerQrDataUrl}
                    alt="Mobile Scanner QR"
                    className="w-40 h-40 rounded-2xl border-2 border-emerald-200 bg-white p-2 shadow-xs object-contain"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                    กำลังสร้าง QR...
                  </div>
                )}
                <span className="text-[10px] font-bold text-emerald-800 mt-1">
                  สแกนเพื่อเปิดจุดสแกนบนมือถือ
                </span>
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => onCopyMobileUrl(mobileSeatScanUrl, 'SCANNER')}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  {copiedMobileUrl === 'SCANNER' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-200" />
                      <span>คัดลอกลิงก์แล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกลิงก์สแกนเนอร์</span>
                    </>
                  )}
                </button>

                {onOpenSeatScanner && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onParentClose();
                      onOpenSeatScanner(event);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer border border-emerald-200"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>เปิดสแกนเนอร์บนอุปกรณ์นี้ทันที</span>
                  </button>
                )}
              </div>
            </div>

            {/* Card 2: Public Self-Service Seat Finder */}
            <div className="rounded-2xl border-2 border-slate-400 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/30 p-4 flex flex-col justify-between space-y-3">
              <div className="text-center space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-slate-900 text-amber-300">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>สำหรับผู้เข้าร่วม • ไม่ต้องล็อกอิน</span>
                </span>
                <h4 className="font-bold text-slate-900 text-sm">
                  จุดค้นหาผังที่นั่งตนเอง
                </h4>
                <p className="text-[11px] text-slate-600 leading-snug">
                  พิมพ์ติดหน้าห้องประชุม ให้ผู้เข้าร่วมสแกนหาที่นั่งและดูผังห้อง
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-1">
                {mobileSeatingQrDataUrl ? (
                  <img
                    src={mobileSeatingQrDataUrl}
                    alt="Mobile Seating Lookup QR"
                    className="w-40 h-40 rounded-2xl border-2 border-slate-200 bg-white p-2 shadow-xs object-contain"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                    กำลังสร้าง QR...
                  </div>
                )}
                <span className="text-[10px] font-bold text-slate-700 mt-1">
                  สแกนเพื่อค้นหาที่นั่งตนเอง
                </span>
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => onCopyMobileUrl(mobilePublicSeatingUrl, 'PUBLIC')}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  {copiedMobileUrl === 'PUBLIC' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>คัดลอกลิงก์ผังที่นั่งแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกลิงก์ค้นหาที่นั่ง</span>
                    </>
                  )}
                </button>

                <a
                  href={mobilePublicSeatingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer border border-slate-300"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                  <span>เปิดทดสอบหน้าค้นหาที่นั่ง</span>
                </a>
              </div>
            </div>
          </div>

          {onOpenEventQr && (
            <div className="pt-2 border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEventQr(event);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold text-xs transition border border-indigo-200 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>เปิดดู QR Code & ลิงก์ด่วนทั้งหมดของโครงการ (เช็คชื่อ 4 รอบ / สอบอารมณ์ / ผังที่นั่ง)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
