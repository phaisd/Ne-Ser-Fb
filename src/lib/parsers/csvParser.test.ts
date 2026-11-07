import { describe, it, expect } from 'vitest';
import {
  detectDelimiter,
  splitCSVLines,
  parseCSVRow,
  recombineAcademicTitles,
} from './csvParser';

describe('CSV / TSV & Delimited Text Parser (csvParser)', () => {
  describe('detectDelimiter', () => {
    it('detects tab delimiter when present', () => {
      expect(detectDelimiter('Name\tEmail\tDepartment')).toBe('\t');
    });

    it('detects pipe delimiter when present', () => {
      expect(detectDelimiter('Name|Email|Department')).toBe('|');
    });

    it('detects semicolon when no comma is present', () => {
      expect(detectDelimiter('Name;Email;Department')).toBe(';');
    });

    it('defaults to comma', () => {
      expect(detectDelimiter('Name,Email,Department')).toBe(',');
    });
  });

  describe('splitCSVLines', () => {
    it('splits standard CRLF and LF lines', () => {
      const csv = 'Line1\r\nLine2\nLine3';
      expect(splitCSVLines(csv)).toEqual(['Line1', 'Line2', 'Line3']);
    });

    it('preserves embedded newlines within quotes', () => {
      const csv = 'Line1,"Line 2\nwith newline",Line3';
      const lines = splitCSVLines(csv);
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('Line1,"Line 2\nwith newline",Line3');
    });
  });

  describe('parseCSVRow', () => {
    it('parses standard comma-separated values', () => {
      const row = 'พระมหาดวงเด่น,duangden@mcu.ac.th,คณะพุทธศาสตร์';
      expect(parseCSVRow(row, ',')).toEqual([
        'พระมหาดวงเด่น',
        'duangden@mcu.ac.th',
        'คณะพุทธศาสตร์',
      ]);
    });

    it('parses quoted values containing commas', () => {
      const row = '"พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.",teacher1@mcu.ac.th,คณะพุทธศาสตร์';
      expect(parseCSVRow(row, ',')).toEqual([
        'พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.',
        'teacher1@mcu.ac.th',
        'คณะพุทธศาสตร์',
      ]);
    });

    it('handles escaped quotes inside quoted values', () => {
      const row = '"Prof. Dr. ""John"" Doe",john@mcu.ac.th';
      expect(parseCSVRow(row, ',')).toEqual([
        'Prof. Dr. "John" Doe',
        'john@mcu.ac.th',
      ]);
    });
  });

  describe('recombineAcademicTitles', () => {
    it('recombines unquoted comma split academic title suffix', () => {
      const splitRow = [
        'พระมหาจีรวัฒน์ กนฺตวณฺโณ',
        'รศ.ดร.',
        'teacher1@mcu.ac.th',
        'คณะพุทธศาสตร์',
      ];
      const result = recombineAcademicTitles(splitRow);
      expect(result).toEqual([
        'พระมหาจีรวัฒน์ กนฺตวณฺโณ, รศ.ดร.',
        'teacher1@mcu.ac.th',
        'คณะพุทธศาสตร์',
      ]);
    });

    it('recombines English academic title suffix such as Ph.D.', () => {
      const splitRow = [
        'Assoc. Prof. W. Piyaratana',
        'Ph.D.',
        'piyaratana@mcu.ac.th',
      ];
      const result = recombineAcademicTitles(splitRow);
      expect(result).toEqual([
        'Assoc. Prof. W. Piyaratana, Ph.D.',
        'piyaratana@mcu.ac.th',
      ]);
    });

    it('does not alter rows without academic suffixes in column 1', () => {
      const normalRow = ['นายสมชาย ใจดี', 'somchai@mcu.ac.th', 'คณะพุทธศาสตร์'];
      expect(recombineAcademicTitles(normalRow)).toEqual(normalRow);
    });
  });
});
