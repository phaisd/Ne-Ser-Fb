import { describe, expect, it } from 'vitest';
import {
  buildGroupCloneItems,
  buildGroupedStudentsFromDirectory,
  formatGroupSpecificCode,
  parseGroupedParticipantsText,
  summarizeGroups,
} from './groupImport';
import type { EventRegistration } from '@/types/event';
import type { Student } from '@/types/student';

describe('groupImport helpers', () => {
  it('parses CSV with Thai headers and group-specific codes', () => {
    const csv = [
      'กลุ่ม,เลขเฉพาะกลุ่ม,ชื่อ-นามสกุล,หลักสูตรภาษา,ชั้นปี',
      '3,T321,พระมหาสมชาย ใจดี,THAI,2',
      '3,T322,สามเณรธีรภัทร รักเรียน,THAI,2',
      '4,I401,Ven. Dhammapalo,ENGLISH,1',
    ].join('\n');

    const res = parseGroupedParticipantsText(csv);
    expect(res.warnings).toEqual([]);
    expect(res.detectedGroups).toEqual([3, 4]);
    expect(res.items).toHaveLength(3);
    expect(res.items[0]).toMatchObject({
      studentCode: 'T321',
      studentName: 'พระมหาสมชาย ใจดี',
      groupNumber: 3,
      groupName: 'กลุ่มที่ 3',
      programType: 'THAI',
      yearLevel: 2,
    });
    expect(res.items[2]).toMatchObject({
      studentCode: 'I401',
      programType: 'ENGLISH',
      groupNumber: 4,
    });
  });

  it('parses headerless tab-separated Excel rows and auto-generates missing codes per group', () => {
    const tsv = [
      '1\tT101\tนายก้องภพ สุขใส',
      '1\t\tนายสมศักดิ์ ดีงาม',
      '2\t\tนางสาววิภาดา เก่งกล้า',
    ].join('\n');

    const res = parseGroupedParticipantsText(tsv, { autoCodePrefix: 'V' });
    expect(res.items).toHaveLength(3);
    expect(res.items[0].studentCode).toBe('T101');
    expect(res.items[1].studentCode).toBe('V01-02');
    expect(res.items[2].studentCode).toBe('V02-01');
  });

  it('summarizes and clones registrations filtered by selected group keys', () => {
    const source: EventRegistration[] = [
      {
        id: '1',
        eventId: 'ev-old',
        studentCode: 'T321',
        studentName: 'พระสมชาย',
        status: 'ATTENDED',
        groupNumber: 3,
        groupName: 'กลุ่มที่ 3',
        createdAt: '2026-01-01',
      },
      {
        id: '2',
        eventId: 'ev-old',
        studentCode: 'T401',
        studentName: 'นายสมปอง',
        status: 'REGISTERED',
        groupNumber: 4,
        groupName: 'กลุ่มที่ 4',
        createdAt: '2026-01-01',
      },
    ];

    const summary = summarizeGroups(source);
    expect(summary.map((s) => `${s.key}:${s.count}`)).toEqual(['num:3:1', 'num:4:1']);

    const cloned = buildGroupCloneItems(source, ['num:3']);
    expect(cloned).toHaveLength(1);
    expect(cloned[0]).toMatchObject({
      studentCode: 'T321',
      studentName: 'พระสมชาย',
      groupNumber: 3,
      status: 'REGISTERED',
    });
  });

  it('builds grouped registrations from student directory with group-specific numbering', () => {
    const students: Student[] = [
      {
        id: 's1',
        studentCode: '6701100001',
        firstName: 'พระมหาสมพงษ์',
        lastName: 'กิตติธโร',
        fullName: 'พระมหาสมพงษ์ กิตติธโร',
        yearLevel: 2,
        degree: 'ปริญญาตรี',
        department: 'พระพุทธศาสนา',
        major: 'พระพุทธศาสนา',
        programType: 'THAI',
      },
      {
        id: 's2',
        studentCode: '6701100002',
        firstName: 'Ven.',
        lastName: 'Anand',
        fullName: 'Ven. Anand',
        yearLevel: 1,
        degree: 'ปริญญาตรี',
        department: 'ศาสนาและปรัชญา',
        major: 'พุทธศาสตร์',
        programType: 'ENGLISH',
      },
    ];

    const built = buildGroupedStudentsFromDirectory(students, {
      groupNumber: 5,
      useGroupSpecificCode: true,
      codePrefix: 'G',
      startSequence: 1,
    });

    expect(formatGroupSpecificCode('g', 5, 1)).toBe('G05-01');
    expect(built[0]).toMatchObject({
      studentCode: 'G05-01',
      groupNumber: 5,
      groupName: 'กลุ่มที่ 5',
      programType: 'THAI',
      remarks: 'รหัสนิสิตเดิม: 6701100001',
    });
    expect(built[1]).toMatchObject({
      studentCode: 'G05-02',
      programType: 'ENGLISH',
    });
  });
});
