import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST, DELETE } from './route';

vi.mock('@/lib/server-auth-guard', () => ({
  requireAdminOrOfficer: vi.fn(() => ({
    user: { id: 'admin-1', role: 'ADMIN', name: 'Admin', email: 'admin@mcu.ac.th' },
  })),
}));

vi.mock('@/lib/data-store', () => ({
  getVisitorStats: vi.fn(async () => ({
    totalVisits: 10,
    todayVisits: 3,
    uniqueVisitors: 8,
  })),
  recordVisitorVisit: vi.fn(async () => ({
    totalVisits: 11,
    todayVisits: 4,
    uniqueVisitors: 9,
    counted: true,
  })),
  resetVisitorStats: vi.fn(async () => ({
    totalVisits: 0,
    todayVisits: 0,
    uniqueVisitors: 0,
    onlineCount: 0,
  })),
}));

describe('/api/visitors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns visitor stats on GET', async () => {
    const res = await GET(new Request('http://localhost/api/visitors?visitorId=test-1'));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.totalVisits).toBe(10);
    expect(json.todayVisits).toBe(3);
  });

  it('records a visit on POST', async () => {
    const res = await POST(
      new Request('http://localhost/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: 'dev-1', path: '/enroll' }),
      })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.counted).toBe(true);
    expect(json.totalVisits).toBe(11);
  });

  it('resets visitor stats on DELETE', async () => {
    const res = await DELETE(new Request('http://localhost/api/visitors', { method: 'DELETE' }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.totalVisits).toBe(0);
  });

  it('resets visitor stats on POST with action: reset', async () => {
    const res = await POST(
      new Request('http://localhost/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.totalVisits).toBe(0);
  });
});
