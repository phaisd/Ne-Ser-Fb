import { NextResponse } from 'next/server';
import {
  getCertificateRequests,
  getCertificateTypes,
  createCertificateRequest,
  updateCertificateRequest,
  deleteCertificateRequest,
  clearMockApprovedRequests,
  syncCertificateRequestsToSheets,
} from '@/lib/data-store';
import { sendNotification } from '@/lib/notifier';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'types') {
      const types = await getCertificateTypes();
      return NextResponse.json({ success: true, data: types });
    }

    const studentCode = searchParams.get('studentCode')?.trim();
    let list = await getCertificateRequests();

    if (studentCode) {
      list = list.filter((r) => r.studentCode === studentCode);
    }

    return NextResponse.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'sync_sheets' || action === 'sync-sheets') {
      const result = await syncCertificateRequestsToSheets();
      return NextResponse.json(result);
    }

    const body = await request.json();

    if (body.action === 'sync_sheets' || body.action === 'sync-sheets') {
      const result = await syncCertificateRequestsToSheets();
      return NextResponse.json(result);
    }

    const { studentCode, fullName, certType, degreeLevel, major, requestPurpose, email, phone, ...rest } = body;

    if (!studentCode || !fullName || !certType) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' }, { status: 400 });
    }

    const newReq = await createCertificateRequest({
      studentCode,
      fullName,
      certType,
      degreeLevel: degreeLevel || '',
      major: major || '',
      requestPurpose: requestPurpose || certType,
      status: 'PENDING',
      email: email || '',
      phone: phone || '',
      ...rest,
    });

    // Trigger Notification for new request
    sendNotification({
      toEmail: email,
      studentName: fullName,
      studentCode,
      certType,
      status: 'PENDING',
    }).catch((e) => console.error('Notification error:', e));

    return NextResponse.json({ success: true, data: newReq });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, docNo, ...rest } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุ id ของคำร้อง' }, { status: 400 });
    }

    const updated = await updateCertificateRequest(id, {
      status,
      docNo,
      ...rest,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'ไม่พบคำร้องตาม id ที่ระบุ' }, { status: 404 });
    }

    // Trigger Notification for status update (Approved / Rejected)
    if (status) {
      sendNotification({
        toEmail: updated.email,
        studentName: updated.fullName,
        studentCode: updated.studentCode,
        docNo: updated.docNo,
        certType: updated.certType,
        status: status as any,
        rejectReason: (rest as any).rejectReason || (rest as any).note,
      }).catch((e) => console.error('Notification error on PATCH:', e));
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    let id = searchParams.get('id');

    if (!id && !action) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {}
    }

    if (action === 'clear_mock' || action === 'clear-mock' || action === 'clear_approved') {
      const result = await clearMockApprovedRequests();
      return NextResponse.json({
        success: true,
        message: `ล้างข้อมูลทดสอบเรียบร้อยแล้ว (${result.deletedCount} รายการ)`,
        deletedCount: result.deletedCount,
        remainingCount: result.remainingCount,
      });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุ id ของคำร้องที่ต้องการลบ' }, { status: 400 });
    }

    const deleted = await deleteCertificateRequest(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'ไม่พบคำร้องที่ต้องการลบ' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'ลบคำร้องเรียบร้อยแล้ว', id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
