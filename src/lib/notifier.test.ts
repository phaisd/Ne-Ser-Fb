import { describe, it, expect } from 'vitest';
import {
  buildNotificationMessage,
  buildNotificationFlexMessage,
  buildAcknowledgeFlexMessage,
  sendNotification,
} from './notifier';

describe('notifier utility (LINE & Real-Time Alerts)', () => {
  it('formats rich certificate request notification text correctly', () => {
    const text = buildNotificationMessage({
      studentName: 'พระมหาทดสอบ ญาณวโร',
      studentCode: '6501501001',
      programLanguage: 'หลักสูตรภาษาไทย (Thai Program)',
      degreeLevel: 'ปริญญาตรี',
      major: 'สาขาวิชาพระพุทธศาสนา',
      certType: 'หนังสือรับรองสถานภาพนิสิต',
      requestPurpose: 'เพื่อเปิดบัญชีธนาคารและ Mobile Banking',
      phone: '081-234-5678',
      status: 'PENDING',
      actionUrl: 'https://ne-ser-fb.vercel.app/admin',
    });

    expect(text).toContain('🔔 [ระบบบริการการศึกษา คณะพุทธศาสตร์ มจร]');
    expect(text).toContain('สถานะ: 📥 มีคำร้องขอหนังสือรับรองใหม่ (รอดำเนินการ)');
    expect(text).toContain('🆔 รหัสนิสิต: 6501501001');
    expect(text).toContain('👤 ผู้ขอ: พระมหาทดสอบ ญาณวโร');
    expect(text).toContain('🌐 หลักสูตรภาษา: หลักสูตรภาษาไทย (Thai Program)');
    expect(text).toContain('🎓 ระดับ/สาขาวิชา: ปริญญาตรี - สาขาวิชาพระพุทธศาสนา');
    expect(text).toContain('📄 ส่งคำร้องเรื่อง: หนังสือรับรองสถานภาพนิสิต');
    expect(text).toContain('🎯 วัตถุประสงค์: เพื่อเปิดบัญชีธนาคารและ Mobile Banking');
    expect(text).toContain('📞 โทรศัพท์: 081-234-5678');
    expect(text).toContain('https://ne-ser-fb.vercel.app/admin');
  });

  it('formats international program certificate request notification correctly', () => {
    const text = buildNotificationMessage({
      studentName: 'VEN. ASHIN NYANIKA',
      studentCode: '6601502045',
      programLanguage: 'หลักสูตรนานาชาติ / ภาษาอังกฤษ (International Program)',
      degreeLevel: 'ปริญญาตรี',
      major: 'Buddhism (English Program)',
      certType: 'Certificate of Student Status',
      requestPurpose: 'For Visa Extension (Non-ED)',
      status: 'PENDING',
    });

    expect(text).toContain('🆔 รหัสนิสิต: 6601502045');
    expect(text).toContain('👤 ผู้ขอ: VEN. ASHIN NYANIKA');
    expect(text).toContain('🌐 หลักสูตรภาษา: หลักสูตรนานาชาติ / ภาษาอังกฤษ (International Program)');
    expect(text).toContain('📄 ส่งคำร้องเรื่อง: Certificate of Student Status');
  });

  it('formats approval notification text correctly with document number', () => {
    const text = buildNotificationMessage({
      studentName: 'พระสมหมาย สุเมโธ',
      studentCode: '6401501020',
      docNo: '012/2569',
      certType: 'หนังสือรับรองการเป็นนิสิต',
      status: 'APPROVED',
    });

    expect(text).toContain('สถานะ: ✅ อนุมัติคำร้องหนังสือรับรองเรียบร้อยแล้ว');
    expect(text).toContain('📜 เลขที่หนังสือ: อว 8002/012/2569');
  });

  it('builds valid acknowledge Flex Message card with staff and student details (กรณี ก)', () => {
    const flex = buildAcknowledgeFlexMessage({
      staffName: 'คุณ phais01Vis',
      studentName: 'พระมหาทดสอบ ญาณวโร',
      studentCode: '6501501001',
      timeBkk: '13 พ.ย. 2569, 11:19:38',
      adminUrl: 'https://ne-ser-fb.vercel.app/admin',
    });

    expect(flex.type).toBe('flex');
    expect(flex.altText).toContain('คุณ phais01Vis');
    expect(flex.altText).toContain('พระมหาทดสอบ ญาณวโร');
    const contents = flex.contents as Record<string, unknown>;
    expect(contents.type).toBe('bubble');
    expect(contents.size).toBe('mega');
    expect(JSON.stringify(contents)).toContain('เจ้าหน้าที่รับเรื่องแล้ว');
    expect(JSON.stringify(contents)).toContain('6501501001');
    expect(JSON.stringify(contents)).toContain('คุณ phais01Vis');
    expect(JSON.stringify(contents)).toContain('https://ne-ser-fb.vercel.app/admin');
  });
});
