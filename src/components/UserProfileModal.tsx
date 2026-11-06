'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Building2,
  UserCheck,
  KeyRound,
  History,
  Laptop,
  Smartphone,
  Clock,
  ShieldAlert,
  Radio
} from 'lucide-react';
import { AuthUser, saveAuthSession, isAdminOrOfficer } from '@/lib/auth-client';
import { LoginAuditRecord } from '@/types/instructor';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  initialTab?: 'PROFILE' | 'PASSWORD' | 'HISTORY';
  onUserUpdated?: (updatedUser: AuthUser) => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  initialTab,
  onUserUpdated,
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'PASSWORD' | 'HISTORY'>('PROFILE');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Profile form state
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [email, setEmail] = useState('');
  const [gmail, setGmail] = useState('');
  const [department, setDepartment] = useState('');

  // Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // History state
  const [loginHistory, setLoginHistory] = useState<LoginAuditRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Populate form when currentUser changes or modal opens
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setNameEn(currentUser.nameEn || '');
      setEmail(currentUser.email || '');
      setGmail(currentUser.gmail || '');
      setDepartment(currentUser.department || 'คณะพุทธศาสตร์ มจร');
    }
    setErrorMsg('');
    setSuccessMsg('');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, [currentUser, isOpen]);

  // Load history when tab is opened
  useEffect(() => {
    if (isOpen && activeTab === 'HISTORY' && currentUser) {
      loadLoginHistory();
    }
  }, [isOpen, activeTab, currentUser]);

  const loadLoginHistory = async () => {
    if (!currentUser) return;
    try {
      setLoadingHistory(true);
      const target = currentUser.id || currentUser.email;
      const res = await fetch(`/api/auth?action=history&userId=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setLoginHistory(data.history);
      }
    } catch (e) {
      console.warn('Failed to load login history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !currentUser) return null;

  const isAdmin = isAdminOrOfficer(currentUser);

  // Format timestamp in Thai
  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('กรุณากรอกอีเมลสถาบัน (@mcu.ac.th) ให้ถูกต้อง');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-profile',
          userId: currentUser.id || currentUser.email,
          updates: {
            id: currentUser.id || currentUser.email,
            name: name.trim(),
            nameEn: nameEn.trim(),
            email: cleanEmail,
            gmail: gmail.trim().toLowerCase(),
            department: department.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }

      // Merge updated fields into current user session
      const updated: AuthUser = {
        ...currentUser,
        name: name.trim(),
        nameEn: nameEn.trim(),
        email: cleanEmail,
        gmail: gmail.trim().toLowerCase(),
        department: department.trim(),
      };

      saveAuthSession(updated, true);
      if (onUserUpdated) onUserUpdated(updated);

      setSuccessMsg('บันทึกข้อมูลส่วนตัวและอัปเดตอีเมลสำเร็จเรียบร้อยแล้ว');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword) {
      setErrorMsg('กรุณากรอกรหัสผ่านใหม่');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          userId: currentUser.id || currentUser.email,
          email: currentUser.email,
          oldPassword: oldPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }

      setSuccessMsg('เปลี่ยนรหัสผ่านใหม่สำเร็จเรียบร้อยแล้ว กรุณาจำรหัสผ่านใหม่ของท่าน');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาตรวจสอบรหัสผ่านเดิม');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4 sm:p-6 flex justify-center items-center min-h-screen">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[88vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Banner */}
        <div className={`p-5 sm:p-6 border-b shrink-0 ${
          isAdmin
            ? 'bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white border-purple-800'
            : 'bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-inner border ${
                isAdmin
                  ? 'bg-purple-500/20 border-purple-400/30 text-purple-200'
                  : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
              }`}>
                {isAdmin ? '👑' : (currentUser.name ? currentUser.name.charAt(0) : 'อ')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    isAdmin
                      ? 'bg-purple-500/30 text-purple-200 border-purple-400/30'
                      : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/30'
                  }`}>
                    {isAdmin ? '👑 สิทธิ์ผู้ดูแลระบบ' : '🔒 อาจารย์ผู้สอนประจำวิชา'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1 truncate max-w-[280px]">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-white/70 font-mono truncate max-w-[280px]">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs (3 Tabs) */}
          <div className="flex gap-1.5 mt-5 bg-black/25 p-1 rounded-2xl">
            <button
              onClick={() => {
                setActiveTab('PROFILE');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 px-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'PROFILE'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>โปรไฟล์</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('PASSWORD');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 px-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'PASSWORD'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>เปลี่ยนรหัสผ่าน</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('HISTORY');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 px-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'HISTORY'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>ประวัติเข้าใช้งาน</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[calc(88vh-180px)]">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tab 1: Profile Form */}
          {activeTab === 'PROFILE' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล (ภาษาไทย) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="เช่น อ.ดร.ดวงดี โอฐสู"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white text-slate-900 font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล (ภาษาอังกฤษ)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="เช่น Dr. Duangdee Otsoo"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white text-slate-900 font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>อีเมลสถาบัน มจร (MCU Account) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                    ✏️ แก้ไขได้
                  </span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="เช่น duangdee.oth@mcu.ac.th"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white text-slate-900 font-mono font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-slate-400"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  * อาจารย์สามารถระบุอีเมล มจร (@mcu.ac.th) จริงของท่านได้ (ระบบจะจดจำอีเมลเดิมไว้ในฐานข้อมูลเพื่อเชื่อมโยงตารางสอนให้อัตโนมัติ)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  อีเมลสำรอง / Gmail ส่วนตัว (สำหรับรับการแจ้งเตือน)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={gmail}
                    onChange={(e) => setGmail(e.target.value)}
                    placeholder="เช่น teacher@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white text-slate-900 font-mono font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-slate-400"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  ใช้สำหรับการลงชื่อเข้าใช้งานด้วย 1-Click Google Sign-In หรือรับแจ้งเตือนรีเซ็ตรหัสผ่าน
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  สังกัด / ภาควิชา
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="เช่น คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white text-slate-900 font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  ปิด
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>บันทึกข้อมูลส่วนตัว</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Password Form */}
          {activeTab === 'PASSWORD' && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <ShieldCheck className="w-4 h-4" />
                  <span>คำแนะนำความปลอดภัย</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800/90">
                  รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร เพื่อความปลอดภัยของข้อมูลการประเมินผลและเช็คชื่อนิสิต
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสผ่านเดิม (Current Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านเดิม (ถ้ามี)"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-white text-slate-900 font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสผ่านใหม่ (New Password) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-white text-slate-900 font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ยืนยันรหัสผ่านใหม่ (Confirm Password) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้งให้ตรงกัน"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-white text-slate-900 font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  ปิด
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>เปลี่ยนรหัสผ่านใหม่</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Login History & Devices */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-4">
              {/* Single Device Policy Banner */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                  <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>ระบบป้องกันการเข้าใช้งานซ้อน (Single Active Device)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-indigo-900/80">
                  เพื่อความปลอดภัย ระบบอนุญาตให้อาจารย์เข้าใช้งานได้ **1 เครื่องล่าสุด** เท่านั้น หากท่านลืมปิดออกจากระบบที่เครื่องห้องเรียน เมื่อท่านล็อกอินจากโน้ตบุ๊กหรือมือถือ เครื่องก่อนหน้านี้จะถูกปิดออกจากระบบโดยอัตโนมัติทันที
                </p>
              </div>

              {/* History List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                  <span>ประวัติการเข้าสู่ระบบล่าสุด</span>
                  <button
                    onClick={loadLoginHistory}
                    disabled={loadingHistory}
                    className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {loadingHistory ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>รีเฟรช</span>}
                  </button>
                </div>

                {loadingHistory ? (
                  <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span>กำลังโหลดประวัติการเข้าใช้งาน...</span>
                  </div>
                ) : loginHistory.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 text-xs space-y-1">
                    <Laptop className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-medium text-slate-600">ยังไม่มีบันทึกประวัติเพิ่มเติม</p>
                    <p className="text-[11px]">การเข้าสู่ระบบครั้งต่อๆ ไปจะถูกบันทึกและแสดงที่นี่โดยอัตโนมัติ</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {loginHistory.map((item, index) => {
                      const isActive = item.status === 'ACTIVE';
                      const isSuperseded = item.status === 'SUPERSEDED';

                      return (
                        <div
                          key={item.id || index}
                          className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                            isActive
                              ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                              : isSuperseded
                              ? 'bg-rose-50/50 border-rose-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isActive
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : isSuperseded
                                ? 'bg-rose-100 text-rose-600'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {item.device?.includes('Phone') || item.device?.includes('Android') ? (
                                <Smartphone className="w-4 h-4" />
                              ) : (
                                <Laptop className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {item.device || 'อุปกรณ์ไม่ระบุ'}
                                </span>
                                {isActive && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                                    <span>เครื่องปัจจุบัน (Active)</span>
                                  </span>
                                )}
                                {isSuperseded && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                    ปิดอัตโนมัติ (มีเครื่องอื่นเข้าซ้อน)
                                  </span>
                                )}
                                {item.status === 'LOGGED_OUT' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    ออกจากระบบปกติ
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{formatDateTime(item.timestamp)}</span>
                                </span>
                                {item.ip && item.ip !== 'unknown-client' && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    • IP: {item.ip}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
