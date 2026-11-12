import { Student, ArchivedStudent } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';
import { hashPassword } from '@/lib/auth-security';

// ----------------- STUDENTS -----------------

export async function getStudents(): Promise<Student[]> {
  const localList = readLocalJson<any[]>('students.json', []);
  const localMap = new Map<string, any>();
  localList.forEach((s) => {
    if (s.studentCode) localMap.set(s.studentCode, s);
  });

  const gClient = getSheetsClient();
  let students: Student[] = [];

  if (gClient) {
    try {
      const rows = await gClient.getValues('Students!A1:U');
      if (rows && rows.length > 0) {
        const firstCell = String(rows[0][0] || '').trim().toLowerCase();
        const startIndex = firstCell.includes('code') || firstCell.includes('รหัส') ? 1 : 0;
        const dataRows = rows.slice(startIndex);
        students = dataRows
          .filter((r) => r && r[0] && String(r[0]).trim() !== '')
          .map((r) => {
            const code = (r[0] || '').trim();
            const local = localMap.get(code) || {};
            const sheetNat = r[15] || local.nationality || '';
            const isThaiNat = sheetNat === 'ไทย' || sheetNat === 'Thai';
            const programFromSheet = r[13] ? (r[13].includes('ENG') ? 'ENGLISH' : 'THAI') : undefined;
            const cleanLast = (r[3] || local.lastName || '') === '-' ? '' : (r[3] || local.lastName || '');
            const sheetPassword = r[19] ? String(r[19]).trim() : '';
            const sheetActingOfficer = r[20] !== undefined && r[20] !== '' ? String(r[20]).trim().toUpperCase() : undefined;

            return {
              ...local,
              studentCode: code,
              title: r[1] || local.title || '',
              firstName: r[2] || local.firstName || '',
              lastName: cleanLast,
              fullName: r[4] || `${r[1] || ''} ${r[2] || ''} ${cleanLast}`.replace(/\s+/g, ' ').trim(),
              yearLevel: r[5] ? parseInt(r[5], 10) : (local.yearLevel || 1),
              degree: r[6] || local.degree || 'ปริญญาตรี',
              department: r[7] || local.department || '',
              major: r[8] || local.major || '',
              studyStatus: r[9] || local.studyStatus || 'ปกติ',
              faculty: r[10] || local.faculty || '',
              phoneNumber: r[11] || local.phoneNumber || '',
              email: r[12] || local.email || '',
              programType: programFromSheet || local.programType || (isThaiNat ? 'THAI' : 'ENGLISH'),
              remarks: r[14] !== undefined && r[14] !== '' ? r[14] : (local.remarks || ''),
              nationality: sheetNat || (programFromSheet === 'ENGLISH' ? 'ต่างชาติ' : 'ไทย'),
              passportNo: r[16] || local.passportNo || '',
              gpa: r[17] !== undefined && r[17] !== '' ? r[17] : (local.gpa ?? ''),
              address: r[18] || local.address || '',
              password: local.password || sheetPassword || undefined,
              hasChangedPassword: Boolean(local.hasChangedPassword || sheetPassword),
              isActingOfficer:
                sheetActingOfficer === 'TRUE'
                  ? true
                  : sheetActingOfficer === 'FALSE'
                  ? false
                  : Boolean(local.isActingOfficer),
            };
          });
      }
    } catch (err) {
      console.warn('Google Sheets read error for Students, falling back to local file:', err);
    }
  }

  if (students.length === 0) {
    students = localList.map((s) => ({
      ...s,
      fullName: `${s.title || ''} ${s.firstName || ''} ${s.lastName === '-' ? '' : (s.lastName || '')}`.trim(),
      programType: s.programType || (s.nationality === 'ไทย' || s.nationality === 'Thai' ? 'THAI' : 'ENGLISH'),
      remarks: s.remarks || '',
    }));
  }

  // Filter out empty studentCodes and deduplicate by studentCode
  const seen = new Set<string>();
  return students.filter((s) => {
    const cleanCode = String(s.studentCode || '').trim();
    if (!cleanCode) return false;
    if (seen.has(cleanCode)) return false;
    seen.add(cleanCode);
    return true;
  });
}

