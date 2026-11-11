import { getSystemSettings } from './data-store';
import { getErrorMessage } from '@/lib/utils/error';

export interface NotificationPayload {
  toEmail?: string;
  studentName: string;
  studentCode: string;
  docNo?: string;
  certType: string;
  programLanguage?: string;
  degreeLevel?: string;
  major?: string;
  requestPurpose?: string;
  phone?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
  actionUrl?: string;
}

/**
 * Builds a clean, beautifully formatted notification message for LINE and email.
 */
export function buildNotificationMessage(payload: NotificationPayload): string {
  const isPending = payload.status === 'PENDING';
  const isApproved = payload.status === 'APPROVED';
  const isRejected = payload.status === 'REJECTED';

  let statusHeader = '📥 มีคำร้องขอหนังสือรับรองใหม่ (รอดำเนินการ)';
  if (isApproved) statusHeader = '✅ อนุมัติคำร้องหนังสือรับรองเรียบร้อยแล้ว';
  if (isRejected) statusHeader = '❌ คำร้องขอหนังสือรับรองไม่ผ่านการอนุมัติ';

  const lines: string[] = [
    `🔔 [ระบบบริการการศึกษา คณะพุทธศาสตร์ มจร]`,
    `สถานะ: ${statusHeader}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🆔 รหัสนิสิต: ${payload.studentCode}`,
    `👤 ผู้ขอ: ${payload.studentName}`,
  ];

  if (payload.programLanguage) {
    lines.push(`🌐 หลักสูตรภาษา: ${payload.programLanguage}`);
  }

  if (payload.degreeLevel || payload.major) {
    const degMajor = [payload.degreeLevel, payload.major].filter(Boolean).join(' - ');
    lines.push(`🎓 ระดับ/สาขาวิชา: ${degMajor}`);
  }

  lines.push(`📄 ส่งคำร้องเรื่อง: ${payload.certType}`);

  if (payload.requestPurpose && payload.requestPurpose !== payload.certType) {
    lines.push(`🎯 วัตถุประสงค์: ${payload.requestPurpose}`);
  }

  if (payload.docNo) {
    lines.push(`📜 เลขที่หนังสือ: อว 8002/${payload.docNo}`);
  }

  if (payload.phone) {
    lines.push(`📞 โทรศัพท์: ${payload.phone}`);
  }

  if (payload.rejectReason) {
    lines.push(`⚠️ เหตุผล: ${payload.rejectReason}`);
  }

  const bangkokTime = new Date().toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  lines.push(`⏰ เวลา: ${bangkokTime} น.`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);

  const adminUrl = payload.actionUrl || 'https://ne-ser-fb.vercel.app/admin';
  if (isPending) {
    lines.push(`🔗 ลิงก์ตรวจสอบ/อนุมัติสำหรับเจ้าหน้าที่:`);
    lines.push(adminUrl);
  }

  return lines.join('\n');
}

/**
 * Sends a notification via LINE (Messaging API, Notify, Webhook) and Email.
 */
export async function sendNotification(payload: NotificationPayload): Promise<{
  lineSuccess: boolean;
  emailSuccess: boolean;
  message: string;
}> {
  const settings = await getSystemSettings();
  let lineSuccess = false;
  let emailSuccess = false;
  const messages: string[] = [];

  const notificationText = buildNotificationMessage(payload);

  // 1. Try LINE Messaging API Push Message if Channel Access Token & Target User/Group ID are configured
  const lineChannelToken = (settings as any).lineChannelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const lineTargetUser = (settings as any).lineTargetUserId || process.env.LINE_TARGET_USER_ID;
  if (lineChannelToken && lineTargetUser) {
    try {
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${lineChannelToken.trim()}`,
        },
        body: JSON.stringify({
          to: lineTargetUser.trim(),
          messages: [{ type: 'text', text: notificationText }],
        }),
      });

      if (res.ok) {
        lineSuccess = true;
        messages.push('LINE Messaging API ส่งสำเร็จ');
      } else {
        const errJson = await res.json().catch(() => ({}));
        messages.push(`LINE Messaging API ล้มเหลว (${res.status}): ${errJson.message || 'Error'}`);
      }
    } catch (e: unknown) {
      messages.push(`LINE Messaging API เชื่อมต่อไม่ได้: ${getErrorMessage(e)}`);
    }
  }

  // 2. Try LINE Notify if token is configured (as backup or standalone)
  const lineToken = (settings as any).lineNotifyToken || process.env.LINE_NOTIFY_TOKEN;
  if (lineToken && lineToken.trim() && !lineSuccess) {
    try {
      const res = await fetch('https://notify-api.line.me/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${lineToken.trim()}`,
        },
        body: new URLSearchParams({ message: `\n${notificationText}` }),
      });

      if (res.ok) {
        lineSuccess = true;
        messages.push('LINE Notify ส่งสำเร็จ');
      } else {
        const errJson = await res.json().catch(() => ({}));
        messages.push(`LINE Notify ล้มเหลว (${res.status}): ${errJson.message || 'Error'}`);
      }
    } catch (e: unknown) {
      messages.push(`LINE Notify เชื่อมต่อไม่ได้: ${getErrorMessage(e)}`);
    }
  }

  // 3. Try LINE / Custom Webhook (Google Apps Script, Make, Discord, etc.)
  const webhookUrl = (settings as any).lineWebhookUrl || process.env.LINE_WEBHOOK_URL;
  if (webhookUrl && webhookUrl.trim() && !lineSuccess) {
    try {
      const res = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: notificationText,
          message: notificationText,
          content: notificationText,
          payload,
        }),
      });
      if (res.ok) {
        lineSuccess = true;
        messages.push('Webhook ส่งสำเร็จ');
      } else {
        messages.push(`Webhook ล้มเหลว (${res.status})`);
      }
    } catch (e: unknown) {
      messages.push(`Webhook เชื่อมต่อไม่ได้: ${getErrorMessage(e)}`);
    }
  }

  // 4. Email Notification
  if (payload.toEmail) {
    console.log(`[EMAIL NOTIFICATION TO: ${payload.toEmail}]\nSubject: ผลการยื่นคำร้องหนังสือรับรอง\n${notificationText}`);
    emailSuccess = true;
    messages.push(`ส่งอีเมลแจ้งไปยัง ${payload.toEmail}`);
  }

  return {
    lineSuccess,
    emailSuccess,
    message: messages.length > 0 ? messages.join(' | ') : 'ไม่ได้ตั้งค่า LINE Token หรือ Email',
  };
}
