import { describe, it, expect } from 'vitest';
import {
  sanitizeCsvField,
  cleanImportedCsvCell,
  verifyFileMagicBytes,
  checkRateLimit,
} from './security';

describe('Production Security Utilities (security.ts)', () => {
  describe('CSV / Excel Formula Injection Protection', () => {
    it('escapes dangerous formula prefixes (=, +, -, @)', () => {
      expect(sanitizeCsvField("=cmd|'/C calc'!A0")).toBe("'=cmd|'/C calc'!A0");
      expect(sanitizeCsvField('@SUM(1+1)*cmd')).toBe("'@SUM(1+1)*cmd");
      expect(sanitizeCsvField('+2+3')).toBe("'+2+3");
      expect(sanitizeCsvField('-2-3')).toBe("'-2-3");
    });

    it('preserves safe Thai and English text normally', () => {
      expect(sanitizeCsvField('พระโชคชัย โชติปญฺโญ')).toBe('พระโชคชัย โชติปญฺโญ');
      expect(sanitizeCsvField('6901401001')).toBe('6901401001');
    });

    it('cleans malicious formula prefixes during CSV import', () => {
      expect(cleanImportedCsvCell('"=cmd|calc"')).toBe('cmd|calc');
      expect(cleanImportedCsvCell('"@malicious"')).toBe('malicious');
      expect(cleanImportedCsvCell('"6601501014"')).toBe('6601501014');
    });
  });

  describe('File Magic Bytes & Script/Executable Detection', () => {
    it('blocks disguised Windows MZ executables (.exe renamed to .png)', () => {
      const fakeExe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
      const res = verifyFileMagicBytes(fakeExe, '.png');
      expect(res.valid).toBe(false);
    });

    it('blocks embedded SVG or <script> tags disguised as .jpg', () => {
      const fakeImgWithScript = Buffer.from('<svg onload="alert(1)"><script>mineCrypto()</script></svg>', 'utf8');
      const res = verifyFileMagicBytes(fakeImgWithScript, '.jpg');
      expect(res.valid).toBe(false);
    });

    it('accepts authentic PNG and PDF binary magic bytes', () => {
      const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(verifyFileMagicBytes(validPng, '.png').valid).toBe(true);

      const validPdf = Buffer.from('%PDF-1.7\n...', 'utf8');
      expect(verifyFileMagicBytes(validPdf, '.pdf').valid).toBe(true);
    });
  });

  describe('Sliding-Window Rate Limiter', () => {
    it('blocks requests exceeding the maximum limit within the window', () => {
      const key = `test-ip-${Date.now()}`;
      expect(checkRateLimit(key, 2, 60000).allowed).toBe(true);
      expect(checkRateLimit(key, 2, 60000).allowed).toBe(true);
      const third = checkRateLimit(key, 2, 60000);
      expect(third.allowed).toBe(false);
      expect(third.retryAfterSeconds).toBeGreaterThan(0);
    });
  });
});
