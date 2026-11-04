import { Student } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from './storageHelper';

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
      const rows = await gClient.getValues('Students!A1:O');
      if (rows && rows.length > 0) {
        const startIndex = rows[0][0]?.toLowerCase().includes('code') ? 1 : 0;
        const dataRows = rows.slice(startIndex);
        students = dataRows.map((r) => {
          const code = (r[0] || '').trim();
          const local = localMap.get(code) || {};
          const isThaiNat = (local.nationality === 'ไทย' || local.nationality === 'Thai');
          const programFromSheet = r[13] ? (r[13].includes('ENG') ? 'ENGLISH' : 'THAI') : undefined;

          return {
            ...local,
            studentCode: code,
            title: r[1] || local.title || '',
            firstName: r[2] || local.firstName || '',
            lastName: r[3] || local.lastName || '',
            fullName: r[4] || `${r[1] || ''} ${r[2] || ''} ${r[3] || ''}`.trim(),
            yearLevel: r[5] ? parseInt(r[5], 10) : (local.yearLevel || 1),
            degree: r[6] || local.degree || '',
            department: r[7] || local.department || '',
            major: r[8] || local.major || '',
            studyStatus: r[9] || local.studyStatus || 'ปกติ',
            faculty: r[10] || local.faculty || '',
            phoneNumber: r[11] || local.phoneNumber || '',
            email: r[12] || local.email || '',
            programType: programFromSheet || local.programType || (isThaiNat ? 'THAI' : 'ENGLISH'),
            remarks: r[14] !== undefined && r[14] !== '' ? r[14] : (local.remarks || ''),
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
      fullName: `${s.title || ''} ${s.firstName || ''} ${s.lastName || ''}`.trim(),
      programType: s.programType || (s.nationality === 'ไทย' || s.nationality === 'Thai' ? 'THAI' : 'ENGLISH'),
      remarks: s.remarks || '',
    }));
  }

  // Deduplicate by studentCode to prevent duplicate entries and React key collisions
  const seen = new Set<string>();
  return students.filter((s) => {
    if (!s.studentCode) return true;
    if (seen.has(s.studentCode)) return false;
    seen.add(s.studentCode);
    return true;
  });
}

export async function updateStudent(studentCode: string, updates: Partial<Student>): Promise<Student | null> {
  const localList = readLocalJson<any[]>('students.json', []);
  const idx = localList.findIndex((s) => s.studentCode === studentCode);
  if (idx === -1) return null;

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

  // If Google Sheets client is available, update row if matching
  const gClient = getSheetsClient();
  if (gClient) {
    try {
      const rows = await gClient.getValues('Students!A2:A');
      if (rows && rows.length > 0) {
        const rowIndex = rows.findIndex((r) => r[0] === studentCode);
        if (rowIndex !== -1) {
          const sheetRowNum = rowIndex + 2;
          await gClient.updateValues(`Students!A${sheetRowNum}:O${sheetRowNum}`, [[
            updated.studentCode,
            updated.title || '',
            updated.firstName,
            updated.lastName,
            updated.fullName,
            String(updated.yearLevel || 1),
            updated.degree || '',
            updated.department || '',
            updated.major || '',
            updated.studyStatus || 'ปกติ',
            updated.faculty || '',
            updated.phoneNumber || '',
            updated.email || '',
            updated.programType === 'ENGLISH' ? 'หลักสูตรภาคภาษาอังกฤษ (ENGLISH)' : 'หลักสูตรภาคภาษาไทย (THAI)',
            updated.remarks || '',
          ]]);
        }
      }
    } catch (err) {
      console.warn('Google Sheets update student failed:', err);
    }
  }

  return updated;
}

