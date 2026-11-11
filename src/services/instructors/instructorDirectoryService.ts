import { InstructorAccount, UserRole } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from '../storageHelper';
import { getTimetables } from '../courseService';
import { stripLeadingTitles } from '@/lib/utils/name-matcher';

// ----------------- INSTRUCTORS & AUTH -----------------

export async function syncInstructorToSheet(instructor: InstructorAccount): Promise<void> {
  const gClient = getSheetsClient();
  if (!gClient) return;

  try {
    await gClient.ensureSheetsExist(['Instructors']);
    const rows = await gClient.getValues('Instructors!A2:E');
    const cleanId = (instructor.id || '').trim().toLowerCase();
    const cleanEmail = (instructor.email || '').trim().toLowerCase();
    const cleanGmail = (instructor.gmail || '').trim().toLowerCase();

    let rowIndex = -1;
    if (rows && rows.length > 0) {
      rowIndex = rows.findIndex((r) => {
        const rId = (r[0] || '').trim().toLowerCase();
        const isCol2Email = (r[2] || '').includes('@');
        const rEmail = isCol2Email ? (r[2] || '').trim().toLowerCase() : (r[3] || '').trim().toLowerCase();
        const rGmail = isCol2Email ? (r[3] || '').trim().toLowerCase() : (r[4] || '').trim().toLowerCase();
        return (
          (cleanId && rId === cleanId) ||
          (cleanEmail && rEmail === cleanEmail) ||
          (cleanGmail && rGmail === cleanGmail)
        );
      });
    }

    const rowData = [
      instructor.id || '',
      instructor.name || '',
      instructor.nameEn || '',
      instructor.email || '',
      instructor.gmail || '',
      instructor.department || 'คณะพุทธศาสตร์ มจร',
      instructor.instructorType || 'อาจารย์ประจำ',
      instructor.role || 'INSTRUCTOR',
      instructor.isActive !== false ? 'TRUE' : 'FALSE',
      instructor.isSuspended ? 'TRUE' : 'FALSE',
      Array.isArray(instructor.aliases) ? instructor.aliases.join(';') : (instructor.aliases || ''),
      instructor.updatedAt || new Date().toISOString(),
    ];

    if (rowIndex !== -1) {
      const sheetRowNum = rowIndex + 2;
      await gClient.updateValues(`Instructors!A${sheetRowNum}:L${sheetRowNum}`, [rowData]);
    } else {
      await gClient.appendValues('Instructors!A:L', [rowData]);
    }
  } catch (err) {
    console.warn('Google Sheets syncInstructorToSheet warning:', err);
  }
}

