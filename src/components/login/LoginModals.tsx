'use client';

import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { AuthUser } from '@/lib/auth-client';

interface GoogleAccountChooserModalProps {
  open: boolean;
  customGmail: string;
  googlePassword: string;
  loading: boolean;
  onChangeGmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onClose: () => void;
  onSubmit: (gmail: string, password: string) => void;
}

export function GoogleAccountChooserModal({
  open,
  customGmail,
  googlePassword,
  loading,
  onChangeGmail,
  onChangePassword,
  onClose,
  onSubmit,
}: GoogleAccountChooserModalProps) {
  if (!open) return null;

  return (
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
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                เลือกบัญชีเพื่อเข้าสู่ระบบ (Choose an account)
              </h3>
              <p className="text-[11px] text-slate-500">
                เพื่อดำเนินการต่อยัง ระบบบริการการศึกษา คณะพุทธศาสตร์ มจร
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(customGmail, googlePassword);
          }}
          className="space-y-3 pt-1"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              บัญชี Gmail หรืออีเมลมหาวิทยาลัย (@mcu.ac.th) <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="mcu_account_verify"
              autoComplete="off"
              autoFocus
              required
              placeholder="yourname@gmail.com หรือ yourname@mcu.ac.th"
              value={customGmail}
              onChange={(e) => onChangeGmail(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              รหัสผ่าน <span className="text-rose-500">*</span>{' '}
              <span className="font-normal text-slate-500">(จำเป็นต้องกรอกเพื่อยืนยันตัวตน)</span>
            </label>
            <input
              type="password"
              name="mcu_account_secret"
              autoComplete="new-password"
              required
              placeholder="•••••••• (กรุณากรอกรหัสผ่าน)"
              value={googlePassword}
              onChange={(e) => onChangePassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
          </div>

          <div className="pt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!customGmail.trim() || !googlePassword || loading}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0 shadow-sm"
            >
              {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ForgotPasswordModalProps {
  open: boolean;
  step: 'REQUEST' | 'VERIFY';
  identifier: string;
  otp: string;
  targetName: string;
  maskedPrimaryEmail: string;
  maskedBackupEmail: string;
  newPassword: string;
  confirmPassword: string;
  showNewPass: boolean;
  showConfirmPass: boolean;
  loading: boolean;
  error: string | null;
  success: string | null;
  onChangeIdentifier: (v: string) => void;
  onChangeOtp: (v: string) => void;
  onChangeNewPassword: (v: string) => void;
  onChangeConfirmPassword: (v: string) => void;
  onToggleShowNewPass: () => void;
  onToggleShowConfirmPass: () => void;
  onBackToRequest: () => void;
  onClose: () => void;
  onSubmitRequest: (e: React.FormEvent) => void;
  onSubmitComplete: (e: React.FormEvent) => void;
}

export function ForgotPasswordModal({
  open,
  step,
  identifier,
  otp,
  targetName,
  maskedPrimaryEmail,
  maskedBackupEmail,
  newPassword,
  confirmPassword,
  showNewPass,
  showConfirmPass,
  loading,
  error,
  success,
  onChangeIdentifier,
  onChangeOtp,
  onChangeNewPassword,
  onChangeConfirmPassword,
  onToggleShowNewPass,
  onToggleShowConfirmPass,
  onBackToRequest,
  onClose,
  onSubmitRequest,
  onSubmitComplete,
}: ForgotPasswordModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {step === 'REQUEST' ? 'ลืมรหัสผ่าน (Forgot Password)' : 'ยืนยันรหัสผ่านทางอีเมล (Email OTP)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                สำหรับอาจารย์และนิสิต คณะพุทธศาสตร์ มจร
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {step === 'REQUEST' && (
          <form onSubmit={onSubmitRequest} className="space-y-4">
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-[11px] text-amber-800 leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <span>🛡️ มาตรการความปลอดภัย</span>
              </div>
              <p>
                เพื่อป้องกันผู้อื่นแอบอ้างมารีเซ็ตรหัสผ่าน ระบบจะจัดส่ง<strong>ลิงก์รีเซ็ตและรหัสยืนยัน OTP</strong> ไปยังอีเมลจริงของท่านที่ผูกไว้ในระบบเท่านั้น
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                อีเมลสถาบัน (@mcu.ac.th), บัญชีอาจารย์ หรือรหัสนิสิต <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="เช่น teacher94@mcu.ac.th หรือรหัสนิสิต"
                  value={identifier}
                  onChange={(e) => onChangeIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                * ระบบจะค้นหาบัญชีและส่งอีเมลแจ้งเตือนไปยังกล่องข้อความจริงของท่าน
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                <span>ส่งลิงก์ไปยังอีเมลจริง</span>
              </button>
            </div>
          </form>
        )}

        {step === 'VERIFY' && (
          <form onSubmit={onSubmitComplete} className="space-y-3.5">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-700 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>📨 กรุณาเปิดกล่องจดหมายในอีเมลจริงของคุณ:</span>
              </div>
              <div className="text-slate-600 leading-relaxed">
                ระบบได้ส่งลิงก์และรหัสยืนยัน OTP สำหรับ <strong>{targetName}</strong> ไปยัง:
              </div>
              <div className="font-mono text-xs text-orange-700 font-bold bg-white p-2 rounded-lg border border-slate-200 space-y-0.5">
                {maskedPrimaryEmail && <div>• {maskedPrimaryEmail}</div>}
                {maskedBackupEmail && <div>• {maskedBackupEmail}</div>}
              </div>
              <div className="text-[10px] text-slate-500">
                * ท่านสามารถคลิกลิงก์ในอีเมลโดยตรง หรือนำรหัส OTP 6 หลักมากรอกด้านล่างนี้
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รหัสยืนยัน OTP 6 หลัก (จากอีเมล) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="รหัส 6 หลัก เช่น 123456"
                value={otp}
                onChange={(e) => onChangeOtp(e.target.value)}
                className="w-full px-3 py-2 text-center text-base tracking-widest font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition font-bold text-orange-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
                  value={newPassword}
                  onChange={(e) => onChangeNewPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
                <button
                  type="button"
                  onClick={onToggleShowNewPass}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ยืนยันรหัสผ่านใหม่อีกครั้ง <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  placeholder="พิมพ์รหัสผ่านใหม่อีกครั้งให้ตรงกัน"
                  value={confirmPassword}
                  onChange={(e) => onChangeConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
                <button
                  type="button"
                  onClick={onToggleShowConfirmPass}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onBackToRequest}
                className="py-2.5 px-3 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              >
                ↺ ส่งรหัสใหม่
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                <span>บันทึกรหัสผ่านใหม่</span>
              </button>
            </div>
          </form>
        )}

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] space-y-1 mt-2">
          <div className="font-bold flex items-center gap-1.5 text-slate-800">
            <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
            <span>จำอีเมลสำรองไม่ได้ หรือไม่ได้รับอีเมล?</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            อาจารย์สามารถติดต่อสำนักงานคณะพุทธศาสตร์ หรือส่งอีเมลถึงผู้ดูแลระบบสูงสุดเพื่อขอรับรหัสผ่านชั่วคราวได้โดยตรง:
          </p>
          <div className="pt-1 flex items-center justify-between">
            <a
              href="mailto:phaisal.dis@mcu.ac.th?subject=ขอความช่วยเหลือรีเซ็ตรหัสผ่านอาจารย์ผู้สอนคณะพุทธศาสตร์&body=เรียน%20ผู้ดูแลระบบสูงสุด%20(พระมหาไพศาล%20ดิษฐพันธ์)%0A%0Aกระผม/ดิฉัน%20อาจารย์ผู้สอน...%20มีความประสงค์ขอรีเซ็ตรหัสผ่านสำหรับเข้าใช้งานระบบบริการการศึกษา%20(อีเมล%20...@mcu.ac.th)%0A%0Aขอแสดงความนับถือ"
              className="inline-flex items-center gap-1 text-orange-600 hover:underline font-bold"
            >
              <span>✉️ ติดต่อผู้ดูแลระบบ: phaisal.dis@mcu.ac.th</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ForcePasswordChangeModalProps {
  open: boolean;
  pendingUser: AuthUser | null;
  newPassword: string;
  confirmPassword: string;
  error: string | null;
  submitting: boolean;
  onChangeNewPassword: (v: string) => void;
  onChangeConfirmPassword: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ForcePasswordChangeModal({
  open,
  pendingUser,
  newPassword,
  confirmPassword,
  error,
  submitting,
  onChangeNewPassword,
  onChangeConfirmPassword,
  onClose,
  onSubmit,
}: ForcePasswordChangeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200/80 space-y-4">
        <div className="flex items-center gap-3 border-b border-amber-100 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              บังคับเปลี่ยนรหัสผ่านสำหรับการเข้าใช้งานครั้งแรก
            </h3>
            <p className="text-[11px] text-amber-600 font-semibold">
              First-Time Login Security Requirement
            </p>
          </div>
        </div>

        <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/60 text-xs text-amber-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            สวัสดี, {pendingUser?.name} ({pendingUser?.role === 'STUDENT' ? 'นิสิต' : 'อาจารย์'})
          </p>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            เพื่อความปลอดภัยของข้อมูลการเรียนการสอนและเอกสารสำคัญ ระบบกำหนดให้ท่านต้องตั้งรหัสผ่านใหม่ส่วนตัวก่อนเริ่มใช้งาน
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              รหัสผ่านใหม่ (New Password) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={newPassword}
                onChange={(e) => onChangeNewPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ยืนยันรหัสผ่านใหม่อีกครั้ง (Confirm Password) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="กรอกรหัสผ่านใหม่อีกครั้งให้ตรงกัน"
                value={confirmPassword}
                onChange={(e) => onChangeConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting || !newPassword || !confirmPassword}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บันทึกและเข้าใช้งาน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
