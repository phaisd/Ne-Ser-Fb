import { describe, expect, it } from 'vitest';
import { apiErrorResponse, getErrorMessage } from '@/lib/api-error';

describe('error utilities', () => {
  it('extracts messages cleanly from Error, string, object, or unknown values', () => {
    expect(getErrorMessage(new Error('DB failed'))).toBe('DB failed');
    expect(getErrorMessage('Simple error')).toBe('Simple error');
    expect(getErrorMessage({ message: 'Object error' })).toBe('Object error');
    expect(getErrorMessage(null, 'Fallback msg')).toBe('Fallback msg');
    expect(getErrorMessage(undefined, 'Fallback msg')).toBe('Fallback msg');
  });

  it('returns standardized NextResponse JSON payloads', async () => {
    const res = apiErrorResponse(new Error('Invalid ID'), 400);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, error: 'Invalid ID' });
  });
});
