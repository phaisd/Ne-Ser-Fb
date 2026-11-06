'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Mail,
  ShieldCheck,
  UserCheck,
  Phone,
  HelpCircle,
} from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tokenFromUrl = searchParams.get('token') || '';

  const [tokenOrOtp, setTokenOrOtp] = useState(tokenFromUrl);
  const [userName, setUserName] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [tokenVerified, setTokenVerified] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Auto-verify token if present in URL
  useEffect(() => {
    if (tokenFromUrl) {
      verifyToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const verifyToken = async (key: string) => {
    if (!key.trim()) {
      setVerifyError('กรุณากรอกรหัสยืนยัน OTP หรือใช้ลิงก์จากอีเมล');
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-reset-token',
          token: key.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ลิงก์หรือรหัสยืนยันไม่ถูกต้องหรือหมดอายุ');
      }
      setUserName(data.name || 'ผู้ใช้งาน');
      setMaskedEmail(data.maskedPrimaryEmail || data.maskedBackupEmail || '');
      setTokenVerified(true);
    } catch (err: any) {
      setVerifyError(err.message || 'ไม่สามารถตรวจสอบรหัสยืนยันได้');
      setTokenVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyToken(tokenOrOtp);
  };

  const handleSubmitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (newPassword.length < 6) {
      setSubmitError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSubmitError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete-password-reset',
          tokenOrOtp: tokenOrOtp.trim(),
          newPassword: newPassword.trim(),
          confirmPassword: confirmPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ไม่สามารถตั้งรหัสผ่านใหม่ได้');
      }

      setSubmitSuccess(data.message || 'ตั้งรหัสผ่านใหม่สำเร็จเรียบร้อยแล้ว');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setSubmitError(err.message || 'เกิดข้อผิดพลาดในการตั้งรหัสผ่าน');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ตั้งรหัสผ่านใหม่ (Reset Password)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            ระบบบริการนิสิตและวิชาการ คณะพุทธศาสตร์ มจร
          </p>
        </div>

        {/* Card Container */}
        <div className="mt-8 bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8">
          {/* Success State */}
          {submitSuccess ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">
                  ตั้งรหัสผ่านใหม่สำเร็จ!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {submitSuccess}
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                กำลังนำท่านไปยังหน้าเข้าสู่ระบบอัตโนมัติภายใน 3 วินาที...
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-sm"
              >
                เข้าสู่ระบบทันที
              </Link>
            </div>
          ) : verifying ? (
            /* Verifying Spinner */
            <div className="text-center py-12 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
              <p className="text-xs font-bold text-slate-600">
                กำลังตรวจสอบความถูกต้องของลิงก์และรหัสยืนยัน...
              </p>
            </div>
          ) : !tokenVerified ? (
            /* Input OTP if no valid token in URL */
            <div className="space-y-5">
              {verifyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">ตรวจสอบไม่ผ่าน</div>
                    <div>{verifyError}</div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">
                  กรอกรหัสยืนยัน (OTP 6 หลัก)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  หากท่านเปิดอีเมลแล้วได้รับรหัสยืนยัน 6 หลัก กรุณานำมากรอกที่ช่องด้านล่างนี้เพื่อดำเนินการต่อ
                </p>
              </div>

              <form onSubmit={handleManualVerify} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    รหัสยืนยัน OTP 6 หลัก หรือโทเค็นรีเซ็ต
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 123456"
                    value={tokenOrOtp}
                    onChange={(e) => setTokenOrOtp(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-center text-lg font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying || !tokenOrOtp.trim()}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>ยืนยันรหัส OTP</span>
                </button>
              </form>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>กลับไปยังหน้าเข้าสู่ระบบ</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Set New Password Form */
            <form onSubmit={handleSubmitNewPassword} className="space-y-5">
              {/* User Identity Header */}
              <div className="p-3.5 bg-orange-50/80 border border-orange-200/80 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] text-orange-700 font-semibold">
                    ยืนยันตัวตนสำเร็จสำหรับ:
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {userName}
                  </div>
                  {maskedEmail && (
                    <div className="text-[10px] text-slate-500 truncate">
                      อีเมล: {maskedEmail}
                    </div>
                  )}
                </div>
              </div>

              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{submitError}</div>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  รหัสผ่านใหม่ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  ยืนยันรหัสผ่านใหม่อีกครั้ง <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="พิมพ์รหัสผ่านใหม่อีกครั้งให้ตรงกัน"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>{submitting ? 'กำลังบันทึกรหัสผ่านใหม่...' : 'บันทึกรหัสผ่านใหม่'}</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ยกเลิกและกลับหน้าเข้าสู่ระบบ</span>
                </Link>
              </div>
            </form>
          )}

          {/* Admin Support Box (จุดที่ 3 ที่ผู้ใช้เห็นชอบอย่างยิ่ง) */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <HelpCircle className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="text-xs font-bold">ติดต่อผู้ดูแลระบบ (Admin Support)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                กรณีไม่ได้รับอีเมล, ลืมอีเมลสำรอง, หรือต้องการความช่วยเหลือด่วน สามารถติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่านได้โดยตรง:
              </p>
              <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                <div className="space-y-0.5 text-slate-600">
                  <div className="font-semibold text-slate-800">
                    พระมหาไพศาล ดิษฐพันธ์
                  </div>
                  <div>อีเมล: phaisal.dis@mcu.ac.th</div>
                </div>
                <a
                  href="mailto:phaisal.dis@mcu.ac.th?subject=ขอรีเซ็ตรหัสผ่านอาจารย์ผู้สอน"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-800 font-bold hover:bg-orange-200 transition shrink-0"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>ส่งเมลหา Admin</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
