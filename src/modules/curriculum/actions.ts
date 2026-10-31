'use server';

import { revalidatePath } from 'next/cache';
import { universityStore } from '@/shared/lib/store/university-store';
import { CreateCourseSchema } from '@/shared/lib/validations';
import { googleSheetsService } from '@/shared/lib/google-sheets/service';

export async function createCourseAction(formData: FormData): Promise<void> {
  try {
    const raw = {
      tenantId: (formData.get('tenantId') as string) || 'default',
      code: formData.get('code') as string,
      nameTh: formData.get('nameTh') as string,
      nameEn: formData.get('nameEn') as string,
      credits: formData.get('credits') || 3,
      lectureHours: formData.get('lectureHours') || 3,
      labHours: formData.get('labHours') || 0,
      department: formData.get('department') as string,
    };

    const validated = CreateCourseSchema.parse(raw);

    const course = await universityStore.addCourse(validated);

    // Auto-sync row to Courses Master
    try {
      await googleSheetsService.appendRow(undefined, 'Courses_Master', [
        course.code,
        course.tenantId,
        course.nameTh,
        course.nameEn,
        course.credits,
        course.lectureHours,
        course.labHours,
        course.department,
      ]);
    } catch (e) {
      console.warn('Sync to courses sheet error:', e);
    }

    revalidatePath('/curriculum');
  } catch (error: any) {
    console.error('Error creating course:', error?.message);
  }
}

export async function importCoursesFromSheetsAction(): Promise<void> {
  try {
    const rows = await googleSheetsService.readSheet(undefined, 'Courses_Master');
    if (!rows || rows.length <= 1) {
      return;
    }

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (r[0]) {
        try {
          await universityStore.addCourse({
            tenantId: r[1] || 'default',
            code: r[0],
            nameTh: r[2] || 'ชื่อวิชาภาษาไทย',
            nameEn: r[3] || 'Course Name EN',
            credits: parseInt(r[4], 10) || 3,
            lectureHours: parseInt(r[5], 10) || 3,
            labHours: parseInt(r[6], 10) || 0,
            department: r[7] || 'ภาควิชาคอมพิวเตอร์',
          });
        } catch {
          // ignore duplicate
        }
      }
    }

    revalidatePath('/curriculum');
  } catch (err: any) {
    console.error('Error importing courses:', err?.message);
  }
}
