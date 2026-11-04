import { NextResponse } from 'next/server';
import { getAcademicYearArchives, archiveAcademicYear } from '@/lib/data-store';

export async function GET() {
  try {
    const archives = await getAcademicYearArchives();
    return NextResponse.json({ success: true, data: archives });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { year } = body;
    if (!year) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุปีการศึกษา' }, { status: 400 });
    }
    const record = await archiveAcademicYear(String(year));
    return NextResponse.json({ success: true, data: record });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
