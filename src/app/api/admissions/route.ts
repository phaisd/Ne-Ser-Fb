import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import {
  getAdmissionApplications,
  createAdmissionApplication,
  updateAdmissionApplication,
  confirmAdmissionEnrollment,
  transferAdmissionToStudentRegistry,
  deleteAdmissionApplication,
  maskCitizenId,
  maskPassportNumber,
} from '@/lib/data-store';
import { getAuthenticatedUserFromRequest, isServerAdminOrOfficer } from '@/lib/server-auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const authUser = getAuthenticatedUserFromRequest(request);
    const isAdmin = isServerAdminOrOfficer(authUser);

    const list = await getAdmissionApplications();

    if (query) {
      const clean = query.replace(/[\s-]/g, '').trim().toLowerCase();
      const matched = list.find(
        (a) =>
          a.citizenId.replace(/[\s-]/g, '').toLowerCase() === clean ||
          (a.passportNo && a.passportNo.replace(/[\s-]/g, '').toLowerCase() === clean) ||
          a.applicationCode.replace(/[\s-]/g, '').toLowerCase() === clean ||
          a.id.toLowerCase() === clean
      );
      if (!matched) {
        return NextResponse.json(
          { success: false, error: 'ไม่พบข้อมูลใบสมัครจากเลขบัตรประชาชน/พาสปอร์ต หรือรหัสใบสมัครที่ระบุ' },
          { status: 404 }
        );
      }

      const safeRecord = isAdmin
        ? matched
        : {
            ...matched,
            citizenId:
              matched.nationalityType === 'INTERNATIONAL'
                ? maskPassportNumber(matched.citizenId)
                : maskCitizenId(matched.citizenId),
          };

      return NextResponse.json({ success: true, data: safeRecord });
    }

    if (isAdmin) {
      return NextResponse.json({ success: true, count: list.length, data: list });
    }

    // Public list (masked sensitive IDs)
    const maskedList = list.map((a) => ({
      ...a,
      citizenId:
        a.nationalityType === 'INTERNATIONAL'
          ? maskPassportNumber(a.citizenId)
          : maskCitizenId(a.citizenId),
    }));
    return NextResponse.json({ success: true, count: maskedList.length, data: maskedList });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || 'apply';

    // Public action 1: Submit new online application
    if (action === 'apply') {
      if (!body.firstName || !body.lastName || !body.citizenId || !body.phone) {
        return NextResponse.json(
          { success: false, error: 'กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน' },
          { status: 400 }
        );
      }
      const created = await createAdmissionApplication(body);
      return NextResponse.json({
        success: true,
        data: created,
        message: `บันทึกใบสมัครออนไลน์สำเร็จ รหัสใบสมัครของคุณคือ ${created.applicationCode}`,
      });
    }

    // Public action 2: Confirm online registration (Step 4)
    if (action === 'confirm_enroll') {
      const result = await confirmAdmissionEnrollment(body.query || body.citizenId || body.applicationCode || '');
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error, data: result.application },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        data: result.application,
        message: 'ยืนยันสิทธิ์และขึ้นทะเบียนนิสิตใหม่ออนไลน์เรียบร้อยแล้ว',
      });
    }

    // Admin-only actions below
    const authUser = getAuthenticatedUserFromRequest(request);
    if (!isServerAdminOrOfficer(authUser)) {
      return NextResponse.json(
        { success: false, error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบและเจ้าหน้าที่เท่านั้น' },
        { status: 403 }
      );
    }

    if (action === 'update') {
      const updated = await updateAdmissionApplication(body.id || body.applicationCode, body.updates || body);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลใบสมัคร' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: updated,
        message: `อัปเดตสถานะใบสมัคร ${updated.applicationCode} เรียบร้อยแล้ว`,
      });
    }

    if (action === 'transfer_to_registry') {
      const res = await transferAdmissionToStudentRegistry(body.id || body.applicationCode);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        studentCode: res.studentCode,
        message: `โอนย้ายผู้สมัครเข้าสู่ระบบทะเบียนนิสิตปัจจุบัน (รหัสนิสิต ${res.studentCode}) เรียบร้อยแล้ว`,
      });
    }

    if (action === 'delete') {
      await deleteAdmissionApplication(body.id || body.applicationCode);
      return NextResponse.json({
        success: true,
        message: 'ลบข้อมูลใบสมัครเรียบร้อยแล้ว',
      });
    }

    return NextResponse.json({ success: false, error: 'ไม่รองรับคำสั่งนี้' }, { status: 400 });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}