export async function batchUpdateStudents(
  updatesList: Partial<Student>[],
  mode: 'UPDATE_ONLY' | 'UPSERT' = 'UPDATE_ONLY'
): Promise<{ updated: number; added: number; total: number; matchedCodes: string[]; notFoundCodes: string[] }> {
  const localList = readLocalJson<Student[]>('students.json', []);
  let updatedCount = 0;
  let addedCount = 0;
  const matchedCodes: string[] = [];
  const notFoundCodes: string[] = [];

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
        programType: item.programType || current.programType || (current.nationality === 'ไทย' || current.nationality === 'Thai' ? 'THAI' : 'ENGLISH'),
        studyStatus: item.studyStatus || current.studyStatus || 'ปกติ',
        remarks: item.remarks !== undefined ? item.remarks : (current.remarks || ''),
        yearLevel: item.yearLevel !== undefined ? Number(item.yearLevel) : current.yearLevel,
      };
      localList[idx] = updatedItem;
      updatedCount++;
      matchedCodes.push(cleanCode);
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
          phoneNumber: item.phoneNumber || '',
          email: item.email || '',
          nationality: item.nationality || 'ไทย',
          country: item.country || 'ไทย',
          programType: item.programType || 'THAI',
          remarks: item.remarks || '',
          isActive: true,
        };
        localList.push(newItem);
        addedCount++;
      }
    }
  }

  writeLocalJson('students.json', localList);

  // Sync to Google Sheets if available
  const gClient = getSheetsClient();
  if (gClient && (updatedCount > 0 || addedCount > 0)) {
    try {
      const rows = await gClient.getValues('Students!A2:A');
      if (rows && rows.length > 0) {
        const codeToRowMap = new Map<string, number>();
        rows.forEach((r, i) => {
          if (r[0]) codeToRowMap.set(r[0].trim(), i + 2);
        });

        for (const code of matchedCodes) {
          const rowNum = codeToRowMap.get(code);
          if (rowNum) {
            const student = localList.find((s) => s.studentCode === code);
            if (student) {
              await gClient.updateValues(`Students!A${rowNum}:O${rowNum}`, [[
                student.studentCode,
                student.title || '',
                student.firstName,
                student.lastName,
                student.fullName,
                String(student.yearLevel || 1),
                student.degree || '',
                student.department || '',
                student.major || '',
                student.studyStatus || 'ปกติ',
                student.faculty || '',
                student.phoneNumber || '',
                student.email || '',
                student.programType === 'ENGLISH' ? 'หลักสูตรภาคภาษาอังกฤษ (ENGLISH)' : 'หลักสูตรภาคภาษาไทย (THAI)',
                student.remarks || '',
              ]]);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Google Sheets batch update student failed:', err);
    }
  }

  return {
    updated: updatedCount,
    added: addedCount,
    total: localList.length,
    matchedCodes,
    notFoundCodes,
  };
}

export async function deleteStudents(
  studentCodes: string[]
): Promise<{ deletedCount: number; deletedCodes: string[]; remainingCount: number }> {
  const codesSet = new Set(studentCodes.map((c) => String(c).trim().toLowerCase()));
  const localList = readLocalJson<Student[]>('students.json', []);

  const originalCount = localList.length;
  const deletedCodes: string[] = [];

  const remainingList = localList.filter((s) => {
    const code = String(s.studentCode || '').trim().toLowerCase();
    if (codesSet.has(code)) {
      deletedCodes.push(s.studentCode);
      return false;
    }
    return true;
  });

  const deletedCount = originalCount - remainingList.length;
  writeLocalJson('students.json', remainingList);

  // If Google Sheets client is available, clear matching rows in Students sheet
  const gClient = getSheetsClient();
  if (gClient && deletedCodes.length > 0) {
    try {
      const rows = await gClient.getValues('Students!A2:A');
      if (rows && rows.length > 0) {
        for (let i = 0; i < rows.length; i++) {
          const rowCode = (rows[i][0] || '').trim().toLowerCase();
          if (codesSet.has(rowCode)) {
            const sheetRowNum = i + 2;
            const emptyRow = Array(15).fill('');
            await gClient.updateValues(`Students!A${sheetRowNum}:O${sheetRowNum}`, [emptyRow]);
          }
        }
      }
    } catch (err) {
      console.warn('Google Sheets delete student sync warning:', err);
    }
  }

  return {
    deletedCount,
    deletedCodes,
    remainingCount: remainingList.length,
  };
}

export async function deleteStudent(studentCode: string) {
  return deleteStudents([studentCode]);
}
