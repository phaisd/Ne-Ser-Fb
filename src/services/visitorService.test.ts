import { describe, expect, it, vi, beforeEach } from 'vitest';
import { computeVisitorStats, getBangkokDateStr, recordVisitorVisit } from './visitorService';

vi.mock('./storageHelper', () => {
  const storeMap: Record<string, unknown> = {};
  return {
    readLocalJson: vi.fn((file: string, fallback: unknown) => storeMap[file] !== undefined ? storeMap[file] : fallback),
    writeLocalJson: vi.fn((file: string, data: unknown) => {
      storeMap[file] = data;
    }),
    getSheetsClient: vi.fn(() => null),
  };
});

describe('visitorService real visitor tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts from 0 and computes accurate total, today, and unique counts', () => {
    expect(computeVisitorStats([])).toEqual({
      totalVisits: 0,
      todayVisits: 0,
      uniqueVisitors: 0,
    });

    const today = getBangkokDateStr();
    const summary = computeVisitorStats([
      { timestamp: '2026-11-11T01:00:00Z', dateBkk: '2026-11-11', visitorId: 'u1', path: '/' },
      { timestamp: '2026-11-12T01:00:00Z', dateBkk: today, visitorId: 'u1', path: '/' },
      { timestamp: '2026-11-12T02:00:00Z', dateBkk: today, visitorId: 'u2', path: '/enroll' },
    ]);

    expect(summary).toEqual({
      totalVisits: 3,
      todayVisits: 2,
      uniqueVisitors: 2,
    });
  });

  it('deduplicates repeated hits from the same visitorId on the same Bangkok day', async () => {
    const first = await recordVisitorVisit('device-abc', '/');
    expect(first.counted).toBe(true);
    expect(first.totalVisits).toBe(1);
    expect(first.todayVisits).toBe(1);
    expect(first.uniqueVisitors).toBe(1);

    const secondSameDay = await recordVisitorVisit('device-abc', '/courses');
    expect(secondSameDay.counted).toBe(false);
    expect(secondSameDay.totalVisits).toBe(1);

    const otherDevice = await recordVisitorVisit('device-xyz', '/');
    expect(otherDevice.counted).toBe(true);
    expect(otherDevice.totalVisits).toBe(2);
    expect(otherDevice.todayVisits).toBe(2);
    expect(otherDevice.uniqueVisitors).toBe(2);
  });
});
