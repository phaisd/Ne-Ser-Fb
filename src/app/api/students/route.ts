import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import {
  getStudents,
  updateStudent,
  batchUpdateStudents,
  deleteStudents,
  archiveAllInactiveStudents,
  isInactiveStudyStatus,
  getArchivedStudents,
  restoreStudent,
} from '@/lib/data-store';
import {
  getAuthenticatedUserFromRequest,
  isServerAdminOrOfficer,
  maskSensitiveStudentData,
  requireAdminOrOfficer,
} from '@/lib/server-auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const year = searchParams.get('year');
    const major = searchParams.get('major');
    const program = searchParams.get('program');
    const status = searchParams.get('status');
    const isArchived = searchParams.get('archived') === 'true';

    // If requested archived/deleted students (Admin / Officer only)
    if (isArchived) {
      const adminAuth = requireAdminOrOfficer(request);
      if (adminAuth.response) return adminAuth.response;

      let archiveList = await getArchivedStudents();
      if (query) {
        archiveList = archiveList.filter(
          (s) =>
            s.studentCode?.toLowerCase().includes(query) ||
            s.firstName?.toLowerCase().includes(query) ||
            s.lastName?.toLowerCase().includes(query) ||
            s.fullName?.toLowerCase().includes(query) ||
            s.major?.toLowerCase().includes(query) ||
            s.deletionReason?.toLowerCase().includes(query)
        );
      }
      return NextResponse.json({
        success: true,
        count: archiveList.length,
        isArchived: true,
        data: archiveList,
      });
    }

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

    // Check authorization: Admin / Officer see full data; other users get PDPA-masked data
    const authUser = getAuthenticatedUserFromRequest(request);
    const isAdmin = isServerAdminOrOfficer(authUser);

    const safeList = isAdmin ? list : list.map((s) => maskSensitiveStudentData(s));

    return NextResponse.json({ success: true, count: safeList.length, data: safeList });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = getAuthenticatedUserFromRequest(request);
    if (!isServerAdminOrOfficer(authUser)) {
      return NextResponse.json(
        { success: false, error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบและเจ้าหน้าที่เท่านั้น (Unauthorized)' },
        { status: 403 }
      );
    }

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

    const wasArchived = isInactiveStudyStatus(updated.studyStatus);
    return NextResponse.json({
      success: true,
      archived: wasArchived,
      message: wasArchived
        ? `ปรับสถานะเป็น "${updated.studyStatus}" และย้ายเข้าสู่แฟ้มประวัตินิสิต (Students_Archive) เรียบร้อยแล้ว`
        : 'อัปเดตข้อมูลนิสิตสำเร็จ',
      data: updated,
    });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const authUser = getAuthenticatedUserFromRequest(request);
    // Allow Admin, Officer, or verified Teachers (who add cross-enroll students to course)
    if (!authUser || authUser.role === 'GUEST') {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบก่อนทำรายการ (Unauthorized)' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, items, mode, updates } = body;

    // Handle Restore Student from Archive (Admin / Officer only)
    if (action === 'restore') {
      const adminAuth = requireAdminOrOfficer(request);
      if (adminAuth.response) return adminAuth.response;

      const studentCode = body.studentCode;
      if (!studentCode) {
        return NextResponse.json(
          { success: false, error: 'กรุณาระบุรหัสนิสิตที่ต้องการกู้คืน (studentCode)' },
          { status: 400 }
        );
      }
      const restored = await restoreStudent(studentCode);
      if (!restored) {
        return NextResponse.json(
          { success: false, error: `ไม่พบรหัสนิสิต ${studentCode} ในแฟ้มประวัตินิสิต` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: `กู้คืนข้อมูลนิสิต ${restored.fullName || restored.studentCode} กลับเข้าสู่ทะเบียนปัจจุบันสำเร็จแล้ว`,
        data: restored,
      });
    }

    // Handle Sweep & Archive All Inactive Students (สำเร็จการศึกษา / พ้นสภาพ / ลาออก / ย้ายออก)
    if (action === 'archive-inactive') {
      const adminAuth = requireAdminOrOfficer(request);
      if (adminAuth.response) return adminAuth.response;

      const deletedBy = body.deletedBy || authUser.email || 'ผู้ดูแลระบบ (Admin)';
      const sweepRes = await archiveAllInactiveStudents(deletedBy);
      return NextResponse.json({
        success: true,
        message:
          sweepRes.archivedCount > 0
            ? `ย้ายนิสิตที่จบการศึกษา/พ้นสภาพ/ลาออก/ย้ายออก จำนวน ${sweepRes.archivedCount} รูป/คน เข้าสู่แฟ้มประวัตินิสิตเรียบร้อยแล้ว`
            : 'ไม่พบนิสิตที่มีสถานะจบการศึกษา/พ้นสภาพ/ลาออก/ย้ายออก ค้างอยู่ในทะเบียนปัจจุบัน',
        ...sweepRes,
      });
    }

    const listToUpdate: Record<string, unknown>[] | null = Array.isArray(items)
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
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const adminAuth = requireAdminOrOfficer(request);
    if (adminAuth.response) return adminAuth.response;

    const body = await request.json();
    const { studentCode, studentCodes, deletedBy, reason } = body;

    const codesToDelete: string[] = Array.isArray(studentCodes)
      ? studentCodes.map((c) => String(c).trim()).filter(Boolean)
      : studentCode
      ? [String(studentCode).trim()]
      : [];

    if (codesToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุรหัสนิสิตที่ต้องการลบ (studentCode หรือ studentCodes)' },
        { status: 400 }
      );
    }

    const result = await deleteStudents(codesToDelete, deletedBy, reason);
    return NextResponse.json({
      success: true,
      message: `ย้ายข้อมูลนิสิตเข้าสู่แฟ้มประวัติที่ถูกลบ (Students_Archive บน Google Sheets) เรียบร้อยแล้ว จำนวน ${result.deletedCount} รูป/คน`,
      deletedCount: result.deletedCount,
      deletedCodes: result.deletedCodes,
      remainingCount: result.remainingCount,
      archivedCount: result.archivedCount,
    });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}
