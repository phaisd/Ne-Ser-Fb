import { NextResponse } from 'next/server';
import { sendNotification } from '@/lib/notifier';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentName, certType, toEmail } = body;

    const result = await sendNotification({
      toEmail: toEmail || 'test@mcu.ac.th',
      studentName: studentName || 'ทดสอบระบบการแจ้งเตือน',
      studentCode: '6501501001',
      certType: certType || 'หนังสือรับรองสถานภาพนิสิต',
      docNo: '077',
      status: 'APPROVED',
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
