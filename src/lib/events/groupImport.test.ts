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

  it('correctly parses user full text from prompt', () => {
    const fullText = `แบบฟอร์มนำเข้ารายชื่อนิสิตแบบจัดกลุ่ม (เลขเฉพาะกลุ่ม)\t\t\t\t\t\t\t
ใส่รหัสประจำกลุ่มในคอลัมน์ "เลขเฉพาะกลุ่ม" (เช่น T101, T201, G01-01)\t\t\t\t\t\t\t
กลุ่ม\tเลขเฉพาะกลุ่ม\tรหัสนิสิต\tชื่อ-นามสกุล\tหลักสูตร\tหลักสูตรภาษา\tสาขาวิชา\tชั้นปี
1\tB1T01\t6801401003\tพระวิชัย วิชโย\tปริญญาตรี\tTHAI\tบาลีสันสกฤต\t4
1\tB1T02\t6701501004\tพระมหากุศล กุสลจิตโต\tปริญญาตรี\tTHAI\tศาสนาและปรัชญา\t3
1\tB1T03\t6701501075\tพระดำรงพล กตปุญฺโญ\tปริญญาตรี\tTHAI\tวิปัสสนาภาวนา\t3
1\tB1T04\t6801501071\tพระครูสมุห์รัชกฤช ภทฺทปญฺโญ\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t2
1\tB1T05\t6801501009\tพระมหาชนุดม อุตฺตมวํโส\tปริญญาตรี\tTHAI\tศาสนาและปรัชญา\t2
1\tB1T06\t6801501072\tพระมหาวชิรวิทย์ ธนวุฑฺโฒ\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t2
1\tB1T07\t6601501103\tพระ Kittiphong  Inngkhone\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t4
1\tB1T08\t6801401001\tพระทรงสิทธิ์ จิตคุโณ\tปริญญาตรี\tTHAI\tศาสนาและปรัชญา\t4
1\tB1T09\t6801501138\tพระสุพรรณ แฮล\tปริญญาตรี\tTHAI\tศาสนาและปรัชญา\t2
1\tB1T10\t6801501084\tพระสายัน สารโท\tปริญญาตรี\tTHAI\tบาลีสันสกฤต\t2
1\tB1T11\t6801504141\t พระมหานิพิฐ  ธมฺมานนฺโท\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t1
1\tB1T12\t6901501095\tพระพิรุณชัย ธมฺมธโร\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t1
1\tB1T13\t\u00A06901501091\tพระกิติศักดิ์ กิตฺติสกฺโก\tปริญญาตรี\tTHAI\tวิปัสสนาภาวนา\t1
1\tB1T14\t6701501044\tพระนวพล ชยโสภโณ\tปริญญาตรี\tTHAI\tบาลีสันสกฤต\t3
1\tB1T15\t6701501047\tสามเณร Panyavara \tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t3
1\tB1T16\t6801501076\tสามเณรอภิสร ใสสะอาด\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t2
1\tB1T17\t6801501078\tสามเณรกิตติพัฒน์ พุ่มพวง\tปริญญาตรี\tTHAI\tศาสนาและปรัชญา\t2
1\tB1T18\t\u00A06901501050\tสามเณรฉันทพัฒน์ อินทร์ชัยศรี\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t1
2\tB2T01\t6701501046\tBounmy Xaymonty\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t3
2\tB2T02\t6701501086\tพระญาณกิตต อตฺถกาโร\tปริญญาตรี\tTHAI\tวิปัสสนาภาวนา\t3
2\tB2T03\t6601501089\tพระนราธิป ชินวโร\tปริญญาตรี\tTHAI\tวิปัสสนาภาวนา\t4
2\tB2T04\t6701501045\tพระพันธ์ศักดิ์ วรสกฺโก\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t3
2\tB2T05\t6801501075\tพระสมชาย ปญฺญาธโร\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t2
2\tB2T06\t6601501062\tพระสุริยกมล ปภาโส\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t4
2\tB2T07\t6601501098\tพระวีรวิชญ์   กตฺสาโร\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t4
2\tB2T08\t6601501065\tพระมหาฐิติพงศ์ สุทฺธิโสภโณ\tปริญญาตรี\tTHAI\tศาสนาและปรัชญา\t4
2\tB2T09\t6601501070\tสามเณรมนตรี พงษ์ประเสริฐ\tปริญญาตรี\tTHAI\tศาสนาและปรัชญา\t4
2\tB2T10\t6801501002\tKhuangphan Sengmany \tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t2
2\tB2T11\t6901501052\tพระศิวาพัชร์ ถาวรจิตฺโต\tปริญญาตรี\tTHAI\tศาสนาและปรัชญา\t1
2\tB2T12\t6901501098\tVen. Dhammasiri -\tปริญญาตรี\tTHAI\tศาสนาและปรัชญา\t1
2\tB2T13\t6901501092\tพระธนพล กตสาโร\tปริญญาตรี\tTHAI\tวิปัสสนาภาวนา\t1
2\tB2T14\t6801501134\tสามเณรยมมะลา อ่อนอินทร์\tปริญญาตรี\tTHAI\tศาสนาและปรัชญา\t2
2\tB2T15\t6701501050\tสามเณรพัชรพล เจริญเกียรติ\tปริญญาตรี\tTHAI\tบาลีสันสกฤต\t3
2\tB2T16\t6801501080\tสามเณรภูบดินทร กาวิจา\tปริญญาตรี\tTHAI\tศาสนาและปรัชญา\t2
2\tB2T17\t6801501079\tสามเณรพชร พรมมี\tปริญญาตรี\tTHAI\tศาสนาและปรัชญา\t2
8\tB8E10\t6701501030\t"\tApolu Barua "\tปริญญาตรี\tENGLISH\tReligion & Philosophy\t3`;

    const res = parseGroupedParticipantsText(fullText);
    console.log('Detected delimiter and count:', res.items.length);
    expect(res.items.length).toBeGreaterThan(30);
  });

  it('correctly parses 10-column table with สถานภาพ/เพศ and พรรษา(ถ้ามี)', () => {
    const raw = `แบบฟอร์มนำเข้ารายชื่อนิสิตแบบจัดกลุ่ม (เลขเฉพาะกลุ่ม)
ใส่รหัสประจำกลุ่มในคอลัมน์ "เลขเฉพาะกลุ่ม" (เช่น T101, T201, G01-01)
กลุ่ม\tเลขเฉพาะกลุ่ม\tรหัสนิสิต\tชื่อ-นามสกุล\tหลักสูตร\tหลักสูตรภาษา\tสาขาวิชา\tชั้นปี\tสถานภาพ/เพศ\tพรรษา(ถ้ามี)
1\tB1T01\t6801401003\tพระวิชัย วิชโย\tปริญญาตรี\tTHAI\tบาลีสันสกฤต\t4\tพระภิกษุ\t41
1\tB1T02\t6701501004\tพระมหากุศล กุสลจิตโต\tปริญญาตรี\tTHAI\tศาสนาและปรัชญา\t3\tพระภิกษุ\t20
1\tB1T03\t6701501075\tพระดำรงพล กตปุญฺโญ\tปริญญาตรี\tTHAI\tวิปัสสนาภาวนา\t3\tพระภิกษุ\t
1\tB1T16\t6801501076\tสามเณรอภิสร ใสสะอาด\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t2\tสามเณร\t
2\tB2T01\t6701501046\tBounmy Xaymonty\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t3\tฆราวาสชาย\t
12\tB1201\t6601501013\tแม่ชีสุวีรา\tปริญญาตรี\tTHAI\tพระพุทธศาสนา\t4\tแม่ชี\t`;

    const res = parseGroupedParticipantsText(raw);
    expect(res.items.length).toBe(6);
    expect(res.items[0].groupSpecificCode).toBe('B1T01');
    expect(res.items[0].studentName).toBe('พระวิชัย วิชโย');
    expect(res.items[0].role).toBe('พระภิกษุ');
    expect(res.items[0].vasa).toBe('41');

    expect(res.items[1].role).toBe('พระภิกษุ');
    expect(res.items[1].vasa).toBe('20');

    expect(res.items[2].role).toBe('พระภิกษุ');
    expect(res.items[2].vasa).toBeFalsy();

    expect(res.items[3].role).toBe('สามเณร');
    expect(res.items[3].vasa).toBeFalsy();

    expect(res.items[4].role).toBe('ฆราวาสชาย');

    expect(res.items[5].role).toBe('แม่ชี');
  });

  it('formats group display label with (ไทย) and (English)', async () => {
    const { formatGroupDisplay } = await import('./groupImport');
    expect(formatGroupDisplay(1)).toBe('กลุ่ม 1 (ไทย)');
    expect(formatGroupDisplay(2)).toBe('กลุ่ม 2 (ไทย)');
    expect(formatGroupDisplay(12)).toBe('Group 12 (English)');
    expect(formatGroupDisplay(12, [{ groupNumber: 12, programType: 'ENGLISH' }])).toBe('Group 12 (English)');
    expect(formatGroupDisplay(3, [{ groupNumber: 3, programType: 'THAI' }])).toBe('กลุ่ม 3 (ไทย)');
    expect(formatGroupDisplay(5, [{ groupNumber: 5, programType: 'ENGLISH' }])).toBe('Group 5 (English)');
  });
});
