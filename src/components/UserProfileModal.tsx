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
  KeyRound
} from 'lucide-react';
import { AuthUser, saveAuthSession, isAdminOrOfficer } from '@/lib/auth-client';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onUserUpdated?: (updatedUser: AuthUser) => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'PASSWORD'>('PROFILE');

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

  if (!isOpen || !currentUser) return null;

  const isAdmin = isAdminOrOfficer(currentUser);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล');
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
        gmail: gmail.trim().toLowerCase(),
        department: department.trim(),
      };

      saveAuthSession(updated, true);
      if (onUserUpdated) onUserUpdated(updated);

      setSuccessMsg('บันทึกข้อมูลส่วนตัวสำเร็จเรียบร้อยแล้ว');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Banner */}
        <div className={`p-6 border-b ${
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
                <h3 className="text-base font-bold text-white mt-1 truncate max-w-[260px]">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-white/70 font-mono truncate max-w-[260px]">
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

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-5 bg-black/20 p-1 rounded-2xl">
            <button
              onClick={() => {
                setActiveTab('PROFILE');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'PROFILE'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>ข้อมูลโปรไฟล์อาจารย์</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('PASSWORD');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'PASSWORD'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>เปลี่ยนรหัสผ่านส่วนตัว</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* Notifications */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
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
                    placeholder="เช่น พระมหาไพศาล ดิษฐพันธ์"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
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
                    placeholder="เช่น Phramaha Phaisal Ditthaphan"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>อีเมลสถาบัน มจร (MCU Account)</span>
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    บัญชีหลักของระบบ
                  </span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    readOnly
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  * อีเมลหลักของมหาวิทยาลัยใช้ผูกกับตารางสอน หากต้องการเปลี่ยนโปรดติดต่อสำนักงานคณะ
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
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  ใช้สำหรับการลงชื่อเข้าใช้งานด้วย 1-Click Google Sign-In หรือรับแจ้งเตือน
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
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  ยกเลิก
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
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
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
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
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
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
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
                  ยกเลิก
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
        </div>
      </div>
    </div>
  );
}
