'use server';

import { revalidatePath } from 'next/cache';
import { universityStore } from '@/shared/lib/store/university-store';
import { RegisterEventSchema } from '@/shared/lib/validations';

export async function registerEventAction(formData: FormData): Promise<void> {
  try {
    const raw = {
      tenantId: (formData.get('tenantId') as string) || undefined,
      eventId: formData.get('eventId') as string,
      participantName: formData.get('participantName') as string,
      groupNumber: formData.get('groupNumber') || 1,
      groupName: (formData.get('groupName') as string) || 'กลุ่มเจริญสติปัญญา ๑',
    };

    const validated = RegisterEventSchema.parse(raw);

    await universityStore.registerEvent({
      tenantId: validated.tenantId,
      eventId: validated.eventId,
      participantName: validated.participantName,
      groupNumber: validated.groupNumber,
      groupName: validated.groupName,
    });

    revalidatePath('/events');
  } catch (error: any) {
    console.error('Error registering for event:', error?.message);
  }
}

export async function checkInEventAction(formData: FormData): Promise<void> {
  try {
    const registrationId = formData.get('registrationId') as string;
    await universityStore.checkInEventRegistration(registrationId);
    revalidatePath('/events');
  } catch (error: any) {
    console.error('Error checking in event:', error?.message);
  }
}
