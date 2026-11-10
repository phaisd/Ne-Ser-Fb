import { describe, it, expect } from 'vitest';
import { translations } from './translations';

describe('translations (i18n Bilingual Localization)', () => {
  it('has identical keys in both Thai and English translation dictionaries', () => {
    const thKeys = Object.keys(translations.th).sort();
    const enKeys = Object.keys(translations.en).sort();

    expect(thKeys).toEqual(enKeys);
  });

  it('contains certificate portal translation keys in both languages', () => {
    expect(translations.th.certPortalTitle).toBe('ระบบหนังสือรับรองและคำร้อง (Certificates Portal)');
    expect(translations.en.certPortalTitle).toBe('Certificates & Requests Portal');

    expect(translations.th.certTabRequest).toBe('แบบฟอร์มยื่นคำร้อง');
    expect(translations.en.certTabRequest).toBe('Request Form');

    expect(translations.th.certFilterInter).toBe('นิสิตต่างชาติ');
    expect(translations.en.certFilterInter).toBe('International Students');
  });

  it('contains attendance translation keys in both languages', () => {
    expect(translations.th.attTitle).toBe('ระบบบันทึกเวลาเรียนและประเมินผล (Smart Attendance)');
    expect(translations.en.attTitle).toBe('Smart Attendance & Evaluation System');

    expect(translations.th.attTabRollCall).toBe('บันทึกเวลาเรียน');
    expect(translations.en.attTabRollCall).toBe('Roll Call');

    expect(translations.th.attFilterInter).toBe('ภาคอินเตอร์');
    expect(translations.en.attFilterInter).toBe('International (English)');
  });
});
