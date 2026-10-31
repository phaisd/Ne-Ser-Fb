import { google } from 'googleapis';

let cachedAuth: any = null;

export function getGoogleSheetsAuth() {
  if (cachedAuth) {
    return cachedAuth;
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  // Reading from environment variable credentials (Vercel standard)
  if (clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    cachedAuth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });
    return cachedAuth;
  }

  return null;
}

export function getSheetsApi() {
  const auth = getGoogleSheetsAuth();
  if (!auth) {
    return null;
  }
  return google.sheets({ version: 'v4', auth });
}
