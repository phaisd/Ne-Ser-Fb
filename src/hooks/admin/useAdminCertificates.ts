'use client';

import { useState, useMemo } from 'react';
import { CertificateRequest } from '@/types';
import { calculateNextDocNo, getErrorMessage } from '@/lib/utils';

interface UseAdminCertificatesOptions {
  loadData: () => Promise<void> | void;
  setActionSuccess: (msg: string | null) => void;
}

export function useAdminCertificates({
  loadData,
  setActionSuccess,
}: UseAdminCertificatesOptions) {
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [docNoInput, setDocNoInput] = useState('');
  const [previewRequest, setPreviewRequest] = useState<CertificateRequest | null>(null);
  const [unmaskPassport, setUnmaskPassport] = useState<boolean>(false);

  // Rejection Dialog states
  const [rejectingRequest, setRejectingRequest] = useState<CertificateRequest | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('');
  const [rejectSubmitting, setRejectSubmitting] = useState<boolean>(false);

  // Preview Tab State
  const [previewTab, setPreviewTab] = useState<'DOCUMENT' | 'ATTACHMENTS'>('DOCUMENT');

  const formatPassport = (p?: string) => {
    if (!p) return '-';
    if (unmaskPassport) return p;
    if (p.length <= 4) return '••••';
    return `${p.slice(0, 2)}••••${p.slice(-2)}`;
  };

  const availableYears = useMemo(() => {
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

  const pendingRequests = useMemo(() => requests.filter((r) => r.status === 'PENDING'), [requests]);
  const approvedRequests = useMemo(() => requests.filter((r) => r.status === 'APPROVED'), [requests]);
  const rejectedRequests = useMemo(() => requests.filter((r) => r.status === 'REJECTED'), [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (filterYear !== 'ALL' && r.createdAt) {
        const yr = String(new Date(r.createdAt).getFullYear() + 543);
        if (yr !== filterYear) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          r.studentCode?.toLowerCase().includes(q) ||
          r.fullName?.toLowerCase().includes(q) ||
          r.certType?.toLowerCase().includes(q) ||
          r.docNo?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, statusFilter, filterYear, search]);

  const handleApprove = async (id: string, defaultDocNo?: string, prefix?: '8002' | '8002.1') => {
    const targetReq = requests.find((r) => r.id === id);
    const targetYear = targetReq?.createdAt
      ? new Date(targetReq.createdAt).getFullYear() + 543
      : new Date().getFullYear() + 543;

    const autoDocNo = calculateNextDocNo(requests, targetYear).docNoWithYear;
    const finalDocNo = docNoInput.trim() || defaultDocNo || autoDocNo;
    const finalPrefix = prefix || (targetReq as any)?.docNoPrefix || '8002';

    try {
      const res = await fetch('/api/certificates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'APPROVED',
          docNo: finalDocNo,
          docNoPrefix: finalPrefix,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`อนุมัติคำร้องเรียบร้อย! ออกเลขที่หนังสือ: อว ${finalPrefix}/${finalDocNo}`);
        setApprovingId(null);
        setDocNoInput('');
        loadData();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: unknown) {
      alert('การอนุมัติล้มเหลว: ' + getErrorMessage(err));
    }
  };

  const handleOpenRejectModal = (request: CertificateRequest) => {
    setRejectingRequest(request);
    setRejectReasonInput('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    setRejectSubmitting(true);
    try {
      const finalReason = rejectReasonInput.trim() || 'ข้อมูลไม่ครบถ้วนหรือไม่เป็นไปตามระเบียบ';
      const res = await fetch('/api/certificates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rejectingRequest.id,
          status: 'REJECTED',
          rejectReason: finalReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`ปฏิเสธคำร้องของ ${rejectingRequest.fullName} เรียบร้อยแล้ว (เหตุผล: ${finalReason})`);
        setRejectingRequest(null);
        setRejectReasonInput('');
        if (previewRequest?.id === rejectingRequest.id) {
          setPreviewRequest(null);
        }
        loadData();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err: unknown) {
      alert('ข้อผิดพลาด: ' + getErrorMessage(err));
    } finally {
      setRejectSubmitting(false);
    }
  };

  return {
    requests,
    setRequests,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    filterYear,
    setFilterYear,
    approvingId,
    setApprovingId,
    docNoInput,
    setDocNoInput,
    previewRequest,
    setPreviewRequest,
    unmaskPassport,
    setUnmaskPassport,
    rejectingRequest,
    setRejectingRequest,
    rejectReasonInput,
    setRejectReasonInput,
    rejectSubmitting,
    previewTab,
    setPreviewTab,
    formatPassport,
    availableYears,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    filteredRequests,
    handleApprove,
    handleOpenRejectModal,
    handleConfirmReject,
  };
}
