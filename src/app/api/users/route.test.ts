import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import { GET, POST } from './route';
import * as dataStore from '@/lib/data-store';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

vi.mock('@/lib/data-store', () => ({
  getInstructorAccounts: vi.fn(async () => []),
  scanTimetableInstructors: vi.fn(),
  batchProvisionInstructors: vi.fn(),
  batchImportInstructors: vi.fn(),
  updateUserRole: vi.fn(async () => true),
  resetUserPassword: vi.fn(async () => true),
  updateInstructorPassword: vi.fn(async () => true),
  createUserAccount: vi.fn(),
  updateUserProfile: vi.fn(async (_id: string, updates: any) => ({
    id: 'inst-72',
    name: updates.name || 'Teacher',
    email: updates.email || 'teacher44@mcu.ac.th',
    role: updates.role || 'INSTRUCTOR',
  })),
  toggleUserSuspension: vi.fn(),
  archiveInstructors: vi.fn(),
  getArchivedInstructors: vi.fn(async () => []),
  restoreInstructor: vi.fn(),
  deleteInstructorPermanent: vi.fn(),
}));

describe('/api/users RBAC & security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated GET and POST requests with 401', async () => {
    const getRes = await GET(new Request('http://localhost/api/users'));
    expect(getRes.status).toBe(401);

    const postRes = await POST(
      new Request('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify({ action: 'update-role', userId: 'inst-2', newRole: 'SUPER_ADMIN' }),
      })
    );
    expect(postRes.status).toBe(401);
  });

  it('prevents instructor from escalating their own role via update-profile or calling update-role', async () => {
    const instToken = createSignedSessionToken({
      id: 'inst-72',
      name: 'Teacher',
      email: 'teacher44@mcu.ac.th',
      role: 'INSTRUCTOR',
    });

    // Self-escalation via update-role -> 403
    const roleRes = await POST(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(instToken)}` },
        body: JSON.stringify({ action: 'update-role', userId: 'inst-72', newRole: 'SUPER_ADMIN' }),
      })
    );
    expect(roleRes.status).toBe(403);
    expect(dataStore.updateUserRole).not.toHaveBeenCalled();

    // Self-profile edit strips privileged role/isSuperAdmin fields
    const profileRes = await POST(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(instToken)}` },
        body: JSON.stringify({
          action: 'update-profile',
          userId: 'inst-72',
          updates: { name: 'Updated Name', role: 'SUPER_ADMIN', isSuperAdmin: true },
        }),
      })
    );
    expect(profileRes.status).toBe(200);
    expect(dataStore.updateUserProfile).toHaveBeenCalledTimes(1);
    const passedUpdates = vi.mocked(dataStore.updateUserProfile).mock.calls[0][1];
    expect(passedUpdates.role).toBeUndefined();
    expect(passedUpdates.isSuperAdmin).toBeUndefined();

    // Editing another instructor's profile -> 403
    const otherRes = await POST(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(instToken)}` },
        body: JSON.stringify({ action: 'update-profile', userId: 'inst-other', updates: { name: 'Hack' } }),
      })
    );
    expect(otherRes.status).toBe(403);
  });

  it('allows ADMIN to update role (excluding SUPER_ADMIN) and SUPER_ADMIN to assign SUPER_ADMIN', async () => {
    const adminToken = createSignedSessionToken({
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@mcu.ac.th',
      role: 'ADMIN',
    });
    const superToken = createSignedSessionToken({
      id: 'inst-1',
      name: 'Super',
      email: 'phaisal.dis@mcu.ac.th',
      role: 'SUPER_ADMIN',
    });

    const promoteFail = await POST(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(adminToken)}` },
        body: JSON.stringify({ action: 'update-role', userId: 'inst-2', newRole: 'SUPER_ADMIN' }),
      })
    );
    expect(promoteFail.status).toBe(403);

    const promoteOk = await POST(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(superToken)}` },
        body: JSON.stringify({ action: 'update-role', userId: 'inst-2', newRole: 'ADMIN' }),
      })
    );
    expect(promoteOk.status).toBe(200);
    expect(dataStore.updateUserRole).toHaveBeenCalledWith('inst-2', 'ADMIN');
  });
});