export const INACTIVE_STUDY_STATUSES = [
  'สำเร็จการศึกษา',
  'จบการศึกษา',
  'พ้นสภาพ',
  'พ้นสภาพนิสิต',
  'ลาออก',
  'ย้ายออก',
  'จำหน่าย',
  'จำหน่ายออก',
];

export function isInactiveStudyStatus(status?: string): boolean {
  if (!status) return false;
  const s = status.trim();
  return INACTIVE_STUDY_STATUSES.some((inactive) => s === inactive || s.includes(inactive));
}

export function deriveStudyStatusFromReason(currentStatus?: string, reason?: string): string {
  const r = (reason || '').trim();
  if (r.includes('สำเร็จการศึกษา') || r.includes('Graduated')) return 'สำเร็จการศึกษา';
  if (r.includes('ลาออก') || r.includes('Resigned')) return 'ลาออก';
  if (r.includes('ย้ายออก') || r.includes('Transferred')) return 'ย้ายออก';
  if (r.includes('พ้นสภาพ') || r.includes('Retired')) return 'พ้นสภาพ';
  if (currentStatus && isInactiveStudyStatus(currentStatus)) return currentStatus;
  return r || currentStatus || 'จำหน่ายออก';
}

export async function updateStudent(studentCode: string, updates: Partial<Student>): Promise<Student | null> {
  const localList = readLocalJson<any[]>('students.json', []);
  let idx = localList.findIndex((s) => s.studentCode === studentCode);
  if (idx === -1) {
    const allStudents = await getStudents();
    const fromSheet = allStudents.find((s) => s.studentCode === studentCode);
    if (!fromSheet) return null;
    localList.push({ ...fromSheet });
    idx = localList.length - 1;
  }

  const current = localList[idx];
  const updated: Student = {
    ...current,
    ...updates,
    fullName: updates.fullName || `${updates.title || current.title || ''} ${updates.firstName || current.firstName || ''} ${updates.lastName || current.lastName || ''}`.trim(),
    programType: updates.programType || current.programType || (updates.nationality === 'ไทย' || current.nationality === 'ไทย' ? 'THAI' : 'ENGLISH'),
    remarks: updates.remarks !== undefined ? updates.remarks : (current.remarks || ''),
  };

  localList[idx] = updated;
  writeLocalJson('students.json', localList);

  // If the updated studyStatus is an inactive status (สำเร็จการศึกษา, พ้นสภาพ, ลาออก, ย้ายออก),
  // automatically move this student out of active Students registry into Students_Archive!
  if (isInactiveStudyStatus(updated.studyStatus)) {
    await deleteStudents(
      [updated.studentCode],
      'ระบบอัตโนมัติ (ปรับสถานะนิสิต)',
      `${updated.studyStatus}${updated.remarks ? ` (${updated.remarks})` : ''}`
    );
    return updated;
  }

  // If Google Sheets client is available, update row if matching
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Students!A2:A');
      if (rows && rows.length > 0) {
        const rowIndex = rows.findIndex((r) => r[0] === studentCode);
        if (rowIndex !== -1) {
          const sheetRowNum = rowIndex + 2;
          await gClient.updateValues(`Students!A${sheetRowNum}:S${sheetRowNum}`, [[
            updated.studentCode,
            updated.title || '',
            updated.firstName,
            updated.lastName,
            updated.fullName,
            String(updated.yearLevel || 1),
            updated.degree || 'ปริญญาตรี',
            updated.department || '',
            updated.major || '',
            updated.studyStatus || 'ปกติ',
            updated.faculty || '',
            updated.phoneNumber || '',
            updated.email || '',
            updated.programType === 'ENGLISH' ? 'หลักสูตรภาคภาษาอังกฤษ (ENGLISH)' : 'หลักสูตรภาคภาษาไทย (THAI)',
            updated.remarks || '',
            updated.nationality || '',
            updated.passportNo || '',
            updated.gpa !== undefined && updated.gpa !== null ? String(updated.gpa) : '',
            updated.address || '',
          ]]);
        }
      }
    } catch (err) {
      console.warn('Google Sheets update student failed:', err);
    }
  }

  return updated;
}

