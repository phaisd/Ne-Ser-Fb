'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getAuthUser, isAdminOrOfficer, saveAuthSession } from '@/lib/auth-client';
import { useLanguage } from '@/hooks/useLanguage';
import { FileText, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  CertificateRequest,
  CertTypeItem,
  StudentLookupItem,
  CertificatePreviewModal,
  CertificateTracker,
  CertificateTypesGrid,
  CertificateAdminTab,
  CertificateRequestForm,
  renderCertIcon,
} from '@/components/certificates';

export default function CertificatesPage() {
  const { t, isEn } = useLanguage();
  const [activeTab, setActiveTab] = useState<'REQUEST' | 'TRACK' | 'ADMIN'>('REQUEST');
  const [certTypes, setCertTypes] = useState<CertTypeItem[]>([]);
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [students, setStudents] = useState<StudentLookupItem[]>([]);
  const [, setLoading] = useState(true);

  // Current Authenticated User & Roles
  const [currentUser, setCurrentUser] = useState<any>(null);

  const canManageCertificates = useMemo(() => {
    return isAdminOrOfficer(currentUser);
  }, [currentUser]);

  const isStaffUser = useMemo(() => {
    if (!currentUser) return false;
    return isAdminOrOfficer(currentUser) || currentUser.role === 'INSTRUCTOR';
  }, [currentUser]);

  const isInstructorOnly = useMemo(() => {
    if (!currentUser) return false;
    return (
      String(currentUser.role || '').toUpperCase() === 'INSTRUCTOR' &&
      !isAdminOrOfficer(currentUser)
    );
  }, [currentUser]);

  // Filter for Certificate Type Cards (ALL | THAI | INTERNATIONAL | STAFF | CANDIDATE)
  const [cardAudienceFilter, setCardAudienceFilter] = useState<'ALL' | 'THAI' | 'INTERNATIONAL' | 'STAFF' | 'CANDIDATE'>('ALL');
  const [selectedCert, setSelectedCert] = useState<CertTypeItem | null>(null);
  const [requestStep, setRequestStep] = useState<1 | 2>(1);

  // Submit banner status
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Track & Search & Year Filter
  const [trackCode, setTrackCode] = useState('');
  const [filterCertYear, setFilterCertYear] = useState<string>('ALL');

  // Preview / Print Modal
  const [previewRequest, setPreviewRequest] = useState<CertificateRequest | null>(null);

  // System Settings (Contact, Faculty, Web URLs)
  const [settings, setSettings] = useState<any>({
    facultyNameTh: 'คณะพุทธศาสตร์',
    facultyNameEn: 'Faculty of Buddhism',
    contactPhone: '035-248-000 ต่อ 8323',
    websiteUrl: 'https://fb.mcu.ac.th/',
    systemServiceUrl: 'https://fb-service.mcu.ac.th/',
  });

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

  // Listen to Auth State
  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      setCurrentUser(user);
    } else {
      fetch('/api/auth')
        .then((r) => r.json())
        .then((d) => {
          if (d.authenticated && d.user) {
            setCurrentUser(d.user);
            saveAuthSession(d.user, true);
          }
        })
        .catch(() => {});
    }

    const handleAuthChange = () => {
      const u = getAuthUser();
      setCurrentUser(u);
    };

    window.addEventListener('mcu_user_logged_in', handleAuthChange);
    window.addEventListener('mcu_user_logged_out', handleAuthChange);

    return () => {
      window.removeEventListener('mcu_user_logged_in', handleAuthChange);
      window.removeEventListener('mcu_user_logged_out', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    fetch('/api/system-settings')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) setSettings(res.data);
      })
      .catch(() => {});

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
        if (studentsRes.success) {
          setStudents(studentsRes.data);
          const u = getAuthUser();
          if (u?.role === 'STUDENT' && u.studentCode) {
            setTrackCode(u.studentCode);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtered Cards
  const canSeeStaffCards = isStaffUser || settings?.showStaffCertificatesInPortal === true;

  // Auto-switch filter to STAFF when an instructor or staff user logs in
  const staffInitializedRef = React.useRef(false);
  useEffect(() => {
    if (isInstructorOnly) {
      staffInitializedRef.current = true;
      if (cardAudienceFilter !== 'STAFF') {
        setCardAudienceFilter('STAFF');
      }
      if (!selectedCert || selectedCert.targetAudience !== 'STAFF') {
        const firstStaffCert = certTypes.find((c) => c.targetAudience === 'STAFF') || null;
        setSelectedCert(firstStaffCert);
      }
      return;
    }

    if (isStaffUser) {
      if (!staffInitializedRef.current && certTypes.length > 0) {
        staffInitializedRef.current = true;
        setCardAudienceFilter('STAFF');
        const firstStaffCert = certTypes.find((c) => c.targetAudience === 'STAFF');
        if (firstStaffCert) {
          setSelectedCert(firstStaffCert);
        }
      }
    } else {
      staffInitializedRef.current = false;
    }
  }, [isInstructorOnly, isStaffUser, certTypes, cardAudienceFilter, selectedCert]);

  const visibleCards = useMemo(() => {
    // Instructors only see STAFF certificates (hide THAI student, INTERNATIONAL student, and CANDIDATE cards)
    if (isInstructorOnly) {
      return certTypes.filter((c) => c.targetAudience === 'STAFF');
    }

    return certTypes.filter((c) => {
      // 1. Staff cards: visible if currentUser is staff OR admin enables showStaffCertificatesInPortal
      if (c.targetAudience === 'STAFF') {
        if (!canSeeStaffCards) return false;
        if (cardAudienceFilter === 'STAFF') return true;
        if (cardAudienceFilter === 'ALL') return true;
        return false;
      }

      // 2. Candidate cards
      if (c.targetAudience === 'CANDIDATE' || c.category === 'ADMISSION') {
        if (cardAudienceFilter === 'CANDIDATE') return true;
        if (cardAudienceFilter === 'ALL') return true;
        if (cardAudienceFilter === 'THAI' && c.targetAudience === 'THAI') return true;
        if (cardAudienceFilter === 'INTERNATIONAL' && c.targetAudience === 'INTERNATIONAL') return true;
        return false;
      }

      // 3. Regular student cards
      if (cardAudienceFilter === 'STAFF') return false;
      if (cardAudienceFilter === 'CANDIDATE') return false;
      if (cardAudienceFilter === 'ALL') return true;
      return c.targetAudience === cardAudienceFilter || c.targetAudience === 'ALL';
    });
  }, [certTypes, canSeeStaffCards, cardAudienceFilter, isInstructorOnly]);

  const handleCardSelect = (item: CertTypeItem) => {
    setSelectedCert(item);
    setRequestStep(2);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleProceedToForm = () => {
    if (selectedCert) {
      setRequestStep(2);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBackToSelect = () => {
    setRequestStep(1);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRequestSuccess = (newReq: CertificateRequest, msg: string) => {
    setSubmitSuccess(msg);
    setRequests((prev) => [newReq, ...prev]);
    setPreviewRequest(newReq);
    setRequestStep(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-600" />
            {t.certPortalTitle}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.certPortalDesc}
          </p>
        </div>

        {/* Tab switcher (Responsive Touch-Friendly) */}
        <div className="w-full sm:w-auto flex items-center p-1 bg-slate-200/80 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('REQUEST')}
            className={`flex-1 sm:flex-initial text-center whitespace-nowrap shrink-0 min-h-[40px] px-3.5 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'REQUEST'
                ? 'bg-white text-purple-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.certTabRequest}
          </button>
          <button
            onClick={() => setActiveTab('TRACK')}
            className={`flex-1 sm:flex-initial text-center whitespace-nowrap shrink-0 min-h-[40px] px-3.5 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'TRACK'
                ? 'bg-white text-purple-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.certTabTrack}
          </button>
          {canManageCertificates && (
            <button
              onClick={() => setActiveTab('ADMIN')}
              className={`flex-1 sm:flex-initial text-center whitespace-nowrap shrink-0 min-h-[40px] px-3.5 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'ADMIN'
                  ? 'bg-white text-purple-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.certTabAdmin} ({requests.length})
            </button>
          )}
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
        <div className="space-y-6">
          {/* Stepper Progress Bar (Step 1 -> Step 2) */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-2 sm:gap-4">
            <button
              type="button"
              onClick={handleBackToSelect}
              className={`flex-1 flex items-center justify-center sm:justify-start gap-2.5 p-2.5 rounded-xl transition cursor-pointer ${
                requestStep === 1
                  ? 'bg-purple-50 text-purple-900 border border-purple-200 font-extrabold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-bold'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                  requestStep === 1 ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                1
              </span>
              <div className="text-left hidden xs:block">
                <div className="text-xs sm:text-sm font-bold">{t.certStep1}</div>
                <div className="text-[10px] text-slate-400 font-normal hidden md:block">
                  {isEn ? 'Select request card' : 'เลือกการ์ดประเภทคำร้องที่ต้องการ'}
                </div>
              </div>
              <span className="xs:hidden text-xs font-bold">{t.certStep1}</span>
            </button>

            <span className="text-slate-300 font-bold">➔</span>

            <button
              type="button"
              onClick={handleProceedToForm}
              disabled={!selectedCert}
              className={`flex-1 flex items-center justify-center sm:justify-start gap-2.5 p-2.5 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                requestStep === 2
                  ? 'bg-purple-50 text-purple-900 border border-purple-200 font-extrabold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-bold'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                  requestStep === 2 ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                2
              </span>
              <div className="text-left hidden xs:block">
                <div className="text-xs sm:text-sm font-bold">{t.certStep2}</div>
                <div className="text-[10px] text-slate-400 font-normal hidden md:block truncate max-w-[200px]">
                  {selectedCert ? (isEn && (selectedCert as any).titleEn ? (selectedCert as any).titleEn : selectedCert.name) : (isEn ? 'Fill details and attachments' : 'กรอกรายละเอียดและแนบเอกสาร')}
                </div>
              </div>
              <span className="xs:hidden text-xs font-bold">{t.certStep2}</span>
            </button>
          </div>

          {/* Step 1 View: Selection Grid */}
          {requestStep === 1 && (
            <div className="animate-in fade-in duration-200 space-y-6">
              <CertificateTypesGrid
                settings={settings}
                certTypes={certTypes}
                visibleCards={visibleCards}
                cardAudienceFilter={cardAudienceFilter}
                setCardAudienceFilter={setCardAudienceFilter}
                isStaffUser={isStaffUser}
                currentUser={currentUser}
                selectedCert={selectedCert}
                onCardSelect={handleCardSelect}
                onProceedToForm={handleProceedToForm}
              />
            </div>
          )}

          {/* Step 2 View: Selected Cert Banner & Application Form */}
          {requestStep === 2 && (
            <div className="animate-in fade-in duration-200 space-y-6">
              {/* Selected Certificate Summary Header */}
              {selectedCert && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white border border-purple-800/40 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
                      {renderCertIcon(selectedCert.iconName, selectedCert.targetAudience)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
                          ประเภทหนังสือที่เลือก
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                          รหัส: {selectedCert.code || 'CERT'}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-white mt-1">
                        {selectedCert.name}
                      </h2>
                      {selectedCert.description && (
                        <p className="text-xs text-purple-200/80 italic line-clamp-2">
                          {selectedCert.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBackToSelect}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition shrink-0 cursor-pointer self-stretch sm:self-auto justify-center"
                  >
                    <ArrowLeft className="w-4 h-4 text-purple-300" />
                    <span>เปลี่ยนประเภทหนังสือ (เลือกใหม่)</span>
                  </button>
                </div>
              )}

              {/* Information Form */}
              <CertificateRequestForm
                currentUser={currentUser}
                selectedCert={selectedCert}
                setSelectedCert={setSelectedCert}
                certTypes={certTypes}
                cardAudienceFilter={cardAudienceFilter}
                setCardAudienceFilter={setCardAudienceFilter}
                students={students}
                settings={settings}
                onSuccess={handleRequestSuccess}
                onBackToSelect={handleBackToSelect}
              />
            </div>
          )}
        </div>
      )}

      {/* ----------------- 2. TRACK REQUEST STATUS TAB ----------------- */}
      {activeTab === 'TRACK' && (
        <CertificateTracker
          trackCode={trackCode}
          setTrackCode={setTrackCode}
          filterCertYear={filterCertYear}
          setFilterCertYear={setFilterCertYear}
          availableCertYears={availableCertYears}
          filteredRequests={filteredRequests}
          onPreviewRequest={setPreviewRequest}
        />
      )}

      {/* ----------------- 3. ADMIN / ALL REQUESTS TAB ----------------- */}
      {activeTab === 'ADMIN' && canManageCertificates && (
        <CertificateAdminTab
          filteredRequests={filteredRequests}
          totalRequestsCount={requests.length}
          filterCertYear={filterCertYear}
          setFilterCertYear={setFilterCertYear}
          availableCertYears={availableCertYears}
          onPreviewRequest={setPreviewRequest}
        />
      )}

      {/* ----------------- 4. OFFICIAL DOCUMENT PREVIEW & PRINT MODAL ----------------- */}
      <CertificatePreviewModal
        previewRequest={previewRequest}
        onClose={() => setPreviewRequest(null)}
        settings={settings}
      />
    </div>
  );
}
