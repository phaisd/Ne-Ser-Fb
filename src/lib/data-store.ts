/**
 * Data Store Facade
 * 
 * Re-exports domain services, models, and utilities.
 * Ensures 100% backward compatibility for all API routes and components.
 */

export * from '@/types';
export * from '@/services';
export * from '@/lib/utils';

// Backward-compatible alias helpers
export function maskPassportNumber(no?: string): string {
  if (!no) return '';
  const clean = no.trim();
  if (clean.length <= 4) return '••••';
  return `${clean.slice(0, 2)}••••${clean.slice(-2)}`;
}

export function maskCitizenId(id?: string): string {
  if (!id) return '';
  const clean = id.trim();
  if (clean.length < 6) return '••••••••';
  return `${clean.slice(0, 1)}-••••-•••••-${clean.slice(-2)}`;
}
