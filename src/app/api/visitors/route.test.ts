import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

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
});
