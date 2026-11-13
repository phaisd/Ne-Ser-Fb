import { NextResponse } from 'next/server';
import { getSystemSettings, updateSystemSettings } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

interface LineWebhookEvent {
  type: string;
  replyToken?: string;
  source?: {
    type: string;
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  message?: {
    type: string;
    id: string;
    text?: string;
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const events: LineWebhookEvent[] = Array.isArray(body?.events) ? body.events : [];
    const settings = await getSystemSettings();
    const channelToken = (settings.lineChannelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || '').trim();

    for (const event of events) {
      const userId = event.source?.userId || event.source?.groupId || event.source?.roomId;
      const replyToken = event.replyToken;

      if (!replyToken || !channelToken || !userId) continue;

      if (event.type === 'follow' || event.type === 'message') {
        const text = (event.message?.text || '').trim();
        let replyMsg = '';

        if (text.includes('เชื่อมต่อ') || text.includes('ลงทะเบียน') || text.toLowerCase() === 'connect') {
          // Auto-save this userId as target recipient in system settings
          await updateSystemSettings({ lineTargetUserId: userId });
          replyMsg = `✅ เชื่อมต่อระบบสำเร็จ!\n\nระบบบริการการศึกษา คณะพุทธศาสตร์ ได้บันทึกรหัสของคุณ:\n🆔 ${userId}\n\nเป็นผู้รับการแจ้งเตือนคำร้องหนังสือรับรองเรียบร้อยแล้ว เมื่อมีคำร้องใหม่หรือการอนุมัติคำร้อง ระบบจะส่งข้อความแจ้งเตือนมายังบัญชีนี้ทันทีครับ 🎓`;
        } else {
          replyMsg = `🔔 [ระบบบริการการศึกษา คณะพุทธศาสตร์ มจร]\n\nสวัสดีครับ รหัส LINE User ID ของคุณคือ:\n🆔 ${userId}\n\n📌 วิธีเชื่อมต่อรับแจ้งเตือนคำร้อง:\n1. พิมพ์คำว่า "เชื่อมต่อ" เพื่อบันทึกบัญชีนี้เป็นผู้รับแจ้งเตือนอัตโนมัติ\n2. หรือคัดลอกรหัส User ID ด้านบนไปใส่ในช่อง "Target User ID" ในหน้าจัดการระบบ (/admin)`;
        }

        try {
          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${channelToken}`,
            },
            body: JSON.stringify({
              replyToken,
              messages: [{ type: 'text', text: replyMsg }],
            }),
          });
        } catch (fetchErr) {
          console.error('[LINE Webhook] Failed to send reply message:', fetchErr);
        }
      }
    }

    // LINE requires HTTP 200 OK
    return NextResponse.json({ success: true, count: events.length });
  } catch (err: unknown) {
    console.error('[LINE Webhook] Handler error:', err);
    return NextResponse.json({ success: true });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'LINE Webhook endpoint is active',
    description: 'Endpoint for LINE Messaging API Webhooks to auto-identify user/group IDs',
    webhookUrl: 'https://ne-ser-fb.vercel.app/api/line-webhook',
  });
}
