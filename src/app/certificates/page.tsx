'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Send,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  GraduationCap,
  Home,
  Award,
  Landmark,
  Smartphone,
  Globe,
  PlaneTakeoff,
  Printer,
  Eye,
  CheckCircle2,
  FileCheck,
  MapPin,
  BookOpen,
  UserCheck,
  X
} from 'lucide-react';

interface CertificateRequest {
  id: string;
  createdAt: string;
  studentCode: string;
  fullName: string;
  certType: string;
  degreeLevel?: string;
  major?: string;
  requestPurpose?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  docNo?: string;
  email?: string;
  phone?: string;
  targetAudience?: 'THAI' | 'INTERNATIONAL' | 'ALL';
  age?: number | string;
  gender?: string;
  nationality?: string;
  country?: string;
  passportNo?: string;
  passportExpireDate?: string;
  visaType?: string;
  visaExpireDate?: string;
  gpa?: number | string;
  address?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  bankTargetTh?: string;
  bankActionTh?: string;
  issueDateTh?: string;
  issueDateEn?: string;
  docTemplate?: string;
  signerNameTh?: string;
  signerTitleTh?: string;
  signerNameEn?: string;
  signerTitleEn?: string;
  coordinatorNameTh?: string;
  coordinatorPhoneTh?: string;
}

interface CertTypeItem {
  id: string;
  code?: string;
  name: string;
  targetAudience: 'THAI' | 'INTERNATIONAL' | 'ALL';
  badge?: string;
  category?: string;
  iconName?: string;
  description?: string;
  templateType?: string;
}

