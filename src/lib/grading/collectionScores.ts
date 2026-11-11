import { CollectionScoreColumn } from '@/types/attendance';

export const MIN_COLLECTION_COUNT = 5;
export const MAX_COLLECTION_COUNT = 10;
export const DEFAULT_COLLECTION_COUNT = 5;
export const DEFAULT_COLLECTION_MAX_SCORE = 10;

/** Clamp the number of collection assessment columns into the 5-10 range. */
export function clampCollectionCount(count?: number | null): number {
  if (typeof count !== 'number' || !Number.isFinite(count)) {
    return DEFAULT_COLLECTION_COUNT;
  }
  const rounded = Math.round(count);
  return Math.min(MAX_COLLECTION_COUNT, Math.max(MIN_COLLECTION_COUNT, rounded));
}

/** Build or resize the 5-10 collection column definitions while preserving existing labels/max scores. */
export function normalizeCollectionColumns(
  count?: number | null,
  existing?: CollectionScoreColumn[] | null,
  defaultMaxScore: number = DEFAULT_COLLECTION_MAX_SCORE,
): CollectionScoreColumn[] {
  const safeCount = clampCollectionCount(count);
  const safeDefaultMax =
    typeof defaultMaxScore === 'number' && Number.isFinite(defaultMaxScore) && defaultMaxScore > 0
      ? defaultMaxScore
      : DEFAULT_COLLECTION_MAX_SCORE;

  return Array.from({ length: safeCount }, (_, index) => {
    const prev = existing?.[index];
    const maxScore =
      prev && typeof prev.maxScore === 'number' && Number.isFinite(prev.maxScore) && prev.maxScore > 0
        ? prev.maxScore
        : safeDefaultMax;
    const label = prev?.label?.trim() ? prev.label : `ครั้งที่ ${index + 1}`;
    return {
      id: prev?.id || `c${index + 1}`,
      label,
      maxScore,
    };
  });
}

/** Sum the student's entered collection scores across the active column count. */
export function calculateCollectionSum(
  rowScores: (number | null)[] | undefined,
  columnCount: number,
): { sum: number; filledCount: number } {
  const safeCount = clampCollectionCount(columnCount);
  if (!rowScores || rowScores.length === 0) {
    return { sum: 0, filledCount: 0 };
  }
  let sum = 0;
  let filledCount = 0;
  for (let i = 0; i < safeCount; i++) {
    const val = rowScores[i];
    if (typeof val === 'number' && Number.isFinite(val)) {
      sum += val;
      filledCount += 1;
    }
  }
  return { sum: Math.round(sum * 100) / 100, filledCount };
}

/** Scale a raw collection score sum proportionally to a target max score (e.g. Report or Midterm). */
export function scaleCollectionToTarget(
  rawSum: number,
  columnsMaxSum: number,
  targetMaxScore: number,
): number {
  if (!Number.isFinite(rawSum) || !Number.isFinite(columnsMaxSum) || columnsMaxSum <= 0) {
    return 0;
  }
  if (!Number.isFinite(targetMaxScore) || targetMaxScore <= 0) {
    return 0;
  }
  const scaled = (rawSum / columnsMaxSum) * targetMaxScore;
  const clamped = Math.min(targetMaxScore, Math.max(0, scaled));
  return Math.round(clamped * 100) / 100;
}
