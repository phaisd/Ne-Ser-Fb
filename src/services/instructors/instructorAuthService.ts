import { InstructorAccount, Student, UserRole } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from '../storageHelper';
import { getStudents } from '../studentService';
import { verifyPassword, hashPassword } from '@/lib/auth-security';
import { getInstructorAccounts, syncInstructorToSheet } from './instructorDirectoryService';

export async function authenticateInstructor(
  emailOrUsername: string,
  passwordInput: string
): Promise<Omit<InstructorAccount, 'password'> | null> {
  const accounts = await getInstructorAccounts();
  const cleanInput = (emailOrUsername || '').trim().toLowerCase();

  const found = accounts.find((a) => {
    const matchEmail = a.email?.toLowerCase() === cleanInput;
    const matchGmail = a.gmail?.toLowerCase() === cleanInput;
    const matchName = a.name?.toLowerCase() === cleanInput;
    const matchNameEn = a.nameEn?.toLowerCase() === cleanInput;
    const matchId = a.id?.toLowerCase() === cleanInput;
    const matchPrevId = a.previousIds?.some((p) => p.toLowerCase() === cleanInput);
    const matchAlias = a.aliases?.some((al) => al.toLowerCase() === cleanInput);
    return matchEmail || matchGmail || matchName || matchNameEn || matchId || matchPrevId || matchAlias;
  });

  if (!found) {
    // If input is a student (numeric code or in students list), do not auto-create as instructor
    const codePart = cleanInput.replace(/@mcu\.ac\.th$/i, '').trim();
    const students = readLocalJson<Student[]>('students.json', []);
    const isStudent = students.some(
      (s) =>
        (s.studentCode || '').toLowerCase() === codePart ||
        (s.email || '').toLowerCase() === cleanInput ||
        (s.studentCode || '').toLowerCase() === cleanInput
    );
    if (isStudent || /^\d{5,12}$/.test(codePart)) {
      return null;
    }

    // If not found in pre-generated list but user provides an @mcu.ac.th or @gmail.com email
    if (cleanInput.endsWith('@mcu.ac.th') || cleanInput.endsWith('@gmail.com')) {
      if (passwordInput === 'mcu123456' || passwordInput.length >= 6) {
        const username = cleanInput.split('@')[0];
        const newAcc: InstructorAccount = {
          id: 'inst-' + Date.now(),
          name: `อาจารย์ (${username})`,
          email: cleanInput.endsWith('@mcu.ac.th') ? cleanInput : `${username}@mcu.ac.th`,
          gmail: cleanInput.endsWith('@gmail.com') ? cleanInput : `${username}@gmail.com`,
          password: passwordInput,
          defaultPassword: 'mcu123456',
          department: 'คณะพุทธศาสตร์ มจร',
          role: 'INSTRUCTOR',
          coursesCount: 0,
          isActive: true,
          isSuspended: false,
          createdAt: new Date().toISOString(),
        };
        const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
        list.push(newAcc);
        writeLocalJson('instructors.json', list);
        const { password: _, ...safe } = newAcc;
        return safe;
      }
    }
    return null;
  }

  // Check if suspended by admin
  if (found.isSuspended || found.isActive === false) {
    throw new Error('บัญชีผู้ใช้นี้ถูกระงับการใช้งานชั่วคราว โปรดติดต่อผู้ดูแลระบบสูงสุด (phaisal.dis@mcu.ac.th)');
  }

  // Check password
  const matchPass = await verifyPassword(passwordInput, found.password);
  const matchDefault = await verifyPassword(passwordInput, found.defaultPassword);
  const matchFallback = await verifyPassword(passwordInput, 'mcu123456');
  const valid = matchPass || matchDefault || matchFallback;

  if (!valid) return null;

  const { password: _, ...safeUser } = found;
  return safeUser;
}

export async function authenticateGoogleUser(gmailInput: string): Promise<Omit<InstructorAccount, 'password'> | null> {
  const accounts = await getInstructorAccounts();
  const clean = (gmailInput || '').trim().toLowerCase();
  if (!clean) return null;

  const found = accounts.find((a) => {
    return (
      a.gmail?.toLowerCase() === clean ||
      a.email?.toLowerCase() === clean ||
      a.aliases?.some((al) => al.toLowerCase() === clean)
    );
  });

  if (!found) {
    // Do not auto-create unknown external Gmail accounts; caller falls back to student check or rejects.
    return null;
  }

  if (found.isSuspended || found.isActive === false) {
    throw new Error('บัญชีผู้ใช้นี้ถูกระงับการใช้งานชั่วคราว โปรดติดต่อผู้ดูแลระบบสูงสุด (phaisal.dis@mcu.ac.th)');
  }

  const { password: _, ...safe } = found;
  return safe;
}

