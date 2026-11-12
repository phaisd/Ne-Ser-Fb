import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';

export interface VisitorLogRecord {
  timestamp: string;
  dateBkk: string;
  visitorId: string;
  path: string;
}

export interface VisitorStatsSummary {
  totalVisits: number;
  todayVisits: number;
  uniqueVisitors: number;
}

const CACHE_TTL_MS = 15_000;
let visitorCache: { logs: VisitorLogRecord[]; fetchedAt: number } | null = null;

/**
 * Returns today's calendar date in Asia/Bangkok timezone (YYYY-MM-DD).
 */
export function getBangkokDateStr(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Aggregates real total, today, and unique visitor counts from recorded logs.
 */
export function computeVisitorStats(logs: VisitorLogRecord[]): VisitorStatsSummary {
  const today = getBangkokDateStr();
  const uniqueSet = new Set<string>();
  let todayVisits = 0;

  for (const log of logs) {
    if (log.dateBkk === today) {
      todayVisits += 1;
    }
    if (log.visitorId) {
      uniqueSet.add(log.visitorId);
    }
  }

  return {
    totalVisits: logs.length,
    todayVisits,
    uniqueVisitors: uniqueSet.size,
  };
}

/**
 * Loads real visitor logs from Google Sheets (Visitor_Logs) or local JSON fallback.
 */
export async function getVisitorLogs(forceRefresh = false): Promise<VisitorLogRecord[]> {
  if (!forceRefresh && visitorCache && Date.now() - visitorCache.fetchedAt < CACHE_TTL_MS) {
    return visitorCache.logs;
  }

  const localLogs = readLocalJson<VisitorLogRecord[]>('visitor_logs.json', []);
  const gClient = getSheetsClient();

  if (gClient) {
    try {
      const rows = await gClient.getValues('Visitor_Logs!A2:D');
      const sheetLogs: VisitorLogRecord[] = rows
        .filter((r) => r && (r[0] || r[1] || r[2]))
        .map((r) => ({
          timestamp: String(r[0] || ''),
          dateBkk: String(r[1] || ''),
          visitorId: String(r[2] || ''),
          path: String(r[3] || '/'),
        }));
      visitorCache = { logs: sheetLogs, fetchedAt: Date.now() };
      return sheetLogs;
    } catch {
      // Sheet tab may not exist yet; fall back to local JSON
    }
  }

  visitorCache = { logs: localLogs, fetchedAt: Date.now() };
  return localLogs;
}

/**
 * Returns real visitor summary statistics.
 */
export async function getVisitorStats(): Promise<VisitorStatsSummary> {
  const logs = await getVisitorLogs();
  return computeVisitorStats(logs);
}

/**
 * Records a genuine visitor hit (deduplicated once per visitorId per Bangkok day).
 */
export async function recordVisitorVisit(
  rawVisitorId: string,
  rawPath = '/'
): Promise<VisitorStatsSummary & { counted: boolean }> {
  const cleanId =
    (rawVisitorId || '')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 64) || `anon-${Date.now()}`;
  const cleanPath = (rawPath || '/').trim().slice(0, 120) || '/';
  const today = getBangkokDateStr();

  const logs = await getVisitorLogs(true);
  const alreadyVisitedToday = logs.some(
    (l) => l.dateBkk === today && l.visitorId === cleanId
  );

  if (alreadyVisitedToday) {
    return {
      ...computeVisitorStats(logs),
      counted: false,
    };
  }

  const entry: VisitorLogRecord = {
    timestamp: new Date().toISOString(),
    dateBkk: today,
    visitorId: cleanId,
    path: cleanPath,
  };

  const nextLogs = [...logs, entry];
  writeLocalJson('visitor_logs.json', nextLogs);

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await gClient.ensureSheetsExist(['Visitor_Logs']);
      if (logs.length === 0) {
        await gClient.updateValues('Visitor_Logs!A1:D1', [
          ['Timestamp', 'Date_BKK', 'Visitor_ID', 'Page_Path'],
        ]);
      }
      await gClient.appendValues('Visitor_Logs!A:D', [
        [entry.timestamp, entry.dateBkk, entry.visitorId, entry.path],
      ]);
    } catch (err) {
      console.warn('Google Sheets recordVisitorVisit warning:', err);
    }
  }

  visitorCache = { logs: nextLogs, fetchedAt: Date.now() };

  return {
    ...computeVisitorStats(nextLogs),
    counted: true,
  };
}
