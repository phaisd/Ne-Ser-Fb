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
 * Builds an interactive, professional LINE Flex Message with Action Buttons.
 */
export function buildNotificationFlexMessage(payload: NotificationPayload): Record<string, unknown> {
  const isPending = payload.status === 'PENDING';
  const isApproved = payload.status === 'APPROVED';
  const isRejected = payload.status === 'REJECTED';

  let headerBg = '#059669';
  let headerTitle = '📥 มีคำร้องใหม่ (รอดำเนินการ)';
  const headerSub = '🏛️ คณะพุทธศาสตร์ มจร วังน้อย';
  if (isApproved) {
    headerBg = '#2563EB';
    headerTitle = '✅ อนุมัติคำร้องเรียบร้อยแล้ว';
  } else if (isRejected) {
    headerBg = '#DC2626';
    headerTitle = '❌ คำร้องไม่ผ่านการอนุมัติ';
  }

  const bangkokTime = new Date().toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const detailRows: Array<{
    type: string;
    layout: string;
    contents: Array<{
      type: string;
      text: string;
      size?: string;
      color?: string;
      weight?: string;
      flex?: number;
      wrap?: boolean;
    }>;
  }> = [
    {
      type: 'box',
      layout: 'baseline',
      contents: [
        { type: 'text', text: '👤 ผู้ขอ:', size: 'xs', color: '#6B7280', flex: 2 },
        { type: 'text', text: payload.studentName, size: 'xs', color: '#111827', weight: 'bold', flex: 5, wrap: true },
      ],
    },
    {
      type: 'box',
      layout: 'baseline',
      contents: [
        { type: 'text', text: '🆔 รหัส:', size: 'xs', color: '#6B7280', flex: 2 },
        { type: 'text', text: payload.studentCode, size: 'xs', color: '#111827', weight: 'bold', flex: 5 },
      ],
    },
  ];

  if (payload.programLanguage) {
    detailRows.push({
      type: 'box',
      layout: 'baseline',
      contents: [
        { type: 'text', text: '🌐 ภาษา:', size: 'xs', color: '#6B7280', flex: 2 },
        { type: 'text', text: payload.programLanguage, size: 'xs', color: '#4B5563', flex: 5, wrap: true },
      ],
    });
  }

  if (payload.degreeLevel || payload.major) {
    const degMajor = [payload.degreeLevel, payload.major].filter(Boolean).join(' - ');
    detailRows.push({
      type: 'box',
      layout: 'baseline',
      contents: [
        { type: 'text', text: '🎓 สาขา:', size: 'xs', color: '#6B7280', flex: 2 },
        { type: 'text', text: degMajor, size: 'xs', color: '#111827', flex: 5, wrap: true },
      ],
    });
  }

  detailRows.push({
    type: 'box',
    layout: 'baseline',
    contents: [
      { type: 'text', text: '📄 เรื่อง:', size: 'xs', color: '#6B7280', flex: 2 },
      { type: 'text', text: payload.certType, size: 'xs', color: '#047857', weight: 'bold', flex: 5, wrap: true },
    ],
  });

  if (payload.requestPurpose && payload.requestPurpose !== payload.certType) {
    detailRows.push({
      type: 'box',
      layout: 'baseline',
      contents: [
        { type: 'text', text: '🎯 เหตุผล:', size: 'xs', color: '#6B7280', flex: 2 },
        { type: 'text', text: payload.requestPurpose, size: 'xs', color: '#374151', flex: 5, wrap: true },
      ],
    });
  }

  if (payload.docNo) {
    detailRows.push({
      type: 'box',
      layout: 'baseline',
      contents: [
        { type: 'text', text: '📜 เลขที่:', size: 'xs', color: '#6B7280', flex: 2 },
        { type: 'text', text: `อว 8002/${payload.docNo}`, size: 'xs', color: '#2563EB', weight: 'bold', flex: 5 },
      ],
    });
  }

  if (payload.phone) {
    detailRows.push({
      type: 'box',
      layout: 'baseline',
      contents: [
        { type: 'text', text: '📞 โทร:', size: 'xs', color: '#6B7280', flex: 2 },
        { type: 'text', text: payload.phone, size: 'xs', color: '#111827', flex: 5 },
      ],
    });
  }

  if (payload.rejectReason) {
    detailRows.push({
      type: 'box',
      layout: 'baseline',
      contents: [
        { type: 'text', text: '⚠️ เหตุผล:', size: 'xs', color: '#DC2626', flex: 2 },
        { type: 'text', text: payload.rejectReason, size: 'xs', color: '#DC2626', flex: 5, wrap: true },
      ],
    });
  }

  const footerButtons: Array<Record<string, unknown>> = [];

  if (isPending) {
    footerButtons.push({
      type: 'button',
      style: 'primary',
      color: '#059669',
      height: 'sm',
      action: {
        type: 'postback',
        label: '✅ รับเรื่องแล้ว',
        data: `action=acknowledge&studentCode=${payload.studentCode}&studentName=${encodeURIComponent(payload.studentName)}`,
        displayText: `✅ เจ้าหน้าที่รับเรื่องคำร้องแล้ว (${payload.studentCode})`,
      },
    });
  }

  const adminUrl = payload.actionUrl || 'https://ne-ser-fb.vercel.app/admin';
  footerButtons.push({
    type: 'button',
    style: isPending ? 'secondary' : 'primary',
    color: isPending ? undefined : headerBg,
    height: 'sm',
    action: {
      type: 'uri',
      label: isPending ? '📄 เปิดดูในระบบ Admin' : '📄 ดูรายละเอียดในระบบ',
      uri: adminUrl,
    },
  });

  return {
    type: 'flex',
    altText: `🔔 [คณะพุทธศาสตร์ มจร] ${headerTitle}: ${payload.studentName} (${payload.studentCode})`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: headerBg,
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: headerSub,
            color: '#FFFFFF',
            size: 'xs',
            weight: 'bold',
            opacity: 0.85,
          },
          {
            type: 'text',
            text: headerTitle,
            color: '#FFFFFF',
            size: 'md',
            weight: 'bold',
            margin: 'sm',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        spacing: 'md',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: detailRows,
          },
          { type: 'separator', color: '#E5E7EB' },
          {
            type: 'text',
            text: `⏰ เวลา: ${bangkokTime} น.`,
            size: 'xxs',
            color: '#9CA3AF',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '16px',
        contents: footerButtons,
      },
    },
  };
}

