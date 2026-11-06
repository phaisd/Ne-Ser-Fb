import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as instructorService from './instructorService';
import * as storageHelper from './storageHelper';
import * as studentService from './studentService';
import { InstructorAccount, Student } from '@/types';

vi.mock('./storageHelper', () => ({
  readLocalJson: vi.fn(),
  writeLocalJson: vi.fn(),
  getSheetsClient: vi.fn(() => null),
  getLocalFilePath: vi.fn((f: string) => f),
  DATA_DIR: '/mock/data',
}));

vi.mock('./studentService', () => ({
  getStudents: vi.fn(),
}));

vi.mock('./courseService', () => ({
  getTimetables: vi.fn(() => Promise.resolve([])),
}));

describe('instructorService & Authentication', () => {
  const mockInstructors: InstructorAccount[] = [
    {
      id: 'inst-1',
      name: 'พระมหาไพศาล ฐิตปญฺโญ ดร.',
      email: 'phaisal.dis@mcu.ac.th',
      gmail: 'phaisal.thita@gmail.com',
      department: 'ภาควิชาพระพุทธศาสนา',
      role: 'SUPER_ADMIN',
      password: 'mcu123456',
      isActive: true,
      isSuspended: false,
    },
    {
      id: 'inst-2',
      name: 'ผศ.ดร.สมชาย ใจดี',
      email: 'somchai.jai@mcu.ac.th',
      department: 'ภาควิชาปรัชญา',
      role: 'INSTRUCTOR',
      password: 'customPassword123',
      isActive: true,
      isSuspended: false,
    },
    {
      id: 'inst-suspended',
      name: 'นายทดสอบ ระงับ',
      email: 'suspended@mcu.ac.th',
      department: 'ภาควิชาพระพุทธศาสนา',
      role: 'INSTRUCTOR',
      password: 'mcu123456',
      isActive: true,
      isSuspended: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('authenticates valid instructor credentials successfully', async () => {
    vi.mocked(storageHelper.readLocalJson).mockReturnValue([...mockInstructors]);

    const user = await instructorService.authenticateInstructor('somchai.jai@mcu.ac.th', 'customPassword123');
    expect(user).not.toBeNull();
    expect(user?.name).toBe('ผศ.ดร.สมชาย ใจดี');
    expect((user as any).password).toBeUndefined(); // Password must not be returned
  });

  it('rejects invalid instructor password', async () => {
    vi.mocked(storageHelper.readLocalJson).mockReturnValue([...mockInstructors]);

    const user = await instructorService.authenticateInstructor('somchai.jai@mcu.ac.th', 'wrongPass');
    expect(user).toBeNull();
  });

  it('throws error when logging in with suspended account', async () => {
    vi.mocked(storageHelper.readLocalJson).mockReturnValue([...mockInstructors]);

    await expect(
      instructorService.authenticateInstructor('suspended@mcu.ac.th', 'mcu123456')
    ).rejects.toThrow(/ถูกระงับการใช้งานชั่วคราว/);
  });

  it('updates instructor password properly', async () => {
    const list = JSON.parse(JSON.stringify(mockInstructors));
    vi.mocked(storageHelper.readLocalJson).mockReturnValue(list);

    const success = await instructorService.updateInstructorPassword('inst-2', 'BrandNewSecureHash!');
    expect(success).toBe(true);
    expect(list[1].password).toMatch(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/);
    expect(list[1].hasChangedPassword).toBe(true);
  });
});
