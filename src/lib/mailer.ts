import nodemailer from 'nodemailer';
import { readLocalJson, writeLocalJson } from '@/services/storageHelper';

export interface SendMailOptions {
  to: string | string[];
  name: string;
  resetUrl: string;
  otpCode: string;
  expiresMinutes?: number;
}

export interface MailLogEntry {
  id: string;
  to: string;
  subject: string;
  otpCode: string;
  resetUrl: string;
  sent: boolean;
  error?: string;
  createdAt: string;
}

/**
 * Get configured SMTP Transporter if available
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || '';
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD || '';

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Mask an email address for safe display (e.g., phaisal.dis@mcu.ac.th -> p***s@mcu.ac.th)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local.slice(0, 1)}***@${domain}`;
  }
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

/**
 * Send Password Reset Email with 1-click Link and OTP Code
 */
export async function sendPasswordResetEmail(
  opts: SendMailOptions
): Promise<{ success: boolean; sent: boolean; message: string }> {
  const { to, name, resetUrl, otpCode, expiresMinutes = 15 } = opts;
  const toList = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (toList.length === 0) {
    return { success: false, sent: false, message: 'ไม่พบที่อยู่อีเมลสำหรับจัดส่ง' };
  }

  const primaryRecipient = toList.join(', ');
  const subject = `🔒 รหัสยืนยันและลิงก์รีเซ็ตรหัสผ่าน - คณะพุทธศาสตร์ มจร (${otpCode})`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: 'Sarabun', 'Segoe UI', Tahoma, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b; margin: 0;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
      <div style="font-size: 32px; margin-bottom: 8px;">☸️</div>
      <h2 style="margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -0.02em;">คณะพุทธศาสตร์ มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย</h2>
      <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95;">ระบบบริการนิสิตและวิชาการ (Security Authentication)</p>
    </div>
    
    <div style="padding: 32px 28px;">
      <h3 style="margin-top: 0; color: #0f172a; font-size: 17px; font-weight: 700;">
        🔒 คำขอรีเซ็ตรหัสผ่านสำหรับ: ${name}
      </h3>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        ระบบได้รับคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีผู้ใช้งานของท่าน เพื่อความปลอดภัยสูงสุด กรุณาเปิดลิงก์ด้านล่างเพื่อกำหนดรหัสผ่านใหม่ (ลิงก์มีอายุ <strong>${expiresMinutes} นาที</strong>):
      </p>

      <div style="text-align: center; margin: 28px 0 20px;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; font-weight: 700; text-decoration: none; padding: 13px 32px; border-radius: 12px; font-size: 14px; box-shadow: 0 4px 12px rgba(234,88,12,0.25);">
          🔑 ตั้งรหัสผ่านใหม่ (Reset Password)
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 8px;">
        หรือนำรหัสยืนยัน OTP 6 หลักนี้ไปกรอกในหน้าเว็บ:
      </p>
      
      <div style="background-color: #fff7ed; border: 2px dashed #fdba74; border-radius: 14px; padding: 16px; text-align: center; margin: 0 auto 24px; max-width: 240px;">
        <div style="font-size: 30px; font-weight: 800; letter-spacing: 8px; color: #c2410c; font-family: monospace;">
          ${otpCode}
        </div>
        <div style="font-size: 11px; color: #9a3412; margin-top: 4px;">
          รหัสหมดอายุภายใน ${expiresMinutes} นาที
        </div>
      </div>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 14px 16px; font-size: 12px; color: #64748b; border: 1px solid #f1f5f9;">
        📌 <strong>หากคลิกปุ่มไม่ได้:</strong> ให้คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์ของท่าน:<br>
        <span style="word-break: break-all; color: #ea580c; font-size: 11px;">${resetUrl}</span>
      </div>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 28px 0 20px;" />

      <p style="font-size: 12px; color: #94a3b8; line-height: 1.6; margin-bottom: 0;">
        ⚠️ <strong>คำเตือนความปลอดภัย:</strong> หากท่านไม่ได้เป็นผู้ส่งคำขอนี้ หรือสงสัยว่ามีผู้อื่นพยายามเข้าถึงบัญชี โปรดเพิกเฉยต่ออีเมลฉบับนี้ รหัสผ่านเดิมของท่านจะยังคงปลอดภัย ไม่มีการเปลี่ยนแปลงใด ๆ ทั้งสิ้น
      </p>
    </div>

    <div style="background-color: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      ฝ่ายเทคโนโลยีและบริการวิชาการ คณะพุทธศาสตร์ มจร<br>
      ติดต่อผู้ดูแลระบบ: <strong>พระมหาไพศาล ดิษฐพันธ์</strong> (<a href="mailto:phaisal.dis@mcu.ac.th" style="color: #ea580c; text-decoration: none;">phaisal.dis@mcu.ac.th</a>)
    </div>
  </div>
</body>
</html>
  `;

  // Log entry in data/email-logs.json
  const logs = readLocalJson<MailLogEntry[]>('email-logs.json', []);
  const logEntry: MailLogEntry = {
    id: 'mail-' + Date.now(),
    to: primaryRecipient,
    subject,
    otpCode,
    resetUrl,
    sent: false,
    createdAt: new Date().toISOString(),
  };

  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.warn(`[MAILER] SMTP not configured. Logged reset email for ${primaryRecipient} with OTP: ${otpCode}`);
      logEntry.sent = false;
      logEntry.error = 'SMTP credentials not configured in environment (SMTP_USER/SMTP_PASS)';
      logs.unshift(logEntry);
      writeLocalJson('email-logs.json', logs.slice(0, 100));

      return {
        success: true,
        sent: false,
        message: 'ระบบสร้างรหัสยืนยันเรียบร้อยแล้ว (กำลังทำงานในโหมดบันทึก Log เนื่องจากยังไม่ได้กำหนด SMTP บน Server)',
      };
    }

    const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'no-reply@mcu.ac.th';
    await transporter.sendMail({
      from: `"คณะพุทธศาสตร์ มจร" <${senderEmail}>`,
      to: toList,
      subject,
      html,
    });

    logEntry.sent = true;
    logs.unshift(logEntry);
    writeLocalJson('email-logs.json', logs.slice(0, 100));

    return {
      success: true,
      sent: true,
      message: `ส่งอีเมลพร้อมลิงก์และรหัสยืนยันไปยัง ${primaryRecipient} สำเร็จแล้ว`,
    };
  } catch (err: any) {
    console.error('[MAILER] Failed to send reset email:', err);
    logEntry.sent = false;
    logEntry.error = err.message || 'SendMail error';
    logs.unshift(logEntry);
    writeLocalJson('email-logs.json', logs.slice(0, 100));

    return {
      success: true, // we still allow OTP verification through fallback
      sent: false,
      message: `เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ส่งอีเมล: ${err.message}`,
    };
  }
}
