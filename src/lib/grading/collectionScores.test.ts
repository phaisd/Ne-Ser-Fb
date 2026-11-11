import { describe, it, expect } from 'vitest';
import {
  clampCollectionCount,
  normalizeCollectionColumns,
  calculateCollectionSum,
  scaleCollectionToTarget,
} from './collectionScores';

describe('collectionScores', () => {
  it('clamps collection column counts into 5..10', () => {
    expect(clampCollectionCount(undefined)).toBe(5);
    expect(clampCollectionCount(2)).toBe(5);
    expect(clampCollectionCount(5)).toBe(5);
    expect(clampCollectionCount(7)).toBe(7);
    expect(clampCollectionCount(10)).toBe(10);
    expect(clampCollectionCount(15)).toBe(10);
  });

  it('normalizes columns and preserves existing labels and max scores', () => {
    const existing = [
      { id: 'c1', label: 'งานที่ 1', maxScore: 5 },
      { id: 'c2', label: 'แบบฝึกหัด 2', maxScore: 15 },
    ];
    const cols = normalizeCollectionColumns(6, existing, 10);
    expect(cols).toHaveLength(6);
    expect(cols[0]).toEqual({ id: 'c1', label: 'งานที่ 1', maxScore: 5 });
    expect(cols[1]).toEqual({ id: 'c2', label: 'แบบฝึกหัด 2', maxScore: 15 });
    expect(cols[2]).toEqual({ id: 'c3', label: 'ครั้งที่ 3', maxScore: 10 });
    expect(cols[5]).toEqual({ id: 'c6', label: 'ครั้งที่ 6', maxScore: 10 });
  });

  it('sums filled collection scores cleanly up to columnCount', () => {
    const res = calculateCollectionSum([8, null, 7.5, 9, 10, 10], 5);
    expect(res).toEqual({ sum: 34.5, filledCount: 4 });

    const empty = calculateCollectionSum(undefined, 5);
    expect(empty).toEqual({ sum: 0, filledCount: 0 });
  });

  it('scales raw sum proportionally to target max score and clamps', () => {
    expect(scaleCollectionToTarget(40, 50, 20)).toBe(16);
    expect(scaleCollectionToTarget(33.33, 50, 30)).toBe(20);
    expect(scaleCollectionToTarget(60, 50, 20)).toBe(20);
    expect(scaleCollectionToTarget(10, 0, 20)).toBe(0);
  });
});
