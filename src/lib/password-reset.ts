import crypto from 'crypto';
import { readLocalJson, writeLocalJson } from '@/services/storageHelper';
import { getInstructorAccounts, updateInstructorPassword } from '@/services/instructorService';
import { getStudents, updateStudentPassword } from '@/services/studentService';
import { sendPasswordResetEmail, maskEmail } from './mailer';

export interface PasswordResetRecord {
  id: string;
  token: string;
  otp: string;
  userId: string;
  userType: 'INSTRUCTOR' | 'STUDENT';
  name: string;
  primaryEmail: string;
  backupEmail?: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  usedAt?: string;
}

const RESET_STORE_FILE = 'password-resets.json';
const TOKEN_EXPIRY_MINUTES = 15;

/**
 * Generate a random 6-digit OTP string
 */
function generateOtp(): string {
  const num = crypto.randomInt(100000, 999999);
  return String(num);
}

/**
 * Generate a secure URL-safe reset token
 */
function generateToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Clean up old expired tokens
 */
function cleanExpiredTokens(records: PasswordResetRecord[]): PasswordResetRecord[] {
  const now = Date.now();
  // Keep records less than 24 hours old for auditing, prune older
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  return records.filter((r) => new Date(r.createdAt).getTime() > oneDayAgo);
}

/**
 * Request a Password Reset:
 * 1. Finds instructor or student by identifier (email, username, citizenId, etc.)
 * 2. Generates secure Token + 6-digit OTP
 * 3. Sends notification email to their real email inbox
 */
