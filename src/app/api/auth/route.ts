import { NextResponse } from 'next/server';
import {
  authenticateInstructor,
  authenticateGoogleUser,
  authenticateStudent,
  getInstructorAccounts,
  getSystemSettings,
  updateInstructorPassword,
  updateStudentPassword,
} from '@/lib/data-store';
import { checkRateLimit, resetRateLimit, createSignedSessionToken, verifySessionToken } from '@/lib/auth-security';

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
    const getAuthCookieOptions = (httpOnly = true) => {
      const opts: any = {
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

    const attachAuthCookies = (resp: NextResponse, u: any) => {
      const token = createSignedSessionToken(u);
      // 1. Secure Signed HttpOnly Session Cookie (Source of truth for Server APIs)
      resp.cookies.set('mcu_session_token', token, getAuthCookieOptions(true));
      // 2. Client-readable profile cookie for fast UI rendering (Non-sensitive display info only)
      resp.cookies.set('mcu_auth_user', JSON.stringify(u), getAuthCookieOptions(false));
    };

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
          { success: false, error: 'ไม่สามารถใช้รหัสผ่านเริ่มต้น (mcu123456) ได้ กรุณาตั้งรหัสผ่านใหม่ที่ปลอดภัย' },
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
      let updatedUser: any = null;

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

      const response = NextResponse.json({
        success: true,
        user: { ...updatedUser, hasChangedPassword: true, mustChangePassword: false },
        message: 'เปลี่ยนรหัสผ่านสำหรับการเข้าใช้งานครั้งแรกเรียบร้อยแล้ว',
      });

      attachAuthCookies(response, { ...updatedUser, hasChangedPassword: true, mustChangePassword: false });

      return response;
    }

    // 1. One-click / Direct Google & Gmail Authentication (including Google Identity Services JWT credential)
    if (provider === 'google' || provider === 'gmail' || credential || (gmail && !password)) {
      let targetGmail = gmail || email;

      if (!targetGmail && credential && typeof credential === 'string') {
        try {
          const parts = credential.split('.');
          if (parts.length === 3) {
            const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
            const payload = JSON.parse(payloadJson);
            if (payload?.email) {
              targetGmail = String(payload.email).trim();
            }
          }
        } catch {}
      }

      if (!targetGmail) {
        return NextResponse.json(
          { success: false, error: 'กรุณาระบุบัญชี Gmail หรืออีเมล @mcu.ac.th สำหรับเข้าสู่ระบบ' },
          { status: 400 }
        );
      }

      // Check instructor first, then student
      let user = await authenticateGoogleUser(targetGmail);
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

      const response = NextResponse.json({
        success: true,
        user,
        message: `เข้าสู่ระบบสำเร็จ: ยินดีต้อนรับ ${user.name} (${(user as any).role === 'STUDENT' ? 'นิสิต' : 'อาจารย์'})`,
      });

      attachAuthCookies(response, user);

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
      return NextResponse.json(
        {
          success: false,
          error:
            'รหัสนิสิต/อีเมล หรือรหัสผ่านไม่ถูกต้อง (รหัสผ่านเริ่มต้น: mcu123456 หรือรหัสนิสิต)',
        },
        { status: 401 }
      );
    }

    resetRateLimit(`auth:${clientIp}`);

    // Check system setting: Force password change on first login
    const settings = await getSystemSettings();
    const isForceEnabled = settings.forcePasswordChangeOnFirstLogin !== false;
    const hasChanged = Boolean((user as any).hasChangedPassword);
    const isDefaultPassword =
      password === 'mcu123456' ||
      password === (user as any).defaultPassword ||
      password === (user as any).studentCode ||
      password === '123456';

    const mustChangePassword = isForceEnabled && (!hasChanged || isDefaultPassword);

    const safeUserWithFlag = {
      ...user,
      hasChangedPassword: hasChanged,
      mustChangePassword,
    };

    const response = NextResponse.json({
      success: true,
      mustChangePassword,
      user: safeUserWithFlag,
      message: mustChangePassword
        ? 'กรุณากำหนดรหัสผ่านใหม่สำหรับการเข้าใช้งานครั้งแรกเพื่อความปลอดภัย'
        : `ยินดีต้อนรับ ${user.name}`,
    });

    // Set secure cookie for session
    attachAuthCookies(response, safeUserWithFlag);

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 403 });
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
    
    // First, verify via cryptographically signed httpOnly session token
    const tokenMatch = cookieHeader.match(/mcu_session_token=([^;]+)/);
    if (tokenMatch && tokenMatch[1]) {
      const verified = verifySessionToken(decodeURIComponent(tokenMatch[1]));
      if (verified) {
        return NextResponse.json({ success: true, authenticated: true, user: verified });
      }
    }

    // Fallback check on client cookie
    const match = cookieHeader.match(/mcu_auth_user=([^;]+)/);
    if (match && match[1]) {
      try {
        const decoded = decodeURIComponent(match[1]);
        const user = JSON.parse(decoded);
        return NextResponse.json({ success: true, authenticated: true, user });
      } catch (e) {}
    }

    return NextResponse.json({ success: true, authenticated: false, user: null });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
  const clearOpts = {
    path: '/',
    maxAge: 0,
  };
  response.cookies.set('mcu_session_token', '', { ...clearOpts, httpOnly: true });
  response.cookies.set('mcu_auth_user', '', { ...clearOpts, httpOnly: false });
  return response;
}