export async function updateStudentPassword(studentCode: string, newPassword: string): Promise<boolean> {
  const localList = readLocalJson<any[]>('students.json', []);
  const cleanCode = (studentCode || '').trim().toLowerCase();
  const codeOnly = cleanCode.replace(/@mcu\.ac\.th$/i, '').trim();

  let idx = localList.findIndex(
    (s) =>
      (s.studentCode || '').trim().toLowerCase() === cleanCode ||
      (s.studentCode || '').trim().toLowerCase() === codeOnly ||
      (s.id || '').trim().toLowerCase() === cleanCode ||
      (s.email || '').trim().toLowerCase() === cleanCode
  );

  // If student exists in Google Sheets but not yet in local students.json, hydrate from getStudents()
  let resolvedCode = idx !== -1 ? String(localList[idx].studentCode || codeOnly).trim() : '';
  if (idx === -1) {
    const allStudents = await getStudents();
    const matchedFromSheet = allStudents.find(
      (s) =>
        (s.studentCode || '').trim().toLowerCase() === cleanCode ||
        (s.studentCode || '').trim().toLowerCase() === codeOnly ||
        (s.id || '').trim().toLowerCase() === cleanCode ||
        (s.email || '').trim().toLowerCase() === cleanCode
    );
    if (!matchedFromSheet) return false;
    resolvedCode = matchedFromSheet.studentCode;
    localList.push({ ...matchedFromSheet });
    idx = localList.length - 1;
  }

  const hashedPassword = await hashPassword(newPassword);
  localList[idx].password = hashedPassword;
  localList[idx].hasChangedPassword = true;
  localList[idx].updatedAt = new Date().toISOString();
  writeLocalJson('students.json', localList);

  // Persist hashed password to Google Sheets (Column T) so it survives Vercel serverless cold starts
  const gClient = getSheetsClient();
  if (gClient && resolvedCode) {
    try {
      const rows = await gClient.getValues('Students!A1:A');
      if (rows && rows.length > 0) {
        const rowIndex = rows.findIndex((r) => String(r[0] || '').trim().toLowerCase() === resolvedCode.toLowerCase());
        if (rowIndex !== -1) {
          const sheetRowNum = rowIndex + 1;
          await gClient.updateValues(`Students!T${sheetRowNum}`, [[hashedPassword]]);
        }
      }
    } catch (err) {
      console.warn('Google Sheets update student password failed:', err);
    }
  }

  return true;
}

