import { InstructorAccount, Student, ArchivedInstructor } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';
import { getTimetables } from './courseService';
import { getStudents } from './studentService';
import { verifyPassword, hashPassword } from '@/lib/auth-security';

// ----------------- INSTRUCTORS & AUTH -----------------

export async function getInstructorAccounts(): Promise<InstructorAccount[]> {
  const localAccounts = readLocalJson<InstructorAccount[]>('instructors.json', []);
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Instructors!A2:I');
      if (rows && rows.length > 0) {
        const localById = new Map<string, InstructorAccount>();
        const localByEmail = new Map<string, InstructorAccount>();
        localAccounts.forEach((acc) => {
          if (acc.id) localById.set(acc.id.toLowerCase(), acc);
          if (acc.email) localByEmail.set(acc.email.toLowerCase(), acc);
          if (acc.gmail) localByEmail.set(acc.gmail.toLowerCase(), acc);
        });

        const seenIds = new Set<string>();
        const merged = rows.map((r) => {
          const id = (r[0] || '').trim();
          const email = (r[2] || '').trim();
          const gmail = (r[3] || '').trim();
          const localMatch =
            localById.get(id.toLowerCase()) ||
            localByEmail.get(email.toLowerCase()) ||
            (gmail ? localByEmail.get(gmail.toLowerCase()) : undefined);

          if (localMatch?.id) seenIds.add(localMatch.id.toLowerCase());
          if (id) seenIds.add(id.toLowerCase());

          const effectiveEmail = localMatch?.email || email;
          const effectiveRole = (localMatch?.role || (r[5] as any) || 'INSTRUCTOR');
          const isSuper =
            effectiveEmail === 'phaisal.dis@mcu.ac.th' ||
            effectiveRole === 'SUPER_ADMIN' ||
            Boolean(localMatch?.isSuperAdmin);

          return {
            ...(localMatch || {}),
            id: localMatch?.id || id,
            name: localMatch?.name || r[1] || '',
            email: effectiveEmail,
            gmail: localMatch?.gmail || gmail,
            department: localMatch?.department || r[4] || 'คณะพุทธศาสตร์ มจร',
            role: isSuper ? 'SUPER_ADMIN' : effectiveRole,
            isActive: localMatch?.isActive !== undefined ? localMatch.isActive : r[6] !== 'FALSE',
            isSuspended: localMatch?.isSuspended !== undefined ? localMatch.isSuspended : r[7] === 'TRUE',
            createdAt: localMatch?.createdAt || r[8] || '',
            isSuperAdmin: isSuper,
          } as InstructorAccount;
        });

        // Include any local accounts not yet in Google Sheets
        localAccounts.forEach((acc) => {
          const idKey = (acc.id || '').toLowerCase();
          if (idKey && !seenIds.has(idKey)) {
            merged.push(acc);
          }
        });

        return merged;
      }
    } catch (err) {
      // Fallback silently to local file
    }
  }
  return localAccounts;
}

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

  let found = accounts.find((a) => {
    return (
      a.gmail?.toLowerCase() === clean ||
      a.email?.toLowerCase() === clean ||
      a.aliases?.some((al) => al.toLowerCase() === clean)
    );
  });

  if (!found) {
    // If input is a student (numeric code or in students list), do not auto-create as instructor
    const codePart = clean.replace(/@mcu\.ac\.th$/i, '').trim();
    const students = readLocalJson<Student[]>('students.json', []);
    const isStudent = students.some(
      (s) =>
        (s.studentCode || '').toLowerCase() === codePart ||
        (s.email || '').toLowerCase() === clean ||
        (s.studentCode || '').toLowerCase() === clean
    );
    if (isStudent || /^\d{5,12}$/.test(codePart)) {
      return null;
    }

    const username = clean.split('@')[0];
    const newAcc: InstructorAccount = {
      id: 'inst-' + Date.now(),
      name: `อาจารย์ (${username})`,
      email: clean.endsWith('@mcu.ac.th') ? clean : `${username}@mcu.ac.th`,
      gmail: clean.endsWith('@gmail.com') ? clean : `${username}@gmail.com`,
      password: 'mcu123456',
      defaultPassword: 'mcu123456',
      department: 'คณะพุทธศาสตร์ มจร',
      role: 'INSTRUCTOR',
      coursesCount: 0,
      isActive: true,
      isSuspended: false,
      createdAt: new Date().toISOString(),
    };
    accounts.push(newAcc);
    writeLocalJson('instructors.json', accounts);
    found = newAcc;
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
    const sCode = (s.studentCode || '').toLowerCase();
    const sEmail = (s.email || '').toLowerCase();
    return sCode === codeOnly || sEmail === clean || sCode === clean;
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
    updatedAt: new Date().toISOString(),
  };

  list[idx] = updated;
  writeLocalJson('instructors.json', list);
  return updated;
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
  return newAccount;
}

