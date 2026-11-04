/**
 * Shared Name & Instructor Matching Utilities
 */

export const INSTRUCTOR_TITLE_REGEX = /\b(phra|phramaha|ven|dr|ph\.?d|asst|assoc|prof|mr|mrs|ms|พระ|พระมหา|พระครู|ผศ|รศ|ศ|ดร|อ\.ดร|อ)\b/gi;
export const INSTRUCTOR_THAI_TITLE_PREFIX = /^(ดร\.|ผศ\.|รศ\.|ศ\.|อ\.ดร\.|อ\.|พระมหา|พระครู|พระ)/;

const STOP_WORDS = new Set([
  'phra', 'พระ', 'ดร', 'dr', 'ven', 'asst', 'assoc', 'prof', 'ผศ', 'รศ', 'อาจารย์', 'อ', 'mr', 'mrs', 'ms'
]);

/**
 * Extracts substantive, searchable name tokens from a user or instructor account.
 */
export function getSubstantiveTokens(user?: { name?: string; nameEn?: string; aliases?: string[] } | null): string[] {
  if (!user) return [];
  const substantive = new Set<string>();

  // 1. Process custom aliases if present
  if (Array.isArray(user.aliases)) {
    user.aliases.forEach((al) => {
      const clean = al.trim().toLowerCase();
      if (clean && clean.length >= 3 && !STOP_WORDS.has(clean)) {
        substantive.add(clean);
      }
    });
  }

  // 2. Process Thai & English names
  const names = [user.name || '', user.nameEn || ''];
  names.forEach((n) => {
    const cleanStr = n.replace(/[,*\/]/g, ' ');
    cleanStr.split(/\s+/).forEach((part: string) => {
      let token = part.trim().toLowerCase();
      token = token.replace(/^[.\s]+|[.\s]+$/g, '');
      token = token.replace(INSTRUCTOR_THAI_TITLE_PREFIX, '');
      token = token.replace(INSTRUCTOR_TITLE_REGEX, '');
      token = token.trim();
      if (token.length >= 3 && !STOP_WORDS.has(token)) {
        substantive.add(token);
      }
    });
  });

  return Array.from(substantive);
}

/**
 * Checks if a given instructor name string matches an instructor user account strictly.
 */
export function matchInstructorStrict(
  user?: { name?: string; nameEn?: string; aliases?: string[] } | null,
  instString?: string
): boolean {
  if (!user || !instString) return false;
  const targetLower = instString.toLowerCase();
  const tokens = getSubstantiveTokens(user);
  if (tokens.length === 0) return false;

  return tokens.some((token) => {
    if (/[\u0E00-\u0E7F]/.test(token)) {
      // Thai text matching
      return targetLower.includes(token);
    }
    // Latin / English token: match word boundary
    try {
      const reg = new RegExp('\\b' + token + '\\b', 'i');
      return reg.test(targetLower);
    } catch {
      return targetLower.includes(token);
    }
  });
}

/**
 * Clean instructor title prefixes for uniform display
 */
export function cleanInstructorName(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(INSTRUCTOR_THAI_TITLE_PREFIX, '')
    .replace(INSTRUCTOR_TITLE_REGEX, '')
    .trim();
}
