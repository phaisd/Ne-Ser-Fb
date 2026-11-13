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
  onlineCount?: number;
  onlineUsers?: number;
}

const CACHE_TTL_MS = 15_000;
let visitorCache: { logs: VisitorLogRecord[]; fetchedAt: number } | null = null;

// Active online tracking (window of 5 minutes)
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
type ActiveVisitorMap = Record<string, number>;
const memoryActiveVisitors: Map<string, number> = new Map();

/**
 * Tracks and returns real-time active online visitor count within the last 5 minutes.
 */
export function touchVisitorOnline(visitorId?: string): number {
  const now = Date.now();
  const cutoff = now - ONLINE_WINDOW_MS;

  // Initialize or hydrate from local cache if in-memory map is empty
  if (memoryActiveVisitors.size === 0) {
    try {
      const saved = readLocalJson<ActiveVisitorMap>('active_visitors.json', {});
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        for (const [id, ts] of Object.entries(saved)) {
          if (typeof ts === 'number' && ts > cutoff) {
            memoryActiveVisitors.set(id, ts);
          }
        }
      }
    } catch {
      // Ignore read error
    }
  }

  // Purge expired records
  for (const [id, ts] of memoryActiveVisitors.entries()) {
    if (ts <= cutoff) {
      memoryActiveVisitors.delete(id);
    }
  }

  // Register or update active timestamp for current visitor
  if (visitorId) {
    const cleanId = visitorId.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    if (cleanId) {
      memoryActiveVisitors.set(cleanId, now);
    }
  }

  // Persist active visitors to local JSON
  const record: ActiveVisitorMap = {};
  for (const [id, ts] of memoryActiveVisitors.entries()) {
    record[id] = ts;
  }
  try {
    writeLocalJson('active_visitors.json', record);
  } catch {
    // Non-fatal
  }

  const count = memoryActiveVisitors.size;
  return count > 0 ? count : (visitorId ? 1 : 1);
}

export function resetActiveVisitorsForTesting(): void {
  memoryActiveVisitors.clear();
}

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
 * Returns real visitor summary statistics including active online count.
 */
export async function getVisitorStats(visitorId?: string): Promise<VisitorStatsSummary> {
  const logs = await getVisitorLogs();
  const stats = computeVisitorStats(logs);
  const online = touchVisitorOnline(visitorId);
  return {
    ...stats,
    onlineCount: online,
    onlineUsers: online,
  };
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
    const online = touchVisitorOnline(cleanId);
    return {
      ...computeVisitorStats(logs),
      onlineCount: online,
      onlineUsers: online,
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

  const online = touchVisitorOnline(cleanId);
  return {
    ...computeVisitorStats(nextLogs),
    onlineCount: online,
    onlineUsers: online,
    counted: true,
  };
}