export async function scanTimetableInstructors() {
  const [timetables, existingInstructors] = await Promise.all([
    getTimetables(),
    getInstructorAccounts(),
  ]);

  const IGNORE_TERMS = new Set(['staff', 'advisor', 'tba', 'ผู้สอน', 'อาจารย์', 'บรรยาย', 'อาจารย์พิเศษ', 'none', '-']);

  const nameToCourses = new Map<string, Array<{ courseCode: string; courseName: string; timetableTitle?: string }>>();

  timetables.forEach((t) => {
    if (t.instructor) {
      t.instructor.split('/').forEach((part) => {
        const clean = part.replace(/\*/g, '').trim();
        if (clean && clean.length > 2 && !IGNORE_TERMS.has(clean.toLowerCase())) {
          if (!nameToCourses.has(clean)) {
            nameToCourses.set(clean, []);
          }
          const list = nameToCourses.get(clean)!;
          if (!list.some((c) => c.courseCode === t.courseCode)) {
            list.push({
              courseCode: t.courseCode,
              courseName: t.courseName,
              timetableTitle: t.timetableTitle,
            });
          }
        }
      });
    }
  });

  const existingEmails = new Set(existingInstructors.map((i) => i.email.toLowerCase()));

  const alreadyExisting: any[] = [];
  const candidates: any[] = [];

  for (const [rawName, courses] of nameToCourses.entries()) {
    const rawLower = rawName.toLowerCase();

    const matchedAccount = existingInstructors.find((u) => {
      if (u.name.toLowerCase() === rawLower) return true;
      if (u.nameEn && u.nameEn.toLowerCase() === rawLower) return true;
      if (u.aliases && u.aliases.some((a) => rawLower.includes(a.toLowerCase()) || a.toLowerCase().includes(rawLower))) return true;

      const tokens = u.name.replace(/(ดร|ผศ|รศ|ศ|พระมหา|พระครู|พระ|อ.ดร|อ|\.|\,)/g, '').trim().split(/\s+/).filter((x) => x.length > 2);
      if (tokens.some((tok) => rawLower.includes(tok.toLowerCase()))) return true;

      if (u.nameEn) {
        const enTokens = u.nameEn.replace(/(asst|assoc|prof|phramaha|dr|phd|ven|phra|\.|\,)/gi, '').trim().split(/\s+/).filter((x) => x.length > 3);
        if (enTokens.some((tok) => rawLower.includes(tok.toLowerCase()))) return true;
      }

      return false;
    });

    if (matchedAccount) {
      alreadyExisting.push({
        rawName,
        accountId: matchedAccount.id,
        accountName: matchedAccount.name,
        accountNameEn: matchedAccount.nameEn,
        accountEmail: matchedAccount.email,
        courseCount: courses.length,
      });
    } else {
      const isEnglishName = /^[a-zA-Z\s\.,\-]+$/.test(rawName);
      let nameTh = isEnglishName ? rawName : rawName;
      let nameEn = isEnglishName ? rawName : '';

      let emailPrefix = '';
      if (isEnglishName) {
        const words = rawName.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter((w) => !['asst', 'assoc', 'prof', 'dr', 'phd', 'ven', 'phra', 'phramaha'].includes(w));
        emailPrefix = words.length >= 2 ? `${words[0]}.${words[1][0]}` : words[0] || 'instructor';
      } else {
        const words = rawName.replace(/^(พระมหา|พระครูปลัด|พระครู|พระใบฎีกา|พระสมุห์|พระ|ผศ\.|รศ\.|ศ\.|ดร\.|อ\.ดร\.|อ\.|นาย|นาง|นางสาว|\*)/g, '').trim().split(/\s+/);
        emailPrefix = words.length > 0 ? `teacher.${words[0].substring(0, 5)}` : 'teacher';
      }

      let email = `${emailPrefix}@mcu.ac.th`;
      let counter = 1;
      while (existingEmails.has(email.toLowerCase())) {
        counter++;
        email = `${emailPrefix}${counter}@mcu.ac.th`;
      }
      existingEmails.add(email.toLowerCase());

      let similarTo: any = null;
      for (const ex of existingInstructors) {
        const exName = ex.name.toLowerCase();
        const exEn = (ex.nameEn || '').toLowerCase();
        const rawTokens = rawName.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
        if (rawTokens.some((tok) => exName.includes(tok) || exEn.includes(tok))) {
          similarTo = {
            id: ex.id,
            name: ex.name,
            nameEn: ex.nameEn,
          };
          break;
        }
      }

      candidates.push({
        rawName,
        name: nameTh,
        nameEn,
        email,
        password: 'mcu123456',
        defaultPassword: 'mcu123456',
        department: courses[0]?.timetableTitle?.includes('อังกฤษ') || courses[0]?.timetableTitle?.includes('Inter')
          ? 'หลักสูตรภาษาอังกฤษ คณะพุทธศาสตร์'
          : 'คณะพุทธศาสตร์ มจร',
        role: 'INSTRUCTOR',
        coursesCount: courses.length,
        courses,
        aliases: [rawName.replace(/(ดร|ผศ|รศ|ศ|พระมหา|พระครู|พระ|\.|\,)/g, '').trim()].filter(Boolean),
        similarTo,
        selected: true,
      });
    }
  }

  return {
    totalTimetableInstructors: nameToCourses.size,
    existingCount: alreadyExisting.length,
    newCount: candidates.length,
    alreadyExisting,
    candidates,
  };
}

