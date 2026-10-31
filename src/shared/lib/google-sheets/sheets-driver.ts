import { googleSheetsService } from './service';
import {
  CertificateRequestDto,
  MeetingBookingDto,
  StudentDto,
  CourseDto,
} from '@/shared/types';

/**
 * [แนวทางที่ 3] Standalone Google Sheets Driver (Zero-DB Mode)
 * จัดการอ่านและเขียนข้อมูลตรงกับ Google Sheets API (v4) 100%
 * เมื่อกำหนด DATA_SOURCE_MODE=SHEETS ใน Environment Variables
 */
export class GoogleSheetsDriver {
  private sheetId?: string;

  constructor(sheetId?: string) {
    this.sheetId = sheetId || process.env.GOOGLE_SPREADSHEET_ID;
  }

  // 1. Certificate Requests Direct Driver
  async listCertificateRequests(): Promise<CertificateRequestDto[]> {
    const rows = await googleSheetsService.readSheet(this.sheetId, 'Certificate_Requests');
    if (!rows || rows.length <= 1) return [];

    return rows.slice(1).map((r, idx) => ({
      id: r[0] || `req-sheet-${idx + 1}`,
      tenantId: r[1] || 'default-tenant',
      userId: 'sheet-user-01',
      certificateTypeId: 'ct-01',
      certificateTypeName: r[4] || 'หนังสือรับรอง',
      studentCode: r[2] || '',
      requesterName: r[3] || '',
      status: r[5] || 'PENDING',
      note: r[6] || '',
      issuedDocumentUrl: `/certificates/${r[0]}`,
      createdAt: r[7] ? new Date(r[7]) : new Date(),
      updatedAt: r[7] ? new Date(r[7]) : new Date(),
    }));
  }

  async appendCertificateRequest(req: CertificateRequestDto): Promise<boolean> {
    const row = [
      req.id,
      req.tenantId,
      req.studentCode || '',
      req.requesterName || '',
      req.certificateTypeName || '',
      req.status,
      req.note || '',
      req.createdAt.toISOString(),
    ];
    const res = await googleSheetsService.appendRow(this.sheetId, 'Certificate_Requests', row);
    return res.success;
  }

  // 2. Meeting Bookings Direct Driver
  async listMeetingBookings(): Promise<MeetingBookingDto[]> {
    const rows = await googleSheetsService.readSheet(this.sheetId, 'Meeting_Bookings_Log');
    if (!rows || rows.length <= 1) return [];

    return rows.slice(1).map((r, idx) => ({
      id: r[0] || `bk-sheet-${idx + 1}`,
      tenantId: r[1] || 'default-tenant',
      roomId: 'r-01',
      roomName: r[2] || 'ห้องประชุม',
      requesterId: 'staff-01',
      requesterName: r[3] || '',
      title: r[4] || '',
      startTime: r[5] ? new Date(r[5]) : new Date(),
      endTime: r[6] ? new Date(r[6]) : new Date(),
      status: r[7] || 'APPROVED',
      createdAt: new Date(),
    }));
  }

  async appendMeetingBooking(bk: MeetingBookingDto): Promise<boolean> {
    const row = [
      bk.id,
      bk.tenantId,
      bk.roomName || '',
      bk.requesterName || '',
      bk.title,
      bk.startTime.toISOString(),
      bk.endTime.toISOString(),
      bk.status,
    ];
    const res = await googleSheetsService.appendRow(this.sheetId, 'Meeting_Bookings_Log', row);
    return res.success;
  }

  // 3. Students Direct Driver
  async listStudents(): Promise<StudentDto[]> {
    const rows = await googleSheetsService.readSheet(this.sheetId, 'Students_Master');
    if (!rows || rows.length <= 1) return [];

    return rows.slice(1).map((r, idx) => ({
      id: `s-sheet-${idx + 1}`,
      tenantId: 'default-tenant',
      studentCode: r[0] || '',
      title: r[1] || 'นาย',
      firstName: r[2] || '',
      lastName: r[3] || '',
      yearLevel: parseInt(r[4], 10) || 1,
      degree: r[5] || 'ปริญญาตรี',
      faculty: r[6] || 'คณะพุทธศาสตร์',
      department: r[7] || '',
      major: r[8] || '',
      studyStatus: r[9] || 'ปกติ',
      email: r[10] || '',
      phoneNumber: r[11] || '',
      isActive: true,
    }));
  }
}

export const googleSheetsDriver = new GoogleSheetsDriver();
