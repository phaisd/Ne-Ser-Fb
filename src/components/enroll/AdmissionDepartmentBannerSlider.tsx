'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Pause,
  Play,
  Layers,
} from 'lucide-react';
import {
  AdmissionDepartmentBannerItem,
  DepartmentBannerColorTheme,
} from '@/types';

interface AdmissionDepartmentBannerSliderProps {
  banners?: AdmissionDepartmentBannerItem[];
  autoSlideInterval?: number; // วินาที
  onSelectMajor?: (majorName: string, degreeLevel?: string) => void;
}

const THEME_STYLES: Record<
  DepartmentBannerColorTheme,
  {
    container: string;
    badgeBorder: string;
    badgeBg: string;
    badgeText: string;
    degreePill: string;
    highlightPill: string;
    button: string;
    glow: string;
  }
> = {
  sage: {
    container:
      'bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-emerald-500/30',
    badgeBorder: 'border-emerald-400/30',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    degreePill: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/25',
    highlightPill: 'bg-emerald-900/40 text-emerald-100 border-emerald-700/40',
    button:
      'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-950/50',
    glow: 'from-emerald-500/10 via-transparent to-teal-500/10',
  },
  emerald: {
    container:
      'bg-gradient-to-r from-teal-950 via-emerald-900 to-slate-950 border-teal-500/30',
    badgeBorder: 'border-teal-400/30',
    badgeBg: 'bg-teal-500/20',
    badgeText: 'text-teal-300',
    degreePill: 'bg-teal-400/15 text-teal-200 border-teal-400/25',
    highlightPill: 'bg-teal-900/40 text-teal-100 border-teal-700/40',
    button:
      'bg-teal-400 hover:bg-teal-300 text-slate-950 font-black shadow-lg shadow-teal-950/50',
    glow: 'from-teal-500/10 via-transparent to-emerald-500/10',
  },
  forest: {
    container:
      'bg-gradient-to-r from-green-950 via-emerald-950 to-slate-900 border-green-500/30',
    badgeBorder: 'border-green-400/30',
    badgeBg: 'bg-green-500/20',
    badgeText: 'text-green-300',
    degreePill: 'bg-green-400/15 text-green-200 border-green-400/25',
    highlightPill: 'bg-green-900/40 text-green-100 border-green-700/40',
    button:
      'bg-green-500 hover:bg-green-400 text-slate-950 font-black shadow-lg shadow-green-950/50',
    glow: 'from-green-500/10 via-transparent to-emerald-500/10',
  },
  amber: {
    container:
      'bg-gradient-to-r from-stone-900 via-amber-950 to-slate-900 border-amber-500/30',
    badgeBorder: 'border-amber-400/30',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    degreePill: 'bg-amber-400/15 text-amber-200 border-amber-400/25',
    highlightPill: 'bg-amber-900/40 text-amber-100 border-amber-700/40',
    button:
      'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-950/50',
    glow: 'from-amber-500/10 via-transparent to-orange-500/10',
  },
  indigo: {
    container:
      'bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border-indigo-500/30',
    badgeBorder: 'border-indigo-400/30',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    degreePill: 'bg-indigo-400/15 text-indigo-200 border-indigo-400/25',
    highlightPill: 'bg-indigo-900/40 text-indigo-100 border-indigo-700/40',
    button:
      'bg-indigo-400 hover:bg-indigo-300 text-slate-950 font-black shadow-lg shadow-indigo-950/50',
    glow: 'from-indigo-500/10 via-transparent to-sky-500/10',
  },
  earth: {
    container:
      'bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950 border-stone-500/30',
    badgeBorder: 'border-amber-300/30',
    badgeBg: 'bg-stone-500/20',
    badgeText: 'text-amber-200',
    degreePill: 'bg-stone-400/15 text-amber-100 border-stone-400/25',
    highlightPill: 'bg-stone-800/60 text-stone-200 border-stone-600/40',
    button:
      'bg-amber-400 hover:bg-amber-300 text-stone-950 font-black shadow-lg shadow-stone-950/50',
    glow: 'from-amber-600/10 via-transparent to-stone-500/10',
  },
};

