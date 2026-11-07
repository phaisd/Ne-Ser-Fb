import fs from 'fs';
import path from 'path';
import { getSheetsClient } from '@/lib/google-sheets';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const BACKUP_DIR = path.join(DATA_DIR, 'backups');

/**
 * Local File Helper with Vercel Serverless /tmp compatibility
 */
export function getLocalFilePath(filename: string): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpPath = path.join('/tmp', filename);
    const origPath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(tmpPath) && fs.existsSync(origPath)) {
      try {
        fs.copyFileSync(origPath, tmpPath);
      } catch (err) {
        console.error(`Failed to copy ${filename} to /tmp:`, err);
      }
    }
    return tmpPath;
  }
  return path.join(DATA_DIR, filename);
}

/**
 * Safe Read JSON with Fallback
 */
export function readLocalJson<T>(filename: string, defaultValue: T): T {
  try {
    const fullPath = getLocalFilePath(filename);
    if (!fs.existsSync(fullPath)) {
      const fallbackOrig = path.join(DATA_DIR, filename);
      if (fs.existsSync(fallbackOrig)) {
        return JSON.parse(fs.readFileSync(fallbackOrig, 'utf8')) as T;
      }
      return defaultValue;
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    if (!content.trim()) return defaultValue;
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultValue;
  }
}

/**
 * Production-Grade Atomic Write (Write-to-Temp + Atomic Rename)
 * Prevents file corruption, zero-byte file writes, and process crash race conditions.
 */
export function writeLocalJson<T>(filename: string, data: T): void {
  const fullPath = getLocalFilePath(filename);
  const dir = path.dirname(fullPath);

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const jsonString = JSON.stringify(data, null, 2);
    const tempPath = `${fullPath}.${Date.now()}.${process.pid}.tmp`;

    // 1. Write to temporary file first
    fs.writeFileSync(tempPath, jsonString, 'utf8');

    // 2. Atomically rename temp file to target file (atomic on POSIX & modern Windows)
    try {
      fs.renameSync(tempPath, fullPath);
    } catch (renameErr) {
      // Fallback for Windows file locks
      fs.copyFileSync(tempPath, fullPath);
      try {
        fs.unlinkSync(tempPath);
      } catch {}
    }
  } catch (err) {
    console.error(`Error atomically writing ${filename}:`, err);
  }
}

/**
 * Automated Snapshot Backup Engine
 * Creates timestamped snapshots in data/backups/ and cleans up files older than retentionDays
 */
export function createDataBackup(retentionDays = 30): { success: boolean; filesBackedUp: number; backupFolder: string } {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      return { success: false, filesBackedUp: 0, backupFolder: '' };
    }

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const targetFolder = path.join(BACKUP_DIR, `snapshot_${timestamp}`);
    fs.mkdirSync(targetFolder, { recursive: true });

    let filesBackedUp = 0;
    const files = fs.readdirSync(DATA_DIR);

    for (const file of files) {
      if (file.endsWith('.json') && !file.includes('backup')) {
        const src = path.join(DATA_DIR, file);
        const dest = path.join(targetFolder, file);
        fs.copyFileSync(src, dest);
        filesBackedUp++;
      }
    }

    // Clean up older snapshots exceeding retention period
    const now = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
    const backupFolders = fs.readdirSync(BACKUP_DIR);

    for (const folder of backupFolders) {
      const folderPath = path.join(BACKUP_DIR, folder);
      try {
        const stats = fs.statSync(folderPath);
        if (stats.isDirectory() && now - stats.mtimeMs > maxAgeMs) {
          fs.rmSync(folderPath, { recursive: true, force: true });
        }
      } catch {}
    }

    return { success: true, filesBackedUp, backupFolder: targetFolder };
  } catch (err) {
    console.error('Failed to create data backup snapshot:', err);
    return { success: false, filesBackedUp: 0, backupFolder: '' };
  }
}

export { getSheetsClient };
