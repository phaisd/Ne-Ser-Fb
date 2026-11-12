import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { 
  getEvents, 
  getEventRegistrations, 
  registerStudentForEvent, 
  checkInEventStudent,
  createEvent,
  updateEvent,
  deleteEvent
} from '@/services';
import {
  requireAdminOrOfficer,
  requireStaffOrInstructor,
  requireAuthenticatedUser,
  getAuthenticatedUserFromRequest,
  isServerStaffOrInstructor,
  isSelfUserIdentity,
} from '@/lib/server-auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const eventId = searchParams.get('eventId') || undefined;
    const studentCode = searchParams.get('studentCode') || undefined;

    if (action === 'registrations') {
      const auth = requireAuthenticatedUser(request);
      if (auth.response) return auth.response;

      const regs = await getEventRegistrations(eventId, studentCode);
      const visibleRegs = isServerStaffOrInstructor(auth.user)
        ? regs
        : regs.filter((r) => isSelfUserIdentity(auth.user, r.studentCode));
      return NextResponse.json({ success: true, count: visibleRegs.length, data: visibleRegs });
    }

    const events = await getEvents();
    const authUser = getAuthenticatedUserFromRequest(request);
    let regs: Awaited<ReturnType<typeof getEventRegistrations>> = [];
    if (authUser) {
      const allRegs = await getEventRegistrations(eventId, studentCode);
      regs = isServerStaffOrInstructor(authUser)
        ? allRegs
        : allRegs.filter((r) => isSelfUserIdentity(authUser, r.studentCode));
    }

    return NextResponse.json({ 
      success: true, 
      events, 
      registrations: regs 
    });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Checkin / Toggle registration status
    if (action === 'checkin') {
      const staffAuth = requireStaffOrInstructor(request);
      if (staffAuth.response) return staffAuth.response;

      const { registrationId, status } = body;
      if (!registrationId) {
        return NextResponse.json({ success: false, error: 'Missing registrationId' }, { status: 400 });
      }
      await checkInEventStudent(registrationId, status || 'ATTENDED');
      return NextResponse.json({ success: true, message: 'Check-in status updated' });
    }

    // Save Vipassana 4-Period Daily Attendance
    if (action === 'save_vipassana_attendance') {
      const staffAuth = requireStaffOrInstructor(request);
      if (staffAuth.response) return staffAuth.response;

      const { eventId, dayKey, records } = body;
      if (!eventId || !dayKey || !records || !Array.isArray(records)) {
        return NextResponse.json(
          { success: false, error: 'ข้อมูลไม่ครบถ้วน (ต้องการ eventId, dayKey, records)' },
          { status: 400 }
        );
      }
      const { saveVipassanaAttendance } = await import('@/services');
      await saveVipassanaAttendance(eventId, dayKey, records);
      return NextResponse.json({ success: true, message: 'บันทึกเวลาปฏิบัติวิปัสสนากัมมัฏฐาน 4 รอบเรียบร้อยแล้ว' });
    }

    // Batch import grouped participants into an event
    if (action === 'batch_import_registrations') {
      const staffAuth = requireStaffOrInstructor(request);
      if (staffAuth.response) return staffAuth.response;

      const { eventId, items, mode } = body;
      if (!eventId || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { success: false, error: 'กรุณาระบุกิจกรรมและรายชื่อนิสิตที่ต้องการนำเข้า' },
          { status: 400 }
        );
      }

      const { batchImportEventRegistrations } = await import('@/services');
      const result = await batchImportEventRegistrations(
        eventId,
        items,
        mode === 'REPLACE_EVENT' ? 'REPLACE_EVENT' : 'APPEND'
      );
      return NextResponse.json({
        success: true,
        data: result,
        message: `นำเข้าผู้เข้าร่วมกิจกรรมสำเร็จ ${result.importedCount} คน${
          result.skippedCount > 0 ? ` (ข้ามรายการซ้ำ/ไม่สมบูรณ์ ${result.skippedCount} รายการ)` : ''
        }`,
      });
    }

    // Create a new event
    if (action === 'create_event' || action === 'add_event') {
      const adminAuth = requireAdminOrOfficer(request);
      if (adminAuth.response) return adminAuth.response;

      const { eventData } = body;
      if (!eventData || !eventData.title) {
        return NextResponse.json({ success: false, error: 'กรุณาระบุชื่อโครงการ/กิจกรรม' }, { status: 400 });
      }
      const created = await createEvent(eventData);
      return NextResponse.json({ success: true, data: created });
    }

    // Update an event
    if (action === 'update_event') {
      const adminAuth = requireAdminOrOfficer(request);
      if (adminAuth.response) return adminAuth.response;

      const { id, updates } = body;
      if (!id) {
        return NextResponse.json({ success: false, error: 'Missing event id' }, { status: 400 });
      }
      const updated = await updateEvent(id, updates);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'ไม่พบกิจกรรมที่ต้องการแก้ไข' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated });
    }

    // Delete an event
    if (action === 'delete_event') {
      const adminAuth = requireAdminOrOfficer(request);
      if (adminAuth.response) return adminAuth.response;
      const { id } = body;
      if (!id) {
        return NextResponse.json({ success: false, error: 'Missing event id' }, { status: 400 });
      }
      const deleted = await deleteEvent(id);
      return NextResponse.json({ success: deleted });
    }

    // Default action: Register student
    const { eventId, studentCode, studentName, major, yearLevel, department, groupName, degreeLevel, programType } = body;

    if (!eventId || !studentCode || !studentName) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุกิจกรรม รหัสนิสิต และชื่อ-สกุล' },
        { status: 400 }
      );
    }

    const newReg = await registerStudentForEvent({
      eventId,
      studentCode,
      studentName,
      major: major || '',
      yearLevel: yearLevel ? parseInt(yearLevel, 10) : 1,
      department: department || '',
      groupName: groupName || 'ทั่วไป',
      degreeLevel: degreeLevel || 'ปริญญาตรี',
      programType: programType || 'THAI',
    });

    return NextResponse.json({ success: true, data: newReg });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const adminAuth = requireAdminOrOfficer(request);
    if (adminAuth.response) return adminAuth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
    }
    const success = await deleteEvent(id);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}
