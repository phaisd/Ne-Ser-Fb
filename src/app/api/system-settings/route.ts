import { NextResponse } from 'next/server';
import { getSystemSettings, updateSystemSettings } from '@/lib/data-store';
import { getAuthenticatedUserFromRequest, isServerAdminOrOfficer } from '@/lib/server-auth-guard';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSystemSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (err: any) {
    console.error('[GET /api/system-settings] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Only Admin / Officer can modify system settings & branding logo
    const authUser = getAuthenticatedUserFromRequest(request);
    if (!isServerAdminOrOfficer(authUser)) {
      return NextResponse.json(
        { success: false, error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบและเจ้าหน้าที่เท่านั้น (Unauthorized)' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Auto-convert Base64 logoUrl to saved file
    if (body.logoUrl && typeof body.logoUrl === 'string' && body.logoUrl.startsWith('data:image/')) {
      try {
        const matches = body.logoUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const rawExt = matches[1].toLowerCase();
          let ext = '.png';
          if (rawExt.includes('jpeg') || rawExt.includes('jpg')) ext = '.jpg';
          else if (rawExt.includes('svg')) ext = '.svg';
          else if (rawExt.includes('webp')) ext = '.webp';
          else if (rawExt.includes('gif')) ext = '.gif';

          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const fileName = `logo-${Date.now()}${ext}`;
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
          body.logoUrl = `/uploads/${fileName}`;
          console.log(`[POST /api/system-settings] Converted Base64 logo to ${body.logoUrl}`);
        }
      } catch (fileErr) {
        console.error('[POST /api/system-settings] Failed to write Base64 file:', fileErr);
      }
    }

    const updated = await updateSystemSettings(body);
    console.log(`[POST /api/system-settings] Successfully saved system settings. Logo: ${updated.logoUrl}`);
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'บันทึกการตั้งค่าระบบและโลโก้เรียบร้อยแล้ว'
    });
  } catch (err: any) {
    console.error('[POST /api/system-settings] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
