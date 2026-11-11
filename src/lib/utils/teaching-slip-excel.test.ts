import { describe, it, expect } from 'vitest';
import { UserAccount } from '@/types';
import {
  buildBatchTeachingSlipsFilename,
  buildBatchTeachingSlipsSheets,
} from './teaching-slip-excel';
import { buildXlsxBytes } from './xlsx-export';

describe('teaching-slip-excel builder', () => {
  const instructors: UserAccount[] = [
    {
      id: 'INS-001',
      name: 'พระมหาสมชาย กิตฺติภทฺโท, รศ.ดร.',
      nameEn: 'Phramaha Somchai',
      email: 'somchai@mcu.ac.th',
      gmail: 'somchai.mcu@gmail.com',
      defaultPassword: 'pass001',
      department: 'ภาควิชาพระพุทธศาสนา',
      instructorType: 'อาจารย์ประจำ',
      role: 'INSTRUCTOR',
    },
    {
      id: 'INS-002',
      name: 'อ.สมหญิง ใจดี',
      email: 'somying@mcu.ac.th',
      department: 'หลักสูตรนานาชาติ',
      role: 'OFFICER',
    },
  ];

  const coursesByInstructor: Record<string, any[]> = {
    'INS-001': [
      {
        courseCode: '101101',
        courseName: 'พระพุทธศาสนาเบื้องต้น',
        academicYear: '2569',
        semester: 1,
        yearLevel: 1,
        dayShort: 'จ.',
        startTime: '09.00',
        endTime: '12.00',
        room: 'B401',
        timetableTitle: 'ภาคภาษาไทย',
      },
      {
        courseCode: 'BI102',
        courseName: 'Introduction to Pali',
        academicYear: '2569',
        semester: 1,
        yearLevel: 2,
        dayShort: 'พ.',
        startTime: '13.00',
        endTime: '16.00',
        room: 'INT-201',
        timetableTitle: 'หลักสูตรนานาชาติ',
      },
    ],
    'INS-002': [],
  };

  it('generates detail and summary sheets including instructors with zero courses', () => {
    const sheets = buildBatchTeachingSlipsSheets({
      instructors,
      getCoursesForInstructor: (u) => coursesByInstructor[u.id] || [],
      selectedYear: '2569',
      selectedSemester: '1',
      attendanceUrl: 'https://ne-ser-fb.vercel.app/attendance',
      adminName: 'เจ้าหน้าที่ทดสอบ',
      exportedAt: new Date('2026-11-11T08:00:00+07:00'),
    });

    expect(sheets).toHaveLength(2);
    expect(sheets[0].name).toBe('บัตรภาระงาน_แยกรายวิชา');
    expect(sheets[1].name).toBe('สรุปรายอาจารย์และรหัสผ่าน');

    // Detail sheet: 2 courses for INS-001 + 1 placeholder row for INS-002 = 3 rows
    expect(sheets[0].rows).toHaveLength(3);
    expect(sheets[0].rows[0]).toContain('101101');
    expect(sheets[0].rows[0]).toContain('ภาคไทย');
    expect(sheets[0].rows[1]).toContain('BI102');
    expect(sheets[0].rows[1]).toContain('นานาชาติ (EN)');
    expect(sheets[0].rows[2]).toContain('(ไม่พบรายวิชาในภาคการศึกษานี้)');
    expect(sheets[0].rows[2]).toContain('mcu123456'); // fallback defaultPassword

    // Summary sheet: 1 row per instructor = 2 rows
    expect(sheets[1].rows).toHaveLength(2);
    expect(sheets[1].rows[0][10]).toBe(2); // course count for INS-001
    expect(String(sheets[1].rows[0][11])).toContain('[101101] พระพุทธศาสนาเบื้องต้น');
    expect(String(sheets[1].rows[0][11])).toContain('[BI102] Introduction to Pali');
    expect(sheets[1].rows[1][10]).toBe(0); // course count for INS-002

    // Should compile cleanly into .xlsx bytes
    const xlsxBytes = buildXlsxBytes(sheets);
    expect(xlsxBytes.length).toBeGreaterThan(1000);
  });

  it('builds descriptive Thai filename for selected year and semester', () => {
    const date = new Date('2026-11-11T01:00:00Z');
    expect(buildBatchTeachingSlipsFilename('2569', '1', date)).toBe(
      'บัตรแจ้งภาระงานสอน_เป็นชุด_ปี_2569_ภาค_1_2026-11-11.xlsx'
    );
    expect(buildBatchTeachingSlipsFilename('ALL', 'ALL', date)).toBe(
      'บัตรแจ้งภาระงานสอน_เป็นชุด_ทุกปีการศึกษา_ทุกภาคเรียน_2026-11-11.xlsx'
    );
  });
});
