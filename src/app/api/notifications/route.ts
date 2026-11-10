import { NextResponse } from 'next/server';
import { sendNotification } from '@/lib/notifier';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      studentName,
      studentCode,
      certType,
      programLanguage,
      degreeLevel,
      major,
      requestPurpose,
      toEmail,
      phone,
    } = body || {};

    const result = await sendNotification({
      toEmail: toEmail || undefined,
      studentName: studentName || 'พระมหาทดสอบ ญาณวโร',
      studentCode: studentCode || '6501501001',
      programLanguage: programLanguage || 'หลักสูตรภาษาไทย (Thai Program)',
      degreeLevel: degreeLevel || 'ปริญญาตรี',
      major: major || 'สาขาวิชาพระพุทธศาสนา',
      certType: certType || 'หนังสือรับรองสถานภาพนิสิต',
      requestPurpose: requestPurpose || 'เพื่อเปิดบัญชีธนาคารและ Mobile Banking',
      phone: phone || '081-234-5678',
      status: 'PENDING',
      actionUrl: process.env.NEXTAUTH_URL || 'https://ne-ser-fb.vercel.app/admin',
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
