import { NextResponse } from 'next/server';
import { apiErrorResponse, getErrorMessage } from '@/lib/api-error';
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  Course,
  importCoursesBatch,
  cloneCoursesTerm,
} from '@/lib/data-store';
import { requireAdminOrOfficer } from '@/lib/server-auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const program = searchParams.get('program'); // THAI | ENGLISH | ALL
    const degree = searchParams.get('degree'); // ปริญญาตรี | ปริญญาโท | etc.
    const yearLevel = searchParams.get('yearLevel');
    const semester = searchParams.get('semester');
    const academicYear = searchParams.get('academicYear');
    const instructor = searchParams.get('instructor')?.toLowerCase() || '';

    let list = await getCourses();

    if (query) {
      list = list.filter(
        (c) =>
          c.courseCode?.toLowerCase().includes(query) ||
          c.courseName?.toLowerCase().includes(query) ||
          c.courseNameEn?.toLowerCase().includes(query) ||
          c.room?.toLowerCase().includes(query) ||
          c.instructor?.toLowerCase().includes(query) ||
          c.major?.toLowerCase().includes(query)
      );
    }

    if (program && program !== 'ALL') {
      list = list.filter((c) => c.programType === program);
    }

    if (degree && degree !== 'ALL') {
      list = list.filter((c) => c.degreeLevel === degree);
    }

    if (yearLevel && yearLevel !== 'ALL') {
      const y = parseInt(yearLevel, 10);
      list = list.filter((c) => c.yearLevel === y);
    }

    if (semester && semester !== 'ALL') {
      const s = parseInt(semester, 10);
      list = list.filter((c) => c.semester === s);
    }

    if (academicYear && academicYear !== 'ALL') {
      list = list.filter((c) => c.academicYear === academicYear);
    }

    if (instructor) {
      list = list.filter((c) => c.instructor?.toLowerCase().includes(instructor));
    }

    return NextResponse.json({ success: true, count: list.length, data: list });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdminOrOfficer(request);
    if (auth.response) return auth.response;

    const body = await request.json();

    // Handle Clone Term (Copy historical courses to a new academic year/semester cleanly)
    if (body.action === 'clone-term') {
      const { sourceAcademicYear, sourceSemester, targetAcademicYear, targetSemester, keepInstructors } = body;
      if (!sourceAcademicYear || !targetAcademicYear) {
        return NextResponse.json(
          { success: false, error: 'กรุณาระบุปีการศึกษาต้นทางและปีการศึกษาปลายทาง' },
          { status: 400 },
        );
      }
      const res = await cloneCoursesTerm({
        sourceAcademicYear: String(sourceAcademicYear),
        sourceSemester: Number(sourceSemester) || 1,
        targetAcademicYear: String(targetAcademicYear),
        targetSemester: Number(targetSemester) || 1,
        keepInstructors: keepInstructors !== false,
        clonedBy: auth.user.name,
      });
      return NextResponse.json({
        success: true,
        ...res,
        message: `คัดลอกรายวิชาจาก ${sourceSemester || 1}/${sourceAcademicYear} ไปยัง ${targetSemester || 1}/${targetAcademicYear} สำเร็จ (${res.cloned} วิชา, ข้ามวิชาที่มีอยู่แล้ว ${res.skipped} วิชา)`,
      });
    }

    // Handle Bulk Import
    if (body.action === 'import' || Array.isArray(body.courses)) {
      const coursesList = Array.isArray(body.courses) ? body.courses : [];
      if (coursesList.length === 0) {
        return NextResponse.json({ success: false, error: 'ไม่พบรายการวิชาที่ต้องการนำเข้า' }, { status: 400 });
      }
      const mode = body.mode === 'APPEND' ? 'APPEND' : 'UPSERT';
      const result = await importCoursesBatch(coursesList, mode);
      return NextResponse.json({
        success: true,
        ...result,
        message: `นำเข้าสำเร็จ: เพิ่ม ${result.added} รายการ, อัปเดต ${result.updated} รายการ`,
      });
    }

    if (!body.courseCode || !body.courseName) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุรหัสวิชา (courseCode) และชื่อรายวิชา (courseName)' },
        { status: 400 }
      );
    }

    const payload: Omit<Course, 'id' | 'createdAt' | 'updatedAt'> = {
      courseCode: String(body.courseCode).trim(),
      courseName: String(body.courseName).trim(),
      courseNameEn: body.courseNameEn ? String(body.courseNameEn).trim() : '',
      credits: Number(body.credits) || 3,
      programType: body.programType === 'ENGLISH' ? 'ENGLISH' : 'THAI',
      degreeLevel: body.degreeLevel || 'ปริญญาตรี',
      faculty: body.faculty || 'คณะพุทธศาสตร์',
      department: body.department || '',
      major: body.major || 'พระพุทธศาสนา',
      yearLevel: body.yearLevel ? Number(body.yearLevel) : 1,
      section: body.section || (body.programType === 'ENGLISH' ? 'EN' : '1'),
      academicYear: body.academicYear || '2569',
      semester: body.semester ? Number(body.semester) : 1,
      term: body.term || `${body.semester || 1}/${body.academicYear || '2569'}`,
      room: body.room || '',
      dayOfWeek: body.dayOfWeek ? Number(body.dayOfWeek) : 1,
      startTime: body.startTime || '09.00',
      endTime: body.endTime || '11.30',
      instructor: body.instructor || '',
      description: body.description || '',
      status: 'ACTIVE',
    };

    const created = await createCourse(payload);
    return NextResponse.json({ success: true, data: created });
  } catch (err: unknown) {
    console.error('POST error in /api/courses:', err);
    return NextResponse.json({ success: false, error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = requireAdminOrOfficer(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const idOrCode = body.id || body.courseCode;

    if (!idOrCode && !body.courseCode) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ id หรือรหัสวิชา (courseCode)' },
        { status: 400 }
      );
    }

    const rawUpdates = body.updates && typeof body.updates === 'object' ? { ...body.updates } : { ...body };
    const { id: _ignoredId, reason: _ignoredReason, ...updates } = rawUpdates as Record<string, unknown> & {
      courseCode?: string;
      section?: string;
    };
    const changeReason = typeof body.reason === 'string' ? body.reason : undefined;

    if (body.courseCode && !updates.courseCode) {
      updates.courseCode = body.courseCode;
    }
    if (body.section && !updates.section) {
      updates.section = body.section;
    }

    const updated = await updateCourse(idOrCode, updates, {
      changedBy: auth.user.name,
      reason: changeReason,
    });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'ไม่พบรายวิชาที่ต้องการแก้ไข' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = requireAdminOrOfficer(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const idOrCode = searchParams.get('id') || searchParams.get('courseCode');

    if (!idOrCode) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ id หรือ courseCode ที่ต้องการลบ' },
        { status: 400 }
      );
    }

    const ok = await deleteCourse(idOrCode);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'ไม่พบรายวิชาที่ต้องการลบ' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'ลบรายวิชาสำเร็จ' });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}
