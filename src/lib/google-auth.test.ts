import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyGoogleIdToken } from './google-auth';

describe('verifyGoogleIdToken', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('rejects malformed or non-JWT credentials before hitting network', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const emptyRes = await verifyGoogleIdToken('');
    expect(emptyRes.valid).toBe(false);

    const plainRes = await verifyGoogleIdToken('not-a-jwt-token');
    expect(plainRes.valid).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects mismatched client audience, expired tokens, or unverified emails', async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          email: 'user@gmail.com',
          email_verified: 'true',
          aud: 'other-client-id.apps.googleusercontent.com',
          iss: 'https://accounts.google.com',
          exp: futureExp,
        }),
        { status: 200 }
      )
    ) as unknown as typeof fetch;

    const wrongAud = await verifyGoogleIdToken('a.b.c', 'expected-client-id');
    expect(wrongAud.valid).toBe(false);

    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          email: 'user@gmail.com',
          email_verified: 'false',
          aud: 'expected-client-id',
          iss: 'https://accounts.google.com',
          exp: futureExp,
        }),
        { status: 200 }
      )
    ) as unknown as typeof fetch;

    const unverified = await verifyGoogleIdToken('a.b.c', 'expected-client-id');
    expect(unverified.valid).toBe(false);
  });

  it('accepts valid verified Google tokeninfo payloads', async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          email: 'Lecturer@MCU.AC.TH',
          email_verified: 'true',
          aud: 'client-123',
          iss: 'https://accounts.google.com',
          exp: futureExp,
        }),
        { status: 200 }
      )
    ) as unknown as typeof fetch;

    const res = await verifyGoogleIdToken('header.payload.signature', 'client-123');
    expect(res).toEqual({ valid: true, email: 'lecturer@mcu.ac.th' });
  });
});
