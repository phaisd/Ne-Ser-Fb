import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/utils/error';

export { getErrorMessage };

/**
 * Builds a consistent JSON error NextResponse from an unknown caught error.
 */
export function apiErrorResponse(
  error: unknown,
  status = 500,
  fallback = 'เกิดข้อผิดพลาดภายในระบบ'
): NextResponse {
  return NextResponse.json(
    { success: false, error: getErrorMessage(error, fallback) },
    { status }
  );
}
