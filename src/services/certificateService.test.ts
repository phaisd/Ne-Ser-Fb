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

  describe('Certificate Types CRUD', () => {
    it('fetches certificate types', async () => {
      const mockTypes = [{ id: 'cert-1', name: 'หนังสือรับรองทั่วไป', targetAudience: 'THAI' }];
      vi.mocked(storageHelper.readLocalJson).mockReturnValue(mockTypes);

      const result = await certificateService.getCertificateTypes();
      expect(result).toEqual(mockTypes);
    });

    it('creates a new certificate type', async () => {
      vi.mocked(storageHelper.readLocalJson).mockReturnValue([]);

      const created = await certificateService.createCertificateType({
        name: 'หนังสือรับรองความประพฤติ',
        targetAudience: 'THAI',
        code: 'TH-09',
        description: 'รับรองความประพฤติ',
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe('หนังสือรับรองความประพฤติ');
      expect(created.code).toBe('TH-09');
      expect(created.isActive).toBe(true);
      expect(storageHelper.writeLocalJson).toHaveBeenCalled();
    });

    it('updates existing certificate type', async () => {
      const mockTypes = [
        { id: 'cert-th-01', code: 'TH-01', name: 'ชื่อเดิม', targetAudience: 'THAI', isActive: true },
      ];
      vi.mocked(storageHelper.readLocalJson).mockReturnValue(mockTypes);

      const updated = await certificateService.updateCertificateType('cert-th-01', {
        name: 'ชื่อใหม่ที่แก้ไขแล้ว',
        isActive: false,
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('ชื่อใหม่ที่แก้ไขแล้ว');
      expect(updated?.isActive).toBe(false);
      expect(updated?.id).toBe('cert-th-01');
      expect(storageHelper.writeLocalJson).toHaveBeenCalled();
    });

    it('deletes a certificate type', async () => {
      const mockTypes = [
        { id: 'cert-th-01', name: 'ประเภทที่ 1' },
        { id: 'cert-th-02', name: 'ประเภทที่ 2' },
      ];
      vi.mocked(storageHelper.readLocalJson).mockReturnValue(mockTypes);

      const success = await certificateService.deleteCertificateType('cert-th-01');
      expect(success).toBe(true);
      expect(storageHelper.writeLocalJson).toHaveBeenCalled();
    });
  });
});
