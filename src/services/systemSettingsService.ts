import { SystemSettings, SignatoryItem } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';
import { DEFAULT_SIGNATORIES, DEFAULT_SETTINGS, convertGoogleDriveUrl } from '@/lib/constants/defaultSettings';
export { DEFAULT_SIGNATORIES, DEFAULT_SETTINGS, convertGoogleDriveUrl };

export async function getSystemSettings(): Promise<SystemSettings> {
  const localSettings = readLocalJson<SystemSettings | null>('system_settings.json', null);
  let settings = localSettings;
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('System_Settings!A2:B2');
      if (rows && rows.length > 0 && rows[0][1]) {
        const parsedFromSheet = JSON.parse(String(rows[0][1]));
        if (parsedFromSheet && typeof parsedFromSheet === 'object') {
          // If sheet is missing sensitive tokens, keep local token values
          settings = {
            ...(localSettings || {}),
            ...parsedFromSheet,
            lineChannelAccessToken:
              parsedFromSheet.lineChannelAccessToken ||
              localSettings?.lineChannelAccessToken ||
              process.env.LINE_CHANNEL_ACCESS_TOKEN ||
              '',
            lineTargetUserId:
              parsedFromSheet.lineTargetUserId ||
              localSettings?.lineTargetUserId ||
              process.env.LINE_TARGET_USER_ID ||
              '',
            lineNotifyToken:
              parsedFromSheet.lineNotifyToken ||
              localSettings?.lineNotifyToken ||
              process.env.LINE_NOTIFY_TOKEN ||
              '',
            lineWebhookUrl:
              parsedFromSheet.lineWebhookUrl ||
              localSettings?.lineWebhookUrl ||
              process.env.LINE_WEBHOOK_URL ||
              '',
          };
        }
      }
    } catch {
      // System_Settings tab may not exist yet; fall back to local
    }
  }
  if (!settings) {
    writeLocalJson('system_settings.json', DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  const merged: SystemSettings = { ...DEFAULT_SETTINGS, ...settings };
  if (!merged.signatories || !Array.isArray(merged.signatories) || merged.signatories.length === 0) {
    merged.signatories = DEFAULT_SIGNATORIES;
  }
  return merged;
}

export async function updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
  const current = await getSystemSettings();
  if (updates.logoUrl) {
    updates.logoUrl = convertGoogleDriveUrl(updates.logoUrl);
  }
  const updated: SystemSettings = {
    ...current,
    ...updates,
  };
  writeLocalJson('system_settings.json', updated);

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await gClient.ensureSheetsExist(['System_Settings']);
      await gClient.updateValues('System_Settings!A1:B2', [
        ['Key', 'JSON_Value'],
        ['SETTINGS_JSON', JSON.stringify(updated)],
      ]);
    } catch (err) {
      console.warn('Google Sheets updateSystemSettings warning:', err);
    }
  }

  return updated;
}
