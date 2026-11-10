/**
 * Shared Name & Instructor Matching Utilities
 */

export const INSTRUCTOR_TITLE_REGEX = /\b(phra|phramaha|ven|dr|ph\.?d|asst|assoc|prof|mr|mrs|ms|พระ|พระมหา|พระครู|ผศ|รศ|ศ|ดร|อ\.ดร|อ|วิ)\b/gi;
export const INSTRUCTOR_THAI_TITLE_PREFIX = /^(ดร\.|ผศ\.|รศ\.|ศ\.|อ\.ดร\.|อ\.|พระมหา|พระครู|พระ|อาจารย์|วิ\.|ven\.|dr\.|ph\.?d\.|asst\.|assoc\.|prof\.|mr\.|mrs\.|ms\.)/i;

export const STOP_WORDS = new Set([
  'phra', 'พระ', 'ดร', 'dr', 'ven', 'asst', 'assoc', 'prof', 'ผศ', 'รศ', 'ศ', 'อาจารย์', 'อ', 'mr', 'mrs', 'ms',
  'phd', 'ph.d', 'ph.d.', 'ดร.', 'ผศ.', 'รศ.', 'ศ.', 'อ.', 'อ.ดร.', 'อ.ดร', 'พิเศษ', 'specail', 'special',
  'ผศ.ดร', 'ผศ.ดร.', 'ผศดร', 'ผศ. ดร.', 'ผศ. ดร', 'ผศ ดร',
  'รศ.ดร', 'รศ.ดร.', 'รศดร', 'รศ. ดร.', 'รศ. ดร', 'รศ ดร',
  'ศ.ดร', 'ศ.ดร.', 'ศดร', 'ศ. ดร.', 'ศ. ดร', 'ศ ดร',
  'asst. prof', 'asst. prof.', 'asst prof', 'assoc. prof', 'assoc. prof.', 'assoc prof',
  'prof. dr', 'prof. dr.', 'prof dr',
  'พระมหา', 'พระครู', 'แม่ชี', 'nun', 'bhikkhu', 'phramaha', 'phrakhru',
  'อาจารย์ประจำ', 'อาจารย์พิเศษ', 'ผู้สอน', 'บรรยาย', 'วิ.', 'วิ',
  'pha'
]);

export function isTitleOrStopWord(str: string): boolean {
  if (!str) return true;
  const clean = str.trim().toLowerCase().replace(/^[.\s]+|[.\s]+$/g, '');
  const bare = clean.replace(/[\.\s]/g, '');
  return STOP_WORDS.has(clean) || STOP_WORDS.has(bare);
}

/**
 * Strips all leading academic and monastic titles repeatedly (e.g. ผศ.ดร.สมชาย -> สมชาย)
 */
export function stripLeadingTitles(raw: string): string {
  let text = raw.trim();
  let prev = '';
  while (prev !== text) {
    prev = text;
    text = text
      .replace(/^(ผศ\.|รศ\.|ศ\.|ดร\.|อ\.ดร\.|อ\.|พระมหา|พระครู|พระ|อาจารย์|วิ\.|ven\.|dr\.|ph\.?d\.|asst\.|assoc\.|prof\.|mr\.|mrs\.|ms\.|\.)\s*/i, '')
      .replace(/^(ผศ|รศ|ศ|ดร|อ|พระ|ven|dr|asst|assoc|prof)\b\s*/i, '')
      .trim();
  }
  return text;
}

/**
 * Extracts substantive, searchable name tokens from a user or instructor account.
 */
export function getSubstantiveTokens(user?: { name?: string; nameEn?: string; aliases?: string[] } | null): string[] {
  if (!user) return [];
  const substantive = new Set<string>();

  const processText = (text?: string) => {
    if (!text) return;
    if (isTitleOrStopWord(text)) return;

    const clean = text.trim().toLowerCase().replace(/^[.\s]+|[.\s]+$/g, '');
    const bare = clean.replace(/[\.\s]/g, '');
    if (isTitleOrStopWord(clean) || isTitleOrStopWord(bare)) return;

    // Split words
    const cleanStr = text.replace(/[,*\/]/g, ' ');
    cleanStr.split(/\s+/).forEach((part: string) => {
      let token = part.trim().toLowerCase();
      token = token.replace(/^[.\s]+|[.\s]+$/g, '');
      token = stripLeadingTitles(token);
      token = token.replace(INSTRUCTOR_TITLE_REGEX, '').trim();
      const bareToken = token.replace(/[\.\s]/g, '');
      if (token.length >= 3 && !isTitleOrStopWord(token) && !isTitleOrStopWord(bareToken)) {
        substantive.add(token);
      }
    });

    let strippedFull = stripLeadingTitles(clean);
    strippedFull = strippedFull.replace(INSTRUCTOR_TITLE_REGEX, '').replace(/^[.\s,*\/]+|[.\s,*\/]+$/g, '').trim();
    strippedFull = strippedFull.replace(/[\.,*\/]/g, ' ').replace(/\s+/g, ' ').trim();
    const bareFull = strippedFull.replace(/[\.\s]/g, '');
    if (
      strippedFull.length >= 4 &&
      !isTitleOrStopWord(strippedFull) &&
      !isTitleOrStopWord(bareFull) &&
      !strippedFull.includes('@')
    ) {
      substantive.add(strippedFull);
    }
  };

  if (Array.isArray(user.aliases)) {
    user.aliases.forEach(processText);
  }
  processText(user.name);
  processText(user.nameEn);

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
  let cleaned = stripLeadingTitles(raw);
  cleaned = cleaned.replace(INSTRUCTOR_TITLE_REGEX, '');
  return cleaned.replace(/^[.\s]+|[.\s]+$/g, '').trim();
}
