import { describe, it, expect } from 'vitest';
import {
  isPractitionerEnglish,
  formatBadgeGroupLabel,
  formatBadgeDegree,
  formatBadgeFooterLocation,
} from './types';

describe('Vipassana Badges Formatting Helpers', () => {
  describe('isPractitionerEnglish', () => {
    it('detects english program from groupSpecificCode with E (e.g. B4E13)', () => {
      expect(
        isPractitionerEnglish({
          groupNumber: 4,
          groupSpecificCode: 'B4E13',
          studentName: 'DHAMMANANDA',
        })
      ).toBe(true);
    });

    it('detects english program from groupName containing English or อังกฤษ', () => {
      expect(
        isPractitionerEnglish({
          groupName: 'Group 4 (English)',
          studentCode: '6601001',
        })
      ).toBe(true);
      expect(
        isPractitionerEnglish({
          groupName: 'กลุ่ม 4 (อังกฤษ)',
          studentCode: '6601001',
        })
      ).toBe(true);
    });

    it('detects english program from major Buddhist Studies', () => {
      expect(
        isPractitionerEnglish({
          major: 'Buddhist Studies',
        })
      ).toBe(true);
    });

    it('returns false for standard Thai group and name', () => {
      expect(
        isPractitionerEnglish({
          groupNumber: 1,
          groupName: 'กลุ่ม 1',
          studentName: 'พระสมชาย สุทฺธิญาโณ',
          major: 'พระพุทธศาสนา',
        })
      ).toBe(false);
    });

    it('returns false for Group 12 exemption by default', () => {
      expect(
        isPractitionerEnglish({
          groupNumber: 12,
          groupName: 'กลุ่ม 12',
          studentName: 'พระอาจารย์',
        })
      ).toBe(false);
    });
  });

  describe('formatBadgeGroupLabel', () => {
    it('formats Group in English and กลุ่ม in Thai', () => {
      expect(formatBadgeGroupLabel(4, true)).toBe('Group 4');
      expect(formatBadgeGroupLabel(4, false)).toBe('กลุ่ม 4');
      expect(formatBadgeGroupLabel(undefined, true)).toBe('Group -');
      expect(formatBadgeGroupLabel(undefined, false)).toBe('กลุ่ม -');
    });
  });

  describe('formatBadgeDegree', () => {
    it('formats Bachelor of Arts for English badges', () => {
      expect(formatBadgeDegree('ปริญญาตรี', true)).toBe('Bachelor of Arts');
      expect(formatBadgeDegree(undefined, true)).toBe('Bachelor of Arts');
      expect(formatBadgeDegree("Bachelor's Degree", true)).toBe('Bachelor of Arts');
    });

    it('formats Master and Doctor in English', () => {
      expect(formatBadgeDegree('ปริญญาโท', true)).toBe('Master of Arts');
      expect(formatBadgeDegree('ปริญญาเอก', true)).toBe('Doctor of Philosophy');
    });

    it('keeps Thai degree for Thai badges', () => {
      expect(formatBadgeDegree('ปริญญาตรี', false)).toBe('ปริญญาตรี');
      expect(formatBadgeDegree('ปริญญาโท', false)).toBe('ปริญญาโท');
    });
  });

  describe('formatBadgeFooterLocation', () => {
    it('translates default and common locations for English badges', () => {
      expect(formatBadgeFooterLocation('สถานที่ปฏิบัติ', true)).toBe('Meditation Venue');
      expect(formatBadgeFooterLocation('', true)).toBe('Meditation Venue');
      expect(formatBadgeFooterLocation(undefined, true)).toBe('Meditation Venue');
      expect(formatBadgeFooterLocation('ศาลาปฏิบัติธรรม', true)).toBe('Meditation Hall');
      expect(formatBadgeFooterLocation('หอประชุม', true)).toBe('Main Assembly Hall');
      expect(formatBadgeFooterLocation('ห้อง 1', true)).toBe('Meditation Hall 1');
    });

    it('preserves custom English text', () => {
      expect(formatBadgeFooterLocation('Main Meditation Hall', true)).toBe('Main Meditation Hall');
    });

    it('preserves Thai text for Thai badges', () => {
      expect(formatBadgeFooterLocation('สถานที่ปฏิบัติ', false)).toBe('สถานที่ปฏิบัติ');
      expect(formatBadgeFooterLocation('ศาลา 1', false)).toBe('ศาลา 1');
    });
  });
});
