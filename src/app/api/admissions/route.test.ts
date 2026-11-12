import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import { GET, POST } from './route';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

const mockApps = [
  {
    id: 'adm-1',
    applicationCode: 'MCU-FB-2570-0001',
    citizenId: '1349900123456',
    nationalityType: 'THAI',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    phone: '0811111111',
    status: 'SUBMITTED',
  },
];

vi.mock('@/lib/data-store', () => ({
  getAdmissionApplications: vi.fn(async () => mockApps),
  createAdmissionApplication: vi.fn(async (body: Record<string, unknown>) => ({
    ...body,
    id: 'adm-new',
    applicationCode: 'MCU-FB-2570-0002',
  })),
  updateAdmissionApplication: vi.fn(async (id: string) =>
    id === 'missing' ? null : { ...mockApps[0], status: 'DOC_VERIFIED' }
  ),
  confirmAdmissionEnrollment: vi.fn(async (q: string) =>
    q ? { success: true, application: { ...mockApps[0], status: 'ENROLLED' } } : { success: false, error: 'ไม่พบข้อมูล' }
  ),
  transferAdmissionToStudentRegistry: vi.fn(async () => ({ success: true, studentCode: '7001001' })),
  deleteAdmissionApplication: vi.fn(async () => undefined),
  maskCitizenId: vi.fn(() => '1-••••-•••••-56'),
  maskPassportNumber: vi.fn(() => 'AB••••12'),
}));

describe('/api/admissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('masks citizenId for public GET queries and reveals full citizenId for ADMIN', async () => {
    const pubRes = await GET(new Request('http://localhost/api/admissions?query=MCU-FB-2570-0001'));
    const pubJson = await pubRes.json();
    expect(pubRes.status).toBe(200);
    expect(pubJson.data.citizenId).toBe('1-••••-•••••-56');

    const adminToken = createSignedSessionToken({
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@mcu.ac.th',
      role: 'ADMIN',
      sessionId: 'sess-1',
    });
    const adminRes = await GET(
      new Request('http://localhost/api/admissions?query=MCU-FB-2570-0001', {
        headers: { cookie: `mcu_session_token=${encodeURIComponent(adminToken)}` },
      })
    );
    const adminJson = await adminRes.json();
    expect(adminRes.status).toBe(200);
    expect(adminJson.data.citizenId).toBe('1349900123456');
  });

  it('validates required fields on apply and enforces ADMIN/OFFICER RBAC on update', async () => {
    const badApply = await POST(
      new Request('http://localhost/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', firstName: 'สมชาย' }),
      })
    );
    expect(badApply.status).toBe(400);

    const unauthUpdate = await POST(
      new Request('http://localhost/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: 'adm-1', status: 'DOC_VERIFIED' }),
      })
    );
    expect(unauthUpdate.status).toBe(403);
  });
});
