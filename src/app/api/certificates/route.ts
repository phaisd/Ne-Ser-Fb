import { NextResponse } from 'next/server';
import { getCertificateRequests, getCertificateTypes, createCertificateRequest, updateCertificateRequest } from '@/lib/data-store';

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
    const body = await request.json();
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

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
