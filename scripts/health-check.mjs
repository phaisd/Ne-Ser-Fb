#!/usr/bin/env node

/**
 * Production Health & Readiness Check
 * Usage:
 *   node scripts/health-check.mjs
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Running MCU Production Health & Readiness Check...\n');

let issues = 0;

// 1. Check Node.js Version
const nodeVersion = process.version;
const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
if (major < 18) {
  console.log(`❌ Node.js version is ${nodeVersion}. Minimum required is Node 18+ (Node 20/22 recommended).`);
  issues++;
} else {
  console.log(`✅ Node.js Version: ${nodeVersion} (Supported)`);
}

// 2. Check Next.js Production Build
const nextBuildDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextBuildDir) || !fs.existsSync(path.join(nextBuildDir, 'BUILD_ID'))) {
  console.log('⚠️  Next.js production build (.next) not found or incomplete. Run "npm run build" first.');
  issues++;
} else {
  const buildId = fs.readFileSync(path.join(nextBuildDir, 'BUILD_ID'), 'utf8').trim();
  console.log(`✅ Production Build Found (Build ID: ${buildId})`);
}

// 3. Check Data Directory & Database Integrity
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  console.log('❌ Data directory (data/) not found.');
  issues++;
} else {
  const criticalFiles = ['students.json', 'instructors.json', 'courses.json', 'timetables.json', 'system_settings.json'];
  let validFiles = 0;
  for (const file of criticalFiles) {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Critical database file missing: ${file}`);
      issues++;
    } else {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        JSON.parse(content);
        validFiles++;
      } catch (e) {
        console.log(`❌ Corrupt JSON in ${file}: ${e.message}`);
        issues++;
      }
    }
  }
  if (validFiles === criticalFiles.length) {
    console.log(`✅ Core Database Files: All ${validFiles} critical tables verified healthy`);
  }
}

// 4. Check Environment Secret Settings
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  console.log('✅ Local Environment Configuration (.env.local) found');
} else {
  console.log('ℹ️  No .env.local file found. Ensure production environment variables are configured in OS / PM2.');
}

// 5. Check Backup Service Readiness
const backupScript = path.join(process.cwd(), 'scripts', 'backup-data.mjs');
if (fs.existsSync(backupScript)) {
  console.log('✅ Disaster Recovery: Automated Backup runner (scripts/backup-data.mjs) is ready');
}

console.log('\n----------------------------------------');
if (issues === 0) {
  console.log('🎉 Production Readiness Status: ALL CHECKS PASSED (Ready to serve traffic)');
} else {
  console.log(`⚠️  Production Readiness Status: Found ${issues} warning/issue(s). Please review above.`);
}
console.log('----------------------------------------\n');

process.exit(issues > 0 ? 1 : 0);
