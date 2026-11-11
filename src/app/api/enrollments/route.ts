import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import {
  getCourseEnrollments,
  enrollStudentToCourse,
  removeStudentFromCourse,
  getStudentEnrolledCourses,
} from '@/lib/data-store';
import { requireStaffOrInstructor } from '@/lib/server-auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get('courseCode');
    const studentCode = searchParams.get('studentCode');

    if (studentCode) {
      const list = await getStudentEnrolledCourses(studentCode);
      return NextResponse.json({ success: true, count: list.length, data: list });
    }

    const list = await getCourseEnrollments(courseCode || undefined);
    return NextResponse.json({ success: true, count: list.length, data: list });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireStaffOrInstructor(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { action, courseCode, studentCode, courseName, studentName, enrollmentType, enrolledBy, notes } = body;

    if (action === 'remove' || action === 'delete') {
      if (!courseCode || !studentCode) {
        return NextResponse.json(
          { success: false, error: 'กรุณาระบุ courseCode และ studentCode' },
          { status: 400 }
        );
      }
      const ok = await removeStudentFromCourse(courseCode, studentCode);
      return NextResponse.json({
        success: ok,
        message: ok ? 'นำนิสิตออกจากห้องเรียนนี้เรียบร้อยแล้ว' : 'ไม่พบข้อมูลนิสิตในวิชานี้',
      });
    }

    // Default action: enroll student
    if (!courseCode || !studentCode) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ courseCode และ studentCode ที่ต้องการเพิ่มเข้าห้องเรียน' },
        { status: 400 }
      );
    }

    const record = await enrollStudentToCourse({
      courseCode,
      courseName,
      studentCode,
      studentName,
      enrollmentType: enrollmentType || 'เทียบโอน / เดินเรียน',
      enrolledBy: enrolledBy || 'อาจารย์ผู้สอน',
      notes: notes || '',
    });

    return NextResponse.json({
      success: true,
      message: `เพิ่มนิสิต ${record.studentName || record.studentCode} เข้าห้องเรียนสำเร็จ`,
      data: record,
    });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}