export async function batchUpdateStudents(
  updatesList: Partial<Student>[],
  mode: 'UPDATE_ONLY' | 'UPSERT' = 'UPDATE_ONLY'
): Promise<{ updated: number; added: number; archived: number; total: number; matchedCodes: string[]; notFoundCodes: string[] }> {
  const localList = readLocalJson<Student[]>('students.json', []);
  const allFromSheets = await getStudents();
  const localCodes = new Set(localList.map((s) => String(s.studentCode || '').trim()));
  for (const s of allFromSheets) {
    const c = String(s.studentCode || '').trim();
    if (c && !localCodes.has(c)) {
      localList.push({ ...s });
      localCodes.add(c);
    }
  }

  let updatedCount = 0;
  let addedCount = 0;
  const matchedCodes: string[] = [];
  const notFoundCodes: string[] = [];
  const codesToArchive: { code: string; reason: string }[] = [];

  for (const item of updatesList) {
    if (!item.studentCode) continue;
    const cleanCode = String(item.studentCode).trim();
    const idx = localList.findIndex((s) => s.studentCode === cleanCode);

    if (idx !== -1) {
      const current = localList[idx];
      const updatedItem: Student = {
        ...current,
        ...item,
        studentCode: cleanCode,
        fullName: item.fullName || (item.firstName || item.lastName || item.title
          ? `${item.title || current.title || ''} ${item.firstName || current.firstName || ''} ${item.lastName || current.lastName || ''}`.trim()
          : current.fullName),
        degree: item.degree || current.degree || 'ปริญญาตรี',
        programType: item.programType || current.programType || (current.nationality === 'ไทย' || current.nationality === 'Thai' ? 'THAI' : 'ENGLISH'),
        studyStatus: item.studyStatus || current.studyStatus || 'ปกติ',
        remarks: item.remarks !== undefined ? item.remarks : (current.remarks || ''),
        yearLevel: item.yearLevel !== undefined ? Number(item.yearLevel) : current.yearLevel,
      };
      localList[idx] = updatedItem;
      updatedCount++;
      matchedCodes.push(cleanCode);
      if (isInactiveStudyStatus(updatedItem.studyStatus)) {
        codesToArchive.push({
          code: cleanCode,
          reason: `${updatedItem.studyStatus}${updatedItem.remarks ? ` (${updatedItem.remarks})` : ''}`,
        });
      }
    } else {
      notFoundCodes.push(cleanCode);
      if (mode === 'UPSERT' && (item.firstName || item.fullName)) {
        const newItem: Student = {
          studentCode: cleanCode,
          title: item.title || '',
          firstName: item.firstName || '',
          lastName: item.lastName || '',
          fullName: item.fullName || `${item.title || ''} ${item.firstName || ''} ${item.lastName || ''}`.trim(),
          yearLevel: Number(item.yearLevel) || 1,
          degree: item.degree || 'ปริญญาตรี',
          department: item.department || '',
          major: item.major || 'พระพุทธศาสนา',
          studyStatus: item.studyStatus || 'ปกติ',
          faculty: item.faculty || 'คณะพุทธศาสตร์',
          phoneNumber: '',
          email: item.email || '',
          nationality: item.nationality || 'ไทย',
          country: item.country || (item.nationality === 'ไทย' || !item.nationality ? 'ไทย' : item.nationality),
          passportNo: item.passportNo || '',
          gpa: item.gpa !== undefined ? item.gpa : '',
          address: item.address || '',
          programType: item.programType || 'THAI',
          remarks: item.remarks || '',
          isActive: true,
        };
        localList.push(newItem);
        addedCount++;
        if (isInactiveStudyStatus(newItem.studyStatus)) {
          codesToArchive.push({
            code: cleanCode,
            reason: `${newItem.studyStatus}${newItem.remarks ? ` (${newItem.remarks})` : ''}`,
          });
        }
      }
    }
  }

  writeLocalJson('students.json', localList);

  // Sync to Google Sheets if available (Single Batch Update to avoid API rate limits & Vercel timeouts)
  const gClient = getSheetsClient();
  if (gClient && (updatedCount > 0 || addedCount > 0)) {
    try {
      const toSheetRow = (student: Student) => [
        student.studentCode,
        student.title || '',
        student.firstName || '',
        student.lastName || '',
        student.fullName || '',
        String(student.yearLevel || 1),
        student.degree || 'ปริญญาตรี',
        student.department || '',
        student.major || 'พระพุทธศาสนา',
        student.studyStatus || 'ปกติ',
        student.faculty || 'คณะพุทธศาสตร์',
        student.phoneNumber || '',
        student.email || '',
        student.programType === 'ENGLISH' ? 'หลักสูตรภาคภาษาอังกฤษ (ENGLISH)' : 'หลักสูตรภาคภาษาไทย (THAI)',
        student.remarks || '',
        student.nationality || '',
        student.passportNo || '',
        student.gpa !== undefined && student.gpa !== null ? String(student.gpa) : '',
        student.address || '',
      ];

      const studentByCode = new Map<string, Student>();
      localList.forEach((s) => {
        if (s.studentCode) studentByCode.set(s.studentCode.trim(), s);
      });

      const existingSheetRows = await gClient.getValues('Students!A2:S');
      const codeToRowMap = new Map<string, number>();

      if (existingSheetRows && existingSheetRows.length > 0) {
        const mergedSheetRows = existingSheetRows.map((row, i) => {
          const code = (row[0] || '').trim();
          if (code) {
            codeToRowMap.set(code, i + 2);
            const updatedStudent = studentByCode.get(code);
            if (updatedStudent && matchedCodes.includes(code)) {
              return toSheetRow(updatedStudent);
            }
          }
          // Pad existing row to 19 columns (A:S)
          const padded = [...row];
          while (padded.length < 19) padded.push('');
          return padded.slice(0, 19);
        });

        await gClient.updateValues(`Students!A2:S${mergedSheetRows.length + 1}`, mergedSheetRows);
      }

      // Append any newly added students (mode === 'UPSERT') to Google Sheets Students!A:S
      if (addedCount > 0) {
        const newStudentsToAppend = localList
          .slice(-addedCount)
          .filter((s) => !codeToRowMap.has(s.studentCode));
        if (newStudentsToAppend.length > 0) {
          const appendValues = newStudentsToAppend.map(toSheetRow);
          await gClient.appendValues('Students!A:S', appendValues);
        }
      }
    } catch (err) {
      console.warn('Google Sheets batch update student failed:', err);
    }
  }

  // Automatically archive any students whose status became สำเร็จการศึกษา, พ้นสภาพ, ลาออก, ย้ายออก
  let archivedCount = 0;
  if (codesToArchive.length > 0) {
    const archiveRes = await deleteStudents(
      codesToArchive.map((c) => c.code),
      'ระบบอัตโนมัติ (เลื่อนชั้นปี/ปรับสถานะนิสิต)',
      codesToArchive.length === 1 ? codesToArchive[0].reason : 'สำเร็จการศึกษา / พ้นสภาพ / ลาออก / ย้ายออก'
    );
    archivedCount = archiveRes.archivedCount;
  }

  return {
    updated: updatedCount,
    added: addedCount,
    archived: archivedCount,
    total: localList.length - archivedCount,
    matchedCodes,
    notFoundCodes,
  };
}

