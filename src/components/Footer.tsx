'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Lock,
  ExternalLink,
  GraduationCap,
  Calendar,
  Building2,
  Users,
} from 'lucide-react';
import { SystemSettings } from '@/types';

export default function Footer() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  const [settings, setSettings] = useState<Partial<SystemSettings>>({
    universityNameTh: 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
    facultyNameTh: 'คณะพุทธศาสตร์',
    logoEmoji: '☸️',
    contactPhone: '035-247-8000 ต่อ 8323',
    contactEmail: 'buddhism@mcu.ac.th',
    websiteUrl: 'https://fb.mcu.ac.th/',
    addressTh: 'อาคารสมเด็จพระพุฒาจารย์ (เกี่ยว อุปเสณมหาเถร) อาคารเรียนรวม ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา 13170',
    officeHours: 'จันทร์ - ศุกร์ 08.30 - 16.30 น. (เว้นวันหยุดราชการ)',
    showVisitorCounter: true,
  });
  const [visitorStats, setVisitorStats] = useState<{
    totalVisits: number;
    todayVisits: number;
    uniqueVisitors: number;
    onlineCount?: number;
    onlineUsers?: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    let pingTimer: ReturnType<typeof setInterval> | null = null;

    const loadSettings = () => {
      fetch('/api/system-settings')
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && data.success && data.data) {
            setSettings((prev) => ({ ...prev, ...data.data }));
          }
        })
        .catch(() => {});
    };

    loadSettings();
    window.addEventListener('mcu_settings_updated', loadSettings);

    // Track real visitor (deduplicated 1 count per browser per Bangkok day)
    if (typeof window !== 'undefined') {
      let visitorId = localStorage.getItem('mcu_visitor_uid');
      if (!visitorId) {
        visitorId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem('mcu_visitor_uid', visitorId);
      }

      const todayBkk = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      const lastCountedDate = localStorage.getItem('mcu_visitor_last_date');

      const applyStats = (res: {
        success?: boolean;
        totalVisits?: number;
        todayVisits?: number;
        uniqueVisitors?: number;
        onlineCount?: number;
        onlineUsers?: number;
      }) => {
        if (!isMounted || !res?.success) return;
        setVisitorStats({
          totalVisits: Number(res.totalVisits ?? 0),
          todayVisits: Number(res.todayVisits ?? 0),
          uniqueVisitors: Number(res.uniqueVisitors ?? 0),
          onlineCount: Number(res.onlineCount ?? res.onlineUsers ?? 1),
          onlineUsers: Number(res.onlineUsers ?? res.onlineCount ?? 1),
        });
      };

      if (lastCountedDate !== todayBkk) {
        fetch('/api/visitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId, path: pathname || '/' }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res?.success) {
              localStorage.setItem('mcu_visitor_last_date', todayBkk);
              applyStats(res);
            }
          })
          .catch(() => {});
      } else {
        fetch(`/api/visitors?visitorId=${encodeURIComponent(visitorId)}`)
          .then((r) => r.json())
          .then(applyStats)
          .catch(() => {});
      }

      // Heartbeat ping every 60 seconds to keep online user count accurate and live
      pingTimer = setInterval(() => {
        if (!isMounted || !visitorId) return;
        fetch(`/api/visitors?visitorId=${encodeURIComponent(visitorId)}`)
          .then((r) => r.json())
          .then(applyStats)
          .catch(() => {});
      }, 60_000);
    }

    return () => {
      isMounted = false;
      if (pingTimer) clearInterval(pingTimer);
      window.removeEventListener('mcu_settings_updated', loadSettings);
    };
  }, [pathname]);

  return (
    <div className="w-full mt-auto border-t border-slate-200/90 bg-white print:hidden">
      {/* Top Gradient Line Accent (Royal Purple to Amber Gold) */}
      <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-purple-700 via-indigo-600 to-amber-500"></div>

      {/* Mini Footer for Mobile on Non-Home Pages (เช่น /attendance, /certificates) */}
      {!isHome && (
        <div className="block sm:hidden py-3 px-4 text-center bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/70">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800">
            <span>{settings.logoEmoji || '☸️'}</span>
            <span>{settings.facultyNameTh || 'คณะพุทธศาสตร์'}</span>
            <span className="text-purple-700 font-semibold">• มจร</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-mono font-bold border border-purple-200/70">
              v2.69
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-2 font-medium">
            <Link href="/" className="hover:text-purple-700 transition">
              หน้าแรก
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/verify" className="hover:text-purple-700 transition">
              ตรวจเอกสาร
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">© 2026 MCU</span>
          </div>
        </div>
      )}

      {/* Standard Full Footer: Always on Desktop; On Mobile only shown on Home page */}
      <footer
        className={`${
          isHome
            ? 'pt-8 sm:pt-10 pb-8 px-4 sm:px-6 lg:px-8'
            : 'hidden sm:block pt-8 sm:pt-10 pb-8 px-4 sm:px-6 lg:px-8'
        } bg-gradient-to-b from-white via-slate-50/60 to-slate-100/80 text-slate-600`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Main 4-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-200/80 text-xs">
            {/* Col 1: Identity & About */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="w-10 h-10 object-contain rounded-xl bg-purple-50 p-1 border border-purple-200/60 shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200/80 flex items-center justify-center text-xl shadow-xs shrink-0">
                    {settings.logoEmoji || '☸️'}
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    {settings.facultyNameTh || 'คณะพุทธศาสตร์'}
                  </h3>
                  <p className="text-[11px] text-purple-700 font-semibold leading-tight mt-0.5">
                    {settings.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}
                  </p>
                </div>
              </div>

              <p className="text-slate-500 leading-relaxed text-[11.5px]">
                งานบริการการศึกษาและทะเบียน ส่งเสริมความเป็นเลิศทางวิชาการพระพุทธศาสนาสู่สากล พัฒนานิสิตด้วยเทคโนโลยีที่ทันสมัย โปร่งใส และมั่นคงปลอดภัย
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  ระบบเปิดให้บริการปกติ
                </span>
                <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                  v2.69
                </span>
              </div>
            </div>

            {/* Col 2: Services for Students */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                บริการสำหรับนิสิต (Students)
              </h4>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <Link href="/certificates" className="hover:text-purple-700 hover:translate-x-0.5 transition flex items-center gap-2">
                    <span>📄</span>
                    <span>ยื่นคำร้องขอหนังสือรับรองทุกประเภท</span>
                  </Link>
                </li>
                <li>
                  <Link href="/certificates" className="hover:text-purple-700 hover:translate-x-0.5 transition flex items-center gap-2">
                    <span>⏱️</span>
                    <span>ตรวจสอบสถานะคำร้องแบบ Real-time</span>
                  </Link>
                </li>
                <li>
                  <Link href="/certificates" className="hover:text-purple-700 hover:translate-x-0.5 transition flex items-center gap-2">
                    <span>🌐</span>
                    <span>หนังสือรับรองเพื่อต่ออายุ Visa (Non-ED)</span>
                  </Link>
                </li>
                <li>
                  <Link href="/certificates" className="hover:text-purple-700 hover:translate-x-0.5 transition flex items-center gap-2">
                    <span>🏦</span>
                    <span>หนังสือขอเปิดบัญชี & Mobile Banking</span>
                  </Link>
                </li>
                <li>
                  <Link href="/certificates" className="hover:text-purple-700 hover:translate-x-0.5 transition flex items-center gap-2">
                    <span>🎓</span>
                    <span>หนังสือรับรองผู้ผ่านการคัดเลือกเข้าศึกษา</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Services for Faculty & Staff */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                สำหรับอาจารย์และเจ้าหน้าที่ (Faculty)
              </h4>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <Link href="/certificates" className="hover:text-indigo-700 hover:translate-x-0.5 transition flex items-center gap-2">
                    <span>👔</span>
                    <span>หนังสือรับรองการปฏิบัติงาน/ภาระงานสอน</span>
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-indigo-700 hover:translate-x-0.5 transition flex items-center gap-2">
                    <span>📋</span>
                    <span>บัตรแจ้งภาระงานสอนและรหัสผ่านเข้าใช้</span>
                  </Link>
                </li>
                <li>
                  <Link href="/attendance" className="hover:text-indigo-700 hover:translate-x-0.5 transition flex items-center gap-2">
                    <span>✅</span>
                    <span>ระบบบันทึกเวลาเรียน (Smart Attendance)</span>
                  </Link>
                </li>
                <li>
                  <Link href="/verify" className="hover:text-indigo-700 hover:translate-x-0.5 transition flex items-center gap-2">
                    <span>🛡️</span>
                    <span>ระบบตรวจสอบเอกสารราชการ ตม. (/verify)</span>
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-indigo-700 hover:translate-x-0.5 transition flex items-center gap-2">
                    <span>⚙️</span>
                    <span>เข้าสู่ระบบผู้ดูแลระบบ (Admin Control Center)</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Faculty Contact */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                ข้อมูลการติดต่อ (Contact Info)
              </h4>
              <div className="space-y-2.5 text-slate-500 text-[11.5px] leading-relaxed">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {settings.addressTh || 'อาคารสมเด็จพระพุฒาจารย์ (เกี่ยว อุปเสณมหาเถร) อาคารเรียนรวม ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา 13170'}
                  </span>
                </p>

                {settings.contactPhone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700">{settings.contactPhone}</span>
                  </p>
                )}

                {settings.contactEmail && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <a href={`mailto:${settings.contactEmail}`} className="text-purple-700 hover:underline font-mono">
                      {settings.contactEmail}
                    </a>
                  </p>
                )}

                {settings.officeHours && (
                  <p className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{settings.officeHours}</span>
                  </p>
                )}

                {settings.websiteUrl && (
                  <p className="flex items-center gap-2 pt-0.5">
                    <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                    <a
                      href={settings.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-700 hover:underline font-mono font-bold inline-flex items-center gap-1"
                    >
                      <span>{settings.websiteUrl}</span>
                      <ExternalLink className="w-3 h-3 text-purple-400" />
                    </a>
                  </p>
                )}

                {settings.showSocialLinks !== false && (settings.showFacebook !== false || settings.showLineOa || settings.showYoutube || settings.showTiktok) && (
                  <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      ช่องทางโซเชียลมีเดีย (Social Media):
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {settings.showFacebook !== false && settings.facebookUrl && (
                        <a
                          href={settings.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs transition hover:scale-105"
                          title={settings.facebookTitle || 'Facebook คณะพุทธศาสตร์'}
                        >
                          <span className="w-3.5 h-3.5 rounded-full bg-white text-blue-600 flex items-center justify-center font-black text-[9px] leading-none">f</span>
                          <span>Facebook คณะ</span>
                        </a>
                      )}
                      {settings.showLineOa && settings.lineOaUrl && (
                        <a
                          href={settings.lineOaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] shadow-xs transition hover:scale-105"
                          title="LINE Official Account"
                        >
                          <span className="font-bold text-[10px]">LINE</span>
                          <span>LINE OA</span>
                        </a>
                      )}
                      {settings.showYoutube && settings.youtubeUrl && (
                        <a
                          href={settings.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs transition hover:scale-105"
                          title="YouTube Channel"
                        >
                          <span className="text-[10px]">▶</span>
                          <span>YouTube</span>
                        </a>
                      )}
                      {settings.showTiktok && settings.tiktokUrl && (
                        <a
                          href={settings.tiktokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-[11px] shadow-xs transition hover:scale-105"
                          title="TikTok"
                        >
                          <span className="text-[10px]">♪</span>
                          <span>TikTok</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {settings.showVisitorCounter !== false && (
                  <div className="pt-2">
                    <div className="inline-flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-[#161f30] border border-slate-700/80 shadow-md">
                      <Users className="w-6 h-6 text-amber-400 shrink-0 self-center" />
                      <div className="min-w-[170px]">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] font-semibold text-slate-300 leading-tight">
                            ผู้เข้าชมเว็บไซต์
                          </span>
                          {visitorStats && (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold tracking-wide"
                              title="จำนวนผู้ใช้งานที่กำลังออนไลน์ขณะนี้"
                            >
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <span>ออนไลน์ {visitorStats.onlineCount ?? 1}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight leading-none mt-1">
                          {visitorStats ? visitorStats.totalVisits.toLocaleString() : '...'}
                        </div>
                        {visitorStats && (
                          <div className="text-[10px] text-slate-400 mt-1 leading-none">
                            วันนี้ {visitorStats.todayVisits.toLocaleString()} • อุปกรณ์ไม่ซ้ำ {visitorStats.uniqueVisitors.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright, Dev Credit & PDPA Links */}
          <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] text-slate-500">
            <div className="space-y-1">
              <p>© 2026 {settings.facultyNameTh || 'คณะพุทธศาสตร์'} {settings.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}. สงวนลิขสิทธิ์ทั้งหมด.</p>
              <div className="text-slate-400 flex flex-wrap items-center gap-1.5">
                <span>Faculty of Buddhism Academic Services System — Powered by Google Sheets & Cloud Infrastructure</span>
                {settings.devCreditEnabled !== false && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-purple-700 bg-purple-50/80 px-2 py-0.5 rounded-md border border-purple-200/80 text-[10.5px]">
                      {settings.devCreditText || 'Dev. by สำนักงานคณบดีคณะพุทธศาสตร์'}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 font-medium text-slate-600">
              <span className="hover:text-purple-700 cursor-pointer transition">มาตรการคุ้มครองข้อมูล (PDPA)</span>
              <span className="text-slate-300">•</span>
              <Link href="/verify" className="hover:text-purple-700 transition">ตรวจสอบเอกสาร (/verify)</Link>
              <span className="text-slate-300">•</span>
              <span className="hover:text-purple-700 cursor-pointer transition">เงื่อนไขการให้บริการ</span>
              <span className="text-slate-300">•</span>
              <Link href="/login" className="hover:text-purple-700 transition flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>สำหรับเจ้าหน้าที่</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
