import { describe, it, expect } from 'vitest';
import {
  calculateMaxAllowedAbsences,
  evaluateStudentEligibility,
  StudentAttendanceRecord,
} from './attendanceEvaluator';

describe('MCU Attendance & Eligibility Evaluator (attendanceEvaluator)', () => {
  describe('calculateMaxAllowedAbsences', () => {
    it('calculates max allowed absences correctly for 16 sessions with 80% rule', () => {
      // 16 * (1 - 0.8) = 16 * 0.2 = 3.2 -> floor = 3
      expect(calculateMaxAllowedAbsences(16, 80)).toBe(3);
    });

    it('calculates max allowed absences for 15 sessions with 80% rule', () => {
      // 15 * 0.2 = 3.0 -> floor = 3
      expect(calculateMaxAllowedAbsences(15, 80)).toBe(3);
    });

    it('never returns less than 1', () => {
      expect(calculateMaxAllowedAbsences(4, 90)).toBe(1);
    });
  });

  describe('evaluateStudentEligibility', () => {
    const studentCode = '650123456';

    it('returns ELIGIBLE when student attended all sessions', () => {
      const records: StudentAttendanceRecord[] = [
        { studentCode, status: 'PRESENT' },
        { studentCode, status: 'PRESENT' },
        { studentCode, status: 'PRESENT' },
      ];

      const result = evaluateStudentEligibility(studentCode, records, 3);
      expect(result.status).toBe('ELIGIBLE');
      expect(result.effectiveAbsences).toBe(0);
      expect(result.attendedPercent).toBe(100);
      expect(result.remainingAbsences).toBe(3);
    });

    it('converts 3 late arrivals to 1 effective absence', () => {
      const records: StudentAttendanceRecord[] = [
        { studentCode, status: 'LATE' },
        { studentCode, status: 'LATE' },
        { studentCode, status: 'LATE' },
      ];

      const result = evaluateStudentEligibility(studentCode, records, 3);
      expect(result.counts.late).toBe(3);
      expect(result.effectiveAbsences).toBe(1);
    });

    it('returns WARNING when student has reached exactly max absences quota', () => {
      const records: StudentAttendanceRecord[] = [
        { studentCode, status: 'ABSENT' },
        { studentCode, status: 'ABSENT' },
        { studentCode, status: 'ABSENT' },
        { studentCode, status: 'PRESENT' },
      ];

      const result = evaluateStudentEligibility(studentCode, records, 4);
      expect(result.status).toBe('WARNING');
      expect(result.effectiveAbsences).toBe(3);
      expect(result.remainingAbsences).toBe(0);
      expect(result.statusText).toContain('เฝ้าระวัง');
    });

    it('returns INELIGIBLE when effective absences exceed allowed threshold (> 3)', () => {
      const records: StudentAttendanceRecord[] = [
        { studentCode, status: 'ABSENT' },
        { studentCode, status: 'ABSENT' },
        { studentCode, status: 'ABSENT' },
        { studentCode, status: 'ABSENT' },
      ];

      const result = evaluateStudentEligibility(studentCode, records, 4);
      expect(result.status).toBe('INELIGIBLE');
      expect(result.effectiveAbsences).toBe(4);
      expect(result.remainingAbsences).toBe(-1);
      expect(result.statusText).toBe('หมดสิทธิ์สอบ');
      expect(result.reason).toContain('เกินเกณฑ์');
    });

    it('excuses leave when includeLeaveAsExcused is true', () => {
      const records: StudentAttendanceRecord[] = [
        { studentCode, status: 'LEAVE' },
        { studentCode, status: 'PRESENT' },
      ];

      const result = evaluateStudentEligibility(studentCode, records, 2, {
        includeLeaveAsExcused: true,
      });
      expect(result.effectiveAbsences).toBe(0);
      expect(result.status).toBe('ELIGIBLE');
      expect(result.attendedScore).toBe(2);
    });
  });
});
