'use server';

import { revalidatePath } from 'next/cache';
import { universityStore } from '@/shared/lib/store/university-store';
import { RecordAttendanceSchema } from '@/shared/lib/validations';

export async function checkInAttendanceAction(formData: FormData): Promise<void> {
  try {
    const raw = {
      sessionId: formData.get('sessionId') as string || 'default-session',
      studentId: formData.get('studentId') as string,
      status: formData.get('status') as any,
      checkInType: (formData.get('checkInType') as any) || 'MANUAL',
      notes: (formData.get('notes') as string) || undefined,
    };

    const validated = RecordAttendanceSchema.parse(raw);

    await universityStore.recordAttendance({
      studentCode: validated.studentId,
      courseCode: (formData.get('courseCode') as string) || 'CS201',
      status: validated.status,
    });

    revalidatePath('/attendance');
  } catch (error: any) {
    console.error('Error recording attendance:', error?.message);
  }
}