interface Student {
  studentCode: string;
  fullName?: string;
  title?: string;
  firstName: string;
  lastName: string;
  major?: string;
  degree?: string;
  phoneNumber?: string;
  email?: string;
  nationality?: string;
  country?: string;
  age?: number | string;
  gender?: string;
  passportNo?: string;
  passportExpireDate?: string;
  visaType?: string;
  visaExpireDate?: string;
  gpa?: number | string;
  address?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

export default function CertificatesPage() {
  const [activeTab, setActiveTab] = useState<'REQUEST' | 'TRACK' | 'ADMIN'>('REQUEST');
  const [certTypes, setCertTypes] = useState<CertTypeItem[]>([]);
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter for Certificate Type Cards
  const [cardAudienceFilter, setCardAudienceFilter] = useState<'ALL' | 'THAI' | 'INTERNATIONAL'>('ALL');
  const [selectedCert, setSelectedCert] = useState<CertTypeItem | null>(null);

  // Form Fields
  const [studentCode, setStudentCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [major, setMajor] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('ปริญญาตรี');
  const [requestPurpose, setRequestPurpose] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Extended Profile Fields (From ทะเบียนนิสิต / Excel)
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('ชาย');
  const [nationality, setNationality] = useState('');
  const [country, setCountry] = useState('');
  const [passportNo, setPassportNo] = useState('');
  const [passportExpireDate, setPassportExpireDate] = useState('');
  const [visaType, setVisaType] = useState('Non-Immigrant Visa');
  const [visaExpireDate, setVisaExpireDate] = useState('');
  const [gpa, setGpa] = useState('');
  const [address, setAddress] = useState('');
  const [subdistrict, setSubdistrict] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Bank Specific Fields
  const [bankTargetTh, setBankTargetTh] = useState('ผู้จัดการธนาคารกรุงไทย สาขาโลตัส นวนคร');
  const [bankActionTh, setBankActionTh] = useState('เปิดบัญชีธนาคารและเปิดใช้งานแอปพลิเคชั่น Mobile Banking');

  // PDPA Data Masking Helper (Best Practice)
  const maskPassport = (no?: string) => {
    if (!no) return '';
    const clean = no.trim();
    if (clean.length <= 4) return '••••';
    return `${clean.slice(0, 2)}••••${clean.slice(-2)}`;
  };

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Track & Search & Year Filter
  const [trackCode, setTrackCode] = useState('');
  const [filterCertYear, setFilterCertYear] = useState<string>('ALL');

  // Preview / Print Modal
  const [previewRequest, setPreviewRequest] = useState<CertificateRequest | null>(null);

  // Available Buddhist Years in Certificate Requests
  const availableCertYears = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      if (r.createdAt) {
        const yr = new Date(r.createdAt).getFullYear() + 543;
        set.add(String(yr));
      }
    });
    if (set.size === 0) set.add('2569');
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [requests]);

  // Filtered Requests for Track & Admin
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (trackCode.trim()) {
        const q = trackCode.trim().toLowerCase();
        const match =
          r.studentCode?.toLowerCase().includes(q) ||
          r.id?.toLowerCase().includes(q) ||
          r.fullName?.toLowerCase().includes(q) ||
          r.docNo?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterCertYear !== 'ALL' && r.createdAt) {
        const yr = String(new Date(r.createdAt).getFullYear() + 543);
        if (yr !== filterCertYear) return false;
      }
      return true;
    });
  }, [requests, trackCode, filterCertYear]);

  useEffect(() => {
    Promise.all([
      fetch('/api/certificates?action=types').then((res) => res.json()),
      fetch('/api/certificates').then((res) => res.json()),
      fetch('/api/students').then((res) => res.json()),
    ])
      .then(([typesRes, reqsRes, studentsRes]) => {
        if (typesRes.success && typesRes.data) {
          setCertTypes(typesRes.data);
          if (typesRes.data.length > 0) {
            setSelectedCert(typesRes.data[0]);
          }
        }
        if (reqsRes.success) setRequests(reqsRes.data);
        if (studentsRes.success) setStudents(studentsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Auto-fill student info when entering student code
  const handleStudentCodeChange = (code: string) => {
    setStudentCode(code);
    const found = students.find((s) => s.studentCode === code.trim());
    if (found) {
      const studentFullName = found.fullName || `${found.title || ''} ${found.firstName} ${found.lastName}`.trim();
      setFullName(studentFullName);
      setMajor(found.major || '');
      setDegreeLevel(found.degree || 'ปริญญาตรี');
      if (found.phoneNumber) setPhone(found.phoneNumber);
      if (found.email) setEmail(found.email);

      // Fill extended profile fields
      if (found.age) setAge(String(found.age));
      if (found.gender) setGender(found.gender);
      if (found.nationality) setNationality(found.nationality);
      if (found.country) setCountry(found.country);
      if (found.passportNo) setPassportNo(found.passportNo);
      if (found.passportExpireDate) setPassportExpireDate(found.passportExpireDate);
      if (found.visaType) setVisaType(found.visaType);
      if (found.visaExpireDate) setVisaExpireDate(found.visaExpireDate);
      if (found.gpa) setGpa(String(found.gpa));
      if (found.address) setAddress(found.address);
      if (found.subdistrict) setSubdistrict(found.subdistrict);
      if (found.district) setDistrict(found.district);
      if (found.province) setProvince(found.province);
      if (found.postalCode) setPostalCode(found.postalCode);

      // Auto switch card filter based on student nationality
      const isThai = found.nationality === 'ไทย' || found.nationality === 'Thai';
      if (isThai) {
        setCardAudienceFilter('THAI');
        const defaultThai = certTypes.find((c) => c.targetAudience === 'THAI');
        if (defaultThai) setSelectedCert(defaultThai);
      } else if (found.nationality) {
        setCardAudienceFilter('INTERNATIONAL');
        const defaultInt = certTypes.find((c) => c.targetAudience === 'INTERNATIONAL');
        if (defaultInt) setSelectedCert(defaultInt);
      }
    }
  };

  const handleCardSelect = (item: CertTypeItem) => {
    setSelectedCert(item);
    if (!requestPurpose || requestPurpose === selectedCert?.name) {
      setRequestPurpose(item.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode || !fullName || !selectedCert) {
      alert('กรุณากรอกรหัสนิสิต, ชื่อ-สกุล และเลือกประเภทหนังสือรับรอง');
      return;
    }

    setSubmitting(true);
    setSubmitSuccess(null);
    try {
      const payload: any = {
        studentCode,
        fullName,
        certType: selectedCert.name,
        targetAudience: selectedCert.targetAudience,
        degreeLevel,
        major,
        requestPurpose: requestPurpose || selectedCert.name,
        email,
        phone,
        age,
        gender,
        nationality: nationality || (selectedCert.targetAudience === 'THAI' ? 'ไทย' : 'International'),
        country,
        passportNo,
        passportExpireDate,
        visaType,
        visaExpireDate,
        gpa,
        address,
        subdistrict,
        district,
        province,
        postalCode,
        bankTargetTh,
        bankActionTh,
        docTemplate: selectedCert.templateType,
        status: 'PENDING',
      };

      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(
          `ยื่นคำร้องสำเร็จ! รหัสคำร้อง: ${data.data.id} สำหรับ [${selectedCert.name}] ข้อมูลถูกส่งเข้าสู่ระบบและ Google Sheets เรียบร้อยแล้ว`
        );
        setRequests((prev) => [data.data, ...prev]);
        // Reset form
        setStudentCode('');
        setFullName('');
        setRequestPurpose('');
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: any) {
      alert('ยื่นคำร้องล้มเหลว: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Cards
  const visibleCards = certTypes.filter((c) => {
    if (cardAudienceFilter === 'ALL') return true;
    return c.targetAudience === cardAudienceFilter || c.targetAudience === 'ALL';
  });

  // Helper icon renderer
  const renderCertIcon = (iconName?: string, target?: string) => {
    const iconClass =
      target === 'THAI'
        ? 'w-6 h-6 text-blue-600'
        : 'w-6 h-6 text-purple-600';

    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className={iconClass} />;
      case 'Home':
        return <Home className={iconClass} />;
      case 'Award':
        return <Award className={iconClass} />;
      case 'Landmark':
        return <Landmark className={iconClass} />;
      case 'Smartphone':
        return <Smartphone className={iconClass} />;
      case 'Globe':
        return <Globe className={iconClass} />;
      case 'PlaneTakeoff':
        return <PlaneTakeoff className={iconClass} />;
      case 'FileCheck':
        return <FileCheck className={iconClass} />;
      case 'MapPin':
        return <MapPin className={iconClass} />;
      case 'BookOpen':
        return <BookOpen className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-600" />
            ระบบหนังสือรับรองและคำร้อง (Certificates Portal)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เลือกประเภทหนังสือรับรองแบบการ์ด แยกหมวดหมู่นิสิตไทยและนิสิตต่างชาติ พร้อมออกเอกสารและซิงค์ Google Sheets
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto text-sm font-semibold">
          <button
            onClick={() => setActiveTab('REQUEST')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'REQUEST'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            แบบฟอร์มยื่นคำร้อง
          </button>
          <button
            onClick={() => setActiveTab('TRACK')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'TRACK'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เช็คสถานะคำร้อง
          </button>
          <button
            onClick={() => setActiveTab('ADMIN')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'ADMIN'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            รายการทั้งหมด ({requests.length})
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-purple-600 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
          <button onClick={() => setSubmitSuccess(null)} className="text-purple-600 hover:text-purple-800 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* ----------------- 1. REQUEST FORM TAB ----------------- */}
      {activeTab === 'REQUEST' && (
        <div className="space-y-8">
          {/* Section A: Card Selector */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-black">
                    1
                  </span>
                  เลือกประเภทหนังสือรับรองที่ต้องการ (คลิกที่การ์ด)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  กรุณาตรวจสอบว่าหนังสือสำหรับคนไทยหรือสำหรับนิสิตต่างชาติ เพื่อให้ออกเอกสารถูกต้องตามระเบียบ
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCardAudienceFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    cardAudienceFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด ({certTypes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCardAudienceFilter('THAI')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    cardAudienceFilter === 'THAI'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <span>🇹🇭 สำหรับคนไทย</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardAudienceFilter('INTERNATIONAL')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    cardAudienceFilter === 'INTERNATIONAL'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <span>🌐 นิสิตต่างชาติ</span>
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleCards.map((card) => {
                const isSelected = selectedCert?.id === card.id;
                const isThai = card.targetAudience === 'THAI';

                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardSelect(card)}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-left flex flex-col justify-between ${
                      isSelected
                        ? isThai
                          ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20'
                          : 'border-purple-600 bg-purple-50/40 shadow-md ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Card Header: Icon & Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            isThai ? 'bg-blue-100' : 'bg-purple-100'
                          }`}
                        >
                          {renderCertIcon(card.iconName, card.targetAudience)}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isThai ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                              🇹🇭 นิสิตไทย
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">
                              🌐 ต่างชาติ (Intl)
                            </span>
                          )}

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Title & Code */}
                      <h3
                        className={`font-bold text-sm leading-snug line-clamp-2 ${
                          isSelected
                            ? isThai
                              ? 'text-blue-900'
                              : 'text-purple-900'
                            : 'text-slate-800'
                        }`}
                      >
                        {card.name}
                      </h3>

                      <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    {/* Bottom Status */}
                    <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-400 font-semibold">{card.code || 'CERT'}</span>
                      <span
                        className={`font-semibold ${
                          isSelected
                            ? isThai
                              ? 'text-blue-700'
                              : 'text-purple-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {isSelected ? '✓ เลือกประเภทนี้แล้ว' : 'กดเพื่อเลือก'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedCert && (
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-xs ${
                  selectedCert.targetAudience === 'THAI'
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-purple-50 border-purple-200 text-purple-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="font-bold">ประเภทที่เลือกขณะนี้:</div>
                  <div className="font-semibold underline text-sm">{selectedCert.name}</div>
                  <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-white border border-current">
                    {selectedCert.targetAudience === 'THAI' ? 'สำหรับคนไทย' : 'สำหรับนิสิตต่างประเทศ'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section B: Student Information Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-black">
                2
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  กรอกข้อมูลนิสิตผู้ยื่นคำร้อง
                </h2>
                <p className="text-xs text-slate-500">
                  เมื่อพิมพ์รหัสนิสิต ระบบจะดึงข้อมูลจากทะเบียนนิสิต (อายุ, สัญชาติ, หนังสือเดินทาง, วีซ่า, ที่อยู่) มาใส่ให้อัตโนมัติ
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Basic Student Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    รหัสนิสิต / เลขที่ใบสมัคร / เลขพาสปอร์ต <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 6801501123 หรือ Passport No. (หรือพิมพ์ NEW หากยังไม่มีรหัส)"
                    value={studentCode}
                    onChange={(e) => handleStudentCodeChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    * นิสิตปัจจุบัน: กรอกรหัสนิสิต | ผู้สมัครสอบเข้าศึกษา: กรอกเลขที่ใบสมัคร หรือ Passport No.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    ชื่อ - นามสกุล (Full Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ชื่อและนามสกุลนิสิต (ไทย หรือ อังกฤษ)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Academic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">สาขาวิชา (Major)</label>
                  <input
                    type="text"
                    placeholder="เช่น ศาสนาและปรัชญา / พระพุทธศาสนา"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">ระดับการศึกษา (Degree Level)</label>
                  <select
                    value={degreeLevel}
                    onChange={(e) => setDegreeLevel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    <option value="ปริญญาตรี">ปริญญาตรี (Undergraduate)</option>
                    <option value="ปริญญาโท">ปริญญาโท (Master Degree)</option>
                    <option value="ปริญญาเอก">ปริญญาเอก (Ph.D.)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">เกรดเฉลี่ยสะสม (GPA)</label>
                  <input
                    type="text"
                    placeholder="เช่น 3.50"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Extended Profile (Age, Nationality, Passport, Visa) */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    ข้อมูลสัญชาติและเอกสารประจำตัว (เชื่อมต่อทะเบียนนิสิต)
                  </span>
                  <span className="text-[11px] text-slate-400">ระบุในเนื้อความหนังสือรับรอง</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">อายุ (Age)</label>
                    <input
                      type="text"
                      placeholder="เช่น 26 ปี"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">เพศ (Gender)</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="ชาย">ชาย (Male)</option>
                      <option value="หญิง">หญิง (Female)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">สัญชาติ (Nationality)</label>
                    <input
                      type="text"
                      placeholder="ไทย / Myanmar / Vietnamese ฯลฯ"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">ประเทศ (Country)</label>
                    <input
                      type="text"
                      placeholder="เช่น Thailand / Myanmar / Vietnam"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Passport & Visa Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">เลขที่หนังสือเดินทาง (Passport No.)</label>
                    <input
                      type="text"
                      placeholder="เช่น A11511416 / MF772427"
                      value={passportNo}
                      onChange={(e) => setPassportNo(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">วันหมดอายุ Passport</label>
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={passportExpireDate}
                      onChange={(e) => setPassportExpireDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">ประเภทวีซ่า (Visa Type)</label>
                    <input
                      type="text"
                      placeholder="Non-Immigrant Visa"
                      value={visaType}
                      onChange={(e) => setVisaType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">วันหมดอายุวีซ่า</label>
                    <input
                      type="text"
                      placeholder="เช่น 28 DCE 2026"
                      value={visaExpireDate}
                      onChange={(e) => setVisaExpireDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    ที่อยู่ปัจจุบัน / วัด / หอพัก (Address)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น Mahachulalongkornrajavidyalaya University, วัดทองจันทริการาม ฯลฯ"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">ตำบล / แขวง (Subdistrict)</label>
                  <input
                    type="text"
                    placeholder="เช่น ลำไทร / Lamsai"
                    value={subdistrict}
                    onChange={(e) => setSubdistrict(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">อำเภอ / เขต (District)</label>
                  <input
                    type="text"
                    placeholder="เช่น วังน้อย / Wangnoi"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">จังหวัด (Province)</label>
                  <input
                    type="text"
                    placeholder="เช่น พระนครศรีอยุธยา / อยุธยา"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Bank-Specific Inputs (If selected card has category BANK) */}
              {selectedCert?.category === 'BANK' && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                  <div className="font-bold text-xs text-amber-900 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-amber-700" />
                    ข้อมูลสำหรับหนังสือถึงธนาคาร
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-amber-800 block mb-1">ผู้จัดการธนาคาร / สาขาเป้าหมาย</label>
                      <input
                        type="text"
                        value={bankTargetTh}
                        onChange={(e) => setBankTargetTh(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-amber-800 block mb-1">การดำเนินธุรกรรมที่ขอ</label>
                      <input
                        type="text"
                        value={bankActionTh}
                        onChange={(e) => setBankActionTh(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Purpose / Additional Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  วัตถุประสงค์ในการขอ / หมายเหตุเพิ่มเติม
                </label>
                <textarea
                  rows={2}
                  placeholder="ระบุวัตถุประสงค์ในการขอเพิ่มเติม เช่น เพื่อยื่นเปิดบัญชีธนาคาร, ต่ออายุวีซ่า ณ ตม."
                  value={requestPurpose}
                  onChange={(e) => setRequestPurpose(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    placeholder="08x-xxx-xxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">อีเมล (Email)</label>
                  <input
                    type="email"
                    placeholder="student@mcu.ac.th"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'กำลังส่งคำร้องและซิงค์ข้อมูล...' : 'ส่งคำร้องขอหนังสือรับรอง'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- 2. TRACK REQUEST STATUS TAB ----------------- */}
      {activeTab === 'TRACK' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm max-w-xl mx-auto space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="กรอกรหัสนิสิต (เช่น 6801501123), ชื่อ หรือเลขที่เอกสาร..."
                value={trackCode}
                onChange={(e) => setTrackCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            {/* Year Filter Pills for Track Tab */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-600" /> กรองตามปี พ.ศ.:
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterCertYear('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    filterCertYear === 'ALL'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ทั้งหมด
                </button>
                {availableCertYears.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setFilterCertYear(yr)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      filterCertYear === yr
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ปี {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                ไม่พบประวัติคำร้องตามที่ระบุ
              </div>
            ) : (
              filteredRequests.map((r) => {
                const isThai = r.nationality === 'ไทย' || r.nationality === 'Thai';

                return (
                  <div
                    key={r.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md">
                          {r.studentCode}
                        </span>
                        <span className="font-bold text-slate-900">{r.fullName}</span>
                        {isThai ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            🇹🇭 คนไทย
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            🌐 ต่างชาติ ({r.nationality || 'Intl'})
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-semibold text-slate-800">{r.certType}</div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>ยื่นเมื่อ: {new Date(r.createdAt).toLocaleDateString('th-TH')}</span>
                        {r.docNo && (
                          <span className="font-mono text-purple-700 font-bold">
                            เลขที่: อว 8002/{r.docNo}
                          </span>
                        )}
                        {r.passportNo && (
                          <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]" title="เลขหนังสือเดินทางถูกปกปิดบางส่วนตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)">
                            🔒 Pass: {maskPassport(r.passportNo)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                      <button
                        onClick={() => setPreviewRequest(r)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        ดูตัวอย่าง / พิมพ์
                      </button>

                      {r.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3.5 h-3.5" />
                          อนุมัติแล้ว
                        </span>
                      ) : r.status === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          <XCircle className="w-3.5 h-3.5" />
                          ปฏิเสธ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3.5 h-3.5" />
                          รอตรวจสอบ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ----------------- 3. ADMIN / ALL REQUESTS TAB ----------------- */}
      {activeTab === 'ADMIN' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                รายการคำร้องทั้งหมดในระบบ ({filteredRequests.length} จาก {requests.length} รายการ)
              </h3>
              <p className="text-xs text-slate-500">ข้อมูลเชื่อมต่อแบบสองทางกับ Google Sheets</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Year Selector Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
                <span className="text-slate-500 pl-2 pr-1 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" /> ปี พ.ศ.:
                </span>
                <button
                  onClick={() => setFilterCertYear('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    filterCertYear === 'ALL'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด (ย้อนหลัง)
                </button>
                {availableCertYears.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setFilterCertYear(yr)}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      filterCertYear === yr
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ปี {yr}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold">
                  นิสิตไทย: {filteredRequests.filter((r) => r.nationality === 'ไทย' || r.nationality === 'Thai').length}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-bold">
                  นิสิตต่างชาติ: {filteredRequests.filter((r) => r.nationality !== 'ไทย' && r.nationality !== 'Thai').length}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-4">วันที่ยื่น</th>
                  <th className="px-6 py-4">รหัสนิสิต</th>
                  <th className="px-6 py-4">ชื่อ - นามสกุล</th>
                  <th className="px-6 py-4">สัญชาติ / เอกสาร</th>
                  <th className="px-6 py-4">ประเภทคำร้อง</th>
                  <th className="px-6 py-4">เลขที่เอกสาร</th>
                  <th className="px-6 py-4 text-center">สถานะ</th>
                  <th className="px-6 py-4 text-right">พิมพ์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((r) => {
                  const isThai = r.nationality === 'ไทย' || r.nationality === 'Thai';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-purple-700">
                        {r.studentCode}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div>{r.fullName}</div>
                        <div className="text-[11px] text-slate-400">{r.degreeLevel} {r.major}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {isThai ? (
                          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            ไทย
                          </span>
                        ) : (
                          <div>
                            <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                              {r.nationality || 'ต่างชาติ'}
                            </span>
                            {r.passportNo && (
                              <div className="font-mono text-[11px] text-slate-500 mt-0.5" title="เลขหนังสือเดินทางถูกปกปิดบางส่วนตามนโยบาย PDPA">
                                🔒 Pass: {maskPassport(r.passportNo)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                        {r.certType}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-700 font-bold">
                        {r.docNo ? `8002/${r.docNo}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status === 'APPROVED'
                            ? 'อนุมัติแล้ว'
                            : r.status === 'REJECTED'
                            ? 'ปฏิเสธ'
                            : 'รอดำเนินการ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setPreviewRequest(r)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          พิมพ์
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- 4. OFFICIAL DOCUMENT PREVIEW & PRINT MODAL ----------------- */}
      {previewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-sm">ตัวอย่างหนังสือรับรองทางการ (Official Letter Preview)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  สั่งพิมพ์ (Print)
                </button>
                <button
                  onClick={() => setPreviewRequest(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Printable Sheet Area */}
            <div className="p-8 sm:p-12 overflow-y-auto bg-white font-serif text-slate-900 space-y-6 print:p-0">
              {/* Document Header */}
              <div className="flex justify-between items-start text-xs border-b pb-4">
                <div>
                  <p className="font-bold text-sm">ที่ อว 8002 / {previewRequest.docNo || '077'}</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="font-bold">สำนักงานคณะพุทธศาสตร์</p>
                  <p>มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</p>
                  <p>โทร. 035-247-8000 ต่อ 8323</p>
                  <p className="text-purple-700">https://fb.mcu.ac.th/</p>
                </div>
              </div>

              {/* Title / Heading */}
              {previewRequest.docTemplate === 'BANK_LETTER' || previewRequest.bankTargetTh ? (
                <div className="space-y-4 pt-2">
                  <div className="text-right text-xs">
                    {previewRequest.issueDateTh || new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-bold">เรื่อง</span> {previewRequest.bankActionTh || 'ขอความอนุเคราะห์อัพเดตการใช้ Mobile Banking ให้แก่นิสิต'}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-bold">เจริญพร</span> {previewRequest.bankTargetTh || 'ผู้จัดการธนาคารกรุงไทย สาขาโลตัส นวนคร'}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-bold">สิ่งที่ส่งมาด้วย</span> หนังสือรับรองนิสิต จำนวน 1 ฉบับ
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-justify indent-8">
                    เนื่องด้วย <span className="font-bold">{previewRequest.fullName}</span> สัญชาติ{' '}
                    <span className="font-bold">{previewRequest.nationality || 'Bangladeshi'}</span> ประเทศ{' '}
                    <span className="font-bold">{previewRequest.country || 'Bangladesh'}</span>{' '}
                    {previewRequest.passportNo && (
                      <>ถือหนังสือเดินทางเลขที่ <span className="font-bold font-mono">{previewRequest.passportNo}</span> </>
                    )}
                    รหัสนิสิต <span className="font-bold font-mono">{previewRequest.studentCode}</span> เป็นนิสิตหลักสูตร
                    {previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'} ({previewRequest.major || 'สาขาวิชาพระพุทธศาสนา'}) คณะพุทธศาสตร์
                    มีความประสงค์จะทำธุรกรรมกับธนาคาร เพื่ออำนวยความสะดวกในการทำธุรกรรมกับมหาวิทยาลัยในระหว่างที่กำลังศึกษาอยู่
                    ณ ตำบลลำไทร อำเภอวังน้อย จังหวัดพระนครศรีอยุธยา
                  </p>
                  <p className="text-sm leading-relaxed indent-8">
                    จึงเจริญพรมาเพื่อขอความอนุเคราะห์ในการเปิดบัญชีหรืออัพเดตการใช้งานแอปพลิเคชั่นของธนาคารแก่นิสิตดังกล่าว จะขอบคุณยิ่ง
                  </p>
                </div>
              ) : previewRequest.docTemplate === 'INT_EXAM_ENTRY' || previewRequest.certType?.includes('สอบคัดเลือก') ? (
                <div className="space-y-4 pt-2">
                  <div className="text-center font-bold text-lg pb-1">
                    หนังสือรับรองมีสิทธิ์สอบคัดเลือกเข้าศึกษา
                  </div>
                  <div className="text-center font-semibold text-xs text-slate-500 pb-2">
                    (LETTER OF ADMISSION EXAMINATION ELIGIBILITY / VISA SUPPORT)
                  </div>
                  <p className="text-sm leading-relaxed text-justify indent-8">
                    โดยหนังสือฉบับนี้ขอรับรองว่า <span className="font-bold">{previewRequest.fullName}</span>{' '}
                    {previewRequest.age && <>อายุ <span className="font-bold">{previewRequest.age}</span> ปี </>}
                    สัญชาติ <span className="font-bold">{previewRequest.nationality || '-'}</span> ประเทศ{' '}
                    <span className="font-bold">{previewRequest.country || '-'}</span>{' '}
                    {previewRequest.passportNo && (
                      <>ถือหนังสือเดินทางเลขที่ <span className="font-bold font-mono">{previewRequest.passportNo}</span> </>
                    )}
                    ได้ผ่านการตรวจสอบคุณสมบัติเบื้องต้น และ<span className="font-bold">มีสิทธิ์เข้ารับการสอบคัดเลือกเข้าศึกษา</span> ในหลักสูตร{previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'}{' '}
                    สาขาวิชา{previewRequest.major || 'พระพุทธศาสนา'} คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ประจำปีการศึกษา 2569
                  </p>
                  <p className="text-sm leading-relaxed text-justify indent-8">
                    หนังสือนี้ออกให้เพื่อใช้เป็นหลักฐานประกอบการขอรับการตรวจลงตรา (Visa) ณ สถานเอกอัครราชทูตหรือสถานกงสุลไทย ในการเดินทางเข้ามายังราชอาณาจักรไทยเพื่อเข้ารับการสอบคัดเลือกเข้าศึกษาตามกำหนดการต่อไป
                  </p>
                  <div className="text-center text-xs pt-2">
                    ให้ไว้ ณ วันที่ {previewRequest.issueDateTh || new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              ) : previewRequest.docTemplate === 'INT_ADMISSION_ACCEPT' || previewRequest.docTemplate === 'THAI_ADMISSION' || previewRequest.certType?.includes('ผ่านการคัดเลือก') ? (
                <div className="space-y-4 pt-2">
                  <div className="text-center font-bold text-lg pb-1">
                    หนังสือรับรองการผ่านการคัดเลือกเข้าศึกษา
                  </div>
                  <div className="text-center font-semibold text-xs text-slate-500 pb-2">
                    (OFFICIAL ACCEPTANCE & ENROLLMENT CONFIRMATION LETTER)
                  </div>
                  <p className="text-sm leading-relaxed text-justify indent-8">
                    โดยหนังสือฉบับนี้ขอรับรองว่า <span className="font-bold">{previewRequest.fullName}</span>{' '}
                    {previewRequest.age && <>อายุ <span className="font-bold">{previewRequest.age}</span> ปี </>}
                    สัญชาติ <span className="font-bold">{previewRequest.nationality || 'ไทย'}</span>{' '}
                    {previewRequest.country && previewRequest.country !== 'Thailand' && (
                      <>ประเทศ <span className="font-bold">{previewRequest.country}</span> </>
                    )}
                    {previewRequest.passportNo && (
                      <>ถือหนังสือเดินทางเลขที่ <span className="font-bold font-mono">{previewRequest.passportNo}</span> </>
                    )}
                    <span className="font-bold">ได้ผ่านการสอบคัดเลือกและมีสิทธิ์เข้าศึกษา</span> ในหลักสูตร{previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'}{' '}
                    สาขาวิชา{previewRequest.major || 'พระพุทธศาสนา'} คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย ประจำปีการศึกษา 2569
                  </p>
                  <p className="text-sm leading-relaxed text-justify indent-8">
                    เพื่อใช้เป็นหลักฐานยืนยันสิทธิ์ในการเข้าศึกษา และยื่นประกอบการขอรับการตรวจลงตราประเภทคนอยู่ชั่วคราว (Non-Immigrant Visa รหัส &quot;ED&quot;) 
                    ณ สถานเอกอัครราชทูตหรือสถานกงสุลใหญ่ไทย จึงออกหนังสือนี้ไว้เป็นสำคัญ
                  </p>
                  <div className="text-center text-xs pt-2">
                    ให้ไว้ ณ วันที่ {previewRequest.issueDateTh || new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              ) : previewRequest.docTemplate === 'ENG_CERT' || previewRequest.certType?.includes('English') ? (
                <div className="space-y-5 pt-4 text-left font-sans">
                  <div className="text-center font-bold text-lg tracking-wide uppercase">
                    TO WHOM IT MAY CONCERN
                  </div>
                  <p className="text-sm leading-relaxed text-justify indent-8">
                    This is to certify that <span className="font-bold">{previewRequest.fullName}</span>, whose age is{' '}
                    <span className="font-bold">{previewRequest.age || '29'}</span> years old,{' '}
                    <span className="font-bold">{previewRequest.nationality || 'Myanmar'}</span> Nationality, holding Passport No.{' '}
                    <span className="font-bold font-mono">{previewRequest.passportNo || 'MF772427'}</span>, is currently enrolled as a
                    student of the Faculty of Buddhism, Mahachulalongkornrajavidyalaya University, Lamsai Sub-District,
                    Wangnoi District, Phra Nakhon Si Ayutthaya Province, 13170, Thailand.
                  </p>
                  <p className="text-sm leading-relaxed text-justify indent-8">
                    He/She is studying in the {previewRequest.degreeLevel || 'Bachelor of Arts Program'}, Major in{' '}
                    {previewRequest.major || 'Religion and Philosophy'}, Year {previewRequest.studentCode.substring(0, 2) ? '4' : '1'}, Academic Year 2026.
                    His/Her student identification is <span className="font-bold font-mono">{previewRequest.studentCode}</span>.
                  </p>
                  <p className="text-sm indent-8">This letter of certification is therefore issued as evidence.</p>
                  <p className="text-xs text-slate-500">
                    Issued on {previewRequest.issueDateEn || 'August 4, 2026'}
                  </p>
                </div>
              ) : (
                /* Thai Standard Certificate (Both Thai & Foreign students) */
                <div className="space-y-4 pt-2">
                  <div className="text-center font-bold text-lg pb-2">
                    หนังสือรับรอง
                  </div>
                  <p className="text-sm leading-relaxed text-justify indent-8">
                    โดยหนังสือนี้ขอรับรองว่า <span className="font-bold">{previewRequest.fullName}</span>{' '}
                    {previewRequest.age && <>อายุ <span className="font-bold">{previewRequest.age}</span> ปี </>}
                    สัญชาติ <span className="font-bold">{previewRequest.nationality || 'ไทย'}</span>{' '}
                    {previewRequest.country && previewRequest.country !== 'Thailand' && (
                      <>ประเทศ <span className="font-bold">{previewRequest.country}</span> </>
                    )}
                    {previewRequest.passportNo && (
                      <>ถือหนังสือเดินทางเลขที่ <span className="font-bold font-mono">{previewRequest.passportNo}</span> และวีซ่าประเภท {previewRequest.visaType || 'คนอยู่ชั่วคราว (Non-Immigrant Visa)'} </>
                    )}
                    เป็นนิสิตคณะพุทธศาสตร์ หลักสูตร{previewRequest.degreeLevel || 'พุทธศาสตรบัณฑิต'} สาขาวิชา
                    {previewRequest.major || 'พระพุทธศาสนา'} มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย รหัสประจำตัวนิสิต{' '}
                    <span className="font-bold font-mono">{previewRequest.studentCode}</span> เพื่อเป็นหลักฐาน สำหรับ
                    <span className="font-bold underline ml-1">{previewRequest.requestPurpose || previewRequest.certType}</span> จึงออกหนังสือนี้ไว้เป็นสำคัญ
                  </p>
                  <div className="text-center text-xs pt-2">
                    ให้ไว้ ณ วันที่ {previewRequest.issueDateTh || new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              )}

              {/* Photo Box & Signer Section */}
              <div className="pt-8 flex justify-between items-end">
                {/* Photo box 1.5 - 2 inch */}
                <div className="w-28 h-36 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs p-2 text-center">
                  <UserCheck className="w-6 h-6 mb-1 opacity-50" />
                  <span>ติดรูปถ่าย<br />1.5 - 2 นิ้ว</span>
                </div>

                {/* Signer Block */}
                <div className="text-center space-y-1 text-xs">
                  <div className="h-10"></div>
                  <p className="font-bold">(พระครูสิริรัตนบัณฑิต, ผศ.ดร.)</p>
                  <p>รักษาการแทนรองคณบดีฝ่ายวิชาการ คณะพุทธศาสตร์</p>
                  <p>มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</p>
                </div>
              </div>

              {/* Student Signature */}
              <div className="pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                <div>
                  <p>ลงชื่อ ..............................................................</p>
                  <p className="mt-1">({previewRequest.fullName}) นิสิตผู้ยื่นคำร้อง</p>
                </div>
                <div className="text-right">
                  <p className="font-mono">รหัสคำร้อง: {previewRequest.id}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setPreviewRequest(null)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                พิมพ์เอกสารนี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
