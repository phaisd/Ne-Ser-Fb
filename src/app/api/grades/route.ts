import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CourseGradeSheet } from '@/types';

const GRADES_FILE_PATH = path.join(process.cwd(), 'data', 'course-grades.json');

function readGradesMap(): Record<string, CourseGradeSheet> {
  try {
    if (!fs.existsSync(GRADES_FILE_PATH)) {
      return {};
    }
    const raw = fs.readFileSync(GRADES_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.error('Error reading course-grades.json:', e);
    return {};
  }
}

function writeGradesMap(data: Record<string, CourseGradeSheet>): void {
  const dir = path.dirname(GRADES_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(GRADES_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET(request: Request) {
  try {
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'ไม่สามารถโหลดข้อมูลใบกรอกคะแนนได้' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'ไม่สามารถบันทึกใบกรอกคะแนนได้' },
      { status: 500 }
    );
  }
}
