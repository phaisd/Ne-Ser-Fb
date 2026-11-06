import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyFileMagicBytes, checkRateLimit } from '@/lib/security';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Strictly allow safe binary raster images and PDF only (SVG blocked to prevent embedded XSS / crypto-mining scripts)
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.pdf',
]);

export async function POST(request: Request) {
  try {
    // 1. Rate Limit Check (Max 25 uploads per 5 minutes per IP)
    const forwardedFor = request.headers.get('x-forwarded-for') || 'local';
    const clientIp = forwardedFor.split(',')[0].trim();
    const rate = checkRateLimit(`upload:${clientIp}`, 25, 5 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `มีการอัปโหลดไฟล์ถี่เกินกำหนด กรุณารอ ${rate.retryAfterSeconds} วินาทีแล้วลองใหม่อีกครั้ง`,
        },
        { status: 429 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const isServerlessReadOnly = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    if (!isServerlessReadOnly) {
      try {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
      } catch {
        // Ignore mkdir error on read-only environments
      }
    }

    const contentType = request.headers.get('content-type') || '';

    // Case 1: FormData (File Upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'ไม่พบไฟล์รูปภาพที่อัปโหลด' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: 'ขนาดไฟล์เกินกำหนด (สูงสุด 5 MB)' },
          { status: 413 }
        );
      }

      // Validate MIME type
      const mime = (file.type || '').toLowerCase();
      if (mime && !ALLOWED_MIME_TYPES.has(mime)) {
        return NextResponse.json(
          { success: false, error: 'ประเภทไฟล์ไม่ได้รับอนุญาต (รองรับเฉพาะ PDF, PNG, JPG, WEBP, GIF เท่านั้น)' },
          { status: 415 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (buffer.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: 'ขนาดไฟล์เกินกำหนด (สูงสุด 5 MB)' },
          { status: 413 }
        );
      }

      // Extract and sanitize extension safely
      const originalName = file.name || 'file.png';
      const rawExt = path.extname(originalName).toLowerCase();
      if (rawExt === '.svg' || rawExt === '.exe' || rawExt === '.html' || rawExt === '.js') {
        return NextResponse.json(
          { success: false, error: 'ไม่อนุญาตให้อัปโหลดไฟล์นามสกุลที่มีความเสี่ยงด้านความปลอดภัย (.svg, .html, .js, .exe)' },
          { status: 415 }
        );
      }
      const cleanExt = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '.png';

      // Verify binary Magic Bytes signature
      const magicCheck = verifyFileMagicBytes(buffer, cleanExt);
      if (!magicCheck.valid) {
        return NextResponse.json(
          { success: false, error: magicCheck.reason || 'ไฟล์ไม่ผ่านการตรวจสอบลายเซ็นไบนารี (Magic Bytes)' },
          { status: 415 }
        );
      }

      const prefix = cleanExt === '.pdf' ? 'doc' : 'file';
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileName = `${prefix}-${Date.now()}-${randomSuffix}${cleanExt}`;
      const filePath = path.join(uploadDir, fileName);

      // Verify path traversal prevention
      if (!path.resolve(filePath).startsWith(path.resolve(uploadDir))) {
        return NextResponse.json({ success: false, error: 'Invalid file destination path' }, { status: 400 });
      }

      let publicUrl = `/uploads/${fileName}`;
      if (isServerlessReadOnly) {
        const resolvedMime = mime || (cleanExt === '.pdf' ? 'application/pdf' : 'image/png');
        publicUrl = `data:${resolvedMime};base64,${buffer.toString('base64')}`;
      } else {
        try {
          fs.writeFileSync(filePath, buffer);
        } catch {
          const resolvedMime = mime || (cleanExt === '.pdf' ? 'application/pdf' : 'image/png');
          publicUrl = `data:${resolvedMime};base64,${buffer.toString('base64')}`;
        }
      }

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: fileName,
        message: 'อัปโหลดไฟล์สำเร็จเรียบร้อยแล้ว',
      });
    }

    // Case 2: JSON Payload (Base64)
    const body = await request.json();
    const { dataUrl } = body;

    if (!dataUrl) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลรูปภาพ (Data URL)' }, { status: 400 });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // Only allow safe http/https or relative /uploads paths if not a dataUrl
      if (typeof dataUrl === 'string' && /^(https?:\/\/|\/uploads\/)/i.test(dataUrl)) {
        return NextResponse.json({ success: true, url: dataUrl });
      }
      return NextResponse.json({ success: false, error: 'รูปแบบ URL รูปภาพไม่ถูกต้อง' }, { status: 400 });
    }

    const mime = matches[1].toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return NextResponse.json(
        { success: false, error: 'ประเภทไฟล์ Base64 ไม่ได้รับอนุญาต (ไม่อนุญาต SVG หรือสคริปต์)' },
        { status: 415 }
      );
    }

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'ขนาดข้อมูลรูปภาพเกินกำหนด (สูงสุด 5 MB)' },
        { status: 413 }
      );
    }

    let ext = '.png';
    if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
    else if (mime.includes('webp')) ext = '.webp';
    else if (mime.includes('gif')) ext = '.gif';
    else if (mime.includes('pdf')) ext = '.pdf';

    // Verify binary Magic Bytes signature
    const magicCheck = verifyFileMagicBytes(buffer, ext);
    if (!magicCheck.valid) {
      return NextResponse.json(
        { success: false, error: magicCheck.reason || 'ข้อมูล Base64 ไม่ผ่านการตรวจสอบลายเซ็นไบนารี' },
        { status: 415 }
      );
    }

    const prefix = ext === '.pdf' ? 'doc' : 'file';
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${prefix}-${Date.now()}-${randomSuffix}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    if (!path.resolve(filePath).startsWith(path.resolve(uploadDir))) {
      return NextResponse.json({ success: false, error: 'Invalid destination' }, { status: 400 });
    }

    let publicUrl = `/uploads/${fileName}`;
    if (isServerlessReadOnly) {
      publicUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    } else {
      try {
        fs.writeFileSync(filePath, buffer);
      } catch {
        publicUrl = `data:${mime};base64,${buffer.toString('base64')}`;
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: fileName,
      message: 'อัปโหลดและบันทึกรูปภาพสำเร็จ',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