export async function authenticateStudent(
  identifier: string,
  passwordInput?: string
): Promise<any | null> {
  const students = await getStudents();
  const clean = (identifier || '').trim().toLowerCase();
  if (!clean) return null;

  // Extract student code if email is provided (e.g. 6001501014@mcu.ac.th -> 6001501014)
  const codeOnly = clean.replace(/@mcu\.ac\.th$/i, '').trim();

  const found = students.find((s) => {
    const sId = (s.id || '').toLowerCase();
    const sCode = (s.studentCode || '').toLowerCase();
    const sEmail = (s.email || '').toLowerCase();
    return sCode === codeOnly || sEmail === clean || sCode === clean || (sId !== '' && sId === clean);
  });

  if (!found) return null;

  if (found.isActive === false) {
    throw new Error('สถานภาพนิสิตไม่ปกติหรือถูกระงับการใช้งาน โปรดติดต่อสำนักงานคณะพุทธศาสตร์');
  }

  // Password check: Default password for students is 'mcu123456' or studentCode, or 'mcu' + last 4 digits
  let hasChangedPassword = Boolean((found as any).hasChangedPassword);
  if (passwordInput) {
    const last4 = (found.studentCode || '').slice(-4);
    const customPass = (found as any).password;
    const isCustomMatch = customPass ? await verifyPassword(passwordInput, customPass) : false;
    const isDefaultMatch =
      passwordInput === 'mcu123456' ||
      passwordInput === found.studentCode ||
      passwordInput === `mcu${last4}` ||
      passwordInput === (found.passportNo || '') ||
      passwordInput === '123456';

    if (!isCustomMatch && !isDefaultMatch) return null;

    if (isCustomMatch && !isDefaultMatch) {
      hasChangedPassword = true;
    }
  }

  return {
    id: found.id || found.studentCode,
    studentCode: found.studentCode,
    name: found.fullName || `${found.title || ''}${found.firstName} ${found.lastName}`.trim(),
    email: found.email || `${found.studentCode}@mcu.ac.th`,
    department: found.major || 'คณะพุทธศาสตร์',
    degree: found.degree || 'ปริญญาตรี',
    role: 'STUDENT',
    programType: found.programType || 'THAI',
    yearLevel: found.yearLevel || 1,
    hasChangedPassword,
    isActingOfficer: Boolean(found.isActingOfficer),
    studentData: found,
  };
}

