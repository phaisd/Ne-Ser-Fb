import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { verifyCertificateDocument, getRetentionSummary } from '@/lib/data-store';
import { checkRateLimit } from '@/lib/security';
import QRCode from 'qrcode';

export async function GET(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for') || 'local';
    const clientIp = forwardedFor.split(',')[0].trim();
    const rate = checkRateLimit(`doc-verify:${clientIp}`, 60, 5 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `มีการตรวจสอบเอกสารบ่อยเกินกำหนด กรุณารอ ${rate.retryAfterSeconds} วินาทีแล้วลองใหม่อีกครั้ง`,
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const docNo = searchParams.get('docNo') || searchParams.get('id') || searchParams.get('query') || '';
    const action = searchParams.get('action');

    if (action === 'retention-summary') {
      const summary = await getRetentionSummary();
      return NextResponse.json({ success: true, data: summary });
    }

    if (!docNo) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุเลขที่หนังสือ หรือรหัสคำร้อง' },
        { status: 400 }
      );
    }

    const verification = await verifyCertificateDocument(docNo);

    // If passportNo exists, mask it for PDPA compliance unless authorized
    if (verification.passportNo) {
      const raw = String(verification.passportNo).trim();
      verification.passportNo = raw.length > 4 ? `${raw.slice(0, 2)}••••${raw.slice(-2)}` : '••••';
    }

    // Generate dynamic QR code data URL for this document
    let qrDataUrl = '';
    try {
      const host = request.headers.get('host') || 'localhost:3020';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const verifyUrl = `${protocol}://${host}/verify?docNo=${encodeURIComponent(verification.docNo || docNo)}`;
      qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1e1b4b', // deep indigo/slate
          light: '#ffffff',
        },
      });
    } catch (e) {
      console.warn('QR generation error:', e);
    }

    return NextResponse.json({
      success: true,
      verified: verification.verified,
      data: {
        ...verification,
        qrDataUrl,
      },
    });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}
