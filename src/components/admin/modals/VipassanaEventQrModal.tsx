'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Copy,
  CheckCircle2,
  Printer,
  Camera,
  Award,
  ExternalLink,
  Smartphone,
  Sparkles,
  Calendar,
  MapPin,
} from 'lucide-react';
import type { StudentEvent } from '@/types';

interface VipassanaEventQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudentEvent | null;
}

export const VipassanaEventQrModal: React.FC<VipassanaEventQrModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [smartQrDataUrl, setSmartQrDataUrl] = useState<string>('');
  const [scanQrDataUrl, setScanQrDataUrl] = useState<string>('');
  const [interviewQrDataUrl, setInterviewQrDataUrl] = useState<string>('');
  const [seatingQrDataUrl, setSeatingQrDataUrl] = useState<string>('');
  const [copiedMode, setCopiedMode] = useState<string | null>(null);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://ne-ser-fb.vercel.app';

  const smartUrl = event
    ? `${origin}/admin?tab=EVENTS&eventId=${encodeURIComponent(event.id)}&action=AUTO`
    : '';
  const scanUrl = event
    ? `${origin}/admin?tab=EVENTS&eventId=${encodeURIComponent(event.id)}&action=SCAN`
    : '';
  const interviewUrl = event
    ? `${origin}/admin?tab=EVENTS&eventId=${encodeURIComponent(event.id)}&action=INTERVIEW`
    : '';
  const seatingUrl = event
    ? `${origin}/events/seating?eventId=${encodeURIComponent(event.id)}`
    : '';

  useEffect(() => {
    if (!isOpen || !event) return;
    let active = true;

    Promise.all([
      QRCode.toDataURL(smartUrl, {
        width: 480,
        margin: 1,
        color: { dark: '#1e1b4b', light: '#ffffff' },
      }),
      QRCode.toDataURL(scanUrl, {
        width: 420,
        margin: 1,
        color: { dark: '#064e3b', light: '#ffffff' },
      }),
      QRCode.toDataURL(interviewUrl, {
        width: 420,
        margin: 1,
        color: { dark: '#78350f', light: '#ffffff' },
      }),
      QRCode.toDataURL(seatingUrl, {
        width: 420,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      }),
    ])
      .then(([smart, scan, interview, seating]) => {
        if (!active) return;
        setSmartQrDataUrl(smart);
        setScanQrDataUrl(scan);
        setInterviewQrDataUrl(interview);
        setSeatingQrDataUrl(seating);
      })
      .catch((err) => console.error('QR generation failed:', err));

    return () => {
      active = false;
    };
  }, [isOpen, event, smartUrl, scanUrl, interviewUrl, seatingUrl]);

  if (!isOpen || !event) return null;

  const handleCopyText = async (text: string, mode: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMode(mode);
      setTimeout(() => setCopiedMode(null), 2500);
    } catch {
      alert('ไม่สามารถคัดลอกได้ กรุณาคัดลอกจากลิงก์โดยตรง');
    }
  };

  const handleCopyLineSummary = () => {
    const dateRange =
      event.startDate && event.endDate && event.startDate !== event.endDate
        ? `${new Date(event.startDate).toLocaleDateString('th-TH')} - ${new Date(event.endDate).toLocaleDateString('th-TH')}`
        : event.startDate
        ? new Date(event.startDate).toLocaleDateString('th-TH')
        : 'ตามกำหนดการโครงการ';

    const message = [
      `☸️ แจ้งลิงก์เข้าระบบปฏิบัติงานบนมือถือ (ประจำโครงการ)`,
      `📌 โครงการ: ${event.title}`,
      `📅 วันที่: ${dateRange}`,
      `📍 สถานที่: ${event.location || 'อาคารโพธิญาณมหาวิชชาลัย จ.นครปฐม'}`,
      ``,
      `🔗 1) ลิงก์รวมอัจฉริยะ (พาเข้าหน้าตามบทบาทอัตโนมัติ):`,
      `${smartUrl}`,
      ``,
      `📷 2) สำหรับอาจารย์/เจ้าหน้าที่ผู้ดูแล (เปิดหน้าสแกนเช็คชื่อ 4 รอบ & เลือกกลุ่ม):`,
      `${scanUrl}`,
      ``,
      `🧘 3) สำหรับพระวิปัสสนาจารย์ (เปิดหน้าสอบอารมณ์สติปัฏฐาน 4 & สแกนป้ายชื่อด่วน):`,
      `${interviewUrl}`,
      ``,
      `🪑 4) สำหรับผู้เข้าร่วม (สแกนค้นหาที่นั่ง & ดูผังห้องจริงด้วยตนเอง ไม่ต้องล็อกอิน):`,
      `${seatingUrl}`,
      ``,
      `💡 วิธีใช้งานบนมือถือ: กดลิงก์หรือสแกน QR Code -> เข้าสู่ระบบ -> เลือกกลุ่มที่ท่านดูแล -> กดเปิดกล้องสแกนป้ายคล้องคอนิสิตได้ทันที`,
    ].join('\n');

    handleCopyText(message, 'LINE_ALL');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in print:p-0 print:bg-white print:static print:block print:overflow-visible">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-h-none print:w-full print:static print:block print:overflow-visible print:h-auto">
        {/* Header (Screen only) */}
        <div className="print:hidden px-4 sm:px-6 py-4 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <QrCode className="w-6 h-6 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                  QR Code & ลิงก์ด่วนเข้าหน้าปฏิบัติงานบนมือถือ (แยกประจำโครงการ)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 shrink-0">
                  Mobile Direct Access
                </span>
              </div>
              <p className="text-xs text-purple-200 truncate">{event.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLineSummary}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="คัดลอกข้อความพร้อมลิงก์ของโครงการนี้สำหรับส่งเข้ากลุ่ม LINE"
            >
              {copiedMode === 'LINE_ALL' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>คัดลอกข้อความ LINE แล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกส่ง LINE</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 transition border border-white/20 cursor-pointer"
              title="พิมพ์ใบ QR Code ประจำโครงการเพื่อติดที่จุดลงทะเบียน/ห้องสอบอารมณ์"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">พิมพ์ใบ QR ประจำโครงการ</span>
              <span className="sm:hidden">พิมพ์</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 print:p-4 print:overflow-visible">
          {/* Print Header */}
          <div className="text-center space-y-1 border-b border-slate-200 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold mb-1">
              <Smartphone className="w-3.5 h-3.5 text-amber-600" />
              <span>จุดสแกนเข้าระบบปฏิบัติงานด้วยสมาร์ทโฟน (พระวิปัสสนาจารย์ และ อาจารย์/เจ้าหน้าที่ผู้ดูแล)</span>
            </div>
            <h2 className="text-base sm:text-xl font-black text-slate-900">{event.title}</h2>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                {event.startDate ? new Date(event.startDate).toLocaleDateString('th-TH') : '-'}
                {event.endDate &&
                  event.endDate !== event.startDate &&
                  ` - ${new Date(event.endDate).toLocaleDateString('th-TH')}`}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                {event.location || 'อาคารปฏิบัติธรรมโพธิญาณมหาวิชชาลัย จ.นครปฐม'}
              </span>
            </div>
          </div>

          {/* 4 QR Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Smart Auto-Role QR (Recommended Single QR for the project) */}
            <div className="rounded-2xl border-2 border-indigo-400 bg-gradient-to-b from-indigo-50/70 via-white to-indigo-50/30 p-4 flex flex-col justify-between space-y-3 shadow-sm">
              <div className="space-y-1.5 text-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-indigo-600 text-white">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>แนะนำ • QR เดียวใช้ได้ทุกบทบาท</span>
                </span>
                <h4 className="font-extrabold text-indigo-950 text-sm">
                  QR เข้าระบบอัตโนมัติตามสิทธิ์
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  สแกนแล้วระบบตรวจสอบสิทธิ์ให้อัตโนมัติ: <strong>พระวิปัสสนาจารย์</strong> เข้าหน้าสอบอารมณ์ /{' '}
                  <strong>อาจารย์และเจ้าหน้าที่</strong> เข้าหน้าสแกนเช็คชื่อ
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-2">
                {smartQrDataUrl ? (
                  <img
                    src={smartQrDataUrl}
                    alt="Smart Event QR"
                    className="w-44 h-44 rounded-2xl border-2 border-indigo-200 bg-white p-2 shadow-xs object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                    กำลังสร้าง QR...
                  </div>
                )}
                <span className="text-[10px] font-bold text-indigo-800 mt-1.5">
                  สแกนด้วยกล้องมือถือหรือแอป LINE
                </span>
              </div>

              <div className="space-y-1.5 print:hidden">
                <button
                  type="button"
                  onClick={() => handleCopyText(smartUrl, 'SMART')}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  {copiedMode === 'SMART' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>คัดลอกลิงก์แล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกลิงก์รวมโครงการนี้</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Card 2: Advisor / Officer Live Scanner QR */}
            <div className="rounded-2xl border border-emerald-300 bg-gradient-to-b from-emerald-50/70 via-white to-emerald-50/30 p-4 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="space-y-1.5 text-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-600 text-white">
                  <Camera className="w-3 h-3" />
                  <span>สำหรับอาจารย์ & เจ้าหน้าที่ผู้ดูแล</span>
                </span>
                <h4 className="font-extrabold text-emerald-950 text-sm">
                  หน้าสแกนตรวจเช็คชื่อ 4 รอบ
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  เปิดตรงไปหน้า <strong>จุดสแกนเช็คชื่อสด</strong> สามารถเลือกกลุ่มที่ท่านดูแล แล้วเปิดกล้องมือถือสแกนป้ายคล้องคอนิสิตหรือติ๊กเช็คชื่อรายกลุ่มทันที
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-2">
                {scanQrDataUrl ? (
                  <img
                    src={scanQrDataUrl}
                    alt="Live Scanner QR"
                    className="w-44 h-44 rounded-2xl border-2 border-emerald-200 bg-white p-2 shadow-xs object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                    กำลังสร้าง QR...
                  </div>
                )}
                <span className="text-[10px] font-bold text-emerald-800 mt-1.5">
                  เข้าหน้าสแกนเช็คชื่อ 4 รอบทันที
                </span>
              </div>

              <div className="space-y-1.5 print:hidden">
                <button
                  type="button"
                  onClick={() => handleCopyText(scanUrl, 'SCAN')}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  {copiedMode === 'SCAN' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-200" />
                      <span>คัดลอกลิงก์สแกนเช็คชื่อแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกลิงก์สแกนเช็คชื่อ</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Card 3: Vipassana Master Interview QR */}
            <div className="rounded-2xl border border-amber-300 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 p-4 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="space-y-1.5 text-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-600 text-white">
                  <Award className="w-3 h-3" />
                  <span>สำหรับพระวิปัสสนาจารย์</span>
                </span>
                <h4 className="font-extrabold text-amber-950 text-sm">
                  หน้าสอบอารมณ์สติปัฏฐาน 4
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  เปิดตรงไปหน้า <strong>สอบอารมณ์สติปัฏฐาน 4</strong> สามารถเลือกกลุ่มที่ดูแล หรือกดปุ่ม{' '}
                  <strong>&quot;สแกน QR&quot;</strong> ส่องป้ายชื่อนิสิตเพื่อบันทึกผลสอบอารมณ์ทันที
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-2">
                {interviewQrDataUrl ? (
                  <img
                    src={interviewQrDataUrl}
                    alt="Vipassana Interview QR"
                    className="w-44 h-44 rounded-2xl border-2 border-amber-200 bg-white p-2 shadow-xs object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                    กำลังสร้าง QR...
                  </div>
                )}
                <span className="text-[10px] font-bold text-amber-800 mt-1.5">
                  เข้าหน้าสอบอารมณ์สติปัฏฐาน 4 ทันที
                </span>
              </div>

              <div className="space-y-1.5 print:hidden">
                <button
                  type="button"
                  onClick={() => handleCopyText(interviewUrl, 'INTERVIEW')}
                  className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  {copiedMode === 'INTERVIEW' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                      <span>คัดลอกลิงก์สอบอารมณ์แล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกลิงก์สอบอารมณ์</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Card 4: Public Self-Service Seat Finder */}
            <div className="rounded-2xl border-2 border-slate-400 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/30 p-4 flex flex-col justify-between space-y-3 shadow-sm">
              <div className="space-y-1.5 text-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-slate-900 text-amber-300">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>สำหรับผู้เข้าร่วม • ไม่ต้องล็อกอิน</span>
                </span>
                <h4 className="font-extrabold text-slate-950 text-sm">
                  จุดค้นหาผังที่นั่งตนเอง
                </h4>
                <p className="text-[11px] text-slate-600 leading-snug">
                  ติดป้ายหน้าหอประชุม ให้ผู้เข้าร่วมสแกนเพื่อหาที่นั่งและดูผังห้องจริง
                </p>
              </div>

              {/* QR Image Box */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center justify-center">
                {seatingQrDataUrl ? (
                  <img
                    src={seatingQrDataUrl}
                    alt="Seating Lookup QR"
                    className="w-36 h-36 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400 animate-pulse">
                    กำลังสร้าง QR...
                  </div>
                )}
                <span className="text-[10px] text-slate-500 font-medium mt-1">
                  สแกนเพื่อค้นหาที่นั่งตนเอง
                </span>
              </div>

              <div className="space-y-1.5 print:hidden">
                <button
                  type="button"
                  onClick={() => handleCopyText(seatingUrl, 'SEATING')}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  {copiedMode === 'SEATING' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>คัดลอกลิงก์ผังที่นั่งแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกลิงก์ผังที่นั่ง</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Usage Step-by-Step Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 space-y-1.5">
            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>ขั้นตอนการใช้งานเมื่อเปิดด้วยสมาร์ทโฟน:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11.5px] text-slate-600">
              <li>
                <strong>สแกน QR Code</strong> หรือกดลิงก์ด้านบนจากแอป LINE บนมือถือ (หากยังไม่ได้ล็อกอิน ระบบจะให้ล็อกอินและพากลับมาที่โครงการนี้อัตโนมัติ)
              </li>
              <li>
                เมื่อหน้าต่างเด้งขึ้นมา ให้เลือก <strong>&quot;กลุ่ม&quot;</strong> ที่ท่านรับผิดชอบดูแล (หรือระบบจะเลือกกลุ่มที่ผูกกับชื่อของท่านให้อัตโนมัติ)
              </li>
              <li>
                กดปุ่ม <strong>&quot;📷 เปิดกล้องสแกน&quot;</strong> เพื่อสแกน QR Code บนป้ายคล้องคอของนิสิตสำหรับการเช็คชื่อเข้าร่วม หรือการสอบอารมณ์สติปัฏฐาน 4 ได้ทันที
              </li>
            </ol>
          </div>
        </div>

        {/* Footer (Screen only) */}
        <div className="print:hidden px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 text-xs shrink-0">
          <a
            href={smartUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-bold underline"
          >
            <span>ทดสอบเปิดลิงก์ด่วนของโครงการนี้</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300/80 text-slate-800 font-bold transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
