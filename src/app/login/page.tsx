'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { saveAuthSession } from '@/lib/auth-client';
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User,
  School,
  KeyRound,
  X,
  Check
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/attendance';
  const reason = searchParams.get('reason');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPersonalDevice, setIsPersonalDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch('/api/system-settings')
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.data) {
          setSettings(d.data);
        }
      })
      .catch(() => {});
  }, []);

  // Google Login Modal State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [customGmail, setCustomGmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe: isPersonalDevice }),
      });

      const data = await res.json();
      if (data.success) {
        saveAuthSession(data.user, isPersonalDevice);
        setSuccess(`เข้าสู่ระบบสำเร็จ: ยินดีต้อนรับ ${data.user.name}`);
        setTimeout(() => {
          if (data.user.role === 'SUPER_ADMIN' || data.user.role === 'ADMIN') {
            router.push('/admin');
          } else if (data.user.role === 'STUDENT') {
            router.push('/certificates');
          } else {
            router.push(redirectUrl);
          }
        }, 800);
      } else {
        setError(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (gmailToLogin: string) => {
    if (!gmailToLogin.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google', gmail: gmailToLogin.trim(), rememberMe: isPersonalDevice }),
      });

      const data = await res.json();
      if (data.success) {
        saveAuthSession(data.user, isPersonalDevice);
        setSuccess(`เข้าสู่ระบบด้วย Google สำเร็จ: ยินดีต้อนรับ ${data.user.name}`);
        setTimeout(() => {
          if (data.user.role === 'SUPER_ADMIN' || data.user.role === 'ADMIN') {
            router.push('/admin');
          } else if (data.user.role === 'STUDENT') {
            router.push('/certificates');
          } else {
            router.push(redirectUrl);
          }
        }, 800);
      } else {
        setError(data.error || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
      }
    } catch (err: any) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    } finally {
      setLoading(false);
      setIsGoogleModalOpen(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        {settings?.logoUrl ? (
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/90 shadow-md flex items-center justify-center p-1.5 mx-auto overflow-hidden">
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/25 text-2xl">
            {settings?.logoEmoji || <GraduationCap className="w-9 h-9" />}
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider">
          <School className="w-4 h-4" />
          <span>{settings?.universityNameTh || 'มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย'}</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {settings?.facultyNameTh || 'คณะพุทธศาสตร์'}
        </h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          ระบบบริการนิสิตและวิชาการ (MCU Academic & Student Portal)
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-5">
        {reason === 'inactivity' && !error && !success && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 text-xs flex items-start gap-3 animate-in fade-in">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold text-amber-950 text-xs">
                🔒 ออกจากระบบอัตโนมัติเพื่อความปลอดภัย (Inactivity Timeout)
              </div>
              <div className="text-[11px] text-amber-850 mt-0.5 leading-relaxed">
                เนื่องจากไม่มีการเคลื่อนไหวหรือใช้งานเกินกำหนด ระบบจึงได้ตัดการเชื่อมต่อเพื่อป้องกันไม่ให้ผู้อื่นเข้าถึงข้อมูลของท่าน (กรณีเปิดคอมพิวเตอร์ทิ้งไว้)
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <div className="font-semibold">{success}</div>
          </div>
        )}

        {/* 1-Click Google Sign In Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setIsGoogleModalOpen(true)}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>ลงชื่อเข้าใช้ด้วย Google / Gmail</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              หรือเข้าสู่ระบบด้วยรหัสผ่าน
            </span>
          </div>
        </div>

        {/* Standard Email/Password Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              อีเมลมหาวิทยาลัย (@mcu.ac.th) หรือรหัสนิสิต <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="เช่น รหัสนิสิต@mcu.ac.th, รหัสนิสิต หรืออีเมลอาจารย์"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                รหัสผ่าน (Password) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">เริ่มต้น: mcu123456 หรือรหัสนิสิต</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Remember Me / Personal Device Checkbox */}
          <div className="p-3 bg-slate-50 hover:bg-slate-100/80 transition rounded-xl border border-slate-200">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPersonalDevice}
                onChange={(e) => setIsPersonalDevice(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
              />
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>จำฉันไว้ในระบบ (Remember Me) / เครื่องส่วนตัว 7 วัน</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                    แนะนำสำหรับโน้ตบุ๊กส่วนตัว
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  {isPersonalDevice
                    ? '✓ บันทึกการเข้าสู่ระบบ 7 วัน และ ปิดระบบตัดการเชื่อมต่ออัตโนมัติ (ปิด Auto-Logout ไม่เตือน)'
                    : '🛡️ เครื่องส่วนกลาง / สาธารณะ: ปิดเบราว์เซอร์จะหลุดออกจากระบบทันที (Session Cookie) และตัดการเชื่อมต่ออัตโนมัติเมื่อไม่ใช้งาน 15 นาที'}
                </div>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>กำลังตรวจสอบข้อมูล...</span>
            ) : (
              <>
                <span>เข้าสู่ระบบ (Sign In)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-slate-800 transition font-medium"
        >
          ← กลับสู่หน้าแรกระบบบริการการศึกษา
        </Link>
      </div>

      {/* Google Account Modal */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 className="font-bold text-slate-900 text-sm">
                  ลงชื่อเข้าใช้ด้วย Google (Sign in with Google)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              กรอกบัญชี Google หรือ Gmail ของท่าน (@mcu.ac.th หรือ Gmail) เพื่อเข้าสู่ระบบ:
            </p>

            {/* Enter Custom Gmail */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="yourname@mcu.ac.th หรือ yourname@gmail.com"
                  value={customGmail}
                  onChange={(e) => setCustomGmail(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleGoogleLogin(customGmail)}
                  disabled={!customGmail.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0 shadow-sm"
                >
                  เข้าสู่ระบบ
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPersonalDevice}
                  onChange={(e) => setIsPersonalDevice(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                />
                <span>จำฉันไว้ในระบบ (Remember Me) / เครื่องส่วนตัว 7 วัน</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <Suspense fallback={<div className="text-center text-slate-400">กำลังโหลด...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
