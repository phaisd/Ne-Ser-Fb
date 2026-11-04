import fs from 'fs';
import path from 'path';
import { getSheetsClient } from '@/lib/google-sheets';

export const DATA_DIR = path.join(process.cwd(), 'data');

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
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultValue;
  }
}

export function writeLocalJson<T>(filename: string, data: T): void {
  try {
    const fullPath = getLocalFilePath(filename);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
  }
}

export { getSheetsClient };
