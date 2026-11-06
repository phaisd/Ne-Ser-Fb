import { NextResponse } from 'next/server';
import {
  getAttendanceRecords,
  saveAttendanceBatch,
  deleteAttendanceRecord,
  clearAttendanceRecords,
} from '@/lib/data-store';

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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (action === 'clear-all') {
      const deletedCount = await clearAttendanceRecords('all');
      return NextResponse.json({
        success: true,
        deletedCount,
        message: 'ล้างข้อมูลประวัติการเช็คชื่อทั้งหมดเรียบร้อยแล้ว',
      });
    }

    if (action === 'clear-invalid') {
      const deletedCount = await clearAttendanceRecords('invalid');
      return NextResponse.json({
        success: true,
        deletedCount,
        message: 'ล้างข้อมูลตัวอย่างที่ไม่สมบูรณ์เรียบร้อยแล้ว',
      });
    }

    if (id) {
      await deleteAttendanceRecord(id);
      return NextResponse.json({
        success: true,
        message: 'ลบรายการเช็คชื่อเรียบร้อยแล้ว',
      });
    }

    return NextResponse.json({ success: false, error: 'กรุณาระบุ id หรือ action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