export async function batchProvisionInstructors(
  candidatesToCreate: Array<Partial<InstructorAccount>>,
  linksToExisting: Array<{ existingUserId: string; aliasToAdd: string; nameEnToAdd?: string }>
): Promise<{ createdCount: number; linkedCount: number }> {
  const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
  let createdCount = 0;
  let linkedCount = 0;

  for (const c of candidatesToCreate) {
    if (!c.name || !c.email) continue;
    const newId = 'inst-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const newAcc: InstructorAccount = {
      id: newId,
      name: c.name.trim(),
      nameEn: c.nameEn ? c.nameEn.trim() : undefined,
      email: c.email.trim().toLowerCase(),
      gmail: c.gmail ? c.gmail.trim() : `${c.email.split('@')[0]}@gmail.com`,
      password: c.password || 'mcu123456',
      defaultPassword: 'mcu123456',
      department: c.department || 'คณะพุทธศาสตร์ มจร',
      role: 'INSTRUCTOR',
      coursesCount: c.coursesCount || 0,
      isActive: true,
      aliases: Array.isArray(c.aliases) ? c.aliases : [c.name],
      createdAt: new Date().toISOString(),
    };
    list.unshift(newAcc);
    createdCount++;
  }

  for (const l of linksToExisting) {
    const found = list.find((u) => u.id === l.existingUserId);
    if (found) {
      if (!found.aliases) found.aliases = [];
      if (l.aliasToAdd && !found.aliases.includes(l.aliasToAdd)) {
        found.aliases.push(l.aliasToAdd);
      }
      if (l.nameEnToAdd && !found.nameEn) {
        found.nameEn = l.nameEnToAdd;
      }
      linkedCount++;
    }
  }

  writeLocalJson('instructors.json', list);

  return { createdCount, linkedCount };
}

// ----------------- ARCHIVE & RESTORE INSTRUCTORS -----------------

