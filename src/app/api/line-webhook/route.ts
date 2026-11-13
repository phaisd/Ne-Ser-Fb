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
  postback?: {
    data: string;
    params?: Record<string, string>;
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

      // Handle Postback actions (e.g. [✅ รับเรื่องแล้ว] button clicked by staff)
      if (event.type === 'postback') {
        const postbackData = event.postback?.data || '';
        const params = new URLSearchParams(postbackData);
        const action = params.get('action');

        if (action === 'acknowledge') {
          const studentCode = params.get('studentCode') || '';
          const studentName = decodeURIComponent(params.get('studentName') || '');
          const nowBkk = new Date().toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          // Fetch the staff member's display name from LINE API
          let staffName = 'เจ้าหน้าที่ดูแลระบบ';
          const senderUserId = event.source?.userId;
          const groupId = event.source?.groupId || event.source?.roomId;

          if (senderUserId) {
            try {
              let profileRes: Response | null = null;
              if (groupId) {
                profileRes = await fetch(
                  `https://api.line.me/v2/bot/group/${groupId}/member/${senderUserId}`,
                  { headers: { Authorization: `Bearer ${channelToken}` } }
                ).catch(() => null);
              }

              if (!profileRes || !profileRes.ok) {
                profileRes = await fetch(
                  `https://api.line.me/v2/bot/profile/${senderUserId}`,
                  { headers: { Authorization: `Bearer ${channelToken}` } }
                ).catch(() => null);
              }

              if (profileRes && profileRes.ok) {
                const profileData = await profileRes.json().catch(() => ({}));
                if (profileData?.displayName) {
                  staffName = `คุณ ${profileData.displayName}`;
                }
              }
            } catch (pErr) {
              console.error('[LINE Webhook] Failed to fetch staff profile:', pErr);
            }
          }

          const replyMsg = `✅ [รับเรื่องเรียบร้อยแล้ว]\n━━━━━━━━━━━━━━━━━━━━\n👮 ผู้รับเรื่อง: ${staffName}\n👤 คำร้องของ: ${studentName || studentCode}\n🆔 รหัสนิสิต: ${studentCode}\n⏰ เวลารับเรื่อง: ${nowBkk} น.\n━━━━━━━━━━━━━━━━━━━━\n📌 บันทึกผู้รับเรื่องเรียบร้อยแล้ว กำลังดำเนินการตรวจสอบเอกสารในระบบครับ ขอบคุณครับ 🙏`;

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
            console.error('[LINE Webhook] Failed to reply acknowledge postback:', fetchErr);
          }
          continue;
        }
      }

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
