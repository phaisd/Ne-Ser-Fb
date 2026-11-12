'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  type AuthUser,
  getAuthUser,
  saveAuthSession,
} from '@/lib/auth-client';
import type { SystemSettings } from '@/types';
import { getErrorMessage } from '@/lib/utils/error';
import {
  ForcePasswordChangeModal,
  ForgotPasswordModal,
  GoogleAccountChooserModal,
} from '@/components/login/LoginModals';
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  School,
} from 'lucide-react';

interface GoogleButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
}

interface GoogleAccountsApi {
  accounts?: {
    id?: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential?: string }) => Promise<void> | void;
        auto_select?: boolean;
      }) => void;
      prompt: () => void;
      renderButton?: (parent: HTMLElement, options: GoogleButtonOptions) => void;
    };
  };
}

interface GoogleIdentityWindow {
  google?: GoogleAccountsApi;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/workload';
  const reason = searchParams.get('reason');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPersonalDevice, setIsPersonalDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<Partial<SystemSettings> | null>(null);

  // Active session in another tab (only valid if NOT logged out)
  const [activeBrowserUser, setActiveBrowserUser] = useState<AuthUser | null>(null);
  const [gisButtonReady, setGisButtonReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const isPersonalDeviceRef = useRef(isPersonalDevice);
  useEffect(() => {
    isPersonalDeviceRef.current = isPersonalDevice;
  }, [isPersonalDevice]);

  // Google Login Modal State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [customGmail, setCustomGmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');

  // Force Password Change Modal State (First-time Login)
  const [isForcePasswordModalOpen, setIsForcePasswordModalOpen] = useState(false);
  const [pendingChangeUser, setPendingChangeUser] = useState<AuthUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Forgot Password Modal State
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotTargetName, setForgotTargetName] = useState('');
  const [forgotMaskedPrimaryEmail, setForgotMaskedPrimaryEmail] = useState('');
  const [forgotMaskedBackupEmail, setForgotMaskedBackupEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPass, setShowForgotNewPass] = useState(false);
  const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const navigateAfterAuth = (user: AuthUser) => {
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'OFFICER') {
      router.push('/admin');
    } else if (user.role === 'STUDENT') {
      router.push('/certificates');
    } else {
      router.push(redirectUrl);
    }
  };

  useEffect(() => {
    fetch('/api/system-settings')
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.data) {
          setSettings(d.data);
        }
      })
      .catch(() => {});

    // Check if already logged in on another tab of this browser (active session only)
    const current = getAuthUser();
    if (current && current.email) {
      setActiveBrowserUser(current);
    } else {
      fetch('/api/auth')
        .then((r) => r.json())
        .then((d) => {
          if (d.authenticated && d.user) {
            setActiveBrowserUser(d.user);
            saveAuthSession(d.user, true);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Load & initialize Google Identity Services (One-Tap + official Google Sign-In button)
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || settings?.googleClientId;
    if (!clientId || typeof window === 'undefined' || activeBrowserUser) return;

    const initGoogleIdentity = () => {
      const g = (window as unknown as GoogleIdentityWindow).google;
      if (!g?.accounts?.id) return;

      g.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential?: string }) => {
          if (response?.credential) {
            const rememberMe = isPersonalDeviceRef.current;
            setLoading(true);
            setError(null);
            try {
              const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  provider: 'google',
                  credential: response.credential,
                  rememberMe,
                }),
              });
              const data = await res.json();
              if (data.success && data.user) {
                saveAuthSession(data.user, rememberMe);
                setSuccess(`เข้าสู่ระบบด้วย Google สำเร็จ: ยินดีต้อนรับ ${data.user.name}`);
                setTimeout(() => navigateAfterAuth(data.user), 600);
              } else {
                setError(data.error || 'ไม่พบบัญชีที่เชื่อมโยงกับอีเมล Google นี้');
              }
            } catch (err: unknown) {
              setError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + getErrorMessage(err));
            } finally {
              setLoading(false);
            }
          }
        },
        auto_select: true,
      });

      const container = googleButtonRef.current;
      if (container && g.accounts.id.renderButton) {
        container.innerHTML = '';
        const buttonWidth = Math.min(Math.max(container.offsetWidth || 340, 240), 400);
        g.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          width: buttonWidth,
          locale: 'th',
        });
        setGisButtonReady(true);
      }

      g.accounts.id.prompt();
    };

    const existingScript = document.getElementById('google-gsi-client-script');
    if (existingScript) {
      initGoogleIdentity();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogleIdentity;
    document.body.appendChild(script);
  }, [settings?.googleClientId, activeBrowserUser]);

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
        if (data.mustChangePassword) {
          setPendingChangeUser(data.user);
          setIsForcePasswordModalOpen(true);
          setLoading(false);
          return;
        }

        saveAuthSession(data.user, isPersonalDevice);
        setSuccess(`เข้าสู่ระบบสำเร็จ: ยินดีต้อนรับ ${data.user.name}`);
        setTimeout(() => navigateAfterAuth(data.user), 800);
      } else {
        setError(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: unknown) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForceChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError(null);

    if (!newPassword || newPassword.length < 6) {
      setChangePasswordError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword === 'mcu123456') {
      setChangePasswordError('ไม่สามารถใช้รหัสผ่านเริ่มต้นของระบบได้ กรุณาตั้งรหัสผ่านใหม่ที่มีความปลอดภัย');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password-first-login',
          identifier:
            pendingChangeUser?.studentCode ||
            pendingChangeUser?.id ||
            pendingChangeUser?.email ||
            email,
          role: pendingChangeUser?.role,
          newPassword,
          confirmPassword,
          rememberMe: isPersonalDevice,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        saveAuthSession(data.user, isPersonalDevice);
        setIsForcePasswordModalOpen(false);
        setSuccess(`เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย! กำลังนำท่านเข้าสู่ระบบ...`);
        setTimeout(() => navigateAfterAuth(data.user), 800);
      } else {
        setChangePasswordError(data.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err: unknown) {
      setChangePasswordError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + getErrorMessage(err));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleGoogleLogin = async (gmailToLogin: string, passInput?: string) => {
    const cleanEmail = gmailToLogin.trim();
    if (!cleanEmail) return;
    if (!passInput || !passInput.trim()) {
      setError('กรุณากรอกรหัสผ่านเพื่อยืนยันตัวตน (ไม่อนุญาตให้เข้าด้วยอีเมลอย่างเดียว)');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const payload = { email: cleanEmail, password: passInput, rememberMe: isPersonalDevice };

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        if (data.mustChangePassword && passInput) {
          setPendingChangeUser(data.user);
          setIsForcePasswordModalOpen(true);
          setIsGoogleModalOpen(false);
          setLoading(false);
          return;
        }
        saveAuthSession(data.user, isPersonalDevice);
        setSuccess(`เข้าสู่ระบบด้วย Gmail สำเร็จ: ยินดีต้อนรับ ${data.user.name}`);
        setTimeout(() => navigateAfterAuth(data.user), 600);
        setIsGoogleModalOpen(false);
      } else {
        setError(data.error || 'ไม่พบบัญชีที่เชื่อมโยงกับอีเมล Gmail นี้');
      }
    } catch (err: unknown) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotIdentifier.trim()) {
      setForgotError('กรุณากรอกอีเมลสถาบัน (@mcu.ac.th), บัญชีอาจารย์, หรือรหัสนิสิต');
      return;
    }

    try {
      setForgotLoading(true);
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request-password-reset',
          identifier: forgotIdentifier.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ไม่พบบัญชีผู้ใช้ในระบบ หรือไม่สามารถส่งอีเมลได้');
      }

      setForgotTargetName(data.name || '');
      setForgotMaskedPrimaryEmail(data.maskedPrimaryEmail || '');
      setForgotMaskedBackupEmail(data.maskedBackupEmail || '');
      setForgotStep('VERIFY');
      setForgotSuccess('ระบบได้ส่งรหัสยืนยัน OTP และลิงก์ไปยังอีเมลจริงของท่านแล้ว กรุณาเปิดกล่องจดหมายในอีเมล');
    } catch (err: unknown) {
      setForgotError(getErrorMessage(err) || 'เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCompletePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotOtp.trim()) {
      setForgotError('กรุณากรอกรหัสยืนยัน OTP 6 หลักที่ได้รับจากอีเมล');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      setForgotLoading(true);
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete-password-reset',
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword.trim(),
          confirmPassword: forgotConfirmPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุ');
      }

      setForgotSuccess(data.message || 'รีเซ็ตรหัสผ่านใหม่สำเร็จเรียบร้อยแล้ว');
      setEmail(forgotIdentifier);
      setPassword(forgotNewPassword);

      setTimeout(() => {
        setIsForgotPasswordModalOpen(false);
        setForgotStep('REQUEST');
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setSuccess('รีเซ็ตรหัสผ่านใหม่สำเร็จแล้ว ท่านสามารถกดปุ่ม "เข้าสู่ระบบ" ได้ทันที');
      }, 2500);
    } catch (err: unknown) {
      setForgotError(getErrorMessage(err) || 'เกิดข้อผิดพลาดในการบันทึกรหัสผ่านใหม่');
    } finally {
      setForgotLoading(false);
    }
  };

  const getRoleBadgeText = (role?: string) => {
    if (role === 'SUPER_ADMIN') return 'ผู้ดูแลระบบสูงสุด';
    if (role === 'ADMIN') return 'ผู้ดูแลระบบ';
    if (role === 'OFFICER') return 'เจ้าหน้าที่';
    if (role === 'STUDENT') return 'นิสิต';
    return 'อาจารย์ผู้สอน';
  };

  return (
    <div className="max-w-md w-full mx-auto space-y-6 my-4">
      {/* Back to Home Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-purple-700 text-xs font-bold border border-slate-200/90 shadow-xs transition group cursor-pointer"
          title="กลับไปยังหน้าแรกระบบบริการการศึกษา"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition text-slate-500 group-hover:text-purple-600" />
          <span>← กลับสู่หน้าหลัก (Back to Home)</span>
        </Link>
        <span className="text-[11px] text-slate-400 font-medium">
          ระบบบริการการศึกษา
        </span>
      </div>

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

        {/* Active Session in Another Tab: 1-Click Continue */}
        {activeBrowserUser && (
          <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ตรวจพบบัญชีที่เปิดใช้งานอยู่ในเบราว์เซอร์นี้
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                {getRoleBadgeText(activeBrowserUser.role)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigateAfterAuth(activeBrowserUser)}
              className="w-full p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-left min-w-0">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black text-sm shrink-0">
                  {(activeBrowserUser.name || activeBrowserUser.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="truncate font-bold">ดำเนินการต่อในชื่อ {activeBrowserUser.name}</div>
                  <div className="text-[10px] text-emerald-100 truncate">
                    {activeBrowserUser.gmail || activeBrowserUser.email}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0 ml-2" />
            </button>
          </div>
        )}

        {/* Standard Email/Gmail/Password Form */}
        <form onSubmit={handleLogin} autoComplete={isPersonalDevice ? 'on' : 'off'} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              อีเมลมหาวิทยาลัย (@mcu.ac.th), Gmail หรือรหัสนิสิต <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="username"
                autoComplete={isPersonalDevice ? 'username email' : 'off'}
                required
                placeholder="เช่น yourname@gmail.com, รหัสนิสิต@mcu.ac.th หรือรหัสนิสิต"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                รหัสผ่าน (Password) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotIdentifier(email || '');
                  setForgotError(null);
                  setForgotSuccess(null);
                  setForgotStep('REQUEST');
                  setForgotOtp('');
                  setIsForgotPasswordModalOpen(true);
                }}
                className="text-xs text-orange-600 hover:text-orange-700 hover:underline font-bold transition cursor-pointer"
              >
                ลืมรหัสผ่าน? (Forgot Password)
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                name="password"
                autoComplete={isPersonalDevice ? 'current-password' : 'new-password'}
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
                    ? '✓ บันทึกบัญชีไว้ในเบราว์เซอร์ 7 วัน คลิกเข้าใช้งานครั้งถัดไปได้ทันทีโดยไม่ต้องกรอกใหม่'
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

        {/* เส้นขีดกลางบางๆ คั่น (Thin Divider Line) */}
        <div className="relative flex items-center justify-center py-0.5">
          <div className="border-t border-slate-200/90 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-medium text-slate-400 shrink-0">
            หรือ
          </span>
        </div>

        {/* ปุ่มลงชื่อเข้าใช้ด้วย Google / Gmail (อยู่ด้านล่างปุ่มเข้าสู่ระบบ) */}
        <div className="space-y-2">
          {!activeBrowserUser && (
            <div
              ref={googleButtonRef}
              className={gisButtonReady ? 'w-full flex justify-center min-h-[44px]' : 'hidden'}
            />
          )}
          {(activeBrowserUser || !gisButtonReady) && (
            <button
              type="button"
              onClick={() => {
                // 1. If already signed in on this browser (active session not logged out), continue immediately
                if (activeBrowserUser && (activeBrowserUser.gmail || activeBrowserUser.email)) {
                  navigateAfterAuth(activeBrowserUser);
                  return;
                }
                // 2. If Google Identity Services (One-Tap) is initialized, trigger real OAuth token prompt
                const g = typeof window !== 'undefined' ? (window as unknown as GoogleIdentityWindow).google : null;
                if (g?.accounts?.id && (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || settings?.googleClientId)) {
                  g.accounts.id.prompt();
                  return;
                }
                // 3. Otherwise open the password-required verification modal (with autofill disabled)
                setCustomGmail('');
                setGooglePassword('');
                setIsGoogleModalOpen(true);
              }}
              disabled={loading}
              className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-300 hover:border-blue-400 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>
                {activeBrowserUser
                  ? `เข้าสู่ระบบต่อในชื่อ ${activeBrowserUser.name}`
                  : 'ลงชื่อเข้าใช้ด้วย Google / Gmail'}
              </span>
            </button>
          )}
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

      <GoogleAccountChooserModal
        open={isGoogleModalOpen}
        customGmail={customGmail}
        googlePassword={googlePassword}
        loading={loading}
        onChangeGmail={setCustomGmail}
        onChangePassword={setGooglePassword}
        onClose={() => {
          setCustomGmail('');
          setGooglePassword('');
          setIsGoogleModalOpen(false);
        }}
        onSubmit={handleGoogleLogin}
      />

      <ForgotPasswordModal
        open={isForgotPasswordModalOpen}
        step={forgotStep}
        identifier={forgotIdentifier}
        otp={forgotOtp}
        targetName={forgotTargetName}
        maskedPrimaryEmail={forgotMaskedPrimaryEmail}
        maskedBackupEmail={forgotMaskedBackupEmail}
        newPassword={forgotNewPassword}
        confirmPassword={forgotConfirmPassword}
        showNewPass={showForgotNewPass}
        showConfirmPass={showForgotConfirmPass}
        loading={forgotLoading}
        error={forgotError}
        success={forgotSuccess}
        onChangeIdentifier={setForgotIdentifier}
        onChangeOtp={setForgotOtp}
        onChangeNewPassword={setForgotNewPassword}
        onChangeConfirmPassword={setForgotConfirmPassword}
        onToggleShowNewPass={() => setShowForgotNewPass(!showForgotNewPass)}
        onToggleShowConfirmPass={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
        onBackToRequest={() => {
          setForgotStep('REQUEST');
          setForgotOtp('');
          setForgotError(null);
        }}
        onClose={() => setIsForgotPasswordModalOpen(false)}
        onSubmitRequest={handleRequestPasswordReset}
        onSubmitComplete={handleCompletePasswordReset}
      />

      <ForcePasswordChangeModal
        open={isForcePasswordModalOpen}
        pendingUser={pendingChangeUser}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        error={changePasswordError}
        submitting={changingPassword}
        onChangeNewPassword={setNewPassword}
        onChangeConfirmPassword={setConfirmPassword}
        onClose={() => setIsForcePasswordModalOpen(false)}
        onSubmit={handleForceChangePasswordSubmit}
      />
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
