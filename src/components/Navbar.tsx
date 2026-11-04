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
  Globe
} from 'lucide-react';
import { translations, Language } from '@/lib/translations';

export default function Navbar() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin') || pathname === '/attendance' || pathname === '/settings';

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [lang, setLang] = useState<Language>('th');

  useEffect(() => {
    try {
      const savedLang = (localStorage.getItem('mcu_lang') as Language) || 'th';
      setLang(savedLang);
    } catch (e) {}
  }, []);

  const toggleLanguage = () => {
    const nextLang: Language = lang === 'th' ? 'en' : 'th';
    setLang(nextLang);
    try {
      localStorage.setItem('mcu_lang', nextLang);
      window.dispatchEvent(new CustomEvent('mcu_lang_changed', { detail: nextLang }));
    } catch (e) {}
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
      const stored = localStorage.getItem('mcu_current_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        // Also check server session
        fetch('/api/auth')
          .then((r) => r.json())
          .then((d) => {
            if (d.authenticated && d.user) {
              setCurrentUser(d.user);
              localStorage.setItem('mcu_current_user', JSON.stringify(d.user));
            }
          })
          .catch(() => {});
      }
    } catch (e) {}
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (e) {}
    localStorage.removeItem('mcu_current_user');
    window.dispatchEvent(new Event('mcu_user_logged_out'));
    setCurrentUser(null);
    window.location.href = '/';
  };

  const publicNavItems = [
    { href: '/', label: t.navHome, icon: LayoutDashboard },
    { href: '/certificates', label: t.navCertificates, icon: FileText },
    { href: '/courses', label: t.navCourses, icon: BookOpen },
    { href: '/students', label: t.navStudents, icon: Users },
  ];

  const adminNavItems = [
    { href: '/admin', label: t.navAdmin, icon: ShieldCheck },
    { href: '/courses', label: t.navCourses, icon: BookOpen },
    { href: '/attendance', label: t.navAttendance, icon: CheckSquare },
    { href: '/students', label: t.navStudents, icon: Users },
    { href: '/settings', label: t.navSettings, icon: Table2 },
  ];

  return (
    <header className={`sticky top-0 z-50 backdrop-blur border-b shadow-sm transition-colors duration-200 ${
      isAdminRoute ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <Link href={isAdminRoute ? '/admin' : '/'} className="flex items-center gap-3 group">
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
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-base sm:text-lg leading-tight ${isAdminRoute ? 'text-white' : 'text-slate-900'}`}>
                  {isAdminRoute ? 'Admin Console' : (settings?.facultyNameTh || 'คณะพุทธศาสตร์')}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  isAdminRoute ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-orange-100 text-orange-700'
                }`}>
                  {isAdminRoute ? 'หลังบ้าน (อาจารย์/เจ้าหน้าที่)' : 'ระบบบริการการศึกษา'}
                </span>
              </div>
              <span className={`text-xs block ${isAdminRoute ? 'text-slate-400' : 'text-orange-600 font-medium'}`}>
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
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isAdminRoute
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title="สลับภาษา (Switch Language TH/EN)"
            >
              <Globe className="w-3.5 h-3.5 text-orange-500" />
              <span>{lang === 'th' ? '🇹🇭 TH' : '🇬🇧 EN'}</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
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
