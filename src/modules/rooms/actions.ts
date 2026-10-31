'use server';

import { revalidatePath } from 'next/cache';
import { universityStore } from '@/shared/lib/store/university-store';
import { CreateBookingSchema } from '@/shared/lib/validations';

export async function bookMeetingRoomAction(formData: FormData): Promise<void> {
  try {
    const raw = {
      tenantId: (formData.get('tenantId') as string) || 'default',
      roomId: formData.get('roomId') as string,
      bookedBy: formData.get('bookedBy') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      attendeesCount: formData.get('attendeesCount') || 1,
      date: formData.get('date') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
    };

    const validated = CreateBookingSchema.parse(raw);

    await universityStore.createRoomBooking(validated);

    revalidatePath('/rooms');
    revalidatePath('/admin');
  } catch (error: any) {
    console.error('Error booking room:', error?.message);
  }
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  try {
    const bookingId = formData.get('bookingId') as string;
    const reason = (formData.get('reason') as string) || 'ยกเลิกโดยผู้ใช้งาน';

    await universityStore.cancelRoomBooking(bookingId, reason);

    revalidatePath('/rooms');
    revalidatePath('/admin');
  } catch (error: any) {
    console.error('Error cancelling booking:', error?.message);
  }
}
