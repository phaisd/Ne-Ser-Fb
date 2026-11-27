#!/usr/bin/env node

/**
 * Automated Production Backup Runner
 * Run manually or via Cron/Task Scheduler:
 *   node scripts/backup-data.mjs
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const dataDir = path.join(process.cwd(), 'data');
const backupDir = path.join(dataDir, 'backups');
const maxRetention = 30;

function computeSha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function runBackup() {
  console.log('🛡️  Starting automated MCU data backup...');
  console.log(`📁 Source: ${dataDir}`);
  console.log(`💾 Destination: ${backupDir}`);

  if (!fs.existsSync(dataDir)) {
    console.error(`❌ Source directory does not exist: ${dataDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const snapshotName = `snapshot-${timestamp}`;
  const targetSnapshotDir = path.join(backupDir, snapshotName);

  fs.mkdirSync(targetSnapshotDir, { recursive: true });

  const files = fs.readdirSync(dataDir);
  const manifest = {};
  let count = 0;

  for (const file of files) {
    if (file.endsWith('.json') && !file.includes('.backup.') && !file.includes('.backup-audit.')) {
      const src = path.join(dataDir, file);
      if (fs.statSync(src).isFile()) {
        const buffer = fs.readFileSync(src);
        try {
          JSON.parse(buffer.toString('utf8'));
        } catch (e) {
          console.warn(`⚠️ Skipping corrupt JSON file: ${file}`);
          continue;
        }

        const sha256 = computeSha256(buffer);
        fs.writeFileSync(path.join(targetSnapshotDir, file), buffer);
        manifest[file] = { size: buffer.length, sha256 };
        count++;
      }
    }
  }

  fs.writeFileSync(
    path.join(targetSnapshotDir, '_manifest.json'),
    JSON.stringify({ createdAt: now.toISOString(), snapshotName, filesCount: count, files: manifest }, null, 2),
    'utf8'
  );

  console.log(`✅ Backup completed successfully: ${count} database files backed up.`);
  console.log(`📦 Snapshot saved at: ${targetSnapshotDir}`);

  // Prune older backups
  const existing = fs
    .readdirSync(backupDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('snapshot-'))
    .map((d) => ({
      name: d.name,
      fullPath: path.join(backupDir, d.name),
      mtime: fs.statSync(path.join(backupDir, d.name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (existing.length > maxRetention) {
    const toPrune = existing.slice(maxRetention);
    for (const p of toPrune) {
      fs.rmSync(p.fullPath, { recursive: true, force: true });
      console.log(`🧹 Pruned old snapshot: ${p.name}`);
    }
  }
}

runBackup().catch((err) => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
