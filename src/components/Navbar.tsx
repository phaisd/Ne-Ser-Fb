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
  ChevronDown
} from 'lucide-react';
import { translations, Language } from '@/lib/translations';
import { getAuthUser, isAdminOrOfficer, clearAuthSession } from '@/lib/auth-client';

export default function Navbar() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin') || pathname === '/attendance' || pathname === '/settings';

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [lang, setLang] = useState<Language>('th');
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>('th');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
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
    { href: '/admin', label: t.navAdmin, icon: ShieldCheck },
    ...(settings?.showCoursesMenu !== false ? [{ href: '/courses', label: t.navCourses, icon: BookOpen }] : []),
    { href: '/attendance', label: t.navAttendance, icon: CheckSquare },
    ...(settings?.showEventsMenu === true ? [{ href: '/events', label: 'กิจกรรมนิสิต', icon: Award }] : []),
    ...(settings?.showStudentsSearch !== false ? [{ href: '/students', label: t.navStudents, icon: Users }] : []),
    { href: '/settings', label: t.navSettings, icon: Table2 },
  ];

  return (
    <header className={`sticky top-0 z-50 backdrop-blur border-b shadow-sm transition-colors duration-200 print:hidden theme-nav-accent ${
      isAdminRoute ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <Link href={isAdminRoute ? '/admin' : '/'} className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
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

                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
                  isAdminRoute ? 'bg-slate-800 text-emerald-300 border border-slate-700' : 'bg-orange-50 text-orange-900 border border-orange-200'
                }`}>
                  <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="hidden sm:inline truncate max-w-[140px]">{currentUser.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="ออกจากระบบ"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
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
            ) : (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md transition"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>หลังบ้าน</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
