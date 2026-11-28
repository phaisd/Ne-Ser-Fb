import { describe, it, expect } from 'vitest';
import {
  cleanImportRawText,
  parseCSVToVipassanaMasters,
} from './vipassanaMasterParser';
import { UserAccount } from '@/types';

describe('vipassanaMasterParser', () => {
  const mockExistingUsers: UserAccount[] = [
    {
      id: 'u1',
      name: 'พระธรรมวชิรมุนี',
      email: 'vipassana01@mcu.ac.th',
      role: 'VIPASSANA_MASTER',
    } as UserAccount,
  ];

  it('correctly skips title and subtitle banner lines and prevents them from becoming monks (5 monks stay 5, not 7 or 8)', () => {
    // Exact text from user's template/uploaded file
    const sampleCsvWithBanner = `แบบฟอร์มนำเข้ารายชื่อพระวิปัสสนาจารย์ ประจำปีการศึกษา,,,,,,,,
"รองรับข้อมูลตำแหน่งทางคณะสงฆ์, หน่วยงาน/ภาควิชา และที่อยู่ติดต่อ (ไอดีและรหัสผ่านสร้างให้อัตโนมัติ)",,,,,,,,
ลำดับ,ชื่อ-ฉายา (ภาษาไทย),ชื่อ-ฉายา (ภาษาอังกฤษ),ตำแหน่งในโครงการ,ตำแหน่งทางคณะสงฆ์,หน่วยงาน / ภาควิชา,ที่อยู่ติดต่อ / สังกัดวัด,ไอดีเข้าใช้งาน/อีเมล (เว้นว่างได้ เพื่อสร้างอัตโนมัติ),รหัสผ่านเริ่มต้น (เว้นว่างได้ เพื่อสร้างอัตโนมัติ)
1,พระธรรมวชิรมุนี,Phra Dhammavajiramuni,ประธานพระวิปัสสนาจารย์,เจ้าคณะภาค ๑๐ / ที่ปรึกษาฯ,ฝ่ายวิปัสสนาธุระ คณะพุทธศาสตร์,วัดมหาธาตุยุวราชรังสฤษฎิ์ กรุงเทพฯ,vipassana01@mcu.ac.th,mcu123456
2,พระมหาบุญช่วย ปภสฺสโร,Phra Maha Boonchuay Pabhassaro,รองประธานพระวิปัสสนาจารย์,เจ้าอาวาสวัดวังผาหมู,คณะพุทธศาสตร์ ภาควิชาพระพุทธศาสนา,วัดวังผาหมู อ.พระพรหม จ.นครศรีธรรมราช,,
3,พระครูปลัดสุวัฒนบัณฑิตคุณ,Phra Khru Palat Suwattanabanditkun,เลขานุการพระวิปัสสนาจารย์,ผู้ช่วยเจ้าอาวาสวัดจากแดง,สำนักงานคณบดี คณะพุทธศาสตร์,วัดจากแดง อ.พระประแดง จ.สมุทรปราการ,,
4,พระอาจารย์มหาเอกสิทธิ์,Phra Ajahn Ekkasit,พระวิปัสสนาจารย์,พระวิปัสสนาจารย์ประจำศูนย์,ฝ่ายวิปัสสนาธุระ / พระวิปัสสนาจารย์,สถาบันวิปัสสนาธุระ มจร วังน้อย พระนครศรีอยุธยา,,
5,Phra Ajahn John Smith,Phra Ajahn John Smith,พระวิปัสสนาจารย์,-,วิทยาลัยพุทธศาสตร์นานาชาติ (IBSC),มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย วังน้อย,,`;

    const parsed = parseCSVToVipassanaMasters({
      text: sampleCsvWithBanner,
      existingUsers: mockExistingUsers,
      passwordOption: 'mcu123456',
    });

    // Must be exactly 5 monks, NOT 7 or 8!
    expect(parsed.length).toBe(5);

    // Verify first monk
    expect(parsed[0].name).toBe('พระธรรมวชิรมุนี');
    expect(parsed[0].nameEn).toBe('Phra Dhammavajiramuni');
    expect(parsed[0].position).toBe('ประธานพระวิปัสสนาจารย์');
    expect(parsed[0].email).toBe('vipassana01@mcu.ac.th');
    expect(parsed[0].isExisting).toBe(true);

    // Verify second monk
    expect(parsed[1].name).toBe('พระมหาบุญช่วย ปภสฺสโร');
    expect(parsed[1].nameEn).toBe('Phra Maha Boonchuay Pabhassaro');
    expect(parsed[1].position).toBe('รองประธานพระวิปัสสนาจารย์');
    expect(parsed[1].ecclesiasticalTitle).toBe('เจ้าอาวาสวัดวังผาหมู');
    expect(parsed[1].department).toBe('คณะพุทธศาสตร์ ภาควิชาพระพุทธศาสนา');
    expect(parsed[1].contactAddress).toBe('วัดวังผาหมู อ.พระพรหม จ.นครศรีธรรมราช');
    // Auto-assigned next sequential email
    expect(parsed[1].email).toBe('vipassana02@mcu.ac.th');
    expect(parsed[1].isExisting).toBe(false);

    // Verify third monk
    expect(parsed[2].name).toBe('พระครูปลัดสุวัฒนบัณฑิตคุณ');
    expect(parsed[2].position).toBe('เลขานุการพระวิปัสสนาจารย์');
    expect(parsed[2].email).toBe('vipassana03@mcu.ac.th');

    // Verify none of the parsed names contain title/banner text
    parsed.forEach((item) => {
      expect(item.name).not.toContain('แบบฟอร์ม');
      expect(item.name).not.toContain('รองรับข้อมูล');
      expect(item.name).not.toContain('ลำดับ');
    });
  });

  it('correctly parses 14 monks with title banner without turning into 16 monks', () => {
    const lines = [
      'แบบฟอร์มนำเข้ารายชื่อพระวิปัสสนาจารย์ ประจำปีการศึกษา,,,,,,,,',
      'รองรับข้อมูลตำแหน่งทางคณะสงฆ์,,,,,,,,',
      'ลำดับ,ชื่อ-ฉายา (ภาษาไทย),ชื่อ-ฉายา (ภาษาอังกฤษ),ตำแหน่งในโครงการ,ตำแหน่งทางคณะสงฆ์,หน่วยงาน / ภาควิชา,ที่อยู่ติดต่อ / สังกัดวัด,ไอดีเข้าใช้งาน,รหัสผ่าน',
    ];
    for (let i = 1; i <= 14; i++) {
      lines.push(`${i},พระรูปที่ ${i},Phra ${i},พระวิปัสสนาจารย์,เจ้าอาวาส,ภาควิชา,วัด,vipassana${String(i).padStart(2, '0')}@mcu.ac.th,mcu123456`);
    }

    const parsed = parseCSVToVipassanaMasters({
      text: lines.join('\n'),
      existingUsers: [],
    });

    // 14 monks stay 14 monks, NEVER 16!
    expect(parsed.length).toBe(14);
    expect(parsed[0].name).toBe('พระรูปที่ 1');
    expect(parsed[13].name).toBe('พระรูปที่ 14');
  });

  it('correctly handles round-trip export from handleExportXlsx and re-import', () => {
    // TSV representation of exported file
    const exportedTsv = [
      'ทำเนียบพระวิปัสสนาจารย์และรหัสผ่านเข้าใช้งานระบบ',
      'ส่งออกเมื่อ 28/11/2569 • จำนวนทั้งหมด 2 รูป',
      'ลำดับ\tชื่อ-ฉายา (ภาษาไทย)\tชื่อ-ฉายา (ภาษาอังกฤษ)\tตำแหน่งในโครงการ\tตำแหน่งทางคณะสงฆ์\tหน่วยงาน / ภาควิชา\tที่อยู่ติดต่อ / สังกัดวัด\tบทบาท (Role)\tไอดีเข้าใช้งาน (Username/Email)\tรหัสผ่านเริ่มต้น (Default Password)\tสถานะ',
      '1\tพระธรรมวชิรมุนี\tPhra Dhammavajiramuni\tประธานพระวิปัสสนาจารย์\tเจ้าคณะภาค ๑๐\tฝ่ายวิปัสสนาธุระ\tวัดมหาธาตุ\tVIPASSANA_MASTER\tvipassana01@mcu.ac.th\tcustomPass123\tเปิดใช้งาน',
      '2\tพระอาจารย์ใหม่\tPhra Mai\tพระวิปัสสนาจารย์\t-\tฝ่ายวิปัสสนาธุระ\tวัดใหม่\tVIPASSANA_MASTER\t\t\tเปิดใช้งาน',
    ].join('\n');

    const parsed = parseCSVToVipassanaMasters({
      text: exportedTsv,
      existingUsers: mockExistingUsers,
    });

    expect(parsed.length).toBe(2);
    expect(parsed[0].name).toBe('พระธรรมวชิรมุนี');
    expect(parsed[0].password).toBe('customPass123'); // Preserved from file
    expect(parsed[0].email).toBe('vipassana01@mcu.ac.th'); // Preserved from file
    expect(parsed[0].isExisting).toBe(true);

    expect(parsed[1].name).toBe('พระอาจารย์ใหม่');
    expect(parsed[1].email).toBe('vipassana02@mcu.ac.th'); // Auto-generated
    expect(parsed[1].isExisting).toBe(false);
  });

  it('cleanImportRawText strips title and subtitle banner lines leaving header row at top', () => {
    const raw = `แบบฟอร์มนำเข้ารายชื่อพระวิปัสสนาจารย์ ประจำปีการศึกษา,,,,,,,,
"รองรับข้อมูลตำแหน่งทางคณะสงฆ์, หน่วยงาน/ภาควิชา และที่อยู่ติดต่อ (ไอดีและรหัสผ่านสร้างให้อัตโนมัติ)",,,,,,,,
ลำดับ,ชื่อ-ฉายา (ภาษาไทย),ชื่อ-ฉายา (ภาษาอังกฤษ)
1,พระธรรมวชิรมุนี,Phra Dhammavajiramuni`;

    const cleaned = cleanImportRawText(raw);
    const lines = cleaned.split('\n');

    expect(lines[0]).toBe('ลำดับ,ชื่อ-ฉายา (ภาษาไทย),ชื่อ-ฉายา (ภาษาอังกฤษ)');
    expect(lines[1]).toBe('1,พระธรรมวชิรมุนี,Phra Dhammavajiramuni');
  });
});
