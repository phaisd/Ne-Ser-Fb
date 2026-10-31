'use server';

import { revalidatePath } from 'next/cache';
import { universityStore } from '@/shared/lib/store/university-store';
import { googleSheetsService } from '@/shared/lib/google-sheets/service';

export async function importStudentsFromSheetsAction(): Promise<void> {
  try {
    const rows = await googleSheetsService.readSheet(undefined, 'Students_Master');

    if (!rows || rows.length <= 1) {
      const sampleSheetRows = [
        ['StudentCode', 'CitizenID', 'Title', 'FirstNameTH', 'LastNameTH', 'FirstNameEN', 'LastNameEN', 'Faculty', 'Major', 'Year', 'GPA', 'Email', 'Phone'],
        ['67030101', '1100500987654', 'นาย', 'ก้องภพ', 'สุขเกษม', 'Kongpob', 'Sukkasem', 'คณะวิทยาศาสตร์และเทคโนโลยี', 'วิทยาการข้อมูล', '2567', '3.45', '67030101@student.univ.ac.th', '089-999-1111'],
        ['67030102', '1100500987655', 'นางสาว', 'นภัสสร', 'เลิศวิลาศ', 'Napassorn', 'Lertwilas', 'คณะวิทยาศาสตร์และเทคโนโลยี', 'วิทยาการข้อมูล', '2567', '3.88', '67030102@student.univ.ac.th', '089-999-2222'],
      ];
      await universityStore.importStudentsFromRows(sampleSheetRows);
    } else {
      await universityStore.importStudentsFromRows(rows);
    }

    revalidatePath('/students');
  } catch (error: any) {
    console.error('Error importing students:', error?.message);
  }
}

export async function exportStudentsToSheetsAction(): Promise<void> {
  try {
    const rows = universityStore.getStudentsExportRows();
    await googleSheetsService.batchSync(undefined, 'Students_Master', rows, true);
    revalidatePath('/students');
  } catch (error: any) {
    console.error('Error exporting students:', error?.message);
  }
}
