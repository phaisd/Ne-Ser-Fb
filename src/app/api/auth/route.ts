import { NextResponse } from 'next/server';
import {
  authenticateInstructor,
  authenticateGoogleUser,
  authenticateStudent,
  getInstructorAccounts,
} from '@/lib/data-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, provider, gmail } = body;

    // 1. One-click / Direct Google & Gmail Authentication
    if (provider === 'google' || provider === 'gmail' || (gmail && !password)) {
      const targetGmail = gmail || email;
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

      const response = NextResponse.json({
        success: true,
        user,
        message: `เข้าสู่ระบบสำเร็จ: ยินดีต้อนรับ ${user.name} (${user.role === 'STUDENT' ? 'นิสิต' : 'อาจารย์'})`,
      });

      response.cookies.set('mcu_auth_user', JSON.stringify(user), {
        httpOnly: false,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

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

    const response = NextResponse.json({
      success: true,
      user,
      message: `ยินดีต้อนรับ ${user.name}`,
    });

    // Set cookie for session
    response.cookies.set('mcu_auth_user', JSON.stringify(user), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

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
  response.cookies.set('mcu_auth_user', '', {
    httpOnly: false,
    path: '/',
    maxAge: 0,
  });
  return response;
}
