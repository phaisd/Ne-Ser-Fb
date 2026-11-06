import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as certificateService from './certificateService';
import * as storageHelper from './storageHelper';

vi.mock('./storageHelper', () => ({
  readLocalJson: vi.fn(),
  writeLocalJson: vi.fn(),
  getSheetsClient: vi.fn(() => null),
  getLocalFilePath: vi.fn((f: string) => f),
  DATA_DIR: '/mock/data',
}));

describe('certificateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('converts Google Drive share URL to direct thumbnail view URL', () => {
    const driveUrl = 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0/view?usp=sharing';
    const directUrl = certificateService.convertGoogleDriveUrl(driveUrl);
    expect(directUrl).toBe('https://lh3.googleusercontent.com/d/1A2B3C4D5E6F7G8H9I0');
  });

  it('creates new certificate request with unique ID and timestamp', async () => {
    const existingList: any[] = [];
    vi.mocked(storageHelper.readLocalJson).mockReturnValue(existingList);

    const newReq = await certificateService.createCertificateRequest({
      studentCode: '6501234567',
      studentName: 'พระมหาอนันต์ ปัญญาวโร',
      certType: 'CERT_STUDENT_STATUS',
      degreeLevel: 'BACHELOR',
      major: 'สาขาวิชาพระพุทธศาสนา',
      requestPurpose: 'ใช้ต่อวีซ่า',
      status: 'PENDING',
      copies: 1,
      language: 'TH',
    } as any);

    expect(newReq.id).toBeDefined();
    expect(newReq.createdAt).toBeDefined();
    expect(newReq.studentCode).toBe('6501234567');
    expect(storageHelper.writeLocalJson).toHaveBeenCalled();
  });

  it('updates request status and preserves immutable properties', async () => {
    const existingReq = {
      id: 'req-001',
      studentCode: '6501234567',
      studentName: 'พระมหาอนันต์ ปัญญาวโร',
      status: 'PENDING',
      createdAt: '2026-11-01T00:00:00.000Z',
    };
    vi.mocked(storageHelper.readLocalJson).mockReturnValue([existingReq]);

    const updated = await certificateService.updateCertificateRequest('req-001', {
      status: 'APPROVED',
      docNo: 'MCU-FB-2569/001',
    });

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('APPROVED');
    expect(updated?.docNo).toBe('MCU-FB-2569/001');
    expect(updated?.id).toBe('req-001');
  });
});
