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

  it('does not extract compound academic titles from aliases (preventing false matches)', () => {
    const user = {
      name: 'พระมหายงยุทธ ธีรธมฺโม, ผศ.ดร.',
      nameEn: 'Asst. Prof. Phramaha Yongyut Dhiradhammo, Ph.D.',
      aliases: ['ยงยุทธ', 'ธีรธมฺโม', 'ผศ.ดร.', 'รศ.ดร.'],
    };

    const tokens = getSubstantiveTokens(user);
    expect(tokens).not.toContain('ผศ.ดร');
    expect(tokens).not.toContain('ผศ.ดร.');
    expect(tokens).not.toContain('รศ.ดร');
    expect(tokens).toContain('ยงยุทธ');
    expect(tokens).toContain('ธีรธมฺโม');

    // Should not match other professors who only share the title ผศ.ดร.
    expect(matchInstructorStrict(user, 'ผศ.ดร.สมชาย ใจดี')).toBe(false);
    expect(matchInstructorStrict(user, 'พระจาตุรงค์ อาจารสุโภ, ผศ.ดร.')).toBe(false);
    // Should match his own name
    expect(matchInstructorStrict(user, 'พระมหายงยุทธ ธีรธมฺโม, ผศ.ดร.')).toBe(true);
    expect(matchInstructorStrict(user, 'Asst. Prof. Phramaha Yongyut Dhiradhammo, Ph.D.')).toBe(true);
  });

  it('correctly isolates Phramaha Mongkolkarn and Ven. Dr. Suvinaya without false matches', () => {
    const mongkolkarn = {
      name: 'พระมหามงคลกานต์ ฐิตธมฺโม, รศ.ดร.',
      nameEn: 'Assoc. Prof. Phramaha Mongkolkarn Thitadhammo, Ph.D.',
      aliases: ['มงคลกานต์', 'ฐิตธมฺโม', 'Mongkolkarn', 'Thitadhammo'],
    };

    // Should match his own subjects
    expect(matchInstructorStrict(mongkolkarn, 'พระมหามงคลกานต์ ฐิตธมฺโม, รศ. ดร.*/อ.ดร.คงชิต ชินสิญจ์')).toBe(true);
    // Should NOT match other รศ.ดร. courses (e.g. Gamification or Ai)
    expect(matchInstructorStrict(mongkolkarn, 'รศ.ดร.วิลาวัลย์ / รศ.ดร.วราพร')).toBe(false);
    expect(matchInstructorStrict(mongkolkarn, 'รศ.ดร.บัญญพน สวัสดี/ดร.วิศาล มายัง')).toBe(false);

    const suvinaya = {
      name: 'Ven. Dr. Suvinaya Bhikkhu',
      nameEn: 'Ven. Dr. Suvinaya Bhikkhu',
      aliases: ['Suvinaya', 'สุวินัย'],
    };

    // Should match his own subjects
    expect(matchInstructorStrict(suvinaya, 'Ven. Dr. Suvinaya Bhikkhu*')).toBe(true);
    // Should NOT match other Bhikkhu instructors
    expect(matchInstructorStrict(suvinaya, 'Ven. Dharma Priya Bhikkhu, Ph.D.')).toBe(false);
    expect(matchInstructorStrict(suvinaya, 'Ven. Dr. Subinoy Bhikku*')).toBe(false);
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

  it('correctly matches Dr. Supapan Permpool with suppapan.per / supapan.per across English and Thai courses', () => {
    const user1 = {
      name: 'ผศ.พิเศษ ดร.สุภาพรรณ เพิ่มพูน',
      email: 'suppapan.per@mcu.ac.th',
    };
    const user2 = {
      name: 'อาจารย์ (suppapan.per)',
      email: 'suppapan.per@mcu.ac.th',
    };
    const user3 = {
      name: 'อาจารย์ (suppapan.per)',
      email: 'teacher66@mcu.ac.th',
      aliases: ['สุภาพรรณ', 'เพิ่มพูน', 'Supapan', 'Suppapan'],
    };

    const courseThai = 'พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.*/ผศ.พิเศษ ดร.สุภาพรรณ เพิ่มพูน';
    const courseEng1 = 'Asst. Prof. Dr. Supapan Permpool*';
    const courseEng2 = 'Asst. Prof. Dr. Supapan Permpool';

    expect(matchInstructorStrict(user1, courseThai)).toBe(true);
    expect(matchInstructorStrict(user1, courseEng1)).toBe(true);
    expect(matchInstructorStrict(user1, courseEng2)).toBe(true);

    expect(matchInstructorStrict(user2, courseThai)).toBe(true);
    expect(matchInstructorStrict(user2, courseEng1)).toBe(true);
    expect(matchInstructorStrict(user2, courseEng2)).toBe(true);

    expect(matchInstructorStrict(user3, courseThai)).toBe(true);
    expect(matchInstructorStrict(user3, courseEng1)).toBe(true);
    expect(matchInstructorStrict(user3, courseEng2)).toBe(true);
  });

  it('cleans Thai and English titles uniformly', () => {
    expect(cleanInstructorName('ผศ.ดร.สมชาย')).toBe('สมชาย');
    expect(cleanInstructorName('พระมหาไพศาล')).toBe('ไพศาล');
    expect(cleanInstructorName('Dr. John Doe')).toBe('John Doe');
    expect(cleanInstructorName('')).toBe('');
  });
});
