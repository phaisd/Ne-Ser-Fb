import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSignedSessionToken } from '@/lib/auth-security';
import { GET, POST } from './route';
import * as services from '@/services';

vi.mock('@/lib/session-manager', () => ({
  validateUserSession: vi.fn(() => ({ valid: true, conflict: false })),
}));

vi.mock('@/services', () => ({
  getEvents: vi.fn(async () => []),
  getEventRegistrations: vi.fn(async () => []),
  registerStudentForEvent: vi.fn(async (d: Record<string, unknown>) => ({ id: 'reg-1', ...d })),
  checkInEventStudent: vi.fn(async () => undefined),
  createEvent: vi.fn(async (d: Record<string, unknown>) => ({ id: 'ev-new', ...d })),
  updateEvent: vi.fn(async () => undefined),
  deleteEvent: vi.fn(async () => true),
  saveVipassanaAttendance: vi.fn(async () => undefined),
  batchImportEventRegistrations: vi.fn(async () => ({
    importedCount: 2,
    skippedCount: 0,
    replacedCount: 0,
    items: [],
  })),
}));

describe('/api/events RBAC & batch group import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides registrations from unauthenticated GET and protects action=registrations', async () => {
    vi.mocked(services.getEventRegistrations).mockResolvedValueOnce([
      { id: 'reg-1', eventId: 'ev-1', studentCode: '6701001', studentName: 'นิสิต', status: 'REGISTERED', createdAt: '' },
    ]);

    const anonRes = await GET(new Request('http://localhost/api/events'));
    const anonJson = await anonRes.json();
    expect(anonRes.status).toBe(200);
    expect(anonJson.registrations).toEqual([]);

    const anonRegsRes = await GET(new Request('http://localhost/api/events?action=registrations'));
    expect(anonRegsRes.status).toBe(401);
  });

  it('rejects unauthenticated batch_import_registrations and create_event', async () => {
    const batchAnon = await POST(
      new Request('http://localhost/api/events', {
        method: 'POST',
        body: JSON.stringify({
          action: 'batch_import_registrations',
          eventId: 'ev-1',
          items: [{ studentCode: 'T321', studentName: 'Test' }],
        }),
      })
    );
    expect(batchAnon.status).toBe(401);

    const createAnon = await POST(
      new Request('http://localhost/api/events', {
        method: 'POST',
        body: JSON.stringify({ action: 'create_event', eventData: { title: 'Test' } }),
      })
    );
    expect(createAnon.status).toBe(401);
  });

  it('allows INSTRUCTOR/STAFF to run batch_import_registrations', async () => {
    const instToken = createSignedSessionToken({
      id: 'inst-1',
      name: 'Teacher',
      email: 'teacher@mcu.ac.th',
      role: 'INSTRUCTOR',
    });

    const res = await POST(
      new Request('http://localhost/api/events', {
        method: 'POST',
        headers: { cookie: `mcu_session_token=${encodeURIComponent(instToken)}` },
        body: JSON.stringify({
          action: 'batch_import_registrations',
          eventId: 'ev-1',
          items: [
            { studentCode: 'T321', studentName: 'A', groupNumber: 3 },
            { studentCode: 'T322', studentName: 'B', groupNumber: 3 },
          ],
          mode: 'APPEND',
        }),
      })
    );
    expect(res.status).toBe(200);
    expect(services.batchImportEventRegistrations).toHaveBeenCalledWith(
      'ev-1',
      expect.any(Array),
      'APPEND'
    );
  });
});
