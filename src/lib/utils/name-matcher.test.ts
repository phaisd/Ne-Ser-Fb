import { describe, it, expect } from 'vitest';
import {
  getSubstantiveTokens,
  matchInstructorStrict,
  cleanInstructorName,
} from './name-matcher';

describe('name-matcher utility', () => {
  it('extracts substantive tokens ignoring honorific titles and stop words', () => {
    const user = {
      name: 'พระมหาไพศาล ฐิตปญฺโญ ดร.',
      nameEn: 'Ven. Dr. Phaisal Thitapanno',
      aliases: ['phaisal', 'อ.ไพศาล'],
    };

    const tokens = getSubstantiveTokens(user);
    expect(tokens).toContain('ไพศาล');
    expect(tokens).toContain('ฐิตปญฺโญ');
    expect(tokens).toContain('phaisal');
    expect(tokens).toContain('thitapanno');
    // Stop words should be excluded
    expect(tokens).not.toContain('พระ');
    expect(tokens).not.toContain('dr');
    expect(tokens).not.toContain('ven');
  });

  it('matches instructor string strictly based on substantive tokens', () => {
    const user = {
      name: 'ผศ.ดร.สมชาย ใจดี',
      nameEn: 'Asst. Prof. Dr. Somchai Jaidee',
    };

    expect(matchInstructorStrict(user, 'ผศ.ดร.สมชาย ใจดี')).toBe(true);
    expect(matchInstructorStrict(user, 'อ.สมชาย')).toBe(true);
    expect(matchInstructorStrict(user, 'Dr. Somchai')).toBe(true);
    expect(matchInstructorStrict(user, 'พระมหาสมโภช')).toBe(false);
  });

  it('cleans Thai and English titles uniformly', () => {
    expect(cleanInstructorName('ผศ.ดร.สมชาย')).toBe('สมชาย');
    expect(cleanInstructorName('พระมหาไพศาล')).toBe('ไพศาล');
    expect(cleanInstructorName('Dr. John Doe')).toBe('John Doe');
    expect(cleanInstructorName('')).toBe('');
  });
});
