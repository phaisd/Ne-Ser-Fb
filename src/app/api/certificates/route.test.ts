import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import { DELETE, GET, PATCH, POST } from './route';
import * as dataStore from '@/lib/data-store';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

vi.mock('@/lib/notifier', () => ({
  sendNotification: vi.fn(async () => ({ sent: true })),
}));

vi.mock('@/lib/data-store', () => ({
  getCertificateRequests: vi.fn(async () => [
    {
      id: 'req-1',
      studentCode: '6701001',
      fullName: 'พระมหาสมชาย',
      certType: 'รับรองสถานภาพ',
      status: 'PENDING',
      email: 'student01@gmail.com',
      phone: '0812345678',
      createdAt: '2026-01-01',
    },
  ]),
  getCertificateTypes: vi.fn(async () => [{ id: 'type-1', name: 'รับรองสถานภาพ' }]),
  createCertificateType: vi.fn(async (body: Record<string, unknown>) => ({ id: 'type-new', ...body })),
  updateCertificateType: vi.fn(async (id: string, u: Record<string, unknown>) => ({ id, ...u })),
  deleteCertificateType: vi.fn(async () => true),
  createCertificateRequest: vi.fn(async (body: Record<string, unknown>) => ({ id: 'req-new', ...body })),
  updateCertificateRequest: vi.fn(async (id: string, u: Record<string, unknown>) => ({
    id,
    studentCode: '6701001',
    fullName: 'พระมหาสมชาย',
    certType: 'รับรองสถานภาพ',
    ...u,
  })),
  deleteCertificateRequest: vi.fn(async () => true),
  clearMockApprovedRequests: vi.fn(async () => ({ deletedCount: 2, remainingCount: 1 })),
  syncCertificateRequestsToSheets: vi.fn(async () => ({ success: true })),
}));

describe('/api/certificates RBAC & security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('masks student PII on public GET while allowing Admin to inspect full contact details', async () => {
    const publicRes = await GET(new Request('http://localhost/api/certificates'));
    expect(publicRes.status).toBe(200);
    const publicJson = await publicRes.json();
    expect(publicJson.data[0].email).not.toBe('student01@gmail.com');
    expect(publicJson.data[0].phone).toContain('•••');

    const adminToken = createSignedSessionToken({
      id: 'admin-1',
      name: 'Officer',
      email: 'officer@mcu.ac.th',
      role: 'OFFICER',
    });
    const adminRes = await GET(
      new Request('http://localhost/api/certificates', {
        headers: { cookie: `mcu_session_token=${encodeURIComponent(adminToken)}` },
      })
    );
    const adminJson = await adminRes.json();
    expect(adminJson.data[0].email).toBe('student01@gmail.com');
    expect(adminJson.data[0].phone).toBe('0812345678');
  });

  it('prevents self-approval forgery on public POST certificate request', async () => {
    const res = await POST(
      new Request('http://localhost/api/certificates', {
        method: 'POST',
        body: JSON.stringify({
          studentCode: '6701001',
          fullName: 'พระมหาสมชาย',
          certType: 'รับรองสถานภาพ',
          status: 'APPROVED',
          docNo: 'FORGED-001',
        }),
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('PENDING');
    expect(json.data.docNo).toBeUndefined();
  });

  it('rejects unauthenticated or instructor PATCH, DELETE, and admin POST actions', async () => {
    const instructorToken = createSignedSessionToken({
      id: 'inst-1',
      name: 'Teacher',
      email: 'teacher@mcu.ac.th',
      role: 'INSTRUCTOR',
    });

    const patchAnon = await PATCH(
      new Request('http://localhost/api/certificates', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'req-1', status: 'APPROVED' }),
      })
    );
    expect(patchAnon.status).toBe(401);

    const patchInstructor = await PATCH(
      new Request('http://localhost/api/certificates', {
        method: 'PATCH',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(instructorToken)}` },
        body: JSON.stringify({ id: 'req-1', status: 'APPROVED' }),
      })
    );
    expect(patchInstructor.status).toBe(403);
    expect(dataStore.updateCertificateRequest).not.toHaveBeenCalled();

    const deleteAnon = await DELETE(
      new Request('http://localhost/api/certificates?action=clear_mock', { method: 'DELETE' })
    );
    expect(deleteAnon.status).toBe(401);
    expect(dataStore.clearMockApprovedRequests).not.toHaveBeenCalled();

    const createTypeAnon = await POST(
      new Request('http://localhost/api/certificates?action=types', {
        method: 'POST',
        body: JSON.stringify({ name: 'Hack Type' }),
      })
    );
    expect(createTypeAnon.status).toBe(401);
  });

  it('allows ADMIN to approve and delete certificate requests', async () => {
    const adminToken = createSignedSessionToken({
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@mcu.ac.th',
      role: 'ADMIN',
    });

    const patchOk = await PATCH(
      new Request('http://localhost/api/certificates', {
        method: 'PATCH',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(adminToken)}` },
        body: JSON.stringify({ id: 'req-1', status: 'APPROVED', docNo: 'ศธ 8010/001' }),
      })
    );
    expect(patchOk.status).toBe(200);
    expect(dataStore.updateCertificateRequest).toHaveBeenCalledTimes(1);

    const delOk = await DELETE(
      new Request('http://localhost/api/certificates?id=req-1', {
        method: 'DELETE',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(adminToken)}` },
      })
    );
    expect(delOk.status).toBe(200);
    expect(dataStore.deleteCertificateRequest).toHaveBeenCalledWith('req-1');
  });
});
