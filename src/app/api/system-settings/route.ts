import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import { getSystemSettings, updateSystemSettings } from '@/lib/data-store';
import { getAuthenticatedUserFromRequest, isServerAdminOrOfficer } from '@/lib/server-auth-guard';
import { verifyFileMagicBytes } from '@/lib/security';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const settings = await getSystemSettings();
    const authUser = getAuthenticatedUserFromRequest(request);
    if (!isServerAdminOrOfficer(authUser)) {
      const {
        lineNotifyToken: _lnt,
        lineChannelAccessToken: _lcat,
        lineTargetUserId: _ltuid,
        lineWebhookUrl: _lwu,
        ...publicSettings
      } = settings;
      return NextResponse.json({ success: true, data: publicSettings });
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (err: unknown) {
    console.error('[GET /api/system-settings] Error:', err);
    return NextResponse.json({ success: false, error: getErrorMessage(err) }, { status: 500 });
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

    // Auto-convert safe raster Base64 logoUrl to saved file (block SVG script payloads)
    if (body.logoUrl && typeof body.logoUrl === 'string' && body.logoUrl.startsWith('data:image/')) {
      try {
        const matches = body.logoUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const rawExt = matches[1].toLowerCase();
          if (rawExt.includes('svg')) {
            return NextResponse.json(
              { success: false, error: 'ไม่อนุญาตให้อัปโหลดไฟล์ SVG เพื่อป้องกันสคริปต์แฝง (XSS)' },
              { status: 415 }
            );
          }

          let ext = '.png';
          if (rawExt.includes('jpeg') || rawExt.includes('jpg')) ext = '.jpg';
          else if (rawExt.includes('webp')) ext = '.webp';
          else if (rawExt.includes('gif')) ext = '.gif';

          const buffer = Buffer.from(matches[2], 'base64');
          const magic = verifyFileMagicBytes(buffer, ext);
          if (!magic.valid) {
            return NextResponse.json(
              { success: false, error: magic.reason || 'ไฟล์โลโก้ไม่ผ่านการตรวจสอบลายเซ็นไบนารี' },
              { status: 415 }
            );
          }

          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const fileName = `logo-${Date.now()}${ext}`;
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, buffer);
          body.logoUrl = `/uploads/${fileName}`;
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
  } catch (err: unknown) {
    console.error('[POST /api/system-settings] Error:', err);
    return NextResponse.json({ success: false, error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const current = await getSystemSettings();
    const baseCount = typeof current.visitorCount === 'number' && current.visitorCount > 0 ? current.visitorCount : 1272;
    const nextCount = baseCount + 1;
    await updateSystemSettings({ visitorCount: nextCount });
    return NextResponse.json({
      success: true,
      visitorCount: nextCount,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(err) }, { status: 500 });
  }
}
