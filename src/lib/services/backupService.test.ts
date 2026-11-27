import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  createDataBackup,
  verifyBackupIntegrity,
  computeSha256,
} from './backupService';

describe('📦 Disaster Recovery: Automated Backup & Integrity Verification Service', () => {
  let tempDir: string;
  let testDataDir: string;
  let testBackupDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcu-backup-test-'));
    testDataDir = path.join(tempDir, 'data');
    testBackupDir = path.join(tempDir, 'backups');

    fs.mkdirSync(testDataDir, { recursive: true });

    // Create sample data files
    fs.writeFileSync(
      path.join(testDataDir, 'students.json'),
      JSON.stringify([{ id: 's1', name: 'Student 1' }], null, 2),
      'utf8'
    );
    fs.writeFileSync(
      path.join(testDataDir, 'instructors.json'),
      JSON.stringify([{ id: 'i1', name: 'Instructor 1' }], null, 2),
      'utf8'
    );
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it('computes deterministic SHA-256 hash of content', () => {
    const hash1 = computeSha256('hello world');
    const hash2 = computeSha256(Buffer.from('hello world'));
    expect(hash1).toBe(hash2);
    expect(hash1).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('creates backup snapshot with SHA-256 cryptographic manifest', async () => {
    const result = await createDataBackup({
      dataDir: testDataDir,
      backupTargetDir: testBackupDir,
      maxRetention: 5,
    });

    expect(result.success).toBe(true);
    expect(result.filesBackedUp).toBe(2);
    expect(fs.existsSync(result.backupPath)).toBe(true);
    expect(fs.existsSync(path.join(result.backupPath, '_manifest.json'))).toBe(true);

    // Verify integrity of the newly created snapshot
    const check = verifyBackupIntegrity(result.backupPath);
    expect(check.valid).toBe(true);
    expect(check.errors.length).toBe(0);
  });

  it('detects tampering or corrupted files in snapshot', async () => {
    const result = await createDataBackup({
      dataDir: testDataDir,
      backupTargetDir: testBackupDir,
    });

    expect(result.success).toBe(true);

    // Tamper with students.json inside the backup snapshot
    const studentBackupFile = path.join(result.backupPath, 'students.json');
    fs.writeFileSync(studentBackupFile, '{"tampered": true}', 'utf8');

    const check = verifyBackupIntegrity(result.backupPath);
    expect(check.valid).toBe(false);
    expect(check.errors[0]).toContain('Integrity mismatch on students.json');
  });

  it('prunes older snapshots according to maxRetention limit', async () => {
    for (let i = 0; i < 4; i++) {
      await createDataBackup({
        dataDir: testDataDir,
        backupTargetDir: testBackupDir,
        maxRetention: 2,
      });
    }

    const remaining = fs
      .readdirSync(testBackupDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith('snapshot-'));

    expect(remaining.length).toBeLessThanOrEqual(2);
  });
});
