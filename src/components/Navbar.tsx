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
  X
} from 'lucide-react';
import { translations, Language } from '@/lib/translations';
import { getAuthUser, isAdminOrOfficer, clearAuthSession } from '@/lib/auth-client';
import UserProfileModal from '@/components/UserProfileModal';

export default function Navbar() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin') || pathname === '/attendance' || pathname === '/settings';

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

  useEffect(() => {
    try {
      const cookies = document.cookie.split(';');
      const gtCookie = cookies.find((c) => c.trim().startsWith('googtrans='));
      if (gtCookie) {
        const val = gtCookie.split('=')[1]?.trim();
        const code = val.replace('/th/', '');
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

    const handleSettingChange = (e: any) => {
      if (e?.detail !== undefined) {
        setAutoLogoutMins(e.detail);
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
    setLang(targetLang === 'th' ? 'th' : 'en');

    try {
      localStorage.setItem('mcu_lang', targetLang);
      window.dispatchEvent(new CustomEvent('mcu_lang_changed', { detail: targetLang }));
    } catch (e) {}

    // Google Translate Cookie handling
    if (targetLang === 'th') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    } else {
      const cookieVal = `/th/${targetLang}`;
      document.cookie = `googtrans=${cookieVal}; path=/;`;
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${window.location.hostname};`;
      document.cookie = `googtrans=${cookieVal}; path=/; domain=.${window.location.hostname};`;
    }

    // Try live select
    const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (combo) {
      combo.value = targetLang;
      combo.dispatchEvent(new Event('change'));
    } else {
      window.location.reload();
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
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (e) {}
    clearAuthSession();
    setCurrentUser(null);
    window.location.href = '/';
  };

  const isAdmin = isAdminOrOfficer(currentUser);

  const publicNavItems = [
    { href: '/', label: t.navHome, icon: LayoutDashboard },
    ...(settings?.showCertificatesMenu !== false ? [{ href: '/certificates', label: t.navCertificates, icon: FileText }] : []),
    ...(settings?.showCoursesMenu !== false ? [{ href: '/courses', label: t.navCourses, icon: BookOpen }] : []),
    ...(isAdmin && settings?.showStudentsSearch !== false ? [{ href: '/students', label: t.navStudents, icon: Users }] : []),
    ...(settings?.showEventsMenu === true ? [{ href: '/events', label: 'กิจกรรมนิสิต', icon: Award }] : []),
  ];

  const adminNavItems = [
    ...(isAdmin ? [{ href: '/admin', label: t.navAdmin, icon: ShieldCheck }] : []),
    ...(settings?.showCoursesMenu !== false ? [{ href: '/courses', label: t.navCourses, icon: BookOpen }] : []),
    { href: '/attendance', label: t.navAttendance, icon: CheckSquare },
    ...(settings?.showEventsMenu === true ? [{ href: '/events', label: 'กิจกรรมนิสิต', icon: Award }] : []),
    ...(isAdmin && settings?.showStudentsSearch !== false ? [{ href: '/students', label: t.navStudents, icon: Users }] : []),
    ...(isAdmin ? [{ href: '/settings', label: t.navSettings, icon: Table2 }] : []),
  ];

  return (
    <header className={`sticky top-0 z-50 backdrop-blur border-b shadow-sm transition-colors duration-200 print:hidden theme-nav-accent ${
      isAdminRoute ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <Link href={isAdminRoute ? (isAdmin ? '/admin' : '/attendance') : '/'} className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            {settings?.logoUrl ? (
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-center p-1 overflow-hidden shrink-0 group-hover:scale-105 transition">
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
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md text-xl shrink-0 group-hover:scale-105 transition ${
                isAdminRoute 
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20' 
                  : 'bg-gradient-to-tr from-orange-600 to-amber-500 shadow-orange-500/20'
              }`}>
                {settings?.logoEmoji || (isAdminRoute ? <ShieldCheck className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`font-bold text-sm sm:text-base leading-tight whitespace-nowrap ${isAdminRoute ? 'text-white' : 'text-slate-900'}`}>
                  {isAdminRoute ? 'Admin Console' : (settings?.facultyNameTh || 'คณะพุทธศาสตร์')}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                  isAdminRoute ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-orange-100 text-orange-700'
                }`}>
                  {isAdminRoute ? 'หลังบ้าน (อาจารย์/เจ้าหน้าที่)' : 'ระบบบริการการศึกษา'}
                </span>
              </div>
              <span className={`text-[11px] sm:text-xs block whitespace-nowrap truncate max-w-[220px] sm:max-w-none ${isAdminRoute ? 'text-slate-400' : 'text-orange-600 font-medium'}`}>
                {isAdminRoute 
                  ? `${settings?.facultyNameTh || 'คณะพุทธศาสตร์'} • ${settings?.universityNameTh || 'มจร'}` 
                  : (settings?.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย')}
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {(isAdminRoute ? adminNavItems : publicNavItems).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isAdminRoute
                      ? isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : isActive
                        ? 'bg-orange-50 text-orange-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? (isAdminRoute ? 'text-white' : 'text-orange-600') : 'opacity-70'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Auth & Portal Switcher & Language Toggle */}
          <div className="flex items-center gap-2">
            {/* Language Switcher Pill + Dropdown */}
            <div className="relative">
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
                  className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition"
                  title="คลิกเพื่อสลับภาษา ไทย / English (Translate Page)"
                >
                  <Globe className="w-3.5 h-3.5 text-orange-500" />
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
              <div className="flex items-center gap-2">
                {/* Auto-Logout / Personal Mode Toggle Pill */}
                {autoLogoutMins === 0 ? (
                  <button
                    onClick={toggleAutoLogout}
                    title="โหมดเครื่องส่วนตัว (ปิด Auto-Logout ไม่เตือน) — คลิกเพื่อเปิดระบบป้องกัน 15 นาที"
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer"
                  >
                    <Laptop className="w-3.5 h-3.5 text-amber-500" />
                    <span>เครื่องส่วนตัว</span>
                  </button>
                ) : (
                  <button
                    onClick={toggleAutoLogout}
                    title={`ระบบป้องกัน Auto-Logout ${autoLogoutMins} นาที — คลิกเพื่อสลับเป็นโหมดเครื่องส่วนตัว`}
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Auto-Logout {autoLogoutMins}น.</span>
                  </button>
                )}

                {/* User Profile & Actions Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    title="คลิกเพื่อเปิดเมนูบัญชีผู้ใช้"
                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer hover:shadow-md ${
                      isAdminRoute
                        ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 hover:border-emerald-500/50'
                        : 'bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-200 hover:border-orange-300'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline truncate max-w-[130px]">{currentUser.name}</span>
                    <span className="text-[10px] opacity-70 font-normal hidden md:inline ml-0.5 underline">
                      (แก้ไข)
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform opacity-70 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                        {/* User Header */}
                        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 -mt-2 mb-1.5 rounded-t-2xl">
                          <div className="text-[10px] font-bold text-orange-600 uppercase flex items-center gap-1">
                            <span>{isAdmin ? '👑 ผู้ดูแลระบบ' : '🔒 อาจารย์ผู้สอน'}</span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                            {currentUser.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {currentUser.email}
                          </div>
                        </div>

                        {/* Dropdown Items */}
                        <div className="p-1 space-y-0.5 text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setProfileModalTab('PROFILE');
                              setIsProfileModalOpen(true);
                            }}
                            className="w-full px-3 py-2 text-left rounded-xl hover:bg-orange-50 hover:text-orange-900 flex items-center gap-2.5 transition cursor-pointer"
                          >
                            <User className="w-4 h-4 text-orange-600" />
                            <span>แก้ไขโปรไฟล์อาจารย์</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setProfileModalTab('PASSWORD');
                              setIsProfileModalOpen(true);
                            }}
                            className="w-full px-3 py-2 text-left rounded-xl hover:bg-orange-50 hover:text-orange-900 flex items-center gap-2.5 transition cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4 text-amber-600" />
                            <span>รีเซ็ตรหัสผ่านใหม่</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setProfileModalTab('HISTORY');
                              setIsProfileModalOpen(true);
                            }}
                            className="w-full px-3 py-2 text-left rounded-xl hover:bg-orange-50 hover:text-orange-900 flex items-center gap-2.5 transition cursor-pointer"
                          >
                            <History className="w-4 h-4 text-indigo-600" />
                            <span>ประวัติการเข้าใช้งาน</span>
                          </button>
                        </div>

                        <div className="border-t border-slate-100 my-1" />

                        {/* Logout Option */}
                        <div className="p-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              handleLogout();
                            }}
                            className="w-full px-3 py-2 text-left rounded-xl text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition font-bold text-xs cursor-pointer"
                          >
                            <LogOut className="w-4 h-4 text-rose-500" />
                            <span>ออกจากระบบ</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบอาจารย์</span>
              </Link>
            )}

            {/* Portal Switch Button */}
            {isAdminRoute ? (
              <Link
                href="/"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 transition"
              >
                <GraduationCap className="w-4 h-4 text-orange-400" />
                <span>หน้าบ้าน</span>
              </Link>
            ) : isAdmin ? (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md transition"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>หลังบ้าน</span>
              </Link>
            ) : currentUser ? (
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
              className={`lg:hidden p-2 rounded-xl transition cursor-pointer border ${
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

      {/* Mobile & Tablet Drawer Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-Down or Drawer Container */}
          <div className={`fixed inset-x-0 top-16 z-50 lg:hidden border-b shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-3 duration-200 ${
            isAdminRoute ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto">
              {/* User summary card in drawer */}
              {currentUser ? (
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  isAdminRoute ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-orange-50/70 border-orange-200 text-orange-950'
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs truncate">{currentUser.name}</div>
                      <div className="text-[10px] opacity-70 truncate">{currentUser.email || currentUser.role}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-800 shadow-xs border border-slate-200 shrink-0"
                  >
                    โปรไฟล์
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-md transition"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>เข้าสู่ระบบอาจารย์ / เจ้าหน้าที่</span>
                </Link>
              )}

              {/* Quick Portal Switcher Pills in Drawer */}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                    !isAdminRoute ? 'bg-orange-500 text-white border-orange-600' : 'bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>หน้านิสิต (หน้าบ้าน)</span>
                </Link>

                {isAdmin ? (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                      isAdminRoute && pathname.startsWith('/admin') ? 'bg-purple-600 text-white border-purple-700' : 'bg-slate-800 text-slate-200 border-slate-700'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>ระบบ Admin</span>
                  </Link>
                ) : currentUser ? (
                  <Link
                    href="/attendance"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                      pathname === '/attendance' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-800 text-slate-200 border-slate-700'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>บันทึกเวลาเรียน</span>
                  </Link>
                ) : null}
              </div>

              {/* Navigation Links list */}
              <div className="space-y-1">
                <div className="text-[11px] font-extrabold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  เมนูหลัก (Navigation)
                </div>
                {(isAdminRoute ? adminNavItems : publicNavItems).map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition min-h-[44px] ${
                        isAdminRoute
                          ? isActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                          : isActive
                            ? 'bg-orange-100 text-orange-900 shadow-xs'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? (isAdminRoute ? 'text-white' : 'text-orange-600') : 'opacity-70'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Language Selector in Drawer */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="text-[11px] font-extrabold text-slate-400 px-2 uppercase tracking-wider">
                  แปลภาษา (Languages)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { code: 'th', flag: '🇹🇭', label: 'ไทย (Thai)' },
                    { code: 'en', flag: '🇬🇧', label: 'English' },
                    { code: 'my', flag: '🇲🇲', label: 'မြန်မာ (Burmese)' },
                    { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
                    { code: 'km', flag: '🇰🇭', label: 'ភាសាខ្มែរ' },
                    { code: 'zh-CN', flag: '🇨🇳', label: '中文' },
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        handleSelectLanguage(item.code);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition text-left cursor-pointer min-h-[40px] ${
                        selectedLanguageCode === item.code
                          ? 'bg-orange-500 text-white border-orange-600'
                          : isAdminRoute
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <span>{item.flag}</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Logout button if logged in */}
              {currentUser && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition min-h-[44px] cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* User Profile & Password Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        initialTab={profileModalTab}
        onUserUpdated={(updated) => setCurrentUser(updated)}
      />

      {/* Session Conflict Modal (Terminated by New Device Login) */}
      {sessionConflictInfo.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-900">
                เซสชันสิ้นสุดลง: มีการเข้าสู่ระบบจากเครื่องอื่น
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {sessionConflictInfo.message || 'บัญชีนี้ได้รับการเข้าสู่ระบบจากอุปกรณ์อื่นล่าสุด ระบบได้ทำการออกจากระบบเครื่องนี้โดยอัตโนมัติเพื่อความปลอดภัย'}
              </p>
              {sessionConflictInfo.activeDevice && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-mono font-bold border border-slate-200">
                  <span>อุปกรณ์ล่าสุด: {sessionConflictInfo.activeDevice}</span>
                </div>
              )}
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/login';
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                เข้าสู่ระบบใหม่อีกครั้ง
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
