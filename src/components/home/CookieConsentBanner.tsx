'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, X, Cookie } from 'lucide-react';

const CONSENT_STORAGE_KEY = 'mcu_fb_cookie_consent';

type ConsentStatus = 'accepted' | 'rejected' | null;

export const CookieConsentBanner: React.FC = () => {
  const [status, setStatus] = useState<ConsentStatus>('accepted');
  const [mounted, setMounted] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      if (saved === 'accepted' || saved === 'rejected') {
        setStatus(saved);
      } else {
        setStatus(null);
      }
    } catch {
      setStatus(null);
    }
  }, []);

  const handleDecision = (choice: 'accepted' | 'rejected') => {
    setStatus(choice);
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
      const maxAge = 60 * 60 * 24 * 180; // 180 days
      document.cookie = `mcu_pdpa_consent=${choice}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } catch {
      // Ignore storage failures in restricted browsing modes
    }
  };

  if (!mounted) return null;

  return (
    <>
      {status === null && (
        <div
          role="region"
          aria-label="ประกาศนโยบายคุกกี้และการคุ้มครองข้อมูลส่วนบุคคล"
          className="fixed bottom-0 inset-x-0 z-50 bg-slate-950/95 text-slate-100 border-t border-slate-800 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-5">
            <div className="flex items-start gap-2.5 text-xs sm:text-[13px] leading-relaxed text-slate-200">
              <Cookie className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 hidden sm:block" />
              <p>
                เว็บไซต์ คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (fb.mcu.ac.th) มีการใช้งานเทคโนโลยีคุกกี้
                หรือ เทคโนโลยีอื่นที่มีลักษณะใกล้เคียงกันกับคุกกี้ บนเว็บไซต์ของเรา โปรดศึกษา นโยบายการใช้คุกกี้ และ
                นโยบายความเป็นส่วนตัวของข้อมูล ก่อนใช้บริการเว็บไซต์{' '}
                <button
                  type="button"
                  onClick={() => setIsPolicyOpen(true)}
                  className="text-sky-300 hover:text-sky-200 underline underline-offset-2 font-semibold cursor-pointer"
                >
                  [ประกาศนโยบายคุ้มครองส่วนบุคคล]
                </button>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleDecision('accepted')}
                className="px-5 py-2 rounded-full bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                ยอมรับ
              </button>
              <button
                type="button"
                onClick={() => handleDecision('rejected')}
                className="px-5 py-2 rounded-full bg-blue-900/90 hover:bg-blue-800 text-blue-100 border border-blue-500/40 text-xs font-bold shadow-md transition cursor-pointer"
              >
                ไม่ยอมรับ
              </button>
            </div>
          </div>
        </div>
      )}

      {isPolicyOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPolicyOpen(false);
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="px-6 pt-5 pb-3 border-b flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    ประกาศนโยบายคุ้มครองข้อมูลส่วนบุคคลและการใช้คุกกี้ (PDPA)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPolicyOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                ระบบบริการนิสิตและวิชาการออนไลน์ คณะพุทธศาสตร์ ใช้คุกกี้และข้อมูลจำเป็นเพื่อการยืนยันตัวตน (Session Token)
                การรักษาความปลอดภัยของระบบ และการจดจำการตั้งค่าการใช้งานเบื้องต้นเท่านั้น
              </p>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900">1. คุกกี้ที่มีความจำเป็น (Strictly Necessary Cookies)</div>
                <p className="text-slate-600">
                  ใช้สำหรับการเข้าสู่ระบบ ความปลอดภัยของบัญชีผู้ใช้งาน (ป้องกันการแอบอ้างสิทธิ์) และการให้บริการคำร้องหนังสือรับรอง/เช็คชื่ออย่างต่อเนื่อง
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900">2. การเก็บรักษาและการคุ้มครองข้อมูลส่วนบุคคล</div>
                <p className="text-slate-600">
                  ข้อมูลนิสิตและอาจารย์จะถูกใช้งานเฉพาะเพื่อภารกิจด้านการศึกษา การจัดทำเอกสารราชการ และกิจกรรมของคณะพุทธศาสตร์ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 เท่านั้น
                </p>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t bg-slate-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleDecision('rejected');
                  setIsPolicyOpen(false);
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer transition"
              >
                ไม่ยอมรับ
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDecision('accepted');
                  setIsPolicyOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold cursor-pointer transition"
              >
                ยอมรับและปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