export async function archiveInstructors(
  userIds: string[],
  reason: string = 'เกษียณอายุ/ลาออก/จำหน่ายออกจากระบบ',
  archivedBy: string = 'ผู้ดูแลระบบ (Admin)'
): Promise<{
  archivedCount: number;
  archivedIds: string[];
  remainingCount: number;
  message?: string;
}> {
  const idsSet = new Set(userIds.map((id) => String(id).trim().toLowerCase()));
  const localList = readLocalJson<InstructorAccount[]>('instructors.json', []);
  const archiveList = readLocalJson<ArchivedInstructor[]>('instructors_archive.json', []);

  const archivedIds: string[] = [];
  const instructorsToArchive: ArchivedInstructor[] = [];

  const nowIso = new Date().toISOString();
  const thaiDateStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

  const remainingList = localList.filter((inst) => {
    const instId = (inst.id || '').trim().toLowerCase();
    const instEmail = (inst.email || '').trim().toLowerCase();

    // Prevent archiving Super Admin
    if (inst.email === 'phaisal.dis@mcu.ac.th' || inst.isSuperAdmin) {
      return true;
    }

    if (idsSet.has(instId) || idsSet.has(instEmail)) {
      archivedIds.push(inst.id);
      instructorsToArchive.push({
        ...inst,
        archivedAt: nowIso,
        archivedBy,
        archiveReason: reason,
      });
      return false;
    }
    return true;
  });

  const archivedCount = instructorsToArchive.length;
  if (archivedCount === 0) {
    return {
      archivedCount: 0,
      archivedIds: [],
      remainingCount: localList.length,
      message: 'ไม่พบบัญชีอาจารย์ที่ระบุ หรือเป็นบัญชีผู้ดูแลระบบสูงสุดที่ไม่สามารถจำหน่ายได้',
    };
  }

  // 1. Update local files
  writeLocalJson('instructors.json', remainingList);
  const updatedArchive = [...instructorsToArchive, ...archiveList];
  writeLocalJson('instructors_archive.json', updatedArchive);

  // 2. Synchronize with Google Sheets (Archive to Instructors_Archive sheet tab)
  const gClient = getSheetsClient();
  if (gClient && archivedIds.length > 0) {
    try {
      await gClient.ensureSheetsExist(['Instructors_Archive']);

      const archiveRows = await gClient.getValues('Instructors_Archive!A1:A2');
      if (!archiveRows || archiveRows.length === 0 || !archiveRows[0] || archiveRows[0].length === 0) {
        await gClient.updateValues('Instructors_Archive!A1:L1', [[
          'รหัสอาจารย์ (ID)',
          'ชื่อ-นามสกุล',
          'ชื่อภาษาอังกฤษ',
          'อีเมล @mcu',
          'Gmail',
          'หน่วยงาน/ภาควิชา',
          'ประเภทอาจารย์',
          'บทบาท',
          'สถานภาพเดิม',
          'วัน-เวลาที่ย้ายเข้าแฟ้มประวัติ',
          'ผู้ดำเนินการ',
          'เหตุผลการจำหน่าย/เกษียณ',
        ]]);
      }

      const rowsToAppend = instructorsToArchive.map((inst) => [
        inst.id || '',
        inst.name || '',
        inst.nameEn || '',
        inst.email || '',
        inst.gmail || '',
        inst.department || '',
        inst.instructorType || 'อาจารย์ประจำ',
        inst.role || 'INSTRUCTOR',
        inst.isSuspended ? 'ถูกระงับ' : 'ปกติ',
        thaiDateStr,
        archivedBy,
        reason,
      ]);
      await gClient.appendValues('Instructors_Archive!A:L', rowsToAppend);

      // Clear matching rows in active Instructors sheet if any
      const activeRows = await gClient.getValues('Instructors!A2:A');
      if (activeRows && activeRows.length > 0) {
        for (let i = 0; i < activeRows.length; i++) {
          const rowId = (activeRows[i][0] || '').trim().toLowerCase();
          if (idsSet.has(rowId)) {
            const sheetRowNum = i + 2;
            const emptyRow = Array(9).fill('');
            await gClient.updateValues(`Instructors!A${sheetRowNum}:I${sheetRowNum}`, [emptyRow]);
          }
        }
      }
    } catch (err) {
      console.warn('Google Sheets archive instructor warning:', err);
    }
  }

  return {
    archivedCount,
    archivedIds,
    remainingCount: remainingList.length,
    message: `ย้ายข้อมูลอาจารย์เข้าสู่แฟ้มประวัติเรียบร้อยแล้ว (${archivedCount} รายการ)`,
  };
}

