'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Google Login Modal State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [customGmail, setCustomGmail] = useState('');

  // Quick Demo Accounts
  const demoAccounts = [
    {
      label: 'อาจารย์ไพศาล (ผู้ดูแลระบบสูงสุด)',
      email: 'phaisal.dis@mcu.ac.th',
      gmail: 'phaisal.dis@gmail.com',
      password: 'mcu123456',
      badge: '👑 Super Admin',
      role: 'SUPER_ADMIN',
    },
    {
      label: 'พระมหาดวงเด่น (หลักสูตรไทย)',
      email: 'duangden@mcu.ac.th',
      gmail: 'duangden.mcu@gmail.com',
      password: 'mcu123456',
      badge: '🇹🇭 ภาคไทย',
      role: 'INSTRUCTOR',
    },
    {
      label: 'Ven. Dr. Dharma Priya (EN)',
      email: 'dharmapriya@mcu.ac.th',
      gmail: 'dharmapriya.mcu@gmail.com',
      password: 'mcu123456',
      badge: '🌐 นานาชาติ',
      role: 'INSTRUCTOR',
    },
    {
      label: 'อาจารย์ผู้สอนทั่วไป',
      email: 'teacher@mcu.ac.th',
      gmail: 'teacher.mcu@gmail.com',
      password: 'mcu123456',
      badge: '👨‍🏫 อาจารย์',
      role: 'INSTRUCTOR',
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('mcu_current_user', JSON.stringify(data.user));
        setSuccess(`เข้าสู่ระบบสำเร็จ: ยินดีต้อนรับ ${data.user.name}`);
        setTimeout(() => {
          router.push(data.user.role === 'SUPER_ADMIN' || data.user.role === 'ADMIN' ? '/admin' : redirectUrl);
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
        body: JSON.stringify({ provider: 'google', gmail: gmailToLogin.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('mcu_current_user', JSON.stringify(data.user));
        setSuccess(`เข้าสู่ระบบด้วย Google สำเร็จ: ยินดีต้อนรับ ${data.user.name}`);
        setTimeout(() => {
          router.push(data.user.role === 'SUPER_ADMIN' || data.user.role === 'ADMIN' ? '/admin' : redirectUrl);
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

  const selectDemo = (acc: (typeof demoAccounts)[0], useGmail = false) => {
    setEmail(useGmail ? acc.gmail : acc.email);
    setPassword(acc.password);
    setError(null);
  };

  return (
    <div className="max-w-md w-full mx-auto space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/25">
          <GraduationCap className="w-9 h-9" />
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-orange-600 uppercase tracking-wider">
          <School className="w-4 h-4" />
          <span>MCU Faculty & Staff Portal</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          เข้าสู่ระบบสำหรับอาจารย์และผู้ดูแล
        </h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          ลงชื่อเข้าใช้งานด้วยบัญชี <b>Gmail</b> หรืออีเมลมหาวิทยาลัย (<b>@mcu.ac.th</b>) เพื่อตรวจเช็คเวลาเรียนและจัดการระบบ
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-5">
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
              อีเมลอาจารย์ผู้สอน (Gmail หรือ @mcu.ac.th) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="เช่น phaisal.dis@mcu.ac.th หรือ user@gmail.com"
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
              <span className="text-[11px] text-slate-400">เริ่มต้น: mcu123456</span>
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

        {/* Quick Click Demo Accounts */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              บัญชีทดสอบด่วน (คลิกเพื่อเข้าสู่ระบบ):
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {demoAccounts.map((acc, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-50 hover:bg-orange-50/60 rounded-xl border border-slate-200/80 transition flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                    <span>{acc.label}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-white rounded border border-slate-200 text-purple-700 font-bold">
                      {acc.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                    {acc.email}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => selectDemo(acc, false)}
                    className="px-2 py-1 bg-white hover:bg-orange-600 hover:text-white border border-slate-200 rounded-lg font-semibold text-[11px] text-slate-700 transition cursor-pointer"
                  >
                    @mcu
                  </button>
                  <button
                    type="button"
                    onClick={() => selectDemo(acc, true)}
                    className="px-2 py-1 bg-white hover:bg-amber-600 hover:text-white border border-slate-200 rounded-lg font-semibold text-[11px] text-slate-700 transition cursor-pointer"
                  >
                    @gmail
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security / Help Note */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
          <div className="font-semibold text-slate-700 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            คำแนะนำสำหรับอาจารย์และผู้ดูแล:
          </div>
          <p>
            • สามารถเข้าสู่ระบบด้วย <b>Gmail ส่วนตัว</b> หรือ <b>อีเมล @mcu.ac.th</b> ด้วยรหัสผ่านเริ่มต้น <code>mcu123456</code>
          </p>
          <p>
            • แอดมินระดับสูงสุด: <b>phaisal.dis@mcu.ac.th</b> สามารถเข้าถึงหลังบ้าน <code>/admin</code> เพื่อจัดการสิทธิ์และระงับบัญชีผู้ใช้ได้
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-slate-800 transition font-medium"
        >
          ← กลับสู่หน้าแรกระบบบริการการศึกษา
        </Link>
      </div>

      {/* Google Account Selection Modal */}
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
              เลือกบัญชี Gmail หรือพิมพ์บัญชี Gmail จริงของท่านเพื่อเข้าสู่ระบบทันที:
            </p>

            {/* Quick Gmail Accounts */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleGoogleLogin('phaisal.dis@gmail.com')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">อาจารย์ไพศาล (Super Admin)</div>
                  <div className="text-[11px] text-slate-500 font-mono">phaisal.dis@gmail.com</div>
                </div>
                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  ผู้ดูแลสูงสุด
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleLogin('duangden.mcu@gmail.com')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">พระมหาดวงเด่น ฐิตญาโณ</div>
                  <div className="text-[11px] text-slate-500 font-mono">duangden.mcu@gmail.com</div>
                </div>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                  อาจารย์ผู้สอน
                </span>
              </button>
            </div>

            {/* Enter Custom Gmail */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                หรือกรอกบัญชี Gmail ของท่าน:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={customGmail}
                  onChange={(e) => setCustomGmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleGoogleLogin(customGmail)}
                  disabled={!customGmail.trim()}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
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
