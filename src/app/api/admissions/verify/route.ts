import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { readLocalJson } from '@/services/storageHelper';
import { SystemSettings } from '@/types';
import { checkRateLimit } from '@/lib/security';

interface AdmittedCandidate {
  applicationNo?: string;
  idCardOrPassport?: string;
  fullName?: string;
  [key: string]: unknown;
}

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for') || 'local';
    const clientIp = forwardedFor.split(',')[0].trim();
    const rate = checkRateLimit(`admissions-verify:${clientIp}`, 20, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `มีการตรวจสอบข้อมูลถี่เกินกำหนด กรุณารอ ${rate.retryAfterSeconds} วินาทีแล้วลองใหม่อีกครั้ง`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { applicationNo, idCardOrPassport } = body;

    const settings = await readLocalJson<Partial<SystemSettings>>('system_settings.json', {});
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

    const candidates = await readLocalJson<AdmittedCandidate[]>('admitted_candidates.json', []);
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
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}
