import type { SeatZone } from '@/types/event';
import { normalizeSeatCode } from '@/services/events/seatingUtils';

export { normalizeSeatCode };

/**
 * Helper: Parse a seat code within a zone (e.g. D-03, AD-03, G-12, Q-3) to { rIdx, cIdx }
 */
export function parseSeatCode(seatCode: string, zone: SeatZone): { rIdx: number; cIdx: number } | null {
  let code = normalizeSeatCode(seatCode);
  let prefix = (zone.prefix ?? '').trim().toUpperCase();
  if (prefix === 'A' && zone.rows <= 26) {
    prefix = '';
  }

  if (prefix && code.startsWith(prefix)) {
    const withoutPrefix = code.slice(prefix.length).replace(/^-+/, '');
    if (/^[A-Z0-9]+-\d+$/.test(withoutPrefix)) {
      code = withoutPrefix;
    }
  }
  const parts = code.split('-');
  if (parts.length !== 2) return null;
  const rowPart = parts[0];
  const colPart = parts[1];

  let rIdx = -1;
  if (/^[A-Z]$/.test(rowPart)) {
    rIdx = rowPart.charCodeAt(0) - 65;
  } else {
    rIdx = parseInt(rowPart, 10) - 1;
  }

  const cIdx = parseInt(colPart, 10) - 1;

  if (rIdx >= 0 && rIdx < zone.rows && cIdx >= 0 && cIdx < zone.cols) {
    return { rIdx, cIdx };
  }
  return null;
}

/**
 * Helper: Format { rIdx, cIdx } back to standard seatCode for a zone
 */
export function formatSeatCode(zone: SeatZone, rIdx: number, cIdx: number): string {
  let prefix = (zone.prefix ?? '').trim().toUpperCase();
  if (prefix === 'A' && zone.rows <= 26) {
    prefix = '';
  }
  const rowChar = String.fromCharCode(65 + rIdx);
  const colStr = cIdx + 1 < 10 ? `0${cIdx + 1}` : `${cIdx + 1}`;
  return zone.rows <= 26 ? `${prefix}${rowChar}-${colStr}` : `${prefix}${rIdx + 1}-${colStr}`;
}

/**
 * Helper: Calculate bounding box of seats between seat1 and seat2 in a zone
 */
export function getSeatsInRectangle(seat1: string, seat2: string, zone: SeatZone): string[] {
  const p1 = parseSeatCode(seat1, zone);
  const p2 = parseSeatCode(seat2, zone);
  if (!p1 || !p2) return [seat1.trim().toUpperCase(), seat2.trim().toUpperCase()];

  const minR = Math.min(p1.rIdx, p2.rIdx);
  const maxR = Math.max(p1.rIdx, p2.rIdx);
  const minC = Math.min(p1.cIdx, p2.cIdx);
  const maxC = Math.max(p1.cIdx, p2.cIdx);

  const result: string[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      result.push(formatSeatCode(zone, r, c).toUpperCase());
    }
  }
  return result;
}
