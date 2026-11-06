/**
 * Security utilities for Production Hardening:
 * 1. CSV/Excel Formula Injection Prevention (DDE / Macro attack mitigation)
 * 2. File Magic Bytes Verification (Preventing disguised executables/scripts)
 * 3. In-Memory Rate Limiter for API endpoints (Brute-force & upload flood protection)
 */

/**
 * Sanitizes a cell value before exporting or importing CSV/Excel data.
 * Prevents CSV Formula Injection (e.g., =cmd|..., +..., -..., @..., \t, \r)
 * which could execute arbitrary commands when opened in Microsoft Excel on Windows.
 */
export function sanitizeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // If string starts with formula trigger characters (=, +, -, @, Tab, CR)
  // prefix with a single quote so Excel treats it strictly as plain text.
  if (/^[=+\-@\t\r]/.test(str.trim())) {
    return `'${str.replace(/"/g, '""')}`;
  }
  return str.replace(/"/g, '""');
}

/**
 * Wraps a sanitized value in double quotes for safe CSV row generation.
 */
export function toSafeCsvCell(val: unknown): string {
  return `"${sanitizeCsvField(val)}"`;
}

/**
 * Cleans an imported CSV cell to strip any leading malicious formula triggers.
 */
export function cleanImportedCsvCell(val: string | undefined | null): string {
  if (!val) return '';
  let trimmed = val.trim().replace(/^"|"$/g, '').trim();
  // Remove leading formula injection characters (=, @) or leading single-quote escape
  while (/^[=@\t\r]/.test(trimmed)) {
    trimmed = trimmed.substring(1).trim();
  }
  if (trimmed.startsWith("'") && /^[=+\-@]/.test(trimmed.substring(1))) {
    trimmed = trimmed.substring(1);
  }
  return trimmed;
}

/**
 * Verifies the binary Magic Bytes (file signature) of an uploaded buffer.
 * Ensures an attacker cannot rename a malicious .exe, .html, or .svg script to .jpg or .pdf.
 */
export function verifyFileMagicBytes(
  buffer: Buffer,
  expectedExt: string
): { valid: boolean; detectedType?: string; reason?: string } {
  if (!buffer || buffer.length < 4) {
    return { valid: false, reason: 'ไฟล์มีขนาดเล็กผิดปกติหรือไม่มีข้อมูลไบนารี' };
  }

  const ext = expectedExt.toLowerCase();

  // Check for embedded script/HTML/executable signatures anywhere in the first 512 bytes
  const headText = buffer.subarray(0, Math.min(buffer.length, 512)).toString('utf8').toLowerCase();
  if (
    headText.includes('<script') ||
    headText.includes('javascript:') ||
    headText.includes('<html') ||
    headText.includes('<!doctype html') ||
    headText.includes('<svg') ||
    headText.includes('onload=') ||
    headText.includes('onerror=')
  ) {
    return {
      valid: false,
      reason: 'ตรวจพบโค้ดสคริปต์หรือ HTML/SVG แฝงในไฟล์ (ไม่อนุญาตเพื่อความปลอดภัย)',
    };
  }

  // Windows MZ Executable / PE Header check (0x4D 0x5A = 'MZ')
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return {
      valid: false,
      reason: 'ตรวจพบไฟล์โปรแกรมปฏิบัติการ (.exe/.dll) ปลอมแปลงนามสกุล',
    };
  }

  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  const isPdf =
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  // JPEG: FF D8 FF
  const isJpeg =
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  // GIF: GIF87a or GIF89a (47 49 46 38)
  const isGif =
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38;

  // WEBP: RIFF....WEBP
  const isWebp =
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (ext === '.pdf') {
    return isPdf
      ? { valid: true, detectedType: 'application/pdf' }
      : { valid: false, reason: 'เนื้อหาไฟล์ไม่ใช่เอกสาร PDF ที่ถูกต้อง (Magic Bytes Mismatch)' };
  }

  if (ext === '.png') {
    return isPng
      ? { valid: true, detectedType: 'image/png' }
      : { valid: false, reason: 'เนื้อหาไฟล์ไม่ใช่รูปภาพ PNG ที่ถูกต้อง (Magic Bytes Mismatch)' };
  }

  if (ext === '.jpg' || ext === '.jpeg') {
    return isJpeg
      ? { valid: true, detectedType: 'image/jpeg' }
      : { valid: false, reason: 'เนื้อหาไฟล์ไม่ใช่รูปภาพ JPEG ที่ถูกต้อง (Magic Bytes Mismatch)' };
  }

  if (ext === '.gif') {
    return isGif
      ? { valid: true, detectedType: 'image/gif' }
      : { valid: false, reason: 'เนื้อหาไฟล์ไม่ใช่รูปภาพ GIF ที่ถูกต้อง (Magic Bytes Mismatch)' };
  }

  if (ext === '.webp') {
    return isWebp
      ? { valid: true, detectedType: 'image/webp' }
      : { valid: false, reason: 'เนื้อหาไฟล์ไม่ใช่รูปภาพ WEBP ที่ถูกต้อง (Magic Bytes Mismatch)' };
  }

  // Fallback: if any valid image/pdf signature matches
  if (isPdf || isPng || isJpeg || isGif || isWebp) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: 'ชนิดไฟล์ไม่ผ่านการตรวจสอบลายเซ็นไบนารี (รองรับเฉพาะ JPG, PNG, WEBP, GIF, PDF แท้เท่านั้น)',
  };
}

/**
 * Lightweight sliding-window rate limiter per IP + bucket key.
 */
interface RateRecord {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateRecord>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = rateBuckets.get(identifier);

  if (!existing || now > existing.resetAt) {
    rateBuckets.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - existing.count),
    retryAfterSeconds: 0,
  };
}
