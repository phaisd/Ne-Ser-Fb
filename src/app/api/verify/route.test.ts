import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/data-store', () => ({
  getRetentionSummary: vi.fn(async () => ({ total: 5, expired: 0 })),
  verifyCertificateDocument: vi.fn(async (docNo: string) => ({
    verified: docNo === 'CERT-2569-001',
    docNo,
    passportNo: 'AB123456',
  })),
}));

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(async () => 'data:image/png;base64,MOCKQR'),
  },
}));

describe('/api/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates missing docNo and returns masked passport + QR on valid docNo', async () => {
    const missing = await GET(new Request('http://localhost/api/verify'));
    expect(missing.status).toBe(400);

    const res = await GET(
      new Request('http://localhost/api/verify?docNo=CERT-2569-001', {
        headers: { 'x-forwarded-for': '127.0.0.10', host: 'localhost:3020' },
      })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.verified).toBe(true);
    expect(json.data.passportNo).toBe('AB••••56');
    expect(json.data.qrDataUrl).toBe('data:image/png;base64,MOCKQR');
  });

  it('returns retention-summary when requested', async () => {
    const res = await GET(
      new Request('http://localhost/api/verify?action=retention-summary', {
        headers: { 'x-forwarded-for': '127.0.0.11' },
      })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.total).toBe(5);
  });
});
