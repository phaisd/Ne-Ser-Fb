import { NextResponse } from 'next/server';
import { getStudents, updateStudent, batchUpdateStudents } from '@/lib/data-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const year = searchParams.get('year');
    const major = searchParams.get('major');
    const program = searchParams.get('program');
    const status = searchParams.get('status');

    let list = await getStudents();

    if (query) {
      list = list.filter(
        (s) =>
          s.studentCode?.toLowerCase().includes(query) ||
          s.firstName?.toLowerCase().includes(query) ||
          s.lastName?.toLowerCase().includes(query) ||
          s.fullName?.toLowerCase().includes(query) ||
          s.passportNo?.toLowerCase().includes(query) ||
          s.nationality?.toLowerCase().includes(query) ||
          s.remarks?.toLowerCase().includes(query)
      );
    }

    if (year && year !== 'ALL') {
      const yearNum = parseInt(year, 10);
      list = list.filter((s) => s.yearLevel === yearNum);
    }

    if (major && major !== 'ALL') {
      list = list.filter((s) => s.major === major);
    }

    if (program && program !== 'ALL') {
      list = list.filter((s) => s.programType === program);
    }

    if (status && status !== 'ALL') {
      list = list.filter((s) => s.studyStatus === status);
    }

    return NextResponse.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const studentCode = body.studentCode || body.updates?.studentCode;

    if (!studentCode) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุรหัสนิสิต (studentCode)' }, { status: 400 });
    }

    const updates = body.updates && typeof body.updates === 'object'
      ? { ...body.updates }
      : { ...body };
    delete updates.studentCode;

    const updated = await updateStudent(studentCode, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลนิสิตตามรหัสที่ระบุ' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, items, mode, updates } = body;

    const listToUpdate: any[] = Array.isArray(items) 
      ? items 
      : Array.isArray(updates) 
      ? updates 
      : body.students && Array.isArray(body.students)
      ? body.students
      : null;

    if (!listToUpdate || listToUpdate.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบรายการข้อมูลนิสิตสำหรับอัปเดต (ต้องเป็น Array ของข้อมูลนิสิต)' },
        { status: 400 }
      );
    }

    const result = await batchUpdateStudents(listToUpdate, mode || 'UPDATE_ONLY');
    return NextResponse.json({
      success: true,
      message: `อัปเดตข้อมูลสำเร็จ ${result.updated} คน, เพิ่มใหม่ ${result.added} คน`,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
