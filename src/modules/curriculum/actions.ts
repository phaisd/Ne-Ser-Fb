'use server';

import { revalidatePath } from 'next/cache';
import { universityStore } from '@/shared/lib/store/university-store';
import { CourseSchema } from '@/shared/lib/validations';
import { googleSheetsService } from '@/shared/lib/google-sheets/service';

export async function createCourseAction(formData: FormData): Promise<void> {
  try {
    const raw = {
      tenantId: (formData.get('tenantId') as string) || undefined,
      courseCode: formData.get('courseCode') as string,
      courseName: formData.get('courseName') as string,
      courseNameEn: (formData.get('courseNameEn') as string) || undefined,
      credits: formData.get('credits') || 3,
      section: (formData.get('section') as string) || '1',
      term: (formData.get('term') as string) || '1/2569',
      academicYear: (formData.get('academicYear') as string) || '2569',
      semester: formData.get('semester') || 1,
      room: (formData.get('room') as string) || undefined,
      dayOfWeek: formData.get('dayOfWeek') || 1,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      targetSessions: formData.get('targetSessions') || 16,
    };

    const validated = CourseSchema.parse(raw);

    const course = await universityStore.addCourse({
      tenantId: validated.tenantId,
      courseCode: validated.courseCode,
      courseName: validated.courseName,
      courseNameEn: validated.courseNameEn || null,
      credits: validated.credits,
      section: validated.section,
      term: validated.term,
      academicYear: validated.academicYear,
      semester: validated.semester,
      room: validated.room || null,
      dayOfWeek: validated.dayOfWeek,
      startTime: validated.startTime,
      endTime: validated.endTime,
      targetSessions: validated.targetSessions,
      calculationRules: { lateCountsAsFull: true, minPercent: 80.0 },
    });

    // Auto-sync row to Courses Master
    try {
      await googleSheetsService.appendRow(undefined, 'Courses_Master', [
        course.courseCode,
        course.tenantId,
        course.courseName,
        course.courseNameEn || '',
        course.credits,
        course.section,
        course.term,
        course.room || '',
        course.dayOfWeek || 1,
        `${course.startTime} - ${course.endTime}`,
      ]);
    } catch (e) {
      console.warn('Sync to courses sheet error:', e);
    }

    revalidatePath('/curriculum');
    revalidatePath('/timetable');
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
            tenantId: r[1] || 'a0000000-0000-0000-0000-000000000001',
            courseCode: r[0],
            courseName: r[2] || 'ชื่อวิชา',
            courseNameEn: r[3] || null,
            credits: parseInt(r[4], 10) || 3,
            section: r[5] || '1',
            term: r[6] || '1/2569',
            academicYear: '2569',
            semester: 1,
            room: r[7] || 'ห้องบรรยาย',
            dayOfWeek: parseInt(r[8], 10) || 1,
            startTime: '09:00',
            endTime: '12:00',
            targetSessions: 16,
            calculationRules: { lateCountsAsFull: true, minPercent: 80.0 },
          });
        } catch {
          // ignore duplicate
        }
      }
    }

    revalidatePath('/curriculum');
    revalidatePath('/timetable');
  } catch (err: any) {
    console.error('Error importing courses:', err?.message);
  }
}
