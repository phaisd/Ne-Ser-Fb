import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface BackupResult {
  success: boolean;
  backupPath: string;
  filesBackedUp: number;
  timestamp: string;
  manifest: Record<string, { size: number; sha256: string }>;
  error?: string;
}

export interface BackupOptions {
  dataDir?: string;
  backupTargetDir?: string;
  maxRetention?: number; // Maximum number of snapshots to keep
}

/**
 * Computes SHA-256 hash of a buffer or string for data integrity verification
 */
export function computeSha256(content: Buffer | string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Creates a timestamped, cryptographically verified snapshot backup of all data/*.json files
 */
export async function createDataBackup(options: BackupOptions = {}): Promise<BackupResult> {
  const dataDir = options.dataDir || path.join(process.cwd(), 'data');
  const backupTargetDir = options.backupTargetDir || path.join(dataDir, 'backups');
  const maxRetention = options.maxRetention ?? 30;

  try {
    if (!fs.existsSync(dataDir)) {
      throw new Error(`Data directory not found: ${dataDir}`);
    }

    if (!fs.existsSync(backupTargetDir)) {
      fs.mkdirSync(backupTargetDir, { recursive: true });
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const snapshotName = `snapshot-${timestamp}`;
    const snapshotDir = path.join(backupTargetDir, snapshotName);

    fs.mkdirSync(snapshotDir, { recursive: true });

    const entries = fs.readdirSync(dataDir, { withFileTypes: true });
    const manifest: Record<string, { size: number; sha256: string }> = {};
    let filesBackedUp = 0;

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        // Skip existing backup artifacts or temporary files
        if (entry.name.includes('.backup.') || entry.name.includes('.backup-audit.')) {
          continue;
        }

        const srcPath = path.join(dataDir, entry.name);
        const destPath = path.join(snapshotDir, entry.name);

        const buffer = fs.readFileSync(srcPath);

        // Verify valid JSON before backing up
        try {
          JSON.parse(buffer.toString('utf8'));
        } catch (jsonErr: unknown) {
          console.warn(`[BACKUP] Skipping corrupt JSON: ${entry.name}`, jsonErr);
          continue;
        }

        const sha256 = computeSha256(buffer);
        fs.writeFileSync(destPath, buffer);

        manifest[entry.name] = {
          size: buffer.length,
          sha256,
        };
        filesBackedUp++;
      }
    }

    // Write cryptographic manifest file inside the snapshot directory
    const manifestPath = path.join(snapshotDir, '_manifest.json');
    fs.writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          createdAt: now.toISOString(),
          snapshotName,
          filesCount: filesBackedUp,
          files: manifest,
        },
        null,
        2
      ),
      'utf8'
    );

    // Prune old snapshots beyond maxRetention
    pruneOldBackups(backupTargetDir, maxRetention);

    return {
      success: true,
      backupPath: snapshotDir,
      filesBackedUp,
      timestamp: now.toISOString(),
      manifest,
    };
  } catch (err: unknown) {
    return {
      success: false,
      backupPath: '',
      filesBackedUp: 0,
      timestamp: new Date().toISOString(),
      manifest: {},
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Verifies that a backup snapshot has not been tampered with or corrupted
 */
export function verifyBackupIntegrity(snapshotDir: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const manifestPath = path.join(snapshotDir, '_manifest.json');

  if (!fs.existsSync(manifestPath)) {
    return { valid: false, errors: ['Manifest file (_manifest.json) is missing'] };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const files = manifest.files as Record<string, { size: number; sha256: string }>;

    for (const [filename, expected] of Object.entries(files)) {
      const filePath = path.join(snapshotDir, filename);
      if (!fs.existsSync(filePath)) {
        errors.push(`Missing backed-up file: ${filename}`);
        continue;
      }

      const buffer = fs.readFileSync(filePath);
      const actualHash = computeSha256(buffer);
      if (actualHash !== expected.sha256) {
        errors.push(`Integrity mismatch on ${filename}: expected ${expected.sha256}, got ${actualHash}`);
      }
    }
  } catch (err: unknown) {
    errors.push(`Failed to read manifest: ${err instanceof Error ? err.message : String(err)}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Prunes older snapshots to avoid disk exhaustion
 */
function pruneOldBackups(backupTargetDir: string, maxRetention: number): void {
  try {
    const snapshots = fs
      .readdirSync(backupTargetDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith('snapshot-'))
      .map((d) => ({
        name: d.name,
        fullPath: path.join(backupTargetDir, d.name),
        mtime: fs.statSync(path.join(backupTargetDir, d.name)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime); // Newest first

    if (snapshots.length > maxRetention) {
      const toDelete = snapshots.slice(maxRetention);
      for (const item of toDelete) {
        fs.rmSync(item.fullPath, { recursive: true, force: true });
      }
    }
  } catch (err: unknown) {
    console.warn('[BACKUP] Warning pruning old backups:', err);
  }
}
