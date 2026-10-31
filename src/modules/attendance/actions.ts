'use server';

import { revalidatePath } from 'next/cache';
import { universityStore } from '@/shared/lib/store/university-store';
import { RecordAttendanceSchema } from '@/shared/lib/validations';

export async function checkInAttendanceAction(formData: FormData): Promise<void> {
  try {
    const raw = {
      tenantId: (formData.get('tenantId') as string) || undefined,
      sessionId: formData.get('sessionId') as string || 'default-session',
      enrollmentId: formData.get('enrollmentId') as string,
      status: formData.get('status') as any,
    };

    const validated = RecordAttendanceSchema.parse(raw);

    await universityStore.recordAttendance({
      enrollmentId: validated.enrollmentId,
      status: validated.status,
    });

    revalidatePath('/attendance');
  } catch (error: any) {
    console.error('Error recording attendance:', error?.message);
  }
}
