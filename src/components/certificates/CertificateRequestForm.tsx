'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Send,
  Clock,
  Search,
  Landmark,
  UserCheck,
  Paperclip,
  UploadCloud,
  FileCheck2,
  Camera,
  LogIn,
  ShieldAlert,
  UserCheck2,
  Briefcase,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { CertificateRequest, CertTypeItem, StudentLookupItem } from './types';
import { isAdmissionPeriodActive } from '@/lib/utils';

export interface CertificateRequestFormProps {
  currentUser: any;
  selectedCert: CertTypeItem | null;
  setSelectedCert: (cert: CertTypeItem | null) => void;
  certTypes: CertTypeItem[];
  cardAudienceFilter: 'ALL' | 'THAI' | 'INTERNATIONAL' | 'STAFF' | 'CANDIDATE';
  setCardAudienceFilter: (filter: 'ALL' | 'THAI' | 'INTERNATIONAL' | 'STAFF' | 'CANDIDATE') => void;
  students: StudentLookupItem[];
  settings: any;
  onSuccess: (newReq: CertificateRequest, msg: string) => void;
  onBackToSelect?: () => void;
}

export function CertificateRequestForm({
  currentUser,
  selectedCert,
  setSelectedCert,
  certTypes,
  cardAudienceFilter,
  setCardAudienceFilter,
  students,
  settings,
  onSuccess,
  onBackToSelect,
}: CertificateRequestFormProps) {
  const isStaffUser = useMemo(() => {
    if (!currentUser) return false;
    return ['INSTRUCTOR', 'OFFICER', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);
  }, [currentUser]);

  // Form Fields
  const [studentCode, setStudentCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [monasticName, setMonasticName] = useState('');
  const [major, setMajor] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('ปริญญาตรี');
  const [requestPurpose, setRequestPurpose] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Staff / Faculty specific fields
  const [staffPosition, setStaffPosition] = useState('อาจารย์ผู้สอน');
  const [staffDepartment, setStaffDepartment] = useState('คณะพุทธศาสตร์');

  // Admitted Candidate Verification States (ผู้ผ่านการคัดเลือกเข้าเรียน)
  const [candidateAppNo, setCandidateAppNo] = useState('');
  const [candidateIdCard, setCandidateIdCard] = useState('');
  const [candidateVerifying, setCandidateVerifying] = useState(false);
  const [candidateVerified, setCandidateVerified] = useState<any | null>(null);
  const [candidateVerifyError, setCandidateVerifyError] = useState<string | null>(null);

  // Extended Profile Fields (From ทะเบียนนิสิต / Excel)
  const [age, setAge] = useState('');
  const [vassa, setVassa] = useState('');
  const [gender, setGender] = useState('ชาย');

  // Lookup matched student in system to lock Full Name and prevent spoofing
  const matchedStudent = useMemo(() => {
    const code = studentCode.trim();
    if (!code) return null;
    return students.find((s) => s.studentCode === code) || null;
  }, [students, studentCode]);

  const isFullNameLocked = Boolean(matchedStudent || candidateVerified);
  const isThaiCertSection = Boolean(
    selectedCert?.targetAudience === 'THAI' || cardAudienceFilter === 'THAI'
  );
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

  // Supporting Documents Upload States
  const [enrollmentSlipUrl, setEnrollmentSlipUrl] = useState<string>('');
  const [passportCopyUrl, setPassportCopyUrl] = useState<string>('');
  const [uploadingDoc, setUploadingDoc] = useState<'enrollment' | 'passport' | 'photo' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sync request purpose with selected cert
  const prevCertNameRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedCert) {
      if (!requestPurpose || requestPurpose === prevCertNameRef.current) {
        setRequestPurpose(selectedCert.name);
      }
      prevCertNameRef.current = selectedCert.name;
    }
  }, [selectedCert]);

  // Auto-fill logged-in student or staff info
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role === 'STUDENT' && currentUser.studentCode) {
      setStudentCode(currentUser.studentCode);
      const found = students.find((s) => s.studentCode === currentUser.studentCode);
      if (found) {
        const studentFullName = found.fullName || `${found.title || ''} ${found.firstName} ${found.lastName}`.trim();
        setFullName(studentFullName);
        if (found.monasticName) setMonasticName(found.monasticName);
        setMajor(found.major || '');
        setDegreeLevel(found.degree || 'ปริญญาตรี');
        if (found.phoneNumber) setPhone(found.phoneNumber);
        if (found.email) setEmail(found.email);
        if (found.age) setAge(String(found.age));
        if (found.vassa) setVassa(String(found.vassa));
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
      }
    } else if (['INSTRUCTOR', 'OFFICER', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      setFullName(currentUser.name || '');
      if (currentUser.email || currentUser.gmail) setEmail(currentUser.email || currentUser.gmail);
      if (currentUser.phone) setPhone(currentUser.phone);
      if (currentUser.department) setStaffDepartment(currentUser.department);
      if (currentUser.role === 'INSTRUCTOR') setStaffPosition('อาจารย์ผู้สอน');
      else if (currentUser.role === 'OFFICER') setStaffPosition('เจ้าหน้าที่ประจำหลักสูตร/คณะ');
      else if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') setStaffPosition('ผู้บริหาร / ผู้ดูแลระบบ');
    }
  }, [currentUser, students]);

  const handleFileUpload = async (file: File, type: 'enrollment' | 'passport' | 'photo') => {
    setUploadingDoc(type);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (type === 'enrollment') setEnrollmentSlipUrl(data.url);
        else if (type === 'passport') setPassportCopyUrl(data.url);
      } else {
        alert('อัปโหลดไฟล์ล้มเหลว: ' + (data.error || 'ไม่สามารถอัปโหลดได้'));
      }
    } catch (err: any) {
      alert('อัปโหลดไฟล์ล้มเหลว: ' + err.message);
    } finally {
      setUploadingDoc(null);
    }
  };

  // Candidate Eligibility Verification (ตรวจสอบสิทธิ์ผู้ผ่านการคัดเลือก)
  const handleVerifyCandidate = async () => {
    if (!candidateAppNo.trim() || !candidateIdCard.trim()) {
      setCandidateVerifyError('กรุณากรอกเลขที่ใบสมัคร และเลขประจำตัวประชาชนหรือเลขหนังสือเดินทาง');
      return;
    }
    setCandidateVerifying(true);
    setCandidateVerifyError(null);
    try {
      const res = await fetch('/api/admissions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationNo: candidateAppNo.trim(),
          idCardOrPassport: candidateIdCard.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCandidateVerified(data.data);
        setStudentCode(data.data.applicationNo);
        setFullName(data.data.fullName);
        setMajor(data.data.major || '');
        setDegreeLevel(data.data.degreeLevel || 'ปริญญาตรี');
        if (data.data.phone) setPhone(data.data.phone);
        if (data.data.email) setEmail(data.data.email);
        if (data.data.nationality) setNationality(data.data.nationality);
        if (data.data.country) setCountry(data.data.country);
        if (data.data.idCardOrPassport) {
          if (/^[A-Za-z]/.test(data.data.idCardOrPassport)) {
            setPassportNo(data.data.idCardOrPassport);
          }
        }
        setCandidateVerifyError(null);
      } else {
        setCandidateVerifyError(data.error || 'ไม่พบข้อมูลผู้ผ่านการคัดเลือก');
        setCandidateVerified(null);
      }
    } catch (err: any) {
      setCandidateVerifyError('เกิดข้อผิดพลาดในการตรวจสอบ: ' + err.message);
    } finally {
      setCandidateVerifying(false);
    }
  };

  // Auto-fill student info when entering student code
  const handleStudentCodeChange = (code: string) => {
    const prevMatched = students.some((s) => s.studentCode === studentCode.trim());
    setStudentCode(code);
    const found = students.find((s) => s.studentCode === code.trim());
    if (found) {
      const studentFullName = found.fullName || `${found.title || ''} ${found.firstName} ${found.lastName}`.trim();
      setFullName(studentFullName);
      if (found.monasticName) setMonasticName(found.monasticName);
      setMajor(found.major || '');
      setDegreeLevel(found.degree || 'ปริญญาตรี');
      if (found.phoneNumber) setPhone(found.phoneNumber);
      if (found.email) setEmail(found.email);

      // Fill extended profile fields
      if (found.age) setAge(String(found.age));
      if (found.vassa) setVassa(String(found.vassa));
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

      // Auto switch card filter based on student nationality (preserve selected card if already matching audience)
      const isThai = found.nationality === 'ไทย' || found.nationality === 'Thai';
      if (isThai) {
        setCardAudienceFilter('THAI');
        if (!selectedCert || selectedCert.targetAudience !== 'THAI') {
          const defaultThai = certTypes.find((c) => c.targetAudience === 'THAI');
          if (defaultThai) setSelectedCert(defaultThai);
        }
      } else if (found.nationality) {
        setCardAudienceFilter('INTERNATIONAL');
        if (!selectedCert || selectedCert.targetAudience !== 'INTERNATIONAL') {
          const defaultInt = certTypes.find((c) => c.targetAudience === 'INTERNATIONAL');
          if (defaultInt) setSelectedCert(defaultInt);
        }
      }
    } else if (prevMatched) {
      // Clear auto-filled full name if user changes away from a matched student code
      setFullName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCert) {
      alert('กรุณาเลือกประเภทหนังสือรับรองที่ต้องการ');
      return;
    }

    const isStaffCert = selectedCert.targetAudience === 'STAFF';
    const isCandidateCert = selectedCert.targetAudience === 'CANDIDATE' || selectedCert.category === 'ADMISSION';

    // 1. Staff Access Check: Must be authenticated instructor, officer or admin
    if (isStaffCert) {
      if (!isStaffUser) {
        alert('🔒 หนังสือรับรองสำหรับบุคลากร/อาจารย์ อนุญาตเฉพาะอาจารย์และเจ้าหน้าที่ที่เข้าสู่ระบบแล้วเท่านั้น');
        return;
      }
      if (!fullName.trim()) {
        alert('กรุณาระบุชื่อ-นามสกุลบุคลากร/อาจารย์ผู้ขอ');
        return;
      }
    }
    // 2. Candidate Check: Admission period check + Candidate identity verification
    else if (isCandidateCert) {
      const adm = isAdmissionPeriodActive(settings);
      if (!adm.isOpen) {
        alert(`🔒 ขณะนี้อยู่นอกช่วงเวลาการยื่นขอหนังสือรับรองสำหรับผู้ผ่านการคัดเลือก (${adm.reason || adm.periodText || 'ปิดระบบรับคำร้อง'})`);
        return;
      }
      if (!candidateVerified && !currentUser) {
        alert('🔒 สำหรับผู้ผ่านการคัดเลือกเข้าศึกษาใหม่ กรุณากรอกเลขที่ใบสมัครและตรวจสอบสิทธิ์ก่อนยื่นคำร้อง');
        return;
      }
    }
    // 3. Student Check: Students must be logged in to prevent identity spoofing
    else {
      if (!currentUser) {
        alert('🔒 เพื่อความปลอดภัยและป้องกันการสวมสิทธิ์ นิสิตทุกคนจะต้องเข้าสู่ระบบก่อนยื่นคำร้องขอหนังสือรับรอง');
        return;
      }
      if (!studentCode.trim() || !fullName.trim()) {
        alert('กรุณากรอกรหัสนิสิตและชื่อ-สกุลให้ครบถ้วน');
        return;
      }
    }

    setSubmitting(true);
    try {
      const applicantTypeVal = isStaffCert ? 'STAFF' : (candidateVerified || isCandidateCert) ? 'CANDIDATE' : 'STUDENT';
      const effectiveStudentCode = isStaffCert ? (currentUser?.id || currentUser?.email || 'STAFF') : studentCode;
      const effectiveFullName =
        !isStaffCert && matchedStudent
          ? matchedStudent.fullName || `${matchedStudent.title || ''} ${matchedStudent.firstName} ${matchedStudent.lastName}`.trim()
          : fullName;
      const cleanedAge = age ? String(age).replace(/\s*ปี$/g, '').trim() : '';
      const cleanedVassa = vassa ? String(vassa).replace(/\s*พรรษา$/g, '').trim() : '';

      const payload: any = {
        studentCode: effectiveStudentCode,
        fullName: effectiveFullName,
        monasticName: !isStaffCert && isThaiCertSection && monasticName.trim() ? monasticName.trim() : undefined,
        certType: selectedCert.name,
        targetAudience: selectedCert.targetAudience,
        applicantType: applicantTypeVal,
        position: isStaffCert ? staffPosition : undefined,
        department: isStaffCert ? staffDepartment : undefined,
        candidateAppNo: candidateVerified ? candidateAppNo : undefined,
        degreeLevel,
        major,
        requestPurpose: requestPurpose || selectedCert.name,
        email,
        phone: isStaffCert ? phone : undefined,
        age: cleanedAge,
        vassa: cleanedVassa || undefined,
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
        enrollmentSlipUrl: enrollmentSlipUrl || undefined,
        passportCopyUrl: passportCopyUrl || undefined,
        photoUrl: undefined,
        status: 'PENDING',
      };

      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        const msg = `ยื่นคำร้องสำเร็จ! รหัสคำร้อง: ${data.data.id} สำหรับ [${selectedCert.name}] ข้อมูลถูกส่งเข้าสู่ระบบและ Google Sheets เรียบร้อยแล้ว`;
        onSuccess(data.data, msg);
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกคำร้อง: ' + (data.error || 'กรุณาลองใหม่อีกครั้ง'));
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-black shadow-xs shrink-0">
            2
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              {selectedCert?.targetAudience === 'STAFF'
                ? 'กรอกข้อมูลอาจารย์ / บุคลากรผู้ขอหนังสือรับรอง'
                : selectedCert?.targetAudience === 'CANDIDATE' || selectedCert?.category === 'ADMISSION'
                ? 'ข้อมูลสำหรับผู้ผ่านการคัดเลือกเข้าศึกษาใหม่ (Candidate Verification)'
                : 'กรอกข้อมูลนิสิตผู้ยื่นคำร้อง'}
            </h2>
            <p className="text-xs text-slate-500">
              {selectedCert?.targetAudience === 'STAFF'
                ? 'ข้อมูลชื่อ ตำแหน่ง และสังกัดจะดึงมาจากบัญชีของท่านโดยอัตโนมัติ'
                : selectedCert?.targetAudience === 'CANDIDATE' || selectedCert?.category === 'ADMISSION'
                ? 'กรุณาตรวจสอบสิทธิ์ด้วยเลขที่ใบสมัครและเลขประจำตัว เพื่อออกหนังสือรับรองเข้าศึกษา/ขอ Visa'
                : 'เมื่อพิมพ์รหัสนิสิต ระบบจะดึงข้อมูลจากทะเบียนนิสิต (อายุ, สัญชาติ, หนังสือเดินทาง, วีซ่า, ที่อยู่) มาใส่ให้อัตโนมัติ'}
            </p>
          </div>
        </div>

        {onBackToSelect && (
          <button
            type="button"
            onClick={onBackToSelect}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-bold text-xs transition border border-slate-200 hover:border-purple-200 shrink-0 cursor-pointer self-start sm:self-auto"
            title="ย้อนกลับไปขั้นตอนที่ 1 เพื่อเลือกประเภทหนังสือรับรองอื่น"
          >
            <ArrowLeft className="w-4 h-4 text-purple-600" />
            <span>เปลี่ยนประเภทหนังสือ</span>
          </button>
        )}
      </div>

      {/* Access Control Gate: If user is not logged in and not viewing candidate section */}
      {!currentUser && selectedCert?.targetAudience !== 'CANDIDATE' && selectedCert?.category !== 'ADMISSION' && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200 text-slate-800 shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-900 font-extrabold text-[11px] uppercase tracking-wider">
                  🔒 มาตรการความปลอดภัยและยืนยันตัวตน (Authentication Required)
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                นิสิตและบุคลากรต้องเข้าสู่ระบบก่อนยื่นคำร้องขอหนังสือรับรอง
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ตามระเบียบของมหาวิทยาลัย เพื่อป้องกันการกรอกข้อมูลสวมสิทธิ์ กรอกข้อมูลผิดพลาด หรือบุคคลภายนอกที่ไม่ได้รับอนุญาตเข้ามายื่นคำร้องแทน
                นิสิตและอาจารย์ทุกคนจะต้องเข้าสู่ระบบก่อนยื่นคำร้อง เมื่อเข้าสู่ระบบแล้วข้อมูลของท่านจะถูกดึงมาใส่ให้อัตโนมัติโดยไม่ต้องพิมพ์เอง
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-purple-200/60">
            <Link
              href="/login?redirect=/certificates"
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> เข้าสู่ระบบด้วยบัญชีนิสิต (Student Login)
            </Link>
            <Link
              href="/login?redirect=/certificates"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-purple-600" /> เข้าสู่ระบบอาจารย์ / เจ้าหน้าที่
            </Link>
            <button
              type="button"
              onClick={() => {
                setCardAudienceFilter('CANDIDATE');
                const adm = certTypes.find((c) => c.category === 'ADMISSION' || c.targetAudience === 'CANDIDATE');
                if (adm) setSelectedCert(adm);
              }}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline ml-auto cursor-pointer"
            >
              🎓 ผู้ผ่านการคัดเลือกใหม่ (ยังไม่มีรหัสนิสิต)? คลิกตรวจสอบสิทธิ์ที่นี่
            </button>
          </div>
        </div>
      )}

      {/* Authenticated User Banner */}
      {currentUser && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <UserCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              เข้าสู่ระบบแล้ว: <span className="font-bold">{currentUser.name}</span>{' '}
              <span className="text-emerald-700 font-mono">
                ({currentUser.role === 'STUDENT' ? `รหัสนิสิต: ${currentUser.studentCode || currentUser.id}` : `บทบาท: ${currentUser.role}`})
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-950">
            ยืนยันตัวตนเรียบร้อย ✓
          </span>
        </div>
      )}

      {/* Special Section for Admitted Candidates (ผู้ผ่านการคัดเลือกเข้าเรียน) */}
      {(selectedCert?.targetAudience === 'CANDIDATE' || selectedCert?.category === 'ADMISSION' || cardAudienceFilter === 'CANDIDATE') && (
        <div className="p-5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                ✓
              </span>
              <h3 className="text-sm font-bold text-emerald-950">
                ระบบคัดกรองและตรวจสอบคุณสมบัติผู้ผ่านการคัดเลือกเข้าศึกษา (Candidate Portal)
              </h3>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${settings.admissionPeriodOpen !== false ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'}`}>
              {settings.admissionPeriodOpen !== false ? '🟢 เปิดรับคำร้อง' : '🔴 ปิดรับคำร้อง'}
            </span>
          </div>

          {/* Admission Window Alert */}
          {settings.admissionPeriodOpen === false ? (
            <div className="p-3.5 rounded-xl bg-red-100 border border-red-300 text-red-950 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">ขณะนี้อยู่นอกช่วงเวลาการยื่นขอหนังสือรับรองสำหรับผู้ผ่านการคัดเลือก</p>
                <p className="text-[11px] text-red-800 mt-0.5">
                  ระบบเปิดให้บริการเฉพาะช่วงรับสมัครและประกาศผล ({settings.admissionPeriodDates || 'มีนาคม - กรกฎาคม'}) หากมีความจำเป็นเร่งด่วนสำหรับการขอ Visa กรุณาติดต่อสำนักงานคณะพุทธศาสตร์โดยตรง
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-emerald-800">
              สำหรับผู้ผ่านการคัดเลือกเข้าเป็นนิสิตใหม่ที่ยังไม่มีรหัสนิสิต กรุณากรอก <strong>เลขที่ใบสมัคร</strong> คู่กับ <strong>เลขบัตรประชาชน หรือ เลขหนังสือเดินทาง</strong> เพื่อยืนยันสิทธิ์ก่อนยื่นคำร้อง
            </p>
          )}

          {/* Verification Box */}
          {settings.admissionPeriodOpen !== false && !candidateVerified && (
            <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-3 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    เลขที่ใบสมัคร (Application No.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น APP-69001, APP-69002 หรือ 6901xxx"
                    value={candidateAppNo}
                    onChange={(e) => setCandidateAppNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    เลขบัตรประชาชน / เลข Passport <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="กรอกเลขประจำตัวตามใบสมัคร"
                    value={candidateIdCard}
                    onChange={(e) => setCandidateIdCard(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {candidateVerifyError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{candidateVerifyError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleVerifyCandidate}
                  disabled={candidateVerifying}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {candidateVerifying ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" /> กำลังตรวจสอบ...
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" /> ตรวจสอบสิทธิ์ผู้ผ่านการคัดเลือก
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Candidate Verified Badge */}
          {candidateVerified && (
            <div className="p-3.5 rounded-xl bg-white border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-sm">{candidateVerified.fullName}</span>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    เลขที่ใบสมัคร: <strong className="font-mono">{candidateVerified.applicationNo}</strong> | หลักสูตร: {candidateVerified.degreeLevel} สาขาวิชา {candidateVerified.major}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCandidateVerified(null);
                  setCandidateAppNo('');
                  setCandidateIdCard('');
                }}
                className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                เปลี่ยนผู้สมัคร
              </button>
            </div>
          )}
        </div>
      )}

      {/* FORM CONTAINER */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* IF STAFF CERTIFICATE: Show Staff & Faculty specific form */}
        {selectedCert?.targetAudience === 'STAFF' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  ชื่อ - นามสกุล บุคลากร/อาจารย์ (Full Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ชื่อ-นามสกุล และสมณศักดิ์ (ถ้ามี)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  ตำแหน่งทางวิชาการ / บทบาทหน้าที่ <span className="text-red-500">*</span>
                </label>
                <select
                  value={staffPosition}
                  onChange={(e) => setStaffPosition(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="อาจารย์ประจำหลักสูตร">อาจารย์ประจำหลักสูตร (Full-time Faculty)</option>
                  <option value="อาจารย์พิเศษ">อาจารย์พิเศษ (Adjunct / Special Lecturer)</option>
                  <option value="อาจารย์ผู้ช่วยสอน (TA)">อาจารย์ผู้ช่วยสอน (Teaching Assistant)</option>
                  <option value="เจ้าหน้าที่บริหารงานทั่วไป">เจ้าหน้าที่บริหารงานทั่วไป (Officer)</option>
                  <option value="นักวิชาการศึกษา">นักวิชาการศึกษา (Academic Officer)</option>
                  <option value="ผู้บริหาร / คณบดี / รองคณบดี">ผู้บริหาร / คณบดี / รองคณบดี (Executive)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  สังกัด / ภาควิชา (Department) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ภาควิชาพระพุทธศาสนา, สำนักงานคณบดี"
                  value={staffDepartment}
                  onChange={(e) => setStaffDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">อีเมลติดต่อ (Email)</label>
                <input
                  type="email"
                  placeholder="อีเมลติดต่อกลับ"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">เบอร์โทรศัพท์ (Phone)</label>
                <input
                  type="text"
                  placeholder="เบอร์โทรศัพท์ที่ติดต่อได้"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                วัตถุประสงค์ในการขอหนังสือรับรอง (Purpose) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น เพื่อประกอบการยื่นขอวีซ่า, ทำธุรกรรมธนาคาร, ประกอบการประเมินผลงานทางวิชาการ หรือการต่อสัญญา"
                value={requestPurpose}
                onChange={(e) => setRequestPurpose(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>
        ) : (
          /* STUDENT / CANDIDATE FORM */
          <div className="space-y-4">
            {/* Basic Student Info */}
            <div className={`grid grid-cols-1 ${isThaiCertSection ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {candidateVerified ? 'เลขที่ใบสมัคร (Application No.)' : 'รหัสนิสิต / เลขที่ใบสมัคร / เลขพาสปอร์ต'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  readOnly={!!candidateVerified}
                  placeholder="เช่น 6801501123 หรือ Passport No. (หรือพิมพ์ NEW หากยังไม่มีรหัส)"
                  value={studentCode}
                  onChange={(e) => handleStudentCodeChange(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 ${candidateVerified ? 'bg-slate-100 cursor-not-allowed' : ''}`}
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
                  readOnly={isFullNameLocked}
                  placeholder="ชื่อและนามสกุลนิสิต (ไทย หรือ อังกฤษ)"
                  value={fullName}
                  onChange={(e) => {
                    if (!isFullNameLocked) setFullName(e.target.value);
                  }}
                  title={
                    isFullNameLocked
                      ? 'ชื่อ-นามสกุลถูกล็อกตามฐานข้อมูลทะเบียนนิสิต เพื่อป้องกันการสวมสิทธิ์หรือแก้ไขชื่อผู้อื่น'
                      : 'ชื่อและนามสกุลนิสิต'
                  }
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none ${
                    isFullNameLocked
                      ? 'bg-slate-100 border-slate-300 text-slate-700 cursor-not-allowed select-none'
                      : 'border-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500'
                  }`}
                />
                {matchedStudent && (
                  <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                    🔒 พบชื่อในระบบแล้ว (ล็อกการแก้ไขชื่อเพื่อป้องกันการสวมสิทธิ์)
                  </span>
                )}
              </div>

              {isThaiCertSection && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    ชื่อ-ฉายา/นามสกุล
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น พระมหาสมชาย ธมฺมโชโต (ใจดี)"
                    value={monasticName}
                    onChange={(e) => setMonasticName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                  <span className="text-[11px] text-purple-700 mt-1 block">
                    * สำหรับใช้ออกแทน ชื่อ - นามสกุล ในหนังสือรับรองช่วงบรรทัดแรกเท่านั้น (ชื่อ-นามสกุลใต้กรอบติดรูปถ่ายคงของเดิมไว้)
                  </span>
                </div>
              )}
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

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
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
                  <label className="text-xs font-semibold text-slate-600 block mb-1">พรรษา (Vassa)(เฉพาะภิกษุไทย)</label>
                  <input
                    type="text"
                    placeholder="เช่น 6 พรรษา (ถ้ามี)"
                    value={vassa}
                    onChange={(e) => setVassa(e.target.value)}
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

            {/* Registration Slip & Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. แนบเอกสารสำเนาใบลงทะเบียนเรียน */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-purple-700" />
                    <span>แนบเอกสารสำเนาใบลงทะเบียนเรียน</span>
                  </label>
                  <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                    รูปภาพ / PDF
                  </span>
                </div>

                <p className="text-[11px] text-slate-600">
                  ใบเสร็จรับเงิน หรือหลักฐานยืนยันการลงทะเบียนเรียนในภาคการศึกษาปัจจุบัน
                </p>

                {enrollmentSlipUrl ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-200 shadow-sm text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <a
                        href={enrollmentSlipUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-emerald-800 underline truncate hover:text-emerald-900"
                        title="คลิกเพื่อเปิดดูไฟล์ที่แนบ"
                      >
                        {enrollmentSlipUrl.toLowerCase().endsWith('.pdf')
                          ? '📄 ดูไฟล์ PDF สำเนาลงเรียน'
                          : '🖼️ ดูรูปภาพสำเนาลงเรียน'}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnrollmentSlipUrl('')}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer shrink-0 ml-2 shadow-xs"
                    >
                      ลบออก
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1 w-full p-3 rounded-xl border-2 border-dashed border-purple-300 bg-white hover:bg-purple-50 text-purple-700 text-xs font-bold transition cursor-pointer shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-purple-600" />
                      <span>
                        {uploadingDoc === 'enrollment'
                          ? 'กำลังอัปโหลดไฟล์...'
                          : 'คลิกเลือกไฟล์สำเนาลงเรียน'}
                      </span>
                    </div>
                    <span className="text-[10px] font-normal text-slate-500">
                      (รองรับไฟล์ JPG, PNG, WEBP หรือ PDF)
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, 'enrollment');
                      }}
                    />
                  </label>
                )}
              </div>

              {/* 2. อีเมลสำหรับรับแจ้งเตือนผลคำร้อง */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    อีเมลติดต่อ (Email for Notifications):
                  </label>
                  <input
                    type="email"
                    placeholder="student@mcu.ac.th"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    สำหรับรับการแจ้งเตือนความคืบหน้าและผลการอนุมัติคำร้อง
                  </p>
                </div>
              </div>
            </div>

            {/* Supporting Documents Section (เอกสารประกอบคำร้องเพิ่มเติม) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-4">
              <div className="flex items-center justify-between border-b border-purple-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-purple-700" />
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    แนบเอกสารประกอบคำร้องเพิ่มเติม (Additional Documents)
                  </span>
                </div>
                <span className="text-[11px] text-purple-700 font-semibold">
                  รองรับไฟล์ JPG, PNG หรือ PDF
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Document 1: สำเนาหนังสือเดินทาง */}
                <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-sky-600" />
                      สำเนาพาสปอร์ต / บัตร ปชช.
                    </span>
                    {passportCopyUrl && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        แนบแล้ว ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    หน้าที่มีรูปถ่ายและวันหมดอายุชัดเจน (รูปภาพ หรือ PDF)
                  </p>
                  {passportCopyUrl ? (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50/60 border border-sky-200 text-xs">
                      <a
                        href={passportCopyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-800 underline truncate max-w-[150px] font-medium"
                      >
                        {passportCopyUrl.toLowerCase().endsWith('.pdf') ? '📄 ดูไฟล์ PDF พาสปอร์ต' : '🖼️ ดูภาพพาสปอร์ต'}
                      </a>
                      <button
                        type="button"
                        onClick={() => setPassportCopyUrl('')}
                        className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                      >
                        ลบ
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-sky-300 text-sky-700 hover:bg-sky-50 text-xs font-bold cursor-pointer transition">
                      <UploadCloud className="w-4 h-4" />
                      <span>{uploadingDoc === 'passport' ? 'กำลังอัปโหลด...' : 'เลือกไฟล์พาสปอร์ต'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, 'passport');
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Photo Instruction Notice Box (ไม่ต้องอัปโหลดรูป นำมาติดเอง) */}
                <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/90 shadow-sm space-y-1.5 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <span className="font-extrabold text-amber-950 block">
                      📸 รูปถ่ายขนาด 1.5 - 2 นิ้ว (นำมาติดเอง):
                    </span>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      <strong>ไม่ต้องอัปโหลดรูปถ่ายในระบบ</strong> ให้นิสิตเตรียมรูปถ่ายขนาด 1.5 - 2 นิ้ว (หน้าตรง สวมชุดสุภาพ) มาติดด้วยตนเองบนเอกสารฉบับจริงในวันมารับหนังสือ ณ สำนักงานคณะ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
  );
}
