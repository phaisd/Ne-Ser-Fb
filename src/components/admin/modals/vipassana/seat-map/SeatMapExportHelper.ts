import type { StudentEvent, EventRegistration, EventSeatingConfig } from '@/types/event';
import { detectParticipantStatus } from '@/services/events/seatingUtils';
import { downloadXlsx, type XlsxSheet } from '@/lib/utils/xlsx-export';

export function formatVasaCell(v?: number | string | null): string {
  if (v === undefined || v === null || v === '') return '';
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  if (isNaN(n) || n <= 0) return '';
  return String(n);
}

export function exportSeatingXlsx(
  event: StudentEvent,
  config: EventSeatingConfig,
  registrations: EventRegistration[]
): void {
  const isStudentId = (v?: string) => !!v && /^\d{8,12}$/.test(v.replace(/[\s\u00A0]+/g, ''));
  const isShortGroupCode = (v?: string) =>
    !!v && /^[A-Za-z0-9_-]{2,10}$/.test(v.trim()) && !isStudentId(v);

  const rows = registrations.map((r, idx) => {
    const st = detectParticipantStatus(r.studentName, r.role);
    const isCheckedIn = !!r.seatCheckinAt;

    let expStudentCode = r.studentCode || '';
    let expGroupCode = r.groupSpecificCode || '';

    // Auto-correct if studentCode was historically stored as group code
    if (isShortGroupCode(expStudentCode) && !expGroupCode) {
      expGroupCode = expStudentCode;
      expStudentCode = '';
    } else if (isShortGroupCode(expStudentCode) && isStudentId(expGroupCode)) {
      const tmp = expStudentCode;
      expStudentCode = expGroupCode;
      expGroupCode = tmp;
    }

    return [
      idx + 1,
      expStudentCode,
      expGroupCode,
      r.studentName,
      st.label,
      r.programType || 'THAI',
      r.degreeLevel || 'ปริญญาตรี',
      r.major || '',
      r.groupNumber || '',
      formatVasaCell(r.vasa),
      r.seatNumber || '',
      r.seatZone || '',
      isCheckedIn ? 'เช็คอินแล้ว' : 'ยังไม่เข้าที่นั่ง',
      r.seatCheckinAt ? new Date(r.seatCheckinAt).toLocaleString('th-TH') : '-',
      r.seatCheckinBy || '-',
    ];
  });

  const sheet: XlsxSheet = {
    name: 'ผังที่นั่งและตรวจเช็ค',
    title: `ผังที่นั่ง & รายงานตรวจเช็คผู้เข้าที่นั่ง: ${event.title}`,
    subtitle: `สถานที่: ${config.venueName || event.location || 'คณะพุทธศาสตร์'} • วันที่ส่งออก: ${new Date().toLocaleDateString('th-TH')} • พรรษาระบุเฉพาะพระภิกษุ (สามเณร/แม่ชี/ฆราวาสเว้นว่าง)`,
    headers: [
      'ลำดับ',
      'รหัสนิสิต',
      'เลขเฉพาะกลุ่ม',
      'ชื่อ-ฉายา/สกุล',
      'สถานภาพ/เพศ',
      'หลักสูตรภาษา',
      'ระดับการศึกษา',
      'สาขาวิชา',
      'กลุ่มที่',
      'พรรษา',
      'หมายเลขที่นั่ง (Seat No.)',
      'โซนที่นั่ง (Zone)',
      'สถานะตรวจเช็คเข้าที่นั่ง',
      'วันเวลาที่เช็คอิน',
      'ผู้ตรวจเช็ค',
    ],
    rows,
    columnWidths: [8, 16, 14, 28, 16, 14, 16, 24, 10, 12, 22, 20, 22, 22, 20],
  };

  downloadXlsx(
    `ผังที่นั่งและตรวจเช็ค_${event.title.replace(/[\/\\:*?"<>|]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    [sheet]
  );
}

export function exportSeatingCsv(
  event: StudentEvent,
  registrations: EventRegistration[]
): void {
  const isStudentId = (v?: string) => !!v && /^\d{8,12}$/.test(v.replace(/[\s\u00A0]+/g, ''));
  const isShortGroupCode = (v?: string) =>
    !!v && /^[A-Za-z0-9_-]{2,10}$/.test(v.trim()) && !isStudentId(v);

  const headers = [
    'ลำดับ',
    'รหัสนิสิต',
    'เลขเฉพาะกลุ่ม',
    'ชื่อ-ฉายา/สกุล',
    'สถานภาพ/เพศ',
    'หลักสูตรภาษา',
    'ระดับการศึกษา',
    'สาขาวิชา',
    'กลุ่มที่',
    'พรรษา',
    'หมายเลขที่นั่ง (Seat No.)',
    'โซนที่นั่ง (Zone)',
    'สถานะตรวจเช็คเข้าที่นั่ง',
    'วันเวลาที่เช็คอิน',
    'ผู้ตรวจเช็ค',
  ];

  const lines = [headers.join(',')];
  registrations.forEach((r, idx) => {
    const st = detectParticipantStatus(r.studentName, r.role);
    const isCheckedIn = !!r.seatCheckinAt;

    let expStudentCode = r.studentCode || '';
    let expGroupCode = r.groupSpecificCode || '';

    if (isShortGroupCode(expStudentCode) && !expGroupCode) {
      expGroupCode = expStudentCode;
      expStudentCode = '';
    } else if (isShortGroupCode(expStudentCode) && isStudentId(expGroupCode)) {
      const tmp = expStudentCode;
      expStudentCode = expGroupCode;
      expGroupCode = tmp;
    }

    const row = [
      idx + 1,
      `"${expStudentCode}"`,
      `"${expGroupCode}"`,
      `"${r.studentName}"`,
      `"${st.label}"`,
      `"${r.programType || 'THAI'}"`,
      `"${r.degreeLevel || 'ปริญญาตรี'}"`,
      `"${r.major || ''}"`,
      `"${r.groupNumber || ''}"`,
      `"${formatVasaCell(r.vasa)}"`,
      `"${r.seatNumber || ''}"`,
      `"${r.seatZone || ''}"`,
      `"${isCheckedIn ? 'เช็คอินแล้ว' : 'ยังไม่เข้าที่นั่ง'}"`,
      `"${r.seatCheckinAt ? new Date(r.seatCheckinAt).toLocaleString('th-TH') : '-'}"`,
      `"${r.seatCheckinBy || '-'}"`,
    ];
    lines.push(row.join(','));
  });

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ผังที่นั่งและตรวจเช็ค_${event.title.replace(/[\/\\:*?"<>|]/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBlankTemplate(): void {
  const sampleRows = [
    [1, '6701501001', 'T101', 'พระมหาสมชาย กิตฺติโสภโณ', 'พระภิกษุ', 'THAI', 'ปริญญาตรี', 'พระพุทธศาสนา', 1, 25, 'A-01', 'โซน 1', 'เช็คอินแล้ว', '20/11/2569 08:30:00', 'จนท.สมชาย'],
    [2, '6701501002', 'T102', 'สามเณรธีรภัทร สุขใจ', 'สามเณร', 'THAI', 'ปริญญาตรี', 'พระพุทธศาสนา', 1, '', 'A-02', 'โซน 1', 'ยังไม่เข้าที่นั่ง', '-', '-'],
    [3, '6701501003', 'T103', 'แม่ชีวิมล บุญประเสริฐ', 'แม่ชี', 'THAI', 'ปริญญาตรี', 'พระพุทธศาสนา', 2, '', 'B-01', 'โซน 1', 'ยังไม่เข้าที่นั่ง', '-', '-'],
    [4, '6701501004', 'T104', 'นายก้องภพ ใจดี', 'คฤหัสถ์ชาย', 'THAI', 'ปริญญาตรี', 'ปรัชญา', 2, '', 'B-02', 'โซน 1', 'เช็คอินแล้ว', '20/11/2569 08:32:15', 'จนท.สมชาย'],
    [5, '6701501005', 'T105', 'นางสาวพรทิพย์ สดใส', 'คฤหัสถ์หญิง', 'THAI', 'ปริญญาตรี', 'ปรัชญา', 3, '', 'C-01', 'โซน 1', 'ยังไม่เข้าที่นั่ง', '-', '-'],
    [6, '6701501006', 'I301', 'Ven. Dhammapalo', 'พระภิกษุ', 'ENGLISH', 'ปริญญาตรี', 'Buddhism', 12, 10, 'A-03', 'โซน 1', 'เช็คอินแล้ว', '20/11/2569 08:35:00', 'จนท.สมชาย'],
  ];

  const sheet: XlsxSheet = {
    name: 'ตัวอย่างผังที่นั่ง',
    title: 'แบบฟอร์มตัวอย่างผังที่นั่ง (นำเข้าที่นั่งด้วย Excel)',
    subtitle: 'คำแนะนำ: รหัสนิสิต หรือ เลขเฉพาะกลุ่ม อย่างใดอย่างหนึ่ง + หมายเลขที่นั่ง (Seat No.) จำเป็นต้องระบุเพื่อจัดที่นั่ง',
    headers: [
      'ลำดับ',
      'รหัสนิสิต',
      'เลขเฉพาะกลุ่ม',
      'ชื่อ-ฉายา/สกุล',
      'สถานภาพ/เพศ',
      'หลักสูตรภาษา',
      'ระดับการศึกษา',
      'สาขาวิชา',
      'กลุ่มที่',
      'พรรษา',
      'หมายเลขที่นั่ง (Seat No.)',
      'โซนที่นั่ง (Zone)',
      'สถานะตรวจเช็คเข้าที่นั่ง',
      'วันเวลาที่เช็คอิน',
      'ผู้ตรวจเช็ค',
    ],
    rows: sampleRows,
    columnWidths: [8, 16, 14, 28, 16, 14, 16, 24, 10, 12, 22, 20, 22, 22, 20],
  };

  downloadXlsx('แบบฟอร์มนำเข้าผังที่นั่ง_Template.xlsx', [sheet]);
}
