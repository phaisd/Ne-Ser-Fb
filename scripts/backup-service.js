/**
 * Production Automated Backup CLI Script
 * Run manually or via Cron / Task Scheduler:
 * node scripts/backup-service.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const RETENTION_DAYS = 30;

function runBackup() {
  console.log('📦 [BACKUP-SERVICE] Starting automated data snapshot...');

  if (!fs.existsSync(DATA_DIR)) {
    console.error('❌ Data directory does not exist:', DATA_DIR);
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const targetFolder = path.join(BACKUP_DIR, `snapshot_${timestamp}`);
  fs.mkdirSync(targetFolder, { recursive: true });

  const files = fs.readdirSync(DATA_DIR);
  let count = 0;

  for (const file of files) {
    if (file.endsWith('.json') && !file.includes('backup')) {
      const src = path.join(DATA_DIR, file);
      const dest = path.join(targetFolder, file);
      fs.copyFileSync(src, dest);
      count++;
    }
  }

  console.log(`✅ [BACKUP-SERVICE] Backed up ${count} files to: ${targetFolder}`);

  // Retention cleanup
  const now = Date.now();
  const maxAgeMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const existingFolders = fs.readdirSync(BACKUP_DIR);
  let cleaned = 0;

  for (const folder of existingFolders) {
    const full = path.join(BACKUP_DIR, folder);
    try {
      const st = fs.statSync(full);
      if (st.isDirectory() && now - st.mtimeMs > maxAgeMs) {
        fs.rmSync(full, { recursive: true, force: true });
        cleaned++;
      }
    } catch (e) {}
  }

  if (cleaned > 0) {
    console.log(`🧹 [BACKUP-SERVICE] Cleaned up ${cleaned} old snapshots (> ${RETENTION_DAYS} days).`);
  }

  console.log('🎉 [BACKUP-SERVICE] Backup routine completed successfully.');
}

runBackup();
