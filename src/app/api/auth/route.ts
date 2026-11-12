import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import {
  authenticateInstructor,
  authenticateGoogleUser,
  authenticateStudent,
  getInstructorAccounts,
  getStudents,
  getSystemSettings,
  updateInstructorPassword,
  updateStudentPassword,
} from '@/lib/data-store';
import { checkRateLimit, resetRateLimit, createSignedSessionToken, verifySessionToken } from '@/lib/auth-security';
import { verifyGoogleIdToken } from '@/lib/google-auth';
import {
  recordUserLogin,
  recordFailedLoginAttempt,
  validateUserSession,
  revokeUserSession,
  getUserLoginHistory,
  analyzeLoginSecurity,
} from '@/lib/session-manager';
import {
  requestPasswordReset,
  verifyResetTokenOrOtp,
  completePasswordReset,
} from '@/lib/password-reset';

interface AuthSessionCandidate {
  id?: string;
  studentCode?: string;
  email: string;
  gmail?: string;
  name: string;
  role?: string;
  sessionId?: string;
  isSuperAdmin?: boolean;
  hasChangedPassword?: boolean;
  defaultPassword?: string;
  mustChangePassword?: boolean;
  [key: string]: unknown;
}

interface AuthCookieConfig {
  httpOnly: boolean;
  path: string;
  sameSite: 'lax' | 'strict' | 'none';
  secure: boolean;
  maxAge?: number;
}

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown-client';
    const rateCheck = checkRateLimit(`auth:${clientIp}`, 15, 5 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `พยายามเข้าสู่ระบบบ่อยเกินไป เพื่อความปลอดภัยโปรดลองใหม่อีกครั้งในอีก ${rateCheck.retryAfterSec} วินาที (Rate Limit)`,
        },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSec || 60) } }
      );
    }

    const body = await request.json();
    const { email, password, provider, gmail, credential, rememberMe, action, identifier, newPassword, confirmPassword, role } = body;

    // Helper to build cookie options based on rememberMe (Personal device vs Public shared PC)
    const isProduction = process.env.NODE_ENV === 'production';
    const getAuthCookieOptions = (httpOnly = true): AuthCookieConfig => {
      const opts: AuthCookieConfig = {
        httpOnly,
        path: '/',
        sameSite: 'lax',
        secure: isProduction,
      };
      if (rememberMe) {
        opts.maxAge = 60 * 60 * 24 * 7; // 7 days for private devices
      }
      return opts;
    };

    const userAgent = request.headers.get('user-agent') || '';
    const registerSession = <T extends AuthSessionCandidate>(
      u: T,
      method: 'PASSWORD' | 'GOOGLE' | 'SESSION_RESET' = 'PASSWORD'
    ) => {
      const { sessionId } = recordUserLogin(
        u.id || u.studentCode || u.email,
        u.email,
        u.name,
        clientIp,
        userAgent,
        method
      );
      return { ...u, sessionId };
    };

    const attachAuthCookies = (resp: NextResponse, u: AuthSessionCandidate & { sessionId: string }) => {
      const token = createSignedSessionToken(u);
      // 1. Secure Signed HttpOnly Session Cookie (Source of truth for Server APIs)
      resp.cookies.set('mcu_session_token', token, getAuthCookieOptions(true));
      // 2. Client-readable profile cookie for fast UI rendering (Non-sensitive display info only)
      resp.cookies.set('mcu_auth_user', JSON.stringify(u), getAuthCookieOptions(false));
    };

    // 0.0 Revoke all other devices & rotate current session
    if (action === 'revoke-other-sessions') {
      const cookieHeader = request.headers.get('cookie') || '';
      const tokenMatch = cookieHeader.match(/mcu_session_token=([^;]+)/);
      const verified = tokenMatch?.[1] ? verifySessionToken(decodeURIComponent(tokenMatch[1])) : null;
      if (!verified) {
        return NextResponse.json(
          { success: false, error: 'กรุณาเข้าสู่ระบบใหม่อีกครั้งเพื่อจัดการเซสชัน' },
          { status: 401 }
        );
      }

      const rotatedUser = registerSession(verified, 'SESSION_RESET');
      const history = getUserLoginHistory(rotatedUser.id, rotatedUser.email, rotatedUser.gmail);
      const security = analyzeLoginSecurity(history, rotatedUser.sessionId);

      const resp = NextResponse.json({
        success: true,
        user: rotatedUser,
        history,
        security,
        message: 'ออกจากระบบทุกอุปกรณ์อื่นและรีเฟรชเซสชันปัจจุบันเรียบร้อยแล้ว',
      });
      attachAuthCookies(resp, rotatedUser);
      return resp;
    }

    // 0.05 Synchronize / Restore Signed Server Cookie for Active Client Session
    if (action === 'sync-session') {
      const targetEmail = String(email || gmail || '').trim().toLowerCase();
      const targetId = String(identifier || body.id || '').trim().toLowerCase();
      if (!targetEmail && !targetId) {
        return NextResponse.json({ success: false, error: 'Missing account identifier' }, { status: 400 });
      }

      const instructors = await getInstructorAccounts();
      const matchedInst = instructors.find(
        (a) =>
          (targetEmail &&
            (a.email?.toLowerCase() === targetEmail ||
              a.gmail?.toLowerCase() === targetEmail ||
              a.aliases?.some((al) => al.toLowerCase() === targetEmail))) ||
          (targetId && a.id?.toLowerCase() === targetId)
      );

      if (matchedInst && matchedInst.isActive !== false) {
        const { password: _pw, ...safeInst } = matchedInst;
        const sessionUser = registerSession(
          {
            ...safeInst,
            email: safeInst.email || targetEmail,
            name: safeInst.name,
            role: safeInst.role || (safeInst.email?.toLowerCase() === 'phaisal.dis@mcu.ac.th' ? 'SUPER_ADMIN' : 'INSTRUCTOR'),
            isSuperAdmin:
              safeInst.role === 'SUPER_ADMIN' ||
              Boolean((safeInst as any).isSuperAdmin) ||
              safeInst.email?.toLowerCase() === 'phaisal.dis@mcu.ac.th',
            isActingOfficer: Boolean(safeInst.isActingOfficer),
          },
          'SESSION_RESET'
        );
        const resp = NextResponse.json({
          success: true,
          authenticated: true,
          user: sessionUser,
        });
        attachAuthCookies(resp, sessionUser);
        return resp;
      }

      // Check student accounts (e.g. student with isActingOfficer or regular student session)
      const cleanStudentCode = (targetId || targetEmail).replace(/@mcu\.ac\.th$/i, '').trim();
      const students = await getStudents();
      const matchedStudent = students.find(
        (s) =>
          (cleanStudentCode && (s.studentCode || '').toLowerCase() === cleanStudentCode) ||
          (targetEmail && (s.email || '').toLowerCase() === targetEmail)
      );

      if (matchedStudent && matchedStudent.isActive !== false) {
        const studentName =
          matchedStudent.fullName ||
          `${matchedStudent.title || ''}${matchedStudent.firstName || ''} ${matchedStudent.lastName || ''}`.trim() ||
          matchedStudent.studentCode;
        const sessionUser = registerSession(
          {
            id: matchedStudent.studentCode,
            studentCode: matchedStudent.studentCode,
            email: matchedStudent.email || `${matchedStudent.studentCode}@mcu.ac.th`,
            name: studentName,
            role: 'STUDENT',
            department: matchedStudent.major || matchedStudent.faculty || 'คณะพุทธศาสตร์',
            programType: matchedStudent.programType || 'THAI',
            isSuperAdmin: false,
            isActingOfficer: Boolean(matchedStudent.isActingOfficer),
          },
          'SESSION_RESET'
        );
        const resp = NextResponse.json({
          success: true,
          authenticated: true,
          user: sessionUser,
        });
        attachAuthCookies(resp, sessionUser);
        return resp;
      }

      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }

    // 0.1 Request Password Reset (Sends Token & 6-digit OTP to User's Actual Email)
    if (action === 'request-password-reset' || (action === 'forgot-password' && !body.newPassword && !body.token && !body.otp)) {
      const { identifier } = body;
      const originUrl = request.headers.get('origin') || undefined;
      const res = await requestPasswordReset(identifier, originUrl);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: 'ระบบได้จัดส่งลิงก์และรหัสยืนยันไปยังอีเมลจริงของท่านเรียบร้อยแล้ว',
        name: res.name,
        userType: res.userType,
        maskedPrimaryEmail: res.maskedPrimaryEmail,
        maskedBackupEmail: res.maskedBackupEmail,
        expiresMinutes: res.expiresMinutes,
        sentEmail: res.sentEmail,
      });
    }

    // 0.2 Verify Reset Token or OTP
    if (action === 'verify-reset-token') {
      const { token, otp } = body;
      const target = token || otp;
      const res = await verifyResetTokenOrOtp(target);
      if (!res.valid || !res.record) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        name: res.record.name,
        userType: res.record.userType,
        maskedPrimaryEmail: res.record.primaryEmail ? `${res.record.primaryEmail.slice(0, 2)}***@${res.record.primaryEmail.split('@')[1] || ''}` : '',
        maskedBackupEmail: res.record.backupEmail ? `${res.record.backupEmail.slice(0, 2)}***@${res.record.backupEmail.split('@')[1] || ''}` : '',
      });
    }

    // 0.3 Complete Password Reset (via Token or OTP)
    if (action === 'complete-password-reset' || (action === 'forgot-password' && (body.token || body.otp))) {
      const { token, otp, tokenOrOtp, newPassword, confirmPassword } = body;
      const key = tokenOrOtp || token || otp;
      if (!key) {
        return NextResponse.json({ success: false, error: 'กรุณาระบุรหัสยืนยัน (OTP) หรือลิงก์รีเซ็ต' }, { status: 400 });
      }
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
      }
      if (confirmPassword && newPassword !== confirmPassword) {
        return NextResponse.json({ success: false, error: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน' }, { status: 400 });
      }

      const res = await completePasswordReset(key, newPassword);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: res.message });
    }

    // 0.4 Legacy Self-Service Reset Handler (Backward Compatibility with verified backup Gmail)
    if (action === 'forgot-password' || action === 'self-reset-password') {
      const { identifier, verifyEmail, newPassword, confirmPassword } = body;
      if (!identifier || !verifyEmail || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน (อีเมลสถาบัน, อีเมลสำรอง Gmail, และรหัสผ่านใหม่)' },
          { status: 400 }
        );
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
          { status: 400 }
        );
      }
      if (confirmPassword && newPassword !== confirmPassword) {
        return NextResponse.json(
          { success: false, error: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน' },
          { status: 400 }
        );
      }

      const cleanId = String(identifier).trim().toLowerCase();
      const cleanVerify = String(verifyEmail).trim().toLowerCase();

      // Check instructor accounts
      const instructors = await getInstructorAccounts();
      const inst = instructors.find((a) =>
        (a.email?.toLowerCase() === cleanId ||
         a.id?.toLowerCase() === cleanId ||
         a.gmail?.toLowerCase() === cleanId ||
         a.aliases?.some((al) => al.toLowerCase() === cleanId) ||
         a.name?.toLowerCase().includes(cleanId))
      );

      if (inst) {
        const matchGmail = (inst.gmail || '').toLowerCase() === cleanVerify;
        const matchEmail = (inst.email || '').toLowerCase() === cleanVerify;
        if (!matchGmail && !matchEmail) {
          return NextResponse.json(
            { success: false, error: 'อีเมลสำรอง (Gmail) ไม่ตรงกับที่บันทึกไว้ในระบบอาจารย์ กรุณาตรวจสอบหรือติดต่อผู้ดูแลระบบ' },
            { status: 400 }
          );
        }

        const ok = await updateInstructorPassword(inst.id || inst.email, newPassword);
        if (!ok) {
          return NextResponse.json({ success: false, error: 'ไม่สามารถรีเซ็ตรหัสผ่านได้ กรุณาติดต่อผู้ดูแลระบบ' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: `รีเซ็ตรหัสผ่านสำหรับอาจารย์ ${inst.name} สำเร็จเรียบร้อยแล้ว ท่านสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที`,
          email: inst.email,
        });
      }

      // Check student accounts
      const students = await getStudents();
      const student = students.find((s) =>
        s.studentCode?.toLowerCase() === cleanId ||
        s.email?.toLowerCase() === cleanId
      );

      if (student) {
        const matchEmail = (student.email || '').toLowerCase() === cleanVerify;
        const matchPhone = (student.phoneNumber || '').slice(-4) === cleanVerify;
        if (!matchEmail && !matchPhone) {
          return NextResponse.json(
            { success: false, error: 'ข้อมูลยืนยันตัวตน (อีเมลหรือเบอร์โทรศัพท์) ไม่ตรงกับที่บันทึกไว้ในระบบนิสิต' },
            { status: 400 }
          );
        }

        const ok = await updateStudentPassword(student.studentCode, newPassword);
        if (!ok) {
          return NextResponse.json({ success: false, error: 'ไม่สามารถรีเซ็ตรหัสผ่านได้ กรุณาติดต่อผู้ดูแลระบบ' }, { status: 500 });
        }

        const studentDisplayName = student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim();
        return NextResponse.json({
          success: true,
          message: `รีเซ็ตรหัสผ่านสำหรับนิสิต ${studentDisplayName} สำเร็จเรียบร้อยแล้ว`,
          email: student.studentCode,
        });
      }

      return NextResponse.json(
        { success: false, error: 'ไม่พบบัญชีผู้ใช้งานที่ระบุในระบบ กรุณาตรวจสอบอีเมลหรือติดต่อผู้ดูแลระบบ' },
        { status: 404 }
      );
    }

    // 0. First-Time Login Password Change Handler
    if (action === 'change-password-first-login' || action === 'force-change-password') {
      const targetId = identifier || email;
      if (!targetId || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'กรุณาระบุบัญชีผู้ใช้และรหัสผ่านใหม่' },
          { status: 400 }
        );
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
          { status: 400 }
        );
      }
      if (newPassword === 'mcu123456') {
        return NextResponse.json(
          { success: false, error: 'ไม่สามารถใช้รหัสผ่านเริ่มต้นของระบบได้ กรุณาตั้งรหัสผ่านใหม่ที่ปลอดภัย' },
          { status: 400 }
        );
      }
      if (confirmPassword && newPassword !== confirmPassword) {
        return NextResponse.json(
          { success: false, error: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน' },
          { status: 400 }
        );
      }

      let updatedOk = false;
      let updatedUser: AuthSessionCandidate | null = null;

      if (role === 'STUDENT') {
        updatedOk = await updateStudentPassword(targetId, newPassword);
        if (updatedOk) {
          updatedUser = await authenticateStudent(targetId, newPassword);
        }
      } else {
        updatedOk = await updateInstructorPassword(targetId, newPassword);
        if (updatedOk) {
          updatedUser = await authenticateInstructor(targetId, newPassword);
        }
      }

      if (!updatedOk || !updatedUser) {
        return NextResponse.json(
          { success: false, error: 'ไม่พบบัญชีผู้ใช้งาน หรือไม่สามารถเปลี่ยนรหัสผ่านได้' },
          { status: 404 }
        );
      }

      const sessionUser = registerSession({ ...updatedUser, hasChangedPassword: true, mustChangePassword: false });
      const response = NextResponse.json({
        success: true,
        user: sessionUser,
        message: 'เปลี่ยนรหัสผ่านสำหรับการเข้าใช้งานครั้งแรกเรียบร้อยแล้ว',
      });

      attachAuthCookies(response, sessionUser);

      return response;
    }

    // 1. Google Identity Services JWT Authentication (cryptographic token verification required)
    if (provider === 'google' || provider === 'gmail' || credential) {
      if (!credential || typeof credential !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error:
              'ไม่อนุญาตให้เข้าสู่ระบบด้วยอีเมลเพียงอย่างเดียว กรุณายืนยันตัวตนผ่าน Google OAuth หรือกรอกรหัสผ่านให้ถูกต้อง',
          },
          { status: 401 }
        );
      }

      const settings = await getSystemSettings();
      const expectedClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || settings?.googleClientId;
      const googleCheck = await verifyGoogleIdToken(credential, expectedClientId);

      if (!googleCheck.valid || !googleCheck.email) {
        return NextResponse.json(
          {
            success: false,
            error: googleCheck.error || 'โทเค็นยืนยันตัวตนจาก Google ไม่ถูกต้องหรือหมดอายุ',
          },
          { status: 401 }
        );
      }

      const targetGmail = googleCheck.email;

      // Check instructor first, then student
      let user: AuthSessionCandidate | null = await authenticateGoogleUser(targetGmail);
      if (!user) {
        user = await authenticateStudent(targetGmail);
      }

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'ไม่พบบัญชีอาจารย์หรือนิสิตที่เชื่อมโยงกับอีเมลนี้' },
          { status: 404 }
        );
      }

      resetRateLimit(`auth:${clientIp}`);

      const sessionUser = registerSession(user, 'GOOGLE');

      const response = NextResponse.json({
        success: true,
        user: sessionUser,
        message: `เข้าสู่ระบบสำเร็จ: ยินดีต้อนรับ ${user.name} (${sessionUser.role === 'STUDENT' ? 'นิสิต' : 'อาจารย์'})`,
      });

      attachAuthCookies(response, sessionUser);

      return response;
    }

    // 2. Standard Email/Gmail/StudentID + Password Authentication
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกรหัสนิสิต หรืออีเมล (@mcu.ac.th / Gmail) และรหัสผ่าน' },
        { status: 400 }
      );
    }

    // Check instructor first, then student
    let user = await authenticateInstructor(email, password);
    if (!user) {
      user = await authenticateStudent(email, password);
    }

    if (!user) {
      // If login identifier matches an instructor account, audit failed attempt for security monitoring
      try {
        const cleanLoginId = String(email || '').trim().toLowerCase();
        const instructors = await getInstructorAccounts();
        const matchedInstructor = instructors.find(
          (inst) =>
            inst.email?.toLowerCase() === cleanLoginId ||
            inst.gmail?.toLowerCase() === cleanLoginId ||
            inst.id?.toLowerCase() === cleanLoginId ||
            inst.name?.toLowerCase() === cleanLoginId,
        );
        if (matchedInstructor) {
          recordFailedLoginAttempt(
            matchedInstructor.id || matchedInstructor.email,
            matchedInstructor.email,
            matchedInstructor.name,
            clientIp,
            userAgent,
            'รหัสผ่านไม่ถูกต้อง',
          );
        }
      } catch {}

      return NextResponse.json(
        {
          success: false,
          error: 'รหัสนิสิต อีเมล หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง',
        },
        { status: 401 }
      );
    }

    resetRateLimit(`auth:${clientIp}`);

    // Check system setting: Force password change on first login
    const settings = await getSystemSettings();
    const typedUser: AuthSessionCandidate = user;
    const isForceEnabled = settings.forcePasswordChangeOnFirstLogin !== false;
    const hasChanged = Boolean(typedUser.hasChangedPassword);
    const isDefaultPassword =
      password === 'mcu123456' ||
      password === typedUser.defaultPassword ||
      password === typedUser.studentCode ||
      password === '123456';

    const mustChangePassword = isForceEnabled && (!hasChanged || isDefaultPassword);

    const safeUserWithFlag = {
      ...user,
      hasChangedPassword: hasChanged,
      mustChangePassword,
    };

    const sessionUser = registerSession(safeUserWithFlag);

    const response = NextResponse.json({
      success: true,
      mustChangePassword,
      user: sessionUser,
      message: mustChangePassword
        ? 'กรุณากำหนดรหัสผ่านใหม่สำหรับการเข้าใช้งานครั้งแรกเพื่อความปลอดภัย'
        : `ยินดีต้อนรับ ${user.name}`,
    });

    // Set secure cookie for session
    attachAuthCookies(response, sessionUser);

    return response;
  } catch (err: unknown) {
    return apiErrorResponse(err, 403);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'list') {
      const all = await getInstructorAccounts();
      const safe = all.map(({ password, ...u }) => u);
      return NextResponse.json({ success: true, count: safe.length, data: safe });
    }

    const cookieHeader = request.headers.get('cookie') || '';
    let verified: AuthSessionCandidate | null = null;
    
    // First, verify via cryptographically signed httpOnly session token
    const tokenMatch = cookieHeader.match(/mcu_session_token=([^;]+)/);
    if (tokenMatch && tokenMatch[1]) {
      verified = verifySessionToken(decodeURIComponent(tokenMatch[1]));
    }

    // Fallback check on unsigned client cookie strictly in non-production environments
    if (!verified && process.env.NODE_ENV !== 'production') {
      const match = cookieHeader.match(/mcu_auth_user=([^;]+)/);
      if (match && match[1]) {
        try {
          verified = JSON.parse(decodeURIComponent(match[1]));
        } catch (e) {}
      }
    }

    // Login Audit History endpoint (Owner or Admin/Officer only)
    if (action === 'history') {
      if (!verified) {
        return NextResponse.json(
          { success: false, error: 'กรุณาเข้าสู่ระบบเพื่อดูประวัติการเข้าใช้งาน' },
          { status: 401 }
        );
      }

      const roleUpper = String(verified.role || '').toUpperCase();
      const canInspectOther =
        roleUpper === 'SUPER_ADMIN' ||
        roleUpper === 'ADMIN' ||
        roleUpper === 'OFFICER' ||
        roleUpper === 'STAFF' ||
        verified.isSuperAdmin === true ||
        Boolean((verified as any).isActingOfficer);

      const requestedId = searchParams.get('userId')?.trim();
      const ownKeys = [verified.id, verified.studentCode, verified.email, verified.gmail]
        .filter(Boolean)
        .map((s) => String(s).trim().toLowerCase());

      const isSelfRequest = !requestedId || ownKeys.includes(requestedId.toLowerCase());
      if (!isSelfRequest && !canInspectOther) {
        return NextResponse.json(
          { success: false, error: 'ไม่มีสิทธิ์เข้าถึงประวัติการเข้าใช้ของบัญชีอื่น' },
          { status: 403 }
        );
      }

      const history = isSelfRequest
        ? getUserLoginHistory(verified.id, verified.studentCode, verified.email, verified.gmail)
        : getUserLoginHistory(requestedId);
      const security = analyzeLoginSecurity(history, verified.sessionId);

      return NextResponse.json({
        success: true,
        history,
        security,
        currentSessionId: verified.sessionId || null,
      });
    }

    if (verified) {
      // Validate single active session per user
      const sessionCheck = validateUserSession(verified.id || verified.email, verified.sessionId);
      if (sessionCheck.conflict) {
        // Old session was superseded by another device login
        const conflictResp = NextResponse.json({
          success: true,
          authenticated: false,
          sessionConflict: true,
          activeDevice: sessionCheck.activeDevice,
          message: sessionCheck.message,
          user: null,
        });
        const clearOpts = { path: '/', maxAge: 0 };
        conflictResp.cookies.set('mcu_session_token', '', { ...clearOpts, httpOnly: true });
        conflictResp.cookies.set('mcu_auth_user', '', { ...clearOpts, httpOnly: false });
        return conflictResp;
      }

      return NextResponse.json({ success: true, authenticated: true, user: verified });
    }

    return NextResponse.json({ success: true, authenticated: false, user: null });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/mcu_session_token=([^;]+)/);
    if (tokenMatch && tokenMatch[1]) {
      const verified = verifySessionToken(decodeURIComponent(tokenMatch[1]));
      if (verified) {
        revokeUserSession(verified.id || verified.email, verified.sessionId);
      }
    }
  } catch {}

  const response = NextResponse.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
  const clearOpts = {
    path: '/',
    maxAge: 0,
  };
  response.cookies.set('mcu_session_token', '', { ...clearOpts, httpOnly: true });
  response.cookies.set('mcu_auth_user', '', { ...clearOpts, httpOnly: false });
  return response;
}
