'use client';

import React, { useState, useRef } from 'react';
import {
  Globe,
  Sparkles,
  Camera,
  Eye,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';
import { SystemSettings } from '@/types';

interface BrandHeroSectionProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export function BrandHeroSection({
  settings,
  setSettings,
}: BrandHeroSectionProps) {
  const [uploadingCapsule, setUploadingCapsule] = useState(false);
  const [isCapsuleDragOver, setIsCapsuleDragOver] = useState(false);
  const capsuleFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCapsuleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingCapsule(true);
    try {
      const formData = new FormData();
      formData.append('scope', 'branding');
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setSettings((prev) => ({ ...prev, heroCapsuleImage: data.url }));
        return;
      }
    } catch (err) {
      console.warn('Direct upload failed, fallback to data URL', err);
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        if (url) {
          setSettings((prev) => ({ ...prev, heroCapsuleImage: url }));
        }
      };
      reader.readAsDataURL(file);
    } catch {
      // ignore
    } finally {
      setUploadingCapsule(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 4.5. Portal Menu & Feature Visibility */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              การเปิด/ปิด การแสดงผลระบบและเมนูบนหน้าเว็บหลัก (Portal Menu & Feature Visibility)
            </h4>
            <p className="text-xs text-slate-500">
              ควบคุมการเปิดหรือซ่อนเมนูและระบบต่างๆ จากหน้าหลักและแถบเมนู (Navbar) สำหรับระบบที่ยังพัฒนาไม่เสร็จ หรือยังไม่พร้อมให้บริการ
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ควบคุมการแสดงผลสาธารณะ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* 1. Events */}
          <div
            className={`p-4 rounded-2xl border transition ${
              settings.showEnrollmentMenu !== false
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>🎓 ระบบรับสมัครเรียนและขึ้นทะเบียนนิสิตใหม่ออนไลน์ (/enroll)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      settings.showEnrollmentMenu !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {settings.showEnrollmentMenu !== false ? '🟢 เปิดแสดง' : '🔴 ปิดซ่อน'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  เปิดหรือซ่อนเมนู &ldquo;สมัครเรียน/นิสิตใหม่&rdquo; บนแถบเมนูหลัก แบนเนอร์ และการ์ดบริการหน้าแรก (จัดการผู้สมัครได้ที่แท็บ รับสมัครนิสิตใหม่)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.showEnrollmentMenu !== false}
                  onChange={(e) => setSettings({ ...settings, showEnrollmentMenu: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border transition ${
              settings.showEventsMenu
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>🏆 ระบบกิจกรรมและโครงการนิสิต (/events)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      settings.showEventsMenu
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {settings.showEventsMenu ? '🟢 เปิดแสดง' : '🔴 ปิดซ่อน (เตรียมระบบ)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  แสดงหรือซ่อนเมนู "กิจกรรมนิสิต" บนแถบเมนูหลัก และกล่องบริการที่หน้าแรก (แอดมินยังเข้าจัดการได้ใน /admin)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.showEventsMenu === true}
                  onChange={(e) => setSettings({ ...settings, showEventsMenu: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* 2. Courses */}
          <div
            className={`p-4 rounded-2xl border transition ${
              settings.showCoursesMenu !== false
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📚 ตารางเรียนและรายวิชา (/courses)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      settings.showCoursesMenu !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {settings.showCoursesMenu !== false ? '🟢 เปิดแสดง' : '🔴 ปิดซ่อน'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  แสดงเมนูค้นหาตารางเรียน ตารางสอน และคลังรายวิชาสำหรับนิสิตและบุคคลภายนอก
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.showCoursesMenu !== false}
                  onChange={(e) => setSettings({ ...settings, showCoursesMenu: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* 3. Students Search */}
          <div
            className={`p-4 rounded-2xl border transition ${
              settings.showStudentsSearch !== false
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>👥 ค้นหาทะเบียนนิสิต (/students)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      settings.showStudentsSearch !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {settings.showStudentsSearch !== false ? '🟢 เปิดแสดง' : '🔴 ปิดซ่อน'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ค้นหาข้อมูลทะเบียนนิสิต (ซ่อนข้อมูลละเอียด PDPA) บนแถบเมนูหลัก
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.showStudentsSearch !== false}
                  onChange={(e) => setSettings({ ...settings, showStudentsSearch: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* 4. Certificates */}
          <div
            className={`p-4 rounded-2xl border transition ${
              settings.showCertificatesMenu !== false
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📄 ยื่นคำร้องขอหนังสือรับรอง (/certificates)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      settings.showCertificatesMenu !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {settings.showCertificatesMenu !== false ? '🟢 เปิดแสดง' : '🔴 ปิดซ่อน'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ระบบการ์ดยื่นคำร้องขอหนังสือรับรอง 16 ประเภท สำหรับนิสิตไทยและต่างประเทศ
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.showCertificatesMenu !== false}
                  onChange={(e) => setSettings({ ...settings, showCertificatesMenu: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* 5. Staff Certificates Filter */}
          <div
            className={`p-4 rounded-2xl border transition ${
              settings.showStaffCertificatesInPortal === true
                ? 'bg-amber-50/50 border-amber-300'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>👔 ตัวกรอง "สำหรับอาจารย์และเจ้าหน้าที่" ในหน้าระบบหนังสือรับรอง (/certificates)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      settings.showStaffCertificatesInPortal === true
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {settings.showStaffCertificatesInPortal === true
                      ? '🟢 เปิดแสดงสาธารณะ'
                      : '🔒 ซ่อน (แสดงเฉพาะเมื่ออาจารย์/จนท. ล็อกอิน)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  เปิด/ปิดการแสดงปุ่มตัวกรอง "👔 สำหรับอาจารย์และเจ้าหน้าที่" ในหน้าเลือกหนังสือรับรองสำหรับบุคคลทั่วไป (หากปิด จะแสดงเฉพาะเมื่อผู้ใช้ล็อกอินด้วยสิทธิ์อาจารย์หรือเจ้าหน้าที่เท่านั้น)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.showStaffCertificatesInPortal === true}
                  onChange={(e) =>
                    setSettings({ ...settings, showStaffCertificatesInPortal: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>
          {/* 6. Public Overview Statistics Dashboard */}
          <div
            className={`p-4 rounded-2xl border transition ${
              settings.showPublicDashboardStats !== false
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📊 แดชบอร์ดสรุปสถิติวิชาการและบุคลากรบนหน้าแรก (Public Overview Dashboard)</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      settings.showPublicDashboardStats !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {settings.showPublicDashboardStats !== false ? '🟢 เปิดแสดงบนหน้าแรก' : '🔴 ปิดซ่อนจากหน้าแรก'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  เปิด/ปิดการแสดงบล็อกสรุปสถิตินิสิต (ภาคไทย/ภาคอังกฤษ) คณาจารย์ผู้สอน (ประจำ/พิเศษ) และรายวิชาที่เปิดสอน บนหน้าแรกของเว็บไซต์ (/)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.showPublicDashboardStats !== false}
                  onChange={(e) =>
                    setSettings({ ...settings, showPublicDashboardStats: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* 7. Footer Visitor Counter */}
          <div
            className={`p-4 rounded-2xl border transition ${
              settings.showVisitorCounter !== false
                ? 'bg-emerald-50/50 border-emerald-300'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>👥 กล่องแสดงจำนวนผู้เข้าชมเว็บไซต์ในส่วน Footer</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      settings.showVisitorCounter !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {settings.showVisitorCounter !== false ? '🟢 เปิดแสดง' : '🔴 ปิดซ่อน'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  แสดงกล่องนับจำนวนผู้เข้าชมเว็บไซต์แบบอัตโนมัติในส่วนท้ายหน้าเว็บ (Footer)
                </p>
                {settings.showVisitorCounter !== false && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-700">ยอดผู้เข้าชมปัจจุบัน:</span>
                    <input
                      type="number"
                      min={0}
                      value={settings.visitorCount ?? 1272}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          visitorCount: Math.max(0, parseInt(e.target.value || '0', 10)),
                        })
                      }
                      className="w-28 px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900"
                    />
                  </div>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.showVisitorCounter !== false}
                  onChange={(e) =>
                    setSettings({ ...settings, showVisitorCounter: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 4.8. Hero Wild Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              แบนเนอร์หน้าหลักสไตล์ MotionSites AI (Hero Wild Creative Animation)
            </h4>
            <p className="text-xs text-slate-500">
              ปรับแต่งข้อความขนาดใหญ่, แคปซูลภาพเกาะลอยน้ำ, ป้ายกำกับ, คำอธิบายย่อย, และปุ่มลิงก์บนหน้าแรก (src/app/page.tsx)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">
              {settings.heroWildEnabled !== false ? 'เปิดใช้งาน (Wild Motion)' : 'ปิดใช้งาน (Classic)'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.heroWildEnabled !== false}
                onChange={(e) =>
                  setSettings({ ...settings, heroWildEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </div>

        {settings.heroWildEnabled !== false && (
          <div className="space-y-4 pt-1 text-xs">
            {/* Words: Left & Right */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ข้อความฝั่งซ้าย (Left Word):
                </label>
                <input
                  type="text"
                  value={settings.heroLeftWord ?? 'WI'}
                  onChange={(e) => setSettings({ ...settings, heroLeftWord: e.target.value })}
                  placeholder="เช่น WI หรือ พุทธ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-black text-slate-900 tracking-wider text-base focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  ตัวอักษรขนาดใหญ่ฝั่งซ้ายของแคปซูล
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ข้อความฝั่งขวา (Right Word):
                </label>
                <input
                  type="text"
                  value={settings.heroRightWord ?? 'LD'}
                  onChange={(e) => setSettings({ ...settings, heroRightWord: e.target.value })}
                  placeholder="เช่น LD หรือ ศาสตร์"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-black text-slate-900 tracking-wider text-base focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  ตัวอักษรขนาดใหญ่ฝั่งขวาของแคปซูล
                </span>
              </div>
            </div>

            {/* Capsule Image Uploader & Live Preview */}
            <div className="p-4 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-slate-50 rounded-2xl border border-amber-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-slate-800 text-xs">
                    รูปภาพในแคปซูลเกาะลอยน้ำ (Capsule Island Image):
                  </span>
                </div>
                <span className="text-[10px] text-amber-800 font-semibold bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-200">
                  รองรับลากวางไฟล์, คลิกเลือกรูป, หรือใส่ URL
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* Left Column: Live Capsule Preview */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span>ตัวอย่างแคปซูลจริง (Live Preview)</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 py-2 select-none">
                    <span className="text-xl sm:text-2xl font-black text-slate-900">
                      {settings.heroLeftWord || 'WI'}
                    </span>
                    <div className="relative w-36 h-18 rounded-[50px] overflow-hidden shadow-md border-2 border-white bg-slate-900 group">
                      {settings.heroCapsuleImage ? (
                        <img
                          src={settings.heroCapsuleImage}
                          alt="Capsule Preview"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as any).src = '/images/wild-capsule-island.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          ไม่มีรูปภาพ
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 pointer-events-none" />
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-slate-900">
                      {settings.heroRightWord || 'LD'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        heroCapsuleImage: '/images/wild-capsule-island.jpg',
                      })
                    }
                    className="text-[10px] text-slate-500 hover:text-amber-700 font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="ใช้รูปเกาะลอยน้ำต้นฉบับ MotionSites AI"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>รีเซ็ตเป็นรูปเกาะลอยน้ำต้นฉบับ</span>
                  </button>
                </div>

                {/* Right Column: Drag-and-Drop Zone & URL Input */}
                <div className="md:col-span-7 space-y-3">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsCapsuleDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsCapsuleDragOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsCapsuleDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleCapsuleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => capsuleFileInputRef.current?.click()}
                    className={`p-4 rounded-2xl border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5 ${
                      isCapsuleDragOver
                        ? 'border-amber-500 bg-amber-100/60 scale-[1.01]'
                        : 'border-amber-300 hover:border-amber-500 bg-white hover:bg-amber-50/40'
                    }`}
                  >
                    <input
                      type="file"
                      ref={capsuleFileInputRef}
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleCapsuleFileUpload(e.target.files[0]);
                        }
                      }}
                    />

                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                      <UploadCloud className={`w-5 h-5 ${uploadingCapsule ? 'animate-bounce text-amber-600' : ''}`} />
                    </div>

                    <div className="text-xs font-bold text-slate-800">
                      {uploadingCapsule
                        ? '⏳ กำลังอัปโหลดรูปภาพเข้าสู่ระบบ...'
                        : 'ลากรูปภาพมาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์จากเครื่อง'}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      รองรับไฟล์ JPG, PNG, WEBP, GIF (บันทึกเข้าระบบอัตโนมัติ)
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px] flex items-center justify-between">
                      <span>หรือระบุที่อยู่รูปภาพ (Image URL / Google Drive):</span>
                      {settings.heroCapsuleImage && (
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, heroCapsuleImage: '' })}
                          className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                        >
                          ล้างค่า
                        </button>
                      )}
                    </label>
                    <input
                      type="text"
                      value={settings.heroCapsuleImage ?? ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          heroCapsuleImage: e.target.value,
                        })
                      }
                      placeholder="เช่น /images/wild-capsule-island.jpg หรือ URL รูปภาพ"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Badge, Thai Subtitle & English Subtitle */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    ข้อความ Badge ป้ายกำกับบนสุด:
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        heroBadgeText: 'คณะพุทธศาสตร์ • มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย',
                      })
                    }
                    className="text-[10px] text-amber-700 hover:underline font-bold cursor-pointer"
                  >
                    ใช้ชื่อคณะภาษาไทย
                  </button>
                </div>
                <input
                  type="text"
                  value={settings.heroBadgeText ?? 'Creative Designer & Faculty of Buddhism • MCU'}
                  onChange={(e) => setSettings({ ...settings, heroBadgeText: e.target.value })}
                  placeholder="Creative Designer & Faculty of Buddhism • MCU"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  หัวข้อหลักภาษาไทย (ใต้รูปแคปซูล):
                </label>
                <input
                  type="text"
                  value={settings.heroHeadingTh ?? 'ระบบบริการนิสิตและวิชาการออนไลน์ คณะพุทธศาสตร์'}
                  onChange={(e) => setSettings({ ...settings, heroHeadingTh: e.target.value })}
                  placeholder="ระบบบริการนิสิตและวิชาการออนไลน์ คณะพุทธศาสตร์"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ข้อความบรรทัดรอง (อังกฤษ / ปีการศึกษา):
                </label>
                <input
                  type="text"
                  value={
                    settings.heroSubHeadingEn ??
                    'Mahachulalongkornrajavidyalaya University • Academic Year 2569–2570'
                  }
                  onChange={(e) =>
                    setSettings({ ...settings, heroSubHeadingEn: e.target.value })
                  }
                  placeholder="Mahachulalongkornrajavidyalaya University • Academic Year 2569–2570"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Hero Background Style & Visibility Toggles */}
            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  โทนสีพื้นหลังกรอบ Hero (Hero Background Style):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'wavy-contours', label: 'ครีมอบอุ่นเส้นคลื่น (ค่าเริ่มต้น)' },
                    { id: 'gold-glow', label: 'ทองพุทธธรรมพรีเมียม' },
                    { id: 'minimal', label: 'ขาวสะอาดมินิมอล' },
                    { id: 'navy', label: 'กรมท่าวิชาการ (Dark)' },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() =>
                        setSettings({ ...settings, heroBgStyle: bg.id as any })
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        (settings.heroBgStyle || 'wavy-contours') === bg.id
                          ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">
                  การแสดงผลองค์ประกอบในกรอบ Hero:
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={settings.heroShowTopNav !== false}
                      onChange={(e) =>
                        setSettings({ ...settings, heroShowTopNav: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-amber-600"
                    />
                    <span>แถบเมนูด้านบน</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={settings.heroShowBadge !== false}
                      onChange={(e) =>
                        setSettings({ ...settings, heroShowBadge: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-amber-600"
                    />
                    <span>ป้ายกำกับ Badge</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={settings.heroShowActionButtons === true}
                      onChange={(e) =>
                        setSettings({ ...settings, heroShowActionButtons: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-amber-600"
                    />
                    <span>ปุ่มกดทางลัดด้านล่าง</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Description & Drop-cap */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  อักษรดรอปแคป (Drop Cap):
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={settings.heroDropCapLetter ?? 'E'}
                  onChange={(e) =>
                    setSettings({ ...settings, heroDropCapLetter: e.target.value })
                  }
                  placeholder="E"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-serif font-black text-center text-base focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block text-center">
                  ตัวอักษรใหญ่เปิดหัวข้อ
                </span>
              </div>

              <div className="md:col-span-3">
                <label className="font-bold text-slate-700 block mb-1">
                  คำอธิบายย่อยเพิ่มเติม (เว้นว่างไว้หากไม่ต้องการแสดง):
                </label>
                <textarea
                  rows={2}
                  value={settings.heroDescription ?? ''}
                  onChange={(e) =>
                    setSettings({ ...settings, heroDescription: e.target.value })
                  }
                  placeholder="พิมพ์คำอธิบายย่อยเพิ่มเติมใต้ชื่อมหาวิทยาลัย..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ปุ่มหลัก (ข้อความ):
                </label>
                <input
                  type="text"
                  value={settings.heroPrimaryBtnText ?? 'ยื่นคำร้องขอหนังสือรับรอง'}
                  onChange={(e) =>
                    setSettings({ ...settings, heroPrimaryBtnText: e.target.value })
                  }
                  placeholder="ยื่นคำร้องขอหนังสือรับรอง"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ปุ่มหลัก (ลิงก์ URL):
                </label>
                <input
                  type="text"
                  value={settings.heroPrimaryBtnUrl ?? '/certificates'}
                  onChange={(e) =>
                    setSettings({ ...settings, heroPrimaryBtnUrl: e.target.value })
                  }
                  placeholder="/certificates"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ปุ่มรอง (ข้อความ):
                </label>
                <input
                  type="text"
                  value={settings.heroSecondaryBtnText ?? 'ตารางเรียนและวิชาการ'}
                  onChange={(e) =>
                    setSettings({ ...settings, heroSecondaryBtnText: e.target.value })
                  }
                  placeholder="ตารางเรียนและวิชาการ"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ปุ่มรอง (ลิงก์ URL):
                </label>
                <input
                  type="text"
                  value={settings.heroSecondaryBtnUrl ?? '/courses'}
                  onChange={(e) =>
                    setSettings({ ...settings, heroSecondaryBtnUrl: e.target.value })
                  }
                  placeholder="/courses"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
