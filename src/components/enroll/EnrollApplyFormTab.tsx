'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  RotateCcw,
} from 'lucide-react';
import { AdmissionApplication, AdmissionPortalConfig, SystemSettings } from '@/types';
import { DEFAULT_ADMISSION_PORTAL_CONFIG } from '@/lib/admission-config';

interface EnrollApplyFormTabProps {
  portalConfig: AdmissionPortalConfig;
  settings: Partial<SystemSettings>;
  academicYear: string;
  onSubmittedApplication: (app: AdmissionApplication) => void;
  onGoToStatus: () => void;
  onGoToRegister: () => void;
}

export function EnrollApplyFormTab({
  portalConfig,
  settings,
  academicYear,
  onSubmittedApplication,
  onGoToStatus,
  onGoToRegister,
}: EnrollApplyFormTabProps) {
  const [applicantType, setApplicantType] = useState<'MONK' | 'LAYMAN'>('MONK');
  const [nationalityType, setNationalityType] = useState<'THAI' | 'INTERNATIONAL'>('THAI');
  const [citizenId, setCitizenId] = useState('');
  const [nationality, setNationality] = useState('ไทย');
  const [titleName, setTitleName] = useState('พระ');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [degreeLevel, setDegreeLevel] = useState<string>(
    DEFAULT_ADMISSION_PORTAL_CONFIG.degreeOptions[0]?.value || 'ปริญญาตรี'
  );
  const [programType, setProgramType] = useState<'THAI' | 'ENGLISH'>('THAI');
  const [major, setMajor] = useState(
    DEFAULT_ADMISSION_PORTAL_CONFIG.majorOptions[0]?.value || ''
  );
  const [previousEducation, setPreviousEducation] = useState(
    DEFAULT_ADMISSION_PORTAL_CONFIG.previousEducationOptions[0]?.value ||
      'มัธยมศึกษาตอนปลาย (ม.6) หรือเทียบเท่า'
  );
  const [studyPlan, setStudyPlan] = useState(
    DEFAULT_ADMISSION_PORTAL_CONFIG.studyPlanOptions[0]?.value ||
      'ภาคปกติ (วันจันทร์ - วันพฤหัสบดี)'
  );
  const [gpa, setGpa] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [lineId, setLineId] = useState('');
  const [address, setAddress] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [certifiedTrue, setCertifiedTrue] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<AdmissionApplication | null>(null);

  const enabledApplicantTypeOptions = useMemo(
    () =>
      (portalConfig.applicantTypeOptions || DEFAULT_ADMISSION_PORTAL_CONFIG.applicantTypeOptions || []).filter(
        (o) => o.enabled !== false
      ),
    [portalConfig.applicantTypeOptions]
  );
  const enabledNationalityTypeOptions = useMemo(
    () =>
      (portalConfig.nationalityTypeOptions || DEFAULT_ADMISSION_PORTAL_CONFIG.nationalityTypeOptions || []).filter(
        (o) => o.enabled !== false
      ),
    [portalConfig.nationalityTypeOptions]
  );
  const enabledProgramLanguageOptions = useMemo(
    () =>
      (portalConfig.programLanguageOptions || DEFAULT_ADMISSION_PORTAL_CONFIG.programLanguageOptions || []).filter(
        (o) => o.enabled !== false
      ),
    [portalConfig.programLanguageOptions]
  );
  const enabledDegreeOptions = useMemo(
    () => portalConfig.degreeOptions.filter((o) => o.enabled !== false),
    [portalConfig.degreeOptions]
  );
  const enabledMajorOptions = useMemo(
    () => portalConfig.majorOptions.filter((o) => o.enabled !== false),
    [portalConfig.majorOptions]
  );
  const enabledStudyPlanOptions = useMemo(
    () => portalConfig.studyPlanOptions.filter((o) => o.enabled !== false),
    [portalConfig.studyPlanOptions]
  );
  const enabledPrevEduOptions = useMemo(
    () => portalConfig.previousEducationOptions.filter((o) => o.enabled !== false),
    [portalConfig.previousEducationOptions]
  );

  useEffect(() => {
    if (
      enabledApplicantTypeOptions.length > 0 &&
      !enabledApplicantTypeOptions.some((o) => o.value === applicantType)
    ) {
      setApplicantType(enabledApplicantTypeOptions[0].value as 'MONK' | 'LAYMAN');
    }
  }, [enabledApplicantTypeOptions, applicantType]);

  useEffect(() => {
    if (
      enabledNationalityTypeOptions.length > 0 &&
      !enabledNationalityTypeOptions.some((o) => o.value === nationalityType)
    ) {
      setNationalityType(enabledNationalityTypeOptions[0].value as 'THAI' | 'INTERNATIONAL');
    }
  }, [enabledNationalityTypeOptions, nationalityType]);

  useEffect(() => {
    if (
      enabledProgramLanguageOptions.length > 0 &&
      !enabledProgramLanguageOptions.some((o) => o.value === programType)
    ) {
      setProgramType(enabledProgramLanguageOptions[0].value as 'THAI' | 'ENGLISH');
    }
  }, [enabledProgramLanguageOptions, programType]);

  useEffect(() => {
    if (enabledDegreeOptions.length > 0 && !enabledDegreeOptions.some((o) => o.value === degreeLevel)) {
      setDegreeLevel(enabledDegreeOptions[0].value);
    }
  }, [enabledDegreeOptions, degreeLevel]);

  useEffect(() => {
    if (enabledMajorOptions.length > 0 && !enabledMajorOptions.some((o) => o.value === major)) {
      setMajor(enabledMajorOptions[0].value);
    }
  }, [enabledMajorOptions, major]);

  useEffect(() => {
    if (
      enabledStudyPlanOptions.length > 0 &&
      !enabledStudyPlanOptions.some((o) => o.value === studyPlan)
    ) {
      setStudyPlan(enabledStudyPlanOptions[0].value);
    }
  }, [enabledStudyPlanOptions, studyPlan]);

  useEffect(() => {
    if (
      enabledPrevEduOptions.length > 0 &&
      !enabledPrevEduOptions.some((o) => o.value === previousEducation)
    ) {
      setPreviousEducation(enabledPrevEduOptions[0].value);
    }
  }, [enabledPrevEduOptions, previousEducation]);

  const handleUploadDocFile = async (file: File) => {
    if (!file) return;
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('scope', 'certificates');
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setDocumentUrl(data.url);
      } else {
        alert(data.error || 'อัปโหลดไฟล์ไม่สำเร็จ');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการอัปโหลดเอกสาร');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleResetForm = () => {
    setCitizenId('');
    setFirstName('');
    setLastName('');
    setGpa('');
    setPhone('');
    setEmail('');
    setLineId('');
    setAddress('');
    setDocumentUrl('');
    setCertifiedTrue(false);
    setSubmitError(null);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!citizenId.trim() || !firstName.trim() || !lastName.trim() || !phone.trim() || !address.trim()) {
      setSubmitError('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วนทุกช่อง');
      return;
    }
    if (!certifiedTrue) {
      setSubmitError('กรุณาติ๊กยืนยันคำรับรองความถูกต้องของข้อมูลผู้สมัคร');
      return;
    }

    setSubmitting(true);
    try {
      const matchedDegreeLabel = enabledDegreeOptions.find((o) => o.value === degreeLevel)?.label;
      const curriculumName =
        matchedDegreeLabel ||
        (degreeLevel === 'ปริญญาเอก'
          ? 'หลักสูตรพุทธศาสตรดุษฎีบัณฑิต (ปริญญาเอก - พธ.ด.)'
          : degreeLevel === 'ปริญญาโท'
          ? 'หลักสูตรพุทธศาสตรมหาบัณฑิต (ปริญญาโท - พธ.ม.)'
          : degreeLevel === 'ประกาศนียบัตร'
          ? 'หลักสูตรประกาศนียบัตรบัณฑิต'
          : 'หลักสูตรพุทธศาสตรบัณฑิต (ปริญญาตรี - พธ.บ.)');

      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          academicYear: settings.admissionAcademicYear || '2570',
          applicantType,
          nationalityType,
          citizenId: citizenId.trim(),
          passportNo: nationalityType === 'INTERNATIONAL' ? citizenId.trim() : '',
          nationality: nationalityType === 'THAI' ? 'ไทย' : nationality || 'International',
          titleName: titleName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          monasticName: applicantType === 'MONK' ? lastName.trim() : '',
          degreeLevel,
          curriculumName,
          major,
          programType,
          studyPlan,
          previousEducation,
          gpa: gpa.trim(),
          phone: phone.trim(),
          email: email.trim(),
          lineId: lineId.trim(),
          address: address.trim(),
          documentUrl: documentUrl.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSubmittedApp(data.data);
        onSubmittedApplication(data.data);
      } else {
        setSubmitError(data.error || 'ไม่สามารถบันทึกใบสมัครได้ กรุณาลองใหม่');
      }
    } catch {
      setSubmitError('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <span>
                {portalConfig.applyFormTitle || 'แบบฟอร์มยื่นใบสมัครเข้าศึกษาออนไลน์ คณะพุทธศาสตร์ มจร'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {portalConfig.applyFormSubtitle ||
                'กรอกข้อมูลผู้สมัครให้ครบถ้วน ระบบจะออกรหัสใบสมัครเพื่อใช้ตรวจสอบสถานะและขึ้นทะเบียนนิสิตออนไลน์ทันที'}
            </p>
          </div>

          {settings.admissionOpen === false ? (
            <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
              <h3 className="text-base font-extrabold text-rose-900">
                ขณะนี้ปิดรับการยื่นใบสมัครออนไลน์ชั่วคราว
              </h3>
              <p className="text-xs text-rose-700 max-w-lg mx-auto">
                สำหรับผู้สมัครที่ได้ยื่นใบสมัครไว้แล้ว ท่านยังสามารถตรวจสอบสถานะการสมัคร ตารางสอบสัมภาษณ์ และขึ้นทะเบียนนิสิตใหม่ได้ที่แท็บที่ ๓ และ ๔ ตามปกติ
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onGoToStatus()}
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold cursor-pointer"
                >
                  ไปหน้าตรวจสอบสถานะ
                </button>
                <button
                  type="button"
                  onClick={() => onGoToRegister()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                >
                  ไปหน้าขึ้นทะเบียนนิสิต
                </button>
              </div>
            </div>
          ) : submittedApp ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50/90 border-2 border-emerald-300 space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-emerald-200 text-emerald-900 text-xs font-extrabold">
                  บันทึกใบสมัครออนไลน์สำเร็จ
                </span>
                <h3 className="text-xl font-black text-slate-900 pt-1">
                  รหัสใบสมัครของคุณคือ: <span className="text-emerald-700 font-mono">{submittedApp.applicationCode}</span>
                </h3>
                <p className="text-xs text-slate-600">
                  ผู้สมัคร: <strong>{submittedApp.titleName} {submittedApp.firstName} {submittedApp.lastName}</strong> • {submittedApp.degreeLevel} ({submittedApp.major})
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedApp(null);
                    onGoToStatus();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold shadow-sm cursor-pointer"
                >
                  ตรวจสอบสถานะและตารางสัมภาษณ์ →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedApp(null);
                    handleResetForm();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  ยื่นใบสมัครเพิ่มอีกชุด
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitApplication} className="space-y-5 text-xs sm:text-sm">
              {submitError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Row 1: Applicant Type & Nationality Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๑. สถานภาพผู้สมัคร <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={applicantType}
                    onChange={(e) => {
                      const next = e.target.value as 'MONK' | 'LAYMAN';
                      setApplicantType(next);
                      setTitleName(next === 'MONK' ? 'พระ' : 'นาย');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900"
                  >
                    {enabledApplicantTypeOptions.map((opt) => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๒. ประเภทผู้สมัคร (ไทย / ต่างชาติ) <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={nationalityType}
                    onChange={(e) => {
                      const next = e.target.value as 'THAI' | 'INTERNATIONAL';
                      setNationalityType(next);
                      if (next === 'THAI') {
                        setNationality('ไทย');
                      } else {
                        setNationality('Myanmar');
                        setProgramType('ENGLISH');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900"
                  >
                    {enabledNationalityTypeOptions.map((opt) => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๓. {nationalityType === 'THAI' ? 'เลขประจำตัวประชาชน (๑๓ หลัก)' : 'เลขหนังสือเดินทาง (Passport No.)'}{' '}
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={citizenId}
                    onChange={(e) => setCitizenId(e.target.value)}
                    placeholder={
                      nationalityType === 'THAI' ? 'เช่น 1349900123456 (ไม่ต้องใส่ขีด)' : 'เช่น MA8899001'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Row 2: Title, First Name, Last Name / Monastic Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๔. คำนำหน้า / สมณศักดิ์ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={titleName}
                    onChange={(e) => setTitleName(e.target.value)}
                    placeholder={
                      applicantType === 'MONK'
                        ? 'เช่น พระ, พระมหา, พระครู, สามเณร, Ven.'
                        : 'เช่น นาย, นาง, นางสาว, Mr., Ms.'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๕. ชื่อ (First Name) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="ระบุชื่อตัว"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๖. {applicantType === 'MONK' ? 'ฉายา / นามสกุล *' : 'นามสกุล (Last Name) *'}{' '}
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={
                      applicantType === 'MONK'
                        ? 'เช่น ธีรญาโณ (นามสกุล)'
                        : 'ระบุนามสกุลจริง'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Row 3: Degree Level, Program Type, Major */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๗. ระดับหลักสูตรที่สมัคร <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={degreeLevel}
                    onChange={(e) => setDegreeLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900"
                  >
                    {enabledDegreeOptions.map((opt) => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๘. หลักสูตรภาษา <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={programType}
                    onChange={(e) => setProgramType(e.target.value as 'THAI' | 'ENGLISH')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900"
                  >
                    {enabledProgramLanguageOptions.map((opt) => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๙. สาขาวิชาที่ประสงค์สมัคร <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900"
                  >
                    {enabledMajorOptions.map((opt) => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Previous Education, Study Plan, GPA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๑๐. วุฒิการศึกษาเดิมที่ใช้สมัคร <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={previousEducation}
                    onChange={(e) => setPreviousEducation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900"
                  >
                    {enabledPrevEduOptions.map((opt) => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={portalConfig.showGpaField === false ? 'md:col-span-2' : ''}>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๑๑. แผนการเรียนที่ประสงค์สมัคร <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={studyPlan}
                    onChange={(e) => setStudyPlan(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900"
                  >
                    {enabledStudyPlanOptions.map((opt) => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {portalConfig.showGpaField !== false && (
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">
                      ๑๒. เกรดเฉลี่ยสะสม (GPAX) (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      value={gpa}
                      onChange={(e) => setGpa(e.target.value)}
                      placeholder="เช่น 3.25"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* Row 5: Phone, Email, LINE ID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={
                    portalConfig.showEmailField === false && portalConfig.showLineIdField === false
                      ? 'md:col-span-3'
                      : portalConfig.showEmailField === false || portalConfig.showLineIdField === false
                      ? 'md:col-span-2'
                      : ''
                  }
                >
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๑๓. หมายเลขโทรศัพท์ติดต่อ <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 081-234-5678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                {portalConfig.showEmailField !== false && (
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">
                      ๑๔. อีเมล (Email)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                    />
                  </div>
                )}

                {portalConfig.showLineIdField !== false && (
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">
                      ๑๕. LINE ID (สำหรับรับแจ้งเตือนสัมภาษณ์)
                    </label>
                    <input
                      type="text"
                      value={lineId}
                      onChange={(e) => setLineId(e.target.value)}
                      placeholder="ระบุไอดีไลน์ (ถ้ามี)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* Row 6: Address & Optional Document Upload */}
              <div
                className={`grid grid-cols-1 ${
                  portalConfig.showDocumentUploadField ? 'md:grid-cols-2' : ''
                } gap-4`}
              >
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    ๑๖. {applicantType === 'MONK' ? 'วัดที่จำพรรษา / ที่อยู่ปัจจุบัน *' : 'ที่อยู่ปัจจุบันที่ติดต่อได้ *'}{' '}
                    <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="ระบุชื่อวัด/บ้านเลขที่ หมู่ที่ ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                {portalConfig.showDocumentUploadField && (
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-800">
                      ๑๗. แนบไฟล์หรือลิงก์เอกสารหลักฐานเบื้องต้น (ไม่บังคับ - นำมายื่นวันสัมภาษณ์ได้)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={documentUrl}
                        onChange={(e) => setDocumentUrl(e.target.value)}
                        placeholder="วางลิงก์ Google Drive หรือกดอัปโหลดไฟล์ด้านขวา..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900"
                      />
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold cursor-pointer shrink-0">
                        <UploadCloud className="w-4 h-4" />
                        <span>{uploadingDoc ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์'}</span>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadDocFile(f);
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      รองรับไฟล์รูปภาพหรือ PDF (สำเนาใบสุทธิ/บัตรประชาชน/Passport หรือใบ รบ./ปพ.1)
                    </p>
                  </div>
                )}
              </div>

              {/* Certification Checkbox */}
              <label className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={certifiedTrue}
                  onChange={(e) => setCertifiedTrue(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-orange-600"
                />
                <span className="text-xs text-slate-700 leading-relaxed font-medium">
                  {portalConfig.certificationStatement ||
                    'ข้าพเจ้าขอรับรองว่าข้อความข้างต้นเป็นความจริงทุกประการ หากตรวจสอบภายหลังพบว่ามีคุณสมบัติไม่ตรงตามที่มหาวิทยาลัยกำหนด ข้าพเจ้ายินยอมให้ตัดสิทธิ์การเข้าศึกษาโดยไม่มีเงื่อนไข'}
                </span>
              </label>

              {/* Form Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>ล้างข้อมูล</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs sm:text-sm font-extrabold shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'กำลังบันทึกใบสมัคร...' : 'บันทึกยื่นใบสมัครออนไลน์'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
  );
}
