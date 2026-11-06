import { NextResponse } from 'next/server';
import {
  getInstructorAccounts,
  scanTimetableInstructors,
  batchProvisionInstructors,
  updateUserRole,
  resetUserPassword,
  createUserAccount,
  updateUserProfile,
  toggleUserSuspension,
  archiveInstructors,
  getArchivedInstructors,
  restoreInstructor,
  deleteInstructorPermanent,
} from '@/lib/data-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const query = searchParams.get('q')?.toLowerCase() || '';
    const archived = searchParams.get('archived') === 'true';

    if (archived) {
      const archivedList = await getArchivedInstructors();
      const safeArchived = archivedList.map(({ password, ...safe }) => safe);
      return NextResponse.json({ success: true, count: safeArchived.length, data: safeArchived });
    }

    let accounts = await getInstructorAccounts();

    if (role && role !== 'ALL') {
      accounts = accounts.filter((a) => a.role === role);
    }

    if (query) {
      accounts = accounts.filter(
        (a) =>
          a.name?.toLowerCase().includes(query) ||
          a.email?.toLowerCase().includes(query) ||
          a.gmail?.toLowerCase().includes(query) ||
          a.department?.toLowerCase().includes(query)
      );
    }

    // Hide password hashes, return safe objects
    const safeAccounts = accounts.map(({ password, ...safe }) => safe);
    return NextResponse.json({ success: true, count: safeAccounts.length, data: safeAccounts });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId, newRole, newPassword, userData, updates, isSuspended, reason } = body;

    // 1. Update Profile (Name, Email, Gmail, Department, Role)
    if (action === 'update-profile' || action === 'update-email') {
      const targetId = userId || updates?.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'กรุณาระบุ userId ที่ต้องการแก้ไข' }, { status: 400 });
      }

      const updated = await updateUserProfile(targetId, updates || body);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'ไม่พบผู้ใช้ที่ระบุ' }, { status: 404 });
      }

      const { password, ...safe } = updated;
      return NextResponse.json({ success: true, data: safe, message: 'แก้ไขข้อมูลอีเมลและผู้ใช้งานสำเร็จ' });
    }

    // 2. Suspend / Activate User Account
    if (action === 'toggle-suspend' || action === 'suspend-user') {
      if (!userId) {
        return NextResponse.json({ success: false, error: 'กรุณาระบุ userId' }, { status: 400 });
      }
      const shouldSuspend = isSuspended !== undefined ? Boolean(isSuspended) : true;
      const result = await toggleUserSuspension(userId, shouldSuspend, reason);

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: result.message, user: result.user });
    }

    // 3. Update Role
    if (action === 'update-role') {
      if (!userId || !newRole) {
        return NextResponse.json({ success: false, error: 'กรุณาระบุ userId และ newRole' }, { status: 400 });
      }
      const ok = await updateUserRole(userId, newRole);
      return NextResponse.json({ success: ok, message: ok ? 'เปลี่ยนบทบาทผู้ใช้สำเร็จ' : 'ไม่พบผู้ใช้' });
    }

    // 4. Reset Password
    if (action === 'reset-password') {
      if (!userId) {
        return NextResponse.json({ success: false, error: 'กรุณาระบุ userId' }, { status: 400 });
      }
      const ok = await resetUserPassword(userId, newPassword || 'mcu123456');
      return NextResponse.json({ success: ok, message: ok ? 'รีเซ็ตรหัสผ่านสำเร็จ (รหัสเริ่มต้น: mcu123456)' : 'ไม่พบผู้ใช้' });
    }

    // 5. Create New User
    if (action === 'create-user' || userData) {
      const dataToCreate = userData || body;
      const created = await createUserAccount(dataToCreate);
      const { password, ...safe } = created;
      return NextResponse.json({ success: true, data: safe, message: 'สร้างบัญชีผู้ใช้ใหม่เรียบร้อยแล้ว' });
    }

    // 6. Scan Timetable Instructors for Auto-Provisioning
    if (action === 'scan-timetables') {
      const scanResult = await scanTimetableInstructors();
      return NextResponse.json({ success: true, ...scanResult });
    }

    // 7. Batch Provision Instructors
    if (action === 'batch-provision-instructors') {
      const { candidates, links } = body;
      const result = await batchProvisionInstructors(candidates || [], links || []);
      return NextResponse.json({
        success: true,
        message: `สร้างบัญชีอาจารย์ใหม่สำเร็จ ${result.createdCount} ท่าน และผูกชื่อเข้ากับบัญชีเดิม ${result.linkedCount} รายการ`,
        ...result,
      });
    }

    // 8. Archive Instructor (ย้ายเข้าแฟ้มประวัติ เกษียณ/ลาออก/จำหน่าย)
    if (action === 'archive-user' || action === 'delete-user') {
      const ids: string[] = Array.isArray(body.userIds)
        ? body.userIds
        : userId
        ? [userId]
        : [];

      if (ids.length === 0) {
        return NextResponse.json({ success: false, error: 'กรุณาระบุรหัสผู้ใช้งานที่ต้องการย้ายเข้าแฟ้มประวัติ' }, { status: 400 });
      }

      const archiveReason = reason || body.archiveReason || 'เกษียณอายุ/ลาออก/จำหน่ายออกจากระบบ';
      const archivedBy = body.archivedBy || 'ผู้ดูแลระบบ (Admin)';
      const result = await archiveInstructors(ids, archiveReason, archivedBy);

      return NextResponse.json({
        success: result.archivedCount > 0,
        message: result.message,
        ...result,
      });
    }

    // 9. Restore Instructor (กู้คืนบัญชีอาจารย์จากแฟ้มประวัติ)
    if (action === 'restore-user') {
      const targetId = userId || body.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'กรุณาระบุรหัสอาจารย์ที่ต้องการกู้คืน' }, { status: 400 });
      }

      const restored = await restoreInstructor(targetId);
      if (!restored) {
        return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลอาจารย์ในแฟ้มประวัติ' }, { status: 404 });
      }

      const { password, ...safe } = restored;
      return NextResponse.json({
        success: true,
        data: safe,
        message: `กู้คืนบัญชี ${restored.name} กลับสู่ระบบผู้ใช้งานปกติเรียบร้อยแล้ว`,
      });
    }

    // 10. Permanent Delete from Archive
    if (action === 'permanent-delete') {
      const targetId = userId || body.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'กรุณาระบุรหัสอาจารย์ที่ต้องการลบถาวร' }, { status: 400 });
      }

      const ok = await deleteInstructorPermanent(targetId);
      return NextResponse.json({
        success: ok,
        message: ok ? 'ลบข้อมูลออกจากแฟ้มประวัติถาวรเรียบร้อยแล้ว' : 'ไม่พบข้อมูลอาจารย์ในแฟ้มประวัติ',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

