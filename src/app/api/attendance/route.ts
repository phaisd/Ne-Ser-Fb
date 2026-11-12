import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import {
  getAttendanceRecords,
  saveAttendanceBatch,
  deleteAttendanceRecord,
  clearAttendanceRecords,
} from '@/lib/data-store';
import { requireAdminOrOfficer, requireStaffOrInstructor } from '@/lib/server-auth-guard';

export async function GET(request: Request) {
  try {
    const auth = requireStaffOrInstructor(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get('courseCode') || undefined;
    const date = searchParams.get('date') || undefined;

    const list = await getAttendanceRecords(courseCode, date);
    return NextResponse.json({ success: true, count: list.length, data: list });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireStaffOrInstructor(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, error: 'No attendance records provided' }, { status: 400 });
    }

    const savedCount = await saveAttendanceBatch(records);
    return NextResponse.json({ success: true, count: savedCount });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (action === 'clear-all') {
      const adminAuth = requireAdminOrOfficer(request);
      if (adminAuth.response) return adminAuth.response;

      const deletedCount = await clearAttendanceRecords('all');
      return NextResponse.json({
        success: true,
        deletedCount,
        message: 'ล้างข้อมูลประวัติการเช็คชื่อทั้งหมดเรียบร้อยแล้ว',
      });
    }

    if (action === 'clear-invalid') {
      const adminAuth = requireAdminOrOfficer(request);
      if (adminAuth.response) return adminAuth.response;

      const deletedCount = await clearAttendanceRecords('invalid');
      return NextResponse.json({
        success: true,
        deletedCount,
        message: 'ล้างข้อมูลตัวอย่างที่ไม่สมบูรณ์เรียบร้อยแล้ว',
      });
    }

    const staffAuth = requireStaffOrInstructor(request);
    if (staffAuth.response) return staffAuth.response;

    if (id) {
      await deleteAttendanceRecord(id);
      return NextResponse.json({
        success: true,
        message: 'ลบรายการเช็คชื่อเรียบร้อยแล้ว',
      });
    }

    return NextResponse.json({ success: false, error: 'กรุณาระบุ id หรือ action' }, { status: 400 });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}