export async function updateUserRole(
  userId: string,
  newRole: 'SUPER_ADMIN' | 'ADMIN' | 'OFFICER' | 'INSTRUCTOR'
): Promise<boolean> {
  const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
  const idx = list.findIndex((u) => u.id === userId || u.email === userId);
  if (idx === -1) return false;
  if (list[idx].email === 'phaisal.dis@mcu.ac.th' || list[idx].role === 'SUPER_ADMIN' || list[idx].isSuperAdmin) {
    return false; // ห้ามลดสิทธิ์หรือเปลี่ยนแปลงบัญชี Super Admin
  }
  list[idx].role = newRole;
  list[idx].updatedAt = new Date().toISOString();
  writeLocalJson('instructors.json', list);
  await syncInstructorToSheet(list[idx]);
  return true;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<InstructorAccount>
): Promise<InstructorAccount | null> {
  const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
  const cleanId = (userId || '').trim().toLowerCase();
  const idx = list.findIndex(
    (u) =>
      (u.id || '').toLowerCase() === cleanId ||
      (u.email || '').toLowerCase() === cleanId ||
      u.previousIds?.some((p) => p.toLowerCase() === cleanId)
  );
  if (idx === -1) return null;

  const current = list[idx];
  // Ensure Super Admin status is preserved if modifying phaisal.dis@mcu.ac.th
  const isSuper = current.isSuperAdmin || current.email === 'phaisal.dis@mcu.ac.th';

  const newEmail = (updates.email && updates.email.trim()) 
    ? updates.email.trim().toLowerCase() 
    : ((updates.gmail && updates.gmail.trim()) ? updates.gmail.trim().toLowerCase() : current.email);
  const newGmail = updates.gmail !== undefined ? updates.gmail.trim().toLowerCase() : current.gmail;

  // Prevent email duplicate collision with other instructor accounts
  if (newEmail && current.email && newEmail !== current.email.toLowerCase()) {
    const duplicate = list.find((u, i) => i !== idx && u.email?.toLowerCase() === newEmail);
    if (duplicate) {
      throw new Error(`อีเมล "${newEmail}" มีอยู่ในระบบแล้ว กรุณาตรวจสอบหรือใช้อีเมลอื่น`);
    }
  }

  // Preserve previous email in aliases so course mappings and searches never break
  const aliasesList = Array.isArray(updates.aliases)
    ? [...updates.aliases]
    : typeof updates.aliases === 'string'
    ? (updates.aliases as string).split(',').map((s) => s.trim()).filter(Boolean)
    : [...(current.aliases || [])];

  if (current.email && current.email !== newEmail && !aliasesList.includes(current.email)) {
    aliasesList.push(current.email);
  }
  if (newEmail && !aliasesList.includes(newEmail)) {
    aliasesList.push(newEmail);
  }
  if (newGmail && !aliasesList.includes(newGmail)) {
    aliasesList.push(newGmail);
  }

  const oldName = current.name ? current.name.trim() : '';
  const newName = updates.name !== undefined ? updates.name.trim() : current.name;
  const oldNameEn = current.nameEn ? current.nameEn.trim() : '';
  const newNameEn = updates.nameEn !== undefined ? updates.nameEn.trim() : (current.nameEn || '');

  // Cascade update instructor name in courses.json and timetables.json
  if (oldName && newName && oldName !== newName) {
    try {
      const courses = readLocalJson<any[]>('courses.json', []);
      let coursesModified = false;
      courses.forEach((c) => {
        if (c.instructor && typeof c.instructor === 'string' && c.instructor.includes(oldName)) {
          c.instructor = c.instructor.replaceAll(oldName, newName);
          coursesModified = true;
        }
      });
      if (coursesModified) {
        writeLocalJson('courses.json', courses);
      }

      const timetables = readLocalJson<any[]>('timetables.json', []);
      let timetablesModified = false;
      timetables.forEach((t) => {
        if (t.instructor && typeof t.instructor === 'string' && t.instructor.includes(oldName)) {
          t.instructor = t.instructor.replaceAll(oldName, newName);
          timetablesModified = true;
        }
      });
      if (timetablesModified) {
        writeLocalJson('timetables.json', timetables);
      }
    } catch (cascadeErr) {
      console.warn('Cascade instructor rename error:', cascadeErr);
    }
  }

  // Also cascade English name if changed
  if (oldNameEn && newNameEn && oldNameEn !== newNameEn) {
    try {
      const courses = readLocalJson<any[]>('courses.json', []);
      let coursesModified = false;
      courses.forEach((c) => {
        if (c.instructor && typeof c.instructor === 'string' && c.instructor.includes(oldNameEn)) {
          c.instructor = c.instructor.replaceAll(oldNameEn, newNameEn);
          coursesModified = true;
        }
      });
      if (coursesModified) {
        writeLocalJson('courses.json', courses);
      }
    } catch {}
  }

  const updated: InstructorAccount = {
    ...current,
    name: newName,
    nameEn: newNameEn,
    aliases: Array.from(new Set(aliasesList.filter(Boolean))),
    email: newEmail,
    gmail: newGmail,
    department: updates.department !== undefined ? updates.department.trim() : current.department,
    instructorType: updates.instructorType !== undefined ? updates.instructorType.trim() : current.instructorType,
    role: updates.role || current.role,
    isSuperAdmin: isSuper || updates.isSuperAdmin || false,
    isActingOfficer:
      updates.isActingOfficer !== undefined
        ? Boolean(updates.isActingOfficer)
        : Boolean(current.isActingOfficer),
    updatedAt: new Date().toISOString(),
  };

  list[idx] = updated;
  writeLocalJson('instructors.json', list);
  await syncInstructorToSheet(updated);
  return updated;
}

