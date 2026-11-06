'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Palette,
  UserCog,
  Clock,
  CheckCircle,
  Users,
  BookOpen,
  Sliders,
  ChevronRight,
  ExternalLink,
  Lock,
  QrCode,
  Archive,
} from 'lucide-react';
import { CertificateRequest, UserAccount } from '@/types';
import { AcademicYearWorkflowCard } from '../AcademicYearWorkflowCard';

interface AdminDashboardTabProps {
  pendingRequests: CertificateRequest[];
  approvedRequests: CertificateRequest[];
  studentsCount: { total: number; thai: number; intl: number };
  coursesCount: number;
  users: UserAccount[];
  setActiveTab: (tab: any) => void;
  setStatusFilter: (filter: any) => void;
  setApprovingId: (id: string) => void;
  onOpenArchiveModal?: () => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  pendingRequests,
  approvedRequests,
  studentsCount,
  coursesCount,
  users,
  setActiveTab,
  setStatusFilter,
  setApprovingId,
  onOpenArchiveModal,
}) => {
  return (
    <div className="space-y-6">
      {/* Welcome Identity Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
            <ShieldCheck className="w-4 h-4" />
            แผงควบคุมหลัก • ระบบบริหารงานวิชาการและทะเบียน
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            ยินดีต้อนรับสู่ส่วนจัดการหลังบ้าน (Admin Backend)
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            ศูนย์กลางควบคุมการออกหนังสือรับรอง, ทะเบียนนิสิต ภาคภาษาไทยและภาษาอังกฤษ, จัดการรายวิชาตารางสอน และตั้งค่าโลโก้ตราสถาบัน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('BRANDING')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 cursor-pointer"
          >
            <Palette className="w-4 h-4 text-pink-400" />
            <span>ปรับแต่งโลโก้ & ข้อความ</span>
          </button>
          <button
            onClick={() => setActiveTab('USERS')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-600/30 cursor-pointer"
          >
            <UserCog className="w-4 h-4" />
            <span>จัดการผู้ใช้และบทบาท</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setActiveTab('CERTIFICATES');
            setStatusFilter('PENDING');
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-amber-400 cursor-pointer transition space-y-2"
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-700">
            <span>คำร้องรออนุมัติ</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-900">{pendingRequests.length}</div>
          <div className="text-[11px] text-amber-600 font-medium">คลิกเพื่อพิจารณาออกเลขที่</div>
        </div>

        <div
          onClick={() => {
            setActiveTab('CERTIFICATES');
            setStatusFilter('APPROVED');
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-400 cursor-pointer transition space-y-2"
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
            <span>อนุมัติแล้ว</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-900">{approvedRequests.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium">ออกเลขที่และพร้อมพิมพ์</div>
        </div>

        <div
          onClick={() => setActiveTab('STUDENTS')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-orange-400 cursor-pointer transition space-y-2"
        >
          <div className="flex items-center justify-between text-xs font-bold text-orange-700">
            <span>นิสิตในระบบ</span>
            <Users className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{studentsCount.total}</div>
          <div className="text-[11px] text-slate-500">
            🇹🇭 {studentsCount.thai} • 🌐 {studentsCount.intl} รูป/คน
          </div>
        </div>

        <div
          onClick={() => setActiveTab('COURSES')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-400 cursor-pointer transition space-y-2"
        >
          <div className="flex items-center justify-between text-xs font-bold text-blue-700">
            <span>รายวิชาที่เปิดสอน</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{coursesCount}</div>
          <div className="text-[11px] text-slate-500">ภาคไทย & ภาษาอังกฤษ</div>
        </div>
      </div>

      {/* Recommended Workflow for New Academic Year */}
      <AcademicYearWorkflowCard
        onNavigateTab={setActiveTab}
        onOpenArchiveModal={onOpenArchiveModal}
      />

      {/* Quick Actions & Recent Pending Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              คำร้องขอหนังสือรับรองล่าสุดที่รออนุมัติ ({pendingRequests.length})
            </h3>
            <button
              onClick={() => setActiveTab('CERTIFICATES')}
              className="text-xs font-bold text-purple-600 hover:text-purple-800 cursor-pointer"
            >
              ดูทั้งหมด →
            </button>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              ไม่มีคำร้องที่รอการอนุมัติในขณะนี้
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingRequests.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="py-3 flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {r.studentCode}
                      </span>
                      <span>{r.fullName}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {r.certType} • ยื่นเมื่อ {new Date(r.createdAt).toLocaleDateString('th-TH')}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('CERTIFICATES');
                      setApprovingId(r.id);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition cursor-pointer"
                  >
                    อนุมัติทันที
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Navigation Panels */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-3">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-orange-600" />
            เมนูการจัดการด่วน (Quick Links)
          </h3>
          <div className="space-y-2 text-xs">
            <button
              onClick={() => setActiveTab('BRANDING')}
              className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-pink-50 text-slate-700 hover:text-pink-900 border border-slate-200/80 transition flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-bold">เปลี่ยนโลโก้ & ข้อมูลมหาวิทยาลัย</div>
                <div className="text-[11px] text-slate-400">ชื่อคณะ, ผู้ลงนาม, เบอร์ติดต่อ</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('USERS')}
              className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200/80 transition flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-bold">จัดการผู้ใช้งาน & กำหนดบทบาท</div>
                <div className="text-[11px] text-slate-400">Admin, เจ้าหน้าที่, อาจารย์ ({users.length} ท่าน)</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveTab('EVENTS')}
              className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200/80 transition flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-bold">งานกิจกรรมและโครงการนิสิต</div>
                <div className="text-[11px] text-slate-400">เช็คชื่อวิปัสสนากัมมัฏฐาน & ชั่วโมงกิจกรรม</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <Link
              href="/students"
              className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-900 border border-slate-200/80 transition flex items-center justify-between"
            >
              <div>
                <div className="font-bold">นำเข้า/ส่งออก ทะเบียนนิสิตเป็นชุด</div>
                <div className="text-[11px] text-slate-400">Import/Export Excel, สถานภาพย้ายเข้า</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>

            <button
              onClick={() => setActiveTab('SHEETS')}
              className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200/80 transition flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-bold">สถานะการเชื่อมต่อ Google Sheets</div>
                <div className="text-[11px] text-slate-400">ตรวจเช็คความพร้อมและซิงค์ชีต</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <Link
              href="/verify"
              target="_blank"
              className="w-full text-left p-3 rounded-xl bg-purple-50/80 hover:bg-purple-100 text-purple-900 border border-purple-200 transition flex items-center justify-between"
            >
              <div>
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>ระบบตรวจเอกสาร ตม. (/verify)</span>
                </div>
                <div className="text-[11px] text-purple-600">สแกน QR Code ตรวจสอบความถูกต้องกับสารบบ มจร.</div>
              </div>
              <ExternalLink className="w-4 h-4 text-purple-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* Best Practice: Security & Data Retention Policy Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h4 className="font-bold text-sm">
              แนวทางปฏิบัติที่ดีที่สุด: มาตรการความมั่นคงปลอดภัยข้อมูลและการจัดเก็บสารบรรณ (Best Practice)
            </h4>
          </div>
          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
            PDPA & Thai Gov Archives Compliant
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>1. ปกปิดข้อมูล (Data Masking)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              หน้าสาธารณะซ่อนเลข Passport บางหลักอัตโนมัติ ป้องกันการคัดลอกข้อมูลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <div className="font-bold text-sky-300 flex items-center gap-1">
              <UserCog className="w-3.5 h-3.5" />
              <span>2. จำกัดสิทธิ์ (Access Control)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              เฉพาะ Admin และเจ้าหน้าที่ทะเบียนที่มีสิทธิ์เท่านั้น ที่สามารถเปิดดูเลขหนังสือเดินทางฉบับเต็มได้
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <div className="font-bold text-emerald-300 flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" />
              <span>3. ตรวจสอบด้วย QR สำหรับ ตม.</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              เอกสารทุกใบพิมพ์ QR Code ให้เจ้าหน้าที่ ตม. / สถานทูต สแกนเทียบกับเล่มพาสปอร์ตตัวจริงได้ทันที
            </p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
            <div className="font-bold text-purple-300 flex items-center gap-1">
              <Archive className="w-3.5 h-3.5" />
              <span>4. อายุการจัดเก็บ 5 ปี (Retention)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              เก็บรักษาข้อมูลตลอดการศึกษา และสำรองประวัติต่ออีก 5 ปีตามระเบียบงานสารบรรณสำนักนายกฯ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