export async function getArchivedInstructors(): Promise<ArchivedInstructor[]> {
  const localArchive = readLocalJson<ArchivedInstructor[]>('instructors_archive.json', []);
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Instructors_Archive!A2:L');
      if (rows && rows.length > 0) {
        const sheetArchived: ArchivedInstructor[] = rows
          .filter((r) => r[0] && String(r[0]).trim())
          .map((r) => ({
            id: String(r[0]).trim(),
            name: r[1] || '',
            nameEn: r[2] || '',
            email: r[3] || '',
            gmail: r[4] || '',
            department: r[5] || '',
            instructorType: r[6] || 'อาจารย์ประจำ',
            role: (r[7] as any) || 'INSTRUCTOR',
            isActive: false,
            isSuspended: true,
            archivedAt: r[9] || new Date().toISOString(),
            archivedBy: r[10] || 'Admin',
            archiveReason: r[11] || 'เกษียณอายุ/ลาออก/จำหน่ายออกจากระบบ',
          }));

        if (sheetArchived.length > 0) {
          const map = new Map<string, ArchivedInstructor>();
          sheetArchived.forEach((inst) => map.set(inst.id, inst));
          localArchive.forEach((inst) => {
            if (!map.has(inst.id)) map.set(inst.id, inst);
          });
          return Array.from(map.values());
        }
      }
    } catch (err) {
      console.warn('Google Sheets read error for Instructors_Archive:', err);
    }
  }
  return localArchive;
}

export async function restoreInstructor(userId: string): Promise<InstructorAccount | null> {
  const cleanId = String(userId).trim().toLowerCase();
  const archiveList = readLocalJson<ArchivedInstructor[]>('instructors_archive.json', []);
  const targetIdx = archiveList.findIndex(
    (inst) => (inst.id || '').trim().toLowerCase() === cleanId || (inst.email || '').trim().toLowerCase() === cleanId
  );

  if (targetIdx === -1) {
    return null;
  }

  const restored = archiveList[targetIdx];
  const { archivedAt, archivedBy, archiveReason, ...activeInstructor } = restored;

  // Restore to active state
  activeInstructor.isActive = true;
  activeInstructor.isSuspended = false;
  activeInstructor.suspendReason = '';
  activeInstructor.updatedAt = new Date().toISOString();

  // 1. Remove from archive
  archiveList.splice(targetIdx, 1);
  writeLocalJson('instructors_archive.json', archiveList);

  // 2. Add back to active instructors
  const localList = readLocalJson<InstructorAccount[]>('instructors.json', []);
  localList.unshift(activeInstructor);
  writeLocalJson('instructors.json', localList);

  // 3. Sync with Google Sheets
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      await gClient.ensureSheetsExist(['Instructors']);
      await gClient.appendValues('Instructors!A:I', [[
        activeInstructor.id,
        activeInstructor.name,
        activeInstructor.email,
        activeInstructor.gmail || '',
        activeInstructor.department || '',
        activeInstructor.role || 'INSTRUCTOR',
        'TRUE',
        'FALSE',
        new Date().toISOString(),
      ]]);

      // Clear row from Instructors_Archive
      const archiveRows = await gClient.getValues('Instructors_Archive!A2:A');
      if (archiveRows && archiveRows.length > 0) {
        for (let i = 0; i < archiveRows.length; i++) {
          if ((archiveRows[i][0] || '').trim().toLowerCase() === cleanId) {
            const rowNum = i + 2;
            const emptyRow = Array(12).fill('');
            await gClient.updateValues(`Instructors_Archive!A${rowNum}:L${rowNum}`, [emptyRow]);
          }
        }
      }
    } catch (err) {
      console.warn('Google Sheets restore instructor warning:', err);
    }
  }

  return activeInstructor;
}

export async function deleteInstructorPermanent(userId: string): Promise<boolean> {
  const cleanId = String(userId).trim().toLowerCase();
  const archiveList = readLocalJson<ArchivedInstructor[]>('instructors_archive.json', []);
  const targetIdx = archiveList.findIndex(
    (inst) => (inst.id || '').trim().toLowerCase() === cleanId || (inst.email || '').trim().toLowerCase() === cleanId
  );

  if (targetIdx === -1) {
    return false;
  }

  archiveList.splice(targetIdx, 1);
  writeLocalJson('instructors_archive.json', archiveList);

  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const archiveRows = await gClient.getValues('Instructors_Archive!A2:A');
      if (archiveRows && archiveRows.length > 0) {
        for (let i = 0; i < archiveRows.length; i++) {
          if ((archiveRows[i][0] || '').trim().toLowerCase() === cleanId) {
            const rowNum = i + 2;
            const emptyRow = Array(12).fill('');
            await gClient.updateValues(`Instructors_Archive!A${rowNum}:L${rowNum}`, [emptyRow]);
          }
        }
      }
    } catch (err) {
      console.warn('Google Sheets permanent delete error:', err);
    }
  }

  return true;
}