export async function deleteStudents(
  studentCodes: string[],
  deletedBy: string = 'ผู้ดูแลระบบ (Admin)',
  reason: string = 'จำหน่าย/ลบข้อมูลนิสิตออกจากทะเบียน'
): Promise<{ deletedCount: number; deletedCodes: string[]; remainingCount: number; archivedCount: number }> {
  const codesSet = new Set(studentCodes.map((c) => String(c).trim().toLowerCase()));
  const allCurrentStudents = await getStudents();
  const localList = readLocalJson<Student[]>('students.json', []);
  const archiveList = readLocalJson<ArchivedStudent[]>('students_archive.json', []);

  // Merge allCurrentStudents with localList so any student in Google Sheets is properly archived
  const mergedMap = new Map<string, Student>();
  localList.forEach((s) => {
    if (s.studentCode) mergedMap.set(String(s.studentCode).trim().toLowerCase(), s);
  });
  allCurrentStudents.forEach((s) => {
    if (s.studentCode) mergedMap.set(String(s.studentCode).trim().toLowerCase(), s);
  });
  const fullStudentList = Array.from(mergedMap.values());

  const originalCount = fullStudentList.length;
  const deletedCodes: string[] = [];
  const studentsToArchive: ArchivedStudent[] = [];

  const nowIso = new Date().toISOString();
  const thaiDateStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

  const remainingList = fullStudentList.filter((s) => {
    const code = String(s.studentCode || '').trim().toLowerCase();
    if (codesSet.has(code)) {
      deletedCodes.push(s.studentCode);
      const finalStudyStatus = deriveStudyStatusFromReason(s.studyStatus, reason);
      const finalReason = isInactiveStudyStatus(s.studyStatus) && reason.includes('สำเร็จการศึกษา / พ้นสภาพ')
        ? `${s.studyStatus}${s.remarks ? ` (${s.remarks})` : ''}`
        : reason;
      studentsToArchive.push({
        ...s,
        studyStatus: finalStudyStatus,
        archivedAt: nowIso,
        deletedAt: nowIso,
        deletedBy,
        deletionReason: finalReason,
      });
      return false;
    }
    return true;
  });

  const deletedCount = originalCount - remainingList.length;

  // 1. Update local files (students.json & students_archive.json)
  writeLocalJson('students.json', remainingList);
  if (studentsToArchive.length > 0) {
    const existingArchiveCodes = new Set(studentsToArchive.map((s) => String(s.studentCode).trim().toLowerCase()));
    const deduplicatedOldArchive = archiveList.filter(
      (s) => !existingArchiveCodes.has(String(s.studentCode).trim().toLowerCase())
    );
    const updatedArchive = [...studentsToArchive, ...deduplicatedOldArchive];
    writeLocalJson('students_archive.json', updatedArchive);
  }

  // 2. Synchronize with Google Sheets (Archive to Students_Archive sheet tab)
  const gClient = getSheetsClient();
  if (gClient && deletedCodes.length > 0) {
    try {
      // Ensure 'Students_Archive' sheet tab exists in Google Sheets
      await gClient.ensureSheetsExist(['Students_Archive']);

      // Check header in Students_Archive!A1:R1
      const archiveRows = await gClient.getValues('Students_Archive!A1:A2');
      if (!archiveRows || archiveRows.length === 0 || !archiveRows[0] || archiveRows[0].length === 0) {
        await gClient.updateValues('Students_Archive!A1:R1', [[
          'รหัสนิสิต',
          'คำนำหน้า',
          'ชื่อ',
          'นามสกุล',
          'ชื่อ-นามสกุล',
          'ชั้นปี',
          'ระดับการศึกษา',
          'ภาควิชา',
          'สาขาวิชา',
          'สถานภาพสุดท้าย',
          'คณะ',
          'เบอร์โทรศัพท์',
          'อีเมล',
          'หลักสูตร',
          'หมายเหตุเดิม',
          'วัน-เวลาที่ย้ายเข้าแฟ้มประวัติ (Archived At)',
          'ผู้ดำเนินการ (Archived By)',
          'สาเหตุการย้ายเข้าแฟ้มประวัติ (Reason)',
        ]]);
      }

      // Append archived students to Students_Archive!A:R
      const rowsToAppend = studentsToArchive.map((s) => [
        s.studentCode || '',
        s.title || '',
        s.firstName || '',
        s.lastName || '',
        s.fullName || '',
        String(s.yearLevel || 1),
        s.degree || '',
        s.department || '',
        s.major || '',
        s.studyStatus || 'จำหน่ายออก',
        s.faculty || '',
        s.phoneNumber || '',
        s.email || '',
        s.programType || 'THAI',
        s.remarks || '',
        thaiDateStr,
        deletedBy,
        s.deletionReason || reason,
      ]);
      await gClient.appendValues('Students_Archive!A:R', rowsToAppend);

      // Delete matching rows and compact any pre-existing blank rows in active Students sheet
      const activeRows = await gClient.getValues('Students!A1:A');
      if (activeRows && activeRows.length > 0) {
        const rowsToDelete: number[] = [];
        for (let i = 1; i < activeRows.length; i++) {
          const rowCode = String(activeRows[i]?.[0] || '').trim().toLowerCase();
          if (!rowCode || codesSet.has(rowCode)) {
            rowsToDelete.push(i);
          }
        }
        if (rowsToDelete.length > 0) {
          await gClient.deleteRows('Students', rowsToDelete);
        }
      }
    } catch (err) {
      console.warn('Google Sheets archive/delete student warning:', err);
    }
  }

  return {
    deletedCount,
    deletedCodes,
    remainingCount: remainingList.length,
    archivedCount: studentsToArchive.length,
  };
}

