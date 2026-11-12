import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import { getVisitorStats, recordVisitorVisit } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getVisitorStats();
    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (err: unknown) {
    console.error('[GET /api/visitors] Error:', err);
    return NextResponse.json(
      { success: false, error: getErrorMessage(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const visitorId = typeof body.visitorId === 'string' ? body.visitorId : '';
    const pagePath = typeof body.path === 'string' ? body.path : '/';
    const result = await recordVisitorVisit(visitorId, pagePath);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    console.error('[POST /api/visitors] Error:', err);
    return NextResponse.json(
      { success: false, error: getErrorMessage(err) },
      { status: 500 }
    );
  }
}
