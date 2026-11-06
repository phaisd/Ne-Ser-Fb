import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/google-sheets';
import { getSystemSettings, updateSystemSettings, convertGoogleDriveUrl } from '@/lib/data-store';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const client = getSheetsClient();
  const configured = !!client;

  if (!configured) {
    return NextResponse.json({
      configured: false,
      message: 'ยังไม่ได้ตั้งค่า Google Sheets API ใน .env.local',
      envStatus: {
        GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID,
        GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
      },
    });
  }

  try {
    const meta = await client.testConnection();
    return NextResponse.json({
      configured: true,
      connected: true,
      spreadsheetTitle: meta.title,
      sheets: meta.sheets,
    });
  } catch (err: any) {
    return NextResponse.json({
      configured: true,
      connected: false,
      error: err.message,
    });
  }
}

export async function POST(request: Request) {
  const client = getSheetsClient();
  if (!client) {
    return NextResponse.json(
      { success: false, error: 'Google Sheets ยังไม่ได้กำหนดค่าใน .env.local' },
      { status: 400 }
    );
  }

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    // Action 1: Pull Settings from Google Sheets (Settings tab)
    if (body.action === 'pull-settings' || body.action === 'pull') {
      const rows = await client.getValues('Settings!A2:C20');
      if (!rows || rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'ไม่พบข้อมูลในแท็บ Settings (ตรวจสอบว่ามีแท็บ Settings ใน Google Sheets)',
        }, { status: 404 });
      }

      const updates: any = {};
      for (const row of rows) {
        const key = row[0]?.trim();
        let val = (row[1] || '').trim();
        if (!key) continue;

        if (key === 'logoUrl' && val) {
          val = convertGoogleDriveUrl(val);
        }
        updates[key] = val;
      }

      const updated = await updateSystemSettings(updates);
      return NextResponse.json({
        success: true,
        data: updated,
        message: 'ดึงการตั้งค่าและโลโก้จากแท็บ Settings ใน Google Sheets เรียบร้อยแล้ว!',
      });
    }

    // Action 1.5: Ensure and Initialize Students_Archive Tab
    if (body.action === 'init-archive' || body.action === 'ensure-archive') {
      await client.ensureSheetsExist(['Students_Archive']);
      const archiveRows = await client.getValues('Students_Archive!A1:A2');
      if (!archiveRows || archiveRows.length === 0 || !archiveRows[0] || archiveRows[0].length === 0) {
        await client.updateValues('Students_Archive!A1:R1', [[
          'รหัสนิสิต',
          'คำนำหน้า',
          'ชื่อ',
          'นามสกุล',
          'ชื่อ-นามสกุล',
          'ชั้นปี',
          'ระดับการศึกษา',
          'ภาควิชา',
          'สาขาวิชา',
          'สถานภาพเดิม',
          'คณะ',
          'เบอร์โทรศัพท์',
          'อีเมล',
          'หลักสูตร',
          'หมายเหตุเดิม',
          'วัน-เวลาที่ย้ายเข้าแฟ้มประวัติ (Deleted At)',
          'ผู้ดำเนินการลบ (Deleted By)',
          'เหตุผลการลบ (Reason)',
        ]]);
      }
      return NextResponse.json({
        success: true,
        message: 'สร้างและตั้งค่าหัวตารางแท็บ Students_Archive บน Google Sheets เรียบร้อยแล้ว!',
      });
    }

    // Action 2: Standard Initial Export to Google Sheets
    const requiredTabs = [
      'Students',
      'Students_Archive',
      'Courses',
      'Timetables',
      'CertificateRequests',
      'Attendance',
      'Instructors',
      'Settings',
      'Events',
      'EventRegistrations',
    ];
    await client.ensureSheetsExist(requiredTabs);

    const dataDir = path.join(process.cwd(), 'data');

    // Helper to read CSV lines
    const readCsvRows = (filename: string): string[][] => {
      const p = path.join(dataDir, filename);
      if (!fs.existsSync(p)) return [];
      const content = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
      return content
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          return line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
        });
    };

    const studentsRows = readCsvRows('students.csv');
    if (studentsRows.length > 0) {
      await client.updateValues('Students!A1', studentsRows);
    }

    const coursesRows = readCsvRows('courses.csv');
    if (coursesRows.length > 0) {
      await client.updateValues('Courses!A1', coursesRows);
    }

    const timetablesRows = readCsvRows('timetables.csv');
    if (timetablesRows.length > 0) {
      await client.updateValues('Timetables!A1', timetablesRows);
    }

    const certRows = readCsvRows('certificate_requests.csv');
    if (certRows.length > 0) {
      await client.updateValues('CertificateRequests!A1', certRows);
    }

    const attRows = readCsvRows('attendance_records.csv');
    if (attRows.length > 0) {
      await client.updateValues('Attendance!A1', attRows);
    }

    const instRows = readCsvRows('instructors.csv');
    if (instRows.length > 0) {
      await client.updateValues('Instructors!A1', instRows);
    }

    const eventsRows = readCsvRows('events.csv');
    if (eventsRows.length > 0) {
      await client.updateValues('Events!A1', eventsRows);
    }

    const eventRegRows = readCsvRows('event_registrations.csv');
    if (eventRegRows.length > 0) {
      await client.updateValues('EventRegistrations!A1', eventRegRows);
    }

    // Export System Settings & Logo to 'Settings' tab
    const currentSettings = await getSystemSettings();
    const settingsRows: string[][] = [
      ['Key (ชื่อตัวแปร)', 'Value (ค่าที่กำหนด)', 'Description (คำอธิบาย)'],
      ['logoUrl', currentSettings.logoUrl || '', 'URL รูปภาพโลโก้ หรือ ลิงก์แชร์จาก Google Drive'],
      ['logoEmoji', currentSettings.logoEmoji || '☸️', 'Emoji สัญลักษณ์สำรอง'],
      ['universityNameTh', currentSettings.universityNameTh || '', 'ชื่อมหาวิทยาลัย (ภาษาไทย)'],
      ['universityNameEn', currentSettings.universityNameEn || '', 'ชื่อมหาวิทยาลัย (ภาษาอังกฤษ)'],
      ['facultyNameTh', currentSettings.facultyNameTh || '', 'ชื่อคณะ (ภาษาไทย)'],
      ['facultyNameEn', currentSettings.facultyNameEn || '', 'ชื่อคณะ (ภาษาอังกฤษ)'],
      ['signerNameTh', currentSettings.signerNameTh || '', 'ชื่อคณบดี/ผู้ลงนาม (ภาษาไทย)'],
      ['signerTitleTh', currentSettings.signerTitleTh || '', 'ตำแหน่งผู้ลงนาม (ภาษาไทย)'],
      ['signerNameEn', currentSettings.signerNameEn || '', 'ชื่อคณบดี/ผู้ลงนาม (ภาษาอังกฤษ)'],
      ['signerTitleEn', currentSettings.signerTitleEn || '', 'ตำแหน่งผู้ลงนาม (ภาษาอังกฤษ)'],
      ['contactPhone', currentSettings.contactPhone || '', 'เบอร์โทรศัพท์ติดต่อ'],
      ['contactEmail', currentSettings.contactEmail || '', 'อีเมลติดต่อสถาบัน'],
      ['announcementText', currentSettings.announcementText || '', 'ข้อความประกาศต้อนรับ'],
    ];
    await client.updateValues('Settings!A1', settingsRows);

    return NextResponse.json({
      success: true,
      message: 'ซิงค์ข้อมูลเริ่มต้นทั้งหมดรวมแท็บ Settings เข้าสู่ Google Sheets สำเร็จเรียบร้อยแล้ว!',
      syncedTabs: [
        'Students',
        'Courses',
        'Timetables',
        'CertificateRequests',
        'Attendance',
        'Instructors',
        'Settings',
        'Events',
        'EventRegistrations',
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