export async function archiveAllInactiveStudents(
  deletedBy: string = 'ผู้ดูแลระบบ (Admin)'
): Promise<{ archivedCount: number; archivedCodes: string[]; remainingCount: number }> {
  const allStudents = await getStudents();
  const inactiveStudents = allStudents.filter((s) => isInactiveStudyStatus(s.studyStatus));
  if (inactiveStudents.length === 0) {
    return {
      archivedCount: 0,
      archivedCodes: [],
      remainingCount: allStudents.length,
    };
  }
  const codes = inactiveStudents.map((s) => s.studentCode);
  const res = await deleteStudents(
    codes,
    deletedBy,
    'สำเร็จการศึกษา / พ้นสภาพ / ลาออก / ย้ายออก (ย้ายเข้าแฟ้มประวัตินิสิต)'
  );
  return {
    archivedCount: res.archivedCount,
    archivedCodes: res.deletedCodes,
    remainingCount: res.remainingCount,
  };
}

export async function deleteStudent(studentCode: string, deletedBy?: string, reason?: string) {
  return deleteStudents([studentCode], deletedBy, reason);
}

export async function getArchivedStudents(): Promise<ArchivedStudent[]> {
  const localArchive = readLocalJson<ArchivedStudent[]>('students_archive.json', []);
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Students_Archive!A2:R');
      if (rows && rows.length > 0) {
        const sheetArchived: ArchivedStudent[] = rows
          .filter((r) => r[0] && String(r[0]).trim())
          .map((r) => ({
            studentCode: String(r[0]).trim(),
            title: r[1] || '',
            firstName: r[2] || '',
            lastName: r[3] || '',
            fullName: r[4] || `${r[1] || ''} ${r[2] || ''} ${r[3] || ''}`.trim(),
            yearLevel: r[5] ? parseInt(r[5], 10) : 1,
            degree: r[6] || '',
            department: r[7] || '',
            major: r[8] || '',
            studyStatus: r[9] || 'จำหน่ายออก/ถูกลบ',
            faculty: r[10] || '',
            phoneNumber: r[11] || '',
            email: r[12] || '',
            programType: r[13] === 'ENGLISH' ? 'ENGLISH' : 'THAI',
            remarks: r[14] || '',
            archivedAt: r[15] || new Date().toISOString(),
            deletedAt: r[15] || new Date().toISOString(),
            deletedBy: r[16] || 'Admin',
            deletionReason: r[17] || 'ลบข้อมูลนิสิตออกจากระบบ',
          }));

        if (sheetArchived.length > 0) {
          // Merge with local archive (deduplicate by studentCode)
          const map = new Map<string, ArchivedStudent>();
          sheetArchived.forEach((s) => map.set(s.studentCode, s));
          localArchive.forEach((s) => {
            if (!map.has(s.studentCode)) map.set(s.studentCode, s);
          });
          return Array.from(map.values());
        }
      }
    } catch (err) {
      console.warn('Google Sheets read error for Students_Archive:', err);
    }
  }
  return localArchive;
}

