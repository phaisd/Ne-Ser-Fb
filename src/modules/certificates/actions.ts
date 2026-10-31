'use server';

import { revalidatePath } from 'next/cache';
import { universityStore } from '@/shared/lib/store/university-store';
import { CreateCertificateRequestSchema, UpdateCertificateStatusSchema } from '@/shared/lib/validations';

export async function submitCertificateRequestAction(formData: FormData): Promise<void> {
  try {
    const raw = {
      tenantId: (formData.get('tenantId') as string) || undefined,
      userId: (formData.get('userId') as string) || undefined,
      certificateTypeId: formData.get('certificateTypeId') as string,
      studentCode: formData.get('studentCode') as string,
      requesterName: formData.get('requesterName') as string,
      note: formData.get('note') as string,
    };

    const validated = CreateCertificateRequestSchema.parse(raw);

    await universityStore.createCertificateRequest({
      tenantId: validated.tenantId,
      userId: validated.userId,
      certificateTypeId: validated.certificateTypeId,
      studentCode: validated.studentCode,
      requesterName: validated.requesterName,
      note: validated.note,
    });

    revalidatePath('/certificates');
    revalidatePath('/admin/requests');
  } catch (error: any) {
    console.error('Error submitting certificate request:', error?.message);
  }
}

export async function updateCertificateStatusAction(formData: FormData): Promise<void> {
  try {
    const raw = {
      requestId: formData.get('requestId') as string,
      status: formData.get('status') as any,
      reason: (formData.get('reason') as string) || undefined,
    };

    const validated = UpdateCertificateStatusSchema.parse(raw);

    await universityStore.updateCertificateRequestStatus(
      validated.requestId,
      validated.status,
      validated.reason
    );

    revalidatePath('/certificates');
    revalidatePath('/admin/requests');
  } catch (error: any) {
    console.error('Error updating certificate status:', error?.message);
  }
}
