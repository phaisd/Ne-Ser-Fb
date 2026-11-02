import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const contentType = request.headers.get('content-type') || '';

    // Case 1: FormData (File Upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'ไม่พบไฟล์รูปภาพที่อัปโหลด' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Extract extension safely
      const originalName = file.name || 'logo.png';
      const ext = path.extname(originalName) || '.png';
      const cleanExt = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'].includes(ext.toLowerCase())
        ? ext.toLowerCase()
        : '.png';

      const fileName = `logo-${Date.now()}${cleanExt}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${fileName}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: fileName,
        message: 'อัปโหลดรูปภาพโลโก้สำเร็จเรียบร้อยแล้ว',
      });
    }

    // Case 2: JSON Payload (Base64)
    const body = await request.json();
    const { dataUrl, filename } = body;

    if (!dataUrl) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลรูปภาพ (Data URL)' }, { status: 400 });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // Just return the dataUrl directly if it's already a valid URL or dataUrl
      return NextResponse.json({ success: true, url: dataUrl });
    }

    const mime = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = '.png';
    if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
    else if (mime.includes('svg')) ext = '.svg';
    else if (mime.includes('webp')) ext = '.webp';

    const fileName = `logo-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: fileName,
      message: 'อัปโหลดและบันทึกรูปภาพโลโก้สำเร็จ',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