export async function getInstructorAccounts(): Promise<InstructorAccount[]> {
  const localAccounts = readLocalJson<InstructorAccount[]>('instructors.json', []);
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Instructors!A2:L');
      if (rows && rows.length > 0) {
        const localById = new Map<string, InstructorAccount>();
        const localByEmail = new Map<string, InstructorAccount>();
        localAccounts.forEach((acc) => {
          if (acc.id) localById.set(acc.id.toLowerCase(), acc);
          if (acc.email) localByEmail.set(acc.email.toLowerCase(), acc);
          if (acc.gmail) localByEmail.set(acc.gmail.toLowerCase(), acc);
          if (acc.aliases) {
            acc.aliases.forEach((al) => {
              if (al && al.includes('@')) localByEmail.set(al.toLowerCase(), acc);
            });
          }
        });

        const seenIds = new Set<string>();
        const merged = rows.flatMap((r): InstructorAccount[] => {
          const hasAtInCol2 = (r[2] || '').includes('@');
          const id = (r[0] || '').trim();
          const name = (r[1] || '').trim();
          let nameEn = '';
          let email = '';
          let gmail = '';
          let department = 'คณะพุทธศาสตร์ มจร';
          let instructorType = 'อาจารย์ประจำ';
          let role = 'INSTRUCTOR';
          let isActive = true;
          let isSuspended = false;
          let aliases: string[] = [];
          let updatedAt = '';

          if (hasAtInCol2) {
            // Legacy 9-col schema: id, name, email, gmail, department, role, isActive, isSuspended, createdAt
            email = (r[2] || '').trim().toLowerCase();
            gmail = (r[3] || '').trim().toLowerCase();
            department = (r[4] || '').trim() || 'คณะพุทธศาสตร์ มจร';
            role = (r[5] || '').trim() || 'INSTRUCTOR';
            isActive = r[6] !== 'FALSE';
            isSuspended = r[7] === 'TRUE';
            updatedAt = r[8] || '';
          } else {
            // Standard 12-col schema: id, name, nameEn, email, gmail, department, instructorType, role, isActive, isSuspended, aliases, updatedAt
            nameEn = (r[2] || '').trim();
            email = (r[3] || '').trim().toLowerCase();
            gmail = (r[4] || '').trim().toLowerCase();
            department = (r[5] || '').trim() || 'คณะพุทธศาสตร์ มจร';
            instructorType = (r[6] || '').trim() || 'อาจารย์ประจำ';
            role = (r[7] || '').trim() || 'INSTRUCTOR';
            isActive = r[8] !== 'FALSE';
            isSuspended = r[9] === 'TRUE';
            aliases = (r[10] || '').split(';').map((s: string) => s.trim()).filter(Boolean);
            updatedAt = r[11] || '';
          }

          // Skip completely empty cleared rows
          if (!id && !name && !email && !gmail) {
            return [];
          }

          const localMatch =
            (id ? localById.get(id.toLowerCase()) : undefined) ||
            (email ? localByEmail.get(email.toLowerCase()) : undefined) ||
            (gmail ? localByEmail.get(gmail.toLowerCase()) : undefined);

          // Skip duplicate sheet rows that already merged into an earlier local account (e.g. previousIds)
          const resolvedIdKey = (id || localMatch?.id || '').toLowerCase();
          if (localMatch?.id && seenIds.has(localMatch.id.toLowerCase()) && id.toLowerCase() !== localMatch.id.toLowerCase()) {
            return [];
          }
          if (resolvedIdKey && seenIds.has(resolvedIdKey)) {
            return [];
          }

          if (localMatch?.id) seenIds.add(localMatch.id.toLowerCase());
          if (id) seenIds.add(id.toLowerCase());

          // Google Sheet values are persistent cloud truth on Vercel
          const effectiveEmail = email || localMatch?.email || '';
          const effectiveGmail = gmail || localMatch?.gmail || '';
          const effectiveRole = (role as any) || localMatch?.role || 'INSTRUCTOR';
          const isSuper =
            effectiveEmail === 'phaisal.dis@mcu.ac.th' ||
            effectiveRole === 'SUPER_ADMIN' ||
            Boolean(localMatch?.isSuperAdmin);

          const combinedAliases = Array.from(
            new Set([
              ...(localMatch?.aliases || []),
              ...aliases,
              name,
              nameEn,
              effectiveEmail,
              effectiveGmail,
            ].filter(Boolean))
          );

          return [{
            ...(localMatch || {}),
            id: id || localMatch?.id || 'inst-' + Date.now(),
            name: name || localMatch?.name || '',
            nameEn: nameEn || localMatch?.nameEn || '',
            email: effectiveEmail,
            gmail: effectiveGmail,
            department: department || localMatch?.department || 'คณะพุทธศาสตร์ มจร',
            instructorType: instructorType || localMatch?.instructorType || 'อาจารย์ประจำ',
            role: isSuper ? 'SUPER_ADMIN' : effectiveRole,
            isActive: isActive,
            isSuspended: isSuspended,
            aliases: combinedAliases,
            createdAt: localMatch?.createdAt || updatedAt || '',
            updatedAt: updatedAt || localMatch?.updatedAt || '',
            isSuperAdmin: isSuper,
          } as InstructorAccount];
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

  // Sync newly created instructors to Google Sheets
  for (const c of candidatesToCreate) {
    if (!c.name || !c.email) continue;
    const cleanEmail = c.email.trim().toLowerCase();
    const acc = list.find((u) => u.email?.toLowerCase() === cleanEmail);
    if (acc) {
      await syncInstructorToSheet(acc);
    }
  }

  return { createdCount, linkedCount };
}

// ----------------- BATCH IMPORT & BULK UPDATE INSTRUCTORS -----------------

export interface BatchImportInstructorItem {
  name: string;
  nameEn?: string;
  email?: string;
  gmail?: string;
  department?: string;
  instructorType?: string; // 'อาจารย์ประจำ' | 'อาจารย์พิเศษ' | 'ผู้ช่วยสอน (TA)'
  role?: UserRole;
  password?: string;
}

export async function batchImportInstructors(
  items: BatchImportInstructorItem[]
): Promise<{
  createdCount: number;
  updatedCount: number;
  errors: string[];
  processed: Array<{ name: string; email: string; action: 'CREATED' | 'UPDATED' }>;
}> {
  const list = readLocalJson<InstructorAccount[]>('instructors.json', []);
  let createdCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];
  const processed: Array<{ name: string; email: string; action: 'CREATED' | 'UPDATED' }> = [];

  for (const item of items) {
    if (!item.name || !item.name.trim()) {
      errors.push('พบข้อมูลที่ไม่มีชื่ออาจารย์');
      continue;
    }

    const cleanName = item.name.trim();
    const cleanEmail = item.email ? item.email.trim().toLowerCase() : '';
    const strippedName = stripLeadingTitles(cleanName);

    // 1. Try to find existing instructor by email OR name
    const found = list.find((u) => {
      if (cleanEmail && ((u.email || '').toLowerCase() === cleanEmail || (u.gmail || '').toLowerCase() === cleanEmail)) {
        return true;
      }
      if (u.name.trim() === cleanName) return true;
      if (u.aliases && u.aliases.some((al) => al.trim() === cleanName || al.trim() === strippedName)) return true;
      if (stripLeadingTitles(u.name || '') === strippedName && strippedName.length >= 3) return true;
      return false;
    });

    if (found) {
      // UPDATE existing instructor
      if (item.department && item.department.trim()) {
        found.department = item.department.trim();
      }
      if (item.instructorType && item.instructorType.trim()) {
        found.instructorType = item.instructorType.trim();
      }
      if (item.nameEn && item.nameEn.trim()) {
        found.nameEn = item.nameEn.trim();
      }
      if (cleanEmail && !found.email) {
        found.email = cleanEmail;
      }
      if (item.gmail && item.gmail.trim()) {
        found.gmail = item.gmail.trim().toLowerCase();
      }
      if (item.role) {
        found.role = item.role;
      }
      if (!found.aliases) found.aliases = [found.name];
      if (!found.aliases.includes(cleanName)) {
        found.aliases.push(cleanName);
      }
      found.updatedAt = new Date().toISOString();
      updatedCount++;
      processed.push({ name: cleanName, email: found.email, action: 'UPDATED' });
    } else {
      // CREATE new instructor
      const newId = 'inst-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      let assignedEmail = cleanEmail;
      if (!assignedEmail) {
        const randomNum = Math.floor(100 + Math.random() * 900);
        assignedEmail = `teacher${randomNum}@mcu.ac.th`;
      }

      // Check if assignedEmail is already used by another account, if so add random salt
      while (list.some((u) => (u.email || '').toLowerCase() === assignedEmail.toLowerCase())) {
        const salt = Math.floor(1000 + Math.random() * 9000);
        assignedEmail = `teacher${salt}@mcu.ac.th`;
      }

      const newAcc: InstructorAccount = {
        id: newId,
        name: cleanName,
        nameEn: item.nameEn ? item.nameEn.trim() : undefined,
        email: assignedEmail,
        gmail: item.gmail ? item.gmail.trim().toLowerCase() : `${assignedEmail.split('@')[0]}@gmail.com`,
        password: item.password || 'mcu123456',
        defaultPassword: 'mcu123456',
        department: item.department ? item.department.trim() : 'คณะพุทธศาสตร์ มจร',
        instructorType: item.instructorType ? item.instructorType.trim() : 'อาจารย์ประจำ',
        role: item.role || 'INSTRUCTOR',
        coursesCount: 0,
        isActive: true,
        aliases: [cleanName],
        createdAt: new Date().toISOString(),
      };

      list.unshift(newAcc);
      createdCount++;
      processed.push({ name: cleanName, email: assignedEmail, action: 'CREATED' });
    }
  }

  writeLocalJson('instructors.json', list);

  // Sync to sheets in background for new or updated
  for (const p of processed) {
    const acc = list.find((u) => u.email === p.email);
    if (acc) {
      syncInstructorToSheet(acc).catch(() => {});
    }
  }

  return { createdCount, updatedCount, errors, processed };
}
