'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Calendar, 
  CheckSquare, 
  FileText, 
  LayoutDashboard, 
  Table2,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Lock,
  BookOpen,
  UserCheck,
  LogOut,
  KeyRound,
  Globe,
  Laptop,
  Award,
  ChevronDown,
  ShieldAlert,
  User,
  History,
  Menu,
  X,
  Briefcase
} from 'lucide-react';
import { translations, Language } from '@/lib/translations';
import { getAuthUser, isAdminOrOfficer, canAccessAdminConsole, clearAuthSession } from '@/lib/auth-client';
import { hasProjectDuty } from '@/lib/events/projectDuty';
import UserProfileModal from '@/components/UserProfileModal';
import ThemeModeToggle from './ThemeModeToggle';
import {
  NavbarSessionConflictModal,
  NavbarVipassanaBanner,
  NavbarMobileDrawer,
  NavbarUserMenu,
} from './navigation';

export default function Navbar() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin') || pathname === '/attendance' || pathname === '/workload' || pathname === '/settings';

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'PROFILE' | 'PASSWORD' | 'HISTORY'>('PROFILE');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [sessionConflictInfo, setSessionConflictInfo] = useState<{
    isOpen: boolean;
    activeDevice?: string;
    message?: string;
  }>({ isOpen: false });
  const [settings, setSettings] = useState<any>(null);
  const [lang, setLang] = useState<Language>('th');
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>('th');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [autoLogoutMins, setAutoLogoutMins] = useState<number>(15);
  const [suspiciousAlertsCount, setSuspiciousAlertsCount] = useState<number>(0);
  const [activeVipassanaStation, setActiveVipassanaStation] = useState<{
    eventId: string;
    eventTitle: string;
    action: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    try {
      const cookies = document.cookie.split(';');
      const gtCookie = cookies.find((c) => c.trim().startsWith('googtrans='));
      if (gtCookie) {
        const rawVal = decodeURIComponent(gtCookie.split('=')[1]?.trim() || '');
        const segments = rawVal.split('/').filter(Boolean);
        const code = segments.length > 0 ? segments[segments.length - 1] : 'th';
        if (code) {
          setSelectedLanguageCode(code);
          setLang(code === 'en' ? 'en' : 'th');
        }
      } else {
        const savedLang = localStorage.getItem('mcu_lang') || 'th';
        setSelectedLanguageCode(savedLang);
        setLang(savedLang === 'en' ? 'en' : 'th');
      }
    } catch (e) {}

    const loadAutoLogout = () => {
      try {
        const val = localStorage.getItem('mcu_auto_logout_minutes');
        if (val !== null) {
          setAutoLogoutMins(parseInt(val, 10));
        } else {
          setAutoLogoutMins(15);
        }
      } catch (e) {}
    };
    loadAutoLogout();

    const handleSettingChange = (e: Event) => {
      const customEvt = e as CustomEvent<number>;
      if (customEvt?.detail !== undefined) {
        setAutoLogoutMins(customEvt.detail);
      } else {
        loadAutoLogout();
      }
    };
    window.addEventListener('mcu_auto_logout_changed', handleSettingChange);
    return () => {
      window.removeEventListener('mcu_auto_logout_changed', handleSettingChange);
    };
  }, []);

  // Single active device session enforcement check
  useEffect(() => {
    if (!currentUser) return;

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (data.sessionConflict) {
          clearAuthSession();
          setCurrentUser(null);
          setSessionConflictInfo({
            isOpen: true,
            activeDevice: data.activeDevice,
            message: data.message,
          });
        }
      } catch {}
    };

    const interval = setInterval(checkSession, 30000);
    const handleFocus = () => checkSession();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [currentUser]);

  // Listen for global requests to open Profile / Password / Login History modal + check suspicious alerts
  useEffect(() => {
    const handleOpenProfile = (e: Event) => {
      const tab = (e as CustomEvent<{ tab?: string }>)?.detail?.tab;
      if (tab === 'PROFILE' || tab === 'PASSWORD' || tab === 'HISTORY') {
        setProfileModalTab(tab);
      }
      setIsUserMenuOpen(false);
      setIsProfileModalOpen(true);
    };

    window.addEventListener('mcu_open_profile_modal', handleOpenProfile);
    return () => {
      window.removeEventListener('mcu_open_profile_modal', handleOpenProfile);
    };
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role === 'STUDENT') {
      setSuspiciousAlertsCount(0);
      return;
    }

    let cancelled = false;
    fetch('/api/auth?action=history')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.success && d.security) {
          const count =
            (d.security.failedAttemptsCount || 0) +
            (d.security.supersededCount || 0);
          setSuspiciousAlertsCount(count);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [currentUser, isProfileModalOpen]);

  const toggleAutoLogout = () => {
    const nextVal = autoLogoutMins === 0 ? 15 : 0;
    setAutoLogoutMins(nextVal);
    try {
      localStorage.setItem('mcu_auto_logout_minutes', nextVal.toString());
      window.dispatchEvent(new CustomEvent('mcu_auto_logout_changed', { detail: nextVal }));
    } catch (e) {}
  };

  const handleSelectLanguage = (targetLang: string) => {
    setIsLangMenuOpen(false);
    setSelectedLanguageCode(targetLang);
    setLang(targetLang === 'en' ? 'en' : 'th');

    try {
      localStorage.setItem('mcu_lang', targetLang);
      window.dispatchEvent(new CustomEvent('mcu_lang_changed', { detail: targetLang }));
    } catch (e) {}

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const cookieSuffix = isHttps ? '; SameSite=Lax; Secure' : '; SameSite=Lax';

    const domains = [
      '',
      `domain=${window.location.hostname};`,
      `domain=.${window.location.hostname};`,
    ];

    if (targetLang === 'th') {
      // Clear googtrans cookie across all possible domain paths
      domains.forEach((d) => {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; ${d}${cookieSuffix}`.trim();
      });
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${cookieSuffix}`;

      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (combo) {
        combo.value = '';
        combo.dispatchEvent(new Event('change'));
      }
      setTimeout(() => {
        window.location.reload();
      }, 50);
    } else {
      const cookieVal = `/th/${targetLang}`;
      domains.forEach((d) => {
        document.cookie = `googtrans=${cookieVal}; path=/; ${d}${cookieSuffix}`.trim();
      });
      document.cookie = `googtrans=${cookieVal}; path=/;${cookieSuffix}`;
      document.cookie = `googtrans=/auto/${targetLang}; path=/;${cookieSuffix}`;

      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (combo && combo.options && combo.options.length > 0) {
        combo.value = targetLang;
        combo.dispatchEvent(new Event('change'));
      } else {
        // Wait up to 1.5s for combo options to populate, otherwise reload
        let retries = 0;
        const interval = setInterval(() => {
          retries++;
          const liveCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
          if (liveCombo && liveCombo.options && liveCombo.options.length > 0) {
            clearInterval(interval);
            liveCombo.value = targetLang;
            liveCombo.dispatchEvent(new Event('change'));
          } else if (retries >= 15) {
            clearInterval(interval);
            window.location.reload();
          }
        }, 100);
      }
    }
  };

  const toggleLanguage = () => {
    const next = selectedLanguageCode === 'th' ? 'en' : 'th';
    handleSelectLanguage(next);
  };

  const t = translations[lang];

  const loadSettings = () => {
    fetch('/api/system-settings')
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.data) {
          setSettings(d.data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadSettings();

    const handleUpdate = () => loadSettings();
    window.addEventListener('mcu_settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('mcu_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const isAdmin = isAdminOrOfficer(currentUser);
  const isInstructorOnly = Boolean(
    currentUser &&
      currentUser.role === 'INSTRUCTOR' &&
      !currentUser.isSuperAdmin &&
      !currentUser.isActingOfficer &&
      currentUser.email?.toLowerCase() !== 'phaisal.dis@mcu.ac.th'
  );
  const userHasProjectDuty = Boolean(
    currentUser &&
      (isAdminOrOfficer(currentUser) ||
        currentUser.role === 'VIPASSANA_MASTER' ||
        (currentUser as any).isProjectCoordinator ||
        hasProjectDuty(currentUser))
  );

  const isStudent = Boolean(
    currentUser &&
      (currentUser.role === 'STUDENT' ||
        currentUser.studentCode ||
        /^\d{5,12}(@mcu\.ac\.th)?$/i.test((currentUser.email || '').trim()))
  );
  const isStaffOrInstructor = Boolean(currentUser && !isStudent);

  useEffect(() => {
    try {
      const user = getAuthUser();
      if (user) {
        setCurrentUser(user);
      } else {
        // Also check server session
        fetch('/api/auth')
          .then((r) => r.json())
          .then((d) => {
            if (d.authenticated && d.user) {
              setCurrentUser(d.user);
              localStorage.setItem('mcu_current_user', JSON.stringify(d.user));
            } else {
              setCurrentUser(null);
            }
          })
          .catch(() => {
            setCurrentUser(null);
          });
      }
    } catch (e) {}
    setIsMobileMenuOpen(false);
    try {
      const savedStation =
        sessionStorage.getItem('mcu_active_vipassana_station') ||
        localStorage.getItem('mcu_active_vipassana_station');
      if (savedStation) {
        if (isInstructorOnly && !userHasProjectDuty) {
          sessionStorage.removeItem('mcu_active_vipassana_station');
          localStorage.removeItem('mcu_active_vipassana_station');
          setActiveVipassanaStation(null);
        } else {
          const parsed = JSON.parse(savedStation);
          if (parsed && parsed.url) {
            setActiveVipassanaStation(parsed);
          }
        }
      } else {
        setActiveVipassanaStation(null);
      }
    } catch {}
  }, [pathname, isInstructorOnly, userHasProjectDuty]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (e) {}
    clearAuthSession();
    setCurrentUser(null);
    window.location.href = '/';
  };

  const publicNavItems = [
    { href: '/', label: t.navHome, icon: LayoutDashboard },
    ...(isStaffOrInstructor ? [{ href: '/workload', label: 'ภาระงานสอนของฉัน', icon: Briefcase }] : []),
    ...(settings?.showEnrollmentMenu !== false ? [{ href: '/enroll', label: 'สมัครเรียน/นิสิตใหม่', icon: GraduationCap }] : []),
    ...(settings?.showCertificatesMenu !== false ? [{ href: '/certificates', label: t.navCertificates, icon: FileText }] : []),
    ...(settings?.showCoursesMenu !== false ? [{ href: '/courses', label: t.navCourses, icon: BookOpen }] : []),
    ...(isAdmin && settings?.showStudentsSearch !== false ? [{ href: '/students', label: t.navStudents, icon: Users }] : []),
    ...(settings?.showEventsMenu === true ? [{ href: '/events', label: 'กิจกรรมนิสิต', icon: Award }] : []),
  ];

  const adminNavItems = [
    ...(canAccessAdminConsole(currentUser) ? [{ href: '/admin', label: t.navAdmin, icon: ShieldCheck }] : []),
    ...(isStaffOrInstructor ? [{ href: '/workload', label: 'ภาระงานสอนของฉัน', icon: Briefcase }] : []),
    ...(settings?.showCoursesMenu !== false ? [{ href: '/courses', label: t.navCourses, icon: BookOpen }] : []),
    { href: '/attendance', label: t.navAttendance, icon: CheckSquare },
    ...(settings?.showEventsMenu === true ? [{ href: '/events', label: 'กิจกรรมนิสิต', icon: Award }] : []),
    ...(isAdmin && settings?.showStudentsSearch !== false ? [{ href: '/students', label: t.navStudents, icon: Users }] : []),
    ...(isAdmin ? [{ href: '/settings', label: t.navSettings, icon: Table2 }] : []),
  ];

  return (
    <>
      <header className={`sticky top-0 z-50 backdrop-blur border-b shadow-sm transition-colors duration-200 print:hidden theme-nav-accent max-w-full overflow-x-clip ${
      isAdminRoute ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 h-14 sm:h-16">
          {/* Logo Brand (flex-1 min-w-0 on mobile so it never pushes right buttons off-screen) */}
          <Link href={isAdminRoute ? (isAdmin ? '/admin' : '/attendance') : '/'} className="flex items-center gap-2 sm:gap-3 group min-w-0 flex-1 sm:flex-initial">
            {settings?.logoUrl ? (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-center p-1 overflow-hidden shrink-0 group-hover:scale-105 transition">
                <img
                  src={settings.logoUrl}
                  alt={settings.facultyNameTh || 'MCU Logo'}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-md text-lg sm:text-xl shrink-0 group-hover:scale-105 transition ${
                isAdminRoute 
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20' 
                  : 'bg-gradient-to-tr from-orange-600 to-amber-500 shadow-orange-500/20'
              }`}>
                {settings?.logoEmoji || (isAdminRoute ? <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" /> : <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className={`font-bold text-xs sm:text-base leading-tight truncate ${isAdminRoute ? 'text-white' : 'text-slate-900'}`}>
                  {isAdminRoute ? 'Admin Console' : (settings?.facultyNameTh || 'คณะพุทธศาสตร์')}
                </span>
                <span className={`text-[9.5px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                  isAdminRoute ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-orange-100 text-orange-700'
                }`}>
                  <span className="hidden sm:inline">
                    {isAdminRoute ? 'หลังบ้าน (อาจารย์/เจ้าหน้าที่)' : 'ระบบบริการการศึกษา'}
                  </span>
                  <span className="sm:hidden">
                    {isAdminRoute ? 'อาจารย์/เจ้าหน้าที่' : 'บริการนิสิต'}
                  </span>
                </span>
              </div>
              <span className={`text-[10.5px] sm:text-xs block truncate ${isAdminRoute ? 'text-slate-400' : 'text-orange-600 font-medium'}`}>
                {isAdminRoute 
                  ? `${settings?.facultyNameTh || 'คณะพุทธศาสตร์'} • ${settings?.universityNameTh || 'มจร'}` 
                  : (settings?.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย')}
              </span>
            </div>
          </Link>

          {/* User Auth & Portal Switcher & Language Toggle (shrink-0, compact on mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Day / Night Mode Toggle: Compact icon on mobile, full pill on sm+ */}
            <ThemeModeToggle variant="icon" className="sm:hidden" />
            <ThemeModeToggle variant="pill" className="hidden sm:inline-flex" />

            {/* Language Switcher Pill + Dropdown (Hidden on very small screens < 400px since it's in the Mobile Drawer, compact on sm+) */}
            <div className="relative hidden xs:block sm:block">
              <div
                className={`flex items-center rounded-xl text-xs font-bold transition border overflow-hidden ${
                  isAdminRoute
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition"
                  title="คลิกเพื่อสลับภาษา ไทย / English (Translate Page)"
                >
                  <Globe className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>
                    {selectedLanguageCode === 'th'
                      ? '🇹🇭 TH'
                      : selectedLanguageCode === 'en'
                      ? '🇬🇧 EN'
                      : selectedLanguageCode === 'my'
                      ? '🇲🇲 MY'
                      : selectedLanguageCode === 'vi'
                      ? '🇻🇳 VI'
                      : selectedLanguageCode === 'km'
                      ? '🇰🇭 KM'
                      : selectedLanguageCode === 'zh-CN'
                      ? '🇨🇳 ZH'
                      : '🌐 ' + selectedLanguageCode.toUpperCase()}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="px-1.5 py-1.5 border-l border-slate-200/60 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  title="เลือกภาษาอื่นสำหรับนิสิตต่างประเทศ (More Languages for International Students)"
                >
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Language Dropdown Menu */}
              {isLangMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsLangMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs text-slate-700 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-100">
                      แปลภาษาทั้งเว็บไซต์ (Translate Website)
                    </div>
                    {[
                      { code: 'th', flag: '🇹🇭', label: 'ไทย (Thai)', sub: 'ต้นฉบับ' },
                      { code: 'en', flag: '🇬🇧', label: 'English', sub: 'International' },
                      { code: 'my', flag: '🇲🇲', label: 'မြန်မာ (Burmese)', sub: 'Myanmar' },
                      { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt', sub: 'Vietnam' },
                      { code: 'km', flag: '🇰🇭', label: 'ភាសាខ្មែរ', sub: 'Cambodia' },
                      { code: 'zh-CN', flag: '🇨🇳', label: '中文 (Chinese)', sub: 'China' },
                      { code: 'lo', flag: '🇱🇦', label: 'ພາສາລາວ', sub: 'Laos' },
                    ].map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => handleSelectLanguage(item.code)}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-orange-50 transition cursor-pointer ${
                          selectedLanguageCode === item.code ? 'bg-orange-50 font-bold text-orange-950' : ''
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{item.flag}</span>
                          <span>{item.label}</span>
                        </span>
                        {selectedLanguageCode === item.code && (
                          <span className="text-[10px] text-orange-600 font-bold">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {currentUser ? (
              <NavbarUserMenu
                currentUser={currentUser}
                isAdminRoute={isAdminRoute}
                isStaffOrInstructor={isStaffOrInstructor}
                isStudent={isStudent}
                autoLogoutMins={autoLogoutMins}
                suspiciousAlertsCount={suspiciousAlertsCount}
                isUserMenuOpen={isUserMenuOpen}
                setIsUserMenuOpen={setIsUserMenuOpen}
                onToggleAutoLogout={toggleAutoLogout}
                onOpenProfile={(tab: 'PROFILE' | 'PASSWORD' | 'HISTORY') => {
                  setProfileModalTab(tab);
                  setIsProfileModalOpen(true);
                }}
                onLogout={handleLogout}
              />
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition shrink-0"
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">เข้าสู่ระบบอาจารย์</span>
                <span className="sm:hidden">เข้าสู่ระบบ</span>
              </Link>
            )}

            {/* Portal Switch Button (Desktop md+) */}
            {isAdminRoute ? (
              <Link
                href="/"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 transition"
              >
                <GraduationCap className="w-4 h-4 text-orange-400" />
                <span>หน้าบ้าน</span>
              </Link>
            ) : canAccessAdminConsole(currentUser) ? (
              <Link
                href={
                  userHasProjectDuty
                    ? (activeVipassanaStation?.url || '/admin?tab=EVENTS')
                    : isInstructorOnly
                    ? '/admin?tab=ATTENDANCE'
                    : '/admin'
                }
                className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md transition"
                title={userHasProjectDuty ? 'กลับไปยังหน้าตรวจเช็คชื่อ / สอบอารมณ์โครงการวิปัสสนา' : 'ระบบบันทึกเวลาเรียนและวัดผล'}
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {currentUser?.role === 'VIPASSANA_MASTER'
                    ? 'หน้าสอบอารมณ์'
                    : userHasProjectDuty && activeVipassanaStation
                    ? 'กลับหน้าสแกน/สอบอารมณ์'
                    : isInstructorOnly
                    ? 'ระบบเวลาเรียน'
                    : 'หลังบ้าน'}
                </span>
              </Link>
            ) : isStaffOrInstructor ? (
              <Link
                href="/attendance"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md transition"
              >
                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>บันทึกเวลาเรียน</span>
              </Link>
            ) : null}

            {/* Mobile / Tablet Menu Button (Visible on < lg screens) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl transition cursor-pointer border shrink-0 ${
                isAdminRoute
                  ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
              }`}
              aria-label="เปิดเมนูนำทาง"
              title="เปิดเมนูนำทาง (Navigation Menu)"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-rose-500" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tier 2: Dedicated Navigation Menu Bar (Touch-scrollable on Mobile, Wrapping on Desktop) */}
      <div
        className={`block border-t transition-colors duration-200 ${
          isAdminRoute
            ? 'bg-slate-950/80 border-slate-800/80 text-slate-200'
            : 'bg-slate-50/95 border-slate-200/60 text-slate-700'
        }`}
      >
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <nav className="flex lg:flex-wrap items-center gap-1 sm:gap-1.5 py-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            {(isAdminRoute ? adminNavItems : publicNavItems).map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isAdminRoute
                      ? isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/90 border border-transparent hover:border-slate-700'
                      : isActive
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-white border border-transparent hover:border-slate-200/80 hover:shadow-2xs'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive
                        ? 'text-white'
                        : isAdminRoute
                        ? 'text-emerald-400'
                        : 'text-orange-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Mobile Quick Portal Switch Pill at the end of the scrollable bar */}
            {isAdminRoute ? (
              <Link
                href="/"
                className="md:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-800 text-amber-300 border border-slate-700 whitespace-nowrap shrink-0"
              >
                <GraduationCap className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>ไปหน้าบ้าน</span>
              </Link>
            ) : isStaffOrInstructor && !canAccessAdminConsole(currentUser) ? (
              <Link
                href="/attendance"
                className="md:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-900 text-white whitespace-nowrap shrink-0"
              >
                <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>เช็คชื่อนิสิต</span>
              </Link>
            ) : canAccessAdminConsole(currentUser) ? (
              <Link
                href={isInstructorOnly && !userHasProjectDuty ? '/admin?tab=ATTENDANCE' : '/admin'}
                className="sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-900 text-white whitespace-nowrap shrink-0"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{isInstructorOnly && !userHasProjectDuty ? 'ระบบเวลาเรียน' : 'ระบบหลังบ้าน'}</span>
              </Link>
            ) : null}
          </nav>
        </div>
      </div>
      {/* Persistent Floating Return Banner if user accidentally navigated to Public Pages while having an Active Vipassana Station */}
      <NavbarVipassanaBanner
        pathname={pathname}
        currentUser={currentUser}
        userHasProjectDuty={userHasProjectDuty}
        activeVipassanaStation={activeVipassanaStation}
      />
    </header>

      {/* Mobile & Tablet Drawer Menu */}
      <NavbarMobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isAdminRoute={isAdminRoute}
        pathname={pathname}
        currentUser={currentUser}
        userHasProjectDuty={userHasProjectDuty}
        isInstructorOnly={isInstructorOnly}
        isStaffOrInstructor={isStaffOrInstructor}
        activeVipassanaStation={activeVipassanaStation}
        adminNavItems={adminNavItems}
        publicNavItems={publicNavItems}
        selectedLanguageCode={selectedLanguageCode}
        onSelectLanguage={handleSelectLanguage}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* User Profile & Password Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        initialTab={profileModalTab}
        onUserUpdated={(updated) => setCurrentUser(updated)}
      />

      {/* Session Conflict Modal (Terminated by New Device Login) */}
      <NavbarSessionConflictModal
        isOpen={sessionConflictInfo.isOpen}
        message={sessionConflictInfo.message}
        activeDevice={sessionConflictInfo.activeDevice}
      />
    </>
  );
}
