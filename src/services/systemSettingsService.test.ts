import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SETTINGS,
  convertGoogleDriveUrl,
  getSystemSettings,
  updateSystemSettings,
} from './systemSettingsService';

let mockStore: Record<string, unknown> | null = null;

vi.mock('./storageHelper', () => ({
  readLocalJson: vi.fn((_file: string, fallback: unknown) => (mockStore ? mockStore : fallback)),
  writeLocalJson: vi.fn((_file: string, data: Record<string, unknown>) => {
    mockStore = data;
  }),
  getSheetsClient: vi.fn(() => null),
}));

describe('systemSettingsService', () => {
  beforeEach(() => {
    mockStore = null;
    vi.clearAllMocks();
  });

  it('converts Google Drive sharing URLs into direct image URLs', () => {
    expect(convertGoogleDriveUrl('https://drive.google.com/file/d/abc123_XYZ/view?usp=sharing')).toBe(
      'https://lh3.googleusercontent.com/d/abc123_XYZ'
    );
    expect(convertGoogleDriveUrl('https://drive.google.com/open?id=file999')).toBe(
      'https://lh3.googleusercontent.com/d/file999'
    );
  });

  it('merges defaults and updates settings cleanly', async () => {
    const initial = await getSystemSettings();
    expect(initial.facultyNameTh).toBe(DEFAULT_SETTINGS.facultyNameTh);

    const updated = await updateSystemSettings({
      announcementText: 'ประกาศใหม่',
      logoUrl: 'https://drive.google.com/file/d/logoID123/view',
    });
    expect(updated.announcementText).toBe('ประกาศใหม่');
    expect(updated.logoUrl).toBe('https://lh3.googleusercontent.com/d/logoID123');
  });
});