export async function restoreStudent(studentCode: string): Promise<Student | null> {
  const codeClean = String(studentCode).trim().toLowerCase();
  const archiveList = await getArchivedStudents();
  const targetIdx = archiveList.findIndex((s) => String(s.studentCode).trim().toLowerCase() === codeClean);

  if (targetIdx === -1) {
    return null;
  }

  const restored = archiveList[targetIdx];
  const { archivedAt, deletedAt, deletedBy, deletionReason, ...rawActiveStudent } = restored;
  const activeStudent: Student = {
    ...rawActiveStudent,
    studyStatus: isInactiveStudyStatus(rawActiveStudent.studyStatus) ? 'ปกติ' : (rawActiveStudent.studyStatus || 'ปกติ'),
  };

  // 1. Remove from local archive
  const localArchive = readLocalJson<ArchivedStudent[]>('students_archive.json', []);
  const updatedLocalArchive = localArchive.filter(
    (s) => String(s.studentCode).trim().toLowerCase() !== codeClean
  );
  writeLocalJson('students_archive.json', updatedLocalArchive);

  // 2. Add back to active students
  const localList = readLocalJson<Student[]>('students.json', []);
  const filteredLocalList = localList.filter(
    (s) => String(s.studentCode).trim().toLowerCase() !== codeClean
  );
  filteredLocalList.unshift(activeStudent);
  writeLocalJson('students.json', filteredLocalList);

  // 3. Synchronize with Google Sheets
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      // Append back to active Students sheet
      await gClient.appendValues('Students!A:O', [[
        activeStudent.studentCode,
        activeStudent.title || '',
        activeStudent.firstName || '',
        activeStudent.lastName || '',
        activeStudent.fullName || '',
        String(activeStudent.yearLevel || 1),
        activeStudent.degree || '',
        activeStudent.department || '',
        activeStudent.major || '',
        activeStudent.studyStatus || 'ปกติ',
        activeStudent.faculty || '',
        activeStudent.phoneNumber || '',
        activeStudent.email || '',
        activeStudent.programType === 'ENGLISH' ? 'หลักสูตรภาคภาษาอังกฤษ (ENGLISH)' : 'หลักสูตรภาคภาษาไทย (THAI)',
        activeStudent.remarks || '',
      ]]);

      // Clear row from Students_Archive
      const archiveRows = await gClient.getValues('Students_Archive!A2:A');
      if (archiveRows && archiveRows.length > 0) {
        for (let i = 0; i < archiveRows.length; i++) {
          if ((archiveRows[i][0] || '').trim().toLowerCase() === codeClean) {
            const rowNum = i + 2;
            const emptyRow = Array(18).fill('');
            await gClient.updateValues(`Students_Archive!A${rowNum}:R${rowNum}`, [emptyRow]);
          }
        }
      }
    } catch (err) {
      console.warn('Google Sheets restore student warning:', err);
    }
  }

  return activeStudent;
}
