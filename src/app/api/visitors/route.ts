import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import { getVisitorStats, recordVisitorVisit, resetVisitorStats } from '@/lib/data-store';
import { requireAdminOrOfficer } from '@/lib/server-auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    let visitorId = '';
    if (request && request.url) {
      try {
        const { searchParams } = new URL(request.url);
        visitorId = searchParams.get('visitorId') || '';
      } catch {
        // ignore malformed URL
      }
    }
    const stats = await getVisitorStats(visitorId);
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

    // Support resetting counter via POST action: 'reset'
    if (body.action === 'reset') {
      const auth = requireAdminOrOfficer(request);
      if (auth.response) return auth.response;

      const resetResult = await resetVisitorStats();
      return NextResponse.json({
        success: true,
        message: 'รีเซ็ตสถิติผู้เข้าชมเว็บไซต์กลับเป็น 0 เรียบร้อยแล้ว',
        ...resetResult,
      });
    }

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

export async function DELETE(request: Request) {
  try {
    const auth = requireAdminOrOfficer(request);
    if (auth.response) return auth.response;

    const resetResult = await resetVisitorStats();
    return NextResponse.json({
      success: true,
      message: 'รีเซ็ตสถิติผู้เข้าชมเว็บไซต์กลับเป็น 0 เรียบร้อยแล้ว',
      ...resetResult,
    });
  } catch (err: unknown) {
    console.error('[DELETE /api/visitors] Error:', err);
    return NextResponse.json(
      { success: false, error: getErrorMessage(err) },
      { status: 500 }
    );
  }
}
