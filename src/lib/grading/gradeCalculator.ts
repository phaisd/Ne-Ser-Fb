/**
 * MCU Grade Calculator & Grading Scale Utilities
 *
 * Provides standardized grade cutoffs, score aggregation,
 * and distribution statistics for academic grade sheets.
 */

export interface GradeCutoff {
  grade: string;
  level: string;
  min: number;
  max: number;
  labelTh: string;
  labelEn: string;
  gradePoints: number;
}

export const MCU_GRADING_SCALE: readonly GradeCutoff[] = [
  { grade: 'A', level: '4', min: 90, max: 100, labelTh: '90-100', labelEn: '90-100', gradePoints: 4.0 },
  { grade: 'B+', level: '3.5', min: 85, max: 89.99, labelTh: '85-89', labelEn: '85-89', gradePoints: 3.5 },
  { grade: 'B', level: '3', min: 80, max: 84.99, labelTh: '80-84', labelEn: '80-84', gradePoints: 3.0 },
  { grade: 'C+', level: '2.5', min: 75, max: 79.99, labelTh: '75-79', labelEn: '75-79', gradePoints: 2.5 },
  { grade: 'C', level: '2', min: 70, max: 74.99, labelTh: '70-74', labelEn: '70-74', gradePoints: 2.0 },
  { grade: 'D+', level: '1.5', min: 65, max: 69.99, labelTh: '65-69', labelEn: '65-69', gradePoints: 1.5 },
  { grade: 'D', level: '1', min: 60, max: 64.99, labelTh: '60-64', labelEn: '60-64', gradePoints: 1.0 },
  { grade: 'F', level: '0', min: 0, max: 59.99, labelTh: 'Below 60', labelEn: 'below 60', gradePoints: 0.0 },
] as const;

/**
 * Calculates letter grade based on MCU standard scale.
 * Follows standard university rounding (`Math.round`).
 */
export function calculateMcuGrade(total: number | null | undefined): string {
  if (total === null || total === undefined || isNaN(total)) return '';
  const rounded = Math.round(total);
  if (rounded >= 90) return 'A';
  if (rounded >= 85) return 'B+';
  if (rounded >= 80) return 'B';
  if (rounded >= 75) return 'C+';
  if (rounded >= 70) return 'C';
  if (rounded >= 65) return 'D+';
  if (rounded >= 60) return 'D';
  return 'F';
}

/**
 * Returns grade point average equivalent (e.g. A -> 4.0, B+ -> 3.5).
 */
export function getGradePoint(grade: string): number | null {
  const match = MCU_GRADING_SCALE.find((g) => g.grade.toUpperCase() === grade.trim().toUpperCase());
  return match ? match.gradePoints : null;
}

export interface ScoreComponents {
  assignScore?: number | null;
  affectiveScore?: number | null;
  midtermScore?: number | null;
  finalScore?: number | null;
}

/**
 * Sums score components, returning null if all components are unset/null.
 */
export function calculateTotalScore(scores: ScoreComponents): number | null {
  const { assignScore, affectiveScore, midtermScore, finalScore } = scores;
  const hasAnyScore =
    (assignScore !== null && assignScore !== undefined && !isNaN(assignScore)) ||
    (affectiveScore !== null && affectiveScore !== undefined && !isNaN(affectiveScore)) ||
    (midtermScore !== null && midtermScore !== undefined && !isNaN(midtermScore)) ||
    (finalScore !== null && finalScore !== undefined && !isNaN(finalScore));

  if (!hasAnyScore) return null;

  const total =
    (assignScore || 0) +
    (affectiveScore || 0) +
    (midtermScore || 0) +
    (finalScore || 0);

  return Number(total.toFixed(1));
}

export interface GradedStudentInput {
  grade?: string | null;
  totalScore?: number | null;
  remark?: string | null;
}

export interface GradeSummaryStats {
  totalStudents: number;
  examinedCount: number;
  absentOrIneligibleCount: number;
  counts: Record<string, number>;
  maxScore: number | null;
  minScore: number | null;
  averageScore: number | null;
  hasGradedAny: boolean;
}

/**
 * Computes statistical distribution and counts for grade sheet summary.
 */
export function calculateGradeSummaryStats(rows: GradedStudentInput[]): GradeSummaryStats {
  const counts: Record<string, number> = {
    A: 0,
    'B+': 0,
    B: 0,
    'C+': 0,
    C: 0,
    'D+': 0,
    D: 0,
    F: 0,
    S: 0,
    U: 0,
  };

  let examinedCount = 0;
  let absentOrIneligibleCount = 0;
  const validTotals: number[] = [];

  rows.forEach((r) => {
    const remarkLower = (r.remark || '').toLowerCase();
    const isAbsent =
      r.remark?.includes('ขาดสอบ') ||
      r.remark?.includes('หมดสิทธิ์') ||
      remarkLower.includes('ineligible') ||
      remarkLower.includes('absent') ||
      r.grade === 'ขาดสอบ' ||
      r.grade === 'I' ||
      r.grade === 'W';

    if (isAbsent && (r.totalScore === null || r.totalScore === undefined)) {
      absentOrIneligibleCount += 1;
    } else if (
      (r.totalScore !== null && r.totalScore !== undefined) ||
      (r.grade && counts[r.grade] !== undefined)
    ) {
      examinedCount += 1;
    }

    if (r.grade && counts[r.grade] !== undefined) {
      counts[r.grade] += 1;
    }

    if (r.totalScore !== null && r.totalScore !== undefined && !isNaN(r.totalScore)) {
      validTotals.push(r.totalScore);
    }
  });

  const maxScore = validTotals.length > 0 ? Math.max(...validTotals) : null;
  const minScore = validTotals.length > 0 ? Math.min(...validTotals) : null;
  const averageScore =
    validTotals.length > 0
      ? Number((validTotals.reduce((a, b) => a + b, 0) / validTotals.length).toFixed(2))
      : null;

  return {
    totalStudents: rows.length,
    examinedCount,
    absentOrIneligibleCount,
    counts,
    maxScore,
    minScore,
    averageScore,
    hasGradedAny: validTotals.length > 0 || Object.values(counts).some((c) => c > 0),
  };
}
