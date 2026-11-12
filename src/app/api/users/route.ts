import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import {
  getInstructorAccounts,
  getStudents,
  updateStudent,
  updateStudentPassword,
  scanTimetableInstructors,
  batchProvisionInstructors,
  batchImportInstructors,
  updateUserRole,
  resetUserPassword,
  updateInstructorPassword,
  createUserAccount,
  updateUserProfile,
  toggleUserSuspension,
  archiveInstructors,
  getArchivedInstructors,
  restoreInstructor,
  deleteInstructorPermanent,
} from '@/lib/data-store';
import { verifyPassword } from '@/lib/auth-security';
import {
  isSelfUserIdentity,
  isServerAdminOrOfficer,
  isServerSuperAdmin,
  requireAdminOrOfficer,
  requireAuthenticatedUser,
} from '@/lib/server-auth-guard';

export async function GET(request: Request) {
  try {
    const auth = requireAuthenticatedUser(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const query = searchParams.get('q')?.toLowerCase() || '';
    const archived = searchParams.get('archived') === 'true';

    if (archived) {
      const adminAuth = requireAdminOrOfficer(request);
      if (adminAuth.response) return adminAuth.response;

      const archivedList = await getArchivedInstructors();
      const safeArchived = archivedList.map(({ password, ...safe }) => safe);
      return NextResponse.json({ success: true, count: safeArchived.length, data: safeArchived });
    }

    let accounts = await getInstructorAccounts();

    const targetId = searchParams.get('id') || searchParams.get('userId') || searchParams.get('email');
    if (targetId) {
      const cleanTarget = targetId.trim().toLowerCase();
      const user = accounts.find(
        (a) =>
          (a.id || '').toLowerCase() === cleanTarget ||
          (a.email || '').toLowerCase() === cleanTarget ||
          (a.gmail || '').toLowerCase() === cleanTarget ||
          a.previousIds?.some((p) => p.toLowerCase() === cleanTarget) ||
          a.aliases?.some((al) => al.toLowerCase() === cleanTarget)
      );
      if (user) {
        const { password, ...safeUser } = user;
        return NextResponse.json({ success: true, user: safeUser, data: [safeUser] });
      }
    }

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
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAuthenticatedUser(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { action, userId, newRole, newPassword, userData, updates, isSuspended, reason } = body;

    // 1. Update Profile (Name, Email, Gmail, Department, Role)
    if (action === 'update-profile' || action === 'update-email') {
      const targetId = userId || updates?.id;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'กรุณาระบุ userId ที่ต้องการแก้ไข' }, { status: 400 });
      }

      const isAdmin = isServerAdminOrOfficer(auth.user);
      if (!isAdmin && !isSelfUserIdentity(auth.user, targetId)) {
        return NextResponse.json({ success: false, error: 'ไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้งานอื่น' }, { status: 403 });
      }

      const rawUpdates = { ...(updates || body) };
      if (!isAdmin) {
        // Prevent self-escalation of role or suspension status by non-admins
        delete rawUpdates.role;
        delete rawUpdates.isSuperAdmin;
        delete rawUpdates.isSuspended;
        delete rawUpdates.isActive;
      } else if (String(rawUpdates.role || '').toUpperCase() === 'SUPER_ADMIN' && !isServerSuperAdmin(auth.user)) {
        return NextResponse.json({ success: false, error: 'เฉพาะ Super Admin เท่านั้นที่กำหนดบทบาท SUPER_ADMIN ได้' }, { status: 403 });
      }

      const updated = await updateUserProfile(targetId, rawUpdates);
      if (!updated) {
        // Fallback: check if user is a student in student directory
        const cleanCode = String(targetId).trim().toLowerCase().replace(/@mcu\.ac\.th$/i, '');
        const students = await getStudents();
        const foundStudent = students.find(
          (s) =>
            (s.studentCode || '').toLowerCase() === cleanCode ||
            (s.email || '').toLowerCase() === String(targetId).trim().toLowerCase()
        );
        if (foundStudent) {
          const updatedStudent = await updateStudent(foundStudent.studentCode, {
            fullName: rawUpdates.name || foundStudent.fullName,
            email: rawUpdates.email || foundStudent.email,
            department: rawUpdates.department || foundStudent.department,
          });
          if (updatedStudent) {
            return NextResponse.json({
              success: true,
              data: {
                id: updatedStudent.studentCode,
                studentCode: updatedStudent.studentCode,
                name: updatedStudent.fullName,
                email: updatedStudent.email || `${updatedStudent.studentCode}@mcu.ac.th`,
                department: updatedStudent.department || updatedStudent.major,
                role: 'STUDENT',
              },
              message: 'แก้ไขข้อมูลนิสิตสำเร็จ',
            });
          }
        }
        return NextResponse.json({ success: false, error: 'ไม่พบผู้ใช้ที่ระบุ' }, { status: 404 });
      }

      const { password, ...safe } = updated;
      return NextResponse.json({ success: true, data: safe, message: 'แก้ไขข้อมูลอีเมลและผู้ใช้งานสำเร็จ' });
    }

    // 2. Change Password (by self or Admin/Officer)
    if (action === 'change-password') {
      const targetId = userId || updates?.id || updates?.email || body.email;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'กรุณาระบุบัญชีผู้ใช้ที่ต้องการเปลี่ยนรหัสผ่าน' }, { status: 400 });
      }

      if (!isServerAdminOrOfficer(auth.user) && !isSelfUserIdentity(auth.user, targetId)) {
        return NextResponse.json({ success: false, error: 'ไม่มีสิทธิ์เปลี่ยนรหัสผ่านของบัญชีอื่น' }, { status: 403 });
      }

      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
      }

      // If oldPassword is provided, verify it
      if (body.oldPassword) {
        const accounts = await getInstructorAccounts();
        const clean = String(targetId).toLowerCase().trim();
        const found = accounts.find(
          (a) =>
            (a.id || '').toLowerCase() === clean ||
            (a.email || '').toLowerCase() === clean ||
            (a.gmail || '').toLowerCase() === clean
        );
        if (found) {
          const matchPass = await verifyPassword(body.oldPassword, found.password);
          const matchDef = await verifyPassword(body.oldPassword, found.defaultPassword || 'mcu123456');
          const matchFb = await verifyPassword(body.oldPassword, 'mcu123456');
          if (!matchPass && !matchDef && !matchFb) {
            return NextResponse.json({ success: false, error: 'รหัสผ่านเดิมไม่ถูกต้อง' }, { status: 400 });
          }
        }
      }

      let ok = await updateInstructorPassword(targetId, newPassword);
      if (!ok) {
        ok = await updateStudentPassword(targetId, newPassword);
      }
      if (!ok) {
        return NextResponse.json({ success: false, error: 'ไม่พบผู้ใช้ หรือไม่สามารถเปลี่ยนรหัสผ่านได้' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'เปลี่ยนรหัสผ่านใหม่สำเร็จเรียบร้อยแล้ว' });
    }

    // All remaining user-management actions require Admin or Officer privilege
    const adminAuth = requireAdminOrOfficer(request);
    if (adminAuth.response) return adminAuth.response;

    // 3. Suspend / Activate User Account
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

    // 4. Update Role
    if (action === 'update-role') {
      if (!userId || !newRole) {
        return NextResponse.json({ success: false, error: 'กรุณาระบุ userId และ newRole' }, { status: 400 });
      }
      if (String(newRole).toUpperCase() === 'SUPER_ADMIN' && !isServerSuperAdmin(adminAuth.user)) {
        return NextResponse.json({ success: false, error: 'เฉพาะ Super Admin เท่านั้นที่กำหนดบทบาท SUPER_ADMIN ได้' }, { status: 403 });
      }
      const ok = await updateUserRole(userId, newRole);
      return NextResponse.json({ success: ok, message: ok ? 'เปลี่ยนบทบาทผู้ใช้สำเร็จ' : 'ไม่พบผู้ใช้' });
    }

    // 5. Reset Password (by admin)
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

    // 7.1 Batch Import & Bulk Update Instructors (นำเข้าและอัปเดตอาจารย์เป็นชุด)
    if (action === 'batch-import-instructors') {
      const { instructors: items } = body;
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: 'กรุณาส่งรายการข้อมูลอาจารย์ที่ต้องการนำเข้า' }, { status: 400 });
      }

      const result = await batchImportInstructors(items);
      return NextResponse.json({
        success: true,
        message: `ประมวลผลสำเร็จ: เพิ่มอาจารย์ใหม่ ${result.createdCount} ท่าน, อัปเดตข้อมูลอาจารย์เดิม ${result.updatedCount} ท่าน`,
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
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}

