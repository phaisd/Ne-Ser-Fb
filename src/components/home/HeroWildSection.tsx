'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Edit3,
  X,
  Check,
  UploadCloud,
  RefreshCw,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { SystemSettings } from '@/types';
import { getAuthUser, isAdminOrOfficer } from '@/lib/auth-client';

interface HeroWildSectionProps {
  settings?: SystemSettings | null;
}

export function HeroWildSection({ settings: initialSettings }: HeroWildSectionProps) {
  const [liveSettings, setLiveSettings] = useState<Partial<SystemSettings>>(initialSettings || {});
  const [isHovered, setIsHovered] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSettings) {
      setLiveSettings(initialSettings);
    }
  }, [initialSettings]);

  useEffect(() => {
    setCurrentUser(getAuthUser());
    const syncAuth = () => setCurrentUser(getAuthUser());
    const syncSettings = () => {
      fetch('/api/system-settings')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data) {
            setLiveSettings(d.data);
          }
        })
        .catch(() => {});
    };
    window.addEventListener('mcu_user_logged_in', syncAuth);
    window.addEventListener('mcu_user_logged_out', syncAuth);
    window.addEventListener('mcu_settings_updated', syncSettings);
    return () => {
      window.removeEventListener('mcu_user_logged_in', syncAuth);
      window.removeEventListener('mcu_user_logged_out', syncAuth);
      window.removeEventListener('mcu_settings_updated', syncSettings);
    };
  }, []);

  const isAdmin = isAdminOrOfficer(currentUser);
  const s: Partial<SystemSettings> = liveSettings || {};

  // Dynamic values with sensible defaults
  const leftWord = s.heroLeftWord ?? 'BUD';
  const rightWord = s.heroRightWord ?? 'DHISM';
  const capsuleImage = s.heroCapsuleImage || '/uploads/file-1793867472059.jpg';
  const capsuleAlt = s.heroCapsuleAlt || 'Faculty of Buddhism - MCU';
  const badgeText = s.heroBadgeText ?? 'Creative Designer & Faculty of Buddhism • MCU';
  const headingTh = s.heroHeadingTh ?? 'ระบบบริการนิสิตและวิชาการออนไลน์ คณะพุทธศาสตร์';
  const subHeadingEn =
    s.heroSubHeadingEn ?? 'Mahachulalongkornrajavidyalaya University • Academic Year 2569–2570';
  const description = s.heroDescription ?? '';
  const bgStyle = s.heroBgStyle || 'wavy-contours';
  const showTopNav = s.heroShowTopNav !== false;
  const showBadge = s.heroShowBadge !== false;
  const showActionButtons = s.heroShowActionButtons === true;
  const primaryBtnText = s.heroPrimaryBtnText || 'ยื่นคำร้องขอหนังสือรับรอง';
  const primaryBtnUrl = s.heroPrimaryBtnUrl || '/certificates';
  const secondaryBtnText = s.heroSecondaryBtnText || 'ตารางเรียนและรายวิชา';
  const secondaryBtnUrl = s.heroSecondaryBtnUrl || '/courses';

  const isDarkHero = bgStyle === 'navy';

  const bgContainerClass =
    bgStyle === 'minimal'
      ? 'bg-white border-slate-200/90'
      : bgStyle === 'gold-glow'
      ? 'bg-gradient-to-br from-amber-50 via-orange-50/70 to-amber-100/50 border-amber-200/90'
      : bgStyle === 'navy'
      ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-slate-800 text-white'
      : 'bg-[#f5f5f3] border-slate-200/90';

  const handleUploadCapsuleFile = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('scope', 'branding');
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setLiveSettings((prev) => ({ ...(prev || {}), heroCapsuleImage: data.url }));
      } else {
        alert(data.error || 'อัปโหลดรูปภาพไม่สำเร็จ');
      }
    } catch (e: unknown) {
      alert((e instanceof Error ? e.message : String(e)) || 'เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveHeroSettings = async () => {
    if (!liveSettings) return;
    setSaving(true);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(liveSettings),
      });
      const data = await res.json();
      if (data.success) {
        setLiveSettings(data.data);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('mcu_settings_updated'));
        }
        setSaveSuccessMsg('บันทึกการปรับแต่งส่วน Hero เรียบร้อยแล้ว!');
        setTimeout(() => setSaveSuccessMsg(null), 3500);
      } else {
        alert(data.error || 'บันทึกไม่สำเร็จ');
      }
    } catch (e: unknown) {
      alert((e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[28px] border shadow-xl transition-all duration-700 ${bgContainerClass}`}
    >
      {/* 1. Contour Lines Background (SVG Curves) */}
      {(bgStyle === 'wavy-contours' || bgStyle === 'gold-glow' || bgStyle === 'navy') && (
        <div
          className={`absolute inset-0 pointer-events-none overflow-hidden ${
            isDarkHero ? 'opacity-20' : 'opacity-40'
          }`}
        >
          <svg
            className="w-full h-full object-cover"
            viewBox="0 0 1440 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M-50,110 C300,30 650,200 1500,60"
              stroke={isDarkHero ? '#fbbf24' : '#94a3b8'}
              strokeWidth="1.2"
              strokeDasharray="4 6"
              className="animate-pulse"
            />
            <path
              d="M-80,190 C250,130 720,290 1520,140"
              stroke={isDarkHero ? '#64748b' : '#cbd5e1'}
              strokeWidth="1.5"
            />
            <path
              d="M-40,280 C320,210 800,380 1500,220"
              stroke={isDarkHero ? '#94a3b8' : '#94a3b8'}
              strokeWidth="1.2"
            />
            <path
              d="M-60,370 C360,300 850,460 1520,310"
              stroke={isDarkHero ? '#64748b' : '#cbd5e1'}
              strokeWidth="1.5"
              strokeDasharray="8 6"
            />
            <path
              d="M-100,460 C400,380 900,530 1550,410"
              stroke={isDarkHero ? '#fbbf24' : '#94a3b8'}
              strokeWidth="1.2"
            />
          </svg>
        </div>
      )}

      {/* Decorative Warm Ambient Glow */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] rounded-full blur-3xl pointer-events-none ${
          isDarkHero
            ? 'bg-gradient-to-r from-amber-500/15 via-indigo-500/20 to-amber-400/15'
            : 'bg-gradient-to-r from-amber-200/20 via-orange-100/25 to-amber-100/20'
        }`}
      />

      {/* Admin Quick-Edit Floating Trigger */}
      {isAdmin && (
        <div className="absolute bottom-3.5 right-4 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsQuickEditOpen(!isQuickEditOpen)}
            className="px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-black text-white border border-white/20 text-xs font-bold shadow-lg flex items-center gap-1.5 backdrop-blur transition cursor-pointer"
            title="แก้ไขข้อความ รูปภาพ และสไตล์ของแบนเนอร์ Hero นี้ทันที"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>{isQuickEditOpen ? 'ปิดแผงแก้ไข Hero' : 'แก้ไขแบนเนอร์ Hero'}</span>
          </button>
        </div>
      )}

      {/* 2. Top Navigation Bar inside Hero (Optional) */}
      {showTopNav && (
        <div className="relative z-20 flex items-center justify-between px-6 sm:px-9 pt-5 sm:pt-6">
          {/* Left: Back / Home Circle Button */}
          <Link
            href="/"
            className={`group w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
              isDarkHero
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-slate-900 hover:bg-black text-white'
            }`}
            title="หน้าหลักมหาวิทยาลัย"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </Link>

          {/* Center: Interactive Nav Pills */}
          <div
            className={`hidden md:flex items-center gap-5 text-xs font-semibold tracking-wide ${
              isDarkHero ? 'text-slate-200' : 'text-slate-700'
            }`}
          >
            {s.showEnrollmentMenu !== false && (
              <Link
                href="/enroll"
                className={`transition-colors flex items-center gap-1.5 font-bold ${
                  isDarkHero ? 'text-amber-300 hover:text-amber-200' : 'text-orange-700 hover:text-slate-950'
                }`}
              >
                <span>สมัครเรียน/นิสิตใหม่ (Admission)</span>
              </Link>
            )}
            {s.showCertificatesMenu !== false && (
              <Link
                href="/certificates"
                className={`transition-colors flex items-center gap-1.5 ${
                  isDarkHero ? 'hover:text-amber-300' : 'hover:text-slate-950'
                }`}
              >
                <span>ยื่นคำร้อง (Certificates)</span>
              </Link>
            )}
            {s.showCoursesMenu !== false && (
              <Link
                href="/courses"
                className={`transition-colors flex items-center gap-1.5 ${
                  isDarkHero ? 'hover:text-amber-300' : 'hover:text-slate-950'
                }`}
              >
                <span>ตารางเรียน (Timetable)</span>
              </Link>
            )}
            {isAdmin && s.showStudentsSearch !== false && (
              <Link
                href="/students"
                className={`transition-colors flex items-center gap-1.5 font-bold ${
                  isDarkHero ? 'text-amber-300 hover:text-amber-200' : 'text-amber-700 hover:text-slate-950'
                }`}
              >
                <span>ทะเบียนนิสิต (Directory)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                  Admin
                </span>
              </Link>
            )}
            {s.showEventsMenu === true && (
              <Link
                href="/events"
                className={`transition-colors flex items-center gap-1.5 ${
                  isDarkHero ? 'hover:text-amber-300' : 'hover:text-slate-950'
                }`}
              >
                <span>กิจกรรม (Activities)</span>
              </Link>
            )}
          </div>

          {/* Right: Faculty & Social Branding */}
          <div
            className={`flex items-center gap-3 text-xs font-semibold ${
              isDarkHero ? 'text-slate-200' : 'text-slate-700'
            }`}
          >
            <span
              className={`hidden sm:inline-block px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-xs ${
                isDarkHero
                  ? 'bg-white/15 text-amber-300 border border-white/15'
                  : 'bg-slate-200/70 text-slate-800'
              }`}
            >
              {s.facultyNameEn || 'Faculty of Buddhism'}
            </span>
            <a
              href={s.websiteUrl || 'https://fb.mcu.ac.th/'}
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors flex items-center gap-1 text-[11px] ${
                isDarkHero ? 'hover:text-amber-300' : 'hover:text-black'
              }`}
            >
              <span>
                {(s.websiteUrl || 'https://fb.mcu.ac.th/')
                  .replace(/^https?:\/\//, '')
                  .replace(/\/$/, '')}
              </span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {s.showSocialLinks !== false && s.showFacebook !== false && s.facebookUrl && (
              <a
                href={s.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition hover:scale-105"
                title={s.facebookTitle || 'Facebook คณะพุทธศาสตร์'}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-white text-blue-600 flex items-center justify-center font-black text-[9px] leading-none">f</span>
                <span>Facebook คณะ</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* 3. Center Hero Section: Compact, Balanced & Elegant */}
      <div
        className={`relative z-10 px-4 sm:px-6 ${
          showTopNav ? 'py-5 sm:py-6 pb-7 sm:pb-8' : 'py-8 sm:py-10'
        } flex flex-col items-center justify-center text-center`}
      >
        {/* Subtle Badge */}
        {showBadge && badgeText && (
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[11px] font-bold shadow-xs backdrop-blur mb-3 sm:mb-4 animate-in fade-in slide-in-from-top-2 ${
              isDarkHero
                ? 'bg-white/10 border-white/20 text-amber-300'
                : 'bg-white/80 border-slate-300/80 text-slate-800'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{badgeText}</span>
          </div>
        )}

        {/* Main Word with Capsule Island */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-5 select-none w-full max-w-4xl">
          {/* Left Letters (e.g. "BUD") */}
          <span
            className={`text-[52px] xs:text-[68px] sm:text-[90px] md:text-[115px] lg:text-[130px] font-black tracking-tighter leading-none drop-shadow-xs transition-transform duration-500 hover:scale-[1.02] ${
              isDarkHero ? 'text-white' : 'text-slate-900'
            }`}
          >
            {leftWord}
          </span>

          {/* Capsule Island Window (Horizontal Oval) */}
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative group w-[125px] xs:w-[160px] sm:w-[220px] md:w-[280px] lg:w-[330px] h-[62px] xs:h-[80px] sm:h-[110px] md:h-[140px] lg:h-[165px] rounded-[100px] overflow-hidden shadow-xl border-[3px] border-white transition-all duration-700 ease-out transform hover:scale-[1.03] cursor-pointer"
            style={{
              boxShadow: isHovered
                ? '0 20px 40px -10px rgba(249, 115, 22, 0.35), 0 0 25px rgba(251, 191, 36, 0.25)'
                : '0 15px 30px -10px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div className="relative w-full h-full">
              <Image
                src={capsuleImage}
                alt={capsuleAlt}
                fill
                priority
                unoptimized={capsuleImage.startsWith('data:') || capsuleImage.startsWith('http')}
                className={`object-cover transition-transform duration-1000 ease-out ${
                  isHovered ? 'scale-110' : 'scale-100'
                }`}
                sizes="(max-width: 768px) 220px, 330px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/5 pointer-events-none" />
            </div>
          </div>

          {/* Right Letters (e.g. "DHISM") */}
          <span
            className={`text-[52px] xs:text-[68px] sm:text-[90px] md:text-[115px] lg:text-[130px] font-black tracking-tighter leading-none drop-shadow-xs transition-transform duration-500 hover:scale-[1.02] ${
              isDarkHero ? 'text-white' : 'text-slate-900'
            }`}
          >
            {rightWord}
          </span>
        </div>

        {/* Thai Academic Heading Subtitle */}
        {headingTh && (
          <h2
            className={`mt-3 sm:mt-4 text-sm sm:text-lg md:text-xl font-black tracking-tight max-w-2xl ${
              isDarkHero ? 'text-amber-300' : 'text-slate-800'
            }`}
          >
            {headingTh}
          </h2>
        )}

        {/* English Subtitle / Academic Year */}
        {subHeadingEn && (
          <p
            className={`mt-0.5 text-xs font-medium ${
              isDarkHero ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            {subHeadingEn}
          </p>
        )}

        {/* Optional Description */}
        {description && (
          <p
            className={`mt-2 text-xs sm:text-sm max-w-xl leading-relaxed ${
              isDarkHero ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {description}
          </p>
        )}

        {/* Optional Quick Action Buttons */}
        {showActionButtons && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {primaryBtnText && (
              <Link
                href={primaryBtnUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-md transition"
              >
                <span>{primaryBtnText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            {secondaryBtnText && (
              <Link
                href={secondaryBtnUrl}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold border transition ${
                  isDarkHero
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                }`}
              >
                <span>{secondaryBtnText}</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 4. Inline Admin Quick-Edit Drawer (Only when Admin clicks "แก้ไขแบนเนอร์ Hero") */}
      {isAdmin && isQuickEditOpen && (
        <div className="relative z-30 bg-white text-slate-900 border-t-2 border-amber-400 p-5 sm:p-6 space-y-4 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  ปรับแต่งแบนเนอร์ Hero หน้าแรก (Live Hero Customizer)
                </h3>
                <p className="text-[11px] text-slate-500">
                  แก้ไขข้อความ รูปภาพแคปซูล โทนสีพื้นหลัง และปุ่มทางลัดพร้อมเห็นผลทันที (หรือตั้งค่าเพิ่มเติมได้ที่หน้า /admin &rarr; ตั้งค่าระบบ)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveHeroSettings}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer transition"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'กำลังบันทึก...' : '💾 บันทึกการแก้ไข Hero'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsQuickEditOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                title="ปิดหน้าต่างแก้ไข"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Row 1: Quick Word Presets & Left/Right Words */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
            <div className="lg:col-span-5 space-y-2">
              <label className="font-bold text-slate-700 block">
                1. ตัวอักษรใหญ่ ซ้าย - ขวา ของรูปแคปซูล:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold">ฝั่งซ้าย (Left):</span>
                  <input
                    type="text"
                    value={leftWord}
                    onChange={(e) =>
                      setLiveSettings((prev) => ({ ...(prev || {}), heroLeftWord: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-black text-sm text-slate-900"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold">ฝั่งขวา (Right):</span>
                  <input
                    type="text"
                    value={rightWord}
                    onChange={(e) =>
                      setLiveSettings((prev) => ({ ...(prev || {}), heroRightWord: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-black text-sm text-slate-900"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-semibold self-center mr-1">
                  ชุดคำสำเร็จรูป:
                </span>
                {[
                  { l: 'BUD', r: 'DHISM', label: 'BUD • DHISM' },
                  { l: 'พุทธ', r: 'ศาสตร์', label: 'พุทธ • ศาสตร์' },
                  { l: 'MCU', r: 'FB', label: 'MCU • FB' },
                  { l: 'พธ.', r: 'มจร', label: 'พธ. • มจร' },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() =>
                      setLiveSettings((prev) => ({
                        ...(prev || {}),
                        heroLeftWord: p.l,
                        heroRightWord: p.r,
                      }))
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-bold text-[11px] transition cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Capsule Image Upload */}
            <div className="lg:col-span-7 space-y-2">
              <label className="font-bold text-slate-700 block">
                2. รูปภาพในแคปซูลตรงกลาง (อัปโหลดรูปใหม่ หรือใส่ลิงก์รูปภาพ):
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={s.heroCapsuleImage ?? ''}
                  onChange={(e) =>
                    setLiveSettings((prev) => ({
                      ...(prev || {}),
                      heroCapsuleImage: e.target.value,
                    }))
                  }
                  placeholder="/uploads/file-1793867472059.jpg"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadCapsuleFile(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-amber-700" />
                  <span>{uploadingImage ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปจากเครื่อง'}</span>
                </button>
              </div>

              {/* Background Theme Selector */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-semibold mr-1">
                  โทนสีพื้นหลัง Hero:
                </span>
                {[
                  { id: 'wavy-contours', label: 'ครีมอบอุ่นเส้นคลื่น (ค่าเริ่มต้น)' },
                  { id: 'gold-glow', label: 'ทองพุทธธรรมพรีเมียม' },
                  { id: 'minimal', label: 'ขาวสะอาดมินิมอล' },
                  { id: 'navy', label: 'กรมท่าวิชาการ (Dark)' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() =>
                      setLiveSettings((prev) => ({
                        ...(prev || {}),
                        heroBgStyle: bg.id as any,
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      bgStyle === bg.id
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Badge, Heading TH, SubHeading EN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">3. ป้ายกำกับด้านบน (Badge):</label>
                <button
                  type="button"
                  onClick={() =>
                    setLiveSettings((prev) => ({
                      ...(prev || {}),
                      heroBadgeText: 'คณะพุทธศาสตร์ • มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
                    }))
                  }
                  className="text-[10px] text-amber-700 hover:underline font-bold cursor-pointer"
                >
                  ใช้ชื่อคณะภาษาไทย
                </button>
              </div>
              <input
                type="text"
                value={badgeText}
                onChange={(e) =>
                  setLiveSettings((prev) => ({ ...(prev || {}), heroBadgeText: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                4. หัวข้อหลักภาษาไทย (ใต้รูปแคปซูล):
              </label>
              <input
                type="text"
                value={headingTh}
                onChange={(e) =>
                  setLiveSettings((prev) => ({ ...(prev || {}), heroHeadingTh: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                5. ข้อความบรรทัดรอง (อังกฤษ / ปีการศึกษา):
              </label>
              <input
                type="text"
                value={subHeadingEn}
                onChange={(e) =>
                  setLiveSettings((prev) => ({ ...(prev || {}), heroSubHeadingEn: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          {/* Row 3: Visibility Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={showTopNav}
                  onChange={(e) =>
                    setLiveSettings((prev) => ({
                      ...(prev || {}),
                      heroShowTopNav: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-amber-600"
                />
                <span>แสดงแถบเมนูด้านบนในกรอบ Hero</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={showBadge}
                  onChange={(e) =>
                    setLiveSettings((prev) => ({
                      ...(prev || {}),
                      heroShowBadge: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-amber-600"
                />
                <span>แสดงป้ายกำกับ Badge ด้านบน</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={showActionButtons}
                  onChange={(e) =>
                    setLiveSettings((prev) => ({
                      ...(prev || {}),
                      heroShowActionButtons: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-amber-600"
                />
                <span>แสดงปุ่มกดทางลัด (ยื่นคำร้อง / ตารางเรียน) ในกรอบ Hero</span>
              </label>
            </div>

            <button
              type="button"
              onClick={() =>
                setLiveSettings((prev) => ({
                  ...(prev || {}),
                  heroWildEnabled: false,
                }))
              }
              className="text-[11px] font-bold text-slate-500 hover:text-amber-700 underline cursor-pointer"
            >
              สลับเป็นแบนเนอร์แบบดั้งเดิม (Classic Banner)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
