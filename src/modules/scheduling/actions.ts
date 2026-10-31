'use server';

import { revalidatePath } from 'next/cache';
import { universityStore } from '@/shared/lib/store/university-store';
import { CourseSchema } from '@/shared/lib/validations';

export async function addScheduleSlotAction(formData: FormData): Promise<void> {
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

    const clash = universityStore.checkCourseClash(
      validated.dayOfWeek,
      validated.startTime,
      validated.endTime,
      validated.room
    );

    if (clash.hasClash) {
      throw new Error(`ห้องเรียน "${validated.room}" มีตารางเรียนชนกับวิชา "${clash.conflictingCourse?.courseName}" ในช่วงเวลาดังกล่าว`);
    }

    await universityStore.addCourse({
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

    revalidatePath('/timetable');
  } catch (error: any) {
    console.error('Error adding course schedule slot:', error?.message);
  }
}
