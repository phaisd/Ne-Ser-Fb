import { NextResponse } from 'next/server';
import { getAttendanceRecords, saveAttendanceBatch } from '@/lib/data-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get('courseCode') || undefined;
    const date = searchParams.get('date') || undefined;

    const list = await getAttendanceRecords(courseCode, date);
    return NextResponse.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, error: 'No attendance records provided' }, { status: 400 });
    }

    const savedCount = await saveAttendanceBatch(records);
    return NextResponse.json({ success: true, count: savedCount });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