export async function requestPasswordReset(
  identifier: string,
  originUrl?: string
): Promise<{
  success: boolean;
  error?: string;
  name?: string;
  userType?: 'INSTRUCTOR' | 'STUDENT';
  maskedPrimaryEmail?: string;
  maskedBackupEmail?: string;
  expiresMinutes?: number;
  sentEmail?: boolean;
}> {
  if (!identifier || !identifier.trim()) {
    return { success: false, error: 'กรุณากรอกอีเมลสถาบัน, บัญชีผู้ใช้, หรือรหัสนิสิต' };
  }

  const cleanId = identifier.trim().toLowerCase();
  const instructors = await getInstructorAccounts();

  // Find instructor
  const inst = instructors.find((a) =>
    (a.email?.toLowerCase() === cleanId ||
     a.id?.toLowerCase() === cleanId ||
     a.gmail?.toLowerCase() === cleanId ||
     a.aliases?.some((al) => al.toLowerCase() === cleanId) ||
     a.name?.toLowerCase().includes(cleanId))
  );

  let targetUser: {
    userId: string;
    userType: 'INSTRUCTOR' | 'STUDENT';
    name: string;
    primaryEmail: string;
    backupEmail?: string;
  } | null = null;

  if (inst) {
    targetUser = {
      userId: inst.id || inst.email,
      userType: 'INSTRUCTOR',
      name: inst.name,
      primaryEmail: inst.email,
      backupEmail: inst.gmail || undefined,
    };
  } else {
    // Check students
    const students = await getStudents();
    const student = students.find((s: any) =>
      s.studentCode?.toLowerCase() === cleanId ||
      s.email?.toLowerCase() === cleanId
    );

    if (student) {
      const studentName = student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.studentCode;
      targetUser = {
        userId: student.studentCode,
        userType: 'STUDENT',
        name: studentName,
        primaryEmail: student.email || `${student.studentCode}@mcu.ac.th`,
        backupEmail: undefined,
      };
    }
  }

  if (!targetUser) {
    return {
      success: false,
      error: 'ไม่พบบัญชีผู้ใช้งานที่ระบุในระบบ กรุณาตรวจสอบอีเมลหรือติดต่อผู้ดูแลระบบ (Admin)',
    };
  }

  const token = generateToken();
  const otp = generateOtp();
  const now = new Date();
  const expires = new Date(now.getTime() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  const newRecord: PasswordResetRecord = {
    id: 'reset-' + Date.now(),
    token,
    otp,
    userId: targetUser.userId,
    userType: targetUser.userType,
    name: targetUser.name,
    primaryEmail: targetUser.primaryEmail,
    backupEmail: targetUser.backupEmail,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    used: false,
  };

  const allRecords = readLocalJson<PasswordResetRecord[]>(RESET_STORE_FILE, []);
  const cleaned = cleanExpiredTokens(allRecords);
  cleaned.unshift(newRecord);
  writeLocalJson(RESET_STORE_FILE, cleaned);

  // Determine base URL
  const baseUrl = originUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://ne-ser-fb.vercel.app';
  const resetUrl = `${baseUrl.replace(/\/+$/, '')}/reset-password?token=${token}`;

  // Recipients: primary email and backup email (if any)
  const recipients: string[] = [];
  if (targetUser.primaryEmail && targetUser.primaryEmail.includes('@')) {
    recipients.push(targetUser.primaryEmail);
  }
  if (targetUser.backupEmail && targetUser.backupEmail.includes('@') && !recipients.includes(targetUser.backupEmail)) {
    recipients.push(targetUser.backupEmail);
  }

  // Attempt to send email
  const mailResult = await sendPasswordResetEmail({
    to: recipients,
    name: targetUser.name,
    resetUrl,
    otpCode: otp,
    expiresMinutes: TOKEN_EXPIRY_MINUTES,
  });

  return {
    success: true,
    name: targetUser.name,
    userType: targetUser.userType,
    maskedPrimaryEmail: maskEmail(targetUser.primaryEmail),
    maskedBackupEmail: targetUser.backupEmail ? maskEmail(targetUser.backupEmail) : undefined,
    expiresMinutes: TOKEN_EXPIRY_MINUTES,
    sentEmail: mailResult.sent,
  };
}

/**
 * Verify a reset token or OTP code
 */
export async function verifyResetTokenOrOtp(tokenOrOtp: string): Promise<{
  valid: boolean;
  error?: string;
  record?: PasswordResetRecord;
}> {
  if (!tokenOrOtp || !tokenOrOtp.trim()) {
    return { valid: false, error: 'กรุณาระบุลิงก์หรือรหัสยืนยัน OTP' };
  }

  const clean = tokenOrOtp.trim();
  const allRecords = readLocalJson<PasswordResetRecord[]>(RESET_STORE_FILE, []);

  const record = allRecords.find((r) => r.token === clean || r.otp === clean);
  if (!record) {
    return { valid: false, error: 'ไม่พบข้อมูลคำขอรีเซ็ตรหัสผ่าน หรือรหัสยืนยันไม่ถูกต้อง' };
  }

  if (record.used) {
    return { valid: false, error: 'ลิงก์หรือรหัสยืนยันนี้ถูกใช้งานไปแล้ว กรุณาทำรายการขอรีเซ็ตใหม่' };
  }

  const now = Date.now();
  const expiresAtMs = new Date(record.expiresAt).getTime();
  if (now > expiresAtMs) {
    return { valid: false, error: 'ลิงก์หรือรหัสยืนยันนี้หมดอายุแล้ว (จำกัดเวลา 15 นาที) กรุณาทำรายการใหม่' };
  }

  return { valid: true, record };
}

/**
 * Complete Password Reset with New Password
 */
export async function completePasswordReset(
  tokenOrOtp: string,
  newPassword: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
  }

  const verifyRes = await verifyResetTokenOrOtp(tokenOrOtp);
  if (!verifyRes.valid || !verifyRes.record) {
    return { success: false, error: verifyRes.error || 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุ' };
  }

  const record = verifyRes.record;

  let updateOk = false;
  if (record.userType === 'INSTRUCTOR') {
    updateOk = await updateInstructorPassword(record.userId, newPassword);
  } else {
    updateOk = await updateStudentPassword(record.userId, newPassword);
  }

  if (!updateOk) {
    return { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกรหัสผ่านใหม่ กรุณาติดต่อผู้ดูแลระบบ' };
  }

  // Mark record as used
  const allRecords = readLocalJson<PasswordResetRecord[]>(RESET_STORE_FILE, []);
  const idx = allRecords.findIndex((r) => r.id === record.id);
  if (idx !== -1) {
    allRecords[idx].used = true;
    allRecords[idx].usedAt = new Date().toISOString();
    writeLocalJson(RESET_STORE_FILE, allRecords);
  }

  return {
    success: true,
    message: `ตั้งรหัสผ่านใหม่สำหรับ ${record.name} สำเร็จเรียบร้อยแล้ว ท่านสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที`,
  };
}
