import { NextResponse } from 'next/server';
import { readLocalJson } from '@/services/storageHelper';
import { SystemSettings } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicationNo, idCardOrPassport } = body;

    const settings = await readLocalJson<SystemSettings>('system_settings.json', {} as any);
    const isOpen = settings.admissionPeriodOpen !== false;

    if (!isOpen) {
      return NextResponse.json(
        {
          success: false,
          isOpen: false,
          error: 'ขณะนี้อยู่นอกช่วงเวลาการยื่นขอหนังสือรับรองสำหรับผู้ผ่านการคัดเลือก (ปิดระบบรับคำร้อง)',
          admissionPeriodDates: settings.admissionPeriodDates || '',
        },
        { status: 403 }
      );
    }

    if (!applicationNo || !idCardOrPassport) {
      return NextResponse.json(
        {
          success: false,
          error: 'กรุณากรอกเลขที่ใบสมัคร และเลขประจำตัวประชาชนหรือเลขหนังสือเดินทางให้ครบถ้วน',
        },
        { status: 400 }
      );
    }

    const cleanAppNo = applicationNo.trim().toUpperCase();
    const cleanId = idCardOrPassport.trim().toUpperCase();

    const candidates = await readLocalJson<any[]>('admitted_candidates.json', []);
    const match = candidates.find((c) => {
      const matchApp = c.applicationNo?.trim().toUpperCase() === cleanAppNo;
      const matchId = c.idCardOrPassport?.trim().toUpperCase() === cleanId;
      return matchApp && matchId;
    });

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่พบข้อมูลผู้ผ่านการคัดเลือก หรือข้อมูลระบุตัวตนไม่ตรงกัน กรุณาตรวจสอบเลขที่ใบสมัครและเลขบัตรประชาชน/หนังสือเดินทาง หรือติดต่อเจ้าหน้าที่งานทะเบียน คณะพุทธศาสตร์',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      isOpen: true,
      data: match,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