/**
 * Sends a notification via LINE (Messaging API, Notify, Webhook) and Email.
 */
export async function sendNotification(
  payload: NotificationPayload,
  overrideConfig?: {
    lineChannelAccessToken?: string;
    lineTargetUserId?: string;
    lineNotifyToken?: string;
    lineWebhookUrl?: string;
  }
): Promise<{
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
  const lineChannelToken =
    overrideConfig?.lineChannelAccessToken ||
    settings.lineChannelAccessToken ||
    process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const lineTargetUser =
    overrideConfig?.lineTargetUserId ||
    settings.lineTargetUserId ||
    process.env.LINE_TARGET_USER_ID;
  if (lineChannelToken && lineTargetUser) {
    try {
      const flexMessage = buildNotificationFlexMessage(payload);
      let res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${lineChannelToken.trim()}`,
        },
        body: JSON.stringify({
          to: lineTargetUser.trim(),
          messages: [flexMessage],
        }),
      });

      // If flex message was rejected, fallback to text message
      if (!res.ok) {
        res = await fetch('https://api.line.me/v2/bot/message/push', {
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
      }

      if (res.ok) {
        lineSuccess = true;
        messages.push('LINE Flex Card ส่งสำเร็จ');
      } else {
        const errJson = await res.json().catch(() => ({}));
        messages.push(`LINE Messaging API ล้มเหลว (${res.status}): ${errJson.message || 'Error'}`);
      }
    } catch (e: unknown) {
      messages.push(`LINE Messaging API เชื่อมต่อไม่ได้: ${getErrorMessage(e)}`);
    }
  }

  // 2. Try LINE Notify if token is configured (as backup or standalone)
  const lineToken =
    overrideConfig?.lineNotifyToken ||
    settings.lineNotifyToken ||
    process.env.LINE_NOTIFY_TOKEN;
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
  const webhookUrl =
    overrideConfig?.lineWebhookUrl ||
    settings.lineWebhookUrl ||
    process.env.LINE_WEBHOOK_URL;
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
