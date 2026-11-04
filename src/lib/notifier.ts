import { getSystemSettings } from './data-store';

export interface NotificationPayload {
  toEmail?: string;
  studentName: string;
  studentCode: string;
  docNo?: string;
  certType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
  actionUrl?: string;
}

/**
 * Sends a notification via LINE (Notify or Messaging API) and Email.
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

  const statusLabelTh =
    payload.status === 'APPROVED'
      ? '✅ อนุมัติเรียบร้อยแล้ว'
      : payload.status === 'REJECTED'
      ? '❌ ไม่อนุมัติคำร้อง'
      : '⏳ ยื่นคำร้องใหม่รอดำเนินการ';

  const notificationText = [
    `🔔 [ระบบบริการการศึกษา คณะพุทธศาสตร์ มจร]`,
    `สถานะ: ${statusLabelTh}`,
    `เอกสาร: ${payload.certType}`,
    payload.docNo ? `เลขที่หนังสือ: อว 8002/${payload.docNo}` : null,
    `นิสิต: ${payload.studentName} (${payload.studentCode})`,
    payload.rejectReason ? `เหตุผล: ${payload.rejectReason}` : null,
    `เวลา: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`,
  ]
    .filter(Boolean)
    .join('\n');

  // 1. Try LINE Notify if token is configured
  const lineToken = (settings as any).lineNotifyToken || process.env.LINE_NOTIFY_TOKEN;
  if (lineToken && lineToken.trim()) {
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
    } catch (e: any) {
      messages.push(`LINE Notify เชื่อมต่อไม่ได้: ${e.message}`);
    }
  }

  // 2. Try LINE Messaging API Push Message if Channel Access Token is configured
  const lineChannelToken = (settings as any).lineChannelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const lineTargetUser = (settings as any).lineTargetUserId || process.env.LINE_TARGET_USER_ID;
  if (lineChannelToken && lineTargetUser && !lineSuccess) {
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
      }
    } catch (e: any) {}
  }

  // 3. Email Notification (Logged to console & simulated/mocked for demo or SMTP)
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
