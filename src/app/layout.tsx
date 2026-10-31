import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  CheckCircle2,
  BookOpen,
  Users,
  Grid3X3,
  Award,
  ShieldCheck,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'ระบบบริการมหาวิทยาลัยดิจิทัล | Digital University Hub',
  description: 'Full-Stack Next.js 16 + Vercel + Tri-Mode Google Sheets (Postgres + Cloud Sheets)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dataSourceMode = process.env.DATA_SOURCE_MODE || 'HYBRID';

  return (
    <html lang="th">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        {/* Top Announcement Bar */}
        <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 text-white text-xs py-2 px-4 shadow-sm border-b border-indigo-800">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ● Live Vercel Ready
              </span>
              <span>มหาวิทยาลัยดิจิทัล (Digital University Monolith) — TH/EN (พ.ศ. ๒๕๖๙ / C.E. 2026)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-300">
                Data Storage Mode:
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold">
                {dataSourceMode === 'HYBRID' ? '⚡ HYBRID AUTO-SYNC' : dataSourceMode === 'SHEETS' ? '📊 DIRECT SHEETS' : '🐘 POSTGRESQL'}
              </span>
              <span className="hidden sm:inline text-slate-400">|</span>
              <span className="hidden sm:inline text-slate-300">Tenant: <strong className="text-white">DEFAULT-CAMPUS</strong></span>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2.5 group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 leading-tight">Digital University Hub</h1>
                    <p className="text-xs text-slate-500 font-medium">ระบบสารสนเทศและบริการการศึกษาดิจิทัล</p>
                  </div>
                </Link>
              </div>

              {/* Navigation Tabs */}
              <nav className="hidden lg:flex items-center gap-1">
                <Link
                  href="/certificates"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  คำร้อง/ใบรับรอง
                </Link>
                <Link
                  href="/rooms"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  จองห้องประชุม
                </Link>
                <Link
                  href="/attendance"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  เวลาเรียน & สิทธิ์สอบ
                </Link>
                <Link
                  href="/curriculum"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  หลักสูตร/วิชา
                </Link>
                <Link
                  href="/students"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Users className="w-4 h-4 text-indigo-500" />
                  ทะเบียนนิสิต & Sheets
                </Link>
                <Link
                  href="/timetable"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Grid3X3 className="w-4 h-4 text-cyan-500" />
                  ตารางเรียน
                </Link>
                <Link
                  href="/events"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Award className="w-4 h-4 text-rose-500" />
                  กิจกรรม & E-Cert
                </Link>
              </nav>

              {/* Admin Console Shortcut */}
              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Admin Console</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Sub-navigation bar for mobile */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 overflow-x-auto flex gap-2">
          <Link href="/certificates" className="text-xs px-2.5 py-1.5 bg-slate-100 rounded-md whitespace-nowrap">
            คำร้อง
          </Link>
          <Link href="/rooms" className="text-xs px-2.5 py-1.5 bg-slate-100 rounded-md whitespace-nowrap">
            จองห้อง
          </Link>
          <Link href="/attendance" className="text-xs px-2.5 py-1.5 bg-slate-100 rounded-md whitespace-nowrap">
            เวลาเรียน
          </Link>
          <Link href="/curriculum" className="text-xs px-2.5 py-1.5 bg-slate-100 rounded-md whitespace-nowrap">
            หลักสูตร
          </Link>
          <Link href="/students" className="text-xs px-2.5 py-1.5 bg-slate-100 rounded-md whitespace-nowrap">
            ทะเบียนนิสิต
          </Link>
          <Link href="/timetable" className="text-xs px-2.5 py-1.5 bg-slate-100 rounded-md whitespace-nowrap">
            ตารางเรียน
          </Link>
          <Link href="/events" className="text-xs px-2.5 py-1.5 bg-slate-100 rounded-md whitespace-nowrap">
            กิจกรรม
          </Link>
          <Link href="/admin" className="text-xs px-2.5 py-1.5 bg-slate-900 text-white rounded-md whitespace-nowrap">
            แผงควบคุม
          </Link>
        </div>

        {/* Main Content Area */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 mt-16 py-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Digital University Modular Monolith — Architecture Next.js 16 & Google Sheets v4</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Date Engine: TH/EN (พ.ศ. / ค.ศ.)</span>
              <span>•</span>
              <span>Multi-Tenant Architecture</span>
              <span>•</span>
              <span className="text-slate-700 font-medium">Ready for Vercel Hobby Free Deploy</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
