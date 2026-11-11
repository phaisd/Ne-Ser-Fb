export interface GoogleTokenVerificationResult {
  valid: boolean;
  email?: string;
  error?: string;
}

interface GoogleTokenInfoResponse {
  email?: string;
  email_verified?: string | boolean;
  aud?: string;
  iss?: string;
  exp?: string | number;
  error_description?: string;
}

const VALID_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

/**
 * Cryptographically verifies a Google Identity Services ID token via Google's tokeninfo endpoint.
 * Rejects malformed JWTs, unverified emails, expired tokens, wrong issuers, or mismatched client IDs.
 */
export async function verifyGoogleIdToken(
  credential: string,
  expectedClientId?: string
): Promise<GoogleTokenVerificationResult> {
  const token = (credential || '').trim();
  if (!token || token.split('.').length !== 3) {
    return { valid: false, error: 'รูปแบบ Google ID Token ไม่ถูกต้อง' };
  }

  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) {
      return { valid: false, error: 'Google ID Token ไม่ถูกต้องหรือหมดอายุแล้ว' };
    }

    const data = (await res.json()) as GoogleTokenInfoResponse;

    if (!data.email) {
      return { valid: false, error: 'ไม่พบข้อมูลอีเมลภายใน Google ID Token' };
    }

    const isVerified = data.email_verified === true || data.email_verified === 'true';
    if (!isVerified) {
      return { valid: false, error: 'บัญชี Google นี้ยังไม่ได้ยืนยันอีเมล' };
    }

    if (data.iss && !VALID_ISSUERS.has(data.iss)) {
      return { valid: false, error: 'ผู้ออกโทเค็นไม่ใช่ Google Accounts' };
    }

    if (data.exp !== undefined) {
      const expMs = Number(data.exp) * 1000;
      if (Number.isFinite(expMs) && expMs < Date.now()) {
        return { valid: false, error: 'Google ID Token หมดอายุแล้ว' };
      }
    }

    const trimmedExpectedClientId = expectedClientId?.trim();
    if (!trimmedExpectedClientId) {
      return { valid: false, error: 'ระบบยังไม่ได้ตั้งค่า Google Client ID สำหรับยืนยันตัวตน' };
    }

    if (!data.aud || data.aud !== trimmedExpectedClientId) {
      return { valid: false, error: 'Google Client ID ของโทเค็นไม่ตรงกับระบบ' };
    }

    return { valid: true, email: data.email.trim().toLowerCase() };
  } catch {
    return { valid: false, error: 'ไม่สามารถเชื่อมต่อเพื่อตรวจสอบโทเค็นกับ Google ได้' };
  }
}
