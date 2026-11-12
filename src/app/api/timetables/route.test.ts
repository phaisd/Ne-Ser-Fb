import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/data-store', () => ({
  getInstructors: vi.fn(async () => [{ id: 'i1', name: 'พระมหาสมชาย' }]),
  getTimetables: vi.fn(async () => [
    { id: 't1', yearLevel: 1, dayOfWeek: 1, instructor: 'พระมหาสมชาย' },
    { id: 't2', yearLevel: 2, dayOfWeek: 3, instructor: 'ดร.ดวงดี' },
  ]),
}));

describe('/api/timetables', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns instructors when action=instructors', async () => {
    const res = await GET(new Request('http://localhost/api/timetables?action=instructors'));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.count).toBe(1);
  });

  it('filters timetables by yearLevel, day, and instructor', async () => {
    const res = await GET(
      new Request('http://localhost/api/timetables?yearLevel=2&day=3&instructor=%E0%B8%94%E0%B8%A7%E0%B8%87%E0%B8%94%E0%B8%B5')
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.count).toBe(1);
    expect(json.data[0].id).toBe('t2');
  });
});
