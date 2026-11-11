import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { sendNotification } from '@/lib/notifier';
import { requireStaffOrInstructor } from '@/lib/server-auth-guard';
import { checkRateLimit } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const auth = requireStaffOrInstructor(request);
    if (auth.response) return auth.response;

    const rate = checkRateLimit(`notifications:${auth.user.id || auth.user.email}`, 20, 5 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: `ส่งคำขอแจ้งเตือนถี่เกินกำหนด กรุณารอ ${rate.retryAfterSeconds} วินาที` },
        { status: 429 }
      );
    }

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
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}
