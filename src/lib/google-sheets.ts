import crypto from 'crypto';

interface GoogleTokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: GoogleTokenCache | null = null;

/**
 * Generates an OAuth2 Access Token for Google Sheets using Service Account Private Key
 */
async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if still valid (with 60s buffer)
  if (tokenCache && tokenCache.expiresAt > now + 60) {
    return tokenCache.token;
  }

  // Format key
  const formattedKey = privateKey.replace(/\\n/g, '\n');

  // JWT Header
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  // JWT Claim Set
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedClaim = Buffer.from(JSON.stringify(claimSet)).toString('base64url');
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  signer.end();
  const signature = signer.sign(formattedKey, 'base64url');

  const jwt = `${signatureInput}.${signature}`;

  // Request OAuth2 access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    throw new Error(`Google Auth Failed (${tokenRes.status}): ${errorText}`);
  }

  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  const expiresIn = tokenData.expires_in || 3600;

  tokenCache = {
    token,
    expiresAt: now + expiresIn,
  };

  return token;
}

export class GoogleSheetsClient {
  private sheetId: string;
  private clientEmail: string;
  private privateKey: string;

  constructor(sheetId: string, clientEmail: string, privateKey: string) {
    this.sheetId = sheetId;
    this.clientEmail = clientEmail;
    this.privateKey = privateKey;
  }

  private async fetchSheets(endpoint: string, options: RequestInit = {}) {
    const token = await getAccessToken(this.clientEmail, this.privateKey);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}${endpoint}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Google Sheets API Error (${res.status}): ${errorText}`);
    }
    return res.json();
  }

  /**
   * Get values from range (e.g. 'Students!A2:Z')
   */
  async getValues(range: string): Promise<any[][]> {
    const data = await this.fetchSheets(`/values/${encodeURIComponent(range)}`);
    return data.values || [];
  }

  /**
   * Append row(s) to a sheet
   */
  async appendValues(range: string, values: unknown[][]) {
    const endpoint = `/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
    return this.fetchSheets(endpoint, {
      method: 'POST',
      body: JSON.stringify({ values }),
    });
  }

  /**
   * Update/overwrite values in range
   */
  async updateValues(range: string, values: unknown[][]) {
    const endpoint = `/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    return this.fetchSheets(endpoint, {
      method: 'PUT',
      body: JSON.stringify({ values }),
    });
  }

  /**
   * Clear values in range (e.g. 'CertificateRequests!A2:Z1000')
   */
  async clearValues(range: string) {
    const endpoint = `/values/${encodeURIComponent(range)}:clear`;
    return this.fetchSheets(endpoint, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * Test connection and retrieve sheet metadata
   */
  async testConnection(): Promise<{ title: string; sheets: string[] }> {
    const meta = await this.fetchSheets('');
    const sheetMetaList = (meta.sheets || []) as Array<{ properties?: { title?: string } }>;
    return {
      title: meta.properties?.title || 'Unknown Sheet',
      sheets: sheetMetaList.map((s) => s.properties?.title || ''),
    };
  }

  /**
   * Ensure specific sheet tabs exist, creating any missing ones automatically
   */
  async ensureSheetsExist(requiredTitles: string[]) {
    const meta = await this.testConnection();
    const existing = new Set(meta.sheets);
    const toCreate = requiredTitles.filter((t) => !existing.has(t));

    if (toCreate.length === 0) return meta.sheets;

    const requests = toCreate.map((title) => ({
      addSheet: {
        properties: { title },
      },
    }));

    await this.fetchSheets(':batchUpdate', {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });

    return [...meta.sheets, ...toCreate];
  }

  /**
   * Delete specific 0-based rows from a sheet tab (processed bottom-up to preserve indices).
   */
  async deleteRows(sheetTitle: string, rowIndicesZeroBased: number[]): Promise<number> {
    const uniqueSortedDesc = Array.from(
      new Set(rowIndicesZeroBased.filter((n) => Number.isInteger(n) && n >= 0))
    ).sort((a, b) => b - a);
    if (uniqueSortedDesc.length === 0) return 0;

    const meta = await this.fetchSheets('?fields=sheets.properties');
    const sheetMetaList = (meta.sheets || []) as Array<{
      properties?: { title?: string; sheetId?: number };
    }>;
    const targetSheet = sheetMetaList.find((s) => s.properties?.title === sheetTitle);
    const sheetId = targetSheet?.properties?.sheetId;
    if (sheetId === undefined || sheetId === null) return 0;

    const requests = uniqueSortedDesc.map((rowIndex) => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: 'ROWS',
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
      },
    }));

    await this.fetchSheets(':batchUpdate', {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
    return uniqueSortedDesc.length;
  }
}

export function getSheetsClient(): GoogleSheetsClient | null {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !clientEmail || !privateKey) {
    return null;
  }

  return new GoogleSheetsClient(sheetId, clientEmail, privateKey);
}
