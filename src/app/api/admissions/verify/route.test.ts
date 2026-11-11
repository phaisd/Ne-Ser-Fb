import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

vi.mock('@/services/storageHelper', () => ({
  readLocalJson: vi.fn(async (file: string) => {
    if (file === 'system_settings.json') return { admissionPeriodOpen: true };
    return [
      {
        applicationNo: 'APP-6901',
        idCardOrPassport: '1100100100101',
        fullName: 'พระมหาทดสอบ ธรรมจารี',
      },
    ];
  }),
}));

describe('/api/admissions/verify validation & rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when required fields are missing and 200 on valid candidate', async () => {
    const badRes = await POST(
      new Request('http://localhost/api/admissions/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.50',
        },
        body: JSON.stringify({ applicationNo: 'APP-6901' }),
      })
    );
    expect(badRes.status).toBe(400);

    const okRes = await POST(
      new Request('http://localhost/api/admissions/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.50',
        },
        body: JSON.stringify({
          applicationNo: 'app-6901',
          idCardOrPassport: '1100100100101',
        }),
      })
    );
    const data = await okRes.json();
    expect(okRes.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.applicationNo).toBe('APP-6901');
  });

  it('enforces rate limiting after repeated requests from same IP', async () => {
    const ip = '203.0.113.99';
    for (let i = 0; i < 20; i++) {
      const r = await POST(
        new Request('http://localhost/api/admissions/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
          body: JSON.stringify({ applicationNo: 'X', idCardOrPassport: 'Y' }),
        })
      );
      expect(r.status).toBe(404);
    }

    const blocked = await POST(
      new Request('http://localhost/api/admissions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
        body: JSON.stringify({ applicationNo: 'X', idCardOrPassport: 'Y' }),
      })
    );
    expect(blocked.status).toBe(429);
  });
});
