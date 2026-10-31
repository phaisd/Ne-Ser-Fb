'use server';

import { revalidatePath } from 'next/cache';
import { universityStore } from '@/shared/lib/store/university-store';
import { CreateMeetingBookingSchema } from '@/shared/lib/validations';

export async function bookMeetingRoomAction(formData: FormData): Promise<void> {
  try {
    const raw = {
      tenantId: (formData.get('tenantId') as string) || undefined,
      roomId: formData.get('roomId') as string,
      requesterId: (formData.get('requesterId') as string) || undefined,
      requesterName: formData.get('requesterName') as string,
      title: formData.get('title') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      remark: (formData.get('remark') as string) || undefined,
    };

    const validated = CreateMeetingBookingSchema.parse(raw);

    await universityStore.createMeetingBooking({
      tenantId: validated.tenantId,
      roomId: validated.roomId,
      requesterId: validated.requesterId,
      requesterName: validated.requesterName,
      title: validated.title,
      startTime: validated.startTime,
      endTime: validated.endTime,
      remark: validated.remark,
    });

    revalidatePath('/rooms');
    revalidatePath('/admin');
  } catch (error: any) {
    console.error('Error booking meeting room:', error?.message);
  }
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  try {
    const bookingId = formData.get('bookingId') as string;
    const reason = (formData.get('reason') as string) || 'ผู้ขอใช้ยกเลิกการจอง';

    await universityStore.cancelMeetingBooking(bookingId, reason);

    revalidatePath('/rooms');
    revalidatePath('/admin');
  } catch (error: any) {
    console.error('Error cancelling booking:', error?.message);
  }
}
