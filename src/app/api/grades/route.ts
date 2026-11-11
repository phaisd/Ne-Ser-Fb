import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/api-error';
import { CourseGradeSheet } from '@/types';
import { readLocalJson, writeLocalJson } from '@/services/storageHelper';
import { requireStaffOrInstructor } from '@/lib/server-auth-guard';

const GRADES_FILENAME = 'course-grades.json';

function readGradesMap(): Record<string, CourseGradeSheet> {
  const parsed = readLocalJson<Record<string, CourseGradeSheet>>(GRADES_FILENAME, {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function writeGradesMap(data: Record<string, CourseGradeSheet>): void {
  writeLocalJson(GRADES_FILENAME, data);
}

export async function GET(request: Request) {
  try {
    const auth = requireStaffOrInstructor(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get('courseCode')?.trim();
    const map = readGradesMap();

    if (courseCode) {
      return NextResponse.json({
        success: true,
        data: map[courseCode] || null,
      });
    }

    return NextResponse.json({
      success: true,
      data: map,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error, 'ไม่สามารถโหลดข้อมูลใบกรอกคะแนนได้') },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireStaffOrInstructor(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { courseCode, sheet } = body as { courseCode?: string; sheet?: CourseGradeSheet };

    if (!courseCode || !sheet) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุรหัสวิชาและข้อมูลใบกรอกคะแนน' },
        { status: 400 }
      );
    }

    const map = readGradesMap();
    const updatedSheet: CourseGradeSheet = {
      ...sheet,
      courseCode,
      updatedAt: new Date().toISOString(),
    };

    map[courseCode] = updatedSheet;
    writeGradesMap(map);

    return NextResponse.json({
      success: true,
      data: updatedSheet,
      message: `บันทึกข้อมูลใบกรอกคะแนนวิชา ${courseCode} เรียบร้อยแล้ว`,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error, 'ไม่สามารถบันทึกใบกรอกคะแนนได้') },
      { status: 500 }
    );
  }
}
