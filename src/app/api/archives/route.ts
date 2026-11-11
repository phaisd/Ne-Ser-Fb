import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { getAcademicYearArchives, archiveAcademicYear } from '@/lib/data-store';
import { requireAdminOrOfficer } from '@/lib/server-auth-guard';

export async function GET() {
  try {
    const archives = await getAcademicYearArchives();
    return NextResponse.json({ success: true, data: archives });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdminOrOfficer(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { year } = body;
    if (!year) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุปีการศึกษา' }, { status: 400 });
    }
    const record = await archiveAcademicYear(String(year));
    return NextResponse.json({ success: true, data: record });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}
