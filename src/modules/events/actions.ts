'use server';

import { revalidatePath } from 'next/cache';
import { universityStore } from '@/shared/lib/store/university-store';

export async function registerEventAction(formData: FormData): Promise<void> {
  try {
    const eventId = formData.get('eventId') as string;
    const studentCode = formData.get('studentCode') as string;

    await universityStore.registerEvent(eventId, studentCode);

    revalidatePath('/events');
  } catch (error: any) {
    console.error('Error registering event:', error?.message);
  }
}

export async function checkInAndIssueCertAction(formData: FormData): Promise<void> {
  try {
    const participationId = formData.get('participationId') as string;

    await universityStore.checkInAndIssueCert(participationId);

    revalidatePath('/events');
  } catch (error: any) {
    console.error('Error issuing certificate:', error?.message);
  }
}