export function AdmissionDepartmentBannerSlider({
  banners = [],
  autoSlideInterval = 5,
  onSelectMajor,
}: AdmissionDepartmentBannerSliderProps) {
  // Filter only enabled banners
  const activeBanners = banners.filter((b) => b.enabled !== false);
  const total = activeBanners.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay effect
  useEffect(() => {
    if (total <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.max(autoSlideInterval, 3) * 1000;
    timerRef.current = setInterval(() => {
      nextSlide();
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused, autoSlideInterval, nextSlide]);

  if (total === 0) return null;

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];
  const theme = THEME_STYLES[currentBanner.colorTheme] || THEME_STYLES.sage;

  const handleAction = () => {
    if (currentBanner.actionType === 'EXTERNAL_LINK' && currentBanner.actionUrl) {
      window.open(currentBanner.actionUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (onSelectMajor) {
      onSelectMajor(currentBanner.majorName, currentBanner.degreeLevel);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl border shadow-xl transition-all duration-700 ease-out print:hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Background Container with Eye-friendly Soft Ambient Glow */}
      <div
        className={`relative p-4 sm:p-5 md:py-5 md:px-7 ${theme.container} text-white transition-colors duration-700`}
      >
        {/* Ambient Radial Mesh Background */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${theme.glow} pointer-events-none transition-all duration-700`}
        />
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/[0.03] rounded-full blur-2xl pointer-events-none" />

        {/* Department Watermark Background Image with Custom Opacity */}
        {currentBanner.bgImageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center pointer-events-none transition-all duration-700 mix-blend-screen"
            style={{
              backgroundImage: `url('${currentBanner.bgImageUrl}')`,
              opacity:
                typeof currentBanner.bgImageOpacity === 'number'
                  ? currentBanner.bgImageOpacity
                  : 0.18,
            }}
          />
        ) : (
          /* Built-in Decorative Artistic Watermark Silhouette when no custom photo is uploaded */
          <div className="absolute right-2 sm:right-8 -bottom-8 w-44 h-44 sm:w-56 sm:h-56 pointer-events-none opacity-[0.08] text-white select-none transition-all duration-700">
            {currentBanner.colorTheme === 'forest' ? (
              <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                <path d="M50 15 C45 35 30 45 10 50 C30 55 45 65 50 85 C55 65 70 55 90 50 C70 45 55 35 50 15 Z" />
                <path
                  d="M50 30 C45 42 35 50 25 55 C35 60 45 68 50 80 C55 68 65 60 75 55 C65 50 55 42 50 30 Z"
                  opacity="0.6"
                />
              </svg>
            ) : currentBanner.colorTheme === 'amber' ? (
              <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                <path d="M15 25 Q50 35 85 25 L85 75 Q50 85 15 75 Z" />
                <path d="M50 35 L50 85" stroke="currentColor" strokeWidth="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" />
                <circle cx="50" cy="50" r="14" fill="none" stroke="currentColor" strokeWidth="5" />
                <circle cx="50" cy="50" r="6" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                  <line
                    key={angle}
                    x1="50"
                    y1="50"
                    x2={50 + 38 * Math.cos((angle * Math.PI) / 180)}
                    y2={50 + 38 * Math.sin((angle * Math.PI) / 180)}
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                ))}
              </svg>
            )}
          </div>
        )}

        {/* Soft text protection shadow overlay to ensure text stays crystal-clear over any watermark */}
        <div className="absolute inset-y-0 left-0 w-full md:w-3/4 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Column: Tag & Major Info */}
          <div className="space-y-2 max-w-3xl">
            {/* Top Badges: Degree & Highlight */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{currentBanner.degreeLevel || 'คณะพุทธศาสตร์'}</span>
              </span>

              {currentBanner.badgeText && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/90 border border-white/15">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{currentBanner.badgeText}</span>
                </span>
              )}

              {/* Slide Counter Indicator */}
              <span className="text-[10px] text-slate-400 font-mono tracking-wider ml-auto md:ml-2">
                สาขาวิชาที่ {currentIndex + 1} / {total}
              </span>
            </div>

            {/* Major Title */}
            <div>
              <h2 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight leading-tight flex items-center gap-2">
                <span>{currentBanner.majorName}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300/95 leading-relaxed mt-1">
                {currentBanner.tagline}
              </p>
            </div>

            {/* Highlights Chips */}
            {currentBanner.highlights && currentBanner.highlights.length > 0 && (
              <div className="hidden sm:flex flex-wrap items-center gap-1.5 pt-0.5">
                {currentBanner.highlights.map((h, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold border ${theme.highlightPill}`}
                  >
                    <span className="text-amber-300">✓</span>
                    <span>{h}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: CTA Button & Navigation Controls */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
            <button
              type="button"
              onClick={handleAction}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-200 transform hover:scale-[1.03] active:scale-95 cursor-pointer ${theme.button}`}
            >
              <span>{currentBanner.actionText || 'สมัครเรียนสาขานี้ →'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Controls Bar: Prev / Dots / Next */}
            <div className="flex items-center gap-2 bg-black/25 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous Slide"
                className="p-1 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Dots */}
              <div className="flex items-center gap-1 px-1">
                {activeBanners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentIndex
                        ? 'w-5 bg-amber-400 shadow-xs'
                        : 'w-1.5 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next Slide"
                className="p-1 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Pause / Play Toggle */}
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                title={isPaused ? 'เล่นสไลด์อัตโนมัติ' : 'หยุดสไลด์ชั่วคราว'}
                className="p-1 rounded-full hover:bg-white/15 text-white/60 hover:text-amber-300 transition cursor-pointer ml-0.5 border-l border-white/10 pl-1.5"
              >
                {isPaused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
