'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getAuthUser, isAdminOrOfficer, saveAuthSession } from '@/lib/auth-client';
import { FileText, CheckCircle } from 'lucide-react';
import {
  CertificateRequest,
  CertTypeItem,
  StudentLookupItem,
  CertificatePreviewModal,
  CertificateTracker,
  CertificateTypesGrid,
  CertificateAdminTab,
  CertificateRequestForm,
} from '@/components/certificates';

export default function CertificatesPage() {
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

  // Filter for Certificate Type Cards (ALL | THAI | INTERNATIONAL | STAFF | CANDIDATE)
  const [cardAudienceFilter, setCardAudienceFilter] = useState<'ALL' | 'THAI' | 'INTERNATIONAL' | 'STAFF' | 'CANDIDATE'>('ALL');
  const [selectedCert, setSelectedCert] = useState<CertTypeItem | null>(null);

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
  const visibleCards = useMemo(() => {
    return certTypes.filter((c) => {
      // 1. Staff cards: ONLY visible if currentUser is staff
      if (c.targetAudience === 'STAFF') {
        if (!isStaffUser) return false;
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
  }, [certTypes, isStaffUser, cardAudienceFilter]);

  const handleCardSelect = (item: CertTypeItem) => {
    setSelectedCert(item);
  };

  const handleRequestSuccess = (newReq: CertificateRequest, msg: string) => {
    setSubmitSuccess(msg);
    setRequests((prev) => [newReq, ...prev]);
    setPreviewRequest(newReq);
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
          {canManageCertificates && (
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
          {/* Section A: Notices and Certificate Types Selector */}
          <CertificateTypesGrid
            settings={settings}
            certTypes={certTypes}
            visibleCards={visibleCards}
            cardAudienceFilter={cardAudienceFilter}
            setCardAudienceFilter={setCardAudienceFilter}
            isStaffUser={isStaffUser}
            selectedCert={selectedCert}
            onCardSelect={handleCardSelect}
          />

          {/* Section B: Information Form with Access Control */}
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
          />
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
