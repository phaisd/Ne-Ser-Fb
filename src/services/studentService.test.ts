import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as studentService from './studentService';
import * as storageHelper from './storageHelper';
import { Student } from '@/types';

vi.mock('./storageHelper', () => ({
  readLocalJson: vi.fn(),
  writeLocalJson: vi.fn(),
  getSheetsClient: vi.fn(() => null),
  getLocalFilePath: vi.fn((f: string) => f),
  DATA_DIR: '/mock/data',
}));

describe('studentService', () => {
  const mockStudents: Student[] = [
    {
      id: 'st-001',
      studentCode: '6501234567',
      title: 'พระมหา',
      firstName: 'อนันต์',
      lastName: 'ปัญญาวโร',
      fullName: 'พระมหาอนันต์ ปัญญาวโร',
      major: 'สาขาวิชาพระพุทธศาสนา',
      yearLevel: 3,
      degree: 'ปริญญาตรี',
      studyStatus: 'กำลังศึกษา',
      faculty: 'คณะพุทธศาสตร์',
      email: '6501234567@mcu.ac.th',
      phoneNumber: '0812345678',
      isActive: true,
    },
    {
      id: 'st-002',
      studentCode: '6609876543',
      title: 'นาย',
      firstName: 'วีระ',
      lastName: 'มั่นคง',
      fullName: 'นายวีระ มั่นคง',
      major: 'สาขาวิชาปรัชญา',
      yearLevel: 2,
      degree: 'ปริญญาตรี',
      studyStatus: 'กำลังศึกษา',
      faculty: 'คณะพุทธศาสตร์',
      email: '6609876543@mcu.ac.th',
      phoneNumber: '0898765432',
      isActive: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves student list correctly in autonomous local mode', async () => {
    vi.mocked(storageHelper.readLocalJson).mockReturnValue([...mockStudents]);

    const result = await studentService.getStudents();
    expect(result).toHaveLength(2);
    expect(result[0].studentCode).toBe('6501234567');
    expect(result[0].fullName).toBe('พระมหา อนันต์ ปัญญาวโร');
  });

  it('updates student password and sets hasChangedPassword flag', async () => {
    const list = JSON.parse(JSON.stringify(mockStudents));
    vi.mocked(storageHelper.readLocalJson).mockReturnValue(list);

    const success = await studentService.updateStudentPassword('6501234567', 'NewSecretPass123');
    expect(success).toBe(true);
    expect(list[0].password).toMatch(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/);
    expect(list[0].hasChangedPassword).toBe(true);
    expect(storageHelper.writeLocalJson).toHaveBeenCalledWith('students.json', list);
  });

  it('returns false when updating password of non-existent student', async () => {
    vi.mocked(storageHelper.readLocalJson).mockReturnValue([...mockStudents]);

    const success = await studentService.updateStudentPassword('9999999999', 'AnyPass');
    expect(success).toBe(false);
  });
});
