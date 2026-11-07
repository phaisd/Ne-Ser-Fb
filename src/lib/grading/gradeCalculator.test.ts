import { describe, it, expect } from 'vitest';
import {
  calculateMcuGrade,
  getGradePoint,
  calculateTotalScore,
  calculateGradeSummaryStats,
  MCU_GRADING_SCALE,
} from './gradeCalculator';

describe('MCU Grade Calculator (gradeCalculator)', () => {
  describe('calculateMcuGrade', () => {
    it('returns correct letter grades across MCU cutoff boundaries', () => {
      // Boundaries & standard values
      expect(calculateMcuGrade(100)).toBe('A');
      expect(calculateMcuGrade(90)).toBe('A');
      expect(calculateMcuGrade(89.5)).toBe('A'); // Math.round rounds up to 90
      expect(calculateMcuGrade(89.4)).toBe('B+');
      expect(calculateMcuGrade(85)).toBe('B+');
      expect(calculateMcuGrade(84.5)).toBe('B+'); // 85
      expect(calculateMcuGrade(80)).toBe('B');
      expect(calculateMcuGrade(75)).toBe('C+');
      expect(calculateMcuGrade(70)).toBe('C');
      expect(calculateMcuGrade(65)).toBe('D+');
      expect(calculateMcuGrade(60)).toBe('D');
      expect(calculateMcuGrade(59.4)).toBe('F');
      expect(calculateMcuGrade(0)).toBe('F');
    });

    it('handles null, undefined, and NaN gracefully', () => {
      expect(calculateMcuGrade(null)).toBe('');
      expect(calculateMcuGrade(undefined)).toBe('');
      expect(calculateMcuGrade(NaN)).toBe('');
    });
  });

  describe('getGradePoint', () => {
    it('returns correct grade point equivalent', () => {
      expect(getGradePoint('A')).toBe(4.0);
      expect(getGradePoint('b+')).toBe(3.5); // case insensitive
      expect(getGradePoint('B')).toBe(3.0);
      expect(getGradePoint('C+')).toBe(2.5);
      expect(getGradePoint('C')).toBe(2.0);
      expect(getGradePoint('D+')).toBe(1.5);
      expect(getGradePoint('D')).toBe(1.0);
      expect(getGradePoint('F')).toBe(0.0);
      expect(getGradePoint('Invalid')).toBeNull();
    });
  });

  describe('calculateTotalScore', () => {
    it('sums all 4 score components accurately', () => {
      const total = calculateTotalScore({
        assignScore: 20,
        affectiveScore: 10,
        midtermScore: 30,
        finalScore: 35.5,
      });
      expect(total).toBe(95.5);
    });

    it('treats null/undefined components as zero if at least one score exists', () => {
      const total = calculateTotalScore({
        assignScore: 25,
        affectiveScore: null,
        midtermScore: undefined,
        finalScore: null,
      });
      expect(total).toBe(25);
    });

    it('returns null if all components are null or undefined', () => {
      expect(calculateTotalScore({})).toBeNull();
      expect(
        calculateTotalScore({
          assignScore: null,
          affectiveScore: null,
          midtermScore: null,
          finalScore: null,
        })
      ).toBeNull();
    });
  });

  describe('calculateGradeSummaryStats', () => {
    it('aggregates student grade distributions and calculates max/min/average', () => {
      const rows = [
        { grade: 'A', totalScore: 92 },
        { grade: 'B+', totalScore: 88 },
        { grade: 'B', totalScore: 82 },
        { grade: 'F', totalScore: 45 },
        { grade: 'I', totalScore: null, remark: 'ขาดสอบ' },
        { grade: '', totalScore: null, remark: 'หมดสิทธิ์สอบ' },
      ];

      const stats = calculateGradeSummaryStats(rows);

      expect(stats.totalStudents).toBe(6);
      expect(stats.examinedCount).toBe(4);
      expect(stats.absentOrIneligibleCount).toBe(2);
      expect(stats.counts['A']).toBe(1);
      expect(stats.counts['B+']).toBe(1);
      expect(stats.counts['B']).toBe(1);
      expect(stats.counts['F']).toBe(1);
      expect(stats.maxScore).toBe(92);
      expect(stats.minScore).toBe(45);
      // (92 + 88 + 82 + 45) / 4 = 307 / 4 = 76.75
      expect(stats.averageScore).toBe(76.75);
      expect(stats.hasGradedAny).toBe(true);
    });

    it('handles empty student list cleanly', () => {
      const stats = calculateGradeSummaryStats([]);
      expect(stats.totalStudents).toBe(0);
      expect(stats.examinedCount).toBe(0);
      expect(stats.maxScore).toBeNull();
      expect(stats.minScore).toBeNull();
      expect(stats.averageScore).toBeNull();
      expect(stats.hasGradedAny).toBe(false);
    });
  });
});
