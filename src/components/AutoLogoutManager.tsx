'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldAlert, Clock, LogOut, CheckCircle, Laptop, ShieldCheck } from 'lucide-react';
import { getAuthUser, clearAuthSession } from '@/lib/auth-client';

// Countdown duration before auto-logout: 60 seconds
const WARNING_COUNTDOWN_SECONDS = 60;

export default function AutoLogoutManager() {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_COUNTDOWN_SECONDS);
  // timeoutMinutes: 15, 30, 60, or 0 (0 = OFF / Personal computer mode)
  const [timeoutMinutes, setTimeoutMinutes] = useState(15);

  const lastActivityRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  // Load configured timeout preference if stored
  const loadTimeoutPreference = useCallback(() => {
    try {
      const savedTimeout = localStorage.getItem('mcu_auto_logout_minutes');
      if (savedTimeout !== null) {
        const val = parseInt(savedTimeout, 10);
        if ([0, 10, 15, 20, 30, 60].includes(val)) {
          setTimeoutMinutes(val);
          return val;
        }
      }
    } catch (e) {}
    return 15;
  }, []);

  useEffect(() => {
    loadTimeoutPreference();
  }, [loadTimeoutPreference]);

  // Check login state
  const checkLoginState = useCallback(() => {
    try {
      const user = getAuthUser();
      const hasUser = !!user;
      setIsLoggedIn(hasUser);
      return hasUser;
    } catch (e) {
      return false;
    }
  }, []);

  // Logout handler
  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (e) {}

    clearAuthSession();
    try {
      sessionStorage.setItem('mcu_logout_reason', 'inactivity');
    } catch (e) {}

    setIsLoggedIn(false);
    setShowWarning(false);

    // Redirect to login with reason
    const redirectParam = pathname && pathname !== '/login' ? `&redirect=${encodeURIComponent(pathname)}` : '';
    window.location.href = `/login?reason=inactivity${redirectParam}`;
  }, [pathname]);

  // Keep alive / reset activity
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
      setSecondsRemaining(WARNING_COUNTDOWN_SECONDS);
    }
  }, [showWarning]);

  // Update timeout preference
  const handleUpdateTimeout = (mins: number) => {
    setTimeoutMinutes(mins);
    try {
      localStorage.setItem('mcu_auto_logout_minutes', mins.toString());
      window.dispatchEvent(new CustomEvent('mcu_auto_logout_changed', { detail: mins }));
    } catch (e) {}
    resetActivity();
  };

  // Track user activity events
  useEffect(() => {
    const handleUserActivity = () => {
      // If warning modal is showing, only the modal buttons can dismiss it
      if (!showWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Throttle event listener
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledHandler = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          handleUserActivity();
          throttleTimeout = null;
        }, 1000);
      }
    };

    events.forEach((ev) => window.addEventListener(ev, throttledHandler, { passive: true }));

    // Listen to login/logout/setting change events
    const checkUser = () => checkLoginState();
    const handleSettingChange = (e: any) => {
      if (e?.detail !== undefined) {
        setTimeoutMinutes(e.detail);
      } else {
        loadTimeoutPreference();
      }
    };

    window.addEventListener('storage', checkUser);
    window.addEventListener('mcu_user_logged_in', checkUser);
    window.addEventListener('mcu_user_logged_out', checkUser);
    window.addEventListener('mcu_auto_logout_changed', handleSettingChange);

    checkUser();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, throttledHandler));
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('mcu_user_logged_in', checkUser);
      window.removeEventListener('mcu_user_logged_out', checkUser);
      window.removeEventListener('mcu_auto_logout_changed', handleSettingChange);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [checkLoginState, loadTimeoutPreference, showWarning]);

  // Heartbeat interval checking inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      // Don't monitor on login page or if not logged in
      if (pathname === '/login') {
        setShowWarning(false);
        return;
      }

      // If user disabled auto-logout (timeoutMinutes === 0 for personal devices), skip!
      if (timeoutMinutes === 0) {
        if (showWarning) setShowWarning(false);
        return;
      }

      const active = checkLoginState();
      if (!active) {
        setShowWarning(false);
        return;
      }

      const now = Date.now();
      const totalTimeoutMs = timeoutMinutes * 60 * 1000;
      const warningThresholdMs = totalTimeoutMs - WARNING_COUNTDOWN_SECONDS * 1000;
      const elapsedMs = now - lastActivityRef.current;

      if (elapsedMs >= totalTimeoutMs) {
        // Time is up -> Auto Logout
        clearInterval(interval);
        performLogout();
      } else if (elapsedMs >= warningThresholdMs) {
        // In warning zone (last 60 seconds)
        const leftSec = Math.max(1, Math.ceil((totalTimeoutMs - elapsedMs) / 1000));
        setSecondsRemaining(leftSec);
        setShowWarning(true);
      } else {
        if (showWarning) {
          setShowWarning(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pathname, timeoutMinutes, checkLoginState, performLogout, showWarning]);

  // If not logged in, or on login page, or auto-logout disabled, or warning not triggered
  if (!isLoggedIn || pathname === '/login' || timeoutMinutes === 0 || !showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border-2 border-amber-400 space-y-5 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow Header */}
        <div className="w-16 h-16 rounded-full bg-amber-100 border-4 border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-inner animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300">
            ระบบความปลอดภัย (Security Timeout)
          </span>
          <h3 className="text-xl font-black text-slate-900 pt-1">
            ไม่มีการใช้งานระบบเป็นเวลานาน
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            ไม่มีการเคลื่อนไหวหรือใช้งานระบบมาเป็นเวลา {timeoutMinutes} นาที เพื่อป้องกันไม่ให้ผู้อื่นแอบเข้าใช้งานเครื่อง ระบบจะทำการออกจากระบบอัตโนมัติใน:
          </p>
        </div>

        {/* Circular Countdown Badge */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-center gap-3">
          <Clock className="w-6 h-6 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
          <div className="text-3xl font-black font-mono text-amber-900 tracking-tight">
            00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
          </div>
          <span className="text-xs font-bold text-amber-700">วินาที</span>
        </div>

        {/* Timeout Duration Selector & Personal Computer Toggle */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
          <div className="text-slate-600 font-bold text-[11px] flex items-center justify-center gap-1">
            <span>ปรับตั้งเวลา หรือเลือกโหมดเครื่องส่วนตัว:</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {[15, 30, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleUpdateTimeout(mins)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  timeoutMinutes === mins
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {mins} นาที
              </button>
            ))}

            <button
              type="button"
              onClick={() => handleUpdateTimeout(0)}
              className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-slate-800 hover:bg-slate-900 text-white transition cursor-pointer flex items-center gap-1 shadow-xs"
              title="ปิด Auto-Logout สำหรับการใช้งานบนเครื่องโน้ตบุ๊กส่วนตัว"
            >
              <Laptop className="w-3 h-3 text-amber-300" />
              <span>เครื่องส่วนตัว (ปิดระบบนี้)</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={performLogout}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>ออกจากระบบทันที</span>
          </button>

          <button
            type="button"
            onClick={resetActivity}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>ใช้งานต่อ (Stay Active)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
