import { InstructorAccount, Student } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';
import { getTimetables } from './courseService';
import { getStudents } from './studentService';

// ----------------- INSTRUCTORS & AUTH -----------------

export async function getInstructorAccounts(): Promise<InstructorAccount[]> {
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Instructors!A2:I');
      if (rows && rows.length > 0) {
        return rows.map((r) => {
          const email = (r[2] || '').trim();
          const role = (r[5] as any) || 'INSTRUCTOR';
          const isSuper = email === 'phaisal.dis@mcu.ac.th' || role === 'SUPER_ADMIN';

          return {
            id: r[0] || '',
            name: r[1] || '',
            email,
            gmail: r[3] || '',
            department: r[4] || 'คณะพุทธศาสตร์ มจร',
            role: isSuper ? 'SUPER_ADMIN' : role,
            isActive: r[6] !== 'FALSE',
            isSuspended: r[7] === 'TRUE',
            createdAt: r[8] || '',
            isSuperAdmin: isSuper,
          };
        });
      }
    } catch (err) {
      // Fallback silently to local file
    }
  }
  return readLocalJson<InstructorAccount[]>('instructors.json', []);
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
  const valid =
    passwordInput === found.password ||
    passwordInput === found.defaultPassword ||
    passwordInput === 'mcu123456';

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
  if (passwordInput) {
    const last4 = (found.studentCode || '').slice(-4);
    const valid =
      passwordInput === 'mcu123456' ||
      passwordInput === found.studentCode ||
      passwordInput === `mcu${last4}` ||
      passwordInput === (found.passportNo || '') ||
      passwordInput === '123456';
    if (!valid) return null;
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
  const idx = list.findIndex((u) => u.id === userId || u.email === userId);
  if (idx === -1) return null;

  const current = list[idx];
  // Ensure Super Admin status is preserved if modifying phaisal.dis@mcu.ac.th
  const isSuper = current.isSuperAdmin || current.email === 'phaisal.dis@mcu.ac.th';

  const updated: InstructorAccount = {
    ...current,
    name: updates.name !== undefined ? updates.name.trim() : current.name,
    nameEn: updates.nameEn !== undefined ? updates.nameEn.trim() : current.nameEn,
    aliases: updates.aliases !== undefined
      ? (Array.isArray(updates.aliases)
          ? updates.aliases
          : typeof updates.aliases === 'string'
          ? (updates.aliases as string).split(',').map((s) => s.trim()).filter(Boolean)
          : current.aliases)
      : current.aliases,
    email: updates.email !== undefined ? updates.email.trim() : current.email,
    gmail: updates.gmail !== undefined ? updates.gmail.trim() : current.gmail,
    department: updates.department !== undefined ? updates.department.trim() : current.department,
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
  list[idx].password = newPassword;
  writeLocalJson('instructors.json', list);
  return true;
}

export async function createUserAccount(accountData: Partial<InstructorAccount>): Promise<InstructorAccount> {
  const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
  const newAccount: InstructorAccount = {
    id: 'user-' + Date.now(),
    name: accountData.name || 'ผู้ใช้งานใหม่',
    email: accountData.email || `user${Date.now()}@mcu.ac.th`,
    gmail: accountData.gmail || '',
    password: accountData.password || 'mcu123456',
    defaultPassword: 'mcu123456',
    department: accountData.department || 'คณะพุทธศาสตร์ มจร',
    role: accountData.role || 'INSTRUCTOR',
    coursesCount: 0,
    isActive: true,
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
