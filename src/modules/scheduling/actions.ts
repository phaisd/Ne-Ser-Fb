'use server';

import { revalidatePath } from 'next/cache';
import { universityStore } from '@/shared/lib/store/university-store';
import { CreateScheduleSlotSchema } from '@/shared/lib/validations';

export async function addScheduleSlotAction(formData: FormData): Promise<void> {
  try {
    const raw = {
      tenantId: (formData.get('tenantId') as string) || 'default',
      sectionId: (formData.get('sectionId') as string) || 'sec-01',
      dayOfWeek: formData.get('dayOfWeek') as any,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      roomCode: formData.get('roomCode') as string,
      instructorName: formData.get('instructorName') as string,
    };

    const courseCode = (formData.get('courseCode') as string) || 'CS201';
    const courseName = (formData.get('courseName') as string) || 'วิชาเรียน';

    const validated = CreateScheduleSlotSchema.parse(raw);

    await universityStore.addScheduleSlot({
      tenantId: validated.tenantId,
      courseCode,
      courseName,
      sectionNumber: '1',
      instructorName: validated.instructorName,
      dayOfWeek: validated.dayOfWeek,
      startTime: validated.startTime,
      endTime: validated.endTime,
      roomCode: validated.roomCode,
      building: 'อาคารวิชาการ',
    });

    revalidatePath('/timetable');
  } catch (error: any) {
    console.error('Error adding schedule slot:', error?.message);
  }
}