export async function toggleActingOfficer(
  targetId: string,
  isActingOfficer: boolean,
  userType?: 'STUDENT' | 'INSTRUCTOR'
): Promise<{ success: boolean; message: string; data?: any }> {
  const cleanId = (targetId || '').trim().toLowerCase();
  if (!cleanId) {
    return { success: false, message: 'กรุณาระบุรหัสผู้ใช้งาน' };
  }

  // 1. Handle Student if explicitly STUDENT or if not found in instructors
  if (userType !== 'INSTRUCTOR') {
    const codeOnly = cleanId.replace(/@mcu\.ac\.th$/i, '').trim();
    const localStudents = readLocalJson<any[]>('students.json', []);
    let sIdx = localStudents.findIndex(
      (s) =>
        (s.studentCode || '').trim().toLowerCase() === cleanId ||
        (s.studentCode || '').trim().toLowerCase() === codeOnly ||
        (s.id || '').trim().toLowerCase() === cleanId ||
        (s.email || '').trim().toLowerCase() === cleanId
    );

    if (sIdx === -1 && userType === 'STUDENT') {
      const allStudents = await getStudents();
      const matched = allStudents.find(
        (s) =>
          (s.studentCode || '').trim().toLowerCase() === cleanId ||
          (s.studentCode || '').trim().toLowerCase() === codeOnly ||
          (s.id || '').trim().toLowerCase() === cleanId ||
          (s.email || '').trim().toLowerCase() === cleanId
      );
      if (matched) {
        localStudents.push({ ...matched });
        sIdx = localStudents.length - 1;
      }
    }

    if (sIdx !== -1 && (userType === 'STUDENT' || /^\d{5,12}$/.test(codeOnly))) {
      localStudents[sIdx].isActingOfficer = isActingOfficer;
      localStudents[sIdx].updatedAt = new Date().toISOString();
      writeLocalJson('students.json', localStudents);

      const resolvedCode = String(localStudents[sIdx].studentCode || codeOnly).trim();
      const gClient = getSheetsClient();
      if (gClient && resolvedCode) {
        try {
          const rows = await gClient.getValues('Students!A1:A');
          if (rows && rows.length > 0) {
            const rowIndex = rows.findIndex(
              (r) => String(r[0] || '').trim().toLowerCase() === resolvedCode.toLowerCase()
            );
            if (rowIndex !== -1) {
              const sheetRowNum = rowIndex + 1;
              await gClient.updateValues(`Students!U${sheetRowNum}`, [[isActingOfficer ? 'TRUE' : 'FALSE']]);
            }
          }
        } catch (err) {
          console.warn('Google Sheets update student acting officer failed:', err);
        }
      }

      const displayName =
        localStudents[sIdx].fullName ||
        `${localStudents[sIdx].title || ''}${localStudents[sIdx].firstName || ''} ${localStudents[sIdx].lastName || ''}`.trim() ||
        resolvedCode;

      return {
        success: true,
        message: isActingOfficer
          ? `☑️ กำหนดสิทธิ์ "ช่วยงานเจ้าหน้าที่" ให้แก่นิสิต "${displayName}" เรียบร้อยแล้ว`
          : `ยกเลิกสิทธิ์ "ช่วยงานเจ้าหน้าที่" ของนิสิต "${displayName}" เรียบร้อยแล้ว`,
        data: localStudents[sIdx],
      };
    }
  }

  // 2. Handle Instructor
  const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
  let idx = list.findIndex(
    (u) =>
      (u.id || '').toLowerCase() === cleanId ||
      (u.email || '').toLowerCase() === cleanId ||
      (u.gmail || '').toLowerCase() === cleanId ||
      u.previousIds?.some((p) => p.toLowerCase() === cleanId)
  );

  if (idx === -1) {
    const allInstructors = await getInstructorAccounts();
    const matched = allInstructors.find(
      (u) =>
        (u.id || '').toLowerCase() === cleanId ||
        (u.email || '').toLowerCase() === cleanId ||
        (u.gmail || '').toLowerCase() === cleanId
    );
    if (matched) {
      list.push({ ...matched });
      idx = list.length - 1;
    }
  }

  if (idx === -1) {
    return { success: false, message: 'ไม่พบบัญชีอาจารย์หรือนิสิตที่ระบุ' };
  }

  list[idx].isActingOfficer = isActingOfficer;
  list[idx].updatedAt = new Date().toISOString();
  writeLocalJson('instructors.json', list);
  await syncInstructorToSheet(list[idx]);

  const { password: _, ...safe } = list[idx];
  return {
    success: true,
    message: isActingOfficer
      ? `☑️ กำหนดสิทธิ์ "ช่วยงานเจ้าหน้าที่" ให้แก่ "${list[idx].name}" เรียบร้อยแล้ว (คงสถานะอาจารย์ผู้สอนและตารางสอนเดิมครบถ้วน)`
      : `ยกเลิกสิทธิ์ "ช่วยงานเจ้าหน้าที่" ของ "${list[idx].name}" เรียบร้อยแล้ว`,
    data: safe,
  };
}

