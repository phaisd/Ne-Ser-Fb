import { InstructorAccount, ArchivedInstructor } from '@/types';
import { readLocalJson, writeLocalJson, getSheetsClient } from '../storageHelper';

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

      // Remove matching rows from active Instructors sheet so no blank/duplicate rows remain
      const activeRows = await gClient.getValues('Instructors!A2:A');
      if (activeRows && activeRows.length > 0) {
        const zeroBasedIndicesToDelete: number[] = [];
        for (let i = 0; i < activeRows.length; i++) {
          const rowId = (activeRows[i][0] || '').trim().toLowerCase();
          if (idsSet.has(rowId)) {
            zeroBasedIndicesToDelete.push(i + 1); // +1 because A2 starts at 0-based row index 1
          }
        }
        if (zeroBasedIndicesToDelete.length > 0) {
          try {
            await gClient.deleteRows('Instructors', zeroBasedIndicesToDelete);
          } catch {
            for (const rowIdx of zeroBasedIndicesToDelete) {
              const sheetRowNum = rowIdx + 1;
              await gClient.updateValues(`Instructors!A${sheetRowNum}:L${sheetRowNum}`, [Array(12).fill('')]);
            }
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


