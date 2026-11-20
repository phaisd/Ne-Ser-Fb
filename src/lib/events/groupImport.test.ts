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
  it('parses full 8-column CSV with both group-specific code and student ID', () => {
    const csv = [
      'กลุ่ม,เลขเฉพาะกลุ่ม,รหัสนิสิต,ชื่อ-นามสกุล,หลักสูตร,หลักสูตรภาษา,สาขาวิชา,ชั้นปี',
      '1,T101,6701501011,พระมหาสมชาย กิตฺติโสภโณ,ปริญญาตรี,THAI,พระพุทธศาสนา,2',
      '1,T102,6701501011,สามเณรธีรภัทร สุขใจ,ปริญญาโท,THAI,พระพุทธศาสนา,2',
      '2,T201,6701501011,นายก้องภพ ใจดี,ปริญญาเอก,THAI,ศาสนาและปรัชญา,3',
      '3,I301,6701501011,Ven. Dhammapalo,ปริญญาตรี,ENGLISH,Buddhism,1',
    ].join('\n');

    const res = parseGroupedParticipantsText(csv);
    expect(res.warnings).toEqual([]);
    expect(res.detectedGroups).toEqual([1, 2, 3]);
    expect(res.items).toHaveLength(4);

    expect(res.items[0]).toMatchObject({
      groupNumber: 1,
      groupSpecificCode: 'T101',
      studentCode: '6701501011',
      studentName: 'พระมหาสมชาย กิตฺติโสภโณ',
      degreeLevel: 'ปริญญาตรี',
      programType: 'THAI',
      major: 'พระพุทธศาสนา',
      yearLevel: 2,
    });

    expect(res.items[1]).toMatchObject({
      groupNumber: 1,
      groupSpecificCode: 'T102',
      studentCode: '6701501011',
      studentName: 'สามเณรธีรภัทร สุขใจ',
      degreeLevel: 'ปริญญาโท',
      programType: 'THAI',
      major: 'พระพุทธศาสนา',
      yearLevel: 2,
    });

    expect(res.items[2]).toMatchObject({
      groupNumber: 2,
      groupSpecificCode: 'T201',
      studentCode: '6701501011',
      studentName: 'นายก้องภพ ใจดี',
      degreeLevel: 'ปริญญาเอก',
      programType: 'THAI',
      major: 'ศาสนาและปรัชญา',
      yearLevel: 3,
    });

    expect(res.items[3]).toMatchObject({
      groupNumber: 3,
      groupSpecificCode: 'I301',
      studentCode: '6701501011',
      studentName: 'Ven. Dhammapalo',
      degreeLevel: 'ปริญญาตรี',
      programType: 'ENGLISH',
      major: 'Buddhism',
      yearLevel: 1,
    });
  });

  it('parses headerless 8-column tab-separated rows', () => {
    const tsv = [
      '1\tT101\t6701501011\tพระมหาสมชาย กิตฺติโสภโณ\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t2',
      '3\tI301\t6701501011\tVen. Dhammapalo\tปริญญาตรี\tENGLISH\tBuddhism\t1',
    ].join('\n');

    const res = parseGroupedParticipantsText(tsv);
    expect(res.items).toHaveLength(2);
    expect(res.items[0]).toMatchObject({
      groupNumber: 1,
      groupSpecificCode: 'T101',
      studentCode: '6701501011',
      studentName: 'พระมหาสมชาย กิตฺติโสภโณ',
      degreeLevel: 'ปริญญาตรี',
      programType: 'THAI',
      major: 'พระพุทธศาสนา',
      yearLevel: 2,
    });
    expect(res.items[1]).toMatchObject({
      groupNumber: 3,
      groupSpecificCode: 'I301',
      studentCode: '6701501011',
      studentName: 'Ven. Dhammapalo',
      degreeLevel: 'ปริญญาตรี',
      programType: 'ENGLISH',
      major: 'Buddhism',
      yearLevel: 1,
    });
  });

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
      studentCode: '6701100001',
      groupSpecificCode: 'G05-01',
      groupNumber: 5,
      groupName: 'กลุ่มที่ 5',
      programType: 'THAI',
      remarks: 'เลขเฉพาะกลุ่ม: G05-01',
    });
    expect(built[1]).toMatchObject({
      studentCode: '6701100002',
      groupSpecificCode: 'G05-02',
      programType: 'ENGLISH',
    });
  });

  it('correctly handles multi-line titles and swaps columns if student code and group code are inverted', () => {
    const raw = [
      'แบบฟอร์มนำเข้ารายชื่อนิสิตแบบจัดกลุ่ม (เลขเฉพาะกลุ่ม)',
      'ใส่รหัสประจำกลุ่มในคอลัมน์ "เลขเฉพาะกลุ่ม" (เช่น T101, T201, G01-01)',
      'กลุ่ม\tเลขเฉพาะกลุ่ม\tรหัสนิสิต\tชื่อ-นามสกุล\tหลักสูตร\tหลักสูตรภาษา\tสาขาวิชา\tชั้นปี',
      '1\tB1T01\t6801401003\tพระวิชัย วิชโย\tปริญญาตรี\tTHAI\tบาลีสันสกฤต\t4',
      '2\tB2T15\t6701501050\tสามเณรพัชรพล เจริญเกียรติ\tปริญญาตรี\tTHAI\tบาลีสันสกฤต\t3',
    ].join('\n');

    const res = parseGroupedParticipantsText(raw);
    expect(res.warnings).toEqual([]);
    expect(res.items).toHaveLength(2);
    expect(res.items[0]).toMatchObject({
      groupNumber: 1,
      groupSpecificCode: 'B1T01',
      studentCode: '6801401003',
      studentName: 'พระวิชัย วิชโย',
    });
    expect(res.items[1]).toMatchObject({
      groupNumber: 2,
      groupSpecificCode: 'B2T15',
      studentCode: '6701501050',
      studentName: 'สามเณรพัชรพล เจริญเกียรติ',
    });
  });

  it('correctly parses user pasted CSV text with commas and non-breaking spaces', () => {
    const userCsv = `แบบฟอร์มนำเข้ารายชื่อนิสิตแบบจัดกลุ่ม (เลขเฉพาะกลุ่ม),,,,,,,
"ใส่รหัสประจำกลุ่มในคอลัมน์ ""เลขเฉพาะกลุ่ม"" (เช่น T101, T201, G01-01)",,,,,,,
กลุ่ม,เลขเฉพาะกลุ่ม,รหัสนิสิต,ชื่อ-นามสกุล,หลักสูตร,หลักสูตรภาษา,สาขาวิชา,ชั้นปี
1,B1T01,6801401003,พระวิชัย วิชโย,ปริญญาตรี,THAI,บาลีสันสกฤต,4
1,B1T02,6701501004,พระมหากุศล กุสลจิตโต,ปริญญาตรี,THAI,ศาสนาและปรัชญา,3
1,B1T13,\u00A06901501091,พระกิติศักดิ์ กิตฺติสกฺโก,ปริญญาตรี,THAI,วิปัสสนาภาวนา,1
2,B2T15,6701501050,สามเณรพัชรพล เจริญเกียรติ,ปริญญาตรี,THAI,บาลีสันสกฤต,3
12,B1216,\u00A06901501004,\u00A0นายศิรภพ สนิทใจ,ปริญญาตรี,THAI,พระพุทธศาสนา,1`;

    const res = parseGroupedParticipantsText(userCsv);
    expect(res.warnings).toEqual([]);
    expect(res.items).toHaveLength(5);
    expect(res.items[0].studentCode).toBe('6801401003');
    expect(res.items[0].groupSpecificCode).toBe('B1T01');
    expect(res.items[2].studentCode).toBe('6901501091');
    expect(res.items[2].groupSpecificCode).toBe('B1T13');
    expect(res.items[3].studentCode).toBe('6701501050');
    expect(res.items[3].groupSpecificCode).toBe('B2T15');
    expect(res.items[4].studentCode).toBe('6901501004');
    expect(res.items[4].groupSpecificCode).toBe('B1216');
    expect(res.items[4].groupNumber).toBe(12);
  });

  it('correctly parses space-separated rows when neither tabs nor commas are used', () => {
    const spaceText = `แบบฟอร์มนำเข้ารายชื่อนิสิตแบบจัดกลุ่ม (เลขเฉพาะกลุ่ม)
ใส่รหัสประจำกลุ่มในคอลัมน์ "เลขเฉพาะกลุ่ม" (เช่น T101, T201, G01-01)
กลุ่ม   เลขเฉพาะกลุ่ม   รหัสนิสิต   ชื่อ-นามสกุล   หลักสูตร   หลักสูตรภาษา   สาขาวิชา   ชั้นปี
1   B1T01   6801401003   พระวิชัย วิชโย   ปริญญาตรี   THAI   บาลีสันสกฤต   4
1   B1T02   6701501004   พระมหากุศล กุสลจิตโต   ปริญญาตรี   THAI   ศาสนาและปรัชญา   3`;

    const res = parseGroupedParticipantsText(spaceText);
    expect(res.warnings).toEqual([]);
    expect(res.items).toHaveLength(2);
    expect(res.items[0].studentCode).toBe('6801401003');
    expect(res.items[0].groupSpecificCode).toBe('B1T01');
    expect(res.items[0].studentName).toBe('พระวิชัย วิชโย');
  });
});