export async function toggleUserSuspension(
  userId: string,
  suspend: boolean,
  reason?: string
): Promise<{ success: boolean; message: string; user?: InstructorAccount }> {
  const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
  const idx = list.findIndex((u) => u.id === userId || u.email === userId);
  if (idx === -1) {
    return { success: false, message: 'ไม่พบบัญชีผู้ใช้งานที่ระบุ' };
  }

  const target = list[idx];
  if (target.email === 'phaisal.dis@mcu.ac.th' || target.isSuperAdmin) {
    return {
      success: false,
      message: 'ไม่สามารถระงับการใช้งานบัญชีผู้ดูแลระบบสูงสุด (Super Admin: phaisal.dis@mcu.ac.th) ได้',
    };
  }

  target.isSuspended = suspend;
  target.isActive = !suspend;
  target.suspendReason = suspend ? (reason || 'ถูกระงับการใช้งานโดยผู้ดูแลระบบ') : '';
  target.updatedAt = new Date().toISOString();

  list[idx] = target;
  writeLocalJson('instructors.json', list);
  await syncInstructorToSheet(target);

  return {
    success: true,
    message: suspend ? `ระงับการใช้งานบัญชี ${target.name} เรียบร้อยแล้ว` : `ปลดระงับการใช้งานบัญชี ${target.name} ให้ใช้งานได้ตามปกติแล้ว`,
    user: target,
  };
}

export async function resetUserPassword(userId: string, newPassword: string = 'mcu123456'): Promise<boolean> {
  const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
  const idx = list.findIndex((u) => u.id === userId || u.email === userId);
  if (idx === -1) return false;
  if (list[idx].email === 'phaisal.dis@mcu.ac.th' || list[idx].isSuperAdmin) {
    return false; // ไม่อนุญาตให้รีเซ็ตรหัสผ่านบัญชี Super Admin ผ่านปุ่มนี้
  }
  list[idx].password = newPassword;
  list[idx].hasChangedPassword = false;
  list[idx].updatedAt = new Date().toISOString();
  writeLocalJson('instructors.json', list);
  return true;
}

export async function updateInstructorPassword(userId: string, newPassword: string): Promise<boolean> {
  const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
  const cleanId = (userId || '').trim().toLowerCase();
  const idx = list.findIndex(
    (u) =>
      (u.id || '').toLowerCase() === cleanId ||
      (u.email || '').toLowerCase() === cleanId ||
      u.previousIds?.some((p) => p.toLowerCase() === cleanId)
  );
  if (idx === -1) return false;

  const hashedPassword = await hashPassword(newPassword);
  list[idx].password = hashedPassword;
  list[idx].hasChangedPassword = true;
  list[idx].updatedAt = new Date().toISOString();
  writeLocalJson('instructors.json', list);
  await syncInstructorToSheet(list[idx]);
  return true;
}

export async function createUserAccount(accountData: Partial<InstructorAccount>): Promise<InstructorAccount> {
  const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
  const cleanEmail = (accountData.email || '').trim().toLowerCase();
  const cleanGmail = (accountData.gmail || '').trim().toLowerCase();

  // Primary email can be either an @mcu.ac.th, an external gmail, or generated fallback
  const primaryEmail = cleanEmail || cleanGmail || `user${Date.now()}@gmail.com`;
  const gmail = cleanGmail || (primaryEmail.endsWith('@gmail.com') ? primaryEmail : '');

  const newAccount: InstructorAccount = {
    id: 'user-' + Date.now(),
    name: accountData.name ? accountData.name.trim() : 'ผู้ใช้งานใหม่',
    nameEn: accountData.nameEn ? accountData.nameEn.trim() : '',
    email: primaryEmail,
    gmail: gmail,
    password: accountData.password || 'mcu123456',
    defaultPassword: 'mcu123456',
    department: accountData.department ? accountData.department.trim() : 'คณะพุทธศาสตร์ มจร',
    instructorType: accountData.instructorType ? accountData.instructorType.trim() : 'อาจารย์ประจำ',
    role: accountData.role || 'INSTRUCTOR',
    coursesCount: 0,
    isActive: true,
    isSuspended: false,
    hasChangedPassword: false,
    aliases: [accountData.name, accountData.nameEn, primaryEmail, gmail].filter(Boolean) as string[],
    previousIds: [],
    createdAt: new Date().toISOString(),
  };
  list.unshift(newAccount);
  writeLocalJson('instructors.json', list);
  await syncInstructorToSheet(newAccount);
  return newAccount;
}
