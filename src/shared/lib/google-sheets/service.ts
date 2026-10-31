import { getSheetsApi } from './client';

export interface GoogleSheetsSyncResult {
  success: boolean;
  rowsAffected?: number;
  message?: string;
  error?: string;
}

// In-memory mock sheet store for development/demo when credentials are not yet configured
const inMemorySheets = new Map<string, any[][]>();

export class GoogleSheetsService {
  private defaultSpreadsheetId: string;

  constructor() {
    this.defaultSpreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || 'default_sheet';
  }

  private resolveSheetId(sheetId?: string): string {
    return sheetId || this.defaultSpreadsheetId;
  }

  /**
   * ต่อท้ายแถวข้อมูลอัตโนมัติ (Append Row)
   * ใช้สำหรับ Hybrid Auto-Sync Event เช่น ส่งประวัติคำร้อง หรือการจองห้อง
   */
  async appendRow(
    sheetId: string | undefined,
    tabName: string,
    data: (string | number | boolean | null | undefined)[]
  ): Promise<GoogleSheetsSyncResult> {
    const targetSheetId = this.resolveSheetId(sheetId);
    const sheets = getSheetsApi();

    // Clean data row
    const formattedRow = data.map((item) => (item === null || item === undefined ? '' : String(item)));

    if (!sheets) {
      // In-memory fallback
      const key = `${targetSheetId}:${tabName}`;
      const existing = inMemorySheets.get(key) || [];
      existing.push(formattedRow);
      inMemorySheets.set(key, existing);
      console.log(`[GoogleSheets:MOCK_APPEND] [${tabName}] Row appended:`, formattedRow);
      return { success: true, rowsAffected: 1, message: 'Appended to local mock sheet (API credentials not set)' };
    }

    try {
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: targetSheetId,
        range: `${tabName}!A:A`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [formattedRow],
        },
      });

      return {
        success: true,
        rowsAffected: response.data.updates?.updatedRows || 1,
        message: 'Row successfully appended to Google Sheets',
      };
    } catch (error: any) {
      console.error(`[GoogleSheets:ERROR] Failed to append row in ${tabName}:`, error?.message || error);
      return { success: false, error: error?.message || 'Failed to append row' };
    }
  }

  /**
   * อ่านข้อมูลจาก Google Sheet (Read Sheet)
   * ใช้สำหรับการ Import ข้อมูล เช่น ดึงรายชื่อนิสิต หรือรายวิชา
   */
  async readSheet(
    sheetId: string | undefined,
    tabName: string,
    range: string = 'A1:Z5000'
  ): Promise<string[][]> {
    const targetSheetId = this.resolveSheetId(sheetId);
    const sheets = getSheetsApi();

    if (!sheets) {
      const key = `${targetSheetId}:${tabName}`;
      const memoryRows = inMemorySheets.get(key);
      if (memoryRows && memoryRows.length > 0) {
        return memoryRows;
      }
      return [];
    }

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: targetSheetId,
        range: `${tabName}!${range}`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }
      return rows as string[][];
    } catch (error: any) {
      console.error(`[GoogleSheets:ERROR] Failed to read sheet ${tabName}:`, error?.message || error);
      return [];
    }
  }

  /**
   * แก้ไขแถวข้อมูลในชีตตาม rowIndex (Update Row)
   */
  async updateRow(
    sheetId: string | undefined,
    tabName: string,
    rowIndex: number,
    data: (string | number | boolean | null | undefined)[]
  ): Promise<GoogleSheetsSyncResult> {
    const targetSheetId = this.resolveSheetId(sheetId);
    const sheets = getSheetsApi();
    const formattedRow = data.map((item) => (item === null || item === undefined ? '' : String(item)));

    if (!sheets) {
      const key = `${targetSheetId}:${tabName}`;
      const existing = inMemorySheets.get(key) || [];
      if (rowIndex >= 0 && rowIndex < existing.length) {
        existing[rowIndex] = formattedRow;
      } else {
        existing.push(formattedRow);
      }
      inMemorySheets.set(key, existing);
      return { success: true, rowsAffected: 1, message: 'Updated in local mock sheet' };
    }

    try {
      const range = `${tabName}!A${rowIndex}:Z${rowIndex}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: targetSheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [formattedRow],
        },
      });

      return { success: true, rowsAffected: 1, message: `Row ${rowIndex} updated successfully` };
    } catch (error: any) {
      console.error(`[GoogleSheets:ERROR] Failed to update row ${rowIndex} in ${tabName}:`, error?.message || error);
      return { success: false, error: error?.message || 'Failed to update row' };
    }
  }

  /**
   * ส่งออกข้อมูลจำนวนมาก (Batch Sync / Export)
   * สามารถเลือกล้างชีตก่อนเขียนทับ (clearFirst = true) ได้
   */
  async batchSync(
    sheetId: string | undefined,
    tabName: string,
    dataRows: (string | number | boolean | null | undefined)[][],
    clearFirst: boolean = false
  ): Promise<GoogleSheetsSyncResult> {
    const targetSheetId = this.resolveSheetId(sheetId);
    const sheets = getSheetsApi();

    const formattedRows = dataRows.map((row) =>
      row.map((item) => (item === null || item === undefined ? '' : String(item)))
    );

    if (!sheets) {
      const key = `${targetSheetId}:${tabName}`;
      if (clearFirst) {
        inMemorySheets.set(key, formattedRows);
      } else {
        const existing = inMemorySheets.get(key) || [];
        inMemorySheets.set(key, [...existing, ...formattedRows]);
      }
      console.log(`[GoogleSheets:MOCK_BATCH_SYNC] [${tabName}] Synced ${formattedRows.length} rows`);
      return { success: true, rowsAffected: formattedRows.length, message: `Mock synced ${formattedRows.length} rows` };
    }

    try {
      if (clearFirst) {
        await sheets.spreadsheets.values.clear({
          spreadsheetId: targetSheetId,
          range: `${tabName}!A1:Z5000`,
        });
      }

      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: targetSheetId,
        range: `${tabName}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: formattedRows,
        },
      });

      return {
        success: true,
        rowsAffected: response.data.updates?.updatedRows || formattedRows.length,
        message: `Batch sync completed with ${formattedRows.length} rows`,
      };
    } catch (error: any) {
      console.error(`[GoogleSheets:ERROR] Failed batch sync in ${tabName}:`, error?.message || error);
      return { success: false, error: error?.message || 'Failed batch sync' };
    }
  }

  /**
   * ตรวจสอบว่ามีชีตและโครงสร้าง Header อยู่แล้วหรือไม่
   */
  async ensureTabWithHeaders(
    sheetId: string | undefined,
    tabName: string,
    headers: string[]
  ): Promise<void> {
    const targetSheetId = this.resolveSheetId(sheetId);
    const sheets = getSheetsApi();

    if (!sheets) {
      const key = `${targetSheetId}:${tabName}`;
      if (!inMemorySheets.has(key)) {
        inMemorySheets.set(key, [headers]);
      }
      return;
    }

    try {
      const readRes = await sheets.spreadsheets.values.get({
        spreadsheetId: targetSheetId,
        range: `${tabName}!A1:Z1`,
      });

      if (!readRes.data.values || readRes.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: targetSheetId,
          range: `${tabName}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
      }
    } catch {
      // Tab might not exist, attempt to append header
      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId: targetSheetId,
          range: `${tabName}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
      } catch (err) {
        console.warn(`[GoogleSheets:WARN] Could not ensure headers for ${tabName}:`, err);
      }
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
