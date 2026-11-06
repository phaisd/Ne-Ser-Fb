import { NextResponse } from 'next/server';
import { verifyCertificateDocument, getRetentionSummary } from '@/lib/data-store';
import QRCode from 'qrcode';

export async function GET(request: Request) {
  try {
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
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
