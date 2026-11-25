import { describe, it, expect } from 'vitest';
import { getStatusBadgeConfig } from './StatusBadge';

describe('StatusBadge Config & Helper', () => {
  it('returns correct config for PRESENT status', () => {
    const config = getStatusBadgeConfig('PRESENT');
    expect(config.defaultLabel).toBe('มาเรียน');
    expect(config.subtle).toContain('bg-emerald-50');
    expect(config.solid).toContain('bg-emerald-600');
  });

  it('returns correct config for LATE status', () => {
    const config = getStatusBadgeConfig('LATE');
    expect(config.defaultLabel).toBe('มาสาย');
    expect(config.solid).toContain('bg-amber-500');
  });

  it('returns correct config for ABSENT status', () => {
    const config = getStatusBadgeConfig('ABSENT');
    expect(config.defaultLabel).toBe('ขาดเรียน');
    expect(config.subtle).toContain('bg-rose-50');
  });

  it('returns correct config for Exam Eligibility statuses', () => {
    const eligible = getStatusBadgeConfig('ELIGIBLE');
    expect(eligible.defaultLabel).toBe('มีสิทธิ์สอบ');

    const warning = getStatusBadgeConfig('WARNING');
    expect(warning.defaultLabel).toBe('เฝ้าระวัง/เสี่ยงหมดสิทธิ์');

    const ineligible = getStatusBadgeConfig('INELIGIBLE');
    expect(ineligible.defaultLabel).toBe('หมดสิทธิ์สอบ');
  });

  it('handles unknown status gracefully with default config', () => {
    const unknown = getStatusBadgeConfig('UNKNOWN_XYZ');
    expect(unknown.defaultLabel).toBe('ไม่ระบุ');
    expect(unknown.solid).toContain('bg-slate-600');
  });
});
