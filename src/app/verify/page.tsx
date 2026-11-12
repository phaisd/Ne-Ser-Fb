'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  User,
  FileText,
  Calendar,
  Globe,
  Award,
  Clock,
  Printer,
  ExternalLink,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

interface VerifyData {
  verified: boolean;
  status: 'AUTHENTIC' | 'REVOKED' | 'EXPIRED' | 'NOT_FOUND';
  docNo?: string;
  id?: string;
  certType?: string;
  fullNameTh?: string;
  fullNameEn?: string;
  studentCode?: string;
  degreeLevel?: string;
  major?: string;
  facultyTh?: string;
  facultyEn?: string;
  universityTh?: string;
  universityEn?: string;
  passportNo?: string;
  passportExpireDate?: string;
  visaType?: string;
  nationality?: string;
  issueDate?: string;
  signerName?: string;
  signerTitle?: string;
  securityHash?: string;
  retentionStatus?: string;
  remarks?: string;
  qrDataUrl?: string;
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('docNo') || searchParams.get('id') || searchParams.get('query') || '';

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const performVerification = async (queryStr: string) => {
    if (!queryStr.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/verify?docNo=${encodeURIComponent(queryStr.trim())}`);
      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
      } else {
        setResult({
          verified: false,
          status: 'NOT_FOUND',
        });
      }
      setHasSearched(true);
    } catch (err: unknown) {
      setErrorMsg((err instanceof Error ? err.message : String(err)) || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performVerification(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      performVerification(searchInput);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Official Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 text-amber-600 text-3xl mb-1 shadow-sm">
            ☸️
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ระบบตรวจสอบความถูกต้องของเอกสารทางการ
          </h1>
          <p className="text-sm text-slate-600 font-medium">
            Official Document & Student Verification Portal
          </p>
          <p className="text-xs text-slate-400">
            มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย (Mahachulalongkornrajavidyalaya University)
          </p>
        </div>

        {/* Verification Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="กรอกเลขที่หนังสือ (เช่น 8002/ 166, 001/2569) หรือรหัสนิสิต / Passport No."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium text-slate-900 bg-slate-50/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="px-6 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบเอกสาร'}</span>
            </button>
          </form>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>
              ช่องทางตรวจสอบอย่างเป็นทางการสำหรับ สำนักงานตรวจคนเข้าเมือง (ตม.), สถานทูต, กงสุล และหน่วยงานราชการ
            </span>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Search Results Display */}
        {result && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden transition-all">
            {result.verified ? (
              <div>
                {/* Verified Header Banner */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center sm:text-left sm:flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                      <CheckCircle2 className="w-8 h-8 text-emerald-100" />
                    </div>
                    <div>
                      <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100 font-bold text-xs uppercase tracking-wider mb-1">
                        OFFICIALLY VERIFIED & VALID
                      </div>
                      <h2 className="text-lg font-bold text-white">
                        เอกสารนี้ถูกต้องตามสารบบของมหาวิทยาลัย
                      </h2>
                      <p className="text-xs text-emerald-100">
                        ได้รับการรับรองสถานภาพและบันทึกในฐานข้อมูล มจร. อย่างถูกต้อง
                      </p>
                    </div>
                  </div>
                  {result.qrDataUrl && (
                    <div className="mt-4 sm:mt-0 flex flex-col items-center shrink-0 bg-white p-2 rounded-xl shadow-sm">
                      <img
                        src={result.qrDataUrl}
                        alt="Verification QR"
                        className="w-20 h-20 object-contain"
                      />
                      <span className="text-[9px] font-mono font-bold text-slate-600 mt-0.5">
                        {result.docNo}
                      </span>
                    </div>
                  )}
                </div>

                {/* Document Information Grid */}
                <div className="p-6 space-y-6">
                  {/* Security & Authenticity Hash */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">รหัสตรวจสอบความปลอดภัยทางดิจิทัล (Security Hash):</span>
                      <span className="font-mono font-bold text-purple-700">{result.securityHash}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[11px]">สถานะการจัดเก็บสารบรรณ (Retention Policy):</span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" />
                        {result.retentionStatus || 'จัดเก็บถาวร (Archive 5 ปีขึ้นไป)'}
                      </span>
                    </div>
                  </div>

                  {/* Main Details Table */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* Doc No & Type */}
                    <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>เลขที่หนังสือ / Document No.</span>
                      </div>
                      <div className="font-bold text-slate-900 font-mono text-base">
                        {result.docNo || '-'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <span>ประเภทหนังสือรับรอง / Certificate Type</span>
                      </div>
                      <div className="font-bold text-purple-900">
                        {result.certType || '-'}
                      </div>
                    </div>

                    {/* Student Full Name & ID */}
                    <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>ชื่อ-นามสกุล / Student Full Name</span>
                      </div>
                      <div className="font-bold text-slate-900 text-base">
                        {result.fullNameTh || '-'}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        รหัสนิสิต: <strong className="text-slate-800">{result.studentCode}</strong>
                      </div>
                    </div>

                    {/* Passport Verification Section (Highlight for Immigration) */}
                    <div className="p-3.5 rounded-xl border-2 border-amber-300 bg-amber-50/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold">
                          <Globe className="w-3.5 h-3.5 text-amber-600" />
                          <span>หนังสือเดินทาง (Passport No.)</span>
                        </div>
                        <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                          สำหรับ ตม. ตรวจสอบ
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 font-mono text-lg tracking-wider">
                        {result.passportNo ? (
                          <span className="text-indigo-900 bg-white px-2.5 py-0.5 rounded border border-amber-300 inline-block">
                            {result.passportNo}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">
                            นิสิตสัญชาติไทย (ใช้บัตรประชาชนในการยืนยันตัวตน)
                          </span>
                        )}
                      </div>
                      {result.nationality && (
                        <div className="text-xs text-slate-600">
                          สัญชาติ: <strong>{result.nationality}</strong> {result.visaType ? `| วีซ่า: ${result.visaType}` : ''}
                        </div>
                      )}
                    </div>

                    {/* Academic Program */}
                    <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>คณะ / สาขาวิชา / ระดับการศึกษา</span>
                      </div>
                      <div className="font-semibold text-slate-800">
                        {result.facultyTh} ({result.degreeLevel})
                      </div>
                      <div className="text-xs text-slate-600">
                        {result.major}
                      </div>
                    </div>

                    {/* Issue Date & Signer */}
                    <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>วันที่ออกเอกสาร / ผู้มีอำนาจลงนาม</span>
                      </div>
                      <div className="font-semibold text-slate-800">
                        {result.issueDate ? new Date(result.issueDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                      </div>
                      <div className="text-xs text-slate-500">
                        ลงนามโดย: {result.signerName} ({result.signerTitle})
                      </div>
                    </div>
                  </div>

                  {/* Legal Notice Box */}
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1 leading-relaxed">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>การรับรองตามระเบียบราชการและการปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</span>
                    </div>
                    <p className="text-emerald-800 text-[11px]">
                      ข้อมูลนี้ถูกส่งตรงจากฐานข้อมูลทะเบียนสารบรรณอิเล็กทรอนิกส์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย เพื่อใช้เป็นหลักฐานในการตรวจสอบการมีตัวตนและการเป็นนิสิตที่ถูกต้องตามกฎหมายต่อสำนักงานตรวจคนเข้าเมือง (ตม.), สถานเอกอัครราชทูต, กงสุล หรือหน่วยงานที่เกี่ยวข้อง
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition"
                    >
                      <Printer className="w-4 h-4" />
                      <span>พิมพ์ผลการตรวจสอบ (Print Verification)</span>
                    </button>

                    <Link
                      href="/"
                      className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1"
                    >
                      <span>ไปยังหน้าหลักมหาวิทยาลัย</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Not Found / Invalid Result */
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <XCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    ไม่พบข้อมูลเอกสารในสารบบ หรือเอกสารไม่ถูกต้อง
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    ไม่พบเลขที่เอกสาร <strong>&quot;{searchInput}&quot;</strong> ในระบบฐานข้อมูลของมหาวิทยาลัย โปรดตรวจสอบตัวสะกดหรือติดต่อสำนักงานทะเบียน คณะพุทธศาสตร์ มจร.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setResult(null);
                      setSearchInput('');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer"
                  >
                    ลองค้นหาใหม่อีกครั้ง
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Best Practice Information Footer */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs text-slate-600 space-y-3">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>มาตรฐานความปลอดภัยและการจัดการข้อมูลระบุตัวตน (Identity & Security Standards)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] leading-relaxed">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-800 block mb-1">1. การเข้ารหัสและปกปิดข้อมูล (Data Masking)</strong>
              บนหน้าจอสาธารณะ เลขที่หนังสือเดินทางและข้อมูลส่วนบุคคลจะถูกปกปิดบางหลัก เพื่อป้องกันการคัดลอกตามกฎหมาย PDPA
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-800 block mb-1">2. การตรวจสอบด้วย QR Code สำหรับ ตม.</strong>
              เมื่อสแกน QR Code บนเอกสาร ระบบจะดึงข้อมูลจริงจากระบบทะเบียนมาเทียบกับเล่มหนังสือเดินทางตัวจริงของผู้ถือ
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-800 block mb-1">3. การจำกัดสิทธิ์เข้าถึง (Role-Based Access)</strong>
              เฉพาะเจ้าหน้าที่ทะเบียนและผู้ดูแลระบบที่มีสิทธิ์เท่านั้น จึงจะสามารถเข้าถึงและแก้ไขข้อมูลหนังสือเดินทางได้
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-800 block mb-1">4. นโยบายการเก็บรักษาข้อมูล (Data Retention)</strong>
              ข้อมูลจะถูกเก็บรักษาตลอดระยะเวลาการศึกษา และเก็บสำรองต่ออีก 5 ปีตามระเบียบงานสารบรรณ พ.ศ. 2526
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">กำลังโหลดหน้าระบบตรวจสอบเอกสาร...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
