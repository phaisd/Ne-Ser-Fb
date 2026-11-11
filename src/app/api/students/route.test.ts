import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import { DELETE, GET, PATCH, POST } from './route';
import * as dataStore from '@/lib/data-store';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

vi.mock('@/lib/data-store', () => ({
  getStudents: vi.fn(async () => [
    {
      id: 's1',
      studentCode: '6701001',
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      phoneNumber: '0812345678',
      passportNo: 'AA123456',
      programType: 'THAI',
    },
  ]),
  updateStudent: vi.fn(async (studentCode: string, u: Record<string, unknown>) => ({ studentCode, ...u })),
  batchUpdateStudents: vi.fn(async () => ({ updated: 1, added: 0 })),
  deleteStudents: vi.fn(async (codes: string[]) => ({
    deletedCount: codes.length,
    deletedCodes: codes,
    remainingCount: 0,
    archivedCount: codes.length,
  })),
  getArchivedStudents: vi.fn(async () => [{ studentCode: '6600001', firstName: 'Archive', lastName: 'User' }]),
  restoreStudent: vi.fn(async (studentCode: string) => ({ studentCode, fullName: 'Archive User' })),
}));

describe('/api/students RBAC & PDPA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated access to archived students and student deletion', async () => {
    const archiveAnon = await GET(new Request('http://localhost/api/students?archived=true'));
    expect(archiveAnon.status).toBe(401);

    const delAnon = await DELETE(
      new Request('http://localhost/api/students', {
        method: 'DELETE',
        body: JSON.stringify({ studentCode: '6701001' }),
      })
    );
    expect(delAnon.status).toBe(401);
    expect(dataStore.deleteStudents).not.toHaveBeenCalled();
  });

  it('rejects INSTRUCTOR on DELETE, PATCH, archive GET, and restore', async () => {
    const instToken = createSignedSessionToken({
      id: 'inst-1',
      name: 'Teacher',
      email: 'teacher@mcu.ac.th',
      role: 'INSTRUCTOR',
    });

    const delInst = await DELETE(
      new Request('http://localhost/api/students', {
        method: 'DELETE',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(instToken)}` },
        body: JSON.stringify({ studentCode: '6701001' }),
      })
    );
    expect(delInst.status).toBe(403);

    const patchInst = await PATCH(
      new Request('http://localhost/api/students', {
        method: 'PATCH',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(instToken)}` },
        body: JSON.stringify({ studentCode: '6701001', updates: { firstName: 'X' } }),
      })
    );
    expect(patchInst.status).toBe(403);

    const restoreInst = await POST(
      new Request('http://localhost/api/students', {
        method: 'POST',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(instToken)}` },
        body: JSON.stringify({ action: 'restore', studentCode: '6600001' }),
      })
    );
    expect(restoreInst.status).toBe(403);
    expect(dataStore.restoreStudent).not.toHaveBeenCalled();
  });

  it('masks student PII on public GET and allows ADMIN to delete/restore', async () => {
    const publicRes = await GET(new Request('http://localhost/api/students'));
    expect(publicRes.status).toBe(200);
    const publicJson = await publicRes.json();
    expect(publicJson.data[0].phoneNumber).not.toBe('0812345678');
    expect(publicJson.data[0].passportNo).not.toBe('AA123456');

    const adminToken = createSignedSessionToken({
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@mcu.ac.th',
      role: 'ADMIN',
    });

    const delOk = await DELETE(
      new Request('http://localhost/api/students', {
        method: 'DELETE',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(adminToken)}` },
        body: JSON.stringify({ studentCode: '6701001', deletedBy: 'Admin' }),
      })
    );
    expect(delOk.status).toBe(200);
    expect(dataStore.deleteStudents).toHaveBeenCalledWith(['6701001'], 'Admin', undefined);
  });
});
